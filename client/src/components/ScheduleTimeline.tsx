'use client';

import React from 'react';
import { Schedule, Question } from '../lib/types';
import { Calendar, Clock, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

interface ScheduleTimelineProps {
  schedule: Schedule;
  questions: Question[];
  onSelectQuestion?: (qId: string) => void;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  schedule,
  questions,
  onSelectQuestion,
}) => {
  const getQuestionById = (id: string) => questions.find((q) => q.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Preparation Schedule ({schedule.days_available} Days)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Arithmetic allocation prioritizing complex system design and must-have requirements earlier in your timeline.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schedule.days.map((day) => {
          const dayQuestions = day.question_ids
            .map(getQuestionById)
            .filter(Boolean) as Question[];

          return (
            <div
              key={day.day}
              className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                    Day {day.day} of {schedule.days_available}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{day.minutes} mins</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug mb-3">
                  {day.focus}
                </h3>

                <div className="space-y-2 mt-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Questions ({dayQuestions.length})
                  </div>
                  {dayQuestions.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => onSelectQuestion?.(q.id)}
                      className="group/item p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-mono text-indigo-400 font-semibold">{q.id.toUpperCase()}</span>
                        <span className="capitalize">{q.category}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 group-hover/item:text-white transition-colors">
                        {q.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Topic Planned</span>
                </span>
                <span>Target: {day.minutes}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
