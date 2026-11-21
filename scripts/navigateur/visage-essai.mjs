// 📷 LE SALON D'ESSAI DU VISAGE, À L'ÉCRAN (le lot V0 ; `app/univers/visage`, `docs/univers/decouvrir.md` section 28) —
// sur un iPhone, contre le faux Supabase, un faux lecteur de YouTube, une fausse caméra et une fausse lecture du visage
// (le module de MediaPipe remplacé : il rend ce que l'essai lui dit). Jamais un vrai visage : des ronds de couleur.
//
// Trois figurines prêtes (Léa, « c'est moi » ; Sam ; Inès). Le salon : la vidéo de l'humour du jour en haut, le gradin
// dessous, Léa au premier rang au milieu (« Toi »). La vidéo avance : Sam et Inès réagissent (leur piste), et à un moment
// ils rient ensemble. « 📷 Ma figurine fait ma tête » : la caméra s'ouvre ; un sourire, la figurine sourit ; un rire,
// elle rit ; la tête penchée, la sienne aussi. Ses réactions sont notées pendant que la vidéo passe ; « ▶ Revoir avec mes
// réactions » : la vidéo repart, sa figurine rejoue son rire à la bonne seconde (la caméra ne compte plus). La page de
// l'administrateur : les trois, leurs cinq expressions, « ▶ Ouvrir le salon d'essai » ; ajouter Elise — la zone « 📷
// Choisir sa photo » se voit, « Ajouter » sans photo le dit, la photo choisie montre sa vignette. Ni débordement, ni le
// mot « exemple », ni erreur.
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

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
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
await json(`decouvrir/selection/${jour}/humour.json`, { videos: [{ id: "abcdefghijk", titre: "Un sketch", chaine: "La chaîne d'essai", duree: 120 }], le: new Date().toISOString() });

// (trois figurines prêtes : un corps 400 × 600 — le fauteuil, le buste, la tête habituelle ; la tête découpée ; cinq
// têtes d'expression de couleurs différentes, de la même taille)
const svg = (w, h, corps) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${corps}</svg>`)).png().toBuffer();
const COULEURS = { sourire: "#ffd23f", rire: "#ff8c42", surprise: "#7fd1ff", bof: "#9a9a9a", grimace: "#5fd068" };
const TETE = [60, 12, 280, 270];
const GENS = [
  { id: "a1a1a1a1a1a1", prenom: "Léa", moi: true, fauteuil: "#c0392b" },
  { id: "b2b2b2b2b2b2", prenom: "Sam", moi: false, fauteuil: "#2a6fb0" },
  { id: "c3c3c3c3c3c3", prenom: "Inès", moi: false, fauteuil: "#7b4fb0" },
];
const visage = (fond) => `<circle cx="140" cy="140" r="125" fill="${fond}"/><circle cx="95" cy="120" r="12" fill="#222"/><circle cx="185" cy="120" r="12" fill="#222"/>`;
for (const [k, x] of GENS.entries()) {
  const d = `essais-visage/${x.id}`;
  const corps = await svg(400, 600, `<rect x="20" y="300" width="360" height="300" rx="50" fill="${x.fauteuil}"/><rect x="110" y="250" width="180" height="200" rx="40" fill="#6b4a3a"/><g transform="translate(60 12)">${visage("#f0c8a0")}</g>`);
  await deposer(`${d}/figurine.png`, corps, "image/png");
  await deposer(`${d}/corps.png`, corps, "image/png");
  await deposer(`${d}/tete.png`, await svg(280, 270, visage("#f0c8a0")), "image/png");
  for (const [e, c] of Object.entries(COULEURS)) await deposer(`${d}/tete-${e}.png`, await svg(280, 270, visage(c)), "image/png");
  await json(`${d}/reperes.json`, { ratio: 0.667, reperes: { tete: [0.15, 0.02, 0.7, 0.45], pivot: [0.5, 0.45], bouche: [0.5, 0.3], joues: [[0.35, 0.3], [0.65, 0.3]] }, boite: [0, 0, 400, 600], tetePx: TETE, taille: [400, 600] });
  await json(`${d}/fiche.json`, { id: x.id, prenom: x.prenom, moi: x.moi, le: new Date(Date.now() - (3 - k) * 60_000).toISOString(), accord: true });
}

const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this; self.t = 0;
  self.getCurrentTime = function () { return self.t; };
  self.getDuration = function () { return 120; };
  self.seekTo = function (s) { self.t = s; };
  self.playVideo = function () { d.dataset.joue = "1"; };
  self.destroy = function () { d.remove(); };
  window.__lecteur = self;
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
// (la fausse lecture du visage : la même adresse que la vraie, elle rend window.__visage)
const FAUX_MEDIAPIPE = `
export const FilesetResolver = { forVisionTasks: async () => ({}) };
export const FaceLandmarker = { createFromOptions: async () => ({ detectForVideo: () => window.__visage || { faceBlendshapes: [], faceLandmarks: [] }, close() {} }) };
`;
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["camera"] });
await ctx.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@[\d.]+\/vision_bundle\.mjs$/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: FAUX_MEDIAPIPE }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const expression = (id) => p.locator(`[data-figurine="${id}"]`).getAttribute("data-expression");
const aT = async (t) => {
  await p.evaluate((x) => (window.__lecteur.t = x), t);
  await p.waitForTimeout(260);
};
// (la lecture du visage : des « blendshapes » et, pour la tête, les points des yeux et du nez)
const visageDe = (formes, penche = 0) =>
  p.evaluate(
    ({ formes, penche }) => {
      const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      points[33] = { x: 0.4, y: 0.45 + penche, z: 0 };
      points[263] = { x: 0.6, y: 0.45 - penche, z: 0 };
      points[1] = { x: 0.5, y: 0.55, z: 0 };
      window.__visage = { faceBlendshapes: [{ categories: Object.entries(formes).map(([categoryName, score]) => ({ categoryName, score })) }], faceLandmarks: [points] };
    },
    { formes, penche },
  );

// ═══ LE SALON ═══
await p.goto(`${BASE}/univers/visage`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".sv-fig").count()) === 3 && (await p.locator('.faux-yt[data-yt="abcdefghijk"]').count()) === 1, 30000), "le salon d'essai : la vidéo de l'humour du jour, les trois figurines");
ok(await attendre(async () => (await p.locator(".sv-fig .sv-corps").evaluateAll((l) => l.every((i) => i.complete && i.naturalWidth > 0))) && (await p.locator("[data-tete]").count()) === 15), "… leurs corps chargés, et leurs cinq expressions chacune, prêtes d'avance");
const piece = await p.locator(".sv-piece").boundingBox();
const lea = await p.locator('[data-figurine="a1a1a1a1a1a1"]').boundingBox();
ok(lea && Math.abs(lea.x + lea.width / 2 - piece.x - piece.width * 0.375) < 6 && /Toi/.test(await texte(p.locator('[data-figurine="a1a1a1a1a1a1"]'))), `Léa au premier rang, au milieu : « Toi » (${Math.round(lea?.x + lea?.width / 2 - piece.x)} pt)`);
// (📷 21 novembre 2026 : sous les expressions, le corps sans sa tête habituelle — fait ici pour ces figurines découpées
// avant ; le haut de la boîte de la tête effacé : une expression un peu décalée ne laisse plus voir l'autre tête)
const sansTete = await fetch(`${STOCK}/figurines-clients/essais-visage/a1a1a1a1a1a1/corps-sans-tete.png`);
const px = sansTete.status === 200 ? await sharp(Buffer.from(await sansTete.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true }) : null;
const alphaA = (x, y) => px.data[(y * px.info.width + x) * 4 + 3];
ok(px && alphaA(TETE[0] + 140, TETE[1] + 140) === 0 && alphaA(200, 500) > 0, "le corps sans sa tête : le visage effacé du corps, le fauteuil là (rien ne double sous une expression)");

// ═══ LES AMIS RÉAGISSENT AU FIL DE LA VIDÉO ═══
const vus = new Set();
let ensemble = null;
for (let t = 0; t < 62; t += 1) {
  await aT(t);
  const [s, i] = [await expression("b2b2b2b2b2b2"), await expression("c3c3c3c3c3c3")];
  if (s !== "neutre") vus.add(s);
  if (i !== "neutre") vus.add(i);
  if (ensemble === null && s === "rire" && i === "rire") ensemble = t;
}
ok(vus.size >= 2, `la vidéo avance : Sam et Inès réagissent (${[...vus].join(", ")})`);
ok(ensemble !== null, `… et à ${ensemble} s, ils rient ensemble (le fou rire du salon)`);
await aT(ensemble ?? 0);
ok((await p.locator(".sv-pop").count()) >= 1 && (await p.locator('[data-figurine="b2b2b2b2b2b2"] img.vue[data-tete="rire"]').count()) === 1, "… la tête du rire, et l'émoji qui saute au-dessus");
await p.screenshot({ path: `${D}/visage-essai-1-salon.png` });

// ═══ 📷 MA FIGURINE FAIT MA TÊTE ═══
await aT(0);
ok(/La caméra reste sur ton téléphone/.test(await texte(p.locator("[data-etat-camera]"))), "avant la caméra : « La caméra reste sur ton téléphone : on ne garde que tes réactions, jamais ton image. »");
await p.locator("[data-camera]").click();
ok(await attendre(async () => /Je vois/.test(await texte(p.locator("[data-etat-camera]"))) && (await p.locator(".sv-miroir.vue").count()) === 1), "« 📷 Ma figurine fait ma tête » : la caméra s'ouvre (son petit miroir), la lecture du visage tourne");
// (la vidéo passe : elle avance toute seule)
await p.evaluate(() => (window.__avance = setInterval(() => (window.__lecteur.t += 0.2), 200)));
await visageDe({ mouthSmileLeft: 0.8, mouthSmileRight: 0.8, jawOpen: 0.1 });
ok(await attendre(async () => (await expression("a1a1a1a1a1a1")) === "sourire" && /Je vois : 😊/.test(await texte(p.locator("[data-etat-camera]"))), 4000), "un sourire : sa figurine sourit (« Je vois : 😊 »)");
await p.waitForTimeout(800);
await visageDe({ mouthSmileLeft: 0.85, mouthSmileRight: 0.85, jawOpen: 0.6 }, 0.05);
const tRire = await p.evaluate(() => window.__lecteur.t);
ok(await attendre(async () => (await expression("a1a1a1a1a1a1")) === "rire", 4000), "un rire : elle rit");
const tourne = await p.locator('[data-figurine="a1a1a1a1a1a1"] .sv-tete').evaluate((e) => e.style.transform);
ok(/rotate\((?!0\.0deg)[\d.]+deg\)/.test(tourne) && Math.abs(parseFloat(tourne.split("rotate(")[1])) <= 12.1, `la tête penchée : la sienne aussi, 12° au plus (${tourne})`);
await p.screenshot({ path: `${D}/visage-essai-2-ma-tete.png` });
await p.waitForTimeout(2200);
await visageDe({ _neutral: 0.9, mouthSmileLeft: 0.02, mouthSmileRight: 0.02, jawOpen: 0.03 });
ok(await attendre(async () => (await expression("a1a1a1a1a1a1")) === "neutre", 4000), "le visage habituel : sa figurine aussi");
await p.waitForTimeout(600);
ok(await attendre(async () => /\(\d+\)/.test(await texte(p.locator("[data-revoir]"))) && (await p.locator("[data-revoir]").isEnabled())), `ses réactions notées pendant que la vidéo passe (« ${await texte(p.locator("[data-revoir]"))} »)`);

// ═══ REVOIR AVEC MES RÉACTIONS ═══
await p.evaluate(() => clearInterval(window.__avance));
await p.locator("[data-revoir]").click();
ok(await attendre(async () => (await p.locator("[data-direct]").count()) === 1 && /comme tes proches la verront/.test(await texte(p.locator(".sv-ligne")))), "« ▶ Revoir avec mes réactions » : la vidéo repart, « comme tes proches la verront »");
await visageDe({ mouthSmileLeft: 0.8, mouthSmileRight: 0.8, jawOpen: 0.1 });
await aT(tRire + 1.4);
ok(await attendre(async () => (await expression("a1a1a1a1a1a1")) === "rire", 3000), `… à la seconde de son rire (${tRire.toFixed(1)} s), sa figurine rejoue son rire — la caméra ne compte plus`);
await p.screenshot({ path: `${D}/visage-essai-3-revoir.png` });
ok(!(await p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "pas de débordement");
ok(!/exemple/i.test(await p.locator("body").innerText()), "jamais le mot « exemple »");

// ═══ LA PAGE DE L'ADMINISTRATEUR ═══
const a = await ctx.newPage();
a.on("pageerror", (e) => erreurs.push(String(e)));
await a.goto(`${BASE}/admin/humain/visage`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await a.locator("[data-personne]").count()) === 3, 20000), "la page de l'administrateur : les trois personnes");
const carteLea = a.locator('[data-personne="a1a1a1a1a1a1"]');
ok((await carteLea.getAttribute("data-faites")) === "7" && (await carteLea.locator("[data-expression]").count()) === 5 && /c’est moi/.test(await texte(carteLea)) && (await a.locator('[data-salon-essai][href="/univers/visage"]').count()) === 1, "Léa : les sept étapes, ses cinq expressions, « c'est moi » ; « ▶ Ouvrir le salon d'essai »");
await a.screenshot({ path: `${D}/visage-essai-4-atelier.png`, fullPage: true });
// (ajouter quelqu'un : la zone de la photo se voit ; « Ajouter » dit ce qui manque, au lieu de ne pas répondre)
const form = a.locator("[data-ajouter-personne]");
ok(/Choisir sa photo/.test(await texte(form.locator("[data-zone-photo]"))) && (await form.locator("[data-zone-photo]").isVisible()), "« Ajouter une personne » : la zone « 📷 Choisir sa photo » se voit");
await form.locator("[data-prenom]").fill("Elise");
await form.locator("[data-accord]").check();
await form.locator('button[type="submit"]').click();
ok(await attendre(async () => /Choisis d’abord sa photo/.test(await texte(form.locator("[data-manque]"))), 4000), "sans photo, « Ajouter » le dit : « Choisis d'abord sa photo »");
const portrait = await sharp({ create: { width: 600, height: 800, channels: 3, background: "#d4a373" } }).png().toBuffer();
await form.locator("[data-photo]").setInputFiles({ name: "elise.png", mimeType: "image/png", buffer: portrait });
ok(await attendre(async () => (await form.locator("[data-vignette-photo]").count()) === 1 && /Sa photo est choisie/.test(await texte(form.locator("[data-zone-photo]")))), "la photo choisie : sa vignette, « ✓ Sa photo est choisie »");
await a.screenshot({ path: `${D}/visage-essai-5-ajouter.png` });
await form.locator('button[type="submit"]').click();
ok(await attendre(async () => (await a.locator("[data-personne]").count()) === 4 && /« Elise » est dans l’essai/.test(await texte(a.locator("[data-note-visage]")))), "« Ajouter » : Elise est dans l'essai (quatre personnes)");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs[0]})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
