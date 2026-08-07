// Suivre un commerce, et compter les visites.
//
// C'est le seul geste social du Direct : ni commentaire, ni note publique, ni
// abonné visible. Suivre veut dire « préviens-moi quand il publie », rien de
// plus — et c'est ce qui le rend acceptable pour un commerçant qui n'a pas
// demandé à être noté.
//
// `visites` alimente le niveau de relation en cœurs. Il n'est incrémenté que sur
// une ouverture RÉELLE de fiche depuis Le Direct : les cœurs doivent rester
// adossés à quelque chose qui a eu lieu, sinon la relation affichée est une
// fiction et l'avantage habitué promis sur du vide.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const siteId = str(p?.siteId);
  const action = str(p?.action) || "suivre"; // suivre | ne-plus-suivre | visite
  if (!siteId) return NextResponse.json({ error: "siteId requis" }, { status: 400 });

  const supabase = createAdminClient();

  // Une VISITE ne crée pas d'habitant. Ouvrir une fiche n'est pas un engagement,
  // et poser une ligne en base pour une simple lecture contredirait la règle
  // « consulter ne demande rien ».
  const habitant =
    action === "visite"
      ? await habitantCourant(supabase)
      : await assurerHabitant(supabase, villeSlug(str(p?.ville)));
  if (!habitant) {
    return action === "visite"
      ? NextResponse.json({ ok: true, ignore: true })
      : NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });
  }

  try {
    if (action === "ne-plus-suivre") {
      const { error } = await supabase
        .from("human_suivis")
        .delete()
        .eq("habitant_id", habitant.id)
        .eq("site_id", siteId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, suivi: false });
    }

    if (action === "visite") {
      // On ne compte que pour un commerce DÉJÀ suivi : une visite ne fait pas
      // naître un suivi, sinon « je suis ces commerces » deviendrait « ces
      // commerces que j'ai regardés une fois », et la liste perdrait son sens.
      const { data } = await supabase
        .from("human_suivis")
        .select("visites")
        .eq("habitant_id", habitant.id)
        .eq("site_id", siteId)
        .maybeSingle();
      const row = data as Record<string, unknown> | null;
      if (!row) return NextResponse.json({ ok: true, ignore: true });
      const n = (typeof row.visites === "number" ? row.visites : 0) + 1;
      await supabase
        .from("human_suivis")
        .update({ visites: n, derniere_visite_at: new Date().toISOString() })
        .eq("habitant_id", habitant.id)
        .eq("site_id", siteId);
      return NextResponse.json({ ok: true, visites: n });
    }

    const { error } = await supabase
      .from("human_suivis")
      .upsert({ habitant_id: habitant.id, site_id: siteId }, { onConflict: "habitant_id,site_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, suivi: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
