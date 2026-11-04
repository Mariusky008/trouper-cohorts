// 🗣️ SA PROPRE FIGURINE (`lib/direct/ma-figurine.ts`).
//
// GET : où il en est (le compteur jusqu'à 10, sa photo, sa figurine, ses expressions, ses messages), et la
//   démonstration (la figurine de Léa : ses expressions déjà faites, et si un texte peut être lu). Sans cookie : 0 / 10.
// POST { action: "photo", photo: data:image…, accord: true } : sa photo, pour que ClikMe fasse sa figurine.
// POST { action: "expressions" } : un tour de fabrication de ses expressions (le moteur d'image) → l'état.
// POST { action: "voix", texte, voix } : son texte lu par la voix choisie (ElevenLabs) → { son: data:audio/mpeg… }.
// POST { action: "message", son: data:audio…, duree, commerces: [liens], sentiment?, texte?, voix? } : un message de
//   sa figurine → { id, lien }.
// POST { action: "signaler", id } : celui qui a reçu un message le signale (pas besoin d'être quelqu'un).
// POST { action: "demo", quoi: "expressions" } : un tour pour la démonstration (une seule fois en tout, puis gardé).
// POST { action: "demo", quoi: "voix", phrase, voix } : une phrase de la démonstration, dans cette voix (gardée).
// Jamais d'habitant créé ici.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { lienMessage } from "@/lib/direct/ma-figurine";
import {
  enregistrerMessage,
  envoyerPhoto,
  etatDemo,
  etatMaFigurine,
  fabriquerExpressionsDemo,
  fabriquerSesExpressions,
  lireSonTexte,
  signalerMessage,
  voixDemo,
} from "@/lib/direct/ma-figurine-serveur";

export const dynamic = "force-dynamic";
// (un tour d'expressions : quatre images du moteur, en même temps)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const enSon = (mp3: Buffer) => `data:audio/mpeg;base64,${mp3.toString("base64")}`;

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
    if (p.quoi === "voix") {
      const r = await voixDemo(supabase, p.phrase, p.voix);
      if (!r.mp3) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
      return NextResponse.json({ ok: true, son: enSon(r.mp3) }, { headers: { "cache-control": "public, max-age=3600" } });
    }
    return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
  }
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Ouvre d’abord ta collection depuis ton téléphone." }, { status: 403 });
  if (p?.action === "photo") {
    const r = await envoyerPhoto(supabase, moi, p.photo, p.accord);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
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
