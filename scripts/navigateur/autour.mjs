// 📍 « AUTOUR DE MOI », L'ÉCRAN — l'onglet « Autour » de `/collection` (`app/collection/autour.tsx`, `autour-carte.tsx`),
// contre le faux Supabase, jamais la vraie base.
//
// À Dax : Le Petit Bistrot et la Boulangerie du Marché (des commerces clients avec leurs coordonnées). Léa y a déposé
// deux mèmes, et un « Ailleurs » (« Soirée chez Max ») ; Hugo a répondu à celui de Léa, et en a posé un à la
// boulangerie. Sam ouvre « Autour » (le menu : « Autour » à la place de « Rencontres ») : la carte (les tuiles sont
// servies par l'essai : un fond uni, le réseau de la CI ne sort pas), les gouttes avec un visage et un nombre, la zone
// floue, les derniers mèmes. Le Petit Bistrot : trois mèmes, la conversation du moment, ni étoiles ni horaires. Le swipe :
// glisser à droite = J'aime (la réaction ❤️ est gardée), « Passer », le profil du créateur (jamais sa position). Sam
// répond avec sa figurine : les deux mèmes sont liés. Puis il dépose « Ailleurs » (« Les Arènes ») : sa position devient
// une zone, gardée nulle part telle quelle. Il signale un mème : il disparaît. Sans carte (tuiles refusées) : la liste
// des lieux. Sans figurine : on l'invite à la créer. `#rencontre` ouvre « Créer » (« Rencontres » est effacé). Rien ne déborde, jamais
// le mot interdit, aucune erreur dans la page.
//
// 8 novembre 2026 (le retour du propriétaire) : le lieu refait (à la une, qui joue ; ceux qui y ont déposé ; le mur de
// ses mèmes ; « 📍 Juste à côté ») ; à la fin du swipe, « Continuer » vers le lieu voisin ; au dépôt, le mème choisi en
// grand et coché, les autres pâlis, et une petite carte « Ton mème apparaîtra ici » ; 🔎 « la gare » : un endroit de la
// ville (le faux géocodeur), la carte y va, on y dépose — une zone « quelque part par ici », jamais l'endroit exact.
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, repondreFenetre } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const liste = async (prefix) =>
  (await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000 }) })).json()).map((x) => x.name);

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const LEA = { id: "acacacac-0000-4000-8000-000000000301", jeton: "jeton-lea-autour-ecran-00001", prenom: "Léa" };
const HUGO = { id: "acacacac-0000-4000-8000-000000000302", jeton: "jeton-hugo-autour-ecran-0001", prenom: "Hugo" };
const SAM = { id: "acacacac-0000-4000-8000-000000000303", jeton: "jeton-sam-autour-ecran-00001", prenom: "Sam" };
const BISTROT = "c-petit-bistrot-ecran";
const BOULANGERIE = "c-boulangerie-ecran";
/** Où est Sam (son téléphone le dit) : jamais montré, jamais gardé tel quel (une autre zone que la soirée de Léa). */
const ICI = { latitude: 43.70313, longitude: -1.06087 };

// ─── Dax : deux commerces clients, trois habitants avec leur figurine ───
await semer("human_vitrine_sites", [
  // (sa devanture : une photo servie par l'essai, à une adresse https qui n'existe pas ailleurs)
  { id: "ffffffff-0000-4000-8000-000000000301", slug: "petit-bistrot-ecran", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538, metadata: { photos_du_lieu: { devanture: { url: "https://photos.clikme-essai.test/bistrot.jpg", at: "" } } } },
  { id: "ffffffff-0000-4000-8000-000000000302", slug: "boulangerie-ecran", channel: "letter", business_name: "Boulangerie du Marché", city: "Dax", activite: "Boulangerie", published: true, est_client: true, latitude: 43.7079, longitude: -1.0571 },
]);
const GENS = [LEA, HUGO, SAM];
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const IMAGES = { [LEA.id]: "salut-1", [HUGO.id]: "montre", [SAM.id]: "viens" };
for (const x of GENS) await deposer(`${x.id}/neutre-essai.webp`, fs.readFileSync(`public/direct/double/pied/${IMAGES[x.id]}.webp`), "image/webp");
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/neutre-essai.webp`, prete_le: new Date().toISOString() })),
);
// Hugo a Léa dans ses Rencontres : une proche
await json(`${HUGO.id}/rencontres.json`, { amis: [LEA.id] });
// Léa et Hugo ont déclaré leur âge (15 ans et plus) ; Sam, pas encore : on le lui demandera à son premier dépôt
for (const x of [LEA, HUGO]) await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
/** Un mème en vidéo (comme le fait la route), avec ses mots. */
async function meme(h, id, texte) {
  await semer("clik_figurine_message", [{ id, habitant_id: h, son: `${h}/m-${id}.mp3`, duree: 2, commerces: [], texte, created_at: new Date().toISOString() }]);
  await deposer(`${h}/meme-${id}.mp4`, Buffer.alloc(2048, 1), "video/mp4");
  await json(`${h}/m-${id}.json`, { meme: `${h}/meme-${id}.mp4`, memeType: "video/mp4" });
}
await meme(LEA.id, "ecranlea0001", "Quand le chef me reconnaît");
await meme(LEA.id, "ecranlea0002", "Moi devant la vitrine");
await meme(LEA.id, "ecranlea0003", "Ma tête à minuit");
await meme(HUGO.id, "ecranhugo001", "Et moi alors ?");
await meme(HUGO.id, "ecranhugo002", "Le croissant du matin");
await meme(SAM.id, "ecransam0001", "Je passais par là");
await meme(SAM.id, "ecransam0002", "Ma ville, mes règles");
await meme(SAM.id, "ecransam0003", "Le train de 8 h");

/** La route, comme le téléphone de quelqu'un. */
const route = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/autour`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (qui, q = "") => (await fetch(`${BASE}/api/direct/autour${q}`, { headers: { cookie: qui ? `clikme_habitant=${qui.jeton}` : "" } })).json();
const lieuDe = (carte, id) => (carte.lieux ?? []).find((l) => l.id === id);
const avant = [
  await route(LEA, { action: "deposer", meme: "ecranlea0001", lieu: BISTROT, qui: "tous", mot: "Le chef m’a reconnu." }),
  await route(LEA, { action: "deposer", meme: "ecranlea0002", lieu: BISTROT, qui: "tous" }),
  await route(LEA, { action: "deposer", meme: "ecranlea0003", ici: { lat: 43.7149, lng: -1.0502 }, qui: "tous", nomLieu: "Soirée chez Max" }),
  await route(HUGO, { action: "deposer", meme: "ecranhugo001", lieu: BISTROT, qui: "tous", reponseA: "ecranlea0001" }),
  await route(HUGO, { action: "deposer", meme: "ecranhugo002", lieu: BOULANGERIE, qui: "tous" }),
];
const ZONE_MAX = avant[2].lieu;

const b = await lancer({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
ok(avant.every((r) => r.statut === 200) && /^z-/.test(ZONE_MAX ?? ""), "Léa et Hugo ont déposé leurs mèmes (deux commerces, une soirée)");
const erreurs = [];
/** Le fond de carte, servi par l'essai : un style sans tuiles (un fond uni), que l'écran repeint ; `panne` : tout refusé. */
const STYLE = { version: 8, name: "essai", sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#ffffff" } }] };
async function tel(qui, { panne = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, isMobile: true, hasTouch: true, geolocation: ICI, permissions: ["geolocation"] });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  await ctx.route("https://tiles.openfreemap.org/**", (r) => (!panne && r.request().url().includes("/styles/") ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STYLE) }) : r.abort()));
  await ctx.route("https://photos.clikme-essai.test/**", (r) => r.fulfill({ status: 200, contentType: "image/jpeg", body: fs.readFileSync("public/direct/double/comptoir.jpg") }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("dialog", (d) => void d.accept());
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
/** Glisser la carte du swipe, au doigt (des évènements de pointeur, comme sur le téléphone). */
async function glisser(p, dx) {
  const r = await p.locator(".atr-pile .atr-mcarte:not(.dessous)").boundingBox();
  const x = r.x + r.width / 2;
  const y = r.y + r.height / 2;
  await p.mouse.move(x, y);
  await p.mouse.down();
  for (let k = 1; k <= 8; k++) await p.mouse.move(x + (dx * k) / 8, y + k);
  await p.mouse.up();
  await p.waitForTimeout(450);
}

// ═══ SAM OUVRE « AUTOUR » ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
await sam.waitForSelector("#o-autour .atr-haut h1", { timeout: 60000 });
const menu = await sam.locator(".mc-nav button").allInnerTexts();
ok(menu.length === 5 && menu.some((t) => t.includes("Autour")) && !menu.some((t) => t.includes("Rencontres")) && (await texte(sam, ".mc-nav button.pris")).includes("Autour"), `le menu : « Autour » à la place de « Rencontres » (${menu.map((t) => t.trim()).join(" · ")})`);
ok((await texte(sam, "#o-autour .atr-haut")).includes("Autour de moi") && (await texte(sam, "#o-autour .atr-haut")).includes("à Dax"), "le titre : « Autour de moi », les mèmes déposés à Dax");
// LA CARTE : une goutte par commerce (un visage, un nombre), la zone floue de la soirée
await sam.waitForSelector(".auc-goutte, .atr-ligne", { timeout: 30000 });
const carteChargee = (await sam.locator(".auc-goutte").count()) > 0;
ok(carteChargee, "la carte se charge (MapLibre, le fond repeint aux couleurs de ClikMe)");
if (carteChargee) {
  await sam.waitForFunction(() => document.querySelectorAll(".auc-goutte").length >= 2 && document.querySelector(".auc-zone"), null, { timeout: 15000 });
  const bistrot = sam.locator(`.auc-goutte[data-lieu="${BISTROT}"]`);
  ok((await bistrot.locator("i").innerText()) === "3" && (await bistrot.locator("img").evaluate((i) => i.complete && i.naturalWidth > 0)), "Le Petit Bistrot : le visage d'une figurine, et « 3 »");
  ok((await texte(sam, `.auc-zone[data-lieu="${ZONE_MAX}"]`)).includes("Soirée chez Max"), "« Ailleurs » : une zone floue en pointillés, « Soirée chez Max », jamais une épingle");
  const fond = await sam.evaluate(() => {
    const c = document.querySelector(".auc-carte canvas");
    return c ? { l: c.clientWidth, h: c.clientHeight } : null;
  });
  ok(fond && fond.l === 390 && fond.h >= 800, `la carte prend tout l'écran (${JSON.stringify(fond)})`);
}
await sam.waitForFunction(() => document.querySelectorAll(".atr-dernier").length >= 5, null, { timeout: 15000 });
ok((await texte(sam, ".atr-feuille")).includes("Les derniers mèmes autour de toi") && (await sam.locator(".atr-dernier img").first().evaluate((i) => i.complete && i.naturalWidth > 0)), "en bas : les derniers mèmes autour de lui, en vignettes");
ok((await debordement(sam)) <= 0 && (await sansMotInterdit(sam)), "la carte ne déborde pas, sans le mot interdit");
await sam.screenshot({ path: `${D}/autour-1-carte.png` });

// ═══ LE PETIT BISTROT ═══
const ouvrirBistrot = async () => {
  if (carteChargee) await sam.locator(`.auc-goutte[data-lieu="${BISTROT}"]`).click();
  else await sam.locator(".atr-ligne", { hasText: "Le Petit Bistrot" }).click();
  await sam.waitForSelector(".atr-lieu h2:has-text('Le Petit Bistrot')", { timeout: 15000 });
};
await ouvrirBistrot();
await sam.waitForSelector(".atr-lieu .atr-une video", { timeout: 15000 });
const lieuTexte = await texte(sam, ".atr-lieu");
ok(lieuTexte.includes("3 mèmes déposés ici") && lieuTexte.includes("Découvrir les 3 mèmes") && lieuTexte.includes("La conversation du moment"), "le lieu : « 3 mèmes déposés ici », « ▶ Découvrir les 3 mèmes », la conversation du moment");
const lieuRefait = await sam.evaluate(() => ({
  une: document.querySelector(".atr-une-titre")?.textContent ?? "",
  joue: Boolean(document.querySelector(".atr-une video")?.autoplay),
  visages: document.querySelectorAll(".atr-visages img").length,
  auteurs: document.querySelector(".atr-auteurs small")?.textContent ?? "",
  mur: document.querySelectorAll(".atr-mur .atr-mur-carte").length,
  neufs: document.querySelectorAll(".atr-mur .atr-neuf").length,
  voisins: [...document.querySelectorAll(".atr-voisin b")].map((b) => b.textContent),
}));
ok(lieuRefait.une.includes("Le dernier déposé ici") && lieuRefait.joue, `« à la une » : son dernier mème, qui joue tout de suite (${lieuRefait.une})`);
ok(lieuRefait.visages === 2 && /Léa|Hugo/.test(lieuRefait.auteurs) && lieuRefait.auteurs.includes("y ont déposé un mème"), `ceux qui y ont déposé, leurs visages (${lieuRefait.auteurs})`);
ok(lieuRefait.mur === 3 && lieuRefait.neufs === 3 && lieuTexte.includes("Tous les mèmes d’ici"), "le mur : ses trois mèmes, « NOUVEAU » sur ceux du jour");
ok(lieuTexte.includes("Juste à côté") && lieuRefait.voisins.includes("Boulangerie du Marché") && lieuRefait.voisins.includes("Soirée chez Max"), `« 📍 Juste à côté » : les lieux voisins qui ont des mèmes (${lieuRefait.voisins.join(", ")})`);
await sam.waitForFunction(() => document.querySelector(".atr-lieu-tete.photo img")?.complete, null, { timeout: 10000 }).catch(() => null);
await sam.waitForTimeout(400); // (son entrée animée)
const tete = await sam.evaluate(() => {
  const i = document.querySelector(".atr-lieu-tete.photo img");
  const r = document.querySelector(".atr-lieu-tete")?.getBoundingClientRect();
  return { photo: i ? i.naturalWidth : 0, l: r?.width, t: r?.top };
});
ok(tete.photo > 0 && tete.l === 390 && Math.round(tete.t) === 0, `🖼️ en haut de sa page : la photo du Petit Bistrot, sur toute la largeur (${JSON.stringify(tete)})`);
ok(!/★|étoile|avis|horaire|ouvert/i.test(lieuTexte), "ni étoiles, ni avis, ni horaires : pas une fiche de plan");
await sam.screenshot({ path: `${D}/autour-2-lieu.png` });
await sam.screenshot({ path: `${D}/autour-2b-lieu-entier.png`, fullPage: true });
// (la page entière : la section défile, pas le document)
await sam.evaluate(() => document.querySelector(".atr-lieu")?.scrollTo(0, 99999));
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/autour-2c-lieu-bas.png` });
await sam.evaluate(() => document.querySelector(".atr-lieu")?.scrollTo(0, 0));

// ═══ LE SWIPE ═══
const lieuAvant = await voir(SAM, `?lieu=${BISTROT}`);
await sam.locator(".atr-decouvrir").click();
await sam.waitForSelector(".atr-swipe .atr-pile .atr-mcarte:not(.dessous)", { timeout: 15000 });
ok((await texte(sam, ".atr-num")) === "1 / 3" && (await sam.locator(".atr-mcarte video").count()) === 1 && (await sam.locator(".atr-mcarte.dessous").count()) === 1, "une grande carte (la vidéo du mème), la suivante dessous, « 1 / 3 »");
const premier = await texte(sam, ".atr-mcarte:not(.dessous) .atr-qui b");
ok(premier.startsWith(lieuAvant.memes[0].prenom), `le premier : le plus récent (${premier})`);
await sam.screenshot({ path: `${D}/autour-3-swipe.png` });
await glisser(sam, 40);
ok((await texte(sam, ".atr-num")) === "1 / 3", "un petit geste : la carte revient");
await glisser(sam, 190);
await sam.waitForFunction(() => document.querySelector(".atr-num")?.textContent?.trim() === "2 / 3", null, { timeout: 5000 });
const apres = await voir(SAM, `?lieu=${BISTROT}`);
const aime = apres.memes.find((m) => m.id === lieuAvant.memes[0].id);
ok(aime?.reac?.n?.coeur === 1 && aime.reac.moi === "coeur", "glissé à droite : J'aime (la réaction ❤️ est gardée), et le suivant");
await sam.locator(".atr-rond[aria-label='Passer']").click();
await sam.waitForFunction(() => document.querySelector(".atr-num")?.textContent?.trim() === "3 / 3", null, { timeout: 5000 });
ok(true, "« ✕ Passer » : le suivant, sans J'aime");
// LE PROFIL DU CRÉATEUR
const troisieme = lieuAvant.memes[2];
await sam.locator(".atr-mcarte:not(.dessous) .atr-avatar").click();
await sam.waitForSelector(".atr-profil .atr-heros h2", { timeout: 15000 });
const profil = await texte(sam, ".atr-profil");
ok(profil.includes(troisieme.prenom) && profil.includes("Le Petit Bistrot") && (await sam.locator(".atr-profil .atr-grille .atr-vignette").count()) >= 1, `le profil de ${troisieme.prenom} : sa figurine, ses lieux, ses mèmes`);
ok(profil.includes("Jamais sa position") && !/43\.7|-1\.05/.test(profil), "jamais sa position");
await sam.screenshot({ path: `${D}/autour-4-profil.png` });
// 👯 SES GESTES : l'ajouter à ses proches (sa liste à lui), l'en retirer ; puis « ↩️ Lui répondre »
const auteur = GENS.find((x) => x.prenom === troisieme.prenom);
const prochesDeSam = async () => (await (await fetch(`${STOCK}/figurines-clients/${SAM.id}/proches.json`)).json().catch(() => ({}))).ids ?? [];
ok((await texte(sam, ".atr-profil .atr-proche")) === "👯 Ajouter en proche" && (await sam.locator(".atr-profil .atr-lui-repondre").count()) === 1, "sur son profil : « 👯 Ajouter en proche » et « ↩️ Lui répondre »");
await sam.locator(".atr-profil .atr-proche").click();
await sam.waitForSelector(".atr-profil .atr-proche.pris", { timeout: 10000 });
ok((await texte(sam, ".atr-profil .atr-proche")).includes("Dans tes proches") && (await prochesDeSam()).includes(auteur?.id) && (await texte(sam, ".atr-profil")).includes(`${troisieme.prenom} voit ce que tu déposes pour « Mes proches »`), `${troisieme.prenom} entre dans ses proches : « ✓ Dans tes proches »`);
await sam.screenshot({ path: `${D}/autour-4b-proche.png`, fullPage: true });
await sam.locator(".atr-profil .atr-proche").click();
await sam.waitForSelector(".atr-profil .atr-proche:not(.pris)", { timeout: 10000 });
ok(!(await prochesDeSam()).includes(auteur?.id), "un toucher de plus : il l'en retire");
await sam.locator(".atr-profil .atr-lui-repondre").click();
await sam.waitForSelector("section.atr-deposer h2", { timeout: 15000 });
ok((await texte(sam, "section.atr-deposer h2")) === "Répondre avec ma figurine" && (await sam.locator("section.atr-deposer .atr-choix.pris").count()) === 1, "« ↩️ Lui répondre » : à son dernier mème, là où il l'a déposé");
await sam.locator("section.atr-deposer .atr-titre .atr-fermer").click();
await sam.waitForSelector(".atr-lieu > .atr-fermer", { timeout: 10000 });
await sam.locator(".atr-lieu > .atr-fermer").click();

// ═══ LE MUR : UN TOUCHER, LE SWIPE À PARTIR DE CE MÈME ; « À LA UNE » : LE PLUS AIMÉ ═══
await ouvrirBistrot();
await sam.waitForSelector(".atr-lieu .atr-mur-carte", { timeout: 15000 });
ok(/le plus aimé ici/i.test(await texte(sam, ".atr-une-titre")) && (await texte(sam, ".atr-une-bas b")) === lieuAvant.memes[0].prenom, `il a aimé un mème : « 🔥 Le plus aimé ici » passe à la une (${await texte(sam, ".atr-une-bas b")})`);
await sam.locator(".atr-mur-carte", { hasText: "Moi devant la vitrine" }).click();
await sam.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous) video", { timeout: 15000 });
ok((await sam.locator(".atr-mcarte:not(.dessous) video").getAttribute("src")).includes("ecranlea0002") && (await texte(sam, ".atr-num")) === "1 / 3", "un toucher sur le mur : le swipe part de ce mème-là");
await sam.locator(".atr-swipe-haut .atr-fermer[aria-label='Fermer']").click();
await sam.waitForSelector(".atr-lieu .atr-decouvrir", { timeout: 10000 });

// ═══ SAM RÉPOND AVEC SA FIGURINE ═══
await sam.locator(".atr-decouvrir").click();
await sam.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous)", { timeout: 15000 });
await sam.locator(".atr-rond.repondre").click();
await sam.waitForSelector("section.atr-deposer .atr-miens .atr-vignette", { timeout: 15000 });
ok((await texte(sam, "section.atr-deposer h2")) === "Répondre avec ma figurine" && (await texte(sam, "section.atr-deposer .atr-choix.pris")).includes("Le Petit Bistrot") && (await sam.locator("section.atr-deposer .atr-ailleurs").count()) === 0, "« Répondre avec ma figurine » : au même endroit");
ok((await sam.locator("section.atr-deposer .atr-miens .atr-vignette").count()) === 3 && (await sam.locator(".atr-qui-voit [role=radio]").count()) === 3, "ses trois mèmes ; qui le voit : tout le monde, ses proches, lui seul");
await sam.waitForTimeout(400); // (son entrée animée)
const ecran = await sam.locator("section.atr-deposer").boundingBox();
ok(ecran && Math.round(ecran.y) === 0 && Math.round(ecran.height) === 844 && ecran.width === 390, `l'écran du dépôt prend tout l'écran, au-dessus de la carte (${JSON.stringify(ecran)})`);
await sam.locator("section.atr-deposer .atr-miens .atr-vignette", { hasText: "Je passais par là" }).click();
await sam.locator("section.atr-deposer input[aria-label='Un petit mot']").fill("Moi aussi, il m’a reconnu !");
await sam.screenshot({ path: `${D}/autour-5-repondre.png`, fullPage: false });
// 🔞 Sam n'a pas encore déclaré son âge : à son premier dépôt, on le lui demande, une fois (puis le geste repart)
await sam.locator("section.atr-deposer .atr-bas .atr-rose").click();
const questionAge = await repondreFenetre(sam);
await sam.waitForSelector(".atr-publie h2", { timeout: 15000 });
ok((await texte(sam, ".atr-publie")).includes("C’est publié !"), "« C'est publié ! »");
ok(/« Autour »/.test(questionAge) && /15 ans ou plus \?/.test(questionAge) && (await (await fetch(`${STOCK}/figurines-clients/${SAM.id}/majeur.json`)).json().catch(() => null))?.age === 15, `son âge lui a été demandé, une fois, puis noté (${questionAge.slice(0, 50)})`);
const repondu = (await voir(SAM, `?lieu=${BISTROT}`)).memes.find((m) => m.id === "ecransam0001");
ok(repondu?.reponseA === lieuAvant.memes[0].id && repondu.mot === "Moi aussi, il m’a reconnu !", "les deux mèmes sont liés (sa réponse, son petit mot)");
await sam.locator(".atr-publie .atr-rose").click();
await sam.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous) .atr-reponse-a", { timeout: 15000 });
ok((await texte(sam, ".atr-mcarte:not(.dessous) .atr-qui b")).startsWith("Sam") && (await texte(sam, ".atr-mcarte:not(.dessous) .atr-reponse-a")).includes(`Réponse à ${lieuAvant.memes[0].prenom}`), "« Voir mon mème » : le sien, « ↳ Réponse à … »");
await sam.locator(".atr-swipe-haut .atr-fermer[aria-label='Fermer']").click();
await sam.locator(".atr-lieu > .atr-fermer").click();

// ═══ SAM DÉPOSE « AILLEURS » ═══
await sam.locator(".atr-actions .atr-poser").click();
await sam.waitForSelector("section.atr-deposer .atr-miens .atr-vignette", { timeout: 15000 });
ok((await texte(sam, "section.atr-deposer h2")) === "Déposer mon mème" && (await sam.locator("section.atr-deposer .atr-lieux .atr-choix").count()) === 2, "« Déposer mon mème » : les commerces tout près");
// « Publier » sans dire où : on le lui dit clairement
await sam.locator("section.atr-deposer .atr-bas .atr-rose").click();
ok((await texte(sam, "section.atr-deposer .atr-erreur")).includes("Choisis d’abord où le déposer") && (await sam.locator(".atr-publie").count()) === 0, "« Publier » sans lieu : « Choisis d’abord où le déposer… »");
await sam.locator("section.atr-deposer .atr-ailleurs").click();
await sam.locator("section.atr-deposer input[aria-label='Le petit nom de l’endroit']").fill("Les Arènes");
await sam.locator("section.atr-deposer .atr-miens .atr-vignette", { hasText: "Ma ville, mes règles" }).click();
// 📍 OÙ IL APPARAÎTRA ; LE MÈME CHOISI, BIEN CLAIR
await sam.waitForSelector("section.atr-deposer .atr-ou", { timeout: 10000 });
await sam.waitForTimeout(400); // (les autres pâlissent)
const depot = await sam.evaluate(() => ({
  ou: document.querySelector(".atr-ou")?.innerText.replace(/\s+/g, " ") ?? "",
  carte: Boolean(document.querySelector(".atr-ou .auc-apercu")),
  grand: document.querySelector(".atr-choisi")?.innerText.replace(/\s+/g, " ") ?? "",
  video: Boolean(document.querySelector(".atr-choisi video")),
  coches: document.querySelectorAll(".atr-miens .atr-vignette.pris .atr-coche").length,
  pales: [...document.querySelectorAll(".atr-miens .atr-vignette:not(.pris)")].map((e) => Number(getComputedStyle(e).opacity)),
  publier: document.querySelector(".atr-deposer .atr-bas .atr-rose")?.textContent ?? "",
}));
ok(depot.ou.includes("Ton mème apparaîtra ici") && depot.ou.includes("Les Arènes") && depot.ou.includes("quelque part par ici") && depot.carte && depot.publier.includes("Publier · Les Arènes"), `📍 où il apparaîtra : une petite carte, « Les Arènes », « quelque part par ici » (${depot.ou.slice(0, 90)})`);
ok(/ma ville, mes règles/i.test(depot.grand) && depot.grand.includes("✓ Ton mème") && depot.video && depot.coches === 1 && depot.pales.length === 2 && depot.pales.every((o) => o < 0.6), `le mème choisi : en grand, qui joue, coché ; les autres pâlis (${JSON.stringify({ coches: depot.coches, pales: depot.pales })})`);
await sam.screenshot({ path: `${D}/autour-6a-depot.png` });
await sam.evaluate(() => document.querySelector(".atr-deposer")?.scrollTo(0, document.querySelector(".atr-choisi")?.offsetTop - 120));
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/autour-6b-depot-meme.png` });
await sam.locator("section.atr-deposer .atr-bas .atr-rose").click();
await sam.waitForSelector(".atr-publie h2", { timeout: 15000 });
const carteSam = await voir(SAM);
const arenes = carteSam.lieux.find((l) => l.nom === "Les Arènes");
const garde = arenes ? await liste(`autour/dax/${arenes.id}`) : [];
ok(arenes?.type === "zone" && arenes.lat !== ICI.latitude && arenes.lng !== ICI.longitude && !JSON.stringify(carteSam).includes("43.70313") && garde.length === 1, `« Ailleurs » : une zone floue (${arenes?.id}), jamais sa position`);
await sam.locator(".atr-publie .atr-lien").click();
if (carteChargee) {
  await sam.waitForSelector(`.auc-zone:has-text("Les Arènes")`, { timeout: 15000 });
  await sam.locator(".atr-ma-position").click();
  await sam.waitForSelector(".auc-moi", { timeout: 10000 });
  await sam.waitForTimeout(2000); // (la carte vole jusqu'à lui)
  ok(true, "« Ma position » : son point, vu de lui seul ; et sa zone sur la carte");
}
await sam.screenshot({ path: `${D}/autour-6-apres.png` });

// ═══ CHERCHER UN LIEU, PUIS SIGNALER ═══
await sam.locator(".atr-recherche input").fill("boulang");
await sam.waitForSelector(".atr-trouves button", { timeout: 5000 });
ok((await sam.locator(".atr-trouves button").count()) === 1 && (await texte(sam, ".atr-trouves")).includes("Boulangerie du Marché"), "la recherche : « boulang » trouve la Boulangerie du Marché");
await sam.locator(".atr-trouves button").click();
await sam.waitForSelector(".atr-lieu .atr-decouvrir", { timeout: 15000 });
ok((await sam.locator(".atr-lieu-tete.photo").count()) === 0 && (await texte(sam, ".atr-lieu-emoji")).length > 0, "la Boulangerie du Marché, sans photo : son fond, et son emoji");
await sam.locator(".atr-decouvrir").click();
await sam.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous)", { timeout: 15000 });
await sam.locator(".atr-swipe-haut .atr-fermer[aria-label='Signaler ce mème']").click();
await repondreFenetre(sam);
await sam.waitForSelector(".atr-toast", { timeout: 10000 });
const boulangerie = await voir(SAM, `?lieu=${BOULANGERIE}`);
ok((await texte(sam, ".atr-toast")).includes("signalé") && !(boulangerie.memes ?? []).some((m) => m.id === "ecranhugo002"), "⋯ Signaler (deux touchers) : le mème disparaît");
// TOUT VU ICI : « 📍 Continuer » vers le lieu le plus proche qui a des mèmes
await sam.waitForSelector(".atr-fin .atr-continuer", { timeout: 10000 });
ok((await texte(sam, ".atr-continuer")).includes("Continuer : Le Petit Bistrot"), `tout vu ici : « ${await texte(sam, ".atr-continuer")} »`);
await sam.screenshot({ path: `${D}/autour-6c-continuer.png` });
await sam.locator(".atr-continuer").click();
await sam.waitForSelector(".atr-lieu h2:has-text('Le Petit Bistrot')", { timeout: 15000 });
ok(true, "« Continuer » : le lieu voisin s'ouvre");
await sam.locator(".atr-lieu > .atr-fermer").click();

// ═══ 🔎 « LA GARE » : N'IMPORTE QUEL ENDROIT DE LA VILLE — LA CARTE Y VA, ET ON Y DÉPOSE ═══
await sam.locator(".atr-recherche input").fill("la gare");
await sam.waitForSelector(".atr-trouves .atr-endroit", { timeout: 10000 });
const trouvesGare = await texte(sam, ".atr-trouves");
ok(/sur la carte/i.test(trouvesGare) && trouvesGare.includes("Gare de Dax") && !trouvesGare.includes("Saint-Jean"), `« la gare » : la gare de Dax (pas celle de Bordeaux, trop loin) — « ${trouvesGare} »`);
await sam.screenshot({ path: `${D}/autour-7a-chercher.png` });
await sam.locator(".atr-trouves .atr-endroit", { hasText: "Gare de Dax" }).click();
await sam.waitForSelector(".atr-cible", { timeout: 5000 });
ok((await texte(sam, ".atr-cible")).includes("Gare de Dax") && (await texte(sam, ".atr-cible-deposer")) === "＋ Déposer ici" && (await sam.locator(".atr-actions").count()) === 0 && (await sam.inputValue(".atr-recherche input")) === "", "la carte y va : « 📍 Gare de Dax », « ＋ Déposer ici »");
if (carteChargee) {
  await sam.waitForSelector(".auc-cible", { timeout: 5000 });
  await sam.waitForTimeout(2500); // (la carte vole jusqu'à la gare)
  const pin = await sam.locator(".auc-cible").boundingBox();
  ok((await texte(sam, ".auc-cible")) === "Gare de Dax" && pin && pin.y > 120 && pin.y + pin.height < 844 - 370, `son épingle, au milieu de ce qu'on voit de la carte (${JSON.stringify(pin)})`);
}
await sam.screenshot({ path: `${D}/autour-7b-gare.png` });
await sam.locator(".atr-cible-deposer").click();
await sam.waitForSelector("section.atr-deposer .atr-ou", { timeout: 15000 });
ok((await texte(sam, "section.atr-deposer .atr-endroit-pris")).includes("Gare de Dax") && (await texte(sam, "section.atr-deposer .atr-ou")).includes("Gare de Dax"), "« ＋ Déposer ici » : le dépôt s'ouvre sur la gare, sa petite carte");
// (le dépôt cherche aussi : « gare », encore)
await sam.locator("section.atr-deposer .atr-chercher-ou input").fill("gare");
await sam.waitForSelector("section.atr-deposer .atr-lieux .atr-endroit", { timeout: 10000 });
await sam.locator("section.atr-deposer .atr-lieux .atr-endroit", { hasText: "Gare de Dax" }).click();
await sam.waitForSelector("section.atr-deposer .atr-endroit-pris", { timeout: 5000 });
await sam.locator("section.atr-deposer .atr-miens .atr-vignette", { hasText: "Le train de 8 h" }).click();
await sam.screenshot({ path: `${D}/autour-7c-depot-gare.png` });
await sam.evaluate(() => document.querySelector(".atr-deposer")?.scrollTo(0, 0));
await sam.waitForTimeout(800); // (la petite carte se dessine)
await sam.screenshot({ path: `${D}/autour-7d-ou-gare.png` });
await sam.locator("section.atr-deposer .atr-bas .atr-rose").click();
await sam.waitForSelector(".atr-publie h2", { timeout: 15000 });
const PAS = { lat: 0.0045, lng: 0.0062 };
const zoneGare = `z-${Math.floor(43.72085 / PAS.lat)}_${Math.floor(-1.04861 / PAS.lng)}`;
const carteGare = await voir(SAM);
const gare = carteGare.lieux.find((l) => l.nom === "Gare de Dax");
ok(gare?.type === "zone" && gare.id === zoneGare && gare.lat !== 43.72085 && !JSON.stringify(carteGare).includes("43.72085"), `déposé à la gare : une zone « quelque part par ici » (${gare?.id}), jamais l'endroit exact`);
await sam.locator(".atr-publie .atr-lien").click();
await sam.waitForSelector(".atr-actions .atr-poser", { timeout: 10000 });
ok((await sam.locator(".atr-cible").count()) === 0, "publié : la carte retrouve ses boutons");
if (carteChargee) await sam.waitForSelector(`.auc-zone:has-text("Gare de Dax")`, { timeout: 15000 });

// ═══ LÉA RÉPOND « AVEC SA TÊTE » : UN NOUVEAU MÈME, FAIT AU STUDIO POUR CE LIEU, PUIS DÉPOSÉ LÀ-BAS ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
await lea.waitForSelector(".auc-goutte, .atr-ligne", { timeout: 60000 });
if (await lea.locator(`.auc-goutte[data-lieu="${BISTROT}"]`).count()) await lea.locator(`.auc-goutte[data-lieu="${BISTROT}"]`).click();
else await lea.locator(".atr-ligne", { hasText: "Le Petit Bistrot" }).click();
await lea.waitForSelector(".atr-lieu .atr-decouvrir", { timeout: 15000 });
const aQui = (await voir(LEA, `?lieu=${BISTROT}`)).memes[0];
await lea.locator(".atr-decouvrir").click();
await lea.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous)", { timeout: 15000 });
await lea.locator(".atr-rond.repondre").click();
await lea.waitForSelector("section.atr-deposer .atr-nouveau", { timeout: 15000 });
ok((await texte(lea, "section.atr-deposer .atr-nouveau")).includes("avec ma tête"), "« ＋ Nouveau mème · avec ma tête » à côté de ses mèmes déjà faits");
await lea.locator("section.atr-deposer input[aria-label='Un petit mot']").fill("À demain au comptoir !");
await lea.locator(".atr-qui-voit [role=radio]", { hasText: "Mes proches" }).click();
await lea.locator("section.atr-deposer .atr-nouveau").click();
// le studio s'ouvre pour ce lieu
await lea.waitForSelector("#o-figurine:not([hidden]) #pour-autour", { timeout: 30000 });
await fermerPablito(lea, "#o-figurine");
const bandeau = await texte(lea, "#pour-autour");
ok(bandeau.includes("↩️ Ta réponse pour") && bandeau.includes("Le Petit Bistrot") && bandeau.includes("Pas d’idée ?"), `le studio s'ouvre pour ce lieu : « ${bandeau.slice(0, 60)} »`);
ok((await lea.locator(".tf-moi .tf-pas-idee").count()) === 1 && (await lea.locator(".tf-feuille-idee .tf-surprends").count()) === 1, "sa tête, sa phrase, ou « 🎲 Pas d’idée ? » (« Surprends-moi » est dedans)");
await lea.locator(".tf-moi .tf-texte textarea").fill("Même pas peur du chef !");
await lea.locator(".tf-envoyer").click();
await lea.waitForSelector(".tf-meme-pret .tf-vers-autour", { timeout: 90000 });
const versAutour = await texte(lea, ".tf-vers-autour");
ok(versAutour.includes("Répondre avec ce mème") && versAutour.includes("Le Petit Bistrot") && (await lea.locator(".tf-meme-pret .tf-public").count()) === 0, `son mème prêt : « ${versAutour} »`);
const idNouveau = (await lea.locator(".tf-meme-pret .tf-copier").getAttribute("data-lien")).split("/").pop();
await lea.screenshot({ path: `${D}/autour-8-sa-tete.png`, fullPage: true });
await lea.locator(".tf-vers-autour").click();
// retour au dépôt : le nouveau mème choisi, son petit mot et « Mes proches » gardés
await lea.waitForSelector(`#o-autour:not([hidden]) section.atr-deposer .atr-vignette.pris`, { timeout: 30000 });
const retour = {
  titre: await texte(lea, "section.atr-deposer h2"),
  lieu: await texte(lea, "section.atr-deposer .atr-choix.pris"),
  mot: await lea.locator("section.atr-deposer input[aria-label='Un petit mot']").inputValue(),
  qui: await texte(lea, ".atr-qui-voit [aria-checked=true]"),
  meme: await lea.locator("section.atr-deposer .atr-vignette.pris").getAttribute("aria-label"),
};
ok(
  retour.titre === "Répondre avec ma figurine" && retour.lieu.includes("Le Petit Bistrot") && retour.mot === "À demain au comptoir !" && retour.qui === "Mes proches" && retour.meme === "Même pas peur du chef !",
  `de retour sur « Autour » : le dépôt l'attendait, son nouveau mème déjà choisi, son petit mot et « Mes proches » gardés (${JSON.stringify(retour)})`,
);
await lea.locator("section.atr-deposer .atr-bas .atr-rose").click();
await lea.waitForSelector(".atr-publie h2", { timeout: 15000 });
const saReponse = (await voir(LEA, `?lieu=${BISTROT}`)).memes.find((m) => m.id === idNouveau);
ok(saReponse?.reponseA === aQui.id && saReponse.mot === "À demain au comptoir !" && saReponse.qui === "proches", `publiée au Petit Bistrot : sa réponse à ${aQui.prenom}, avec sa tête (${JSON.stringify({ a: saReponse?.reponseA, qui: saReponse?.qui })})`);
ok((await debordement(lea)) <= 0, "le studio et le dépôt ne débordent pas");

// ═══ « RENCONTRES » EST EFFACÉ : SON ANCIENNE ADRESSE OUVRE « CRÉER » ═══
await sam.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await sam.waitForSelector("#o-figurine:not([hidden])", { timeout: 30000 });
ok((await sam.locator("#o-rencontre").count()) === 0 && (await sam.locator(".mc-nav button.pris").innerText()).includes("Créer"), "`#rencontre` ouvre « Créer » (« Rencontres » est effacé)");

// ═══ SANS CARTE : LA LISTE ═══
const sansCarte = await tel(SAM, { panne: true });
await sansCarte.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
await sansCarte.waitForSelector(".atr-liste .atr-ligne", { timeout: 30000 });
const lignes = await texte(sansCarte, ".atr-liste");
ok(lignes.includes("La carte ne s’est pas chargée") && lignes.includes("Le Petit Bistrot") && lignes.includes("4 mèmes") && lignes.includes("Les Arènes"), "les tuiles refusées : la liste des lieux, avec leurs mèmes");
ok((await debordement(sansCarte)) <= 0, "la liste ne déborde pas");
await sansCarte.screenshot({ path: `${D}/autour-7-sans-carte.png` });

// ═══ SANS FIGURINE ═══
const inconnu = await tel(null);
await inconnu.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
// (sa toute première arrivée : Pablito lui dit bienvenue, une fois — le tuto)
await fermerPablito(inconnu);
await inconnu.waitForSelector(".atr-invite", { timeout: 30000 });
ok((await texte(inconnu, ".atr-invite")).includes("Crée ta figurine") && (await texte(inconnu, ".atr-haut")).includes("dans ta ville"), "sans figurine : on l'invite à la créer");
await inconnu.locator(".atr-actions .atr-poser").click();
await inconnu.waitForSelector("section.atr-deposer .atr-vide", { timeout: 10000 });
ok((await texte(inconnu, ".atr-deposer")).includes("il te faut ta figurine"), "« Déposer » : il lui faut sa figurine");

// ═══ ↩️ LE TOUCHER SUR « HUGO T'A RÉPONDU ! » : `?autour=<lieu>&meme=<id>` OUVRE LE SWIPE, SUR SA RÉPONSE ═══
const notifiee = await tel(LEA);
await notifiee.goto(`${BASE}/collection?autour=${BISTROT}&meme=ecranhugo001#autour`, { waitUntil: "networkidle" });
await notifiee.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous) .atr-qui b", { timeout: 60000 });
ok((await texte(notifiee, ".atr-mcarte:not(.dessous) .atr-qui b")).startsWith("Hugo") && !notifiee.url().includes("autour="), "le toucher sur la notification : le swipe du Petit Bistrot, sur la réponse de Hugo (l'adresse redevient propre)");
await notifiee.context().close();

// ═══ 🛡️ LA MODÉRATION : LE MÈME SIGNALÉ (le croissant de Hugo), TEL QUE LES GENS L'ONT VU ; PUIS RETIRÉ POUR DE BON ═══
ok(lieuDe(await voir(SAM), BOULANGERIE)?.n === 0, "signalé : il ne compte plus sur la carte (la boulangerie : 0)");
// une session d'administration (le jeton « faux-admin » du faux Supabase ; l'administrateur dans `admins`)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const ctxAdmin = await b.newContext({ viewport: { width: 1100, height: 900 } });
await ctxAdmin.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, url: BASE }]);
await ctxAdmin.route("https://tiles.openfreemap.org/**", (r) => (r.request().url().includes("/styles/") ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STYLE) }) : r.abort()));
const admin = await ctxAdmin.newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));
admin.on("dialog", (d) => void d.accept());
// et un autre, signalé à tort : un mème de Léa au Petit Bistrot
await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "signaler", id: "ecranlea0002" }) });
ok(!(await voir(SAM, `?lieu=${BISTROT}`)).memes.some((m) => m.id === "ecranlea0002"), "le mème de Léa, signalé : il disparaît du Petit Bistrot");
await admin.goto(`${BASE}/admin/humain/figurines-clients#signales`, { waitUntil: "networkidle" });
await admin.waitForSelector(`.signale[data-meme="ecranhugo002"]`, { timeout: 30000 });
const fiche = await texte(admin, `.signale[data-meme="ecranhugo002"]`);
ok(
  fiche.includes("Hugo") && fiche.includes("« Le croissant du matin »") && fiche.includes("Autour : Boulangerie du Marché (pour tout le monde)") && (await admin.locator(`.signale[data-meme="ecranhugo002"] video`).count()) === 1,
  `la modération le voit comme les gens l'ont vu : sa vidéo, ses mots, où (${fiche.slice(0, 120)})`,
);
await admin.screenshot({ path: `${D}/autour-9-moderation.png`, fullPage: true });
await admin.locator(`.signale[data-meme="ecranhugo002"] .retirer`).click();
await admin.waitForSelector(`.signale[data-meme="ecranhugo002"]`, { state: "detached", timeout: 15000 });
ok((await liste(`autour/dax/${BOULANGERIE}`)).length === 0 && !(await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/autour/ecranhugo002.json`)).text()).includes("lieu"), "« Retirer pour de bon » : son dépôt quitte la carte");
await admin.locator(`.signale[data-meme="ecranlea0002"] .remettre`).click();
await admin.waitForSelector(`.signale[data-meme="ecranlea0002"]`, { state: "detached", timeout: 15000 });
ok((await voir(SAM, `?lieu=${BISTROT}`)).memes.some((m) => m.id === "ecranlea0002"), "« Remettre » (signalé à tort) : il revient au Petit Bistrot");

// ═══ 🏛️ LES LIEUX PUBLICS : L'ADMIN PLACE « LES ARÈNES » EN TOUCHANT LA CARTE ; ILS APPARAISSENT DANS « AUTOUR » ═══
await admin.goto(`${BASE}/admin/humain/lieux-publics?ville=dax`, { waitUntil: "networkidle" });
await admin.waitForSelector(".lp-formulaire .lp-suggestion", { timeout: 30000 });
const suggerees = await admin.locator(".lp-suggestion").allInnerTexts();
ok(suggerees.some((x) => x.includes("Les Arènes")) && suggerees.some((x) => x.includes("Les Halles")), `des noms suggérés pour Dax, sans position (${suggerees.length})`);
await admin.locator(".lp-suggestion", { hasText: "Les Arènes" }).click();
await admin.waitForSelector(".lp-carte canvas", { timeout: 20000 }).catch(() => null);
await admin.waitForTimeout(800);
await admin.locator(".lp-carte").click({ position: { x: 520, y: 230 } });
await admin.waitForTimeout(300);
const touchee = { lat: await admin.locator(".lp-lat").inputValue(), lng: await admin.locator(".lp-lng").inputValue() };
ok((await admin.locator(".lp-nom").inputValue()) === "Les Arènes" && Number(touchee.lat) > 43 && Number(touchee.lat) < 44.5 && Number(touchee.lng) < 0, `un toucher sur la carte : sa position (${touchee.lat}, ${touchee.lng})`);
await admin.screenshot({ path: `${D}/autour-10-lieux-publics.png`, fullPage: true });
await admin.locator(".lp-placer").click();
await admin.waitForSelector(`.lp-lieu[data-lieu="p-les-arenes"]`, { timeout: 15000 });
const arenesSam = (await voir(SAM)).lieux.find((l) => l.id === "p-les-arenes");
ok(arenesSam?.type === "public" && arenesSam.emoji === "🐂" && Math.abs(arenesSam.lat - Number(touchee.lat)) < 1e-5, "placé : « Les Arènes » est sur la carte d'« Autour », là où on a touché");
await admin.locator(`.lp-lieu[data-lieu="p-les-arenes"] .lp-retirer`).click();
await admin.waitForSelector(`.lp-lieu[data-lieu="p-les-arenes"]`, { state: "detached", timeout: 15000 });
ok(!(await voir(SAM)).lieux.some((l) => l.id === "p-les-arenes"), "« Retirer » : il quitte la carte");
await ctxAdmin.close();

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
