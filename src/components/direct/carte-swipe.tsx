// LA CARTE DU DIRECT, EN MODE SWIPE — le seul écran qu'un habitant regarde.
//
// POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS DANS LA DÉMO.
//
// La démonstration faite au commerçant racontait Le Direct sans jamais le
// MONTRER : on lui disait « votre annonce circule », et il voyait un encadré
// stylisé qui ne ressemblait à rien de ce que ses clients verront. Or c'est le
// mode swipe qui fait comprendre le système d'un coup d'œil — une carte plein
// écran, une photo, un prix, et trois gestes.
//
// Cette carte est donc écrite UNE fois, ici, et servie à deux endroits :
//   · la démonstration du site (ce qu'on promet au commerçant) ;
//   · le fil de la ville (ce que l'habitant reçoit réellement).
//
// C'est la seule façon d'être sûr que la promesse et le produit ne divergent
// pas. Le jour où la carte change de forme, elle change aux deux endroits — et
// il devient IMPOSSIBLE de montrer en démonstration un écran qui n'existe pas.
//
// Composant PRÉSENTATIONNEL : il ne fait que rendre ce qu'on lui donne, aucun
// geste, aucun état. Les gestes appartiennent à l'écran qui l'utilise.
import type { CSSProperties } from "react";

export type CarteDirect = {
  /** La photo, plein cadre. Sans elle, un fond dégradé et l'emoji du métier. */
  photo?: string;
  /** Le nom du commerce, tel qu'il l'écrit. */
  nom: string;
  /** « Restaurant », « Boulangerie »… */
  metier: string;
  ville: string;
  /** Ce qui reste avant que ça disparaisse : « Jusqu'à 14 h », « 2 h 10 ». */
  reste?: string;
  /** L'emoji et l'intitulé de ce qui est proposé. */
  icone: string;
  quoi: string;
  /** Le détail — les lignes d'un menu, par exemple. */
  lignes?: string[];
  prix?: string;
  /** Le prix d'avant, barré. */
  prixBarre?: string;
  /** L'étiquette jaune : « GRATUIT », « -30 % ». */
  etiquette?: string;
  /** Ce que d'autres ont déjà fait : « 3 ont réservé ». Jamais inventé. */
  social?: string;
};

/**
 * LE BANDEAU DU HAUT — la marque, la ville, ce qu'on a gardé.
 *
 * Il ne sert pas à décorer : c'est lui qui dit à quel écran on est. Sans lui,
 * la carte pourrait aussi bien être une publicité.
 */
export function BarreDirect({
  marque,
  ville,
  agenda,
  gardees,
}: {
  marque: string;
  ville: string;
  /** Combien de choses réservées, en haut à droite. */
  agenda?: number;
  /** Combien de commerces gardés. */
  gardees?: number;
}) {
  return (
    <div className="cd-barre">
      <span className="cd-marque">{marque}</span>
      <span className="cd-puce"><i aria-hidden="true">📍</i>{ville}</span>
      {agenda != null && (
        <span className="cd-puce"><i aria-hidden="true">📅</i><b>{agenda}</b></span>
      )}
      {gardees != null && (
        <span className="cd-puce vert"><i aria-hidden="true">💚</i>Ma carte<b>{gardees}</b></span>
      )}
    </div>
  );
}

/**
 * LES TROIS GESTES, sous la carte.
 *
 * `action` est le libellé du bouton du milieu, et il change avec le métier :
 * on « réserve » une table, on « veut » une fournée. Un intitulé unique
 * obligerait l'habitant à traduire.
 */
export function GestesDirect({
  action = "Je veux",
  actif,
}: {
  action?: string;
  /** Le geste mis en avant, le temps d'une démonstration. */
  actif?: "passer" | "veux" | "pro";
}) {
  return (
    <div className="cd-gestes">
      <span className={`cd-g${actif === "passer" ? " on" : ""}`}>
        <i aria-hidden="true">✕</i>
        <em>Passer</em>
      </span>
      <span className={`cd-g grand${actif === "veux" ? " on" : ""}`}>
        <i aria-hidden="true">♥</i>
        <em>{action}</em>
      </span>
      <span className={`cd-g${actif === "pro" ? " on" : ""}`}>
        <i aria-hidden="true">↑</i>
        <em>Le pro</em>
      </span>
    </div>
  );
}

export function CarteSwipe({
  carte,
  style,
  className = "",
}: {
  carte: CarteDirect;
  style?: CSSProperties;
  className?: string;
}) {
  const c = carte;
  return (
    <div className={`cd-carte ${className}`} style={style}>
      {/* DEUX COUCHES, PAS UNE, et c'est un filet de sécurité.
          L'image est empilée SUR un dégradé. Si le fichier manque ou tarde, la
          couche du dessous reste : la carte est sombre et propre au lieu d'être
          blanche et cassée. Avec une seule couche, un `background-image` en 404
          efface aussi la couleur de fond — on aurait un trou en plein milieu de
          l'écran qui doit convaincre. */}
      <div
        className={`cd-photo${c.photo ? "" : " sans"}`}
        style={
          c.photo
            ? { backgroundImage: `url("${encodeURI(c.photo)}"), linear-gradient(155deg,#22463A,#0D1A15 70%)` }
            : undefined
        }
      >
        {!c.photo && <span className="cd-ph" aria-hidden="true">{c.icone}</span>}
      </div>
      {/* Le voile n'est pas un effet : sans lui, un texte blanc posé sur une
          photo claire devient illisible une fois sur deux. */}
      <div className="cd-voile" aria-hidden="true" />

      {c.reste && <span className="cd-reste"><i aria-hidden="true">⏳</i>{c.reste}</span>}

      <div className="cd-bas">
        <div className="cd-nom">{c.nom}</div>
        <div className="cd-ou"><i aria-hidden="true">📍</i>{c.metier} · {c.ville}</div>
        {c.social && <div className="cd-social"><i aria-hidden="true">💚</i>{c.social}</div>}

        <div className="cd-quoi"><i aria-hidden="true">{c.icone}</i>{c.quoi}</div>
        {!!c.lignes?.length && (
          <div className="cd-lignes">
            {c.lignes.map((l) => (<span key={l}>{l}</span>))}
          </div>
        )}
        {(c.prix || c.etiquette) && (
          <div className="cd-prix">
            {c.prix && <b>{c.prix}</b>}
            {c.prixBarre && <s>{c.prixBarre}</s>}
            {c.etiquette && <em>{c.etiquette}</em>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LES STYLES DE LA CARTE, posés une seule fois par écran.
 *
 * Ils voyagent avec le composant plutôt que de vivre dans la feuille de la
 * démonstration : c'est ce qui permet au fil de la ville de servir exactement
 * la même carte, sans recopier trois cents lignes qui divergeraient au premier
 * ajustement.
 */
export function StylesDirect() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .cd-barre{display:flex;align-items:center;gap:7px;width:100%;max-width:340px;margin:0 auto;
          font-family:'Inter',system-ui,sans-serif;}
        .cd-marque{flex:1;min-width:0;font-size:17px;font-weight:850;letter-spacing:-.03em;color:#fff;}
        .cd-puce{display:flex;align-items:center;gap:5px;flex:none;font-size:11.5px;font-weight:700;color:#D6DEE4;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 10px;}
        .cd-puce i{font-style:normal;font-size:11px;line-height:1;}
        .cd-puce b{font-weight:850;color:#fff;}
        .cd-puce.vert{color:#8FE9C4;border-color:rgba(126,230,192,.28);background:rgba(18,185,129,.14);}

        /* LA CARTE. Format portrait, comme un écran de téléphone tenu à la
           main : c'est la forme qui dit « ça se regarde en marchant ». */
        .cd-carte{position:relative;width:100%;max-width:340px;aspect-ratio:3/4.15;border-radius:26px;overflow:hidden;
          background:#0C1310;box-shadow:0 40px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
          font-family:'Inter',system-ui,sans-serif;isolation:isolate;}
        .cd-photo{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;}
        .cd-photo.sans{display:flex;align-items:center;justify-content:center;
          background:linear-gradient(155deg,#22463A,#0D1A15 70%);}
        .cd-ph{font-size:74px;opacity:.5;}
        .cd-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,.42) 0%,rgba(4,8,6,0) 26%,rgba(4,8,6,.72) 58%,rgba(4,8,6,.95) 100%);}
        .cd-reste{position:absolute;left:14px;top:14px;display:flex;align-items:center;gap:6px;
          font-size:12px;font-weight:800;color:#fff;background:rgba(8,12,10,.62);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 11px;}
        .cd-reste i{font-style:normal;font-size:11px;line-height:1;}

        .cd-bas{position:absolute;left:0;right:0;bottom:0;padding:16px 16px 18px;display:flex;flex-direction:column;gap:5px;}
        /* Le nom en serif : c'est le seul mot de la carte qui appartient au
           commerçant, et il doit se lire comme une enseigne, pas comme une
           ligne de base de données. */
        .cd-nom{font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.06;font-weight:700;color:#fff;
          text-shadow:0 2px 18px rgba(0,0,0,.7);}
        .cd-ou{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:#CBD7D0;}
        .cd-ou i{font-style:normal;font-size:11px;line-height:1;}
        .cd-social{align-self:flex-start;display:flex;align-items:center;gap:6px;margin-top:3px;
          font-size:12px;font-weight:800;color:#8FE9C4;background:rgba(18,185,129,.16);
          border:1px solid rgba(126,230,192,.3);border-radius:999px;padding:5px 11px;}
        .cd-social i{font-style:normal;font-size:11px;line-height:1;}
        .cd-quoi{display:flex;align-items:center;gap:7px;margin-top:8px;font-size:14.5px;font-weight:750;color:#fff;}
        .cd-quoi i{font-style:normal;font-size:14px;line-height:1;flex:none;}
        .cd-lignes{display:flex;flex-direction:column;gap:2px;padding-left:22px;}
        .cd-lignes span{font-size:12.5px;line-height:1.35;color:#C4D2CA;}
        .cd-prix{display:flex;align-items:baseline;gap:9px;margin-top:7px;}
        .cd-prix b{font-size:26px;font-weight:850;letter-spacing:-.035em;color:#3DE2A6;line-height:1;}
        .cd-prix s{font-size:13px;color:#93A79C;}
        .cd-prix em{font-style:normal;font-size:10.5px;font-weight:850;letter-spacing:.08em;color:#3A2A00;
          background:#FFC400;border-radius:6px;padding:4px 8px;}

        .cd-gestes{display:flex;align-items:flex-start;justify-content:center;gap:26px;margin-top:16px;}
        .cd-g{display:flex;flex-direction:column;align-items:center;gap:6px;}
        .cd-g i{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;
          font-style:normal;font-size:19px;color:#D6DEE4;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.12);transition:transform .3s cubic-bezier(.34,1.4,.64,1),box-shadow .3s ease;}
        .cd-g.grand i{width:62px;height:62px;font-size:24px;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);box-shadow:0 14px 30px -12px rgba(18,185,129,.85);}
        .cd-g em{font-style:normal;font-size:11px;font-weight:700;color:#93A79C;}
        .cd-g.grand em{color:#8FE9C4;}
        /* Le geste mis en avant grossit — c'est le seul moment où la carte
           montre ce qu'on ATTEND de l'habitant, pas ce qu'on lui propose. */
        .cd-g.on i{transform:scale(1.14);box-shadow:0 0 0 4px rgba(126,230,192,.22);}

        @media (max-width:380px){
          .cd-carte{max-width:300px;}
          .cd-nom{font-size:22px;}
          .cd-gestes{gap:20px;}
          .cd-g i{width:44px;height:44px;}
          .cd-g.grand i{width:56px;height:56px;}
        }
        @media (prefers-reduced-motion:reduce){
          .cd-g i{transition:none;}
        }
      `,
      }}
    />
  );
}
