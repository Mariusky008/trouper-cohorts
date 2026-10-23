// Les deux promesses d'un tour (« Et cette nuit… », « Et demain… »), jouées directement après l'intro :
// une capture toutes les 0,6 s.   node essai-promesses.mjs <sortie> <tour> <tel|ordi|WxH> [nuit|demain|les2]
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
const [D, dossier = "tour", vue = "tel", quoi = "les2"] = process.argv.slice(2);
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const VP = { tel: [{ width: 390, height: 844 }, true], ordi: [{ width: 1280, height: 800 }, false] }[vue] ||
  [{ width: +vue.split("x")[0], height: +vue.split("x")[1] }, false];
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: VP[0], isMobile: VP[1], hasTouch: VP[1], deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 200)));
p.on("console", (m) => { if (m.type() === "error") err.push("console " + m.text().slice(0, 160)); });
p.on("response", (r) => { if (r.status() >= 400) err.push(r.status() + " " + r.url().split("/").pop()); });
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__pr = { NUIT, DEMAIN, jouerPromesse }; /* (essai seulement) */\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
await p.goto(`http://127.0.0.1:8790/${dossier}/index.html`, { waitUntil: "load" });
await p.waitForTimeout(800);
if (await p.locator("#reveil:visible").count()) await p.click("#reveil", { force: true });
await p.waitForTimeout(2500);
await p.click("#decouvrir", { force: true });
await p.waitForTimeout(1500);
if (await p.locator("#intro-passer:visible").count()) await p.click("#intro-passer", { force: true });
await p.waitForTimeout(1500);
const scenes = quoi === "les2" ? ["NUIT", "DEMAIN"] : [quoi.toUpperCase()];
for (const sc of scenes) {
  await p.evaluate((sc) => { window.__fini = false; __pr.jouerPromesse(sc === "NUIT" ? __pr.NUIT : __pr.DEMAIN).then(() => { window.__fini = true; }); }, sc);
  for (let k = 0; k < 120; k++) {
    await p.waitForTimeout(600);
    const e = await p.evaluate(() => ({ f: window.__fini, d: document.querySelector("#intro-dit")?.textContent || "", cl: document.querySelector("#si-decor > *")?.className || "" }));
    await p.screenshot({ path: `${D}/${dossier}-${vue}-${sc.toLowerCase()}-${String(k).padStart(2, "0")}.png` });
    console.log(sc, k, e.cl, "·", e.d.slice(-70));
    if (e.f) break;
  }
}
console.log(err.join(" | ") || "aucune erreur");
await b.close();
