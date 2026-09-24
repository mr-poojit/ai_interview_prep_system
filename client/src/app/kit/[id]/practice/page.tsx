'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../lib/authContext';
import { KitRecord } from '../../../../lib/types';
import { FlashcardDeck } from '../../../../components/FlashcardDeck';
import { MockInterviewer } from '../../../../components/MockInterviewer';
import { ArrowLeft, BookOpen, Mic, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const kitId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [kitRecord, setKitRecord] = useState<KitRecord | null>(null);
  const [practiceMode, setPracticeMode] = useState<'flashcards' | 'mock'>('flashcards');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKit = async () => {
    try {
      setIsLoading(true);
      const res = await api.getKit(kitId);
      setKitRecord(res.kitRecord);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load kit';
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
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !kitRecord) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Kit Not Found</h2>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 mt-6 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const { kit } = kitRecord;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 flex flex-col space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            href={`/kit/${kitRecord.id}`}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Kit Dossier</span>
          </Link>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Practice & Rehearsal Room
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {kit.role.title} at <span className="text-indigo-400 font-medium">{kit.source.company}</span>
          </p>
        </div>

        {/* Practice Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 sm:flex sm:items-center sm:space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setPracticeMode('flashcards')}
            className={`flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              practiceMode === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setPracticeMode('mock')}
            className={`flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              practiceMode === 'mock'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span>Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Mode View */}
      <div className="py-2 sm:py-4 flex-1">
        {practiceMode === 'flashcards' ? (
          <FlashcardDeck
            flashcards={kit.flashcards}
            onRateConfidence={handleRateConfidence}
            practiceProgress={kitRecord.practiceProgress}
          />
        ) : (
          <MockInterviewer kitId={kitRecord.id} questions={kit.questions} />
        )}
      </div>
    </div>
  );
}
