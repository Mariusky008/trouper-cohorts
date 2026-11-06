// 🏪 « VOIR SA PAGE », depuis le mème d'un commerçant : le geste est compté (ce que son mème lui rapporte), puis sa page.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { memeCommerce, noterGesteCommerce } from "@/lib/direct/memes-commerces-serveur";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  const m = await memeCommerce(supabase, (await params).id);
  if (!m) return NextResponse.redirect(new URL("/collection#decouvrir", request.url), 302);
  const ua = request.headers.get("user-agent") ?? "";
  if (!/bot|crawl|spider|preview/i.test(ua)) await noterGesteCommerce(supabase, "clic", m.id);
  return NextResponse.redirect(new URL(`/site-internet/apercu/${encodeURIComponent(m.slug)}?via=meme`, request.url), 302);
}
