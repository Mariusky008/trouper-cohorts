// 🎬 TROIS FAÇONS DE LE DIRE (8 novembre 2026, `lib/direct/rendus.ts`, `app/collection/trois-rendus.tsx`), contre le faux
// Supabase et sa fausse IA de texte — jamais la vraie base.
//
// Zoé a sa figurine, et trois visages déjà faits (le fou rire, la tristesse, la grimace) en plus de la joie. Dans
// « Créer », elle écrit « J’avais dit que je ne sortirais pas ce soir… » : trois vignettes arrivent — 😂 En BD, 🎭 En film,
// 🌀 En affiche (« Humour », « Dramatique », « Décalé » jusqu'au 9 novembre 2026) —, chacune avec UN AUTRE VISAGE de sa figurine (elle rit en douce, se
// désole, grimace), dessinées par le même code que la vidéo. La fausse IA a bien lu sa phrase (et rien d'autre). Elle
// choisit « Dramatique » : sa figurine prend la tête de la tristesse ; son mème se fabrique EN CINÉMA (les bandes noires
// de la vidéo le disent), et son graphisme est gardé à côté du message (la mesure). Les intentions sont une aide :
// « 🎉 Célébrer », sans phrase, en propose une (un autre toucher : la suivante) ; « 🎲 Trois autres » fait tourner les
// visages ; un toucher sur la vignette choisie revient au mème simple. Rien ne déborde, jamais le mot interdit, aucune
// erreur dans la page.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { BASE, D, F, etapeCreer, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const IA = F.replace("/rest/v1", "/__ia");
const ZOE = { id: "abababab-0000-4000-8000-000000000501", jeton: "jeton-zoe-trois-rendus-0001", prenom: "Zoé" };
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);

// ─── Zoé, sa figurine, et ses visages ───
await semer("human_habitants", [{ id: ZOE.id, device_token: ZOE.jeton, prenom: ZOE.prenom, ville_slug: "dax" }]);
const neutre = `${ZOE.id}/neutre-essai.webp`;
await deposer(neutre, img("pied/salut-1"), "image/webp");
await deposer(`${ZOE.id}/parle-essai.webp`, img("pied/parle-1"), "image/webp");
await semer("clik_ma_figurine", [{ habitant_id: ZOE.id, prenom: ZOE.prenom, photo: `${ZOE.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre, parle: `${ZOE.id}/parle-essai.webp`, prete_le: new Date().toISOString() }]);
await deposer(`${ZOE.id}/majeur.json`, JSON.stringify({ le: new Date().toISOString(), age: 15 }), "application/json");
const dossier = `${ZOE.id}/expr-${createHash("sha1").update(neutre).digest("hex").slice(0, 16)}`;
const VISAGES = { joie: "pied/salut-2", rire: "content", tristesse: "ecoute", grimace: "reflechit" };
for (const [cle, nom] of Object.entries(VISAGES)) {
  await deposer(`${dossier}/${cle}-n.webp`, img(nom), "image/webp");
  await deposer(`${dossier}/${cle}-p.webp`, img(nom), "image/webp");
}

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: "clikme_habitant", value: ZOE.jeton, url: BASE }]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const etiquettes = async () => (await p.locator(".tr-choix .tr-rendu").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());

// ═══ PAR LA ROUTE : SA PHRASE, LUE PAR LA FAUSSE IA ═══
const route = async (corps) => {
  const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${ZOE.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const PHRASE = "J’avais dit que je ne sortirais pas ce soir…";
const r1 = await route({ action: "rendus", texte: PHRASE });
ok(
  r1.statut === 200 && r1.par === "ia" && r1.rendus?.map((r) => `${r.style}:${r.visage}`).join(" ") === "bd:rire cinema:tristesse affiche:grimace" && r1.rendus[0].onomatopee === "HAHA !",
  `trois interprétations, trois visages : ${r1.rendus?.map((r) => `${r.style} ${r.visage}`).join(" · ")} (par ${r1.par})`,
);
const consignes = await (await fetch(IA)).json();
const laConsigne = consignes.findLast((c) => c.includes("TROIS INTERPRÉTATIONS")) ?? "";
ok(laConsigne.includes(PHRASE) && !laConsigne.includes(ZOE.prenom), "la fausse IA n'a lu que sa phrase (pas son prénom)");
const r2 = await route({ action: "rendus", texte: PHRASE, tour: 1 });
ok(r2.statut === 200 && r2.par === "regles" && r2.rendus?.[0].visage !== r1.rendus?.[0].visage, `« 🎲 Trois autres » : les visages tournent, sans rappeler l'IA (${r2.rendus?.map((r) => r.visage).join(", ")})`);
ok((await route({ action: "rendus", texte: "" })).statut === 400, "sans phrase : rien");

// ═══ DANS « CRÉER » ═══
await p.goto(`${BASE}/collection?v=${Date.now()}#figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".tf-moi .tf-texte textarea", { timeout: 60000 });
await fermerPablito(p, "#o-figurine");
// (9 novembre 2026 : l'étape ② « Comment elle le dit » porte le titre — « Facultatif : choisis le ton, je te propose trois mèmes. »)
await etapeCreer(p, 2);
ok((await p.locator(".tf-etape-2 .tr-intentions button").count()) === 6 && (await texte(".tf-etape-2 .tf-etape-quoi")).includes("choisis le ton, je te propose trois mèmes."), "l'étape ② « Comment elle le dit » : choisis le ton (six tons, facultatifs)");
await etapeCreer(p, 1);
await p.locator(".tf-moi .tf-texte textarea").fill(PHRASE);
await etapeCreer(p, 2);
await p.waitForFunction(() => document.querySelectorAll(".tr-choix .tr-rendu").length === 3, null, { timeout: 15000 });
// (la fausse IA répond après une pause dans la frappe : les mêmes visages que les règles, ici)
await p.waitForTimeout(2200);
const trois = await etiquettes();
ok(
  trois[0].includes("En BD") && trois[0].includes("Fou rire") && trois[1].includes("En film") && trois[1].includes("Tristesse") && trois[2].includes("En affiche") && trois[2].includes("Grimace"),
  `trois vignettes, trois visages : ${trois.join(" | ")}`,
);
// les trois vignettes sont dessinées, et ne se ressemblent pas
await p.waitForTimeout(800);
const dessins = await p.evaluate(() =>
  [...document.querySelectorAll(".tr-toile")].map((c) => {
    const g = c.getContext("2d");
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let r = 0;
    let v = 0;
    let bl = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 97) {
      r += d[i];
      v += d[i + 1];
      bl += d[i + 2];
      n++;
    }
    // (le coin haut-gauche : la bande noire du cinéma, le fond de la BD, la couleur de l'affiche)
    const coin = g.getImageData(4, 4, 1, 1).data;
    return { moy: [Math.round(r / n), Math.round(v / n), Math.round(bl / n)], coin: [coin[0], coin[1], coin[2]], l: c.width };
  }),
);
const differents = new Set(dessins.map((x) => x.moy.join(","))).size === 3;
ok(dessins.length === 3 && dessins.every((x) => x.l === 360 && x.moy.some((c) => c > 10)) && differents, `dessinées par le code de la vidéo, toutes différentes (${dessins.map((x) => x.moy.join("/")).join(" · ")})`);
ok(dessins[1].coin.every((c) => c < 20), `🎭 le cinéma : la bande noire, en haut (${dessins[1].coin.join(",")})`);
await p.locator(".tr").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/trois-rendus-1-choix.png` });

// ═══ ELLE CHOISIT « EN FILM » ═══
await p.locator(".tr-choix .tr-rendu").nth(1).click();
await p.waitForSelector(".tr-rendu.pris", { timeout: 5000 });
ok((await p.locator(".tr-rendu.pris").count()) === 1 && (await texte(".tr-rendu.pris")).includes("En film") && (await texte(".tf-sa-tete-dit")).includes("😢"), "« En film » choisi : sa figurine prend la tête de la tristesse");
await etapeCreer(p, 3);
await p.locator(".tf-moi .tf-quelle-voix button", { hasText: "voix de femme" }).click();
await p.locator(".tf-envoyer").click();
await p.waitForSelector(".tf-meme-pret video", { timeout: 90000 });
// la vidéo : en cinéma (les bandes noires, en haut et en bas)
const image = await p.evaluate(async () => {
  const v = document.querySelector(".tf-meme-pret video");
  v.muted = true;
  await new Promise((ok) => (v.readyState >= 2 ? ok() : v.addEventListener("loadeddata", () => ok(), { once: true })));
  v.currentTime = Math.min(1.5, (v.duration || 3) / 2);
  await new Promise((ok) => v.addEventListener("seeked", () => ok(), { once: true }));
  const c = document.createElement("canvas");
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  const g = c.getContext("2d");
  g.drawImage(v, 0, 0);
  const px = (x, y) => [...g.getImageData(Math.round(x * c.width), Math.round(y * c.height), 1, 1).data].slice(0, 3);
  return { haut: px(0.5, 0.04), bas: px(0.1, 0.97), l: c.width, h: c.height };
});
ok(image.l > 0 && image.haut.every((c) => c < 24) && image.bas.every((c) => c < 24), `son mème, fabriqué en cinéma : les bandes noires (${JSON.stringify(image)})`);
const [msg] = await lire("clik_figurine_message", `habitant_id=eq.${ZOE.id}&order=created_at.desc&limit=1`);
const aCote = await (await fetch(`${STOCK}/figurines-clients/${ZOE.id}/m-${msg?.id}.json`)).json().catch(() => ({}));
ok(msg?.sentiment === "tristesse" && aCote.rendu === "cinema" && String(aCote.meme ?? "").includes(msg.id), `son graphisme gardé à côté du message (la mesure) : ${aCote.rendu}, la tête : ${msg?.sentiment}`);
await p.screenshot({ path: `${D}/trois-rendus-2-meme.png` });
await p.locator(".tf-feuille.ouverte .tf-feuille-fermer").click();
await p.waitForFunction(() => !document.querySelector(".tf-feuille.ouverte"), null, { timeout: 5000 });
await p.waitForTimeout(400);

// ═══ LES INTENTIONS : UNE AIDE ═══
// (10 novembre 2026, écran par écran : l'étape ② ne s'ouvre qu'avec une phrase — ici, une des idées de « Célébrer »)
await etapeCreer(p, 1);
await p.locator(".tf-moi .tf-texte textarea").fill("Joyeux anniversaire maman");
await etapeCreer(p, 2);
await p.locator(".tr-intentions button", { hasText: "Célébrer" }).click();
ok((await p.locator(".tf-moi .tf-texte textarea").inputValue()) === "J’ai eu mon permis !!!", "sur une de ses idées, « 🎉 Célébrer » en propose une");
await p.waitForTimeout(2200);
const fete = await etiquettes();
ok(fete[0].includes("Euphorie") && fete[1].includes("Amour") && fete[2].includes("Victoire"), `ses visages (et une attitude) suivent l'intention (${fete.join(" | ")})`);
ok((await p.locator(".tr-rendu.pris").count()) === 0, "une autre phrase : plus rien de choisi (le choix valait pour l'autre)");
await p.locator(".tr-intentions button", { hasText: "Célébrer" }).click();
ok((await p.locator(".tf-moi .tf-texte textarea").inputValue()) === "Joyeux anniversaire maman", "un autre toucher : l'idée suivante");
await p.locator(".tr-autres").click();
await p.waitForTimeout(300);
const autres = await etiquettes();
ok(autres.join("|") !== fete.join("|"), `« 🎲 Trois autres » : d'autres visages, d'autres couleurs (${autres.join(" | ")})`);
// sa phrase revient : son choix aussi ; « Trois autres » le garde à sa place, et change les deux autres
await etapeCreer(p, 1);
await p.locator(".tf-moi .tf-texte textarea").fill(PHRASE);
await etapeCreer(p, 2);
await p.waitForTimeout(2200);
const avant = await etiquettes();
ok((await p.locator(".tr-rendu.pris").count()) === 1 && (await p.locator(".tr-rendu").nth(1).getAttribute("class")).includes("pris"), `sa phrase revient : « En film » de nouveau choisi (${avant.join(" | ")})`);
await p.locator(".tr-autres").click();
await p.waitForTimeout(300);
const apres = await etiquettes();
ok(apres[1] === avant[1] && (await p.locator(".tr-rendu").nth(1).getAttribute("class")).includes("pris") && (apres[0] !== avant[0] || apres[2] !== avant[2]), `« Trois autres » : celle qu'il a choisie reste, les autres changent (${apres.join(" | ")})`);
// un toucher sur la vignette choisie : retour au mème simple
await p.locator(".tr-rendu.pris").click();
ok((await p.locator(".tr-rendu.pris").count()) === 0 && (await texte(".tr-note")).includes("Touche celle qui te plaît"), "un toucher sur celle qui est choisie : le mème simple, comme avant");

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0 && !/exemple/i.test(await p.evaluate(() => document.body.innerText)), "rien ne déborde, sans le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
