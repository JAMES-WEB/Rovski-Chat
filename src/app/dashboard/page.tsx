import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/allowed-users";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const email = user.email?.toLowerCase() ?? "";
  if (!adminEmails.includes(email)) {
    const { data: requestRow } = await supabase
      .from("signup_requests")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    const approvalStatus =
      requestRow?.status ??
      (user.user_metadata as { approval_status?: string })?.approval_status ??
      "pending";
    if (approvalStatus !== "approved") {
      redirect(`/?status=${approvalStatus}`);
    }
  }

  return <DashboardClient />;
}
