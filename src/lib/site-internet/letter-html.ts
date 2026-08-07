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
export type FamilleAnnonce = "rdv" | "alimentaire" | "boutique" | "artisan" | "defaut";

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
  rdv: {
    disponibilite: "Il me reste deux créneaux à 16 h et 17 h.",
    produit: "Nouvelle prestation disponible dès aujourd'hui.",
    evenement: "Portes ouvertes samedi, de 10 h à 17 h.",
  },
  alimentaire: {
    disponibilite: "Encore huit couverts ce soir.",
    produit: "Fournée de pain aux céréales à 16 h 30.",
    evenement: "Dégustation à la boutique samedi à 18 h.",
  },
  boutique: {
    disponibilite: "Retouches possibles cette semaine.",
    produit: "Arrivage de lavande fraîche ce matin.",
    evenement: "Vente privée jeudi soir, de 18 h à 21 h.",
  },
  artisan: {
    disponibilite: "Deux places de libre cet après-midi.",
    produit: "Nouveau service disponible dès lundi.",
    evenement: "Atelier découverte samedi matin.",
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

// Ordre de test volontaire : les familles les plus spécifiques d'abord. « salon
// de thé » doit tomber dans « alimentaire » et non dans « rdv » à cause du mot
// « salon », « caviste » dans « alimentaire » et non dans « boutique ».
const FAMILLE_MATCH: Array<[FamilleAnnonce, RegExp]> = [
  [
    "alimentaire",
    /boulanger|patisser|viennoiser|boucher|charcut|traiteur|poissonner|primeur|fruits et legumes|fromager|cremerie|epicerie|caviste|cave a (vin|biere)|chocolat|confiseur|glacier|torrefact|restaurant|resto|bistro|brasserie|pizzeria|creperie|gastronomi|cafe|coffee|salon de the|brunch|bar a|snack|kebab|sushi|burger|food.?truck|biere|vin|miel|marche/,
  ],
  [
    "boutique",
    /fleurist|fleurs|jardinerie|decoration|deco maison|ameublement|bijouter|bijoutier|joailler|horloger|mode|pret.a.porter|vetement|friperie|chaussure|maroquiner|sac a main|librairie|papeterie|presse|jouet|puericulture|cadeau|concept.?store|mercerie|parfumerie|brocante|antiquaire|galerie d art|magasin|boutique|linge|literie|luminaire|vaisselle|arts de la table/,
  ],
  [
    "artisan",
    /garag|carross|controle technique|lavage auto|mecanic|pneu|pare.?brise|auto.?ecole|taxi|vtc|demenag|pressing|blanchisser|cordonner|couturier|retouche|plombier|plomberie|electricien|electricite|serrurier|menuisier|menuiserie|peintre|couvreur|toiture|chauffagiste|climatis|ramoneur|macon|carreleur|platrier|batiment|renovation|paysagiste|pisciniste|jardinier|elagage|informatique|reparation|depannage|imprimerie|enseigne|serigraphie|cle minute|vitrier|antenniste|piscine/,
  ],
  [
    "rdv",
    /coiffeur|coiffure|coiffeuse|barbier|barber|esthetic|institut de beaute|onglerie|ongulaire|manucure|epilation|maquilleu|make.?up|spa|hammam|balneo|massage|bien.?etre|bronzage|tatoueur|tatouage|tattoo|sophrolog|hypno|naturopath|reflexolog|energetic|coach|yoga|pilates|danse|salle de sport|fitness|musculation|toiletteur|toilettage|pension canine|educateur canin|photograph|studio photo|wedding|mariage|osteo|dietetic|nutrition|acupunct|conseiller en gestion|patrimoine/,
  ],
];

export function familleAnnonce(activite: string, label: string): FamilleAnnonce {
  // On teste le libellé catalogué ET l'activité brute : Google écrit souvent
  // « Boulangerie-pâtisserie » là où le catalogue ne connaît rien.
  const hay = `${norm(label)} ${norm(activite)}`;
  for (const [famille, re] of FAMILLE_MATCH) if (re.test(hay)) return famille;
  return "defaut";
}

// ── Sous-titre : ce qui est DÉJÀ dans son espace ────────────────────────────
// Les quatre formulations mentionnent toutes les horaires : c'est le seul
// élément commun aux quatre lignes de la table. Sans horaires sur la fiche,
// aucune n'est vraie — d'où l'exclusion pour données insuffisantes plus bas,
// plutôt qu'une cinquième formulation bricolée.
export function phraseContenu(photos: boolean, avis: boolean): string {
  if (photos && avis) return "Vos photos, vos avis et vos horaires";
  if (photos) return "Vos photos, vos horaires et vos prestations";
  if (avis) return "Vos avis, vos horaires et vos prestations";
  return "Vos horaires, votre adresse et vos prestations";
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
  const manques: string[] = [];
  if (nom.length < 2) manques.push("nom exploitable");
  if (!adresse) manques.push("adresse");
  if (!aHoraires) manques.push("horaires (le sous-titre les affirme dans les quatre cas)");
  if (manques.length) {
    return {
      html: "",
      exclusion: { raison: "donnees", detail: `Fiche incomplète — manque : ${manques.join(", ")}.` },
      editableFields: [],
    };
  }

  const trio = EXEMPLES[familleAnnonce(activite, mp.entry?.label || "")];
  const exemples = [trio.disponibilite, trio.produit, trio.evenement]
    .map((p) => `«&nbsp;${esc(p)}&nbsp;»`)
    .join("<br>");

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
    phrase_contenu: `${esc(phraseContenu(aPhotos, aAvis))} <u>y sont déjà</u>.`,
    para_contenu: paraContenu,
    exemples,
    qr,
    band_mod: sansAplat ? "filet" : "",
  };

  const editableFields: EditableField[] = [
    { key: "display_name", label: "Nom affiché (bandeau)", value: nom },
    { key: "display_metier", label: "Métier affiché", value: metier },
    { key: "display_adresse", label: "Adresse affichée (rue + numéro)", value: adresse },
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
