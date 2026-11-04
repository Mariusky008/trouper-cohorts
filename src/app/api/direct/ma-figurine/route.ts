// 🗣️ SA PROPRE FIGURINE (`lib/direct/ma-figurine.ts`).
//
// GET : où il en est (le compteur jusqu'à 10, sa photo, sa figurine, ses expressions, ses messages), et la
//   démonstration (la figurine du propriétaire : ses expressions déjà faites, et si un texte peut être lu). Sans
//   cookie : 0 / 10.
// POST { action: "photo", photo: data:image…, accord: true, prenom?, ville? } : sa photo — dès le départ (sans compte,
//   on lui en ouvre un dans `ville`, une ville des commerces ClikMe) ; le moteur fabrique ensuite sa figurine.
// POST { action: "fabriquer" } : un pas de fabrication de sa figurine (le moteur) → l'état (`enCours` : rappeler).
// POST { action: "refaire", autrePhoto? } : une nouvelle figurine (même photo), ou retour à la photo.
// POST { action: "expressions" } : un tour de fabrication de ses expressions (le moteur d'image) → l'état.
// POST { action: "voix", texte, voix } : son texte lu par la voix choisie (ElevenLabs) → { son: data:audio/mpeg… }.
// POST { action: "message", son: data:audio…, duree, commerces: [liens], sentiment?, texte?, voix? } : un message de
//   sa figurine → { id, lien }.
// POST { action: "signaler", id } : celui qui a reçu un message le signale (pas besoin d'être quelqu'un).
// POST { action: "demo", quoi: "expressions" } : un tour pour la démonstration (une seule fois en tout, puis gardé).
// POST { action: "demo", quoi: "voix", texte, voix } : SON texte, dit par la démonstration (sans compte, compté).
// POST { action: "demo", quoi: "message", texte, voix, sentiment?, prenom? } : il l'envoie → { id, lien }.
// Un habitant n'est créé ici que par « photo » (son geste : « Créer ma figurine »).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { lienMessage } from "@/lib/direct/ma-figurine";
import {
  enregistrerMessage,
  envoyerMessageDemo,
  envoyerPhoto,
  etatDemo,
  etatMaFigurine,
  fabriquerExpressionsDemo,
  fabriquerMaFigurine,
  refaireMaFigurine,
  fabriquerSesExpressions,
  lireSonTexte,
  signalerMessage,
  visiteurDe,
  voixDemo,
} from "@/lib/direct/ma-figurine-serveur";

export const dynamic = "force-dynamic";
// (un tour d'expressions : quatre images du moteur, en même temps)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const enSon = (mp3: Buffer) => `data:audio/mpeg;base64,${mp3.toString("base64")}`;

/** Une ville où ClikMe a au moins un commerce client (on n'ouvre pas de compte ailleurs). */
async function villeOuverte(supabase: ReturnType<typeof createAdminClient>, ville: string): Promise<boolean> {
  const { data } = await supabase.from("human_vitrine_sites").select("city").eq("est_client", true).limit(500);
  return ((Array.isArray(data) ? data : []) as { city?: string }[]).some((x) => villeSlug(String(x.city ?? "").replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim()) === ville);
}

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  const [etat, demo] = await Promise.all([etatMaFigurine(supabase, moi), etatDemo(supabase)]);
  return NextResponse.json({ ok: true, etat, demo }, { headers: sansCache });
}

export async function POST(request: Request) {
  const debut = Date.now();
  const avant = debut + (maxDuration - 20) * 1000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  if (p?.action === "signaler") {
    const ok = await signalerMessage(supabase, String(p.id ?? ""));
    return NextResponse.json(ok ? { ok: true } : { error: "Ce message n’existe plus." }, { status: ok ? 200 : 404 });
  }
  if (p?.action === "demo") {
    if (p.quoi === "expressions") {
      const r = await fabriquerExpressionsDemo(supabase, new URL(request.url).origin, avant);
      return NextResponse.json({ ok: !r.error, ...(r.error ? { error: r.error } : {}), ...(r.enCours ? { enCours: true } : {}), demo: await etatDemo(supabase) }, { headers: sansCache });
    }
    // (qui fait parler la démonstration, pour compter : son habitant, sinon une empreinte de sa connexion)
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || (request.headers.get("x-real-ip") ?? "");
    const visiteur = visiteurDe((await habitantCourant(supabase))?.id ?? null, ip, request.headers.get("user-agent") ?? "");
    if (p.quoi === "voix") {
      const r = await voixDemo(supabase, visiteur, p.texte, p.voix);
      if (!r.mp3) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
      return NextResponse.json({ ok: true, son: enSon(r.mp3) }, { headers: sansCache });
    }
    if (p.quoi === "message") {
      const r = await envoyerMessageDemo(supabase, visiteur, { texte: p.texte, voix: p.voix, sentiment: p.sentiment, prenom: p.prenom });
      if (!r.id) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
      return NextResponse.json({ ok: true, id: r.id, lien: lienMessage(r.id) }, { headers: sansCache });
    }
    return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
  }
  if (p?.action === "photo") {
    // DÈS LE DÉPART : sans compte, sa photo lui en ouvre un — dans une ville où ClikMe a des commerces
    let moi = await habitantCourant(supabase);
    if (!moi) {
      if (p.accord !== true) return NextResponse.json({ error: "Coche « C’est bien moi sur la photo »." }, { status: 400 });
      const ville = villeSlug(String(p.ville ?? ""));
      if (!ville || !(await villeOuverte(supabase, ville))) return NextResponse.json({ error: "Choisis ta ville." }, { status: 400 });
      moi = await assurerHabitant(supabase, ville);
      if (!moi) return NextResponse.json({ error: "Ton compte n’a pas pu s’ouvrir. Réessaie dans un instant." }, { status: 502 });
    }
    const r = await envoyerPhoto(supabase, moi, p.photo, p.accord, p.prenom);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Envoie d’abord ta photo pour créer ta figurine." }, { status: 403 });
  if (p?.action === "fabriquer") {
    const r = await fabriquerMaFigurine(supabase, moi, avant);
    const etat = await etatMaFigurine(supabase, moi);
    if (r.error) return NextResponse.json({ error: r.error, etat }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.enCours ? { enCours: true } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    const r = await refaireMaFigurine(supabase, moi, p.autrePhoto === true);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  if (p?.action === "expressions") {
    const r = await fabriquerSesExpressions(supabase, moi, avant);
    return NextResponse.json({ ok: !r.error, ...(r.error ? { error: r.error } : {}), ...(r.enCours ? { enCours: true } : {}), etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  if (p?.action === "voix") {
    const r = await lireSonTexte(supabase, moi, p.texte, p.voix);
    if (!r.mp3) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, son: enSon(r.mp3) }, { headers: sansCache });
  }
  if (p?.action === "message") {
    const r = await enregistrerMessage(supabase, moi, p.son, p.duree, p.commerces, p.sentiment, p.texte, p.voix);
    if (!r.id) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: r.id, lien: lienMessage(r.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
