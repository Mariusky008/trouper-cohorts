// 🎬 LA SIGNATURE « FACE AU FANTÔME » — ce qui se vérifie sans téléphone.
//
// Le montage dessine sur le téléphone ; ses règles sont dans
// `src/lib/direct/interview-fantome.ts` et se vérifient ici :
//   · les mots un à un : répartis sur le temps de leur sous-titre, dans l'ordre,
//     sans « ? » tout seul ;
//   · les mots forts : son plat et son prix, en rose ;
//   · les morceaux à l'écran : courts, et jamais deux à la fois ;
//   · les réponses courtes qui frappent, sans « LE » tout seul en plein écran ;
//   · les cartes de questions de chaque métier : numéro, titre en deux lignes,
//     la dernière annoncée, la question dite dessous.
//
//   node scripts/verifier-signature-interview.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/interview-fantome.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", "require", js)(boite.exports, boite, exige);
const { motsDesSousTitres, morceauxDeMots, enFrappes, frappesDesMots, motsForts, carteDeQuestion, enDeuxLignes, SCRIPTS, REPLIQUES } = boite.exports;
const pjs = ts.transpileModule(readFileSync("src/lib/direct/interview-planning.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const planning = { exports: {} };
new Function("exports", "module", "require", pjs)(planning.exports, planning, exige);
const { questionsDeLInterview, BANQUES } = planning.exports;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

console.log("══ les mots un à un ══");
const forts = motsForts("Manteau long camel", "189 €");
const st = [
  { texte: "Aujourd'hui, c'est le manteau long camel.", debut: 1, fin: 3 },
  { texte: "Il est à 189 euros, c'est quoi ?", debut: 3.4, fin: 5.2 },
];
const mots = motsDesSousTitres(st, forts);
dire(mots.length === 6 + 7, `${mots.length} mots (13 attendus : 6 puis 7)`);
dire(Math.abs(mots[0].a - 1) < 1e-9 && Math.abs(mots[5].b - 3) < 1e-9 && Math.abs(mots[6].a - 3.4) < 1e-9, "le premier mot commence avec son sous-titre, le dernier finit avec lui");
dire(mots.every((w, k) => w.a < w.b && (k === 0 || w.a >= mots[k - 1].b - 1e-9)), "dans l'ordre, sans chevauchement");
dire(!mots.some((w) => /^[?!:;]$/.test(w.m.trim())), "aucun « ? » tout seul");
dire(mots.find((w) => /quoi/.test(w.m))?.m === "quoi ?", "« quoi ? » reste collé, avec l'espace fine");
const enRose = mots.filter((w) => w.fort).map((w) => w.m);
dire(["manteau", "long", "camel.", "189"].every((m) => enRose.includes(m)), `son plat et son prix en rose : ${enRose.join(", ")}`);
dire(!enRose.includes("Aujourd'hui,") && !enRose.includes("le"), "les autres mots en blanc");
dire(motsForts("", "") === null, "sans plat ni prix, aucun mot fort");

console.log("══ les morceaux à l'écran ══");
const long = motsDesSousTitres([{ texte: "Moi je le porte sur du noir avec des boots et je le noue à la taille comme ça", debut: 0, fin: 6 }]);
const morceaux = morceauxDeMots(long);
dire(morceaux.every((m) => m.mots.length === 1 || m.mots.map((w) => w.m).join(" ").length <= 17), `${morceaux.length} morceaux de 17 signes au plus`);
dire(morceaux.every((m, k) => m.de < m.fin && (k === 0 || morceaux[k - 1].fin <= m.de + 1e-9)), "jamais deux morceaux à l'écran en même temps");
dire(morceaux.flatMap((m) => m.mots).length === long.length, "aucun mot perdu");
const virgule = morceauxDeMots(motsDesSousTitres([{ texte: "Laine, cachemire", debut: 0, fin: 1 }]));
dire(virgule.length === 2, "une virgule ferme le morceau");

console.log("══ les réponses qui frappent ══");
const trois = motsDesSousTitres([{ texte: "Douce. Vraie. Surprenante.", debut: 0, fin: 2.4 }]);
dire(enFrappes(trois) && frappesDesMots(trois).length === 3, "trois mots : trois frappes");
const magret = frappesDesMots(motsDesSousTitres([{ texte: "Le magret !", debut: 0, fin: 1 }]));
dire(magret.length === 1 && magret[0].m.startsWith("Le magret"), `« Le magret ! » : une frappe (« ${magret[0]?.m} »), pas « LE » tout seul`);
dire(!enFrappes(long), "une vraie réponse se sous-titre");
const fr = frappesDesMots(trois);
dire(fr.every((f, k) => f.a < f.fin && (k === fr.length - 1 || f.fin < fr[k + 1].a) && f.fin - f.a <= 0.95), "chaque frappe s'efface avant la suivante, une seconde au plus");

console.log("══ les cartes de questions ══");
const c1 = carteDeQuestion("La pièce du moment ?", 0, 3, REPLIQUES["q1-mode"]);
dire(c1.num === "QUESTION 1 / 3" && c1.l1 === "LA PIÈCE" && c1.l2 === "DU MOMENT" && c1.fin === "?", `« ${c1.num} · ${c1.l1} / ${c1.l2} ${c1.fin} »`);
dire(carteDeQuestion("Pourquoi ce métier ?", 2, 3, "").num === "DERNIÈRE QUESTION", "la dernière d'une série s'annonce");
dire(carteDeQuestion("Le plat du jour ?", 0, 1, "").num === "QUESTION 1 / 1", "une question seule n'est la dernière de rien");
dire(carteDeQuestion("Si c'était une chanson…", 2, 4, "").fin === "…", "« Si c'était une chanson… » garde ses points de suspension");
dire(carteDeQuestion("Jean ou robe ?", 1, 3, "Jean ou robe ?").sous.join("") === "", "« JEAN OU ROBE ? » n'est pas écrit une seconde fois sous le titre");
dire(!c1.sous.some((l) => /^[?!:;]/.test(l)), `la question dite, sur deux lignes : « ${c1.sous.join(" / ")} »`);
const titres = [];
for (const [metier, s] of Object.entries(SCRIPTS))
  s.questions.forEach((q, k) => {
    const c = carteDeQuestion(q.titre, k, 4, REPLIQUES[q.replique]);
    titres.push(`${metier}:${c.l1}|${c.l2}`);
    if (Math.max(c.l1.length, c.l2.length) > 16 || c.sous.some((l) => l.length > 34)) dire(false, `${metier} q${k + 1} trop long : ${c.l1} / ${c.l2} — ${c.sous.join(" / ")}`);
  });
dire(true, `${titres.length} cartes de ${Object.keys(SCRIPTS).length} métiers : 16 signes au plus par ligne de titre, 34 par ligne de question`);
dire(enDeuxLignes("Manteau long camel", 16).join("|") === "Manteau long|camel" || enDeuxLignes("Manteau long camel", 16).join("|") === "Manteau|long camel", "le plat en deux lignes sur la carte de fin");

console.log("══ les questions du jour, sur leurs cartes ══");
for (const metier of Object.keys(BANQUES)) {
  const quoi = SCRIPTS[metier].quoi;
  let cartesVues = 0;
  const trop = new Set();
  const fautes = new Set();
  for (let d = 0; d < 365; d++) {
    const iso = new Date(Date.UTC(2026, 10, 2) + d * 86_400_000).toISOString().slice(0, 10);
    for (const n of [1, 2, 3, 4]) {
      const qs = questionsDeLInterview(metier, iso, n, quoi);
      if (qs.length !== n) fautes.add(`${iso} : ${qs.length} questions au lieu de ${n}`);
      qs.forEach((q, k) => {
        cartesVues++;
        const c = carteDeQuestion(q.titre, k, qs.length, q.question);
        if (Math.max(c.l1.length, c.l2.length) > 16 || c.sous.some((l) => l.length > 40)) trop.add(`${c.l1} / ${c.l2} — ${c.sous.join(" / ")}`);
        if (!q.titre || !q.question) fautes.add(`${iso} : une carte sans titre ou sans question`);
        if (k === qs.length - 1 && qs.length >= 2 && !q.dit.length) fautes.add(`${iso} : la dernière question n'est pas annoncée`);
      });
    }
  }
  dire(!fautes.size, `${metier} : ${cartesVues} cartes sur un an${fautes.size ? ` — ${[...fautes].slice(0, 3).join(" | ")}` : ""}`);
  dire(!trop.size, `${metier} : chaque titre tient en deux lignes de 16 signes, chaque question en deux lignes de 40${trop.size ? ` — trop longs : ${[...trop].slice(0, 4).join(" | ")}` : ""}`);
}
const lundi = questionsDeLInterview("mode", "2026-11-02", 4, "La pièce du moment");
dire(lundi[0].titre === "La pièce du moment ?" && lundi[1].titre === "Le geste", `un lundi en boutique : « ${lundi.map((q) => q.titre).join(" · ")} »`);
const dernier = lundi[3];
dire(dernier.dit[0] === "Le défi !" || dernier.dit[0] === "Dernière question !", `la dernière s'annonce : « ${dernier.dit.join(" ")} »`);

console.log(`\n${echecs ? `${echecs} échec(s)` : "tout est bon"}`);
process.exit(echecs ? 1 : 0);
