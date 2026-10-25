/**
 * 💬 LE MOTEUR DE MESSAGES — le carnet de messages, devenu des modèles.
 *
 * C'est l'étape 4 des cages (`docs/les-cages.md`). Le carnet de messages du
 * fantôme (trente messages, cinq règles, les interdits) a été écrit pour un
 * restaurant ; ici, il devient une règle pour tous les métiers : selon la cage
 * qu'elle a libérée, le moment, et ce qu'on sait d'elle (ce qu'elle a répondu,
 * ses visites), Mike propose UN message — ou se tait, et dit pourquoi.
 *
 * LE COMMERÇANT VALIDE TOUJOURS. Mike prépare, il relit, il dit oui. Le message
 * arrive dans Ma Maison (« Mes messages »), avec une ou deux réponses à toucher :
 * on veut une conversation, pas une diffusion. Les invitations datées (« il reste
 * deux places ce soir ») ne passent pas par ici : elles partent de son WhatsApp
 * (« Oui, préviens-les », `previens-les.ts`).
 *
 * LES CINQ RÈGLES :
 *   1. Il part de son geste : la cage dit où elle en est. « Aujourd'hui » : rien à
 *      vendre avant sa visite (elle a son WhatsApp) ; après, on la remercie.
 *   2. Il se souvient : sa réponse revient dans le message suivant.
 *   3. Il varie : jamais deux fois le même modèle. Pas d'offre ici (le petit plus,
 *      c'est le commerçant qui le choisit, dans « Oui, préviens-les », un sur cinq).
 *   4. Il dit ce qui est vrai : rien d'inventé sur la carte, les places ou les plats.
 *   5. Il sait se taire : deux messages par semaine au plus, pas deux le même jour,
 *      jamais deux d'affilée sans réponse dans la semaine ; après deux sans réponse,
 *      la porte ouverte ; après trois, le silence jusqu'à son prochain fantôme.
 *      Un stop est définitif.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { FamilleDouble } from "./double-metiers";
import { REPONDU_WHATSAPP, type LigneCarnet, type MessageEnvoye } from "./carnet";
import { peutLuiEcrire, sorteDe } from "./previens-les";

export const MODELES = ["merci", "un-jour-quand", "memoire", "invite-douce", "un-mois", "rate", "merci-visite", "habitue", "porte-ouverte"] as const;
export type Modele = (typeof MODELES)[number];
export const estModele = (v: unknown): v is Modele => typeof v === "string" && (MODELES as readonly string[]).includes(v);

export type Proposition = { modele: Modele; texte: string; choix: string[] };
export type Silence = { silence: string };

const JOUR = 86_400_000;
const t = (iso: string) => Date.parse(iso) || 0;

/** Plutôt l'un ou l'autre : la question facile du premier message, selon le métier, et ses deux réponses. */
const GOUTS: Record<FamilleDouble, [string, string, string, string]> = {
  table: ["viande", "poisson", "Viande", "Poisson"],
  bar: ["en terrasse", "au comptoir", "En terrasse", "Au comptoir"],
  coiffure: ["cheveux courts", "cheveux longs", "Courts", "Longs"],
  ongles: ["couleurs vives", "tons nude", "Vives", "Nude"],
  seance: ["détente", "énergie", "Détente", "Énergie"],
  fleurs: ["bouquets champêtres", "fleurs exotiques", "Champêtres", "Exotiques"],
  mode: ["pièces classiques", "pièces originales", "Classiques", "Originales"],
  createur: ["un plaisir pour soi", "un cadeau à offrir", "Pour moi", "Pour offrir"],
  lunettes: ["lunettes de vue", "lunettes de soleil", "De vue", "De soleil"],
  librairie: ["romans", "BD", "Romans", "BD"],
};
const Cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « dès qu'une table se libère » : ce que le commerçant lui annoncera. */
function quandSigne(famille: FamilleDouble): string {
  const s = sorteDe(famille);
  if (s === "table") return "dès qu’une table se libère";
  if (s === "creneau") return "dès qu’un créneau se libère";
  return "quand il y a du nouveau";
}

/** Le texte d'un modèle. `qui` : le prénom que le fantôme donne au commerçant (« Margot »), sinon « toute l'équipe ». */
function texteDu(
  modele: Modele,
  o: { prenom: string; qui: string; famille: FamilleDouble; tu: boolean; films: number; reponse: string; apres: string },
): Proposition {
  const p = o.prenom.trim();
  const qui = o.qui.trim() || "toute l’équipe";
  const sorte = sorteDe(o.famille);
  const [a, b, ca, cb] = GOUTS[o.famille] ?? ["en semaine", "le week-end", "En semaine", "Le week-end"];
  const tu = o.tu;
  switch (modele) {
    case "merci":
      return {
        modele,
        texte: tu
          ? `Merci${p ? ` ${p}` : ""} ! ${Cap(qui)} a vu passer ton fantôme : ça fait plaisir. Toi, plutôt ${a} ou ${b} ?`
          : `Merci${p ? ` ${p}` : ""} ! ${Cap(qui)} a vu passer votre fantôme : ça fait plaisir. Et vous, plutôt ${a} ou ${b} ?`,
        choix: [ca, cb],
      };
    case "un-jour-quand":
      return {
        modele,
        texte: tu
          ? `Merci${p ? ` ${p}` : ""} ! Tu nous as promis de venir un jour 😊 Je te fais signe ${quandSigne(o.famille)}. Plutôt en semaine ou le week-end ?`
          : `Merci${p ? ` ${p}` : ""} ! Vous nous avez promis de venir un jour 😊 Je vous fais signe ${quandSigne(o.famille)}. Plutôt en semaine ou le week-end ?`,
        choix: ["En semaine", "Le week-end"],
      };
    case "memoire": {
      const r = o.reponse.toLowerCase();
      return o.apres === "un-jour-quand"
        ? {
            modele,
            texte: tu
              ? `Noté : ${r} ! Je te fais signe ${quandSigne(o.famille)}. D’ici là, tu veux voir nos prochaines vidéos ?`
              : `Noté : ${r} ! Je vous fais signe ${quandSigne(o.famille)}. D’ici là, vous voulez voir nos prochaines vidéos ?`,
            choix: ["Oui !", "Pas besoin"],
          }
        : {
            modele,
            texte: tu
              ? `Noté : ${r} ! Je le dis à ${qui}. Je te fais signe quand il y a du nouveau de ce côté-là ?`
              : `Noté : ${r} ! Je le dis à ${qui}. Je vous fais signe quand il y a du nouveau de ce côté-là ?`,
            choix: ["Oui !", "Pas besoin"],
          };
    }
    case "invite-douce":
      return {
        modele,
        texte: tu
          ? `${o.films} de nos vidéos que tu aimes : tu vas connaître la maison mieux que nous ! Tu viendrais voir l’envers du décor un de ces jours ?`
          : `${o.films} de nos vidéos que vous aimez : vous allez connaître la maison mieux que nous ! Vous viendriez voir l’envers du décor un de ces jours ?`,
        choix: ["Avec plaisir", "Peut-être"],
      };
    case "un-mois":
      return sorte === "table"
        ? {
            modele,
            texte: tu
              ? "Ça fait un mois que ton fantôme est sorti de sa cage, il s’impatiente ! Plutôt un midi rapide ou un vrai dîner ?"
              : "Ça fait un mois que votre fantôme est sorti de sa cage, il s’impatiente ! Plutôt un midi rapide ou un vrai dîner ?",
            choix: ["Un midi", "Un dîner"],
          }
        : {
            modele,
            texte: tu
              ? "Ça fait un mois que ton fantôme est sorti de sa cage, il s’impatiente ! Plutôt cette semaine ou la prochaine ?"
              : "Ça fait un mois que votre fantôme est sorti de sa cage, il s’impatiente ! Plutôt cette semaine ou la prochaine ?",
            choix: ["Cette semaine", "La prochaine"],
          };
    case "rate": {
      const place = sorte === "table" ? "une place" : sorte === "creneau" ? "un créneau" : "";
      return {
        modele,
        texte: place
          ? tu
            ? `Pas de souci si tu n’as pas pu venir l’autre jour. Je te garde ${place} une prochaine fois ?`
            : `Pas de souci si vous n’avez pas pu venir l’autre jour. Je vous garde ${place} une prochaine fois ?`
          : tu
            ? "Pas de souci si tu n’as pas pu passer l’autre jour. On se voit une prochaine fois ?"
            : "Pas de souci si vous n’avez pas pu passer l’autre jour. On se voit une prochaine fois ?",
        choix: ["Oui, bientôt", "Plus tard"],
      };
    }
    case "merci-visite":
      return {
        modele,
        texte: tu ? `Merci pour ta visite${p ? `, ${p}` : ""} ! Alors, verdict ?` : `Merci pour votre visite${p ? `, ${p}` : ""} ! Alors, verdict ?`,
        choix: ["J’ai adoré", "Pas mal"],
      };
    case "habitue": {
      const place = sorte === "passage" ? "des bons moments pour passer" : "quand il y a de la place";
      return {
        modele,
        texte: tu
          ? `Troisième visite : tu fais partie de la maison ! Tu préfères que je te prévienne des nouveautés, ou seulement ${place} ?`
          : `Troisième visite : vous faites partie de la maison ! Vous préférez que je vous prévienne des nouveautés, ou seulement ${place} ?`,
        choix: ["Les nouveautés", sorte === "passage" ? "Les bons moments" : "Seulement la place"],
      };
    }
    case "porte-ouverte":
      return {
        modele,
        texte: tu
          ? `Je ne t’embête pas plus${p ? `, ${p}` : ""}. Si un jour l’envie te prend, touche « J’ai envie » ici, et ${qui} s’occupe du reste.`
          : `Je ne vous embête pas plus${p ? `, ${p}` : ""}. Si un jour l’envie vous prend, touchez « J’ai envie » ici, et ${qui} s’occupe du reste.`,
        choix: ["J’ai envie"],
      };
  }
}

/** Les messages restés sans réponse, d'affilée, depuis son dernier fantôme (une nouvelle cage remet à zéro). */
export function sansReponse(l: Pick<LigneCarnet, "le" | "messages">): number {
  let n = 0;
  for (const m of l.messages) {
    if (t(m.le) <= t(l.le)) break;
    if (m.reponse) break;
    n += 1;
  }
  return n;
}

/**
 * MIKE SE TAIT-IL ? Les règles qui valent pour tout message (Ma Maison comme WhatsApp
 * passent par le même compte) — le serveur les revérifie avec cette même fonction.
 */
export function silenceDe(l: Pick<LigneCarnet, "le" | "messages" | "stop">, maintenant = Date.now()): string {
  if (l.stop) return "A dit stop : plus rien, jamais.";
  const r = peutLuiEcrire(l.messages, maintenant);
  if (!r.oui) return `${r.pourquoi}.`;
  const muets = sansReponse(l);
  if (muets >= 3) return "Trois messages sans réponse : Mike se tait jusqu’à son prochain fantôme.";
  const dernier = l.messages[0];
  if (muets >= 1 && dernier && maintenant - t(dernier.le) < 7 * JOUR) return "Pas de réponse à son dernier message : Mike attend la semaine prochaine.";
  return "";
}

const jourDe = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

/** LE PROCHAIN MESSAGE de Mike pour cette personne, ou pourquoi il se tait. */
export function prochainMessage(o: {
  ligne: LigneCarnet;
  commerce: { famille: FamilleDouble; prenom: string };
  tu: boolean;
  maintenant?: number;
}): Proposition | Silence {
  const l = o.ligne;
  const maintenant = o.maintenant ?? Date.now();
  const tais = silenceDe(l, maintenant);
  if (tais) return { silence: tais };
  const envoyes = new Set(l.messages.map((m) => m.modele).filter(Boolean));
  const dernier: MessageEnvoye | undefined = l.messages[0];
  const base = { prenom: l.prenom, qui: o.commerce.prenom, famille: o.commerce.famille, tu: o.tu, films: l.films, reponse: "", apres: "" };
  const un = (m: Modele, plus: Partial<typeof base> = {}) => {
    const x = texteDu(m, { ...base, ...plus });
    return { ...x, texte: x.texte.replace(/[ \u00a0\u202f]?([?!:])/g, "\u00a0$1") };
  };

  // Deux messages sans réponse : la porte ouverte, une fois.
  if (sansReponse(l) === 2) return envoyes.has("porte-ouverte") ? { silence: "Porte ouverte déjà laissée : Mike attend." } : un("porte-ouverte");

  // Après une visite : on la remercie (une fois), puis à la troisième, on lui laisse choisir le rythme.
  if (l.passages > 0 && l.dernierPassage) {
    const vueApres = !dernier || l.dernierPassage >= jourDe(t(dernier.le));
    if (vueApres && !envoyes.has("merci-visite")) return un("merci-visite");
    if (l.passages >= 3 && !envoyes.has("habitue")) return un("habitue");
  }
  // « Aujourd'hui » : rien à vendre avant sa visite ; si elle n'est pas venue, une porte, sans reproche.
  if (l.cage === "aujourdhui" && l.passages === 0) {
    if (maintenant - t(l.le) >= 2 * JOUR && !envoyes.has("rate")) return un("rate");
    return { silence: "C’est décidé : rien à ajouter avant sa visite." };
  }
  // Le premier message dans Ma Maison : merci, et une question facile.
  const premier = l.cage === "un-jour" ? "un-jour-quand" : "merci";
  if (!envoyes.has("merci") && !envoyes.has("un-jour-quand")) return un(premier);
  // Il se souvient : sa réponse revient.
  const repondu = l.messages.find((m) => (m.modele === "merci" || m.modele === "un-jour-quand") && m.reponse && m.reponse !== REPONDU_WHATSAPP);
  if (repondu && !envoyes.has("memoire")) return un("memoire", { reponse: repondu.reponse ?? "", apres: repondu.modele ?? "" });
  // Trois de ses vidéos aimées, pas encore venue : l'invitation douce — après trois gestes d'elle, pas avant.
  if (l.cage === "adore" && l.films >= 3 && l.passages === 0 && !envoyes.has("invite-douce")) return un("invite-douce");
  // Un mois après « un jour », une seule fois.
  if (l.cage === "un-jour" && l.passages === 0 && maintenant - t(l.le) >= 30 * JOUR && !envoyes.has("un-mois")) return un("un-mois");
  return { silence: "Rien de neuf à lui dire : Mike attend ta prochaine vidéo, ou sa visite." };
}
