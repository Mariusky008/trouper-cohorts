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

/**
 * PASSER À LA CARTE SUIVANTE — et renoncer proprement quand il n'y en a plus.
 *
 * LE BOUTON SE DÉSACTIVE EN FIN DE PAQUET, et lire son état avant de cliquer ne
 * suffit pas : entre la lecture et le clic, un rendu peut l'éteindre. Le
 * vérifieur s'acharnait alors trente secondes sur un bouton mort et expirait —
 * ce qui est pire qu'un échec, parce qu'un expiré ne dit pas ce qui ne va pas.
 * On tente le clic avec un délai court, et un refus veut dire « paquet fini ».
 */
const avancer = async (page) => {
  try {
    await page.click(".ap-rond", { timeout: 1500 });
    await page.waitForTimeout(320);
    return true;
  } catch {
    return false;
  }
};

/**
 * OUVRIR L'APPLICATION, éventuellement À UNE HEURE FIXÉE.
 *
 * POURQUOI L'HEURE COMPTE MAINTENANT. Le conseil du commerçant est porté par un
 * MOMENT, pas par le commerce : « la côte, attendez jeudi » n'a de sens que le
 * jour où la côte est moins belle. La carte qui l'affiche n'est donc dans le
 * paquet qu'à certaines heures — vérifié : présente à 9 h, 11 h et 16 h, absente
 * à 13 h et 19 h. Un test qui dépend de l'heure du conteneur passe le matin et
 * échoue l'après-midi, ce qui est la pire espèce de test : on finit par ne plus
 * le croire. Les sections qui visent un contenu précis fixent donc l'horloge.
 */
const ouvrir = async (url = "/autour-de-moi", heure) => {
  const ctx = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  // ─── ON N'EST PLUS « LA PREMIÈRE FOIS » ───
  // Depuis la carte d'arrivée, un navigateur neuf ouvre sur elle. C'est le bon
  // comportement pour un habitant, et un faux départ pour une garde qui vérifie
  // autre chose : on note qu'elle a déjà été vue, comme après un premier
  // passage. Sa propre garde vit dans la suite « accueil ».
  await ctx.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  if (heure != null) {
    await ctx.clock.setFixedTime(
      new Date(2026, 8, 2, Math.floor(heure), Math.round((heure % 1) * 60), 0),
    );
  }
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
  if (!(await avancer(p))) break;
}
await familles();
for (let k = 0; k < 6; k++) {
  const t = await p.$eval(".ap-suivre-face:not(.suivi) span", (e) =>
    e.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  if (t) vus.push(t);
  if (!(await avancer(p))) break;
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
// ELLES S'ADRESSENT À QUELQU'UN, ET ELLES PROMETTENT UN RANG.
//
// LA RÈGLE A ÉTÉ RESSERRÉE, ET IL FAUT LE DIRE : elle exigeait la formule exacte
// « Recevez en priorité ». Une formule n'est pas une règle — elle interdit de
// mieux dire la même chose. Ce qui compte est double, et se mesure : un
// destinataire (« vous »), et le rang qu'on y gagne. « Ses annonces vous
// arriveront AVANT LES AUTRES » dit les deux, et le dit mieux qu'une priorité,
// qui est un mot d'administration.
dire(vus.every((t) => /\bvous\b/i.test(t)),
  "et toutes s'adressent à quelqu'un");
dire(vus.every((t) => /avant les autres|en priorité/i.test(t)),
  "et toutes promettent un RANG, pas une notification");
await ctx.close();

// ═══ 3 · LE TOUR DE RÔLE NE SE JUSTIFIE PLUS APRÈS COUP ═══
//
// LA RÈGLE SE LIT AVANT, ET RIEN NE SE LIT APRÈS. On appuie sur « Je passe » :
// le geste est son propre accusé de réception, et la bande qui le répétait
// était une fenêtre à fermer pour une décision déjà prise — « une pop-up qui
// ne sert à rien ». Ce qui doit rester vrai maintenant, c'est qu'il ne reste
// RIEN : ni bandeau, ni détail, ni bouton à refermer.
console.log("\n══ je passe ══");
({ ctx, p } = await ouvrir());
// ─── ELLE N'ACCUEILLE PLUS PERSONNE ───
//
// « Peut-on la voir arriver plutôt au 2ᵉ ou 3ᵉ balayage et pas directement dès
// la première annonce, pour que ça ne soit pas trop dense tout de suite au
// démarrage ? » Une interruption posée avant qu'on ait rien vu n'interrompt
// rien : elle devient le premier écran, et c'est un compte à rebours qui
// accueille les gens. Elle attend donc deux annonces.
dire(!(await p.$(".ap-tour")), "« c'est à vous » n'accueille personne à l'ouverture");
for (let k = 0; k < 2; k++) {
  await p.click(".ap-rond");
  await p.waitForTimeout(700);
}
await p.waitForSelector(".ap-tour", { timeout: 8000 });
// ET SES CINQ MINUTES PARTENT DE LÀ. Armées à l'ouverture, elles se seraient
// écoulées derrière une bande que personne ne voyait — l'offre aurait pu
// expirer avant d'être montrée. C'est le seul compte à rebours du produit.
const dessus = await p.$eval(".ap-tour-h b", (e) => e.textContent.trim());
console.log(`  quand elle arrive, il lui reste : ${dessus}`);
const [mn, sc] = dessus.split(":").map(Number);
dire(mn * 60 + sc > 4 * 60 + 40, "ses cinq minutes commencent quand on la VOIT");
const avant = await p.$eval(".ap-tour-f", (e) => e.textContent.replace(/\s+/g, " ").trim());
console.log(`  avant de décider : « ${avant} »`);
dire(/après vous/.test(avant), "la règle se lit AVANT de décider, sur l'offre");
await p.click(".ap-tour-b button:not(.fort)");
await p.waitForTimeout(700);
const apres = await p.evaluate(() => ({
  bande: !!document.querySelector(".ap-tour"),
  reste: document.querySelector(".ap-tour")?.textContent.replace(/\s+/g, " ").trim() ?? "",
}));
console.log(`  après : « ${apres.reste || "(plus rien)"} »`);
dire(!apres.bande, "après « Je passe », la bande a disparu sans rien dire");
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
// ═══ ON N'ANNONCE PAS UN NOMBRE QU'IL NE PEUT PAS TENIR ═══
//
// « Il est écrit souvent "il reste 4 tables", or nous ne pouvons pas savoir
// combien de tables il reste puisque le restaurateur ne nous le dit pas. »
//
// LA DISTINCTION EST NETTE, ET ELLE SE GARDE ICI. Un STOCK qu'il a préparé, il
// le connaît : vingt portions le matin, douze vendues, il en reste huit, et
// c'est lui qui le dit à Léa. Une CAPACITÉ, non : les tables se libèrent et se
// reprennent toute la journée, personne ne recompte la salle entre deux
// services. Un chiffre écrit là est inventé — et un chiffre inventé une seule
// fois fait perdre quelqu'un pour toujours.
console.log("\n══ les nombres qu'on n'invente pas ══");
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("src/lib/direct/apercu-habitant.ts", "utf8");
  const fautifs = [...src.matchAll(/titre:\s*"([^"]*)"/g)]
    .map((m) => m[1])
    .filter((t) => /\b\d+\s*(tables?|places?|couverts?|fauteuils?)\b/i.test(t));
  console.log(`  titres qui comptent une capacité : ${fautifs.length ? JSON.stringify(fautifs) : "aucun"}`);
  dire(fautifs.length === 0,
    "aucune annonce ne compte des tables ou des places — on ne peut pas le savoir");
  const stocks = [...src.matchAll(/titre:\s*"([^"]*)"/g)]
    .map((m) => m[1])
    .filter((t) => /\b\d+\s*(portions?|parts?|bouquets?|pains?|pi[èe]ces?)\b/i.test(t));
  console.log(`  titres qui comptent un stock préparé : ${stocks.length ? JSON.stringify(stocks) : "aucun"}`);
  dire(stocks.length > 0,
    "mais un stock qu'il a préparé se compte encore : c'est lui qui nous l'a dit");
}

console.log("\n══ la voix du commerçant ══");
// ONZE HEURES : c'est une heure où la carte à conseil est dans le paquet. Ce
// qu'on vérifie ici est le RENDU d'un conseil, pas le hasard de l'horloge.
({ ctx, p } = await ouvrir("/autour-de-moi", 11));
// ON CHERCHE LA CARTE À CONSEIL, ON NE SUPPOSE PLUS QU'ELLE EST EN TÊTE.
// Elle l'était tant que les commerces suivis ouvraient le paquet ; depuis que
// ce qui vient de tomber passe devant, la tête dépend de l'heure qu'il est. Ce
// que cette section vérifie, c'est le RENDU d'un conseil — pas son rang, qui
// se vérifie dans « le moment ».
// ═══ ELLE A DESCENDU D'UNE COUCHE, ET C'ÉTAIT DEMANDÉ ═══
//
// « La citation est jolie. Mais dans une interface où l'utilisateur est déjà
// confronté à beaucoup d'informations, ce n'est pas prioritaire. Ça peut être
// excellent dans une deuxième couche : appui sur l'annonce → détails. »
//
// CE QU'ON VÉRIFIE A DONC CHANGÉ DE SENS, et il faut le dire : cette section
// exigeait la citation SUR LA FACE. Elle exige maintenant qu'elle n'y soit
// plus — et qu'elle soit bien sous le pli, signée. Une garde qu'on retourne
// sans le dire est pire qu'une garde absente.
const voixSurLaFace = () =>
  p.evaluate(() => {
    const d = document.querySelector(".ap-dessus");
    return {
      chez: d?.querySelector(".cd-chez")?.textContent.replace(/\s+/g, " ").split("·")[0].trim() ?? "",
      // Le conseil EN TEXTE n'a plus sa place sur la face. Le film, si : ce
      // n'est pas une phrase à lire, c'est un visage, et il se regarde en une
      // demi-seconde.
      conseilTexte: !!d?.querySelector(".cd-conseil:not(.film)"),
      detail: d?.querySelector(".cd-detail")?.textContent.trim() ?? "",
    };
  });
let sansCitation = await voixSurLaFace();
for (let k = 0; k < 14 && !sansCitation.detail; k++) {
  if (!(await avancer(p))) break;
  sansCitation = await voixSurLaFace();
}
console.log(`  sur la face : ${sansCitation.chez} → « ${sansCitation.detail} »`);
dire(!sansCitation.conseilTexte, "aucune citation sur la face : le prix et l'heure passent avant");
dire(!!sansCitation.detail, `la ligne de détail a repris sa place (${sansCitation.detail})`);

// ET ON LA RETROUVE SOUS LE PLI, ENTIÈRE. Descendre est un geste délibéré :
// c'est là que la voix du commerçant a sa valeur, et pas avant.
await p.goto(`${BASE}/autour-de-moi?h=12.6`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
let motDit = null;
for (let k = 0; k < 14; k++) {
  await p.click(".ap-vers-bas").catch(() => {});
  await p.waitForTimeout(700);
  motDit = await p.evaluate(() => {
    const m = document.querySelector(".ap-motdit");
    return m
      ? { mot: m.querySelector("em")?.textContent.trim() ?? "",
          qui: m.querySelector("s")?.textContent.trim() ?? "" }
      : null;
  });
  if (motDit?.mot) break;
  if (!(await avancer(p))) break;
}
console.log(`  sous le pli : « ${motDit?.mot} » — ${motDit?.qui}`);
dire(!!motDit?.mot, "la citation vit une couche plus bas, pas à la poubelle");
dire(/,/.test(motDit?.qui ?? ""), `signée d'un prénom et d'un métier (${motDit?.qui})`);

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
// ON EN REGARDE PLUS QU'AVANT, ET POUR UNE RAISON. Depuis « le moment », le
// haut du paquet est fait de publications fraîches — elles portent toutes une
// heure. Dix cartes ne sortaient donc plus de cette zone : le test ne voyait
// que des rectangles pleins et concluait que le rectangle était partout, alors
// qu'il suffisait de descendre. On échantillonne assez loin pour sortir du
// frais, et on ne compte pas deux fois la même carte lue pendant l'animation.
const bornes = [];
for (let k = 0; k < 22; k++) {
  const b = await p.evaluate(() => ({
    chez: document.querySelector(".ap-dessus .cd-chez")?.textContent
      .replace(/\s+/g, " ").split("·")[0].trim() ?? "",
    pill: document.querySelector(".ap-dessus .cd-quand")?.textContent
      .replace(/\s+/g, " ").trim() ?? "",
  }));
  const d = bornes[bornes.length - 1];
  if (!d || d.chez !== b.chez || d.pill !== b.pill) bornes.push(b);
  if (!(await avancer(p))) break;
}
for (const b of bornes.slice(0, 8))
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
// ON Y ENTRE PAR LA CLOCHE. La pastille chiffrée collée au cœur ouvrait la même
// page, mais elle comptait DEUX choses selon sa couleur — les nouvelles quand
// elle était ambre, les annonces gardées quand elle était verte — et « le cœur
// et les notifications en haut à droite, c'est incompréhensible ». Elle est
// partie ; la cloche, elle, n'a jamais dit qu'une chose.
await p.click(".ap-jai");
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
  await c3.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
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

// ═══ 8 · LA VIDÉO DANS LE ROND ═══
//
// LE ROND DOIT TENIR LES DEUX BOUTS, ET C'EST TOUT LE TEST. Trop grand, il
// devient une vidéo plein écran, c'est-à-dire une performance, et personne ne
// veut faire l'acteur. Trop petit — c'était la première version, trente-quatre
// pixels — et « on ne voit quasiment rien » : il ne reste qu'une vignette qui
// scintille. On vérifie donc un ENCADREMENT, pas une valeur : assez large pour
// qu'un geste s'y lise, assez étroit pour rester en marge de l'annonce.
//
// ON VÉRIFIE LE MÉCANISME PAR SON VRAI CHEMIN : l'outil de terrain filme le
// geste et la carte préparée le porte. Le test tourne son propre clip, neutre
// et jetable — c'est aussi ce qui prouve que le chemin du terrain fonctionne,
// et pas seulement la fixture.
console.log("\n══ la vidéo dans le rond ══");
{
  const c4 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c4.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  const q = await c4.newPage();
  q.on("pageerror", (e) => erreurs.push(String(e)));
  q.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await q.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });

  // ON TOURNE UN CLIP NEUTRE DANS LE NAVIGATEUR — un carré de couleur qui
  // bouge, trois dixièmes de seconde. Il ne ressemble à personne, il ne
  // sort jamais du test, et il passe par exactement le même chemin qu'une
  // vidéo filmée devant un commerçant.
  const clip = await q.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 120; c.height = 160;
    const x = c.getContext("2d");
    let n = 0;
    const t = setInterval(() => {
      x.fillStyle = `hsl(${(n += 24) % 360} 60% 45%)`;
      x.fillRect(0, 0, 120, 160);
    }, 60);
    const flux = c.captureStream(25);
    const bouts = [];
    const enr = new MediaRecorder(flux, { mimeType: "video/webm" });
    enr.ondataavailable = (e) => bouts.push(e.data);
    enr.start();
    await new Promise((r) => setTimeout(r, 500));
    enr.stop();
    clearInterval(t);
    await new Promise((r) => { enr.onstop = r; });
    const b = new Blob(bouts, { type: "video/webm" });
    return await new Promise((r) => {
      const l = new FileReader();
      l.onload = () => r(String(l.result));
      l.readAsDataURL(b);
    });
  });
  dire(clip.startsWith("data:video/webm"), `le clip du test est tourné (${clip.length} car.)`);

  // ON PRÉPARE UN COMMERCE AVEC SA VOIX ET SA VIDÉO, par le vrai magasin.
  await q.evaluate((v) => {
    localStorage.setItem("clikme.preparation.v1", JSON.stringify([{
      id: "prep-essai", nom: "Boucherie Lasserre", metier: "Boucherie",
      branche: "restaurant", adresse: "12 rue Saint-Vincent",
      horaires: "7 h – 13 h", distance: "180 m", metres: 180,
      quoi: "La côte de bœuf maturée", prix: "34 €/kg",
      prenom: "Serge", role: "boucher",
      conseil: "La côte, attendez jeudi. Prenez la bavette.",
      video: v,
    }]));
  }, clip);
  await q.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await q.waitForTimeout(4600);

  const rond = await q.evaluate(() => {
    const t = document.querySelector(".ap-dessus .cd-tete");
    const v = t?.querySelector("video");
    const r = t?.getBoundingClientRect();
    return {
      chez: document.querySelector(".ap-dessus .cd-chez")?.textContent
        .replace(/\s+/g, " ").split("·")[0].trim() ?? "",
      video: !!v,
      muet: v?.muted ?? null,
      boucle: v?.loop ?? null,
      taille: r ? Math.round(r.width) : 0,
      // LA LARGEUR DE L'ÉCRAN SERT DE RÈGLE : un rond se juge par rapport à ce
      // qui l'entoure, pas en pixels absolus.
      ecran: window.innerWidth,
      // ET LA CARTE DU DESSOUS N'EN CHARGE AUCUNE : voir `sansVideo`.
      dessous: !!document.querySelector(".ap-dessous video"),
    };
  });
  const part = Math.round((rond.taille / rond.ecran) * 100);
  console.log(`  ${rond.chez} · rond de ${rond.taille} px (${part} % de l'écran) · vidéo ${rond.video ? "oui" : "non"}`);
  dire(rond.video, "la vidéo est dans le rond de la carte");
  dire(rond.taille >= 60, `on y voit enfin quelque chose (${rond.taille} px)`);
  dire(part <= 25, `et il reste en marge de l'annonce (${part} % de la largeur)`);
  dire(rond.muet === true, "elle est muette");
  dire(rond.boucle === true, "et elle tourne en boucle");
  dire(!rond.dessous, "la carte du dessous n'en charge aucune");
  await q.screenshot({ path: "/tmp/voix-video.png" });

  // ── LE SON, SUR APPUI ──
  await q.click(".ap-vers-bas", { force: true });
  await q.waitForTimeout(900);
  await q.$eval(".ap-voix-t", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await q.waitForTimeout(300);
  await q.click(".ap-voix-t.film");
  await q.waitForTimeout(900);
  const grand = await q.evaluate(() => {
    const d = document.querySelector(".ap-film");
    const v = d?.querySelector("video");
    return {
      ouvert: !!d,
      // ICI LE SON EST PERMIS : c'est une demande, pas une interruption.
      muet: v?.muted ?? null,
      commandes: v?.hasAttribute("controls") ?? null,
      qui: d?.querySelector(".ap-film-q b")?.textContent.trim() ?? "",
    };
  });
  console.log(`  en grand : ${grand.qui}`);
  dire(grand.ouvert, "l'appui l'ouvre en grand");
  dire(grand.muet === false, "avec le son");
  dire(grand.commandes === true, "et les commandes");
  dire(/boucher/.test(grand.qui), `elle dit qui c'est (${grand.qui})`);
  await q.screenshot({ path: "/tmp/voix-grand.png" });
  await c4.close();
}

// ET LA FICHE EN PORTE UNE AUSSI — arbitrage rendu sur l'enseigne du second
// plan, voir LISEZ-MOI.md. La vidéo aux deux visages, elle, reste dehors :
// un visage n'est pas une enseigne.
{
  const c5 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c5.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  const q = await c5.newPage();
  await q.goto(`${BASE}/autour-de-moi?chez=emporter`, { waitUntil: "networkidle" });
  await q.waitForTimeout(1500);
  const rien = await q.evaluate(() => {
    const t = document.querySelector(".ap-arrivee .ap-voix-t");
    return {
      rond: !!t,
      film: !!t?.querySelector("video"),
      taille: t ? Math.round(t.getBoundingClientRect().width) : 0,
    };
  });
  dire(rien.rond, "le rond de la porte est là");
  dire(rien.film, "et il porte la vidéo de la fiche");
  // SUR LA FICHE ON EST À L'ARRÊT, PLUS EN TRAIN DE BALAYER : c'est l'endroit
  // où le rond peut prendre le plus de place sans rien bousculer, et il serait
  // absurde qu'il y soit plus petit que sur la carte qu'on traverse.
  dire(rien.taille >= 70, `et on l'y voit en grand (${rien.taille} px)`);
  await c5.close();
}

// ═══ 9 · LE MOMENT — CE QUI VIENT DE TOMBER ═══
//
// CE QU'AUCUNE FICHE GOOGLE NE SAIT DIRE. Des horaires, une adresse, un menu :
// tout le monde les a. « Il vient de se passer quelque chose, il y a douze
// minutes, à trois cents mètres » n'existe nulle part ailleurs.
//
// TROIS CHOSES DOIVENT ÊTRE VRAIES, et la troisième est celle qui a lâché au
// premier essai :
//
//   1. LA CARTE FRAÎCHE EST EN TÊTE du paquet, devant les commerces suivis.
//   2. ELLE PORTE SON HEURE, et c'est la seule qui la porte — si tout le paquet
//      était frais, plus rien ne le serait.
//   3. ELLE MONTRE LE MOMENT QUI L'A FAIT REMONTER. La carte remontait bien,
//      mais affichait le premier moment dont la fenêtre couvrait l'heure : à
//      8 h 18 la boulangerie remontait pour sa fournée de 7 h et montrait
//      « MENU DU JOUR · La formule du midi », pastille « il y a 18 min » à
//      côté. Le classement disait une chose, la carte en montrait une autre.
//
// ON BALAIE LA JOURNÉE AVEC UNE HORLOGE FAUSSE : c'est le seul moyen de voir
// une fonction qui, par construction, n'est vraie que quatre-vingt-dix minutes.
console.log("\n══ le moment ══");
{
  // Chaque heure porte le titre attendu en tête de paquet. Les trous sont
  // volontaires et ils comptent autant : à 17 h personne n'a rien publié, et la
  // rareté est ce qui donne du poids aux autres heures.
  const journee = [
    [8.3, "La fournée de 7 h"],
    // ON NE COMPTE PLUS LES TABLES — voir « les nombres qu'on n'invente pas ».
    [11.7, "De la place, sans attendre"],
    [13.5, "Dernières portions"],
    [16, "Les plats cuisinés du jour"],
    // 17 H 30 ÉTAIT L'HEURE CREUSE DE CETTE GARDE, ET ELLE NE L'EST PLUS.
    // L'application ouvre désormais sur TOUTE la ville et non sur les
    // restaurants : à 17 h 30 les tables sont calmes, mais la fleuriste vient
    // de sortir ses bouquets. Ce n'est pas la fraîcheur qui a débordé — c'est
    // le paquet qui s'est élargi, et c'était le but. Ce que cette section
    // protège vraiment reste intact : jamais plus de deux pastilles à la fois.
    [17.5, "Il reste 4 bouquets"],
    [18.3, "Ce qui reste, à moitié prix"],
    [21.4, "Service du soir"],
  ];
  let bons = 0;
  for (const [h, attendu] of journee) {
    const ctx9 = await nav.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, locale: "fr-FR",
    });
    await ctx9.clock.setFixedTime(
      new Date(2026, 8, 2, Math.floor(h), Math.round((h % 1) * 60), 0),
    );
    const p9 = await ctx9.newPage();
    p9.on("pageerror", (e) => erreurs.push(String(e)));
    await p9.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
    await p9.waitForTimeout(1200);
    const r = await p9.evaluate(() => ({
      frais: document.querySelector(".ap-dessus .cd-frais")?.textContent.trim() ?? "",
      quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
      // COMBIEN DE PASTILLES DANS TOUT LE PAQUET : au-delà de deux cartes
      // fraîches visibles, la tête du paquet n'en est plus une.
      combien: document.querySelectorAll(".cd-frais").length,
    }));
    const hh = `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
    // LA CASSE VIENT DU CSS, PAS DU TEXTE : `.cd-offre` est en `uppercase`,
    // donc `textContent` rend l'original. On compare sans en tenir compte.
    const ok = attendu
      ? r.quoi.toLowerCase() === attendu.toLowerCase()
        && /il y a|instant/.test(r.frais)
        && r.combien <= 2
      : r.frais === "";
    if (ok) bons++;
    console.log(`  ${hh} → ${r.frais ? `[${r.frais}] ` : "· "}${r.quoi || "(rien)"}`);
    if (!ok) console.log(`      attendu : ${attendu ?? "aucune pastille"}`);
    if (h === 13.5) await p9.screenshot({ path: "/tmp/moment.png" });
    await ctx9.close();
  }
  dire(bons === journee.length, `la journée se lit heure par heure (${bons}/${journee.length})`);

  // ─── ET LA COULEUR N'EST PAS CELLE DE « PASSER » ───
  // Le premier essai avait mis la pastille en corail, à deux centimètres d'un
  // tampon « PASSER » en #FF6B6B : « nouveau » et « refuser » du même signe.
  const ctxC = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await ctxC.clock.setFixedTime(new Date(2026, 8, 2, 13, 30, 0));
  const pc = await ctxC.newPage();
  await pc.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await pc.waitForTimeout(1200);
  const teintes = await pc.evaluate(() => {
    const pt = document.querySelector(".cd-frais i");
    const tp = document.querySelector(".ap-tampon.non");
    const lire = (e) => (e ? getComputedStyle(e) : null);
    return {
      point: lire(pt)?.backgroundColor ?? "",
      tampon: lire(tp)?.color ?? "",
    };
  });
  console.log(`  point ${teintes.point} · tampon « passer » ${teintes.tampon}`);
  dire(!!teintes.point && teintes.point !== teintes.tampon,
    "la fraîcheur n'a pas la couleur de « passer »");
  await ctxC.close();
}

// ═══ 10 · LA CARTE NE SORT PAS PENDANT QU'ELLE QUESTIONNE ═══
//
// « Elle me donne le résultat de notre conversation après une seule question, et
// c'est APRÈS qu'elle me demande le prix. » La carte sortait sans prix, suivie de
// « et c'est à combien ? » : le commerçant ne sait plus s'il doit répondre ou
// appuyer — et s'il appuie, il publie une annonce sans prix à toute la ville.
//
// ET IL EST REVENU, DEUX SEMAINES PLUS TARD : « on me donne le résultat et
// ensuite on me demande le nombre de portions ». C'est nous qui l'avions
// réintroduit, en autorisant la carte à sortir dès qu'UN chiffre était connu
// pour gagner un tour. À l'écran, ça donne une case QUANTITÉ à « — » sous la
// question « combien de portions ? », avec un bouton « C'est bon » dessous.
// Cette section porte donc les deux signalements, et le second en premier.
//
// LA CONSIGNE EST DANS LE PROMPT, MAIS ON NE VÉRIFIE PAS UN PROMPT. On vérifie
// le garde-fou qui tient le jour où le modèle se trompe, c'est-à-dire le jour de
// la démonstration.
console.log("\n══ la carte et la question ══");
{
  const { carteAMontrer } = await import("../src/lib/direct/carte-a-valider.ts");
  const cas = [
    ["Combien de portions avez-vous prévu ?", { prix: "14 €", quantite: null }, false,
      "SA CAPTURE : quantité à « — » pendant qu'elle demande les portions"],
    ["Et c'est à combien ?", { prix: "", quantite: null }, false,
      "prix vide pendant qu'elle demande le prix : pas de carte"],
    ["Et c'est à combien ?", { prix: "14 €", quantite: null }, true,
      "mais le prix est là : cette question-là ne contredit rien"],
    ["Le créneau se libère à 14 h 30, je le mets en ligne ?", { prix: "", quantite: 1 }, true,
      "un créneau n'a pas de prix et doit pouvoir se proposer"],
    ["Vous me le photographiez ?", { prix: "14 €", quantite: null }, true,
      "la photo est la seule question qui accompagne une carte : le bouton y est"],
    ["Je le mets en ligne.", { prix: "", quantite: null }, true,
      "sans question, rien ne retient la carte"],
    ["Et c'est à combien ?", null, false, "pas de carte du tout"],
  ];
  for (const [dit, c, attendu, quoi] of cas) {
    dire(carteAMontrer(dit, c) === attendu, quoi);
  }
}

// ═══ 11 · CE QU'ON POSE SUR L'ÉCRAN D'ACCUEIL S'OUVRE AU BON ENDROIT ═══
//
// « Je n'arrive pas à mettre le lien de l'assistante sur ma page d'accueil du
// téléphone sans que ça me ramène à la page d'accueil clikme.fr. »
//
// LE TÉLÉPHONE NE RETIENT PAS LA PAGE DEPUIS LAQUELLE ON INSTALLE : il retient
// le `start_url` du manifeste. Sans manifeste à elle, une page hérite de celui
// de la racine — qui porte `start_url: "/"` — et devient inatteignable une fois
// posée sur l'écran d'accueil. Le défaut avait été corrigé pour « Autour de
// moi » ; l'assistante est arrivée après, et personne n'y a pensé. Il se
// reproduira à chaque nouvel écran, donc il se vérifie.
console.log("\n══ l'écran d'accueil du téléphone ══");
{
  const aInstaller = ["/autour-de-moi", "/autour-de-moi/assistante"];
  for (const page of aInstaller) {
    const html = await (await fetch(`${BASE}${page}`)).text();
    const lien = /<link rel="manifest" href="([^"]+)"/.exec(html)?.[1] ?? "";
    dire(!!lien && lien !== "/manifest.json",
      `${page} a son propre manifeste (${lien || "aucun"})`);
    if (!lien || lien === "/manifest.json") continue;
    const m = await (await fetch(`${BASE}${lien}`)).json();
    console.log(`  ${page} → ouvre « ${m.start_url} », icône « ${m.short_name} »`);
    // C'EST LA SEULE ASSERTION QUI COMPTE : ce qui s'ouvre est bien cette page.
    dire(m.start_url === page, `et il ouvre cette page-là, pas la racine`);
    // ET IL NE RETOMBE PAS DANS SAFARI AU PREMIER LIEN.
    dire(typeof m.scope === "string" && page.startsWith(m.scope),
      `la navigation reste dans l'application (scope ${m.scope})`);
    // DEUX INSTALLATIONS NE DOIVENT PAS S'ÉCRASER : un commerçant a besoin des
    // deux, la sienne et celle de ses voisins.
    dire(m.id === page, `et il ne remplace pas l'autre installation (id ${m.id})`);
  }
}

// ═══ 12 · L'ÉCHO DU CONTEXTE NE REPART PAS COMME SA PHRASE ═══
//
// Vu sur la capture d'une démonstration : la bulle verte du commerçant — celle
// qui porte SA phrase — contenait le texte de contexte qu'on envoie au service
// de transcription, recopié à l'identique. Sur un enregistrement muet, ces
// modèles rendent ce qu'on leur a soufflé. Léa y a répondu poliment, deux fois.
//
// LE RISQUE SYMÉTRIQUE SERAIT PIRE : rejeter une vraie phrase parce qu'elle
// parle de portions et de prix, ce qui est exactement le métier. Les deux
// moitiés se vérifient donc ensemble.
console.log("\n══ l'écho du contexte ══");
{
  const { estUnEcho } = await import("../src/lib/direct/echo-transcription.ts");
  const CTX =
    "Commerce de proximité à Dax. Le commerçant décrit sa journée : plat du jour, " +
    "arrivage, créneaux libres, prix en euros, nombre de portions ou de pièces.";
  dire(estUnEcho(CTX, CTX), "le contexte entier est reconnu");
  dire(estUnEcho("créneaux libres, prix en euros, nombre de portions ou de pièces", CTX),
    "ses échos partiels aussi");
  dire(estUnEcho("", CTX), "et un texte vide compte comme rien de dit");
  const vraies = [
    "magret de canard avec des frites maison, quatorze euros, j'en ai fait trente",
    "il me reste six portions",
    "on a un arrivage de robes en lin ce matin",
    "le plat du jour c'est la garbure, douze euros",
    "j'ai des créneaux libres cet après-midi à quinze heures",
    "vingt-cinq portions à quatorze euros",
  ];
  const rejetees = vraies.filter((v) => estUnEcho(v, CTX));
  dire(rejetees.length === 0,
    `et aucune vraie phrase de commerçant n'est rejetée${rejetees.length ? " : " + rejetees[0] : ""}`);
}

// ═══ 14 · LE MODÈLE SAIT FAIRE CE QU'ON LUI DEMANDE ═══
//
// LA PANNE MESURÉE, ET ELLE A COÛTÉ UNE JOURNÉE DE TERRAIN : Léa répondait
// « je n'ai pas réussi à vous répondre » à chaque tour, du bonjour jusqu'à la
// fin. On avait changé le modèle pour gagner du rythme — sans voir que la route
// s'appuie sur `output_config` (le schéma JSON de la carte, et l'effort réduit),
// qui n'existe que sur la génération 5. Envoyé à un modèle 4.5, ça répond 400,
// et 400 veut dire panne à tous les tours.
//
// Le défaut ne se voyait NULLE PART ailleurs : le projet compile, les tests
// passent (ils simulent la route), l'écran s'affiche. Il ne se voyait qu'avec
// une vraie clé, c'est-à-dire seulement sur son téléphone. C'est précisément le
// genre de faute qu'un test doit attraper à la place du terrain.
console.log("\n══ le modèle et ce qu'on lui demande ══");
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("src/app/api/direct/assistante/route.ts", "utf8");
  const defaut = src.match(/const MODELE = [^\n]*\|\|\s*"([^"]+)"/)?.[1] ?? "";
  const reglages = /output_config/.test(src);
  console.log(`  modèle par défaut : ${defaut || "(introuvable)"}`);
  console.log(`  réglages génération 5 utilisés : ${reglages ? "oui" : "non"}`);
  dire(!!defaut, "le modèle par défaut se lit dans le fichier");
  // La génération 5 se reconnaît au nom, et elle n'est jamais datée.
  dire(!reglages || /^claude-(opus|sonnet|fable)-5/.test(defaut),
    `le modèle connaît « output_config » (${defaut})`);
  dire(!/-\d{8}$/.test(defaut), "et son nom ne porte pas de date collée à la fin");
  // La panne ne doit plus être muette : elle dit pourquoi.
  dire(/pourquoi/.test(src), "une panne remonte sa raison jusqu'à l'écran");
}

dire(erreurs.length === 0, `aucune erreur${erreurs.length ? " : " + erreurs[0] : ""}`);
await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
