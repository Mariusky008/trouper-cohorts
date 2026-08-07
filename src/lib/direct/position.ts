"use client";

// La position du visiteur — demandée, jamais imposée.
//
// Règle de dégradation n° 2 : ne jamais bloquer l'usage sur une demande de
// position, et ne jamais afficher une carte sans repère spatial. Le serveur rend
// donc TOUJOURS un repère de repli (quartier, puis ville) ; ce module ne fait
// que le remplacer par une distance réelle si — et seulement si — la personne
// l'a accordée.
//
// Conséquence recherchée : sans JavaScript, sans permission, ou avec une
// permission refusée, l'écran est exactement le même. La position est un bonus,
// pas une condition.
//
// Elle vit en mémoire et dans `sessionStorage` : elle sert le temps d'une
// visite, et n'est jamais envoyée au serveur. Une position stockée durablement
// côté serveur serait une donnée de déplacement, ce qui n'est pas ce qu'on
// demande à quelqu'un qui veut savoir où trouver du pain.
import { useSyncExternalStore } from "react";

export type Position = { lat: number; lng: number };

const CLE = "clikme_position";

let courante: Position | null = null;
let chargee = false;
const abonnes = new Set<() => void>();

function prevenir() {
  for (const f of abonnes) f();
}

function lireCache(): Position | null {
  if (chargee) return courante;
  chargee = true;
  try {
    const brut = sessionStorage.getItem(CLE);
    if (brut) {
      const p = JSON.parse(brut) as Partial<Position>;
      if (typeof p.lat === "number" && typeof p.lng === "number") courante = { lat: p.lat, lng: p.lng };
    }
  } catch {
    /* stockage refusé → la position vaudra pour ce rendu seulement */
  }
  return courante;
}

function sAbonner(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** La position connue, ou null. Ne déclenche AUCUNE demande de permission :
 *  seul `demanderPosition` le fait, sur un geste explicite. */
export function usePosition(): Position | null {
  return useSyncExternalStore(sAbonner, lireCache, () => null);
}

/** Est-ce que le navigateur sait faire ? Sert à ne pas proposer un bouton qui
 *  ne peut pas fonctionner. */
export function positionDisponible(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * Demande la position. À n'appeler que depuis un geste explicite : une demande
 * au chargement fait apparaître la fenêtre du navigateur avant que la personne
 * ait compris ce qu'elle regarde, et le refus qui suit est définitif.
 */
export function demanderPosition(): Promise<Position | null> {
  return new Promise((resolve) => {
    if (!positionDisponible()) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        courante = p;
        chargee = true;
        try {
          sessionStorage.setItem(CLE, JSON.stringify(p));
        } catch {
          /* la position vaudra pour cette page seulement */
        }
        prevenir();
        resolve(p);
      },
      () => resolve(null),
      // Pas de haute précision : on affiche « 280 m », pas un itinéraire. La
      // demander viderait la batterie et rallongerait l'attente pour rien.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

/** Oublie la position — l'habitant reprend la main sans passer par les réglages
 *  du navigateur. */
export function oublierPosition(): void {
  courante = null;
  chargee = true;
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
  prevenir();
}
