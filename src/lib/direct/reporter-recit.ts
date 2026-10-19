/**
 * 🎙️ LE REPORTER RACONTE — pour le commerçant qui ne veut ni parler ni se montrer.
 *
 * « Pour ceux qui ne veulent pas parler, et rien faire, on pourrait leur
 * proposer un mode journaliste : quelqu'un qui parle de leurs produits à leur
 * place, du style "aujourd'hui je suis chez Bergine et je vais me faufiler dans
 * sa cuisine pour voir ce qu'elle nous propose"… Évidemment, il faut qu'à
 * chaque fois ce soit un phrasé différent, sinon ce sera bien trop répétitif. »
 *
 * CE FICHIER ÉCRIT CE QUE DIT LE REPORTER, ET RIEN D'AUTRE. Il prend ce que le
 * commerçant a donné au comptoir (le nom de son plat ou de sa pièce, son prix,
 * les cases qu'il a touchées) et en tire un petit récit en cinq temps :
 *   l'ARRIVÉE (« Aujourd'hui, je suis chez Bergine… »), la DÉCOUVERTE (« Au menu
 *   du jour : magret grillé »), un ou deux FAITS (ses cases : « C'est fait
 *   maison »), ou un REGARD sur ses photos s'il n'en a coché aucune, le PRIX,
 *   l'APPEL (« On se retrouve chez Bergine ce midi ? »).
 *
 * TROIS RÈGLES, VÉRIFIÉES (`scripts/verifier-recit-reporter.mjs`) :
 *   · IL NE DIT QUE CE QUE LE COMMERÇANT A DONNÉ. Pas de « recette de sa
 *     grand-mère », pas de « ça sent bon » : un fait sur le commerce vient
 *     d'une case qu'il a touchée. Le reporter peut réagir aux photos qu'on voit
 *     (« Regardez-moi ça »), il n'invente rien de ce qu'on ne voit pas.
 *   · JAMAIS « IL » NI « ELLE » POUR LE COMMERÇANT : son prénom, le nom de son
 *     commerce, ou « on ». Un prénom ne dit pas comment quelqu'un veut qu'on
 *     parle de lui.
 *   · ÇA NE SE RÉPÈTE PAS : des milliers de combinaisons par métier, et le
 *     tirage écarte les arrivées, découvertes et appels de ses derniers films
 *     (`deja`). « 🎲 Une autre version » retire au sort.
 *
 * LES PHRASES SONT À VALIDER (`RECIT_VALIDE`) : d'ici là, le reporter ne
 * raconte qu'au comptoir de démonstration.
 *
 * FICHIER PARTAGÉ : aucune dépendance au DOM — le serveur reconstruit le texte
 * à partir des numéros tirés (`recitDepuisIds`) avant de le faire dire.
 */

/** Les métiers où le reporter sait raconter — les autres viendront. */
export type MetierReporter = "table" | "mode";

/** Tant que Jean-Philippe n'a pas relu les phrases : le reporter ne raconte qu'en démonstration. */
export const RECIT_VALIDE = false;

/** Une case que le commerçant touche — et ce que le reporter peut en dire. */
export type Fait = { id: string; mot: string; phrases: string[] };

export type Banque = {
  /** Ce qu'on peut cocher au comptoir : les seuls faits que le reporter dira. */
  faits: Fait[];
  arrivee: string[];
  decouverte: string[];
  /** Quand il n'a coché aucune case : le reporter réagit à ce qu'on voit, sans rien affirmer. */
  regard: string[];
  prix: string[];
  appel: string[];
};

/*
 * LES TROUS DES PHRASES :
 *   {chez}     « chez Bergine », « au Bordeaux », « à la Table de Margot »
 *   {de}       « de chez Bergine », « du Bordeaux », « de la Table de Margot »
 *   {commerce} le nom tel qu'il l'écrit
 *   {prenom}   son prénom — la phrase n'est tirée que s'il l'a donné
 *   {ville}    sa ville — idem
 *   {plat}     le nom de son plat, de sa pièce, tel qu'il l'a écrit (toujours après « : » ou entre guillemets)
 *   {prix}     son prix — la phrase n'est tirée que s'il y en a un
 */
export const BANQUES_REPORTER: Record<MetierReporter, Banque> = {
  table: {
    faits: [
      { id: "maison", mot: "Fait maison", phrases: ["C’est fait maison.", "Fait maison, s’il vous plaît !", "Et c’est du fait maison."] },
      { id: "local", mot: "Produits du coin", phrases: ["Les produits viennent du coin.", "Côté produits : du local.", "Des produits d’ici, du coin."] },
      { id: "nouveau", mot: "Nouveau", phrases: ["C’est une nouveauté.", "Petite nouveauté à la carte, d’ailleurs.", "Une première, ici !"] },
      { id: "limite", mot: "Jusqu’à épuisement", phrases: ["Attention, c’est jusqu’à épuisement.", "Il n’y en aura pas pour tout le monde.", "Premiers arrivés, premiers servis."] },
      { id: "saison", mot: "De saison", phrases: ["Une assiette de saison.", "De saison, comme il se doit.", "C’est la saison, on en profite."] },
      { id: "vege", mot: "Végétarien", phrases: ["Et c’est végétarien.", "Bonne nouvelle : c’est végétarien.", "Version végétarienne, pour tout le monde."] },
      { id: "emporter", mot: "À emporter aussi", phrases: ["Ça se prend aussi à emporter.", "Pressé ? Ça existe à emporter.", "Sur place ou à emporter, au choix."] },
    ],
    arrivee: [
      "Salut tout le monde ! Aujourd’hui, je suis {chez}, et je me faufile en cuisine pour voir ce qui se prépare.",
      "Bonjour {ville} ! Ce midi, votre reporter ClikMe passe {chez}.",
      "Direction {chez} ! Je passe la tête en cuisine pour découvrir le plat du jour.",
      "Coucou ! Je suis {chez}, et j’ai réussi à entrer en cuisine. Chut, on ne dérange personne.",
      "Ce midi, votre reporter ClikMe s’invite {chez}.",
      "Mission du jour : découvrir ce qu’on mange {chez}.",
      "Vous vous demandez où manger ce midi ? Suivez-moi {chez}.",
      "Je viens d’arriver {chez}, et j’ai une seule question : qu’est-ce qu’on mange aujourd’hui ?",
      "Micro en main, je file {chez} voir le plat du jour.",
      "Aujourd’hui, je me glisse dans la cuisine {de}.",
      "Bonjour à tous ! On est {chez} pour le plat du jour, et je vous emmène.",
      "Top départ : je suis {chez}, et je veux savoir ce que {prenom} nous a préparé.",
      "Votre reporter ClikMe est {chez}, et on va voir ce qui sort de la cuisine.",
      "Faim ? Moi aussi. Alors aujourd’hui, je suis {chez}.",
      "Rendez-vous {chez} pour découvrir le menu du jour !",
      "Ici votre reporter ClikMe, en direct {de}.",
      "Salut {ville} ! On parle cuisine aujourd’hui, et pour ça, je suis {chez}.",
      "Nouvelle escale pour votre reporter : {commerce}.",
      "On a faim, on a un micro, on est {chez}. C’est parti !",
      "Aujourd’hui, ClikMe vous emmène {chez}, à {ville}.",
      "Je suis un fantôme, je ne mange pas… mais je sais où vous allez manger. Direction {chez} !",
      "On pousse la porte {de}, et on file droit vers la cuisine.",
      "Petite visite {chez} ce midi.",
      "Qu’est-ce qui se passe en cuisine {de} ? Je vais voir pour vous.",
      "Bonjour ! Je me glisse en douce derrière le comptoir {de}.",
    ],
    decouverte: [
      "Au menu du jour : {plat}.",
      "Et ce midi, c’est… {plat} !",
      "Ce que {prenom} nous a préparé aujourd’hui ? {plat}.",
      "Le plat du jour, le voilà : {plat}.",
      "Aujourd’hui à l’honneur : {plat}.",
      "Roulement de tambour… {plat} !",
      "Je vous présente le plat du jour : {plat}.",
      "La vedette de ce midi : {plat}.",
      "Et voici ce qui sort de la cuisine : {plat}.",
      "Le plat du jour s’appelle « {plat} ».",
      "Ce midi, la cuisine envoie : {plat}.",
      "Aujourd’hui, on vous sert : {plat}.",
      "Tadam ! {plat}.",
      "Dans l’assiette aujourd’hui : {plat}.",
      "Alors, qu’est-ce qu’on mange ? {plat} !",
      "Le menu du jour tient en quelques mots : {plat}.",
    ],
    regard: [
      "Regardez-moi cette assiette.",
      "Je vous laisse admirer.",
      "Franchement, ça donne envie.",
      "Avouez, vous avez déjà faim.",
      "Gros plan, s’il vous plaît.",
      "Je suis un fantôme, je ne peux pas goûter… et c’est bien dommage.",
      "On zoome un peu ? Voilà.",
      "Prenez le temps de regarder.",
      "Les photos parlent toutes seules.",
    ],
    prix: [
      "Le tout pour {prix}.",
      "Et c’est {prix}.",
      "Côté prix : {prix}.",
      "Prix du jour : {prix}.",
      "Combien ? {prix}.",
      "Et l’addition ? {prix}.",
      "{prix}, l’assiette.",
      "Pour {prix}, s’il vous plaît.",
    ],
    appel: [
      "On se retrouve {chez} ce midi ?",
      "Passez dire bonjour à {prenom} de ma part !",
      "Vous savez où déjeuner aujourd’hui.",
      "C’est {chez}, et c’est ce midi.",
      "Rendez-vous {chez}. Bon appétit !",
      "Moi, je dois filer. Vous, vous avez rendez-vous {chez}.",
      "C’était votre reporter ClikMe, en direct {de}. Bon appétit !",
      "L’adresse est sur ClikMe. À vous de jouer !",
      "Il ne reste plus qu’à passer à table.",
      "On s’y retrouve ce midi ?",
      "Prochain arrêt : votre assiette. Rendez-vous {chez} !",
      "À tout à l’heure {chez} !",
      "Le plat du jour vous attend {chez}.",
      "Bon appétit, et à bientôt pour un nouveau plat du jour !",
    ],
  },
  mode: {
    faits: [
      { id: "nouveau", mot: "Vient d’arriver", phrases: ["Ça vient tout juste d’arriver.", "Arrivage tout frais en boutique.", "C’est un nouvel arrivage."] },
      { id: "tailles", mot: "Plusieurs tailles", phrases: ["Et il y a plusieurs tailles.", "Plusieurs tailles disponibles.", "Côté tailles, il y a le choix."] },
      { id: "france", mot: "Fabriqué en France", phrases: ["Et c’est fabriqué en France.", "Fabrication française, s’il vous plaît.", "Made in France !"] },
      { id: "serie", mot: "Petite série", phrases: ["Attention, c’est une petite série.", "Peu de pièces, alors ne traînez pas.", "Une petite série, pas plus."] },
      { id: "essai", mot: "À essayer sur ClikMe", phrases: ["Et bonne nouvelle : on peut l’essayer sur soi, directement dans ClikMe.", "Essayage virtuel possible sur ClikMe.", "Vous pouvez même l’essayer sur vous, dans ClikMe."] },
      { id: "saisons", mot: "Toute l’année", phrases: ["Ça se porte toute l’année.", "Une pièce pour toutes les saisons.", "Été comme hiver."] },
    ],
    arrivee: [
      "Salut tout le monde ! Aujourd’hui, je suis {chez}, et je fouille les portants pour vous.",
      "Direction {chez} : on va voir ce qui se cache dans les rayons.",
      "On pousse la porte {de}, et on regarde ce qui se passe en rayon.",
      "Votre reporter ClikMe fait du shopping aujourd’hui, {chez}.",
      "Mission du jour : dénicher la pièce à ne pas rater {chez}.",
      "Bonjour {ville} ! Petite virée shopping {chez}.",
      "Je suis {chez}, et je vous montre la pièce du jour.",
      "Ici votre reporter ClikMe, en direct {de}.",
      "Coucou ! Je me glisse dans les cabines {de}.",
      "Envie d’une nouvelle tenue ? Suivez-moi {chez}.",
      "Aujourd’hui, on parle mode, et pour ça, je suis {chez}.",
      "Micro en main, je file {chez} voir la pièce du jour.",
      "Je fais un tour dans les rayons {de}.",
      "Top départ : je suis {chez}, et je veux voir ce que {prenom} met en avant aujourd’hui.",
      "On a rendez-vous {chez} pour la pièce du jour.",
      "Petit tour en boutique aujourd’hui : {commerce}.",
      "Je suis un fantôme, mais j’ai du style. Et aujourd’hui, je suis {chez}.",
      "Shopping time ! Je suis {chez}.",
      "Bonjour à tous ! On est {chez}, et je vous emmène voir la pièce du moment.",
      "Rendez-vous {chez} pour un coup de cœur mode.",
      "Votre reporter ClikMe passe la porte {de}, et c’est parti.",
      "Aujourd’hui, ClikMe vous emmène {chez}, à {ville}.",
      "Pas de panique, je ne vais rien essayer : je suis un fantôme. Mais je suis {chez}.",
      "On a une pièce à vous montrer. Direction {chez} !",
    ],
    decouverte: [
      "La pièce du jour : {plat}.",
      "Et aujourd’hui, la vedette, c’est : {plat}.",
      "Ce que {prenom} met en avant aujourd’hui ? {plat}.",
      "Je vous présente : {plat}.",
      "Coup de cœur du jour : {plat}.",
      "Tadam ! {plat}.",
      "Sur le portant aujourd’hui : {plat}.",
      "Roulement de tambour… {plat} !",
      "À l’honneur aujourd’hui : {plat}.",
      "La pièce à ne pas rater : {plat}.",
      "Et voici la pièce du moment : {plat}.",
      "Aujourd’hui, on craque pour : {plat}.",
      "Alors, qu’est-ce qu’on porte ? {plat} !",
      "Regardez ce que je viens de trouver : {plat}.",
      "Dans les rayons aujourd’hui : {plat}.",
    ],
    regard: [
      "Regardez-moi cette pièce.",
      "Je vous laisse admirer.",
      "Gros plan, s’il vous plaît.",
      "Franchement, ça donne envie.",
      "Je ne peux pas l’essayer, je suis un fantôme… dommage.",
      "Prenez le temps de regarder les détails.",
      "On zoome un peu ? Voilà.",
      "Avouez, vous l’imaginez déjà sur vous.",
      "Ça, c’est du style.",
      "Je vous laisse imaginer la tenue.",
    ],
    prix: [
      "Prix : {prix}.",
      "Et c’est {prix}.",
      "Le tout pour {prix}.",
      "Combien ? {prix}.",
      "Côté prix : {prix}.",
      "{prix}, et c’est à vous.",
      "Pour {prix}, s’il vous plaît.",
      "Et le prix ? {prix}.",
    ],
    appel: [
      "Ça vous attend {chez}.",
      "Allez l’essayer {chez} !",
      "Passez dire bonjour à {prenom} de ma part !",
      "C’est {chez}, et c’est maintenant.",
      "Moi, je dois filer. Vous, vous avez rendez-vous {chez}.",
      "C’était votre reporter ClikMe, en direct {de}. À bientôt !",
      "L’adresse est sur ClikMe. À vous de jouer !",
      "Rendez-vous en boutique, {chez} !",
      "Prochain arrêt : la cabine d’essayage {de}.",
      "À tout à l’heure {chez} !",
      "Vous savez ce qu’il vous reste à faire.",
      "On se retrouve {chez} ?",
      "Le style, c’est {chez}, et c’est aujourd’hui.",
    ],
  },
};

export const estMetierReporter = (famille: string | undefined): famille is MetierReporter => !!famille && famille in BANQUES_REPORTER;

/** Le reporter raconte-t-il au comptoir de ce métier ? `reel` : un vrai commerçant (pas la démonstration). */
export const reporterOuvert = (famille: string | undefined, reel: boolean): boolean => estMetierReporter(famille) && (!reel || RECIT_VALIDE);

/**
 * « CHEZ BERGINE », « AU BORDEAUX », « À LA TABLE DE MARGOT » — et leur « de ». Le
 * nom porte parfois son article (« Le Bordeaux ») ou son « chez » (« Chez
 * Bergine ») : « je suis chez Chez Bergine » et « la cuisine de Le Bordeaux » se
 * liraient comme des fautes.
 */
export function lieuDuCommerce(commerce: string): { chez: string; de: string } {
  const n = commerce.trim().replace(/\s+/g, " ");
  const m = /^(les|le|la)\s+(.+)$/i.exec(n);
  if (m) {
    const art = m[1].toLowerCase();
    if (art === "le") return { chez: `au ${m[2]}`, de: `du ${m[2]}` };
    if (art === "les") return { chez: `aux ${m[2]}`, de: `des ${m[2]}` };
    return { chez: `à la ${m[2]}`, de: `de la ${m[2]}` };
  }
  const l = /^l['’]\s*(.+)$/i.exec(n);
  if (l) return { chez: `à l’${l[1]}`, de: `de l’${l[1]}` };
  if (/^chez\s/i.test(n)) {
    const nom = n.replace(/^chez\s+/i, "");
    return { chez: `chez ${nom}`, de: `de chez ${nom}` };
  }
  return { chez: `chez ${n}`, de: `de ${n}` };
}

/** Ce que le commerçant a donné au comptoir. */
export type Donnees = {
  commerce: string;
  prenom?: string;
  ville?: string;
  /** Le nom de son plat, de sa pièce — tel qu'il l'a écrit. */
  plat: string;
  prix?: string;
  /** Les cases qu'il a touchées (`Fait.id`). */
  faits: string[];
};

export type Role = "arrivee" | "decouverte" | "fait" | "regard" | "prix" | "appel";
/** Les numéros tirés : de quoi refaire le même récit — et ce dont le tirage suivant se souvient. */
export type IdsRecit = { a: number; d: number; f: [string, number][]; r?: number; p?: number; c: number };
export type Recit = { metier: MetierReporter; ids: IdsRecit; morceaux: { role: Role; texte: string }[]; texte: string };

/** Ce que le tirage évite : les arrivées, découvertes et appels de ses derniers films, et leurs textes entiers (`t`, en empreintes). */
export type Deja = { a: number[]; d: number[]; c: number[]; t?: number[] };

/** Le récit ne dépasse pas ce nombre de signes : une trentaine de secondes à dire. */
export const RECIT_MAX = 430;
const PLAT_MAX = 70;

function remplir(phrase: string, d: Donnees): string | null {
  const lieu = lieuDuCommerce(d.commerce);
  const valeurs: Record<string, string | undefined> = {
    chez: lieu.chez,
    de: lieu.de,
    commerce: d.commerce.trim(),
    prenom: d.prenom?.trim() || undefined,
    ville: d.ville?.trim() || undefined,
    plat: d.plat.trim().replace(/\s+/g, " ").replace(/[.!…]+$/, "").slice(0, PLAT_MAX) || undefined,
    // « 19 » tapé sans sa monnaie : le reporter dit « 19 € »
    prix: d.prix?.trim() ? d.prix.trim().replace(/^(\d+(?:[,.]\d{1,2})?)$/, "$1 €") : undefined,
  };
  let manque = false;
  const t = phrase.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = valeurs[k];
    if (v == null) manque = true;
    return v ?? "";
  });
  if (manque) return null;
  const insecable = String.fromCharCode(160);
  return (
    t
      // « {plat}. » quand le plat finit déjà par un point d'interrogation
      .replace(/([?!])\s*([.!])/g, "$1")
      .replace(/\s+([,.])/g, "$1")
      // « LE PLAT DU JOUR S'APPELLE « MAGRET » » : les guillemets ne se séparent pas de leur mot
      .replace(/«\s+/g, `«${insecable}`)
      .replace(/\s+»/g, `${insecable}»`)
  );
}

/** Un générateur pseudo-aléatoire à graine : le même tirage se refait à l'identique. */
function hasard(graine: number) {
  let s = graine >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une graine tirée d'un texte (le commerce, le jour) : deux commerces ne commencent pas pareil le même jour. */
export function graineDe(...morceaux: (string | number)[]): number {
  let h = 2166136261;
  for (const c of morceaux.join("|")) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Les numéros des phrases de cette banque qu'on peut remplir avec ce qu'il a donné. */
const utilisables = (l: readonly string[], d: Donnees) => l.map((p, k) => (remplir(p, d) != null ? k : -1)).filter((k) => k >= 0);

/**
 * Une phrase au hasard parmi `candidats`, sauf celles de ses derniers films (`eviter`, la plus
 * récente d'abord). On en écarte autant qu'on peut en gardant toujours quatre au choix : le hasard
 * reste du hasard, et une phrase ne revient qu'après que presque toutes les autres sont passées.
 */
function choisir(r: () => number, candidats: number[], eviter: readonly number[] = []): number {
  const recents = eviter.slice(0, Math.max(0, candidats.length - 4));
  const l = candidats.filter((k) => !recents.includes(k));
  return l[Math.floor(r() * l.length)];
}

/** Le récit, remis en phrases d'après ses numéros — `null` si un numéro ne correspond à rien. */
export function recitDepuisIds(metier: MetierReporter, d: Donnees, ids: IdsRecit): Recit | null {
  const b = BANQUES_REPORTER[metier];
  if (!b) return null;
  const morceaux: Recit["morceaux"] = [];
  const pousser = (role: Role, phrase: string | undefined) => {
    const t = phrase != null ? remplir(phrase, d) : null;
    if (t == null) return false;
    morceaux.push({ role, texte: t });
    return true;
  };
  if (!pousser("arrivee", b.arrivee[ids.a])) return null;
  if (!pousser("decouverte", b.decouverte[ids.d])) return null;
  for (const [id, k] of ids.f) {
    const f = b.faits.find((x) => x.id === id);
    // UN FAIT QU'IL N'A PAS COCHÉ NE SE DIT PAS, même si on le demande
    if (!f || !d.faits.includes(id) || !pousser("fait", f.phrases[k])) return null;
  }
  if (ids.r != null && !pousser("regard", b.regard[ids.r])) return null;
  if (ids.p != null && !pousser("prix", b.prix[ids.p])) return null;
  if (!pousser("appel", b.appel[ids.c])) return null;
  const texte = morceaux.map((m) => m.texte).join(" ");
  if (texte.length > RECIT_MAX + PLAT_MAX * 2) return null;
  return { metier, ids, morceaux, texte };
}

/**
 * LE TIRAGE. `graine` : un nombre (le commerce, le jour, le numéro de l'essai —
 * « 🎲 Une autre version » change le numéro). `deja` : ce que ses derniers
 * films ont déjà dit, écarté tant qu'il reste d'autres phrases.
 */
export function tirerRecit(metier: MetierReporter, d: Donnees, o: { graine: number; deja?: Deja }): Recit {
  // UN TEXTE DÉJÀ DIT DANS SES SOIXANTE DERNIERS FILMS : on retire au sort (cinq fois au plus)
  let recit = tirerUneFois(metier, d, o.graine, o.deja);
  for (let essai = 1; essai < 5 && o.deja?.t?.includes(graineDe(recit.texte)); essai++) recit = tirerUneFois(metier, d, graineDe(o.graine, essai), o.deja);
  return recit;
}

function tirerUneFois(metier: MetierReporter, d: Donnees, graine: number, dejaDit?: Deja): Recit {
  const b = BANQUES_REPORTER[metier];
  const r = hasard(graine);
  const o = { deja: dejaDit };
  const deja = o.deja ?? { a: [], d: [], c: [] };
  // DEUX FAITS AU PLUS, tirés parmi ses cases — plus, et ça devient une fiche technique
  const faits = b.faits.filter((f) => d.faits.includes(f.id));
  for (let i = faits.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [faits[i], faits[j]] = [faits[j], faits[i]];
  }
  faits.splice(2);
  /* DEUX PHRASES DE SUITE NE COMMENCENT PAS PAR LE MÊME MOT : « Et c'est fait maison. Et c'est
     végétarien. Et c'est 19 €. » sonne comme une liste. `precedent` : le premier mot de la phrase d'avant. */
  let precedent = "";
  const premier = (t: string | null) => (t ?? "").split(/\s+/)[0].toLowerCase().replace(/[^a-zà-ÿ0-9]/g, "");
  const suite = (l: readonly string[], candidats: number[], eviter: readonly number[] = []) => {
    const varies = candidats.filter((k) => premier(remplir(l[k], d)) !== precedent);
    const k = choisir(r, varies.length ? varies : candidats, eviter);
    precedent = premier(remplir(l[k], d));
    return k;
  };
  const tous = (l: readonly unknown[]) => l.map((_, k) => k);
  const a = suite(b.arrivee, utilisables(b.arrivee, d), deja.a);
  const dd = suite(b.decouverte, utilisables(b.decouverte, d), deja.d);
  const f = faits.map((x) => [x.id, suite(x.phrases, tous(x.phrases))] as [string, number]);
  const rr = faits.length ? undefined : suite(b.regard, tous(b.regard));
  const p = d.prix?.trim() ? suite(b.prix, utilisables(b.prix, d)) : undefined;
  const ids: IdsRecit = { a, d: dd, f, c: suite(b.appel, utilisables(b.appel, d), deja.c) };
  if (rr != null) ids.r = rr;
  if (p != null) ids.p = p;
  let recit = recitDepuisIds(metier, d, ids)!;
  // TROP LONG (un nom de plat à rallonge) : le deuxième fait part, puis le regard
  if (recit.texte.length > RECIT_MAX && ids.f.length > 1) recit = recitDepuisIds(metier, d, { ...ids, f: ids.f.slice(0, 1) })!;
  if (recit.texte.length > RECIT_MAX && ids.r != null) recit = recitDepuisIds(metier, d, { ...ids, r: undefined })!;
  return recit;
}

/** Ce que ce récit ajoute à la mémoire des films : les phrases des trente derniers, les textes des soixante derniers. */
export function retenir(deja: Deja | null | undefined, recit: Pick<Recit, "ids" | "texte">, garder = 30): Deja {
  const d = deja ?? { a: [], d: [], c: [] };
  const { ids } = recit;
  return {
    a: [ids.a, ...d.a].slice(0, garder),
    d: [ids.d, ...d.d].slice(0, garder),
    c: [ids.c, ...d.c].slice(0, garder),
    t: [graineDe(recit.texte), ...(d.t ?? [])].slice(0, garder * 2),
  };
}
