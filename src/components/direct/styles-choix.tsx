/**
 * 🎨 LA FEUILLE DE L'ÉCRAN DE DÉPART — voir `ecran-choix.tsx`.
 *
 * ═══ POURQUOI ELLE EST DANS SON PROPRE FICHIER ═════════════════════════════
 *
 * L'écran de l'aperçu habitant porte déjà dix-neuf mille lignes. Celui-ci est
 * un écran entier, avec sa typographie, son paquet de cartes en perspective et
 * sa barre de catégories : le poser là-dedans aurait rendu les deux illisibles.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES. La feuille est servie
 * dans un litteral de gabarit ; un accent grave le referme au milieu et la
 * construction casse sans dire ou. Voir `scripts/verifier-styles-en-ligne.mjs`,
 * qui refuse ce fichier si l'un s'y glisse.
 */
export function StylesChoix() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ═══ LE CADRE ════════════════════════════════════════════════════
           PLEIN ECRAN ET SANS DEFILEMENT. Tout tient dans la hauteur du
           telephone : c'est un ecran de choix, pas une page. Les tailles sont
           donc exprimees en parts de la hauteur disponible la ou ca compte —
           sans quoi la barre des categories sort de l'ecran sur un petit
           telephone, et c'est elle qui porte toute la navigation. */
        .cx{position:absolute;inset:0;z-index:30;overflow:hidden;
          display:flex;flex-direction:column;align-items:center;
          padding:calc(10px + var(--ap-encoche,0px)) 0 8px;
          background:
            radial-gradient(120% 55% at 50% 0%, #1A0F1E 0%, #08070C 58%),
            #06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;
          color:#fff;text-align:center;
          -webkit-user-select:none;user-select:none;touch-action:pan-y;}

        /* ═══ LE LOGO ET SA LIGNE ═════════════════════════════════════════
           « Clik » en blanc, « Me » en magenta : c'est le logo de sa maquette,
           et il est ecrit en texte et non en image. Une image de mot se
           crenelle sur un ecran dense et ne suit pas la police du produit. */
        .cx-tete{flex:none;}
        .cx-logo{margin:0;font-weight:900;font-size:clamp(30px,8.6vw,38px);
          line-height:1;letter-spacing:-.03em;}
        .cx-logo b{font-weight:900;color:#fff;}
        .cx-logo i{font-style:normal;font-weight:900;color:#FF2E9A;}
        .cx-sur{margin:5px 0 0;font-size:10.5px;font-weight:800;
          letter-spacing:.24em;text-transform:uppercase;color:#B8BDD4;
          display:flex;align-items:center;justify-content:center;gap:7px;}
        .cx-sur s{text-decoration:none;color:#FF2E9A;letter-spacing:0;}

        /* ═══ LA QUESTION ═════════════════════════════════════════════════
           DEUX COULEURS ET UN TRAIT. Le trait est un element, pas un
           soulignement : un soulignement de texte passe sous les jambages et se
           casse sous les accents, celui-ci reste droit et deborde du mot comme
           sur ses maquettes. */
        .cx-titre{margin:clamp(10px,2.4vh,18px) 0 0;padding:0 14px;
          font-weight:900;font-size:clamp(28px,9.4vw,42px);line-height:1.02;
          letter-spacing:-.025em;text-transform:uppercase;
          text-shadow:0 2px 18px rgba(0,0,0,.6);}
        .cx-titre em{position:relative;font-style:normal;color:#FF2E9A;
          white-space:nowrap;}
        .cx-titre em s{position:absolute;left:-2%;right:-2%;bottom:-.14em;
          height:.09em;border-radius:999px;background:#FF2E9A;
          box-shadow:0 0 14px rgba(255,46,154,.75);}

        /* ═══ LE FANTOME ET SA BULLE ══════════════════════════════════════ */
        .cx-dit{flex:none;display:flex;align-items:center;justify-content:center;
          gap:2px;margin:clamp(10px,2.2vh,16px) 0 0;padding:0 12px;width:100%;}
        .cx-f{flex:none;width:clamp(62px,17vw,80px);height:auto;
          filter:drop-shadow(0 0 16px rgba(196,132,255,.55));}
        .cx-bulle{position:relative;margin:0;text-align:left;
          padding:9px 13px;border-radius:14px;
          font-size:clamp(12px,3.5vw,14.5px);font-weight:650;line-height:1.3;
          color:#F2E9FF;background:rgba(40,8,32,.72);
          border:1.5px solid #FF2E9A;
          box-shadow:0 0 18px rgba(255,46,154,.32);}
        .cx-bulle s{text-decoration:none;color:#FF2E9A;font-weight:900;}
        /* LA POINTE : un carre tourne, pose sur le bord gauche et coupe par
           lui. Le fond le traverse sans raccord visible. */
        .cx-bulle::before{content:"";position:absolute;left:-6px;top:50%;
          width:11px;height:11px;transform:translateY(-50%) rotate(45deg);
          background:rgba(40,8,32,.72);
          border-left:1.5px solid #FF2E9A;border-bottom:1.5px solid #FF2E9A;}

        /* ═══ LE PAQUET ═══════════════════════════════════════════════════
           LA SCENE EST EN PERSPECTIVE, les cartes tournent dedans. C'est ce qui
           donne les deux voisines inclinees de ses maquettes ; sans
           perspective, une rotation sur Y aplatit la carte au lieu de
           l'eloigner.

           ELLE OCCUPE CE QUI RESTE. flex:1 lui donne toute la hauteur libre
           entre la bulle et le bouton, donc les cartes grandissent sur un grand
           telephone au lieu de laisser un trou. */
        .cx-scene{flex:1 1 auto;position:relative;width:100%;min-height:0;
          margin-top:clamp(8px,1.8vh,14px);
          perspective:1100px;perspective-origin:50% 50%;
          cursor:grab;}
        .cx-scene:active{cursor:grabbing;}

        /* CHAQUE CARTE EST PLACEE PAR SON ECART AU CENTRE. --cx-ecart vaut -1,
           0 ou 1 ; --cx-dx est le deplacement du doigt. Les deux se combinent
           dans une seule transformation, donc les trois cartes suivent la main
           ensemble et gardent leurs positions relatives. */
        /* ELLE PREND TOUTE LA HAUTEUR DE LA SCENE, et sa largeur en decoule. C'est
           l'inverse qui laissait un trou : une largeur en parts de l'ecran donnait
           une hauteur fixe, et sur un grand telephone la scene restait a moitie
           vide entre la bulle et les points. Le rapport 1:1,42 est celui de ses
           maquettes, mesure sur la carte du centre. */
        .cx-carte{position:absolute;top:50%;left:50%;
          height:100%;aspect-ratio:1 / 1.42;width:auto;max-width:66vw;
          border-radius:20px;overflow:hidden;
          background:#12121A;border:0;padding:0;margin:0;
          transform-style:preserve-3d;
          /* --cx-ecart vaut -1, 0 ou 1 ; --cx-dx est le deplacement du doigt.
             L'ecart sert trois fois : il pousse, il reduit et il incline. Les
             deux voisines sortent donc de l'ecran en s'eloignant, comme sur ses
             maquettes, au lieu de glisser a plat. */
          transform:
            translate(-50%,-50%)
            translateX(calc(var(--cx-dx,0px) + var(--cx-ecart,0) * 88%))
            scale(calc(1 - .22 * max(var(--cx-ecart,0), 0 - var(--cx-ecart,0))))
            rotateY(calc(var(--cx-ecart,0) * -21deg));
          transition:transform .28s cubic-bezier(.22,.9,.3,1),
            opacity .28s ease, box-shadow .28s ease;}
        /* PENDANT LE GESTE, PAS DE TRANSITION. Sinon la carte court apres le
           doigt avec un quart de seconde de retard, et le geste parait mou. */
        .cx-scene:active .cx-carte{transition:none;}
        .cx-carte.au-centre{z-index:3;
          box-shadow:0 26px 60px -18px rgba(0,0,0,.9),
            0 0 0 1.5px rgba(255,255,255,.14);}
        .cx-carte.de-cote{z-index:1;cursor:pointer;
          box-shadow:0 18px 40px -20px rgba(0,0,0,.85);}
        .cx-photo{position:absolute;inset:0;background-size:cover;
          background-position:center;}
        /* LE VOILE NE COUVRE QUE LE BAS, la ou le texte se pose. Un voile sur
           toute la carte eteindrait la photo, qui est ce qu'on vient regarder. */
        .cx-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,
            rgba(0,0,0,.34) 0%, rgba(0,0,0,0) 26%,
            rgba(6,6,10,.22) 52%, rgba(6,6,10,.86) 82%, rgba(6,6,10,.96) 100%);}
        .cx-carte.de-cote .cx-photo{filter:brightness(.78);}

        .cx-demo{position:absolute;top:8px;left:8px;z-index:2;
          padding:3px 8px;border-radius:999px;
          font-size:8.5px;font-weight:800;letter-spacing:.02em;
          color:#fff;background:rgba(255,46,154,.92);
          box-shadow:0 2px 10px rgba(0,0,0,.45);}

        .cx-bas{position:absolute;left:0;right:0;bottom:0;z-index:2;
          padding:0 13px 13px;text-align:left;}
        .cx-bas h2{margin:0;font-size:clamp(17px,4.9vw,22px);font-weight:900;
          line-height:1.1;letter-spacing:-.02em;color:#fff;
          text-shadow:0 1px 3px rgba(0,0,0,.9),0 3px 14px rgba(0,0,0,.7);
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .cx-quoi{margin:2px 0 0;font-size:12px;font-weight:650;line-height:1.25;
          color:rgba(255,255,255,.82);
          text-shadow:0 1px 3px rgba(0,0,0,.9);
          display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;
          overflow:hidden;}
        .cx-ligne{display:flex;align-items:center;gap:8px;margin-top:7px;
          min-width:0;}
        .cx-prix{flex:none;font-size:clamp(16px,4.6vw,20px);font-weight:900;
          letter-spacing:-.02em;color:#FFD233;
          text-shadow:0 1px 3px rgba(0,0,0,.9);}
        .cx-vign{flex:none;width:28px;height:28px;border-radius:50%;
          background-size:cover;background-position:center;
          border:1.5px solid rgba(255,255,255,.55);}
        .cx-ou{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .cx-ou em{font-style:normal;font-size:11.5px;font-weight:750;
          color:rgba(255,255,255,.88);white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;
          text-shadow:0 1px 3px rgba(0,0,0,.9);
          display:flex;align-items:center;gap:4px;}
        .cx-ou i{font-style:normal;font-size:10px;}

        /* LES FLECHES SONT POSEES SUR LES BORDS DE LA CARTE DU CENTRE, comme
           sur sa maquette coiffure. Elles ne portent pas le geste — le doigt le
           fait — elles le DISENT, ce qu'une carte immobile ne sait pas faire. */
        .cx-fl{position:absolute;top:50%;z-index:4;transform:translateY(-50%);
          width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;font-size:22px;font-weight:700;line-height:1;
          color:#fff;cursor:pointer;
          background:rgba(20,6,18,.82);border:1.5px solid #FF2E9A;
          box-shadow:0 0 16px rgba(255,46,154,.4);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* LE CADRE INVISIBLE DES FLECHES : meme hauteur, meme rapport et meme
           centre que la carte du centre. Il n'a ni fond ni bord, et il laisse
           passer le doigt — seules les fleches le reprennent. C'est ce qui
           permet aux fleches de suivre une largeur que CSS ne sait pas calculer
           depuis la scene. */
        .cx-bords{position:absolute;top:50%;left:50%;z-index:4;
          transform:translate(-50%,-50%);
          height:100%;aspect-ratio:1 / 1.42;width:auto;max-width:66vw;
          pointer-events:none;}
        .cx-fl{pointer-events:auto;}
        .cx-fl.g{left:-17px;}
        .cx-fl.d{right:-17px;}
        .cx-fl:active{transform:translateY(-50%) scale(.92);}

        .cx-points{flex:none;display:flex;gap:6px;
          margin:clamp(8px,1.6vh,12px) 0 0;}
        .cx-points s{width:18px;height:4px;border-radius:999px;
          text-decoration:none;background:rgba(255,255,255,.22);
          transition:background .2s ease,width .2s ease;}
        .cx-points s.on{width:26px;background:#FF2E9A;
          box-shadow:0 0 10px rgba(255,46,154,.7);}

        /* ═══ LE GRAND BOUTON ═════════════════════════════════════════════
           IL NE MENE NULLE PART POUR L'INSTANT, et c'est sa reponse. Il a donc
           l'habit du geste principal et pas encore sa destination — voir
           .cx-bientot, qui le dit apres l'appui. */
        .cx-go{flex:none;width:min(92%,420px);
          margin:clamp(10px,2vh,16px) 0 0;padding:15px 18px;
          display:flex;align-items:center;justify-content:center;gap:11px;
          font:inherit;font-size:clamp(15px,4.4vw,18px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.8),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .cx-go img{width:30px;height:auto;flex:none;
          filter:drop-shadow(0 2px 5px rgba(0,0,0,.4));}
        .cx-go s{text-decoration:none;font-size:1.05em;}
        .cx-go:active{transform:scale(.98);}
        .cx-bientot{flex:none;margin:7px 0 0;font-size:11.5px;font-weight:700;
          color:#E7A8CF;}

        /* ═══ LES CINQ CATEGORIES ═════════════════════════════════════════
           LE CARRE ACTIF EST UN NEON, pas un fond plein : c'est ce que montrent
           les cinq maquettes, et ca laisse voir le pictogramme au lieu de le
           poser sur une pastille. */
        .cx-cats{flex:none;width:100%;
          display:grid;grid-template-columns:repeat(5,1fr);
          gap:2px;padding:clamp(8px,1.8vh,14px) 6px 0;}
        .cx-cats button{display:flex;flex-direction:column;align-items:center;
          gap:6px;font:inherit;font-size:11px;font-weight:750;cursor:pointer;
          color:#9BA3BF;background:none;border:0;padding:0;
          transition:color .16s ease;}
        .cx-picto{width:clamp(44px,13vw,54px);height:clamp(44px,13vw,54px);
          display:flex;align-items:center;justify-content:center;
          border-radius:15px;
          background:rgba(255,255,255,.045);
          border:1.5px solid rgba(255,255,255,.09);
          transition:border-color .16s ease,box-shadow .16s ease,
            background .16s ease;}
        .cx-picto svg{width:56%;height:56%;fill:none;stroke:currentColor;
          stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
        .cx-cats button.on{color:#fff;}
        .cx-cats button.on .cx-picto{color:#FF2E9A;
          background:rgba(255,46,154,.10);
          border-color:#FF2E9A;
          box-shadow:0 0 16px rgba(255,46,154,.55),
            0 0 22px rgba(255,46,154,.25) inset;}
        .cx-cats button:active .cx-picto{transform:scale(.94);}

        /* LA SORTIE DE SECOURS. Petite, en bas, parce que ce n'est pas le geste
           de l'ecran : c'est ce qui evite que la demonstration soit un
           cul-de-sac tant que le grand bouton ne mene nulle part. */
        .cx-passer{flex:none;margin:clamp(6px,1.4vh,10px) 0 0;padding:6px 12px;
          font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
          color:rgba(255,255,255,.5);background:none;border:0;
          text-decoration:underline;text-underline-offset:3px;}
        .cx-passer:active{color:rgba(255,255,255,.8);}

        /* SUR UN TELEPHONE COURT, le fantome et sa bulle sont ce qui se coupe
           en premier : ils expliquent un geste que la carte montre deja. */
        @media (max-height:680px){
          .cx-dit{display:none;}
          .cx-titre{font-size:clamp(24px,8vw,32px);}
        }
        @media (prefers-reduced-motion:reduce){
          .cx-carte{transition:none;}
        }
      `,
      }}
    />
  );
}
