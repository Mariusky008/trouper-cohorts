// 🎯 LES REPÈRES DU VISAGE (MediaPipe Face Landmarker, le modèle de l'app) sur une photo : leurs 478 points, en
// pixels, pour la figurine de la démo humaine (`figurine.py`, `detourer.py`).
//   node outils/tour-du-fantome/outils/reperes-visage.mjs <photo.jpg> <sortie.json>
// (PLAYWRIGHT_MODULE : le chemin de Playwright s'il n'est pas installé dans le projet ; PW_CHROMIUM : son navigateur)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const chromium = pw.chromium ?? pw.default.chromium;
const [PHOTO, SORTIE] = process.argv.slice(2);
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MP = `${R}/node_modules/@mediapipe/tasks-vision`;
const types = { ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".task": "application/octet-stream", ".jpg": "image/jpeg", ".html": "text/html" };
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
const p = await b.newPage();
await p.route("http://essai.local/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  let f = null;
  if (u === "/") return r.fulfill({ contentType: "text/html", body: "<!doctype html><title>e</title>" });
  if (u === "/photo.jpg") f = PHOTO;
  else if (u === "/face_landmarker.task") f = `${R}/public/mediapipe/face_landmarker.task`;
  else if (u.startsWith("/mp/")) f = path.join(MP, u.slice(4));
  if (!f || !fs.existsSync(f)) return r.fulfill({ status: 404, body: "" });
  r.fulfill({ contentType: types[path.extname(f)] ?? "application/octet-stream", body: fs.readFileSync(f) });
});
await p.goto("http://essai.local/");
const res = await p.evaluate(async () => {
  const { FilesetResolver, FaceLandmarker } = await import("/mp/vision_bundle.mjs");
  const fichiers = await FilesetResolver.forVisionTasks("/mp/wasm");
  const d = await FaceLandmarker.createFromOptions(fichiers, { baseOptions: { modelAssetPath: "/face_landmarker.task", delegate: "CPU" }, runningMode: "IMAGE", numFaces: 1 });
  const img = new Image();
  img.src = "/photo.jpg";
  await img.decode();
  const r = d.detect(img);
  const pts = (r.faceLandmarks[0] ?? []).map((q) => [Math.round(q.x * img.naturalWidth * 10) / 10, Math.round(q.y * img.naturalHeight * 10) / 10]);
  return { w: img.naturalWidth, h: img.naturalHeight, n: pts.length, pts };
});
fs.writeFileSync(SORTIE, JSON.stringify(res));
const pt = (i) => res.pts[i];
console.log(JSON.stringify({ n: res.n, coinG: pt(61), coinD: pt(291), hautInt: pt(13), basInt: pt(14), hautExt: pt(0), basExt: pt(17), menton: pt(152) }));
await b.close();
