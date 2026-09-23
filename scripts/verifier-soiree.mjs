// 👻 LA SOIRÉE — et surtout, la règle produit qu'elle ne doit jamais rompre.
//
// ═══ CE QUE CETTE GARDE PROTÈGE ════════════════════════════════════════════
//
// « L'objectif n'est PAS de créer une mécanique de dating. »
//
// C'EST LA SEULE RÈGLE DE TOUT CE DOSSIER QUI SE CASSE SANS RIEN CASSER. Un
// écran déplacé d'un cran, un bouton remonté de deux lignes, une liste
// réordonnée : rien ne plante, rien ne s'affiche de travers, et le produit a
// changé de nature. Il l'a dit lui-même en corrigeant ses propres maquettes :
// « je ne mettrais pas l'écran "14 Fantômes cherchent la même chose que vous"
// directement après l'essayage — ça remet immédiatement ClikMe dans le dating ».
//
// UNE GARDE DE FORME NE VERRAIT RIEN. « Y a-t-il une grille de Fantômes ? » —
// oui, elle existe, et elle doit exister. Ce qui compte est OÙ elle arrive, et
// ça ne se mesure qu'en marchant dans le parcours comme quelqu'un y marche.
//
// ═══ LES SEPT CHOSES QU'ELLE VÉRIFIE ═══════════════════════════════════════
//
//   1 · La vitrine d'un bar annonce la soirée, et son bouton l'ouvre.
//   2 · L'enchaînement est ESSAI → INTENTION → LIVE, dans cet ordre.
//   3 · AUCUNE grille de Fantômes n'apparaît avant le Live. ← la règle
//   4 · « Faire une rencontre » est la DERNIÈRE des six intentions.
//   5 · On peut traverser en restant invisible, et entrer quand même.
//   6 · Le Live sert à quelqu'un qui ne parle à personne : les infos et les
//       sondages existent, et un sondage se vote sans écrire un mot.
//   7 · Le Fantôme ClikMe ne dit « le son que vous avez essayé » QUE si on l'a
//       vraiment essayé.
//
//   node scripts/verifier-soiree.mjs [port]

import pw from "/opt/node22/lib/node_modules/playwright/index.js";

const PORT = process.argv[2] ?? "3821";
const BASE = `http://127.0.0.1:${PORT}`;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

const nav = await pw.chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
// ON PASSE L'ÉCRAN DE BIENVENUE. Il couvre le paquet au premier passage et
// intercepte tous les appuis — c'est la même clé que les autres suites posent.
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"]));
    // ET ON SORT DU MODE DÉMONSTRATION. Depuis qu'il demande à revoir l'écran
    // d'ouverture à chaque fois, la clé ci-dessus ne suffit plus à le faire
    // passer — voir `TOUJOURS_REVOIR` dans premiere-fois.ts.
    localStorage.setItem("clikme-demo-v1", "0");
  } catch {}
});
const p = await ctx.newPage();
p.on("pageerror", (e) => dire(false, `la soirée lève une erreur : ${e.message}`));

/** Où en est-on du parcours ? */
const ou = () =>
  p.evaluate(() => ({
    essai: !!document.querySelector(".so-essai"),
    intention: !!document.querySelector(".so-int"),
    live: !!document.querySelector(".so-fil"),
    grille: !!document.querySelector(".so-grille"),
    voir: !!document.querySelector(".so-voir"),
    titre: (document.querySelector(".so-t") || {}).innerText?.replace(/\s+/g, " ").trim() ?? "",
  }));

/** Ouvre la page d'un commerce et pousse la porte de la vitrine. */
async function entrer(nom) {
  await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await p.locator(".bq-maq-c button", { hasText: nom }).first().click();
  await p.waitForTimeout(400);
  const v = await p.evaluate(() => ({
    question: (document.querySelector(".bf-q") || {}).innerText?.replace(/\s+/g, " ").trim() ?? "",
    geste: (document.querySelector(".bf-cta") || {}).innerText?.replace(/\s+/g, " ").trim() ?? "",
  }));
  await p.click(".bf-cta");
  await p.waitForTimeout(700);
  return v;
}

/**
 * JOUE L'ESSAI JUSQU'AU BOUT, quelle que soit sa forme.
 *
 * `vraiment` À FAUX TRAVERSE SANS TOUCHER À RIEN : c'est ce qui permet de
 * vérifier la septième règle, celle du message du Fantôme ClikMe.
 */
async function jouerLEssai(vraiment = true) {
  if (!vraiment) return;
  const d = await p.$(".so-devoile");
  if (d) {
    await d.click();
    await p.waitForTimeout(500);
  }
  const r = await p.$(".so-rep button");
  if (r) {
    await r.click();
    const v = await p.$(".so-pave:not([disabled])");
    if (v) await v.click();
    await p.waitForTimeout(400);
  }
  const l = await p.$(".so-lire");
  if (l) {
    await l.click();
    // ON ATTEND D'AVOIR VRAIMENT ENTENDU. Deux secondes et demie : c'est la
    // barre que le lecteur lui-même se donne, plus une marge de démarrage.
    // Attendre moins traverserait l'essai sans l'avoir joué, et la garde
    // vérifierait alors le contraire de ce qu'elle annonce.
    await p.waitForTimeout(3200);
  }
  // LE COCKTAIL SE VERSE COUCHE PAR COUCHE, et une garde qui n'appuierait
  // qu'une fois s'arrêterait sur les glaçons. On appuie tant que le verre n'est
  // pas monté — c'est le GESTE qu'on décrit, pas un nombre d'étapes : le jour
  // où Lou ajoutera un ingrédient, cette boucle n'aura pas à changer.
  for (let i = 0; i < 12; i++) {
    if (!(await p.$(".so-recette"))) break;
    if (await p.$(".so-recette.pleine")) break;
    const v = await p.$(".so-recette .so-pave:not([disabled])");
    if (!v) break;
    await v.click();
    await p.waitForTimeout(250);
  }
}

/** Traverse la soirée jusqu'au Live en notant tout ce qu'on croise. */
async function traverser(nom, { vraiment = true, visible = true } = {}) {
  const etapes = [];
  let grilleAvantLive = false;
  for (let i = 0; i < 8; i++) {
    const e = await ou();
    etapes.push(e.live ? "live" : e.intention ? "intention" : e.essai ? "essai" : "?");
    if (!e.live && e.grille) grilleAvantLive = true;
    if (e.live) break;
    if (e.essai) await jouerLEssai(vraiment);
    if (e.intention) {
      // ON CHOISIT LA PREMIÈRE INTENTION — « faire la fête » — et jamais la
      // dernière : une garde qui cocherait « faire une rencontre » vérifierait
      // le seul chemin que ce produit ne veut pas mettre en avant.
      const it = await p.$(".so-int button");
      if (it) await it.click();
      if (!visible) {
        const inv = await p.$$(".so-vis button");
        if (inv[1]) await inv[1].click();
      }
      await p.waitForTimeout(200);
    }
    const cta = await p.$(".so-cta");
    if (!cta || (await cta.isDisabled())) break;
    await cta.click();
    await p.waitForTimeout(700);
  }
  return { etapes, grilleAvantLive };
}

console.log("\n══ la vitrine d'un bar annonce sa soirée ══");
for (const nom of ["bar à vins", "terrasse au soleil"]) {
  const v = await entrer(nom);
  dire(
    /soir[ée]e/i.test(v.question),
    `${nom} — la question parle de la soirée (« ${v.question} »)`,
  );
  dire(
    /essayer cette soir/i.test(v.geste),
    `et le grand bouton l'ouvre (« ${v.geste} »)`,
  );
  const e = await ou();
  dire(e.essai, `il ouvre bien sur l'ESSAI, pas sur autre chose`);
}

console.log("\n══ l'ordre du parcours, et la règle qui le tient ══");
for (const nom of ["bar à vins", "terrasse au soleil"]) {
  await entrer(nom);
  const { etapes, grilleAvantLive } = await traverser(nom);
  dire(
    etapes[0] === "essai" && etapes.includes("intention") && etapes.at(-1) === "live",
    `${nom} — essai → intention → Live (${etapes.join(" → ")})`,
  );
  // ═══ LA RÈGLE ═══════════════════════════════════════════════════════════
  dire(
    !grilleAvantLive,
    `et AUCUNE grille de Fantômes n'apparaît avant le Live — c'est la règle`,
  );
  const l = await ou();
  dire(l.voir, `« Voir les Fantômes » existe, et il est DANS le Live`);
}

console.log("\n══ les six intentions, et la place de la dernière ══");
await entrer("bar à vins");
await traverser("bar à vins", { vraiment: false });
// On revient d'un cran : le Live est passé, on veut l'écran d'avant.
await entrer("bar à vins");
for (let i = 0; i < 4; i++) {
  const e = await ou();
  if (e.intention) break;
  await jouerLEssai(false);
  const cta = await p.$(".so-cta");
  if (!cta || (await cta.isDisabled())) break;
  await cta.click();
  await p.waitForTimeout(600);
}
const inte = await p.evaluate(() => ({
  mots: [...document.querySelectorAll(".so-int b")].map((b) => b.textContent.trim()),
  visibles: [...document.querySelectorAll(".so-vis b")].map((b) => b.textContent.trim()),
  bloque: document.querySelector(".so-cta")?.disabled ?? false,
}));
dire(inte.mots.length === 6, `six intentions proposées (${inte.mots.length})`);
dire(
  /rencontre/i.test(inte.mots.at(-1) ?? ""),
  `et « faire une rencontre » est la DERNIÈRE (« ${inte.mots.at(-1)} »)`,
);
dire(
  !/rencontre/i.test(inte.mots[0] ?? ""),
  `elle n'est pas la première non plus (« ${inte.mots[0]} »)`,
);
dire(
  inte.visibles.length === 2 && inte.visibles.some((m) => /invisible/i.test(m)),
  `on peut choisir d'être invisible (${inte.visibles.join(" · ")})`,
);
dire(inte.bloque, `et on n'avance pas sans avoir dit ce qu'on cherche`);

console.log("\n══ on peut traverser sans jamais se montrer ══");
await entrer("terrasse au soleil");
const cache = await traverser("terrasse au soleil", { visible: false });
dire(cache.etapes.at(-1) === "live", `invisible, on entre quand même dans le Live`);
const pose = await p.evaluate(
  () => (document.querySelector(".so-pose") || {}).innerText?.replace(/\s+/g, " ").trim() ?? "",
);
dire(
  /sans être vu|ne s’affiche pas|ne s'affiche pas/i.test(pose),
  `et l'écran dit qu'on n'est pas visible (« ${pose.slice(0, 64)}… »)`,
);

console.log("\n══ le Live sert à quelqu'un qui ne parle à personne ══");
await entrer("bar à vins");
await traverser("bar à vins");
const filtres = await p.evaluate(() =>
  [...document.querySelectorAll(".so-filtres button")].map((b) => b.textContent.trim()),
);
dire(filtres.length === 4, `quatre filtres (${filtres.join(" · ")})`);
for (const f of ["Infos", "Questions", "Sondages"]) {
  await p.locator(".so-filtres button", { hasText: f }).first().click();
  await p.waitForTimeout(300);
  const n = await p.evaluate(
    () => document.querySelectorAll(".so-fil > li:not(.so-vide)").length,
  );
  dire(n > 0, `« ${f} » rend au moins un message (${n})`);
}
await p.locator(".so-filtres button", { hasText: "Tout" }).first().click();
await p.waitForTimeout(300);
/**
 * AVANT DE VOTER, ON NE SAIT RIEN — NI LE CHIFFRE, NI LA BARRE.
 *
 * LA GARDE MESURE LA JAUGE, ET NON LE POURCENTAGE. Le pourcentage était déjà
 * caché ; la barre, elle, était dessinée à sa vraie largeur dès l'ouverture, et
 * elle disait le résultat en plus gros que le chiffre. Une garde qui n'aurait
 * regardé que le texte aurait déclaré l'écran conforme pendant que l'œil, lui,
 * lisait la réponse — c'est exactement le vote de conformité qu'on voulait
 * empêcher.
 */
const avant = await p.evaluate(() => ({
  chiffres: !!document.querySelector(".so-sondage em"),
  jauges: [...document.querySelectorAll(".so-sondage .so-jauge")].map(
    (j) => j.getBoundingClientRect().width,
  ),
}));
await p.click(".so-sondage button");
await p.waitForTimeout(600);
const apres = await p.evaluate(() => ({
  chiffres: !!document.querySelector(".so-sondage em"),
  total: (document.querySelector(".so-total") || {}).textContent ?? "",
  jauges: [...document.querySelectorAll(".so-sondage .so-jauge")].map(
    (j) => j.getBoundingClientRect().width,
  ),
}));
dire(!avant.chiffres && apres.chiffres, `un sondage se vote sans écrire un mot, et rend son résultat`);
dire(/réponses/.test(apres.total), `qui dit combien de gens ont répondu (« ${apres.total} »)`);
dire(
  avant.jauges.length > 0 && avant.jauges.every((w) => w < 1),
  `et AUCUNE barre ne trahit le résultat avant le vote (${avant.jauges
    .map((w) => Math.round(w))
    .join(" · ")} px)`,
);
dire(
  apres.jauges.some((w) => w > 8),
  `la barre n'arrive qu'après (${apres.jauges.map((w) => Math.round(w)).join(" · ")} px)`,
);

console.log("\n══ le Fantôme ClikMe ne parle que de ce qu'on a vraiment essayé ══");
await entrer("bar à vins");
await traverser("bar à vins", { vraiment: false });
const sans = await p.evaluate(
  () => document.querySelectorAll(".so-msg.fantome").length,
);
dire(sans === 0, `traversé sans écouter : aucun message du Fantôme (${sans})`);
await entrer("bar à vins");
await traverser("bar à vins", { vraiment: true });
const avec = await p.evaluate(() => ({
  n: document.querySelectorAll(".so-msg.fantome").length,
  mot: (document.querySelector(".so-msg.fantome .so-bulle") || {}).textContent ?? "",
}));
dire(avec.n > 0, `essayé pour de vrai : le Fantôme raccroche l'essai à la soirée`);
dire(
  /vous avez/i.test(avec.mot),
  `et il parle à la deuxième personne (« ${avec.mot.slice(0, 56)}… »)`,
);

/* ═══ CE QU'ON DÉCOUVRE DOIT DONNER ENVIE ═══════════════════════════════════

   « Rien ne fait envie, il n'y a pas assez de plus-value quand on clique sur le
   Fantôme pour avoir un effet wow j'ai trop envie d'y aller […] on sait ce
   qu'on va écouter par exemple, on met l'accent sur un cocktail du soir que le
   barman nous présente PAS À PAS pour nous donner envie. »

   LA GARDE MESURE LE « PAS À PAS », ET NON LA PRÉSENCE D'UN COCKTAIL. Un écran
   qui afficherait la recette entière d'un bloc passerait n'importe quel test de
   contenu : les cinq ingrédients seraient là, le mot « cocktail » aussi. Ce
   qu'il demande est que le verre MONTE — donc on compte les couches avant et
   après un versement, et l'on vérifie qu'il en manquait.
*/
console.log("\n══ un bar fait découvrir son cocktail, geste par geste ══");
await entrer("terrasse au soleil");
const recette = await p.evaluate(() => ({
  chapeau: (document.querySelector(".so-chapeau") || {}).textContent?.trim() ?? "",
  etapes: [...document.querySelectorAll(".so-etapes li span")].map((s) => s.textContent.trim()),
  couches: document.querySelectorAll(".so-liq i").length,
  dit: (document.querySelector(".so-dit") || {}).textContent?.trim() ?? "",
}));
dire(/cocktail/i.test(recette.chapeau), `le bar annonce un cocktail (« ${recette.chapeau} »)`);
dire(
  recette.etapes.length >= 4,
  `et il le monte en plusieurs temps (${recette.etapes.join(" · ")})`,
);
dire(recette.couches === 0, `le verre est vide tant qu'on n'a rien versé (${recette.couches})`);
dire(recette.dit.length > 20, `et quelqu'un parle par-dessus (« ${recette.dit.slice(0, 50)}… »)`);

await p.click(".so-recette .so-pave");
await p.waitForTimeout(400);
const unePart = await p.evaluate(() => ({
  couches: document.querySelectorAll(".so-liq i").length,
  pleine: !!document.querySelector(".so-recette.pleine"),
  question: !!document.querySelector(".so-reac"),
}));
dire(unePart.couches === 1, `un appui verse UNE couche, pas la recette (${unePart.couches})`);
dire(
  !unePart.pleine && !unePart.question,
  `et l'on ne demande pas encore l'avis : le verre n'est pas monté`,
);

await jouerLEssai();
const montee = await p.evaluate(() => ({
  couches: document.querySelectorAll(".so-liq i").length,
  pleine: !!document.querySelector(".so-recette.pleine"),
  question: (document.querySelector(".so-reac > p") || {}).textContent?.trim() ?? "",
  visages: document.querySelectorAll(".so-reac-l .so-reac-v, .so-reac-l .so-reac-i").length,
}));
dire(
  montee.couches === recette.etapes.length && montee.pleine,
  `versé jusqu'au bout, le verre porte toutes ses couches (${montee.couches}/${recette.etapes.length})`,
);
dire(
  /ambiance|envie|plaît/i.test(montee.question),
  `alors seulement on demande ce qu'on en pense (« ${montee.question} »)`,
);
dire(montee.visages === 3, `et les trois réactions sont dessinées (${montee.visages})`);

/* ═══ ET UN ÉVÉNEMENT FAIT DÉCOUVRIR SA MUSIQUE ═════════════════════════════

   « Fais un bar avec la découverte "cocktail" et un événement sur l'app aussi
   avec la découverte "musique" du lieu, et tu mets une musique libre de
   droit. »

   LA GARDE NE CHERCHE PAS « SON » DANS LE CODE : elle appuie sur le lecteur et
   regarde si le fichier avance vraiment. Un lecteur qui ne joue rien a la même
   apparence qu'un lecteur qui joue.
*/
console.log("\n══ un événement fait découvrir la musique du lieu ══");
await p.goto(`${BASE}/autour-de-moi?carte=kiosque`, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
const geste = await p.$(".ap-soirer");
if (geste) {
  await geste.click();
  await p.waitForTimeout(900);
}
const musique = await p.evaluate(() => ({
  chapeau: (document.querySelector(".so-chapeau") || {}).textContent?.trim() ?? "",
  etiquette: (document.querySelector(".so-etiq") || {}).innerText?.replace(/\s+/g, " ").trim() ?? "",
  lecteur: !!document.querySelector(".so-lire"),
  source: (document.querySelector(".so-son audio") || {}).getAttribute?.("src") ?? "",
}));
dire(/son|musique/i.test(musique.chapeau), `l'événement annonce son son (« ${musique.chapeau} »)`);
dire(musique.lecteur, `et il y a de quoi l'écouter`);
dire(!!musique.source, `sur un vrai fichier (${musique.source})`);
if (musique.lecteur) {
  await p.click(".so-lire");
  await p.waitForTimeout(1400);
  const avance = await p.evaluate(() => {
    const a = document.querySelector(".so-son audio");
    return { t: a ? a.currentTime : -1, joue: a ? !a.paused : false };
  });
  dire(avance.t > 0.2, `qui avance quand on appuie (${avance.t.toFixed(1)} s)`);
}

console.log("\n══ l'extrait est servi, et il ne se charge qu'à la demande ══");
const son = await p.request.get(`${BASE}/direct/soiree/son-de-ce-soir.wav`);
const octets = (await son.body()).length;
dire(
  son.status() === 200 && octets > 100000,
  `/direct/soiree/son-de-ce-soir.wav est servi (${son.status()}, ${(octets / 1024).toFixed(0)} ko)`,
);

console.log("\n══ le bar et l'événement ont quitté l'ancien design ══");
await p.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
/**
 * DEUX PASSAGES, ET C'EST UNE NÉCESSITÉ, PAS UNE PRÉCAUTION.
 *
 * La feuille du fantôme est modale : tant qu'elle est ouverte, elle intercepte
 * tous les appuis, y compris la flèche « annonce suivante ». Un seul passage qui
 * compte ET ouvre finit donc bloqué derrière sa propre feuille. On compte
 * d'abord, on ouvre ensuite — et on recharge entre les deux plutôt que de
 * chercher comment refermer, parce que refermer est le geste de l'utilisateur,
 * pas celui de la garde.
 */
let bars = 0;
let premiere = -1;
for (let i = 0; i < 26; i++) {
  if (await p.evaluate(() => !!document.querySelector(".ap-soirer"))) {
    bars++;
    if (premiere < 0) premiere = i;
  }
  /* ═══ ON RÉPOND AUX ANNONCES, COMME UN HABITANT ═══════════════════════════

     LE DÉFAUT MESURÉ, ET IL A COÛTÉ UN DIAGNOSTIC FAUX AVANT D'ÊTRE TROUVÉ :
     la garde s'arrêtait au sixième appui, bloquée derrière `.ap-jrn` — la
     carte « Et si on relookait votre journée ? ». Elle est à dessein
     par-dessus le paquet et elle attend une réponse : « Composer ma journée »
     ou « Plus tard ». La flèche est dessous, donc l'appui ne passait pas.

     CE N'EST PAS UN DÉFAUT DU PRODUIT, C'EST LA GARDE QUI NE SAVAIT PAS
     RÉPONDRE. Un habitant, lui, appuie sur « Plus tard » et continue. Une
     garde qui exigerait que la flèche reste atteignable demanderait à l'écran
     de renoncer à la seule chose que fait une annonce : attendre une réponse.

     ET C'EST « PLUS TARD », PAS L'AUTRE BOUTON. Ouvrir le parcours de la
     journée emmènerait la garde dans un écran qui n'est pas son sujet, et
     elle reviendrait compter un paquet remis à zéro. */
  for (const x of [".ap-jrn-x", ".ap-relook-x"]) {
    const b2 = await p.$(x);
    if (b2 && (await b2.isVisible())) {
      await b2.click();
      await p.waitForTimeout(400);
    }
  }

  const s = await p.$(".ap-suiv");
  if (!s || (await s.isDisabled())) break;
  await s.click();
  await p.waitForTimeout(600);
}
// SIX LIEUX ONT UNE SOIRÉE — deux bars et quatre événements — et le paquet n'en
// montre qu'une partie selon l'heure. On exige donc « plusieurs », pas « six » :
// une garde qui compte exactement casserait à chaque ajout au paquet.
dire(bars >= 3, `plusieurs annonces portent le geste de la soirée (${bars})`);

let feuilleOuverte = false;
if (premiere >= 0) {
  await p.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  /**
   * ON RECHERCHE L'ANNONCE, ON NE RECOMPTE PAS LES PAS.
   *
   * Premier jet : on refaisait `premiere` fois « suivante » après le
   * rechargement. Or l'ordre du paquet dépend de l'heure et de ce qu'on a déjà
   * vu : le même rang ne rend pas la même annonce deux fois de suite, et la
   * garde ouvrait la feuille d'un restaurant en croyant tenir un bar.
   */
  for (let i = 0; i < 26; i++) {
    if (await p.evaluate(() => !!document.querySelector(".ap-soirer"))) {
      await p.click(".ap-soirer");
      await p.waitForTimeout(1300);
      feuilleOuverte = await p.evaluate(() => !!document.querySelector(".so-essai"));
      break;
    }
    const s = await p.$(".ap-suiv");
    if (!s || (await s.isDisabled())) break;
    await s.click();
    await p.waitForTimeout(600);
  }
}
dire(feuilleOuverte, `et le fantôme y ouvre bien l'essai de la soirée`);

/* ═══ 8 · L'EXEMPLE SORTIES DE L'ÉCRAN D'OUVERTURE RÉPOND AU DOIGT ═══════
 *
 * « Je n'aime pas du tout le design de cet exemple. Je voudrais d'abord la
 * musique, pouvoir appuyer dessus pour l'écouter, et appuyer sur "suivant"
 * pour voir les deux autres phases. »
 *
 * C'EST LE SEUL ÉCRAN DU PRODUIT QUI SOIT À LA FOIS UNE DÉMONSTRATION
 * AUTOMATIQUE ET UN OBJET QU'ON TOUCHE, et c'est exactement le genre qui se
 * casse sans bruit : une minuterie qui reprend la main au milieu d'un appui,
 * un bouton qui n'arme plus la lecture, un Fantôme qui repasse derrière la
 * carte. Rien de tout ça ne lève d'erreur.
 *
 * ON MESURE DONC CE QUE ÇA PRODUIT : le son avance vraiment, « suivant »
 * change vraiment de temps, et la ronde des exemples se tait dès qu'on a
 * touché. */
{
  const q = await nav.newPage();
  await q.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await q.waitForTimeout(2200);
  await q.evaluate(() => {
    [...document.querySelectorAll(".ap-ac-famb")].find((x) => /sorties/i.test(x.textContent || ""))?.click();
  });
  await q.waitForTimeout(1000);
  dire(await q.evaluate(() => Boolean(document.querySelector(".s3"))), "l'exemple Sorties rejoue les trois écrans de la soirée");

  // LE SON, VRAIMENT — pas un bouton qui s'allume sur un silence.
  await q.click(".s3-lire");
  await q.waitForTimeout(1600);
  const son = await q.evaluate(() => {
    const a = document.querySelector(".s3 audio");
    return a ? { joue: !a.paused, t: a.currentTime } : null;
  });
  dire(Boolean(son && son.joue && son.t > 0.5), `on écoute vraiment l'extrait (${son ? son.t.toFixed(1) : "0"} s)`);

  // « SUIVANT » MÈNE AUX DEUX AUTRES PHASES, dans l'ordre du parcours.
  const lu = async () => q.evaluate(() => document.querySelector(".s3-carte")?.innerText.replace(/\s+/g, " ") || "");
  await q.click(".s3-suiv");
  await q.waitForTimeout(600);
  const deux = await lu();
  dire(/cherchez ce soir/i.test(deux), "« suivant » mène à ce qu'on cherche ce soir");
  await q.click(".s3-suiv");
  await q.waitForTimeout(600);
  const trois = await lu();
  dire(/en direct|le live/i.test(trois), "puis au Live, où l'on voit ce que les gens disent");

  /* ET LA RONDE DES EXEMPLES S'EST TUE. Sans ça, l'écran changerait d'exemple
     pendant qu'on lit le Live — on reprendrait la main à quelqu'un qui vient
     de la prendre, ce qui est la pire chose qu'un écran puisse faire. */
  await q.waitForTimeout(6000);
  dire(await q.evaluate(() => Boolean(document.querySelector(".s3"))), "et la ronde des exemples ne reprend pas la main");

  /* LE FANTÔME N'EST JAMAIS COUPÉ PAR LA CARTE. Il absorbe la hauteur libre ;
     posé en absolu, il passait derrière et on n'en voyait que la casquette. */
  const chevauche = await q.evaluate(() => {
    const f = document.querySelector(".s3-f");
    const c = document.querySelector(".s3-carte");
    if (!f || !c) return true;
    const a = f.getBoundingClientRect();
    const b = c.getBoundingClientRect();
    return a.bottom > b.top + 2;
  });
  dire(!chevauche, "et le Fantôme reste entier, au-dessus de la carte");
  await q.close();
}

await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
