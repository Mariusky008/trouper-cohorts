// 🔥 « DÉCOUVRIR » (`lib/direct/memes-commerces.ts`) : les mèmes du jour des commerçants.
//
// GET : ceux de sa ville (son compte), puis des autres villes ClikMe s'il y en a peu → { memes, ville } ; et `publics` :
//      les mèmes que les gens de SA ville ont choisi de montrer (l'étape 3, sur leur accord), ses proches d'abord ;
//      `jour` : 🔥 le mème du jour (le thème, combien de réponses — vraies —, s'il a répondu ; les réponses, s'il a
//      répondu). Chaque mème porte ses réactions 😂 ❤️ 🔥 (`reac`) — le lot 2, 7 novembre 2026.
// POST { action: "geste", type: "partage", id } : un partage (ce que son mème rapporte au commerçant). Sans compte.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { idMemeCommerceValide } from "@/lib/direct/memes-commerces";
import { memeCommerce, memesDecouvrir, noterGesteCommerce } from "@/lib/direct/memes-commerces-serveur";
import { etatDuJour, memesPublics, reponsesDuJour } from "@/lib/direct/ma-figurine-serveur";
import { reactionsDe } from "@/lib/direct/reactions-memes-serveur";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase).catch(() => null);
  const [r, publics, jour] = await Promise.all([memesDecouvrir(supabase, moi?.villeSlug ?? ""), memesPublics(supabase, moi?.villeSlug ?? "", 20, moi).catch(() => []), etatDuJour(supabase, moi)]);
  const [reponses, reacs] = await Promise.all([reponsesDuJour(supabase, moi, jour).catch(() => []), reactionsDe(supabase, r.memes.map((m) => `c-${m.id}`), moi?.id).catch(() => ({}) as Record<string, never>)]);
  const memes = r.memes.map((m) => ({ ...m, ...(reacs[`c-${m.id}`] ? { reac: reacs[`c-${m.id}`] } : {}) }));
  return NextResponse.json({ ok: true, ...r, memes, publics, jour: { ...jour, reponses }, compte: Boolean(moi) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (p?.action !== "geste" || p.type !== "partage" || !idMemeCommerceValide(p.id)) return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
  const supabase = createAdminClient();
  if (!(await memeCommerce(supabase, p.id))) return NextResponse.json({ error: "Ce mème n’existe plus." }, { status: 404 });
  await noterGesteCommerce(supabase, "partage", p.id as string);
  return NextResponse.json({ ok: true });
}
