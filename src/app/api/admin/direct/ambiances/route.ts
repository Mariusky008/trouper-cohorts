// 🎨 LES AMBIANCES DE SON UNIVERS — L'ESSAI (`lib/direct/ambiances.ts`, `lib/direct/ambiances-serveur.ts`) : son monde
// réinterprété en cosy, urbaine (New York), néon et gaming, pastel ; celle que Pablito propose, et pourquoi. Réservé à
// l'administrateur, sur SON univers (le cookie d'habitant de ce téléphone).
//
// GET                                         → { etat } : ce que Pablito propose, les images faites (signées), ce qui
//                                               reste à faire, sa figurine assise
// POST { action: "fabriquer", ambiance? }     → { fait?, etat } : une ambiance (sans `ambiance` : la prochaine qui manque)
// POST { action: "refaire", ambiance }        → { etat } : elle s'efface
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { ambianceValide } from "@/lib/direct/ambiances";
import { etatDesAmbiances, fabriquerUneAmbiance, refaireUneAmbiance } from "@/lib/direct/ambiances-serveur";

export const dynamic = "force-dynamic";
// (une image du moteur)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const SANS_FIGURINE = { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatDesAmbiances(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + (maxDuration - 20) * 1000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  const ambiance = p?.ambiance == null ? null : ambianceValide(p.ambiance);
  if (p?.ambiance != null && !ambiance) return NextResponse.json({ error: "Quelle ambiance ?" }, { status: 400, headers: sansCache });
  if (p?.action === "fabriquer") {
    const r = await fabriquerUneAmbiance(supabase, moi.id, ambiance, avant);
    const etat = await etatDesAmbiances(supabase, moi.id);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    const r = await refaireUneAmbiance(supabase, moi.id, ambiance);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400, headers: sansCache });
    return NextResponse.json({ ok: true, etat: await etatDesAmbiances(supabase, moi.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
