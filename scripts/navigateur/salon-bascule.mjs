// 🛋️ LA BASCULE VERS LE SALON DU DUO (`docs/univers/salon-du-duo.md`, 11.23 ; le lot S8) — l'interrupteur
// `SALON_DU_DUO` (allumé le 19 novembre 2026 ; ici freiné, `CLIKME_SALON_DU_DUO=0`, comme toute la CI) et l'essai d'un
// téléphone (`/collection?salon=1`), sur un téléphone, contre le faux Supabase.
//
// Sans rien : la conversation s'ouvre dans l'ancien écran. `/collection?salon=1` : le téléphone le retient (l'adresse
// redevient propre) ; la même carte ouvre le salon du duo, par-dessus la page (le prénom, les deux figurines posées, la
// bulle de Sam) ; « ‹ » le referme sur la liste ; la notification (`?parler=<clé>`) l'ouvre tout droit ; le retour du
// téléphone le referme ; le toucher est marqué (la vitesse du salon). `?salon=0` : l'ancien écran revient. 🔀 ALLUMÉ
// (une seconde app, sans frein) : sans rien, la même carte ouvre le salon ; `?salon=0` reste une porte de sortie. Ni
// erreur, ni débordement, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { lancerSecondeApp } from "../seconde-app.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f48${String(n).padStart(2, "0")}`, jeton: `jeton-salon-bascule-nav-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of [LEA, SAM].entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: maintenant, age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
// (le duo s'est déjà installé dans le salon ; la pièce, ses places relevées)
await json(`fils/${[LEA.id, SAM.id].sort().join("_")}/piece.json`, { piece: "salon", le: maintenant });
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }] } });
const assise = (couleur) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="330" rx="200" ry="190" fill="${couleur}"/><rect x="355" y="500" width="90" height="70" fill="${couleur}"/><rect x="160" y="550" width="480" height="560" rx="50" fill="#5a3a2a"/></svg>`))
    .png()
    .toBuffer();
const poster = (q, corps) => fetch(`${BASE}/api/direct/${corps.action === "calques" ? "salon" : "proches"}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(x === LEA ? "#e0a070" : "#7090e0"), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  ok((await poster(x, { action: "calques" })).status === 200, `les calques de ${x.prenom}, faits`);
}
ok((await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "J’ai trouvé le resto 🍝" })).status === 200, "Sam écrit à Léa");
const nonLus = async () => ((await (await fetch(`${BASE}/api/direct/proches`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json()).proches ?? []).find((x) => x.cle === SAM.cle)?.nonLus ?? -1;
const gestesVus = async () => (await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/gestes-vus.json`)).json().catch(() => ({})))[[LEA.id, SAM.id].sort().join("_")] ?? 0;

// ═══ ⚡ LE PRÉCHARGEMENT NE MARQUE RIEN ; L'OUVERTURE, SI ═══
ok((await poster(SAM, { action: "geste", cle: LEA.cle, type: "geste", quoi: "bisou" })).status === 200, "Sam laisse un bisou");
const gv0 = await gestesVus();
const apercu = await fetch(`${BASE}/api/direct/proches?ouvrir=${SAM.cle}&apercu=1`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
const ap = await apercu.json();
ok(apercu.status === 200 && ap.ouverture?.fil?.messages?.some((m) => m.nouveau) && ap.ouverture?.vivant?.gestes?.some((g) => g.nouveau), "?ouvrir=…&apercu=1 : la conversation, son message et son bisou nouveaux");
ok((await nonLus()) === 1 && (await gestesVus()) === gv0, "… sans rien marquer (toujours 1 non-lu, le bisou pas vu)");
const lu = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}` }, body: JSON.stringify({ action: "lu", cle: SAM.cle }) });
ok(lu.status === 200 && (await nonLus()) === 0 && (await gestesVus()) > gv0, "{ action: \"lu\" } : lu (0 non-lu, le bisou vu)");
const etranger = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}` }, body: JSON.stringify({ action: "lu", cle: "0123456789abcdef" }) });
ok(etranger.status === 404, `… un inconnu : refusé (${etranger.status})`);

const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 5000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const carte = `#o-proches .pr-carte[data-cle="${SAM.cle}"] .pr-mini`;
async function laListe(adresse) {
  await p.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(carte, { timeout: 60000 });
}
const salonPret = () => attendre(async () => (await p.locator('[data-salon-du-duo] .sd-scene[data-pret][data-calques="poses"] .sc-fig').count()) === 2, 30000);

// ═══ L'INTERRUPTEUR ÉTEINT : L'ANCIEN ÉCRAN ═══
await laListe(`/collection?v=${Date.now()}#proches`);
await p.locator(carte).click();
ok(await attendre(async () => (await p.locator(".pr-plein .pr-scene").count()) === 1), "sans rien : la conversation s'ouvre dans l'ancien écran");
ok((await p.locator("[data-salon-du-duo]").count()) === 0, "… et pas dans le salon");

// ═══ L'ESSAI DE CE TÉLÉPHONE : ?salon=1 ═══
ok((await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Coucou Léa ! Tu viens ce soir ?" })).status === 200, "Sam écrit encore");
const apercus = [];
p.on("request", (r) => /[?&]apercu=1/.test(r.url()) && apercus.push(r.url()));
await laListe(`/collection?salon=1&v=${Date.now()}#proches`);
const adresse = new URL(p.url());
ok(!adresse.searchParams.has("salon") && adresse.hash === "#proches", `l'adresse redevient propre (${adresse.pathname}${adresse.search}${adresse.hash})`);
ok((await p.evaluate(() => localStorage.getItem("clikme-salon"))) === "1", "le téléphone s'en souvient");
ok(await attendre(async () => apercus.some((u) => u.includes(SAM.cle)), 10000), "⚡ la conversation de Sam, préchargée dans un temps mort");
ok((await nonLus()) === 1, "… sans la marquer lue (toujours 1 non-lu)");
await p.locator(carte).click();
ok(await salonPret(), "la même carte ouvre le salon du duo : la pièce, les deux figurines posées");
ok((await texte("[data-salon-du-duo] .sd-qui b")) === "Sam", `en haut : Sam (${await texte("[data-salon-du-duo] .sd-qui b")})`);
ok((await p.locator(".pr-plein").count()) === 0, "… et plus l'ancien écran");
ok(await attendre(async () => (await texte("[data-salon-du-duo] .sd-bulle.autre")) === "Coucou Léa ! Tu viens ce soir ?"), "la bulle de Sam, dans la scène");
ok(await attendre(async () => (await nonLus()) === 0), "ouverte pour de bon : lue");
const couvre = await p.evaluate(() => {
  const r = document.querySelector("[data-salon-du-duo]").getBoundingClientRect();
  const z = Number(getComputedStyle(document.querySelector("[data-salon-du-duo]")).zIndex);
  return { r: [r.left, r.top, r.width, r.height].map(Math.round), z, fixe: getComputedStyle(document.querySelector("[data-salon-du-duo]")).position };
});
ok(couvre.fixe === "fixed" && couvre.r[0] === 0 && couvre.r[1] === 0 && couvre.r[2] === 390 && couvre.r[3] === 844 && couvre.z >= 30, `posé sur la page entière, par-dessus le menu (${JSON.stringify(couvre)})`);
ok((await p.evaluate(() => performance.getEntriesByName("salon:toucher").length)) >= 1, "le toucher est marqué (⚡ la vitesse du salon)");
ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "pas de débordement");
await p.screenshot({ path: `${D}/salon-bascule-1-salon.png` });

// « ‹ » le referme sur la liste
await p.evaluate(() => (window.__memePage = true));
await p.locator("[data-salon-du-duo] .sd-retour").click();
ok(await attendre(async () => (await p.locator("[data-salon-du-duo]").count()) === 0 && (await p.locator(carte).isVisible())), "« ‹ » : le salon se referme sur la liste");
ok(new URL(p.url()).pathname === "/collection", `… dans l'appli (${new URL(p.url()).pathname})`);
await p.waitForTimeout(1500);
ok(await p.evaluate(() => window.__memePage === true).catch(() => false), "… sans recharger l'appli");

// ═══ LA NOTIFICATION : ?parler=<clé> ═══
await p.goto(`${BASE}/collection?parler=${SAM.cle}#proches`, { waitUntil: "networkidle" });
await fermerPablito(p, "#o-proches");
ok(await salonPret(), "la notification ouvre le salon tout droit");
ok(!new URL(p.url()).searchParams.has("parler"), `… et l'adresse redevient propre (${new URL(p.url()).search || "sans ?"})`);
await p.evaluate(() => {
  window.__memePage = true;
  history.back();
});
ok(await attendre(async () => (await p.locator("[data-salon-du-duo]").count()) === 0), "le retour du téléphone le referme");
await p.waitForTimeout(1500);
ok((await p.evaluate(() => window.__memePage === true).catch(() => false)) && (await p.locator(carte).isVisible()), "… sur la liste, sans recharger l'appli (avant : tout se rechargeait)");

// ═══ ?salon=0 : L'ANCIEN ÉCRAN REVIENT ═══
await laListe(`/collection?salon=0&v=${Date.now()}#proches`);
ok((await p.evaluate(() => localStorage.getItem("clikme-salon"))) === "0", "?salon=0 : retenu");
await p.locator(carte).click();
ok(await attendre(async () => (await p.locator(".pr-plein .pr-scene").count()) === 1 && (await p.locator("[data-salon-du-duo]").count()) === 0), "… et l'ancien écran revient");

// ═══ 🔀 L'INTERRUPTEUR ALLUMÉ (19 novembre 2026) : SANS RIEN, LE SALON ═══
// (une seconde app, sans frein — `BASE_ALLUMEE` : celle qu'on a lancée soi-même, en local)
const { base: ALLUME, arreter } = process.env.BASE_ALLUMEE ? { base: process.env.BASE_ALLUMEE, arreter: () => {} } : await lancerSecondeApp({ env: { CLIKME_SALON_DU_DUO: "1" } });
const ctxA = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctxA.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: ALLUME }]);
const pa = await ctxA.newPage();
pa.on("pageerror", (e) => erreurs.push(String(e)));
await pa.goto(`${ALLUME}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(pa, "#o-proches");
await pa.waitForSelector(carte, { timeout: 60000 });
ok((await pa.evaluate(() => localStorage.getItem("clikme-salon"))) === null, "allumé : le téléphone n'a rien choisi");
await pa.locator(carte).click();
ok(await attendre(async () => (await pa.locator("[data-salon-du-duo]").count()) === 1 && (await pa.locator(".pr-plein").count()) === 0, 30000), "… et la carte ouvre le salon du duo, plus l'ancien écran");
await pa.screenshot({ path: `${D}/salon-bascule-allume.png` });
await pa.locator("[data-salon-du-duo] .sd-retour").click();
await pa.goto(`${ALLUME}/collection?salon=0&v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await pa.waitForSelector(carte, { timeout: 60000 });
await pa.locator(carte).click();
ok(await attendre(async () => (await pa.locator(".pr-plein .pr-scene").count()) === 1 && (await pa.locator("[data-salon-du-duo]").count()) === 0), "`?salon=0` : une porte de sortie, l'ancien écran");
arreter();

const corps = await p.evaluate(() => document.body.innerText);
ok(!/exemple/i.test(corps), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
