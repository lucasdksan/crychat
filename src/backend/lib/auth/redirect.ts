export function sanitizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/chat";
  }
  return path;
}
