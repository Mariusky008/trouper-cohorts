// 🛋️ LES SALONS OUVERTS DE DÉCOUVRIR (`lib/direct/salons-ouverts.ts`, `salons-ouverts-serveur.ts`,
// `app/api/direct/salons-ouverts`, `app/api/admin/direct/salons` ; les lots D3 et D4, `docs/univers/decouvrir.md` section
// 18), PAR LES ROUTES — contre le faux Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// L'accueil : douze salons pour les adultes (onze pour les 15-17 ans), ses passions d'abord ; sans âge dit, la question
// d'abord. Entrer : le salon du thème (sa pièce, la télé du jour, sa place) ; les 15-17 ans dans leur maison à part — ils
// ne voient jamais les adultes. Écrire : relu avant de partir (lien, numéro, réseau, question personnelle, gros mot,
// alcool : refusés, et rien n'est rangé) ; réagir, un geste à quelqu'un qui est là ; doucement (pas deux d'un coup). Le
// pouls : qui est là, ce qui s'est dit. « Ne plus voir ». Plein à huit : un deuxième salon s'ouvre ; une place libérée,
// on revient dans le plus rempli. Trois signalements de trois personnes en une heure : 24 h dehors (le même qui signale
// deux fois compte une fois). L'administrateur voit tout, réintègre, exclut.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000005a10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-ouverts-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const NOE = qui(3, "Noé");
const ZOE = qui(4, "Zoé");
const TOM = qui(5, "Tom");
const AUTRES = ["Ana", "Ben", "Cléo", "Dan", "Éva", "Fred", "Gil", "Hugo"].map((p, k) => qui(10 + k, p));
const GENS = [LEA, SAM, NOE, ZOE, TOM, ...AUTRES];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
// (leurs figurines assises, du nouveau style — sauf Tom)
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS.filter((y) => y !== TOM)) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
}
for (const x of [LEA, SAM, TOM, ...AUTRES]) await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
await json(`${NOE.id}/majeur.json`, { age: 15, adulte: false, le: maintenant });
await json(`${LEA.id}/passions.json`, { passions: ["cuisine", "foot", "animaux"], poids: {}, le: maintenant });
// (le décor du salon du foot : le salon du catalogue, son panorama et sa télé)
await poserPiece(deposer, "salon", { le: maintenant });
// (la nuit passe : la sélection du jour)
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée");

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
const ROUTE = "/api/direct/salons-ouverts";
const appel = async (x, chemin, corps, cookie) => {
  const c = cookie ?? (x ? `clikme_habitant=${x.jeton}` : "");
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const accueil = (x) => appel(x, `${ROUTE}?accueil=1`);
const poster = (x, corps) => appel(x, ROUTE, corps);
const entrer = (x, theme = "foot") => poster(x, { action: "entrer", theme });
const pouls = (x, salon, depuis = 0, connus = "") => appel(x, `${ROUTE}?salon=${salon}&depuis=${depuis}&connus=${connus}`);

// ═══ L'ACCUEIL ═══
ok((await accueil(null)).statut === 401, "sans compte : 401");
const z0 = await accueil(ZOE);
ok(z0.age === true && z0.cartes?.length === 0, "sans son âge dit : la question d'abord");
ok((await entrer(ZOE)).age === true, "… et on n'entre pas");
ok((await poster(ZOE, { action: "age", adulte: true })).adulte === true, "« J'ai 18 ans ou plus »");
const a1 = await accueil(LEA);
ok(a1.maison === "adultes" && a1.cartes?.length === 12, `Léa (adulte) : les douze salons (${a1.cartes?.length})`);
ok(a1.cartes.slice(0, 3).every((c) => c.mien) && a1.cartes.slice(0, 3).map((c) => c.theme).sort().join() === "animaux,cuisine,foot", "ses passions d'abord");
const foot = a1.cartes.find((c) => c.theme === "foot");
ok(foot?.nom === "Le salon du foot" && foot.presents === 0 && /\/api\/direct\/salon\/fichier\//.test(foot.decor?.src ?? ""), "le salon du foot : personne, son décor (le salon)");
const n0 = await accueil(NOE);
ok(n0.maison === "jeunes" && n0.cartes.length === 11 && !n0.cartes.some((c) => c.theme === "parents"), "Noé (15 ans) : onze salons, pas celui des jeunes parents");
ok((await entrer(NOE, "parents")).statut === 403, "… il n'y entre pas");
ok((await entrer(TOM)).figurine === true, "Tom, sans sa figurine assise : il ne peut pas entrer");

// ═══ ENTRER ═══
const e1 = await entrer(LEA);
const o1 = e1.ouverture;
ok(e1.statut === 200 && o1?.salon?.id === "foot-1" && o1.salon.nom === "⚽ Le salon du foot" && o1.salon.maison === "adultes", `Léa entre : le salon du foot (${o1?.salon?.id})`);
ok(o1.presents.length === 1 && o1.presents[0].q === o1.moi && o1.presents[0].place === 0 && o1.presents[0].prenom === "Léa" && /\/api\/direct\/salon\/fichier\//.test(o1.presents[0].figurine?.src ?? ""), "… seule, à la première place, sa figurine");
ok(!JSON.stringify(o1).includes(LEA.id), "… son compte n'est jamais montré");
ok(o1.decor?.piece === "salon" && o1.tele?.videos?.length >= 10 && o1.tele.videos.every((v) => /^[A-Za-z0-9_-]{11}$/.test(v.id) && v.duree > 0) && Math.abs(o1.tele.maintenant - Date.now()) < 10_000, `le décor du salon, la télé du jour (${o1.tele?.videos?.length} vidéos), l'heure du serveur`);
const o2 = (await entrer(SAM)).ouverture;
ok(o2?.salon?.id === "foot-1" && o2.presents.length === 2 && o2.presents.find((p) => p.q === o2.moi)?.place === 1, "Sam entre dans le même : la deuxième place");
const o3 = (await entrer(NOE)).ouverture;
ok(o3?.salon?.maison === "jeunes" && o3.presents.length === 1, "Noé : le salon du foot des 15-17 ans — il n'y voit ni Léa ni Sam");
const L = o1.moi;
const S = o2.moi;

// ═══ ÉCRIRE ═══
const m1 = await poster(LEA, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "  Salut   tout le monde 👋 " });
ok(m1.statut === 200 && m1.message?.texte === "Salut tout le monde 👋" && m1.message.de === L && m1.message.prenom === "Léa", "Léa écrit : « Salut tout le monde 👋 »");
const p1 = (await pouls(SAM, "foot-1")).pouls;
ok(p1?.ici?.sort().join() === [L, S].sort().join() && p1.nouveaux.length === 2 && p1.messages.some((m) => m.id === m1.message.id), "le pouls de Sam : Léa et lui ; le message de Léa");
const p2 = (await pouls(SAM, "foot-1", m1.message.le, [L, S].join(","))).pouls;
ok(p2?.nouveaux.length === 0 && p2.messages.length === 0, "… ce qu'il connaît déjà ne revient pas");
const refuses = [
  ["regarde www.monsite.fr", "lien"],
  ["mon numéro 06 12 34 56 78", "numéro"],
  ["ajoute moi sur snap", "réseau"],
  ["tu habites où ?", "personnel"],
  ["t'as quel âge ?", "personnel"],
  ["espèce de connard", "ces mots"],
  ["on se prend une bière ?", "alcoolisé"],
  ["a".repeat(91), "90 signes"],
];
for (const [t, attendu] of refuses) {
  await pause(1600);
  const r = await poster(LEA, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: t });
  ok(r.statut === 400 && typeof r.refus === "string" && r.refus.includes(attendu.replace("personnel", "personnel")) && /ne part pas/.test(r.error ?? ""), `refusé (${attendu}) : « ${r.error} »`);
}
const conv = await appel(LEA, `${ROUTE}?conversation=foot-1`);
ok(conv.messages?.length === 1, "… et rien de refusé n'est rangé");

// ═══ RÉAGIR, UN GESTE ═══
const r1 = await poster(SAM, { action: "ecrire", salon: "foot-1", sorte: "reaction", cle: "rire" });
ok(r1.statut === 200 && r1.message?.sorte === "reaction" && r1.message.cle === "rire", "Sam rit (😂)");
const trop = await poster(SAM, { action: "ecrire", salon: "foot-1", sorte: "reaction", cle: "coeur" });
ok(trop.statut === 429, "deux d'un coup : « Doucement »");
await pause(1600);
const g1 = await poster(SAM, { action: "ecrire", salon: "foot-1", sorte: "geste", cle: "coucou", a: L });
ok(g1.statut === 200 && g1.message?.a === L, "un coucou à Léa (👋)");
await pause(1600);
ok((await poster(SAM, { action: "ecrire", salon: "foot-1", sorte: "geste", cle: "bravo", a: o3.moi })).statut === 400, "un geste à quelqu'un qui n'est pas là : non");
const mNoe = await poster(NOE, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Salut les 15-17" });
const conv2 = (await appel(LEA, `${ROUTE}?conversation=foot-1`)).messages ?? [];
ok(mNoe.statut === 200 && !conv2.some((m) => m.id === mNoe.message?.id), "Noé écrit au même salon : celui des 15-17 ans — jamais chez les adultes");
ok(conv2.map((m) => m.sorte).join() === "texte,reaction,geste" && conv2.every((m, k) => !k || m.le >= conv2[k - 1].le), "💬 la conversation : dans l'ordre");

// ═══ NE PLUS VOIR ═══
const cache = await poster(LEA, { action: "ne-plus-voir", q: S });
ok(cache.caches?.includes(S), "Léa ne veut plus voir Sam");
ok(((await pouls(LEA, "foot-1")).pouls?.messages ?? []).every((m) => m.de !== S) && ((await appel(LEA, `${ROUTE}?conversation=foot-1`)).messages ?? []).every((m) => m.de !== S), "… ses messages ne lui arrivent plus, ni dans la conversation");
ok((await poster(LEA, { action: "revoir", q: S })).caches?.includes(S) === false, "« Revoir » : il revient");

// ═══ PLEIN À HUIT : UN DEUXIÈME SALON ═══
for (const x of AUTRES.slice(0, 6)) await entrer(x);
const plein = (await pouls(LEA, "foot-1")).pouls;
ok(plein?.ici?.length === 8, `huit dans le salon du foot (${plein?.ici?.length})`);
const places = (await Promise.all([LEA, SAM, ...AUTRES.slice(0, 6)].map(async (x) => (await entrer(x)).ouverture))).map((o) => o?.presents.find((p) => p.q === o.moi)?.place);
ok(new Set(places).size === 8 && places.every((k) => k >= 0 && k < 8), `chacun sa place, de 0 à 7 (${places.join(" ")})`);
const o7 = (await entrer(AUTRES[6])).ouverture;
ok(o7?.salon?.id === "foot-2" && o7.salon.nom === "⚽ Le salon du foot · 2" && o7.salon.plein === true, "le neuvième : le salon du foot · 2 (« le premier est complet »)");
ok(((await accueil(LEA)).cartes ?? []).find((c) => c.theme === "foot")?.presents >= 1, "l'accueil compte ceux qui y sont");
ok((await poster(AUTRES[0], { action: "sortir", salon: "foot-1" })).statut === 200, "Ana sort : sa place se libère");
const o8 = (await entrer(AUTRES[7])).ouverture;
ok(o8?.salon?.id === "foot-1", "Hugo arrive : le plus rempli qui a une place (le premier)");

// ═══ SIGNALER : TROIS PERSONNES EN UNE HEURE ═══
const signaler = (x, q = S) => poster(x, { action: "signaler", salon: "foot-1", q, motif: "Des insultes ou des moqueries" });
ok((await signaler(LEA)).exclu === false && (await signaler(LEA)).exclu === false, "Léa signale Sam (deux fois : une seule voix)");
ok((await signaler(AUTRES[1])).exclu === false, "Ben aussi : deux personnes");
ok((await poster(SAM, { action: "signaler", salon: "foot-1", q: S, motif: "Autre chose" })).statut === 400, "on ne se signale pas soi-même");
const s3 = await signaler(AUTRES[2]);
ok(s3.exclu === true, "Cléo : la troisième — Sam quitte les salons ouverts");
ok((await pouls(SAM, "foot-1")).pouls?.exclu === true, "… son pouls le lui dit");
const sansSam = (await pouls(LEA, "foot-1")).pouls;
ok(sansSam && !sansSam.ici.includes(S), "… sa place est libre");
const es = await entrer(SAM);
ok(es.statut === 403 && es.exclu === true && /Reviens demain/.test(es.error ?? ""), "… il ne rentre plus (24 h)");

// ═══ L'ADMINISTRATEUR ═══
ok((await appel(LEA, "/api/admin/direct/salons")).statut === 403, "l'administration : réservée à l'administrateur");
const ad = await appel(null, "/api/admin/direct/salons", null, COOKIE_ADMIN);
ok(ad.salons?.some((x) => x.id === "foot-1" && x.maison === "adultes" && x.presents.length >= 7) && ad.salons.some((x) => x.maison === "jeunes"), "les salons en cours (adultes et 15-17 ans)");
ok(ad.signalements?.filter((x) => x.q === S).length === 4 && ad.exclus?.some((x) => x.q === S && x.prenom === "Sam" && x.par === "signalements"), "les signalements de Sam, et son exclusion");
ok((await appel(null, "/api/admin/direct/salons", { action: "reintegrer", q: S }, COOKIE_ADMIN)).ok === true && (await entrer(SAM)).statut === 200, "« Réintégrer » : Sam peut revenir");
const D = (await entrer(AUTRES[3])).ouverture?.moi;
ok((await appel(null, "/api/admin/direct/salons", { action: "exclure", q: D, heures: 24 }, COOKIE_ADMIN)).ok === true && (await entrer(AUTRES[3])).statut === 403, "« Exclure 24 h » : Dan ne rentre plus");

// ═══ LES MESSAGES DE PLUS DE 48 H S'EFFACENT ═══
const vieux = `${Date.now() - 49 * 3600_000}-zzzzzzzz-abcdef`;
await json(`decouvrir/salons/adultes/foot-1/messages/${vieux}.json`, { id: vieux, de: "zzzzzzzz", prenom: "Ancien", le: Date.now() - 49 * 3600_000, sorte: "texte", texte: "il y a longtemps" });
await entrer(LEA);
let reste = true;
for (let i = 0; i < 20 && reste; i++) {
  await pause(150);
  reste = (await lister("decouvrir/salons/adultes/foot-1/messages")).includes(`${vieux}.json`);
}
ok(!reste, "un message de plus de 48 h : effacé");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLes salons ouverts tiennent ✓");
process.exit(echecs ? 1 : 0);
