import type { CommerceProduct } from "@/backend/modules/commerce/domain/types";

type VtexSkuSearchRow = {
  productId?: string | number;
  productName?: string;
  brand?: string;
  categoryId?: string | number;
  linkText?: string;
  items?: Array<{
    itemId?: string;
    name?: string;
    images?: Array<{ imageUrl?: string }>;
    sellers?: Array<{
      commertialOffer?: {
        Price?: number;
        ListPrice?: number;
        IsAvailable?: boolean;
      };
    }>;
  }>;
};

export function normalizeVtexSkuSearchRow(
  row: VtexSkuSearchRow,
  baseUrl: string,
): CommerceProduct | null {
  const externalId = String(row.productId ?? "").trim();
  if (!externalId) {
    return null;
  }
  const item = row.items?.[0];
  const offer = item?.sellers?.[0]?.commertialOffer;
  const linkText = row.linkText?.trim();
  return {
    externalId,
    sku: item?.itemId,
    name: row.productName?.trim() || `Produto ${externalId}`,
    brand: row.brand?.trim() || undefined,
    category: row.categoryId ? String(row.categoryId) : undefined,
    price: offer?.Price,
    listPrice: offer?.ListPrice,
    available: offer?.IsAvailable ?? false,
    url: linkText ? `${baseUrl}/${linkText}/p` : undefined,
    imageUrl: item?.images?.[0]?.imageUrl,
  };
}
