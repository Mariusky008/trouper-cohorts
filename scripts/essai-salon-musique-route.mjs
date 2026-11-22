// 🎵 LE SALON MUSIQUE (`lib/direct/platine.ts`, `platine-serveur.ts`, `salons-ouverts-serveur.ts` ; le lot M1,
// `docs/univers/decouvrir.md` section 36), PAR LES ROUTES — contre le faux Supabase et le faux YouTube.
//
// Léa entre dans le salon de la musique : sa platine est vide, la radio du salon passe (la sélection du jour). Elle
// propose un lien YouTube : rien ne passe, il part tout de suite, pour tous. Sam propose le sien : il attend dans la file ;
// une deuxième fois : refusé (un seul par personne). Zoé propose ; le cœur de Léa la fait passer devant Sam ; on ne s'aime
// pas soi-même. Le morceau de Léa fini : celui de Zoé part, à la fin du précédent (« C'était le choix de Léa ») ; personne
// pendant longtemps : il part maintenant. Sam retire le sien ; celui de Zoé fini : la radio reprend. Un lien qui n'est pas
// YouTube, trop long, d'alcool : refusés ; un clip de la radio du jour : accepté ; la file pleine : refusé ; quelqu'un qui
// n'est pas dans le salon : refusé ; dans le salon du foot, ni platine ni 💃. Les 15-17 ans ont leur platine à eux.
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `6b6b6b6b-0000-4000-8000-0000006b10${String(n).padStart(2, "0")}`, jeton: `jeton-salon-musique-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const NOE = qui(4, "Noé");
const MAX = qui(5, "Max");
const GENS = [LEA, SAM, ZOE, NOE, MAX];
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
}
for (const x of [LEA, SAM, ZOE, MAX]) await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
await json(`${NOE.id}/majeur.json`, { age: 16, adulte: false, le: maintenant });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok((nuit.faites?.length ?? 0) > 0, "la nuit est passée (la sélection du jour : la radio du salon)");

const ROUTE = "/api/direct/salons-ouverts";
const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poster = (x, corps) => appel(x, ROUTE, corps);
const entrer = (x, theme = "musique") => poster(x, { action: "entrer", theme });
const pouls = (x, salon) => appel(x, `${ROUTE}?salon=${salon}&depuis=0&connus=`);
const proposer = (x, salon, corps) => poster(x, { action: "proposer-morceau", salon, ...corps });
const tous = [];
const garder = (r) => (tous.push(r), r);

// ═══ LÉA ENTRE : LA RADIO DU SALON ═══
const e1 = garder(await entrer(LEA));
const salon = e1.ouverture?.salon?.id;
ok(salon === "musique-1" && e1.ouverture.salon.theme === "musique", `Léa entre dans le salon de la musique (${salon})`);
ok(e1.ouverture?.tele?.platine && !e1.ouverture.tele.platine.enCours && e1.ouverture.tele.platine.file.length === 0, "sa platine : rien de proposé — la radio du salon passe");
const radio = e1.ouverture?.tele?.videos ?? [];
ok(radio.length > 0, `la radio : la sélection du jour (${radio.length} clips)`);
const CHEMIN = `decouvrir/salons/adultes/${salon}/platine.json`;

// ═══ ELLE PROPOSE : RIEN NE PASSE, IL PART TOUT DE SUITE ═══
const p1 = garder(await proposer(LEA, salon, { lien: "https://youtu.be/MorceauLeaA" }));
ok(p1.statut === 200 && p1.part === true && p1.platine?.enCours?.video?.id === "MorceauLeaA" && p1.platine.enCours.mien === true, "Léa propose un lien : rien ne passait, il part tout de suite (pour tous)");
ok(p1.platine?.enCours?.video?.duree === 150 && /Vidéo d’essai/.test(p1.titre ?? ""), `… sa fiche YouTube : son titre, sa durée (${p1.titre})`);
const ecrite = await lire(CHEMIN);
ok(ecrite?.enCours?.q === qui8(LEA.id) && ecrite.enCours.depart > 0 && ecrite.file.length === 0, "écrite sur le salon : le morceau qui passe, son départ");

// ═══ SAM : DANS LA FILE, UN SEUL À LA FOIS ═══
garder(await entrer(SAM));
const p2 = garder(await proposer(SAM, salon, { lien: "https://www.youtube.com/watch?v=MorceauSamB" }));
ok(p2.statut === 200 && !p2.part && p2.platine?.file?.length === 1 && p2.platine.file[0].mien && p2.platine.maPlace === 1, "Sam propose : il attend dans la file (« passe juste après »)");
const p2b = garder(await proposer(SAM, salon, { lien: "https://youtu.be/MorceauSamC" }));
ok(p2b.statut === 409 && /déjà dans la file/.test(p2b.error ?? ""), "une deuxième fois : refusé (un seul morceau à la fois par personne)");
const vuSam = garder(await pouls(SAM, salon));
ok(vuSam.pouls?.platine?.enCours?.prenom === "Léa" && !vuSam.pouls.platine.enCours.mien, "le pouls de Sam : « le choix de Léa » passe");

// ═══ ZOÉ, ET LES CŒURS ═══
garder(await entrer(ZOE));
const p3 = garder(await proposer(ZOE, salon, { lien: "https://youtu.be/MorceauZoeD" }));
ok(p3.statut === 200 && p3.platine?.file?.map((m) => m.prenom).join() === "Sam,Zoé", "Zoé propose : derrière Sam (le plus ancien d'abord)");
const c1 = garder(await poster(LEA, { action: "coeur-morceau", salon, q: qui8(ZOE.id) }));
ok(c1.statut === 200 && c1.platine?.file?.map((m) => m.prenom).join() === "Zoé,Sam" && c1.platine.file[0].coeurs === 1 && c1.platine.file[0].aime === true, "le ❤️ de Léa : Zoé passe devant Sam");
const c2 = garder(await poster(ZOE, { action: "coeur-morceau", salon, q: qui8(ZOE.id) }));
ok(c2.statut === 400, "on ne fait pas monter son propre morceau");
const vuSam2 = garder(await pouls(SAM, salon));
ok(vuSam2.pouls?.platine?.maPlace === 2, "Sam le voit : son morceau est 2ᵉ");

// ═══ LE MORCEAU DE LÉA FINI : CELUI DE ZOÉ PART, À LA FIN DU PRÉCÉDENT ═══
const avant = await lire(CHEMIN);
const finie = Date.now() - 2_000;
await json(CHEMIN, { ...avant, enCours: { ...avant.enCours, depart: finie - 150_000 } });
const v1 = garder(await pouls(SAM, salon));
const pl1 = v1.pouls?.platine;
ok(pl1?.enCours?.prenom === "Zoé" && pl1.file.length === 1 && pl1.file[0].prenom === "Sam", "fini : le morceau de Zoé part, Sam attend toujours");
ok(Math.abs((pl1?.enCours?.depart ?? 0) - finie) < 50, "… parti à la fin du précédent (la même seconde pour tous)");
ok(pl1?.dernier?.prenom === "Léa" && pl1.n > avant.n, "… « C'était le choix de Léa »");
const v1b = garder(await pouls(ZOE, salon));
ok(v1b.pouls?.platine?.enCours?.depart === pl1?.enCours?.depart && v1b.pouls.platine.enCours.mien, "Zoé voit le même départ : c'est son choix");

// ═══ PERSONNE PENDANT LONGTEMPS : IL PART MAINTENANT ═══
const avant2 = await lire(CHEMIN);
await json(CHEMIN, { ...avant2, enCours: { ...avant2.enCours, depart: Date.now() - 3600_000 } });
const t0 = Date.now();
const v2 = garder(await pouls(LEA, salon));
ok(v2.pouls?.platine?.enCours?.prenom === "Sam" && v2.pouls.platine.enCours.depart >= t0 - 100 && v2.pouls.platine.file.length === 0, "fini depuis une heure : le morceau de Sam part maintenant (pas dans le passé)");

// ═══ RETIRER, PUIS LA RADIO REPREND ═══
garder(await proposer(ZOE, salon, { lien: "https://youtu.be/MorceauZoeE" }));
const r1 = garder(await poster(ZOE, { action: "retirer-morceau", salon }));
ok(r1.statut === 200 && r1.platine?.file?.length === 0, "Zoé retire le sien de la file");
const avant3 = await lire(CHEMIN);
await json(CHEMIN, { ...avant3, enCours: { ...avant3.enCours, depart: Date.now() - 200_000 } });
const v3 = garder(await pouls(LEA, salon));
ok(v3.pouls?.platine && !v3.pouls.platine.enCours && v3.pouls.platine.file.length === 0 && v3.pouls.platine.dernier?.prenom === "Sam", "le morceau de Sam fini, la file vide : la radio du salon reprend");

// ═══ CE QUI NE PASSE PAS ═══
ok((await proposer(LEA, salon, { lien: "https://example.com/une-chanson" })).statut === 400, "un lien qui n'est pas YouTube : refusé");
const long = garder(await proposer(LEA, salon, { lien: "https://youtu.be/TropLong04x" }));
ok(long.statut === 400 && /15 minutes/.test(long.error ?? ""), "45 minutes : refusé (de 30 secondes à 15 minutes)");
const biere = garder(await proposer(LEA, salon, { lien: "https://youtu.be/Biere00003Z" }));
ok(biere.statut === 400 && /ne peut pas passer ici/.test(biere.error ?? ""), "un titre d'alcool : refusé");
const deLaRadio = garder(await proposer(LEA, salon, { id: radio[0]?.id }));
ok(deLaRadio.statut === 200 && deLaRadio.part === true && deLaRadio.platine?.enCours?.video?.id === radio[0]?.id, "un clip de la radio du jour : accepté, il part");
ok((await proposer(LEA, salon, { id: "PasDeLaRadio" })).statut === 400, "un clip qui n'est pas de la radio du jour : refusé");
const plein = await lire(CHEMIN);
await json(CHEMIN, { ...plein, file: Array.from({ length: 10 }, (_, k) => ({ video: { id: `Rempli0000${k}`, titre: `Morceau ${k}`, chaine: "", duree: 150 }, q: `0000000${k}`, prenom: "Quelqu’un", le: Date.now() - k, coeurs: [] })) });
const pleine = garder(await proposer(SAM, salon, { lien: "https://youtu.be/MorceauSamF" }));
ok(pleine.statut === 409 && /pleine/.test(pleine.error ?? ""), "la file pleine (dix) : refusé");
ok((await proposer(MAX, salon, { lien: "https://youtu.be/MorceauMaxG" })).statut === 409, "Max n'est pas dans le salon : refusé");

// ═══ 💃 RÉAGIR EN MUSIQUE ; LE SALON DU FOOT N'A PAS DE PLATINE ═══
ok((await poster(LEA, { action: "ecrire", salon, sorte: "reaction", cle: "danse" })).statut === 200, "💃 dans le salon de la musique : sa figurine danse");
const foot = garder(await entrer(LEA, "foot"));
ok(foot.ouverture?.salon?.theme === "foot" && !foot.ouverture.tele.platine, "le salon du foot : pas de platine");
ok((await proposer(LEA, foot.ouverture.salon.id, { lien: "https://youtu.be/MorceauLeaH" })).statut === 400, "… ni de morceau à proposer");
ok((await poster(LEA, { action: "ecrire", salon: foot.ouverture.salon.id, sorte: "reaction", cle: "danse" })).statut === 400, "… ni de 💃");

// ═══ LES 15-17 ANS : LEUR PLATINE À EUX ═══
const jeune = garder(await entrer(NOE));
ok(jeune.ouverture?.salon?.maison === "jeunes" && jeune.ouverture.tele.platine && !jeune.ouverture.tele.platine.enCours && jeune.ouverture.tele.platine.file.length === 0, "Noé (16 ans) : le salon de la musique des jeunes, sa platine à lui (rien des adultes)");

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nle salon musique tient ✓");
process.exit(echecs ? 1 : 0);
