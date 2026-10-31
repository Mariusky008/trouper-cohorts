// 🎞️ Le film du téléphone de la démo humaine, version atelier (`film-atelier.html`) : photographié image par image,
// assemblé par ffmpeg → recu/humain/atelier/film.mp4 (540 × 960, 30 images/s, 42,3 s, sans son).
//
//   node outils/tour-du-fantome/outils/film-atelier.mjs outils/tour-du-fantome
//
// Les photos : celles de Nina, la céramiste de la démo des entrepreneurs (recu/entrepreneurs/createur/).
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const S = path.resolve(process.argv[2] || "outils/tour-du-fantome");
const FF = fs.existsSync(path.join(S, "ffmpeg")) ? path.join(S, "ffmpeg") : "ffmpeg";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "film-atelier-"));
const P = path.join(S, "recu/entrepreneurs/createur");
// les photos, à une taille raisonnable (la plus grande fait 2560 px)
for (const [src, dst] of [["mains.jpg", "f-mains.jpg"], ["tour.jpg", "f-tour.jpg"], ["atelier.jpg", "f-atelier.jpg"], ["table.jpg", "f-table.jpg"],
  ["bol-bleu.jpg", "f-bol.jpg"], ["pieces.jpg", "f-pieces.jpg"]]) {
  execFileSync(FF, ["-v", "error", "-y", "-i", path.join(P, src), "-vf", "scale='min(1200,iw)':-2", "-q:v", "3", path.join(tmp, dst)]);
}
fs.copyFileSync(path.join(S, "outils/film-atelier.html"), path.join(tmp, "film.html"));
const IPS = 30, DUREE = 42.3, N = Math.round(DUREE * IPS);
const nav = await pw.chromium.launch();
const p = await (await nav.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 })).newPage();
await p.goto("file://" + path.join(tmp, "film.html"), { waitUntil: "networkidle" });
await p.evaluate(() => window.__pret);
const f = await p.$("#f");
for (let i = 0; i < N; i++) {
  await p.evaluate((t) => window.poser(t), i / IPS);
  await f.screenshot({ path: path.join(tmp, String(i).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 });
  if (i % 120 === 0) process.stdout.write(`\r${i}/${N} images…`);
}
await nav.close();
const sortie = path.join(S, "recu/humain/atelier/film.mp4");
execFileSync(FF, ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(IPS), "-i", path.join(tmp, "%05d.jpg"), "-c:v", "libx264", "-profile:v", "high", "-level", "3.1",
  "-pix_fmt", "yuv420p", "-crf", "21", "-preset", "slow", "-g", "15", "-keyint_min", "15", "-sc_threshold", "0", "-movflags", "+faststart", sortie]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\r${N} images → ${sortie}`);
