"use client";

// L'ESPACE COMMERÇANT — et il n'a qu'un écran.
//
// ─── CE QU'IL REMPLACE, ET POURQUOI CE N'EST PAS UN TABLEAU DE BORD ───────
//
// Tout ce qu'on propose aux commerçants depuis quinze ans suppose qu'ils
// PRODUISENT : des photos, des publications, une ligne éditoriale, un calendrier.
// Ils n'ont ni le temps, ni l'envie, ni le métier pour ça. Alors ils ne font
// rien, et on en conclut qu'ils ne veulent pas.
//
// Ici il n'y a pas de bouton « créer une annonce », pas de catégorie à choisir,
// pas d'heure à régler, pas de titre à écrire. Il y a une conversation et un
// micro. Il raconte sa journée comme il la raconterait à quelqu'un, et
// l'assistante s'occupe du reste.
//
// LA RÈGLE QUI TRANCHE TOUT : si une fonction oblige à expliquer au commerçant
// comment elle marche, elle est trop compliquée. C'est le modèle qui absorbe la
// complexité, jamais lui.
//
// ─── LES TROIS CHOSES QUI PROTÈGENT ───────────────────────────────────────
//
// 1. LA CARTE DE VALIDATION. Rien ne part sans qu'il ait vu trois chiffres et
//    appuyé. « Quatorze euros » entendu « quatre euros » et publié à toute une
//    ville, c'est un client qui arrive avec quatre euros et un commerçant qui
//    n'y revient jamais. Aucune transcription n'est fiable à cent pour cent
//    dans une boulangerie à sept heures : cette carte est ce qui autorise le
//    vocal à exister.
//
// 2. LE CLAVIER À CÔTÉ DU MICRO, TOUJOURS VISIBLE. S'il rate deux fois, il doit
//    pouvoir taper sans chercher un bouton.
//
// 3. LE DROIT DE NE RIEN PUBLIER. Un jour où il ne se passe rien est un jour
//    normal. L'assistante sait dire « très bien, à demain » — et c'est ça qui
//    donne du poids aux jours où elle publie.
//
// ─── ET C'EST LE MÊME ÉCRAN EN DÉMONSTRATION ──────────────────────────────
//
// Pas de version scénarisée à part : même appel, même modèle, même écran. Seuls
// changent le commerce (une fiche fictive), le paquet visé et l'horloge. « C'est
// exactement ce que vous aurez demain » devient un fait vérifiable au lieu d'une
// promesse.
import { useCallback, useEffect, useRef, useState } from "react";
import type { CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";
import {
  abonnerJournee,
  carteDeLaJournee,
  chargerJournee,
  journeeVide,
  majMoment,
  ouvrirJournee,
  publierMoment,
  viderJournee,
  type CommerceAssiste,
} from "@/lib/direct/journee";
import { dicteeDisponible, ouvrirEcoute } from "@/lib/direct/voix-micro";
import { useSyncExternalStore } from "react";

/**
 * LES COMMERCES DE LA DÉMONSTRATION — inventés, et ils le restent.
 *
 * `public/direct/LISEZ-MOI.md` interdit de faire passer un vrai commerçant pour
 * un client de ClikMe sans qu'il ait rien signé. Ces six-là n'existent pas ;
 * leurs noms sont assez ordinaires pour qu'un prospect se reconnaisse, et assez
 * neutres pour ne désigner personne.
 */
/**
 * CE QU'ELLE SE RAPPELLE DE LEURS JOURNÉES PASSÉES.
 *
 * C'EST CE QUI SÉPARE UN OUTIL QUI ENREGISTRE DE QUELQU'UN QUI SUIT SON
 * COMMERCE. « Mardi dernier il vous en restait six à 14 h ; je prépare une
 * offre de dernière minute au cas où ça recommence ? » — aucune plateforme ne
 * dit ça, parce qu'aucune ne regarde ce qui s'est passé la semaine d'avant.
 * C'est le moment où le commerçant lève la tête.
 *
 * EN DÉMONSTRATION ILS SONT SEMÉS, DANS LE VRAI PRODUIT ILS SE CALCULENT. Le
 * chemin est le même — la mémoire arrive par la même porte, `souvenirs` dans
 * l'appel — et c'est tout l'intérêt : ce qu'on montre au prospect est
 * exactement le mécanisme qu'il aura, avec ses chiffres à lui au lieu des
 * nôtres.
 */
const COMMERCES: (CommerceAssiste & { titre: string; souvenirs: string[] })[] = [
  {
    id: "as-resto", titre: "Restaurant", prenom: "Margot", nom: "La Table de Margot",
    metier: "Restaurant", branche: "restaurant", adresse: "Rue des Carmes",
    horaires: "12 h – 14 h · 19 h – 22 h", distance: "220 m", metres: 220,
    souvenirs: [
      "Mardi dernier, il lui restait 6 portions de son plat du jour à 14 h.",
      "Ses annonces de dernière minute partent en moins de vingt minutes.",
    ],
  },
  {
    id: "as-coif", titre: "Coiffeur", prenom: "Yann", nom: "L’Atelier de Yann",
    metier: "Coiffeur", branche: "coiffeur", adresse: "Place de la Fontaine",
    horaires: "9 h – 19 h", distance: "340 m", metres: 340,
    souvenirs: [
      "Jeudi dernier, deux créneaux de l\u2019après-midi sont restés vides.",
      "Ses désistements publiés avant 11 h se remplissent presque toujours.",
    ],
  },
  {
    id: "as-ongle", titre: "Onglerie", prenom: "Sophie", nom: "Institut Sophie",
    metier: "Prothésiste ongulaire", branche: "ongles", adresse: "Rue Neuve",
    horaires: "9 h 30 – 18 h 30", distance: "410 m", metres: 410,
    souvenirs: [
      "La semaine dernière, son créneau de 15 h est parti en dix minutes.",
    ],
  },
  {
    id: "as-mode", titre: "Boutique", prenom: "Claire", nom: "Le Dressing",
    metier: "Prêt-à-porter", branche: "mode", adresse: "Cours Verdun",
    horaires: "10 h – 19 h", distance: "180 m", metres: 180,
    souvenirs: [
      "Ses arrivages annoncés le matin sont vus deux fois plus que ceux du soir.",
    ],
  },
  {
    id: "as-fleur", titre: "Fleuriste", prenom: "Élise", nom: "Au Jardin d’Élise",
    metier: "Fleuriste", branche: "fleuriste", adresse: "Halles du marché",
    horaires: "8 h – 19 h", distance: "500 m", metres: 500,
    souvenirs: [
      "Vendredi dernier, il lui restait 4 bouquets à 18 h.",
    ],
  },
  {
    id: "as-bar", titre: "Bar", prenom: "Thomas", nom: "Le Comptoir",
    metier: "Bar à vins", branche: "bar", adresse: "Rue Saint-Vincent",
    horaires: "17 h – 1 h", distance: "290 m", metres: 290,
    souvenirs: [
      "Ses annonces de concert remplissent la terrasse le jeudi.",
    ],
  },
];

/**
 * LES QUATRE MOMENTS D'UNE JOURNÉE, POUR LA MONTRER EN QUATRE-VINGT-DIX SECONDES.
 *
 * Sans ça, la démonstration s'arrête au premier tour : on ne peut pas rester
 * trois heures dans une boutique pour prouver que l'assistante revient. Le saut
 * dans le temps n'invente rien — il déplace l'horloge, et la conversation
 * reprend là où elle en était.
 */
const SAUTS: { h: number; l: string }[] = [
  { h: 10, l: "10 h" },
  { h: 12.5, l: "12 h 30" },
  { h: 13.75, l: "13 h 45" },
];

/**
 * LA FIN DE SERVICE — et c'est la boucle qui fait revenir demain.
 *
 * POURQUOI ELLE COMPTE PLUS QUE TOUT LE RESTE. Un commerçant qui raconte sa
 * journée le fait une fois par curiosité. Ce qui le fait recommencer, c'est de
 * savoir que ça a servi à quelque chose — et personne ne le lui dit jamais. Ni
 * sa fiche Google, ni son site, ni ses réseaux ne reviennent le soir avec un
 * chiffre. C'est le seul retour qu'il ait de sa journée.
 *
 * LES CHIFFRES SONT ÉCRITS PAR L'ÉCRAN, PAS PAR LE MODÈLE. Ce sont des FAITS.
 * Un fait ne se fait pas rédiger : si le modèle les annonçait, il pourrait les
 * annoncer sans qu'ils soient vrais, et un chiffre gonflé une seule fois fait
 * perdre le commerçant pour toujours. Dans le vrai produit ils viennent du
 * compteur ; ici ils sont posés, et ils montrent ce qui l'attend.
 */
const BILAN = {
  vues: 142,
  reservations: 4,
  abonnes: 8,
  quoi: "dernières portions",
  heure: 14.5,
};

type Tour = { role: "user" | "assistant"; content: string };
type Carte = {
  nature: "nouvelle" | "maj";
  titre: string;
  detail: string;
  prix: string;
  quantite: number | null;
  de: number;
  a: number;
  icone: string;
  epuise: boolean;
  /** Vrai si Léa vient de demander une image — voir le prompt. */
  photo: boolean;
};

/**
 * LA PHOTO, RÉDUITE AVANT D'ÊTRE GARDÉE.
 *
 * Une photo d'iPhone pèse trois à cinq mégaoctets et le stockage local en tient
 * cinq en tout : deux annonces et la journée est perdue. Mille pixels de large
 * suffisent très largement à une carte qu'on regarde sur un téléphone, et le
 * réencodage tient en six lignes parce qu'on ne fait que dessiner l'image dans
 * une toile plus petite.
 */
async function reduire(fichier: File): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const large = Math.min(1000, img.naturalWidth || 1000);
    const c = document.createElement("canvas");
    c.width = large;
    c.height = Math.round((img.naturalHeight / (img.naturalWidth || 1)) * large);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * DÉBLOQUER LE SON — et il faut le faire DANS le geste, pas après.
 *
 * LE DÉFAUT MESURÉ SUR IPHONE : « aucune voix ». Safari n'autorise la lecture
 * d'un son que si elle part d'un geste de l'utilisateur. Léa, elle, parle APRÈS
 * un aller-retour réseau — on demande la synthèse, on attend, et quand le son
 * arrive la permission accordée par l'appui a expiré. La lecture est refusée en
 * silence : pas d'erreur, pas de voix, rien à comprendre.
 *
 * LA PARADE EST CONNUE ET TIENT EN DEUX LIGNES : on fait jouer UN SON VIDE au
 * moment exact de l'appui, ce qui « bénit » l'élément audio pour le reste de la
 * session. Ensuite on ne fait plus que changer sa source, et Safari laisse
 * passer. Le même élément sert donc à toutes les phrases de Léa — en créer un
 * nouveau à chaque fois annulerait la permission.
 */
const MUET =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
let hautParleur: HTMLAudioElement | null = null;

function debloquerSon(): HTMLAudioElement {
  if (!hautParleur) hautParleur = new Audio();
  const a = hautParleur;
  try {
    a.src = MUET;
    // On ne se soucie pas du résultat : si c'est refusé, on n'aura pas de voix,
    // et l'écran le dira. Ce qui compte est que la tentative parte du geste.
    void a.play().then(() => a.pause()).catch(() => {});
  } catch {
    /* Un navigateur sans audio : la conversation continue à l'écrit. */
  }
  return a;
}

const hhmm = (h: number) =>
  `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

export function Assistante() {
  const journee = useSyncExternalStore(abonnerJournee, chargerJournee, journeeVide);
  const [heure, setHeure] = useState(0);
  const [tours, setTours] = useState<Tour[]>([]);
  const [attend, setAttend] = useState(false);
  const [carte, setCarte] = useState<Carte | null>(null);
  const [retour, setRetour] = useState<{ heure: number; pourquoi: string } | null>(null);
  const [ecoute, setEcoute] = useState(false);
  const [vivant, setVivant] = useState("");
  const [tape, setTape] = useState("");
  const [dictee, setDictee] = useState(true);
  const [echo, setEcho] = useState("");
  const [photo, setPhoto] = useState("");
  // MAINS LIBRES : Léa parle, puis elle écoute, puis elle répond. Sans ça il
  // faut deux appuis par phrase — « je dois appuyer sur le bouton à chaque fois
  // pour parler et envoyer mon message » — c'est-à-dire exactement le geste
  // qu'on prétendait lui épargner, et impossible avec les mains dans la farine.
  const [libres, setLibres] = useState(true);
  const [parle, setParle] = useState(false);
  const [voixKo, setVoixKo] = useState("");
  const [bilan, setBilan] = useState(false);
  const bas = useRef<HTMLDivElement | null>(null);
  const micro = useRef<ReturnType<typeof ouvrirEcoute> | null>(null);
  const son = useRef<HTMLAudioElement | null>(null);
  /** Ce qu'elle vient de dire et qui n'a pas encore été prononcé. */
  const aDire = useRef("");

  useEffect(() => {
    setHeure(new Date().getHours() + new Date().getMinutes() / 60);
    setDictee(dicteeDisponible());
  }, []);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [tours, carte, attend]);

  /**
   * LÉA PARLE — et l'enchaînement se fait ici.
   *
   * POURQUOI LA VOIX N'EST PAS UN ORNEMENT. On demande à un commerçant de
   * PARLER à quelque chose. S'il parle et qu'on lui répond par écrit, ce n'est
   * pas une conversation : c'est un formulaire déguisé, et il retombe dans le
   * geste qu'on voulait lui éviter — regarder l'écran, chercher un bouton.
   *
   * LA PROMESSE EST TENUE MÊME QUAND LA VOIX ÉCHOUE. Pas de clé, panne, réseau
   * lent : on enchaîne quand même sur l'écoute. La voix est un confort, la
   * réponse est le produit — et une conversation qui s'arrêterait faute de son
   * serait bien pire que le silence.
   */
  const dire = useCallback(
    async (texte: string, puisEcouter: boolean) => {
      const suite = () => {
        setParle(false);
        if (puisEcouter && libres) demarrerMicroRef.current?.();
      };
      if (!texte.trim()) return suite();
      setParle(true);
      try {
        const rep = await fetch("/api/direct/parler", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ texte }),
        });
        if (!rep.ok) {
          // ON DIT POURQUOI ELLE SE TAIT. Un échec silencieux se diagnostique
          // mal : « aucune voix » peut vouloir dire une clé absente, un refus
          // du navigateur ou une panne, et sans le message il n'y a aucun moyen
          // de savoir lequel. Une fois suffit, et discrètement.
          let quoi = `voix indisponible (HTTP ${rep.status})`;
          try {
            const d = await rep.json();
            if (d?.erreur) quoi = String(d.erreur);
          } catch {
            /* réponse illisible : le code HTTP suffit */
          }
          setVoixKo(quoi);
          return suite();
        }
        const b = await rep.blob();
        const url = URL.createObjectURL(b);
        // LE MÊME ÉLÉMENT QUE CELUI QU'ON A BÉNI AU PREMIER APPUI — voir
        // `debloquerSon`. En créer un nouveau perdrait la permission d'iOS.
        const a = son.current ?? hautParleur ?? new Audio();
        son.current = a;
        a.src = url;
        // ON N'ATTEND PAS LA FIN POUR LIBÉRER L'ADRESSE : `onended` sert aussi
        // de fin de tour, et un `finally` la révoquerait avant la lecture.
        a.onended = () => {
          URL.revokeObjectURL(url);
          suite();
        };
        a.onerror = () => {
          URL.revokeObjectURL(url);
          setVoixKo("le téléphone a refusé de lire le son");
          suite();
        };
        // iOS EXIGE UN GESTE POUR LE PREMIER SON. Le choix du métier et l'appui
        // sur le micro en sont : à partir de là, la lecture passe. Si elle est
        // quand même refusée, on enchaîne au lieu de rester muet et bloqué.
        await a.play().catch((e) => {
          setVoixKo(`lecture refusée par le navigateur (${(e as Error)?.name || "refus"})`);
          suite();
        });
      } catch {
        suite();
      }
    },
    [libres],
  );

  /**
   * UN TOUR DE CONVERSATION.
   *
   * `dit` vide veut dire « ouvre la conversation » : la première phrase vient du
   * modèle comme les autres. L'écrire en dur ferait commencer la démonstration
   * par la seule ligne qui ne soit pas le vrai produit.
   */
  const parler = useCallback(
    async (dit: string, h: number) => {
      if (!journee) return;
      // ON FERME LE MICRO AVANT DE PARLER. Vu à l'écran : on tape sa phrase au
      // clavier alors que Léa écoutait encore, et la lampe rouge reste allumée
      // par-dessus la carte à valider. Un micro ouvert pendant qu'on attend un
      // appui écoute la boutique pour rien — et se referme sur une phrase que
      // personne n'a voulu dire.
      // `annuler` et non `arreter` : ce qui a été capté est abandonné, sinon on
      // rentrerait dans ce même tour par la porte de derrière.
      micro.current?.annuler();
      micro.current = null;
      setEcoute(false);
      setVivant("");
      const suite: Tour[] = dit ? [...tours, { role: "user", content: dit }] : tours;
      if (dit) setTours(suite);
      setCarte(null);
      setAttend(true);
      setEcho("");
      try {
        const rep = await fetch("/api/direct/assistante", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            commerce: journee.commerce,
            heure: h,
            publie: journee.moments.map((m) => m.titre),
            // SA MÉMOIRE — voir `COMMERCES`. Même porte en démonstration et
            // dans le vrai produit ; seule la source des souvenirs change.
            souvenirs:
              COMMERCES.find((x) => x.id === journee.commerce.id)?.souvenirs ?? [],
            messages: suite,
          }),
        });
        const d = await rep.json();
        if (!rep.ok) {
          setEcho(String(d?.erreur || "L’assistante n’a pas répondu."));
          return;
        }
        const dit = String(d.dire || "");
        setTours([...suite, { role: "assistant", content: dit }]);
        const k = (d.carte ?? null) as Carte | null;
        setCarte(k);
        if (d.retour) setRetour(d.retour);
        // ELLE NE REPART PAS EN ÉCOUTE QUAND ELLE ATTEND UN APPUI. Une carte à
        // valider ou une photo à prendre demandent la main, pas la voix : ouvrir
        // le micro par-dessus ferait parler dans le vide.
        aDire.current = dit;
        dire(dit, !k);
      } catch {
        setEcho("Pas de réseau — l’assistante n’a pas pu répondre.");
      } finally {
        setAttend(false);
      }
    },
    [journee, tours],
  );

  const finDeService = useCallback(() => {
    setHeure(BILAN.heure);
    setCarte(null);
    setBilan(true);
    // LA BULLE EST COURTE, LA VOIX EST ENTIERE — et ce n'est pas la même chose.
    // Vu à l'écran : Léa répétait mot pour mot ce que la carte affiche juste en
    // dessous, soit les mêmes chiffres deux fois à dix pixels d'intervalle. Ce
    // qui se LIT est dans la carte ; ce qui s'ENTEND doit être complet, parce
    // qu'en mains libres il n'y a rien à regarder.
    setTours((t) => [
      ...t,
      { role: "assistant", content: "Voilà pour aujourd’hui ❤️" },
    ]);
    dire(
      `Voilà pour aujourd'hui. ${BILAN.vues} personnes ont vu vos annonces, ` +
        `${BILAN.reservations} réservations, ${BILAN.abonnes} nouveaux abonnés. ` +
        `Votre annonce « ${BILAN.quoi} » a particulièrement bien fonctionné. ` +
        `On recommence demain ?`,
      false,
    );
  }, [dire]);

  const choisir = useCallback((c: CommerceAssiste) => {
    // LE PREMIER GESTE DE LA SESSION, ET DONC LE SEUL MOMENT OÙ IPHONE ACCORDE
    // LE SON. Voir `debloquerSon` : c'est ici, et pas dans la réponse de Léa
    // qui arrive une seconde trop tard.
    son.current = debloquerSon();
    ouvrirJournee(c);
    setTours([]);
    setCarte(null);
    setRetour(null);
  }, []);

  // L'OUVERTURE PART TOUTE SEULE dès qu'un commerce est choisi : elle dit
  // bonjour et pose sa première question, sans qu'on ait appuyé sur rien.
  useEffect(() => {
    if (journee && !tours.length && !attend && heure) parler("", heure);
    // On ne veut PAS relancer à chaque tour : seulement à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journee?.commerce.id, heure]);

  const arreterMicro = useCallback(async () => {
    const m = micro.current;
    micro.current = null;
    setEcoute(false);
    if (!m) return;
    const r = await m.arreter();
    setVivant("");
    if (r.texte) parler(r.texte, heure);
    else setEcho(r.erreur || "Je n’ai rien entendu.");
  }, [heure, parler]);

  const arreterRef = useRef<() => void>(() => {});
  arreterRef.current = () => {
    void arreterMicro();
  };

  const demarrerMicro = useCallback(() => {
    if (micro.current) return;
    // Deuxième occasion de bénir le haut-parleur, pour qui arrive par le micro
    // sans être passé par le choix du métier (une journée déjà ouverte).
    if (!son.current) son.current = debloquerSon();
    setEcho("");
    setVivant("");
    // LE SILENCE REMPLACE LE DEUXIÈME APPUI — voir `SILENCE_MS` dans le micro.
    micro.current = ouvrirEcoute(setVivant, {
      surSilence: () => arreterRef.current(),
    });
    setEcoute(true);
  }, []);

  const demarrerMicroRef = useRef<() => void>(() => {});
  demarrerMicroRef.current = demarrerMicro;

  useEffect(() => () => micro.current?.annuler(), []);

  /**
   * IL A VALIDÉ — et c'est ici, et nulle part ailleurs, que quelque chose part
   * en ligne. L'assistante n'a jamais publié : elle a proposé.
   */
  const valider = useCallback(() => {
    if (!carte || !journee) return;
    const m: Omit<MomentJour, "publie"> = {
      de: carte.de,
      a: carte.a,
      quand: `${hhmm(carte.de)} – ${hhmm(carte.a)}`,
      icone: carte.icone,
      titre: carte.titre,
      photo: photo || undefined,
      lignes: carte.detail ? [carte.detail] : undefined,
      prix: carte.prix || undefined,
      places: carte.quantite ?? undefined,
      action: "Réserver",
      envies: [],
    };
    if (carte.nature === "maj") {
      majMoment(
        carte.titre,
        {
          places: carte.epuise ? 0 : (carte.quantite ?? undefined),
          prix: carte.prix || undefined,
          photo: photo || undefined,
          lignes: carte.detail ? [carte.detail] : undefined,
        },
        heure,
      );
    } else {
      publierMoment(m, heure);
    }
    setCarte(null);
    // LA CONFIRMATION EST ÉCRITE PAR L'ÉCRAN, PAS PAR LE MODÈLE. C'est un fait —
    // « c'est en ligne » — et un fait ne se fait pas rédiger : si le modèle
    // l'annonçait, il pourrait l'annoncer sans que ce soit vrai.
    const mot = `C’est en ligne. ${carte.titre} — vos voisins le voient maintenant.`;
    setTours((t) => [...t, { role: "assistant", content: mot }]);
    setPhoto("");
    dire(mot, true);
  }, [carte, dire, heure, journee, photo]);

  if (!journee) {
    return (
      <div className="as">
        <div className="as-halo" aria-hidden="true">
          <span />
          <span />
        </div>
        <header className="as-h">
          <b>ClikMe</b>
          <a href="/autour-de-moi">Le direct</a>
        </header>
        <div className="as-choix">
          <h1>Léa, votre assistante</h1>
          <p>
            Vous ne remplissez rien. Vous lui racontez votre journée, elle s’occupe
            du reste.
          </p>
          <p className="as-n">Pour la démonstration, choisissez le métier du commerce.</p>
          <div className="as-metiers">
            {COMMERCES.map((c) => (
              <button key={c.id} type="button" onClick={() => choisir(c)}>
                <b>{c.titre}</b>
                <em>{c.nom}</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const c = journee.commerce;
  const enLigne = carteDeLaJournee(journee);

  return (
    <div className={`as${parle ? " ambiance" : ""}`}>
      {/* LE FOND N'EST PAS UNE IMAGE, C'EST UNE LUMIERE. Deux halos très flous
          qui dérivent lentement : ça coûte deux div et zéro octet de réseau, et
          ça transforme un aplat noir en pièce éclairée. Ils s'animent plus vite
          quand Léa parle — la pièce respire avec elle. */}
      <div className="as-halo" aria-hidden="true">
        <span />
        <span />
      </div>
      <header className="as-h">
        <b>ClikMe</b>
        <a href={`/autour-de-moi?h=${heure.toFixed(2)}`}>Le direct</a>
      </header>

      {/* ═══ LÉA, ET C'EST TOUT LE SUJET DE CET ÉCRAN ═══
          « Il faut vraiment qu'il y ait un énorme wahoo, pour le moment c'est
          très neutre. » C'était juste, et la raison était structurelle : on
          avait fait une messagerie. Une messagerie est un OUTIL, et un outil de
          plus ne bluffe personne — il y en a déjà six sur son téléphone.

          CE QUI CHANGE TOUT, C'EST QU'ELLE EXISTE. Un rond qui respire quand
          elle attend, qui pousse des ondes quand elle parle, qui frémit quand
          elle écoute. Ce n'est pas une décoration : c'est la différence entre
          « j'écris à un logiciel » et « quelqu'un m'écoute ». Le commerçant à
          qui on tend le téléphone ne lit pas une interface, il rencontre
          quelqu'un — et ça, aucune fiche Google ne le fait. */}
      <div className="as-qui">
        <div
          className={`as-lea${parle ? " parle" : ecoute ? " ecoute" : ""}`}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <b>L</b>
        </div>
        <div className="as-nom">
          <h1>Bonjour {c.prenom}</h1>
          <p>
            {parle
              ? "Léa vous parle"
              : ecoute
                ? "Léa vous écoute"
                : attend
                  ? "Léa réfléchit"
                  : `${c.nom} · ${c.metier}`}
          </p>
        </div>
      </div>

      <div className="as-fil">
        {tours.map((t, i) => (
          <p key={i} className={t.role === "user" ? "as-lui" : "as-elle"}>
            {t.content}
          </p>
        ))}
        {attend && (
          <p className="as-elle as-points" aria-label="Elle réfléchit">
            <i />
            <i />
            <i />
          </p>
        )}

        {/* ═══ LA CARTE DE VALIDATION ═══
            TROIS CHIFFRES, UN GROS BOUTON. Ce n'est pas un aperçu de l'annonce —
            un aperçu se survole et se valide sans lire. Ce sont les trois
            valeurs qui peuvent être fausses, sorties du texte et grossies,
            parce que c'est exactement là que le vocal se trompe. */}
        {carte && (
          <div className="as-carte">
            <h2>
              {carte.icone} {carte.titre}
              {carte.nature === "maj" && <em>mise à jour</em>}
            </h2>
            {carte.detail && <p className="as-d">{carte.detail}</p>}

            {/* ─── LA PHOTO, ET ELLE SE PREND ICI ───
                « On ne me demande pas de prendre la photo, donc quand on voit
                l'annonce il n'y a aucune image, ce qui fait très vide. » C'est
                pire que vide : une carte sans image ne se regarde pas dans un
                paquet qu'on balaie — le plat donne faim, pas son nom.

                ELLE EST SUR LA CARTE, PAS APRÈS. Ce qu'il valide doit être ce
                qui part en ligne, image comprise : une photo demandée après
                coup serait une deuxième démarche, donc une démarche qu'on ne
                fait pas. Et elle reste facultative — il publie sans, s'il veut. */}
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="as-vue" src={photo} alt="" onClick={() => setPhoto("")} />
            ) : (
              // LE BOUTON NE DÉPEND PLUS DE L'HUMEUR DU MODÈLE. Il était affiché
              // en clair quand Léa avait mis `photo` à vrai, et discret sinon —
              // sauf qu'elle ne l'a pas mis, et l'annonce est partie sans image :
              // « ni demande de photo ». Une garantie qui repose sur un modèle
              // n'en est pas une. Le bouton est donc toujours là, et bien
              // visible ; `photo` ne fait plus que le colorer et ajouter la
              // demande parlée.
              <label className={`as-photo${carte.photo ? " demande" : ""}`}>
                <span>
                  📷 {carte.photo ? "Photographiez-le" : "Ajouter une photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const x = e.target.files?.[0];
                    if (x) setPhoto(await reduire(x));
                  }}
                />
              </label>
            )}

            <ul className="as-cles">
              <li>
                <b>{carte.prix || "—"}</b>
                <em>prix</em>
              </li>
              <li>
                <b>{carte.epuise ? "épuisé" : (carte.quantite ?? "—")}</b>
                <em>quantité</em>
              </li>
              <li>
                <b>{hhmm(carte.de)}</b>
                <em>à partir de</em>
              </li>
            </ul>
            <div className="as-valide">
              <button type="button" className="as-oui" onClick={valider}>
                C’est bon
              </button>
              <button
                type="button"
                className="as-non"
                onClick={() => {
                  setCarte(null);
                  setEcho("Dites-lui ce qui est faux — « non, quinze euros ».");
                }}
              >
                Corriger
              </button>
            </div>
          </div>
        )}

        {/* ═══ LA FIN DE JOURNÉE ═══
            Le seul retour qu'un commerçant ait jamais de sa journée. Ni sa
            fiche Google, ni son site, ni ses réseaux ne reviennent le soir avec
            un chiffre. C'est ce qui le fait recommencer demain — et c'est pour
            ça que cette carte est la plus grande de l'écran. */}
        {bilan && (
          <div className="as-bilan">
            <span className="as-bilan-t">La fin de journée</span>
            <p className="as-bilan-h">Voilà pour aujourd’hui ❤️</p>
            <ul>
              <li>
                <b>{BILAN.vues}</b>
                <em>personnes ont vu vos annonces</em>
              </li>
              <li>
                <b>{BILAN.reservations}</b>
                <em>réservations</em>
              </li>
              <li>
                <b>{BILAN.abonnes}</b>
                <em>nouveaux abonnés</em>
              </li>
            </ul>
            <p className="as-bilan-m">
              Votre annonce «&nbsp;{BILAN.quoi}&nbsp;» a particulièrement bien
              fonctionné.
            </p>
            <p className="as-bilan-d">On recommence demain ?</p>
          </div>
        )}

        {retour && !carte && (
          <p className="as-retour">
            ⏰ Elle revient vers {hhmm(retour.heure)} — {retour.pourquoi}
          </p>
        )}
        {echo && <p className="as-echo">{echo}</p>}
        <div ref={bas} />
      </div>

      {/* ═══ LE MICRO, ET LE CLAVIER À CÔTÉ ═══
          Le micro est l'action principale : c'est la seule interface qui ne
          demande pas d'apprendre un geste. Mais le clavier ne se cache pas —
          s'il rate deux fois, il doit pouvoir taper sans chercher. */}
      <div className="as-bas">
        {ecoute && (
          <p className="as-vivant">{vivant || "Je vous écoute… (arrêtez de parler pour envoyer)"}</p>
        )}
        <div className="as-saisie">
          <button
            type="button"
            className={`as-micro${ecoute ? " on" : ""}`}
            disabled={attend}
            onClick={() => (ecoute ? arreterMicro() : demarrerMicro())}
            aria-label={ecoute ? "J’ai fini" : "Parler"}
          >
            {ecoute ? "■" : "🎙"}
          </button>
          <input
            value={tape}
            disabled={attend}
            placeholder={dictee ? "…ou écrivez" : "Écrivez-lui"}
            onChange={(e) => setTape(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !tape.trim()) return;
              parler(tape.trim(), heure);
              setTape("");
            }}
          />
          <button
            type="button"
            className="as-env"
            disabled={attend || !tape.trim()}
            onClick={() => {
              parler(tape.trim(), heure);
              setTape("");
            }}
          >
            ↑
          </button>
        </div>

        {/* MAINS LIBRES, ET ÇA SE COUPE. Dans une pièce très bruyante le silence
            n'arrive jamais et le micro resterait ouvert ; dans une conversation
            à côté, il partirait tout seul. Le réglage est petit parce qu'on n'y
            touche presque jamais, et visible parce que le jour où il faut le
            couper, il faut le trouver tout de suite. */}
        <div className="as-mains">
          <button
            type="button"
            className={libres ? "on" : ""}
            aria-pressed={libres}
            onClick={() => {
              const v = !libres;
              setLibres(v);
              if (!v) {
                micro.current?.annuler();
                micro.current = null;
                setEcoute(false);
                setVivant("");
              }
            }}
          >
            {libres ? "🔊 Mains libres" : "🔇 Mains libres coupées"}
          </button>
          {parle && <em>Léa parle…</em>}
          {voixKo && <u title={voixKo}>voix muette</u>}
        </div>
        {/* POURQUOI ELLE SE TAIT, EN CLAIR ET UNE SEULE FOIS. « Aucune voix »
            peut vouloir dire une cle absente, un refus du navigateur ou une
            panne : sans le dire, il n'y a aucun moyen de savoir lequel, et on
            cherche un defaut la ou il n'y en a pas. */}
        {voixKo && <p className="as-muette">Léa ne parle pas — {voixKo}.</p>}

        {/* LA BARRE DE DÉMONSTRATION. Discrète, en bas, hors du chemin : elle ne
            fait pas partie du produit du commerçant. Elle déplace l'horloge et
            rappelle l'assistante — c'est ce qui permet de montrer une journée
            entière debout dans une boutique. */}
        <div className="as-demo">
          <span>Démo</span>
          {SAUTS.map((s) => (
            <button
              key={s.h}
              type="button"
              disabled={attend}
              className={Math.abs(heure - s.h) < 0.01 ? "on" : ""}
              onClick={() => {
                setHeure(s.h);
                parler(`(il est maintenant ${hhmm(s.h)})`, s.h);
              }}
            >
              {s.l}
            </button>
          ))}
          <button
            type="button"
            className="as-fin"
            disabled={attend || bilan}
            onClick={finDeService}
          >
            Fin de service (14 h 30)
          </button>
          <button
            type="button"
            className="as-raz"
            onClick={() => {
              viderJournee();
              setTours([]);
              setCarte(null);
              setRetour(null);
              setBilan(false);
            }}
          >
            Recommencer
          </button>
        </div>

        {/* ═══ VOIR LE RÉSULTAT ═══
            « Le bouton pour voir le résultat sur le direct est très caché et
            très discret. » Il l'était : un lien en petit vert, sous une barre
            de réglages, écrit « voir ce que vos clients voient » — une phrase
            qui décrit une intention au lieu de promettre un résultat.

            C'EST POURTANT LA CHUTE DE TOUTE LA DÉMONSTRATION. Le commerçant
            vient de parler trente secondes ; ce bouton est l'endroit où il
            découvre que ça a produit quelque chose de réel. Il compte ses
            annonces, il porte une flèche, et il occupe toute la largeur. */}
        {enLigne && (
          <a className="as-voir" href={`/autour-de-moi?h=${heure.toFixed(2)}`}>
            <span>
              <b>
                {journee.moments.length === 1
                  ? "Votre annonce est en ligne"
                  : `Vos ${journee.moments.length} annonces sont en ligne`}
              </b>
              <em>Voir Le Direct de Dax</em>
            </span>
            <i aria-hidden="true">→</i>
          </a>
        )}
      </div>
    </div>
  );
}
