// 🎙️ LE REPORTER RACONTE — ce qu'il dit, vérifié sans téléphone.
//
// « Il faut qu'à chaque fois ce soit un phrasé différent, sinon ce sera bien
// trop répétitif. » Ce qui se vérifie ici (voir `reporter-recit.ts`) :
//   · assez de phrases dans chaque temps du récit, chacune courte et finie ;
//   · aucune ne parle du commerçant en « il » ou « elle » ;
//   · aucune n'affirme un fait sur le commerce hors de ses cases (« fait
//     maison », « du coin », « frais »…) — ni une qualité qu'on ne voit pas ;
//   · le nom du plat tombe toujours après « : », « … », « ? » ou entre
//     guillemets — jamais là où il faudrait un article ;
//   · « chez Chez Bergine » et « la cuisine de Le Bordeaux » n'existent pas ;
//   · un an de films, chaque jour, pour plusieurs commerces : une arrivée ne
//     revient pas avant une vingtaine de films, et deux commerces le même jour
//     ne racontent pas la même chose ;
//   · le serveur refait le même texte à partir des numéros, et refuse un fait
//     que le commerçant n'a pas coché.
//
//   node scripts/verifier-recit-reporter.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/reporter-recit.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const m = { exports: {} };
new Function("exports", "module", "require", js)(m.exports, m, () => ({}));
const { BANQUES_REPORTER, tirerRecit, recitDepuisIds, retenir, graineDe, lieuDuCommerce, boutsDePhrase, RECIT_MAX } = m.exports;

let echecs = 0;
const ok = (cond, quoi, detail = "") => {
  if (!cond) {
    echecs += 1;
    console.log(`✗ ${quoi}${detail ? ` — ${detail}` : ""}`);
  } else console.log(`✓ ${quoi}`);
};

const TROUS = new Set(["chez", "de", "commerce", "prenom", "ville", "plat", "prix"]);
const PRONOM = /\b(il|elle|ils|elles)\b/i;
const IMPERSONNEL = /\bs[’']il vous plaît|\bil (y a|n[’']y|ne reste|vous reste|faut|se doit)\b/gi;
// CE QU'IL NE PEUT DIRE QUE SI LE COMMERÇANT L'A COCHÉ — ou jamais (une qualité qu'on ne voit pas)
const FAIT = /(maison|du coin|local|\bbio\b|\bfrais\b|fraîch|recette|grand-m|délicieu|succulent|meilleur|ça sent|fabriqu|france|saison|végé|épuisement|unique|artisan|nouveaut|nouvel arrivage|vient (tout juste )?d’arriver)/i;
const MIN = { arrivee: 20, decouverte: 14, regard: 8, prix: 8, appel: 12 };

for (const [metier, b] of Object.entries(BANQUES_REPORTER)) {
  console.log(`══ ${metier} ══`);
  for (const [temps, n] of Object.entries(MIN)) ok(b[temps].length >= n, `${temps} : ${b[temps].length} phrases (au moins ${n})`);
  ok(b.faits.length >= 5 && b.faits.every((f) => f.phrases.length >= 3 && f.mot.length <= 22), `${b.faits.length} cases, trois façons de dire chacune, des mots courts`);
  const toutes = [...Object.keys(MIN).flatMap((t) => b[t].map((p) => [t, p])), ...b.faits.flatMap((f) => f.phrases.map((p) => [`fait ${f.id}`, p]))];
  const mauvaisTrous = toutes.filter(([, p]) => [...p.matchAll(/\{(\w+)\}/g)].some((x) => !TROUS.has(x[1])));
  ok(!mauvaisTrous.length, "chaque trou est connu", mauvaisTrous.map((x) => x[1]).join(" | "));
  const longues = toutes.filter(([, p]) => p.length > 130 || !/[.!?…]$/.test(p));
  ok(!longues.length, "chaque phrase tient en 130 signes et se termine", longues.map((x) => x[1]).join(" | "));
  const pronoms = toutes.filter(([, p]) => PRONOM.test(p.replace(IMPERSONNEL, "")));
  ok(!pronoms.length, "jamais « il » ni « elle » pour le commerçant", pronoms.map((x) => x[1]).join(" | "));
  const faits = toutes.filter(([t, p]) => !t.startsWith("fait") && FAIT.test(p));
  ok(!faits.length, "aucun fait sur le commerce hors de ses cases", faits.map((x) => `${x[0]} : ${x[1]}`).join(" | "));
  const plats = toutes.filter(([, p]) => /\{plat\}/.test(p) && !/(: |… |\? |! |« )\{plat\}/.test(p));
  ok(!plats.length, "le plat tombe après « : », « … », « ? », « ! » ou entre guillemets", plats.map((x) => x[1]).join(" | "));
  ok(b.decouverte.every((p) => p.includes("{plat}")), "chaque découverte nomme le plat");
  ok(b.prix.every((p) => p.includes("{prix}")), "chaque phrase de prix dit le prix");
  const doublons = toutes.map((x) => x[1]).filter((p, k, l) => l.indexOf(p) !== k);
  ok(!doublons.length, "aucune phrase en double", doublons.join(" | "));
}

console.log("══ le nom du commerce dans la phrase ══");
const lieux = { "Chez Bergine": ["chez Bergine", "de chez Bergine"], "Le Bordeaux": ["au Bordeaux", "du Bordeaux"], "La Table de Margot": ["à la Table de Margot", "de la Table de Margot"], "L’Atelier Rose": ["à l’Atelier Rose", "de l’Atelier Rose"], "Maison Lou": ["chez Maison Lou", "de Maison Lou"], "Les Halles": ["aux Halles", "des Halles"] };
for (const [nom, [chez, de]] of Object.entries(lieux)) {
  const l = lieuDuCommerce(nom);
  ok(l.chez === chez && l.de === de, `${nom} → « ${l.chez} », « ${l.de} »`);
}

console.log("══ les récits ══");
const COMMERCES = {
  table: [
    { commerce: "Chez Bergine", prenom: "Jean-Marie", ville: "Dax", plat: "Magret grillé, pommes sarladaises", prix: "19 €" },
    { commerce: "Le Bordeaux", ville: "Dax", plat: "Parmentier de canard", prix: "16" },
    { commerce: "La Table de Margot", prenom: "Margot", plat: "Lasagnes maison aux légumes du marché", prix: "" },
    { commerce: "L’Ardoise Landaise", ville: "Dax", plat: "Poulet basquaise et son riz", prix: "15 €" },
  ],
  mode: [
    { commerce: "Maison Lou", prenom: "Lou", ville: "Dax", plat: "Manteau long camel", prix: "189 €" },
    { commerce: "Le Dressing", prenom: "Claire", plat: "La robe à pois dorés", prix: "79 €" },
    { commerce: "Lili Ross by me", ville: "Vevey", plat: "Blazer rose, du 36 au 44", prix: "" },
  ],
};
const textes = [];
for (const [metier, liste] of Object.entries(COMMERCES)) {
  const ids = BANQUES_REPORTER[metier].faits.map((f) => f.id);
  let pire = Infinity;
  let trop = 0;
  let mauvais = [];
  let refait = true;
  let memeTexte = 0;
  let memeDebut = 0;
  let echos = 0;
  const exemplesEchos = [];
  const parJour = new Map();
  for (const c of liste) {
    let deja = null;
    const vues = [];
    const textesDuCommerce = [];
    for (let jour = 0; jour < 365; jour++) {
      const faits = ids.filter((_, k) => (jour * 7 + k * 3) % 5 === 0);
      const d = { ...c, faits };
      const r = tirerRecit(metier, d, { graine: graineDe(c.commerce, jour), deja });
      deja = retenir(deja, r);
      textes.push(r.texte);
      if (r.texte.length > RECIT_MAX) trop += 1;
      if (/chez Chez|de Le |à Le |au Le |de La |à La /.test(r.texte) || /\{|\}|undefined|null/.test(r.texte)) mauvais.push(r.texte);
      const avant = vues.lastIndexOf(r.ids.a);
      if (avant >= 0) pire = Math.min(pire, vues.length - avant);
      vues.push(r.ids.a);
      const avantTexte = textesDuCommerce.lastIndexOf(r.texte);
      if (avantTexte >= 0 && textesDuCommerce.length - avantTexte < 60) memeTexte += 1;
      textesDuCommerce.push(r.texte);
      // DEUX PHRASES DU MÊME RÉCIT NE PARTAGENT PAS UN BOUT DE PHRASE (« … ce qui sort de la cuisine. Et voici ce qui sort de la cuisine »)
      const vus = new Set();
      for (const x of r.morceaux) {
        const lieu = lieuDuCommerce(c.commerce);
        const t = x.texte.replace(c.plat, "{plat}").replace(lieu.de, "{de}").replace(lieu.chez, "{chez}").replace(c.commerce, "{commerce}");
        const b = boutsDePhrase(t);
        if ([...b].some((y) => vus.has(y))) { echos += 1; if (echos <= 2) exemplesEchos.push(r.texte); break; }
        b.forEach((y) => vus.add(y));
      }
      const phrases = r.morceaux.map((x) => x.texte.split(/\s+/)[0].toLowerCase());
      if (phrases.some((p, k) => k > 0 && p === phrases[k - 1])) memeDebut += 1;
      const refaitTexte = recitDepuisIds(metier, d, r.ids)?.texte;
      if (refaitTexte !== r.texte) refait = false;
      const k = `${jour}`;
      parJour.set(k, [...(parJour.get(k) ?? []), r.ids.a]);
    }
  }
  const memeJour = [...parJour.values()].filter((l) => new Set(l).size < l.length).length;
  ok(!mauvais.length, `${metier} : ${liste.length} commerces × 365 jours, aucun trou ni « chez Chez »`, mauvais.slice(0, 2).join(" | "));
  ok(!trop, `${metier} : chaque récit tient en ${RECIT_MAX} signes`, `${trop} trop longs`);
  ok(pire >= 18, `${metier} : une arrivée ne revient pas avant ${pire} films`);
  ok(memeJour <= 365 * 0.25, `${metier} : deux de ses commerces commencent pareil le même jour ${memeJour} fois sur 365`);
  ok(refait, `${metier} : le serveur refait le même texte à partir des numéros`);
  ok(!memeTexte, `${metier} : jamais le même texte deux fois en deux mois pour un commerce`, `${memeTexte} fois`);
  ok(!echos, `${metier} : aucun récit ne répète un bout de phrase (« … ce qui sort de la cuisine. Et voici ce qui sort de la cuisine »)`, `${echos} récits — ${exemplesEchos.join(" | ")}`);
  ok(memeDebut <= liste.length * 365 * 0.02, `${metier} : deux phrases de suite qui commencent pareil — ${memeDebut} récits sur ${liste.length * 365}`);
}
ok(new Set(textes).size >= textes.length * 0.995, `${textes.length} films, ${new Set(textes).size} textes différents`);

{
  const d = { commerce: "Chez Bergine", prenom: "Jean-Marie", plat: "Magret", prix: "19 €", faits: ["maison"] };
  const r = tirerRecit("table", d, { graine: 7 });
  const triche = recitDepuisIds("table", { ...d, faits: [] }, r.ids);
  ok(triche === null, "un fait qu'il n'a pas coché ne se dit pas, même si on le demande au serveur");
  const autre = tirerRecit("table", d, { graine: 8 });
  ok(autre.texte !== r.texte, "« 🎲 Une autre version » change le texte");
  const sansPrenom = tirerRecit("table", { ...d, prenom: "" }, { graine: 3 });
  ok(!/\{prenom\}|Jean-Marie/.test(sansPrenom.texte), "sans prénom, aucune phrase qui en demande un");
  ok(/fait maison|Fait maison|du fait maison/.test(r.texte), "sa case « Fait maison » est dite", r.texte);
}
{
  const r = tirerRecit("table", { commerce: "Chez Bergine", plat: "Magret", prix: "19", faits: [] }, { graine: 11 });
  ok(/19\u00a0€/.test(r.texte) && r.morceaux.some((x) => x.role === "regard"), "« 19 » devient « 19 € » ; sans case, le reporter regarde les photos", r.texte);
}

console.log("\nQuelques récits :");
for (const t of textes.filter((_, k) => k % 260 === 0)) console.log(`  · ${t}`);
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
