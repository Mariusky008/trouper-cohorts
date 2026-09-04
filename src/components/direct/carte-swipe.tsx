// LA CARTE DU DIRECT, EN MODE SWIPE — le seul écran qu'un habitant regarde.
//
// POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS DANS LA DÉMO.
//
// La démonstration faite au commerçant racontait Le Direct sans jamais le
// MONTRER : on lui disait « votre annonce circule », et il voyait un encadré
// stylisé qui ne ressemblait à rien de ce que ses clients verront. Or c'est le
// mode swipe qui fait comprendre le système d'un coup d'œil — une carte plein
// écran, une photo, un prix, et trois gestes.
//
// Cette carte est donc écrite UNE fois, ici, et servie à deux endroits :
//   · la démonstration du site (ce qu'on promet au commerçant) ;
//   · le fil de la ville (ce que l'habitant reçoit réellement).
//
// C'est la seule façon d'être sûr que la promesse et le produit ne divergent
// pas. Le jour où la carte change de forme, elle change aux deux endroits — et
// il devient IMPOSSIBLE de montrer en démonstration un écran qui n'existe pas.
//
// Composant PRÉSENTATIONNEL : il ne fait que rendre ce qu'on lui donne, aucun
// geste, aucun état. Les gestes appartiennent à l'écran qui l'utilise.
import type { CSSProperties, ReactNode } from "react";

export type CarteDirect = {
  /** La photo, plein cadre. Sans elle, un fond dégradé et l'emoji du métier. */
  photo?: string;
  /**
   * OÙ REGARDER DANS LA PHOTO — la valeur verticale de `background-position`.
   *
   * Le bas de la carte est recouvert par le voile qui porte le nom et le prix :
   * un sujet centré s'y fait avaler à moitié. Quand la photo est plus haute que
   * le cadre, on peut choisir la tranche qu'on garde. « 50% » (le défaut) prend
   * le milieu ; une valeur plus grande descend dans l'image, une plus petite
   * remonte.
   *
   * Utile surtout pour les photos des commerçants, dont on ne maîtrise pas le
   * cadrage : c'est le seul réglage qui rattrape une image sans la retoucher.
   */
  cadrage?: string;
  /** Le nom du commerce, tel qu'il l'écrit. */
  nom: string;
  /** « Restaurant », « Boulangerie »… */
  metier: string;
  ville: string;
  /** Ce qui reste avant que ça disparaisse : « Jusqu'à 14 h », « 2 h 10 ». */
  reste?: string;
  /**
   * ⚡ CE QUI SE PÉRIME DANS QUELQUES MINUTES — voir `flash.ts`.
   *
   * DEUX CHAMPS SEULEMENT, ET C'EST VOULU. La carte n'a pas besoin de savoir ce
   * qu'est un Flash : elle a besoin de savoir combien de temps il reste et
   * quelle part est écoulée. Tout le reste — le prix barré, l'étiquette, le
   * titre — passe par les champs qui existent déjà. Une carte qui connaîtrait
   * la mécanique du Flash serait une carte à modifier le jour où la mécanique
   * change.
   */
  flash?: { reste: string; part: number };
  /** L'emoji et l'intitulé de ce qui est proposé. */
  icone: string;
  quoi: string;
  /** Le détail — les lignes d'un menu, par exemple. */
  lignes?: string[];
  /**
   * SON CONSEIL DU JOUR, ET QUI LE DIT — voir `Voix` côté données.
   *
   * IL REMPLACE LE DÉTAIL, IL NE S'AJOUTE PAS À LUI. « Salade de saison ·
   * Prêtes tout de suite, à emporter » est une ligne écrite par le produit,
   * que personne ne lit ; « Prenez les lasagnes, la pâte est de ce matin —
   * Margot » est quelqu'un qui parle. Même place, même hauteur, et l'annonce
   * cesse d'être une fiche produit.
   *
   * ABSENT, TOUT REDEVIENT COMME AVANT. C'est la règle de la fonction : un
   * commerçant qui ne veut rien dire ne perd pas une ligne.
   */
  conseil?: string;
  /**
   * QUI PARLE. Le portrait est facultatif ; la vidéo l'est encore plus.
   *
   * LA VIDÉO N'EST DONNÉE QUE SUR LA CARTE DU DESSUS. Trente vidéos qui se
   * chargent dans un paquet qu'on balaie rendent l'application inutilisable en
   * 4G dans la rue et vident la batterie. L'écran retire donc le champ des
   * cartes qui ne sont pas devant — voir `carteDe` côté application.
   */
  voix?: {
    prenom: string;
    role?: string;
    portrait?: string;
    video?: { mp4: string; webm?: string; affiche?: string };
  };
  prix?: string;
  /** Le prix d'avant, barré. */
  prixBarre?: string;
  /** L'étiquette jaune : « GRATUIT », « -30 % ». */
  etiquette?: string;
  /**
   * ÇA VIENT DE TOMBER — « à l'instant », « il y a 12 min ».
   *
   * LA SEULE CHOSE QU'UNE FICHE GOOGLE NE SAURA JAMAIS DIRE. Des horaires, une
   * adresse, un menu : tout le monde les a. « Il vient de se passer quelque
   * chose, il y a douze minutes, à trois cents mètres » n'existe nulle part —
   * et c'est pour ça que ça se lit AVANT le métier, tout en haut de la carte.
   *
   * ET CE N'EST PAS UNE ÉTIQUETTE DE PLUS. L'étiquette jaune dit ce que
   * l'offre EST (« −30 % ») ; celle-ci dit QUAND elle a été dite. Les deux
   * peuvent coexister sur une carte sans se répéter — mais rarement, parce
   * qu'une annonce fraîche est rare par construction (voir `FRAICHEUR_MIN`).
   */
  frais?: string;
  /** Ce que d'autres ont déjà fait : « 3 ont réservé ». Jamais inventé. */
  social?: string;
  /**
   * À QUELLE DISTANCE C'EST — « 400 m », « 1,2 km ».
   *
   * C'est l'information qui manquait le plus à la carte, et elle décide plus
   * souvent que le prix : à midi, on ne choisit pas un restaurant, on choisit
   * un restaurant OÙ ON A LE TEMPS D'ALLER. Sans elle, l'habitant lisait une
   * belle photo sans savoir si c'était à deux rues ou à l'autre bout de Dax.
   *
   * Elle vient de `repereSpatial` (voir `degradation.ts`), qui la calcule
   * quand l'habitant a autorisé sa position et retombe sinon sur le quartier
   * puis sur la ville. Vide, la ligne se contente du métier et de la ville —
   * on n'affiche jamais une distance qu'on n'a pas.
   */
  distance?: string;
  /**
   * L'ITINÉRAIRE, quand on sait où c'est. Voir `lienItineraire`.
   *
   * Absent, le bouton n'existe pas : un « Y aller » qui ouvre une carte vide
   * coûte plus cher que son absence.
   */
  itineraire?: string;
};

/**
 * LE BANDEAU DU HAUT — la marque, la ville, ce qu'on a gardé.
 *
 * Il ne sert pas à décorer : c'est lui qui dit à quel écran on est. Sans lui,
 * la carte pourrait aussi bien être une publicité.
 */
export function BarreDirect({
  marque,
  ville,
  agenda,
  gardees,
}: {
  marque: string;
  ville: string;
  /** Combien de choses réservées, en haut à droite. */
  agenda?: number;
  /** Combien de commerces gardés. */
  gardees?: number;
}) {
  return (
    <div className="cd-barre">
      <span className="cd-marque">{marque}</span>
      <span className="cd-puce"><i aria-hidden="true">📍</i>{ville}</span>
      {agenda != null && (
        <span className="cd-puce"><i aria-hidden="true">📅</i><b>{agenda}</b></span>
      )}
      {gardees != null && (
        <span className="cd-puce vert"><i aria-hidden="true">💚</i>Ma carte<b>{gardees}</b></span>
      )}
    </div>
  );
}

/**
 * LES TROIS GESTES, sous la carte.
 *
 * `action` est le libellé du bouton du milieu, et il change avec le métier :
 * on « réserve » une table, on « veut » une fournée. Un intitulé unique
 * obligerait l'habitant à traduire.
 */
export function GestesDirect({
  action = "Je veux",
  actif,
}: {
  action?: string;
  /** Le geste mis en avant, le temps d'une démonstration. */
  actif?: "passer" | "veux" | "pro";
}) {
  return (
    <div className="cd-gestes">
      <span className={`cd-g${actif === "passer" ? " on" : ""}`}>
        <i aria-hidden="true">✕</i>
        <em>Passer</em>
      </span>
      <span className={`cd-g grand${actif === "veux" ? " on" : ""}`}>
        <i aria-hidden="true">♥</i>
        <em>{action}</em>
      </span>
      <span className={`cd-g${actif === "pro" ? " on" : ""}`}>
        <i aria-hidden="true">↑</i>
        <em>Le pro</em>
      </span>
    </div>
  );
}

/**
 * LES DEUX FAÇONS DE DESSINER LA MÊME CARTE.
 *
 * `fiche` est la face historique : le nom du commerce en gros, puis le métier,
 * puis ce qui est proposé, puis le prix. Elle se lit comme une fiche — de haut
 * en bas, à gauche — et c'est ce qu'il faut là où la carte est un exemple posé
 * dans une page (la démonstration commerçant, la page d'accueil).
 *
 * `seconde` est la face de l'application : ce qu'on doit comprendre en une
 * seconde, et rien d'autre. LE DÉFAUT QU'ELLE CORRIGE A ÉTÉ RELEVÉ SUR L'ÉCRAN
 * RÉEL : « on a du mal à lire correctement le message… normalement on devrait
 * comprendre en une seconde le menu grâce à la photo et grâce aux textes ».
 * La raison tenait à la hiérarchie : le NOM DU COMMERCE était la plus grosse
 * ligne de la carte, alors que ce qu'on choisit à midi, c'est un plat. Ici
 * l'ordre est celui de la décision — ce que c'est, ce que c'est vraiment, ce
 * que ça coûte, chez qui, jusqu'à quand — et c'est centré, parce qu'un bloc
 * centré sur une photo se lit d'un coup et non ligne à ligne.
 *
 * POURQUOI LES DEUX COHABITENT ICI PLUTÔT QUE DANS DEUX FICHIERS. C'est la
 * raison d'être de ce fichier : une seule carte, un seul jeu de classes, un
 * seul type. Deux fichiers, ce serait de nouveau deux cartes qui divergent.
 *
 * CE QUI RESTE À FAIRE LE JOUR OÙ LA DÉMONSTRATION L'ADOPTERA : `carteDirectHtml`
 * ne sait dessiner que `fiche`. Elle sert des scènes remplies par `innerHTML`,
 * qui ne montrent aujourd'hui que la face historique. Le jour où la promesse
 * faite au commerçant montre la nouvelle face, cette fonction doit suivre —
 * sans quoi on aurait exactement ce que ce fichier existe pour empêcher.
 */
export type FaceCarte = "fiche" | "seconde";

export function CarteSwipe({
  carte,
  style,
  className = "",
  variante = "fiche",
  children,
}: {
  carte: CarteDirect;
  style?: CSSProperties;
  className?: string;
  /** Voir `FaceCarte`. Par défaut la face historique : personne ne change sans le demander. */
  variante?: FaceCarte;
  /**
   * CE QUE L'ÉCRAN QUI L'UTILISE AJOUTE AU BAS DE LA CARTE.
   *
   * POURQUOI UN POINT D'EXTENSION PLUTÔT QU'UN CHAMP DE PLUS. La maquette
   * habitant a besoin d'une ligne « les avis sur le plat » sous le prix. La
   * ranger dans `CarteDirect` reviendrait à embarquer, dans la carte du VRAI
   * produit et dans son type, un bloc qui n'existe nulle part ailleurs — du
   * code mort partout sauf à un endroit, et une promesse de plus dans le type
   * que lit quiconque veut comprendre ce qu'une carte affiche.
   *
   * Ici, la carte ne sait rien de ce qu'on lui glisse : elle réserve une place,
   * en bas, après le prix. Le jour où les avis deviennent un vrai morceau du
   * produit, ils remonteront dans le type — pas avant.
   */
  children?: ReactNode;
}) {
  const c = carte;
  const sec = variante === "seconde";
  return (
    /* ⚡ UNE CARTE FLASH NE RESSEMBLE À AUCUNE AUTRE — c'est la demande, et
       c'était le défaut : « l'annonce ne fait pas différente d'une autre alors
       qu'elle devrait être très différente pour montrer l'exceptionnel de ce
       moment ». Une pastille ambre sur une carte identique ne suffit pas : on
       balaie, et rien n'arrête l'œil. La classe teinte la carte ENTIÈRE. */
    <div
      className={`cd-carte${sec ? " sec" : ""}${c.flash ? " flash" : ""} ${className}`}
      style={style}
    >
      {/* DEUX COUCHES, PAS UNE, et c'est un filet de sécurité.
          L'image est empilée SUR un dégradé. Si le fichier manque ou tarde, la
          couche du dessous reste : la carte est sombre et propre au lieu d'être
          blanche et cassée. Avec une seule couche, un `background-image` en 404
          efface aussi la couleur de fond — on aurait un trou en plein milieu de
          l'écran qui doit convaincre. */}
      <div
        className={`cd-photo${c.photo ? "" : " sans"}`}
        style={
          c.photo
            ? {
                backgroundImage: `url("${encodeURI(c.photo)}"), linear-gradient(155deg,#22463A,#0D1A15 70%)`,
                backgroundPosition: `center ${c.cadrage || "50%"}`,
              }
            : undefined
        }
      >
        {!c.photo && <span className="cd-ph" aria-hidden="true">{c.icone}</span>}
      </div>
      {/* Le voile n'est pas un effet : sans lui, un texte blanc posé sur une
          photo claire devient illisible une fois sur deux. */}
      <div className="cd-voile" aria-hidden="true" />

      {/* LA PASTILLE DU HAUT N'EXISTE QUE SUR LA FICHE. Sur la seconde face,
          « jusqu'à quand » est descendu dans le bloc central, avec le reste de
          la décision : une échéance lue à l'autre bout de l'écran du prix ne
          se rattache à rien, et elle occupait le seul coin qui pouvait rester
          vide. */}
      {c.reste && !sec && (
        <span className="cd-reste"><i aria-hidden="true">⏳</i>{c.reste}</span>
      )}
      {/* « Y ALLER » EN HAUT À DROITE, à l'opposé du compte à rebours : c'est
          la seule action de la carte qui ne concerne pas le swipe, et la mettre
          en bas la ferait confondre avec les trois gestes. */}
      {/* IL N'EXISTE PAS NON PLUS SUR LA SECONDE FACE. Un itinéraire est un
          outil, pas une décision : il se prend une fois qu'on a choisi, et il
          est déjà en bas de la fiche, pleine largeur. Posé sur la photo, il
          faisait le troisième objet coloré d'un écran qui n'en veut qu'un —
          et sur un événement, où la troisième action de la barre DEVIENT
          « Y aller », on le lisait deux fois. */}
      {c.itineraire && !sec && (
        <a className="cd-aller" href={c.itineraire} target="_blank" rel="noreferrer noopener">
          <i aria-hidden="true">↗</i>Y aller
        </a>
      )}

      <div className="cd-bas">
        {sec ? (
          /* ─── L'ORDRE DE LA DÉCISION ───
             Ce que c'est (la nature), ce que c'est vraiment (l'offre), ce que
             ça coûte, chez qui, jusqu'à quand. Cinq lignes, dans cet ordre-là,
             et rien entre elles.

             LA NATURE RETOMBE SUR LE MÉTIER quand l'annonce n'en porte pas :
             « BOULANGERIE » au-dessus de « La tourte de seigle » se lit aussi
             bien que « SORTIE DU FOUR », et le métier ne se répète pas plus
             bas — la ligne du commerce ne porte que son nom, sa ville et sa
             distance. */
          <div className="cd-dit">
            {/* ─── LE MOMENT, ET IL PASSE AVANT LE MÉTIER ───
                Un point qui bat, et l'heure. Rien d'autre : le mot « direct »
                a été écarté exprès — il promet une caméra allumée, donc
                quelqu'un qui parle, donc une performance, c'est-à-dire tout ce
                qui fait fuir un commerçant. Ici on ne lui demande rien de plus
                que ce qu'il fait déjà ; c'est le produit qui date ce qu'il
                dit. */}
            {/* ═══ ⚡ LE TEMPS QUI PASSE EST L'INFORMATION ═══
                « Le minuteur est essentiel. Mais attention : pas un gros
                compteur anxiogène façon site de e-commerce. Quelque chose de
                très simple : encore 23 min, avec une petite barre qui descend.
                Le temps qui passe devient lui-même une information. »

                PAS DE SECONDES, ET C'EST LE POINT. Un chronomètre à la seconde
                transforme une bonne nouvelle en pression — le genre de pression
                qu'on ne pardonne pas à un commerce de son quartier. La minute
                suffit à faire comprendre qu'il faut décider maintenant.

                ET IL REMPLACE LA FRAÎCHEUR. « Il y a 12 min » et « encore
                23 min » sont deux comptes de temps qui vont dans des directions
                opposées ; posés l'un sur l'autre, on ne sait plus lequel
                compte. Sur un Flash, un seul compte : celui qui descend. */}
            {/* ─── LE CHRONO EST LE PERSONNAGE PRINCIPAL ───
                « Le chrono devrait être très différent, comme l'acteur
                principal, et le prix aussi. » C'est juste : sur un Flash, la
                seule question est « est-ce que j'ai le temps ? ». Le nombre de
                minutes est donc écrit à la taille d'un prix, l'unité en petit à
                côté, et la barre passe dessous sur toute la largeur du bloc.
                Ce qui était une pastille de douze points devient le premier
                objet que l'œil rencontre. */}
            {c.flash ? (
              <p className="cd-flash">
                <span className="cd-flash-t">
                  <i aria-hidden="true">⚡</i>
                  Flash
                </span>
                <span className="cd-flash-n">
                  <b>{c.flash.reste.replace(/[^0-9]/g, "") || "0"}</b>
                  <em>
                    min
                    <s>restantes</s>
                  </em>
                </span>
                <span className="cd-flash-j" aria-hidden="true">
                  <u style={{ width: `${Math.round((1 - c.flash.part) * 100)}%` }} />
                </span>
              </p>
            ) : (
              c.frais && (
                <p className="cd-frais">
                  <i aria-hidden="true" />
                  {c.frais}
                </p>
              )
            )}
            {(c.etiquette || c.metier) && (
              <p className="cd-nature">{c.etiquette || c.metier}</p>
            )}
            <h2 className="cd-offre">{c.quoi}</h2>
            {/* LE DÉTAIL RESTE, MAIS IL A CESSÉ D'ÊTRE UN BLOC. Sur une
                invitation, c'est le mot du commerçant : le supprimer ferait
                d'un message adressé une annonce de plus. Sur un menu, c'est la
                composition du plat. Deux lignes au maximum, et petites : entre
                le titre en serif et le prix, il n'a aucune chance de prendre
                le dessus. */}
            {/* ─── SA VOIX PREND LA PLACE DU DÉTAIL ───
                Et seulement si elle existe : sans conseil, la ligne de détail
                est exactement celle d'avant. Le conseil est en serif et entre
                guillemets — c'est quelqu'un qui parle, pas une description —
                et il est signé d'un rond et d'un prénom. Dans un paquet de
                huit restaurants, celui qui a un visage et une phrase est le
                seul qu'on retient. */}
            {/* ─── LA CITATION A DESCENDU D'UNE COUCHE ───
                « Dans une interface où l'utilisateur est déjà confronté à
                beaucoup d'informations, ce n'est pas prioritaire. » Elle
                passait AVANT le prix et l'heure — avant les deux choses qui
                font décider — et elle coûtait cinquante points sur la seule
                zone où l'on choisit d'y aller ou non. On la retrouve sous le
                pli, dans « Ce qu'il en dit », au moment où l'on veut en savoir
                plus. Le FILM, lui, reste : ce n'est pas une phrase à lire,
                c'est un visage qui bouge, et il se regarde en une demi-seconde
                sans rien coûter à la lecture. */}
            {c.conseil && c.voix?.video ? (
              <p className={`cd-conseil${c.voix.video ? " film" : ""}`}>
                {/* ─── LE ROND, ET CE QU'IL Y A DEDANS ───
                    Trois états, du plus riche au plus pauvre, et le dernier
                    est celui de presque tout le monde : sa vidéo, sa photo,
                    ou son initiale.

                    ET LA TAILLE SUIT CE QU'IL Y A DEDANS. Une initiale n'a
                    rien à montrer : trente-quatre pixels lui suffisent, et
                    plus grand elle deviendrait un bandeau. Une vidéo a
                    quelque chose à montrer, et à trente-quatre pixels elle ne
                    le montrait pas — « on ne voit quasiment rien ». Le rond
                    double donc quand il y a un film, et seulement là. */}
                <span
                  className={`cd-tete${c.voix.video ? " film" : ""}`}
                  aria-hidden="true"
                >
                  {c.voix.video ? (
                    <video
                      poster={c.voix.video.affiche}
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                    >
                      {c.voix.video.webm && (
                        <source src={c.voix.video.webm} type="video/webm" />
                      )}
                      <source src={c.voix.video.mp4} type="video/mp4" />
                    </video>
                  ) : c.voix.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.voix.portrait} alt="" />
                  ) : (
                    c.voix.prenom.slice(0, 1)
                  )}
                </span>
                <span>
                  <em>{c.conseil}</em>
                  <s>
                    {c.voix.prenom}
                    {c.voix.role ? `, ${c.voix.role}` : ""}
                  </s>
                </span>
              </p>
            ) : (
              !!c.lignes?.length && (
                <p className="cd-detail">{c.lignes.slice(0, 2).join(" · ")}</p>
              )
            )}
            {/* ─── ET LE PRIX PORTE LA MÊME EXCEPTION ───
                Sur un Flash, l'ancien prix n'est pas une mention légale : c'est
                la MOITIÉ de l'information. Il passe donc à gauche, gros et
                barré, et le nouveau à droite en ambre — on lit la chute, pas un
                prix avec une note de bas de page. */}
            {(c.prix || c.prixBarre) && (
              <p className={`cd-prixg${c.flash ? " flash" : ""}`}>
                {c.flash && c.prixBarre && <s>{c.prixBarre}</s>}
                {c.prix}
                {!c.flash && c.prixBarre && <s>{c.prixBarre}</s>}
              </p>
            )}
            {/* LE NOM DU COMMERCE EST LISIBLE, ET IL N'EST PLUS LE TITRE.
                Demande explicite, et elle est juste : « si c'est un restaurant
                que je n'aime pas, alors quoi qu'il serve je n'irai pas, donc
                j'ai besoin de le savoir ». C'est une information de décision —
                elle a la taille d'une information. */}
            <p className="cd-chez">
              {c.nom}
              <s>
                {" · "}
                {c.ville}
                {/* L'ESPACE DE « 210 m » EST INSÉCABLE, et ce n'est pas du
                    zèle : sur une enseigne un peu longue, la ligne se coupait
                    entre le nombre et son unité et laissait un « m » tout seul
                    sur la ligne suivante. Vu sur « Une boutique de la rue
                    piétonne · Dax · 210 m », à 390 points. */}
                {c.distance ? ` · ${c.distance.replace(/ /g, " ")}` : ""}
              </s>
            </p>
            {c.social && <span className="cd-social">💚 {c.social}</span>}
            {c.reste && <span className="cd-quand">{c.reste}</span>}
          </div>
        ) : (
          <>
            <div className="cd-nom">{c.nom}</div>
            <div className="cd-ou">
              <i aria-hidden="true">📍</i>{c.metier} · {c.ville}
              {c.distance && <b>{c.distance}</b>}
            </div>
            {c.social && <div className="cd-social"><i aria-hidden="true">💚</i>{c.social}</div>}

            <div className="cd-quoi"><i aria-hidden="true">{c.icone}</i>{c.quoi}</div>
            {!!c.lignes?.length && (
              <div className="cd-lignes">
                {c.lignes.map((l) => (<span key={l}>{l}</span>))}
              </div>
            )}
            {(c.prix || c.etiquette) && (
              <div className="cd-prix">
                {c.prix && <b>{c.prix}</b>}
                {c.prixBarre && <s>{c.prixBarre}</s>}
                {c.etiquette && <em>{c.etiquette}</em>}
              </div>
            )}
          </>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * LA MÊME CARTE, EN CHAÎNE DE CARACTÈRES.
 *
 * POURQUOI CETTE SECONDE ÉCRITURE EXISTE. La démonstration du site joue ses
 * séquences dans une scène qu'elle remplit par `innerHTML` : une minuterie
 * remplace le contenu toutes les deux secondes, sans repasser par React. On ne
 * peut donc pas y monter `<CarteSwipe>`.
 *
 * Elle vit ICI, collée à la version JSX et à la feuille de styles, parce que
 * l'alternative — un dessin de carte écrit dans le fichier de la démo — est
 * exactement ce qu'on vient de supprimer : deux cartes différentes, celle qu'on
 * promet et celle qu'on livre. Deux rendus, UN seul jeu de classes et UN seul
 * type de données : le style ne peut plus diverger, seul l'ordre des blocs
 * pourrait, et il tient sur un écran.
 *
 * Tout ce qui vient du commerçant passe par `esc` — cette chaîne finit dans un
 * `innerHTML`, et un nom de commerce est une donnée, pas du balisage.
 */
export function carteDirectHtml(c: CarteDirect): string {
  const fond = c.photo
    ? ` style="background-image:url(&quot;${esc(encodeURI(c.photo))}&quot;),linear-gradient(155deg,#22463A,#0D1A15 70%);background-position:center ${esc(c.cadrage || "50%")}"`
    : "";
  return (
    `<div class="cd-carte">` +
      `<span class="cd-photo${c.photo ? "" : " sans"}"${fond}>${c.photo ? "" : `<span class="cd-ph">${esc(c.icone)}</span>`}</span>` +
      `<span class="cd-voile"></span>` +
      (c.reste ? `<span class="cd-reste"><i>⏳</i>${esc(c.reste)}</span>` : "") +
      (c.itineraire ? `<span class="cd-aller"><i>↗</i>Y aller</span>` : "") +
      `<span class="cd-bas">` +
        `<span class="cd-nom">${esc(c.nom)}</span>` +
        `<span class="cd-ou"><i>📍</i>${esc(c.metier)} · ${esc(c.ville)}${c.distance ? `<b>${esc(c.distance)}</b>` : ""}</span>` +
        (c.social ? `<span class="cd-social"><i>💚</i>${esc(c.social)}</span>` : "") +
        `<span class="cd-quoi"><i>${esc(c.icone)}</i>${esc(c.quoi)}</span>` +
        (c.lignes?.length
          ? `<span class="cd-lignes">${c.lignes.map((l) => `<span>${esc(l)}</span>`).join("")}</span>`
          : "") +
        (c.prix || c.etiquette
          ? `<span class="cd-prix">${c.prix ? `<b>${esc(c.prix)}</b>` : ""}${c.prixBarre ? `<s>${esc(c.prixBarre)}</s>` : ""}${c.etiquette ? `<em>${esc(c.etiquette)}</em>` : ""}</span>`
          : "") +
      `</span>` +
    `</div>`
  );
}

/** Les trois gestes, en chaîne — même raison, même contrat que ci-dessus. */
export function gestesDirectHtml(action = "Je veux"): string {
  return (
    `<div class="cd-gestes">` +
      `<span class="cd-g"><i>✕</i><em>Passer</em></span>` +
      `<span class="cd-g grand"><i>♥</i><em>${esc(action)}</em></span>` +
      `<span class="cd-g"><i>↑</i><em>Le pro</em></span>` +
    `</div>`
  );
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * LES STYLES DE LA CARTE, posés une seule fois par écran.
 *
 * Ils voyagent avec le composant plutôt que de vivre dans la feuille de la
 * démonstration : c'est ce qui permet au fil de la ville de servir exactement
 * la même carte, sans recopier trois cents lignes qui divergeraient au premier
 * ajustement.
 */
export function StylesDirect() {
  return (
    <style
      /* UNE SEULE FOIS DANS LA PAGE, ET TOUJOURS AVANT LES SCÈNES.
         La page d'aperçu monte ce composant à deux endroits — la visite guidée
         et l'assistante — et les deux feuilles se retrouvaient dans le corps du
         document, la seconde APRÈS les styles de la visite. À spécificité
         égale, c'est la dernière qui gagne : `.cd-carte{max-width:340px}`
         écrasait le `.ph-carte{max-width:196px}` de l'acte 5, et la carte
         sortait de l'écran par le bas. Mesuré au navigateur : 340 px partout.
         `href` + `precedence` demandent à React de la remonter dans l'en-tête
         et de n'en garder qu'une. Les scènes gardent en plus une spécificité
         supérieure — l'ordre ne doit jamais être le seul garde-fou. */
      href="direct-carte-swipe"
      precedence="default"
      dangerouslySetInnerHTML={{
        __html: `
        .cd-barre{display:flex;align-items:center;gap:7px;width:100%;max-width:340px;margin:0 auto;
          font-family:'Inter',system-ui,sans-serif;}
        /* LE NOM SE COUPE PLUTÔT QUE DE PASSER PAR-DESSUS LES PASTILLES.
           Il portait un min-width nul sans rien pour retenir son texte : dans un
           cadre plus étroit que 340 px, « Clikme » débordait de sa case et
           s'imprimait SUR « votre ville » — vu sur la page d'accueil, où
           l'écran fait 280 px. */
        .cd-marque{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          font-size:17px;font-weight:850;letter-spacing:-.03em;color:#fff;}
        .cd-puce{display:flex;align-items:center;gap:5px;flex:none;font-size:11.5px;font-weight:700;color:#D6DEE4;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 10px;}
        .cd-puce i{font-style:normal;font-size:11px;line-height:1;}
        .cd-puce b{font-weight:850;color:#fff;}
        .cd-puce.vert{color:#8FE9C4;border-color:rgba(126,230,192,.28);background:rgba(18,185,129,.14);}

        /* LA CARTE. Format portrait, comme un écran de téléphone tenu à la
           main : c'est la forme qui dit « ça se regarde en marchant ». */
        /* text-align:left EST INDISPENSABLE, pas cosmétique : la carte est
           servie dans des scènes qui centrent tout leur contenu (l'acte 3 de la
           visite guidée, par exemple). Sans elle, le menu s'affichait centré
           dans la démonstration et à gauche dans le vrai fil — deux cartes
           différentes, ce que ce fichier existe précisément pour empêcher. */
        .cd-carte{position:relative;width:100%;max-width:340px;aspect-ratio:3/4.15;border-radius:26px;overflow:hidden;
          text-align:left;
          background:#0C1310;box-shadow:0 40px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
          font-family:'Inter',system-ui,sans-serif;isolation:isolate;}
        .cd-photo{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;}
        .cd-photo.sans{display:flex;align-items:center;justify-content:center;
          background:linear-gradient(155deg,#22463A,#0D1A15 70%);}
        .cd-ph{font-size:74px;opacity:.5;}
        .cd-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,.3) 0%,rgba(4,8,6,0) 24%,rgba(4,8,6,.68) 56%,rgba(4,8,6,.96) 100%);}
        .cd-reste{position:absolute;left:14px;top:14px;display:flex;align-items:center;gap:6px;
          font-size:12px;font-weight:800;color:#fff;background:rgba(8,12,10,.62);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 11px;}
        .cd-reste i{font-style:normal;font-size:11px;line-height:1;}

        .cd-bas{position:absolute;left:0;right:0;bottom:0;padding:16px 16px 18px;display:flex;flex-direction:column;gap:5px;}
        /* Le nom en serif : c'est le seul mot de la carte qui appartient au
           commerçant, et il doit se lire comme une enseigne, pas comme une
           ligne de base de données. */
        .cd-nom{font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.06;font-weight:700;color:#fff;
          text-shadow:0 2px 18px rgba(0,0,0,.7);}
        .cd-ou{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:#CBD7D0;}
        .cd-ou i{font-style:normal;font-size:11px;line-height:1;}
        /* La distance est le seul chiffre de cette ligne : elle a droit au
           blanc, le reste est en gris. */
        .cd-ou b{font-weight:850;color:#fff;font-variant-numeric:tabular-nums;}
        .cd-ou b::before{content:"·";margin-right:5px;color:#7E938A;font-weight:600;}
        .cd-aller{position:absolute;right:14px;top:14px;z-index:3;display:flex;align-items:center;gap:5px;
          font-size:12px;font-weight:850;color:#04150E;text-decoration:none;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;padding:7px 12px;
          box-shadow:0 10px 24px -10px rgba(18,185,129,.9);}
        .cd-aller i{font-style:normal;font-size:11px;line-height:1;}
        .cd-social{align-self:flex-start;display:flex;align-items:center;gap:6px;margin-top:3px;
          font-size:12px;font-weight:800;color:#8FE9C4;background:rgba(18,185,129,.16);
          border:1px solid rgba(126,230,192,.3);border-radius:999px;padding:5px 11px;}
        .cd-social i{font-style:normal;font-size:11px;line-height:1;}
        .cd-quoi{display:flex;align-items:center;gap:7px;margin-top:8px;font-size:14.5px;font-weight:750;color:#fff;}
        .cd-quoi i{font-style:normal;font-size:14px;line-height:1;flex:none;}
        .cd-lignes{display:flex;flex-direction:column;gap:2px;padding-left:22px;}
        .cd-lignes span{font-size:12.5px;line-height:1.35;color:#C4D2CA;}
        .cd-prix{display:flex;align-items:baseline;gap:9px;margin-top:7px;}
        .cd-prix b{font-size:26px;font-weight:850;letter-spacing:-.035em;color:#3DE2A6;line-height:1;}
        .cd-prix s{font-size:13px;color:#93A79C;}
        .cd-prix em{font-style:normal;font-size:10.5px;font-weight:850;letter-spacing:.08em;color:#3A2A00;
          background:#FFC400;border-radius:6px;padding:4px 8px;}

        /* ═══ LA SECONDE FACE — CE QU'ON DOIT COMPRENDRE EN UNE SECONDE ═══
           Voir le type FaceCarte, plus haut, pour ce qu'elle corrige.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS.

           LE VOILE NE COUVRE PLUS LA PHOTO, IL MONTE SOUS LE TEXTE. Un voile
           uniforme eteignait la seule chose qui donne faim ; celui-ci laisse
           le milieu de l'image en pleine lumiere et ne s'epaissit que la ou
           il y a des mots. Il garde un souffle en haut, parce que le bandeau
           des filtres et les deux pastilles y vivent.

           IL N'EST PAS UNE PREFERENCE, C'EST UNE CONDITION. Mesure faite sur
           la meme annonce avec une photo de commercant ordinaire — claire,
           plate, au neon : sans voile, le titre et le prix se perdent dans
           l'assiette. La face ne tient que parce que ce degrade est la. */
        .cd-carte.sec .cd-voile{background:linear-gradient(180deg,
          rgba(4,8,6,.52) 0%,rgba(4,8,6,.10) 13%,rgba(4,8,6,0) 27%,
          rgba(4,8,6,.12) 44%,rgba(4,8,6,.44) 63%,rgba(4,8,6,.80) 82%,
          rgba(4,8,6,.94) 100%);}

        /* CENTRE, ET C'EST STRUCTUREL : un bloc centre sur une photo se lit
           d'un coup ; aligne a gauche, il se lit ligne apres ligne, ce qui est
           exactement le temps qu'on n'a pas. */
        .cd-carte.sec .cd-bas{align-items:center;text-align:center;gap:0;}
        .cd-dit{display:flex;flex-direction:column;align-items:center;
          width:100%;min-width:0;}
        .cd-nature{margin:0;font-size:11px;font-weight:800;letter-spacing:.24em;
          text-transform:uppercase;color:#EFEAD9;opacity:.92;}
        /* ═══ CA VIENT DE TOMBER ═══
           UNE QUATRIEME COULEUR, ET LES TROIS AUTRES ETAIENT PRISES. Le vert
           veut dire GARDER, le corail #FF6B6B veut dire PASSER — c'est le
           tampon qui apparait sous le doigt quand on balaie — et l'ambre veut
           dire « c'est a vous ». Les trois parlent d'une ACTION. La fraicheur
           n'est pas une action mais un ETAT, et le premier essai l'avait mise
           en corail : la pastille se retrouvait a deux centimetres d'un tampon
           « PASSER » de la meme couleur, ce qui revenait a dire « nouveau » et
           « refuser » avec le meme signe.
           LE VIOLET EST LIBRE SUR LA CARTE, et c'est la couleur du direct dans
           le vocabulaire que tout le monde connait deja — celui de Twitch, cite
           par le produit lui-meme quand le rond video est ne. */
        /* ─── LA FRAICHEUR A CESSE D'ETRE UNE PASTILLE ───
           « Depuis combien de temps l'annonce existe n'est pas ce qui interesse
           le client. Ce qui l'interesse est : est-ce encore disponible ?
           IL Y A 16 MIN → une petite indication, beaucoup plus discrete. »

           C'etait le TROISIEME signal de temps de la meme carte, et le plus
           gros des trois : une pastille violette a bord lumineux au-dessus de
           l'etiquette qui, elle, dit ce qui compte — « il en reste 8 ». Elle
           garde son point qui bat, parce que c'est lui qui dit que la carte est
           vivante ; elle perd son cadre, ses majuscules et sa couleur. */
        .cd-frais{display:inline-flex;align-items:center;gap:6px;
          margin:0 0 7px;padding:0;
          font-size:10.5px;font-weight:750;letter-spacing:.04em;
          color:rgba(234,242,236,.62);text-shadow:0 1px 6px rgba(0,0,0,.75);}
        .cd-frais i{width:6px;height:6px;border-radius:50%;background:#C4A0FF;
          box-shadow:0 0 0 0 rgba(185,140,255,.75);animation:cdBat 2s ease-out infinite;}
        /* IL BAT, IL NE CLIGNOTE PAS. Un clignotement fait fermer une
           application ; une pulsation lente se remarque sans agresser, et
           s'arrete net pour qui a demande moins d'animations. */
        @keyframes cdBat{
          0%{box-shadow:0 0 0 0 rgba(185,140,255,.75);}
          70%{box-shadow:0 0 0 7px rgba(185,140,255,0);}
          100%{box-shadow:0 0 0 0 rgba(185,140,255,0);}
        }
        @media (prefers-reduced-motion:reduce){
          .cd-frais i{animation:none;}
        }
        /* LE PLAT EST LA PLUS GROSSE LIGNE DE LA CARTE. C'est tout le
           correctif : avant, c'etait le nom du commerce. */
        .cd-offre{margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;
          font-weight:700;font-size:clamp(27px,8.6vw,40px);line-height:1.03;
          letter-spacing:-.02em;text-transform:uppercase;color:#fff;
          text-shadow:0 2px 18px rgba(0,0,0,.55);}
        .cd-detail{margin:7px 0 0;max-width:31ch;font-size:12.5px;
          line-height:1.35;color:#C8D6CD;text-wrap:balance;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        /* ─── SA VOIX ───
           Meme place et meme hauteur que le detail qu'elle remplace : on ne
           gagne pas un pixel, on remplace du texte mort par quelqu'un. Le
           serif et les guillemets font la difference entre une description et
           une parole ; le rond a gauche donne le visage que les fiches Google
           n'ont jamais. */
        .cd-conseil{margin:7px 0 0;max-width:33ch;display:flex;align-items:center;
          gap:9px;font-family:Georgia,'Times New Roman',serif;font-size:13.5px;
          line-height:1.32;color:#EAF2EC;text-align:left;}
        .cd-conseil>span:last-child{min-width:0;}
        /* QUAND IL Y A UN FILM, LA COLONNE DE TEXTE NE DOIT PAS PAYER LE ROND.
           La largeur maximale porte sur la ligne entiere : garder 33ch avec un
           rond deux fois plus large aurait rendu la phrase deux fois plus
           haute. On rend au texte ce que le rond a pris. */
        .cd-conseil.film{max-width:40ch;gap:12px;}
        /* LES GUILLEMETS ENCADRENT LA PHRASE, PAS LA SIGNATURE. Sans
           l'element intermediaire, le guillemet fermant se serait pose apres
           « — Serge, boucher », c'est-a-dire au mauvais endroit. */
        .cd-conseil em{font-style:normal;}
        .cd-conseil em::before{content:"\\201C";}
        .cd-conseil em::after{content:"\\201D";}
        .cd-conseil>span:last-child s{display:block;margin-top:3px;
          text-decoration:none;font-family:inherit;font-size:11px;
          font-style:italic;color:#9FB5AA;}
        .cd-conseil>span:last-child s::before{content:"— ";}
        /* L'INITIALE QUAND IL N'Y A PAS DE PHOTO — et c'est le cas de toute la
           maquette : LISEZ-MOI.md interdit les visages reconnaissables, et
           c'est aussi la degradation du vrai produit pour celui qui ne veut
           pas donner sa tete. */
        .cd-tete{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          font-family:system-ui,sans-serif;font-size:15px;font-weight:850;
          color:#04150E;background:linear-gradient(140deg,#7EE6C0,#3DE2A6);
          box-shadow:0 2px 10px rgba(0,0,0,.4);}
        .cd-tete img,.cd-tete video{width:100%;height:100%;object-fit:cover;}
        /* ─── LE ROND QUAND IL Y A UN FILM ───
           « La video est minuscule, on ne voit quasiment rien. » Soixante-
           dix pixels au lieu de trente-quatre : quatre fois la surface, donc
           un geste enfin lisible sans que le rond devienne un lecteur video.
           L'anneau vert dit qu'il y a quelque chose a regarder — c'est la
           seule chose qui distingue un film d'une photo tant qu'on n'a pas
           appuye. */
        .cd-tete.film{width:70px;height:70px;
          box-shadow:0 0 0 2px rgba(61,226,166,.5),0 3px 14px rgba(0,0,0,.45);}
        .cd-prixg{margin:9px 0 0;font-size:clamp(24px,7.4vw,34px);font-weight:850;
          letter-spacing:-.03em;line-height:1;color:#fff;
          font-variant-numeric:tabular-nums;}
        .cd-prixg s{margin-left:9px;font-size:14px;font-weight:600;color:#9DB0A6;}
        /* ⚡ SUR UN FLASH, L'ANCIEN PRIX EST LA MOITIE DE L'INFORMATION. Il
           passe devant, gros et barre ; le nouveau suit en ambre. On lit la
           CHUTE, pas un prix avec une note de bas de page. */
        .cd-prixg.flash{display:flex;align-items:baseline;justify-content:center;
          gap:12px;color:#FFD75E;text-shadow:0 2px 18px rgba(240,180,41,.45);}
        .cd-prixg.flash s{margin:0;font-size:clamp(17px,5vw,23px);font-weight:750;
          color:rgba(255,255,255,.5);}
        .cd-chez{margin:11px 0 0;font-size:14.5px;font-weight:650;
          line-height:1.25;color:#EAF2EC;text-wrap:balance;}
        .cd-chez s{text-decoration:none;font-weight:400;color:#B4C6BB;}
        .cd-carte.sec .cd-social{align-self:center;margin-top:9px;}
        /* « JUSQU'A QUAND » EST LA SEULE RARETE QU'ON PUISSE ECRIRE SANS
           L'INVENTER. On ne sait pas combien il reste de parts — un commercant
           photographie son ardoise le matin et ne decompte rien pendant le
           service. L'heure, elle, on la connait sans rien demander a personne. */
        /* ⚡ LE FLASH SE VOIT DE LOIN, ET IL EST LE SEUL AMBRE DE LA CARTE.
           « Il faut que ce soit completement identifiable dans le Direct. » Le
           vert est la couleur de tout le reste ; l'ambre ne sert qu'ici et sur
           l'engagement. Une carte Flash ne se confond avec aucune autre, meme
           en balayant vite. */
        /* ═══ ⚡ LA CARTE ENTIERE EST DIFFERENTE ═══
           « L'annonce ne fait pas differente d'une autre alors qu'elle devrait
           etre TRES differente pour montrer l'exceptionnel de ce moment. »

           UNE PASTILLE NE SUFFIT PAS, ET C'EST LA LECON. On balaie ce paquet a
           la seconde ; un petit objet ambre sur une carte par ailleurs
           identique ne se voit pas. Ce qui se voit, c'est une CARTE d'une autre
           couleur : un liseré ambre tout autour, une lueur chaude, et un voile
           qui rechauffe la photo. On sait que c'est autre chose avant d'avoir
           lu un seul mot. */
        /* LE LISERE EST A L'INTERIEUR, ET C'EST UNE CORRECTION MESUREE : la
           carte du dessus occupe tout l'ecran, donc un contour POSE AUTOUR
           tombe hors du cadre et ne se voit jamais. Vu sur la capture — la
           regle etait ecrite, l'effet invisible. La lueur exterieure reste pour
           la carte du dessous, qui, elle, a des marges. */
        .cd-carte.flash{box-shadow:inset 0 0 0 2px rgba(247,201,72,.8),
          inset 0 0 90px -20px rgba(240,180,41,.55),
          0 26px 60px -24px rgba(240,180,41,.75);}
        .cd-carte.flash .cd-voile{background:linear-gradient(180deg,
          rgba(60,32,0,.42) 0%,rgba(24,14,2,.66) 46%,rgba(10,6,1,.92) 100%);}

        /* ─── LE CHRONO EST L'ACTEUR PRINCIPAL ───
           « Le chrono devrait etre tres different, comme l'acteur principal. »
           Le nombre de minutes est ecrit a la taille d'un prix ; c'est la seule
           question qu'on se pose devant un Flash — est-ce que j'ai le temps ? */
        .cd-flash{display:flex;flex-direction:column;align-items:center;gap:2px;
          margin:0 0 10px;padding:9px 18px 11px;border-radius:20px;
          background:rgba(60,36,0,.5);border:1px solid rgba(247,201,72,.65);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .cd-flash-t{display:flex;align-items:center;gap:6px;font-size:10.5px;
          font-weight:850;letter-spacing:.24em;text-transform:uppercase;color:#F7C948;}
        .cd-flash-t i{font-style:normal;font-size:13px;letter-spacing:0;}
        .cd-flash-n{display:flex;align-items:baseline;gap:7px;}
        .cd-flash-n b{font-size:38px;font-weight:850;letter-spacing:-.04em;
          line-height:1;color:#FFD75E;font-variant-numeric:tabular-nums;}
        .cd-flash-n em{display:flex;flex-direction:column;align-items:flex-start;
          font-style:normal;font-size:13px;font-weight:850;line-height:1.05;
          color:#FFD75E;}
        .cd-flash-n em s{text-decoration:none;font-size:9.5px;font-weight:700;
          letter-spacing:.1em;text-transform:uppercase;color:rgba(255,215,94,.7);}
        /* LA BARRE QUI DESCEND. Elle ne clignote pas et ne change pas de couleur
           en fin de course : le temps qui passe est une information, pas une
           alarme. */
        .cd-flash-j{display:block;width:100%;height:4px;margin-top:7px;
          border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden;}
        .cd-flash-j u{display:block;height:100%;text-decoration:none;
          background:linear-gradient(90deg,#FFD75E,#F0B429);
          transition:width .9s linear;}
        .cd-quand{display:inline-block;margin-top:11px;font-size:11.5px;
          font-weight:850;letter-spacing:.05em;text-transform:uppercase;
          color:#04150E;background:#F0B429;border-radius:999px;padding:5px 12px;}

        .cd-gestes{display:flex;align-items:flex-start;justify-content:center;gap:26px;margin-top:16px;}
        .cd-g{display:flex;flex-direction:column;align-items:center;gap:6px;}
        .cd-g i{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;
          font-style:normal;font-size:19px;color:#D6DEE4;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.12);transition:transform .3s cubic-bezier(.34,1.4,.64,1),box-shadow .3s ease;}
        .cd-g.grand i{width:62px;height:62px;font-size:24px;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);box-shadow:0 14px 30px -12px rgba(18,185,129,.85);}
        .cd-g em{font-style:normal;font-size:11px;font-weight:700;color:#93A79C;}
        .cd-g.grand em{color:#8FE9C4;}
        /* Le geste mis en avant grossit — c'est le seul moment où la carte
           montre ce qu'on ATTEND de l'habitant, pas ce qu'on lui propose. */
        .cd-g.on i{transform:scale(1.14);box-shadow:0 0 0 4px rgba(126,230,192,.22);}

        @media (max-width:380px){
          .cd-carte{max-width:300px;}
          .cd-nom{font-size:22px;}
          .cd-gestes{gap:20px;}
          .cd-g i{width:44px;height:44px;}
          .cd-g.grand i{width:56px;height:56px;}
        }
        @media (prefers-reduced-motion:reduce){
          .cd-g i{transition:none;}
        }
      `,
      }}
    />
  );
}
