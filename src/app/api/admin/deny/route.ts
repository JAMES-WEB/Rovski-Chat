import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminEmails } from "@/lib/allowed-users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { requestId } = (await request.json()) as { requestId?: string };
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  if (!user || !adminEmails.includes(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: requestRow, error } = await admin
    .from("signup_requests")
    .select("id,user_id,status")
    .eq("id", requestId)
    .single();

  if (error || !requestRow) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (requestRow.status !== "pending") {
    return NextResponse.json(
      { error: "Request already processed" },
      { status: 409 }
    );
  }

  const deniedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("signup_requests")
    .update({ status: "denied", denied_at: deniedAt })
    .eq("id", requestId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ status: "denied", denied_at: deniedAt })
    .eq("id", requestRow.user_id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Denied" });
}
