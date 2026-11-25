// 🏡 LES MAISONS OUVERTES (le lot F2 du fil, 25 novembre 2026 ; `docs/univers/fil.md` ; `visites-serveur.ts` :
// `choisirVisibiliteMaison`, `passionEnCommun`, `maisonsPourLeFil`, `faireCoucou`, `repondreCoucou` ; `coucous-serveur.ts` ;
// `fil-decouvrir-serveur.ts`), PAR LES ROUTES — contre le faux Supabase (jamais la vraie base).
//
// Zoé, Max, Sam et Paul (adultes), Noé (15 ans) ont choisi leur pièce. « Qui peut venir voir ta pièce ? » : aussi ceux qui
// aiment ce qu'ils aiment (🧭 « passions »). Paul n'a jamais dit son âge : la question d'abord. Léa (adulte : le foot, la
// cuisine) ouvre le fil : la maison de Paul et celle de Zoé (le foot en commun) — pas celle de Max (aucune passion en
// commun), ni celle de Sam (son proche : elle l'a déjà), ni celle de Noé (les 15-17 ans entre eux). Jade (15 ans, le foot)
// voit celle de Noé, jamais celles des adultes. Léa entre chez Zoé (elle voit seulement ce que Zoé a ajouté) ; Max non.
// Léa fait coucou à Zoé (une fois par jour) : la figurine de Léa est dans la pièce de Zoé ; Zoé répond : Léa le voit dans
// son fil. Max ne peut pas lui faire coucou. Zoé referme sa pièce à ses proches : elle quitte le fil, la porte se ferme.
// Sam frappe chez Léa : en haut du fil de Léa, « 🚪 Sam a frappé à ta porte ». Sans compte : refusé.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const octets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (« Ma maison » est freinée sur l'app des essais : l'administrateur y entre, avec la figurine de chacun)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);

const qui = (n, prenom) => ({ id: `6f6f6f6f-0000-4000-8000-0000006f20${String(n).padStart(2, "0")}`, jeton: `jeton-maisons-ouvertes-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const MAX = qui(3, "Max");
const SAM = qui(4, "Sam");
const NOE = qui(5, "Noé");
const JADE = qui(6, "Jade");
const PAUL = qui(7, "Paul");
const GENS = [LEA, ZOE, MAX, SAM, NOE, JADE, PAUL];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre.png`, parle: `${x.id}/neutre.png`, prete_le: maintenant })));
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" rx="60" fill="#c8643c"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
}
for (const x of [LEA, ZOE, MAX, SAM]) await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
for (const x of [NOE, JADE]) await json(`${x.id}/majeur.json`, { age: 15, adulte: false, le: maintenant });
const passions = { [LEA.id]: ["foot", "cuisine"], [ZOE.id]: ["series", "foot"], [MAX.id]: ["mode", "manga"], [SAM.id]: ["foot"], [NOE.id]: ["foot", "jeux"], [JADE.id]: ["foot"], [PAUL.id]: ["cuisine"] };
for (const [h, p] of Object.entries(passions)) await json(`${h}/passions.json`, { passions: p, poids: {}, le: maintenant });
// (Léa et Sam sont proches)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { fond: "#2a4b5c" });

const appel = async (x, chemin, corps, admin = false) => {
  const cookie = [admin ? COOKIE_ADMIN : "", x ? `clikme_habitant=${x.jeton}` : ""].filter(Boolean).join("; ");
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const maison = (x, corps) => appel(x, "/api/direct/ma-piece", corps, true);
const fil = async (x) => (await appel(x, "/api/direct/fil-decouvrir")).fil;
const maisonsDu = (f) => (f?.pieces ?? []).filter((p) => p.sorte === "maison");

// ═══ CHACUN CHOISIT SA PIÈCE, PUIS « QUI PEUT VENIR VOIR TA PIÈCE ? » ═══
for (const x of [LEA, ZOE, MAX, SAM, NOE, PAUL]) ok((await maison(x, { action: "choisir", piece: "salon" })).maison?.piece === "salon", `${x.prenom} a choisi sa pièce`);
const z = await maison(ZOE, { action: "visibilite", v: "passions" });
ok(z.statut === 200 && z.maison?.visibilite === "passions", "Zoé : « 🧭 Aussi ceux qui aiment ce que j'aime »");
for (const x of [MAX, SAM, NOE]) ok((await maison(x, { action: "visibilite", v: "passions" })).statut === 200, `${x.prenom} aussi`);
const p0 = await maison(PAUL, { action: "visibilite", v: "passions" });
ok(p0.statut === 409 && p0.age === true, "Paul n'a jamais dit son âge : la question d'abord (on ne le devine jamais)");
const p1 = await maison(PAUL, { action: "visibilite", v: "passions", majeur: true });
ok(p1.statut === 200 && p1.maison?.visibilite === "passions" && JSON.parse((await octets(`${PAUL.id}/majeur.json`))?.toString() || "{}").adulte === true, "… il répond « 18 ans ou plus » : sa pièce s'ouvre");
ok((await maison(ZOE, { action: "visibilite", v: "partout" })).statut === 400, "un choix inconnu : refusé");
const index = JSON.parse((await octets("maisons/ouvertes.json"))?.toString() || "{}").liste ?? [];
ok(index.length === 5 && index.find((x) => x.h === NOE.id)?.m === "jeunes" && index.find((x) => x.h === ZOE.id)?.m === "adultes", "les maisons ouvertes au fil, chacune avec sa tranche d'âge");

// ═══ LE FIL DE LÉA ═══
const f1 = await fil(LEA);
const m1 = maisonsDu(f1);
ok(m1.map((m) => m.prenom).join() === "Paul,Zoé", `les maisons de ceux qui aiment ce qu'elle aime, les plus récentes d'abord : ${m1.map((m) => m.prenom).join()} — pas Max (rien en commun), ni Sam (son proche), ni Noé (15 ans)`);
const chezZoe = m1.find((m) => m.prenom === "Zoé");
ok(chezZoe?.passion?.e === "⚽" && chezZoe.passion.court === "foot" && m1.find((m) => m.prenom === "Paul")?.passion?.court === "cuisine", "… la passion en commun : le foot avec Zoé, la cuisine avec Paul");
ok(/^\/api\/direct\/salon\/fichier\//.test(chezZoe?.image ?? "") && Boolean(chezZoe?.figurine?.tete) && /^[a-f0-9]{16}$/.test(chezZoe?.cle ?? "") && !chezZoe?.coucou, "… sa pièce, sa figurine, sa clé ; pas encore de coucou");
ok(!JSON.stringify(f1).includes(ZOE.id) && !JSON.stringify(f1).includes(PAUL.id), "… leurs comptes ne sont jamais montrés");

// ═══ LES 15-17 ANS ENTRE EUX ═══
const fJade = await fil(JADE);
ok(maisonsDu(fJade).map((m) => m.prenom).join() === "Noé", `Jade (15 ans, le foot) : la maison de Noé, jamais celles des adultes (${maisonsDu(fJade).map((m) => m.prenom).join()})`);
ok(maisonsDu(await fil(NOE)).length === 0, "Noé : aucune maison (personne d'autre de son âge n'a ouvert la sienne)");

// ═══ FRAPPER À SA PORTE : LA VISITE ═══
const v1 = await appel(LEA, `/api/direct/ma-piece?chez=${chezZoe.cle}`);
ok(v1.visite?.etat === "ouvert" && v1.visite.proche === false && v1.visite.prenom === "Zoé" && !v1.visite.peutLaisser, "Léa entre chez Zoé : la pièce est ouverte (pas en proche : pas de surprise à laisser)");
ok((await appel(MAX, `/api/direct/ma-piece?chez=${chezZoe.cle}`)).visite?.etat === "reserve", "Max (rien en commun) : la porte reste fermée");
ok((await appel(JADE, `/api/direct/ma-piece?chez=${chezZoe.cle}`)).visite?.etat === "reserve", "Jade (15 ans) : la porte reste fermée");
ok((await appel(LEA, "/api/direct/visites", { action: "frapper", cle: chezZoe.cle })).statut === 200, "Léa frappe à sa porte");

// ═══ LUI FAIRE COUCOU ═══
ok((await appel(null, "/api/direct/visites", { action: "coucou", cle: chezZoe.cle })).statut === 403, "sans compte : refusé");
ok((await appel(MAX, "/api/direct/visites", { action: "coucou", cle: chezZoe.cle })).statut === 403, "Max ne peut pas lui faire coucou");
ok((await appel(LEA, "/api/direct/visites", { action: "coucou", cle: chezZoe.cle })).statut === 200, "Léa fait coucou à Zoé");
ok((await appel(LEA, "/api/direct/visites", { action: "coucou", cle: chezZoe.cle })).statut === 200, "… deux fois : rien de plus");
const coucous = JSON.parse((await octets(`${ZOE.id}/monde/coucous.json`))?.toString() || "{}").liste ?? [];
ok(coucous.length === 1 && coucous[0].de === LEA.id, "… un seul coucou, rangé chez Zoé");
const mz = await maison(ZOE);
const c0 = mz.maison?.coucous?.[0];
ok(mz.maison?.coucous?.length === 1 && c0?.prenom === "Léa" && Boolean(c0.image) && /^[a-f0-9]{16}$/.test(c0.cle ?? ""), "chez Zoé : la figurine de Léa est dans sa pièce (« 👋 Coucou ! »)");
ok(maisonsDu(await fil(LEA)).find((m) => m.prenom === "Zoé")?.coucou === "envoye", "dans le fil de Léa : « 👋 Ta figurine est chez Zoé »");
const rep = await maison(ZOE, { action: "coucou", id: c0?.id, oui: true });
ok(rep.statut === 200 && !rep.maison?.coucous, "Zoé lui répond : la figurine de Léa s'en va de sa pièce");
ok(maisonsDu(await fil(LEA)).find((m) => m.prenom === "Zoé")?.coucou === "repondu", "dans le fil de Léa : « 👋 Zoé t'a répondu ! » (sa vraie réponse)");
ok((await maison(ZOE, { action: "coucou", id: "inconnu", oui: true })).statut === 404, "un coucou inconnu : 404");
// (Paul fait coucou à Zoé ? Rien en commun : non. Max à Paul ? Non plus. Léa à Paul, et Paul le laisse)
const chezPaul = m1.find((m) => m.prenom === "Paul");
await appel(LEA, "/api/direct/visites", { action: "coucou", cle: chezPaul.cle });
const cp = (await maison(PAUL)).maison?.coucous?.[0];
ok((await maison(PAUL, { action: "coucou", id: cp?.id, oui: false })).statut === 200 && !(await maison(PAUL)).maison?.coucous, "Paul le laisse (« Pas maintenant ») : la figurine s'en va, Léa n'est pas prévenue");
ok(maisonsDu(await fil(LEA)).find((m) => m.prenom === "Paul")?.coucou === "envoye", "… et Léa ne voit jamais de fausse réponse");

// ═══ ZOÉ REFERME SA PIÈCE ═══
ok((await maison(ZOE, { action: "visibilite", v: "proches" })).statut === 200, "Zoé : « 👯 Mes proches seulement »");
ok(!maisonsDu(await fil(LEA)).some((m) => m.prenom === "Zoé"), "… sa maison quitte le fil de Léa");
ok((await appel(LEA, `/api/direct/ma-piece?chez=${chezZoe.cle}`)).visite?.etat === "reserve", "… et sa porte se ferme");

// ═══ LA SURPRISE D'UNE VISITE, EN HAUT DU FIL ═══
const cleLea = (await maison(LEA)).maison?.cle;
ok((await appel(SAM, "/api/direct/visites", { action: "frapper", cle: cleLea })).statut === 200, "Sam frappe chez Léa");
const f2 = await fil(LEA);
ok(f2?.surprise?.genre === "toc" && f2.surprise.prenom === "Sam", `en haut du fil de Léa : « 🚪 Sam a frappé à ta porte » (${JSON.stringify(f2?.surprise)})`);

// (les maisons de cet essai se referment : les essais suivants ne les trouvent pas dans leur fil)
for (const x of [MAX, SAM, NOE, PAUL]) await maison(x, { action: "visibilite", v: "proches" });
ok((JSON.parse((await octets("maisons/ouvertes.json"))?.toString() || "{}").liste ?? []).length === 0, "toutes refermées : plus aucune maison dans le fil");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
