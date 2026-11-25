// 🎬 MES PROCHES EN DIRECT (le lot F3 du fil, 25 novembre 2026 ; `docs/univers/fil.md`), DANS LE NAVIGATEUR — sur un
// iPhone, contre le faux Supabase et un faux lecteur YouTube.
//
// Léa a ouvert sa séance et Sam est venu. Zoé glisse dans son fil : « Chez Léa, en direct », « Léa et Sam regardent
// ensemble », leurs figurines dans sa pièce ; « 🙋 Demander à les rejoindre » : « Demande envoyée ». Chez Léa, devant sa
// télé : « 🙋 Zoé aimerait vous rejoindre » ; « Lui faire une place ». Zoé revient au fil : « 🛋️ M'asseoir avec eux », et
// elle entre. Chez Léa, au-dessus de la figurine de Zoé qui vient d'arriver : 👋 ; un toucher, et Zoé reçoit le signe.
// Dans un salon ouvert : Zoé touche deux fois l'écran du fil, sa figurine s'assoit à côté de Sam ; Sam lui fait signe :
// « 👋 Sam te fait signe ».
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
await semer("admins", [{ user_id: ADMIN }]);

const qui = (n, prenom) => ({ id: `6f6f6f6f-0000-4000-8000-0000006f50${String(n).padStart(2, "0")}`, jeton: `jeton-proches-en-direct-ecran-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const GENS = [LEA, SAM, ZOE];
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
  await json(`${x.id}/passions.json`, { passions: ["cuisine", "foot"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre.webp`, parle: `${x.id}/neutre.webp`, prete_le: maintenant })));
// (Sam et Zoé sont les proches de Léa, des deux côtés ; sa pièce : le salon)
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, ZOE.id] });
for (const x of [SAM, ZOE]) await json(`${x.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { fond: "#2a4b5c" });
await fetch(`${BASE}/api/cron/decouvrir-selection`);

const ROUTE = "/api/direct/salons-ouverts";
const route = async (x, chemin, corps) => {
  const cookie = `clikme_habitant=${x.jeton}; sb-127-auth-token=base64-${b64(session)}`;
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const CLE_ZOE = (await route(ZOE, "/api/direct/proches")).cle;
const CLE_SAM = (await route(SAM, "/api/direct/proches")).cle;
const e1 = await route(LEA, ROUTE, { action: "entrer-chez", chez: "moi" });
const SEANCE = e1.ouverture?.salon?.id ?? "";
const CLE_LEA = e1.ouverture?.salon?.seance?.cle ?? "";
await route(LEA, ROUTE, { action: "inviter", cles: [CLE_SAM] });
ok((await route(SAM, ROUTE, { action: "entrer-chez", chez: CLE_LEA })).statut === 200 && SEANCE && CLE_ZOE, "Léa a ouvert sa séance, Sam est venu");

// (un faux lecteur de YouTube)
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.style.cssText = "width:100%;height:100%;background:#123"; el.replaceWith(d);
  var self = this, t0 = Date.now(), base = 0, etat = 1;
  self.loadVideoById = function () { t0 = Date.now(); etat = 1; };
  self.playVideo = function () { etat = 1; };
  self.pauseVideo = function () { etat = 2; };
  self.seekTo = function (t) { base = t; t0 = Date.now(); };
  self.getCurrentTime = function () { return etat === 1 ? base + (Date.now() - t0) / 1000 : base; };
  self.getPlayerState = function () { return etat; };
  self.mute = function () {}; self.unMute = function () {}; self.setVolume = function () {}; self.destroy = function () { d.remove(); };
  setTimeout(function () { o.events && o.events.onReady && o.events.onReady({ target: self }); }, 10);
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ouvrir = async (x) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
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

// ═══ ZOÉ, DANS SON FIL : LA SÉANCE CHEZ LÉA ═══
const zoe = await ouvrir(ZOE);
await zoe.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe, "#o-decouvrir");
const carte = zoe.locator('#o-decouvrir [data-piece="seance"]');
ok(await attendre(zoe, async () => (await carte.count()) === 1, 45000), "dans le fil de Zoé : la séance chez Léa");
ok((await zoe.locator("#o-decouvrir [data-piece]").first().getAttribute("data-piece")) === "seance", "… en premier");
ok((await texte(carte.locator(".fd-etiquette"))) === "Chez Léa, en direct" && (await texte(carte.locator("[data-titre-seance]"))) === "Léa et Sam regardent ensemble", `« Chez Léa, en direct », « Léa et Sam regardent ensemble » (${await texte(carte.locator("[data-titre-seance]"))})`);
ok(await attendre(zoe, async () => (await carte.locator(".fd-seance-fig img").count()) === 2 && (await carte.locator(".fd-tele img").count()) === 1), "leurs deux figurines, ce qui passe à sa télé");
await carte.scrollIntoViewIfNeeded();
await zoe.waitForTimeout(600);
await zoe.screenshot({ path: `${D}/proches-en-direct-1-fil.png` });
ok(!(await deborde(zoe)) && (await sansMotInterdit(zoe)), "rien ne déborde, jamais le mot interdit");
ok((await texte(carte.locator("[data-rejoindre]"))) === "🙋 Demander à les rejoindre", "« 🙋 Demander à les rejoindre »");
await carte.locator("[data-rejoindre]").click();
ok(await attendre(zoe, async () => (await carte.getAttribute("data-demande")) === "1" && (await texte(carte.locator("[data-demande-envoyee]"))) === "🙋 Demande envoyée" && /Demande envoyée à Léa/.test(await texte(carte.locator(".fd-bas p")))), "« 🙋 Demande envoyée à Léa »");
await zoe.screenshot({ path: `${D}/proches-en-direct-2-demande.png` });
await zoe.context().close();

// ═══ CHEZ LÉA, DEVANT SA TÉLÉ : LA DEMANDE ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/univers/salons?chez=moi`, { waitUntil: "domcontentloaded" });
const demande = lea.locator("[data-rejoindre-demande]");
ok(await attendre(lea, async () => (await demande.count()) === 1 && (await texte(demande.locator("b"))) === "🙋 Zoé aimerait vous rejoindre", 30000), "chez Léa : « 🙋 Zoé aimerait vous rejoindre »");
ok((await demande.getAttribute("data-rejoindre-demande")) === CLE_ZOE && (await demande.locator("img").count()) === 1, "… avec sa figurine");
await lea.screenshot({ path: `${D}/proches-en-direct-3-demande-chez-lea.png` });
ok(!(await deborde(lea)) && (await sansMotInterdit(lea)), "rien ne déborde, jamais le mot interdit");
await demande.locator("[data-faire-entrer]").click();
ok(await attendre(lea, async () => (await demande.count()) === 0), "« Lui faire une place » : la demande s'en va");
ok(await attendre(lea, async () => /Invitation envoyée à Zoé/.test(await lea.evaluate(() => document.body.innerText)), 5000), "… « Invitation envoyée à Zoé »");
ok(await attendre(lea, async () => (await lea.locator("[data-faire-signe]").count()) === 0, 5000), "Sam était déjà là : pas de 👋 au-dessus de lui");

// ═══ ZOÉ REVIENT AU FIL, ET ENTRE ═══
const zoe2 = await ouvrir(ZOE);
await zoe2.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe2, "#o-decouvrir");
const carte2 = zoe2.locator('#o-decouvrir [data-piece="seance"]');
ok(await attendre(zoe2, async () => (await carte2.getAttribute("data-invite")) === "1" && (await texte(carte2.locator("[data-asseoir-seance]"))) === "🛋️ M’asseoir avec eux", 45000), "son fil : « 🛋️ M'asseoir avec eux »");
await carte2.locator("[data-asseoir-seance]").click();
ok(await attendre(zoe2, async () => new URL(zoe2.url()).pathname === "/univers/salons" && (await zoe2.locator(".so-fig[data-moi]").count()) === 1, 30000), "… elle entre chez Léa");

// ═══ 👋 LÉA LUI FAIT SIGNE, D'UN TOUCHER ═══
const signe = lea.locator("[data-faire-signe]");
ok(await attendre(lea, async () => (await signe.count()) === 1, 15000), "chez Léa : 👋 au-dessus de Zoé, qui vient d'arriver");
const qZoe = await signe.getAttribute("data-faire-signe");
await lea.screenshot({ path: `${D}/proches-en-direct-4-signe.png` });
await signe.click({ force: true }); // (il se balance : jamais « stable » pour Playwright)
ok(await attendre(lea, async () => (await signe.count()) === 0), "un toucher : le signe part (une fois)");
const pZ = (await route(ZOE, `${ROUTE}?salon=${SEANCE}&depuis=0&connus=`)).pouls;
ok(pZ?.messages?.some((m) => m.sorte === "geste" && m.cle === "coucou" && m.a === qZoe && m.prenom === "Léa"), "… Zoé le reçoit : 👋 de Léa, vers elle");
await zoe2.context().close();
await lea.context().close();

// ═══ DANS UN SALON OUVERT, DEPUIS LE FIL : « 👋 SAM TE FAIT SIGNE » ═══
const eSam = await route(SAM, ROUTE, { action: "entrer", theme: "cuisine" });
const SALON = eSam.ouverture?.salon?.id ?? "";
ok(eSam.statut === 200 && SALON, `Sam est dans le salon de la cuisine (${SALON})`);
const zoe3 = await ouvrir(ZOE);
await zoe3.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe3, "#o-decouvrir");
const cuisine = zoe3.locator('#o-decouvrir [data-piece="salon"][data-theme="cuisine"]');
ok(await attendre(zoe3, async () => (await cuisine.count()) === 1 && (await cuisine.getAttribute("data-vide")) === null, 45000), "dans le fil de Zoé : le salon de la cuisine, Sam y est");
await cuisine.scrollIntoViewIfNeeded();
await zoe3.waitForTimeout(800);
await cuisine.locator(".fd-scene").dblclick({ position: { x: 20, y: 20 } });
ok(await attendre(zoe3, async () => /Sam te voit/.test(await texte(zoe3.locator("#o-decouvrir [data-vu-par]")))), "toucher deux fois : sa figurine s'assoit (« Sam te voit »)");
const moiQ = await attendre(zoe3, async () => (await cuisine.locator('.fd-fig:has(small:text-is("Zoé"))').count()) === 1);
const qZoe3 = moiQ ? await cuisine.locator('.fd-fig:has(small:text-is("Zoé"))').getAttribute("data-q") : "";
ok(Boolean(qZoe3), "… elle est dans le gradin");
await new Promise((r) => setTimeout(r, 1600));
ok((await route(SAM, ROUTE, { action: "ecrire", salon: SALON, sorte: "geste", cle: "coucou", a: qZoe3 })).statut === 200, "Sam lui fait signe");
ok(await attendre(zoe3, async () => (await texte(zoe3.locator("#o-decouvrir [data-reaction] b"))) === "👋" && (await texte(zoe3.locator("#o-decouvrir [data-vu-par]"))) === "👋 Sam te fait signe", 20000), "« 👋 Sam te fait signe » (le vrai signe de Sam)");
await zoe3.screenshot({ path: `${D}/proches-en-direct-5-sam-fait-signe.png` });
await zoe3.context().close();

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
