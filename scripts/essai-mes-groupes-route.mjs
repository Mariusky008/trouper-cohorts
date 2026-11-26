// 👥 MES GROUPES, LES PROPOSITIONS (le lot G2, 26 novembre 2026 ; `docs/univers/mes-groupes.md`), PAR LA ROUTE — contre le
// faux Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// « On se retrouve ? » : Léa propose une soirée foot ce soir, pour tout le monde, avec une vidéo de sa télé du jour — elle
// a sa place (« 1/8 », jamais « 0/8 ») ; Zoé (une inconnue, adulte) la voit et confirme sa place, puis propose une autre
// heure ; Léa la prend. Noé (15-17 ans) ne la voit pas, et ne peut proposer qu'entre proches. Un nom avec un lien ne
// passe pas. Trop tôt pour entrer : on attend. Entre proches, tout de suite : Sam (son proche) la voit, Zoé non ; Sam
// entre — d'abord sa place, puis il est invité chez Léa, avec la vidéo. Trois signalements : la proposition disparaît.
// Trois propositions à venir au plus. Le fil de Découvrir de Zoé montre « On se retrouve ? ».
import sharp from "sharp";
import crypto from "node:crypto";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006a71${String(n).padStart(2, "0")}`, jeton: `jeton-mes-groupes-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const NOE = qui(5, "Noé");
const GENS = [LEA, SAM, ZOE, TOM, NOE];
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
  await json(`${x.id}/majeur.json`, x === NOE ? { age: 16, adulte: false, le: maintenant } : { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
}
// (Léa ↔ Sam : proches des deux côtés ; Zoé, Tom et Noé : de personne)
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
const groupes = (x) => appel(x, GROUPES);
const geste = (x, corps) => appel(x, GROUPES, corps);
const cleDe = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_LEA = await cleDe(LEA);
await cleDe(SAM);
ok(Boolean(CLE_LEA), "la clé de Léa");

// ═══ RIEN ENCORE : PAS DE RANGÉE VIDE ═══
const g0 = await groupes(LEA);
ok(g0.statut === 200 && Array.isArray(g0.propositions) && g0.propositions.length === 0 && g0.adulte === true, "Léa : aucune proposition, et elle est adulte");
ok((await groupes(NOE)).adulte === undefined, "Noé : 15-17 ans (pas « adulte »)");
ok((await appel(null, GROUPES)).statut === 401, "sans compte : rien");

// ═══ 📣 LÉA PROPOSE, POUR TOUT LE MONDE ═══
const V = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0];
ok(V?.id, `une vidéo de sa télé du jour (« ${V?.titre} »)`);
const dans3h = Date.now() + 3 * 3600_000;
ok((await geste(LEA, { action: "proposer", nom: "Viens sur https://site.fr", theme: "foot", quand: dans3h, pour: "tous", places: 8 })).statut === 400, "un nom avec un lien ne passe pas");
ok((await geste(LEA, { action: "proposer", nom: "Soirée foot", theme: "rien", quand: dans3h, pour: "tous", places: 8 })).statut === 400, "une passion qui n'existe pas : non");
ok((await geste(LEA, { action: "proposer", nom: "Soirée foot", theme: "foot", quand: Date.now() + 30 * 24 * 3600_000, pour: "tous", places: 8 })).statut === 400, "dans un mois : non (deux semaines au plus)");
const p1 = await geste(LEA, { action: "proposer", nom: "Soirée foot", theme: "foot", video: V.id, quand: dans3h, pour: "tous", places: 8, mot: "Tout le monde est bienvenu !" });
const P1 = p1.proposition;
ok(p1.statut === 200 && P1?.id && P1.mienne && P1.video?.id === V.id && P1.places === 8, "Léa propose « Soirée foot », avec sa vidéo, 8 places");
ok(P1?.confirmes?.length === 1 && P1.confirmes[0].prenom === "Léa" && P1.confirmes[0].src, "… elle a sa place, avec sa figurine : 1/8 (jamais 0/8)");
ok(!P1?.ouverte, "… dans trois heures : pas encore ouverte");
ok((await geste(LEA, { action: "entrer", id: P1.id })).statut === 409, "entrer trop tôt : « Pas encore »");

// ═══ ZOÉ (UNE INCONNUE) LA VOIT ; NOÉ (15-17 ANS) NON ═══
const vZ = (await groupes(ZOE)).propositions?.find((p) => p.id === P1.id);
ok(vZ && !vZ.mienne && vZ.de === "Léa" && !vZ.jY, "Zoé voit la proposition de Léa (« Proposé par Léa »)");
ok(!(await groupes(NOE)).propositions?.some((p) => p.id === P1.id), "Noé (15-17 ans) ne la voit pas");
ok((await geste(NOE, { action: "confirmer", id: P1.id })).statut === 404, "… et ne peut pas y prendre une place");
const c1 = await geste(ZOE, { action: "confirmer", id: P1.id });
ok(c1.statut === 200 && c1.proposition?.jY && c1.proposition.confirmes.length === 2, "Zoé confirme sa place : 2/8");
ok((await geste(ZOE, { action: "confirmer", id: P1.id })).proposition?.confirmes.length === 2, "… deux fois : toujours une seule place");
const dem = Date.now() + 26 * 3600_000;
const a1 = await geste(ZOE, { action: "autre-heure", id: P1.id, quand: dem });
ok(a1.statut === 200 && a1.proposition?.autre?.prenom === "Zoé", "🕘 Zoé propose une autre heure : elle se voit sur la carte");
const vL = (await groupes(LEA)).propositions?.find((p) => p.id === P1.id);
ok(vL?.autre?.prenom === "Zoé" && Math.abs(vL.autre.quand - dem) < 60_000, "… Léa la voit");
const pr = await geste(LEA, { action: "autre-heure", id: P1.id, quand: vL.autre.quand });
ok(pr.statut === 200 && pr.proposition?.quand === vL.autre.quand && !pr.proposition.autre && pr.proposition.confirmes.length === 2, "Léa prend cette heure : la proposition change d'heure, les places restent");
ok((await geste(ZOE, { action: "laisser", id: P1.id })).proposition?.confirmes.length === 1, "Zoé laisse sa place : 1/8");
ok((await geste(LEA, { action: "laisser", id: P1.id })).statut === 400, "Léa ne laisse pas sa place : elle retire plutôt");

// ═══ NOÉ : SEULEMENT ENTRE PROCHES ═══
ok((await geste(NOE, { action: "proposer", nom: "Jeux", theme: "jeux", quand: dans3h, pour: "tous", places: 8 })).statut === 403, "Noé (15-17 ans) ne propose pas à tout le monde");
const pN = await geste(NOE, { action: "proposer", nom: "Jeux", theme: "jeux", quand: dans3h, pour: "proches", places: 8 });
ok(pN.statut === 200 && pN.proposition?.places === 4, "… entre proches, oui (4 places)");
ok(!(await groupes(ZOE)).propositions?.some((p) => p.id === pN.proposition?.id), "… Zoé (pas sa proche) ne la voit pas");

// ═══ 👥 ENTRE PROCHES, TOUT DE SUITE ═══
const p2 = await geste(LEA, { action: "proposer", nom: "Ce soir chez moi", theme: "humour", video: V.id, quand: Date.now(), pour: "proches", places: 8 });
const P2 = p2.proposition;
ok(p2.statut === 200 && P2?.pour === "proches" && P2.places === 4 && P2.ouverte, "Léa propose à ses proches, maintenant : 4 places, ouverte");
ok((await groupes(SAM)).propositions?.some((p) => p.id === P2.id), "Sam (son proche) la voit");
ok(!(await groupes(ZOE)).propositions?.some((p) => p.id === P2.id), "Zoé (pas sa proche) non");
ok((await geste(SAM, { action: "entrer", id: P2.id })).statut === 403, "Sam entre sans sa place : « Confirme d'abord ta place »");
ok((await geste(SAM, { action: "confirmer", id: P2.id })).proposition?.jY, "Sam confirme sa place");
const eS = await geste(SAM, { action: "entrer", id: P2.id });
ok(eS.statut === 200 && eS.aller === `/univers/salons?chez=${encodeURIComponent(CLE_LEA)}`, "Sam entre : la séance chez Léa");
const invS = (await appel(SAM, "/api/direct/salons-ouverts?accueil=1")).invitations?.find((i) => i.cle === CLE_LEA);
ok(invS?.video?.id === V.id, "… il y est invité, avec la vidéo choisie");
const oS = (await appel(SAM, "/api/direct/salons-ouverts", { action: "entrer-chez", chez: CLE_LEA })).ouverture;
ok(oS?.salon?.id === `chez-${qui8(LEA.id)}`, "… et il entre pour de vrai chez Léa");
const eL = await geste(LEA, { action: "entrer", id: P2.id });
ok(eL.aller === "/univers/salons?chez=moi", "Léa entre : chez elle");
const oL = (await appel(LEA, "/api/direct/salons-ouverts", { action: "entrer-chez", chez: "moi" })).ouverture;
ok(oL?.tele?.seance?.video?.id === V.id, "… sa télé est sur la vidéo du rendez-vous");

// ═══ LE FIL DE DÉCOUVRIR : « ON SE RETROUVE ? » ═══
const fil = (await appel(ZOE, "/api/direct/fil-decouvrir")).fil;
const rdv = fil?.pieces?.find((p) => p.sorte === "rdv");
ok(rdv?.proposition?.id === P1.id, "le fil de Zoé montre « On se retrouve ? » (la soirée foot de Léa)");
ok(!(await appel(LEA, "/api/direct/fil-decouvrir")).fil?.pieces?.some((p) => p.sorte === "rdv" && p.proposition.id === P1.id), "… pas celui de Léa (c'est la sienne)");

// ═══ TROIS AU PLUS ; RETIRER ═══
const p3 = await geste(LEA, { action: "proposer", nom: "Rire ensemble", theme: "humour", quand: dans3h, pour: "tous", places: 4 });
ok(p3.statut === 200, "une troisième proposition : oui");
ok((await geste(LEA, { action: "proposer", nom: "Encore", theme: "musique", quand: dans3h, pour: "tous", places: 4 })).statut === 409, "une quatrième : non (trois à venir au plus)");
ok((await geste(ZOE, { action: "retirer", id: p3.proposition.id })).statut === 404, "Zoé ne retire pas celle de Léa");
ok((await geste(LEA, { action: "retirer", id: p3.proposition.id })).statut === 200 && !(await groupes(ZOE)).propositions?.some((p) => p.id === p3.proposition.id), "Léa la retire : elle disparaît");

// ═══ 🚩 TROIS SIGNALEMENTS ═══
ok((await geste(LEA, { action: "signaler", id: P1.id })).statut === 400, "Léa ne signale pas la sienne");
for (const x of [ZOE, TOM]) await geste(x, { action: "signaler", id: P1.id });
ok((await groupes(ZOE)).propositions?.some((p) => p.id === P1.id), "deux signalements : elle reste");
await json(`${SAM.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
const s3 = await geste(SAM, { action: "signaler", id: P1.id });
ok(s3.statut === 200 && !(await groupes(TOM)).propositions?.some((p) => p.id === P1.id), "trois : elle disparaît");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLes propositions de Mes groupes tiennent ✓");
process.exit(echecs ? 1 : 0);
