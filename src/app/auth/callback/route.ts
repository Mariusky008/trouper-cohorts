import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(new URL("/login", url.origin));
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
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  return NextResponse.redirect(new URL("/app/today", url.origin));
}
