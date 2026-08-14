// REJOINDRE UN COLLECTIF, OU PRENDRE UN AVANTAGE.
//
// Comme « garder », rien n'est demandé avant : on pose un jeton d'appareil et on
// enregistre. Un formulaire ici ferait perdre le geste, et c'est le geste qui a
// de la valeur.
//
// TOUTE LA DÉCISION EST EN BASE. Cette route ne lit pas l'état de la campagne
// pour décider si l'on peut rejoindre — elle appelle la fonction, qui tranche
// dans une seule transaction. Décider ici serait rejouer le bug que le SQL
// évite : deux personnes qui appuient au même instant sur un groupe à 3/4
// liraient toutes les deux « 3 » et le groupe finirait à 5.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

/** Ce que l'habitant doit lire selon ce que la base a répondu. La traduction est
 *  ici et pas dans l'écran : les quatre issues viennent du SQL, et un écran qui
 *  inventerait sa propre phrase pour « complet » finirait par mentir. */
const PHRASE: Record<string, string> = {
  engage: "Vous en êtes.",
  liste_attente: "Le groupe est complet — vous êtes en liste d'attente. Si quelqu'un se désiste, la place est pour vous.",
  confirme: "Vous en êtes déjà.",
  complet: "Le groupe et sa liste d'attente sont pleins.",
  terminee: "Cette opération est terminée.",
  annule: "Vous n'en faites plus partie.",
};

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const campagneId = String(payload?.campagneId || "").trim();
  const action = String(payload?.action || "rejoindre");
  const ville = villeSlug(String(payload?.ville || ""));
  if (!campagneId) return NextResponse.json({ error: "campagneId requis" }, { status: 400 });
  if (action !== "rejoindre" && action !== "prendre") {
    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const habitant = await assurerHabitant(supabase, ville);
  if (!habitant) return NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });

  try {
    if (action === "prendre") {
      const { data, error } = await supabase.rpc("clik_prendre_avantage", {
        p_campagne: campagneId,
        p_habitant: habitant.id,
      });
      if (error) throw new Error(error.message);
      const l = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
      // Aucune ligne = stock épuisé. Ce n'est pas une erreur : quelqu'un a été
      // plus rapide, et il faut le dire comme ça, pas comme une panne.
      if (!l) return NextResponse.json({ ok: false, etat: "epuise", phrase: "Tout est parti — quelqu'un a été plus rapide." });
      return NextResponse.json({
        ok: true,
        etat: "obtenu",
        libelle: String(l.libelle ?? ""),
        conditionAchat: String(l.condition_achat ?? ""),
        restants: Number(l.restants ?? 0),
      });
    }

    const { data, error } = await supabase.rpc("clik_rejoindre", {
      p_campagne: campagneId,
      p_habitant: habitant.id,
    });
    if (error) throw new Error(error.message);
    const l = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    const etat = String(l?.statut ?? "terminee");
    return NextResponse.json({
      // `ok` dit si la personne EST DANS le dispositif, pas si l'appel a abouti :
      // une liste d'attente est un succès, un groupe plein n'en est pas un.
      ok: etat === "engage" || etat === "liste_attente" || etat === "confirme",
      etat,
      phrase: PHRASE[etat] ?? "",
      participants: Number(l?.participants ?? 0),
      objectif: l?.objectif == null ? null : Number(l.objectif),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
