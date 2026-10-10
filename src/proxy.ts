import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { estNotreHote } from "@/lib/site-url";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") || "";
  const vitrineHost = String(host || "").split(":")[0].toLowerCase();
  const isVitrineHost = vitrineHost === "vitrine.popey.academy";
  const isPopeyLinkHost = /(^|\.)popey\.link$/i.test(host);

  // SÉCURITÉ — AUCUN EN-TÊTE D'IDENTITÉ VENU DU CLIENT N'EST DIGNE DE CONFIANCE.
  // Seul ce middleware a le droit de poser `x-popey-auth-user-id`, à partir de
  // la vraie session. On efface donc d'entrée, AVANT toute sortie anticipée,
  // les deux formes qu'un client pourrait forger :
  //   · `x-popey-auth-user-id` ;
  //   · `x-middleware-request-x-popey-auth-user-id`, la forme préfixée que
  //     Next.js n'inscrit pas dans sa liste d'en-têtes internes et laisse donc
  //     passer — et que le serveur relit comme repli (voir
  //     `getServerUserIdWithProxyFallback`).
  // Le faire ICI, et non plus bas, ferme deux trous : une requête marquée
  // « préchargement » ou une requête de fichier statique ressortait jusque-là
  // par `NextResponse.next()` SANS nettoyage, donc avec l'en-tête forgé intact.
  // Résultat : quelqu'un connaissant l'identifiant d'un administrateur pouvait
  // se faire passer pour lui sur les pages /admin et les routes /api/admin.
  const entrantes = new Headers(request.headers);
  entrantes.delete("x-popey-auth-user-id");
  entrantes.delete("x-middleware-request-x-popey-auth-user-id");
  const sansIdentite = () => NextResponse.next({ request: { headers: entrantes } });

  const isStaticAssetRequest = /\.[a-z0-9]+$/i.test(pathname);
  if (isStaticAssetRequest && !isVitrineHost && !isPopeyLinkHost) {
    return sansIdentite();
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
    return sansIdentite();
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
  // `entrantes` a déjà perdu les deux formes forgées plus haut : on repart de
  // là et on n'y pose l'identité QUE si une vraie session existe.
  const downstreamHeaders = entrantes;
  if (user?.id) {
    downstreamHeaders.set("x-popey-auth-user-id", user.id);
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
    return copyResponseCookies(NextResponse.rewrite(rewriteUrl, { request: { headers: downstreamHeaders } }), response);
  }

  const canRewriteVitrinePath =
    !pathname.startsWith("/vitrine") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !/\.[a-z0-9]+$/i.test(pathname);

  if (isVitrineHost && canRewriteVitrinePath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === "/" ? "/vitrine" : `/vitrine${pathname}`;
    return copyResponseCookies(NextResponse.rewrite(rewriteUrl, { request: { headers: downstreamHeaders } }), response);
  }

  // DOMAINE PERSO d'un commerçant (ex. salon-elodie.fr) : tout host inconnu de
  // Popey, sur la RACINE uniquement, est servi par le résolveur de domaine (qui
  // retrouve le site publié via l'en-tête Host). Périmètre volontairement étroit
  // (racine seule) pour ne rien changer aux autres chemins/hôtes.
  const isKnownPopeyHost =
    !vitrineHost ||
    estNotreHote(vitrineHost) ||
    vitrineHost.endsWith(".vercel.app") ||
    /(^|\.)popey\.link$/i.test(vitrineHost) ||
    vitrineHost === "localhost" ||
    vitrineHost === "127.0.0.1";
  if (!isKnownPopeyHost && pathname === "/") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/site-internet/domain";
    return copyResponseCookies(NextResponse.rewrite(rewriteUrl, { request: { headers: downstreamHeaders } }), response);
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
