// 🎙️ L'INTERVIEW, MÉTIER PAR MÉTIER — ce que le reporter peut dire, et à qui.
//
// « Le mode "en interview" peut-il aussi aller pour les autres types de
// commerçants ? » Oui : le moteur est le même, ce sont ses MOTS qui changent
// (`SCRIPTS` dans `interview-fantome.ts`). Ce qui se vérifie ici, sans
// téléphone :
//   · chaque réplique d'un script existe, et a sa voix de secours (sans elle,
//     un serveur muet laisserait le reporter sans voix au milieu d'une question) ;
//   · aucun « chef », aucun « plat », aucun « bon appétit » hors du restaurant ;
//   · un vrai commerçant ne reçoit l'interview de son métier qu'une fois ses
//     textes validés (`INTERVIEW_VALIDEE`) ; la démonstration, elle, l'a tout de suite.
//
//   node scripts/verifier-interview-metiers.mjs
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/interview-fantome.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", js)(boite.exports, boite);
const { SCRIPTS, REPLIQUES, INTERVIEW_VALIDEE, interviewOuverte, repliquesDuScript, enteteArdoise, parolesDeLaQuestion, scriptDe } = boite.exports;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

for (const [metier, s] of Object.entries(SCRIPTS)) {
  console.log(`══ ${metier} ══`);
  const ids = repliquesDuScript(s, "Un commerce");
  const manquantes = ids.filter((id) => !REPLIQUES[id]);
  dire(!manquantes.length, `ses ${ids.length} répliques existent${manquantes.length ? ` — manquent : ${manquantes.join(", ")}` : ""}`);
  const sansVoix = ids.filter((id) => !existsSync(`public/direct/interview/voix/${id}.mp3`));
  dire(!sansVoix.length, `chacune a sa voix de secours${sansVoix.length ? ` — manquent : ${sansVoix.join(", ")}` : ""}`);
  dire(s.questions.map((q) => q.id).join() === "q1,q2,q3,q4", "quatre questions à leur place (q1 à q4)");
  if (metier !== "table") {
    const textes = ids.map((id) => REPLIQUES[id]).join(" ") + " " + s.questions.map((q) => q.titre).join(" ") + " " + s.quoi;
    dire(!/\bchef\b|\bplat\b|appétit|cuisine/i.test(textes), "aucun mot du restaurant (chef, plat, cuisine, appétit)");
    dire(!s.cloche, "pas de cloche");
  }
  dire(parolesDeLaQuestion(1, 2, s).join() === `derniere,${s.questions[1].replique}`, "« Dernière question ! » avant la dernière d'une série");
}

console.log("══ l'ardoise ══");
dire(enteteArdoise("Le Bordeaux").avant === "Ce midi au", "« Ce midi au Bordeaux » (restaurant, inchangé)");
dire(enteteArdoise("Le Dressing de Lou", "Aujourd'hui").avant === "Aujourd'hui au", "« Aujourd'hui au Dressing de Lou »");
dire(enteteArdoise("La Page d’Alice", "Aujourd'hui").avant === "Aujourd'hui à la", "« Aujourd'hui à la Page d’Alice »");
dire(enteteArdoise("Chez Bergine").avant === "Ce midi", "« Ce midi Chez Bergine » : son « chez » n'est pas doublé");

console.log("══ à qui elle s'ouvre ══");
dire(interviewOuverte("table", true) && interviewOuverte("table", false), "restaurant : chez tous");
for (const m of Object.keys(SCRIPTS).filter((m) => !INTERVIEW_VALIDEE.includes(m))) {
  dire(!interviewOuverte(m, true) && interviewOuverte(m, false), `${m} : démonstration seulement, tant que ses textes ne sont pas validés`);
}
dire(!interviewOuverte("seance", false), "sophrologue : pas d'interview (aucun script)");
dire(scriptDe("inconnu") === SCRIPTS.table, "un métier sans script retombe sur le restaurant (jamais d'écran vide)");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
