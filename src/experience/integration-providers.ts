import type { CommerceProvider } from "@/experience/commerce-types";

export type IntegrationField = {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  secret?: boolean;
  required?: boolean;
};

export type IntegrationProviderSpec = {
  id: CommerceProvider;
  label: string;
  summary: string;
  fields: IntegrationField[];
};

/**
 * Credenciais exigidas por cada API de catálogo.
 * VTEX: par App Key + App Token (X-VTEX-API-AppKey / X-VTEX-API-AppToken).
 * Shopify: Admin API access token (X-Shopify-Access-Token) no domínio *.myshopify.com.
 * WooCommerce: consumer key + consumer secret (HTTP Basic na REST wc/v3).
 * Nuvemshop: access token + user_id da loja (header Authentication: bearer).
 */
export const INTEGRATION_PROVIDERS: IntegrationProviderSpec[] = [
  {
    id: "vtex",
    label: "VTEX",
    summary:
      "Account name, environment, App Key e App Token. Os dois segredos vão nos headers X-VTEX-API-AppKey e X-VTEX-API-AppToken.",
    fields: [
      {
        key: "accountName",
        label: "Account name",
        placeholder: "minhaloja",
        required: true,
      },
      {
        key: "environment",
        label: "Environment",
        placeholder: "vtexcommercestable",
        defaultValue: "vtexcommercestable",
        required: true,
      },
      {
        key: "appKey",
        label: "App Key",
        placeholder: "vtexappkey-minhaloja-XXXX",
        secret: true,
        required: true,
      },
      {
        key: "appToken",
        label: "App Token",
        placeholder: "Cole o App Token gerado junto com a App Key",
        secret: true,
        required: true,
      },
    ],
  },
  {
    id: "shopify",
    label: "Shopify",
    summary:
      "Domínio myshopify.com e Admin API access token (header X-Shopify-Access-Token), com escopo read_products.",
    fields: [
      {
        key: "shopDomain",
        label: "Domínio da loja",
        placeholder: "minhaloja.myshopify.com",
        required: true,
      },
      {
        key: "accessToken",
        label: "Admin API access token",
        placeholder: "shpat_...",
        secret: true,
        required: true,
      },
    ],
  },
  {
    id: "woocommerce",
    label: "WooCommerce",
    summary:
      "URL da loja, consumer key e consumer secret da REST API (autenticação Basic em /wp-json/wc/v3).",
    fields: [
      {
        key: "storeUrl",
        label: "URL da loja",
        placeholder: "https://minhaloja.com.br",
        required: true,
      },
      {
        key: "consumerKey",
        label: "Consumer key",
        placeholder: "ck_...",
        secret: true,
        required: true,
      },
      {
        key: "consumerSecret",
        label: "Consumer secret",
        placeholder: "cs_...",
        secret: true,
        required: true,
      },
    ],
  },
  {
    id: "nuvemshop",
    label: "Nuvemshop",
    summary:
      "ID da loja (user_id) e access token. A API usa o header Authentication: bearer e o escopo read_products.",
    fields: [
      {
        key: "storeId",
        label: "ID da loja (user_id)",
        placeholder: "1234567",
        required: true,
      },
      {
        key: "accessToken",
        label: "Access token",
        placeholder: "Token permanente da API",
        secret: true,
        required: true,
      },
    ],
  },
  {
    id: "custom",
    label: "API personalizada",
    summary:
      "URL que devolve JSON de produtos e um token Bearer. Aceita uma lista ou { products: [...] } com id, name, price, sku, imageUrl e url.",
    fields: [
      {
        key: "baseUrl",
        label: "URL do catálogo",
        placeholder: "https://api.minhaloja.com/products",
        required: true,
      },
      {
        key: "accessToken",
        label: "Token Bearer",
        placeholder: "Token de acesso da API",
        secret: true,
        required: true,
      },
    ],
  },
];

export function integrationProviderSpec(provider: string) {
  return INTEGRATION_PROVIDERS.find((item) => item.id === provider);
}
