import type {
  CommerceConnector,
  CommerceProduct,
} from "@/backend/modules/commerce/domain/types";
import {
  commerceRequest,
  stripHtml,
} from "@/backend/modules/commerce/infra/commerce-http";

const API_VERSION = "2026-10";

type ShopifyVariant = {
  sku?: string | null;
  price?: string | { amount?: string } | null;
};

type ShopifyProductNode = {
  id?: string;
  title?: string;
  handle?: string;
  vendor?: string;
  productType?: string;
  description?: string;
  onlineStoreUrl?: string | null;
  featuredImage?: { url?: string | null } | null;
  variants?: { nodes?: ShopifyVariant[] };
};

function variantPrice(variant: ShopifyVariant | undefined) {
  const price = variant?.price;
  if (typeof price === "string") {
    const value = Number(price);
    return Number.isFinite(value) ? value : undefined;
  }
  if (price && typeof price.amount === "string") {
    const value = Number(price.amount);
    return Number.isFinite(value) ? value : undefined;
  }
  return undefined;
}

function externalId(gid: string | undefined) {
  if (!gid) {
    return "";
  }
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}

export class ShopifyConnector implements CommerceConnector {
  readonly platform = "shopify" as const;

  constructor(
    private readonly shopDomain: string,
    private readonly accessToken: string,
  ) {}

  private endpoint() {
    return `https://${this.shopDomain}/admin/api/${API_VERSION}/graphql.json`;
  }

  private async query<T>(graphql: string): Promise<T> {
    const data = await commerceRequest(this.endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ query: graphql }),
    });
    const body = data as { data?: T; errors?: Array<{ message?: string }> };
    if (body.errors?.length) {
      throw new Error(body.errors[0]?.message || "Shopify recusou a consulta.");
    }
    if (!body.data) {
      throw new Error("Shopify não retornou dados.");
    }
    return body.data;
  }

  async validateCredentials() {
    try {
      await this.query<{ shop: { name: string } }>("query { shop { name } }");
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(): Promise<CommerceProduct[]> {
    const data = await this.query<{
      products: { nodes: ShopifyProductNode[] };
    }>(`query {
      products(first: 50) {
        nodes {
          id
          title
          handle
          vendor
          productType
          description
          onlineStoreUrl
          featuredImage { url }
          variants(first: 1) { nodes { sku price } }
        }
      }
    }`);

    return (data.products?.nodes ?? [])
      .map((node) => this.normalize(node))
      .filter((product): product is CommerceProduct => Boolean(product));
  }

  async getProduct(externalIdValue: string) {
    const products = await this.listProducts();
    return (
      products.find((product) => product.externalId === externalIdValue) ?? null
    );
  }

  async getLivePrice(externalIdValue: string) {
    const product = await this.getProduct(externalIdValue);
    return product?.price ?? null;
  }

  async getLiveStock(externalIdValue: string) {
    const product = await this.getProduct(externalIdValue);
    return product?.available ?? null;
  }

  buildProductUrl(_externalId: string, slug?: string) {
    if (slug) {
      return `https://${this.shopDomain}/products/${slug}`;
    }
    return `https://${this.shopDomain}`;
  }

  private normalize(node: ShopifyProductNode): CommerceProduct | null {
    const id = externalId(node.id);
    const name = node.title?.trim();
    if (!id || !name) {
      return null;
    }
    const variant = node.variants?.nodes?.[0];
    return {
      externalId: id,
      sku: variant?.sku?.trim() || undefined,
      name,
      brand: node.vendor?.trim() || undefined,
      category: node.productType?.trim() || undefined,
      description: stripHtml(node.description),
      price: variantPrice(variant),
      available: true,
      url:
        node.onlineStoreUrl ||
        (node.handle
          ? `https://${this.shopDomain}/products/${node.handle}`
          : undefined),
      imageUrl: node.featuredImage?.url || undefined,
    };
  }
}
