import { describe, it, expect } from 'vitest';
import { KitStructureSchema, KitStructure } from '../shared/types.js';

describe('Appendix A Kit Structure Validation', () => {
  const validKit: KitStructure = {
    source: {
      company: 'Acme Corp',
      company_url: 'https://acme.example.com',
      role: 'Staff Frontend Engineer',
      location: 'Remote',
      jd_chars: 1420,
      researched_at: '2026-09-23T12:00:00Z',
      pages_used: ['https://acme.example.com', 'https://acme.example.com/careers'],
    },
    company_brief: {
      summary: 'Acme builds enterprise logistics solutions with an engineering-first culture.',
      what_they_do: 'Global supply chain visibility platform serving enterprise freight.',
      sources: ['https://acme.example.com'],
    },
    role: {
      title: 'Staff Frontend Engineer',
      seniority: 'Staff',
      responsibilities: ['Architect Next.js application core', 'Mentor senior frontend engineers'],
      requirements: [
        {
          id: 'r1',
          text: 'Deep mastery of React internals and performance optimization',
          kind: 'technical',
          priority: 'must',
        },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'How would you debug and eliminate layout thrashing in a virtualized data table?',
        answer_outline: '- Identify forced reflows using DevTools Performance panel\n- Decouple DOM reads from DOM writes',
        difficulty: 3,
      },
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What is the difference between useLayoutEffect and useEffect?',
        back: 'useLayoutEffect runs synchronously immediately after DOM mutations before browser paint; useEffect runs asynchronously after paint.',
        requirement_ids: ['r1'],
      },
    ],
    schedule: {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: 'Deep React Performance & Virtualization',
          question_ids: ['q1'],
          minutes: 60,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };

  it('validates a conformant Appendix A kit successfully', () => {
    const parsed = KitStructureSchema.safeParse(validKit);
    expect(parsed.success).toBe(true);
  });

  it('rejects floating-point minutes in the schedule', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days[0].minutes = 60.5;

    const parsed = KitStructureSchema.safeParse(invalidKit);
    expect(parsed.success).toBe(false);
  });

  it('rejects difficulty outside of 1 to 3', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.questions[0].difficulty = 4;

    const parsed = KitStructureSchema.safeParse(invalidKit);
    expect(parsed.success).toBe(false);
  });

  it('rejects schedule question_id that does not exist in questions array', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days[0].question_ids = ['non_existent_q999'];

    const parsed = KitStructureSchema.safeParse(invalidKit);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message.includes('non-existent question_id'))).toBe(true);
    }
  });

  it('rejects mismatch between days array count and days_available', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days_available = 3; // But days array only has 1

    const parsed = KitStructureSchema.safeParse(invalidKit);
    expect(parsed.success).toBe(false);
  });
});
