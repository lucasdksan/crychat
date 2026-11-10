import { describe, expect, it } from "vitest";

import { normalizeVtexSkuSearchRow } from "@/backend/modules/commerce/application/normalize-vtex-product";

describe("normalizeVtexSkuSearchRow", () => {
  it("normaliza produto VTEX com preço e link", () => {
    const product = normalizeVtexSkuSearchRow(
      {
        productId: 123,
        productName: "Fone Bluetooth",
        brand: "Marca X",
        linkText: "fone-bluetooth",
        items: [
          {
            itemId: "SKU-1",
            images: [{ imageUrl: "https://cdn.example/fone.jpg" }],
            sellers: [
              {
                commertialOffer: {
                  Price: 199.9,
                  ListPrice: 249.9,
                  IsAvailable: true,
                },
              },
            ],
          },
        ],
      },
      "https://minhaloja.vtexcommercestable.com.br",
    );

    expect(product).toMatchObject({
      externalId: "123",
      sku: "SKU-1",
      name: "Fone Bluetooth",
      price: 199.9,
      available: true,
      url: "https://minhaloja.vtexcommercestable.com.br/fone-bluetooth/p",
    });
  });
});
