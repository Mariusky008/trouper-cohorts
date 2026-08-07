// Réglages d'une ville, depuis l'espace d'administration.
//
// La garde admin est vérifiée ICI et pas seulement dans le layout : le layout
// protège l'affichage, une route POST se joint directement. Sans cette
// vérification, n'importe qui pourrait changer le seuil d'une ville ou sa
// signature municipale en connaissant simplement l'URL.
//
// Le jeton d'espace ville n'est PAS modifiable par cette route. Le régénérer
// invaliderait un lien qu'un service municipal a peut-être en favori, et cela
// doit rester un geste délibéré, pas un effet de bord d'un formulaire de
// réglages.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = villeSlug(String(p?.villeSlug || ""));
  if (!slug) return NextResponse.json({ error: "villeSlug requis" }, { status: 400 });

  const patch: Record<string, unknown> = {};

  // Bornes larges mais réelles : un seuil à 0 afficherait le compteur en
  // permanence (« 0 chose se passe »), un seuil à 10 000 le masquerait pour
  // toujours. Les deux se règlent par accident dans un champ numérique.
  const seuil = typeof p?.seuilCompteur === "number" ? Math.round(p.seuilCompteur) : NaN;
  if (Number.isFinite(seuil) && seuil >= 1 && seuil <= 200) patch.seuil_compteur = seuil;

  if (Array.isArray(p?.quartiers)) {
    patch.quartiers = p.quartiers
      .map((q) => String(q).trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 30);
  }

  if (typeof p?.auteurNom === "string") patch.auteur_nom = p.auteurNom.trim().slice(0, 120);

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("human_villes_config").update(patch).eq("ville_slug", slug);
    if (error) throw new Error(error.message);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
