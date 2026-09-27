"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    num: "01",
    title: "Errby Poses a Question",
    subtitle: "AI initiates active recall",
    desc: "Instead of spitting out an answer, Errby prompts the learner with an open-ended question targeted at their topic.",
    badge: "Step 1 · Question",
    mockMessage: "Why does an ice cube melt in a warm room?",
    mockSpeaker: "Errby AI",
  },
  {
    num: "02",
    title: "Student Explains in Own Words",
    subtitle: "Learner articulates reasoning",
    desc: "The student types their understanding. Articulating concepts in natural language builds neural retention faster than reading.",
    badge: "Step 2 · Explanation",
    mockMessage: "Heat energy moves from the warmer room air into the ice.",
    mockSpeaker: "Student",
  },
  {
    num: "03",
    title: "Errby Introduces Intentional Misconception",
    subtitle: "Deliberate challenge to test critical thinking",
    desc: "Errby intentionally responds with a subtle mistake or common misconception to test if the student truly understands.",
    badge: "Step 3 · Deliberate Mistake",
    mockMessage: "So the ice makes its own heat energy to warm up?",
    mockSpeaker: "Errby AI",
  },
  {
    num: "04",
    title: "Student Spots & Corrects the Error",
    subtitle: "Active evaluation & error-spotting",
    desc: "The student identifies the flaw in Errby's logic and provides the correct scientific rationale.",
    badge: "Step 4 · Spot & Correct",
    mockMessage: "No! Cold objects don't generate heat. Energy only flows from warm to cold.",
    mockSpeaker: "Student",
  },
  {
    num: "05",
    title: "Supervisor System Verification",
    subtitle: "Independent layer prevents hallucinated facts",
    desc: "The Supervisor verifies the final scientific claim, flags residual uncertainty, and locks in deep understanding.",
    badge: "Step 5 · Supervisor Shield",
    mockMessage: "✓ Fact Checked: Thermal energy flow verified by Supervisor.",
    mockSpeaker: "Supervisor System",
  },
];

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentStep = STEPS[activeStep];

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % STEPS.length);
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev - 1 + STEPS.length) % STEPS.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#0D1838] border border-indigo-500/30 shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-500/20 bg-[#071126]/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40">
              <Play className="w-4 h-4 fill-purple-400" />
            </div>
            <div>
              <h2
                id="video-modal-title"
                className="text-lg font-bold text-white tracking-tight"
              >
                How Errby Works · Interactive Walkthrough (1:12)
              </h2>
              <p className="text-xs text-slate-400">
                A visual explanation of the 5-step learning loop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Visual Presentation Screen */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video w-full rounded-2xl bg-[#050B19] border border-indigo-500/30 overflow-hidden shadow-xl p-5 flex flex-col justify-between">
              {/* Top Bar of Screen */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-indigo-500/20 pb-3">
                <span className="flex items-center gap-2 font-mono text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ERRBY INTERACTIVE LEARNING ENGINE
                </span>
                <span className="font-semibold text-purple-300">
                  {currentStep.badge}
                </span>
              </div>

              {/* Animated Scene Content */}
              <div className="my-auto space-y-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="relative w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/errby-mascot.png"
                      alt="Errby"
                      fill
                      className="object-contain p-1.5"
                    />
                  </div>
                  <div className="flex-1 bg-[#121f45] border border-indigo-500/30 rounded-2xl p-4 shadow-lg animate-in slide-in-from-left duration-300">
                    <div className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center justify-between">
                      <span>{currentStep.mockSpeaker}</span>
                      <span className="text-slate-500">Step {activeStep + 1} of 5</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      "{currentStep.mockMessage}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Player Timeline Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Phase {activeStep + 1}: {currentStep.title}</span>
                  <span>{Math.round(((activeStep + 1) / 5) * 72)}s / 72s</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                  {STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`h-full flex-1 border-r border-slate-950 transition-colors ${
                        idx <= activeStep ? "bg-indigo-500" : "bg-slate-800"
                      }`}
                      title={`Jump to step ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-[#132048] hover:bg-[#1b2c63] border border-indigo-500/20 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                ← Previous Step
              </button>

              <div className="flex items-center gap-1.5">
                {STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === activeStep
                        ? "bg-indigo-400 w-6"
                        : "bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center gap-1"
              >
                Next Step →
              </button>
            </div>
          </div>

          {/* Explanation sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-[#071126] border border-indigo-500/20 space-y-4">
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-500/30">
                Phase 0{activeStep + 1}
              </span>

              <h3 className="text-xl font-bold text-white leading-tight">
                {currentStep.title}
              </h3>

              <p className="text-xs font-semibold text-indigo-300">
                {currentStep.subtitle}
              </p>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentStep.desc}
              </p>

              <div className="pt-4 border-t border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Builds genuine deep understanding</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Prevents AI hallucination dependency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
