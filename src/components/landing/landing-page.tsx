import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  FileText,
  Flame,
  Search,
  ShieldAlert,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./landing-controls";
import styles from "./landing-page.module.css";
import "./landing-motion.css";

const conversation = [
  {
    speaker: "Errby",
    message: "Why does ice melt in a warm room?",
    errby: true,
  },
  {
    speaker: "You",
    message: "Heat moves from the warmer room into the ice.",
    errby: false,
  },
  {
    speaker: "Errby",
    qualifier: " · deliberate mistake",
    message: "So the ice makes its own heat?",
    errby: true,
  },
  {
    speaker: "You",
    message: "No. The energy comes from the warmer surroundings.",
    errby: false,
  },
];

const learningSteps = [
  {
    title: "Errby asks",
    description: "Errby poses a question about your topic.",
  },
  {
    title: "You explain",
    description: "You share your thinking in your own words.",
  },
  {
    title: "Spot the mistake",
    description: "Errby sometimes gets things wrong on purpose.",
  },
  {
    title: "Correct it",
    description: "You explain what’s not quite right and try again.",
  },
];

const teacherSteps = [
  {
    title: "Create class",
    description: "Set up your class and details.",
    Icon: Users,
  },
  {
    title: "Add material",
    description: "Add a topic list or text/PDF material.",
    Icon: FileText,
  },
  {
    title: "Review",
    description: "Check and edit lesson drafts.",
    Icon: Search,
  },
  { title: "Publish", description: "Publish selected lessons.", Icon: Upload },
  {
    title: "Review evidence",
    description: "Review what students can explain in your class.",
    Icon: ChartNoAxesColumnIncreasing,
  },
];

const questions = [
  {
    question: "Is this a live lesson?",
    answer: "No. This is a fictional, unreviewed example.",
  },
  {
    question: "Why does Errby make mistakes?",
    answer: "So you can practise spotting and explaining them.",
  },
  {
    question: "Does the Supervisor mark work?",
    answer:
      "It is designed to guide and flag uncertainty, not provide high-stakes grades.",
  },
];

function ExampleLink() {
  return (
    <Button asChild className={`${styles.primaryButton} landing-cta`}>
      <a href="#example">
        See an example <ArrowRight aria-hidden="true" size={19} />
      </a>
    </Button>
  );
}

function Wordmark() {
  return (
    <a className={styles.wordmark} href="#top" aria-label="Errby home">
      errby<span>.</span>
    </a>
  );
}

export function LandingPage() {
  return (
    <div id="top" className={`landing-page ${styles.page}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={`${styles.container} ${styles.header}`}>
        <Wordmark />
        <nav className={styles.navigation} aria-label="Main navigation">
          <a className={styles.desktopLink} href="#how-it-works">
            How it works
          </a>
          <a href="#teachers">
            <span className={styles.desktopLabel}>For teachers</span>
            <span className={styles.mobileLabel}>Teachers</span>
          </a>
          <a href="#questions">Questions</a>
        </nav>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link className={styles.textLink} href="/setup">
            Sign in
          </Link>
          <Button
            asChild
            className={`${styles.primaryButton} ${styles.headerCta}`}
          >
            <Link href="/setup#sign-up">Sign up</Link>
          </Button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className={styles.container}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy} data-landing-enter>
            <p className={styles.eyebrow}>A learning app in development</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              <span>Teach Errby.</span>{" "}
              <span className={styles.titleAccent}>Catch its mistakes.</span>{" "}
              <span>Explain your thinking.</span>
            </h1>
            <p className={styles.heroDescription}>
              You do the explaining. Errby asks questions and sometimes gets
              things wrong on purpose.
            </p>
            <div className={styles.heroActions}>
              <ExampleLink />
              <a className={styles.textLink} href="#teachers">
                Explore the teacher plan{" "}
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
            <p className={styles.heroNotice}>
              Illustrative preview · not a live lesson.
            </p>
          </div>

          <section
            id="example"
            className={styles.conversation}
            aria-labelledby="example-title"
            data-landing-enter
          >
            <div className={styles.conversationHeading}>
              <h2 id="example-title">Why does ice melt?</h2>
              <p>Fictional example · unreviewed</p>
              <div className={styles.heroMascot} data-landing-mascot>
                <Image
                  src="/images/errby-mascot.png"
                  alt=""
                  fill
                  sizes="(max-width: 639px) 70px, 130px"
                  preload
                />
              </div>
            </div>
            <ol className={styles.transcript} aria-label="Example conversation">
              {conversation.map((turn, index) => (
                <li key={index} className={styles.turn}>
                  <div
                    className={`${styles.avatar} ${turn.errby ? styles.robotAvatar : styles.learnerAvatar}`}
                  >
                    <Image
                      src={
                        turn.errby
                          ? "/images/errby-mascot.png"
                          : "/images/learner-avatar.png"
                      }
                      alt=""
                      fill
                      sizes="(max-width: 639px) 40px, 48px"
                    />
                  </div>
                  <div
                    className={`${styles.bubble} ${turn.errby ? styles.errbyBubble : styles.learnerBubble}`}
                  >
                    <p className={styles.speaker}>
                      <strong>{turn.speaker}</strong>
                      {turn.qualifier && <span>{turn.qualifier}</span>}
                    </p>
                    <p>{turn.message}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className={styles.conversationNotice}>
              Example only · no assessment
            </p>
          </section>
        </section>

        <section
          id="how-it-works"
          className={styles.howItWorks}
          aria-labelledby="how-title"
        >
          <h2 id="how-title" className={styles.sectionTitle}>
            A different way to practise.
          </h2>
          <ol className={styles.learningSteps}>
            {learningSteps.map((step, index) => (
              <li key={step.title} className={styles.learningStep}>
                <span className={styles.stepNumber} aria-hidden="true">
                  0{index + 1}
                </span>
                <div className={styles.learningStepCopy}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={styles.supervisorSection}
          aria-labelledby="supervisor-title"
        >
          <div className={styles.supervisorCopy}>
            <h2 id="supervisor-title" className={styles.sectionTitle}>
              <span className={styles.headingPhrase}>A second voice</span>{" "}
              <span className={styles.headingPhrase}>when you need it.</span>
            </h2>
            <p>
              The planned Supervisor is separate from Errby. It helps address
              misconceptions and flags uncertainty.
            </p>
          </div>
          <aside
            className={styles.supervisorCard}
            aria-label="Fictional Supervisor guidance"
          >
            <ShieldAlert
              className={styles.shield}
              size={58}
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <div>
              <h3>Supervisor</h3>
              <p className={styles.guidanceProvenance}>
                Fictional guidance example
              </p>
              <p className={styles.guidance}>
                Let’s check where the heat comes from.
              </p>
              <p>If a claim cannot be verified, it stays unresolved.</p>
            </div>
          </aside>
        </section>

        <section
          id="teachers"
          className={styles.teachers}
          aria-labelledby="teachers-title"
        >
          <div className={styles.teacherIntro}>
            <p className={styles.teacherEyebrow}>
              For teachers · planned workflow
            </p>
            <h2 id="teachers-title" className={styles.sectionTitle}>
              <span className={styles.headingPhrase}>Your materials.</span>{" "}
              <span className={styles.headingPhrase}>Lessons you review.</span>
            </h2>
            <p>
              Create a class, add material, review lesson drafts, then publish
              selected lessons.
            </p>
          </div>
          <ol className={styles.teacherSteps}>
            {teacherSteps.map(({ title, description, Icon }, index) => (
              <li key={title} className={styles.teacherStep}>
                <span className={styles.teacherIcon} aria-hidden="true">
                  <Icon size={25} strokeWidth={1.8} />
                  <span>0{index + 1}</span>
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                {index < teacherSteps.length - 1 && (
                  <ArrowRight
                    className={styles.stepArrow}
                    size={17}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
          <div className={styles.draftCard}>
            <span className={styles.flame} aria-hidden="true">
              <Flame size={40} fill="currentColor" strokeWidth={1.5} />
            </span>
            <div>
              <h3>Heat transfer</h3>
              <p>Draft · needs teacher review</p>
            </div>
          </div>
          <p className={styles.teacherNotice}>
            These teacher tools are planned and are not available in the current
            demo.
          </p>
        </section>

        <section
          id="questions"
          className={styles.questions}
          aria-labelledby="questions-title"
        >
          <h2 id="questions-title" className={styles.sectionTitle}>
            A few things to know.
          </h2>
          <div className={styles.questionList}>
            {questions.map(({ question, answer }) => (
              <details key={question} className={styles.question} open>
                <summary>
                  {question}
                  <ChevronDown size={21} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingMascot} data-landing-mascot>
            <Image
              src="/images/errby-mascot.png"
              alt=""
              fill
              sizes="(max-width: 639px) 100px, 155px"
            />
          </div>
          <div className={styles.closingCopy}>
            <h2 id="closing-title">What would you teach Errby?</h2>
            <ExampleLink />
          </div>
        </section>
      </main>

      <footer className={`${styles.container} ${styles.footer}`}>
        <Wordmark />
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#teachers">For teachers</a>
          <a href="#questions">Questions</a>
          <Link href="/learn">Learning workspace</Link>
        </nav>
        <p>Design concept · September 2026</p>
      </footer>
    </div>
  );
}
