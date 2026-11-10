"use client";

import { useActionState } from "react";

import {
  saveAiProviderAction,
  type AiProviderActionState,
} from "@/backend/controllers/ai-provider.controller";
import { AI_PROVIDER_CATALOG, AI_PROVIDER_KEYS } from "@/backend/lib/ai/provider-catalog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

type AiProviderFormProps = {
  storeId: string;
};

export function AiProviderForm({ storeId }: AiProviderFormProps) {
  const [state, action, pending] = useActionState<AiProviderActionState, FormData>(
    saveAiProviderAction,
    {},
  );

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provider">Provedor</Label>
        <select
          id="provider"
          name="provider"
          className="h-10 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm"
          defaultValue="gemini"
        >
          {AI_PROVIDER_KEYS.map((key) => (
            <option key={key} value={key}>
              {AI_PROVIDER_CATALOG[key].label}
            </option>
          ))}
        </select>
      </div>
      <Field label="Modelo" name="model" placeholder="gemini-2.0-flash" />
      <Field label="API Key (BYOK)" name="apiKey" type="password" />
      <Field
        label="Base URL (custom / OpenAI-compatible)"
        name="baseUrl"
        required={false}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked />
        Usar como padrão da loja
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar provedor"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
