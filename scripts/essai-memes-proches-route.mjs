// 🎭 LE MÈME ENVOYÉ À UN PROCHE (la nouvelle interface, lot 4), PAR LES ROUTES — contre le faux Supabase, jamais la vraie
// base (`lib/direct/memes-proches-serveur.ts`, `POST /api/direct/proches { action: "meme" }`).
//
// Marc et Inès sont proches (dans les deux sens) ; Nico a ajouté Marc, pas l'inverse. Marc a un mème (le sien) ; Inès en a
// un aussi. Marc envoie le sien à Inès : rangé dans leur conversation ; pas à Nico (pas proches) ; pas le mème d'Inès
// (pas le sien) ; pas un mème qui n'existe pas. Chez Inès : Marc a 1 non lu, « 🎭 » en dernier ; leur conversation :
// le mème (sa figurine, ses mots, de Marc, nouveau) ; relu, il n'est plus nouveau.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-memes-proches-route.mjs
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const MARC = { id: "abababab-0000-4000-8000-000000000f01", jeton: "jeton-marc-memes-proches-01", prenom: "Marc" };
const INES = { id: "abababab-0000-4000-8000-000000000f02", jeton: "jeton-ines-memes-proches-01", prenom: "Inès" };
const NICO = { id: "abababab-0000-4000-8000-000000000f03", jeton: "jeton-nico-memes-proches-01", prenom: "Nico" };
const GENS = [MARC, INES, NICO];
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
await json(`${MARC.id}/proches.json`, { ids: [INES.id] });
await json(`${INES.id}/proches.json`, { ids: [MARC.id] });
await json(`${NICO.id}/proches.json`, { ids: [MARC.id] });
// (leurs mèmes : un message-mème chacun, sa vidéo rangée à côté)
const MEME_MARC = "mememarc0001";
const MEME_INES = "memeines0001";
await semer("clik_figurine_message", [
  { id: MEME_MARC, habitant_id: MARC.id, texte: "Moi le lundi matin", son: `${MARC.id}/m-${MEME_MARC}.wav`, duree: 3, commerces: [], created_at: maintenant },
  { id: MEME_INES, habitant_id: INES.id, texte: "Coucou", son: `${INES.id}/m-${MEME_INES}.wav`, duree: 2, commerces: [], created_at: maintenant },
]);
await deposer(`${MARC.id}/meme-${MEME_MARC}.mp4`, Buffer.from("video"), "video/mp4");
await json(`${MARC.id}/m-${MEME_MARC}.json`, { meme: `${MARC.id}/meme-${MEME_MARC}.mp4`, memeType: "video/mp4" });

const ROUTE = `${BASE}/api/direct/proches`;
const faire = async (qui, corps) => {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (qui, q = "") => {
  const r = await fetch(`${ROUTE}${q}`, { headers: { cookie: `clikme_habitant=${qui.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ═══ ENVOYER ═══
ok((await faire(MARC, { action: "meme", cle: INES.cle, id: MEME_MARC })).statut === 200, "Marc envoie son mème à Inès");
ok((await faire(MARC, { action: "meme", cle: INES.cle, id: MEME_MARC })).statut === 200, "(deux fois : il n'est rangé qu'une fois)");
ok((await faire(MARC, { action: "meme", cle: NICO.cle, id: MEME_MARC })).statut === 403, "à Nico (ils ne se sont pas ajoutés tous les deux) : refusé");
ok((await faire(MARC, { action: "meme", cle: INES.cle, id: MEME_INES })).statut === 403, "le mème d'Inès (pas le sien) : refusé");
ok((await faire(MARC, { action: "meme", cle: INES.cle, id: "pasunmeme00" })).statut === 400 && (await faire(MARC, { action: "meme", cle: "0123456789abcdef", id: MEME_MARC })).statut === 404, "un mème qui n'en est pas un, un proche qui n'existe pas : refusés");
const range = await lire(`fils/${[MARC.id, INES.id].sort().join("_")}/memes.json`);
ok(range?.liste?.length === 1 && range.liste[0].id === MEME_MARC && range.liste[0].de === MARC.id, "rangé dans leur conversation, une fois");

// ═══ CHEZ INÈS ═══
const liste = await voir(INES);
const marc = liste.proches?.find((p) => p.cle === MARC.cle);
ok(marc?.nonLus === 1 && marc.dernier?.meme === true && marc.dernier.moi === false, `chez Inès : Marc, 1 non lu, « 🎭 » en dernier (${JSON.stringify(marc?.dernier)})`);
const fil = (await voir(INES, `?fil=${MARC.cle}`)).fil;
const m = fil?.memes?.[0];
ok(fil?.memes?.length === 1 && m.id === MEME_MARC && m.moi === false && m.nouveau === true && m.texte === "Moi le lundi matin" && /^http/.test(m.image) && /^http/.test(m.video ?? "") && m.lien === `/figurine/${MEME_MARC}`, "leur conversation : le mème de Marc (sa figurine, ses mots, sa vidéo, son lien), nouveau");
ok((await voir(INES)).proches?.find((p) => p.cle === MARC.cle)?.nonLus === 0 && !(await voir(INES, `?fil=${MARC.cle}`)).fil?.memes?.[0]?.nouveau, "relu : plus de non lu, plus « nouveau »");
const filMarc = (await voir(MARC, `?fil=${INES.cle}`)).fil;
ok(filMarc?.memes?.[0]?.moi === true && !filMarc.memes[0].nouveau, "chez Marc : son mème, dans leur conversation");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle mème envoyé à un proche tient ✓");
process.exit(echecs ? 1 : 0);
