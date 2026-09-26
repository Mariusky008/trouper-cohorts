/**
 * 🎨 LA FEUILLE DU PARCOURS MODE — voir `parcours-mode-ecran.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * `scripts/verifier-styles-en-ligne.mjs`, qui refuse ce fichier si l'un s'y
 * glisse.
 *
 * LES QUATRE ETAPES PARTAGENT LEUR HABIT : le magenta, la police, le bouton
 * plein, la fiche du commerce. Ce qui change d'une a l'autre est la mise en
 * page, pas le vocabulaire — c'est ce qui fait qu'on reste dans le meme
 * parcours au lieu de traverser quatre ecrans sans rapport.
 */
export function StylesParcoursMode() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pm{position:absolute;inset:0;z-index:40;overflow-y:auto;overflow-x:hidden;
          display:flex;flex-direction:column;
          background:radial-gradient(120% 50% at 50% 0%, #1A0F1E 0%, #08070C 60%), #06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;color:#fff;
          -webkit-user-select:none;user-select:none;}

        /* ═══ LA BARRE DU HAUT ════════════════════════════════════════════
           ELLE FLOTTE SUR LA PREMIERE ETAPE, dont la photo part du bord haut ;
           elle est dans le flux sur les trois autres, qui commencent par du
           texte. Meme barre, deux positions — c'est la page qui change, pas
           elle. */
        .pm-haut{flex:none;display:flex;align-items:center;gap:10px;
          padding:calc(10px + var(--ap-encoche,0px)) 12px 10px;}
        .pm-e1 .pm-haut{position:absolute;left:0;right:0;top:0;z-index:5;}
        .pm-retour{flex:none;width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;font-size:19px;line-height:1;cursor:pointer;color:#fff;
          background:rgba(12,10,16,.72);border:1px solid rgba(255,255,255,.16);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .pm-retour:active{transform:scale(.93);}
        .pm-pas{flex:1 1 auto;display:flex;gap:5px;justify-content:center;}
        .pm-pas s{flex:0 1 34px;height:5px;border-radius:999px;
          text-decoration:none;background:rgba(255,255,255,.2);
          transition:background .2s ease;}
        .pm-pas s.on{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.7);}
        .pm-num{flex:none;font-size:12.5px;font-weight:850;color:#fff;}
        /* LA PORTE VERS L'ACCUEIL. Elle a la forme de la fleche de gauche — meme
           rond, meme fond — parce que ce sont deux gestes de navigation ; elle
           s'en distingue par son dessin, une maison, et pas par son habit. */
        .pm-accueil{flex:none;width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(12,10,16,.72);border:1px solid rgba(255,255,255,.16);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .pm-accueil svg{width:19px;height:19px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .pm-accueil:active{transform:scale(.93);}

        /* ═══ 1/4 · LA PIECE ══════════════════════════════════════════════ */
        .pm-un{position:relative;flex:1 1 auto;min-height:0;display:flex;}
        .pm-photo{position:absolute;inset:0;background-size:cover;
          background-position:center top;}
        .pm-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,
            rgba(6,6,10,.62) 0%, rgba(6,6,10,.12) 22%,
            rgba(6,6,10,0) 40%, rgba(6,6,10,.72) 68%, rgba(6,6,10,.97) 88%);}
        /* DANS LE FLUX, PLUS EN ABSOLU. Pose a 72 points du haut, elle
           tombait sur le visage du modele — voir le commentaire de l'ecran.
           Au-dessus du titre, elle ne peut plus rien recouvrir. */
        .pm-dit{position:relative;z-index:3;margin:0 0 10px;
          display:flex;align-items:flex-start;gap:0;max-width:86%;}
        /* LE FANTOME A GAUCHE, LA BULLE A SA DROITE ET PLUS HAUT, comme sur sa
           maquette : la pointe descend vers lui. */
        .pm-f{width:96px;height:auto;order:1;margin-right:-10px;align-self:flex-end;
          filter:drop-shadow(0 0 18px rgba(196,132,255,.6));}
        .pm-bulle{order:2;position:relative;margin:0 0 34px;
          padding:11px 15px;border-radius:16px;
          font-size:15px;font-weight:750;line-height:1.24;color:#F6ECFF;
          background:rgba(30,10,26,.88);border:1.5px solid #FF2E9A;
          box-shadow:0 0 20px rgba(255,46,154,.35);}
        .pm-bulle::after{content:"";position:absolute;left:16px;bottom:-7px;
          width:13px;height:13px;transform:rotate(45deg);
          background:rgba(30,10,26,.88);
          border-right:1.5px solid #FF2E9A;border-bottom:1.5px solid #FF2E9A;}
        .pm-bas{position:relative;z-index:3;margin-top:auto;width:100%;
          padding:0 16px calc(16px + var(--ap-bas,0px));}
        .pm-titre{margin:0;font-size:clamp(32px,9.6vw,42px);font-weight:900;
          line-height:1.04;letter-spacing:-.03em;
          text-shadow:0 2px 14px rgba(0,0,0,.8);}
        .pm-titre em{font-style:normal;color:#FF2E9A;}
        .pm-prix{margin:4px 0 0;font-size:clamp(26px,7.4vw,32px);font-weight:900;
          letter-spacing:-.02em;text-shadow:0 2px 12px rgba(0,0,0,.8);}
        .pm-chez{margin:4px 0 0;font-size:14.5px;font-weight:700;line-height:1.24;
          color:rgba(255,255,255,.76);text-shadow:0 1px 8px rgba(0,0,0,.8);}
        .pm-chez b{color:#FF2E9A;font-weight:900;}
        .pm-ou{display:inline-flex;align-items:center;gap:8px;margin:11px 0 0;
          padding:9px 15px;border-radius:999px;
          font-size:13.5px;font-weight:750;color:#EDEFF6;
          background:rgba(14,12,20,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .pm-ou i{font-style:normal;font-size:12px;}

        /* ═══ LES DEUX BOUTONS, PARTOUT LES MEMES ════════════════════════ */
        .pm-go{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:14px 0 0;padding:16px 18px;
          font:inherit;font-size:clamp(16px,4.8vw,19px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;text-decoration:none;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.85),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .pm-go:active{transform:scale(.98);}
        .pm-go s{text-decoration:none;font-size:1.05em;}
        .pm-go i{font-style:normal;font-size:1.05em;}
        .pm-go-f{width:32px;height:auto;flex:none;}
        .pm-deux{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:10px 0 0;padding:14px 18px;
          font:inherit;font-size:15.5px;font-weight:850;cursor:pointer;
          color:#fff;text-decoration:none;
          background:rgba(255,255,255,.04);
          border:1.5px solid rgba(255,255,255,.22);border-radius:999px;}
        .pm-deux:active{transform:scale(.98);}
        .pm-deux i{font-style:normal;}
        .pm-cintre,.pm-cabas{flex:none;width:24px;height:24px;display:flex;}
        .pm-cintre svg,.pm-cabas svg{width:100%;height:100%;fill:none;
          stroke:currentColor;stroke-width:1.8;stroke-linecap:round;
          stroke-linejoin:round;}
        .pm-cintre.petit{width:15px;height:15px;color:#FF2E9A;}

        /* ═══ 2/4 · LE RENDU ══════════════════════════════════════════════ */
        .pm-deuxe{flex:1 1 auto;display:flex;flex-direction:column;
          align-items:center;text-align:center;
          padding:0 14px calc(16px + var(--ap-bas,0px));}
        .pm-logo{margin:0;font-weight:900;font-size:clamp(26px,7.6vw,34px);
          line-height:1;letter-spacing:-.03em;}
        .pm-logo b{color:#fff;font-weight:900;}
        .pm-logo i{font-style:normal;color:#FF2E9A;font-weight:900;}
        .pm-sur{margin:3px 0 0;font-size:9.5px;font-weight:800;
          letter-spacing:.22em;text-transform:uppercase;color:#B8BDD4;}
        .pm-sur s{text-decoration:none;color:#FF2E9A;}
        .pm-t2{margin:10px 0 0;font-size:clamp(28px,8.6vw,38px);font-weight:900;
          line-height:1.03;letter-spacing:-.025em;text-transform:uppercase;}
        .pm-t2 em,.pm-t3 em,.pm-t4 em{position:relative;font-style:normal;color:#FF2E9A;}
        .pm-t2 em s,.pm-t3 s,.pm-t4 em s{position:absolute;left:-1%;right:-1%;
          bottom:-.16em;height:.085em;border-radius:999px;background:#FF2E9A;
          box-shadow:0 0 14px rgba(255,46,154,.75);text-decoration:none;}
        .pm-sous{margin:14px 0 0;font-size:15px;font-weight:700;
          color:rgba(255,255,255,.82);}

        .pm-gliss{position:relative;width:100%;margin:12px 0 0;
          aspect-ratio:1 / .92;border-radius:18px;overflow:hidden;
          border:1.5px solid #FF2E9A;
          box-shadow:0 0 26px -6px rgba(255,46,154,.55);
          cursor:ew-resize;touch-action:none;}
        .pm-g-img{position:absolute;inset:0;background-size:cover;
          background-position:center 18%;}
        /* ═══ ON DECOUPE, ON NE REDIMENSIONNE PAS ═════════════════════════
           PREMIERE VERSION : je reduisais la LARGEUR de l'image du dessus. Le
           fond se recalait donc sur une boite qui retrecissait, et les deux
           moities ne montraient plus le meme cadrage — la femme de gauche etait
           plus grande que celle de droite, au milieu de la meme photo. On
           comparait deux tirages au lieu de comparer un avant et un apres.
           CLIP-PATH NE TOUCHE PAS A LA BOITE : l'image garde ses dimensions et
           son cadrage, on en cache simplement la partie droite. Les deux
           moities restent alignees au pixel, quelle que soit la position de la
           poignee. */
        .pm-g-img.avant{width:100%;
          clip-path:inset(0 calc(100% - var(--pm-g,50%)) 0 0);
          border-right:2px solid #FF2E9A;}
        .pm-g-et{position:absolute;top:10px;z-index:2;padding:6px 13px;
          border-radius:999px;font-size:12.5px;font-weight:850;color:#fff;
          transition:opacity .18s ease;}
        .pm-g-et.g{left:10px;background:rgba(20,18,26,.82);
          border:1px solid rgba(255,255,255,.18);}
        .pm-g-et.d{right:10px;background:#FF2E9A;}
        .pm-g-trait{position:absolute;top:50%;z-index:3;
          transform:translate(-50%,-50%);
          width:40px;height:40px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:#FF2E9A;box-shadow:0 0 18px rgba(255,46,154,.8);}
        .pm-g-trait s{text-decoration:none;font-size:17px;font-weight:900;color:#fff;}
        .pm-g-f{position:absolute;left:50%;bottom:-6px;z-index:4;
          width:96px;height:auto;transform:translateX(-50%);
          filter:drop-shadow(0 0 18px rgba(196,132,255,.7));
          pointer-events:none;}

        /* ═══ LA FICHE DU COMMERCE, SUR LES ETAPES 2 ET 3 ════════════════ */
        .pm-fiche{display:flex;align-items:center;gap:12px;width:100%;
          margin:14px 0 0;padding:10px 14px;border-radius:16px;text-align:left;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.1);}
        .pm-fiche-v{flex:none;width:52px;height:52px;border-radius:12px;
          background-size:cover;background-position:center;}
        .pm-fiche-t{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px;}
        /* DEUX LIGNES PLUTOT QU'UN NOM COUPE — c'est la meme mesure que sur la
           barre de l'annonce : nos enseignes font de dix-huit a trente-deux
           signes parce qu'elles sont anonymes, donc descriptives. */
        .pm-fiche-t b{font-size:15px;font-weight:900;letter-spacing:-.015em;
          color:#fff;line-height:1.16;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pm-fiche-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:12.5px;font-weight:700;color:rgba(255,255,255,.7);
          overflow:hidden;}
        .pm-fiche-t i{font-style:normal;font-size:11px;}
        .pm-fiche-p{flex:none;font-size:clamp(19px,5.4vw,23px);font-weight:900;
          letter-spacing:-.02em;color:#fff;}

        .pm-lien{margin:12px 0 0;padding:6px 4px;font:inherit;font-size:14px;
          font-weight:800;cursor:pointer;color:#EDEFF6;background:none;border:0;
          text-decoration:underline;text-underline-offset:5px;
          text-decoration-color:rgba(255,255,255,.35);}
        .pm-lien s{text-decoration:none;}
        .pm-simu{margin:9px 0 0;font-size:11px;font-weight:700;
          color:rgba(255,255,255,.44);}

        /* ═══ 3/4 · LES FACONS ════════════════════════════════════════════ */
        /* LA SECTION REMPLIT CE QUI RESTE, ET SES GESTES TOMBENT EN BAS. Sans
           cela, le bouton s'arretait au milieu de l'ecran et laissait deux
           cents points de noir sous lui — vu a la capture sur les etapes 3 et
           4. Le contenu ne grandit pas ; c'est la marge au-dessus des gestes
           qui absorbe. */
        .pm-troise{flex:1 1 auto;display:flex;flex-direction:column;
          padding:0 14px calc(16px + var(--ap-bas,0px));}
        .pm-troise .pm-fiche{margin-top:auto;}
        /* ═══ LES DEUX BLOCS D'IMAGES SE PARTAGENT LE VIDE ═══════════════════
           MESURE AVANT : 182 points de noir entre les vignettes et la fiche sur
           un iPhone 14, 229 sur un Max — plus haut que les vignettes
           elles-memes. La fiche est collee en bas par une marge haute
           automatique, donc tout ce que les images ne prennent pas devient
           un trou.
           LES DEUX GRANDISSENT, DANS L'ORDRE DE CE QU'ON REGARDE : la piece sur
           la mannequin prend deux parts, les trois facons une. Le rapport de
           forme reste un PLANCHER — sur un petit ecran il n'y a rien a partager
           et la mise en page ne bouge pas. */
        /* ET LE RAPPORT DE FORME A DU PARTIR, SINON IL POUSSE LE TITRE DEHORS.
           Mesure a l'ecran : l'image etiree gardait son 1/1.3, donc plus la
           colonne grandissait en hauteur, plus elle reclamait de LARGEUR — la
           grille cedait et « sur d'autres femmes » sortait du cadre a droite.
           Une hauteur minimale dit la meme chose sans tirer sur la largeur, et
           les deux colonnes sont bornees a zero pour qu'aucune ne deborde. */
        .pm-hero{position:relative;display:grid;
          grid-template-columns:minmax(0,1fr) minmax(0,1fr);
          gap:10px;align-items:center;flex:2 1 auto;min-height:0;}
        .pm-hero-img{border-radius:16px;
          background-size:cover;background-position:center 15%;
          align-self:stretch;min-width:0;min-height:clamp(180px,24vh,250px);}
        .pm-hero-t{text-align:right;}
        .pm-t3{position:relative;margin:0;font-size:clamp(22px,6.6vw,30px);
          font-weight:900;line-height:1.08;letter-spacing:-.025em;}
        .pm-t3 s{left:auto;right:0;width:82%;}
        .pm-dit.petit{position:static;max-width:none;margin-top:16px;
          justify-content:flex-end;}
        .pm-dit.petit .pm-f{width:74px;margin:0 -6px 0 0;}
        .pm-dit.petit .pm-bulle{margin:0 0 26px;font-size:13.5px;}

        .pm-insp{display:flex;align-items:center;gap:7px;margin:16px 0 8px;
          font-size:13px;font-weight:800;color:rgba(255,255,255,.72);}
        .pm-facons{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;
          flex:1 1 auto;min-height:0;margin-bottom:14px;}
        .pm-facon{position:relative;border-radius:14px;overflow:hidden;
          min-height:0;
          border:1.5px solid rgba(255,46,154,.75);
          box-shadow:0 0 16px -6px rgba(255,46,154,.7);}
        /* LE CADRAGE DESCEND AVEC LA HAUTEUR. Ces vignettes montraient un
           visage ; elles montrent maintenant une veste, et une veste se porte
           plus bas qu'un visage. A 20 % on coupait aux epaules. */
        .pm-facon>div{aspect-ratio:1 / 1.42;height:100%;min-height:0;
          background-size:cover;background-position:center 32%;}
        /* LE LIEU PUIS CE QUE LA VESTE COUVRE, sur deux lignes.
           LA HIERARCHIE S'EST INVERSEE AVEC LE CONTENU. Ces vignettes portaient
           un nom de piece et son prix : le prix en magenta gras etait la
           deuxieme ligne, et il devait sauter aux yeux. Elles portent maintenant
           un lieu et une description, et un magenta gras sous « Au bureau »
           ferait lire « Sur un jean noir » comme un montant. Le lieu prend donc
           le gras, la description passe en gris clair. */
        .pm-facon>span{position:absolute;left:0;right:0;bottom:0;
          display:flex;flex-direction:column;gap:1px;padding:20px 7px 7px;
          color:#fff;text-align:left;
          background:linear-gradient(180deg,rgba(6,6,10,0),rgba(6,6,10,.94));}
        .pm-facon b{font-size:11.5px;font-weight:900;line-height:1.16;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pm-facon em{font-style:normal;font-size:9.5px;font-weight:700;
          line-height:1.2;color:rgba(255,255,255,.72);
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}

        /* ═══ 4/4 · LA BOUTIQUE ══════════════════════════════════════════ */
        .pm-quatre{flex:1 1 auto;display:flex;flex-direction:column;
          padding:0 14px calc(16px + var(--ap-bas,0px));}
        .pm-quatre .pm-go{margin-top:auto;}
        .pm-devant{position:relative;border-radius:18px;overflow:hidden;}
        /* PLUS HAUTE QU'ELLE NE L'ETAIT : nos enseignes sont des phrases, pas
           des marques, et « Elle vous attend chez Une boutique de la rue
           pietonne » prend cinq lignes la ou « chez Alba » en prend deux. */
        .pm-devant>div{aspect-ratio:1 / 1.02;background-size:cover;
          background-position:center;}
        .pm-devant::after{content:"";position:absolute;inset:0;
          background:linear-gradient(90deg,rgba(6,6,10,.88) 0%,
            rgba(6,6,10,.5) 52%, rgba(6,6,10,.12) 100%);}
        .pm-t4{position:absolute;left:16px;right:16px;bottom:16px;z-index:2;
          margin:0;font-size:clamp(21px,6.2vw,28px);font-weight:900;
          line-height:1.06;letter-spacing:-.025em;
          text-shadow:0 2px 14px rgba(0,0,0,.85);}
        /* PAS DE TRAIT SOUS UN NOM QUI PASSE A LA LIGNE. Le trait se pose sous
           le DERNIER fragment et depasse des deux cotes : il soulignait
           « pietonne » seul en debordant a gauche. Un nom court le retrouvera
           le jour ou les enseignes seront courtes. */
        .pm-t4 em s{display:none;}

        .pm-panneau{display:flex;gap:12px;margin:14px 0 0;padding:12px;
          border-radius:18px;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,46,154,.55);
          box-shadow:0 0 22px -10px rgba(255,46,154,.6);}
        .pm-pan-v{flex:none;width:38%;border-radius:13px;
          background-size:cover;background-position:center 15%;}
        .pm-pan-t{min-width:0;flex:1 1 auto;}
        .pm-pan-t h2{margin:0;font-size:clamp(18px,5.2vw,22px);font-weight:900;
          letter-spacing:-.02em;line-height:1.1;}
        .pm-pan-t .pm-ou{margin:7px 0 0;padding:0;background:none;border:0;
          color:rgba(255,255,255,.78);-webkit-backdrop-filter:none;
          backdrop-filter:none;}
        .pm-plan{display:inline-flex;align-items:center;gap:7px;margin:10px 0 0;
          padding:8px 13px;border-radius:12px;
          font-size:12.5px;font-weight:800;color:#fff;text-decoration:none;
          background:rgba(255,46,154,.14);border:1px solid rgba(255,46,154,.5);}
        .pm-plan i,.pm-plan s{font-style:normal;text-decoration:none;font-size:11px;}
        .pm-pan-piece{display:flex;align-items:center;gap:9px;margin:11px 0 0;
          padding-top:11px;border-top:1px solid rgba(255,255,255,.1);}
        .pm-pan-piece>span:first-child{flex:none;width:42px;height:42px;
          border-radius:10px;background-size:cover;background-position:center 15%;}
        .pm-pan-piece>span:last-child{min-width:0;display:flex;
          flex-direction:column;gap:2px;}
        .pm-pan-piece b{font-size:13.5px;font-weight:850;color:#fff;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .pm-pan-piece em{font-style:normal;font-size:15px;font-weight:900;
          color:#FF2E9A;}

        @media (prefers-reduced-motion:reduce){
          .pm-go,.pm-deux,.pm-retour{transition:none;}
        }
      `,
      }}
    />
  );
}
