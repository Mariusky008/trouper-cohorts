// 🚪 « MA MAISON » EN VISITE (`docs/univers/ma-maison.md`, section 17 ; le lot M4) — sur un iPhone, contre le faux Supabase.
//
// Léa vit dans le salon ; elle a ajouté un livre elle-même, rangé une photo venue d'une conversation, gardé un mot avec
// Sam. Sam est son proche ; Zoé, non. 🚪 « Qui peut entrer ? » : « 👯 Mes proches » d'office ; « 🌍 Tout le monde »
// demande « J'ai 18 ans ou plus ». La route : Sam voit tout ; Zoé, la maison fermée tant qu'elle est réservée aux
// proches, puis — ouverte à tous — seulement le livre (un cadre garde son tableau) ; « Les univers à visiter » la
// montrent. L'écran de Zoé : « 🏠 Chez Léa », d'abord sa porte (la maquette, section 23) : « ✊ Toc toc » — Léa le
// saura, et sa figurine ouvre ; puis le livre seul (« Mis par Léa »), ni ＋ ni ⚙️. Sam, son proche : « 🎁 Une surprise »
// et « 💬 Votre salon ». « 🔒 Moi seul » : la maison fermée, même pour Sam. Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).json().catch(() => ({}));
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
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
const qui = (n, prenom) => ({ id: `4a150a15-0000-4000-8000-00000000dd0${n}`, jeton: `jeton-ma-maison-visite-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
for (const x of [LEA, SAM, ZOE]) x.cle = cleProfil(x.id);
await semer("human_habitants", [LEA, SAM, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
const ilYa = (min) => new Date(Date.now() - min * 60_000).toISOString();
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
const fiche = (h) => ({ version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
for (const x of [LEA, SAM, ZOE]) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id));
  await deposer(`${x.id}/neutre-essai.png`, assise, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM, ZOE].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
// (sa pièce : le salon, ses emplacements)
await poserPiece(deposer, "salon", {
  fond: "#4a5a6e",
  sol: "#6a5040",
  le: maintenant,
  emplacements: {
    tele: [0.32, 0.2, 0.36, 0.15],
    etagere: [0.76, 0.1, 0.2, 0.34],
    cadres: [[0.06, 0.44, 0.1, 0.09]],
    places: [
      { x: 0.3, y: 0.86, hauteur: 0.3 },
      { x: 0.7, y: 0.86, hauteur: 0.3 },
    ],
  },
});
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() });
const L8 = qui8(LEA.id);
const photo = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#3a7bd5" } }).jpeg().toBuffer();
await deposer(`${LEA.id}/univers/objets/photo00001.webp`, photo, "image/jpeg");
await json(`${LEA.id}/etagere-perso.json`, {
  v: 1,
  montres: [],
  caches: [],
  objets: [
    { id: "livre00001", genre: "gout", nuance: "aime", emoji: "📚", titre: "Le Petit Prince", concerne: L8, citation: "Lu trois fois", de8: L8, message: "maison-livre00001", le: ilYa(60), etat: "actif", depose: true },
    { id: "photo00001", genre: "gout", nuance: "aime", emoji: "🖼️", titre: "La plage", concerne: L8, citation: "", de8: L8, message: "univers-m-9", le: ilYa(50), etat: "actif", depose: true, image: { chemin: `${LEA.id}/univers/objets/photo00001.webp`, l: 300, h: 300, sorte: "photo" } },
  ],
});
await json(`fils/${[LEA.id, SAM.id].sort().join("_")}/etagere.json`, {
  v: 1,
  lu: 0,
  verrou: 0,
  objets: [{ id: "motlea0001", genre: "mot", emoji: "💬", titre: "On ira à Lisbonne", concerne: "deux", citation: "On ira à Lisbonne", de8: qui8(SAM.id), message: "m-1", le: ilYa(30), etat: "actif", garde: { par8: L8 } }],
});

const visite = async (q) => (await (await fetch(`${BASE}/api/direct/ma-piece?chez=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json()).visite;
const titres = (v) =>
  [...(v?.maison?.contenu?.cadres ?? []), v?.maison?.contenu?.tele, v?.maison?.contenu?.platine, ...(v?.maison?.contenu?.etagere ?? [])]
    .filter(Boolean)
    .map((o) => o.titre)
    .sort()
    .join(",");

// ═══ LA ROUTE, AVANT : « MES PROCHES » D'OFFICE ═══
const vSam = await visite(SAM);
ok(vSam?.etat === "ouvert" && vSam.proche === true && titres(vSam) === "La plage,Le Petit Prince,On ira à Lisbonne", `Sam (son proche) : tout ce qu'elle a gardé (${titres(vSam)})`);
const vZoe = await visite(ZOE);
ok(vZoe?.etat === "reserve" && vZoe.prenom === "Léa" && !vZoe.maison, `Zoé (pas son proche) : « réservée à ses proches », rien d'autre (${vZoe?.etat})`);

// ═══ L'ÉCRAN DE LÉA : 🚪 QUI PEUT ENTRER ? ═══
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
const lea = await tel(LEA, true);
await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
// (👯 section 25 : le carnet de ses proches — Sam, sa maison, leur conversation ; son lien par WhatsApp ; et « 👀 Comme
// la voient tes proches », dedans)
const bouton = lea.locator('[data-geste="proches"]');
ok(await attendre(lea, async () => (await bouton.getAttribute("data-visibilite")) === "proches" && /Mes proches/.test(await bouton.innerText())), "👯 « Mes proches » : sa maison, à ses proches d'office");
await bouton.click();
const carnet = lea.locator("[data-carnet]");
ok(await attendre(lea, async () => (await carnet.locator(`[data-mes-proches] [data-proche="${SAM.cle}"]`).count()) === 1), "le carnet : Sam, son proche");
ok((await carnet.locator(`[data-proche="${SAM.cle}"] [data-sa-maison]`).getAttribute("href")) === `/univers/chez/${SAM.cle}` && (await carnet.locator(`[data-proche="${SAM.cle}"] [data-parler]`).getAttribute("href")) === `/collection?parler=${SAM.cle}#proches`, "… 🏠 sa maison, 💬 leur conversation");
const wa = decodeURIComponent((await carnet.locator("[data-ajouter-proche] [data-lien-whatsapp]").getAttribute("href")) ?? "");
ok(wa.startsWith("https://api.whatsapp.com/send?text=") && wa.includes(`/collection?proche=${LEA.cle}#proches`) && /Ajoute-moi sur ClikMe/.test(wa), "« ＋ Ajouter un proche » : son lien, par WhatsApp");
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/ma-maison-visite-0-carnet.png` });
await carnet.locator('[data-geste="qui"]').click();
ok(await attendre(lea, async () => (await carnet.count()) === 0), "« 👀 Comme la voient tes proches » : le carnet laisse la place à « Qui peut entrer chez moi ? »");
const feuille = lea.locator("[data-qui-entre]");
ok(await attendre(lea, async () => (await feuille.locator("[data-visibilite]").count()) === 3 && (await feuille.locator('[data-visibilite="proches"]').getAttribute("aria-pressed")) === "true"), "« Qui peut entrer chez moi ? » : trois choix, « Mes proches » coché");
await feuille.locator('[data-visibilite="tous"]').click();
ok((await feuille.locator("[data-adulte]").count()) === 1, "« Tout le monde » : « J'ai 18 ans ou plus » à cocher");
await feuille.locator("[data-garder]").click();
ok(/18 ans ou plus/.test(await feuille.locator(".acm-erreur").innerText().catch(() => "")), "sans cocher : refusé");
await feuille.locator("[data-adulte]").check();
ok((await feuille.locator(".acm-erreur").count()) === 0, "coché : le message s'en va");
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/ma-maison-visite-1-qui.png` });
await feuille.locator("[data-garder]").click();
ok(await attendre(lea, async () => (await feuille.count()) === 0 && (await bouton.getAttribute("data-visibilite")) === "tous"), "coché : sa maison est ouverte à tous (🌍)");
const publics = await lireStock("univers/publics.json");
ok((publics.liste ?? []).some((x) => x.h === LEA.id), "… et entre dans « Les univers à visiter »");

// ═══ ZOÉ EN VISITE : SEULEMENT CE QUE LÉA A AJOUTÉ ELLE-MÊME ═══
const vZoe2 = await visite(ZOE);
ok(vZoe2?.etat === "ouvert" && vZoe2.proche === false && titres(vZoe2) === "Le Petit Prince" && vZoe2.maison.contenu.cadres.every((c) => c === null), `ouverte à tous, Zoé : le livre seul — ni la photo, ni le mot (${titres(vZoe2)})`);
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const scene = zoe.locator('.mmc-visite[data-visite="ouvert"] .mmc-scene');
ok(await attendre(zoe, async () => (await scene.locator(".mmc-objet").count()) === 1 && /Chez Léa/.test(await scene.locator(".mmc-nom").innerText())), "l'écran de Zoé : « 🏠 Chez Léa », un seul objet");
ok((await scene.locator('[data-geste="ajouter"], [data-geste="reglages"], [data-geste="qui"], [data-geste="proches"], [data-geste="absence"]').count()) === 0, "… ni ＋, ni ⚙️, ni 👯, ni 🛎️ : ce n'est pas chez elle");
// (🚪 la maquette : d'abord sa porte — on frappe, sa figurine ouvre)
const porte = scene.locator("[data-porte]");
ok(await attendre(zoe, async () => /Tu es devant la porte de Léa\. Frappe : sa figurine t’ouvre\./.test(await porte.innerText())), "sa porte : « Tu es devant la porte de Léa. Frappe : sa figurine t'ouvre. »");
ok((await scene.locator(".mmc-indice").count()) === 0, "… pas encore « Touche les objets »");
const frapperBox = await scene.locator('[data-geste="frapper"]').boundingBox();
ok(frapperBox && frapperBox.height < 60, `« ✊ Toc toc » sur une ligne (${Math.round(frapperBox?.height)} pt)`);
await zoe.screenshot({ path: `${D}/ma-maison-visite-2-porte.png` });
await scene.locator('[data-geste="frapper"]').click();
ok(await attendre(zoe, async () => /Léa saura que tu as frappé/.test(await scene.locator("[data-fait]").innerText())), "« ✊ Toc toc » : « ✓ Léa saura que tu as frappé »");
ok(await attendre(zoe, async () => (await porte.count()) === 0 && /Oh, te voilà ! Entre 😊/.test(await scene.locator("[data-accueil]").innerText())), "… la porte s'ouvre : « Oh, te voilà ! Entre 😊 »");
const visites = await lireStock(`${LEA.id}/monde/visites.json`);
ok((visites.liste ?? []).some((x) => x.de === ZOE.id), "… et Léa le saura (sa visite est notée)");
ok((await scene.locator(".mmc-actions-visite").count()) === 0, "Zoé n'est pas sa proche : ni « Une surprise », ni « Votre salon »");
const livre = scene.locator('.mmc-objet[aria-label="📚 Le Petit Prince"]');
await livre.evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
await zoe.waitForTimeout(250);
await livre.click();
ok(await attendre(zoe, async () => /Mis par Léa · Lu trois fois/.test(await scene.locator('.mmc-bulle[data-bulle="objet"]').innerText())), "le livre : « Mis par Léa · Lu trois fois »");
await scene.locator(".mmc-bulle button[aria-label='Fermer']").click();
const fig = scene.locator(".mmc-fig");
ok(await attendre(zoe, async () => (await fig.locator("img").evaluate((i) => i.complete && i.naturalWidth > 0)) === true), "la figurine de Léa, chez elle, au centre");
await fig.evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
await zoe.waitForTimeout(300);
await zoe.screenshot({ path: `${D}/ma-maison-visite-3-zoe.png` });
ok(!(await zoe.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "pas de débordement");

// ═══ SAM, SON PROCHE : TOUT, ET « GARDÉ AVEC SAM » ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const sceneSam = sam.locator('.mmc-visite[data-visite="ouvert"] .mmc-scene');
ok(await attendre(sam, async () => (await sceneSam.locator(".mmc-objet").count()) === 3), "Sam : les trois (la photo au cadre, le livre, le mot)");
await sceneSam.locator('[data-geste="frapper"]').click();
ok(await attendre(sam, async () => (await sceneSam.locator("[data-porte]").count()) === 0 && /Une surprise/.test(await sceneSam.locator(".mmc-actions-visite").innerText()) && (await sceneSam.locator('[data-geste="salon"]').getAttribute("href")) === "/collection#proches"), "son proche, entré : « 🎁 Une surprise » et « 💬 Votre salon »");
await sam.screenshot({ path: `${D}/ma-maison-visite-4-sam.png` });

// ═══ « 🔒 MOI SEUL » ═══
const r = await fetch(`${BASE}/api/direct/ma-piece`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}; sb-127-auth-token=base64-${b64(session)}` }, body: JSON.stringify({ action: "visibilite", v: "moi" }) });
ok(r.status === 200 && (await r.json()).maison?.visibilite === "moi", "« 🔒 Moi seul »");
ok((await visite(SAM))?.etat === "ferme", "… même Sam trouve la maison fermée");
ok(!((await lireStock("univers/publics.json")).liste ?? []).some((x) => x.h === LEA.id), "… et elle quitte « Les univers à visiter »");
await sam.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(sam, async () => /Léa garde sa maison pour soi/.test(await sam.locator(".mmc-ferme").innerText())), "l'écran de Sam : « Léa garde sa maison pour soi, pour l'instant »");
const fr = await fetch(`${BASE}/api/direct/visites`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "frapper", cle: LEA.cle }) });
ok(fr.status === 403, `frapper à une maison fermée : refusé (${fr.status})`);

for (const p of [lea, zoe, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
