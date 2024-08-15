import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Redirect logged out users.
  let session = request.cookies.get("sessionid");
  let csrfToken = request.cookies.get("csrftoken");
  if (!session || !csrfToken) {
    return NextResponse.redirect(new URL("/accounts/login/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. / index page
     * 2. /api routes
     * 3. /_next (Next.js internals)
     * 4. /_static (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     * 6. folder containing logos inside "public"
     */
    "/((?!$|api/|_next/|_static/|demo-1|demo-2|demo-3|logos|[\\w-]+\\.\\w+).*)",
  ],
};
