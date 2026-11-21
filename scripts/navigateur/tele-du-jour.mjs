// 📺 MA TÉLÉ DU JOUR, À L'ÉCRAN (le lot D1 de Découvrir, `docs/univers/decouvrir.md` section 15) — sur un iPhone,
// contre le faux Supabase, le faux YouTube (la sélection de la nuit) et un faux lecteur de YouTube (rien ne part chez
// Google ; les vignettes non plus).
//
// Noé, sans passions : « Tes passions » d'abord. Léa (le foot, la cuisine, les animaux ; sa pièce, le hangar) : la télé
// en grand écran, toute la largeur, en 16/9 ; sa pièce et sa figurine dessous ; « 🎬 40 vidéos t'attendent », le thème,
// le titre, la chaîne, la durée. « ▶ Allumer la télé » : le lecteur de YouTube, la première vidéo. « ⏭ Suivante » (à 3
// secondes) : la deuxième, dans le même lecteur ; son thème descend. Finie : la suivante arrive toute seule, son thème
// monte. 📌 Garder : « Gardée : elle est à la télé de ta maison », puis « Déjà chez toi ». 📤 Envoyer à… : Sam, son
// proche ; un toucher : « Envoyée à Sam » — sur la télé de leur duo. 🛋️ Voir la pièce : la vidéo dans la télé de la
// pièce ; ⛶ Grand écran : elle en ressort. 🔥 L'onglet « Découvrir » de l'appli (le lot D1b) : c'est elle, sous la barre
// du haut, sans déborder ; la note passe au-dessus du menu. Rien ne déborde, jamais le mot « exemple », aucune erreur.
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
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
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const qui = (n, prenom) => ({ id: `d1d1d1d1-0000-4000-8000-0000000e10${String(n).padStart(2, "0")}`, jeton: `jeton-tele-du-jour-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const NOE = qui(3, "Noé");
const GENS = [LEA, SAM, NOE];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
// (leurs figurines : celle de l'appli, et celle du nouveau style, assise — Ma maison la pose dans la pièce)
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${LEA.id}/majeur.json`, { age: 34, adulte: true, le: maintenant });
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
// (sa pièce : le hangar, sa télé relevée)
await poserPiece(deposer, "hangar", { le: maintenant });
const choisie = await fetch(`${BASE}/api/direct/ma-piece`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}; ${COOKIE_ADMIN}` }, body: JSON.stringify({ action: "choisir", piece: "hangar" }) });
ok(choisie.ok, `sa pièce : le hangar (${choisie.status})`);
// (la nuit passe : la sélection du jour)
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée");

// ─── un faux lecteur de YouTube : il dit quelle vidéo il passe (`data-yt`), et se commande d'ici ───
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this; self.o = o; self.t = 3;
  self.loadVideoById = function (id) { d.dataset.yt = id; };
  self.getCurrentTime = function () { return self.t; };
  self.playVideo = function () { d.dataset.joue = "1"; };
  self.unloadModule = function () {};
  self.destroy = function () { d.remove(); };
  window.__lecteur = self;
  setTimeout(function () { o.events && o.events.onReady && o.events.onReady({ target: self }); }, 10);
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const telephone = async (x) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
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
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const poids = async (x) => (await lire(`${x.id}/passions.json`))?.poids ?? {};

// ═══ NOÉ, SANS PASSIONS : « TES PASSIONS » D'ABORD ═══
const noe = await telephone(NOE);
await noe.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
ok(await attendre(noe, async () => (await noe.locator("[data-passion]").count()) > 0), "sans passions : « Tes passions » d'abord");

// ═══ LÉA : LA TÉLÉ EN GRAND ÉCRAN ═══
const lea = await telephone(LEA);
await lea.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
const main = lea.locator(".td");
ok(await attendre(lea, async () => Boolean(await main.getAttribute("data-video"))), "sa télé du jour s'ouvre");
ok(/^1 sur 40 · /.test(await texte(lea.locator("[data-compte]"))) && /🏠 Ma télé/.test(await texte(lea.locator(".td-barre"))), `la barre comme la maquette : « 🏠 Ma télé », « ${await texte(lea.locator("[data-compte]"))} »`);
ok((await lea.locator(".td-barre [data-dit]").count()) === 1 && (await texte(lea.locator(".td-barre [data-chez-moi]"))) === "👥 Inviter", "… 💬 et « 👥 Inviter »");
const enGrand = async () => {
  const e = await lea.locator(".td-ecran").boundingBox();
  return Boolean(e && Math.abs(e.width - 390) < 2 && Math.abs(e.height - (390 * 9) / 16) < 2);
};
ok(await attendre(lea, enGrand, 5000), "en grand écran : toute la largeur, en 16/9");
const ecran = await lea.locator(".td-ecran").boundingBox();
ok(ecran && Math.abs(ecran.width - 390) < 2, `en grand écran : toute la largeur, en 16/9 (${Math.round(ecran?.width ?? 0)} × ${Math.round(ecran?.height ?? 0)})`);
ok((await lea.locator(".td-piece[data-piece='hangar'] .td-pano").count()) === 1 && (await lea.locator(".td-piece .td-figurine").count()) === 1, "dessous, sa pièce (le hangar) et sa figurine");
ok(await attendre(lea, async () => (await lea.locator(".td-piece .td-figurine").evaluate((i) => i.complete && i.naturalWidth > 0)) === true), "… sa figurine est là");
const premiere = await main.getAttribute("data-video");
ok((await texte(lea.locator("[data-titre]"))).length > 3 && /\d+:\d\d/.test(await texte(lea.locator(".td-chaine"))) && (await lea.locator("[data-theme]").count()) === 1, "sur la télé éteinte : le titre, la chaîne, la durée ; le thème dans la barre");
ok((await lea.locator("[data-ligne-temps]").count()) === 1 && (await lea.locator("[data-commandes] [data-suivante]").count()) === 1 && /ou touche la pièce/.test(await texte(lea.locator("[data-rangee]"))), "dessous, comme la maquette : la ligne du temps, « Réagis … ou touche la pièce », les commandes");
ok(/en parle/.test(await texte(lea.locator("[data-lien-salon]"))) && (await lea.locator("[data-ecrire] [data-micro]").count()) === 1, `« ${await texte(lea.locator("[data-lien-salon]"))} » ; la saisie et son 🎙️`);
ok((await lea.locator("[data-allumer]").count()) === 1, "« ▶ Allumer la télé »");
await lea.screenshot({ path: `${D}/tele-du-jour-1.png` });

// ═══ ▶ ALLUMER, ⏭ SUIVANTE, FINIE ═══
await lea.locator("[data-allumer]").click();
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-yt")) === premiere), "le lecteur de YouTube passe la première vidéo");
const themePremiere = await lea.locator("[data-theme]").getAttribute("data-theme");
await lea.locator("[data-suivante]").click();
ok(await attendre(lea, async () => (await main.getAttribute("data-video")) !== premiere), "« ⏭ Suivante » : la deuxième");
const deuxieme = await main.getAttribute("data-video");
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-yt")) === deuxieme), "… dans le même lecteur");
ok(await attendre(lea, async () => (await poids(LEA))[themePremiere] === -1), `passée à 3 secondes : son thème descend (${themePremiere})`);
const themeDeuxieme = await lea.locator("[data-theme]").getAttribute("data-theme");
await lea.evaluate(() => window.__lecteur.o.events.onStateChange({ data: 0 }));
ok(await attendre(lea, async () => (await main.getAttribute("data-video")) !== deuxieme), "finie : la suivante arrive toute seule");
ok(await attendre(lea, async () => (await poids(LEA))[themeDeuxieme] === 1 || (themeDeuxieme === themePremiere && (await poids(LEA))[themeDeuxieme] === 0)), `… son thème monte (${themeDeuxieme})`);
ok(/^3 sur 40 · /.test(await texte(lea.locator("[data-compte]"))), `« ${await texte(lea.locator("[data-compte]"))} »`);

// ═══ 📌 GARDER ═══
await lea.locator("[data-garder]").click();
ok(await attendre(lea, async () => /Gardée : elle est à la télé de ta maison/.test(await texte(lea.locator("[data-note]"))), 20000), "📌 Garder : « Gardée : elle est à la télé de ta maison »");
ok((await texte(lea.locator("[data-garder]"))).includes("Déjà chez toi") && (await lea.locator("[data-garder]").isDisabled()), "… puis « Déjà chez toi »");

// ═══ 📤 ENVOYER À… ═══
const envoyee = await main.getAttribute("data-video");
await lea.locator("[data-envoyer]").click();
const sam = lea.locator(`[data-proche="${SAM.cle}"]`);
ok(await attendre(lea, async () => (await sam.count()) === 1), "📤 Envoyer à… : Sam, son proche");
await lea.screenshot({ path: `${D}/tele-du-jour-2-envoyer.png` });
await sam.click();
ok(await attendre(lea, async () => /Envoyée à Sam : elle passe sur votre télé/.test(await texte(lea.locator("[data-note]")))), "un toucher : « Envoyée à Sam : elle passe sur votre télé »");
const chezSam = await (await fetch(`${BASE}/api/direct/tele?avec=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } })).json();
ok(chezSam.programme?.sorte === "youtube" && chezSam.programme.id === envoyee, "… elle passe sur la télé de leur duo, chez Sam");

// ═══ 🛋️ VOIR LA PIÈCE, ⛶ GRAND ÉCRAN ═══
await lea.locator("[data-bascule]").click();
ok(await attendre(lea, async () => (await main.getAttribute("data-mode")) === "piece"), "🛋️ Voir la pièce : la vidéo dans la télé de la pièce");
await lea.waitForTimeout(500);
const petite = await lea.locator(".td-ecran").boundingBox();
ok(petite && petite.width < 300 && (await lea.locator(".faux-yt").count()) === 1, `… plus petite (${Math.round(petite?.width ?? 0)} points), le même lecteur`);
await lea.screenshot({ path: `${D}/tele-du-jour-3-piece.png` });
await lea.locator("[data-bascule]").click();
ok(await attendre(lea, async () => (await main.getAttribute("data-mode")) === "grand" && (await enGrand())), "⛶ Grand écran : elle en ressort, toute la largeur");

// ═══ 🔥 L'ONGLET « DÉCOUVRIR » DE L'APPLI (le lot D1b) : SA TÉLÉ DU JOUR ═══
await lea.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-decouvrir");
// (🧭 le lot D1c : l'onglet s'ouvre sur l'accueil — la carte « Ma télé du jour », les salons ouverts)
const carte = lea.locator("#o-decouvrir [data-carte-tele]");
ok(await attendre(lea, async () => (await carte.count()) === 1 && /vidéos t’attendent/.test(await texte(carte)) && /Ta télé est allumée/.test(await texte(carte))), `l'accueil de Découvrir : la carte « Ma télé du jour » (${await texte(carte)})`);
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir .td-carte-pano").evaluate((i) => i.complete && i.naturalWidth > 0)) === true && (await lea.locator("#o-decouvrir .td-carte-fig").count()) === 1), "… sa pièce et sa figurine dans la vignette");
ok(/Regarde tes vidéos avec ceux que tu aimes/.test(await texte(lea.locator("#o-decouvrir .td-slogan"))), "la phrase de ClikMe");
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir [data-salon]").count()) === 12), "les salons ouverts : douze, ses passions d'abord");
await lea.screenshot({ path: `${D}/tele-du-jour-4a-accueil.png` });
await carte.click();
// (⭐ le lot B, 21 novembre 2026 : « Ma télé du jour » est mon salon à quatre places — la carte y mène)
await lea.waitForURL(/\/univers\/salons\?chez=moi/);
ok(await attendre(lea, async () => /^chez-/.test((await lea.locator(".so[data-salon]").getAttribute("data-salon")) ?? "") && (await lea.locator(".so[data-salon]").getAttribute("data-hote")) === "1" && /4 places/.test(await texte(lea.locator("[data-places]")))), "« ▶ Regarder » : son salon à quatre places (elle en est l'hôte)");
// (l'écran d'avant — celui des notifications « revois-la avec ses réactions » — par son adresse)
await lea.goto(`${BASE}/collection?tele=${premiere}&v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-decouvrir");
const onglet = lea.locator("#o-decouvrir .td.onglet");
ok(await attendre(lea, async () => Boolean(await onglet.getAttribute("data-video").catch(() => ""))), "l'onglet « Découvrir » : sa télé du jour");
const tailles = await lea.evaluate(() => {
  const e = document.querySelector("#o-decouvrir .td-ecran")?.getBoundingClientRect();
  const s = document.querySelector("#o-decouvrir .td-scene")?.getBoundingClientRect();
  return { e: e ? Math.round(e.width) : 0, s: s ? Math.round(s.width) : 0, ratio: e ? e.width / Math.max(1, e.height) : 0, td: getComputedStyle(document.querySelector("#o-decouvrir .td")).minHeight };
});
ok(tailles.e > 300 && tailles.e === tailles.s && Math.abs(tailles.ratio - 16 / 9) < 0.05 && tailles.td === "0px", `en grand écran dans l'onglet, toute la largeur (${tailles.e} points, 16/9), sans prendre tout l'écran`);
await lea.locator("#o-decouvrir [data-garder]").click();
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir [data-note]").count()) === 1), "la note s'affiche");
const auDessus = await lea.evaluate(() => {
  const n = document.querySelector("#o-decouvrir [data-note]")?.getBoundingClientRect();
  const m = document.querySelector(".mc-nav")?.getBoundingClientRect();
  return Boolean(n && m && n.bottom <= m.top + 1);
});
ok(auDessus, "la note passe au-dessus du menu du bas");
await lea.screenshot({ path: `${D}/tele-du-jour-4-onglet.png` });

// ═══ 📺 LE LECTEUR DE YOUTUBE NE RÉPOND PAS (un bloqueur) : LA VIDÉO RESTE DANS L'ÉCRAN (retours du 20 novembre 2026) ═══
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.abort());
  await ctx.route(/^https:\/\/www\.youtube-nocookie\.com\//, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>lecteur</title>" }));
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  const bloque = await ctx.newPage();
  await bloque.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
  ok(await attendre(bloque, async () => (await bloque.locator("[data-allumer]").count()) === 1), "(YouTube bloqué) « ▶ Allumer la télé »");
  const id = await bloque.locator(".td").getAttribute("data-video");
  await bloque.locator("[data-allumer]").click();
  ok(
    await attendre(bloque, async () => (await bloque.locator(".td-ecran iframe.td-lecteur[data-simple]").getAttribute("src"))?.startsWith(`https://www.youtube-nocookie.com/embed/${id}?`)),
    "… le lecteur tout simple, dans l'écran : on reste dans la scène",
  );
  ok((await bloque.locator('a[href*="youtube.com/watch"]').count()) === 0, "… jamais un lien qui part sur YouTube");
  await ctx.close();
}

ok(!(await lea.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "rien ne déborde");
ok(!/exemple/i.test(await lea.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
