// essai.js <url-de-la-scène> <dossier> n1 n2 … — ne rend que les images demandées (n = numéro d'image, T = n / 30).
// Pour vérifier une scène avant le rendu complet ; puis planche.sh pour les voir d'un coup.
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node-tools/node_modules/playwright"); }
const [url, out, ...liste] = process.argv.slice(2);
(async () => {
  let nav; try { nav = await pw.chromium.launch(); } catch { nav = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); }
  const page = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
  page.on("pageerror", (e) => console.log("erreur:", e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => window.pret);
  for (const n of liste.map(Number)) {
    await page.evaluate(([T, n]) => window.poser(T, n), [n / 30, n]);
    await page.screenshot({ path: `${out}/o${String(n).padStart(4, "0")}.jpg`, type: "jpeg", quality: 90 });
  }
  await nav.close();
})();
