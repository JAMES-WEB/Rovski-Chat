import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { getEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = (await headers()).get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { proposalId?: string } };
    const proposalId = session.metadata?.proposalId;
    if (proposalId) {
      const supabase = createSupabaseAdminClient();
      await supabase
        .from("proposals")
        .update({
          paid_at: new Date().toISOString(),
          status: "paid",
        })
        .eq("id", proposalId);
    }
  }

  return NextResponse.json({ received: true });
}
