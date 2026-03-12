import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/allowed-users";
import { createMailer } from "@/lib/mailer";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  if (!user || !adminEmails.includes(email)) {
    return null;
  }
  return user;
}

async function getUserByEmail(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string
) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    throw new Error(error.message);
  }
  const match = data?.users?.find(
    (user) => user.email?.toLowerCase() === email
  );
  return match ?? null;
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { id, requestId } = (await request.json()) as {
    id?: string;
    requestId?: string;
  };
  const resolvedId = id ?? requestId;
  if (!resolvedId) {
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: requestRow, error: requestError } = await supabase
    .from("signup_requests")
    .select("id,email,user_id,status")
    .eq("id", resolvedId)
    .single();
  if (requestError || !requestRow) {
    return NextResponse.json(
      { error: requestError?.message ?? "Request not found." },
      { status: 404 }
    );
  }
  if (requestRow.status !== "pending") {
    return NextResponse.json(
      { error: "This request has already been processed." },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  let userId = requestRow.user_id;
  if (!userId) {
    const userLookup = await getUserByEmail(
      supabase,
      requestRow.email.toLowerCase()
    );
    userId = userLookup?.id ?? null;
    if (userId) {
      await supabase
        .from("signup_requests")
        .update({ user_id: userId })
        .eq("id", resolvedId);
    }
  }

  const { error: updateError } = await supabase
    .from("signup_requests")
    .update({
      status: "denied",
      denied_at: now,
      reviewed_at: now,
      reviewed_by: user.id,
    })
    .eq("id", resolvedId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (userId) {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { approval_status: "denied" },
    });
  }

  try {
    const { transporter, from } = createMailer();
    const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
    const subject = "Your access request was denied";
    const text = `Your access request was denied. If you believe this is a mistake, contact an admin. ${appUrl}`;
    const html = "<p>Your access request was denied.</p>";
    await transporter.sendMail({
      from,
      to: requestRow.email,
      subject,
      text,
      html,
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
