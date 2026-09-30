import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CircleHalfIcon,
  CircleIcon,
} from "@phosphor-icons/react/ssr";
import { LandingMenu } from "./landing-menu";
import styles from "./landing-page.module.css";
import "./landing-motion.css";

const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-heading",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-body",
});

const questions = [
  [
    "Is Errby the teacher?",
    "The student does the explaining. Errby is an AI learning character designed to ask questions and introduce lesson-specific misunderstandings to work through.",
  ],
  [
    "Why does Errby sometimes get something wrong?",
    "The learning design uses selected misunderstandings to invite a clearer explanation. The first question is genuine, and deliberate mistakes belong to a defined lesson.",
  ],
  [
    "What if the learner agrees with a wrong idea?",
    "A separate AI Supervisor is designed to intervene after a submitted answer. It gives feedback or flags uncertainty. It is not a human teacher and can be wrong.",
  ],
  [
    "Who is it designed for?",
    "Errby is designed for school-age learners, from primary through high school. The intended interaction is typed and in English; younger learners may need help reading or typing.",
  ],
  [
    "Can teachers use their own material?",
    "The planned classroom workflow starts with a topic list or learning material. Teachers review lesson drafts before publishing them.",
  ],
  [
    "Does ‘Explained’ mean mastery of the subject?",
    "No. It describes evidence for a particular lesson goal. It is not a subject-wide judgement or a school grade. Every required goal needs valid evidence before a lesson can be complete.",
  ],
  [
    "Is Errby available to use?",
    "This page demonstrates the intended experience with prewritten examples. The separate development workspace has account and setup requirements; this page does not assess or save answers.",
  ],
];

function Mark({ large = false }: { large?: boolean }) {
  return (
    <Image
      src="/images/errby-mascot.png"
      alt=""
      width={1254}
      height={1254}
      sizes={large ? "144px" : "40px"}
      className={large ? styles.mascot : styles.mark}
    />
  );
}

function Message({
  role,
  children,
}: {
  role: "Errby" | "Learner";
  children: ReactNode;
}) {
  return (
    <div
      className={role === "Errby" ? styles.errbyMessage : styles.learnerMessage}
    >
      <span className={styles.role}>
        {role === "Errby" ? (
          <Mark />
        ) : (
          <Image
            src="/images/learner-avatar.png"
            alt=""
            width={1254}
            height={1254}
            sizes="32px"
            className={styles.learnerMark}
          />
        )}
        {role}
      </span>
      <p>{children}</p>
    </div>
  );
}

function Opening() {
  return (
    <>
      <Message role="Errby">Why does an ice cube melt in a warm room?</Message>
      <Message role="Learner">
        Energy transfers from the warmer surroundings to the colder ice. That
        energy can melt the ice.
      </Message>
    </>
  );
}

function Correction() {
  return (
    <div className={styles.correction}>
      <span className={styles.smallLabel}>A misunderstanding to correct</span>
      <Message role="Errby">
        So the ice makes the heat it needs to melt?
      </Message>
      <Message role="Learner">
        No. The energy comes from the warmer surroundings. The ice does not make
        its own heat.
      </Message>
    </div>
  );
}

export function LandingPage() {
  return (
    <div
      id="top"
      className={`landing-page ${styles.page} ${headingFont.variable} ${bodyFont.variable}`}
    >
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <a href="#top" className={styles.wordmark} aria-label="Errby home">
          <Mark />
          errby<span className={styles.dot}>.</span>
        </a>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-teachers">For teachers</a>
          <a href="#questions">Questions</a>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up">Sign up</Link>
        </nav>
        <a href="#example" className={styles.headerCta}>
          See an example{" "}
          <ArrowUpRightIcon size={20} weight="bold" aria-hidden="true" />
        </a>
        <LandingMenu />
      </header>
      <main id="main" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Product concept</span>
            <h1 id="hero-title">
              Learn it by <span>teaching Errby.</span>
            </h1>
            <p className={styles.lead}>
              Errby is designed to help students practise explaining a lesson,
              correct misunderstandings, and see which ideas need another
              attempt.
            </p>
            <div className={styles.actions}>
              <a href="#example" className={`landing-cta ${styles.primary}`}>
                See an example{" "}
                <ArrowRightIcon size={20} weight="bold" aria-hidden="true" />
              </a>
              <a href="#for-teachers" className={styles.textLink}>
                For teachers{" "}
                <ArrowUpRightIcon size={20} weight="bold" aria-hidden="true" />
              </a>
            </div>
            <p className={styles.heroNote}>
              You explain. Errby asks.
              <br />
              You work through the idea.
            </p>
          </div>
          <figure className={styles.heroPreview}>
            <div className={styles.heroMascot} data-landing-mascot="greeting">
              <Mark large />
            </div>
            <div className={styles.previewHeader}>
              <span className={styles.topic}>
                A little lesson in heat transfer
              </span>
              <span className={styles.smallLabel}>
                Illustrative example · prewritten conversation
              </span>
            </div>
            <div className={styles.messages}>
              <Opening />
              <Correction />
            </div>
            <figcaption>
              <a href="#example">
                Read the complete example{" "}
                <ArrowDownIcon size={20} weight="bold" aria-hidden="true" />
              </a>
            </figcaption>
          </figure>
        </section>

        <section
          id="how-it-works"
          className={styles.section}
          aria-labelledby="flow-title"
        >
          <span className={styles.eyebrow}>The intended learning flow</span>
          <h2 id="flow-title">
            A lesson you explain,
            <br className={styles.desktopBreak} /> not just read.
          </h2>
          <ol className={styles.steps}>
            <li>
              <span className={styles.number}>01</span>
              <h3>Start with a lesson.</h3>
              <p>
                Use a topic or learning material, or join a lesson your teacher
                has prepared.
              </p>
            </li>
            <li>
              <span className={styles.number}>02</span>
              <h3>Teach it in your own words.</h3>
              <p>
                Answer Errby’s questions and help it work through a
                misunderstanding.
              </p>
            </li>
            <li>
              <span className={styles.number}>03</span>
              <h3>See what needs another explanation.</h3>
              <p>
                Review progress against the lesson’s goals, with evidence from
                the conversation.
              </p>
            </li>
          </ol>
        </section>

        <section
          id="example"
          className={styles.exampleSection}
          aria-labelledby="example-title"
        >
          <div className={styles.section}>
            <div className={styles.sectionIntro}>
              <span className={styles.eyebrow}>
                A conversation, with a purpose
              </span>
              <h2 id="example-title">What teaching Errby looks like.</h2>
              <p>
                Here’s a prewritten example about heat transfer. Errby asks
                first, then gives the learner a misunderstanding to correct.
              </p>
            </div>
            <div className={styles.legend}>
              <span>Errby · AI learning character</span>
              <span>Learner · example response</span>
              <span>Supervisor · AI feedback</span>
            </div>
            <div className={styles.transcript}>
              <div className={styles.previewHeader}>
                <h3>Learner corrects Errby</h3>
                <span className={styles.smallLabel}>
                  Illustrative example · prewritten conversation · unreviewed
                </span>
              </div>
              <div className={styles.messages}>
                <Opening />
                <Correction />
                <Message role="Errby">
                  Then why could wrapping the ice in an insulating material slow
                  its melting?
                </Message>
              </div>
              <p className={styles.transcriptNote}>
                The conversation continues with a new example.
              </p>
            </div>
            <details className={styles.branch}>
              <summary>
                <span>
                  Supervisor helps{" "}
                  <span className={styles.summaryHint}>
                    A second prewritten example
                  </span>
                </span>
                <CaretDownIcon
                  className="landing-chevron"
                  size={20}
                  weight="bold"
                  aria-hidden="true"
                />
              </summary>
              <div className={styles.messages}>
                <p className={styles.smallLabel}>
                  Illustrative example · prewritten conversation · unreviewed
                </p>
                <Opening />
                <div className={styles.correction}>
                  <span className={styles.smallLabel}>
                    A misunderstanding and its correction
                  </span>
                  <Message role="Errby">
                    So the ice makes the heat it needs to melt?
                  </Message>
                  <Message role="Learner">
                    Yes, the ice makes heat to melt.
                  </Message>
                  <div className={styles.supervisor}>
                    <strong>Supervisor · AI feedback</strong>
                    <p>
                      That idea needs correcting: energy transfers from the
                      warmer surroundings to the colder ice. The ice is not
                      producing its own heat to melt. Try explaining where the
                      energy comes from in a new example.
                    </p>
                  </div>
                </div>
                <Message role="Errby">
                  If you put a cold spoon in warm water, which way does energy
                  transfer?
                </Message>
                <p className={styles.smallLabel}>
                  Copying a correction earns no progress. A real lesson needs
                  independently valid evidence in a new response.
                </p>
              </div>
            </details>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="feedback-title">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Evidence for each idea</span>
            <h2 id="feedback-title">
              Understand the feedback,
              <br className={styles.desktopBreak} /> not just the result.
            </h2>
            <p>
              The planned Supervisor checks submitted explanations against the
              lesson’s reference material. It can correct a misunderstanding or
              flag an answer it cannot verify. Progress is tied to specific
              lesson goals.
            </p>
          </div>
          <div className={styles.feedbackGrid}>
            <div>
              <div className={styles.supervisor}>
                <span className={styles.smallLabel}>Illustrative feedback</span>
                <h3>Supervisor · AI feedback</h3>
                <p>
                  Try explaining where the energy comes from in a new example.
                </p>
              </div>
              <p className={styles.caveat}>
                The Supervisor is AI feedback, not a live teacher, and it can be
                wrong.
              </p>
            </div>
            <div className={styles.goals}>
              <span className={styles.smallLabel}>
                Illustrative progress · not calculated from this transcript
              </span>
              <h3>1 of 3 goals explained</h3>
              <ul>
                <li>
                  <span>Where the energy comes from</span>
                  <span className={styles.explained}>
                    <CheckCircleIcon size={20} aria-hidden="true" /> Explained
                  </span>
                </li>
                <li>
                  <span>Melting and temperature</span>
                  <span>
                    <CircleHalfIcon size={20} aria-hidden="true" /> Developing
                  </span>
                </li>
                <li>
                  <span>How insulation slows transfer</span>
                  <span>
                    <CircleIcon size={20} aria-hidden="true" /> Untested
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <p className={styles.stateKey}>
            <strong>Explained</strong> means there is learner evidence for that
            goal. <strong>Developing</strong> needs another explanation.{" "}
            <strong>Untested</strong> has no evidence yet.{" "}
            <strong>Unverified</strong> means evidence could not be confirmed.
            These describe an idea, not a child.
          </p>
        </section>

        <section
          id="for-teachers"
          className={styles.teacherSection}
          aria-labelledby="teacher-title"
        >
          <div className={styles.teacherGrid}>
            <div>
              <span className={styles.eyebrow}>For the classroom</span>
              <h2 id="teacher-title">
                Bring a topic list.
                <br />
                Review the lessons.
                <br />
                Let students explain.
              </h2>
              <p>
                Errby’s planned classroom workflow starts with a short outline
                or learning material. Review the drafted lessons, publish the
                ones you want to use, and share a class code.
              </p>
              <ol className={styles.teacherSteps}>
                <li>Add material</li>
                <li>Review drafts</li>
                <li>Publish lessons</li>
                <li>Share a code</li>
              </ol>
              <p className={styles.caveat}>
                Classroom reporting is intended for assigned activity.
                Independent sessions should stay private.
              </p>
            </div>
            <div id="classroom-preview" className={styles.draft}>
              <div className={styles.previewHeader}>
                <span className={styles.smallLabel}>
                  Example classroom data · fictional
                </span>
                <h3>Heat transfer</h3>
                <span className={styles.review}>
                  Draft · needs teacher review
                </span>
              </div>
              <div className={styles.draftBody}>
                <h4>Proposed lesson goals</h4>
                <p className={styles.smallLabel}>
                  Teachers would edit and review these before publication.
                </p>
                <ol>
                  <li>Explain where the energy to melt ice comes from.</li>
                  <li>Distinguish melting from a temperature increase.</li>
                  <li>Explain how insulation slows energy transfer.</li>
                </ol>
                <div className={styles.draftNote}>
                  Review comes before publication.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sources-title">
          <div className={styles.sourceIntro}>
            <div className={styles.sectionIntro}>
              <span className={styles.eyebrow}>
                A starting point for curiosity
              </span>
              <h2 id="sources-title">
                Start from the lesson
                <br className={styles.desktopBreak} /> you want to understand.
              </h2>
              <p>
                Errby’s lesson design starts with a defined topic and reference
                material. If a source cannot be read, the intended flow asks for
                usable text or another supported file.
              </p>
            </div>
            <Image
              src="/images/errby-notebook.png"
              alt=""
              width={1536}
              height={1024}
              sizes="(max-width: 767px) 280px, 380px"
              className={styles.notebook}
            />
          </div>
          <div className={styles.sourceRows}>
            <div>
              <span>01</span>
              <h3>A topic</h3>
              <p>A specific idea to explore.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Your notes</h3>
              <p>Reference material to ground the lesson.</p>
            </div>
            <div>
              <span>03</span>
              <h3>A teacher’s lesson</h3>
              <p>A draft reviewed before it reaches the class.</p>
            </div>
          </div>
        </section>

        <section
          id="questions"
          className={styles.questionSection}
          aria-labelledby="questions-title"
        >
          <div>
            <span className={styles.eyebrow}>A few good questions</span>
            <h2 id="questions-title">Curious about Errby?</h2>
          </div>
          <div className={styles.faq}>
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  <span>{question}</span>
                  <CaretDownIcon
                    className="landing-chevron"
                    size={20}
                    weight="bold"
                    aria-hidden="true"
                  />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className={styles.invitation}
          aria-labelledby="invitation-title"
        >
          <Mark large />
          <span className={styles.eyebrow}>Start with the example</span>
          <h2 id="invitation-title">
            Pick an idea.
            <br />
            Explain it to Errby.
          </h2>
          <p>
            See how a small misunderstanding can turn into a clearer
            explanation.
          </p>
          <a href="#example" className={`landing-cta ${styles.primary}`}>
            See an example{" "}
            <ArrowRightIcon size={20} weight="bold" aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className={styles.footer}>
        <div>
          <a href="#top" className={styles.wordmark} aria-label="Errby home">
            errby<span className={styles.dot}>.</span>
          </a>
          <p>Product concept — illustrative examples</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-teachers">For teachers</a>
          <a href="#questions">Questions</a>
        </nav>
      </footer>
    </div>
  );
}
