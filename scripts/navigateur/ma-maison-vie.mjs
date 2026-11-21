// 🎁 « MA MAISON » QUI VIT (`docs/univers/ma-maison.md`, section 18 ; le lot M5, première partie) — sur un iPhone, contre
// le faux Supabase.
//
// Léa vit dans le salon ; aujourd'hui, elle a mis un livre chez elle, et son humeur du jour est un fou rire. Sam, son
// proche, entre : l'humeur de Léa au-dessus de sa figurine, « ✨ Nouveau chez Léa aujourd'hui : Le Petit Prince » (la
// caméra va le voir) ; « 🎁 Laisser une surprise » : un bouquet et un mot, posés emballés sur sa table. Léa rentre :
// « 🚪 Sam a frappé à ta porte pendant ton absence », le paquet sur la table basse ; « Ouvrir » : « 💐 Un bouquet », « De
// Sam · « Pour toi » » ; « ✓ Le garder sur ma table » : il y reste. Sam le voit en revenant. Ni erreur, ni le mot
// « exemple ».
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
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
    table: [0.44, 0.78, 0.14, 0.05],
    places: [
      { x: 0.3, y: 0.86, hauteur: 0.3 },
      { x: 0.7, y: 0.86, hauteur: 0.3 },
    ],
  },
});
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
// (sa dernière visite chez elle : il y a deux heures ; son humeur du jour : un fou rire)
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() - 2 * 3600_000 });
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
await json(`${LEA.id}/humeur.json`, { jour, visage: "rire", le: maintenant });
const L8 = qui8(LEA.id);
const photo = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#3a7bd5" } }).jpeg().toBuffer();
await deposer(`${LEA.id}/univers/objets/photo00001.webp`, photo, "image/jpeg");
await json(`${LEA.id}/etagere-perso.json`, {
  v: 1,
  montres: [],
  caches: [],
  objets: [
    { id: "livre00001", genre: "gout", nuance: "aime", emoji: "📚", titre: "Le Petit Prince", concerne: L8, citation: "Lu trois fois", de8: L8, message: "maison-livre00001", le: ilYa(5), etat: "actif", depose: true },
    { id: "photo00001", genre: "gout", nuance: "aime", emoji: "🖼️", titre: "La plage", concerne: L8, citation: "", de8: L8, message: "univers-m-9", le: ilYa(60 * 30), etat: "actif", depose: true, image: { chemin: `${LEA.id}/univers/objets/photo00001.webp`, l: 300, h: 300, sorte: "photo" } },
  ],
});
await json(`fils/${[LEA.id, SAM.id].sort().join("_")}/etagere.json`, {
  v: 1,
  lu: 0,
  verrou: 0,
  objets: [{ id: "motlea0001", genre: "mot", emoji: "💬", titre: "On ira à Lisbonne", concerne: "deux", citation: "On ira à Lisbonne", de8: qui8(SAM.id), message: "m-1", le: ilYa(60 * 30), etat: "actif", garde: { par8: L8 } }],
});

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

// ═══ SAM ENTRE CHEZ LÉA ═══
const sam = await tel(SAM);
const vus = [];
await sam.exposeFunction("__vise", (id) => vus.push(id));
await sam.addInitScript(() => {
  new MutationObserver((l) => {
    for (const m of l) if (m.type === "attributes" && m.target.classList?.contains("vise")) window.__vise?.(m.target.getAttribute("data-objet"));
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });
});
await sam.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const scene = sam.locator('.mmc-visite[data-visite="ouvert"] .mmc-scene');
ok(await attendre(sam, async () => (await scene.locator(".mmc-objet").count()) === 3), "Sam chez Léa : ses objets");
ok(await attendre(sam, async () => /😂|🤣/.test(await texte(scene.locator("[data-humeur]")))), `🙂 l'humeur de Léa au-dessus de sa figurine (${await texte(scene.locator("[data-humeur]"))})`);
// (🚪 la maquette, section 23 : on frappe d'abord ; ce qui est nouveau se montre une fois entré)
ok((await scene.locator("[data-arrivee]").count()) === 0, "devant sa porte : rien ne s'annonce encore");
await scene.locator('[data-geste="frapper"]').click();
ok(await attendre(sam, async () => /Nouveau chez Léa aujourd’hui : Le Petit Prince/.test(await texte(scene.locator("[data-arrivee]"))), 8000), "✨ entré : « Nouveau chez Léa aujourd'hui : Le Petit Prince »");
ok(/Nouveau aujourd’hui/i.test(await texte(scene.locator(".mmc-puces"))) && (await texte(scene.locator('.mmc-puce[data-puce="livre00001"]'))) === "📚 Nouveau", `… et en bas, « Nouveau aujourd'hui » : « 📚 Nouveau » (${await texte(scene.locator(".mmc-puces"))})`);
ok(await attendre(sam, async () => vus.includes("livre00001"), 8000), "… la caméra va le voir");
ok(await attendre(sam, async () => (await scene.locator("[data-arrivee]").count()) === 0, 8000), "… puis la maison est à lui");
await sam.screenshot({ path: `${D}/ma-maison-vie-1-sam.png` });
await scene.locator('[data-geste="surprise"]').click();
const surprise = sam.locator("[data-surprise]");
ok(await attendre(sam, async () => (await surprise.locator("[data-objet-surprise]").count()) >= 4), "🎁 « Laisser une surprise » : les objets à poser");
ok(await surprise.locator("[data-poser]").isDisabled(), "… rien de choisi : « La poser » attend");
await surprise.locator('[data-objet-surprise="fleurs"]').click();
await surprise.locator('[data-champ="mot-surprise"]').fill("Pour toi");
await sam.waitForTimeout(400);
await sam.screenshot({ path: `${D}/ma-maison-vie-2-surprise.png` });
await surprise.locator("[data-poser]").click();
ok(await attendre(sam, async () => /Léa la trouvera en rentrant/.test(await texte(scene.locator("[data-fait]")))), "« 🎁 Léa la trouvera en rentrant »");
ok(await attendre(sam, async () => /Ta surprise attend qu’on l’ouvre/.test(await texte(scene.locator("[data-mes-cadeaux]")))), "… « Ta surprise attend qu'on l'ouvre »");

// ═══ LÉA RENTRE ═══
const lea = await tel(LEA, true);
await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
ok(await attendre(lea, async () => /Sam a frappé à ta porte pendant ton absence/.test(await texte(chez.locator("[data-arrivee]"))), 10000), "🚪 « Sam a frappé à ta porte pendant ton absence »");
ok(!/\d+ visite/.test(await texte(chez.locator("[data-arrivee]"))), "… sans compter les visites");
const paquet = chez.locator('.mmc-cadeau[data-attente="1"]');
ok(await attendre(lea, async () => (await paquet.count()) === 1), "🎁 le paquet sur la table basse, emballé");
ok(await attendre(lea, async () => (await chez.locator("[data-arrivee]").count()) === 0, 12000), "… l'arrivée finie");
// (🛎️ la maquette, section 23 : « Pendant ton absence », ce qu'on a laissé chez elle — sans compteur de visites)
const absence = chez.locator('[data-geste="absence"]');
ok((await absence.locator("[data-pastille]").getAttribute("data-pastille")) === "2", `🛎️ « Pendant ton absence » : sa pastille (${await texte(absence.locator("[data-pastille]"))})`);
await absence.click();
const feuille = lea.locator("[data-absence]");
ok(await attendre(lea, async () => /Sam a frappé à ta porte/.test(await texte(feuille.locator('[data-ligne-absence="frappe-0"]'))) && /Sam t’a laissé une surprise/.test(await texte(feuille.locator('[data-ligne-absence^="cadeau-"]')))), "… « 🚪 Sam a frappé à ta porte », « 🎁 Sam t'a laissé une surprise »");
ok(/Pas de compteur de visites/.test(await texte(feuille)) && !/\d+ visite/.test(await texte(feuille)), "… « Pas de compteur de visites : seulement ce que tes proches ont laissé »");
await lea.waitForTimeout(350);
await lea.screenshot({ path: `${D}/ma-maison-vie-3-absence.png` });
await feuille.locator('[data-ligne-absence^="cadeau-"] button').click();
ok(await attendre(lea, async () => (await feuille.count()) === 0 && /Sam t’a laissé un cadeau/.test(await texte(chez.locator('.mmc-bulle[data-bulle="cadeau"]')))), "« Ouvrir » : la feuille se ferme, le cadeau est là, dans la pièce");
await chez.locator('.mmc-bulle[data-bulle="cadeau"] button[aria-label="Fermer"]').click();
await paquet.evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
await lea.waitForTimeout(300);
await paquet.click();
const bulle = chez.locator('.mmc-bulle[data-bulle="cadeau"]');
ok(await attendre(lea, async () => /Sam t’a laissé un cadeau/.test(await texte(bulle))), "un toucher : « 🎁 Sam t'a laissé un cadeau »");
await bulle.locator("[data-ouvrir-cadeau]").click();
ok(await attendre(lea, async () => /💐 Un bouquet/.test(await texte(bulle)) && /De Sam · « Pour toi »/.test(await texte(bulle))), "« Ouvrir » : « 💐 Un bouquet », « De Sam · « Pour toi » »");
await lea.screenshot({ path: `${D}/ma-maison-vie-4-cadeau.png` });
await bulle.locator('[data-decider="oui"]').click();
ok(await attendre(lea, async () => (await paquet.count()) === 0 && (await chez.locator(".mmc-cadeau:not(.emballe)").count()) === 1 && /💐/.test(await texte(chez.locator(".mmc-cadeau").first()))), "« ✓ Le garder sur ma table » : le bouquet y reste");
ok(/😂|🤣/.test(await texte(chez.locator("[data-humeur]"))), "son humeur, chez elle aussi");

// ═══ SAM REVIENT ═══
await sam.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(sam, async () => (await scene.locator(".mmc-cadeau").count()) === 1 && /💐/.test(await texte(scene.locator(".mmc-cadeau")))), "Sam revient : son bouquet sur la table de Léa");
ok((await scene.locator("[data-mes-cadeaux]").count()) === 0, "… plus rien qui attend");

for (const p of [lea, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
