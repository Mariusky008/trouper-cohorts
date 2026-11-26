// 🏡 LES MAISONS OUVERTES (le lot F2 du fil, 25 novembre 2026 ; `docs/univers/fil.md`, section 5), DANS LE NAVIGATEUR —
// sur un iPhone, contre le faux Supabase.
//
// Zoé (le foot) a ouvert sa pièce à ceux qui aiment ce qu'elle aime. Léa (le foot aussi) glisse dans son fil : la maison
// de Zoé (« ⚽ Foot et sport, comme toi », « Chez Zoé », sa pièce, sa figurine). « 👋 Lui faire coucou » : « Ta figurine
// est chez Zoé ». Chez Zoé (Ma maison, l'adresse d'essai `/univers/maison`) : la figurine de Léa est dans sa pièce,
// « 👋 Coucou ! », et la carte « Léa te fait coucou » ; « 👋 Lui répondre » : la figurine s'en va. Léa revient : « 👋 Zoé
// t'a répondu ! ». « 🚪 Frapper à sa porte » ouvre sa maison. Sam a frappé chez Léa : en haut du fil, « 🚪 Sam a frappé à
// ta porte », qui ouvre « Messages ».
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { poserPiece } from "../piece-en-hauteur.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);

const qui = (n, prenom) => ({ id: `6f6f6f6f-0000-4000-8000-0000006f30${String(n).padStart(2, "0")}`, jeton: `jeton-maisons-ouvertes-ecran-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const SAM = qui(3, "Sam");
const GENS = [LEA, ZOE, SAM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="240" width="400" height="360" rx="60" fill="#7a3e2a"/><circle cx="200" cy="150" r="140" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/neutre.webp`, assise, "image/png");
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre.webp`, parle: `${x.id}/neutre.webp`, prete_le: maintenant })));
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine"], poids: {}, le: maintenant });
await json(`${ZOE.id}/passions.json`, { passions: ["foot", "series"], poids: {}, le: maintenant });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { fond: "#2a4b5c" });
await fetch(`${BASE}/api/cron/decouvrir-selection`);

const route = async (x, chemin, corps) => {
  const cookie = `clikme_habitant=${x.jeton}; ${COOKIE_ADMIN}`;
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
for (const x of [LEA, ZOE]) await route(x, "/api/direct/ma-piece", { action: "choisir", piece: "salon" });
ok((await route(ZOE, "/api/direct/ma-piece", { action: "visibilite", v: "passions" })).statut === 200, "Zoé a ouvert sa pièce à ceux qui aiment ce qu'elle aime");
const cleLea = (await route(LEA, "/api/direct/ma-piece")).maison?.cle;
ok((await route(SAM, "/api/direct/visites", { action: "frapper", cle: cleLea })).statut === 200, "Sam a frappé chez Léa");

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ouvrir = async (x, admin = false) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }, ...(admin ? [{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }] : [])]);
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  return p;
};
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.first().innerText({ timeout: 8000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));

// ═══ LÉA, DANS SON FIL : LA MAISON DE ZOÉ ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-decouvrir");
const chez = lea.locator('#o-decouvrir [data-piece="maison"]');
ok(await attendre(lea, async () => (await chez.count()) === 1, 45000), "dans le fil de Léa : la maison de Zoé");
ok((await texte(chez.locator(".fd-etiquette"))) === "⚽ Foot et sport, comme toi" && (await texte(chez.locator("h2"))) === "Chez Zoé", `« ⚽ Foot et sport, comme toi », « Chez Zoé » (${await texte(chez.locator(".fd-etiquette"))})`);
ok(/Vous aimez tous les deux : foot/.test(await texte(chez.locator(".fd-bas p"))), "« Vous aimez tous les deux : foot »");
const surprise = lea.locator("[data-surprise]");
ok((await surprise.getAttribute("data-surprise")) === "toc" && (await texte(surprise)) === "🚪 Sam a frappé à ta porte", "en haut : « 🚪 Sam a frappé à ta porte »");
// (☀️ « Quoi de neuf ? », 26 novembre 2026 : sans proche qui a dit son humeur, ceux qui aiment ce qu'elle aime)
const qdn = lea.locator("#o-decouvrir [data-quoi-de-neuf]");
ok((await qdn.count()) === 1 && /Ils aiment ce que tu aimes/.test(await texte(qdn.locator(".qn-tete small"))) && (await texte(qdn.locator("[data-carte] .qn-nom"))) === "Zoé" && (await texte(qdn.locator("[data-carte] .qn-passion"))) === "⚽ Foot, comme toi", "en haut, « Quoi de neuf ? » : Zoé, « ⚽ Foot, comme toi »");
const sp = await surprise.boundingBox();
const titre = await qdn.locator(".qn-tete").boundingBox();
ok(sp && titre && sp.y + sp.height <= titre.y + 1, "… sous la pastille de la surprise, sans la cacher");
await qdn.locator("[data-carte]").click();
const histoire = lea.locator("[data-histoire]");
ok(await attendre(lea, async () => (await histoire.count()) === 1) && (await histoire.locator("[data-geste]").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim()).join("|") === "👋 Coucou|⚽ Allez !|😂 Je ris|👏 Bravo" && ((await histoire.locator("[data-frapper-histoire]").getAttribute("href")) ?? "").startsWith("/univers/chez/"), "toucher Zoé : sa figurine en grand, quatre gestes (👋, « ⚽ Allez ! », 😂, 👏), « Frapper à sa porte »");
ok((await histoire.locator("[data-salon-passion]").getAttribute("href")) === "/univers/salons?theme=foot" && /Le salon du foot/.test(await texte(histoire.locator("[data-salon-passion]"))), `… et le salon de leur passion (« ${await texte(histoire.locator("[data-salon-passion]"))} »)`);
await histoire.locator('[data-geste="coucou"]').click();
ok(await attendre(lea, async () => /C’est parti : Zoé va voir ta figurine/.test(await texte(histoire.locator("[data-geste-parti]")))), "👋 : sa figurine part chez Zoé");
await histoire.locator('[data-geste="bravo"]').click();
ok(await attendre(lea, async () => /👏 C’est parti/.test(await texte(histoire.locator("[data-geste-parti]")))), "👏 Bravo : aussi");
await lea.screenshot({ path: `${D}/maisons-ouvertes-0-quoi-de-neuf.png` });
await histoire.locator("[data-fermer-histoire]").click();
ok(await attendre(lea, async () => (await histoire.count()) === 0), "… « ✕ » la referme");
ok(await attendre(lea, async () => (await chez.getAttribute("data-coucou")) === "envoye" && (await chez.locator("[data-faire-coucou]").count()) === 0), "dans le fil, sa pièce le sait : sa figurine est déjà chez Zoé");
await chez.scrollIntoViewIfNeeded();
await lea.waitForTimeout(600);
ok(await attendre(lea, async () => (await chez.locator(".fd-chez-piece").evaluate((x) => getComputedStyle(x).backgroundImage.includes("/api/direct/salon/fichier/"))) && (await chez.locator(".fd-chez-fig img").count()) >= 1), "sa pièce, sa figurine dedans");
await lea.screenshot({ path: `${D}/maisons-ouvertes-1-fil.png` });
ok(!(await deborde(lea)) && (await sansMotInterdit(lea)), "rien ne déborde, jamais le mot interdit");
ok(/Ta figurine est chez Zoé/.test(await texte(chez.locator(".fd-bas p"))), "« Ta figurine est chez Zoé »");
await chez.locator(".fd-chez-piece").dblclick({ position: { x: 10, y: 10 } });
ok(await attendre(lea, async () => (await texte(lea.locator("[data-reaction] b"))) === "👋"), "toucher deux fois : sa figurine fait coucou");
await lea.screenshot({ path: `${D}/maisons-ouvertes-2-coucou.png` });
ok((await chez.locator("[data-frapper]").getAttribute("href"))?.startsWith("/univers/chez/"), "« 🚪 Frapper à sa porte » mène chez elle");
await lea.context().close();

// ═══ CHEZ ZOÉ : LA FIGURINE DE LÉA ═══
const zoe = await ouvrir(ZOE, true);
await zoe.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const fig = zoe.locator("[data-coucou-de]");
const carte = zoe.locator("[data-coucou-carte]");
ok(await attendre(zoe, async () => (await fig.count()) === 1 && (await fig.locator("img").evaluate((i) => i.complete && i.naturalWidth > 0)), 30000), "chez Zoé : la figurine de Léa est dans sa pièce");
ok((await texte(fig.locator(".mmc-coucou-bulle"))) === "👏 Bravo !" && /Léa te fait coucou/.test(await texte(carte)), `son dernier geste dans une bulle (« ${await texte(fig.locator(".mmc-coucou-bulle"))} »), et la carte « Léa te fait coucou »`);
await zoe.screenshot({ path: `${D}/maisons-ouvertes-3-chez-zoe.png` });
ok(!(await deborde(zoe)) && (await sansMotInterdit(zoe)), "rien ne déborde, jamais le mot interdit");
await carte.locator("[data-coucou-repondre]").click();
ok(await attendre(zoe, async () => (await fig.count()) === 0 && (await carte.count()) === 0 && /Léa voit ta réponse/.test(await texte(zoe.locator("[data-coucou-fait]")))), "« 👋 Lui répondre » : « Léa voit ta réponse », sa figurine s'en va");
await zoe.context().close();

// ═══ LÉA REVIENT ═══
const lea2 = await ouvrir(LEA);
await lea2.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea2, "#o-decouvrir");
const chez2 = lea2.locator('#o-decouvrir [data-piece="maison"]');
ok(await attendre(lea2, async () => (await chez2.getAttribute("data-coucou")) === "repondu" && (await texte(chez2.locator("[data-repondu]"))) === "👋 Zoé t’a répondu !", 45000), "dans son fil : « 👋 Zoé t'a répondu ! » (sa vraie réponse)");
await lea2.locator("[data-surprise]").click();
ok(await attendre(lea2, async () => new URL(lea2.url()).hash === "#proches"), "« 🚪 Sam a frappé à ta porte » ouvre « Messages »");
await lea2.context().close();

// (sa maison se referme : les essais suivants ne la trouvent pas dans leur fil)
await route(ZOE, "/api/direct/ma-piece", { action: "visibilite", v: "proches" });
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
