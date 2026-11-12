// ☀️ MA FIGURINE ME RÉPOND (lot R3 du rituel du jour), SANS TÉLÉPHONE — `src/lib/direct/humeur-reponse.ts`.
//
// Ce qui se vérifie ici :
//   · les phrases validées par le propriétaire (12 novembre 2026) : dix par humeur, courtes, sans accord au masculin ou
//     au féminin, sans le mot interdit ;
//   · le choix du jour : une phrase de la banque jamais redite avant d'avoir tout dit ; la même humeur redemandée le
//     même jour, la même phrase ;
//   · le souvenir de la veille : la remontée, la descente, la série, deux jours difficiles, un changement (pas deux
//     jours de suite) ;
//   · le troisième jour difficile d'affilée : le mot doux à part, et le 3114 (dès le troisième jour, et après) ;
//   · le geste : envoyer sa tête du jour, raconter, « Je t'aime », un mème, un vœu (ou un proche s'il en a un) ;
//   · le dimanche, « Ta semaine en visages » ; pas les autres jours.
//
//   node scripts/verifier-humeur.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/humeur-reponse.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const boite = { exports: {} };
new Function("exports", "module", "require", js)(boite.exports, boite, (x) => {
  throw new Error(`import inattendu : ${x}`);
});
const H = boite.exports;

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const net = (t) => t.replace(/ /g, " ");

// ═══ LES PHRASES ═══
const HUMEURS = ["joie", "rire", "euphorie", "amour", "grimace", "tete", "tristesse", "colere"];
ok(HUMEURS.every((h) => H.PHRASES_HUMEUR[h]?.length === 10), "dix phrases pour chacune des huit humeurs");
const toutes = [...Object.values(H.PHRASES_HUMEUR).flat(), ...Object.values(H.SOUVENIRS).flat(), ...Object.values(H.SEMAINE), ...Object.values(H.GESTES_HUMEUR), H.AIDE_3114.texte];
const GENRE = /\b(content|contente|heureux|heureuse|seul|seule|fatigu[ée]e?|prête?|fière?|motivée?|énervée?|fâchée?|tout seul|toute seule)\b/i;
ok(toutes.every((t) => !GENRE.test(t)), `aucun accord au masculin ou au féminin (${toutes.filter((t) => GENRE.test(t)).join(" | ") || "aucun"})`);
ok(toutes.every((t) => !/exemple/i.test(t)), "jamais le mot interdit");
ok(Object.values(H.PHRASES_HUMEUR).flat().every((t) => t.length <= 90), "des phrases courtes (une bulle)");
ok(["tete", "tristesse", "colere"].every((h) => H.PHRASES_HUMEUR[h].every((t) => !/😜|😂|mdr|lol/i.test(t))), "sur les humeurs douces, pas de blague");

// ═══ LE CHOIX DU JOUR ═══
const JEUDI = "2026-11-12";
const avant = (n) => H.jourDecale(JEUDI, -n);
const r0 = H.reponseHumeur("joie", JEUDI, {}, false);
ok(H.PHRASES_HUMEUR.joie.map((t) => net(H.typo(t))).includes(net(r0.reponse.texte)) && r0.reponse.geste === "envoyer" && !r0.reponse.souvenir && !r0.reponse.doux, `premier jour, la joie : une phrase de la banque (« ${net(r0.reponse.texte)} »), « ${H.GESTES_HUMEUR.envoyer} »`);
ok(/ [?!:]/.test(H.typo("Tu l’envoies à qui ?")), "l'espace fine avant « ? ! : »");
const r0bis = H.reponseHumeur("joie", JEUDI, r0.hist, false);
ok(r0bis.reponse.texte === r0.reponse.texte && r0bis.hist === r0.hist, "la même humeur redemandée le même jour : la même phrase");
// (jamais redite avant d'avoir tout dit)
const neufVues = { vus: { amour: [0, 1, 2, 3, 4, 5, 6, 7, 8] } };
const r1 = H.reponseHumeur("amour", JEUDI, neufVues, false);
ok(net(r1.reponse.texte) === net(H.typo(H.PHRASES_HUMEUR.amour[9])) && r1.hist.vus.amour.length === 10, "neuf phrases déjà dites : la dixième");
const r2 = H.reponseHumeur("amour", JEUDI, { vus: { amour: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] } }, false);
ok(r2.hist.vus.amour.length === 1 && r2.reponse.geste === "jetaime", "toutes dites : on recommence ; l'amour, « Le mème « Je t'aime » »");
ok(H.reponseHumeur("rire", JEUDI, {}, false).reponse.geste === "raconter" && H.reponseHumeur("grimace", JEUDI, {}, false).reponse.geste === "meme" && H.reponseHumeur("euphorie", JEUDI, {}, false).reponse.geste === "envoyer", "les gestes : raconter (fou rire), un mème (grimace), envoyer (euphorie)");

// ═══ LE SOUVENIR DE LA VEILLE ═══
const remontee = H.reponseHumeur("rire", JEUDI, { jours: { [avant(1)]: "colere" } }, false).reponse;
ok(remontee.souvenir && /remontée/.test(remontee.texte), `hier la colère, aujourd'hui le fou rire : « ${net(remontee.texte)} »`);
const descente = H.reponseHumeur("tristesse", JEUDI, { jours: { [avant(1)]: "joie" } }, false).reponse;
ok(descente.souvenir && net(descente.texte) === net(H.typo(H.SOUVENIRS.descente)) && descente.doux && descente.geste === "voeu" && !descente.aide, "hier la joie, aujourd'hui la tristesse : « Hier tu rayonnais… », sans blague ; « Faire un vœu »");
ok(H.reponseHumeur("tristesse", JEUDI, {}, true).reponse.geste === "proches", "un vœu déjà en route : « Écrire à un proche »");
const serie = H.reponseHumeur("joie", JEUDI, { jours: { [avant(1)]: "joie", [avant(2)]: "grimace" } }, false).reponse;
ok(serie.souvenir && net(serie.texte).startsWith("3 jours de bonne humeur d’affilée"), `trois jours de bonne humeur : « ${net(serie.texte)} »`);
const changement = H.reponseHumeur("joie", JEUDI, { jours: { [avant(1)]: "grimace" } }, false);
ok(changement.reponse.souvenir && net(changement.reponse.texte) === "Hier la grimace, aujourd’hui la joie : tu ne t’ennuies jamais, toi.", `un changement : « ${net(changement.reponse.texte)} »`);
ok(changement.hist.souvenirLe === JEUDI, "le jour d'un souvenir est gardé");
const lendemain = H.reponseHumeur("rire", H.jourDecale(JEUDI, 1), { jours: { [JEUDI]: "joie" }, souvenirLe: JEUDI }, false);
ok(!lendemain.reponse.souvenir, "le lendemain, encore un changement : pas deux souvenirs de suite (une phrase de la banque)");

// ═══ LES JOURS DIFFICILES ═══
const deux = H.reponseHumeur("colere", JEUDI, { jours: { [avant(1)]: "tristesse" } }, false).reponse;
ok(net(deux.texte) === net(H.typo(H.SOUVENIRS.deuxJours)) && !deux.aide, "deux jours difficiles : « Encore une journée pas facile… », pas encore le 3114");
const trois = H.reponseHumeur("tete", JEUDI, { jours: { [avant(1)]: "tristesse", [avant(2)]: "colere" } }, false).reponse;
ok(net(trois.texte) === net(H.typo(H.SOUVENIRS.troisJours)) && trois.aide === true, "le troisième jour difficile : le mot doux à part, et le 3114");
const quatre = H.reponseHumeur("tristesse", JEUDI, { jours: { [avant(1)]: "tristesse", [avant(2)]: "tristesse", [avant(3)]: "colere" } }, false).reponse;
ok(quatre.aide === true && H.PHRASES_HUMEUR.tristesse.map((t) => net(H.typo(t))).includes(net(quatre.texte)), "le quatrième : une phrase douce, le 3114 toujours là");
ok(!H.reponseHumeur("joie", JEUDI, { jours: { [avant(1)]: "tristesse", [avant(2)]: "tristesse", [avant(3)]: "tristesse" } }, false).reponse.aide, "une bonne journée revient : plus de 3114");
ok(H.AIDE_3114.texte === "Si ça ne va vraiment pas, le 3114 répond jour et nuit." && H.AIDE_3114.tel === "3114", "la ligne du 3114, telle que validée");

// ═══ LE DIMANCHE ═══
const DIMANCHE = "2026-11-15";
ok(H.rangDuJour(DIMANCHE) === 6 && H.rangDuJour(JEUDI) === 3, "le 15 novembre 2026 est un dimanche, le 12 un jeudi");
const jours = { "2026-11-09": "joie", "2026-11-10": "rire", "2026-11-12": "euphorie", "2026-11-14": "amour" };
const sem = H.reponseHumeur("joie", DIMANCHE, { jours }, false).reponse.semaine;
ok(sem && sem.jours.length === 7 && sem.jours.map((j) => j.lettre).join("") === "LMMJVSD" && sem.jours[0].humeur === "joie" && sem.jours[2].humeur === null && sem.jours[6].humeur === "joie" && sem.ton === "soleil" && net(sem.texte) === "Une semaine plutôt soleil ☀️", `dimanche : sa semaine en visages (${sem?.jours.map((j) => j.humeur ?? "·").join(" ")}), « ${sem && net(sem.texte)} »`);
const semDure = H.reponseHumeur("tristesse", DIMANCHE, { jours: { "2026-11-13": "colere", "2026-11-14": "tete" } }, false).reponse.semaine;
ok(semDure?.ton === "difficile", "une semaine plutôt difficile : « Une semaine pas facile… »");
ok(H.reponseHumeur("joie", DIMANCHE, { jours: { "2026-11-10": "joie", "2026-11-11": "tristesse", "2026-11-12": "rire", "2026-11-13": "colere" } }, false).reponse.semaine?.ton === "montagnes", "mélangée (deux jours difficiles sur cinq) : « en montagnes russes »");
ok(H.reponseHumeur("joie", DIMANCHE, { jours: { "2026-11-14": "tristesse", "2026-11-13": "joie", "2026-11-12": "rire" } }, false).reponse.semaine?.ton === "soleil", "un seul jour difficile sur quatre : plutôt soleil");
ok(!H.reponseHumeur("joie", JEUDI, { jours }, false).reponse.semaine && !H.reponseHumeur("joie", DIMANCHE, {}, false).reponse.semaine, "pas de semaine un jeudi, ni avec un seul jour");

// ═══ CE QUI EST GARDÉ ═══
const vieux = H.reponseHumeur("joie", JEUDI, { jours: { "2026-10-01": "joie", [avant(1)]: "joie" } }, false).hist;
ok(!vieux.jours["2026-10-01"] && vieux.jours[JEUDI] === "joie" && vieux.dernier.jour === JEUDI, "21 jours gardés au plus ; aujourd'hui, la dernière réponse");
ok(H.reponseValide(vieux.dernier, JEUDI)?.humeur === "joie" && H.reponseValide(vieux.dernier, avant(1)) === null && H.reponseValide({ jour: JEUDI, humeur: "x", texte: "a", geste: "envoyer" }, JEUDI) === null, "une réponse relue : celle d'aujourd'hui seulement, rien d'inventé");

console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
