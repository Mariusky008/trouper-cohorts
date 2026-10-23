// Les deux fins de conversation : leurs boutons, et la scène que chacun lance.
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const D = process.argv[2] || RACINE + "captures/";
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 200)));
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__fin = () => { aller(DEMOS[vue].moments.length - 1); setTimeout(terminer, 1200); }; window.__changer = changer;\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
await p.goto("http://127.0.0.1:8790/tour/index.html", { waitUntil: "load" });
await p.waitForTimeout(800);
if (await p.locator("#reveil:visible").count()) await p.click("#reveil", { force: true });
await p.waitForTimeout(2500); await p.click("#decouvrir", { force: true }); await p.waitForTimeout(1500);
if (await p.locator("#intro-passer:visible").count()) await p.click("#intro-passer", { force: true });
await p.waitForTimeout(1500);
const scene = () => p.evaluate(() => { const d = document.querySelector("#si-decor > *"); return document.querySelector("#intro").hidden ? "aucune" : (d ? d.className.split(" ")[0] : "?"); });
for (const [v, sel] of [["clients", "#fin-c-demain"], ["depenses", "#fin-d-autre"]]) {
  await p.evaluate((v) => __changer(v), v); await p.waitForTimeout(800);
  await p.evaluate(() => __fin()); await p.waitForTimeout(3500);
  await p.screenshot({ path: D + "fin-" + v + ".png" });
  console.log(v, "· boutons :", await p.evaluate((v) => [...document.querySelectorAll("#fin-" + v + " button")].map((x) => x.textContent).join(" | "), v));
  await p.click(sel); await p.waitForTimeout(3800);
  console.log("  ", sel, "→", (await scene()) === "dx" ? "« Quand vous passerez la main »" : (await scene()) === "nx" ? "« Pendant la nuit »" : await scene());
  await p.click("#intro-passer", { force: true }); await p.waitForTimeout(1200);
  console.log("   après « Passer » : scène", await scene(), "· onglet", await p.evaluate(() => document.querySelector("[data-vue]")?.dataset.vue));
}
console.log(err.join(" | ") || "aucune erreur");
await b.close();
