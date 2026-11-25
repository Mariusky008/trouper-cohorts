// 👀 « PENDANT TON ABSENCE », SA FIGURINE RACONTE SA JOURNÉE (`docs/univers/ma-figurine.md`, section 4 ; le
// propriétaire : « qui m'a fait coucou, qui est passé chez moi, combien m'ont vue dans les salons. Des prénoms, des vrais
// chiffres, jamais inventés ») — sur un iPhone, contre le faux Supabase.
//
// Léa ouvre « Pendant ton absence » : en haut, sa figurine raconte sa journée dans une bulle — « 👋 Sam m'a fait
// coucou », « 🚪 Visite de Sam chez toi », « 👀 4 personnes m'ont vue dans les salons — Dont Hugo, Tom et Nina ».
// Rien ne déborde, ni erreur, ni le mot « exemple ».
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
const expressionsIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string" && c.startsWith("IMAGE ") && c.includes("The head keeps EXACTLY the same position"));
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

const qui = (n, prenom) => ({ id: `10e10e00-0000-4000-8000-00000000bb0${n}`, jeton: `jeton-journee-nav-000${n}`, prenom });
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
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const humeur = (visage, j = jour) => json(`${LEA.id}/humeur.json`, { jour: j, visage, le: new Date().toISOString() });
const get = async (chemin, q) => {
  const r = await fetch(`${BASE}${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};

// ═══ LÉA OUVRE L'APPLI : SES SEPT EXPRESSIONS ═══
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
const SEPT = ["sourire", "rire", "surprise", "bof", "grimace", "triste", "fache"];
const ADRESSE = /^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/;
const avant = (await expressionsIA()).length;
ok((await get("/api/direct/ma-figurine", LEA)).statut === 200, "Léa ouvre l'appli");
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le ? e : null;
}, 90000);
ok(SEPT.every((e) => ADRESSE.test(etat?.tetes?.[e] ?? "")), `ses sept expressions, à adresse stable (${Object.keys(etat?.tetes ?? {}).join(", ")})`);
const faites = (await expressionsIA()).slice(avant);
ok(faites.length === 7 && faites.some((c) => c.includes("SAD") && c.includes("no tears running")) && faites.some((c) => c.includes("GRUMPY") && c.includes("never scary")), `sept demandes au moteur : la tristesse et la colère comprises, tendres (${faites.length})`);

// ═══ SON HUMEUR DU JOUR : LA TRISTESSE ═══
await humeur("tristesse");
// (👀 sa journée : Hugo lui a fait coucou, Sam est passé, quatre personnes l'ont vue dans les salons — Hugo est le dernier)
const ilYa = (ms) => new Date(Date.now() - ms).toISOString();
await json(`${LEA.id}/monde/coucous.json`, { liste: [{ id: "c-hugo", de: SAM.id, le: ilYa(900_000), laisse_le: ilYa(60_000) }] });
await json(`${LEA.id}/monde/visites.json`, { liste: [{ de: SAM.id, le: ilYa(600_000) }] });
await json(`${LEA.id}/ma-journee.json`, { jour, salons: { a1: "Zoé", b2: "Nina", c3: "Tom", d4: "Hugo" } });
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const tel = async (q, admin = false) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }, ...(admin ? [{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }] : [])]);
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
const lea = await tel(LEA, true);
await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
ok(await attendre(lea, async () => (await chez.locator('[data-geste="absence"]').count()) === 1, 30000), "chez elle : « Pendant ton absence »");
await lea.waitForTimeout(800);
await chez.locator('[data-geste="absence"]').click();
const j = lea.locator("[data-absence] [data-journee]");
ok(await attendre(lea, async () => /Ma journée, racontée par ta figurine/.test(await texte(j))), "en haut : « 👀 Ma journée, racontée par ta figurine »");
ok(await attendre(lea, async () => (await j.locator("img").evaluate((i) => i.complete && i.naturalWidth > 0).catch(() => false))), "… sa figurine, qui la raconte");
ok((await texte(j.locator('[data-journee-ligne="coucous"]'))) === "👋 Sam m’a fait coucou", `« 👋 Sam m'a fait coucou » (${await texte(j.locator('[data-journee-ligne="coucous"]'))})`);
ok((await texte(j.locator('[data-journee-ligne="visites"]'))) === "🚪 Visite de Sam chez toi", "« 🚪 Visite de Sam chez toi »");
const salons = await texte(j.locator('[data-journee-ligne="salons"]'));
ok(/^👀 4 personnes m’ont vue dans les salons Dont Hugo, Tom et Nina$/.test(salons), `« 👀 4 personnes m'ont vue dans les salons — Dont Hugo, Tom et Nina » (${salons})`);
const [bulle, feuille] = await Promise.all([j.locator(".acm-journee-bulle").boundingBox(), lea.locator("[data-absence] .acm-feuille").boundingBox()]);
ok(bulle && feuille && bulle.x >= feuille.x - 1 && bulle.x + bulle.width <= feuille.x + feuille.width + 1, "la bulle tient dans la feuille");
ok(!(await lea.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), "rien ne déborde");
await lea.screenshot({ path: `${D}/journee-figurine-1.png` });

ok(!/exemple/i.test(await lea.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
