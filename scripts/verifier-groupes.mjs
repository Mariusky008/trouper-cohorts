// 📣 MES GROUPES, LES PROPOSITIONS (le lot G2, 26 novembre 2026), SANS TÉLÉPHONE — `src/lib/direct/groupes.ts`.
//
// Ce qui se vérifie ici :
//   · l'heure de Paris : « 21 h » ce soir, demain, l'heure d'été et l'heure d'hiver (`aParis`, `heureLisible`) ;
//   · « Ce soir 21 h », « Demain 20 h 30 », le nom du jour dans la semaine, la date au-delà ;
//   · on entre dix minutes avant l'heure, jusqu'à deux heures après ;
//   · le nom et le mot passent la modération des salons (ni lien, ni numéro) ;
//   · les phrases : jamais le mot interdit, et jamais « 0/8 ».
//
//   node scripts/verifier-groupes.mjs
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const charges = new Map();
function charger(fichier) {
  if (charges.has(fichier)) return charges.get(fichier).exports;
  const js = ts.transpileModule(readFileSync(fichier, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const boite = { exports: {} };
  charges.set(fichier, boite);
  new Function("exports", "module", "require", js)(boite.exports, boite, (x) => {
    const base = x.startsWith("@/") ? path.join("src", x.slice(2)) : x.startsWith(".") ? path.join(path.dirname(fichier), x) : null;
    if (!base) return exige(x);
    const f = [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")].find((c) => existsSync(c));
    if (!f) throw new Error(`introuvable : ${x}`);
    return charger(f);
  });
  return boite.exports;
}
const G = charger("src/lib/direct/groupes.ts");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const paris = (ms) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).format(ms);

// ─── l'heure de Paris ───
const hiver = Date.UTC(2026, 10, 26, 9, 0); // jeudi 26 novembre 2026, 10 h à Paris
const soir = G.aParis(0, 21, 0, hiver);
ok(paris(soir) === "26/11/2026 21:00", `ce soir 21 h (heure d'hiver) : ${paris(soir)}`);
ok(paris(G.aParis(1, 20, 30, hiver)) === "27/11/2026 20:30", "demain 20 h 30");
const ete = Date.UTC(2027, 6, 10, 8, 0);
ok(paris(G.aParis(0, 21, 0, ete)) === "10/07/2027 21:00", "21 h en été aussi");
ok(paris(G.aParis(3, 21, 0, Date.UTC(2027, 2, 26, 12))) === "29/03/2027 21:00", "le jour du changement d'heure passé : 21 h");
ok(G.heureLisible(soir) === "21 h" && G.heureLisible(G.aParis(0, 20, 30, hiver)) === "20 h 30", "« 21 h », « 20 h 30 »");

// ─── « Ce soir », « Demain », le jour ───
ok(G.quandLisible(soir, hiver) === "Ce soir 21 h", `« Ce soir 21 h » (${G.quandLisible(soir, hiver)})`);
ok(G.quandLisible(G.aParis(0, 14, 0, hiver), hiver) === "Aujourd’hui 14 h", "« Aujourd’hui 14 h »");
ok(G.quandLisible(G.aParis(1, 20, 30, hiver), hiver) === "Demain 20 h 30", "« Demain 20 h 30 »");
ok(G.quandLisible(G.aParis(2, 21, 0, hiver), hiver) === "Samedi 21 h", `« Samedi 21 h » (${G.quandLisible(G.aParis(2, 21, 0, hiver), hiver)})`);
ok(G.quandLisible(G.aParis(10, 21, 0, hiver), hiver) === "Le 6 décembre 21 h", `« Le 6 décembre 21 h » (${G.quandLisible(G.aParis(10, 21, 0, hiver), hiver)})`);

// ─── on entre dix minutes avant, deux heures après ───
ok(!G.estOuverte(soir, soir - 11 * 60_000), "pas encore onze minutes avant");
ok(G.estOuverte(soir, soir - 9 * 60_000) && G.estOuverte(soir, soir + 90 * 60_000), "ouverte neuf minutes avant, et une heure et demie après");
ok(!G.estOuverte(soir, soir + 2 * 3600_000 + 60_000), "fermée deux heures après");

// ─── la modération ───
ok(G.refusDuGroupe("Soirée Hip-Hop", G.NOM_GROUPE_MAX) === null, "« Soirée Hip-Hop » passe");
ok(G.refusDuGroupe("viens sur https://site.fr", G.MOT_GROUPE_MAX) !== null, "un lien ne passe pas");
ok(G.refusDuGroupe("appelle le 06 12 34 56 78", G.MOT_GROUPE_MAX) !== null, "un numéro ne passe pas");
ok(G.refusDuGroupe("x".repeat(G.NOM_GROUPE_MAX + 1), G.NOM_GROUPE_MAX) !== null, "un nom trop long ne passe pas");

// ─── les phrases ───
const P = G.PHRASES_PROPOSITIONS;
const tout = JSON.stringify(Object.values(P).map((v) => (typeof v === "function" ? v("Léa", "Ce soir 21 h") : v)));
ok(!/exemple/i.test(tout), "jamais le mot « exemple »");
ok(P.confirmes(1, 8) === "1/8 confirmé" && P.confirmes(3, 8) === "3/8 confirmés", "« 1/8 confirmé », « 3/8 confirmés »");
ok(G.PLACES_GROUPE.join() === "4,8", "4 ou 8 places");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
