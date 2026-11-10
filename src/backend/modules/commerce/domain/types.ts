export type CommercePlatformKey =
  | "vtex"
  | "nuvemshop"
  | "shopify"
  | "woocommerce"
  | "custom";

export type CommerceProduct = {
  externalId: string;
  sku?: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  listPrice?: number;
  available: boolean;
  url?: string;
  imageUrl?: string;
};

export interface CommerceConnector {
  readonly platform: CommercePlatformKey;
  validateCredentials(): Promise<boolean>;
  listProducts(options?: {
    page?: number;
    pageSize?: number;
    maxPages?: number;
  }): Promise<CommerceProduct[]>;
  getProduct(externalId: string): Promise<CommerceProduct | null>;
  getLivePrice(externalId: string): Promise<number | null>;
  getLiveStock(externalId: string): Promise<boolean | null>;
  buildProductUrl(externalId: string, slug?: string): string;
}
