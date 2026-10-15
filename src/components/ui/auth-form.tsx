"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Wordmark } from "@/components/wordmark";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
      <div className="mb-8">
        <Wordmark className="text-[28px]" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-ws">
        <h1 className="ws-h2 mb-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          {mode === "login"
            ? "Sign in to get back to your sites."
            : "Start building your web, your side."}
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          {mode === "signup" ? (
            <Field
              label="Display name"
              name="displayName"
              placeholder="You, your studio, your shop…"
              autoComplete="name"
            />
          ) : null}
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            hint={mode === "login" ? undefined : "At least 6 characters"}
          />

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <Button type="submit" size="lg" loading={pending} className="mt-1">
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-sm text-muted">
        {mode === "login" ? (
          <>
            New to WebSide?{" "}
            <a href="/signup" className="font-medium text-cobalt hover:underline">
              Create an account
            </a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a href="/login" className="font-medium text-cobalt hover:underline">
              Sign in
            </a>
          </>
        )}
      </p>
    </div>
  );
}