// 🎬 TROIS FAÇONS DE LE DIRE (8 novembre 2026, `lib/direct/rendus.ts`, `app/collection/trois-rendus.tsx`), contre le faux
// Supabase et sa fausse IA de texte — jamais la vraie base.
//
// Zoé a sa figurine, et trois visages déjà faits (le fou rire, la tristesse, la grimace) en plus de la joie. Par la route,
// la fausse IA lit sa phrase (et rien d'autre). Dans « Créer » (un seul écran depuis le 10 novembre 2026), elle écrit
// « J’avais dit que je ne sortirais pas ce soir… » et crée son mème ; sur son mème prêt, « Sa version », à côté de la
// vidéo : la vidéo simple, puis 😂 En BD, 🎭 En film, 🌀 En affiche, chacune avec UN AUTRE VISAGE de sa figurine,
// dessinées par le même code que la vidéo. Elle choisit « En film » : son mème se refait À LA MÊME PLACE, EN CINÉMA (les
// bandes noires de la vidéo le disent), sa figurine prend la tête de la tristesse, et son graphisme est gardé à côté du
// message (la mesure). « 🎲 Trois autres » garde celle qu'elle a choisie ; « Vidéo » revient au mème simple ; une autre
// phrase repart de la vidéo. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

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
const etiquettes = async () => p.locator(".tf-feuille-meme .tr-rendu:not(.tr-video)").evaluateAll((l) => l.map((b) => b.getAttribute("aria-label")));

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

// ═══ DANS « CRÉER » : SA PHRASE, SON MÈME — PUIS « SA VERSION », À CÔTÉ DE LA VIDÉO (10 novembre 2026 : « Créer » sur un
// seul écran ; avant, l'étape ② « Le ton ») ═══
await p.goto(`${BASE}/collection?v=${Date.now()}#figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".tf-moi .tf-texte textarea", { timeout: 60000 });
await fermerPablito(p, "#o-figurine");
ok((await p.locator(".tf-moi .tr, .tr-intentions").count()) === 0, "plus de tons à choisir avant : sa phrase, puis « Créer mon mème »");
await p.locator(".tf-moi .tf-texte textarea").fill(PHRASE);
await p.locator(".tf-envoyer").click();
await p.waitForSelector(".tf-feuille-meme .tf-meme-pret video", { timeout: 90000 });
await p.waitForFunction(() => document.querySelectorAll(".tf-feuille-meme .tr-rendu").length === 4, null, { timeout: 15000 });
// (la fausse IA répond après une petite pause : les mêmes visages que les règles, ici)
await p.waitForTimeout(1500);
const trois = await etiquettes();
ok(
  trois[0].startsWith("En BD") && trois[0].includes("pliée de rire") && trois[1].startsWith("En film") && trois[1].includes("triste") && trois[2].startsWith("En affiche") && trois[2].includes("grimace"),
  `« Sa version » : trois vignettes, trois visages (${trois.join(" | ")})`,
);
ok((await p.locator(".tf-feuille-meme .tr-video.pris").count()) === 1 && (await texte(".tf-feuille-meme .tr-video")).includes("Vidéo"), "d'abord la vidéo simple, prise");
// les trois vignettes sont dessinées, et ne se ressemblent pas
await p.waitForTimeout(800);
const dessins = await p.evaluate(() =>
  [...document.querySelectorAll(".tf-feuille-meme .tr-toile")].map((c) => {
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
await p.screenshot({ path: `${D}/trois-rendus-1-choix.png` });

// ═══ ELLE CHOISIT « EN FILM » : SON MÈME SE REFAIT, À LA MÊME PLACE ═══
const [msg0] = await lire("clik_figurine_message", `habitant_id=eq.${ZOE.id}&order=created_at.desc&limit=1`);
await p.locator(".tf-feuille-meme .tr-rendu.tr-cinema").click();
await p.waitForSelector(".tf-feuille-meme .tf-meme-cours", { timeout: 10000 });
await p.waitForSelector(".tf-feuille-meme .tf-meme-pret video", { timeout: 90000 });
ok((await p.locator(".tf-feuille-meme .tr-rendu.pris").count()) === 1 && (await p.locator(".tf-feuille-meme .tr-cinema.pris").count()) === 1 && (await p.locator('.tf-moi .fqp[data-sentiment="tristesse"]').count()) === 1 && (await texte(".tf-moi .tf-tete-nom")).includes("😢"), "« En film » choisi : son mème se refait, et sa figurine prend la tête de la tristesse");
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
ok(image.l > 0 && image.haut.every((c) => c < 24) && image.bas.every((c) => c < 24), `son mème, refait en cinéma : les bandes noires (${JSON.stringify(image)})`);
const lesSiens = await lire("clik_figurine_message", `habitant_id=eq.${ZOE.id}`);
const [msg] = await lire("clik_figurine_message", `id=eq.${msg0?.id}`);
const aCote = await (await fetch(`${STOCK}/figurines-clients/${ZOE.id}/m-${msg?.id}.json`)).json().catch(() => ({}));
ok(lesSiens.length === 1 && msg?.sentiment === "tristesse" && aCote.rendu === "cinema" && String(aCote.meme ?? "").includes(msg.id), `le même message (pas un de plus) : son graphisme gardé à côté (la mesure), et sa tête (${aCote.rendu}, ${msg?.sentiment})`);
await p.screenshot({ path: `${D}/trois-rendus-2-meme.png` });

// ═══ « 🎲 TROIS AUTRES » : CELLE QU'ELLE A CHOISIE RESTE À SA PLACE, LES AUTRES CHANGENT ═══
const avant = await etiquettes();
await p.locator(".tf-feuille-meme .tr-autres").click();
await p.waitForTimeout(300);
const apres = await etiquettes();
ok(apres[1] === avant[1] && (await p.locator(".tf-feuille-meme .tr-cinema.pris").count()) === 1 && (apres[0] !== avant[0] || apres[2] !== avant[2]), `« Trois autres » : celle qu'elle a choisie reste, les autres changent (${apres.join(" | ")})`);
// la vidéo simple, de nouveau
await p.locator(".tf-feuille-meme .tr-video").click();
await p.waitForSelector(".tf-feuille-meme .tf-meme-cours", { timeout: 10000 });
await p.waitForSelector(".tf-feuille-meme .tf-meme-pret video", { timeout: 90000 });
const aCote2 = await (await fetch(`${STOCK}/figurines-clients/${ZOE.id}/m-${msg?.id}.json`)).json().catch(() => ({}));
ok((await p.locator(".tf-feuille-meme .tr-video.pris").count()) === 1 && !aCote2.rendu, "« Vidéo » : le mème simple, comme avant (son graphisme n'est plus gardé)");

// ═══ UNE AUTRE PHRASE : SA VERSION REPART DE LA VIDÉO ═══
await p.locator(".tf-feuille.ouverte .tf-changer").click();
await p.waitForFunction(() => !document.querySelector(".tf-feuille.ouverte"), null, { timeout: 5000 });
await p.locator(".tf-moi .tf-texte textarea").fill("Joyeux anniversaire maman");
await p.locator(".tf-envoyer").click();
await p.waitForSelector(".tf-feuille-meme .tf-meme-pret video", { timeout: 90000 });
ok((await p.locator(".tf-feuille-meme .tr-video.pris").count()) === 1 && (await lire("clik_figurine_message", `habitant_id=eq.${ZOE.id}`)).length === 2, "une autre phrase : un autre mème, sa version repart de la vidéo simple");
await p.keyboard.press("Escape");

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0 && !/exemple/i.test(await p.evaluate(() => document.body.innerText)), "rien ne déborde, sans le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
