/**
 * 📷 ÉCRIRE, PARTAGER — lot M2 « les photos » (cahier des charges : `docs/univers/messages-ecrits.md`, section 5,
 * validé par le propriétaire le 14 novembre 2026).
 *
 * Une photo part dans la conversation, une à la fois, avec une légende si on veut. Réduite et sans ses métadonnées
 * (la position GPS d'abord) dans le téléphone, puis réencodée par le serveur (rien ne survit de l'original), et
 * CONTRÔLÉE avant d'être livrée : le service de modération d'OpenAI la lit ; refusée, elle ne part pas ; sans service
 * joignable, elle ne part pas non plus (on n'envoie jamais une photo qu'on n'a pas pu contrôler). Elle reste dans la
 * conversation : l'autre ne peut ni la mettre ailleurs ni la montrer depuis ClikMe.
 *
 * Ici, LES RÈGLES, sans serveur (le navigateur et `scripts/verifier-messages.mjs` les lisent aussi) : les limites, la
 * légende, la notification, la ligne de « Chez moi », ce que les figurines en lisent (la légende, jamais l'image), les
 * phrases de l'écran.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici, aucun import qui ne soit pas un type.
 */
import { ECRIT, signes } from "./ecrit";

export const PHOTO = {
  /** Ce qui arrive au serveur, au plus (la photo est réduite dans le téléphone avant). */
  max: 5 * 1024 * 1024,
  /** Les photos par personne et par jour. */
  parJour: 30,
  /** Le grand côté, en pixels, au plus (dans le téléphone, puis au serveur). */
  cote: 1600,
  /** La légende, en signes, au plus. */
  legende: 200,
  /** Le temps que la figurine la montre, dans la scène (en secondes). */
  montre: 4,
  /** Les pixels qu'on accepte de décoder, au plus (une image « bombe » est refusée avant). */
  pixels: 40_000_000,
} as const;

/** ✅ LA LÉGENDE, NETTOYÉE (comme un écrit : rien d'invisible, les emojis tels quels), sur une ligne ; "" sans légende ; `null` trop longue. */
export function legendePhoto(x: unknown): string | null {
  if (x == null) return "";
  if (typeof x !== "string") return null;
  const t = x
    .replace(/[\u0000-\u001F\u007F-\u009F​‎‏‪-‮⁦-⁩﻿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return signes(t) > PHOTO.legende ? null : t;
}

/** 🔔 La notification : « 📷 Léa t'a envoyé une photo », et sa légende (le début). */
export function notifPhoto(prenom: string, legende?: string): { titre: string; corps: string } {
  const qui = prenom.trim() || "Un proche";
  const t = (legende ?? "").trim();
  return { titre: `📷 ${qui} t’a envoyé une photo`, corps: t ? (signes(t) > ECRIT.notif ? `${[...t].slice(0, ECRIT.notif - 1).join("").trimEnd()}…` : t) : "Viens voir 👀" };
}
/** La ligne de « Chez moi » : « 📷 La légende », ou « 📷 Une photo ». */
export const lignePhoto = (legende?: string) => `📷 ${(legende ?? "").trim() || "Une photo"}`;
/** 👀 Ce que les figurines lisent d'une photo (l'étagère, l'aparté, le mot de la fin) : sa légende, jamais l'image. */
export const texteLuDeLaPhoto = (f: { legende?: unknown }) => (typeof f.legende === "string" ? f.legende.trim() : "");

// ─── les phrases (section 10 du cahier ; sans accord, jamais le mot interdit) ──────────────────────
export const PHRASES_PHOTO = {
  refusee: "Cette photo ne peut pas partir.",
  injoignable: "La photo n’a pas pu être vérifiée. Réessaie dans un instant.",
  assez: "Assez de photos pour aujourd’hui : reviens demain.",
  ferme: "Les photos ne sont pas encore ouvertes.",
  lourde: "Cette photo est trop lourde : 5 Mo au plus.",
  absente: "Ta photo n’est pas arrivée. Réessaie.",
  illisible: "Ce fichier n’est pas une photo.",
  legende: "Une légende de 200 signes au plus.",
} as const;
