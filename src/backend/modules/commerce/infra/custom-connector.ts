import type {
  CommerceConnector,
  CommerceProduct,
} from "@/backend/modules/commerce/domain/types";
import { commerceRequest } from "@/backend/modules/commerce/infra/commerce-http";

type CustomProduct = {
  id?: string | number;
  externalId?: string | number;
  sku?: string;
  name?: string;
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number | string;
  listPrice?: number | string;
  available?: boolean;
  url?: string;
  imageUrl?: string;
};

function asNumber(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function rowsFromPayload(payload: unknown): CustomProduct[] {
  if (Array.isArray(payload)) {
    return payload as CustomProduct[];
  }
  if (payload && typeof payload === "object") {
    const record = payload as { products?: unknown; data?: unknown };
    if (Array.isArray(record.products)) {
      return record.products as CustomProduct[];
    }
    if (Array.isArray(record.data)) {
      return record.data as CustomProduct[];
    }
  }
  return [];
}

export class CustomConnector implements CommerceConnector {
  readonly platform = "custom" as const;

  constructor(
    private readonly baseUrl: string,
    private readonly accessToken: string,
  ) {}

  private async load() {
    return commerceRequest(this.baseUrl, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  }

  async validateCredentials() {
    try {
      await this.load();
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(): Promise<CommerceProduct[]> {
    const payload = await this.load();
    return rowsFromPayload(payload)
      .map((row) => this.normalize(row))
      .filter((product): product is CommerceProduct => Boolean(product));
  }

  async getProduct(externalId: string) {
    const products = await this.listProducts();
    return products.find((product) => product.externalId === externalId) ?? null;
  }

  async getLivePrice(externalId: string) {
    const product = await this.getProduct(externalId);
    return product?.price ?? null;
  }

  async getLiveStock(externalId: string) {
    const product = await this.getProduct(externalId);
    return product?.available ?? null;
  }

  buildProductUrl(externalId: string) {
    return `${this.baseUrl}#${externalId}`;
  }

  private normalize(row: CustomProduct): CommerceProduct | null {
    const externalId = String(row.externalId ?? row.id ?? "").trim();
    const name = (row.name ?? row.title ?? "").trim();
    if (!externalId || !name) {
      return null;
    }
    return {
      externalId,
      sku: row.sku?.trim() || undefined,
      name,
      brand: row.brand?.trim() || undefined,
      category: row.category?.trim() || undefined,
      description: row.description?.trim() || undefined,
      price: asNumber(row.price),
      listPrice: asNumber(row.listPrice),
      available: row.available !== false,
      url: row.url,
      imageUrl: row.imageUrl,
    };
  }
}
