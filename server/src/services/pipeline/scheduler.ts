import { Question, Requirement, Schedule, ScheduleDay } from '../../shared/types.js';

/**
 * Deterministic schedule allocator.
 * Distributes interview prep material across exactly N days.
 * Pure arithmetic and priority sorting - NOT handed to an LLM.
 */
export function allocateSchedule(
  daysRequested: number,
  questions: Question[],
  requirements: Requirement[]
): Schedule {
  const daysCount = Math.max(1, Math.floor(daysRequested));

  // If question bank is somehow empty, create a stub question to satisfy schema
  if (questions.length === 0) {
    const fallbackQId = 'q1';
    return {
      days_available: daysCount,
      days: Array.from({ length: daysCount }, (_, i) => ({
        day: i + 1,
        focus: `Day ${i + 1} General Overview`,
        question_ids: [fallbackQId],
        minutes: 60,
      })),
    };
  }

  // 1. Calculate question weight: Higher priority (must-haves) and higher difficulty land earlier
  const mustReqIds = new Set(requirements.filter((r) => r.priority === 'must').map((r) => r.id));

  const scoredQuestions = questions.map((q) => {
    let score = q.difficulty * 3; // 3, 6, 9
    const coversMust = q.requirement_ids.some((id) => mustReqIds.has(id));
    if (coversMust) score += 10;
    if (q.category === 'system-design') score += 4;
    if (q.category === 'technical') score += 2;
    return { question: q, score };
  });

  // Sort descending: Hardest & Must-have first
  scoredQuestions.sort((a, b) => b.score - a.score);
  const sortedQuestions = scoredQuestions.map((sq) => sq.question);

  // 2. Identify all questions needed to cover EVERY must-have requirement
  const scheduledMustReqs = new Set<string>();
  const priorityQuestions: Question[] = [];
  const secondaryQuestions: Question[] = [];

  for (const q of sortedQuestions) {
    const coversNewMust = q.requirement_ids.some(
      (id) => mustReqIds.has(id) && !scheduledMustReqs.has(id)
    );
    if (coversNewMust) {
      priorityQuestions.push(q);
      for (const id of q.requirement_ids) {
        if (mustReqIds.has(id)) scheduledMustReqs.add(id);
      }
    } else {
      secondaryQuestions.push(q);
    }
  }

  // Combine so priority items are guaranteed at the top
  const orderedQueue = [...priorityQuestions, ...secondaryQuestions];

  // 3. Allocate across days
  const days: ScheduleDay[] = [];

  if (daysCount === 1) {
    // 1-Day Intensive: Put all questions (or at least all priority questions) into Day 1
    const qIds = orderedQueue.map((q) => q.id);
    days.push({
      day: 1,
      focus: 'Intensive Review: Core Technical Mastery & System Design',
      question_ids: qIds,
      minutes: Math.min(180, Math.max(60, qIds.length * 15)),
    });
  } else if (daysCount <= orderedQueue.length) {
    // Standard multi-day: Distribute questions across days
    // Priority questions placed in earlier days
    const buckets: Question[][] = Array.from({ length: daysCount }, () => []);

    // Distribute questions into buckets
    orderedQueue.forEach((q, idx) => {
      const targetDay = idx % daysCount;
      buckets[targetDay].push(q);
    });

    for (let i = 0; i < daysCount; i++) {
      const bucket = buckets[i];
      // Ensure no bucket is empty
      if (bucket.length === 0) {
        bucket.push(orderedQueue[i % orderedQueue.length]);
      }

      const qIds = bucket.map((q) => q.id);
      const focus = determineDayFocus(bucket, i + 1, daysCount);
      const minutes = calculateDayMinutes(bucket);

      days.push({
        day: i + 1,
        focus,
        question_ids: qIds,
        minutes,
      });
    }
  } else {
    // daysCount > orderedQueue.length (e.g. 14, 30, or 60 days)
    // Distributed spaced repetition schedule
    for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
      // Pick primary question and spaced review question
      const primaryIndex = (dayNum - 1) % orderedQueue.length;
      const primaryQ = orderedQueue[primaryIndex];

      const dayQuestions: Question[] = [primaryQ];

      // Add a secondary review question on later days
      if (dayNum > 2 && orderedQueue.length > 1) {
        const reviewIndex = (dayNum * 3) % orderedQueue.length;
        if (reviewIndex !== primaryIndex) {
          dayQuestions.push(orderedQueue[reviewIndex]);
        }
      }

      const focus = determineExtendedDayFocus(dayNum, daysCount, dayQuestions);
      const minutes = dayNum === daysCount ? 45 : 60; // Lighter final review before interview

      days.push({
        day: dayNum,
        focus,
        question_ids: dayQuestions.map((q) => q.id),
        minutes,
      });
    }
  }

  // 4. Invariant Verification: Guarantee every must-have requirement appears in schedule
  const allScheduledQIds = new Set(days.flatMap((d) => d.question_ids));
  const coveredMusts = new Set<string>();

  for (const qId of allScheduledQIds) {
    const q = questions.find((item) => item.id === qId);
    if (q) {
      for (const reqId of q.requirement_ids) {
        if (mustReqIds.has(reqId)) coveredMusts.add(reqId);
      }
    }
  }

  // If any must-have is still unrepresented, inject a question covering it into Day 1
  for (const reqId of mustReqIds) {
    if (!coveredMusts.has(reqId)) {
      const coveringQ = questions.find((q) => q.requirement_ids.includes(reqId));
      if (coveringQ && !days[0].question_ids.includes(coveringQ.id)) {
        days[0].question_ids.unshift(coveringQ.id);
      }
    }
  }

  return {
    days_available: daysCount,
    days,
  };
}

function determineDayFocus(questions: Question[], dayNum: number, totalDays: number): string {
  if (dayNum === totalDays && totalDays > 1) {
    return 'Final Rehearsal: High-Yield Summary & Behavioral Pitch';
  }

  const categoryCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  const dominantCategory = Object.keys(categoryCounts).reduce(
    (a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b),
    'technical'
  );

  switch (dominantCategory) {
    case 'system-design':
      return 'System Architecture, Scalability & Data Modeling';
    case 'technical':
      return dayNum <= 2
        ? 'Core Technical Deep Dive & Critical Requirements'
        : 'Applied Technical Problem Solving & Trade-offs';
    case 'behavioural':
      return 'Behavioral Scenarios, Leadership & Conflict Resolution';
    case 'company-fit':
      return 'Company Mission, Domain Acumen & Cultural Synergy';
    default:
      return `Day ${dayNum} Comprehensive Focus`;
  }
}

function determineExtendedDayFocus(dayNum: number, totalDays: number, questions: Question[]): string {
  const progressRatio = dayNum / totalDays;

  if (progressRatio <= 0.25) {
    return `Foundational Mastery: ${questions[0]?.category.toUpperCase() || 'Technical'} Concepts`;
  } else if (progressRatio <= 0.6) {
    return `System Architecture & Hands-on Implementation Drill`;
  } else if (progressRatio <= 0.85) {
    return `Behavioral Mastery (STAR) & Cross-Functional Collaboration`;
  } else {
    return `Final Mock Simulations & Rapid Response Tune-up`;
  }
}

function calculateDayMinutes(questions: Question[]): number {
  const baseMinutes = questions.reduce((acc, q) => {
    return acc + (q.difficulty === 3 ? 30 : q.difficulty === 2 ? 20 : 15);
  }, 15);

  // Round to nearest 15-minute interval (integer)
  return Math.max(30, Math.round(baseMinutes / 15) * 15);
}
