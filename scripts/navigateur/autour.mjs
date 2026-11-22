// 📍 « AUTOUR DE MOI », L'ÉCRAN — JE POSE MA FIGURINE DANS LA VILLE (22 novembre 2026 ; `app/collection/autour.tsx`,
// `autour-carte.tsx` ; `docs/univers/autour.md`), contre le faux Supabase et le faux moteur d'image, jamais la vraie base.
//
// À Dax : le Petit Bistrot et la Boulangerie du Marché (des commerces clients avec leurs coordonnées). Léa a sa figurine
// du nouveau style, ses expressions, et un fou rire pour humeur du jour : elle a posé sa figurine au Bistrot (« Qui vient
// prendre un café ? ») et « Ailleurs » (« Soirée chez Max ») ; Hugo, à la boulangerie. Sam ouvre « Autour » : la carte
// (les tuiles servies par l'essai : un fond uni), la goutte du Bistrot avec la tête du rire de Léa, la zone floue,
// « Posées autour de toi aujourd'hui » (les mots du jour). Le Bistrot : Léa assise, son mot dans sa bulle. Sa fiche :
// « Répondre avec ma figurine », « 🏠 Voir sa maison », « 👯 L'ajouter en proche ». Sam répond : la sienne s'assoit à
// côté (« ↳ à côté de Léa »), « C'est posé ». Il la retire. Puis il pose « Ailleurs » (« Les Arènes ») : une zone,
// jamais sa position. Il signale celle de Hugo : il ne la voit plus. Sans carte : la liste des lieux. Sans figurine : on
// l'invite à la créer. La notification (« ?autour=<lieu> ») ouvre le lieu. `#rencontre` ouvre « Créer ». L'admin place
// « Les Arènes ». Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer, repondreFenetre } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const LEA = { id: "acacacac-0000-4000-8000-000000000301", jeton: "jeton-lea-autour-ecran-00001", prenom: "Léa" };
const HUGO = { id: "acacacac-0000-4000-8000-000000000302", jeton: "jeton-hugo-autour-ecran-0001", prenom: "Hugo" };
const SAM = { id: "acacacac-0000-4000-8000-000000000303", jeton: "jeton-sam-autour-ecran-00001", prenom: "Sam" };
const BISTROT = "c-petit-bistrot-ecran";
const BOULANGERIE = "c-boulangerie-ecran";
/** Où est Sam (son téléphone le dit) : jamais montré, jamais gardé tel quel. */
const ICI = { latitude: 43.70313, longitude: -1.06087 };
const maintenant = new Date().toISOString();

// ─── Dax : deux commerces clients, trois habitants avec leur figurine ───
await semer("human_vitrine_sites", [
  { id: "ffffffff-0000-4000-8000-000000000301", slug: "petit-bistrot-ecran", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538, metadata: { photos_du_lieu: { devanture: { url: "https://photos.clikme-essai.test/bistrot.jpg", at: "" } } } },
  { id: "ffffffff-0000-4000-8000-000000000302", slug: "boulangerie-ecran", channel: "letter", business_name: "Boulangerie du Marché", city: "Dax", activite: "Boulangerie", published: true, est_client: true, latitude: 43.7079, longitude: -1.0571 },
]);
const GENS = [LEA, HUGO, SAM];
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const IMAGES = { [LEA.id]: "salut-1", [HUGO.id]: "montre", [SAM.id]: "viens" };
for (const x of GENS) await deposer(`${x.id}/neutre-essai.webp`, fs.readFileSync(`public/direct/double/pied/${IMAGES[x.id]}.webp`), "image/webp");
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/neutre-essai.webp`, prete_le: maintenant })),
);
for (const x of GENS) await json(`${x.id}/majeur.json`, { le: maintenant, age: 30 });
// (Léa : sa figurine assise du nouveau style — ses calques et ses expressions se font ; son humeur du jour, un fou rire)
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="#c8643c"/><rect x="370" y="540" width="60" height="40" fill="#c8643c"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/></svg>`), left: 0, top: 0 }])
  .png()
  .toBuffer();
await deposer(`${LEA.id}/perso/v1/assise.png`, assise, "image/png");
const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${LEA.id}/perso/v1/assise.png` } }, historique: [] };
await json(`${LEA.id}/perso/v1/fiche.json`, fiche);
await json(`${LEA.id}/perso/fiche.json`, fiche);
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
await json(`${LEA.id}/humeur.json`, { jour, visage: "rire", le: maintenant });
await fetch(`${BASE}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
let etat = null;
for (let k = 0; k < 200 && !etat?.le; k++) {
  await pause(400);
  etat = await lire(`${LEA.id}/calques/${K}-expressions.json`);
}

/** La route, comme le téléphone de quelqu'un. */
const route = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/autour`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (qui, q = "") => (await fetch(`${BASE}/api/direct/autour${q}`, { headers: { cookie: qui ? `clikme_habitant=${qui.jeton}` : "" } })).json();
const avant = [
  await route(LEA, { action: "poser", lieu: BISTROT, mot: "Qui vient prendre un café ?", tete: "humeur", qui: "tous" }),
  await route(LEA, { action: "poser", ici: { lat: 43.7149, lng: -1.0502 }, nomLieu: "Soirée chez Max", mot: "Ce soir, je suis là", tete: "humeur", qui: "tous" }),
  await route(HUGO, { action: "poser", lieu: BOULANGERIE, mot: "Le croissant est encore chaud", qui: "tous" }),
];
const ZONE_MAX = avant[1].lieu;
const POSE_LEA = avant[0].id;
const POSE_HUGO = avant[2].id;

const b = await lancer({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
ok(Boolean(etat?.tetes?.rire), "Léa a ses expressions (le fou rire compris)");
ok(avant.every((r) => r.statut === 200) && /^z-/.test(ZONE_MAX ?? ""), "Léa et Hugo ont posé leurs figurines (le Bistrot, une soirée, la boulangerie)");
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
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};

// ═══ SAM OUVRE « AUTOUR » ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
await fermerPablito(sam);
await sam.waitForSelector("#o-autour .atr-haut h1", { timeout: 60000 });
ok((await texte(sam, ".mc-nav button.pris")).includes("Autour"), "le menu : « Autour », l'onglet où l'on est");
ok((await texte(sam, "#o-autour .atr-haut")).includes("Autour de moi") && (await texte(sam, "#o-autour .atr-haut")).includes("Les figurines posées aujourd’hui, à Dax"), "le titre : « Autour de moi », les figurines posées aujourd'hui à Dax");
await sam.waitForSelector(".auc-goutte, .atr-ligne", { timeout: 30000 });
const carteChargee = (await sam.locator(".auc-goutte").count()) > 0;
ok(carteChargee, "la carte se charge (MapLibre, le fond repeint aux couleurs de ClikMe)");
if (carteChargee) {
  await sam.waitForFunction(() => document.querySelectorAll(".auc-goutte").length >= 2 && document.querySelector(".auc-zone"), null, { timeout: 15000 });
  const bistrot = sam.locator(`.auc-goutte[data-lieu="${BISTROT}"]`);
  ok((await bistrot.locator("i").innerText()) === "1" && (await bistrot.locator("img").getAttribute("src")) === etat?.tetes?.rire, "Le Petit Bistrot : la tête du rire de Léa (son humeur du jour), et « 1 »");
  ok((await texte(sam, `.auc-zone[data-lieu="${ZONE_MAX}"]`)).includes("Soirée chez Max"), "« Ailleurs » : une zone floue, « Soirée chez Max », jamais une épingle");
}
const feuille = sam.locator(".atr-feuille");
ok(await attendre(sam, async () => (await feuille.locator("[data-derniere]").count()) === 3), "« Posées autour de toi aujourd'hui » : trois figurines");
ok(/Qui vient prendre un café/.test(await texte(sam, ".atr-feuille")) && /Le croissant est encore chaud/.test(await texte(sam, ".atr-feuille")), "… avec leurs mots du jour");
await sam.waitForTimeout(500);
await sam.screenshot({ path: `${D}/autour-1-carte.png` });
ok((await debordement(sam)) <= 0, "la carte ne déborde pas");

// ═══ LE BISTROT : LÉA ASSISE, SON MOT DANS SA BULLE ═══
await feuille.locator(`[data-derniere="${POSE_LEA}"]`).click();
const lieu = sam.locator(`[data-lieu-ouvert="${BISTROT}"]`);
ok(await attendre(sam, async () => /1 figurine posée aujourd’hui/.test(await texte(sam, `[data-lieu-ouvert="${BISTROT}"] .afg-lieu-haut`))), "le Petit Bistrot : « 1 figurine posée aujourd'hui »");
const figLea = lieu.locator(`[data-fig="${POSE_LEA}"]`);
ok((await figLea.locator(".afg-bulle").innerText()) === "Qui vient prendre un café ?" && (await figLea.locator('[data-assise="calques"]').count()) === 1 && (await figLea.locator("img.afg-tete").getAttribute("src")) === etat?.tetes?.rire, "Léa assise : son corps, la tête de son humeur, son mot dans sa bulle");
await sam.waitForTimeout(400);
await sam.screenshot({ path: `${D}/autour-2-lieu.png` });

// ═══ SA FICHE ; « 👯 L'AJOUTER EN PROCHE » ═══
await figLea.click();
const ficheLea = sam.locator(`[data-fiche="${POSE_LEA}"]`);
ok(await attendre(sam, async () => /Léa/.test(await texte(sam, `[data-fiche="${POSE_LEA}"] h2`)) && /Posée à Le Petit Bistrot/.test(await texte(sam, `[data-fiche="${POSE_LEA}"]`))), "sa fiche : « Léa », « Posée à Le Petit Bistrot · … · encore 24 h »");
ok((await ficheLea.locator("[data-voir-maison]").getAttribute("href")) === `/univers/chez/${cleProfil(LEA.id)}` && (await ficheLea.locator("[data-repondre]").count()) === 1, "« 🏠 Voir sa maison » mène à sa maison ; « Répondre avec ma figurine »");
await ficheLea.locator("[data-proche]").click();
ok(await attendre(sam, async () => /Déjà en proche/.test(await texte(sam, `[data-fiche="${POSE_LEA}"] [data-proche]`))), "« 👯 L'ajouter en proche » : c'est fait");

// ═══ SAM RÉPOND AVEC SA FIGURINE : ELLE S'ASSOIT À CÔTÉ ═══
await ficheLea.locator("[data-repondre]").click();
const poser = sam.locator("[data-poser-ecran]");
ok(await attendre(sam, async () => /Répondre avec ma figurine/.test(await texte(sam, "[data-poser-ecran] h2")) && /à côté de Léa/.test(await texte(sam, "[data-lieu-donne]"))), "« Répondre avec ma figurine » : le Petit Bistrot, à côté de Léa");
ok(await poser.locator("[data-envoyer-pose]").isDisabled(), "… sans mot du jour, rien ne part");
await poser.locator("[data-idee]", { hasText: "Je garde une place" }).click();
ok((await poser.locator('[data-champ="mot-du-jour"]').inputValue()) === "Je garde une place" && /Je garde une place/.test(await texte(sam, "[data-apercu]")), "une idée : le mot du jour, et l'aperçu");
await poser.locator("[data-envoyer-pose]").click();
ok(await attendre(sam, async () => (await lieu.locator(".afg-fig").count()) === 2 && /à côté de Léa/.test(await texte(sam, `[data-lieu-ouvert="${BISTROT}"] .afg-fig[data-moi]`))), "posée : la sienne s'assoit à côté de celle de Léa (« ↳ à côté de Léa », « Toi »)");
ok(/C’est posé : elle reste jusqu’à demain/.test(await texte(sam, "[data-toast]")), "« C'est posé : elle reste jusqu'à demain, … »");
ok(/Ta figurine est ici/.test(await texte(sam, "[data-mienne]")) && /Changer mon mot du jour/.test(await texte(sam, "[data-poser-ici]")), "« Ta figurine est ici · encore 24 h » ; « Changer mon mot du jour »");
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/autour-3-a-cote.png` });

// ═══ IL LA RETIRE ═══
await lieu.locator(".afg-fig[data-moi]").click();
await sam.locator("[data-fiche] [data-retirer]").click();
await repondreFenetre(sam, true);
ok(await attendre(sam, async () => (await lieu.locator(".afg-fig").count()) === 1 && /retirée/.test(await texte(sam, "[data-toast]"))), "« Retirer ma figurine » : elle quitte le Bistrot");

// ═══ IL POSE « AILLEURS » : UNE ZONE, JAMAIS SA POSITION ═══
await sam.locator("[data-lieu-ouvert] .atr-fermer").click();
await sam.locator(".atr-actions [data-poser]").click();
ok(await attendre(sam, async () => /Poser ma figurine/.test(await texte(sam, "[data-poser-ecran] h2")) && (await poser.locator("[data-lieu-choix]").count()) >= 2), "« ＋ Poser ma figurine » : où (les lieux de la liste, « Ailleurs »), quelle tête, le mot du jour, qui la voit");
await poser.locator("[data-ailleurs]").click();
await poser.locator('[data-champ="nom-lieu"]').fill("Les Arènes");
await poser.locator('[data-champ="mot-du-jour"]').fill("Quelqu’un pour une balade ?");
await poser.locator('[data-qui="proches"]').click();
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/autour-4-poser.png` });
ok((await debordement(sam)) <= 0, "« Poser ma figurine » ne déborde pas");
await poser.locator("[data-envoyer-pose]").click();
ok(await attendre(sam, async () => (await sam.locator("[data-lieu-ouvert^='z-'] .afg-fig[data-moi]").count()) === 1), "posée « Ailleurs » : sa zone s'ouvre, sa figurine y est");
const zoneSam = await sam.locator("[data-lieu-ouvert^='z-']").getAttribute("data-lieu-ouvert");
const fichiers = await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: `autour-fig/dax/${zoneSam}`, limit: 100 }) })).json();
const depot = fichiers[0] ? await lire(`autour-fig/dax/${zoneSam}/${fichiers[0].name}`) : null;
ok(zoneSam !== ZONE_MAX && depot?.nomLieu === "Les Arènes" && depot.qui === "proches" && !JSON.stringify(depot).includes("43.70313"), `une zone (${zoneSam}), son petit nom, « Mes proches » ; sa position gardée nulle part`);

// ═══ IL SIGNALE LA FIGURINE DE HUGO ═══
await sam.locator("[data-lieu-ouvert] .atr-fermer").click();
await sam.locator(".atr-recherche input").fill("Boulangerie");
await sam.locator(".atr-trouves button", { hasText: "Boulangerie du Marché" }).click();
await sam.locator(`[data-fig="${POSE_HUGO}"]`).click();
await sam.locator("[data-fiche] [data-signaler]").click();
await repondreFenetre(sam, true);
ok(await attendre(sam, async () => (await sam.locator(`[data-fig="${POSE_HUGO}"]`).count()) === 0 && /tu ne la verras plus/.test(await texte(sam, "[data-toast]"))), "« Signaler » : il ne la voit plus");

// ═══ « RENCONTRES » EST EFFACÉ : SON ANCIENNE ADRESSE OUVRE « CRÉER » ═══
await sam.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await sam.waitForSelector("#o-figurine:not([hidden])", { timeout: 30000 });
ok((await sam.locator("#o-rencontre").count()) === 0, "`#rencontre` ouvre « Créer » (« Rencontres » est effacé)");

// ═══ SANS CARTE : LA LISTE ═══
const sansCarte = await tel(SAM, { panne: true });
await sansCarte.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
await sansCarte.waitForSelector(".atr-liste .atr-ligne", { timeout: 30000 });
const lignes = await texte(sansCarte, ".atr-liste");
ok(lignes.includes("La carte ne s’est pas chargée") && lignes.includes("Le Petit Bistrot") && lignes.includes("1 figurine") && lignes.includes("Les Arènes"), `les tuiles refusées : la liste des lieux, avec leurs figurines (${lignes.slice(0, 120)})`);
ok((await debordement(sansCarte)) <= 0, "la liste ne déborde pas");

// ═══ SANS FIGURINE ═══
const inconnu = await tel(null);
await inconnu.goto(`${BASE}/collection?v=${Date.now()}#autour`, { waitUntil: "networkidle" });
await fermerPablito(inconnu);
await inconnu.waitForSelector(".atr-invite", { timeout: 30000 });
ok((await texte(inconnu, ".atr-invite")).includes("Crée ta figurine") && (await texte(inconnu, ".atr-haut")).includes("dans ta ville"), "sans figurine : on l'invite à la créer");
await inconnu.locator(".atr-actions [data-poser]").click();
ok(await attendre(inconnu, async () => /Il te faut d’abord ta figurine/.test(await texte(inconnu, "[data-poser-ecran]"))), "« Poser ma figurine » : il lui faut d'abord sa figurine");

// ═══ ↩️ LA NOTIFICATION : `?autour=<lieu>` OUVRE LE LIEU ═══
const notifiee = await tel(LEA);
await notifiee.goto(`${BASE}/collection?autour=${BISTROT}&pose=${POSE_LEA}#autour`, { waitUntil: "networkidle" });
ok(await attendre(notifiee, async () => (await notifiee.locator(`[data-lieu-ouvert="${BISTROT}"] .afg-fig[data-moi]`).count()) === 1 && !notifiee.url().includes("autour="), 30000), "le toucher sur la notification : le Petit Bistrot, sa figurine (l'adresse redevient propre)");
await notifiee.context().close();

// ═══ L'ADMINISTRATION ═══
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const ctxAdmin = await b.newContext({ viewport: { width: 1100, height: 900 } });
await ctxAdmin.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, url: BASE }]);
await ctxAdmin.route("https://tiles.openfreemap.org/**", (r) => (r.request().url().includes("/styles/") ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STYLE) }) : r.abort()));
const admin = await ctxAdmin.newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));
admin.on("dialog", (d) => void d.accept());

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
for (const p of [sam, sansCarte, inconnu]) ok(await sansMotInterdit(p), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
