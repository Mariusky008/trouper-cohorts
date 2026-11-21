/**
 * 🎬 REGARDER À DEUX (`docs/univers/ma-maison.md`, section 24) — le troisième bouton d'une visite chez un proche, à côté
 * de « 🎁 Une surprise » et « 💬 Votre salon ». Le propriétaire, le 21 novembre 2026, entre la liste de films de la
 * maquette (A) et une vidéo regardée ensemble dans ClikMe (B) : « ok pour B ».
 *
 * Sam est chez Léa : il choisit une vidéo (de sa télé du jour, ou un lien YouTube). Sa séance est prête (la vidéo, en
 * pause au début) et Léa est invitée devant sa télé ; chez elle, « Pendant ton absence » le dit. Quand ils l'ont regardée
 * ensemble (tous les deux dans la séance, la vidéo qui joue, une vingtaine de secondes), elle devient un souvenir commun :
 * « 🎬 Gardé avec Sam · Vu ensemble, le 21 novembre », dans leurs deux maisons.
 */

/** Une proposition reçue (« Sam te propose de regarder « … » ensemble ») : la clé de la maison de Sam, pour le rejoindre. */
export type PropositionRegarder = { cle: string; prenom: string; titre: string; le: number };

/** Les secondes à regarder ensemble (la vidéo qui joue, tous les deux là) pour qu'elle devienne un souvenir commun. */
export const SECONDES_ENSEMBLE = 20;
/** Le souvenir commun se dit dans la séance pendant ce temps (aux deux, à leur pouls suivant). */
export const SOUVENIR_DIT_MS = 20_000;
/** Un lien YouTube : 600 signes au plus. */
export const LIEN_REGARDER_MAX = 600;
/** Le nom d'une vidéo sans titre lisible (un lien dont la page ne répond pas). */
export const TITRE_PAR_DEFAUT = "Une vidéo YouTube";

export const PHRASES_REGARDER = {
  bouton: "Regarder à deux",
  titre: "🎬 Regarder à deux",
  chapo: (prenom: string) => `Choisis une vidéo à regarder avec ${prenom}. Quand vous l’aurez vue ensemble, elle restera chez vous deux.`,
  maTele: "De ta télé du jour",
  lien: "Ou colle un lien YouTube",
  indiceLien: "https://youtu.be/…",
  sansTele: "Ta télé du jour est vide pour l’instant : colle un lien YouTube.",
  proposer: (prenom: string) => `🎬 Proposer à ${prenom}`,
  propose: (prenom: string) => `🎬 C’est proposé : rendez-vous devant ta télé avec ${prenom}.`,
  apres: "Quand vous serez là tous les deux, lance la vidéo : elle deviendra un souvenir commun.",
  allerDevant: "📺 Aller devant ma télé",
  rester: "Rester ici",
  ligne: (prenom: string, titre: string) => `${prenom} te propose de regarder « ${titre} » ensemble`,
  regarder: "Regarder",
  notifTitre: (prenom: string, titre: string) => `🎬 ${prenom} veut regarder « ${titre} » avec toi`,
  notifCorps: "Viens t’asseoir devant sa télé : vous la regardez en même temps.",
  arriveTitre: (prenom: string) => `🎬 ${prenom} est devant ta télé`,
  arriveCorps: (titre: string) => `Viens : vous regardez « ${titre} » ensemble.`,
  souvenir: (titre: string) => `✨ « ${titre} » : un souvenir commun, chez vous deux`,
  vu: (date: string) => `🎬 Vu ensemble, le ${date}`,
  pasProche: "Regarder à deux, c’est entre proches.",
  choisis: "Choisis une vidéo.",
  pasYouTube: "Ce n’est pas une vidéo YouTube : un lien qui commence par https://youtu.be ou https://www.youtube.com",
  pasATaTele: "Cette vidéo n’est plus à ta télé du jour.",
  pasIci: "Cette vidéo ne se regarde pas dans ClikMe : choisis-en une autre.",
} as const;

/** Le jour d'un souvenir commun, comme on le dit (« 21 novembre »), à l'heure de Paris. */
export const jourDuSouvenir = (le: string | number): string => new Date(le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
