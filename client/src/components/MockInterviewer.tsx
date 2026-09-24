'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../lib/types';
import { api } from '../lib/api';
import {
  Mic,
  MicOff,
  Clock,
  Send,
  Loader2,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface MockInterviewerProps {
  kitId: string;
  questions: Question[];
  initialQuestionId?: string;
}

export const MockInterviewer: React.FC<MockInterviewerProps> = ({
  kitId,
  questions,
  initialQuestionId,
}) => {
  const [selectedQId, setSelectedQId] = useState<string>(
    initialQuestionId || questions[0]?.id || ''
  );
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evalError, setEvalError] = useState('');

  const recognitionRef = useRef<any>(null);

  const selectedQuestion = questions.find((q) => q.id === selectedQId) || questions[0];

  // Initialize Speech Recognition if supported by browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setAnswerText((prev) => prev + ' ' + transcript);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setIsRecording(false);
      recognitionRef.current?.stop();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const toggleRecording = () => {
    if (!isRecording) {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        setTimerActive(true);
      } catch {
        // Fallback if mic permission not granted
        setTimerActive(true);
      }
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const resetSession = () => {
    setAnswerText('');
    setTimeLeft(120);
    setTimerActive(false);
    setIsRecording(false);
    setEvaluation(null);
    setEvalError('');
    recognitionRef.current?.stop();
  };

  const handleEvaluate = async () => {
    if (!answerText.trim()) return;

    setIsEvaluating(true);
    setEvalError('');
    setTimerActive(false);
    setIsRecording(false);
    recognitionRef.current?.stop();

    try {
      const res = await api.mockEvaluate(kitId, selectedQuestion.id, answerText);
      setEvaluation(res.evaluation);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Evaluation failed';
      setEvalError(message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Live AI Mock Interview Room</h2>
            <p className="text-xs text-slate-400">Speak or write your response under timed simulation conditions</p>
          </div>
        </div>

        {/* Question Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400">Question:</label>
          <select
            value={selectedQId}
            onChange={(e) => {
              setSelectedQId(e.target.value);
              resetSession();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                [{q.id.toUpperCase()}] {q.category} - {q.prompt.slice(0, 50)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Question Display */}
      {selectedQuestion && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
            <span>Interview Prompt ({selectedQuestion.category})</span>
            <span>Difficulty: {selectedQuestion.difficulty}/3</span>
          </div>
          <p className="text-lg font-semibold text-white leading-relaxed">
            "{selectedQuestion.prompt}"
          </p>
        </div>
      )}

      {/* Answer & Recording Interface */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleRecording}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Stop Recording' : 'Speak (Microphone)'}</span>
            </button>

            {isRecording && (
              <span className="text-xs text-red-400 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>Transcribing live...</span>
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center space-x-2 text-sm font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className={timeLeft < 30 ? 'text-red-400 font-bold' : ''}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <textarea
          rows={6}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Speak into your microphone or type your complete verbal response here..."
          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
        />

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={resetSession}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear / Reset
          </button>

          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !answerText.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Response...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Submit for AI Rubric Critique</span>
              </>
            )}
          </button>
        </div>
      </div>

      {evalError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {evalError}
        </div>
      )}

      {/* AI Evaluation Report */}
      {evaluation && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Interview Performance Critique</h3>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
              Scored Against Official Rubric
            </span>
          </div>

          {/* Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-2xl font-black text-indigo-400">{evaluation.accuracy_score}/10</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Technical Accuracy</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-2xl font-black text-violet-400">{evaluation.structure_score}/10</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Structure & STAR Flow</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-2xl font-black text-emerald-400">{evaluation.delivery_score}/10</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Delivery & Tone</div>
            </div>
          </div>

          {/* Feedback Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>What You Articulated Well</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {evaluation.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Points Missed or Vague</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {evaluation.missing_points?.map((m: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{m}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Exemplar Model Answer */}
          {evaluation.improved_answer_sample && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Exemplar 60-Second Polished Response
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line italic">
                "{evaluation.improved_answer_sample}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
