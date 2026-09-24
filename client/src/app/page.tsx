'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Brain,
  Calendar,
  Layers,
  Mic,
  FileText,
  RotateCcw,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-36">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[320px] sm:h-[600px] bg-gradient-to-tr from-indigo-600/20 to-violet-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Autonomous Intelligence for Job Seekers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Any Job Description Into a{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent block sm:inline">
              Personalized Prep Kit
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-sm sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Paste the job requirements, provide the company website, and set your timeline.
            Our multi-stage pipeline crawls company hiring signals, tests public interview discussions,
            guarantees must-have coverage with a second pass, and schedules your day-by-day plan.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              href="/kit/new"
              className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Generate My Prep Kit</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center space-x-2 px-6 sm:px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm sm:text-base border border-slate-800 transition-colors"
            >
              <span>View Saved Kits</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Deliberate Pipeline Breakdown */}
      <section className="py-14 sm:py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
              Built on a Sequence of Deliberate Research Steps
            </h2>
            <p className="mt-2.5 sm:mt-3 text-slate-400 text-xs sm:text-base">
              No single prompt hallucinating answers. Every kit is engineered through an observable, multi-pass sequence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 sm:mb-5">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">1. Heuristic Crawler & Discovery</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Ranks internal site links to discover career handbooks, engineering blogs, and culture values while strictly respecting robots.txt and SSRF safety.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 sm:mb-5">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">2. Deterministic Second Pass</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Code-level set verification checks extracted must-haves against questions. Any missing requirement triggers an automatic Second Pass loop.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 sm:mb-5">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">3. Arithmetic Schedule Allocation</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Mathematical distribution allocates topics across your exact days. Harder system-design and must-have challenges are front-loaded early.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights: Builder, Practice & Mock Simulator */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold mb-3 sm:mb-4">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>State-Preserving Kit Builder</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Reshape Any Section Without Losing Manual Edits
              </h2>
              <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-400 leading-relaxed">
                Edit questions inline, reorder topics, pin critical items, or move questions across categories.
                When you click <span className="text-indigo-400 font-medium">"Regenerate Category"</span>, your hand-crafted
                prompts, customized answers, and pinned items survive untouched.
              </p>

              <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
                <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Inline content editing with immediate state responsiveness</span>
                </div>
                <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Category-level regeneration with provenance tracking</span>
                </div>
                <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Multi-role batch file upload for preparing multiple applications at once</span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-800 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  <span className="font-semibold text-white text-xs sm:text-sm">Interactive AI Mock Interviewer</span>
                </div>
                <span className="text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-medium">
                  Voice & Text
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed italic">
                "Explain how you design a fault-tolerant message stream handling 50k RPS with zero message loss."
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-indigo-400 font-semibold">
                  <span>Candidate Score: 9/10</span>
                  <span>STAR Format Verified</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
                  Strengths: Explicitly covered consumer offsets, dead-letter queues, and partition rebalancing.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Printable Cheat Sheet ready</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
