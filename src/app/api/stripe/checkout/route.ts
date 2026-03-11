import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { proposalId } = (await request.json()) as { proposalId?: string };
  if (!proposalId) {
    return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id,title,amount_cents,public_slug")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const stripe = getStripeClient();
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: proposal.amount_cents ?? 0,
          product_data: {
            name: proposal.title,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/proposals/${proposal.public_slug}?payment=success`,
    cancel_url: `${appUrl}/proposals/${proposal.public_slug}?payment=cancel`,
    metadata: {
      proposalId: proposal.id,
    },
  });

  return NextResponse.json({ sessionId: session.id });
}
