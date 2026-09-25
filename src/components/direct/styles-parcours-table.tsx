/**
 * 🎨 LA FEUILLE DU PARCOURS RESTAURANT — voir `parcours-table-ecran.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * `scripts/verifier-styles-en-ligne.mjs`.
 *
 * MEME COQUE QUE LA COIFFURE ET LA SORTIE. Logo et frise en haut, pastille du
 * lieu sous eux, fantome a droite, photo derriere tout, et seul le bas change
 * d'une etape a l'autre.
 *
 * CE QUI LUI EST PROPRE : le prix en gros de la premiere etape, les deux vues
 * du plat a la deuxieme, et la citation de la cuisiniere a la troisieme.
 */
export function StylesParcoursTable() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pt{position:absolute;inset:0;z-index:40;overflow:hidden;
          display:flex;flex-direction:column;
          background:#06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;color:#fff;
          -webkit-user-select:none;user-select:none;}
        .pt-fond{position:absolute;inset:0;background-size:cover;
          background-position:center 30%;}
        /* ═══ LE PLAT EST UN BANDEAU, PAS UN FOND PLEIN CADRE ══════════════
           MESURE A L'ECRAN : en plein cadre, on ne voyait plus un plat mais
           un fragment de gratin. La cause est de la geometrie, pas du gout —
           une photo large posee dans un ecran haut se recadre par les COTES,
           et il ne reste que la tranche du milieu.
           LES DEUX PREMIERES ETAPES LUI DONNENT DONC UNE BANDE HAUTE, comme
           sa maquette : la photo garde sa largeur, le texte prend le noir en
           dessous. Les etapes 3 et 4 gardent le plein cadre — leurs images,
           elles, sont hautes. */
        .pt-e1 .pt-fond,.pt-e2 .pt-fond{bottom:auto;height:56%;
          background-position:center 46%;}
        /* LE VOILE EPARGNE LE HAUT DE LA PHOTO : c'est le plat, et c'est ce
           qu'on vient regarder. Il ne se ferme qu'en dessous, la ou le texte
           commence. */
        .pt-voile{position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(180deg,
            rgba(6,6,10,.84) 0%, rgba(6,6,10,.36) 14%, rgba(6,6,10,0) 30%,
            rgba(6,6,10,.55) 54%, rgba(6,6,10,.94) 74%, #06060A 100%);}
        /* LA DEUXIEME ETAPE PORTE DEUX VIGNETTES ET UNE FICHE : elle a besoin
           de plus de fond, donc le voile monte. */
        .pt-e2 .pt-voile{background:linear-gradient(180deg,
            rgba(6,6,10,.86) 0%, rgba(6,6,10,.6) 14%, rgba(6,6,10,.7) 30%,
            rgba(6,6,10,.9) 46%, #06060A 62%, #06060A 100%);}

        /* ═══ LA COQUE ════════════════════════════════════════════════════ */
        .pt-haut{position:relative;z-index:3;flex:none;
          display:flex;align-items:center;gap:10px;
          padding:calc(8px + var(--ap-encoche,0px)) 14px 0;}
        .pt-retour{flex:none;width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);}
        .pt-retour svg{width:19px;height:19px;fill:none;stroke:currentColor;
          stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
        .pt-retour:active{transform:scale(.92);}
        .pt-logo{margin:0;flex:none;font-weight:900;
          font-size:clamp(23px,min(6.8vw,3.4vh),31px);line-height:1;
          letter-spacing:-.03em;text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .pt-logo b{color:#fff;font-weight:900;}
        .pt-logo i{font-style:normal;color:#FF2E9A;font-weight:900;}
        .pt-pas{flex:1 1 auto;position:relative;
          display:flex;align-items:center;justify-content:center;gap:0;}
        .pt-pas s{width:11px;height:11px;border-radius:50%;text-decoration:none;
          background:rgba(255,255,255,.22);flex:none;
          box-shadow:0 0 0 1.5px rgba(255,255,255,.3) inset;}
        .pt-pas s+s{margin-left:20px;}
        .pt-pas s+s::before{content:"";position:absolute;width:20px;height:2.5px;
          margin:4px 0 0 -20px;background:rgba(255,255,255,.22);}
        .pt-pas s.on{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.8);}
        .pt-pas s.on+s.on::before{background:#FF2E9A;}
        .pt-pas em{position:absolute;top:100%;margin-top:3px;font-style:normal;
          font-size:12.5px;font-weight:850;text-shadow:0 1px 8px rgba(0,0,0,.8);}
        .pt-f{flex:none;width:clamp(46px,min(12.5vw,6.2vh),62px);height:auto;
          filter:drop-shadow(0 0 16px rgba(196,132,255,.65));}

        .pt-lieu{position:relative;z-index:3;flex:none;align-self:flex-start;
          display:flex;align-items:center;gap:10px;
          margin:12px 0 0 14px;padding:6px;border-radius:999px;
          background:rgba(12,10,16,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          max-width:calc(100% - 28px);}
        .pt-lieu-v{flex:none;width:42px;height:42px;border-radius:50%;
          background-size:cover;background-position:center;
          border:1.5px solid rgba(255,255,255,.4);}
        .pt-lieu-t{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .pt-lieu-t b{font-size:14px;font-weight:900;letter-spacing:-.015em;
          line-height:1.14;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pt-lieu-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:11.5px;font-weight:750;color:rgba(255,255,255,.76);
          white-space:nowrap;}
        .pt-lieu-t i{font-style:normal;font-size:10px;flex:none;}
        .pt-sortir{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);}
        .pt-sortir svg{width:17px;height:17px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .pt-sortir:active{transform:scale(.92);}

        /* LA BULLE DU FANTOME, sur la photo, en haut a gauche : c'est sa
           maquette de la premiere etape, et c'est la seule place ou elle ne
           couvre ni le plat ni un bouton. */
        .pt-dit{position:absolute;left:14px;top:calc(92px + var(--ap-encoche,0px));
          z-index:4;display:flex;align-items:center;gap:0;max-width:74%;}
        .pt-dit-f{flex:none;width:clamp(58px,17vw,74px);height:auto;
          filter:drop-shadow(0 0 16px rgba(196,132,255,.7));}
        .pt-dit p{position:relative;margin:0 0 14px -6px;padding:9px 15px;
          border-radius:999px;font-size:clamp(14px,4.2vw,17px);font-weight:850;
          letter-spacing:-.01em;color:#fff;
          background:rgba(12,10,16,.86);
          border:1.5px solid rgba(255,46,154,.75);
          box-shadow:0 0 22px -8px rgba(255,46,154,.95);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}

        /* ═══ CE QUI CHANGE : LE BAS DE L'ECRAN ══════════════════════════ */
        .pt-bas{position:relative;z-index:3;margin-top:auto;width:100%;
          padding:0 16px calc(14px + var(--ap-bas,0px));text-align:center;}
        /* LA DEUXIEME ETAPE COMMENCE PLUS HAUT : elle porte deux vignettes. */
        .pt-bas.pt-haute{margin-top:0;padding-top:10px;}
        .pt-t{position:relative;margin:0;
          font-size:clamp(26px,min(8.2vw,4.2vh),36px);
          font-weight:900;line-height:1.05;letter-spacing:-.03em;
          text-shadow:0 2px 16px rgba(0,0,0,.9);}
        .pt-t em{font-style:normal;color:#FF2E9A;}
        .pt-t s{display:block;width:62%;height:4px;margin:7px auto 0;
          border-radius:99px;text-decoration:none;
          background:linear-gradient(90deg,rgba(255,46,154,0),#FF2E9A 22%,
            #FF2E9A 78%,rgba(255,46,154,0));}
        .pt-sous{margin:6px 0 0;font-size:14.5px;font-weight:750;
          color:rgba(255,255,255,.86);text-shadow:0 1px 10px rgba(0,0,0,.9);}
        /* LE PRIX EN GROS, comme sur sa maquette : c'est la deuxieme chose
           qu'on regarde apres le plat, et la seule qui decide. */
        .pt-prix{margin:6px 0 0;font-size:clamp(34px,min(10vw,5vh),46px);
          font-weight:900;letter-spacing:-.04em;line-height:1;
          text-shadow:0 2px 18px rgba(0,0,0,.9);}

        /* ═══ 2/4 · LES DEUX VUES DU PLAT ═══════════════════════════════ */
        .pt-deux-photos{display:flex;flex-direction:column;gap:9px;
          margin:12px 0 0;}
        .pt-vue{position:relative;border-radius:18px;overflow:hidden;
          text-align:left;
          border:1.5px solid rgba(255,46,154,.5);
          box-shadow:0 0 24px -12px rgba(255,46,154,.85);}
        .pt-vue>div{aspect-ratio:1 / .52;background-size:cover;
          background-position:center 46%;}
        .pt-vue>span{position:absolute;left:0;right:0;bottom:0;
          display:flex;flex-direction:column;gap:1px;padding:26px 13px 11px;
          background:linear-gradient(180deg,rgba(6,6,10,0),rgba(6,6,10,.94));}
        .pt-vue b{font-size:clamp(15px,4.4vw,18px);font-weight:900;
          letter-spacing:-.02em;line-height:1.12;}
        .pt-vue u{text-decoration:none;font-size:12px;font-weight:700;
          color:rgba(255,255,255,.76);}
        .pt-vue em{position:absolute;right:13px;bottom:11px;font-style:normal;
          font-size:clamp(17px,5vw,21px);font-weight:900;letter-spacing:-.02em;
          color:#FFD233;text-shadow:0 1px 8px rgba(0,0,0,.9);}

        /* ═══ 3/4 · SA PHRASE ═══════════════════════════════════════════ */
        .pt-mot{position:relative;margin:13px 0 0;padding:13px 16px 14px 34px;
          border-radius:18px;text-align:left;
          font-size:clamp(15px,4.5vw,18px);font-weight:800;font-style:italic;
          line-height:1.28;letter-spacing:-.015em;
          background:rgba(12,10,16,.78);
          border:1.5px solid rgba(255,46,154,.55);
          box-shadow:0 0 24px -10px rgba(255,46,154,.8);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .pt-mot i{position:absolute;left:12px;top:10px;font-style:normal;
          font-size:30px;line-height:1;color:#FF2E9A;}
        /* LA PLACE VIDE DU LECTEUR : elle DIT qu'il manque quelque chose, au
           lieu de dessiner un bouton qui ne joue rien. Voir le champ extrait
           de la voix, dans apercu-habitant. */
        .pt-attente{margin:9px 0 0;font-size:12px;font-weight:700;
          color:rgba(255,255,255,.55);}
        .pt-audio{display:block;width:100%;margin:11px 0 0;}

        /* ═══ 4/4 · CE QU'IL FAUT SAVOIR ════════════════════════════════ */
        .pt-pratique{list-style:none;display:flex;flex-wrap:wrap;
          justify-content:center;gap:6px;margin:11px 0 0;padding:0;}
        .pt-pratique li{padding:5px 11px;border-radius:999px;
          font-size:11.5px;font-weight:800;color:rgba(255,255,255,.84);
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.14);}
        .pt-motfiche{margin:8px 0 0;font-size:13.5px;font-weight:750;
          font-style:italic;color:rgba(255,255,255,.8);
          text-shadow:0 1px 10px rgba(0,0,0,.9);}
        .pt-note{margin:7px 0 0;font-size:11px;font-weight:700;
          color:rgba(255,255,255,.5);}

        /* ═══ LA FICHE DU RESTAURANT, AUX QUATRE ETAPES ═════════════════ */
        .pt-fiche{display:flex;align-items:center;gap:12px;width:100%;
          margin:12px 0 0;padding:9px 13px;border-radius:16px;text-align:left;
          background:rgba(20,18,26,.74);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .pt-fiche-v{flex:none;width:48px;height:48px;border-radius:12px;
          background-size:cover;background-position:center;}
        .pt-fiche-t{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px;}
        .pt-fiche-t b{font-size:15px;font-weight:900;letter-spacing:-.015em;
          line-height:1.16;}
        .pt-fiche-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:12.5px;font-weight:750;color:rgba(255,255,255,.76);}
        .pt-fiche-t i{font-style:normal;font-size:10px;}
        .pt-fiche-p{flex:none;font-size:clamp(18px,5.4vw,23px);font-weight:900;
          letter-spacing:-.02em;}

        /* ═══ LES DEUX BOUTONS, IDENTIQUES AUX AUTRES PARCOURS ══════════ */
        .pt-go{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:13px 0 0;padding:15px 18px;
          font:inherit;font-size:clamp(16px,4.8vw,19px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;text-decoration:none;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.85),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .pt-go:active{transform:scale(.98);}
        .pt-ico{width:23px;height:23px;flex:none;fill:none;
          stroke:currentColor;stroke-width:1.7;
          stroke-linecap:round;stroke-linejoin:round;}
        .pt-deux{display:flex;align-items:center;justify-content:center;gap:9px;
          width:100%;margin:9px 0 0;padding:13px 18px;
          font:inherit;font-size:15px;font-weight:850;color:#fff;
          cursor:pointer;text-decoration:none;
          border-radius:999px;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,46,154,.55);}
        .pt-deux:active{transform:scale(.98);}
        .pt-deux s{text-decoration:none;}

        /* SUR UN PETIT TELEPHONE, LE BAS SE SERRE — mesure faite etape par
           etape, comme pour la sortie. */
        @media (max-height: 800px){
          .pt-vue>div{aspect-ratio:1 / .46;}
          .pt-deux-photos{gap:7px;margin-top:9px;}
          .pt-fiche{margin-top:9px;padding:8px 12px;}
          .pt-go{margin-top:10px;padding:13px 16px;}
          .pt-deux{margin-top:7px;padding:11px 16px;}
          .pt-mot{margin-top:10px;padding:11px 14px 12px 32px;}
        }
      `,
      }}
    />
  );
}
