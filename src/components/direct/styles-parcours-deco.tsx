/**
 * 🎨 LA FEUILLE DU PARCOURS DÉCO — voir `parcours-deco-ecran.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * scripts/verifier-styles-en-ligne.mjs.
 *
 * MEME COQUE QUE LES TROIS AUTRES PARCOURS. Logo et frise en haut, pastille du
 * lieu sous eux, fantome a droite, photo derriere tout, et seul le bas change.
 *
 * CE QUI LUI EST PROPRE : la glissiere de l'etape 2 — le meme salon sans puis
 * avec le fauteuil — et les deux gros plans de l'etape 3.
 */
export function StylesParcoursDeco() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pd{position:absolute;inset:0;z-index:40;overflow:hidden;
          display:flex;flex-direction:column;
          background:#06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;color:#fff;
          -webkit-user-select:none;user-select:none;}
        .pd-fond{position:absolute;inset:0;background-size:cover;
          background-position:center 42%;}
        .pd-voile{position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(180deg,
            rgba(6,6,10,.84) 0%, rgba(6,6,10,.36) 14%, rgba(6,6,10,.02) 30%,
            rgba(6,6,10,.58) 54%, rgba(6,6,10,.95) 74%, #06060A 100%);}

        /* ═══ LA COQUE ════════════════════════════════════════════════════ */
        .pd-haut{position:relative;z-index:3;flex:none;
          display:flex;align-items:center;gap:10px;
          padding:calc(8px + var(--ap-encoche,0px)) 14px 0;}
        .pd-retour{flex:none;width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);}
        .pd-retour svg{width:19px;height:19px;fill:none;stroke:currentColor;
          stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
        .pd-retour:active{transform:scale(.92);}
        .pd-logo{margin:0;flex:none;font-weight:900;
          font-size:clamp(23px,min(6.8vw,3.4vh),31px);line-height:1;
          letter-spacing:-.03em;text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .pd-logo b{color:#fff;font-weight:900;}
        .pd-logo i{font-style:normal;color:#FF2E9A;font-weight:900;}
        .pd-pas{flex:1 1 auto;position:relative;
          display:flex;align-items:center;justify-content:center;gap:0;}
        .pd-pas s{width:11px;height:11px;border-radius:50%;text-decoration:none;
          background:rgba(255,255,255,.22);flex:none;
          box-shadow:0 0 0 1.5px rgba(255,255,255,.3) inset;}
        .pd-pas s+s{margin-left:20px;}
        .pd-pas s+s::before{content:"";position:absolute;width:20px;height:2.5px;
          margin:4px 0 0 -20px;background:rgba(255,255,255,.22);}
        .pd-pas s.on{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.8);}
        .pd-pas s.on+s.on::before{background:#FF2E9A;}
        .pd-pas em{position:absolute;top:100%;margin-top:3px;font-style:normal;
          font-size:12.5px;font-weight:850;text-shadow:0 1px 8px rgba(0,0,0,.8);}
        .pd-f{flex:none;width:clamp(46px,min(12.5vw,6.2vh),62px);height:auto;
          filter:drop-shadow(0 0 16px rgba(196,132,255,.65));}

        .pd-lieu{position:relative;z-index:3;flex:none;align-self:flex-start;
          display:flex;align-items:center;gap:10px;
          margin:12px 0 0 14px;padding:6px;border-radius:999px;
          background:rgba(12,10,16,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          max-width:calc(100% - 28px);}
        .pd-lieu-v{flex:none;width:42px;height:42px;border-radius:50%;
          background-size:cover;background-position:center;
          border:1.5px solid rgba(255,255,255,.4);}
        .pd-lieu-t{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .pd-lieu-t b{font-size:14px;font-weight:900;letter-spacing:-.015em;
          line-height:1.14;}
        .pd-lieu-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:11.5px;font-weight:750;color:rgba(255,255,255,.76);
          white-space:nowrap;}
        .pd-lieu-t i{font-style:normal;font-size:10px;flex:none;}
        .pd-sortir{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);}
        .pd-sortir svg{width:17px;height:17px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .pd-sortir:active{transform:scale(.92);}

        /* LA BULLE DU FANTOME, sur la photo : « On l'essaie ? ». */
        .pd-dit{display:flex;align-items:center;gap:0;
          margin:0 auto 10px;width:max-content;max-width:100%;}
        .pd-dit-f{flex:none;width:clamp(54px,16vw,70px);height:auto;
          filter:drop-shadow(0 0 16px rgba(196,132,255,.7));}
        .pd-dit p{margin:0 0 14px -6px;padding:9px 15px;border-radius:999px;
          font-size:clamp(14px,4.2vw,17px);font-weight:850;
          letter-spacing:-.01em;color:#fff;
          background:rgba(12,10,16,.86);
          border:1.5px solid rgba(255,46,154,.75);
          box-shadow:0 0 22px -8px rgba(255,46,154,.95);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}

        /* ═══ CE QUI CHANGE : LE BAS DE L'ECRAN ══════════════════════════ */
        .pd-bas{position:relative;z-index:3;margin-top:auto;width:100%;
          padding:0 16px calc(14px + var(--ap-bas,0px));text-align:center;}
        .pd-bas.pd-haute{margin-top:0;padding-top:8px;}
        .pd-t{position:relative;margin:0;
          font-size:clamp(25px,min(7.8vw,4vh),34px);
          font-weight:900;line-height:1.05;letter-spacing:-.03em;
          text-shadow:0 2px 16px rgba(0,0,0,.9);}
        .pd-t em{font-style:normal;color:#FF2E9A;}
        .pd-t s{display:block;width:62%;height:4px;margin:7px auto 0;
          border-radius:99px;text-decoration:none;
          background:linear-gradient(90deg,rgba(255,46,154,0),#FF2E9A 22%,
            #FF2E9A 78%,rgba(255,46,154,0));}
        .pd-sous{margin:7px 0 0;font-size:14.5px;font-weight:750;
          color:rgba(255,255,255,.86);text-shadow:0 1px 10px rgba(0,0,0,.9);}
        /* LE NOM ET LA MATIERE, lus sur sa carte. Plus petit que le titre :
           le titre pose la question, cette ligne dit de quoi on parle. */
        .pd-quoi{margin:8px 0 0;font-size:13px;font-weight:750;
          color:rgba(255,255,255,.76);text-shadow:0 1px 10px rgba(0,0,0,.9);}
        .pd-quoi b{color:#fff;font-weight:900;}
        .pd-prix{margin:6px 0 0;font-size:clamp(30px,min(9vw,4.6vh),40px);
          font-weight:900;letter-spacing:-.04em;line-height:1;
          text-shadow:0 2px 18px rgba(0,0,0,.9);}

        /* ═══ 2/4 · LA GLISSIERE ════════════════════════════════════════
           ON DECOUPE, ON NE REDIMENSIONNE PAS. Redimensionner la boite du
           dessus rechangerait son cadrage, et les deux moities ne se
           compareraient plus — c'est le defaut qu'on a corrige deux fois
           ailleurs, sur la mode puis sur la coiffure. */
        /* MESURE A L'ECRAN : a 1/1.12, la deuxieme etape sortait de VINGT
           POINTS sous le bas d'un iPhone 14 — et pas sur les deux autres
           telephones, parce que le petit passait deja par la regle compacte et
           que le grand avait la place. Un carre passe partout, et le salon se
           lit aussi bien : ce qu'on regarde est la difference entre les deux
           moities, pas la hauteur du plafond. */
        .pd-cadre{position:relative;width:100%;aspect-ratio:1 / 1;
          margin:11px 0 0;border-radius:20px;overflow:hidden;cursor:ew-resize;
          border:1.5px solid rgba(255,46,154,.5);
          box-shadow:0 0 26px -12px rgba(255,46,154,.85);
          touch-action:none;}
        .pd-g-img{position:absolute;inset:0;background-size:cover;
          background-position:center 46%;}
        .pd-g-et{position:absolute;z-index:3;top:11px;padding:6px 13px;
          border-radius:999px;font-size:12.5px;font-weight:900;color:#fff;
          box-shadow:0 8px 22px -8px rgba(0,0,0,.85);}
        .pd-g-et.gauche{left:11px;background:rgba(32,30,38,.88);
          border:1px solid rgba(255,255,255,.22);}
        .pd-g-et.droite{right:11px;background:#FF2E9A;}
        .pd-g-poignee{position:absolute;top:0;bottom:0;z-index:4;width:2px;
          margin-left:-1px;background:rgba(255,255,255,.9);
          box-shadow:0 0 14px rgba(255,255,255,.6);}
        .pd-g-poignee i{position:absolute;top:50%;left:50%;
          width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;
          background:#fff;box-shadow:0 6px 18px -6px rgba(0,0,0,.9);}
        .pd-g-poignee i::before,.pd-g-poignee i::after{content:"";
          position:absolute;top:50%;width:0;height:0;margin-top:-5px;
          border-top:5px solid transparent;border-bottom:5px solid transparent;}
        .pd-g-poignee i::before{left:7px;border-right:6px solid #14121A;}
        .pd-g-poignee i::after{right:7px;border-left:6px solid #14121A;}

        /* ═══ 3/4 · LES DEUX GROS PLANS ═════════════════════════════════ */
        .pd-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
          gap:9px;margin:12px 0 0;}
        .pd-detail{position:relative;border-radius:16px;overflow:hidden;
          text-align:left;
          border:1.5px solid rgba(255,46,154,.45);
          box-shadow:0 0 22px -12px rgba(255,46,154,.85);}
        .pd-detail>div{aspect-ratio:1 / .78;background-size:cover;
          background-position:center;}
        .pd-detail>span{position:absolute;left:0;right:0;bottom:0;
          display:flex;align-items:flex-end;justify-content:space-between;
          gap:6px;padding:22px 11px 9px;
          background:linear-gradient(180deg,rgba(6,6,10,0),rgba(6,6,10,.94));}
        .pd-detail b{font-size:12.5px;font-weight:900;letter-spacing:-.015em;
          line-height:1.14;}
        .pd-detail em{flex:none;font-style:normal;font-size:13.5px;
          font-weight:900;color:#FFD233;}

        /* ═══ 4/4 · CE QU'IL FAUT SAVOIR ════════════════════════════════ */
        .pd-pratique{list-style:none;display:flex;flex-wrap:wrap;
          justify-content:center;gap:6px;margin:11px 0 0;padding:0;}
        .pd-pratique li{padding:5px 11px;border-radius:999px;
          font-size:11.5px;font-weight:800;color:rgba(255,255,255,.84);
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.14);}
        .pd-motfiche{margin:8px 0 0;font-size:13.5px;font-weight:750;
          font-style:italic;color:rgba(255,255,255,.8);
          text-shadow:0 1px 10px rgba(0,0,0,.9);}

        /* LA MENTION QUI REVIENT TROIS FOIS. Elle n'est pas une precaution :
           un rendu qui fait croire qu'un fauteuil passe la porte, et qui se
           trompe, coute une livraison et un client au commerçant. */
        .pd-simu{display:flex;align-items:center;justify-content:center;gap:6px;
          margin:9px 0 0;font-size:11.5px;font-weight:700;
          color:rgba(255,255,255,.62);}
        .pd-simu i{font-style:normal;font-size:11px;}

        /* ═══ LA FICHE, AUX QUATRE ETAPES ═══════════════════════════════ */
        .pd-fiche{display:flex;align-items:center;gap:12px;width:100%;
          margin:11px 0 0;padding:9px 13px;border-radius:16px;text-align:left;
          background:rgba(20,18,26,.74);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .pd-fiche-v{flex:none;width:48px;height:48px;border-radius:12px;
          background-size:cover;background-position:center;}
        .pd-fiche-t{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px;}
        .pd-fiche-t b{font-size:15px;font-weight:900;letter-spacing:-.015em;
          line-height:1.16;}
        .pd-fiche-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:12.5px;font-weight:750;color:rgba(255,255,255,.76);}
        .pd-fiche-t i{font-style:normal;font-size:10px;}
        .pd-fiche-p{flex:none;font-size:clamp(17px,5vw,21px);font-weight:900;
          letter-spacing:-.02em;}

        /* ═══ LES DEUX BOUTONS, IDENTIQUES AUX AUTRES PARCOURS ══════════ */
        .pd-go{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:12px 0 0;padding:15px 18px;
          font:inherit;font-size:clamp(16px,4.8vw,19px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;text-decoration:none;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.85),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .pd-go:active{transform:scale(.98);}
        .pd-go-f{flex:none;width:30px;height:auto;
          filter:drop-shadow(0 1px 5px rgba(0,0,0,.4));}
        .pd-ico{width:23px;height:23px;flex:none;fill:none;
          stroke:currentColor;stroke-width:1.7;
          stroke-linecap:round;stroke-linejoin:round;}
        .pd-deux{display:flex;align-items:center;justify-content:center;gap:9px;
          width:100%;margin:9px 0 0;padding:13px 18px;
          font:inherit;font-size:15px;font-weight:850;color:#fff;
          cursor:pointer;text-decoration:none;
          border-radius:999px;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,46,154,.55);}
        .pd-deux:active{transform:scale(.98);}
        .pd-deux s{text-decoration:none;}

        /* SUR UN PETIT TELEPHONE, LE BAS SE SERRE — mesure etape par etape. */
        @media (max-height: 800px){
          .pd-cadre{aspect-ratio:1 / .88;margin-top:9px;}
          .pd-details{gap:7px;margin-top:9px;}
          .pd-detail>div{aspect-ratio:1 / .72;}
          .pd-fiche{margin-top:9px;padding:8px 12px;}
          .pd-go{margin-top:10px;padding:13px 16px;}
          .pd-deux{margin-top:7px;padding:11px 16px;}
          .pd-dit-f{width:clamp(48px,14vw,60px);}
        }
      `,
      }}
    />
  );
}
