// 💡 LES PISTES DE L'INTERVIEW — chaque question a les siennes, et elles tiennent à l'écran.
//
// « J'ai une seule peur : c'est que le commerçant ne sache pas quoi dire. »
// Ce qui se vérifie ici, sans téléphone (voir `interview-pistes.ts`) :
//   · chaque question du planning, dans chaque métier, a des pistes ÉCRITES
//     pour elle (ou pour sa famille : le produit du métier, « ceci ou cela »,
//     le défi en trois mots, la fête du jour) — jamais les pistes de secours ;
//   · aucune piste n'est écrite pour une question qui n'existe pas (une faute
//     de frappe la rendrait muette) ;
//   · trois pistes courtes (24 signes au plus : elles tiennent sur une ligne
//     près de la caméra) et une relance de 60 signes au plus ;
//   · sur une année entière, de une à quatre questions par jour, chaque
//     question tirée reçoit ses pistes.
//
//   node scripts/verifier-pistes-interview.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");
const modules = {};
function charger(nom) {
  if (modules[nom]) return modules[nom].exports;
  const js = ts.transpileModule(readFileSync(`src/lib/direct/${nom}.ts`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const m = { exports: {} };
  modules[nom] = m;
  new Function("exports", "module", "require", js)(m.exports, m, (r) => charger(r.replace(/^\.\//, "")));
  return m.exports;
}
const PL = charger("interview-planning");
const { pistesDe, PISTES_ECRITES, relancesDuMetier } = charger("interview-pistes");
const { PAR_QUESTION, PAR_GENRE } = PISTES_ECRITES;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};
// « Ceci ou cela » a ses pistes à elle, les mêmes pour toutes : ce ne sont pas des pistes de secours
const deSecours = (p) => p !== PISTES_ECRITES.DUEL && Object.values(PAR_GENRE).includes(p);

console.log("══ chaque question, ses pistes ══");
const toutes = new Set();
for (const [metier, b] of Object.entries(PL.BANQUES)) {
  const manque = [];
  const voir = (question, genre) => {
    toutes.add(question);
    const p = pistesDe(metier, { question, genre });
    if (deSecours(p)) manque.push(question);
  };
  [...b.produit, ...PL.PRODUIT_COMMUN].forEach((q) => voir(q, "produit"));
  voir(PL.PRODUIT_RETOUR, "produit");
  b.geste.forEach((q) => voir(q, "geste"));
  b.origine.forEach((q) => voir(q, "origine"));
  b.pourqui.forEach((q) => voir(q, "pourqui"));
  b.clients.forEach((q) => voir(q, "client"));
  b.duels.forEach((q) => voir(q, "duel"));
  voir(b.trois, "defi");
  PL.PORTRAITS.forEach((q) => voir(q, "portrait"));
  PL.SURPRISES.forEach((q) => voir(q, "surprise"));
  PL.DEFIS.filter(Boolean).forEach((q) => voir(q, "defi"));
  PL.JEUX.forEach((q) => voir(q, "chute"));
  voir(PL.ANNIVERSAIRE, "calendrier");
  for (const e of PL.CALENDRIER) {
    if (e.metiers && !e.metiers.includes(metier)) continue;
    voir((e.parMetier?.[metier] ?? e.question).replace("{chez}", b.chez), "calendrier");
  }
  dire(!manque.length, `${metier} : chaque question a ses pistes écrites${manque.length ? ` — manquent : ${manque.join(" | ")}` : ""}`);
}

console.log("══ aucune piste perdue ══");
const orphelines = Object.keys(PAR_QUESTION).filter((q) => !toutes.has(q));
dire(!orphelines.length, `toutes les pistes écrites répondent à une vraie question${orphelines.length ? ` — sans question : ${orphelines.join(" | ")}` : ""}`);

console.log("══ elles tiennent à l'écran ══");
const longues = [];
const tous = [...Object.values(PAR_QUESTION), ...Object.values(PISTES_ECRITES.PRODUIT), PISTES_ECRITES.DUEL, PISTES_ECRITES.TROIS, ...Object.values(PISTES_ECRITES.FETES), ...Object.values(PISTES_ECRITES.FETES_PAR_METIER), ...Object.values(PAR_GENRE)];
for (const p of tous) {
  for (const x of p.pistes) if (x.length > 24) longues.push(`« ${x} »`);
  if (p.relance.length > 60) longues.push(`relance « ${p.relance} »`);
  if (!/[?!.»…]$/.test(p.relance)) longues.push(`relance sans ponctuation : « ${p.relance} »`);
}
dire(!longues.length, `trois pistes de 24 signes au plus, une relance de 60 au plus${longues.length ? ` — trop longues : ${longues.join(", ")}` : ""}`);

console.log("══ une année de questions ══");
let tirees = 0;
const sansPistes = new Set();
for (const metier of Object.keys(PL.BANQUES)) {
  const quoi = "Le produit du jour";
  for (let j = 0; j < 365; j++) {
    const iso = new Date(Date.UTC(2026, 0, 1 + j)).toISOString().slice(0, 10);
    for (const n of [1, 2, 3, 4]) {
      for (const q of PL.questionsDeLInterview(metier, iso, n, quoi)) {
        tirees++;
        if (deSecours(pistesDe(metier, q))) sansPistes.add(`${metier} : ${q.question}`);
      }
    }
  }
}
dire(!sansPistes.size, `${tirees} questions tirées en 2026 : toutes ont leurs pistes${sansPistes.size ? ` — sans : ${[...sansPistes].slice(0, 8).join(" | ")}` : ""}`);
dire(pistesDe("table", { question: "Vous acceptez les chiens ?", genre: "client" }).relance.length > 0, "la vraie question d'un client (texte libre) a des pistes de secours");
dire(Object.keys(PL.BANQUES).every((m) => relancesDuMetier(m).length > 50), "les relances de chaque métier sont connues de la voix du reporter");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
