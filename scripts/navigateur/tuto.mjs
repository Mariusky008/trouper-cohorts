// 🧭 LE TUTO DE CLIKME (9 novembre 2026, `app/collection/tuto.tsx`) — contre le faux Supabase, jamais la vraie base.
//
// Un nouveau venu : la bienvenue refaite pour l'univers (13 novembre 2026, `app/collection/bienvenue.tsx`), une seule
// fois — une conversation avec Pablito, on touche sa question, il répond (six bulles, ses six voix enregistrées), et
// au-dessus l'univers grandit (l'univers commun, l'étagère qui se remplit, les endroits et la porte, Léa qui frappe, le
// chemin) ; un toucher sur la conversation écrit la bulle d'un coup ; puis « Je crée ma figurine ». Les pages n'ouvrent
// plus aucune fenêtre d'elles-mêmes. Inès, qui a sa figurine : pas de bienvenue ; un point rose sur le logo ; le logo ouvre la
// visite (six pages) ; « Créer » : Pablito la montre sur la vraie page, la lumière suit ses trois étapes (9 novembre
// 2026) — sa phrase, les tons et les trois façons, « son visage moi-même », sa voix et « Créer mon mème » ; « La suite : Découvrir » ; « Échap » arrête ; « Créer » est « Vue » ; « Retour »
// pendant une page arrête la visite. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import fs from "node:fs";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const INES = { id: "abababab-0000-4000-8000-000000000903", jeton: "jeton-ines-tuto-0001", prenom: "Inès" };
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);

// ─── Inès et sa figurine ───
await semer("human_habitants", [{ id: INES.id, device_token: INES.jeton, prenom: INES.prenom, ville_slug: "dax" }]);
await deposer(`${INES.id}/neutre-essai.webp`, img("pied/salut-1"), "image/webp");
await deposer(`${INES.id}/parle-essai.webp`, img("pied/parle-1"), "image/webp");
await semer("clik_ma_figurine", [{ habitant_id: INES.id, prenom: INES.prenom, photo: `${INES.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${INES.id}/neutre-essai.webp`, parle: `${INES.id}/parle-essai.webp`, prete_le: new Date().toISOString() }]);
await deposer(`${INES.id}/majeur.json`, JSON.stringify({ le: new Date().toISOString(), age: 15 }), "application/json");

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const erreurs = [];
const tel = async (cookie) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  if (cookie) await ctx.addCookies([{ name: "clikme_habitant", value: cookie, url: BASE }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.sons = [];
  p.on("request", (r) => /\/collection\/pablito\/.+\.mp3/.test(r.url()) && p.sons.push(new URL(r.url()).pathname));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
/** La bulle a fini de s'écrire. */
const ecrite = (p) => p.waitForFunction(() => document.querySelector(".tu .tu-carte") && !document.querySelector(".tu .tu-curseur"), null, { timeout: 15000 });
const suivant = async (p) => {
  await ecrite(p);
  await p.locator(".tu .tu-suivant").click();
  await p.waitForTimeout(450);
};
/** La lumière entoure-t-elle cet élément (à la marge près), une fois posée ? */
const eclaire = async (p, sel) => {
  await p.waitForTimeout(700);
  return p.evaluate((s) => {
    const l = document.querySelector(".tu-lumiere")?.getBoundingClientRect();
    const e = [...document.querySelectorAll(s)].map((x) => x.getBoundingClientRect()).find((r) => r.width > 0 && r.height > 0);
    if (!l || !e) return { ok: false, l: l && [l.x, l.y, l.width, l.height].map(Math.round), e: e && [e.x, e.y, e.width, e.height].map(Math.round) };
    const dedans = l.left <= e.left + 1 && l.top <= e.top + 1 && l.right >= e.right - 1 && l.bottom >= e.bottom - 1;
    const serre = l.width <= e.width + 16 && l.height <= e.height + 16;
    return { ok: dedans, serre, l: [l.x, l.y, l.width, l.height].map(Math.round), e: [e.x, e.y, e.width, e.height].map(Math.round) };
  }, sel);
};

// ═══ UN NOUVEAU VENU : LA BIENVENUE (la conversation avec Pablito, l'univers qui grandit) ═══
const BULLES = [
  ["Salut ! Moi, c’est Pablito, le patron de ClikMe. Bienvenue !", "tuto-bienvenue-1", "C’est quoi, ClikMe ?"],
  ["ClikMe, c’est un peu comme WhatsApp : tu parles avec tes proches. Mais ici, vos conversations créent un univers commun entre vous.", "tuto-univers-2", "C’est-à-dire ?"],
  ["Chaque personne a sa figurine, faite à partir de son selfie. Au fil de vos conversations, elle range tout : les souvenirs, les rappels, les infos.", "tuto-univers-3", "Et quoi d’autre ?"],
  ["Ton univers s’agrandit à chaque conversation. De nouveaux endroits apparaissent, certains secrets, avec des portes que tu n’ouvres qu’à qui tu veux.", "tuto-univers-4", "Et ensuite ?"],
  ["Petit à petit, il te définit mieux que tu ne pourrais l’imaginer. Tes proches peuvent le visiter… et toi, visiter les leurs.", "tuto-univers-5", "Ça commence comment ?"],
  ["Par toi ! Un selfie pour ta figurine, puis on discute cinq minutes, et je dessine les premiers endroits de ton univers.", "tuto-univers-6", null],
];
/** Sa bulle est dite (écrite en entier) ; son texte. */
const dite = async (p) => {
  await p.waitForSelector('.tu.bv[data-dit="oui"]', { timeout: 20000 });
  return (await p.locator(".bv-msg.pablito .bv-texte").last().innerText()).replace(/\s+/g, " ").trim();
};
/** Ce qu'on voit d'un élément de la scène (son opacité, une fois posée). */
const opacite = (p, sel) => p.evaluate((s) => Number(getComputedStyle(document.querySelector(s)).opacity), sel);
const neuf = await tel();
await neuf.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await neuf.waitForSelector(".tu.bv", { timeout: 60000 });
ok((await neuf.locator(".tu.bv .bv-ecrit").count()) === 1, "à la première arrivée : « Pablito écrit… », comme dans une conversation");
ok((await neuf.locator(".tu.bv .bv-pablito .mq").count()) === 1 && (await neuf.locator(".tu.bv .bv-points i").count()) === 6, "Pablito, en grand, salue ; six points pour six bulles");
let dit = await dite(neuf);
ok(dit === BULLES[0][0] && (await neuf.locator(".bv-msg.pablito .bv-qui").innerText()) === "Pablito", `la bulle 1, signée Pablito (${dit})`);
ok(neuf.sons.includes(`/collection/pablito/${BULLES[0][1]}.mp3`), `sa voix enregistrée part avec la bulle (${neuf.sons.join(", ")})`);
ok((await neuf.locator(".pb-voile, .mqd-revoir").count()) === 0, "plus aucune ancienne fenêtre de Pablito");
await neuf.screenshot({ path: `${D}/tuto-1-bienvenue.png` });
for (let k = 1; k < BULLES.length; k++) {
  const question = BULLES[k - 1][2];
  ok((await texte(neuf, ".tu.bv .bv-repondre")) === question, `sa réponse à toucher : « ${question} »`);
  await neuf.locator(".tu.bv .bv-repondre").click();
  await neuf.waitForSelector(`.tu.bv[data-rang="${k + 1}"].d${k + 1}`, { timeout: 10000 });
  ok((await neuf.locator(".bv-msg.moi").count()) === k && (await neuf.locator(".bv-msg.moi .bv-bulle").last().innerText()).includes(question), `sa question part dans la conversation, comme un message (${k})`);
  if (k === 1) {
    // (un toucher sur la conversation pendant qu'il écrit : la bulle s'écrit d'un coup)
    await neuf.waitForSelector(".bv-curseur", { timeout: 10000 });
    await neuf.locator(".tu.bv .bv-fil").click({ position: { x: 20, y: 20 } });
    ok((await neuf.locator('.tu.bv[data-dit="oui"]').count()) === 1, "un toucher sur la conversation : la bulle s'écrit d'un coup");
  }
  dit = await dite(neuf);
  ok(dit === BULLES[k][0] && neuf.sons.includes(`/collection/pablito/${BULLES[k][1]}.mp3`), `la bulle ${k + 1}, et sa voix (${BULLES[k][1]}) : ${dit.slice(0, 50)}…`);
  if (k === 1) {
    await neuf.waitForTimeout(1800);
    ok((await opacite(neuf, ".bv-ile")) === 1 && (await opacite(neuf, ".bv-dit.lea")) === 1 && (await opacite(neuf, ".bv-pablito")) === 0, "l'univers commun apparaît entre les deux figurines, qui se parlent");
  }
  if (k === 2) {
    await neuf.waitForTimeout(3200);
    ok((await opacite(neuf, ".bv-etagere")) === 1 && (await opacite(neuf, ".bv-obj.v1")) === 1 && (await opacite(neuf, ".bv-obj.v2")) === 1 && (await texte(neuf, ".bv-etiquettes")).includes("Jeudi : ciné"), "l'étagère : un souvenir, puis un rappel et une info venus de la conversation");
    await neuf.screenshot({ path: `${D}/tuto-2-etagere.png` });
  }
  if (k === 3) {
    await neuf.waitForTimeout(3000);
    const lieux = await neuf.locator(".bv-lieu").evaluateAll((l) => l.filter((x) => Number(getComputedStyle(x).opacity) > 0.9).map((x) => x.innerText.replace(/\s+/g, " ").trim()));
    ok(lieux.length === 6 && lieux.some((x) => x.includes("Un endroit secret")) && lieux.some((x) => x.includes("Ta porte")), `l'univers s'agrandit : six endroits, dont un secret et ta porte (${lieux.join(" · ")})`);
    const avant = await texte(neuf, ".bv-acces span");
    await neuf.waitForTimeout(1600);
    const apres = await texte(neuf, ".bv-acces span");
    ok(avant !== apres && /Tout le monde|Mes proches|Sur demande|Rien que moi/.test(apres), `qui peut entrer : les réglages de la porte défilent (${avant} → ${apres})`);
    await neuf.screenshot({ path: `${D}/tuto-3-univers.png` });
  }
  if (k === 4) {
    await neuf.waitForTimeout(2200);
    ok((await texte(neuf, ".bv-toc")).includes("Léa frappe à ta porte") && (await opacite(neuf, ".bv-lieu.l-concert")) === 1 && (await opacite(neuf, ".bv-acces")) === 0, "Léa frappe à ta porte ; un nouvel endroit apparaît");
  }
}
await neuf.waitForTimeout(2000);
ok((await opacite(neuf, ".bv-chemin .bv-etape:last-child")) === 1 && (await texte(neuf, ".bv-chemin")).includes("Ton selfie"), "le chemin : ton selfie, ta figurine, 5 minutes avec Pablito, ton univers");
ok((await neuf.locator(".tu .tu-passer").count()) === 0 && (await texte(neuf, ".tu .tu-creer")).includes("Je crée ma figurine") && (await neuf.locator(".tu .bv-plus-tard").count()) === 1, "à la fin : « Je crée ma figurine », ou « Plus tard »");
ok((await texte(neuf, ".tu .bv-indice")).includes("Touche le logo ClikMe"), "et le logo pour la suite (« Touche le logo ClikMe, en haut »)");
ok((await neuf.evaluate(() => { const f = document.querySelector(".bv-fil"); return f.scrollHeight - f.scrollTop - f.clientHeight; })) <= 2, "la conversation reste en bas : sa dernière bulle se lit");
await neuf.screenshot({ path: `${D}/tuto-4-la-fin.png` });
await neuf.locator(".tu .tu-creer").click();
await neuf.waitForTimeout(600);
ok((await neuf.locator(".tu").count()) === 0 && neuf.url().endsWith("#creer") && (await neuf.locator("#creer.tf-quete").count()) === 1, "« Je crée ma figurine » : la bienvenue s'en va, la page de sa figurine");
ok((await neuf.evaluate(() => localStorage.getItem("clikme-tuto-bienvenue"))) === "1" && (await neuf.locator(".mc-logo .mc-logo-point").count()) === 1, "retenue sur ce téléphone ; un point rose sur le logo");
await neuf.reload({ waitUntil: "networkidle" });
await neuf.waitForSelector("main.mc[data-charge]", { timeout: 30000 });
await neuf.waitForTimeout(600);
ok((await neuf.locator(".tu").count()) === 0, "revenu : plus de bienvenue (une seule fois)");
ok((await debordement(neuf)) <= 0 && (await sansMotInterdit(neuf)), "sans débordement, sans le mot interdit");

// ═══ INÈS, QUI A SA FIGURINE : LE LOGO OUVRE LA VISITE ═══
const ines = await tel(INES.jeton);
await ines.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
await ines.waitForSelector(".tf-moi .tf-texte textarea", { timeout: 60000 });
await ines.waitForTimeout(600);
ok((await ines.locator(".tu, .pb-voile, .mqd-revoir").count()) === 0, "elle a sa figurine : pas de bienvenue, aucune fenêtre dans la page");
ok((await ines.locator(".mc-logo .mc-logo-point").count()) === 1, "un point rose sur le logo : la visite n'a jamais été ouverte");
await ines.locator(".mc-barre .mc-logo").click();
await ines.waitForSelector(".mc-feuille-visite.ouverte .tu-page", { timeout: 10000 });
const pages = await ines.locator(".mc-feuille-visite .tu-page").evaluateAll((l) => l.map((x) => x.dataset.page));
ok(pages.join(",") === "creer,decouvrir,autour,memes,proches,moi", `la visite : six pages (${pages.join(", ")})`);
ok((await texte(ines, ".mc-feuille-visite")).includes("Je te fais visiter ? Touche une page : je te la montre sur place.") && (await texte(ines, ".tu-som-progres")).includes("0 page vue sur 6"), "sa bulle, et « 0 page vue sur 6 »");
ok((await ines.locator(".mc-logo .mc-logo-point").count()) === 0 && (await ines.evaluate(() => localStorage.getItem("clikme-tuto-visite"))) === "1", "ouverte une fois : le point rose s'en va");
await ines.waitForTimeout(400);
ok(ines.sons.includes("/collection/pablito/tuto-visite-1.mp3"), `sa voix : « Je te fais visiter ? » (${ines.sons.join(", ")})`);
ok((await debordement(ines)) <= 0 && (await sansMotInterdit(ines)), "la visite ne déborde pas, sans le mot interdit");
await ines.screenshot({ path: `${D}/tuto-3-visite.png` });

// ═══ « CRÉER » : PABLITO LA MONTRE SUR LA VRAIE PAGE ═══
await ines.locator('.mc-feuille-visite .tu-page[data-page="creer"]').click();
await ines.waitForSelector('.tu[data-rang="1"]', { timeout: 10000 });
await ecrite(ines);
const phrase = await eclaire(ines, "#o-figurine .tf-dit");
ok((await texte(ines, ".tu-qui")).toLowerCase().includes("créer") && (await texte(ines, ".tu-texte")).startsWith("Ici, tu fais parler ta figurine") && phrase.ok && ines.sons.includes("/collection/pablito/tuto-creer-1.mp3"), `1 / 4 : la lumière sur ce qu'elle dit (lumière ${phrase.l}, ce qu'elle dit ${phrase.e})`);
ok((await ines.locator(".mc-feuille-visite.ouverte").count()) === 0, "la feuille de la visite s'est rangée");
await ines.screenshot({ path: `${D}/tuto-4-creer-phrase.png` });
await suivant(ines);
const visage = await eclaire(ines, "#o-figurine .tf-visages");
ok((await texte(ines, ".tu-texte")).startsWith("« Visage »") && visage.ok && visage.serre && ines.sons.includes("/collection/pablito/tuto-creer-2.mp3"), `2 / 4 : la rangée de ses visages (lumière ${visage.l}, rangée ${visage.e} ; sa voix, celle de « Visage »)`);
await ines.screenshot({ path: `${D}/tuto-5-creer-visage.png` });
await suivant(ines);
const idee = await eclaire(ines, "#o-figurine .tf-pas-idee");
ok((await texte(ines, ".tu-texte")).startsWith("Pas d’idée ?") && idee.ok && ines.sons.includes("/collection/pablito/tuto-creer-3.mp3"), `3 / 4 : « Pas d'idée ? » (lumière ${idee.l}, bouton ${idee.e})`);
await suivant(ines);
const leBut = await eclaire(ines, "#o-figurine .tf-envoi");
const reagir = await eclaire(ines, "#o-figurine .tf-reagir-lien");
ok((await texte(ines, ".tu-texte")).includes("« Créer mon mème »") && leBut.ok && reagir.ok, `4 / 4 : « Créer mon mème », et « Réagir en un toucher » juste dessous (lumière ${leBut.l})`);
await ecrite(ines);
ok(ines.sons.includes("/collection/pablito/tuto-creer-4c.mp3") && !ines.sons.includes("/collection/pablito/tuto-creer-4.mp3"), "la dernière bulle, réécrite, a sa voix (son nouvel enregistrement, jamais l'ancien, qui parlait d'« Animer »)");
ok((await texte(ines, ".tu .tu-fin")).includes("La suite : Découvrir") && (await texte(ines, ".tu .tu-fin")).includes("C’est compris"), "à la fin : « La suite : Découvrir », ou « C'est compris »");
ok((await debordement(ines)) <= 0 && (await sansMotInterdit(ines)), "la visite de « Créer » ne déborde pas, sans le mot interdit");
await ines.screenshot({ path: `${D}/tuto-6-creer-fin.png` });

// ═══ LA SUITE : « DÉCOUVRIR » ; « ÉCHAP » ARRÊTE ═══
await ines.locator(".tu .tu-fin .tu-suivant").click();
await ines.waitForFunction(() => document.querySelector(".mc-nav button.pris")?.className.includes("mc-nav-decouvrir"), null, { timeout: 10000 }).catch(() => null);
await ines.waitForSelector('.tu[data-rang="1"]', { timeout: 10000 });
ok((await ines.locator(".mc-nav-decouvrir.pris").count()) === 1 && (await texte(ines, ".tu-qui")).toLowerCase().includes("découvrir"), "la suite : on passe sur « Découvrir », Pablito continue");
await ines.screenshot({ path: `${D}/tuto-7-decouvrir.png` });
await ines.keyboard.press("Escape");
await ines.waitForTimeout(300);
ok((await ines.locator(".tu").count()) === 0 && (await ines.locator(".mc-nav-decouvrir.pris").count()) === 1, "« Échap » arrête la visite ; la page reste");
ok((await ines.locator(".pb-voile, .mqd-revoir").count()) === 0, "« Découvrir » n'ouvre plus de fenêtre d'elle-même");
await ines.locator(".mc-barre .mc-logo").click();
await ines.waitForSelector(".mc-feuille-visite.ouverte .tu-page", { timeout: 10000 });
const etats = await ines.locator(".mc-feuille-visite .tu-page").evaluateAll((l) => l.map((x) => `${x.dataset.page}:${x.classList.contains("vue") ? "vue" : "non"}`));
ok(etats[0] === "creer:vue" && etats[1] === "decouvrir:non" && (await texte(ines, ".tu-som-progres")).includes("1 page vue sur 6") && (await texte(ines, ".tu-tout")).includes("Continuer la visite"), `« Créer » est vue, « Découvrir » (arrêtée) ne l'est pas (${etats.join(" ")})`);

// ═══ « PROCHES », PUIS « RETOUR » ═══
await ines.locator('.mc-feuille-visite .tu-page[data-page="proches"]').click();
await ines.waitForSelector('.tu[data-rang="1"]', { timeout: 10000 });
await ines.waitForTimeout(800);
ok((await ines.locator(".mc-nav-proches.pris").count()) === 1 && (await texte(ines, ".tu-qui")).toLowerCase().includes("proches"), "« Proches » : on y va, Pablito explique");
await ines.goBack();
await ines.waitForTimeout(600);
ok((await ines.locator(".tu").count()) === 0 && new URL(ines.url()).pathname === "/collection", `« Retour » arrête la visite, sans quitter l'appli (${ines.url()})`);

// ═══ « MOI » ET « MES MÈMES » : PLUS DE FENÊTRE, LEURS BOUTONS SONT DANS LA PAGE ═══
await ines.locator(".mc-barre button.mc-moi").click();
await ines.waitForSelector("#o-personnage .mp-lancer", { timeout: 30000 });
ok((await ines.locator(".pb-voile, .mqd-revoir").count()) === 0 && (await texte(ines, "#o-personnage")).includes("Quel personnage es-tu"), "« Moi » : plus de fenêtre, « Lancer le test » est dans la page");
await ines.locator(".mc-nav-memes").click();
await ines.waitForTimeout(1200);
ok((await ines.locator(".pb-voile, .mqd-revoir").count()) === 0, "« Mes mèmes » : plus de fenêtre");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
