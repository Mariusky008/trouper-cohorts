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
        /* ═══ UN CALQUE DE DECOR NE PREND JAMAIS LE DOIGT ══════════════
           « On est bloque a cette etape et celle d'avant, pas impossible de
           revenir a l'accueil. »
           LE CALQUE FLOU EST AGRANDI DE 14 POUR CENT — c'est ce qui lui evite
           de laisser un bord net quand on le floute de vingt-six points. Un
           element mis a l'echelle DEBORDE de sa boite : mesure a l'ecran, il
           commencait a 10 points du haut alors que sa section commence a 65,
           donc il passait PAR-DESSUS l'en-tete. Le Fantome et la fleche de
           retour etaient dessous, visibles et intouchables.
           TOUS CES CALQUES SONT caches aux lecteurs d ecran : ils n'existent pour personne,
           donc ils ne doivent exister pour aucun doigt. */
        .pt-fond{pointer-events:none;position:absolute;inset:0;background-size:cover;
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
        /* ═══ LE FANTOME REPREND SA PLACE, TOUT A DROITE ═══════════════════
           EN RETIRANT LA BARRE DE PROGRESSION, J'AI FAIT GLISSER LE FANTOME.
           C'est elle qui occupait le milieu de la ligne et le poussait au bord ;
           sans elle, les trois elements se sont serres a gauche et le Fantome
           s'est retrouve au tiers de l'ecran. Mesure : x = 133 au lieu de 353.
           « Nouvelle demande et cote salon n'ont pas le fantome en haut. » Il
           etait la, mais plus a sa place — et une porte qui change de place
           n'est plus une porte, c'est une surprise.
           ET LA BARRE PORTE UN FOND. Le bloc de la demande defile dessous ;
           sans voile, le texte passait a travers le logo. */
        .pt-haut::before{content:"";position:absolute;inset:0;z-index:-1;
          background:linear-gradient(180deg,rgba(6,6,10,.82),rgba(6,6,10,0));
          pointer-events:none;}
        .pt-haut>.fa{margin-left:auto;}
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
          scrollbar-width:none;-ms-overflow-style:none;}
        .pt-mot.long::-webkit-scrollbar{width:0;display:none;}
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
        /* ═══ L'ECRAN QUI EVOLUE PENDANT LA VOIX ══════════════════════
           « Les 4 photos devraient se succeder pendant que la voix parle. Meme
           principe : un seul ecran qui evolue pendant la voix. »
           LES QUATRE SONT EMPILEES ET TOUTES CHARGEES. Une seule boite dont on
           changerait l'image ferait un blanc a chaque bascule : le navigateur
           ne telecharge qu'au moment ou on la demande. Empilees, il ne reste
           qu'une opacite a faire glisser — d'ou le fondu, gratuit. */
        /* ═══ ET C'EST UNE BANDE, PAS UN PLEIN CADRE ══════════════════
           MESURE A L'ECRAN : en plein cadre, la premiere photo ne montrait plus
           qu'un menton et un tablier. La cause est la meme que pour les deux
           premieres etapes, et elle est deja ecrite plus haut — une photo large
           posee dans un ecran haut se recadre par les COTES, et il ne reste que
           la tranche du milieu. Ses quatre images sont presque carrees ; en
           bande, on voit l'homme entier, sa poele et sa cuisine.
           LA BANDE EST UN PEU PLUS HAUTE QUE CELLE DES ETAPES 1 ET 2 : ce qu'on
           regarde ici change toutes les sept secondes, donc il faut en voir
           davantage. */
        /* ═══ ET LA BANDE A LE FORMAT DES PHOTOS ══════════════════════
           « Pour les 4 ecrans du restaurateur qui parle, on ne les voit pas en
           entier. »
           UNE BANDE DONT LE FORMAT NE VAUT PAS CELUI DE L'IMAGE RECADRE, et il
           n'y a pas d'autre issue : en « cover » elle rogne, en « contain »
           elle laisse des bandes noires. Ses quatre images sont presque
           carrees — 758 sur 750, c'est le cadrage de sa maquette — et la bande
           faisait 60 % de la hauteur, soit 0,77 de rapport. Elle coupait donc
           160 points sur les cotes : la tete du cuisinier en haut, sa poele en
           bas.
           ON DONNE A LA BANDE LE RAPPORT DE L'IMAGE. Plus rien a rogner, donc
           on voit tout, et la place occupee — 47 % de l'ecran — est celle de sa
           maquette au point pres.
           La borne max-height GARDE LA MAIN SUR LES ECRANS LARGES ET COURTS, ou le
           rapport seul mangerait tout l'ecran ; c'est le seul cas ou l'on
           rogne encore, et le mode contain s'en charge sans jamais couper. */
        .pt-suite{pointer-events:none;position:absolute;inset:0 0 auto;
          width:100%;aspect-ratio:758 / 838;max-height:62%;}
        .pt-suite span{position:absolute;inset:0;opacity:0;
          background-size:contain;background-repeat:no-repeat;
          background-position:center top;
          transition:opacity .62s ease;}
        .pt-suite span.on{opacity:1;}
        /* LE BAS DE LA BANDE SE FOND DANS LE NOIR. Sans ca, la photo s'arrete
           net sur une ligne droite au milieu de l'ecran : on voit le bord de la
           boite, ce qui est la seule chose qu'on ne doit jamais voir. Le fondu
           est sur la bande et pas sur le voile general, parce que c'est la
           hauteur de la bande qui commande, et elle suit le format de l'image. */
        .pt-suite::after{content:"";position:absolute;left:0;right:0;bottom:0;
          height:26%;
          background:linear-gradient(180deg,rgba(6,6,10,0),#06060A 92%);}
        /* LE VOILE SUIT LA BANDE : sans ca, il degradait vers le noir au milieu
           de la photo et la coupait en deux. */
        /* LE VOILE NE FAIT PLUS QUE LE HAUT : la bande gere son propre bas.
           Il assombrit juste ce qu'il faut derriere l'en-tete pour que le logo
           et le Fantome se lisent sur une cuisine eclairee. */
        .pt-p-voix.pt-suite-la .pt-voile{background:linear-gradient(180deg,
            rgba(6,6,10,.8) 0%, rgba(6,6,10,.26) 11%, rgba(6,6,10,0) 24%);}
        /* L'ONDE S'EFFACE QUAND LA BARRE DU LECTEUR EST LA. Les deux disent la
           meme chose — ca parle — et l'une des deux la dit avec des chiffres.
           Vingt batons qui remuent au-dessus d'une barre qui avance, c'est deux
           fois le meme mouvement dans deux centimetres. */
        .pt-suitebas .pt-onde{display:none;}
        /* ═══ LES DEUX FLECHES, DE PART ET D'AUTRE DU ROND ═══════════════
           « Si on ne veut pas ecouter la voix du restaurateur, on pourrait
           quand meme faire defiler les 4 photos avec des fleches. »
           EN RANGEE AVEC LE ROND, PAS POSEES SUR LA PHOTO. Sur la photo, elles
           auraient couvert ce qu'on regarde et demande de viser ; en rangee,
           elles encadrent le geste principal et se touchent sans regarder.
           DISCRETES EXPRES : celui qui ecoute n'a rien a faire, et une fleche
           qui crie plus fort que le bouton de lecture ferait croire qu'il faut
           s'en servir. */
        .pt-parle-fl{flex-direction:row;align-items:center;justify-content:center;
          gap:16px;}
        .pt-fl{flex:none;width:38px;height:38px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);
          transition:opacity .18s ease;}
        .pt-fl svg{width:19px;height:19px;fill:none;stroke:currentColor;
          stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
        .pt-fl:active{transform:scale(.92);}
        /* AU BOUT DU RANG, ELLE S'ETEINT SANS DISPARAITRE : une fleche qui
           s'efface fait sauter la rangee et deplace le rond sous le doigt. */
        .pt-fl:disabled{opacity:.28;cursor:default;}
        /* LE BAS EST PLUS SERRE QUE SUR L'ECRAN D'AVANT : il porte une legende,
           un rond, une barre, une ligne, une fiche et un bouton. */
        .pt-suitebas .pt-parle{margin:8px 0 0;}
        .pt-suitebas .pt-rond{width:clamp(74px,min(21vw,11vh),94px);}
        .pt-suitebas .pt-rond-s{width:32px;height:32px;font-size:12px;}
        /* LE CHAPEAU DE SA MAQUETTE : « DANS LA CUISINE DE JULIEN », en petites
           capitales, precede d'un tiret. Il dit ou l'on est avant qu'on ait lu
           la legende, et il ne bouge pas quand les photos tournent. */
        .pt-chapeau{margin:0;font-size:11px;font-weight:850;letter-spacing:.09em;
          text-transform:uppercase;color:#FFB3DA;
          text-shadow:0 2px 12px rgba(0,0,0,.95);}
        .pt-chapeau::before{content:"— ";opacity:.7;}
        /* LA LEGENDE, EN DEUX TONS. Elle arrive avec sa photo : la cle de React
           change a chaque temps, donc l'animation se rejoue — sans quoi le
           texte se remplacerait sans qu'on le remarque. */
        .pt-legende{margin:7px 0 0;max-width:24ch;
          font-size:clamp(19px,min(6vw,3.4vh),26px);font-weight:800;
          /* LE CRENAGE EST PRESQUE NUL, ET C'EST UNE MESURE. A -.02em et 26px,
             « Rose au centre » se lisait « Rose aucentre » : le gras serre les
             lettres ET l'espace, qui n'a rien pour resister. On rend l'espace
             a l'espace. */
          line-height:1.18;letter-spacing:-.005em;word-spacing:.05em;
          color:#fff;
          text-wrap:balance;text-shadow:0 2px 18px rgba(0,0,0,.95);
          animation:ptLegende .5s ease backwards;}
        /* LE ROSE PORTE L'APPUI, LE BLANC PORTE LA PHRASE — c'est le dessin
           de sa maquette : « Mon magret, je le commence cote peau. » L'inverse
           — un mot blanc dans une phrase grise — faisait lire la phrase comme
           un sous-titre eteint. */
        .pt-legende b{font-weight:900;color:#FF2E9A;}
        @keyframes ptLegende{from{opacity:0;transform:translateY(7px)}
          to{opacity:1;transform:none}}
        /* LA BARRE DU LECTEUR, ET CE N'EST PAS UNE BARRE D'ETAPES. Elle dit
           combien de temps il parle encore — la premiere chose qu'on veut
           savoir avant d'appuyer. Les barres qu'il a fait retirer comptaient
           des ecrans ; celle-ci compte des secondes, et elle est dans sa
           maquette. */
        .pt-lecteur{display:flex;align-items:center;gap:10px;
          width:100%;max-width:280px;margin:10px 0 0;}
        .pt-piste{position:relative;flex:1 1 auto;height:4px;border-radius:999px;
          background:rgba(255,255,255,.2);overflow:hidden;}
        .pt-piste i{position:absolute;inset:0 auto 0 0;border-radius:999px;
          background:linear-gradient(90deg,#FF7FC2,#FF2E9A);
          transition:width .18s linear;}
        .pt-chrono{flex:none;font-size:11px;font-weight:800;
          font-variant-numeric:tabular-nums;color:rgba(255,255,255,.66);}
        .pt-suitebas .pt-qui{margin:9px 0 0;}
        .pt-suitebas .pt-qui b{color:#fff;}
        @media (prefers-reduced-motion:reduce){
          /* ON NE SUPPRIME PAS LE CHANGEMENT D'IMAGE, ON SUPPRIME LE GLISSE.
             Retirer la bascule rendrait l'ecran faux — la voix parlerait de la
             cuisson devant l'assiette servie. Ce qui gene ici est le mouvement
             du texte, pas la photo qui change. */
          .pt-legende{animation:none;}
          .pt-piste i{transition:none;}
        }

        .pt-synth{margin:8px 0 0;font-size:11.5px;font-weight:700;
          letter-spacing:.02em;color:rgba(255,255,255,.5);}

        /* ═══ 4/4 · « ON SE RETROUVE CHEZ NOUS ? » ══════════════════════
           « Le dernier ecran est trop faible. Quelque chose de plus fort. »
           CE QUI ETAIT FAIBLE : trois pastilles grises d'informations pratiques
           posees sur une salle vide, juste apres qu'un homme a raconte son plat
           pendant une demi-minute. Toute la chaleur tombait d'un coup, au
           moment precis ou l'on demande de venir.
           CE QUI PREND SA PLACE : sa personne en grand, la question par-dessus,
           et tout le reste dans une seule carte qui se lit dans l'ordre ou l'on
           decide — chez qui, ou, quoi et combien, quand, ce qu'ils font. */
        /* LE BLOC DE LA QUESTION, POSE DANS LA PHOTO. En pour cent et pas en
           points : il doit rester au meme endroit de l'image quelle que soit la
           hauteur du telephone, puisque c'est l'image qu'il habite. */
        .pt-invite{position:absolute;left:16px;right:16px;top:19%;z-index:3;
          display:flex;flex-direction:column;align-items:flex-start;}
        .pt-t-venir{margin:0;font-size:clamp(28px,min(8.6vw,4.6vh),40px);
          text-align:left;}
        .pt-t-venir em{font-style:normal;color:#FF2E9A;}
        /* LA PHOTO PREND TOUT LE HAUT : le titre et la pastille se posent
           dessus, le bloc du bas commence sous le degrade. */
        .pt-p-venir .pt-voile{background:linear-gradient(180deg,
            rgba(6,6,10,.7) 0%, rgba(6,6,10,.16) 12%, rgba(6,6,10,0) 30%,
            rgba(6,6,10,.12) 44%, rgba(6,6,10,.72) 60%, #06060A 72%);}
        /* LA PHOTO EST UNE BANDE, comme celle du recit — et pour la meme
           raison, mesuree deux fois : une image large posee en plein cadre dans
           un ecran haut se recadre par les COTES. En plein cadre on ne voyait
           plus qu'une epaule et une nappe ; en bande, on voit l'homme, sa main
           tendue et sa salle. La hauteur est celle de sa maquette. */
        /* ELLE A LE FORMAT DE L'IMAGE, comme la bande du recit et pour la
           meme raison : une hauteur en pour cent ne vaut pas le format de la
           photo, donc elle rogne. Les trois photos d'accueil sont exportees au
           meme rapport — voir le dossier public/direct/table. */
        .pt-p-venir .pt-fond{bottom:auto;height:auto;aspect-ratio:70 / 100;
          max-height:66%;
          background-size:contain;background-repeat:no-repeat;
          background-position:center top;}
        /* LE BAS SE FOND DANS LE NOIR, sinon la photo s'arrete sur une ligne
           droite au milieu de l'ecran — on verrait le bord de la boite. */
        .pt-p-venir .pt-fond::after{content:"";position:absolute;
          left:0;right:0;bottom:0;height:24%;
          background:linear-gradient(180deg,rgba(6,6,10,0),#06060A 92%);}
        .pt-venirbas{align-items:flex-start;text-align:left;}
        /* LA DISTANCE EN PASTILLE, SUR LA PHOTO : c'est la seule information
           qui change la reponse a la question posee juste au-dessus. */
        /* ELLE SE DIMENSIONNE SUR SON TEXTE. Etiree sur toute la largeur, une
           pastille cesse d'etre une pastille : elle devient une barre, et une
           barre se lit comme un bouton qu'on peut toucher. */
        .pt-loin{align-self:flex-start;width:auto;max-width:100%;
          margin:11px 0 0;padding:7px 13px;border-radius:999px;
          display:flex;align-items:center;gap:6px;
          font-size:12px;font-weight:850;color:#fff;
          background:rgba(12,10,16,.7);border:1px solid rgba(255,255,255,.18);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .pt-loin i{font-style:normal;font-size:12px;line-height:1;}
        /* UNE SEULE CARTE, PAS QUATRE BLOCS. Les informations d'un restaurant
           se lisent ensemble ou pas du tout : eparpillees en pastilles, elles
           demandent quatre arrets pour dire une chose. */
        .pt-carte-fin{display:flex;flex-direction:column;align-items:stretch;
          width:100%;margin:14px 0 0;}
        .pt-nomfin{font-size:clamp(24px,7vw,31px);font-weight:900;
          letter-spacing:-.03em;line-height:1.05;color:#fff;
          text-shadow:0 2px 16px rgba(0,0,0,.9);}
        .pt-oufin{margin-top:3px;font-style:normal;
          font-size:14px;font-weight:700;color:rgba(255,255,255,.72);}
        .pt-trait{height:1px;margin:12px 0 11px;
          background:rgba(255,255,255,.16);}
        /* LE PLAT ET SON PRIX SUR UNE LIGNE, le prix cale a droite. Il ne se
           laisse pas ecraser : c'est la lecon du texte vertical de la fiche. */
        .pt-platfin{display:flex;align-items:baseline;gap:12px;}
        .pt-platfin b{flex:1 1 auto;min-width:0;
          font-size:clamp(16px,4.8vw,19px);font-weight:900;letter-spacing:-.02em;
          line-height:1.2;color:#fff;}
        .pt-platfin s{flex:none;text-decoration:none;
          font-size:clamp(20px,6vw,25px);font-weight:900;letter-spacing:-.03em;
          color:#fff;}
        .pt-heurefin{display:flex;align-items:center;gap:8px;
          margin-top:10px;padding:9px 13px;border-radius:13px;
          font-size:12.5px;font-weight:800;color:rgba(255,255,255,.88);
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.13);}
        .pt-heurefin i{flex:none;font-style:normal;font-size:13px;line-height:1;}
        /* SON MOT S'ALIGNE COMME TOUT LE RESTE DU BLOC. Centre au milieu de
           six lignes alignees a gauche, il faisait un accident. */
        .pt-motfin{margin-top:9px;font-style:normal;text-align:left;
          font-size:12px;font-weight:700;line-height:1.35;
          color:rgba(255,255,255,.6);}
        .pt-venirbas .pt-go{margin-top:14px;}
        .pt-venirbas .cc-bouton{align-self:stretch;width:100%;
          justify-content:center;margin-top:9px;padding:11px 15px;}

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
