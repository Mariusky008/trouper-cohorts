// 📚 L'ÉTAGÈRE (lot E1), PAR LES ROUTES — contre le faux Supabase et le faux modèle, jamais la vraie base
// (`lib/direct/etagere.ts`, `etagere-serveur.ts`, `GET /api/direct/proches?vivant=`, `/api/direct/etagere`).
//
// Léa et Sam sont proches. Il y a quelques minutes, Léa : « Jeudi prochain je passe le permis, je stresse trop » ; Sam
// lui a répondu. La conversation se relit chez Sam : leurs figurines lisent l'échange (après la réponse) et notent le
// permis — chez Sam « Le permis de Léa », chez Léa « Ton permis », le jeudi qui suit ; nouveau pour les deux ; Sam l'a
// vu se poser, Léa pas encore. Relire ne note rien de plus. La page de l'étagère : le rayon « À venir ». Changer la date
// (pas une date passée). Léa le retire : parti pour les deux, et jamais renoté (même si les figurines relisent tout).
// Puis ce qui ne se note pas : un sujet sensible (Inès est malade), « Ma figurine parle pour moi » coupé (Eva), une
// citation inventée, de l'alcool, un jour de la semaine qui ne colle pas, un prénom dans le titre (Nico) ; la pause
// (Sam ne peut pas la relancer à la place de Léa) ; un message signalé après coup (les pivoines de Paul s'en vont) ;
// un proche retiré (l'étagère s'efface). Sans session : 401 ; pas proches : 403. Le frein (`CLIKME_ETAGERE=0`, une
// seconde app) : rien d'affiché, rien de noté.
//
// 📌 (lot E5) « Je le range ? » : le permis se range « proposé » — une question à Léa seule (Sam ne voit rien, et ne
// peut pas répondre à sa place : 403) ; la scène la joue une fois par jour ; son « oui » le range. Ses pivoines :
// « non », plus jamais proposées. Le resto (Zoé) : une question aux deux, le premier « oui » le range. Une date
// corrigée sur une question la range (Nico). 48 heures sans réponse : rien n'est rangé. Le réglage « Ma figurine
// range sans me demander » (Paul) : ses pivoines se rangent tout de suite. La mesure.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-etagere-route.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import { lancerSecondeApp } from "./seconde-app.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e10${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e1-route-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const INES = qui(3, "Inès");
const EVA = qui(4, "Eva");
const NICO = qui(5, "Nico");
const PAUL = qui(6, "Paul");
const ZOE = qui(7, "Zoé");
const MAX = qui(8, "Max");
const GENS = [LEA, SAM, INES, EVA, NICO, PAUL, ZOE, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
// (Léa est proche de tous ; Max a ajouté Léa, pas l'inverse)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, INES.id, EVA.id, NICO.id, PAUL.id, ZOE.id] });
for (const x of [SAM, INES, EVA, NICO, PAUL, ZOE, MAX]) await json(`${x.id}/proches.json`, { ids: [LEA.id] });
await json(`${EVA.id}/reglages.json`, { rituel: false });

const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rang = 0;
/** Un message déjà envoyé, il y a quelques minutes. */
async function message(de, a, texte, ilYaMin) {
  const pair = paire(de, a);
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `et${String(++rang).padStart(10, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
  return id;
}
const voir = async (q, chemin) => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const agir = async (q, corps, base = BASE) => {
  const r = await fetch(`${base}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const vivant = async (q, avec, base = BASE) => {
  const r = await fetch(`${base}/api/direct/proches?vivant=${avec.cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return (await r.json().catch(() => ({}))).vivant;
};
/** Leurs figurines lisent l'échange (la conversation se relit), puis on attend que le passage soit fini. */
async function lireEchange(q, avec, base = BASE) {
  const avant = (await lire(`fils/${paire(q, avec)}/etagere.json`))?.lu ?? 0;
  await vivant(q, avec, base);
  for (let k = 0; k < 40; k++) {
    await attendre(300);
    const f = await lire(`fils/${paire(q, avec)}/etagere.json`);
    if (f && f.lu > avant && !f.verrou) return f;
  }
  return lire(`fils/${paire(q, avec)}/etagere.json`);
}
const jeudiApres = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  const k = (4 - d.getUTCDay() + 7) % 7 || 7;
  return new Date(d.getTime() + k * 86_400_000).toISOString().slice(0, 10);
};
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const court = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${JOURS[d.getUTCDay()]} ${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
};

// ═══ LES PORTES ═══
ok((await voir(null, `etagere?avec=${LEA.cle}`)).statut === 401 && (await agir(null, { action: "vu", avec: LEA.cle, ids: [] })).statut === 401, "sans session : 401");
ok((await voir(MAX, `etagere?avec=${LEA.cle}`)).statut === 403 && (await agir(MAX, { action: "pause", avec: LEA.cle, oui: true })).statut === 403, "Max (il a ajouté Léa, pas l'inverse) : 403");
ok((await agir(LEA, { action: "secret", avec: SAM.cle })).statut === 400, "une action qui n'existe pas : 400");

// ═══ 📌 LÉA ET LE PERMIS ═══
const idPermis = await message(LEA, SAM, "Jeudi prochain je passe le permis, je stresse trop", 4);
await message(SAM, LEA, "Tu vas gérer, je croise tout ce que j'ai", 3);
const vide = await vivant(SAM, LEA);
ok(vide && !vide.etagere?.objets?.length, "avant que les figurines lisent : l'étagère est vide");
const f1 = await lireEchange(SAM, LEA);
const p = f1?.objets?.[0];
ok(f1?.objets?.length === 1 && p.genre === "date" && p.sorte === "epreuve" && p.emoji === "🚗" && p.message === idPermis && p.de8 === qui8(LEA.id) && p.concerne === qui8(LEA.id) && p.etat === "propose", `noté, et proposé : le permis, dit par Léa, la concerne (${JSON.stringify(p)})`);
const quand = jeudiApres(jour);
ok(p?.quand === quand && p.ditQuand === "jeudi prochain", `le jeudi qui suit (${p?.quand})`);
ok(p?.demande?.a === qui8(LEA.id) && Date.parse(p.demande.jusqua) - Date.now() > 3 * 3_600_000, `📌 la question est posée à Léa seule, jusqu'à ${p?.demande?.jusqua}`);
ok(!JSON.stringify(f1).includes(LEA.id) && !JSON.stringify(f1).includes(SAM.id), "jamais l'identifiant d'un habitant dans leur étagère");
// 📌 (lot E5) Sam ne voit rien ; Léa voit la question
const qSam = (await vivant(SAM, LEA))?.etagere;
ok(!qSam?.objets?.length && !qSam?.questions?.length && !qSam?.aJouer, "chez Sam : rien (ni sur l'étagère, ni de question)");
const qLea = (await vivant(LEA, SAM))?.etagere;
const q0 = qLea?.questions?.[0];
ok(!qLea?.objets?.length && qLea?.questions?.length === 1 && q0.id === p.id && q0.objet.titre === "Ton permis" && q0.objet.etat === "propose" && q0.qui === "moi" && q0.phrase === `J’ai entendu : ton permis, ${court(quand).split(" ").slice(0, 2).join(" ")}.`, `chez Léa : la question (« ${q0?.phrase} »), rien sur l'étagère`);
ok(qLea.aJouer === p.id, "la scène de Léa jouera la question");
ok((await voir(LEA, `etagere?avec=${SAM.cle}`)).etagere?.objets?.length === 0 && (await voir(SAM, `etagere?avec=${LEA.cle}`)).etagere?.objets?.length === 0, "la page de l'étagère : rien avant le « oui »");
const ligneQ = (await voir(LEA, "proches"))?.proches?.find((x) => x.cle === SAM.cle)?.etagere;
ok(ligneQ?.txt === "📌 Ta figurine te demande : ton permis ?" && ligneQ.rang === 2.95 && !(await voir(SAM, "proches"))?.proches?.find((x) => x.cle === LEA.cle)?.etagere, `« Chez moi », chez Léa : « ${ligneQ?.txt} » ; chez Sam : rien`);
ok((await agir(SAM, { action: "oui", avec: LEA.cle, id: p.id })).statut === 403 && (await agir(SAM, { action: "non", avec: LEA.cle, id: p.id })).statut === 403, "Sam répond à la place de Léa : refusé (403)");
ok((await agir(SAM, { action: "date", avec: LEA.cle, id: p.id, quand })).statut === 403, "Sam corrige le jour de la question de Léa : refusé (403)");
ok((await agir(LEA, { action: "question-jouee", avec: SAM.cle })).statut === 200 && !(await vivant(LEA, SAM)).etagere.aJouer && (await vivant(LEA, SAM)).etagere.questions.length === 1, "la scène l'a jouée : plus aujourd'hui (la carte reste)");
ok((await agir(LEA, { action: "oui", avec: SAM.cle, id: p.id })).statut === 200, "Léa : « ✓ Oui, range-le »");
ok((await agir(LEA, { action: "oui", avec: SAM.cle, id: p.id })).statut === 404, "répondre deux fois : la question n'attend plus (404)");
const rangee = (await lire(`fils/${paire(LEA, SAM)}/etagere.json`)).objets.find((x) => x.id === p.id);
ok(rangee?.etat === "actif" && !rangee.demande && rangee.change?.par8 === qui8(LEA.id), "rangé : le permis est sur leur étagère");
const chezSam = (await vivant(SAM, LEA))?.etagere;
const chezLea = (await vivant(LEA, SAM))?.etagere;
const os = chezSam?.objets?.[0];
const ol = chezLea?.objets?.[0];
ok(os?.titre === "Le permis de Léa" && os.detail === court(quand) && os.de === "lui" && os.ditPar === "Léa" && !os.pourMoi && os.rayon === "avenir", `chez Sam : « ${os?.titre} » · ${os?.detail}`);
ok(ol?.titre === "Ton permis" && ol.de === "moi" && ol.pourMoi && ol.citation === "Jeudi prochain je passe le permis, je stresse trop", `chez Léa : « ${ol?.titre} », sa phrase exacte`);
ok(chezSam.nouveaux?.includes(p.id) && chezLea.nouveaux?.includes(p.id), "nouveau pour les deux (l'envol se jouera chez chacun)");
ok((await agir(SAM, { action: "vu", avec: LEA.cle, ids: [p.id, "inconnu"] })).statut === 200, "Sam l'a vu se poser");
ok(!(await vivant(SAM, LEA)).etagere.nouveaux.length && (await vivant(LEA, SAM)).etagere.nouveaux.includes(p.id), "chez Sam : plus nouveau ; chez Léa : toujours");
const f2 = await lireEchange(SAM, LEA);
ok(f2?.objets?.length === 1, "relire ne note rien de plus (le curseur)");

// ═══ LA PAGE, LA DATE ═══
const page = await voir(LEA, `etagere?avec=${SAM.cle}`);
ok(page.statut === 200 && page.etagere?.prenom === "Sam" && page.etagere.objets.length === 1 && page.etagere.objets[0].titre === "Ton permis" && page.etagere.tenues === 0 && page.etagere.pause === null, "la page de Léa : « Sam et toi », « Ton permis », pas de pause");
ok((await agir(LEA, { action: "date", avec: SAM.cle, id: p.id, quand: "2020-01-01" })).statut === 400, "changer la date pour un jour passé : refusé");
const autreJour = new Date(Date.parse(`${quand}T12:00:00Z`) + 7 * 86_400_000).toISOString().slice(0, 10);
ok((await agir(SAM, { action: "date", avec: LEA.cle, id: p.id, quand: autreJour })).statut === 200 && (await vivant(LEA, SAM)).etagere.objets[0].quand === autreJour, "Sam change la date : chez Léa aussi");

// ═══ RETIRER ═══
ok((await agir(LEA, { action: "retirer", avec: SAM.cle, id: p.id })).statut === 200, "Léa le retire");
ok((await lire(`fils/${paire(LEA, SAM)}/etagere.json`)).objets.find((x) => x.id === p.id)?.raison === "retire", "la pierre tombale garde sa raison : retiré");
ok(!(await vivant(SAM, LEA)).etagere.objets.length && !(await vivant(LEA, SAM)).etagere.objets.length, "parti pour les deux");
const tombe = (await lire(`fils/${paire(LEA, SAM)}/etagere.json`)).objets.find((x) => x.id === p.id);
ok(tombe?.etat === "retire" && !tombe.titre && !tombe.citation, "il n'en reste qu'une pierre tombale, sans texte");
await json(`fils/${paire(LEA, SAM)}/etagere.json`, { ...(await lire(`fils/${paire(LEA, SAM)}/etagere.json`)), lu: 0, appels: null });
const f3 = await lireEchange(SAM, LEA);
ok(f3.objets.filter((x) => x.etat !== "retire").length === 0, "même si les figurines relisent tout : jamais renoté");
ok((await agir(LEA, { action: "retirer", avec: SAM.cle, id: p.id })).statut === 404, "le retirer deux fois : il n'est plus là");

// ═══ 📌 (lot E5) « NON », PUIS PLUS JAMAIS ; 48 HEURES SANS RÉPONSE ═══
const idJardin = await message(LEA, SAM, "Les pivoines du jardin, je les adore", 2);
const fj = await lireEchange(LEA, SAM);
const pj = fj.objets.find((x) => x.message === idJardin);
ok(pj?.etat === "propose" && pj.demande?.a === qui8(LEA.id), "ses pivoines : une question à Léa");
ok((await agir(LEA, { action: "non", avec: SAM.cle, id: pj.id })).statut === 200, "Léa : « Non »");
const tj = (await lire(`fils/${paire(LEA, SAM)}/etagere.json`)).objets.find((x) => x.id === pj.id);
ok(tj?.etat === "retire" && tj.raison === "non" && !tj.titre && !tj.citation, "une pierre tombale « non », sans texte (Sam n'est pas prévenu)");
ok(!(await vivant(LEA, SAM)).etagere?.questions?.length && !(await vivant(SAM, LEA)).etagere?.objets?.length, "plus de question, rien sur l'étagère");
await json(`fils/${paire(LEA, SAM)}/etagere.json`, { ...(await lire(`fils/${paire(LEA, SAM)}/etagere.json`)), lu: 0 });
const fj2 = await lireEchange(LEA, SAM);
ok(!fj2.objets.some((x) => x.etat !== "retire"), "même si les figurines relisent tout : jamais reproposé");
// (une question posée il y a plus de 48 heures)
const vieille = { id: "vieille0001", genre: "gout", emoji: "🍰", titre: "Les tartes", titreToi: "Tes tartes", concerne: qui8(LEA.id), nuance: "aime", citation: "j'adore les tartes", de8: qui8(LEA.id), message: "seed-vieille", le: new Date(Date.now() - 49 * 3_600_000).toISOString(), etat: "propose", demande: { a: qui8(LEA.id), jusqua: new Date(Date.now() - 3_600_000).toISOString() } };
await json(`fils/${paire(LEA, SAM)}/etagere.json`, { ...(await lire(`fils/${paire(LEA, SAM)}/etagere.json`)), objets: [...(await lire(`fils/${paire(LEA, SAM)}/etagere.json`)).objets, vieille] });
const v48 = (await vivant(LEA, SAM)).etagere;
const t48 = (await lire(`fils/${paire(LEA, SAM)}/etagere.json`)).objets.find((x) => x.id === "vieille0001");
ok(!v48?.questions?.length && t48?.etat === "retire" && t48.raison === "sans-reponse" && !t48.titre, "48 heures sans réponse : la question s'en va, sans bruit (rien n'est rangé)");
ok((await agir(LEA, { action: "oui", avec: SAM.cle, id: "vieille0001" })).statut === 404, "trop tard pour dire oui");

// ═══ CE QUI NE SE NOTE PAS ═══
await message(INES, LEA, "Je suis malade, le permis est repoussé", 4);
await message(LEA, INES, "Oh mince, repose-toi bien", 3);
const fi = await lireEchange(LEA, INES);
ok(fi?.lu > 0 && !fi.objets.length, "Inès est malade (un sujet sensible) : rien n'est noté de tout l'échange");
await message(EVA, LEA, "Les pivoines, c'est les plus belles fleurs du monde", 4);
const fe = await lireEchange(LEA, EVA);
ok(fe?.lu > 0 && !fe.objets.length, "Eva a coupé « Ma figurine parle pour moi » : rien n'est noté");
await message(NICO, LEA, "J'adore les volcans, et un mojito en terrasse", 5);
await message(NICO, LEA, "Le concert samedi, trop hâte", 4);
await message(NICO, LEA, "Bonnie mange encore mes chaussettes", 3);
const fn = await lireEchange(LEA, NICO);
ok(fn?.lu > 0 && !fn.objets.length, "une citation inventée, de l'alcool, « samedi » mais un jeudi, un prénom dans le titre : tout est jeté");

// ═══ LA PAUSE ═══
ok((await agir(LEA, { action: "pause", avec: ZOE.cle, oui: true })).statut === 200, "Léa met leur étagère en pause");
await message(ZOE, LEA, "Faut qu'on se fasse ce resto italien !", 3);
await vivant(ZOE, LEA);
await attendre(2500);
const fz = await lire(`fils/${paire(LEA, ZOE)}/etagere.json`);
ok(!fz.objets?.length, "en pause : rien n'est noté");
ok((await voir(ZOE, `etagere?avec=${LEA.cle}`)).etagere?.pause?.moi === false && (await voir(LEA, `etagere?avec=${ZOE.cle}`)).etagere?.pause?.moi === true, "Zoé lit « Léa a mis l'étagère en pause »");
ok((await agir(ZOE, { action: "pause", avec: LEA.cle, oui: false })).statut === 403, "Zoé ne peut pas la relancer à sa place");
ok((await agir(LEA, { action: "pause", avec: ZOE.cle, oui: false })).statut === 200 && (await voir(ZOE, `etagere?avec=${LEA.cle}`)).etagere?.pause === null, "Léa la relance");
await attendre(100);
await json(`fils/${paire(LEA, ZOE)}/etagere.json`, { ...(await lire(`fils/${paire(LEA, ZOE)}/etagere.json`)), lu: 0 });
await message(ZOE, LEA, "Le resto italien, on le fait quand ?", 2);
const fz2 = await lireEchange(LEA, ZOE);
ok(fz2.objets?.length === 1 && fz2.objets[0].genre === "promesse" && fz2.objets[0].concerne === "deux" && fz2.objets[0].demande?.a === "deux", "relancée : le resto italien, une promesse pour les deux — une question aux deux");
// 📌 (lot E5) les deux voient la question ; le premier « oui » le range
const qz = (await vivant(ZOE, LEA)).etagere?.questions?.[0];
ok(qz?.phrase === "J’ai entendu : le resto italien. On le garde ?" && (await vivant(LEA, ZOE)).etagere?.questions?.length === 1, `les deux voient la question (« ${qz?.phrase} »)`);
ok((await agir(ZOE, { action: "oui", avec: LEA.cle, id: fz2.objets[0].id })).statut === 200, "Zoé dit oui la première");
ok((await agir(LEA, { action: "non", avec: ZOE.cle, id: fz2.objets[0].id })).statut === 404 && !(await vivant(LEA, ZOE)).etagere?.questions?.length, "Léa ne peut plus dire non : il est rangé");
const vz = (await vivant(LEA, ZOE)).etagere.objets[0];
ok(vz.titre === "Le resto italien" && vz.deux && /^promis le /.test(vz.detail), `« Le resto italien » · ${vz.detail}`);

// ═══ 📌 (lot E5) UNE DATE CORRIGÉE SUR UNE QUESTION (Nico) ═══
const dans10 = new Date(Date.now() + 10 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const dans12 = new Date(Date.now() + 12 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const concert = { id: "concert0001", genre: "date", sorte: "evenement", emoji: "🎧", titre: "Le concert", titreToi: "Ton concert", concerne: qui8(NICO.id), citation: "le concert", de8: qui8(NICO.id), message: "seed-concert", le: new Date().toISOString(), quand: dans10, etat: "propose", demande: { a: qui8(NICO.id), jusqua: new Date(Date.now() + 48 * 3_600_000).toISOString() } };
await json(`fils/${paire(LEA, NICO)}/etagere.json`, { ...(await lire(`fils/${paire(LEA, NICO)}/etagere.json`)), objets: [concert] });
ok((await agir(NICO, { action: "date", avec: LEA.cle, id: "concert0001", quand: "2020-01-01" })).statut === 400, "un jour passé : refusé");
ok((await agir(NICO, { action: "date", avec: LEA.cle, id: "concert0001", quand: dans12 })).statut === 200, "Nico corrige le jour de la question");
const cn = (await lire(`fils/${paire(LEA, NICO)}/etagere.json`)).objets.find((x) => x.id === "concert0001");
ok(cn?.etat === "actif" && cn.quand === dans12 && !cn.demande && (await vivant(LEA, NICO)).etagere?.objets?.[0]?.titre === "Le concert de Nico", "le bon jour, et rangé (ça vaut un « oui ») : Léa le voit");

// ═══ 📌 (lot E5) LE RÉGLAGE « MA FIGURINE RANGE SANS ME DEMANDER » (Paul) ═══
ok((await voir(PAUL, "etagere?reglage=1")).rangeSeul === false, "éteint d'office");
const rs = await agir(PAUL, { action: "range-seul", oui: true });
ok(rs.statut === 200 && rs.rangeSeul === true && (await voir(PAUL, "etagere?reglage=1")).rangeSeul === true && (await lire(`${PAUL.id}/reglages.json`))?.rangeSeul === true, "Paul l'allume");

// ═══ UN MESSAGE SIGNALÉ APRÈS COUP ═══
const idPivoines = await message(PAUL, LEA, "Les pivoines, c'est les plus belles fleurs du monde", 3);
const fp = await lireEchange(LEA, PAUL);
ok(fp.objets?.[0]?.genre === "gout" && fp.objets[0].etat === "actif" && !fp.objets[0].demande, "📌 Paul laisse sa figurine ranger : ses pivoines se rangent tout de suite, sans question");
ok((await vivant(LEA, PAUL)).etagere.objets[0].titre === "Les pivoines de Paul" && (await vivant(PAUL, LEA)).etagere.objets[0].titre === "Tes pivoines", "les pivoines : « Les pivoines de Paul » chez Léa, « Tes pivoines » chez Paul");
const sig = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}` }, body: JSON.stringify({ action: "signaler", cle: PAUL.cle, id: idPivoines }) });
ok(sig.status === 200 && !(await vivant(PAUL, LEA)).etagere.objets.length, "Léa signale ce message : les pivoines s'en vont, chez les deux");

// ═══ 📌 (lot E5) LA MESURE ═══
const st = await lire(`stats/etagere/${jour}.json`);
ok(st?.proposes >= 3 && st.oui >= 2 && st.refuses >= 1 && st.expires >= 1 && st.auto >= 1 && st.corriges >= 1, `les compteurs du jour : ${st?.proposes} proposés, ${st?.oui} oui, ${st?.refuses} refusés, ${st?.expires} sans réponse, ${st?.auto} rangés par le réglage, ${st?.corriges} date corrigée`);
ok((await agir(PAUL, { action: "range-seul", oui: false })).rangeSeul === false && (await lire(`${PAUL.id}/reglages.json`))?.rangeSeul === undefined, "Paul l'éteint");

// ═══ UN PROCHE RETIRÉ ═══
const ret = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${ZOE.jeton}` }, body: JSON.stringify({ action: "proche", cle: LEA.cle, oui: false }) });
const fzr = await lire(`fils/${paire(LEA, ZOE)}/etagere.json`);
ok(ret.status === 200 && fzr && !fzr.objets.length, "Zoé retire Léa de ses proches : leur étagère s'efface");

// ═══ LE FREIN ═══
const seconde = await lancerSecondeApp({ port: 3824, env: { CLIKME_ETAGERE: "0" } });
try {
  await message(LEA, SAM, "Les pivoines du marché, mes préférées", 3);
  const vf = await vivant(SAM, LEA, seconde.base);
  await attendre(2500);
  const ff = await lire(`fils/${paire(LEA, SAM)}/etagere.json`);
  ok(vf && !vf.etagere && ff.objets.filter((x) => x.etat !== "retire").length === 0, "le frein serré : rien d'affiché, rien de noté");
  const r = await fetch(`${seconde.base}/api/direct/etagere?avec=${SAM.cle}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
  ok(r.status === 404, "le frein serré : la page ne s'ouvre pas (404)");
  const rr = await fetch(`${seconde.base}/api/direct/etagere?reglage=1`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
  ok(rr.status === 404, "le frein serré : pas de réglage à régler (404)");
} finally {
  seconde.arreter();
}

console.log(echecs ? `\n${echecs} échec(s)` : "\nl'étagère tient, par les routes ✓");
process.exit(echecs ? 1 : 0);
