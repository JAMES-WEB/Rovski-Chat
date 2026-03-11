import { buildProposalPrompt, DEFAULT_PROPOSAL_TEMPLATE } from "@/lib/proposal-template";

type AnthropicMessageResponse = {
  content?: Array<{ type: string; text?: string }>;
};

export async function generateProposalText(input: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return DEFAULT_PROPOSAL_TEMPLATE.replace(
      "{{executive_summary}}",
      input.trim()
    )
      .replace("{{project_goals}}", "Define measurable outcomes aligned to the brief.")
      .replace("{{scope_of_work}}", "Outline deliverables, milestones, and ownership.")
      .replace("{{timeline}}", "Provide a phased timeline with target dates.")
      .replace("{{investment}}", "Summarize fees, payment schedule, and totals.")
      .replace("{{terms_next_steps}}", "Confirm acceptance, kickoff, and communication cadence.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-6",
      max_tokens: 1600,
      messages: [
        {
          role: "user",
          content: buildProposalPrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error: ${response.status}`);
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const text = data.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("Anthropic response missing text");
  }
  return text;
}
