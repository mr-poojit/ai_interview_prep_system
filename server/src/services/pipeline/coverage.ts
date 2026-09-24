import { Question, Requirement, Coverage } from '../../../../shared/types.js';
import { generateQuestionsForCategory } from './questionGen.js';

export interface CoverageGapResult {
  coveredIds: Set<string>;
  uncoveredIds: string[];
  uncoveredMustIds: string[];
}

/**
 * Pure deterministic coverage calculation.
 * Compares requirements against question bank. Must NOT be handed to an LLM.
 */
export function calculateCoverageGaps(
  requirements: Requirement[],
  questions: Question[]
): CoverageGapResult {
  const coveredIds = new Set<string>();

  for (const q of questions) {
    if (Array.isArray(q.requirement_ids)) {
      for (const id of q.requirement_ids) {
        coveredIds.add(id);
      }
    }
  }

  const uncoveredIds = requirements
    .filter((r) => !coveredIds.has(r.id))
    .map((r) => r.id);

  const uncoveredMustIds = requirements
    .filter((r) => r.priority === 'must' && !coveredIds.has(r.id))
    .map((r) => r.id);

  return {
    coveredIds,
    uncoveredIds,
    uncoveredMustIds,
  };
}

/**
 * Executes the required second pass loop:
 * Detects uncovered requirements deterministically, acts on them by generating
 * targeted questions, and verifies final coverage status.
 */
export async function executeCoveragePasses(
  requirements: Requirement[],
  initialQuestions: Question[],
  context: {
    roleTitle: string;
    seniority: string;
    companyName: string;
    hiringInsights?: string;
  }
): Promise<{ questions: Question[]; coverage: Coverage }> {
  let questions = [...initialQuestions];
  let passes = 1;

  // Pass 1 Check
  const pass1Gaps = calculateCoverageGaps(requirements, questions);

  // If all must-haves and nice-to-haves are covered, we are done in 1 pass
  if (pass1Gaps.uncoveredMustIds.length === 0 && pass1Gaps.uncoveredIds.length === 0) {
    return {
      questions,
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
      },
    };
  }

  // Second Pass: Act on the gaps
  passes = 2;
  const missingReqs = requirements.filter((r) => pass1Gaps.uncoveredIds.includes(r.id));
  let nextIdNumber = Math.max(...questions.map((q) => parseInt(q.id.replace(/\D/g, '') || '0', 10)), 0) + 1;

  for (const req of missingReqs) {
    // Map requirement kind to matching question category
    const category =
      req.kind === 'behavioural'
        ? 'behavioural'
        : req.kind === 'domain'
        ? 'company-fit'
        : 'technical';

    const targetedQuestions = await generateQuestionsForCategory({
      category,
      requirements: [req],
      allRequirements: requirements,
      roleTitle: context.roleTitle,
      seniority: context.seniority,
      companyName: context.companyName,
      hiringInsights: context.hiringInsights,
      startIdNumber: nextIdNumber,
    });

    for (const tq of targetedQuestions) {
      // Guarantee the target requirement is mapped
      if (!tq.requirement_ids.includes(req.id)) {
        tq.requirement_ids.push(req.id);
      }
      questions.push(tq);
      nextIdNumber++;
    }
  }

  // Final deterministic re-check after Pass 2
  const finalGaps = calculateCoverageGaps(requirements, questions);

  return {
    questions,
    coverage: {
      uncovered_requirement_ids: finalGaps.uncoveredIds,
      passes: 2,
    },
  };
}
