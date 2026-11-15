export const DEFAULT_AUTHENTICATED_PATH = "/admin";

export function sanitizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  return path;
}
