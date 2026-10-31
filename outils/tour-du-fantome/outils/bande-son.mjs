// 🎵 LA BANDE-SON D'UNE DÉMO, D'UN BLOC (`son.mp3`) : la page (`?rendu`) compose elle-même ses voix, sa musique et
// ses bruits, hors ligne (`__son`) ; on l'enregistre ici une fois pour toutes. En direct, la page n'a plus qu'un son
// à jouer — composée sur le téléphone (des milliers de petits sons programmés d'un coup), la musique décrochait.
//
//   node outils/tour-du-fantome/outils/bande-son.mjs <dossier de la démo> <sortie.mp3>
//
// (PLAYWRIGHT_MODULE : le chemin de Playwright s'il n'est pas installé dans le projet ; PW_CHROMIUM : son navigateur)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [dossier, SORTIE] = process.argv.slice(2);
const DOSSIER = path.resolve(dossier);
// Playwright : celui indiqué, celui du projet, ou celui de l'environnement des sessions (comme `rendre-video.mjs`)
let pw = null;
for (const m of [process.env.PLAYWRIGHT_MODULE, "playwright", "/opt/node22/lib/node_modules/playwright/index.js"].filter(Boolean)) {
  try { pw = await import(m); break; } catch { /* le suivant */ }
}
if (!pw) { console.error("bande-son : Playwright introuvable (PLAYWRIGHT_MODULE)"); process.exit(1); }
const chromium = pw.chromium ?? pw.default.chromium;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".webm": "video/webm", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
const nav = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const p = await nav.newPage();
// la démo servie depuis son dossier (sans serveur), les polices de Google laissées de côté
await p.route("**/*", (r) => {
  const u = new URL(r.request().url());
  if (u.hostname !== "demo.local") return r.fulfill({ status: 404, body: "" });
  const f = path.join(DOSSIER, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname));
  if (!f.startsWith(DOSSIER) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: "" });
  r.fulfill({ contentType: TYPES[path.extname(f)] ?? "application/octet-stream", body: fs.readFileSync(f) });
});
await p.goto("http://demo.local/index.html?rendu", { waitUntil: "load" });
await p.evaluate(() => window.__pret);
const { sr, pcm } = await p.evaluate(() => window.__son(0));
await nav.close();
const donnees = Buffer.from(pcm, "base64");
const tete = Buffer.alloc(44);
tete.write("RIFF", 0); tete.writeUInt32LE(36 + donnees.length, 4); tete.write("WAVE", 8); tete.write("fmt ", 12);
tete.writeUInt32LE(16, 16); tete.writeUInt16LE(1, 20); tete.writeUInt16LE(2, 22); tete.writeUInt32LE(sr, 24); tete.writeUInt32LE(sr * 4, 28);
tete.writeUInt16LE(4, 32); tete.writeUInt16LE(16, 34); tete.write("data", 36); tete.writeUInt32LE(donnees.length, 40);
const wav = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bande-son-")), "son.wav");
fs.writeFileSync(wav, Buffer.concat([tete, donnees]));
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "160k", SORTIE]);
fs.rmSync(path.dirname(wav), { recursive: true, force: true });
console.log("bande-son :", SORTIE, Math.round(donnees.length / 4 / sr * 10) / 10, "s");
