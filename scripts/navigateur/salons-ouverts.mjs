// 🛋️ LES SALONS OUVERTS, À L'ÉCRAN (les lots D3 et D4 de Découvrir, `docs/univers/decouvrir.md` section 18) — sur un
// iPhone, puis un ordinateur, contre le faux Supabase, le faux YouTube et un faux lecteur de YouTube.
//
// Zoé (son âge pas encore dit) : « as-tu 18 ans ou plus ? » d'abord, puis les salons. Noé (15 ans) : les salons des
// 15-17 ans, sans celui des jeunes parents. Léa : l'accueil de Découvrir (la carte de sa télé, les salons, ses passions
// d'abord) ; elle entre dans le salon du foot : son nom, « 1 ici · 7 places libres », la télé du salon en grand (« ▶
// Allumer » : la vidéo du moment, la même pour tous), la pièce, sa figurine (« Toi »). Sam entre (par la route) : sa
// figurine s'assoit ; il écrit : sa bulle. Léa écrit un snap : « Ce message ne part pas » ; « Allez ! » : sa bulle.
// 😂 : la réaction saute. Toucher Sam : son prénom, « prénom et figurine seulement » ; 👋 : le geste vole. « 🚩 Signaler »
// : quatre motifs, « Merci, c'est signalé ». 💬 : la conversation (avant ton arrivée, depuis). « 🙈 Ne plus voir » :
// Sam s'efface. Sur un ordinateur : la télé et la pièce, centrées. Rien ne déborde, jamais le mot « exemple », aucune
// erreur.
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `5b5b5b5b-0000-4000-8000-0000005b10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-ouverts-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const NOE = qui(3, "Noé");
const ZOE = qui(4, "Zoé");
const GENS = [LEA, SAM, NOE, ZOE];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
for (const x of [LEA, SAM]) await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
await json(`${NOE.id}/majeur.json`, { age: 15, adulte: false, le: maintenant });
for (const x of GENS) await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
// (le décor du salon du foot : le salon du catalogue)
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée");

const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.dataset.debut = (o.playerVars && o.playerVars.start) || 0; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this;
  self.loadVideoById = function (x) { d.dataset.yt = x.videoId || x; };
  self.playVideo = function () { d.dataset.joue = "1"; };
  self.mute = function () { d.dataset.muet = "1"; };
  self.unMute = function () { d.dataset.muet = ""; };
  self.setVolume = function () {};
  self.destroy = function () { d.remove(); };
  setTimeout(function () { o.events && o.events.onReady && o.events.onReady({ target: self }); }, 10);
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ouvrir = async (x, o = {}) => {
  const ctx = await b.newContext(o.ordinateur ? { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
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
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const route = async (x, corps) => (await fetch(`${BASE}/api/direct/salons-ouverts`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) })).json();
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);

// ═══ ZOÉ : SON ÂGE D'ABORD ═══
const zoe = await ouvrir(ZOE);
await zoe.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe, "#o-decouvrir");
ok(await attendre(zoe, async () => (await zoe.locator("#o-decouvrir [data-salons-age]").count()) === 1, 45000), "Zoé : « as-tu 18 ans ou plus ? » avant les salons");
await zoe.locator("#o-decouvrir [data-salons-age] [data-adulte]").click();
ok(await attendre(zoe, async () => (await zoe.locator("#o-decouvrir [data-salon]").count()) === 12), "« J'ai 18 ans ou plus » : les douze salons");
await zoe.context().close();

// ═══ NOÉ : LES SALONS DES 15-17 ANS ═══
const noe = await ouvrir(NOE);
await noe.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(noe, "#o-decouvrir");
ok(await attendre(noe, async () => (await noe.locator("#o-decouvrir [data-salon]").count()) === 11 && (await noe.locator('#o-decouvrir [data-salon="parents"]').count()) === 0), "Noé (15 ans) : onze salons, sans celui des jeunes parents");
ok(/tu n’y croises jamais d’adulte/.test(await texte(noe.locator("#o-decouvrir .td-salons-chapo"))), "… « les salons des 15-17 ans : tu n'y croises jamais d'adulte »");
await noe.context().close();

// ═══ LÉA : L'ACCUEIL, PUIS LE SALON DU FOOT ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-decouvrir");
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir [data-carte-tele]").count()) === 1), "l'accueil de Découvrir : la carte « Ma télé du jour »");
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir [data-salon]").count()) === 12), "les douze salons");
const ordre = await lea.locator("#o-decouvrir [data-salon]").evaluateAll((l) => l.map((a) => a.getAttribute("data-salon")));
ok(ordre.slice(0, 3).sort().join() === "animaux,cuisine,foot", `ses passions d'abord (${ordre.slice(0, 3).join(", ")})`);
// (🟢 21 novembre 2026, la maquette B choisie par le propriétaire : la vitrine en direct, puis deux rangées qui défilent)
ok(/^⚽\s*Foot\s*Personne$/.test(await texte(lea.locator('#o-decouvrir [data-salon="foot"]'))), `la carte du foot : un grand émoji, un nom court, « Personne » (${await texte(lea.locator('#o-decouvrir [data-salon="foot"]'))})`);
const fonds = await lea.locator("#o-decouvrir [data-salon]").evaluateAll((l) => l.slice(0, 4).map((a) => getComputedStyle(a.querySelector(".td-salon-haut")).backgroundImage));
ok(fonds.every((f) => /gradient/.test(f)) && new Set(fonds).size === fonds.length, "une couleur par passion (quatre cartes, quatre dégradés)");
ok(/Tes passions/.test(await texte(lea.locator("#o-decouvrir .td-salons"))) && /À découvrir/.test(await texte(lea.locator("#o-decouvrir .td-salons"))), "deux rangées : « Tes passions », « À découvrir »");
const rangee = lea.locator("#o-decouvrir .td-rangee").last();
ok(await rangee.evaluate((r) => getComputedStyle(r).overflowX === "auto" && r.scrollWidth > r.clientWidth + 20), "… « À découvrir » défile de côté");
ok(!(await deborde(lea)), "… sans élargir la page");
const aligne = await rangee.evaluate((r) => ({ carte: r.querySelector("[data-salon]").getBoundingClientRect().left, titre: r.previousElementSibling.getBoundingClientRect().left, bord: r.getBoundingClientRect().right, ecran: window.innerWidth }));
ok(Math.abs(aligne.carte - aligne.titre) < 2 && Math.abs(aligne.bord - aligne.ecran) < 2, `… la première carte sous le titre, la rangée jusqu'au bord de l'écran (${Math.round(aligne.carte)} / ${Math.round(aligne.titre)}, ${Math.round(aligne.bord)} / ${aligne.ecran})`);
const vitrine = lea.locator("#o-decouvrir [data-vitrine]");
ok((await vitrine.count()) === 1 && (await vitrine.getAttribute("data-vitrine")) === "foot", `la vitrine « En direct maintenant » : personne nulle part, sa première passion (${await vitrine.getAttribute("data-vitrine")})`);
ok(/En direct maintenant/.test(await texte(lea.locator("#o-decouvrir .td-direct"))) && /Personne pour l’instant : entre le premier/.test(await texte(vitrine)) && /Entrer/.test(await texte(vitrine)), `… « ${await texte(vitrine)} »`);
ok(/i\.ytimg\.com|youtube/.test(await vitrine.locator(".td-vitrine-tele").evaluate((e) => e.style.backgroundImage)) && /^« .+ »$/.test(await texte(vitrine.locator(".td-vitrine-titre"))), `… sa télé : la vignette et le titre de la vidéo du moment (${await texte(vitrine.locator(".td-vitrine-titre"))})`);
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/salons-ouverts-1-accueil.png`, fullPage: false });
await lea.locator("#o-decouvrir .td-direct").evaluate((e) => e.scrollIntoView({ block: "start" }));
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/salons-ouverts-1b-vitrine.png`, fullPage: false });
await lea.locator('#o-decouvrir [data-salon="foot"]').click();
await lea.waitForURL(/\/univers\/salons\?theme=foot/);
const salon = lea.locator(".so[data-salon]");
ok(await attendre(lea, async () => (await salon.getAttribute("data-salon")) === "foot-1"), "elle entre : le salon du foot");
ok(/⚽ Le salon du foot/.test(await texte(lea.locator("[data-nom]"))) && /1 ici · 7 places libres · 8 places/.test(await texte(lea.locator("[data-places]"))), `« ${await texte(lea.locator("[data-nom]"))} », « ${await texte(lea.locator("[data-places]"))} »`);
ok(await attendre(lea, async () => (await lea.locator('.so-fig[data-moi] img').evaluate((i) => i.complete && i.naturalWidth > 0)) === true && /Toi/.test(await texte(lea.locator(".so-fig[data-moi]")))), "sa figurine, dans la pièce : « Toi »");
// (🎭 21 novembre 2026, « comme la photo 2 » : plus jamais la pièce — sans décor validé, le fond sombre et les places du plan)
ok((await lea.locator('.so-piece[data-gradin="plan"]').count()) === 1 && (await lea.locator(".so-pano").count()) === 0 && (await lea.locator(".so-libre").count()) === 7, "le salon en gradin, comme l'essai du visage (sans décor validé : le fond sombre, sept places qui brillent)");
const figL = await lea.locator(".so-fig[data-moi]").boundingBox();
ok(figL && figL.height > 80, `… sa figurine en grand, au premier rang (${Math.round(figL?.height ?? 0)} pt)`);
ok(/on ne voit que ton prénom et ta figurine/.test(await texte(lea.locator("[data-note]"))), "« Tu t'assois. Ici, on ne voit que ton prénom et ta figurine. »");
const tele = await lea.locator(".so-tele").boundingBox();
ok(tele && Math.abs(tele.width - 390) < 2 && Math.abs(tele.height - (390 * 9) / 16) < 2, `la télé du salon en grand écran (${Math.round(tele?.width ?? 0)} × ${Math.round(tele?.height ?? 0)})`);
const avant = await lea.locator(".so-tele").getAttribute("data-tele");
// (🔊 21 novembre 2026 : plus de « ▶ Allumer » — la vidéo part toute seule, en silence ; un toucher met le son)
ok((await lea.locator("[data-allumer]").count()) === 0, "plus de bouton « ▶ Allumer »");
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-yt")) === avant && (await lea.locator(".faux-yt").getAttribute("data-joue")) === "1" && (await lea.locator(".faux-yt").getAttribute("data-muet")) === "1"), `la vidéo du moment part toute seule, en silence (${avant})`);
ok(/Touche pour le son/.test(await texte(lea.locator("[data-son-bouton]"))), "« 🔊 Touche pour le son »");
await lea.screenshot({ path: `${D}/salons-ouverts-2-entree.png` });
await lea.locator("[data-son-bouton]").click();
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-muet")) === "" && (await lea.locator(".so-tele").getAttribute("data-son")) === "1" && !/Touche pour le son/.test(await texte(lea.locator(".so-tele")))), "un toucher : le son (l'étiquette s'en va)");

// ═══ SAM ENTRE, IL ÉCRIT ═══
const s = await route(SAM, { action: "entrer", theme: "foot" });
const S = s.ouverture?.moi;
ok(await attendre(lea, async () => (await lea.locator(`.so-fig[data-q="${S}"]`).count()) === 1, 12000), "Sam entre : sa figurine s'assoit (le pouls)");
ok(/2 ici · 6 places libres/.test(await texte(lea.locator("[data-places]"))), "« 2 ici · 6 places libres »");
await route(SAM, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Bonsoir tout le monde 👋" });
ok(await attendre(lea, async () => /Bonsoir tout le monde/.test(await texte(lea.locator(`.so-bulle[data-bulle="${S}"]`))), 12000), "il écrit : sa bulle, au-dessus de sa figurine");

// ═══ LÉA ÉCRIT, RÉAGIT ═══
const champ = lea.locator(".so-ecrire input");
await champ.fill("mon snap c’est lea_du_40");
await lea.locator(".so-ecrire button").click();
ok(await attendre(lea, async () => /Ce message ne part pas : un réseau social ne part pas ici/.test(await texte(lea.locator("[data-refus]"))), 4000), "un réseau social : « Ce message ne part pas »");
ok((await lea.locator(`.so-bulle[data-bulle]`).filter({ hasText: "snap" }).count()) === 0, "… rien n'est parti");
await champ.fill("Allez les bleus !");
await lea.locator(".so-ecrire button").click();
ok(await attendre(lea, async () => /Allez les bleus/.test(await texte(lea.locator(".so-bulle").filter({ hasText: "Allez" })))), "« Allez les bleus ! » : sa bulle");
await lea.waitForTimeout(1700);
await lea.locator('[data-reagir] [data-r="rire"]').click();
ok(await attendre(lea, async () => (await lea.locator(".so-pop").count()) >= 1, 4000), "😂 : la réaction saute au-dessus de sa figurine");
await lea.screenshot({ path: `${D}/salons-ouverts-3-bulles.png` });

// ═══ TOUCHER SAM : SA FICHE, UN GESTE, SIGNALER ═══
await lea.waitForTimeout(1700);
await lea.locator(`.so-fig[data-q="${S}"]`).click();
const fiche = lea.locator(`[data-fiche="${S}"]`);
ok(await attendre(lea, async () => /Sam/.test(await texte(fiche)) && /prénom et figurine seulement/.test(await texte(fiche))), "toucher Sam : son prénom, « prénom et figurine seulement »");
await lea.screenshot({ path: `${D}/salons-ouverts-4-fiche.png` });
await lea.locator('[data-geste="coucou"]').click();
ok(await attendre(lea, async () => (await lea.locator(`.so-vol`).count()) >= 1, 4000), "👋 Coucou : le geste vole jusqu'à lui");
await lea.waitForTimeout(800);
await lea.locator(`.so-fig[data-q="${S}"]`).click();
await lea.locator("[data-signaler]").click();
ok((await lea.locator("[data-motif]").count()) === 4, "🚩 Signaler : quatre motifs");
await lea.locator("[data-motif]").first().click();
ok(await attendre(lea, async () => /Merci, c’est signalé/.test(await texte(lea.locator("[data-note]"))), 5000), "« Merci, c'est signalé »");

// ═══ 💬 LA CONVERSATION, NE PLUS VOIR ═══
await lea.locator("[data-conversation]").click();
const conv = lea.locator("[data-conv]");
ok(await attendre(lea, async () => /Depuis que tu es là/i.test(await texte(conv)) && /Bonsoir tout le monde/.test(await texte(conv)) && /Allez les bleus/.test(await texte(conv))), `💬 la conversation du salon : avant ton arrivée, depuis (${(await texte(conv)).slice(0, 160)})`);
await lea.screenshot({ path: `${D}/salons-ouverts-5-conversation.png` });
await lea.locator(".so-fermer").click();
await lea.locator(`.so-fig[data-q="${S}"]`).click();
await lea.locator("[data-ne-plus-voir]").click();
ok(await attendre(lea, async () => (await lea.locator(`.so-fig.cache[data-q="${S}"]`).count()) === 1 && /Tu ne verras plus les bulles de Sam/.test(await texte(lea.locator("[data-note]")))), "🙈 Ne plus voir : Sam s'efface");

ok(!(await deborde(lea)), "rien ne déborde (iPhone)");
ok(!/exemple/i.test(await lea.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");

// ═══ 🟢 ZOÉ, PENDANT CE TEMPS : LA VITRINE EN DIRECT ═══
const zoe2 = await ouvrir(ZOE);
await zoe2.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe2, "#o-decouvrir");
const vit2 = zoe2.locator('#o-decouvrir [data-vitrine="foot"]');
ok(await attendre(zoe2, async () => (await vit2.locator(".td-vitrine-gradin img").count()) === 2 && /2 ici/.test(await texte(vit2)), 30000), `Zoé : la vitrine en direct — le foot, Léa et Sam assis (${await texte(vit2)})`);
ok((await zoe2.locator("#o-decouvrir .td-direct i.vif").count()) === 1 && /2 ici/.test(await texte(zoe2.locator('#o-decouvrir [data-salon="foot"]'))), "… le point vert, et « 2 ici » sur la carte du foot");
await vit2.evaluate((e) => e.scrollIntoView({ block: "center" }));
await zoe2.waitForTimeout(500);
await zoe2.screenshot({ path: `${D}/salons-ouverts-1c-vitrine-en-direct.png` });
await zoe2.context().close();
await lea.context().close();

// ═══ SUR UN ORDINATEUR ═══
const ordi = await ouvrir(SAM, { ordinateur: true });
await ordi.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
ok(await attendre(ordi, async () => (await ordi.locator(".so-fig").count()) >= 1), "sur un ordinateur : le salon");
await ordi.waitForTimeout(600);
const t2 = await ordi.locator(".so-tele").boundingBox();
const piece = await ordi.locator(".so-piece").boundingBox();
const champ2 = await ordi.locator(".so-ecrire input").boundingBox();
ok(t2 && piece && champ2 && t2.width <= 681 && piece.y + piece.height <= 862 && champ2.x > piece.x + piece.width, `la télé (${Math.round(t2?.width ?? 0)} points) et la pièce tiennent dans l'écran ; écrire, à côté`);
await ordi.screenshot({ path: `${D}/salons-ouverts-6-ordinateur.png` });
ok(!(await deborde(ordi)), "rien ne déborde (ordinateur)");
await ordi.context().close();

ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
