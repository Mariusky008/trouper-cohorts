// 📚 L'ÉTAGÈRE, LOT E2 « PLUS TARD », PAR LES ROUTES — contre le faux Supabase et le faux modèle, jamais la vraie base
// (`lib/direct/etagere.ts`, `etagere-serveur.ts`, `/api/direct/etagere`, `/api/direct/proches`, l'envoi du matin).
//
// Sam a quatre étagères, posées d'avance : avec Léa (son permis, c'est aujourd'hui ; son anniversaire, dans trois
// jours ; elle adore les pivoines), avec Nina (son concert, c'était hier), avec Paul (« Faut qu'on se fasse ce resto
// italien ! », il y a 22 jours), avec Zoé (son code, il y a cinq jours, sans nouvelles).
// LE MATIN : ses deux rappels (le permis de Léa, son anniversaire dans 3 jours avec des idées), pas le concert (deux au
// plus) ; Léa, elle, a l'encouragement de sa figurine ; « Chez moi » : la ligne de Léa (« 📌 Aujourd'hui : son
// permis 🚗 »), celle de Paul (la relance) ; l'envoi du matin : « 📌 Aujourd'hui : le permis de Léa 🚗 » ; Sam écrit
// à Léa : « ✓ Envoyé ». LA FIERTÉ : Léa dit « JE L'AI !!! » ; leurs figurines le lisent : (lot E5) une question à Léa
// seule, « Je range ça dans vos fiertés ? » ; son « oui » : le permis devient un trophée, la carte « fierté » chez les deux ; « C'est réussi » : seulement celui que ça concerne. LES PROMESSES : la relance de
// Paul (21 jours) ; « C'est fait ! » (le compteur, la carte), « Annuler », puis tenue pour de bon. LE TEMPS : le code
// de Zoé, sans nouvelles depuis cinq jours, s'en est allé sans bruit.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-etagere-plus-tard-route.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import { recus, telephone } from "./navigateur/commun.mjs";

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

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e30${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e2-route-00${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const LEA = qui(2, "Léa");
const NINA = qui(3, "Nina");
const PAUL = qui(4, "Paul");
const ZOE = qui(5, "Zoé");
const GENS = [SAM, LEA, NINA, PAUL, ZOE];
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
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, NINA.id, PAUL.id, ZOE.id] });
for (const x of [LEA, NINA, PAUL, ZOE]) await json(`${x.id}/proches.json`, { ids: [SAM.id] });

// ═══ LES ÉTAGÈRES, POSÉES D'AVANCE ═══
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const dansJours = (n) => new Date(Date.parse(`${jour}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const objet = (id, de, concerne, x) => ({ id, genre: "date", emoji: "🚗", titre: "Le permis", concerne, citation: "…", de8: qui8(de.id), message: `msg${id}`.padEnd(12, "0").slice(0, 12), le: ilYa(4), etat: "actif", ...x });
const etagere = (a, b, objets, x = {}) => json(`fils/${paire(a, b)}/etagere.json`, { v: 1, objets, lu: Date.now() - 3_600_000, verrou: 0, vus: { [qui8(SAM.id)]: objets.map((o) => o.id) }, ...x });
await etagere(SAM, LEA, [
  objet("permis", LEA, qui8(LEA.id), { sorte: "epreuve", titreToi: "Ton permis", quand: jour, citation: "Jeudi je passe le permis" }),
  objet("code", LEA, qui8(LEA.id), { sorte: "epreuve", emoji: "📝", titre: "Le code", titreToi: "Ton code", quand: dansJours(-1) }),
  objet("anniv", LEA, qui8(LEA.id), { sorte: "fete", annuel: true, emoji: "🎂", titre: "L’anniversaire", titreToi: "Ton anniversaire", quand: dansJours(3) }),
  objet("pivoines", LEA, qui8(LEA.id), { genre: "gout", emoji: "💐", titre: "Les pivoines", nuance: "aime" }),
]);
await etagere(SAM, NINA, [objet("concert", NINA, qui8(NINA.id), { sorte: "evenement", emoji: "🎧", titre: "Le concert", quand: dansJours(-1) })]);
await etagere(SAM, PAUL, [objet("resto", PAUL, "deux", { genre: "promesse", emoji: "🍝", titre: "Le resto italien", citation: "Faut qu'on se fasse ce resto italien !", le: ilYa(22) })]);
await etagere(SAM, ZOE, [objet("codezoe", ZOE, qui8(ZOE.id), { sorte: "epreuve", emoji: "📝", titre: "Le code", quand: dansJours(-5) })]);

const voir = async (q, chemin) => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const agir = async (q, corps) => {
  const r = await fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const vivant = async (q, avec) => (await voir(q, `proches?vivant=${avec.cle}`)).vivant?.etagere;

// ═══ ☀️ LE MATIN ═══
const rs = (await voir(SAM, "etagere?rappels=1")).rappels ?? [];
ok(rs.length === 2 && rs[0].cas === "epreuve" && rs[0].texte === "Aujourd’hui, c’est le permis de Léa 🚗 Un petit mot avant le départ ?" && rs[0].cle === LEA.cle && rs[0].prenom === "Léa" && !rs[0].fait, `le premier rappel de Sam : « ${rs[0]?.texte} »`);
ok(rs[1]?.cas === "anniv3" && rs[1].texte === "Dans 3 jours, l’anniversaire de Léa 🎂 Des idées : les pivoines", `le second : « ${rs[1]?.texte} » (pas le concert de Nina : deux au plus)`);
ok(rs.every((r) => /^http/.test(r.image)) && rs[0].meme === "Tu vas gérer 🚗" && !JSON.stringify(rs).includes(LEA.id), "sa figurine (l'image), les mots du mème, jamais un identifiant");
const rl = (await voir(LEA, "etagere?rappels=1")).rappels ?? [];
ok(rl.length === 1 && rl[0].cas === "encourage" && rl[0].texte.includes("🚗"), `Léa (ça la concerne) : l'encouragement de sa figurine (« ${rl[0]?.texte} »)`);
const liste = (await voir(SAM, "proches")).proches ?? [];
const ligne = (q) => liste.find((p) => p.cle === q.cle)?.etagere;
ok(ligne(LEA)?.txt === "📌 Aujourd’hui : son permis 🚗" && ligne(LEA).rang > 2 && ligne(LEA).rang < 3, `« Chez moi », la ligne de Léa : « ${ligne(LEA)?.txt} »`);
ok(ligne(PAUL)?.txt === "🍝 Le resto italien : promis il y a 3 semaines", `la ligne de Paul : « ${ligne(PAUL)?.txt} »`);

// ═══ 🔔 L'ENVOI DU MATIN ═══
const telSam = telephone("sam-etagere");
await json(`notif/abonnes/${SAM.id}.json`, { h: SAM.id, ville: "dax", abonnements: [telSam.abonnement], le: new Date().toISOString() });
const matin = await (await fetch(`${BASE}/api/cron/rituel-matin?force=1`)).json();
let notifs = [];
for (let k = 0; k < 20 && !notifs.length; k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
ok(matin.ok && matin.envoyes === 1 && notifs[0]?.title === "📌 Aujourd’hui : le permis de Léa 🚗" && notifs[0]?.body === "Un petit mot avant le départ ? Ta figurine t’attend." && notifs[0]?.url === "/collection#proches", `la notification du matin : « ${notifs[0]?.title} » — « ${notifs[0]?.body} »`);

// ═══ 🏆 « JE L'AI !!! » ═══
ok((await agir(SAM, { action: "reussi", avec: LEA.cle, id: "code" })).statut === 403, "« C'est réussi » : pas à la place de Léa");
ok((await agir(LEA, { action: "reussi", avec: SAM.cle, id: "anniv" })).statut === 400, "pas sur un anniversaire");
ok((await agir(LEA, { action: "reussi", avec: SAM.cle, id: "code" })).statut === 200, "Léa : « 🏆 C'est réussi » (son code)");
// (le message de Léa, il y a deux minutes : leurs figurines le lisent)
const pair = paire(SAM, LEA);
const ts = Date.now() - 2 * 60_000;
await deposer(`fils/${pair}/s/jelai0000001.mp3`, fs.readFileSync("scripts/fixtures/voix-essai.mp3"), "audio/mpeg");
await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(LEA.id)}-jelai0000001.json`, { id: "jelai0000001", de: LEA.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/jelai0000001.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte: "JE L'AI !!! 🎉", tete: null }] });
await vivant(SAM, LEA);
// 📌 (lot E5) l'issue devient une question à Léa
let issue = null;
for (let k = 0; k < 40 && !issue; k++) {
  await attendre(300);
  issue = (await lire(`fils/${pair}/etagere.json`))?.objets?.find((o) => o.id === "permis" && o.demande?.issue);
}
ok(issue?.etat === "actif" && issue.demande.a === qui8(LEA.id), "leurs figurines ont lu « JE L'AI !!! » : une question à Léa (le permis reste là en attendant)");
ok(!(await vivant(SAM, LEA))?.questions?.length && (await vivant(SAM, LEA))?.objets?.find((o) => o.id === "permis")?.etat === "actif", "chez Sam : pas de question, le permis toujours « à venir »");
const qi = (await vivant(LEA, SAM))?.questions?.find((q) => q.id === "permis");
ok(qi?.issue && qi.phrase === "J’ai entendu : c’est réussi ! Je range ça dans vos fiertés ? 🏆" && qi.qui === "moi", `chez Léa : « ${qi?.phrase} »`);
ok((await agir(SAM, { action: "oui", avec: LEA.cle, id: "permis" })).statut === 403, "Sam ne répond pas à sa place (403)");
ok((await agir(LEA, { action: "oui", avec: SAM.cle, id: "permis" })).statut === 200, "Léa : « ✓ Oui »");
const fierte = (await lire(`fils/${pair}/etagere.json`))?.objets?.find((o) => o.id === "permis" && o.etat === "fierte");
ok(fierte?.emoji === "🏆" && fierte.emojiAvant === "🚗" && !fierte.demande, "le permis devient un trophée");
const es = await vivant(SAM, LEA);
const cf = es?.cartes?.find((c) => c.genre === "fierte" && c.objet.id === "permis");
ok(cf?.nouvelle && cf.objet.titre === "Le permis de Léa" && /^réussi le /.test(cf.objet.detail) && cf.objet.rayon === "fiertes", `chez Sam : la carte « fierté » (${cf?.objet.titre} · ${cf?.objet.detail})`);
ok(es.cartes.some((c) => c.genre === "fierte" && c.objet.id === "code"), "et celle du code (dit par Léa elle-même)");
const el = await vivant(LEA, SAM);
ok(el?.cartes?.find((c) => c.objet.id === "permis")?.objet.titre === "Ton permis", "chez Léa : « Ton permis », en haut");
ok((await agir(SAM, { action: "vu", avec: LEA.cle, ids: [cf.id] })).statut === 200 && !(await vivant(SAM, LEA)).cartes.find((c) => c.id === cf.id).nouvelle, "Sam l'a vue se jouer : plus nouvelle");

// ═══ ✓ SAM ÉCRIT À LÉA ═══
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;
const env = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "envoyer", cle: LEA.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Bonne chance pour tout à l'heure", tete: null }] }) });
ok(env.status === 200 && (await voir(SAM, "etagere?rappels=1")).rappels?.[0]?.fait === true, "Sam écrit à Léa : le rappel dit « ✓ Envoyé »");

// ═══ ✅ LES PROMESSES ═══
const ep = await vivant(SAM, PAUL);
const rel = ep?.cartes?.find((c) => c.genre === "relance");
ok(rel?.n === 21 && rel.objet.titre === "Le resto italien" && rel.nouvelle, "la relance de Paul : 21 jours après la promesse");
ok((await agir(SAM, { action: "tenue", avec: PAUL.cle, id: "resto" })).statut === 200, "Sam : « ✅ C'est fait ! »");
const ap = await vivant(PAUL, SAM);
ok(ap.tenues === 1 && ap.objets.find((o) => o.id === "resto")?.etat === "tenue" && ap.objets.find((o) => o.id === "resto")?.rayon === "fiertes" && ap.cartes.some((c) => c.genre === "tenue" && c.n === 1 && c.nouvelle), "chez Paul : tenue, dans « Nos fiertés », le compteur à 1, la carte « promesse tenue »");
ok((await agir(SAM, { action: "tenue", avec: PAUL.cle, id: "resto" })).statut === 400, "deux fois : non");
ok((await agir(PAUL, { action: "annuler-tenue", avec: SAM.cle, id: "resto" })).statut === 200, "Paul annule (dans les 24 h)");
const an = await vivant(SAM, PAUL);
ok(an.tenues === 0 && an.objets.find((o) => o.id === "resto")?.etat === "actif" && !an.cartes.some((c) => c.genre === "tenue"), "annulée : de nouveau en cours, le compteur à 0, plus de carte");
ok((await agir(PAUL, { action: "tenue", avec: SAM.cle, id: "resto" })).statut === 200 && (await voir(SAM, `etagere?avec=${PAUL.cle}`)).etagere?.tenues === 1, "Paul la coche pour de bon : la page dit 1 promesse tenue");

// ═══ ⏳ LE TEMPS ═══
const ez = await vivant(SAM, ZOE);
ok(ez && !ez.objets.length && (await lire(`fils/${paire(SAM, ZOE)}/etagere.json`)).objets[0].etat === "passe", "le code de Zoé, sans nouvelles depuis cinq jours : parti, sans bruit");
const en = await vivant(SAM, NINA);
ok(en.objets[0]?.id === "concert", "le concert de Nina, c'était hier : il reste jusqu'à demain (« Alors, ce concert ? »)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nl'étagère, plus tard, tient ✓");
process.exit(echecs ? 1 : 0);
