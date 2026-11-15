import type {
  CommerceConnector,
  CommerceProduct,
} from "@/backend/modules/commerce/domain/types";
import {
  commerceRequest,
  localizedName,
  stripHtml,
} from "@/backend/modules/commerce/infra/commerce-http";

type NuvemshopProduct = {
  id?: number;
  name?: unknown;
  description?: unknown;
  brand?: string | null;
  published?: boolean;
  canonical_url?: string;
  images?: Array<{ src?: string }>;
  variants?: Array<{
    sku?: string | null;
    price?: string | null;
    compare_at_price?: string | null;
    stock?: number | null;
  }>;
};

const USER_AGENT = "CryChat (integracao@crychat.app)";

export class NuvemshopConnector implements CommerceConnector {
  readonly platform = "nuvemshop" as const;

  constructor(
    private readonly storeId: string,
    private readonly accessToken: string,
  ) {}

  private async get(path: string) {
    return commerceRequest(
      `https://api.nuvemshop.com.br/v1/${this.storeId}${path}`,
      {
        headers: {
          Authentication: `bearer ${this.accessToken}`,
          "User-Agent": USER_AGENT,
        },
      },
    );
  }

  async validateCredentials() {
    try {
      await this.get("/products?per_page=1");
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(options?: { maxPages?: number }): Promise<CommerceProduct[]> {
    const maxPages = options?.maxPages ?? 3;
    const products: CommerceProduct[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const rows = await this.get(`/products?page=${page}&per_page=50`);
      if (!Array.isArray(rows) || rows.length === 0) {
        break;
      }
      for (const row of rows as NuvemshopProduct[]) {
        const normalized = this.normalize(row);
        if (normalized) {
          products.push(normalized);
        }
      }
      if (rows.length < 50) {
        break;
      }
    }
    return products;
  }

  async getProduct(externalId: string) {
    const row = (await this.get(
      `/products/${encodeURIComponent(externalId)}`,
    )) as NuvemshopProduct;
    return this.normalize(row);
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
    return `https://api.nuvemshop.com.br/v1/${this.storeId}/products/${externalId}`;
  }

  private normalize(row: NuvemshopProduct): CommerceProduct | null {
    const name = localizedName(row.name);
    if (!row.id || !name) {
      return null;
    }
    const variant = row.variants?.[0];
    const price = Number(variant?.price);
    const listPrice = Number(variant?.compare_at_price);
    return {
      externalId: String(row.id),
      sku: variant?.sku?.trim() || undefined,
      name,
      brand: row.brand?.trim() || undefined,
      description: stripHtml(localizedName(row.description)),
      price: Number.isFinite(price) ? price : undefined,
      listPrice:
        Number.isFinite(listPrice) && listPrice > 0 ? listPrice : undefined,
      available: row.published !== false && (variant?.stock ?? 1) !== 0,
      url: row.canonical_url,
      imageUrl: row.images?.[0]?.src,
    };
  }
}
