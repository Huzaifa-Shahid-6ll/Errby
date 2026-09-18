import { lessonSchema } from "./schema";

// Synthetic drafts: source checks are recorded in T03_LESSONS.md, not teacher approval.
export const exampleLessons = [
  lessonSchema.parse({
    schema_version: "1.1",
    id: "synthetic-heat-transfer",
    version: 1,
    title: "Why does ice melt?",
    grade_band: "middle_school",
    language: "en",
    content_origin: "generated_draft",
    illustrative_only: true,
    initial_question: "Why does ice melt when left in a warmer room?",
    application_question:
      "How could an insulated container help ice last longer in a warm room?",
    sources: [
      {
        id: "doe-heat",
        title: "US Department of Energy: Heating & Cooling",
        kind: "web",
        url: "https://www.energy.gov/topics/heating-cooling",
        provenance:
          "Public factual reference checked 2026-09-18; no school source or teacher endorsement.",
      },
      {
        id: "openstax-phase",
        title: "OpenStax College Physics 2e, 14.3 Phase Change and Latent Heat",
        kind: "web",
        url: "https://openstax.org/books/college-physics-2e/pages/14-3-phase-change-and-latent-heat",
        provenance:
          "Urone and Hinrichs, OpenStax; factual reference checked 2026-09-18. Original short summary, not an imported textbook or model training corpus.",
      },
      {
        id: "doe-insulation",
        title: "US Department of Energy: Types of Insulation",
        kind: "web",
        url: "https://bsesc.energy.gov/energy-basics/types-insulation",
        provenance:
          "Public factual reference checked 2026-09-18; container application is a generated example.",
      },
    ],
    references: [
      {
        id: "heat-direction-ref",
        source_id: "doe-heat",
        location: {
          kind: "section",
          label: "Heating & Cooling — opening paragraph",
        },
        text: "Without an externally powered transfer device, heat moves from warmer surroundings toward a cooler object.",
        text_kind: "summary",
        purpose: "evidence",
        status: "source_checked",
      },
      {
        id: "melting-ref",
        source_id: "openstax-phase",
        location: {
          kind: "section",
          label: "14.3 — opening discussion and Figure 14.8",
        },
        text: "Melting absorbs energy to change solid into liquid. In the idealised pure-water example at fixed normal pressure, temperature stays at the melting point while ice and water coexist during melting.",
        text_kind: "summary",
        purpose: "evidence",
        status: "source_checked",
      },
      {
        id: "insulation-ref",
        source_id: "doe-insulation",
        location: { kind: "section", label: "How? — mechanisms of insulation" },
        text: "Insulating materials slow heat transfer; they do not produce a separate substance called cold.",
        text_kind: "summary",
        purpose: "evidence",
        status: "source_checked",
      },
    ],
    objectives: [
      {
        id: "heat-direction",
        title: "Explain the direction of energy transfer",
        required: true,
        criteria: [
          "Identifies warmer surroundings as the source and colder ice as the receiver.",
        ],
        acceptable_explanations: [
          "The room is warmer, so energy passes from the surroundings into the ice.",
        ],
        essential_facts: [
          "A temperature difference drives this spontaneous transfer.",
        ],
        correction_criteria: [
          "Reject ice generating its own melting energy; identify the surroundings instead.",
        ],
        reference_ids: ["heat-direction-ref"],
        misconceptions: [
          {
            id: "ice-makes-heat",
            question: "Could the ice be making its own heat?",
            correction:
              "The warmer surroundings supply the transferred energy.",
            correction_criteria: [
              "Replace self-generated heat with transfer from warmer surroundings.",
            ],
            reference_ids: ["heat-direction-ref"],
            changed_example_question:
              "Which way does heat move between a cold drink and a warmer room?",
          },
        ],
        follow_up_questions: ["Which is warmer: the room or the ice?"],
        application_question:
          "Explain the heat-transfer direction for a cold drink in a warm room.",
        unresolved_issues: [],
      },
      {
        id: "melting",
        title: "Distinguish melting from warming",
        required: true,
        criteria: [
          "Connects absorbed energy to solid water becoming liquid.",
          "Explains the idealised temperature plateau during melting at fixed normal pressure.",
        ],
        acceptable_explanations: [
          "At its melting point, pure ice can take in energy and melt without its temperature rising until melting finishes.",
        ],
        essential_facts: [
          "Ice below its melting point can warm before melting starts.",
        ],
        correction_criteria: [
          "Distinguish energy used in the state change from a compulsory temperature increase.",
        ],
        reference_ids: ["melting-ref"],
        misconceptions: [
          {
            id: "melting-always-warmer",
            question:
              "Must the temperature keep rising while pure ice melts at fixed pressure?",
            correction:
              "During the idealised melting stage the added energy changes the state while temperature stays at the melting point.",
            correction_criteria: [
              "Describe melting with energy input but no temperature rise during the phase change.",
            ],
            reference_ids: ["melting-ref"],
            changed_example_question:
              "What can happen when more energy reaches pure ice and water already at the melting point?",
          },
        ],
        follow_up_questions: ["What changes when a solid turns into a liquid?"],
        application_question:
          "Explain why added energy need not raise temperature while pure ice melts.",
        unresolved_issues: [],
      },
      {
        id: "insulation",
        title: "Apply insulation to keeping ice",
        required: true,
        criteria: [
          "Explains that insulation slows energy transfer into ice in warmer surroundings.",
        ],
        acceptable_explanations: [
          "Insulation slows heat entering from the warmer room, so the ice may last longer.",
        ],
        essential_facts: [
          "Ordinary insulation slows rather than eliminates transfer.",
        ],
        correction_criteria: [
          "Reject cold production and permanent prevention of melting.",
        ],
        reference_ids: ["insulation-ref", "heat-direction-ref"],
        misconceptions: [
          {
            id: "insulation-makes-cold",
            question: "Might the container make cold?",
            correction:
              "Its insulation slows incoming heat rather than making cold.",
            correction_criteria: [
              "Explain slower heat transfer in a different everyday example.",
            ],
            reference_ids: ["insulation-ref", "heat-direction-ref"],
            changed_example_question:
              "Why can an insulated cup also keep a warm drink warm longer?",
          },
        ],
        follow_up_questions: [
          "What does the insulation change about energy transfer?",
        ],
        application_question:
          "Explain why an insulated cup can slow a warm drink cooling.",
        unresolved_issues: [],
      },
    ],
    teacher_review: { status: "pending" },
  }),
  lessonSchema.parse({
    schema_version: "1.1",
    id: "synthetic-equivalent-fractions",
    version: 1,
    title: "How can different fractions mean the same amount?",
    grade_band: "middle_school",
    language: "en",
    content_origin: "generated_draft",
    illustrative_only: true,
    initial_question:
      "How could you explain why one half and two quarters describe the same fraction of a whole?",
    application_question:
      "Show why three fifths and six tenths are equivalent using the same whole.",
    sources: [
      {
        id: "openstax-visual-fractions",
        title: "OpenStax Prealgebra 2e, 4.1 Visualize Fractions",
        kind: "web",
        url: "https://openstax.org/books/prealgebra-2e/pages/4-1-visualize-fractions",
        provenance:
          "Marecek, Anthony-Smith and Mathis, OpenStax; factual reference checked 2026-09-18. Original short summary; no school endorsement or model training corpus.",
      },
      {
        id: "openstax-simplify-fractions",
        title: "OpenStax Prealgebra 2e, 4.2 Multiply and Divide Fractions",
        kind: "web",
        url: "https://openstax.org/books/prealgebra-2e/pages/4-2-multiply-and-divide-fractions",
        provenance:
          "OpenStax factual reference checked 2026-09-18; generated examples use different numbers.",
      },
    ],
    references: [
      {
        id: "equal-parts-ref",
        source_id: "openstax-visual-fractions",
        location: {
          kind: "section",
          label:
            "Understand the Meaning of Fractions; Model Equivalent Fractions",
        },
        text: "A fraction describes equal-sized parts of a whole. Equivalent fractions denote the same value; changing the partition does not change the amount represented.",
        text_kind: "summary",
        purpose: "evidence",
        status: "source_checked",
      },
      {
        id: "equivalent-rule-ref",
        source_id: "openstax-simplify-fractions",
        location: {
          kind: "section",
          label: "Equivalent Fractions Property; Simplified Fraction",
        },
        text: "Multiplying or dividing numerator and denominator by the same nonzero factor preserves a fraction's value. Division by a common factor can simplify it.",
        text_kind: "summary",
        purpose: "evidence",
        status: "source_checked",
      },
    ],
    objectives: [
      {
        id: "equal-parts",
        title: "Explain equal parts of the same whole",
        required: true,
        criteria: ["Uses equal-sized parts and keeps the whole fixed."],
        acceptable_explanations: [
          "Each half can be split into two equal parts, so one half covers two of four parts of that same whole.",
        ],
        essential_facts: [
          "Counting unequal pieces alone does not determine the fraction.",
        ],
        correction_criteria: [
          "Replace piece counting with a comparison of equal parts of the same whole.",
        ],
        reference_ids: ["equal-parts-ref"],
        misconceptions: [
          {
            id: "any-two-pieces-half",
            question: "Do any two of four pieces always make half?",
            correction: "That piece-count argument needs four equal parts.",
            correction_criteria: [
              "State why unequal pieces invalidate the argument.",
            ],
            reference_ids: ["equal-parts-ref"],
            changed_example_question:
              "If a ribbon is cut into unequal pieces, can piece count alone tell the fraction of its length?",
          },
        ],
        follow_up_questions: [
          "What must be true about the sizes of the pieces?",
        ],
        application_question:
          "Explain two quarters with a folded strip divided into four equal parts.",
        unresolved_issues: [],
      },
      {
        id: "scale-both",
        title: "Explain why both fraction numbers scale",
        required: true,
        criteria: [
          "Applies the same nonzero multiplier to numerator and denominator and explains the unchanged value.",
        ],
        acceptable_explanations: [
          "Splitting every fifth into two makes ten equal parts; the three chosen fifths become six tenths.",
        ],
        essential_facts: [
          "Multiplying only the numerator generally changes the value.",
        ],
        correction_criteria: [
          "Correct a one-sided multiplier and justify scaling both numbers.",
        ],
        reference_ids: ["equivalent-rule-ref", "equal-parts-ref"],
        misconceptions: [
          {
            id: "multiply-only-top",
            question:
              "Could I double only the top number to keep the fraction equal?",
            correction:
              "For this equivalence rule, both numbers must use the same nonzero factor.",
            correction_criteria: [
              "Apply the factor to both numbers in a new example.",
            ],
            reference_ids: ["equivalent-rule-ref"],
            changed_example_question:
              "Explain how to write two sevenths with denominator twenty-one.",
          },
        ],
        follow_up_questions: [
          "What happens to each original part when it is split?",
        ],
        application_question:
          "Explain why two sevenths equals six twenty-firsts.",
        unresolved_issues: [],
      },
      {
        id: "simplify",
        title: "Simplify without changing value",
        required: true,
        criteria: [
          "Divides both numbers by a shared nonzero factor and explains preserved value.",
        ],
        acceptable_explanations: [
          "Six tenths becomes three fifths by dividing both numbers by two; the represented amount is unchanged.",
        ],
        essential_facts: [
          "Simpler numbers do not imply a smaller fraction value.",
        ],
        correction_criteria: [
          "Reject dividing only one number or claiming simplification shrinks the amount.",
        ],
        reference_ids: ["equivalent-rule-ref"],
        misconceptions: [
          {
            id: "simpler-means-smaller",
            question: "Does simplifying a fraction make the amount smaller?",
            correction:
              "Simplification by a common factor preserves the amount.",
            correction_criteria: [
              "Give a new equivalent pair and explain the same value.",
            ],
            reference_ids: ["equivalent-rule-ref"],
            changed_example_question:
              "Explain why eight twelfths and two thirds have the same value.",
          },
        ],
        follow_up_questions: ["Which factor divides both numbers?"],
        application_question:
          "Simplify eight twelfths and explain why the value is unchanged.",
        unresolved_issues: [],
      },
    ],
    teacher_review: { status: "pending" },
  }),
];
