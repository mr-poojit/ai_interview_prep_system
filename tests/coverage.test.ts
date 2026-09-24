import { describe, it, expect } from 'vitest';
import { calculateCoverageGaps, executeCoveragePasses } from '../server/src/services/pipeline/coverage.js';
import { Question, Requirement } from '../shared/types.js';

describe('Coverage & The Second Pass (Section 3 & 4)', () => {
  const requirements: Requirement[] = [
    { id: 'r1', text: 'Golang microservices', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Kafka event streaming', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Docker / Kubernetes', kind: 'technical', priority: 'nice' },
  ];

  it('accurately identifies uncovered requirement IDs', () => {
    // Only r1 is covered in initial questions
    const questions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Explain Go goroutine scheduling and channel buffering.',
        answer_outline: 'GMP model, work stealing, non-blocking channels.',
        difficulty: 2,
      },
    ];

    const gaps = calculateCoverageGaps(requirements, questions);

    expect(gaps.coveredIds.has('r1')).toBe(true);
    expect(gaps.coveredIds.has('r2')).toBe(false);
    expect(gaps.uncoveredIds).toEqual(['r2', 'r3']);
    expect(gaps.uncoveredMustIds).toEqual(['r2']);
  });

  it('triggers Second Pass when must-haves are uncovered and closes the gap', async () => {
    const questions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Go concurrency patterns.',
        answer_outline: 'Context propagation, select statements.',
        difficulty: 2,
      },
    ];

    const result = await executeCoveragePasses(requirements, questions, {
      roleTitle: 'Backend Engineer',
      seniority: 'Senior',
      companyName: 'Acme Corp',
    });

    // Second pass should have run
    expect(result.coverage.passes).toBe(2);

    // All must requirements (r1, r2) must now be covered
    const coveredIds = new Set(result.questions.flatMap((q) => q.requirement_ids));
    expect(coveredIds.has('r1')).toBe(true);
    expect(coveredIds.has('r2')).toBe(true);
    expect(result.coverage.uncovered_requirement_ids.includes('r2')).toBe(false);
  });

  it('returns passes: 1 when all requirements are fully covered in first pass', async () => {
    const fullyCoveredQuestions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1', 'r2'],
        category: 'technical',
        prompt: 'Explain high-throughput streaming in Go with Kafka.',
        answer_outline: 'Partitioning, consumer groups, backpressure.',
        difficulty: 3,
      },
      {
        id: 'q2',
        requirement_ids: ['r3'],
        category: 'technical',
        prompt: 'Container lifecycle management.',
        answer_outline: 'Pod scheduling, cgroups, probes.',
        difficulty: 2,
      },
    ];

    const result = await executeCoveragePasses(requirements, fullyCoveredQuestions, {
      roleTitle: 'Backend Engineer',
      seniority: 'Senior',
      companyName: 'Acme Corp',
    });

    expect(result.coverage.passes).toBe(1);
    expect(result.coverage.uncovered_requirement_ids).toEqual([]);
  });
});
