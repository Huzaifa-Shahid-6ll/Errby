"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold">
        This page is temporarily unavailable
      </h1>
      <p role="alert" className="my-4">
        We could not confirm access or load this page. Your saved records have
        not been changed.
      </p>
      <button className="mr-6 underline" onClick={reset}>
        Try again
      </button>
      <Link className="underline" href="/setup">
        Check your account
      </Link>
    </main>
  );
}
