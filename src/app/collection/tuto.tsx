"use client";

/**
 * 🧭 LE TUTO DE CLIKME — ce qu'il en reste : LA BIENVENUE (`bienvenue.tsx`), à la toute première arrivée, une seule fois
 * sur ce téléphone, et ce que ce téléphone en retient.
 *
 * LA VISITE SOUS LE LOGO EST PARTIE (26 novembre 2026, le propriétaire : « supprimer toutes les vidéos de présentation
 * qui sont désuètes quand on clique sur ClikMe ») : la feuille « Je te fais visiter ? », et les six pages que Pablito
 * montrait sur la vraie page (Créer, Découvrir, Autour, Mes mèmes, Proches, Moi) — elles parlaient toutes de l'appli
 * d'avant. Leurs enregistrements sont partis avec elles. Le logo ramène au fil de Découvrir.
 */

// ─── ce qu'on retient sur ce téléphone ───────────────────────────────────────────────────────────
export type SouvenirTuto = { bienvenue: boolean };
const CLE_BIENVENUE = "clikme-tuto-bienvenue";
/** (l'ancien accueil de Pablito, déjà vu : pas de bienvenue — il connaît Pablito) */
const ANCIEN_ACCUEIL = "clikme-clik-pablito-accueil";
export function lireTuto(): SouvenirTuto {
  try {
    if (typeof window === "undefined") return { bienvenue: false };
    const s = window.localStorage;
    return { bienvenue: Boolean(s.getItem(CLE_BIENVENUE) || s.getItem(ANCIEN_ACCUEIL)) };
  } catch {
    return { bienvenue: false };
  }
}
export function ecrireTuto(s: SouvenirTuto): void {
  try {
    if (s.bienvenue) window.localStorage.setItem(CLE_BIENVENUE, "1");
  } catch {
    /* (navigation privée : on ne retient rien, ce n'est pas grave) */
  }
}

/** Les boutons communs de la bienvenue (`bienvenue.tsx`, `bienvenue-chez.tsx`). */
export const STYLES_TUTO = `
.tu{position:fixed;inset:0;z-index:1100;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tu-curseur{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#FF2E9A;animation:tu-curseur .6s steps(1) infinite}
.tu-ecouter{align-self:flex-start;margin-top:2px;padding:6px 12px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:12.5px;font-weight:900;cursor:pointer}
.tu-passer{min-height:44px;padding:0 8px;border:0;background:none;color:#CDB4C0;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.tu-creer{margin:0 auto;padding:0 26px;font-size:16px}
.tu-passer:focus-visible{outline:2px solid #FFF4E6;outline-offset:2px}
@keyframes tu-curseur{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.tu *{animation:none!important;transition:none!important}}
`;
