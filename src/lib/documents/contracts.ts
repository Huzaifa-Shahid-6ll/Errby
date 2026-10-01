import type { Extraction } from "@/lib/ingestion/contracts";

export type DocumentSummary = {
  id: string;
  name: string;
  kind: "pdf" | "docx";
  bytes: number;
  created_at: string;
  state?: "uploading" | "ready" | "failed" | "deleting";
};
export type SavedDocument = {
  document: DocumentSummary;
  extraction: Extraction;
};
export type SessionSource = {
  title: string;
  document_id: string | null;
  mode: "full" | "excerpt";
  kind: string;
  references: {
    id: string;
    text: string;
    index: number | null;
    status: string;
  }[];
};
