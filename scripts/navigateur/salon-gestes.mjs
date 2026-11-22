// 🛋️ LE SALON DU DUO : LES GESTES (`docs/univers/salon-du-duo.md`, section 4.4 ; le lot S3) — l'adresse d'essai
// `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Sam a laissé un bisou, une tulipe et un message à Léa (l'administrateur, sur ce téléphone). Léa ouvre leur salon : le
// bisou, puis la tulipe (elle pousse sur la table), puis le message. La barre des gestes : 💌 (cinq attentions, huit
// panneaux), 🛋️ (quatre gestes : le clip, la photo et le cadre viendront avec la télé) ; toucher l'onglet ouvert la
// replie, et c'est gardé. Léa sert un café (il glisse sur la table, il part), fait une surprise (elle tombe, s'ouvre, et
// laisse ce qu'elle cachait), brandit « J'arrive ! ». Sam, là, fait un check et pose une fleur : Léa les voit en direct.
// On touche la tulipe : « 🌷 Sam a laissé une tulipe · … ». Quatre objets au plus sur la table. Un geste qui ne part pas
// (trop pour aujourd'hui) : défait, et dit. Un appui long sur la bulle de Sam : Léa réagit 👏 (sous le message dans 💬),
// où l'on voit aussi les gestes. Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json() : null;
};
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f80${String(n).padStart(2, "0")}`, jeton: `jeton-salon-gestes-nav-0${String(n).padStart(2, "0")}`, prenom });
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
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09] } });
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
// (Sam a laissé un bisou, une tulipe et un message, puis il est parti)
const geste = (q, cle, quoi, plus = {}) => poster(q, { action: "geste", cle, type: "geste", quoi, ...plus });
ok((await geste(SAM, LEA.cle, "bisou")).status === 200, "Sam laisse un bisou");
ok((await geste(SAM, LEA.cle, "fleur")).status === 200, "et une tulipe");
ok((await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Tu viens ce soir ?" })).status === 200, "et un message");
await json(`${SAM.id}/la.json`, { le: Date.now() - 20 * 60_000 });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
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
const objets = () => p.locator(".sc-objet").count();
const objetsDits = () => p.evaluate(() => [...document.querySelectorAll(".sc-objet .corps")].map((x) => x.textContent).join(""));

// ═══ L'ARRIVÉE : SES GESTES D'ABORD, PUIS SON MESSAGE ═══
const t0 = Date.now();
await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
const toasts = [];
let rejoue = false;
while (Date.now() - t0 < 16000) {
  const t = await texte(".sd-toast.vu");
  if (t && toasts.at(-1) !== t) toasts.push(t);
  if (await p.locator(".sd-bulle.autre[data-rejoue]").count()) rejoue = true;
  if (rejoue && !(await p.locator(".sd-bulle.autre[data-rejoue]").count())) break;
  await p.waitForTimeout(80);
}
ok(toasts[0] === "😘 Sam t’a envoyé un bisou" && toasts[1] === "🌷 Sam a laissé une tulipe sur la table", `ses gestes d'abord, dans l'ordre (${JSON.stringify(toasts)})`);
ok(rejoue && (await texte(".sd-bulle.autre")) === "Tu viens ce soir ?", "puis son message, qui reste");
ok((await objetsDits()) === "🌷", `la tulipe est sur la table (${await objetsDits()})`);
const surTable = await p.evaluate(() => {
  const o = document.querySelector(".sc-objet").getBoundingClientRect();
  const s = document.querySelector(".sd-scene").getBoundingClientRect();
  return o.width > 8 && o.left >= s.left && o.right <= s.right && o.bottom <= s.bottom && o.top >= s.top;
});
ok(surTable, "elle se voit, dans la scène");
// (22 novembre 2026, le propriétaire : « le café est tout petit au lieu d'être de taille normale » — les objets de la table
// font 7 % de la largeur de la pièce ; la règle des boutons de la messagerie les laissait à 16 points)
const taille = await p.evaluate(() => document.querySelector(".sc-objet").getBoundingClientRect().height / document.querySelector(".sc-stage").getBoundingClientRect().width);
ok(taille > 0.065, `… à sa taille (${(taille * 100).toFixed(1)} % de la largeur de la pièce)`);
await p.screenshot({ path: `${D}/salon-gestes-1-arrivee.png` });

// ═══ LA BARRE DES GESTES ═══
const puces = () => p.evaluate(() => [...document.querySelectorAll(".sd-gestes .sd-geste")].map((x) => x.dataset.geste));
let l = await puces();
ok(l.length === 13 && l.slice(0, 5).join(",") === "coucou,bisou,check,chatouilles,fleur" && l.slice(5).every((c) => c.startsWith("panneau-")), `💌 : cinq attentions, huit panneaux (${l.length})`);
await p.locator('.sd-onglet[data-onglet="ensemble"]').click();
l = await puces();
ok(l.join(",") === "calin,cafe,danser,surprise", `🛋️ : quatre gestes, sans le clip, la photo ni le cadre (${l.join(", ")})`);
await p.locator('.sd-onglet[data-onglet="ensemble"]').click();
ok((await p.locator(".sd-gestes").count()) === 0 && (await p.locator(".sd-barre.repliee").count()) === 1, "toucher l'onglet ouvert replie la barre");
const hRepliee = await p.evaluate(() => document.querySelector(".sd-scene").getBoundingClientRect().height);
await p.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".sd-barre.repliee").count()) === 1, 8000), "c'est gardé : rouverte, la barre est repliée");
await p.locator(".sd-scene").dispatchEvent("pointerdown");
await p.locator('.sd-onglet[data-onglet="ensemble"]').click();
ok((await p.locator(".sd-gestes").count()) === 1, "un toucher la rouvre");
ok(hRepliee > (await p.evaluate(() => document.querySelector(".sd-scene").getBoundingClientRect().height)), "repliée, la scène est plus grande");

// ═══ LÉA SERT UN CAFÉ, FAIT UNE SURPRISE ═══
await attendre(async () => (await objets()) === 1, 4000);
await p.locator('.sd-geste[data-geste="cafe"]').click();
ok((await texte(".sd-toast.vu")) === "☕ Tu as servi un café", "« ☕ Tu as servi un café »");
ok(await attendre(async () => (await objetsDits()).includes("☕"), 3000), "le café glisse sur la table");
ok(await attendre(async () => (await lire(`fils/${PAIRE}/table.json`))?.objets?.some((o) => o.e === "☕"), 4000), "et il est parti");
await p.locator('.sd-geste[data-geste="surprise"]').click();
ok((await texte(".sd-toast.vu")) === "🎁 Tu as fait une surprise à Sam", `« ${await texte(".sd-toast.vu")} » (ce qu'elle cache, pas encore)`);
ok(await attendre(async () => /^\S+ [A-ZÀ-Ü].+ !$/u.test(await texte(".sd-toast.vu")) && !(await texte(".sd-toast.vu")).includes("surprise"), 5000), `elle s'ouvre : « ${await texte(".sd-toast.vu")} »`);
ok(await attendre(async () => (await objets()) === 3, 7000), "la surprise tombe, s'ouvre, et laisse ce qu'elle cachait");
await p.screenshot({ path: `${D}/salon-gestes-2-table.png` });
const posee = await lire(`fils/${PAIRE}/table.json`);
const derniere = posee?.objets?.at(-1);
ok(derniere && (await objetsDits()).includes(derniere.e) && derniere.e !== "🎁", `ce qu'elle cachait est le même chez Sam (${derniere?.e} ${derniere?.nom})`);

// ═══ UN PANNEAU ═══
await p.locator('.sd-onglet[data-onglet="attentions"]').click();
await p.locator('.sd-geste[data-geste="panneau-jarrive"]').click();
ok(await attendre(async () => (await texte(".sc-pancarte")) === "J’arrive !", 3000), "la figurine de Léa brandit « J’arrive ! »");
await p.waitForTimeout(900);
await p.screenshot({ path: `${D}/salon-gestes-3-panneau.png` });

// ═══ SAM, LÀ : SES GESTES EN DIRECT ═══
await poster(SAM, { action: "la" });
ok(await attendre(async () => (await texte(".sd-qui span")) === "Là, maintenant", 13000), "Sam arrive");
await geste(SAM, LEA.cle, "check");
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "🤜 Check avec Sam", 6000), "Sam fait un check : Léa le voit en direct");
await geste(SAM, LEA.cle, "fleur");
ok(await attendre(async () => (await objets()) === 4, 8000), "Sam pose une fleur : elle pousse sur la table");
await geste(SAM, LEA.cle, "cafe");
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "☕ Sam a servi un café", 8000), "« ☕ Sam a servi un café »");
await p.waitForTimeout(1500);
ok((await objets()) === 4, `quatre objets au plus sur la table (${await objetsDits()})`);

// ═══ ON TOUCHE UN OBJET ═══
const tulipe = p.locator(".sc-objet", { hasText: "🌷" }).first();
await tulipe.click();
ok(/^🌷 Sam a laissé une tulipe · \d+ h \d\d$/.test(await texte(".sd-toast.vu")), `« ${await texte(".sd-toast.vu")} »`);

// ═══ UN GESTE QUI NE PART PAS ═══
await p.route("**/api/direct/proches", async (route) => {
  const corps = route.request().postDataJSON?.() ?? null;
  if (route.request().method() === "POST" && corps?.action === "geste") return route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: "Assez de gestes pour aujourd’hui : reviens demain." }) });
  return route.continue();
});
const avant = await objetsDits();
await p.locator('.sd-geste[data-geste="fleur"]').click();
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "Pas parti : Assez de gestes pour aujourd’hui : reviens demain.", 4000), "trop de gestes : défait, et dit");
await p.waitForTimeout(2500);
ok((await objetsDits()) === avant, "la tulipe de trop n'est pas restée sur la table");
await p.unroute("**/api/direct/proches");

// ═══ RÉAGIR À SA BULLE ; 💬 ═══
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Trop bien ce café !" });
ok(await attendre(async () => (await texte(".sd-bulle.autre")) === "Trop bien ce café !", 6000), "son message arrive");
const bulle = await p.locator(".sd-bulle.autre").first().boundingBox();
await p.mouse.move(bulle.x + bulle.width / 2, bulle.y + bulle.height / 2);
await p.mouse.down();
await p.waitForTimeout(650);
await p.mouse.up();
ok(await attendre(async () => (await p.locator(".sd-reagir").count()) === 1, 2000), "un appui long sur sa bulle : les réactions");
await p.screenshot({ path: `${D}/salon-gestes-4-reagir.png` });
await p.locator('.sd-reagir [data-reaction="applaudir"]').click();
ok(await attendre(async () => (await lire(`fils/${PAIRE}/gestes.json`))?.liste?.some((g) => g.type === "reaction" && g.cle === "applaudir"), 4000), "Léa applaudit : c'est parti");
await p.locator(".sd-fil").click();
ok(await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 1, 2000), "💬 s'ouvre");
const lignes = await p.evaluate(() => [...document.querySelectorAll(".sd-evt[data-geste-fil]")].map((x) => x.querySelector("span").textContent));
ok(lignes.includes("😘 Sam t’a envoyé un bisou") && lignes.includes("☕ Tu as servi un café") && lignes.includes("🪧 « J’arrive ! »"), `les gestes y sont (${lignes.length} : ${lignes.slice(0, 4).join(" · ")}…)`);
ok((await p.locator('.sd-msg.autre:has-text("Trop bien ce café !") .sd-reac').innerText().catch(() => "")).includes("👏"), "👏 sous son message");
await p.screenshot({ path: `${D}/salon-gestes-5-messagerie.png` });

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nles gestes du salon : tout est bon");
process.exit(echecs ? 1 : 0);
