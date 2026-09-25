import { llmClient } from '../llm/client.js';
import { RoleBreakdown, RoleBreakdownSchema, Requirement } from '../../shared/types.js';

const EXTRACTOR_SYSTEM_PROMPT = `You are a precise technical recruiter and job specification parser.
Extract the structured role breakdown from the provided job description.

CRITICAL INSTRUCTIONS:
1. DO NOT INVENT or HALLUCINATE requirements that are not in the job description. If the job description is short, sparse, or a stub, extract ONLY what is stated.
2. Distinguish "must" vs "nice" strictly based on wording:
   - "must": Words like "required", "requirements", "must have", "minimum", "experience with X", "need", core responsibilities.
   - "nice": Words like "bonus", "nice to have", "plus", "preferred", "optional", "good to have".
3. Categorize kind strictly:
   - "technical": Programming languages, frameworks, databases, tools, system architectures.
   - "behavioural": Mentorship, communication, leadership, team collaboration, culture.
   - "domain": Specific industry knowledge (fintech, healthcare, e-commerce, compliance, etc.).
4. Assign stable, sequential IDs: "r1", "r2", "r3", etc.
5. Provide a realistic title and seniority level ("Junior", "Mid", "Senior", "Staff", "Lead", "Principal", or "Unspecified").

Output MUST be a valid JSON object matching this schema:
{
  "title": string,
  "seniority": string,
  "responsibilities": string[],
  "requirements": [
    {
      "id": string,
      "text": string,
      "kind": "technical" | "behavioural" | "domain",
      "priority": "must" | "nice"
    }
  ]
}`;

export async function extractRoleBreakdown(jdText: string): Promise<RoleBreakdown> {
  const trimmed = jdText.trim();

  // If thin stub (< 100 chars), handle directly to ensure no hallucination
  const isStub = trimmed.length < 120;

  try {
    const prompt = `JOB DESCRIPTION TEXT:
<job_description>
${trimmed}
</job_description>

${isStub ? 'NOTE: This job description is very brief. Extract only the explicit requirements without inventing anything.' : ''}

Respond with strictly JSON:`;

    const rawResponse = await llmClient.complete(prompt, EXTRACTOR_SYSTEM_PROMPT, {
      temperature: 0.1,
      jsonMode: true,
    });

    const cleaned = llmClient.cleanJsonResponse(rawResponse);
    const parsed = JSON.parse(cleaned);

    // Ensure IDs are sequential and kinds/priorities are normalized
    const sanitizedRequirements: Requirement[] = (parsed.requirements || []).map((r: any, idx: number) => ({
      id: `r${idx + 1}`,
      text: String(r.text || '').trim(),
      kind: ['technical', 'behavioural', 'domain'].includes(r.kind) ? r.kind : 'technical',
      priority: r.priority === 'nice' ? 'nice' : 'must',
    }));

    const result: RoleBreakdown = {
      title: parsed.title || 'Software Engineer',
      seniority: parsed.seniority || (trimmed.toLowerCase().includes('senior') ? 'Senior' : 'Mid-Level'),
      responsibilities: Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0
        ? parsed.responsibilities.map(String)
        : ['Execute core engineering deliverables as outlined in the posting'],
      requirements: sanitizedRequirements.length > 0 ? sanitizedRequirements : [
        {
          id: 'r1',
          text: isStub ? trimmed : 'General software engineering capabilities',
          kind: 'technical',
          priority: 'must',
        },
      ],
    };

    return RoleBreakdownSchema.parse(result);
  } catch (err) {
    // Deterministic fallback if offline or LLM fails
    return fallbackExtractRole(trimmed);
  }
}

/**
 * Deterministic fallback extractor using regex and line heuristics
 */
export function fallbackExtractRole(jdText: string): RoleBreakdown {
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 80) || 'Software Engineer';
  const seniority = /\bsenior\b/i.test(jdText)
    ? 'Senior'
    : /\blead\b/i.test(jdText)
    ? 'Lead'
    : /\bjunior\b/i.test(jdText)
    ? 'Junior'
    : 'Mid-Level';

  const requirements: Requirement[] = [];
  let reqCount = 1;

  for (const line of lines) {
    const isBullet = /^[-*•\d.]+\s+/.test(line);
    if (!isBullet && line.length > 100) continue;

    const cleanLine = line.replace(/^[-*•\d.]+\s+/, '').trim();
    if (cleanLine.length < 10) continue;

    const isNice = /\b(nice to have|plus|bonus|preferred|ideal|optional)\b/i.test(cleanLine);
    const isBehavioural = /\b(communication|mentor|collaborat|team|leadership|culture|stakeholder)\b/i.test(cleanLine);
    const isDomain = /\b(fintech|healthcare|compliance|e-commerce|payments|banking|security)\b/i.test(cleanLine);

    requirements.push({
      id: `r${reqCount++}`,
      text: cleanLine,
      kind: isBehavioural ? 'behavioural' : isDomain ? 'domain' : 'technical',
      priority: isNice ? 'nice' : 'must',
    });

    if (requirements.length >= 10) break;
  }

  if (requirements.length === 0) {
    requirements.push({
      id: 'r1',
      text: jdText.slice(0, 100) || 'Core engineering competency',
      kind: 'technical',
      priority: 'must',
    });
  }

  return {
    title,
    seniority,
    responsibilities: [
      'Design, build, and maintain efficient, reusable, and reliable code.',
      'Collaborate with cross-functional teams to define and ship features.',
    ],
    requirements,
  };
}
