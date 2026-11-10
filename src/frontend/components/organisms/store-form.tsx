"use client";

import { useActionState } from "react";

import {
  createVtexStoreAction,
  type StoreActionState,
} from "@/backend/controllers/store.controller";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

export function StoreForm() {
  const [state, action, pending] = useActionState<StoreActionState, FormData>(
    createVtexStoreAction,
    {},
  );

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Field label="Nome da loja" name="name" error={state.fieldErrors?.name?.[0]} />
      <Field label="Domínio (opcional)" name="domain" />
      <Field
        label="Account name VTEX"
        name="accountName"
        error={state.fieldErrors?.accountName?.[0]}
      />
      <Field
        label="Environment"
        name="environment"
        defaultValue="vtexcommercestable"
      />
      <Field label="App Key" name="appKey" error={state.fieldErrors?.appKey?.[0]} />
      <Field
        label="App Token"
        name="appToken"
        error={state.fieldErrors?.appToken?.[0]}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Conectar loja VTEX"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={name !== "domain"} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
