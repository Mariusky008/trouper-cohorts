import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { env } from "../env";

function readJwtSubject(accessToken: string) {
  const payloadPart = String(accessToken || "").split(".")[1] || "";
  if (!payloadPart) return "";
  try {
    const payloadJson = Buffer.from(payloadPart, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);
    return String(payload?.sub || "").trim();
  } catch {
    return "";
  }
}

function decodeSupabaseCookiePayload(rawCookieValue: string) {
  const uriDecoded = decodeURIComponent(String(rawCookieValue || ""));
  if (!uriDecoded) return "";
  if (!uriDecoded.startsWith("base64-")) return uriDecoded;
  try {
    return Buffer.from(uriDecoded.slice("base64-".length), "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function readAccessTokenFromCookiePayload(payload: unknown) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return "";
  if (Array.isArray(payload)) {
    const firstTokenCandidate = payload.find((entry) => typeof entry === "string" && entry.split(".").length === 3);
    return typeof firstTokenCandidate === "string" ? firstTokenCandidate : "";
  }
  const record = payload as Record<string, unknown>;
  const directToken = String(record.access_token || "").trim();
  if (directToken) return directToken;
  const currentSession = record.currentSession as Record<string, unknown> | undefined;
  return String(currentSession?.access_token || "").trim();
}

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
  const requestHeaders = await headers();
  const proxyUserId = String(
    requestHeaders.get("x-popey-auth-user-id") ||
      requestHeaders.get("x-middleware-request-x-popey-auth-user-id") ||
      "",
  ).trim();
  if (proxyUserId) return proxyUserId;

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
      const decodedCookie = decodeSupabaseCookiePayload(authCookieValue);
      const parsedCookie = JSON.parse(decodedCookie);
      const accessToken = readAccessTokenFromCookiePayload(parsedCookie) || decodedCookie;
      const sub = readJwtSubject(accessToken);
      if (sub) return sub;
    } catch {
      // Ignore malformed cookie payload and continue.
      const decodedCookie = decodeSupabaseCookiePayload(authCookieValue);
      const sub = readJwtSubject(decodedCookie);
      if (sub) return sub;
    }
  }

  return null;
}
