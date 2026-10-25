// LES TROIS FILMS DU TOUR MASSAGE → tour-massage/ : message, specialiste, episode (.mp4, l'affiche .jpg, la dernière
// image -fin.jpg). Le gabarit : films-massage/film.html (voir son en-tête). À lancer après tour-massage.py (il lui faut
// sa voix mesurée, tour-massage/paroles.json), puis relancer tour-massage.py, qui lit leur durée.
//   node outils/tour-du-fantome/outils/films-massage.mjs [apercu t1 t2 …]      (depuis la racine du dépôt)
// Variables : FFMPEG (défaut : outils/tour-du-fantome/ffmpeg), CHROMIUM, PLAYWRIGHT.
import { createReadStream, existsSync, statSync, unlinkSync, writeFileSync } from "fs";
import { createServer } from "http";
import { dirname, extname, join, resolve } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "../../..");
const D = join(RACINE, "outils/tour-du-fantome/tour-massage");
const FF = process.env.FFMPEG || join(RACINE, "outils/tour-du-fantome/ffmpeg");
const CHROMIUM = process.env.CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const pw = (await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.js")).default;
const [quoi = "tout", ...temps] = process.argv.slice(2);
const IPS = 30;

// un petit serveur pour la page et ses fichiers, à la racine du dépôt (les photos, la voix, les polices, le fantôme)
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const serveur = createServer((q, r) => {
  const f = join(RACINE, decodeURIComponent(new URL(q.url, "http://x").pathname));
  if (!f.startsWith(RACINE) || !existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" });
  createReadStream(f).pipe(r);
}).listen(0);
const port = serveur.address().port;
const nav = await pw.chromium.launch({ executablePath: CHROMIUM });
const err = [];
const image = (p, t, q = 0.93) => p.evaluate(([t, q]) => { window.dessiner(t); return document.getElementById("c").toDataURL("image/jpeg", q); }, [t, q]);
const ecrire = (f, url) => writeFileSync(f, Buffer.from(url.split(",")[1], "base64"));

for (const mode of ["message", "specialiste", "episode"]) {
  const p = await (await nav.newContext({ viewport: { width: 400, height: 700 } })).newPage();
  p.on("pageerror", (e) => err.push(`${mode} : ${e.message}`));
  await p.goto(`http://127.0.0.1:${port}/outils/tour-du-fantome/outils/films-massage/film.html`, { waitUntil: "load" });
  const duree = await p.evaluate((m) => window.preparer(m), mode);
  const t0 = Date.now();
  if (quoi === "apercu") {
    for (const t of temps.map(Number)) ecrire(join(D, `k-${mode}-${t.toFixed(1)}.jpg`), await image(p, Math.min(t, duree - 0.05), 0.85));
    console.log(mode, duree.toFixed(2), "s · aperçu");
    continue;
  }
  const son = join(D, `${mode}.wav`);
  writeFileSync(son, Buffer.from(await p.evaluate(() => window.mixer()), "base64"));
  const ff = spawn(FF, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(IPS), "-c:v", "mjpeg", "-i", "-", "-i", son,
    "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p", "-profile:v", "high", "-ar", "48000", "-c:a", "aac", "-b:a", "128k",
    "-shortest", "-movflags", "+faststart", join(D, `${mode}.mp4`)], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(duree * IPS);
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from((await image(p, i / IPS)).split(",")[1], "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  unlinkSync(son);
  // l'affiche (la carte titre), et la dernière image (la carte de fin)
  ecrire(join(D, `${mode}.jpg`), await image(p, 1.6, 0.86));
  ecrire(join(D, `${mode}-fin.jpg`), await image(p, duree - 0.05, 0.86));
  console.log(mode, duree.toFixed(2), "s ·", n, "images ·", ((Date.now() - t0) / 1000).toFixed(0), "s");
  await p.context().close();
}
console.log(err.join(" | ") || "aucune erreur");
await nav.close();
serveur.close();
