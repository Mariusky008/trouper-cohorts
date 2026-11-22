// 🎞️👥 LA SÉANCE ENTRE AMIS (`docs/univers/decouvrir.md`, section 33), PAR LA ROUTE — contre le faux Supabase et le faux
// YouTube (jamais la vraie base, jamais Google).
//
// « Il garde sa vidéo » : Léa invite Sam sur une vidéo de sa télé du jour — l'invitation la porte ; Sam arrive : il la
// reçoit (`tele.gardee`), ensemble tant que Léa est dessus ; il met en pause et reprend (ensemble), mais ne choisit pas la
// vidéo. Léa réagit, puis passe à la suivante : Sam, qui garde la sienne (sur son téléphone), y réagit quand même — elle
// n'est pas à sa télé du jour, c'est la vidéo de la séance — et y retrouve la réaction de Léa, à sa seconde. Une vidéo
// d'ailleurs : refusée.
// « L'invité invite » : Sam invite Tom (son proche, pas celui de Léa) : Tom voit « Sam t'invite devant la télé de Léa »,
// et entre ; Zoé (pas son proche) : non. Le lien WhatsApp de Sam réserve une place chez Léa — son aperçu dit « Sam
// t'invite chez Léa » ; Zoé la prend : proche de Sam, pas de Léa. Plus de place : on ne peut plus inviter.
// « Tout pour tous » : devant la télé, Léa demande Zoé en proche (une demande part) ; Sam, déjà proche : « déjà » ; elle
// signale Tom (ça passe, l'administrateur le verra).
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
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? await r.json().catch(() => ({})) : {};
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000005e33${String(n).padStart(2, "0")}`, jeton: `jeton-seance-entre-amis-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const ZOE = qui(4, "Zoé");
const GENS = [LEA, SAM, TOM, ZOE];
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
}
// (Léa et Sam n'ont pas les mêmes passions : les vidéos de Léa ne sont pas à la télé du jour de Sam)
await json(`${LEA.id}/passions.json`, { passions: ["cuisine", "foot", "animaux"], poids: {}, le: maintenant });
for (const x of [SAM, TOM, ZOE]) await json(`${x.id}/passions.json`, { passions: ["musique", "jeux", "humour"], poids: {}, le: maintenant });
// (Léa ↔ Sam, Sam ↔ Tom : proches des deux côtés ; Tom n'est pas le proche de Léa ; Zoé, de personne)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, TOM.id] });
await json(`${TOM.id}/proches.json`, { ids: [SAM.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const SALONS = "/api/direct/salons-ouverts";
const TELE = "/api/direct/tele-du-jour";
const salons = (x, corps) => appel(x, SALONS, corps);
const pouls = (x, salon) => appel(x, `${SALONS}?salon=${salon}&depuis=0&connus=`);
const cleDe = async (x) => (await appel(x, "/api/direct/proches")).cle;
const [CLE_LEA, CLE_SAM, CLE_TOM, CLE_ZOE] = await Promise.all(GENS.map(cleDe));
ok(CLE_LEA && CLE_SAM && CLE_TOM && CLE_ZOE, "les clés de chacun");
const SEANCE = `chez-${qui8(LEA.id)}`;

// ═══ 🎞️ LÉA INVITE SAM SUR UNE VIDÉO ═══
const teleLea = (await appel(LEA, TELE)).tele;
const [V, W] = teleLea?.videos ?? [];
ok(V?.id && W?.id, `la télé du jour de Léa (${teleLea?.videos?.length ?? 0} vidéos)`);
const teleSam = (await appel(SAM, TELE)).tele;
ok(!(teleSam?.videos ?? []).some((v) => v.id === V.id), "… la vidéo n'est pas à la télé du jour de Sam");
const inv = await salons(LEA, { action: "inviter-video", id: V.id, t: 0, cles: [CLE_SAM] });
ok(inv.statut === 200 && inv.invites?.length === 1, "Léa invite Sam sur cette vidéo");
const iSam = (await appel(SAM, `${SALONS}?accueil=1`)).invitations?.find((i) => i.cle === CLE_LEA);
ok(iSam?.video?.id === V.id && iSam.titre === V.titre && !iSam.par, `l'invitation porte la vidéo (« ${iSam?.titre} »)`);
const oLea = (await salons(LEA, { action: "entrer-chez", chez: "moi" })).ouverture;
ok(oLea?.tele?.seance?.video?.id === V.id && !oLea.tele.gardee, "Léa entre : sa télé est sur la vidéo");
const oSam = (await salons(SAM, { action: "entrer-chez", chez: CLE_LEA })).ouverture;
ok(oSam?.tele?.gardee?.id === V.id && oSam.tele.seance?.video?.id === V.id, "Sam entre : il garde la vidéo de son invitation — et Léa est dessus : ensemble");
ok(oSam.presents.find((p) => p.q === qui8(LEA.id))?.maison === CLE_LEA && oSam.presents.find((p) => p.q === qui8(SAM.id))?.maison === CLE_SAM, "… chacun a sa maison sur sa fiche (« 🏠 Voir sa maison »)");

// ═══ ENSEMBLE : LA PAUSE POUR TOUS, LE CHOIX À L'HÔTE ═══
const p1 = await salons(SAM, { action: "tele", salon: SEANCE, quoi: "jouer" });
ok(p1.statut === 200 && p1.seance?.video?.id === V.id && p1.seance.pause === undefined, "Sam lance la vidéo : pour tout le monde");
const p2 = await salons(SAM, { action: "tele", salon: SEANCE, quoi: "pause" });
ok(p2.statut === 200 && typeof p2.seance?.pause === "number", "Sam met en pause : pour tout le monde (ensemble)");
ok((await pouls(LEA, SEANCE)).pouls?.seance?.pause !== undefined, "… Léa le voit au pouls");
ok((await salons(SAM, { action: "tele", salon: SEANCE, quoi: "suivante" })).statut === 403, "Sam ne choisit pas la vidéo : « C'est l'hôte qui mène la télé »");
ok((await salons(TOM, { action: "tele", salon: SEANCE, quoi: "pause" })).statut === 403, "Tom (pas invité) : rien");
await salons(SAM, { action: "tele", salon: SEANCE, quoi: "jouer" });

// ═══ LÉA RÉAGIT, PUIS PASSE À LA SUIVANTE ; SAM GARDE LA SIENNE ═══
const r1 = await appel(LEA, TELE, { action: "reagir", seance: SEANCE, id: V.id, t: 3, sorte: "rire", source: "rangee" });
ok(r1.statut === 200, "Léa rit à 0:03");
const s1 = await salons(LEA, { action: "tele", salon: SEANCE, quoi: "video", id: W.id });
ok(s1.seance?.video?.id === W.id, "Léa passe à une autre vidéo");
ok((await pouls(SAM, SEANCE)).pouls?.seance?.video?.id === W.id, "… le pouls de Sam le dit (son téléphone garde la sienne)");
ok((await appel(SAM, TELE, { action: "reagir", id: V.id, t: 5, sorte: "coeur", source: "rangee" })).statut === 404, "sans la séance : la vidéo n'est pas à sa télé — refusée");
const r2 = await appel(SAM, TELE, { action: "reagir", seance: SEANCE, id: V.id, t: 5, sorte: "coeur", source: "rangee" });
ok(r2.statut === 200 && r2.reaction?.t === 5, "avec la séance : Sam réagit sur sa vidéo gardée, à sa seconde");
const devant = await appel(SAM, `${TELE}?reactions=${V.id}&seance=${SEANCE}`);
const laLea = devant.proches?.find((p) => p.cle === CLE_LEA);
ok(devant.statut === 200 && laLea?.reactions?.some((r) => r.t === 3 && r.sorte === "rire") && devant.miennes?.some((r) => r.t === 5), `il y retrouve Léa et son rire à 0:03 — sa figurine le rejouera (${devant.proches?.length ?? 0} proche)`);
ok((await appel(SAM, TELE, { action: "reagir", seance: SEANCE, id: W.id, t: 2, sorte: "oh", source: "rangee" })).statut === 200, "… et la vidéo de Léa aussi (celle de sa télé)");
const ailleurs = teleLea.videos[3]?.id ?? "aaaaaaaaaaa";
ok((await appel(SAM, TELE, { action: "reagir", seance: SEANCE, id: ailleurs, t: 2, sorte: "oh", source: "rangee" })).statut === 404, "une vidéo d'ailleurs : refusée, même avec la séance");
ok((await appel(TOM, TELE, { action: "reagir", seance: SEANCE, id: V.id, t: 2, sorte: "oh", source: "rangee" })).statut === 404, "Tom (pas invité) : refusé");

// ═══ 👥 L'INVITÉ INVITE ═══
ok((await salons(SAM, { action: "inviter", salon: SEANCE, chez: CLE_LEA, cles: [CLE_ZOE] })).statut === 403, "Sam invite Zoé (pas son proche) : non");
ok((await salons(SAM, { action: "inviter", salon: SEANCE, chez: CLE_SAM, cles: [CLE_TOM] })).statut === 404, "… avec une autre clé que celle de l'hôte : non");
const i2 = await salons(SAM, { action: "inviter", salon: SEANCE, chez: CLE_LEA, cles: [CLE_TOM] });
ok(i2.statut === 200 && i2.invites?.[0] === CLE_TOM, "Sam invite Tom, son proche, à une place libre chez Léa");
const iTom = (await appel(TOM, `${SALONS}?accueil=1`)).invitations?.find((i) => i.cle === CLE_LEA);
ok(iTom?.par === "Sam" && iTom.prenom === "Léa", "Tom : « 🎬 Sam t'invite devant la télé de Léa »");
const oTom = (await salons(TOM, { action: "entrer-chez", chez: CLE_LEA })).ouverture;
ok(oTom?.salon?.id === SEANCE && oTom.presents.length === 3, "Tom entre : trois devant la télé");
ok(!((await lire(`${LEA.id}/proches.json`)).ids ?? []).includes(TOM.id), "… il n'est pas le proche de Léa (« juste invité »)");

// ═══ 📲 LE LIEN WHATSAPP DE SAM ═══
const pl = await salons(SAM, { action: "place", salon: SEANCE, chez: CLE_LEA });
ok(pl.statut === 200 && pl.lien?.includes(`chez=${CLE_LEA}`) && pl.chez === "Léa" && pl.prenom === "Sam", `un lien qui réserve une place chez Léa (${pl.lien})`);
const jeton = new URL(pl.lien, BASE).searchParams.get("place");
const ap = await fetch(`${BASE}/univers/salons/apercu?chez=${CLE_LEA}&place=${jeton}`);
ok(ap.status === 200 && ap.headers.get("content-type") === "image/jpeg", "son aperçu (la carte)");
const page = await (await fetch(`${BASE}/univers/salons?chez=${CLE_LEA}&place=${jeton}`, { headers: { cookie: COOKIE_ADMIN } })).text();
ok(/Sam t’invite chez Léa/.test(page), "… « 🎬 Sam t'invite chez Léa »");
const oZoe = (await salons(ZOE, { action: "entrer-chez", chez: CLE_LEA, place: jeton })).ouverture;
ok(oZoe?.salon?.id === SEANCE && oZoe.presents.length === 4, "Zoé prend la place : quatre devant la télé");
const [prochesZoe, prochesSam, prochesLea] = await Promise.all([lire(`${ZOE.id}/proches.json`), lire(`${SAM.id}/proches.json`), lire(`${LEA.id}/proches.json`)]);
ok((prochesZoe.ids ?? []).includes(SAM.id) && (prochesSam.ids ?? []).includes(ZOE.id) && !(prochesLea.ids ?? []).includes(ZOE.id) && !(prochesZoe.ids ?? []).includes(LEA.id), "… proche de Sam (des deux côtés), pas de Léa");
const plein = await salons(SAM, { action: "inviter", salon: SEANCE, chez: CLE_LEA, cles: [CLE_TOM] });
ok(plein.statut === 409, "plus de place libre : on ne peut plus inviter");

// ═══ 👯🚩 TOUT POUR TOUS ═══
const d1 = await salons(LEA, { action: "proche", salon: SEANCE, q: qui8(ZOE.id) });
ok(d1.statut === 200 && d1.envoyee === true, "Léa demande Zoé en proche, devant la télé : la demande part");
ok((await appel(ZOE, `${SALONS}?accueil=1`)).demandes?.some((d) => d.prenom === "Léa" && /devant la même télé/.test(d.salon)), "… Zoé la voit dans Découvrir (« devant la même télé »)");
const d2 = await salons(LEA, { action: "proche", salon: SEANCE, q: qui8(SAM.id) });
ok(d2.proches === true && d2.deja === true, "Sam, déjà son proche : « Vous êtes déjà proches »");
const sg = await salons(LEA, { action: "signaler", salon: SEANCE, q: qui8(TOM.id), motif: "Autre chose" });
ok(sg.statut === 200 && sg.exclu === false, "elle signale Tom : c'est noté (l'administrateur le voit)");

// ═══ 📷⏱ TOUT POUR TOUS (section 34) : LA TÊTE EN DIRECT, REVOIR UN MOMENT ═══
ok((await salons(SAM, { action: "tete", salon: SEANCE, e: "rire" })).statut === 200, "📷 Sam dit sa tête (« rire » — un mot, jamais une image)");
const pT = (await pouls(LEA, SEANCE)).pouls;
ok(pT?.tetes?.[qui8(SAM.id)] === "rire" && !(qui8(LEA.id) in (pT.tetes ?? {})), "… le pouls de Léa la rapporte (pas la sienne)");
ok((await salons(SAM, { action: "tete", salon: SEANCE, e: "colere" })).statut === 200 && (await pouls(LEA, SEANCE)).pouls?.tetes?.[qui8(SAM.id)] === null, "… une tête qui n'existe pas : neutre");
await salons(SAM, { action: "tete", salon: SEANCE, e: "off" });
ok(!(qui8(SAM.id) in ((await pouls(LEA, SEANCE)).pouls?.tetes ?? {})), "… sa caméra s'arrête : plus rien");
ok((await salons(SAM, { action: "tete", salon: "foot-1", e: "rire" })).statut >= 400, "… hors d'une séance : non");
const vv = await appel(LEA, `${SALONS}?salon=${SEANCE}&vivante=${qui8(SAM.id)}`);
ok(vv.statut === 200 && vv.vivante === null, "sa figurine vivante, demandée par Léa : pas encore (ses expressions ne sont pas faites)");
const al = await salons(SAM, { action: "tele", salon: SEANCE, quoi: "aller", t: 10 });
ok(al.statut === 200 && Math.abs((Date.now() - al.seance.depart) / 1000 - 10) < 2, "⏱ Sam touche une ligne de « Ce qui s'est dit » : la vidéo revient à 0:10, pour tout le monde");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLa séance entre amis tient ✓");
process.exit(echecs ? 1 : 0);
