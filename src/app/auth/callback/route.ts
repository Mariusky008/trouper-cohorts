import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (!code && !(tokenHash && type)) {
    console.error("Callback error: Missing code or token_hash/type");
    return NextResponse.redirect(new URL("/login?error=missing_params", url.origin));
  }

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        type: type as
          | "signup"
          | "invite"
          | "magiclink"
          | "recovery"
          | "email_change"
          | "email",
        token_hash: tokenHash as string,
      });

  if (error) {
    console.error("Callback auth error:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }

  return NextResponse.redirect(new URL("/app/today", url.origin));
}
