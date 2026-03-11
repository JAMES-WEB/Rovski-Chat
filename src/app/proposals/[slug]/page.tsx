import { notFound } from "next/navigation";
import SignaturePanel from "@/components/SignaturePanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProposalPageProps = {
  params: { slug: string };
};

export default async function ProposalPage({ params }: ProposalPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select(
      "id,title,content,amount_cents,status,signed_at,paid_at,public_slug,created_at"
    )
    .eq("public_slug", params.slug)
    .single();

  if (!proposal) {
    notFound();
  }

  const blocks: string[] = proposal.content
    .split("\n\n")
    .map((block: string) => block.trim())
    .filter((s: string) => s.length > 0);

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-3 rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Proposal
          </p>
          <h1 className="text-3xl font-semibold">{proposal.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
            <span>Status: {proposal.status ?? "draft"}</span>
            <span>
              Total: $
              {proposal.amount_cents
                ? (proposal.amount_cents / 100).toFixed(2)
                : "0.00"}
            </span>
          </div>
        </header>
        <section className="space-y-6 rounded-3xl border border-emerald-400/20 bg-zinc-900/40 p-8 text-sm text-zinc-100">
          {blocks.map((block: string) => {
            if (block.startsWith("#")) {
              const title = block.replace(/^#+\s*/, "");
              return (
                <h2 key={block} className="text-xl font-semibold text-white">
                  {title}
                </h2>
              );
            }
            return (
              <p key={block} className="leading-7 text-zinc-200">
                {block}
              </p>
            );
          })}
        </section>
        <SignaturePanel
          proposalId={proposal.id}
          signedAt={proposal.signed_at}
          paidAt={proposal.paid_at}
          amountCents={proposal.amount_cents ?? 0}
          title={proposal.title}
          publicSlug={proposal.public_slug}
        />
      </div>
    </div>
  );
}
