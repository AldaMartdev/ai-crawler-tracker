import type { AgentSignature } from "./types.js";

export const AI_AGENTS: AgentSignature[] = [
  // OpenAI
  { slug: "gptbot", name: "GPTBot", operator: "OpenAI", category: "training", pattern: "gptbot" },
  { slug: "oai-searchbot", name: "OAI-SearchBot", operator: "OpenAI", category: "search", pattern: "oai-searchbot" },
  { slug: "chatgpt-user", name: "ChatGPT-User", operator: "OpenAI", category: "assistant", pattern: "chatgpt-user" },

  // Anthropic
  { slug: "claudebot", name: "ClaudeBot", operator: "Anthropic", category: "training", pattern: "claudebot" },
  { slug: "claude-searchbot", name: "Claude-SearchBot", operator: "Anthropic", category: "search", pattern: "claude-searchbot" },
  { slug: "claude-user", name: "Claude-User", operator: "Anthropic", category: "assistant", pattern: "claude-user" },

  // Perplexity
  { slug: "perplexitybot", name: "PerplexityBot", operator: "Perplexity", category: "search", pattern: "perplexitybot" },
  { slug: "perplexity-user", name: "Perplexity-User", operator: "Perplexity", category: "assistant", pattern: "perplexity-user" },

  // Google
  { slug: "googleother", name: "GoogleOther", operator: "Google", category: "training", pattern: "googleother" },
  { slug: "google-cloudvertexbot", name: "Google-CloudVertexBot", operator: "Google", category: "training", pattern: "google-cloudvertexbot" },

  // Meta
  { slug: "meta-externalagent", name: "Meta-ExternalAgent", operator: "Meta", category: "training", pattern: "meta-externalagent" },
  { slug: "facebookbot", name: "FacebookBot", operator: "Meta", category: "training", pattern: "facebookbot" },

  // Apple
  { slug: "applebot", name: "Applebot", operator: "Apple", category: "search", pattern: "applebot" },

  // Amazon
  { slug: "amazonbot", name: "Amazonbot", operator: "Amazon", category: "training", pattern: "amazonbot" },

  // ByteDance
  { slug: "bytespider", name: "Bytespider", operator: "ByteDance", category: "training", pattern: "bytespider" },

  // Common Crawl
  { slug: "ccbot", name: "CCBot", operator: "Common Crawl", category: "training", pattern: "ccbot" },

  // Mistral
  { slug: "mistralai-user", name: "MistralAI-User", operator: "Mistral", category: "assistant", pattern: "mistralai-user" },

  // Cohere
  { slug: "cohere-training-data-crawler", name: "Cohere Crawler", operator: "Cohere", category: "training", pattern: "cohere-training-data-crawler" },
  { slug: "cohere-ai", name: "cohere-ai", operator: "Cohere", category: "training", pattern: "cohere-ai" },

  // DuckDuckGo
  { slug: "duckassistbot", name: "DuckAssistBot", operator: "DuckDuckGo", category: "assistant", pattern: "duckassistbot" },

  // You.com
  { slug: "youbot", name: "YouBot", operator: "You.com", category: "search", pattern: "youbot" },

  // Diffbot
  { slug: "diffbot", name: "Diffbot", operator: "Diffbot", category: "training", pattern: "diffbot" },

  // Timpi
  { slug: "timpibot", name: "Timpibot", operator: "Timpi", category: "search", pattern: "timpibot" },

  // Webz.io
  { slug: "omgili", name: "Omgili", operator: "Webz.io", category: "training", pattern: "omgili" },

  // Huawei
  { slug: "petalbot", name: "PetalBot", operator: "Huawei", category: "search", pattern: "petalbot" },

  // Allen Institute for AI
  { slug: "ai2bot", name: "AI2Bot", operator: "Allen Institute for AI", category: "training", pattern: "ai2bot" },
];
