import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function shortId(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw.length <= 10) return raw;
  return `${raw.slice(0, 6)}…${raw.slice(-4)}`;
}

export async function GET() {
  const h = await headers();
  const host = h.get("host") || "";
  const proxyUserId = h.get("x-popey-auth-user-id") || h.get("x-middleware-request-x-popey-auth-user-id") || "";

  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const cookieNames = all.map((c) => c.name).sort();
  const authCookieNames = cookieNames.filter((name) => name.includes("-auth-token"));

  let userIdFromGetUser: string | null = null;
  let userIdFromGetSession: string | null = null;
  let getUserError: string | null = null;
  let getSessionError: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) getUserError = error.message;
    userIdFromGetUser = data?.user?.id || null;
  } catch (e) {
    getUserError = e instanceof Error ? e.message : "unknown_error";
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) getSessionError = error.message;
    userIdFromGetSession = data?.session?.user?.id || null;
  } catch (e) {
    getSessionError = e instanceof Error ? e.message : "unknown_error";
  }

  return NextResponse.json(
    {
      ok: true,
      host,
      hasProxyUserId: Boolean(proxyUserId),
      proxyUserId: shortId(proxyUserId),
      cookieCount: cookieNames.length,
      authCookieCount: authCookieNames.length,
      authCookieNames: authCookieNames.slice(0, 10),
      userIdFromGetUser: shortId(userIdFromGetUser),
      userIdFromGetSession: shortId(userIdFromGetSession),
      getUserError,
      getSessionError,
    },
    { status: 200 },
  );
}

