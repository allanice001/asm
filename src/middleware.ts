import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Check if the user is authenticated
  if (!token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check if the user is an admin for admin-only routes
  if (
    (request.nextUrl.pathname.startsWith("/users") ||
      request.nextUrl.pathname.startsWith("/audit-logs")) &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/accounts/:path*",
    "/permission-sets/:path*",
    "/policies/:path*",
    "/deployments/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/audit-logs/:path*",
    "/settings/:path*",
  ],
};
