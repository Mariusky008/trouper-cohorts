/**
 * 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`docs/univers/ma-maison.md` ; le lot M1). Le propriétaire, le 16 novembre 2026 :
 * « on choisit juste parmi les univers disponibles, et après l'inscription on arrive dans notre univers, où on va pouvoir
 * y placer des choses » ; une pièce « avec un siège au centre […] et avoir tout autour de nous ».
 *
 * Chacun a UNE pièce du catalogue (`PIECES_DUO`, les neuf) : son image en largeur (le panorama du lot M0), qu'on parcourt
 * au doigt, sa figurine posée au centre, dans son fauteuil ; ses emplacements (la télé, la platine, les cadres,
 * l'étagère, la fenêtre, la table basse, les lampes, le coin du chat), qu'on touche. Elle se remplit avec ce qu'on
 * garde dans ses conversations (le lot M2 : `placerChezMoi`, `arriveeChezMoi`).
 *
 * Derrière l'interrupteur `MA_MAISON_CATALOGUE` (éteint) : l'onglet « Ma maison » garde l'univers d'aujourd'hui tant
 * qu'il l'est ; l'adresse d'essai `/univers/maison` (l'administrateur, sur son téléphone d'habitant) la montre déjà.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { PIECES_DUO, type EmplacementsDuo, type MomentDuo, type PieceDuo, type PlaceDuo } from "./pieces-duo";
import type { ImageSalon } from "./salon";

/** 🔀 L'interrupteur : ÉTEINT tant que le propriétaire ne l'a pas jouée sur son téléphone (`ma-maison.md`, section 10). */
export const MA_MAISON_CATALOGUE = false;

/**
 * L'ordre des propositions (`ma-maison.md`, section 3) : l'âge range, il n'interdit pas — toutes sont proposées à tous.
 * Les 15-17 ans (« 18 ans ou plus ? » : non) voient d'abord les pièces des plus jeunes ; les autres, celles des adultes.
 */
export const ORDRE_JEUNES: readonly PieceDuo[] = ["hangar", "newyork", "rue", "chambre-musicale", "cafe", "salon", "terrasse", "cuisine", "chambre"];
export const ORDRE_ADULTES: readonly PieceDuo[] = ["salon", "terrasse", "cuisine", "chambre", "cafe", "newyork", "hangar", "rue", "chambre-musicale"];
export const ordreDuCatalogue = (adulte: boolean | null): readonly PieceDuo[] => (adulte === false ? ORDRE_JEUNES : ORDRE_ADULTES);

/**
 * La figurine au centre, si la pièce n'a pas encore son centre posé à la main : la boîte de la figurine assise dans son
 * fauteuil (comme on la trace, `pieces-duo.ts`, `LargeVue`) — `x` son milieu, `y` le sol sous le fauteuil, `hauteur` de
 * la tête au sol, en fractions du panorama.
 */
export const CENTRE_PAR_DEFAUT: PlaceDuo = { x: 0.5, y: 0.93, hauteur: 0.52 };
/** (le panorama : 3584 × 1024 ; ses deux largeurs, le téléphone et l'ordinateur) */
export const LARGEURS_PANORAMA = [1792, 3584] as const;
/** (une vignette du catalogue : le panorama réduit) */
export const LARGEURS_VIGNETTE = [720, 1440] as const;
/** (la figurine posée : petite, moins de 80 Ko, `ma-maison.md`, section 9) */
export const LARGEURS_FIGURINE = [360, 720] as const;

/** 🛋️ Sa pièce, telle que l'écran la pose : le panorama dans la lumière de l'heure, ses emplacements, son centre. */
export type ScenePiece = {
  piece: PieceDuo;
  nom: string;
  emoji: string;
  moment: MomentDuo;
  panorama: ImageSalon;
  emplacements: EmplacementsDuo | null;
  centre: PlaceDuo;
};
/** Ce que « Ma maison » reçoit : sa pièce (choisie, ou pas encore), sa scène si elle est prête, sa figurine. */
export type MaMaisonVue = {
  piece: PieceDuo | null;
  scene: ScenePiece | null;
  figurine: ImageSalon | null;
  /** 🏠 (lot M2) ce que j'ai gardé, à ses emplacements ; quand je suis venu la dernière fois (`vuLe`, ms ; 0 : jamais). */
  contenu?: ContenuMaison;
  vuLe?: number;
};

/**
 * 🏠 (lot M2) UN OBJET DE MA MAISON : ce que j'ai gardé (📌 Garder, « Nos fous rires », « La mettre dans mon univers »)
 * ou déposé moi-même — `sorte` dit où il va (une photo : un cadre ; une chanson : la platine ; une vidéo : la télé ; le
 * reste : l'étagère) ; `avec` : gardé avec ce proche.
 */
export type SorteMaison = "photo" | "musique" | "video" | "objet";
export type ObjetMaison = {
  id: string;
  sorte: SorteMaison;
  emoji: string;
  titre: string;
  detail?: string;
  image?: { src: string; l: number; h: number };
  lien?: string;
  avec?: { prenom: string; cle: string };
  le: string;
};
/** Ce que montre la pièce : un objet par cadre (ou rien), la platine, la télé, l'étagère (les plus récents d'abord). */
export type ContenuMaison = { cadres: (ObjetMaison | null)[]; platine: ObjetMaison | null; tele: ObjetMaison | null; etagere: ObjetMaison[]; total: number };
/** (l'étagère de la pièce montre les six derniers ; « Mon étagère » a tout) */
export const ETAGERE_MAISON_MAX = 6;

/**
 * 🏠 OÙ VA CHAQUE CHOSE (`ma-maison.md`, section 5), dans l'ordre où je les ai gardées : une photo, le premier cadre
 * libre, sinon à la place de la plus ancienne ; la dernière chanson sur la platine, la dernière vidéo à la télé (les
 * autres rejoignent l'étagère, en pochettes) ; le reste sur l'étagère. Sans cadre relevé, les photos vont sur l'étagère.
 */
export function placerChezMoi(objets: readonly ObjetMaison[], nCadres: number): ContenuMaison {
  const ordre = [...objets].sort((a, b) => a.le.localeCompare(b.le));
  const cadres: (ObjetMaison | null)[] = Array.from({ length: Math.max(0, nCadres) }, () => null);
  const etagere: ObjetMaison[] = [];
  let platine: ObjetMaison | null = null;
  let tele: ObjetMaison | null = null;
  for (const o of ordre) {
    if (o.sorte === "photo" && cadres.length) {
      const libre = cadres.indexOf(null);
      if (libre >= 0) cadres[libre] = o;
      else {
        // (le plus ancien est remplacé ; il reste dans « Mon étagère »)
        let vieux = 0;
        cadres.forEach((c, i) => {
          if (c && cadres[vieux] && c.le < cadres[vieux]!.le) vieux = i;
        });
        cadres[vieux] = o;
      }
    } else if (o.sorte === "musique") {
      if (platine) etagere.push(platine);
      platine = o;
    } else if (o.sorte === "video") {
      if (tele) etagere.push(tele);
      tele = o;
    } else etagere.push(o);
  }
  return { cadres, platine, tele, etagere: etagere.sort((a, b) => b.le.localeCompare(a.le)).slice(0, ETAGERE_MAISON_MAX), total: objets.length };
}

/** Les objets de la pièce, à leur place (pour l'arrivée : la caméra passe sur chacun). */
export const objetsPlaces = (c: ContenuMaison): ObjetMaison[] => [...c.cadres.filter((x): x is ObjetMaison => Boolean(x)), ...(c.platine ? [c.platine] : []), ...(c.tele ? [c.tele] : []), ...c.etagere];

/**
 * ✨ L'ARRIVÉE (`ma-maison.md`, section 5) : ce que j'ai gardé avec mes proches depuis ma dernière visite, et qui est dans
 * la pièce — « ✨ 3 choses gardées avec Léa » (« avec Léa et Sam », « avec Léa, Sam et Zoé ») ; la caméra passe sur chacune
 * (quatre au plus). Rien de nouveau, ou jamais venu sans rien de gardé avec quelqu'un : `null`.
 */
export function arriveeChezMoi(c: ContenuMaison, vuLe: number): { phrase: string; ids: string[] } | null {
  const neufs = objetsPlaces(c)
    .filter((o) => o.avec && (Date.parse(o.le) || 0) > vuLe)
    .sort((a, b) => a.le.localeCompare(b.le));
  if (!neufs.length) return null;
  const qui = [...new Set(neufs.map((o) => o.avec!.prenom))];
  const avec = qui.length === 1 ? qui[0] : `${qui.slice(0, -1).join(", ")} et ${qui[qui.length - 1]}`;
  return { phrase: `✨ ${neufs.length === 1 ? "Une chose gardée" : `${neufs.length} choses gardées`} avec ${avec}`, ids: neufs.slice(-4).map((o) => o.id) };
}

/** Ce que dit un objet touché, sous son titre. */
export function ditDeLObjet(o: ObjetMaison): string {
  const avec = o.avec ? `Gardé avec ${o.avec.prenom}` : "Mis chez toi";
  return o.detail ? `${avec} · ${o.detail}` : avec;
}
export const PHRASES_MAISON = {
  ecouter: "▶ Écouter",
  regarder: "▶ Regarder",
  voir: "🔍 La voir en grand",
  toutes: "📚 Toute mon étagère",
} as const;

/**
 * ＋ (lot M2, deuxième partie) « AJOUTER CHEZ MOI » (`ma-maison.md`, section 6) : mettre soi-même ce qui compte, sans
 * conversation — une photo de son téléphone (un cadre), un film ou un clip (la télé), une chanson (la platine), un livre,
 * une recette, un voyage, une fierté ou autre chose (l'étagère). Rien d'obligatoire.
 */
export type QuoiAjout = "photo" | "film" | "clip" | "chanson" | "livre" | "recette" | "voyage" | "fierte" | "autre";
export const AJOUTS_MAISON: readonly { cle: QuoiAjout; emoji: string; nom: string; sorte: SorteMaison; indice: string }[] = [
  { cle: "photo", emoji: "🖼️", nom: "Une photo", sorte: "photo", indice: "Une légende, si tu veux" },
  { cle: "film", emoji: "🎬", nom: "Un film", sorte: "video", indice: "Le Grand Bleu" },
  { cle: "clip", emoji: "📺", nom: "Un clip", sorte: "video", indice: "Le clip de l’été" },
  { cle: "chanson", emoji: "🎵", nom: "Une chanson", sorte: "musique", indice: "La chanson de notre mariage" },
  { cle: "livre", emoji: "📚", nom: "Un livre", sorte: "objet", indice: "Le Petit Prince" },
  { cle: "recette", emoji: "🍲", nom: "Une recette", sorte: "objet", indice: "Le gratin de mamie" },
  { cle: "voyage", emoji: "✈️", nom: "Un voyage", sorte: "objet", indice: "Lisbonne, au printemps" },
  { cle: "fierte", emoji: "🏅", nom: "Une fierté", sorte: "objet", indice: "Mon premier semi-marathon" },
  { cle: "autre", emoji: "✨", nom: "Autre chose", sorte: "objet", indice: "Ce qui compte pour moi" },
];
export const ajoutDe = (x: unknown) => AJOUTS_MAISON.find((a) => a.cle === x) ?? null;
/** Où il va, dit à celui qui l'ajoute. */
export const OU_VA: Record<SorteMaison, string> = { photo: "dans un cadre", video: "à la télé", musique: "sur la platine", objet: "sur l’étagère" };
export const AJOUT_TITRE_MAX = 28;
export const AJOUT_MOT_MAX = 120;
/** (la photo envoyée : 1 600 pixels au plus côté téléphone, 6 Mo au plus ; recopiée chez nous en 900 pixels) */
export const AJOUT_PHOTO = { cote: 1600, octets: 6_000_000, largeur: 900 } as const;
export const PHRASES_AJOUT = {
  bouton: "＋",
  titre: "Ajouter chez moi",
  quoi: "Qu’est-ce que tu mets chez toi ?",
  rien: "Rien d’obligatoire : une photo de temps en temps suffit à faire vivre la maison.",
  nom: "Son nom",
  lien: "Un lien (YouTube, Spotify…), si tu veux",
  mot: "Un mot, si tu veux",
  choisirPhoto: "📷 Choisir une photo",
  autrePhoto: "Une autre photo",
  mettre: "Mettre chez moi",
  enCours: "Je l’installe…",
  fait: (ou: string) => `✓ C’est chez toi, ${ou}`,
  sansNom: "Donne-lui un nom.",
  sansPhoto: "Choisis d’abord une photo.",
  retour: "‹ Autre chose",
  enlever: "🗑️ L’enlever de chez moi",
  enleverMien: "Il disparaît de chez toi.",
  enleverAvec: (prenom: string) => `Il reste sur votre étagère, avec ${prenom}.`,
  annuler: "Annuler",
  enleve: "C’est enlevé.",
} as const;
/** Une pièce proposée : son nom, et sa vignette si son panorama est fait (sinon, elle n'est pas encore prête). */
export type PieceAuCatalogue = { cle: PieceDuo; nom: string; pour: string; emoji: string; vignette: ImageSalon | null };
export type CatalogueMaison = { pieces: PieceAuCatalogue[]; piece: PieceDuo | null };

/** Les pièces du catalogue, dans l'ordre de l'âge. */
export const piecesDansLOrdre = (adulte: boolean | null) => ordreDuCatalogue(adulte).map((c) => PIECES_DUO.find((p) => p.cle === c)!);

/**
 * 👆 CE QU'ON TOUCHE dans sa maison (le lot M1 : elle est encore vide ; ce qu'on garde dans ses conversations viendra s'y
 * mettre, le lot M2) : ce que chaque emplacement accueillera.
 */
export const EMPLACEMENTS_MAISON = {
  tele: { emoji: "📺", nom: "La télé", dit: "Les clips, les films et les vidéos que tu gardes dans tes conversations passeront ici." },
  platine: { emoji: "🎵", nom: "La platine", dit: "La chanson que tu gardes tournera ici ; les autres rejoindront l’étagère, en pochettes." },
  cadres: { emoji: "🖼️", nom: "Un cadre", dit: "Les photos que tu gardes dans tes conversations viendront s’y accrocher toutes seules." },
  etagere: { emoji: "📚", nom: "L’étagère", dit: "Les mots, les rendez-vous et les mèmes que tu gardes viendront s’y ranger." },
  fenetre: { emoji: "🪟", nom: "La fenêtre", dit: "Le ciel d’ici, à l’heure qu’il est : le matin, le soir, la nuit." },
  table: { emoji: "☕", nom: "La table basse", dit: "Ce qu’on te laisse en passant chez toi s’y posera." },
  lampes: { emoji: "💡", nom: "Une lampe", dit: "Touche-la : elle s’allume." },
  chat: { emoji: "🐾", nom: "Le coin du chat", dit: "Ton compagnon viendra s’y installer." },
} as const;
export type EmplacementMaison = keyof typeof EMPLACEMENTS_MAISON;

/** La phrase de l'arrivée, la maison encore vide (`ma-maison.md`, section 3). */
export const MAISON_VIDE = "Ta maison se remplit toute seule avec ce que tu gardes dans tes conversations.";
