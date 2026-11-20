// ✨ MA PASSION À MOI, À L'ÉCRAN (le lot D9 de Découvrir, `docs/univers/decouvrir.md` section 23.2) — sur un iPhone,
// contre le faux Supabase et le faux YouTube (rien ne part chez Google).
//
// Dans « Tes passions », sous les vignettes : « ✨ Ta passion à toi ». Léa écrit « la bière » : « Choisis une autre
// passion ». Puis « La pêche à la mouche » : « ✨ « La pêche à la mouche » : ses vidéos arrivent dans ta télé. », la voilà
// avec son ✕. Dans sa télé du jour, une de ses vidéos arrive vite (« ✨ La pêche à la mouche » dans la barre, à la place
// du thème). ✕ : elle est enlevée. Ni débordement, ni erreur, ni le mot interdit.
import crypto from "node:crypto";
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

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
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const qui = (n, prenom) => ({ id: `d9d9d9d9-0000-4000-8000-0000000a30${String(n).padStart(2, "0")}`, jeton: `jeton-ma-passion-nav-000${n}`, prenom });
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
const panorama = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="3584" height="1024"><rect width="3584" height="1024" fill="#6a3a5a"/><rect y="700" width="3584" height="324" fill="#5a4030"/><rect x="1580" y="200" width="430" height="256" fill="#111"/><rect x="300" y="150" width="600" height="420" fill="#bfe3ff"/></svg>`,
  ),
)
  .webp({ quality: 80 })
  .toBuffer();
for (const m of ["", "-matin", "-nuit"]) await deposer(`pieces-duo/hangar/large/panorama${m}.webp`, panorama, "image/webp");
await json("pieces-duo/hangar/large/releve.json", { le: maintenant, ajuste: true, emplacements: { tele: [0.441, 0.195, 0.12, 0.25], cadres: [], places: [{ x: 0.5, y: 0.94, hauteur: 0.5 }] } });
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


const lea = await telephone(LEA);

// ═══ « TES PASSIONS » : ✨ TA PASSION À TOI ═══
await lea.goto(`${BASE}/univers/passions`, { waitUntil: "domcontentloaded" });
const section = lea.locator("[data-ma-passion]");
ok(await attendre(lea, async () => (await section.count()) === 1), "« Tes passions » : « ✨ Ta passion à toi », sous les vignettes");
ok(/pas dans la liste/.test(await texte(section)) && (await section.locator("[data-passion-perso]").count()) === 0, "pas encore de passion à soi");
await section.locator("[data-mots-passion]").fill("la bière");
await section.locator("[data-garder-passion]").click();
ok(await attendre(lea, async () => (await texte(section.locator("[data-note-passion]"))) === "Choisis une autre passion."), "« la bière » : « Choisis une autre passion. »");
await section.locator("[data-mots-passion]").fill("La pêche à la mouche");
await section.locator("[data-garder-passion]").click();
ok(await attendre(lea, async () => /✨ « La pêche à la mouche » : ses vidéos arrivent dans ta télé/.test(await texte(section.locator("[data-note-passion]")))), `« ${await texte(section.locator("[data-note-passion]"))} »`);
ok((await texte(section.locator("[data-passion-perso] b"))) === "✨ La pêche à la mouche" && (await section.locator("[data-enlever-passion]").count()) === 1 && (await texte(section.locator("[data-garder-passion]"))) === "Changer", "la voilà, avec son ✕ ; « Garder » devient « Changer »");
await section.scrollIntoViewIfNeeded();
await lea.screenshot({ path: `${D}/ma-passion-1.png` });
ok((await lea.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "« Tes passions » : rien ne déborde");

// ═══ DANS SA TÉLÉ DU JOUR ═══
await lea.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
const main = lea.locator(".td").first();
ok(await attendre(lea, async () => Boolean(await main.getAttribute("data-video"))), "sa télé du jour s'ouvre");
let vue = false;
for (let k = 0; k < 5 && !vue; k++) {
  vue = (await lea.locator("[data-perso]").count()) === 1;
  if (!vue) {
    const avant = await main.getAttribute("data-video");
    await lea.locator("[data-suivante]").click();
    await attendre(lea, async () => (await main.getAttribute("data-video")) !== avant, 4000);
  }
}
ok(vue && (await texte(lea.locator("[data-perso]"))) === "✨ La pêche à la mouche" && (await lea.locator("[data-theme]").count()) === 0, "une de ses vidéos arrive vite : « ✨ La pêche à la mouche » dans la barre, à la place du thème");
ok((await lea.locator("[data-lien-salon]").count()) === 0, "… sans salon ouvert (on y serait trop peu)");
await lea.screenshot({ path: `${D}/ma-passion-2-tele.png` });

// ═══ ✕ : ELLE L'ENLÈVE ═══
await lea.goto(`${BASE}/univers/passions`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await section.locator("[data-enlever-passion]").count()) === 1), "« Tes passions » : sa passion est là");
await section.locator("[data-enlever-passion]").click();
ok(await attendre(lea, async () => /Ta passion à toi est enlevée/.test(await texte(section.locator("[data-note-passion]"))) && (await section.locator("[data-passion-perso]").count()) === 0), "✕ : « Ta passion à toi est enlevée. »");
ok(!/exemple/i.test(await lea.evaluate(() => document.body.innerText)), "jamais le mot interdit");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nma passion à moi (à l'écran) : tout est bon");
process.exit(echecs ? 1 : 0);
