// 📌 LE SALON DU DUO : GARDER UNE BULLE, L'ÉTAGÈRE (`docs/univers/salon-du-duo.md`, sections 4.9 et 4.10 ; le lot S6) —
// l'adresse d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Sam a écrit à Léa (l'administrateur, sur ce téléphone). Léa ouvre leur salon : sur la bulle de Sam, un 📌. Elle le
// touche : la figurine de Sam brandit « 📌 Noté ! », le souvenir s'envole sur l'étagère de la pièce, « 📌 Noté sur votre
// étagère · … », sa figurine à elle dit une phrase ; le 📌 devient ✓, un second toucher : « C'est déjà sur votre
// étagère » ; 📚 1. Dans 💬, son propre message « samedi » : 🌊, 📚 2. Sam garde un fou rire de Léa : il s'envole chez
// elle, « 📌 Sam a gardé · … ». Toucher l'étagère : « Votre étagère », quatre rayons (« Nos fous rires »). « malade » :
// pas rangé, et dit. Ni débordement, ni erreur, ni le mot « exemple ».
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000fc0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-garder-nav-0${String(n).padStart(2, "0")}`, prenom });
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
// (le salon : une pièce en hauteur, ses places et sa table basse relevées)
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="620" y="200" width="300" height="260" fill="#bfe3ff"/><ellipse cx="512" cy="1180" rx="170" ry="60" fill="#6b4226"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09], etagere: [0.6, 0.13, 0.3, 0.16] } });
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

// (Sam est là ; il a écrit)
await poster(SAM, { action: "la" });
const ecrire = async (q, avec, texte) => (await (await poster(q, { action: "ecrire", cle: avec, texte })).json())?.message?.id;
await ecrire(SAM, LEA.cle, "Merci pour tout, vraiment");

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
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
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const surLEtagere = () => p.evaluate(() => [...document.querySelectorAll(".sc-souvenir")].map((x) => x.textContent).join(""));

await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")).startsWith("Merci pour tout"), 15000), "la bulle de Sam");
await p.locator(".sd-scene").dispatchEvent("pointerdown");
const epingle = (sel) => p.evaluate((sel) => { const b = document.querySelector(sel); return b ? getComputedStyle(b, "::after").content.replace(/"/g, "") : ""; }, sel);
ok((await epingle(".sd-bulle.autre .sd-garder")) === "📌", "un 📌 dans son coin");
ok((await surLEtagere()) === "" && (await p.locator(".sd-pastille[data-souvenirs]").count()) === 0, "l'étagère est vide");

// ═══ LÉA GARDE LA BULLE DE SAM ═══
await p.locator(".sd-bulle.autre .sd-garder").click();
ok(await attendre(async () => (await texte(".sc-pancarte")) === "📌 Noté !", 2000), "la figurine de Sam brandit « 📌 Noté ! »");
ok(await attendre(async () => (await surLEtagere()) === "💬", 6000), "le souvenir s'envole sur l'étagère de la pièce");
ok(/^📌 Noté sur votre étagère · 💬 Merci pour tout/.test(await texte(".sd-toast.vu")), `« ${await texte(".sd-toast.vu")} »`);
ok(await attendre(async () => (await p.locator(".sd-bulle.moi[data-ia]").count()) === 1, 2000), `sa figurine à elle dit une phrase (« ${await texte(".sd-bulle.moi[data-ia]")} »)`);
const ici = await p.evaluate(() => {
  const o = document.querySelector(".sc-souvenir").getBoundingClientRect();
  const s = document.querySelector(".sc-stage").getBoundingClientRect();
  return { x: (o.left + o.width / 2 - s.left) / s.width, y: (o.bottom - s.top) / s.height };
});
ok(ici.x > 0.6 && ici.x < 0.9 && ici.y > 0.13 && ici.y < 0.3, `sur l'étagère relevée (${ici.x.toFixed(2)}, ${ici.y.toFixed(2)})`);
ok((await epingle(".sd-bulle.autre .sd-garder")) === "✓", "le 📌 devient ✓");
ok((await texte(".sd-pastille[data-souvenirs]")).includes("1"), "📚 1");
await p.screenshot({ path: `${D}/salon-garder-1-note.png` });
await p.waitForTimeout(1500);
await p.locator(".sd-bulle.autre .sd-garder").click();
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "📌 C’est déjà sur votre étagère", 2000), "un second toucher : « C’est déjà sur votre étagère »");

// ═══ DANS 💬, SON PROPRE MESSAGE ═══
await p.locator(".sd-saisie input").fill("On va voir la mer samedi !");
await p.locator(".sd-envoyer").click();
ok(await attendre(async () => (await p.locator('.sd-bulle.moi .sd-garder').count()) === 1, 6000), "son message est parti (un 📌 sur sa bulle)");
await p.locator(".sd-fil").click();
await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 1, 2000);
await p.locator('.sd-msg.moi:has-text("On va voir la mer") .sd-garder-fil').click();
await p.locator(".sd-feuille .sd-poignee").click();
ok(await attendre(async () => (await surLEtagere()) === "💬🌊", 6000), `dans 💬 aussi : 🌊 sur l'étagère (${await surLEtagere()})`);
ok(await attendre(async () => (await texte(".sd-pastille[data-souvenirs]")).includes("2"), 2000), "📚 2");

// ═══ SAM GARDE UN FOU RIRE DE LÉA ═══
const rire = await ecrire(LEA, SAM.cle, "Haha je pleure de rire 😂");
await p.waitForTimeout(500);
const r = await (await fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "garder", avec: LEA.cle, message: rire }) })).json();
ok(r?.souvenir?.genre === "blague", "Sam garde un fou rire de Léa");
ok(await attendre(async () => (await surLEtagere()).includes("😂"), 8000), "il s'envole chez Léa, en direct");
ok(await attendre(async () => /^📌 Sam a gardé · 😂/.test(await texte(".sd-toast.vu")), 4000), `« ${await texte(".sd-toast.vu")} »`);

// ═══ « VOTRE ÉTAGÈRE » ═══
await p.locator(".sc-souvenir").first().click();
ok(await attendre(async () => (await p.locator(".et-page").count()) === 1, 6000), "toucher l'étagère : « Votre étagère »");
ok(await attendre(async () => (await p.locator(".et-page .et-rayon").count()) === 4, 6000), "quatre rayons");
const rires = await texte('.et-page .et-rayon[data-rayon="rires"]');
ok(rires.includes("Nos fous rires") && rires.includes("😂"), `« Nos fous rires » : le fou rire (${rires})`);
await p.screenshot({ path: `${D}/salon-garder-2-etagere.png` });
await p.keyboard.press("Escape");
ok(await attendre(async () => (await p.locator(".et-page").count()) === 0, 3000), "elle se referme");

// ═══ CE QUI NE SE RANGE PAS ═══
await ecrire(SAM, LEA.cle, "Je suis malade depuis hier");
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")).startsWith("Je suis malade"), 8000), "un autre message de Sam");
await p.locator(".sd-bulle.autre .sd-garder").click();
ok(await attendre(async () => /^Pas rangé : Celui-là/.test(await texte(".sd-toast.vu")), 4000), `« malade » : pas rangé, et dit (${await texte(".sd-toast.vu")})`);
ok((await epingle(".sd-bulle.autre .sd-garder")) === "📌", "… le 📌 reste un 📌");

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\ngarder une bulle, l'étagère : tout est bon");
process.exit(echecs ? 1 : 0);
