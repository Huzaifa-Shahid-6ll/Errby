export const INGESTION_LIMITS = {
  bytes: 10 * 1024 * 1024,
  pages: 50,
  characters: 30_000,
  milliseconds: 15_000,
} as const;

// Leave multipart overhead below the hosted 4.5 MB request limit.
export const CHAT_UPLOAD_BYTES = 4 * 1024 * 1024;

export type Extraction = {
  document_id?: string;
  document_mode?: "full" | "excerpt";
  kind: "topic" | "text" | "pdf" | "docx";
  source_role: "scope" | "evidence";
  provenance: "user_supplied_unreviewed" | "fictional_unreviewed";
  sha256: string;
  parser: string;
  source_url?: string;
  pages: { page: number; text: string }[];
  text: string;
  sample: string;
  coverage: {
    total_pages: number;
    text_pages: number;
    missing_pages: number[];
  };
  warnings: string[];
};

export type PreparationResult = {
  status: "needs_clarification" | "extracted_needs_review" | "partial";
  extraction: Extraction;
  context: { subject: string; grade: string; scope: string };
  questions: { field: "subject" | "grade" | "scope"; question: string }[];
};
