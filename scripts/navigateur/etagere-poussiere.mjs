// 📚 L'ÉTAGÈRE, LOT E3 « LA POUSSIÈRE ET LES IDÉES », DANS LE NAVIGATEUR — `app/collection/etagere.tsx`, contre le faux
// Supabase, jamais la vraie base. Le scénario de la maquette (`docs/univers/maquettes/etagere.html`, « La poussière ») :
//
// Sam et Nina ne se sont rien dit depuis douze jours. Sam ouvre leur conversation : la scène est grise, deux toiles
// d'araignée, leurs figurines dorment ; dans le fil, rien que pour lui, de sa figurine : « 🕸️ RIEN QUE POUR TOI, DE TA
// FIGURINE — 12 jours sans un mot… Nina avait son concert le 1er … 🎧 », « 🎙️ Lui demander comment c'était » (le micro
// s'ouvre). La page : « 🕸️ Elle prend la poussière · 12 jours sans un mot », le meuble terne ; « 🎭 Un mème avec votre
// blague » : le studio s'ouvre avec « Le canard de Biarritz 🦆 ». Sam lui écrit : la scène reprend ses couleurs, les
// figurines se réveillent, « ✨ L'ÉTAGÈRE SE RALLUME — Nina et toi, c'est reparti. ». Rien ne déborde, jamais le mot
// interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const paire = (a, b) => [a.id, b.id].sort().join("_");

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e60${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e3-nav-0000${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const NINA = qui(2, "Nina");
const GENS = [SAM, NINA];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre"][i % 2]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre"][i % 2]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${SAM.id}/proches.json`, { ids: [NINA.id] });
await json(`${NINA.id}/proches.json`, { ids: [SAM.id] });
const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rang = 0;
async function message(de, a, texte, ilYaJours) {
  const pair = paire(de, a);
  const ts = Date.now() - ilYaJours * 86_400_000;
  const id = `eo${String(++rang).padStart(10, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
}
for (let k = 0; k < 8; k++) await message(k % 2 ? SAM : NINA, k % 2 ? NINA : SAM, ["Samedi c'est le concert, j'ai trop hâte", "Trop bien ! Tu me raconteras", "Promis", "Bonne nuit", "Coucou", "Ça va ?", "Oui et toi ?", "Super"][k], 19 - k);
await json(`${SAM.id}/fils-lus.json`, { [NINA.id]: Date.now() });
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const moisDernier = (() => {
  const d = new Date(`${jour}T12:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1, 12)).toISOString().slice(0, 10);
})();
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const objet = (id, concerne, x) => ({ id, genre: "date", emoji: "🎧", titre: "Le concert", concerne, citation: "…", de8: qui8(NINA.id), message: `msg${id}`.padEnd(12, "0").slice(0, 12), le: ilYa(30), messageLe: ilYa(30), etat: "actif", ...x });
await json(`fils/${paire(SAM, NINA)}/etagere.json`, {
  v: 1,
  objets: [
    objet("concert", qui8(NINA.id), { sorte: "evenement", titreToi: "Ton concert", quand: moisDernier, etat: "passe" }),
    objet("fraisier", qui8(NINA.id), { genre: "gout", emoji: "🍰", titre: "Le fraisier de sa grand-mère", nuance: "aime" }),
    objet("canard", "deux", { genre: "blague", emoji: "🦆", titre: "Le canard de Biarritz", citation: "Le canard qui nous a volé nos chouquettes" }),
  ],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(SAM.id)]: ["concert", "fraisier", "canard"] },
});

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: "clikme_habitant", value: SAM.jeton, url: BASE }]);
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const attendre = (f, arg, ms = 20000) => p.waitForFunction(f, arg, { timeout: ms, polling: 150 }).then(() => true).catch(() => false);
const debordement = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
async function ouvrir() {
  await p.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(`#o-proches .pr-carte[data-cle="${NINA.cle}"] .pr-mini`, { timeout: 60000 });
  await p.locator(`#o-proches .pr-carte[data-cle="${NINA.cle}"] .pr-mini`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
}

// ═══ 🕸️ LA POUSSIÈRE ═══
await ouvrir();
ok(await attendre(() => document.querySelector(".pr-plein .pr-scene")?.classList.contains("et-poussiere") && document.querySelectorAll(".pr-plein .et-toile").length === 2), "la scène est grise, deux toiles d'araignée");
ok(await attendre(() => [...document.querySelectorAll(".pr-plein .pr-scene [data-posture]")].every((x) => x.getAttribute("data-posture") === "dort")), "leurs figurines dorment");
const carte = await texte(".pr-plein .pr-fil li.et-carte-fil.prive");
ok(carte.includes("🕸️ RIEN QUE POUR TOI, DE TA FIGURINE") && carte.includes("12 jours sans un mot… Votre étagère prend la poussière. Nina avait son concert le 1er") && carte.includes("🎧") && carte.includes("🎙️ Lui demander comment c’était"), `rien que pour lui : « ${carte} »`);
ok((await debordement()) <= 0, "rien ne déborde");
await p.screenshot({ path: `${D}/etagere-e3-1-poussiere.png` });
await p.locator(".pr-plein .pr-fil li.et-carte-fil.prive .et-petit").click();
ok(await attendre(() => Boolean(document.querySelector(".pr-plein.pr-parler"))), "« 🎙️ Lui demander comment c'était » : le micro s'ouvre");
await p.locator(".pr-plein.pr-parler .pr-retour").click();

// ═══ LA PAGE, LA BLAGUE ═══
await p.locator(".pr-plein .et-mur").click();
await p.waitForSelector(".et-page .et-meuble", { timeout: 15000 });
ok((await texte(".et-page .et-etat")) === "🕸️ Elle prend la poussière · 12 jours sans un mot" && (await p.locator(".et-page .et-meuble.poussiere").count()) === 1, "la page : « 🕸️ Elle prend la poussière · 12 jours sans un mot », le meuble terne");
ok((await texte(".et-page .et-compteurs")).includes("🦆") && (await texte(".et-page .et-compteurs")).includes("votre blague"), "les compteurs : 🦆, votre blague");
await p.screenshot({ path: `${D}/etagere-e3-2-page.png` });
await p.locator(".et-page .et-bouton", { hasText: "Un mème avec votre blague" }).click();
ok(await attendre(() => location.hash === "#figurine" && [...document.querySelectorAll("#o-figurine textarea")].some((x) => x.value.includes("Le canard de Biarritz 🦆"))), "« 🎭 Un mème avec votre blague » : le studio, « Le canard de Biarritz 🦆 » écrit");

// ═══ ✨ SAM LUI ÉCRIT : L'ÉTAGÈRE SE RALLUME ═══
const SON = `data:audio/mpeg;base64,${VOIX.toString("base64")}`;
const env = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "envoyer", cle: NINA.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Alors, ce concert ?", tete: null }] }) });
ok(env.status === 200, "Sam écrit à Nina");
await ouvrir();
ok(await attendre(() => Boolean(document.querySelector(".pr-plein .pr-fil li.et-carte-fil.trophee")) && !document.querySelector(".pr-plein .pr-scene")?.classList.contains("et-poussiere")), "la scène reprend ses couleurs");
ok((await texte(".pr-plein .pr-fil li.et-carte-fil.trophee")).includes("✨ L’ÉTAGÈRE SE RALLUME") && (await texte(".pr-plein .pr-fil li.et-carte-fil.trophee")).includes("Nina et toi, c’est reparti."), "« ✨ L'ÉTAGÈRE SE RALLUME — Nina et toi, c'est reparti. »");
ok(await attendre(() => ["C’est reparti ✨", "Ah, enfin ! ✨ On s’ennuyait", "Les revoilà ✨"].includes(document.querySelector(".pr-plein .pv-calque.lui .et-bulle")?.textContent ?? "")), "les figurines se réveillent, l'une parle");
ok(!(await p.locator(".pr-plein .pr-fil li.et-carte-fil.prive").count()) && !(await p.locator(".pr-plein .et-toile").count()), "plus de toiles, plus de carte de poussière");
await p.screenshot({ path: `${D}/etagere-e3-3-rallume.png` });
ok((await debordement()) <= 0, "rien ne déborde");
ok(!(await p.evaluate(() => /exemple/i.test(document.body.innerText))), "jamais le mot interdit");
ok(!erreurs.length, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla poussière tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
