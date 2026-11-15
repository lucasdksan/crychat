import type {
  CommerceConnector,
  CommerceProduct,
} from "@/backend/modules/commerce/domain/types";
import {
  commerceRequest,
  stripHtml,
} from "@/backend/modules/commerce/infra/commerce-http";

type WooProduct = {
  id?: number;
  name?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  stock_status?: string;
  permalink?: string;
  short_description?: string;
  images?: Array<{ src?: string }>;
  categories?: Array<{ name?: string }>;
};

export class WooCommerceConnector implements CommerceConnector {
  readonly platform = "woocommerce" as const;

  constructor(
    private readonly storeUrl: string,
    private readonly consumerKey: string,
    private readonly consumerSecret: string,
  ) {}

  private authHeader() {
    const token = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`,
    ).toString("base64");
    return `Basic ${token}`;
  }

  private async get(path: string) {
    const url = new URL(path, `${this.storeUrl}/`);
    return commerceRequest(url.toString(), {
      headers: { Authorization: this.authHeader() },
    });
  }

  async validateCredentials() {
    try {
      await this.get("/wp-json/wc/v3/products?per_page=1");
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(options?: { maxPages?: number }): Promise<CommerceProduct[]> {
    const maxPages = options?.maxPages ?? 3;
    const products: CommerceProduct[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const rows = await this.get(
        `/wp-json/wc/v3/products?per_page=50&page=${page}&status=publish`,
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        break;
      }
      for (const row of rows as WooProduct[]) {
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
      `/wp-json/wc/v3/products/${encodeURIComponent(externalId)}`,
    )) as WooProduct;
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
    return `${this.storeUrl}/?p=${externalId}`;
  }

  private normalize(row: WooProduct): CommerceProduct | null {
    if (!row.id || !row.name?.trim()) {
      return null;
    }
    const price = Number(row.price);
    const listPrice = Number(row.regular_price);
    return {
      externalId: String(row.id),
      sku: row.sku?.trim() || undefined,
      name: row.name.trim(),
      category: row.categories?.[0]?.name,
      description: stripHtml(row.short_description),
      price: Number.isFinite(price) ? price : undefined,
      listPrice:
        Number.isFinite(listPrice) && listPrice > 0 ? listPrice : undefined,
      available: row.stock_status !== "outofstock",
      url: row.permalink,
      imageUrl: row.images?.[0]?.src,
    };
  }
}
