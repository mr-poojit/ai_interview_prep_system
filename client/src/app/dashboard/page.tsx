'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { KitRecord } from '../../lib/types';
import {
  PlusCircle,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2,
  BookOpen,
  Mic,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [kits, setKits] = useState<KitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchJson, setBatchJson] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');

  const fetchKits = async () => {
    try {
      setIsLoading(true);
      const res = await api.getKits();
      setKits(res.kits);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load kits';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchKits();
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prep kit?')) return;

    try {
      await api.deleteKit(id);
      setKits((prev) => prev.filter((k) => k.id !== id));
    } catch (err: unknown) {
      alert('Failed to delete kit');
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError('');
    setBatchLoading(true);

    try {
      const parsed = JSON.parse(batchJson);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of { jd, company_url, days }');
      }

      await api.batchUpload(parsed);
      setIsBatchModalOpen(false);
      setBatchJson('');
      await fetchKits();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse or submit batch JSON';
      setBatchError(message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBatchJson(content);
    };
    reader.readAsText(file);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading your preparation kits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Interview Prep Kits</h1>
          <p className="text-sm text-slate-400 mt-1">Manage, reshape, and practice against your personalized kits</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Batch Upload</span>
          </button>

          <Link
            href="/kit/new"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Kit</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Kit Grid or Empty State */}
      {kits.length === 0 ? (
        <div className="my-auto py-16 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No prep kits generated yet</h3>
          <p className="text-sm text-slate-400 mt-2">
            Paste a job description and company website to watch our autonomous pipeline generate your structured kit.
          </p>
          <div className="mt-6">
            <Link
              href="/kit/new"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Your First Kit</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {kits.map((item) => {
            const { kit } = item;
            const mustReqs = kit.role.requirements.filter((r) => r.priority === 'must');
            const uncoveredCount = kit.coverage.uncovered_requirement_ids.length;

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all hover:shadow-xl hover:shadow-black/40"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {kit.source.company || 'Target Company'}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {kit.role.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {kit.role.seniority} • {kit.source.location}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-4 line-clamp-2 leading-relaxed">
                    {kit.company_brief.what_they_do || kit.company_brief.summary}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{kit.schedule.days_available} Days</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      <span>{kit.questions.length} Questions</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {uncoveredCount === 0 ? '100% Must Covered' : `${uncoveredCount} Gaps`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Passes: {kit.coverage.passes}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/kit/${item.id}`}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Kit Builder</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>

                  <Link
                    href={`/kit/${item.id}/practice`}
                    className="flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                    title="Practice Flashcards & Mock Interview"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Practice</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Upload Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Batch Role Upload</h2>
            <p className="text-xs text-slate-400 mt-1">
              Prepare for multiple roles simultaneously by uploading a JSON file or pasting an array of{' '}
              <code className="text-indigo-400 bg-indigo-950/60 px-1 py-0.5 rounded">{'{ jd, company_url, days }'}</code>
            </p>

            {batchError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {batchError}
              </div>
            )}

            <form onSubmit={handleBatchSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Upload JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Or Paste JSON Content</label>
                <textarea
                  rows={8}
                  value={batchJson}
                  onChange={(e) => setBatchJson(e.target.value)}
                  placeholder={`[\n  {\n    "jd": "Senior Go Engineer...",\n    "company_url": "https://example.com",\n    "days": 5\n  }\n]`}
                  className="w-full font-mono text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchLoading || !batchJson.trim()}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {batchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Run Batch Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
