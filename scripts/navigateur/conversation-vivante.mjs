// 🎭 LA CONVERSATION VIVANTE — lot R4a du rituel du jour (`lib/direct/vivant.ts`, `vivant-serveur.ts`,
// `app/collection/conversation-vivante.tsx`), contre le faux Supabase, jamais la vraie base.
//
// Léa et Zoé sont proches ; Zoé lui a laissé un message. Elles ouvrent leur conversation, chacune sur son téléphone.
// Zoé prépare une réponse : chez Léa, la figurine de Zoé se penche, « … » ; elle referme : c'est fini. Zoé brandit
// « J'arrive ! » : sa figurine le montre chez elle, tout de suite, et chez Léa quelques secondes après (dans la
// conversation, et dans leur fil) ; Léa est prévenue (« 🪧 Zoé : « J'arrive ! » »). Léa fait un appui long sur le message
// de Zoé : « 👏 Applaudir » — sa figurine applaudit chez les deux, et 👏 s'accroche au message. Zoé envoie un nouveau
// message : chez Léa, la conversation se relit d'elle-même et le montre. Puis le silence (l'horloge avancée) : au bout de
// 20 s, elles s'occupent ; d'une minute, Léa (sa joie) danse et Zoé (pas d'humeur) s'occupe toujours ; de trois, elles
// s'endorment, zZz. Un geste inventé, une réaction sur un message qui n'existe pas, Max qui n'est pas proche : non.
// 🎭 L'APARTÉ (lot R4b) : Léa et Nico viennent d'échanger quatre messages (Léa a commencé), puis silence : leurs
// figurines se tournent l'une vers l'autre, une bulle chacune (celle de Léa d'abord), chez Léa — « écrit par vos figurines · IA » dans leur fil, une seule fois ;
// Léa l'efface (pour les deux). Avec Eva (qui a coupé « Ma figurine parle pour moi ») et avec Sam (il était malade :
// un sujet sensible), pas d'aparté. Rien ne déborde, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, recus, telephone } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json().catch(() => null) : null;
};
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

const qui = (n, prenom) => ({ id: `efefefef-0000-4000-8000-0000000012${String(n).padStart(2, "0")}`, jeton: `jeton-vivant-r4a-0000000000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const MAX = qui(3, "Max");
const NICO = qui(4, "Nico");
const EVA = qui(5, "Eva");
const SAM = qui(6, "Sam");
const GENS = [LEA, ZOE, MAX, NICO, EVA, SAM];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre", "pied/viens"][i % 3]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre", "pied/viens"][i % 3]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
  // (l'humeur du matin déjà donnée : la feuille ne s'ouvre pas)
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${LEA.id}/proches.json`, { ids: [ZOE.id, NICO.id, EVA.id, SAM.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
for (const x of [NICO, EVA, SAM]) await json(`${x.id}/proches.json`, { ids: [LEA.id] });
await json(`${EVA.id}/reglages.json`, { rituel: false });
// 🎭 il y a cinq à deux minutes : Léa et Nico, Léa et Eva, Léa et Sam ont échangé quatre messages chacun
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rangMsg = 0;
async function echange(de, a, texte, ilYaMin) {
  const pair = [de.id, a.id].sort().join("_");
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `ap${String(++rangMsg).padStart(6, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
}
for (const [autre, phrases] of [
  [NICO, ["On fait la rando dimanche ?", "Carrément, à quelle heure ?", "Neuf heures au parking", "Je prends le pique-nique"]],
  [EVA, ["Tu as fini le livre ?", "Presque, la fin est folle", "Ne me dis rien !", "Promis, pas un mot"]],
  [SAM, ["Je suis malade depuis hier", "Oh mince, repose-toi", "Merci, ça ira demain", "Je t'envoie de la soupe virtuelle"]],
]) {
  for (const [k, p] of phrases.entries()) await echange(k % 2 ? autre : LEA, k % 2 ? LEA : autre, p, 5 - k);
}
// (Léa est dans la joie aujourd'hui ; Zoé n'a rien dit)
await json(`${LEA.id}/humeur.json`, { jour, visage: "joie", le: new Date().toISOString(), ecrites: 3 });

/** La route, comme le téléphone de quelqu'un. */
const route = async (q, corps, chemin = "proches") => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;
const parler = (de, a, texte) => route(de, { action: "envoyer", cle: a.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte, tete: null }] });
const premier = await parler(ZOE, LEA, "Tu viens au marché demain ?");

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (q, horloge = false) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  const p = await ctx.newPage();
  if (horloge) await p.clock.install({ time: new Date() });
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
/** Leur conversation, ouverte depuis « Proches ». */
async function ouvrirAvec(p, avec) {
  await p.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`, { timeout: 60000 });
  await p.locator(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  await p.waitForSelector(".pr-plein .pv-calque.lui", { state: "attached", timeout: 15000 });
}
const attendre = (p, f, arg, ms = 15000) => p.waitForFunction(f, arg, { timeout: ms }).then(() => true).catch(() => false);

ok(premier.statut === 200 && Boolean(premier.message?.id), "Zoé a laissé un message à Léa");
const lea = await tel(LEA);
const zoe = await tel(ZOE);
await ouvrirAvec(lea, ZOE);
await ouvrirAvec(zoe, LEA);
ok((await lea.locator(".pr-plein .pr-fil li.lui button").count()) === 1 && (await lea.locator(".pr-plein .pv-bouton-panneau").count()) === 1 && (await texte(lea, ".pr-plein .pv-astuce")).includes("Appui long sur un message"), "Léa : le message de Zoé, le bouton 🪧, « Appui long sur un message : ta figurine réagit »");

// ═══ ✍️ ZOÉ PRÉPARE UNE RÉPONSE : CHEZ LÉA, SA FIGURINE SE PENCHE ═══
ok((await lea.locator(".pr-plein .pv-calque.lui .pv-prepare").count()) === 0, "rien ne se prépare encore");
await zoe.locator(".pr-plein .pr-bas .pr-bouton").click();
await zoe.waitForSelector(".pr-plein.pr-parler", { timeout: 15000 });
const penche = await attendre(lea, () => Boolean(document.querySelector(".pr-plein .pv-calque.lui .pv-prepare")) && Boolean(document.querySelector('.pr-plein .pr-scene [data-posture="prepare"]')));
ok(penche, "Zoé prépare une réponse : chez Léa, la figurine de Zoé se penche, « … »");
await lea.screenshot({ path: `${D}/vivant-1-prepare.png` });
await zoe.locator(".pr-plein.pr-parler .pr-retour").click();
ok(await attendre(lea, () => !document.querySelector(".pr-plein .pv-calque.lui .pv-prepare")), "elle referme : c'est fini, chez Léa aussi");

// ═══ 🪧 ZOÉ BRANDIT « J'ARRIVE ! » ═══
const telLea = telephone("lea-vivant");
const abonne = await lea.evaluate(async (abonnement) => (await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "notif", abonnement }) })).status, telLea.abonnement);
ok(abonne === 200, "Léa a les notifications");
await zoe.locator(".pr-plein .pv-bouton-panneau").click();
await zoe.waitForSelector(".pv-feuille.ouverte .pv-panneaux button", { timeout: 10000 });
const panneaux = (await zoe.locator(".pv-feuille .pv-panneaux button").allInnerTexts()).map(plat);
ok(panneaux.join("|") === "MDR|J’arrive !|Rappelle-moi|Bravo !|Pas dispo 😴|Je pense à toi|Merci !|Ce soir ?", `les huit panneaux validés (${panneaux.join(" · ")})`);
await zoe.screenshot({ path: `${D}/vivant-2-panneaux.png` });
const t0 = Date.now();
await zoe.locator('.pv-feuille [data-panneau="jarrive"]').click();
await zoe.waitForSelector(".pr-plein .pv-calque.moi .pv-panneau", { timeout: 3000 });
ok(Date.now() - t0 < 1500 && (await texte(zoe, ".pr-plein .pv-calque.moi .pv-panneau")) === "J’arrive !", `chez Zoé, tout de suite (${Date.now() - t0} ms) : sa figurine brandit « J'arrive ! »`);
ok(await attendre(zoe, () => document.querySelector(".pr-plein .pr-fil li.pv-panneau-fil.moi")?.textContent?.includes("J’arrive !")), "et dans leur fil");
ok(await attendre(lea, () => document.querySelector(".pr-plein .pv-calque.lui .pv-panneau")?.textContent === "J’arrive !"), "chez Léa, quelques secondes après : la figurine de Zoé brandit « J'arrive ! »");
await lea.screenshot({ path: `${D}/vivant-3-panneau.png` });
ok(await attendre(lea, () => document.querySelector(".pr-plein .pr-fil li.pv-panneau-fil.lui")?.textContent?.includes("J’arrive !")), "et dans leur fil, chez Léa");
const notif = (await recus(telLea)).find((x) => x.title?.startsWith("🪧"));
ok(notif?.title === "🪧 Zoé : « J’arrive ! »" && notif.body === "Sa figurine te le montre. Viens voir 👀" && notif.url.includes(`parler=${ZOE.cle}`), `Léa est prévenue : « ${notif?.title} » — ${notif?.body}`);

// ═══ 👏 LÉA APPLAUDIT LE MESSAGE DE ZOÉ (UN APPUI LONG) ═══
const bulle = lea.locator(".pr-plein .pr-fil li.lui button").first();
const boite = await bulle.boundingBox();
await lea.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
await lea.mouse.down();
await lea.waitForTimeout(700);
await lea.mouse.up();
await lea.waitForSelector(".pv-feuille.ouverte .pv-reactions button", { timeout: 5000 });
ok((await lea.locator(".pv-feuille .pv-reactions button").count()) === 6 && (await lea.locator(".pr-plein .pr-scene").getAttribute("data-message")) === premier.message.id, "l'appui long ouvre les six réactions (sans rejouer le message)");
await lea.screenshot({ path: `${D}/vivant-4-reactions.png` });
await lea.locator('.pv-feuille [data-reaction="applaudir"]').click();
await lea.waitForSelector(".pr-plein .pv-calque.moi .pv-eclat", { timeout: 3000 });
ok((await lea.locator('.pr-plein .pr-scene [data-geste="applaudir"]').count()) === 1, "chez Léa, sa figurine applaudit tout de suite (👏 en éclat)");
ok(await attendre(lea, () => document.querySelector(".pr-plein .pr-fil li.lui button small")?.textContent?.includes("👏")), "👏 s'accroche au message de Zoé");
ok((await lea.locator(".pr-plein .pv-astuce").count()) === 0, "l'astuce de l'appui long s'en va (elle a compris)");
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pv-calque.lui .pv-eclat")) || document.querySelector(".pr-plein .pr-fil li.moi button small")?.textContent?.includes("👏")), "chez Zoé : la figurine de Léa applaudit, 👏 sur son message");
ok(await attendre(zoe, () => document.querySelector(".pr-plein .pr-fil li.moi button small")?.textContent?.includes("👏")), "et 👏 reste sur son message");
const gestes = await lireStock(`fils/${[LEA.id, ZOE.id].sort().join("_")}/gestes.json`);
ok(gestes?.liste?.length === 2 && gestes.liste.some((g) => g.type === "panneau" && g.cle === "jarrive") && gestes.liste.some((g) => g.type === "reaction" && g.cle === "applaudir" && g.message === premier.message.id) && gestes.liste.every((g) => !JSON.stringify(g).includes(LEA.id)), "gardé : le panneau, la réaction (jamais l'identifiant de qui l'a fait)");
const changer = await route(LEA, { action: "geste", cle: ZOE.cle, type: "reaction", quoi: "coeur", message: premier.message.id });
const apres = await lireStock(`fils/${[LEA.id, ZOE.id].sort().join("_")}/gestes.json`);
ok(changer.statut === 200 && apres.liste.filter((g) => g.type === "reaction").length === 1 && apres.liste.find((g) => g.type === "reaction").cle === "coeur", "une réaction par personne et par message : ❤️ remplace 👏");

// ═══ 📨 UN NOUVEAU MESSAGE ARRIVE PENDANT QU'ELLE EST OUVERTE ═══
const deuxieme = await parler(ZOE, LEA, "Je pars dans dix minutes");
ok(await attendre(lea, (id) => document.querySelector(".pr-plein .pr-scene")?.getAttribute("data-message") === id && document.querySelectorAll(".pr-plein .pr-fil li.lui button").length === 2, deuxieme.message?.id), "Zoé envoie un message : chez Léa, la conversation se relit d'elle-même et le montre");

// ═══ LES REFUS ═══
const faux = await route(LEA, { action: "geste", cle: ZOE.cle, type: "panneau", quoi: "nimporte" });
const absent = await route(LEA, { action: "geste", cle: ZOE.cle, type: "reaction", quoi: "coeur", message: "zzzzzzzzzzzz" });
const pasProche = await route(MAX, { action: "geste", cle: LEA.cle, type: "panneau", quoi: "mdr" });
const voirMax = await fetch(`${BASE}/api/direct/proches?vivant=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${MAX.jeton}` } });
ok(faux.statut === 400 && absent.statut === 404 && pasProche.statut === 403 && voirMax.status === 403, `un geste inventé (400), un message absent (404), Max qui n'est pas proche (403, et il ne voit rien)`);

// ═══ 🕰️ LE SILENCE (l'horloge avancée) ═══
const lea2 = await tel(LEA, true);
await ouvrirAvec(lea2, ZOE);
const postures = () => lea2.evaluate(() => ({ moi: document.querySelector(".pr-plein .pr-scene .pr-ecoute")?.getAttribute("data-posture"), lui: document.querySelector(".pr-plein .pr-scene .pr-parleur")?.getAttribute("data-posture") }));
const p0 = await postures();
await lea2.clock.fastForward(25_000);
await lea2.waitForTimeout(300);
const p1 = await postures();
await lea2.clock.fastForward(45_000);
await lea2.waitForTimeout(300);
const p2 = await postures();
await lea2.screenshot({ path: `${D}/vivant-5-danse.png` });
await lea2.clock.fastForward(130_000);
await lea2.waitForTimeout(300);
const p3 = await postures();
ok(p0.moi === "calme" && p0.lui === "calme", `à l'ouverture, calmes (${JSON.stringify(p0)})`);
ok(p1.moi === "occupe" && p1.lui === "occupe", `20 s de silence : elles s'occupent (${JSON.stringify(p1)})`);
ok(p2.moi === "danse" && p2.lui === "occupe", `une minute : Léa (sa joie) se lève et danse ; Zoé (pas d'humeur) s'occupe (${JSON.stringify(p2)})`);
ok(p3.moi === "dort" && p3.lui === "dort" && (await lea2.locator(".pr-plein .pv-calque .pv-zzz").count()) === 2, `trois minutes : elles s'endorment, zZz (${JSON.stringify(p3)})`);
await lea2.screenshot({ path: `${D}/vivant-6-dort.png` });

// ═══ 🎭 L'APARTÉ (lot R4b) ═══
const lea3 = await tel(LEA);
await ouvrirAvec(lea3, NICO);
ok(await attendre(lea3, () => document.querySelectorAll(".pr-plein .pv-calque .pv-aparte").length === 2, null, 25000), "Léa et Nico viennent d'échanger, puis silence : leurs deux figurines font un aparté, une bulle chacune");
const bulles = await lea3.evaluate(() => ({ lui: document.querySelector(".pr-plein .pv-calque.lui .pv-aparte")?.textContent ?? "", moi: document.querySelector(".pr-plein .pv-calque.moi .pv-aparte")?.textContent ?? "" }));
ok(bulles.moi.includes("Ça parle de « On fait la… » ici") && bulles.lui.includes("Moi j’écoute"), `la figurine de Léa commence (elle a parlé la première), celle de Nico répond (« ${plat(bulles.moi)} » / « ${plat(bulles.lui)} »)`);
await lea3.waitForTimeout(1800);
await lea3.screenshot({ path: `${D}/vivant-7-aparte.png` });
const filAparte = await texte(lea3, ".pr-plein .pr-fil li.pv-aparte-fil");
ok(filAparte.includes("VOS FIGURINES, EN APARTÉ") && filAparte.includes("Celle de Nico :") && filAparte.includes("Ta figurine :") && filAparte.includes("Écrit par vos figurines · IA"), `dans leur fil : l'aparté, « Écrit par vos figurines · IA » (${filAparte.slice(0, 120)})`);
const pairNico = [LEA.id, NICO.id].sort().join("_");
const apNico = await lireStock(`fils/${pairNico}/apartes.json`);
ok(apNico?.liste?.length === 1 && apNico.liste[0].mots?.length === 2 && !JSON.stringify(apNico).includes(LEA.id) && !JSON.stringify(apNico).includes(NICO.id), "gardé une fois, sans identifiant");
const vuParNico = await (await fetch(`${BASE}/api/direct/proches?vivant=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${NICO.jeton}` } })).json();
ok(vuParNico.vivant?.apartes?.length === 1 && vuParNico.vivant.apartes[0].mots[0].moi === false && vuParNico.vivant.apartes[0].mots.find((x) => x.moi)?.texte.startsWith("Moi j’écoute"), "Nico voit le même aparté (la figurine de Léa d'abord, puis la sienne)");
await lea3.waitForTimeout(5000);
ok((await lireStock(`fils/${pairNico}/apartes.json`))?.liste?.length === 1, "une seule fois par échange (pas un deuxième aux relectures suivantes)");
await lea3.locator(".pr-plein .pr-fil li.pv-aparte-fil button").click();
await lea3.waitForSelector(".pr-plein .pr-fil li.pv-aparte-fil", { state: "detached", timeout: 10000 });
const apEfface = await lireStock(`fils/${pairNico}/apartes.json`);
const vuApres = await (await fetch(`${BASE}/api/direct/proches?vivant=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${NICO.jeton}` } })).json();
ok(Boolean(apEfface?.liste?.[0]?.efface) && !apEfface.liste[0].mots && vuApres.vivant?.apartes?.length === 0, "Léa l'efface : il part pour les deux");
// (Eva a coupé « Ma figurine parle pour moi » ; Sam était malade : pas d'aparté)
for (const [autre, pourquoi] of [
  [EVA, "se-tait"],
  [SAM, "sensible"],
]) {
  const pair = [LEA.id, autre.id].sort().join("_");
  await fetch(`${BASE}/api/direct/proches?vivant=${autre.cle}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
  let f = null;
  for (let k = 0; k < 30 && !f?.liste?.length; k++) {
    await new Promise((r) => setTimeout(r, 300));
    f = await lireStock(`fils/${pair}/apartes.json`);
  }
  ok(f?.liste?.length === 1 && f.liste[0].rien === pourquoi && !f.liste[0].mots, `avec ${autre.prenom}, pas d'aparté (${pourquoi === "se-tait" ? "sa figurine se tait" : "un sujet sensible"})`);
}

// ═══ PARTOUT ═══
for (const [nom, p] of [["Léa", lea], ["Zoé", zoe], ["Léa (le silence)", lea2], ["Léa (l'aparté)", lea3]]) {
  ok(p.err.length === 0, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err[0]})` : ""}`);
  ok((await debordement(p)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
}

await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
