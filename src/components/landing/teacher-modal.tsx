"use client";

import { useState } from "react";
import {
  X,
  Users,
  FileText,
  Search,
  Upload,
  BarChart3,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "classes" | "materials" | "review" | "publish" | "evidence";

export function TeacherModal({ isOpen, onClose }: TeacherModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("classes");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-modal-title"
    >
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-[#0D1838] border border-indigo-500/30 shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/20 bg-[#071126]/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="teacher-modal-title"
                className="text-lg font-bold text-white tracking-tight"
              >
                Teacher Dashboard Prototype
              </h2>
              <p className="text-xs text-slate-400">
                Plan lessons, review student evidence & publish active learning content
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

        {/* Dashboard Shell */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Sidebar */}
          <div className="md:col-span-3 bg-[#071126] border-r border-indigo-500/20 p-4 space-y-2">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Teacher Tools
            </div>

            {[
              { id: "classes", label: "Classes", icon: Users, count: "5" },
              { id: "materials", label: "Materials", icon: FileText, count: "12" },
              { id: "review", label: "Review Drafts", icon: Search, count: "3" },
              { id: "publish", label: "Publish", icon: Upload, count: "8" },
              { id: "evidence", label: "Evidence", icon: BarChart3, count: "89%" },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-300 hover:bg-[#132048] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      activeTab === tab.id
                        ? "bg-indigo-800 text-indigo-100"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <div className="pt-6 px-3 space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/20 text-xs space-y-1">
                <span className="font-bold text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Demo Class Code
                </span>
                <p className="font-mono text-white text-sm">HEAT27</p>
                <p className="text-[10px] text-slate-400">
                  Share code with students to join
                </p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Area */}
          <div className="md:col-span-9 p-6 overflow-y-auto space-y-6 bg-[#0D1838]">
            {/* Header stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">My Classes</h3>
                <p className="text-xs text-slate-400">
                  Overview of active classes and student learning progress
                </p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30">
                <Plus className="w-4 h-4 mr-1.5" /> New class
              </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#132048] border border-indigo-500/20">
                <span className="text-xs text-slate-400">Total Classes</span>
                <p className="text-2xl font-extrabold text-white mt-1">5</p>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Active this term
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#132048] border border-indigo-500/20">
                <span className="text-xs text-slate-400">Enrolled Students</span>
                <p className="text-2xl font-extrabold text-white mt-1">142</p>
                <span className="text-[11px] text-indigo-300 mt-1">
                  Across 3 subjects
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#132048] border border-indigo-500/20">
                <span className="text-xs text-slate-400">Avg Completion</span>
                <p className="text-2xl font-extrabold text-white mt-1">89%</p>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" /> Misconception checks passed
                </span>
              </div>
            </div>

            {/* Content Table / Card View based on activeTab */}
            <div className="p-5 rounded-2xl bg-[#071126] border border-indigo-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <h4 className="text-sm font-bold text-white">Recent Activity & Lessons</h4>
                <span className="text-xs text-slate-400">Fictional Teacher View</span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: "Physics — Heat Transfer",
                    topic: "Conduction & Thermodynamics",
                    students: 32,
                    status: "Review",
                    statusBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                    badge: "Draft Needs Review",
                  },
                  {
                    title: "Biology — Cell Structure",
                    topic: "Mitochondria & ATP Respiration",
                    students: 45,
                    status: "Published",
                    statusBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                    badge: "Live Lesson",
                  },
                  {
                    title: "Chemistry — Chemical Reactions",
                    topic: "Exothermic vs Endothermic",
                    students: 28,
                    status: "Published",
                    statusBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                    badge: "Live Lesson",
                  },
                ].map((lesson, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-[#132048] border border-indigo-500/10 hover:border-indigo-500/30 transition-colors gap-3"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-white">{lesson.title}</h5>
                      <p className="text-xs text-slate-400">{lesson.topic} · {lesson.students} students</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${lesson.statusBg}`}
                      >
                        {lesson.status}
                      </span>
                      <button className="text-xs text-indigo-400 hover:text-white font-semibold flex items-center gap-1">
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
