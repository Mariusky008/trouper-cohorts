// LES IMAGES ET LES SONS DE L'ÉPISODE DE LOU → lou/a
// node outils/face-au-fantome/lou/preparer.cjs <dossier reçu>   (depuis la racine du dépôt)
//
// Le dossier reçu contient ce qui n'est PAS dans le dépôt, pour des raisons de droits :
//   - les 8 photos, sous leurs noms d'origine (voir PHOTOS) ;
//   - sa voix : reponse-1.mp3, reponse-2.mp3, defi.mp3, invitation.mp3 (ElevenLabs) ;
//   - musique.mp3 : « Tech House Vibes », Mixkit.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ICI = __dirname;
const RACINE = path.resolve(ICI, "../../..");
const RECU = path.resolve(process.argv[2] || "");
const A = path.join(ICI, "a");
const V = path.join(ICI, "../voix-fantome");
fs.mkdirSync(A, { recursive: true });

const PHOTOS = {
  sequins: "71YYJudHERL._AC_UY350_.jpg", // la veste à sequins — Amazon, pas libre de droits
  pulls: "ca-deforme-le-pull-decouvrez-la-pire-erreur-a-ne-surtout-pas-faire-avec-vos-pulls-en-maille-pour-ne-pas-les-abimer.jpg", // un blog, pas libre de droits
  portrait: "pexels-anh-nguyen-517648218-19163082.jpg",
  rue: "pexels-ekam-juneja-61080223-19192418.jpg",
  parc: "pexels-lichtberlin-19166121.jpg",
  metro: "pexels-maide-arslan-128712163-19169192.jpg",
  quai: "pexels-mindblown-19329359.jpg",
  tourne: "pexels-thai-hoang-19316100.jpg",
};
const f = (k) => path.join(RECU, PHOTOS[k]);

/** Un recadrage serré, en fractions de la photo : ce que dit Lou, de tout près. */
async function decoupe(k, x, y, w, h, sortie, haut = 1920) {
  const m = await sharp(f(k)).metadata();
  await sharp(f(k))
    .extract({ left: Math.round(x * m.width), top: Math.round(y * m.height), width: Math.round(w * m.width), height: Math.round(h * m.height) })
    .resize({ height: haut, kernel: "lanczos3" }).sharpen({ sigma: 0.8 }).jpeg({ quality: 90 }).toFile(path.join(A, sortie));
}

(async () => {
  await sharp(f("sequins")).jpeg({ quality: 92 }).toFile(path.join(A, "sequins.jpg"));
  await sharp(f("pulls")).jpeg({ quality: 92 }).toFile(path.join(A, "pulls.jpg"));
  for (const k of ["portrait", "rue", "parc", "metro", "quai", "tourne"])
    await sharp(f(k)).resize({ height: 2400, kernel: "lanczos3", withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(path.join(A, `${k}.jpg`));
  // le fond flou derrière elle (plan titre, relief)
  await sharp(f("portrait")).resize(1080, 1920, { fit: "cover" }).blur(24).modulate({ brightness: 0.8, saturation: 1.05 }).jpeg({ quality: 86 }).toFile(path.join(A, "fond-lou.jpg"));
  await decoupe("rue", 0.34, 0.52, 0.40, 0.47, "bottes.jpg"); // « avec des boots »
  await decoupe("metro", 0.05, 0.38, 0.35, 0.42, "laine.jpg"); // « laine et cachemire »
  await decoupe("metro", 0.22, 0.33, 0.56, 0.66, "ceinture.jpg", 2600); // « je le noue à la taille… comme ça »
  // ELLE, DÉTOURÉE : le masque (MediaPipe, 660 × 989) agrandi deux fois et posé sur la photo
  const LW = 1320, LH = 1978;
  const photo = await sharp(f("portrait")).resize(LW, LH).removeAlpha().raw().toBuffer();
  const masque = await sharp(path.join(ICI, "masque.png")).extractChannel(0).resize(LW, LH, { kernel: "lanczos3" }).blur(1.2).raw().toBuffer();
  const px = Buffer.alloc(LW * LH * 4);
  // le masque vaut ~21 hors d'elle, pas 0 : sans ce seuil, un voile rectangulaire passe devant LOU
  const alpha = (m) => Math.round(255 * Math.min(1, Math.max(0, (m - 70) / 130)));
  for (let i = 0; i < LW * LH; i++) { px[i * 4] = photo[i * 3]; px[i * 4 + 1] = photo[i * 3 + 1]; px[i * 4 + 2] = photo[i * 3 + 2]; px[i * 4 + 3] = alpha(masque[i]); }
  await sharp(px, { raw: { width: LW, height: LH, channels: 4 } }).png().toFile(path.join(A, "lou.png"));
  // SA VOIX, LA MUSIQUE
  for (const n of ["reponse-1.mp3", "reponse-2.mp3", "defi.mp3", "invitation.mp3", "musique.mp3"]) fs.copyFileSync(path.join(RECU, n), path.join(A, n));
  // LA VOIX DU FANTÔME : ses questions de boutique de vêtements
  for (const [debut, nom] of [
    ["mode-01-", "f-q1.mp3"], // « Alors, c'est quoi, ta pièce du jour ? »
    ["mode-02-", "f-q2.mp3"], // « Montre-moi comment tu la portes ! »
    ["commun-05-", "f-derniere.mp3"], // « Dernière question ! »
    ["mode-05-", "f-defi.mp3"], // « Ta boutique en trois mots ? »
    ["mode-09-", "f-abientot.mp3"], // « À bientôt, en boutique ! »
  ]) fs.copyFileSync(path.join(V, fs.readdirSync(V).find((x) => x.startsWith(debut))), path.join(A, nom));
  // LE REPORTER, LE LOGO, LES POLICES
  for (const k of [0, 1, 2, 3]) fs.copyFileSync(path.join(RACINE, "public", `direct/interview/reporter-${k}.webp`), path.join(A, `reporter-${k}.webp`));
  await sharp(path.join(RACINE, "public", "clikme-logo-blanc.png")).resize(240).png().toFile(path.join(A, "logo.png"));
  fs.cpSync(path.join(ICI, "../polices"), path.join(A, "polices"), { recursive: true });
  console.log("prêt :", fs.readdirSync(A).join(", "));
})();
