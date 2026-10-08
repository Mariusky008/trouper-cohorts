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
import { nomDansPhrase, profilDuDouble, type ProfilDouble } from "@/lib/direct/double-metiers";
import { questionsDuMetier, reponseDuSavoir, type ReponseSavoir } from "@/lib/direct/savoir-fantome";

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
  /**
   * CE DONT IL PARLE, QUAND IL MONTRE LA CARTE « PLAT ».
   *
   * LE TEXTE VIENT DU SERVEUR, LA CARTE VENAIT DE L'ÉCRAN — et les deux ne
   * lisaient pas le même commerce : l'appli passe une annonce enrichie, le
   * serveur relit la fiche. Le bar disait « Deux verres pour un, 9 € » au-
   * dessus d'une carte « La planche à partager, 8,40 € ». La carte montre
   * maintenant ce que la phrase vient de dire.
   */
  plat?: FicheDouble["plat"];
  /**
   * IL NE SAVAIT PAS, ET IL L'A DIT. La question remonte au commerçant, dans
   * son comptoir : « 3 clients ont demandé… ». Voir `savoir-fantome.ts`.
   */
  transmise?: boolean;
  /** Le serveur l'a déjà rangée chez un vrai commerçant : l'écran n'a rien à garder. */
  notee?: boolean;
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
  /** Son métier, vu par le double : les mots, la demande, les questions. Voir `double-metiers.ts`. */
  profil: ProfilDouble;
  /** « Opticien », « Tatoueur » : les questions de son métier en dépendent. */
  metier: string;
  /** Ses réponses, avec ses mots — « Ce que mon fantôme sait », dans son comptoir. */
  faq: ReponseSavoir[];
};

/**
 * CE QU'UN VRAI COMMERÇANT AJOUTE À SA CARTE.
 *
 * Les restaurants de la démonstration ont tout dans leurs données. Un vrai
 * commerçant a sa carte (nom, horaires, prestations) et, à côté, ce qu'il a dit
 * de lui dans son Espace Pro : le prénom de son double, sa fiche de
 * connaissances, et ce qu'il a raconté en donnant sa voix.
 */
export type SavoirEnPlus = { prenom?: string; notes?: string; recit?: string; faq?: ReponseSavoir[] };

/** La fiche du double, lue dans les données du commerce — et nulle part ailleurs. */
export function ficheDuDouble(c: CarteAutour, plus: SavoirEnPlus = {}): FicheDouble {
  const v = c.voix;
  const prenom = (plus.prenom ?? "").trim() || v?.prenom || "";
  const prenomConnu = !!prenom;
  const profil = profilDuDouble(c);
  /* CE QUE MONTRE L'ANNONCE, ET ON L'APPELLE « PLAT » PAR HISTOIRE.
     Au restaurant, c'est le plat du jour de son menu. Ailleurs, c'est l'annonce
     elle-même — le bouquet, la coupe, la pièce — telle qu'elle est publiée :
     son titre, sa première ligne, son prix, sa photo. Un restaurant sans menu
     n'en prend pas : « le service du midi » n'est pas un plat. */
  /* L'ANNONCE DE L'HEURE QU'IL EST, À PARIS. Le bar publie son « Deux verres
     pour un » de 17 h et son concert de 20 h : à 21 h, c'est le concert qu'on
     vient chercher. En cours d'abord, puis la prochaine, puis la première —
     et l'heure est celle de Paris des deux côtés, serveur compris. */
  const moment = profil.famille === "table" ? undefined : momentDeLHeure(c.moments ?? []);
  const plat = c.menu
    ? { nom: c.menu.plat, detail: c.menu.description, prix: c.menu.prix, photo: c.menu.photo }
    : moment
      ? { nom: moment.titre, detail: moment.lignes?.[0] ?? "", prix: moment.prix ?? "", photo: moment.photo || c.photo || "" }
      : null;
  return {
    id: c.id,
    nom: c.nom,
    prenom: prenom || profil.anonyme,
    prenomConnu,
    role: v?.role || profil.role,
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
    profil,
    metier: c.metier ?? "",
    faq: plus.faq ?? [],
  };
}

/**
 * LA FICHE, AVEC CE QU'IL A APPRIS À SON FANTÔME — pour la démonstration, dont
 * le savoir est dans le téléphone et pas en base. Voir `savoir-fantome.ts`.
 */
export function avecLeSavoir(f: FicheDouble, s: { notes: string; faq: ReponseSavoir[] } | null): FicheDouble {
  if (!s || (!s.notes && !s.faq.length)) return f;
  return { ...f, notes: [f.notes, s.notes].filter(Boolean).join("\n") || undefined, faq: [...s.faq, ...f.faq] };
}

/** L'heure qu'il est à Paris, en heures décimales. */
function heureDeParis(): number {
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 12);
  const m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return h + m / 60;
}

/** L'annonce en cours, sinon la prochaine de la journée, sinon la première. */
function momentDeLHeure<T extends { titre: string; de: number; a: number }>(moments: T[]): T | undefined {
  const avecTitre = moments.filter((m) => m.titre);
  const h = heureDeParis();
  return (
    avecTitre.find((m) => m.de <= h && h < m.a) ??
    avecTitre.filter((m) => m.de > h).sort((x, y) => x.de - y.de)[0] ??
    avecTitre[0]
  );
}

/** « à Julien », ou « au chef », « à l'équipe » — « à le chef » ne se dit pas. */
function aLui(f: FicheDouble): string {
  return f.prenomConnu ? `à ${f.prenom}` : f.profil.aAnonyme;
}

/** « de Julien », ou « du chef », « de l'équipe ». */
export function deLui(f: FicheDouble): string {
  return f.prenomConnu ? `de ${f.prenom}` : f.profil.deAnonyme;
}

/**
 * UN TITRE D'ANNONCE AU MILIEU D'UNE PHRASE : « En ce moment : la veste
 * blazer rose », pas « La veste ». Seul l'article tombe en minuscule — un nom
 * de plat ou de pièce qui commence par un nom propre garde sa majuscule.
 */
function enPhrase(titre: string): string {
  return /^(Le|La|Les|L'|L’|Un|Une|Des|Du|De la) /.test(titre) || /^(L'|L’)/.test(titre)
    ? titre[0].toLowerCase() + titre.slice(1)
    : titre;
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

/** Les trois questions du premier écran — celles de son métier. */
export function suggestionsDeDepart(f?: FicheDouble): string[] {
  return f ? f.profil.suggestions : ["Le plat du jour ?", "Ton histoire ?", "Ta spécialité ?"];
}

/**
 * LE PREMIER MESSAGE, DIT AVEC SA VOIX DÈS L'ARRIVÉE.
 *
 * « "Salut ! Tu es du coin ou de passage ?" je trouve ça très bizarre comme
 * question, il faudrait quelque chose de plus introductif : le commerçant qui
 * se présente — bonjour, moi c'est…, comment puis-je t'aider ? »
 *
 * ON ENTRE CHEZ QUELQU'UN : il dit bonjour, il dit qui il est, il demande ce
 * qu'on vient chercher. Son prénom s'il l'a donné, et d'où il parle ; sans
 * prénom, le nom de la maison. Le serveur écrit la même phrase pour la voix :
 * voir la route `double/voix`.
 */
export function accueilDuDouble(f: FicheDouble, prenomClient?: string): string {
  const p = (prenomClient ?? "").trim();
  const bonjour = `Bonjour${p ? ` ${p}` : ""} !`;
  const aider = "Comment je peux t'aider ?";
  if (f.prenomConnu) return `${bonjour} Moi, c'est ${f.prenom}, ${deLaMaison(f.nom)}. ${aider}`;
  /* SANS PRÉNOM, LA MAISON RÉPOND : « Ici Passion Fleur », « Ici un bar à
     vins ». « Je suis un bar à vins » faisait parler le comptoir. */
  return `${bonjour} Ici ${nomDansPhrase(f.nom)}. ${aider}`;
}

/** « de Chez Léon », « du Petit Bistrot », « d'un salon du centre » — la maison dans « Moi, c'est Julien, … ». */
function deLaMaison(nom: string): string {
  if (/^(Un|Une)\s/.test(nom)) return `d'${nom[0].toLowerCase()}${nom.slice(1)}`;
  if (/^Le\s/.test(nom)) return `du ${nom.slice(3)}`;
  if (/^Les\s/.test(nom)) return `des ${nom.slice(4)}`;
  if (/^La\s/.test(nom)) return `de la ${nom.slice(3)}`;
  if (/^L['’]/.test(nom)) return `de l'${nom.slice(2)}`;
  return `de ${nom}`;
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
  const p = f.profil;
  const table = p.famille === "table";
  /* LES PASTILLES PARLENT LE MÉTIER : « Une table ce soir ? » au restaurant,
     « Un rendez-vous ? » au salon, « Commander un bouquet ? » chez la fleuriste. */
  const demande = p.demande.pastille;
  const vedette = p.questionVedette;
  /* ═══ SES MOTS D'ABORD ═══ Ce qu'il a répondu dans son comptoir passe avant
     tout ce que le double déduirait d'ailleurs : « vous prenez la CB ? » ne
     doit plus recevoir sa carte des plats parce que la question dit « carte ». */
  const savoir = reponseDuSavoir(question, f.faq, p.famille, f.metier);
  const deSonMetier = savoir?.cle ? questionsDuMetier(p.famille, f.metier).find((m) => m.cle === savoir.cle) : undefined;
  const carteDuSavoir: CarteDouble | null = deSonMetier?.demande ? "reservation" : savoir?.cle === "acces" ? "horaires" : null;

  if (/allerg|gluten|lactose|arachide|vegan|vegetar|sans porc|halal|intoleran|enceinte|sante|medical|ordonnance/.test(q)) {
    /* IL L'A ÉCRIT LUI-MÊME : on le redit, mot pour mot, et on rappelle de le
       lui confirmer — une allergie ne se règle pas avec un fantôme. */
    if (savoir) {
      return {
        texte: `${savoir.a.replace(/\s+$/, "")} Et pour une allergie ou ta santé, redis-le ${aLui(f)} en venant.`,
        carte: "reservation",
        suggestions: [demande, "Tes horaires ?"],
      };
    }
    return {
      texte: table
        ? `Pour les allergies et les régimes, demande directement ${aLui(f)} : c'est trop important pour que je devine.`
        : `C'est trop important pour que je devine : pose la question directement ${aLui(f)}.`,
      carte: "reservation",
      suggestions: [demande, "Tes horaires ?"],
      transmise: true,
    };
  }
  /* SA RÉPONSE, SAUF QUAND ON LUI DEMANDE UNE TABLE POUR CE SOIR : « faut-il
     réserver ? » reçoit ses mots ; « on vient à quatre demain » reçoit la
     demande. */
  const demandePrecise =
    /\d|ce soir|demain|ce midi|midi pour|on sera|nous sommes|personnes|pour (deux|trois|quatre|cinq|six)|(je voudrais|je veux|j.aimerais|je souhaite) (reserv|une table|un rendez|un rdv|commander|venir|passer)/.test(q);
  if (savoir && !demandePrecise) {
    return {
      texte: savoir.a,
      carte: carteDuSavoir,
      suggestions: [demande, vedette],
    };
  }
  /* « CE SOIR, IL Y A QUOI ? » N'EST PAS UNE RÉSERVATION, même s'il dit « ce
     soir » : au bar, c'est la question du programme. */
  const surLaVedette = /il y a quoi|quoi de (neuf|bon)|du moment|en ce moment/.test(q);
  if (
    !surLaVedette &&
    /reserv|une table|de la place|on vient|venir a|ce soir|demain|midi pour|on sera|nous sommes|on est \d|personnes|rendez.vous|\brdv\b|creneau|dispo|commander|de cote|mettre de cote|je passe|passer/.test(q)
  ) {
    return {
      texte: p.demande.personnes
        ? `Je transmets ta demande ${aLui(f)}. Dis-moi quand et combien vous êtes.`
        : `Je transmets ta demande ${aLui(f)}. Dis-moi quand ça t'arrange.`,
      carte: "reservation",
      suggestions: [vedette, "C'est où ?"],
    };
  }
  if (/horaire|ouvert|ouvre|ferme|quelle heure|a quelle heure/.test(q)) {
    return {
      texte: f.horaires ? `${f.horaires}.` : `Je n'ai pas les horaires sous la main : je demande ${aLui(f)}.`,
      carte: f.horaires ? "horaires" : null,
      suggestions: [demande, "C'est où ?"],
      ...(f.horaires ? {} : { transmise: true }),
    };
  }
  // « OÙ » SEUL NE SUFFIT PAS : « ou » et « où » s'écrivent pareil sans accent.
  if (/c.est ou|ou est|ou se trouve|adresse|c.est loin|trouver|parking|itineraire/.test(q)) {
    return {
      texte: f.ou ? `${f.ou}, à ${f.distance} de toi.` : `On est à ${f.distance}, à ${f.ville}.`,
      carte: "horaires",
      suggestions: [demande, vedette],
    };
  }
  if (/histoire|qui es|t.es qui|pourquoi|comment tu|ta cuisine|ton metier|ta passion|depuis/.test(q) && f.recit) {
    return {
      texte: extrait(f.recit, 3),
      carte: plat ? "plat" : null,
      suggestions: [p.suggestions[2] ?? vedette, demande],
    };
  }
  /* SANS VEDETTE, LA LISTE RÉPOND À SA PLACE. Un vrai commerçant n'a pas
     toujours publié son plat du jour ou son bouquet du moment, mais il a
     souvent saisi ses prestations : « je ne sais pas » quand on a sa liste sous
     la main, c'est une panne. */
  const surLaCarte = /carte|menu|autre chose|quoi d.autre|dessert|entree|prix|combien|tarif|prestation|collection|bouquets|creations|montures|seances/.test(q);
  const surLeJour = /plat du jour|aujourd|ce midi|a manger|faim|special|conseill|recommand|meilleur|quoi de bon|tu sers|avec quoi|du moment|en ce moment|ce soir.*quoi|il y a quoi|nouveau|nouveaute|comment ca se passe/.test(q);
  if ((surLaCarte || (surLeJour && !plat)) && f.carte.length) {
    const lignes = f.carte.slice(0, 4).map((l) => `${l.nom}${l.prix ? ` (${l.prix})` : ""}`);
    return {
      texte: `${p.carteNom} : ${lignes.join(", ")}.`,
      carte: "carte",
      suggestions: [vedette, demande],
    };
  }
  if (surLeJour && plat) {
    const conseil = /special|conseill|recommand|meilleur/.test(q);
    const prix = plat.prix ? `, ${plat.prix}` : "";
    const detail = plat.detail ? ` ${plat.detail.replace(/[.\s]+$/, "")}.` : "";
    return {
      texte: conseil
        ? `${plat.nom} ! ${f.signature || "C'est ma fierté du moment."} Tu veux ${table ? "le découvrir" : "venir le voir"} ?`
        : table
          ? `Aujourd'hui c'est ${plat.nom}${prix}.${detail}`
          : `En ce moment : ${enPhrase(plat.nom)}${prix}.${detail}`,
      carte: "plat",
      suggestions: ["Ton histoire ?", demande, "C'est où ?"],
    };
  }
  if (/coin|passage|habite|j.habite|de dax|touriste|vacances|je visite/.test(q)) {
    return {
      texte: plat
        ? `Bienvenue ! Alors je te conseille ${enPhrase(plat.nom)}, c'est ce qu'on fait de mieux en ce moment.`
        : `Bienvenue ! Demande-moi ce que tu veux sur ${p.lieu}.`,
      carte: plat ? "plat" : null,
      suggestions: ["Ton histoire ?", demande],
    };
  }
  if (/merci|super|top|genial|parfait|ok\b|d.accord|cool/.test(q)) {
    return {
      texte: `Avec plaisir ! ${p.demande.proposition}`,
      carte: null,
      suggestions: [demande, vedette],
    };
  }
  if (/salut|bonjour|hello|coucou|bonsoir/.test(q)) {
    return {
      texte: `Bonjour ! Je suis le double ${deLui(f)}. Demande-moi ${p.vedette}, ou ${p.demande.objet}.`,
      carte: null,
      suggestions: suggestionsDeDepart(f),
    };
  }
  return {
    texte: `Bonne question ! Je préfère ne pas te dire de bêtise : je la transmets ${aLui(f)}.${
      plat ? ` En attendant, ${p.vedette}, c'est ${enPhrase(plat.nom)}.` : ""
    }`,
    carte: plat ? "plat" : null,
    suggestions: [demande, "Tes horaires ?"],
    transmise: true,
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
  const p = f.profil;
  const liste = (l: FicheDouble["carte"][number]) => `${l.nom}${l.prix ? ` (${l.prix})` : ""}${l.detail ? ` — ${l.detail}` : ""}`;
  /* SES RÉPONSES, sans les deux premières : elles sont déjà dans sa note. */
  const reponses = f.faq.filter((r) => r.cle !== "specialite" && r.cle !== "exclusions");
  const lignes = [
    `Tu es le double IA ${f.prenomConnu ? `de ${f.prenom}, ${f.role},` : p.deAnonyme} ${p.famille === "table" ? "du restaurant" : `de « ${p.typeLieu} »`} « ${f.nom} » à ${f.ville}.`,
    "Tu parles comme lui ou elle, avec chaleur et bonne humeur, en TUTOYANT, en français.",
    `Tu réponds à un habitant${prenomClient ? ` qui s'appelle ${prenomClient}` : ""} qui découvre ${p.lieu} sur l'application ClikMe.`,
    "",
    "RÈGLES ABSOLUES :",
    "- Une ou deux phrases courtes, 220 caractères au maximum. C'est une conversation, pas un discours.",
    "- Tu n'utilises QUE les informations de la fiche ci-dessous. Tu n'inventes ni prix, ni produit, ni horaire, ni disponibilité.",
    `- ${p.sensible}, ou tout ce qui n'est pas dans la fiche : tu dis que tu transmets la question ${aLui(f)}.`,
    "- Quand une de SES RÉPONSES ci-dessous répond à la question, tu la reprends fidèlement, avec ses mots, sans rien ajouter.",
    "- Tu es une IA et tu ne le caches pas si on te le demande.",
    `- Quand c'est utile, tu proposes de ${p.demande.verbe} : c'est ce qui fait venir les gens.`,
    "",
    "FICHE :",
    `${p.typeLieu[0].toUpperCase()}${p.typeLieu.slice(1)} : ${f.nom}, à ${f.distance} (${f.ville}).`,
    f.ou ? `Adresse : ${f.ou}.` : "",
    f.horaires ? `Horaires : ${f.horaires}.` : "",
    f.mot ? `Le lieu : ${f.mot}` : "",
    f.plat ? `${p.vedette[0].toUpperCase()}${p.vedette.slice(1)} : ${f.plat.nom}${f.plat.prix ? `, ${f.plat.prix}` : ""}${f.plat.detail ? ` — ${f.plat.detail}` : ""}.` : "",
    f.carte.length ? `${p.carteNom} : ${f.carte.map(liste).join(" ; ")}.` : "",
    f.recit ? `Son récit, à la première personne : « ${f.recit} »` : "",
    f.signature ? `Sa phrase : « ${f.signature} »` : "",
    f.cadeau ? `Petit plus proposé aux clients ClikMe : ${f.cadeau}.` : "",
    f.notes ? `Ce qu'il a écrit lui-même sur sa maison :\n${f.notes}` : "",
    reponses.length ? `SES RÉPONSES aux questions de ses clients, avec ses mots :\n${reponses.map((r) => `- ${r.q} → ${r.a}`).join("\n")}` : "",
    "",
    "RÉPONDS EN JSON UNIQUEMENT, de cette forme :",
    '{"texte": "ta réponse", "carte": "plat" | "reservation" | "horaires" | "carte" | null, "suggestions": ["2 ou 3 questions courtes que l\'habitant pourrait poser ensuite, 24 caractères max chacune"], "transmise": true | false}',
    `carte = plat pour montrer ${p.vedette} ; reservation pour proposer ${p.demande.objet} ; horaires pour l'adresse et les horaires ; carte pour ${p.carteNom.toLowerCase()}.`,
    "transmise = true SEULEMENT quand on te pose une question dont la réponse n'est pas dans la fiche et que tu dis la transmettre ; false sinon, y compris pour une demande de réservation ou de rendez-vous.",
  ];
  return lignes.filter((l) => l !== "").join("\n");
}

/** Ne garde d'une réponse de modèle que ce qu'on sait afficher. */
export function nettoyerReponse(brut: unknown, f: FicheDouble): ReponseDouble | null {
  if (!brut || typeof brut !== "object") return null;
  const r = brut as { texte?: unknown; carte?: unknown; suggestions?: unknown; transmise?: unknown };
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
  return {
    texte,
    carte,
    suggestions: suggestions.length ? suggestions : [f.profil.demande.pastille, f.profil.questionVedette],
    ...(r.transmise === true ? { transmise: true } : {}),
  };
}

/**
 * ═══ CE QU'IL DIT QUAND ON FRANCHIT SA PORTE ═══════════════════════════════
 *
 * « Au toucher, il pousse la porte… et à l'arrivée, il parle avec sa voix :
 * "Bienvenue ! … 989 avis, 4,1 étoiles. Tu veux voir ce qu'on sert ce soir ?" »
 *
 * SEULEMENT CE QUI EST VRAI : son nom, sa note et son nombre d'avis tels que
 * Google les affiche, et UNE phrase d'un vrai client, recopiée mot pour mot
 * (la première phrase d'un avis à quatre ou cinq étoiles). Rien sur « ce qui
 * fait parler » chez lui, sauf si un client l'a écrit : le double ne prête pas
 * au commerçant des mots qu'il n'a pas dits.
 *
 * PURE ET PARTAGÉE : la page l'écrit dans la bulle, la route de la voix la
 * prononce — la même phrase, des deux côtés, sans qu'aucun texte libre ne
 * passe par la route.
 */
export function seuilDuDouble(c: Pick<CarteAutour, "nom" | "branche" | "google" | "avisGoogle">): string {
  const nom = c.nom.trim();
  const cap = (s: string) => s.replace(/^(\p{L})/u, (x) => x.toUpperCase());
  const chez = /^chez\s/i.test(nom)
    ? `chez ${cap(nom.slice(5))}`
    : /^le\s/i.test(nom)
      ? `au ${cap(nom.slice(3))}`
      : /^les\s/i.test(nom)
        ? `aux ${cap(nom.slice(4))}`
        : /^la\s/i.test(nom)
          ? `à la ${cap(nom.slice(3))}`
          : /^l['’]/i.test(nom)
            ? `à l'${cap(nom.slice(2))}`
            : /^(un|une)\s/i.test(nom)
              ? `à ${nom[0].toLowerCase()}${nom.slice(1)}`
              : `à ${nom}`;
  const morceaux = [`Bienvenue ${chez} !`];
  if (c.google?.note && c.google.avis) {
    morceaux.push(`${c.google.avis.toLocaleString("fr-FR")} avis, ${c.google.note} étoiles sur Google.`);
  }
  // UNE PHRASE D'UN VRAI CLIENT : la première phrase d'un bon avis, si elle est courte.
  const avis = (c.avisGoogle ?? []).find((a) => (a.note == null || a.note >= 4) && a.texte);
  if (avis) {
    const phrase = (avis.texte.match(/^[^.!?…]{12,130}[.!?…]?/) ?? [""])[0].trim();
    if (phrase) morceaux.push(`Un client a écrit : « ${phrase.replace(/[.!?…]$/, "")} ».`);
  }
  morceaux.push(c.branche === "restaurant" || c.branche === "bar" ? "Tu veux voir ce qu'on sert ?" : "Je te fais visiter ?");
  return morceaux.join(" ");
}
