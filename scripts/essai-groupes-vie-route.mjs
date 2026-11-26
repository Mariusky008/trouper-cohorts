// 📅💬 MES GROUPES, LES RENDEZ-VOUS ET LA DISCUSSION (le lot G5, 26 novembre 2026 ; `docs/univers/mes-groupes.md`),
// PAR LA ROUTE — contre le faux Supabase.
//
// Léa crée « Les copains » avec Sam et Zoé, qui le gardent. Tom n'en est pas : ni ses rendez-vous, ni sa discussion.
// Léa pose « Le rendez-vous du soir » (chaque jour, 21 h) : elle vient ; Sam dit Absent, puis Je viens ; Zoé, Plus tard.
// Un rendez-vous chaque mercredi, retiré par Léa (pas par Sam). Une séance exceptionnelle dans vingt minutes : le rappel
// « commence dans 10 minutes » va à ceux qui viennent, une fois. La discussion : Sam écrit, un lien ne passe pas. 💡 Zoé
// lance une idée de séance : elle est dans la discussion, pas dans les rendez-vous ; Sam « Partant ! » : elle y entre.
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

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006c72${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-vie-route-${String(n).padStart(2, "0")}`, prenom });
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
const vie = async (x, gid) => appel(x, `${GROUPES}?groupe=${encodeURIComponent(gid)}`);
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
    .filter((n) => /^groupe-rdv-/.test(n.tag ?? ""));
const TEL = {};
for (const x of [LEA, SAM, ZOE]) {
  TEL[x.prenom] = telephone(`groupes-vie-${x.prenom.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase()}`);
  const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify({ action: "notif", abonnement: TEL[x.prenom].abonnement }) });
  ok(r.status === 200, `${x.prenom} a les notifications (${r.status})`);
}


const CLE = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_SAM = await CLE(SAM);
const CLE_ZOE = await CLE(ZOE);
await CLE(LEA);

// ═══ LE GROUPE ═══
const c = await geste(LEA, { action: "creer-groupe", nom: "Les copains", theme: "humour", cles: [CLE_SAM, CLE_ZOE] });
const GID = c.groupe?.id;
ok(c.statut === 200 && GID, `Léa crée « Les copains » (${GID})`);
ok((await geste(SAM, { action: "garder-groupe", groupe: GID })).statut === 200, "Sam le garde");
ok((await geste(ZOE, { action: "garder-groupe", groupe: GID })).statut === 200, "Zoé le garde");
const v0 = await vie(LEA, GID);
ok(v0.statut === 200 && v0.vie?.rdv.length === 0 && v0.vie.messages.length === 0, "sa vie : aucun rendez-vous, aucun message encore");
ok((await vie(TOM, GID)).statut === 404, "Tom (pas membre) : rien");

// ═══ 📅 LE RENDEZ-VOUS DU SOIR ═══
const a = await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "", recurrence: "jour", heure: 21, minute: 0 });
const R1 = a.rdv?.id;
ok(a.statut === 200 && a.rdv?.nom === "Le rendez-vous du soir" && a.rdv.recurrence === "jour" && a.rdv.heure === 21 && a.rdv.e === "🌙", `Léa pose « ${a.rdv?.nom ?? a.error} », chaque soir à 21 h`);
ok(a.rdv?.moi === "viens" && a.rdv.mien && a.rdv.viennent.map((p) => p.prenom).join(",") === "Léa", "elle vient (sa figurine), elle peut le retirer");
ok(a.rdv?.quand > Date.now() - 2 * 3600_000 && a.rdv.quand < Date.now() + 26 * 3600_000, "sa prochaine fois : dans la journée qui vient");
const s1 = await geste(SAM, { action: "rdv-repondre", groupe: GID, rdv: R1, reponse: "absent" });
ok(s1.statut === 200 && s1.rdv?.moi === "absent" && s1.rdv.viennent.length === 1 && !s1.rdv.mien, "Sam : Absent (pas de figurine en plus)");
const s2 = await geste(SAM, { action: "rdv-repondre", groupe: GID, rdv: R1, reponse: "viens" });
ok(s2.rdv?.moi === "viens" && s2.rdv.viennent.map((p) => p.prenom).sort().join(",") === "Léa,Sam", "Sam change d'avis : Je viens");
ok((await geste(ZOE, { action: "rdv-repondre", groupe: GID, rdv: R1, reponse: "tard" })).rdv?.moi === "tard", "Zoé : Plus tard");
ok((await geste(ZOE, { action: "rdv-repondre", groupe: GID, rdv: R1, reponse: "peut-etre" })).statut === 400, "pas d'autre réponse");
ok((await geste(TOM, { action: "rdv-repondre", groupe: GID, rdv: R1, reponse: "viens" })).statut === 404, "Tom ne peut pas répondre");
const vZ = (await vie(ZOE, GID)).vie?.rdv.find((r) => r.id === R1);
ok(vZ?.moi === "tard" && vZ.viennent.length === 2, "Zoé relit : sa réponse, et ceux qui viennent");

// ═══ CHAQUE MERCREDI ; RETIRER ═══
const m = await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "La découverte du mercredi", recurrence: "semaine", jour: 2, heure: 20, minute: 30 });
ok(m.statut === 200 && m.rdv?.jour === 2 && m.rdv.minute === 30, "Léa pose « La découverte du mercredi » (20 h 30)");
ok((await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Sans jour", recurrence: "semaine", jour: 9, heure: 20 })).statut === 400, "pas de jour : non");
ok((await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Hier", recurrence: "une", quand: Date.now() - 3600_000 })).statut === 400, "une séance dans le passé : non");
ok((await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Va sur www.site.fr", recurrence: "jour", heure: 20 })).statut === 400, "un nom avec un lien : non");
ok((await geste(SAM, { action: "rdv-retirer", groupe: GID, rdv: m.rdv?.id })).statut === 403, "Sam ne peut pas le retirer");
ok((await geste(LEA, { action: "rdv-retirer", groupe: GID, rdv: m.rdv?.id })).statut === 200, "Léa le retire");
ok(!(await vie(SAM, GID)).vie?.rdv.some((r) => r.id === m.rdv?.id), "… il n'est plus là");

// ═══ ⭐ UNE SÉANCE EXCEPTIONNELLE, ET SON RAPPEL ═══
const e = await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Séance spéciale", recurrence: "une", quand: Date.now() + 20 * 60_000 });
const R2 = e.rdv?.id;
ok(e.statut === 200 && e.rdv?.recurrence === "une" && e.rdv.e === "⭐", "Léa pose une séance exceptionnelle dans vingt minutes");
await geste(SAM, { action: "rdv-repondre", groupe: GID, rdv: R2, reponse: "viens" });
await geste(ZOE, { action: "rdv-repondre", groupe: GID, rdv: R2, reponse: "absent" });
const recusDe = async (x) => (await recus(TEL[x.prenom])).filter((n) => n.tag === `groupe-rdv-${R2}`);
await cron(0);
ok((await recusDe(LEA)).length === 0 && (await recusDe(SAM)).length === 0, "vingt minutes avant : pas encore de rappel");
const r1 = await cron(10);
const [nS] = await recusDe(SAM);
ok(r1.rendezVous >= 1 && /Séance spéciale/.test(nS?.title ?? "") && /10 minutes/.test(nS?.title ?? ""), `Sam : « ${nS?.title} »`);
ok((await recusDe(LEA)).length === 1, "Léa aussi (elle vient)");
ok((await recusDe(ZOE)).length === 0, "Zoé (absente) : rien");
await cron(12);
ok((await recusDe(SAM)).length === 1, "deux minutes plus tard : pas de deuxième rappel");
const gL = (await appel(LEA, GROUPES)).groupes?.find((g) => g.id === GID);
ok(["Séance spéciale", "Le rendez-vous du soir"].includes(gL?.prochain?.nom), `sa table, dans Tous mes groupes : « Prochain : ${gL?.prochain?.nom} »`);

// ═══ 💬 LA DISCUSSION ═══
const w = await geste(SAM, { action: "ecrire-groupe", groupe: GID, texte: "  On se fait un film ce soir ?  " });
ok(w.statut === 200 && w.message?.texte === "On se fait un film ce soir ?" && w.message.mien, "Sam écrit au groupe");
ok((await geste(SAM, { action: "ecrire-groupe", groupe: GID, texte: "va sur www.site.fr" })).statut === 400, "un lien ne passe pas");
ok((await geste(SAM, { action: "ecrire-groupe", groupe: GID, texte: "x".repeat(120) })).statut === 400, "trop long : non");
ok((await geste(TOM, { action: "ecrire-groupe", groupe: GID, texte: "Coucou" })).statut === 404, "Tom ne peut pas écrire");
const lL = (await vie(LEA, GID)).vie?.messages ?? [];
ok(lL.length === 1 && lL[0].prenom === "Sam" && !lL[0].mien, "Léa lit le message de Sam");

// ═══ 💡 UNE IDÉE DE SÉANCE ; « PARTANT ! » ═══
const i = await geste(ZOE, { action: "rdv-ajouter", groupe: GID, nom: "Le marathon du dimanche", idee: true, quand: Date.now() + 2 * 24 * 3600_000 });
const R3 = i.rdv?.id;
ok(i.statut === 200 && i.rdv?.idee && i.message?.idee === R3 && i.message.texte === "Le marathon du dimanche", "Zoé lance une idée : elle arrive dans la discussion");
ok(i.rdv?.viennent.map((p) => p.prenom).join(",") === "Zoé", "Zoé est partante, seule pour l'instant");
const p1 = await geste(SAM, { action: "rdv-repondre", groupe: GID, rdv: R3, reponse: "viens" });
ok(p1.statut === 200 && p1.entre && p1.rdv?.viennent.length === 2, "Sam : « Partant ! » — l'idée entre dans les rendez-vous");
const p2 = await geste(LEA, { action: "rdv-repondre", groupe: GID, rdv: R3, reponse: "viens" });
ok(p2.statut === 200 && !p2.entre, "Léa partante aussi (elle y était déjà)");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLes rendez-vous et la discussion des groupes tiennent ✓");
process.exit(echecs ? 1 : 0);
