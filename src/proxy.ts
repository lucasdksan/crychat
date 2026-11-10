import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/backend/auth";
import { resolveProxyRedirect } from "@/backend/lib/proxy/policy";

function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-middleware-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export default auth(async (request) => {
  const { nextUrl } = request;
  const redirectPath = resolveProxyRedirect({
    pathname: nextUrl.pathname,
    search: nextUrl.search,
    searchParams: nextUrl.searchParams,
    isLoggedIn: Boolean(request.auth),
  });

  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, nextUrl));
  }

  return nextWithPathname(request);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
