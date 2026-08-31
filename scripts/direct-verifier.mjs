// LES VÉRIFICATIONS DU DIRECT — ce qu'on relit avant de pousser.
//
// POURQUOI CE FICHIER EST DANS LE DÉPÔT. Les suites qui ont trouvé la moitié
// des défauts de cette semaine — le compte à rebours qui expirait au premier
// rendu, la bande translucide au-dessus de la photo, le raccourci qui passait
// sur deux lignes, « de Le Pétrin », la promesse qui retombait sur le défaut
// chez la prothésiste ongulaire — vivaient dans un dossier temporaire. Le
// conteneur l'a vidé, et tout était perdu. Ce qui sert à vérifier le produit
// appartient au produit.
//
// USAGE : node scripts/direct-verifier.mjs [port]
// Il faut un serveur déjà lancé (voir scripts/direct-build.sh puis
// `npx next start -p <port>`).
import pw from "/opt/node22/lib/node_modules/playwright/index.js";

const PORT = process.argv[2] ?? "3000";
const BASE = `http://127.0.0.1:${PORT}`;

const nav = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let echecs = 0;
const erreurs = [];
const dire = (ok, t) => { if (!ok) echecs++; console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`); };

const ouvrir = async (url = "/autour-de-moi") => {
  const ctx = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await p.waitForSelector(".ap-fav2");
  await p.waitForTimeout(4600);
  return { ctx, p };
};

// ═══ 1 · LA PASTILLE DU MENU NE RÉPÈTE PLUS LA CARTE ═══
//
// Elle disait « 🍲 Les deux plats du jour » au-dessus d'une carte qui affiche
// déjà « MENU DU JOUR · LASAGNES MAISON · 11 € ». Ce que la carte ne dit nulle
// part, c'est jusqu'à quand on peut y aller.
console.log("\n══ la pastille de la carte ══");
let { ctx, p } = await ouvrir();
const face = await p.evaluate(() => ({
  etiquette: document.querySelector(".ap-dessus .cd-nature")?.textContent.trim() ?? "",
  quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
  // ELLE VIT À DEUX ENDROITS SELON LA FACE : en haut à gauche sur la fiche,
  // et dans le bloc central sur l'annonce — « une échéance lue à l'autre bout
  // de l'écran du prix ne se rattache à rien ». On prend celle qui est là.
  pastille: (document.querySelector(".ap-dessus .cd-quand")
    ?? document.querySelector(".ap-dessus .cd-reste"))?.textContent
    .replace(/\s+/g, " ").trim() ?? "",
}));
console.log(`  ${face.etiquette} · ${face.quoi} · pastille « ${face.pastille} »`);
dire(!!face.pastille, "la pastille est là");
// « CE MATIN », « 11 h – 13 h », « jusqu'à 19 h » : le libellé est celui du
// commerçant, pas une horloge. Ce qui compte est qu'il dise QUAND.
dire(face.pastille.length > 2, `elle dit quand (${face.pastille})`);
// LE TEST QUI COMPTE : elle ne redit pas ce qui est déjà écrit en gros.
const motsDuPlat = face.quoi.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
dire(!motsDuPlat.some((w) => face.pastille.toLowerCase().includes(w)),
  "et elle ne répète pas le plat affiché en grand");

// ET SUR UNE CARTE À MENU — le cas exact du reproche : « 🍲 Les deux plats du
// jour » au-dessus de « MENU DU JOUR · LASAGNES MAISON · 11 € ».
{
  const { ctx: c2, p: p2 } = await ouvrir("/autour-de-moi?chez=centre");
  await p2.click(".ap-arr-ville");
  await p2.waitForTimeout(1200);
  const menu = await p2.evaluate(() => ({
    nature: document.querySelector(".ap-dessus .cd-nature")?.textContent.trim() ?? "",
    quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
    pastille: (document.querySelector(".ap-dessus .cd-quand")
      ?? document.querySelector(".ap-dessus .cd-reste"))?.textContent
      .replace(/\s+/g, " ").trim() ?? "",
  }));
  console.log(`  carte à menu : ${menu.nature} · ${menu.quoi} · « ${menu.pastille} »`);
  dire(/\d/.test(menu.pastille),
    `sur une carte à menu, la pastille porte l'heure (${menu.pastille})`);
  dire(!/plats du jour/i.test(menu.pastille),
    "et ne redit plus « les deux plats du jour »");
  await c2.close();
}

// ═══ 2 · « SUIVRE CE BAR À VINS », PAS « SUIVRE UN BAR À VINS » ═══
console.log("\n══ suivre, et la langue ══");
// ON PASSE PAR LES BARS ET LES COMMERCES DE BOUCHE : les enseignes anonymes
// de la maquette — « Un bar à vins », « Une boucherie du centre » — sont
// celles qui déclenchent le démonstratif, et elles ne sont pas toutes dans la
// même famille de métiers.
const vus = [];
const familles = async () => {
  await p.click(".ap-metier");
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const b = [...document.querySelectorAll(".ap-m")].find((e) =>
      /bar/i.test(e.querySelector("span")?.textContent ?? ""));
    b?.click();
  });
  await p.waitForTimeout(1100);
};
for (let k = 0; k < 12; k++) {
  const t = await p.$eval(".ap-suivre-face:not(.suivi) span", (e) =>
    e.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  if (t) vus.push(t);
  if (await p.$eval(".ap-rond", (b) => b.disabled).catch(() => true)) break;
  await p.click(".ap-rond");
  await p.waitForTimeout(340);
}
await familles();
for (let k = 0; k < 6; k++) {
  const t = await p.$eval(".ap-suivre-face:not(.suivi) span", (e) =>
    e.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  if (t) vus.push(t);
  if (await p.$eval(".ap-rond", (b) => b.disabled).catch(() => true)) break;
  await p.click(".ap-rond");
  await p.waitForTimeout(340);
}
for (const t of vus.slice(-6)) console.log(`  ${t}`);
dire(vus.length > 0, `on a croisé ${vus.length} boutons « Suivre »`);
// UN ARTICLE INDÉFINI DERRIÈRE UN VERBE DONNE UNE PHRASE QUI N'EXISTE PAS :
// on ne suit pas « un » bar, on suit CE bar-là.
dire(!vus.some((t) => /^Suivre Une? /.test(t)),
  "jamais « Suivre un… » ni « Suivre une… »");
dire(vus.some((t) => /^Suivre (ce|cet|cette) /.test(t)),
  "les enseignes anonymes prennent le démonstratif");
// ET LA PROMESSE NE DIT PAS « ICI » : elle se lit à distance, sur une annonce.
dire(!vus.some((t) => /\bici\b/.test(t)),
  "aucune promesse ne dit « ici » — on n'y est pas");
dire(vus.every((t) => /Recevez en priorité/.test(t)),
  "et toutes s'adressent à quelqu'un");
await ctx.close();

// ═══ 3 · LE TOUR DE RÔLE NE SE JUSTIFIE PLUS APRÈS COUP ═══
console.log("\n══ je passe ══");
({ ctx, p } = await ouvrir());
await p.waitForSelector(".ap-tour");
const avant = await p.$eval(".ap-tour-f", (e) => e.textContent.replace(/\s+/g, " ").trim());
console.log(`  avant de décider : « ${avant} »`);
dire(/après vous/.test(avant), "la règle se lit AVANT de décider, sur l'offre");
await p.click(".ap-tour-b button:not(.fort)");
await p.waitForTimeout(700);
const apres = await p.evaluate(() => ({
  entete: document.querySelector(".ap-tour-q")?.textContent.replace(/\s+/g, " ").trim() ?? "",
  detail: document.querySelector(".ap-tour .ap-tour-d")?.textContent.trim() ?? "",
}));
console.log(`  après : « ${apres.entete} »${apres.detail ? " + " + apres.detail : ""}`);
dire(/suivant/i.test(apres.entete), "la bande confirme en trois mots");
// « C'EST INUTILE CETTE PRÉCISION » : on vient d'appuyer sur « Je passe », donc
// on sait qu'on passe.
dire(apres.detail === "", `et n'explique plus ce qu'on vient de faire (${apres.detail})`);
await ctx.close();

// ═══ 4 · LA VOIX DU COMMERÇANT ═══
//
// « Il manque toujours la dimension humaine. » Trois choses doivent être
// vraies, et la troisième est celle qui décide si la fonction est acceptable :
//
//   1. LE CONSEIL EST UN JUGEMENT, pas une description. C'est ce qu'aucune
//      plateforme ne peut copier, parce qu'il n'appartient qu'à celui qui le
//      porte.
//   2. IL PREND LA PLACE DU DÉTAIL, il ne s'ajoute pas — l'annonce est déjà
//      chargée, et on ne gagne pas un pixel.
//   3. ET SANS VOIX, LA CARTE EST EXACTEMENT CELLE D'AVANT. Une fonction qui
//      punit ceux qui ne s'en servent pas se fait détester par les trois
//      quarts de la ville.
console.log("\n══ la voix du commerçant ══");
({ ctx, p } = await ouvrir());
const voix = await p.evaluate(() => {
  const d = document.querySelector(".ap-dessus");
  const c = d.querySelector(".cd-conseil");
  return {
    chez: d.querySelector(".cd-chez")?.textContent.replace(/\s+/g, " ").split("·")[0].trim() ?? "",
    conseil: c?.querySelector("span:last-child")?.childNodes[0]?.textContent.trim() ?? "",
    qui: c?.querySelector("s")?.textContent.trim() ?? "",
    tete: c?.querySelector(".cd-tete")?.textContent.trim() ?? "",
    detail: d.querySelector(".cd-detail")?.textContent.trim() ?? "",
  };
});
console.log(`  ${voix.chez} — « ${voix.conseil} » — ${voix.qui} (${voix.tete})`);
dire(!!voix.conseil, "la carte porte un conseil");
dire(!!voix.qui, `signé d'un prénom et d'un métier (${voix.qui})`);
dire(voix.tete.length === 1, `avec son rond, à défaut de portrait (${voix.tete})`);
// LE POINT QUI COMPTE : il REMPLACE la description, il ne s'y ajoute pas.
dire(voix.detail === "",
  `et la ligne de détail a cédé sa place, pas gagné une voisine (${voix.detail})`);

// SANS VOIX, RIEN NE CHANGE. On passe jusqu'à une carte qui n'en a pas.
let sansVoix = null;
for (let k = 0; k < 14; k++) {
  await p.click(".ap-rond");
  await p.waitForTimeout(320);
  const e = await p.evaluate(() => ({
    chez: document.querySelector(".ap-dessus .cd-chez")?.textContent
      .replace(/\s+/g, " ").split("·")[0].trim() ?? "",
    conseil: !!document.querySelector(".ap-dessus .cd-conseil"),
    detail: document.querySelector(".ap-dessus .cd-detail")?.textContent.trim() ?? "",
  }));
  if (!e.conseil && e.detail) { sansVoix = e; break; }
}
console.log(`  sans voix : ${sansVoix?.chez} → « ${sansVoix?.detail} »`);
dire(!!sansVoix, "un commerce sans voix garde sa ligne de détail");

// ET LA SIGNATURE DE MÉTIER VIT SOUS LE PLI, écrite une fois pour toutes.
await p.goto(`${BASE}/autour-de-moi?chez=boulange`, { waitUntil: "networkidle" });
await p.waitForSelector(".ap-arrivee");
const arr = await p.evaluate(() => {
  const v = document.querySelector(".ap-arrivee .ap-voix");
  return {
    qui: v?.querySelector("b")?.textContent.trim() ?? "",
    signature: v?.querySelector("span:last-child")?.lastChild?.textContent.trim() ?? "",
  };
});
console.log(`  sur sa porte : ${arr.qui} — « ${arr.signature} »`);
dire(/boulanger/.test(arr.qui), `la porte dit qui est derrière (${arr.qui})`);
dire(/heures/.test(arr.signature), `et sa signature de métier (${arr.signature})`);
await p.screenshot({ path: "/tmp/voix-porte.png", fullPage: true });
await ctx.close();

dire(erreurs.length === 0, `aucune erreur${erreurs.length ? " : " + erreurs[0] : ""}`);
await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
