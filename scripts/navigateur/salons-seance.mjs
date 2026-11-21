// 🎬 LA SÉANCE CHEZ MOI ET 🗄️ L'ÉTAGÈRE DES SALONS, À L'ÉCRAN (les lots D2 et D5 de Découvrir,
// `docs/univers/decouvrir.md` sections 19 et 20) — sur des iPhone, contre le faux Supabase, le faux YouTube et un faux
// lecteur de YouTube.
//
// D2 : dans « Ma télé du jour », « 👥 Regarder avec mes proches » ; chez Léa : sa pièce, « 🏠 Chez Léa », ses commandes
// (❚❚, ⏭, 📺 Choisir). « 👥 » : elle invite Sam. Sam voit « 🎬 Léa t'invite devant sa télé » dans Découvrir, « Venir » :
// il s'assoit à côté d'elle, « C'est Léa qui mène la télé », pas de commandes. Léa met en pause, passe à la suivante :
// le lecteur de Sam suit. Entre proches, un lien part (rien n'est relu).
// D5 : dans le salon du foot, Ben touche la bulle d'Ana : ❤️ ; trois cœurs, elle monte sur l'étagère (🗄️) ; « 📌
// Garder ». La fiche d'Ana : ses passions, « 👯 Ajouter en proche », « 🏠 Voir sa maison ». Ana accepte dans Découvrir ;
// sa maison montre le fanion ⚽ (« Mes salons »). Rien ne déborde, jamais le mot « exemple », aucune erreur.
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

const qui = (n, prenom) => ({ id: `5c5c5c5c-0000-4000-8000-0000005c10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-seance-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ANA = qui(3, "Ana");
const BEN = qui(4, "Ben");
const CLEO = qui(5, "Cléo");
const DAN = qui(6, "Dan");
const GENS = [LEA, SAM, ANA, BEN, CLEO, DAN];
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
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
// (Léa : sa pièce, le salon ; Sam est son proche, des deux côtés. Ana : sa pièce, ouverte à tous)
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${ANA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${ANA.id}/ma-piece/visibilite.json`, { v: "tous" });
await json(`${ANA.id}/passions.json`, { passions: ["foot", "musique"], poids: {}, le: maintenant });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée");

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
const route = async (x, corps) => (await fetch(`${BASE}/api/direct/salons-ouverts`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) })).json();
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);

// (⭐ le lot B : Sam a déjà vu la première vidéo de leur télé du jour — même passions — et y a ri à 2 s)
const appelTele = async (x, corps) => (await fetch(`${BASE}/api/direct/tele-du-jour`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } })).json();
const vSam = (await appelTele(LEA)).tele?.videos?.[0]?.id;
await appelTele(SAM, { action: "reagir", id: vSam, t: 2, sorte: "rire", source: "rangee" });
await appelTele(SAM, { action: "vue", id: vSam, fin: true, secondes: 150 });

// ═══ 🎬 LÉA : « 👥 REGARDER AVEC MES PROCHES » ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-decouvrir");
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir [data-carte-tele]").count()) === 1, 45000), "Découvrir : la carte « Ma télé du jour »");
// (⭐ le lot B, 21 novembre 2026 : « Ma télé du jour » est son salon à quatre places — la carte y mène tout droit)
await lea.locator("#o-decouvrir [data-carte-tele]").click();
await lea.waitForURL(/\/univers\/salons\?chez=moi/);
const seance = lea.locator(".so[data-salon]");
ok(await attendre(lea, async () => /^chez-/.test((await seance.getAttribute("data-salon")) ?? "") && (await seance.getAttribute("data-hote")) === "1"), "chez elle : la séance (elle en est l'hôte)");
const SEANCE = await seance.getAttribute("data-salon");
ok(/🏠 Chez Léa/.test(await texte(lea.locator("[data-nom]"))) && /1 ici/.test(await texte(lea.locator("[data-places]"))), `« ${await texte(lea.locator("[data-nom]"))} »`);
ok(/Invite tes proches/.test(await texte(lea.locator("[data-note]"))), "« Invite tes proches : ils s'assoient à côté de toi. »");
ok((await lea.locator("[data-commandes] [data-pause]").count()) === 1 && (await lea.locator("[data-commandes] [data-suivante]").count()) === 1 && (await lea.locator("[data-commandes] [data-choisir]").count()) === 1, "ses commandes : ❚❚ Pause, ⏭ Suivante, 📺 Choisir");
ok((await lea.locator("[data-etagere]").count()) === 0 && /Tu mènes la télé/.test(await texte(lea.locator(".so-info"))), "… « Tu mènes la télé » (pas d'étagère : c'est chez elle)");
const v0 = await lea.locator(".so-tele").getAttribute("data-tele");
// (🔊 21 novembre 2026 : sa télé du jour part toute seule, en silence ; 🎭 quatre places, sans pièce)
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-yt")) === v0 && (await lea.locator(".faux-yt").getAttribute("data-muet")) === "1") && (await lea.locator("[data-allumer]").count()) === 0, `sa télé du jour part toute seule, en silence (${v0})`);
ok(v0 === vSam, "… la première de sa télé du jour, celle que Sam a déjà vue");
ok(await attendre(lea, async () => /Sam · l’a vue/.test(await texte(lea.locator(`[data-fantome="${SAM.cle}"]`)))), "⭐ Sam, qui l'a déjà vue, est assis à côté d'elle (« Sam · l'a vue »)");
ok(await attendre(lea, async () => (await lea.locator(`[data-pop-fantome="${SAM.cle}"]`).count()) >= 1, 8000), "… et à 2 s, il rit (sa réaction, à sa seconde)");
ok((await lea.locator('.so-piece[data-gradin="plan"]').count()) === 1 && (await lea.locator("button.so-place-libre").count()) === 2, "… quatre places, comme un salon : elle, Sam en souvenir, deux libres « ＋ » à toucher");
await lea.locator("[data-son-bouton]").click();
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-muet")) === ""), "un toucher : le son");
await lea.screenshot({ path: `${D}/salons-seance-0-places.png` });

// inviter Sam : une place libre (＋) — son carnet, ou un lien WhatsApp qui réserve la place
await lea.locator("button.so-place-libre").first().click();
ok(await attendre(lea, async () => decodeURIComponent((await lea.locator("[data-whatsapp-place]").getAttribute("href").catch(() => "")) ?? "").includes("/univers/salons?chez=")), "« ＋ » : sa feuille — ses proches, et « 📲 Inviter par WhatsApp » (un lien qui réserve la place)");
ok(await attendre(lea, async () => (await lea.locator(`[data-proches] [data-invite="${SAM.cle}"]`).count()) === 1), "« 👥 » : ses proches (Sam)");
await lea.locator(`[data-invite="${SAM.cle}"]`).click();
ok((await lea.locator(`[data-invite="${SAM.cle}"]`).getAttribute("aria-pressed")) === "true" && /Inviter \(1\)/.test(await texte(lea.locator("[data-envoyer-invitations]"))), "Sam choisi : « Inviter (1) »");
await lea.screenshot({ path: `${D}/salons-seance-1-inviter.png` });
await lea.locator("[data-envoyer-invitations]").click();
ok(await attendre(lea, async () => /Invitation envoyée/.test(await texte(lea.locator("[data-note]"))), 6000), "« Invitation envoyée : ton proche arrive en touchant « Venir » »");

// ═══ SAM : L'INVITATION, « VENIR » ═══
const sam = await ouvrir(SAM);
await sam.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(sam, "#o-decouvrir");
const invitation = sam.locator(`#o-decouvrir [data-invitation="${LEA.cle}"]`);
ok(await attendre(sam, async () => /Léa t’invite devant sa télé/.test(await texte(invitation)), 45000), "Découvrir de Sam : « 🎬 Léa t'invite devant sa télé »");
const haut = await sam.evaluate(() => {
  const a = document.querySelector("#o-decouvrir [data-attente]")?.getBoundingClientRect().top ?? 1e9;
  const c = document.querySelector("#o-decouvrir [data-carte-tele]")?.getBoundingClientRect().top ?? 0;
  return a < c;
});
ok(haut, "… tout en haut, avant sa télé du jour");
await sam.screenshot({ path: `${D}/salons-seance-2-invitation.png` });
await invitation.locator("[data-venir]").click();
await sam.waitForURL(/\/univers\/salons\?chez=/);
ok(await attendre(sam, async () => (await sam.locator(".so[data-salon]").getAttribute("data-salon")) === SEANCE && (await sam.locator(".so[data-salon]").getAttribute("data-hote")) === null), "« Venir » : chez Léa (invité)");
ok(/C’est Léa qui mène la télé/.test(await texte(sam.locator(".so-info"))) && (await sam.locator("[data-commandes]").count()) === 0 && (await sam.locator("[data-inviter]").count()) === 0, "« C'est Léa qui mène la télé » : ni commandes, ni invitations");
ok(await attendre(sam, async () => (await sam.locator(".so-fig").count()) === 2), "deux figurines dans la pièce de Léa");
ok(/2 ici · 2 places libres · 4 places/.test(await texte(sam.locator("[data-places]"))), `« ${await texte(sam.locator("[data-places]"))} » (quatre places chez soi)`);
ok(await attendre(lea, async () => (await lea.locator(".so-fig:not(.fantome)").count()) === 2 && (await lea.locator(`[data-fantome="${SAM.cle}"]`).count()) === 0, 12000), "… Léa le voit s'asseoir (le pouls) — en vrai, plus en souvenir");
ok(await attendre(sam, async () => (await sam.locator(".faux-yt").getAttribute("data-yt")) === v0), "chez Sam : la même vidéo, partie toute seule");

// ═══ LÉA MÈNE LA TÉLÉ ═══
await lea.locator('[data-commandes] [data-pause="pause"]').click();
ok(await attendre(lea, async () => (await lea.locator(".so-tele").getAttribute("data-pause")) === "1" && (await lea.locator(".faux-yt").getAttribute("data-pause")) === "1", 3000), "❚❚ Pause : chez Léa, tout de suite");
ok(await attendre(sam, async () => (await sam.locator(".faux-yt").getAttribute("data-pause")) === "1", 12000), "… et chez Sam");
ok(await attendre(sam, async () => /Léa va lancer la vidéo/.test(await texte(sam.locator("[data-affiche]"))), 6000) && (await lea.locator("[data-affiche] [data-jouer]").count()) === 1, "en pause : son affiche (l'image, le titre) — « ▶ Lancer la vidéo » chez Léa, « Léa va lancer la vidéo » chez Sam");
await sam.screenshot({ path: `${D}/salons-seance-3b-affiche.png` });
ok(/Reprendre/.test(await texte(lea.locator("[data-commandes] [data-pause]"))), "« ▶ Reprendre »");
await lea.locator('[data-commandes] [data-pause="reprendre"]').click();
ok(await attendre(sam, async () => (await sam.locator(".faux-yt").getAttribute("data-pause")) === "", 12000), "▶ Reprendre : chez Sam aussi");
await lea.locator("[data-commandes] [data-suivante]").click();
let v1 = "";
ok(await attendre(lea, async () => (v1 = (await lea.locator(".so-tele").getAttribute("data-tele")) ?? "") !== v0 && (await lea.locator(".faux-yt").getAttribute("data-yt")) === v1, 3000), "⏭ Suivante : une autre vidéo chez Léa, tout de suite");
ok(await attendre(sam, async () => (await sam.locator(".faux-yt").getAttribute("data-yt")) === v1, 12000), "… le lecteur de Sam suit");
await lea.locator("[data-commandes] [data-choisir]").click();
ok(await attendre(lea, async () => (await lea.locator("[data-videos] [data-video]").count()) >= 3), "📺 Choisir : sa télé du jour");
const v2 = await lea.locator("[data-videos] [data-video]").nth(2).getAttribute("data-video");
await lea.locator("[data-videos] [data-video]").nth(2).click();
ok(await attendre(sam, async () => (await sam.locator(".faux-yt").getAttribute("data-yt")) === v2, 12000), "… celle qu'elle choisit passe chez Sam");

// entre proches : rien n'est relu
await sam.locator(".so-ecrire input").fill("regarde www.monsite.fr");
await sam.locator(".so-ecrire button").click();
ok(await attendre(lea, async () => /monsite/.test(await texte(lea.locator(".so-bulle"))), 12000) && (await sam.locator("[data-refus]").count()) === 0, "Sam envoie un lien : il part (entre proches)");
await sam.locator(".so-fig:not([data-moi])").click();
ok((await sam.locator("[data-signaler]").count()) === 0 && (await sam.locator("[data-ajouter-proche]").count()) === 0 && (await sam.locator("[data-geste]").count()) > 0, "toucher Léa : des gestes, ni signaler, ni « ajouter »");
await sam.locator(".so-fermer").click();
await lea.screenshot({ path: `${D}/salons-seance-3-hote.png` });
await sam.screenshot({ path: `${D}/salons-seance-4-invite.png` });
ok(!(await deborde(lea)) && !(await deborde(sam)), "rien ne déborde (la séance)");
await sam.context().close();
await lea.context().close();

// ═══ 🗄️ LE SALON DU FOOT : ❤️, L'ÉTAGÈRE ═══
const A = (await route(ANA, { action: "entrer", theme: "foot" })).ouverture?.moi;
const ben = await ouvrir(BEN);
await ben.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
ok(await attendre(ben, async () => (await ben.locator(".so[data-salon]").getAttribute("data-salon")) === "foot-1" && (await ben.locator(`.so-fig[data-q="${A}"]`).count()) === 1, 30000), "Ben entre dans le salon du foot : Ana y est");
const mA = await route(ANA, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Quel but de Mbappé !" });
const ID = mA.message?.id;
const bulle = ben.locator(`.so-bulle[data-aimer="${ID}"]`);
ok(await attendre(ben, async () => /Quel but/.test(await texte(bulle)), 12000), "la bulle d'Ana : 🤍 (on peut l'aimer)");
await bulle.click();
ok(await attendre(ben, async () => /❤️ Aimé/.test(await texte(ben.locator("[data-note]"))) && /❤️/.test(await texte(bulle)), 5000), "un toucher : ❤️ Aimé");
await route(CLEO, { action: "entrer", theme: "foot" });
await route(DAN, { action: "entrer", theme: "foot" });
await route(CLEO, { action: "aimer", salon: "foot-1", message: ID });
await route(DAN, { action: "aimer", salon: "foot-1", message: ID });
await ben.locator("[data-etagere]").click();
const moment = ben.locator(`[data-moment="${ID}"]`);
ok(await attendre(ben, async () => /Quel but de Mbappé/.test(await texte(moment)) && /Ana · ❤️ 3/.test(await texte(moment))), "🗄️ l'étagère du salon : « Quel but de Mbappé ! », Ana · ❤️ 3");
await ben.screenshot({ path: `${D}/salons-seance-5-etagere.png` });
await moment.locator("[data-garder]").click();
ok(await attendre(ben, async () => /Gardé : il est chez toi/.test(await texte(ben.locator("[data-note]"))), 6000), "📌 Garder : « il est chez toi »");
await ben.locator(".so-fermer").click();

// la fiche d'Ana : ses passions, sa maison, « Ajouter en proche »
await ben.locator(`.so-fig[data-q="${A}"]`).click();
const fiche = ben.locator(".so-feuille");
ok(await attendre(ben, async () => /Ses passions/.test(await texte(fiche.locator("[data-passions]"))) && /foot/.test(await texte(fiche.locator("[data-passions]")))), `sa fiche : ses passions (${await texte(fiche.locator("[data-passions]"))})`);
ok(/^\/univers\/chez\/[0-9a-f]{16}$/.test((await fiche.locator("[data-voir-maison]").getAttribute("href")) ?? ""), "« 🏠 Voir sa maison » (ouverte à tous)");
await ben.screenshot({ path: `${D}/salons-seance-6-fiche.png` });
await fiche.locator("[data-ajouter-proche]").click();
ok(await attendre(ben, async () => /Demande envoyée/.test(await texte(ben.locator("[data-note]"))), 6000), "« 👯 Ajouter en proche » : « Demande envoyée »");
ok(!(await deborde(ben)), "rien ne déborde (le salon)");
await ben.context().close();

// ═══ ANA : LA DEMANDE, SES SALONS ═══
const ana = await ouvrir(ANA);
await ana.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(ana, "#o-decouvrir");
const demande = ana.locator("#o-decouvrir [data-demande]");
ok(await attendre(ana, async () => /Ben \(Le salon du foot\) veut t’ajouter en proche/.test(await texte(demande)), 45000), "Découvrir d'Ana : « 👯 Ben (Le salon du foot) veut t'ajouter en proche »");
await demande.locator("[data-accepter]").click();
ok(await attendre(ana, async () => /Ben et toi êtes proches/.test(await texte(ana.locator("[data-note-attente]"))) && (await ana.locator("#o-decouvrir [data-demande]").count()) === 0, 8000), "« Accepter » : « Ben et toi êtes proches »");
await ana.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
await fermerPablito(ana);
ok(await attendre(ana, async () => (await ana.locator('[data-fanions] [data-fanion="foot"]').count()) === 1, 30000), "sa maison : le fanion ⚽ de « Mes salons »");
ok(((await ana.locator('[data-fanion="foot"]').getAttribute("href")) ?? "") === "/univers/salons?theme=foot", "… qui ramène au salon du foot");
await ana.waitForTimeout(400);
await ana.screenshot({ path: `${D}/salons-seance-7-fanions.png` });
ok(!/exemple/i.test(await ana.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
await ana.context().close();

ok(erreurs.length === 0, `aucune erreur (${erreurs.slice(0, 3).join(" | ")})`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLa séance chez moi et l'étagère des salons tiennent ✓");
process.exit(echecs ? 1 : 0);
