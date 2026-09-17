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
    await p.waitForTimeout(900);
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
const avant = await p.evaluate(() => !!document.querySelector(".so-sondage em"));
await p.click(".so-sondage button");
await p.waitForTimeout(400);
const apres = await p.evaluate(() => ({
  chiffres: !!document.querySelector(".so-sondage em"),
  total: (document.querySelector(".so-total") || {}).textContent ?? "",
}));
dire(!avant && apres.chiffres, `un sondage se vote sans écrire un mot, et rend son résultat`);
dire(/réponses/.test(apres.total), `qui dit combien de gens ont répondu (« ${apres.total} »)`);

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

await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
