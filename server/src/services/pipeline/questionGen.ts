import { llmClient } from '../llm/client.js';
import { Question, QuestionCategory, Requirement } from '../../../../shared/types.js';

interface CategoryContext {
  category: QuestionCategory;
  requirements: Requirement[];
  allRequirements: Requirement[];
  roleTitle: string;
  seniority: string;
  companyName: string;
  hiringInsights?: string;
  startIdNumber: number;
}

const CATEGORY_PROMPTS: Record<QuestionCategory, string> = {
  technical: `You are an expert technical interviewer assessing hard technical competencies.
Generate in-depth technical interview questions directly testing the candidate against their stated requirements.
Questions should assess practical implementation details, debugging, performance characteristics, and real-world trade-offs.`,

  behavioural: `You are a behavioral hiring manager assessing collaboration, ownership, and emotional intelligence.
Generate STAR-method (Situation, Task, Action, Result) scenario questions directly mapped to the candidate's stated requirements (e.g. mentorship, conflict resolution, dealing with ambiguity, cross-functional delivery).`,

  'system-design': `You are a Principal Systems Architect conducting a system design interview.
Generate system architecture and scalability questions relevant to the role's seniority and domain. Focus on component breakdown, data modeling, reliability, bottlenecks, and scaling trade-offs.`,

  'company-fit': `You are an executive interviewer assessing mission alignment, company values, and domain acumen.
Generate questions testing the candidate's understanding of the company's product domain, business challenges, and cultural synergy.`,
};

export async function generateQuestionsForCategory(context: CategoryContext): Promise<Question[]> {
  const { category, requirements, allRequirements, roleTitle, seniority, companyName, hiringInsights, startIdNumber } =
    context;

  // Filter requirements that best fit this category, or fall back to general requirements
  const targetReqs = requirements.length > 0 ? requirements : allRequirements;

  const reqsText = targetReqs.map((r) => `- [${r.id}] (${r.priority}): ${r.text}`).join('\n');

  const systemPrompt = `${CATEGORY_PROMPTS[category]}

CRITICAL INSTRUCTIONS:
1. Every generated question MUST reference one or more requirement IDs from the provided list in its "requirement_ids" array.
2. "difficulty" MUST be an integer: 1 (Fundamental), 2 (Intermediate/Applied), or 3 (Advanced/Complex).
3. "prompt" must be a clearly phrased, realistic interview question.
4. "answer_outline" must be a bulleted rubric detailing what a great answer must cover.
5. Generate 2 to 3 targeted questions for this category.

Respond with strictly valid JSON:
{
  "questions": [
    {
      "requirement_ids": ["r1"],
      "prompt": string,
      "answer_outline": string,
      "difficulty": 1 | 2 | 3
    }
  ]
}`;

  try {
    const userPrompt = `ROLE: ${seniority} ${roleTitle} at ${companyName || 'the company'}
HIRING CONTEXT: ${hiringInsights || 'Standard hiring process.'}

TARGET REQUIREMENTS TO ASSESS:
${reqsText}

Generate high-quality interview questions strictly for category: "${category}":`;

    const raw = await llmClient.complete(userPrompt, systemPrompt, {
      temperature: 0.3,
      jsonMode: true,
    });

    const parsed = JSON.parse(llmClient.cleanJsonResponse(raw));
    const rawQuestions: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];

    let currentId = startIdNumber;
    const questions: Question[] = [];

    for (const q of rawQuestions) {
      // Validate requirement_ids
      const validReqIds = (Array.isArray(q.requirement_ids) ? q.requirement_ids : [])
        .map(String)
        .filter((id: string) => allRequirements.some((r) => r.id === id));

      // Fallback if model returned invalid or empty requirement_ids
      const finalReqIds = validReqIds.length > 0
        ? validReqIds
        : [targetReqs[0]?.id || allRequirements[0]?.id || 'r1'];

      const difficulty = [1, 2, 3].includes(Number(q.difficulty)) ? Number(q.difficulty) : 2;

      questions.push({
        id: `q${currentId++}`,
        requirement_ids: finalReqIds,
        category,
        prompt: String(q.prompt || '').trim(),
        answer_outline: String(q.answer_outline || '').trim(),
        difficulty,
      });
    }

    if (questions.length > 0) {
      return questions;
    }
    throw new Error('No questions returned by model');
  } catch {
    // Deterministic fallback generator
    return fallbackGenerateCategoryQuestions(context);
  }
}

/**
 * Deterministic fallback question generator
 */
export function fallbackGenerateCategoryQuestions(context: CategoryContext): Question[] {
  const { category, requirements, allRequirements, roleTitle, startIdNumber } = context;
  const targetReqs = requirements.length > 0 ? requirements : allRequirements;
  const questions: Question[] = [];
  let currentId = startIdNumber;

  if (category === 'technical') {
    for (const r of targetReqs.slice(0, 3)) {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [r.id],
        category: 'technical',
        prompt: `How have you applied ${r.text} in a production environment, and what architectural trade-offs did you make?`,
        answer_outline: `- Specific architectural context and constraints\n- Core implementation mechanics and libraries\n- Performance, scalability, and error-handling considerations`,
        difficulty: r.priority === 'must' ? 3 : 2,
      });
    }
  } else if (category === 'behavioural') {
    const behReq = targetReqs.find((r) => r.kind === 'behavioural') || targetReqs[0];
    questions.push({
      id: `q${currentId++}`,
      requirement_ids: [behReq.id],
      category: 'behavioural',
      prompt: `Tell me about a time when you had to manage conflicting technical priorities or handle a production setback related to ${behReq.text}.`,
      answer_outline: `- Situation & Task: Clear project context and conflicting stakeholder or team priorities\n- Action taken: Personal ownership, constructive communication, and compromise\n- Result: Measured outcome and post-incident takeaways`,
      difficulty: 2,
    });
  } else if (category === 'system-design') {
    const primaryReq = targetReqs[0] || allRequirements[0];
    questions.push({
      id: `q${currentId++}`,
      requirement_ids: [primaryReq.id],
      category: 'system-design',
      prompt: `Design a high-throughput, fault-tolerant service supporting the core workflows required for a ${roleTitle}. How do you partition data and handle failover?`,
      answer_outline: `- High-level architecture: API gateway, microservices, asynchronous queues\n- Storage & Partitioning: Read/write patterns, replication, sharding\n- Resilience: Circuit breakers, rate limiters, monitoring and telemetry`,
      difficulty: 3,
    });
  } else {
    // company-fit
    const domainReq = targetReqs.find((r) => r.kind === 'domain') || targetReqs[0];
    questions.push({
      id: `q${currentId++}`,
      requirement_ids: [domainReq.id],
      category: 'company-fit',
      prompt: `What excites you about our engineering problems, and how does your background in ${domainReq.text} prepare you to contribute from day one?`,
      answer_outline: `- Articulation of company product and value proposition\n- Concrete examples aligning past experience with company needs\n- Genuine intellectual curiosity and cultural alignment`,
      difficulty: 1,
    });
  }

  return questions;
}
