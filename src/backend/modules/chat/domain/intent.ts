export const CHAT_INTENTS = [
  "product_search",
  "product_detail",
  "compare",
  "faq",
  "promotion",
  "redirect",
  "smalltalk",
] as const;

export type ChatIntent = (typeof CHAT_INTENTS)[number];

export type ProductRef = {
  id: string;
  externalId: string;
  name: string;
  price?: number | null;
  imageUrl?: string | null;
  url?: string | null;
};

export type ChatEngineResult = {
  reply: string;
  intent: ChatIntent;
  products: ProductRef[];
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
};
