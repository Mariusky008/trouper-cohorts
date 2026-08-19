// PARTAGER UNE CARTE DU JOUR.
//
// POURQUOI CETTE FONCTION-LÀ AVANT LES AUTRES. Presque tout ce qu'on peut
// construire autour des menus a besoin de VOLUME pour exister : un compteur de
// « j'aime » sous son seuil prouve que personne ne regarde, une statistique sur
// onze visites est du bruit, un classement des plats préférés demande une
// année. Le partage, non : il lui faut deux amis. « Ça te dit ça ce midi ? »
// envoyé à un collègue fonctionne le premier jour, avec un seul restaurant
// publié — et c'est le client qui devient le diffuseur du restaurant.
//
// CE QU'ON PARTAGE : un lien qui ouvre CE menu, pas la page d'accueil. Recevoir
// « regarde ce midi » et atterrir sur un fil où il faut chercher, c'est un lien
// qu'on n'ouvre pas deux fois.
import { prixCourt } from "./prix";

const str = (v: unknown) => (v == null ? "" : String(v));

/** L'adresse qui ouvre le défilé des cartes du jour SUR celle-ci. */
export function lienCarte(origine: string, ville: string, id: string): string {
  const base = origine.replace(/\/+$/, "");
  return `${base}/ville/${encodeURIComponent(ville)}/menus?carte=${encodeURIComponent(id)}`;
}

/**
 * Le message envoyé avec le lien.
 *
 * COURT, ET IL DIT LE PRIX. C'est ce qui décide entre deux collègues à midi, et
 * c'est ce qui fait qu'on ouvre le lien plutôt que de le laisser passer. On
 * n'écrit RIEN qu'on ne sache : pas de plat inventé, pas de « le meilleur de
 * Dax » — le texte de la carte est celui du restaurateur, et rien d'autre.
 */
export function texteCarte(commerce: unknown, ville: unknown, prix: number | null | undefined): string {
  const qui = str(commerce).trim();
  const ou = str(ville).trim();
  const combien = prixCourt(prix);
  return (
    `La carte du jour${qui ? ` de ${qui}` : ""}${ou ? ` à ${ou}` : ""}` +
    `${combien ? ` — ${combien}` : ""}, ce midi 🍽️`
  );
}

/** Ce que l'écran a besoin de savoir pour partager une carte. */
export type APartager = { titre: string; texte: string; lien: string };

/**
 * Partager pour de vrai, avec ce que le navigateur sait faire.
 *
 * TROIS NIVEAUX, dans cet ordre. Le partage natif ouvre WhatsApp, les Messages
 * et le reste — c'est le geste que les gens connaissent, et c'est celui qu'on
 * veut sur téléphone. À défaut, on copie le lien : sur un ordinateur, c'est
 * exactement ce que la personne allait faire à la main. À défaut encore, on le
 * dit, plutôt que de laisser un bouton qui ne fait rien.
 *
 * `AbortError` n'est PAS un échec : c'est quelqu'un qui a ouvert la feuille de
 * partage et l'a refermée. Le traiter comme une panne afficherait « impossible »
 * à quelqu'un qui a simplement changé d'avis.
 */
export async function partager(quoi: APartager): Promise<"partage" | "copie" | "echec"> {
  const nav = typeof navigator === "undefined" ? null : navigator;
  if (nav?.share) {
    try {
      await nav.share({ title: quoi.titre, text: quoi.texte, url: quoi.lien });
      return "partage";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "partage";
      /* le partage natif a refusé : on tombe sur la copie */
    }
  }
  try {
    await nav?.clipboard?.writeText(`${quoi.texte}\n${quoi.lien}`);
    return "copie";
  } catch {
    return "echec";
  }
}
