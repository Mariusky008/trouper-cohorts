/**
 * 📸 ENVOYER LE MOMENT (les grands moments, lot R3 ; `docs/univers/grands-moments.md`) : ce qui ne dépend pas du serveur.
 *
 * Juste après mon grand moment, une carte sous ma figurine (« Ta réaction à 2:17 est prête », « Envoyer à un ami » ; maquette validée le 27/11) : le serveur fabrique une image au format story (1080 × 1920) —
 * la miniature officielle de la vidéo (on ne peut pas copier l'image du lecteur YouTube : il est fermé aux autres sites),
 * l'heure exacte (« à 2:47 »), ma figurine qui fait la tête de l'émotion, sa bulle, et l'adresse du moment
 * (`clikme.fr/moment/<id>`). Le téléphone l'envoie (WhatsApp, Instagram, TikTok… par sa feuille de partage), sinon on
 * l'enregistre et on copie le lien. Seulement ses propres réactions.
 *
 * FICHIER PARTAGÉ (l'écran, le serveur, les essais).
 */
import { MOMENTS, type CleMoment } from "./grands-moments";
import { minuteVideo } from "./salons-ouverts";

export const MOMENT_PARTAGE = {
  /** l'image story */
  largeur: 1080,
  hauteur: 1920,
  /** le titre de la vidéo, sur l'image : 90 signes au plus */
  titre: 90,
  /** la page du moment repart trois secondes avant */
  avant: 3,
  /** un moment s'efface au bout de trente jours */
  jours: 30,
  /** vingt images par jour et par personne */
  parJour: 20,
  /** (27 novembre 2026, le propriétaire : « je ne vois même pas ma réaction ») la pastille attend la fin de mon grand
   *  moment, puis reste 6 s */
  pastille: 6000,
} as const;

/** Un moment envoyé : qui, quelle vidéo, à quelle seconde, quelle émotion, le mot de sa bulle. */
export type MomentPartage = { id: string; prenom: string; video: { id: string; titre: string }; t: number; e: CleMoment; mot: string; le: number };

export const idMomentValide = (x: unknown): x is string => typeof x === "string" && /^[a-z0-9]{10}$/.test(x);
export const idVideoValide = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9_-]{11}$/.test(x);
export const cleMomentValide = (x: unknown): x is CleMoment => typeof x === "string" && x in MOMENTS;

/** Le moment, sur YouTube : la vidéo, trois secondes avant. */
export const lienYouTubeDuMoment = (video: string, t: number) => `https://www.youtube.com/watch?v=${encodeURIComponent(video)}&t=${Math.max(0, Math.floor(t) - MOMENT_PARTAGE.avant)}s`;
/** Sa page sur ClikMe. */
export const cheminDuMoment = (id: string) => `/moment/${id}`;
/** L'adresse courte, écrite sur l'image (Instagram et TikTok gardent l'image, pas le lien). */
export const adresseCourte = (origine: string, id: string) => `${origine.replace(/^https?:\/\/(www\.)?/, "")}${cheminDuMoment(id)}`;

export const PHRASES_MOMENT = {
  /** la carte sous ma figurine (maquette « Envoyer ma réaction », validée le 27/11) */
  prete: (minute: string) => `Ta réaction à ${minute} est prête`,
  /** (maquette « Salon et réactions », validée le 27/11) la petite pastille d'une ligne, après mon grand moment */
  envoyerTa: "Envoyer ta réaction",
  aLaMinute: (minute: string) => `à ${minute}`,
  envoyerAmi: "Envoyer à un ami",
  titre: "Envoie ta réaction",
  sousTitre: (minute: string) => `Ton ami voit ta figurine réagir à ${minute}, et peut revoir le moment.`,
  image: "Image",
  videoCourte: "Vidéo 4 s",
  prepare: "Je prépare ton image…",
  rate: "L’image n’a pas pu se faire. Réessaie.",
  whatsapp: "WhatsApp",
  story: "Story",
  tiktok: "TikTok",
  autre: "Autre",
  enregistrer: "Enregistrer",
  copier: "Copier le lien",
  /** sans feuille de partage (un ordinateur) : le fichier s'enregistre, et on dit quoi en faire */
  enregistreImage: "Image enregistrée : ajoute-la à ta story depuis l’appli.",
  enregistreVideo: "Vidéo enregistrée : ajoute-la depuis l’appli.",
  copie: "Lien copié ✓",
  /** la vidéo de 4 secondes (lot R5) */
  videoPrepare: "Je fais ta vidéo…",
  /** le texte qui part avec l'image */
  texte: (minute: string) => `J’ai réagi à ${minute} 👉`,
  /** sur l'image et sur la page */
  aReagi: (prenom: string, minute: string) => `${prenom} a réagi à ${minute}`,
  regarde: "Regarde le moment avec ta figurine",
  voirYouTube: (minute: string) => `▶ Voir à ${minute} sur YouTube`,
  reagis: "✨ Réagis avec ta figurine",
  efface: "Ce moment s’est effacé (au bout de trente jours).",
  aide: "Instagram et TikTok gardent l’image : l’adresse est écrite dessus.",
  trop: "Vingt images par jour : reviens demain 🙂",
  sansFigurine: "Il faut d’abord ta figurine.",
} as const;

export const minuteDuMoment = (t: number) => minuteVideo(t);
