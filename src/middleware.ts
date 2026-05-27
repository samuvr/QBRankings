import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const response = NextResponse.next();
    for (const cookie of request.cookies.getAll()) {
      if (
        cookie.name.startsWith("voter_access_") ||
        cookie.name.startsWith("voting_admin_")
      ) {
        response.cookies.delete(cookie.name);
      }
    }
    return response;
  }

  const isLoginPage = pathname === "/admin";
  const isLoginApi = pathname === "/api/admin/login";
  const isVotingAdminAccess = /^\/admin\/[^/]+\/access$/.test(pathname);
  const isVotingAdminAccessApi = /^\/api\/admin\/votings\/[^/]+\/access$/.test(pathname);
  if (isLoginPage || isLoginApi || isVotingAdminAccess || isVotingAdminAccessApi) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(request);

  const isVotingsMgmtPage = pathname.startsWith("/admin/votings");
  const isVotingsMgmtApi =
    pathname.startsWith("/api/admin/votings") && !isVotingAdminAccessApi;

  if (isVotingsMgmtPage || isVotingsMgmtApi) {
    if (authed) return NextResponse.next();
    if (isVotingsMgmtApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Para /admin/[slug] y APIs admin no-mgmt: el server component / handler
  // delega la auth granular (superadmin O voting_admin de ese id).
  return NextResponse.next();
}
