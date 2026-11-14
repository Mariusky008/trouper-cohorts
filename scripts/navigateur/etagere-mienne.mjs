// 📚 L'ÉTAGÈRE, LOT E4 « MON ÉTAGÈRE », DANS LE NAVIGATEUR — `app/collection/etagere.tsx` sur « Chez moi » (une seconde
// app, l'interrupteur « Univers pour tous » allumé : `../seconde-app.mjs`), et la visite (`app/univers/chez/[cle]`),
// contre le faux Supabase, jamais la vraie base.
//
// Sur « Chez moi », sous la fenêtre de son univers : la planche de Sam (« 📚 Mon étagère · 2 », ses pivoines et le resto
// promis, notés avec Léa). « ＋ » : il dépose « Mon concert » (une date, dans trois jours, 🎤), montré à ses visiteurs.
// Sa page : « À venir » (« Ton concert », 👀), « Ce que j'aime » (« Tes pivoines ») ; la fiche des pivoines : « Noté sur
// votre étagère, Léa et toi · IA », « 👀 Montrer à mes visiteurs » ; celle du resto : « il reste entre Léa et toi ».
// Léa, en visite chez Sam : « 📚 L'étagère de Sam » — le concert, « Les pivoines · Sam adore ». Puis Léa, dans leur
// conversation, dépose sur leur étagère « Ton gâteau au chocolat », pour Sam : chez lui, la carte « ✋ DÉPOSÉ SUR VOTRE
// ÉTAGÈRE », et sa planche passe à 4. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { D, F, fermerPablito, lancer } from "./commun.mjs";
import { lancerSecondeApp } from "../seconde-app.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const paire = (a, b) => [a.id, b.id].sort().join("_");

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e80${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e4-nav-0000${String(n).padStart(2, "0")}`, prenom });
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

// (un message de Léa, la veille : leur conversation existe ; Sam l'a lu)
const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
const ts = Date.now() - 20 * 3_600_000;
await deposer(`fils/${paire(SAM, LEA)}/s/em0000000001.mp3`, VOIX, "audio/mpeg");
await json(`fils/${paire(SAM, LEA)}/m/${String(ts).padStart(13, "0")}-${qui8(LEA.id)}-em0000000001.json`, { id: "em0000000001", de: LEA.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${paire(SAM, LEA)}/s/em0000000001.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte: "À demain !", tete: null }] });
await json(`${SAM.id}/fils-lus.json`, { [LEA.id]: Date.now() });
await json(`${LEA.id}/fils-lus.json`, { [SAM.id]: Date.now() });
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const objet = (id, de, concerne, x) => ({ id, genre: "gout", emoji: "💐", titre: "Les pivoines", concerne, citation: "…", de8: qui8(de.id), message: `msg${id}`.padEnd(12, "0").slice(0, 12), messageLe: ilYa(6), le: ilYa(6), etat: "actif", ...x });
await json(`fils/${paire(SAM, LEA)}/etagere.json`, {
  v: 1,
  objets: [
    objet("pivoines", LEA, qui8(SAM.id), { nuance: "aime", titreToi: "Tes pivoines", citation: "Toi qui adores les pivoines" }),
    objet("resto", SAM, "deux", { genre: "promesse", emoji: "🍝", titre: "Le resto italien", citation: "Faut qu'on se fasse ce resto italien !" }),
  ],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(SAM.id)]: ["pivoines", "resto"], [qui8(LEA.id)]: ["pivoines", "resto"] },
});
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const dansJours = (n) => new Date(Date.parse(`${jour}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

const { base: ALLUME, arreter } = await lancerSecondeApp({ port: 3826 });
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
const attendre = (f, arg, ms = 20000, page = p) => page.waitForFunction(f, arg, { timeout: ms, polling: 150 }).then(() => true).catch(() => false);
const debordement = (page = p) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

try {
  // ═══ 📚 LA PLANCHE, SUR « CHEZ MOI » ═══
  await p.goto(`${ALLUME}/collection#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p);
  ok(await attendre(() => document.querySelector(".et-chez")?.getAttribute("data-n") === "2"), "sous la fenêtre de son univers : sa planche");
  const planche = await texte(".et-chez-planche");
  ok(planche.includes("📚 Mon étagère · 2") && planche.includes("Rien que pour toi") && planche.includes("💐") && planche.includes("🍝"), `« ${planche} »`);
  ok((await debordement()) <= 0, "rien ne déborde");
  await p.screenshot({ path: `${D}/etagere-e4-1-planche.png` });

  // ═══ ✋ « ＋ » : DÉPOSER « MON CONCERT » ═══
  await p.locator(".et-chez-plus").click();
  await p.waitForSelector(".et-feuille-depot.ouverte", { timeout: 10000 });
  ok(!(await p.locator(".et-feuille-depot.ouverte .et-bouton").isEnabled()), "« Poser sur l'étagère » attend : ce que c'est, son nom");
  await p.locator('.et-feuille-depot.ouverte [data-genre="date"]').click();
  ok((await p.locator(".et-feuille-depot.ouverte [data-sorte]").count()) === 3, "une date : un événement, une épreuve, tous les ans");
  await p.locator(".et-feuille-depot.ouverte input[type=text]").fill("Mon concert");
  await p.locator(".et-feuille-depot.ouverte input[type=date]").fill(dansJours(3));
  await p.locator('.et-feuille-depot.ouverte .et-catalogue button[aria-label="🎤"]').click();
  ok((await texte(".et-feuille-depot.ouverte .et-objet-choisi")) === "🎤", "son objet : 🎤");
  await p.locator(".et-feuille-depot.ouverte .et-coche input").check();
  ok((await debordement()) <= 0, "la feuille ne déborde pas");
  await p.screenshot({ path: `${D}/etagere-e4-2-deposer.png` });
  await p.locator(".et-feuille-depot.ouverte .et-bouton").click();
  ok(await attendre(() => !document.querySelector(".et-feuille-depot.ouverte") && document.querySelector(".et-chez")?.getAttribute("data-n") === "3"), "posé : la feuille se ferme, la planche passe à 3");
  ok((await texte(".et-chez-planche")).includes("1 montré à tes visiteurs") && (await texte(".et-chez-planche .et-rang")).includes("🎤"), "« 1 montré à tes visiteurs », le 🎤 sur la planche");

  // ═══ 🏡 SA PAGE ═══
  await p.locator(".et-chez-planche").click();
  await p.waitForSelector(".et-mienne .et-meuble", { timeout: 15000 });
  ok((await texte(".et-mienne .et-rayon[data-rayon=fiertes] .et-nom-rayon")) === "Mes fiertés" && (await texte(".et-mienne .et-rayon[data-rayon=aime] .et-nom-rayon")) === "Ce que j’aime", "ses rayons : « Mes fiertés », « À venir », « Ce que j'aime »");
  const avenir = await texte(".et-mienne .et-rayon[data-rayon=avenir]");
  ok(avenir.includes("Ton concert") && avenir.includes("👀") && avenir.includes("Le resto italien"), `« À venir » : « Ton concert » (👀, montré), le resto (« ${avenir} »)`);
  ok((await texte(".et-mienne .et-rayon[data-rayon=aime]")).includes("Tes pivoines"), "« Ce que j'aime » : « Tes pivoines »");
  await p.screenshot({ path: `${D}/etagere-e4-3-page.png` });
  await p.locator('.et-mienne [data-objet="pivoines"]').click();
  await p.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
  const fp = await texte(".et-feuille.ouverte .et-fiche");
  ok(fp.includes("« Toi qui adores les pivoines »") && fp.includes("Noté sur votre étagère, Léa et toi · IA") && fp.includes("👀 Montrer à mes visiteurs") && fp.includes("Ne plus le garder chez moi"), `la fiche des pivoines : « ${fp} »`);
  await p.locator(".et-feuille.ouverte .et-bouton", { hasText: "Montrer à mes visiteurs" }).click();
  ok(await attendre(() => document.querySelector(".et-mienne .et-info")?.textContent?.includes("👀 Tes pivoines : tes visiteurs le voient maintenant")), "« 👀 Tes pivoines : tes visiteurs le voient maintenant »");
  ok(await attendre(() => document.querySelector(".et-mienne .et-compteurs")?.textContent?.includes("2montrés aux visiteurs")), "deux montrés aux visiteurs");
  await p.locator('.et-mienne [data-objet="resto"]').click();
  await p.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
  const fr = await texte(".et-feuille.ouverte .et-fiche");
  ok(fr.includes("Il est à vous deux : il reste entre Léa et toi.") && !fr.includes("Montrer à mes visiteurs"), "le resto, à eux deux : il reste entre eux (pas de « Montrer »)");
  await p.keyboard.press("Escape");
  ok(await attendre(() => !document.querySelector(".et-feuille.ouverte") && Boolean(document.querySelector(".et-mienne"))), "Échap : la fiche se ferme, la page reste");
  ok((await p.locator(".et-mienne .et-voir-visiteurs").getAttribute("href")) === `/univers/chez/${SAM.cle}`, "« 👀 Voir ce que voient mes visiteurs »");
  ok((await debordement()) <= 0, "rien ne déborde");
  await p.locator(".et-mienne .et-retour").click();
  ok(await attendre(() => !document.querySelector(".et-mienne")), "← : retour chez moi");

  // ═══ 🚪 LÉA, EN VISITE CHEZ SAM ═══
  const ctxL = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctxL.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: ALLUME }]);
  const l = await ctxL.newPage();
  l.on("pageerror", (e) => erreurs.push(String(e)));
  await l.goto(`${ALLUME}/univers/chez/${SAM.cle}`, { waitUntil: "networkidle" });
  ok(await attendre(() => Boolean(document.querySelector(".uv-etagere")), null, 20000, l), "chez Sam, son étagère");
  const vit = await texte(".uv-etagere", l);
  ok(vit.includes("📚 L’étagère de Sam") && vit.includes("🎤") && vit.includes("Le concert") && vit.includes("Les pivoines") && vit.includes("Sam adore") && !vit.includes("adores") && !vit.includes("Léa") && !vit.includes("resto"), `« ${vit} »`);
  ok((await debordement(l)) <= 0, "rien ne déborde");
  await l.screenshot({ path: `${D}/etagere-e4-4-visite.png`, fullPage: true });

  // ═══ ✋ LÉA DÉPOSE SUR LEUR ÉTAGÈRE, POUR SAM ═══
  await l.goto(`${ALLUME}/collection#proches`, { waitUntil: "networkidle" });
  await fermerPablito(l);
  await l.locator(`.cm-liste li[data-cle="${SAM.cle}"] .cm-ligne`).click();
  await l.waitForSelector(".pr-plein .et-mur", { timeout: 30000 });
  await l.locator(".pr-plein .et-mur").click();
  await l.waitForSelector(".et-page .et-meuble", { timeout: 15000 });
  await l.locator(".et-page .et-deposer").click();
  await l.waitForSelector(".et-feuille-depot.ouverte", { timeout: 10000 });
  ok((await l.locator(".et-feuille-depot.ouverte [data-pour]").allInnerTexts()).join("|") === "Moi|Sam|Nous deux" && !(await l.locator(".et-feuille-depot.ouverte .et-coche").count()), "sur leur étagère : pour qui ? « Moi », « Sam », « Nous deux »");
  await l.locator('.et-feuille-depot.ouverte [data-genre="gout"]').click();
  await l.locator(".et-feuille-depot.ouverte input[type=text]").fill("Ton gâteau au chocolat");
  await l.locator('.et-feuille-depot.ouverte .et-catalogue button[aria-label="🍰"]').click();
  await l.locator('.et-feuille-depot.ouverte [data-pour="lui"]').click();
  await l.locator(".et-feuille-depot.ouverte .et-bouton").click();
  ok(await attendre(() => document.querySelector(".et-page .et-info")?.textContent?.includes("Sam le verra dans votre conversation"), null, 15000, l), "posé : « Sam le verra dans votre conversation »");
  ok(await attendre(() => [...document.querySelectorAll(".et-page .et-etiquette")].some((x) => x.textContent === "Le gâteau au chocolat de Sam"), null, 15000, l), "chez Léa : « Le gâteau au chocolat de Sam »");
  await l.screenshot({ path: `${D}/etagere-e4-5-leur-etagere.png` });

  // ═══ CHEZ SAM : LA CARTE, LA PLANCHE ═══
  await p.goto(`${ALLUME}/collection#proches`, { waitUntil: "networkidle" });
  ok(await attendre(() => document.querySelector(".et-chez")?.getAttribute("data-n") === "4"), "la planche de Sam passe à 4");
  await p.locator(`.cm-liste li[data-cle="${LEA.cle}"] .cm-ligne`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  ok(await attendre(() => [...document.querySelectorAll(".pr-plein .pr-fil li.et-carte-fil")].some((x) => x.textContent.includes("✋ DÉPOSÉ SUR VOTRE ÉTAGÈRE") && x.textContent.includes("Ton gâteau au chocolat") && x.textContent.includes("Déposé par Léa"))), "dans leur conversation : « ✋ DÉPOSÉ SUR VOTRE ÉTAGÈRE », « Ton gâteau au chocolat », « Déposé par Léa »");
  await p.screenshot({ path: `${D}/etagere-e4-6-carte.png` });
  ok((await debordement()) <= 0, "rien ne déborde");
  ok(!(await p.evaluate(() => /exemple/i.test(document.body.innerText))) && !(await l.evaluate(() => /exemple/i.test(document.body.innerText))), "jamais le mot interdit");
  ok(!erreurs.length, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
} finally {
  await b.close();
  arreter();
}
console.log(echecs ? `\n${echecs} échec(s)` : "\nmon étagère tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
