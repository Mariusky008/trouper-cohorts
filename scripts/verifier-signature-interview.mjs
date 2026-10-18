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
const { motsDesSousTitres, morceauxDeMots, enFrappes, frappesDesMots, motsForts, carteDeQuestion, enDeuxLignes, plansDeCoupe, SCRIPTS, REPLIQUES } = boite.exports;
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

console.log("══ les plans de coupe, calés sur ses mots ══");
const reponse = motsDesSousTitres(
  [
    { texte: "Aujourd'hui, c'est le manteau long camel.", debut: 3.4, fin: 5.5 },
    { texte: "Laine et cachemire, il tombe jusqu'aux chevilles…", debut: 5.9, fin: 8.5 },
    { texte: "Ouvert ou ceinturé, il va avec tout.", debut: 9.0, fin: 11.3 },
  ],
  forts,
);
const couvre = (pl, de, a) => Math.abs(pl[0].de - de) < 1e-9 && Math.abs(pl[pl.length - 1].a - a) < 1e-9 && pl.every((x, k) => k === 0 || Math.abs(x.de - pl[k - 1].a) < 1e-9);
const p0 = plansDeCoupe({ debut: 3.35, fin: 12, mots: reponse, medias: 0, visage: true });
dire(p0.length === 1 && p0[0].quoi === "visage", "sans photo : on le voit répondre du début à la fin");
const p1 = plansDeCoupe({ debut: 3.35, fin: 12, mots: reponse, medias: 2, produit: 0, visage: true });
dire(couvre(p1, 3.35, 12), `avec deux photos : ${p1.length} plans, sans trou — ${p1.map((x) => `${x.quoi}@${x.de.toFixed(1)}`).join(" ")}`);
dire(p1[0].quoi === "visage" && p1[0].a - p1[0].de >= 0.6, "on le voit d'abord (1,2 s, ou jusqu'à ce qu'il nomme son produit)");
const sansProduit = plansDeCoupe({ debut: 3.35, fin: 12, mots: reponse, medias: 2, visage: true });
dire(sansProduit[0].quoi === "visage" && sansProduit[0].a - sansProduit[0].de >= 1.2, "sans produit nommé : 1,2 s de visage au moins avant la première photo");
dire(p1.every((x) => x.a - x.de >= 0.599), "jamais un plan de moins d'une seconde (0,6 s pour arriver sur le produit)");
dire(p1.every((x, k) => k === 0 || x.quoi !== p1[k - 1].quoi), "chaque coupe change vraiment d'image");
const coupes = p1.slice(1).map((x) => x.de);
const debuts = reponse.map((w) => w.a);
dire(coupes.every((c) => debuts.some((a) => Math.abs(a - c) < 0.1)), "chaque coupe tombe au début d'un mot, jamais au milieu");
const motFort = reponse.find((w) => w.fort);
const surLui = p1.find((x) => motFort.a >= x.de && motFort.a < x.a);
dire(surLui?.quoi === 0, `quand il nomme son produit (« ${motFort.m} »), c'est la photo du produit`);
const apresLui = p1.slice(p1.indexOf(surLui) + 1).find((x) => typeof x.quoi === "number");
dire(!apresLui || apresLui.quoi !== 0, "la photo d'après est une autre : le produit, on vient de le voir");
const pf = plansDeCoupe({ debut: 3.35, fin: 12, mots: reponse, medias: 1, visage: false });
dire(pf.length === 1 && pf[0].quoi === 0, "son fantôme à l'écran, une seule photo : elle reste");
// AUCUNE PHOTO À CETTE RÉPONSE, SEULEMENT CELLE DU JOUR : elle ne vient que quand il nomme son produit
const ps = plansDeCoupe({ debut: 3.35, fin: 12, mots: reponse, medias: 1, produit: 0, visage: true, produitSeul: true });
const surProduit = ps.filter((x) => x.quoi === 0);
dire(
  couvre(ps, 3.35, 12) && surProduit.length === 1 && motFort.a >= surProduit[0].de && motFort.a < surProduit[0].a && ps.every((x) => x.quoi === 0 || x.quoi === "visage"),
  `sans photo à lui, la photo du jour passe une fois, sur « ${motFort.m} », puis on le revoit — ${ps.map((x) => `${x.quoi}@${x.de.toFixed(1)}`).join(" ")}`,
);
const sansNom = plansDeCoupe({ debut: 3.35, fin: 12, mots: motsDesSousTitres([{ texte: "Il est doux, il va avec tout, et il tient chaud.", debut: 3.4, fin: 8 }], forts), medias: 1, produit: 0, visage: true, produitSeul: true });
dire(sansNom.length === 1 && sansNom[0].quoi === "visage", "et s'il ne le nomme pas, on le voit répondre du début à la fin");
// LES RÉPONSES COURTES (« Douce. Vraie. ») : pas de rafale, mais sa photo se voit
const courte = motsDesSousTitres([{ texte: "Douce. Vraie. Élégante.", debut: 2.6, fin: 4.6 }], forts);
const pc = plansDeCoupe({ debut: 2.55, fin: 4.95, mots: courte, medias: 2, visage: true });
dire(
  pc.length === 2 && pc[0].quoi === "visage" && pc[1].quoi === 0 && couvre(pc, 2.55, 4.95) && pc.every((x) => x.a - x.de >= 0.999) && courte.some((w) => Math.abs(w.a - 0.04 - pc[1].de) < 1e-9),
  `une réponse de 2,4 s avec sa photo : lui, puis elle, coupé au début d'un mot — ${pc.map((x) => `${x.quoi}@${x.de.toFixed(2)}`).join(" ")}`,
);
const tresCourte = plansDeCoupe({ debut: 2.55, fin: 4.2, mots: courte, medias: 2, visage: true });
dire(tresCourte.length === 1 && tresCourte[0].quoi === 0, "trop courte pour deux plans : sa photo seule");
const deuxMots = motsDesSousTitres([{ texte: "Douce. Vraie.", debut: 2.6, fin: 4.0 }], forts);
const pd = plansDeCoupe({ debut: 2.55, fin: 5.2, mots: deuxMots, medias: 2, produit: 1, visage: true });
dire(pd.some((x) => x.quoi === 0), `2,65 s, aucune coupe possible au rythme des phrases : sa photo passe quand même — ${pd.map((x) => `${x.quoi}@${x.de.toFixed(2)}`).join(" ")}`);
const courteSansPhoto = plansDeCoupe({ debut: 2.55, fin: 4.95, mots: courte, medias: 1, produit: 0, visage: true, produitSeul: true });
dire(courteSansPhoto.length === 1 && courteSansPhoto[0].quoi === "visage", "courte, sans photo à lui : on le voit, lui");

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
