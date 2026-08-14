// RÉAGIR À UNE ANNONCE.
//
// Comme « garder », rien n'est demandé avant : on pose un jeton d'appareil et on
// enregistre. Un formulaire ici ferait perdre le geste, et c'est le geste qui a
// de la valeur.
//
// LA BASCULE EST IDEMPOTENTE. Réappuyer retire, et c'est tout : la contrainte
// `UNIQUE NULLS NOT DISTINCT` du schéma garantit qu'une même personne ne peut
// pas compter deux fois pour la même réaction, même si deux doigts appuient en
// même temps sur deux appareils.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { estReaction } from "@/lib/direct/reactions";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const publicationId = s(p?.publicationId);
  const type = s(p?.type);
  const actif = p?.actif !== false;
  const ville = villeSlug(s(p?.ville));
  if (!publicationId) return NextResponse.json({ error: "publicationId requis" }, { status: 400 });
  if (!estReaction(type)) return NextResponse.json({ error: "réaction inconnue" }, { status: 400 });

  const supabase = createAdminClient();
  const habitant = await assurerHabitant(supabase, ville);
  if (!habitant) return NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });

  // Le commerce derrière l'annonce : la table le porte pour que le commerçant
  // puisse lire ses chiffres sans repasser par les publications.
  const { data: pub } = await supabase
    .from("human_publications")
    .select("site_id")
    .eq("id", publicationId)
    .maybeSingle();
  const siteId = s((pub as Record<string, unknown> | null)?.site_id);
  if (!siteId) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });

  try {
    if (actif) {
      const { error } = await supabase.from("clik_reaction").upsert(
        { site_id: siteId, publication_id: publicationId, habitant_id: habitant.id, type },
        { onConflict: "habitant_id,site_id,publication_id,type" }
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("clik_reaction")
        .delete()
        .eq("habitant_id", habitant.id)
        .eq("publication_id", publicationId)
        .eq("type", type);
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    const msg = String(e);
    // Migration non appliquée : on le dit, plutôt que de laisser le geste
    // disparaître en silence.
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ error: "Les réactions ne sont pas encore activées." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, actif });
}
