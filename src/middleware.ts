import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;

  // Public paths that don't require authentication
  const publicPaths = ["/login"];

  // Admin-only paths
  const adminOnlyPaths = ["/users"];

  // Current path
  const path = request.nextUrl.pathname;

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`),
  );

  // Check if the current path is an admin-only path
  const isAdminOnlyPath = adminOnlyPaths.some(
    (adminPath) => path === adminPath || path.startsWith(`${adminPath}/`),
  );

  // API routes are handled by the API route handlers
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated and not on a public path
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // Redirect to home if authenticated and on a public path
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check for admin access to admin-only paths
  if (isAuthenticated && isAdminOnlyPath && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
