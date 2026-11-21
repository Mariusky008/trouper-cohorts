// 🏠 « CHOISIS TA PIÈCE » — L'INSCRIPTION (`docs/univers/ma-maison.md`, section 3 ; le lot M3), sur un iPhone, contre le
// faux Supabase (jamais la vraie base). L'interrupteur `MA_MAISON_CATALOGUE` (allumé le 19 novembre 2026), ici freiné
// (`CLIKME_MA_MAISON=0`, comme toute la CI) : l'administrateur l'essaie en le demandant (`?piece=1`) ; sans, son
// parcours ne change pas. 🔀 ALLUMÉ (une seconde app, sans frein) : Zoé, sa figurine validée, sans rien demander :
// « 🏠 Choisis ta pièce » mène à l'onglet « Ma maison » ; la conversation avec Pablito y renvoie ; l'accueil aussi ;
// l'onglet s'ouvre sur le choix de sa pièce.
//
// Léa vient de valider sa figurine (« C'est moi ! ») : plus de « Découvrir ton univers » (la conversation avec Pablito),
// mais « 🏠 Choisis ta pièce » ; l'accueil `/univers` dit pareil (« Ta pièce t'attend »). On le touche : « Choisis ta
// pièce » s'ouvre, sans ✕ ; le hangar, « Je m'installe ici » : chez elle, sa figurine à sa place.
// Marc a un univers fabriqué avant : l'onglet « Ma maison », tel qu'il sera (`/univers/maison?onglet=1`), garde son
// univers, avec la carte « Nouveau : choisis ta pièce » ; « Plus tard » : un lien discret reste (même après avoir
// rechargé) ; le lien : le choix s'ouvre, avec ✕ (il revient à son univers) ; le salon : sa pièce, et plus de carte.
// Ni débordement, ni erreur, ni le mot « exemple ».
import fs from "node:fs";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, lancer } from "./commun.mjs";
import { lancerSecondeApp } from "../seconde-app.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

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
const LEA = { id: "4a150a15-0000-4000-8000-00000000cc01", jeton: "jeton-choisis-ta-piece-0001", prenom: "Léa" };
const MARC = { id: "4a150a15-0000-4000-8000-00000000cc02", jeton: "jeton-choisis-ta-piece-0002", prenom: "Marc" };
const ZOE = { id: "4a150a15-0000-4000-8000-00000000cc03", jeton: "jeton-choisis-ta-piece-0003", prenom: "Zoé" };
await semer("human_habitants", [LEA, MARC, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
// (leur figurine du nouveau style, validée)
for (const x of [LEA, MARC, ZOE]) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
}
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 16, adulte: false });
await json(`${MARC.id}/majeur.json`, { le: maintenant, age: 40, adulte: true });
await json(`${ZOE.id}/majeur.json`, { le: maintenant, age: 30, adulte: true });
// (Marc : son univers fabriqué avant, par la conversation avec Pablito)
const M1 = `${MARC.id}/monde/v1`;
await deposer(`${M1}/decor.png`, fs.readFileSync("public/direct/atelier-bijoux.jpg"), "image/jpeg");
await deposer(`${M1}/vedette.png`, fs.readFileSync("public/direct/atelier-bijoux.jpg"), "image/jpeg");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [{ id: "e1", quoi: "un établi", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true }],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.32, y: 0.84, echelle: 1 }, { id: "invite", x: 0.7, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${M1}/decor.png` }, vedette: { chemin: `${M1}/vedette.png` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${MARC.id}/monde/fiche.json`, monde);
await json(`${MARC.id}/monde/creation.json`, { version: 1, etape: "fini", mesure: 1 });
// (deux pièces prêtes : le hangar, le salon)
await poserPiece(deposer, "hangar", { le: maintenant });
await poserPiece(deposer, "salon", { fond: "#2a4b5c", sol: "#6a5040", le: maintenant });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const telephone = async (qui) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([
    { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
    { name: "clikme_habitant", value: qui.jeton, url: BASE },
  ]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  return p;
};
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
const propre = async (p, nom) => {
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
};

// ═══ LÉA : APRÈS « C'EST MOI ! » ═══
const p = await telephone(LEA);
// (sans le demander : le parcours d'aujourd'hui, tant que l'interrupteur est éteint)
await p.goto(`${BASE}/univers/figurine`, { waitUntil: "networkidle" });
ok(await attendre(p, async () => (await p.locator('a[href="/univers/conversation"]').count()) === 1 && (await p.locator('a[data-suite="piece"]').count()) === 0), "sans « ?piece=1 » : toujours « Découvrir ton univers » (l’interrupteur est éteint)");
await p.goto(`${BASE}/univers/figurine?piece=1`, { waitUntil: "networkidle" });
const suite = p.locator('a[data-suite="piece"]');
ok(await attendre(p, async () => (await suite.count()) === 1), "après « C’est moi ! » : « 🏠 Choisis ta pièce »");
ok((await suite.innerText()).includes("Choisis ta pièce") && (await suite.getAttribute("href")) === "/univers/maison", `… qui mène au choix de sa pièce (${await suite.getAttribute("href")})`);
ok((await p.locator('a[href="/univers/conversation"]').count()) === 0 && !(await p.evaluate(() => document.body.innerText)).includes("Découvrir ton univers"), "plus de conversation avec Pablito pour fabriquer l’univers");
ok((await p.locator(".nf-suite").innerText()).includes("choisis ta pièce"), "« Maintenant, choisis ta pièce : ta figurine y sera chez elle. »");
await p.screenshot({ path: `${D}/choisis-ta-piece-1-figurine.png` });
await propre(p, "la figurine validée");

// ═══ L'ACCUEIL /univers ═══
await p.goto(`${BASE}/univers?piece=1`, { waitUntil: "networkidle" });
const carte = p.locator('section[data-suite="piece"]');
ok(await attendre(p, async () => (await carte.count()) === 1), "l’accueil : « Ta pièce t’attend »");
ok((await carte.innerText()).includes("Ta pièce t’attend") && (await p.locator('a[href="/univers/conversation"]').count()) === 0, "… et plus « Parler avec Pablito »");
await p.screenshot({ path: `${D}/choisis-ta-piece-2-accueil.png` });
await carte.locator("a").click();

// ═══ LE CHOIX, PUIS CHEZ ELLE ═══
const choix = p.locator(".mmc-choix");
ok(await attendre(p, async () => (await choix.count()) === 1 && (await p.locator(".mmc-carte[data-piece]").count()) === 2), "« Choisis ta pièce » s’ouvre : les pièces prêtes");
ok((await p.locator(".mmc-fermer").count()) === 0, "… sans ✕ (il faut choisir)");
ok((await p.locator(".mmc-carte[data-piece]").first().getAttribute("data-piece")) === "hangar", "… le hangar d’abord (16 ans)");
await p.locator('.mmc-carte[data-piece="hangar"]').click();
await p.locator('button[data-geste="installer"]').click();
ok(await attendre(p, async () => (await p.locator(".mmc-fig img").count()) === 1 && (await choix.count()) === 0), "« Je m’installe ici » : chez elle, sa figurine au centre");
await p.screenshot({ path: `${D}/choisis-ta-piece-3-chez-elle.png` });
await propre(p, "chez elle");

// ═══ MARC : SON UNIVERS D'AVANT, ET LA CARTE ═══
const q = await telephone(MARC);
await q.goto(`${BASE}/univers/maison?onglet=1`, { waitUntil: "networkidle" });
const carteMarc = q.locator('[data-carte-piece="carte"]');
ok(await attendre(q, async () => (await carteMarc.count()) === 1 && (await q.locator(".cm-fenetre").count()) >= 1), "Marc (un univers fabriqué avant) : son univers, et la carte « Nouveau : choisis ta pièce »");
ok((await carteMarc.innerText()).includes("Ton univers reste à toi"), "… qui dit que son univers lui reste");
ok((await q.locator(".mmc-choix").count()) === 0, "… sans lui imposer le choix");
await q.screenshot({ path: `${D}/choisis-ta-piece-4-carte.png` });
await propre(q, "la carte");
await carteMarc.getByRole("button", { name: "Plus tard" }).click();
const lien = q.locator('[data-carte-piece="lien"]');
ok(await attendre(q, async () => (await lien.count()) === 1 && (await carteMarc.count()) === 0), "« Plus tard » : la carte s’en va, un lien discret reste");
await q.reload({ waitUntil: "networkidle" });
ok(await attendre(q, async () => (await lien.count()) === 1 && (await carteMarc.count()) === 0), "rechargé : toujours le lien, plus la carte (proposée une fois)");
await lien.click();
ok(await attendre(q, async () => (await q.locator(".mmc-choix").count()) === 1 && (await q.locator(".mmc-fermer").count()) === 1), "le lien : le choix s’ouvre, avec ✕");
ok((await q.locator(".mmc-carte[data-piece]").first().getAttribute("data-piece")) === "salon", "… le salon d’abord (un adulte)");
await q.locator(".mmc-fermer").click();
ok(await attendre(q, async () => (await lien.count()) === 1 && (await q.locator(".mmc-choix").count()) === 0), "✕ : il revient à son univers");
await lien.click();
await q.locator('.mmc-carte[data-piece="salon"]').click();
await q.locator('button[data-geste="installer"]').click();
ok(await attendre(q, async () => (await q.locator(".mmc-fig img").count()) === 1 && (await q.locator(".mmc-choix").count()) === 0), "le salon : sa pièce");
await q.reload({ waitUntil: "networkidle" });
ok(await attendre(q, async () => (await q.locator(".mmc-fig img").count()) === 1 && (await q.locator("[data-carte-piece]").count()) === 0), "rechargé : sa pièce, plus de carte");
await q.screenshot({ path: `${D}/choisis-ta-piece-5-sa-piece.png` });
await propre(q, "sa pièce");

// ═══ 🔀 L'INTERRUPTEUR ALLUMÉ (19 novembre 2026) : ZOÉ, SANS RIEN DEMANDER ═══
// (une seconde app, comme en ligne : « Univers pour tous » et « Ma maison » allumés — `BASE_ALLUMEE` : celle qu'on a
// lancée soi-même, en local)
const { base: ALLUME, arreter } = process.env.BASE_ALLUMEE ? { base: process.env.BASE_ALLUMEE, arreter: () => {} } : await lancerSecondeApp({ env: { CLIKME_UNIVERS_POUR_TOUS: "1", CLIKME_MA_MAISON: "1" } });
const ctxZ = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctxZ.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: ALLUME },
  { name: "clikme_habitant", value: ZOE.jeton, url: ALLUME },
]);
const z = await ctxZ.newPage();
z.on("pageerror", (e) => erreurs.push(String(e)));
await z.goto(`${ALLUME}/univers/figurine`, { waitUntil: "networkidle" });
const suiteZ = z.locator('a[data-suite="piece"]');
ok(await attendre(z, async () => (await suiteZ.count()) === 1), "allumé, sans « ?piece=1 » : après « C’est moi ! », « 🏠 Choisis ta pièce »");
ok((await suiteZ.getAttribute("href")) === "/collection#maison" && (await z.locator('a[href="/univers/conversation"]').count()) === 0, `… qui mène à l’onglet « Ma maison » (${await suiteZ.getAttribute("href")}), plus à Pablito`);
await z.goto(`${ALLUME}/univers/conversation`, { waitUntil: "networkidle" });
ok(await attendre(z, async () => new URL(z.url()).pathname === "/collection" && new URL(z.url()).hash === "#maison"), `la conversation avec Pablito renvoie au choix de sa pièce (${z.url().replace(ALLUME, "")})`);
// (ce téléphone d'essai n'a jamais vu la bienvenue de Pablito : on la passe, comme on l'a passée avant de faire sa figurine)
if (await attendre(z, async () => (await z.locator(".bv .tu-passer").count()) === 1, 8000)) await z.locator(".bv .tu-passer").click();
ok(await attendre(z, async () => (await z.locator("#o-maison .mmc-choix").count()) === 1, 30000), "l’onglet « Ma maison » s’ouvre sur « Choisis ta pièce »");
await z.waitForTimeout(800);
await z.screenshot({ path: `${D}/choisis-ta-piece-6-allume.png` });
// (🎨 `ma-maison.md`, section 23 : dans l'onglet aussi, l'en-tête, la pièce en carte et les trois grands boutons)
await z.locator("#o-maison .mmc-carte[data-piece]").first().click();
await z.locator('#o-maison .mmc-apercu [data-geste="installer"]').click();
ok(await attendre(z, async () => (await z.locator("#o-maison .mmc-gros-bouton").count()) === 3 && /Ma maison/.test(await z.locator("#o-maison .mmc-entete").innerText())), "installée : dans l'onglet, « Ma maison », la pièce en carte, les trois grands boutons");
const cadreZ = await z.locator("#o-maison .mmc-cadre").boundingBox();
ok(cadreZ && cadreZ.height > 300 && cadreZ.width > 300, `… une vraie carte (${Math.round(cadreZ?.width)} × ${Math.round(cadreZ?.height)} pt)`);
const navZ = await z.locator(".mc-nav").boundingBox();
const grosZ = await z.locator("#o-maison .mmc-gros-bouton").first().boundingBox();
ok(navZ && grosZ && grosZ.y + grosZ.height <= navZ.y - 4, `… les trois grands boutons au-dessus de la barre du bas, sans faire défiler (${Math.round(grosZ?.y + grosZ?.height)} / ${Math.round(navZ?.y)} pt)`);
await z.waitForTimeout(600);
await z.screenshot({ path: `${D}/choisis-ta-piece-7-onglet.png` });
await z.goto(`${ALLUME}/univers`, { waitUntil: "networkidle" });
ok(await attendre(z, async () => (await z.locator('section[data-suite="piece"] a[href="/collection#maison"]').count()) === 1), "l’accueil `/univers` : « Ta pièce t’attend », vers l’onglet");
const creer = await z.evaluate(async () => (await fetch("/api/direct/univers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "creer" }) })).status);
ok(creer === 410, `Pablito ne fabrique plus d’univers (${creer})`);
arreter();

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\n« Choisis ta pièce » : tout est bon");
process.exit(echecs ? 1 : 0);
