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
// ELLE N'EST PLUS SUR TOUTES LES CARTES, ET C'EST LA CORRECTION : « ce
// rectangle prend de la place sur chaque annonce et ne sert à rien ». Elle ne
// survit que devant une vraie borne horaire — voir la section 5.
dire(!face.pastille || /\d/.test(face.pastille),
  `pas de rectangle, ou une vraie heure (${face.pastille || "aucun"})`);
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

// ═══ 5 · LE RECTANGLE JAUNE NE DIT PLUS « MAINTENANT · CE MATIN » ═══
//
// « Ce rectangle prend de la place sur chaque annonce et ne sert à rien. » Sur
// la boucherie il disait deux fois la même chose, sur une carte qui est de
// toute façon celle d'aujourd'hui. Il ne survit que devant une vraie borne.
console.log("\n══ le rectangle jaune ══");
({ ctx, p } = await ouvrir());
const bornes = [];
for (let k = 0; k < 10; k++) {
  bornes.push(await p.evaluate(() => ({
    chez: document.querySelector(".ap-dessus .cd-chez")?.textContent
      .replace(/\s+/g, " ").split("·")[0].trim() ?? "",
    pill: document.querySelector(".ap-dessus .cd-quand")?.textContent
      .replace(/\s+/g, " ").trim() ?? "",
  })));
  if (await p.$eval(".ap-rond", (b) => b.disabled).catch(() => true)) break;
  await p.click(".ap-rond");
  await p.waitForTimeout(320);
}
for (const b of bornes.slice(0, 6))
  console.log(`  ${b.chez} → ${b.pill || "(pas de rectangle)"}`);
dire(!bornes.some((b) => /ce matin|aujourd|cette semaine|toute la journ/i.test(b.pill)),
  "plus jamais « ce matin » ni « aujourd'hui » dans le rectangle");
dire(bornes.every((b) => !b.pill || /\d/.test(b.pill)),
  "il ne reste que les vraies heures");
dire(bornes.some((b) => !b.pill), "et beaucoup de cartes n'en ont plus du tout");
await ctx.close();

// ═══ 6 · LA FILE DU MATIN ═══
//
// « Il y a peu de chances que les gens tombent pile poil sur les offres avec le
// compteur de 5 minutes. » On retourne la fenêtre : on s'inscrit le matin, et
// l'offre du soir descend dans cette file-là.
console.log("\n══ la file du matin ══");
({ ctx, p } = await ouvrir("/autour-de-moi?chez=boulange"));
await p.click(".ap-arr-ville");
await p.waitForTimeout(1300);
await p.click(".ap-vers-bas", { force: true });
await p.waitForTimeout(900);
const f0 = await p.evaluate(() => {
  const d = document.querySelector(".ap-file");
  if (!d) return null;
  return {
    quoi: d.querySelector("b").textContent.replace(/\s+/g, " ").trim(),
    combien: d.querySelector("em").textContent.replace(/\s+/g, " ").trim(),
    bouton: d.querySelector(".ap-file-b").textContent.trim(),
  };
});
if (!f0) { dire(false, "la ligne de la file est sous le pli"); }
else {
  console.log(`  « ${f0.quoi} »`);
  console.log(`  ${f0.combien} → ${f0.bouton}`);
  // « S'IL EN RESTE », JAMAIS « IL EN RESTERA » : un boulanger qui a tout
  // vendu ne doit pas se retrouver en faute d'avoir bien travaillé.
  dire(/^S’il reste|^S'il reste/.test(f0.quoi), `elle ne promet rien (${f0.quoi})`);
  dire(/attendent déjà/.test(f0.combien), "elle dit combien attendent");
  dire(/inscription/.test(f0.combien),
    "et que l'ordre est celui de l'inscription, pas de la vitesse de clic");
  dire(f0.bouton === "Prévenez-moi", `un seul geste (${f0.bouton})`);
}
await p.click(".ap-file-b");
await p.waitForTimeout(900);
const f1 = await p.evaluate(() => ({
  bouton: document.querySelector(".ap-file-b")?.textContent.trim() ?? "",
  rang: document.querySelector(".ap-file-d em")?.textContent.replace(/\s+/g, " ").trim() ?? "",
  echo: document.querySelector(".ap-echo")?.textContent.replace(/\s+/g, " ").trim() ?? "",
  garde: JSON.parse(localStorage.getItem("clikme-file-v1") ?? "[]"),
}));
console.log(`  → ${f1.bouton} · ${f1.rang}`);
console.log(`  « ${f1.echo} »`);
dire(/attends/i.test(f1.bouton), "on est dans la file");
dire(/dans la file/.test(f1.rang), `et on connaît son rang (${f1.rang})`);
dire(/cinq minutes/.test(f1.echo), "l'écho annonce les cinq minutes");
dire(f1.garde.includes("boulange"), "et ça survit à la fermeture");

// ET ON LA RETROUVE DANS « MES COMMERCES » — une file qu'on ne retrouve nulle
// part est une file oubliée.
await p.click(".ap-fav2 .nb");
await p.waitForTimeout(900);
const att = await p.evaluate(() => {
  const e = document.querySelector(".ap-nouv-e.attente");
  return {
    titre: [...document.querySelectorAll(".ap-nouv-t")].map((x) => x.textContent.trim()),
    ligne: e?.textContent.replace(/\s+/g, " ").trim() ?? "",
  };
});
console.log(`  ${JSON.stringify(att.titre)} → ${att.ligne}`);
dire(att.titre.includes("Vous attendez"), "« Mes commerces » a un bloc « Vous attendez »");
dire(/Pétrin/.test(att.ligne), `avec le commerce (${att.ligne.slice(0, 60)})`);
await p.screenshot({ path: "/tmp/file-commerces.png", fullPage: true });
await ctx.close();

// ═══ 7 · REMETTRE UNE ANNONCE, ET CE QUI REVIENT ═══
//
// « Est-ce que le commerçant peut stocker ces annonces quelque part ? » Oui,
// mais pas comme une archive : une liste d'offres périmées est un cimetière,
// et un cimetière fait paraître mort un produit dont toute la promesse est
// d'être vivant. L'historique sert à DEUX choses, et on vérifie les deux :
//
//   1. DE SON CÔTÉ — « remettre celle-là aujourd'hui », le geste qui
//      l'accroche. Et sa carte doit changer DANS LE PAQUET tout de suite :
//      un bouton qu'il faut croire ne se réappuie pas.
//   2. DU CÔTÉ DES CLIENTS — « ce qui revient », déduit et jamais déclaré.
//      La vraie question n'est pas « qu'a-t-il fait le 12 » mais « est-ce
//      qu'il refait ça, et quand ».
console.log("\n══ mon commerce ══");
{
  const c3 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  const q = await c3.newPage();
  q.on("pageerror", (e) => erreurs.push(String(e)));
  q.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await q.goto(`${BASE}/autour-de-moi/mon-commerce?chez=boulange`, {
    waitUntil: "networkidle",
  });
  await q.waitForTimeout(900);

  const mc = await q.evaluate(() => ({
    nom: document.querySelector(".mc h1")?.textContent.trim() ?? "",
    // LA RÉCOMPENSE AVANT LA CORVÉE : le bilan d'hier doit être AU-DESSUS de
    // la liste. Un écran qui ouvre sur « qu'allez-vous publier ? » est un
    // formulaire ; celui qui ouvre sur « voilà ce que ça a produit » est une
    // raison de l'ouvrir.
    ordre:
      (document.querySelector(".mc-bilan")?.getBoundingClientRect().top ?? 1e9) <
      (document.querySelector(".mc-liste")?.getBoundingClientRect().top ?? 0),
    chiffres: [...document.querySelectorAll(".mc-chiffres span")].map((e) =>
      e.textContent.replace(/\s+/g, " ").trim()),
    lignes: [...document.querySelectorAll(".mc-liste li b")].map((e) =>
      e.textContent.trim()),
    habitudes: [...document.querySelectorAll(".mc-hab li")].map((e) =>
      e.textContent.replace(/\s+/g, " ").trim()),
  }));
  console.log(`  ${mc.nom}`);
  console.log(`  hier : ${mc.chiffres.join(" · ")}`);
  for (const h of mc.habitudes) console.log(`  ↻ ${h}`);
  dire(/Pétrin/.test(mc.nom), `l'écran est celui du commerce (${mc.nom})`);
  dire(mc.ordre, "le bilan d'hier passe avant la liste : la récompense d'abord");
  // DEUX CHIFFRES, JAMAIS DOUZE. Un tableau de bord de commerçant qui affiche
  // un taux de conversion ne se relit pas une deuxième fois.
  dire(mc.chiffres.length === 2, `deux chiffres, pas douze (${mc.chiffres.length})`);
  console.log(`  à remettre : ${JSON.stringify(mc.lignes)}`);
  dire(mc.lignes.length >= 2, `ses annonces sont là (${mc.lignes.length})`);
  // CHAQUE ANNONCE UNE SEULE FOIS. La liste affichait « La fournée de 17 h »
  // quatre fois de suite : exact, et parfaitement inutile — il n'a pas à
  // choisir laquelle des quatre fournées identiques remettre.
  dire(new Set(mc.lignes).size === mc.lignes.length,
    "et chacune une seule fois");
  // ON NE NOMME UN JOUR QUE SI DEUX TIERS DES FOIS TOMBENT DESSUS.
  dire(mc.habitudes.length > 0, "et ce qui revient est déduit");
  await q.screenshot({ path: "/tmp/mon-commerce.png", fullPage: true });

  // ── LE GESTE ──
  await q.click(".mc-liste li:first-child .mc-b");
  await q.waitForTimeout(700);
  const apresRemise = await q.evaluate(() => ({
    bouton: document.querySelector(".mc-liste li:first-child .mc-b")?.textContent.trim() ?? "",
    ok: document.querySelector(".mc-ok")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    garde: JSON.parse(localStorage.getItem("clikme-remises-v1") ?? "[]").length,
  }));
  console.log(`  → ${apresRemise.bouton} · ${apresRemise.ok}`);
  dire(/En ligne/.test(apresRemise.bouton), "le bouton dit que c'est en ligne");
  dire(/tête de votre journée/.test(apresRemise.ok),
    `et où elle est allée (${apresRemise.ok.slice(0, 44)})`);
  dire(apresRemise.garde === 1, "c'est enregistré");

  // ── ET ÇA SE VOIT DANS LE PAQUET, TOUT DE SUITE ──
  await q.goto(`${BASE}/autour-de-moi?chez=boulange`, { waitUntil: "networkidle" });
  await q.waitForTimeout(1800);
  const enLigne = await q.evaluate(() =>
    [...document.querySelectorAll(".ap-arr-jour b")].map((e) => e.textContent.trim()));
  console.log(`  sa journée, vue par ses clients : ${JSON.stringify(enLigne.slice(0, 3))}`);
  dire(enLigne.length > 0 && /fournée/i.test(enLigne[0]),
    `l'annonce remise est en tête de sa journée (${enLigne[0]})`);
  await c3.close();
}

// ── ET « CE QUI REVIENT » CÔTÉ CLIENT, SOUS LE PLI ──
console.log("\n══ ce qui revient, côté client ══");
({ ctx, p } = await ouvrir("/autour-de-moi?chez=emporter"));
await p.click(".ap-arr-ville");
await p.waitForTimeout(1300);
await p.click(".ap-vers-bas", { force: true });
await p.waitForTimeout(900);
const hab = await p.evaluate(() =>
  [...document.querySelectorAll(".ap-hab li")].map((e) => ({
    t: e.querySelector("b")?.textContent.trim() ?? "",
    q: e.querySelector("span")?.lastChild?.textContent.trim() ?? "",
    b: e.querySelector(".ap-hab-b")?.textContent.trim() ?? "",
  })));
for (const h of hab) console.log(`  ${h.t} — ${h.q} → ${h.b}`);
dire(hab.length > 0, "la fiche dit ce qui revient");
// LE JOUR N'EST NOMMÉ QUE QUAND IL DOMINE VRAIMENT — deux tiers des fois.
dire(hab.some((h) => /plutôt le/.test(h.q)),
  "et nomme le jour quand il y en a un");
// SA MEILLEURE RÉPONSE N'EST PAS UNE ARCHIVE, C'EST UN MESSAGE.
dire(hab.every((h) => /redemander/i.test(h.b)),
  "avec le moyen de lui demander s'il en a encore");
await p.click(".ap-hab-b");
await p.waitForTimeout(800);
const dem = await p.evaluate(() =>
  document.querySelector(".ap-prev .ap-conf-mot")?.textContent.replace(/\s+/g, " ").trim() ?? "");
console.log(`  « ${dem} »`);
// ON DEMANDE, ON NE PREND PAS. « Je prends la garbure » annonce une commande
// pour quelque chose qui n'existe peut-être plus, et met le commerçant en
// faute de ne pas l'avoir.
dire(/est-ce que vous avez encore/i.test(dem),
  `le message est une question (${dem.slice(0, 72)})`);
dire(!/je prends/i.test(dem), "et n'annonce pas une commande");
dire(!/\?\./.test(dem), "sans double ponctuation");
await p.screenshot({ path: "/tmp/ce-qui-revient.png", fullPage: true });
await ctx.close();

dire(erreurs.length === 0, `aucune erreur${erreurs.length ? " : " + erreurs[0] : ""}`);
await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
