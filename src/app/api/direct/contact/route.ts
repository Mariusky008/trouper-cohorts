// LAISSER SON PRÉNOM ET SON NUMÉRO — après s'être engagé, jamais avant.
//
// L'écran de confirmation promettait « vous serez prévenu dès que le groupe est
// complet », et personne ne demandait jamais comment prévenir. Le commerçant
// n'avait aucun moyen de joindre qui que ce soit : la promesse ne pouvait pas
// être tenue.
//
// APRÈS, ET FACULTATIF. Demander un numéro AVANT le geste tuerait le geste —
// c'est la règle de l'identité progressive : on ne demande rien pour lire, rien
// pour s'engager, et on propose seulement une fois que la personne a une raison
// de dire oui. Un refus laisse l'engagement intact.
//
// UN SEUL ENDROIT POUR CETTE DONNÉE : la ligne de l'habitant. Recopier le
// numéro sur chaque participation en ferait autant de copies à corriger le jour
// où il change.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/**
 * Le numéro, en E.164 français, ou une chaîne vide.
 *
 * On NORMALISE plutôt que de refuser : « 06 12 34 56 78 », « 0612345678 » et
 * « +33 6 12 34 56 78 » sont le même numéro, et renvoyer « format invalide » à
 * quelqu'un qui vient de taper le sien correctement est le meilleur moyen qu'il
 * n'en laisse aucun.
 */
export function telephoneNormalise(brut: unknown): string {
  const t = s(brut).replace(/[\s.\-()]/g, "");
  if (!t) return "";
  if (/^0[1-9]\d{8}$/.test(t)) return `+33${t.slice(1)}`;
  if (/^\+33[1-9]\d{8}$/.test(t)) return t;
  if (/^0033[1-9]\d{8}$/.test(t)) return `+33${t.slice(4)}`;
  // Un numéro étranger est gardé tel quel s'il ressemble à un numéro : on ne
  // sait pas le mettre en forme, ce n'est pas une raison pour le jeter.
  if (/^\+\d{8,15}$/.test(t)) return t;
  return "";
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const supabase = createAdminClient();
  // `habitantCourant` et non `assurerHabitant` : on ne crée personne ici. Cette
  // route ne s'appelle qu'après un engagement, donc la ligne existe déjà.
  const habitant = await habitantCourant(supabase);
  if (!habitant) return NextResponse.json({ error: "Aucun engagement en cours." }, { status: 403 });

  const prenom = s(p?.prenom).slice(0, 60);
  const telephone = telephoneNormalise(p?.telephone);
  if (!prenom && !telephone) {
    return NextResponse.json({ error: "Indiquez au moins un prénom ou un numéro." }, { status: 400 });
  }
  // Un numéro tapé mais illisible : on le dit, plutôt que d'enregistrer un vide
  // en laissant croire que c'est passé.
  if (s(p?.telephone) && !telephone) {
    return NextResponse.json({ error: "Ce numéro ne semble pas complet." }, { status: 400 });
  }

  try {
    // On n'écrase JAMAIS avec du vide : laisser un prénom seul ne doit pas
    // effacer le numéro donné la semaine dernière.
    const maj: Record<string, string> = {};
    if (prenom) maj.prenom = prenom;
    if (telephone) maj.telephone = telephone;
    const { error } = await supabase.from("human_habitants").update(maj).eq("id", habitant.id);
    if (error) throw new Error(error.message);
  } catch (e) {
    const msg = String(e);
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ error: "Ce n'est pas encore activé." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, prenom, telephone });
}
