// 🎵 « LE RANGER DANS MON UNIVERS ? » · 🖼️ « LA METTRE DANS MON UNIVERS ? », DANS LE NAVIGATEUR — `app/collection/
// ranger-univers.tsx`, `lib/direct/ranger-univers.ts`, `rangerDansMonUnivers` (`etagere-serveur.ts`) ; une seconde app,
// l'interrupteur « Univers pour tous » allumé (`../seconde-app.mjs`) ; contre le faux Supabase, jamais la vraie base.
//
// Sam et Léa se parlent. Dans leur conversation, Sam a envoyé une vidéo YouTube, une photo du lac, une chanson Spotify,
// un mot sans lien, et une vieille chanson (il y a neuf jours) ; Léa, une photo. CHEZ SAM : la question sous SA vidéo,
// SA photo et SA chanson récente — rien sous la photo de Léa, ni sous le mot, ni sous la vieille chanson. « Oui » sous la
// vidéo et la photo : « ✓ Dans ton univers, sur ton étagère » ; « Non » sous la chanson : la question s'en va, et ne
// revient pas. Les copies : dans SON univers (`<Sam>/univers/objets/`), la photo à sa taille. Les règles du serveur :
// la photo de Léa (403), deux fois la même (409), un mot sans lien (400), un message inconnu (404). Sam efface sa
// photo : sa copie reste. Dans « Ma maison » : la pochette et la photo encadrée sur sa planche ; sa page, la fiche
// de la vidéo (« ▶ La regarder »). Il montre la photo à ses visiteurs : Léa, en visite, la voit encadrée (« une photo ·
// … »), pas la vidéo. Il retire la vidéo : sa copie s'en va. Rien ne déborde, jamais le mot interdit, aucune erreur.
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import { D, F, fermerPablito, lancer } from "./commun.mjs";
import { lancerSecondeApp } from "../seconde-app.mjs";

const sharp = createRequire(import.meta.url)("sharp");
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const couleur = (l, h, c) => sharp({ create: { width: l, height: h, channels: 3, background: c } }).webp().toBuffer();

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000f90${String(n).padStart(2, "0")}`, jeton: `jeton-ranger-univers-nav-00${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const LEA = qui(2, "Léa");
const GENS = [SAM, LEA];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre"][i % 2]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre"][i % 2]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: maintenant, age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: maintenant })),
);
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });

// ─── Sam : sa figurine assise, son univers (ouvert à ses proches) ───
const P1 = `${SAM.id}/perso/v1`;
for (const n of ["assise", "assise_parle"]) await deposer(`${P1}/${n}.webp`, img("pied/salut-1"), "image/webp");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.webp` }, assise_parle: { chemin: `${P1}/assise_parle.webp` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${SAM.id}/perso/fiche.json`, perso);
const M1 = `${SAM.id}/monde/v1`;
await deposer(`${M1}/decor.webp`, img("pied/montre"), "image/webp");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.32, y: 0.84, echelle: 1 }, { id: "invite", x: 0.7, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${M1}/decor.webp` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${SAM.id}/monde/fiche.json`, monde);

// ─── leur conversation : ce que Sam a envoyé, et une photo de Léa ───
const PAIRE = [SAM.id, LEA.id].sort().join("_");
const ilYa = (min) => Date.now() - min * 60_000;
const message = async (ts, de, f) => json(`fils/${PAIRE}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${f.id}.json`, { de: de.id, le: new Date(ts).toISOString(), tete: null, ...f });
await deposer(`fils/${PAIRE}/a/ru0000000001.webp`, await couleur(640, 360, { r: 200, g: 40, b: 40 }), "image/webp");
await message(ilYa(180), SAM, { id: "ru0000000001", genre: "ecrit", texte: "Regarde ça https://www.youtube.com/watch?v=essai", lien: { url: "https://www.youtube.com/watch?v=essai", site: "youtube.com", titre: "Le morceau de l’été, en version longue et en public", image: `fils/${PAIRE}/a/ru0000000001.webp`, sorte: "video" } });
await deposer(`fils/${PAIRE}/p/ru0000000002.webp`, await couleur(600, 800, { r: 60, g: 150, b: 220 }), "image/webp");
await message(ilYa(120), SAM, { id: "ru0000000002", genre: "photo", media: { chemin: `fils/${PAIRE}/p/ru0000000002.webp`, l: 600, h: 800 }, legende: "Le lac ce matin" });
await deposer(`fils/${PAIRE}/p/ru0000000003.webp`, await couleur(800, 600, { r: 40, g: 200, b: 90 }), "image/webp");
await message(ilYa(60), LEA, { id: "ru0000000003", genre: "photo", media: { chemin: `fils/${PAIRE}/p/ru0000000003.webp`, l: 800, h: 600 }, legende: "Mon jardin" });
await deposer(`fils/${PAIRE}/a/ru0000000004.webp`, await couleur(640, 640, { r: 90, g: 90, b: 90 }), "image/webp");
await message(ilYa(9 * 24 * 60), SAM, { id: "ru0000000004", genre: "ecrit", texte: "https://open.spotify.com/track/vieille", lien: { url: "https://open.spotify.com/track/vieille", site: "open.spotify.com", titre: "Une vieille chanson", image: `fils/${PAIRE}/a/ru0000000004.webp`, sorte: "musique" } });
await message(ilYa(30), SAM, { id: "ru0000000005", genre: "ecrit", texte: "À ce soir !" });
await deposer(`fils/${PAIRE}/a/ru0000000006.webp`, await couleur(640, 640, { r: 240, g: 190, b: 60 }), "image/webp");
await message(ilYa(20), SAM, { id: "ru0000000006", genre: "ecrit", texte: "Et celle-là https://open.spotify.com/track/essai", lien: { url: "https://open.spotify.com/track/essai", site: "open.spotify.com", titre: "La chanson du lac", image: `fils/${PAIRE}/a/ru0000000006.webp`, sorte: "musique" } });
await json(`${SAM.id}/fils-lus.json`, { [LEA.id]: Date.now() });
await json(`${LEA.id}/fils-lus.json`, { [SAM.id]: Date.now() });

const { base: ALLUME, arreter } = await lancerSecondeApp({ port: 3829 });
const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: "clikme_habitant", value: SAM.jeton, url: ALLUME }]);
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel, page = p) => plat(await page.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const compte = (sel, page = p) => page.locator(sel).count();
const attendre = (f, arg, ms = 20000, page = p) => page.waitForFunction(f, arg, { timeout: ms, polling: 150 }).then(() => true).catch(() => false);
const debordement = (page = p) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const ranger = (corps, page = p) =>
  page.evaluate(async (c) => {
    const r = await fetch("/api/direct/etagere", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ranger-univers", ...c }) });
    return { statut: r.status, j: await r.json().catch(() => ({})) };
  }, corps);
async function ouvrirConversation() {
  await p.goto(`${ALLUME}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p);
  await p.waitForSelector(`.cm-liste li[data-cle="${LEA.cle}"] .cm-ligne`, { timeout: 30000 });
  await p.locator(`.cm-liste li[data-cle="${LEA.cle}"] .cm-ligne`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
}

try {
  // ═══ CHEZ SAM : LA QUESTION, SOUS CE QU'IL A ENVOYÉ ═══
  await ouvrirConversation();
  ok(await attendre(() => document.querySelectorAll(".pr-plein .ru-q").length === 3), "la question sous trois messages");
  const sous = await p.locator(".pr-plein .ru-q").evaluateAll((l) => l.map((x) => x.dataset.ranger).sort());
  ok(sous.join(" ") === "ru0000000001 ru0000000002 ru0000000006", `sous SA vidéo, SA photo, SA chanson récente (${sous.join(" · ")})`);
  ok((await texte('.pr-plein .ru-q[data-ranger="ru0000000001"] span')) === "🎵 Le ranger dans mon univers ?" && (await texte('.pr-plein .ru-q[data-ranger="ru0000000002"] span')) === "🖼️ La mettre dans mon univers ?", "« 🎵 Le ranger dans mon univers ? », « 🖼️ La mettre dans mon univers ? »");
  ok((await compte('[data-ranger="ru0000000003"], [data-ranger="ru0000000004"], [data-ranger="ru0000000005"]')) === 0, "rien sous la photo de Léa, ni sous la vieille chanson, ni sous un mot sans lien");
  ok((await debordement()) <= 0, "rien ne déborde");
  await p.locator('.pr-plein .ru-q[data-ranger="ru0000000001"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${D}/ranger-univers-1-question.png` });

  // ═══ « OUI », « NON » ═══
  await p.locator('.pr-plein .ru-q[data-ranger="ru0000000001"] .ru-oui').click();
  ok(await attendre(() => document.querySelector('.pr-plein .ru-fait[data-range="ru0000000001"]')?.textContent === "✓ Dans ton univers, sur ton étagère"), "« Oui » sous la vidéo : « ✓ Dans ton univers, sur ton étagère »");
  await p.locator('.pr-plein .ru-q[data-ranger="ru0000000002"] .ru-oui').click();
  ok(await attendre(() => Boolean(document.querySelector('.pr-plein .ru-fait[data-range="ru0000000002"]'))), "« Oui » sous la photo : rangée");
  await p.locator('.pr-plein .ru-q[data-ranger="ru0000000006"] .ru-non').click();
  ok(await attendre(() => !document.querySelector('.pr-plein [data-ranger="ru0000000006"]')), "« Non » sous la chanson : la question s'en va");
  await p.locator('.pr-plein .ru-fait[data-range="ru0000000002"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${D}/ranger-univers-2-range.png` });
  await ouvrirConversation();
  ok(await attendre(() => document.querySelectorAll(".pr-plein .ru-fait").length === 2 && !document.querySelector(".pr-plein .ru-q")), "rouverte : « ✓ » sous la vidéo et la photo ; la chanson refusée ne redemande pas");

  // ═══ LES COPIES, DANS SON UNIVERS ═══
  const copies = await lister(`${SAM.id}/univers/objets`);
  ok(copies.length === 2 && copies.every((n) => n.endsWith(".webp")), `deux copies dans son univers (${copies.join(", ")})`);
  const fiche = JSON.parse((await lire(`${SAM.id}/etagere-perso.json`))?.toString() ?? "{}");
  const video = (fiche.objets ?? []).find((o) => o.image?.sorte === "video");
  const photo = (fiche.objets ?? []).find((o) => o.image?.sorte === "photo");
  ok(video?.genre === "gout" && video.image.lien === "https://www.youtube.com/watch?v=essai" && [...video.titre].length <= 28 && video.titre.startsWith("Le morceau de l’été") && video.titre.endsWith("…") && video.emoji === "📺", `la vidéo : « ${video?.titre} », 📺, son lien gardé`);
  ok(photo?.titre === "Le lac ce matin" && photo.emoji === "🖼️" && photo.image.chemin.startsWith(`${SAM.id}/univers/objets/`) && photo.depose === true, "la photo : « Le lac ce matin », 🖼️, recopiée chez lui");
  const meta = await sharp((await lire(photo?.image?.chemin ?? "")) ?? Buffer.alloc(0)).metadata().catch(() => ({}));
  ok(meta.format === "webp" && meta.width === 600 && meta.height === 800, `la copie de la photo : un WebP, ${meta.width} × ${meta.height}`);

  // ═══ LES RÈGLES DU SERVEUR ═══
  const deLea = await ranger({ avec: LEA.cle, message: "ru0000000003" });
  ok(deLea.statut === 403 && deLea.j.error === "Seul celui qui l’a envoyé peut le ranger chez lui.", "la photo de Léa : 403, « Seul celui qui l'a envoyé peut le ranger chez lui. »");
  ok((await ranger({ avec: LEA.cle, message: "ru0000000001" })).statut === 409, "deux fois la même : 409");
  ok((await ranger({ avec: LEA.cle, message: "ru0000000005" })).statut === 400, "un mot sans lien : 400");
  ok((await ranger({ avec: LEA.cle, message: "zz9999999999" })).statut === 404, "un message inconnu : 404");

  // ═══ IL EFFACE SA PHOTO : SA COPIE RESTE ═══
  const efface = await p.evaluate(async (c) => (await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "effacer", cle: c, id: "ru0000000002" }) })).status, LEA.cle);
  ok(efface === 200 && !(await lire(`fils/${PAIRE}/p/ru0000000002.webp`)) && Boolean(await lire(photo?.image?.chemin ?? "")), "Sam efface sa photo de la conversation : sa copie reste dans son univers");

  // ═══ 🏠 « MA MAISON » : SA PLANCHE, SA PAGE, LA FICHE ═══
  await p.goto(`${ALLUME}/collection?v=${Date.now()}#maison`, { waitUntil: "networkidle" });
  await fermerPablito(p);
  ok(await attendre(() => document.querySelector("#o-maison .et-chez")?.getAttribute("data-n") === "2" && document.querySelectorAll("#o-maison .et-chez-planche .et-img").length === 2), "sur sa planche : la vignette et la photo encadrée");
  await p.screenshot({ path: `${D}/ranger-univers-3-planche.png` });
  await p.locator(".et-chez-planche").click();
  await p.waitForSelector(".et-mienne .et-meuble", { timeout: 15000 });
  ok((await compte('.et-mienne .et-rayon[data-rayon=aime] .et-img.photo')) === 1 && (await compte('.et-mienne .et-rayon[data-rayon=aime] .et-img.video')) === 1, "« Ce que j'aime » : la photo encadrée, la vignette de la vidéo");
  ok(await attendre(() => [...document.querySelectorAll(".et-mienne .et-img")].every((i) => i.complete && i.naturalWidth > 0)), "les images se chargent (adresses signées)");
  await p.screenshot({ path: `${D}/ranger-univers-4-page.png` });
  await p.locator(`.et-mienne [data-objet="${video?.id}"]`).click();
  await p.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
  const fv = await texte(".et-feuille.ouverte .et-fiche");
  ok((await compte(".et-feuille.ouverte .et-img.grande")) === 1 && (await p.locator(".et-feuille.ouverte .et-ecouter").getAttribute("href")) === "https://www.youtube.com/watch?v=essai" && fv.includes("▶ La regarder") && fv.includes("📨 Envoyé par toi dans une conversation") && fv.includes("une vidéo ·") && !fv.includes("idée de cadeau"), `la fiche de la vidéo : « ${fv} »`);
  await p.screenshot({ path: `${D}/ranger-univers-5-fiche.png` });
  await p.keyboard.press("Escape");
  await attendre(() => !document.querySelector(".et-feuille.ouverte"));
  await p.locator(`.et-mienne [data-objet="${photo?.id}"]`).click();
  await p.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
  await p.locator(".et-feuille.ouverte .et-bouton", { hasText: "Montrer à mes visiteurs" }).click();
  ok(await attendre(() => document.querySelector(".et-mienne .et-info")?.textContent?.includes("👀 Le lac ce matin : tes visiteurs le voient maintenant")), "« 👀 Montrer à mes visiteurs » : la photo");
  ok((await debordement()) <= 0, "rien ne déborde");

  // ═══ 🚪 LÉA, EN VISITE CHEZ SAM ═══
  const ctxL = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctxL.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: ALLUME }]);
  const l = await ctxL.newPage();
  l.on("pageerror", (e) => erreurs.push(String(e)));
  await l.goto(`${ALLUME}/univers/chez/${SAM.cle}`, { waitUntil: "networkidle" });
  ok(await attendre(() => Boolean(document.querySelector(".uv-etagere .uv-img.photo")), null, 20000, l), "chez Sam : sa photo, encadrée, sur son étagère");
  const vit = await texte(".uv-etagere", l);
  ok(vit.includes("Le lac ce matin") && vit.includes("une photo ·") && !vit.includes("morceau") && (await compte(".uv-etagere .uv-img", l)) === 1, `la vidéo, pas montrée, n'y est pas (« ${vit} »)`);
  ok((await debordement(l)) <= 0, "rien ne déborde");
  await l.screenshot({ path: `${D}/ranger-univers-6-visite.png`, fullPage: true });

  // ═══ IL RETIRE LA VIDÉO : SA COPIE S'EN VA ═══
  await p.locator(`.et-mienne [data-objet="${video?.id}"]`).click();
  await p.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
  await p.locator(".et-feuille.ouverte .et-bouton", { hasText: "Retirer de mon étagère" }).click();
  ok(await attendre(() => (document.querySelector(".et-mienne .et-info")?.textContent ?? "").includes("Retiré de ton étagère")), "« Retirer de mon étagère »");
  ok(!(await lire(video?.image?.chemin ?? "x")) && (await lister(`${SAM.id}/univers/objets`)).length === 1, "sa copie s'en va avec elle (la photo reste)");

  ok(!(await p.evaluate(() => /exemple/i.test(document.body.innerText))) && !(await l.evaluate(() => /exemple/i.test(document.body.innerText))), "jamais le mot interdit");
  ok(!erreurs.length, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
} finally {
  await b.close();
  arreter();
}
console.log(echecs ? `\n${echecs} échec(s)` : "\nle rangement dans son univers tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
