export const AI_PROVIDER_KEYS = ["gemini", "openai", "custom"] as const;

export type AiProviderKind = (typeof AI_PROVIDER_KEYS)[number];

export const AI_PROVIDER_CATALOG: Record<
  AiProviderKind,
  { label: string; models: readonly string[] }
> = {
  gemini: {
    label: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"],
  },
  openai: {
    label: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  },
  custom: {
    label: "OpenAI-compatible",
    models: [],
  },
};

export function isAiProviderKind(value: string): value is AiProviderKind {
  return (AI_PROVIDER_KEYS as readonly string[]).includes(value);
}
