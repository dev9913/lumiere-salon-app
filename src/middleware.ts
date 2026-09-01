import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Prevents the browser's back/forward cache (bfcache) and any intermediate
// cache from serving a previously-rendered admin/account page after the
// session changes (logout, or switching identities in the same tab).
// Without this, hitting "back" can flash the last authenticated render
// before the server gets a chance to redirect — it's not a real auth bypass
// (every mutation still re-checks the session server-side), but it looks
// exactly like one, so it's worth closing.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
