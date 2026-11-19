/**
 * 🎙️ LE TALKIE-WALKIE DES FIGURINES — 8 novembre 2026, le propriétaire et son ami : « laisser un message à quelqu'un,
 * et la mascotte agit comme traducteur visuel de ce que j'aurais dit oralement ». Pas d'appels : des messages.
 *
 * LA RÈGLE :
 *   1. il parle à UN proche (son bouton « Lui parler », dans l'onglet « Proches ») — 20 secondes au plus, naturellement,
 *      sans rien toucher ;
 *   2. « TA FIGURINE A COMPRIS ÇA » : ClikMe écrit ce qu'il a dit (les sous-titres, découpés en répliques) et PROPOSE,
 *      pour chaque réplique, trois têtes de sa figurine. LA TECHNOLOGIE PROPOSE, IL DÉCIDE : rien ne part sans
 *      « Envoyer », et chaque tête se change d'un toucher ;
 *   3. chez l'autre, SA figurine le dit : sa voix, sa bouche, la tête de chaque réplique au bon moment, les
 *      sous-titres — ou « juste le son » ;
 *   4. la conversation est une petite pièce de théâtre : leurs deux figurines face à face, les répliques qui
 *      s'enchaînent, « Lui répondre ».
 *
 * ENTRE PROCHES DANS LES DEUX SENS SEULEMENT (la figurine est ouverte dès 15 ans) : il l'a ajouté, et lui aussi.
 * « Là maintenant » (ClikMe ouvert) est le seul statut, et il se coupe dans « Moi » — jamais « vu il y a 20 min ».
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import { sentimentValide, type Expressions, type Sentiment } from "./ma-figurine";
import { texteLuDeLEcrit } from "./ecrit";
import { texteLuDeLaPhoto } from "./photo";
import { texteLuDeLaVideo } from "./video";

/** Un message : 20 secondes au plus — une petite scène, pas un monologue. */
export const PAROLE_MAX_S = 20;
export const PAROLE_MIN_S = 0.8;
/** Les répliques d'un message, au plus (deux ou trois têtes par message : au-delà, ça clignote). */
export const REPLIQUES_MAX = 4;
/**
 * SES PREMIÈRES TÊTES : faites dès son premier message (deux images chacune, une seule fois), pour que les
 * propositions aient de quoi jouer. Les propositions ne prennent que celles-ci et celles qu'il a déjà : jamais une
 * tête qui ferait fabriquer des images à chaque message.
 */
export const TETES_DE_DEPART: readonly Sentiment[] = ["joie", "rire", "colere", "tete"];

/** Une réplique jouée : de quand à quand (en secondes de sa voix), ce qu'il dit, la tête qu'elle fait (`null` : la sienne). */
export type Replique = { de: number; a: number; texte: string; tete: Sentiment | null };
/** Une réplique comprise, avant qu'il décide : trois têtes proposées, la première d'office. */
export type RepliqueProposee = { de: number; a: number; texte: string; propositions: Sentiment[] };
/** Un message de la conversation (son son : une adresse signée). `nouveau` : il ne l'a pas encore vu. */
/**
 * ✍️ (lot M1, `ecrit.ts`) `genre: "ecrit"` : un message écrit — pas de voix (`son` vide) ; `texte` en entier ; une seule
 * réplique, les 140 premiers signes dans la tête choisie, le temps que la figurine le dise ; `lien` : son aperçu, quand
 * le serveur l'a préparé (l'image, recopiée chez nous) — `connu` : un site de musique ou de vidéo connu (`sorte`).
 * 📷 (lot M2, `photo.ts`) `genre: "photo"` : une photo — pas de voix ; `photo` (son adresse signée, ses dimensions) ;
 * `texte` : sa légende ; une seule réplique (la légende, dans la tête choisie), le temps que la figurine la montre.
 * 🎬 (lot M3, `video.ts`) `genre: "video"` : une vidéo — `video` (ses adresses signées, sa vignette, sa durée) ; comme une
 * photo pour le reste (la figurine montre sa vignette ; un toucher la lit en grand, avec son son).
 * 🎙️ (lot S4, `vocal.ts`) un vocal du salon : `niveaux` (le volume du micro, un signe toutes les 60 ms : la forme de la
 * voix, et la tête qui parle) ; `ecoute` : celui à qui il était l'a écouté (sinon, son talkie attend sur la table).
 */
export type MessageFil = { id: string; moi: boolean; le: string; duree: number; son: string; repliques: Replique[]; nouveau?: boolean; genre?: "ecrit" | "photo" | "video" | "fichier" | "meme"; texte?: string; lien?: LienDuMessage; photo?: PhotoDuMessage; video?: VideoDuMessage; fichier?: FichierDuMessage; niveaux?: string; ecoute?: boolean; meme?: MemeDuMessage };
/**
 * 🎭 (lot S5, `meme-salon.ts`) un mème du salon : `texte` (ce que dit sa figurine), sa tête, s'il danse, le mème prêt d'où
 * il vient — une donnée, jouée par le moteur chez les deux (pas une vidéo). `voix` : 🎙️ dit avec sa voix — `son` (son
 * adresse signée), `duree` (celle de sa voix), `niveaux` ; `texte` peut être vide tant qu'elle n'est pas transcrite.
 */
export type MemeDuMessage = { tete: Sentiment; danse: boolean; pret?: string; voix?: boolean };
/** 📎 (lot S6) le PDF d'un message : son adresse signée (une heure, il se télécharge sous son nom), son nom, sa taille. */
export type FichierDuMessage = { url: string; nom: string; taille: number };
/** 🎬 (lot M3) la vidéo d'un message : son adresse signée et celle de sa vignette (une heure), ses dimensions, sa durée (s). */
export type VideoDuMessage = { url: string; vignette: string; l: number; h: number; duree: number };
/** 📷 (lot M2) la photo d'un message : son adresse signée (une heure), ses dimensions. */
export type PhotoDuMessage = { url: string; l: number; h: number };
export type LienDuMessage = { url: string; site: string; titre?: string; image?: string; sorte?: "musique" | "video" };
/** Une figurine, de quoi la faire parler : ses images de tous les jours, et ses têtes faites. */
/**
 * `assise` (chantier « Univers », lot 5) : sa figurine du nouveau style, détourée, assise dans son fauteuil (`n` bouche
 * fermée, `p` ouverte), quand il l'a faite — c'est elle qui entre chez l'autre.
 */
export type FigurineVue = { prenom: string; neutre: string; parle: string; expressions: Expressions; assise?: { n: string; p: string; expressions?: Expressions }; chez?: ChezMoi };
/**
 * Un proche, dans l'onglet : sa clé (jamais son identifiant), son prénom, sa figurine, s'il est là, ses messages non
 * lus, la dernière chose dite. `lien` : « proches » (ils se sont ajoutés tous les deux : ils se parlent), « attend »
 * (il l'a ajouté, pas encore l'inverse), « ajoute » (on l'a ajouté : « L'ajouter aussi »). `venu` : il a fait sa
 * figurine pour lui répondre, venu par son lien WhatsApp (« Nouveau sur ClikMe », une semaine).
 */
export type LienProche = "proches" | "attend" | "ajoute";
/** ☀️ `humeur` : son humeur du jour (lot R) ; `imageHumeur` : sa figurine qui la porte (ce visage est fait). */
export type ProcheVivant = {
  cle: string;
  prenom: string;
  image: string;
  la: boolean;
  nonLus: number;
  lien: LienProche;
  /** son dernier message (`meme` : c'était un mème, lot 4 ; `ecrit` : un message écrit, lot M1) */
  dernier?: { texte: string; le: string; moi: boolean; meme?: boolean; ecrit?: boolean; photo?: boolean; video?: boolean; fichier?: boolean };
  venu?: boolean;
  humeur?: Sentiment;
  imageHumeur?: string;
  /** 🏡 son univers est créé et lui est ouvert (« Univers », lot 6) : « Son univers » */
  univers?: boolean;
  /** 📚 ce que leur étagère dit sur sa ligne (lot E2 : un rappel du jour, un souvenir pas encore vu, une relance), et son rang */
  etagere?: { txt: string; rang: number; gris?: boolean };
};
/** La conversation avec un proche. */
/** Une place de son univers (en fractions de son décor, 2:3), et la taille d'une figurine qui s'y assoit. */
export type PlaceChezMoi = { x: number; y: number; echelle: number };
/**
 * 🏡 CHEZ MOI (chantier « Univers », lot 5 — la règle « chez qui ? », tranchée le 12 novembre 2026 : dans l'appli,
 * chacun voit la conversation chez soi, l'autre lui rend visite) : son décor, sa place, celle de l'invité.
 */
/** `figurine` : sa figurine relevée sur son image vedette (son milieu, le bas de son fauteuil, sa hauteur, lot 4). */
/**
 * `etagere` : 🪵 (15 novembre 2026) l'étagère peinte dans son décor (`etagere-peinte-serveur.ts`) — le dessus de sa planche,
 * en fractions du décor ; `decor` est alors l'image où elle est peinte. Seulement dans la conversation.
 */
export type ChezMoi = { decor: string; hote: PlaceChezMoi; invite: PlaceChezMoi; figurine?: { x: number; y: number; hauteur: number }; etagere?: { x1: number; x2: number; y: number } };
// (`FigurineVue.chez` : seulement la sienne, pour la vidéo qu'il envoie par WhatsApp — « chez celui qui envoie », lot 5b)
/** 🎭 Un mème envoyé dans leur conversation (la nouvelle interface, lot 4, `memes-proches-serveur.ts`). */
export type MemeFil = { id: string; moi: boolean; le: string; image: string; texte?: string; video?: string; lien: string; nouveau?: boolean };
/**
 * (`ecrire` : ✍️ lot M1 — on peut lui écrire ; `false` quand le frein `CLIKME_ECRIT=0` est tiré : le micro seulement ;
 * `photos` : 📷 lot M2 — on peut lui envoyer une photo ; `false` : `CLIKME_PHOTOS=0` ; `videos` : 🎬 lot M3, de même avec
 * `CLIKME_VIDEOS=0`)
 */
export type Fil = { cle: string; lui: FigurineVue; moi: FigurineVue; la: boolean; messages: MessageFil[]; chezMoi?: ChezMoi; memes?: MemeFil[]; ecrire?: boolean; photos?: boolean; videos?: boolean; fichiers?: boolean };

export const cleValide = (x: unknown): string | null => (typeof x === "string" && /^[a-f0-9]{16}$/.test(x) ? x : null);
export const texteDuMessage = (r: readonly Replique[]) =>
  r
    .map((x) => x.texte)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
/**
 * 👀 CE QUE LES FIGURINES LISENT D'UN MESSAGE (l'aparté, le mot de la fin, l'étagère) : d'un vocal, ses mots transcrits ;
 * (lot M1) d'un message écrit, son texte (et d'un lien, son titre seulement).
 */
export function texteLuDuMessage(f: { genre?: unknown; texte?: unknown; lien?: { titre?: unknown } | null; legende?: unknown; repliques?: unknown; duree?: unknown }): string {
  if (f.genre === "ecrit") return texteLuDeLEcrit(f);
  // 📷 (lot M2) d'une photo, sa légende seulement : jamais l'image
  if (f.genre === "photo") return texteLuDeLaPhoto(f);
  // 🎬 (lot M3) d'une vidéo, sa légende seulement : jamais la vidéo
  if (f.genre === "video") return texteLuDeLaVideo(f);
  // 📎 (lot S6) un PDF : rien (les figurines ne lisent pas les documents)
  if (f.genre === "fichier") return "";
  // 🎭 (lot S5) un mème du salon : ce que dit sa figurine
  if (f.genre === "meme") return typeof f.texte === "string" ? f.texte.trim() : "";
  return texteDuMessage(repliquesValides(f.repliques, Number(f.duree)) ?? []);
}

const sansAccents = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'");

/**
 * LES RÈGLES : ses mots disent quelle tête (sans modèle, ou quand il ne répond pas). Dans l'ordre : la première qui
 * colle passe devant. « Je suis mort » peut vouloir dire le fou rire, l'épuisement ou le choc : d'où trois
 * propositions, jamais une seule.
 */
const INDICES: readonly [Sentiment, RegExp][] = [
  ["rire", /\b(haha+|hihi|mdr|ptdr|lol|trop drole|je suis mort|mort de rire|je rigole|j'en peux plus)\b|😂|🤣/],
  ["tete", /\b(oh non|j'avais dit|pas possible|encore rate|zut|mince|oups|j'y crois pas|la honte|catastrophe)\b|🤦/],
  ["chut", /\b(chut|secret|je dis rien|je dis ca|entre nous|personne ne sait)\b|🤫/],
  ["endouce", /\b(je savais|je le savais|en douce|discretement|hihi)\b|🤭/],
  ["bras", /\b(marre|pff+|bof|n'importe quoi|toujours pas|j'attends|serieux|non mais)\b|🙄/],
  ["colere", /\b(enerve|en colere|grr+|insupportable|ras le bol|j'en ai marre)\b|😠|😡/],
  ["victoire", /\b(gagne|yes|bravo|reussi|enfin|on l'a fait|c'est fait|allez|youpi)\b|🙌|🎉/],
  ["euphorie", /\b(trop hate|incroyable|genial|waouh|wow|trop fort|trop bien|j'adore)\b|🤩/],
  ["coeur", /\b(merci|je t'aime|bisous|tu me manques|manque|des bisous|je t'embrasse)\b|❤|🫶/],
  ["amour", /\b(amour|mon coeur|ma puce|cheri|cherie)\b|😍/],
  ["tristesse", /\b(triste|dommage|snif|desole|pas bien|fatigue|epuise|creve|malade)\b|😢|😭/],
  ["grimace", /\b(beurk|berk|degoutant|bizarre|n'importe quoi)\b|😜/],
];
/** Quand ses mots ne disent rien de précis : une tête qui sourit, puis qui rit, puis qui s'emballe. */
const PAR_DEFAUT: readonly Sentiment[] = ["joie", "rire", "euphorie", "tete", "colere"];

/** Trois têtes proposées pour cette réplique, parmi celles qu'il peut jouer (`dispo`), la plus probable d'abord. */
export function proposerParRegles(texte: string, dispo: readonly Sentiment[]): Sentiment[] {
  const t = sansAccents(texte);
  const vues = INDICES.filter(([, re]) => re.test(t)).map(([s]) => s);
  const l: Sentiment[] = [];
  for (const s of [...vues, ...PAR_DEFAUT, ...dispo]) if (dispo.includes(s) && !l.includes(s)) l.push(s);
  return l.slice(0, 3);
}

/** Les têtes qu'il peut jouer : celles qu'il a déjà, et ses premières (faites dès son premier message). */
export const tetesJouables = (faites: readonly string[]): Sentiment[] => [...new Set([...TETES_DE_DEPART, ...faites.map((x) => sentimentValide(x)).filter((x): x is Sentiment => Boolean(x))])];

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const propre = (t: unknown) =>
  String(t ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

/**
 * SES PHRASES, EN RÉPLIQUES : les morceaux de la transcription, fusionnés jusqu'à `REPLIQUES_MAX` (une réplique de
 * moins de 1,5 s rejoint sa voisine), bout à bout de 0 à la fin de sa voix. Sans transcription : une seule réplique,
 * sans texte (il choisira la tête).
 */
export function decouperEnRepliques(segments: readonly { start: number; end: number; text: string }[], duree: number): { de: number; a: number; texte: string }[] {
  const d = Math.max(PAROLE_MIN_S, duree);
  let l = segments
    .map((x) => ({ de: borne(Number(x.start) || 0, 0, d), a: borne(Number(x.end) || 0, 0, d), texte: propre(x.text) }))
    .filter((x) => x.texte && x.a > x.de)
    .sort((x, y) => x.de - y.de);
  if (!l.length) return [{ de: 0, a: Math.round(d * 100) / 100, texte: "" }];
  const fusionner = (i: number) => {
    const [x, y] = [l[i], l[i + 1]];
    l = [...l.slice(0, i), { de: x.de, a: y.a, texte: `${x.texte} ${y.texte}`.trim() }, ...l.slice(i + 2)];
  };
  // trop courtes : avec leur voisine
  for (let i = 0; i < l.length - 1; ) {
    if (l[i].a - l[i].de < 1.5 || l[i + 1].a - l[i + 1].de < 1.5) fusionner(i);
    else i++;
  }
  // trop nombreuses : les deux voisines les plus courtes ensemble
  while (l.length > REPLIQUES_MAX) {
    let k = 0;
    for (let i = 1; i < l.length - 1; i++) if (l[i].a - l[k].de < l[k + 1].a - l[k].de) k = i;
    fusionner(k);
  }
  // bout à bout, de 0 à la fin
  l = l.map((x, i) => ({ ...x, de: i === 0 ? 0 : l[i - 1].a, a: i === l.length - 1 ? d : x.a }));
  return l.map((x) => ({ de: Math.round(x.de * 100) / 100, a: Math.round(x.a * 100) / 100, texte: x.texte }));
}

/** Ses répliques, telles qu'il les envoie, relues : des instants dans sa voix, des textes courts, des têtes qui existent. */
export function repliquesValides(x: unknown, duree: number): Replique[] | null {
  if (!Array.isArray(x) || !x.length || x.length > REPLIQUES_MAX + 2) return null;
  const d = Math.max(PAROLE_MIN_S, Number(duree) || 0) + 0.5;
  const l: Replique[] = [];
  for (const r of x) {
    if (!r || typeof r !== "object") return null;
    const o = r as Record<string, unknown>;
    const de = Number(o.de);
    const a = Number(o.a);
    if (!Number.isFinite(de) || !Number.isFinite(a) || de < 0 || a <= de || a > d) return null;
    const tete = o.tete == null || o.tete === "" ? null : sentimentValide(o.tete);
    if (o.tete != null && o.tete !== "" && !tete) return null;
    l.push({ de: Math.round(de * 100) / 100, a: Math.round(a * 100) / 100, texte: propre(o.texte), tete });
  }
  return l.sort((p, q) => p.de - q.de);
}

/** La réplique jouée à l'instant `t` de sa voix. */
export function repliqueA(r: readonly Replique[], t: number): Replique | null {
  if (!r.length) return null;
  return r.find((x) => t >= x.de && t < x.a) ?? (t >= r[r.length - 1].a ? r[r.length - 1] : r[0]);
}

// ─── 📲 L'ÉTAPE 5 : UN MESSAGE PAR WHATSAPP, À QUELQU'UN QUI N'A PAS CLIKME (`/t/<id>`) ───────────────────────────
/**
 * Il parle comme à un proche ; le message part en LIEN (le partage du téléphone, rien à régler chez Meta). Celui qui
 * l'ouvre entend sa figurine sans rien installer ; pour répondre, il fait la sienne en un selfie (sa réponse se dit
 * pendant qu'elle se fabrique) — et ils deviennent proches. Trois liens par jour (chaque réponse fait fabriquer une
 * figurine) ; un lien s'efface au bout de trente jours.
 */
export const LIENS_PAR_JOUR = 3;
export const LIEN_JOURS = 30;
/** Les personnes qui peuvent répondre à un même lien (et devenir ses proches) : un lien qui circule trop loin s'arrête là. */
export const REPONSES_PAR_LIEN = 5;
export const idLienValide = (x: unknown): string | null => (typeof x === "string" && /^[a-z0-9]{12}$/.test(x) ? x : null);
/** Qui regarde le lien : son auteur ; quelqu'un sans compte ; un compte sans photo ; une figurine en fabrication ; prête. */
export type VisiteurLien = "auteur" | "sans" | "photo" | "fabrication" | "prete";
/** Le message d'un lien, tel que la page le montre. `cle` : la clé de profil de son auteur (leur conversation, ensuite). */
export type LienVu = {
  id: string;
  de: FigurineVue;
  cle: string;
  pour: string;
  le: string;
  duree: number;
  son: string;
  repliques: Replique[];
  expire: string;
  visiteur: VisiteurLien;
  /** Sa figurine, prête : de quoi répondre tout de suite. */
  moi?: FigurineVue;
  /** Il a déjà répondu (il peut encore : leur conversation continue). */
  repondu?: boolean;
};
/**
 * Le texte qui part avec le lien, dans WhatsApp (le lien seul : son aperçu montre sa figurine et ▶). Le 9 novembre
 * 2026, le patron : « le message n'est pas du tout encourageant ou beau, ça ne donne pas envie de cliquer ».
 */
export const texteDuLien = (pour: string) => `${pour ? `${pour} ! ` : ""}🎙️ Ma figurine a un message pour toi, écoute 👇`;
/** La légende de la vidéo (sa figurine qui dit son message se joue dans WhatsApp) : le lien ne sert plus qu'à répondre. */
export const texteAvecVideo = (pour: string, url: string) => `🎙️ ${pour ? `${pour}, je` : "Je"} t’ai laissé un message avec ma figurine ! Réponds-moi avec la tienne 👉 ${url}`;
