// ✍️ ÉCRIRE, PARTAGER — l'écran du lot M1 (`app/collection/ecrire.tsx`, `docs/univers/messages-ecrits.md` sections 3
// et 4.1 à 4.3), contre le faux Supabase, jamais la vraie base.
//
// Léa et Zoé sont proches, sans message encore ; chacune ouvre leur conversation. LA BARRE : « ＋ » (🪧 un panneau ;
// l'appli d'avant, freinée, n'a ni mème ni cadeau), le champ « Écrire… », le micro (le champ est vide). Léa tape : la
// flèche remplace le micro, trois petites têtes au-dessus du champ (« haha » : le rire d'abord), chez Zoé sa figurine se
// penche ; elle touche « joie », envoie : son message dans le fil (✍️), sa figurine le dit dans la scène sans aucun son
// (les mots l'un après l'autre), « Juste le son » ne montre rien pour un écrit, « 🗑️ Effacer » sous son message. Chez Zoé,
// il arrive tout seul ; elle le revoit : la figurine de Léa, sa joie, sans son ; rien à effacer. UN LIEN (Entrée envoie,
// à l'ordinateur) : d'abord le lien tout simple, puis l'aperçu (l'image servie par chez nous, le titre, le site), chez les
// deux ; Zoé le touche : « Tu quittes ClikMe pour pages.essai.invalid » — « Annuler » n'ouvre rien, « Y aller » ouvre
// l'onglet. Une vidéo YouTube : la carte « vidéo » (▶, 🎬), un toucher l'ouvre sans détour. Trop long (1 001 signes) : le
// compteur, la flèche éteinte ; un mot interdit : la phrase des vocaux, le texte reste. Léa efface son premier message :
// parti pour les deux. La ligne de Léa chez Zoé, dans « Proches » : « T'a écrit : 🔗 Le clip de la fête ». Rien ne
// déborde, jamais le mot interdit, aucune erreur dans la page.
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

const qui = (n, prenom) => ({ id: `e5e5e5e5-0000-4000-8000-0000000014${String(n).padStart(2, "0")}`, jeton: `jeton-messages-m1-0000000000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const GENS = [LEA, ZOE];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${LEA.id}/proches.json`, { ids: [ZOE.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
const PAIRE = [LEA.id, ZOE.id].sort().join("_");

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (q) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  // (les sites qu'on ouvre depuis un lien : jamais le vrai réseau — on note l'adresse, on sert une page vide)
  ctx.ouverts = [];
  await ctx.route(/(essai\.invalid|youtube\.com)/, (r) => {
    ctx.ouverts.push(r.request().url());
    return r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>ailleurs</title>" });
  });
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const compte = (p, sel) => p.locator(sel).count();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const attendre = (p, f, arg, ms = 15000) => p.waitForFunction(f, arg, { timeout: ms }).then(() => true).catch(() => false);
/** Leur conversation, ouverte depuis « Proches ». */
async function ouvrirAvec(p, avec) {
  await p.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`, { timeout: 60000 });
  await p.locator(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  await p.waitForSelector(".pr-plein .pv-calque.lui", { state: "attached", timeout: 15000 });
}
const lecture = (p) => p.locator(".pr-plein .pr-scene .fqp").first().getAttribute("data-lecture").catch(() => "");

const lea = await tel(LEA);
const zoe = await tel(ZOE);
await ouvrirAvec(lea, ZOE);
await ouvrirAvec(zoe, LEA);

// ═══ LA BARRE : « ＋ », « ÉCRIRE… », LE MICRO ═══
ok(
  (await lea.locator(".pr-plein .pr-ecrire-champ").getAttribute("placeholder")) === "Écrire…" &&
    (await compte(lea, ".pr-plein .pr-ecrire-plus")) === 1 &&
    (await compte(lea, ".pr-plein .pr-ecrire-micro")) === 1 &&
    (await compte(lea, ".pr-plein .pr-ecrire-envoyer")) === 0 &&
    (await compte(lea, ".pr-plein .pr-ecrire-tetes")) === 0,
  "la barre : « ＋ », « Écrire… », le micro (le champ est vide), pas de têtes",
);
await lea.locator(".pr-plein .pr-ecrire-plus").click();
await lea.waitForSelector(".pr-feuille-plus.ouverte .pr-plus-choix", { timeout: 10000 }).catch(() => null);
const choix = await lea.locator(".pr-feuille-plus .pr-plus-choix").evaluateAll((l) => l.map((x) => x.dataset.plus));
ok(choix.join("|") === "panneau" && (await texte(lea, ".pr-feuille-plus .pr-plus-choix")).includes("Un panneau"), `« ＋ » : 🪧 un panneau (l'appli d'avant : ni mème ni cadeau) (${choix.join(" · ")})`);
await lea.locator(".pr-feuille-plus .tf-feuille-fermer").click();

// ═══ ✍️ LÉA TAPE : LA FLÈCHE, TROIS TÊTES ; CHEZ ZOÉ, SA FIGURINE SE PENCHE ═══
const MOT = "Haha trop drôle, on se voit samedi ?";
await lea.locator(".pr-plein .pr-ecrire-champ").fill(MOT);
const tetes = await lea.locator(".pr-plein .pr-ecrire-tetes button").evaluateAll((l) => l.map((x) => `${x.dataset.tete}${x.classList.contains("pris") ? "*" : ""}`));
ok(
  (await compte(lea, ".pr-plein .pr-ecrire-envoyer")) === 1 && (await compte(lea, ".pr-plein .pr-ecrire-micro")) === 0 && tetes.length === 3 && tetes[0] === "rire*",
  `elle tape : la flèche remplace le micro ; trois têtes, « haha » : le rire d'abord, pris d'office (${tetes.join(" · ")})`,
);
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pv-calque.lui .pv-prepare"))), "chez Zoé, la figurine de Léa se penche : elle écrit");
await lea.locator('.pr-plein .pr-ecrire-tetes button[data-tete="joie"]').click();
ok((await lea.locator(".pr-plein .pr-ecrire-tetes button.pris").getAttribute("data-tete")) === "joie", "un toucher : la joie");
await lea.screenshot({ path: `${D}/messages-1-barre.png` });

// ═══ ELLE ENVOIE : LE FIL, LA SCÈNE SANS SON ═══
await lea.locator(".pr-plein .pr-ecrire-envoyer").click();
await lea.waitForSelector(".pr-plein .pr-fil li.pr-ecrit-li.moi", { timeout: 15000 }).catch(() => null);
const pendant = await compte(lea, ".pr-plein .pr-scene .pr-dit-ecrit .pr-mot.cache");
const lectureLea = await lecture(lea);
ok(
  (await texte(lea, ".pr-plein .pr-fil li.pr-ecrit-li.moi .pr-ecrit-texte")) === MOT && (await texte(lea, ".pr-plein .pr-fil li.pr-ecrit-li.moi small")).startsWith("✍️"),
  "son message dans le fil, en entier (✍️, l'heure)",
);
ok(
  lectureLea === "muet" && (await lea.locator(".pr-plein .pr-scene").getAttribute("data-tete")) === "joie" && pendant > 0,
  `sa figurine le dit dans la scène, sans aucun son, avec la joie ; les mots apparaissent l'un après l'autre (${lectureLea} ; ${pendant} mot(s) encore à venir)`,
);
await lea.screenshot({ path: `${D}/messages-2-ecrit.png` });
ok(
  await attendre(lea, () => /^fini/.test(document.querySelector(".pr-plein .pr-scene .fqp")?.dataset.lecture ?? "") && !document.querySelector(".pr-plein .pr-dit-ecrit .pr-mot.cache")),
  "puis tous les mots sont là, c'est fini",
);
ok(
  (await texte(lea, ".pr-plein .pr-dit-ecrit")) === `« ${MOT} »` && (await lea.locator(".pr-plein .pr-ecrire-champ").inputValue()) === "" && (await compte(lea, ".pr-plein .pr-ecrire-micro")) === 1 && (await compte(lea, ".pr-plein .pr-ecrire-tetes")) === 0,
  "la bulle dit tout ; le champ est vide, le micro revient",
);
ok((await compte(lea, ".pr-plein .pr-fil li.moi .pr-effacer")) === 1, "« 🗑️ Effacer » sous son message");
await lea.locator(".pr-plein .pr-commandes button", { hasText: "Juste le son" }).click();
ok((await compte(lea, ".pr-plein .pr-scene .pr-son")) === 0, "« Juste le son » : rien, pour un écrit");
await lea.locator(".pr-plein .pr-commandes button", { hasText: "Juste le son" }).click();
ok(await attendre(zoe, () => !document.querySelector(".pr-plein .pv-calque.lui .pv-prepare"), null, 20000), "chez Zoé, elle ne se penche plus : c'est envoyé");

// ═══ CHEZ ZOÉ : IL ARRIVE TOUT SEUL ; ELLE LE REVOIT ═══
ok(await attendre(zoe, () => document.querySelectorAll(".pr-plein .pr-fil li.pr-ecrit-li.lui").length === 1, null, 25000), "chez Zoé, le message arrive tout seul");
ok((await texte(zoe, ".pr-plein .pr-fil li.pr-ecrit-li.lui .pr-ecrit-texte")) === MOT && (await compte(zoe, ".pr-plein .pr-effacer")) === 0, "en entier ; rien à effacer (ce n'est pas le sien)");
await zoe.locator(".pr-plein .pr-scene .pr-lire").click();
ok((await lecture(zoe)) === "muet" && (await zoe.locator(".pr-plein .pr-scene").getAttribute("data-tete")) === "joie", "elle le revoit : la figurine de Léa le dit, avec sa joie, sans son");
ok(await attendre(zoe, () => /^fini/.test(document.querySelector(".pr-plein .pr-scene .fqp")?.dataset.lecture ?? "")), "jusqu'au bout");

// ═══ 🔗 UN LIEN : D'ABORD TOUT SIMPLE, PUIS L'APERÇU ═══
await lea.locator(".pr-plein .pr-ecrire-champ").fill("Regarde ça : http://pages.essai.invalid/pages/film");
await lea.locator(".pr-plein .pr-ecrire-champ").press("Enter");
ok(await attendre(lea, () => document.querySelectorAll(".pr-plein .pr-fil li.pr-ecrit-li.moi").length === 2), "Entrée envoie (à l'ordinateur)");
ok((await texte(lea, ".pr-plein .pr-fil li.pr-ecrit-li.moi:last-of-type .pr-ecrit-texte .lien")) === "pages.essai.invalid/pages/film", "le lien, lisible, dans la bulle (sans « http:// »)");
const apercu = () => {
  const l = [...document.querySelectorAll(".pr-plein .pr-fil .ec-lien")].pop();
  return Boolean(l?.querySelector("img") && l.textContent.includes("Le Grand Bleu"));
};
ok(await attendre(lea, apercu, null, 30000), "l'aperçu arrive tout seul : l'image, le titre");
const carte = ".pr-plein .pr-fil li.pr-ecrit-li.moi:last-of-type .ec-lien";
const imageCarte = await lea.locator(`${carte} img`).getAttribute("src");
const [titreCarte, siteCarte] = [await texte(lea, `${carte} b`), await texte(lea, `${carte} small`)];
ok(
  /^http/.test(imageCarte ?? "") && !imageCarte.includes("essai.invalid") && titreCarte === "Le Grand Bleu — la bande-annonce" && siteCarte === "🔗 pages.essai.invalid",
  `l'image est servie par chez nous (jamais par le site), le titre, le site (${titreCarte} · ${siteCarte} · ${String(imageCarte).slice(0, 60)})`,
);
ok(await attendre(zoe, apercu, null, 30000), "chez Zoé aussi");
await zoe.screenshot({ path: `${D}/messages-3-lien.png` });

// ═══ « TU QUITTES CLIKME POUR… » ═══
const ctxZoe = zoe.context();
await zoe.locator(".pr-plein .pr-fil li.pr-ecrit-li.lui:last-of-type .ec-lien").click();
await zoe.waitForSelector(".fen #fen-titre", { timeout: 10000 }).catch(() => null);
const [titreDepart, ouiDepart] = [await texte(zoe, ".fen #fen-titre"), await texte(zoe, ".fen .fen-oui")];
ok(titreDepart === "Tu quittes ClikMe pour pages.essai.invalid" && ouiDepart === "Y aller", `un site inconnu : « Tu quittes ClikMe pour pages.essai.invalid », « Y aller » (${titreDepart} · ${ouiDepart})`);
await zoe.screenshot({ path: `${D}/messages-4-depart.png` });
const pagesAvant = ctxZoe.pages().length;
await zoe.locator(".fen .fen-non").click();
await zoe.waitForTimeout(600);
ok(ctxZoe.pages().length === pagesAvant && !ctxZoe.ouverts.some((u) => u.includes("/pages/film")), "« Annuler » : rien ne s'ouvre");
await zoe.locator(".pr-plein .pr-fil li.pr-ecrit-li.lui:last-of-type .ec-lien").click();
await zoe.waitForSelector(".fen .fen-oui", { timeout: 10000 }).catch(() => null);
const onglet = ctxZoe.waitForEvent("page", { timeout: 10000 }).catch(() => null);
await zoe.locator(".fen .fen-oui").click();
const ailleurs = await onglet;
await ailleurs?.waitForLoadState().catch(() => null);
ok(Boolean(ailleurs) && ctxZoe.ouverts.some((u) => u === "http://pages.essai.invalid/pages/film"), "« Y aller » : le site, dans un nouvel onglet");
await ailleurs?.close().catch(() => null);

// ═══ 🎬 UNE VIDÉO YOUTUBE : LA CARTE « VIDÉO », SANS DÉTOUR ═══
const idVideo = "m1video00001";
const ts = Date.now();
await deposer(`fils/${PAIRE}/a/${idVideo}.webp`, img("pied/montre"), "image/webp");
await json(`fils/${PAIRE}/m/${String(ts).padStart(13, "0")}-${qui8(LEA.id)}-${idVideo}.json`, {
  id: idVideo,
  de: LEA.id,
  le: new Date(ts).toISOString(),
  genre: "ecrit",
  texte: "https://www.youtube.com/watch?v=essai",
  tete: "joie",
  lien: { url: "https://www.youtube.com/watch?v=essai", site: "youtube.com", sorte: "video", titre: "Le clip de la fête", image: `fils/${PAIRE}/a/${idVideo}.webp` },
});
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pr-fil .ec-lien.video img")), null, 25000), "chez Zoé, la vidéo arrive : la carte « vidéo », son affiche");
ok((await compte(zoe, ".pr-plein .ec-lien.video .ec-lien-image i")) === 1 && (await texte(zoe, ".pr-plein .ec-lien.video small")) === "🎬 youtube.com", "▶ sur l'affiche, « 🎬 youtube.com »");
await zoe.screenshot({ path: `${D}/messages-5-video.png` });
const ongletVideo = ctxZoe.waitForEvent("page", { timeout: 10000 }).catch(() => null);
await zoe.locator(".pr-plein .ec-lien.video").click();
const video = await ongletVideo;
await video?.waitForLoadState().catch(() => null);
ok(Boolean(video) && (await compte(zoe, ".fen")) === 0 && ctxZoe.ouverts.some((u) => u.startsWith("https://www.youtube.com/watch")), "un toucher l'ouvre, sans « Tu quittes ClikMe » (un site connu)");
await video?.close().catch(() => null);
await zoe.locator(".pr-plein .pr-fil li.pr-ecrit-li.lui:last-of-type button.pr-ecrit").click();
ok((await texte(zoe, ".pr-plein .pr-dit-ecrit")) === "« 🔗 Le clip de la fête »", `un lien seul : dans la bulle, sa figurine dit son titre, pas l'adresse (${await texte(zoe, ".pr-plein .pr-dit-ecrit")})`);

// ═══ CE QUE LA BARRE REFUSE ═══
await lea.locator(".pr-plein .pr-ecrire-champ").fill("a".repeat(950));
ok((await texte(lea, ".pr-plein .pr-ecrire-compte")) === "950 / 1000", "950 signes : le compteur");
await lea.locator(".pr-plein .pr-ecrire-champ").fill("a".repeat(1001));
ok((await texte(lea, ".pr-plein .pr-ecrire-compte.trop")) === "Un message de 1 000 signes au plus." && (await lea.locator(".pr-plein .pr-ecrire-envoyer").isDisabled()), "1 001 signes : « Un message de 1 000 signes au plus. », la flèche éteinte");
await lea.locator(".pr-plein .pr-ecrire-champ").fill("T'es vraiment un connard");
await lea.locator(".pr-plein .pr-ecrire-envoyer").click();
await lea.waitForSelector(".pr-plein .pr-ecrire .pr-erreur", { timeout: 10000 }).catch(() => null);
ok((await texte(lea, ".pr-plein .pr-ecrire .pr-erreur")) === "Ça, ta figurine ne le dit pas. Réessaie autrement 🙂" && (await lea.locator(".pr-plein .pr-ecrire-champ").inputValue()) === "T'es vraiment un connard", "un mot interdit : la phrase des vocaux, son texte reste");
await lea.locator(".pr-plein .pr-ecrire-champ").fill("");

// ═══ 🗑️ LÉA EFFACE SON PREMIER MESSAGE : POUR LES DEUX ═══
await lea.locator(".pr-plein .pr-fil li.pr-ecrit-li.moi").first().locator("button.pr-ecrit").click();
await lea.waitForTimeout(300);
ok((await compte(lea, ".pr-plein .pr-fil li.pr-ecrit-li.moi:first-of-type .pr-effacer")) === 1 && (await compte(lea, ".pr-plein .pr-fil .pr-effacer")) === 1, "choisi : « 🗑️ Effacer » sous ce message seulement");
await lea.locator(".pr-plein .pr-fil .pr-effacer").click();
await lea.waitForSelector(".fen #fen-titre", { timeout: 10000 }).catch(() => null);
ok((await texte(lea, ".fen #fen-titre")) === "Effacer ce message ?" && (await texte(lea, ".fen #fen-texte")) === "Il disparaît pour vous deux.", "« Effacer ce message ? », « Il disparaît pour vous deux. »");
await lea.locator(".fen .fen-oui").click();
ok(await attendre(lea, (m) => ![...document.querySelectorAll(".pr-plein .pr-fil .pr-ecrit-texte")].some((x) => x.textContent === m), MOT), "parti de son fil");
const filZoe = await (await fetch(`${BASE}/api/direct/proches?fil=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${ZOE.jeton}` } })).json();
ok(Array.isArray(filZoe.fil?.messages) && filZoe.fil.messages.length === 2 && !filZoe.fil.messages.some((m) => m.texte === MOT) && filZoe.fil.ecrire === true, `et de celui de Zoé (${filZoe.fil?.messages?.length} message(s) restent)`);

// ═══ LA LIGNE DE LÉA, CHEZ ZOÉ ═══
await zoe.locator(".pr-plein .pr-retour").first().click();
await attendre(zoe, (c) => (document.querySelector(`#o-proches .pr-carte[data-cle="${c}"] .pr-dernier`)?.textContent ?? "").includes("🔗"), LEA.cle);
const ligne = await texte(zoe, `#o-proches .pr-carte[data-cle="${LEA.cle}"] .pr-dernier`);
ok(ligne.startsWith("T’a écrit : 🔗 Le clip de la fête"), `dans « Proches » : « T'a écrit : 🔗 Le clip de la fête » (${ligne})`);

// ═══ PARTOUT ═══
for (const [nom, p] of [["Léa", lea], ["Zoé", zoe]]) {
  ok(p.err.length === 0, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err[0]})` : ""}`);
  ok((await debordement(p)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
}

await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
