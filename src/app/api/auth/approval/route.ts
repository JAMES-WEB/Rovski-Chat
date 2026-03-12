import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: requestRow, error } = await supabase
    .from("signup_requests")
    .select("status,approved_at,denied_at,reviewed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    userId: user.id,
    email: user.email,
    status: requestRow?.status ?? null,
    approved_at: requestRow?.approved_at ?? null,
    denied_at: requestRow?.denied_at ?? null,
    reviewed_at: requestRow?.reviewed_at ?? null,
  });
}
