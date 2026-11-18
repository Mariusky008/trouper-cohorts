// 📌 GARDER UNE BULLE, CÔTÉ SERVEUR (`docs/univers/salon-du-duo.md`, section 4.10 ; le lot S6) — par les routes, contre
// le faux Supabase, jamais la vraie base (`lib/direct/etagere-serveur.ts`, `POST /api/direct/etagere
// { action: "garder" }`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sam a écrit six messages. Léa les garde : un rendez-vous
// samedi devient une date (« À venir »), le resto une promesse, un fou rire une blague (« Nos fous rires »), un merci
// « vos mots », une réponse du modèle qui ne tient pas : les mots tels quels ; garder deux fois : `deja` ; « malade » :
// 422 ; un message inconnu : 404 ; Max : 403 ; sans session : 401. Pas de limite par jour. Le pouls bat. Sam voit les
// souvenirs « gardés par Léa », nouveaux pour lui ; Léa les a déjà vus se poser. L'ouverture du salon les donne, avec
// le message d'où ils viennent.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-garder-route.mjs
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

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000fb0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-garder-route-0${String(n).padStart(2, "0")}`, prenom });
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

const poster = async (q, route, corps) => {
  const r = await fetch(`${BASE}/api/direct/${route}`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const obtenir = async (q, chemin) => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const garder = (q, avec, message) => poster(q, "etagere", { action: "garder", avec, message });
const ecrire = async (q, avec, texte) => (await poster(q, "proches", { action: "ecrire", cle: avec, texte })).corps?.message?.id;

const TEXTES = {
  mer: "On va voir la mer samedi, c'est décidé !",
  resto: "Faut qu'on se fasse ce resto italien",
  rire: "Haha je pleure de rire 😂",
  merci: "Merci pour tout, vraiment, tu es la meilleure personne",
  bizarre: "Un truc bizarre qui ne se range nulle part",
  malade: "Je suis malade depuis hier",
};
const ids = {};
for (const [k, t] of Object.entries(TEXTES)) ids[k] = await ecrire(SAM, LEA.cle, t);
ok(Object.values(ids).every(Boolean), "Sam a écrit six messages");

// ═══ LÉA GARDE ═══
const n0 = (await obtenir(LEA, `proches?pouls=${SAM.cle}`)).corps?.n ?? 0;
let r = await garder(LEA, SAM.cle, ids.mer);
const mer = r.corps?.souvenir;
ok(r.statut === 200 && mer?.genre === "date" && mer.rayon === "avenir" && mer.titre === "Voir la mer, samedi" && mer.emoji === "🌊" && mer.garde === "moi" && mer.message === ids.mer && mer.de === "lui" && /^samedi /.test(mer.detail), `un rendez-vous samedi : une date, « À venir » (${mer?.titre} · ${mer?.detail})`);
const attendre = async (f, ms = 4000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f()) return true;
    await pause(150);
  }
  return false;
};
ok(await attendre(async () => ((await obtenir(LEA, `proches?pouls=${SAM.cle}`)).corps?.n ?? 0) > n0), "le pouls bat");
r = await garder(LEA, SAM.cle, ids.resto);
ok(r.corps?.souvenir?.genre === "promesse" && r.corps.souvenir.rayon === "avenir", "le resto : une promesse");
r = await garder(LEA, SAM.cle, ids.rire);
ok(r.corps?.souvenir?.genre === "blague" && r.corps.souvenir.rayon === "rires", "un fou rire : une blague, dans « Nos fous rires »");
r = await garder(LEA, SAM.cle, ids.merci);
const merci = r.corps?.souvenir;
ok(merci?.genre === "mot" && merci.rayon === "aime" && merci.detail === "vos mots" && merci.emoji === "💬" && merci.citation === TEXTES.merci, `un merci : « vos mots » (${merci?.titre})`);
r = await garder(LEA, SAM.cle, ids.bizarre);
ok(r.corps?.souvenir?.genre === "mot" && r.corps.souvenir.citation === TEXTES.bizarre, "une réponse du modèle qui ne tient pas : les mots, tels quels");
r = await garder(LEA, SAM.cle, ids.mer);
ok(r.statut === 200 && r.corps?.deja === true && r.corps.souvenir?.id === mer?.id, "garder deux fois : déjà sur l'étagère");
ok((await garder(SAM, LEA.cle, ids.mer)).corps?.deja === true, "… Sam aussi");
ok((await garder(LEA, SAM.cle, ids.malade)).statut === 422, "« malade » : ne se range pas (422)");
ok((await garder(LEA, SAM.cle, "inconnu123")).statut === 404, "un message inconnu : 404");
ok((await garder(MAX, LEA.cle, ids.mer)).statut === 403, "Max : 403");
ok((await garder(null, SAM.cle, ids.mer)).statut === 401, "sans session : 401");
const surEtagere = (await obtenir(LEA, `etagere?avec=${SAM.cle}`)).corps?.etagere?.objets ?? [];
ok(surEtagere.length === 5, `pas de limite par jour : cinq souvenirs gardés (${surEtagere.length})`);

// ═══ CHEZ SAM ═══
const vivSam = (await obtenir(SAM, `proches?vivant=${LEA.cle}`)).corps?.vivant?.etagere;
const merSam = vivSam?.objets?.find((o) => o.id === mer?.id);
ok(merSam?.garde === "lui" && merSam.de === "moi" && merSam.message === ids.mer, "chez Sam : gardé par Léa, dit par lui");
ok(vivSam?.nouveaux?.includes(mer?.id), "… nouveau pour lui (il le verra se poser)");
const vivLea = (await obtenir(LEA, `proches?vivant=${SAM.cle}`)).corps?.vivant?.etagere;
ok(!vivLea?.nouveaux?.includes(mer?.id), "Léa l'a déjà vu se poser");
const ouv = (await obtenir(LEA, `proches?ouvrir=${SAM.cle}`)).corps?.ouverture;
ok(ouv?.vivant?.etagere?.objets?.some((o) => o.message === ids.merci), "l'ouverture du salon les donne, avec le message d'où ils viennent");

console.log(echecs ? `\n${echecs} échec(s)` : "\ngarder une bulle, côté serveur : tout est bon");
process.exit(echecs ? 1 : 0);
