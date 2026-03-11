import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { proposalId, signerName, signerEmail } = (await request.json()) as {
    proposalId?: string;
    signerName?: string;
    signerEmail?: string;
  };

  if (!proposalId || !signerName) {
    return NextResponse.json(
      { error: "Missing proposalId or signerName" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("proposals")
    .update({
      signer_name: signerName,
      signer_email: signerEmail ?? null,
      signed_at: new Date().toISOString(),
      status: "signed",
    })
    .eq("id", proposalId)
    .select("signed_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to sign" },
      { status: 500 }
    );
  }

  return NextResponse.json({ signedAt: data.signed_at });
}
