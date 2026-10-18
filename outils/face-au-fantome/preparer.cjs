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
  // SA VOIX, ET LE REPORTER LUI-MÊME
  for (const [src, nom] of [
    ["direct/voix/bergine-magret.mp3", "bergine-magret.mp3"],
    ...[0, 1, 2, 3].map((k) => [`direct/interview/reporter-${k}.webp`, `reporter-${k}.webp`]),
  ]) fs.copyFileSync(pub(src), path.join(A, nom));
  // LA VOIX DU FANTÔME : ses questions et son au revoir, pris dans les répliques enregistrées (voix-fantome/)
  const V = path.join(ICI, "voix-fantome");
  for (const [debut, nom] of [
    ["restaurant-02-", "f-q1.mp3"], // « Montre-moi le geste qui fait la différence. »
    ["restaurant-03-", "f-q2.mp3"], // « Et c'est quoi, ton secret, pour qu'il soit si bon ? »
    ["commun-05-", "f-derniere.mp3"], // « Dernière question ! »
    ["restaurant-05-", "f-defi.mp3"], // « Ton plat en trois mots ? »
    ["restaurant-09-", "f-ademain.mp3"], // « À demain, et bon appétit ! »
  ]) fs.copyFileSync(path.join(V, fs.readdirSync(V).find((f) => f.startsWith(debut))), path.join(A, nom));
  console.log("prêt :", fs.readdirSync(A).join(", "));
})();
