// L'ÉPISODE EN MP4 : le son (mixer), puis chaque image (dessiner), encodés par ffmpeg.
// node outils/face-au-fantome/rendu.mjs [son|tout|apercu t1 t2 …]
//   son     → son.wav
//   tout    → face-au-fantome.mp4 (≈ 2 min)
//   apercu  → k-<t>.jpg, des images clés pour juger sans tout encoder
// Variables : FFMPEG (défaut : ffmpeg), CHROMIUM (défaut : /opt/pw-browsers/chromium), PLAYWRIGHT (chemin du module).
import { createReadStream, existsSync, statSync, writeFileSync } from "fs";
import { createServer } from "http";
import { dirname, extname, join } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const ICI = dirname(fileURLToPath(import.meta.url));
const FF = process.env.FFMPEG || "ffmpeg";
const CHROMIUM = process.env.CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const pw = (await import(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright/index.js")).default;
const [quoi = "tout", ...temps] = process.argv.slice(2);
const IPS = 30, DUREE = 39.5;

// un petit serveur pour la page et ses fichiers
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const serveur = createServer((q, r) => {
  const f = join(ICI, decodeURIComponent(new URL(q.url, "http://x").pathname));
  if (!f.startsWith(ICI) || !existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" });
  createReadStream(f).pipe(r);
}).listen(0);
const port = serveur.address().port;

const nav = await pw.chromium.launch({ executablePath: CHROMIUM });
const p = await (await nav.newContext({ viewport: { width: 420, height: 760 } })).newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message));
await p.goto(`http://127.0.0.1:${port}/episode.html`, { waitUntil: "load" });
console.log(JSON.stringify(await p.evaluate(() => window.pret)));
const t0 = Date.now();

if (quoi === "apercu") {
  for (const t of temps.map(Number)) {
    const url = await p.evaluate((t) => { window.dessiner(t); return document.getElementById("c").toDataURL("image/jpeg", 0.85); }, t);
    writeFileSync(join(ICI, `k-${t.toFixed(2)}.jpg`), Buffer.from(url.split(",")[1], "base64"));
  }
} else {
  writeFileSync(join(ICI, "son.wav"), Buffer.from(await p.evaluate(() => window.mixer()), "base64"));
  console.log("son :", ((Date.now() - t0) / 1000).toFixed(1), "s");
}
if (quoi === "tout") {
  // le grain change toutes les trois images : un débit de 2,8 Mb/s suffit (≈ 14 Mo)
  const ff = spawn(FF, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(IPS), "-c:v", "mjpeg", "-i", "-", "-i", join(ICI, "son.wav"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "2800k", "-bufsize", "5600k", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", join(ICI, "face-au-fantome.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(DUREE * IPS);
  for (let i = 0; i < n; i++) {
    const url = await p.evaluate((t) => { window.dessiner(t); return document.getElementById("c").toDataURL("image/jpeg", 0.93); }, i / IPS);
    if (!ff.stdin.write(Buffer.from(url.split(",")[1], "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) console.log("image", i, "/", n, ((Date.now() - t0) / 1000).toFixed(0), "s");
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log("vidéo :", ((Date.now() - t0) / 1000).toFixed(0), "s");
}
console.log(err.join(" | ") || "aucune erreur");
await nav.close();
serveur.close();
