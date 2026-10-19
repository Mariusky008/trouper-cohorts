// 🎬 L'ÉPISODE — ce que la session garde, et le plan du film, sans téléphone.
//
// « Que ça crée une super vidéo, Épisode 1 de sa série 2026. » Ce qui se vérifie ici :
//   · la réserve couvre toute la session (une demi-heure, une heure et demie)
//     sans jamais garder plus que `GARDES_MAX` morceaux, garde le meilleur de
//     chaque tranche, et toujours le dernier (le produit fini) ;
//   · les images de l'accéléré restent sous `IMAGES_MAX` et couvrent toute la session ;
//   · la note : le noir et la secousse ne valent rien, des mains qui travaillent si ;
//   · l'épisode dure de 40 s à 4 min selon la session, la bande-annonce tient
//     dans un Reel (90 s au plus), et chacun finit par la révélation puis la carte ;
//   · son titre dans Le Direct tient en 140 signes.
//
//   node scripts/verifier-episode.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/episode.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", js)(boite.exports, boite);
const E = boite.exports;

let fautes = 0;
const verifier = (ok, message) => {
  if (!ok) {
    fautes++;
    console.error("✗", message);
  } else console.log("✓", message);
};

// Une session simulée : un morceau toutes les 6 s, une note qui monte et descend
function session(secondes, graine = 1) {
  const jetes = [];
  const r = new E.Reserve(E.GARDES_MAX, (m) => jetes.push(m));
  const acc = new E.Accelere();
  let n = 0;
  for (let t = 0; t + E.MORCEAU_S <= secondes; t += E.MORCEAU_S) {
    const score = Math.abs(Math.sin(n * 0.7 + graine)) * (t / secondes < 0.1 ? 0.3 : 1);
    r.ajouter({ n: n++, debut: t, duree: E.MORCEAU_S - 0.1, score });
    for (let i = t; i < t + E.MORCEAU_S; i += 0.25) if (acc.aPrendre(i)) acc.ajouter({ t: i });
  }
  return { r, acc, n, jetes };
}

for (const minutes of [1, 5, 30, 90]) {
  const S = minutes * 60;
  const { r, acc, n, jetes } = session(S);
  const l = r.liste();
  verifier(l.length <= E.GARDES_MAX + 1, `${minutes} min : ${l.length} morceaux gardés sur ${n} (au plus ${E.GARDES_MAX + 1})`);
  verifier(l.length + jetes.length === n, `${minutes} min : chaque morceau est gardé ou rendu (${jetes.length} rendus)`);
  verifier(l[l.length - 1].n === n - 1, `${minutes} min : le dernier morceau (le produit fini) est gardé`);
  const trous = l.slice(1).map((m, i) => m.debut - l[i].debut);
  verifier(Math.max(...trous, 0) <= Math.max(60, S / 12), `${minutes} min : pas de trou de plus de ${Math.round(Math.max(60, S / 12))} s entre deux morceaux (le plus grand : ${Math.round(Math.max(...trous, 0))} s)`);
  verifier(acc.images.length <= E.IMAGES_MAX && acc.images[acc.images.length - 1].t > S - 60, `${minutes} min : ${acc.images.length} images d'accéléré jusqu'à la fin`);

  const morceaux = l.map(({ n: _n, ...m }) => ({ n: _n, ...m }));
  const images = acc.images.map((i) => i.t);
  const ep = E.planDuMontage({ morceaux, images, session: S, genre: "episode" });
  const d = E.dureeDuPlan(ep);
  verifier(d >= 15 && d <= 247, `${minutes} min : l'épisode dure ${Math.round(d)} s (visé : ${E.dureeVisee(S)} s)`);
  verifier(ep[0].genre === "titre" && ep[ep.length - 2].genre === "revelation" && ep[ep.length - 1].genre === "fin", `${minutes} min : titre … révélation, fin`);
  const heures = ep.filter((b) => b.genre === "moment").map((b) => b.heure);
  verifier(heures.every((h, i) => i === 0 || h > heures[i - 1]), `${minutes} min : ${heures.length} moments, dans l'ordre du tournage`);
  const bande = E.planDuMontage({ morceaux, images, session: S, genre: "bande" });
  verifier(E.dureeDuPlan(bande) <= 60, `${minutes} min : la bande-annonce dure ${Math.round(E.dureeDuPlan(bande))} s (un Reel : 90 s au plus)`);
}

const vide = E.mesuresVides();
let noir = vide;
let secousse = vide;
let mains = vide;
for (let i = 0; i < 24; i++) {
  noir = E.mesurer(noir, 6, 8, -40);
  secousse = E.mesurer(secousse, i === 5 ? 90 : 6, 120, -40);
  mains = E.mesurer(mains, 6, 120, -35);
}
verifier(E.noter(noir) < E.noter(mains) / 3, `le noir (${E.noter(noir)}) ne vaut rien à côté des mains qui travaillent (${E.noter(mains)})`);
verifier(E.noter(secousse) < E.noter(mains), `la secousse (${E.noter(secousse)}) vaut moins que les mains qui travaillent`);
verifier(E.noter(vide) === 0, "un morceau sans mesure vaut zéro");

verifier(E.texteDeLEpisode(2026, 1, "x".repeat(200), "12 €").length <= 140, "le titre dans Le Direct tient en 140 signes");
verifier(E.texteDeLEpisode(2026, 3, "Le fraisier", "32 €") === "🎬 Saison 2026 · Épisode 3 : Le fraisier · 32 €", "« 🎬 Saison 2026 · Épisode 3 : Le fraisier · 32 € »");
verifier(E.prochainEpisode("x").numero === 1, "sans mémoire, c'est l'épisode 1");
verifier(E.enDuree(725) === "12 min" && E.enDuree(3900) === "1 h 05", "« 12 min », « 1 h 05 »");

if (fautes) {
  console.error(`\n${fautes} vérification(s) en échec.`);
  process.exit(1);
}
console.log("\nL'épisode tient.");
