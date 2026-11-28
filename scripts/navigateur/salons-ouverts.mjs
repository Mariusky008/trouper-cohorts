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
import { writeFileSync } from "node:fs";
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
  self.pauseVideo = function () { d.dataset.joue = "0"; };
  window.__ytSalon = o;
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
// (🎙 « Dis-le » : un faux micro — ses bips —, accepté d'office comme dans les autres essais du micro ; la caméra du salon ne
// s'allume que dans une séance, et seulement si on l'a demandée)
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
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
await zoe.goto(`${BASE}/collection?v=${Date.now()}#salons`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe, "#o-salons");
ok(await attendre(zoe, async () => (await zoe.locator("#o-salons [data-salons-age]").count()) === 1, 45000), "Zoé : « as-tu 18 ans ou plus ? » avant les salons");
await zoe.locator("#o-salons [data-salons-age] [data-adulte]").click();
ok(await attendre(zoe, async () => (await zoe.locator("#o-salons [data-salon]").count()) === 12), "« J'ai 18 ans ou plus » : les douze salons");
await zoe.context().close();

// ═══ NOÉ : LES SALONS DES 15-17 ANS ═══
const noe = await ouvrir(NOE);
await noe.goto(`${BASE}/collection?v=${Date.now()}#salons`, { waitUntil: "domcontentloaded" });
await fermerPablito(noe, "#o-salons");
ok(await attendre(noe, async () => (await noe.locator("#o-salons [data-salon]").count()) === 11 && (await noe.locator('#o-salons [data-salon="parents"]').count()) === 0), "Noé (15 ans) : onze salons, sans celui des jeunes parents");
ok(/tu n’y croises jamais d’adulte/.test(await texte(noe.locator("#o-salons .td-salons-chapo"))), "… « les salons des 15-17 ans : tu n'y croises jamais d'adulte »");
await noe.context().close();

// ═══ LÉA : L'ACCUEIL, PUIS LE SALON DU FOOT ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#salons`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-salons");
ok(await attendre(lea, async () => (await lea.locator("#o-salons [data-carte-tele]").count()) === 1), "l'accueil de Découvrir : la carte « Ma télé du jour »");
ok(await attendre(lea, async () => (await lea.locator("#o-salons [data-salon]").count()) === 12), "les douze salons");
const ordre = await lea.locator("#o-salons [data-salon]").evaluateAll((l) => l.map((a) => a.getAttribute("data-salon")));
ok(ordre.slice(0, 3).sort().join() === "animaux,cuisine,foot", `ses passions d'abord (${ordre.slice(0, 3).join(", ")})`);
// (🟢 21 novembre 2026, la maquette B choisie par le propriétaire : la vitrine en direct, puis deux rangées qui défilent)
ok(/^⚽\s*Foot\s*Personne$/.test(await texte(lea.locator('#o-salons [data-salon="foot"]'))), `la carte du foot : un grand émoji, un nom court, « Personne » (${await texte(lea.locator('#o-salons [data-salon="foot"]'))})`);
const fonds = await lea.locator("#o-salons [data-salon]").evaluateAll((l) => l.slice(0, 4).map((a) => getComputedStyle(a.querySelector(".td-salon-haut")).backgroundImage));
ok(fonds.every((f) => /gradient/.test(f)) && new Set(fonds).size === fonds.length, "une couleur par passion (quatre cartes, quatre dégradés)");
ok(/Tes passions/.test(await texte(lea.locator("#o-salons .td-salons"))) && /À découvrir/.test(await texte(lea.locator("#o-salons .td-salons"))), "deux rangées : « Tes passions », « À découvrir »");
const rangee = lea.locator("#o-salons .td-rangee").last();
ok(await rangee.evaluate((r) => getComputedStyle(r).overflowX === "auto" && r.scrollWidth > r.clientWidth + 20), "… « À découvrir » défile de côté");
ok(!(await deborde(lea)), "… sans élargir la page");
const aligne = await rangee.evaluate((r) => ({ carte: r.querySelector("[data-salon]").getBoundingClientRect().left, titre: r.previousElementSibling.getBoundingClientRect().left, bord: r.getBoundingClientRect().right, ecran: window.innerWidth }));
ok(Math.abs(aligne.carte - aligne.titre) < 2 && Math.abs(aligne.bord - aligne.ecran) < 2, `… la première carte sous le titre, la rangée jusqu'au bord de l'écran (${Math.round(aligne.carte)} / ${Math.round(aligne.titre)}, ${Math.round(aligne.bord)} / ${aligne.ecran})`);
const vitrine = lea.locator("#o-salons [data-vitrine]");
ok((await vitrine.count()) === 1 && (await vitrine.getAttribute("data-vitrine")) === "foot", `la vitrine « En direct maintenant » : personne nulle part, sa première passion (${await vitrine.getAttribute("data-vitrine")})`);
ok(/En direct maintenant/.test(await texte(lea.locator("#o-salons .td-direct"))) && /Personne pour l’instant : entre le premier/.test(await texte(vitrine)) && /Entrer/.test(await texte(vitrine)), `… « ${await texte(vitrine)} »`);
ok(/i\.ytimg\.com|youtube/.test(await vitrine.locator(".td-vitrine-tele").evaluate((e) => e.style.backgroundImage)) && /^« .+ »$/.test(await texte(vitrine.locator(".td-vitrine-titre"))), `… sa télé : la vignette et le titre de la vidéo du moment (${await texte(vitrine.locator(".td-vitrine-titre"))})`);
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/salons-ouverts-1-accueil.png`, fullPage: false });
await lea.locator("#o-salons .td-direct").evaluate((e) => e.scrollIntoView({ block: "start" }));
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/salons-ouverts-1b-vitrine.png`, fullPage: false });
// (⚡ 25 novembre 2026, le propriétaire : « un écran complètement inutile qui stipule le thème ») le serveur entre avant
// d'envoyer la page : jamais l'écran du thème, et le téléphone n'a plus à entrer lui-même
const entreesDuTelephone = [];
const compterEntree = (r) => r.method() === "POST" && /salons-ouverts/.test(r.url()) && /"action":"entrer/.test(r.postData() ?? "") && entreesDuTelephone.push(r.url());
lea.on("request", compterEntree);
await lea.addInitScript(() => {
  const vus = (window.__ecranDuTheme = []);
  new MutationObserver(() => document.querySelector(".so-grand, .so[data-etat='chargement']") && vus.push(1)).observe(document, { childList: true, subtree: true });
});
await lea.locator('#o-salons [data-salon="foot"]').click();
await lea.waitForURL(/\/univers\/salons\?theme=foot/);
const salon = lea.locator(".so[data-salon]");
ok(await attendre(lea, async () => (await salon.getAttribute("data-salon")) === "foot-1"), "elle entre : le salon du foot");
lea.off("request", compterEntree);
ok(!(await lea.evaluate(() => window.__ecranDuTheme?.length ?? 0)) && !entreesDuTelephone.length, `⚡ le salon tout de suite : ni l'écran du thème, ni d'entrée faite par le téléphone (${entreesDuTelephone.length})`);
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

// ═══ 📺 (27 novembre 2026) SA VIDÉO, À SON RYTHME : PAUSE, ENTRACTE, SUIVANTE ═══
ok(Number(await lea.locator(".faux-yt").getAttribute("data-debut")) === 0, "sa vidéo commence au début, quand elle arrive (pas à la seconde des autres)");
await lea.locator("[data-ma-pause]").click();
ok(await attendre(lea, async () => (await lea.locator('.so-tele[data-pause="1"]').count()) === 1 && (await lea.locator(".faux-yt").getAttribute("data-joue")) === "0"), "⏸ Pause : sa vidéo s'arrête, pour elle seule");
await lea.locator("[data-ma-pause]").click();
ok(await attendre(lea, async () => (await lea.locator('.so-tele[data-pause="1"]').count()) === 0 && (await lea.locator(".faux-yt").getAttribute("data-joue")) === "1"), "▶ Reprendre");
await lea.evaluate(() => window.__ytSalon.events.onStateChange({ data: 0 }));
ok(await attendre(lea, async () => (await lea.locator("[data-entracte]").count()) === 1, 3000), "finie : l'entracte (on voit que c'en est une autre)");
const entracte = await texte(lea.locator("[data-entracte]"));
const prochaineId = await lea.locator("[data-entracte]").getAttribute("data-entracte");
ok(/C’est fini/.test(entracte) && /À suivre : « /.test(entracte) && /dans \d s/.test(entracte), `« ${entracte} »`);
await lea.locator("[data-ma-suivante]").click();
ok(await attendre(lea, async () => (await lea.locator("[data-entracte]").count()) === 0 && (await lea.locator(".faux-yt").getAttribute("data-yt")) === prochaineId), "⏭ Lancer maintenant : la suivante part");

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
ok(await attendre(lea, async () => (await lea.locator('[data-grand-moment="rire"]').count()) === 1, 4000), "🎆 😂 : son grand moment — sa figurine prend la scène");
ok((await lea.locator(`.so-fig.vedette[data-moi]`).count()) === 1 && (await lea.locator(`.so-piece.so-en-moment`).count()) === 1, "… sa place se vide, la pièce s'assombrit autour d'elle");
ok(/Allez les bleus/.test(await texte(lea.locator("[data-bulle-moment]"))), "… sa bulle : ce qu'elle vient d'écrire");
await lea.locator('[data-reagir] [data-r="rire"]').click();
ok(await attendre(lea, async () => (await lea.locator('[data-grand-moment="rire"][data-niveau="2"] [data-fois="2"]').count()) === 1, 2000), "🎆 touchée encore, vite : ×2 (elle grandit, la pièce tremble)");
// 📸 (lot R3) « Envoyer ce moment » : l'image story de son moment, son adresse
// (maquette « Salon et réactions », validée le 27/11) rien par-dessus pendant son grand moment ; la pastille après
ok((await lea.locator("[data-carte-envoi]").count()) === 0, "📸 pendant son grand moment, rien ne cache sa réaction");
ok(await attendre(lea, async () => (await lea.locator("[data-carte-envoi] [data-envoyer-ce-moment]").count()) === 1, 6000), "📸 à la fin de son grand moment, une petite pastille sous sa figurine");
const carte = await texte(lea.locator("[data-carte-envoi]"));
ok(/Envoyer ta réaction/.test(carte) && /à \d+:\d\d/.test(carte), `… « ${carte} »`);
await lea.screenshot({ path: `${D}/salons-ouverts-3a-carte-envoi.png` });
await lea.locator("[data-envoyer-ce-moment]").click();
ok(await attendre(lea, async () => (await lea.locator("[data-image-moment]").count()) === 1, 20000), `… le serveur fabrique son image (${await texte(lea.locator("[data-envoyer-moment]"))})`);
const lienMoment = (await lea.locator("[data-lien-moment]").getAttribute("data-lien-moment")) ?? "";
ok(/\/moment\/[a-z0-9]{10}$/.test(lienMoment), `… et son adresse (${lienMoment})`);
const imageMoment = await lea.request.get(new URL((await lea.locator("[data-image-moment]").getAttribute("data-image-moment")) ?? "", lienMoment).href);
ok(imageMoment.ok() && /image\/png/.test(imageMoment.headers()["content-type"] ?? ""), "… l'image (PNG, 1080 × 1920)");
ok(/Envoie ta réaction/.test(await texte(lea.locator("[data-envoyer-moment] h2"))) && (await lea.locator("[data-whatsapp]").count()) === 1 && (await lea.locator("[data-story]").count()) === 1 && (await lea.locator("[data-tiktok]").count()) === 1 && (await lea.locator("[data-partager]").count()) === 1 && (await lea.locator("[data-enregistrer]").count()) === 1 && (await lea.locator("[data-copier]").count()) === 1, "… « Envoie ta réaction » : WhatsApp, Story, TikTok, Autre, Enregistrer, Copier le lien");
await lea.screenshot({ path: `${D}/salons-ouverts-3b-envoyer-moment.png` });
// (la vidéo de 4 secondes : le téléphone la fait tout seul pendant qu'on regarde l'image)
await lea.locator("[data-video]").waitFor({ timeout: 30000 });
const typeVideo = (await lea.locator("[data-video]").getAttribute("data-video")) ?? "";
ok(/^video\/(mp4|webm)$/.test(typeVideo) && (await lea.locator("[data-video-prepare]").count()) === 0, `… « Vidéo » est prête (${typeVideo})`);
await lea.locator("[data-format=\"video\"]").click();
ok(await attendre(lea, async () => (await lea.locator("[data-apercu-video]").count()) === 1, 3000), "… un toucher : l'aperçu devient la vidéo");
// (la vidéo elle-même, gardée avec les captures : ce qu'on enverra sur TikTok)
const video64 = await lea.locator("[data-apercu-video]").evaluate(async (v) => {
  const b = await (await fetch(v.src)).blob();
  const o = new Uint8Array(await b.arrayBuffer());
  let x = "";
  for (let i = 0; i < o.length; i += 0x8000) x += String.fromCharCode(...o.subarray(i, i + 0x8000));
  return btoa(x);
});
writeFileSync(`${D}/salons-ouverts-video-reaction.${typeVideo === "video/mp4" ? "mp4" : "webm"}`, Buffer.from(video64, "base64"));
ok(video64.length > 20000, `… la vidéo pèse ${Math.round((video64.length * 3) / 4 / 1000)} Ko`);
await lea.screenshot({ path: `${D}/salons-ouverts-3b-envoyer-video.png` });
// 🎙 « Dis-le » (V2) : trois secondes de sa voix au micro, posées au flash ; rien ne part au serveur
await lea.context().grantPermissions(["microphone"], { origin: BASE });
ok((await texte(lea.locator("[data-dis-le]"))) === "🎙 Dis-le" && /3 s de ta voix, au moment où ta figurine explose/.test(await texte(lea.locator(".em-voix small"))), "🎙 côté « Vidéo » : « Dis-le », « 3 s de ta voix, au moment où ta figurine explose »");
await lea.locator("[data-dis-le]").click();
ok(await attendre(lea, async () => /Parle ! [123] s/.test(await texte(lea.locator("[data-dis-le-micro]"))), 5000), `… un toucher : le micro écoute (« Parle ! 3 s », « ■ C'est dit »)${(await lea.locator("[data-note-voix]").count()) ? ` — ${await texte(lea.locator("[data-note-voix]"))}` : ""}`);
ok(await attendre(lea, async () => (await lea.locator("[data-voix-prepare]").count()) === 1, 6000), "… au bout de 3 s, il s'arrête tout seul : « Ta voix entre dans la vidéo… »");
ok(await attendre(lea, async () => (await lea.locator("[data-apercu-video][data-avec-voix]").count()) === 1, 30000), "… la vidéo refaite, avec sa voix");
const son = await lea.locator("[data-apercu-video]").evaluate(async (v) => {
  try {
    const t = await new OfflineAudioContext(1, 48000, 48000).decodeAudioData(await (await fetch(v.src)).arrayBuffer());
    const d = t.getChannelData(0);
    const pic = (a, z) => {
      let m = 0;
      for (let i = Math.floor(a * t.sampleRate); i < Math.min(d.length, z * t.sampleRate); i++) m = Math.max(m, Math.abs(d[i]));
      return Math.round(m * 1000) / 1000;
    };
    return { duree: Math.round(t.duration * 10) / 10, avant: pic(0, 1.4), apres: pic(1.6, 4.7) };
  } catch (e) {
    return { erreur: String(e) };
  }
});
ok(!son.erreur && son.avant < 0.01 && son.apres > 0.02, `… sa voix est dans la vidéo, au moment du flash : rien avant (${son.avant ?? son.erreur}), sa voix après 1,6 s (${son.apres})`);
ok((await texte(lea.locator("[data-avec-ta-voix]"))) === "Avec ta voix ✓" && (await lea.locator("[data-reecouter]").count()) === 1 && (await lea.locator("[data-recommencer]").count()) === 1 && (await lea.locator("[data-sans-voix]").count()) === 1, "… « Avec ta voix ✓ » : Réécouter, Recommencer, Sans ma voix");
await lea.locator("[data-reecouter]").click({ timeout: 5000 }).catch(() => undefined);
ok(await attendre(lea, async () => lea.locator("[data-apercu-video]").evaluate((v) => !v.muted && !v.paused && !v.loop), 4000), "… « ▶ Réécouter » : la vidéo repart du début, avec le son");
const voix64 = await lea.locator("[data-apercu-video]").evaluate(async (v) => {
  const b = await (await fetch(v.src)).blob();
  const o = new Uint8Array(await b.arrayBuffer());
  let x = "";
  for (let i = 0; i < o.length; i += 0x8000) x += String.fromCharCode(...o.subarray(i, i + 0x8000));
  return { type: b.type, x: btoa(x) };
});
writeFileSync(`${D}/salons-ouverts-video-reaction-voix.${voix64.type.startsWith("video/mp4") ? "mp4" : "webm"}`, Buffer.from(voix64.x, "base64"));
await lea.screenshot({ path: `${D}/salons-ouverts-3c-dis-le.png` });
await lea.locator("[data-sans-voix]").click({ timeout: 5000 }).catch(() => undefined);
ok(await attendre(lea, async () => (await lea.locator("[data-apercu-video]:not([data-avec-voix])").count()) === 1 && (await lea.locator("[data-dis-le]").count()) === 1, 4000), "… « Sans ma voix » : la vidéo muette revient, et « Dis-le »");
// (l'ami qui reçoit le lien : un autre téléphone, sans ClikMe)
const ami = await lea.context().browser().newContext({ viewport: { width: 390, height: 844 } });
const pageMoment = await ami.newPage();
await pageMoment.goto(new URL(new URL(lienMoment).pathname, BASE).href, { waitUntil: "domcontentloaded", timeout: 90000 });
ok(/Léa a réagi à \d+:\d\d/.test(await texte(pageMoment.locator("h1"))) && (await pageMoment.locator("[data-youtube]").getAttribute("href"))?.includes("youtube.com/watch?v="), `la page du moment : « ${await texte(pageMoment.locator("h1"))} », ▶ Voir sur YouTube`);
const ogImage = (await pageMoment.locator('meta[property="og:image"]').first().getAttribute("content")) ?? "";
const apercu = ogImage ? await pageMoment.request.get(new URL(new URL(ogImage).pathname, BASE).href) : null;
const tailleApercu = apercu?.ok() ? (await apercu.body()).length : 0;
// (WhatsApp ne montre pas une image de plus de ~600 Ko : il ne gardait que le texte)
ok(/\/apercu$/.test(ogImage) && /image\/jpeg/.test(apercu?.headers()["content-type"] ?? "") && tailleApercu > 5000 && tailleApercu < 300000, `… et son aperçu (og:image en JPEG, ${Math.round(tailleApercu / 1000)} Ko)`);
await lea.locator(".so-fermer").click();
await lea.waitForTimeout(2200);
const noteEncore = await texte(lea.locator("[data-note]"));
ok(!/Doucement/.test(noteEncore), `… sans « Doucement » : les touchers sont regroupés (${noteEncore})`);
await lea.screenshot({ path: `${D}/salons-ouverts-3-bulles.png` });

// ═══ TOUCHER SAM : SA FICHE, UN GESTE, SIGNALER ═══
// (Sam est entré par la route, sans pouls : un ❤️ garde sa place fraîche pendant la longue partie 📸)
await route(SAM, { action: "ecrire", salon: "foot-1", sorte: "reaction", cle: "coeur" });
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
// (Sam est entré par la route, sans pouls : un ❤️ garde sa place fraîche — l'essai est plus long depuis 📸)
await route(SAM, { action: "ecrire", salon: "foot-1", sorte: "reaction", cle: "coeur" });
const zoe2 = await ouvrir(ZOE);
await zoe2.goto(`${BASE}/collection?v=${Date.now()}#salons`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe2, "#o-salons");
const vit2 = zoe2.locator('#o-salons [data-vitrine="foot"]');
ok(await attendre(zoe2, async () => (await vit2.locator(".td-vitrine-gradin img").count()) === 2 && /2 ici/.test(await texte(vit2)), 30000), `Zoé : la vitrine en direct — le foot, Léa et Sam assis (${await texte(vit2)})`);
ok((await zoe2.locator("#o-salons .td-direct i.vif").count()) === 1 && /2 ici/.test(await texte(zoe2.locator('#o-salons [data-salon="foot"]'))), "… le point vert, et « 2 ici » sur la carte du foot");
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
const barre = await ordi.locator(".so-bas").boundingBox();
const emo = await ordi.locator(".so-reagir button[data-r]").first().boundingBox();
// (🖥️ maquette « Salon sur ordinateur », 27/11 : plus de colonne à droite — la vidéo au centre, la salle dessous, une
// seule barre en bas, centrée : les réactions, les jeux et « Écris au salon » sur la même ligne)
ok(t2 && piece && t2.width >= 639 && t2.width <= 801 && Math.abs(t2.x + t2.width / 2 - 640) < 30 && piece.y >= t2.y + t2.height && piece.y + piece.height <= 862, `la télé (${Math.round(t2?.width ?? 0)} points) au centre, la salle dessous, dans l'écran`);
ok(barre && champ2 && emo && Math.abs(barre.x + barre.width / 2 - 640) < 4 && barre.y + barre.height <= 860 && barre.height < 80 && Math.abs(champ2.y + champ2.height / 2 - (emo.y + emo.height / 2)) < 10, "une seule barre en bas, centrée : les réactions et « Écris au salon » sur la même ligne");
await ordi.screenshot({ path: `${D}/salons-ouverts-6-ordinateur.png` });
ok(!(await deborde(ordi)), "rien ne déborde (ordinateur)");
await ordi.context().close();

// ═══ L'AMI REVOIT LE MOMENT (à la fin : le salon n'attend pas) ═══
await pageMoment.bringToFront();
// (le moment qui se rejoue : la vidéo trois secondes avant, puis sa figurine prend la scène)
await pageMoment.locator("[data-revoir]").waitFor({ timeout: 30000 });
ok((await pageMoment.locator("[data-rejouer=\"attente\"] .rm-fig").count()) === 1, "… « ▶ Revoir le moment », sa figurine assise dessous");
// (la page arrive avant son code : on touche jusqu'à ce que la lecture parte)
for (let i = 0; i < 40 && (await pageMoment.locator("[data-rejouer=\"attente\"]").count()) === 1; i++) {
  await pageMoment.locator("[data-revoir]").click().catch(() => {});
  await pageMoment.waitForTimeout(1500);
}
await pageMoment.locator("[data-grand-moment]").waitFor({ timeout: 20000 });
ok(/Allez les bleus/i.test(await texte(pageMoment.locator("[data-bulle-moment]"))), `… un toucher : à sa seconde, son grand moment rejoue (« ${await texte(pageMoment.locator("[data-bulle-moment]"))} »)`);
await pageMoment.screenshot({ path: `${D}/salons-ouverts-3c-rejouer.png` });
await pageMoment.locator("[data-rejouer=\"fini\"]").waitFor({ timeout: 10000 });
ok(/Léa a réagi à \d+:\d\d/.test(await texte(pageMoment.locator(".rm-legende"))), `… puis « ${await texte(pageMoment.locator(".rm-legende"))} »`);
ok(await pageMoment.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "… rien ne déborde (la page du moment)");
await ami.close();

ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
