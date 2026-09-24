import { z } from 'zod';

// ==========================================
// Appendix A Kit Structure Validation Schemas
// ==========================================

export const RequirementKindSchema = z.enum(['technical', 'behavioural', 'domain']);
export type RequirementKind = z.infer<typeof RequirementKindSchema>;

export const RequirementPrioritySchema = z.enum(['must', 'nice']);
export type RequirementPriority = z.infer<typeof RequirementPrioritySchema>;

export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
});
export type Requirement = z.infer<typeof RequirementSchema>;

export const QuestionCategorySchema = z.enum([
  'technical',
  'behavioural',
  'system-design',
  'company-fit',
]);
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;

export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
  // Builder provenance extensions (optional for internal tracking, transparent in export)
  is_custom: z.boolean().optional(),
  is_edited: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  // Practice tracker extensions
  confidence: z.number().int().min(1).max(3).optional(),
  last_reviewed: z.string().optional(),
  is_custom: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const ScheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string().min(1),
  question_ids: z.array(z.string()),
  minutes: z.number().int().positive(),
});
export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;

export const ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().min(1),
});
export type Coverage = z.infer<typeof CoverageSchema>;

export const KitSourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int(),
  researched_at: z.string(),
  pages_used: z.array(z.string()),
});
export type KitSource = z.infer<typeof KitSourceSchema>;

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
});
export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;

export const RoleBreakdownSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
});
export type RoleBreakdown = z.infer<typeof RoleBreakdownSchema>;

export const KitStructureSchema = z.object({
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleBreakdownSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema,
}).superRefine((data, ctx) => {
  // Rule: every question_ids entry in schedule must refer to an existing question
  const existingQIds = new Set(data.questions.map((q) => q.id));
  for (const day of data.schedule.days) {
    for (const qId of day.question_ids) {
      if (!existingQIds.has(qId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule day ${day.day} references non-existent question_id "${qId}"`,
          path: ['schedule', 'days', day.day - 1, 'question_ids'],
        });
      }
    }
  }

  // Rule: schedule days count must equal days_available
  if (data.schedule.days.length !== data.schedule.days_available) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Schedule days count (${data.schedule.days.length}) does not match days_available (${data.schedule.days_available})`,
      path: ['schedule', 'days'],
    });
  }
});

export type KitStructure = z.infer<typeof KitStructureSchema>;

// ==========================================
// Appendix B Batch Input & Output Schemas
// ==========================================

export const BatchInputCaseSchema = z.object({
  id: z.string().min(1),
  jd: z.string().min(1),
  company_url: z.string(),
  days: z.number().int().positive(),
});
export type BatchInputCase = z.infer<typeof BatchInputCaseSchema>;

export const BatchInputSchema = z.array(BatchInputCaseSchema);
export type BatchInput = z.infer<typeof BatchInputSchema>;

export const BatchCaseErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type BatchCaseError = z.infer<typeof BatchCaseErrorSchema>;

export const BatchCaseOutputSchema = z.object({
  id: z.string(),
  status: z.enum(['ok', 'failed']),
  kit: KitStructureSchema.nullable(),
  error: BatchCaseErrorSchema.nullable(),
});
export type BatchCaseOutput = z.infer<typeof BatchCaseOutputSchema>;

export const BatchOutputSchema = z.object({
  version: z.literal('1.0'),
  generated_at: z.string(),
  kits: z.array(BatchCaseOutputSchema),
});
export type BatchOutput = z.infer<typeof BatchOutputSchema>;

// ==========================================
// Research & Pipeline Progress Events
// ==========================================

export type PipelineStage =
  | 'extracting_requirements'
  | 'crawling_company'
  | 'searching_discussions'
  | 'generating_brief'
  | 'generating_questions'
  | 'checking_coverage'
  | 'generating_second_pass'
  | 'generating_flashcards'
  | 'allocating_schedule'
  | 'completed'
  | 'failed';

export interface PipelineProgress {
  stage: PipelineStage;
  message: string;
  stepNumber: number;
  totalSteps: number;
  details?: Record<string, unknown>;
}
