// 🎯 LES JEUX DU SALON : « JE TE METS AU DÉFI », PAR LA ROUTE (26 novembre 2026 ; `lib/direct/jeux-salon.ts`,
// `jeux-salon-serveur.ts`, `docs/univers/decouvrir.md` section 41) — contre le faux Supabase (jamais la vraie base).
//
// Léa, Sam, Tom et Zoé sont au salon du manga. Ce qui ne part pas : se défier soi-même, quelqu'un qui n'est pas là, un
// délai qui n'est pas un choix, une vidéo qui se termine, un lien. Sam défie Léa : elle répond d'abord, sa réponse reste
// cachée ; Tom et Zoé tentent leur chance. Le moment de vérité : ceux qui regardent tranchent (pas Sam). Léa a trouvé,
// Zoé aussi : +10, +5, comptés une fois ; chacun son total, chez soi. Pas deux défis à la même personne dans l'heure ;
// « pas maintenant » ; des points pour trois défis par jour. Jamais un compte, jamais le mot « exemple ».
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${F.replace("/rest/v1", "")}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `6d6d6d6d-0000-4000-8000-0000006d10${String(n).padStart(2, "0")}`, jeton: `jeton-defi-salon-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const ZOE = qui(4, "Zoé");
const INES = qui(5, "Inès");
const GENS = [LEA, SAM, TOM, ZOE, INES];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
}
await poserPiece(deposer, "salon", { le: maintenant });

const ROUTE = "/api/direct/salons-ouverts";
const tous = [];
const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  const j = { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
  tous.push(j);
  return j;
};
const entrer = (x, theme = "manga") => appel(x, ROUTE, { action: "entrer", theme });
const pouls = async (x, salon) => (await appel(x, `${ROUTE}?salon=${encodeURIComponent(salon)}&depuis=${Date.now()}&connus=`)).pouls;
const V1 = "DDDDDDDDDDD";
const V2 = "EEEEEEEEEEE";
const V3 = "FFFFFFFFFFF";


// ═══ LÉA, SAM, TOM ET ZOÉ AU SALON DU MANGA ═══
const oL = (await entrer(LEA)).ouverture;
const salon = oL?.salon?.id;
const qLea = oL?.moi;
const qSam = (await entrer(SAM)).ouverture?.moi;
const qTom = (await entrer(TOM)).ouverture?.moi;
const qZoe = (await entrer(ZOE)).ouverture?.moi;
ok(Boolean(salon && qLea && qSam && qTom && qZoe), `Léa, Sam, Tom et Zoé sont au salon du manga (${salon})`);
const chemin = `decouvrir/salons/adultes/${salon}/jeu.json`;
const avancer = async (o) => json(chemin, { ...(await lire(chemin)), ...o });

// ═══ CE QUI NE PART PAS ═══
const defier = (x, a, o = {}) => appel(x, ROUTE, { action: "jeu", salon, sorte: "defi", a, texte: "Il va réussir son saut ?", video: V1, quand: 30, reste: 200, ...o });
ok((await defier(SAM, qSam)).statut === 400, "se défier soi-même : non");
const qInes = (await entrer(INES, "musique")).ouverture?.moi;
ok((await defier(SAM, qInes)).statut === 409, "défier quelqu'un qui n'est pas là : non");
ok((await defier(SAM, qLea, { quand: 45 })).statut === 400, "« on le saura » dans 45 s : ce n'est pas un choix");
ok((await defier(SAM, qLea, { quand: "fin", reste: 10 })).statut === 400, "à la fin d'une vidéo qui se termine dans 10 s : trop tard");
ok((await defier(SAM, qLea, { quand: 30, reste: 20 })).statut === 400, "dans 30 s, alors qu'il en reste 20 : trop tard");
const lien = await defier(SAM, qLea, { texte: "va sur www.truc.com" });
ok(lien.statut === 400 && Boolean(lien.refus), "une question avec un lien : relue, refusée");

// ═══ SAM DÉFIE LÉA ═══
const d1 = await defier(SAM, qLea);
const jeu = d1.jeu;
ok(d1.statut === 200 && jeu?.sorte === "defi" && jeu.a === qLea && jeu.aPrenom === "Léa" && jeu.prenom === "Sam", "Sam défie Léa : « Il va réussir son saut ? »");
ok(Math.abs(jeu.fin - jeu.debut - 30_000) < 50 && jeu.finVerite - jeu.fin === 30_000, "… on le saura dans 30 s ; le moment de vérité dure 30 s");
const voter = (x, v) => appel(x, ROUTE, { action: "voter", salon, jeu: jeu.id, v });
const temoigner = (x, v) => appel(x, ROUTE, { action: "temoigner", salon, jeu: jeu.id, v });
ok((await voter(TOM, "non")).statut === 409, "Tom attend : Léa répond d'abord");
ok((await voter(SAM, "non")).statut === 400, "Sam, qui a lancé le défi, ne répond pas");
ok((await voter(LEA, "oui")).statut === 200, "Léa répond « oui »");
const pL = (await pouls(LEA, salon))?.jeu;
ok(pL?.votes?.[qLea] === "oui", "… chez elle, sa réponse");
const pT = (await pouls(TOM, salon))?.jeu;
ok(pT && Object.keys(pT.votes).length === 0 && pT.repondu?.includes(qLea), "… chez Tom : « Léa a répondu », sa réponse cachée");
ok((await voter(TOM, "non")).statut === 200 && (await voter(ZOE, "oui")).statut === 200, "Tom tente « non », Zoé « oui »");
const pT2 = (await pouls(TOM, salon))?.jeu;
ok(JSON.stringify(pT2?.votes) === JSON.stringify({ [qTom]: "non" }), "… chacun ne voit que la sienne");
ok((await temoigner(TOM, "oui")).statut === 409, "pas encore le moment de vérité");

// ═══ LE MOMENT DE VÉRITÉ ═══
await avancer({ fin: Date.now() - 1000, finVerite: Date.now() + 29_000 });
ok((await voter(ZOE, "non")).statut === 409, "la vidéo a répondu : plus de réponse");
const pV = (await pouls(SAM, salon))?.jeu;
ok(pV?.id === jeu.id && Object.keys(pV.votes).length === 0 && !pV.verdict, "Sam : le moment de vérité, les réponses toujours cachées");
ok((await temoigner(TOM, "oui")).statut === 200 && (await temoigner(ZOE, "oui")).statut === 200, "Tom et Zoé ont vu : il a réussi");
ok((await temoigner(SAM, "non")).statut === 200, "Sam dit « non » (il voudrait gagner)");
const pV2 = (await pouls(SAM, salon))?.jeu;
ok(pV2?.temoins?.[qSam] === "non" && pV2.temoins[qTom] === true, "… chacun voit ce qu'il a dit, et qui a répondu");

// ═══ LE RÉSULTAT ═══
await avancer({ finVerite: Date.now() - 1000 });
const pR = (await pouls(LEA, salon))?.jeu;
ok(pR?.verdict === "oui", "ceux qui regardent ont tranché : réussi (Sam, joueur, ne compte pas)");
ok(pR?.votes?.[qLea] === "oui" && pR.votes[qTom] === "non" && pR.votes[qZoe] === "oui", "… toutes les réponses se montrent");
ok(JSON.stringify(pR?.points) === JSON.stringify({ [qLea]: 10, [qZoe]: 5 }) || (pR?.points?.[qLea] === 10 && pR.points[qZoe] === 5 && Object.keys(pR.points).length === 2), `Léa a trouvé : +10 ; Zoé aussi : +5 ; Tom et Sam : rien (${JSON.stringify(pR?.points)})`);
const pR2 = (await pouls(TOM, salon))?.jeu;
ok(pR2?.points?.[qLea] === 10 && Object.keys(pR2.points).length === 2, "… compté une fois, le même chez tous");
const total = async (x) => (await appel(x, `${ROUTE}?mes-defis=1`)).points;
ok((await total(LEA)) === 10 && (await total(ZOE)) === 5 && (await total(SAM)) === 0, "chacun son total, chez soi : Léa 10, Zoé 5, Sam 0");
await avancer({ fin: Date.now() - 60_000, finVerite: Date.now() - 50_000 });

// ═══ PAS DEUX FOIS LA MÊME PERSONNE DANS L'HEURE ; « PAS MAINTENANT » ═══
ok((await defier(SAM, qLea, { video: V2 })).statut === 409, "Sam ne redéfie pas Léa dans l'heure");
const d2 = await defier(TOM, qZoe, { video: V2, quand: "fin", reste: 120 });
ok(d2.statut === 200 && Math.abs(d2.jeu.fin - d2.jeu.debut - 120_000) < 50, "Tom défie Zoé : on le saura à la fin de la vidéo (dans 2 min)");
ok((await appel(LEA, ROUTE, { action: "pas-maintenant-defi", salon, jeu: d2.jeu.id })).statut === 409, "Léa ne peut pas dire « pas maintenant » à la place de Zoé");
ok((await appel(ZOE, ROUTE, { action: "pas-maintenant-defi", salon, jeu: d2.jeu.id })).statut === 200, "Zoé : « pas maintenant »");
const pP = (await pouls(TOM, salon))?.jeu;
ok(pP?.pasMaintenant === true && !pP.verdict && Object.keys(pP.points ?? {}).length === 0, "… le défi s'arrête, sans points pour personne");
await avancer({ fin: Date.now() - 60_000, finVerite: Date.now() - 50_000 });

// ═══ DES POINTS POUR TROIS DÉFIS PAR JOUR ═══
const jour = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
for (const k of [1, 2, 3]) await json(`${LEA.id}/defis/170000000000${k}-aaaaa${k}.json`, { points: 5, jour, le: Date.now() });
const d3 = await defier(ZOE, qLea, { video: V3 });
ok(d3.statut === 200, "Zoé défie Léa");
await appel(LEA, ROUTE, { action: "voter", salon, jeu: d3.jeu.id, v: "non" });
await avancer({ fin: Date.now() - 1000, finVerite: Date.now() + 29_000 });
await appel(TOM, ROUTE, { action: "temoigner", salon, jeu: d3.jeu.id, v: "non" });
await avancer({ finVerite: Date.now() - 1000 });
const pC = (await pouls(TOM, salon))?.jeu;
ok(pC?.verdict === "non" && !pC.points?.[qLea], "Léa trouve encore, mais c'est son quatrième défi du jour : pas de points");
ok((await total(LEA)) === 25, "… son total ne bouge pas (10 + 3 × 5)");

// ═══ JAMAIS UN COMPTE, JAMAIS « EXEMPLE » ═══
const tout = JSON.stringify(tous);
ok(!GENS.some((x) => tout.includes(x.id)), "jamais un compte dans ce qu'on renvoie");
ok(!/exemple/i.test(tout), "jamais le mot « exemple »");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
