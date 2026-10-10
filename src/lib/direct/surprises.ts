// 🎁 LES SURPRISES DU JOUR — « Ah ! Voilà pourquoi je lui ai donné tout ça.
// Il m'a trouvé quelque chose. »
//
// LE FANTÔME FAIT UN TOUR EN VILLE : il regarde ce que les commerçants ont
// publié AUJOURD'HUI (les annonces du jour, le plat du midi, les nouveautés en
// rayon) et le compare à ce que la Maison sait de vous. Il revient avec une à
// trois choses — une par pièce au plus.
//
// JAMAIS INVENTÉE, JAMAIS VAGUE (le brief, §24). Une surprise n'existe que si
// un vrai contenu de la ville correspond vraiment, ET si la raison se raconte
// en une phrase : « Vous avez gardé votre chino et préféré « Parka kaki » :
// cette veste va avec. » Trois raisons seulement peuvent la porter : ce que
// vous m'avez DIT (tout de suite : ce n'est pas une déduction), ce que je
// CROIS (un goût précis tiré d'au moins trois gestes), ce qui VA AVEC ce que
// vous avez gardé. Un lieu suivi, un trait partagé une fois, la fraîcheur :
// des points en plus, jamais une raison. Mieux vaut une excellente surprise
// que cinq moyennes ; un jour sans rien de fort, il n'y en a pas.
//
// TOUJOURS EXPLICABLE (§25). Chaque surprise porte ses preuves, rangées comme
// dans la Maison : ce que vous m'avez dit / ce que j'ai remarqué / ce que je
// crois. « Pourquoi moi ? » les montre telles quelles.
//
// CE QUI EST PASSÉ N'EST PLUS PROPOSÉ : une annonce dont l'heure est finie, le
// plat du jour après 15 h, ne deviennent pas des surprises.
//
// FICHIER PARTAGÉ, SANS NAVIGATEUR NI SERVEUR. La garde du jour (ce qui a été
// tiré, vu, aimé) vit dans la mémoire de la Maison (`maison-memoire.ts`).
import { estUnePrestation, familleDe, teinteDe } from "@/lib/direct/duel";
import { familleDuDouble, type FamilleDouble } from "@/lib/direct/double-metiers";
import {
  cuisinesDe,
  goutsDe,
  motDuTrait,
  ordreSelonLHeure,
  pieceDeLaFamille,
  pieceParCle,
  signauxDe,
  type ClePiece,
  type Memoire,
  type Signal,
} from "@/lib/direct/maison";

// ─── CE QUE LE FANTÔME RAPPORTE ────────────────────────────────────────────

export type Preuve = { sorte: "dit" | "remarque" | "crois"; texte: string };
export type SorteDeRaison = "dit" | "crois" | "va-avec";
export const SORTES_DE_RAISON: SorteDeRaison[] = ["dit", "crois", "va-avec"];

export type Surprise = {
  /** Unique pour le jour : `<date>|<objet>`. */
  id: string;
  /** La chose elle-même, d'un jour à l'autre : `<commerce>|<contenu>`. */
  objet: string;
  piece: ClePiece;
  carte: string;
  lieu: string;
  distance?: string;
  titre: string;
  /** L'annonce d'où elle vient, quand le titre en est une ligne : « Les deux plats du jour ». */
  annonce?: string;
  photo: string;
  prix?: string;
  /** « ce matin », « ce midi », « ce soir », « en ce moment ». */
  quand: string;
  /** Quand elle est vraie, en heures (le plat du midi, la soirée) ; rien pour ce qui reste en rayon. */
  de?: number;
  fin?: number;
  /** LA phrase : « Ça irait avec ce que vous avez gardé : Pantalon kaki. » */
  raison: string;
  preuves: Preuve[];
  /** Ce qu'elle révèle, pour que ❤️ et 👎 apprennent quelque chose. */
  traits: string[];
  /** Le trait qui l'a fait choisir — « Ne plus me proposer ce genre-là » le refuse. */
  trait?: string;
  /**
   * LA SORTE DE RAISON QUI LA PORTE : ce que vous m'avez dit, ce que je crois,
   * ce qui va avec ce que vous avez gardé. C'est elle que le tableau de bord
   * compare : quelles raisons tiennent vraiment devant les vrais habitants.
   */
  sorte?: SorteDeRaison;
  action: { mot: string; onglet?: string };
  score: number;
};

/** Le commerce tel que le Fantôme le lit : ce qu'il a publié aujourd'hui. */
export type CommerceDuJour = {
  id: string;
  nom: string;
  distance?: string;
  metier?: string;
  branche?: string | null;
  photo?: string;
  moments?: { de: number; a: number; titre: string; lignes?: string[]; photo?: string; prix?: string; demain?: boolean }[];
  menu?: { plat: string; description?: string; prix?: string; photo?: string };
  catalogue?: { id: string; nom: string; detail?: string; prix?: string; photo?: string; rayon?: string; publieLe?: string }[];
};

/** Trois au plus : au-delà, ce n'est plus une surprise, c'est un catalogue. */
export const SURPRISES_MAX = 3;
/** Pas deux fois la même chose dans la semaine. */
const DEJA_MONTREE_MS = 6 * 86400_000;

// ─── CE QUE DIT UN CONTENU ─────────────────────────────────────────────────

const mots = (alternatives: string) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu");

const AMBIANCES: [string, RegExp][] = [
  ["terrasse", mots("terrasses?|plein air|au soleil")],
  ["musique", mots("concerts?|acoustiques?|live|musique|dj|jazz|guitares?|chansons?|duo|groupe")],
  ["verre", mots("verres?|vins?|caves?|apéro|apéritif|planches?|dégustations?")],
  ["fete", mots("fêtes?|soirées?|danser|danse|dj")],
  ["decouvrir", mots("découvr\\p{L}*|ateliers?|expos?|exposition|marché|nocturne|inconnus")],
  ["amis", mots("entre amis|à partager|pour deux|ensemble|grande table|tablée")],
  ["monde", mots("inconnus|tablée|grande table|rencontres?")],
];
const STYLES: [string, RegExp][] = [
  ["bois", mots("bois|chêne|noyer|jute|rotin|lin|velours|naturel(le)?s?")],
  ["minimaliste", mots("épurée?s?|blanc(he)?s?|simples?|minimal\\p{L}*")],
  ["boheme", mots("berbères?|tissée?s?|jute|rotin|macramé|bohèmes?")],
  ["colore", mots("orange|jaunes?|roses?|vert sapin|colorée?s?|bleu canard")],
  ["industriel", mots("métal|acier|noire?s?|industriel(le)?s?")],
];
const GENRES: [string, RegExp][] = [
  ["roman", mots("romans?")],
  ["polar", mots("polars?|enquêtes?|suspense|thriller")],
  ["bd", mots("bd|bandes? dessinées?|manga")],
  ["essai", mots("essais?|histoire de|réfléchir")],
  ["jeunesse", mots("jeunesse|enfants?|album")],
  ["cuisine", mots("cuisine|recettes?")],
];
const BESOINS: [string, RegExp][] = [
  ["dormir", mots("sommeil|dormir|insomnies?")],
  ["bouger", mots("yoga|pilates|sport|cours|danse|marche")],
  ["souffler", mots("détente|relax\\p{L}*|méditation|hypno\\p{L}*|massages?|souffler|stress")],
  ["forme", mots("coaching|forme|sport|tabac")],
  ["soin", mots("soins?|massages?|spa|visage")],
];
const COUPES: [string, RegExp][] = [
  ["carre", mots("carrée?s?")],
  ["frange", mots("franges?")],
  ["degrade", mots("dégradée?s?")],
  ["boucles", mots("boucles|bouclée?s?|frisée?s?")],
  ["court", mots("courte?s?|pixie|garçonne")],
  ["long", mots("longs?|longues?|longueurs")],
  ["couleur", mots("couleurs?|coloration|balayage|mèches")],
];

/** LES CHOIX DE LA MAISON, DANS LA MÊME LANGUE QUE LES CONTENUS. */
const TRAIT_DU_CHOIX: Partial<Record<ClePiece, (cle: string) => string>> = {
  sorties: (k) => `ambiance:${k}`,
  interieur: (k) => `style:${k}`,
  librairie: (k) => `genre:${({ romans: "roman", polars: "polar", essais: "essai" } as Record<string, string>)[k] ?? k}`,
  bienetre: (k) => `besoin:${k}`,
};
/** « Vous aimez les coupes » au Miroir ne dit rien : toutes les coupes y répondraient. */
const TROP_LARGES = new Set(["famille:coupe", "famille:ongles", "famille:tatouage", "famille:fleurs"]);

/** « Un verre au calme » n'est pas une table de six inconnus ni une soirée DJ. */
const INCOMPATIBLES: Record<string, string[]> = {
  "ambiance:verre": ["ambiance:fete", "ambiance:monde"],
};
const MOTS_EN_PLUS: Record<string, string> = {
  "ambiance:terrasse": "la terrasse",
  "ambiance:musique": "la musique",
  "ambiance:verre": "un verre au calme",
  "ambiance:fete": "la fête",
  "ambiance:decouvrir": "découvrir",
  "ambiance:amis": "sortir entre amis",
  "ambiance:monde": "rencontrer du monde",
  "style:bois": "le bois et le naturel",
  "style:minimaliste": "l'épuré",
  "style:boheme": "le bohème",
  "style:colore": "la couleur",
  "style:industriel": "l'industriel",
  "genre:roman": "les romans",
  "genre:polar": "les polars",
  "genre:bd": "la BD",
  "genre:essai": "les essais",
  "genre:jeunesse": "la jeunesse",
  "genre:cuisine": "les livres de cuisine",
  "besoin:dormir": "mieux dormir",
  "besoin:bouger": "bouger",
  "besoin:souffler": "souffler",
  "besoin:forme": "vous remettre en forme",
  "besoin:soin": "prendre soin de vous",
  "coupe:carre": "le carré",
  "coupe:frange": "la frange",
  "coupe:degrade": "le dégradé",
  "coupe:boucles": "les boucles",
  "coupe:court": "les coupes courtes",
  "coupe:long": "les longueurs",
  "coupe:couleur": "la couleur",
};
export const motDe = (trait: string) => MOTS_EN_PLUS[trait] ?? motDuTrait(trait);

const parListe = (liste: [string, RegExp][], prefixe: string, texte: string) => liste.filter(([, re]) => re.test(texte)).map(([k]) => `${prefixe}:${k}`);

/** « Les vestes cirées » → « Le veste cirée » : les familles du duel ne connaissent que le singulier. */
const auSingulier = (t: string) => t.replace(/(\p{L}{3,})s(?=[^\p{L}]|$)/gu, "$1");

/** Les traits d'un contenu, dans la langue de sa pièce. `famille` : celle du commerce. */
export function traitsDuContenu(piece: ClePiece, titre: string, texte: string, famille?: FamilleDouble): string[] {
  switch (piece) {
    case "dressing": {
      const t: string[] = [];
      const te = teinteDe(texte);
      if (te) t.push(`teinte:${te}`);
      const metier = famille === "lunettes" ? "lunettes" : undefined;
      let f = familleDe(titre, metier);
      if (f === "autre") f = familleDe(auSingulier(titre));
      if (f !== "autre") t.push(`famille:${f}`);
      return t;
    }
    case "miroir":
      if (famille === "ongles" || /ongl|vernis|manucur/i.test(texte)) return ["famille:ongles"];
      if (famille === "seance") return ["famille:tatouage"];
      return [...parListe(COUPES, "coupe", texte), "famille:coupe"];
    case "cuisine":
      return cuisinesDe(texte).map((c) => `cuisine:${c}`);
    case "sorties":
      return parListe(AMBIANCES, "ambiance", texte);
    case "interieur": {
      const t = parListe(STYLES, "style", texte);
      const te = teinteDe(texte);
      if (te) t.push(`teinte:${te}`);
      if (famille === "fleurs") t.push("famille:fleurs");
      return t;
    }
    case "librairie":
      return parListe(GENRES, "genre", texte);
    case "bienetre":
      return parListe(BESOINS, "besoin", texte);
  }
}

/** « Je ne mange pas de… » : ce qu'un plat ne doit pas contenir. */
const INTERDITS: Record<string, RegExp> = {
  viande: mots("b[œo]euf|veau|agneau|porc|poulet|canard|magret|confit|jambon|lardons?|saucisses?|chorizo|bacon|ventrèche|boudin|viandes?|côte|entrecôte|bavette|burger|hachis|parmentier de canard|axoa|garbure|charcuterie"),
  porc: mots("porc|jambon|lardons?|saucisses?|chorizo|bacon|ventrèche|boudin|charcuterie|garbure"),
  poisson: mots("poissons?|saumon|cabillaud|thon|merlu|moules|crevettes|gambas|dorade|calamars?|chipirons?|fruits de mer|huîtres"),
  gluten: mots("pâtes|lasagnes?|pizzas?|pain|burger|tartes?|quiches?|crumble|pané|panure|viennoiseries?|gâteau|brioche|croûtons?"),
  lactose: mots("fromages?|crème|beurre|burrata|mozzarella|gratin|béchamel|brebis|lait|riz au lait"),
  "fruits-a-coque": mots("noix|noisettes?|amandes?|pistaches?|cajou|pécan"),
};

// ─── LA LECTURE DE LA VILLE ────────────────────────────────────────────────

type Candidat = {
  cle: string;
  piece: ClePiece;
  titre: string;
  texte: string;
  traits: string[];
  /** Les lignes d'une annonce : « Les deux plats du jour » → « Lasagnes maison ». */
  lignes?: string[];
  famille?: FamilleDouble;
  photo?: string;
  prix?: string;
  quand: string;
  de?: number;
  fin?: number;
  frais: number;
};

const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function quandDe(de: number): string {
  if (de < 11) return "ce matin";
  if (de < 14) return "ce midi";
  if (de < 17.5) return "cet après-midi";
  return "ce soir";
}

/** CE QUE CE COMMERCE A PUBLIÉ, ET QUI VAUT ENCORE À CETTE HEURE. */
export function candidatsDu(c: CommerceDuJour, maintenant: Date): Candidat[] {
  const heure = maintenant.getHours() + maintenant.getMinutes() / 60;
  const famille = familleDuDouble(c);
  // Une séance (hypnose, sophrologie) va au bien-être ; le tatoueur, au miroir.
  const tatoueur = /tatou|tattoo|pierc/i.test(c.metier ?? "");
  const piece: ClePiece | undefined = famille === "seance" ? (tatoueur ? "miroir" : "bienetre") : pieceDeLaFamille(famille);
  if (!piece) return [];
  const out: Candidat[] = [];
  const annonces = new Set<string>();
  /** L'article du rayon dont parle une annonce : « Son coup de cœur : L'Anomalie ». */
  const articleDe = (texte: string) => {
    const t = sansAccents(texte);
    return (c.catalogue ?? []).find((a) => a.photo && t.includes(sansAccents(a.nom.split("—")[0].trim())));
  };
  const avec = (p: ClePiece, x: Omit<Candidat, "piece" | "traits" | "famille">) =>
    out.push({ ...x, piece: p, famille, traits: traitsDuContenu(p, x.titre, x.texte, famille) });
  for (const m of c.moments ?? []) {
    if (m.demain || m.a <= heure) continue;
    const art = articleDe([m.titre, ...(m.lignes ?? [])].join(" "));
    if (art) annonces.add(art.id);
    const texte = [m.titre, ...(m.lignes ?? []), art?.nom, art?.detail, art?.rayon].filter(Boolean).join(" · ");
    // UN RESTAURANT, LE SOIR, C'EST UNE SORTIE — quand l'annonce parle d'une
    // soirée (une table d'inconnus, un concert), pas des restes du jour.
    const p = piece === "cuisine" && m.de >= 17 && traitsDuContenu("sorties", m.titre, texte).length ? "sorties" : piece;
    avec(p, { cle: `m|${m.titre}`, titre: m.titre, texte, lignes: m.lignes, photo: m.photo ?? art?.photo, prix: m.prix, quand: quandDe(m.de), de: m.de, fin: m.a, frais: 2 });
  }
  if (c.menu && heure < 15 && piece === "cuisine") {
    avec(piece, { cle: `menu|${c.menu.plat}`, titre: c.menu.plat, texte: `${c.menu.plat} · ${c.menu.description ?? ""}`, photo: c.menu.photo, prix: c.menu.prix, quand: "ce midi", de: 12, fin: 15, frais: 2 });
  }
  for (const a of c.catalogue ?? []) {
    if (!a.photo || annonces.has(a.id)) continue;
    // PUBLIÉE À SON COMPTOIR AUJOURD'HUI : c'est une trouvaille du jour. Ces
    // trois derniers jours, une nouveauté. Sinon, ce qui est en rayon.
    const publie = a.publieLe ? new Date(a.publieLe) : undefined;
    const age = publie && !Number.isNaN(publie.getTime()) ? maintenant.getTime() - publie.getTime() : Infinity;
    const duJour = publie && age >= 0 && dateDuJour(publie) === dateDuJour(maintenant);
    const rayon = /nouveaut|coup de c|arrivage/i.test(a.rayon ?? "");
    const frais = duJour ? 2 : age >= 0 && age < 3 * 86400_000 ? 1 : rayon ? 1 : 0;
    const quand = duJour ? quandDe(publie.getHours() + publie.getMinutes() / 60) : "en ce moment";
    avec(piece, { cle: `cat|${a.id}`, titre: a.nom.split("—")[0].trim(), texte: [a.nom, a.detail, a.rayon].filter(Boolean).join(" · "), photo: a.photo, prix: a.prix, quand, frais });
  }
  // Le même objet annoncé et en rayon : une seule fois, l'annonce du jour d'abord.
  const vus = new Set<string>();
  return out.filter((x) => {
    const k = sansAccents(x.titre).replace(/^(la|le|les|l')\s*/, "");
    if (vus.has(k)) return false;
    vus.add(k);
    return true;
  });
}

// ─── LE RAPPROCHEMENT ──────────────────────────────────────────────────────

/** Ce qui se porte ensemble : une veste va avec un pantalon, pas avec une autre veste. */
const VA_AVEC: Record<string, string[]> = {
  dessus: ["haut", "maille", "bas", "robe"],
  haut: ["dessus", "bas"],
  maille: ["bas", "dessus"],
  bas: ["dessus", "haut", "maille"],
  robe: ["dessus", "accessoire"],
  accessoire: ["dessus", "robe", "maille"],
};

const ACTIONS: Record<ClePiece, { mot: string; onglet?: string }> = {
  dressing: { mot: "Voir sur moi", onglet: "experience" },
  miroir: { mot: "Voir sur moi", onglet: "experience" },
  cuisine: { mot: "Voir le plat", onglet: "carte" },
  sorties: { mot: "Voir la soirée" },
  interieur: { mot: "Voir chez moi", onglet: "experience" },
  librairie: { mot: "Voir chez le libraire" },
  bienetre: { mot: "Voir le créneau" },
};

const pour = (texte: string): "homme" | "femme" | undefined =>
  /\bhommes?\b|barbier/i.test(texte) ? "homme" : /\bfemmes?\b/i.test(texte) ? "femme" : undefined;

/**
 * LES SURPRISES DE CE MOMENT. `maintenant` décide de ce qui vaut encore ;
 * `gardees` évite de proposer ce qu'on a déjà mis de côté.
 */
export function choisirLesSurprises(
  m: Memoire,
  commerces: CommerceDuJour[],
  maintenant: Date,
  gardees: { nom: string }[] = [],
  dejaMontrees: { k: string; t: number }[] = [],
): Surprise[] {
  const heure = maintenant.getHours() + maintenant.getMinutes() / 60;
  const date = dateDuJour(maintenant);
  const recentes = new Set(dejaMontrees.filter((x) => maintenant.getTime() - x.t < DEJA_MONTREE_MS).map((x) => x.k));
  const dejaGardees = new Set(gardees.map((g) => sansAccents(g.nom)));
  const parId = new Map(commerces.map((c) => [c.id, c]));
  /** « Mise de côté chez Un prêt-à-porter homme » : le genre se lit sur la pièce, ou sur sa boutique. */
  const genreDuSignal = (s: Signal) => {
    const lieu = s.id.startsWith("garde|") ? parId.get(s.id.split("|")[1]) : undefined;
    return pour(`${s.d} ${s.quoi} ${lieu ? `${lieu.nom} ${lieu.metier ?? ""}` : ""}`);
  };
  const suivisParPiece = new Map<string, Signal>();
  for (const s of m.signaux) if (s.id.startsWith("suivi|")) suivisParPiece.set(s.id.slice(6), s);

  const meilleures = new Map<ClePiece, Surprise>();
  for (const c of commerces) {
    for (const x of candidatsDu(c, maintenant)) {
      const p = x.piece;
      if (m.pauses[p]?.v === true) continue;
      const objet = `${c.id}|${x.cle}`;
      if (recentes.has(objet) || dejaGardees.has(sansAccents(x.titre))) continue;
      if (!x.photo && !c.photo) continue;
      if (p === "miroir" && estUnePrestation(x.titre)) continue;
      const signaux = signauxDe(m, p);
      const positifs = signaux.filter((s) => s.sens > 0);
      const negatifs = signaux.filter((s) => s.sens < 0);
      // Une surprise qu'on a trouvée « pas vraiment » ne revient pas.
      if (negatifs.some((s) => s.id === `surprise|${objet}`)) continue;
      const traits = x.traits;
      const refus = new Set(m.refus[p]?.v ?? []);
      if (traits.some((t) => refus.has(t))) continue;
      const dits = m.choix[p]?.v ?? [];
      if (p === "cuisine" && dits.some((k) => INTERDITS[k]?.test(x.texte))) continue;

      // POUR QUI : on ne propose pas une veste de boutique femme à quelqu'un qui ne
      // garde que de l'homme, ni l'inverse. Ce qu'on ne sait pas ne filtre rien.
      if (p === "dressing" || p === "miroir") {
        const sienne = pour(`${c.nom} ${c.metier ?? ""} ${x.texte}`);
        const siens = positifs.map(genreDuSignal).filter(Boolean);
        if (siens.length && siens.every((g) => g === "homme") && sienne !== "homme") continue;
        if (siens.length && !siens.includes("homme") && sienne === "homme") continue;
      }

      // ═══ LA RÈGLE : PAS DE SURPRISE SANS UNE RAISON RACONTABLE EN UNE PHRASE ═══
      //
      // Trois raisons seulement peuvent la porter (« pivots ») :
      //   · ce que vous m'avez DIT — un choix exprès vaut tout de suite : ce
      //     n'est pas une déduction ;
      //   · ce que je CROIS — un goût tiré d'au moins trois gestes (`goutsDe`),
      //     et précis : « le kaki », pas « la mode » ;
      //   · au Dressing, ce qui VA AVEC ce que vous avez gardé — deux pièces, ou
      //     une pièce et la même teinte que ce que vous aimez.
      // Un lieu suivi, un trait partagé une fois : des points en plus, jamais une
      // raison. « Vous aimez la mode, donc voici une chemise » ne passe pas.
      const preuves: Preuve[] = [];
      const pivots: { phrase: string; poids: number; trait?: string; sorte: SorteDeRaison }[] = [];
      const chose = objetDe(p, x.titre, x.famille);
      // 💬 Ce que vous m'avez dit
      const versTrait = TRAIT_DU_CHOIX[p];
      if (versTrait) {
        for (const k of dits) {
          const t = versTrait(k);
          if (traits.includes(t) && !(INCOMPATIBLES[t] ?? []).some((u) => traits.includes(u))) {
            preuves.push({ sorte: "dit", texte: `Vous m'avez dit : ${motDe(t)}` });
            pivots.push({ phrase: phraseDuChoix(p, t), poids: 3, trait: t, sorte: "dit" });
          }
        }
      }
      if (p === "cuisine" && dits.length) preuves.push({ sorte: "dit", texte: `Sans ${dits.map((k) => k.replace("fruits-a-coque", "fruits à coque")).join(", ")}, comme vous me l'avez dit` });
      // 💡 Ce que je crois — précis seulement : « vous aimez les vestes » ne suffit pas à montrer une veste.
      const gouts = goutsDe(m, p).filter((g) => traits.includes(g.trait) && !TROP_LARGES.has(g.trait));
      const appuis = (t: string) => positifs.filter((s) => s.traits.includes(t) && !s.id.startsWith("suivi|"));
      for (const g of gouts.slice(0, 2)) {
        preuves.push({ sorte: "crois", texte: `Je crois que vous aimez ${g.mot} : ${evoque(appuis(g.trait))} (${g.pour} gestes sur ${g.sur})` });
        // LA MÊME CHOSE QUE CE QUE VOUS AVEZ PRÉFÉRÉ : on ne dit pas « c'est italien
        // aussi » de lasagnes à quelqu'un qui a choisi les lasagnes, on dit qu'il y en a.
        const memeChose = appuis(g.trait).some((s) => {
          const a = sansAccents(s.quoi);
          const b = sansAccents(x.texte);
          return a.length > 3 && b.includes(a);
        });
        const fin = memeChose ? (x.quand === "en ce moment" ? "en voici" : `il y en a ${x.quand}`) : conclusion(g.trait);
        if (!g.trait.startsWith("famille:")) pivots.push({ phrase: `Vous avez ${evoque(appuis(g.trait))} : ${fin}.`, poids: 3, trait: g.trait, sorte: "crois" });
      }
      // 👀 Ce que j'ai remarqué : ce qui irait avec ce que vous avez gardé
      const avec: Signal[] = [];
      if (p === "dressing") {
        const fam = familleDe(x.titre) === "autre" ? traits.find((t) => t.startsWith("famille:"))?.slice(8) ?? "" : familleDe(x.titre);
        const vaAvec = (s: Signal) => s.traits.some((t) => t.startsWith("famille:") && (VA_AVEC[fam] ?? []).includes(t.slice(8)));
        // Deux pièces gardées au plus, de deux familles différentes : « votre chino et votre polo ».
        for (const s of positifs.filter(vaAvec)) {
          const f = s.traits.find((t) => t.startsWith("famille:"));
          if (avec.length < 2 && !avec.some((a) => a.traits.includes(f ?? "")) && !avec.some((a) => a.quoi === s.quoi)) avec.push(s);
        }
        for (const a of avec) preuves.push({ sorte: "remarque", texte: `Vous avez gardé ${votre(a.quoi)}` });
        // La même teinte qu'une pièce que vous aimez : c'est elle qui fait d'une
        // seule pièce assortie une vraie raison.
        const teinte = traits.find((t) => t.startsWith("teinte:"));
        const memeTeinte = teinte ? positifs.find((s) => s.traits.includes(teinte) && !s.id.startsWith("suivi|")) : undefined;
        const aimeLaFamille = gouts.some((g) => g.trait.startsWith("famille:"));
        // LA PHRASE DE LA RÈGLE : « Vous avez gardé votre chino et préféré « Parka
        // kaki » : cette veste va avec. » — ce qui va avec, et le goût qui choisit.
        const goutTeinte = teinte ? gouts.find((g) => g.trait === teinte) : undefined;
        const appuiTeinte = goutTeinte ? appuis(goutTeinte.trait).find((s) => !avec.includes(s)) : undefined;
        if (avec.length && appuiTeinte) {
          const va = chose.genre === "p" ? "vont" : "va";
          pivots.push({
            phrase: `Vous avez ${evoque([...avec, appuiTeinte], true)} : ${chose.dem.charAt(0).toLowerCase()}${chose.dem.slice(1)} ${va} avec.`,
            poids: 3 + avec.length,
            trait: goutTeinte!.trait,
            sorte: "va-avec",
          });
        } else if (avec.length >= 2 || (avec.length === 1 && (memeTeinte || aimeLaFamille))) {
          const liste = avec.map((a) => votre(a.quoi)).join(" et ");
          const ton =
            teinte && memeTeinte
              ? avec.includes(memeTeinte)
                ? `, dans le même ${TON_NOM[teinte] ?? "ton"} que ${votre(memeTeinte.quoi)}`
                : `, et c'est ${DU_TON[teinte] ?? "la même teinte"}, comme ${evoqueUn(memeTeinte)}`
              : "";
          pivots.push({ phrase: `${chose.dem} va avec ${liste}${ton}.`, poids: 2 + avec.length - 1 + (memeTeinte ? 1 : 0) + (aimeLaFamille ? 1 : 0), sorte: "va-avec" });
        }
      }
      if (!pivots.length) continue;

      // Des points en plus, jamais une raison : le même trait qu'un geste, le lieu suivi.
      let bonus = 0;
      const communs = new Set<string>();
      for (const s of positifs) {
        if (avec.includes(s) || s.id.startsWith("suivi|")) continue;
        const t = s.traits.find((u) => traits.includes(u) && !gouts.some((g) => g.trait === u) && !u.startsWith("famille:") && !u.startsWith("prix:"));
        if (t && communs.size < 2 && !communs.has(t)) {
          communs.add(t);
          bonus += 1;
          preuves.push({ sorte: "remarque", texte: `${s.quoi} — ${s.d.charAt(0).toLowerCase()}${s.d.slice(1)}` });
        }
      }
      const suivi = suivisParPiece.get(c.id);
      if (suivi && suivi.piece === p) {
        bonus += 2;
        preuves.push({ sorte: "remarque", texte: `Vous suivez ${c.nom}` });
      }
      // Ce qui a déplu, sur les mêmes traits
      const malus = negatifs.filter((s) => s.traits.some((t) => traits.includes(t))).length;
      pivots.sort((u, v) => v.poids - u.poids);
      const perso = pivots.slice(0, 2).reduce((n, v) => n + v.poids, 0);
      const score = perso + bonus - 2 * Math.min(malus, 2) + x.frais;
      if (score < 4) continue;
      const raison = pivots[0].phrase;
      const trait = pivots.find((v) => v.trait)?.trait ?? gouts[0]?.trait;

      // LE NOM DU PLAT, PAS CELUI DE L'ANNONCE : quand « Les deux plats du jour »
      // ne dit pas ce qui a plu, la ligne qui le dit devient le titre. À table
      // seulement : ailleurs, la ligne décrit la chose (« Un roman haletant »),
      // elle ne la nomme pas.
      const cles = new Set([...pivots.flatMap((v) => (v.trait ? [v.trait] : [])), ...gouts.map((g) => g.trait), ...communs]);
      const parle = (t: string) => traitsDuContenu(p, t, t, x.famille).some((u) => cles.has(u));
      const ligne = p === "cuisine" && !parle(x.titre) ? x.lignes?.find(parle) : undefined;

      const s: Surprise = {
        id: `${date}|${objet}`,
        objet,
        piece: p,
        carte: c.id,
        lieu: c.nom,
        distance: c.distance,
        titre: ligne ?? x.titre,
        annonce: ligne ? x.titre : undefined,
        photo: x.photo ?? c.photo ?? "",
        prix: x.prix,
        quand: x.quand,
        de: x.de,
        fin: x.fin,
        raison,
        preuves,
        traits,
        trait,
        sorte: pivots[0].sorte,
        action: ACTIONS[p],
        score,
      };
      const deja = meilleures.get(p);
      if (!deja || s.score > deja.score) meilleures.set(p, s);
    }
  }
  // À score égal, la pièce du moment d'abord : la cuisine à midi, les sorties le soir.
  const ordre = ordreSelonLHeure(heure);
  return [...meilleures.values()].sort((a, b) => b.score - a.score || ordre.indexOf(a.piece) - ordre.indexOf(b.piece)).slice(0, SURPRISES_MAX);
}

/** CE QUE VOUS M'AVEZ DIT, redit en une phrase. */
function phraseDuChoix(p: ClePiece, t: string): string {
  const mot = motDe(t);
  switch (p) {
    case "sorties":
      return `Vous m'avez dit ce qui vous fait sortir : ${mot}.`;
    case "interieur":
      return `Chez vous, c'est ${mot} : vous me l'avez dit.`;
    case "librairie":
      return `Vous m'avez dit aimer ${mot} : en voici ${UN_GENRE[t] ?? "un"}.`;
    case "bienetre":
      return `Vous m'avez dit vouloir ${mot}.`;
    default:
      return `Vous m'avez dit : ${mot}.`;
  }
}

const UN_GENRE: Record<string, string> = { "genre:bd": "une", "genre:roman": "un", "genre:polar": "un", "genre:essai": "un", "genre:jeunesse": "un", "genre:cuisine": "un" };

/** « c'est du kaki », « c'est un dessert » : ce que la chose a de commun avec ce que vous aimez. */
const DU_TON: Record<string, string> = {
  "teinte:vert": "du kaki",
  "teinte:clair": "dans les tons clairs",
  "teinte:sombre": "dans les tons sombres",
  "teinte:bleu": "du bleu",
  "teinte:chaud": "dans les couleurs chaudes",
  "teinte:rose": "du rose",
  "teinte:brun": "du marron",
};
const TON_NOM: Record<string, string> = {
  "teinte:vert": "kaki",
  "teinte:clair": "ton clair",
  "teinte:sombre": "ton sombre",
  "teinte:bleu": "bleu",
  "teinte:chaud": "ton chaud",
  "teinte:rose": "rose",
  "teinte:brun": "marron",
};
const CONCLUSIONS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(DU_TON).map(([k, v]) => [k, `c'est aussi ${v}`])),
  "cuisine:italien": "c'est italien aussi",
  "cuisine:basque": "c'est basque aussi",
  "cuisine:asiatique": "c'est asiatique aussi",
  "cuisine:poisson": "c'est du poisson aussi",
  "cuisine:viande": "c'est de la viande aussi",
  "cuisine:vegetal": "c'est végétarien aussi",
  "cuisine:mijote": "c'est un plat mijoté aussi",
  "cuisine:sucre": "c'est un dessert aussi",
  "coupe:carre": "c'est un carré aussi",
  "coupe:frange": "avec une frange aussi",
  "coupe:degrade": "c'est un dégradé aussi",
  "coupe:boucles": "les boucles sont gardées",
  "coupe:court": "c'est court aussi",
  "coupe:long": "les longueurs sont gardées",
  "coupe:couleur": "avec de la couleur aussi",
};
const conclusion = (t: string) => CONCLUSIONS[t] ?? `c'est dans le même esprit (${motDe(t)})`;

/** « votre chino », « vos baskets » : une pièce gardée, dite comme la sienne. */
function votre(quoi: string): string {
  const q = quoi.trim();
  const premier = q.split(/\s+/)[0] ?? "";
  const nom = /^[A-ZÀ-Ý][a-zà-ÿ]/.test(q) ? q.charAt(0).toLowerCase() + q.slice(1) : q;
  return `${/[sx]$/i.test(premier) && premier.length > 3 ? "vos" : "votre"} ${nom}`;
}

/** Un geste, dit par ce qu'il a été : « votre chino » (gardé), « « Lasagnes maison » » (préféré en duel). */
function evoqueUn(s: Signal): string {
  return s.id.startsWith("garde|") ? votre(s.quoi) : `« ${s.quoi} »`;
}

/**
 * CE QUE VOUS AVEZ FAIT, DIT CONCRÈTEMENT — les deux gestes les plus récents :
 * « gardé votre chino et préféré « Veste cirée kaki » », « préféré « Lasagnes
 * maison » 3 fois ». Jamais « vous aimez la mode ».
 */
function evoque(signaux: Signal[], dansLOrdre = false): string {
  const verbe = (s: Signal) => (s.id.startsWith("garde|") ? "gardé" : s.id.startsWith("duel|") ? "préféré" : s.id.startsWith("envie|") ? "choisi" : "aimé");
  const tries = dansLOrdre ? signaux : [...signaux].sort((a, b) => b.t - a.t);
  const vus = new Map<string, { s: Signal; n: number }>();
  for (const s of tries) {
    const k = sansAccents(s.quoi);
    const deja = vus.get(k);
    if (deja) deja.n++;
    else vus.set(k, { s, n: 1 });
  }
  const deux = [...vus.values()].slice(0, dansLOrdre ? 3 : 2);
  if (!deux.length) return "fait des choix qui vont dans ce sens";
  const parVerbe = new Map<string, string[]>();
  for (const { s, n } of deux) {
    const v = verbe(s);
    parVerbe.set(v, [...(parVerbe.get(v) ?? []), `${evoqueUn(s)}${n > 1 ? ` ${n} fois` : ""}`]);
  }
  return [...parVerbe].map(([v, l]) => `${v} ${l.join(" et ")}`).join(" et ");
}

/** LA CHOSE, NOMMÉE : « Cette veste », « Ce plat », « Ce livre » — et son genre, pour le Fantôme. */
const NOMS: [RegExp, string, "m" | "f" | "p"][] = [
  [mots("surchemises?"), "Cette surchemise", "f"],
  [mots("vestes?"), "Cette veste", "f"],
  [mots("manteaux?"), "Ce manteau", "m"],
  [mots("doudounes?"), "Cette doudoune", "f"],
  [mots("blousons?"), "Ce blouson", "m"],
  [mots("parkas?"), "Cette parka", "f"],
  [mots("trench"), "Ce trench", "m"],
  [mots("chemises?|chemisiers?"), "Cette chemise", "f"],
  [mots("blouses?"), "Cette blouse", "f"],
  [mots("polos?"), "Ce polo", "m"],
  [mots("t-shirts?|tee-shirts?"), "Ce t-shirt", "m"],
  [mots("pulls?"), "Ce pull", "m"],
  [mots("gilets?|cardigans?"), "Ce gilet", "m"],
  [mots("sweats?"), "Ce sweat", "m"],
  [mots("robes?"), "Cette robe", "f"],
  [mots("jeans?"), "Ce jean", "m"],
  [mots("pantalons?"), "Ce pantalon", "m"],
  [mots("chinos?"), "Ce chino", "m"],
  [mots("jupes?"), "Cette jupe", "f"],
  [mots("shorts?"), "Ce short", "m"],
  [mots("costumes?|tailleurs?"), "Ce costume", "m"],
  [mots("écharpes?"), "Cette écharpe", "f"],
  [mots("foulards?"), "Ce foulard", "m"],
  [mots("sacs?"), "Ce sac", "m"],
  [mots("ceintures?"), "Cette ceinture", "f"],
  [mots("bonnets?"), "Ce bonnet", "m"],
  [mots("baskets|sneakers"), "Ces baskets", "p"],
  [mots("montures?|lunettes"), "Cette monture", "f"],
];
export function objetDe(p: ClePiece, titre: string, famille?: FamilleDouble): { dem: string; genre?: "m" | "f" | "p" } {
  if (p === "dressing") {
    const n = NOMS.find(([re]) => re.test(titre));
    return n ? { dem: n[1], genre: n[2] } : { dem: "Cette pièce", genre: "f" };
  }
  if (p === "miroir") return famille === "seance" ? { dem: "Ce motif", genre: "m" } : famille === "ongles" ? { dem: "Cette pose", genre: "f" } : { dem: "Cette coupe", genre: "f" };
  if (p === "cuisine") return { dem: "Ce plat", genre: "m" };
  if (p === "librairie") return { dem: "Ce livre", genre: "m" };
  return { dem: "Ça" };
}

/** « 2026-10-10 », à l'heure du téléphone : un jour, c'est le sien. */
export function dateDuJour(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Ce qu'on dit sous la photo : « Trouvée ce matin chez Le Dressing · 350 m »,
 * « Ce soir chez L'Ardoise Landaise · 250 m ». Lu à l'heure où on la regarde :
 * l'apéro de 17 h, vu à 19 h, se passe « en ce moment » ; le plat du midi, vu
 * à 16 h, « c'était ce midi ».
 */
export function sourceDe(s: Surprise, maintenant?: Date): string {
  const ou = `chez ${s.lieu}${s.distance ? ` · ${s.distance}` : ""}`;
  const h = maintenant ? maintenant.getHours() + maintenant.getMinutes() / 60 : undefined;
  // Sans heure de fin : en rayon (« en ce moment »), ou publiée aujourd'hui à son comptoir (« trouvée ce matin »).
  if (s.de === undefined) return s.quand === "en ce moment" ? `En ce moment ${ou}` : `Trouvée ${s.quand} ${ou}`;
  if (h !== undefined && s.fin !== undefined && h >= s.fin) return `C'était ${s.quand} ${ou}`;
  if (s.quand === "ce matin") return `Trouvée ce matin ${ou}`;
  if (h !== undefined && h >= s.de && quandDe(h) !== s.quand) return `En ce moment ${ou}`;
  return `${s.quand.charAt(0).toUpperCase()}${s.quand.slice(1)} ${ou}`;
}

/** Passée : le plat du midi après 15 h, la soirée finie. Ce qui est en rayon ne passe pas dans la journée. */
export const estPassee = (s: Surprise, maintenant: Date) => s.fin !== undefined && maintenant.getHours() + maintenant.getMinutes() / 60 >= s.fin;

/**
 * CE QUE LE FANTÔME DIT EN MONTRANT CHACUNE — vivant, pas récité : jamais
 * deux fois la même phrase dans une tournée, et « celui-là » ou « celle-là »
 * selon la chose. Le choix suit la surprise (pas le hasard du rendu) : la
 * revoir, c'est réentendre la même phrase.
 */
export function motsDuFantome(suite: Surprise[]): string[] {
  const pris = new Set<number>();
  return suite.map((s, k) => {
    const genre = objetDe(s.piece, s.titre).genre;
    const lui = genre === "f" ? "Celle-là" : genre === "p" ? "Celles-là" : genre === "m" ? "Celui-là" : "Ça";
    const merite = genre === "p" ? "méritent" : "mérite";
    const mots = [
      "Regardez ça…",
      "Je suis tombé là-dessus.",
      "Ça m'a fait penser à vous.",
      `${lui} ${merite} votre attention.`,
      "Ça, je devais vous le montrer.",
      "Tenez, j'ai trouvé ça en passant.",
      ...(k === suite.length - 1 && k > 0 ? ["Et la dernière, je l'ai gardée pour la fin."] : []),
    ];
    let i = [...s.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % mots.length;
    while (pris.has(i) && pris.size < mots.length) i = (i + 1) % mots.length;
    pris.add(i);
    return mots[i];
  });
}

export const nomDeLaPiece = (p: ClePiece) => pieceParCle(p).nom;
