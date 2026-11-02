// 🗣️ SA PROPRE FIGURINE (`lib/direct/ma-figurine.ts`).
//
// GET : où il en est (le compteur jusqu'à 10, sa photo, sa figurine, ses messages). Sans cookie : 0 / 10.
// POST { action: "photo", photo: data:image…, accord: true } : sa photo, pour que ClikMe fasse sa figurine.
// POST { action: "message", son: data:audio…, duree, commerces: [liens] } : un message de sa figurine → { id, lien }.
// POST { action: "signaler", id } : celui qui a reçu un message le signale (pas besoin d'être quelqu'un).
// Jamais d'habitant créé ici.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { lienMessage } from "@/lib/direct/ma-figurine";
import { enregistrerMessage, envoyerPhoto, etatMaFigurine, signalerMessage } from "@/lib/direct/ma-figurine-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  if (p?.action === "signaler") {
    const ok = await signalerMessage(supabase, String(p.id ?? ""));
    return NextResponse.json(ok ? { ok: true } : { error: "Ce message n’existe plus." }, { status: ok ? 200 : 404 });
  }
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Ouvre d’abord ta collection depuis ton téléphone." }, { status: 403 });
  if (p?.action === "photo") {
    const r = await envoyerPhoto(supabase, moi, p.photo, p.accord);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  if (p?.action === "message") {
    const r = await enregistrerMessage(supabase, moi, p.son, p.duree, p.commerces);
    if (!r.id) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: r.id, lien: lienMessage(r.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
