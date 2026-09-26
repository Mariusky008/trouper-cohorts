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
          filter:drop-shadow(0 0 16px rgba(255,46,154,.65));}

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
        /* LE FANTOME EST LA PORTE DE L'ACCUEIL — meme geste que sur les
           autres parcours. La petite maison sur son epaule est ce qui le fait
           comprendre : une mascotte cliquable sans aucun signe reste une
           mascotte. */
        .pt-accueil{position:relative;flex:none;padding:0;border:0;
          background:none;font:inherit;cursor:pointer;line-height:0;
          border-radius:999px;}
        .pt-accueil:active{transform:scale(.94);}
        .pt-accueil:focus-visible{outline:2px solid #FF2E9A;outline-offset:3px;}
        .pt-accueil-m{position:absolute;right:-2px;bottom:-2px;
          width:22px;height:22px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:#06060A;background:#FF2E9A;
          box-shadow:0 2px 10px rgba(255,46,154,.55);}
        .pt-accueil-m svg{width:12px;height:12px;fill:none;stroke:currentColor;
          stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}

        /* LA BULLE DU FANTOME, sur la photo, en haut a gauche : c'est sa
           maquette de la premiere etape, et c'est la seule place ou elle ne
           couvre ni le plat ni un bouton. */
        /* DANS LE FLUX, EN TETE DU BLOC. Posee en absolu a 92 points du haut
           — mais d'un bloc qui commence au bas de l'ecran — elle atterrissait
           au milieu du texte, coincee entre le sous-titre et la fiche. */
        .pt-dit{position:relative;z-index:4;margin:0 0 6px;
          display:flex;align-items:center;gap:0;max-width:92%;}
        /* ═══ LE RIDEAU : DEUX PHOTOS, UNE SEULE A LA FOIS ══════════════
           C'est le geste de l'application. Les deux vignettes cote a cote
           faisaient comparer deux PRIX avant de montrer deux formats ; ici il
           n'y a qu'un prix a l'ecran, celui de ce qu'on regarde. */
        .pt-rideau{position:relative;width:100%;aspect-ratio:4 / 3;
          margin:2px 0 0;border-radius:18px;overflow:hidden;
          touch-action:pan-y;cursor:ew-resize;user-select:none;
          -webkit-user-select:none;
          border:1px solid rgba(255,255,255,.12);
          box-shadow:0 18px 40px -22px rgba(0,0,0,.9);}
        .pt-rid-img{position:absolute;inset:0;background-size:cover;
          background-position:center;}
        /* ON DECOUPE, ON NE REDIMENSIONNE PAS : la boite garde ses dimensions,
           donc les deux moities restent cadrees pareil. */
        .pt-rid-img.entier{clip-path:inset(0 calc((100% - var(--pt-x,58) * 1%)) 0 0);}
        /* UNE SEULE ETIQUETTE, CENTREE EN BAS : deux etiquettes portant deux
           prix ramenaient le defaut des deux vignettes — on comparait des prix
           par-dessus le rideau au lieu de regarder le plat. */
        .pt-rid-et{position:absolute;left:50%;bottom:10px;z-index:3;
          transform:translateX(-50%);
          display:flex;flex-direction:column;align-items:center;gap:1px;
          padding:8px 16px;border-radius:16px;text-align:center;
          background:rgba(8,7,12,.86);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          max-width:calc(100% - 24px);
          animation:ptEtiq .22s ease both;}
        @keyframes ptEtiq{from{opacity:0;transform:translateX(-50%) translateY(4px)}
          to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .pt-rid-et b{font-size:13.5px;font-weight:850;line-height:1.2;color:#fff;}
        .pt-rid-et u{text-decoration:none;font-size:11px;font-weight:700;
          color:rgba(255,255,255,.62);}
        .pt-rid-et em{font-style:normal;font-size:16px;font-weight:900;
          color:#FFD233;margin-top:1px;}
        .pt-rid-trait{position:absolute;top:0;bottom:0;z-index:4;width:2px;
          margin-left:-1px;background:rgba(255,255,255,.92);
          box-shadow:0 0 14px rgba(255,46,154,.8);
          display:flex;align-items:center;justify-content:center;}
        .pt-rid-trait s{flex:none;width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          text-decoration:none;font-size:17px;color:#06060A;
          background:#FF2E9A;box-shadow:0 6px 18px -6px rgba(255,46,154,.9);}
        /* LA GLISSIERE EST INVISIBLE MAIS ELLE EXISTE : elle donne le clavier
           et le lecteur d'ecran a un geste qui n'aurait sinon que le doigt.
           UN POINT, PAS UNE BANDE : etalee sur toute la largeur a opacite
           zero, son curseur natif reapparaissait quand meme dans le coin —
           Chromium peint la poignee des que la boite forme une couche. Reduite
           a un point, il n'y a plus rien a peindre, et c'est le cadre qui
           montre le focus. */
        .pt-rid-clavier{position:absolute;left:0;bottom:0;
          width:1px;height:1px;opacity:0;margin:0;padding:0;border:0;
          appearance:none;-webkit-appearance:none;}
        .pt-rideau:focus-within{outline:2px solid #FF2E9A;outline-offset:3px;}

        .pt-dit-f{flex:none;width:clamp(58px,17vw,74px);height:auto;
          filter:drop-shadow(0 0 16px rgba(255,46,154,.7));}
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
        /* ═══ UN RECIT N'EST PAS UNE SIGNATURE ════════════════════════════
           « J'ai besoin d'avoir de super belles voix bien naturelles. »
           LE TEXTE QU'IL A ECRIT FAIT SIX PHRASES, la la signature en faisait
           une. A dix-huit points et en gras italique, la recette de Margot
           debordait sous le bouton d'ecoute : on lisait « je melange la farine
           et les oeufs » et le reste passait sous le bord.
           IL MAIGRIT ET IL DEFILE. Plus petit, moins appuye, interligne plus
           aere — un paragraphe se lit autrement qu'une phrase a claquer — et
           une hauteur bornee avec defilement, pour qu'un recit plus long que
           prevu ne pousse jamais le bouton hors de l'ecran. */
        .pt-mot.long{font-size:clamp(12.5px,3.5vw,14.5px);font-weight:650;
          line-height:1.44;letter-spacing:0;
          max-height:min(34vh,260px);overflow-y:auto;
          padding:12px 14px 13px 32px;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:thin;scrollbar-color:rgba(255,46,154,.5) transparent;}
        .pt-mot.long::-webkit-scrollbar{width:4px;}
        .pt-mot.long::-webkit-scrollbar-thumb{background:rgba(255,46,154,.5);
          border-radius:999px;}
        .pt-mot.long i{top:7px;font-size:24px;}
        /* ═══ ON L'ENTEND : LE BOUTON, L'ONDE, ET CE QU'ON EN DIT ════════
           L'ecran annoncait « sa voix arrive ». C'etait vrai et c'etait une
           promesse repoussee : le seul ecran qu'un concurrent ne peut pas
           copier, annonce et pas joue. Le telephone lit sa phrase, et la ligne
           du dessous dit que c'est une voix de synthese — voir l'ecran. */
        /* ═══ L'ECRAN DU RECIT, REFAIT ═══════════════════════════════════
           « C'est tres laid, ce design avec tout ce texte. Il faut supprimer le
           texte et revoir tout l'UX de cet ecran pour qu'il soit plus
           chaleureux. »
           CE QUI ETAIT LAID : deux cent trente-six points de gras italique
           encadres de magenta, au milieu de l'ecran. Un mur. Il cachait la
           seule chose qui compte ici, qui est la voix.
           CE QUI PREND SA PLACE : le visage, puis le geste. Tout est centre,
           tout respire, et le plus gros objet de l'ecran est le bouton qu'on
           veut toucher. */
        .pt-voixbas{align-items:center;text-align:center;}
        /* LE BLOC QUI PARLE : le rond, et l'onde dessous. */
        .pt-parle{display:flex;flex-direction:column;align-items:center;gap:10px;
          margin:0 0 4px;}
        /* LE ROND : sa photo dedans, un anneau magenta autour, et le signe de
           lecture pose en bas a droite comme une pastille. */
        .pt-rond{position:relative;flex:none;
          width:clamp(96px,min(28vw,14vh),124px);aspect-ratio:1;
          border-radius:50%;padding:0;border:0;cursor:pointer;
          background:none;font:inherit;
          box-shadow:0 0 0 3px rgba(255,46,154,.85),
                     0 18px 44px -14px rgba(255,46,154,.75);
          transition:transform .18s ease,box-shadow .3s ease;}
        .pt-rond:active{transform:scale(.96);}
        .pt-rond:focus-visible{outline:2px solid #fff;outline-offset:5px;}
        .pt-rond-p{position:absolute;inset:0;border-radius:50%;
          background-size:cover;background-position:center 30%;}
        /* LA PASTILLE DE LECTURE. Elle est en bas a droite pour ne pas couvrir
           le visage : un triangle plante au milieu d'une tete est desagreable. */
        .pt-rond-s{position:absolute;right:-2px;bottom:-2px;
          width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;color:#06060A;background:#FF2E9A;
          box-shadow:0 6px 18px -6px rgba(0,0,0,.9);}
        /* IL RESPIRE QUAND CA PARLE, et seulement alors. */
        .pt-rond.on{box-shadow:0 0 0 3px #FF2E9A,
                    0 0 0 12px rgba(255,46,154,.22),
                    0 18px 44px -12px rgba(255,46,154,.9);}
        .pt-t-voix{font-size:clamp(25px,min(8vw,4.4vh),36px);}
        .pt-qui{margin:5px 0 0;font-size:12.5px;font-weight:800;
          letter-spacing:.06em;text-transform:uppercase;color:#FF7FC2;}
        /* LA PHRASE QUI TIENT DEBOUT TOUTE SEULE. Elle n'a plus de cadre, plus
           de guillemet geant, plus de fond : une phrase se lit mieux posee sur
           la photo qu'enfermee dans une boite. */
        .pt-phrase{margin:9px 0 0;max-width:30ch;
          font-size:clamp(14px,4.2vw,17px);font-weight:700;font-style:italic;
          line-height:1.35;color:#F4E9FF;
          text-shadow:0 2px 14px rgba(0,0,0,.9);}
        /* LE RECIT SE REPLIE. Il reste pour qui n'entend pas et pour qui fait
           defiler en silence ; replie, il ne coute plus une ligne. */
        .pt-lire{margin:9px 0 0;width:100%;max-width:340px;text-align:left;}
        .pt-lire summary{list-style:none;cursor:pointer;text-align:center;
          font-size:11.5px;font-weight:800;letter-spacing:.03em;
          color:rgba(255,255,255,.62);text-decoration:underline;
          text-underline-offset:3px;}
        .pt-lire summary::-webkit-details-marker{display:none;}
        .pt-lire[open] summary{color:#FF7FC2;}
        .pt-lire p{margin:9px 0 0;padding:11px 13px;border-radius:14px;
          font-size:12.5px;font-weight:600;line-height:1.45;color:#E7DCF2;
          background:rgba(12,10,16,.7);
          border:1px solid rgba(255,255,255,.12);
          max-height:26vh;overflow-y:auto;}
        .pt-ecoute{display:flex;align-items:center;gap:13px;margin:12px 0 0;}
        .pt-ecoute-b{flex:none;width:52px;height:52px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;font-size:17px;cursor:pointer;color:#06060A;border:0;
          background:#FF2E9A;box-shadow:0 10px 26px -10px rgba(255,46,154,.95);}
        .pt-ecoute-b s{text-decoration:none;}
        .pt-ecoute-b:active{transform:scale(.94);}
        .pt-onde{width:min(72vw,300px);height:30px;display:flex;align-items:center;
          gap:3px;}
        .pt-onde i{flex:1;min-width:2px;border-radius:2px;
          height:var(--h,40%);background:rgba(255,255,255,.28);}
        /* ELLES NE BOUGENT QUE PENDANT LA LECTURE : une onde qui s'agite sur un
           silence dit que ca joue, et on attend un son qui ne vient pas. */
        .pt-onde.on i{background:#FF2E9A;
          animation:ptOnde .9s ease-in-out infinite alternate;
          animation-delay:var(--d,0s);}
        @keyframes ptOnde{from{transform:scaleY(.45)}to{transform:scaleY(1)}}
        .pt-synth{margin:8px 0 0;font-size:11.5px;font-weight:700;
          letter-spacing:.02em;color:rgba(255,255,255,.5);}

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
