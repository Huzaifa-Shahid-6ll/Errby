"use client";

import { useState } from "react";
import { clearLearningState } from "@/components/auth-session";

export function DeleteAccount() {
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function removeAccount() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.user_message ?? "Deletion could not be confirmed.",
        );
      clearLearningState();
      window.location.replace("/setup");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Deletion could not be confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-8 border-t border-border pt-6"
      aria-labelledby="delete-heading"
    >
      <h2 id="delete-heading" className="text-xl font-semibold">
        Delete account
      </h2>
      <p className="mt-2 text-sm">
        This permanently removes your account and saved learning records.
        Teachers must remove or transfer classes first.
      </p>
      <label htmlFor="delete-confirm" className="mt-4 block text-sm">
        Type DELETE to confirm
      </label>
      <input
        id="delete-confirm"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        className="mt-1 block rounded border border-border bg-background p-2"
      />
      <button
        type="button"
        disabled={busy || confirmation !== "DELETE"}
        onClick={removeAccount}
        className="mt-3 rounded border border-current px-4 py-2 disabled:opacity-50"
      >
        Delete my account
      </button>
      {message && (
        <p role="alert" className="mt-2">
          {message}
        </p>
      )}
    </section>
  );
}
