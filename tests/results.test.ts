import assert from "node:assert/strict";
import test from "node:test";
import { summarizeEvidence } from "../src/lib/results/metrics";

test("first independent scorable attempt, uncertainty and completion use saved evidence", () => {
  const goals = [
    { id: "heat", title: "Heat transfer", required: true },
    { id: "ice", title: "Melting", required: true },
  ];
  const attempts = [
    {
      objective_id: "heat",
      verdict: "unverified" as const,
      independent: true,
      assisted: false,
      sequence: 1,
    },
    {
      objective_id: "heat",
      verdict: "incorrect" as const,
      independent: true,
      assisted: false,
      sequence: 2,
    },
    {
      objective_id: "heat",
      verdict: "correct" as const,
      independent: true,
      assisted: false,
      sequence: 3,
    },
    {
      objective_id: "ice",
      verdict: "correct" as const,
      independent: false,
      assisted: true,
      sequence: 4,
    },
  ];
  const progress = [
    { objective_id: "heat", state: "explained" as const },
    { objective_id: "ice", state: "unverified" as const },
  ];
  assert.deepEqual(
    summarizeEvidence(goals, progress, attempts, false, "needs_review"),
    {
      label: "Unverified",
      explained: 1,
      required: 2,
      correct: 0,
      scorable: 1,
      unscored: 1,
      goals: [
        { title: "Heat transfer", state: "explained" },
        { title: "Melting", state: "unverified" },
      ],
    },
  );
  assert.equal(
    summarizeEvidence(goals, [], [], false, "ready").label,
    "Untested",
  );
  assert.equal(
    summarizeEvidence(
      goals,
      [
        { objective_id: "heat", state: "explained" },
        { objective_id: "ice", state: "explained" },
      ],
      attempts,
      false,
      "completed",
    ).label,
    "Explained",
  );
  assert.equal(
    summarizeEvidence(
      goals,
      [
        { objective_id: "heat", state: "explained" },
        { objective_id: "ice", state: "explained" },
      ],
      attempts,
      true,
      "completed",
    ).label,
    "Unverified",
  );
});
