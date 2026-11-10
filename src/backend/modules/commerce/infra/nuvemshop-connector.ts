import type { CommerceConnector, CommerceProduct } from "@/backend/modules/commerce/domain/types";

const NOT_READY =
  "Integração Nuvemshop ainda não implementada nesta versão do CryChat.";

export class NuvemshopConnector implements CommerceConnector {
  readonly platform = "nuvemshop" as const;

  async validateCredentials(): Promise<boolean> {
    throw new Error(NOT_READY);
  }

  async listProducts(): Promise<CommerceProduct[]> {
    throw new Error(NOT_READY);
  }

  async getProduct(): Promise<CommerceProduct | null> {
    throw new Error(NOT_READY);
  }

  async getLivePrice(): Promise<number | null> {
    throw new Error(NOT_READY);
  }

  async getLiveStock(): Promise<boolean | null> {
    throw new Error(NOT_READY);
  }

  buildProductUrl(): string {
    throw new Error(NOT_READY);
  }
}
