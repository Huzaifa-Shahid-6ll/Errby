export type Goal = { id: string; title: string; required: boolean };
export type Progress = {
  objective_id: string;
  state: "untested" | "developing" | "explained" | "unverified";
};
export type Attempt = {
  objective_id: string;
  verdict: "correct" | "partial" | "incorrect" | "unverified" | "off_topic";
  assisted: boolean;
  independent: boolean | null;
  sequence: number;
};

export function summarizeEvidence(
  goals: Goal[],
  progress: Progress[],
  attempts: Attempt[],
  unresolved: boolean,
  status: string,
) {
  const required = goals.filter((goal) => goal.required);
  const states = new Map(
    progress.map((item) => [item.objective_id, item.state]),
  );
  const explained = required.filter(
    (goal) => states.get(goal.id) === "explained",
  ).length;
  let correct = 0;
  let scorable = 0;
  let unscored = 0;
  for (const goal of required) {
    const first = attempts
      .filter(
        (item) =>
          item.objective_id === goal.id &&
          item.independent === true &&
          !item.assisted,
      )
      .sort((a, b) => a.sequence - b.sequence)
      .find(
        (item) => item.verdict !== "off_topic" && item.verdict !== "unverified",
      );
    if (first) {
      scorable++;
      if (first.verdict === "correct") correct++;
    }
    unscored += attempts.filter(
      (item) =>
        item.objective_id === goal.id &&
        (item.verdict === "off_topic" || item.verdict === "unverified"),
    ).length;
  }
  const label =
    unresolved || required.some((goal) => states.get(goal.id) === "unverified")
      ? "Unverified"
      : status === "completed" &&
          required.length > 0 &&
          explained === required.length
        ? "Explained"
        : attempts.length > 0
          ? "Developing"
          : "Untested";
  return {
    label,
    explained,
    required: required.length,
    correct,
    scorable,
    unscored,
    goals: required.map((goal) => ({
      title: goal.title,
      state: states.get(goal.id) ?? "untested",
    })),
  };
}
