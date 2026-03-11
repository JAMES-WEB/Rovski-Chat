export const DEFAULT_PROPOSAL_TEMPLATE = `# Executive Summary

{{executive_summary}}

# Project Goals

{{project_goals}}

# Scope of Work

{{scope_of_work}}

# Timeline

{{timeline}}

# Investment

{{investment}}

# Terms & Next Steps

{{terms_next_steps}}
`;

export function buildProposalPrompt(input: string) {
  return `You are a proposal writer. Use the template below and fill every section with clear, client-ready language. Keep it concise but complete.

Template:
${DEFAULT_PROPOSAL_TEMPLATE}

Client brief:
${input}
`;
}
