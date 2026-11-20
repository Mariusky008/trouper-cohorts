// 📺 MES CHAÎNES YOUTUBE, PAR LES ROUTES (`lib/direct/chaines.ts`, `chaines-serveur.ts`, `app/api/direct/chaines`, la
// télé du jour, la nuit, l'administration ; le lot D8 de Découvrir, `docs/univers/decouvrir.md` section 23.1) — contre
// le faux Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// Léa suit « @lesbonsplans » par son lien : ses vidéos arrivent en tête de sa télé du jour, les plus récentes d'abord
// (la vidéo de 45 min passe ; réservée aux adultes, de 40 s, de dix jours, alcoolisée, illisible ailleurs : non). Le même
// @nom autrement écrit : déjà suivie. Pas un lien, une chaîne introuvable : refusés. « Suivre cette chaîne » depuis une
// vidéo de la sélection. Sam suit la même chaîne et réagit : il s'assoit chez Léa (jamais seul). Léa la regarde jusqu'au
// bout : elle s'en va, les poids de ses passions ne bougent pas. Dix chaînes au plus ; ne plus suivre. Noé (16 ans) suit
// la sienne. La nuit refait les chaînes suivies. L'administrateur voit les plus suivies, en retire une : elle disparaît
// des télés, personne ne peut plus la suivre. Aucun identifiant de compte dans les fichiers des chaînes.
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const json = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const qui = (n, prenom, age) => ({ id: `d8d8d8d8-0000-4000-8000-0000000e10${String(n).padStart(2, "0")}`, jeton: `jeton-chaines-route-000${n}`, prenom, age });
const LEA = qui(1, "Léa", 30);
const SAM = qui(2, "Sam", 31);
const NOE = qui(3, "Noé", 16);
const GENS = [LEA, SAM, NOE];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: x.age, adulte: x.age >= 18, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: { foot: 2 }, le: maintenant });
}
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });

const tele = `${BASE}/api/direct/tele-du-jour`;
const route = `${BASE}/api/direct/chaines`;
const avec = (x) => (x ? { cookie: `clikme_habitant=${x.jeton}` } : {});
const voir = async (url, x) => {
  const r = await fetch(url, { headers: avec(x) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poster = async (url, x, corps) => {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...avec(x) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const admin = async (corps) => {
  const r = await fetch(`${BASE}/api/admin/direct/decouvrir`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: COOKIE_ADMIN }, body: JSON.stringify(corps) } : { headers: { cookie: COOKIE_ADMIN } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const appelsChaines = async () => (await (await fetch(`${FAUX}/__youtube-chaines`)).json()) ?? [];

// ═══ LA NUIT PASSE ; LÉA N'A PAS DE CHAÎNE ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0 && nuit.chaines?.faites === 0, `la nuit est passée (aucune chaîne suivie : ${JSON.stringify(nuit.chaines)})`);
const g0 = await voir(route, LEA);
ok(g0.statut === 200 && Array.isArray(g0.chaines) && g0.chaines.length === 0, "Léa ne suit aucune chaîne");
ok((await voir(route, null)).statut === 401, "sans compte : 401");
const t0 = await voir(tele, LEA);
ok(t0.tele?.nouvelles === 0 && t0.tele?.chaines?.length === 0 && t0.tele?.videos?.[0]?.theme, "sa télé : la sélection de ses passions, sans nouveauté");
const V = t0.tele.videos[0];
ok(/^UC[\w-]{22}$/.test(V.chaineId ?? ""), `une vidéo de la sélection connaît sa chaîne (${V.chaineId})`);

// ═══ LÉA SUIT « @LESBONSPLANS » PAR SON LIEN ═══
const s1 = await poster(route, LEA, { action: "suivre", lien: "https://www.youtube.com/@lesbonsplans" });
const BP = s1.chaine;
ok(s1.statut === 200 && /^UC[\w-]{22}$/.test(BP?.id ?? "") && BP.nom === "Lesbonsplans" && /^https:\/\//.test(BP.image ?? "") && s1.chaines?.length === 1, `suivie : ${JSON.stringify(BP)}`);
const t1 = await voir(tele, LEA);
const neuves = (t1.tele?.videos ?? []).filter((v) => v.suivie?.id === BP.id);
ok(t1.tele?.nouvelles === 3 && neuves.length === 3 && t1.tele.videos.slice(0, 3).every((v) => v.suivie?.id === BP.id && v.theme === null), `ses trois vidéos en tête de la télé (${t1.tele?.nouvelles})`);
ok(neuves.map((v) => v.id.slice(-2)).join(",") === "0c,1c,4c", `les plus récentes d'abord ; la vidéo de 45 min passe ; réservée aux adultes, de 40 s, de dix jours, alcoolisée, illisible ailleurs : non (${neuves.map((v) => v.id.slice(-2)).join(",")})`);
ok(neuves.find((v) => v.id.endsWith("4c"))?.duree === 2700 && t1.tele.videos.slice(3).every((v) => v.theme), "… puis la sélection de ses passions");
ok(t1.tele?.chaines?.map((c) => c.id).join() === BP.id, "sa télé sait quelles chaînes elle suit");

// ═══ DÉJÀ SUIVIE ; LES REFUS ═══
const s2 = await poster(route, LEA, { action: "suivre", lien: "@LesBonsPlans" });
ok(s2.statut === 200 && s2.deja === true && s2.chaines?.length === 1, "le même @nom autrement écrit : déjà suivie");
ok((await poster(route, LEA, { action: "suivre", lien: "coucou" })).statut === 400, "pas un lien : 400");
ok((await poster(route, LEA, { action: "suivre", lien: "https://www.dailymotion.com/video/x8abcd" })).statut === 400, "un lien qui n'est pas YouTube : 400");
const intr = await poster(route, LEA, { action: "suivre", lien: "@introuvable" });
ok(intr.statut === 404 && /introuvable/.test(intr.error ?? ""), `une chaîne introuvable : 404 (« ${intr.error} »)`);

// ═══ « 📺 SUIVRE CETTE CHAÎNE », DEPUIS UNE VIDÉO DE LA SÉLECTION ═══
const s3 = await poster(route, LEA, { action: "suivre", video: V.id });
ok(s3.statut === 200 && s3.chaine?.id === V.chaineId && s3.chaines?.length === 2, `depuis une vidéo de sa télé : sa chaîne (${s3.chaine?.nom})`);

// ═══ SAM SUIT LA MÊME CHAÎNE ET RÉAGIT : IL S'ASSOIT CHEZ LÉA ═══
ok((await poster(route, SAM, { action: "suivre", lien: "youtube.com/@lesbonsplans" })).statut === 200, "Sam suit la même chaîne");
const C1 = neuves[1];
const rS = await poster(tele, SAM, { action: "reagir", id: C1.id, t: 12, sorte: "rire" });
ok(rS.statut === 200, `Sam réagit à une de ses vidéos (une vidéo d'une chaîne suivie : à sa télé) (${rS.statut})`);
await poster(tele, SAM, { action: "vue", id: C1.id, fin: true, secondes: 150 });
const dLea = await voir(`${tele}?reactions=${C1.id}`, LEA);
ok(dLea.statut === 200 && dLea.proches?.[0]?.cle === SAM.cle && dLea.proches[0].reactions?.[0]?.t === 12, "chez Léa, Sam est assis à côté d'elle, et rit à 12 s");
ok((await voir(`${tele}?video=${C1.id}`, LEA)).video?.suivie?.id === BP.id, "`?video=` la retrouve aussi");

// ═══ LÉA LA REGARDE JUSQU'AU BOUT ═══
const C0 = neuves[0];
ok((await poster(tele, LEA, { action: "garder", id: C0.id })).statut === 200, "📌 elle en garde une");
ok((await poster(tele, LEA, { action: "vue", id: C0.id, fin: true, secondes: 150 })).statut === 200, "et la regarde jusqu'au bout");
const t2 = await voir(tele, LEA);
ok(t2.tele?.videos?.filter((v) => v.suivie?.id === BP.id).length === 2 && !t2.tele.videos.some((v) => v.id === C0.id) && t2.tele.nouvelles === 5, `elle ne revient plus ; deux de Lesbonsplans l'attendent encore (et trois de La chaîne d'essai : ${t2.tele?.nouvelles} nouvelles)`);
ok((await lire(`${LEA.id}/passions.json`))?.poids?.foot === 2 && Object.keys((await lire(`${LEA.id}/passions.json`))?.poids ?? {}).length === 1, "les poids de ses passions n'ont pas bougé (une chaîne n'a pas de thème)");

// ═══ DIX CHAÎNES AU PLUS ; NE PLUS SUIVRE ═══
for (let k = 3; k <= 10; k++) await poster(route, LEA, { action: "suivre", lien: `@chaine${k}` });
ok((await voir(route, LEA)).chaines?.length === 10, "dix chaînes");
const onze = await poster(route, LEA, { action: "suivre", lien: "@chaine11" });
ok(onze.statut === 400 && /10 au plus/.test(onze.error ?? ""), `la onzième : « ${onze.error} »`);
const moins = await poster(route, LEA, { action: "ne-plus-suivre", id: s3.chaine.id });
ok(moins.statut === 200 && moins.chaines?.length === 9 && !moins.chaines.some((c) => c.id === s3.chaine.id), "ne plus suivre : neuf");
ok(!((await lire(`decouvrir/chaines/${s3.chaine.id}.json`))?.abonnes ?? ["?"]).length, "… elle n'a plus d'abonné");

// ═══ NOÉ (16 ANS) SUIT LA SIENNE ═══
const sN = await poster(route, NOE, { action: "suivre", lien: "@lessciences" });
const tN = await voir(tele, NOE);
ok(sN.statut === 200 && tN.tele?.nouvelles === 3 && tN.tele.videos[0]?.suivie?.nom === "Lessciences", "Noé suit la sienne : ses vidéos en tête (la réservée aux adultes, jamais)");

// ═══ LA NUIT REFAIT LES CHAÎNES SUIVIES ═══
const avant = (await appelsChaines()).filter((a) => a.chemin === "playlistItems").length;
const nuit2 = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
const apres = (await appelsChaines()).filter((a) => a.chemin === "playlistItems").length;
ok(nuit2.chaines?.faites === 10 && apres - avant === 10, `la nuit refait les dix chaînes suivies (pas celle qui n'a plus d'abonné) : ${JSON.stringify(nuit2.chaines)}, ${apres - avant} appels`);

// ═══ L'ADMINISTRATEUR ═══
ok((await fetch(`${BASE}/api/admin/direct/decouvrir`)).status === 403, "sans être administrateur : 403");
const a1 = await admin();
ok(a1.statut === 200 && a1.chaines?.[0]?.id === BP.id && a1.chaines[0].abonnes === 2 && a1.chaines[0].videos === 3, `les plus suivies d'abord : ${a1.chaines?.[0]?.nom} (${a1.chaines?.[0]?.abonnes} abonnés)`);
ok((await admin({ action: "retirer-chaine", id: BP.id })).statut === 200, "il retire « Lesbonsplans »");
const t3 = await voir(tele, LEA);
ok(!t3.tele?.videos?.some((v) => v.suivie?.id === BP.id) && !t3.tele.chaines.some((c) => c.id === BP.id) && !(await voir(route, LEA)).chaines.some((c) => c.id === BP.id), "elle disparaît de la télé de Léa, et de ses chaînes");
ok(!(await voir(tele, SAM)).tele?.videos?.some((v) => v.suivie?.id === BP.id), "… et de celle de Sam");
const ret = await poster(route, NOE, { action: "suivre", lien: "@lesbonsplans" });
ok(ret.statut === 403, `personne ne peut plus la suivre : « ${ret.error} »`);
ok((await admin()).chaines?.find((c) => c.id === BP.id)?.retiree === true, "l'administration la montre retirée");

// ═══ AUCUN IDENTIFIANT DE COMPTE ═══
const fBP = await lire(`decouvrir/chaines/${BP.id}.json`);
ok(fBP?.abonnes?.length === 2 && !GENS.some((x) => JSON.stringify(fBP).includes(x.id)), "le fichier d'une chaîne : ses abonnés en identifiants courts, jamais un compte");

console.log(echecs ? `\n${echecs} échec(s)` : "\nmes chaînes YouTube (les routes) : tout est bon");
process.exit(echecs ? 1 : 0);
