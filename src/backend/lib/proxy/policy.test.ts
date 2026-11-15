import { describe, expect, it } from "vitest";

import { resolveProxyRedirect } from "@/backend/lib/proxy/policy";

describe("resolveProxyRedirect", () => {
  it("redireciona usuário não autenticado de /admin para /entrar com parâmetro to", () => {
    const result = resolveProxyRedirect({
      pathname: "/admin",
      search: "?section=ai-providers",
      searchParams: new URLSearchParams("section=ai-providers"),
      isLoggedIn: false,
    });
    expect(result).toBe("/entrar?to=%2Fadmin%3Fsection%3Dai-providers");
  });

  it("redireciona usuário não autenticado de /chat para /entrar", () => {
    const result = resolveProxyRedirect({
      pathname: "/chat",
      search: "",
      searchParams: new URLSearchParams(),
      isLoggedIn: false,
    });
    expect(result).toBe("/entrar?to=%2Fchat");
  });

  it("permite usuário não autenticado acessar /entrar", () => {
    const result = resolveProxyRedirect({
      pathname: "/entrar",
      search: "",
      searchParams: new URLSearchParams(),
      isLoggedIn: false,
    });
    expect(result).toBeNull();
  });

  it("redireciona usuário autenticado em /entrar para o destino sanitizado", () => {
    const result = resolveProxyRedirect({
      pathname: "/entrar",
      search: "?to=/admin",
      searchParams: new URLSearchParams("to=/admin"),
      isLoggedIn: true,
    });
    expect(result).toBe("/admin");
  });

  it("bloqueia open redirect em ?to=//evil.com", () => {
    const result = resolveProxyRedirect({
      pathname: "/entrar",
      search: "?to=//evil.com",
      searchParams: new URLSearchParams("to=//evil.com"),
      isLoggedIn: true,
    });
    expect(result).toBe("/admin");
  });

  it("permite usuário autenticado acessar rotas privadas", () => {
    const result = resolveProxyRedirect({
      pathname: "/admin/lojas/nova",
      search: "",
      searchParams: new URLSearchParams(),
      isLoggedIn: true,
    });
    expect(result).toBeNull();
  });
});