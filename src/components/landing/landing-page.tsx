import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CaretDownIcon,
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
    "The student does the explaining. Errby is an AI learning character designed to ask questions and introduce focused misunderstandings to work through.",
  ],
  [
    "Why does Errby sometimes get something wrong?",
    "The learning design uses selected misunderstandings to invite a clearer explanation. The first question is genuine, and deliberate mistakes stay within the idea being explored.",
  ],
  [
    "What if the learner agrees with a wrong idea?",
    "An AI Supervisor checks in the background. Errby shares the correction or uncertainty in the same conversation. AI feedback can be wrong.",
  ],
  [
    "Who is it designed for?",
    "Errby is designed for school-age learners, from primary through high school. The intended interaction is typed and in English; younger learners may need help reading or typing.",
  ],
  [
    "Can I use my own notes?",
    "Yes. Paste reference notes directly in chat to start saved practice with evidence-based feedback.",
  ],
  [
    "Does ‘Explained’ mean mastery of the subject?",
    "No. Progress is based on evidence from your explanations. It is not a subject-wide judgement or a school grade, and uncertainty never counts as completion.",
  ],
  [
    "Is Errby available to use?",
    "This page demonstrates the intended experience with prewritten examples. Sign in to open the chat workspace; this illustrative page does not assess or save answers.",
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
          <a href="#sources-title">Your notes</a>
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
              <a href="#sources-title" className={styles.textLink}>
                Your notes{" "}
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
              <h3>Start with a message.</h3>
              <p>
                Say hello, name a topic, or paste your notes directly in chat.
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
              <h3>Keep the conversation going.</h3>
              <p>
                Errby asks follow-ups while understanding is checked quietly in
                the background.
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
              <span>Background AI checking</span>
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
                  Errby works through a correction{" "}
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
                    <strong>Errby · AI learning partner</strong>
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
            <span className={styles.eyebrow}>Room to think</span>
            <h2 id="feedback-title">You explain. Errby listens.</h2>
            <p>
              An AI Supervisor checks explanations in the background. Errby
              brings any corrections or uncertainty into the conversation.
              Progress depends on your own explanations, not how many messages
              you send.
            </p>
            <p>AI feedback can be wrong. Uncertain claims stay unresolved.</p>
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
                Start chatting about an idea. Paste a short passage from your
                notes when you want saved practice grounded in reference
                material.
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
              <h3>Your explanation</h3>
              <p>An idea in your own words, ready for a follow-up question.</p>
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
          <a href="#sources-title">Your notes</a>
          <a href="#questions">Questions</a>
        </nav>
      </footer>
    </div>
  );
}
