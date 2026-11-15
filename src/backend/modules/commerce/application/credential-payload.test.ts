import { describe, expect, it } from "vitest";

import { buildCredentialPayload } from "@/backend/modules/commerce/application/credential-payload";

describe("buildCredentialPayload", () => {
  it("exige App Key e App Token na VTEX", () => {
    const missing = buildCredentialPayload({
      provider: "vtex",
      fields: {
        accountName: "minhaloja",
        environment: "vtexcommercestable",
        appKey: "vtexappkey-minhaloja",
      },
    });
    expect("error" in missing && missing.error).toContain("App Token");
  });

  it("monta o par de credenciais VTEX", () => {
    const built = buildCredentialPayload({
      provider: "vtex",
      fields: {
        accountName: "minhaloja",
        appKey: "vtexappkey-minhaloja",
        appToken: "token-secreto-1234",
      },
    });
    expect(built).toEqual({
      payload: {
        platform: "vtex",
        accountName: "minhaloja",
        environment: "vtexcommercestable",
        appKey: "vtexappkey-minhaloja",
        appToken: "token-secreto-1234",
      },
    });
  });

  it("reaproveita o App Token já salvo quando o campo vem vazio", () => {
    const built = buildCredentialPayload({
      provider: "vtex",
      fields: {
        accountName: "minhaloja",
        appKey: "nova-key",
        appToken: "",
      },
      existing: {
        platform: "vtex",
        accountName: "minhaloja",
        environment: "vtexcommercestable",
        appKey: "antiga",
        appToken: "token-antigo",
      },
    });
    expect("payload" in built && built.payload.platform === "vtex" && built.payload.appToken).toBe(
      "token-antigo",
    );
  });
});
