// Toute la page 2, moment par moment, comme un commerçant qui touche le fantôme (« je le fais pour vous »)
// à chaque fois que la démo l'attend. Captures + durée de chaque moment, et les erreurs de la page.
//   node essai-parcours.mjs <sortie> <tour> <WxH> <vue> <parcours>
// vue : clients | depenses ; parcours : voix | spe | episode (la façon choisie à l'étape « choix »).
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const [D, dossier = "tour", taille = "414x747", vue = "clients", parcours = "voix"] = process.argv.slice(2);
const [W, H] = taille.split("x").map(Number);
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 200)));
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__etat = () => ({ idx, id: DEMOS[vue].moments[idx].id, occupe, fini, parole: enParole, bulle: (document.querySelector('#guide-t, .guide p, #dire')||{}).textContent || '' }); window.__agir = () => agir(true); window.__changer = changer; window.__parcours = (q) => { parcours = q; appliquerParcours(); };\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
await p.goto(`http://127.0.0.1:8790/${dossier}/index.html`, { waitUntil: "load" });
await p.waitForTimeout(800);
if (await p.locator("#reveil:visible").count()) await p.click("#reveil", { force: true });
await p.locator("#decouvrir").waitFor({ state: "visible", timeout: 20000 }); await p.waitForTimeout(600); await p.click("#decouvrir", { force: true });
try { await p.locator("#intro-passer").waitFor({ state: "visible", timeout: 9000 }); await p.waitForTimeout(300); await p.click("#intro-passer", { force: true }); } catch (e) { await p.evaluate(() => document.querySelector("#intro-passer").click()); }
await p.waitForFunction(() => document.querySelector("#accueil").hidden, null, { timeout: 20000 }); await p.waitForTimeout(800);
await p.evaluate((v) => __changer(v), vue); await p.waitForTimeout(1500);
let n = 0, dernier = null, t0 = Date.now(), debutMoment = Date.now();
const photo = async (nom) => p.screenshot({ path: `${D}/${dossier}-${vue}-${String(n++).padStart(3, "0")}-${nom}.png` });
const journal = [];
for (let k = 0; k < 400; k++) {
  await p.waitForTimeout(1000);
  const e = await p.evaluate(() => __etat());
  if (e.id !== dernier) { if (dernier) journal.push([dernier, Math.round((Date.now() - debutMoment) / 1000)]); dernier = e.id; debutMoment = Date.now(); await photo(e.id + "-a"); }
  else if ((Date.now() - debutMoment) % 4000 < 1000) await photo(e.id);
  if (e.fini) { await p.waitForTimeout(2500); await photo("fin"); journal.push([dernier, Math.round((Date.now() - debutMoment) / 1000)]); break; }
  // le commerçant agit dès que le fantôme a fini de parler et que rien ne s'anime
  if (!e.occupe && !e.parole && Date.now() - debutMoment > 3500) {
    if (e.id === "choix") { await p.evaluate((q) => __parcours(q), parcours); }
    await p.evaluate(() => __agir());
  }
}
console.log(JSON.stringify(journal), "total", Math.round((Date.now() - t0) / 1000), "s ·", err.join(" | ") || "aucune erreur");
await b.close();
