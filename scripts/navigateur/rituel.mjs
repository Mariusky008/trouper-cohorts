// ☀️ LE RITUEL DU JOUR — lot R1 : l'humeur du jour, et le mot des figurines sur cette humeur (`app/collection/rituel.tsx`,
// `lib/direct/rituel.ts`, `rituel-serveur.ts`, `app/api/direct/rituel`), contre le faux Supabase, jamais la vraie base.
//
// Zoé a six proches : Léa (elles se parlent beaucoup), Nico (un peu), Sam et Eva (jamais encore), Tom (qui a coupé « Ma
// figurine parle pour moi ») et Max (que Zoé a ajouté, mais qui ne l'a pas ajoutée). Zoé ouvre ClikMe : « Comment tu te
// sens aujourd'hui ? », la rangée de ses visages (son fou rire est déjà fait : sa figurine ; les autres : l'emoji). Elle
// choisit le fou rire : « Les figurines de tes proches t'écrivent… », puis trois mots fermés (Léa, Nico, et Sam ou Eva
// — jamais Tom, jamais Max). « Qui a dit quoi ? » : elle ouvre celui de Léa (« Écrit par la figurine de Léa · IA »),
// « Lui répondre » ouvre leur conversation, avec le mot en haut. Le mot qui parle d'apéro est remplacé par un mot de
// secours. La consigne ne connaît que l'humeur et la façon de parler (pas leurs conversations).
// Nico, lui, passe la feuille (« Pas maintenant » : elle ne revient pas) ; il voit Zoé avec sa tête de fou rire et 😂 ;
// « Ta figurine a écrit à Zoé » : il lit le mot écrit en son nom, l'efface ; puis il coupe « Ma figurine parle pour
// moi » dans « Moi ». Zoé change d'humeur (la tristesse : un mot doux) — Nico ne lui écrit plus ; trois humeurs par
// jour font écrire, pas plus. Léa choisit la sienne : en haut de leur conversation, chez Zoé, l'humeur de Léa, le mot de
// chaque figurine.
// 🌙 LE MOT DE LA FIN (lot R2) : hier, Léa et Zoé se sont parlé (le match) ; Eva aussi, mais elle était malade (un
// sujet sensible : pas de mot) ; Sam seul a parlé (pas d'échange : pas de mot). Ce matin, à la première ouverture, leur
// mot de la fin se prépare : « 🌙 Cette nuit, vos figurines se sont parlé », fermé, puis leurs deux répliques (celle de
// Léa d'abord : elle avait parlé la première), tirées de leurs messages d'hier et de rien d'autre ; en haut de leur
// conversation aussi. L'envoi du matin (forcé) : « 🌙 Cette nuit, vos figurines se sont parlé », une fois. Léa
// l'efface : il part pour les deux. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, recus, telephone } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json() : null;
};
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
/** (les mots ont l'espace fine insécable avant « ? ! : ; ») */
const plat = (x) => String(x ?? "").replace(/\u202f/g, " ");
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const qui = (n, prenom) => ({ id: `abababab-0000-4000-8000-0000000009${String(n).padStart(2, "0")}`, jeton: `jeton-rituel-0000000000000${String(n).padStart(2, "0")}`, prenom });
const ZOE = qui(1, "Zoé");
const LEA = qui(2, "Léa");
const NICO = qui(3, "Nico");
const SAM = qui(4, "Sam");
const EVA = qui(5, "Eva");
const TOM = qui(6, "Tom");
const MAX = qui(7, "Max");
const GENS = [ZOE, LEA, NICO, SAM, EVA, TOM, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);

// ─── sept habitants de Dax, leurs figurines ; Zoé a déjà son fou rire et sa joie ───
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const IMAGES = ["pied/salut-1", "pied/montre", "pied/viens", "content", "reflechit", "pied/montre", "pied/viens"];
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(IMAGES[i]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(IMAGES[i]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
const dossierExpr = (h) => `${h}/expr-${crypto.createHash("sha1").update(`${h}/neutre-essai.webp`).digest("hex").slice(0, 16)}`;
for (const [cle, nom] of [["rire", "content"], ["joie", "pied/salut-2"]]) {
  await deposer(`${dossierExpr(ZOE.id)}/${cle}-n.webp`, img(nom), "image/webp");
  await deposer(`${dossierExpr(ZOE.id)}/${cle}-p.webp`, img(nom), "image/webp");
}
// les proches : Zoé a ajouté tout le monde ; tous l'ont ajoutée, sauf Max ; Tom a coupé « Ma figurine parle pour moi »
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id, NICO.id, SAM.id, EVA.id, TOM.id, MAX.id] });
for (const x of [LEA, NICO, SAM, EVA, TOM]) await json(`${x.id}/proches.json`, { ids: [ZOE.id] });
await json(`${TOM.id}/reglages.json`, { rituel: false });
// la carte de personnage de Léa : sa façon de parler (la consigne s'en sert)
await json(`${LEA.id}/personnage.json`, {
  reponses: {},
  gouts: [],
  phrase: "Toujours partante",
  fiche: { titre: "La reine des fous rires", portrait: "", pouvoir: "", faiblesse: "", facon: "Des blagues à chaque phrase" },
  par: "local",
  le: new Date().toISOString(),
});

/** La route, comme le téléphone de quelqu'un. */
const route = async (q, corps, chemin = "rituel") => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (q, s = "") => {
  const r = await fetch(`${BASE}/api/direct/rituel${s}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
/** Les figurines écrivent après la réponse : on attend qu'elles aient fini. */
async function apresEcriture(q) {
  for (let k = 0; k < 40; k++) {
    const r = await voir(q);
    if (!r.attente) return r;
    await new Promise((ok) => setTimeout(ok, 500));
  }
  return voir(q);
}
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;
const parler = (de, a, texte) => route(de, { action: "envoyer", cle: a.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte, tete: null }] }, "proches");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── 🌙 hier : Léa et Zoé ont parlé du match ; Eva était malade ; Sam a parlé seul ───
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const hierTs = Date.now() - 86_400_000;
let rang = 0;
async function hier(de, a, texte) {
  const pair = [de.id, a.id].sort().join("_");
  const ts = hierTs + rang++ * 60_000;
  const id = `hier${String(rang).padStart(4, "0")}`;
  const fiche = { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] };
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, fiche);
}
await hier(LEA, ZOE, "Tu as vu le match hier soir ?");
await hier(ZOE, LEA, "Oui, quelle fin incroyable !");
await hier(EVA, ZOE, "Je suis malade depuis ce matin");
await hier(ZOE, EVA, "Repose-toi bien");
await hier(SAM, ZOE, "Coucou, tu es là ?");
const pairDe = (x, y) => [x.id, y.id].sort().join("_");
const hierJour = new Date(hierTs).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

// ─── avant : Léa et Zoé se parlent souvent ; Nico une fois ───
ok((await parler(LEA, ZOE, "Tu viens ce soir ?")).statut === 200 && (await parler(ZOE, LEA, "Oui !")).statut === 200 && (await parler(LEA, ZOE, "Top")).statut === 200, "Léa et Zoé se parlent (trois messages)");
ok((await parler(NICO, ZOE, "Salut Zoé")).statut === 200, "Nico lui a parlé une fois");
const vide = await voir(ZOE);
ok(vide.statut === 200 && vide.jour === jour && vide.humeur === null && vide.mots?.length === 0 && vide.parle === true && vide.proches === 6, `au réveil : pas d'humeur, pas de mot, sa figurine parle pour elle (${JSON.stringify({ h: vide.humeur, p: vide.proches })})`);
ok((await route(ZOE, { action: "humeur", visage: "nimporte" })).statut === 400 && (await route(ZOE, { action: "humeur", visage: "endouce" })).statut === 400, "une humeur qui n'existe pas (ou une attitude) : refusée");
ok((await voir(ZOE, `?avec=${MAX.cle}`)).statut === 403 && (await voir(ZOE, `?avec=${"0".repeat(16)}`)).statut === 404, "le rituel avec Max (il ne l'a pas ajoutée) : rien ; une clé inconnue non plus");

// ═══ 🌙 LE MOT DE LA FIN : il se prépare à la première ouverture du jour ═══
ok(Array.isArray(vide.fins) && vide.fins.length === 0 && vide.finsAttente === true, "à la première ouverture : pas encore de mot de la fin, il se prépare");
let rFins = vide;
for (let k = 0; k < 40 && rFins.finsAttente; k++) {
  await new Promise((r) => setTimeout(r, 500));
  rFins = await voir(ZOE);
}
const finLea = rFins.fins?.[0];
ok(
  rFins.fins?.length === 1 && finLea?.cle === LEA.cle && finLea.jour === hierJour && finLea.mots?.length === 2 && finLea.mots[0].moi === false && finLea.mots[1].moi === true,
  `un mot de la fin, avec Léa (elle avait parlé la première : sa figurine commence) — ni Eva, ni Sam (${JSON.stringify(rFins.fins?.map((f) => f.lui.prenom))})`,
);
ok(plat(finLea?.mots?.[0]?.texte).includes("« Tu as vu le") && finLea.lui.prenom === "Léa" && finLea.moi.prenom === "Zoé" && !JSON.stringify({ ...finLea, lui: null, moi: null }).includes(LEA.id), "tiré de leurs messages d'hier ; les figurines par leur clé");
const consigneFin = (await (await fetch(`${F.replace("/rest/v1", "")}/__ia`)).json()).filter((c) => c.includes("UN MOT DE LA FIN"));
ok(
  consigneFin.some((c) => c.includes("Tu as vu le match") && c.includes("quelle fin incroyable") && !c.includes("Tu viens ce soir") && !c.includes("malade")) && consigneFin.some((c) => c.includes("malade")),
  "la consigne : leurs messages d'hier, et rien d'autre (ni ceux d'aujourd'hui, ni ceux d'Eva)",
);
ok((await lireStock(`fils/${pairDe(ZOE, EVA)}/fin/${hierJour}.json`))?.rien === "sensible" && !(await lireStock(`fils/${pairDe(ZOE, SAM)}/fin/${hierJour}.json`)), "Eva était malade : pas de mot (sensible) ; Sam a parlé seul : pas de mot");
const finChezLea = await voir(LEA);
ok(finChezLea.fins?.length === 1 && finChezLea.fins[0].cle === ZOE.cle && finChezLea.fins[0].mots[0].moi === true, "chez Léa aussi (sa figurine commence)");

const b = await lancer({ humeur: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
async function tel(q) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${q.prenom} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const capture = (p, nom) => p.screenshot({ path: `${D}/rituel-${nom}.png` });

// ═══ ZOÉ : LA FEUILLE DU MATIN ═══
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(zoe);
const feuille = zoe.locator(".rt-feuille.ouverte");
await feuille.waitFor({ state: "visible", timeout: 30000 }).catch(() => null);
ok((await feuille.count()) === 1 && (await texte(zoe, ".rt-feuille .rt-question")) === "Comment tu te sens aujourd’hui ?", "à la première ouverture du jour : « Comment tu te sens aujourd'hui ? »");
await zoe.waitForFunction(() => document.querySelector('.rt-feuille .rt-visages button[data-humeur="rire"] img'), null, { timeout: 15000 }).catch(() => null);
const visages = await zoe.locator(".rt-feuille .rt-visages button").evaluateAll((l) => l.map((x) => ({ h: x.dataset.humeur, img: Boolean(x.querySelector("img")), t: x.textContent.trim() })));
ok(
  visages.length === 8 && visages[0].h === "joie" && visages.find((v) => v.h === "rire")?.img && visages.find((v) => v.h === "joie")?.img && !visages.find((v) => v.h === "tristesse")?.img,
  `ses huit visages : le fou rire et la joie sont les siens, les autres en emoji (${visages.map((v) => `${v.h}${v.img ? "*" : ""}`).join(" ")})`,
);
ok((await debordement(zoe)) <= 0 && (await sansMotInterdit(zoe)), "la feuille ne déborde pas, sans le mot interdit");
await zoe.waitForSelector(`.rt-feuille .rt-fin[data-fin="${LEA.cle}"] .rt-fin-ferme`, { timeout: 15000 }).catch(() => null);
ok((await texte(zoe, ".rt-feuille .rt-fins")).includes("🌙 Cette nuit, vos figurines se sont parlé") && (await texte(zoe, ".rt-feuille .rt-fin")).includes("Ta figurine et celle de Léa"), "en haut de la feuille : « 🌙 Cette nuit, vos figurines se sont parlé », fermé");
await capture(zoe, "1-matin");
await zoe.locator(`.rt-feuille .rt-fin[data-fin="${LEA.cle}"] .rt-fin-ferme`).click();
await zoe.waitForSelector(".rt-feuille .rt-fin.ouvert .rt-replique", { timeout: 5000 }).catch(() => null);
const repliques = await zoe.locator(".rt-feuille .rt-fin.ouvert .rt-replique").evaluateAll((l) => l.map((x) => ({ moi: x.classList.contains("moi"), t: x.textContent.replace(/\s+/g, " ").trim() })));
ok(
  repliques.length === 2 && !repliques[0].moi && repliques[0].t.includes("La figurine de Léa") && repliques[1].moi && repliques[1].t.includes("Ta figurine") && (await texte(zoe, ".rt-feuille .rt-fin.ouvert")).includes("écrit par vos figurines · IA"),
  `ouvert : leurs deux répliques, face à face, « écrit par vos figurines · IA » (${repliques.map((r) => r.t.slice(0, 40)).join(" | ")})`,
);
await capture(zoe, "1b-fin");
await zoe.locator('.rt-feuille .rt-visages button[data-humeur="rire"]').click();
await zoe.waitForFunction(() => /Ton humeur : 😂 Fou rire/.test(document.querySelector(".rt-feuille .rt-question")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => null);
ok((await texte(zoe, ".rt-feuille .rt-question")).includes("Fou rire"), "un toucher : « Ton humeur : 😂 Fou rire »");
await zoe.waitForSelector(".rt-feuille .rt-mot", { timeout: 30000 }).catch(() => null);
const fermes = await zoe.locator(".rt-feuille .rt-mot").evaluateAll((l) => l.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
ok(
  fermes.length === 3 && fermes.some((t) => t.includes("La figurine de Léa")) && fermes.some((t) => t.includes("La figurine de Nico")) && !fermes.some((t) => /Tom|Max/.test(t)) && fermes.every((t) => t.includes("a un mot pour toi")),
  `trois mots, fermés : Léa et Nico (ceux à qui elle parle le plus), jamais Tom ni Max (${fermes.map((t) => t.slice(0, 22)).join(" | ")})`,
);
ok((await texte(zoe, ".rt-feuille .rt-compte")).includes("3 figurines ont réagi à ton humeur. Qui a dit quoi ?"), "« 👀 3 figurines ont réagi à ton humeur. Qui a dit quoi ? »");
await capture(zoe, "2-mots-fermes");
const etat = await voir(ZOE);
const motLea = etat.mots.find((m) => m.de.cle === LEA.cle);
const motNico = etat.mots.find((m) => m.de.cle === NICO.cle);
const autre = etat.mots.find((m) => m.de.cle !== LEA.cle && m.de.cle !== NICO.cle);
ok(etat.humeur === "rire" && etat.mots.length === 3 && etat.mots.every((m) => m.humeur === "rire" && m.de.image && Object.keys(m.de).join() === "cle,prenom,image" && !JSON.stringify({ ...m, de: { ...m.de, image: "" } }).includes(LEA.id)), "côté serveur : l'humeur, trois mots — les figurines par leur clé, jamais leur identifiant");
ok(plat(motLea?.texte) === "Je sens ton humeur d’ici, signé Léa ! Tu racontes ?" && motLea.texte.includes("\u202f?"), `le mot de la figurine de Léa, écrit par l'IA (${motLea?.texte})`);
const secours = ["Ce fou rire, je veux savoir d’où il vient 😂 Raconte !", "Tu ris déjà ? Partage, je m’ennuie ici 😂", "Quelque chose t’a fait rire, ça se voit. Envoie la blague !"];
const leSecond = etat.mots.find((m) => secours.includes(plat(m.texte)));
ok(Boolean(leSecond) && !etat.mots.some((m) => /ap[ée]ro/i.test(m.texte)), `le mot qui parlait d'apéro : remplacé par un mot de secours (${leSecond?.texte})`);
ok([SAM.cle, EVA.cle].includes(autre?.de.cle), `le troisième : Sam ou Eva (${autre?.de.prenom})`);
const consignes = await (await fetch(`${F.replace("/rest/v1", "")}/__ia`)).json();
const consigne = consignes.filter((c) => c.includes("UN petit mot sur cette humeur")).pop() ?? "";
ok(consigne.includes("Le fou rire") && consigne.includes("La reine des fous rires") && consigne.includes("Des blagues à chaque phrase") && !/Tu viens ce soir|Salut Zoé/.test(consigne) && !consigne.includes(LEA.id), "la consigne : l'humeur et la façon de parler de chaque figurine — rien de leurs conversations");
// « Qui a dit quoi ? » : elle ouvre le mot de Léa
const carteLea = zoe.locator(`.rt-feuille .rt-mot[data-mot="${motLea?.id}"]`);
await carteLea.locator(".rt-mot-ferme").click();
await carteLea.locator("q").waitFor({ timeout: 5000 }).catch(() => null);
ok((await carteLea.innerText()).includes("Écrit par la figurine de Léa · IA") && (await carteLea.locator("q").innerText()).includes("signé Léa"), "elle ouvre le mot de Léa : « Écrit par la figurine de Léa · IA »");
await capture(zoe, "3-mot-ouvert");
await carteLea.locator(".rt-repondre").click();
await zoe.waitForSelector(".pr-plein .rt-bandeau", { timeout: 20000 }).catch(() => null);
ok((await texte(zoe, ".pr-plein .pr-qui b")) === "Léa" && (await texte(zoe, ".pr-plein .rt-bandeau")).includes("La figurine de Léa t’a écrit · IA"), "« Lui répondre » : leur conversation, avec le mot de sa figurine en haut");
ok((await feuille.count()) === 0, "la feuille s'est refermée");
await capture(zoe, "4-conversation");
await zoe.locator(".pr-plein .pr-retour").click();
await zoe.waitForSelector("#o-proches .rt-bloc .rt-mot.ouvert", { timeout: 15000 }).catch(() => null);
ok((await texte(zoe, "#o-proches .rt-bloc .rt-bloc-titre")).includes("Ton humeur : 😂 Fou rire") && (await zoe.locator("#o-proches .rt-bloc .rt-mot.ouvert").count()) === 1, "en haut de « Proches » : son humeur, et le mot déjà ouvert le reste");
ok((await debordement(zoe)) <= 0 && (await sansMotInterdit(zoe)), "« Proches » ne déborde pas, sans le mot interdit");
await capture(zoe, "5-proches");

// ═══ NICO : IL PASSE ; IL VOIT CE QUE SA FIGURINE A DIT EN SON NOM ═══
const nico = await tel(NICO);
await nico.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(nico);
await nico.locator(".rt-feuille.ouverte").waitFor({ state: "visible", timeout: 30000 }).catch(() => null);
await nico.locator(".rt-feuille .rt-passer").click();
await nico.waitForFunction(() => !document.querySelector(".rt-feuille.ouverte"), null, { timeout: 5000 }).catch(() => null);
ok((await nico.locator(".rt-feuille.ouverte").count()) === 0, "« Pas maintenant » : la feuille se ferme");
await nico.reload({ waitUntil: "networkidle" });
await fermerPablito(nico);
await nico.waitForSelector("#o-proches .rt-bloc", { timeout: 30000 }).catch(() => null);
await nico.waitForTimeout(1200);
ok((await nico.locator(".rt-feuille.ouverte").count()) === 0 && (await texte(nico, "#o-proches .rt-bloc .rt-bloc-titre")).includes("Ton humeur du jour ?"), "elle ne revient pas ce jour-là ; la question reste, discrète, en haut de « Proches »");
await nico.waitForSelector(`#o-proches .pr-carte[data-cle="${ZOE.cle}"] .pr-humeur`, { timeout: 30000 }).catch(() => null);
const carteZoe = await nico.locator(`#o-proches .pr-carte[data-cle="${ZOE.cle}"]`).evaluate((c) => ({ badge: c.querySelector(".pr-humeur")?.textContent ?? "", src: c.querySelector(".pr-mini img")?.getAttribute("src") ?? "" })).catch(() => ({}));
ok(carteZoe.badge === "😂" && /\/rire-n\.webp/.test(carteZoe.src), `chez Nico, la figurine de Zoé porte son fou rire (😂, son visage) (${carteZoe.src?.split("?")[0].split("/").pop()})`);
await nico.locator("#o-proches .rt-ecrits-titre").click();
await nico.waitForSelector("#o-proches .rt-ecrits li[data-ecrit]", { timeout: 10000 }).catch(() => null);
const ecritNico = await texte(nico, "#o-proches .rt-ecrits");
ok(ecritNico.includes("Ta figurine a écrit à Zoé aujourd’hui") && ecritNico.includes("À Zoé, sur son humeur 😂") && ecritNico.includes(plat(motNico?.texte) || "§"), `Nico voit ce que sa figurine a écrit en son nom (${ecritNico.slice(0, 120)})`);
await capture(nico, "6-ecrit-par-sa-figurine");
await nico.locator("#o-proches .rt-ecrits .rt-effacer").first().click();
await nico.waitForFunction(() => !document.querySelector("#o-proches .rt-ecrits li[data-ecrit]"), null, { timeout: 10000 }).catch(() => null);
const apresEffacer = await voir(ZOE);
ok((await nico.locator("#o-proches .rt-ecrits").count()) === 0 && apresEffacer.mots.length === 2 && !apresEffacer.mots.some((m) => m.de.cle === NICO.cle), "« Effacer » : son mot disparaît, chez Zoé aussi");
ok((await route(NICO, { action: "effacer", cle: "0".repeat(16), id: "x" })).statut === 404, "effacer chez un inconnu : rien");
// « Moi » : il coupe « Ma figurine parle pour moi »
await nico.locator(".mc-barre button.mc-moi").click();
await nico.waitForSelector("#figurine-parle button[role=switch]", { timeout: 30000 }).catch(() => null);
ok((await nico.locator("#figurine-parle button[role=switch]").getAttribute("aria-checked")) === "true", "dans « Moi » : « Ma figurine parle pour moi », allumé d'office");
await nico.locator("#figurine-parle button[role=switch]").click();
await nico.waitForFunction(() => document.querySelector("#figurine-parle button[role=switch]")?.getAttribute("aria-checked") === "false", null, { timeout: 5000 }).catch(() => null);
let reglagesNico = null;
for (let k = 0; k < 20 && reglagesNico?.rituel !== false; k++) {
  await nico.waitForTimeout(500);
  reglagesNico = await lireStock(`${NICO.id}/reglages.json`);
}
ok(reglagesNico?.rituel === false && (await voir(NICO)).parle === false, `il le coupe : gardé (${JSON.stringify(reglagesNico)})`);
ok((await debordement(nico)) <= 0 && (await sansMotInterdit(nico)), "chez Nico : rien ne déborde, sans le mot interdit");
await capture(nico, "7-moi");

// ═══ ZOÉ CHANGE D'HUMEUR ═══
const triste = await route(ZOE, { action: "humeur", visage: "tristesse" });
ok(triste.statut === 200 && triste.humeur === "tristesse" && triste.ecrire === true, "Zoé passe à la tristesse : les figurines écrivent de nouveau");
const r2 = await apresEcriture(ZOE);
const consigne2 = (await (await fetch(`${F.replace("/rest/v1", "")}/__ia`)).json()).filter((c) => c.includes("UN petit mot sur cette humeur")).pop() ?? "";
ok(r2.humeur === "tristesse" && r2.mots.length === 3 && !r2.mots.some((m) => [NICO.cle, TOM.cle, MAX.cle].includes(m.de.cle)) && r2.mots.every((m) => m.humeur === "tristesse"), `trois mots sur sa tristesse — plus Nico (il a effacé, il a coupé), ni Tom, ni Max (${r2.mots.map((m) => m.de.prenom).join(", ")})`);
ok(consigne2.includes("Cette humeur est difficile : un mot doux"), "la consigne : un mot doux, jamais de blague");
ok((await lireStock(`${ZOE.id}/visages.json`))?.voulus?.includes("tristesse"), "son visage triste, pas encore fait, est demandé (il se fera une fois)");
ok((await route(ZOE, { action: "humeur", visage: "tristesse" })).ecrire === false, "la même humeur : rien ne change");
ok((await route(ZOE, { action: "humeur", visage: "joie" })).ecrire === true, "la troisième humeur du jour fait encore écrire");
await apresEcriture(ZOE);
const quatrieme = await route(ZOE, { action: "humeur", visage: "colere" });
ok(quatrieme.statut === 200 && quatrieme.ecrire === false && (await lireStock(`${ZOE.id}/humeur.json`))?.visage === "colere", "la quatrième : gardée, mais les figurines n'écrivent plus aujourd'hui");
ok((await route(ZOE, { action: "humeur", visage: "rire" })).ecrire === false, "(pas plus la cinquième)");

// ═══ LÉA CHOISIT LA SIENNE : EN HAUT DE LEUR CONVERSATION, CHEZ ZOÉ ═══
ok((await route(LEA, { action: "humeur", visage: "joie" })).ecrire === true, "Léa choisit la joie");
const rLea = await apresEcriture(LEA);
const deZoe = rLea.mots.find((m) => m.de.cle === ZOE.cle);
ok(Boolean(deZoe), "la figurine de Zoé lui a laissé un mot");
const avec = await voir(ZOE, `?avec=${LEA.cle}`);
ok(
  avec.statut === 200 && avec.avec?.sienne === "joie" && avec.avec?.mienne === "rire" && avec.avec?.pourLui?.texte === deZoe?.texte && avec.avec?.pourMoi?.de.cle === LEA.cle && !JSON.stringify({ ...avec.avec, pourMoi: { ...avec.avec?.pourMoi, de: null }, pourLui: { ...avec.avec?.pourLui, pour: null }, fin: { ...avec.avec?.fin, lui: null, moi: null } }).includes(LEA.id),
  `le rituel avec Léa : leurs deux humeurs, le mot de chaque figurine à l'autre (${JSON.stringify({ ...avec.avec, pourMoi: avec.avec?.pourMoi?.de.prenom, pourLui: avec.avec?.pourLui?.texte })})`,
);
await zoe.locator(`#o-proches .pr-carte[data-cle="${LEA.cle}"] .pr-mini`).click();
await zoe.waitForSelector(".pr-plein .rt-sienne", { timeout: 20000 }).catch(() => null);
const bandeau = await texte(zoe, ".pr-plein .rt-bandeau");
ok(
  bandeau.includes("Léa aujourd’hui : 😄 Joie") && bandeau.includes("La figurine de Léa t’a écrit · IA") && bandeau.includes("Ta figurine lui a écrit · IA") && !bandeau.includes("ton humeur du jour"),
  `en haut de leur conversation : l'humeur de Léa, le mot de chaque figurine (${bandeau})`,
);
ok(bandeau.includes("🌙 Cette nuit, vos figurines se sont dit · IA") && bandeau.includes("Sa figurine : Hier, c’était"), "et leur mot de la fin de cette nuit");
ok((await debordement(zoe)) <= 0 && (await sansMotInterdit(zoe)), "la conversation ne déborde pas, sans le mot interdit");
await capture(zoe, "8-bandeau");

// ═══ 🔔 L'ENVOI DU MATIN, PUIS LÉA EFFACE LEUR MOT DE LA FIN ═══
const telZoe = telephone("zoe-matin");
await json(`notif/abonnes/${ZOE.id}.json`, { h: ZOE.id, ville: "dax", abonnements: [telZoe.abonnement], le: new Date().toISOString() });
const matin = await (await fetch(`${BASE}/api/cron/rituel-matin?force=1`)).json();
ok(matin.ok && matin.personnes === 1 && matin.fins === 1 && matin.envoyes === 1, `l'envoi du matin : Zoé a un mot de la fin, elle est prévenue (${JSON.stringify(matin)})`);
let notifsMatin = [];
for (let k = 0; k < 20 && !notifsMatin.length; k++) {
  notifsMatin = await recus(telZoe);
  await new Promise((r) => setTimeout(r, 300));
}
ok(
  notifsMatin.length === 1 && notifsMatin[0].title === "🌙 Cette nuit, vos figurines se sont parlé" && notifsMatin[0].body === "Ta figurine et celle de Léa se sont laissé un dernier mot. Viens voir 👀" && notifsMatin[0].url === "/collection#proches",
  `« ${notifsMatin[0]?.title} » — « ${notifsMatin[0]?.body} »`,
);
const encore = await (await fetch(`${BASE}/api/cron/rituel-matin?force=1`)).json();
ok(encore.envoyes === 0 && (await recus(telZoe)).length === 1, "une fois par jour, pas deux");
ok((await route(LEA, { action: "effacer-fin", cle: ZOE.cle })).statut === 200, "Léa efface leur mot de la fin");
const apresFin = await voir(ZOE);
ok(apresFin.fins?.length === 0 && (await voir(ZOE, `?avec=${LEA.cle}`)).avec?.fin === null && (await lireStock(`fils/${pairDe(ZOE, LEA)}/fin/${hierJour}.json`))?.efface === LEA.id, "il part pour les deux (et ne revient pas)");
ok((await route(LEA, { action: "effacer-fin", cle: "0".repeat(16) })).statut === 404, "effacer chez un inconnu : rien");

// ═══ ET RIEN D'AUTRE ═══
ok((await fetch(`${BASE}/api/direct/rituel`)).status === 403, "sans figurine : rien");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nle rituel du jour tient ✓");
process.exit(echecs ? 1 : 0);
