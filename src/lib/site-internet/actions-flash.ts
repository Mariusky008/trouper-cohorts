// Actions Flash — le commerçant ne part jamais d'une page blanche.
//
// RÈGLE NON NÉGOCIABLE DE CE FICHIER : une Action Flash est une QUESTION, jamais
// une phrase pré-écrite. Proposer « Une place s'est libérée à 15 h » en un geste,
// c'est faire annoncer à un commerçant un fait que personne n'a vérifié — à ses
// vrais clients, en son nom. Toute information qui engage le commerce (heure,
// remise, quantité, prestation) est SAISIE par lui. Jamais suggérée, jamais
// pré-remplie avec une valeur plausible.
//
// Le partage du travail :
//   - ce fichier décide QUOI demander → déterministe, lisible, testable ;
//   - l'assistante (api/site-internet/pro/announce) décide COMMENT l'écrire.
// On ne laisse pas un modèle choisir les faits, et on ne laisse pas un gabarit
// figé choisir le ton.
//
// Corollaire volontaire : aucune valeur par défaut sur les champs chiffrés.
// Suggérer « -20 % », c'est décider de la marge du commerçant à sa place.
import type { Confirmation, Secteur } from "./metier-profiles";
import { estRestauration } from "@/lib/direct/mots-metier";

const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export type ChampType = "heure" | "nombre" | "pourcent" | "texte" | "jour";

export type Champ = {
  cle: string;
  /** La question posée, à la deuxième personne. */
  label: string;
  type: ChampType;
  /** Exemple montré en filigrane — jamais une valeur pré-remplie. */
  exemple?: string;
  requis: boolean;
};

export type Intention = {
  cle: string;
  emoji: string;
  /** Toujours interrogatif : le commerçant confirme, il ne se voit pas imposer un fait. */
  titre: string;
  /**
   * Le même objectif, à l'impératif — pour l'écran de choix.
   *
   * « Un créneau s'est libéré ? » est la bonne formulation quand on demande au
   * commerçant de confirmer un fait (espace pro, écran de saisie). Sur un menu
   * de départ, une liste de questions transforme le geste en questionnaire :
   * il ne répond pas, il déclenche. D'où « Remplir un créneau ».
   */
  action: string;
  sous: string;
  champs: Champ[];
  /**
   * L'annonce construite — uniquement à partir de ce que le pro a saisi.
   *
   * Elle sert deux fois : de brief factuel à l'assistante (espace pro, qui la
   * réécrit), et telle quelle dans la démonstration. Elle doit donc s'adresser
   * AUX CLIENTS, pas à l'assistante : « Je vous le réserve ? » et non « Les
   * client·es peuvent me répondre pour le réserver », qui se lit comme une
   * consigne et non comme une annonce.
   *
   * Et COURTE : elle doit tenir dans un bandeau à côté d'un bouton, sur un
   * téléphone. Une phrase de plus et le texte se compresse en une colonne de
   * trois mots de large.
   */
  brief: (v: Record<string, string>) => string;
  /** Moment où l'annonce doit disparaître d'elle-même (null = pas d'échéance connue). */
  fin: (v: Record<string, string>, now: Date) => Date | null;
  /**
   * Des réponses toutes faites, pour la DÉMONSTRATION uniquement.
   *
   * Dans l'espace pro on POSE les questions — le commerçant est seul à connaître
   * ses horaires. Dans la démo, un prospect qui découvre le produit ne doit rien
   * saisir : il clique une fois et voit le résultat. Même moteur, même annonce
   * finale ; seule la provenance des réponses change.
   */
  demo: (now: Date) => Record<string, string>;
  /**
   * Le scénario injecté, dit en clair SUR la carte de choix.
   *
   * Sans lui, l'écran suivant annonce « demain à 16 h » et le commerçant croit
   * que l'assistante a deviné son planning — ce qu'elle ne fait pas et ne fera
   * jamais. En vrai usage elle POSE la question ; ici on affiche d'avance le
   * scénario de démonstration, pour que le clic sélectionne un exemple assumé.
   */
  exempleDemo: string;
  /**
   * Ce que l'annonce peut faire pour le commerce, une fois diffusée.
   *
   * Toujours au conditionnel : on décrit l'endroit où l'annonce paraît et ce
   * qu'un habitant peut en faire, jamais un résultat que personne n'a mesuré.
   */
  promesse: string;
  /**
   * Le bouton proposé au CLIENT sous l'annonce.
   *
   * Il n'ouvre pas un système de réservation extérieur — il ouvre l'assistante,
   * avec l'annonce déjà en contexte : elle demande le prénom et le numéro, et
   * transmet la demande. La destination est donc interne, et le commerçant la
   * retrouvera réellement chez lui.
   */
  cta: string;
};

/* ─────────────────────────── Dates et horaires ─────────────────────────── */

/** `YYYY-MM-DD` en heure LOCALE (toISOString décalerait d'un jour le soir). */
export function jourISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Les 7 prochains jours, pour un menu déroulant : aujourd'hui, demain, puis nommés. */
export function joursProches(now: Date, n = 7): Array<{ valeur: string; label: string }> {
  const out: Array<{ valeur: string; label: string }> = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    out.push({ valeur: jourISO(d), label: libelleJour(jourISO(d), now) });
  }
  return out;
}

/** « aujourd'hui » / « demain » / « samedi 9 » — ce qu'un humain dirait. */
export function libelleJour(iso: string, now: Date): string {
  if (!iso) return "";
  const d = decoupeJour(iso);
  if (!d) return "";
  const zero = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((zero(d) - zero(now)) / 86400000);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric" }).format(d);
}

function decoupeJour(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * « 11:11 » → « 11 h 11 », « 18:00 » → « 18 h ».
 *
 * Le champ `<input type="time">` rend toujours `HH:MM`. Passé tel quel dans le
 * brief, le commerçant recevait une annonce qui disait « à 11:11 » — une notation
 * d'horloge d'ordinateur, que personne n'écrit dans un message à ses clients.
 */
export function heureLisible(hhmm: string): string {
  const t = decoupeHeure(hhmm);
  if (!t) return String(hhmm ?? "").trim();
  return `${t.h} h${t.mn ? ` ${String(t.mn).padStart(2, "0")}` : ""}`;
}

function decoupeHeure(hhmm: string): { h: number; mn: number } | null {
  const m = /^(\d{1,2})[:h](\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mn = Number(m[2]);
  return h > 23 || mn > 59 ? null : { h, mn };
}

/**
 * Le moment exact où une annonce s'arrête. C'est la pièce qui rend honnête une
 * offre « de 16 h à 18 h » : à 18 h elle disparaît du site ET du catalogue,
 * sans que le commerçant ait à y penser.
 *
 * Sans jour donné, une heure déjà passée désigne demain — dire « jusqu'à 9 h »
 * à 14 h ne peut vouloir dire que le lendemain matin.
 */
export function moment(now: Date, hhmm: string, iso?: string): Date | null {
  const t = decoupeHeure(hhmm);
  if (!t) return null;
  const base = iso ? decoupeJour(iso) : null;
  if (iso && !base) return null;
  const d = base ? new Date(base) : new Date(now);
  d.setHours(t.h, t.mn, 0, 0);
  if (!base && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime() <= now.getTime() ? null : d;
}

/** Fin du jour désigné (23 h 59) — pour ce qui vaut « toute la journée ». */
export function finDeJour(now: Date, iso?: string): Date | null {
  const base = iso ? decoupeJour(iso) : new Date(now);
  if (!base) return null;
  const d = new Date(base);
  d.setHours(23, 59, 0, 0);
  return d.getTime() <= now.getTime() ? null : d;
}

const dansNJours = (now: Date, n: number): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
};

/* ─────────────────────────── Vocabulaire du métier ─────────────────────── */

export type Vocab = {
  /** Ce qui se libère chez ce commerce : un créneau, une table, une place… */
  place: string;
  places: string;
  /**
   * L'article de `place` — « un créneau », mais « une table ».
   *
   * Sans lui, l'annonce d'un restaurant disait « Un table vient de se libérer »
   * et « Je vous en réserve un ? ». Le genre du mot ne se devine pas depuis le
   * mot : il se range à côté de lui.
   */
  un: "un" | "une";
  /** Où l'on vient : « au salon », « en boutique »… */
  lieu: string;
  /** Le métier travaille sur rendez-vous → les intentions « créneau » ont un sens. */
  surRdv: boolean;
  /** Commerce de passage → « arrivage du jour » a un sens, « créneau » non. */
  boutique: boolean;
};

export function vocabulaire(metier: string, confirmation: Confirmation, secteur: Secteur): Vocab {
  const m = sansAccents(metier);
  const est = (r: RegExp) => r.test(m);

  if (est(/restaurant|brasserie|pizzeria|creperie|bistrot|bar\b|cantine|burger|sushi/))
    return { place: "table", places: "tables", un: "une", lieu: "en salle", surRdv: true, boutique: false };

  if (est(/cours|yoga|pilates|danse|salle de sport|fitness|escalade|poterie|atelier/))
    return { place: "place", places: "places", un: "une", lieu: "à l'atelier", surRdv: true, boutique: false };

  if (est(/coiffeur|coiffure|barbier|esthetic|ongul|onglerie|institut|spa|massage|beaute|bronzage|tatou/))
    return { place: "créneau", places: "créneaux", un: "un", lieu: "au salon", surRdv: true, boutique: false };

  if (est(/boulangerie|patisserie|boucherie|charcuterie|poissonnerie|fromagerie|primeur|epicerie|caviste|chocolat|glacier|traiteur/))
    return { place: "commande", places: "commandes", un: "une", lieu: "en boutique", surRdv: false, boutique: true };

  if (est(/fleuriste|librairie|boutique|magasin|concept store|decoration|bijou|vetement|pret-a-porter|friperie/))
    return { place: "commande", places: "commandes", un: "une", lieu: "en boutique", surRdv: false, boutique: true };

  // Défaut : on se fie au modèle métier plutôt qu'à un mot-clé qu'on n'a pas prévu.
  const rdv = confirmation === "reserve" || confirmation === "rappel";
  return {
    place: rdv ? "créneau" : "rendez-vous",
    places: rdv ? "créneaux" : "rendez-vous",
    un: "un",
    lieu: secteur === "soin" ? "au cabinet" : "sur place",
    surRdv: rdv,
    boutique: false,
  };
}

/* ──────────────────────────── Les intentions ───────────────────────────── */

/**
 * Les grandes intentions, déclinées dans le vocabulaire du métier. On n'écrit
 * pas dix annonces pour cinq cents métiers : on écrit dix questions, et le
 * métier choisit lesquelles ont un sens.
 */
export function intentionsPour(metier: string, confirmation: Confirmation, secteur: Secteur): Intention[] {
  const v = vocabulaire(metier, confirmation, secteur);
  const j = (x: Record<string, string>, now: Date) => libelleJour(x.jour, now);
  const liste: Intention[] = [];

  // ── 🍽️ LA CARTE DU JOUR — en tête, et seulement là où elle a un sens ─────
  //
  // C'est le geste le plus fréquent d'un restaurateur, et il n'existait pas.
  // Il pouvait annoncer une table libre, une offre, un événement — mais pas
  // simplement montrer ce qu'on mange aujourd'hui. Or c'est ce que l'habitant
  // cherche à 11 h : pas une promotion, la carte.
  //
  // ELLE NE PROPOSE RIEN À RÉSERVER, et c'est pour ça qu'elle est traitée à
  // part dans l'écran : ni questions, ni prix, ni façons d'en profiter. On
  // photographie l'ardoise, ou on l'écrit, et c'est fini. Chaque question de
  // plus serait une raison de ne pas le faire demain.
  //
  // Sa famille est « menu » : c'est elle qui la fait apparaître dans l'onglet
  // « Déjeuner » de la ville, à côté des cartes des autres restaurants.
  if (estRestauration(metier)) {
    liste.push({
      cle: "carte",
      exempleDemo: "la photo de l'ardoise",
      promesse: "Vos plats du jour paraissent dans « Déjeuner », à côté de ceux des autres restaurants.",
      emoji: "🍽️",
      action: "Montrer ma carte du jour",
      titre: "Votre carte du jour ?",
      sous: "Photographiez votre ardoise, ou écrivez-la. Rien d'autre.",
      // Aucun champ : l'écran affiche son propre panneau, court, avec la photo.
      champs: [],
      brief: (x) => String(x.texte ?? "").trim() || "Voici notre carte du jour.",
      // Elle vaut la journée et s'efface le soir : une carte du jour d'hier est
      // pire qu'aucune carte.
      fin: (_x, now) => finDeJour(now),
      demo: () => ({ texte: "Aujourd'hui : garbure landaise, magret sauce poivre, tourtière." }),
      cta: "Réserver une table",
    });
  }

  // ── 🥘 « IL M'EN RESTE 8 » ───────────────────────────────────────────────
  //
  // Le geste le plus rentable du produit, et le plus facile à faire adopter :
  // à 14 h il reste huit lasagnes, et dans deux heures elles vont à la
  // poubelle. Le commerçant n'a pas besoin d'être convaincu — il compte
  // 72 € qu'il jetait.
  //
  // ET C'EST LA SEULE FONCTION QUI MARCHE À UN COMMERÇANT ET UN CLIENT. Elle
  // ne demande ni volume, ni habitude, ni réseau : elle vaut le premier jour.
  //
  // POUR QUI : la restauration, et les commerces de passage. Un coiffeur n'a
  // pas de portions — il a des créneaux, et il a déjà l'intention qui va avec.
  if (estRestauration(metier) || v.boutique) {
    liste.push({
      cle: "reste",
      exempleDemo: "ce qu'il vous reste",
      promesse: "Ce qu'il vous reste part maintenant, au lieu d'être jeté.",
      emoji: "🥘",
      action: "Il m'en reste",
      titre: "Il vous en reste ?",
      sous: "Dites combien, et à quel prix. Les habitants autour de vous le voient tout de suite.",
      // Aucun champ ici : l'écran affiche son propre panneau, court. Passer par
      // les trois étapes « Quoi → Où → Publier » pour dire « il me reste 8
      // lasagnes » reviendrait à ne jamais le lui faire faire.
      champs: [],
      brief: (x) => {
        const combien = String(x.combien ?? "").trim();
        const quoi = String(x.quoi ?? "").trim();
        return combien && quoi ? `Il me reste ${combien} ${quoi}.` : "Il m'en reste quelques-unes.";
      },
      // FIN DE JOURNÉE PAR DÉFAUT. Ce qui reste aujourd'hui ne reste pas demain,
      // et une annonce d'invendus qui survit à la nuit est un mensonge au
      // réveil. Le commerçant peut raccourcir depuis l'écran.
      fin: (_x, now) => finDeJour(now),
      demo: () => ({ combien: "8", quoi: "lasagnes maison" }),
      cta: "J'en prends une",
    });
  }

  // ── 🕐 CE QUI EST LIBRE ─────────────────────────────────────────────────
  //
  // DEUX ACTIONS N'EN FONT PLUS QU'UNE. Il y en avait deux — « un créneau s'est
  // libéré ? » et « il vous reste des créneaux ? » — et elles posaient les
  // MÊMES questions à un champ près : le nombre. Chez un restaurant elles
  // devenaient carrément indiscernables : « une table s'est libérée ? » puis
  // « il vous reste des tables ? », l'une sous l'autre dans la même liste.
  //
  // Devant deux portes qui mènent au même endroit, on n'en choisit aucune : on
  // se demande laquelle est la bonne, et on referme. Une seule porte, et le
  // nombre devient ce qu'il aurait toujours dû être — un champ facultatif qui
  // vaut 1 quand on ne le remplit pas.
  if (v.surRdv) {
    liste.push({
      cle: "creneau",
      exempleDemo: "demain à 16 h",
      promesse: `Vos ${v.places} peuvent maintenant trouver leurs clients.`,
      emoji: "🕐",
      action: `Remplir ${v.un} ${v.place}`,
      titre: `Des ${v.places} de libres ?`,
      sous: "Dites quand — et combien, s'il y en a plusieurs.",
      champs: [
        // FACULTATIF, ET C'EST LA FUSION. Vide = une seule place, le cas le
        // plus fréquent : un désistement. Rempli = ce qu'il reste sur une
        // plage préparée à l'avance. Un seul parcours pour les deux.
        { cle: "combien", label: `Combien de ${v.places} ?`, type: "nombre", requis: false },
        { cle: "jour", label: "Quel jour ?", type: "jour", requis: true },
        { cle: "heure", label: "À partir de quelle heure ?", type: "heure", requis: true },
        // FACULTATIF, et c'est le point : une place peut se libérer à 16 h
        // précises, ou pour tout un après-midi. Rendre la fin obligatoire
        // forcerait à inventer une heure pour le premier cas ; l'omettre
        // interdisait d'annoncer le second.
        { cle: "fin", label: "Jusqu'à quelle heure ?", type: "heure", requis: false },
        { cle: "quoi", label: "Pour quelle prestation ?", type: "texte", exemple: "une couleur", requis: false },
      ],
      // UNE SEULE PHRASE POUR LES DEUX CAS. Sans nombre — le désistement — on
      // dit « un créneau vient de se libérer » ; avec, on dit ce qu'il reste.
      // C'est le même geste, et l'habitant lit dans les deux cas quelque chose
      // de saisissable : un moment, et une place.
      brief: (x) => {
        const n = Math.round(Number(String(x.combien ?? "").replace(",", ".")));
        const quand =
          `${libelleJour(x.jour, new Date())} ` +
          `${x.fin ? `de ${heureLisible(x.heure)} à ${heureLisible(x.fin)}` : `à ${heureLisible(x.heure)}`}`;
        const pour = x.quoi ? ` pour ${x.quoi}` : "";
        return Number.isFinite(n) && n > 1
          ? `Il me reste ${n} ${v.places} ${quand}${pour}. Je vous en réserve ${v.un} ?`
          : `${v.un === "une" ? "Une" : "Un"} ${v.place} vient de se libérer ${quand}${pour}. Je vous ${v.un === "une" ? "la" : "le"} réserve ?`;
      },
      // L'annonce tient jusqu'à la FIN de la plage quand elle est donnée :
      // retirer à 11 h une place ouverte jusqu'à 17 h la ferait disparaître
      // alors qu'elle est encore à prendre.
      fin: (x, now) => moment(now, x.fin || x.heure, x.jour),
      demo: (now) => ({ jour: jourISO(dansNJours(now, 1)), heure: "16:00", fin: "", quoi: "" }),
      cta: "Réserver",
    });

  }

  // ── ☕ UNE RAISON DE PASSER ─────────────────────────────────────────────
  //
  // DEUX ACTIONS N'EN FONT PLUS QU'UNE. « Faire venir du monde aujourd'hui ? »
  // et « Une offre sur quelques heures ? » posaient les mêmes questions — quoi,
  // de quelle heure à quelle heure — et menaient au même endroit du fil. La
  // seule différence était que la seconde exigeait un POURCENTAGE, ce qui la
  // rendait inutilisable pour « le café offert » et obligeait à choisir entre
  // deux portes avant de savoir laquelle acceptait ce qu'on avait à dire.
  //
  // La remise devient donc un champ FACULTATIF de la même action. « Le café
  // offert de 10 h à 12 h » et « -20 % sur tout le magasin de 16 h à 18 h »
  // sont la même chose vue du client : une raison de pousser la porte
  // aujourd'hui, qui s'arrête toute seule à l'heure dite.
  liste.push({
    cle: "venir",
    exempleDemo: "le café offert, de 10 h à 12 h",
    promesse: "Votre invitation peut maintenant faire venir du monde.",
    emoji: "☕",
    action: "Donner une raison de passer",
    titre: "Une raison de passer aujourd'hui ?",
    sous: "Elle disparaît toute seule à l'heure que vous fixez.",
    champs: [
      { cle: "quoi", label: "Qu'est-ce que vous proposez ?", type: "texte", exemple: "le café offert", requis: true },
      // FACULTATIVE, ET C'EST LA FUSION. Vide : c'est un geste (« le café
      // offert »). Remplie : c'est une remise. Aucune valeur suggérée — on ne
      // décide pas de la marge de quelqu'un à sa place.
      { cle: "combien", label: "Une remise ? (en %)", type: "pourcent", requis: false },
      { cle: "de", label: "À partir de quelle heure ?", type: "heure", requis: true },
      { cle: "a", label: "Jusqu'à quelle heure ?", type: "heure", requis: true },
    ],
    brief: (x) => {
      const quand = `aujourd'hui de ${heureLisible(x.de)} à ${heureLisible(x.a)}`;
      const remise = Math.round(Number(String(x.combien ?? "").replace(",", ".")));
      return Number.isFinite(remise) && remise > 0
        ? `Offre de -${remise} % sur ${x.quoi}, ${quand} uniquement.`
        : `${quand.charAt(0).toUpperCase()}${quand.slice(1)} : ${x.quoi}. Passez ${v.lieu}, on vous attend.`;
    },
    fin: (x, now) => moment(now, x.a),
    demo: () => ({ quoi: "le café offert", combien: "", de: "10:00", a: "12:00" }),
    cta: "Je passe",
  });

  // UNE SEULE ACTION « C'EST NOUVEAU ». En boutique, « une nouveauté à
  // montrer ? » et « un arrivage du jour à faire connaître ? » se suivaient
  // dans la liste et désignaient la même chose pour un boulanger ou un
  // primeur. L'arrivage est la version JUSTE dans ces métiers — il dit le
  // frais et le jour — donc il remplace la nouveauté au lieu de s'y ajouter.
  if (!v.boutique) liste.push({
    cle: "nouveaute",
    exempleDemo: "une nouvelle collection",
    promesse: "Votre nouveauté peut maintenant se faire connaître.",
    emoji: "✨",
    action: "Montrer une nouveauté",
    titre: "Une nouveauté à montrer ?",
    sous: "Ce qui vient d'arriver et que personne ne sait encore.",
    champs: [
      { cle: "quoi", label: "Qu'est-ce qui est nouveau ?", type: "texte", exemple: "une nouvelle collection", requis: true },
      { cle: "des", label: "Disponible à partir de quand ?", type: "jour", requis: false },
    ],
    brief: (x) =>
      `Nouveauté ${v.lieu} : ${x.quoi}.` + (x.des ? ` Disponible à partir de ${libelleJour(x.des, new Date())}.` : ""),
    fin: (_x, now) => dansNJours(now, 7),
    demo: () => ({ quoi: "notre nouvelle collection", des: "" }),
    cta: "En savoir plus",
  });

  if (v.boutique) {
    liste.push({
      cle: "arrivage",
      exempleDemo: "un arrivage tout frais de ce matin",
      promesse: "Votre arrivage peut maintenant trouver preneur.",
      emoji: "🧺",
      action: "Annoncer l'arrivage du jour",
      titre: "Un arrivage du jour à faire connaître ?",
      sous: "Ce qui est frais ce matin et parti ce soir.",
      champs: [
        { cle: "quoi", label: "Qu'est-ce qui est arrivé ?", type: "texte", exemple: "des fraises de Dordogne", requis: true },
        { cle: "combien", label: "En quelle quantité ?", type: "texte", exemple: "une vingtaine de barquettes", requis: false },
      ],
      brief: (x) => `Arrivage du jour : ${x.quoi}${x.combien ? ` (${x.combien})` : ""}, disponible ${v.lieu}.`,
      fin: (_x, now) => finDeJour(now),
      demo: () => ({ quoi: "un arrivage tout frais de ce matin", combien: "" }),
      cta: "Je réserve",
    });
  }

  liste.push({
    cle: "realisation",
    exempleDemo: "une pièce dont vous êtes fier·e",
    promesse: "Votre travail peut maintenant trouver son prochain client.",
    emoji: "📸",
    action: "Montrer mon travail",
    titre: "Montrer ce que vous venez de faire ?",
    sous: "Votre travail d'aujourd'hui vaut mieux qu'un slogan.",
    champs: [{ cle: "quoi", label: "Qu'avez-vous réalisé ?", type: "texte", exemple: "une pose sur ongles courts", requis: true }],
    brief: (x) => `Je viens de terminer : ${x.quoi}. Envie du même résultat ? Écrivez-moi.`,
    fin: (_x, now) => dansNJours(now, 7),
    demo: () => ({ quoi: "une pièce dont je suis fier·e" }),
    cta: "Prendre rendez-vous",
  });

  liste.push({
    cle: "evenement",
    exempleDemo: "une journée portes ouvertes, dans trois jours",
    promesse: "Votre événement peut maintenant trouver son public.",
    emoji: "🎉",
    action: "Annoncer un événement",
    titre: "Un événement à annoncer ?",
    sous: "Une date que les gens doivent noter.",
    champs: [
      { cle: "quoi", label: "Quel événement ?", type: "texte", exemple: "une dégustation", requis: true },
      { cle: "jour", label: "Quel jour ?", type: "jour", requis: true },
      { cle: "heure", label: "À quelle heure ?", type: "heure", requis: false },
      { cle: "fin", label: "Jusqu'à quelle heure ?", type: "heure", requis: false },
    ],
    brief: (x) =>
      `J'organise ${x.quoi} ${j(x, new Date())}` +
      `${x.heure ? (x.fin ? ` de ${heureLisible(x.heure)} à ${heureLisible(x.fin)}` : ` à partir de ${heureLisible(x.heure)}`) : ""}` +
      `, ${v.lieu}.`,
    fin: (x, now) => finDeJour(now, x.jour),
    demo: (now) => ({ quoi: "une journée portes ouvertes", jour: jourISO(dansNJours(now, 3)), heure: "10:00", fin: "" }),
    cta: "Je participe",
  });

  liste.push({
    cle: "fideles",
    exempleDemo: "une attention à la prochaine visite",
    promesse: "Votre geste peut maintenant atteindre vos habitués.",
    emoji: "💚",
    action: "Gâter mes habitués",
    titre: "Un geste pour vos habitués ?",
    sous: "Ceux qui reviennent méritent de l'apprendre en premier.",
    champs: [
      { cle: "quoi", label: "Que leur proposez-vous ?", type: "texte", exemple: "un soin des mains offert", requis: true },
      { cle: "jusqua", label: "Jusqu'à quel jour ?", type: "jour", requis: false },
    ],
    brief: (x) =>
      `Pour mes client·es fidèles : ${x.quoi}` + (x.jusqua ? `, jusqu'à ${libelleJour(x.jusqua, new Date())}` : "") + ".",
    fin: (x, now) => (x.jusqua ? finDeJour(now, x.jusqua) : dansNJours(now, 7)),
    demo: () => ({ quoi: "une petite attention à la prochaine visite", jusqua: "" }),
    cta: "J'en profite",
  });

  liste.push({
    cle: "horaires",
    exempleDemo: "ouverture exceptionnelle ce dimanche matin",
    promesse: "Votre changement d'horaires peut maintenant éviter une porte close.",
    emoji: "🕰️",
    action: "Signaler un changement d'horaires",
    titre: "Un changement d'horaires ?",
    sous: "Éviter à quelqu'un de trouver porte close.",
    champs: [
      { cle: "quoi", label: "Qu'est-ce qui change ?", type: "texte", exemple: "fermé jeudi après-midi", requis: true },
      { cle: "jusqua", label: "Jusqu'à quel jour ?", type: "jour", requis: false },
    ],
    brief: (x) => `Changement d'horaires : ${x.quoi}${x.jusqua ? `, jusqu'à ${libelleJour(x.jusqua, new Date())}` : ""}.`,
    fin: (x, now) => (x.jusqua ? finDeJour(now, x.jusqua) : dansNJours(now, 7)),
    demo: () => ({ quoi: "ouverture exceptionnelle ce dimanche matin", jusqua: "" }),
    cta: "Poser une question",
  });

  return liste;
}

/* ────────────────────────── Ce qu'on montre d'abord ────────────────────── */

/**
 * Trois propositions, pas dix. Un écran de dix vignettes, c'est la page blanche
 * avec des étapes en plus — et la valeur promise ici est justement de ne pas
 * avoir à choisir. Le reste tient derrière « Une autre idée ».
 *
 * Le classement dépend de l'heure et du jour, parce qu'à 9 h du matin et à 16 h
 * on n'a pas le même problème.
 */
export function recommandees(liste: Intention[], now: Date, n = 3): Intention[] {
  const h = now.getHours();
  const jourSemaine = now.getDay(); // 0 = dimanche
  const veilleDeWeekend = jourSemaine === 4 || jourSemaine === 5;

  const score = (cle: string): number => {
    switch (cle) {
      // LA CARTE DU JOUR PASSE DEVANT TOUT, tant que la journée n'est pas
      // finie. C'est le geste quotidien d'un restaurateur — le seul qu'il
      // refera demain, et après-demain. Rangée derrière « Une autre idée »,
      // elle n'existe pas : il ne la cherchera pas, il publiera autre chose.
      // Après 15 h elle redescend : une carte du jour publiée à 17 h arrive
      // après le service, et le lendemain matin elle repasse en tête.
      // LA CARTE DU JOUR PASSE DEVANT TOUT, TOUTE LA JOURNÉE.
      //
      // Elle retombait à 30 après 15 h, et « il m'en reste » lui passait devant
      // avec 210 : un restaurateur qui ouvrait son espace à 16 h se voyait
      // proposer de brader ses invendus AVANT de publier sa carte. Or la carte
      // est son geste quotidien — le seul qu'il refera demain et après-demain —
      // et publier celle du lendemain la veille au soir est parfaitement
      // normal. Rangée en deuxième, elle n'existe pas : il ne la cherche pas.
      case "carte":
        return 300;
      // « IL M'EN RESTE » SUIT LE SERVICE, pas la matinée. On ne sait pas ce
      // qu'il reste avant d'avoir vendu : proposé à 9 h, ce geste n'a aucun
      // sens et occupe la place de la carte du jour. Il passe devant en fin de
      // service — 14 h pour le déjeuner, 18 h pour la journée d'une boutique —
      // c'est-à-dire au moment exact où le commerçant regarde son étal.
      case "reste":
        return h >= 13 && h < 20 ? 210 : 25;
      // « dispo » a fusionné dans « creneau » : plus de score à lui donner.
      // Un désistement se traite dans l'heure : prioritaire pendant qu'on travaille.
      case "creneau":
        return h >= 8 && h < 19 ? 100 : 40;
      // Le creux d'après-midi se comble le matin ou juste avant.
      case "venir":
        return h >= 9 && h < 16 ? 90 : 45;
      // Ce qui est arrivé le matin doit se dire le matin.
      case "arrivage":
        return h < 13 ? 95 : 30;
      case "evenement":
        return veilleDeWeekend ? 75 : 40;
      // En fin de journée, on remplit la suite plutôt que l'instant.
      case "realisation":
        return h >= 16 ? 60 : 38;
      case "nouveaute":
        return 55;
      case "fideles":
        return 33;
      case "horaires":
        return 20;
      default:
        return 25;
    }
  };

  return [...liste].sort((a, b) => score(b.cle) - score(a.cle) || a.cle.localeCompare(b.cle)).slice(0, n);
}

/** Les champs obligatoires encore vides — le garde-fou contre l'annonce à trous. */
export function manquants(it: Intention, v: Record<string, string>): Champ[] {
  return it.champs.filter((c) => c.requis && !String(v[c.cle] ?? "").trim());
}
