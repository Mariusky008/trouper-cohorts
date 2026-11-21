// 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`app/collection/maison-catalogue.tsx`, `docs/univers/ma-maison.md` ; le lot M1)
// — l'adresse d'essai `/univers/maison`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// L'administrateur (Léa, 15-17 ans, sur ce téléphone) n'a pas de pièce : « Choisis ta pièce » s'ouvre, sans ✕ ; les
// pièces prêtes seulement, celles des plus jeunes d'abord. Un toucher : le hangar en grand, « Je m'installe ici » : on
// est chez soi — l'image de la pièce (celle de la messagerie, en hauteur), sa figurine à sa place, « Touche les objets de
// ta pièce » (parti au premier toucher). Toucher la télé : ce qu'elle accueillera ; une lampe : elle s'allume, puis s'éteint ; la fenêtre : l'heure
// qu'il est ; sa figurine : elle sautille. ⚙️ : « Changer de pièce », le hangar marqué « Ta pièce » ; le salon : on y est.
// Recharger : le salon. Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";
import { poserPiece } from "../piece-en-hauteur.mjs";

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
const LEA = { id: "4a150a15-0000-4000-8000-00000000bb01", jeton: "jeton-ma-maison-nav-0001", prenom: "Léa" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: LEA.prenom, ville_slug: "dax" }]);
const maintenant = new Date().toISOString();
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
await deposer(`${LEA.id}/perso/v1/assise.png`, assise, "image/png");
const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${LEA.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${LEA.id}/perso/v1/fiche.json`, fiche);
await json(`${LEA.id}/perso/fiche.json`, fiche);
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 15, adulte: false });
// (deux pièces prêtes, dessinées : le hangar (ses zones posées à la main), le salon)
await poserPiece(deposer, "hangar", {
  le: maintenant,
  emplacements: {
    tele: [0.3, 0.2, 0.4, 0.16],
    fenetre: [0.04, 0.08, 0.22, 0.3],
    lampes: [[0.82, 0.46, 0.06, 0.2]],
    places: [
      { x: 0.3, y: 0.86, hauteur: 0.3 },
      { x: 0.7, y: 0.86, hauteur: 0.3 },
    ],
  },
});
await poserPiece(deposer, "salon", { fond: "#2a4b5c", sol: "#6a5040", lumieres: false, releve: false });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
const deborde = () => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);

// ─── « Choisis ta pièce » ───
await p.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const choix = p.locator('[role="dialog"][aria-label="Choisis ta pièce"]');
ok(await attendre(async () => (await choix.locator(".mmc-carte[data-piece]").count()) === 2), "sans pièce : « Choisis ta pièce » s'ouvre, les deux pièces prêtes seulement");
ok((await choix.locator(".mmc-carte[data-piece]").evaluateAll((l) => l.map((x) => x.getAttribute("data-piece")).join())) === "hangar,salon" && (await choix.locator(".mmc-fermer").count()) === 0, "celles des plus jeunes d'abord (le hangar, puis le salon) ; pas de ✕ : il faut choisir");
await p.screenshot({ path: `${D}/ma-maison-1-choix.png` });
await choix.locator('.mmc-carte[data-piece="hangar"]').click();
const apercu = p.locator('.mmc-apercu[aria-label="Le hangar"]');
ok(await attendre(async () => (await apercu.locator("img").evaluate((i) => i.complete && i.naturalWidth > 0)) === true), "un toucher : le hangar en grand");
await p.screenshot({ path: `${D}/ma-maison-2-apercu.png` });
await apercu.locator('[data-geste="installer"]').click();

// ─── chez soi ───
const scene = p.locator('.mmc-scene[data-piece="hangar"]');
ok(await attendre(async () => (await scene.count()) === 1 && (await p.locator(".mmc-choix").count()) === 0), "« Je m'installe ici » : on est chez soi, dans le hangar");
ok(await attendre(async () => (await scene.locator(".mmc-fond").evaluate((i) => i.complete && i.naturalWidth > 0)) && (await scene.locator(".mmc-fig img").evaluate((i) => i.complete && i.naturalWidth > 0))), "l'image de la pièce et sa figurine, chargées");
// (🎨 la maquette : l'en-tête, la pièce en carte, puis le bas — la pièce prend toute la hauteur de sa carte)
const vue = await scene.locator(".mmc-cadre").boundingBox();
const pano = await scene.locator(".mmc-pano").boundingBox();
ok(pano && Math.abs(pano.width / pano.height - 1024 / 1536) < 0.01 && Math.abs(pano.height - vue.height) < 2 && pano.width >= vue.width - 1, `une seule image, en hauteur, toute la hauteur de sa carte (${Math.round(pano?.width)} pt de large pour ${Math.round(pano?.height)} de haut)`);
ok(vue && vue.height > 844 * 0.55, `… une grande carte (${Math.round(vue?.height)} pt de haut)`);
ok(/^Ma maison$/.test((await scene.locator(".mmc-entete .mmc-nom").innerText()).trim()) && /Hangar|hangar/.test(await scene.locator(".mmc-entete .mmc-ou").innerText()) && (await scene.locator(".mmc-entete .mmc-medaillon img").count()) === 1, `l'en-tête : sa figurine en médaillon, « Ma maison », sa pièce et son moment (${await scene.locator(".mmc-entete .mmc-ou").innerText()})`);
const gros = scene.locator(".mmc-gros-bouton");
ok((await gros.count()) === 3 && /Pendant ton absence/.test(await gros.nth(0).innerText()) && /Ajouter chez moi/.test(await gros.nth(1).innerText()) && /Mes proches/.test(await gros.nth(2).innerText()), "le bas : « Pendant ton absence », « Ajouter chez moi », « 👯 Mes proches »");
const boites = await Promise.all([0, 1, 2].map((k) => gros.nth(k).boundingBox()));
ok(boites.every((x) => x && x.y + x.height <= 844 + 1 && x.height >= 56 && x.height < 90), `… les trois à l'écran, de la même taille (${boites.map((x) => Math.round(x?.height)).join(", ")} pt)`);
ok(/Aujourd’hui, si tu veux/i.test(await scene.locator(".mmc-puces").innerText()) && (await scene.locator('.mmc-puce[data-puce="tele"]').getAttribute("href")) === "/collection#decouvrir", "« Aujourd'hui, si tu veux » : « 📺 Ma télé »");
// (21 novembre 2026, le propriétaire : « des rectangles blancs autour de ce qui est cliquable » — plus de contours)
ok((await scene.locator(".mmc-cadre.montre").count()) === 0 && (await scene.locator(".mmc-zone").evaluateAll((l) => l.every((z) => /none|rgba\([^)]*, 0\)/.test(getComputedStyle(z, "::after").boxShadow)))), "pas de rectangles blancs autour de ce qui se touche");
// (sa figurine dans son fauteuil : la place de gauche du relevé, de la tête au sol, entière à l'écran)
const fig = await scene.locator(".mmc-fig").boundingBox();
ok(fig && Math.abs(fig.x + fig.width / 2 - (pano.x + 0.3 * pano.width)) < 4 && Math.abs(fig.y + fig.height - (pano.y + 0.86 * pano.height)) < 4 && Math.abs(fig.height - 0.3 * pano.height) < 4 && fig.x >= vue.x - 1 && fig.x + fig.width <= vue.x + vue.width + 1, `sa figurine à sa place, entière à l'écran (${Math.round(fig?.x + fig?.width / 2)} pt, ${Math.round(fig?.height)} pt de haut)`);
ok((await scene.locator(".mmc-indice").count()) === 1 && /Ta maison se remplit toute seule[\s\S]*Touche les objets de ta pièce/.test(await scene.locator(".mmc-indice").innerText()) && (await p.locator(".mmc-vide").count()) === 0 && !/Glisse/.test(await p.locator("body").innerText()), "l'arrivée : « Ta maison se remplit toute seule… », « Touche les objets de ta pièce », dans la pièce (plus de « Glisse pour faire le tour »)");
await p.screenshot({ path: `${D}/ma-maison-3-chez-moi.png` });
// (📼 section 31 de Découvrir : « 📼 Revoir », ses vidéos déjà vues — aucune encore)
await scene.locator('[data-puce="revoir"]').click();
ok(await attendre(async () => /Tes vidéos déjà vues viendront ici/.test(await p.locator("[data-feuille-revoir]").innerText())), "« 📼 Revoir » : la feuille de ses vidéos déjà vues (aucune encore)");
await p.locator("[data-feuille-revoir] button[aria-label='Fermer']").click();

// ─── toucher les objets ───
const toucher = async (zone) => {
  const z = scene.locator(`[data-zone="${zone}"]`).first();
  await z.evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
  await p.waitForTimeout(200);
  await z.click();
};
await toucher("tele");
ok(await attendre(async () => /La télé/.test(await scene.locator('.mmc-bulle[data-bulle="tele"]').innerText())), "la télé : ce qu'elle accueillera");
ok((await scene.locator(".mmc-indice").count()) === 0, "au premier toucher, l'indice s'en va");
await p.screenshot({ path: `${D}/ma-maison-4-tele.png` });
await toucher("lampes");
ok(await attendre(async () => (await scene.locator(".mmc-lueur.allumee").count()) === 1 && /Lampe allumée/.test(await scene.locator(".mmc-bulle").innerText())), "une lampe : elle s'allume");
await scene.locator('[data-zone="lampes"]').click();
ok(await attendre(async () => (await scene.locator(".mmc-lueur.allumee").count()) === 0 && /Lampe éteinte/.test(await scene.locator(".mmc-bulle").innerText())), "et s'éteint");
await toucher("fenetre");
ok(await attendre(async () => /Là, c’est (matin|soir|nuit)/.test(await scene.locator('.mmc-bulle[data-bulle="fenetre"]').innerText())), "la fenêtre : l'heure qu'il est");
await scene.locator(".mmc-bulle button").click();
ok((await scene.locator(".mmc-bulle").count()) === 0, "la bulle se ferme");
await scene.locator(".mmc-fig").evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
const avant = await scene.locator(".mmc-fig").getAttribute("data-saute");
await scene.locator(".mmc-fig").click();
ok((await scene.locator(".mmc-fig").getAttribute("data-saute")) !== avant, "sa figurine : elle sautille");

// ─── ⚙️ changer de pièce ───
await scene.locator('[data-geste="reglages"]').click();
const changer = p.locator('[role="dialog"][aria-label="Changer de pièce"]');
ok(await attendre(async () => (await changer.locator('.mmc-carte.sienne[data-piece="hangar"]').count()) === 1 && /Ta pièce/.test(await changer.locator('.mmc-carte[data-piece="hangar"]').innerText()) && (await changer.locator(".mmc-fermer").count()) === 1), "⚙️ : « Changer de pièce », le hangar marqué « Ta pièce », un ✕");
await changer.locator('.mmc-carte[data-piece="salon"]').click();
await p.locator('.mmc-apercu [data-geste="installer"]').click();
ok(await attendre(async () => (await p.locator('.mmc-scene[data-piece="salon"]').count()) === 1 && (await p.locator(".mmc-choix").count()) === 0), "le salon : on y est");
await p.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator('.mmc-scene[data-piece="salon"]').count()) === 1), "recharger : le salon, gardé");

ok(!(await deborde()), "pas de débordement");
ok(!/exemple/i.test(await p.locator("body").innerText()), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs[0]})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
