// OÙ EST-CE QU'ILS S'ARRÊTENT — la seule question que cette route sert.
//
// Elle reçoit les étapes du parcours sur `/autour-de-moi`. Voir la migration
// `20260823120000_apercu_parcours.sql` pour la raison d'être et pour la liste
// de ce qu'on refuse de stocker.
//
// TROIS DÉFENSES, PARCE QUE LA ROUTE EST PUBLIQUE ET SANS COMPTE :
//   1. le vocabulaire des événements est FERMÉ ici — un client qui invente un
//      nom se fait jeter, donc la table ne peut pas se remplir de texte libre ;
//   2. `contexte` est plafonné et nettoyé, `valeur` bornée ;
//   3. rien de ce que la personne écrit ne traverse : la demande tapée dans le
//      champ ne quitte jamais son téléphone, on compte seulement qu'elle est
//      partie.
//
// L'ÉCHEC EST SILENCIEUX, ET C'EST VOULU. Une mesure qui casse la page qu'elle
// mesure est pire que pas de mesure : `sendBeacon` ne lit pas la réponse, et on
// répond 204 quoi qu'il arrive côté base.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Le vocabulaire fermé. Ajouter un événement se fait ICI, jamais côté client. */
const EVENEMENTS = new Set([
  "ouverture",
  "carte-vue",
  "balayage",
  "garde",
  "pli-ouvert",
  "champ-touche",
  "demande-envoyee",
  "invitation-recue",
  "jy-vais",
  "metier-change",
  "embauches-vues",
  "je-passe",
  "reserve",
  "note-donnee",
  "rappel-demande",
  "photo-ajoutee",
  "video-vue",
  "partage",
  "onglet",
  "notif-proposee",
  "notif-acceptee",
  "notif-refusee",
  "fin",
]);

const LARGEURS = new Set(["petit", "moyen", "grand"]);

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const session = String(p?.session ?? "").slice(0, 40);
  const lot = Array.isArray(p?.lot) ? (p.lot as Record<string, unknown>[]) : [];
  const largeurBrute = String(p?.largeur ?? "");
  const largeur = LARGEURS.has(largeurBrute) ? largeurBrute : null;
  // Un jeton de session doit ressembler à un jeton : sans ça, n'importe quoi
  // pourrait servir de clé de regroupement.
  if (!/^[a-z0-9]{8,40}$/.test(session) || !lot.length) {
    return new NextResponse(null, { status: 204 });
  }

  // LE LOT EST PLAFONNÉ. Le client envoie par paquets ; sans borne, un seul
  // appel pourrait poser dix mille lignes.
  const lignes = lot
    .slice(0, 60)
    .map((e) => {
      const evenement = String(e?.evenement ?? "");
      if (!EVENEMENTS.has(evenement)) return null;
      const brut = Number(e?.valeur);
      const valeur = Number.isFinite(brut) ? Math.max(0, Math.min(9999, Math.trunc(brut))) : null;
      const contexte = String(e?.contexte ?? "")
        .replace(/[^a-zA-Z0-9 àâçéèêëîïôûùüÿñæœ_-]/g, "")
        .slice(0, 40);
      return { session, evenement, valeur, contexte: contexte || null, largeur };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (!lignes.length) return new NextResponse(null, { status: 204 });

  try {
    const supabase = createAdminClient();
    await supabase.from("apercu_parcours").insert(lignes);
  } catch {
    /* La mesure ne casse jamais la page qu'elle mesure. */
  }
  return new NextResponse(null, { status: 204 });
}
