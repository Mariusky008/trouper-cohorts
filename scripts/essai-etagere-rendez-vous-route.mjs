// 📅 L'ÉTAGÈRE NOTE AUSSI UN RENDEZ-VOUS, MÊME ÉCRIT — contre le faux Supabase et le faux modèle, jamais la vraie base
// (`lib/direct/etagere-serveur.ts`, `GET /api/direct/proches?vivant=`).
//
// Le propriétaire, le 15 novembre 2026 : « j'ai bien dit que demain on avait un rendez-vous (foot) mais ma figurine ne
// m'a pas demandé de le ranger sur mes étagères ». Léa et Sam sont proches ; il y a quelques minutes, Léa a ÉCRIT
// « demain on a foot en salle n oubli pas » (un message écrit, pas un vocal). La conversation se relit chez Léa : leurs
// figurines lisent l'échange, la consigne du modèle dit qu'un rendez-vous pour un jour précis se note (et que les
// messages peuvent être écrits) ; « Le foot », demain, se range « proposé » : une question aux deux (« Je le range ? »),
// rien sur l'étagère avant un « oui » ; le « oui » de Sam le range pour les deux.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-etagere-rendez-vous-route.mjs
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
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

const qui = (n, prenom) => ({ id: `e7b7e7b7-0000-4000-8000-0000000e50${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-rdv-route-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
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

// il y a trois minutes, Léa a ÉCRIT (un message écrit, comme dans l'appli)
const PAIRE = paire(LEA, SAM);
const TEXTE = "demain on a foot en salle n oubli pas";
const ts = Date.now() - 3 * 60_000;
const id = "rdvfoot00001";
await json(`fils/${PAIRE}/m/${String(ts).padStart(13, "0")}-${qui8(LEA.id)}-${id}.json`, { id, de: LEA.id, le: new Date(ts).toISOString(), genre: "ecrit", texte: TEXTE, tete: null });

const vivant = async (q, avec) => {
  const r = await fetch(`${BASE}/api/direct/proches?vivant=${avec.cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return (await r.json().catch(() => ({}))).vivant;
};
const agir = async (q, corps) => {
  const r = await fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ═══ LA CONVERSATION SE RELIT CHEZ LÉA : LEURS FIGURINES LISENT L'ÉCHANGE ═══
await vivant(LEA, SAM);
let f = null;
for (let k = 0; k < 40 && !(f?.lu >= ts && !f.verrou); k++) {
  await attendre(300);
  f = await lire(`fils/${PAIRE}/etagere.json`);
}
const consigne = ((await (await fetch(`${FAUX}/__ia`)).json().catch(() => [])) ?? []).find((x) => String(x).includes("NOTENT CE QUI COMPTE")) ?? "";
ok(consigne.includes(TEXTE) && consigne.includes("vocaux ou écrits") && consigne.includes("UN RENDEZ-VOUS"), "le modèle lit le message écrit ; sa consigne dit que les messages peuvent être écrits, et qu'un rendez-vous pour un jour précis se note");
const demain = new Date(Date.parse(`${new Date(ts).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" })}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
const foot = (f?.objets ?? []).find((o) => o.titre === "Le foot");
ok(foot?.genre === "date" && foot.sorte === "evenement" && foot.quand === demain && foot.emoji === "⚽" && foot.citation === TEXTE, `« Le foot », demain (${foot?.quand}) : un rendez-vous noté, la phrase exacte en citation`);
ok(foot?.etat === "propose" && foot.demande?.a === "deux", "il se range « proposé » : une question aux deux, rien sur l'étagère avant un « oui »");

// ═══ « JE LE RANGE ? » ═══
const vl = (await vivant(LEA, SAM))?.etagere;
const vs = (await vivant(SAM, LEA))?.etagere;
const ql = vl?.questions?.find((q) => q.id === foot?.id);
const qs = vs?.questions?.find((q) => q.id === foot?.id);
ok(ql && qs && !vl.objets?.some((o) => o.id === foot?.id), `la question chez Léa (« ${ql?.phrase} ») et chez Sam ; rien sur l'étagère encore`);
ok((await agir(SAM, { action: "oui", avec: LEA.cle, id: foot?.id })).statut === 200, "Sam répond « oui »");
const apres = (await vivant(LEA, SAM))?.etagere;
ok(apres?.objets?.some((o) => o.id === foot?.id) && !apres.questions?.some((q) => q.id === foot?.id), "rangé pour les deux : sur l'étagère de Léa, plus de question");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle rendez-vous se range, même écrit ✓");
process.exit(echecs ? 1 : 0);
