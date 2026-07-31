// Espace Pro — « Votre annonce dans le catalogue de {ville} ».
//
// C'est la carte qui prouve ce qu'on donne gratuitement. Deux chiffres, et deux
// seulement :
//   • AFFICHÉE N fois — l'exposition. On n'écrit jamais « vue par N personnes » :
//     un affichage n'est pas une lecture, et le commerçant s'en apercevrait.
//   • N visite(s) depuis le catalogue — les gens réellement arrivés chez lui.
//
// Le second chiffre est le seul qui compte, donc c'est lui qu'on met en gros.
// Zéro est affiché tel quel, avec ce qu'il faut faire pour qu'il bouge : un
// commerçant qui découvre un chiffre gonflé ne nous croit plus sur le reste.
//
// Composant serveur (aucune interaction) : rien à hydrater pour deux nombres.

type Props = {
  ville: string;
  villeUrl: string;
  views: number; // affichages de son annonce dans le catalogue
  clicks: number; // visiteurs arrivés sur son site depuis le catalogue
  hasOffer: boolean; // a-t-il une annonce en cours ? (sinon il n'y figure pas)
  actif: boolean; // participe-t-il au catalogue ?
  voisins: number; // autres commerces en ligne dans sa ville
};

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.max(0, n || 0));

export function ProCatalogue({ ville, villeUrl, views, clicks, hasOffer, actif, voisins }: Props) {
  // Sans ville identifiée, la page catalogue n'existe pas : on n'affiche pas une
  // carte qui renverrait dans le vide.
  if (!ville) return null;

  return (
    <div className="gcard pcat">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pcat .top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
          .pro .pcat .pin{font-size:11px;color:var(--faint);font-weight:700;}
          .pro .pcat .duo{display:grid;grid-template-columns:1.15fr 1fr;gap:11px;margin-top:13px;}
          .pro .pcat .cell{border-radius:14px;padding:13px 12px;background:#F7F7FC;}
          .pro .pcat .cell.hero{background:linear-gradient(135deg,rgba(109,74,224,.12),rgba(59,130,246,.08));}
          .pro .pcat .cell .cv{font-size:30px;font-weight:850;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;}
          .pro .pcat .cell.hero .cv{color:var(--violet);}
          .pro .pcat .cell .cl{font-size:11.5px;color:var(--soft);line-height:1.35;margin-top:5px;font-weight:600;}
          .pro .pcat .note{margin-top:12px;font-size:12.5px;line-height:1.55;color:var(--soft);}
          .pro .pcat .note b{color:var(--ink);font-weight:700;}
          .pro .pcat .warn{margin-top:12px;font-size:12.5px;line-height:1.55;border-radius:12px;padding:11px 12px;
            color:#8A6A12;background:#FFF7E9;border:1px solid #F6E4BD;}
          .pro .pcat .see{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:13px;text-decoration:none;
            border:1px solid var(--hair);background:#fff;color:var(--ink);border-radius:12px;padding:12px;font-size:13.5px;font-weight:700;
            box-shadow:0 6px 18px -14px rgba(25,26,44,.4);}
          .pro .pcat .see:active{transform:translateY(1px);}
          `,
        }}
      />
      <div className="top">
        <span className="lab">📍 Le catalogue de {ville}</span>
        <span className="pin">inclus · gratuit</span>
      </div>

      <div className="duo">
        <div className="cell hero">
          <div className="cv">{nf(clicks)}</div>
          <div className="cl">visite{clicks > 1 ? "s" : ""} de votre site <b>depuis le catalogue</b></div>
        </div>
        <div className="cell">
          <div className="cv">{nf(views)}</div>
          <div className="cl">affichage{views > 1 ? "s" : ""} de votre annonce dans le catalogue</div>
        </div>
      </div>

      {!actif ? (
        <div className="warn">
          Vous ne participez pas au catalogue. Vos annonces n&apos;y apparaissent pas, et vous n&apos;affichez pas
          celles des autres. Réactivable dans <b>Mon site → Le collectif</b>.
        </div>
      ) : !hasOffer ? (
        <div className="warn">
          Vous n&apos;avez aucune annonce en cours&nbsp;: vous ne figurez donc pas dans le catalogue en ce moment.
          Faites une annonce, elle y entre aussitôt.
        </div>
      ) : voisins === 0 ? (
        <div className="note">
          Votre annonce est dans le catalogue. Aucun autre commerce n&apos;est encore en ligne à {ville} —
          la page existe et la vôtre y est seule pour l&apos;instant.
        </div>
      ) : (
        <div className="note">
          Votre annonce est affichée dans le catalogue de {ville} et dans la fenêtre que{" "}
          <b>{voisins} autre{voisins > 1 ? "s" : ""} commerce{voisins > 1 ? "s" : ""}</b> en montre{voisins > 1 ? "nt" : ""} sur leur site.
          Publier souvent vous fait remonter&nbsp;: le catalogue est trié du plus récent au plus ancien.
        </div>
      )}

      <a className="see" href={villeUrl} target="_blank" rel="noreferrer">
        Voir le catalogue de {ville} <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
