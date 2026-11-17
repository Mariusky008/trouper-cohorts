// 💓 LE SALON DU DUO : LE POULS ET L'ARRIVÉE (`docs/univers/salon-du-duo.md`, sections 4.1 et 7.4 ; le lot S2, deuxième
// partie) — l'adresse d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Sam a laissé trois messages à Léa (l'administrateur, sur ce téléphone), puis il est parti il y a vingt minutes. Léa
// ouvre leur salon : la figurine de Sam les redit un à un (moins de 12 s), le dernier reste ; « Dernière visite à … » ;
// le pouls bat toutes les 10 s. Sam ouvre ClikMe : « Là, maintenant », et le pouls bat toutes les 1,5 s. Sam écrit :
// « … » au-dessus de sa figurine ; son message arrive dans sa bulle, les non-lus montent d'un, la figurine de Léa réagit.
// Léa écrit : Sam le voit (`ecrit`). La page cachée : plus de pouls ; revenue : il repart tout de suite. Sam laisse trois
// autres messages pendant que Léa n'est pas là ; elle rouvre et touche la scène : l'arrivée passe, le dernier reste. Ni
// débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
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
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f60${String(n).padStart(2, "0")}`, jeton: `jeton-salon-pouls-nav-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
// (le salon : une pièce en hauteur, ses places relevées)
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="620" y="200" width="300" height="260" fill="#bfe3ff"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }] } });
// (leurs figurines du nouveau style, et leurs calques déjà faits)
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
// (Sam a laissé trois messages, puis il est parti il y a vingt minutes)
const DITS = ["Tu as vu le match ?", "Incroyable la fin 😂", "On se fait un ciné demain ?"];
for (const t of DITS) ok((await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: t })).status === 200, `Sam écrit « ${t} »`);
const parti = Date.now() - 20 * 60_000;
await json(`${SAM.id}/la.json`, { le: parti });
const pouls = (q, cle) => fetch(`${BASE}/api/direct/proches?pouls=${cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } }).then((r) => r.json());

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const battements = [];
ctx.on("request", (r) => r.url().includes(`/api/direct/proches?pouls=${SAM.cle}`) && battements.push(Date.now()));
const ouvrirPage = async () => {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  return p;
};
let p = await ouvrirPage();
const attendre = async (f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const depuis = (t) => battements.filter((x) => x >= t).length;

// ═══ L'ARRIVÉE : CE QU'IL A LAISSÉ, REJOUÉ ═══
const t0 = Date.now();
await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
const vus = [];
let fini = 0;
while (Date.now() - t0 < 16000) {
  const rejoue = await p.locator(".sd-bulle.autre[data-rejoue]").count();
  const dit = await texte(".sd-bulle.autre");
  if (rejoue && dit && vus.at(-1) !== dit) vus.push(dit);
  if (!rejoue && vus.length) {
    fini = Date.now();
    break;
  }
  await p.waitForTimeout(80);
}
ok(JSON.stringify(vus) === JSON.stringify(DITS), `la figurine de Sam redit ses trois messages, un à un, dans l'ordre (${JSON.stringify(vus)})`);
ok(fini && fini - t0 < 14000, `en moins de 12 s, l'ouverture comprise (${fini ? fini - t0 : "—"} ms)`);
ok((await texte(".sd-bulle.autre")) === DITS[2], "le dernier reste");
ok(/^Dernière visite à \d+ h \d\d$/.test(await texte('.sd-qui [data-presence="absent"]')), `« ${await texte(".sd-qui span")} »`);
await p.screenshot({ path: `${D}/salon-pouls-1-arrivee.png` });

// ═══ LE POULS, SAM ABSENT : TOUTES LES 10 S ═══
const tA = Date.now();
await p.waitForTimeout(5000);
ok(depuis(tA) <= 1, `Sam absent : le pouls bat toutes les 10 s (${depuis(tA)} en 5 s)`);

// ═══ SAM ARRIVE ═══
await poster(SAM, { action: "la" });
ok(await attendre(async () => (await texte(".sd-qui span")) === "Là, maintenant", 13000), "Sam ouvre ClikMe : « Là, maintenant »");
const tB = Date.now();
await p.waitForTimeout(4700);
ok(depuis(tB) >= 3, `les deux là : le pouls bat toutes les 1,5 s (${depuis(tB)} en 4,7 s)`);

// ═══ IL ÉCRIT, PUIS SON MESSAGE ARRIVE ═══
await poster(SAM, { action: "prepare", cle: LEA.cle, oui: true });
ok(await attendre(async () => (await p.locator(".sd-bulle[data-ecrit]").count()) === 1, 3500), "Sam écrit : « … » au-dessus de sa figurine");
const badge = Number(await texte(".sd-fil .sd-badge")) || 0;
const teteMoi = () => p.evaluate(() => getComputedStyle(document.querySelector('.sc-tete[data-tete="moi"]')).transform);
await poster(SAM, { action: "prepare", cle: LEA.cle, oui: false });
const tete0 = await teteMoi();
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Je pars dans 5 minutes !" });
ok(await attendre(async () => (await texte(".sd-bulle.autre")) === "Je pars dans 5 minutes !", 4000), "son message arrive dans sa bulle, en direct");
ok(await attendre(async () => (await p.locator(".sd-bulle[data-ecrit]").count()) === 0, 3500), "« … » s'en va");
ok((Number(await texte(".sd-fil .sd-badge")) || 0) === badge + 1, `les non-lus montent d'un (${badge} → ${await texte(".sd-fil .sd-badge")})`);
let bouge = false;
for (let i = 0; i < 15 && !bouge; i++) {
  await p.waitForTimeout(100);
  bouge = (await teteMoi()) !== tete0;
}
ok(bouge, "la figurine de Léa réagit (« ! » : un sursaut)");
await p.screenshot({ path: `${D}/salon-pouls-2-direct.png` });

// ═══ LÉA ÉCRIT : SAM LE VOIT ═══
await p.locator(".sd-saisie input").fill("J’arrive aussi");
ok(await attendre(async () => (await pouls(SAM, LEA.cle))?.ecrit === true, 2000), "Léa écrit : Sam le voit (`ecrit`)");
await p.locator(".sd-envoyer").click();
ok(await attendre(async () => (await pouls(SAM, LEA.cle))?.ecrit === undefined, 3000), "elle envoie : « … » s'arrête chez Sam");

// ═══ LA PAGE CACHÉE ═══
const visibilite = (v) =>
  p.evaluate((v) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
    document.dispatchEvent(new Event("visibilitychange"));
  }, v);
await visibilite("hidden");
await p.waitForTimeout(1600);
const tC = Date.now();
await p.waitForTimeout(3500);
ok(depuis(tC) === 0, "la page cachée : plus de pouls");
const tD = Date.now();
await visibilite("visible");
ok(await attendre(async () => depuis(tD) >= 1, 1500), "revenue : il repart tout de suite");

// ═══ UN TOUCHER PASSE L'ARRIVÉE ═══
await p.close();
const AUTRES = ["Bon, je t'attends", "Tu es où ?", "Je suis devant 🍿"];
for (const t of AUTRES) await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: t });
p = await ouvrirPage();
await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".sd-bulle.autre[data-rejoue]").count()) === 1, 8000), "elle rouvre : l'arrivée commence");
const tE = Date.now();
await p.locator(".sd-scene").dispatchEvent("pointerdown");
ok(await attendre(async () => (await p.locator(".sd-bulle.autre[data-rejoue]").count()) === 0, 600), `un toucher passe la suite (${Date.now() - tE} ms)`);
ok((await texte(".sd-bulle.autre")) === AUTRES[2], "le dernier reste");

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nle pouls et l'arrivée : tout est bon");
process.exit(echecs ? 1 : 0);
