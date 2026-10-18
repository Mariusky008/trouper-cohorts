// 👻 DONNER SON AVIS À LA FIN D'UN FILM (l'interview d'un commerçant).
//
// Comme les réactions, rien n'est demandé avant : un jeton d'appareil, et on
// enregistre. Un formulaire ferait perdre le geste.
//
// UN AVIS PAR PERSONNE ET PAR FILM. Rappuyer sur un autre fantôme change
// l'avis ; `sens: null` le retire. Le film doit être celui du commerce
// (son annonce en cours, ou une de ses publications) : sans ce contrôle, on
// pourrait noter n'importe quelle adresse au nom de n'importe qui.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { estSensAvis, filmDuCommerce } from "@/lib/direct/avis-film";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const film = s(p?.film).slice(0, 500);
  const retirer = p?.sens === null;
  const sens = Number(p?.sens);
  if (!slug || !film) return NextResponse.json({ error: "slug et film requis" }, { status: 400 });
  if (!retirer && !estSensAvis(sens)) return NextResponse.json({ error: "avis inconnu" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: site } = await supabase.from("human_vitrine_sites").select("id, city").eq("slug", slug).maybeSingle();
  const siteId = s((site as Record<string, unknown> | null)?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  if (!(await filmDuCommerce(supabase, siteId, film))) return NextResponse.json({ error: "Ce film n'est pas celui de ce commerce." }, { status: 404 });

  const ville = villeSlug(s(p?.ville) || s((site as Record<string, unknown> | null)?.city));
  const habitant = await assurerHabitant(supabase, ville);
  if (!habitant) return NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });

  try {
    if (retirer) {
      const { error } = await supabase
        .from("clik_avis_film")
        .delete()
        .eq("habitant_id", habitant.id)
        .eq("site_id", siteId)
        .eq("film", film);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("clik_avis_film")
        .upsert(
          { site_id: siteId, habitant_id: habitant.id, film, sens, updated_at: new Date().toISOString() },
          { onConflict: "habitant_id,site_id,film" }
        );
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    const msg = String(e);
    // Migration non appliquée : on le dit, plutôt que de laisser le geste disparaître en silence.
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ error: "Les avis ne sont pas encore activés." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
