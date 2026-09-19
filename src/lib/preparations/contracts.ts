import type { PreparationResult } from "@/lib/ingestion/contracts";
import type { Lesson } from "@/lib/lessons/schema";

export type PreparationJob = {
  id: string;
  owner_id: string;
  class_id: string | null;
  source_id: string;
  status:
    "pending" | "needs_clarification" | "drafting" | "needs_review" | "failed";
  current_step: number;
  completed_steps: Record<string, string>;
  lease_until: string | null;
  created_at: string;
  updated_at: string;
  error_code: string | null;
  partial_results: PreparationResult & {
    lesson_id?: string;
    lesson_version_id?: string;
  };
};
export type PreparationState = {
  job: PreparationJob;
  lesson: Lesson | null;
  can_author: boolean;
};
