// ⏱️ MESURER L'ENTRÉE DANS UN SALON (« Ta place » sur Découvrir) — contre le faux Supabase lancé avec FAUX_LATENCE
// (jamais la vraie base). Sème Léa et cinq autres déjà assis, puis chronomètre la page `/univers/salons?theme=manga`
// et compte les allers-retours (`/__compte`).
//   FAUX_LATENCE=75 node scripts/faux-supabase.mjs ; (l'appli branchée dessus) ; node scripts/mesurer-entree-salon.mjs
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const SUPA = "http://127.0.0.1:54321";
const F = `${SUPA}/rest/v1`;
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${SUPA}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000007e10${String(n).padStart(2, "0")}`, jeton: `jeton-mesurer-salon-${String(n).padStart(2, "0")}`, prenom });
const GENS = ["Léa", "Ana", "Ben", "Cléo", "Dan", "Éva"].map((p, k) => qui(k + 1, p));
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 120, g: 60, b: 40, alpha: 1 } } }).png().toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
}
await poserPiece(deposer, "salon", { le: maintenant });
const page = async (x, theme = "manga") => {
  const t = Date.now();
  const r = await fetch(`${BASE}/univers/salons?theme=${theme}`, { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  await r.text();
  return { statut: r.status, ms: Date.now() - t };
};
const compte = async (zero) => (await fetch(`${SUPA}/__compte${zero ? "?zero=1" : ""}`)).json();
// (les cinq autres s'assoient d'abord ; la première fois compile aussi la page)
for (const x of GENS.slice(1)) await page(x);
for (const theme of ["manga", "manga", "foot"]) {
  await compte(true);
  const r = await page(GENS[0], theme);
  console.log(`Léa entre (${theme}) : ${r.statut}, ${r.ms} ms`, JSON.stringify(await compte()));
}
// (et ce que l'ouverture de l'appli demande : la page, puis ses routes, une à une)
const chrono = async (x, chemin, corps) => {
  await compte(true);
  const t = Date.now();
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  await r.text();
  console.log(`${chemin}${corps ? " " + JSON.stringify(corps) : ""} : ${r.status}, ${Date.now() - t} ms`, JSON.stringify(await compte()));
};
for (const tour of [1, 2]) {
  if (tour === 2) console.log("— deuxième fois —");
  await chrono(GENS[0], "/collection");
  await chrono(GENS[0], "/api/direct/fil-decouvrir");
  await chrono(GENS[0], "/api/direct/ma-figurine");
  await chrono(GENS[0], "/api/direct/activite?compter=1");
  await chrono(GENS[0], "/api/direct/proches", { action: "la" });
}
