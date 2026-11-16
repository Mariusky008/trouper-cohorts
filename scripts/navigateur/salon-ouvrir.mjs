// 🚪 OUVRIR UNE CONVERSATION DU SALON, VITE (`docs/univers/salon-du-duo.md`, sections 7.2, 7.4, 7.6 et 11 ; lot S0b) —
// l'adresse d'essai `/univers/salon`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// L'administrateur (Léa sur ce téléphone) et Sam sont proches ; le salon est fait. « Tes conversations » : Sam,
// préchargé dans un temps mort (sa requête `?ouvrir=` et sa pièce partent avant qu'on le touche) ; on le touche : la
// vignette floue, puis la pièce (son adresse stable), les temps mesurés (« première fois sur ce téléphone »), et la
// mesure part à « ⚡ La vitesse du salon » ; « ← Le moteur », puis Sam encore : « déjà vue ». Un nouvel onglet : la pièce
// vient du cache du téléphone (rien de téléchargé). LA VITESSE, LE PROCESSEUR RALENTI ×4 : une conversation déjà vue
// s'ouvre en moins de 800 ms (du toucher à la scène prête) ; pendant des effets, la plus longue image est mesurée. Ni
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f30${String(n).padStart(2, "0")}`, jeton: `jeton-salon-ouvrir-nav-00${String(n).padStart(2, "0")}`, prenom });
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
// (le salon : une pièce dessinée, en trois lumières)
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="640" fill="${fond}"/><rect y="640" width="1536" height="384" fill="#8a6a4a"/><rect x="380" y="560" width="780" height="260" rx="60" fill="#3c6e8a"/><rect x="980" y="80" width="420" height="300" fill="#bfe3ff"/></svg>`))
    .png()
    .toBuffer();
await deposer("pieces-duo/salon/decor.png", await piece("#5b4a6e"), "image/png");
await deposer("pieces-duo/salon/lumiere-matin.png", await piece("#9a8ab0"), "image/png");
await deposer("pieces-duo/salon/lumiere-nuit.png", await piece("#1d1830"), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, ajuste: true, emplacements: { cadres: [], places: [{ x: 0.4, y: 0.82, hauteur: 0.3 }, { x: 0.6, y: 0.82, hauteur: 0.3 }] } });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const demandes = [];
ctx.on("request", (r) => demandes.push({ url: r.url(), methode: r.method(), le: Date.now() }));
const surveiller = (p) => {
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
};
const p = await ctx.newPage();
surveiller(p);
const attendre = async (f, ms = 8000, page = p) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f()) return true;
    await page.waitForTimeout(100);
  }
  return false;
};
const texte = async (sel, page = p) => (await page.locator(sel).first().innerText({ timeout: 10000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const ouvrirs = () => demandes.filter((d) => d.url.includes(`/api/direct/proches?ouvrir=${SAM.cle}`));
const fichiers = () => demandes.filter((d) => /\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/.test(d.url));

// ═══ « TES CONVERSATIONS » ; LE PRÉCHARGEMENT ═══
await p.goto(`${BASE}/univers/salon`, { waitUntil: "networkidle" });
const sam = p.locator(`[data-proche="${SAM.cle}"]`);
ok(await attendre(async () => (await sam.count()) === 1), "« Tes conversations » : Sam");
ok(await attendre(async () => ouvrirs().length >= 1 && fichiers().length >= 1, 6000), `Sam préchargé dans un temps mort : sa conversation et sa pièce, avant qu'on le touche (${ouvrirs().length} ouverture, ${fichiers().length} fichier)`);

// ═══ LE TOUCHER ═══
const avantToucher = fichiers().length;
await sam.click();
ok(await attendre(async () => (await p.locator(".em-scene[data-pret] .sc-plaque").count()) === 1), "on touche Sam : la scène, sa pièce");
const src = await p.locator(".sc-plaque").getAttribute("src");
ok(/^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-1080\.webp$/.test(src ?? ""), `la pièce à son adresse stable (${src})`);
ok(fichiers().length === avantToucher, "rien de retéléchargé : la pièce préchargée sert telle quelle");
ok((await p.locator(".em-scene[data-flou]").count()) === 1 && /^url\("data:image\/webp;base64,/.test(await p.locator(".em-scene").evaluate((e) => e.style.backgroundImage)), "la vignette floue, sous la pièce");
ok(new URL(p.url()).searchParams.get("avec") === SAM.cle, "l'adresse dit avec qui (?avec=)");
ok(await attendre(async () => /La pièce à l’écran : \d+ ms · prête : \d+ ms/.test(await texte(".em-temps"))), `les temps mesurés (${await texte(".em-temps")})`);
ok(/première fois sur ce téléphone/.test(await texte(".em-temps")), "« première fois sur ce téléphone »");
ok((await texte(".em-tableau header b")) === "🚪 Avec Sam", "« 🚪 Avec Sam »");
await p.screenshot({ path: `${D}/salon-ouvrir-1-conversation.png` });
ok(await attendre(() => demandes.some((d) => d.methode === "POST" && d.url.endsWith("/api/direct/salon")), 5000), "la mesure part (une fois, après l'arrivée)");
await p.waitForTimeout(500);
ok(demandes.filter((d) => d.methode === "POST" && d.url.endsWith("/api/direct/salon")).length === 1, "… une seule fois");

// ═══ RETOUR, PUIS SAM ENCORE ═══
await p.getByRole("button", { name: "← Le moteur" }).click();
ok(await attendre(async () => (await sam.count()) === 1), "« ← Le moteur » : la liste revient");
ok(await attendre(async () => /Déjà vue|la première fois : médiane \d+ ms/.test(await texte(".em-vitesse"))), `« ⚡ La vitesse du salon » compte l'ouverture (${await texte(".em-vitesse")})`);
await sam.click();
ok(await attendre(async () => /déjà vue sur ce téléphone/.test(await texte(".em-temps"))), `Sam encore : « déjà vue » (${await texte(".em-temps")})`);

// ═══ UN NOUVEL ONGLET : LA PIÈCE VIENT DU CACHE ═══
const p2 = await ctx.newPage();
surveiller(p2);
await p2.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "networkidle" });
ok(await attendre(async () => (await p2.locator(".em-scene[data-pret] .sc-plaque").count()) === 1, 8000, p2), "un nouvel onglet, directement sur Sam : la scène");
const venue = await p2.evaluate((u) => {
  const e = performance.getEntriesByType("resource").find((x) => x.name.endsWith(u));
  return e ? { transfert: e.transferSize, octets: e.decodedBodySize } : null;
}, src);
ok(venue && venue.transfert === 0 && venue.octets > 0, `la pièce vient du cache du téléphone : rien de téléchargé (${JSON.stringify(venue)})`);
await p2.close();

// ═══ LA VITESSE, LE PROCESSEUR RALENTI ×4 ═══
// (un onglet neuf, directement sur Sam : la requête `?ouvrir=` part pour de bon, la pièce vient du cache)
const p3 = await ctx.newPage();
surveiller(p3);
const cdp = await ctx.newCDPSession(p3);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await p3.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => /prête : \d+ ms/.test(await texte(".em-temps", p3)), 20000, p3), "ralenti ×4 : Sam s'ouvre");
const pret = Number(/prête : (\d+) ms/.exec(await texte(".em-temps", p3))?.[1]);
ok(pret < 800, `ralenti ×4 : une conversation déjà vue, prête en moins de 800 ms, la requête comprise (${pret} ms)`);
const pire = await p3.evaluate(
  () =>
    new Promise((ok) => {
      let pire = 0;
      let avant = performance.now();
      const fin = avant + 2000;
      for (const n of ["💗 Cœurs", "✨ Étincelles", "💥 Lettrage"]) [...document.querySelectorAll("button")].find((x) => x.textContent.includes(n))?.click();
      const image = (t) => {
        pire = Math.max(pire, t - avant);
        avant = t;
        if (t < fin) requestAnimationFrame(image);
        else ok(Math.round(pire));
      };
      requestAnimationFrame(image);
    }),
);
// (une mesure, pas encore un seuil : « aucune image de plus de 50 ms pendant un geste » s'essaiera sur les gestes, lot S3)
console.log(`  (ralenti ×4 : la plus longue image pendant cœurs, étincelles et lettrage : ${pire} ms)`);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
await p3.close();

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nouvrir le salon : tout est bon");
process.exit(echecs ? 1 : 0);
