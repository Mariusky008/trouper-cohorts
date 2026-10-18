// 🗓️ LE PLANNING DES INTERVIEWS — pas de redite, métier par métier, sur une année.
//
// « Il ne faut pas que ce soit redondant avec les mêmes questions. » Ce qui se
// vérifie ici, sans téléphone, avec `src/lib/direct/interview-planning.ts` :
//   · chaque jour donne 2, 3 ou 4 questions, sans doublon dans la même interview ;
//   · l'écart le plus court avant qu'une même question revienne, par emplacement
//     (produit, rubrique, petit plus, chute), sur 365 jours d'interviews à quatre
//     questions — et il doit rester au-dessus des seuils ci-dessous ;
//   · aucun mot du restaurant (chef, plat, cuisine, appétit) chez les autres ;
//   · des questions courtes (dites en moins de quatre secondes) et ponctuées ;
//   · le calendrier tombe aux bonnes dates (fête des mères, Pâques, rentrée…).
//
//   node scripts/verifier-planning-interview.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/interview-planning.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", "require", js)(boite.exports, boite, exige);
const { BANQUES, PORTRAITS, DEFIS, JEUX, SURPRISES, questionsDuJour, evenementDuJour, rubriqueDuJour, phrasesDuMetier } = boite.exports;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};
const iso = (d) => d.toISOString().slice(0, 10);
const jours = (depuis, n) => Array.from({ length: n }, (_, k) => iso(new Date(Date.parse(`${depuis}T12:00:00Z`) + k * 86_400_000)));

/** Le plus petit nombre de jours entre deux apparitions d'une même question, PAR BANQUE —
 *  où qu'elle serve dans l'interview. Les rubriques de la semaine (une fois par semaine)
 *  doivent tenir six semaines ; les banques qui servent presque tous les jours, dix. */
const SEUILS = { produit: 10, geste: 42, origine: 42, pourqui: 42, clients: 42, duels: 28, portraits: 21, surprises: 21, defis: 14, jeux: 14 };
const ANNEE = jours("2026-11-02", 365);

for (const metier of Object.keys(BANQUES)) {
  console.log(`══ ${metier} ══`);
  const vu = new Map();
  const ecart = Object.fromEntries(Object.keys(SEUILS).map((b) => [b, Infinity]));
  let doublons = 0;
  ANNEE.forEach((jour, k) => {
    for (const n of [2, 3, 4]) {
      const q = questionsDuJour(metier, jour, n);
      if (q.length !== n) dire(false, `${jour} : ${q.length} questions au lieu de ${n}`);
      if (new Set(q.map((x) => x.texte)).size !== q.length) doublons++;
    }
    for (const q of questionsDuJour(metier, jour, 4)) {
      if (q.banque === "calendrier") continue;
      const cle = `${q.banque}:${q.texte}`;
      if (vu.has(cle)) ecart[q.banque] = Math.min(ecart[q.banque], k - vu.get(cle));
      vu.set(cle, k);
    }
  });
  dire(doublons === 0, `aucune question en double dans une même interview${doublons ? ` (${doublons} jours fautifs)` : ""}`);
  for (const banque of Object.keys(SEUILS)) {
    const e = ecart[banque] === Infinity ? "jamais en un an" : `${ecart[banque]} jours`;
    dire(ecart[banque] >= SEUILS[banque], `${banque} : une même question revient au plus tôt après ${e} (seuil ${SEUILS[banque]})`);
  }
  const b = BANQUES[metier];
  if (metier !== "table") {
    const textes = [...b.produit, ...b.geste, ...b.origine, ...b.pourqui, ...b.clients, ...b.duels, b.trois].join(" ");
    dire(!/\bchef\b|\bplat\b|appétit|cuisine/i.test(textes), "aucun mot du restaurant (chef, plat, cuisine, appétit)");
  }
  const phrases = phrasesDuMetier(metier);
  const longues = phrases.filter((p) => p.length > 70);
  dire(!longues.length, `des questions courtes (70 signes au plus)${longues.length ? ` — trop longues : ${longues.join(" | ")}` : ""}`);
  const nues = phrases.filter((p) => !/[?!.…]$/.test(p));
  dire(!nues.length, `toutes ponctuées${nues.length ? ` — sans ponctuation : ${nues.join(" | ")}` : ""}`);
  console.log(`       ${phrases.length} phrases différentes pour ce métier`);
}

console.log("══ le calendrier ══");
const attendu = [
  ["2027-05-30", "fete-des-meres"], // dernier dimanche de mai 2027, la Pentecôte est le 16
  ["2027-03-28", "paques"],
  ["2027-02-14", "saint-valentin"],
  ["2027-09-06", "rentree"], // premier lundi de septembre 2027
  ["2026-11-27", "en-ligne"], // lendemain du quatrième jeudi de novembre 2026
  ["2027-06-20", "fete-des-peres"], // troisième dimanche de juin 2027
  ["2027-01-13", "soldes-hiver"], // deuxième mercredi de janvier 2027
];
for (const [jour, id] of attendu) {
  const ev = evenementDuJour(metier0(), jour);
  dire(ev?.id === id, `${jour} → ${id} (trouvé : ${ev?.id ?? "rien"})`);
}
function metier0() {
  return "mode";
}
const ev = evenementDuJour("mode", "2027-03-14", { anniversaire: "03-14" });
dire(ev?.id === "anniversaire", "l'anniversaire de la boutique, le jour dit");

console.log("══ les jours ouverts ══");
const semaine = jours("2026-11-02", 14).map((j) => rubriqueDuJour(j, { ouvert: [2, 3, 4, 5, 6] }));
dire(new Set(semaine).size === 7, "fermé dimanche et lundi : les sept rubriques passent quand même en deux semaines");
dire(rubriqueDuJour("2026-11-02") === "geste" && rubriqueDuJour("2026-11-08") === "portrait", "ouvert tous les jours : lundi le geste, dimanche le portrait");

console.log(`\n${echecs ? `${echecs} échec(s)` : "tout est bon"} — ${PORTRAITS.length} portraits, ${SURPRISES.length} surprises, ${DEFIS.length} défis, ${JEUX.length} jeux`);
process.exit(echecs ? 1 : 0);
