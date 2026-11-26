// 🙋 LES JEUX DU SALON : « QUI EST D'ACCORD ? », PAR LA ROUTE (26 novembre 2026 ; `lib/direct/jeux-salon.ts`,
// `jeux-salon-serveur.ts`, `docs/univers/decouvrir.md` section 41) — contre le faux Supabase (jamais la vraie base).
//
// Léa, Sam et Tom sont dans le salon du manga ; Inès n'y est pas. Ce qui ne part pas : sans vidéo, un lien dans la
// phrase, Inès qui n'est pas là. Léa lance « C'est truqué » ; Sam ne peut pas en lancer un autre en même temps. Le pouls
// le porte à tous ; ils votent (Léa aussi), Tom change d'avis ; un vote qui n'en est pas un : refusé. Tom ne veut plus
// voir Léa : son jeu disparaît chez lui. Le vote ferme : plus de vote ; le résultat reste un moment, puis plus rien. Léa
// ne relance pas sur la même vidéo ; sur une autre, si. Jamais un compte, jamais le mot « exemple ».
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

const qui = (n, prenom) => ({ id: `6b6b6b6b-0000-4000-8000-0000006a10${String(n).padStart(2, "0")}`, jeton: `jeton-jeux-salon-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const INES = qui(4, "Inès");
const GENS = [LEA, SAM, TOM, INES];
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

// ═══ LÉA, SAM ET TOM AU SALON DU MANGA ═══
const oL = (await entrer(LEA)).ouverture;
const salon = oL?.salon?.id;
ok(Boolean(salon), `Léa entre dans le salon du manga (${salon})`);
const qLea = oL.moi;
const qSam = (await entrer(SAM)).ouverture?.moi;
const qTom = (await entrer(TOM)).ouverture?.moi;
ok(Boolean(qSam && qTom), "Sam et Tom la rejoignent");
ok((await pouls(SAM, salon))?.jeu === null, "pas de jeu en cours");

// ═══ CE QUI NE PART PAS ═══
const lancer = (x, texte, video = V1, sorte = "accord") => appel(x, ROUTE, { action: "jeu", salon, sorte, texte, video });
ok((await lancer(LEA, "C'est truqué", "")).statut === 400, "sans vidéo à la télé : refusé");
ok((await lancer(LEA, "C'est truqué", V1, "autre")).statut === 400, "un jeu qui n'existe pas : refusé");
const lien = await lancer(LEA, "va voir www.truc.com");
ok(lien.statut === 400 && Boolean(lien.refus), `un lien dans la phrase : relu, refusé (${lien.refus})`);
ok((await lancer(LEA, "")).statut === 400, "une phrase vide : refusée");
ok((await lancer(INES, "C'est truqué")).statut >= 400, "Inès n'est pas dans ce salon : refusé");

// ═══ LÉA LANCE « C'EST TRUQUÉ » ═══
const j1 = await lancer(LEA, "C'est   truqué");
const jeu = j1.jeu;
ok(j1.statut === 200 && jeu?.sorte === "accord" && jeu.texte === "C'est truqué" && jeu.de === qLea && jeu.prenom === "Léa", "Léa lance « C'est truqué »");
ok(Math.abs(jeu.fin - jeu.debut - 30_000) < 50, "… on vote pendant 30 secondes");
ok((await lancer(SAM, "Je n'aurais jamais osé", V2)).statut === 409, "Sam ne peut pas en lancer un autre en même temps");
const p1 = await pouls(SAM, salon);
ok(p1?.jeu?.id === jeu.id && Object.keys(p1.jeu.votes).length === 0, "le pouls le porte chez Sam, sans vote encore");

// ═══ ILS VOTENT ═══
const voter = (x, v, id = jeu.id) => appel(x, ROUTE, { action: "voter", salon, jeu: id, v });
ok((await voter(SAM, "peut-être")).statut === 400, "un vote qui n'en est pas un : refusé");
ok((await voter(SAM, "oui", "1700000000000-abcdef")).statut === 409, "voter à un autre jeu : refusé");
ok((await voter(INES, "oui")).statut >= 400, "Inès, pas au salon, ne vote pas");
ok((await voter(SAM, "oui")).statut === 200, "Sam : 👍 d'accord");
ok((await voter(TOM, "non")).statut === 200, "Tom : 👎 pas d'accord");
ok((await voter(LEA, "oui")).statut === 200, "Léa vote aussi");
const p2 = await pouls(TOM, salon);
ok(p2?.jeu?.votes?.[qSam] === "oui" && p2.jeu.votes[qTom] === "non" && p2.jeu.votes[qLea] === "oui", "le pouls porte le vote de chacun");
ok((await voter(TOM, "oui")).statut === 200 && (await pouls(LEA, salon))?.jeu?.votes?.[qTom] === "oui", "Tom change d'avis");

// ═══ TOM NE VEUT PLUS VOIR LÉA ═══
await appel(TOM, ROUTE, { action: "ne-plus-voir", q: qLea });
ok((await pouls(TOM, salon))?.jeu === null, "Tom ne veut plus voir Léa : son jeu disparaît chez lui");
const pS = await pouls(SAM, salon);
ok(pS?.jeu?.id === jeu.id, "… toujours là chez Sam");
await appel(TOM, ROUTE, { action: "revoir", q: qLea });

// ═══ LE VOTE FERME, LE RÉSULTAT RESTE UN MOMENT ═══
const chemin = `decouvrir/salons/adultes/${salon}/jeu.json`;
const fiche = await lire(chemin);
ok(fiche?.id === jeu.id && fiche.video === V1, "rangé avec le salon");
await json(chemin, { ...fiche, fin: Date.now() - 2000 });
ok((await voter(SAM, "non")).statut === 409, "le vote a fermé : plus de vote");
const p3 = await pouls(SAM, salon);
ok(p3?.jeu?.id === jeu.id && p3.jeu.votes[qSam] === "oui", "… le résultat reste un moment");
ok((await lancer(SAM, "Je n'aurais jamais osé", V2)).statut === 409, "… pendant ce temps, pas d'autre jeu");
await json(chemin, { ...fiche, fin: Date.now() - 13_000 });
ok((await pouls(SAM, salon))?.jeu === null, "puis la carte s'en va");

// ═══ UN JEU PAR PERSONNE ET PAR VIDÉO ═══
ok((await lancer(LEA, "C'est truqué")).statut === 409, "Léa ne relance pas sur la même vidéo");
const j2 = await lancer(LEA, "Je n'aurais jamais osé", V2);
ok(j2.statut === 200 && j2.jeu?.id !== jeu.id, "… sur la suivante, si");

// ═══ JAMAIS UN COMPTE, JAMAIS « EXEMPLE » ═══
const tout = JSON.stringify(tous);
ok(!GENS.some((x) => tout.includes(x.id)), "jamais un compte dans ce qu'on renvoie");
ok(!/exemple/i.test(tout), "jamais le mot « exemple »");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
