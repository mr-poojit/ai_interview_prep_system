import {
  KitStructure,
  KitStructureSchema,
  PipelineProgress,
} from '../../shared/types.js';
import { extractRoleBreakdown } from './extractor.js';
import { crawlCompanySite } from '../crawler.js';
import { searchPublicInterviewDiscussions } from '../discussionSearch.js';
import { generateCompanyBrief } from './companyBriefGen.js';
import { generateQuestionsForCategory } from './questionGen.js';
import { executeCoveragePasses } from './coverage.js';
import { generateFlashcards } from './flashcardGen.js';
import { allocateSchedule } from './scheduler.js';

export interface GenerateKitOptions {
  jd: string;
  company_url: string;
  days: number;
  onProgress?: (progress: PipelineProgress) => void;
}

/**
 * Master Pipeline Orchestrator.
 * Executes the deliberate sequence of research, extraction, generation,
 * coverage verification (with Pass 2 loop), and deterministic scheduling.
 */
export async function generatePrepKit(options: GenerateKitOptions): Promise<KitStructure> {
  const { jd, company_url, days, onProgress } = options;
  const notify = (stage: PipelineProgress['stage'], message: string, step: number, details?: Record<string, unknown>) => {
    onProgress?.({
      stage,
      message,
      stepNumber: step,
      totalSteps: 8,
      details,
    });
  };

  // STEP 1: Extract requirements from pasted job description
  notify('extracting_requirements', 'Extracting structured role requirements and priorities from job description...', 1);
  const role = await extractRoleBreakdown(jd);

  // STEP 2: Crawl company website, discover hiring & about pages
  notify('crawling_company', `Crawling company site at ${company_url} to discover hiring culture...`, 2);
  const crawlResult = await crawlCompanySite(company_url);

  // Determine company name from URL or page title
  let inferredCompany = '';
  try {
    const parsed = new URL(company_url);
    inferredCompany = parsed.hostname.replace(/^www\./, '').split('.')[0];
    if (inferredCompany.length > 1) {
      inferredCompany = inferredCompany.charAt(0).toUpperCase() + inferredCompany.slice(1);
    }
  } catch {
    inferredCompany = 'Target Company';
  }

  // STEP 3: Search public interview discussions
  notify('searching_discussions', `Searching public engineering discussions for ${inferredCompany} interview process...`, 3);
  const discussions = await searchPublicInterviewDiscussions(inferredCompany);
  const hiringInsights = discussions.snippets.join(' ');

  // STEP 4: Generate Company Brief
  notify('generating_brief', 'Synthesizing verified company intelligence brief...', 4);
  const companyBrief = await generateCompanyBrief(
    company_url,
    crawlResult.pages,
    crawlResult.pagesUsed,
    crawlResult.error
  );

  // STEP 5: Category-by-Category Question Generation (First Pass)
  notify('generating_questions', 'Generating targeted questions category by category...', 5);
  const categories = ['technical', 'behavioural', 'system-design', 'company-fit'] as const;
  let initialQuestions: any[] = [];
  let currentQId = 1;

  for (const category of categories) {
    const matchingReqs = role.requirements.filter((r) => {
      if (category === 'technical') return r.kind === 'technical';
      if (category === 'behavioural') return r.kind === 'behavioural';
      if (category === 'company-fit') return r.kind === 'domain';
      return true; // system-design can pull from broad requirements
    });

    const categoryQuestions = await generateQuestionsForCategory({
      category,
      requirements: matchingReqs,
      allRequirements: role.requirements,
      roleTitle: role.title,
      seniority: role.seniority,
      companyName: inferredCompany,
      hiringInsights,
      startIdNumber: currentQId,
    });

    initialQuestions.push(...categoryQuestions);
    currentQId += categoryQuestions.length;
  }

  // STEP 6: Deterministic Coverage Check & The Second Pass
  notify('checking_coverage', 'Executing deterministic coverage check and closing gaps in Second Pass...', 6);
  const { questions: finalQuestions, coverage } = await executeCoveragePasses(
    role.requirements,
    initialQuestions,
    {
      roleTitle: role.title,
      seniority: role.seniority,
      companyName: inferredCompany,
      hiringInsights,
    }
  );

  // STEP 7: Generate Flashcards
  notify('generating_flashcards', 'Synthesizing rapid-fire flashcards from core competencies...', 7);
  const flashcards = await generateFlashcards(role.requirements, role.title);

  // STEP 8: Deterministic Schedule Allocation
  notify('allocating_schedule', `Distributing prep syllabus across ${days} days...`, 8);
  const schedule = allocateSchedule(days, finalQuestions, role.requirements);

  // Assemble full kit according to Appendix A
  const kit: KitStructure = {
    source: {
      company: inferredCompany,
      company_url: company_url,
      role: role.title,
      location: 'Remote / Unspecified',
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: crawlResult.pagesUsed,
    },
    company_brief: companyBrief,
    role,
    questions: finalQuestions,
    flashcards,
    schedule,
    coverage,
  };

  notify('completed', 'Interview preparation kit generated successfully!', 8);

  // Strict validation against Appendix A schema
  return KitStructureSchema.parse(kit);
}
