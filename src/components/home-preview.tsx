"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Home,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoLesson } from "@/lib/lessons/demo";

export function HomePreview() {
  const [dark, setDark] = useState(false);
  const [topic, setTopic] = useState("");
  const [notice, setNotice] = useState("");
  const [showExample, setShowExample] = useState(false);
  const exampleTitle = useRef<HTMLHeadingElement>(null);
  const exampleButton = useRef<HTMLButtonElement>(null);

  function openExample() {
    setShowExample(true);
    requestAnimationFrame(() => exampleTitle.current?.focus());
  }

  return (
    <div className={dark ? "dark workspace" : "workspace"}>
      <a className="skip-link" href="#main">
        Skip to learning space
      </a>
      <aside className="rail" aria-label="Main navigation">
        <a href="#main" aria-label="Errby home" className="brand-mark">
          e<span aria-hidden="true">·</span>
        </a>
        <nav className="rail-links">
          <a href="#main" className="nav-item active">
            <Home size={21} aria-hidden="true" />
            <span>Home</span>
          </a>
          <a href="#lessons" className="nav-item">
            <BookOpen size={21} aria-hidden="true" />
            <span>Lessons</span>
          </a>
        </nav>
        <div className="rail-bottom">
          <span className="avatar" aria-hidden="true">
            D
          </span>
          <span>Demo</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <span className="wordmark">
            errby<span aria-hidden="true">.</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="demo-badge">Local demo</span>
            <Button
              variant="ghost"
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              onClick={() => setDark(!dark)}
            >
              {dark ? (
                <Sun size={20} aria-hidden="true" />
              ) : (
                <Moon size={20} aria-hidden="true" />
              )}
            </Button>
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <section className="start-area" aria-labelledby="welcome">
            <div className="halo" aria-hidden="true" />
            <div className="robot" aria-hidden="true">
              <Bot size={40} strokeWidth={1.6} />
            </div>
            <p className="eyebrow">
              A little curiosity. A clearer understanding.
            </p>
            <h1 id="welcome">
              What are you teaching
              <br className="hidden sm:block" /> Errby today?
            </h1>
            <p className="intro">
              Bring an idea. Explain it in your own words.
            </p>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                setNotice(
                  "Your topic stays here while you explore. Lesson preparation is not connected in this preview; open the fictional example below.",
                );
              }}
            >
              <label htmlFor="topic">Your topic or learning material</label>
              <textarea
                id="topic"
                name="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="For example, why does ice melt in a warm room?"
                maxLength={30_000}
                required
                rows={3}
                aria-describedby="composer-note"
              />
              <div className="composer-footer">
                <span id="composer-note">
                  Preview only · text stays in this tab
                </span>
                <Button type="submit">
                  Preview topic <ArrowRight size={18} aria-hidden="true" />
                </Button>
              </div>
            </form>
            <p role="status" className="preview-notice">
              {notice ||
                "Fictional fixtures · no account, uploads or AI calls · nothing is saved"}
            </p>
          </section>

          <section
            id="lessons"
            className="lessons"
            aria-labelledby="lessons-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">A place to begin</p>
                <h2 id="lessons-heading">Explore a sample lesson</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                Middle school · English
              </span>
            </div>
            <article className="lesson-card">
              <div className="lesson-icon">
                <BookOpen size={25} aria-hidden="true" />
              </div>
              <div className="lesson-copy">
                <h3>{demoLesson.title}</h3>
                <p>Heat transfer · 3 learning goals</p>
                <span className="draft-label">
                  Illustrative draft · needs teacher review
                </span>
              </div>
              <Button
                ref={exampleButton}
                variant="outline"
                onClick={openExample}
              >
                Open example <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </article>
          </section>

          {showExample && (
            <section className="example" aria-labelledby="example-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Fictional lesson preview</p>
                  <h2 ref={exampleTitle} tabIndex={-1} id="example-title">
                    {demoLesson.title}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowExample(false);
                    exampleButton.current?.focus();
                  }}
                >
                  Close example
                </Button>
              </div>
              <p className="mb-5 text-muted-foreground">
                No answers are assessed. This draft has no verified source or
                teacher approval.
              </p>
              <div className="example-grid">
                <div className="space-y-4">
                  <article className="errby-message">
                    <h3>
                      <Bot size={20} aria-hidden="true" /> Errby
                    </h3>
                    <p>{demoLesson.initial_question}</p>
                  </article>
                  <article className="supervisor-message">
                    <h3>
                      <ShieldCheck size={20} aria-hidden="true" /> Supervisor
                    </h3>
                    <strong>Reference review needed</strong>
                    <p>
                      This sample has not been reviewed. I can’t verify an
                      explanation against it yet.
                    </p>
                  </article>
                </div>
                <aside className="goals" aria-label="Sample learning goals">
                  <h3>What you’ll explain</h3>
                  <ul>
                    {demoLesson.objectives.map((goal) => (
                      <li key={goal.id}>
                        <span className="goal-dot" aria-hidden="true" />
                        <div>
                          {goal.title}
                          <span>Not yet tried</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Check size={17} aria-hidden="true" /> 0 of 3 goals
                    explained
                  </p>
                </aside>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <ShieldCheck size={16} aria-hidden="true" />
            <p>
              Errby asks questions. A separate Supervisor helps check
              understanding.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
