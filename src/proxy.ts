import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") || "";
  const vitrineHost = String(host || "").split(":")[0].toLowerCase();
  const isVitrineHost = vitrineHost === "vitrine.popey.academy";
  const isPopeyLinkHost = /(^|\.)popey\.link$/i.test(host);
  const isStaticAssetRequest = /\.[a-z0-9]+$/i.test(pathname);
  if (isStaticAssetRequest && !isVitrineHost && !isPopeyLinkHost) {
    return NextResponse.next();
  }

  const isHumanMemberArea = pathname.startsWith("/popey-human/app");
  const isHumanAdminArea = pathname.startsWith("/admin/humain");
  const isHumanLogin = pathname.startsWith("/popey-human/login");
  const isHumanAdminLogin = pathname.startsWith("/popey-human/admin-login");
  const isProtectedAuthRoute = isHumanMemberArea || isHumanAdminArea || isHumanLogin || isHumanAdminLogin;
  const isPrefetchRequest =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";
  if (isPrefetchRequest && !isProtectedAuthRoute) {
    return NextResponse.next();
  }

  let response: NextResponse;
  let user: { id: string } | null = null;
  try {
    const updatedSession = await updateSession(request);
    response = updatedSession.response;
    user = updatedSession.user ? { id: updatedSession.user.id } : null;
  } catch (error) {
    console.error("[proxy] unexpected updateSession crash", error);
    response = NextResponse.next();
  }
  const downstreamHeaders = new Headers(request.headers);
  if (user?.id) {
    downstreamHeaders.set("x-popey-auth-user-id", user.id);
  } else {
    downstreamHeaders.delete("x-popey-auth-user-id");
  }
  response = copyResponseCookies(
    NextResponse.next({
      request: {
        headers: downstreamHeaders,
      },
    }),
    response,
  );
  const scoutPortalMatch = pathname.match(/^\/popey-human\/eclaireur\/([^/?#]+)/);
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

  const canRewriteVitrinePath =
    !pathname.startsWith("/vitrine") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !/\.[a-z0-9]+$/i.test(pathname);

  if (isVitrineHost && canRewriteVitrinePath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === "/" ? "/vitrine" : `/vitrine${pathname}`;
    return copyResponseCookies(NextResponse.rewrite(rewriteUrl), response);
  }

  const forceAuthScreen = request.nextUrl.searchParams.get("force") === "1";

  if (!user && (isHumanMemberArea || isHumanAdminArea)) {
    const loginPath = isHumanAdminArea ? "/popey-human/admin-login" : "/popey-human/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", pathname);
    return copyResponseCookies(NextResponse.redirect(loginUrl), response);
  }

  if (user && (isHumanLogin || isHumanAdminLogin) && !forceAuthScreen) {
    const requestedNext = request.nextUrl.searchParams.get("next");
    const nextPath = isHumanAdminLogin
      ? requestedNext && requestedNext.startsWith("/admin/")
        ? requestedNext
        : "/admin/humain"
      : requestedNext &&
          requestedNext.startsWith("/popey-human/") &&
          !requestedNext.startsWith("/popey-human/login") &&
          !requestedNext.startsWith("/popey-human/admin-login")
        ? requestedNext
        : "/popey-human/entrepreneur-smart-scan-test";
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

function copyResponseCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}
