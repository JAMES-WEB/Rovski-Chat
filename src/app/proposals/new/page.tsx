import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPublicSlug } from "@/lib/slug";
import { generateProposalText } from "@/lib/ai";

export default async function NewProposalPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/sign-in");
  }

  async function createProposal(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "New Proposal").trim();
    const description = String(formData.get("description") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "0").trim();
    const amount = Number(amountRaw);
    const amountCents = Number.isFinite(amount) ? Math.round(amount * 100) : 0;

    const supabaseServer = await createSupabaseServerClient();
    const { data: authData } = await supabaseServer.auth.getUser();
    if (!authData.user) {
      redirect("/sign-in");
    }

    const content = await generateProposalText(description);
    const publicSlug = createPublicSlug(title);
    const { data: proposal, error } = await supabaseServer
      .from("proposals")
      .insert({
        owner_id: authData.user.id,
        title,
        description,
        content,
        public_slug: publicSlug,
        amount_cents: amountCents,
        status: "draft",
      })
      .select("public_slug")
      .single();

    if (error || !proposal) {
      throw new Error(error?.message ?? "Failed to create proposal");
    }

    redirect(`/proposals/${proposal.public_slug}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            New proposal
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Describe the project and generate the draft
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            The AI will fill in your default proposal template using your
            project brief.
          </p>
        </div>
        <form
          action={createProposal}
          className="space-y-6 rounded-3xl border border-emerald-400/20 bg-zinc-900/60 p-8"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              name="title"
              placeholder="Proposal title"
              className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
              required
            />
            <input
              type="number"
              step="0.01"
              name="amount"
              placeholder="Project fee (USD)"
              className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
              required
            />
          </div>
          <textarea
            name="description"
            rows={10}
            placeholder="Describe the client, goals, scope, timeline, and any must-haves."
            className="w-full rounded-2xl border border-emerald-400/20 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-300"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            Generate proposal
          </button>
        </form>
      </div>
    </div>
  );
}
