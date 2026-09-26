/**
 * 🎨 LA FEUILLE DU PARCOURS COIFFURE — voir `parcours-coiffure-ecran.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * `scripts/verifier-styles-en-ligne.mjs`.
 *
 * SA COQUE TIENT EN TROIS OBJETS FIXES — le logo et la frise en haut, la
 * pastille du salon sous eux, le fantome a droite — et une photo qui prend tout
 * le reste. Les quatre etapes ne changent que ce qui est EN BAS de la photo.
 */
export function StylesParcoursCoiffure() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pc{position:absolute;inset:0;z-index:40;overflow:hidden;
          display:flex;flex-direction:column;
          background:#06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;color:#fff;
          -webkit-user-select:none;user-select:none;}
        .pc-fond{position:absolute;inset:0;background-size:cover;
          background-position:center 12%;}
        /* LA COPIE QUI REMPLIT : floue, sombre, elle ne sert que de fond. */
        .pc-fond.flou{filter:blur(26px) brightness(.5) saturate(1.1);
          transform:scale(1.14);}
        /* LA PHOTO ENTIERE : contenue, donc jamais rognee, et posee au-dessus
           du tiers haut ou se trouvent les cheveux. */
        .pc-fond.entier{background-size:contain;background-repeat:no-repeat;
          background-position:center 26%;}
        /* LE VOILE NE COUVRE QUE LE BAS ET LE TOUT EN HAUT : le milieu, c'est le
           visage, et c'est ce qu'on vient regarder. */
        .pc-voile{position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(180deg,
            rgba(6,6,10,.82) 0%, rgba(6,6,10,.34) 15%, rgba(6,6,10,0) 32%,
            rgba(6,6,10,.5) 58%, rgba(6,6,10,.93) 78%, #06060A 100%);}

        /* ═══ LA COQUE ════════════════════════════════════════════════════ */
        .pc-haut{position:relative;z-index:3;flex:none;
          display:flex;align-items:center;gap:10px;
          padding:calc(8px + var(--ap-encoche,0px)) 14px 0;}
        .pc-logo{margin:0;flex:none;font-weight:900;
          font-size:clamp(24px,min(7.2vw,3.5vh),32px);line-height:1;
          letter-spacing:-.03em;text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .pc-logo b{color:#fff;font-weight:900;}
        .pc-logo i{font-style:normal;color:#FF2E9A;font-weight:900;}
        /* LA FRISE ET SON CHIFFRE, au milieu : quatre ronds relies par un trait,
           comme sur ses quatre maquettes. Le rond se remplit, le trait aussi. */
        .pc-pas{flex:1 1 auto;position:relative;
          display:flex;align-items:center;justify-content:center;gap:0;}
        .pc-pas s{width:11px;height:11px;border-radius:50%;text-decoration:none;
          background:rgba(255,255,255,.22);flex:none;
          box-shadow:0 0 0 1.5px rgba(255,255,255,.3) inset;}
        .pc-pas s+s{margin-left:20px;}
        .pc-pas s+s::before{content:"";position:absolute;width:20px;height:2.5px;
          margin:4px 0 0 -20px;background:rgba(255,255,255,.22);}
        .pc-pas s.on{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.8);}
        .pc-pas s.on+s.on::before{background:#FF2E9A;}
        .pc-pas em{position:absolute;top:100%;margin-top:3px;font-style:normal;
          font-size:12.5px;font-weight:850;text-shadow:0 1px 8px rgba(0,0,0,.8);}
        .pc-f{flex:none;width:clamp(48px,min(13vw,6.4vh),64px);height:auto;
          filter:drop-shadow(0 0 16px rgba(255,46,154,.65));}

        /* ═══ LE FANTOME EST LA PORTE DE L'ACCUEIL ══════════════════════
           Il etait deja a cette place sur les quatre ecrans : lui donner la
           fonction evite d'ajouter une sixieme icone a un en-tete qui en porte
           trois. Ce qui manquait pour qu'on le comprenne, c'est que ca se
           voie — d'ou la petite maison posee sur son epaule. */
        .pc-accueil{position:relative;flex:none;padding:0;border:0;
          background:none;font:inherit;cursor:pointer;line-height:0;
          border-radius:999px;}
        .pc-accueil:active{transform:scale(.94);}
        .pc-accueil:focus-visible{outline:2px solid #FF2E9A;outline-offset:3px;}
        .pc-accueil-m{position:absolute;right:-2px;bottom:-2px;
          width:22px;height:22px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:#06060A;background:#FF2E9A;
          box-shadow:0 2px 10px rgba(255,46,154,.55);}
        .pc-accueil-m svg{width:12px;height:12px;fill:none;stroke:currentColor;
          stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}

        /* CHEZ QUI, DANS LE BLOC DU BAS. La pastille qui le disait en
           permanence tombait sur le visage ; ici la ligne ne recouvre rien. */
        .pc-chez{margin:8px 0 0;font-size:13.5px;font-weight:750;
          color:rgba(255,255,255,.82);display:flex;align-items:center;gap:6px;
          flex-wrap:wrap;}
        .pc-chez b{color:#FF2E9A;font-weight:900;}
        .pc-chez i{font-style:normal;font-size:11px;}

        /* ═══ CE QUI CHANGE : LE BAS DE L'ECRAN ══════════════════════════ */
        .pc-bas{position:relative;z-index:3;margin-top:auto;
          padding:0 16px calc(14px + var(--ap-bas,0px));text-align:center;}
        .pc-t{margin:0;font-size:clamp(26px,min(8.2vw,4.2vh),36px);
          font-weight:900;line-height:1.05;letter-spacing:-.03em;
          text-shadow:0 2px 16px rgba(0,0,0,.85);}
        .pc-t.court{font-size:clamp(23px,min(7vw,3.6vh),31px);}
        .pc-t em{font-style:normal;color:#FF2E9A;}
        .pc-sous{margin:6px 0 0;font-size:15px;font-weight:750;
          color:rgba(255,255,255,.88);text-shadow:0 1px 10px rgba(0,0,0,.85);}
        /* L'ANNONCE DU JOUR, sous la coupe : c'est elle qui dit pourquoi
           maintenant. Discrete, parce que ce n'est pas ce qu'on essaie. */
        .pc-annonce{margin:5px 0 0;display:inline-block;padding:5px 12px;
          border-radius:999px;font-size:12.5px;font-weight:800;color:#FFD9EC;
          background:rgba(255,46,154,.16);border:1px solid rgba(255,46,154,.45);}
        .pc-prix{margin:6px 0 0;font-size:clamp(22px,6.4vw,28px);font-weight:900;
          letter-spacing:-.02em;color:#FFD233;
          text-shadow:0 2px 12px rgba(0,0,0,.85);}
        /* CE QUE FAIT L'ECRAN, EN UNE LIGNE. Elle se lit avant la mention de
           simulation, plus grande qu'elle et moins qu'un titre : c'est une
           explication, pas une accroche. */
        .pc-geste{margin:0 0 4px;font-size:11.5px;font-weight:750;
          line-height:1.25;color:#E9DCF4;text-align:center;
          text-shadow:0 1px 10px rgba(0,0,0,.7);}
        .pc-geste::first-line{color:#fff;}
        .pc-simu{margin:7px 0 0;font-size:12.5px;font-weight:700;
          color:rgba(255,255,255,.6);text-shadow:0 1px 8px rgba(0,0,0,.8);}

        .pc-go{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:13px 0 0;padding:15px 18px;
          font:inherit;font-size:clamp(16px,4.8vw,19px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;text-decoration:none;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.85),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .pc-go:active{transform:scale(.98);}
        .pc-deux{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:10px 0 0;padding:13px 18px;
          font:inherit;font-size:15.5px;font-weight:850;cursor:pointer;
          color:#fff;background:rgba(255,255,255,.04);
          border:1.5px solid rgba(255,255,255,.24);border-radius:999px;}
        .pc-deux:active{transform:scale(.98);}
        .pc-go s,.pc-deux s{text-decoration:none;font-size:1.05em;}
        .pc-i{flex:none;width:23px;height:23px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}

        /* ═══ 2/4 · LA GLISSIERE ════════════════════════════════════════
           ELLE PREND L'ECRAN ENTIER, comme sur sa maquette : la comparaison
           EST l'ecran, elle n'y est pas posee. */
        .pc-gliss{position:absolute;inset:0;touch-action:none;cursor:ew-resize;}
        .pc-g-img{position:absolute;inset:0;background-size:cover;
          background-position:center 12%;}
        /* ON DECOUPE, ON NE REDIMENSIONNE PAS — meme raison que sur le parcours
           mode : redimensionner la boite change le cadrage, et les deux moities
           ne se comparent plus. */
        .pc-g-img.avant{clip-path:inset(0 calc(100% - var(--pc-g,50%)) 0 0);}
        .pc-g-trait{position:absolute;top:0;bottom:0;z-index:2;
          left:var(--pc-g,50%);width:2px;margin-left:-1px;
          background:rgba(255,255,255,.85);
          box-shadow:0 0 14px rgba(255,255,255,.5);}
        .pc-g-et{position:absolute;z-index:3;bottom:30%;padding:9px 18px;
          border-radius:999px;font-size:15px;font-weight:900;color:#fff;
          box-shadow:0 8px 22px -8px rgba(0,0,0,.8);}
        .pc-g-et.g{left:7%;background:rgba(32,30,38,.86);
          border:1px solid rgba(255,255,255,.2);}
        .pc-g-et.d{right:7%;background:#FF2E9A;}

        /* ═══ 3/4 · LES AUTRES COUPES ═══════════════════════════════════ */
        /* ═══ TROIS RANGEES, ET NON TROIS COLONNES ═════════════════════
           MEME CORRECTION QUE DANS LA FEUILLE DE LA MODE, le meme jour et pour
           la meme raison : un tiers de telephone suffit a un lieu, pas a une
           phrase. « J'avais peur que ca fasse trop avec les lunettes » se
           coupait au milieu, et un doute leve a moitie est un doute. */
        .pc-trois{display:flex;flex-direction:column;gap:7px;margin:12px 0 0;}
        .pc-vign{display:flex;gap:9px;border-radius:14px;overflow:hidden;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.16);
          box-shadow:0 10px 26px -12px rgba(0,0,0,.9);}
        /* LE CADRAGE EST HAUT, ET C'EST VOULU : on regarde une coupe, donc des
           cheveux. A la moitie de l'image on aurait montre trois cols. */
        /* ═══ ON VIENT REGARDER DES CHEVEUX ══════════════════════════════
           « Idem etape 3 » — on n'y voyait pas la coupe non plus, et pour une
           raison differente de l'etape 1 : ses photos sont des PLANS ENTIERS,
           tete aux pieds. A soixante-douze points de large, la tete faisait
           treize points de haut. On ne juge pas un degrade sur treize points.
           ON ZOOME SUR LE HAUT. auto 340% agrandit l'image a trois fois et
           demie la hauteur de la case, et center 7% la cale sur la tete : le
           visage et la coupe remplissent enfin la vignette. Le corps est perdu,
           et c'est bien — cet ecran parle de cheveux. */
        .pc-vign>div{flex:none;width:86px;background-repeat:no-repeat;
          background-size:auto 340%;background-position:center 7%;}
        .pc-vign>span{flex:1 1 auto;min-width:0;
          display:flex;flex-direction:column;justify-content:center;gap:1px;
          padding:8px 10px 8px 0;text-align:left;}
        /* QUI PARLE ET COMBIEN ELLE A AIME, aux deux bouts d'une ligne —
           voir le meme bloc dans la feuille de la mode, ecrit le meme jour. */
        .pc-vign-q{display:flex;align-items:center;justify-content:space-between;
          gap:4px;font-style:normal;font-size:9.5px;font-weight:900;
          letter-spacing:.02em;color:#FF7FC2;margin-bottom:1px;}
        /* >span>b ET NON b : la rangee de fantomes est elle aussi un
           <b>, et cette regle lui posait display:-webkit-box — les cinq
           fantomes s'empilaient en colonne. Voir la feuille de la mode. */
        .pc-vign>span>b{font-size:11px;font-weight:800;line-height:1.24;color:#fff;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        /* LE DETAIL DE LA COUPE, sous le lieu. Ces vignettes portaient un prix
           en magenta gras ; elles n'en portent plus, parce que c'est la meme
           coupe que deux ecrans plus haut et qu'un prix repete est un prix qui
           divergera. Ce qui reste se lit comme une legende, pas comme un
           montant. */
        .pc-vign u{text-decoration:none;font-size:8.5px;font-weight:700;
          line-height:1.18;color:rgba(255,255,255,.66);margin-top:2px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        /* ═══ 4/4 · LA FICHE ════════════════════════════════════════════ */
        .pc-fiche{display:flex;align-items:center;gap:12px;width:100%;
          margin:12px 0 0;padding:10px 14px;border-radius:16px;text-align:left;
          background:rgba(20,18,26,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .pc-fiche-v{flex:none;width:52px;height:52px;border-radius:12px;
          background-size:cover;background-position:center 15%;}
        .pc-fiche-t{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px;}
        .pc-fiche-t b{font-size:15px;font-weight:900;letter-spacing:-.015em;
          color:#fff;line-height:1.16;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pc-fiche-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:12px;font-weight:700;color:rgba(255,255,255,.72);
          overflow:hidden;}
        .pc-fiche-t i{font-style:normal;font-size:10px;}
        .pc-fiche-p{flex:none;font-size:clamp(18px,5.2vw,22px);font-weight:900;
          letter-spacing:-.02em;color:#FFD233;}

        @media (prefers-reduced-motion:reduce){
          .pc-go,.pc-deux,.pc-accueil{transition:none;}
        }
      `,
      }}
    />
  );
}
