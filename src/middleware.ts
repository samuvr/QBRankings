import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";
import { VOTING_IDS } from "@/data/votings";

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

  // Al entrar a la home, limpiamos cualquier acceso previo a una votación
  // para que la contraseña se pida de nuevo cada vez que arranca el flujo.
  if (pathname === "/") {
    const response = NextResponse.next();
    for (const v of VOTING_IDS) {
      response.cookies.delete(`voting_access_${v}`);
    }
    return response;
  }

  const isLoginPage = pathname === "/admin";
  const isLoginApi = pathname === "/api/admin/login";

  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(request);
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
