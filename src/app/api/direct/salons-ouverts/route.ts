// 🛋️ LES SALONS OUVERTS (`lib/direct/salons-ouverts.ts`, `salons-ouverts-serveur.ts` ; `docs/univers/decouvrir.md`,
// sections 5, 6 et 18 ; les lots D3 et D4) — le sien seulement (le cookie d'habitant).
//
// GET ?accueil=1                               → { cartes, age? } : les salons, ses passions d'abord (`age` : dis d'abord
//                                                si tu as 18 ans)
// GET ?salon=<id>&depuis=<ms>&connus=<q,q>     → { pouls } : qui est là, ce qui s'est dit depuis ; il redit qu'il est là
// GET ?conversation=<id>                       → { messages } : les 48 dernières heures
// POST { action: "age", adulte }               → { adulte } : 18 ans ou plus (un « non » ne se retourne pas)
// POST { action: "entrer", theme }             → { ouverture } : le salon le plus rempli qui a une place
// POST { action: "ecrire", salon, sorte, texte?, cle?, a? } → { message } ; un texte relu avant de partir (`refus`)
// POST { action: "sortir", salon }             → { ok } : sa place se libère
// POST { action: "signaler", salon, q, motif, message? } → { ok, exclu } ; trois en une heure : 24 h dehors
// POST { action: "ne-plus-voir" | "revoir", q } → { caches }
// `CLIKME_SALONS_OUVERTS=0` : fermés (404).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { direSesDixHuitAns } from "@/lib/direct/majorite-serveur";
import { salonsOuverts } from "@/lib/direct/interrupteurs-serveur";
import { accueilDesSalons, conversationDuSalon, ecrireAuSalon, entrerAuSalon, nePlusVoir, poulsDuSalon, signalerAuSalon, sortirDuSalon } from "@/lib/direct/salons-ouverts-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };
const FERMES = { error: "Les salons ouverts sont fermés pour l’instant." };

export async function GET(request: Request) {
  if (!salonsOuverts()) return NextResponse.json(FERMES, { status: 404, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const u = new URL(request.url).searchParams;
  if (u.get("accueil")) return NextResponse.json({ ok: true, ...(await accueilDesSalons(supabase, moi)) }, { headers: sansCache });
  if (u.get("conversation")) {
    const r = await conversationDuSalon(supabase, moi, u.get("conversation"));
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, messages: r.messages }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  }
  const r = await poulsDuSalon(supabase, moi, u.get("salon"), u.get("depuis"), u.get("connus"));
  return NextResponse.json(r.error ? { error: r.error } : { ok: true, pouls: r.pouls }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
}

export async function POST(request: Request) {
  if (!salonsOuverts()) return NextResponse.json(FERMES, { status: 404, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}, aussi: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error, ...aussi } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p.action === "age") {
    const r = await direSesDixHuitAns(supabase, moi.id, p.adulte);
    return repondre(r, { adulte: r.adulte });
  }
  if (p.action === "entrer") {
    const r = await entrerAuSalon(supabase, moi, p.theme);
    return repondre(r, { ouverture: r.ouverture }, { ...(r.age ? { age: true } : {}), ...(r.figurine ? { figurine: true } : {}), ...(r.exclu ? { exclu: true } : {}) });
  }
  if (p.action === "ecrire") {
    const r = await ecrireAuSalon(supabase, moi, p);
    return repondre(r, { message: r.message }, r.refus ? { refus: r.refus } : {});
  }
  if (p.action === "sortir") return repondre(await sortirDuSalon(supabase, moi, p.salon));
  if (p.action === "signaler") {
    const r = await signalerAuSalon(supabase, moi, p);
    return repondre(r, { exclu: Boolean(r.exclu) });
  }
  if (p.action === "ne-plus-voir" || p.action === "revoir") {
    const r = await nePlusVoir(supabase, moi, p.q, p.action === "revoir");
    return repondre(r, { caches: r.caches });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
