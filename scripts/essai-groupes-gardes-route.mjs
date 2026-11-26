// 💛 MES GROUPES, « ON GARDE CE GROUPE ? » ET TOUS MES GROUPES (le lot G4, 26 novembre 2026 ; `docs/univers/mes-groupes.md`),
// PAR LA ROUTE — contre le faux Supabase.
//
// Léa propose une soirée foot ; Zoé et Tom prennent leur place. Trop tôt pour garder le groupe. La séance finie : ceux qui
// avaient leur place voient « On garde ce groupe ? » (pas Sam). Léa garde : le groupe attend un deuxième ; Zoé garde : il
// naît, il est dans « Tous mes groupes » de Léa et de Zoé, et Tom voit leurs coches. Son salon : à ses membres seulement ;
// Zoé y entre (Léa la voit « dans le salon »), en sort (Léa voit son passage). Léa crée un groupe avec ses proches : Sam
// (son proche) est invité, Zoé (pas une proche) non ; Sam le garde. Trois groupes au plus.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).json().catch(() => null);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006b72${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-gardes-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const GENS = [LEA, SAM, ZOE, TOM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, accord_le: maintenant, prete_le: maintenant })));
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
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
}
// (Léa ↔ Sam : proches des deux côtés ; Zoé et Tom : de personne)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const GROUPES = "/api/direct/mes-groupes";
const vue = (x) => appel(x, GROUPES);
const geste = (x, corps) => appel(x, GROUPES, corps);
const salons = (x, corps) => appel(x, "/api/direct/salons-ouverts", corps);
const cleDe = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_SAM = await cleDe(SAM);
const CLE_ZOE = await cleDe(ZOE);
await cleDe(LEA);

// ═══ LA PROPOSITION ; TROP TÔT POUR GARDER ═══
const p = (await geste(LEA, { action: "proposer", nom: "Soirée foot", theme: "foot", quand: Date.now(), pour: "tous", places: 8, mot: "Venez !" })).proposition;
ok(p?.id, "Léa propose « Soirée foot », maintenant");
ok((await geste(ZOE, { action: "confirmer", id: p.id })).proposition?.jY, "Zoé prend sa place");
ok((await geste(TOM, { action: "confirmer", id: p.id })).proposition?.jY, "Tom prend sa place");
const tot = await geste(LEA, { action: "garder", id: p.id });
ok(tot.statut === 409 && !(await vue(LEA)).propositions.find((x) => x.id === p.id)?.garder, `trop tôt pour garder (${tot.statut})`);

// ═══ LA SÉANCE EST FINIE (une heure plus tard) ═══
const fiche = await lire(`groupes/propositions/${p.id}.json`);
await json(`groupes/propositions/${p.id}.json`, { ...fiche, quand: Date.now() - 60 * 60_000 });
const cL = (await vue(LEA)).propositions.find((x) => x.id === p.id);
ok(cL?.garder && cL.garder.gardes.length === 0 && !cL.garder.moi, "Léa : « On garde ce groupe ? », personne n'a encore gardé");
ok(!(await vue(SAM)).propositions.find((x) => x.id === p.id)?.garder, "Sam (sans place) : pas de question");
const g1 = await geste(LEA, { action: "garder", id: p.id });
ok(g1.statut === 200 && g1.proposition?.garder?.moi && !g1.proposition.garder.groupe && !g1.groupe, "Léa garde : le groupe attend un deuxième");
ok(!((await vue(LEA)).groupes ?? []).length, "… pas encore dans Tous mes groupes");
const g2 = await geste(ZOE, { action: "garder", id: p.id });
const GID = g2.groupe?.id;
ok(g2.statut === 200 && GID && g2.proposition?.garder?.groupe === GID, `Zoé garde : le groupe naît (${GID})`);
ok(g2.groupe?.nom === "Soirée foot" && g2.groupe.mot === "Venez !" && g2.groupe.theme === "foot" && g2.groupe.membres.map((m) => m.prenom).join(",") === "Léa,Zoé", "son nom, son mot, sa passion, ses deux membres");
const vL = await vue(LEA);
ok(vL.groupes?.some((g) => g.id === GID) && !vL.propositions.some((x) => x.id === p.id), "Léa : il est dans Tous mes groupes, la carte de fin s'en va");
const cT = (await vue(TOM)).propositions.find((x) => x.id === p.id);
ok(cT?.garder?.gardes.length === 2 && cT.garder.groupe === GID && !cT.garder.moi, "Tom voit les deux coches, et peut encore le garder");
ok(!((await vue(SAM)).groupes ?? []).some((g) => g.id === GID), "Sam ne le voit pas (un groupe n'est visible que par ses membres)");

// ═══ SON SALON : À SES MEMBRES SEULEMENT ═══
const SALON = `groupe-${GID}`;
ok((await salons(SAM, { action: "entrer-groupe", groupe: GID })).statut === 404, "Sam ne peut pas entrer dans son salon");
ok((await appel(SAM, `/api/direct/salons-ouverts?salon=${SALON}`)).statut === 403, "… ni écouter son pouls");
const eZ = await salons(ZOE, { action: "entrer-groupe", groupe: GID });
ok(eZ.statut === 200 && eZ.ouverture?.salon.id === SALON && /Soirée foot/.test(eZ.ouverture.salon.nom), `Zoé entre dans le salon du groupe (« ${eZ.ouverture?.salon.nom} »)`);
const gL = (await vue(LEA)).groupes.find((g) => g.id === GID);
ok(gL?.ici.map((x) => x.prenom).join(",") === "Zoé", "Léa la voit dans le salon (Mes groupes actifs)");
ok((await salons(ZOE, { action: "ecrire", salon: SALON, sorte: "texte", texte: "Coucou le groupe" })).statut === 200, "Zoé écrit dans le salon du groupe");
ok((await salons(ZOE, { action: "sortir", salon: SALON })).statut === 200, "Zoé sort");
const gL2 = (await vue(LEA)).groupes.find((g) => g.id === GID);
ok(gL2?.ici.length === 0 && gL2.passage?.prenom === "Zoé", "Léa voit son passage (« 🕑 Passage de Zoé à … »)");

// ═══ UN GROUPE AVEC MES PROCHES ═══
const lien = await geste(LEA, { action: "creer-groupe", nom: "Allez sur www.site.fr", theme: "humour", cles: [CLE_SAM] });
ok(lien.statut === 400, "un nom avec un lien ne passe pas");
const c1 = await geste(LEA, { action: "creer-groupe", nom: "Les copains", theme: "humour", mot: "Des fous rires", cles: [CLE_SAM, CLE_ZOE] });
const CID = c1.groupe?.id;
ok(c1.statut === 200 && CID && c1.groupe.membres.length === 1, "Léa crée « Les copains » : il existe tout de suite pour elle");
ok(!((await vue(ZOE)).groupes ?? []).some((g) => g.id === CID), "Zoé (pas une proche) n'est pas invitée");
const iS = (await vue(SAM)).groupes?.find((g) => g.id === CID);
ok(iS?.invite?.de === "Léa", "Sam (son proche) est invité : « Léa te propose ce groupe »");
const gS = await geste(SAM, { action: "garder-groupe", groupe: CID });
ok(gS.statut === 200 && gS.groupe?.membres.length === 2 && !gS.groupe.invite, "Sam le garde : ils sont deux");
ok(!(await vue(SAM)).groupes.find((g) => g.id === CID)?.invite, "… et l'invitation s'en va");

// ═══ TROIS GROUPES AU PLUS ═══
ok((await geste(LEA, { action: "creer-groupe", nom: "Le troisième", theme: "musique", cles: [CLE_SAM] })).statut === 200, "Léa crée un troisième groupe");
const trop = await geste(LEA, { action: "creer-groupe", nom: "Le quatrième", theme: "foot", cles: [CLE_SAM] });
ok(trop.statut === 409 && /3 groupes/.test(trop.error ?? ""), `pas un quatrième (« ${trop.error} »)`);

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\n« On garde ce groupe ? » et Tous mes groupes tiennent ✓");
process.exit(echecs ? 1 : 0);
