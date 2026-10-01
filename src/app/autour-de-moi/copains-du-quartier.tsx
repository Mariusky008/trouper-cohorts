"use client";

// 👻 « LES COPAINS DU QUARTIER » — l'écran qui ouvre la ville depuis la page d'un commerce.
//
// « Quand on clique sur "Explorer ma ville", on devrait avoir les deux copains
// fantômes du commerçant. En version ordinateur, la photo 3 est parfaite ; en
// version téléphone et dans l'application, je ne sais pas bien comment on va
// procéder. »
//
// C'EST UN SEUIL, PAS UNE SECONDE APPLICATION. L'application de la ville est
// juste derrière, telle qu'elle est ; cet écran passe devant, une fois, quand
// on arrive d'une page commerçant (`?depuis=`). Son fantôme est au milieu et
// présente ses deux copains ; « Explorer toute la ville » le referme sur
// l'application. Un copain touché ouvre l'application sur SA carte
// (`?carte=`), en tête du paquet.
//
// SUR UN ORDINATEUR, sa maquette : les deux cartes de part et d'autre du
// fantôme. SUR UN TÉLÉPHONE, la même scène se replie en colonne : le fantôme
// et sa bulle d'abord, puis les deux copains l'un sous l'autre, et la ville en
// bas. Rien ne glisse sur le côté : on lit de haut en bas, comme le reste.
import { useState } from "react";
import Link from "next/link";
import { MotMarque } from "@/components/direct/mot-marque";
import type { Copain } from "@/lib/direct/copains";

export type CopainsProps = {
  moi: { nom: string; metier: string; ville: string; fantome: string };
  copains: Copain[];
  /** Où revenir : sa page. */
  retour?: string;
  /** Des commerces de démonstration : la page le dit, comme sur sa maquette. */
  fictifs: boolean;
};

export function CopainsDuQuartier({ moi, copains, retour, fictifs }: CopainsProps) {
  const [ouvert, setOuvert] = useState(true);
  if (!ouvert) return null;
  const bientot = copains.length === 0;
  const deux: (Copain | null)[] = [copains[0] ?? null, copains[1] ?? null];

  const carte = (c: Copain | null, cote: string) =>
    c ? (
      <a className={`cq-carte ${cote}`} href={`/autour-de-moi?carte=${encodeURIComponent(c.id)}`}>
        <span className="cq-photo" style={c.photo ? { backgroundImage: `url("${c.photo}")` } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cq-fantome" src={c.fantome} alt="" />
        </span>
        <span className="cq-texte">
          <small>{c.metier}</small>
          <b>{c.nom}</b>
          {c.offre && <strong>{c.offre}</strong>}
          {c.detail && <em>{c.detail}</em>}
        </span>
        <span className="cq-go">
          {c.bouton} <s aria-hidden="true">→</s>
        </span>
      </a>
    ) : (
      // ═══ PERSONNE ENCORE : LA PLACE EST GARDÉE, ET ON LE DIT ═══
      <div className={`cq-carte vide ${cote}`}>
        <span className="cq-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cq-fantome ombre" src="/clikme-fantome.png" alt="" />
        </span>
        <span className="cq-texte">
          <small>Bientôt ici</small>
          <b>Ils arrivent bientôt</b>
          <em>Les commerçants de {moi.ville} rejoignent ClikMe un à un. Le prochain sera présenté ici.</em>
        </span>
      </div>
    );

  return (
    <div className="cq" role="dialog" aria-label={`Les copains du quartier, depuis ${moi.nom}`}>
      <style>{STYLE}</style>
      <header className="cq-haut">
        {retour ? (
          <Link className="cq-retour" href={retour}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5.5M11 5.5 4.5 12l6.5 6.5" />
            </svg>
            {/* SON NOM SEUL : « Retour chez Chez Bergine » doublait le mot. */}
            <span>{moi.nom}</span>
          </Link>
        ) : (
          <span />
        )}
        <MotMarque className="cq-mot" encre="#FFF4E6" />
        <span />
      </header>

      <div className="cq-tete">
        <p className="cq-explore">Explore {moi.ville}</p>
        <p className="cq-depuis">
          <i aria-hidden="true">📍</i> Depuis {moi.nom} · {moi.metier}
        </p>
        <h1>Les copains du quartier</h1>
        <p className="cq-sous">{bientot ? "Les premiers voisins arrivent bientôt." : `Deux voisins présentés par ${moi.nom}.`}</p>
      </div>

      <div className="cq-scene">
        {carte(deux[0], "gauche")}
        <div className="cq-moi">
          <p className="cq-bulle">{bientot ? "Mes copains arrivent bientôt !" : "Je te présente mes deux copains !"}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={moi.fantome} alt="" />
        </div>
        {carte(deux[1], "droite")}
      </div>
      {fictifs && !bientot && <p className="cq-note">Exemples · Commerces et offres fictifs</p>}

      {/* SANS VOISIN DANS SA VILLE, L'APPLICATION DERRIÈRE N'EST PAS LA
          SIENNE : c'est l'exemple de Dax. On le dit avant d'y entrer, au lieu
          d'annoncer « ce qui se passe à Bayonne » sur des commerces de Dax. */}
      <div className="cq-ville">
        <h2>{bientot ? "En attendant" : "Toute la ville"}</h2>
        <p>
          {bientot
            ? "Voyez comment ClikMe fait vivre une ville : l'exemple de Dax, avec des commerces et des offres fictifs."
            : `Ce qui se passe maintenant à ${moi.ville}, commerce par commerce.`}
        </p>
        <button type="button" onClick={() => setOuvert(false)}>
          {bientot ? "Voir l'exemple de Dax" : "Explorer toute la ville"} <s aria-hidden="true">→</s>
        </button>
      </div>
    </div>
  );
}

const STYLE = `
.cq{position:fixed;inset:0;z-index:400;overflow-y:auto;overscroll-behavior:contain;
  background:radial-gradient(70% 45% at 50% 30%,rgba(245,162,58,.12),rgba(18,12,9,0) 70%),#120C09;
  color:#FFF4E6;font-family:var(--font-body,system-ui),system-ui,sans-serif;
  padding:calc(10px + env(safe-area-inset-top,0px)) 16px calc(28px + env(safe-area-inset-bottom,0px));}
.cq *{box-sizing:border-box;}
.cq-haut{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;max-width:1180px;margin:0 auto;}
.cq-retour{display:inline-flex;align-items:center;gap:8px;color:#FFF4E6;text-decoration:none;font-size:15px;min-width:0;}
.cq-retour svg{flex:none;width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.cq-retour span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cq-mot{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:24px;}
.cq-tete{text-align:center;margin:14px auto 0;max-width:900px;}
.cq-explore{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(26px,6vw,40px);letter-spacing:-.02em;}
.cq-depuis{display:inline-flex;align-items:center;gap:6px;margin:8px 0 0;padding:6px 14px;border-radius:999px;
  font-size:14px;border:1px solid rgba(255,196,140,.3);background:rgba(28,20,17,.8);max-width:100%;}
.cq-depuis i{font-style:normal;}
.cq h1{margin:14px 0 0;font-family:var(--font-clikme),sans-serif;font-weight:800;
  font-size:clamp(34px,8.5vw,64px);line-height:1.02;letter-spacing:-.03em;text-wrap:balance;}
.cq-sous{margin:6px 0 0;font-size:clamp(16px,2.2vw,22px);color:#E8D5C2;}
.cq-scene{display:grid;grid-template-columns:1fr;gap:16px;max-width:1180px;margin:22px auto 0;align-items:center;}
.cq-moi{order:-1;display:flex;flex-direction:column;align-items:center;}
.cq-moi img{width:150px;height:auto;filter:drop-shadow(0 12px 22px rgba(0,0,0,.5));}
.cq-bulle{position:relative;margin:0 0 4px;padding:10px 16px;border-radius:18px;background:#FFF4E6;color:#1A0F08;
  font-family:var(--font-ecrit,"Caveat"),cursive;font-size:20px;font-weight:600;line-height:1.15;text-align:center;max-width:220px;}
.cq-bulle::after{content:"";position:absolute;left:50%;bottom:-8px;width:16px;height:16px;background:#FFF4E6;
  transform:translateX(-50%) rotate(45deg);border-radius:3px;}
.cq-carte{display:flex;flex-direction:column;border-radius:26px;overflow:hidden;text-decoration:none;color:inherit;
  background:#1C1411;border:1px solid rgba(255,196,140,.16);box-shadow:0 24px 60px -24px rgba(0,0,0,.8);}
.cq-photo{position:relative;display:block;aspect-ratio:16 / 10;background:#2A1F1B center / cover no-repeat;}
.cq-fantome{position:absolute;right:10px;bottom:-6px;width:34%;max-width:150px;height:auto;
  filter:drop-shadow(0 10px 18px rgba(0,0,0,.5));}
.cq-fantome.ombre{right:50%;transform:translateX(50%);bottom:14%;width:30%;opacity:.35;filter:grayscale(1) brightness(1.6);}
.cq-texte{display:flex;flex-direction:column;gap:2px;padding:14px 18px 4px;}
.cq-texte small{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FF5CB0;}
.cq-texte b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;letter-spacing:-.01em;}
.cq-texte strong{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(22px,3vw,30px);line-height:1.1;letter-spacing:-.02em;}
.cq-texte em{font-style:normal;font-size:15px;color:#CDB8A4;}
.cq-go{display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 14px 14px;padding:14px 18px;border-radius:999px;
  background:#FF2E9A;color:#fff;font-weight:700;font-size:17px;}
.cq-go s{text-decoration:none;}
.cq-carte.vide{border-style:dashed;border-color:rgba(255,196,140,.35);background:rgba(28,20,17,.6);}
.cq-carte.vide .cq-photo{background:repeating-linear-gradient(135deg,rgba(255,196,140,.05) 0 12px,rgba(255,196,140,.02) 12px 24px);}
.cq-carte.vide .cq-texte small{color:#F5A23A;}
.cq-carte.vide .cq-texte{padding-bottom:18px;}
.cq-note{margin:12px 0 0;text-align:center;font-size:12.5px;color:#B9A594;}
.cq-ville{max-width:1180px;margin:28px auto 0;padding-top:22px;border-top:1px solid rgba(255,196,140,.14);}
.cq-ville h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(30px,6vw,48px);letter-spacing:-.02em;}
.cq-ville p{margin:6px 0 0;color:#CDB8A4;font-size:15px;}
.cq-ville button{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:14px;padding:16px 20px;
  border-radius:999px;border:0;cursor:pointer;background:#FF2E9A;color:#fff;font:inherit;font-weight:800;font-size:18px;}
.cq-ville button s{text-decoration:none;}
@media (min-width:860px){
  .cq{padding-left:28px;padding-right:28px;}
  .cq-scene{grid-template-columns:1fr 210px 1fr;gap:18px;align-items:start;}
  .cq-moi{order:0;padding-top:4px;}
  .cq-moi img{width:180px;}
  .cq-ville button{width:auto;min-width:320px;}
}
/* SUR UN TÉLÉPHONE, LE FANTÔME ET SA BULLE SE METTENT CÔTE À CÔTE : debout
   au-dessus des cartes, il repoussait le premier copain sous le pli. */
@media (max-width:859px){
  .cq-moi{flex-direction:row-reverse;justify-content:center;gap:4px;}
  .cq-moi img{width:104px;}
  .cq-bulle{font-size:18px;max-width:200px;}
  .cq-bulle::after{left:auto;right:-7px;top:50%;bottom:auto;transform:translateY(-50%) rotate(45deg);}
  .cq-photo{aspect-ratio:16 / 9;}
  .cq-fantome{width:28%;}
  .cq-retour span{max-width:30vw;}
  .cq-mot{font-size:20px;}
}
`;
