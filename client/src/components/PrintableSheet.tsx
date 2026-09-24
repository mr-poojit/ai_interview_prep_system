'use client';

import React from 'react';
import { KitStructure } from '../lib/types';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintableSheetProps {
  kit: KitStructure;
  onClose: () => void;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({ kit, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto p-4 sm:p-8 print:p-0">
      {/* Top action bar (hidden in print) */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 sm:pb-6 mb-6 sm:mb-8 border-b border-slate-200 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Kit Builder</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Document Core */}
      <article className="max-w-4xl mx-auto space-y-6 sm:space-y-8 font-serif leading-relaxed">
        {/* Header */}
        <header className="border-b-2 border-slate-900 pb-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-sans">
            AI Interview Preparation Dossier
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-950 mt-1">
            {kit.role.title} • {kit.source.company}
          </h1>
          <div className="text-xs text-slate-600 font-sans mt-2 flex flex-wrap items-center gap-3">
            <span>Seniority: {kit.role.seniority}</span>
            <span>•</span>
            <span>Timeline: {kit.schedule.days_available} Days</span>
            <span>•</span>
            <span>Researched: {new Date(kit.source.researched_at).toLocaleDateString()}</span>
          </div>
        </header>

        {/* Company Brief */}
        <section className="space-y-2">
          <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-indigo-900 border-b pb-1">
            1. Company Intelligence Brief
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{kit.company_brief.summary}</p>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">{kit.company_brief.what_they_do}</p>
        </section>

        {/* Requirements */}
        <section className="space-y-3">
          <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-indigo-900 border-b pb-1">
            2. Core Requirements & Competencies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
            {kit.role.requirements.map((r) => (
              <div key={r.id} className="p-2 border border-slate-200 rounded">
                <span className="font-bold uppercase text-[10px] mr-1 text-slate-600">[{r.id}]</span>
                <span className={r.priority === 'must' ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                  {r.text}
                </span>
                <span className="ml-1 text-[10px] text-slate-400">({r.priority})</span>
              </div>
            ))}
          </div>
        </section>

        {/* Day-by-Day Schedule */}
        <section className="space-y-3">
          <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-indigo-900 border-b pb-1">
            3. Preparation Schedule ({kit.schedule.days_available} Days)
          </h2>
          <div className="space-y-2 text-xs font-sans">
            {kit.schedule.days.map((day) => (
              <div key={day.day} className="flex items-start space-x-3 p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="font-bold text-slate-900 shrink-0">Day {day.day} ({day.minutes}m):</span>
                <div>
                  <div className="font-semibold text-slate-800">{day.focus}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Questions: {day.question_ids.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Question Bank with Rubrics */}
        <section className="space-y-4">
          <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-indigo-900 border-b pb-1">
            4. Comprehensive Question Bank & Rubrics
          </h2>
          <div className="space-y-4">
            {kit.questions.map((q) => (
              <div key={q.id} className="p-3 border border-slate-200 rounded text-xs space-y-1.5 break-inside-avoid">
                <div className="flex flex-wrap items-center justify-between gap-1 font-sans text-[11px] text-slate-500">
                  <span className="font-bold text-slate-900">[{q.id.toUpperCase()}] {q.category.toUpperCase()}</span>
                  <span>Difficulty: {q.difficulty}/3 • Covers: {q.requirement_ids.join(', ')}</span>
                </div>
                <div className="font-semibold text-sm text-slate-900">{q.prompt}</div>
                <div className="font-sans text-[11px] text-slate-700 bg-slate-50 p-2 rounded whitespace-pre-line">
                  <strong className="block text-[10px] uppercase text-slate-500 mb-0.5">Answer Rubric:</strong>
                  {q.answer_outline}
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
};
