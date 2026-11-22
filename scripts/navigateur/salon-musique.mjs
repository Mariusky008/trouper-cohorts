// 🎵 LE SALON MUSIQUE (`docs/univers/decouvrir.md`, section 36 ; le lot M1) — sur deux iPhone, contre le faux Supabase et
// le faux YouTube.
//
// Léa et Sam entrent dans le salon de la musique : sous la télé, « 📻 La radio du salon » (la sélection du jour).
// Léa : « 🎵 Proposer le suivant », colle un lien YouTube, « Le proposer » : il part tout de suite — sa télé le passe,
// « 🎵 Ton choix » ; chez Sam, « 🎵 Le choix de Léa », la même vidéo, et une note qui danse au-dessus de la figurine de
// Léa. Sam propose un clip de la radio du jour : chez Léa, « À suivre : Sam · … » ; son ❤️ le compte. 💃 : la figurine de
// Léa danse chez Sam. Le morceau de Léa fini : celui de Sam part, et Sam lit « C'était le choix de Léa », « Voir sa
// fiche ». Ni erreur, ni le mot « exemple ».
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
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

const qui = (n, prenom) => ({ id: `6c6c6c6c-0000-4000-8000-0000006c10${String(n).padStart(2, "0")}`, jeton: `jeton-salon-musique-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
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
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["musique"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok((nuit.faites?.length ?? 0) > 0, "la nuit est passée (la radio du salon : la sélection du jour)");

const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
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
const ouvrir = async (x) => {
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
    await p.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

// ═══ ILS ENTRENT : LA RADIO DU SALON ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/univers/salons?theme=musique`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator(".so[data-salon]").getAttribute("data-salon")) === "musique-1"), "Léa entre dans le salon de la musique");
const bandeL = lea.locator("[data-platine]");
ok(await attendre(lea, async () => (await bandeL.getAttribute("data-platine")) === "radio" && /La radio du salon/.test(await texte(bandeL))), `sous la télé : « ${await texte(bandeL.locator(".so-pl-qui"))} »`);
ok((await lea.locator("[data-r=danse]").count()) === 1 && (await lea.locator("[data-r=feu]").count()) === 1 && (await lea.locator("[data-r=oh]").count()) === 0, "les réactions du salon de la musique : 🔥 🎶 💃 ❤️ 😂");
const sam = await ouvrir(SAM);
await sam.goto(`${BASE}/univers/salons?theme=musique`, { waitUntil: "domcontentloaded" });
ok(await attendre(sam, async () => (await sam.locator(".so[data-salon]").getAttribute("data-salon")) === "musique-1"), "Sam entre aussi");
const L8 = qui8(LEA.id);
ok(await attendre(lea, async () => (await lea.locator(`.so-fig[data-q="${qui8(SAM.id)}"]`).count()) === 1, 12000), "chez Léa, la figurine de Sam s'assoit");

// ═══ LÉA PROPOSE UN LIEN : IL PART TOUT DE SUITE ═══
await bandeL.locator("[data-proposer]").click();
const feuille = lea.locator("[data-feuille-morceau]");
ok(await attendre(lea, async () => /Proposer un morceau/.test(await texte(feuille)) && (await feuille.locator("[data-clip-radio]").count()) > 0), "« Proposer un morceau » : un lien, ou un clip de la radio du jour");
ok(await feuille.locator("[data-envoyer-morceau]").isDisabled(), "… rien de collé : « Le proposer » attend");
await feuille.locator('[data-champ="lien-morceau"]').fill("https://youtu.be/MorceauLeaA");
await lea.waitForTimeout(250);
await lea.screenshot({ path: `${D}/salon-musique-1-proposer.png` });
await feuille.locator("[data-envoyer-morceau]").click();
ok(await attendre(lea, async () => (await feuille.count()) === 0 && (await bandeL.getAttribute("data-platine")) === "morceau" && /Ton choix/.test(await texte(bandeL))), `il part tout de suite : « ${await texte(bandeL.locator(".so-pl-qui"))} »`);
ok(await attendre(lea, async () => (await lea.locator(".so-tele").getAttribute("data-tele")) === "MorceauLeaA" && (await lea.locator(".faux-yt").getAttribute("data-yt")) === "MorceauLeaA"), "sa télé le passe");
const bandeS = sam.locator("[data-platine]");
ok(await attendre(sam, async () => /Le choix de Léa/.test(await texte(bandeS)) && (await sam.locator(".faux-yt").getAttribute("data-yt")) === "MorceauLeaA", 12000), "chez Sam : « 🎵 Le choix de Léa », la même vidéo");
ok(await attendre(sam, async () => (await sam.locator(`.so-fig[data-q="${L8}"][data-choix="1"] .so-note-choix`).count()) === 1), "… une note danse au-dessus de la figurine de Léa");
const boiteNote = await sam.locator(`.so-fig[data-q="${L8}"] .so-note-choix`).boundingBox();
const boiteFig = await sam.locator(`.so-fig[data-q="${L8}"]`).boundingBox();
ok(boiteNote && boiteFig && boiteNote.width < 40 && boiteNote.height < 40 && boiteNote.y < boiteFig.y + 12, `… petite, au-dessus de sa tête (${JSON.stringify(boiteNote)})`);
ok(/Un morceau proposé passe pour tout le salon/.test(await texte(sam.locator(".so-info"))), "sous la scène : « 🎵 Un morceau proposé passe pour tout le salon… »");

// ═══ SAM PROPOSE UN CLIP DE LA RADIO : À SUIVRE ═══
await bandeS.locator("[data-proposer]").click();
const feuilleS = sam.locator("[data-feuille-morceau]");
ok(await attendre(sam, async () => (await feuilleS.locator("[data-clip-radio]").count()) > 0), "Sam ouvre « Proposer un morceau »");
await feuilleS.locator("[data-clip-radio]").first().click();
ok(await attendre(sam, async () => (await feuilleS.count()) === 0 && /Ton morceau passe juste après/.test(await texte(bandeS))), "Sam propose un clip de la radio : « Ton morceau passe juste après »");
ok(await attendre(lea, async () => /À suivre/.test(await texte(bandeL)) && /Sam ·/.test(await texte(bandeL.locator("[data-dans-file]"))), 12000), `chez Léa : « À suivre : ${await texte(bandeL.locator("[data-dans-file]"))} »`);
await bandeL.locator(`[data-coeur="${qui8(SAM.id)}"]`).click();
ok(await attendre(lea, async () => (await bandeL.locator(`[data-coeur="${qui8(SAM.id)}"]`).getAttribute("aria-pressed")) === "true" && /❤️ 1/.test(await texte(bandeL.locator(`[data-coeur="${qui8(SAM.id)}"]`)))), "son ❤️ le compte");

// ═══ 💃 : SA FIGURINE DANSE, CHEZ TOUT LE MONDE ═══
await lea.locator("[data-r=danse]").click();
ok(await attendre(sam, async () => (await sam.locator(`.so-fig[data-q="${L8}"][data-danse="danse"]`).count()) === 1, 12000), "💃 : chez Sam, la figurine de Léa danse");
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/salon-musique-2-choix-de-lea.png` });

// ═══ LE MORCEAU DE LÉA FINI : CELUI DE SAM PART, « C'ÉTAIT LE CHOIX DE LÉA » ═══
const CHEMIN = "decouvrir/salons/adultes/musique-1/platine.json";
const pl = await lire(CHEMIN);
await json(CHEMIN, { ...pl, enCours: { ...pl.enCours, depart: Date.now() - 151_000 } });
ok(await attendre(sam, async () => (await sam.locator("[data-cetait]").count()) === 1 && /C’était le choix de Léa/.test(await texte(sam.locator("[data-cetait]"))) && /Voir sa fiche/.test(await texte(sam.locator("[data-cetait]"))), 12000), "chez Sam : « C'était le choix de Léa », « Voir sa fiche »");
ok(await attendre(sam, async () => /Ton choix/.test(await texte(bandeS)) && (await sam.locator(".so-tele").getAttribute("data-morceau")) !== "MorceauLeaA"), "… et son morceau à lui part");
ok(await attendre(lea, async () => /Le choix de Sam/.test(await texte(bandeL)), 12000), "chez Léa : « 🎵 Le choix de Sam »");
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/salon-musique-3-cetait.png` });
await sam.locator("[data-cetait] button").click();
ok(await attendre(sam, async () => (await sam.locator(`[data-fiche="${L8}"]`).count()) === 1), "« Voir sa fiche » : la fiche de Léa s'ouvre");

for (const p of [lea, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
