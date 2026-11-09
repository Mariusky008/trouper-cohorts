// 🧭 LE TUTO DE CLIKME (9 novembre 2026, `app/collection/tuto.tsx`) — contre le faux Supabase, jamais la vraie base.
//
// Un nouveau venu : Pablito lui dit bienvenue, une seule fois (trois bulles, sa voix enregistrée ; la troisième met la
// lumière sur le logo : « Touche ici, quand tu veux »), puis « Je crée ma figurine ». Les pages n'ouvrent plus aucune
// fenêtre d'elles-mêmes. Inès, qui a sa figurine : pas de bienvenue ; un point rose sur le logo ; le logo ouvre la
// visite (six pages) ; « Créer » : Pablito la montre sur la vraie page, la lumière passe de sa phrase à « Visage »,
// aux intentions, à « Animer » ; « La suite : Découvrir » ; « Échap » arrête ; « Créer » est « Vue » ; « Retour »
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

// ═══ UN NOUVEAU VENU : LA BIENVENUE ═══
const neuf = await tel();
await neuf.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await neuf.waitForSelector(".tu .tu-carte", { timeout: 60000 });
ok((await texte(neuf, ".tu-texte")).length > 0 && (await neuf.locator(".tu-carte.grand .tu-pablito .mq").count()) === 1, "à la première arrivée : Pablito, en grand, dit bonjour");
await ecrite(neuf);
ok((await texte(neuf, ".tu-texte")) === "Salut ! Moi, c’est Pablito, le patron de ClikMe. Bienvenue !" && (await texte(neuf, ".tu-qui")).includes("1 / 3"), `la bulle 1, sur 3 (${await texte(neuf, ".tu-texte")})`);
ok(neuf.sons.includes("/collection/pablito/tuto-bienvenue-1.mp3"), `sa voix enregistrée part avec la bulle (${neuf.sons.join(", ")})`);
ok((await neuf.locator(".pb-voile, .mqd-revoir").count()) === 0, "plus aucune ancienne fenêtre de Pablito");
await neuf.screenshot({ path: `${D}/tuto-1-bienvenue.png` });
await suivant(neuf);
await ecrite(neuf);
ok((await texte(neuf, ".tu-texte")).startsWith("Ici, tu fabriques ta figurine à partir d’un selfie") && neuf.sons.includes("/collection/pablito/tuto-bienvenue-2.mp3"), "la bulle 2 : sa figurine, d'après un selfie (et sa voix)");
await suivant(neuf);
await ecrite(neuf);
const logo = await eclaire(neuf, ".mc-barre .mc-logo");
ok(
  (await texte(neuf, ".tu-texte")) === "Besoin de plus d’infos sur les fonctionnalités ? Touche ici, quand tu veux : je te fais visiter." && logo.ok && logo.serre && neuf.sons.includes("/collection/pablito/tuto-bienvenue-3.mp3"),
  `la bulle 3 : la lumière sur le logo, « Touche ici, quand tu veux » (lumière ${logo.l}, logo ${logo.e})`,
);
ok((await neuf.locator(".tu .tu-passer").count()) === 0 && (await texte(neuf, ".tu .tu-creer")).includes("Je crée ma figurine"), "à la fin : « Je crée ma figurine »");
await neuf.screenshot({ path: `${D}/tuto-2-le-logo.png` });
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
const phrase = await eclaire(ines, "#o-figurine #tf-parler .tf-texte");
ok((await texte(ines, ".tu-qui")).toLowerCase().includes("créer") && (await texte(ines, ".tu-texte")).startsWith("Ici, tu fais parler ta figurine") && phrase.ok, `1 / 4 : la lumière sur sa phrase (lumière ${phrase.l}, phrase ${phrase.e})`);
ok((await ines.locator(".mc-feuille-visite.ouverte").count()) === 0, "la feuille de la visite s'est rangée");
await ines.screenshot({ path: `${D}/tuto-4-creer-phrase.png` });
await suivant(ines);
const visage = await eclaire(ines, "#o-figurine .tf-g-visage");
ok((await texte(ines, ".tu-texte")).startsWith("« Visage »") && visage.ok && visage.serre, `2 / 4 : la lumière passe sur « Visage » (lumière ${visage.l}, bouton ${visage.e})`);
await ines.screenshot({ path: `${D}/tuto-5-creer-visage.png` });
await suivant(ines);
const intentions = await eclaire(ines, "#o-figurine .tr-intentions");
ok((await texte(ines, ".tu-texte")).startsWith("Pas d’idée ?") && intentions.ok, `3 / 4 : sur ce que tu veux exprimer (lumière ${intentions.l}, intentions ${intentions.e})`);
await suivant(ines);
const animer = await eclaire(ines, "#o-figurine .tf-g-animer");
ok((await texte(ines, ".tu-texte")).startsWith("« Animer »") && animer.ok && animer.serre, `4 / 4 : sur « Animer » (lumière ${animer.l}, bouton ${animer.e})`);
await ecrite(ines);
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
