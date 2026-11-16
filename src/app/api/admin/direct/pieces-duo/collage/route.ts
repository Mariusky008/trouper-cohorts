// 🧩 L'EFFET « COLLAGE » — le premier essai de la maquette de la pièce du duo (`lib/direct/pieces-duo-collage-serveur.ts`,
// `docs/univers/piece-du-duo.md`, section 5) : deux vraies figurines dans une vraie pièce, posées par l'écran ou
// générées avec la pièce. Réservé à l'administrateur.
//
// GET                                         → { etat } : les figurines, le choix, la pièce et ses places, ce qui est fait
// GET ?calques=1                              → { calques } : 🎭 le salon du duo, lot S1 — les calques de l'image du duo
//                                                (découpés une fois), la plaque et les quatre calques à adresse stable ;
//                                                `null` tant que l'image du duo n'est pas faite
// POST { action: "choisir", piece, a, b, moment? } → { etat } (la lumière : celle de la pièce par défaut)
// POST { action: "fabriquer" }                → { fait?, etat } : un passage — la pose de la première, de la seconde, le duo
// POST { action: "refaire", quoi }            → { etat } : les poses (et le duo), ou le duo seul (`quoi: "duo"`)
// POST { action: "avis", avis, note? }        → { etat }
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { avisSurCollage, calquesDuCollage, choisirCollage, etatCollage, fabriquerCollage, refaireCollage } from "@/lib/direct/pieces-duo-collage-serveur";
import { imageSalon } from "@/lib/direct/salon-fichiers-serveur";
import type { CalqueFigurine, CalquesSalon } from "@/lib/direct/salon";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = (await habitantCourant(supabase))?.id ?? null;
  if (new URL(request.url).searchParams.get("calques")) return NextResponse.json({ ok: true, calques: await calquesPublies(supabase, moi) }, { headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatCollage(supabase, moi) }, { headers: sansCache });
}

/** 🎭 Les calques du duo choisi, publiés à adresse stable (`salon-fichiers-serveur.ts`). */
async function calquesPublies(supabase: ReturnType<typeof createAdminClient>, moi: string | null): Promise<CalquesSalon | null> {
  const c = await calquesDuCollage(supabase, moi).catch(() => null);
  if (!c) return null;
  const [plaque, ca, ta, cb, tb] = await Promise.all([c.plaque, c.a.corps.fichier, c.a.tete.fichier, c.b.corps.fichier, c.b.tete.fichier].map((ch) => imageSalon(supabase, ch)));
  if (!plaque || !ca || !ta || !cb || !tb) return null;
  const publier = (f: CalqueFigurine, corps: string, tete: string): CalqueFigurine => ({ ...f, corps: { ...f.corps, fichier: corps }, tete: { ...f.tete, fichier: tete } });
  return { plaque, a: publier(c.a, ca.src, ta.src), b: publier(c.b, cb.src, tb.src) };
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
