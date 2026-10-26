// 🎞️ UNE DÉMO EN VIDÉO (MP4, 1080 × 1920, avec le son) — pour les pages pilotées par une ligne de temps
// (`tour-court2.html`) : la page, ouverte avec `?rendu`, dessine n'importe quel instant (`__rendre(t)`) et calcule
// son propre son hors ligne (`__son()`). On photographie chaque image, puis ffmpeg assemble les images et le son.
//
//   node outils/tour-du-fantome/outils/rendre-video.mjs <adresse de la page> <sortie.mp4> [images par seconde = 30] [attente avant = 1]
//
// « attente avant » : les secondes de la cage qui se balance, avant qu'on la touche.
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [adresse, sortie, ipsArg, avantArg] = process.argv.slice(2);
if (!adresse || !sortie) { console.error("usage : rendre-video.mjs <adresse> <sortie.mp4> [ips] [attente]"); process.exit(1); }
const IPS = Number(ipsArg || 30), AVANT = Number(avantArg ?? 1);
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "rendu-"));
const nav = await pw.chromium.launch();
const p = await (await nav.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(adresse + (adresse.includes("?") ? "&" : "?") + "rendu", { waitUntil: "load" });
await p.evaluate(() => window.__pret);
const duree = await p.evaluate(() => window.__duree);
const N = Math.ceil((duree + AVANT) * IPS);
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const t = i / IPS - AVANT;
  await p.evaluate((x) => (x < 0 ? window.__attente(x + 10) : window.__rendre(x)), t);
  await p.screenshot({ path: path.join(dossier, String(i).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 90 });
  if (i % 60 === 0) process.stdout.write(`\r${i}/${N} images…`);
}
console.log(`\r${N} images en ${Math.round((Date.now() - t0) / 1000)} s`);
// le son, calculé par la page elle-même (les voix, la musique, les bruits), décalé de l'attente
const { sr, pcm } = await p.evaluate((a) => window.__son(a), AVANT);
const donnees = Buffer.from(pcm, "base64");
const tete = Buffer.alloc(44);
tete.write("RIFF", 0); tete.writeUInt32LE(36 + donnees.length, 4); tete.write("WAVE", 8); tete.write("fmt ", 12);
tete.writeUInt32LE(16, 16); tete.writeUInt16LE(1, 20); tete.writeUInt16LE(2, 22); tete.writeUInt32LE(sr, 24); tete.writeUInt32LE(sr * 4, 28);
tete.writeUInt16LE(4, 32); tete.writeUInt16LE(16, 34); tete.write("data", 36); tete.writeUInt32LE(donnees.length, 40);
fs.writeFileSync(path.join(dossier, "son.wav"), Buffer.concat([tete, donnees]));
await nav.close();
const ff = fs.existsSync(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "ffmpeg")) ? path.join(path.dirname(new URL(import.meta.url).pathname), "..", "ffmpeg") : "ffmpeg";
execFileSync(ff, ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(IPS), "-i", path.join(dossier, "%05d.jpg"), "-i", path.join(dossier, "son.wav"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", sortie]);
fs.rmSync(dossier, { recursive: true, force: true });
console.log(erreurs.length ? "ERREURS : " + erreurs.join(" | ") : "aucune erreur de page", "→", sortie);
