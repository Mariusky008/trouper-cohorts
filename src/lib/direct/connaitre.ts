/**
 * 🧠 MIEUX LE CONNAÎTRE — le lot 2 de la stratégie de « Ma collection » (5 novembre 2026, validée avec le patron :
 * « penses-tu que 10 questions sont suffisantes pour comprendre quelqu'un, ou devrions-nous faire différemment pour
 * avoir plus d'infos ? »). On apprend EN CONTINU, sans jamais un long questionnaire :
 *   · LA QUESTION DU JOUR (`QUESTIONS_DU_JOUR`) : drôle et rapide, un toucher ou trois mots ;
 *   · LE PETIT MOT DU JOUR : il annonce la rencontre du jour, avec un clin d'œil à ce qu'il a dit (« drôle et
 *     bienveillant, comme un horoscope qui le connaît ») ;
 *   · « CE QUE TA FIGURINE SAIT DE TOI » : tout ce qu'elle a retenu (`Savoir`), qu'il voit, efface une à une, ou tout ;
 *   · « RETROUVER MA FIGURINE » : le code à six chiffres par e-mail (le compte tenait à un cookie du téléphone).
 *
 * RIEN DE SENSIBLE : aucune question sur la santé, le corps, la religion, la politique, la vie intime, l'argent, le
 * travail précis, l'adresse — et ses réponses passent par les mêmes refus que le reste (pas de numéro, de lien, de
 * mot interdit).
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */

/** Une question du jour : à choix (un toucher), ou libre (trois mots). */
export type QuestionDuJour = { cle: string; q: string; choix?: readonly string[] };

export const QUESTIONS_DU_JOUR: readonly QuestionDuJour[] = [
  { cle: "dimanche", q: "Ton dimanche idéal ?", choix: ["🛋️ Canapé et série", "🥾 Balade au grand air", "🍳 Un grand brunch", "🎉 Une sortie entre amis"] },
  { cle: "plaisir", q: "Le petit plaisir qui sauve ta journée ?" },
  { cle: "resto", q: "Au restaurant, tu…", choix: ["🍝 Prends toujours le même plat", "🎲 Tentes un truc inconnu", "👀 Regardes l'assiette des voisins"] },
  { cle: "rire", q: "Ce qui te fait rire à coup sûr ?" },
  { cle: "musique", q: "La musique qui te met de bonne humeur ?", choix: ["🎸 Du rock", "🎤 De la pop", "🎧 De l'électro", "🎻 Du jazz ou du classique"] },
  { cle: "matin", q: "Le matin, avant ton premier café, tu es…", choix: ["😇 Un ange", "🐻 Un ours", "🤖 En pilote automatique"] },
  { cle: "pouvoir", q: "Ton super-pouvoir secret dans la vie ?" },
  { cle: "consolation", q: "Le plat qui te console ?" },
  { cle: "vacances", q: "En vacances, tu es plutôt…", choix: ["🏖️ Plage", "🏔️ Montagne", "🏙️ Grande ville", "🏡 Chez moi, tranquille"] },
  { cle: "qualite", q: "La qualité que tes amis te reconnaissent ?" },
  { cle: "defaut", q: "Ton défaut le plus mignon ?" },
  { cle: "boutique", q: "Si tu ouvrais une boutique, ce serait…" },
  { cle: "moment", q: "Ton moment préféré de la journée ?", choix: ["🌅 Le matin", "☀️ Le midi", "🌇 La fin d'après-midi", "🌙 Le soir"] },
  { cle: "rangement", q: "Chez toi, tu ranges ou tu empiles ?", choix: ["🗂️ Je range", "🗻 J'empile", "🤷 Ça dépend des jours"] },
  { cle: "talent", q: "Un talent caché ?" },
  { cle: "emerveille", q: "La dernière chose qui t'a émerveillé ?" },
  { cle: "totem", q: "Ton animal totem ?" },
  { cle: "groupe", q: "Dans un groupe, ton rôle ?", choix: ["🗺️ J'organise", "😂 Je fais rire", "👂 J'écoute", "🍕 Je m'occupe du repas"] },
  { cle: "souvenir", q: "Un souvenir d'enfance qui te fait sourire ?" },
  { cle: "apprendre", q: "Si tu avais un mois de libre, tu apprendrais…" },
  { cle: "cadeau", q: "Tu préfères recevoir…", choix: ["💌 Une lettre", "🎁 Un cadeau surprise", "⏳ Du temps ensemble"] },
  { cle: "mot", q: "Ton mot préféré ?" },
  { cle: "agace", q: "Ce qui t'agace (gentiment) ?" },
  { cle: "saison", q: "Ta saison ?", choix: ["🌸 Le printemps", "☀️ L'été", "🍂 L'automne", "❄️ L'hiver"] },
  { cle: "oeuvre", q: "Un film ou un livre qui t'a marqué ?" },
  { cle: "rituel", q: "Ton petit rituel du matin ?" },
  { cle: "fier", q: "Ce dont tu es fier cette semaine ?" },
  { cle: "meteo", q: "Si ta journée était une météo ?", choix: ["☀️ Grand soleil", "⛅ Des éclaircies", "🌧️ Petite pluie", "⛈️ Un orage"] },
  { cle: "fete", q: "Dans une fête, on te trouve…", choix: ["💃 Sur la piste", "🍰 Près du buffet", "🛋️ Dans un coin à refaire le monde", "🚪 Déjà parti"] },
  { cle: "audace", q: "La dernière fois que tu as osé quelque chose ?" },
  { cle: "ideal", q: "Ton repas idéal entre amis ?" },
  { cle: "voyage", q: "Un endroit où tu rêves d'aller ?" },
  { cle: "lent", q: "Tu prends ton temps ou tu fonces ?", choix: ["🐢 Je prends mon temps", "🚀 Je fonce", "🎢 Les deux, selon l'humeur"] },
  { cle: "enfant", q: "Enfant, tu voulais devenir…" },
  { cle: "collection", q: "Tu collectionnes quelque chose ?" },
];

export const REPONSE_JOUR_MAX = 120;
/** La question du jour : au hasard du jour et de la personne, jamais une à laquelle il a déjà répondu (puis on recommence). */
export function questionDuJour(habitantId: string, jour: string, dejaRepondues: readonly string[]): QuestionDuJour {
  const restantes = QUESTIONS_DU_JOUR.filter((q) => !dejaRepondues.includes(q.cle));
  const liste = restantes.length ? restantes : QUESTIONS_DU_JOUR;
  let h = 2166136261;
  for (const c of `${habitantId}|${jour}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return liste[(h >>> 0) % liste.length];
}
export const questionDe = (cle: unknown) => QUESTIONS_DU_JOUR.find((q) => q.cle === cle) ?? null;

/** Ce que la page reçoit pour la question du jour : la question, et sa réponse s'il l'a déjà donnée aujourd'hui. */
export type QuestionVue = QuestionDuJour & { reponse?: string };

/** 🧠 « Ce que ta figurine sait de toi » : chaque chose, avec de quoi l'effacer (`le` : son heure, sa clé). */
export type ChoseSue = { le: string; type: "question" | "reponse" | "verdict" | "revele"; titre: string; texte: string };
export type Savoir = {
  /** Sa carte de personnage, en mots (ses réponses, ses goûts, sa phrase fétiche) ; `null` : pas encore faite. */
  carte: { reponses: string[]; gouts: string[]; phrase: string } | null;
  /** Le reste, les plus récentes d'abord. */
  choses: ChoseSue[];
};

/** Son adresse, à moitié cachée (« l•••@gmail.com »), pour lui dire où part son code sans l'afficher en entier. */
export function adresseMasquee(email: string): string {
  const [nom, domaine] = String(email).split("@");
  if (!nom || !domaine) return "";
  return `${nom.charAt(0)}•••@${domaine}`;
}
