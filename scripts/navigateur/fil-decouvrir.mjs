// 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE », À L'ÉCRAN (le lot F1, 23 novembre 2026 ; `app/collection/fil-decouvrir.tsx`,
// `docs/univers/fil.md`) — sur un iPhone, contre le faux Supabase et le faux YouTube (jamais la vraie base).
//
// Léa ouvre Découvrir : le fil, plein écran. D'abord le salon du foot, en direct (Sam et Hugo dans le gradin, la bulle de
// Sam, la télé) ; le seul mode d'emploi (« Glisse… », « Touche deux fois… ») ; sa figurine au bord. Elle touche deux fois
// l'écran : sa figurine réagit (« 😂 », « Les 2 te voient »), elle s'assoit dans le gradin — et Sam la voit pour de vrai.
// Elle glisse : l'humeur de ses proches (Sam, triste) ; sa figurine a quitté le salon. « Répondre à Sam » : Messages. Puis
// la figurine de Hugo au Petit Bistrot, son mot du jour en grand ; puis le salon de la musique (la radio) ; puis les salons
// sans personne, la cuisine d'abord (sa passion) : « Sois le premier », ce que Zoé y a dit tout à l'heure ; elle touche
// deux fois : « Les suivants te verront », elle s'y assoit pour de vrai. « Tous les salons » : l'ancienne page (sa télé
// du jour) ; « ‹ Le fil » : retour. Le lien d'une vidéo à revoir (`?tele=`) ouvre
// « Tous les salons », comme les anciens liens (`#voeu`…) ; `#jour` (le mème du jour, parti) ouvre « Créer ». Tom, sans
// âge dit : la question d'abord. Rien ne déborde, jamais le mot interdit, aucune erreur.
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `6e6e6e6e-0000-4000-8000-0000006e10${String(n).padStart(2, "0")}`, jeton: `jeton-fil-decouvrir-ecran-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const HUGO = qui(3, "Hugo");
const ZOE = qui(4, "Zoé");
const TOM = qui(5, "Tom");
const GENS = [LEA, SAM, HUGO, ZOE, TOM];
const maintenant = new Date().toISOString();
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const BISTROT = "c-petit-bistrot-fil-ecran";
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000006e01", slug: "petit-bistrot-fil-ecran", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 }]);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/neutre.webp`, assise, "image/png");
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre.webp`, parle: `${x.id}/neutre.webp`, prete_le: maintenant })));
for (const x of [LEA, SAM, HUGO, ZOE]) await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine"], poids: {}, le: maintenant });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, HUGO.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${HUGO.id}/proches.json`, { ids: [LEA.id] });
await json(`${SAM.id}/humeur.json`, { jour, visage: "tristesse", le: maintenant });
await json(`${HUGO.id}/humeur.json`, { jour, visage: "rire", le: maintenant });
await fetch(`${BASE}/api/cron/decouvrir-selection`);

const route = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const SALONS = "/api/direct/salons-ouverts";
await route(SAM, SALONS, { action: "entrer", theme: "foot" });
await route(HUGO, SALONS, { action: "entrer", theme: "foot" });
await route(SAM, SALONS, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Quel but !" });
// (Zoé est passée par le salon de la cuisine, y a dit un mot, et en est partie)
await route(ZOE, SALONS, { action: "entrer", theme: "cuisine" });
await route(ZOE, SALONS, { action: "ecrire", salon: "cuisine-1", sorte: "texte", texte: "Qui a une recette de crêpes ?" });
await route(ZOE, SALONS, { action: "sortir", salon: "cuisine-1" });
await route(ZOE, SALONS, { action: "entrer", theme: "musique" });
const pose = await route(HUGO, "/api/direct/autour", { action: "poser", lieu: BISTROT, mot: "Qui vient prendre un café ?", tete: "humeur", qui: "tous" });
ok(pose.statut === 200, "Sam et Hugo sont au salon du foot, Zoé à celui de la musique ; Hugo a posé sa figurine au Petit Bistrot");

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ouvrir = async (x) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }]);
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  return p;
};
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.first().innerText({ timeout: 8000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const deborde = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
/** la pièce qui remplit l'écran (son `data-k`) */
const courante = (p) =>
  p.evaluate(() => {
    const l = [...document.querySelectorAll("#o-decouvrir [data-k]")];
    const h = window.innerHeight;
    return l.find((el) => Math.abs(el.getBoundingClientRect().top) < h * 0.3)?.getAttribute("data-k") ?? "";
  });
const glisser = async (p) => {
  await p.evaluate(() => document.querySelector("#o-decouvrir .fd-boite").scrollBy({ top: window.innerHeight }));
  await p.waitForTimeout(700);
};

// ═══ LÉA OUVRE DÉCOUVRIR : LE FIL ═══
const lea = await ouvrir(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(lea, "#o-decouvrir");
const foot = lea.locator('#o-decouvrir [data-piece="salon"][data-theme="foot"]');
ok(await attendre(lea, async () => (await foot.count()) === 1, 45000), "Découvrir s'ouvre sur le fil : le salon du foot d'abord");
const lesPieces = await lea.locator("#o-decouvrir [data-piece]").evaluateAll((l) => l.map((x) => x.getAttribute("data-piece") + (x.getAttribute("data-theme") ? `:${x.getAttribute("data-theme")}` : "")));
ok(lesPieces.slice(0, 5).join() === "salon:foot,humeur,autour,salon:musique,salon:cuisine" && lesPieces.length === 14, `les pièces : sa passion en direct, l'humeur de ses proches, Autour, la musique ; puis tous les autres salons, sa passion d'abord (${lesPieces.length})`);
ok((await lea.locator("#o-decouvrir [data-piece][data-vide]").count()) === 10, "… les dix salons sans personne en ce moment");
ok(/2 en direct · ta passion/.test(await texte(foot.locator(".fd-etiquette"))), "« 2 en direct · ta passion »");
ok((await foot.locator(".fd-fig img").count()) === 2 && (await foot.locator(".fd-fig small").allInnerTexts()).sort().join() === "Hugo,Sam", "le gradin : les figurines de Sam et Hugo");
ok(/^👋 (Sam et Hugo|Hugo et Sam) sont là$/.test(await texte(foot.locator("[data-proches-la]"))), "(lot F4) « 👋 Sam et Hugo sont là » : ses proches y sont");
ok((await foot.locator('[data-q] [data-bulle]').allInnerTexts()).includes("Quel but !"), "… la bulle de Sam au-dessus de sa figurine");
ok(/i\.ytimg\.com/.test((await foot.locator("[data-tele] img").getAttribute("src")) ?? ""), "… ce qui passe à la télé du salon");
ok((await foot.locator("[data-asseoir]").getAttribute("href")) === "/univers/salons?theme=foot", "« M'asseoir » ouvre le salon");
ok(/Glisse : de pièce en pièce/.test(await texte(lea.locator("#o-decouvrir [data-indice]"))) && /Touche deux fois/.test(await texte(lea.locator("#o-decouvrir [data-indice]"))), "la première fois, le seul mode d'emploi : « Glisse… », « Touche deux fois… »");
ok((await lea.locator("#o-decouvrir [data-moi] img").count()) >= 1, "sa figurine, au bord de la pièce (« Toi »)");
ok((await lea.locator(".mc-nav button.pris").innerText()).includes("Découvrir"), "le menu : « Découvrir », l'onglet où l'on est");
await lea.waitForTimeout(600);
await lea.screenshot({ path: `${D}/fil-1-salon.png` });
ok(!(await deborde(lea)), "le fil ne déborde pas");

// ═══ ELLE TOUCHE DEUX FOIS : SA FIGURINE RÉAGIT, POUR DE VRAI ═══
await foot.locator(".fd-scene").dblclick({ position: { x: 20, y: 20 } });
ok(await attendre(lea, async () => /😂/.test(await texte(lea.locator("#o-decouvrir [data-reaction]"))) && /Les 2 te voient/.test(await texte(lea.locator("#o-decouvrir [data-vu-par]")))), "toucher deux fois : sa figurine réagit (« 😂 », « Les 2 te voient »)");
ok(await attendre(lea, async () => (await foot.locator(".fd-fig").count()) === 3), "… elle s'assoit dans le gradin, avec eux");
ok((await lea.locator("#o-decouvrir [data-indice]").count()) === 0, "… le mode d'emploi s'en va");
const vu = await attendre(lea, async () => {
  const p = (await route(SAM, `${SALONS}?salon=foot-1&depuis=${Date.now() - 60_000}`)).pouls;
  return p?.messages?.some((m) => m.prenom === "Léa" && m.cle === "rire") && p.ici.length === 3;
});
ok(vu, "Sam la voit pour de vrai : sa figurine dans le salon, sa réaction");
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/fil-2-reaction.png` });

// ═══ ELLE GLISSE : L'HUMEUR DE SES PROCHES ; SA FIGURINE A QUITTÉ LE SALON ═══
await glisser(lea);
ok(await attendre(lea, async () => (await courante(lea)) === "h"), "elle glisse : l'humeur de ses proches");
const humeur = lea.locator('#o-decouvrir [data-piece="humeur"]');
ok((await humeur.locator("[data-proche] small").allInnerTexts()).join() === "Sam,Hugo" && /tristesse/i.test(await texte(humeur.locator("h2"))), `Sam d'abord (« ${await texte(humeur.locator("h2"))} »), puis Hugo`);
ok(await attendre(lea, async () => (await route(SAM, `${SALONS}?salon=foot-1&depuis=${Date.now()}`)).pouls?.ici?.length === 2, 10000), "… sa figurine a quitté le salon du foot");
await lea.screenshot({ path: `${D}/fil-3-humeur.png` });
await humeur.locator("[data-repondre]").click();
ok(await attendre(lea, async () => (await lea.locator("#o-proches:not([hidden])").count()) === 1 && (await lea.locator('[role="dialog"][aria-label="Ta conversation avec Sam"]').count()) === 1, 20000), "« Répondre à Sam » : Messages, sa conversation avec Sam ouverte");

// ═══ AUTOUR, LA MUSIQUE ═══
// (« Retour » ferme d'abord sa conversation, puis revient au fil)
await lea.goBack();
await attendre(lea, async () => (await lea.locator('[role="dialog"][aria-label="Ta conversation avec Sam"]').count()) === 0);
if ((await lea.locator("#o-decouvrir:not([hidden])").count()) === 0) await lea.goBack();
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir:not([hidden]) [data-fil]").count()) === 1), "« Retour » : le fil");
await lea.evaluate(() => document.querySelector('#o-decouvrir [data-piece="autour"]').scrollIntoView());
await lea.waitForTimeout(600);
const autour = lea.locator('#o-decouvrir [data-piece="autour"]');
ok((await texte(autour.locator("[data-mot]"))) === "Qui vient prendre un café ?" && /Hugo a posé sa figurine ici/.test(await texte(autour.locator("h2"))) && /Le Petit Bistrot/.test(await texte(autour.locator(".fd-etiquette"))), "la figurine de Hugo au Petit Bistrot, son mot du jour en grand");
ok(((await autour.locator("[data-asseoir-a-cote]").getAttribute("href")) ?? "").startsWith(`/collection?autour=${BISTROT}&pose=`), "« M'asseoir à côté » ouvre le lieu, dans Autour");
await lea.screenshot({ path: `${D}/fil-4-autour.png` });
await glisser(lea);
const musique = lea.locator('#o-decouvrir [data-piece="salon"][data-theme="musique"]');
ok(await attendre(lea, async () => (await courante(lea)) === "s:musique"), "puis le salon de la musique");
ok(/La radio du salon/.test(await texte(musique.locator(".fd-tele-titre"))) && (await texte(musique.locator("[data-asseoir]"))) === "Entrer danser" && (await musique.locator(".fd-fig.danse").count()) === 1, "… la radio du salon, Zoé qui danse, « Entrer danser »");
await lea.screenshot({ path: `${D}/fil-5-musique.png` });

// ═══ LA CUISINE, SA PASSION, SANS PERSONNE : « SOIS LE PREMIER » ═══
await glisser(lea);
const cuisine = lea.locator('#o-decouvrir [data-piece="salon"][data-theme="cuisine"]');
ok(await attendre(lea, async () => (await courante(lea)) === "s:cuisine"), "puis le salon de la cuisine, sa passion, même sans personne");
ok(/Sois le premier · ta passion/.test(await texte(cuisine.locator(".fd-etiquette"))) && (await cuisine.locator(".fd-direct").count()) === 0 && (await cuisine.locator(".fd-fig").count()) === 0, "« ✨ Sois le premier · ta passion » : personne n'est montré assis");
ok(/Zoé · il y a 1 min/.test(await texte(cuisine.locator("[data-trace]"))) && /Qui a une recette de crêpes \?/.test(await texte(cuisine.locator("[data-trace]"))), `… ce que Zoé y a dit tout à l'heure (« ${await texte(cuisine.locator("[data-trace]"))} »)`);
ok(/Zoé y était aujourd’hui\. Assieds-toi : les suivants te verront\./.test(await texte(cuisine.locator("[data-sous]"))) && (await cuisine.locator("[data-asseoir]").getAttribute("href")) === "/univers/salons?theme=cuisine", "… « Zoé y était aujourd'hui. Assieds-toi : les suivants te verront. », « M'asseoir »");
ok(/i\.ytimg\.com/.test((await cuisine.locator("[data-tele] img").getAttribute("src")) ?? ""), "… sa télé passe quand même");
await lea.screenshot({ path: `${D}/fil-6-vide.png` });
await cuisine.locator(".fd-scene").dblclick({ position: { x: 20, y: 20 } });
ok(await attendre(lea, async () => /😂/.test(await texte(lea.locator("#o-decouvrir [data-reaction]"))) && /Les suivants te verront/.test(await texte(lea.locator("#o-decouvrir [data-vu-par]")))), "toucher deux fois : « 😂 », « Les suivants te verront »");
ok(await attendre(lea, async () => (await cuisine.locator(".fd-fig").count()) === 1 && /1 en direct/.test(await texte(cuisine.locator(".fd-etiquette")))), "… elle s'assoit, la première : « 1 en direct »");
const hugoEntre = (await route(HUGO, SALONS, { action: "entrer", theme: "cuisine" })).ouverture;
ok(hugoEntre?.salon?.id === "cuisine-1" && hugoEntre.presents.some((x) => x.prenom === "Léa"), "… pour de vrai : Hugo entre dans la cuisine, et la voit");
await route(HUGO, SALONS, { action: "sortir", salon: "cuisine-1" });
await lea.screenshot({ path: `${D}/fil-7-premiere.png` });

// ═══ « TOUS LES SALONS » : L'ANCIENNE PAGE ; « ‹ LE FIL » ═══
await lea.locator("#o-decouvrir [data-tous-les-salons]").click();
ok(await attendre(lea, async () => (await lea.locator("#o-salons:not([hidden]) [data-carte-tele]").count()) === 1 && lea.url().endsWith("#salons"), 30000), "« Tous les salons » : l'ancienne page (sa télé du jour, les salons)");
ok((await lea.locator(".mc-nav button.pris").innerText()).includes("Découvrir"), "… toujours dans Découvrir");
await lea.locator("#o-salons [data-retour-fil]").click();
ok(await attendre(lea, async () => (await lea.locator("#o-decouvrir:not([hidden]) [data-fil]").count()) === 1), "« ‹ Le fil » : retour au fil");
ok(await sansMotInterdit(lea), "jamais le mot « exemple »");

// ═══ LES ANCIENS LIENS : « MON VŒU », SA MISSION, SES RÉPONSES → « TOUS LES SALONS » ; LE MÈME DU JOUR (PARTI) → « CRÉER » ═══
for (const ancre of ["voeu", "mission", "reponses"]) {
  await lea.goto(`${BASE}/collection?v=${Date.now()}#${ancre}`, { waitUntil: "domcontentloaded" });
  ok(await attendre(lea, async () => (await lea.locator("#o-salons:not([hidden]) [data-carte-tele]").count()) === 1, 30000), `#${ancre} : « Tous les salons », sa télé du jour`);
}
await lea.goto(`${BASE}/collection?v=${Date.now()}#jour`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator("#o-figurine:not([hidden])").count()) === 1, 30000) && (await lea.locator("#theme-du-jour").count()) === 0, "#jour (le lien d'une ancienne notification) : « Créer », sans le mème du jour (parti)");

// ═══ LE LIEN D'UNE VIDÉO À REVOIR (UNE NOTIFICATION) : « TOUS LES SALONS » ═══
const video = (await route(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0]?.id;
await lea.goto(`${BASE}/collection?tele=${video}&v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator("#o-salons:not([hidden])").count()) === 1, 30000), "`?tele=…#decouvrir` : la vidéo s'ouvre dans sa télé du jour (« Tous les salons »)");
await lea.context().close();

// ═══ TOM, SANS ÂGE DIT ═══
const tom = await ouvrir(TOM);
await tom.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });
await fermerPablito(tom, "#o-decouvrir");
ok(await attendre(tom, async () => (await tom.locator('#o-decouvrir [data-piece="age"]').count()) === 1, 45000), "Tom, sans âge dit : « as-tu 18 ans ou plus ? » d'abord");
await tom.locator('#o-decouvrir [data-age="adulte"]').click();
ok(await attendre(tom, async () => (await tom.locator('#o-decouvrir [data-piece="age"]').count()) === 0 && (await tom.locator('#o-decouvrir [data-piece="salon"]').count()) >= 1, 20000), "« J'ai 18 ans ou plus » : les salons en direct arrivent");
ok(!(await deborde(tom)) && (await sansMotInterdit(tom)), "rien ne déborde, jamais le mot interdit");
await tom.context().close();

await pause(100);
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
