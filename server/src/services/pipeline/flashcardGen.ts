import { llmClient } from '../llm/client.js';
import { Flashcard, Requirement } from '../../shared/types.js';

export async function generateFlashcards(
  requirements: Requirement[],
  roleTitle: string
): Promise<Flashcard[]> {
  const reqsText = requirements
    .slice(0, 8)
    .map((r) => `- [${r.id}] ${r.text}`)
    .join('\n');

  const systemPrompt = `You are an interview flashcard author preparing rapid-fire study cards for a candidate interviewing for ${roleTitle}.
Create high-yield flashcards covering key technical concepts, core mechanics, and behavioral heuristics.

CRITICAL INSTRUCTIONS:
1. Each card MUST have:
   - "front": A concise, focused question, prompt, or architectural challenge.
   - "back": A crisp, high-yield explanation or bullet points covering key facts, gotchas, or trade-offs.
   - "requirement_ids": Array referencing the associated requirement IDs from the input list.
2. Generate 4 to 8 flashcards.

Respond with strictly valid JSON:
{
  "flashcards": [
    {
      "front": string,
      "back": string,
      "requirement_ids": ["r1"]
    }
  ]
}`;

  try {
    const prompt = `REQUIREMENTS:
${reqsText}

Generate interview study flashcards:`;

    const raw = await llmClient.complete(prompt, systemPrompt, {
      temperature: 0.3,
      jsonMode: true,
    });

    const parsed = JSON.parse(llmClient.cleanJsonResponse(raw));
    const rawCards: any[] = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];

    const cards: Flashcard[] = [];
    let count = 1;

    for (const card of rawCards) {
      const validReqIds = (Array.isArray(card.requirement_ids) ? card.requirement_ids : [])
        .map(String)
        .filter((id: string) => requirements.some((r) => r.id === id));

      cards.push({
        id: `f${count++}`,
        front: String(card.front || '').trim(),
        back: String(card.back || '').trim(),
        requirement_ids: validReqIds.length > 0 ? validReqIds : [requirements[0]?.id || 'r1'],
      });
    }

    if (cards.length > 0) return cards;
    throw new Error('No flashcards generated');
  } catch {
    return fallbackGenerateFlashcards(requirements);
  }
}

/**
 * Deterministic fallback flashcard generator
 */
export function fallbackGenerateFlashcards(requirements: Requirement[]): Flashcard[] {
  const cards: Flashcard[] = [];
  let count = 1;

  for (const r of requirements.slice(0, 6)) {
    cards.push({
      id: `f${count++}`,
      front: `Core mechanics & key gotchas of: ${r.text}`,
      back: `Understand internal lifecycle, state management or scaling bottlenecks, and failure modes when utilizing ${r.text} in production.`,
      requirement_ids: [r.id],
    });
  }

  if (cards.length === 0) {
    cards.push({
      id: 'f1',
      front: 'How to structure a production system design response',
      back: 'Clarify requirements & constraints -> High-level architecture -> Deep dive data models & APIs -> Identify bottlenecks & resilience patterns.',
      requirement_ids: ['r1'],
    });
  }

  return cards;
}
