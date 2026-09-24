'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import {
  Sparkles,
  Globe,
  FileText,
  Calendar,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  ShieldCheck,
} from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, label: 'Requirement Extraction', desc: 'Parsing must-have vs nice-to-have competencies' },
  { id: 2, label: 'Heuristic Web Crawling', desc: 'Ranking site links for hiring handbooks & culture' },
  { id: 3, label: 'Public Discussion Retrieval', desc: 'Searching Glassdoor/Reddit interview feedback' },
  { id: 4, label: 'Company Intelligence Brief', desc: 'Objective synthesis of products & tech stacks' },
  { id: 5, label: 'Category Question Generation', desc: 'Technical, Behavioural, System Design & Fit' },
  { id: 6, label: 'Deterministic Coverage Pass', desc: 'Executing Second Pass loop to close must-have gaps' },
  { id: 7, label: 'Flashcard Synthesis', desc: 'Generating rapid-fire high-yield study cards' },
  { id: 8, label: 'Schedule Arithmetic', desc: 'Allocating syllabus across requested days' },
];

export default function NewKitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [days, setDays] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');

  const sampleJd = `Staff Software Engineer - Infrastructure & Distributed Systems

About the Role:
We are looking for a Staff Software Engineer to lead architecture for our high-throughput data ingestion platform.

Requirements:
- 7+ years of experience designing and scaling distributed systems in Go or Rust (Required)
- Deep expertise in Kafka, gRPC, and PostgreSQL optimization (Required)
- Proven experience mentoring senior engineers and leading cross-team architectural reviews (Required)
- Strong background with Kubernetes and AWS infrastructure (Required)
- Nice to have: Experience with ClickHouse or high-cardinality time-series databases.
- Bonus points for open source contributions.`;

  const handleFillSample = () => {
    setJd(sampleJd);
    setCompanyUrl('https://posthog.com');
    setDays(7);
  };

  const handleFillStub = () => {
    setJd('Senior Python backend engineer needed for microservice data pipelines.');
    setCompanyUrl('https://example.com');
    setDays(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      router.push('/login');
      return;
    }

    if (jd.trim().length < 10) {
      setError('Please provide a substantive job description.');
      return;
    }

    if (!companyUrl.trim()) {
      setError('Please provide the company website URL.');
      return;
    }

    setIsGenerating(true);
    setActiveStep(1);

    // Simulate animated stepper progress during long generation
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 8 ? prev + 1 : prev));
    }, 1800);

    try {
      const { kitRecord } = await api.generateKit(jd, companyUrl, days);
      clearInterval(interval);
      setActiveStep(8);
      setTimeout(() => {
        router.push(`/kit/${kitRecord.id}`);
      }, 600);
    } catch (err: unknown) {
      clearInterval(interval);
      const message = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setError(message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-1">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Interview Prep Kit</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          Paste the job posting and company URL. The autonomous pipeline will research, synthesize, and structure your kit.
        </p>

        {/* Quick sample pills - responsive wrap */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs text-slate-500 font-medium">Quick Test Fixtures:</span>
          <button
            type="button"
            onClick={handleFillSample}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer text-left"
          >
            PostHog Staff Engineer (Full Spec)
          </button>
          <button
            type="button"
            onClick={handleFillStub}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            2-Line Stub Test Case
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Pipeline Execution Halted</div>
            <div className="text-xs mt-0.5 leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {isGenerating ? (
        /* Observable Pipeline Stepper */
        <div className="p-5 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="text-center max-w-md mx-auto mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Synthesizing Your Prep Kit</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Executing deterministic multi-step research and verification...
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3 max-w-lg mx-auto">
            {PIPELINE_STEPS.map((step) => {
              const isCompleted = step.id < activeStep;
              const isCurrent = step.id === activeStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-start space-x-3 p-2.5 sm:p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/40 shadow-sm'
                      : isCompleted
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      : 'border-transparent opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {step.id}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200">{step.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Form Inputs */
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 sm:space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Job Description (Pasted Text)</span>
                </label>
                <span className="text-[11px] text-slate-500">{jd.length} chars</span>
              </div>
              <textarea
                required
                rows={8}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the complete job description here, including responsibilities, requirements, and preferred qualifications..."
                className="w-full p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Company Website Address</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  We crawl the homepage, discover career handbooks, and inspect robots.txt.
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Prep Timeline ({days} Days)</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                  <span>1 Day (Intensive)</span>
                  <span className="font-semibold text-indigo-400">{days} Days</span>
                  <span>30 Days (Spaced)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 sm:px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Start Autonomous Research & Build Kit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
