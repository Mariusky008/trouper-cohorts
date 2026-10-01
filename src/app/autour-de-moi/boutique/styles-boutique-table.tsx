/**
 * 🎨 LA FEUILLE DE LA PAGE RESTAURANT — voir `boutique-table.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * scripts/verifier-styles-en-ligne.mjs.
 *
 * ═══ L'AMBRE, EN QUATRE COULEURS ══════════════════════════════════════════
 *
 * « Ambiance ambree, couleurs chaudes. » Le noir de l'application est BLEU
 * (#05090C) : pose sous une photo de salle aux lampes jaunes, il la refroidit.
 * Celui-ci est brun — #120C09 — et c'est ce qui fait qu'une devanture en plein
 * midi et une salle du soir semblent sortir de la meme soiree.
 *
 *   le fond      #120C09   un brun presque noir, jamais bleu
 *   la nappe     #1C1411   les panneaux, un cran plus clair
 *   le texte     #FFF4E6   une creme, pas un blanc — le blanc pur vibre sur le brun
 *   l'ambre      #F5A23A   les liserés, les etoiles, l'anneau du double
 *
 * LE ROSE DE LA CHARTE RESTE CELUI DES BOUTONS, et de rien d'autre. Un seul
 * geste par ecran est rose : c'est comme ça qu'on sait ou appuyer.
 *
 * ═══ LA TYPOGRAPHIE, ET CE QUI A CHANGE ═══════════════════════════════════
 *
 * « Au niveau des ecritures et couleurs de police, je ne suis pas certain que
 * ce soit les mieux. »
 *
 * LA POPPINS 900 CRIE. Elle est juste pour le mot-marque et un bouton ; en
 * titre de trois lignes sur une photo, elle devient un bloc noir qui ecrase la
 * salle. Les titres passent donc a 800, un peu resserres.
 *
 * LE TEXTE COURANT QUITTE LA POPPINS. Son graisse la plus fine chargee est
 * 600 : en corps de texte c'est du gras partout, et plus rien ne ressort. Il
 * passe en Geist, deja chargee par l'application, en 400 et 500 — lisible,
 * neutre, et elle laisse les titres parler.
 *
 * LA PHRASE DU DOUBLE EST EN PLAYFAIR — « Entre, je te fais decouvrir. »
 * C'est la seule ligne de l'ecran qui n'est pas la page qui parle, mais lui :
 * une autre voix, donc une autre ecriture. La regle est celle de layout.tsx
 * (« une voix ne s'ecrit pas dans la fonte de l'interface »). Une seule ligne,
 * sinon ça devient une carte de voeux.
 *
 * DROITE, PAS EN ITALIQUE. Seul le romain est charge : un italique demande
 * ici serait fabrique par le navigateur en penchant les lettres, et une
 * Playfair penchee a la main se voit tout de suite.
 */
export function StylesBoutiqueTable() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .bt{--bt-fond:#120C09;--bt-nappe:#1C1411;--bt-creme:#FFF4E6;
          --bt-gris:#CDB8A4;--bt-ambre:#F5A23A;--bt-rose:#FF2E9A;
          --bt-trait:rgba(255,196,140,.14);
          --bt-nav:calc(62px + env(safe-area-inset-bottom,0px));
          --bt-maq:0px;
          --bt-dw:clamp(150px,44vw,214px);
          /* LE COIN DE « ON DISCUTE ? ». Mesure a l'ecran : pose par-dessus,
             le double couvrait le bouton rose de deux ecrans sur trois. Le bas
             de chaque ecran lui est donc reserve — les boutons s'arretent
             au-dessus, et seules des lignes courtes y descendent. */
          --bt-coin:98px;
          position:fixed;inset:0;overflow:hidden;
          background:var(--bt-fond);color:var(--bt-creme);
          font-family:var(--font-geist-sans),system-ui,sans-serif;
          -webkit-font-smoothing:antialiased;}
        .bt.avec-maq{--bt-maq:30px;}
        /* LE FOND DE LA FENETRE, sur ordinateur, autour du telephone. */
        body{background:#0B0806;}
        /* :WHERE, ET C'EST TOUTE LA DIFFERENCE. Ecrite « .bt button », cette regle
           pesait plus lourd que « .bt-go » et rendait la police heritee a tous
           les boutons : les roses sortaient en Geist maigre au lieu de la
           Poppins grasse. Vu a l'ecran. :where ne pese rien, donc chaque
           bouton garde sa police a lui. */
        :where(.bt) button,:where(.bt) a{font:inherit;color:inherit;
          -webkit-tap-highlight-color:transparent;}

        /* LE SELECTEUR DE MAQUETTE : une ligne, discrete, au-dessus de tout. */
        .bt-maq{position:absolute;top:0;left:0;right:0;height:30px;z-index:30;
          display:flex;align-items:center;justify-content:center;gap:8px;
          font-size:11px;color:var(--bt-gris);background:#0B0806;
          border-bottom:1px solid var(--bt-trait);}
        .bt-maq select{background:transparent;color:var(--bt-creme);border:0;
          font:inherit;font-weight:600;max-width:60vw;}

        /* ═══ UN ECRAN = UN ONGLET ═══════════════════════════════════════ */
        .bt-ecran{position:absolute;left:0;right:0;top:var(--bt-maq);
          bottom:var(--bt-nav);display:flex;flex-direction:column;
          animation:btEntre .32s ease both;
          /* TOUT ECRAN PEUT DEFILER, MEME CEUX DESSINES POUR TENIR. Mesure a
             360 x 740 : la carte d'un restaurant qui n'a rien saisi porte une
             ligne d'explication de plus, et la nappe sortait par le bas —
             coupee net, son bouton rose atterrissait sous le double. Un ecran
             qui ne defile pas perd ce qui depasse ; un ecran qui defile ne
             perd rien. Quand tout tient, rien ne bouge. */
          overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;
          -webkit-overflow-scrolling:touch;}
        @keyframes btEntre{from{opacity:0;transform:translateY(8px);}
          to{opacity:1;transform:none;}}
        @media (prefers-reduced-motion: reduce){.bt-ecran{animation:none;}}

        /* ═══ L'ETALONNAGE AMBRE — la photo reste la sienne ══════════════
           LE PREMIER ESSAI ETAIT UN FILTRE CSS — sepia, saturation, halo — et
           il ne tenait pas sur une vraie photo : la devanture d'un vrai bar de Dax,
           prise a midi, ciel bleu franc et murs blancs — le ciel restait bleu.
           Quatre reglages compares cote a cote, aucun ne changeait l'heure.
           C'EST UN MAPPAGE DE DEGRADE, voir #bt-ambre dans boutique-table.tsx :
           chaque pixel est ramene sur une echelle brun, cuivre, miel, creme
           selon sa seule luminosite, puis melange a 65 % avec l'original. Le
           ciel bleu devient creme parce qu'il est clair, pas parce qu'on l'a
           visé. Les 35 % d'origine gardent ce qui compte : les portes rouges
           restent rouges, et un gratin reste un gratin — le tritone pur, lui,
           rendait les lasagnes grises.
           LE HALO, PAR-DESSUS, POSE LA LUMIERE EN BAS : la ou est la porte et
           ou se tient le double. Le pourtour s'assombrit, le texte ressort. */
        .bt-photo{position:absolute;inset:0;z-index:0;background-size:cover;
          background-position:center 40%;filter:url(#bt-ambre);}
        .bt-photo::after{content:"";position:absolute;inset:0;
          background:radial-gradient(72% 50% at 50% 72%,rgba(255,176,90,.26),transparent 70%),
            radial-gradient(140% 100% at 50% 55%,transparent 45%,rgba(10,5,3,.55) 100%);}
        .bt-rdv-i,.bt-galerie span,.bt-note-g img{filter:url(#bt-ambre);}
        /* ═══ LA FAÇADE PASSE AU SOIR ═══════════════════════════════════════
           « Note la difference entre ta realisation et la mienne : les
           couleurs. » La sienne est une scene du soir : facade dans l'ombre,
           lumiere qui sort de la porte, ciel violine. Un filtre ne deplace pas
           le soleil, mais il peut faire tomber le jour : la courbe de
           #bt-soir enfonce les murs et dore le pave, et ce voile pose le ciel
           de fin de journee en haut. La lumiere, elle, arrive avec le double. */
        .bt-photo.facade{filter:url(#bt-soir);}
        .bt-photo.facade::after{background:
          radial-gradient(130% 95% at 50% 60%,transparent 42%,rgba(8,3,1,.72) 100%);}
        .bt-e-lieu .bt-voile::before,.bt-hero .bt-voile::before{content:"";position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(62,24,92,.62) 0%,rgba(150,60,72,.26) 24%,transparent 50%);
          mix-blend-mode:multiply;}
        /* ═══ LA PHOTO CLIKME GARDE SA LUMIERE ══════════════════════════════
           Elle sort du rendu deja doree, fantomes compris : ni filtre du soir,
           ni ciel violine, ni halo en bas. On ne garde que le voile qui tient
           le titre et le bouton lisibles. */
        .bt-photo.clikme{filter:none;background-position:center 45%;}
        .bt-photo.clikme::after{background:none;}
        .a-couv .bt-voile::before{display:none;}
        /* MAIS LE TITRE Y TOMBE SUR L'ENSEIGNE. Vu au premier rendu : une
           photo ClikMe est claire et pleine jusqu'en haut — auvent, lettres
           peintes —, et « Bienvenue au … » se lisait par-dessus le nom
           peint sur l'auvent. Le haut descend donc plus sombre et plus bas que
           sur une photo du soir. */
        .a-couv .bt-voile.haut-bas{background:linear-gradient(180deg,
          rgba(18,12,9,.9) 0%,rgba(18,12,9,.72) 22%,rgba(18,12,9,.3) 40%,rgba(18,12,9,0) 52%,
          rgba(18,12,9,0) 66%,rgba(18,12,9,.55) 84%,rgba(18,12,9,.92) 100%);}
        .bt-photo.haute{bottom:auto;height:60%;}
        .bt-voile{position:absolute;inset:0;z-index:0;pointer-events:none;}
        .bt-voile.haut-bas{background:linear-gradient(180deg,
          rgba(18,12,9,.82) 0%,rgba(18,12,9,.36) 22%,rgba(18,12,9,0) 42%,
          rgba(18,12,9,0) 62%,rgba(18,12,9,.55) 82%,rgba(18,12,9,.9) 100%);}
        .bt-voile.haut{bottom:auto;height:60%;background:linear-gradient(180deg,
          rgba(18,12,9,.78) 0%,rgba(18,12,9,.2) 30%,rgba(18,12,9,.1) 60%,
          var(--bt-fond) 100%);}
        /* LE TITRE DES INFOS EST EN BAS A GAUCHE, ET LE VOILE AUSSI. Mesure par la
           garde des contrastes : sur la photo tres claire d'une boulangerie,
           « On se retrouve ici ? » tombait a un ecart de 26 — creme sur creme.
           Le voile descend donc franchement sur le coin du titre, et remonte
           en diagonale pour laisser la devanture visible en haut a droite. */
        .bt-voile.gauche{background:
          linear-gradient(90deg,rgba(18,12,9,.86) 0%,rgba(18,12,9,.62) 42%,rgba(18,12,9,.12) 72%,rgba(18,12,9,0) 86%),
          linear-gradient(180deg,rgba(18,12,9,.2) 0%,rgba(18,12,9,0) 30%,rgba(18,12,9,0) 58%,var(--bt-fond) 100%);}

        /* ═══ L'EN-TETE ═════════════════════════════════════════════════ */
        .bt-haut{position:relative;z-index:3;flex:none;
          display:grid;grid-template-columns:minmax(40px,1fr) minmax(0,auto) minmax(40px,1fr);align-items:center;
          padding:calc(10px + env(safe-area-inset-top,0px)) 14px 0;}
        .bt-haut.plein{padding-bottom:10px;border-bottom:1px solid var(--bt-trait);
          background:var(--bt-fond);}
        .bt-rond{width:40px;height:40px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:rgba(18,12,9,.38);border:1px solid rgba(255,244,230,.16);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          cursor:pointer;text-decoration:none;}
        .bt-rond.vide{background:none;border:0;backdrop-filter:none;-webkit-backdrop-filter:none;}
        .bt-rond svg{width:22px;height:22px;fill:none;stroke:currentColor;
          stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
        .bt-rond.cadenas svg{width:22px;height:22px;opacity:.85;}
        .bt-marque{display:flex;flex-direction:column;align-items:center;
          gap:2px;text-align:center;min-width:0;
          text-shadow:0 1px 10px rgba(0,0,0,.7);}
        .bt-mot{height:20px;width:auto;}
        .bt-mot.petit{height:14px;opacity:.9;}
        .bt-marque b{font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:16px;letter-spacing:-.01em;max-width:100%;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .bt-marque b.grand{font-size:clamp(19px,5.4vw,23px);letter-spacing:-.02em;}
        .bt-marque em{font-style:normal;font-size:13px;color:var(--bt-gris);}

        /* ═══ LES TITRES ════════════════════════════════════════════════ */
        .bt-titre{position:relative;margin:0;
          font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(32px,9.6vw,42px);line-height:1.04;letter-spacing:-.03em;
          text-shadow:0 2px 18px rgba(0,0,0,.75);}
        .bt-titre.moyen{font-size:clamp(27px,8vw,34px);}
        /* DES LIGNES DE LONGUEUR EGALE : un nom en deux mots
           (« Bienvenue a La / Maison. ») laissait un mot du nom en bout de
           premiere ligne. */
        .bt-titre{text-wrap:balance;}
        .bt-titre.centre{text-align:center;}
        .bt-dit{margin:10px 0 0;font-family:var(--font-enseigne),Georgia,serif;
          font-style:normal;font-size:clamp(19px,5.4vw,23px);font-weight:500;
          color:#FFE3C4;text-shadow:0 1px 12px rgba(0,0,0,.8);}
        .bt-sous{margin:6px 0 0;font-size:15px;color:var(--bt-gris);
          text-shadow:0 1px 10px rgba(0,0,0,.8);}
        .bt-tete{position:relative;z-index:2;padding:16px 22px 0;}
        .bt-tete.centre{text-align:center;}

        /* ═══ 1 · LE LIEU ═══════════════════════════════════════════════ */
        .bt-accueil{position:relative;z-index:2;padding:6vh 22px 0;}
        .bt-seuil{position:relative;z-index:2;margin-top:auto;
          display:flex;flex-direction:column;align-items:center;
          padding:0 22px 14px;}
        /* LE DOUBLE S'ACCOUDE A LA PLAQUE « ENTRER ». Son buste s'arrete net a
           90 % de l'image : la plaque passe devant cette coupe. Voir l'en-tete
           de boutique-table.tsx, point 3. */
        .bt-double{position:relative;z-index:1;display:block;
          width:var(--bt-dw);height:auto;pointer-events:none;
          margin-bottom:calc(var(--bt-dw) * -.2);
          filter:drop-shadow(0 10px 22px rgba(0,0,0,.45));}
        .bt-double.gauche{margin-left:4%;margin-right:auto;}
        .bt-double.droite{margin-left:auto;margin-right:2%;}
        .bt-double.centre{margin-left:auto;margin-right:auto;}
        /* LE DOUBLE SUR LE SEUIL. Trois couches : la lumiere de la salle
           derriere lui (en ecran, elle eclaire la photo au lieu de la couvrir),
           le double lui-meme, et sa lueur au sol — c'est elle qui le pose sur
           le pave au lieu de le faire flotter. Le bas de la pose est fondu :
           un fantome n'a pas de jambes, il n'a pas de coupe nette non plus. */
        .bt-accueille{position:relative;z-index:1;display:block;
          width:var(--bt-dw);margin:0 auto 18px;}
        .bt-accueille::before{content:"";position:absolute;z-index:-1;
          left:50%;top:44%;width:240%;height:150%;transform:translate(-50%,-50%);
          background:radial-gradient(closest-side,rgba(255,196,110,.78),
            rgba(255,150,60,.34) 46%,rgba(255,120,40,0) 100%);
          mix-blend-mode:screen;pointer-events:none;}
        .bt-accueille::after{content:"";position:absolute;z-index:-1;
          left:50%;bottom:-4%;width:120%;height:22%;transform:translateX(-50%);
          background:radial-gradient(closest-side,rgba(255,190,110,.6),rgba(255,150,70,0));
          mix-blend-mode:screen;pointer-events:none;}
        .bt-accueille .bt-double{width:100%;margin:0;
          -webkit-mask-image:linear-gradient(180deg,#000 66%,rgba(0,0,0,.55) 82%,transparent 96%);
          mask-image:linear-gradient(180deg,#000 66%,rgba(0,0,0,.55) 82%,transparent 96%);
          filter:drop-shadow(0 0 22px rgba(255,170,80,.45)) drop-shadow(0 8px 18px rgba(0,0,0,.35));
          animation:btSouffle 4.2s ease-in-out infinite;}
        @keyframes btSouffle{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
        @media (prefers-reduced-motion: reduce){.bt-accueille .bt-double{animation:none;}}
        .bt-entrer{position:relative;z-index:2;
          display:flex;align-items:center;justify-content:center;gap:12px;
          width:min(52%,250px);padding:15px 22px;border-radius:999px;cursor:pointer;
          font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:20px;
          letter-spacing:-.01em;
          background:rgba(28,20,17,.9);border:1.5px solid rgba(255,244,230,.28);
          box-shadow:0 12px 30px -10px rgba(0,0,0,.8);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .bt-entrer s{text-decoration:none;color:var(--bt-rose);}
        /* DEUX PORTES SUR UNE LIGNE CHACUNE : « Découvrir le lieu » passait
           sur deux lignes dans la largeur d'« Entrer ». ET À GAUCHE DU COIN :
           élargies au centre, elles passaient sous le double « On discute ? ».
           Elles s'alignent donc à gauche et s'arrêtent avant lui. */
        .bt-e-lieu .bt-seuil{align-items:flex-start;}
        .bt-e-lieu .bt-accueille{align-self:center;}
        .bt-e-lieu .bt-entrer{width:calc(100% - var(--bt-coin) + 14px);max-width:330px;
          white-space:nowrap;font-size:17.5px;padding:14px 18px;}
        .bt-e-lieu .bt-entrer.second{font-size:16px;padding:12px 18px;}
        /* LA SECONDE PORTE : « Carte et prix », plus discrète, juste dessous. */
        .bt-entrer.second{margin-top:10px;padding:12px 20px;font-size:17px;font-weight:700;
          background:rgba(18,12,9,.55);border-color:rgba(255,244,230,.4);}
        .bt-entrer.second .bt-ico{width:22px;height:22px;fill:none;stroke:currentColor;
          stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
        .bt-entrer.second s{color:var(--bt-creme);font-size:20px;}
        .bt-liens{display:flex;align-items:center;gap:10px;margin:12px 0 0;
          font-size:15px;}
        .bt-liens button{background:none;border:0;padding:4px 2px;cursor:pointer;
          text-decoration:underline;text-underline-offset:4px;
          text-decoration-color:rgba(255,244,230,.5);}
        .bt-liens i{font-style:normal;color:var(--bt-gris);}

        /* ═══ LA SCENE ET LA NAPPE ══════════════════════════════════════
           La nappe monte du bas, arrondie en haut, et passe DEVANT le buste du
           double. C'est la meme mise en scene sur quatre onglets. */
        .bt-scene{position:relative;z-index:2;margin-top:auto;
          display:flex;flex-direction:column;}
        .bt-nappe{position:relative;z-index:2;
          padding:18px 18px var(--bt-coin);border-radius:30px 30px 0 0;
          background:linear-gradient(180deg,rgba(30,21,17,.97),var(--bt-nappe) 30%,var(--bt-fond));
          border-top:1px solid var(--bt-trait);
          box-shadow:0 -18px 40px -20px rgba(0,0,0,.8);}

        /* ═══ LES PASTILLES RONDES ══════════════════════════════════════ */
        .bt-pastille{flex:none;width:54px;height:54px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:radial-gradient(circle at 50% 35%,#3A2B24,#221815);
          border:1px solid var(--bt-trait);}
        .bt-pastille svg{width:26px;height:26px;fill:none;stroke:var(--bt-creme);
          stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}
        .bt-pastille .bt-ico{width:24px;height:24px;}

        /* ═══ 2 · L'EXPERIENCE ══════════════════════════════════════════ */
        .bt-trois{display:flex;justify-content:space-around;gap:6px;}
        .bt-trois button{flex:1 1 0;min-width:0;
          display:flex;flex-direction:column;align-items:center;gap:8px;
          background:none;border:0;cursor:pointer;font-size:14.5px;}
        .bt-trois button+button{border-left:1px solid var(--bt-trait);}

        /* ═══ LES BOUTONS — un seul rose par ecran ══════════════════════ */
        .bt-go{display:flex;align-items:center;justify-content:center;gap:12px;
          width:100%;margin:16px 0 0;padding:15px 20px;border:0;border-radius:999px;
          cursor:pointer;text-decoration:none;
          font-family:var(--font-clikme),sans-serif;font-weight:600;
          font-size:clamp(15.5px,4.4vw,17.5px);letter-spacing:0;color:#fff;
          white-space:nowrap;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 12px 30px -12px rgba(255,46,154,.85);}
        .bt-go s{text-decoration:none;}
        .bt-go:active,.bt-deux:active,.bt-entrer:active{transform:scale(.98);}
        /* LE BOUTON ROSE EN 600, PAS EN 800. Mesure a l'ecran : en 800, « Voir
           les avis sur Google » debordait du bouton des qu'il se retrecissait
           a cote du double. Sa maquette les dessine d'ailleurs en demi-gras :
           un bouton n'a pas a crier plus fort que le titre au-dessus. */
        .bt-deux{display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;margin:10px 0 0;padding:13px 18px;border-radius:999px;
          cursor:pointer;text-decoration:none;font-size:15.5px;font-weight:500;
          white-space:nowrap;
          background:rgba(255,244,230,.035);border:1px solid rgba(255,244,230,.2);}
        .bt-duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;}
        .bt-duo .bt-deux,.bt-duo .bt-go{margin:0;}
        .bt-duo .bt-go{font-size:16px;padding:13px 14px;}
        .bt-duo.seul{grid-template-columns:1fr;}
        .bt-duo .bt-deux{padding:13px 10px;font-size:15px;white-space:nowrap;}
        /* LES ECRANS QUI DEFILENT GARDENT LE DOUBLE A COTE DE LEUR DERNIER
           GESTE, comme sa maquette des avis : les boutons de fin laissent la
           place au coin plutot que de passer dessous. */
        .bt-e-avis .bt-go,.bt-e-avis .bt-deux,.bt-e-infos .bt-autour{
          width:calc(100% - 92px);padding-left:14px;padding-right:14px;}
        .bt-ico{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        /* LES LIGNES COURTES DU BAS RESTENT A GAUCHE DU COIN : centrees mais
           etroites, elles ne passent jamais sous le double. */
        .bt-apres,.bt-note,.bt-lien{max-width:calc(100% - 190px);
          margin-left:auto;margin-right:auto;}
        .bt-apres{margin-top:10px;margin-bottom:0;text-align:center;font-size:14px;
          color:var(--bt-gris);}
        .bt-note{display:flex;align-items:center;justify-content:center;gap:6px;
          margin-top:10px;margin-bottom:0;text-align:center;font-size:12.5px;color:rgba(205,184,164,.8);}
        .bt-note i{font-style:normal;}
        .bt-lien{display:block;margin-top:10px;background:none;border:0;
          cursor:pointer;color:var(--bt-rose);font-size:15px;font-weight:600;
          text-decoration:underline;text-underline-offset:4px;}
        .bt-vide{margin:6px 0 0;text-align:center;color:var(--bt-gris);font-size:15px;}

        /* ═══ 3 · LA CARTE ══════════════════════════════════════════════ */
        .bt-onglet-titre{text-align:center;margin:-2px 0 12px;}
        .bt-lignes{list-style:none;margin:0;padding:0;
          display:flex;flex-direction:column;gap:9px;}
        .bt-lignes button,.bt-fiche a,.bt-fiche .bt-li{width:100%;
          display:flex;align-items:center;gap:14px;text-align:left;
          padding:9px 14px 9px 10px;border-radius:18px;cursor:pointer;
          text-decoration:none;
          background:rgba(255,244,230,.04);border:1px solid var(--bt-trait);}
        .bt-fiche .bt-li{cursor:default;}
        .bt-ligne-t{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:2px;}
        .bt-ligne-t b{font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:16.5px;letter-spacing:-.01em;}
        .bt-ligne-t em{font-style:normal;font-size:14px;color:var(--bt-gris);}
        .bt-ligne-t small{font-size:12.5px;color:rgba(205,184,164,.8);}
        .bt-lignes s,.bt-fiche s{flex:none;text-decoration:none;font-size:26px;
          line-height:1;color:var(--bt-gris);}
        .bt-prix{flex:none;text-decoration:none;font-weight:700;color:var(--bt-ambre);}

        /* ═══ 4 · LES AVIS ══════════════════════════════════════════════ */
        .bt-corps{position:relative;z-index:2;padding:12px 16px var(--bt-coin);}
        .bt-e-avis .bt-corps{padding-top:16px;}
        .bt-e-avis .bt-titre{margin:4px 0 16px;}
        .bt-note-g{display:flex;align-items:center;gap:14px;padding:10px;
          border-radius:20px;background:rgba(28,20,17,.9);
          border:1px solid rgba(255,244,230,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .bt-note-g img{flex:none;width:36%;max-width:150px;aspect-ratio:1.4;
          object-fit:cover;border-radius:12px;}
        .bt-note-g p{margin:0 0 6px;font-size:15px;color:var(--bt-gris);}
        .bt-note-g p b{font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:34px;color:var(--bt-creme);letter-spacing:-.02em;}
        .bt-etoiles{display:inline-flex;gap:2px;}
        .bt-avis{display:flex;gap:12px;margin-top:10px;padding:14px;
          border-radius:20px;background:var(--bt-nappe);
          border:1px solid var(--bt-trait);}
        .bt-initiales{flex:none;width:46px;height:46px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-weight:600;font-size:17px;color:#FFF4E6;
          background:linear-gradient(150deg,#A8683A,#7A4526);}
        .bt-avis-qui{margin:0 0 3px;font-size:14px;color:var(--bt-gris);}
        .bt-avis-qui b{color:var(--bt-creme);font-weight:600;font-size:15px;}
        .bt-avis blockquote{margin:7px 0 0;font-size:15.5px;line-height:1.4;}

        /* ═══ 5 · LES AMIS ══════════════════════════════════════════════ */
        .bt-e-amis .bt-corps{flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;
          padding-bottom:12px;}
        /* LA FENETRE : sur un telephone elle EST l'ecran ; elle ne devient une
           fenetre flottante que sur un ordinateur (plus bas). */
        .bt-fenetre{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
        /* L'EN-TETE D'UNE CONVERSATION DE GROUPE : retour, la pastille du lieu,
           le nom du salon et son cadenas — aligne a gauche, comme partout. */
        .bt-haut.bt-chat-tete{grid-template-columns:40px 44px minmax(0,1fr);gap:10px;
          padding-top:calc(8px + env(safe-area-inset-top,0px));padding-bottom:10px;
          background:var(--bt-nappe);}
        .bt-ava{width:44px;height:44px;border-radius:50%;background-size:cover;
          background-position:center;border:2px solid rgba(245,162,58,.55);
          display:flex;align-items:center;justify-content:center;
          font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:18px;}
        .bt-ava.vide{background:linear-gradient(150deg,#A8683A,#7A4526);}
        .bt-chat-qui{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .bt-chat-qui b{font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:17px;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .bt-chat-qui em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:13px;color:var(--bt-gris);white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .bt-chat-qui svg{flex:none;width:13px;height:13px;fill:none;stroke:currentColor;
          stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
        /* LE RENDEZ-VOUS EPINGLE : une bande, pas une banniere photo. */
        .bt-rdv{border-radius:18px;overflow:hidden;border:1px solid rgba(245,162,58,.28);
          background:linear-gradient(180deg,rgba(245,162,58,.10),rgba(245,162,58,.04));}
        .bt-rdv-i{display:flex;align-items:center;gap:10px;padding:11px 10px 11px 14px;}
        .bt-rdv-i>.bt-ico{flex:none;width:20px;height:20px;color:var(--bt-ambre);}
        .bt-rdv-i>div{flex:1 1 auto;min-width:0;}
        .bt-rdv-i b{display:block;font-family:var(--font-clikme),sans-serif;
          font-weight:800;font-size:16px;letter-spacing:-.01em;}
        .bt-rdv-i em{display:block;font-style:normal;font-size:13px;color:#FFE3C4;
          margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .bt-rdv-i button{flex:none;padding:8px 12px;border-radius:999px;cursor:pointer;
          font-size:13.5px;font-weight:600;background:rgba(12,8,6,.55);
          border:1px solid rgba(255,244,230,.24);white-space:nowrap;}
        .bt-rdv-b{display:grid;grid-template-columns:1fr 1fr;
          border-top:1px solid rgba(245,162,58,.18);}
        .bt-rdv-b button{display:flex;align-items:center;justify-content:center;gap:7px;
          padding:10px 8px;background:none;border:0;cursor:pointer;font-size:14px;
          font-weight:600;white-space:nowrap;}
        .bt-rdv-b button:first-child{color:var(--bt-rose);
          border-right:1px solid var(--bt-trait);}
        .bt-rdv-b button:first-child b{font-size:20px;line-height:1;}
        .bt-rdv-b s{text-decoration:none;}
        .bt-qui{display:flex;align-items:center;gap:10px;margin:12px 0 2px;}
        .bt-tetes{display:flex;flex:none;}
        .bt-tetes i{width:34px;height:34px;border-radius:50%;margin-left:-8px;
          display:flex;align-items:center;justify-content:center;font-style:normal;
          font-weight:700;font-size:14px;color:#1A120E;border:2px solid var(--bt-fond);}
        .bt-tetes i:first-child{margin-left:0;}
        .bt-tetes i.t0{background:#F5C542;} .bt-tetes i.t1{background:#F06BB4;}
        .bt-tetes i.t2{background:#5BE0B0;} .bt-tetes i.t3{background:#8FA3FF;}
        .bt-tetes i.t4{background:#F5A23A;}
        .bt-tetes i.peut{background:#3A2E28;color:var(--bt-creme);}
        .bt-qui-t{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;}
        .bt-qui-t b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:17px;}
        .bt-qui-t em{font-style:normal;font-size:13.5px;color:var(--bt-gris);}
        .bt-viens{flex:none;padding:10px 16px;border-radius:999px;cursor:pointer;
          font-weight:700;font-size:15px;color:var(--bt-rose);
          background:none;border:1.5px solid var(--bt-rose);}
        .bt-viens.on{background:var(--bt-rose);color:#fff;}
        .bt-trait{display:flex;align-items:center;gap:10px;margin:10px 0 6px;
          font-size:12.5px;color:var(--bt-gris);}
        .bt-trait::before,.bt-trait::after{content:"";flex:1;height:1px;
          background:var(--bt-trait);}
        .bt-fil{display:flex;flex-direction:column;gap:6px;}
        .bt-rubrique{margin:14px 4px 6px;font-size:12px;font-weight:700;letter-spacing:.1em;
          text-transform:uppercase;color:var(--bt-ambre);}
        .bt-menu-g{margin:12px 0 8px;width:100%;justify-content:center;}
        .bt-services{margin:12px 2px 0;font-size:14px;line-height:1.45;color:var(--bt-gris);}
        .bt-services b{display:block;margin-bottom:2px;color:var(--bt-creme);font-weight:700;}
        .bt-salon-vide{display:flex;flex-direction:column;align-items:center;gap:6px;
          margin:10px 0 4px;padding:18px 16px;text-align:center;border-radius:18px;
          border:1px dashed rgba(255,196,140,.22);}
        .bt-salon-vide span{font-size:26px;line-height:1;}
        .bt-salon-vide b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
        .bt-salon-vide p{margin:0;font-size:14px;color:var(--bt-gris);}
        .bt-salon-vide button{margin-top:6px;padding:9px 14px;border-radius:999px;cursor:pointer;
          font-size:14px;font-weight:600;color:var(--bt-creme);background:rgba(255,46,154,.14);
          border:1px solid rgba(255,46,154,.45);}
        .bt-msg{display:flex;align-items:flex-end;gap:8px;max-width:86%;}
        .bt-msg.moi{align-self:flex-end;flex-direction:row-reverse;}
        .bt-av{flex:none;width:30px;height:30px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-style:normal;
          font-weight:700;font-size:13px;color:#1A120E;background:#F06BB4;}
        .bt-msg small{display:block;margin:0 0 3px 4px;font-size:12px;color:var(--bt-gris);}
        .bt-msg.moi small{text-align:right;margin:0 4px 3px 0;}
        .bt-msg small span{opacity:.75;margin-left:4px;}
        .bt-msg p{margin:0;padding:8px 13px;border-radius:18px 18px 18px 6px;
          font-size:15.5px;line-height:1.35;background:#2A1F1B;}
        .bt-msg.moi p{border-radius:18px 18px 6px 18px;background:var(--bt-rose);color:#fff;}
        /* LE FIL SE POSE EN BAS, CONTRE LA SAISIE, comme dans toute messagerie :
           le rendez-vous reste epingle en haut, le vide va entre les deux. */
        .bt-e-amis .bt-corps{display:flex;flex-direction:column;}
        .bt-e-amis .bt-corps>*{flex:none;}
        .bt-e-amis .bt-corps>.bt-trait{margin-top:auto;padding-top:10px;}
        .bt-e-amis .bt-duo{margin-top:12px;}
        .bt-e-amis .bt-note{max-width:none;}
        .bt-ecrire{flex:none;display:flex;align-items:center;gap:10px;
          padding:10px 14px;border-top:1px solid var(--bt-trait);background:var(--bt-fond);}
        .bt-ecrire input{flex:1 1 auto;min-width:0;padding:12px 18px;border-radius:999px;
          font:inherit;font-size:16px;color:var(--bt-creme);
          background:rgba(255,244,230,.05);border:1px solid rgba(255,244,230,.16);}
        .bt-ecrire input::placeholder{color:rgba(205,184,164,.7);}
        .bt-ecrire button{flex:none;width:46px;height:46px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          background:var(--bt-rose);border:0;color:#fff;}
        .bt-ecrire button:disabled{background:#3A2E28;color:var(--bt-gris);}
        .bt-ecrire svg{width:22px;height:22px;fill:none;stroke:currentColor;
          stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}

        /* ═══ 6 · LES INFOS ═════════════════════════════════════════════ */
        .bt-hero{position:relative;flex:none;height:clamp(180px,27vh,250px);
          margin-top:8px;display:flex;align-items:flex-end;overflow:hidden;}
        .bt-hero .bt-titre{position:relative;z-index:2;padding:0 0 26px 20px;
          max-width:62%;}
        .bt-hero .bt-double{position:absolute;right:2%;bottom:-14%;z-index:2;
          width:clamp(120px,36vw,170px);margin:0;}
        .bt-fiche{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
        .bt-fiche .bt-pastille{width:44px;height:44px;}
        .bt-fiche a,.bt-fiche .bt-li{padding:7px 14px 7px 8px;}
        .bt-fiche .bt-ligne-t b{font-size:15.5px;}
        .bt-e-infos .bt-go{margin-top:12px;}
        .bt-h2{margin:16px 0 8px;font-family:var(--font-clikme),sans-serif;
          font-weight:800;font-size:20px;letter-spacing:-.01em;}
        .bt-galerie{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .bt-galerie button{padding:0;border:0;border-radius:14px;overflow:hidden;cursor:pointer;}
        .bt-galerie span{display:block;aspect-ratio:1.25;background-size:cover;
          background-position:center;}
        .bt-autour{display:flex;align-items:center;gap:12px;margin:14px 0 0;
          padding:13px 16px;border-radius:16px;text-decoration:none;font-size:15px;
          background:rgba(255,244,230,.035);border:1px solid var(--bt-trait);}
        .bt-autour s{margin-left:auto;text-decoration:none;font-size:22px;color:var(--bt-gris);}

        /* ═══ « ON DISCUTE ? » — le double, en coin ═════════════════════ */
        .bt-discute{position:absolute;z-index:20;right:12px;
          bottom:calc(var(--bt-nav) + 12px);
          display:flex;flex-direction:column;align-items:center;gap:0;
          padding:0;background:none;border:0;cursor:pointer;
          animation:btFlotte 3.4s ease-in-out infinite;}
        .bt-discute img{width:60px;height:60px;border-radius:50%;object-fit:cover;
          object-position:50% 16%;transform:scale(1);
          background:radial-gradient(circle at 50% 40%,#3A2419,#1A0E09);
          box-shadow:0 0 0 2.5px var(--bt-ambre),0 10px 26px rgba(0,0,0,.5),
            0 0 22px rgba(245,162,58,.4);}
        .bt-discute span{margin-top:-8px;padding:4px 10px;border-radius:999px;
          font-size:12px;font-weight:600;white-space:nowrap;
          background:#1A120E;border:1px solid rgba(255,244,230,.28);}
        @keyframes btFlotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
        @media (prefers-reduced-motion: reduce){.bt-discute{animation:none;}}
        /* SUR L'ECRAN DU LIEU, LE DOUBLE EST DEJA LA EN GRAND : le coin se fait
           plus petit, pour ne pas faire deux personnages de la meme taille. */
        .bt-lieu .bt-discute img{width:54px;height:54px;}
        /* SUR UN TELEPHONE ETROIT, LE COIN PERD SA LEGENDE. Mesure a 360 : la
           pastille « On discute ? » faisait cent points de large et mordait la
           plaque « Entrer » comme le bouton rose de la carte. Le rond seul
           suffit — c'est le meme double que celui de l'ecran, on le reconnait. */
        @media (max-width: 380px){
          .bt-deux{font-size:14.5px;gap:8px;}
          .bt-discute span{display:none;}
          .bt-discute img{width:54px;height:54px;}
          .bt{--bt-coin:84px;}
        }

        /* LA PASTILLE DU COMMERÇANT. Ambre, pas rose : le rose est le geste
           du client sur chaque ecran, et celle-ci ne s'adresse qu'a lui. */
        .bt-garder{position:absolute;z-index:26;right:12px;
          top:calc(var(--bt-maq) + 12px + env(safe-area-inset-top,0px));
          padding:8px 14px;border-radius:999px;cursor:pointer;border:0;
          font:inherit;font-size:13px;font-weight:700;color:#1A0F08;
          background:linear-gradient(140deg,#FFC66B,#F5A23A);
          box-shadow:0 8px 22px -8px rgba(245,162,58,.9);}
        /* SUR LE SALON D'UN TELEPHONE, ELLE SE RETIRE : elle tombait sur
           l'en-tete de la conversation. Les cinq autres onglets la gardent. */
        @media (max-width: 959px){.bt-garder{display:none;}}
        .bt-garder-tete{justify-self:start;padding:8px 12px;border-radius:999px;cursor:pointer;
          border:0;font:inherit;font-size:12.5px;font-weight:700;color:#1A0F08;white-space:nowrap;
          background:linear-gradient(140deg,#FFC66B,#F5A23A);
          box-shadow:0 8px 22px -8px rgba(245,162,58,.9);}
        @media (min-width: 960px){.bt-garder-tete{visibility:hidden;}}
        .bt-pied{margin-top:22px;}

        /* ═══ LA BARRE COMMUNE ══════════════════════════════════════════ */
        .bt-nav{position:absolute;left:0;right:0;bottom:0;z-index:25;
          height:var(--bt-nav);display:grid;grid-template-columns:repeat(6,1fr);
          padding:0 4px env(safe-area-inset-bottom,0px);
          background:#0E0907;border-top:1px solid var(--bt-trait);}
        .bt-nav button,.bt-nav .bt-explorer{position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:4px;padding:0;
          background:none;border:0;cursor:pointer;color:#B9A594;
          font-size:11.5px;font-weight:500;}
        /* « EXPLORER MA VILLE » TIENT SUR DEUX LIGNES SUR UN PETIT TÉLÉPHONE,
           et garde l'ambre : c'est la seule sortie de la page. */
        .bt-nav .bt-explorer{text-decoration:none;text-align:center;line-height:1.1;color:var(--bt-ambre);}
        .bt-nav svg{width:24px;height:24px;fill:none;stroke:currentColor;
          stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
        .bt-nav button.on{color:var(--bt-rose);font-weight:600;}
        .bt-nav button.on svg{stroke-width:2;}
        .bt-nav button.on::after{content:"";position:absolute;bottom:4px;left:22%;
          right:22%;height:3px;border-radius:99px;background:var(--bt-rose);}

        /* ═══ LES COUCHES PAR-DESSUS — la conversation, le plat, les photos */
        .bt-couche{position:absolute;inset:0;z-index:60;background:var(--bt-fond);
          display:flex;align-items:stretch;justify-content:center;}
        .bt-tel{position:relative;width:100%;max-width:480px;height:100%;overflow:hidden;}
        .bt-visio{flex-direction:column;align-items:center;justify-content:center;
          background:rgba(8,5,4,.96);}
        .bt-visio-i{width:100%;flex:1 1 auto;padding:0;border:0;background:none;cursor:pointer;}
        .bt-visio-i span{display:block;width:100%;height:100%;background-size:contain;
          background-repeat:no-repeat;background-position:center;}
        .bt-visio p{margin:10px 0 calc(20px + env(safe-area-inset-bottom,0px));
          font-size:14px;color:var(--bt-gris);}
        .bt-rond.fermer{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));
          right:14px;color:var(--bt-creme);font-size:18px;}

        /* ═══ SUR UN PETIT TELEPHONE, ON SERRE ══════════════════════════ */
        @media (max-height: 740px){
          .bt{--bt-dw:clamp(130px,38vw,180px);}
          .bt-accueil{padding-top:3vh;}
          .bt-pastille{width:48px;height:48px;}
          /* LE BAS RESTE CELUI DU COIN. Cette regle ecrivait « 12px » en bas :
             elle ecrasait la reserve du double, et le bouton rose tombait pile
             dessous — mesure a 360 x 740. */
          .bt-nappe{padding:14px 16px var(--bt-coin);}
          .bt-go{margin-top:12px;padding:13px 18px;}
          .bt-lignes{gap:7px;}
          .bt-lignes button{padding:7px 12px 7px 8px;}
        }
        /* SUR UN ORDINATEUR, LA PAGE GARDE LA LARGEUR D'UN TELEPHONE — c'est un
           ecran dessine pour un pouce. Le reste de la fenetre est une salle
           sombre, et la page s'y tient comme un telephone pose sur la table. */
        @media (min-width: 620px) and (max-width: 959px){
          .bt{left:50%;right:auto;width:520px;transform:translateX(-50%);
            box-shadow:0 0 0 1px rgba(255,196,140,.1),0 30px 80px rgba(0,0,0,.6);}
          .bt{--bt-dw:200px;}
        }
        /* ═══ SUR UN ORDINATEUR, LA PAGE S'OUVRE EN DEUX ═══════════════════
           « La page du commerçant est tres etroite. Ne peut-on pas avoir une
           plus grande largeur en mode ordinateur, et garder cette verticalite
           pour les telephones ? »
           ELLE PREND TOUTE LA FENETRE, EN DEUX MOITIES. A gauche, la photo de
           l'onglet, en grand et sur toute la hauteur — la facade et son double,
           la salle, le plat. A droite, ce qu'on lit et ce qu'on touche. Ce n'est
           pas l'ecran du telephone etire : etirer une colonne faite pour un
           pouce sur mille quatre cents points donne des lignes illisibles et
           des boutons demesures. Chaque moitie garde la mesure de ce qu'elle
           porte. La barre commune reste en bas, centree. */
        @media (min-width: 960px){
          .bt{--bt-g:50%;--bt-dw:clamp(200px,17vw,260px);--bt-coin:24px;
            --bt-d:clamp(28px,4vw,72px);}
          .bt-photo,.bt-photo.haute,.bt-voile,.bt-voile.haut{right:auto;
            width:var(--bt-g);height:auto;bottom:0;}
          .bt-voile.haut-bas,.bt-voile.haut{background:linear-gradient(90deg,
            rgba(18,12,9,0) 60%,rgba(18,12,9,.55) 88%,var(--bt-fond) 100%),
            linear-gradient(180deg,rgba(18,12,9,.55) 0%,rgba(18,12,9,0) 26%,
            rgba(18,12,9,0) 70%,rgba(18,12,9,.6) 100%);}
          /* SUR UN ORDINATEUR, LE TITRE N'EST PLUS SUR LA PHOTO : la photo
             ClikMe reprend le voile leger des deux moities. */
          .a-couv .bt-voile.haut-bas{background:linear-gradient(90deg,
            rgba(18,12,9,0) 70%,rgba(18,12,9,.5) 92%,var(--bt-fond) 100%);}
          .bt-ecran>:not(.bt-photo):not(.bt-voile):not(.bt-hero):not(.bt-fenetre){
            margin-left:var(--bt-g);width:calc(100% - var(--bt-g));
            padding-left:var(--bt-d);padding-right:var(--bt-d);box-sizing:border-box;}
          .bt-ecran>*>*{max-width:600px;}
          .bt-haut{padding-left:var(--bt-d);padding-right:var(--bt-d);}
          /* LE LIEU : le titre et la porte a droite, le double sur la photo. */
          .bt-e-lieu{justify-content:center;}
          .bt-e-lieu .bt-haut{position:absolute;top:0;left:0;right:0;}
          .bt-e-lieu .bt-accueil{padding-top:0;}
          .bt-e-lieu .bt-titre{font-size:clamp(40px,3.6vw,58px);}
          .bt-e-lieu .bt-seuil{position:static;margin-top:34px;align-items:flex-start;}
          .bt-e-lieu .bt-accueille{position:absolute;left:calc(var(--bt-g) / 2);
            bottom:12%;margin:0;transform:translateX(-50%);}
          .bt-e-lieu .bt-entrer{width:auto;min-width:260px;font-size:19px;padding:15px 24px;}
          .bt-e-lieu .bt-entrer.second{font-size:17px;padding:13px 24px;}
          .bt-e-lieu .bt-liens{margin-left:24px;}
          /* LES ECRANS A NAPPE : la nappe flotte au milieu de la moitie droite. */
          .bt-e-exp,.bt-e-carte{justify-content:center;}
          .bt-e-exp .bt-scene,.bt-e-carte .bt-scene{margin-top:18px;}
          .bt-nappe{border-radius:30px;border:1px solid var(--bt-trait);
            padding-bottom:20px;}
          .bt-e-exp .bt-tete{padding-top:0;}
          .bt-e-exp .bt-haut,.bt-e-carte .bt-haut,.bt-e-avis .bt-haut{
            position:absolute;top:0;left:0;right:0;margin:0;width:auto;
            padding-left:calc(var(--bt-g) + var(--bt-d));}
          .bt-apres,.bt-note,.bt-lien{max-width:none;}
          .bt-e-avis .bt-go,.bt-e-avis .bt-deux,.bt-e-infos .bt-autour{width:100%;}
          .bt-e-avis .bt-corps{padding-top:84px;}
          /* LES AMIS : UNE FENETRE DE MESSAGERIE AU MILIEU DE L'ECRAN.
             La regle des deux moities ci-dessus la poussait dans la moitie
             droite, la gauche restant noire et vide : elle en est exclue. Le
             fond n'est qu'une lueur ambree, sans photo. */
          .bt-e-amis{align-items:center;justify-content:center;padding:28px 24px;
            background:radial-gradient(60% 55% at 50% 45%,rgba(245,162,58,.13),
              rgba(18,12,9,0) 70%),var(--bt-fond);}
          .bt-ecran.bt-e-amis>.bt-fenetre{margin:0;padding:0;flex:none;
            width:min(640px,100%);height:min(860px,100%);
            border-radius:28px;overflow:hidden;background:var(--bt-fond);
            border:1px solid rgba(255,196,140,.2);
            box-shadow:0 40px 100px -20px rgba(0,0,0,.85),
              0 0 0 8px rgba(245,162,58,.05);
            animation:btFenetre .34s cubic-bezier(.2,.8,.2,1) both;}
          .bt-e-amis .bt-fenetre>*{max-width:none;}
          .bt-e-amis .bt-haut.bt-chat-tete{padding:14px 18px;}
          .bt-e-amis .bt-corps{padding:14px 20px 12px;}
          .bt-e-amis .bt-ecrire{padding:12px 18px 14px;}
          @keyframes btFenetre{from{opacity:0;transform:translateY(14px) scale(.98);}
            to{opacity:1;transform:none;}}
          /* LES INFOS : le heros devient la moitie gauche, sur toute la hauteur. */
          /* FIXE, ET PAS POSE EN HAUT DE LA COLONNE : vu en descendant jusqu'au
             formulaire, la photo partait avec le texte et laissait la moitie
             gauche vide en bas. Elle reste a sa place, la colonne defile. */
          .bt-e-infos .bt-hero{position:fixed;left:0;top:var(--bt-maq);
            bottom:var(--bt-nav);width:50vw;height:auto;margin:0;}
          /* MAIS UN PARENT ANIME EN TRANSFORM RETIENT CE QUI EST FIXE : l'entree
             de l'ecran glisse de huit points, et l'animation laisse une
             transformation identite qui suffit a ramener la photo dans la
             colonne. L'ecran des infos entre donc en fondu seul. */
          .bt-e-infos{animation-name:btFondu;}
          @keyframes btFondu{from{opacity:0;}to{opacity:1;}}
          .bt-e-infos .bt-hero .bt-titre{padding:0 0 9vh var(--bt-d);
            font-size:clamp(40px,3.6vw,58px);}
          .bt-e-infos .bt-hero .bt-double{width:clamp(170px,15vw,230px);bottom:-6%;right:6%;}
          /* LE HEROS FAIT DEJA LA MOITIE : sa photo et son voile le remplissent,
             au lieu de reprendre « la moitie » a leur tour — vu a l'ecran, la
             facade ne couvrait plus qu'un quart de la fenetre. */
          .bt-e-infos .bt-hero .bt-photo,.bt-e-infos .bt-hero .bt-voile{width:auto;right:0;
            max-width:none;}
          .bt-garder{right:24px;}
          .bt-nav{grid-template-columns:repeat(6,minmax(0,124px));justify-content:center;}
        }
      `,
      }}
    />
  );
}
