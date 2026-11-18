// 🖼️ LES CADRES DE LA PIÈCE DU DUO, CÔTÉ SERVEUR (`docs/univers/salon-du-duo.md`, section 4.9 ; le lot S6) — par les
// routes, contre le faux Supabase, jamais la vraie base (`lib/direct/cadres-serveur.ts`, `/api/direct/cadres`).
//
// Léa et Sam sont proches ; Zoé n'est proche de personne ici. Rien d'accroché : une liste vide. Léa accroche sa photo
// dans le cadre 0 : chez les deux (son adresse signée, sa légende ; « par moi » chez Léa, « par lui » chez Sam) ; le
// pouls bat ; le vivant le dit à Sam. Sam accroche une autre photo dans le cadre 1, puis remplace celle du cadre 0. Une
// vidéo, un écrit : 422 ; un cadre 4, ou « a » : 400 ; un message inconnu : 404 ; Zoé : 403 ; sans session : 401. Sam
// signale une photo accrochée : chez lui, son cadre est vide ; chez Léa, elle reste.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-cadres-route.mjs
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `ca0ca0ca-0000-4000-8000-0000000fa0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-cadres-route-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const GENS = [LEA, SAM, ZOE];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) await json(`profils/${x.cle}.json`, { h: x.id });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const P = paire(LEA, SAM);
let rang = 0;
/** Un message (une photo, une vidéo, un écrit) de `de`, il y a quelques minutes. */
async function message(de, genre, ilYaMin, legende = "") {
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `ca${String(++rang).padStart(10, "0")}`;
  const fiche = { id, de: de.id, le: new Date(ts).toISOString(), genre, tete: null };
  if (genre === "photo") {
    await deposer(`fils/${P}/p/${id}.webp`, PNG, "image/webp");
    Object.assign(fiche, { legende, media: { chemin: `fils/${P}/p/${id}.webp`, l: 800, h: 600 } });
  } else if (genre === "video") {
    await deposer(`fils/${P}/v/${id}.webm`, Buffer.from("faux"), "video/webm");
    await deposer(`fils/${P}/v/${id}.webp`, PNG, "image/webp");
    Object.assign(fiche, { media: { chemin: `fils/${P}/v/${id}.webm`, vignette: `fils/${P}/v/${id}.webp`, l: 640, h: 360, duree: 3, type: "video/webm" } });
  } else Object.assign(fiche, { texte: "Coucou" });
  await json(`fils/${P}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, fiche);
  return id;
}
const plage = await message(LEA, "photo", 30, "La plage");
const gateau = await message(SAM, "photo", 20, "Le gâteau");
const velo = await message(SAM, "photo", 10);
const film = await message(SAM, "video", 8);
const ecrit = await message(LEA, "ecrit", 5);

const cadres = async (q, avec) => {
  const r = await fetch(`${BASE}/api/direct/cadres${avec === undefined ? "" : `?avec=${avec}`}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const accrocher = async (q, avec, message, cadre) => {
  const r = await fetch(`${BASE}/api/direct/cadres`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify({ avec, message, cadre }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const obtenir = async (q, chemin) => (await fetch(`${BASE}/api/direct/${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json().catch(() => ({}));

// ─── rien d'accroché ───
const c0 = await cadres(LEA, SAM.cle);
ok(c0.statut === 200 && Array.isArray(c0.cadres) && c0.cadres.length === 0, "rien d'accroché : une liste vide");

// ─── Léa accroche la plage ───
const n0 = (await obtenir(SAM, `proches?pouls=${LEA.cle}`)).n ?? 0;
const a1 = await accrocher(LEA, SAM.cle, plage, 0);
const p1 = a1.cadres?.[0];
ok(a1.statut === 200 && a1.cadres?.length === 1 && p1?.cadre === 0 && p1.message === plage && /^http/.test(p1.url) && p1.legende === "La plage" && p1.par === "moi" && p1.l === 800, `Léa accroche la plage au cadre 0 (${JSON.stringify(p1)?.slice(0, 140)})`);
const s1 = (await cadres(SAM, LEA.cle)).cadres?.[0];
ok(s1?.message === plage && s1.par === "lui", "chez Sam : la plage, accrochée par Léa");
ok(((await obtenir(SAM, `proches?pouls=${LEA.cle}`)).n ?? 0) > n0, "le pouls bat");
const viv = (await obtenir(SAM, `proches?vivant=${LEA.cle}`)).vivant?.cadres;
ok(viv?.par === "lui" && Boolean(viv.le), "le vivant le dit à Sam");

// ─── Sam en accroche une autre, puis remplace celle du cadre 0 ───
const a2 = await accrocher(SAM, LEA.cle, gateau, 1);
ok(a2.cadres?.map((c) => `${c.cadre}:${c.message}`).join() === `0:${plage},1:${gateau}`, "Sam accroche le gâteau au cadre 1 : deux cadres pleins");
const a3 = await accrocher(SAM, LEA.cle, velo, 0);
ok(a3.cadres?.find((c) => c.cadre === 0)?.message === velo && a3.cadres?.length === 2, "… puis le vélo à la place de la plage (cadre 0)");
const l3 = await cadres(LEA, SAM.cle);
ok(l3.cadres?.find((c) => c.cadre === 0)?.par === "lui" && !l3.cadres?.find((c) => c.cadre === 0)?.legende, "chez Léa : le vélo, par Sam, sans légende");

// ─── ce qui ne s'accroche pas ───
ok((await accrocher(LEA, SAM.cle, film, 2)).statut === 422, "une vidéo : 422");
ok((await accrocher(LEA, SAM.cle, ecrit, 2)).statut === 422, "un écrit : 422");
ok((await accrocher(LEA, SAM.cle, plage, 4)).statut === 400 && (await accrocher(LEA, SAM.cle, plage, "a")).statut === 400, "un cadre 4, ou « a » : 400");
ok((await accrocher(LEA, SAM.cle, "inconnu0001", 2)).statut === 404, "un message inconnu : 404");
ok((await accrocher(ZOE, LEA.cle, plage, 2)).statut === 403 && (await cadres(ZOE, LEA.cle)).statut === 403, "Zoé, pas proche : 403");
ok((await accrocher(null, SAM.cle, plage, 2)).statut === 401 && (await cadres(null, SAM.cle)).statut === 401, "sans session : 401");
ok((await cadres(LEA, SAM.cle)).cadres?.length === 2, "rien n'a changé");

// ─── Sam signale le gâteau ───
await json(`${SAM.id}/paroles-cachees.json`, { ids: [gateau] });
ok(!(await cadres(SAM, LEA.cle)).cadres?.some((c) => c.message === gateau), "Sam signale le gâteau : chez lui, son cadre est vide");
ok((await cadres(LEA, SAM.cle)).cadres?.some((c) => c.message === gateau), "… chez Léa, il reste");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles cadres, côté serveur : tout est bon");
process.exit(echecs ? 1 : 0);
