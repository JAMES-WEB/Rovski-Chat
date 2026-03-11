"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

type SignaturePanelProps = {
  proposalId: string;
  signedAt: string | null;
  paidAt: string | null;
  amountCents: number;
  title: string;
  publicSlug: string;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

type StripeCheckoutRedirect = {
  redirectToCheckout: (options: { sessionId: string }) => Promise<{
    error?: { message?: string };
  }>;
};

export default function SignaturePanel({
  proposalId,
  signedAt,
  paidAt,
  amountCents,
  title,
  publicSlug,
}: SignaturePanelProps) {
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [isSigned, setIsSigned] = useState(Boolean(signedAt));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountLabel = useMemo(() => {
    return `$${(amountCents / 100).toFixed(2)}`;
  }, [amountCents]);

  const isPaid = Boolean(paidAt);
  const showPayment = isSigned && !isPaid;

  async function handleSign(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/proposals/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proposalId,
          signerName,
          signerEmail,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to sign");
      }
      setIsSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proposalId,
        }),
      });
      const data = (await response.json()) as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? "Failed to start payment");
      }
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe not configured");
      }
      const stripeCheckout = stripe as unknown as StripeCheckoutRedirect;
      const result = await stripeCheckout.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start payment");
      setLoading(false);
    }
  }

  if (isPaid) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-8">
        <div className="absolute inset-0">
          <div className="success-sparkle absolute left-6 top-10 h-2 w-2 rounded-full bg-emerald-300" />
          <div className="success-sparkle absolute left-1/3 top-16 h-2 w-2 rounded-full bg-emerald-200" />
          <div className="success-sparkle absolute right-12 top-12 h-2 w-2 rounded-full bg-emerald-300" />
        </div>
        <div className="relative space-y-3">
          <div className="inline-flex rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-zinc-950 success-glow">
            Complete
          </div>
          <h2 className="text-2xl font-semibold text-emerald-100">
            Proposal signed and paid
          </h2>
          <p className="text-sm text-emerald-100/80">
            Thank you. The project can kick off right away.
          </p>
          <a
            href={`/proposals/${publicSlug}`}
            className="inline-flex text-xs font-semibold text-emerald-200 underline"
          >
            View proposal again
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
          Signature & payment
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          {isSigned ? "Signature received" : "Ready to approve?"}
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          {isSigned
            ? "Proceed with payment to finalize the agreement."
            : "Sign to confirm the proposal and unlock payment."}
        </p>
      </div>
      {!isSigned ? (
        <form onSubmit={handleSign} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              value={signerName}
              onChange={(event) => setSignerName(event.target.value)}
              placeholder="Your full name"
              className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
              required
            />
            <input
              type="email"
              value={signerEmail}
              onChange={(event) => setSignerEmail(event.target.value)}
              placeholder="Your email"
              className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing..." : "Sign proposal"}
          </button>
        </form>
      ) : null}
      {showPayment ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200">
            Amount due: <span className="font-semibold">{amountLabel}</span>
          </div>
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting..." : `Pay ${amountLabel}`}
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}
      <p className="text-xs text-zinc-500">
        Proposal: {title}
      </p>
    </section>
  );
}
