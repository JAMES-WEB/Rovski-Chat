"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function Home() {
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "pending") {
      setStatusMessage("Pending approval.");
    } else if (status === "denied") {
      setStatusMessage("Access is denied.");
    } else {
      setStatusMessage("");
    }
  }, [searchParams]);

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
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </header>
        {statusMessage ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
            {statusMessage}
          </div>
        ) : null}
        <main className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              HR Handbook review and compliance guidance for Rovski.
            </h1>
            <p className="text-lg text-zinc-300">
              Centralize policies, document updates, and audit-ready approvals
              in one secure workspace. Keep every handbook section aligned with
              current regulations and internal standards.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-in"
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
              >
                Create account
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                  Handbook review
                </div>
                <h2 className="mt-3 text-2xl font-semibold">
                  Policy clarity, every update tracked
                </h2>
              </div>
              <ul className="space-y-4 text-sm text-zinc-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Review each HR chapter for compliance and consistency.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Track revisions with clear approvals and accountability.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  Publish the latest handbook version to your teams.
                </li>
              </ul>
              <div className="rounded-2xl border border-emerald-400/20 bg-zinc-950/40 p-5 text-xs text-zinc-300">
                Rovski keeps every policy review aligned with internal HR
                standards and regulatory requirements.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
