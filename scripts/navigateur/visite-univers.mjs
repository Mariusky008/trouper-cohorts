// 🚪 EN VISITE (« Univers », lot 6) — `/univers/chez/<clé>` et « Mon univers » (`/univers/monde`), sur un iPhone, contre
// le faux Supabase (jamais la vraie base).
//
// Inès, proche de Marc, entre chez lui : « Chez Marc », son décor, sa figurine, la sienne en visite ; « 🚪 Frapper à la
// porte » ; « 🎁 Laisser un souvenir » (un bouquet, un mot) ; « 🔑 Les clés de son univers ». Marc, dans son univers :
// « 🎁 Des souvenirs pour toi » — « Le poser chez moi » : le bouquet apparaît sur le sol de son décor ; « Qui est
// passé » : Inès ; « Qui peut entrer chez moi ? » : « 🌍 Tout le monde » demande 18 ans ou plus. 🏡 Lot 7 : dans
// « Découvrir », Inès voit « Les univers à visiter » — « Chez Marc ». Rien ne déborde, jamais le mot interdit, aucune
// erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const MARC = { id: "abababab-0000-4000-8000-000000000c01", jeton: "jeton-marc-visite-nav-00001", prenom: "Marc" };
const INES = { id: "abababab-0000-4000-8000-000000000c02", jeton: "jeton-ines-visite-nav-00001", prenom: "Inès" };
for (const x of [MARC, INES]) x.cle = cleProfil(x.id);
await semer("human_habitants", [MARC, INES].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of [MARC, INES]) {
  await deposer(`${x.id}/neutre-essai.webp`, img("pied/montre"), "image/webp");
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
}
await semer(
  "clik_ma_figurine",
  [MARC, INES].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/neutre-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${MARC.id}/proches.json`, { ids: [INES.id] });
await json(`${INES.id}/proches.json`, { ids: [MARC.id] });
const maintenant = new Date().toISOString();
const P1 = `${MARC.id}/perso/v1`;
for (const n of ["assise", "assise_parle", "debout"]) await deposer(`${P1}/${n}.png`, img("ecoute"), "image/webp");
const perso = {
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  references: { assise: { chemin: `${P1}/assise.png` }, assise_parle: { chemin: `${P1}/assise_parle.png` }, debout: { chemin: `${P1}/debout.png` } },
  historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
};
await json(`${P1}/fiche.json`, perso);
await json(`${MARC.id}/perso/fiche.json`, perso);
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

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const b = await lancer();
const erreurs = [];
async function tel(qui, admin = false) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }, ...(admin ? [{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }] : [])]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${qui.prenom} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));

// ═══ INÈS ENTRE CHEZ MARC ═══
const ines = await tel(INES);
await ines.goto(`${BASE}/univers/chez/${MARC.cle}`, { waitUntil: "networkidle" });
await ines.waitForSelector(".uv-scene .uv-decor", { timeout: 30000 }).catch(() => null);
ok((await texte(ines, ".uv-entete")) === "Chez Marc" && (await ines.locator(".uv-scene .uv-place").count()) === 2, "« Chez Marc » : son décor, sa figurine, et celle d'Inès en visite");
await ines.waitForTimeout(900);
await ines.screenshot({ path: `${D}/visite-univers-1-chez-marc.png` });
await ines.locator(".uv-gestes .uv-bouton", { hasText: "Frapper à la porte" }).click();
await ines.waitForSelector(".uv-message", { timeout: 10000 }).catch(() => null);
ok((await texte(ines, ".uv-message")).includes("Marc verra ta visite") && (await texte(ines, ".uv-gestes .uv-bouton")).includes("Tu as frappé"), "« 🚪 Frapper à la porte » : « Toc toc ! Marc verra ta visite. »");
await ines.locator(".uv-gestes .uv-bouton", { hasText: "Les clés de son univers" }).click();
ok((await texte(ines, ".uv-liste")).includes("je bricole tous les dimanches"), "entre proches : les clés de son univers, ses phrases");
await ines.locator(".uv-gestes .uv-bouton", { hasText: "Laisser un souvenir" }).click();
await ines.locator('.uv-objets button[aria-label="Un bouquet"]').click();
await ines.locator(".uv-mot input").fill("Pour ton atelier !");
await ines.locator(".uv-laisser .uv-bouton").click();
await ines.waitForFunction(() => document.querySelector(".uv-message")?.textContent?.includes("souvenir"), null, { timeout: 10000 }).catch(() => null);
ok((await texte(ines, ".uv-message")).includes("Ton souvenir est parti"), "« 🎁 Laisser un souvenir » : un bouquet, un mot — parti, Marc le verra");
ok((await debordement(ines)) <= 0 && (await sansMotInterdit(ines)), "la visite : rien ne déborde, sans le mot interdit");

// ═══ MARC, CHEZ LUI ═══
const marc = await tel(MARC, true);
await marc.goto(`${BASE}/univers/monde`, { waitUntil: "networkidle" });
await marc.waitForSelector(".um-visites .um-souvenir-attente", { timeout: 30000 }).catch(() => null);
ok((await texte(marc, ".um-visites")).includes("Des souvenirs pour toi") && (await texte(marc, ".um-souvenir-attente")).includes("de Inès : « Pour ton atelier ! »"), "Marc : « 🎁 Des souvenirs pour toi » — le bouquet d'Inès, son mot");
ok((await texte(marc, ".um-passes")).includes("Inès"), "« 🚪 Qui est passé » : Inès");
await marc.locator(".um-souvenir-attente button", { hasText: "Le poser chez moi" }).click();
await marc.waitForSelector(".um-scene .um-souvenir", { timeout: 10000 }).catch(() => null);
ok((await marc.locator(".um-scene .um-souvenir").count()) === 1, "« Le poser chez moi » : le bouquet apparaît sur le sol de son décor");
await marc.locator('.um-visibilite button[role="radio"]', { hasText: "Tout le monde" }).click();
ok((await marc.locator(".um-adulte").count()) === 1, "« 🌍 Tout le monde » : il faut avoir 18 ans ou plus");
await marc.locator(".um-adulte .um-bouton").click();
await marc.waitForFunction(() => document.querySelector('.um-visibilite button[aria-checked="true"]')?.textContent?.includes("Tout le monde"), null, { timeout: 10000 }).catch(() => null);
ok((await texte(marc, '.um-visibilite button[aria-checked="true"]')).includes("Tout le monde"), "« Oui, j'ai 18 ans ou plus » : son univers est ouvert à tous");
await marc.screenshot({ path: `${D}/visite-univers-2-chez-moi.png`, fullPage: true });
ok((await debordement(marc)) <= 0 && (await sansMotInterdit(marc)), "chez lui : rien ne déborde, sans le mot interdit");

// ═══ 🏡 « DÉCOUVRIR » : LES UNIVERS À VISITER (lot 7) ═══
await ines.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "networkidle" });
await fermerPablito(ines);
await ines.waitForSelector(".dv-univers .dv-univers-carte", { timeout: 30000 }).catch(() => null);
ok(
  (await texte(ines, ".dv-univers")).includes("Les univers à visiter") && (await ines.locator(".dv-univers-carte", { hasText: "Chez Marc" }).getAttribute("href")) === `/univers/chez/${MARC.cle}`,
  "« Découvrir » : « 🏡 Les univers à visiter » — Chez Marc, un toucher pour y entrer",
);

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nles visites tiennent ✓");
process.exit(echecs ? 1 : 0);
