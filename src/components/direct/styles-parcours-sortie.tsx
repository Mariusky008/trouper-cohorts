/**
 * 🎨 LA FEUILLE DU PARCOURS SORTIE — voir `parcours-sortie-ecran.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * `scripts/verifier-styles-en-ligne.mjs`.
 *
 * MEME COQUE QUE LA COIFFURE, ET C'EST VOULU. Logo et frise en haut, pastille
 * du lieu sous eux, fantome a droite, photo derriere tout. Trois parcours qui
 * se ressemblent se lisent comme un produit ; trois parcours differents se
 * lisent comme trois maquettes.
 *
 * CE QUI LUI EST PROPRE : le lecteur de l'etape 2, les trois fantomes de
 * l'etape 3 et le plan dessine de l'etape 4.
 */
export function StylesParcoursSortie() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .ps{position:absolute;inset:0;z-index:40;overflow:hidden;
          display:flex;flex-direction:column;
          background:#06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;color:#fff;
          -webkit-user-select:none;user-select:none;}
        .ps-fond{position:absolute;inset:0;background-size:cover;
          background-position:center 26%;}
        /* LE VOILE EST PLUS APPUYE QUE CELUI DE LA COIFFURE. Un portrait a un
           visage au milieu qu'on protege ; une scene de concert est deja
           sombre et bariolee, et le texte blanc s'y perd sans un fond franc. */
        .ps-voile{position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(180deg,
            rgba(6,6,10,.86) 0%, rgba(6,6,10,.38) 16%, rgba(6,6,10,.06) 34%,
            rgba(6,6,10,.62) 58%, rgba(6,6,10,.95) 76%, #06060A 100%);}

        /* ═══ LA COQUE ════════════════════════════════════════════════════ */
        .ps-haut{position:relative;z-index:3;flex:none;
          display:flex;align-items:center;gap:10px;
          padding:calc(8px + var(--ap-encoche,0px)) 14px 0;}
        .ps-retour{flex:none;width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);}
        .ps-retour svg{width:19px;height:19px;fill:none;stroke:currentColor;
          stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
        .ps-retour:active{transform:scale(.92);}
        .ps-logo{margin:0;flex:none;font-weight:900;
          font-size:clamp(23px,min(6.8vw,3.4vh),31px);line-height:1;
          letter-spacing:-.03em;text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .ps-logo b{color:#fff;font-weight:900;}
        .ps-logo i{font-style:normal;color:#FF2E9A;font-weight:900;}
        .ps-pas{flex:1 1 auto;position:relative;
          display:flex;align-items:center;justify-content:center;gap:0;}
        .ps-pas s{width:11px;height:11px;border-radius:50%;text-decoration:none;
          background:rgba(255,255,255,.22);flex:none;
          box-shadow:0 0 0 1.5px rgba(255,255,255,.3) inset;}
        .ps-pas s+s{margin-left:20px;}
        .ps-pas s+s::before{content:"";position:absolute;width:20px;height:2.5px;
          margin:4px 0 0 -20px;background:rgba(255,255,255,.22);}
        .ps-pas s.on{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.8);}
        .ps-pas s.on+s.on::before{background:#FF2E9A;}
        .ps-pas em{position:absolute;top:100%;margin-top:3px;font-style:normal;
          font-size:12.5px;font-weight:850;text-shadow:0 1px 8px rgba(0,0,0,.8);}
        .ps-f{flex:none;width:clamp(46px,min(12.5vw,6.2vh),62px);height:auto;
          filter:drop-shadow(0 0 16px rgba(255,46,154,.65));}

        .ps-lieu{position:relative;z-index:3;flex:none;align-self:flex-start;
          display:flex;align-items:center;gap:10px;
          margin:12px 0 0 14px;padding:6px;border-radius:999px;
          background:rgba(12,10,16,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          max-width:calc(100% - 28px);}
        .ps-lieu-v{flex:none;width:42px;height:42px;border-radius:50%;
          background-size:cover;background-position:center;
          border:1.5px solid rgba(255,255,255,.4);}
        .ps-lieu-t{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .ps-lieu-t b{font-size:14px;font-weight:900;letter-spacing:-.015em;
          line-height:1.14;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .ps-lieu-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:11.5px;font-weight:750;color:rgba(255,255,255,.76);
          min-width:0;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .ps-lieu-t i{font-style:normal;font-size:10px;flex:none;}
        .ps-sortir{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);}
        .ps-sortir svg{width:17px;height:17px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .ps-sortir:active{transform:scale(.92);}

        /* ═══ CE QUI CHANGE : LE BAS DE L'ECRAN ══════════════════════════ */
        .ps-bas{position:relative;z-index:3;margin-top:auto;width:100%;
          padding:0 16px calc(14px + var(--ap-bas,0px));text-align:center;}
        .ps-t{position:relative;margin:0;
          font-size:clamp(26px,min(8.2vw,4.2vh),36px);
          font-weight:900;line-height:1.05;letter-spacing:-.03em;
          text-shadow:0 2px 16px rgba(0,0,0,.9);}
        .ps-t em{font-style:normal;color:#FF2E9A;}
        /* LE TRAIT SOUS LE TITRE, comme sur ses quatre maquettes : un coup de
           feutre rose sous la derniere ligne, jamais sous tout le bloc. */
        .ps-t s{display:block;width:62%;height:4px;margin:7px auto 0;
          border-radius:99px;text-decoration:none;
          background:linear-gradient(90deg,rgba(255,46,154,0),#FF2E9A 22%,
            #FF2E9A 78%,rgba(255,46,154,0));}
        .ps-t2{margin:2px 0 0;font-size:clamp(28px,min(8.6vw,4.4vh),38px);
          font-weight:900;line-height:1.02;letter-spacing:-.035em;
          text-shadow:0 2px 16px rgba(0,0,0,.9);}
        .ps-t2 em{font-style:normal;color:#FF2E9A;}
        .ps-sous{margin:3px 0 0;font-size:15px;font-weight:750;
          color:rgba(255,255,255,.82);text-shadow:0 1px 10px rgba(0,0,0,.85);}
        .ps-dit{margin:9px 0 0;font-size:14.5px;font-weight:750;
          color:rgba(255,255,255,.8);text-shadow:0 1px 10px rgba(0,0,0,.85);}

        /* LES DEUX LIGNES DE L'AFFICHE — ce qui joue, et ou. Alignees a
           GAUCHE dans un bloc centre : deux lignes centrees sous un titre
           centre font un sapin, et on ne lit plus les deux debuts. */
        .ps-quoi{list-style:none;margin:14px auto 0;padding:0;
          display:flex;flex-direction:column;gap:7px;text-align:left;
          max-width:340px;}
        /* UNE GRILLE, ET PAS UNE RANGEE FLEXIBLE. Mesure a l'ecran : « Kiosque
           du parc Théodore-Denis » passait a la ligne et poussait « · 450 m »
           dans une COLONNE a droite, sur deux lignes a lui tout seul. Avec une
           grille icone + texte, le texte est un seul bloc qui se replie sous
           lui-meme, et la puce reste alignee sur la premiere ligne. */
        .ps-quoi li{display:grid;grid-template-columns:22px minmax(0,1fr);
          align-items:start;gap:9px;
          font-size:clamp(14.5px,4.2vw,17px);font-weight:750;line-height:1.26;
          color:rgba(255,255,255,.9);text-shadow:0 1px 10px rgba(0,0,0,.9);}
        .ps-quoi b{font-weight:900;color:#fff;}
        .ps-quoi i{font-style:normal;font-size:15px;line-height:1.26;
          text-align:center;color:#FF2E9A;}

        /* LE FIL DE L'ETAPE 2 : lieu, puis heure, separes d'un trait fin. */
        .ps-fil{display:flex;align-items:center;justify-content:center;
          flex-wrap:wrap;gap:6px;margin:0 0 4px;
          font-size:13px;font-weight:800;color:rgba(255,255,255,.82);
          text-shadow:0 1px 8px rgba(0,0,0,.9);}
        .ps-fil i{font-style:normal;font-size:11px;}
        .ps-fil s{width:1px;height:13px;margin:0 3px;text-decoration:none;
          background:rgba(255,255,255,.3);}

        /* ═══ 2/4 · LE LECTEUR ══════════════════════════════════════════ */
        .ps-lecteur{margin:14px 0 0;padding:13px 14px 15px;border-radius:20px;
          background:rgba(10,8,14,.72);border:1.5px solid rgba(255,46,154,.55);
          box-shadow:0 0 26px -8px rgba(255,46,154,.6);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .ps-lecteur-t{margin:0 0 11px;font-size:clamp(16px,4.7vw,19px);
          font-weight:850;letter-spacing:-.02em;}
        .ps-lecteur-t b{color:#FF2E9A;font-weight:900;}
        .ps-onde-l{display:flex;align-items:center;gap:11px;}
        .ps-play{flex:none;width:52px;height:52px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;border:0;
          background:linear-gradient(140deg,#FF2E9A,#C23BEF);
          box-shadow:0 10px 26px -8px rgba(255,46,154,.9);
          transition:transform .12s ease;}
        .ps-play:active{transform:scale(.93);}
        .ps-play svg{width:24px;height:24px;fill:currentColor;stroke:none;}
        /* L'ONDE : trente barres fixes, et c'est la LECTURE qui les anime.
           Le degrade va du rose au violet de gauche a droite, comme sur sa
           maquette — il dit le sens de lecture sans fleche. */
        .ps-onde{flex:1 1 auto;min-width:0;display:flex;align-items:center;
          gap:2.5px;height:38px;}
        .ps-onde i{flex:1 1 0;min-width:0;border-radius:99px;
          background:linear-gradient(180deg,#FF2E9A,#A855F7);
          opacity:.55;}
        .ps-lecteur.joue .ps-onde i{animation:psOnde .9s ease-in-out infinite alternate;}
        .ps-onde i:nth-child(3n){animation-delay:.15s;}
        .ps-onde i:nth-child(3n+1){animation-delay:.3s;}
        @keyframes psOnde{from{opacity:.45;transform:scaleY(.62);}
          to{opacity:1;transform:scaleY(1);}}
        @media (prefers-reduced-motion: reduce){
          .ps-lecteur.joue .ps-onde i{animation:none;opacity:.9;}}
        .ps-chrono{flex:none;font-style:normal;font-size:15px;font-weight:900;
          letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
        .ps-q{margin:15px 0 0;font-size:clamp(21px,min(6.4vw,3.3vh),27px);
          font-weight:900;line-height:1.08;letter-spacing:-.03em;
          text-shadow:0 2px 14px rgba(0,0,0,.9);}

        /* ═══ 3/4 · LES TROIS FANTOMES ══════════════════════════════════ */
        .ps-qui{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
          gap:8px;margin:12px 0 0;}
        .ps-fant{position:relative;display:flex;flex-direction:column;
          align-items:center;gap:3px;padding:12px 6px 10px;border-radius:16px;
          background:rgba(12,10,18,.66);border:1.5px solid rgba(255,46,154,.48);
          box-shadow:0 0 20px -10px rgba(255,46,154,.8);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        /* LA PASTILLE RONDE TEINTEE : c'est le Fantome de la personne, avec sa
           couleur et son accessoire. Sa maquette y mettait une photo de
           visage ; le produit n'en a pas, et c'est exactement sa promesse. */
        .ps-rond{position:relative;width:clamp(44px,13vw,56px);
          aspect-ratio:1;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 0 2px rgba(255,255,255,.28) inset,
            0 8px 20px -8px rgba(0,0,0,.9);}
        .ps-rond-f{width:72%;height:auto;
          filter:drop-shadow(0 1px 4px rgba(0,0,0,.5));}
        .ps-rond s{position:absolute;right:-3px;bottom:-2px;font-size:13px;
          text-decoration:none;line-height:1;
          text-shadow:0 1px 4px rgba(0,0,0,.8);}
        .ps-badge{position:absolute;top:8px;right:8px;
          width:22px;height:22px;border-radius:50%;font-size:11px;
          display:flex;align-items:center;justify-content:center;
          background:rgba(168,85,247,.9);
          box-shadow:0 0 0 1.5px rgba(255,255,255,.22) inset;}
        .ps-fant b{margin-top:4px;font-size:12px;font-weight:900;
          letter-spacing:-.01em;line-height:1.1;}
        .ps-fant em{font-style:normal;font-size:10.5px;font-weight:750;
          line-height:1.18;color:rgba(255,255,255,.76);
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        /* LA MENTION N'EST PAS UNE PRECAUTION, C'EST L'ARGUMENT. « Personne ne
           montre son visage » est ce qui distingue ce produit d'un reseau. */
        .ps-note{display:flex;align-items:center;justify-content:center;gap:6px;
          margin:8px 0 0;font-size:11px;font-weight:700;
          color:rgba(255,255,255,.6);}
        .ps-note i{font-style:normal;font-size:11px;}

        .ps-cats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));
          gap:5px;margin:11px 0 0;}
        /* ON NE TRONQUE PAS UN NOM DE CATEGORIE. Mesure a 390 points de large :
           « Restaurants » et « Commerces » sortaient en « Restaura… » et
           « Commer… ». Un onglet coupe ne dit plus ou il mene, ce qui est la
           seule chose qu'un onglet ait a dire. Ils passent donc plus petits et
           sur deux lignes au besoin — c'est l'espace qui manque, pas le mot
           qui est trop long. */
        .ps-cats button{padding:7px 3px;border-radius:12px;
          font:inherit;font-size:9.5px;font-weight:800;cursor:pointer;
          line-height:1.14;hyphens:auto;
          color:rgba(255,255,255,.68);
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .ps-cats button.on{color:#fff;background:rgba(255,46,154,.16);
          border-color:rgba(255,46,154,.7);
          box-shadow:0 0 14px -6px rgba(255,46,154,.9);}

        /* ═══ 4/4 · LA SOIREE ═══════════════════════════════════════════ */
        .ps-carte{margin:12px 0 0;border-radius:20px;overflow:hidden;
          text-align:left;
          background:rgba(12,10,18,.7);border:1.5px solid rgba(255,46,154,.5);
          box-shadow:0 0 26px -10px rgba(255,46,154,.7);}
        .ps-carte-i{aspect-ratio:1 / .52;background-size:cover;
          background-position:center 30%;}
        .ps-carte-t{padding:11px 14px 13px;}
        .ps-chapeau{display:block;font-size:10.5px;font-weight:900;
          letter-spacing:.09em;text-transform:uppercase;color:#FF7EC4;}
        .ps-carte-t b{display:block;margin:3px 0 0;
          font-size:clamp(17px,5vw,21px);font-weight:900;letter-spacing:-.02em;
          line-height:1.14;}
        .ps-carte-t ul{list-style:none;display:flex;flex-wrap:wrap;gap:6px 14px;
          margin:8px 0 0;padding:0;}
        .ps-carte-t li{display:flex;align-items:center;gap:5px;
          font-size:12.5px;font-weight:750;color:rgba(255,255,255,.82);}
        .ps-carte-t i{font-style:normal;font-size:11px;}

        /* LE PLAN EST UN DESSIN, ET IL NE PRETEND PAS ETRE UN PLAN DE DAX.
           Deux rues, un trajet, un point de depart. Le vrai chemin est
           derriere le bouton Itineraire, qui ouvre la carte du telephone. */
        .ps-plan{display:flex;align-items:center;gap:12px;
          margin:9px 0 0;padding:9px 13px 9px 9px;border-radius:16px;
          text-align:left;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.12);}
        .ps-plan-d{flex:none;width:96px;height:40px;border-radius:10px;
          overflow:hidden;background:#15131C;}
        .ps-plan-d svg{width:100%;height:100%;fill:none;
          stroke:rgba(255,255,255,.16);stroke-width:3;}
        .ps-plan-d .ps-plan-r{stroke:#FF2E9A;stroke-width:3;
          stroke-linecap:round;stroke-linejoin:round;
          stroke-dasharray:1 7;}
        .ps-plan-d .ps-plan-a{fill:#FF2E9A;stroke:none;}
        .ps-plan-t{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .ps-plan-t b{font-size:14px;font-weight:900;letter-spacing:-.015em;
          line-height:1.14;}
        .ps-plan-t em{font-style:normal;font-size:12px;font-weight:750;
          color:rgba(255,255,255,.7);}

        /* CE QU'IL FAUT SAVOIR AVANT D'Y ALLER : gratuit, sans reservation,
           annule s'il pleut. Ce sont les infos pratiques de l'evenement, et
           c'est ce qui remplace le faux guichet de sa maquette. */
        .ps-pratique{list-style:none;display:flex;flex-wrap:wrap;
          justify-content:center;gap:6px;margin:10px 0 0;padding:0;}
        .ps-pratique li{padding:5px 11px;border-radius:999px;
          font-size:11.5px;font-weight:800;color:rgba(255,255,255,.84);
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.14);}

        .ps-compte{margin:7px 0 0;font-size:12.5px;font-weight:750;
          color:rgba(255,255,255,.74);}
        .ps-compte b{color:#fff;font-weight:900;}

        /* ═══ LES DEUX BOUTONS, IDENTIQUES AUX AUTRES PARCOURS ══════════ */
        .ps-go{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:13px 0 0;padding:15px 18px;
          font:inherit;font-size:clamp(16px,4.8vw,19px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;text-decoration:none;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.85),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .ps-go:active{transform:scale(.98);}
        /* UNE FOIS LE FANTOME POSE, LE BOUTON N'EST PLUS UN APPEL : il est un
           etat. Il perd son rose et sa lueur, et garde juste un contour vert
           — celui de « c'est fait », qui est le seul vert qu'on garde. */
        .ps-go.fait{background:rgba(47,211,154,.14);cursor:default;
          box-shadow:0 0 0 1.5px rgba(47,211,154,.7) inset;color:#8CF0CC;}
        .ps-billet{width:23px;height:23px;flex:none;fill:none;
          stroke:currentColor;stroke-width:1.7;
          stroke-linecap:round;stroke-linejoin:round;}
        .ps-lire{flex:none;width:27px;height:27px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.22);}
        .ps-lire svg{width:15px;height:15px;fill:currentColor;stroke:none;}
        .ps-deux{display:flex;align-items:center;justify-content:center;gap:9px;
          width:100%;margin:9px 0 0;padding:13px 18px;
          font:inherit;font-size:15px;font-weight:850;color:#fff;
          cursor:pointer;text-decoration:none;
          border-radius:999px;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,46,154,.55);}
        .ps-deux:active{transform:scale(.98);}
        .ps-deux s{text-decoration:none;}

        /* SUR UN PETIT TELEPHONE, LE BAS SE SERRE. Mesure a 360x780 : la
           quatrieme etape sortait de SEPT POINTS sous le bas de l'ecran —
           elle porte un titre, une carte photo, un plan, deux pastilles
           pratiques, deux boutons et un compte. Le seuil est a 800 et non a
           740 parce que c'est a 780 que la mesure a trouve le debord ; un
           seuil qui ne couvre pas le cas mesure ne sert a rien. */
        @media (max-height: 800px){
          .ps-carte{margin-top:9px;}
          .ps-carte-i{aspect-ratio:1 / .42;}
          .ps-carte-t{padding:9px 13px 11px;}
          .ps-plan{margin-top:7px;padding:7px 12px 7px 7px;}
          .ps-plan-d{height:34px;}
          .ps-pratique{margin-top:8px;}
          .ps-compte{margin-top:5px;}
        }
        @media (max-height: 740px){
          .ps-qui{gap:6px;}
          .ps-fant{padding:9px 4px 8px;}
          .ps-cats{margin-top:8px;}
          .ps-cats button{padding:6px 2px;font-size:10px;}
          .ps-go{margin-top:10px;padding:13px 16px;}
          .ps-deux{margin-top:7px;padding:11px 16px;}
          .ps-lecteur{margin-top:10px;}
        }
      `,
      }}
    />
  );
}
