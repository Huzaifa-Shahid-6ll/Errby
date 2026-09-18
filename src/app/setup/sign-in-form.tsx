"use client";

import { useActionState } from "react";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const [message, action, pending] = useActionState(signIn, "");
  return (
    <form action={action} className="mt-6 grid gap-3">
      <label htmlFor="identifier">Student username or teacher email</label>
      <Input
        id="identifier"
        name="identifier"
        autoComplete="username"
        autoCapitalize="none"
        maxLength={254}
        required
        aria-describedby="signin-help"
      />
      <label htmlFor="password">Password</label>
      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        maxLength={128}
        required
      />
      <p id="signin-help" className="text-sm text-muted-foreground">
        Students use the username supplied by their teacher. No student email is
        needed.
      </p>
      <p role="status" aria-live="polite">
        {message}
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
