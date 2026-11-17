// 💓 LE POULS DU SALON (`docs/univers/salon-du-duo.md`, section 7.4, étape 1 ; le lot S2, deuxième partie) — par les
// routes, contre le faux Supabase, jamais la vraie base (`lib/direct/pouls-serveur.ts`, `GET /api/direct/proches?pouls=`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : 403 ; Max : 403 ; une clé inconnue : 404.
// Le pouls de Léa : moins de 300 octets, `n` à zéro, Sam pas là. Sam ouvre ClikMe : il est là ; il ne se montre plus :
// ni là ni sa dernière visite ; parti depuis longtemps : sa dernière visite. Sam écrit (« il prépare ») : `ecrit` ; il
// arrête : plus rien. Chaque événement fait battre le pouls : un message écrit, un panneau, un message effacé.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-pouls-route.mjs
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f50${String(n).padStart(2, "0")}`, jeton: `jeton-salon-pouls-route-0${String(n).padStart(2, "0")}`, prenom });
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

const pouls = async (q, cle) => {
  const r = await fetch(`${BASE}/api/direct/proches?pouls=${cle}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  const texte = await r.text();
  let corps = null;
  try {
    corps = JSON.parse(texte);
  } catch {
    /* rien */
  }
  return { statut: r.status, corps, octets: Buffer.byteLength(texte), cache: r.headers.get("cache-control") };
};
const poster = (q, corps) => fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
/** (le pouls bat après la réponse : on l'attend un peu) */
const attendreQue = async (f, ms = 4000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f()) return true;
    await pause(150);
  }
  return false;
};

// ═══ QUI ═══
ok((await pouls(null, SAM.cle)).statut === 403, "sans session : refusé");
ok((await pouls(MAX, LEA.cle)).statut === 403, "Max (Léa ne l'a pas ajouté) : refusé");
ok((await pouls(LEA, "0".repeat(16))).statut === 404, "une clé inconnue : 404");

// ═══ LE POULS, AU REPOS ═══
let r = await pouls(LEA, SAM.cle);
ok(r.statut === 200 && r.corps?.n === 0 && r.corps.la === false && !("ecrit" in r.corps) && !("vu" in r.corps), `le pouls de Léa : rien encore, Sam pas là (${JSON.stringify(r.corps)})`);
ok(r.octets < 300, `moins de 300 octets (${r.octets})`);
ok(/no-store/.test(r.cache ?? ""), "jamais gardé en cache");

// ═══ LA PRÉSENCE ═══
ok((await poster(SAM, { action: "la" })).status === 200, "Sam ouvre ClikMe");
r = await pouls(LEA, SAM.cle);
ok(r.corps?.la === true && !("vu" in r.corps), "Sam est là");
await poster(SAM, { action: "presence", oui: false });
r = await pouls(LEA, SAM.cle);
ok(r.corps?.la === false && !("vu" in r.corps), "Sam ne se montre plus : ni là, ni sa dernière visite");
await poster(SAM, { action: "presence", oui: true });
const ilYa = Date.now() - 20 * 60_000;
await json(`${SAM.id}/la.json`, { le: ilYa });
r = await pouls(LEA, SAM.cle);
ok(r.corps?.la === false && Math.abs(Date.parse(r.corps.vu ?? "") - ilYa) < 1000, `parti depuis vingt minutes : sa dernière visite (${r.corps?.vu})`);

// ═══ IL ÉCRIT ═══
ok((await poster(SAM, { action: "prepare", cle: LEA.cle, oui: true })).status === 200, "Sam commence à écrire");
r = await pouls(LEA, SAM.cle);
ok(r.corps?.ecrit === true, "Léa le voit : `ecrit`");
ok((await pouls(SAM, LEA.cle)).corps?.ecrit === undefined, "… pas chez Sam (c'est lui qui écrit)");
await poster(SAM, { action: "prepare", cle: LEA.cle, oui: false });
ok(!("ecrit" in ((await pouls(LEA, SAM.cle)).corps ?? {})), "il arrête : plus rien");

// ═══ CHAQUE ÉVÉNEMENT FAIT BATTRE LE POULS ═══
const n0 = (await pouls(LEA, SAM.cle)).corps?.n ?? 0;
const e = await (await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "On se voit ce soir ?" })).json();
ok(e?.message?.id, "Sam écrit à Léa");
let n1 = 0;
ok(await attendreQue(async () => (n1 = (await pouls(LEA, SAM.cle)).corps?.n ?? 0) > n0), `un message écrit : le pouls bat (${n0} → ${n1})`);
ok((await pouls(SAM, LEA.cle)).corps?.n === n1, "… le même chez les deux");
await pause(20);
ok((await poster(LEA, { action: "geste", cle: SAM.cle, type: "panneau", quoi: "jarrive" })).status === 200, "Léa brandit « J'arrive ! »");
let n2 = 0;
ok(await attendreQue(async () => (n2 = (await pouls(SAM, LEA.cle)).corps?.n ?? 0) > n1), `un panneau : le pouls bat (${n2})`);
await pause(20);
ok((await poster(SAM, { action: "effacer", cle: LEA.cle, id: e.message.id })).status === 200, "Sam efface son message");
let n3 = 0;
ok(await attendreQue(async () => (n3 = (await pouls(LEA, SAM.cle)).corps?.n ?? 0) > n2), `un message effacé : le pouls bat (${n3})`);
ok((await poster(SAM, { action: "prepare", cle: LEA.cle, oui: true })).status === 200 && (await pouls(LEA, SAM.cle)).corps?.n === n3, "« il prépare » ne le fait pas battre (ce n'est pas un événement)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle pouls du salon : tout est bon");
process.exit(echecs ? 1 : 0);
