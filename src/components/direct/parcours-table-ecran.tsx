"use client";

/**
 * 🍽️ LE PARCOURS RESTAURANT — ses quatre maquettes, jouées.
 *
 * ═══ CELUI-LA N'A PRESQUE RIEN EU A INVENTER ═══════════════════════════════
 *
 * Le Bocal de Margot est le commerce le mieux rempli de la démonstration : sa
 * carte, sa cuisinière, son mot, ses horaires, sa distance, son site. Les
 * quatre écrans LISENT tout — le nom du plat, son détail, ses onze euros, la
 * part à neuf euros, la phrase de Margot. Voir `parcours-table.ts`.
 *
 * ═══ TROIS ENDROITS OU SA MAQUETTE ET NOS DONNEES NE DISAIENT PAS PAREIL ═══
 *
 * 1. SA MAQUETTE SOUS-TITRE « Bœuf mijoté · béchamel · fromage gratiné ». Sa
 *    carte dit « Lasagnes maison — faites le matin ». Une recette inventée sur
 *    l'écran d'un restaurant est une promesse qu'il devra tenir en salle, donc
 *    l'écran affiche le détail de sa carte. L'autre plat du jour — le curry,
 *    au même prix — est une information vraie et plus utile qu'une recette :
 *    elle dit qu'on a le choix.
 *
 * 2. SA MAQUETTE DESSINE « Écouter Margot raconter son plat · 11 s ». Ce
 *    fichier n'existe pas, et on ne fabrique pas une voix. Le lecteur ne se
 *    dessine QUE si `voix.extrait` est rempli — il ne l'est pas aujourd'hui,
 *    donc l'étape montre sa phrase écrite, qui elle est vraie. Un bouton de
 *    lecture sur un silence se lit comme une panne.
 *
 * 3. SA MAQUETTE MET « Réserver » EN GROS SUR LES QUATRE ÉCRANS. Si le bouton
 *    principal saute à la fin dès la première étape, les deux du milieu ne se
 *    voient jamais — et ce sont elles qui donnent envie. Le bouton principal
 *    avance donc, avec ses mots à lui ; « Réserver » reste dessous, en second,
 *    et saute à la dernière étape. Sa promesse est tenue, son parcours aussi.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { onSpeakingChange, speak, stopSpeaking } from "@/lib/site-internet/speech";
import { VILLE } from "@/lib/direct/apercu-habitant";
import { demanderRendezVous, numeroDeFiction } from "@/lib/direct/prevenir";
import { motDeLaCarte, plaqueDuParcours } from "@/lib/direct/plaque-parcours";
import { BoutonCote, CoteCommercant } from "@/components/direct/cote-commercant";
import { DoubleChef } from "@/components/direct/double-chef";
import {
  COMMERCE_TABLE,
  DEVANTURE_TABLE,
  MARGOT_PHOTO,
  PART_PHOTO,
  PART_TABLE,
  PLAT_PHOTO,
  PLAT_TABLE,
} from "@/lib/direct/parcours-table";

/** Le fantôme du produit, celui de la casquette. */
function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

/**
 * LA FORME D'ONDE EST ÉCRITE, PAS TIRÉE AU HASARD.
 *
 * Un Math.random() donnerait une onde différente entre le serveur et le
 * navigateur — ce qui casse l'hydratation — et une onde qui saute à chaque fois
 * qu'on touche autre chose sur l'écran. Reprise de l'écran de l'Avant-goût,
 * pour que les deux se ressemblent.
 */
/* « DANS LA CUISINE DE LE CHEF », « PARLER À LE PATRON » : quand la voix
   n'a pas de prénom mais un titre (« Le chef », « La patronne »), l'article se
   contracte comme on le dit à voix haute. Un prénom passe tel quel. */
const contracter = (nom: string, prep: "de" | "à") =>
  nom.replace(/^(?:(?:Le|La|Les)\s|L’|L')/, (a) => {
    const m = a.trim().toLowerCase();
    if (m === "le") return prep === "de" ? "du " : "au ";
    if (m === "les") return prep === "de" ? "des " : "aux ";
    return `${prep} ${a.toLowerCase()}`;
  }).replace(/^(?!du |au |des |aux |de |à )/, `${prep} `);

const ONDE = [18, 34, 26, 52, 40, 68, 46, 78, 58, 88, 64, 74, 50, 62, 38, 56, 30, 44, 24, 36];

/**
 * « 0:07 / 0:28 » — les secondes de sa maquette, lisibles.
 *
 * PAS DE `toFixed` NI DE `Intl` : on écrit deux nombres, et un zéro devant les
 * secondes sous dix. Une durée mal formée — « 0:7 » — se remarque plus que
 * l'absence de durée.
 */
function minutes(secondes: number): string {
  const t = Math.max(0, Math.floor(secondes));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/**
 * LA LEGENDE EN DEUX TONS — c'est le dessin de sa maquette.
 *
 * « Mon magret, je le commence **côté peau**. » Le mot en gras est celui sur
 * lequel on l'entend appuyer ; le reste est en demi-ton. Ce n'est pas de la
 * décoration : sur une photo chargée, une phrase entièrement en gras blanc
 * n'accroche nulle part, et l'œil la saute.
 *
 * ON COUPE SUR LE MOT, PAS SUR UNE BALISE. Écrire du HTML dans les données
 * aurait mis du balisage dans la bouche du commerçant — c'est lui qui remplira
 * ces lignes un jour, et il n'écrira pas de balises.
 */
function decouper(phrase: string, fort?: string) {
  if (!fort) return phrase;
  const i = phrase.indexOf(fort);
  if (i < 0) return phrase;
  return (
    <>
      {phrase.slice(0, i)}
      <b>{fort}</b>
      {phrase.slice(i + fort.length)}
    </>
  );
}

export function ParcoursTable({
  onFermer,
  /* ═══ SEPT RESTAURANTS, ET UNE SEULE LASAGNE ═══════════════════════════

     « Il faut que, lorsqu'on clique sur le menu du restaurant, la photo soit
     la même que sur l'annonce, parce que présentement c'est toujours une
     lasagne maison même quand je clique sur un magret grillé ou un poulet
     basquaise. »

     `COMMERCE_TABLE` ÉTAIT FIGÉ SUR LE BOCAL DE MARGOT. Le paquet montre sept
     plats du jour, le bouton en ouvrait toujours le même : la promesse de la
     carte était rompue au premier appui.

     ET LES QUATRE ÉTAPES NE SONT PAS DUES À TOUT LE MONDE. Le rideau demande
     deux photos du même plat, la cuisinière demande une voix ou une vidéo —
     Margot a les deux, le traiteur n'a ni l'une ni l'autre. Les pas jouables
     se calculent donc par commerce, dans `plaque-parcours.ts`, et le compteur
     compte ce qui est là. On dégrade, on n'invente pas de cuisinière. */
  commerce,
}: {
  onFermer: () => void;
  commerce?: string;
}) {
  const [etape, setEtape] = useState(1);
  /**
   * LE RIDEAU DE LA DEUXIÈME ÉTAPE — sa position en pour cent.
   *
   * UN NOMBRE SANS UNITÉ, ET C'EST UNE LEÇON PAYÉE AILLEURS. Stocké en
   * « 62% », il arrive tel quel dans `calc((62% - 16%) / 6)` pour les
   * étiquettes, qui reste alors un pourcentage : l'opacité l'accepte et
   * l'interprète autrement, si bien que les libellés ne s'effacent jamais.
   */
  const [rideau, setRideau] = useState(58);
  const cadre = useRef<HTMLDivElement | null>(null);
  /**
   * LA VOIX DE LA TROISIÈME ÉTAPE.
   *
   * `joue` SUIT CE QUI PARLE VRAIMENT, pas ce qu'on a demandé : la lecture du
   * téléphone s'arrête toute seule à la fin de la phrase, et un état posé au
   * clic resterait allumé sur un silence. `onSpeakingChange` le remet à sa
   * place. Voir `speech.ts`.
   */
  const [joue, setJoue] = useState(false);
  useEffect(() => onSpeakingChange(setJoue), []);
  /* ON ARRÊTE EN QUITTANT L'ÉCRAN. Sans ça, la phrase continue par-dessus
     l'étape suivante — et on l'entend encore une fois revenu au choix. */
  useEffect(
    () => () => {
      stopSpeaking();
      try {
        sonRef.current?.pause();
      } catch {
        /* rien en cours */
      }
    },
    [],
  );
  /* ═══ TROIS VOIX POSSIBLES, DANS CET ORDRE ════════════════════════════

     « La voix est hyper robotique, il faut que tu trouves des voix
     naturelles. »

     1. SON ENREGISTREMENT, si quelqu'un l'a fait. Rien ne bat une vraie voix,
        et c'est la seule qui ne soit pas une imitation.
     2. LA VOIX CLOUD DU PROJET — `/api/direct/voix`. ElevenLabs ou OpenAI, avec
        une consigne de ton par personne : chaleureuse pour Margot, un léger
        accent du Sud-Ouest pour Jean-Marie. Le projet la servait déjà à
        l'Espace Pro ; le parcours ne l'appelait simplement pas.
     3. LA VOIX DU NAVIGATEUR, s'il n'y a ni l'un ni l'autre. C'est celle qu'il
        a entendue, et c'est pour ça qu'elle l'a choqué : elle articule, elle ne
        raconte pas. Elle reste, parce qu'une démonstration muette est pire
        qu'une démonstration robotique — mais elle n'est plus le premier choix.

     `cloud` SUIT CE QUI A RÉELLEMENT JOUÉ, pas ce qu'on espérait : c'est lui
     qui décide si la mention « voix de synthèse » s'affiche. L'écrire d'avance
     aurait menti dans les deux sens. */
  const [cloud, setCloud] = useState(false);
  const sonRef = useRef<HTMLAudioElement | null>(null);
  /* ═══ OU EN EST LA VOIX — c'est ce qui fait tourner les quatre photos ══

     « Les 4 photos devraient se succéder pendant que la voix parle, en 12
     secondes ; une photo toutes les 3 secondes je pense serait bien. »

     SON ENREGISTREMENT DURE 28 SECONDES, PAS 12 — mesuré sur le fichier qu'il a
     envoyé. Écrire « 3 secondes » dans le code aurait donc posé la quatrième
     image, celle qui dit « je vous le prépare ce midi ? », quinze secondes
     avant qu'il ne prononce la phrase, puis l'aurait laissée là tout le reste
     du récit.

     ON DIVISE DONC LA DURÉE RÉELLE EN QUATRE, et ses quatre temps gardent leur
     ordre quelle que soit la longueur de la prise — la sienne aujourd'hui,
     celle d'un vrai commerçant demain. C'est la même règle que partout
     ailleurs ici : on lit ce qui est là, on n'écrit pas un nombre qu'il faudra
     retoucher à chaque nouveau fichier.

     `avance` EST EN SECONDES DE VOIX, PAS EN IMAGES. Il vient de `currentTime`
     quand un fichier joue — donc il recule si l'on revient en arrière — et de
     l'horloge quand c'est le téléphone qui lit, faute de mieux. */
  const [avance, setAvance] = useState(0);
  const [duree, setDuree] = useState(0);
  /* ═══ ET ON PEUT AUSSI LES FAIRE DEFILER A LA MAIN ═════════════════════

     « Si on ne veut pas écouter la voix du restaurateur, on pourrait quand
     même faire défiler les 4 photos avec des flèches avant et arrière. »

     J'AVAIS ECRIT QU'ON N'AJOUTAIT AUCUN GESTE, ET C'ETAIT VRAI A MOITIE. Le
     raisonnement tenait pour qui écoute : on appuie une fois, l'écran suit la
     voix, et des flèches seraient du travail en plus pendant qu'on vous parle.
     Il ne tenait pas pour qui n'écoute PAS — dans un bus, en réunion, sans
     écouteurs — et ceux-là voyaient une seule photo, définitivement.

     `aLaMain` EST L'IMAGE CHOISIE AU DOIGT, ET ELLE S'EFFACE DES QUE LA VOIX
     REPREND : deux maîtres pour une même image finiraient par se battre, et
     c'est la voix qui doit gagner, puisque c'est elle qu'on est venu écouter.
     Voir `vu` plus bas. */
  const [aLaMain, setALaMain] = useState<number | null>(null);
  /** Le panneau du commerçant, ouvert par la pastille de la dernière étape. */
  const [cote, setCote] = useState(false);
  /** Le double du chef, ouvert par le bouton principal de la dernière étape. */
  const [double, setDouble] = useState(false);

  useEffect(() => {
    if (!joue) return undefined;
    const depart = Date.now();
    const t = window.setInterval(() => {
      const a = sonRef.current;
      if (a && !a.paused && Number.isFinite(a.duration) && a.duration > 0) {
        setDuree(a.duration);
        setAvance(a.currentTime);
      } else {
        /* LA VOIX DU NAVIGATEUR NE DIT PAS OU ELLE EN EST. `speechSynthesis`
           n'expose ni durée ni position : il ne reste que l'horloge, et la
           durée de repli plus bas. C'est moins juste, et c'est la seule chose
           qu'on puisse faire sans inventer. */
        setAvance((Date.now() - depart) / 1000);
      }
    }, 120);
    return () => window.clearInterval(t);
  }, [joue]);

  const jouerFichier = (src: string, estCloud: boolean) =>
    new Promise<boolean>((resolve) => {
      try {
        const a = new Audio(src);
        a.setAttribute("playsinline", "");
        sonRef.current = a;
        let parti = false;
        a.onplay = () => {
          parti = true;
          setJoue(true);
          setCloud(estCloud);
        };
        a.onended = () => {
          setJoue(false);
          resolve(true);
        };
        a.onerror = () => resolve(parti);
        void a.play().catch(() => resolve(false));
      } catch {
        resolve(false);
      }
    });

  const ecouterMargot = async () => {
    if (joue) {
      stopSpeaking();
      try {
        sonRef.current?.pause();
      } catch {
        /* rien en cours */
      }
      setJoue(false);
      return;
    }
    setAvance(0);
    setALaMain(null);
    if (voix?.extrait && (await jouerFichier(voix.extrait, true))) return;
    /* LA VOIX CLOUD NE PEUT DIRE QUE CE QUI EST DÉJÀ ÉCRIT : on lui passe la
       clé du commerce, elle va chercher le récit elle-même. Voir la route. */
    if (voix?.recit && (await jouerFichier(`/api/direct/voix?cle=${encodeURIComponent(cle)}`, true))) return;
    setCloud(false);
    speak(voix?.recit || voix?.signature || "");
  };
  /* ON BORNE À 2 ET 98, PAS À 0 ET 100 : tout au bord, la poignée sort du
     cadre et il n'y a plus rien à rattraper avec le doigt. */
  const tirer = useCallback((x: number) => {
    const b = cadre.current?.getBoundingClientRect();
    if (!b || !b.width) return;
    setRideau(Math.min(98, Math.max(2, ((x - b.left) / b.width) * 100)));
  }, []);

  const cle = commerce || COMMERCE_TABLE;
  const plaque = plaqueDuParcours(cle, ["chose", "paire", "voix", "venir"]);
  const resto = plaque?.commerce;
  /* ═══ LA DUREE SE LIT AVANT QU'ON APPUIE ═══════════════════════════════

     MESURE A L'ECRAN : la ligne disait « 0:00 / 0:12 » sur un enregistrement de
     vingt-huit secondes, jusqu'au premier appui. Douze est la valeur de repli,
     et elle s'affichait comme une promesse — on annonçait un récit deux fois
     plus court que le sien.

     `preload="metadata"` NE TELECHARGE QUE L'EN-TETE, quelques centaines
     d'octets : assez pour connaître la durée, pas assez pour peser. On la lit
     donc à l'ouverture du parcours, et la ligne est juste dès la première
     seconde. L'objet est jeté ensuite — il n'a jamais servi à jouer.

     IL EST ICI, ET PAS PLUS HAUT AVEC LES AUTRES CROCHETS, parce qu'il lui faut
     le commerce — et le commerce n'est connu qu'une fois la plaque résolue. Il
     reste au-dessus du `return null`, qui est la seule chose qui compte. */
  const extrait = resto?.voix?.extrait;
  useEffect(() => {
    if (!extrait) return undefined;
    const a = new Audio();
    a.preload = "metadata";
    const lu = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuree(a.duration);
    };
    a.addEventListener("loadedmetadata", lu);
    a.src = extrait;
    return () => a.removeEventListener("loadedmetadata", lu);
  }, [extrait]);

  if (!plaque || !resto) return null;

  /* ═══ LE PLAT : DE SA CARTE CHEZ MARGOT, DE SON ANNONCE AILLEURS ═══════

     LE BOCAL DE MARGOT A DEUX LIGNES DE CARTE FAITES POUR CET ÉCRAN : le plat
     à onze euros et la part à neuf. Les six autres restaurants n'ont pas cette
     paire, et leur plat du jour est dans leur ANNONCE — c'est elle que la carte
     du paquet montrait, donc c'est elle qu'on ouvre.

     ON GARDE LES DEUX CHEMINS. Lire l'annonce partout ferait perdre à Margot
     le détail de sa carte et le prix de sa barquette, qui sont écrits et vrais.
     Lire la carte partout ferait inventer des identifiants qui n'existent pas.
     Chacun rend ce qu'il a. */
  const carte = resto.catalogue ?? [];
  const deLaCarte = carte.find((a) => a.id === PLAT_TABLE);
  const chezMargot = cle === COMMERCE_TABLE && deLaCarte;
  /* LE NOM EST CELUI QUE LA CARTE DU PAQUET PROMETTAIT — voir `motDeLaCarte`.
     Le titre du moment dit l'heure (« Le service du midi ») là où la carte dit
     l'assiette (« Magret grillé, pommes sarladaises ») : on ouvrait un magret
     pour arriver sur un horaire. Quand la carte ne nomme rien, c'est que le
     titre du moment nomme déjà le plat, et il reprend sa place. */
  const plat = chezMargot
    ? deLaCarte
    : {
        id: plaque.offre?.titre ?? cle,
        nom: motDeLaCarte(cle) ?? plaque.offre?.titre ?? resto.nom,
        detail: plaque.offre?.lignes?.[0],
        prix: plaque.offre?.prix,
        rayon: "",
      };
  const part = chezMargot
    ? carte.find((a) => a.id === PART_TABLE)
    : plaque.motDeux
      ? { id: `${cle}-servi`, nom: plat.nom, detail: plaque.motDeux, prix: undefined, rayon: "" }
      : undefined;

  /* L'AUTRE PLAT DU JOUR, s'il y en a un au même prix : c'est ce qui remplace
     la recette inventée de sa maquette, et c'est plus utile. */
  const autrePlat = chezMargot
    ? carte.find((a) => a.id !== PLAT_TABLE && a.rayon === plat.rayon && a.prix === plat.prix)
    : undefined;

  const nom = resto.nom;
  const ou = `${resto.distance}${resto.ville ? ` · ${resto.ville}` : ` · ${VILLE}`}`;
  const voix = resto.voix;
  const vignette = resto.sesPhotos?.[0]?.src ?? resto.photo ?? plaque.photo;

  /* ═══ LES PAS SONT CEUX QUE CE COMMERCE PEUT TENIR ════════════════════
     Voir `plaque-parcours.ts` : le rideau demande deux photos, la cuisinière
     demande une voix ou une vidéo. Le compteur compte ce qui est là — annoncer
     « 1/4 » pour en montrer deux serait la même promesse rompue, d'un cran
     plus bas. */
  const PAS = plaque.pas;
  const total = PAS.length;
  const ici = PAS[Math.min(etape, total) - 1];

  /* LE PLAT ET SA PART, EN PHOTO : celles de l'annonce, jamais celles de
     Margot quand ce n'est pas chez elle. C'est toute la demande. */
  const PHOTO_PLAT = chezMargot ? PLAT_PHOTO : plaque.photo;
  const PHOTO_PART = chezMargot ? PART_PHOTO : (plaque.photoDeux ?? plaque.photo);
  /* LE PORTRAIT ET LA DEVANTURE N'EXISTENT QUE CHEZ MARGOT. Ailleurs, l'écran
     de la voix prend l'affiche de la vidéo du commerçant s'il en a une, et la
     dernière étape prend sa première photo à lui. */
  const PHOTO_VOIX = chezMargot ? MARGOT_PHOTO : (plaque.offre?.video?.affiche ?? vignette);
  /* LA PHOTO DU DERNIER ECRAN : CELLE DE L'ACCUEIL, SI ELLE EXISTE.
     « Le dernier écran est trop faible. » Il finissait sur une salle vide,
     c'est-à-dire sur des tables mises et personne dedans, juste après qu'on a
     entendu quelqu'un raconter son plat. Quand le commerce a photographié la
     personne qui accueille — voir `photoAccueil` — c'est elle qui ouvre la
     porte ; sinon on garde sa première photo à lui, et l'écran ne change pas
     d'une ligne pour autant. */
  const PHOTO_VENIR =
    resto.photoAccueil ??
    (chezMargot ? DEVANTURE_TABLE : (resto.sesPhotos?.[0]?.src ?? resto.photo ?? plaque.photo));

  /* LE RENDEZ-VOUS PASSE PAR LE VRAI CHEMIN DU PRODUIT — voir `prevenir.ts` :
     un message deja ecrit sur WhatsApp, et le numero en secours. Le numero est
     une fiction stable, derivee de l'identifiant : voir `numeroDeFiction`. */
  const joindre = demanderRendezVous({
    telephone: numeroDeFiction(cle),
    nom,
    geste: "Réserver une table",
  });

  const suivant = () => setEtape((e) => Math.min(total, e + 1));
  const precedent = () => (etape === 1 ? onFermer() : setEtape((e) => e - 1));

  /* ═══ LES QUATRE TEMPS DU PLAT, ET QUI LES A ════════════════════════════

     « Même principe : un seul écran qui évolue pendant la voix. »

     SEUL CHEZ BERGINE LES A AUJOURD'HUI, et c'est la règle de tout ce parcours :
     le rideau ne se dessine que si le commerce a deux photos du même plat, la
     voix ne se dessine que s'il a quelque chose à dire, et les quatre temps ne
     se dessinent que s'il les a photographiés. Les six autres restaurants
     gardent l'écran chaleureux d'avant — une photo, un rond, une phrase — qui
     n'est pas un second choix mais ce que leurs données permettent de tenir.
     Voir `photosVoix` dans `apercu-habitant.ts`. */
  const suite = voix?.photosVoix ?? [];
  /* DOUZE SECONDES QUAND ON NE SAIT PAS, ET C'EST SON CHIFFRE A LUI. Il s'agit
     du cas où c'est le téléphone qui lit : aucune durée n'est connue, et son
     plan de départ — « 12 secondes, une photo toutes les 3 » — est la meilleure
     réponse qu'on ait. Dès qu'un fichier joue, sa vraie durée prend la place. */
  const dureeVoix = duree > 0 ? duree : 12;
  const pasVoix = suite.length ? dureeVoix / suite.length : 0;
  const parLaVoix = suite.length
    ? Math.min(suite.length - 1, Math.max(0, Math.floor(avance / pasVoix)))
    : 0;
  /* LA VOIX REPREND LA MAIN DES QU'ELLE PARLE : on écoute, on ne pilote plus. */
  const vu = joue || aLaMain === null ? parLaVoix : aLaMain;
  const allerA = (k: number) => {
    const n = Math.min(suite.length - 1, Math.max(0, k));
    setALaMain(n);
    /* ON DEPLACE AUSSI LE CURSEUR DU LECTEUR, pas seulement l'image : sans ça,
       la barre resterait à zéro pendant qu'on avance de photo en photo, et elle
       dirait le contraire de ce qu'on voit.
       ON NE TOUCHE PAS A L'AUDIO LUI-MEME, et c'est inutile de le faire : la
       lecture crée un nouvel élément à chaque appui et repart de zéro — voir
       `jouerFichier`. Déplacer un élément qui va être remplacé ne déplace
       rien. */
    setAvance(n * pasVoix);
  };

  /** Le fond plein écran de l'étape courante. */
  const fond =
    ici === "voix"
      ? (suite[vu]?.src ?? PHOTO_VOIX)
      : ici === "venir"
        ? PHOTO_VENIR
        : PHOTO_PLAT;

  /** La fiche du restaurant, la même aux quatre étapes du bas. */
  const fiche = (avecPrix: boolean) => (
    <div className="pt-fiche">
      <span className="pt-fiche-v" style={{ backgroundImage: `url("${vignette}")` }} />
      <span className="pt-fiche-t">
        <b>{nom}</b>
        <em>
          <i aria-hidden="true">📍</i>
          {ou}
        </em>
      </span>
      {avecPrix && plat.prix && <b className="pt-fiche-p">{plat.prix}</b>}
    </div>
  );

  /** Le second bouton : « Réserver », qui saute à la dernière étape. */
  const versLaTable = (mot: string) =>
    etape < total ? (
      <button type="button" className="pt-deux" onClick={() => setEtape(total)}>
        {mot}
        <s aria-hidden="true">→</s>
      </button>
    ) : null;

  return (
    <div className={`pt pt-e${PAS.indexOf(ici) + 1} pt-p-${ici}${ici === "voix" && suite.length ? " pt-suite-la" : ""}`}>
      {/* ═══ LES QUATRE PHOTOS SONT EMPILEES, PAS ECHANGEES ══════════════

          UNE SEULE BOITE DONT ON CHANGE `backgroundImage` FAIT UN BLANC. Le
          navigateur ne commence a telecharger l'image qu'au moment ou on la lui
          demande : la deuxieme photo serait arrivee une demi-seconde apres la
          phrase qu'elle illustre, sur un fond vide. Empilees, elles sont toutes
          chargees des l'ouverture de l'etape, et il ne reste qu'une opacite a
          faire glisser — ce qui donne aussi le fondu, qu'un echange n'aurait
          jamais donne. */}
      {ici === "voix" && suite.length > 0 ? (
        <div className="pt-suite" aria-hidden="true">
          {suite.map((ph, k) => (
            <span
              key={ph.src}
              className={k === vu ? "on" : undefined}
              style={{ backgroundImage: `url("${ph.src}")` }}
            />
          ))}
        </div>
      ) : (
        <div className="pt-fond" style={{ backgroundImage: `url("${fond}")` }} aria-hidden="true" />
      )}
      <div className="pt-voile" aria-hidden="true" />

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="pt-haut" aria-label={`Étape ${etape} sur ${total}`}>
        {etape > 1 && (
          <button type="button" className="pt-retour" onClick={precedent} aria-label="L’étape précédente">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.4 5.4 7.8 12l6.6 6.6" />
            </svg>
          </button>
        )}
        {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
            il a un curseur a sa place, et c'est tout le nom — on clique,
            et c'est moi. Ecrit au clavier, le mot perdait la seule chose
            qui en fait une marque. Le curseur est un trace, donc il suit
            la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
        <p className="pt-logo">
          <MotMarque />
        </p>
        {/* ═══ PLUS DE BARRE DE PROGRESSION ══════════════════════════════

            « Supprimer les barres de progression partout où il y en a. »

            ELLE NE SERVAIT QU'À COMPTER, ET PERSONNE NE COMPTE. Quatre traits
            et « 3/4 » disent combien d'écrans restent — une information de
            formulaire administratif, posée en haut de la seule ligne où l'on a
            le logo et la porte de sortie. Sur un parcours de quatre écrans
            qu'on traverse en glissant, l'effort n'est pas assez grand pour
            qu'on ait besoin de le mesurer.

            LE COMPTE RESTE POUR LES LECTEURS D'ÉCRAN, sur l'en-tête : eux ne
            voient pas qu'il ne reste qu'un écran, et le leur retirer serait
            leur enlever quelque chose que personne d'autre ne perd. */}
        {/* LE FANTÔME EST LA PORTE DE L'ACCUEIL — même geste que sur les
            autres parcours : il est déjà à cette place sur les quatre écrans,
            lui donner la fonction évite une icône de plus. La petite maison
            sur son épaule est ce qui le fait comprendre. */}
        <FantomeAccueil onClick={onFermer} classe="pt-f" />
      </header>

      {/* ═══ LA PASTILLE DU RESTAURANT A QUITTÉ LA PHOTO ═══════════════════

          ELLE DISAIT DEUX FOIS LA MÊME CHOSE. « Le Bocal de Margot · 180 m ·
          Dax » en haut, posé sur le plat, et la même ligne dans la fiche du
          bloc du bas, vingt centimètres plus bas sur le même écran. Celle du
          haut couvrait la seule chose qu'on est venu regarder.

          C'est la même correction que sur le parcours coiffure, pour la même
          raison. La porte de sortie qu'elle portait est passée dans le
          Fantôme. */}

      {/* ───────────────────────── 1/4 · LE PLAT ─────────────────────────── */}
      {ici === "chose" && (
        <section className="pt-bas">
          {/* ═══ LA BULLE N'ÉTAIT PAS AU BON ENDROIT ═══════════════════════

              « "Ça vous tente ?" n'est pas au bon endroit. »

              ELLE ÉTAIT POSÉE EN ABSOLU À 92 POINTS DU HAUT — mais d'un bloc
              qui commence au bas de l'écran, pas de l'écran. Elle atterrissait
              donc au milieu du texte, coincée entre le sous-titre et la fiche,
              et le Fantôme mordait dessus.

              DANS LE FLUX, EN TÊTE DU BLOC : elle ouvre l'écran, comme sur sa
              maquette, et rien ne peut plus la pousser ailleurs. */}
          <div className="pt-dit">
            <Fant classe="pt-dit-f" />
            <p>Ça vous tente ?</p>
          </div>
          <h1 className="pt-t">{plat.nom}</h1>
          {/* LE DÉTAIL EST CELUI DE SA CARTE, et l'autre plat du jour avec :
              « ou curry de légumes, au même prix » dit qu'on a le choix, ce
              qu'une liste d'ingrédients inventée ne dirait pas. */}
          <p className="pt-sous">
            {plat.detail}
            {autrePlat && <> · ou {autrePlat.nom.toLowerCase()}, au même prix</>}
          </p>
          {plat.prix && <p className="pt-prix">{plat.prix}</p>}
          {fiche(false)}
          {/* ═══ « RÉSERVER » QUITTE LES DEUX PREMIERS ÉCRANS ═════════════

              Il l'a demandé sur le second ; c'est le même bouton, la même
              taille et la même faute sur le premier. On demandait de réserver
              une table à quelqu'un qui vient de voir une photo et n'a encore
              rien appris du plat — c'est-à-dire avant d'avoir la seule raison
              de réserver.

              IL RESTE À L'ÉTAPE 3, où l'on vient d'entendre la cuisinière, et
              il est tout l'écran 4. */}
          <button type="button" className="pt-go" onClick={suivant}>
            <Oeil />
            Voir de plus près
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ──────────────── 2/4 · CE QU'ON MANGERA VRAIMENT ──────────────────

          `pt-haute` collait le bloc tout en haut pour loger les deux grandes
          vignettes. Le rideau a un rapport fixe et tient dans la moitié de
          l'écran : le bloc reprend sa place normale, et le vide qui restait
          sous le bouton disparaît. */}
      {ici === "paire" && (
        <section className="pt-bas">
          <h1 className="pt-t">
            Voilà ce que
            <br />
            <em>vous mangerez.</em>
            <s aria-hidden="true" />
          </h1>

          {/* ═══ UN RIDEAU, PLUS DEUX PHOTOS CÔTE À CÔTE ═══════════════════

              « Normalement ça devrait être le plat en entier et une part comme
              sur l'app démo, mais là on a le même plat avec deux prix
              différents. »

              LES DEUX VIGNETTES DISAIENT VRAI ET SE LISAIENT FAUX. Le plat à
              onze euros et la part à neuf, posés côte à côte dans le même
              cadre, à la même taille : l'œil compare deux prix avant de
              comprendre que ce sont deux formats. On répondait « combien ? » à
              quelqu'un qui demande « à quoi ça ressemble ? ».

              LE RIDEAU EST LE GESTE DE L'APPLICATION, et c'est le seul écran
              qu'un concurrent ne peut pas copier : il tient à une donnée — deux
              photos du même plat — pas à un effet. On tire, le plat entier
              devient la part, et il n'y a qu'un prix à l'écran à la fois, celui
              de ce qu'on regarde.

              LA GLISSIÈRE INVISIBLE EST LÀ POUR LE CLAVIER. Un rideau qui ne
              répond qu'au doigt est un écran mort pour qui n'en a pas — et la
              démonstration se montre souvent sur un ordinateur. */}
          <div
            className="pt-rideau"
            ref={cadre}
            style={{ "--pt-x": rideau } as React.CSSProperties}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              tirer(e.clientX);
            }}
            onPointerMove={(e) => e.buttons > 0 && tirer(e.clientX)}
          >
            <div className="pt-rid-img" style={{ backgroundImage: `url("${PHOTO_PART}")` }} />
            <div className="pt-rid-img entier" style={{ backgroundImage: `url("${PHOTO_PLAT}")` }} />
            {/* ═══ UNE SEULE ÉTIQUETTE, DONC UN SEUL PRIX ════════════════

                PREMIER JET : une étiquette de chaque côté, comme les libellés
                « Avant / Servi » de l'Avant-goût. Sauf que celles-ci portent
                des PRIX — onze euros et neuf euros, visibles ensemble, ce qui
                ramenait exactement le défaut qu'il avait relevé sur les deux
                vignettes. Le rideau ne servait plus à rien : on comparait deux
                prix par-dessus lui.

                ELLE SUIT CE QU'ON REGARDE. Au-delà de la moitié c'est le plat
                entier, en deçà c'est la part, et il n'y a jamais qu'un nom et
                qu'un prix à l'écran. */}
            {(() => {
              const vu = rideau >= 50 ? plat : (part ?? plat);
              return (
                <span className="pt-rid-et" key={vu.id}>
                  <b>{vu.nom}</b>
                  {vu.detail && <u>{vu.detail}</u>}
                  {vu.prix && <em>{vu.prix}</em>}
                </span>
              );
            })()}
            <span className="pt-rid-trait" style={{ left: `${rideau}%` }} aria-hidden="true">
              <s>↔</s>
            </span>
            <input
              className="pt-rid-clavier"
              type="range"
              min={0}
              max={100}
              value={rideau}
              onChange={(e) => setRideau(Number(e.target.value))}
              aria-label="Tirer le rideau entre le plat entier et la part"
            />
          </div>

          {fiche(false)}
          <button type="button" className="pt-go" onClick={suivant}>
            <Guillemets />
            {voix?.prenom ? `${voix.prenom} vous raconte` : "Qui le cuisine"}
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ═══ L'ÉCRAN DU RÉCIT — REFAIT, PARCE QU'IL ÉTAIT LAID ════════════

          « C'est très laid, ce design avec tout ce texte. Il faut supprimer le
          texte et revoir tout l'UX de cet écran pour qu'il soit plus
          chaleureux. »

          IL AVAIT RAISON, ET C'ÉTAIT MA FAUTE DE LA VEILLE. J'avais posé son
          récit de six phrases dans la boîte prévue pour une phrase : deux cent
          trente-six points de gras italique, encadrés de magenta, au milieu de
          l'écran. Un mur. On ne lit pas un mur, on le contourne — et il cachait
          la seule chose qui compte ici, qui est la voix.

          CE QUI PREND SA PLACE : LA PERSONNE, PUIS LE GESTE. Un grand bouton
          rond qu'on a envie de toucher, son prénom, son métier, et une seule
          ligne — la phrase de comptoir, celle qui tient debout toute seule. Le
          récit complet ne disparaît pas, il se replie : « Lire ce qu'elle
          raconte » l'ouvre.

          POURQUOI LE GARDER, ALORS QU'IL A DIT DE SUPPRIMER LE TEXTE. Parce
          qu'une personne sourde n'entendra jamais la voix, et parce que quatre
          personnes sur cinq font défiler en silence dans le bus. Supprimer le
          texte de l'écran était juste ; le supprimer du produit aurait rendu
          cette étape muette pour elles. Replié, il ne coûte plus une ligne. */}
      {/* ═══ L'ECRAN QUI EVOLUE PENDANT LA VOIX ════════════════════════

          « On va tester autre chose pour l'étape 3, qui est hyper importante.
          Les 4 photos devraient se succéder pendant que la voix parle. Même
          principe : un seul écran qui évolue pendant la voix. »

          CE QU'IL REMPLACE : UNE PHOTO FIXE PENDANT UNE DEMI-MINUTE DE RECIT.
          On entendait « je le pose côté peau sur le gril » devant une assiette
          déjà servie, puis « je tranche » devant la même assiette. Le récit et
          l'image ne parlaient pas du même moment, et c'est l'image qui gagnait.

          ET ON N'A AJOUTE AUCUN GESTE. Pas de flèches, pas de points à toucher,
          rien qui se glisse : on appuie une fois sur le rond, et l'écran fait le
          reste. Un diaporama qu'on fait défiler soi-même aurait remis l'habitant
          au travail pendant qu'on lui raconte quelque chose.

          PAS DE PASTILLES « 1 2 3 4 » NON PLUS, et c'est la même règle que les
          barres de progression qu'il a fait retirer partout : la photo qui
          change EST l'avancement. Ce qui reste, c'est la barre du lecteur — elle
          ne compte pas des écrans, elle dit combien de temps il parle encore,
          et c'est ce que sa maquette dessine. */}
      {ici === "voix" && (
        <section className={`pt-bas pt-voixbas${suite.length ? " pt-suitebas" : ""}`}>
          {/* ═══ SA LEGENDE, EN DEUX TONS — elle change avec la photo ══════
              C'est le seul texte de l'écran, et il est court exprès : on est en
              train d'écouter quelqu'un. Le mot en gras est celui sur lequel on
              l'entend appuyer. */}
          {suite.length > 0 && (
            <>
              <p className="pt-chapeau">
                Dans la cuisine {contracter(voix?.prenom ?? "la maison", "de")}
              </p>
              <p className="pt-legende" aria-live="polite" key={suite[vu]?.src}>
                {decouper(suite[vu]?.mot ?? "", suite[vu]?.fort)}
              </p>
            </>
          )}
          {/* LE HALO DERRIÈRE LE BOUTON RESPIRE QUAND ÇA PARLE. C'est le seul
              mouvement de l'écran, et il dit « ça sort de là ».
              LES DEUX FLECHES L'ENCADRENT, et elles ne sont là que si la suite
              existe. Elles sont discrètes exprès : le geste principal reste
              d'appuyer au milieu et d'écouter ; elles servent à celui qui ne
              peut pas, et qui sinon ne verrait qu'une seule photo. */}
          <div className={`pt-parle${joue ? " on" : ""}${suite.length ? " pt-parle-fl" : ""}`}>
            {suite.length > 0 && (
              <button
                type="button"
                className="pt-fl pt-fl-g"
                onClick={() => allerA(vu - 1)}
                disabled={vu === 0}
                aria-label="La photo précédente"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.4 5.4 7.8 12l6.6 6.6" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className={`pt-rond${joue ? " on" : ""}`}
              aria-label={joue ? "Arrêter" : `Écouter ${voix?.prenom ?? "sa voix"}`}
              onClick={ecouterMargot}
            >
              {/* DANS LE ROND : LE PLAT, PAS SON VISAGE. Son visage remplit deja
                  tout l'ecran derriere — le repeter en petit par-dessus
                  lui-meme ne montrait rien de plus et faisait un doublon.
                  L'ecran dit « Margot vous raconte SON PLAT » : le plat a sa
                  place ici, et le bouton de lecture se pose dessus. */}
              {/* DANS LE ROND : LE PLAT D'HABITUDE, LUI QUAND LA SUITE EXISTE.
                  Les quatre photos montrent deja l'assiette au troisieme temps :
                  la remettre en petit dans le rond en aurait fait un doublon.
                  Ce que le rond dit alors, c'est QUI parle — et la bande du
                  haut dit ce qu'il fait pendant ce temps. */}
              <span
                className="pt-rond-p"
                style={{ backgroundImage: `url("${suite[0]?.src ?? PHOTO_PLAT}")` }}
                aria-hidden="true"
              />
              <span className="pt-rond-s" aria-hidden="true">{joue ? "❙❙" : "▶"}</span>
            </button>
            {suite.length > 0 && (
              <button
                type="button"
                className="pt-fl pt-fl-d"
                onClick={() => allerA(vu + 1)}
                disabled={vu === suite.length - 1}
                aria-label="La photo suivante"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9.6 5.4 16.2 12l-6.6 6.6" />
                </svg>
              </button>
            )}
            <span className={`pt-onde${joue ? " on" : ""}`} aria-hidden="true">
              {ONDE.map((h, k) => (
                <i key={k} style={{ "--h": `${h}%`, "--d": `${(k % 7) * 0.08}s` } as React.CSSProperties} />
              ))}
            </span>
          </div>

          {/* ═══ LA BARRE DU LECTEUR, ET CE N'EST PAS UNE BARRE D'ETAPES ══
              Elle est dans sa maquette, et elle survit à « supprimer les barres
              de progression partout » parce qu'elle ne compte pas des écrans :
              elle dit combien de temps il parle encore. Sans elle, on ne sait
              pas si l'on s'engage pour dix secondes ou pour une minute — c'est
              la première chose qu'on veut savoir avant d'appuyer. */}
          {suite.length > 0 && (
            <div className="pt-lecteur">
              <span className="pt-piste" aria-hidden="true">
                <i style={{ width: `${Math.min(100, (avance / dureeVoix) * 100)}%` }} />
              </span>
              <span className="pt-chrono">
                {minutes(avance)} / {minutes(dureeVoix)}
              </span>
            </div>
          )}

          {suite.length === 0 && (
            <h1 className="pt-t pt-t-voix">
              {voix?.prenom ?? "Elle"} <em>vous raconte.</em>
            </h1>
          )}
          {/* SON PRENOM EST DEJA DANS LE CHAPEAU quand la suite existe — « DANS
              LA CUISINE DE JEAN-MARIE » — donc la ligne ne le redit pas. Mesure
              a l'ecran : « JEAN-MARIE · CUISINIER · CHEZ BERGINE » sous un
              chapeau qui le nommait deja faisait lire son nom deux fois en
              trois centimetres. */}
          {voix?.role && (
            <p className="pt-qui">
              {voix.role} · {nom}
            </p>
          )}
          {/* UNE SEULE LIGNE, CELLE QUI TIENT DEBOUT TOUTE SEULE. « Je fais mes
              pâtes le matin même » répond à « pourquoi chez elle » sans qu'on
              ait besoin de la recette. LA LEGENDE DES QUATRE PHOTOS LA REMPLACE
              quand elle existe : deux phrases courtes l'une sur l'autre se
              gênent, et celle qui suit l'image est la plus vivante des deux. */}
          {voix?.signature && suite.length === 0 && <p className="pt-phrase">« {voix.signature} »</p>}

          {voix?.recit && (
            <details className="pt-lire">
              <summary>Lire ce qu’{voix.prenom === "Margot" ? "elle" : "il"} raconte</summary>
              <p>{voix.recit}</p>
            </details>
          )}
          {!voix?.extrait && !cloud && (voix?.recit || voix?.signature) && (
            <p className="pt-synth">Démonstration · voix de synthèse</p>
          )}

          {fiche(true)}
          <button type="button" className="pt-go" onClick={suivant}>
            <Calendrier />
            À midi, j’y vais
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ──────────────────────── 4/4 · LA TABLE ─────────────────────────── */}
      {/* ═══ LE DERNIER ECRAN, REFAIT — « On se retrouve chez nous ? » ════

          « Le dernier écran est trop faible. Quelque chose de plus fort, comme
          la photo 2. »

          CE QUI ETAIT FAIBLE, ET CE N'ETAIT PAS LA MISE EN PAGE. L'écran disait
          « À midi, vous savez où aller » devant une salle vide, puis alignait
          trois pastilles grises d'informations pratiques. On venait d'entendre
          un homme raconter son magret pendant une demi-minute, et l'écran
          suivant ressemblait à une fiche d'annuaire. Toute la chaleur tombait
          d'un coup, juste avant le seul geste qui compte.

          SA MAQUETTE REGLE CA EN CHANGEANT DE SUJET : la personne, pas le lieu.
          Le restaurateur sur le pas de sa porte, la main tendue, sa salle
          pleine derrière lui — et la question posée par-dessus. C'est la même
          personne qu'à l'étape d'avant, et c'est ce qui fait tenir les deux
          écrans ensemble : il vous a raconté son plat, maintenant il vous
          ouvre la porte.

          LE RESTE DESCEND DANS L'ORDRE OU L'ON DECIDE : chez qui, où, quoi et
          combien, quand c'est ouvert, ce qu'ils font — puis le geste. Rien de
          neuf n'est inventé : tout est lu sur sa fiche. */}
      {/* LA QUESTION EST POSEE HAUT, DANS LA PHOTO — et c'est sa maquette.
          Laissée dans le flux, elle arrivait à mi-hauteur et couvrait les
          tables : on lisait l'invitation par-dessus ce à quoi elle invite. En
          haut, elle laisse la salle entière visible sous elle. */}
      {ici === "venir" && !cote && (
        <div className="pt-invite">
          <h1 className="pt-t pt-t-venir">
            On se retrouve
            <br />
            <em>chez nous ?</em>
          </h1>
          {/* LA DISTANCE EN PASTILLE. Elle est la seule information qui change
              la réponse : « c'est là » ne se pense pas pareil à quatre cents
              mètres et à quatre kilomètres. */}
          <p className="pt-loin">
            <i aria-hidden="true">📍</i>
            À {resto.distance} de vous
          </p>
        </div>
      )}

      {ici === "venir" && !cote && (
        <section className="pt-bas pt-venirbas">
          {/* ═══ ALLÉGÉ : TROIS LIGNES, UN GESTE ════════════════════════════
              « Je trouve l'écran un peu compliqué visuellement, il y a
              beaucoup de choses. »
              ON COMPTAIT ONZE CHOSES À LIRE SOUS UNE QUESTION QUI N'EN DEMANDE
              QU'UNE. Les horaires et le mot de la maison partent : son double
              les donne dès qu'on les lui demande, et c'est lui le geste de cet
              écran. Restent chez qui, où, et ce qu'on vient manger. */}
          <div className="pt-carte-fin">
            <b className="pt-nomfin">{nom}</b>
            {resto.fiche?.ou && <em className="pt-oufin">{resto.fiche.ou}</em>}
            <span className="pt-platfin">
              <b>{plat.nom}</b>
              {plat.prix && <s>{plat.prix}</s>}
            </span>
          </div>

          {/* ═══ UN SEUL GESTE, ET IL MARCHE ════════════════════════════
              « Il faut supprimer "Contacter le restaurant", qui est un doublon
              de "Réserver une table", et supprimer "Numéro de démonstration". »
              LES DEUX BOUTONS FAISAIENT LA MEME CHOSE PAR DEUX PORTES — le
              message WhatsApp déjà écrit, et le même numéro composé.
              ET LE MOT EST LE SIEN : « DEMANDER » une table, pas « réserver ».
              On envoie un message, le restaurant répond ; tant qu'il n'a pas
              répondu, rien n'est réservé. C'est la même règle que les
              rendez-vous du salon — on n'annonce pas un créneau que personne ne
              peut tenir. */}
          {/* ═══ LE GESTE PRINCIPAL : LUI PARLER ══════════════════════════
              « Que penses-tu de remplacer la dernière étape par le nouveau
              système du fantôme vocal ? »
              ON GARDE L'ECRAN, ON CHANGE SON GESTE. On vient de l'entendre
              raconter son plat : c'est le moment où l'envie est la plus forte,
              et c'est lui qui répond. Le parcours finit sur ce que ClikMe a de
              neuf, pas sur un formulaire. Le double sait aussi garder une
              table : « on sera quatre samedi soir » préremplit la demande.
              « DEMANDER UNE TABLE » RESTE, EN SECOND : certains veulent
              réserver sans parler à personne, et c'est leur droit. */}
          <button
            type="button"
            className="pt-go pt-parler"
            onClick={() => {
              stopSpeaking();
              try {
                sonRef.current?.pause();
              } catch {
                /* rien en cours */
              }
              setDouble(true);
            }}
          >
            <span className="pt-parler-v" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/direct/double/accueil.webp" alt="" />
            </span>
            {voix?.prenom ? `Parler ${contracter(voix.prenom, "à")}` : "Parler au chef"}
            <Micro />
          </button>
          {/* LES DEUX AUTRES GESTES DESCENDENT D'UN CRAN, EN LIENS : trois
              boutons de même poids empilés, c'est trois questions posées à la
              fois. Un seul bouton plein — lui parler — et le reste à côté. */}
          <div className="pt-liens">
            <a className="pt-lien" href={joindre.whatsapp} target="_blank" rel="noreferrer noopener">
              <Bulle />
              Demander une table
            </a>
            {/* ═══ ET ON PASSE DE SON COTE ═════════════════════════════════
                « Rajouter "voir les stats de ce plat" […] et pour toutes les
                autres catégories faire la même chose, pour avoir la même
                logique et le même impact en fin de parcours. » */}
            <BoutonCote commerce={cle} branche="restaurant" onClick={() => setCote(true)} />
          </div>
        </section>
      )}

      {/* LE PANNEAU PREND TOUTE LA PLACE, il ne s'ajoute pas dessous. On est
          passé côté cuisine : y laisser le bouton de réservation de l'habitant
          aurait mélangé les deux points de vue sur le même écran — la correction
          qu'il avait déjà demandée pour le salon. */}
      {ici === "venir" && cote && (
        <section className="pt-bas">
          <CoteCommercant
            commerce={cle}
            branche="restaurant"
            quoi={plat.nom}
            nom={nom}
            visuel={PHOTO_PLAT}
            onRetour={() => setCote(false)}
            motRetour="Revenir côté habitant"
          />
        </section>
      )}

      {/* LE DOUBLE S'OUVRE PAR-DESSUS LE PARCOURS, et on y revient en le
          fermant : pas de « Découvrir ce plat » là-dedans, on vient d'en
          sortir. */}
      {double && <DoubleChef carte={resto} onFermer={() => setDouble(false)} />}
    </div>
  );
}

/** L'œil de « Voir de plus près ». */
function Oeil() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

/** Le calendrier des deux boutons de réservation. */
function Calendrier() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3" />
      <path d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
    </svg>
  );
}

/** Le micro de « Parler à … » : on lui parle, il répond à voix haute. */
function Micro() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3.4" width="6" height="11" rx="3" />
      <path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8v3" />
    </svg>
  );
}

/** Les guillemets du bouton qui mène à sa phrase. */
function Guillemets() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.4 6.6C6.6 7.8 5 10.2 5 13.2v4.2h5.2v-5.2H7.8c0-2 .6-3.4 2.4-4.2Z" />
      <path d="M19.4 6.6c-2.8 1.2-4.4 3.6-4.4 6.6v4.2h5.2v-5.2h-2.4c0-2 .6-3.4 2.4-4.2Z" />
    </svg>
  );
}

/**
 * LA BULLE DE « DEMANDER UNE TABLE ».
 *
 * UN MESSAGE, PAS UN CALENDRIER. Le calendrier disait « réserver », c'est-à-dire
 * une case prise dans un planning ; le geste réel est d'écrire au restaurant et
 * d'attendre sa réponse. Le dessin dit maintenant ce qui se passe vraiment.
 */
function Bulle() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.4 12.2c0 4-3.8 7.2-8.4 7.2a9.7 9.7 0 0 1-2.6-.35L4.2 20.4l1.5-3.5A6.8 6.8 0 0 1 3.6 12.2C3.6 8.2 7.4 5 12 5s8.4 3.2 8.4 7.2Z" />
    </svg>
  );
}

/* LE COMBINE A DISPARU AVEC SON BOUTON. « Contacter le restaurant » etait un
   doublon de « Reserver une table » : les deux ouvraient la meme demande. Le
   dessin partait avec le bouton — un pictogramme garde sans usage finit par
   revenir sur un ecran ou il ne veut plus rien dire. */
