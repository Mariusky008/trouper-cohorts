// 🧥 MES MISES DE CÔTÉ — celles de l'habitant du cookie, et seulement elles.
//
//   GET   → ses demandes et la réponse du magasin quand il y en a une ;
//   POST  { action: "lien", … }     → le lien signé à joindre au message WhatsApp
//                                      (il ne range rien : voir `mise-de-cote.ts`) ;
//   POST  { action: "envoyee", jeton } → le message est parti : la demande entre
//                                      dans sa Maison ;
//   PATCH { r }                     → il a vu la réponse.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { SITE_URL } from "@/lib/site-url";
import { lireJetonCote, listerDemandes, marquerVue, noterEnvoi, nouvelleDemande, pageDeMagasin, photoDeLien, signerCote } from "@/lib/direct/mise-de-cote";

export const dynamic = "force-dynamic";

const PRIVE = { "cache-control": "private, no-store" };
const s = (v: unknown, n = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

function client() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function corps(req: Request): Promise<Record<string, unknown>> {
  try {
    const o = await req.json();
    return o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false }, { headers: PRIVE });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true, demandes: [] }, { headers: PRIVE });
  const demandes = await listerDemandes(supabase, h.id);
  return NextResponse.json(demandes ? { ok: true, demandes } : { ok: false }, { headers: PRIVE });
}

export async function POST(req: Request) {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
  const p = await corps(req);
  /* UN ESSAI QUI DONNE ENVIE DE RÉSERVER FAIT NAÎTRE L'HABITANT, comme une
     première pièce rangée dans son dressing : un jeton anonyme sur ce
     téléphone, rien de plus. Sans lui, le commerçant répondrait dans le vide.
     Seulement pour préparer un lien, et seulement avec la ville du magasin. */
  const ville = p.action === "lien" ? villeSlug(s(p.ville, 80)) : "";
  const h = (await habitantCourant(supabase)) ?? (ville ? await assurerHabitant(supabase, ville) : null);
  // SANS HABITANT, PAS DE SUIVI : la page retombe sur le message simple, sans lien.
  if (!h) return NextResponse.json({ ok: false, sansMaison: true }, { status: 401, headers: PRIVE });

  if (p.action === "lien") {
    const quoi = s(p.quoi);
    if (!quoi) return NextResponse.json({ ok: false, error: "Quelle pièce ?" }, { status: 400, headers: PRIVE });
    const r = nouvelleDemande();
    const prenom = s(p.prenom, 40) || h.prenom;
    const jeton = signerCote({
      r,
      h: h.id,
      o: quoi,
      ...(s(p.prix, 30) ? { p: s(p.prix, 30) } : {}),
      ...(photoDeLien(p.photo) ? { ph: photoDeLien(p.photo) } : {}),
      ...(prenom ? { q: prenom } : {}),
      ...(s(p.magasin, 80) ? { m: s(p.magasin, 80) } : {}),
      ...(s(p.carte, 80) ? { cm: s(p.carte, 80) } : {}),
      ...(pageDeMagasin(p.page) ? { pg: pageDeMagasin(p.page) } : {}),
      ...(p.seul === true ? { s: 1 as const } : {}),
      t: Date.now(),
    });
    if (!jeton) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
    return NextResponse.json({ ok: true, r, jeton, lien: `${SITE_URL}/reponse/cote/${jeton}` }, { headers: PRIVE });
  }

  if (p.action === "envoyee") {
    const j = lireJetonCote(s(p.jeton, 2000));
    // UN JETON N'ENREGISTRE QUE POUR CELUI À QUI IL A ÉTÉ FAIT.
    if (!j || j.h !== h.id) return NextResponse.json({ ok: false, error: "Demande inconnue." }, { status: 400, headers: PRIVE });
    const ok = await noterEnvoi(supabase, j);
    return NextResponse.json({ ok }, { status: ok ? 200 : 500, headers: PRIVE });
  }

  return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400, headers: PRIVE });
}

export async function PATCH(req: Request) {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: false }, { status: 401, headers: PRIVE });
  const r = s((await corps(req)).r, 40);
  const ok = r ? await marquerVue(supabase, h.id, r) : false;
  return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: PRIVE });
}
