"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Atom,
  Binary,
  Dna,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubjectId = "physics" | "maths" | "cs" | "biology";

interface SubjectData {
  id: SubjectId;
  name: string;
  topic: string;
  icon: typeof Atom;
  question: string;
  presetAnswers: string[];
  misconception: string;
  misconceptionBadge: string;
  corrections: { text: string; correct: boolean }[];
  explanation: string;
}

const SUBJECTS: SubjectData[] = [
  {
    id: "physics",
    name: "Physics",
    topic: "Heat Transfer & Thermodynamics",
    icon: Atom,
    question: "Why does an ice cube melt when left on a table in a warm room?",
    presetAnswers: [
      "Heat energy flows from the warmer room air into the cooler ice cube until equilibrium.",
      "The ice absorbs coldness from the surrounding atmosphere.",
      "The ice cube loses its solid shape due to gravity pressing down on it.",
    ],
    misconception:
      "Ah! So the ice cube generates its own internal heat energy to warm itself up from inside?",
    misconceptionBadge: "Deliberate Misconception",
    corrections: [
      {
        text: "No! Cold objects do not generate heat. Thermal energy only flows from warmer objects (the room) to cooler ones (the ice).",
        correct: true,
      },
      {
        text: "Yes, exactly! Ice has hidden internal heat engines that activate in warm air.",
        correct: false,
      },
    ],
    explanation:
      "Heat naturally transfers down temperature gradients (from high to low energy). Cold is simply the absence of heat energy!",
  },
  {
    id: "maths",
    name: "Maths",
    topic: "Quadratic Equations & Roots",
    icon: Binary,
    question: "How many real solutions does x² = -9 have?",
    presetAnswers: [
      "It has zero real solutions, because the square of any real number is always non-negative.",
      "It has two real solutions: x = 3 and x = -3.",
      "It has one solution: x = 0.",
    ],
    misconception:
      "So since (-3) × (-3) = -9, x = -3 must be a valid real solution, right?",
    misconceptionBadge: "Deliberate Misconception",
    corrections: [
      {
        text: "No! Negative times negative equals positive (+9), so (-3)² is +9, not -9. There are no real numbers whose square is negative.",
        correct: true,
      },
      {
        text: "Yes, that's right! Multiplying two negative numbers keeps the minus sign.",
        correct: false,
      },
    ],
    explanation:
      "Squaring any real number yields a non-negative result. Solutions to x² = -9 require imaginary numbers (±3i).",
  },
  {
    id: "cs",
    name: "Computer Science",
    topic: "Binary Search vs Linear Search",
    icon: BookOpen,
    question:
      "Why is Binary Search faster than Linear Search for a sorted list of 1,000,000 items?",
    presetAnswers: [
      "Binary Search cuts the search space in half each step (O(log n)), requiring at most ~20 comparisons.",
      "Binary Search checks all 1,000,000 elements simultaneously using parallel processor cores.",
      "Linear search skips even numbers so it takes double the time.",
    ],
    misconception:
      "So Binary Search takes only 20 steps because it checks every 20th item in order?",
    misconceptionBadge: "Deliberate Misconception",
    corrections: [
      {
        text: "No! Binary Search compares the middle element and eliminates half of the remaining array every step, not every 20th item.",
        correct: true,
      },
      {
        text: "Yes, it steps forward by 20 items until it stumbles across the target value.",
        correct: false,
      },
    ],
    explanation:
      "Logarithmic time complexity O(log₂ 1,000,000) ≈ 20 operations because halving 1,000,000 twenty times reduces the set to 1.",
  },
  {
    id: "biology",
    name: "Biology",
    topic: "Cellular Respiration & Mitochondria",
    icon: Dna,
    question: "What is the main purpose of cellular respiration in human cells?",
    presetAnswers: [
      "To break down glucose to generate ATP energy for cellular processes.",
      "To produce carbon dioxide that our lungs need to breathe in.",
      "To cool down body tissues during physical exercise.",
    ],
    misconception:
      "Got it! So respiration is just the mechanical act of lungs breathing air in and out?",
    misconceptionBadge: "Deliberate Misconception",
    corrections: [
      {
        text: "No! Breathing is ventilation. Cellular respiration is a chemical metabolic process inside mitochondria that yields ATP energy.",
        correct: true,
      },
      {
        text: "Yes, respiration and breathing are identical physical words for air moving through windpipes.",
        correct: false,
      },
    ],
    explanation:
      "Ventilation (breathing) supplies oxygen to cells, where mitochondria perform chemical cellular respiration to synthesize ATP.",
  },
];

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectData>(
    SUBJECTS[0]
  );
  const [step, setStep] = useState<"choose" | "answer" | "spot" | "complete">(
    "choose"
  );
  const [userExplanation, setUserExplanation] = useState<string>("");
  const [selectedCorrection, setSelectedCorrection] = useState<number | null>(
    null
  );
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleSelectSubject = (subj: SubjectData) => {
    setSelectedSubject(subj);
    setStep("answer");
    setUserExplanation("");
    setSelectedCorrection(null);
    setIsCorrect(null);
  };

  const handlePresetAnswer = (ans: string) => {
    setUserExplanation(ans);
  };

  const handleSendExplanation = () => {
    if (!userExplanation.trim()) return;
    setStep("spot");
  };

  const handlePickCorrection = (index: number, correct: boolean) => {
    setSelectedCorrection(index);
    setIsCorrect(correct);
  };

  const handleFinishSpot = () => {
    if (isCorrect) {
      setStep("complete");
    }
  };

  const handleReset = () => {
    setStep("choose");
    setUserExplanation("");
    setSelectedCorrection(null);
    setIsCorrect(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#0D1838] border border-indigo-500/30 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-500/20 bg-[#071126]/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2
                id="demo-modal-title"
                className="text-lg font-bold text-white tracking-tight"
              >
                Errby Active Learning Demo
              </h2>
              <p className="text-xs text-slate-400">
                Experience how students learn by explaining & spotting mistakes
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

        {/* Progress bar */}
        <div className="w-full bg-slate-900/60 h-1.5 flex">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-300"
            style={{
              width:
                step === "choose"
                  ? "25%"
                  : step === "answer"
                  ? "50%"
                  : step === "spot"
                  ? "75%"
                  : "100%",
            }}
          />
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: CHOOSE SUBJECT */}
          {step === "choose" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-2 py-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Step 1 of 3 · Pick a Topic
                </span>
                <h3 className="text-2xl font-bold text-white">
                  What subject would you like to explore?
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Select a topic to launch an interactive Errby teaching loop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUBJECTS.map((subj) => {
                  const Icon = subj.icon;
                  return (
                    <button
                      key={subj.id}
                      onClick={() => handleSelectSubject(subj)}
                      className="group relative flex flex-col items-start p-5 rounded-2xl bg-[#132048] border border-indigo-500/20 hover:border-indigo-400/60 hover:bg-[#192a5d] text-left transition-all duration-200 shadow-lg hover:shadow-indigo-500/10"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-500/30">
                          {subj.name}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-indigo-200">
                        {subj.topic}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        "{subj.question}"
                      </p>
                      <div className="mt-4 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Start this example <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ERRBY ASKS & STUDENT EXPLAINS */}
          {step === "answer" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Step 2 of 3 · Your Explanation
                </span>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Switch topic
                </button>
              </div>

              {/* Chat Turn 1: Errby Question */}
              <div className="flex items-start gap-3">
                <div className="relative w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 overflow-hidden flex-shrink-0">
                  <Image
                    src="/images/errby-mascot.png"
                    alt="Errby"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex-1 bg-[#132048] border border-indigo-500/30 rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-300">
                      Errby AI
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selectedSubject.name} · {selectedSubject.topic}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {selectedSubject.question}
                  </p>
                </div>
              </div>

              {/* Input Area / Presets */}
              <div className="bg-[#071126] border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Explain your understanding in your own words:
                </label>
                <textarea
                  value={userExplanation}
                  onChange={(e) => setUserExplanation(e.target.value)}
                  placeholder="Type your explanation here..."
                  className="w-full bg-[#0D1838] border border-indigo-500/30 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 min-h-[90px]"
                />

                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-medium">
                    Or select a suggested response:
                  </span>
                  <div className="space-y-2">
                    {selectedSubject.presetAnswers.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePresetAnswer(preset)}
                        className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                          userExplanation === preset
                            ? "bg-indigo-600/30 border-indigo-400 text-white font-medium"
                            : "bg-[#101c40] border-indigo-500/20 text-slate-300 hover:border-indigo-400/40 hover:text-white"
                        }`}
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSendExplanation}
                    disabled={!userExplanation.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    Submit Explanation <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ERRBY MAKES A DELIBERATE MISTAKE & STUDENT SPOTS IT */}
          {step === "spot" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Step 3 of 3 · Spot the Misconception
                </span>
                <span className="text-xs text-slate-400">
                  Errby gets things wrong on purpose!
                </span>
              </div>

              {/* Chat history */}
              <div className="space-y-4">
                {/* Student explanation */}
                <div className="flex items-start justify-end gap-3">
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 max-w-[85%]">
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <span className="text-xs font-bold text-slate-300">
                        You (Student)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Explanation Submitted
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">{userExplanation}</p>
                  </div>
                </div>

                {/* Errby deliberate mistake */}
                <div className="flex items-start gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/errby-mascot.png"
                      alt="Errby"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 bg-[#1c1833] border border-amber-500/40 rounded-2xl p-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        Errby AI
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⚡ {selectedSubject.misconceptionBadge}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      "{selectedSubject.misconception}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Correction options */}
              <div className="bg-[#071126] border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Can you catch Errby's mistake? Select the accurate response:
                </h4>

                <div className="space-y-3">
                  {selectedSubject.corrections.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        handlePickCorrection(idx, option.correct)
                      }
                      className={`w-full text-left p-4 rounded-xl text-xs transition-all border ${
                        selectedCorrection === idx
                          ? option.correct
                            ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium"
                            : "bg-rose-950/60 border-rose-500 text-rose-200 font-medium"
                          : "bg-[#101c40] border-indigo-500/20 text-slate-300 hover:border-indigo-400/40 hover:text-white"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                            selectedCorrection === idx
                              ? option.correct
                                ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                : "bg-rose-500 border-rose-400 text-white"
                              : "border-slate-600"
                          }`}
                        >
                          {selectedCorrection === idx &&
                            (option.correct ? "✓" : "✕")}
                        </div>
                        <span>{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Feedback state */}
                {selectedCorrection !== null && (
                  <div
                    className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
                      isCorrect
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-950/40 border-rose-500/40 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span className="font-bold text-sm">
                        {isCorrect
                          ? "Spot On! Misconception Corrected!"
                          : "Not quite right. Try again!"}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">
                      {isCorrect
                        ? selectedSubject.explanation
                        : "Errby's claim contains a logical flaw. Read the choices carefully to spot why heat or numbers behave differently."}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <button
                    onClick={() => setStep("answer")}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Edit explanation
                  </button>
                  <Button
                    onClick={handleFinishSpot}
                    disabled={!isCorrect}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    Complete Mastery Check <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETE SUMMARY */}
          {step === "complete" && (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto">
                <ShieldCheck className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                  ✓ Concept Mastered
                </span>
                <h3 className="text-3xl font-extrabold text-white">
                  Outstanding Critical Thinking!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  You successfully articulated your understanding, spotted
                  Errby's deliberate mistake, and corrected it.
                </p>
              </div>

              {/* Summary Stats Card */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#071126] border border-indigo-500/30 text-left">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Topic
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {selectedSubject.topic}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Misconception Spot
                  </span>
                  <p className="text-xs font-bold text-emerald-400">
                    100% Correct
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Supervisor Status
                  </span>
                  <p className="text-xs font-bold text-indigo-400">
                    Fact Checked
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-indigo-500/30 bg-[#132048] hover:bg-[#1b2c63] text-xs font-semibold text-white transition-colors"
                >
                  Try Another Topic
                </button>
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25"
                >
                  <Link href="/learn">
                    Open Full Workspace <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
