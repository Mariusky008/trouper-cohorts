// 🃏 SA CARTE DE PERSONNAGE (`lib/direct/personnage.ts`).
//
// GET : sa carte (`null` : pas encore faite), ce que ses achats lui ont rapporté (`progres` : la carte se construit en
//   direct pendant le questionnaire), et s'il a un compte (sans compte : « Crée ta figurine » d'abord).
// POST { action: "creer", reponses, gouts?, phrase? } : le questionnaire → la fiche (l'IA, ou composée ici) → { carte }.
// POST { action: "partager" } → { lien } ; { action: "arreter" } : le lien ne marche plus.
// Jamais d'habitant créé ici.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { famillesDe } from "@/lib/direct/famille-serveur";
import { carteDe, creerCarte, partagerCarte, progresDe } from "@/lib/direct/personnage-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ ok: true, compte: false, carte: null }, { headers: sansCache });
  const [carte, familles] = await Promise.all([carteDe(supabase, moi), famillesDe(supabase, moi.id).catch(() => [])]);
  return NextResponse.json({ ok: true, compte: true, carte, progres: progresDe(familles) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine : ta carte vient avec." }, { status: 403 });
  if (p?.action === "creer") {
    const r = await creerCarte(supabase, moi, { reponses: p.reponses, gouts: p.gouts, phrase: p.phrase });
    if (!r.carte) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, carte: r.carte }, { headers: sansCache });
  }
  if (p?.action === "partager" || p?.action === "arreter") {
    const r = await partagerCarte(supabase, moi, p.action === "arreter");
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, ...(r.lien ? { lien: r.lien } : {}) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
