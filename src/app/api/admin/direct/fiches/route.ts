// 🗂️ LES FICHES D'UN HABITANT, CÔTÉ ADMIN — chantier « Univers », lot 1, le socle (`lib/direct/fiches-serveur.ts`).
// Réservé à l'administrateur : pour comprendre une figurine (ses traits, ses consignes, ses versions) et, s'il le faut,
// revenir à une version d'avant.
//
// GET ?h=<habitant>                              → { perso: { fiche, origine, refaisables, attendues, images },
//                                                    monde: { fiche, images } } : tout, chemins et consignes compris ;
//                                                    `refaisables` : la consigne de chaque image se redonne mot pour
//                                                    mot à partir de la fiche
// POST { action: "revenir", h, genre, version } → { fiche } : une nouvelle version, recopiée de celle-là
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { consigneAttendue, lireFicheMonde, lireFichePerso, referencesSignees, refaisables, revenirAVersion } from "@/lib/direct/fiches-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const habitantValide = (x: unknown) => (typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x) ? x.toLowerCase() : "");

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const h = habitantValide(new URL(request.url).searchParams.get("h"));
  if (!h) return NextResponse.json({ error: "Quel habitant ?" }, { status: 400 });
  const supabase = createAdminClient();
  const [{ fiche, origine }, monde] = await Promise.all([lireFichePerso(supabase, h), lireFicheMonde(supabase, h)]);
  return NextResponse.json(
    {
      ok: true,
      perso: fiche
        ? {
            fiche,
            origine,
            refaisables: refaisables(fiche),
            attendues: Object.fromEntries(Object.keys(fiche.references).map((nom) => [nom, consigneAttendue(fiche, nom)])),
            images: await referencesSignees(supabase, fiche.references),
          }
        : null,
      monde: monde ? { fiche: monde, images: await referencesSignees(supabase, monde.references) } : null,
    },
    { headers: sansCache },
  );
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const h = habitantValide(p?.h);
  if (p?.action !== "revenir" || !h || (p.genre !== "perso" && p.genre !== "monde")) return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
  const r = await revenirAVersion(createAdminClient(), h, p.genre, p.version);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, fiche: r.fiche }, { headers: sansCache });
}
