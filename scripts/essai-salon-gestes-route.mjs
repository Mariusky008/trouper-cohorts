// 🛋️ LES GESTES DU SALON, CÔTÉ SERVEUR (`docs/univers/salon-du-duo.md`, section 4.4 ; le lot S3) — par les routes,
// contre le faux Supabase, jamais la vraie base (`lib/direct/vivant-serveur.ts`, `POST /api/direct/proches
// { action: "geste", type: "geste" }`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Un geste du salon (un bisou) part et revient avec son
// type ; un geste inconnu, une surprise sans ce qu'elle cache ou avec une surprise inventée : 400 ; Max : 403. La fleur,
// le café et la surprise posent un objet sur leur table (la tulipe, le café, l'ourson), les quatre derniers seulement,
// chacun avec l'identifiant de son geste. L'ouverture du salon rend la table, vue de chacun (`moi`). Les gestes de Sam
// sont nouveaux pour Léa une fois (la lecture suivante ne les redit pas), les siens jamais. Chaque geste fait battre le
// pouls. Les panneaux et les réactions d'avant marchent toujours.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-gestes-route.mjs
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
  return r.ok ? r.json() : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f70${String(n).padStart(2, "0")}`, jeton: `jeton-salon-gestes-route-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const MAX = qui(3, "Max");
const GENS = [LEA, SAM, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);
const PAIRE = [LEA.id, SAM.id].sort().join("_");
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

const poster = async (q, corps) => {
  const r = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const geste = (q, cle, quoi, plus = {}) => poster(q, { action: "geste", cle, type: "geste", quoi, ...plus });
const obtenir = async (q, requete) => {
  const r = await fetch(`${BASE}/api/direct/proches?${requete}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const pouls = async (q, cle) => (await obtenir(q, `pouls=${cle}`)).corps;
const attendreQue = async (f, ms = 4000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f()) return true;
    await pause(150);
  }
  return false;
};

// ═══ UN GESTE DU SALON ═══
let n0 = (await pouls(LEA, SAM.cle))?.n ?? 0;
let r = await geste(SAM, LEA.cle, "bisou");
ok(r.statut === 200 && r.corps?.geste?.type === "geste" && r.corps.geste.cle === "bisou" && r.corps.geste.moi === true && !r.corps.geste.objet, `Sam envoie un bisou (${JSON.stringify(r.corps?.geste)})`);
const bisou = r.corps?.geste;
ok(await attendreQue(async () => ((await pouls(LEA, SAM.cle))?.n ?? 0) > n0), "le pouls bat");
ok((await geste(SAM, LEA.cle, "pirouette")).statut === 400, "un geste inconnu : 400");
ok((await geste(SAM, LEA.cle, "surprise")).statut === 400, "une surprise sans ce qu'elle cache : 400");
ok((await geste(SAM, LEA.cle, "surprise", { surprise: "voiture" })).statut === 400, "une surprise inventée : 400");
ok((await geste(MAX, LEA.cle, "bisou")).statut === 403, "Max (Léa ne l'a pas ajouté) : 403");
ok((await poster(SAM, { action: "geste", cle: LEA.cle, type: "geste", quoi: "coucou" })).statut === 200, "un coucou");

// ═══ LA TABLE ═══
r = await geste(SAM, LEA.cle, "fleur");
const fleur = r.corps?.geste;
ok(r.statut === 200 && fleur?.objet?.e === "🌷" && fleur.objet.nom === "une tulipe", `la fleur pose une tulipe (${JSON.stringify(fleur?.objet)})`);
let table = await lire(`fils/${PAIRE}/table.json`);
ok(table?.objets?.length === 1 && table.objets[0].id === fleur?.id && table.objets[0].e === "🌷" && /^[0-9a-f]{8}$/.test(table.objets[0].de8) && !JSON.stringify(table).includes(SAM.id), "sur leur table : la tulipe, avec l'identifiant de son geste (et 8 signes, jamais l'identifiant de Sam)");
r = await geste(LEA, SAM.cle, "cafe");
ok(r.statut === 200 && r.corps?.geste?.objet?.e === "☕", "Léa sert un café");
r = await geste(LEA, SAM.cle, "surprise", { surprise: "ourson" });
const surprise = r.corps?.geste;
ok(r.statut === 200 && surprise?.cle === "surprise" && surprise.objet?.e === "🧸" && surprise.objet.nom === "un ourson", `la surprise laisse un ourson (${JSON.stringify(surprise?.objet)})`);
ok((await geste(LEA, SAM.cle, "check")).statut === 200 && (await lire(`fils/${PAIRE}/table.json`))?.objets?.length === 3, "un check ne pose rien");
await geste(SAM, LEA.cle, "cafe");
await geste(LEA, SAM.cle, "fleur");
table = await lire(`fils/${PAIRE}/table.json`);
ok(table?.objets?.length === 4 && !table.objets.some((o) => o.id === fleur?.id) && table.objets.at(-1).e === "🌷", `cinq objets posés : les quatre derniers restent (${table?.objets?.map((o) => o.e).join(" ")})`);

// ═══ L'OUVERTURE : LA TABLE, VUE DE CHACUN ═══
const vueDe = async (q, cle) => (await obtenir(q, `ouvrir=${cle}`)).corps?.ouverture?.table ?? [];
const tLea = await vueDe(LEA, SAM.cle);
const tSam = await vueDe(SAM, LEA.cle);
ok(tLea.length === 4 && tLea.map((o) => o.e).join("") === "☕🧸☕🌷", `Léa ouvre : la table, du plus ancien au plus récent (${tLea.map((o) => o.e).join(" ")})`);
ok(
  tLea.find((o) => o.id === surprise?.id)?.moi === true && tSam.find((o) => o.id === surprise?.id)?.moi === false && tLea.every((o) => typeof o.le === "string" && !("de8" in o)),
  "l'ourson est à Léa chez elle, pas chez Sam (et rien de plus que ce qu'il faut)",
);

// ═══ CE QUI EST NOUVEAU ═══
// (Léa a déjà ouvert : les gestes de Sam d'avant sont vus ; Sam en fait deux de plus)
await geste(SAM, LEA.cle, "calin");
await poster(SAM, { action: "geste", cle: LEA.cle, type: "panneau", quoi: "jarrive" });
let v = (await obtenir(LEA, `vivant=${SAM.cle}`)).corps?.vivant;
const nouveaux = (v?.gestes ?? []).filter((g) => g.nouveau);
ok(nouveaux.length === 2 && nouveaux.every((g) => !g.moi) && nouveaux.map((g) => g.cle).join(",") === "calin,jarrive", `les deux derniers gestes de Sam sont nouveaux pour Léa (${nouveaux.map((g) => g.cle).join(", ")})`);
ok((v?.gestes ?? []).some((g) => g.id === bisou?.id && !g.nouveau), "le bisou d'avant ne l'est plus");
v = (await obtenir(LEA, `vivant=${SAM.cle}`)).corps?.vivant;
ok((v?.gestes ?? []).every((g) => !g.nouveau), "relus : plus rien de nouveau (rien n'est rejoué deux fois)");
// (Sam a ouvert le salon plus haut : ce que Léa avait fait avant est vu ; elle lance la danse)
await geste(LEA, SAM.cle, "danser");
v = (await obtenir(SAM, `vivant=${LEA.cle}`)).corps?.vivant;
const pourSam = (v?.gestes ?? []).filter((g) => g.nouveau);
ok(pourSam.length === 1 && pourSam[0].cle === "danser" && !pourSam[0].moi, `chez Sam : la danse de Léa est nouvelle, rien de ce qu'il a vu en ouvrant, jamais les siens (${pourSam.map((g) => g.cle).join(", ")})`);
const vus = await lire(`${LEA.id}/gestes-vus.json`);
ok(vus && typeof vus[PAIRE] === "number", "la trace de Léa est rangée chez elle");

// ═══ CE QUI MARCHAIT AVANT ═══
r = await poster(LEA, { action: "geste", cle: SAM.cle, type: "panneau", quoi: "merci" });
ok(r.statut === 200 && r.corps?.geste?.type === "panneau", "un panneau, comme avant");
r = await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "On se voit demain ?" });
const id = r.corps?.message?.id;
r = await poster(LEA, { action: "geste", cle: SAM.cle, type: "reaction", quoi: "coeur", message: id });
ok(r.statut === 200 && r.corps?.geste?.type === "reaction" && r.corps.geste.message === id, "une réaction sur un message, comme avant");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles gestes du salon, côté serveur : tout est bon");
process.exit(echecs ? 1 : 0);
