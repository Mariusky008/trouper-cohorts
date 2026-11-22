// 📷⏱💬🎙️ « TOUT POUR TOUS » DANS LA SÉANCE, À L'ÉCRAN (`docs/univers/decouvrir.md`, section 34) — sur des iPhone, contre
// le faux Supabase, le faux YouTube, un faux lecteur de YouTube, une fausse caméra, un faux micro et une fausse lecture
// du visage.
//
// Léa a ri à 0:02 et écrit « trop drôle » à 0:04 sur la première vidéo de sa télé du jour ; elle invite Sam, qui arrive
// chez elle. Sam, l'invité, a tout : la ligne du temps (deux points de Léa), « 💬 Ce qui s'est dit · 2 » — ce qui vient
// plus loin reste caché, puis s'ouvre ; toucher une ligne revoit le moment, pour les deux ; son 😂 devient un point.
// La carte de la caméra (la maquette) ; « Je l'allume » : sa figurine fait sa tête — et chez Léa, la figurine de Sam
// copie sa tête en direct. 🎙️ Il garde le micro appuyé : sa voix part à la seconde ; Léa voit « 🎙️ Un vocal à… », et
// « ▶ Écouter » dans « Ce qui s'est dit ». Rien ne déborde, jamais le mot « exemple », aucune erreur.
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
  return r.ok ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (l'univers, derrière son interrupteur coupé ici : l'administrateur y entre — comme les autres essais de la séance)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `7b7b7b7b-0000-4000-8000-0000007b30${String(n).padStart(2, "0")}`, jeton: `jeton-seance-pour-tous-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
// (leur figurine assise : une grosse tête, un cou, le corps et le fauteuil)
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="#f0c8a0"/><rect x="370" y="540" width="60" height="40" fill="#f0c8a0"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#7a3e2a"/></svg>`,
      ),
      left: 0,
      top: 0,
    },
  ])
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
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée");

const appelTele = async (x, corps, q = "") => {
  const r = await fetch(`${BASE}/api/direct/tele-du-jour${q}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
// (le lot V1 : leurs cinq expressions, faites à l'ouverture de l'appli)
for (const x of GENS) await fetch(`${BASE}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${x.jeton}` } });
const pretes = async (x) => (await lire(`${x.id}/calques/${empreinte(`${x.id}/perso/v1/assise.png`)}-expressions.json`))?.le;
for (let k = 0; k < 150 && !((await pretes(LEA)) && (await pretes(SAM))); k++) await new Promise((fini) => setTimeout(fini, 400));
const viv = (await appelTele(LEA, null, "?vivante=1")).vivante;
const ADRESSE = /^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/;
ok(viv && viv.ratio > 0 && ADRESSE.test(viv.corps) && ADRESSE.test(viv.tete?.src ?? "") && viv.tete.boite?.length === 4 && ["sourire", "rire", "surprise", "bof", "grimace"].every((e) => ADRESSE.test(viv.expressions?.[e] ?? "")), "… ses expressions faites : son corps sans sa tête, sa tête, ses cinq expressions, à adresse stable");

const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const v0 = (await appelTele(LEA)).tele?.videos?.[0]?.id;
ok(v0, "la première vidéo de la télé du jour de Léa");
ok((await appelTele(LEA, { action: "reagir", id: v0, t: 2, sorte: "rire", source: "rangee" })).statut === 200 && (await appelTele(LEA, { action: "ecrire", id: v0, t: 4, texte: "trop drôle" })).statut === 200, "Léa y a ri à 0:02, et écrit « trop drôle » à 0:04");

const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this, t0 = Date.now(), base = Number((o.playerVars && o.playerVars.start) || 0), etat = 1;
  self.loadVideoById = function (x) { d.dataset.yt = x.videoId || x; base = (x.startSeconds || 0); t0 = Date.now(); etat = 1; };
  self.playVideo = function () { if (etat === 2) { t0 = Date.now(); } etat = 1; };
  self.pauseVideo = function () { if (etat === 1) base = base + (Date.now() - t0) / 1000; etat = 2; };
  self.seekTo = function (t) { base = t; t0 = Date.now(); d.dataset.recale = String(Math.round(t)); };
  self.getCurrentTime = function () { return etat === 1 ? base + (Date.now() - t0) / 1000 : base; };
  self.getPlayerState = function () { return etat; };
  self.mute = function () {}; self.unMute = function () {}; self.setVolume = function () {};
  self.destroy = function () { d.remove(); };
  setTimeout(function () { o.events && o.events.onReady && o.events.onReady({ target: self }); }, 10);
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
const FAUX_MEDIAPIPE = `
export const FilesetResolver = { forVisionTasks: async () => ({}) };
export const FaceLandmarker = { createFromOptions: async () => ({ detectForVideo: () => window.__visage || { faceBlendshapes: [], faceLandmarks: [] }, close() {} }) };
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
const ouvrir = async (x) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["camera", "microphone"] });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@[\d.]+\/vision_bundle\.mjs$/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: FAUX_MEDIAPIPE }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => null);
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
const visageDe = (p, formes) =>
  p.evaluate((formes) => {
    const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    points[33] = { x: 0.4, y: 0.45, z: 0 };
    points[263] = { x: 0.6, y: 0.45, z: 0 };
    points[1] = { x: 0.5, y: 0.55, z: 0 };
    window.__visage = formes ? { faceBlendshapes: [{ categories: Object.entries(formes).map(([categoryName, score]) => ({ categoryName, score })) }], faceLandmarks: [points] } : null;
  }, formes);
const RIRE = { mouthSmileLeft: 0.85, mouthSmileRight: 0.85, jawOpen: 0.55 };
const NEUTRE = { mouthSmileLeft: 0.05, mouthSmileRight: 0.05, jawOpen: 0.05 };
const secondes = async (p) => {
  const [m, s] = (await texte(p.locator("[data-ligne-temps] > span").first())).split(":").map(Number);
  return m * 60 + s;
};

// ═══ LÉA, CHEZ ELLE ; ELLE INVITE SAM ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/univers/salons?chez=moi`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator(".so[data-hote='1']").count()) === 1 && (await lea.locator(".so-tele").getAttribute("data-tele")) === v0, 30000), "Léa, chez elle : sa télé sur la vidéo");
// (elle a aussi sa caméra prête : la carte lui est proposée une fois — « Pas maintenant »)
if (await attendre(lea, async () => (await lea.locator("[data-proposer-camera]").count()) === 1, 6000)) await lea.locator("[data-plus-tard]").click();
const inv = await fetch(`${BASE}/api/direct/salons-ouverts`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}` }, body: JSON.stringify({ action: "inviter", cles: [SAM.cle] }) }).then((r) => r.json());
ok(inv.invites?.length === 1, "elle invite Sam");

// ═══ SAM, L'INVITÉ : LA LIGNE DU TEMPS, CE QUI S'EST DIT ═══
const sam = await ouvrir(SAM);
await sam.goto(`${BASE}/univers/salons?chez=${LEA.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(sam, async () => (await sam.locator(".so-tele").getAttribute("data-tele")) === v0 && (await sam.locator(".so[data-hote]").count()) === 0, 30000), "Sam arrive chez Léa : la même vidéo");
ok(await attendre(sam, async () => (await sam.locator(`[data-ligne-temps] [data-tic="${LEA.cle}"]`).count()) === 2, 12000), "⏱ la ligne du temps : les deux réactions de Léa, en points");
ok(/💬 Ce qui s’est dit · 2/.test(await texte(sam.locator("[data-dit]"))), "« 💬 Ce qui s'est dit · 2 »");
const propose = sam.locator("[data-proposer-camera]");
ok(await attendre(sam, async () => (await propose.count()) === 1, 10000) && /Ta figurine fait ta tête/.test(await texte(propose)) && /copie ta tête en direct/.test(await texte(propose)), "📷 l'invité aussi : la carte de la maquette");
await sam.screenshot({ path: `${D}/seance-pour-tous-1-carte.png` });
await sam.locator("[data-plus-tard]").click();
ok(await attendre(sam, async () => (await secondes(sam)) >= 12, 20000), `la vidéo avance (${await secondes(sam)} s)`);
await sam.locator("[data-dit]").click();
const dit = sam.locator("[data-feuille-dit]");
ok(await attendre(sam, async () => /0:02 Léa 😂/.test(await texte(dit)) && /0:04 Léa « trop drôle »/.test(await texte(dit))), `💬 Ce qui s'est dit : « ${await texte(dit)} »`);
await sam.screenshot({ path: `${D}/seance-pour-tous-2-dit.png` });
const nAvant = await lea.locator(".so-tele").getAttribute("data-n");
await dit.locator('[data-ligne="4"]').click();
ok(await attendre(lea, async () => (await lea.locator(".so-tele").getAttribute("data-n")) !== nAvant && (await secondes(lea)) <= 9, 12000), `toucher « trop drôle » : la vidéo revient au moment — chez Léa aussi, ensemble (${await secondes(lea)} s)`);
await sam.locator('[data-reagir] [data-r="rire"]').click();
ok(await attendre(sam, async () => (await sam.locator('[data-ligne-temps] [data-tic="moi"]').count()) === 1, 4000), "son 😂 : un point sur la ligne");

// ═══ 📷 LA CAMÉRA DE SAM ; CHEZ LÉA, SA FIGURINE COPIE SA TÊTE EN DIRECT ═══
await sam.locator("[data-camera-haut]").click();
ok(await attendre(sam, async () => (await propose.count()) === 1, 4000), "« 📷 » en haut : la carte (jamais acceptée)");
await sam.locator("[data-allumer-camera]").click();
const figSam = sam.locator(".so-fig[data-moi]");
ok(await attendre(sam, async () => (await figSam.locator("[data-vivante]").count()) === 1 && (await sam.locator("[data-pastille-camera]").count()) === 1, 15000), "« Je l'allume » : sa figurine fait sa tête, la pastille est là");
await visageDe(sam, RIRE);
ok(await attendre(sam, async () => (await figSam.locator("[data-vivante]").getAttribute("data-expression")) === "rire"), "il rit : sa figurine rit");
const samChezLea = lea.locator(`.so-fig[data-q="${qui8(SAM.id)}"]`);
ok(await attendre(lea, async () => (await samChezLea.getAttribute("data-en-direct")) === "rire" && (await samChezLea.locator("[data-vivante]").getAttribute("data-expression")) === "rire", 15000), "👀 chez Léa : la figurine de Sam rit aussi, en direct");
await lea.screenshot({ path: `${D}/seance-pour-tous-3-en-direct.png` });
await visageDe(sam, NEUTRE);
ok(await attendre(lea, async () => (await samChezLea.getAttribute("data-en-direct")) === "neutre", 15000), "… puis son visage habituel, chez Léa aussi");

// ═══ 🎙️ SA VOIX, À LA SECONDE ═══
await sam.locator(".so-ecrire [data-micro]").scrollIntoViewIfNeeded();
const m = await sam.locator(".so-ecrire [data-micro]").boundingBox();
await sam.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
await sam.mouse.down();
ok(await attendre(sam, async () => (await sam.locator(".so-ecrire [data-enreg]").count()) === 1 && /Tu parles/.test(await texte(sam.locator("[data-note]"))), 3000), "🎙️ appuyé : « Tu parles », la barre d'enregistrement");
await sam.waitForTimeout(1800);
await sam.mouse.up();
ok(await attendre(sam, async () => /🎙️ Ta voix, à 0:\d\d : Léa l’écoutera à cette seconde/.test(await texte(sam.locator("[data-note]"))), 8000), `« ${await texte(sam.locator("[data-note]"))} »`);
ok(await attendre(sam, async () => (await sam.locator('[data-ligne-temps] [data-tic="moi"]').count()) >= 2, 4000), "… un point de plus sur sa ligne");
ok(await attendre(lea, async () => /🎙️ Un vocal à 0:\d\d/.test(await texte(lea.locator(".so-bulle"))), 12000), "chez Léa : « 🎙️ Un vocal à… · dans Ce qui s'est dit »");
await lea.locator("[data-dit]").click();
ok(await attendre(lea, async () => (await lea.locator("[data-feuille-dit] [data-ecouter]").count()) === 1 && /Sam 🎙️ un vocal/.test(await texte(lea.locator("[data-feuille-dit]")))), "… et « ▶ Écouter » dans « Ce qui s'est dit »");

ok(!(await sam.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)) && !(await lea.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "rien ne déborde");
ok(!/exemple/i.test((await sam.locator("body").innerText()) + (await lea.locator("body").innerText())), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout pour tous ✓");
process.exit(echecs ? 1 : 0);
