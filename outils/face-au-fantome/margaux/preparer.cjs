// LES IMAGES ET LES SONS DE L'ÉPISODE DE MARGAUX (Les Lunettes de Margaux, lunetier) → margaux/a
// node outils/face-au-fantome/margaux/preparer.cjs [dossier de la musique]   (depuis la racine du dépôt)
//
// Tout vient du dépôt, sauf la musique (droits) :
//   - les 6 photos du lunetier : outils/tour-du-fantome/recu/lunettes/photos (fournies par le propriétaire) ;
//   - sa voix : celle d'Aurore (ElevenLabs), qui répond à la question 1 : recu/lunettes/voix/margaux.mp3 ;
//   - musique.mp3 : « Tech House Vibes », Mixkit (la même que l'épisode de Lou ; par défaut lou/a/musique.mp3).
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ICI = __dirname;
const RACINE = path.resolve(ICI, "../../..");
const RECU = path.join(RACINE, "outils/tour-du-fantome/recu/lunettes");
const MUSIQUE = path.join(path.resolve(process.argv[2] || path.join(ICI, "../lou/a")), "musique.mp3");
const A = path.join(ICI, "a");
const V = path.join(RACINE, "public/direct/interview/fantome");
fs.mkdirSync(A, { recursive: true });
const f = (k) => path.join(RECU, "photos", `${k}.jpg`);

/** Un recadrage, en fractions de la photo, agrandi à la hauteur de l'écran (1920). */
async function decoupe(k, x, y, w, h, sortie, haut = 1920) {
  const m = await sharp(f(k)).metadata();
  await sharp(f(k))
    .extract({ left: Math.round(x * m.width), top: Math.round(y * m.height), width: Math.round(w * m.width), height: Math.round(h * m.height) })
    .resize({ height: haut, kernel: "lanczos3" }).sharpen({ sigma: 0.8 }).jpeg({ quality: 90 }).toFile(path.join(A, sortie));
}

(async () => {
  // portée de profil, la monture de côté, le cristal de tout près, la boutique : en grand
  for (const k of ["visage", "profil", "gros-plan", "boutique"])
    await sharp(f(k)).resize({ height: 1920, kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).jpeg({ quality: 90 }).toFile(path.join(A, `${k}.jpg`));
  // « je l'ajuste devant vous » : ses mains sur la monture, et la cliente (sans l'opticien qui tient la photo)
  await decoupe("geste", 0.33, 0, 0.55, 1, "mains.jpg");
  // le fond flou derrière elle (plan titre, relief) : la boutique
  await sharp(f("boutique")).resize(1080, 1920, { fit: "cover", position: "left" }).blur(26).modulate({ brightness: 0.75, saturation: 1.05 }).jpeg({ quality: 86 }).toFile(path.join(A, "fond.jpg"));
  // ELLE, DÉTOURÉE : le masque (MediaPipe « selfie segmentation », affiné sur le fond bleu uni) posé sur la photo
  const { width: LW, height: LH } = await sharp(f("visage")).metadata();
  const photo = await sharp(f("visage")).removeAlpha().raw().toBuffer();
  const masque = await sharp(path.join(ICI, "masque.png")).extractChannel(0).resize(LW, LH).raw().toBuffer();
  const px = Buffer.alloc(LW * LH * 4);
  // la photo coupe ses cheveux en haut et à gauche : ces bords-là s'estompent au lieu de trancher net
  const fondu = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
  for (let i = 0; i < LW * LH; i++) {
    const x = i % LW, y = Math.floor(i / LW), bord = fondu(y / (0.12 * LH)) * fondu(x / (0.1 * LW));
    px[i * 4] = photo[i * 3]; px[i * 4 + 1] = photo[i * 3 + 1]; px[i * 4 + 2] = photo[i * 3 + 2]; px[i * 4 + 3] = Math.round(masque[i] * bord);
  }
  await sharp(px, { raw: { width: LW, height: LH, channels: 4 } }).png().toFile(path.join(A, "elle.png"));
  // SA VOIX, LA MUSIQUE
  fs.copyFileSync(path.join(RECU, "voix/margaux.mp3"), path.join(A, "reponse.mp3"));
  fs.copyFileSync(MUSIQUE, path.join(A, "musique.mp3"));
  // LA VOIX DU FANTÔME : ses questions de lunetier
  for (const [debut, nom] of [
    ["lunettes-01-", "f-q1.mp3"], // « Alors, c'est quoi, la monture du moment ? »
    ["lunettes-03-", "f-q2.mp3"], // « Et à quel visage elle va le mieux ? »
    ["lunettes-09-", "f-abientot.mp3"], // « À bientôt, chez l'opticien ! »
  ]) fs.copyFileSync(path.join(V, fs.readdirSync(V).find((x) => x.startsWith(debut))), path.join(A, nom));
  // LE REPORTER, LE LOGO, LES POLICES
  for (const k of [0, 1, 2, 3]) fs.copyFileSync(path.join(RACINE, "public", `direct/interview/reporter-${k}.webp`), path.join(A, `reporter-${k}.webp`));
  await sharp(path.join(RACINE, "public", "clikme-logo-blanc.png")).resize(240).png().toFile(path.join(A, "logo.png"));
  fs.cpSync(path.join(ICI, "../polices"), path.join(A, "polices"), { recursive: true });
  console.log("prêt :", fs.readdirSync(A).join(", "));
})();
