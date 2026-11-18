// 🎙️ LE TALKIE-WALKIE DU SALON (le lot S4 ; `lib/direct/vocal.ts`, `vocal-serveur.ts`), PAR LES ROUTES — contre le faux
// Supabase et sa fausse transcription, jamais la vraie base.
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : refusé ; Max : 403. Léa envoie un vocal (sa
// voix, sa durée, ses niveaux) : rangé, dans le fil de Sam (« nouveau », ses niveaux, pas encore écouté), la ligne de
// « Chez moi », la notification « 🎙️ Léa t'a parlé ! » ; puis, après la réponse, ce qu'elle a dit est écrit (la fausse
// transcription) et le pouls bat. CE QUI EST REFUSÉ : plus d'une minute, un toucher trop court, autre chose qu'un son ;
// des niveaux illisibles ne sont pas gardés (le vocal part quand même). ÉCOUTÉ : Sam l'écoute (une fois ; le pouls bat),
// Léa le voit ; Léa ne peut pas « écouter » le sien, ni Max, ni un vocal qui n'existe pas. « IL PARLE » : le pouls de Sam
// dit `parle` pendant que Léa parle dans son talkie, `ecrit` quand elle écrit, rien quand elle a fini. EFFACER : sa voix
// avec.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-vocal-route.mjs
import crypto from "node:crypto";
import { recus, telephone } from "./navigateur/commun.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `0c410c41-0000-4000-8000-0000000f40${String(n).padStart(2, "0")}`, jeton: `jeton-vocal-route-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const MAX = qui(3, "Max");
const GENS = [LEA, SAM, MAX];
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
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${MAX.id}/proches.json`, { ids: [LEA.id] });
const telSam = telephone("sam-vocal");
await json(`notif/abonnes/${SAM.id}.json`, { h: SAM.id, ville: "dax", abonnements: [telSam.abonnement], le: new Date().toISOString() });

const voir = async (q, chemin) => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const poster = async (q, corps) => {
  const r = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const fil = async (q, avec) => (await voir(q, `proches?fil=${avec.cle}`)).fil;
const pouls = (q, avec) => voir(q, `proches?pouls=${avec.cle}`);

/** Un vrai petit son (WAV) de `sec` secondes. */
function wav(sec) {
  const taux = 8000;
  const n = Math.round(sec * taux);
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(taux, 24);
  b.writeUInt32LE(taux * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((i / taux) * 2 * Math.PI * 330) * 8000), 44 + i * 2);
  return `data:audio/wav;base64,${b.toString("base64")}`;
}
const NIVEAUX = (sec) => Array.from({ length: Math.round((sec * 1000) / 60) }, (_, i) => Math.round(Math.abs(Math.sin(i / 3)) * 15).toString(16)).join("");
const vocal = (q, avec, sec, o = {}) => poster(q, { action: "vocal", cle: avec.cle, son: wav(sec), duree: sec, niveaux: NIVEAUX(sec), ...o });

// ═══ QUI PEUT ═══
const sans = await poster(null, { action: "vocal", cle: SAM.cle, son: wav(2), duree: 2, niveaux: NIVEAUX(2) });
ok([401, 403].includes(sans.statut) && !sans.message, `sans session : refusé (${sans.statut})`);
ok((await vocal(MAX, LEA, 2)).statut === 403, "Max (pas proche) : 403");

// ═══ LÉA ENVOIE UN VOCAL ═══
const n0 = (await pouls(SAM, LEA)).n ?? 0;
const e1 = await vocal(LEA, SAM, 3.4);
const m1 = e1.message;
ok(e1.statut === 200 && m1?.moi === true && m1.duree === 3.4 && m1.niveaux === NIVEAUX(3.4) && Boolean(m1.son) && !m1.genre, `il part : sa voix, sa durée (${m1?.duree} s), ses niveaux (${m1?.niveaux?.length} mesures)`);
ok(m1?.repliques?.length === 1 && m1.repliques[0].texte === "", "… une réplique, sans texte pour l'instant");
let chezSam = await fil(SAM, LEA);
let vu = chezSam?.messages?.find((m) => m.id === m1?.id);
ok(vu && !vu.moi && vu.nouveau === true && vu.niveaux === m1.niveaux && !vu.ecoute, "chez Sam : le vocal, « nouveau », ses niveaux, pas encore écouté");
const son = await fetch(vu?.son ?? "");
ok(son.status === 200 && (await son.arrayBuffer()).byteLength > 40_000, "sa voix se lit (adresse signée)");
const liste = (await voir(SAM, "proches")).proches ?? [];
const pLea = liste.find((x) => x.cle === LEA.cle);
// (la ligne d'un vocal : « 🎙️ Message vocal », puis ce qu'il a dit dès que c'est écrit — comme ceux de l'écran d'avant)
ok(Boolean(pLea?.dernier?.texte) && !pLea.dernier.ecrit && !pLea.dernier.moi, `« Chez moi », chez Sam : « ${pLea?.dernier?.texte} »`);
let notifs = [];
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "🎙️ Léa t’a parlé !"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
ok(notifs.some((n) => n.title === "🎙️ Léa t’a parlé !"), "la notification : « 🎙️ Léa t’a parlé ! »");
// (après la réponse : la transcription, puis le pouls bat)
let ecrit = "";
for (let k = 0; k < 40 && !ecrit; k++) {
  vu = (await fil(SAM, LEA))?.messages?.find((m) => m.id === m1?.id);
  ecrit = (vu?.repliques ?? []).map((r) => r.texte).join(" ");
  if (!ecrit) await attendre(300);
}
ok(/ce soir/.test(ecrit) && (vu?.repliques ?? []).every((r) => r.tete === null), `ce qu'elle a dit, écrit après coup : « ${ecrit} »`);
ok(((await pouls(SAM, LEA)).n ?? 0) > n0, "le pouls a battu");
const parLea = (await fil(LEA, SAM))?.messages?.find((m) => m.id === m1?.id);
ok(/ce soir/.test((parLea?.repliques ?? []).map((r) => r.texte).join(" ")), "… et Léa le lit aussi");

// ═══ CE QUI EST REFUSÉ ═══
const long = await vocal(LEA, SAM, 70);
ok(long.statut === 400, `plus d'une minute : 400 (« ${long.error} »)`);
ok((await vocal(LEA, SAM, 0.3)).statut === 400, "un toucher trop court : 400");
ok((await poster(LEA, { action: "vocal", cle: SAM.cle, son: `data:text/plain;base64,${Buffer.from("x".repeat(3000)).toString("base64")}`, duree: 2, niveaux: NIVEAUX(2) })).statut === 400, "autre chose qu'un son : 400");
const sansNiveaux = await vocal(LEA, SAM, 1.5, { niveaux: "pas des niveaux" });
ok(sansNiveaux.statut === 200 && !sansNiveaux.message?.niveaux, "des niveaux illisibles : pas gardés (le vocal part quand même)");
const tropDeNiveaux = await vocal(LEA, SAM, 1.2, { niveaux: "f".repeat(5000) });
ok(tropDeNiveaux.statut === 200 && tropDeNiveaux.message?.niveaux?.length <= Math.ceil(1200 / 60) + 30, `trop de niveaux : coupés à la voix (${tropDeNiveaux.message?.niveaux?.length})`);

// ═══ ÉCOUTÉ ═══
const n1 = (await pouls(LEA, SAM)).n ?? 0;
await attendre(20);
const ec = await poster(SAM, { action: "ecoute", cle: LEA.cle, id: m1?.id });
ok(ec.statut === 200 && ec.ok === true, "Sam l'écoute");
let lu = false;
for (let k = 0; k < 20 && !lu; k++) {
  lu = (await fil(LEA, SAM))?.messages?.find((m) => m.id === m1?.id)?.ecoute === true;
  if (!lu) await attendre(200);
}
ok(lu, "chez Léa : « écouté »");
ok(((await pouls(LEA, SAM)).n ?? 0) > n1, "le pouls a battu (son talkie quitte la table)");
ok((await poster(SAM, { action: "ecoute", cle: LEA.cle, id: m1?.id })).ok === true, "l'écouter encore : rien ne change");
ok((await poster(LEA, { action: "ecoute", cle: SAM.cle, id: m1?.id })).statut === 404, "Léa ne peut pas « écouter » le sien : 404");
ok((await poster(MAX, { action: "ecoute", cle: LEA.cle, id: m1?.id })).statut >= 400, "Max : refusé");
ok((await poster(SAM, { action: "ecoute", cle: LEA.cle, id: "abcdefabcdef" })).statut === 404, "un vocal qui n'existe pas : 404");
const ecritDeLea = await poster(LEA, { action: "ecrire", cle: SAM.cle, texte: "Et un mot écrit" });
ok((await poster(SAM, { action: "ecoute", cle: LEA.cle, id: ecritDeLea.message?.id })).statut === 404, "un message écrit ne s'« écoute » pas : 404");

// ═══ « IL PARLE » (LE POULS) ═══
await poster(LEA, { action: "prepare", cle: SAM.cle, oui: true, facon: "parle" });
let p = await pouls(SAM, LEA);
ok(p.parle === true && !p.ecrit, "Léa parle dans son talkie : le pouls de Sam dit « parle »");
await poster(LEA, { action: "prepare", cle: SAM.cle, oui: true });
p = await pouls(SAM, LEA);
ok(p.ecrit === true && !p.parle, "Léa écrit : « ecrit », pas « parle »");
await poster(LEA, { action: "prepare", cle: SAM.cle, oui: false });
p = await pouls(SAM, LEA);
ok(!p.ecrit && !p.parle, "elle a fini : ni l'un ni l'autre");
const vivant = (await voir(SAM, `proches?vivant=${LEA.cle}`)).vivant;
ok(vivant?.enregistre === false, "l'écran d'avant : « il prépare » s'est éteint aussi");

// ═══ EFFACER ═══
const chemin = new URL(vu?.son ?? "http://x/").pathname.replace(/^.*\/figurines-clients\//, "");
const ef = await poster(LEA, { action: "effacer", cle: SAM.cle, id: m1?.id });
ok(ef.statut === 200, "Léa efface son vocal");
ok(chemin.includes("/s/") && (await fetch(`${STOCK}/figurines-clients/${chemin}`)).status >= 400, "… sa voix avec");
chezSam = await fil(SAM, LEA);
ok(!chezSam?.messages?.some((m) => m.id === m1?.id), "chez Sam : il n'est plus là");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
