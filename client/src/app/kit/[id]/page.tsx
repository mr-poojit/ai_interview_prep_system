'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import { KitRecord, KitStructure } from '../../../lib/types';
import { KitBuilder } from '../../../components/KitBuilder';
import { ScheduleTimeline } from '../../../components/ScheduleTimeline';
import { FlashcardDeck } from '../../../components/FlashcardDeck';
import { MockInterviewer } from '../../../components/MockInterviewer';
import {
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  Mic,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

export default function KitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const kitId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [kitRecord, setKitRecord] = useState<KitRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'schedule' | 'flashcards' | 'mock'>('builder');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKit = async () => {
    try {
      setIsLoading(true);
      const res = await api.getKit(kitId);
      setKitRecord(res.kitRecord);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load prep kit';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && kitId) {
      fetchKit();
    }
  }, [user, authLoading, kitId, router]);

  const handleRateConfidence = async (cardId: string, confidence: number) => {
    if (!kitRecord) return;
    const res = await api.recordConfidence(kitRecord.id, cardId, confidence);
    setKitRecord((prev) =>
      prev ? { ...prev, practiceProgress: res.practiceProgress } : null
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading interview kit...</p>
        </div>
      </div>
    );
  }

  if (error || !kitRecord) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Kit Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">{error || 'This kit does not exist or access was denied.'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 mt-6 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const { kit } = kitRecord;
  const uncoveredCount = kit.coverage.uncovered_requirement_ids.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-6">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Kits Dashboard</span>
          </Link>

          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {kit.role.title}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {kit.source.company}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Seniority: {kit.role.seniority} • {kit.source.location} • Researched {new Date(kit.source.researched_at).toLocaleDateString()}
          </p>
        </div>

        {/* Coverage & Timeline Pills */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{kit.schedule.days_available} Days</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {uncoveredCount === 0 ? 'Must-haves: 100% Covered' : `${uncoveredCount} Gaps`} (Passes: {kit.coverage.passes})
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'builder'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>The Builder (Questions & Brief)</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Schedule ({kit.schedule.days_available}d)</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'flashcards'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Flashcard Practice ({kit.flashcards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mock')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'mock'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>AI Mock Interview Simulator</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2 flex-1">
        {activeTab === 'builder' && (
          <KitBuilder
            kitRecordId={kitRecord.id}
            initialKit={kit}
            onKitUpdated={(updated) =>
              setKitRecord((prev) => (prev ? { ...prev, kit: updated } : null))
            }
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTimeline
            schedule={kit.schedule}
            questions={kit.questions}
            onSelectQuestion={() => setActiveTab('builder')}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardDeck
            flashcards={kit.flashcards}
            onRateConfidence={handleRateConfidence}
            practiceProgress={kitRecord.practiceProgress}
          />
        )}

        {activeTab === 'mock' && (
          <MockInterviewer kitId={kitRecord.id} questions={kit.questions} />
        )}
      </div>
    </div>
  );
}
