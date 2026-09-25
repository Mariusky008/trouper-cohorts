// Actions sur un prospect "Site internet" (canal lettre) depuis la liste admin.
// - validate  : letter_status = 'validated'   (LA LETTRE, pas le client)
// - client_on / client_off : est_client — CE QUI RETIRE LA DÉMONSTRATION
// - printed   : letter_status = 'printed'  + letter_printed_at = now
// - delivered : letter_status = 'delivered' + letter_delivered_at = now
// - skip      : letter_status = 'skipped'
// - reset     : retour 'draft'
// - delete    : suppression de la fiche
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = String(formData.get("id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const redirectTo = String(formData.get("redirect") || "/admin/humain/site-internet");

  if (!id || !action) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (action === "delete") {
    await supabase.from("human_vitrine_sites").delete().eq("id", id).eq("channel", "letter");
    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  }

  // Démo « choc » de démarchage : une seule cible active à la fois. On stocke le
  // drapeau dans metadata.demarchage_target (aucune migration nécessaire).
  if (action === "demo_target" || action === "demo_target_off") {
    // 1) On retire le drapeau partout où il est posé.
    const { data: flagged } = await supabase
      .from("human_vitrine_sites")
      .select("id, metadata")
      .eq("metadata->>demarchage_target", "true");
    for (const r of (flagged as Array<{ id: string; metadata: Record<string, unknown> | null }> | null) ?? []) {
      const m = { ...(r.metadata || {}) };
      delete m.demarchage_target;
      await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", r.id);
    }
    // 2) On (re)pose le drapeau sur la cible demandée (sauf pour un simple retrait).
    if (action === "demo_target") {
      const { data: cur } = await supabase
        .from("human_vitrine_sites")
        .select("metadata")
        .eq("id", id)
        .maybeSingle();
      const m = { ...(((cur as { metadata: Record<string, unknown> | null } | null)?.metadata) || {}), demarchage_target: true };
      await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", id);
    }
    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  }

  /**
   * ═══ DEVENIR CLIENT N'EST PAS UNE ÉTAPE DE LA LETTRE ═════════════════════
   *
   * « J'ai revalidé la page du commerçant sur l'admin, mais j'ai toujours la
   * démo du début avec la voix de l'IA et la bannière de confirmation. »
   *
   * IL AVAIT APPUYÉ SUR « VALIDER », QUI VALIDE LA LETTRE. La bascule qui
   * retire la démonstration s'appelait « 🚀 Mise en ligne » et vivait sur une
   * AUTRE page — le détail de la lettre. Deux actions sans rapport portaient le
   * même mot, et la colonne d'état affichait « ✅ Validée » juste à côté : tout
   * lui confirmait qu'il avait fait ce qu'il fallait.
   *
   * ON ÉCRIT LE MÊME AXE QUE `publish`, ET RIEN D'AUTRE. Surtout pas
   * `letter_status` : « client » n'est pas une valeur autorisée par la
   * contrainte, l'UPDATE échouerait EN ENTIER, et les compteurs de l'entonnoir
   * — imprimées + remises + contacts — verraient la prospection se vider à
   * mesure qu'elle réussit. Le fichier `publish/route.ts` porte le
   * raisonnement complet ; celui-ci n'en est qu'un raccourci depuis la liste.
   */
  if (action === "client_on" || action === "client_off") {
    const devient = action === "client_on";
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({ est_client: devient, est_client_depuis: devient ? now : null })
      .eq("id", id)
      .eq("channel", "letter");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    /* ON RELIT, COMME `publish`. Une écriture sans erreur n'est pas une
       écriture qui a pris : un déclencheur ou une politique peut l'annuler sans
       rien remonter ici, et le symptôme est alors invisible — l'admin annonce
       « client », la page reste en démonstration. */
    const { data: apres } = await supabase
      .from("human_vitrine_sites")
      .select("est_client")
      .eq("id", id)
      .maybeSingle();
    const reel = Boolean((apres as Record<string, unknown> | null)?.est_client);
    if (reel !== devient) {
      return NextResponse.json(
        {
          error:
            "La base n'a pas retenu le changement. La ligne existe et l'écriture n'a pas signalé d'erreur : " +
            "cherchez du côté d'un déclencheur ou d'une politique sur human_vitrine_sites.",
        },
        { status: 500 },
      );
    }
    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  }

  const patches: Record<string, Record<string, unknown>> = {
    validate: { letter_status: "validated" },
    printed: { letter_status: "printed", letter_printed_at: now },
    delivered: { letter_status: "delivered", letter_delivered_at: now },
    skip: { letter_status: "skipped" },
    reset: { letter_status: "draft" },
  };

  const patch = patches[action];
  if (!patch) return NextResponse.json({ error: "action inconnue" }, { status: 400 });

  await supabase.from("human_vitrine_sites").update(patch).eq("id", id).eq("channel", "letter");

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
