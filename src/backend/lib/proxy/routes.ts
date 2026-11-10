export type PublicRoute = {
  path: string;
  whenAuthenticated: "redirect" | "next";
};

export const REDIRECT_WHEN_NOT_AUTHENTICATED = "/entrar";

export const publicRoutes = [
  { path: "/entrar", whenAuthenticated: "redirect" },
] as const satisfies readonly PublicRoute[];

export function matchesRoute(routePath: string, actualPath: string): boolean {
  if (routePath === actualPath) {
    return true;
  }
  if (routePath.includes(":")) {
    const pattern = `^${routePath.replace(/:[^/]+/g, "[^/]+")}$`;
    return new RegExp(pattern).test(actualPath);
  }
  return false;
}

export function findPublicRoute(pathname: string): PublicRoute | undefined {
  return publicRoutes.find((route) => matchesRoute(route.path, pathname));
}

export function isAuthRateLimitPath(): boolean {
  return false;
}
