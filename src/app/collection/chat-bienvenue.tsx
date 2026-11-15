"use client";

/**
 * 🐾 LE CHAT DE PABLITO, DANS LA BIENVENUE (`bienvenue-chez.tsx`) — le propriétaire, le 15 novembre 2026 : « oui, les
 * boucles sont déjà validées » (l'essai C0, `docs/univers/compagnon.md`). Ses boucles viennent du catalogue des
 * compagnons (`compagnons/chat/<boucle>/video.mp4`, servies avec l'univers de Pablito), jouées par `CompagnonVivant`
 * (le vert retiré dans le téléphone).
 *
 * Ce qu'on lui demande (`voulue`) vient de la bienvenue : il dort, il se réveille, il dresse l'oreille, il saute de joie,
 * il renifle le souvenir, il vient ronronner sur les genoux de Pablito quand rien ne se passe. Ici, on le pose : sur ses
 * genoux, ou au sol à côté de lui (ou près du souvenir) ; quand il change de place, il marche, tourné du bon côté. Une
 * boucle qui manque au catalogue : la plus proche qui existe (assis, sinon la première).
 */
import { useEffect, useRef, useState } from "react";
import { BOUCLES, type Boucle } from "@/lib/direct/compagnons";
import { CompagnonVivant } from "../univers/compagnon-vivant";

/** Dans sa vidéo (9:16), ses pattes sont à 17 % du bas (comme à la page d'essais). */
const PIED = 0.17;
/** Le temps qu'il marche d'une place à l'autre. */
const MARCHE_MS = 1300;

export type PlaceChat = { x: number; bas: number; hauteur: number };

/** La boucle qu'on montre : celle demandée, sinon la plus proche qui existe. */
export function boucleMontree(voulue: Boucle, boucles: Partial<Record<Boucle, string>>): Boucle | null {
  if (boucles[voulue]) return voulue;
  if (boucles.assis) return "assis";
  return (BOUCLES.find((b) => boucles[b.cle])?.cle as Boucle | undefined) ?? null;
}

/** Où il se tient : sur les genoux de Pablito, ou au sol à côté de lui (ou là où on l'appelle). */
export function lieuDuChat(boucle: Boucle, place: PlaceChat, ailleurs?: { x: number; bas: number }) {
  const surGenoux = BOUCLES.find((b) => b.cle === boucle)?.ou === "genoux";
  if (surGenoux) return { x: place.x, bas: place.bas - place.hauteur * 0.28, h: place.hauteur * 0.55 };
  const cote = place.x > 0.6 ? -0.24 : 0.24;
  return { x: ailleurs?.x ?? Math.min(0.9, Math.max(0.1, place.x + cote)), bas: ailleurs?.bas ?? Math.min(0.99, place.bas + 0.02), h: place.hauteur * 0.7 };
}

export function ChatDePablito({
  boucles,
  nom,
  voulue,
  place,
  ailleurs,
  visible,
  montrerNom,
  onToucher,
}: {
  boucles: Partial<Record<Boucle, string>>;
  nom: string;
  voulue: Boucle;
  place: PlaceChat;
  ailleurs?: { x: number; bas: number };
  visible: boolean;
  montrerNom: boolean;
  onToucher: () => void;
}) {
  const cible = boucleMontree(voulue, boucles);
  const lieu = lieuDuChat(cible ?? "assis", place, ailleurs);
  // (il change de place : il marche, tourné du bon côté — sa boucle de marche regarde à gauche)
  const avant = useRef(lieu);
  const [marche, setMarche] = useState<{ dir: 1 | -1 } | null>(null);
  useEffect(() => {
    const d = lieu.x - avant.current.x;
    const loin = Math.abs(d) > 0.03 || Math.abs(lieu.bas - avant.current.bas) > 0.03;
    avant.current = lieu;
    if (!loin || !boucles.marche) return;
    const debut = window.setTimeout(() => setMarche({ dir: d > 0 ? -1 : 1 }), 0);
    const fin = window.setTimeout(() => setMarche(null), MARCHE_MS);
    return () => {
      window.clearTimeout(debut);
      window.clearTimeout(fin);
    };
  }, [lieu.x, lieu.bas]); // eslint-disable-line react-hooks/exhaustive-deps
  const montree: Boucle | null = marche ? "marche" : cible;
  const src = montree ? boucles[montree] : undefined;
  if (!src || !montree) return null;
  return (
    <button
      type="button"
      className={`bc-chat${visible ? "" : " cache"}`}
      data-boucle={montree}
      aria-label={`${nom}, le chat de Pablito`}
      style={{ left: `${lieu.x * 100}%`, top: `${(lieu.bas + PIED * lieu.h) * 100}%`, height: `${lieu.h * 100}%` }}
      onClick={onToucher}
      tabIndex={visible ? 0 : -1}
    >
      <CompagnonVivant key={src} src={src} titre={`${nom}, le chat de Pablito`} style={{ height: "100%", aspectRatio: "9 / 16", transform: marche?.dir === -1 ? "scaleX(-1)" : undefined }} />
      {montrerNom && <span className="bc-chat-nom">🐾 {nom}</span>}
    </button>
  );
}

export const STYLES_CHAT_BIENVENUE = `
.bc-chat{position:absolute;z-index:3;transform:translate(-50%,-100%);aspect-ratio:9/16;padding:0;border:0;background:none;cursor:pointer;
  transition:left ${MARCHE_MS}ms ease-in-out,top ${MARCHE_MS}ms ease-in-out,height ${MARCHE_MS}ms ease-in-out,opacity .6s;-webkit-tap-highlight-color:transparent}
.bc-chat.cache{opacity:0;pointer-events:none}
.bc-chat-nom{position:absolute;left:50%;top:18%;transform:translateX(-50%);padding:3px 9px;border-radius:999px;background:#FFF4E6;color:#2A0F1F;font-size:12px;font-weight:900;white-space:nowrap;animation:bc-pop .4s cubic-bezier(.2,1.5,.4,1)}
`;
