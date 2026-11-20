// ⭐ JAMAIS SEUL DEVANT UNE VIDÉO, À L'ÉCRAN (le lot D2b de Découvrir, première partie, `docs/univers/decouvrir.md`
// section 21) — sur un iPhone, contre le faux Supabase, le faux YouTube (la sélection de la nuit) et un faux lecteur de
// YouTube qu'on avance à la main (rien ne part chez Google).
//
// Sam a vu la vidéo hier : 😂 à 5 s, 😮 à 8 s, ❤️ à 12 s ; Inès l'a vue sans réagir. Léa ouvre sa télé du jour : « 👥 2
// proches l'ont vue : ils regardent avec toi » ; Sam et Inès assis à côté d'elle, leur prénom, « a vu à l'instant » ; la
// frise de leurs réactions. Elle allume : à 5 s, la figurine de Sam rit (😂 qui jaillit) ; un saut en avant ne rejoue
// rien ; revenir en arrière : 😮 noté à sa place (ce que l'appli comprend seule), puis le 😮 de Sam à 8 s. Elle touche 😂 à
// 12,5 s : « 🫶 En même temps que Sam ! » ; ❤️ à 40 s : « noté à 0:40 : Sam et Inès le verront ». Sur la pièce : un toucher
// (😂), deux (❤️), un appui long (😮) — notés à leur seconde. ⏭ Suivante à 3 s : 😴, et sa vue. Ni débordement, ni
// erreur, ni le mot interdit.
import crypto from "node:crypto";
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
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
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const qui = (n, prenom) => ({ id: `d2b1d2b1-0000-4000-8000-0000000b10${String(n).padStart(2, "0")}`, jeton: `jeton-tele-ensemble-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const INES = qui(3, "Inès");
const GENS = [LEA, SAM, INES];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
// (leurs figurines du nouveau style, assises : Ma maison et la télé du jour les posent dans la pièce)
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
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, INES.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${INES.id}/proches.json`, { ids: [LEA.id] });
// (sa pièce : le hangar, sa télé relevée)
const panorama = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="3584" height="1024"><rect width="3584" height="1024" fill="#6a3a5a"/><rect y="700" width="3584" height="324" fill="#5a4030"/><rect x="1580" y="200" width="430" height="256" fill="#111"/></svg>`))
  .webp({ quality: 80 })
  .toBuffer();
for (const m of ["", "-matin", "-nuit"]) await deposer(`pieces-duo/hangar/large/panorama${m}.webp`, panorama, "image/webp");
await json("pieces-duo/hangar/large/releve.json", { le: maintenant, ajuste: true, emplacements: { tele: [0.441, 0.195, 0.12, 0.25], cadres: [], places: [{ x: 0.5, y: 0.94, hauteur: 0.5 }] } });
const choisie = await fetch(`${BASE}/api/direct/ma-piece`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}; ${COOKIE_ADMIN}` }, body: JSON.stringify({ action: "choisir", piece: "hangar" }) });
ok(choisie.ok, `sa pièce : le hangar (${choisie.status})`);
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée");

// (Sam a vu la première vidéo de Léa : 😂 à 5 s, 😮 à 8 s, ❤️ à 12 s ; Inès l'a vue sans réagir)
const route = `${BASE}/api/direct/tele-du-jour`;
const poster = (x, corps) => fetch(route, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) }).then((r) => r.json().catch(() => ({})));
const V = (await (await fetch(route, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json()).tele?.videos?.[0];
ok(Boolean(V?.id), `la première vidéo de Léa (${V?.id})`);
for (const [t, sorte] of [[5, "rire"], [8, "oh"], [12, "coeur"]]) await poster(SAM, { action: "reagir", id: V.id, t, sorte });
await poster(INES, { action: "vue", id: V.id, secondes: 30 });
await new Promise((r) => setTimeout(r, 600));
const fichier = (x) => lire(`decouvrir/reactions/${V.id}/${qui8(x.id)}.json`);

// ─── un faux lecteur de YouTube : il passe la vidéo qu'on lui donne, et l'on règle sa seconde d'ici (`__lecteur.t`) ───
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this; self.o = o; self.t = 0;
  self.loadVideoById = function (id) { d.dataset.yt = id; self.t = 0; };
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
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 2000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const seconde = (t) => p.evaluate((x) => (window.__lecteur.t = x), t);
const reactionsDeLea = async () => ((await fichier(LEA))?.reactions ?? []).map((r) => `${r.t}:${r.sorte}:${r.source}`);

// ═══ LÉA OUVRE SA TÉLÉ : SAM ET INÈS SONT LÀ ═══
await p.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".td").getAttribute("data-video")) === V.id, 15000), "sa télé du jour s'ouvre sur la vidéo");
ok(await attendre(async () => (await p.locator("[data-proche-assis]").count()) === 2), "Sam et Inès assis à côté d'elle");
ok(/2 proches l’ont vue : ils regardent avec toi/.test(await texte("[data-avec]")), `« ${await texte("[data-avec]")} »`);
const sam = p.locator(`[data-proche-assis="${SAM.cle}"]`);
ok((await sam.locator("img.td-proche").count()) === 1 && /Sam\s*a vu à l’instant/.test(await sam.locator(".td-qui").innerText()), "la figurine de Sam, son prénom, « a vu à l'instant »");
ok((await p.locator("[data-fil] span").count()) === 3, "la frise : ses trois réactions");
ok((await p.locator(".td-piece .td-figurine").count()) === 1, "et la sienne, au milieu");
ok(await p.locator('[data-reagir="rire"]').isDisabled(), "« Réagis » attend que la télé s'allume");

// ═══ ELLE ALLUME : À 5 S, SAM RIT ═══
await p.locator("[data-allumer]").click();
ok(await attendre(async () => (await p.evaluate(() => Boolean(window.__lecteur))) && !(await p.locator('[data-reagir="rire"]').isDisabled())), "allumée : « Réagis : 😂 ❤️ 😮 😱 😴 »");
await seconde(4.6);
await p.waitForTimeout(400);
await seconde(5.2);
ok(await attendre(async () => (await sam.locator("img.td-proche.a-rit").count()) === 1, 2000), "à 5 s : la figurine de Sam rit");
ok((await sam.locator(".td-pop").innerText().catch(() => "")) === "😂", "… et son 😂 jaillit");
await p.screenshot({ path: `${D}/tele-ensemble-1-sam-rit.png` });

// ═══ UN SAUT EN AVANT NE REJOUE RIEN ; REVENIR EN ARRIÈRE : 😮 ═══
await p.waitForTimeout(1700);
await seconde(20);
await p.waitForTimeout(500);
ok((await sam.locator("img.td-proche.a-saute, img.td-proche.a-pulse").count()) === 0, "un saut à 20 s : rien n'est rejoué (ni le 😮 de 8 s, ni le ❤️ de 12 s)");
await seconde(7.5);
ok(await attendre(async () => (await reactionsDeLea()).includes("7.5:oh:implicite"), 4000), "revenir en arrière : 😮 noté à 7,5 s (ce que l'appli comprend seule)");
await p.waitForTimeout(300);
await seconde(8.2);
ok(await attendre(async () => (await sam.locator("img.td-proche.a-saute").count()) === 1, 2000), "puis à 8 s, le 😮 de Sam (un sursaut)");

// ═══ ELLE RÉAGIT : AU MÊME MOMENT QUE SAM ═══
await seconde(12.5);
await p.waitForTimeout(300);
await p.locator('[data-reagir="rire"]').click();
ok(await attendre(async () => /En même temps que Sam/.test(await texte("[data-ensemble]")), 2000), `« ${await texte("[data-ensemble]")} »`);
ok(await attendre(async () => (await reactionsDeLea()).includes("12.5:rire:rangee"), 4000), "son 😂 noté à 12,5 s");
await p.screenshot({ path: `${D}/tele-ensemble-2-ensemble.png` });
await seconde(40);
await p.waitForTimeout(300);
await p.locator('[data-reagir="coeur"]').click();
ok(await attendre(async () => /❤️ noté à 0:40 : Sam et Inès le verront à cette seconde/.test(await texte("[data-note]")), 2000), `« ${await texte("[data-note]")} »`);

// ═══ LES GESTES SANS VISER, SUR LA PIÈCE ═══
const piece = p.locator(".td-piece");
const toucher = async () => {
  await piece.dispatchEvent("pointerdown");
  await p.waitForTimeout(60);
  await piece.dispatchEvent("pointerup");
};
await seconde(50);
await toucher();
ok(await attendre(async () => (await reactionsDeLea()).includes("50:rire:geste"), 4000), "un toucher sur la pièce : 😂 à 50 s");
await p.waitForTimeout(400);
await seconde(60);
await toucher();
await p.waitForTimeout(120);
await toucher();
ok(await attendre(async () => (await reactionsDeLea()).includes("60:coeur:geste"), 4000), "deux touchers : ❤️ à 60 s");
ok(!(await reactionsDeLea()).includes("60:rire:geste"), "… et pas de 😂 en plus");
await p.waitForTimeout(400);
await seconde(70);
await piece.dispatchEvent("pointerdown");
await p.waitForTimeout(700);
await piece.dispatchEvent("pointerup");
ok(await attendre(async () => (await reactionsDeLea()).includes("70:oh:geste"), 4000), "un appui long : 😮 à 70 s");

// ═══ ⏭ SUIVANTE À 3 S : 😴, ET SA VUE ═══
for (const [n, c] of [["Léa", p]]) {
  ok((await c.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, `${n} : rien ne déborde`);
  ok(!/exemple/i.test(await c.evaluate(() => document.body.innerText)), `${n} : jamais le mot interdit`);
}
await seconde(3);
await p.locator("[data-suivante]").click();
ok(await attendre(async () => (await reactionsDeLea()).includes("3:bof:implicite") && (await fichier(LEA))?.vu > 0, 5000), "⏭ Suivante à 3 s : 😴 noté, et sa vue (Sam la verra assise à côté de lui)");
ok(await attendre(async () => (await p.locator(".td").getAttribute("data-video")) !== V.id), "la vidéo suivante arrive");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\njamais seul devant une vidéo (à l'écran) : tout est bon");
process.exit(echecs ? 1 : 0);
