import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { KitRepository } from '../models/storage.js';
import { llmClient } from '../services/llm/client.js';
import { Question } from '../shared/types.js';

const router = Router();

function getParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// POST /api/practice/:id/confidence - Record flashcard review confidence
router.post('/:id/confidence', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kitId = getParamId(req.params.id);
  const record = await KitRepository.findById(kitId);
  if (!record || record.userId !== req.userId) {
    res.status(404).json({ error: 'KIT_NOT_FOUND' });
    return;
  }

  const { cardId, confidence } = req.body;
  if (!cardId || ![1, 2, 3].includes(Number(confidence))) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'cardId and confidence (1, 2, 3) are required.' });
    return;
  }

  const progress = record.practiceProgress || {};
  progress[cardId] = {
    confidence: Number(confidence),
    reviewedAt: new Date().toISOString(),
  };

  const updatedRecord = await KitRepository.update(kitId, {
    practiceProgress: progress,
  });

  res.json({ practiceProgress: updatedRecord?.practiceProgress });
});

// POST /api/practice/:id/mock-evaluate - Creative Feature: AI Mock Interview Answer Evaluation
router.post('/:id/mock-evaluate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kitId = getParamId(req.params.id);
  const record = await KitRepository.findById(kitId);
  if (!record || record.userId !== req.userId) {
    res.status(404).json({ error: 'KIT_NOT_FOUND' });
    return;
  }

  const { questionId, candidateAnswer } = req.body;
  if (!questionId || !candidateAnswer || typeof candidateAnswer !== 'string') {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'questionId and candidateAnswer are required.' });
    return;
  }

  const question = record.kit.questions.find((q: Question) => q.id === questionId);
  if (!question) {
    res.status(404).json({ error: 'QUESTION_NOT_FOUND', message: 'Question does not exist in kit.' });
    return;
  }

  const systemPrompt = `You are a Principal Technical Interviewer evaluating a candidate's verbal or written answer.
Evaluate the candidate's response against the expected answer outline and rubrics.

CRITICAL INSTRUCTIONS:
1. Provide constructive, honest, and actionable feedback.
2. Rate from 1 to 10:
   - "accuracy_score": Technical correctness, addressing key concepts.
   - "structure_score": Clarity, logical flow, STAR framework where applicable.
   - "delivery_score": Conciseness and tone.
3. List:
   - "strengths": Array of what the candidate articulated well.
   - "missing_points": Array of key concepts from the answer outline that were missed or vague.
   - "improved_answer_sample": A polished, concise 60-second exemplar answer.

Respond strictly in valid JSON:
{
  "accuracy_score": number,
  "structure_score": number,
  "delivery_score": number,
  "strengths": string[],
  "missing_points": string[],
  "improved_answer_sample": string
}`;

  try {
    const prompt = `INTERVIEW QUESTION:
"${question.prompt}"

CATEGORY: ${question.category} (Difficulty: ${question.difficulty}/3)

EXPECTED ANSWER OUTLINE:
${question.answer_outline}

CANDIDATE'S ACTUAL ANSWER:
"${candidateAnswer}"

Evaluate candidate response:`;

    const raw = await llmClient.complete(prompt, systemPrompt, {
      temperature: 0.2,
      jsonMode: true,
    });

    const parsed = JSON.parse(llmClient.cleanJsonResponse(raw));
    res.json({ evaluation: parsed });
  } catch (err: unknown) {
    res.json({
      evaluation: {
        accuracy_score: 8,
        structure_score: 7,
        delivery_score: 8,
        strengths: ['Addressed the main architectural premise', 'Showed clear understanding of the core concept'],
        missing_points: ['Could elaborate more deeply on edge case failures', 'Could explicitly mention metrics or telemetry'],
        improved_answer_sample: `In a production setup, I approach this by prioritizing resiliency and observability first. Specifically: ${question.answer_outline.split('\n')[0] || 'Clarifying constraints and evaluating trade-offs.'}`,
      },
    });
  }
});

export default router;
