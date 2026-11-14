// 📚 L'ÉTAGÈRE (lot E1), SANS TÉLÉPHONE — `src/lib/direct/etagere.ts` (le cahier : `docs/univers/etagere.md`).
//
// Ce qui se vérifie ici :
//   · un objet valide, et chaque raison de le jeter : une citation absente du message, un mot interdit, de l'alcool,
//     un numéro, une adresse électronique, un sujet sensible, un prénom ou un possessif dans le titre, une date
//     passée ou trop lointaine, un jour de la semaine qui ne colle pas, quelqu'un qu'on ne connaît pas ;
//   · le titre des deux côtés : « Le permis de Léa », « d’Inès », « d’Hugo », « Ton permis », le titre commun ;
//   · les détails composés (la date, l'anniversaire, la promesse, le goût, la blague) ; les rayons ;
//   · le rangement : deux par passage, trois par jour, une même chose une seule fois (sa date se met à jour), un
//     message retiré plus jamais noté, quarante au plus (le plus ancien goût s'en va) ; la pierre tombale sans texte ;
//   · les phrases de la figurine qui voit noter : jamais deux fois de suite, sans accord au masculin ou au féminin,
//     sans le mot interdit, sans alcool ; le catalogue des emojis : ni alcool, ni arme, ni drapeau.
//   · 📌 (lot E5) « Je le range ? » : la question part au bon destinataire (une personne, les deux, celui qui n'a pas dit
//     la phrase) ; « oui », « non », le premier des deux ; 48 heures, et la date plus proche ; le réglage, seul et à
//     deux ; le dépôt pour l'autre ; l'issue d'une épreuve ; un souvenir proposé n'est jamais visible ; les nouvelles
//     phrases sans accord de genre ni le mot interdit ; la ligne de « Chez moi » ; la mesure.
//
//   node scripts/verifier-etagere.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const charger = (chemin) => {
  const js = ts.transpileModule(readFileSync(chemin, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const boite = { exports: {} };
  new Function("exports", "module", "require", js)(boite.exports, boite, (x) => {
    throw new Error(`import inattendu : ${x}`);
  });
  return boite.exports;
};
const E = charger("src/lib/direct/etagere.ts");
const { motInterdit } = charger("src/lib/direct/mots-interdits.ts");
const alcool = (t) => /\b(alcools?|bieres?|vins?|aperos?|aperitifs?|cocktails?|champagnes?|whisky|vodka|rhum|tequila|ivres?|mojitos?|spritz)\b/.test(t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
const passe = (t) => Boolean(t) && !motInterdit(t) && !alcool(t);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ═══ UN OBJET PROPOSÉ, VÉRIFIÉ ═══
const LEA = "aaaaaaaa";
const MOI = "bbbbbbbb";
const AUJ = "2026-11-13"; // un vendredi
const messages = [
  { n: 1, id: "m1", de8: MOI, texte: "Alors, elle commence comment ta semaine ?", jour: AUJ, le: "2026-11-13T17:38:00.000Z" },
  { n: 2, id: "m2", de8: LEA, texte: "Jeudi prochain je passe le permis, je stresse trop 😬", jour: AUJ, le: "2026-11-13T17:42:00.000Z" },
  { n: 3, id: "m3", de8: MOI, texte: "Faut qu'on se fasse ce resto italien ! Appelle-moi au 06 12 34 56 78", jour: AUJ, le: "2026-11-13T17:44:00.000Z" },
];
const c = { messages, gens: [{ prenom: "Léa", h8: LEA }, { prenom: "Sam", h8: MOI }], aujourdhui: AUJ, passe };
const permis = { genre: "date", sorte: "epreuve", emoji: "🚗", titre: "Le permis", titre_toi: "Ton permis", concerne: "Léa", citation: "Jeudi prochain je passe le permis", message: 2, quand: "2026-11-19", dit: "jeudi prochain" };
const o = E.objetValide(permis, c);
ok(o && o.genre === "date" && o.sorte === "epreuve" && o.emoji === "🚗" && o.titre === "Le permis" && o.titreToi === "Ton permis" && o.concerne === LEA && o.de8 === LEA && o.message === "m2" && o.quand === "2026-11-19" && o.ditQuand === "jeudi prochain", `un objet valide : le permis de Léa, jeudi 19 (${JSON.stringify(o)})`);
const jete = (x, pourquoi) => ok(E.objetValide({ ...permis, ...x }, c) === null, `jeté : ${pourquoi}`);
jete({ citation: "Je passe le code demain" }, "la citation n'est pas dans le message");
jete({ message: 1 }, "la citation est dans un autre message que celui désigné");
jete({ message: 9 }, "un message qui n'existe pas");
jete({ genre: "secret" }, "un genre qui n'existe pas");
jete({ sorte: "rdv" }, "une sorte qui n'existe pas");
jete({ titre: "Le permis de Léa" }, "un prénom dans le titre");
jete({ titre: "Son permis" }, "un possessif dans le titre");
jete({ titre: "Le permis le plus attendu de l'année" }, "un titre de plus de 28 signes");
jete({ titre: "Les salauds du permis" }, "un mot interdit");
jete({ titre: "L'apéro du permis" }, "de l'alcool");
jete({ concerne: "Nina" }, "quelqu'un qu'on ne connaît pas");
jete({ quand: "2026-11-12", dit: "hier" }, "une date passée");
jete({ quand: "2028-01-19", dit: "" }, "une date à plus de 400 jours");
jete({ quand: "2026-11-20", dit: "jeudi prochain" }, "« jeudi », mais un vendredi");
jete({ quand: "2026-02-30" }, "un jour qui n'existe pas");
jete({ quand: undefined }, "une date sans jour");
ok(E.objetValide({ genre: "promesse", emoji: "🍝", titre: "Le resto italien", concerne: "les deux", citation: "Faut qu'on se fasse ce resto italien", message: 3 }, c)?.concerne === "deux", "une promesse pour les deux (« les deux »)");
ok(E.objetValide({ genre: "promesse", emoji: "🍝", titre: "Le resto italien", concerne: "les deux", citation: "Appelle-moi au 06 12 34 56 78", message: 3 }, c) === null, "jeté : un numéro de téléphone");
ok(E.objetValide({ genre: "gout", emoji: "🌋", titre: "Les volcans", concerne: "Léa", citation: "Jeudi prochain je passe", message: 2 }, c)?.emoji === "💛", "un emoji hors liste : celui du genre (💛)");
ok(E.objetValide({ genre: "gout", emoji: "💐", titre: "Les pivoines", concerne: "Léa", nuance: "envie", citation: "je stresse trop", message: 2 }, c)?.nuance === "envie", "un goût : « envie »");
ok(!E.objetValide({ genre: "gout", emoji: "💐", titre: "Les pivoines", titre_toi: "Les belles pivoines", concerne: "Léa", citation: "je stresse trop", message: 2 }, c)?.titreToi, "un titre « à toi » qui ne commence pas par « Ton / Ta / Tes » : il s'en va");
const anniv = E.objetValide({ genre: "date", sorte: "fete", emoji: "🎂", titre: "L'anniversaire", titre_toi: "Ton anniversaire", concerne: "Léa", citation: "je stresse trop", message: 2, quand: "2026-03-04", dit: "le 4 mars" }, c);
ok(anniv?.quand === "2027-03-04" && anniv.annuel === true, `un anniversaire passé cette année : sa prochaine occurrence (${anniv?.quand})`);
ok(E.echangeSensible(["Je suis malade depuis hier"]) && E.echangeSensible(["Mon loyer a encore augmenté"]) && E.echangeSensible(["Rendez-vous chez le médecin jeudi"]), "sensible : la santé, l'argent, un rendez-vous médical");
ok(!E.echangeSensible(["J'étais mort de rire", "Une enceinte pour la fête", "Un avocat bien mûr", "Je suis prêt pour le permis", "Médaille d'argent au judo"]), "pas sensible : « mort de rire », « une enceinte », « un avocat », « prêt », « médaille d'argent »");
ok(E.objetValide({ ...permis, citation: "le médecin a dit oui" }, { ...c, messages: [messages[0], { ...messages[1], texte: "Jeudi prochain je passe le permis, le médecin a dit oui" }, messages[2]] }) === null, "jeté : une citation qui touche un sujet sensible");

// ═══ LE TITRE, DES DEUX CÔTÉS ═══
const g = { titre: "Le permis", titreToi: "Ton permis", concerne: LEA };
ok(E.titrePour(g, MOI, "Léa") === "Le permis de Léa", "chez moi : « Le permis de Léa »");
ok(E.titrePour(g, LEA, "Sam") === "Ton permis", "chez Léa : « Ton permis »");
ok(E.titrePour(g, MOI, "Inès") === "Le permis d’Inès" && E.titrePour(g, MOI, "Hugo") === "Le permis d’Hugo", "« d’Inès », « d’Hugo »");
ok(E.titrePour({ titre: "Le resto italien", concerne: "deux" }, MOI, "Léa") === "Le resto italien", "pour les deux : le titre commun");
ok(E.titrePour({ titre: "Le permis", concerne: LEA }, LEA, "Sam") === "Le permis", "sans « Ton… » : le titre");

// ═══ LES DÉTAILS, LES RAYONS ═══
const base = { id: "x", emoji: "🚗", citation: "…", de8: LEA, message: "m2", le: "2026-11-13T17:45:00.000Z", etat: "actif" };
ok(E.detailPour({ ...base, genre: "date", titre: "Le permis", concerne: LEA, quand: "2026-11-19" }, MOI, "Léa", AUJ) === "jeudi 19 nov.", "une date à venir : « jeudi 19 nov. »");
ok(E.detailPour({ ...base, genre: "date", sorte: "fete", annuel: true, titre: "L'anniversaire", concerne: LEA, quand: "2026-12-04" }, MOI, "Léa", AUJ) === "le 4 décembre", "un anniversaire : « le 4 décembre »");
ok(E.detailPour({ ...base, genre: "date", titre: "Le concert", concerne: LEA, quand: "2026-11-01" }, MOI, "Nina", "2026-10-30") === "dimanche 1er nov.", "le premier du mois : « 1er »");
ok(E.detailPour({ ...base, genre: "promesse", titre: "Le resto", concerne: "deux", le: "2026-10-23T17:00:00.000Z" }, MOI, "Sam", "2026-10-30") === "promis le 23 oct.", "une promesse : « promis le 23 oct. »");
ok(E.detailPour({ ...base, genre: "promesse", titre: "Le resto", concerne: "deux", le: "2026-10-23T17:00:00.000Z" }, MOI, "Sam", AUJ) === "promis il y a 3 semaines", "passé 21 jours : « promis il y a 3 semaines »");
ok(E.detailPour({ ...base, genre: "gout", nuance: "aime", titre: "Les pivoines", concerne: LEA }, MOI, "Léa", AUJ) === "Léa adore" && E.detailPour({ ...base, genre: "gout", nuance: "aime", titre: "Les pivoines", concerne: LEA }, LEA, "Sam", AUJ) === "tu adores", "un goût : « Léa adore » / « tu adores »");
ok(E.detailPour({ ...base, genre: "gout", nuance: "envie", titre: "Le roman", concerne: LEA }, MOI, "Léa", AUJ) === "Léa en a envie" && E.detailPour({ ...base, genre: "gout", nuance: "envie", titre: "Le roman", concerne: "deux" }, MOI, "Léa", AUJ) === "vous en avez envie", "« Léa en a envie », « vous en avez envie »");
ok(E.detailPour({ ...base, genre: "blague", titre: "Le canard", concerne: "deux" }, MOI, "Léa", AUJ) === "votre blague", "une blague : « votre blague »");
ok(E.rayonDe({ genre: "date", etat: "actif" }) === "avenir" && E.rayonDe({ genre: "promesse", etat: "actif" }) === "avenir" && E.rayonDe({ genre: "gout", etat: "actif" }) === "aime" && E.rayonDe({ genre: "blague", etat: "actif" }) === "aime" && E.rayonDe({ genre: "promesse", etat: "tenue" }) === "fiertes" && E.rayonDe({ genre: "date", etat: "fierte" }) === "fiertes", "les rayons : à venir, ce qu'on aime, nos fiertés");
ok(E.RAYONS.map((r) => r.nom).join(" · ") === "Nos fiertés · À venir · Ce qu’on aime", "les trois rayons, dans l'ordre");
const vu = E.vueDe({ ...base, genre: "date", sorte: "epreuve", titre: "Le permis", titreToi: "Ton permis", concerne: LEA, quand: "2026-11-19", messageLe: "2026-11-13T17:42:00.000Z" }, { moi8: MOI, prenomMoi: "Sam", prenomAutre: "Léa", aujourdhui: AUJ });
ok(vu.titre === "Le permis de Léa" && vu.detail === "jeudi 19 nov." && vu.de === "lui" && vu.ditPar === "Léa" && vu.rayon === "avenir" && !vu.pourMoi && E.momentCourt(vu.ditLe) === "ven. 13 nov., 18:42", `ce que Sam en voit (${vu.titre} · ${vu.detail} · dit par ${vu.ditPar} · ${E.momentCourt(vu.ditLe)})`);

// ═══ LE RANGEMENT ═══
let n = 0;
const id = () => `id${++n}`;
const prop = (titre, message, x = {}) => ({ genre: "gout", emoji: "💐", titre, concerne: LEA, nuance: "aime", citation: titre, de8: LEA, message, ...x });
const r1 = E.ranger([], [prop("Les pivoines", "a"), prop("Le roman", "b"), prop("Les crêpes", "c")], { aujourdhui: AUJ, le: "2026-11-13T18:00:00.000Z", nouvelId: id });
ok(r1.neufs.length === 2 && r1.objets.length === 2, "deux au plus par passage");
const r2 = E.ranger(r1.objets, [prop("Les crêpes", "c"), prop("Le thé", "d")], { aujourdhui: AUJ, le: "2026-11-13T19:00:00.000Z", nouvelId: id });
ok(r2.neufs.length === 1 && r2.objets.length === 3, "trois par jour au plus (le quatrième attend demain)");
const r3 = E.ranger(r2.objets, [prop("les pivoines", "z")], { aujourdhui: "2026-11-14", le: "2026-11-14T09:00:00.000Z", nouvelId: id });
ok(r3.neufs.length === 0 && r3.objets.length === 3, "la même chose (même genre, même titre) : pas doublée");
const d1 = E.ranger([], [{ ...prop("Le permis", "p"), genre: "date", sorte: "epreuve", quand: "2026-11-19" }], { aujourdhui: AUJ, le: "2026-11-13T18:00:00.000Z", nouvelId: id });
const d2 = E.ranger(d1.objets, [{ ...prop("Le permis", "q"), genre: "date", sorte: "epreuve", quand: "2026-11-26", ditQuand: "dans deux jeudis" }], { aujourdhui: AUJ, le: "2026-11-13T19:00:00.000Z", nouvelId: id });
ok(d2.neufs.length === 0 && d2.objets.length === 1 && d2.objets[0].quand === "2026-11-26", "redite avec un autre jour : la date se met à jour");
const tombe = E.pierreTombale(r1.objets[0], MOI, "2026-11-13T20:00:00.000Z");
ok(tombe.etat === "retire" && !tombe.titre && !tombe.citation && !tombe.emoji && tombe.message === "a" && tombe.change.par8 === MOI, "la pierre tombale : plus aucun texte, seulement le message");
const r4 = E.ranger([tombe], [prop("Les pivoines", "a")], { aujourdhui: "2026-11-15", le: "2026-11-15T09:00:00.000Z", nouvelId: id });
ok(r4.neufs.length === 0, "un message dont l'objet a été retiré : plus jamais noté");
const quarante = Array.from({ length: 40 }, (_, k) => ({ ...prop(`Goût ${k}`, `g${k}`), id: `g${k}`, le: `2026-10-${String(1 + (k % 28)).padStart(2, "0")}T0${k % 10}:00:00.000Z`, etat: "actif", genre: k === 0 ? "date" : "gout", quand: k === 0 ? "2026-12-01" : undefined }));
const r5 = E.ranger(quarante, [prop("Les pivoines", "neuf")], { aujourdhui: AUJ, le: "2026-11-13T18:00:00.000Z", nouvelId: id });
ok(r5.objets.filter(E.visible).length === 40 && r5.objets.find((x) => x.id === "g0")?.etat === "actif" && r5.objets.some((x) => x.etat === "passe" && x.genre === "gout"), "quarante au plus : le plus ancien goût s'en va (jamais une date)");

// ═══ LES PHRASES, LE CATALOGUE ═══
const toutes = [...Object.values(E.PHRASES_NOTE).flat(), E.REGLES_ETAGERE];
ok(Object.values(E.PHRASES_NOTE).every((l) => l.length === 3), "trois phrases par genre");
const GENRE = /\b(content|contente|heureux|heureuse|seul|seule|fatigu[ée]e?|prête?|fière?|motivée?|ravie?|surprise?|occupée?)\b/i;
ok(toutes.every((t) => !GENRE.test(t)), `aucun accord au masculin ou au féminin (${toutes.filter((t) => GENRE.test(t)).join(" | ") || "aucun"})`);
ok(toutes.every((t) => !/exemple/i.test(t)), "jamais le mot interdit");
ok(toutes.every(passe), "aucun mot interdit, aucun alcool");
const a = E.phraseDeNote("date", "x1");
ok(E.phraseDeNote("date", "x1", a) !== a && E.PHRASES_NOTE.date.includes(E.phraseDeNote("date", "x1", a)), "jamais deux fois de suite la même phrase");
ok(!E.CATALOGUE.some((e) => /[🍷🍺🍸🥂🍹🍾🚬💊💉🔫🗡⛪🕌🕍✝☪✡]/u.test(e) || /\p{Regional_Indicator}/u.test(e)), "le catalogue : ni alcool, ni tabac, ni médicament, ni arme, ni drapeau, ni symbole religieux");
ok(E.CATALOGUE.length >= 55 && new Set(E.CATALOGUE).size === E.CATALOGUE.length, `le catalogue : une soixantaine d'emojis, sans doublon (${E.CATALOGUE.length})`);
ok(["📅", "🤝", "💛", "😂"].every((e) => E.CATALOGUE.includes(e)), "les emojis des genres sont dans le catalogue");
ok(E.emojiDuCatalogue("✈", "date") === "✈️" && E.emojiDuCatalogue("🍷", "gout") === "💛", "un emoji sans variante retrouvé ; un emoji d'alcool : celui du genre");

// ═══ LOT E2 : LE TEMPS QUI PASSE ═══
const ob = (x) => ({ id: x.id, genre: "date", emoji: "🚗", titre: "Le permis", titreToi: "Ton permis", concerne: LEA, citation: "…", de8: LEA, message: `m-${x.id}`, le: "2026-11-01T10:00:00.000Z", etat: "actif", ...x });
const v1 = E.vieillir([ob({ id: "e", sorte: "epreuve", quand: "2026-11-09" }), ob({ id: "e2", sorte: "epreuve", quand: "2026-11-10" }), ob({ id: "ev", sorte: "evenement", quand: "2026-11-11" }), ob({ id: "ev2", sorte: "evenement", quand: "2026-11-12" }), ob({ id: "f", sorte: "fete", annuel: true, quand: "2026-11-12" }), ob({ id: "p", genre: "promesse", le: "2026-09-01T10:00:00.000Z" })], AUJ);
const etat = (id) => v1.objets.find((x) => x.id === id);
ok(v1.change && etat("e").etat === "passe" && etat("e2").etat === "actif", "une épreuve sans nouvelles : elle s'en va à J+4, pas à J+3");
ok(etat("ev").etat === "passe" && etat("ev2").etat === "actif", "un événement s'en va le surlendemain (le lendemain, on demande comment c'était)");
ok(etat("f").quand === "2027-11-12" && etat("f").etat === "actif", "un anniversaire passé revient l'année suivante");
ok(etat("p").etat === "sommeil" && E.detailPour(etat("p"), MOI, "Léa", AUJ) === "promis le 1er sept.", "une promesse relancée deux fois s'endort (elle reste)");
const pr = ob({ id: "resto", genre: "promesse", concerne: "deux", emoji: "🍝", titre: "Le resto italien", le: "2026-10-23T17:00:00.000Z" });
const r21 = E.relancesDues([pr], [], AUJ, "2026-11-13T09:00:00.000Z");
ok(r21.length === 1 && r21[0].n === 21 && r21[0].genre === "relance" && r21[0].objet === "resto", "21 jours après la promesse : une relance");
ok(E.relancesDues([pr], r21, AUJ, "x").length === 0, "une seule fois");
ok(E.relancesDues([pr], r21, "2026-12-22", "x")[0]?.n === 60 && E.relancesDues([pr], [], "2026-11-12", "x").length === 0, "à 60 jours, la deuxième (et pas avant 21 jours)");
ok(E.relancesDues([{ ...pr, quand: "2026-11-12" }], [], AUJ, "x")[0]?.n === 0, "une promesse qui avait un jour : le lendemain, « Alors, c'est fait ? »");
ok(E.relancesDues([{ ...pr, etat: "tenue" }], [], AUJ, "x").length === 0, "une promesse tenue : plus de relance");

// ═══ LES ISSUES, LA FIERTÉ ═══
const ep = ob({ id: "permis", sorte: "epreuve", quand: AUJ });
const i1 = E.appliquerIssues([ep], [{ id: "permis", resultat: "reussi" }], { aujourdhui: AUJ, le: "2026-11-13T11:40:00.000Z", par8: "ia" });
ok(i1.objets[0].etat === "fierte" && i1.objets[0].emoji === "🏆" && i1.objets[0].emojiAvant === "🚗" && i1.cartes[0]?.genre === "fierte" && E.rayonDe(i1.objets[0]) === "fiertes", "réussi : le trophée, tout en haut, une carte « fierté »");
ok(E.detailPour(i1.objets[0], MOI, "Léa", AUJ) === "réussi le vendredi 13 nov.", "« réussi le vendredi 13 nov. »");
const i2 = E.appliquerIssues([ep], [{ id: "permis", resultat: "rate" }], { aujourdhui: AUJ, le: "x", par8: "ia" });
ok(i2.objets[0].etat === "passe" && !i2.cartes.length, "raté : il s'en va, sans bruit (aucune carte)");
ok(E.appliquerIssues([ep], [{ id: "permis", resultat: "reporte", quand: "2026-12-03" }], { aujourdhui: AUJ, le: "x", par8: "ia" }).objets[0].quand === "2026-12-03" && E.appliquerIssues([ep], [{ id: "permis", resultat: "reporte" }], { aujourdhui: AUJ, le: "x", par8: "ia" }).objets[0].etat === "passe", "reporté : le nouveau jour s'il est dit, sinon il s'en va");
ok(E.appliquerIssues([ob({ id: "permis", sorte: "epreuve", quand: "2026-11-20" })], [{ id: "permis", resultat: "reussi" }], { aujourdhui: AUJ, le: "x", par8: "ia" }).objets[0].etat === "actif", "une issue avant le jour J : ignorée");
ok(E.issueValide({ id: "a", resultat: "reussi" })?.resultat === "reussi" && E.issueValide({ id: "a", resultat: "bof" }) === null, "une issue relue : rien d'inventé");

// ═══ LES RAPPELS DU MATIN ═══
const etg = [
  ob({ id: "permis", sorte: "epreuve", quand: AUJ }),
  ob({ id: "anniv", sorte: "fete", annuel: true, emoji: "🎂", titre: "L’anniversaire", titreToi: "Ton anniversaire", quand: "2026-11-16" }),
  ob({ id: "conc", sorte: "evenement", emoji: "🎧", titre: "Le concert", quand: "2026-11-12" }),
  ob({ id: "piv", genre: "gout", emoji: "💐", titre: "Les pivoines", nuance: "aime" }),
  ob({ id: "rom", genre: "gout", emoji: "📖", titre: "Le roman des phares", nuance: "envie" }),
];
const rs = E.rappelsDe(etg, MOI, AUJ);
ok(rs.map((r) => r.cas).join(",") === "epreuve,anniv3,lendemain", `chez Sam : l'épreuve du jour, l'anniversaire dans 3 jours, le lendemain du concert, dans cet ordre (${rs.map((r) => r.cas)})`);
ok(E.rappelsDe(etg, LEA, AUJ).map((r) => r.cas).join(",") === "encourage", "chez Léa (ça la concerne) : seulement l'encouragement de sa figurine");
ok(E.garderRappels(rs).length === 2 && E.garderRappels(rs).map((r) => r.cas).join(",") === "epreuve,anniv3", "deux rappels au plus par matin, les plus importants");
ok(E.garderRappels([...rs, ...E.rappelsDe(etg, LEA, AUJ)]).filter((r) => r.cas === "encourage").length === 1, "et l'encouragement, à part");
ok(E.phraseRappel("epreuve", "Le permis de Léa", "🚗") === "Aujourd’hui, c’est le permis de Léa 🚗 Un petit mot avant le départ ?", "« Aujourd'hui, c'est le permis de Léa 🚗 Un petit mot avant le départ ? »");
ok(E.phraseRappel("anniv3", "L’anniversaire de Léa", "🎂", ["les pivoines", "le roman des phares"]) === "Dans 3 jours, l’anniversaire de Léa 🎂 Des idées : les pivoines, le roman des phares", "à J-3 : « Des idées : les pivoines, le roman des phares »");
ok(E.phraseRappel("anniv", "L’anniversaire de Léa", "🎂") === "C’est l’anniversaire de Léa 🎂 Tu lui souhaites ?" && E.phraseRappel("evenement", "Le concert de Nina", "🎧") === "Aujourd’hui, le concert de Nina 🎧" && E.phraseRappel("lendemain", "Le concert de Nina", "🎧") === "Hier, c’était le concert de Nina 🎧 Tu lui demandes comment c’était ?", "l'anniversaire, l'événement, le lendemain");
ok(E.phraseRappel("encourage", "Ton permis", "🚗", [], "x").includes("🚗") && E.ENCOURAGEMENTS.length === 3, "l'encouragement prend l'emoji du souvenir");
const nf = E.notifRappel("epreuve", "Le permis de Léa", "🚗");
ok(nf.titre === "📌 Aujourd’hui : le permis de Léa 🚗" && nf.corps === "Un petit mot avant le départ ? Ta figurine t’attend.", "la notification : « 📌 Aujourd'hui : le permis de Léa 🚗 »");

// ═══ LA LIGNE DE « CHEZ MOI » ═══
ok(E.sonTitre({ titre: "Le permis", concerne: LEA }, MOI) === "son permis" && E.sonTitre({ titre: "La finale", concerne: LEA }, MOI) === "sa finale" && E.sonTitre({ titre: "Les pivoines", concerne: LEA }, MOI) === "ses pivoines" && E.sonTitre({ titre: "L’anniversaire", concerne: LEA }, MOI) === "son anniversaire", "« son permis », « sa finale », « ses pivoines », « son anniversaire »");
ok(E.sonTitre({ titre: "Le permis", titreToi: "Ton permis", concerne: LEA }, LEA) === "ton permis" && E.sonTitre({ titre: "Le resto italien", concerne: "deux" }, MOI) === "le resto italien", "« ton permis », « le resto italien »");
ok(E.ligneEtagere({ rappel: rs[0] }, MOI)?.txt === "📌 Aujourd’hui : son permis 🚗", "un rappel du jour : « 📌 Aujourd'hui : son permis 🚗 »");
ok(E.ligneEtagere({ nouveau: ob({ id: "p2", sorte: "epreuve", quand: "2026-11-19" }) }, MOI)?.txt === "📌 Noté : son permis, jeudi 19", "un souvenir pas encore vu : « 📌 Noté : son permis, jeudi 19 »");
ok(E.ligneEtagere({ relance: { objet: pr, n: 21 } }, MOI)?.txt === "🍝 Le resto italien : promis il y a 3 semaines", "une relance : « 🍝 Le resto italien : promis il y a 3 semaines »");
ok(E.RANGS_LIGNE.rappel > E.RANGS_LIGNE.note && E.RANGS_LIGNE.note > E.RANGS_LIGNE.relance && E.RANGS_LIGNE.relance > 2 && E.RANGS_LIGNE.rappel < 3, "les rangs : après un message non lu, avant une visite");

// ═══ CE QUE DISENT LES FIGURINES, PLUS TARD ═══
const [q1, q2] = E.phrasesRelance(21, "🍝", "r21-resto");
ok(/3 semaines/i.test(q1) && q1.includes("🍝") && E.RELANCE_SECONDE.includes(q2), `la relance : « ${q1} » / « ${q2} »`);
ok(E.phrasesRelance(60, "🍝", "k")[0].toLowerCase().includes("deux mois") && E.phrasesRelance(0, "🥾", "k")[0] === "Alors, c’est fait ? 🥾", "à 60 jours : « deux mois » ; le lendemain : « Alors, c'est fait ? »");
ok(E.phraseFierte("Léa") === "Léa, c’est réussi ! 🏆 Je range ça tout en haut" && E.phraseTenue(8) === "8 promesses tenues ! On est des gens fiables 😎" && E.phraseTenue(1) === "1 promesse tenue ! On est des gens fiables 😎", "la fierté, la promesse tenue");
ok(E.dureeRelance(21) === "Ça fait 3 semaines 👀" && E.dureeRelance(60) === "Ça fait 2 mois 👀", "« Ça fait 3 semaines 👀 »");
const plusTard = [...E.ENCOURAGEMENTS, ...E.RELANCE_PREMIERE, ...E.RELANCE_SECONDE, E.phraseFierte("Léa"), E.phraseFierte(null), E.phraseTenue(2), ...["epreuve", "anniv", "anniv3", "evenement", "lendemain"].map((c) => E.memeDuRappel(c, "🚗"))];
ok(plusTard.every((x) => !GENRE.test(x) && !/exemple/i.test(x) && passe(x)), `les phrases d'E2 : sans accord, sans le mot interdit, sans alcool (${plusTard.filter((x) => GENRE.test(x) || !passe(x)).join(" | ") || "aucune"})`);

// ═══ LOT E3 : LA POUSSIÈRE ═══
const H = Date.parse("2026-11-13T12:00:00Z");
const etatA = (j, x = {}) => E.etatEtagere({ dernier: H - j * 86_400_000, messages: 8, objets: 2, maintenant: H, ...x });
ok(etatA(3) === "eclairee" && etatA(4) === "calme" && etatA(9) === "calme" && etatA(10) === "poussiere", "3 jours : éclairée ; 4 à 9 : calme ; 10 : la poussière");
ok(etatA(30, { messages: 5 }) === null && etatA(30, { objets: 0 }) === null, "un proche tout neuf (moins de six messages), une étagère vide : pas de poussière");
const jours = ["2026-11-13T09:00:00Z", "2026-11-13T18:00:00Z", "2026-11-12T10:00:00Z", "2026-11-10T10:00:00Z", "2026-11-07T10:00:00Z", "2026-11-06T10:00:00Z"].map(Date.parse);
ok(E.joursSurSept(jours, AUJ) === 4, "« 4 jours sur 7 » (deux messages le même jour comptent pour un ; le 6 est hors de la semaine)");
ok(E.phraseEtat("eclairee", { jours: 0, surSept: 5 }) === "✨ Bien éclairée · vous vous êtes parlé 5 jours sur 7" && E.phraseEtat("poussiere", { jours: 12, surSept: 0 }) === "🕸️ Elle prend la poussière · 12 jours sans un mot" && E.phraseEtat("calme", { jours: 6, surSept: 1 }) === "", "l'état, en clair (rien de particulier quand c'est calme)");
const NINA8 = "cccccccc";
const avecConcert = [ob({ id: "conc", sorte: "evenement", emoji: "🎧", titre: "Le concert", titreToi: "Ton concert", concerne: NINA8, quand: "2026-11-01", etat: "passe" }), ob({ id: "fr", genre: "gout", emoji: "🍰", titre: "Le fraisier", concerne: NINA8, nuance: "aime" })];
const cp = E.carteDePoussiere(avecConcert, MOI, "Nina", 12, AUJ);
ok(cp.texte === "12 jours sans un mot… Votre étagère prend la poussière. Nina avait son concert le 1er novembre 🎧" && cp.bouton === "🎙️ Lui demander comment c’était", `l'accroche : le dernier événement passé (« ${cp.texte} »)`);
ok(E.carteDePoussiere(avecConcert, NINA8, "Sam", 12, AUJ).texte.endsWith("Tu avais ton concert le 1er novembre 🎧"), "chez Nina, la sienne : « Tu avais ton concert… »");
ok(E.carteDePoussiere([avecConcert[1]], MOI, "Nina", 12, AUJ).texte.endsWith("Nina adore le fraisier 🍰") && E.carteDePoussiere([avecConcert[1]], MOI, "Nina", 12, AUJ).bouton === "🎙️ Lui faire signe", "sinon un goût : « Nina adore le fraisier 🍰 »");
ok(E.carteDePoussiere([ob({ id: "c", genre: "blague", emoji: "🦆", titre: "Le canard de Biarritz", concerne: "deux" })], MOI, "Nina", 12, AUJ).texte.endsWith("Et votre blague : le canard de Biarritz 🦆"), "sinon la blague");
ok(E.carteDePoussiere([], MOI, "Nina", 12, AUJ).texte === "12 jours sans un mot… Votre étagère prend la poussière.", "sinon rien de plus");
const tsAvant = [1, 2, 3, 4, 5, 6].map((k) => H - (30 - k) * 86_400_000);
const reprise = H - 2 * 86_400_000;
const ra = E.rallumages([...tsAvant, reprise], new Set(), H);
ok(ra.length === 1 && ra[0].le === new Date(reprise).toISOString(), "se rallumer : le premier message après dix jours sans un mot");
ok(E.rallumages([...tsAvant, reprise], new Set([ra[0].id]), H).length === 0 && E.rallumages([...tsAvant, H - 8 * 86_400_000], new Set(), H).length === 0 && E.rallumages([...tsAvant.slice(0, 4), reprise], new Set(), H).length === 0, "une seule fois ; pas une reprise vieille de plus d'une semaine ; pas un proche tout neuf");
ok(E.LIGNE_POUSSIERE.txt === "🕸️ Votre étagère prend la poussière" && E.LIGNE_POUSSIERE.rang < 1, "sur sa ligne : « 🕸️ Votre étagère prend la poussière », sous tout le reste");
ok(E.PHRASES_RALLUME.every((x) => !GENRE.test(x) && passe(x) && !/exemple/i.test(x)), "les phrases du réveil : sans accord, sans le mot interdit");

// ═══ LES IDÉES, LA BLAGUE ═══
const vusIdees = [
  { genre: "gout", etat: "actif", pourMoi: false, emoji: "💐", titre: "Les pivoines de Léa", le: "2026-11-02" },
  { genre: "gout", etat: "actif", pourMoi: true, emoji: "🍕", titre: "Tes pizzas", le: "2026-11-05" },
  { genre: "gout", etat: "actif", pourMoi: false, emoji: "📖", titre: "Le roman des phares de Léa", le: "2026-11-04" },
  { genre: "gout", etat: "actif", pourMoi: false, emoji: "🧸", titre: "Les peluches de Léa", le: "2026-10-01" },
];
ok(E.idees(vusIdees).map((x) => x.emoji).join("") === "📖💐", "« Offrir » : deux de ses goûts au plus, les plus récents (pas les miens)");
ok(E.memeDeLaBlague({ titre: "Le canard de Biarritz", emoji: "🦆" }) === "Le canard de Biarritz 🦆", "le mème de leur blague : « Le canard de Biarritz 🦆 »");

// ═══ CE QU'ON MESURE ═══
ok(!E.alertesEtagere({ ...E.STATS_VIDES, notes: 4, paires: 3, retires: 0, rappels: 10, suivis: 5 }).length, "une journée normale : pas d'alerte");
const al = E.alertesEtagere({ ...E.STATS_VIDES, notes: 10, paires: 2, retires: 3, dates: 2, rappels: 10, suivis: 1 });
ok(al.length === 4, `les quatre seuils : trop de souvenirs, trop de retirés, trop de dates changées, des rappels pas suivis (${al.length})`);

// ═══ 🏡 LOT E4 : MON ÉTAGÈRE, DÉPOSER À LA MAIN ═══
// (dans son bloc : ses noms ne croisent pas ceux d'au-dessus)
{
  const td = (t, deux = false) => E.titreDepose(t, deux);
  ok(td("Mon permis").titre === "Le permis" && td("Mon permis").titreToi === "Ton permis", "« Mon permis » : rangé « Le permis », « Ton permis » pour celui que ça concerne");
  ok(td("ma finale").titre === "La finale" && td("ma finale").titreToi === "Ta finale" && td("Mes pivoines").titre === "Les pivoines" && td("Mes pivoines").titreToi === "Tes pivoines", "« ma finale », « Mes pivoines » : « La finale » / « Ta finale », « Les pivoines » / « Tes pivoines »");
  ok(td("Son anniversaire").titre === "L’anniversaire" && td("Son anniversaire").titreToi === "Ton anniversaire" && td("Ton amie Zoé").titre === "L’amie Zoé", "devant une voyelle : « L’anniversaire » (« Ton anniversaire »)");
  ok(td("Mon resto", true).titre === "Le resto" && !td("Mon resto", true).titreToi && td("Notre resto", true).titre === "Notre resto" && td("Le concert").titre === "Le concert" && !td("Le concert").titreToi, "pour nous deux : « Le resto » (sans « ton ») ; « Notre resto » reste ; « Le concert » reste");
  const AUJ4 = "2026-11-14";
  const cd = { aujourdhui: AUJ4, passe, moi8: MOI };
  const dv = (x, c = cd) => E.depotValide(x, c);
  const dp1 = dv({ genre: "date", titre: "Mon concert", emoji: "🎤", quand: "2026-11-20" });
  ok(dp1.objet && dp1.objet.genre === "date" && dp1.objet.sorte === "evenement" && dp1.objet.titre === "Le concert" && dp1.objet.titreToi === "Ton concert" && dp1.objet.concerne === MOI && dp1.objet.de8 === MOI && dp1.objet.depose === true && dp1.objet.citation === "" && dp1.objet.quand === "2026-11-20" && dp1.objet.emoji === "🎤", `une date déposée sur mon étagère (${JSON.stringify(dp1)})`);
  ok(dv({ genre: "date", sorte: "fete", titre: "Mon anniversaire", emoji: "🎂", quand: "1990-03-12" }).objet?.quand === "2027-03-12" && dv({ genre: "date", sorte: "fete", titre: "La fête", quand: "1990-11-14" }).objet?.quand === "2026-11-14", "« tous les ans », tapé avec l'année de naissance : sa prochaine fois (aujourd'hui compris)");
  ok(dv({ genre: "envie", titre: "Le saut en parachute", emoji: "🍺" }).objet?.genre === "gout" && dv({ genre: "envie", titre: "Le saut en parachute" }).objet?.nuance === "envie" && dv({ genre: "envie", titre: "Le saut en parachute", emoji: "🍺" }).objet?.emoji === "💛", "une envie : le genre « goût », sa nuance ; un emoji hors du catalogue : celui du genre");
  ok(dv({ genre: "promesse", titre: "Le resto" }).objet && !dv({ genre: "promesse", titre: "Le resto" }).objet.quand && dv({ genre: "promesse", titre: "Le resto", quand: "2026-11-21" }).objet?.quand === "2026-11-21", "une promesse : un jour, s'il est dit");
  const refuse = (x, pourquoi, re) => {
    const r = dv(x);
    ok(Boolean(r.erreur) && (!re || re.test(r.erreur)), `refusé : ${pourquoi} (« ${r.erreur} »)`);
  };
  refuse({ titre: "Le concert" }, "sans dire ce que c'est");
  refuse({ genre: "date", titre: "Le concert" }, "une date sans jour", /jour/);
  refuse({ genre: "date", titre: "Le concert", quand: "2026-11-13" }, "un jour passé", /jour/);
  refuse({ genre: "date", titre: "Le concert", quand: "2028-01-01" }, "un jour à plus de 400 jours", /jour/);
  refuse({ genre: "gout", titre: "X" }, "un nom d'une lettre", /nom/);
  refuse({ genre: "gout", titre: "Le plus beau concert de toute ma vie" }, "un nom de plus de 28 signes", /28/);
  refuse({ genre: "gout", titre: "Les mojitos" }, "de l'alcool", /ne passe pas/);
  refuse({ genre: "gout", titre: "Appelle le 0612345678" }, "un numéro", /ne passe pas/);
  refuse({ genre: "date", titre: "Le dentiste", quand: "2026-11-20" }, "un sujet sensible (la santé)", /bons moments/);
  const cp = { ...cd, lui8: LEA };
  ok(dv({ genre: "date", sorte: "epreuve", titre: "Ton permis", quand: "2026-11-19", pour: "lui" }, cp).objet?.concerne === LEA && dv({ genre: "date", sorte: "epreuve", titre: "Ton permis", quand: "2026-11-19", pour: "lui" }, cp).objet?.titre === "Le permis", "sur la nôtre, pour lui : « Ton permis » se range « Le permis », il le concerne");
  ok(dv({ genre: "gout", titre: "Notre chanson" }, cp).objet?.concerne === "deux" && dv({ genre: "gout", titre: "Le resto", pour: "moi" }, cp).objet?.concerne === MOI && dv({ genre: "gout", titre: "Le resto", pour: "lui" }, cd).objet?.concerne === MOI, "pour nous deux par défaut ; pour moi ; sur la mienne, toujours moi");
  const ob4 = (x) => ({ id: "x", genre: "date", emoji: "🎤", titre: "Le concert", titreToi: "Ton concert", concerne: MOI, citation: "", de8: MOI, message: "depot-x", le: "2026-11-10T10:00:00.000Z", etat: "actif", depose: true, ...x });
  const rm = E.rappelsMiens([ob4({ id: "a", sorte: "evenement", quand: AUJ4 }), ob4({ id: "b", sorte: "epreuve", quand: AUJ4 }), ob4({ id: "c", sorte: "evenement", quand: "2026-11-15" }), ob4({ id: "d", genre: "promesse", quand: AUJ4 }), ob4({ id: "e", quand: AUJ4, etat: "passe" })], AUJ4);
  ok(rm.map((r) => `${r.objet.id}:${r.cas}`).join(",") === "a:mien,b:encourage,d:mien", `mes rappels : le jour venu (une épreuve : l'encouragement), pas avant, pas ce qui est parti (${rm.map((r) => `${r.objet.id}:${r.cas}`)})`);
  ok(E.phraseRappel("mien", "Ton concert", "🎤") === "Aujourd’hui : ton concert 🎤 Tu l’avais posé sur ton étagère 📌" && E.notifRappel("mien", "Ton concert", "🎤").titre === "📌 Aujourd’hui : ton concert 🎤", "« Aujourd'hui : ton concert 🎤 Tu l'avais posé sur ton étagère 📌 », et la notification");
  ok(E.garderRappels([...rm, { cas: "evenement", objet: ob4({ id: "f" }), rang: 4 }]).map((r) => r.cas).join() === "encourage,mien,mien", "deux rappels au plus le matin, les miens d'abord (et l'encouragement, à part)");
  ok(E.detailPour(ob4({ genre: "blague", titre: "Le canard" }), MOI, "Léa", AUJ4) === "ta blague" && E.detailPour(ob4({ genre: "blague", titre: "Le canard", concerne: LEA }), MOI, "Léa", AUJ4) === "la blague de Léa", "une blague à moi : « ta blague » ; à Léa : « la blague de Léa »");
  const vt = E.vitrineDe(ob4({ genre: "gout", nuance: "aime", emoji: "💐", titre: "Les pivoines", titreToi: "Tes pivoines" }), "Inès", AUJ4);
  ok(vt.titre === "Les pivoines" && vt.detail === "Inès adore" && vt.rayon === "aime" && !("citation" in vt) && !("de" in vt) && Object.keys(vt).join() === "id,emoji,titre,detail,rayon", `ce que voit un visiteur : « Les pivoines · Inès adore », ni la phrase ni avec qui (${JSON.stringify(vt)})`);
  ok(E.meConcerne({ etat: "actif", concerne: MOI }, MOI) && E.meConcerne({ etat: "tenue", concerne: "deux" }, MOI) && !E.meConcerne({ etat: "actif", concerne: LEA }, MOI) && !E.meConcerne({ etat: "retire", concerne: MOI }, MOI), "sur mon étagère : ce qui me concerne (ou nous deux), pas ce qui concerne l'autre, pas ce qui est retiré");
  const deposes3 = [1, 2, 3].map((k) => ob4({ id: `d${k}`, genre: "gout", titre: `Le goût ${k}`, le: `${AUJ4}T09:0${k}:00.000Z`, message: `depot-d${k}` }));
  const rg = E.ranger(deposes3, [{ genre: "gout", emoji: "💐", titre: "Les pivoines", concerne: LEA, citation: "j'adore les pivoines", de8: LEA, message: "m9", nuance: "aime" }], { aujourdhui: AUJ4, le: `${AUJ4}T10:00:00.000Z`, nouvelId: () => "neuf" });
  ok(rg.neufs.join() === "neuf", "trois déposés à la main aujourd'hui : les figurines peuvent encore noter (leurs trois par jour sont à elles)");
  ok(E.STATS_VIDES.deposes === 0 && E.GENRES_DEPOT.length === 5 && E.SORTES_DEPOT.length === 3 && E.RAYONS_MIENS.map((r) => r.nom).join("|") === "Mes fiertés|À venir|Ce que j’aime", "les déposés se comptent ; cinq genres, trois sortes de jour ; mes trois rayons");
  const textesE4 = [E.REGLES_MON_ETAGERE, ...E.GENRES_DEPOT.flatMap((g) => [g.nom, g.indice]), ...E.SORTES_DEPOT.map((x) => x.nom), E.phraseRappel("mien", "Ton concert", "🎤"), E.notifRappel("mien", "Ton concert", "🎤").corps];
  ok(textesE4.every((x) => !GENRE.test(x) && passe(x) && !/exemple/i.test(x)), "les mots du lot E4 : sans accord, sans le mot interdit, sans alcool");
}

// ═══ 📌 (lot E5) « JE LE RANGE ? » ═══
{
  const LE = "2026-11-13T18:00:00.000Z";
  const maintenant = Date.parse(LE);
  let k = 0;
  const nid = () => `q${++k}`;
  // (le réglage : ni Léa ni Sam ne laissent leur figurine ranger seule)
  const seuls = { [LEA]: false, [MOI]: false };
  const demander = (p) => ((p.concerne === "deux" ? seuls[LEA] || seuls[MOI] : seuls[p.concerne]) ? null : { a: E.aQuiDemander(p), jusqua: E.jusquaDe(LE, p.quand) });
  const permisP = { genre: "date", sorte: "epreuve", emoji: "🚗", titre: "Le permis", titreToi: "Ton permis", concerne: LEA, citation: "Jeudi prochain je passe le permis", de8: LEA, message: "m2", quand: "2026-11-19", ditQuand: "jeudi prochain" };
  const restoP = { genre: "promesse", emoji: "🍝", titre: "Le resto italien", concerne: "deux", citation: "Faut qu'on se fasse ce resto italien", de8: MOI, message: "m3" };
  const q1 = E.ranger([], [permisP, restoP], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander });
  const [pp, pr] = q1.objets;
  ok(q1.neufs.length === 2 && q1.questions.length === 2 && pp.etat === "propose" && pr.etat === "propose", "ce que les figurines notent se range « proposé » : deux questions");
  ok(pp.demande.a === LEA && pr.demande.a === "deux", "le permis : la question à Léa seule ; le resto : aux deux");
  ok(!E.visible(pp) && !E.visible(pr) && !E.meConcerne(pp, LEA), "un souvenir proposé n'est jamais visible (ni le mur, ni la page, ni « Mon étagère »)");
  const ditParSam = E.ranger([], [{ ...permisP, de8: MOI, message: "m9" }], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander }).objets[0];
  ok(ditParSam.demande.a === LEA && E.decide(ditParSam, LEA) && !E.decide(ditParSam, MOI), "Sam dit « Léa passe son permis » : c'est Léa qui décide, pas Sam");
  ok(E.decide(pr, LEA) && E.decide(pr, MOI), "un souvenir commun : l'un ou l'autre décide");
  // 48 heures, et la date plus proche
  ok(pr.demande.jusqua === "2026-11-15T18:00:00.000Z", `48 heures pour répondre (${pr.demande.jusqua})`);
  ok(E.jusquaDe(LE, "2026-11-14") === "2026-11-14T20:00:00.000Z", "une date demain : jusqu'à son soir");
  ok(E.jusquaDe("2026-11-13T19:30:00.000Z", "2026-11-13") === "2026-11-13T22:30:00.000Z", "une date ce soir, dite à 20 h 30 : au moins trois heures");
  ok(E.jusquaDe(LE, "2026-11-19") === "2026-11-15T18:00:00.000Z", "une date lointaine : 48 heures");
  // « oui », « non », le premier des deux
  const nonSam = E.repondre(q1.objets, pp.id, true, { moi8: MOI, le: LE, maintenant });
  ok(nonSam.statut === 403 && nonSam.erreur === "C’est à celui que ça concerne de répondre.", "Sam répond au permis de Léa : refusé (403)");
  const ouiLea = E.repondre(q1.objets, pp.id, true, { moi8: LEA, le: LE, maintenant });
  const rangeP = ouiLea.objets.find((x) => x.id === pp.id);
  ok(rangeP.etat === "actif" && !rangeP.demande && rangeP.change.par8 === LEA && E.visible(rangeP) && !ouiLea.cartes.length, "Léa dit oui : le permis se range (visible), sans question");
  ok(E.repondre(ouiLea.objets, pp.id, true, { moi8: LEA, le: LE, maintenant }).statut === 404, "répondre deux fois : la question n'attend plus (404)");
  const nonLea = E.repondre(q1.objets, pp.id, false, { moi8: LEA, le: LE, maintenant });
  const tombeNon = nonLea.objets.find((x) => x.id === pp.id);
  ok(tombeNon.etat === "retire" && tombeNon.raison === "non" && !tombeNon.titre && !tombeNon.citation, "Léa dit non : une pierre tombale « non », sans texte");
  ok(E.ranger(nonLea.objets, [permisP], { aujourdhui: "2026-11-14", le: "2026-11-14T09:00:00.000Z", nouvelId: nid, demander }).neufs.length === 0, "un « non » est définitif : jamais reproposé");
  const ouiSam = E.repondre(q1.objets, pr.id, true, { moi8: MOI, le: LE, maintenant });
  ok(ouiSam.objets.find((x) => x.id === pr.id).etat === "actif" && E.repondre(ouiSam.objets, pr.id, false, { moi8: LEA, le: LE, maintenant }).statut === 404, "le resto : le premier « oui » des deux le range, l'autre ne peut plus dire non");
  const nonDeux = E.repondre(q1.objets, pr.id, false, { moi8: LEA, le: LE, maintenant });
  ok(nonDeux.objets.find((x) => x.id === pr.id).raison === "non", "le premier « non » des deux l'écarte");
  const date = E.repondre(q1.objets, pp.id, true, { moi8: LEA, le: LE, quand: "2026-11-26", maintenant });
  ok(date.objets.find((x) => x.id === pp.id).quand === "2026-11-26" && date.objets.find((x) => x.id === pp.id).etat === "actif" && !date.objets.find((x) => x.id === pp.id).ditQuand, "« Changer la date » sur une question : le bon jour, et rangé");
  // sans réponse
  const v48 = E.vieillir(q1.objets, "2026-11-15", Date.parse("2026-11-15T18:00:01.000Z"));
  ok(v48.expires === 2 && v48.change && v48.objets.every((x) => x.etat === "retire" && x.raison === "sans-reponse"), "48 heures sans réponse : rien n'est rangé (la pierre tombale « sans-reponse »)");
  ok(E.vieillir(q1.objets, "2026-11-15", Date.parse("2026-11-15T17:59:00.000Z")).expires === 0, "avant 48 heures : la question attend toujours");
  ok(E.ranger(v48.objets, [permisP], { aujourdhui: "2026-11-16", le: "2026-11-16T09:00:00.000Z", nouvelId: nid, demander }).neufs.length === 0, "sans réponse : n'est plus reproposé");
  ok(E.repondre(v48.objets, pp.id, true, { moi8: LEA, le: LE, maintenant: Date.parse("2026-11-16T09:00:00.000Z") }).statut === 404, "trop tard pour répondre");
  // la même chose, redite pendant que la question attend
  const redit = E.ranger(q1.objets, [{ ...permisP, message: "m7", quand: "2026-11-26", ditQuand: "dans deux jeudis" }], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander });
  ok(redit.neufs.length === 0 && redit.objets.find((x) => x.id === pp.id).quand === "2026-11-26", "redit pendant la question : pas doublé, la date se met à jour");
  ok(E.ranger(q1.objets, [prop("Les crêpes", "c1")], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander }).neufs.length === 1 && E.ranger([...q1.objets, { ...q1.objets[0], id: "z", message: "z", titre: "Le code", etat: "actif" }], [prop("Les crêpes", "c1")], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander }).neufs.length === 0, "les questions comptent dans les trois par jour");
  // le réglage
  seuls[LEA] = true;
  const auto = E.ranger([], [permisP, restoP], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander });
  ok(auto.objets.every((x) => x.etat === "actif" && !x.demande) && !auto.questions.length && auto.neufs.length === 2, "Léa laisse sa figurine ranger : son permis se range tout de suite ; le resto commun aussi (il suffit de l'un des deux)");
  seuls[LEA] = false;
  seuls[MOI] = true;
  const autoSam = E.ranger([], [permisP, restoP], { aujourdhui: AUJ, le: LE, nouvelId: nid, demander });
  ok(autoSam.objets.find((x) => x.genre === "date").etat === "propose" && autoSam.objets.find((x) => x.genre === "promesse").etat === "actif", "Sam l'a allumé : le permis de Léa se demande toujours à Léa ; le resto commun se range");
  seuls[MOI] = false;
  // l'issue d'une épreuve
  const epreuve = { ...permisP, id: "permis", le: "2026-11-13T10:00:00.000Z", etat: "actif", quand: "2026-11-19" };
  const qi = E.questionDIssue([epreuve], ["permis"], { aujourdhui: "2026-11-19", le: "2026-11-19T17:00:00.000Z" });
  ok(qi.questions.join() === "permis" && qi.objets[0].demande.issue && qi.objets[0].demande.a === LEA && qi.objets[0].etat === "actif" && E.visible(qi.objets[0]), "« JE L'AI !!! » : une question à Léa (le permis reste sur l'étagère en attendant)");
  ok(E.questionDIssue([epreuve], ["permis"], { aujourdhui: "2026-11-15", le: LE }).questions.length === 0, "avant le jour J : pas de question d'issue");
  const ouiIssue = E.repondre(qi.objets, "permis", true, { moi8: LEA, le: "2026-11-19T18:00:00.000Z", maintenant: Date.parse("2026-11-19T18:00:00.000Z") });
  ok(ouiIssue.objets[0].etat === "fierte" && ouiIssue.objets[0].emoji === "🏆" && ouiIssue.objets[0].emojiAvant === "🚗" && !ouiIssue.objets[0].demande && ouiIssue.cartes[0]?.genre === "fierte", "Léa dit oui : le trophée, tout en haut, et la carte de la fierté");
  const nonIssue = E.repondre(qi.objets, "permis", false, { moi8: LEA, le: "2026-11-19T18:00:00.000Z", maintenant: Date.parse("2026-11-19T18:00:00.000Z") });
  ok(nonIssue.objets[0].etat === "actif" && nonIssue.objets[0].sansIssue && !nonIssue.objets[0].demande && E.questionDIssue(nonIssue.objets, ["permis"], { aujourdhui: "2026-11-20", le: LE }).questions.length === 0, "Léa dit non : le permis reste, et son issue n'est plus jamais demandée");
  const vIssue = E.vieillir(qi.objets, "2026-11-22", Date.parse("2026-11-22T09:00:00.000Z"));
  ok(vIssue.expires === 1 && vIssue.objets[0].etat === "actif" && !vIssue.objets[0].demande, "l'issue sans réponse : plus de question, l'épreuve suit son cours");
  ok(E.vieillir(qi.objets, "2026-11-21", Date.parse("2026-11-21T09:00:00.000Z")).objets[0].demande?.issue, "l'issue qui attend : l'épreuve reste là le temps de la question");
  // le dépôt pour l'autre
  const depot = { ...E.depotValide({ genre: "date", sorte: "evenement", titre: "Ton concert", quand: "2026-11-21", pour: "lui" }, { aujourdhui: AUJ, passe, moi8: MOI, lui8: LEA }).objet, id: "dep", message: "depot-dep", le: LE, etat: "propose", demande: { a: LEA, jusqua: E.jusquaDe(LE, "2026-11-21"), par8: MOI } };
  ok(E.phraseQuestion(depot, LEA, "Sam") === "Sam veut ranger sur votre étagère : ton concert, samedi 21. D’accord ?" && E.quiDemande(depot, LEA) === "moi", `le dépôt de Sam, chez Léa : « ${E.phraseQuestion(depot, LEA, "Sam")} » (sa propre figurine le demande)`);
  // les phrases
  ok(E.phraseQuestion(pp, LEA, "Sam") === "J’ai entendu : ton permis, jeudi 19." && E.quiDemande(pp, LEA) === "moi", `la bulle, une personne : « ${E.phraseQuestion(pp, LEA, "Sam")} »`);
  ok(E.quiDemande(ditParSam, LEA) === "lui", "Sam l'a dit : chez Léa, c'est la figurine de Sam qui demande");
  ok(E.phraseQuestion(pr, LEA, "Sam") === "J’ai entendu : le resto italien. On le garde ?", `la bulle, les deux : « ${E.phraseQuestion(pr, LEA, "Sam")} »`);
  ok(E.phraseQuestion(qi.objets[0], LEA, "Sam") === "J’ai entendu : c’est réussi ! Je range ça dans vos fiertés ? 🏆", "la bulle de l'issue");
  ok(E.PANNEAU_QUESTION === "📌 Je le range ?" && E.PHRASE_NON === "D’accord, j’oublie.", "le panneau, et le « non »");
  ok(E.oubliDans("2026-11-15T18:00:00.000Z", AUJ) === "dans 2 jours" && E.oubliDans("2026-11-14T20:00:00.000Z", AUJ) === "demain" && E.oubliDans("2026-11-13T22:30:00.000Z", AUJ) === "ce soir", "« elle oublie dans 2 jours », « demain », « ce soir »");
  ok(E.notifQuestions(2).titre === "📌 Ta figurine a 2 choses à te demander" && E.notifQuestions(1).titre === "📌 Ta figurine a une chose à te demander", "l'envoi du matin");
  // la ligne de « Chez moi »
  const lq = E.ligneEtagere({ question: pp, rappel: null, nouveau: { ...pr, etat: "actif" } }, LEA);
  ok(lq.txt === "📌 Ta figurine te demande : ton permis ?" && lq.rang === 2.95 && lq.rang < 3 && lq.rang > E.RANGS_LIGNE.rappel, `« Chez moi » : « ${lq.txt} », juste après un message non lu`);
  // la mesure
  ok(!E.alertesEtagere({ ...E.STATS_VIDES, oui: 8, refuses: 2, expires: 1 }).length, "une journée normale de questions : pas d'alerte");
  const aq = E.alertesEtagere({ ...E.STATS_VIDES, oui: 5, refuses: 4, expires: 1, corriges: 1 });
  ok(aq.some((x) => x.includes("30 %")) && !aq.some((x) => x.includes("50 %")) && aq.some((x) => x.includes("corrigées")), `les alertes : refusées au-dessus de 30 %, dates corrigées au-dessus de 10 % (${aq.join(" | ")})`);
  ok(E.alertesEtagere({ ...E.STATS_VIDES, oui: 2, expires: 3 }).some((x) => x.includes("50 %")) && !E.alertesEtagere({ ...E.STATS_VIDES, refuses: 3 }).length, "sans réponse au-dessus de 50 % ; moins de cinq questions closes : pas d'alerte");
  ok(["proposes", "oui", "refuses", "expires", "auto", "corriges"].every((x) => E.STATS_VIDES[x] === 0), "les compteurs du lot E5");
  // la pierre tombale garde sa raison ; les entrées gardées ne jettent jamais une question
  ok(E.pierreTombale(pp, LEA, LE).raison === "retire", "retiré : la raison « retire »");
  const plein = [pp, ...Array.from({ length: 205 }, (_, j) => ({ ...epreuve, id: `t${j}`, message: `t${j}`, etat: "retire", titre: "" }))];
  ok(E.borner(plein).length === 200 && E.borner(plein).some((x) => x.id === pp.id), "deux cents entrées au plus : les pierres tombales s'en vont, jamais une question qui attend");
  const textesE5 = [E.PANNEAU_QUESTION, E.PHRASE_NON, E.phraseQuestion(pp, LEA, "Sam"), E.phraseQuestion(pr, LEA, "Sam"), E.phraseQuestion(qi.objets[0], LEA, "Sam"), E.phraseQuestion(depot, LEA, "Sam"), lq.txt, E.notifQuestions(2).titre, E.notifQuestions(2).corps, E.REGLAGE_RANGE_SEUL.titre, E.REGLAGE_RANGE_SEUL.aide, E.REGLES_ETAGERE];
  ok(textesE5.every((x) => !GENRE.test(x) && passe(x) && !/exemple/i.test(x) && !/\b(l'as|l’as) eu\b/.test(x)), `les mots du lot E5 : sans accord, sans le mot interdit, sans alcool (${textesE5.filter((x) => GENRE.test(x) || !passe(x)).join(" | ") || "tous"})`);
}

console.log(echecs ? `\n${echecs} échec(s)` : "\nles règles de l'étagère tiennent ✓");
process.exit(echecs ? 1 : 0);
