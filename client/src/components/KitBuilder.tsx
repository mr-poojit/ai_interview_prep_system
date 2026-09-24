'use client';

import React, { useState } from 'react';
import {
  KitStructure,
  Question,
  QuestionCategory,
  Flashcard,
} from '../lib/types';
import { api } from '../lib/api';
import {
  Sparkles,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  RotateCcw,
  Save,
  CheckCircle2,
  Layers,
  FileText,
  Printer,
  BookOpen,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import { PrintableSheet } from './PrintableSheet';

interface KitBuilderProps {
  kitRecordId: string;
  initialKit: KitStructure;
  onKitUpdated?: (updated: KitStructure) => void;
}

export const KitBuilder: React.FC<KitBuilderProps> = ({
  kitRecordId,
  initialKit,
  onKitUpdated,
}) => {
  const [kit, setKit] = useState<KitStructure>(initialKit);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Brief inline edits
  const handleBriefChange = (field: 'summary' | 'what_they_do', val: string) => {
    setKit((prev) => ({
      ...prev,
      company_brief: {
        ...prev.company_brief,
        [field]: val,
      },
    }));
    triggerAutoSave();
  };

  // Question editing
  const handleQuestionEdit = (
    qId: string,
    field: 'prompt' | 'answer_outline' | 'category' | 'difficulty',
    val: any
  ) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId ? { ...q, [field]: val, is_edited: true } : q
      ),
    }));
    triggerAutoSave();
  };

  // Toggle Pin
  const handleTogglePin = (qId: string) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId ? { ...q, is_pinned: !q.is_pinned } : q
      ),
    }));
    triggerAutoSave();
  };

  // Delete question
  const handleDeleteQuestion = (qId: string) => {
    setKit((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
      // Clean schedule references
      schedule: {
        ...prev.schedule,
        days: prev.schedule.days.map((d) => ({
          ...d,
          question_ids: d.question_ids.filter((id) => id !== qId),
        })),
      },
    }));
    triggerAutoSave();
  };

  // Move Question within list
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= kit.questions.length) return;

    const newQuestions = [...kit.questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);

    setKit((prev) => ({
      ...prev,
      questions: newQuestions,
    }));
    triggerAutoSave();
  };

  // Add custom manual question
  const handleAddQuestion = () => {
    const nextNum =
      Math.max(...kit.questions.map((q) => parseInt(q.id.replace(/\D/g, '') || '0', 10)), 0) + 1;

    const newQ: Question = {
      id: `q${nextNum}`,
      requirement_ids: [kit.role.requirements[0]?.id || 'r1'],
      category: (activeCategory !== 'all' ? activeCategory : 'technical') as QuestionCategory,
      prompt: 'New custom interview question prompt...',
      answer_outline: '- Key point 1\n- Key point 2\n- Expected trade-off',
      difficulty: 2,
      is_custom: true,
      is_pinned: true,
    };

    setKit((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
    triggerAutoSave();
  };

  // Persist to backend
  const triggerAutoSave = async () => {
    setSaveSuccess(false);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateKit(kitRecordId, kit);
      setKit(res.kitRecord.kit);
      onKitUpdated?.(res.kitRecord.kit);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      alert('Failed to save kit updates.');
    } finally {
      setIsSaving(false);
    }
  };

  // Selective section regeneration
  const handleRegenerateSection = async (
    targetType: 'category' | 'brief' | 'schedule',
    category?: string
  ) => {
    const label = category ? `${category} questions` : targetType;
    if (
      !confirm(
        `Regenerate ${label}? Your edited, manual, and pinned questions will be strictly preserved.`
      )
    ) {
      return;
    }

    setIsRegenerating(label);
    try {
      const res = await api.regenerateSection(kitRecordId, targetType, category);
      setKit(res.kitRecord.kit);
      onKitUpdated?.(res.kitRecord.kit);
    } catch (err: unknown) {
      alert(`Failed to regenerate ${label}`);
    } finally {
      setIsRegenerating(null);
    }
  };

  const filteredQuestions =
    activeCategory === 'all'
      ? kit.questions
      : kit.questions.filter((q) => q.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Action / Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Kit Builder
          </span>
          <span className="text-xs text-slate-400">
            {kit.questions.length} questions • {kit.schedule.days_available} days schedule
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Company Intelligence Brief */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Company Intelligence Brief</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified corporate positioning and discovered engineering culture
            </p>
          </div>

          <button
            onClick={() => handleRegenerateSection('brief')}
            disabled={isRegenerating === 'brief'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating === 'brief' ? 'animate-spin' : ''}`} />
            <span>Regenerate Brief</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Executive Summary
            </label>
            <textarea
              rows={2}
              value={kit.company_brief.summary}
              onChange={(e) => handleBriefChange('summary', e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              What They Do & Core Products
            </label>
            <textarea
              rows={2}
              value={kit.company_brief.what_they_do}
              onChange={(e) => handleBriefChange('what_they_do', e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {kit.source.pages_used.length > 0 && (
            <div className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-400">Sources crawled: </span>
              {kit.source.pages_used.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Role Breakdown & Requirements */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Role Requirements & Must-Have Coverage</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Classified from job description. Priority: must vs nice.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {kit.role.requirements.map((req) => (
            <div
              key={req.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    [{req.id.toUpperCase()}]
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      req.priority === 'must'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{req.text}</p>
              </div>
              <span className="text-[10px] text-slate-500 capitalize mt-2">Kind: {req.kind}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Question Bank (The Builder Centerpiece) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Question Bank & Answer Rubrics</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit prompts, reorder, pin, or regenerate individual categories while preserving your work.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddQuestion}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Custom Question</span>
            </button>

            {activeCategory !== 'all' && (
              <button
                onClick={() => handleRegenerateSection('category', activeCategory)}
                disabled={isRegenerating === `${activeCategory} questions`}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${
                    isRegenerating === `${activeCategory} questions` ? 'animate-spin' : ''
                  }`}
                />
                <span>Regenerate Category</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-b border-slate-800">
          {(['all', 'technical', 'behavioural', 'system-design', 'company-fit'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.replace('-', ' ')}
              </button>
            )
          )}
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === filteredQuestions.length - 1;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border transition-all ${
                  q.is_pinned
                    ? 'bg-slate-900/90 border-indigo-500/50 shadow-md shadow-indigo-950/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {q.id.toUpperCase()}
                    </span>

                    {/* Category Selector (Move across categories) */}
                    <select
                      value={q.category}
                      onChange={(e) =>
                        handleQuestionEdit(q.id, 'category', e.target.value as QuestionCategory)
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 capitalize focus:outline-none focus:border-indigo-500"
                    >
                      <option value="technical">technical</option>
                      <option value="behavioural">behavioural</option>
                      <option value="system-design">system-design</option>
                      <option value="company-fit">company-fit</option>
                    </select>

                    {/* Difficulty */}
                    <select
                      value={q.difficulty}
                      onChange={(e) =>
                        handleQuestionEdit(q.id, 'difficulty', parseInt(e.target.value, 10))
                      }
                      className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="1">Diff: 1 (Easy)</option>
                      <option value="2">Diff: 2 (Medium)</option>
                      <option value="3">Diff: 3 (Hard)</option>
                    </select>

                    {/* Provenance Badges */}
                    {q.is_custom && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-medium">
                        Custom
                      </span>
                    )}
                    {q.is_edited && !q.is_custom && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-medium">
                        Edited
                      </span>
                    )}
                  </div>

                  {/* Right Actions: Reorder, Pin, Delete */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={isFirst}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={isLast}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleTogglePin(q.id)}
                      className={`p-1.5 rounded transition-colors ${
                        q.is_pinned
                          ? 'text-indigo-400 bg-indigo-500/20'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                      title={q.is_pinned ? 'Pinned (Protected from regeneration)' : 'Pin question'}
                    >
                      {q.is_pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Prompt Editor */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Question Prompt
                    </label>
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => handleQuestionEdit(q.id, 'prompt', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Expected Answer Outline & Scoring Rubric
                    </label>
                    <textarea
                      rows={3}
                      value={q.answer_outline}
                      onChange={(e) => handleQuestionEdit(q.id, 'answer_outline', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Covers Requirements: {q.requirement_ids.join(', ')}</span>
                  <span>{q.is_pinned ? '🔒 Pinned against category regeneration' : 'Auto-generated'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printable Sheet Modal */}
      {isPrintModalOpen && (
        <PrintableSheet kit={kit} onClose={() => setIsPrintModalOpen(false)} />
      )}
    </div>
  );
};
