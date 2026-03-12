import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    throw new Error(`listUsers failed: ${error.message}`);
  }
  const match = data?.users?.find(
    (user) => user.email?.toLowerCase() === email
  );
  return match ?? null;
}

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    try {
      const healthUrl = new URL("/auth/v1/health", supabaseUrl).toString();
      await fetch(healthUrl, { method: "GET" });
    } catch (healthError) {
      const message =
        healthError instanceof Error
          ? healthError.message
          : "Unable to reach Supabase.";
      return NextResponse.json(
        {
          error:
            "Unable to reach Supabase. Check network/DNS and SUPABASE URL.",
          detail: message,
        },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();
    let userData = null as null | { id: string };
    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { approval_status: "pending" },
      });
    if (createError) {
      const message = createError.message ?? "";
      const alreadyExists =
        message.toLowerCase().includes("already") ||
        message.toLowerCase().includes("exists");
      if (!alreadyExists) {
        return NextResponse.json({ error: message }, { status: 500 });
      }
      const existingUser = await getUserByEmail(supabase, normalizedEmail);
      if (!existingUser) {
        return NextResponse.json(
          {
            error:
              "Account exists but could not be loaded. Check service role key.",
          },
          { status: 500 }
        );
      }
      userData = { id: existingUser.id };
      const approvalStatus =
        (existingUser.user_metadata as { approval_status?: string })
          ?.approval_status ?? "";
      if (approvalStatus === "approved") {
        return NextResponse.json(
          { error: "This account is already approved. Sign in instead." },
          { status: 409 }
        );
      }
    } else if (createdUser?.user) {
      userData = { id: createdUser.user.id };
    } else {
      return NextResponse.json(
        { error: "Failed to create user." },
        { status: 500 }
      );
    }

    const { error: requestError } = await supabase
      .from("signup_requests")
      .insert({
        user_id: userData.id,
        email: normalizedEmail,
        status: "pending",
      });
    if (requestError) {
      if (createdUser?.user) {
        await supabase.auth.admin.deleteUser(createdUser.user.id);
      }
      return NextResponse.json(
        { error: requestError.message },
        { status: 500 }
      );
    }

    let emailError: string | null = null;
    try {
      const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
      const adminLink = `${appUrl}/admin/approvals`;
      const { transporter, from } = createMailer();
      const subject = "New signup request";
      const text = `A signup request was created for ${normalizedEmail}. Review here: ${adminLink}`;
      const html = `<p>A signup request was created for ${normalizedEmail}.</p><p><a href="${adminLink}">Open approvals</a></p>`;
      await transporter.sendMail({
        from,
        to: adminEmails.join(","),
        subject,
        text,
        html,
      });
    } catch (mailError) {
      emailError =
        mailError instanceof Error ? mailError.message : "Email failed.";
      console.error("request-signup email failed:", mailError);
    }

    return NextResponse.json({
      message: "Request submitted. Admin approval required.",
      emailError,
    });
  } catch (error) {
    const err = error as Error & { cause?: unknown; name?: string };
    const message = err?.message ?? "Failed to submit request.";
    const cause =
      err?.cause instanceof Error ? err.cause.message : err?.cause ?? null;
    console.error("request-signup failed:", error);
    return NextResponse.json(
      {
        error: message,
        name: err?.name ?? "Error",
        cause,
      },
      { status: 500 }
    );
  }
}
