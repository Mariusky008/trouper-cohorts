// 🚪 LA PIÈCE DU DUO ET 🔥 LA FLAMME (`docs/univers/salon-du-duo.md`, sections 4.12 et 4.13 ; le lot S2, troisième partie)
// — par les routes, contre le faux Supabase, jamais la vraie base (`lib/direct/salon-serveur.ts`, `pouls-serveur.ts`,
// `GET /api/direct/salon?pieces=`, `POST /api/direct/salon { action: "piece" | "venir" }`, `GET /api/direct/proches?ouvrir=`).
//
// Léa (sa maison : la terrasse) et Sam sont proches ; Max non. Trois pièces prêtes : la terrasse, le salon, la cuisine.
// Les pièces : sans session, Max — refusé ; Léa — les trois prêtes, la sienne d'abord, chacune avec sa scène et les
// figurines posées. La première ouverture : la terrasse proposée, pas encore choisie. 🔥 : hier tous les deux, avant-hier
// Léa seule → 1 jour ; aujourd'hui tous les deux → 2 jours. Une pièce inconnue : 400 ; pas prête : 409. Léa installe le
// salon (Sam pas là) : pour les deux, « installé par » chacun. Sam là : une invitation (la pièce ne change pas) ; Sam la
// voit à son pouls ; « Pas maintenant » : Léa voit le refus ; une autre ; « Venir » : la cuisine pour les deux. Plus
// d'invitation : 410 ; une invitation trop vieille : 410.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-pieces-route.mjs
import crypto from "node:crypto";
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).json().catch(() => null);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f70${String(n).padStart(2, "0")}`, jeton: `jeton-salon-pieces-route0${String(n).padStart(2, "0")}`, prenom });
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
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 30, adulte: true });
// (la maison de Léa : la terrasse)
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "terrasse", le: maintenant });
// (trois pièces prêtes, en hauteur ; leurs places relevées)
const piece = (fond) =>
  sharp({ create: { width: 1024, height: 1536, channels: 3, background: fond } })
    .png()
    .toBuffer();
for (const [p, fond] of [["terrasse", { r: 90, g: 160, b: 120 }], ["salon", { r: 120, g: 90, b: 140 }], ["cuisine", { r: 220, g: 190, b: 90 }]]) {
  await deposer(`pieces-duo/${p}/decor.png`, await piece(fond), "image/png");
  await json(`pieces-duo/${p}/releve.json`, { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.7, hauteur: 0.3 }, { x: 0.7, y: 0.7, hauteur: 0.3 }] } });
}
// (leurs figurines du nouveau style, et leurs calques)
const assise = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="330" rx="200" ry="190" fill="#e0a070"/><rect x="355" y="500" width="90" height="70" fill="#e0a070"/><rect x="160" y="550" width="480" height="560" rx="50" fill="#5a3a2a"/></svg>`))
  .png()
  .toBuffer();
const appel = (q, chemin, corps) =>
  fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) } : { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} }).then(async (r) => ({ statut: r.status, corps: await r.json().catch(() => null) }));
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await appel(x, "/api/direct/salon", { action: "calques" });
}
// (🔥 hier, ils se sont écrit tous les deux ; avant-hier, Léa seule — les noms des messages suffisent)
const jour = 86_400_000;
const nomMessage = (ts, h, id) => `${String(ts).padStart(13, "0")}-${qui8(h)}-${id}.json`;
for (const [ts, h, id] of [[Date.now() - 2 * jour, LEA.id, "avanthier1"], [Date.now() - jour, LEA.id, "hierlea001"], [Date.now() - jour + 60_000, SAM.id, "hiersam001"]]) {
  await json(`fils/${PAIRE}/m/${nomMessage(ts, h, id)}`, { id, de: h, le: new Date(ts).toISOString(), genre: "ecrit", texte: "Coucou" });
}

const pieces = (q, cle) => appel(q, `/api/direct/salon?pieces=${cle}`);
const ouvrir = (q, cle) => appel(q, `/api/direct/proches?ouvrir=${cle}`);
const pouls = (q, cle) => appel(q, `/api/direct/proches?pouls=${cle}`);
const choisir = (q, cle, p) => appel(q, "/api/direct/salon", { action: "piece", cle, piece: p });
const venir = (q, cle, oui) => appel(q, "/api/direct/salon", { action: "venir", cle, oui });

// ═══ LES PIÈCES OÙ S'INSTALLER ═══
ok((await pieces(null, SAM.cle)).statut === 403, "les pièces, sans session : refusé");
ok((await pieces(MAX, LEA.cle)).statut === 403, "Max (Léa ne l'a pas ajouté) : refusé");
let r = await pieces(LEA, SAM.cle);
const cat = r.corps?.catalogue;
ok(r.statut === 200 && cat?.pieces?.map((p) => p.cle).join(",") === "terrasse,salon,cuisine", `Léa : les trois pièces prêtes, la sienne d'abord (${cat?.pieces?.map((p) => p.cle)})`);
ok(cat?.proposee === "terrasse" && cat.piece === null, "… la terrasse proposée, le duo n'a pas encore choisi");
const sc0 = cat?.pieces?.[0]?.scene;
ok(sc0?.plaque?.src && sc0.places?.length === 2 && sc0.calques?.a?.corps?.fichier && sc0.calques?.b?.tete?.fichier && sc0.choisie === true, "chacune avec sa scène : sa plaque, ses places, les deux figurines posées");
ok(cat?.pieces?.every((p) => p.nom && p.emoji), "… son nom et son emoji");

// ═══ LA PREMIÈRE OUVERTURE ═══
r = await ouvrir(LEA, SAM.cle);
let sc = r.corps?.ouverture?.scene;
ok(sc?.piece === "terrasse" && sc.choisie === false && !("installePar" in sc), `la première fois : la terrasse proposée (la maison de Léa), pas encore choisie (${sc?.piece}, ${sc?.choisie})`);
ok(r.corps?.ouverture?.flamme?.jours === 1 && r.corps.ouverture.flamme.moi === false && r.corps.ouverture.flamme.lui === false, `🔥 hier tous les deux (avant-hier Léa seule) : 1 jour (${JSON.stringify(r.corps?.ouverture?.flamme)})`);
await appel(LEA, "/api/direct/proches", { action: "ecrire", cle: SAM.cle, texte: "Salut !" });
ok((await ouvrir(LEA, SAM.cle)).corps?.ouverture?.flamme?.moi === true, "Léa a écrit aujourd'hui : `moi`");
await appel(SAM, "/api/direct/proches", { action: "ecrire", cle: LEA.cle, texte: "Salut Léa" });
const fl = (await ouvrir(LEA, SAM.cle)).corps?.ouverture?.flamme;
ok(fl?.jours === 2 && fl.moi && fl.lui, `aujourd'hui tous les deux : 2 jours de suite (${JSON.stringify(fl)})`);

// ═══ S'INSTALLER ═══
ok((await choisir(LEA, SAM.cle, "grenier")).statut === 400, "une pièce inconnue : 400");
ok((await choisir(LEA, SAM.cle, "hangar")).statut === 409, "une pièce pas encore prête : 409");
r = await choisir(LEA, SAM.cle, "salon");
ok(r.statut === 200 && r.corps?.piece === "salon" && !r.corps.invitation, "Léa installe le salon (Sam n'est pas là) : c'est fait");
sc = (await ouvrir(SAM, LEA.cle)).corps?.ouverture?.scene;
ok(sc?.piece === "salon" && sc.choisie === true && sc.installePar === "autre", `Sam ouvre : le salon, installé par Léa (${sc?.piece}, ${sc?.installePar})`);
ok((await ouvrir(LEA, SAM.cle)).corps?.ouverture?.scene?.installePar === "moi", "… pour Léa, installé par elle");
ok((await pouls(SAM, LEA.cle)).corps?.piece === "salon", "le pouls dit la pièce du duo");

// ═══ L'INVITATION ═══
await appel(SAM, "/api/direct/proches", { action: "la" });
r = await choisir(LEA, SAM.cle, "cuisine");
ok(r.statut === 200 && r.corps?.invitation === true && !r.corps.piece, "Sam est là : Léa l'invite dans la cuisine");
ok((await lire(`fils/${PAIRE}/piece.json`))?.piece === "salon", "… la pièce ne change pas encore");
let ps = (await pouls(SAM, LEA.cle)).corps;
ok(ps?.invitation === "cuisine" && ps.piece === "salon", `Sam la voit à son pouls (${JSON.stringify(ps)})`);
ok(!("invitation" in ((await pouls(LEA, SAM.cle)).corps ?? {})), "… pas Léa (c'est elle qui invite)");
ok((await venir(SAM, LEA.cle, false)).statut === 200, "Sam : « Pas maintenant »");
ok((await pouls(LEA, SAM.cle)).corps?.refus === true, "Léa voit son refus");
ok(!("invitation" in ((await pouls(SAM, LEA.cle)).corps ?? {})), "… l'invitation s'efface chez Sam");
ok((await venir(SAM, LEA.cle, true)).statut === 410, "répondre encore : plus d'invitation (410)");
r = await choisir(LEA, SAM.cle, "cuisine");
ok(r.corps?.invitation === true, "Léa l'invite encore");
r = await venir(SAM, LEA.cle, true);
ok(r.statut === 200 && r.corps?.piece === "cuisine", "Sam : « Venir »");
ok((await pouls(LEA, SAM.cle)).corps?.piece === "cuisine" && (await pouls(SAM, LEA.cle)).corps?.piece === "cuisine", "la cuisine, pour les deux");
sc = (await ouvrir(SAM, LEA.cle)).corps?.ouverture?.scene;
ok(sc?.piece === "cuisine" && sc.installePar === "autre", "… installée par Léa (c'est elle qui a invité)");
// (une invitation de plus de deux minutes ne vaut plus)
await json(`fils/${PAIRE}/piece.json`, { piece: "cuisine", le: maintenant, par8: qui8(LEA.id), invitation: { piece: "terrasse", de8: qui8(LEA.id), le: Date.now() - 3 * 60_000 } });
ok(!("invitation" in ((await pouls(SAM, LEA.cle)).corps ?? {})) && (await venir(SAM, LEA.cle, true)).statut === 410, "une invitation trop vieille : ni vue, ni acceptée (410)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nla pièce du duo et la flamme : tout est bon");
process.exit(echecs ? 1 : 0);
