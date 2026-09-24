import { describe, it, expect } from 'vitest';
import { allocateSchedule } from '../server/src/services/pipeline/scheduler.js';
import { Question, Requirement } from '../shared/types.js';

describe('Deterministic Scheduler (Section 8)', () => {
  const mockRequirements: Requirement[] = [
    { id: 'r1', text: '5+ years React', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Distributed systems', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Mentoring juniors', kind: 'behavioural', priority: 'nice' },
  ];

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      requirement_ids: ['r1'],
      category: 'technical',
      prompt: 'Explain React reconciliation and fiber architecture.',
      answer_outline: 'Fiber nodes, render vs commit, workLoop.',
      difficulty: 2,
    },
    {
      id: 'q2',
      requirement_ids: ['r2'],
      category: 'system-design',
      prompt: 'Design a distributed consensus mechanism.',
      answer_outline: 'Raft, Paxos, leader election, log replication.',
      difficulty: 3,
    },
    {
      id: 'q3',
      requirement_ids: ['r3'],
      category: 'behavioural',
      prompt: 'Describe how you mentored a junior engineer.',
      answer_outline: 'STAR framework, pairing, feedback loops.',
      difficulty: 1,
    },
  ];

  it('allocates a 5-day schedule where days count equals requested days', () => {
    const schedule = allocateSchedule(5, mockQuestions, mockRequirements);

    expect(schedule.days_available).toBe(5);
    expect(schedule.days.length).toBe(5);
    expect(schedule.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
  });

  it('verifies every must-have requirement appears in the schedule', () => {
    const schedule = allocateSchedule(5, mockQuestions, mockRequirements);
    const scheduledQIds = new Set(schedule.days.flatMap((d) => d.question_ids));

    // r1 and r2 are must-haves
    const scheduledReqIds = new Set<string>();
    for (const qId of scheduledQIds) {
      const q = mockQuestions.find((item) => item.id === qId);
      q?.requirement_ids.forEach((rid) => scheduledReqIds.add(rid));
    }

    expect(scheduledReqIds.has('r1')).toBe(true);
    expect(scheduledReqIds.has('r2')).toBe(true);
  });

  it('places harder and higher-priority questions earlier in the schedule', () => {
    const schedule = allocateSchedule(3, mockQuestions, mockRequirements);

    // q2 is difficulty 3 and covers must-have requirement r2 -> should land on Day 1
    expect(schedule.days[0].question_ids).toContain('q2');
  });

  it('ensures all durations are integer minutes (no floats, no undefined)', () => {
    const schedule = allocateSchedule(4, mockQuestions, mockRequirements);

    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
    }
  });

  it('handles edge case: 1-day crash course schedule', () => {
    const schedule = allocateSchedule(1, mockQuestions, mockRequirements);

    expect(schedule.days_available).toBe(1);
    expect(schedule.days.length).toBe(1);
    expect(schedule.days[0].day).toBe(1);
    // Must contain all must-have covering questions
    expect(schedule.days[0].question_ids).toContain('q1');
    expect(schedule.days[0].question_ids).toContain('q2');
    expect(Number.isInteger(schedule.days[0].minutes)).toBe(true);
  });

  it('handles edge case: 60-day extended schedule without empty days', () => {
    const schedule = allocateSchedule(60, mockQuestions, mockRequirements);

    expect(schedule.days_available).toBe(60);
    expect(schedule.days.length).toBe(60);

    for (const day of schedule.days) {
      expect(day.question_ids.length).toBeGreaterThan(0);
      expect(day.focus.length).toBeGreaterThan(0);
      expect(Number.isInteger(day.minutes)).toBe(true);
    }
  });
});
