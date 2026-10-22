// Toute l'intro puis les deux scènes, à la taille d'un vrai téléphone (l'app Claude sur iPhone : ~414×747).
//   node essai-telephone.mjs <sortie> <tour> <WxH> [intro|scenes|tout]
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const [D, dossier = "tour", taille = "414x747", quoi = "tout"] = process.argv.slice(2);
const [W, H] = taille.split("x").map(Number);
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 200)));
const WEBM = { episode: "tour-episode", interview: "tour-iv", specialiste: "tour-specialiste", message: "tour-iv" };
await p.route(/(episode|interview|specialiste|message)\.mp4$/, (r) => {
  const nom = /(episode|interview|specialiste|message)\.mp4$/.exec(r.request().url())[1];
  const f = RACINE + "intro/zz-webm/" + WEBM[nom] + ".webm";
  if (!fs.existsSync(f)) return r.continue();
  const tout = fs.readFileSync(f), m = /bytes=(\d+)-(\d*)/.exec(r.request().headers()["range"] || "");
  if (!m) return r.fulfill({ status: 200, contentType: "video/webm", headers: { "accept-ranges": "bytes" }, body: tout });
  const a = +m[1], z = m[2] ? +m[2] : tout.length - 1;
  return r.fulfill({ status: 206, contentType: "video/webm", headers: { "accept-ranges": "bytes", "content-range": `bytes ${a}-${z}/${tout.length}` }, body: tout.subarray(a, z + 1) });
});
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__pr = { NUIT, DEMAIN, jouerPromesse };\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
await p.goto(`http://127.0.0.1:8790/${dossier}/index.html`, { waitUntil: "load" });
await p.waitForTimeout(800);
if (await p.locator("#reveil:visible").count()) await p.click("#reveil", { force: true });
await p.waitForTimeout(2500);
let n = 0;
const photo = async (nom) => p.screenshot({ path: `${D}/${dossier}-${taille}-${String(n++).padStart(3, "0")}-${nom}.png` });
await p.click("#decouvrir", { force: true });
const texte = () => p.evaluate(() => (document.querySelector("#intro-dit")?.textContent || "").slice(0, 40));
if (quoi === "scenes") { await p.waitForTimeout(1500); await p.click("#intro-passer", { force: true }); await p.waitForTimeout(1500); }
else {
  let dernier = "";
  for (let k = 0; k < 140; k++) {
    await p.waitForTimeout(700);
    if (await p.evaluate(() => document.querySelector("#intro").hidden)) break;
    const t = await texte(), cl = await p.evaluate(() => [...document.querySelectorAll("#si-decor > *")].map((x) => x.className.split(" ")[0]).join("+"));
    if (k % 2 === 0 || t.slice(0, 12) !== dernier.slice(0, 12)) await photo("intro-" + cl);
    dernier = t;
  }
}
if (quoi !== "intro") for (const sc of ["NUIT", "DEMAIN"]) {
  await p.evaluate((sc) => { window.__fini = false; __pr.jouerPromesse(sc === "NUIT" ? __pr.NUIT : __pr.DEMAIN).then(() => { window.__fini = true; }); }, sc);
  for (let k = 0; k < 60; k++) {
    await p.waitForTimeout(800);
    if (await p.evaluate(() => window.__fini)) break;
    if (k % 2 === 1) await photo(sc.toLowerCase());
  }
}
console.log(n, "captures ·", err.join(" | ") || "aucune erreur");
await b.close();
