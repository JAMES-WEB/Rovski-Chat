import Stripe from "stripe";
import { getEnv } from "@/lib/env";

export function getStripeClient() {
  return new Stripe(getEnv("STRIPE_SECRET_KEY"));
}
