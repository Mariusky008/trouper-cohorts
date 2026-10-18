// LES IMAGES ET LES SONS DE L'ÉPISODE, TIRÉS DU PROJET → a/
// node outils/face-au-fantome/preparer.cjs   (depuis la racine du dépôt)
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ICI = __dirname;
const RACINE = path.resolve(ICI, "../..");
const A = path.join(ICI, "a");
const pub = (p) => path.join(RACINE, "public", p);
fs.mkdirSync(A, { recursive: true });

(async () => {
  // LES PHOTOS DU MAGRET : la bande floue du haut (≈ 100 px) retirée, agrandies et affinées.
  for (const k of [1, 2, 3, 4]) {
    await sharp(pub(`direct/table/magret/${k}.jpg`))
      .extract({ left: 0, top: 108, width: 758, height: 730 })
      .resize(1819, 1752, { kernel: "lanczos3" })
      .sharpen({ sigma: 1.0, m1: 0.5, m2: 2 })
      .jpeg({ quality: 92 })
      .toFile(path.join(A, `m${k}.jpg`));
  }
  // LE FOND FLOU DE SON PORTRAIT (sans la bande du haut).
  await sharp(pub("direct/table/accueil-bergine.jpg"))
    .extract({ left: 0, top: 92, width: 449, height: 550 })
    .resize(1080, 1920, { fit: "cover" })
    .blur(22)
    .modulate({ brightness: 0.82, saturation: 1.1 })
    .jpeg({ quality: 88 })
    .toFile(path.join(A, "fond-accueil.jpg"));
  // LE LOGO BLANC
  await sharp(pub("clikme-logo-blanc.png")).resize(240).png().toFile(path.join(A, "logo.png"));
  // SA VOIX, CELLE DU REPORTER, ET LE REPORTER LUI-MÊME
  for (const [src, nom] of [
    ["direct/voix/bergine-magret.mp3", "bergine-magret.mp3"],
    ["direct/interview/voix/derniere.mp3", "derniere.mp3"],
    ["direct/interview/voix/a-demain-chef.mp3", "a-demain-chef.mp3"],
    ...[0, 1, 2, 3].map((k) => [`direct/interview/reporter-${k}.webp`, `reporter-${k}.webp`]),
  ]) fs.copyFileSync(pub(src), path.join(A, nom));
  console.log("prêt :", fs.readdirSync(A).join(", "));
})();
