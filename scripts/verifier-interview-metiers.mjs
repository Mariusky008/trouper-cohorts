// 🎙️ L'INTERVIEW, MÉTIER PAR MÉTIER — ce que le reporter peut dire, et à qui.
//
// « Le mode "en interview" peut-il aussi aller pour les autres types de
// commerçants ? » Oui : le moteur est le même, ce sont ses MOTS qui changent
// (`SCRIPTS` dans `interview-fantome.ts`). Ce qui se vérifie ici, sans
// téléphone :
//   · chaque réplique d'un script existe ; celles de chaque interview (où se
//     placer, « Dernière question ! », le merci, l'au revoir) sont ENREGISTRÉES
//     dans la voix du fantôme, et chaque enregistrement se retrouve par son
//     texte (`voix-fantome.ts`) — plus de voix de secours métallique ;
//   · aucun « chef », aucun « plat », aucun « bon appétit » hors du restaurant ;
//   · un vrai commerçant ne reçoit l'interview de son métier qu'une fois ses
//     textes validés (`INTERVIEW_VALIDEE`) ; la démonstration, elle, l'a tout de
//     suite. Tous les métiers d'aujourd'hui sont validés.
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
const { SCRIPTS, REPLIQUES, INTERVIEW_VALIDEE, interviewOuverte, repliquesDuScript, enteteArdoise, scriptDe } = boite.exports;
// LA VOIX DU FANTÔME, DÉJÀ ENREGISTRÉE : la table texte → fichier, et le dossier
const voixJs = ts.transpileModule(readFileSync("src/lib/direct/voix-fantome.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const voixBoite = { exports: {} };
new Function("exports", "module", voixJs)(voixBoite.exports, voixBoite);
const { fichierEnregistre, cleDeReplique } = voixBoite.exports;

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
  // CE QU'IL DIT À CHAQUE INTERVIEW (où se placer, « Dernière question ! », le merci, l'au revoir) est
  // ENREGISTRÉ dans sa voix : ces phrases-là ne s'écrivent jamais faute de voix.
  const fixes = ["place-droite", "place-gauche", "place-fantome", "derniere", s.merci, s.adieu];
  const sansVoix = fixes.filter((id) => !fichierEnregistre(REPLIQUES[id]));
  dire(!sansVoix.length, `ses phrases de chaque interview sont enregistrées dans la voix du fantôme${sansVoix.length ? ` — manquent : ${sansVoix.join(", ")}` : ""}`);
  dire(s.questions.map((q) => q.id).join() === "q1,q2,q3,q4", "quatre questions à leur place (q1 à q4)");
  if (metier !== "table") {
    const textes = ids.map((id) => REPLIQUES[id]).join(" ") + " " + s.questions.map((q) => q.titre).join(" ") + " " + s.quoi;
    dire(!/\bchef\b|\bplat\b|appétit|cuisine/i.test(textes), "aucun mot du restaurant (chef, plat, cuisine, appétit)");
    dire(!s.cloche, "pas de cloche");
  }
}

console.log("══ la voix du fantôme ══");
const index = JSON.parse(readFileSync("public/direct/interview/fantome/index.json", "utf8"));
const toutes = Object.values(index).flat();
const perdues = toutes.filter((e) => {
  const f = fichierEnregistre(e.texte);
  return !f || !existsSync(`public${f}`);
});
dire(!perdues.length, `ses ${toutes.length} répliques enregistrées se retrouvent par leur texte, et leur fichier existe${perdues.length ? ` — perdues : ${perdues.map((e) => e.fichier).join(", ")}` : ""}`);
dire(
  fichierEnregistre("Dernière   question !") === fichierEnregistre("Dernière question !") &&
    cleDeReplique("Qu’est-ce que tu dirais à quelqu’un qui n’est jamais venu ?") === cleDeReplique("Qu'est-ce que tu dirais à quelqu'un qui n'est jamais venu ?"),
  "la même phrase écrite autrement (apostrophe courbe, espaces) retrouve son fichier",
);

console.log("══ l'ardoise ══");
dire(enteteArdoise("Le Bordeaux").avant === "Ce midi au", "« Ce midi au Bordeaux » (restaurant, inchangé)");
dire(enteteArdoise("Le Dressing de Lou", "Aujourd'hui").avant === "Aujourd'hui au", "« Aujourd'hui au Dressing de Lou »");
dire(enteteArdoise("La Page d’Alice", "Aujourd'hui").avant === "Aujourd'hui à la", "« Aujourd'hui à la Page d’Alice »");
dire(enteteArdoise("Chez Bergine").avant === "Ce midi", "« Ce midi Chez Bergine » : son « chez » n'est pas doublé");

console.log("══ à qui elle s'ouvre ══");
dire(interviewOuverte("table", true) && interviewOuverte("table", false), "restaurant : chez tous");
for (const m of Object.keys(SCRIPTS)) {
  const valide = INTERVIEW_VALIDEE.includes(m);
  dire(interviewOuverte(m, false) && interviewOuverte(m, true) === valide, `${m} : ${valide ? "textes validés — chez tous" : "démonstration seulement, tant que ses textes ne sont pas validés"}`);
}
dire(Object.keys(SCRIPTS).every((m) => INTERVIEW_VALIDEE.includes(m)), "tous les métiers d'aujourd'hui sont validés (« Tu valides les questions ? — Oui. »)");
dire(!interviewOuverte("seance", false), "sophrologue : pas d'interview (aucun script)");
dire(scriptDe("inconnu") === SCRIPTS.table, "un métier sans script retombe sur le restaurant (jamais d'écran vide)");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
