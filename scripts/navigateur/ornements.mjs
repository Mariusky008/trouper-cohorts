// 🔥🎧❤️ « ELLE CHANGE TOUTE SEULE » (`docs/univers/ma-figurine.md`, section 3 ; le propriétaire, le 25 novembre 2026 :
// « oui ok si c'est pas trop coûteux ») — sur un iPhone, contre le faux Supabase et le faux moteur d'image.
//
// Léa vient depuis huit jours de suite, va surtout au salon de la musique, et Sam lui a offert une surprise. Chez elle,
// sa figurine porte toute seule son auréole (au-dessus de sa tête), le cœur de
// Sam, et deux étiquettes : « 🔥 8 » et « 🎁 offert par Sam ». Son double du jour dit pourquoi, en trois lignes. Sam,
// en visite, la voit pareille. Rien ne déborde, ni erreur, ni le mot « exemple ».
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

const qui = (n, prenom) => ({ id: `0e0e0e00-0000-4000-8000-00000000ff0${n}`, jeton: `jeton-ornements-nav-000${n}`, prenom });
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
ok(faites.length === 8 && faites.some((c) => c.includes("TALKING")) && faites.some((c) => c.includes("SAD") && c.includes("no tears running")) && faites.some((c) => c.includes("GRUMPY") && c.includes("never scary")), `huit demandes au moteur : la tristesse et la colère comprises, tendres, et la bouche ouverte (${faites.length})`);

// ═══ SON HUMEUR DU JOUR : LA TRISTESSE ═══
await humeur("tristesse");
// (🔥 sept jours d'avant ; aujourd'hui s'est ajouté quand elle a ouvert l'appli — 🎧 la musique, son salon ; ❤️ la surprise de Sam)
const jourDe = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(ms));
await json(`${LEA.id}/presence.json`, { jours: [7, 6, 5, 4, 3, 2, 1, 0].map((n) => jourDe(Date.now() - n * 86_400_000)) });
await json(`${LEA.id}/mes-salons.json`, { themes: { musique: { n: 3, dernier: Date.now() - 3600_000 } } });
await json(`${LEA.id}/coeur.json`, { prenom: "Sam", sorte: "surprise", le: new Date().toISOString() });
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
const orn = chez.locator(".mmc-fig .orn");

// ═══ CHEZ ELLE : CE QU'ELLE PORTE TOUTE SEULE ═══
ok(await attendre(lea, async () => (await orn.count()) === 1, 30000), "chez elle : sa figurine porte ses détails");
const dit = (await orn.getAttribute("data-ornements")) ?? "";
ok(/aureole/.test(dit) && !/musique/.test(dit) && /coeur/.test(dit), `… l'auréole, le cœur, plus de casque (${dit})`);
const [fig, tete, aureole, casque, coeurB] = await Promise.all([chez.locator(".mmc-fig").boundingBox(), chez.locator(".mmc-fig .mmc-fig-tete").boundingBox(), orn.locator("[data-aureole]").boundingBox(), orn.locator("[data-accessoire]").count(), orn.locator("[data-coeur]").boundingBox()]);
ok(aureole && tete && aureole.y + aureole.height <= tete.y + tete.height * 0.1 && Math.abs(aureole.x + aureole.width / 2 - (tete.x + tete.width / 2)) < 4, `😇 l'auréole, au-dessus de sa tête (${Math.round(aureole?.y + aureole?.height)} / ${Math.round(tete?.y)} pt)`);
ok(casque === 0, "🎧 plus de casque posé sur sa tête (retiré le 27 novembre)");
ok(coeurB && tete && fig && coeurB.y > tete.y + tete.height * 0.9 && coeurB.y + coeurB.height < fig.y + fig.height, "❤️ le cœur, sur sa poitrine");
ok(/🔥 8/.test(await texte(orn.locator(".orn-serie"))) && (await texte(orn.locator(".orn-souvenir"))) === "🎁 offert par Sam", `les étiquettes : « 🔥 8 », « 🎁 offert par Sam »`);
await lea.waitForTimeout(500);
await lea.screenshot({ path: `${D}/ornements-1-maison.png` });

// ═══ SON DOUBLE DU JOUR DIT POURQUOI ═══
await chez.locator('[data-geste="ma-figurine"]').click();
const md = lea.locator("[data-mon-double]");
ok(await attendre(lea, async () => (await md.locator(".md-fig .orn [data-coeur]").count()) === 1 && (await md.locator(".md-fig .orn [data-accessoire]").count()) === 0), "« Mon double du jour » : la même, sans casque");
const liste = md.locator("[data-ornements-liste]");
ok(await attendre(lea, async () => /Ce qu’elle porte toute seule/.test(await texte(md))), "« ✨ Ce qu'elle porte toute seule »");
ok(/7 jours de suite/.test(await texte(liste.locator('[data-ligne-orn="serie"]'))) && /depuis 8 jours de suite/.test(await texte(liste.locator('[data-ligne-orn="serie"]'))), `🔥 « Son auréole : 7 jours de suite » — « Tu viens depuis 8 jours de suite… » (${await texte(liste.locator('[data-ligne-orn="serie"]'))})`);
ok((await liste.locator('[data-ligne-orn="passion"]').count()) === 0, "🎧 plus de ligne « Le casque de la musique »");
ok(/offert par Sam/.test(await texte(liste.locator('[data-ligne-orn="coeur"]'))) && /Une surprise de Sam, ouverte/.test(await texte(liste.locator('[data-ligne-orn="coeur"]'))), "❤️ « offert par Sam — Une surprise de Sam, ouverte »");
ok(!(await lea.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), "rien ne déborde");
await lea.screenshot({ path: `${D}/ornements-2-double.png` });
await md.locator("[data-retour-maison]").click();

// ═══ SAM, EN VISITE : PAREILLE ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const visite = sam.locator(".mmc-visite .mmc-scene");
const frapper = visite.locator('[data-geste="frapper"]');
if (await attendre(sam, async () => (await frapper.count()) === 1, 15000)) await frapper.click();
ok(await attendre(sam, async () => (await visite.locator(".mmc-fig .orn [data-accessoire]").count()) === 0 && (await texte(visite.locator(".mmc-fig .orn-souvenir"))) === "🎁 offert par Sam", 20000), "Sam, chez Léa : l'auréole, « 🎁 offert par Sam », sans casque");
await sam.waitForTimeout(400);
await sam.screenshot({ path: `${D}/ornements-3-visite.png` });

for (const p of [lea, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
