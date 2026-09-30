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
          display:grid;grid-template-columns:40px 1fr 40px;align-items:center;
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
        .bt-entrer{position:relative;z-index:2;
          display:flex;align-items:center;justify-content:center;gap:12px;
          width:min(52%,250px);padding:15px 22px;border-radius:999px;cursor:pointer;
          font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:20px;
          letter-spacing:-.01em;
          background:rgba(28,20,17,.9);border:1.5px solid rgba(255,244,230,.28);
          box-shadow:0 12px 30px -10px rgba(0,0,0,.8);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .bt-entrer s{text-decoration:none;color:var(--bt-rose);}
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
        .bt-e-amis .bt-haut.plein{padding-top:calc(6px + env(safe-area-inset-top,0px));
          padding-bottom:8px;}
        .bt-e-amis .bt-marque b.grand{font-size:clamp(18px,5vw,21px);}
        .bt-e-amis .bt-marque em{font-size:12.5px;}
        .bt-rdv{border-radius:22px;overflow:hidden;border:1px solid var(--bt-trait);
          background:var(--bt-nappe);}
        .bt-rdv-i{position:relative;aspect-ratio:2.35 / 1;background-size:cover;
          background-position:center;display:flex;align-items:flex-end;
          justify-content:space-between;gap:10px;padding:12px 12px 12px 16px;}
        .bt-rdv-i::before{content:"";position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(18,12,9,0) 35%,rgba(18,12,9,.86));}
        .bt-rdv-i>*{position:relative;}
        .bt-rdv-i b{display:block;font-family:var(--font-clikme),sans-serif;
          font-weight:800;font-size:clamp(19px,5.6vw,23px);letter-spacing:-.02em;}
        .bt-rdv-i em{display:flex;align-items:center;gap:4px;font-style:normal;
          font-size:14px;color:#FFE3C4;margin-top:2px;}
        .bt-rdv-i em .bt-ico{width:15px;height:15px;color:var(--bt-rose);}
        .bt-rdv-i button{flex:none;display:flex;align-items:center;gap:6px;
          padding:9px 13px;border-radius:999px;cursor:pointer;font-size:14px;
          font-weight:600;background:rgba(12,8,6,.8);
          border:1px solid rgba(255,244,230,.3);}
        .bt-rdv-i button .bt-ico{width:16px;height:16px;}
        .bt-rdv-b{display:grid;grid-template-columns:1fr 1fr;}
        .bt-rdv-b button{display:flex;align-items:center;justify-content:center;gap:7px;
          padding:11px 8px;background:none;border:0;cursor:pointer;font-size:14.5px;
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
        .bt-fil.exemple{opacity:.78;}
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

        /* ═══ LA BARRE COMMUNE ══════════════════════════════════════════ */
        .bt-nav{position:absolute;left:0;right:0;bottom:0;z-index:25;
          height:var(--bt-nav);display:grid;grid-template-columns:repeat(6,1fr);
          padding:0 4px env(safe-area-inset-bottom,0px);
          background:#0E0907;border-top:1px solid var(--bt-trait);}
        .bt-nav button{position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:4px;padding:0;
          background:none;border:0;cursor:pointer;color:#B9A594;
          font-size:11.5px;font-weight:500;}
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
        @media (min-width: 620px){
          .bt{left:50%;right:auto;width:440px;transform:translateX(-50%);
            box-shadow:0 0 0 1px rgba(255,196,140,.1),0 30px 80px rgba(0,0,0,.6);}
          .bt{--bt-dw:190px;}
        }
      `,
      }}
    />
  );
}
