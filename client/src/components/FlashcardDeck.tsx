'use client';

import React, { useState } from 'react';
import { Flashcard } from '../lib/types';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Layers,
} from 'lucide-react';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  onRateConfidence: (cardId: string, confidence: number) => Promise<void>;
  practiceProgress?: Record<string, { confidence: number; reviewedAt: string }>;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  flashcards,
  onRateConfidence,
  practiceProgress = {},
}) => {
  // Sort cards by confidence: Unreviewed and confidence 1 first
  const sortedCards = [...flashcards].sort((a, b) => {
    const confA = practiceProgress[a.id]?.confidence || 0;
    const confB = practiceProgress[b.id]?.confidence || 0;
    return confA - confB;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (sortedCards.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-slate-400">No flashcards available in this kit.</p>
      </div>
    );
  }

  const currentCard = sortedCards[currentIndex] || sortedCards[0];
  const currentConfidence = practiceProgress[currentCard.id]?.confidence;

  const handleRate = async (conf: number) => {
    setIsSubmitting(true);
    try {
      await onRateConfidence(currentCard.id, conf);
      setIsFlipped(false);
      if (currentIndex < sortedCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < sortedCards.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedCards.length - 1));
  };

  // Stats
  const totalCards = sortedCards.length;
  const reviewedCount = Object.keys(practiceProgress).length;
  const masteredCount = Object.values(practiceProgress).filter((p) => p.confidence === 3).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Mastery Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Card {currentIndex + 1} of {totalCards}</span>
        </div>

        <div className="flex items-center space-x-3">
          <span>Reviewed: {reviewedCount}/{totalCards}</span>
          <span className="text-emerald-400 font-semibold">Mastered: {masteredCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${(reviewedCount / totalCards) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[320px] p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 shadow-2xl flex flex-col justify-between transition-all select-none relative group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {currentCard.id.toUpperCase()}
          </span>

          <div className="flex items-center space-x-2">
            {currentConfidence && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  currentConfidence === 3
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : currentConfidence === 2
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {currentConfidence === 3 ? 'Mastered' : currentConfidence === 2 ? 'Getting There' : 'Needs Work'}
              </span>
            )}

            <span className="text-xs text-slate-500 flex items-center space-x-1 group-hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3 h-3" />
              <span>Click to flip</span>
            </span>
          </div>
        </div>

        {/* Card Content (Front vs Back) */}
        <div className="my-auto py-6">
          {!isFlipped ? (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
                Prompt / Challenge
              </span>
              <p className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                {currentCard.front}
              </p>
            </div>
          ) : (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
                Key Answer & Core Mechanics
              </span>
              <p className="text-sm sm:text-base text-slate-200 whitespace-pre-line leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80">
          <span>Targeting Requirements: {currentCard.requirement_ids.join(', ')}</span>
          <span className="text-indigo-400 font-medium">{isFlipped ? 'Back' : 'Front'}</span>
        </div>
      </div>

      {/* Confidence Grading Buttons (when card is revealed) */}
      <div className="space-y-3">
        <div className="text-center text-xs text-slate-400 font-medium">
          How confident do you feel on this topic?
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleRate(1)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Struggled (1)</span>
          </button>

          <button
            onClick={() => handleRate(2)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Getting There (2)</span>
          </button>

          <button
            onClick={() => handleRate(3)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mastered (3)</span>
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Card</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
        >
          <span>Next Card</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
