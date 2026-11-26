// 🔔 MES GROUPES, LES RAPPELS (le lot G3, 26 novembre 2026 ; `docs/univers/mes-groupes.md`), PAR LA ROUTE — contre le faux
// Supabase et le faux service de notifications (rien ne part).
//
// Léa propose une soirée foot dans vingt minutes ; Zoé prend sa place. La tâche des cinq minutes : trop tôt, rien ; dix
// minutes avant, « 🔔 Soirée foot commence dans 10 minutes » à Léa et à Zoé — une seule fois. Zoé propose une autre heure :
// Léa l'apprend tout de suite ; Léa la prend : Zoé l'apprend ; et à la nouvelle heure, un nouveau rappel. Tom, sans
// place : rien.
import sharp from "sharp";
import crypto from "node:crypto";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006a72${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-rappels-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const NOE = qui(5, "Noé");
const GENS = [LEA, SAM, ZOE, TOM, NOE];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, accord_le: maintenant, prete_le: maintenant })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, x === NOE ? { age: 16, adulte: false, le: maintenant } : { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
}
// (Léa ↔ Sam : proches des deux côtés ; Zoé, Tom et Noé : de personne)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const GROUPES = "/api/direct/mes-groupes";
const geste = (x, corps) => appel(x, GROUPES, corps);
const cron = async (dans) => (await fetch(`${BASE}/api/cron/groupes-rappels?dans=${dans}`)).json();

// ─── leurs téléphones (un faux service de notifications, au faux Supabase) ───
function telephone(nom) {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  const endpoint = `${FAUX}/push/${nom}-${crypto.randomBytes(4).toString("hex")}`;
  return { ecdh, auth, endpoint, abonnement: { endpoint, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } } };
}
/** Déchiffrer comme le téléphone (RFC 8291, `aes128gcm`). */
function dechiffrer(t, b64) {
  const buf = Buffer.from(b64, "base64");
  const sel = buf.subarray(0, 16);
  const sa = buf.subarray(21, 21 + buf[20]);
  const chiffre = buf.subarray(21 + buf[20]);
  const h = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const ikm = h(h(t.auth, t.ecdh.computeSecret(sa)), Buffer.concat([Buffer.from("WebPush: info\0"), t.ecdh.getPublicKey(), sa, Buffer.from([1])]));
  const prk = h(sel, ikm);
  const cle = h(prk, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\0"), Buffer.from([1])])).subarray(0, 16);
  const nonce = h(prk, Buffer.concat([Buffer.from("Content-Encoding: nonce\0"), Buffer.from([1])])).subarray(0, 12);
  const d = crypto.createDecipheriv("aes-128-gcm", cle, nonce);
  d.setAuthTag(chiffre.subarray(chiffre.length - 16));
  const clair = Buffer.concat([d.update(chiffre.subarray(0, chiffre.length - 16)), d.final()]);
  let fin = clair.length - 1;
  while (fin >= 0 && clair[fin] === 0) fin--;
  return JSON.parse(clair.subarray(0, fin).toString("utf8"));
}
/** Ce que son téléphone a reçu de Mes groupes. */
const recus = async (t) =>
  ((await (await fetch(`${FAUX}/__push`)).json()) ?? [])
    .filter((x) => x.adresse === new URL(t.endpoint).pathname)
    .map((x) => dechiffrer(t, x.corps))
    .filter((n) => /^groupe-/.test(n.tag ?? ""));
const TEL = {};
for (const x of [LEA, ZOE, TOM]) {
  TEL[x.prenom] = telephone(`groupes-${x.prenom.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase()}`);
  const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify({ action: "notif", abonnement: TEL[x.prenom].abonnement }) });
  ok(r.status === 200, `${x.prenom} a les notifications (${r.status})`);
}

// ═══ LÉA PROPOSE DANS VINGT MINUTES ; ZOÉ PREND SA PLACE ═══
const p = (await geste(LEA, { action: "proposer", nom: "Soirée foot", theme: "foot", quand: Date.now() + 20 * 60_000, pour: "tous", places: 8 })).proposition;
ok(p?.id, "Léa propose « Soirée foot » dans vingt minutes");
ok((await geste(ZOE, { action: "confirmer", id: p.id })).proposition?.jY, "Zoé prend sa place");

// ═══ 🔔 LA TÂCHE DES CINQ MINUTES ═══
// (les autres essais de la même construction ont leurs propositions : on regarde les téléphones de Léa et de Zoé)
await cron(0);
ok((await recus(TEL["Zoé"])).length === 0 && (await recus(TEL["Léa"])).length === 0, "vingt minutes avant : pas encore de rappel");
const r1 = await cron(10);
ok(r1.rappels >= 1 && r1.personnes >= 2, `dix minutes avant : un rappel, deux téléphones (${JSON.stringify(r1)})`);
const [nL] = await recus(TEL["Léa"]);
const [nZ] = await recus(TEL["Zoé"]);
ok(/^🔔 Soirée foot commence dans (9|10) minutes$/.test(nZ?.title ?? "") && /Vous êtes 2/.test(nZ?.body ?? ""), `Zoé : « ${nZ?.title} » — « ${nZ?.body} »`);
ok(nL?.title === nZ?.title && nL?.url === "/collection#groupes", "Léa aussi, et le toucher ouvre Mes groupes");
ok((await recus(TEL["Tom"])).length === 0, "Tom, sans place : rien");
await cron(12);
ok((await recus(TEL["Zoé"])).length === 1 && (await recus(TEL["Léa"])).length === 1, "deux minutes plus tard : pas de deuxième rappel");

// ═══ 🕘 UNE AUTRE HEURE ═══
const demain = Date.now() + 26 * 3600_000;
ok((await geste(ZOE, { action: "autre-heure", id: p.id, quand: demain })).statut === 200, "Zoé propose une autre heure");
const aL = (await recus(TEL["Léa"])).at(-1);
ok(/^🕘 Zoé propose .+ à la place$/.test(aL?.title ?? ""), `Léa l'apprend tout de suite (« ${aL?.title} »)`);
const v = (await appel(LEA, GROUPES)).propositions?.find((x) => x.id === p.id);
ok((await geste(LEA, { action: "autre-heure", id: p.id, quand: v.autre.quand })).proposition?.quand === v.autre.quand, "Léa prend cette heure");
const cZ = (await recus(TEL["Zoé"])).at(-1);
ok(/^🕘 Soirée foot passe à /.test(cZ?.title ?? ""), `Zoé l'apprend (« ${cZ?.title} »)`);
const r2 = await cron(Math.round((v.autre.quand - Date.now()) / 60_000) - 10);
ok(r2.rappels >= 1 && (await recus(TEL["Zoé"])).filter((n) => /^🔔/.test(n.title)).length === 2, "à la nouvelle heure : un nouveau rappel");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLes rappels de Mes groupes tiennent ✓");
process.exit(echecs ? 1 : 0);
