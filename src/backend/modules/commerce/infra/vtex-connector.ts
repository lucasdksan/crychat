import type { CommerceConnector, CommerceProduct } from "@/backend/modules/commerce/domain/types";
import { normalizeVtexSkuSearchRow } from "@/backend/modules/commerce/application/normalize-vtex-product";
import { VtexClient, buildVtexBaseUrl } from "@/backend/modules/commerce/infra/vtex-client";

export type VtexConnectorConfig = {
  accountName: string;
  environment: string;
  appKey: string;
  appToken: string;
};

export class VtexConnector implements CommerceConnector {
  readonly platform = "vtex" as const;
  private readonly client: VtexClient;
  private readonly accountName: string;
  private readonly environment: string;

  constructor(config: VtexConnectorConfig) {
    this.accountName = config.accountName;
    this.environment = config.environment;
    this.client = new VtexClient({
      account: config.accountName,
      environment: config.environment,
      appKey: config.appKey,
      appToken: config.appToken,
    });
  }

  get baseUrl() {
    return buildVtexBaseUrl(this.accountName, this.environment);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.get("/api/catalog_system/pub/products/search", {
        _from: 0,
        _to: 0,
      });
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(options?: {
    page?: number;
    pageSize?: number;
    maxPages?: number;
  }): Promise<CommerceProduct[]> {
    const pageSize = options?.pageSize ?? 50;
    const maxPages = options?.maxPages ?? 5;
    const products: CommerceProduct[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const rows = await this.client.get(
        "/api/catalog_system/pub/products/search",
        { _from: from, _to: to },
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        break;
      }
      for (const row of rows) {
        const normalized = normalizeVtexSkuSearchRow(
          row as Parameters<typeof normalizeVtexSkuSearchRow>[0],
          this.baseUrl,
        );
        if (normalized) {
          products.push(normalized);
        }
      }
      if (rows.length < pageSize) {
        break;
      }
    }
    return products;
  }

  async getProduct(externalId: string): Promise<CommerceProduct | null> {
    const rows = await this.client.get(
      "/api/catalog_system/pub/products/search",
      { fq: `productId:${externalId}` },
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }
    return normalizeVtexSkuSearchRow(
      rows[0] as Parameters<typeof normalizeVtexSkuSearchRow>[0],
      this.baseUrl,
    );
  }

  async getLivePrice(externalId: string): Promise<number | null> {
    const product = await this.getProduct(externalId);
    return product?.price ?? null;
  }

  async getLiveStock(externalId: string): Promise<boolean | null> {
    const product = await this.getProduct(externalId);
    return product?.available ?? null;
  }

  buildProductUrl(externalId: string, slug?: string): string {
    if (slug) {
      return `${this.baseUrl}/${slug}/p`;
    }
    return `${this.baseUrl}/p?idsku=${externalId}`;
  }
}
