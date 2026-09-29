// 👻 LE DOUBLE DU CHEF — ce qu'il sait, et comment il répond.
//
// ═══ CE QUE CE FICHIER EXISTE POUR TENIR ═══════════════════════════════════
//
// « Le fantôme deviendra un endroit où l'on pourrait discuter avec le chef du
// restaurant. »
//
// UN DOUBLE QUI INVENTE UN PRIX, UNE ALLERGIE OU UN HORAIRE EST PIRE QUE PAS DE
// DOUBLE DU TOUT. Tout ce qu'il dit vient donc d'une FICHE, construite ici à
// partir des données du commerce — son plat du jour, sa carte, ses horaires,
// son adresse, le récit de sa cuisinière. Il n'a rien d'autre en tête.
//
// DEUX CERVEAUX, UNE SEULE FICHE :
//
//   · quand une clé OpenAI est posée, la route fait parler un modèle de langage
//     avec la consigne écrite ici — voir `consigneDuDouble` ;
//   · sinon, ou si l'appel échoue, `repondreSansIA` répond par mots-clés. Il
//     est plus court, mais il ne ment jamais, et c'est lui qui fait tourner la
//     démonstration sans clé.
//
// LES CARTES (le plat, la réservation, les horaires, la carte) NE SORTENT PAS
// DU MODÈLE. Il dit seulement laquelle montrer ; son contenu est lu ici, dans
// les données. Un modèle qui écrit lui-même « 16 € » finit un jour par écrire
// « 14 € ».

import type { CarteAutour } from "@/lib/direct/apercu-habitant";

/** Ce que le double peut poser dans la conversation, en plus de sa phrase. */
export type CarteDouble = "plat" | "reservation" | "horaires" | "carte";

export type ReponseDouble = {
  texte: string;
  carte?: CarteDouble | null;
  /** Deux ou trois questions à toucher, pour la suite. */
  suggestions: string[];
  /** D'où vient la réponse — utile au journal, jamais affiché. */
  par?: "ia" | "local";
  /** Le sceau du serveur sur ce texte : sans lui, la route de la voix refuse
   *  de le dire. Voir `api/direct/double/voix`. */
  sig?: string;
};

export type FicheDouble = {
  id: string;
  nom: string;
  /** Le prénom de la personne en cuisine, ou « le chef » quand on ne le sait pas. */
  prenom: string;
  /** Vrai quand on connaît vraiment son prénom : le titre ne s'accorde pas pareil. */
  prenomConnu: boolean;
  role: string;
  portrait?: string;
  ville: string;
  distance: string;
  horaires: string;
  ou: string;
  mot: string;
  recit: string;
  signature: string;
  plat: { nom: string; detail: string; prix: string; photo: string } | null;
  carte: { nom: string; prix?: string; rayon?: string; detail?: string }[];
  cadeau?: string;
  /** Ce que le commerçant a écrit sur sa maison dans son Espace Pro (spécialités, questions fréquentes). */
  notes?: string;
};

/**
 * CE QU'UN VRAI COMMERÇANT AJOUTE À SA CARTE.
 *
 * Les restaurants de la démonstration ont tout dans leurs données. Un vrai
 * commerçant a sa carte (nom, horaires, prestations) et, à côté, ce qu'il a dit
 * de lui dans son Espace Pro : le prénom de son double, sa fiche de
 * connaissances, et ce qu'il a raconté en donnant sa voix.
 */
export type SavoirEnPlus = { prenom?: string; notes?: string; recit?: string };

/** La fiche du double, lue dans les données du commerce — et nulle part ailleurs. */
export function ficheDuDouble(c: CarteAutour, plus: SavoirEnPlus = {}): FicheDouble {
  const v = c.voix;
  const prenom = (plus.prenom ?? "").trim() || v?.prenom || "";
  const prenomConnu = !!prenom;
  const plat = c.menu
    ? { nom: c.menu.plat, detail: c.menu.description, prix: c.menu.prix, photo: c.menu.photo }
    : null;
  return {
    id: c.id,
    nom: c.nom,
    prenom: prenom || "le chef",
    prenomConnu,
    role: v?.role || "cuisinier",
    // LE PORTRAIT S'IL EXISTE, SINON LA PREMIÈRE PHOTO DE SA CUISINE : une
    // image de ses mains au travail dit mieux « une vraie personne » qu'un
    // cercle vide.
    portrait: v?.portrait || v?.photosVoix?.[0]?.src || c.photoAccueil || c.photo,
    ville: c.ville,
    distance: c.distance,
    horaires: c.fiche?.horaires ?? "",
    ou: c.fiche?.ou ?? "",
    mot: c.fiche?.mot ?? "",
    recit: v?.recit || (plus.recit ?? "").trim(),
    signature: v?.signature ?? "",
    plat,
    carte: (c.catalogue ?? []).map((a) => ({ nom: a.nom, prix: a.prix, rayon: a.rayon, detail: a.detail })),
    cadeau: c.reponse?.cadeau,
    notes: (plus.notes ?? "").trim() || undefined,
  };
}

/** « à Julien », ou « au chef » — pour les phrases où l'on parle de lui ; « à le chef » ne se dit pas. */
function aLui(f: FicheDouble): string {
  return f.prenomConnu ? `à ${f.prenom}` : "au chef";
}

/** Les deux premières phrases d'un récit : un double qui récite tout lasse. */
function extrait(t: string, n = 2): string {
  const phrases = t.match(/[^.!?…]+[.!?…]+/g) ?? [t];
  return phrases.slice(0, n).join(" ").trim();
}

/** Sans accents ni majuscules, pour reconnaître les mots d'une question. */
function plat_(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Les trois questions du premier écran. */
export function suggestionsDeDepart(): string[] {
  return ["Le plat du jour ?", "Ton histoire ?", "Ta spécialité ?"];
}

/** Le premier message, dit avec sa voix dès l'arrivée. */
export function accueilDuDouble(prenomClient?: string): string {
  const p = (prenomClient ?? "").trim();
  return `Salut${p ? ` ${p}` : ""} ! Tu es du coin ou de passage ?`;
}

/**
 * LA RÉPONSE, DÉCOUPÉE EN PHRASES À DIRE L'UNE APRÈS L'AUTRE.
 *
 * « Sur la page commerçant, les voix sont encore robotiques. »
 *
 * FABRIQUER TOUTE LA RÉPONSE AVANT DE LA DIRE PRENAIT TROP LONGTEMPS, et la
 * lire pendant qu'elle se fabriquait (un flux sans taille) ne marche pas sur
 * Safari : iPhone et Mac refusent souvent un son dont ils ne connaissent pas la
 * longueur, et l'écran passait la parole à la voix du téléphone.
 *
 * ON DIT DONC PHRASE PAR PHRASE. La première, courte, est prête en une seconde
 * et joue pendant que les suivantes se fabriquent ; chacune est un vrai
 * fichier, que tous les navigateurs savent lire.
 *
 * LE MÊME DÉCOUPAGE DES DEUX CÔTÉS. Le navigateur demande « la phrase 2 » d'une
 * réponse scellée, le serveur redécoupe la réponse et dit la sienne : aucun
 * texte libre ne passe, le sceau reste celui de la réponse entière. Les
 * morceaux trop courts (« Salut ! ») se collent au suivant — une syllabe seule
 * dans un fichier, c'est une respiration coupée.
 */
export function phrasesADire(texte: string): string[] {
  const brut = (texte.match(/[^.!?…]+(?:[.!?…]+["»”)\s]*|$)/g) ?? [texte]).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of brut) {
    if (out.length && out[out.length - 1].length < 30) out[out.length - 1] += ` ${p}`;
    else out.push(p);
  }
  /* PAS PLUS DE SIX MORCEAUX : au-delà, le reste part avec le dernier. */
  if (out.length > 6) out.splice(5, out.length - 5, out.slice(5).join(" "));
  return out.length ? out : [texte.trim()];
}

/** Ce qu'il répond quand on vient de lui demander une table. */
export function confirmationDuDouble(f: FicheDouble): string {
  return `C’est noté ! Je transmets ta demande ${aLui(f)}. Tu auras la confirmation ici même.`;
}

/**
 * ═══ LE CERVEAU DE SECOURS — PAR MOTS-CLÉS, ET IL NE MENT JAMAIS ══════════
 *
 * L'ORDRE COMPTE. Les allergies passent avant tout : « c'est sans gluten, ta
 * spécialité ? » ne doit pas recevoir la présentation du plat. Puis la
 * réservation, parce que c'est ce qui rapporte, puis le reste.
 *
 * QUAND IL NE SAIT PAS, IL LE DIT, et il propose de transmettre. C'est la
 * même règle que pour le modèle de langage : mieux vaut « je demande à
 * Maïté » qu'une réponse plausible et fausse.
 */
export function repondreSansIA(question: string, f: FicheDouble): ReponseDouble {
  const q = plat_(question);
  const plat = f.plat;

  if (/allerg|gluten|lactose|arachide|vegan|vegetar|sans porc|halal|intoleran/.test(q)) {
    return {
      texte: `Pour les allergies et les régimes, demande directement ${aLui(f)} : c'est trop important pour que je devine.`,
      carte: "reservation",
      suggestions: ["Une table ce soir ?", "Tes horaires ?"],
    };
  }
  if (/reserv|une table|de la place|on vient|venir a|ce soir|demain|midi pour|on sera|nous sommes|on est \d|personnes/.test(q)) {
    return {
      texte: `Je transmets ta demande ${aLui(f)}. Dis-moi quand et combien vous êtes.`,
      carte: "reservation",
      suggestions: ["Le plat du jour ?", "C'est où ?"],
    };
  }
  if (/horaire|ouvert|ouvre|ferme|quelle heure|a quelle heure/.test(q)) {
    return {
      texte: f.horaires ? `${f.horaires}.` : `Je n'ai pas les horaires sous la main : je demande ${aLui(f)}.`,
      carte: f.horaires ? "horaires" : null,
      suggestions: ["Une table ce soir ?", "C'est où ?"],
    };
  }
  // « OÙ » SEUL NE SUFFIT PAS : « du coin ou de passage » s'écrit pareil sans accent.
  if (/c.est ou|ou est|ou se trouve|adresse|c.est loin|trouver|parking|itineraire/.test(q)) {
    return {
      texte: f.ou ? `${f.ou}, à ${f.distance} de toi.` : `On est à ${f.distance}, à ${f.ville}.`,
      carte: "horaires",
      suggestions: ["Une table ce soir ?", "Le plat du jour ?"],
    };
  }
  if (/histoire|qui es|t.es qui|pourquoi|comment tu|ta cuisine|depuis/.test(q) && f.recit) {
    return {
      texte: extrait(f.recit, 3),
      carte: plat ? "plat" : null,
      suggestions: ["Ta spécialité ?", "Une table ce soir ?"],
    };
  }
  /* SANS PLAT DU JOUR, LA CARTE RÉPOND À SA PLACE. Un vrai restaurant n'a pas
     toujours publié son plat du jour, mais il a souvent saisi ses prestations :
     « je ne sais pas » quand on a sa carte sous la main, c'est une panne. */
  const surLaCarte = /carte|menu|autre chose|quoi d.autre|dessert|entree|prix|combien/.test(q);
  const surLeJour = /plat du jour|aujourd|ce midi|a manger|faim|special|conseill|recommand|meilleur|quoi de bon|tu sers|avec quoi/.test(q);
  if ((surLaCarte || (surLeJour && !plat)) && f.carte.length) {
    const lignes = f.carte.slice(0, 4).map((l) => `${l.nom}${l.prix ? ` (${l.prix})` : ""}`);
    return {
      texte: `Sur la carte : ${lignes.join(", ")}.`,
      carte: "carte",
      suggestions: ["Le plat du jour ?", "Une table ce soir ?"],
    };
  }
  if (surLeJour && plat) {
    const conseil = /special|conseill|recommand|meilleur/.test(q);
    return {
      texte: conseil
        ? `${plat.nom} ! ${f.signature || "C'est ma fierté du jour."} Tu veux le découvrir ?`
        : `Aujourd'hui c'est ${plat.nom}, ${plat.prix}. ${plat.detail}.`,
      carte: "plat",
      suggestions: ["Ton histoire ?", "Une table ce soir ?", "C'est où ?"],
    };
  }
  if (/coin|passage|habite|j.habite|de dax|touriste|vacances|je visite/.test(q)) {
    return {
      texte: plat
        ? `Bienvenue ! Alors je te conseille ${plat.nom}, c'est ce qu'on fait de mieux aujourd'hui.`
        : "Bienvenue ! Demande-moi ce que tu veux sur la maison.",
      carte: plat ? "plat" : null,
      suggestions: ["Ton histoire ?", "Une table ce soir ?"],
    };
  }
  if (/merci|super|top|genial|parfait|ok\b|d.accord|cool/.test(q)) {
    return {
      texte: "Avec plaisir ! Je te garde une table ?",
      carte: null,
      suggestions: ["Oui, une table ce soir", "Le plat du jour ?"],
    };
  }
  if (/salut|bonjour|hello|coucou|bonsoir/.test(q)) {
    return {
      texte: `Salut ! Je suis le double ${f.prenomConnu ? `de ${f.prenom}` : "du chef"}. Demande-moi le plat du jour, ou une table.`,
      carte: null,
      suggestions: suggestionsDeDepart(),
    };
  }
  return {
    texte: `Bonne question ! Je préfère ne pas te dire de bêtise : je la transmets ${aLui(f)}.${
      plat ? ` En attendant, le plat du jour, c'est ${plat.nom}.` : ""
    }`,
    carte: plat ? "plat" : null,
    suggestions: ["Une table ce soir ?", "Tes horaires ?"],
  };
}

/**
 * ═══ LA CONSIGNE DU MODÈLE — LA FICHE, ET LES RÈGLES QUI L'ENTOURENT ═══════
 *
 * LA FICHE EST ÉCRITE EN ENTIER, et le modèle n'a qu'elle. Les règles disent
 * ce qu'on attend d'un double : du tutoiement, deux phrases, pas d'invention,
 * et une carte quand elle aide — le plat, une table, les horaires.
 */
export function consigneDuDouble(f: FicheDouble, prenomClient?: string): string {
  const lignes = [
    `Tu es le double IA de ${f.prenomConnu ? `${f.prenom}, ${f.role}` : "l'équipe en cuisine"} du restaurant « ${f.nom} » à ${f.ville}.`,
    "Tu parles comme lui, avec chaleur et bonne humeur, en TUTOYANT, en français.",
    `Tu réponds à un habitant${prenomClient ? ` qui s'appelle ${prenomClient}` : ""} qui découvre le restaurant sur l'application ClikMe.`,
    "",
    "RÈGLES ABSOLUES :",
    "- Une ou deux phrases courtes, 220 caractères au maximum. C'est une conversation, pas un discours.",
    "- Tu n'utilises QUE les informations de la fiche ci-dessous. Tu n'inventes ni prix, ni plat, ni horaire, ni ingrédient.",
    `- Allergies, régimes, ingrédients précis, vin, ou tout ce qui n'est pas dans la fiche : tu dis que tu transmets la question ${aLui(f)}.`,
    "- Tu es une IA et tu ne le caches pas si on te le demande.",
    "- Quand c'est utile, tu proposes de réserver une table : c'est ce qui fait venir les gens.",
    "",
    "FICHE :",
    `Restaurant : ${f.nom}, à ${f.distance} (${f.ville}).`,
    f.ou ? `Adresse : ${f.ou}.` : "",
    f.horaires ? `Horaires : ${f.horaires}.` : "",
    f.mot ? `Le lieu : ${f.mot}` : "",
    f.plat ? `Plat du jour : ${f.plat.nom}, ${f.plat.prix} — ${f.plat.detail}.` : "",
    f.carte.length
      ? `Carte : ${f.carte.map((l) => `${l.nom}${l.prix ? ` (${l.prix})` : ""}${l.detail ? ` — ${l.detail}` : ""}`).join(" ; ")}.`
      : "",
    f.recit ? `Son récit, à la première personne : « ${f.recit} »` : "",
    f.signature ? `Sa phrase : « ${f.signature} »` : "",
    f.cadeau ? `Petit plus proposé aux clients ClikMe : ${f.cadeau}.` : "",
    f.notes ? `Ce qu'il a écrit lui-même sur sa maison :\n${f.notes}` : "",
    "",
    "RÉPONDS EN JSON UNIQUEMENT, de cette forme :",
    '{"texte": "ta réponse", "carte": "plat" | "reservation" | "horaires" | "carte" | null, "suggestions": ["2 ou 3 questions courtes que l\'habitant pourrait poser ensuite, 24 caractères max chacune"]}',
    "carte = plat pour montrer le plat du jour ; reservation pour proposer une table ; horaires pour l'adresse et les horaires ; carte pour la carte complète.",
  ];
  return lignes.filter((l) => l !== "").join("\n");
}

/** Ne garde d'une réponse de modèle que ce qu'on sait afficher. */
export function nettoyerReponse(brut: unknown, f: FicheDouble): ReponseDouble | null {
  if (!brut || typeof brut !== "object") return null;
  const r = brut as { texte?: unknown; carte?: unknown; suggestions?: unknown };
  const texte = typeof r.texte === "string" ? r.texte.trim().slice(0, 400) : "";
  if (!texte) return null;
  const cartes: CarteDouble[] = ["plat", "reservation", "horaires", "carte"];
  let carte = cartes.includes(r.carte as CarteDouble) ? (r.carte as CarteDouble) : null;
  // UNE CARTE SANS DONNÉES NE SE MONTRE PAS : pas de plat du jour, pas de carte « plat ».
  if (carte === "plat" && !f.plat) carte = null;
  if (carte === "carte" && !f.carte.length) carte = null;
  const suggestions = (Array.isArray(r.suggestions) ? r.suggestions : [])
    .filter((x): x is string => typeof x === "string" && !!x.trim())
    .map((x) => x.trim().slice(0, 32))
    .slice(0, 3);
  return { texte, carte, suggestions: suggestions.length ? suggestions : ["Une table ce soir ?", "Le plat du jour ?"] };
}
