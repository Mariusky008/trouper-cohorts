// 📎 LES PDF DANS LA CONVERSATION (le salon du duo, lot S6 ; `lib/direct/fichier.ts`, `fichier-serveur.ts`), PAR LES
// ROUTES — contre le faux Supabase, jamais la vraie base. Décidé par le propriétaire le 18 novembre 2026 : seulement des
// PDF, sans contrôle, entre deux proches qui se sont ajoutés, ouverts en téléchargement.
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : refusé ; Max : 403. Léa dépose un PDF
// (« ../../Billets du concert.pdf ») et l'envoie : rangé (`fils/<paire>/f/<id>.pdf`), son nom nettoyé (« Billets du
// concert.pdf »), sa taille ; chez Sam : dans le fil (« nouveau »), son adresse signée le TÉLÉCHARGE sous son nom, la
// ligne de « Chez moi » (« 📎 Billets du concert.pdf »), la notification « 📎 Léa t'a envoyé un PDF ». CE QUI EST REFUSÉ :
// une image renommée en .pdf (422, effacée), plus de 10 Mo (413), un PDF jamais déposé (400), celui de Léa envoyé par
// Sam (400), un nom avec un mot interdit (422). Un nom sans « .pdf » le reçoit. EFFACER : Léa efface son message, son PDF
// avec. SIGNALER : Sam le signale, l'équipe le voit (« 📎 Un PDF »).
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-fichiers-route.mjs
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

const qui = (n, prenom) => ({ id: `f1c4f1c4-0000-4000-8000-0000000f30${String(n).padStart(2, "0")}`, jeton: `jeton-fichiers-route-00${String(n).padStart(2, "0")}`, prenom });
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
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const sessionAdmin = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
await semer("admins", [{ user_id: ADMIN }]);
const telSam = telephone("sam-fichiers");
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
/** Comme le téléphone : l'adresse signée, puis le dépôt (un seul). */
async function deposerPdf(q, avec, octets) {
  const d = await poster(q, { action: "fichier-depot", cle: avec.cle });
  if (!d.jeton) return { d };
  const r = await fetch(`${STOCK}/upload/sign/${d.seau}/${d.chemin}?token=${d.jeton}`, { method: "PUT", headers: { "content-type": "application/pdf" }, body: octets });
  return { d, statut: r.status };
}
const envoyer = (q, avec, id, nom) => poster(q, { action: "fichier", cle: avec.cle, id, nom });
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n".padEnd(3000, " "));

// ═══ LES PORTES ═══
const sans = await poster(null, { action: "fichier-depot", cle: SAM.cle });
ok([401, 403].includes(sans.statut) && !sans.jeton, `sans session : refusé (${sans.statut})`);
ok((await poster(MAX, { action: "fichier-depot", cle: LEA.cle })).statut === 403, "Max (pas proche) : 403");

// ═══ LÉA ENVOIE UN PDF ═══
const p1 = await deposerPdf(LEA, SAM, PDF);
ok(Boolean(p1.d.jeton) && p1.d.chemin?.includes("/f/") && p1.statut === 200, "Léa dépose son PDF (une adresse signée, pour elle seule)");
const e1 = await envoyer(LEA, SAM, p1.d.id, "../../Billets du concert.pdf");
const m1 = e1.message;
ok(e1.statut === 200 && m1?.genre === "fichier" && m1.fichier?.nom === "Billets du concert.pdf" && m1.fichier.taille === PDF.length && m1.texte === "📎 Billets du concert.pdf", `il part : son nom nettoyé, sa taille (${JSON.stringify(m1?.fichier)?.slice(0, 90)})`);
ok(/download=/.test(m1?.fichier?.url ?? ""), "son adresse signée le télécharge (download)");
const range = await fetch(`${STOCK}/figurines-clients/fils/${[LEA.id, SAM.id].sort().join("_")}/f/${p1.d.id}.pdf`);
ok(range.status === 200 && (await range.text()).startsWith("%PDF-"), "rangé : fils/<paire>/f/<id>.pdf");
const fs = await fil(SAM, LEA);
const vu = fs?.messages?.find((x) => x.id === p1.d.id);
ok(vu?.genre === "fichier" && vu.nouveau === true && !vu.moi && vu.fichier?.nom === "Billets du concert.pdf" && fs.fichiers === true, "chez Sam : le PDF dans le fil, « nouveau » ; les PDF sont ouverts");
const pLea = ((await voir(SAM, "proches")).proches ?? []).find((p) => p.cle === LEA.cle);
ok(pLea?.dernier?.fichier === true && pLea.dernier.texte === "📎 Billets du concert.pdf", `« Chez moi », chez Sam : « ${pLea?.dernier?.texte} »`);
let notifs = [];
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "📎 Léa t’a envoyé un PDF"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
const n1 = notifs.find((n) => n.title === "📎 Léa t’a envoyé un PDF");
ok(n1?.body === "Billets du concert.pdf", `la notification : « ${n1?.title} » — « ${n1?.body} »`);

// ═══ CE QUI EST REFUSÉ ═══
const p2 = await deposerPdf(LEA, SAM, PNG);
const e2 = await envoyer(LEA, SAM, p2.d.id, "photo.pdf");
ok(e2.statut === 422 && e2.error === "Seuls les PDF peuvent partir.", `une image renommée en .pdf : « ${e2.error} »`);
ok((await envoyer(LEA, SAM, p2.d.id, "photo.pdf")).statut === 400, "… effacée (renvoyée : elle n'est plus là)");
const p3 = await deposerPdf(LEA, SAM, Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(10 * 1024 * 1024 + 10, 32)]));
ok((await envoyer(LEA, SAM, p3.d.id, "gros.pdf")).statut === 413, "plus de 10 Mo : 413");
ok((await envoyer(LEA, SAM, "abcdefabcdef", "jamais.pdf")).statut === 400, "un PDF jamais déposé : 400");
const p4 = await deposerPdf(LEA, SAM, PDF);
ok((await envoyer(SAM, LEA, p4.d.id, "pas-a-moi.pdf")).statut === 400, "le PDF de Léa, envoyé par Sam : 400");
ok((await envoyer(LEA, SAM, p4.d.id, "connard.pdf")).statut === 422, "un nom avec un mot interdit : 422");
const e5 = await envoyer(LEA, SAM, p4.d.id, "Recette de la tarte");
ok(e5.statut === 200 && e5.message?.fichier?.nom === "Recette de la tarte.pdf", `un nom sans « .pdf » le reçoit (${e5.message?.fichier?.nom})`);

// ═══ SIGNALER, EFFACER ═══
await poster(SAM, { action: "signaler", cle: LEA.cle, id: e5.message?.id });
const signales = await (await fetch(`${BASE}/admin/humain/figurines-clients`, { headers: { cookie: `sb-127-auth-token=base64-${b64(sessionAdmin)}` } })).text();
ok(signales.includes("📎 Un PDF"), "Sam le signale : l'équipe le voit (« 📎 Un PDF »)");
const ef = await poster(LEA, { action: "effacer", cle: SAM.cle, id: p1.d.id });
ok(ef.statut === 200 && (await fetch(`${STOCK}/figurines-clients/fils/${[LEA.id, SAM.id].sort().join("_")}/f/${p1.d.id}.pdf`)).status >= 400, "Léa efface son message : son PDF avec");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles PDF dans la conversation, par les routes : tout est bon");
process.exit(echecs ? 1 : 0);
