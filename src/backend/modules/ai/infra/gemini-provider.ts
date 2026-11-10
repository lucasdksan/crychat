import { GoogleGenAI } from "@google/genai";

import type {
  AiProvider,
  AiGenerateInput,
  AiGenerateResult,
  AiEmbedResult,
} from "@/backend/modules/ai/domain/ai-provider";

export class GeminiProvider implements AiProvider {
  readonly id = "gemini";
  private readonly client: GoogleGenAI;
  private readonly defaultModel: string;

  constructor(apiKey: string, defaultModel?: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.defaultModel =
      defaultModel ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const model = input.model ?? this.defaultModel;
    const contents = [
      ...input.messages.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      })),
    ];

    const response = await this.client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: input.system,
        temperature: input.temperature ?? 0.4,
      },
    });

    const text = response.text ?? "";
    const usage = response.usageMetadata;
    return {
      text,
      tokensIn: usage?.promptTokenCount,
      tokensOut: usage?.candidatesTokenCount,
    };
  }

  async embed(text: string, model?: string): Promise<AiEmbedResult> {
    const embedModel =
      model ?? process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
    const response = await this.client.models.embedContent({
      model: embedModel,
      contents: text,
    });
    const values = response.embeddings?.[0]?.values;
    if (!values?.length) {
      throw new Error("Gemini não retornou embedding.");
    }
    return { values: [...values] };
  }
}
