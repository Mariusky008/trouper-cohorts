// 🎞️👥 LA SÉANCE ENTRE AMIS, À L'ÉCRAN (`docs/univers/decouvrir.md`, section 33) — sur des iPhone, contre le faux Supabase,
// le faux YouTube et un faux lecteur de YouTube.
//
// « Il garde sa vidéo » : Léa invite Sam sur une vidéo (elle y rit à 0:08). Sam arrive : « Vous regardez ensemble, en
// direct, avec Léa » ; il lance la vidéo — pour les deux. Léa passe à une autre : Sam garde la sienne (« Léa regarde autre
// chose : tu gardes ta vidéo, à ton rythme ») ; la figurine de Léa, à côté de lui, devient « Léa · l'a vue » et rit à
// 0:08 ; sa pause à lui n'arrête pas Léa ; « 👀 Rejoindre Léa » : il retrouve sa télé.
// « L'invité invite » : Sam touche une place libre — ses proches à lui (Tom, pas Léa), « chez Léa », un lien WhatsApp
// « … chez Léa » ; il invite Tom, qui voit dans Découvrir « 🎬 Sam t'invite devant la télé de Léa ».
// Rien ne déborde, jamais le mot « exemple », aucune erreur.
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `5e5e5e5e-0000-4000-8000-0000005e44${String(n).padStart(2, "0")}`, jeton: `jeton-seance-entre-amis-nav-0${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const GENS = [LEA, SAM, TOM];
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
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
}
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
await json(`${SAM.id}/passions.json`, { passions: ["musique", "jeux", "humour"], poids: {}, le: maintenant });
await json(`${TOM.id}/passions.json`, { passions: ["musique", "jeux", "humour"], poids: {}, le: maintenant });
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
// (Léa ↔ Sam, Sam ↔ Tom : proches des deux côtés ; Tom n'est pas le proche de Léa)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, TOM.id] });
await json(`${TOM.id}/proches.json`, { ids: [SAM.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée");

// (un faux lecteur de YouTube : il montre la vidéo, sa pause, et à quelle seconde on l'a recalé)
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.dataset.debut = (o.playerVars && o.playerVars.start) || 0; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this, t0 = Date.now(), base = Number(d.dataset.debut), etat = 1;
  self.loadVideoById = function (x) { d.dataset.yt = x.videoId || x; base = (x.startSeconds || 0); t0 = Date.now(); etat = 1; d.dataset.pause = ""; };
  self.playVideo = function () { d.dataset.joue = "1"; d.dataset.pause = ""; if (etat === 2) { t0 = Date.now(); } etat = 1; };
  self.pauseVideo = function () { if (etat === 1) base = base + (Date.now() - t0) / 1000; etat = 2; d.dataset.pause = "1"; };
  self.seekTo = function (t) { base = t; t0 = Date.now(); d.dataset.recale = String(Math.round(t)); };
  self.getCurrentTime = function () { return etat === 1 ? base + (Date.now() - t0) / 1000 : base; };
  self.getPlayerState = function () { return etat; };
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
const ouvrir = async (x) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  await ctx.route(/^https:\/\/www\.youtube-nocookie\.com\//, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>lecteur</title>" }));
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
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);
const appel = async (x, chemin, corps) => (await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } })).json();

// ═══ LÉA INVITE SAM SUR UNE VIDÉO, ET Y RIT À 0:08 ═══
const [V] = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos ?? [];
ok(V?.id, `la vidéo de l'invitation (« ${V?.titre} »)`);
const inv = await appel(LEA, "/api/direct/salons-ouverts", { action: "inviter-video", id: V.id, t: 0, cles: [SAM.cle] });
ok(inv.invites?.length === 1, "Léa invite Sam sur cette vidéo");
await appel(LEA, "/api/direct/tele-du-jour", { action: "reagir", id: V.id, t: 8, sorte: "rire", source: "rangee" });

const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/univers/salons?chez=moi`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator(".so[data-hote='1']").count()) === 1 && (await lea.locator(".so-tele").getAttribute("data-tele")) === V.id, 30000), "Léa, chez elle : sa télé sur la vidéo (en pause : on la lance ensemble)");

// ═══ SAM ARRIVE : ENSEMBLE ═══
const sam = await ouvrir(SAM);
await sam.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(sam, "#o-decouvrir");
const carte = sam.locator(`#o-decouvrir [data-invitation="${LEA.cle}"]`);
ok(await attendre(sam, async () => /Léa t’invite devant sa télé/.test(await texte(carte)) && (await texte(carte)).includes(V.titre), 45000), `Découvrir de Sam : l'invitation, et sa vidéo (« ${V.titre} »)`);
await carte.locator("[data-venir]").click();
await sam.waitForURL(/\/univers\/salons\?chez=/);
ok(await attendre(sam, async () => (await sam.locator(".so-tele").getAttribute("data-tele")) === V.id && (await sam.locator(".so-fig").count()) === 2, 20000), "« Venir » : chez Léa, sur la vidéo de l'invitation");
ok(/Vous regardez ensemble, en direct, avec Léa/.test(await texte(sam.locator("[data-info]"))) && (await sam.locator('[data-commandes="ensemble"]').count()) === 1, "« Vous regardez ensemble, en direct, avec Léa »");
ok(await attendre(sam, async () => (await sam.locator("[data-affiche] [data-jouer]").count()) === 1, 8000), "en pause : « ▶ Lancer la vidéo », chez lui aussi");
await sam.locator("[data-affiche] [data-jouer]").click();
ok(await attendre(lea, async () => (await lea.locator(".so-tele").getAttribute("data-pause")) === null && (await lea.locator(".faux-yt").getAttribute("data-pause")) !== "1", 12000), "Sam la lance : elle part chez Léa aussi (ensemble)");
await sam.waitForTimeout(1500);

// ═══ LÉA PASSE À UNE AUTRE VIDÉO : SAM GARDE LA SIENNE ═══
await lea.locator("[data-commandes] [data-suivante]").click();
let W = "";
ok(await attendre(lea, async () => (W = (await lea.locator(".so-tele").getAttribute("data-tele")) ?? "") !== V.id, 4000), "Léa passe à la suivante");
ok(await attendre(sam, async () => /tu gardes ta vidéo/.test(await texte(sam.locator("[data-note]"))), 12000), "chez Sam : « Léa regarde autre chose : tu gardes ta vidéo, à ton rythme »");
ok((await sam.locator(".so-tele").getAttribute("data-tele")) === V.id && (await sam.locator(".faux-yt").getAttribute("data-yt")) === V.id, "… sa télé reste sur sa vidéo");
ok(/Ta vidéo, à ton rythme/.test(await texte(sam.locator("[data-info]"))) && (await sam.locator('[data-commandes="seul"] [data-rejoindre]').count()) === 1, "« Ta vidéo, à ton rythme » ; « 👀 Rejoindre Léa »");
const figLea = sam.locator(`.so-fig[data-q="${qui8(LEA.id)}"]`);
ok(await attendre(sam, async () => /Léa · l’a vue/.test(await texte(figLea)), 8000), "la figurine de Léa, à côté de lui : « Léa · l'a vue » (un souvenir)");
ok(await attendre(sam, async () => (await figLea.locator("[data-pop-fantome]").count()) >= 1, 15000), "… et à 0:08, elle rit (sa réaction à cette vidéo, rejouée)");
await sam.screenshot({ path: `${D}/seance-entre-amis-1-sa-video.png` });
await sam.locator('[data-commandes="seul"] [data-pause="pause"]').click();
ok(await attendre(sam, async () => (await sam.locator(".faux-yt").getAttribute("data-pause")) === "1", 3000), "sa pause à lui : sa vidéo s'arrête…");
await lea.waitForTimeout(4500);
ok((await lea.locator(".so-tele").getAttribute("data-pause")) === null && (await lea.locator(".so-tele").getAttribute("data-tele")) === W, "… pas celle de Léa");
await sam.locator("[data-rejoindre]").click();
ok(await attendre(sam, async () => (await sam.locator(".so-tele").getAttribute("data-tele")) === W && (await sam.locator(".faux-yt").getAttribute("data-yt")) === W, 6000), "« 👀 Rejoindre Léa » : il retrouve sa télé");
ok(/Vous regardez ensemble/.test(await texte(sam.locator("[data-note]"))) && (await sam.locator('[data-commandes="ensemble"]').count()) === 1, "… « Vous regardez ensemble, en direct, avec Léa »");

// ═══ 👥 SAM INVITE TOM À LA PLACE LIBRE ═══
ok((await sam.locator("button.so-place-libre").count()) >= 1, "chez Léa, Sam voit les places libres « ＋ »");
await sam.locator("button.so-place-libre").first().click();
ok(await attendre(sam, async () => (await sam.locator(`[data-proches] [data-invite="${TOM.cle}"]`).count()) === 1), "« ＋ » : ses proches à lui (Tom)");
ok((await sam.locator(`[data-invite="${LEA.cle}"]`).count()) === 0 && /chez Léa/.test(await texte(sam.locator(".so-chapo"))), "… pas Léa ; « Un de tes proches s'assoit à côté de toi, chez Léa »");
ok(await attendre(sam, async () => decodeURIComponent(((await sam.locator("[data-whatsapp-place]").getAttribute("href").catch(() => "")) ?? "").split("text=")[1] ?? "").startsWith("🎬 Sam t’invite à regarder des vidéos avec nous chez Léa")), "« 📲 Inviter par WhatsApp » : « 🎬 Sam t'invite… chez Léa »");
await sam.locator(`[data-invite="${TOM.cle}"]`).click();
await sam.screenshot({ path: `${D}/seance-entre-amis-2-inviter.png` });
await sam.locator("[data-envoyer-invitations]").click();
ok(await attendre(sam, async () => /Invitation envoyée/.test(await texte(sam.locator("[data-note]"))), 6000), "« Invitation envoyée »");
const tom = await ouvrir(TOM);
await tom.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(tom, "#o-decouvrir");
ok(await attendre(tom, async () => /Sam t’invite devant la télé de Léa/.test(await texte(tom.locator(`#o-decouvrir [data-invitation="${LEA.cle}"]`))), 45000), "Tom : « 🎬 Sam t'invite devant la télé de Léa »");
await tom.screenshot({ path: `${D}/seance-entre-amis-3-tom.png` });

ok(!(await deborde(sam)) && !(await deborde(lea)), "rien ne déborde");
ok(!/exemple/i.test((await sam.evaluate(() => document.body.innerText)) + (await lea.evaluate(() => document.body.innerText))), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
