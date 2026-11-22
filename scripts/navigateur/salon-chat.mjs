// 🐾 LE SALON DU DUO : LE CHAT ET LA VIE PROPRE (`docs/univers/salon-du-duo.md`, section 4.5 ; le lot S3, deuxième
// partie) — l'adresse d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Les boucles du chat de l'essai C0 sont faites (et son ronronnement). Léa ouvre son salon avec Sam : le chat est dans
// son coin (là où la pièce l'a relevé), derrière les figurines, il dort ou il est assis ; une image de sa vidéo est
// passée par la carte graphique (le vert retiré). Sam lui écrit : il dresse les oreilles. On le touche : des cœurs, il
// marche jusqu'à mes genoux, devant ma figurine, et ronronne (son vrai son). Léa fait un check : il saute de joie. La page
// cachée : sa vidéo s'arrête. Sans boucle faite : pas de chat. Au repos, les figurines se regardent ou s'étirent. Ni
// débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import fs from "node:fs";
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000fa0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-chat-nav-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const PAIRE = [LEA.id, SAM.id].sort().join("_");
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
await json(`fils/${PAIRE}/piece.json`, { piece: "salon", le: maintenant });
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><ellipse cx="140" cy="1320" rx="90" ry="30" fill="#c96"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
// (le coin du chat : le panier, en bas à gauche)
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.32, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], chat: { x: 0.14, y: 0.87 } } });
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
// (Sam est là : ses messages arrivent toutes les 1,5 s)
await poster(SAM, { action: "la" });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const sons = [];
ctx.on("request", (r) => r.url().includes("/api/direct/salon/chat/son") && sons.push(r.url()));
const ouvrirPage = async () => {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|NotAllowedError|play\(\)/.test(m.text()) && erreurs.push(m.text()));
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
const leChat = () => p.evaluate(() => {
  const c = document.querySelector(".sc-chat");
  return c ? { couche: c.parentElement?.dataset.couche, lieu: c.dataset.lieu, boucle: c.dataset.boucle, vu: c.dataset.vu === "1", cache: c.hidden } : null;
});

// ═══ SANS BOUCLE : PAS DE CHAT ═══
await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".sc-fig").count()) === 2, 10000), "le salon s'ouvre");
await p.waitForTimeout(800);
ok((await p.locator(".sc-chat").count()) === 0, "pas de boucle faite : pas de chat");
await p.close();

// ═══ SES BOUCLES FAITES : IL EST DANS SON COIN ═══
const MP4 = fs.readFileSync("scripts/fixtures/chat-fond-vert-essai.mp4");
for (const bc of ["assis", "dort", "genoux", "marche", "alerte", "saut", "renifle"]) await deposer(`compagnons/chat/${bc}/video.mp4`, MP4, "video/mp4");
await deposer("compagnons/chat/genoux/ronron.mp3", Buffer.from("ID3ronron"), "audio/mpeg");
await json("compagnons/chat/genoux/son.json", { fichier: "ronron.mp3", type: "audio/mpeg", le: maintenant });
p = await ouvrirPage();
await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await leChat()) !== null, 10000), "ses boucles faites : le chat est là");
let c = await leChat();
// (22 novembre 2026, le propriétaire : « le chat est derrière, je peux pas cliquer dessus » — son coin, devant les figurines)
ok(c?.couche === "devant" && c.lieu === "coin" && ["dort", "assis"].includes(c.boucle), `dans son coin, devant les figurines (touchable), il ${c?.boucle === "dort" ? "dort" : "est assis"}`);
const ici = await p.evaluate(() => {
  const r = document.querySelector(".sc-chat").getBoundingClientRect();
  const s = document.querySelector(".sc-stage").getBoundingClientRect();
  return { x: (r.left + r.width / 2 - s.left) / s.width, bas: (r.bottom - s.top) / s.height, h: r.height / s.height };
});
ok(Math.abs(ici.x - 0.14) < 0.02 && ici.h > 0.1, `à la place relevée pour lui (x ${ici.x.toFixed(3)}, hauteur ${ici.h.toFixed(3)})`);
ok(await attendre(async () => (await leChat())?.vu === true, 10000), "une image de sa vidéo est passée par la carte graphique (le vert retiré)");
ok(!(await leChat())?.cache, "et il se voit");
await p.screenshot({ path: `${D}/salon-chat-1-coin.png` });

// ═══ UN MESSAGE : IL DRESSE LES OREILLES ═══
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Coucou toi" });
ok(await attendre(async () => (await leChat())?.boucle === "alerte", 6000), "Sam écrit : il dresse les oreilles");
ok(await attendre(async () => (await leChat())?.boucle !== "alerte", 5000), "puis il revient à ce qu'il faisait");

// ═══ ON LE TOUCHE : IL VIENT SUR MES GENOUX, ET RONRONNE ═══
await p.locator(".sc-chat").click();
// (22 novembre 2026, « j'entends pas son ronron » : un iPhone ne joue un son que pendant le toucher — il ronronne dès
// qu'on le touche, pendant qu'il vient)
ok(await attendre(async () => sons.length > 0, 1200), "touché : il ronronne tout de suite (son vrai son)");
ok(await attendre(async () => (await leChat())?.boucle === "marche", 1500), "… et il marche");
ok(await attendre(async () => (await leChat())?.lieu === "genoux" && (await leChat())?.couche === "devant", 4000), "jusqu'à mes genoux, devant ma figurine");
ok(await attendre(async () => (await leChat())?.boucle === "genoux", 3000), "il s'y couche");
// (« il n'est pas vraiment assis sur mes genoux mais sur ma poitrine » : ses pattes au point où elle s'assoit — 0,72)
const surMoi = await p.evaluate(() => {
  const r = document.querySelector(".sc-chat").getBoundingClientRect();
  const s = document.querySelector(".sc-stage").getBoundingClientRect();
  return { pattes: (r.bottom - 0.17 * r.height - s.top) / s.height, x: (r.left + r.width / 2 - s.left) / s.width };
});
ok(surMoi.pattes > 0.715 && surMoi.pattes < 0.76 && Math.abs(surMoi.x - 0.32) < 0.02, `sur ses genoux, pas sur sa poitrine (pattes à ${surMoi.pattes.toFixed(3)}, sa place à 0,72)`);
await p.screenshot({ path: `${D}/salon-chat-2-genoux.png` });

// ═══ UN CHECK : IL SAUTE DE JOIE ═══
await p.locator('.sd-geste[data-geste="check"]').click();
ok(await attendre(async () => (await leChat())?.boucle === "saut", 3000), "Léa fait un check : il saute de joie");

// ═══ LA PAGE CACHÉE : SA VIDÉO S'ARRÊTE ═══
const visibilite = (v) =>
  p.evaluate((v) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => v === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, v);
await visibilite("hidden");
await p.waitForTimeout(300);
ok(await p.evaluate(() => [...document.querySelectorAll(".sc-chat-videos video")].every((v) => v.paused)), "la page cachée : sa vidéo s'arrête");
await visibilite("visible");
ok(await attendre(async () => p.evaluate(() => [...document.querySelectorAll(".sc-chat-videos video")].some((v) => !v.paused)), 2000), "revenue : elle repart");

// ═══ LA VIE PROPRE : ELLES SE REGARDENT, OU L'UNE S'ÉTIRE ═══
ok(await attendre(async () => ["regard", "etire"].includes(await p.evaluate(() => document.querySelector(".sc")?.dataset.vie ?? "")), 45000), `au repos, elles se regardent ou s'étirent (${await p.evaluate(() => document.querySelector(".sc")?.dataset.vie ?? "rien")})`);

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nle chat du salon et la vie propre : tout est bon");
process.exit(echecs ? 1 : 0);
