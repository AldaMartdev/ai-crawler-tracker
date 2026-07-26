import { AI_AGENTS } from "./agents.js";
import type { AgentSignature, DetectedAgent } from "./types.js";

export function detectAIAgent(
  userAgent: string | null | undefined,
  extraAgents: AgentSignature[] = [],
): DetectedAgent | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  for (const agent of [...extraAgents, ...AI_AGENTS]) {
    if (ua.includes(agent.pattern.toLowerCase())) {
      return {
        slug: agent.slug,
        name: agent.name,
        operator: agent.operator,
        category: agent.category,
        userAgent,
      };
    }
  }
  return null;
}
