// Le prototype « Les trois fantômes » : son fantôme choisi (une des trois cages), puis des actions, avec des captures.
//   node essai.mjs <sortie> <choix : adore|promis|table> [WxH] '[actions]'
// actions (JSON) : [[ms, "click", sélecteur] | [ms, "eval", code] | [ms, "shot", nom] | [ms, "el", [sélecteur, nom]]]
//   shot : capture de la page ; el : capture d'un seul élément. FICHIER=… essaie une autre copie de la page.
// Il faut le prototype servi en local : python3 -m http.server 8791 --directory outils/trois-fantomes
// Exemple, à 1400 de large l’habitant et le comptoir côte à côte (sur téléphone, un onglet chacun, [data-col=c] pour le comptoir) :
//   node essai.mjs /tmp/sortie promis 1400x950 '[[500,"shot","vitrine"],[300,"click","#vers-maison"],[1500,"shot","ma-maison"]]'
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
const [D, choix = "adore", taille = "1400x950", act = "[]"] = process.argv.slice(2);
const [W, H] = taille.split("x").map(Number);
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: W < 700, hasTouch: W < 700 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 200)));
// la page est publiée sans en-tête (l'artefact ajoute le sien) : ici, on le lui donne
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(process.env.FICHIER || new URL("index.html", import.meta.url).pathname, "utf8") }));
await p.goto("http://127.0.0.1:8791/index.html", { waitUntil: "load" });
await p.waitForTimeout(800);
await p.click("#onb-ok", { force: true });
await p.waitForTimeout(800);
await p.evaluate((ch) => { const v = document.querySelector("#vid"); if (v) { v.dispatchEvent(new Event("ended")); } document.querySelector('#h-video .f3[data-choix="' + ch + '"]').click(); }, choix);
await p.waitForTimeout(3500);
let n = 0;
for (const [ms, quoi, x] of JSON.parse(act)) {
  await p.waitForTimeout(ms);
  try {
    if (quoi === "click") await p.locator(x).first().click({ force: true });
    else if (quoi === "eval") console.log("eval", JSON.stringify(await p.evaluate(x)));
    else if (quoi === "shot") { await p.screenshot({ path: `${D}/${String(n++).padStart(2, "0")}-${x}.png` }); }
    else if (quoi === "el") { const [sel, nom] = x; await p.locator(sel).first().screenshot({ path: `${D}/${String(n++).padStart(2, "0")}-${nom}.png` }); }
  } catch (e) { err.push(quoi + " " + x + " : " + e.message.slice(0, 140)); }
}
console.log(err.join(" | ") || "aucune erreur");
await b.close();
