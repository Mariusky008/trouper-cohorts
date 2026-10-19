// ✂️ SA VRAIE VOIX, RESSERRÉE — où le montage coupe, vérifié sans téléphone.
//
// « Le montage couperait automatiquement les "euh", les silences de plus d'une
// demi-seconde et les débuts de phrase ratés. » Ce qui se vérifie ici (voir
// `interview-resserrer.ts`) :
//   · un « euh » part, avec ce qui l'entoure jusqu'aux mots voisins ;
//   · un silence de plus d'une demi-seconde est ramené à un quart de seconde,
//     un silence plus court reste ;
//   · un début raté (« le… le magret », « je fais, je fais ») perd sa première
//     fois ; « très très » et « non non » restent ;
//   · un mot que la transcription a étiré sur un silence est ramené à sa voix ;
//   · filmé, jamais un morceau gardé de moins de 0,7 s entre deux coupes ;
//   · plus de la moitié de la réponse à retirer : on ne coupe rien ;
//   · le texte et les instants se marient, ponctuation comprise.
//
//   node scripts/verifier-resserrer-interview.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/interview-resserrer.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const m = { exports: {} };
new Function("exports", "module", "require", js)(m.exports, m, () => ({}));
const { alignerMots, resserrerLaReponse, sousTitresDesMots, resumeDesCoupes, estUnEuh } = m.exports;

let echecs = 0;
const ok = (cond, quoi, detail = "") => {
  if (!cond) {
    echecs += 1;
    console.log(`✗ ${quoi}${detail ? ` — ${detail}` : ""}`);
  } else console.log(`✓ ${quoi}`);
};
const proche = (x, y, e = 0.011) => Math.abs(x - y) <= e;
/** Des mots à la suite : [mot, début, fin]. */
const W = (...l) => l.map(([m, a, b]) => ({ m, a, b }));
const R = (mots, o = {}) => resserrerLaReponse({ mots, debut: o.debut ?? 0, fin: o.fin ?? 20, filme: o.filme ?? false, rms: o.rms, pas: 0.05 });
const textes = (l) => l.map((w) => w.m).join(" ");

// ── les « euh » ──
ok(["euh", "Euh,", "heu", "hum", "Mmh…", "euhm"].every(estUnEuh), "les hésitations sont reconnues");
ok(!["ben", "bon", "alors", "eux", "heure"].some(estUnEuh), "« ben », « bon », « alors », « eux », « heure » ne sont pas des euh");
{
  const r = R(W(["Le", 1.0, 1.2], ["magret,", 1.25, 1.7], ["euh,", 1.9, 2.4], ["je", 2.6, 2.7], ["le", 2.75, 2.85], ["cuis", 2.9, 3.2]));
  ok(r.coupes.length === 1 && r.coupes[0].pourquoi === "euh", "un « euh » au milieu : une coupe", JSON.stringify(r.coupes));
  ok(proche(r.coupes[0].de, 1.79) && proche(r.coupes[0].a, 2.51), "…du mot d'avant (+0,09) au mot d'après (−0,09)", JSON.stringify(r.coupes[0]));
  ok(textes(r.gardes) === "Le magret, je le cuis", "…et il disparaît des sous-titres", textes(r.gardes));
}
{
  const r = R(W(["Euh…", 0.5, 1.1], ["alors", 1.3, 1.6], ["voilà", 1.65, 2.0]));
  ok(r.coupes.length === 1 && proche(r.coupes[0].de, 0.45) && proche(r.coupes[0].a, 1.2), "un « euh » avant son premier mot", JSON.stringify(r.coupes));
}

// ── les silences ──
{
  const r = R(W(["C'est", 1.0, 1.3], ["prêt.", 1.35, 1.7], ["Venez", 2.9, 3.2], ["goûter", 3.25, 3.6]));
  ok(r.coupes.length === 1 && r.coupes[0].pourquoi === "silence", "un silence de 1,2 s : coupé", JSON.stringify(r.coupes));
  ok(proche(r.coupes[0].de, 1.82) && proche(r.coupes[0].a, 2.77), "…ramené à un quart de seconde", JSON.stringify(r.coupes[0]));
}
{
  const r = R(W(["C'est", 1.0, 1.3], ["prêt.", 1.35, 1.7], ["Venez", 2.1, 2.4], ["goûter", 2.45, 2.8]));
  ok(r.coupes.length === 0, "un silence de 0,4 s : gardé", JSON.stringify(r.coupes));
}

// ── les débuts ratés ──
{
  const r = R(W(["Le", 1.0, 1.15], ["le", 1.5, 1.65], ["magret", 1.7, 2.1], ["est", 2.15, 2.3], ["doré", 2.35, 2.8]));
  ok(r.coupes.length === 1 && r.coupes[0].pourquoi === "reprise", "« le… le magret » : une reprise", JSON.stringify(r.coupes));
  ok(textes(r.gardes) === "le magret est doré", "…la première fois part", textes(r.gardes));
  ok(proche(r.coupes[0].de, 0.95) && proche(r.coupes[0].a, 1.4), "…de son début jusqu'au mot repris", JSON.stringify(r.coupes[0]));
}
{
  const r = R(W(["Je", 1.0, 1.1], ["fais,", 1.15, 1.4], ["je", 1.6, 1.7], ["fais", 1.75, 1.95], ["mon", 2.0, 2.1], ["magret", 2.15, 2.5]));
  ok(textes(r.gardes) === "je fais mon magret" && r.coupes.length === 1, "« je fais, je fais mon magret » : deux mots repris", `${textes(r.gardes)} ${JSON.stringify(r.coupes)}`);
}
{
  const r = R(W(["C'est", 1.0, 1.2], ["très", 1.25, 1.45], ["très", 1.5, 1.7], ["bon,", 1.75, 2.0], ["non", 2.05, 2.2], ["non", 2.25, 2.4]));
  ok(r.coupes.length === 0 && r.gardes.length === 6, "« très très », « non non » : gardés", JSON.stringify(r.coupes));
}
{
  const r = R(W(["Venez.", 1.0, 1.4], ["Venez", 3.0, 3.4], ["goûter.", 3.45, 3.9]));
  ok(r.gardes.length === 3 && r.coupes.every((c) => c.pourquoi === "silence"), "un doublon après un long silence est une nouvelle phrase", JSON.stringify(r));
}

// ── un mot étiré sur un silence ──
{
  const pas = 0.05;
  const rms = new Float32Array(100).fill(0.002);
  for (let i = 20; i < 40; i++) rms[i] = 0.08; // il parle de 1,0 à 2,0 s
  for (let i = 70; i < 90; i++) rms[i] = 0.08; // puis de 3,5 à 4,5 s
  const r = R(W(["Le", 1.0, 1.3], ["magret.", 1.35, 3.45], ["Venez", 3.5, 4.0], ["goûter", 4.05, 4.5]), { rms, fin: 5 });
  ok(r.coupes.length === 1 && r.coupes[0].pourquoi === "silence" && proche(r.coupes[0].de, 2.2, 0.03), "« magret » étiré jusqu'à 3,45 s : ramené à sa voix, le silence est coupé", JSON.stringify(r.coupes));
  void pas;
}

// ── filmé : pas de morceau gardé trop court ──
{
  const mots = W(["Un", 1.0, 1.2], ["deux", 2.0, 2.2], ["trois", 3.0, 3.2]);
  const voix = R(mots, { filme: false });
  const film = R(mots, { filme: true });
  ok(voix.coupes.length === 2, "sa voix seule : deux silences coupés", JSON.stringify(voix.coupes));
  const courts = film.coupes.slice(1).filter((c, k) => c.de - film.coupes[k].a < 0.7);
  ok(film.coupes.length === 1 && !courts.length, "filmé : la plus petite coupe tombe, aucun morceau de moins de 0,7 s", JSON.stringify(film.coupes));
}

// ── plus de la moitié : rien ──
{
  const r = R(W(["Oui.", 1.0, 1.2], ["Bon.", 4.0, 4.2]), { debut: 0.9, fin: 4.5 });
  ok(r.coupes.length === 0, "plus de la moitié de la réponse à retirer : on ne coupe rien", JSON.stringify(r.coupes));
}
{
  const r = R(W(["Oui", 1.0, 1.2], ["euh", 1.4, 1.8]), { debut: 0.9, fin: 2.6 });
  ok(r.coupes.length === 1 && proche(r.coupes[0].de, 1.55) && proche(r.coupes[0].a, 2.25), "un « euh » après son dernier mot : la fin garde sept dixièmes de souffle", JSON.stringify(r.coupes));
}

// ── le texte et les instants ──
{
  const a = alignerMots("Bonjour ! Le magret , c’est 19 euros .", W(["Bonjour", 0.5, 0.9], ["Le", 1.0, 1.1], ["magret", 1.15, 1.5], ["c'est", 1.6, 1.8], ["19", 1.85, 2.1], ["euros", 2.15, 2.5]));
  ok(a.length === 6 && a[0].m === "Bonjour\u202F!" && a[2].m === "magret," && a[5].m === "euros.", "la ponctuation seule se colle au mot d'avant", a.map((w) => w.m).join("|"));
  ok(a[3].a === 1.6 && a[5].b === 2.5, "…chaque mot garde son instant");
}
{
  const a = alignerMots("Le magret maison, à 19 euros.", W(["Le", 0.5, 0.6], ["magret", 0.65, 1.0], ["à", 1.5, 1.55], ["19", 1.6, 1.8], ["euros", 1.85, 2.2]));
  ok(a.length === 6 && a[2].m === "maison," && a[2].a === 1.0 && a[2].b === 1.5, "un mot sans instant prend le temps entre ses voisins", JSON.stringify(a[2]));
}

// ── les sous-titres ──
{
  const mots = alignerMots(
    "Aujourd'hui, c'est le manteau long camel. Laine et cachemire, il tombe jusqu'aux chevilles.",
    W(["Aujourd'hui", 9.4, 9.9], ["c'est", 9.95, 10.1], ["le", 10.15, 10.25], ["manteau", 10.3, 10.7], ["long", 10.75, 11.0], ["camel", 11.05, 11.5], ["Laine", 11.9, 12.2], ["et", 12.25, 12.35], ["cachemire", 12.4, 12.9], ["il", 13.0, 13.1], ["tombe", 13.15, 13.5], ["jusqu'aux", 13.55, 13.95], ["chevilles", 14.0, 14.5]),
  );
  const st = sousTitresDesMots(mots);
  ok(st[0].texte === "Aujourd'hui, c'est le manteau long camel." && st[0].debut === 9.4 && st[0].fin === 11.5 && st.every((s) => s.texte.length <= 46), "les sous-titres suivent ses phrases et leurs instants, deux lignes au plus", JSON.stringify(st.map((s) => [s.texte, s.debut, s.fin])));
  ok(st.every((s) => s.mots && s.mots.length), "…et portent leurs mots");
}
ok(resumeDesCoupes([{ de: 1, a: 1.5, pourquoi: "euh" }, { de: 3, a: 4, pourquoi: "silence" }, { de: 5, a: 6.2, pourquoi: "silence" }]) === "1 euh, 2 silences · −2,7 s", "le résumé de l'écran d'essai");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
