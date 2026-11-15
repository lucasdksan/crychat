import { upsertCatalogProduct } from "@/backend/models/catalog-product.model";
import type { CommerceConnector } from "@/backend/modules/commerce/domain/types";

export async function importConnectorProducts(
  storeId: string,
  connector: CommerceConnector,
) {
  const products = await connector.listProducts({ maxPages: 3 });
  for (const product of products) {
    await upsertCatalogProduct(storeId, {
      externalId: product.externalId,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      price: product.price,
      listPrice: product.listPrice,
      available: product.available,
      url: product.url,
      imageUrl: product.imageUrl,
    });
  }
  return products.length;
}
