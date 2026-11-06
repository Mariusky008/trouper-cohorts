// 🔥 « DÉCOUVRIR » (`lib/direct/memes-commerces.ts`) : les mèmes du jour des commerçants.
//
// GET : ceux de sa ville (son compte), puis des autres villes ClikMe s'il y en a peu → { memes, ville }.
// POST { action: "geste", type: "partage", id } : un partage (ce que son mème rapporte au commerçant). Sans compte.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { idMemeCommerceValide } from "@/lib/direct/memes-commerces";
import { memeCommerce, memesDecouvrir, noterGesteCommerce } from "@/lib/direct/memes-commerces-serveur";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase).catch(() => null);
  const r = await memesDecouvrir(supabase, moi?.villeSlug ?? "");
  return NextResponse.json({ ok: true, ...r }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (p?.action !== "geste" || p.type !== "partage" || !idMemeCommerceValide(p.id)) return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
  const supabase = createAdminClient();
  if (!(await memeCommerce(supabase, p.id))) return NextResponse.json({ error: "Ce mème n’existe plus." }, { status: 404 });
  await noterGesteCommerce(supabase, "partage", p.id as string);
  return NextResponse.json({ ok: true });
}
