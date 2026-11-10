export type VtexClientConfig = {
  account: string;
  environment: string;
  appKey: string;
  appToken: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 60_000;

export function buildVtexBaseUrl(account: string, environment: string): string {
  return `https://${account}.${environment}.com.br`;
}

export class VtexClient {
  readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(config: VtexClientConfig) {
    this.baseUrl = buildVtexBaseUrl(config.account, config.environment);
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.headers = {
      "X-VTEX-API-AppKey": config.appKey,
      "X-VTEX-API-AppToken": config.appToken,
      Accept: "application/json",
    };
  }

  async get(path: string, params?: Record<string, string | number | boolean>) {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.headers,
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `VTEX HTTP ${response.status}`);
      }
      if (response.status === 204) {
        return null;
      }
      const text = await response.text();
      if (!text.trim()) {
        return null;
      }
      return JSON.parse(text) as unknown;
    } finally {
      clearTimeout(timer);
    }
  }

  async getPaginated(
    path: string,
    params?: Record<string, string | number | boolean>,
    options?: { maxPages?: number; perPage?: number },
  ): Promise<unknown[]> {
    const maxPages = options?.maxPages ?? 20;
    const perPage = options?.perPage ?? 50;
    const allItems: unknown[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const data = await this.get(path, { ...params, page, per_page: perPage });
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }
      allItems.push(...data);
      if (data.length < perPage) {
        break;
      }
    }
    return allItems;
  }
}
