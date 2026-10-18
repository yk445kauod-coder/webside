"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Wordmark } from "@/components/wordmark";
import { Check } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isLogin = mode === "login";

  return (
    <main id="main" className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel */}
      <aside className="ws-night relative isolate hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="ws-aurora" aria-hidden="true">
          <i />
        </div>
        <div aria-hidden="true" className="ws-dots absolute inset-0" />
        <Link href="/" aria-label="WebSide home" className="relative z-10">
          <Wordmark variant="mono-white" className="text-[28px]" />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="ws-display text-balance !text-5xl text-white">
            Build it by <span className="ws-gradient-text">answering questions.</span>
          </h2>
          <ul className="mt-8 space-y-3 text-white/80">
            {["Guided, step by step", "Live preview as you go", "Free to start"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/50">Your web. Your side.</p>
      </aside>

      {/* form */}
      <div className="relative flex flex-col items-center justify-center bg-canvas px-4 py-12 sm:px-6">
        <Link href="/" aria-label="WebSide home" className="mb-8 lg:hidden">
          <Wordmark className="text-[28px]" />
        </Link>

      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-ws sm:p-8">
        <h1 className="ws-h2 mb-1">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-6 text-sm text-muted">
          {isLogin ? "Sign in to get back to your sites." : "Start building your web, your side."}
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          {!isLogin ? (
            <Field
              label="Display name"
              name="displayName"
              placeholder="You, your studio, your shop…"
              autoComplete="name"
              maxLength={60}
            />
          ) : null}
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            autoFocus
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={isLogin ? "current-password" : "new-password"}
            hint={isLogin ? undefined : "At least 8 characters"}
            minLength={isLogin ? undefined : 8}
            required
          />

          {state.error ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}
          {state.notice ? (
            <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              {state.notice}
            </p>
          ) : null}

          <Button type="submit" size="lg" loading={pending} className="mt-1">
            {isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-sm text-muted">
        {isLogin ? (
          <>
            New to WebSide?{" "}
            <Link href="/signup" className="font-medium text-cobalt hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-cobalt hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
      </div>
    </main>
  );
}
