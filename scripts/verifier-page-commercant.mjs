// 🏪 LA PAGE D'UN COMMERÇANT — les quatre promesses qu'elle ne doit jamais rompre.
//
// ═══ POURQUOI CETTE GARDE EXISTE ═══════════════════════════════════════════
//
// « Il va falloir que les pages d'accueil des commerçants deviennent le style
// exact de /autour-de-moi/boutique […] et les screenshots sont forcément
// maintenant différents : pour un magasin de vêtements ou une onglerie, ça
// sera différent que pour un restaurant. »
//
// CETTE PAGE PORTE LE NOM DE QUELQU'UN. C'est ce qui la rend différente de
// toutes les autres du dépôt : une phrase fausse y est une phrase fausse SUR
// UN COMMERÇANT DE DAX, sur l'adresse qu'il envoie à ses clients. Le jour où
// elle est devenue la boutique, elle a hérité du pied de page de la maquette —
// « ce commerce est inventé, ses photos sont des illustrations » — et personne
// ne l'aurait vu avant lui.
//
// ═══ CE QU'ELLE VÉRIFIE, ET POURQUOI CHACUNE EST UNE PROMESSE ══════════════
//
//   1 · Chaque métier raconte SON essai. Coiffeur, onglerie, restaurant et
//       mode ne doivent pas dire la même chose — c'est la demande, mot pour
//       mot. Comparé sur le TEXTE de la page, jamais sur un sélecteur : un
//       gabarit se redessine, ce qu'il promet ne change pas.
//
//   2 · Ce qui est inventé le dit. Les adresses de démonstration montrent des
//       commerces qui n'existent pas ; l'avouer est la condition pour avoir le
//       droit de les montrer.
//
//   3 · Et cet aveu ne peut pas fuir sur un vrai commerce. On ne peut pas
//       ouvrir la page d'un vrai prospect ici (pas de clés Supabase), alors on
//       vérifie la seule chose qui soit vérifiable sans lui : que la phrase
//       n'existe qu'à UN endroit du dépôt, et sous condition.
//
//   4 · La demande de démarchage ne s'adresse jamais à un client. « Garder
//       cette page gratuitement » parle au commerçant ; un habitant venu du
//       Direct qui le lit voit son commerçant se vendre son propre site.
//
//   node scripts/verifier-page-commercant.mjs [port]

import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import { readFileSync } from "node:fs";

const PORT = process.argv[2] ?? "3821";
const BASE = `http://127.0.0.1:${PORT}`;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

/**
 * ═══ ON ATTEND LA CONVERSATION, PLUS UN CHRONOMÈTRE ═══════════════════════
 *
 * CES DEUX PROMESSES SE SONT MISES À TOMBER SANS QUE RIEN NE CASSE. Le lien
 * d'invitation ne change que la requête de l'adresse : le navigateur RECHARGE
 * donc la page entière, et en développement ce rechargement recompile. Les
 * `waitForTimeout(1200)` et `(900)` qui suivaient le clic dataient d'une page
 * plus petite ; l'application a grossi, la recompilation a dépassé la seconde,
 * et la garde a commencé à mesurer un écran qui n'était pas encore là.
 *
 * VÉRIFIÉ AVANT DE CORRIGER : la même page ouverte directement sur `?salon=1`
 * montre la conversation, et le même clic suivi de quatre secondes d'attente
 * aussi. Ce n'était donc pas le produit. Une garde qui échoue à tort est pire
 * qu'une garde absente — on apprend à ne plus la croire, et le jour où elle a
 * raison, personne n'écoute.
 *
 * ON ATTEND DONC CE QU'ON MESURE. `waitForSelector` rend la main dès que la
 * conversation est là, et la garde échoue quand même si elle ne vient jamais :
 * le verdict est le même, la patience n'est plus une constante écrite à la
 * main. Le délai reste borné — c'est une garde, pas une attente infinie.
 */
async function ouvrirLInvitation(p) {
  await p.click(".bq-salon-o");
  try {
    await p.waitForSelector(".bq-conv", { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

const METIERS = [
  { slug: "demo-coiffeur", mot: /coup|cheveu|t[êe]te|coiff/i },
  { slug: "demo-onglerie", mot: /ongle|pose|main/i },
  { slug: "demo-restaurant", mot: /go[ûu]t|plat|table|carte/i },
  { slug: "demo-mode", mot: /pi[èe]ce|essay|porter|taille/i },
];

const nav = pw.chromium;
const b = await nav.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

// ── 1. CHAQUE MÉTIER RACONTE SON ESSAI ─────────────────────────────────────
//
// On lit le texte de la page en VISITEUR (`via=direct`) : c'est la version que
// ses clients voient, donc celle dont le contenu doit être propre au métier.
// Les textes sont ensuite comparés deux à deux — deux métiers qui rendraient
// exactement la même page signifieraient que le gabarit a écrasé le métier,
// ce qui est précisément ce qu'il ne veut pas.
const textes = new Map();
for (const m of METIERS) {
  const r = await p.goto(`${BASE}/site-internet/apercu/${m.slug}?via=direct`, { waitUntil: "networkidle" });
  dire(r?.status() === 200, `${m.slug} s'ouvre`);
  await p.waitForTimeout(900);
  const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
  textes.set(m.slug, t);
  dire(m.mot.test(t), `${m.slug} parle dans les mots de son métier (${m.mot})`);
}
const slugs = [...textes.keys()];
let jumeaux = 0;
for (let i = 0; i < slugs.length; i++) {
  for (let j = i + 1; j < slugs.length; j++) {
    if (textes.get(slugs[i]) === textes.get(slugs[j])) {
      jumeaux++;
      console.log(`       ${slugs[i]} et ${slugs[j]} rendent un texte identique`);
    }
  }
}
dire(jumeaux === 0, "aucun couple de métiers ne rend la même page");

// ── 2. CE QUI EST INVENTÉ LE DIT ───────────────────────────────────────────
const aveu = /ce commerce est invent[ée]/i;
dire(aveu.test(textes.get("demo-coiffeur")), "une adresse de démonstration avoue qu'elle est inventée");

// ── 3. ET L'AVEU NE PEUT PAS FUIR SUR UN VRAI COMMERCE ─────────────────────
//
// La page d'un vrai prospect ne s'ouvre pas ici — il faudrait les clés de la
// base. On vérifie donc la chose qui rend la fuite IMPOSSIBLE plutôt que son
// absence : la phrase n'est écrite qu'une fois dans tout le dépôt, et elle est
// gardée par une condition. Écrite deux fois, ou posée sans condition, elle
// finirait un jour sous le nom de quelqu'un.
const bq = readFileSync(new URL("../src/app/autour-de-moi/boutique/boutique.tsx", import.meta.url), "utf8");
// Les commentaires CITENT la phrase pour expliquer le piège — c'est même leur
// travail. On ne compte donc que ce qui s'affiche : le fichier sans ses
// commentaires de bloc ni ses lignes de commentaire.
const codeSeul = bq.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const fois = (codeSeul.match(/ce commerce est invent/gi) || []).length;
// DEUX, ET PAS TROIS : le pied de page, et le panneau de réservation qui
// prévient qu'un numéro de fiction ne joint personne. Les deux sont légitimes
// et les deux sont sous condition — c'est une TROISIÈME qui serait le danger.
dire(fois === 2, `la phrase « ce commerce est inventé » n'est écrite que là où elle est gardée (${fois})`);
dire(/piedMaquette &&\s*\(/.test(bq), "le pied de page est posé sous condition, jamais d'office");
// ET LE NUMÉRO DE FICTION NE PEUT PLUS FUIR NON PLUS. La recherche du commerce
// ne regardait que le paquet de démonstration : sur la page d'un vrai
// commerçant elle ne trouvait rien, et le panneau de réservation annonçait au
// client que son commerce était inventé. Le commerce de la page passe devant.
dire(
  /const carteDe = \(cle: string\) => \(c\.id === cle \? c :/.test(bq),
  "la recherche d'un commerce regarde d'abord celui de la page",
);
dire(
  !/const v = cartes\.find\(\(x\) => x\.id === pieceVue\.carte\)/.test(bq),
  "plus personne ne cherche la pièce dans le seul paquet de démonstration",
);

// ── 4. LA DEMANDE DE DÉMARCHAGE NE S'ADRESSE JAMAIS À UN CLIENT ────────────
const garder = /garder cette page gratuitement/i;
dire(!garder.test(textes.get("demo-coiffeur")), "un visiteur venu du Direct ne lit pas « Garder cette page »");

await p.goto(`${BASE}/site-internet/apercu/demo-coiffeur`, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
const vuPro = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
dire(garder.test(vuPro), "le commerçant, lui, la lit");
// Et elle arrive APRÈS la page, pas au milieu : c'est « garder le formulaire
// seul », tout en bas, une fois la démonstration finie.
const rang = await p.evaluate(() => {
  const f = document.querySelector(".gcs");
  const bqEl = document.querySelector(".bq");
  if (!f || !bqEl) return -1;
  return f.compareDocumentPosition(bqEl) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
});
dire(rang === 1, "la demande est sous la boutique, jamais au milieu");

// ── 5. LES DEUX BOUTONS DE LA RANGÉE DE RÉASSURANCE FONT QUELQUE CHOSE ─────
//
// « Ça ne fait rien quand on clique dessus. » Les deux échouaient en silence :
// l'un défilait vers le haut de la page, l'autre vers une ancre absente. Une
// garde qui vérifie leur PRÉSENCE n'aurait rien vu — ils étaient là, dessinés,
// et ils ne répondaient pas. On mesure donc ce qu'ils PRODUISENT.
await p.goto(`${BASE}/site-internet/apercu/demo-coiffeur?via=direct`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);

await p.evaluate(() => {
  const b2 = [...document.querySelectorAll(".bq-fin-l button")].find((e) => /rendez-vous|réserver|côté/i.test(e.textContent || ""));
  b2?.click();
});
await p.waitForTimeout(700);
const ecrit = await p.evaluate(() => document.querySelector(".bq-salon q")?.textContent || "");
dire(/bonjour/i.test(ecrit) && ecrit.includes("Un salon du centre"), "le geste du métier prépare un vrai message, nommant le commerce");
// LE MESSAGE NE FIXE NI JOUR NI HEURE : la page ne connaît pas son agenda, et
// annoncer « samedi 15 h » l'engagerait sur un créneau qu'il n'a peut-être pas.
dire(!/\b\d{1,2}\s*h\b|samedi|lundi|demain/i.test(ecrit), "et il ne promet aucun créneau à sa place");
await p.evaluate(() => document.querySelector(".bq-voile")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
await p.waitForTimeout(400);

const bouge = await p.evaluate(async () => {
  const avant = window.scrollY;
  [...document.querySelectorAll(".bq-fin-l button")].find((e) => /on en parle bien/i.test(e.textContent || ""))?.click();
  await new Promise((r) => setTimeout(r, 1500));
  return Math.abs(window.scrollY - avant);
});
dire(bouge > 200, `« On en parle bien » mène quelque part (${Math.round(bouge)} px)`);
dire(
  await p.evaluate(() => Boolean(document.querySelector(".bq-gg"))),
  "et ce qu'on y trouve, ce sont ses avis Google, en toutes lettres",
);

// ── 6. LA VISITE NE DÉPASSE PAS SEPT ÉTAPES, ET PARLE DE SON MÉTIER ────────
//
// « À partir de l'étape 6 c'est beaucoup trop long, une seule étape suffit
// pour avoir au total 7 étapes maximum. » — et « tout à coup la démo était
// faite pour un restaurateur ».
//
// ON LIT LE COMPTEUR ET LES MOTS, pas la liste des actes : une garde qui
// compterait les `steps.push` du code serait vraie même le jour où l'écran
// n'affiche plus rien.
for (const slug of ["demo-coiffeur", "demo-mode"]) {
  await p.goto(`${BASE}/site-internet/apercu/${slug}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.click(".dtour-launch .go");
  let total = null;
  const dits = [];
  for (let i = 0; i < 90; i++) {
    await p.waitForTimeout(350);
    const v = await p.evaluate(() => ({
      s: document.querySelector(".dt-step")?.textContent || "",
      c: document.body.innerText.replace(/\s+/g, " "),
    }));
    const m = v.s.match(/Étape\s+(\d+)\s*\/\s*(\d+)/);
    if (m) total = Number(m[2]);
    dits.push(v.c);
  }
  const tout = dits.join(" ");
  dire(total !== null && total <= 7, `${slug} : la visite annonce ${total} étapes (7 au plus)`);
  // LE FIL DE LA VILLE ÉTAIT CINQ RESTAURANTS POUR TOUT LE MONDE. Un coiffeur
  // voyait un menu à 19 € et un panneau de réservation de table.
  dire(!/menu du jour|magret|garbure|19 €|réserver une table/i.test(tout), `${slug} : et rien du restaurant d'en face`);
}

// ── 7. LE SALON S'OUVRE DE LA PAGE, ET RAMÈNE CHEZ LE COMMERÇANT ──────────
//
// « Il manque la possibilité d'ouvrir un salon pour parler et inviter nos
// amis à parler du produit ou service du commerçant, et depuis ce salon
// ouvrir les essayages et les mettre dans ce salon pour chaque personne du
// salon pour en discuter. »
//
// LE CHEMIN TRAVERSE DEUX PAGES, et c'est ce qui le rend fragile : la page du
// commerçant écrit un salon, l'application le lit. Chaque moitié peut marcher
// seule pendant que le passage entre les deux est cassé — c'est exactement ce
// qui est arrivé au bouton « On en parle bien ». On marche donc le chemin.
await p.goto(`${BASE}/site-internet/apercu/demo-coiffeur?via=direct`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const porte = await p.evaluate(() =>
  Boolean([...document.querySelectorAll(".bq-fin-l button")].find((e) => /en parler avec mes amis/i.test(e.textContent || ""))),
);
dire(porte, "la page offre d'en parler avec ses amis");

await p.evaluate(() => {
  [...document.querySelectorAll(".bq-fin-l button")].find((e) => /en parler avec mes amis/i.test(e.textContent || ""))?.click();
});
await p.waitForTimeout(600);
// REGARDER UN ÉCRAN N'OUVRE PAS UNE CONVERSATION. Un salon créé parce que
// quelqu'un a ouvert un panneau serait un salon vide que personne n'a demandé.
const avant = await p.evaluate(() => {
  try { return Object.keys(JSON.parse(localStorage.getItem("clikme-salons-v1") || "{}")).filter((k) => k.startsWith("boutique-")).length; }
  catch { return -1; }
});
dire(avant === 0, "et ne crée rien tant qu'on n'a rien demandé");

const lien = await p.evaluate(() => document.querySelector(".bq-salon-o")?.getAttribute("href") || "");
// ═══ CETTE VÉRIFICATION A DÛ ÊTRE RÉÉCRITE, ET C'EST LA LEÇON ═════════════
//
// Elle exigeait que le lien mène à `/autour-de-moi?salon=boutique-…`, parce
// que c'est là que la conversation vivait. Elle décrivait donc une
// IMPLÉMENTATION, et elle est tombée au premier changement de dessin — en
// affirmant d'ailleurs le contraire de ce qu'il demandait : « ça ouvre un
// salon sur l'app au lieu de l'ouvrir sur la page du commerçant ».
//
// LA PROMESSE, ELLE, N'A PAS BOUGÉ : une seule conversation par commerce, et
// on ne quitte pas sa page pour y accéder. C'est ce qu'on mesure maintenant.
dire(/\/site-internet\/apercu\/demo-coiffeur\?salon=/.test(lien), `l'invitation reste sur la page du commerçant (${lien})`);
dire(await ouvrirLInvitation(p), "et la conversation s'ouvre par-dessus, sans départ");
// UN SEUL SALON PAR COMMERCE : deux essais du même commerce doivent se
// retrouver au même endroit, sinon quatre amis parlent dans quatre fils.
const cles = await p.evaluate(() => {
  try { return Object.keys(JSON.parse(localStorage.getItem("clikme-salons-v1") || "{}")).filter((k) => k.startsWith("boutique-")); }
  catch { return []; }
});
dire(cles.length === 1 && cles[0] === "boutique-coif-centre", `un seul salon, celui du commerce (${cles.join(", ") || "aucun"})`);

// ── 8. LA PAGE D'UN PROSPECT, CELLE QU'ON ENVOIE VRAIMENT ─────────────────
//
// TOUT CE QUI PRÉCÈDE SE JOUE SUR DES COMMERCES HABITÉS — moments, catalogue,
// voix, avis laissés sur place. La page d'un VRAI commerçant se fabrique
// depuis sa seule fiche Google, et c'est un autre écran : il a fallu qu'il
// ouvre celle d'un coiffeur de Dax pour qu'on découvre quatre défauts qui
// n'existaient QUE sur ce chemin-là. `demo-prospect` passe par le même pont
// que la vraie — voir `fiches-demo.ts`.
const P = `${BASE}/site-internet/apercu/demo-prospect?via=direct`;
await p.goto(P, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

// « Je ne vois pas de photo en couverture. »
const couverture = await p.evaluate(() => {
  const i = document.querySelector(".bq-hero img");
  return i ? i.naturalWidth * i.naturalHeight : 0;
});
dire(couverture > 0, "un prospect a une photo de couverture, qui se charge vraiment");

// « Il manque aussi sur cette page commerçant : Les prestations. »
const presta = await p.evaluate(() => {
  const s = document.getElementById("carte");
  return s ? { lignes: s.querySelectorAll("li").length, t: s.innerText } : null;
});
dire(Boolean(presta && presta.lignes > 0), `le chapitre des prestations existe (${presta?.lignes ?? 0} lignes)`);
// ET IL DIT QUE CE SONT DES PROPOSITIONS. Sans cette ligne on présenterait un
// gabarit de métier comme SA carte, sur la page qui porte son nom.
dire(/propos[ée]/i.test(presta?.t ?? ""), "et il dit que ces lignes sont proposées, pas déclarées");
// AUCUN TARIF INVENTÉ : c'est la ligne à ne pas franchir. Un nom de prestation
// est le nom d'un métier ; un prix est une promesse commerciale.
dire(!/\d+\s*€/.test(presta?.t ?? ""), "et il n'affiche aucun tarif qu'il n'a pas donné");

// « Et aussi la possibilité de voir tous les avis. »
dire(
  await p.evaluate(() => Boolean(document.querySelector(".bq-gg-tous"))),
  "on peut aller lire tous ses avis, pas seulement les quatre montrés",
);

// ── 9. LA CONVERSATION RESTE SUR LA PAGE DU COMMERÇANT ────────────────────
//
// « Ça ouvre un salon sur l'app au lieu de l'ouvrir sur la page du commerçant
// spécifiquement. » Un habitant venu d'un lien WhatsApp n'a rien à faire dans
// la maquette de l'application : on le sortait de la boutique qu'il regardait
// pour l'envoyer dans un écran dont il ignore tout.
await p.evaluate(() => {
  [...document.querySelectorAll(".bq-fin-l button")].find((e) => /en parler avec mes amis/i.test(e.textContent || ""))?.click();
});
await p.waitForTimeout(500);
const invitation = await p.evaluate(() => document.querySelector(".bq-salon-o")?.getAttribute("href") || "");
dire(/\/site-internet\/apercu\/demo-prospect\?salon=/.test(invitation), `l'invitation mène sur la page du commerçant (${invitation})`);
dire(await ouvrirLInvitation(p), "et la conversation s'ouvre là, sans quitter la page");

await p.fill(".bq-conv-b input", "Vous en pensez quoi ?");
await p.click(".bq-conv-b button");
await p.waitForTimeout(600);
dire(
  (await p.evaluate(() => document.querySelector(".bq-conv-m.moi p")?.textContent || "")) === "Vous en pensez quoi ?",
  "on y écrit, et le message reste",
);

// L'AMI INVITÉ ARRIVE PAR CE LIEN, ET IL N'EST PAS LE PROSPECT. Sans origine
// connue, la page le prenait pour le commerçant : visite guidée par-dessus
// l'écran et « Garder cette page gratuitement » en pied. Il voyait donc son
// commerçant se vendre son propre site.
await p.goto(invitation.startsWith("http") ? invitation : `${BASE}${invitation}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
dire(await p.evaluate(() => Boolean(document.querySelector(".bq-conv"))), "l'invité arrive sur la conversation, déjà ouverte");
dire(
  await p.evaluate(() => !document.querySelector(".dtour-launch") && !document.querySelector(".gcs")),
  "et il ne reçoit ni la visite guidée ni l'argumentaire adressés au commerçant",
);

await b.close();
console.log(echecs === 0 ? "\nLa page du commerçant tient ses promesses." : `\n${echecs} promesse(s) rompue(s).`);
process.exit(echecs === 0 ? 0 : 1);
