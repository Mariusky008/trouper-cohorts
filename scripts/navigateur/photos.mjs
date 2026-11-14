// 📷 LES PHOTOS, L'ÉCRAN — lot M2 (`app/collection/photos.tsx`, `docs/univers/messages-ecrits.md` section 5), contre
// le faux Supabase et sa fausse modération, jamais la vraie base.
//
// Léa et Zoé sont proches ; chacune ouvre leur conversation. « ＋ » → 📷 Une photo : Léa choisit un JPEG de 2 400 ×
// 1 800, pris de côté, avec la position GPS. LA FEUILLE : la photo, réduite DANS LE TÉLÉPHONE (ce qui part au seau est un
// WebP de 1 600 pixels au plus, sans aucune métadonnée) ; une légende ; trois têtes (« haha » : le rire d'abord) ; elle
// touche « joie », « Envoyer à Zoé » : la vignette dans le fil, sa figurine la montre dans un petit cadre (sans son), la
// légende dans la bulle, « 🗑️ Effacer » sous elle. Chez Zoé, elle arrive toute seule ; un toucher l'ouvre en grand (sa
// légende ; rien pour l'enregistrer) ; elle la fait glisser vers le bas : fermée, et la figurine de Léa la montre. CE QUI
// NE PART PAS : une photo que la modération refuse (« Cette photo ne peut pas partir. », « Choisir une autre photo ») ;
// la modération en panne (« Réessayer ») ; un fichier qui n'est pas une photo. Léa efface sa photo. La ligne de Léa chez
// Zoé : « T'a envoyé : 📷 … ». Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const sharp = createRequire(import.meta.url)("sharp");
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

const qui = (n, prenom) => ({ id: `e9e9e9e9-0000-4000-8000-0000000015${String(n).padStart(2, "0")}`, jeton: `jeton-photos-m2-ecran-00000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const GENS = [LEA, ZOE];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${LEA.id}/proches.json`, { ids: [ZOE.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });

// les photos d'essai : prise de côté, avec la position GPS ; puis celles que la fausse modération refuse (321) ou ne lit pas (322)
const couleur = (l, h, c) => sharp({ create: { width: l, height: h, channels: 3, background: c } });
const PLAGE = await couleur(2400, 1800, { r: 60, g: 150, b: 220 })
  .jpeg()
  .withMetadata({ orientation: 6, exif: { IFD0: { Artist: "Lea Essai" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "43/1 42/1 0/1", GPSLongitudeRef: "W", GPSLongitude: "1/1 3/1 0/1" } } })
  .toBuffer();
const REFUSEE = await couleur(321, 240, { r: 200, g: 40, b: 40 }).jpeg().toBuffer();
// (celle-ci reste dans le seau, la modération ne l'ayant pas lue : on y regarde ce qui est parti du téléphone)
const PANNE = await couleur(322, 240, { r: 40, g: 200, b: 40 })
  .jpeg()
  .withMetadata({ exif: { IFD0: { Artist: "Lea Essai" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "43/1 42/1 0/1", GPSLongitudeRef: "W", GPSLongitude: "1/1 3/1 0/1" } } })
  .toBuffer();
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const PAIRE = [LEA.id, ZOE.id].sort().join("_");

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (q) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const compte = (p, sel) => p.locator(sel).count();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const attendre = (p, f, arg, ms = 15000) => p.waitForFunction(f, arg, { timeout: ms }).then(() => true).catch(() => false);
async function ouvrirAvec(p, avec) {
  await p.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`, { timeout: 60000 });
  await p.locator(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  await p.waitForSelector(".pr-plein .pv-calque.lui", { state: "attached", timeout: 15000 });
}
/** « ＋ » → 📷 Une photo, puis la photo choisie (comme dans la pellicule). */
async function choisirPhoto(p, nom, octets, type = "image/jpeg") {
  await p.locator(".pr-plein .pr-ecrire-plus").click();
  await p.waitForSelector('.pr-feuille-plus.ouverte .pr-plus-choix[data-plus="photo"]', { timeout: 10000 });
  const [choix] = await Promise.all([p.waitForEvent("filechooser", { timeout: 10000 }), p.locator('.pr-feuille-plus .pr-plus-choix[data-plus="photo"]').click()]);
  await choix.setFiles({ name: nom, mimeType: type, buffer: octets });
  await p.waitForSelector(".pr-feuille-photo.ouverte", { timeout: 10000 });
}

const lea = await tel(LEA);
const zoe = await tel(ZOE);
// (les dépôts au seau depuis le téléphone de Léa : on les compte)
const envois = [];
lea.on("request", (r) => {
  if (r.method() === "PUT" && r.url().includes("/storage/v1/object/upload/sign/")) envois.push(r.url());
});
await ouvrirAvec(lea, ZOE);
await ouvrirAvec(zoe, LEA);

// ═══ « ＋ » → 📷 UNE PHOTO : LA FEUILLE ═══
await choisirPhoto(lea, "plage.jpg", PLAGE);
ok(await attendre(lea, () => Boolean(document.querySelector(".pr-feuille-photo .ph-apercu img"))), "la feuille : sa photo, réduite dans le téléphone");
await lea.locator(".pr-feuille-photo .ph-legende").fill("Haha la plage ce matin");
const tetes = await lea.locator(".pr-feuille-photo .ph-tetes button").evaluateAll((l) => l.map((x) => `${x.dataset.tete}${x.classList.contains("pris") ? "*" : ""}`));
ok(tetes.length === 3 && tetes[0] === "rire*", `une légende, trois têtes (« haha » : le rire d'abord) (${tetes.join(" · ")})`);
await lea.locator('.pr-feuille-photo .ph-tetes button[data-tete="joie"]').click();
ok((await texte(lea, ".pr-feuille-photo .ph-envoyer")) === "Envoyer à Zoé" && (await texte(lea, ".pr-feuille-photo .pr-note")).includes("ne peut pas la montrer ailleurs"), "« Envoyer à Zoé » ; elle reste dans leur conversation");
await lea.screenshot({ path: `${D}/photos-1-feuille.png` });

// ═══ ELLE L'ENVOIE : LE FIL, LA SCÈNE ═══
await lea.locator(".pr-feuille-photo .ph-envoyer").click();
ok(await attendre(lea, () => !document.querySelector(".pr-feuille-photo.ouverte") && Boolean(document.querySelector(".pr-plein .pr-fil li.ph-li.moi .ph-vignette img")), null, 20000), "envoyée : la feuille se ferme, la vignette dans le fil");
const dims = await lea.locator(".pr-plein .pr-fil li.ph-li.moi .ph-vignette img").evaluate((i) => (i.complete ? [i.naturalWidth, i.naturalHeight] : new Promise((ok) => (i.onload = () => ok([i.naturalWidth, i.naturalHeight])))));
ok(dims[1] > dims[0] && Math.max(...dims) <= 1600, `la photo, remise droite (prise de côté) et réduite : ${dims.join(" × ")}`);
ok((await lea.locator(".pr-plein .pr-scene .fqp").first().getAttribute("data-lecture")) === "muet" && (await compte(lea, ".pr-plein .pr-scene .ph-cadre img")) === 1 && (await lea.locator(".pr-plein .pr-scene").getAttribute("data-tete")) === "joie", "sa figurine la montre dans un petit cadre, sans son, avec la joie");
ok((await texte(lea, ".pr-plein .pr-dit-ecrit")) === "« Haha la plage ce matin »" && (await texte(lea, ".pr-plein .pr-fil li.ph-li.moi .pr-ecrit-texte")) === "Haha la plage ce matin", "la légende : dans la bulle, et sous la vignette");
ok((await compte(lea, ".pr-plein .pr-fil li.ph-li.moi .pr-effacer")) === 1, "« 🗑️ Effacer » sous sa photo");
await lea.screenshot({ path: `${D}/photos-2-envoyee.png` });

// ═══ CHEZ ZOÉ : ELLE ARRIVE ; EN GRAND ; GLISSER POUR FERMER ═══
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pr-fil li.ph-li.lui .ph-vignette img")), null, 25000), "chez Zoé, la photo arrive toute seule");
await zoe.locator(".pr-plein .pr-fil li.ph-li.lui button.ph-bulle").click();
await zoe.waitForSelector(".ph-grand img", { timeout: 10000 }).catch(() => null);
ok((await compte(zoe, ".ph-grand img")) === 1 && (await texte(zoe, ".ph-grand .ph-grand-legende")) === "« Haha la plage ce matin »" && (await compte(zoe, ".ph-grand a[download], .ph-grand [download]")) === 0, "un toucher : en grand, sa légende ; rien pour l'enregistrer");
await zoe.screenshot({ path: `${D}/photos-3-en-grand.png` });
const boite = await zoe.locator(".ph-grand").boundingBox();
await zoe.mouse.move(boite.x + boite.width / 2, boite.y + 300);
await zoe.mouse.down();
await zoe.mouse.move(boite.x + boite.width / 2, boite.y + 380, { steps: 4 });
await zoe.mouse.move(boite.x + boite.width / 2, boite.y + 480, { steps: 4 });
await zoe.mouse.up();
ok(await attendre(zoe, () => !document.querySelector(".ph-grand")), "elle la fait glisser vers le bas : fermée");
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pr-scene .ph-cadre img"))), "puis la figurine de Léa la montre, dans son cadre");
ok((await compte(zoe, ".pr-plein .pr-fil li.ph-li .pr-effacer")) === 0, "rien à effacer chez Zoé (ce n'est pas la sienne)");

// ═══ CE QUI NE PART PAS ═══
await choisirPhoto(lea, "refusee.jpg", REFUSEE);
await lea.waitForSelector(".pr-feuille-photo .ph-apercu img", { timeout: 10000 }).catch(() => null);
await lea.locator(".pr-feuille-photo .ph-envoyer").click();
await lea.waitForSelector(".pr-feuille-photo .ph-erreur", { timeout: 15000 }).catch(() => null);
ok((await texte(lea, ".pr-feuille-photo .ph-erreur")) === "Cette photo ne peut pas partir." && (await texte(lea, ".pr-feuille-photo .pr-bouton.grand")) === "Choisir une autre photo", "la modération la refuse : « Cette photo ne peut pas partir. », « Choisir une autre photo »");
await lea.screenshot({ path: `${D}/photos-4-refusee.png` });
await lea.locator(".pr-feuille-photo .pr-bouton.grand").click();
ok(await attendre(lea, () => !document.querySelector(".pr-feuille-photo.ouverte")) && (await compte(lea, ".pr-plein .pr-fil li.ph-li")) === 1, "fermée ; rien n'est parti");
await choisirPhoto(lea, "panne.jpg", PANNE);
await lea.waitForSelector(".pr-feuille-photo .ph-apercu img", { timeout: 10000 }).catch(() => null);
await lea.locator(".pr-feuille-photo .ph-envoyer").click();
await lea.waitForSelector(".pr-feuille-photo .ph-erreur", { timeout: 15000 }).catch(() => null);
ok((await texte(lea, ".pr-feuille-photo .ph-erreur")) === "La photo n’a pas pu être vérifiée. Réessaie dans un instant." && (await texte(lea, ".pr-feuille-photo .ph-envoyer")) === "Réessayer", "la modération ne répond pas : elle ne part pas, « Réessayer »");
// ce qui est parti du téléphone, gardé dans le seau (la modération ne l'a pas lu) : un WebP, sans aucune métadonnée
const brut = (await lister(`fils/${PAIRE}/p`)).find((n) => n.endsWith("-brut"));
const octetsBrut = brut ? Buffer.from(await (await fetch(`${STOCK}/figurines-clients/fils/${PAIRE}/p/${brut}`)).arrayBuffer()) : Buffer.alloc(0);
const metaBrut = await sharp(octetsBrut).metadata().catch(() => ({}));
ok(metaBrut.format === "webp" && metaBrut.width === 322 && !metaBrut.exif && !octetsBrut.includes(Buffer.from("Lea Essai")), `ce qui part du téléphone : un WebP (${metaBrut.format}, ${metaBrut.width} pixels), sans aucune métadonnée — ni l'auteur, ni la position GPS`);
const envoisAvant = envois.length;
await lea.locator(".pr-feuille-photo .ph-envoyer").click();
await lea.waitForSelector(".pr-feuille-photo .ph-envoyer:not([disabled])", { timeout: 15000 }).catch(() => null);
ok(envois.length === envoisAvant && (await texte(lea, ".pr-feuille-photo .ph-erreur")).includes("Réessaie"), "réessayer : la même photo, sans la redéposer ; toujours pas vérifiée");
await lea.keyboard.press("Escape");
await choisirPhoto(lea, "pas-une-photo.jpg", Buffer.from("ceci n'est pas une photo"));
ok(await attendre(lea, () => (document.querySelector(".pr-feuille-photo .ph-attente")?.textContent ?? "").includes("Ce fichier n’est pas une photo.")), "un fichier qui n'est pas une photo : « Ce fichier n'est pas une photo. »");
await lea.locator(".pr-feuille-photo .pr-bouton.grand").click();

// ═══ 🗑️ LÉA EFFACE SA PHOTO ═══
await lea.locator(".pr-plein .pr-fil li.ph-li.moi .pr-effacer").click();
await lea.waitForSelector(".fen .fen-oui", { timeout: 10000 }).catch(() => null);
await lea.locator(".fen .fen-oui").click();
ok(await attendre(lea, () => !document.querySelector(".pr-plein .pr-fil li.ph-li")), "Léa efface sa photo : partie de son fil");

// ═══ LA LIGNE DE LÉA, CHEZ ZOÉ (avant qu'elle l'efface : on renvoie une photo) ═══
await choisirPhoto(lea, "plage.jpg", PLAGE);
await lea.waitForSelector(".pr-feuille-photo .ph-apercu img", { timeout: 10000 }).catch(() => null);
await lea.locator(".pr-feuille-photo .ph-legende").fill("Encore la plage");
await lea.locator(".pr-feuille-photo .ph-envoyer").click();
await attendre(lea, () => Boolean(document.querySelector(".pr-plein .pr-fil li.ph-li.moi")), null, 20000);
await zoe.locator(".pr-plein .pr-retour").first().click();
ok(await attendre(zoe, (c) => (document.querySelector(`#o-proches .pr-carte[data-cle="${c}"] .pr-dernier`)?.textContent ?? "").includes("📷"), LEA.cle, 20000), "chez Zoé, dans « Proches », la ligne de Léa change");
const ligne = await texte(zoe, `#o-proches .pr-carte[data-cle="${LEA.cle}"] .pr-dernier`);
ok(ligne.startsWith("T’a envoyé : 📷 Encore la plage"), `« T'a envoyé : 📷 Encore la plage » (${ligne})`);

// ═══ PARTOUT ═══
for (const [nom, p] of [["Léa", lea], ["Zoé", zoe]]) {
  ok(p.err.length === 0, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err[0]})` : ""}`);
  ok((await debordement(p)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
}

await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
