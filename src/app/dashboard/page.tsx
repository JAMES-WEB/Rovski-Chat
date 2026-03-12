"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createSupabaseClient } from "@/lib/supabase/client";
import { adminEmails } from "@/lib/allowed-users";

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/sign-in");
        return;
      }
      const normalizedEmail = data.session.user.email?.toLowerCase() ?? "";
      if (adminEmails.includes(normalizedEmail)) {
        setIsReady(true);
        return;
      }
      const approvalStatus =
        (data.session.user.user_metadata as { approval_status?: string })
          ?.approval_status ?? "";
      if (approvalStatus === "approved") {
        setIsReady(true);
        return;
      }
      supabase
        .from("signup_requests")
        .select("status")
        .eq("user_id", data.session.user.id)
        .maybeSingle()
        .then(async ({ data: requestRow }) => {
          if (!requestRow || requestRow.status !== "approved") {
            await supabase.auth.signOut();
            const status = requestRow?.status ?? "pending";
            router.replace(`/sign-in?status=${status}`);
            return;
          }
          setIsReady(true);
        });
    });
  }, [router]);

  async function signOut() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
        <div className="mx-auto w-full max-w-6xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-emerald-400/30 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-200 hover:text-emerald-100"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-6">
          <div id="deployment-66826a99-dba9-48af-8052-ca59414e8449" />
          <Script src="https://studio.pickaxe.co/api/embed/bundle.js" defer />
        </div>
      </div>
    </div>
  );
}
