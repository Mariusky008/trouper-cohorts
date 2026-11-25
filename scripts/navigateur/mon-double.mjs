// ✨ « MA FIGURINE », MON DOUBLE DU JOUR (`docs/univers/ma-figurine.md`, lot 1 ; 25 novembre 2026, le propriétaire :
// « cette figurine dans ma maison doit être vraiment le centre de notre attention puisque c'est elle que les gens
// verront partout ») — sur un iPhone, contre le faux Supabase et le faux moteur d'image.
//
// Léa a sa figurine assise ; ses sept expressions se font ; son humeur du jour : la tristesse. Chez elle : plus de
// fanions ni de « Aujourd'hui, si tu veux » ; sa figurine brille au centre, et dessous, LE bouton « ✨ Ma figurine »,
// avec sa pastille « À préparer aujourd'hui ». Elle touche sa figurine : « Mon double du jour » s'ouvre, sa tête est
// celle de son humeur. Elle choisit 😂 le rire, écrit sa pancarte, essaie une réaction, regarde sa figurine du mois,
// puis « ✓ C'est moi aujourd'hui » : la pastille s'en va, sa figurine rit chez elle, sa pancarte au-dessus de sa tête.
// Sam, son proche, la voit pareille en visite. Rien ne déborde, ni erreur, ni le mot « exemple ».
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

const qui = (n, prenom) => ({ id: `5d0b1e00-0000-4000-8000-00000000ee0${n}`, jeton: `jeton-mon-double-000${n}`, prenom });
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
const bouton = chez.locator('.mmc-double[data-geste="ma-figurine"]');

// ═══ SA MAISON, ÉPURÉE : LA FIGURINE AU CENTRE ═══
ok(await attendre(lea, async () => (await chez.locator('.mmc-fig [data-tete-du-jour="triste"]').count()) === 1, 30000), "chez elle : sa figurine fait la tête de son humeur (triste)");
ok((await chez.locator('.mmc-fig[data-ma-figurine="1"] .mmc-halo').count()) === 1, "… elle brille (son halo)");
ok(await attendre(lea, async () => /Ma figurine/.test(await texte(bouton)) && /À préparer aujourd’hui/.test(await texte(bouton.locator("[data-pastille-double]")))), "« ✨ Ma figurine », sa pastille « À préparer aujourd’hui »");
const [bb, b0] = await Promise.all([bouton.boundingBox(), chez.locator(".mmc-tuiles .mmc-gros-bouton").first().boundingBox()]);
ok(bb && b0 && bb.width > b0.width * 2 && bb.height >= b0.height && bb.y < b0.y, `… le plus gros bouton de la page, au-dessus des trois autres (${Math.round(bb?.width)} × ${Math.round(bb?.height)} pt)`);
ok((await chez.locator("[data-fanions]").count()) === 0 && (await chez.locator(".mmc-puces").count()) === 0, "plus de fanions, plus de « Aujourd'hui, si tu veux »");
await lea.waitForTimeout(500);
await lea.screenshot({ path: `${D}/mon-double-1-maison.png` });

// ═══ ELLE TOUCHE SA FIGURINE : SON DOUBLE DU JOUR ═══
await chez.locator(".mmc-fig").click();
const md = lea.locator("[data-mon-double]");
ok(await attendre(lea, async () => /Mon double du jour/.test(await texte(md.locator(".md-haut"))) && /C’est elle que tout le monde voit/.test(await texte(md.locator(".md-haut")))), "toucher sa figurine : « Mon double du jour — C'est elle que tout le monde voit »");
ok(await attendre(lea, async () => /triste/i.test(await texte(md.locator("[data-etiquette]"))) && (await md.locator('.md-scene [data-tete-du-jour="triste"]').count()) === 1), `… sa tête : celle de son humeur (${await texte(md.locator("[data-etiquette]"))})`);
const onglets = await md.locator("[data-onglet]").evaluateAll((l) => l.map((x) => x.getAttribute("data-onglet")).join());
ok(onglets === "tete,pancarte,miroir,reactions,bonjour,mois", `ses six onglets (${onglets})`);
ok(/Mon humeur \(triste/i.test(await texte(md.locator('[data-tete="humeur"]'))) && (await md.locator('[data-panneau="tete"] [data-tete]').count()) === 8, "😊 « Sa tête du jour » : « Mon humeur (…) », puis ses sept têtes");
await md.locator('[data-tete="rire"]').click();
ok(await attendre(lea, async () => (await md.locator('[data-tete="rire"]').getAttribute("aria-pressed")) === "true" && /Partout aujourd’hui : .*rire/i.test(await texte(md.locator("[data-dit]")))), `😂 le rire : « ✓ Partout aujourd’hui : … » (${await texte(md.locator("[data-dit]"))})`);
ok(await attendre(lea, async () => (await md.locator('.md-scene [data-tete-du-jour="rire"]').count()) === 1), "… sa figurine rit");
await lea.screenshot({ path: `${D}/mon-double-2-tete.png` });

// 🪧 sa pancarte
await md.locator('[data-onglet="pancarte"]').click();
ok(await attendre(lea, async () => (await md.locator("[data-idee]").count()) > 2), "🪧 « Sa pancarte » : des idées, pour aller vite");
await md.locator('[data-champ="pancarte"]').fill("Une bière ce soir ?");
await md.locator("[data-garder-pancarte]").click();
ok(await attendre(lea, async () => /ne le dit pas/.test(await texte(md.locator("[data-erreur]")))), "« Une bière ce soir ? » : refusée (« Ça, ta figurine ne le dit pas »)");
const PHRASE = "Je fais des crêpes ce soir 🥞";
await md.locator('[data-champ="pancarte"]').fill(PHRASE);
await md.locator("[data-garder-pancarte]").click();
ok(await attendre(lea, async () => (await md.locator(".md-scene .pcte").getAttribute("data-pancarte")) === PHRASE && /ton mot du jour dans Autour/.test(await texte(md.locator("[data-dit]")))), "« Garder » : sa pancarte au-dessus de sa tête, « … et ton mot du jour dans Autour »");
const [pc, tt] = await Promise.all([md.locator(".md-scene .pcte-planche").boundingBox(), md.locator(".md-scene .md-fig, .md-scene [data-tete-du-jour]").first().boundingBox()]);
ok(pc && tt && pc.y + pc.height <= tt.y + tt.height * 0.35, `… au-dessus de sa tête (${Math.round(pc?.y + pc?.height)} / ${Math.round(tt?.y)} pt)`);
await lea.screenshot({ path: `${D}/mon-double-3-pancarte.png` });

// 🪞 le miroir (on ne l'allume pas ici : la caméra a son propre essai)
await md.locator('[data-onglet="miroir"]').click();
ok(await attendre(lea, async () => (await md.locator("[data-allumer]").count()) === 1), "🪞 « Le miroir » : « 📷 Allumer ma caméra »");
// 💃 ses réactions
await md.locator('[data-onglet="reactions"]').click();
ok(await attendre(lea, async () => (await md.locator("[data-reaction]").count()) === 6), "💃 ses six réactions à essayer");
await md.locator('[data-reaction="danse"]').click();
ok(await attendre(lea, async () => (await md.locator('[data-pop="danse"]').count()) === 1 && (await md.locator(".md-pose.r-danse").count()) === 1), "« Danser » : elle danse");
// 🗓️ sa figurine du mois
await md.locator('[data-onglet="mois"]').click();
ok(await attendre(lea, async () => /Sa figurine du mois/.test(await texte(md))), "🗓️ « Sa figurine du mois »");
ok(!(await lea.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll("[data-mon-double] *")].some((x) => x.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(x).position !== "fixed" && !x.closest(".md-onglets,.md-puces")))), "rien ne déborde");

// ✓ c'est moi aujourd'hui
await md.locator('[data-onglet="tete"]').click();
await md.locator("[data-valider]").click();
ok(await attendre(lea, async () => (await md.count()) === 0), "« ✓ C'est moi aujourd'hui » : retour à sa maison");
ok(await attendre(lea, async () => (await bouton.getAttribute("data-pret")) === "1" && (await bouton.locator("[data-pastille-double]").count()) === 0), "… la pastille s'en va");
ok(await attendre(lea, async () => (await chez.locator('.mmc-fig [data-tete-du-jour="rire"]').count()) === 1 && (await chez.locator(".mmc-fig .pcte").getAttribute("data-pancarte")) === PHRASE), "… chez elle, sa figurine rit, sa pancarte au-dessus de sa tête");
await lea.waitForTimeout(500);
await lea.screenshot({ path: `${D}/mon-double-4-pret.png` });
await lea.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await bouton.getAttribute("data-pret")) === "1" && (await chez.locator(".mmc-fig .pcte").count()) === 1, 20000), "recharger : prêt, et sa pancarte, gardés");

// ═══ SAM, EN VISITE : PAREILLE ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const visite = sam.locator(".mmc-visite .mmc-scene");
const frapper = visite.locator('[data-geste="frapper"]');
if (await attendre(sam, async () => (await frapper.count()) === 1, 15000)) await frapper.click();
ok(await attendre(sam, async () => (await visite.locator('.mmc-fig [data-tete-du-jour="rire"]').count()) === 1 && (await visite.locator(".mmc-fig .pcte").getAttribute("data-pancarte")) === PHRASE, 20000), "Sam, chez Léa : elle rit, sa pancarte au-dessus de sa tête");
ok((await visite.locator('[data-geste="ma-figurine"]').count()) === 0 && (await visite.locator(".mmc-halo").count()) === 0, "… sans son bouton « Ma figurine » (c'est le sien, pas celui de Sam)");
await sam.waitForTimeout(400);
await sam.screenshot({ path: `${D}/mon-double-5-visite.png` });

for (const p of [lea, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
