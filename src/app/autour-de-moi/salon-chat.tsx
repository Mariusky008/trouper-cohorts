"use client";

// ═══ LE SALON : LA CONVERSATION D'ABORD ══════════════════════════════════════
//
// « Dans un salon, la conversation doit devenir l'écran principal. L'événement
// sert de contexte, mais il ne doit pas prendre toute la place en permanence. »
//
// DEUX NIVEAUX : le chat, qu'on voit en premier ; les propositions, un panneau
// qu'on ouvre quand on veut décider. Ce module porte les pièces du premier
// niveau (en-tête, carte de contexte, fantômes) et la coque du second — son
// contenu reste dans la page, qui en a toutes les actions.
//
// LES MEMBRES SONT DES FANTÔMES, jamais des visages : entrer dans un salon ne
// donne accès à la photo de personne. Le fantôme d'un membre est celui qu'il a
// choisi, sinon celui de sa place dans l'alcôve — le même que sur le canapé.

import { useEffect } from "react";
import { lookDe, lookParDefautDe, monLook } from "@/lib/direct/look";
import type { Salon } from "@/lib/direct/salons";
import { sceneDuSalon } from "./ensemble";

/**
 * CE QU'ON A VU DES PROPOSITIONS DE CHAQUE SALON, sur ce téléphone : « du
 * nouveau » se mesure contre ça, d'une visite à l'autre. Une commodité de
 * lecture, rien qui parte ailleurs.
 */
const CLE_VUS_PROPOS = "clikme-propos-vus-v1";
export function lireVusPropos(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CLE_VUS_PROPOS) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
export function garderVusPropos(v: Record<string, string>) {
  try {
    window.localStorage.setItem(CLE_VUS_PROPOS, JSON.stringify(v));
  } catch {
    /* Refusé : le bouton se recalera à la prochaine visite. */
  }
}

/** Le fantôme d'un membre du salon : son look, sinon celui de sa place (comme dans l'alcôve). */
export function fantomeDe(salon: Salon, qui: string, moi: boolean, auteur?: string): string {
  if (moi) return monLook().image;
  const p = salon.acces?.participants?.find((x) => (auteur ? x.auteur === auteur : x.qui === qui));
  if (p?.moi) return monLook().image;
  if (p?.look) return lookDe(p.look).image;
  return lookParDefautDe(`${sceneDuSalon(salon.cle)}:${p?.auteur ?? auteur ?? qui}`).image;
}

/** Un fantôme en pastille ronde : la tête et le haut du corps. */
export function AvatarFantome({ src, taille = 30, titre, classe }: { src: string; taille?: number; titre?: string; classe?: string }) {
  return (
    <span className={`sc-av${classe ? ` ${classe}` : ""}`} style={{ width: taille, height: taille }} title={titre} aria-hidden={titre ? undefined : true}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
    </span>
  );
}

/**
 * LA CARTE DE CONTEXTE — une ou deux lignes sous l'en-tête. L'appuyer ouvre le
 * panneau ; la pastille à droite est « Je viens », qui ne doit pas disparaître
 * dans le panneau : c'est le geste qui fait passer de la discussion à la sortie.
 */
export function CarteDuSalon({
  photo,
  icone,
  titre,
  quand,
  ligne,
  fort,
  viens,
  onVenir,
  onOuvrir,
  lien = "Voir les propositions",
}: {
  photo?: string;
  icone: string;
  titre: string;
  quand?: string;
  /** La seconde ligne : qui vient, ou la réservation. */
  ligne: string;
  /** La seconde ligne dit une réservation : elle prend l'ambre. */
  fort?: boolean;
  /** Absent : pas de « Je viens » (rien à quoi venir, ou salon lu sans l'avoir rejoint). */
  viens?: boolean;
  onVenir?: () => void;
  onOuvrir: () => void;
  /** Ce que l'appui ouvre, dit au bout de la seconde ligne. */
  lien?: string;
}) {
  return (
    <div className="sc-ctx">
      <button type="button" className="sc-ctx-o" onClick={onOuvrir} aria-label={`${titre} — ${lien.toLowerCase()}`}>
        {photo ? (
          <span className="sc-ctx-v" style={{ backgroundImage: `url("${encodeURI(photo)}")` }} aria-hidden="true" />
        ) : (
          <span className="sc-ctx-v ic" aria-hidden="true">
            {icone}
          </span>
        )}
        {/* TROIS LIGNES COURTES plutôt que deux tronquées : le titre, le moment et
            qui vient, puis ce que l'appui ouvre — ou la réservation, qui le remplace. */}
        <span className="sc-ctx-t">
          <b>{titre}</b>
          <small>{[quand, fort ? "" : ligne].filter(Boolean).join(" · ")}</small>
          {fort ? (
            <small className="fort">{ligne}</small>
          ) : (
            <u>
              {lien} <span aria-hidden="true">↑</span>
            </u>
          )}
        </span>
      </button>
      {viens !== undefined && onVenir && (
        <button type="button" className={`sc-ctx-j${viens ? " on" : ""}`} onClick={onVenir} aria-pressed={viens}>
          {viens ? "Tu viens ✓" : "Je viens ?"}
        </button>
      )}
    </div>
  );
}

/**
 * LE PANNEAU DES PROPOSITIONS. Il monte sur près de 90 % de l'écran par-dessus
 * le chat, qui reste monté dessous : en le refermant, on retrouve la
 * conversation exactement où on l'avait laissée.
 */
export function PanneauPropositions({
  titre,
  onFermer,
  pied,
  children,
}: {
  titre: string;
  onFermer: () => void;
  pied?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, [onFermer]);
  return (
    <div className="sc-pp" role="dialog" aria-modal="true" aria-label={titre}>
      <button type="button" className="sc-pp-voile" aria-label="Revenir à la conversation" onClick={onFermer} />
      <div className="sc-pp-f">
        <i className="sc-pp-poignee" aria-hidden="true" />
        <div className="sc-pp-h">
          <button type="button" className="sc-rond" aria-label="Revenir à la conversation" onClick={onFermer}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <b>{titre}</b>
        </div>
        <div className="sc-pp-defile">{children}</div>
        {pied && <div className="sc-pp-pied">{pied}</div>}
      </div>
    </div>
  );
}

/** Le menu ⋯ de l'en-tête, hors vraie ville (là-bas, ce sont les options d'accès du serveur). */
export function MenuDuSalon({
  onFermer,
  onInviter,
  onCopier,
  visibilite,
  onAnnonce,
}: {
  onFermer: () => void;
  onInviter: () => void;
  onCopier: () => void;
  /** Le réglage public/privé, pour celui qui a ouvert le salon. */
  visibilite?: { prive: boolean; basculer: () => void };
  onAnnonce?: () => void;
}) {
  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, [onFermer]);
  const puis = (f: () => void) => () => {
    onFermer();
    f();
  };
  return (
    <div className="sc-menu" role="dialog" aria-modal="true" aria-label="Options du salon">
      <button type="button" className="sc-pp-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="sc-menu-f">
        <button type="button" onClick={puis(onInviter)}>
          <b>👥 Inviter quelqu’un</b>
          <small>WhatsApp ou un autre partage.</small>
        </button>
        <button type="button" onClick={puis(onCopier)}>
          <b>🔗 Copier le lien</b>
        </button>
        {onAnnonce && (
          <button type="button" onClick={puis(onAnnonce)}>
            <b>🔎 Voir l’annonce</b>
          </button>
        )}
        {visibilite && (
          <button type="button" onClick={puis(visibilite.basculer)}>
            <b>{visibilite.prive ? "🌍 Rendre le salon public" : "🔒 Rendre le salon privé"}</b>
            <small>
              {visibilite.prive ? "Aujourd’hui : seuls ceux que tu invites le voient." : "Aujourd’hui : ceux qui sont autour peuvent le voir et s’y joindre."}
            </small>
          </button>
        )}
      </div>
    </div>
  );
}

export function StylesSalonChat() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.sc-av{flex:none;display:inline-block;position:relative;overflow:hidden;border-radius:50%;
  background:radial-gradient(circle at 50% 35%,#5a3a22,#2a1a0f 75%);border:1.5px solid rgba(246,190,110,.55);}
.sc-av img{position:absolute;left:50%;top:6%;width:150%;height:auto;max-width:none;transform:translateX(-50%);}
.ap-page-h.chat{gap:8px;padding-bottom:10px;}
.sc-rond{flex:none;display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:50%;cursor:pointer;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,236,210,.18);color:#FFF4E6;}
.sc-rond svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.sc-rond:active{transform:scale(.93);}
.sc-titre{flex:1;min-width:0;font-size:16px;font-weight:850;color:#FFF6EA;letter-spacing:-.01em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-avs{flex:none;display:flex;}
.sc-avs .sc-av+.sc-av{margin-left:-9px;}
.sc-avs s{flex:none;display:grid;place-items:center;height:30px;min-width:30px;margin-left:-9px;padding:0 6px;border-radius:999px;
  text-decoration:none;font-size:11px;font-weight:800;color:#FFE3BD;background:#3a2414;border:1.5px solid rgba(246,190,110,.55);}
.sc-plus{font-size:20px;font-weight:900;line-height:1;letter-spacing:1px;}

.sc-ctx{flex:none;display:flex;align-items:center;gap:8px;margin:10px 0 2px;padding:7px 8px 7px 7px;border-radius:16px;
  background:linear-gradient(90deg,rgba(246,181,75,.13),rgba(246,181,75,.05));border:1px solid rgba(246,181,75,.38);}
.sc-ctx-o{flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.sc-ctx-v{flex:none;width:46px;height:46px;border-radius:11px;background:#2a1a0f center/cover no-repeat;}
.sc-ctx-v.ic{display:grid;place-items:center;font-size:20px;background:rgba(246,181,75,.16);}
.sc-ctx-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.sc-ctx-t{gap:1px;}
.sc-ctx-t b{font-size:14px;font-weight:800;line-height:1.25;color:#FFF6EA;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-ctx-t small,.sc-ctx-t u{font-size:12.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-ctx-t small{color:#D9C3A8;}
.sc-ctx-t u{text-decoration:none;color:#F6B54B;font-weight:700;}
.sc-ctx-t small.fort{color:#F6B54B;font-weight:700;}
.sc-ctx-j{flex:none;min-height:34px;padding:0 11px;white-space:nowrap;border-radius:999px;cursor:pointer;font:inherit;font-size:12.5px;font-weight:800;
  color:#2A1608;background:linear-gradient(180deg,#FBC766,#F0A23A);border:0;}
.sc-ctx-j.on{color:#F6B54B;background:rgba(246,181,75,.12);border:1px solid rgba(246,181,75,.5);}
.sc-ctx-j:active{transform:scale(.95);}

.sc-nouveau{flex:none;align-self:center;display:inline-flex;align-items:center;gap:6px;margin:4px auto 6px;padding:7px 16px;border-radius:999px;
  cursor:pointer;font:inherit;font-size:13px;font-weight:700;color:#F6B54B;background:rgba(36,21,11,.9);border:1px solid rgba(246,181,75,.6);
  animation:sc-apparait .3s ease both;}
@keyframes sc-apparait{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}

.sc-pp,.sc-menu{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;justify-content:flex-end;}
.sc-pp-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(10,5,2,.5);cursor:pointer;}
.sc-pp-f{position:relative;display:flex;flex-direction:column;height:88%;min-height:0;border-radius:26px 26px 0 0;
  background:linear-gradient(180deg,#2e1d10,#1d130b 60%);border:1px solid rgba(246,181,75,.35);border-bottom:0;
  box-shadow:0 -14px 40px rgba(0,0,0,.5);animation:sc-monte .3s cubic-bezier(.2,.8,.3,1) both;}
@keyframes sc-monte{from{transform:translateY(40px);opacity:.4;}to{transform:none;opacity:1;}}
.sc-pp-poignee{display:block;flex:none;width:40px;height:4px;margin:8px auto 4px;border-radius:4px;background:rgba(255,236,210,.35);}
.sc-pp-h{flex:none;display:flex;align-items:center;gap:12px;padding:4px 14px 10px;}
.sc-pp-h b{font-size:18px;font-weight:850;color:#FFF6EA;}
.sc-pp-defile{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 14px 12px;}
.sc-pp-pied{flex:none;padding:8px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,236,210,.08);}
.sc-pp-pied .ap-page-actions{padding:0;justify-content:stretch;}
.sc-pp-pied .ap-act{flex:1;padding:11px 12px;font-size:13.5px;}
.sc-pp .ap-obj{margin-bottom:12px;}
.sc-pp .ap-gens{margin:0 0 12px;}

.sc-menu-f{position:relative;display:flex;flex-direction:column;gap:2px;padding:12px 12px calc(14px + env(safe-area-inset-bottom,0px));
  border-radius:22px 22px 0 0;background:#2a1a0f;border:1px solid rgba(246,181,75,.3);border-bottom:0;animation:sc-monte .26s ease both;}
.sc-menu-f button{display:flex;flex-direction:column;gap:2px;width:100%;padding:12px 10px;border:0;border-radius:12px;background:none;
  color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;}
.sc-menu-f button:active{background:rgba(255,255,255,.06);}
.sc-menu-f b{font-size:15px;font-weight:750;}
.sc-menu-f small{font-size:12.5px;color:#CDB9A5;}

.ap-sal-m b .sc-av{width:22px;height:22px;}
.ap-gens-t .sc-av+.sc-av{margin-left:-8px;}
.ap-gens-t .sc-av.interesse{opacity:.6;}
.ap-gens-t .sc-av.hote{border-color:#F6B54B;}
/* PETIT ÉCRAN : la carte tient en deux lignes (toute la carte s'appuie), la conversation garde sa place. */
@media (max-height:640px){
  .sc-ctx{margin-top:8px;padding:5px 6px 5px 5px;}
  .sc-ctx-v{width:36px;height:36px;border-radius:9px;}
  .sc-ctx-t u{display:none;}
  .ap-page-h.chat{padding-bottom:8px;}
}
@media (max-width:359px){
  .sc-ctx-j{padding:0 9px;font-size:12px;min-height:32px;}
  .sc-avs .sc-av:nth-child(n+3){display:none;}
}
@media (prefers-reduced-motion: reduce){.sc-pp-f,.sc-menu-f,.sc-nouveau{animation:none;}}
`,
      }}
    />
  );
}
