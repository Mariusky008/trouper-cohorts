// 🎙️ « LAISSER UN MOT AVEC MA FIGURINE », LOT 2 : LA SUITE DE LA VIDÉO DANS UNE SÉANCE, À L'ÉCRAN (`decouvrir.md`,
// section 38.7) — sur un iPhone, contre le faux Supabase, le faux YouTube et un faux lecteur de YouTube.
//
// Léa ouvre sa séance chez elle ; la première vidéo passe un moment (plus de 20 s) ; « ⏭ Suivante » : la télé continue,
// une carte « 🎙️ La suite de la vidéo » reste là pour celle d'avant. Un toucher : la suite (personne encore ; « Laisser un
// mot avec ma figurine » ; pas de compte à rebours : « Fermer »). « ✕ » la range. Une vidéo à peine vue : pas de carte.
// 🗣️ (section 38.8) Sam y a laissé un mot (sa voix : des syllabes et des silences) : quand sa figurine le dit, sa bouche
// s'ouvre sur les syllabes et se ferme dans les silences (sa tête « bouche ouverte », faite avec ses expressions).
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

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `5d5d5d5d-0000-4000-8000-0000005d10${String(n).padStart(2, "0")}`, jeton: `jeton-suite-salon-nav-00${n}`, prenom });
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
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);
// (📷 « tout pour tous », section 34 : la carte de la caméra est proposée une fois à chacun, s'il a ses expressions — « Pas maintenant »)
// (`vivante` : la réponse que l'écran attend — « mes expressions sont-elles faites ? » ; oui : la carte s'ouvre)
const reponseVivante = (p) => p.waitForResponse((r) => r.url().includes("/api/direct/tele-du-jour?vivante=1"), { timeout: 30000 }).catch(() => null);
const sansCarteCamera = async (p, attente) => {
  const r = await attente;
  const j = r ? await r.json().catch(() => ({})) : {};
  if (j.vivante && (await attendre(p, async () => (await p.locator("[data-proposer-camera]").count()) === 1, 5000))) await p.locator("[data-plus-tard]").click();
};


// ═══ 🗣️ SAM : SES TÊTES (LA BOUCHE OUVERTE COMPRISE), PUIS SON MOT SUR LA PREMIÈRE VIDÉO DE LÉA ═══
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
await fetch(`${BASE}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } });
const tetesSam = async () => (await lire(`${SAM.id}/calques/${empreinte(`${SAM.id}/perso/v1/assise.png`)}-expressions.json`)) ?? {};
for (let k = 0; k < 150 && !(await tetesSam()).le; k++) await new Promise((fini) => setTimeout(fini, 400));
ok(Boolean((await tetesSam()).tetes?.parle), "Sam : ses têtes sont faites, la bouche ouverte comprise");
// (sa voix : quatre syllabes de 0,3 s, séparées de silences de 0,3 s — un vrai son, que le téléphone sait lire)
const wav = (() => {
  const f = 16000;
  const n = Math.round(f * 2.4);
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(f, 24);
  b.writeUInt32LE(f * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / f;
    const fort = Math.floor(t / 0.3) % 2 === 0;
    b.writeInt16LE(fort ? Math.round(Math.sin(2 * Math.PI * 220 * t) * 18000) : 0, 44 + i * 2);
  }
  return b;
})();
const vLea = (await (await fetch(`${BASE}/api/direct/tele-du-jour`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json()).tele?.videos?.[0]?.id;
const motSam = await (await fetch(`${BASE}/api/direct/mots-video`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "publier", id: vLea, son: `data:audio/wav;base64,${wav.toString("base64")}`, duree: 2.4, accord: true }) })).json();
ok(motSam.ok === true, `Sam laisse un mot sur la première vidéo de Léa (${vLea})`);

// ═══ LÉA OUVRE SA SÉANCE ═══
const lea = await ouvrir(LEA);
const vivanteLea = reponseVivante(lea);
await lea.goto(`${BASE}/univers/salons?chez=moi&v=${Date.now()}`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea);
const seance = lea.locator(".so[data-salon]");
ok(await attendre(lea, async () => /^chez-/.test((await seance.getAttribute("data-salon")) ?? "") && (await seance.getAttribute("data-hote")) === "1", 45000), "chez elle : la séance (elle en est l'hôte)");
await sansCarteCamera(lea, vivanteLea);
const v0 = await lea.locator(".so-tele").getAttribute("data-tele");
ok(await attendre(lea, async () => (await lea.locator(".faux-yt").getAttribute("data-yt")) === v0), `la première vidéo passe (${v0})`);
ok((await lea.locator("[data-carte-suite]").count()) === 0, "pas encore de carte");
await lea.waitForTimeout(21_000);

// ═══ « ⏭ SUIVANTE » : LA CARTE DE CELLE D'AVANT ═══
await lea.locator("[data-commandes] [data-suivante]").click();
ok(await attendre(lea, async () => (await lea.locator(".so-tele").getAttribute("data-tele")) !== v0), "« ⏭ Suivante » : la télé continue");
const carte = lea.locator("[data-carte-suite]");
ok(await attendre(lea, async () => (await carte.getAttribute("data-carte-suite")) === v0, 8000), "… une carte pour la vidéo d'avant");
ok(/🎙️ La suite de la vidéo/.test(await texte(carte)) && /écoute leurs mots, laisse le tien/.test(await texte(carte)), `« ${await texte(carte)} »`);
ok(!(await deborde(lea)), "rien ne déborde");
await lea.screenshot({ path: `${D}/suite-salon-0-carte.png` });
await carte.locator("[data-ouvrir-suite]").click();
const suite = lea.locator(`[data-suite-video="${v0}"]`);
ok(await attendre(lea, async () => (await suite.locator(`[data-mot="${qui8(SAM.id)}"]`).count()) === 1, 15000), "un toucher : sa suite (le mot de Sam)");
ok((await suite.locator("[data-laisser-mot]").count()) === 1, "… « Laisser un mot avec ma figurine »");
ok((await texte(suite.locator("[data-suite-suivante]"))) === "Fermer", "… pas de compte à rebours : « Fermer »");
await lea.waitForTimeout(1500);
ok((await texte(suite.locator("[data-suite-suivante]"))) === "Fermer" && (await suite.count()) === 1, "… elle reste ouverte");
ok(!(await deborde(lea)), "rien ne déborde");
await lea.screenshot({ path: `${D}/suite-salon-1-suite.png` });

// ═══ 🗣️ LA BOUCHE DE SAM SUIT SA VOIX ═══
const figSam = suite.locator(`[data-mot="${qui8(SAM.id)}"] [data-vivante]`);
ok((await figSam.count()) === 1 && (await figSam.locator('img[data-tete="parle"]').count()) === 1, "sa figurine vivante, avec sa tête « bouche ouverte » prête");
await suite.locator(`[data-ecouter="${qui8(SAM.id)}"]`).click();
const vues = [];
const fin = Date.now() + 2600;
while (Date.now() < fin) {
  vues.push((await figSam.getAttribute("data-bouche").catch(() => null)) === "1");
  await lea.waitForTimeout(40);
}
let changements = 0;
for (let i = 1; i < vues.length; i++) if (vues[i] !== vues[i - 1]) changements++;
ok(vues.some((x) => x) && vues.some((x) => !x), `pendant son mot : sa bouche s'ouvre et se ferme (${vues.filter((x) => x).length} ouverte sur ${vues.length})`);
ok(changements >= 3 && changements <= 14, `… sur ses syllabes, pas en rythme (${changements} changements pour quatre syllabes)`);
await lea.waitForTimeout(800);
ok((await figSam.getAttribute("data-bouche")) !== "1", "son mot fini : la bouche fermée");
await suite.locator("[data-suite-suivante]").click();
ok(await attendre(lea, async () => (await lea.locator("[data-suite-video]").count()) === 0 && (await lea.locator("[data-carte-suite]").count()) === 0), "« Fermer » : la suite et la carte s'en vont");

// ═══ UNE VIDÉO À PEINE VUE : PAS DE CARTE ═══
const v1 = await lea.locator(".so-tele").getAttribute("data-tele");
await lea.locator("[data-commandes] [data-suivante]").click();
ok(await attendre(lea, async () => (await lea.locator(".so-tele").getAttribute("data-tele")) !== v1), "« ⏭ Suivante » tout de suite");
await lea.waitForTimeout(1500);
ok((await lea.locator("[data-carte-suite]").count()) === 0, "… une vidéo à peine vue : pas de carte");

ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
