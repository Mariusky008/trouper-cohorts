// 🧹 LE NETTOYAGE DU STOCKAGE, PAR LA TÂCHE DE LA NUIT — contre le faux Supabase, jamais la vraie base
// (`lib/direct/nettoyage-serveur.ts`, `GET /api/cron/direct-nettoyage`).
//
// Léa et Sam sont proches ; Sam et Max aussi. Dans leurs conversations : des messages avec leurs fichiers (une photo,
// une vidéo et sa vignette, l'aperçu d'un lien), ce qui doit RESTER ; des dépôts jamais envoyés (une vraie photo
// déposée par la route, sans être envoyée ; d'autres, une photo et une vidéo) et des fichiers qu'aucun message ne cite
// (une photo, une vidéo et sa vignette, un aperçu), ce qui doit PARTIR ; et ce qu'on ne touche jamais (un nom inattendu,
// une voix, l'étagère). DE MOINS DE 24 HEURES : rien ne part. « 25 heures plus tard » (`?dans=25`) : les dépôts et les
// fichiers sans message partent, le reste reste ; le bilan et la mesure du jour (page admin des mèmes). UNE SECONDE
// FOIS : plus rien. LE FREIN (`CLIKME_NETTOYAGE=0`, une seconde app) : rien ne part.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-nettoyage-route.mjs
import crypto from "node:crypto";
import { lancerSecondeApp } from "./seconde-app.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const existe = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).status === 200;
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");
const jourParis = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `ebebebeb-0000-4000-8000-0000000f40${String(n).padStart(2, "0")}`, jeton: `jeton-nettoyage-route-0000${String(n).padStart(2, "0")}`, prenom });
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
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, MAX.id] });
await json(`${MAX.id}/proches.json`, { ids: [SAM.id] });

// ─── leurs conversations ───
const LS = `fils/${paire(LEA, SAM)}`;
const SM = `fils/${paire(SAM, MAX)}`;
const ts = Date.now() - 3600_000;
const message = (id, x) => json(`${LS}/m/${String(ts).padStart(13, "0")}-${qui8(LEA.id)}-${id}.json`, { id, de: LEA.id, le: maintenant, tete: null, ...x });
// ce qui RESTE : des messages et leurs fichiers
await message("photogardee1", { genre: "photo", media: { chemin: `${LS}/p/photogardee1.webp`, l: 10, h: 10 } });
await message("videogardee1", { genre: "video", media: { chemin: `${LS}/v/videogardee1.mp4`, vignette: `${LS}/v/videogardee1.webp`, l: 10, h: 10, duree: 4, type: "video/mp4" } });
await message("lienapercu01", { genre: "ecrit", texte: "https://site.fr", lien: { url: "https://site.fr", site: "site.fr", titre: "Un site", image: `${LS}/a/lienapercu01.webp` } });
const GARDES = [`${LS}/p/photogardee1.webp`, `${LS}/v/videogardee1.mp4`, `${LS}/v/videogardee1.webp`, `${LS}/a/lienapercu01.webp`];
for (const c of GARDES) await deposer(c, Buffer.from("x".repeat(2048)), c.endsWith(".mp4") ? "video/mp4" : "image/webp");
// ce qu'on ne touche JAMAIS : un nom inattendu, une voix, l'étagère
const JAMAIS = [`${LS}/p/notes.txt`, `${LS}/s/voixdelea001.webm`, `${LS}/etagere.json`];
for (const c of JAMAIS) await deposer(c, Buffer.from("garde-moi"), "application/octet-stream");
// ce qui PART : des dépôts jamais envoyés, des fichiers qu'aucun message ne cite
const DEPOTS = [`${LS}/p/${qui8(LEA.id)}-photojamais1-brut`, `${LS}/v/${qui8(SAM.id)}-videojamais1-brut.mov`, `${SM}/v/${qui8(MAX.id)}-videojamais2-brut.webm`];
const ORPHELINS = [`${LS}/p/photoseule01.webp`, `${LS}/v/videoseule01.mp4`, `${LS}/v/videoseule01.webp`, `${LS}/a/apercuseul01.webp`];
for (const c of [...DEPOTS, ...ORPHELINS]) await deposer(c, Buffer.from("y".repeat(10_240)), "application/octet-stream");
// et une vraie photo déposée par la route, jamais envoyée (la feuille fermée)
const poster = async (q, corps) => {
  const r = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const d = await poster(LEA, { action: "photo-depot", cle: SAM.cle });
const put = d.jeton ? await fetch(`${STOCK}/upload/sign/${d.seau}/${d.chemin}?token=${d.jeton}`, { method: "PUT", headers: { "content-type": "image/webp" }, body: Buffer.from("z".repeat(4096)) }) : null;
ok(put?.status === 200 && (await existe(d.chemin)), `une vraie photo déposée par la route, jamais envoyée (${d.chemin})`);
const PARTENT = [...DEPOTS, ...ORPHELINS, d.chemin];

const nettoyer = async (dans = 0, base = BASE) => {
  const r = await fetch(`${base}/api/cron/direct-nettoyage${dans ? `?dans=${dans}` : ""}`);
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const presents = async (l) => (await Promise.all(l.map(existe))).filter(Boolean).length;

// ═══ DE MOINS DE 24 HEURES : RIEN NE PART ═══
const b0 = await nettoyer();
ok(b0.statut === 200 && b0.ok && b0.fini && b0.depots === 0 && b0.orphelins === 0 && b0.paires >= 2, `tout a moins de 24 heures : rien ne part (${b0.paires} conversations lues)`);
ok((await presents(PARTENT)) === PARTENT.length, "les dépôts et les fichiers sans message sont encore là");

// ═══ LE FREIN ═══
const seconde = await lancerSecondeApp({ port: 3828, env: { CLIKME_NETTOYAGE: "0" } });
try {
  const bf = await nettoyer(25, seconde.base);
  ok(bf.frein === true && bf.depots === 0 && (await presents(PARTENT)) === PARTENT.length, "le frein serré (CLIKME_NETTOYAGE=0) : rien ne part");
} finally {
  seconde.arreter();
}

// ═══ 25 HEURES PLUS TARD ═══
const b1 = await nettoyer(25);
ok(b1.statut === 200 && b1.fini && b1.depots === 4 && b1.orphelins === 4 && b1.ratees === 0, `25 heures plus tard : ${b1.depots} dépôts jamais envoyés, ${b1.orphelins} fichiers sans message effacés`);
ok((await presents(PARTENT)) === 0, "les dépôts (la vraie photo aussi) et les fichiers sans message sont partis, dans les deux conversations");
ok((await presents(GARDES)) === GARDES.length, "les fichiers des messages restent (la photo, la vidéo et sa vignette, l'aperçu du lien)");
ok((await presents(JAMAIS)) === JAMAIS.length, "un nom inattendu, une voix, l'étagère : jamais touchés");
ok(b1.ko >= 40, `la place rendue : ${b1.ko} Ko`);
const st = await lire(`stats/messages/${jourParis}.json`);
ok(st?.nettoyes >= 8 && st.nettoyesKo >= 40, `la mesure du jour (page admin des mèmes) : ${st?.nettoyes} fichiers, ${st?.nettoyesKo} Ko`);

// ═══ UNE SECONDE FOIS : PLUS RIEN ═══
const b2 = await nettoyer(25);
ok(b2.depots === 0 && b2.orphelins === 0 && (await presents(GARDES)) === GARDES.length, "une seconde fois : plus rien à effacer, rien de ce qui reste n'est touché");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle nettoyage tient, par la tâche de la nuit ✓");
process.exit(echecs ? 1 : 0);
