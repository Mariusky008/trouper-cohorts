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
  /**
   * OÙ REGARDER DANS LA PHOTO — la valeur verticale de `background-position`.
   *
   * Le bas de la carte est recouvert par le voile qui porte le nom et le prix :
   * un sujet centré s'y fait avaler à moitié. Quand la photo est plus haute que
   * le cadre, on peut choisir la tranche qu'on garde. « 50% » (le défaut) prend
   * le milieu ; une valeur plus grande descend dans l'image, une plus petite
   * remonte.
   *
   * Utile surtout pour les photos des commerçants, dont on ne maîtrise pas le
   * cadrage : c'est le seul réglage qui rattrape une image sans la retoucher.
   */
  cadrage?: string;
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
  /**
   * À QUELLE DISTANCE C'EST — « 400 m », « 1,2 km ».
   *
   * C'est l'information qui manquait le plus à la carte, et elle décide plus
   * souvent que le prix : à midi, on ne choisit pas un restaurant, on choisit
   * un restaurant OÙ ON A LE TEMPS D'ALLER. Sans elle, l'habitant lisait une
   * belle photo sans savoir si c'était à deux rues ou à l'autre bout de Dax.
   *
   * Elle vient de `repereSpatial` (voir `degradation.ts`), qui la calcule
   * quand l'habitant a autorisé sa position et retombe sinon sur le quartier
   * puis sur la ville. Vide, la ligne se contente du métier et de la ville —
   * on n'affiche jamais une distance qu'on n'a pas.
   */
  distance?: string;
  /**
   * L'ITINÉRAIRE, quand on sait où c'est. Voir `lienItineraire`.
   *
   * Absent, le bouton n'existe pas : un « Y aller » qui ouvre une carte vide
   * coûte plus cher que son absence.
   */
  itineraire?: string;
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
            ? {
                backgroundImage: `url("${encodeURI(c.photo)}"), linear-gradient(155deg,#22463A,#0D1A15 70%)`,
                backgroundPosition: `center ${c.cadrage || "50%"}`,
              }
            : undefined
        }
      >
        {!c.photo && <span className="cd-ph" aria-hidden="true">{c.icone}</span>}
      </div>
      {/* Le voile n'est pas un effet : sans lui, un texte blanc posé sur une
          photo claire devient illisible une fois sur deux. */}
      <div className="cd-voile" aria-hidden="true" />

      {c.reste && <span className="cd-reste"><i aria-hidden="true">⏳</i>{c.reste}</span>}
      {/* « Y ALLER » EN HAUT À DROITE, à l'opposé du compte à rebours : c'est
          la seule action de la carte qui ne concerne pas le swipe, et la mettre
          en bas la ferait confondre avec les trois gestes. */}
      {c.itineraire && (
        <a className="cd-aller" href={c.itineraire} target="_blank" rel="noreferrer noopener">
          <i aria-hidden="true">↗</i>Y aller
        </a>
      )}

      <div className="cd-bas">
        <div className="cd-nom">{c.nom}</div>
        <div className="cd-ou">
          <i aria-hidden="true">📍</i>{c.metier} · {c.ville}
          {c.distance && <b>{c.distance}</b>}
        </div>
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
 * LA MÊME CARTE, EN CHAÎNE DE CARACTÈRES.
 *
 * POURQUOI CETTE SECONDE ÉCRITURE EXISTE. La démonstration du site joue ses
 * séquences dans une scène qu'elle remplit par `innerHTML` : une minuterie
 * remplace le contenu toutes les deux secondes, sans repasser par React. On ne
 * peut donc pas y monter `<CarteSwipe>`.
 *
 * Elle vit ICI, collée à la version JSX et à la feuille de styles, parce que
 * l'alternative — un dessin de carte écrit dans le fichier de la démo — est
 * exactement ce qu'on vient de supprimer : deux cartes différentes, celle qu'on
 * promet et celle qu'on livre. Deux rendus, UN seul jeu de classes et UN seul
 * type de données : le style ne peut plus diverger, seul l'ordre des blocs
 * pourrait, et il tient sur un écran.
 *
 * Tout ce qui vient du commerçant passe par `esc` — cette chaîne finit dans un
 * `innerHTML`, et un nom de commerce est une donnée, pas du balisage.
 */
export function carteDirectHtml(c: CarteDirect): string {
  const fond = c.photo
    ? ` style="background-image:url(&quot;${esc(encodeURI(c.photo))}&quot;),linear-gradient(155deg,#22463A,#0D1A15 70%);background-position:center ${esc(c.cadrage || "50%")}"`
    : "";
  return (
    `<div class="cd-carte">` +
      `<span class="cd-photo${c.photo ? "" : " sans"}"${fond}>${c.photo ? "" : `<span class="cd-ph">${esc(c.icone)}</span>`}</span>` +
      `<span class="cd-voile"></span>` +
      (c.reste ? `<span class="cd-reste"><i>⏳</i>${esc(c.reste)}</span>` : "") +
      (c.itineraire ? `<span class="cd-aller"><i>↗</i>Y aller</span>` : "") +
      `<span class="cd-bas">` +
        `<span class="cd-nom">${esc(c.nom)}</span>` +
        `<span class="cd-ou"><i>📍</i>${esc(c.metier)} · ${esc(c.ville)}${c.distance ? `<b>${esc(c.distance)}</b>` : ""}</span>` +
        (c.social ? `<span class="cd-social"><i>💚</i>${esc(c.social)}</span>` : "") +
        `<span class="cd-quoi"><i>${esc(c.icone)}</i>${esc(c.quoi)}</span>` +
        (c.lignes?.length
          ? `<span class="cd-lignes">${c.lignes.map((l) => `<span>${esc(l)}</span>`).join("")}</span>`
          : "") +
        (c.prix || c.etiquette
          ? `<span class="cd-prix">${c.prix ? `<b>${esc(c.prix)}</b>` : ""}${c.prixBarre ? `<s>${esc(c.prixBarre)}</s>` : ""}${c.etiquette ? `<em>${esc(c.etiquette)}</em>` : ""}</span>`
          : "") +
      `</span>` +
    `</div>`
  );
}

/** Les trois gestes, en chaîne — même raison, même contrat que ci-dessus. */
export function gestesDirectHtml(action = "Je veux"): string {
  return (
    `<div class="cd-gestes">` +
      `<span class="cd-g"><i>✕</i><em>Passer</em></span>` +
      `<span class="cd-g grand"><i>♥</i><em>${esc(action)}</em></span>` +
      `<span class="cd-g"><i>↑</i><em>Le pro</em></span>` +
    `</div>`
  );
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      /* UNE SEULE FOIS DANS LA PAGE, ET TOUJOURS AVANT LES SCÈNES.
         La page d'aperçu monte ce composant à deux endroits — la visite guidée
         et l'assistante — et les deux feuilles se retrouvaient dans le corps du
         document, la seconde APRÈS les styles de la visite. À spécificité
         égale, c'est la dernière qui gagne : `.cd-carte{max-width:340px}`
         écrasait le `.ph-carte{max-width:196px}` de l'acte 5, et la carte
         sortait de l'écran par le bas. Mesuré au navigateur : 340 px partout.
         `href` + `precedence` demandent à React de la remonter dans l'en-tête
         et de n'en garder qu'une. Les scènes gardent en plus une spécificité
         supérieure — l'ordre ne doit jamais être le seul garde-fou. */
      href="direct-carte-swipe"
      precedence="default"
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
        /* text-align:left EST INDISPENSABLE, pas cosmétique : la carte est
           servie dans des scènes qui centrent tout leur contenu (l'acte 3 de la
           visite guidée, par exemple). Sans elle, le menu s'affichait centré
           dans la démonstration et à gauche dans le vrai fil — deux cartes
           différentes, ce que ce fichier existe précisément pour empêcher. */
        .cd-carte{position:relative;width:100%;max-width:340px;aspect-ratio:3/4.15;border-radius:26px;overflow:hidden;
          text-align:left;
          background:#0C1310;box-shadow:0 40px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
          font-family:'Inter',system-ui,sans-serif;isolation:isolate;}
        .cd-photo{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;}
        .cd-photo.sans{display:flex;align-items:center;justify-content:center;
          background:linear-gradient(155deg,#22463A,#0D1A15 70%);}
        .cd-ph{font-size:74px;opacity:.5;}
        .cd-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,.3) 0%,rgba(4,8,6,0) 24%,rgba(4,8,6,.68) 56%,rgba(4,8,6,.96) 100%);}
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
        /* La distance est le seul chiffre de cette ligne : elle a droit au
           blanc, le reste est en gris. */
        .cd-ou b{font-weight:850;color:#fff;font-variant-numeric:tabular-nums;}
        .cd-ou b::before{content:"·";margin-right:5px;color:#7E938A;font-weight:600;}
        .cd-aller{position:absolute;right:14px;top:14px;z-index:3;display:flex;align-items:center;gap:5px;
          font-size:12px;font-weight:850;color:#04150E;text-decoration:none;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;padding:7px 12px;
          box-shadow:0 10px 24px -10px rgba(18,185,129,.9);}
        .cd-aller i{font-style:normal;font-size:11px;line-height:1;}
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
