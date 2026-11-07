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
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

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
  { id: "ffffffff-0000-4000-8000-000000000301", slug: "petit-bistrot-ecran", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 },
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

/** La route, comme le téléphone de quelqu'un. */
const route = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/autour`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (qui, q = "") => (await fetch(`${BASE}/api/direct/autour${q}`, { headers: { cookie: qui ? `clikme_habitant=${qui.jeton}` : "" } })).json();
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
await sam.waitForSelector(".atr-lieu .atr-eventail img", { timeout: 15000 });
const lieuTexte = await texte(sam, ".atr-lieu");
ok(lieuTexte.includes("3 mèmes déposés ici") && lieuTexte.includes("Découvrir les 3 mèmes") && lieuTexte.includes("La conversation du moment"), "le lieu : « 3 mèmes déposés ici », l'éventail, « ▶ Découvrir », la conversation du moment");
ok(!/★|étoile|avis|horaire|ouvert/i.test(lieuTexte), "ni étoiles, ni avis, ni horaires : pas une fiche de plan");
await sam.screenshot({ path: `${D}/autour-2-lieu.png` });

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
await sam.locator(".atr-profil > .atr-fermer").click();

// ═══ SAM RÉPOND AVEC SA FIGURINE ═══
await ouvrirBistrot();
await sam.locator(".atr-decouvrir").click();
await sam.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous)", { timeout: 15000 });
await sam.locator(".atr-rond.repondre").click();
await sam.waitForSelector("section.atr-deposer .atr-miens .atr-vignette", { timeout: 15000 });
ok((await texte(sam, "section.atr-deposer h2")) === "Répondre avec ma figurine" && (await texte(sam, "section.atr-deposer .atr-choix.pris")).includes("Le Petit Bistrot") && (await sam.locator("section.atr-deposer .atr-ailleurs").count()) === 0, "« Répondre avec ma figurine » : au même endroit");
ok((await sam.locator("section.atr-deposer .atr-miens .atr-vignette").count()) === 2 && (await sam.locator(".atr-qui-voit [role=radio]").count()) === 3, "ses deux mèmes ; qui le voit : tout le monde, ses proches, lui seul");
await sam.waitForTimeout(400); // (son entrée animée)
const ecran = await sam.locator("section.atr-deposer").boundingBox();
ok(ecran && Math.round(ecran.y) === 0 && Math.round(ecran.height) === 844 && ecran.width === 390, `l'écran du dépôt prend tout l'écran, au-dessus de la carte (${JSON.stringify(ecran)})`);
await sam.locator("section.atr-deposer .atr-miens .atr-vignette", { hasText: "Je passais par là" }).click();
await sam.locator("section.atr-deposer input[aria-label='Un petit mot']").fill("Moi aussi, il m’a reconnu !");
await sam.screenshot({ path: `${D}/autour-5-repondre.png`, fullPage: false });
// 🔞 Sam n'a pas encore déclaré son âge : à son premier dépôt, on le lui demande, une fois (puis le geste repart)
let questionAge = "";
sam.once("dialog", (d) => (questionAge = d.message())); // (ses boîtes de dialogue sont acceptées : `tel`)
await sam.locator("section.atr-deposer .atr-bas .atr-rose").click();
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
await sam.locator("section.atr-deposer .atr-ailleurs").click();
await sam.locator("section.atr-deposer input[aria-label='Le petit nom de l’endroit']").fill("Les Arènes");
await sam.locator("section.atr-deposer .atr-miens .atr-vignette", { hasText: "Ma ville, mes règles" }).click();
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
await sam.locator(".atr-decouvrir").click();
await sam.waitForSelector(".atr-swipe .atr-mcarte:not(.dessous)", { timeout: 15000 });
await sam.locator(".atr-swipe-haut .atr-fermer[aria-label='Signaler ce mème']").click();
await sam.waitForSelector(".atr-toast", { timeout: 10000 });
const boulangerie = await voir(SAM, `?lieu=${BOULANGERIE}`);
ok((await texte(sam, ".atr-toast")).includes("signalé") && !(boulangerie.memes ?? []).some((m) => m.id === "ecranhugo002"), "⋯ Signaler (deux touchers) : le mème disparaît");
await sam.locator(".atr-swipe-haut .atr-fermer[aria-label='Fermer']").click();
await sam.locator(".atr-lieu > .atr-fermer").click();

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
ok(bandeau.includes("↩️ Ta réponse pour") && bandeau.includes("Le Petit Bistrot") && bandeau.includes("Surprends-moi"), `le studio s'ouvre pour ce lieu : « ${bandeau.slice(0, 60)} »`);
ok((await lea.locator(".tf-moi .tf-surprends").count()) === 1, "sa tête, sa phrase, ou « 🎲 Surprends-moi ! »");
await lea.locator(".tf-moi .tf-texte textarea").fill("Même pas peur du chef !");
await lea.locator(".tf-moi .tf-quelle-voix button", { hasText: "voix de femme" }).click();
await lea.locator(".tf-moi .tf-ecouter").click();
await lea.waitForSelector(".tf-envoyer", { timeout: 30000 });
await lea.locator(".tf-envoyer").click();
await lea.waitForSelector(".tf-meme-pret .tf-vers-autour", { timeout: 90000 });
const versAutour = await texte(lea, ".tf-vers-autour");
ok(versAutour.includes("Répondre avec ce mème") && versAutour.includes("Le Petit Bistrot") && (await lea.locator(".tf-meme-pret .tf-public").count()) === 0, `son mème prêt : « ${versAutour} »`);
const idNouveau = (await lea.locator(".tf-adresse").inputValue()).split("/").pop();
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
await inconnu.waitForSelector(".atr-invite", { timeout: 30000 });
ok((await texte(inconnu, ".atr-invite")).includes("Crée ta figurine") && (await texte(inconnu, ".atr-haut")).includes("dans ta ville"), "sans figurine : on l'invite à la créer");
await inconnu.locator(".atr-actions .atr-poser").click();
await inconnu.waitForSelector("section.atr-deposer .atr-vide", { timeout: 10000 });
ok((await texte(inconnu, ".atr-deposer")).includes("il te faut ta figurine"), "« Déposer » : il lui faut sa figurine");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
