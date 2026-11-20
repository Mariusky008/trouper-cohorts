// 🏠 « MA MAISON » QUI SE REMPLIT (`app/collection/maison-catalogue.tsx`, `lib/direct/ma-maison.ts`, `docs/univers/ma-maison.md`,
// section 15 ; le lot M2, première partie) — l'adresse d'essai `/univers/maison`, sur un iPhone, contre le faux Supabase.
//
// Léa (l'administrateur, sur ce téléphone) vit dans le salon ; elle a gardé des choses : deux photos et une chanson
// rangées « dans son univers », une vidéo, un mot gardé avec Sam (📌), un duo de mèmes avec Sam ; Sam a gardé un mot à lui
// (il va chez lui, pas chez elle). La route : les objets à leur place (les photos dans les deux cadres — la plus ancienne
// remplacée par la troisième —, la chanson sur la platine, la vidéo à la télé, le reste sur l'étagère) ; `vuLe` à 0.
// L'écran : « ✨ 2 choses gardées avec Sam », la caméra passe sur chacune, puis la visite est retenue ; un toucher sur un
// cadre : sa photo, « Mis chez toi », « 🔍 La voir en grand » ; la platine : « ▶ Écouter » (le lien) ; le mot : « Gardé
// avec Sam ». Revenir : plus d'annonce. Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

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
const LEA = { id: "4a150a15-0000-4000-8000-00000000cc01", jeton: "jeton-ma-maison-remplie-0001", prenom: "Léa" };
const SAM = { id: "4a150a15-0000-4000-8000-00000000cc02", jeton: "jeton-ma-maison-remplie-0002", prenom: "Sam" };
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
const ilYa = (min) => new Date(Date.now() - min * 60_000).toISOString();
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
await deposer(`${LEA.id}/perso/v1/assise.png`, assise, "image/png");
const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${LEA.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${LEA.id}/perso/v1/fiche.json`, fiche);
await json(`${LEA.id}/perso/fiche.json`, fiche);
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 34, adulte: true });
await deposer(`${SAM.id}/neutre-essai.png`, assise, "image/png");
await deposer(`${LEA.id}/neutre-essai.png`, assise, "image/png");
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
// (sa pièce : le salon, ses emplacements relevés — la télé, la platine, l'étagère, deux cadres)
await poserPiece(deposer, "salon", {
  fond: "#5a4a6e",
  sol: "#6a5040",
  le: maintenant,
  emplacements: {
    tele: [0.32, 0.2, 0.36, 0.15],
    fenetre: [0.04, 0.1, 0.22, 0.26],
    platine: [0.74, 0.5, 0.16, 0.07],
    etagere: [0.76, 0.1, 0.2, 0.34],
    cadres: [
      [0.06, 0.44, 0.1, 0.09],
      [0.18, 0.44, 0.1, 0.09],
    ],
    places: [
      { x: 0.3, y: 0.86, hauteur: 0.3 },
      { x: 0.7, y: 0.86, hauteur: 0.3 },
    ],
  },
});
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
// (ce qu'elle a rangé chez elle : trois photos, une chanson, une vidéo — leurs images)
const image = (couleur) => sharp({ create: { width: 300, height: 300, channels: 3, background: couleur } }).jpeg().toBuffer();
const L8 = qui8(LEA.id);
const S8 = qui8(SAM.id);
const range = (id, sorte, titre, couleur, min, lien) => ({ id, genre: "gout", nuance: "aime", emoji: { photo: "🖼️", musique: "🎵", video: "📺" }[sorte], titre, concerne: L8, citation: "", de8: L8, message: `univers-${id}`, le: ilYa(min), etat: "actif", depose: true, image: { chemin: `${LEA.id}/etagere/${id}.jpg`, l: 300, h: 300, sorte, ...(lien ? { lien } : {}) }, couleur });
const ranges = [
  range("photo00001", "photo", "La plage", "#3a7bd5", 300),
  range("photo00002", "photo", "Le gâteau", "#d53a7b", 200),
  range("photo00003", "photo", "Le concert", "#7bd53a", 100),
  range("chanson001", "musique", "Notre chanson", "#d5a03a", 90, "https://www.essai.invalid/chanson"),
  range("video00001", "video", "Le film du dimanche", "#3ad5c0", 80, "https://www.youtube.com/watch?v=FilmDimanch"),
];
for (const r of ranges) await deposer(r.image.chemin, await image(r.couleur), "image/jpeg");
await json(`${LEA.id}/etagere-perso.json`, { v: 1, objets: ranges.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "couleur"))), montres: [], caches: [] });
// (sur leur étagère partagée : un mot gardé par Léa (📌), un duo de mèmes rangé par elle, un mot gardé par Sam)
const PAIRE = [LEA.id, SAM.id].sort().join("_");
await json(`fils/${PAIRE}/etagere.json`, {
  v: 1,
  lu: 0,
  verrou: 0,
  objets: [
    { id: "motlea0001", genre: "mot", emoji: "💬", titre: "On ira à Lisbonne", concerne: "deux", citation: "On ira à Lisbonne", de8: S8, message: "m-1", le: ilYa(30), etat: "actif", garde: { par8: L8 } },
    { id: "duolea0001", genre: "blague", emoji: "🎬", titre: "Le canard qui danse", concerne: "deux", citation: "Le canard qui danse", de8: L8, message: "m-2", le: ilYa(20), etat: "actif", garde: { par8: L8 } },
    { id: "motsam0001", genre: "mot", emoji: "💬", titre: "Le mot de Sam", concerne: "deux", citation: "Le mot de Sam", de8: L8, message: "m-3", le: ilYa(10), etat: "actif", garde: { par8: S8 } },
  ],
});
// (sa dernière visite : il y a une heure — les deux choses gardées avec Sam depuis s'annoncent)
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() - 60 * 60_000 });

// ═══ LA ROUTE ═══
const cookies = `clikme_habitant=${LEA.jeton}; sb-127-auth-token=base64-${b64(session)}`;
const r = await fetch(`${BASE}/api/direct/ma-piece`, { headers: { cookie: cookies } });
const j = await r.json();
const c = j.maison?.contenu;
ok(r.status === 200 && c, `GET : sa maison et son contenu (${r.status})`);
ok(c?.cadres?.map((x) => x?.titre).join(",") === "Le concert,Le gâteau", `les photos dans les deux cadres : la plus ancienne remplacée par la troisième (${c?.cadres?.map((x) => x?.titre).join(",")})`);
ok(c?.platine?.titre === "Notre chanson" && c?.platine?.lien === "https://www.essai.invalid/chanson" && /^http/.test(c?.platine?.image?.src ?? ""), "la chanson sur la platine, sa pochette, son lien");
ok(c?.tele?.titre === "Le film du dimanche", "la vidéo à la télé");
ok(c?.etagere?.map((x) => x.titre).join(",") === "Le canard qui danse,On ira à Lisbonne" && c?.etagere?.every((x) => x.avec?.prenom === "Sam"), `sur l'étagère, gardés avec Sam, les plus récents d'abord (${c?.etagere?.map((x) => x.titre).join(",")})`);
ok(!JSON.stringify(c).includes("Le mot de Sam"), "ce que Sam a gardé va chez lui, pas chez elle");
ok(c?.total === 7 && j.maison?.vuLe > 0, `7 objets en tout ; sa dernière visite (${c?.total}, ${j.maison?.vuLe})`);

// ═══ L'ÉCRAN ═══
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
// (📺 le lecteur de YouTube tout simple : rien ne part chez YouTube)
await ctx.route(/^https:\/\/www\.youtube-nocookie\.com\//, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>lecteur</title>" }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const scene = p.locator('.mmc-scene[data-piece="salon"]');
const vus = [];
await p.exposeFunction("__vise", (id) => vus.push(id));
await p.addInitScript(() => {
  new MutationObserver((l) => {
    for (const m of l) if (m.type === "attributes" && m.target.classList?.contains("vise")) window.__vise?.(m.target.getAttribute("data-objet"));
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });
});
await p.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await scene.locator(".mmc-objet").count()) === 6), `les objets à leur place (${await scene.locator(".mmc-objet").count()} : deux cadres, la platine, la télé, deux sur l'étagère)`);
ok(await attendre(async () => (await scene.locator('.mmc-photo[data-place="cadre-0"] img').evaluate((i) => i.complete && i.naturalWidth > 0)) === true), "la photo du premier cadre, chargée");
const dansLeCadre = await p.evaluate(() => {
  const o = document.querySelector('.mmc-photo[data-place="cadre-1"]').getBoundingClientRect();
  const z = document.querySelector('[data-zone="cadres"]:nth-of-type(2), .mmc-zone[data-zone="cadres"]');
  const zs = [...document.querySelectorAll('.mmc-zone[data-zone="cadres"]')].map((x) => x.getBoundingClientRect());
  return zs.some((r) => Math.abs(r.left - o.left) < 1 && Math.abs(r.width - o.width) < 1) && Boolean(z);
});
ok(dansLeCadre, "… posée exactement sur son cadre");
ok(await attendre(async () => /✨ 2 choses gardées avec Sam/.test(await scene.locator("[data-arrivee]").innerText()), 8000), "l'arrivée : « ✨ 2 choses gardées avec Sam »");
await p.waitForTimeout(400);
const annonce = await scene.locator("[data-arrivee]").boundingBox();
ok(annonce && annonce.x >= 0 && annonce.x + annonce.width <= 390 && Math.abs(annonce.x + annonce.width / 2 - 195) < 3, `… au milieu, entière (${Math.round(annonce?.x)}–${Math.round(annonce?.x + annonce?.width)} pt)`);
await p.screenshot({ path: `${D}/ma-maison-remplie-1-arrivee.png` });
ok(await attendre(async () => vus.includes("motlea0001") && vus.includes("duolea0001"), 12000), `la caméra passe sur chacune (${vus.join(",")})`);
ok(await attendre(async () => (await scene.locator("[data-arrivee]").count()) === 0, 8000), "puis la maison est à elle (l'annonce s'en va)");
const vuRecent = async () => {
  const v = await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/ma-piece/vu.json`)).json().catch(() => ({}));
  return Date.now() - (v.le ?? 0) < 60_000;
};
ok(await attendre(vuRecent, 5000), "la visite est retenue");

// ─── toucher les objets ───
const toucher = async (sel) => {
  const o = scene.locator(sel).first();
  await o.evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
  await p.waitForTimeout(250);
  await o.click();
};
await toucher('.mmc-photo[data-place="cadre-0"]');
const bulle = scene.locator('.mmc-bulle[data-bulle="objet"]');
ok(await attendre(async () => /Le concert/.test(await bulle.innerText()) && /Mis chez toi/.test(await bulle.innerText())), "un cadre : « Le concert », « Mis chez toi »");
await bulle.locator("[data-grand]").click();
ok(await attendre(async () => (await p.locator("[data-photo-grand] img").evaluate((i) => i.complete && i.naturalWidth > 0)) === true), "« 🔍 La voir en grand »");
await p.screenshot({ path: `${D}/ma-maison-remplie-2-grand.png` });
await p.locator("[data-photo-grand]").click();
ok((await p.locator("[data-photo-grand]").count()) === 0, "un toucher la referme");
await toucher(".mmc-platine");
ok(await attendre(async () => /Notre chanson/.test(await bulle.innerText()) && (await bulle.locator("[data-ouvrir]").getAttribute("href")) === "https://www.essai.invalid/chanson" && /Écouter/.test(await bulle.locator("[data-ouvrir]").innerText())), "la platine : « Notre chanson », « ▶ Écouter » (son lien)");
await p.screenshot({ path: `${D}/ma-maison-remplie-3-platine.png` });
// (📺 retours du 20 novembre 2026 : le film mis sur la télé joue DANS la télé de la pièce — jamais un départ vers YouTube)
await toucher(".mmc-tele");
ok(
  await attendre(async () => (await scene.locator(".mmc-ecran[data-tele-joue] iframe").getAttribute("src"))?.startsWith("https://www.youtube-nocookie.com/embed/FilmDimanch?")),
  "la télé touchée : le film joue sur son écran, dans la scène",
);
const ecranTele = await scene.locator(".mmc-ecran").boundingBox();
const boiteTele = await scene.locator(".mmc-tele").boundingBox();
ok(ecranTele && boiteTele && Math.abs(ecranTele.x - boiteTele.x) < 2 && Math.abs(ecranTele.width - boiteTele.width) < 2, "… à la place de l'écran de la télé");
ok(await attendre(async () => /Le film du dimanche/.test(await bulle.innerText()) && /Éteindre la télé/.test(await bulle.locator('[data-tele="joue"]').innerText())), "… sa bulle : « ⏹ Éteindre la télé »");
ok((await scene.locator('a[href*="youtube.com"]').count()) === 0, "… aucun lien vers YouTube");
await p.screenshot({ path: `${D}/ma-maison-remplie-3b-tele.png` });
// (un clic du programme : en local, le petit bouton du serveur de développement peut couvrir le bas de l'écran)
await bulle.locator('[data-tele="joue"]').evaluate((x) => x.click());
ok(await attendre(async () => (await scene.locator(".mmc-ecran").count()) === 0 && /Regarder/.test(await bulle.locator('[data-tele="eteinte"]').innerText())), "« ⏹ Éteindre la télé » : elle s'éteint ; « ▶ Regarder » la rallume");
await toucher('.mmc-objet[data-objet="motlea0001"]');
ok(await attendre(async () => /On ira à Lisbonne/.test(await bulle.innerText()) && /Gardé avec Sam/.test(await bulle.innerText())), "le mot sur l'étagère : « Gardé avec Sam »");
await bulle.locator("button[aria-label='Fermer']").click();
ok((await scene.locator(".mmc-bulle").count()) === 0, "la bulle se ferme");
await toucher('.mmc-zone[data-zone="fenetre"]');
ok((await scene.locator('.mmc-bulle[data-bulle="objet"]').count()) === 0, "un emplacement : sa bulle à lui, pas celle d'un objet");

// ─── revenir : plus d'annonce ───
await p.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await scene.locator(".mmc-objet").count()) === 6), "revenir : les objets sont là");
await p.waitForTimeout(1500);
ok((await scene.locator("[data-arrivee]").count()) === 0, "… et plus d'annonce (rien de nouveau)");

// ═══ ＋ AJOUTER CHEZ MOI (lot M2, deuxième partie) ═══
const ajouter = p.locator("[data-ajouter]");
const attendreFait = async (re) => attendre(async () => re.test(await scene.locator("[data-fait]").innerText()), 10000);
await scene.locator('[data-geste="ajouter"]').click();
ok(await attendre(async () => (await ajouter.locator("[data-quoi]").count()) === 9), "＋ : « Qu’est-ce que tu mets chez toi ? », neuf choix");
await p.waitForTimeout(450);
await p.screenshot({ path: `${D}/ma-maison-remplie-4-ajouter.png` });
await ajouter.locator('[data-quoi="photo"]').click();
await ajouter.locator("[data-mettre]").click();
ok(/Choisis d’abord une photo/.test(await ajouter.locator(".acm-erreur").innerText().catch(() => "")), "sans photo : « Choisis d’abord une photo »");
const jpeg = await image("#e0c050");
await ajouter.locator("[data-fichier]").setInputFiles({ name: "mariage.jpg", mimeType: "image/jpeg", buffer: jpeg });
ok(await attendre(async () => (await ajouter.locator("[data-apercu]").count()) === 1), "la photo choisie, en aperçu");
await ajouter.locator('[data-champ="titre"]').fill("Le mariage");
await ajouter.locator("[data-mettre]").click();
ok(await attendreFait(/C’est chez toi, dans un cadre/), "« Mettre chez moi » : « ✓ C’est chez toi, dans un cadre »");
const cadres = async () => scene.locator('.mmc-photo').evaluateAll((l) => l.map((x) => x.getAttribute("aria-label")).join(" | "));
ok(await attendre(async () => /Le mariage/.test(await cadres()) && /Le concert/.test(await cadres()) && !/Le gâteau/.test(await cadres())), `… à la place de la plus ancienne (${await cadres()})`);
await p.screenshot({ path: `${D}/ma-maison-remplie-5-photo.png` });
await scene.locator('[data-geste="ajouter"]').click();
await ajouter.locator('[data-quoi="chanson"]').click();
await ajouter.locator("[data-mettre]").click();
ok(/Donne-lui un nom/.test(await ajouter.locator(".acm-erreur").innerText().catch(() => "")), "une chanson sans nom ni lien : « Donne-lui un nom »");
await ajouter.locator('[data-champ="titre"]').fill("La chanson du bal");
await ajouter.locator('[data-champ="lien"]').fill("https://www.essai.invalid/bal");
await ajouter.locator("[data-mettre]").click();
ok(await attendreFait(/sur la platine/), "une chanson, avec son lien : « sur la platine »");
ok(await attendre(async () => (await scene.locator(".mmc-platine").getAttribute("aria-label")) === "🎵 La chanson du bal"), "… elle tourne sur la platine (l’autre rejoint l’étagère)");
await scene.locator('[data-geste="ajouter"]').click();
await ajouter.locator('[data-quoi="livre"]').click();
await ajouter.locator('[data-champ="titre"]').fill("Le Petit Prince");
await ajouter.locator('[data-champ="mot"]').fill("Lu trois fois");
await ajouter.locator("[data-mettre]").click();
ok(await attendreFait(/sur l’étagère/), "un livre : « sur l’étagère »");
const livre = scene.locator('.mmc-objet[aria-label="📚 Le Petit Prince"]');
ok(await attendre(async () => (await livre.count()) === 1), "… le voilà sur l’étagère");
// (la caméra est allée le voir : on la laisse finir)
await p.waitForTimeout(2200);
await toucher('.mmc-objet[aria-label="📚 Le Petit Prince"]');
ok(await attendre(async () => /Mis chez toi · Lu trois fois/.test(await bulle.innerText())), "un toucher : « Mis chez toi · Lu trois fois »");
await bulle.locator("button[aria-label='Fermer']").click({ timeout: 2000 }).catch(() => undefined);

// ═══ 🗑️ L'ENLEVER (un appui long) ═══
const appuiLong = async (sel) => {
  const o = scene.locator(sel).first();
  await o.evaluate((x) => x.scrollIntoView({ inline: "center", block: "nearest" }));
  await p.waitForTimeout(300);
  const r = await o.boundingBox();
  await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await p.mouse.down();
  await p.waitForTimeout(750);
  await p.mouse.up();
};
const enlever = p.locator("[data-enlever]");
await appuiLong('.mmc-objet[data-objet="motlea0001"]');
ok(await attendre(async () => /Il reste sur votre étagère, avec Sam/.test(await enlever.innerText())) && (await scene.locator('.mmc-bulle[data-bulle="objet"]').count()) === 0, "un appui long sur le mot gardé avec Sam : « Il reste sur votre étagère, avec Sam » (et pas sa bulle)");
await p.waitForTimeout(450);
await p.screenshot({ path: `${D}/ma-maison-remplie-6-enlever.png` });
await enlever.locator("[data-confirmer]").click();
ok(await attendre(async () => (await scene.locator('.mmc-objet[data-objet="motlea0001"]').count()) === 0), "« L’enlever » : il n’est plus chez elle");
const etagereDuo = await (await fetch(`${STOCK}/figurines-clients/fils/${PAIRE}/etagere.json`)).json();
ok(etagereDuo.objets.some((o) => o.id === "motlea0001"), "… mais toujours sur leur étagère partagée");
await appuiLong('.mmc-objet[aria-label="📚 Le Petit Prince"]');
ok(await attendre(async () => /Il disparaît de chez toi/.test(await enlever.innerText())), "un appui long sur le livre : « Il disparaît de chez toi »");
await enlever.locator("[data-confirmer]").click();
ok(await attendre(async () => (await livre.count()) === 0), "« L’enlever » : le livre est parti");
const perso = await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/etagere-perso.json`)).json();
ok(!perso.objets.some((o) => o.titre === "Le Petit Prince") && perso.caches.includes("motlea0001"), "… de son étagère aussi ; le mot de Sam, retiré de chez elle seulement");
const mauvais = await fetch(`${BASE}/api/direct/ma-piece`, { method: "POST", headers: { "content-type": "application/json", cookie: cookies }, body: JSON.stringify({ action: "ajouter", quoi: "voiture", titre: "x" }) });
const parti = await fetch(`${BASE}/api/direct/ma-piece`, { method: "POST", headers: { "content-type": "application/json", cookie: cookies }, body: JSON.stringify({ action: "enlever", id: "inconnu0001" }) });
ok(mauvais.status === 400 && parti.status === 404, `la route : un choix inconnu refusé, un objet inconnu introuvable (${mauvais.status}, ${parti.status})`);
ok(!(await p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "pas de débordement");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
