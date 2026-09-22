#!/usr/bin/env node
// 👤 L'APRÈS DU PANNEAU DE GAUCHE — fabriqué par le moteur du produit lui-même.
//
// ═══ LE PROBLÈME QUE CE SCRIPT RÈGLE ════════════════════════════════════════
//
// L'écran d'accroche du relooking montre deux panneaux : un rayon homme et un
// rayon femme. Celui de droite porte un vrai avant-après — la même personne,
// même cadrage, avant et après. Celui de gauche porte un portrait sans coupure,
// parce qu'il n'existe aucun couple équivalent pour un homme dans le dépôt.
//
// ET ON NE VA PAS EN CHERCHER UN. Coller deux inconnus l'un à côté de l'autre
// donnerait exactement ce qu'on reproche partout ailleurs : un avant-après de
// deux personnes différentes, qui ne prouve rien. C'est un refus, pas un
// manque de temps.
//
// ═══ LA TROISIÈME VOIE, ET ELLE EST MEILLEURE QUE LA PHOTO TROUVÉE ══════════
//
// ON A DÉJÀ UN PORTRAIT D'HOMME — `coiffure-homme-face.jpg` — ET ON A LE
// MOTEUR. Le rendu qui sort d'ici n'est pas un montage : c'est la VRAIE SORTIE
// DE CLIKME sur une vraie photo, obtenue par la route que les clients
// utilisent, avec la même consigne, les mêmes garde-fous de fidélité au visage
// et les mêmes fournisseurs. C'est un argument plus fort que la photo de stock
// du panneau d'en face : celle-ci, l'application l'a faite.
//
// ON PASSE DONC PAR LA ROUTE, ET PAS DIRECTEMENT PAR LE FOURNISSEUR. Appeler
// l'API d'images à la main donnerait une image ressemblante obtenue autrement —
// donc une image dont on ne pourrait plus dire qu'elle vient du produit. Tout
// l'intérêt est là : voir `app/api/direct/essayer/route.ts`, qui porte la
// consigne, le masque du visage, l'ordre des fournisseurs et le repli.
//
// ═══ CE QU'IL FAUT POUR LE LANCER ═══════════════════════════════════════════
//
//   1. Une clé d'image dans l'environnement : GEMINI_API_KEY (ou GOOGLE_API_KEY),
//      ou OPENAI_API_KEY. Sans elle la route répond 503 et ce script s'arrête en
//      le disant — il ne fabrique rien d'approchant.
//   2. L'application qui tourne :  npx next dev --webpack -p 3821
//   3.  node scripts/fabriquer-apres-homme.mjs
//
// Il écrit UN SEUL fichier : `public/direct/accueil/mode-homme-apres.jpg`.
// L'avant reste le portrait d'origine, qui est déjà là et ne bouge pas — c'est
// ce qui garantit que les deux moitiés sont la même personne, au même cadrage.
//
// ET L'ÉCRAN LE PREND TOUT SEUL. Il n'y a rien à rebrancher après : l'accroche
// essaie de charger ce fichier, se coupe en deux quand il répond, et garde le
// portrait entier quand il manque. Voir `rl-avap` dans `relooking-contenu.tsx`.

import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import sharp from "sharp";

const PORT = process.env.PORT_CLIKME || "3821";
const ROUTE = `http://localhost:${PORT}/api/direct/essayer`;

/** L'avant : le portrait qui est déjà dans le dépôt, et qui ne bouge pas. */
const AVANT = "public/direct/coiffure-homme-face.jpg";

/**
 * LA PIÈCE QU'ON LUI POSE, ET POURQUOI CELLE-LÀ.
 *
 * UNE VESTE, PAS UN COSTUME NI UN TEE-SHIRT. Il faut que la différence se voie
 * en vignette, à cent quatre-vingt-quinze points de large : un changement
 * subtil ne prouverait rien à cette taille, et c'est précisément ce que ce
 * panneau doit prouver. La veste cirée kaki a un col marqué et une couleur
 * franche — elle se lit d'un coup d'œil.
 *
 * ET `decrire` EST UNE CIBLE, PAS UNE DEVINETTE. C'est la leçon qui a coûté le
 * plus cher sur l'essayage : « reproduis ce que montre l'image 2 » demande au
 * modèle de DÉDUIRE puis de poser, et quand la déduction rate il se rabat sur
 * ce qu'il sait faire — refabriquer un portrait. Voir `decrire` dans
 * `lib/direct/fantomes.ts`.
 */
const PIECE = "public/direct/homme-veste-ciree-kaki.jpg";
const DECRIRE =
  "une veste cirée kaki à col en velours côtelé, portée ouverte sur un pull uni";

const SORTIE = "public/direct/accueil/mode-homme-apres.jpg";

function enDonnees(chemin) {
  if (!existsSync(chemin)) {
    console.error(`✗ Fichier introuvable : ${chemin}`);
    process.exit(1);
  }
  const type = chemin.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${type};base64,${readFileSync(chemin).toString("base64")}`;
}

/**
 * CE QU'ON INTERDIT AU MODÈLE DE TOUCHER.
 *
 * LE VISAGE D'ABORD, ET C'EST LE DÉFAUT LE PLUS GRAVE QU'UN ESSAI PUISSE
 * AVOIR : « ce n'est pas exactement ma tête, donc assez déçu ». Il annule le
 * sens de l'exercice — si ce n'est pas lui, l'image ne dit rien de lui, et ce
 * panneau ne prouve plus rien du tout. Même liste que `consigneDuLook` pour le
 * poste « mode », à la lettre près.
 */
const GARDER = [
  "les traits du visage, l’âge et la carnation, à l’identique",
  "la pose, le cadrage et le fond",
  "la coiffure et la couleur des cheveux",
  "les lunettes, ou leur absence",
];

const corps = {
  photo: enDonnees(AVANT),
  reference: enDonnees(PIECE),
  partie: "le buste",
  garder: GARDER,
  change: "les vêtements",
  decrire: DECRIRE,
};

console.log(`→ ${ROUTE}`);
console.log(`  avant   : ${AVANT}`);
console.log(`  pièce   : ${PIECE}`);
console.log(`  sortie  : ${SORTIE}\n`);

let reponse;
try {
  reponse = await fetch(ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
} catch (e) {
  console.error("✗ L’application ne répond pas sur le port " + PORT + ".");
  console.error("  Lancez-la d’abord :  npx next dev --webpack -p " + PORT);
  console.error("  (" + e.message + ")");
  process.exit(1);
}

const dit = await reponse.json().catch(() => ({}));

/**
 * SANS CLÉ, ON S'ARRÊTE ET ON LE DIT.
 *
 * ON NE FABRIQUE RIEN D'APPROCHANT, et c'est la règle de la route elle-même :
 * « mieux vaut un essai indisponible qu'un essai raté ». Un panneau de gauche
 * qui montre un à-peu-près est pire que le portrait entier qu'il remplace —
 * celui-ci ne promet rien, l'autre promettrait faux.
 */
if (reponse.status === 503) {
  console.error("✗ " + (dit.erreur ?? "L’essayage n’est pas configuré."));
  console.error("  " + (dit.pourquoi ?? ""));
  console.error("\n  Posez une clé dans l’environnement, puis relancez :");
  console.error("    GEMINI_API_KEY=…   (ou GOOGLE_API_KEY, ou OPENAI_API_KEY)");
  console.error("\n  Sans clé, rien n’est écrit : l’accroche garde le portrait");
  console.error("  entier, qui ne promet rien plutôt que de promettre faux.");
  process.exit(2);
}

if (!reponse.ok || !dit.image) {
  console.error(`✗ La route a répondu ${reponse.status}.`);
  console.error("  " + JSON.stringify(dit).slice(0, 400));
  process.exit(1);
}

/**
 * ON RÉÉCRIT EN JPEG, ET CE N'EST PAS DE LA COQUETTERIE.
 *
 * LES DEUX FOURNISSEURS RENDENT DU PNG — voir les deux `data:image/png` dans la
 * route. Écrire ces octets-là sous un nom en `.jpg` marcherait : les
 * navigateurs reniflent le contenu et l'afficheraient quand même. Mais le nom
 * mentirait, et c'est le genre de petit mensonge qu'on retrouve six mois plus
 * tard dans un outil qui, lui, fait confiance à l'extension.
 *
 * ET UN PORTRAIT EN PNG PÈSE TROIS À CINQ FOIS PLUS LOURD QUE LE MÊME EN JPEG,
 * pour une vignette de cent quatre-vingt-quinze points de large où la
 * différence ne se voit pas. C'est la première image de tout le parcours :
 * elle n'a pas à coûter un mégaoctet.
 */
const base64 = String(dit.image).replace(/^data:[^,]+,/, "");
mkdirSync(dirname(SORTIE), { recursive: true });
await sharp(Buffer.from(base64, "base64")).jpeg({ quality: 86 }).toFile(SORTIE);

console.log(`✓ Écrit : ${SORTIE}`);
console.log("\n  REGARDEZ-LE AVANT DE LE GARDER. Un rendu qui a changé le");
console.log("  visage est à jeter : ce panneau doit prouver « même vous,");
console.log("  juste une nouvelle version », et un inconnu prouve le");
console.log("  contraire. Supprimez le fichier et l’écran reprend le");
console.log("  portrait entier, sans rien toucher au code.");
