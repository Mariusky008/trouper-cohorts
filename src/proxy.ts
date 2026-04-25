import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  const isPrefetchRequest =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";
  if (isPrefetchRequest) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const scoutPortalMatch = pathname.match(/^\/popey-human\/eclaireur\/([^/?#]+)/);

  const isPopeyLinkHost = /(^|\.)popey\.link$/i.test(host);
  const canRewritePopeyLinkPath =
    pathname !== "/" &&
    !pathname.startsWith("/popey-link") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !/\.[a-z0-9]+$/i.test(pathname);

  if (isPopeyLinkHost && canRewritePopeyLinkPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/popey-link${pathname}`;
    return copyResponseCookies(NextResponse.rewrite(rewriteUrl), response);
  }

  const isHumanMemberArea = pathname.startsWith("/popey-human/app");
  const isHumanAdminArea = pathname.startsWith("/admin/humain");
  const isHumanLogin = pathname.startsWith("/popey-human/login");

  if (!user && (isHumanMemberArea || isHumanAdminArea)) {
    const loginPath = isHumanMemberArea ? "/popey-human/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname);
    return copyResponseCookies(NextResponse.redirect(loginUrl), response);
  }

  if (user && isHumanLogin) {
    const requestedNext = request.nextUrl.searchParams.get("next");
    const nextPath =
      requestedNext &&
      requestedNext.startsWith("/popey-human/") &&
      !requestedNext.startsWith("/popey-human/login")
        ? requestedNext
        : "/popey-human/app";
    const appUrl = new URL(nextPath, request.url);
    return copyResponseCookies(NextResponse.redirect(appUrl), response);
  }

  if (scoutPortalMatch?.[1]) {
    response.cookies.set("popey_human_scout_last_access", decodeURIComponent(scoutPortalMatch[1]), {
      path: "/popey-human/eclaireur",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

function copyResponseCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}
