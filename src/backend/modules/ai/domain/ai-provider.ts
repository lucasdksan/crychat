export type AiGenerateInput = {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
};

export type AiGenerateResult = {
  text: string;
  tokensIn?: number;
  tokensOut?: number;
};

export type AiEmbedResult = {
  values: number[];
};

export interface AiProvider {
  readonly id: string;
  generate(input: AiGenerateInput): Promise<AiGenerateResult>;
  embed(text: string, model?: string): Promise<AiEmbedResult>;
}
