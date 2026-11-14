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
//
// 📌 (lot E5 « Je le range ? ») la figurine demande avant de ranger. Sam a aussi dit « faut qu'on se fasse ce resto
// italien ! ». Sam ouvre : leurs figurines lisent l'échange ; chez Sam, sa figurine brandit « 📌 Je le range ? », le 🍝
// dans les mains, « J'ai entendu : le resto italien. On le garde ? », la carte « 📌 TA FIGURINE TE DEMANDE » — et pas
// un mot du permis de Léa (c'est à elle de décider). « ✓ Oui, range-le » : le resto s'envole sur l'étagère. Léa ouvre :
// le resto se pose (Sam l'a gardé), puis SA figurine brandit « 📌 Je le range ? », la 🚗 dans les mains, « J'ai
// entendu : ton permis, jeudi … » ; « ✓ Oui » : la voiture s'envole, « 📌 Noté ! ». Sam rouvre : le permis s'envole chez
// lui. Paul (sans mouvement) : la carte seule, pas de panneau ; son « oui » pose les pivoines sans vol. Zoé dit « Non » :
// « D'accord, j'oublie. », plus rien. Dans « Moi », Léa allume « Ma figurine range sans me demander ».
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
const ZOE = qui(4, "Zoé");
const GENS = [LEA, SAM, PAUL, ZOE];
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
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, PAUL.id, ZOE.id] });
await json(`${PAUL.id}/proches.json`, { ids: [SAM.id] });
await json(`${ZOE.id}/proches.json`, { ids: [SAM.id] });
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
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
await message(SAM, LEA, "Et après, faut qu'on se fasse ce resto italien !", 3);
await message(PAUL, SAM, "Les pivoines, c'est les plus belles fleurs du monde", 3);
await message(ZOE, SAM, "Les pivoines du jardin, je les adore", 3);

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

// ═══ 📌 SAM OUVRE LEUR CONVERSATION : LE RESTO SE DEMANDE ; LE PERMIS, C'EST À LÉA ═══
const sam = await tel(SAM);
await ouvrirAvec(sam, LEA);
let proposes = [];
for (let k = 0; k < 80 && proposes.length < 2; k++) {
  await new Promise((r) => setTimeout(r, 300));
  proposes = ((await lireStock(`fils/${[LEA.id, SAM.id].sort().join("_")}/etagere.json`))?.objets ?? []).filter((o) => o.etat === "propose");
}
const idPermis = proposes.find((o) => o.genre === "date")?.id;
const idResto = proposes.find((o) => o.genre === "promesse")?.id;
ok(idPermis && idResto && proposes.find((o) => o.id === idPermis).demande.a === qui8(LEA.id) && proposes.find((o) => o.id === idResto).demande.a === "deux", "leurs figurines ont lu l'échange : deux questions — le permis à Léa, le resto aux deux");
ok(await attendre(sam, () => document.querySelector(".pr-plein .pv-calque.moi .et-note.question")?.textContent?.includes("📌 Je le range ?") && document.querySelector(".pr-plein .pv-calque.moi .et-tient")?.textContent === "🍝", null, 20000), "chez Sam : SA figurine brandit « 📌 Je le range ? », le 🍝 dans les mains");
ok(await attendre(sam, () => document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent === "J’ai entendu : le resto italien. On le garde ?", null, 6000), "« J’ai entendu : le resto italien. On le garde ? »");
await sam.screenshot({ path: `${D}/etagere-e5-1-question.png` });
const qr = await texte(sam, ".pr-plein .pr-fil li.et-carte-fil.question");
ok(qr.includes("📌 TA FIGURINE TE DEMANDE") && qr.includes("Le resto italien") && qr.includes("« Et après, faut qu'on se fasse ce resto italien ! »") && qr.includes("✓ Oui, range-le") && qr.includes("Non") && !qr.includes("Changer la date") && qr.includes("Sans réponse, elle oublie dans 2 jours · Noté par vos figurines · IA"), `la carte de la question : « ${qr} »`);
ok((await sam.locator(".pr-plein .pr-fil li.et-carte-fil.question").count()) === 1 && !(await sam.evaluate(() => [...document.querySelectorAll(".pr-plein .pr-fil li.et-carte-fil")].some((li) => /permis/i.test(li.textContent)))) && !(await sam.locator(".pr-plein .et-mur").count()), "chez Sam : pas un mot du permis de Léa (c'est à elle de décider), rien sur l'étagère");
ok((await debordement(sam)) <= 0, "la question : rien ne déborde");
await sam.locator(".pr-plein .pr-fil li.et-carte-fil.question .et-petit.or").click();
ok(await attendre(sam, () => !document.querySelector(".pr-plein .pr-fil li.et-carte-fil.question"), null, 6000), "« ✓ Oui, range-le » : la question s'en va");
ok(await attendre(sam, () => document.querySelector(".pr-plein .pv-calque.moi .et-note:not(.question)")?.textContent?.includes("📌 Noté !"), null, 20000), "le resto se range : sa figurine brandit « 📌 Noté ! »");
ok(await attendre(sam, () => document.querySelector(".pr-plein .et-mur small")?.textContent?.includes("Votre étagère · 1") && document.querySelector(".pr-plein .et-mur [data-objet]")?.textContent === "🍝" && !document.querySelector(".et-vol")), "il s'envole et se pose : « 📚 Votre étagère · 1 »");
ok(await attendre(sam, () => document.querySelector(".pr-plein .pr-fil li.et-carte-fil:not(.question)")?.textContent?.includes("📌 NOTÉ SUR VOTRE ÉTAGÈRE")), "la carte devient « 📌 NOTÉ SUR VOTRE ÉTAGÈRE »");
await sam.screenshot({ path: `${D}/etagere-e5-2-range.png` });
// (Sam quitte la conversation : resté dedans, il verrait le permis se poser dès le « oui » de Léa)
await sam.goto("about:blank");

// ═══ 📌 LÉA OUVRE : LE RESTO SE POSE, PUIS SA FIGURINE LUI DEMANDE POUR LE PERMIS ═══
const lea = await tel(LEA);
await ouvrirAvec(lea, SAM);
ok(await attendre(lea, () => document.querySelector(".pr-plein .et-mur [data-objet]")?.textContent === "🍝" && document.querySelector(".pr-plein .pr-fil li.et-carte-fil:not(.question)")?.textContent?.includes("Le resto italien"), null, 30000), "chez Léa : le resto, gardé par Sam, est sur leur étagère");
ok(await attendre(lea, () => document.querySelector(".pr-plein .pv-calque.moi .et-note.question")?.textContent?.includes("📌 Je le range ?") && document.querySelector(".pr-plein .pv-calque.moi .et-tient")?.textContent === "🚗", null, 30000), "puis SA figurine (c'est elle qui l'a dit) brandit « 📌 Je le range ? », la 🚗 dans les mains");
ok(await attendre(lea, (j) => document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent === `J’ai entendu : ton permis, ${j}.`, jeudi.split(" ").slice(0, 2).join(" "), 6000), `« J’ai entendu : ton permis, ${jeudi.split(" ").slice(0, 2).join(" ")}. »`);
await lea.screenshot({ path: `${D}/etagere-e5-3-question-lea.png` });
const ql = await texte(lea, ".pr-plein .pr-fil li.et-carte-fil.question");
ok(ql.includes("📌 TA FIGURINE TE DEMANDE") && ql.includes("Ton permis") && ql.includes(jeudi) && ql.includes("« Jeudi prochain je passe le permis, je stresse trop »") && ql.includes("Toi, le ") && ql.includes("📅 Changer la date") && ql.includes("Sans réponse, elle oublie"), `la carte de Léa : « ${ql} »`);
ok((await debordement(lea)) <= 0, "rien ne déborde");
await lea.locator(".pr-plein .pr-fil li.et-carte-fil.question .et-petit.or").click();
ok(await attendre(lea, () => !document.querySelector(".pr-plein .pr-fil li.et-carte-fil.question"), null, 6000), "« ✓ Oui, range-le »");
ok(await attendre(lea, () => document.querySelector(".pr-plein .pv-calque.moi .et-note:not(.question)")?.textContent?.includes("📌 Noté !"), null, 25000), "la voiture se range : sa figurine brandit « 📌 Noté ! »");
ok(await attendre(lea, () => Boolean(document.querySelector(".et-vol")), null, 6000), "la voiture s'envole vers l'étagère");
ok(await attendre(lea, () => document.querySelector(".pr-plein .et-mur small")?.textContent?.includes("Votre étagère · 2") && !document.querySelector(".et-vol")), "elle se pose : « 📚 Votre étagère · 2 »");
ok(await attendre(lea, () => [...document.querySelectorAll(".pr-plein .pr-fil li.et-carte-fil")].some((li) => li.textContent.includes("Ton permis") && li.textContent.includes("📌 NOTÉ SUR VOTRE ÉTAGÈRE"))), "chez Léa, la carte : « Ton permis »");
await lea.screenshot({ path: `${D}/etagere-e5-4-oui.png` });
await ouvrirAvec(lea, SAM);
await lea.waitForSelector(".pr-plein .pr-fil li.et-carte-fil", { timeout: 15000 });
ok(!(await attendre(lea, () => Boolean(document.querySelector(".pr-plein .et-note") || document.querySelector(".et-vol") || document.querySelector(".pr-plein .pr-fil li.et-carte-fil.question")), null, 6000)), "rouverte : ni question, ni envol, ne se rejouent");

// ═══ SAM ROUVRE : LE PERMIS S'ENVOLE CHEZ LUI ═══
await ouvrirAvec(sam, LEA);
ok(await attendre(sam, () => document.querySelector(".pr-plein .pv-calque.lui .et-note")?.textContent?.includes("📌 Noté !"), null, 30000), "chez Sam : la figurine de Léa brandit « 📌 Noté ! » (Léa a dit oui)");
await sam.screenshot({ path: `${D}/etagere-1-note.png` });
ok(await attendre(sam, () => document.querySelector(".pr-plein .et-mur small")?.textContent?.includes("Votre étagère · 2") && !document.querySelector(".et-vol")), "elle se pose : « 📚 Votre étagère · 2 »");
const carte = plat(await sam.evaluate(() => [...document.querySelectorAll(".pr-plein .pr-fil li.et-carte-fil")].find((li) => li.textContent.includes("permis"))?.innerText ?? ""));
ok(carte.includes("📌 NOTÉ SUR VOTRE ÉTAGÈRE") && carte.includes("Le permis de Léa") && carte.includes(jeudi) && carte.includes("Voir l’étagère") && carte.includes("Retirer") && carte.includes("Noté par vos figurines · IA · visible de Léa et toi"), `la carte : « ${carte} »`);
ok(await attendre(sam, (l) => l.includes(document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent ?? ""), PHRASES_DATE, 8000), "la figurine de Sam dit une phrase (la banque des dates)");
await sam.screenshot({ path: `${D}/etagere-3-pose.png` });
ok((await texte(sam, ".pr-plein .pr-haut .et-pastille")) === "📚 2", "« 📚 2 » dans l'en-tête");
ok((await debordement(sam)) <= 0, "rien ne déborde");

// ═══ LA PAGE « VOTRE ÉTAGÈRE », LA FICHE ═══
await sam.locator(".pr-plein .et-mur").click();
await sam.waitForSelector(".et-page .et-meuble", { timeout: 15000 });
ok((await texte(sam, ".et-page .et-qui")).startsWith("Léa et toi") && (await texte(sam, ".et-page .et-compteurs")).includes("2 souvenirs") && (await texte(sam, ".et-page .et-compteurs")).includes("0 promesse tenue"), "la page : « Léa et toi », 2 souvenirs, 0 promesse tenue");
const rayons = (await sam.locator(".et-page .et-rayon .et-nom-rayon").allInnerTexts()).map(plat);
ok(rayons.join(" · ") === "Nos fiertés · À venir · Ce qu’on aime", `les trois rayons (${rayons.join(" · ")})`);
ok((await texte(sam, '.et-page .et-rayon[data-rayon="avenir"]')).includes("Le permis de Léa") && (await texte(sam, '.et-page .et-rayon[data-rayon="avenir"]')).includes("Le resto italien") && (await texte(sam, '.et-page .et-rayon[data-rayon="fiertes"]')).includes("rien encore"), "« À venir » : le permis de Léa, le resto ; « Nos fiertés » : rien encore");
ok((await texte(sam, ".et-page .et-regles")).includes("demandent avant de les ranger") && (await texte(sam, ".et-page .et-regles")).includes("Rien de sensible (santé, argent, amours)") && (await texte(sam, ".et-page .et-regles")).includes("Les visiteurs de ton univers ne voient pas votre étagère"), "les règles, en clair (elles demandent avant de ranger)");
await sam.screenshot({ path: `${D}/etagere-4-page.png` });
await sam.locator(`.et-page .et-objet-rayon[data-objet="${idPermis}"]`).click();
await sam.waitForSelector(".et-feuille.ouverte .et-fiche", { timeout: 10000 });
const fiche = await texte(sam, ".et-feuille.ouverte .et-fiche");
ok(fiche.includes("« Jeudi prochain je passe le permis, je stresse trop »") && fiche.includes("Dit par Léa ·") && fiche.includes("⏰ Ta figurine te le rappellera le jour venu") && fiche.includes("📅 Changer la date") && fiche.includes("Retirer de l’étagère") && fiche.includes("Noté par vos figurines · IA"), `la fiche : « ${fiche} »`);
await sam.screenshot({ path: `${D}/etagere-5-fiche.png` });
ok((await debordement(sam)) <= 0, "la page et la fiche : rien ne déborde");
await sam.keyboard.press("Escape");
await sam.keyboard.press("Escape");

// ═══ LÉA LE RETIRE ═══
await lea.locator(`.pr-plein .pr-fil li.et-carte-fil[data-objet="${idPermis}"] .et-actions .doux`).click();
ok(await attendre(lea, (id) => document.querySelector(".pr-plein .pr-info")?.textContent?.includes("🚗 Retiré de votre étagère, pour vous deux") && !document.querySelector(`.pr-plein .pr-fil li.et-carte-fil[data-objet="${id}"]`) && document.querySelector(".pr-plein .et-mur small")?.textContent?.includes("Votre étagère · 1"), idPermis), "Léa le retire : « 🚗 Retiré de votre étagère, pour vous deux », plus sa carte, le resto reste");
await ouvrirAvec(sam, LEA);
ok(!(await attendre(sam, (id) => Boolean(document.querySelector(`.pr-plein .pr-fil li.et-carte-fil[data-objet="${id}"]`)), idPermis, 6000)), "chez Sam : il n'y est plus");

// ═══ SANS MOUVEMENT : PAUL, LA CARTE SEULE ; SON « OUI » POSE LES PIVOINES SANS VOLER ═══
const paul = await tel(PAUL, { reducedMotion: "reduce" });
await paul.addInitScript(() => {
  window.__vol = 0;
  window.__panneau = 0;
  new MutationObserver(() => {
    if (document.querySelector(".et-vol")) window.__vol += 1;
    if (document.querySelector(".et-note.question")) window.__panneau += 1;
  }).observe(document, { childList: true, subtree: true });
});
await ouvrirAvec(paul, SAM);
ok(await attendre(paul, () => document.querySelector(".pr-plein .pr-fil li.et-carte-fil.question")?.textContent?.includes("Tes pivoines"), null, 30000), "chez Paul : la question, « Tes pivoines »");
await new Promise((r) => setTimeout(r, 2500));
ok((await paul.evaluate(() => window.__panneau)) === 0, "sans mouvement : pas de panneau, la carte seule");
await paul.locator(".pr-plein .pr-fil li.et-carte-fil.question .et-petit.or").click();
ok(await attendre(paul, () => document.querySelector(".pr-plein .pr-fil li.et-carte-fil:not(.question)")?.textContent?.includes("Tes pivoines"), null, 20000), "son « oui » : « Tes pivoines » sur leur étagère");
ok((await paul.evaluate(() => window.__vol)) === 0, "sans mouvement : pas de vol, l'objet est déjà posé");

// ═══ ZOÉ DIT « NON » ═══
const zoe = await tel(ZOE);
await ouvrirAvec(zoe, SAM);
ok(await attendre(zoe, () => document.querySelector(".pr-plein .pr-fil li.et-carte-fil.question")?.textContent?.includes("Tes pivoines"), null, 30000), "chez Zoé : « Tes pivoines » ?");
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pv-calque.moi .et-note.question")), null, 15000), "sa figurine brandit le panneau");
await zoe.locator(".pr-plein .pr-fil li.et-carte-fil.question .et-petit.clair").first().click();
ok(await attendre(zoe, () => document.querySelector(".pr-plein .pv-calque.moi .et-bulle")?.textContent === "D’accord, j’oublie." && !document.querySelector(".pr-plein .pr-fil li.et-carte-fil.question"), null, 8000), "« Non » : « D’accord, j’oublie. », la question s'en va");
await zoe.screenshot({ path: `${D}/etagere-e5-5-non.png` });
const fzs = await lireStock(`fils/${[ZOE.id, SAM.id].sort().join("_")}/etagere.json`);
ok(fzs?.objets?.length === 1 && fzs.objets[0].etat === "retire" && fzs.objets[0].raison === "non" && !(await zoe.locator(".pr-plein .et-mur").count()), "rien n'est rangé : une pierre tombale « non »");
await ouvrirAvec(zoe, SAM);
ok(!(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pr-fil li.et-carte-fil")), null, 5000)), "rouverte : plus rien");

// ═══ ⚙️ DANS « MOI » : « MA FIGURINE RANGE SANS ME DEMANDER » ═══
await lea.goto(`${BASE}/collection?v=${Date.now()}#personnage`, { waitUntil: "networkidle" });
await fermerPablito(lea, "#o-personnage");
ok(await attendre(lea, () => document.querySelector("#range-seul")?.textContent?.includes("Ma figurine range sans me demander") && document.querySelector("#range-seul button")?.getAttribute("aria-checked") === "false", null, 20000), "dans « Moi » : « Ma figurine range sans me demander », éteint d'office");
await lea.locator("#range-seul button").click();
let reglage = null;
for (let k = 0; k < 30 && reglage?.rangeSeul !== true; k++) {
  await new Promise((r) => setTimeout(r, 200));
  reglage = await lireStock(`${LEA.id}/reglages.json`);
}
ok(reglage?.rangeSeul === true && (await lea.locator("#range-seul button").getAttribute("aria-checked")) === "true", "Léa l'allume");
await lea.locator("#range-seul").scrollIntoViewIfNeeded();
await lea.screenshot({ path: `${D}/etagere-e5-6-reglage.png` });

// ═══ PARTOUT ═══
for (const [nom, p] of [["Sam", sam], ["Léa", lea], ["Paul", paul], ["Zoé", zoe]]) {
  ok(!(await p.evaluate(() => /exemple/i.test(document.body.innerText))), `${nom} : jamais le mot interdit`);
  ok(!p.err.length, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err.join(" | ")})` : ""}`);
}
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nl'étagère tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
