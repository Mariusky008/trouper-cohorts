// 😴 PARTI AVANT LA FIN : SA FIGURINE DORT À SA PLACE (26 novembre 2026, demandé par le propriétaire ; `salons-ouverts-
// serveur.ts`, `docs/univers/decouvrir.md`), PAR LA ROUTE — contre le faux Supabase (jamais la vraie base).
//
// Léa et Sam sont dans le salon du manga. Léa part à 1:40 d'une vidéo de 5 minutes : Sam voit sa figurine endormie, à sa
// place (« parti à 1:40 »), jusqu'à la fin de la vidéo. Tom arrive : il prend une autre place. Léa entre dans le salon de
// la musique : sa figurine quitte le salon du manga tout de suite. Partie à la toute fin, ou sans rien dire de la vidéo :
// elle ne dort pas. Le salon se remplit : le dernier arrivé prend la place d'un endormi, qui s'en va.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${F.replace("/rest/v1", "")}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000005d10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-dodo-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const AUTRES = ["Ana", "Ben", "Cléo", "Dan", "Éva", "Fred", "Gil", "Hugo", "Ines"].map((p, k) => qui(10 + k, p));
const GENS = [LEA, SAM, TOM, ...AUTRES];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
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
}
await poserPiece(deposer, "salon", { le: maintenant });

const ROUTE = "/api/direct/salons-ouverts";
const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const entrer = (x, theme = "manga") => appel(x, ROUTE, { action: "entrer", theme });
const sortir = (x, salon, vu = {}) => appel(x, ROUTE, { action: "sortir", salon, ...vu });
const pouls = async (x, salon) => (await appel(x, `${ROUTE}?salon=${encodeURIComponent(salon)}&depuis=${Date.now()}&connus=`)).pouls;
const qDe = async (x, salon) => (await pouls(x, salon))?.ici ?? [];

// ═══ LÉA ET SAM DANS LE SALON DU MANGA ═══
const oL = (await entrer(LEA)).ouverture;
const salon = oL?.salon?.id;
ok(Boolean(salon), `Léa entre dans le salon du manga (${salon})`);
const qLea = oL.moi;
const placeLea = oL.presents.find((p) => p.q === qLea)?.place;
const oS = (await entrer(SAM)).ouverture;
ok(oS?.salon?.id === salon && !oS.dorment, "Sam la rejoint : personne ne dort");

// ═══ 😴 LÉA PART À 1:40 D'UNE VIDÉO DE 5 MINUTES ═══
ok((await sortir(LEA, salon, { t: 100, duree: 300 })).statut === 200, "Léa part à 1:40 d'une vidéo de cinq minutes");
const p1 = await pouls(SAM, salon);
const dodo = p1?.dorment?.find((d) => d.q === qLea);
ok(!p1.ici.includes(qLea) && Boolean(dodo), "Sam : Léa n'est plus là… sa figurine dort");
ok(dodo?.place === placeLea && dodo?.t === 100 && dodo?.prenom === "Léa" && dodo?.figurine?.src, "… à sa place, à 1:40, sa figurine");
ok(Math.abs(dodo.fin - (Date.now() + 200_000)) < 10_000, "… jusqu'à la fin de la vidéo (encore 3:20)");
const oT = (await entrer(TOM)).ouverture;
const placeTom = oT.presents.find((p) => p.q === oT.moi)?.place;
ok(oT.salon.id === salon && placeTom !== placeLea && oT.dorment?.some((d) => d.q === qLea), "Tom arrive : il prend une autre place ; il voit Léa endormie");

// ═══ LÉA ENTRE AILLEURS : ELLE QUITTE LE SALON DU MANGA ═══
const oM = (await entrer(LEA, "musique")).ouverture;
ok(Boolean(oM?.salon?.id), "Léa entre dans le salon de la musique");
ok(!(await pouls(SAM, salon))?.dorment?.some((d) => d.q === qLea), "… sa figurine endormie quitte le salon du manga tout de suite");

// ═══ PAS DE SOMMEIL : À LA FIN, OU SANS LA VIDÉO ═══
await sortir(LEA, oM.salon.id, { t: 297, duree: 300 });
ok(!(await pouls(SAM, salon))?.dorment?.length && !(await entrer(LEA, "musique")).ouverture?.dorment, "partie à la toute fin : elle ne dort pas");
await sortir(LEA, oM.salon.id);
const oM2 = (await entrer(TOM, "musique")).ouverture;
ok(oM2?.salon?.id === oM.salon.id && !oM2.dorment, "partie sans rien dire de la vidéo : elle ne dort pas non plus");
await sortir(TOM, oM.salon.id);

// ═══ LE SALON SE REMPLIT : UN ARRIVANT PREND LA PLACE D'UN ENDORMI ═══
await entrer(TOM);
await sortir(SAM, salon, { t: 30, duree: 600 });
const ici = await qDe(TOM, salon);
const dorment = (await pouls(TOM, salon))?.dorment ?? [];
ok(dorment.some((d) => d.q === oS.moi) && !ici.includes(oS.moi), "Sam part à 0:30 : il dort");
let k = 0;
let derniere = null;
while ((await qDe(TOM, salon)).length < 8 && k < AUTRES.length) {
  derniere = (await entrer(AUTRES[k])).ouverture;
  k++;
}
const presents = await qDe(TOM, salon);
const apres = (await pouls(TOM, salon))?.dorment ?? [];
ok(presents.length === 8 && derniere?.salon?.id === salon, `huit éveillés dans le salon (${k} arrivés)`);
const placeSam = dorment.find((d) => d.q === oS.moi)?.place;
ok(derniere?.presents.find((p) => p.q === derniere.moi)?.place === placeSam && !apres.some((d) => d.q === oS.moi), "le dernier arrivé prend la place de Sam endormi, qui s'en va");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
