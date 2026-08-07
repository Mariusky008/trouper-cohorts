// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITION DE LA LETTRE DE PROSPECTION — un seul gabarit.
//
// Le produit a changé : il n'est plus payant et l'argument n'est plus le site,
// c'est la diffusion dans le fil de la ville. Il n'y a donc plus de diagnostic,
// plus de comparaison avec les concurrents, plus de verso, et plus d'algorithme
// de sélection de variante (avis / présence de site). UN gabarit, A4 recto seul,
// noir et blanc.
//
// Ce module est partagé par la lettre unique (/lettre/[slug]) et l'impression en
// lot (/lettres/[ville]) : même rendu, zéro divergence.
//
// DEUX RÈGLES NON NÉGOCIABLES portées ici, et pas dans le gabarit HTML :
//   1. Déontologie — un praticien de santé ou une profession du droit ne reçoit
//      JAMAIS cette lettre. Elle propose de publier des annonces commerciales
//      dans un fil public : incompatible, et aucune version adoucie n'existe.
//   2. Anti-affirmation fausse — le sous-titre énumère ce qui est DÉJÀ dans son
//      espace. Il ne mentionne jamais un élément absent de sa fiche Google.
//      Quand la fiche est trop pauvre pour qu'une seule des formulations soit
//      vraie, on n'imprime pas la lettre.
// Dans les deux cas la sortie est une EXCLUSION explicite et journalisable, pas
// une lettre dégradée.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import { resolveMetier, deontologieOf } from "@/lib/site-internet/metier-profiles";

const str = (v: unknown) => (v == null ? "" : String(v));
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function injectVars(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [key, val] of Object.entries(vars)) {
    // Une valeur ne doit jamais rouvrir un marqueur : les remplacements sont
    // séquentiels, et un nom de commerce contenant « {{ville}} » se ferait
    // substituer au tour suivant. Le cas est rare, la parade coûte une ligne.
    out = out.replaceAll(`{{${key}}}`, String(val ?? "").replaceAll("{{", "").replaceAll("}}", ""));
  }
  return out;
}

function readTpl(rel: string): string {
  return readFileSync(join(process.cwd(), "src/templates/site-internet", rel), "utf-8");
}

export function readLetterStyles(): string {
  return readTpl("lettre-styles.html");
}

// Le QR mène à l'espace déjà préparé. Noir pur sur blanc, zone de silence de
// 4 modules (option `margin`, comptée en modules) : à 36 mm de motif utile il se
// scanne de biais et sous un mauvais éclairage, ce qui est exactement la
// situation d'une remise en main propre sur le pas de la porte.
async function buildQr(targetUrl: string): Promise<string> {
  try {
    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    return svg.replace(/<\?xml[^>]*\?>/i, "").trim();
  } catch {
    return "";
  }
}

// ── Nom d'usage ──────────────────────────────────────────────────────────────
// Apify colle souvent la catégorie et la ville au nom (« Cabinet d'Ostéopathie -
// ostéopathe à Bayonne »). On coupe au premier séparateur. Sur une lettre
// remise en main propre, un tiret esseulé hurle « template automatique ».
const BIZ_WORDS = /(cabinet|centre|espace|maison|institut|studio|sarl|eurl|sasu|sas|eirl|\bei\b|scp|scm|boulangerie|patisserie|boucherie|epicerie|atelier|boutique|garage|salon|magasin|groupe|association|asso)/i;
const trimName = (s: string) => s.replace(/^[\s\-–—,;:·|/]+|[\s\-–—,;:·|/]+$/gu, "").trim();

export function usageName(full: string): string {
  const cut = str(full).split(/\s[-–—]\s|,\s/)[0];
  const clean = cut.replace(/\s+/g, " ").trim();
  const tokens = clean.split(" ").filter(Boolean);
  if (tokens.length <= 2) return trimName(clean) || clean;
  if (BIZ_WORDS.test(clean)) {
    // Raison sociale : jusqu'à 4 mots, sans couper juste avant une ponctuation.
    const out = trimName(tokens.slice(0, 4).join(" ")) || trimName(tokens.slice(0, 2).join(" "));
    return out || clean;
  }
  // 3 mots et plus sans mot d'enseigne : « L'Atelier de Sophie » (liaison /
  // apostrophe) se garde entier, « Jean Martin Dupont » (état civil) se réduit.
  const enseigne = /\b(de|du|des|le|la|les|aux?|au|chez|et|by)\b|['&]/i.test(clean);
  const out = enseigne ? clean : tokens.slice(0, 2).join(" ");
  return trimName(out) || clean;
}

// ── Adresse : rue + numéro seulement ────────────────────────────────────────
// « 12 Rue des Carmes, 40100 Dax, France » → « 12 Rue des Carmes ». La ville est
// déjà dite trois fois sur la page ; la répéter ici alourdit sans rien apporter.
export function adresseCourte(raw: string): string {
  const first = str(raw).split(",")[0];
  return first
    .replace(/\b\d{5}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;-]+|[\s,;-]+$/g, "")
    .trim();
}

// ── Nom de ville ────────────────────────────────────────────────────────────
// Il apparaît trois fois sur la page, dont deux au fil du texte (« Le Direct de
// Saint-Paul-lès-Dax »). Une capitalisation mot à mot donnerait « Saint-Paul-Lès-
// Dax » : les particules restent en bas de casse, sauf en tête de nom.
const PARTICULES = new Set(["de", "du", "des", "d", "la", "le", "les", "lès", "sur", "sous", "en", "et", "aux", "au", "l"]);

export function nomDeVille(raw: string): string {
  const s = str(raw).trim().toLowerCase();
  if (!s) return "";
  let premier = true;
  // On découpe sur les LETTRES seules, apostrophe exclue : « l'isle » compte
  // pour deux morceaux (« l » particule, « isle » nom) et donne « L'Isle », là
  // où un découpage incluant l'apostrophe donnait « L'isle ».
  return s.replace(/\p{L}+/gu, (mot) => {
    const out = !premier && PARTICULES.has(norm(mot)) ? mot : mot.charAt(0).toUpperCase() + mot.slice(1);
    premier = false;
    return out;
  });
}

// ── Famille d'annonces ──────────────────────────────────────────────────────
// Cette famille ne sert QU'À choisir le vocabulaire des trois exemples. Elle est
// volontairement distincte du profil déontologique (A/B/C/D) : « boulangerie » et
// « fleuriste » sont tous deux du commerce libre, mais on n'annonce pas une
// fournée comme on annonce un arrivage.
//
// Le découpage est fin — vingt-trois familles plutôt que quatre grands sacs —
// parce que ces trois phrases sont le seul endroit de la lettre où le commerçant
// se reconnaît. « Fournée de pain aux céréales » sur la lettre d'un fleuriste,
// et il comprend qu'il a reçu un prospectus. Le coût est de trois phrases par
// famille ; le bénéfice est la seule chose qui distingue cette lettre d'un
// publipostage.
export type FamilleAnnonce =
  | "boulangerie"
  | "boucherie"
  | "primeur"
  | "restaurant"
  | "cafe"
  | "caviste"
  | "gourmand"
  | "traiteur"
  | "coiffure"
  | "beaute"
  | "bienetre"
  | "sport"
  | "animaux"
  | "photo"
  | "evenementiel"
  | "mode"
  | "fleuriste"
  | "deco"
  | "bijouterie"
  | "librairie"
  | "auto"
  | "pressing"
  | "batiment"
  | "jardin"
  | "service"
  | "defaut";

// Les trois catégories sont TOUJOURS les mêmes, dans cet ordre. Les nommer dans
// le type plutôt que de les aligner dans un tableau rend structurellement
// impossible le défaut que le brief redoute : trois phrases qui, mises bout à
// bout, décrivent la même chose et ne démontrent plus l'étendue des usages.
export type TrioExemples = {
  /** Une place, un créneau, un rendez-vous qui se libère. */
  disponibilite: string;
  /** Quelque chose de prêt, arrivé, ou disponible maintenant. */
  produit: string;
  /** Quelque chose qui se passe à une date. */
  evenement: string;
};

export const EXEMPLES: Record<FamilleAnnonce, TrioExemples> = {
  // ── Bouche ────────────────────────────────────────────────────────────────
  boulangerie: {
    disponibilite: "Je prends encore des commandes de galettes pour dimanche.",
    produit: "Fournée de pain aux céréales à 16 h 30.",
    evenement: "Atelier pain avec les enfants samedi matin.",
  },
  boucherie: {
    disponibilite: "J'accepte encore des commandes de côte de bœuf pour samedi.",
    produit: "L'agneau de lait est arrivé ce matin.",
    evenement: "Dégustation de charcuterie samedi à 11 h.",
  },
  primeur: {
    disponibilite: "Il me reste quelques paniers de saison pour ce soir.",
    produit: "Premières fraises de la saison, arrivées ce matin.",
    evenement: "Marché de producteurs devant la boutique samedi.",
  },
  restaurant: {
    disponibilite: "Encore huit couverts ce soir.",
    produit: "Le plat du jour : magret, sauce aux figues.",
    evenement: "Soirée moules-frites vendredi à partir de 19 h.",
  },
  cafe: {
    disponibilite: "Encore de la place en terrasse cet après-midi.",
    produit: "Nouveau café d'Éthiopie à la carte depuis ce matin.",
    evenement: "Concert acoustique jeudi soir à 21 h.",
  },
  caviste: {
    disponibilite: "Je peux encore préparer des coffrets pour samedi.",
    produit: "Le nouveau millésime du domaine vient d'arriver.",
    evenement: "Dégustation avec le vigneron vendredi à 18 h.",
  },
  gourmand: {
    disponibilite: "Je prends encore des commandes de ballotins pour dimanche.",
    produit: "Nouveau parfum de la semaine : pistache-griotte.",
    evenement: "Atelier chocolat samedi après-midi.",
  },
  traiteur: {
    disponibilite: "Je suis encore disponible pour le week-end du 12.",
    produit: "Nouvelle carte de buffets froids à découvrir.",
    evenement: "Portes ouvertes dégustation samedi, de 10 h à 17 h.",
  },

  // ── Rendez-vous ───────────────────────────────────────────────────────────
  coiffure: {
    disponibilite: "Il me reste deux créneaux à 16 h et 17 h.",
    produit: "Nouvelle gamme de soins sans sulfate disponible.",
    evenement: "Journée relooking samedi, de 10 h à 17 h.",
  },
  beaute: {
    disponibilite: "Une place s'est libérée demain à 14 h.",
    produit: "Nouveau soin du visage à découvrir dès aujourd'hui.",
    evenement: "Après-midi découverte jeudi, de 14 h à 18 h.",
  },
  bienetre: {
    disponibilite: "Deux créneaux se sont libérés jeudi après-midi.",
    produit: "Nouvelle séance de relaxation sonore disponible.",
    evenement: "Atelier respiration samedi matin.",
  },
  sport: {
    disponibilite: "Il reste trois places au cours de 18 h 30.",
    produit: "Nouveau cours de pilates au planning dès lundi.",
    evenement: "Cours d'essai gratuit samedi à 10 h.",
  },
  animaux: {
    disponibilite: "J'ai deux rendez-vous de libre vendredi.",
    produit: "Nouveau forfait toilettage pour les petits gabarits.",
    evenement: "Journée conseils sur le pelage samedi matin.",
  },
  photo: {
    disponibilite: "Je suis encore libre le samedi 14.",
    produit: "Nouvelles séances portrait en extérieur disponibles.",
    evenement: "Séances photo de Noël les 6 et 7 décembre.",
  },
  evenementiel: {
    disponibilite: "Il me reste des dates en juin.",
    produit: "La nouvelle collection est arrivée en showroom.",
    evenement: "Journée essayages sur rendez-vous samedi.",
  },

  // ── Boutiques ─────────────────────────────────────────────────────────────
  mode: {
    disponibilite: "Retouches possibles cette semaine.",
    produit: "La nouvelle collection est en boutique ce matin.",
    evenement: "Vente privée jeudi soir, de 18 h à 21 h.",
  },
  fleuriste: {
    disponibilite: "Je peux encore livrer des bouquets cet après-midi.",
    produit: "Arrivage de lavande fraîche ce matin.",
    evenement: "Atelier composition florale samedi à 15 h.",
  },
  deco: {
    disponibilite: "Le fauteuil en vitrine est encore disponible.",
    produit: "Nouvelle série de vases artisanaux en boutique.",
    evenement: "Portes ouvertes samedi, de 10 h à 18 h.",
  },
  bijouterie: {
    disponibilite: "Je peux encore prendre des mises à taille cette semaine.",
    produit: "Nouvelle collection de bagues en argent en vitrine.",
    evenement: "Journée expertise de vos bijoux jeudi.",
  },
  librairie: {
    disponibilite: "Je peux commander un titre pour demain.",
    produit: "Le nouveau roman de la rentrée est arrivé.",
    evenement: "Dédicace de l'auteur samedi à 16 h.",
  },

  // ── Artisans & services ───────────────────────────────────────────────────
  auto: {
    disponibilite: "Deux places de libre cet après-midi.",
    produit: "Forfait révision hiver disponible dès lundi.",
    evenement: "Journée contrôle gratuit des freins samedi.",
  },
  pressing: {
    disponibilite: "Dépôt possible aujourd'hui, retrait demain midi.",
    produit: "Nouveau service de retouches sur cuir.",
    evenement: "Collecte de vêtements samedi toute la journée.",
  },
  batiment: {
    disponibilite: "J'ai une intervention de libre demain matin.",
    produit: "Nouveau service d'entretien annuel disponible.",
    evenement: "Je passe faire des devis dans le quartier jeudi.",
  },
  jardin: {
    disponibilite: "Il me reste une matinée libre cette semaine.",
    produit: "Contrat d'entretien de printemps disponible.",
    evenement: "Conseils taille au dépôt samedi matin.",
  },
  service: {
    disponibilite: "J'ai un créneau de libre demain après-midi.",
    produit: "Nouvelle prestation disponible dès aujourd'hui.",
    evenement: "Permanence sans rendez-vous samedi matin.",
  },

  defaut: {
    disponibilite: "Il me reste deux créneaux à 16 h et 17 h.",
    produit: "Fournée de pain aux céréales à 16 h 30.",
    evenement: "Portes ouvertes samedi, de 10 h à 17 h.",
  },
};

/** Contrôle demandé par le brief : un trio dont deux phrases se ressemblent ne
 *  démontre plus rien. Retourne la liste des familles fautives (vide = tout va
 *  bien). Appelé une fois au chargement du module. */
export function verifierExemples(): string[] {
  const problemes: string[] = [];
  for (const [famille, t] of Object.entries(EXEMPLES)) {
    const phrases = [t.disponibilite, t.produit, t.evenement].map((p) => norm(p));
    if (new Set(phrases).size !== 3) problemes.push(famille);
  }
  return problemes;
}
{
  const ko = verifierExemples();
  if (ko.length) console.error("[lettre] trio d'exemples invalide (doublon) :", ko.join(", "));
}

// L'ORDRE EST LA LOGIQUE. Le premier motif qui accroche gagne, donc le plus
// spécifique passe en premier : « brasserie artisanale » est un bar et doit
// être vu avant « brasserie » (restaurant) ; « salon de thé » doit être vu
// avant « salon » (coiffure) ; « esthétique automobile » avant « esthétique ».
// Déplacer une ligne, c'est changer le résultat — d'où les commentaires.
const FAMILLE_MATCH: Array<[FamilleAnnonce, RegExp]> = [
  // Pièges d'abord : ces libellés contiennent un mot qui appartient à une autre
  // famille et seraient mal classés s'ils passaient après.
  ["auto", /esthetique automobile|centre esthetique auto|detailing auto|lavage auto|station de lavage/],
  ["caviste", /brasserie artisanale|micro.?brasserie|cave a biere|taproom/],
  ["cafe", /salon de the|coffee|cafeteria/],

  // ── Bouche ────────────────────────────────────────────────────────────────
  ["boulangerie", /boulanger|patisser|viennoiser|biscuiter|\bpain\b/],
  ["boucherie", /boucher|charcut|triperie|rotisser|volailler/],
  ["primeur", /primeur|fruits et legumes|fromager|cremerie|epicerie|poissonner|\bmaree\b|producteur|\bmiel\b|\bferme\b/],
  ["traiteur", /traiteur/],
  ["caviste", /caviste|cave a vin|oenolog|spiritueux|\bvins\b/],
  ["gourmand", /chocolat|confiseur|glacier|torrefact|\bthe\b|salon de glace/],
  ["restaurant", /restaurant|\bresto\b|bistro|brasserie|pizzeria|creperie|gastronomi|kebab|sushi|burger|snack|food.?truck|cantine|\bgrill\b/],
  ["cafe", /\bcafe|\bbar\b|bar a |\bpub\b|brunch/],

  // ── Rendez-vous ───────────────────────────────────────────────────────────
  ["coiffure", /coiffeur|coiffure|coiffeuse|barbier|barber/],
  ["beaute", /esthetic|institut de beaute|onglerie|ongulaire|manucure|epilation|maquilleu|make.?up|bronzage|parfumerie|tatoueur|tatouage|tattoo/],
  // « sport » AVANT « bienetre » : les deux revendiquent le mot « coach », et
  // « coach sportif » n'annonce pas les mêmes choses qu'un coach de vie.
  ["sport", /salle de sport|fitness|musculation|yoga|pilates|\bdanse\b|coach sportif|crossfit|escalade|arts martiaux|\bboxe\b|natation|tennis|equitation/],
  ["bienetre", /\bspa\b|hammam|balneo|massage|bien.?etre|sophrolog|hypno|naturopath|reflexolog|energetic|relaxolog|meditation|nutrition|dietet|therapeut|\bcoach\b/],
  ["animaux", /toiletteur|toilettage|pension canine|pension pour|educateur canin|education canine|animalerie|garde d animaux/],
  ["photo", /photograph|studio photo|videast/],
  ["evenementiel", /wedding|organisateur de mariage|robe de mariee|robes de mariee|location de salle|decoration evenement/],

  // ── Boutiques ─────────────────────────────────────────────────────────────
  ["fleuriste", /fleurist|\bfleurs\b|jardinerie|horticult/],
  ["bijouterie", /bijouter|bijoutier|joailler|horloger|\bmontres?\b/],
  ["librairie", /librairie|papeterie|\bpresse\b|jouet|jeux|puericulture|disquaire|bande dessinee/],
  ["mode", /pret.a.porter|vetement|habillement|friperie|chaussure|maroquiner|sac a main|lingerie|\bmode\b|costume|chapelier|bijoux fantaisie/],
  ["deco", /decoration|deco maison|ameublement|luminaire|literie|vaisselle|arts de la table|linge de maison|brocante|antiquaire|galerie d art|cadeau|concept.?store|encadr/],

  // ── Artisans & services ───────────────────────────────────────────────────
  ["auto", /garag|carross|controle technique|mecanic|\bpneu|pare.?brise|concession|\bmotos?\b|\bvelos?\b|\bcycles?\b/],
  ["pressing", /pressing|blanchisser|laverie|repassage|cordonner|retouche|couturier|couture|mercerie/],
  ["batiment", /plombier|plomberie|electricien|electricite|serrurier|menuisier|menuiserie|peintre|couvreur|toiture|chauffagiste|climatis|ramoneur|macon|carreleur|platrier|batiment|renovation|vitrier|isolation|charpent|terrassement|antenniste|cle minute/],
  ["jardin", /paysagiste|jardinier|elagage|espaces verts|pisciniste|piscine|arboricult/],
  ["service", /auto.?ecole|\btaxi\b|\bvtc\b|demenag|informatique|imprimerie|serigraphie|enseigne|immobilier|assurance|\bbanque\b|reparation|depannage|conseiller en gestion|patrimoine|agence de/],
];

export function familleAnnonce(activite: string, label: string): FamilleAnnonce {
  // On teste le libellé catalogué ET l'activité brute : Google écrit souvent
  // « Boulangerie-pâtisserie » là où le catalogue ne connaît rien.
  const hay = `${norm(label)} ${norm(activite)}`;
  for (const [famille, re] of FAMILLE_MATCH) if (re.test(hay)) return famille;
  return "defaut";
}

// ── Sous-titre : ce qui est DÉJÀ dans son espace ────────────────────────────
//
// Le sous-titre n'énumère que des éléments VÉRIFIÉS sur la fiche. Les quatre
// formulations de référence nomment toutes les horaires — or la découverte en
// lot n'en récupère pas (le chemin « prérempli » du diagnostic écrit une liste
// vide). Exiger les horaires rendait donc toutes les lettres inimprimables.
//
// D'où deux jeux de formulations : celui de référence quand les horaires sont
// connus, et un jeu sans horaires sinon. Les éléments de repli sont ceux qu'on
// ne peut pas se tromper en affirmant — l'adresse figure sur la lettre, et les
// prestations comme la présentation sont générées par l'espace lui-même à
// partir du métier.
export function phraseContenu(photos: boolean, avis: boolean, horaires: boolean): string {
  if (horaires) {
    if (photos && avis) return "Vos photos, vos avis et vos horaires";
    if (photos) return "Vos photos, vos horaires et vos prestations";
    if (avis) return "Vos avis, vos horaires et vos prestations";
    return "Vos horaires, votre adresse et vos prestations";
  }
  if (photos && avis) return "Vos photos, vos avis et votre adresse";
  if (photos) return "Vos photos, votre adresse et vos prestations";
  if (avis) return "Vos avis, votre adresse et vos prestations";
  return "Votre adresse, vos prestations et votre présentation";
}

export type EditableField = { key: string; label: string; value: string; multiline?: boolean };

export type ExclusionLettre = {
  /** `deontologie` : profession réglementée. `donnees` : fiche trop pauvre. */
  raison: "deontologie" | "donnees";
  /** Phrase lisible pour le journal de campagne. */
  detail: string;
};

export type ComposedLetter = {
  /** Le recto, prêt à imprimer. Vide si `exclusion` est renseignée. */
  html: string;
  /** Renseignée = cette lettre ne doit pas être imprimée. */
  exclusion: ExclusionLettre | null;
  editableFields: EditableField[];
};

export async function composeLetterHtml(input: {
  place: Record<string, unknown>;
  overrides: Record<string, string>;
  slug: string;
  appUrl: string;
  /** Drapeau --no-solid-header : remplace l'aplat noir par un double filet. */
  sansAplat?: boolean;
}): Promise<ComposedLetter> {
  const { place, overrides, slug, appUrl, sansAplat = false } = input;

  const ov = (k: string, def: string) => {
    const v = overrides[k];
    return typeof v === "string" && v.trim() ? v.trim() : def;
  };

  const activite = str(place.activite);
  const mp = resolveMetier(activite);

  // ══ RÈGLE BLOQUANTE ═══════════════════════════════════════════════════════
  // Avant toute composition : si la profession est réglementée, on s'arrête là.
  // Aucune variante, aucun contournement. Une lettre pour ces profils reste à
  // écrire — ce ne sera pas une déclinaison de celle-ci : le message, l'argument
  // et le vocabulaire sont entièrement différents.
  const deonto = deontologieOf(activite);
  if (deonto !== "none") {
    return {
      html: "",
      exclusion: {
        raison: "deontologie",
        detail:
          deonto === "droit"
            ? `Profession du droit (${activite || "activité non renseignée"}) — publication d'annonces commerciales incompatible.`
            : `Profession de santé (${activite || "activité non renseignée"}) — publication d'annonces commerciales incompatible.`,
      },
      editableFields: [],
    };
  }

  const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  const ville = nomDeVille(str(place.city));
  const nomBrut = str(place.business_name);
  const nom = ov("display_name", usageName(nomBrut));
  const metier = capFirst(ov("display_metier", mp.entry?.label || activite).trim());
  const adresse = ov("display_adresse", adresseCourte(str(place.address)));

  const diag = (place.diagnostic && typeof place.diagnostic === "object" ? place.diagnostic : {}) as Record<string, unknown>;
  const nbPhotos = (Array.isArray(diag.photos) ? diag.photos : []).filter((p) => /^https?:\/\//i.test(str(p))).length;
  const nbHoraires = (Array.isArray(diag.horaires) ? diag.horaires : []).filter((h) => {
    const o = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
    return str(o.horaires).trim().length > 0;
  }).length;
  const nbAvis = typeof place.google_reviews === "number" ? place.google_reviews : 0;

  const aPhotos = nbPhotos > 0;
  const aAvis = nbAvis > 0;
  const aHoraires = nbHoraires > 0;

  // ══ DONNÉES INSUFFISANTES ═════════════════════════════════════════════════
  // Deux manques seulement, et ce sont les deux qui rendent la lettre fausse ou
  // indistribuable : sans nom, le bandeau ment ; sans adresse, personne ne sait
  // à quelle porte la remettre. Le reste du sous-titre s'adapte (cf.
  // phraseContenu) plutôt que d'écarter le prospect.
  const manques: string[] = [];
  if (nom.length < 2) manques.push("nom exploitable");
  if (!adresse) manques.push("adresse");
  if (manques.length) {
    return {
      html: "",
      exclusion: { raison: "donnees", detail: `Fiche incomplète — manque : ${manques.join(", ")}.` },
      editableFields: [],
    };
  }

  // Les trois exemples sont ce que le commerçant lit en premier dans le cadre :
  // c'est là qu'il se reconnaît, ou qu'il comprend qu'il a reçu un prospectus.
  // La famille les choisit, mais l'opérateur peut les réécrire — la catégorie
  // de chacun reste nommée dans le libellé du champ pour que les trois continuent
  // de couvrir trois usages différents.
  const famille = familleAnnonce(activite, mp.entry?.label || "");
  const trio = EXEMPLES[famille];
  const ex1 = ov("exemple_1", trio.disponibilite);
  const ex2 = ov("exemple_2", trio.produit);
  const ex3 = ov("exemple_3", trio.evenement);
  const exemples = [ex1, ex2, ex3].map((p) => `«&nbsp;${esc(p)}&nbsp;»`).join("<br>");

  // Le paragraphe suit la même règle que le sous-titre : on ne promet pas une
  // galerie à qui n'a pas de photo.
  const paraContenu = aPhotos
    ? `Nous l'avons construit à partir de votre fiche Google. <b>C'est votre vitrine en ligne</b> : vos clients y retrouvent vos photos et tout ce qu'ils cherchent, et <b>votre assistante répond à leurs questions</b> même quand vous êtes fermé.`
    : `Nous l'avons construit à partir de votre fiche Google. <b>C'est votre vitrine en ligne</b> : vos clients y trouvent tout ce qu'ils cherchent, et <b>votre assistante répond à leurs questions</b> même quand vous êtes fermé.`;

  const qr = await buildQr(qrTarget(appUrl, slug));

  const vars: Record<string, string> = {
    slug: esc(slug),
    nom_commerce: esc(nom),
    nom_taille: nom.length > 34 ? "xlong" : nom.length > 24 ? "long" : "",
    metier: esc(metier),
    adresse: esc(adresse),
    ville: esc(ville),
    phrase_contenu: `${esc(phraseContenu(aPhotos, aAvis, aHoraires))} <u>y sont déjà</u>.`,
    para_contenu: paraContenu,
    exemples,
    qr,
    band_mod: sansAplat ? "filet" : "",
  };

  const editableFields: EditableField[] = [
    { key: "display_name", label: "Nom affiché (bandeau)", value: nom },
    { key: "display_metier", label: "Métier affiché", value: metier },
    { key: "display_adresse", label: "Adresse affichée (rue + numéro)", value: adresse },
    { key: "exemple_1", label: `Exemple 1 — une disponibilité (famille : ${famille})`, value: ex1, multiline: true },
    { key: "exemple_2", label: "Exemple 2 — un produit du jour", value: ex2, multiline: true },
    { key: "exemple_3", label: "Exemple 3 — un événement à une date", value: ex3, multiline: true },
  ];

  return { html: injectVars(readTpl("lettre.html"), vars), exclusion: null, editableFields };
}

// La cible du QR, en UN seul endroit.
//
// Le brief la décrit comme `clikme.fr/{ville}/{commerce}`. Cette route n'existe
// pas encore ; on pointe donc sur l'aperçu réel, qui est exactement l'espace que
// la lettre annonce comme « déjà prêt ». Un QR qui ne mène nulle part est la
// pire panne possible sur un objet remis en main propre : on ne peut pas le
// rattraper, et le prospect ne revient pas. À basculer ici, et nulle part
// ailleurs, le jour où la route courte existe.
export function qrTarget(appUrl: string, slug: string): string {
  return `${String(appUrl).replace(/\/+$/, "")}/site-internet/apercu/${slug}`;
}

/** Agrégat d'un lot d'impression, pour le rapport de fin de campagne. */
export type RapportCampagne = {
  genere: number;
  exclu_deontologie: number;
  exclu_donnees: number;
  details: Array<{ slug: string; nom: string; raison: string; detail: string }>;
};

export function rapportVide(): RapportCampagne {
  return { genere: 0, exclu_deontologie: 0, exclu_donnees: 0, details: [] };
}

export function ajouterAuRapport(
  rapport: RapportCampagne,
  entree: { slug: string; nom: string; exclusion: ExclusionLettre | null }
): RapportCampagne {
  if (!entree.exclusion) {
    rapport.genere += 1;
    return rapport;
  }
  if (entree.exclusion.raison === "deontologie") rapport.exclu_deontologie += 1;
  else rapport.exclu_donnees += 1;
  rapport.details.push({
    slug: entree.slug,
    nom: entree.nom,
    raison: entree.exclusion.raison,
    detail: entree.exclusion.detail,
  });
  return rapport;
}
