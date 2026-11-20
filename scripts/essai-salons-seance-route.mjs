// 🎬 LA SÉANCE CHEZ MOI ET 🗄️ L'ÉTAGÈRE DES SALONS (`lib/direct/salons-ouverts-serveur.ts`, `app/api/direct/salons-ouverts` ;
// les lots D2 et D5, `docs/univers/decouvrir.md` sections 19 et 20), PAR LA ROUTE — contre le faux Supabase et le faux
// YouTube (jamais la vraie base, jamais Google).
//
// D2 : Léa ouvre la séance chez elle (sa pièce, sa télé du jour prête, la place du milieu) ; elle invite ses proches (pas
// les autres, trois au plus) ; Sam voit l'invitation, vient ; Zoé (proche, pas invitée) n'entre pas. Léa mène la télé
// (pause, reprise, suivante, une vidéo de sa télé du jour) ; Sam ne la mène pas, son pouls suit. Entre proches : rien
// n'est relu, rien ne se signale. « Pas maintenant » : l'invitation s'en va.
// D5 : dans le salon du foot, trois personnes aiment la phrase d'Ana : elle monte sur l'étagère ; « Garder » la met chez
// Ben. Ses passions et sa maison (ouverte à tous) sur sa fiche ; « Mes salons » retient le foot (Ma maison). « Ajouter en
// proche » : la demande, l'accepter — proches des deux côtés ; deux demandes croisées : proches tout de suite ; dix par
// jour au plus.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? await r.json().catch(() => ({})) : {};
};
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000005b10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-seance-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const ANA = qui(5, "Ana");
const BEN = qui(6, "Ben");
const CLEO = qui(7, "Cléo");
const DAN = qui(8, "Dan");
const GENS = [LEA, SAM, ZOE, TOM, ANA, BEN, CLEO, DAN];
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
// (Léa : ses passions, sa pièce — le salon ; Sam et Zoé sont ses proches, des deux côtés ; Tom ne l'est pas)
await json(`${LEA.id}/passions.json`, { passions: ["cuisine", "foot", "animaux"], poids: {}, le: maintenant });
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, ZOE.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
// (Ana : ses passions, sa maison ouverte à tous)
await json(`${ANA.id}/passions.json`, { passions: ["foot", "musique"], poids: {}, le: maintenant });
await json(`${ANA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${ANA.id}/ma-piece/visibilite.json`, { v: "tous" });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée (la sélection du jour)");

// (Ma maison, derrière son interrupteur coupé ici : l'administrateur la voit)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
const ROUTE = "/api/direct/salons-ouverts";
const appel = async (x, chemin, corps, aussi = "") => {
  const c = [x ? `clikme_habitant=${x.jeton}` : "", aussi].filter(Boolean).join("; ");
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const accueil = (x) => appel(x, `${ROUTE}?accueil=1`);
const poster = (x, corps) => appel(x, ROUTE, corps);
const pouls = (x, salon, depuis = 0, connus = "") => appel(x, `${ROUTE}?salon=${salon}&depuis=${depuis}&connus=${connus}`);
// (leurs clés de proche : `/api/direct/proches` les pose)
const cleDe = async (x) => (await appel(x, "/api/direct/proches")).cle;
const cles = { Sam: await cleDe(SAM), Zoé: await cleDe(ZOE) };
ok(cles["Sam"] && cles["Zoé"], "les clés de Sam et Zoé (les proches de Léa)");
const CLE_TOM = await cleDe(TOM);

// ═══ 🎬 D2 : LA SÉANCE CHEZ LÉA ═══
const e1 = await poster(LEA, { action: "entrer-chez", chez: "moi" });
const o1 = e1.ouverture;
const SEANCE = o1?.salon?.id ?? "";
ok(e1.statut === 200 && /^chez-[A-Za-z0-9_-]{4,16}$/.test(SEANCE) && o1.salon.maison === "prives" && o1.salon.nom === "🏠 Chez Léa" && o1.salon.seance?.hote === true, `Léa ouvre la séance chez elle (${SEANCE}, « ${o1?.salon?.nom} »)`);
ok(o1.decor?.piece === "salon" && o1.presents.length === 1 && o1.presents[0].place === 0, "… sa pièce, la place du milieu");
const videos = o1.tele?.videos ?? [];
ok(videos.length >= 3 && o1.tele.seance?.video?.id === videos[0].id && o1.tele.seance.n >= 1 && o1.tele.seance.pause === undefined, `… sa télé du jour (${videos.length} vidéos), prête : la première passe`);
const CLE_LEA = o1.salon.seance.cle;
ok((await poster(ZOE, { action: "entrer-chez", chez: CLE_LEA })).statut === 403, "Zoé (proche, pas invitée) : elle n'entre pas");
ok((await pouls(ZOE, SEANCE)).statut === 403, "… ni par le pouls");

// inviter
ok((await poster(LEA, { action: "inviter", cles: [cles["Sam"], cles["Zoé"], CLE_TOM, "abcdefgh"] })).statut === 400, "quatre invités : trois au plus");
const inv = await poster(LEA, { action: "inviter", cles: [cles["Sam"], CLE_TOM] });
ok(inv.statut === 200 && inv.invites?.length === 1 && inv.invites[0] === cles["Sam"], "Léa invite Sam et Tom : seul Sam (Tom n'est pas son proche)");
ok((await poster(TOM, { action: "entrer-chez", chez: CLE_LEA })).statut === 403, "… Tom n'entre pas");
const aSam = await accueil(SAM);
ok(aSam.invitations?.length === 1 && aSam.invitations[0].cle === CLE_LEA && aSam.invitations[0].prenom === "Léa", "l'accueil de Sam : « 🎬 Léa t'invite devant sa télé »");
const e2 = await poster(SAM, { action: "entrer-chez", chez: CLE_LEA });
const o2 = e2.ouverture;
ok(e2.statut === 200 && o2.salon.id === SEANCE && o2.salon.seance?.hote === false && o2.salon.seance.prenom === "Léa" && o2.presents.length === 2, "Sam vient : chez Léa, à côté d'elle");
ok(o2.tele?.seance?.video?.id === videos[0].id && (o2.tele.videos ?? []).length === 0, "… la même vidéo (la liste reste à Léa)");
ok(!JSON.stringify(o2).includes(LEA.id) && !JSON.stringify(o2).includes(SAM.id), "… aucun compte n'est montré");

// la télé menée par l'hôte
ok((await poster(SAM, { action: "tele", salon: SEANCE, quoi: "pause" })).statut === 403, "Sam ne mène pas la télé");
const t1 = await poster(LEA, { action: "tele", salon: SEANCE, quoi: "pause" });
ok(t1.statut === 200 && typeof t1.seance?.pause === "number" && t1.seance.n === o1.tele.seance.n + 1, `Léa met en pause (à ${t1.seance?.pause?.toFixed(1)} s)`);
const ps = (await pouls(SAM, SEANCE)).pouls;
ok(ps?.seance?.n === t1.seance.n && typeof ps.seance.pause === "number" && ps.ici.length === 2, "… le pouls de Sam suit (pause)");
await pause(1200);
const t2 = await poster(LEA, { action: "tele", salon: SEANCE, quoi: "jouer" });
ok(t2.statut === 200 && t2.seance?.pause === undefined && Math.abs((Date.now() - t2.seance.depart) / 1000 - t1.seance.pause) < 1, "« Reprendre » : la vidéo repart d'où elle était");
const t3 = await poster(LEA, { action: "tele", salon: SEANCE, quoi: "suivante" });
ok(t3.seance?.video?.id === videos[1].id, "« Suivante » : la deuxième de sa télé du jour");
const t4 = await poster(LEA, { action: "tele", salon: SEANCE, quoi: "video", id: videos[2].id });
ok(t4.seance?.video?.id === videos[2].id, "« Choisir » : celle qu'elle veut");
ok((await poster(LEA, { action: "tele", salon: SEANCE, quoi: "video", id: "zzzzzzzzzzz" })).statut === 404, "… pas une vidéo hors de sa télé");
ok((await pouls(SAM, SEANCE)).pouls?.seance?.video?.id === videos[2].id, "… Sam la voit");

// entre proches
await pause(1600);
const m1 = await poster(SAM, { action: "ecrire", salon: SEANCE, sorte: "texte", texte: "regarde www.monsite.fr à 18 h" });
ok(m1.statut === 200 && m1.message?.texte === "regarde www.monsite.fr à 18 h", "entre proches : rien n'est relu (un lien passe)");
ok((await poster(LEA, { action: "signaler", salon: SEANCE, q: o2.moi, motif: "Autre chose" })).statut === 400, "… et rien ne se signale");
ok((await poster(LEA, { action: "aimer", salon: SEANCE, message: m1.message.id })).statut === 400, "… l'étagère, c'est dans les salons ouverts");
ok(((await appel(LEA, `${ROUTE}?conversation=${SEANCE}`)).messages ?? []).some((m) => m.id === m1.message.id), "💬 la conversation de la séance");
ok((await poster(SAM, { action: "pas-maintenant", cle: CLE_LEA })).statut === 200 && !(await accueil(SAM)).invitations?.length, "« Pas maintenant » : l'invitation s'en va");
ok((await poster(SAM, { action: "sortir", salon: SEANCE })).statut === 200, "Sam sort");

// ═══ 🗄️ D5 : L'ÉTAGÈRE DU SALON DU FOOT ═══
const entrer = (x) => poster(x, { action: "entrer", theme: "foot" });
const oA = (await entrer(ANA)).ouverture;
const oB = (await entrer(BEN)).ouverture;
await entrer(CLEO);
await entrer(DAN);
const A = oA.moi;
const ficheAna = oB.presents.find((p) => p.q === A);
ok(ficheAna?.passions?.join() === "foot,musique" && /^[A-Za-z0-9_-]+$/.test(ficheAna.maison ?? ""), "la fiche d'Ana : ses passions, sa maison (ouverte à tous)");
ok(oB.presents.find((p) => p.q === oB.moi)?.maison === undefined, "… celle de Ben : pas de maison (ouverte à ses proches seulement)");
const mesSalons = await lire(`${ANA.id}/mes-salons.json`);
ok(mesSalons.themes?.foot?.dernier > 0, "🏠 « Mes salons » d'Ana retient le foot");
const maison = await appel(ANA, "/api/direct/ma-piece", null, COOKIE_ADMIN);
ok(maison.maison?.salons?.[0]?.theme === "foot" && maison.maison.salons[0].e === "⚽", "… et sa maison le montre (un fanion ⚽)");
const mA = await poster(ANA, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Quel but de Mbappé !" });
const ID = mA.message?.id;
ok(mA.statut === 200 && ID, "Ana : « Quel but de Mbappé ! »");
ok((await poster(ANA, { action: "aimer", salon: "foot-1", message: ID })).statut === 400, "on n'aime pas ses propres mots");
const c1 = await poster(BEN, { action: "aimer", salon: "foot-1", message: ID });
const c1b = await poster(BEN, { action: "aimer", salon: "foot-1", message: ID });
ok(c1.aimes === 1 && c1.etagere === false && c1b.aimes === 1, "Ben aime (deux fois : un seul cœur)");
ok((await poster(CLEO, { action: "aimer", salon: "foot-1", message: ID })).aimes === 2, "Cléo aussi : deux");
const c3 = await poster(DAN, { action: "aimer", salon: "foot-1", message: ID });
ok(c3.aimes === 3 && c3.etagere === true, "Dan : trois — il monte sur l'étagère");
const et = await appel(BEN, `${ROUTE}?etagere=foot-1`);
ok(et.moments?.length === 1 && et.moments[0].id === ID && et.moments[0].texte === "Quel but de Mbappé !" && et.moments[0].prenom === "Ana" && et.moments[0].n === 3, "🗄️ l'étagère du salon : le moment d'Ana, ❤️ 3");
const g = await poster(BEN, { action: "garder", salon: "foot-1", moment: ID });
const perso = await lire(`${BEN.id}/etagere-perso.json`);
ok(g.statut === 200 && g.id && (perso.objets ?? []).some((o) => o.id === g.id && o.titre.includes("Quel but") && /Ana/.test(o.citation ?? "")), "📌 « Garder » : il est chez Ben (« Quel but… », Le salon du foot · Ana)");
ok((await poster(BEN, { action: "garder", salon: "foot-1", moment: "1234567890123-zzzzzzzz-abcdef" })).statut === 404, "… pas un moment qui n'est pas sur l'étagère");

// ═══ 👯 AJOUTER EN PROCHE ═══
const d1 = await poster(BEN, { action: "proche", salon: "foot-1", q: A });
ok(d1.statut === 200 && d1.envoyee === true && d1.proches === false, "Ben veut ajouter Ana : la demande part");
const aAna = await accueil(ANA);
ok(aAna.demandes?.length === 1 && aAna.demandes[0].q === oB.moi && aAna.demandes[0].prenom === "Ben" && aAna.demandes[0].salon === "Le salon du foot", `l'accueil d'Ana : « 👯 Ben (${aAna.demandes?.[0]?.salon}) veut t'ajouter en proche »`);
const rep = await poster(ANA, { action: "repondre-proche", q: oB.moi, oui: true });
const pA = await lire(`${ANA.id}/proches.json`);
const pB = await lire(`${BEN.id}/proches.json`);
ok(rep.proches === true && pA.ids?.includes(BEN.id) && pB.ids?.includes(ANA.id) && !(await accueil(ANA)).demandes?.length, "Ana accepte : proches des deux côtés (leur conversation s'ouvre)");
const C = (await entrer(CLEO)).ouverture.moi;
ok((await poster(CLEO, { action: "proche", salon: "foot-1", q: A })).envoyee === true, "Cléo demande Ana…");
const croise = await poster(ANA, { action: "proche", salon: "foot-1", q: C });
ok(croise.proches === true && (await lire(`${CLEO.id}/proches.json`)).ids?.includes(ANA.id), "… Ana demande Cléo : proches tout de suite");
ok((await poster(ANA, { action: "proche", salon: "foot-1", q: A })).statut === 400, "on ne s'ajoute pas soi-même");
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
await json(`${DAN.id}/demandes-proche.json`, { jour, n: 10 });
ok((await poster(DAN, { action: "proche", salon: "foot-1", q: A })).statut === 429, "dix demandes par jour au plus");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLa séance et l'étagère tiennent ✓");
process.exit(echecs ? 1 : 0);
