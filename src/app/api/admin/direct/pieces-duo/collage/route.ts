// 🧩 L'EFFET « COLLAGE » — le premier essai de la maquette de la pièce du duo (`lib/direct/pieces-duo-collage-serveur.ts`,
// `docs/univers/piece-du-duo.md`, section 5) : deux vraies figurines dans une vraie pièce, posées par l'écran ou
// générées avec la pièce. Réservé à l'administrateur.
//
// GET                                         → { etat } : les figurines, le choix, la pièce et ses places, ce qui est fait
// POST { action: "choisir", piece, a, b, moment? } → { etat } (la lumière : celle de la pièce par défaut)
// POST { action: "fabriquer" }                → { fait?, etat } : un passage — la pose de la première, de la seconde, le duo
// POST { action: "refaire", quoi }            → { etat } : les poses (et le duo), ou le duo seul (`quoi: "duo"`)
// POST { action: "avis", avis, note? }        → { etat }
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { avisSurCollage, choisirCollage, etatCollage, fabriquerCollage, refaireCollage } from "@/lib/direct/pieces-duo-collage-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = (await habitantCourant(supabase))?.id ?? null;
  return NextResponse.json({ ok: true, etat: await etatCollage(supabase, moi) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = (await habitantCourant(supabase))?.id ?? null;
  const repondre = async (r: { fait?: string; erreur?: string }, statut = 400) => {
    const etat = await etatCollage(supabase, moi);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: statut, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  };
  if (p?.action === "choisir") return repondre(await choisirCollage(supabase, moi, p.piece, p.a, p.b, p.moment));
  if (p?.action === "fabriquer") return repondre(await fabriquerCollage(supabase, moi, avant), 502);
  if (p?.action === "refaire") {
    await refaireCollage(supabase, moi, p.quoi === "duo" ? "duo" : "poses");
    return repondre({});
  }
  if (p?.action === "avis") return repondre(await avisSurCollage(supabase, p.avis, p.note));
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
