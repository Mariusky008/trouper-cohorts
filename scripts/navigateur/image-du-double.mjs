// 📸 « MA FIGURINE DU JOUR », L'IMAGE À PARTAGER (`docs/univers/ma-figurine.md`, lot 3) — sur un iPhone, contre le
// faux Supabase et le faux moteur d'image.
//
// Léa a sa figurine et ses sept expressions. Dans « Mon double du jour », elle choisit le rire et écrit sa pancarte, puis
// touche « 📸 Mon image du jour » : l'image se prépare, puis s'affiche (1080 × 1350), avec « 📲 Partager » et
// « ⬇️ Enregistrer ». « Partager » ouvre la feuille de partage du téléphone avec le fichier « ma-figurine-du-jour.png » ;
// « Enregistrer » le télécharge. « Fermer » : retour à son double. Rien ne déborde, ni erreur, ni le mot « exemple ».
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

const qui = (n, prenom) => ({ id: `1d0b1e00-0000-4000-8000-00000000ee0${n}`, jeton: `jeton-image-double-000${n}`, prenom });
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

// ═══ SES SEPT EXPRESSIONS ═══
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
ok((await get("/api/direct/ma-figurine", LEA)).statut === 200, "Léa ouvre l'appli");
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le && e.tetes?.rire ? e : null;
}, 90000);
ok(Boolean(etat), "ses sept expressions sont prêtes");
await humeur("tristesse");

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, acceptDownloads: true });
await ctx.addCookies([
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
]);
// (la feuille de partage du téléphone : on note ce qu'on lui donne)
await ctx.addInitScript(() => {
  window.__partages = [];
  navigator.canShare = (d) => Boolean(d?.files?.length);
  navigator.share = async (d) => {
    window.__partages.push({ texte: d.text ?? "", fichiers: (d.files ?? []).map((f) => ({ nom: f.name, type: f.type, taille: f.size })) });
  };
});
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
ok(await attendre(lea, async () => (await chez.locator('.mmc-fig [data-tete-du-jour="triste"]').count()) === 1, 30000), "chez elle : sa figurine (la tête de son humeur)");
await chez.locator(".mmc-fig").click();
const md = lea.locator("[data-mon-double]");
ok(await attendre(lea, async () => (await md.locator('.md-scene [data-tete-du-jour="triste"]').count()) === 1), "« Mon double du jour » s'ouvre");
await md.locator('[data-tete="rire"]').click();
ok(await attendre(lea, async () => (await md.locator('.md-scene [data-tete-du-jour="rire"]').count()) === 1), "😂 elle choisit le rire");
await md.locator('[data-onglet="pancarte"]').click();
await md.locator('[data-champ="pancarte"]').fill("Qui vient prendre un café ?");
await md.locator("[data-garder-pancarte]").click();
ok(await attendre(lea, async () => (await md.locator(".md-scene .pcte").getAttribute("data-pancarte")) === "Qui vient prendre un café ?"), "🪧 sa pancarte");

// ═══ « 📸 MON IMAGE DU JOUR » ═══
const bouton = md.locator("[data-image-du-double]");
ok((await texte(bouton)) === "📸 Mon image du jour", `le bouton, sur sa figurine : « ${await texte(bouton)} »`);
const [bs, sc] = await Promise.all([bouton.boundingBox(), md.locator(".md-scene").boundingBox()]);
ok(bs && sc && bs.x >= sc.x && bs.y + bs.height <= sc.y + sc.height && bs.height >= 36, "… dans la scène, assez grand pour le pouce");
await bouton.click();
const feuille = lea.locator("[data-image-du-jour]");
ok(await attendre(lea, async () => (await feuille.count()) === 1), "la feuille s'ouvre");
ok(await attendre(lea, async () => (await feuille.getAttribute("data-image-du-jour")) === "pret", 30000), "l'image se fabrique, puis s'affiche");
const img = feuille.locator("img[data-apercu]");
ok(await attendre(lea, async () => (await img.evaluate((i) => i.complete && i.naturalWidth)) === 1080), "« Ton image du jour » : l’image est là");
const taille = await img.evaluate((i) => [i.naturalWidth, i.naturalHeight]);
ok(taille[0] === 1080 && taille[1] === 1350, `1080 × 1350 (${taille.join(" × ")})`);
const [bi, bf] = await Promise.all([img.boundingBox(), feuille.locator(".idd-feuille").boundingBox()]);
ok(bi && bf && bi.x >= 0 && bi.x + bi.width <= 390 && bf.y >= 0 && bf.y + bf.height <= 844 + 1, `rien ne déborde (l'aperçu ${Math.round(bi?.width)} × ${Math.round(bi?.height)} pt)`);
ok(/Ton image du jour/.test(await texte(feuille)) && (await texte(feuille.locator("[data-partager-image]"))) === "📲 Partager" && (await texte(feuille.locator("[data-enregistrer-image]"))) === "⬇️ Enregistrer", "« 📲 Partager » et « ⬇️ Enregistrer »");
await lea.screenshot({ path: `${D}/image-du-double-1-apercu.png` });

await feuille.locator("[data-partager-image]").click();
ok(await attendre(lea, async () => (await lea.evaluate(() => window.__partages.length)) === 1), "« Partager » : la feuille de partage du téléphone");
const [p] = await lea.evaluate(() => window.__partages);
ok(p?.fichiers?.length === 1 && p.fichiers[0].nom === "ma-figurine-du-jour.png" && p.fichiers[0].type === "image/png" && p.fichiers[0].taille > 10000, `… avec son image (${JSON.stringify(p?.fichiers)})`);
ok(/ClikMe/.test(p?.texte ?? ""), `… et une phrase : « ${p?.texte} »`);

const [dl] = await Promise.all([lea.waitForEvent("download", { timeout: 10000 }).catch(() => null), feuille.locator("[data-enregistrer-image]").click()]);
ok(dl?.suggestedFilename() === "ma-figurine-du-jour.png", `« Enregistrer » : le fichier se télécharge (${dl?.suggestedFilename()})`);

await feuille.locator("[data-fermer-image]").click();
ok(await attendre(lea, async () => (await feuille.count()) === 0 && (await md.count()) === 1), "« Fermer » : retour à son double");

ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur (${erreurs.slice(0, 3).join(" | ")})`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nl'image de mon double du jour, sur un iPhone ✓");
process.exit(echecs ? 1 : 0);
