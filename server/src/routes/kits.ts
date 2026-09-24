import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { KitRepository } from '../models/storage.js';
import { generatePrepKit } from '../services/pipeline/generator.js';
import { generateQuestionsForCategory } from '../services/pipeline/questionGen.js';
import { generateCompanyBrief } from '../services/pipeline/companyBriefGen.js';
import { crawlCompanySite } from '../services/crawler.js';
import { allocateSchedule } from '../services/pipeline/scheduler.js';
import { KitStructureSchema, QuestionCategorySchema, Question, Requirement } from '../../../shared/types.js';

const router = Router();

const CreateKitSchema = z.object({
  jd: z.string().min(10, 'Job description must be at least 10 characters'),
  company_url: z.string().min(3, 'Company URL is required'),
  days: z.number().int().min(1).max(90).default(5),
});

function getParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// GET /api/kits - List user kits
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kits = await KitRepository.findByUser(req.userId!);
  res.json({ kits });
});

// GET /api/kits/:id - Fetch single kit
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kitId = getParamId(req.params.id);
  const record = await KitRepository.findById(kitId);
  if (!record || record.userId !== req.userId) {
    res.status(404).json({ error: 'KIT_NOT_FOUND', message: 'Kit not found or access denied.' });
    return;
  }
  res.json({ kitRecord: record });
});

// POST /api/kits/generate - Generate single kit
router.post('/generate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parsed = CreateKitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message });
    return;
  }

  const { jd, company_url, days } = parsed.data;

  try {
    const kit = await generatePrepKit({
      jd,
      company_url,
      days,
    });

    const record = await KitRepository.create(req.userId!, kit);
    res.status(201).json({ kitRecord: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Kits Route] Generation failed:', err);
    res.status(500).json({ error: 'GENERATION_FAILED', message });
  }
});

// POST /api/kits/batch - Upload multiple roles
router.post('/batch', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const BatchCaseSchema = z.object({
    id: z.string().optional(),
    jd: z.string().min(10),
    company_url: z.string(),
    days: z.number().int().min(1).default(5),
  });
  const BatchUploadSchema = z.array(BatchCaseSchema);

  const parsed = BatchUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Payload must be an array of { jd, company_url, days }' });
    return;
  }

  const cases = parsed.data;
  const createdRecords = [];

  for (const c of cases) {
    try {
      const kit = await generatePrepKit({
        jd: c.jd,
        company_url: c.company_url,
        days: c.days,
      });
      const record = await KitRepository.create(req.userId!, kit);
      createdRecords.push(record);
    } catch (err: unknown) {
      console.warn(`[Batch Upload] Sub-case failed:`, err);
    }
  }

  res.status(201).json({ createdCount: createdRecords.length, kits: createdRecords });
});

// PUT /api/kits/:id - Update kit (Inline edits, reordering, custom additions, pins)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kitId = getParamId(req.params.id);
  const record = await KitRepository.findById(kitId);
  if (!record || record.userId !== req.userId) {
    res.status(404).json({ error: 'KIT_NOT_FOUND', message: 'Kit not found or access denied.' });
    return;
  }

  const kitValidation = KitStructureSchema.safeParse(req.body.kit);
  if (!kitValidation.success) {
    res.status(400).json({
      error: 'INVALID_KIT_STRUCTURE',
      message: 'Kit updates must conform to Appendix A schema',
      details: kitValidation.error.format(),
    });
    return;
  }

  const updated = await KitRepository.update(kitId, {
    kit: kitValidation.data,
  });

  res.json({ kitRecord: updated });
});

// POST /api/kits/:id/regenerate - Regenerate a specific section without losing edits elsewhere
router.post('/:id/regenerate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kitId = getParamId(req.params.id);
  const record = await KitRepository.findById(kitId);
  if (!record || record.userId !== req.userId) {
    res.status(404).json({ error: 'KIT_NOT_FOUND', message: 'Kit not found or access denied.' });
    return;
  }

  const { targetType, category } = req.body;
  const currentKit = record.kit;

  try {
    if (targetType === 'category') {
      const catParsed = QuestionCategorySchema.safeParse(category);
      if (!catParsed.success) {
        res.status(400).json({ error: 'INVALID_CATEGORY', message: 'Invalid question category specified.' });
        return;
      }
      const targetCategory = catParsed.data;

      // 1. Separate questions in this category into preserved vs replaceable
      const preservedQuestions = currentKit.questions.filter(
        (q: Question) => q.category === targetCategory && (q.is_custom || q.is_edited || q.is_pinned)
      );

      const otherCategoryQuestions = currentKit.questions.filter((q: Question) => q.category !== targetCategory);

      // 2. Identify requirements relevant to this category
      const targetReqs = currentKit.role.requirements.filter((r: Requirement) => {
        if (targetCategory === 'technical') return r.kind === 'technical';
        if (targetCategory === 'behavioural') return r.kind === 'behavioural';
        if (targetCategory === 'company-fit') return r.kind === 'domain';
        return true;
      });

      // 3. Generate fresh questions for this category
      const nextIdNum = Math.max(...currentKit.questions.map((q: Question) => parseInt(q.id.replace(/\D/g, '') || '0', 10)), 0) + 1;
      const freshlyGenerated = await generateQuestionsForCategory({
        category: targetCategory,
        requirements: targetReqs,
        allRequirements: currentKit.role.requirements,
        roleTitle: currentKit.role.title,
        seniority: currentKit.role.seniority,
        companyName: currentKit.source.company,
        startIdNumber: nextIdNum,
      });

      // 4. Combine preserved user edits + newly generated
      const updatedCategoryQuestions: Question[] = [...preservedQuestions, ...freshlyGenerated];
      const mergedQuestions: Question[] = [...otherCategoryQuestions, ...updatedCategoryQuestions];

      // 5. Re-run schedule allocation to ensure schedule question_ids stay strictly consistent
      const updatedSchedule = allocateSchedule(
        currentKit.schedule.days_available,
        mergedQuestions,
        currentKit.role.requirements
      );

      currentKit.questions = mergedQuestions;
      currentKit.schedule = updatedSchedule;

    } else if (targetType === 'brief') {
      // Regenerate company brief
      const crawlRes = await crawlCompanySite(currentKit.source.company_url);
      const newBrief = await generateCompanyBrief(
        currentKit.source.company_url,
        crawlRes.pages,
        crawlRes.pagesUsed,
        crawlRes.error
      );
      currentKit.company_brief = newBrief;

    } else if (targetType === 'schedule') {
      // Regenerate schedule
      const newSchedule = allocateSchedule(
        currentKit.schedule.days_available,
        currentKit.questions,
        currentKit.role.requirements
      );
      currentKit.schedule = newSchedule;
    } else {
      res.status(400).json({ error: 'INVALID_TARGET_TYPE', message: 'targetType must be category, brief, or schedule' });
      return;
    }

    // Validate updated kit against Appendix A
    const validated = KitStructureSchema.parse(currentKit);
    const updatedRecord = await KitRepository.update(kitId, { kit: validated });

    res.json({ kitRecord: updatedRecord });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'REGENERATION_FAILED', message });
  }
});

// DELETE /api/kits/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const kitId = getParamId(req.params.id);
  const record = await KitRepository.findById(kitId);
  if (!record || record.userId !== req.userId) {
    res.status(404).json({ error: 'KIT_NOT_FOUND', message: 'Kit not found or access denied.' });
    return;
  }

  await KitRepository.delete(kitId);
  res.json({ success: true });
});

export default router;
