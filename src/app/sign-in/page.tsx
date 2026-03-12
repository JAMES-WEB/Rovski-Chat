"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { adminEmails } from "@/lib/allowed-users";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const status = searchParams.get("status");
    const requested = searchParams.get("requested");
    if (status === "denied") {
      setError("Your access request was denied.");
    } else if (status === "pending") {
      setError("Your account is pending approval.");
    } else if (requested) {
      setError("Request submitted. Wait for admin approval.");
    }
  }, [searchParams]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    const supabase = createSupabaseClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (authError) {
      setError(authError.message);
      return;
    }
    const userId = authData.user?.id;
    if (!userId) {
      setError("Unable to validate account.");
      return;
    }
    const normalizedEmail = authData.user?.email?.toLowerCase() ?? "";
    if (adminEmails.includes(normalizedEmail)) {
      router.push("/dashboard");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.status !== "approved") {
      await supabase.auth.signOut();
      const message =
        profile?.status === "denied"
          ? "Your access request was denied."
          : "Your account is pending approval.";
      setError(message);
      return;
    }
    router.push("/dashboard");
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
              href="/sign-up"
              className="rounded-full border border-emerald-400/40 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
            >
              Create account
            </Link>
          </div>
        </header>
        <main className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8 rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-10">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Sign in
              </p>
              <h1 className="text-3xl font-semibold">Welcome back</h1>
              <p className="text-sm text-zinc-300">
                Enter your email and password to sign in.
              </p>
            </div>
            <form onSubmit={signIn} className="space-y-5">
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
                placeholder="Your password"
                className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
                required
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Sign in
              </button>
            </form>
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {error}
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                  Secure access
                </div>
                <h2 className="mt-3 text-2xl font-semibold">
                  Keep handbook reviews moving
                </h2>
              </div>
              <ul className="space-y-4 text-sm text-zinc-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Resume policy review workflows instantly.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Access the latest approvals and updates.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Stay aligned with compliance checkpoints.
                </li>
              </ul>
              <div className="rounded-2xl border border-emerald-400/20 bg-zinc-950/40 p-5 text-xs text-zinc-300">
                Need access? Create a new account to join the Rovski HR review
                hub.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
