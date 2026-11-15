export async function commerceRequest(
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    const detail = text.replace(/\s+/g, " ").trim().slice(0, 220);
    throw new Error(detail || `HTTP ${response.status}`);
  }
  if (!text.trim()) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

export function stripHtml(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || undefined;
}

export function localizedName(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["pt", "pt-BR", "es", "en"]) {
      const entry = record[key];
      if (typeof entry === "string" && entry.trim()) {
        return entry.trim();
      }
    }
    const first = Object.values(record).find(
      (entry) => typeof entry === "string" && entry.trim(),
    );
    return typeof first === "string" ? first.trim() : "";
  }
  return "";
}
