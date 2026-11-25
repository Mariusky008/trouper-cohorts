// 🎬 MES PROCHES EN DIRECT (le lot F3 du fil, 25 novembre 2026 ; `docs/univers/fil.md` ; `salons-ouverts-serveur.ts` :
// `seancesDesProches`, `demanderARejoindre`, `laisserLaDemande`, le pouls de l'hôte ; `fil-decouvrir-serveur.ts`), PAR LES
// ROUTES — contre le faux Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// Léa ouvre la séance chez elle et invite Sam. Dans le fil de Zoé et d'Ana (ses proches) : « Léa et Sam regardent
// ensemble », ce qui passe à sa télé. Pas dans celui de Tom (pas son proche), ni dans celui de Sam (il y est). Zoé demande
// à les rejoindre : Léa le voit dans sa séance (son pouls), pas Sam ; une seule demande par heure. Tom ne peut pas
// demander. Ana demande, Léa la laisse : rien n'est dit à Ana (jamais une fausse réponse), sa carte redevient « Demander ».
// Léa fait une place à Zoé (l'invitation habituelle) : la demande s'en va, Zoé est invitée, elle entre. Sam lui fait signe
// d'un toucher (un geste 👋 vers elle) : son pouls le rapporte, avec son prénom. Tous partis : la séance quitte le fil, et
// on ne peut plus demander.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `6f6f6f6f-0000-4000-8000-0000006f40${String(n).padStart(2, "0")}`, jeton: `jeton-proches-en-direct-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const ANA = qui(5, "Ana");
const GENS = [LEA, SAM, ZOE, TOM, ANA];
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
// (Léa : sa pièce, le salon ; Sam, Zoé et Ana sont ses proches, des deux côtés ; Tom ne l'est pas)
await json(`${LEA.id}/passions.json`, { passions: ["cuisine", "foot"], poids: {}, le: maintenant });
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, ZOE.id, ANA.id] });
for (const x of [SAM, ZOE, ANA]) await json(`${x.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const ROUTE = "/api/direct/salons-ouverts";
const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poster = (x, corps) => appel(x, ROUTE, corps);
const pouls = (x, salon, depuis = 0) => appel(x, `${ROUTE}?salon=${salon}&depuis=${depuis}&connus=`);
const fil = async (x) => (await appel(x, "/api/direct/fil-decouvrir")).fil;
const seanceDans = (f, cle) => (f?.pieces ?? []).find((p) => p.sorte === "seance" && p.cle === cle);
const cleDe = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE = { Sam: await cleDe(SAM), Zoé: await cleDe(ZOE), Ana: await cleDe(ANA) };
ok(CLE.Sam && CLE["Zoé"] && CLE.Ana, "les clés de Sam, Zoé et Ana");

// ═══ la séance chez Léa ═══
const e1 = await poster(LEA, { action: "entrer-chez", chez: "moi" });
const SEANCE = e1.ouverture?.salon?.id ?? "";
const CLE_LEA = e1.ouverture?.salon?.seance?.cle ?? "";
const VIDEO = e1.ouverture?.tele?.seance?.video?.id ?? "";
ok(e1.statut === 200 && SEANCE.startsWith("chez-") && CLE_LEA && VIDEO, `Léa ouvre la séance chez elle (${SEANCE})`);
ok((await poster(LEA, { action: "inviter", cles: [CLE.Sam] })).invites?.length === 1, "… elle invite Sam");
const e2 = await poster(SAM, { action: "entrer-chez", chez: CLE_LEA });
const Q_SAM = e2.ouverture?.moi ?? "";
ok(e2.statut === 200 && e2.ouverture.presents.length === 2, "Sam vient : ils sont deux");

// ═══ dans le fil ═══
const fZ = await fil(ZOE);
const sZ = seanceDans(fZ, CLE_LEA);
ok(sZ && sZ.hote === "Léa" && sZ.hoteLa === true && sZ.presents.length === 2 && sZ.presents[0].prenom === "Léa" && sZ.presents[1].prenom === "Sam", "le fil de Zoé : la séance chez Léa, Léa et Sam (l'hôte d'abord)");
ok(sZ?.video?.id === VIDEO && !sZ.invite && !sZ.demande, "… ce qui passe à sa télé ; Zoé n'est pas invitée, elle n'a rien demandé");
ok(fZ?.pieces?.[0]?.sorte === "seance", "… en premier dans le fil");
ok(sZ && sZ.presents.every((p) => p.src) && !JSON.stringify(sZ).includes(LEA.id) && !JSON.stringify(sZ).includes(SAM.id), "… leurs figurines ; aucun compte montré");
ok(Boolean(seanceDans(await fil(ANA), CLE_LEA)), "le fil d'Ana (proche de Léa) : la séance aussi");
ok(!seanceDans(await fil(TOM), CLE_LEA), "le fil de Tom (pas son proche) : rien");
ok(!seanceDans(await fil(SAM), CLE_LEA), "le fil de Sam (il y est) : rien");
ok(!(await fil(LEA))?.pieces?.some((p) => p.sorte === "seance"), "le fil de Léa (c'est chez elle) : rien");

// ═══ 🙋 demander à les rejoindre ═══
ok((await poster(null, { action: "rejoindre", chez: CLE_LEA })).statut === 401, "sans compte : refusé");
ok((await poster(TOM, { action: "rejoindre", chez: CLE_LEA })).statut === 403, "Tom (pas son proche) ne peut pas demander");
ok((await poster(LEA, { action: "rejoindre", chez: CLE_LEA })).statut === 400, "Léa, chez elle : rien à demander");
const d1 = await poster(ZOE, { action: "rejoindre", chez: CLE_LEA });
ok(d1.statut === 200 && d1.demande === true && !d1.invite, "Zoé demande à les rejoindre");
const pL = (await pouls(LEA, SEANCE)).pouls;
ok(pL?.rejoindre?.length === 1 && pL.rejoindre[0].prenom === "Zoé" && pL.rejoindre[0].cle === CLE["Zoé"] && pL.rejoindre[0].figurine, "le pouls de Léa : « 🙋 Zoé aimerait vous rejoindre », avec sa figurine");
ok(!(await pouls(SAM, SEANCE)).pouls?.rejoindre, "… pas celui de Sam (ce n'est pas chez lui)");
ok((await poster(ZOE, { action: "rejoindre", chez: CLE_LEA })).demande === true && (await pouls(LEA, SEANCE)).pouls?.rejoindre?.length === 1, "Zoé redemande : toujours une seule demande");
ok(seanceDans(await fil(ZOE), CLE_LEA)?.demande === true, "… son fil le dit : « Demande envoyée »");
ok((await poster(ZOE, { action: "entrer-chez", chez: CLE_LEA })).statut === 403, "… elle n'entre pas encore : seule Léa ouvre la porte");

// Ana demande, Léa la laisse
ok((await poster(ANA, { action: "rejoindre", chez: CLE_LEA })).demande === true, "Ana demande aussi");
ok((await pouls(LEA, SEANCE)).pouls?.rejoindre?.length === 2, "… Léa voit les deux demandes");
ok((await poster(LEA, { action: "laisser-demande", cle: CLE.Ana })).statut === 200, "Léa : « Pas maintenant » pour Ana");
const pL2 = (await pouls(LEA, SEANCE)).pouls;
ok(pL2?.rejoindre?.length === 1 && pL2.rejoindre[0].prenom === "Zoé", "… il reste la demande de Zoé");
const sA = seanceDans(await fil(ANA), CLE_LEA);
ok(sA && !sA.demande && !sA.invite, "… la carte d'Ana redevient « Demander » (aucune fausse réponse)");

// Léa fait une place à Zoé
const inv = await poster(LEA, { action: "inviter", cles: [CLE["Zoé"]] });
ok(inv.statut === 200 && inv.invites?.[0] === CLE["Zoé"], "Léa fait une place à Zoé (l'invitation habituelle)");
ok(!(await pouls(LEA, SEANCE)).pouls?.rejoindre, "… la demande s'en va");
const sZ2 = seanceDans(await fil(ZOE), CLE_LEA);
ok(sZ2?.invite === true && !sZ2.demande, "le fil de Zoé : « M'asseoir avec eux »");
ok((await fil(ZOE))?.invitation?.cle === CLE_LEA, "… et en haut : « 🎬 Léa t'invite devant sa télé »");
ok((await poster(ZOE, { action: "rejoindre", chez: CLE_LEA })).invite === true, "« rejoindre » une fois invitée : elle peut entrer");
const e3 = await poster(ZOE, { action: "entrer-chez", chez: CLE_LEA });
const Q_ZOE = e3.ouverture?.moi ?? "";
ok(e3.statut === 200 && e3.ouverture.presents.length === 3, "Zoé entre : ils sont trois");
ok(!seanceDans(await fil(ZOE), CLE_LEA), "… la séance quitte son fil (elle y est)");
const sA2 = seanceDans(await fil(ANA), CLE_LEA);
ok(sA2?.presents?.length === 3, "… le fil d'Ana : Léa, Sam et Zoé");

// ═══ 👋 faire signe à celle qui arrive ═══
await pause(1600);
const g = await poster(SAM, { action: "ecrire", salon: SEANCE, sorte: "geste", cle: "coucou", a: Q_ZOE });
ok(g.statut === 200 && g.message?.sorte === "geste" && g.message.a === Q_ZOE, "Sam fait signe à Zoé, d'un toucher");
const pZ = (await pouls(ZOE, SEANCE)).pouls;
ok(pZ?.messages?.some((m) => m.sorte === "geste" && m.cle === "coucou" && m.a === Q_ZOE && m.de === Q_SAM && m.prenom === "Sam"), "… le pouls de Zoé le rapporte : « 👋 Sam te fait signe »");

// ═══ la séance finie ═══
for (const x of [LEA, SAM, ZOE]) await poster(x, { action: "sortir", salon: SEANCE });
ok(!seanceDans(await fil(ANA), CLE_LEA), "tous partis : la séance quitte le fil d'Ana");
ok((await poster(ANA, { action: "rejoindre", chez: CLE_LEA })).statut === 409, "… et on ne peut plus demander");

console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
