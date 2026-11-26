// 🔔 MES GROUPES, LES NOUVEAUX MESSAGES (après le lot G8, 26 novembre 2026 ; « à faire avec soin » ;
// `docs/univers/mes-groupes.md`), PAR LA ROUTE — contre le faux Supabase.
//
// « Les copains » : Léa, Sam, Zoé. Zoé est dans le salon du groupe. Sam écrit : Léa est prévenue (« 💬 Les copains ·
// Sam : … »), pas Sam, pas Zoé (elle y est). Sam écrit encore : pas de deuxième notification (une vague toutes les deux
// heures au plus). La nuit (de 22 h à 9 h, heure de Paris) : personne n'est prévenu.
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

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000007072${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-notifs-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const GENS = [LEA, SAM, ZOE, TOM];
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
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
}
// (Léa ↔ Sam : proches des deux côtés ; Zoé, Tom et Noé : de personne)
// (Léa ↔ Sam, Léa ↔ Zoé : proches ; Tom : de personne)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, ZOE.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
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
    .filter((n) => /^groupe-msg-/.test(n.tag ?? ""));
const TEL = {};
for (const x of [LEA, SAM, ZOE]) {
  TEL[x.prenom] = telephone(`groupes-notifs-${x.prenom.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase()}`);
  const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify({ action: "notif", abonnement: TEL[x.prenom].abonnement }) });
  ok(r.status === 200, `${x.prenom} a les notifications (${r.status})`);
}


const CLE = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_SAM = await CLE(SAM);
const CLE_ZOE = await CLE(ZOE);
await CLE(LEA);
const c = await geste(LEA, { action: "creer-groupe", nom: "Les copains", theme: "humour", cles: [CLE_SAM, CLE_ZOE] });
const GID = c.groupe?.id;
ok(c.statut === 200 && GID, "Léa crée « Les copains »");
await geste(SAM, { action: "garder-groupe", groupe: GID });
await geste(ZOE, { action: "garder-groupe", groupe: GID });
const e = await appel(ZOE, "/api/direct/salons-ouverts", { action: "entrer-groupe", groupe: GID });
ok(e.statut === 200, "Zoé est dans le salon du groupe");

const calme = (() => {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", hour: "2-digit" }).format(Date.now()));
  return h >= 22 || h < 9;
})();
const w1 = await geste(SAM, { action: "ecrire-groupe", groupe: GID, texte: "On regarde quoi ce soir ?" });
ok(w1.statut === 200, "Sam écrit au groupe");
const [nL] = await recus(TEL["Léa"]);
if (calme) ok(!nL, "la nuit : Léa n'est pas réveillée");
else ok(nL?.title === "💬 Les copains" && nL.body === "Sam : On regarde quoi ce soir ?" && nL.tag === `groupe-msg-${GID}`, `Léa : « ${nL?.title} · ${nL?.body} »`);
ok((await recus(TEL["Sam"])).length === 0, "pas Sam (c'est lui qui écrit)");
ok((await recus(TEL["Zoé"])).length === 0, "pas Zoé (elle est dans le salon)");
await geste(SAM, { action: "ecrire-groupe", groupe: GID, texte: "Une comédie ?" });
ok((await recus(TEL["Léa"])).length === (calme ? 0 : 1), "un deuxième message : pas de deuxième notification");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLes notifications des groupes tiennent ✓");
process.exit(echecs ? 1 : 0);
