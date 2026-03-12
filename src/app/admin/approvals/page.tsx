import Link from "next/link";
import { redirect } from "next/navigation";
import AdminApprovalsClient from "@/components/AdminApprovalsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/allowed-users";

export default async function ApprovalsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  if (!user || !adminEmails.includes(email)) {
    redirect("/sign-in");
  }
  // Admins can access approvals regardless of their own approval status.

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[url('/rovski-logo.svg')] bg-[length:240px_80px] bg-repeat opacity-10" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-emerald-200"
          >
            <img src="/rovski-logo.svg" alt="Rovski" className="h-8 w-auto" />
            <span className="text-xs uppercase tracking-[0.3em]">
              Rovski HR Handbook
            </span>
          </Link>
        </header>
        <AdminApprovalsClient />
      </div>
    </div>
  );
}
