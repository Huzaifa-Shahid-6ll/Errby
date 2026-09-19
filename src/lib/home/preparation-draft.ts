"use client";

// Navigation handoff only: no source material in URLs or browser storage.
let draft = "";

export function getPreparationDraft(): string {
  return typeof window === "undefined" ? "" : draft;
}

export function setPreparationDraft(text: string): void {
  if (typeof window !== "undefined") draft = text;
}
