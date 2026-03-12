"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function signUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      const response = await fetch("/api/auth/request-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const raw = await response.text();
      let data: { message?: string; error?: string } = {};
      try {
        data = raw
          ? (JSON.parse(raw) as { message?: string; error?: string })
          : {};
      } catch {
        data = {};
      }
      if (!response.ok) {
        setError(
          data.error ??
            raw ??
            `Failed to submit request (HTTP ${response.status}).`
        );
        return;
      }
      if ((data as { emailError?: string }).emailError) {
        setMessage(
          `Request submitted. Email failed: ${
            (data as { emailError?: string }).emailError
          }`
        );
      } else {
        setMessage(data.message ?? "Request submitted.");
      }
      router.push("/sign-in?requested=1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reach the server."
      );
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[url('/rovski-logo.svg')] bg-[length:240px_80px] bg-repeat opacity-10" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300"
            >
              Rovski HR Handbook
            </Link>
            <nav className="hidden items-center gap-4 text-xs uppercase tracking-[0.25em] text-zinc-400 md:flex">
              <Link href="/" className="transition hover:text-emerald-200">
                Home
              </Link>
              <Link href="/sign-in" className="transition hover:text-emerald-200">
                Sign in
              </Link>
              <Link href="/sign-up" className="transition hover:text-emerald-200">
                Sign up
              </Link>
            </nav>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/sign-in"
              className="rounded-full border border-emerald-400/40 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
            >
              Sign in
            </Link>
          </div>
        </header>
        <main className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8 rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-10">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Sign up
              </p>
              <h1 className="text-3xl font-semibold">Create an account</h1>
              <p className="text-sm text-zinc-300">
                Create your account. Access is granted after admin approval.
              </p>
            </div>
            <form onSubmit={signUp} className="space-y-5">
              <input
                type="email"
                name="email"
                placeholder="you@company.com"
                className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                minLength={6}
                className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
                required
              />
              <div className="rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-300">
                Your password is secured now. You can sign in once approved.
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Create account
              </button>
            </form>
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
                {message}
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                  New workspace
                </div>
                <h2 className="mt-3 text-2xl font-semibold">
                  Build a trusted handbook hub
                </h2>
              </div>
              <ul className="space-y-4 text-sm text-zinc-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Centralize every HR policy and approval.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Share updates with clear owner accountability.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Keep teams aligned with the latest guidance.
                </li>
              </ul>
              <div className="rounded-2xl border border-emerald-400/20 bg-zinc-950/40 p-5 text-xs text-zinc-300">
                Already have access? Use your existing credentials to sign in.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
