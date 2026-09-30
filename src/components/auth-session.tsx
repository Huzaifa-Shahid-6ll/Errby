"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useLayoutEffect, useRef, useState } from "react";
import { setPreparationDraft } from "@/lib/home/preparation-draft";
import { Button } from "@/components/ui/button";

export function clearLearningState() {
  setPreparationDraft("");
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("errby:")) sessionStorage.removeItem(key);
    }
  } catch {
    /* Storage can be disabled. In-memory state is still cleared. */
  }
}

export function AuthSession({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const previous = useRef<string | null | undefined>(undefined);
  useLayoutEffect(() => {
    if (!isLoaded) return;
    const id = userId ?? null;
    try {
      if (sessionStorage.getItem("errby:identity") !== (id ?? "signed-out"))
        clearLearningState();
      sessionStorage.setItem("errby:identity", id ?? "signed-out");
    } catch {
      /* Optional storage. */
    }
    if (previous.current && previous.current !== id) {
      clearLearningState();
      // Full navigation also discards router payloads, form state and drafts.
      window.location.replace("/setup");
    }
    previous.current = id;
  }, [isLoaded, userId]);
  return <>{children}</>;
}

export function SignOutControl() {
  const { signOut } = useClerk();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await signOut();
            clearLearningState();
            window.location.replace("/setup");
          } catch {
            setError("Sign-out could not be confirmed. Please retry.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
