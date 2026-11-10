import OpenAI from "openai";

import type {
  AiProvider,
  AiGenerateInput,
  AiGenerateResult,
  AiEmbedResult,
} from "@/backend/modules/ai/domain/ai-provider";

export class OpenAiProvider implements AiProvider {
  readonly id = "openai";
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(apiKey: string, defaultModel?: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.defaultModel = defaultModel ?? "gpt-4o-mini";
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const response = await this.client.chat.completions.create({
      model: input.model ?? this.defaultModel,
      temperature: input.temperature ?? 0.4,
      messages: [
        { role: "system", content: input.system },
        ...input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });
    const choice = response.choices[0];
    return {
      text: choice?.message?.content?.trim() ?? "",
      tokensIn: response.usage?.prompt_tokens,
      tokensOut: response.usage?.completion_tokens,
    };
  }

  async embed(text: string): Promise<AiEmbedResult> {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    const values = response.data[0]?.embedding;
    if (!values?.length) {
      throw new Error("OpenAI não retornou embedding.");
    }
    return { values: [...values] };
  }
}
