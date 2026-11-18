/**
 * 📎 LES PDF DANS LA CONVERSATION (le salon du duo, lot S6 ; `docs/univers/salon-du-duo.md` 4.8) — décidé par le
 * propriétaire le 18 novembre 2026 : « seulement des PDF, sans contrôle, entre deux proches qui se sont ajoutés, ouverts
 * en téléchargement ».
 *
 * Un PDF part comme une photo : déposé tout droit du téléphone au seau privé, puis le serveur le relit — il vérifie que
 * c'est bien un PDF (ses premiers octets, `%PDF-`), pas trop lourd —, le range (`fils/<paire>/f/<id>.pdf`) et le pose dans
 * leur fil (`genre: "fichier"`). Il n'est PAS contrôlé par la modération (un document ne se lit pas comme une photo) :
 * c'est pourquoi il ne circule qu'entre deux proches qui se sont ajoutés tous les deux, et ne s'ouvre jamais dans
 * ClikMe : son adresse signée le télécharge (`Content-Disposition: attachment`), sous son nom.
 *
 * Ici, LES RÈGLES, sans serveur : les limites, le nom du fichier, sa taille dite, la notification, la ligne de « Chez
 * moi », les phrases de l'écran.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */

export const FICHIER = {
  /** Un PDF, au plus (octets). */
  max: 10 * 1024 * 1024,
  /** Les PDF par personne et par jour. */
  parJour: 20,
  /** Le nom du fichier, en signes, au plus (sans « .pdf »). */
  nom: 80,
  /** Le type, le seul. */
  type: "application/pdf",
} as const;

/**
 * Le nom sous lequel il part, et se télécharge : sans dossier, sans caractère invisible ni réservé, « .pdf » au bout ;
 * « Document.pdf » s'il ne reste rien.
 */
export function nomDuFichier(x: unknown): string {
  const brut = typeof x === "string" ? x : "";
  const base = brut.split(/[\\/]/).pop() ?? "";
  const sansExt = base.replace(/\.pdf$/i, "");
  const propre = [...sansExt.replace(/[\u0000-\u001F\u007F-\u009F​‎‏‪-‮⁦-⁩﻿"*:<>?|]/g, " ").replace(/\s+/g, " ").trim().replace(/^\.+/, "")]
    .slice(0, FICHIER.nom)
    .join("")
    .trim();
  return `${propre || "Document"}.pdf`;
}

/** « 820 Ko », « 1,4 Mo ». */
export function tailleDite(octets: number): string {
  const n = Math.max(0, Number(octets) || 0);
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/** Ce sont bien les premiers octets d'un PDF (`%PDF-`, parfois après quelques octets). */
export function estUnPdf(debut: Uint8Array): boolean {
  const t = Array.from(debut.slice(0, 1024), (c) => String.fromCharCode(c)).join("");
  return t.includes("%PDF-");
}

/** 🔔 La notification : « 📎 Léa t'a envoyé un PDF », et son nom. */
export function notifFichier(prenom: string, nom: string): { titre: string; corps: string } {
  const qui = prenom.trim() || "Un proche";
  return { titre: `📎 ${qui} t’a envoyé un PDF`, corps: nom };
}
/** La ligne de « Chez moi » (et la bulle) : « 📎 Le nom.pdf ». */
export const ligneFichier = (nom?: string) => `📎 ${(nom ?? "").trim() || "Un PDF"}`;

export const PHRASES_FICHIER = {
  pasUnPdf: "Seuls les PDF peuvent partir.",
  lourd: "Ce PDF est trop lourd : 10 Mo au plus.",
  absent: "Ton PDF n’est pas arrivé. Réessaie.",
  assez: "Assez de PDF pour aujourd’hui : reviens demain.",
  ferme: "Les PDF ne sont pas encore ouverts.",
  case: "un document, un billet, une recette",
  telecharger: "Télécharger",
} as const;
