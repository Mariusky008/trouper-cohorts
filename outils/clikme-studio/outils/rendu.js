// rendu.js <url-de-la-scène> <dossier> [début] [fin] [pas] — une capture JPEG 1080×1920 par image, 30 images/s.
// Sans [fin] : la durée que la page annonce (window.DUREE_TOTALE, en s) × 30.
// La page doit exposer window.pret (promesse : polices et images prêtes) et window.poser(T, n) (async : pose l'instant T).
// À servir en HTTP (python3 -m http.server), pas en file:// (les polices y sont bloquées). Joindre en NO_PROXY='*'.
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node-tools/node_modules/playwright"); }
const [url, out, a = "0", b, pas = "1"] = process.argv.slice(2);
(async () => {
  let navigateur;
  try { navigateur = await pw.chromium.launch(); } catch { navigateur = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); }
  const page = await navigateur.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
  page.on("pageerror", (e) => console.log("erreur:", e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => window.pret);
  const fin = b != null ? +b : Math.round((await page.evaluate(() => window.DUREE_TOTALE || 21)) * 30);
  const t0 = Date.now();
  for (let n = +a; n < fin; n += +pas) {
    await page.evaluate(([T, n]) => window.poser(T, n), [n / 30, n]);
    await page.screenshot({ path: `${out}/o${String(n).padStart(4, "0")}.jpg`, type: "jpeg", quality: 94 });
    if (n % 60 === 0) console.log(n, "/", fin, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  }
  console.log("fini", fin, "images");
  await navigateur.close();
})();
