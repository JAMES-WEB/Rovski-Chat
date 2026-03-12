import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/allowed-users";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const email = user.email?.toLowerCase() ?? "";
  const isAdmin = adminEmails.includes(email);
  return NextResponse.json({
    id: user.id,
    email,
    isAdmin,
    approvalStatus:
      (user.user_metadata as { approval_status?: string })?.approval_status ??
      null,
  });
}
