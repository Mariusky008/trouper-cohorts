// Une étape de la démo (par son id), avec des appuis à des instants donnés, photographiée chaque seconde.
//   node essai-actions.mjs <sortie> <tour> <WxH> <vue> <id> <secondes> '[actions]' [parcours]
// vue : clients | depenses ; parcours : voix | spe | episode (la façon choisie à l'étape « choix »).
// actions (JSON) : [[ms, "click", sélecteur] | [ms, "quand", sélecteur] | [ms, "agir"] | [ms, "eval", code]]
//   click : touche tout de suite ; quand : attend que l'élément se montre, puis le touche ;
//   agir : « je le fais pour vous » (comme toucher le fantôme) ; eval : affiche le résultat du code.
// Exemple, Mike au comptoir du restaurant :
//   node essai-actions.mjs /tmp/sortie tour 414x747 clients creux 60 '[[1000,"quand","#mk-oui"],[1000,"quand","#tv-envoyer"]]'
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const [D, dossier = "tour", taille = "414x747", vue = "clients", id = "direct", sec = "8", act = "[]", parcours = "voix"] = process.argv.slice(2);
const actions = JSON.parse(act);
const [W, H] = taille.split("x").map(Number);
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 700, hasTouch: W < 700, deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 300)));
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__va = (v, id, q) => { if (q) { parcours = q; appliquerParcours(); } changer(v); aller(DEMOS[v].moments.findIndex((m) => m.id === id)); }; window.__agir = () => agir(true); window.__etat = () => ({ id: DEMOS[vue].moments[idx].id, parole: enParole, occupe, fini });\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
await p.goto(`http://127.0.0.1:8790/${dossier}/index.html`, { waitUntil: "load" });
await p.locator("#decouvrir").waitFor({ state: "visible", timeout: 20000 });
await p.waitForTimeout(600);
await p.click("#decouvrir", { force: true });
try { await p.locator("#intro-passer").waitFor({ state: "visible", timeout: 9000 }); await p.waitForTimeout(300); await p.click("#intro-passer", { force: true }); }
catch (e) { await p.evaluate(() => document.querySelector("#intro-passer") && document.querySelector("#intro-passer").click()); }
await p.waitForFunction(() => document.querySelector("#accueil").hidden, null, { timeout: 20000 });
await p.waitForTimeout(800);
await p.evaluate(([v, id, q]) => __va(v, id, q), [vue, id, parcours]);
const t0 = Date.now();
let k = 0, a = 0;
while (k < +sec) {
  const cible = (k + 1) * 1000;
  while (a < actions.length && actions[a][0] <= cible) {
    const [t, quoi, x] = actions[a++];
    const att = t - (Date.now() - t0); if (att > 0) await p.waitForTimeout(att);
    try {
      if (quoi === "click") await p.locator(x).first().click({ force: true });
      else if (quoi === "quand") { await p.locator(x).first().waitFor({ state: "visible", timeout: 30000 }); await p.waitForTimeout(400); await p.locator(x).first().click({ force: true }); }
      else if (quoi === "agir") await p.evaluate(() => __agir());
      else if (quoi === "eval") console.log("eval", JSON.stringify(await p.evaluate(x)));
    } catch (e) { err.push(quoi + " " + x + " : " + e.message.slice(0, 120)); }
  }
  const att = cible - (Date.now() - t0); if (att > 0) await p.waitForTimeout(att);
  await p.screenshot({ path: `${D}/${dossier}-${taille}-${id}-${String(k).padStart(2, "0")}.png` });
  k++;
}
console.log(dossier, id, JSON.stringify(await p.evaluate(() => __etat())), err.join(" | ") || "aucune erreur");
await b.close();
