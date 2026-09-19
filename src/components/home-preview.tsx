"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Home,
  Moon,
  Paperclip,
  Sun,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoLesson } from "@/lib/lessons/demo";
import {
  getPreparationDraft,
  setPreparationDraft,
} from "@/lib/home/preparation-draft";
import "./home-workspace.css";

export type HomeLesson = {
  id: string;
  title: string;
  initial_question: string;
  objectives: { id: string; title: string }[];
};

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function HomePreview({
  lessons = [demoLesson],
}: {
  lessons?: HomeLesson[];
}) {
  const router = useRouter();
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const [topic, setTopic] = useState(getPreparationDraft);
  const [notice, setNotice] = useState("");
  const [scenario, setScenario] = useState("returning");
  const [selectedLesson, setSelectedLesson] = useState<HomeLesson | null>(null);
  const exampleTitle = useRef<HTMLHeadingElement>(null);
  const exampleButton = useRef<HTMLButtonElement>(null);
  const topicInput = useRef<HTMLTextAreaElement>(null);

  function openExample(lesson: HomeLesson, button: HTMLButtonElement) {
    exampleButton.current = button;
    setSelectedLesson(lesson);
    requestAnimationFrame(() => exampleTitle.current?.focus());
  }

  function prepare() {
    setPreparationDraft(topic);
    router.push("/prepare");
  }

  return (
    <div className="workspace home-workspace">
      <a className="skip-link" href="#main">
        Skip to learning space
      </a>
      <aside className="rail">
        <a href="#main" aria-label="Errby home" className="brand-mark">
          e<span aria-hidden="true">·</span>
        </a>
        <nav className="rail-links" aria-label="Main navigation">
          <a href="#main" className="nav-item active" aria-current="page">
            <Home size={21} aria-hidden="true" />
            <span>Home</span>
          </a>
          <a href="#lessons" className="nav-item">
            <BookOpen size={21} aria-hidden="true" />
            <span>Lessons</span>
          </a>
          <Link
            href="/prepare"
            className="nav-item"
            onClick={() => setPreparationDraft(topic)}
          >
            <Paperclip size={21} aria-hidden="true" />
            <span>Prepare</span>
          </Link>
          <Link
            href="/setup"
            className="nav-item"
            onClick={() => setPreparationDraft(topic)}
          >
            <UserRound size={21} aria-hidden="true" />
            <span>Account</span>
          </Link>
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
              type="button"
              variant="ghost"
              size="icon"
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              onClick={() => {
                document.documentElement.classList.toggle("dark", !dark);
                document.documentElement.style.colorScheme = dark
                  ? "light"
                  : "dark";
              }}
            >
              {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
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
                if (!topic.trim()) {
                  setNotice(
                    "Enter a topic or paste fictional learning material first.",
                  );
                  topicInput.current?.focus();
                  return;
                }
                prepare();
              }}
            >
              <label htmlFor="topic">Your topic or learning material</label>
              <textarea
                id="topic"
                ref={topicInput}
                name="topic"
                value={topic}
                onChange={(event) => {
                  setTopic(event.target.value);
                  setNotice("");
                }}
                placeholder="For example, why does ice melt in a warm room?"
                maxLength={30_000}
                required
                rows={3}
                aria-describedby="composer-note composer-status"
              />
              <div className="composer-footer">
                <span id="composer-note">
                  Fictional text only · draft clears on refresh. Links are not
                  imported.
                </span>
                <Button type="button" variant="outline" onClick={prepare}>
                  <Paperclip size={18} aria-hidden="true" /> Add material
                </Button>
                <Button type="submit">
                  Prepare lesson <ArrowRight size={18} aria-hidden="true" />
                </Button>
              </div>
            </form>
            <p id="composer-status" role="status" className="preview-notice">
              {notice ||
                "Local demo · real text/sample PDF extraction · no account, saved lesson or AI calls"}
            </p>
          </section>

          <section
            id="lessons"
            tabIndex={-1}
            className="lessons"
            aria-labelledby="lessons-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Fictional workspace examples</p>
                <h2 id="lessons-heading" tabIndex={-1}>
                  Your class lessons
                </h2>
              </div>
              <label className="home-scenario">
                Preview scenario
                <select
                  value={scenario}
                  onChange={(event) => {
                    setScenario(event.target.value);
                    setSelectedLesson(null);
                  }}
                >
                  <option value="returning">Returning learner</option>
                  <option value="new">New learner · no class</option>
                  <option value="preparing">Preparation in progress</option>
                </select>
              </label>
            </div>
            <p className="home-fixture-note">
              Fictional, unreviewed examples · no class membership or learner
              progress is recorded.
            </p>
            {scenario === "new" ? (
              <div className="lesson-card">
                <div className="lesson-copy">
                  <h3>No class lessons yet</h3>
                  <p>
                    This is the empty-state example. You can prepare a fictional
                    topic above; class joining is not connected yet.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => topicInput.current?.focus()}
                >
                  Choose a topic
                </Button>
              </div>
            ) : scenario === "preparing" ? (
              <div className="lesson-card">
                <div className="lesson-copy">
                  <h3>Heat transfer · preparation example</h3>
                  <p>
                    Example state: awaiting grade and learning scope. No
                    background job is running for this fixture.
                  </p>
                  <span className="draft-label">
                    Live saved preparations can be resumed on the preparation
                    page after sign-in.
                  </span>
                </div>
                <Button variant="outline" onClick={prepare}>
                  Open preparation
                </Button>
              </div>
            ) : (
              <ul
                className="home-lesson-list"
                aria-label="Fictional class lessons"
              >
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <article className="lesson-card">
                      <div className="lesson-icon">
                        <BookOpen size={25} aria-hidden="true" />
                      </div>
                      <div className="lesson-copy">
                        <h3>{lesson.title}</h3>
                        <p>
                          Middle school · English · {lesson.objectives.length}{" "}
                          learning goals
                        </p>
                        <span className="draft-label">
                          Illustrative draft · needs teacher review
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        aria-label={`Open example: ${lesson.title}`}
                        onClick={(event) =>
                          openExample(lesson, event.currentTarget)
                        }
                      >
                        Open example <ArrowRight size={18} aria-hidden="true" />
                      </Button>
                    </article>
                  </li>
                ))}
              </ul>
            )}
            {scenario === "returning" && (
              <div className="home-resume">
                <h3>Resume</h3>
                <p>
                  No saved learning sessions in this demo. Starting and resuming
                  a teaching session are not available yet.
                </p>
              </div>
            )}
          </section>

          {selectedLesson && (
            <section className="example" aria-labelledby="example-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Fictional lesson preview</p>
                  <h2 ref={exampleTitle} tabIndex={-1} id="example-title">
                    {selectedLesson.title}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedLesson(null);
                    exampleButton.current?.focus();
                  }}
                >
                  Close example
                </Button>
              </div>
              <p className="mb-5 text-muted-foreground">
                No answers are assessed. This fictional draft has no teacher
                approval and cannot start a learning session.
              </p>
              <div className="example-grid">
                <div className="space-y-4">
                  <article className="errby-message">
                    <h3>
                      <Bot size={20} aria-hidden="true" /> Errby
                    </h3>
                    <p>{selectedLesson.initial_question}</p>
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
                    {selectedLesson.objectives.map((goal) => (
                      <li key={goal.id}>
                        <span className="goal-dot" aria-hidden="true" />
                        <div>
                          {goal.title}
                          <span>Unreviewed example goal</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Example objectives only · no learner evidence or progress
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
