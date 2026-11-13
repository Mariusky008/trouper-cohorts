// 📚 L'ÉTAGÈRE, LOT E2 « PLUS TARD », DANS LE NAVIGATEUR — `app/collection/etagere.tsx`, sur « Chez moi » (une seconde
// app, l'interrupteur « Univers pour tous » allumé : `../seconde-app.mjs`), contre le faux Supabase, jamais la vraie base.
// Le scénario de la maquette (`docs/univers/maquettes/etagere.html`, « Le matin », « La promesse ») :
//
// Le matin, sur « Chez moi » : sa figurine le rappelle à Sam — « 📌 DE VOTRE ÉTAGÈRE, LÉA ET TOI », « Aujourd'hui, c'est
// le permis de Léa 🚗 Un petit mot avant le départ ? », « 🎭 Un mème », « 🎙️ Un vocal » ; la ligne de Léa dit « 📌
// Aujourd'hui : son permis 🚗 » ; « 🎭 Un mème » ouvre le studio avec « Tu vas gérer 🚗 » écrit. Le permis réussi : en
// ouvrant leur conversation, des confettis, la figurine de Sam : « Léa, c'est réussi ! 🏆 Je range ça tout en haut » ;
// la carte « 🏆 RANGÉ EN HAUT DE VOTRE ÉTAGÈRE », « 🎁 Lui offrir un cadeau » ; le trophée sur l'étagère. Avec Paul : « 🍝
// VOS FIGURINES SE SOUVIENNENT », la phrase de Paul, « Ça fait 3 semaines 👀 », leurs figurines s'en mêlent ; « ✅ C'est
// fait ! » : « ✅ PROMESSE TENUE », « 1 promesse tenue entre vous », la fête. Rien ne déborde, jamais le mot interdit,
// aucune erreur dans la page.
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

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e40${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e2-nav-0000${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const LEA = qui(2, "Léa");
const PAUL = qui(3, "Paul");
const GENS = [SAM, LEA, PAUL];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre", "pied/viens"][i % 3]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre", "pied/viens"][i % 3]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, PAUL.id] });
for (const x of [LEA, PAUL]) await json(`${x.id}/proches.json`, { ids: [SAM.id] });
// (un message de chacun, la veille : leurs conversations existent)
const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rang = 0;
async function message(de, a, texte, ilYaMin) {
  const pair = paire(de, a);
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `ep${String(++rang).padStart(10, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
}
await message(LEA, SAM, "À demain !", 20 * 60);
await message(PAUL, SAM, "Biscotte a encore mangé une chaussette", 20 * 60);
// (Sam les a lus : un message non lu passerait avant l'étagère, sur sa ligne)
await json(`${SAM.id}/fils-lus.json`, { [LEA.id]: Date.now(), [PAUL.id]: Date.now() });
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const objet = (id, de, concerne, x) => ({ id, genre: "date", emoji: "🚗", titre: "Le permis", concerne, citation: "…", de8: qui8(de.id), message: `msg${id}`.padEnd(12, "0").slice(0, 12), messageLe: ilYa(6), le: ilYa(6), etat: "actif", ...x });
// (Sam a déjà vu ces objets se poser : pas d'envol)
await json(`fils/${paire(SAM, LEA)}/etagere.json`, {
  v: 1,
  objets: [objet("permis", LEA, qui8(LEA.id), { sorte: "epreuve", titreToi: "Ton permis", quand: jour, citation: "Jeudi prochain je passe le permis, je stresse trop" })],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(SAM.id)]: ["permis"] },
});
await json(`fils/${paire(SAM, PAUL)}/etagere.json`, {
  v: 1,
  objets: [objet("resto", PAUL, "deux", { genre: "promesse", emoji: "🍝", titre: "Le resto italien", citation: "Faut qu'on se fasse ce resto italien !", le: ilYa(22), messageLe: ilYa(22) })],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(SAM.id)]: ["resto"] },
});

const { base: ALLUME, arreter } = await lancerSecondeApp({ port: 3825 });
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
const texte = async (sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const attendre = (f, arg, ms = 20000) => p.waitForFunction(f, arg, { timeout: ms, polling: 150 }).then(() => true).catch(() => false);
const debordement = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

try {
  // ═══ ☀️ LE MATIN, SUR « CHEZ MOI » ═══
  await p.goto(`${ALLUME}/collection#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p);
  ok(await attendre(() => Boolean(document.querySelector(".et-rappels .et-rappel"))), "le rappel du matin, sur « Chez moi »");
  const rappel = await texte(".et-rappels .et-rappel");
  ok(rappel.includes("📌 DE VOTRE ÉTAGÈRE, LÉA ET TOI") && rappel.includes("Aujourd’hui, c’est le permis de Léa 🚗 Un petit mot avant le départ ?") && rappel.includes("🎭 Un mème") && rappel.includes("🎙️ Un vocal"), `« ${rappel} »`);
  ok(await attendre((c) => document.querySelector(`.cm-liste li[data-cle="${c}"]`)?.textContent?.includes("📌 Aujourd’hui : son permis 🚗"), LEA.cle), "la ligne de Léa : « 📌 Aujourd'hui : son permis 🚗 »");
  ok(await attendre((c) => document.querySelector(`.cm-liste li[data-cle="${c}"]`)?.textContent?.includes("🍝 Le resto italien : promis il y a 3 semaines"), PAUL.cle), "la ligne de Paul : « 🍝 Le resto italien : promis il y a 3 semaines »");
  ok((await debordement()) <= 0, "rien ne déborde");
  await p.screenshot({ path: `${D}/etagere-e2-1-matin.png` });
  await p.locator(".et-rappels .et-petit", { hasText: "Un mème" }).click();
  ok(await attendre(() => location.hash === "#figurine" && [...document.querySelectorAll("#o-figurine textarea, #o-figurine input[type=text]")].some((x) => x.value.includes("Tu vas gérer 🚗"))), "« 🎭 Un mème » : le studio s'ouvre, « Tu vas gérer 🚗 » écrit");

  // ═══ 🏆 LE PERMIS RÉUSSI ═══
  const r = await fetch(`${ALLUME}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}` }, body: JSON.stringify({ action: "reussi", avec: SAM.cle, id: "permis" }) });
  ok(r.status === 200, "Léa : « 🏆 C'est réussi »");
  await p.goto(`${ALLUME}/collection#proches`, { waitUntil: "networkidle" });
  await p.locator(`.cm-liste li[data-cle="${LEA.cle}"] .cm-ligne`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  ok(await attendre(() => document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent === "Léa, c’est réussi ! 🏆 Je range ça tout en haut"), "la fête : la figurine de Sam, « Léa, c'est réussi ! 🏆 Je range ça tout en haut »");
  await p.screenshot({ path: `${D}/etagere-e2-2-fierte.png` });
  const fierte = await texte(".pr-plein .pr-fil li.et-carte-fil.trophee");
  ok(fierte.includes("🏆 RANGÉ EN HAUT DE VOTRE ÉTAGÈRE") && fierte.includes("Le permis de Léa") && fierte.includes("réussi le") && fierte.includes("🎁 Lui offrir un cadeau") && fierte.includes("Voir l’étagère"), `la carte : « ${fierte} »`);
  ok((await texte(".pr-plein .et-mur .et-rang")).includes("🏆"), "le trophée, sur l'étagère");
  await p.locator(".pr-plein .pr-retour").first().click();

  // ═══ 🍝 LA PROMESSE DE PAUL ═══
  await p.locator(`.cm-liste li[data-cle="${PAUL.cle}"] .cm-ligne`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  ok(await attendre(() => Boolean(document.querySelector(".pr-plein .pr-fil li.et-carte-fil[data-carte^='r21-']"))), "la relance, dans le fil");
  const relance = await texte(".pr-plein .pr-fil li.et-carte-fil[data-carte^='r21-']");
  ok(relance.includes("🍝 VOS FIGURINES SE SOUVIENNENT") && relance.includes("« Faut qu'on se fasse ce resto italien ! »") && relance.includes("Paul, le ") && relance.includes("Ça fait 3 semaines 👀") && relance.includes("🪧 Ce soir ?") && relance.includes("✅ C’est fait !"), `« ${relance} »`);
  ok(await attendre(() => /3 semaines/.test(document.querySelector(".pr-plein .pv-calque.lui .et-bulle")?.textContent ?? "")), "la figurine de Paul s'en mêle (« 3 semaines… »)");
  ok(await attendre(() => Boolean(document.querySelector(".pr-plein .pv-calque.moi .et-bulle")), null, 8000), "puis celle de Sam");
  await p.screenshot({ path: `${D}/etagere-e2-3-relance.png` });
  await p.locator(".pr-plein .pr-fil li.et-carte-fil[data-carte^='r21-'] .et-petit.or").click();
  ok(await attendre(() => document.querySelector(".pr-plein .pr-info")?.textContent?.includes("✅ Le resto italien : promesse tenue !")), "« ✅ C'est fait ! » : « ✅ Le resto italien : promesse tenue ! »");
  ok(await attendre(() => document.querySelector(".pr-plein .pr-fil li.et-carte-fil.trophee")?.textContent?.includes("1 promesse tenue entre vous")), "« ✅ PROMESSE TENUE », « 1 promesse tenue entre vous »");
  ok(await attendre(() => document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent === "1 promesse tenue ! On est des gens fiables 😎"), "la fête : « 1 promesse tenue ! On est des gens fiables 😎 »");
  ok(!(await texte(".pr-plein .pr-fil li.et-carte-fil[data-carte^='r21-']")).includes("🪧 Ce soir ?") && (await texte(".pr-plein .pr-fil li.et-carte-fil[data-carte^='r21-']")).includes("✅ Promesse tenue"), "la relance : « ✅ Promesse tenue », plus de bouton");
  await p.screenshot({ path: `${D}/etagere-e2-4-tenue.png` });
  ok((await debordement()) <= 0, "rien ne déborde");
  ok(!(await p.evaluate(() => /exemple/i.test(document.body.innerText))), "jamais le mot interdit");
  ok(!erreurs.length, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
} finally {
  await b.close();
  arreter();
}
console.log(echecs ? `\n${echecs} échec(s)` : "\nl'étagère, plus tard, tient dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
