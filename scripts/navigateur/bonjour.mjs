// 🎙️ « MON BONJOUR », AVEC SA VOIX (`docs/univers/ma-figurine.md`, lot 4 ; le propriétaire : « bonjour avec SA voix,
// entendu quand on touche la figurine dans le fil, un salon ou Autour ») — sur un iPhone, avec un faux micro, contre le
// faux Supabase.
//
// Léa ouvre « Mon double du jour », l'onglet « 🎙️ Bonjour » : pas encore de bonjour. « 🎙️ Enregistrer mon bonjour » : le
// micro s'allume, les secondes défilent ; « ■ C'est dit » : elle peut l'écouter, puis « ✓ Garder ce bonjour ». Rangé :
// sa voix, servie à quelqu'un de ClikMe par sa clé (jamais son compte). Sam a enregistré le sien ; il est au salon du
// foot. Léa y entre et touche sa figurine : on entend le bonjour de Sam (sa vraie adresse, le son servi), sa fiche dit
// « 🔊 Le bonjour de Sam », qu'on peut réécouter. Rien ne déborde, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import { poserPiece } from "../piece-en-hauteur.mjs";
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

const qui = (n, prenom) => ({ id: `b0e70000-0000-4000-8000-00000000ee0${n}`, jeton: `jeton-bonjour-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
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
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", {
  fond: "#4a5a6e",
  sol: "#6a5040",
  le: maintenant,
  emplacements: {
    tele: [0.32, 0.2, 0.36, 0.15],
    etagere: [0.76, 0.1, 0.2, 0.34],
    cadres: [[0.06, 0.44, 0.1, 0.09]],
    table: [0.44, 0.78, 0.14, 0.05],
    places: [
      { x: 0.3, y: 0.86, hauteur: 0.3 },
      { x: 0.7, y: 0.86, hauteur: 0.3 },
    ],
  },
});
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() });
const get = async (chemin, q) => {
  const r = await fetch(`${BASE}${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};

const appel = async (q, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la télé des salons)");
ok((await get("/api/direct/ma-figurine", LEA)).statut === 200, "Léa ouvre l'appli");
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
ok(Boolean(await attendreQue(async () => (await lire(`${LEA.id}/calques/${K}-expressions.json`))?.le, 90000)), "ses expressions sont prêtes");

// ═══ SAM : SON BONJOUR, ET IL EST AU SALON DU FOOT ═══
const SON_SAM = Buffer.concat([Buffer.from("1a45dfa3", "hex"), Buffer.alloc(3000, 7)]);
const gardeSam = await appel(SAM, "/api/direct/mon-double", { action: "bonjour", son: `data:audio/webm;base64,${SON_SAM.toString("base64")}`, duree: 2.2 });
ok(gardeSam.statut === 200 && gardeSam.corps?.double?.bonjour?.src?.startsWith(`/api/direct/bonjour/${SAM.cle}?v=`), "Sam a gardé son bonjour");
const srcSam = gardeSam.corps?.double?.bonjour?.src ?? "";
const entree = await appel(SAM, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" });
const qSam = entree.corps?.ouverture?.moi;
ok(entree.statut === 200 && Boolean(qSam), "Sam est au salon du foot");

// ═══ LÉA ENREGISTRE SON BONJOUR ═══
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["microphone"] });
await ctx.addCookies([
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "window.YT={Player:function(){}};" }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
// (les bonjours entendus : on note ce que la page fait jouer)
await ctx.addInitScript(() => {
  window.__bonjours = [];
  window.addEventListener("clikme:bonjour", (e) => window.__bonjours.push(e.detail?.src ?? ""));
});
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on("console", (m) => m.type() === "error" && !/Failed to load resource|NotSupportedError|no supported source/i.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await lea.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const deborde = () => lea.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
ok(await attendre(async () => (await chez.locator(".mmc-fig").count()) === 1, 30000), "chez elle : sa figurine");
await chez.locator(".mmc-fig").click();
const md = lea.locator("[data-mon-double]");
ok(await attendre(async () => (await md.locator('[data-onglet="bonjour"]').count()) === 1), "« Mon double du jour » : l'onglet « 🎙️ Bonjour »");
const onglets = await md.locator("[data-onglet]").evaluateAll((l) => l.map((x) => x.getAttribute("data-onglet")).join());
ok(onglets === "tete,pancarte,miroir,reactions,bonjour,mois", `ses six onglets (${onglets})`);
const bo = await md.locator(".md-onglets").boundingBox();
ok(bo && bo.x >= 0 && bo.x + bo.width <= 390 && !(await deborde()), "… qui tiennent dans la largeur");
await md.locator('[data-onglet="bonjour"]').click();
const panneau = md.locator('[data-panneau="bonjour"]');
ok(/Mon bonjour/.test(await texte(panneau.locator("h2"))) && /Pas encore de bonjour/.test(await texte(panneau)), "« 🎙️ Mon bonjour » : pas encore de bonjour");
ok((await texte(panneau.locator("[data-bonjour-enregistrer]"))) === "🎙️ Enregistrer mon bonjour", "« 🎙️ Enregistrer mon bonjour »");
await panneau.locator("[data-bonjour-enregistrer]").click();
ok(await attendre(async () => (await panneau.locator("[data-bonjour-micro]").count()) === 1), "le micro s'allume");
ok(/^[1-5] s$/.test(await texte(panneau.locator("[data-bonjour-micro] b"))), `… les secondes qui restent (${await texte(panneau.locator("[data-bonjour-micro] b"))})`);
await lea.waitForTimeout(1600);
await lea.screenshot({ path: `${D}/bonjour-1-micro.png` });
await panneau.locator("[data-bonjour-fini]").click();
ok(await attendre(async () => (await panneau.locator("[data-bonjour-pret]").count()) === 1), "« ■ C'est dit » : son bonjour est prêt");
const duree = Number(await panneau.locator("[data-bonjour-pret]").getAttribute("data-bonjour-pret"));
ok(duree >= 1 && duree <= 5, `… sa durée (${duree} s)`);
ok(/Écouter/.test(await texte(panneau.locator("[data-bonjour-ecouter-nouveau]"))) && (await panneau.locator("[data-bonjour-refaire]").count()) === 1, "… l'écouter, ou le refaire");
await panneau.locator("[data-bonjour-garder]").click();
ok(await attendre(async () => /Ton bonjour, partout/.test(await texte(md.locator("[data-dit]")))), "« ✓ Garder ce bonjour » : « ✓ Ton bonjour, partout… »");
ok(await attendre(async () => (await panneau.locator("[data-bonjour-sien]").count()) === 1), "… « ▶️ Écouter · Ton bonjour »");
await lea.screenshot({ path: `${D}/bonjour-2-garde.png` });
const dLea = (await appel(LEA, "/api/direct/mon-double")).corps?.double;
ok(dLea?.bonjour?.src?.startsWith(`/api/direct/bonjour/${LEA.cle}?v=`) && !dLea.bonjour.src.includes(LEA.id), "rangé : son adresse par sa clé (jamais son compte)");
const sonLea = await fetch(`${BASE}${dLea?.bonjour?.src}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } });
const octetsLea = Buffer.from(await sonLea.arrayBuffer());
ok(sonLea.status === 200 && /^audio\//.test(sonLea.headers.get("content-type") ?? "") && octetsLea.length > 1000, `sa vraie voix, au micro (${sonLea.headers.get("content-type")}, ${octetsLea.length} octets)`);
await md.locator("[data-retour-maison]").click();

// ═══ AU SALON DU FOOT, LÉA TOUCHE LA FIGURINE DE SAM ═══
await lea.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
const figSam = lea.locator(`.so-fig[data-q="${qSam}"]`);
ok(await attendre(async () => (await figSam.count()) === 1, 30000), "Léa entre : Sam est là");
const reponse = lea.waitForResponse((r) => r.url().includes(`/api/direct/bonjour/${SAM.cle}`), { timeout: 10000 }).catch(() => null);
await figSam.click({ force: true });
ok(await attendre(async () => (await lea.evaluate(() => window.__bonjours)).includes(srcSam)), "toucher sa figurine : on entend le bonjour de Sam");
const r = await reponse;
ok(r && [200, 206].includes(r.status()), `… sa voix arrive (${r?.status()})`);
const f = lea.locator(`[data-fiche="${qSam}"]`);
ok(await attendre(async () => (await f.count()) === 1), "… sa fiche s'ouvre");
const bouton = f.locator(`[data-bonjour-de="${qSam}"]`);
ok((await texte(bouton)) === "🔊 Le bonjour de Sam", `… « ${await texte(bouton)} »`);
await bouton.click();
ok(await attendre(async () => (await lea.evaluate(() => window.__bonjours.length)) >= 2), "… on peut le réécouter");
await lea.screenshot({ path: `${D}/bonjour-3-salon.png` });
ok(!(await deborde()), "rien ne déborde");

ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur (${erreurs.slice(0, 3).join(" | ")})`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nle bonjour, avec sa voix, sur un iPhone ✓");
process.exit(echecs ? 1 : 0);
