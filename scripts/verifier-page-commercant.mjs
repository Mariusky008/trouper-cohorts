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

await b.close();
console.log(echecs === 0 ? "\nLa page du commerçant tient ses promesses." : `\n${echecs} promesse(s) rompue(s).`);
process.exit(echecs === 0 ? 0 : 1);
