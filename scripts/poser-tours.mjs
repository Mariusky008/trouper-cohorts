// 👻 METTRE LES TOURS DU FANTÔME SUR CLIKME.FR, À `/tours/<métier>`.
//
// POURQUOI ILS SONT ICI ET PLUS SEULEMENT SUR CLAUDE.AI. Les six tours étaient publiés comme
// « artefacts » claude.ai : un lien par tour, qu'on ne peut mettre à jour que depuis le compte
// claude.ai qui l'a créé — le partage « en modification » à un autre compte ne donne que la lecture.
// Un correctif poussé sur main ne changeait donc rien à ce que voyait un commerçant tant que ce
// compte-là ne republiait pas. Servis par le site, ils suivent main comme le reste : chaque
// déploiement les recopie.
//
// LES SOURCES NE BOUGENT PAS. Les scripts de `outils/tour-du-fantome/outils/` continuent d'écrire
// `outils/tour-du-fantome/<dossier>/index.html` et ses fichiers ; ce script, appelé en `prebuild`
// comme `poser-mediapipe.sh`, les recopie dans `public/tours/<métier>/` (non versionné : pas deux
// copies de 100 Mo dans le dépôt). `.vercelignore` laisse partir les six dossiers des tours, et
// eux seuls (ni les voix brutes, ni les scripts).
//
// CE QU'IL AJOUTE À LA PAGE : l'en-tête qu'un artefact reçoit à la publication (doctype, encodage,
// viewport), et `noindex` — les commerces des tours sont fictifs ; « Chez Bergine, Dax » ne doit
// pas sortir dans Google pour quelqu'un qui cherche un vrai restaurant.
//
// UN DOSSIER MANQUANT FAIT ÉCHOUER LA COMPILATION, exprès : mieux vaut un déploiement refusé (le
// site en ligne reste celui d'avant) qu'un bouton « Voir la démo » qui répond 404 sans rien dire.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = path.join(RACINE, "outils/tour-du-fantome");
const DEST = path.join(RACINE, "public/tours");

// le dossier de chaque tour → son adresse sur le site
const TOURS = {
  tour: "restaurant",
  "tour-vetements": "vetements",
  "tour-coiffure": "coiffure",
  "tour-librairie": "librairie",
  "tour-bijouterie": "bijouterie",
  "tour-lunettes": "lunettes",
  "tour-massage": "massage",
  // la démo courte des commerçants, « Le fantôme en 45 secondes » (`outils/tour-court.py`)
  "tour-court": "court",
};

// les étapes intermédiaires de la chaîne (`index.avant-episode2.html`…) ne sont pas la page
const ignorer = (nom) => /^index\.avant.*\.html$/.test(nom);

const ENTETE =
  '<!doctype html>\n<html lang="fr">\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="robots" content="noindex">\n';

function copier(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (ignorer(e.name)) continue;
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    // un lien symbolique est recopié comme le fichier qu'il désigne
    if (fs.statSync(a).isDirectory()) copier(a, b);
    else fs.copyFileSync(a, b);
  }
}

fs.rmSync(DEST, { recursive: true, force: true });
let octets = 0;
for (const [dossier, metier] of Object.entries(TOURS)) {
  const src = path.join(SOURCES, dossier), dst = path.join(DEST, metier);
  const page = path.join(src, "index.html");
  if (!fs.existsSync(page)) {
    console.error(`poser-tours : ${path.relative(RACINE, page)} introuvable (voir .vercelignore)`);
    process.exit(1);
  }
  copier(src, dst);
  const html = fs.readFileSync(page, "utf8");
  fs.writeFileSync(path.join(dst, "index.html"), /^\s*<!doctype/i.test(html) ? html : ENTETE + html);
  const taille = fs.readdirSync(dst, { recursive: true }).reduce((n, f) => {
    const p = path.join(dst, f);
    return fs.statSync(p).isFile() ? n + fs.statSync(p).size : n;
  }, 0);
  octets += taille;
  console.log(`poser-tours : /tours/${metier} ← ${dossier} (${(taille / 1e6).toFixed(1)} Mo)`);
}
console.log(`poser-tours : ${Object.keys(TOURS).length} tours, ${(octets / 1e6).toFixed(1)} Mo`);
