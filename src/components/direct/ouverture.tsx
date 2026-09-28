"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 🎬 L'OUVERTURE — neuf secondes avant le premier écran de la démonstration.
 *
 * ═══ CE QU'ELLE DOIT FAIRE COMPRENDRE ══════════════════════════════════════
 *
 * « 2 secondes : le fantôme dans son canapé ouvre ClikMe. 4 secondes : on se
 * rapproche du téléphone, il touche une veste, elle apparaît sur son image
 * tandis que lui reste inchangé. 3 secondes : il arrive devant la boutique,
 * retrouve cette même veste en vitrine et la commerçante l'accueille. Une
 * découverte, un essai, une vraie rencontre. On comprend immédiatement pourquoi
 * il utilise ClikMe. »
 *
 * TROIS ACTES, ET L'ORDRE EST TOUT LE PROPOS. Chacun pris seul ne dit rien de
 * neuf : un fantôme sur un canapé est une mascotte, un essayage virtuel existe
 * ailleurs, une commerçante qui accueille est une photo de site. C'est la
 * SUITE des trois qui dit ce que fait le produit — on découvre chez soi, on
 * essaie sur son écran, on va voir la personne.
 *
 * ═══ ET LA PROMESSE RESTE GÉNÉRALE ════════════════════════════════════════
 *
 * « Pour éviter que l'introduction donne l'impression d'une application
 * uniquement consacrée aux vêtements, garde la promesse générale "Votre ville à
 * essayer. Avant d'y aller.", puis affiche les cinq catégories sur l'écran qui
 * suit. »
 *
 * C'EST LE RISQUE RÉEL DE CETTE OUVERTURE, et il fallait le dire. Neuf secondes
 * de veste laissent croire à une application de mode ; la phrase au-dessus dit
 * que la veste est un exemple, et les trois mots du bas — « une découverte, un
 * essai, une vraie rencontre » — nomment des moments et pas des rayons. L'écran
 * suivant montre les cinq catégories, ce qui referme la question avant qu'on la
 * pose.
 *
 * LA PHRASE EST ÉCRITE ICI, PAS DANS LES FILMS. Elle était incrustée dans les
 * premiers rendus ; les neuf nouveaux n'ont aucun texte, et c'est mieux ainsi.
 * Écrite en HTML elle reste nette à toutes les tailles, elle se corrige sans
 * refabriquer les films, et surtout ELLE NE TRAVERSE AUCUN FONDU : posée
 * au-dessus des trois actes, elle ne bouge pas d'un point pendant qu'ils se
 * croisent.
 *
 * ═══ LE MOUVEMENT EST DANS LES FILMS, PAS DANS LE CODE ═════════════════════
 *
 * « Je veux déjà que l'image remplisse l'écran sans bouger, et que ce soit dans
 * chaque image qu'il y ait des animations pour faire comprendre le concept.
 * Donc c'est le Fantôme qui bouge. »
 *
 * J'AVAIS FAIT L'INVERSE, ET C'ÉTAIT UN CONTRESENS : la caméra avançait sur une
 * photo fixe, faute de quelque chose qui bouge DANS l'image. Un mouvement de
 * caméra sur une photo donne un diaporama de présentation ; ce qu'il demande est
 * une scène où quelqu'un fait quelque chose.
 *
 * AUCUNE LIGNE DE CODE NE FAIT BOUGER QUELQU'UN PEINT DANS UNE PHOTO. Mesuré en
 * essayant de le détourer : son corps se sépare du canapé — luminance 173 contre
 * 47 — mais sa casquette est à 29, plus sombre que le canapé, et reste dans le
 * fond. Et même réussi, il resterait le trou derrière lui.
 *
 * LA PREMIÈRE VERSION DES FILMS A ÉTÉ REFUSÉE POUR ÇA, et c'était juste : « ça
 * fait vraiment très pauvre comme animation ». Elle posait des lueurs et faisait
 * voler une vignette autour d'un personnage immobile. À l'écran, ce qui raconte,
 * c'est le personnage — tant qu'il ne bouge pas, aucune lumière ne sauve le plan.
 *
 * IL A DONC FALLU D'AUTRES RENDUS. Neuf images au lieu de trois : trois poses par
 * acte, même cadrage, même lumière, seul le Fantôme change. Les films sont
 * fabriqués ENTRE ces poses — voir `scripts/fabriquer-ouverture.mjs`, qui
 * explique le flou de bougé masqué et le voile de la veste.
 *
 * CHAQUE ACTE RESTE DONC UN FILM. Le mouvement est dedans, réglé une fois pour
 * toutes ; le code n'enchaîne que les trois. Voir le LISEZ-MOI à côté des
 * fichiers pour le format attendu.
 */

/**
 * LES TROIS ACTES, DANS L'ORDRE, AVEC LEUR DURÉE.
 *
 * `film` EST UN NOM SANS EXTENSION : les deux sources — `webm` puis `mp4` — se
 * déduisent de lui. Le `webm` passe en premier parce qu'il est plus léger à
 * qualité égale ; le navigateur qui ne sait pas le lire prend le `mp4` tout
 * seul, et c'est à ça que sert d'en donner deux.
 *
 * `image` N'EST PAS UNE COPIE DE SECOURS, C'EST L'AFFICHE DU FILM. Elle s'affiche
 * tant que la première image du film n'est pas prête — sans elle, chaque acte
 * commencerait par un éclair noir. Et si le film n'existe pas du tout, elle reste
 * : l'ouverture se joue alors en trois photos fixes, ce qui est exactement ce
 * qu'elle faisait avant.
 */
const ACTES = [
  {
    film: "/direct/ouverture/1",
    image: "/direct/ouverture/1.jpg",
    duree: 2000,
    mot: "Une découverte.",
    alt: "Le Fantôme, chez lui, ouvre ClikMe.",
  },
  {
    film: "/direct/ouverture/2",
    image: "/direct/ouverture/2.jpg",
    duree: 4000,
    mot: "Un essai.",
    alt: "Sur son téléphone, la veste apparaît sur son image.",
  },
  {
    film: "/direct/ouverture/3",
    image: "/direct/ouverture/3.jpg",
    duree: 3000,
    mot: "Une vraie rencontre.",
    alt: "Devant la boutique, la veste en vitrine, la commerçante l’accueille.",
  },
] as const;

/**
 * LE FONDU EST PLUS COURT QUE LE PLUS COURT DES ACTES.
 *
 * Deux secondes pour le premier : un fondu d'une seconde en mangerait la
 * moitié, et l'on ne verrait jamais le plan net. À 420 millisecondes, le
 * passage se sent sans se regarder.
 */
const FONDU = 420;

/**
 * LE FILET DE SÉCURITÉ, QUAND LE FILM NE DIT PAS QU'IL EST FINI.
 *
 * `ended` EST LA BONNE HORLOGE : c'est le film lui-même qui dit quand son geste
 * est terminé, donc une prise un peu plus longue que prévu ne se fait pas couper
 * au milieu. Mais un fichier abîmé, un décodeur qui cale, un onglet mis en
 * arrière-plan — et l'événement n'arrive jamais. L'ouverture resterait figée sur
 * un acte, avant le premier écran d'une démonstration qu'on montre à quelqu'un.
 *
 * ON LAISSE DONC UNE SECONDE ET DEMIE DE PLUS QUE LA DURÉE ANNONCÉE, et passé ce
 * délai on avance quoi qu'il arrive.
 */
const RAB = 1500;

export function Ouverture({ onFini }: { onFini: () => void }) {
  const [acte, setActe] = useState(0);
  /**
   * `parti` EST VRAI DÈS QUE LA SORTIE EST LANCÉE, et il ne redevient jamais
   * faux. Sans lui, un doigt posé pendant le dernier fondu appellerait `onFini`
   * une seconde fois — l'écran d'après se monterait deux fois, et la première
   * fois pour rien.
   */
  const parti = useRef(false);
  const finir = () => {
    if (parti.current) return;
    parti.current = true;
    onFini();
  };
  const suite = () => (acte + 1 < ACTES.length ? setActe(acte + 1) : finir());

  /* ═══ SANS LES IMAGES, L'OUVERTURE SE RETIRE D'ELLE-MÊME ════════════════

     UNE OUVERTURE À MOITIÉ CHARGÉE EST PIRE QUE PAS D'OUVERTURE. Neuf secondes
     de fond vide avant une démonstration qu'on montre à quelqu'un, c'est une
     panne que personne ne peut deviner ni contourner.

     ON CHARGE DONC LA PREMIÈRE AFFICHE AVANT DE COMMENCER : si elle n'arrive
     pas, on passe la main tout de suite et la démonstration s'ouvre comme
     avant. C'est l'affiche qu'on teste et pas le film, parce que l'affiche est
     le plus petit des deux et qu'elle suffit à jouer l'ouverture : les films
     peuvent manquer sans que rien ne casse. */
  const [prete, setPrete] = useState(false);
  useEffect(() => {
    const img = new Image();
    let vivant = true;
    img.onload = () => vivant && setPrete(true);
    img.onerror = () => vivant && finir();
    img.src = ACTES[0].image;
    /* LES AFFICHES SUIVANTES SE CHARGENT PENDANT QUE LA PREMIÈRE JOUE. Demandées
       au moment du fondu, elles arriveraient après lui : on verrait le noir entre
       deux actes, ce qui est exactement ce qu'un fondu sert à éviter. */
    for (const a of ACTES.slice(1)) new Image().src = a.image;
    return () => {
      vivant = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══ DEUX HORLOGES, ET C'EST LE FILM QUI DIT LAQUELLE ═════════════════

     MESURE, SANS LES FILMS : les actes duraient 3,5 puis 5,5 puis 4,5 secondes
     au lieu de 2, 4 et 3. Le rab attendait la fin d'un film qui n'existait pas.

     TANT QU'AUCUN FILM N'A DEMARRE, L'ACTE DURE EXACTEMENT CE QU'IL ANNONCE —
     c'est le minutage d'une ouverture en photos, et il doit rester le sien.
     DES QU'UN FILM JOUE, C'EST LUI QUI COMMANDE : `ended` dit quand son geste
     est fini, donc une prise un peu plus longue que prévu ne se fait pas couper
     au milieu, et le rab n'est plus qu'un filet si l'événement n'arrive jamais. */
  const [filmJoue, setFilmJoue] = useState(false);
  useEffect(() => setFilmJoue(false), [acte]);
  useEffect(() => {
    if (!prete) return undefined;
    const t = window.setTimeout(suite, ACTES[acte].duree + (filmJoue ? RAB : 0));
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prete, acte, filmJoue]);

  /* ═══ ON NE JOUE QUE L'ACTE EN COURS ═══════════════════════════════════

     LES TROIS FILMS SONT MONTÉS EN MÊME TEMPS, parce qu'un film monté au moment
     du fondu arriverait après lui. Mais trois vidéos qui jouent ensemble, ce
     sont trois décodages en parallèle pour deux images visibles : sur un
     téléphone, c'est ce qui fait saccader le fondu.

     CELUI QUI SORT EST SEULEMENT MIS EN PAUSE, ET SURTOUT PAS REMIS A ZERO.

     LE DEFAUT, MESURE A L'ECRAN : on le rembobinait en le quittant, et comme le
     plan sortant garde son opacité pleine le temps du fondu, on voyait pendant
     420 ms LE DEBUT DE L'ACTE QU'ON VENAIT DE REGARDER. Relevé sur l'acte 2 : à
     5,6 secondes, le Fantôme était de nouveau en tee-shirt, vignette blanche
     encadrée, comme à la première image — juste après l'avoir vu habillé.

     EN PAUSE, IL GARDE SA DERNIERE IMAGE, qui est exactement ce qu'il faut sous
     le plan qui arrive. LE REMBOBINAGE A DONC CHANGE DE PLACE : c'est celui qui
     ENTRE qui repart de zéro, juste avant de jouer. Une ouverture qui se rejoue
     se rejoue toujours entière, et plus rien ne clignote en sortant. */
  const films = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    if (!prete) return;
    films.current.forEach((v, k) => {
      if (!v) return;
      if (k === acte) {
        try {
          v.currentTime = 0;
        } catch {
          /* pas encore chargée : elle démarrera de toute façon à zéro */
        }
        /* LE REFUS DE LECTURE N'EST PAS UNE PANNE : un navigateur peut refuser
           de démarrer une vidéo, et l'affiche reste alors à l'écran. L'horloge
           de secours fait avancer l'acte comme si c'était une photo. */
        void v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [prete, acte]);

  if (!prete) return null;

  return (
    /* TOUTE LA SURFACE PASSE L'OUVERTURE, et pas seulement un petit « Passer ».
       Neuf secondes sont courtes pour qui découvre et longues pour qui montre la
       démonstration à quelqu'un pour la sixième fois de la journée : il doit
       pouvoir la couper d'un doigt posé n'importe où. La pastille reste, parce
       qu'une surface qui réagit sans le dire ne se découvre jamais. */
    <button type="button" className="ouv" onClick={finir} aria-label="Passer l’ouverture">
      {ACTES.map((a, k) => (
        <span key={a.film} className={`ouv-acte${k === acte ? " on" : ""}`} aria-hidden={k !== acte}>
          {/* LE CALQUE FLOU RESTE SOUS LE FILM, et il ne sert qu'aux écrans si
              larges que même « cover » laisserait paraître un bord. Il ne coûte
              rien et il évite d'avoir à en découvrir le besoin en rendez-vous. */}
          <span className="ouv-flou" style={{ backgroundImage: `url("${a.image}")` }} />
          <video
            ref={(n) => {
              films.current[k] = n;
            }}
            className="ouv-film"
            poster={a.image}
            /* MUET, ET CE N'EST PAS UN CHOIX DE GOÛT : un navigateur refuse de
               démarrer tout seul une vidéo qui a du son. Une ouverture sonore
               serait de toute façon la façon la plus rapide de faire fermer une
               démonstration ouverte dans une salle d'attente. */
            muted
            autoPlay={k === 0}
            playsInline
            /* `preload="auto"` SUR LES TROIS : le deuxième film doit être prêt
               deux secondes après l'ouverture, ce qui ne laisse pas le temps de
               le demander au moment du fondu. */
            preload="auto"
            onPlaying={() => k === acte && setFilmJoue(true)}
            onEnded={() => k === acte && suite()}
            aria-label={a.alt}
          >
            <source src={`${a.film}.webm`} type="video/webm" />
            <source src={`${a.film}.mp4`} type="video/mp4" />
          </video>
          {/* LE MOT DE L'ACTE EST DANS L'ACTE, donc il traverse le fondu avec
              lui : l'ancien s'efface pendant que le nouveau monte, sans qu'on
              ait une deuxième horloge à tenir. */}
          <span className="ouv-mot">{a.mot}</span>
        </span>
      ))}
      {/* LES DEUX VOILES SONT HORS DES ACTES, ET C'EST MESURABLE : mis dedans,
          ils se croiseraient comme le reste, et deux voiles à moitié
          transparents laissent passer plus de lumière qu'un seul — le texte
          perdrait son fond au milieu de chaque fondu, là où l'image est la
          plus chargée. Immobiles, ils tiennent la lisibilité du début à la
          fin. */}
      <span className="ouv-voile ouv-voile-haut" aria-hidden="true" />
      <span className="ouv-voile ouv-voile-bas" aria-hidden="true" />
      {/* LA PROMESSE NE BOUGE JAMAIS, et c'est sa seule raison d'être ici
          plutôt que dans les films. Neuf secondes de veste laissent croire à
          une application de mode ; cette phrase dit que la veste est un
          exemple. Elle était incrustée dans les anciens rendus — les nouveaux
          n'ont aucun texte, ce qui vaut mieux : écrite en HTML elle est nette
          à toutes les tailles, et elle ne traverse aucun fondu. */}
      <p className="ouv-promesse">
        Votre ville à essayer.<b>Avant d’y aller.</b>
      </p>
      <span className="ouv-passer">Passer</span>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </button>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
.ouv{position:absolute;inset:0;z-index:60;overflow:hidden;
  padding:0;border:0;font:inherit;cursor:pointer;
  background:#1A0820;
  -webkit-user-select:none;user-select:none;}

/* ═══ CELUI QUI ARRIVE RECOUVRE CELUI QUI SORT ═══════════════════════════

   DEUX OPACITES QUI SE CROISENT LAISSENT VOIR LE FOND ENTRE LES DEUX. Mesure a
   l'ecran, au milieu du passage : les deux plans a moitie transparents ne font
   pas un plan opaque, et le #1A0820 du bouton remontait entre eux — l'ouverture
   plongeait vers le noir trois fois en neuf secondes.

   ALORS ON NE CROISE PLUS, ON RECOUVRE. Le sortant GARDE son opacite pleine le
   temps du fondu, puis tombe d'un coup quand il est deja cache dessous ; c'est
   le 1ms lineaire precede de son delai. L'entrant, lui, monte par-dessus — et
   il est toujours plus bas dans le document, donc toujours au-dessus a l'ecran,
   puisque l'ouverture ne va que dans un sens.

   ET LES LEGENDES NE SE SUPERPOSENT PLUS NON PLUS. L'ancienne reste nette
   jusqu'au bout, mais elle est DERRIERE le plan qui arrive : on ne la voit pas
   se melanger a la nouvelle, on la voit disparaitre sous l'image. C'est ce que
   l'ancien reglage asymetrique cherchait a obtenir, en moins bien. */
.ouv-acte{position:absolute;inset:0;opacity:0;
  transition:opacity 1ms linear ${FONDU}ms;}
.ouv-acte.on{opacity:1;transition:opacity ${FONDU}ms ease-in;}

.ouv-flou{position:absolute;inset:0;
  background-size:cover;background-position:center;
  filter:blur(38px) brightness(.7);transform:scale(1.2);}

/* ═══ LE PLAN REMPLIT L'ECRAN, ET IL NE BOUGE PAS ════════════════════════
   « Je veux deja que l'image remplisse l'ecran sans bouger. »
   Le mode object-fit:cover ROGNE PAR LES COTES, et j'avais garde l'image entiere pour
   cette raison : sur un ecran tres haut, la rogne atteint neuf pour cent de
   chaque bord et sa legende du bas commence a douze. C'etait une prudence
   contre une demande claire. On remplit, et la rogne reste bornee par le
   centrage : c'est toujours le milieu du plan qu'on garde, et tout son texte y
   est centre. */
.ouv-film{position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;object-position:center;
  display:block;background:transparent;}

/* ═══ DE QUOI LIRE LE TEXTE SUR N'IMPORTE QUELLE IMAGE ═══════════════════
   Les trois plans sont clairs par endroits — la lampe du salon, la vitrine
   allumee, le pave au soleil. Du texte blanc pose dessus se perd. Les deux
   voiles sont des degrades qui ne foncent que les bords : au milieu, la ou se
   joue la scene, ils valent zero. */
.ouv-voile{position:absolute;left:0;right:0;pointer-events:none;}
.ouv-voile-haut{top:0;height:30%;
  background:linear-gradient(to bottom,rgba(10,4,16,.78),rgba(10,4,16,.34) 52%,rgba(10,4,16,0));}
.ouv-voile-bas{bottom:0;height:34%;
  background:linear-gradient(to top,rgba(10,4,16,.80),rgba(10,4,16,.36) 50%,rgba(10,4,16,0));}

/* LA PROMESSE, EN DEUX LIGNES ET DEUX COULEURS. La seconde est la charniere du
   propos — « avant d'y aller » — donc elle prend le rose de la marque et le
   poids. Le retrait par le haut suit l'encoche du telephone. */
.ouv-promesse{position:absolute;left:0;right:0;
  top:calc(22px + var(--ap-haut,0px));margin:0;padding:0 22px;
  text-align:center;pointer-events:none;
  font-size:clamp(15px,4.6vw,19px);font-weight:800;line-height:1.28;
  letter-spacing:.005em;color:#FFFFFF;
  text-shadow:0 2px 12px rgba(0,0,0,.55);}
.ouv-promesse b{display:block;font-weight:900;color:#FF2E9A;}

/* LE MOT DE L'ACTE. Trois mots pour trois actes — « une decouverte, un essai,
   une vraie rencontre » — et c'est aussi ce qui dit que l'application ne
   s'arrete pas aux vetements : on nomme des moments, pas des rayons.
   IL EST AU-DESSUS DE LA PASTILLE, pas a cote : la pastille est en bas a
   droite, et un mot centre sur la meme ligne finirait dessous sur un ecran
   etroit. */
.ouv-mot{position:absolute;left:0;right:0;
  bottom:calc(60px + var(--ap-bas,0px));padding:0 22px;
  text-align:center;pointer-events:none;
  font-size:clamp(14px,4.1vw,17px);font-weight:800;line-height:1.3;
  letter-spacing:.01em;color:rgba(255,255,255,.94);
  text-shadow:0 2px 12px rgba(0,0,0,.6);}

/* LA PASTILLE DIT QUE CA SE PASSE. Discrete, en bas a droite, la ou le pouce
   est deja — et pas au milieu, ou elle serait posee sur le plan. */
.ouv-passer{position:absolute;right:14px;
  bottom:calc(14px + var(--ap-bas,0px));
  padding:7px 14px;border-radius:999px;
  font-size:12px;font-weight:800;letter-spacing:.02em;color:rgba(255,255,255,.82);
  background:rgba(12,10,18,.55);
  border:1px solid rgba(255,255,255,.22);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}

@media (prefers-reduced-motion:reduce){
  /* ON GARDE LES TROIS ACTES ET ON RETIRE LE FONDU. Supprimer les actes
     retirerait l'histoire a ceux qui ne supportent pas le mouvement, alors que
     c'est l'histoire qu'on est venu raconter ; ce qui gene ici, c'est le
     glissement d'un plan a l'autre, pas le fait qu'ils se suivent.
     LES FILMS, EUX, RESTENT. Un reglage systeme qui reduit les animations d'une
     interface ne demande pas de couper le son de la television : ce qu'il
     designe, ce sont les mouvements que l'interface s'ajoute a elle-meme. */
  .ouv-acte{transition:none;}
}
`;
