import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { env } from "../env";

export async function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing Supabase public environment variables");
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
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

export async function getServerUserIdWithProxyFallback() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Continue with session/header fallbacks when user lookup is transiently unavailable.
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // Continue with proxy header fallback.
  }

  // Last-resort fallback: decode Supabase auth cookie and read JWT `sub`.
  // Useful when `getUser/getSession` are transiently unavailable in SSR.
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookieCandidates = allCookies
    .filter(({ name }) => name.includes("-auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const authCookieSingle = authCookieCandidates.find(({ name }) => !/\.\d+$/.test(name))?.value;
  let authCookieValue = authCookieSingle || "";
  if (!authCookieValue) {
    const chunked = authCookieCandidates
      .filter(({ name }) => /\.\d+$/.test(name))
      .sort((a, b) => {
        const ai = Number((a.name.match(/\.([0-9]+)$/) || [])[1] || "0");
        const bi = Number((b.name.match(/\.([0-9]+)$/) || [])[1] || "0");
        return ai - bi;
      })
      .map(({ value }) => value)
      .join("");
    authCookieValue = chunked;
  }
  if (authCookieValue) {
    try {
      const decodedCookie = decodeURIComponent(authCookieValue);
      const parsedCookie = JSON.parse(decodedCookie);
      const accessToken = String(parsedCookie?.access_token || "").trim();
      if (accessToken) {
        const payloadPart = accessToken.split(".")[1] || "";
        if (payloadPart) {
          const payloadJson = Buffer.from(payloadPart, "base64url").toString("utf8");
          const payload = JSON.parse(payloadJson);
          const sub = String(payload?.sub || "").trim();
          if (sub) return sub;
        }
      }
    } catch {
      // Ignore malformed cookie payload and continue.
    }
  }

  const requestHeaders = await headers();
  const proxyUserId = String(requestHeaders.get("x-popey-auth-user-id") || "").trim();
  return proxyUserId || null;
}
