import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/backend/lib/auth/errors";
import { sanitizeRedirectPath } from "@/backend/lib/auth/redirect";

describe("sanitizeRedirectPath", () => {
  it("retorna /admin quando vazio ou inválido", () => {
    expect(sanitizeRedirectPath()).toBe("/admin");
    expect(sanitizeRedirectPath(null)).toBe("/admin");
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/admin");
    expect(sanitizeRedirectPath("//evil.com")).toBe("/admin");
  });

  it("preserva caminhos relativos internos válidos", () => {
    expect(sanitizeRedirectPath("/admin")).toBe("/admin");
    expect(sanitizeRedirectPath("/admin?section=sdk")).toBe("/admin?section=sdk");
  });
});

describe("getAuthErrorMessage", () => {
  it("retorna null quando não há código", () => {
    expect(getAuthErrorMessage(null)).toBeNull();
    expect(getAuthErrorMessage(undefined)).toBeNull();
  });

  it("mapeia erro conhecido e fallback para desconhecido", () => {
    expect(getAuthErrorMessage("OAuthAccountNotLinked")).toContain("e-mail");
    expect(getAuthErrorMessage("UnknownCode")).toBe(
      "Não foi possível entrar. Tente novamente.",
    );
  });
});