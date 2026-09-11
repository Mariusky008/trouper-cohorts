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
/**
 * DESCENDRE SUR LA FICHE DU COMMERCE.
 *
 * IL Y AVAIT UN SEUL BOUTON, `.ap-vers-bas`, et il portait « Voir tout » sous le
 * planning pose sur l'annonce. Ce bloc a maigri — « il prend beaucoup de place
 * et pourrait faire passer le client a cote du message principal » — et le
 * geste est passe dans la ligne d'identite.
 *
 * ET « INFOS BOUTIQUE » N'EST PLUS UNE DESCENTE. Depuis que la fiche du
 * commerce a quitte le pli, cette porte-la SORT vers /autour-de-moi/boutique :
 * la viser ici ferait quitter la page au verifieur au lieu de descendre dedans.
 * La seule descente qui reste est « Voir le planning », c'est-a-dire le seul
 * bouton encore present dans `.ap-ident-d` — les liens en sont exclus par la
 * balise. Sur les cartes sans journee, `.ap-vers-bas` prend le relais.
 */
const versLaFiche = async (page) => {
  const porte = ".ap-dessus .ap-ident-d button, .ap-dessus .ap-vers-bas";
  await page.click(porte, { force: true, timeout: 4000 });
};

const avancer = async (page) => {
  try {
    // LA MARGE COUVRE LE BOND LE PLUS LONG. Le bond dore du fantome dure une
    // seconde et demie ; a 1500 ms le delai etait exactement sa duree, donc une
    // course. On ne mesure pas la vitesse du bouton ici, on traverse le paquet.
    await page.click(".ap-suiv", { timeout: 4000 });
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
// L'HORLOGE EST FIXÉE ICI AUSSI, ET ELLE MANQUAIT. Cette section lit la carte
// de tête, qui dépend de l'heure : le conteneur a tourné à 18 h 46 et la tête
// du paquet était une offre d'emploi, dont la pastille dit « il y a une
// semaine » et jamais une heure. La garde échouait sur une carte parfaitement
// correcte — c'est-à-dire qu'elle mesurait l'heure du conteneur.
let { ctx, p } = await ouvrir("/autour-de-moi", 12.5);
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
  // L'HEURE EST FIXEE : ce restaurant sert de 11 h a 15 h puis de 19 h a 22 h.
  // Lu a l'heure du conteneur, la garde tombait sur un paquet ou il n'est plus.
  const { ctx: c2, p: p2 } = await ouvrir("/autour-de-moi?chez=centre", 12.5);
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

// ═══ 2 · LE CŒUR GARDE UNE ANNONCE, ET ON VOIT OÙ ELLE VA ═══
console.log("\n══ mettre une annonce de côté ══");
// ═══ CE QUE CETTE SECTION A MESURÉ, ET CE QU'ELLE MESURE MAINTENANT ═══
//
// ELLE A D'ABORD COMPTÉ UN ENCART. « Je retirerais complètement le gros encart
// "suivre cette terrasse au soleil" : il casse le parcours principal. » Elle
// vérifiait le français de cet encart — « suivre CETTE terrasse » et non
// « suivre UNE terrasse ». L'objet a disparu, et la garde a suivi le geste : le
// nom du commerce se retrouvait dans l'écho qui répondait après l'appui.
//
// ELLE NE MESURE PLUS UNE PHRASE, PARCE QU'IL N'Y EN A PLUS. Le cœur ne suit
// plus un commerce : il garde l'ANNONCE. « Si je mets trois annonces menu en
// favori, je peux revenir dessus et faire un choix final. » Une phrase qui dit
// « ajouté » puis s'efface apprend moins qu'une poche qu'on voit se remplir, et
// c'est cette poche qui répond désormais. Aucune phrase à conjuguer, donc
// aucune faute possible : la garde de langue n'a plus d'objet et elle part.
//
// ELLE VÉRIFIE D'ABORD LES ABSENCES : une règle qu'on retourne sans le dire est
// pire qu'une règle absente.
dire(!(await p.$(".ap-suivre-face")),
  "aucun encart ne demande de s'abonner au milieu de l'annonce");
dire(!(await p.$(".ap-haut .ap-jai")),
  "et aucune cloche sur l'annonce : elle est descendue sur l'onglet Profil");
const poche = () => p.$eval(".ap-poche", (e) =>
  Number(e.textContent.replace(/[^0-9]/g, "")) || 0).catch(() => -1);
dire((await poche()) === 0, "la poche est là, vide, avant qu'on ait rien gardé");
// ─── LE NOM SE LIT DANS LA FICHE DU COMMERCE, PAS SOUS LE PRIX ───
// La maquette a descendu l'enseigne dans le rectangle, avec son logo et sa note
// Google : `.cd-chez` n'existe plus sur cette face, et le lire renvoyait une
// chaîne vide — donc la même carte à chaque tour, et un cœur qui s'allumait
// puis s'éteignait. La poche comptait alors moins que ce qu'on croyait y mettre.
const nomDuSommet = () => p.$eval(".ap-dessus .ap-ident-l b", (e) =>
  e.textContent.trim()).catch(() => "");
const gardes = [];
for (let k = 0; k < 3; k++) {
  const nom = await nomDuSommet();
  if (!nom) break;
  await p.click(".ap-agir.favori").catch(() => {});
  await p.waitForTimeout(420);
  gardes.push(nom);
  if (!(await avancer(p))) break;
  // ON ATTEND QUE LA CARTE AIT VRAIMENT CHANGÉ. Le vol dure plus longtemps que
  // le délai d'`avancer` : sans cette attente, le tour suivant retrouve la MÊME
  // carte et le second appui sur le cœur la RETIRE des favoris. La garde
  // mesurait alors sa propre impatience.
  for (let t = 0; t < 20 && (await nomDuSommet()) === nom; t++) {
    await p.waitForTimeout(120);
  }
}
const compte = await poche();
console.log(`  gardées : ${gardes.join(" · ")} → la poche affiche ${compte}`);
dire(compte === gardes.length,
  `la poche compte ce qu'on y a mis (${compte} pour ${gardes.length})`);
// ET ON LES RETROUVE : c'est la seule raison pour laquelle on appuie.
await p.click(".ap-poche");
await p.waitForTimeout(700);
const titre = await p.$eval(".ap-page-t b", (e) => e.textContent.trim()).catch(() => "");
const listees = await p.$$eval(".ap-liste .ap-ligne b", (es) =>
  es.map((e) => e.textContent.trim()));
console.log(`  « ${titre} » → ${listees.join(" · ")}`);
dire(/favoris/i.test(titre), "la poche ouvre une page qui porte leur nom");
dire(gardes.every((n) => listees.includes(n)),
  "et les trois annonces mises de côté y sont, pour trancher");
await ctx.close();

// ═══ 3 · LE TOUR DE RÔLE NE SE JUSTIFIE PLUS APRÈS COUP ═══
//
// LA RÈGLE SE LIT AVANT, ET RIEN NE SE LIT APRÈS. On appuie sur « Je passe » :
// le geste est son propre accusé de réception, et la bande qui le répétait
// était une fenêtre à fermer pour une décision déjà prise — « une pop-up qui
// ne sert à rien ». Ce qui doit rester vrai maintenant, c'est qu'il ne reste
// RIEN : ni bandeau, ni détail, ni bouton à refermer.
console.log("\n══ je passe ══");
({ ctx, p } = await ouvrir("/autour-de-moi", 12.5));
// ─── ELLE N'ACCUEILLE PLUS PERSONNE ───
//
// « Peut-on la voir arriver plutôt au 2ᵉ ou 3ᵉ balayage et pas directement dès
// la première annonce, pour que ça ne soit pas trop dense tout de suite au
// démarrage ? » Une interruption posée avant qu'on ait rien vu n'interrompt
// rien : elle devient le premier écran, et c'est un compte à rebours qui
// accueille les gens. Elle attend donc deux annonces.
dire(!(await p.$(".ap-tour")), "« c'est à vous » n'accueille personne à l'ouverture");
for (let k = 0; k < 2; k++) {
  await p.click(".ap-suiv");
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
      chez: (d?.querySelector(".ap-ident-l b") ?? d?.querySelector(".cd-chez"))
        ?.textContent.replace(/\s+/g, " ").split("·")[0].trim() ?? "",
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
  await versLaFiche(p).catch(() => {});
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
// ─── ET ELLE AUSSI FIXE SON HEURE ───
// Cette section traverse le paquet pour trouver des cartes SANS rectangle. Le
// paquet change avec l'heure : a 19 h il est fait de commerces du soir, qui
// portent presque tous une borne horaire, et la garde echouait par
// intermittence selon la minute ou on la lancait. Un test qui depend de
// l'heure du conteneur ne se croit plus au bout de deux fois.
({ ctx, p } = await ouvrir("/autour-de-moi", 12.5));
// ON EN REGARDE PLUS QU'AVANT, ET POUR UNE RAISON. Depuis « le moment », le
// haut du paquet est fait de publications fraîches — elles portent toutes une
// heure. Dix cartes ne sortaient donc plus de cette zone : le test ne voyait
// que des rectangles pleins et concluait que le rectangle était partout, alors
// qu'il suffisait de descendre. On échantillonne assez loin pour sortir du
// frais, et on ne compte pas deux fois la même carte lue pendant l'animation.
const bornes = [];
for (let k = 0; k < 22; k++) {
  const b = await p.evaluate(() => ({
    chez: (document.querySelector(".ap-dessus .ap-ident-l b")
      ?? document.querySelector(".ap-dessus .cd-chez"))?.textContent
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
// ─── ET L'HORLOGE EST FIXEE, PARCE QUE LE BOULANGER FERME ───
// Cette section lisait l'heure du conteneur. A 19 h 47, la boulangerie n'a plus
// rien a proposer — ses moments s'arretent a 19 h 30 — donc elle quitte le
// paquet, ce qui est la regle du produit et pas un defaut. La garde echouait
// alors sur une file parfaitement saine : elle mesurait l'heure du conteneur.
// On se met a 18 h 12, quand « ce qui reste, a moitie prix » tourne.
({ ctx, p } = await ouvrir("/autour-de-moi?chez=boulange", 18.2));
await p.click(".ap-arr-ville");
await p.waitForTimeout(1300);
await versLaFiche(p);
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
// ON Y ENTRE PAR LA CLOCHE, ET C'EST UNE CORRECTION DE CE FICHIER.
//
// CETTE PAGE A PORTÉ QUATRE PORTES SUCCESSIVES, et chacune est tombée pour la
// même raison : elle disait deux choses à la fois. D'abord une pastille chiffrée
// qui comptait les nouvelles en ambre et les annonces gardées en vert — « le
// cœur et les notifications en haut à droite, c'est incompréhensible ». Puis une
// cloche partie sur l'onglet Profil. Puis la poche, à côté du cœur.
//
// LA DERNIÈRE SÉPARATION EST CELLE QUI COMPTE : « le bouton cœur et le bouton
// des notifications à côté montrent la même chose, or le cœur montre les favoris
// et les notifications tout le reste. » Ce sont maintenant deux pages distinctes.
// La FILE D'ATTENTE n'est pas un favori — on ne l'a pas choisie, elle nous
// prévient — donc elle vit avec les nouvelles, derrière la cloche. Ce test
// entrait encore par la poche et n'y trouvait plus rien : il mesurait la page
// d'avant, pas le défaut.
await p.click(".ap-cloche");
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

// ── ET « CE QUI REVIENT » CÔTÉ CLIENT, SUR LA PAGE DU COMMERCE ──
//
// IL ÉTAIT SOUS LE PLI ET IL EST PARTI SUR /autour-de-moi/boutique, avec « Vu
// chez eux », la fiche du commerce et le recrutement. Raison : mesuré sur le
// même commerce, le pli faisait 2 490 points de haut et trois de ses cinq blocs
// se retrouvaient à l'identique sur la page — « je ne vois pas de différence si
// ce n'est le menu du bas ». Ce n'était pas la page qu'il fallait redessiner,
// c'était le pli qu'il fallait vider.
//
// LE PLI GARDE CE QUI RÉPOND À « J'Y VAIS ? » : la journée, la file, suivre, en
// parler. La page répond à « c'est qui ? ». Un seul bloc les recouvre encore,
// la journée, et c'est le bon : c'est lui qui fait le lien entre les deux.
console.log("\n══ ce qui revient, côté client ══");
// `ouvrir` attend `.ap-fav2`, qui est le paquet : la page du commerce n'en a
// pas, et n'a pas non plus de carte d'arrivée à écarter. On l'ouvre donc
// simplement.
ctx = await nav.newContext({
  viewport: { width: 393, height: 852 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: "fr-FR",
});
p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
await p.waitForSelector(".bq-hero");
await p.waitForTimeout(900);
const hab = await p.evaluate(() =>
  [...document.querySelectorAll(".bq-hab li")].map((e) => ({
    t: e.querySelector("b")?.textContent.trim() ?? "",
    q: e.querySelector("span")?.textContent.trim() ?? "",
    b: e.querySelector(".bq-hab-b")?.textContent.trim() ?? "",
    lien: e.querySelector(".bq-hab-b")?.getAttribute("href") ?? "",
  })));
for (const h of hab) console.log(`  ${h.t} — ${h.q} → ${h.b}`);
dire(hab.length > 0, "la page dit ce qui revient");
// LE JOUR N'EST NOMMÉ QUE QUAND IL DOMINE VRAIMENT — deux tiers des fois.
dire(hab.some((h) => /plutôt le/.test(h.q)),
  "et nomme le jour quand il y en a un");
// SA MEILLEURE RÉPONSE N'EST PAS UNE ARCHIVE, C'EST UN MESSAGE. Sur une page,
// c'est un lien direct : plus besoin d'une feuille par-dessus pour ne pas
// quitter la pile, puisqu'on n'est plus dans la pile.
dire(hab.every((h) => /redemander/i.test(h.b)),
  "avec le moyen de lui demander s'il en a encore");
const dem = decodeURIComponent((hab[0]?.lien ?? "").split("text=")[1] ?? "");
console.log(`  « ${dem} »`);
dire(/^https:\/\/wa\.me\//.test(hab[0]?.lien ?? ""),
  "le geste ouvre directement le message");
// ON DEMANDE, ON NE PREND PAS. « Je prends la garbure » annonce une commande
// pour quelque chose qui n'existe peut-être plus, et met le commerçant en
// faute de ne pas l'avoir.
dire(/est-ce que vous avez encore/i.test(dem),
  `le message est une question (${dem.slice(0, 72)})`);
dire(!/je prends/i.test(dem), "et n'annonce pas une commande");
dire(!/\?\./.test(dem), "sans double ponctuation");
await p.screenshot({ path: "/tmp/ce-qui-revient.png", fullPage: true });
await ctx.close();

// ── ET LE PLI, LUI, NE LES PORTE PLUS ──
//
// C'EST LA MOITIÉ DU TEST, ET LA PLUS FRAGILE : une fonction déplacée qui
// resterait aussi à son ancienne place ne serait pas un déménagement, ce serait
// un doublon de plus — celui-là même qu'on vient de retirer.
console.log("\n══ le pli ne garde que ce qui décide ══");
({ ctx, p } = await ouvrir("/autour-de-moi?chez=emporter", 12.5));
await p.click(".ap-arr-ville");
await p.waitForTimeout(1300);
await versLaFiche(p);
await p.waitForTimeout(900);
const pli = await p.evaluate(() => ({
  blocs: [...document.querySelectorAll(".ap-bloc")]
    .map((b) => (b.querySelector("h3")?.textContent ?? "(geste)").trim()),
  sortie: document.querySelector(".ap-tout b")?.textContent.trim() ?? "",
  href: document.querySelector(".ap-tout")?.getAttribute("href") ?? "",
  porte: document.querySelector(".ap-ident-d a")?.getAttribute("href") ?? "",
}));
console.log(`  ${pli.blocs.join(" · ")}`);
dire(pli.blocs.includes("La journée"), "la journée reste : c'est ce qui décide maintenant");
dire(pli.blocs.includes("En parler"), "les gestes restent");
dire(!pli.blocs.includes("Le commerce"), "la fiche du commerce n'y est plus");
dire(!pli.blocs.includes("Vu chez eux"), "le mur des clients non plus");
dire(!pli.blocs.includes("Ce qui revient"), "ni ce qui revient");
dire(pli.href === "/autour-de-moi/boutique", `et le pli a une sortie (${pli.sortie})`);
dire(pli.porte === "/autour-de-moi/boutique",
  "« Infos boutique » mène au même endroit, plus au bloc d'en dessous");
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
      chez: (document.querySelector(".ap-dessus .ap-ident-l b")
      ?? document.querySelector(".ap-dessus .cd-chez"))?.textContent
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

  // ── LE SON, SUR APPUI — MAIS SUR LA PAGE DU COMMERCE ──
  //
  // IL ÉTAIT SOUS LE PLI, DANS « LE COMMERCE ». Ce bloc a déménagé sur
  // /autour-de-moi/boutique : le pli faisait le travail de la page, les deux
  // écrans se recouvraient à l'identique, et « je ne vois pas de différence si
  // ce n'est le menu du bas ». La fonction, elle, n'a pas été perdue dans le
  // déménagement — c'est exactement ce que ce test garde.
  //
  // ET LA FORME A CHANGÉ AVEC LE LIEU. Dans un paquet qu'on balaie il fallait
  // RECOUVRIR : on ne quitte pas la pile. Sur une page, le rond s'agrandit sur
  // place — un écran de moins pour le même geste. On ne cherche donc plus
  // `.ap-film` mais l'ouverture du rond lui-même.
  await q.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await q.waitForTimeout(900);
  const avantAppui = await q.evaluate(() => {
    const v = document.querySelector(".bq-voix-t video");
    return { muet: v?.muted ?? null, largeur: Math.round(
      document.querySelector(".bq-voix-r")?.getBoundingClientRect().width ?? 0) };
  });
  dire(avantAppui.muet === true, "au repos le rond de la page est muet");
  await q.$eval(".bq-voix-t", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await q.waitForTimeout(300);
  await q.click(".bq-voix-t");
  await q.waitForTimeout(900);
  const grand = await q.evaluate(() => {
    const d = document.querySelector(".bq-voix.ouverte");
    const v = d?.querySelector("video");
    return {
      ouvert: !!d,
      // ICI LE SON EST PERMIS : c'est une demande, pas une interruption.
      muet: v?.muted ?? null,
      boucle: v?.loop ?? null,
      largeur: Math.round(
        document.querySelector(".bq-voix-r")?.getBoundingClientRect().width ?? 0),
      qui: document.querySelector(".bq-voix-n")?.textContent.trim() ?? "",
    };
  });
  console.log(`  en grand : ${grand.qui} · ${avantAppui.largeur} → ${grand.largeur} px`);
  dire(grand.ouvert, "l'appui l'ouvre en grand");
  dire(grand.muet === false, "avec le son");
  dire(grand.largeur > avantAppui.largeur + 60,
    `et il grandit vraiment (${avantAppui.largeur} → ${grand.largeur} px)`);
  dire(grand.boucle === true, "sans cesser de tourner en boucle");
  dire(/,/.test(grand.qui), `elle dit qui c'est (${grand.qui})`);
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
// DEUX CHOSES DOIVENT ÊTRE VRAIES, et la seconde est celle qui a lâché au
// premier essai :
//
//   1. LA CARTE FRAÎCHE EST EN TÊTE du paquet, devant les commerces suivis.
//   2. ELLE MONTRE LE MOMENT QUI L'A FAIT REMONTER. La carte remontait bien,
//      mais affichait le premier moment dont la fenêtre couvrait l'heure : à
//      8 h 18 la boulangerie remontait pour sa fournée de 7 h et montrait
//      « MENU DU JOUR · La formule du midi » alors qu'elle remontait pour le
//      pain. Le classement disait une chose, la carte en montrait une autre.
//
// IL Y AVAIT UNE TROISIÈME CHOSE, ET ELLE A ÉTÉ RETIRÉE DU PRODUIT. La carte
// portait une pastille « il y a 18 min », et cette garde la comptait. Le
// signalement : « il y a 1 h : cette indication n'a aucun intérêt, donc à
// supprimer en haut de l'annonce. » Il a raison — sur un direct, tout ce qu'on
// voit est de maintenant ; dater chaque carte n'ajoutait qu'un chiffre de plus
// dans un écran qu'on venait justement d'alléger. `.cd-frais` n'existe plus,
// et ce qui la mesurait est parti avec elle plutôt que d'être contourné.
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
    // le paquet qui s'est élargi, et c'était le but.
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
      quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
      // ON VÉRIFIE AUSSI QUE LA PASTILLE N'EST PAS REVENUE. Elle a été retirée
      // sur signalement ; une garde qui ne surveille plus rien laisserait la
      // porte ouverte à sa réapparition au prochain ajout.
      datee: document.querySelectorAll(".cd-frais").length,
    }));
    const hh = `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
    // LA CASSE VIENT DU CSS, PAS DU TEXTE : `.cd-offre` est en `uppercase`,
    // donc `textContent` rend l'original. On compare sans en tenir compte.
    const ok = r.quoi.toLowerCase() === attendu.toLowerCase() && r.datee === 0;
    if (ok) bons++;
    console.log(`  ${hh} → ${r.quoi || "(rien)"}`);
    if (!ok) console.log(`      attendu : ${attendu}${r.datee ? " — et aucune date" : ""}`);
    if (h === 13.5) await p9.screenshot({ path: "/tmp/moment.png" });
    await ctx9.close();
  }
  dire(bons === journee.length, `la journée se lit heure par heure (${bons}/${journee.length})`);

  // ─── UNE GARDE RETIRÉE AVEC L'OBJET QU'ELLE GARDAIT ───
  //
  // Il y avait ici « la fraîcheur n'a pas la couleur de « passer » » : le
  // premier essai avait mis la pastille en corail, à deux centimètres d'un
  // tampon « PASSER » en #FF6B6B — « nouveau » et « refuser » du même signe.
  // La pastille n'existe plus (voir plus haut), donc la garde non plus. On ne
  // la remplace pas par une mesure creuse : la seule chose qu'il reste à
  // vérifier, « aucune carte n'est datée », est faite heure par heure au-dessus.
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

// ═══ CE QUE L'ESSAI D'ONGLES A BESOIN DE TROUVER EN LIGNE ═════════════════
//
// LE DÉFAUT QUE CE BLOC EXISTE POUR ATTRAPER, ET IL A ÉTÉ TROUVÉ SUR UN
// TÉLÉPHONE : `public/mediapipe/` était ignoré par git et reconstitué par
// `direct-build.sh`. Mais la production ne lance pas `direct-build.sh`, elle
// lance `next build`. En ligne, ces deux fichiers répondaient 404, le calcul
// levait une exception, et l'écran retombait sur la photo du catalogue.
//
// LE PROJET COMPILAIT, LES TRENTE-SIX SUITES PASSAIENT, ET L'ÉCRAN S'AFFICHAIT.
// Rien ne pouvait le voir, parce que tout fonctionnait ICI — c'est exactement la
// même famille que le modèle de l'assistante juste au-dessus : une faute qui ne
// se voit qu'en ligne doit être attrapée par un test, pas par le terrain.
console.log("\n══ le moteur de l'essai d'ongles ══");
{
  for (const [chemin, poidsMini] of [
    ["/mediapipe/hand_landmarker.task", 5_000_000],
    ["/mediapipe/vision_wasm_internal.wasm", 5_000_000],
    ["/mediapipe/vision_wasm_internal.js", 50_000],
  ]) {
    let code = 0;
    let poids = 0;
    try {
      const r = await fetch(BASE + chemin);
      code = r.status;
      poids = (await r.arrayBuffer()).byteLength;
    } catch {
      /* code reste à zéro : c'est ce qu'on veut dire */
    }
    dire(
      code === 200 && poids >= poidsMini,
      `${chemin} est servi (${code}, ${(poids / 1048576).toFixed(1)} Mo)`,
    );
  }
}

// ═══ LA ROUTE D'ESSAYAGE RÉPOND-ELLE, ET RÉPOND-ELLE HONNÊTEMENT ? ═══════
//
// MÊME FAMILLE QUE LES DEUX BLOCS AU-DESSUS : une route d'image ne se vérifie
// pas à l'œil, et ce qui ne casse qu'en ligne se paie sur le terrain. On ne
// teste pas la QUALITÉ du rendu — ça demande une vraie clé — mais les trois
// choses qui font qu'un défaut reste invisible : la route existe, elle refuse
// ce qui est illisible, et quand elle ne peut pas travailler elle DIT POURQUOI
// au lieu de rendre n'importe quoi.
console.log("\n══ l'essayage sur soi ══");
{
  const pixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHElEQVQoU2NkYGD4z0AEYBxVSFNAmRoZGRkZAADUAAdSbJQSAAAAAElFTkSuQmCC";
  const poster = async (corps) => {
    try {
      const r = await fetch(`${BASE}/api/direct/essayer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
      });
      return { code: r.status, j: await r.json().catch(() => ({})) };
    } catch (e) {
      return { code: 0, j: { erreur: String(e) } };
    }
  };
  const vide = await poster({});
  dire(vide.code === 400, `une requête sans photo est refusée (${vide.code})`);
  const bon = await poster({ photo: pixel, reference: pixel, partie: "votre main" });
  // Deux issues acceptables, et aucune des deux n'est muette : soit un rendu,
  // soit une panne QUI SE NOMME. Ce qui serait faux, c'est un 200 sans image.
  const rendu = bon.code === 200 && typeof bon.j.image === "string";
  const franc = bon.code >= 400 && !!bon.j.erreur && !!bon.j.pourquoi;
  dire(rendu || franc,
    rendu
      ? `elle rend une image (${bon.code})`
      : `elle dit pourquoi elle ne peut pas (${bon.code} · ${String(bon.j.pourquoi).slice(0, 60)})`);
  dire(bon.code !== 200 || rendu, "et elle ne répond jamais « tout va bien » sans image");
}

// ═══ L'ESSAI EST SEUL À L'ÉCRAN, ET IL PARLE LE MÉTIER ═══════════════════
//
// « Il y a trop de distraction ici avec le mur qui apparaît déjà, alors que ce
// qu'on veut c'est juste essayer sur soi. » Le défaut ne se voyait pas en lisant
// le code : chaque morceau était correct, c'est leur ORDRE qui était faux. Et il
// est du genre à revenir — il suffit qu'un jour un `setEcran("mur")` reparaisse
// dans l'effet de remise à zéro.
//
// ET LE SECOND DÉFAUT NE SE VOIT PAS DU TOUT À L'ŒIL : des textes génériques
// s'installent un par un, chacun sans conséquence, jusqu'à ce que cinq métiers
// disent la même phrase. On compare donc les métiers entre eux.
console.log("\n══ l'essai, et rien d'autre ══");
{
  // PAS `ouvrir` ICI : il attend `.ap-fav2`, qui n'existe que sur la page des
  // cartes. La maquette de jugement des murs est une page à elle.
  const c6 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c6.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const p6 = await c6.newPage();
  p6.on("pageerror", (e) => erreurs.push(String(e)));
  await p6.goto(`${BASE}/autour-de-moi/mur`, { waitUntil: "networkidle" });
  await p6.waitForSelector(".mu-maq button");
  const murs = await p6.$$eval(".mu-maq button", (b) => b.map((x) => x.textContent.trim()));
  const vus = [];
  for (const nom of murs) {
    await p6.click(`.mu-maq button:text-is("${nom}")`);
    await p6.waitForTimeout(260);
    const tete = await p6.$eval(".mu-e-tete h2", (e) => e.textContent.trim()).catch(() => null);
    if (!tete) continue; // un mur d'annonce : il ouvre sur le mur, c'est voulu
    const geste = await p6.$eval(".mu-cta.plein b", (e) => e.textContent.trim()).catch(() => "");
    const liens = await p6.$$eval(".mu-e-mur", (b) => b.map((x) => x.textContent.trim()));
    dire(!(await p6.$(".mu-pas")), `${nom} : pas de frise 1-2-3 avant l'essai`);
    dire(!(await p6.$(".mu-rang")), `${nom} : le mur n'est pas là à l'ouverture`);
    dire(liens.length === 1, `${nom} : un seul lien vers le mur (${liens.length})`);
    vus.push({ nom, tete, geste, mur: liens[0] ?? "" });
  }
  dire(vus.length >= 5, `au moins cinq métiers ouvrent sur l'essai (${vus.length})`);
  // AUCUNE DES TROIS PHRASES NE SE PARTAGE. C'est la seule mesure qui attrape un
  // texte générique : un mot juste chez deux métiers est un mot creux chez les
  // deux.
  for (const champ of ["tete", "geste", "mur"]) {
    const pris = vus.map((v) => v[champ]);
    const doubles = pris.filter((t, i) => pris.indexOf(t) !== i);
    dire(doubles.length === 0, `le texte « ${champ} » diffère d'un métier à l'autre${doubles.length ? ` — repris : ${doubles[0]}` : ""}`);
  }
  await c6.close();
}

// ═══ LE MUR QUI S'OUVRE EST CELUI DU COMMERCE QU'ON REGARDE ══════════════
//
// « Je suis sur une annonce de fleuriste — "Bouquet du jour · Fleurs de saison ·
// 15 €" — et quand je clique sur le fantôme, au lieu d'avoir le texte coordonné
// avec l'annonce, j'ai "Cette bougie, chez vous". »
//
// C'EST LA TROISIÈME FOIS QUE CE DÉFAUT REVIENT, ET C'EST POUR ÇA QU'IL A UNE
// GARDE. Le coiffeur tombait sur l'onglerie, le prêt-à-porter sur la
// bijoutière, la fleuriste et l'hypnothérapeute sur la cirière. À chaque fois
// c'était un repli écrit quand trois murs devaient couvrir dix-huit commerces,
// et à chaque fois il a survécu au mur qu'on venait d'ajouter — parce qu'un
// repli vers un mur d'essai A L'AIR DE MARCHER. L'écran s'affiche, les boutons
// répondent, et seuls les MOTS sont ceux d'un autre métier. Rien dans le code
// ne peut le voir ; il faut ouvrir le fantôme et lire.
//
// LA GARDE MARCHE DANS LE VRAI PAQUET, pas dans la maquette : c'est là que le
// routage a lieu, et la maquette en avait justement une copie divergente.
console.log("\n══ l'annonce et son mur disent la même chose ══");
{
  const ATTENDU = [
    ["Une fleuriste du marché", /bouquet/i],
    ["Une prothésiste ongulaire", /ongle/i],
    ["Une cirière", /bougie/i],
    ["Une créatrice de bijoux", /bijou/i],
    ["Un salon du centre", /coupe/i],
    ["Un salon qui vient d’ouvrir", /coupe/i],
    ["Une boutique de la rue piétonne", /pièce|vous/i],
    ["Une friperie du vieux centre", /pièce|vous/i],
    // ON N'ESSAIE PAS UNE SÉANCE D'HYPNOSE. « artisan » est un sac qui
    // contenait une cirière, une bijoutière ET un hypnothérapeute : celui-ci
    // recevait « Photographier ma table ». Il doit n'avoir aucun essai.
    ["Un hypnothérapeute", null],
  ];
  const { ctx: c7, p: p7 } = await ouvrir("/autour-de-moi", 12.5);
  const vus = new Map();
  // ON PARCOURT LE PAQUET ET ON NOTE CE QU'ON CROISE. La carte du dessus est
  // celle SANS « dessous » — l'autre est la suivante, déjà dans le DOM.
  for (let i = 0; i < 24 && vus.size < ATTENDU.length; i++) {
    const chez = await p7
      .locator(".cd-carte:not(.dessous) .cd-chez")
      .first()
      .textContent()
      .catch(() => null);
    const nom = (chez ?? "").split("·")[0].trim();
    const cible = ATTENDU.find(([n]) => n === nom);
    if (cible && !vus.has(nom)) {
      await p7.click(".ap-monfantome");
      await p7.waitForTimeout(900);
      const titre = await p7
        .locator(".mu-e-tete h2")
        .textContent()
        .catch(() => null);
      vus.set(nom, titre ? titre.trim() : null);
      const x = await p7.$(".ap-f-x");
      if (x) await x.click();
      await p7.waitForTimeout(400);
    }
    // LE BOUTON SE DÉSACTIVE EN FIN DE PAQUET, et un clic qui attend trente
    // secondes sur un bouton mort fait passer une garde pour une panne.
    const suiv = await p7.$(".cd-suiv, .cd-passer, [aria-label*='suivant' i]");
    if (!suiv || !(await suiv.isEnabled())) break;
    await suiv.click();
    await p7.waitForTimeout(420);
  }
  for (const [nom, motif] of ATTENDU) {
    if (!vus.has(nom)) continue; // pas croisé à cette heure-ci : on ne juge pas
    const titre = vus.get(nom);
    dire(
      motif ? !!titre && motif.test(titre) : titre === null,
      motif
        ? `${nom} → « ${titre ?? "aucun essai"} »`
        : `${nom} n'a pas d'essai, et c'est voulu${titre ? ` — or il dit « ${titre} »` : ""}`,
    );
  }
  dire(vus.size >= 3, `au moins trois commerces d'essai croisés dans le paquet (${vus.size})`);
  await c7.close();
}

// ═══ UNE SEULE STRUCTURE, NEUF LANGAGES ══════════════════════════════════
//
// « Ne conçois pas neuf types d'annonces. Conçois un système d'annonces qui
// sait parler neuf langages. »
//
// LA GARDE MESURE LES DEUX MOITIÉS DE CETTE PHRASE, et elle doit les mesurer
// ENSEMBLE : chacune prise seule est facile à satisfaire, et les satisfaire
// séparément donne soit neuf applications, soit une seule voix.
//
//   · NEUF LANGAGES — l'accent, le ton du titre, le mot de ce qu'on compte et
//     le verbe du geste doivent DIFFÉRER d'un métier à l'autre. Le défaut
//     mesuré : un bar proposait « Réserver mon plat », écrit dans une chaîne de
//     ternaires à quatorze mille lignes du début du fichier, où « bar » figurait
//     depuis le premier jour.
//   · UNE STRUCTURE — l'ordre des blocs et le grand bouton doivent être les
//     MÊMES. C'est le garde-fou de l'autre : neuf personnalités qui déplacent
//     chacune un bloc, ce sont neuf applications.
console.log("\n══ neuf langages, une seule structure ══");
{
  const { ctx: c8, p: p8 } = await ouvrir("/autour-de-moi", 12.5);
  const vus = new Map();
  for (let i = 0; i < 22; i++) {
    const d = await p8.evaluate(() => {
      const c = document.querySelector(".cd-carte:not(.dessous)");
      if (!c) return null;
      const h2 = c.querySelector(".cd-offre");
      return {
        cle: [...c.classList].find((x) => x.startsWith("m-")) ?? null,
        accent: getComputedStyle(c).getPropertyValue("--cd-accent").trim(),
        ton: [...(h2?.classList ?? [])].find((x) => x.startsWith("t-")) ?? null,
        unite: (c.querySelector(".cd-encore")?.textContent ?? "").replace(/\d+/g, "").trim(),
        // LA STRUCTURE : l'ordre dans lequel les blocs apparaissent.
        ordre: [...c.querySelectorAll(".cd-nature,.cd-offre,.cd-prixg,.cd-encore,.cd-chez")]
          .map((e) => e.className.split(" ")[0])
          .join(">"),
      };
    });
    if (d?.cle && !vus.has(d.cle)) {
      const geste = (await p8.locator(".ap-agir.engage").textContent().catch(() => "")).trim();
      vus.set(d.cle, { ...d, geste });
    }
    const suiv = await p8.$(".cd-suiv, .cd-passer, [aria-label*='suivant' i]");
    if (!suiv || !(await suiv.isEnabled())) break;
    await suiv.click();
    await p8.waitForTimeout(420);
  }
  const l = [...vus.values()];
  dire(l.length >= 6, `au moins six langages croisés dans le paquet (${l.length})`);

  // AUCUN ACCENT NE SE PARTAGE. Deux métiers de la même couleur, c'est deux
  // métiers qu'on confond au premier coup d'oeil — la demande exacte.
  const accents = l.map((x) => x.accent);
  dire(
    new Set(accents).size === accents.length,
    `chaque langage a sa couleur (${new Set(accents).size}/${accents.length})`,
  );
  // LE VERBE DU GESTE NE SE PARTAGE PAS NON PLUS, sauf là où il est vrai deux
  // fois : on prend bien rendez-vous chez un coiffeur ET chez une prothésiste.
  const gestes = l.map((x) => x.geste).filter(Boolean);
  dire(
    new Set(gestes).size >= gestes.length - 1,
    `le verbe du geste suit le métier (${new Set(gestes).size}/${gestes.length}) : ${[...new Set(gestes)].join(" · ")}`,
  );
  // ON DIT TROIS QUOI. « Il reste 3 » est vrai partout et ne veut rien dire
  // nulle part.
  const unites = l.map((x) => x.unite).filter((u) => u && u.length > 8);
  dire(
    new Set(unites).size >= 3,
    `ce qu'on compte porte un nom (${[...new Set(unites)].join(" · ") || "aucun"})`,
  );

  /**
   * ET LA STRUCTURE NE BOUGE PAS — MAIS UN BLOC ABSENT N'EST PAS UN DÉSORDRE.
   *
   * Premier jet de cette garde : « trois agencements », donc échec. C'était LA
   * GARDE qui avait tort. Un bar sans prix n'a pas de bloc prix, une annonce
   * sans compte n'a pas de « il reste » — et c'est voulu : « les blocs 2 et 4
   * sont OPTIONNELS ; s'ils sont vides, le composant se replie proprement sans
   * casser le rythme visuel ». Comparer les chaînes entières mesurait donc la
   * présence, pas l'ordre.
   *
   * CE QU'IL FAUT VÉRIFIER EST QUE CE QUI EST LÀ EST DANS LE BON ORDRE : la
   * suite des blocs présents doit être une sous-suite de l'ordre canonique.
   * Replier un bloc est permis ; en déplacer un ne l'est pas.
   */
  const CANON = ["cd-nature", "cd-offre", "cd-prixg", "cd-encore", "cd-chez"];
  const dansLOrdre = (suite) => {
    let i = 0;
    for (const bloc of suite) {
      const j = CANON.indexOf(bloc, i);
      if (j < 0) return false;
      i = j + 1;
    }
    return true;
  };
  const horsOrdre = l.filter((x) => x.ordre && !dansLOrdre(x.ordre.split(">")));
  dire(
    horsOrdre.length === 0,
    `l'ordre des blocs est le même d'un métier à l'autre${
      horsOrdre.length ? ` — ${horsOrdre[0].cle} : ${horsOrdre[0].ordre}` : ""
    }`,
  );
  await c8.close();
}

// ═══ CE QU'ON DÉPOSE SE VOIT, IL NE SE RACONTE PAS ══════════════════════
//
// « Quand je prends une photo et que je dis "je prends rendez-vous" ou "je
// passe", je n'ai pas l'impression que c'est sauvegardé sur le mur du
// commerçant. »
//
// MESURÉ AVANT DE CORRIGER : ÇA L'ÉTAIT. La mémoire contenait le dépôt et
// « Vous » figurait bien sur le mur. Ce qui manquait était la PREUVE — on ne
// voyait sa carte nulle part au moment de décider, et l'écran se contentait
// d'écrire « votre essai est sur le mur ». Une phrase n'est pas une preuve, et
// un produit qui affirme au lieu de montrer n'est pas cru.
//
// LA GARDE VÉRIFIE LES DEUX MOITIÉS, parce que l'une sans l'autre ne vaut rien :
// la carte est à l'écran au moment de la décision, ET elle est réellement dans
// la mémoire du téléphone. Montrer sans écrire serait le mensonge inverse.
console.log("\n══ ce qu'on dépose se voit et s'écrit ══");
{
  /**
   * CETTE GARDE OUVRE SON PROPRE NAVIGATEUR, ET C'EST POUR UNE RAISON PRECISE.
   *
   * `ouvrir` collecte les erreurs de console dans le compte global. Or cette
   * garde-ci ESSAIE DES PIECES jusqu'a en trouver une qui rende — et sur un
   * serveur sans cle d'image, les autres repondent 503. C'est le comportement
   * attendu, honnete, et deja mesure par le bloc « l'essayage sur soi ». Le
   * laisser tomber dans le compte global faisait echouer la garde SUR SA PROPRE
   * METHODE : elle fabriquait l'erreur qu'elle signalait ensuite.
   */
  const cA = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await cA.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  await cA.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pA = await cA.newPage();
  pA.on("pageerror", (e) => erreurs.push(String(e)));
  await pA.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await pA.waitForSelector(".ap-fav2");
  await pA.waitForTimeout(4600);
  /**
   * ON VISE LA CIRIÈRE, ET C'EST UN CHOIX DE MESURE.
   *
   * Les autres métiers d'essai passent par le modèle d'image, donc par une clé
   * — que ce conteneur n'a pas. Leur rendu échoue, il n'y a pas de décision à
   * prendre, et la garde se contenterait de dire « pas de décision » en
   * passant : une garde qui ne mesure rien est pire qu'une garde absente,
   * parce qu'elle rassure.
   *
   * LA BIJOUTIÈRE ET LA CIRIÈRE, ELLES, RENDENT SANS SORTIR DU NAVIGATEUR —
   * une paire photographiée à l'avance pour l'une, un PNG détouré posé sur un
   * gabarit mesuré pour l'autre. Le dépôt qui suit est le même pour tous les
   * métiers : c'est lui qu'on vérifie, pas le moteur. On accepte les deux,
   * parce que le paquet ne montre pas les mêmes commerces à toute heure.
   */
  let trouve = false;
  for (let i = 0; i < 22; i++) {
    const n = await pA.$eval(".ap-loin-t b", (e) => e.textContent.trim()).catch(() => "");
    if (/bijou|cirière|ciriere/i.test(n)) { trouve = true; break; }
    const b = await pA.$(".ap-suiv");
    if (!b || !(await b.isEnabled())) break;
    await b.click();
    await pA.waitForTimeout(400);
  }
  if (!trouve) {
    console.log("   (ni bijoutière ni cirière croisées à cette heure-ci)");
  } else {
    await pA.click(".ap-monfantome");
    await pA.waitForTimeout(1000);
    // ON PASSE PAR LA PHOTO D'EXEMPLE : la garde ne dispose pas d'appareil, et
    // ce chemin dépose exactement le même fantôme.
    const ex = await pA.$(".mu-exemple");
    if (ex) await ex.click();
    await pA.waitForTimeout(500);
    /**
     * ON ESSAIE LES PIÈCES JUSQU'À CE QU'UNE RENDE.
     *
     * Sur ce conteneur il n'y a pas de clé d'image : les pièces qui passent par
     * le modèle répondent 503, l'écran le dit honnêtement et ne propose AUCUNE
     * décision — ce qui est le bon comportement, mais ne mesure rien. Certaines
     * pièces rendent pourtant sans sortir du navigateur (une paire
     * photographiée à l'avance, un PNG détouré sur un gabarit). La garde les
     * cherche au lieu de supposer que la première marche.
     */
    const combien = await pA.$$eval(".mu-pieces button:not([disabled])", (l) => l.length);
    let passe = null;
    for (let k = 0; k < combien && !passe; k++) {
      const boutons = await pA.$$(".mu-pieces button:not([disabled])");
      if (!boutons[k]) break;
      await boutons[k].click();
      await pA.waitForTimeout(7000);
      passe = await pA.$(".mu-rendu-g .non");
      if (!passe) {
        const retour = await pA.$(".mu-exemple, .mu-e-autres");
        if (retour) await retour.click();
        await pA.waitForTimeout(500);
      }
    }
    {
      if (!passe) {
        console.log("   (aucune pièce ne rend sans clé d'image : rien à mesurer ici)");
      } else {
        await passe.click();
        await pA.waitForTimeout(900);
        const carte = await pA.$(".mu-rendu-preuve .mu-c");
        dire(!!carte, "la carte déposée s'affiche au moment où l'on décide");
        const memoire = await pA.evaluate(() => {
          try {
            const b = localStorage.getItem("clikme-fantomes-v1");
            return b ? (JSON.parse(b) || []).length : 0;
          } catch { return -1; }
        });
        dire(memoire >= 1, `et elle est vraiment dans la mémoire du téléphone (${memoire})`);
        // ET ON NE S'INTÉRESSE PAS À SA PROPRE TRACE : « Ça m'intéresse » veut
        // dire « je veux en parler avec cette personne », or c'est soi.
        const pouce = carte ? await carte.$(".mu-int") : null;
        dire(!pouce, "et on ne nous propose pas de nous intéresser à nous-même");
      }
    }
  }
  await cA.close();
}

// ═══ RIEN NE PASSE SOUS L'ANNEAU, ET L'INTERRUPTION RESTE UNE BANDE ══════
//
// DEUX MESURES, ET AUCUNE DES DEUX NE SE VOIT EN RELISANT LE CODE : les blocs
// en cause sont corrects chacun de son côté, c'est leur SUPERPOSITION qui est
// fausse. Elles ne se voient qu'en lisant des coordonnées dans un vrai
// navigateur, à la vraie largeur.
//
//   · L'ANNEAU DU MÉTIER est posé en absolu à droite et couvre une bande de
//     cent points de haut. « BOUQUET DU JOUR » s'affichait « BOUQUET DU J », et
//     « à partir de 12 € » débordait dessous en quatre-vingts points.
//   · LA BANDE « C'EST À VOUS » est posée par-dessus l'annonce. Elle empilait
//     six rangées, soit cent quatre-vingt-neuf points sur une barre de deux cent
//     soixante et un : un tiers de l'écran, donc le tiers haut de la photo.
console.log("\n══ ce qui est posé par-dessus la carte ══");
{
  const { ctx: c9, p: p9 } = await ouvrir("/autour-de-moi", 12.5);
  /** Deux rectangles se chevauchent-ils vraiment ? */
  const croise = (a, b) =>
    !!a && !!b && a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.h && b.y < a.y + a.h;

  let sousLAnneau = null;
  let bande = null;
  let vues = 0;
  for (let i = 0; i < 14; i++) {
    const m = await p9.evaluate(() => {
      const r = (s) => {
        const e = document.querySelector(s);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
      };
      /**
       * ON MESURE LA ZONE DE CONTENU, PAS LA BOÎTE.
       *
       * Premier jet de cette garde : elle comparait les rectangles complets et
       * criait au chevauchement. C'était LA GARDE qui avait tort — la réserve
       * faite pour l'anneau est un `padding-right` DANS la boîte, donc la boîte
       * touche l'anneau par construction et le texte, lui, s'arrête avant. Ce
       * qu'il faut mesurer est le bord droit du CONTENU.
       */
      const contenu = (s) => {
        const e = document.querySelector(s);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        const st = getComputedStyle(e);
        const pg = parseFloat(st.paddingLeft) || 0;
        const pd = parseFloat(st.paddingRight) || 0;
        return {
          x: Math.round(b.x + pg),
          y: Math.round(b.y),
          l: Math.round(b.width - pg - pd),
          h: Math.round(b.height),
        };
      };
      return {
        anneau: r(".cd-anneau"),
        titre: contenu(".cd-offre"),
        prix: contenu(".cd-prixg"),
        // ET LE TEXTE NE DOIT PAS DÉBORDER DE CE QU'ON LUI LAISSE : un mot plus
        // large que la colonne sort de sa boîte et repart sous l'anneau.
        titreDeborde: (() => {
          const e = document.querySelector(".cd-offre");
          return e ? e.scrollWidth > e.clientWidth + 1 : false;
        })(),
        prixDeborde: (() => {
          const e = document.querySelector(".cd-prixg");
          return e ? e.scrollWidth > e.clientWidth + 1 : false;
        })(),
        tour: r(".ap-tour"),
        haut: r(".ap-haut"),
      };
    });
    if (m?.anneau && (m.titre || m.prix)) {
      vues++;
      const faute = croise(m.anneau, m.titre)
        ? "le titre passe sous l'anneau"
        : croise(m.anneau, m.prix)
          ? "le prix passe sous l'anneau"
          : m.titreDeborde
            ? "le titre déborde de sa colonne"
            : m.prixDeborde
              ? "le prix déborde de sa colonne"
              : null;
      if (faute && !sousLAnneau) sousLAnneau = { ...m, faute };
    }
    if (m?.tour && !bande) bande = m;
    const suiv = await p9.$(".ap-suiv");
    if (!suiv || !(await suiv.isEnabled())) break;
    await suiv.click();
    await p9.waitForTimeout(420);
  }
  dire(vues >= 4, `au moins quatre cartes mesurées (${vues})`);
  dire(
    !sousLAnneau,
    sousLAnneau
      ? `${sousLAnneau.faute} — titre ${JSON.stringify(sousLAnneau.titre)}, prix ${JSON.stringify(sousLAnneau.prix)}, anneau ${JSON.stringify(sousLAnneau.anneau)}`
      : "ni le titre ni le prix ne passent sous l'anneau du métier",
  );
  // LA BANDE A UN PLAFOND. Cent soixante points la laissent dire quoi, combien,
  // combien de temps et les deux gestes ; au-delà, elle réempile des rangées et
  // reprend la photo.
  if (bande) {
    dire(
      bande.tour.h <= 160,
      `la bande « C'est à vous » tient en quatre rangées (${bande.tour.h} points)`,
    );
    dire(
      bande.haut.h <= 235,
      `et la barre qu'elle habite ne prend pas le tiers de l'écran (${bande.haut.h} points)`,
    );
  } else {
    console.log("   (la bande « C'est à vous » ne s'est pas montrée à cette heure-ci)");
  }
  await c9.close();
}

// ═══ LA PAGE DU COMMERCE : SON MUR EN VEDETTE, ET UNE VRAIE PAGE D'ECRAN ══
//
// « Il faut mettre en vedette les murs des commerçants, avec possibilité de
// faire des essayages en direct sur leur page d'accueil. N'oublie pas aussi de
// faire une version ordinateur, parce que cette page est plus une page pour
// téléphone que ordinateur ou tablette. »
//
// MESURE AVANT CORRECTION : à 1440 points de large, la page était une colonne
// de 560 posée au milieu de deux gouttières noires de 440 chacune — soixante
// pour cent de l'écran pour rien. Et le mur n'y figurait nulle part : la seule
// chose que le produit sache faire et qu'un site vitrine ne saura jamais.
console.log("\n══ la page du commerce ══");
{
  const large = await nav.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" });
  await large.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pB = await large.newPage();
  pB.on("pageerror", (e) => erreurs.push(String(e)));
  await pB.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await pB.waitForTimeout(1200);

  const surOrdi = await pB.evaluate(() => {
    const bq = document.querySelector(".bq");
    const col = bq ? getComputedStyle(bq).gridTemplateColumns.split(" ").filter(Boolean) : [];
    return {
      colonnes: col.length,
      largeurUtile: col.reduce((n, x) => n + parseFloat(x), 0),
      mur: !!document.querySelector("#mur .mu"),
      deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  dire(surOrdi.colonnes === 2, `sur un ordinateur, la page tient en deux colonnes (${surOrdi.colonnes})`);
  dire(
    surOrdi.largeurUtile > 900,
    `et elle occupe l'écran au lieu d'une colonne de téléphone (${Math.round(surOrdi.largeurUtile)} points)`,
  );
  dire(surOrdi.mur, "le mur du commerce est sur sa page");

  /**
   * ═══ LA PAGE RACONTE UNE HISTOIRE, DANS L'ORDRE ═══════════════════════════
   *
   * « C'est impossible de s'y retrouver. Il faut des sections claires, des
   * titres pour qu'on sache où on est, et que la page raconte une histoire où
   * l'on va de section en section en comprenant ce qui se passe. »
   *
   * TROIS CHOSES SE MESURENT, ET AUCUNE NE SE VOIT EN LISANT LE CODE :
   *
   *   · LES CHAPITRES SONT NUMÉROTÉS ET DANS L'ORDRE. Le défaut trouvé au
   *     premier jet : ils se lisaient 1, 2, 6, 3, 4, 5 — j'avais renuméroté
   *     sans déplacer le bloc. Un rang qui recule au milieu d'une page détruit
   *     exactement ce qu'il est censé donner.
   *   · CHACUN DIT À QUOI IL RÉPOND. C'est ce qui fait l'histoire plutôt qu'une
   *     table des matières.
   *   · LA PAGE RESPIRE. Mesure avant : onze mille deux cents points sur un
   *     téléphone, sans un seul repère.
   */
  const histoire = await pB.evaluate(() =>
    [...document.querySelectorAll(".bq-s")]
      .map((sec) => {
        const ch = sec.querySelector(".bq-ch");
        if (!ch) return null;
        return {
          n: Number(ch.querySelector(".bq-ch-n b")?.textContent ?? 0),
          titre: ch.querySelector("h2")?.textContent?.trim() ?? "",
          dit: ch.querySelector("p")?.textContent?.trim() ?? "",
        };
      })
      .filter(Boolean),
  );
  dire(histoire.length >= 6, `la page est faite de chapitres (${histoire.length})`);
  const rangs = histoire.map((x) => x.n);
  dire(
    rangs.every((n, i) => i === 0 || n > rangs[i - 1]),
    `et ils se suivent dans l'ordre (${rangs.join(" ")})`,
  );
  dire(
    histoire.every((x) => x.titre && x.dit.length > 25),
    "chaque chapitre a un titre et dit à quoi il répond",
  );
  // AUCUN CHAPITRE NE RÉPÈTE UN AUTRE : deux titres identiques, c'est deux
  // sections qu'on ne saura pas distinguer en revenant en arrière.
  const titres = histoire.map((x) => x.titre);
  dire(new Set(titres).size === titres.length, "et aucun ne répète le titre d'un autre");

  // ET LE REPÈRE SUIT LE DÉFILEMENT — un titre ne dit où l'on est qu'au moment
  // où on le croise ; trois écrans plus bas, on ne sait déjà plus.
  const auSommet = await pB.$eval(".bq-ou", (e) => e.classList.contains("vu")).catch(() => null);
  dire(auSommet === false, "au sommet, le repère de chapitre se tait");
  await pB.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.55)));
  await pB.waitForTimeout(600);
  const enRoute = await pB.$eval(".bq-ou", (e) => e.innerText.replace(/\s+/g, " ").trim());
  dire(/\d\s*\/\s*\d/.test(enRoute), `et il dit où l'on est en descendant (« ${enRoute} »)`);
  await pB.evaluate(() => scrollTo(0, 0));
  await pB.waitForTimeout(400);

  // LE FOND DE LA PAGE RESTE LE SIEN. La feuille du mur porte une règle qui
  // repeint le document entier ; montée en section, elle changeait la couleur
  // de toute la boutique. Mesure : rgb(7,11,18) au lieu de rgb(5,9,12).
  const fond = await pB.evaluate(() => getComputedStyle(document.body).backgroundColor);
  dire(
    fond.replace(/\s/g, "") === "rgb(5,9,12)",
    `et le mur ne repeint pas la page qui l'accueille (${fond})`,
  );
  dire(!surOrdi.deborde, "et rien ne déborde sur le côté");

  // L'ESSAI EST LA, EN DIRECT, CHEZ LES MÉTIERS QUI EN ONT UN. C'est le point
  // de toute la section : on essaie depuis la page du commerçant.
  const onglerie = await pB.$(".bq-maq-c button:text-matches('prothésiste', 'i')");
  if (onglerie) {
    await onglerie.click();
    await pB.waitForTimeout(1000);
    const e = await pB.evaluate(() => ({
      // ON LIT LE TITRE DU CHAPITRE, PAS CELUI DU COMPOSANT. Celui du
      // composant existe encore dans le document mais il est masque : une
      // garde qui lit un texte invisible mesure le code, pas l'ecran.
      titre: document.querySelector("#mur .bq-ch h2")?.textContent?.trim() ?? null,
      geste: document.querySelector("#mur .mu-cta.plein b")?.textContent?.trim() ?? null,
      /**
       * LE CREUX SE MESURE SOUS LE DERNIER CONTENU, PAS SOUS LE CADRE.
       *
       * PREMIER JET : on comparait le bas de la section au bas du mur, et on
       * lisait « 23 points » pendant que quatre cent quatorze points de vide
       * s'étalaient DANS le mur. La feuille du mur porte `min-height:100vh`,
       * écrite pour un écran entier ; rendue à l'intérieur de la page, elle
       * passe APRÈS celle de la page et gagne à spécificité égale. Le panneau
       * faisait exactement la hauteur de l'écran — la signature du défaut.
       *
       * ON MESURE DONC DEPUIS LE DERNIER ENFANT VISIBLE. Une garde qui regarde
       * le cadre ne voit jamais ce qu'il y a dedans.
       */
      creux: (() => {
        const m = document.querySelector("#mur");
        const d = m?.querySelector(".bq-mu");
        if (!m || !d) return 0;
        const enfants = [...d.children].filter((e) => e.getBoundingClientRect().height > 1);
        const dernier = enfants[enfants.length - 1];
        if (!dernier) return 0;
        return Math.round(m.getBoundingClientRect().bottom - dernier.getBoundingClientRect().bottom);
      })(),
    }));
    dire(
      !!e.titre && /ongle/i.test(e.titre),
      `l'essai s'ouvre sur sa page, dans les mots du metier (« ${e.titre ?? "absent"} »)`,
    );
    dire(
      !!e.geste && /photograph|prendre/i.test(e.geste),
      `et il propose le geste du métier (« ${e.geste ?? "absent"} »)`,
    );
    dire(e.creux < 90, `sans creux sous le dernier contenu du panneau (${e.creux} points)`);
  }

  // ET SUR TÉLÉPHONE, RIEN N'A BOUGÉ : une seule colonne, le mur toujours là.
  const petit = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await petit.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pC = await petit.newPage();
  await pC.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await pC.waitForTimeout(900);
  const surTel = await pC.evaluate(() => ({
    grille: getComputedStyle(document.querySelector(".bq")).display,
    mur: !!document.querySelector("#mur .mu"),
    deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  dire(surTel.grille !== "grid", "sur téléphone, la page reste une seule colonne");
  dire(surTel.mur, "et le mur y est aussi");
  dire(!surTel.deborde, "sans débordement horizontal");
  await petit.close();
  await large.close();
}

dire(erreurs.length === 0, `aucune erreur${erreurs.length ? " : " + erreurs[0] : ""}`);
await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
