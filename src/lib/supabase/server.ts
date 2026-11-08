import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { env } from "../env";
import { cookieDomainForHost } from "./cookie-domain";

export async function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing Supabase public environment variables");
  }

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const domain = cookieDomainForHost(requestHeaders.get("host") || "");

  return createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      // Important: ensure cookies are sent on both `/popey-human/*` and `/admin/*`.
      cookieOptions: { path: "/", ...(domain ? { domain } : {}) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * 🔐 QUI EST CONNECTÉ, CÔTÉ SERVEUR — SEULEMENT UNE IDENTITÉ VÉRIFIÉE (elle sert à toutes les gardes admin :
 * `lib/admin-guard.ts`, les routes `/api/admin/*`, les actions serveur de l'admin).
 *
 * Deux sources, et deux seulement :
 *   · l'en-tête `x-popey-auth-user-id`, que SEUL le middleware pose (`src/proxy.ts`), après avoir fait vérifier la
 *     session par Supabase (`getUser()`) — il efface d'abord toute version venue du client ;
 *   · `getUser()` ici même : Supabase vérifie le jeton.
 *
 * 7 novembre 2026 — LA FAILLE FERMÉE : quand `getUser()` refusait la session, on se rabattait sur `getSession()`, puis
 * sur le `sub` lu dans le cookie. Ni l'un ni l'autre ne vérifie la signature : ils relisent ce que le navigateur
 * envoie. Un cookie fabriqué, portant l'identifiant d'un administrateur, ouvrait donc les routes `/api/admin/*` et la
 * page `/admin` (`scripts/essai-admin-garde-route.mjs`). Le prix, accepté par le propriétaire : si Supabase est en
 * panne, l'admin dit « connexion requise » le temps de la panne.
 */
export async function getServerUserIdWithProxyFallback() {
  const requestHeaders = await headers();
  const proxyUserId = String(
    requestHeaders.get("x-popey-auth-user-id") ||
      requestHeaders.get("x-middleware-request-x-popey-auth-user-id") ||
      "",
  ).trim();
  if (proxyUserId) return proxyUserId;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // (Supabase injoignable : personne n'est reconnu — jamais une identité non vérifiée à la place)
  }
  return null;
}
