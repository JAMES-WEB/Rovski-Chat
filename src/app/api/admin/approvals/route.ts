import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/allowed-users";
import { createMailer } from "@/lib/mailer";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

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

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("signup_requests")
    .select("id,email,status,created_at,approved_at,denied_at")
    .order("created_at", { ascending: false });
  if (status !== "all") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { id, decision } = (await request.json()) as {
    id?: string;
    decision?: "approved" | "denied";
  };
  if (!id || (decision !== "approved" && decision !== "denied")) {
    return NextResponse.json(
      { error: "Request id and decision are required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: requestRow, error: requestError } = await supabase
    .from("signup_requests")
    .select("id,email,user_id,status")
    .eq("id", id)
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
        .eq("id", id);
    }
  }
  const updates =
    decision === "approved"
      ? {
          status: "approved",
          approved_at: now,
          reviewed_at: now,
          reviewed_by: user.id,
        }
      : {
          status: "denied",
          denied_at: now,
          reviewed_at: now,
          reviewed_by: user.id,
        };

  const { error: updateError } = await supabase
    .from("signup_requests")
    .update(updates)
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (userId) {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { approval_status: decision },
    });
  }

  try {
    const { transporter, from } = createMailer();
    const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
    if (decision === "approved") {
      const subject = "Your account is approved";
      const text = `Your account is approved. You can sign in now at ${appUrl}/sign-in.`;
      const html = `<p>Your account is approved.</p><p><a href="${appUrl}/sign-in">Sign in</a></p>`;
      await transporter.sendMail({
        from,
        to: requestRow.email,
        subject,
        text,
        html,
      });
    } else {
      const subject = "Your access request was denied";
      const text = "Your access request was denied. Please contact an admin.";
      const html = "<p>Your access request was denied.</p>";
      await transporter.sendMail({
        from,
        to: requestRow.email,
        subject,
        text,
        html,
      });
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
