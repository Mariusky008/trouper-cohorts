// 🚪 L'ENTRÉE AU SALON, DISCRÈTE (`docs/univers/decouvrir.md`, section 39 ; le propriétaire, 26 novembre 2026 : « plus
// forte, plus wow », puis « les gens regardent la vidéo, donc fais pas non plus trop déranger ») — sur un iPhone, contre
// le faux Supabase.
//
// Léa entre au salon du foot : sa figurine marche depuis le bord, le long du bas de la pièce, jamais devant la télé, et
// s'assoit ; elle n'entend pas son propre bonjour. Sam, son proche, arrive : il fait son entrée, sa pancarte brille, ils
// se tournent l'un vers l'autre et un check ✋ vole d'un fauteuil à l'autre ; son bonjour se joue tout seul seulement
// entre deux vidéos — sinon sa bouche le dit en silence et 🔊 attend, à toucher. Zoé, une inconnue, arrive : Léa tourne la
// tête un instant, pas de check. Léa recharge : personne ne refait son entrée. Rien ne déborde, ni erreur, ni « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((fini) => setTimeout(fini, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
async function attendreQue(f, ms = 30000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const v = await f().catch(() => null);
    if (v) return v;
    await pause(400);
  }
  return null;
}

// (« Ma maison » n'est encore ouverte qu'à l'administrateur, ici : Léa l'est, comme dans les autres essais de sa maison)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `e7e70000-0000-4000-8000-00000000ee0${n}`, jeton: `jeton-entree-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
for (const x of [LEA, SAM, ZOE]) x.cle = cleProfil(x.id);
await semer("human_habitants", [LEA, SAM, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
// (sa figurine assise : 800 × 1 200, transparente — la tête, le cou, le corps et le fauteuil)
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
            <ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/>
            <rect x="370" y="540" width="60" height="40" fill="${couleur}"/>
            <rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/>
          </svg>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
const fiche = (h) => ({ version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [x, couleur] of [
  [LEA, "#c8643c"],
  [SAM, "#3c8cc8"],
  [ZOE, "#3cc88c"],
]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(couleur), "image/png");
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id));
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM, ZOE].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
const appel = async (q, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la télé des salons)");

// ═══ SAM : SES TÊTES (LA BOUCHE OUVERTE COMPRISE), SA TÊTE DU JOUR, SA PANCARTE, SON BONJOUR ═══
ok((await appel(SAM, "/api/direct/ma-figurine")).statut === 200, "Sam ouvre l'appli");
const KS = empreinte(`${SAM.id}/perso/v1/assise.png`);
ok(Boolean((await attendreQue(async () => (await lire(`${SAM.id}/calques/${KS}-expressions.json`))?.tetes?.parle, 90000))), "ses têtes sont prêtes, la bouche ouverte comprise");
ok((await appel(SAM, "/api/direct/mon-double", { action: "tete", e: "sourire" })).statut === 200, "sa tête du jour : le sourire");
const PANCARTE = "Enfin vendredi";
ok((await appel(SAM, "/api/direct/mon-double", { action: "pancarte", texte: PANCARTE })).statut === 200, `sa pancarte : « ${PANCARTE} »`);
// (sa voix : quatre syllabes de 0,3 s, séparées de silences — un vrai son, que le téléphone sait lire)
const SON = (() => {
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
    b.writeInt16LE(Math.floor(t / 0.3) % 2 === 0 ? Math.round(Math.sin(2 * Math.PI * 220 * t) * 18000) : 0, 44 + i * 2);
  }
  return b;
})();
const garde = await appel(SAM, "/api/direct/mon-double", { action: "bonjour", son: `data:audio/wav;base64,${SON.toString("base64")}`, duree: 2.4 });
const srcSam = garde.corps?.double?.bonjour?.src ?? "";
ok(garde.statut === 200 && srcSam.startsWith(`/api/direct/bonjour/${SAM.cle}?v=`), "Sam a gardé son bonjour");

// ═══ LÉA ENTRE AU SALON DU FOOT : SA PROPRE ENTRÉE ═══
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "window.YT={Player:function(){}};" }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
// (les bonjours entendus : on note ce que la page fait jouer ; et les ✋ qui volent)
await ctx.addInitScript(() => {
  window.__bonjours = [];
  window.__vols = [];
  window.addEventListener("clikme:bonjour", (e) => window.__bonjours.push(e.detail?.src ?? ""));
  new MutationObserver((l) => {
    for (const m of l) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.dataset?.vol) window.__vols.push(`${n.dataset.vol}|${n.textContent}`);
  }).observe(document, { childList: true, subtree: true });
});
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on("console", (m) => m.type() === "error" && !/Failed to load resource|NotSupportedError|no supported source/i.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await lea.waitForTimeout(100);
  }
  return false;
};
const deborde = () => lea.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

await lea.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
const moi = lea.locator(".so-fig.moi");
ok(await attendre(async () => (await moi.getAttribute("data-entre")) === "1", 20000), "🚪 Léa entre : sa figurine fait son entrée (elle marche jusqu'à sa place)");
const anim = await moi.evaluate((e) => getComputedStyle(e).animationName);
ok(/so-entree/.test(anim), `… depuis le bord, le long du bas de la pièce (${anim})`);
const tele = await lea.locator(".so-scene").evaluate((s) => s.firstElementChild?.getBoundingClientRect().bottom ?? 0);
const pendantMarche = await moi.boundingBox();
ok(pendantMarche && pendantMarche.y >= tele, "… jamais devant la télé");
ok(await attendre(async () => (await moi.getAttribute("data-entre")) === null, 4000), "… elle est assise (1,5 s)");
ok((await lea.evaluate(() => window.__bonjours.length)) === 0, "… elle n'entend pas son propre bonjour");
const qLea = await moi.getAttribute("data-q");

// ═══ SAM, SON PROCHE, ARRIVE ═══
const entreeSam = await appel(SAM, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" });
const qSam = entreeSam.corps?.ouverture?.moi;
ok(entreeSam.statut === 200 && Boolean(qSam), "Sam entre au salon du foot");
const lui = entreeSam.corps?.ouverture?.presents?.find((x) => x.q === qLea);
ok(lui?.proche === true, "… pour lui, Léa est « ta proche » (lui seul le sait)");
const figSam = lea.locator(`.so-fig[data-q="${qSam}"]`);
ok(await attendre(async () => (await figSam.getAttribute("data-entre")) === "1", 15000), "chez Léa : Sam fait son entrée");
await lea.waitForTimeout(700);
await lea.screenshot({ path: `${D}/entree-salon-1-marche.png` });
ok(await attendre(async () => (await figSam.getAttribute("data-eclat")) === "1", 4000), "… assis, sa pancarte brille un instant");
ok((await moi.getAttribute("data-regarde")) !== null && (await figSam.getAttribute("data-regarde")) !== null, "… Léa et lui se tournent l'un vers l'autre");
ok(await attendre(async () => (await lea.evaluate(() => window.__vols)).some((v) => v === `${qSam}>${qLea}|✋`), 3000), "… 👯 un check ✋ d'un fauteuil à l'autre");
await lea.screenshot({ path: `${D}/entree-salon-2-check.png` });
// (son bonjour : tout seul entre deux vidéos ; sinon sa bouche le dit en silence, et 🔊 attend)
await lea.waitForTimeout(300);
const joue = (await lea.evaluate(() => window.__bonjours)).includes(srcSam);
const bulle = lea.locator(`[data-son-bonjour="${qSam}"]`);
if (joue) {
  ok((await bulle.count()) === 0, "entre deux vidéos : son bonjour se joue tout seul (pas de bulle)");
} else {
  ok((await bulle.count()) === 1, "pendant la vidéo : son bonjour ne se joue pas tout seul, une bulle 🔊 attend");
  ok((await figSam.locator("[data-tete-du-jour]").getAttribute("data-muette")) === "1", "… sa bouche dit bonjour en silence");
  await lea.screenshot({ path: `${D}/entree-salon-3-bulle.png` });
  await bulle.click();
  ok(await attendre(async () => (await lea.evaluate(() => window.__bonjours)).includes(srcSam)), "… toucher 🔊 : son bonjour, avec sa voix");
  ok(await attendre(async () => (await bulle.count()) === 0), "… la bulle s'en va");
}
ok(await attendre(async () => (await moi.getAttribute("data-regarde")) === null && (await figSam.getAttribute("data-regarde")) === null, 3000), "les têtes reviennent vers la télé");

// ═══ ZOÉ, QUI N'EST PAS SA PROCHE, ARRIVE ═══
const entreeZoe = await appel(ZOE, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" });
const qZoe = entreeZoe.corps?.ouverture?.moi;
ok(entreeZoe.statut === 200 && !entreeZoe.corps?.ouverture?.presents?.some((x) => x.proche), "Zoé entre (personne n'est son proche)");
const figZoe = lea.locator(`.so-fig[data-q="${qZoe}"]`);
ok(await attendre(async () => (await figZoe.getAttribute("data-entre")) === "1", 15000), "chez Léa : Zoé fait son entrée");
ok(await attendre(async () => (await moi.getAttribute("data-regarde")) !== null, 4000), "… Léa tourne la tête vers elle, un instant");
await lea.waitForTimeout(1200);
ok(!(await lea.evaluate(() => window.__vols)).some((v) => v.startsWith(`${qZoe}>`)), "… pas de check : elle n'est pas sa proche");
ok(!(await deborde()), "rien ne déborde");

// ═══ LÉA RECHARGE : SA PLACE EST GARDÉE, PAS DE NOUVELLE ENTRÉE ═══
await lea.reload({ waitUntil: "domcontentloaded" });
await lea.waitForTimeout(400);
const vues = [];
for (let i = 0; i < 15; i++) {
  vues.push(await lea.locator(".so-fig[data-entre]").count());
  await lea.waitForTimeout(100);
}
ok(await attendre(async () => (await moi.count()) === 1, 15000), "elle recharge : elle est toujours là");
ok(vues.every((n) => n === 0), "… et personne ne refait son entrée");

ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur (${erreurs.slice(0, 3).join(" | ")})`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nl'entrée au salon, discrète, sur un iPhone ✓");
process.exit(echecs ? 1 : 0);
