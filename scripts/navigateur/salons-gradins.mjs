// 🎭 LES GRADINS DES SALONS OUVERTS, À L'ÉCRAN (`docs/univers/decouvrir.md`, section 27) — sur un iPhone, puis un
// ordinateur, contre le faux Supabase (jamais la vraie base, jamais le vrai moteur d'image).
//
// La tribune du stade est validée (son décor, ses huit emplacements). Léa entre dans le salon du foot : le gradin (son
// image carrée couvre la bande, posée sur son sol, toutes les têtes visibles), sa figurine devant, au milieu (« Toi »),
// les sept autres places qui brillent, « Tu ouvres le salon : les places qui brillent attendent les suivants. ». Sam entre
// (par la route) : il s'assoit à côté d'elle, six places brillent, la phrase s'en va ; le toucher : sa fiche, 👋 vole.
// Sur le téléphone de Sam : c'est LUI qui est devant, au milieu (Léa à côté). Sur un ordinateur : le gradin entier, ses
// côtés dans sa vignette floue. L'administrateur : les onze lieux sur la page des salons, la tribune « Dans les salons »,
// ses huit emplacements numérotés. Rien ne déborde, jamais le mot « exemple », aucune erreur.
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
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
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `6d6d6d6d-0000-4000-8000-0000006d10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-gradins-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="${couleur}"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
    .png()
    .toBuffer();
for (const [x, couleur] of [
  [LEA, "#c0392b"],
  [SAM, "#2a6fb0"],
]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(couleur), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
// (les autres salons : la pièce du salon)
await poserPiece(deposer, "salon", { le: maintenant });
// (la tribune du stade, validée : un décor carré dessiné — le ciel du soir, la marche, les huit tapis du plan)
const PLAN = [
  { x: 0.375, y: 0.9, hauteur: 0.27 },
  { x: 0.625, y: 0.9, hauteur: 0.27 },
  { x: 0.13, y: 0.9, hauteur: 0.27 },
  { x: 0.87, y: 0.9, hauteur: 0.27 },
  { x: 0.4, y: 0.6, hauteur: 0.21 },
  { x: 0.6, y: 0.6, hauteur: 0.21 },
  { x: 0.2, y: 0.6, hauteur: 0.21 },
  { x: 0.8, y: 0.6, hauteur: 0.21 },
];
const tapis = PLAN.map((p) => `<ellipse cx="${p.x * 1024}" cy="${p.y * 1024}" rx="${p.hauteur * 1024 * 0.42}" ry="${p.hauteur * 1024 * 0.11}" fill="#e2b33c"/>`).join("");
const tribune = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#1f3a5a"/><rect y="500" width="1024" height="150" fill="#6b6f78"/><rect y="650" width="1024" height="374" fill="#585c64"/>${tapis}</svg>`,
  ),
)
  .png()
  .toBuffer();
await deposer("salons-gradins/tribune/decor.png", tribune, "image/png");
await json("salons-gradins/tribune/releve.json", { le: maintenant, places: PLAN, source: "plan" });
await json("salons-gradins/tribune/valide.json", { le: maintenant });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ouvrir = async (x, o = {}) => {
  const ctx = await b.newContext(o.ordinateur ? { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([...(x ? [{ name: "clikme_habitant", value: x.jeton, url: BASE }] : []), { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
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
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);
/** Où est une figurine, dans la pièce : le milieu de son fauteuil, son bas, sa hauteur (en points, depuis la pièce). */
const placeDe = async (p, sel) => {
  const piece = await p.locator(".so-piece").boundingBox();
  const f = await p.locator(sel).boundingBox();
  return f && piece ? { x: f.x + f.width / 2 - piece.x, bas: f.y + f.height - piece.y, h: f.height } : null;
};

// ═══ LÉA, SEULE DANS LA TRIBUNE ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator('.so-piece[data-gradin="tribune"]').count()) === 1, 30000), "le salon du foot s'ouvre dans la tribune (son gradin validé)");
ok(await attendre(lea, async () => (await lea.locator(".so-gradin").evaluate((i) => i.complete && i.naturalWidth > 0)) && (await lea.locator(".so-fig[data-moi] img").evaluate((i) => i.complete && i.naturalWidth > 0))), "son image et sa figurine, chargées");
const piece = await lea.locator(".so-piece").boundingBox();
const image = await lea.locator(".so-gradin").boundingBox();
const gx = image.x - piece.x;
const gy = image.y - piece.y;
ok(Math.abs(image.width - image.height) < 2 && image.width >= piece.width - 1 && Math.abs(gy + image.height - piece.height) < 2 && gy + 0.34 * image.height >= -1, `l'image carrée couvre la bande, posée sur son sol, toutes les têtes visibles (${Math.round(image.width)} pt, de ${Math.round(gy)} à ${Math.round(gy + image.height)} ; la pièce : ${Math.round(piece.height)} pt)`);
const moi = await placeDe(lea, ".so-fig[data-moi]");
ok(moi && Math.abs(moi.x - (gx + 0.375 * image.width)) < 3 && Math.abs(moi.bas - (gy + 0.9 * image.height)) < 3 && Math.abs(moi.h - 0.27 * image.height) < 3 && /Toi/.test(await texte(lea.locator(".so-fig[data-moi]"))), `sa figurine devant, au milieu, sur son tapis : « Toi » (${Math.round(moi?.x)} pt, ${Math.round(moi?.h)} pt de haut)`);
ok((await lea.locator(".so-libre").count()) === 7, `les sept autres places brillent (${await lea.locator(".so-libre").count()})`);
const libre = await lea.locator('.so-libre[data-libre="4"]').boundingBox();
ok(libre && Math.abs(libre.x + libre.width / 2 - piece.x - (gx + 0.4 * image.width)) < 3 && Math.abs(libre.y + libre.height / 2 - piece.y - (gy + 0.6 * image.height)) < 3, "… chacune sur son tapis (la première du fond, à sa place)");
ok(/Tu ouvres le salon : les places qui brillent attendent les suivants\./.test(await texte(lea.locator("[data-seul-salon]"))), "« Tu ouvres le salon : les places qui brillent attendent les suivants. »");
ok(/1 ici · 7 places libres · 8 places/.test(await texte(lea.locator("[data-places]"))), "« 1 ici · 7 places libres · 8 places »");
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/salons-gradins-1-seule.png` });

// ═══ SAM ENTRE ═══
const r = await fetch(`${BASE}/api/direct/salons-ouverts`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "entrer", theme: "foot" }) });
const oSam = (await r.json()).ouverture;
ok(oSam?.salon?.id === "foot-1" && oSam.gradin?.id === "tribune" && oSam.presents.find((x) => x.q === oSam.moi)?.place === 1, "Sam entre (par la route) : la tribune, la deuxième place");
ok(await attendre(lea, async () => (await lea.locator(".so-fig").count()) === 2), "sur l'écran de Léa : Sam s'assoit");
const sam = await placeDe(lea, ".so-fig:not([data-moi])");
ok(sam && Math.abs(sam.x - (gx + 0.625 * image.width)) < 3 && Math.abs(sam.bas - (gy + 0.9 * image.height)) < 3, `… devant, à côté d'elle (${Math.round(sam?.x)} pt)`);
ok(await attendre(lea, async () => (await lea.locator(".so-libre").count()) === 6 && (await lea.locator("[data-seul-salon]").count()) === 0), "six places brillent ; la phrase s'en va");
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/salons-gradins-2-avec-sam.png` });
// (toucher Sam, dans le gradin : sa fiche, un geste qui vole jusqu'à lui)
await lea.locator(".so-fig:not([data-moi])").click();
ok(await attendre(lea, async () => /Sam/.test(await texte(lea.locator(".so-fiche")))), "toucher Sam : sa fiche");
await lea.locator('[data-geste="coucou"]').click({ timeout: 5000 });
ok(await attendre(lea, async () => (await lea.locator(".so-vol").count()) >= 1, 4000), "👋 Coucou : le geste vole jusqu'à lui");

// ═══ CHEZ SAM : C'EST LUI QUI EST DEVANT, AU MILIEU ═══
const pSam = await ouvrir(SAM);
await pSam.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
ok(await attendre(pSam, async () => (await pSam.locator('.so-piece[data-gradin="tribune"]').count()) === 1 && (await pSam.locator(".so-fig").count()) === 2, 30000), "Sam, sur son téléphone : la tribune, Léa et lui");
await pSam.waitForTimeout(300);
const imgSam = await pSam.locator(".so-gradin").boundingBox();
const pieceSam = await pSam.locator(".so-piece").boundingBox();
const gxS = imgSam.x - pieceSam.x;
const lui = await placeDe(pSam, ".so-fig[data-moi]");
const elle = await placeDe(pSam, ".so-fig:not([data-moi])");
ok(lui && elle && Math.abs(lui.x - (gxS + 0.375 * imgSam.width)) < 3 && Math.abs(elle.x - (gxS + 0.625 * imgSam.width)) < 3 && /Toi/.test(await texte(pSam.locator(".so-fig[data-moi]"))), `chacun se voit devant, au milieu : Sam à la première place, Léa à côté (${Math.round(lui?.x)} pt, ${Math.round(elle?.x)} pt)`);
await pSam.screenshot({ path: `${D}/salons-gradins-3-chez-sam.png` });
ok(!(await deborde(lea)) && !(await deborde(pSam)), "pas de débordement");
ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
await pSam.context().close();

// ═══ SUR UN ORDINATEUR ═══
const ord = await ouvrir(LEA, { ordinateur: true });
await ord.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
ok(await attendre(ord, async () => (await ord.locator(".so-gradin").evaluate((i) => i.complete && i.naturalWidth > 0)) === true, 30000), "sur un ordinateur : le gradin");
const pO = await ord.locator(".so-piece").boundingBox();
const iO = await ord.locator(".so-gradin").boundingBox();
const fO = await ord.locator(".so-fig[data-moi]").boundingBox();
ok(iO && pO && iO.y - pO.y + 0.34 * iO.height >= -1 && Math.abs(iO.y + iO.height - (pO.y + pO.height)) < 2 && fO.x >= pO.x && fO.x + fO.width <= pO.x + pO.width && /url\(/.test(await ord.locator(".so-piece").evaluate((e) => e.style.backgroundImage)), `… entier en hauteur, toutes les têtes visibles, ses côtés dans sa vignette floue (${Math.round(iO?.width)} × ${Math.round(iO?.height)} dans ${Math.round(pO?.width)} × ${Math.round(pO?.height)})`);
await ord.screenshot({ path: `${D}/salons-gradins-4-ordinateur.png` });
await ord.context().close();

// ═══ L'ADMINISTRATEUR : L'ATELIER DES GRADINS ═══
const adm = await ouvrir(null, { ordinateur: true });
await adm.goto(`${BASE}/admin/humain/salons`, { waitUntil: "domcontentloaded" });
ok(await attendre(adm, async () => (await adm.locator("[data-gradins-admin] [data-gradin]").count()) === 11, 30000), "la page des salons : les onze lieux");
const t = adm.locator('[data-gradin="tribune"]');
ok((await t.getAttribute("data-valide")) === "1" && /Dans les salons/.test(await texte(t)) && (await t.locator("[data-place-gradin]").count()) === 8 && (await t.locator("[data-retirer]").count()) === 1, "la tribune : « Dans les salons », ses huit emplacements numérotés, « Retirer des salons »");
ok((await adm.locator('[data-gradin="cinema"] [data-fabriquer]').count()) === 1 && /Pas encore fait/.test(await texte(adm.locator('[data-gradin="cinema"]'))) && /Tout fabriquer \(10 à faire\)/.test(await texte(adm.locator("[data-tout-fabriquer]"))), "la salle de cinéma : « Pas encore fait », « Fabriquer le décor » ; « Tout fabriquer (10 à faire) »");
await t.scrollIntoViewIfNeeded();
await adm.screenshot({ path: `${D}/salons-gradins-5-admin.png` });
await adm.context().close();

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs[0]})` : ""}`);
await lea.context().close();
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
