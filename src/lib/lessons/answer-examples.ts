// Fictional expected judgments for human review and future T09 evaluator runs.
// These are AI-authored candidate test expectations, never observed model results.
export const answerExamples: {
  id: string;
  lesson_id: string;
  objective_id: string;
  preceding_message: string;
  learner_answer: string;
  expected_verdict: "correct" | "partial" | "incorrect" | "unverified";
  independent_evidence: boolean;
  reason: string;
}[] = [
  {
    id: "heat-01",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "heat-direction",
    preceding_message: "Why does ice melt in a warmer room?",
    learner_answer:
      "The room is warmer, so energy passes from it into the colder ice.",
    expected_verdict: "correct",
    independent_evidence: true,
    reason: "Identifies the energy source, receiver and direction.",
  },
  {
    id: "heat-02",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "heat-direction",
    preceding_message: "Where does the energy come from?",
    learner_answer: "Energy goes into the ice.",
    expected_verdict: "partial",
    independent_evidence: true,
    reason: "Source and temperature relationship are missing.",
  },
  {
    id: "heat-03",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "heat-direction",
    preceding_message: "Could the ice be making its own heat?",
    learner_answer: "Yes, ice makes heat so it can melt.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "False agreement requires correction, not objective credit.",
  },
  {
    id: "heat-04",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "insulation",
    preceding_message: "Might the container make cold?",
    learner_answer: "Yes, its walls make cold and send it to the ice.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "False agreement replaces slowed transfer with cold production.",
  },
  {
    id: "heat-05",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "melting",
    preceding_message:
      "Must temperature rise while pure ice melts at fixed pressure?",
    learner_answer:
      "Yes, every bit of added energy always raises the temperature.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "Contradicts the idealised melting plateau.",
  },
  {
    id: "heat-06",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "insulation",
    preceding_message: "What does insulation do?",
    learner_answer: "It stops all heat transfer forever so ice can never melt.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "Absolute prevention is not the supported claim.",
  },
  {
    id: "heat-07",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "insulation",
    preceding_message: "How long will this unnamed cooler keep ice?",
    learner_answer: "Exactly 43 hours.",
    expected_verdict: "unverified",
    independent_evidence: false,
    reason:
      "No material, amount or conditions support that numerical duration.",
  },
  {
    id: "heat-08",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "melting",
    preceding_message:
      "What is the melting point of this unidentified mixture?",
    learner_answer: "It is exactly minus eight degrees Celsius.",
    expected_verdict: "unverified",
    independent_evidence: false,
    reason: "Pure-water references do not identify this mixture.",
  },
  {
    id: "heat-09",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "insulation",
    preceding_message:
      "Its insulation slows incoming heat rather than making cold.",
    learner_answer:
      "Its insulation slows incoming heat rather than making cold.",
    expected_verdict: "correct",
    independent_evidence: false,
    reason:
      "Factually correct copy of the supplied correction earns no independent explanation credit.",
  },
  {
    id: "heat-10",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "insulation",
    preceding_message: "Apply the idea to a warm drink in a cooler room.",
    learner_answer:
      "Heat goes out from the warmer drink. Insulation slows that transfer, so it cools more slowly.",
    expected_verdict: "correct",
    independent_evidence: true,
    reason:
      "Changed example correctly reverses direction while retaining the mechanism; assistance still needs session context.",
  },
  {
    id: "heat-11",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "melting",
    preceding_message:
      "Explain energy input while pure ice melts at fixed normal pressure.",
    learner_answer:
      "Energy changes solid water to liquid at the melting point; temperature need not rise during that stage.",
    expected_verdict: "correct",
    independent_evidence: true,
    reason: "Explains both phase change and the bounded temperature claim.",
  },
  {
    id: "heat-12",
    lesson_id: "synthetic-heat-transfer",
    objective_id: "melting",
    preceding_message: "Explain melting and temperature.",
    learner_answer: "The ice becomes liquid.",
    expected_verdict: "partial",
    independent_evidence: true,
    reason: "Omits energy input and temperature relationship.",
  },
  {
    id: "fraction-01",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "equal-parts",
    preceding_message: "Why does one half equal two quarters?",
    learner_answer:
      "Split each half into two equal pieces. The same selected half now covers two of four equal parts.",
    expected_verdict: "correct",
    independent_evidence: true,
    reason: "Equal partition of a fixed whole explains equivalence.",
  },
  {
    id: "fraction-02",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "scale-both",
    preceding_message: "Explain three fifths and six tenths.",
    learner_answer: "They are equal.",
    expected_verdict: "partial",
    independent_evidence: true,
    reason: "Bare assertion supplies no scaling relationship or explanation.",
  },
  {
    id: "fraction-03",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "scale-both",
    preceding_message:
      "Could I double only the top number to keep one third equal?",
    learner_answer: "Yes, one third equals two thirds.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "False agreement changes the fraction value.",
  },
  {
    id: "fraction-04",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "equal-parts",
    preceding_message: "Do any two of four pieces always make half?",
    learner_answer: "Yes, even if the pieces have different sizes.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "False agreement ignores equal-sized parts.",
  },
  {
    id: "fraction-05",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "simplify",
    preceding_message:
      "Does simplifying six tenths to three fifths make the amount smaller?",
    learner_answer: "Yes, both numbers get smaller, so the amount shrinks.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "The numbers change but equivalent fraction value does not.",
  },
  {
    id: "fraction-06",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "scale-both",
    preceding_message: "Explain a rule for equivalent fractions.",
    learner_answer:
      "Add one to both numbers: one half becomes two thirds and stays equal.",
    expected_verdict: "incorrect",
    independent_evidence: true,
    reason: "Equal addition is not the common multiplication rule.",
  },
  {
    id: "fraction-07",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "equal-parts",
    preceding_message:
      "What fraction is shaded in the picture that was not supplied?",
    learner_answer: "Three quarters.",
    expected_verdict: "unverified",
    independent_evidence: false,
    reason: "Unavailable picture provides no supporting evidence.",
  },
  {
    id: "fraction-08",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "equal-parts",
    preceding_message: "How much pizza did this fictional class eat?",
    learner_answer: "Seven eighths.",
    expected_verdict: "unverified",
    independent_evidence: false,
    reason: "No class measurements or counts were supplied.",
  },
  {
    id: "fraction-09",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "simplify",
    preceding_message:
      "Simplification by a common factor preserves the amount.",
    learner_answer: "Simplification by a common factor preserves the amount.",
    expected_verdict: "correct",
    independent_evidence: false,
    reason: "A copied correction is not independent learner evidence.",
  },
  {
    id: "fraction-10",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "scale-both",
    preceding_message:
      "Apply the rule to two sevenths with denominator twenty-one.",
    learner_answer:
      "Each seventh becomes three equal parts. Multiply both numbers by three, giving six twenty-firsts with the same value.",
    expected_verdict: "correct",
    independent_evidence: true,
    reason: "New example explains both the procedure and the unchanged amount.",
  },
  {
    id: "fraction-11",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "simplify",
    preceding_message: "Simplify eight twelfths and explain.",
    learner_answer:
      "Divide top and bottom by four to get two thirds; regrouping equal parts leaves the same amount.",
    expected_verdict: "correct",
    independent_evidence: true,
    reason: "Common divisor and value preservation are explained.",
  },
  {
    id: "fraction-12",
    lesson_id: "synthetic-equivalent-fractions",
    objective_id: "simplify",
    preceding_message: "Simplify eight twelfths and explain.",
    learner_answer: "Two thirds.",
    expected_verdict: "partial",
    independent_evidence: true,
    reason:
      "Correct number without explanation does not satisfy this objective.",
  },
];
