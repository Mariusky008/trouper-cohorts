// 📚 L'ÉTAGÈRE (lot E1 « Noté ! ») — `lib/direct/etagere.ts`, `etagere-serveur.ts`, `app/collection/etagere.tsx`,
// contre le faux Supabase et le faux modèle, jamais la vraie base. Le scénario de la maquette
// (`docs/univers/maquettes/etagere.html`) :
//
// Léa vient de dire à Sam « Jeudi prochain je passe le permis, je stresse trop » ; Sam lui a répondu. Sam ouvre leur
// conversation : leurs figurines lisent l'échange ; la figurine de Léa brandit « 📌 Noté ! », la voiture vole jusqu'à
// l'étagère au mur, « 📚 Votre étagère · 1 », la carte « 📌 NOTÉ SUR VOTRE ÉTAGÈRE » (« Le permis de Léa », le jeudi
// qui suit) apparaît dans le fil, la figurine de Sam dit une phrase. « 📚 1 » dans l'en-tête. Rouverte : l'envol ne se
// rejoue pas. Léa ouvre la sienne : c'est SA figurine qui brandit « 📌 Noté ! », et elle lit « Ton permis ». La page
// de Sam : « Léa et toi », un souvenir, le rayon « À venir », les règles ; la fiche : la phrase exacte, « Dit par Léa »,
// « ⏰ Ta figurine te le rappellera… », « 📅 Changer la date ». Léa le retire depuis sa carte : « 🚗 Retiré de votre
// étagère, pour vous deux » ; chez Sam, il n'y est plus. Paul, qui préfère sans mouvement : les pivoines se posent
// sans voler. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
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
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e20${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e1-nav-0000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const PAUL = qui(3, "Paul");
const GENS = [LEA, SAM, PAUL];
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
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, PAUL.id] });
await json(`${PAUL.id}/proches.json`, { ids: [SAM.id] });
const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rang = 0;
async function message(de, a, texte, ilYaMin) {
  const pair = [de.id, a.id].sort().join("_");
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `en${String(++rang).padStart(10, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
}
await message(SAM, LEA, "Alors, elle commence comment ta semaine ?", 5);
await message(LEA, SAM, "Jeudi prochain je passe le permis, je stresse trop", 4);
await message(SAM, LEA, "Tu vas gérer, je croise tout ce que j'ai", 3);
await message(PAUL, SAM, "Les pivoines, c'est les plus belles fleurs du monde", 3);

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (q, o = {}) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ...o });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const attendre = (p, f, arg, ms = 20000) => p.waitForFunction(f, arg, { timeout: ms, polling: 150 }).then(() => true).catch(() => false);
async function ouvrirAvec(p, avec) {
  await p.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`, { timeout: 60000 });
  await p.locator(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  await p.waitForSelector(".pr-plein .pv-calque.lui", { state: "attached", timeout: 15000 });
}
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const jeudi = (() => {
  const d = new Date(`${jour}T12:00:00Z`);
  const k = (4 - d.getUTCDay() + 7) % 7 || 7;
  const j = new Date(d.getTime() + k * 86_400_000);
  return `${JOURS[j.getUTCDay()]} ${j.getUTCDate() === 1 ? "1er" : j.getUTCDate()} ${MOIS[j.getUTCMonth()]}`;
})();
const PHRASES_DATE = ["C’est noté 📌 On y pensera ce jour-là", "Je retiens la date, promis 📅", "Ce jour-là, on envoie de la chance 🍀"];

// ═══ 📌 SAM OUVRE LEUR CONVERSATION : LE PERMIS SE NOTE, ET S'ENVOLE ═══
const sam = await tel(SAM);
await ouvrirAvec(sam, LEA);
ok(await attendre(sam, () => document.querySelector(".pr-plein .pv-calque.lui .et-note")?.textContent?.includes("📌 Noté !"), null, 30000), "leurs figurines ont lu l'échange : celle de Léa brandit « 📌 Noté ! »");
await sam.screenshot({ path: `${D}/etagere-1-note.png` });
ok(await attendre(sam, () => Boolean(document.querySelector(".pr-plein .et-vol")), null, 6000), "la voiture s'envole vers l'étagère");
await sam.screenshot({ path: `${D}/etagere-2-envol.png` });
ok(await attendre(sam, () => document.querySelector(".pr-plein .et-mur small")?.textContent?.includes("Votre étagère · 1") && document.querySelector(".pr-plein .et-mur [data-objet]")?.textContent === "🚗" && !document.querySelector(".pr-plein .et-vol")), "elle se pose : « 📚 Votre étagère · 1 »");
ok(await attendre(sam, () => Boolean(document.querySelector(".pr-plein .pr-fil li.et-carte-fil"))), "la carte apparaît dans le fil");
const carte = await texte(sam, ".pr-plein .pr-fil li.et-carte-fil");
ok(carte.includes("📌 NOTÉ SUR VOTRE ÉTAGÈRE") && carte.includes("Le permis de Léa") && carte.includes(jeudi) && carte.includes("Voir l’étagère") && carte.includes("Retirer") && carte.includes("Noté par vos figurines · IA · visible de Léa et toi"), `la carte : « ${carte} »`);
ok(await attendre(sam, (l) => l.includes(document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent ?? ""), PHRASES_DATE, 6000), "la figurine de Sam dit une phrase (la banque des dates)");
await sam.screenshot({ path: `${D}/etagere-3-pose.png` });
ok((await texte(sam, ".pr-plein .pr-haut .et-pastille")) === "📚 1", "« 📚 1 » dans l'en-tête");
ok((await debordement(sam)) <= 0, "rien ne déborde");

// ═══ ROUVERTE : PAS DE DEUXIÈME ENVOL ═══
await ouvrirAvec(sam, LEA);
await sam.waitForSelector(".pr-plein .pr-fil li.et-carte-fil", { timeout: 15000 });
ok(!(await attendre(sam, () => Boolean(document.querySelector(".pr-plein .et-note") || document.querySelector(".pr-plein .et-vol")), null, 6000)) && (await sam.locator(".pr-plein .et-mur [data-objet]").count()) === 1, "rouverte : la voiture est déjà sur l'étagère, l'envol ne se rejoue pas");

// ═══ CHEZ LÉA : SA FIGURINE BRANDIT « 📌 NOTÉ ! », « TON PERMIS » ═══
const lea = await tel(LEA);
await ouvrirAvec(lea, SAM);
ok(await attendre(lea, () => document.querySelector(".pr-plein .pv-calque.moi .et-note")?.textContent?.includes("📌 Noté !"), null, 15000), "chez Léa : c'est SA figurine qui brandit « 📌 Noté ! » (c'est elle qui l'a dit)");
ok(await attendre(lea, () => document.querySelector(".pr-plein .pr-fil li.et-carte-fil")?.textContent?.includes("Ton permis")), "chez Léa, la carte : « Ton permis »");

// ═══ LA PAGE « VOTRE ÉTAGÈRE », LA FICHE ═══
await sam.locator(".pr-plein .et-mur").click();
await sam.waitForSelector(".et-page .et-meuble", { timeout: 15000 });
ok((await texte(sam, ".et-page .et-qui")).startsWith("Léa et toi") && (await texte(sam, ".et-page .et-compteurs")).includes("1 souvenir") && (await texte(sam, ".et-page .et-compteurs")).includes("0 promesse tenue"), "la page : « Léa et toi », 1 souvenir, 0 promesse tenue");
const rayons = (await sam.locator(".et-page .et-rayon .et-nom-rayon").allInnerTexts()).map(plat);
ok(rayons.join(" · ") === "Nos fiertés · À venir · Ce qu’on aime", `les trois rayons (${rayons.join(" · ")})`);
ok((await texte(sam, '.et-page .et-rayon[data-rayon="avenir"]')).includes("Le permis de Léa") && (await texte(sam, '.et-page .et-rayon[data-rayon="fiertes"]')).includes("rien encore"), "« À venir » : le permis de Léa ; « Nos fiertés » : rien encore");
ok((await texte(sam, ".et-page .et-regles")).includes("Rien de sensible (santé, argent, amours)") && (await texte(sam, ".et-page .et-regles")).includes("Les visiteurs de ton univers ne voient pas votre étagère"), "les règles, en clair");
await sam.screenshot({ path: `${D}/etagere-4-page.png` });
await sam.locator('.et-page .et-objet-rayon[data-objet]').first().click();
await sam.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
const fiche = await texte(sam, ".et-feuille.ouverte .et-fiche");
ok(fiche.includes("« Jeudi prochain je passe le permis, je stresse trop »") && fiche.includes("Dit par Léa ·") && fiche.includes("⏰ Ta figurine te le rappellera le jour venu") && fiche.includes("📅 Changer la date") && fiche.includes("Retirer de l’étagère") && fiche.includes("Noté par vos figurines · IA"), `la fiche : « ${fiche} »`);
await sam.screenshot({ path: `${D}/etagere-5-fiche.png` });
ok((await debordement(sam)) <= 0, "la page et la fiche : rien ne déborde");
await sam.keyboard.press("Escape");
await sam.keyboard.press("Escape");

// ═══ LÉA LE RETIRE ═══
await lea.locator(".pr-plein .pr-fil li.et-carte-fil .et-actions .doux").click();
ok(await attendre(lea, () => document.querySelector(".pr-plein .pr-info")?.textContent?.includes("🚗 Retiré de votre étagère, pour vous deux") && !document.querySelector(".pr-plein .pr-fil li.et-carte-fil") && !document.querySelector(".pr-plein .et-mur")), "Léa le retire : « 🚗 Retiré de votre étagère, pour vous deux », plus de carte, plus d'étagère");
await ouvrirAvec(sam, LEA);
ok(!(await attendre(sam, () => Boolean(document.querySelector(".pr-plein .pr-fil li.et-carte-fil")), null, 6000)), "chez Sam : il n'y est plus");

// ═══ SANS MOUVEMENT : LES PIVOINES SE POSENT SANS VOLER ═══
const paul = await tel(PAUL, { reducedMotion: "reduce" });
await paul.addInitScript(() => {
  window.__vol = 0;
  new MutationObserver(() => document.querySelector(".et-vol") && (window.__vol += 1)).observe(document, { childList: true, subtree: true });
});
await ouvrirAvec(paul, SAM);
ok(await attendre(paul, () => document.querySelector(".pr-plein .pr-fil li.et-carte-fil")?.textContent?.includes("Tes pivoines"), null, 30000), "chez Paul : « Tes pivoines »");
ok((await paul.evaluate(() => window.__vol)) === 0, "sans mouvement : pas de vol, l'objet est déjà posé");

// ═══ PARTOUT ═══
for (const [nom, p] of [["Sam", sam], ["Léa", lea], ["Paul", paul]]) {
  ok(!(await p.evaluate(() => /exemple/i.test(document.body.innerText))), `${nom} : jamais le mot interdit`);
  ok(!p.err.length, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err.join(" | ")})` : ""}`);
}
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nl'étagère tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
