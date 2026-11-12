// 🏡 LE PROCHE QUI ENTRE CHEZ MOI (chantier « Univers », lot 5a) — la conversation du talkie-walkie (`proches.tsx`),
// jouée dans l'univers de celui qui la regarde ; contre le faux Supabase, jamais la vraie base.
//
// La règle « chez qui ? » (tranchée le 12 novembre 2026) : dans l'appli, chacun voit la conversation chez soi, l'autre
// lui rend visite. Marc a son univers (son décor, ses places) et sa figurine du nouveau style, assise ; Inès a sa
// figurine d'aujourd'hui, sans univers. Inès laisse un message à Marc. Chez Marc : la scène est SON DÉCOR, sa figurine
// assise à sa place, celle d'Inès qui entre à la place de l'invité, et qui parle (sa voix, sa bouche, les
// sous-titres). Chez Inès : la scène d'aujourd'hui (elle n'a pas d'univers). 🎬 Lot 5b — « sur WhatsApp, chez celui qui
// envoie » : Marc parle à quelqu'un qui n'a pas ClikMe ; sa vidéo se fabrique chez lui (son décor à la place du fond
// rose). 🔗 Lot 5c — « le lien d'invitation ouvre l'univers de celui qui invite » : qui ouvre son lien est chez lui
// (son décor, sa figurine, « 👋 Bienvenue chez moi ! ») ; l'aperçu du lien est une image ; Inès lui répond depuis le
// lien : à la fin, leurs deux figurines chez lui. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, parlerAuMoins } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MARC = { id: "abababab-0000-4000-8000-000000000a01", jeton: "jeton-marc-chez-moi-0000001", prenom: "Marc" };
const INES = { id: "abababab-0000-4000-8000-000000000a02", jeton: "jeton-ines-chez-moi-0000001", prenom: "Inès" };
const GENS = [MARC, INES];
for (const x of GENS) x.cle = cleProfil(x.id);

// ─── deux habitants de Dax, leurs figurines d'aujourd'hui, proches tous les deux ───
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.webp`, img("pied/montre"), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img("pied/montre"), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${MARC.id}/proches.json`, { ids: [INES.id] });
await json(`${INES.id}/proches.json`, { ids: [MARC.id] });

// ─── Marc : sa figurine du nouveau style (lot 2) et son univers créé (lot 4) ───
const maintenant = new Date().toISOString();
const P1 = `${MARC.id}/perso/v1`;
await deposer(`${P1}/assise.png`, img("ecoute"), "image/webp");
await deposer(`${P1}/assise_parle.png`, img("ecoute"), "image/webp");
await deposer(`${P1}/debout.png`, img("ecoute"), "image/webp");
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
  scene: { sol: 0.78, places: [{ id: "hote", x: 0.32, y: 0.84, echelle: 1 }, { id: "invite", x: 0.7, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${M1}/decor.png` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${MARC.id}/monde/fiche.json`, monde);

// ─── Inès laisse un message à Marc ───
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;
const r = await fetch(`${BASE}/api/direct/proches`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: `clikme_habitant=${INES.jeton}` },
  body: JSON.stringify({ action: "envoyer", cle: MARC.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Je passe te voir ce soir ?", tete: null }] }),
});
ok(r.status === 200, `Inès laisse un message à Marc (${r.status})`);

const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
async function tel(qui) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${qui.prenom} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));

// ═══ CHEZ MARC : INÈS ENTRE DANS SON UNIVERS ═══
const marc = await tel(MARC);
await marc.goto(`${BASE}/collection?parler=${INES.cle}#proches`, { waitUntil: "networkidle" });
await fermerPablito(marc);
await marc.waitForSelector(".pr-plein .pr-fil li", { timeout: 60000 });
const scene = ".pr-plein .pr-scene.chez";
ok((await marc.locator(scene).count()) === 1 && (await marc.locator(`${scene} .pr-decor`).count()) === 1, "chez Marc, la scène est son décor");
ok(
  (await marc.locator(`${scene} .pr-ecoute-chez.assise img`).count()) === 1 && (await marc.locator(`${scene} .pr-parleur.invite`).count()) === 1,
  "sa figurine du nouveau style, assise à sa place ; celle d'Inès entre à la place de l'invité",
);
const places = await marc.evaluate((sel) => {
  const s = document.querySelector(sel)?.getBoundingClientRect();
  const lui = document.querySelector(`${sel} .pr-parleur`)?.getBoundingClientRect();
  const moi = document.querySelector(`${sel} .pr-ecoute-chez`)?.getBoundingClientRect();
  return s && lui && moi ? { moi: (moi.left + moi.width / 2 - s.left) / s.width, lui: (lui.left + lui.width / 2 - s.left) / s.width, dedans: moi.top >= s.top - 1 && lui.top >= s.top - 1 && moi.bottom <= s.bottom + 1 } : null;
}, scene);
ok(Boolean(places) && Math.abs(places.moi - 0.32) < 0.03 && Math.abs(places.lui - 0.7) < 0.03 && places.dedans, `chacun à sa place, dans la scène (${JSON.stringify(places)})`);
await marc.waitForTimeout(1000);
await marc.screenshot({ path: `${D}/talkie-chez-moi-1-scene.png` });
await marc.locator(`${scene} .pr-lire`).click();
const joue = await marc.waitForFunction((sel) => document.querySelector(sel)?.classList.contains("joue"), scene, { timeout: 10000 }).then(() => true).catch(() => false);
ok(joue && (await texte(marc, `${scene} .pr-sous-titre`)).includes("Je passe te voir ce soir"), "Inès parle chez Marc : sa voix, ses sous-titres");
ok((await debordement(marc)) <= 0 && (await sansMotInterdit(marc)), "rien ne déborde, sans le mot interdit");

// ═══ CHEZ INÈS : PAS D'UNIVERS, LA SCÈNE D'AUJOURD'HUI ═══
const ines = await tel(INES);
await ines.goto(`${BASE}/collection?parler=${MARC.cle}#proches`, { waitUntil: "networkidle" });
await fermerPablito(ines);
await ines.waitForSelector(".pr-plein .pr-scene", { timeout: 60000 });
ok((await ines.locator(".pr-plein .pr-scene.chez").count()) === 0 && (await ines.locator(".pr-plein .pr-scene .pr-ecoute").count()) === 1, "chez Inès, sans univers : la scène d'aujourd'hui");

// ═══ 🎬 MARC PARLE PAR WHATSAPP : LA VIDÉO SE PASSE CHEZ LUI ═══
const ctxVideo = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctxVideo.addCookies([{ name: "clikme_habitant", value: MARC.jeton, url: BASE }]);
await ctxVideo.addInitScript(() => {
  navigator.canShare = (d) => Boolean(d && d.files && d.files.length);
  navigator.share = async () => undefined;
});
const video = await ctxVideo.newPage();
video.on("pageerror", (e) => erreurs.push(`Marc (vidéo) : ${String(e)}`));
await video.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(video);
await video.waitForSelector("#o-proches .pr-wa .pr-bouton", { timeout: 60000 });
await video.locator("#o-proches .pr-wa .pr-bouton").click();
await video.waitForSelector(".pr-plein.pr-parler .pr-micro", { timeout: 15000 });
await video.locator(".pr-plein.pr-parler .pr-micro").click();
await video.waitForSelector(".pr-plein.pr-parler .pr-temps", { timeout: 15000 });
await parlerAuMoins(video);
await video.locator(".pr-plein.pr-parler .pr-micro").click();
await video.waitForSelector(".pr-plein.pr-parler .pr-choix li", { timeout: 30000 });
await video.locator(".pr-plein.pr-parler .pr-pour input").fill("Nina");
await video.locator(".pr-plein.pr-parler .pr-bas .pr-bouton").click();
await video.waitForSelector('.tf-feuille.ouverte .pr-pret[data-video="fabrication"] .pr-video canvas', { timeout: 30000 });
await video.waitForTimeout(2500);
// (le bord gauche de la vidéo, à mi-hauteur : son décor, pas le rose ClikMe)
const pixel = await video.evaluate(() => {
  const c = document.querySelector(".tf-feuille.ouverte .pr-pret .pr-video canvas");
  const d = c?.getContext("2d")?.getImageData(12, Math.round(c.height / 2), 1, 1).data;
  return d ? [d[0], d[1], d[2]] : null;
});
const rose = pixel ? Math.abs(pixel[0] - 224) + Math.abs(pixel[1] - 33) + Math.abs(pixel[2] - 138) < 60 : true;
ok(Boolean(pixel) && !rose, `sa vidéo WhatsApp se passe chez lui : son décor, pas le fond rose (${pixel?.join(",")})`);
await video.locator(".tf-feuille.ouverte .pr-pret .pr-video").screenshot({ path: `${D}/talkie-chez-moi-2-video.png` }).catch(() => null);
const prete = await video.waitForSelector('.tf-feuille.ouverte .pr-pret[data-video="prete"] .pr-video video', { timeout: 60000 }).then(() => true).catch(() => false);
ok(prete, "sa vidéo est prête à partir sur WhatsApp");
const lien = await video.locator(".tf-feuille.ouverte .pr-pret").getAttribute("data-url");

// ═══ 🔗 SON LIEN OUVRE SON UNIVERS ═══
const inconnu = await (await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, isMobile: true, hasTouch: true })).newPage();
inconnu.on("pageerror", (e) => erreurs.push(`Inconnu : ${String(e)}`));
await inconnu.goto(lien ?? `${BASE}/t/rien`, { waitUntil: "networkidle" });
ok(
  (await texte(inconnu, "h1")).includes("Marc t’accueille dans son univers") && (await inconnu.locator(".pt-scene.chez .pr-decor").count()) === 1 && (await inconnu.locator(".pt-scene.chez .pr-parleur.assise").count()) === 1,
  `son lien ouvre son univers : son décor, sa figurine assise chez lui (${await texte(inconnu, "h1")})`,
);
ok((await texte(inconnu, ".pt-bonjour")).includes("Bienvenue chez moi"), "sa figurine dit bonjour : « 👋 Bienvenue chez moi ! »");
ok((await debordement(inconnu)) <= 0 && (await sansMotInterdit(inconnu)), "la page du lien : rien ne déborde, sans le mot interdit");
await inconnu.screenshot({ path: `${D}/talkie-chez-moi-3-lien.png` });
const apercu = await fetch(`${lien}/apercu`);
ok(apercu.status === 200 && (apercu.headers.get("content-type") ?? "").includes("image"), `l'aperçu du lien, dans WhatsApp : une image (${apercu.status})`);

// ═══ INÈS LUI RÉPOND DEPUIS LE LIEN : LEURS DEUX FIGURINES CHEZ LUI ═══
const ctxInes = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctxInes.addCookies([{ name: "clikme_habitant", value: INES.jeton, url: BASE }]);
const inesLien = await ctxInes.newPage();
inesLien.on("pageerror", (e) => erreurs.push(`Inès (lien) : ${String(e)}`));
await inesLien.goto(lien ?? `${BASE}/t/rien`, { waitUntil: "networkidle" });
await inesLien.locator(".pt-repondre").click();
await inesLien.waitForSelector(".pr-plein.pr-parler .pr-micro", { timeout: 15000 });
await inesLien.locator(".pr-plein.pr-parler .pr-micro").click();
await inesLien.waitForSelector(".pr-plein.pr-parler .pr-temps", { timeout: 15000 });
await parlerAuMoins(inesLien);
await inesLien.locator(".pr-plein.pr-parler .pr-micro").click();
await inesLien.waitForSelector(".pr-plein.pr-parler .pr-choix li", { timeout: 30000 });
await inesLien.locator(".pr-plein.pr-parler .pr-bas .pr-bouton").click();
await inesLien.waitForSelector(".pt-fini", { timeout: 30000 }).catch(() => null);
ok((await inesLien.locator(".pt-chez-duo .pr-decor").count()) === 1 && (await inesLien.locator(".pt-chez-duo .pr-ecoute-chez").count()) === 2, "« C'est parti ! » : leurs deux figurines chez lui, la sienne à la place de l'invité");
await inesLien.screenshot({ path: `${D}/talkie-chez-moi-4-reponse.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nle proche entre chez moi ✓");
process.exit(echecs ? 1 : 0);
