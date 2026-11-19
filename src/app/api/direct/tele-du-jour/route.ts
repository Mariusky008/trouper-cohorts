// 📺 MA TÉLÉ DU JOUR (`lib/direct/tele-du-jour.ts`, `tele-du-jour-serveur.ts` ; `docs/univers/decouvrir.md`, section 4.2 ;
// le lot D1) : la sienne seulement (le cookie d'habitant).
//
// GET                                         → { tele } : ses passions, les vidéos qui l'attendent (mêlées selon ses
//                                               poids, sans ce qu'il a vu), sa pièce et sa figurine
// POST { action: "vue", id, fin?, secondes?, illisible? } → { ok } : vue jusqu'au bout (son thème monte), passée avant
//                                               15 s (il descend) ; elle ne revient plus
// POST { action: "garder", id }               → { ok, deja? } : 📌 à la télé de sa maison
// POST { action: "envoyer", id, a }           → { ok } : 📤 à un proche (sa clé) : un message dans leur conversation, sur
//                                               la télé de leur duo ; la notification part après la réponse
// 404 : une vidéo qui n'est pas à sa télé (on n'envoie ni ne garde autre chose).
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { apresEcrit } from "@/lib/direct/ecrit-serveur";
import { envoyerVideo, garderVideo, maTeleDuJour, noterVue } from "@/lib/direct/tele-du-jour-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  return NextResponse.json({ ok: true, tele: await maTeleDuJour(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p?.action === "vue") return repondre(await noterVue(supabase, moi.id, p.id, { fin: p.fin, secondes: p.secondes, illisible: p.illisible }));
  if (p?.action === "garder") {
    const r = await garderVideo(supabase, moi, p.id);
    return repondre(r, r.deja ? { deja: true } : {});
  }
  if (p?.action === "envoyer") {
    const r = await envoyerVideo(supabase, moi, p.id, p.a);
    const a = r.apres;
    if (a) after(() => apresEcrit(supabase, moi, a).catch(() => undefined));
    return repondre(r);
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400, headers: sansCache });
}
