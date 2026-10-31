/**
 * CampusOS AI - Next.js Edge Middleware
 * Route protection: redirects unauthenticated users to /login.
 * Uses cookie PRESENCE check only (no crypto in Edge runtime).
 * Full token verification happens in Node.js API routes.
 */

import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "campusos_session";

// Paths that never require authentication
const PUBLIC_PREFIXES = ["/login", "/api/v1/auth", "/_next", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow all other API routes (handlers do their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (!token || !token.includes(".")) {
    const loginUrl = new URL("/login", req.url);
    // Preserve destination so login can redirect back
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If logged-in user tries to visit /login, send them to dashboard
  // (handled above via early return since /login is public)

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};

