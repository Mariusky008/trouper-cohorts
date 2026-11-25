// 🧭 L'ORDRE DU FIL (le lot F4, 25 novembre 2026), SANS TÉLÉPHONE — `src/lib/direct/fil-decouvrir.ts` (`ordreDuFil`).
//
// Ce qui se vérifie ici :
//   · l'ordre voulu par le propriétaire : ses proches en direct, puis ses passions, puis les maisons, puis Autour (puis
//     les autres salons, puis ceux sans personne) ;
//   · « rien ne revient deux fois de suite » : deux pièces de la même sorte ne se suivent pas tant qu'il en reste
//     d'une autre sorte ; s'il n'en reste que d'une sorte, elles se suivent ;
//   · rien ne se perd ni ne se double ; seize pièces au plus ;
//   · les phrases du fil : jamais le mot interdit.
//
//   node scripts/verifier-fil.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/fil-decouvrir.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const boite = { exports: {} };
new Function("exports", "module", "require", js)(boite.exports, boite, (x) => {
  throw new Error(`import inattendu : ${x}`);
});
const Fil = boite.exports;

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (des pièces réduites à ce que l'ordre regarde : leur sorte, et un nom pour les reconnaître)
const salon = (nom) => ({ sorte: "salon", nom });
const seance = (nom) => ({ sorte: "seance", nom });
const maison = (nom) => ({ sorte: "maison", nom });
const autour = (nom) => ({ sorte: "autour", nom });
const humeur = { sorte: "humeur", nom: "humeur" };
const noms = (l) => l.map((p) => p.nom).join(",");
const jamaisDeuxFois = (l) => l.every((p, i) => i === 0 || p.sorte !== l[i - 1].sorte);

// ═══ L'ORDRE DES GROUPES ═══
const proches = [seance("chez-léa"), salon("foot-avec-sam")];
const passions = [salon("cuisine"), salon("series")];
const maisons = [maison("zoé"), maison("max")];
const lieux = [autour("bistrot")];
const autres = [salon("musique")];
const vides = [salon("jeux"), salon("tele")];
const f1 = Fil.ordreDuFil([proches, [humeur], passions, maisons, lieux, autres, vides]);
ok(noms(f1.slice(0, 3)) === "chez-léa,foot-avec-sam,humeur", `d'abord ses proches en direct (la séance, le salon où est Sam), puis l'humeur de ses proches (${noms(f1)})`);
ok(f1.findIndex((p) => p.nom === "cuisine") < f1.findIndex((p) => p.nom === "zoé") && f1.findIndex((p) => p.nom === "zoé") < f1.findIndex((p) => p.nom === "bistrot"), "puis ses passions, puis les maisons, puis Autour");
ok(f1.findIndex((p) => p.nom === "musique") > f1.findIndex((p) => p.nom === "cuisine") && noms(f1.slice(-2)) === "jeux,tele", "les autres salons après ses passions ; ceux sans personne à la fin");
ok(f1.length === 11 && new Set(f1.map((p) => p.nom)).size === 11, "rien ne se perd, rien ne se double");

// ═══ RIEN NE REVIENT DEUX FOIS DE SUITE ═══
ok(jamaisDeuxFois(f1.slice(0, 9)) && f1.slice(8).every((p) => p.sorte === "salon"), `deux pièces de la même sorte ne se suivent pas tant qu'il y en a d'autres ; à la fin, il ne reste que des salons (${f1.map((p) => p.sorte).join(",")})`);
const f2 = Fil.ordreDuFil([[], [salon("a"), salon("b"), salon("c")], [maison("m")], [autour("x")]]);
ok(noms(f2) === "a,m,b,x,c", `trois salons, une maison, une figurine posée : ils s'intercalent (${noms(f2)})`);
const f3 = Fil.ordreDuFil([[salon("a"), salon("b"), salon("c")]]);
ok(noms(f3) === "a,b,c", "seulement des salons : ils se suivent (rien d'autre à intercaler)");
const f4 = Fil.ordreDuFil([[seance("s1"), seance("s2")], [salon("p1")]]);
ok(noms(f4) === "s1,p1,s2", "deux séances de proches : un salon entre les deux");

// ═══ SEIZE AU PLUS ═══
const beaucoup = Array.from({ length: 30 }, (_, i) => salon(`s${i}`));
ok(Fil.ordreDuFil([beaucoup, [maison("m")]]).length === Fil.PIECES_MAX && Fil.PIECES_MAX === 16, "seize pièces au plus");
ok(Fil.ordreDuFil([]).length === 0, "rien : un fil vide (l'écran dit « Personne en direct pour l'instant »)");

// ═══ LES PHRASES ═══
const toutes = Object.values(Fil.PHRASES_FIL).map((x) => (typeof x === "function" ? x(2, "Léa") : x));
ok(toutes.every((t) => !/exemple/i.test(String(t))), "jamais le mot interdit");
ok(Fil.PHRASES_FIL.prochesLa(["Sam"]) === "👋 Sam est là" && Fil.PHRASES_FIL.prochesLa(["Sam", "Hugo"]) === "👋 Sam et Hugo sont là", "« 👋 Sam est là », « 👋 Sam et Hugo sont là »");
ok(Fil.titreDeSeance({ hote: "Léa", hoteLa: true, presents: [{ prenom: "Léa" }, { prenom: "Sam" }] }) === "Léa et Sam regardent ensemble", "« Léa et Sam regardent ensemble »");

console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
