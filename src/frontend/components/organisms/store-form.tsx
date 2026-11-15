"use client";

import { useActionState, useState } from "react";

import {
  createStoreAction,
  type StoreActionState,
} from "@/backend/controllers/store.controller";
import { Button } from "@/frontend/components/ui/button";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderSpec,
} from "@/experience/integration-providers";

const inputClass =
  "h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

export function StoreForm() {
  const [state, action, pending] = useActionState<StoreActionState, FormData>(
    createStoreAction,
    {},
  );
  const [providerId, setProviderId] = useState(INTEGRATION_PROVIDERS[0].id);
  const provider =
    INTEGRATION_PROVIDERS.find((item) => item.id === providerId) ??
    INTEGRATION_PROVIDERS[0];

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <legend className="mb-2 text-sm font-medium text-foreground">
          Plataforma
        </legend>
        {INTEGRATION_PROVIDERS.map((item) => {
          const selected = item.id === provider.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setProviderId(item.id)}
              className={`rounded-md border px-2 py-2 text-xs font-medium ${
                selected
                  ? "border-primary bg-accent/40 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </fieldset>
      <input type="hidden" name="platform" value={provider.id} />

      <p className="text-sm leading-relaxed text-muted-foreground">
        {provider.summary}
      </p>

      <Field
        label="Nome da loja"
        name="name"
        placeholder="Minha loja"
        error={state.fieldErrors?.name?.[0]}
      />
      <Field
        label="Domínio público (opcional)"
        name="domain"
        placeholder="www.minhaloja.com.br"
        required={false}
      />
      <CredentialFields provider={provider} />

      <Button type="submit" disabled={pending} className="h-11">
        {pending ? "Conectando..." : `Conectar ${provider.label}`}
      </Button>
    </form>
  );
}

function CredentialFields({ provider }: { provider: IntegrationProviderSpec }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {provider.fields.map((field) => (
        <Field
          key={`${provider.id}-${field.key}`}
          label={field.label}
          name={field.key}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          secret={field.secret}
          required={field.required !== false}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  error,
  secret,
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  secret?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      {label}
      <input
        id={name}
        name={name}
        type={secret ? "password" : "text"}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete="off"
        className={inputClass}
      />
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}
