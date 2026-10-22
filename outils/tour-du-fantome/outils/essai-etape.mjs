// Une étape de la démo (par son id), photographiée au fil du temps, à la taille d'un téléphone.
//   node essai-etape.mjs <sortie> <tour> <WxH> <id> [secondes]
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const [D, dossier = "tour", taille = "414x747", id = "direct", sec = "8"] = process.argv.slice(2);
const [W, H] = taille.split("x").map(Number);
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 200)));
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__va = (id) => aller(DEMOS.clients.moments.findIndex((m) => m.id === id));\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
await p.goto(`http://127.0.0.1:8790/${dossier}/index.html`, { waitUntil: "load" });
await p.waitForTimeout(800);
if (await p.locator("#reveil:visible").count()) await p.click("#reveil", { force: true });
await p.waitForTimeout(2500); await p.click("#decouvrir", { force: true }); await p.waitForTimeout(1500);
if (await p.locator("#intro-passer:visible").count()) await p.click("#intro-passer", { force: true });
await p.waitForTimeout(2500);
await p.evaluate((id) => __va(id), id);
for (let k = 0; k < +sec; k++) {
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `${D}/${dossier}-${taille}-${id}-${String(k).padStart(2, "0")}.png` });
}
console.log(err.join(" | ") || "aucune erreur");
await b.close();
