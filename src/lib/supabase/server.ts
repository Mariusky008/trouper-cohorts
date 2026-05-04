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

  const requestHeaders = await headers();
  const proxyUserId = String(requestHeaders.get("x-popey-auth-user-id") || "").trim();
  return proxyUserId || null;
}
