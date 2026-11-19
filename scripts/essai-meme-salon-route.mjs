// 🎭 LES MÈMES DU SALON (le lot S5 ; `lib/direct/meme-salon.ts`, `meme-salon-serveur.ts`), PAR LES ROUTES — contre le faux
// Supabase, jamais la vraie base.
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : refusé ; Max : 403. Léa joue un mème (ce que
// dit sa figurine, sa tête, sa danse, le mème prêt d'où il vient) : rangé dans leur fil (`genre: "meme"`) ; chez Sam,
// « nouveau », sa ligne de « Chez moi » (« 🎭 « … » »), la notification « 🎭 Léa t'a envoyé un mème » ; le pouls bat.
// CE QUI EST REFUSÉ : vide, plus de 120 signes, un mot interdit ; une tête inconnue devient la joie. 🔥 : Sam y réagit
// (une réaction qui n'existe que sur un mème). 🎙️ MA VOIX : un mème dit avec sa voix, sans texte (sa voix, sa durée, ses
// niveaux ; chez Sam ; « 🎭 🎙️ » dans « Chez moi » ; la notification « 🎙️ Avec sa voix ») — puis ce qu'elle a dit devient
// son texte (la fausse transcription), le pouls bat ; avec un texte : il reste tel quel ; plus de 20 secondes, pas un son :
// refusés. 🎬 « JE LE RANGE ? » : Sam répond par un mème, le duo se range dans « Nos fous rires » (une claquette 🎬,
// les deux mèmes à rejouer), chez les deux ; une fois ; deux mèmes du même, un écrit, Max : refusés. EFFACER : Léa
// l'efface, il n'est plus là (sa voix avec).
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-meme-salon-route.mjs
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

const qui = (n, prenom) => ({ id: `3e3e3e3e-0000-4000-8000-0000000f50${String(n).padStart(2, "0")}`, jeton: `jeton-meme-salon-route-00${String(n).padStart(2, "0")}`, prenom });
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
const telSam = telephone("sam-meme-salon");
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

const meme = (q, avec, o) => poster(q, { action: "meme-salon", cle: avec.cle, ...o });
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

// ═══ QUI PEUT ═══
const sans = await poster(null, { action: "meme-salon", cle: SAM.cle, texte: "Coucou", tete: "joie" });
ok([401, 403].includes(sans.statut) && !sans.message, `sans session : refusé (${sans.statut})`);
ok((await meme(MAX, LEA, { texte: "Coucou", tete: "joie" })).statut === 403, "Max (pas proche) : 403");

// ═══ LÉA JOUE UN MÈME ═══
const n0 = (await pouls(SAM, LEA)).n ?? 0;
const TEXTE = "Non mais attends… j’en peux plus. Arrête, j’ai mal aux joues.";
const e1 = await meme(LEA, SAM, { texte: TEXTE, tete: "rire", danse: true, pret: "fou-rire" });
const m1 = e1.message;
ok(e1.statut === 200 && m1?.genre === "meme" && m1.texte === TEXTE && m1.meme?.tete === "rire" && m1.meme.danse === true && m1.meme.pret === "fou-rire" && m1.moi === true, `il part : son texte, sa tête, sa danse, d'où il vient (${JSON.stringify(m1?.meme)})`);
ok(!m1?.son && m1?.duree > 3, `pas de son, la durée de son jeu (${m1?.duree} s)`);
let chezSam = await fil(SAM, LEA);
const vu = chezSam?.messages?.find((m) => m.id === m1?.id);
ok(vu && !vu.moi && vu.nouveau === true && vu.genre === "meme" && vu.texte === TEXTE && vu.meme?.tete === "rire", "chez Sam : le mème, « nouveau », sa tête");
const pLea = ((await voir(SAM, "proches")).proches ?? []).find((x) => x.cle === LEA.cle);
ok(pLea?.dernier?.meme === true && pLea.dernier.texte === `🎭 « ${TEXTE} »`, `« Chez moi », chez Sam : « ${pLea?.dernier?.texte} »`);
let notifs = [];
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "🎭 Léa t’a envoyé un mème"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
const n1 = notifs.find((n) => n.title === "🎭 Léa t’a envoyé un mème");
ok(n1?.body === TEXTE, `la notification : « ${n1?.title} » — « ${n1?.body} »`);
let bat = false;
for (let k = 0; k < 20 && !bat; k++) {
  bat = ((await pouls(SAM, LEA)).n ?? 0) > n0;
  if (!bat) await attendre(200);
}
ok(bat, "le pouls a battu");

// ═══ CE QUI EST REFUSÉ ═══
const vide = await meme(LEA, SAM, { texte: "   ", tete: "joie" });
ok(vide.statut === 400, `vide : 400 (« ${vide.error} »)`);
const long = await meme(LEA, SAM, { texte: "a".repeat(121), tete: "joie" });
ok(long.statut === 400 && /120/.test(long.error ?? ""), `plus de 120 signes : 400 (« ${long.error} »)`);
ok((await meme(LEA, SAM, { texte: "Espèce de connard", tete: "colere" })).statut === 422, "un mot interdit : 422");
const inconnue = await meme(LEA, SAM, { texte: "Bonne nuit !", tete: "pas-une-tete", danse: "oui" });
ok(inconnue.statut === 200 && inconnue.message?.meme?.tete === "joie" && inconnue.message.meme.danse === false, "une tête inconnue : la joie ; une danse qui n'est pas « vrai » : non");
ok(!(await meme(LEA, SAM, { texte: "Hop", tete: "joie", pret: "../pas un mème" })).message?.meme?.pret, "un mème prêt illisible : pas gardé");

// ═══ 🔥 : SAM Y RÉAGIT ═══
const reac = await poster(SAM, { action: "geste", cle: LEA.cle, type: "reaction", quoi: "feu", message: m1?.id });
ok(reac.statut === 200 && reac.geste?.cle === "feu" && reac.geste.message === m1?.id, "Sam y réagit : 🔥");
const vivant = (await voir(LEA, `proches?vivant=${SAM.cle}`)).vivant;
ok(vivant?.gestes?.some((g) => g.type === "reaction" && g.cle === "feu" && g.message === m1?.id && !g.moi), "chez Léa : sa réaction 🔥, sur son mème");
ok((await poster(SAM, { action: "geste", cle: LEA.cle, type: "reaction", quoi: "pas-une-reaction", message: m1?.id })).statut >= 400, "une réaction qui n'existe pas : refusée");

// ═══ 🎙️ MA VOIX ═══
// (Sam a tout lu : seul ce mème l'attendra — sa notification à lui)
await fil(SAM, LEA);
await voir(SAM, `proches?vivant=${LEA.cle}`);
const n2 = (await pouls(SAM, LEA)).n ?? 0;
const ev = await meme(LEA, SAM, { texte: "", tete: "euphorie", son: wav(2.6), duree: 2.6, niveaux: NIVEAUX(2.6) });
const mv = ev.message;
ok(ev.statut === 200 && mv?.genre === "meme" && mv.meme?.voix === true && mv.meme.tete === "euphorie" && mv.texte === "" && mv.duree === 2.6 && mv.niveaux === NIVEAUX(2.6) && Boolean(mv.son), `🎙️ dit avec sa voix, sans texte : sa voix, sa durée (${mv?.duree} s), ses niveaux`);
const sonV = await fetch(mv?.son ?? "");
ok(sonV.status === 200 && (await sonV.arrayBuffer()).byteLength > 30_000, "sa voix se lit (adresse signée)");
let vv = (await fil(SAM, LEA))?.messages?.find((m) => m.id === mv?.id);
ok(vv?.meme?.voix === true && Boolean(vv.son) && vv.niveaux === mv?.niveaux && vv.nouveau === true, "chez Sam : le mème, avec sa voix et ses niveaux");
const pLea2 = ((await voir(SAM, "proches")).proches ?? []).find((x) => x.cle === LEA.cle);
ok(pLea2?.dernier?.meme === true && pLea2.dernier.texte.startsWith("🎭 🎙️"), `« Chez moi », chez Sam : « ${pLea2?.dernier?.texte} »`);
let n3;
for (let k = 0; k < 30 && !n3; k++) {
  n3 = (await recus(telSam)).find((n) => n.title === "🎭 Léa t’a envoyé un mème" && n.body !== TEXTE && n.body !== "Bonne nuit !" && n.body !== "Hop");
  if (!n3) await attendre(300);
}
ok(n3?.body === "🎙️ Avec sa voix", `la notification : « ${n3?.body} »`);
// (après la réponse : sa voix transcrite devient son texte ; le pouls bat)
let ecrit = "";
for (let k = 0; k < 40 && !ecrit; k++) {
  vv = (await fil(SAM, LEA))?.messages?.find((m) => m.id === mv?.id);
  ecrit = vv?.texte ?? "";
  if (!ecrit) await attendre(300);
}
ok(/ce soir/.test(ecrit) && [...ecrit].length <= 120 && vv?.meme?.voix === true, `ce qu'elle a dit devient son texte : « ${ecrit} »`);
ok(((await pouls(SAM, LEA)).n ?? 0) > n2, "le pouls a battu");
const avecTexte = await meme(LEA, SAM, { texte: "Coucou toi !", tete: "joie", son: wav(1.5), duree: 1.5, niveaux: NIVEAUX(1.5) });
await attendre(1500);
const vt = (await fil(SAM, LEA))?.messages?.find((m) => m.id === avecTexte.message?.id);
ok(avecTexte.statut === 200 && vt?.texte === "Coucou toi !" && vt.meme?.voix === true, "avec un texte et sa voix : le texte reste tel quel");
const tropLong = await meme(LEA, SAM, { texte: "", tete: "joie", son: wav(25), duree: 25, niveaux: NIVEAUX(25) });
ok(tropLong.statut === 400, `plus de 20 secondes : 400 (« ${tropLong.error} »)`);
ok((await meme(LEA, SAM, { texte: "", tete: "joie", son: `data:text/plain;base64,${Buffer.from("x".repeat(3000)).toString("base64")}`, duree: 2 })).statut === 400, "pas un son : 400");

// ═══ 🎬 « JE LE RANGE ? » ═══
const reponse = await meme(SAM, LEA, { texte: "Ha ha, trop bien !", tete: "rire" });
const duo = [avecTexte.message?.id, reponse.message?.id];
const etagere = (q, avec, corps) => fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify({ avec: avec.cle, ...corps }) }).then(async (r) => ({ statut: r.status, ...(await r.json().catch(() => ({}))) }));
const rg = await etagere(SAM, LEA, { action: "ranger-duo", messages: duo });
const o = rg.souvenir;
ok(rg.statut === 200 && o?.emoji === "🎬" && o.rayon === "rires" && o.genre === "blague" && o.deux === true && o.detail === "votre duo de mèmes", `Sam le range : une claquette 🎬 dans « Nos fous rires » (« ${o?.titre} », ${o?.detail})`);
ok(o?.duo?.length === 2 && o.duo[0].de === "lui" && o.duo[0].texte === "Coucou toi !" && o.duo[1].de === "moi" && o.duo[1].tete === "rire", "… les deux mèmes, à rejouer (de qui, ce qu'ils disent, leur tête)");
const chezLea = (await voir(LEA, `etagere?avec=${SAM.cle}`)).etagere;
const vuLea = (chezLea?.objets ?? []).find((x) => x.id === o?.id);
ok(vuLea?.duo?.[0]?.de === "moi" && vuLea.duo[1].de === "lui", "chez Léa aussi (le sien d'abord, puis celui de Sam)");
const encore = await etagere(LEA, SAM, { action: "ranger-duo", messages: [...duo].reverse() });
ok(encore.statut === 200 && encore.deja === true && encore.souvenir?.id === o?.id, "Léa dit oui aussi : il est déjà rangé (une fois)");
ok((await etagere(LEA, SAM, { action: "ranger-duo", messages: [mv?.id, avecTexte.message?.id] })).statut === 422, "deux mèmes de Léa : pas un duo (422)");
const ecritSam = await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Et un mot écrit" });
ok((await etagere(LEA, SAM, { action: "ranger-duo", messages: [avecTexte.message?.id, ecritSam.message?.id] })).statut === 422, "un mème et un écrit : pas un duo (422)");
ok((await etagere(MAX, LEA, { action: "ranger-duo", messages: duo })).statut === 403, "Max : 403");

// ═══ 🔔 CE QUI ATTEND (lot S8) ═══
// (Sam lit tout ; Léa lui laisse un bisou, un mème, deux messages et un vocal : la notification dit tout)
await fil(SAM, LEA);
await voir(SAM, `proches?vivant=${LEA.cle}`);
const titres = async () => (await recus(telSam)).map((n) => n.title);
const avantTout = (await titres()).length;
ok((await poster(LEA, { action: "geste", cle: SAM.cle, type: "geste", quoi: "bisou" })).statut === 200, "Léa : un bisou");
await meme(LEA, SAM, { texte: "On se fait un ciné ?", tete: "joie" });
await poster(LEA, { action: "ecrire", cle: SAM.cle, texte: "Ce soir" });
await poster(LEA, { action: "ecrire", cle: SAM.cle, texte: "Ou demain" });
await poster(LEA, { action: "vocal", cle: SAM.cle, son: wav(1.4), duree: 1.4, niveaux: NIVEAUX(1.4) });
const RESUME = "😘 Léa t’a laissé un bisou, un mème, 2 messages et un vocal";
let tous = [];
for (let k = 0; k < 40 && !tous.includes(RESUME); k++) {
  tous = (await titres()).slice(avantTout);
  if (!tous.includes(RESUME)) await attendre(300);
}
ok(tous.includes(RESUME), `la notification dit tout : « ${tous[tous.length - 1]} »`);
ok(tous[0] === "😘 Léa t’a laissé un bisou", `le bisou seul, d'abord : « ${tous[0]} »`);
await fil(SAM, LEA);
await voir(SAM, `proches?vivant=${LEA.cle}`);
const avantUn = (await titres()).length;
await poster(LEA, { action: "ecrire", cle: SAM.cle, texte: "À tout de suite" });
let un = [];
for (let k = 0; k < 30 && !un.length; k++) {
  un = (await titres()).slice(avantUn);
  if (!un.length) await attendre(300);
}
ok(un[0] === "✍️ Léa t’a écrit", `Sam a tout lu, un seul message : sa notification à part entière (« ${un[0]} »)`);
// (un bisou ensuite : « un bisou et un message », sous la phrase « Dans votre salon », une seule fois)
const avantDeux = (await recus(telSam)).length;
await poster(LEA, { action: "geste", cle: SAM.cle, type: "geste", quoi: "bisou" });
let deux = [];
for (let k = 0; k < 30 && !deux.some((n) => n.title === "😘 Léa t’a laissé un bisou et un message"); k++) {
  deux = (await recus(telSam)).slice(avantDeux);
  if (!deux.some((n) => n.title === "😘 Léa t’a laissé un bisou et un message")) await attendre(300);
}
const nDeux = deux.find((n) => n.title === "😘 Léa t’a laissé un bisou et un message");
ok(nDeux?.body === "Dans votre salon", `le bisou après le message : « ${nDeux?.title ?? deux[0]?.title} », « ${nDeux?.body} »`);

// ═══ EFFACER ═══
ok((await poster(LEA, { action: "effacer", cle: SAM.cle, id: m1?.id })).statut === 200, "Léa efface son mème");
chezSam = await fil(SAM, LEA);
ok(!chezSam?.messages?.some((m) => m.id === m1?.id), "chez Sam : il n'est plus là");
const cheminV = new URL(vv?.son ?? "http://x/").pathname.replace(/^.*\/figurines-clients\//, "");
ok((await poster(LEA, { action: "effacer", cle: SAM.cle, id: mv?.id })).statut === 200 && cheminV.includes("/s/") && (await fetch(`${STOCK}/figurines-clients/${cheminV}`)).status >= 400, "son mème dit avec sa voix : effacé, sa voix avec");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
