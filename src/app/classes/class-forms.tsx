"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ListedClass = { id: string; title: string; grade_band: string };
export function ClassForms({
  role,
  classes,
}: {
  role: "teacher" | "learner";
  classes: ListedClass[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [code, setCode] = useState("");
  const [shownCode, setShownCode] = useState("");
  const [preview, setPreview] = useState<
    (ListedClass & { teacher: string }) | null
  >(null);
  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);
  async function send(path: string, body: object) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.user_message ?? "Please try again.");
      router.refresh();
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="mt-4 text-sm text-muted-foreground">
        A class code attaches an existing learner account to a class. It is not
        a password.
      </p>
      {role === "teacher" ? (
        <section className="mt-8" aria-labelledby="create-title">
          <h2 id="create-title" className="text-xl font-semibold">
            Create a class
          </h2>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await send("/api/classes", {
                title: form.get("title"),
                grade_band: form.get("grade_band"),
              });
              if (result) setShownCode(result.code);
            }}
          >
            <label htmlFor="class-title">Class name</label>
            <input
              id="class-title"
              name="title"
              required
              maxLength={160}
              className="rounded border border-input p-2"
            />
            <label htmlFor="class-grade">Grade band</label>
            <select
              id="class-grade"
              name="grade_band"
              className="rounded border border-input p-2"
            >
              <option value="primary">Primary</option>
              <option value="middle_school">Middle school</option>
              <option value="high_school">High school</option>
            </select>
            <button
              disabled={busy}
              className="rounded bg-primary p-2 text-primary-foreground disabled:opacity-50"
            >
              Create class
            </button>
          </form>
        </section>
      ) : (
        <section className="mt-8" aria-labelledby="join-title">
          <h2 id="join-title" className="text-xl font-semibold">
            Join a class
          </h2>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setPreview(null);
              const result = await send("/api/classes/preview", { code });
              if (result) setPreview(result.class);
            }}
          >
            <label htmlFor="class-code">Class code</label>
            <input
              id="class-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.trim().toUpperCase());
                setPreview(null);
              }}
              required
              minLength={24}
              maxLength={24}
              autoComplete="off"
              className="rounded border border-input p-2 uppercase"
            />
            <button
              disabled={busy}
              className="rounded bg-primary p-2 text-primary-foreground disabled:opacity-50"
            >
              Check code
            </button>
          </form>
          {preview && (
            <div className="mt-4 rounded border border-border p-4">
              <p>
                <strong>{preview.title}</strong> ·{" "}
                {preview.grade_band.replace("_", " ")}
              </p>
              <p>Teacher: {preview.teacher}</p>
              <button
                disabled={busy}
                className="mt-3 rounded bg-primary p-2 text-primary-foreground disabled:opacity-50"
                onClick={async () => {
                  const result = await send("/api/classes/join", { code });
                  if (result) {
                    setPreview(null);
                    setCode("");
                    setMessage(`Joined ${result.class.title}.`);
                  }
                }}
              >
                Confirm join
              </button>
            </div>
          )}
        </section>
      )}
      {message && (
        <p ref={messageRef} role="status" tabIndex={-1} className="mt-4">
          {message}
        </p>
      )}
      {shownCode && (
        <div className="mt-5 rounded border border-border p-4" role="status">
          <p>
            New class code:{" "}
            <strong className="break-all font-mono">{shownCode}</strong>
          </p>
          <p className="text-sm">
            Copy it now. Only a hash is saved, so it cannot be shown again.
            Rotation does not remove current members.
          </p>
          <button
            className="mt-2 underline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shownCode);
                setMessage("Class code copied.");
              } catch {
                setMessage("Select and copy the displayed code manually.");
              }
            }}
          >
            Copy code
          </button>
        </div>
      )}
      <section className="mt-10" aria-labelledby="your-classes">
        <h2 id="your-classes" className="text-xl font-semibold">
          Your classes
        </h2>
        {classes.length ? (
          <ul className="mt-3 space-y-3">
            {classes.map((item) => (
              <li key={item.id} className="rounded border border-border p-4">
                <strong>{item.title}</strong>
                <span className="ml-2 text-sm text-muted-foreground">
                  {item.grade_band.replace("_", " ")}
                </span>
                {role === "teacher" && (
                  <Link
                    className="ml-4 underline"
                    href={`/prepare?class_id=${item.id}`}
                  >
                    Prepare lesson
                  </Link>
                )}
                {role === "learner" && (
                  <Link className="ml-4 underline" href="/learn">
                    Find class lessons
                  </Link>
                )}
                {role === "teacher" && (
                  <Link
                    className="ml-4 underline"
                    href={`/classes/${item.id}/results`}
                  >
                    Results
                  </Link>
                )}
                {role === "teacher" && (
                  <button
                    disabled={busy}
                    className="ml-4 underline disabled:opacity-50"
                    onClick={async () => {
                      const result = await send(
                        `/api/classes/${item.id}/code`,
                        {},
                      );
                      if (result) setShownCode(result.code);
                    }}
                  >
                    Rotate code
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted-foreground">No classes yet.</p>
        )}
      </section>
    </>
  );
}
