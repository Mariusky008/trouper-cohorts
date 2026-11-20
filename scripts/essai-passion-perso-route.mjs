// ✨ MA PASSION À MOI, PAR LES ROUTES (`lib/direct/passion-perso.ts`, `passion-perso-serveur.ts`, `/api/direct/passions`,
// la télé du jour, la nuit, l'administration ; le lot D9 de Découvrir, `docs/univers/decouvrir.md` section 23.2) — contre
// le faux Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// Léa écrit « La pêche à la mouche » : relue, gardée, cherchée tout de suite (en français, des trente derniers jours) ;
// ses vidéos se mêlent à sa télé du jour, avec leur propre poids. Trop court, trop long, alcoolisé, un réseau, un lien :
// refusés ; sans passions d'abord : refusé. Sam écrit « pêche à la mouche » : la même clé, pas de nouvelle recherche.
// Léa change ses passions : la sienne reste. Noé (16 ans) a sa propre recherche (le filtre strict). Le budget de la
// journée (10 recherches) : la onzième passion attend la nuit, qui la cherche. L'administrateur voit les passions et le
// budget, en refuse une : elle disparaît pour tout le monde. Léa enlève la sienne. Aucun identifiant de compte.
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
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

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

const qui = (n, prenom, age, passions = true) => ({ id: `d9d9d9d9-0000-4000-8000-0000000f20${String(n).padStart(2, "0")}`, jeton: `jeton-passion-perso-route-0${n}`, prenom, age, passions });
const LEA = qui(1, "Léa", 30);
const SAM = qui(2, "Sam", 31);
const NOE = qui(3, "Noé", 16);
const TOM = qui(4, "Tom", 40);
const ZOE = qui(5, "Zoé", 25, false);
const GENS = [LEA, SAM, NOE, TOM, ZOE];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: x.age, adulte: x.age >= 18, le: maintenant });
  if (x.passions) await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}

const route = `${BASE}/api/direct/passions`;
const tele = `${BASE}/api/direct/tele-du-jour`;
const avec = (x) => ({ cookie: `clikme_habitant=${x.jeton}` });
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
const recherches = async () => ((await (await fetch(`${FAUX}/__youtube`)).json()) ?? []);

// ═══ LA NUIT PASSE ; PERSONNE N'A DE PASSION À SOI ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0 && nuit.perso?.faites === 0, `la nuit est passée (aucune passion à soi : ${JSON.stringify(nuit.perso)})`);
ok((await voir(route, LEA)).perso === null, "Léa n'a pas de passion à soi");

// ═══ LÉA ÉCRIT « LA PÊCHE À LA MOUCHE » ═══
const avant = (await recherches()).length;
const p1 = await poster(route, LEA, { action: "perso", mots: "  La pêche   à la mouche " });
ok(p1.statut === 200 && p1.perso?.mots === "La pêche à la mouche" && p1.perso?.cle === "peche-a-mouche" && !p1.bientot, `gardée : ${JSON.stringify(p1.perso)} (cherchée tout de suite)`);
const r1 = (await recherches()).slice(avant);
const depuis = Date.parse(r1[0]?.publishedAfter ?? "");
ok(r1.length === 1 && r1[0].q === "La pêche à la mouche" && r1[0].safeSearch === "moderate" && r1[0].regionCode === "FR" && r1[0].relevanceLanguage === "fr" && Math.abs(Date.now() - depuis - 30 * 86400_000) < 3600_000, "une recherche : ses mots, en France, en français, des trente derniers jours");
const f1 = await lire("decouvrir/perso/peche-a-mouche.json");
ok(f1?.videos?.length === 5 && f1.gens?.join() === qui8(LEA.id) && f1.mots === "La pêche à la mouche", `ses vidéos : cinq (alcoolisée, de 45 min, illisible ailleurs : non) ; Léa la suit (${f1?.videos?.length})`);
ok((await voir(route, LEA)).perso?.mots === "La pêche à la mouche", "« Tes passions » la montre");

// ═══ LES REFUS ═══
ok((await poster(route, LEA, { action: "perso", mots: "ab" })).statut === 400, "trop court : 400");
ok((await poster(route, LEA, { action: "perso", mots: "a".repeat(41) })).statut === 400, "trop long : 400");
const biere = await poster(route, LEA, { action: "perso", mots: "la bière artisanale" });
ok(biere.statut === 400 && biere.error === "Choisis une autre passion.", `alcoolisé : « ${biere.error} »`);
ok((await poster(route, LEA, { action: "perso", mots: "mon insta @lea" })).statut === 400, "un réseau : 400");
ok((await poster(route, LEA, { action: "perso", mots: "va sur peche.fr" })).statut === 400, "un lien : 400");
ok((await poster(route, ZOE, { action: "perso", mots: "les trains" })).statut === 400, "sans passions d'abord : 400");
ok((await voir(route, LEA)).perso?.mots === "La pêche à la mouche", "la sienne n'a pas bougé");

// ═══ SAM ÉCRIT LA MÊME CHOSE, AUTREMENT ═══
const avantSam = (await recherches()).length;
const p2 = await poster(route, SAM, { action: "perso", mots: "pêche à la mouche" });
ok(p2.statut === 200 && p2.perso?.cle === "peche-a-mouche" && (await recherches()).length === avantSam, "Sam : « pêche à la mouche », la même clé — pas de nouvelle recherche");
ok((await lire("decouvrir/perso/peche-a-mouche.json"))?.gens?.length === 2, "… ils sont deux à la suivre");

// ═══ DANS LA TÉLÉ DE LÉA ═══
const t1 = await voir(tele, LEA);
const siennes = (t1.tele?.videos ?? []).filter((v) => v.perso === "La pêche à la mouche");
ok(siennes.length === 5 && siennes.every((v) => v.theme === null) && t1.tele.videos.slice(0, 4).some((v) => v.perso), `ses cinq vidéos, mêlées aux autres (une dans les quatre premières)`);
const P = siennes[0];
ok((await poster(tele, LEA, { action: "reagir", id: P.id, t: 4, sorte: "rire" })).statut === 200, "elle réagit à une de ses vidéos (à sa télé)");
ok((await poster(tele, LEA, { action: "vue", id: P.id, fin: true, secondes: 150 })).statut === 200, "… la regarde jusqu'au bout");
ok((await lire(`${LEA.id}/passions.json`))?.poids?.perso === 1, "son poids « perso » monte");
ok((await voir(`${tele}?video=${P.id}`, LEA)).video?.perso === "La pêche à la mouche", "`?video=` la retrouve");

// ═══ ELLE CHANGE SES PASSIONS : LA SIENNE RESTE ═══
ok((await poster(route, LEA, { passions: ["foot", "series", "musique"] })).statut === 200, "elle change ses passions");
ok((await voir(route, LEA)).perso?.mots === "La pêche à la mouche" && (await lire(`${LEA.id}/passions.json`))?.poids?.perso === 1, "… sa passion à soi reste, et son poids");

// ═══ NOÉ (16 ANS) : SA PROPRE RECHERCHE ═══
const avantNoe = (await recherches()).length;
ok((await poster(route, NOE, { action: "perso", mots: "La pêche à la mouche" })).statut === 200, "Noé écrit la même");
const rN = (await recherches()).slice(avantNoe);
ok(rN.length === 1 && rN[0].safeSearch === "strict" && (await lire("decouvrir/perso/peche-a-mouche.jeunes.json"))?.videos?.length === 5, "… les 15-17 ans ont la leur, au filtre strict");

// ═══ LE BUDGET DE LA JOURNÉE (10 RECHERCHES) ═══
const mots = ["les trains", "la k-pop", "le tricot", "les échecs", "la plongée", "le skate", "les orchidées", "le jardinage", "la calligraphie"];
let derniere = null;
for (const m of mots) derniere = await poster(route, TOM, { action: "perso", mots: m });
ok(derniere?.statut === 200 && derniere.bientot === true && !(await lire("decouvrir/perso/calligraphie.json"))?.videos?.length, "la onzième passion de la journée : gardée, mais elle attend la nuit (« elles arrivent bientôt »)");
ok((await lire("decouvrir/perso/orchidees.json"))?.videos?.length === 5 && !(await lire("decouvrir/perso/orchidees.json"))?.gens?.length, "Tom a changé huit fois : les passions qu'il a quittées n'ont plus personne");
const nuit2 = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit2.perso?.faites === 1 && (await lire("decouvrir/perso/calligraphie.json"))?.videos?.length === 5, `la nuit la cherche (les autres sont fraîches) : ${JSON.stringify(nuit2.perso)}`);

// ═══ L'ADMINISTRATEUR ═══
const a1 = await admin();
const top = a1.perso?.passions?.[0];
ok(a1.statut === 200 && top?.cle === "peche-a-mouche" && top.gens === 2 && !top.jeunes && a1.perso.budget.journee === 10 && a1.perso.budget.nuit === 1, `les plus suivies d'abord (${top?.mots}, ${top?.gens}) ; le budget du jour (${JSON.stringify(a1.perso?.budget)})`);
ok((await admin({ action: "refuser-passion", cle: "peche-a-mouche" })).statut === 200, "il refuse « peche-a-mouche »");
const vueLea = await voir(route, LEA);
ok(vueLea.perso?.refusee === true && !(await voir(tele, LEA)).tele?.videos?.some((v) => v.perso), "chez Léa : refusée, ses vidéos ont quitté sa télé");
const re = await poster(route, SAM, { action: "perso", mots: "La pêche à la mouche" });
ok(re.statut === 400 && re.error === "Choisis une autre passion.", "personne ne peut plus la choisir");

// ═══ LÉA L'ENLÈVE ═══
const enl = await poster(route, LEA, { action: "perso", mots: "" });
ok(enl.statut === 200 && enl.perso === null && (await voir(route, LEA)).perso === null, "Léa l'enlève");
ok(!(await lire("decouvrir/perso/peche-a-mouche.json"))?.gens?.includes(qui8(LEA.id)), "… elle ne la suit plus");

// ═══ AUCUN IDENTIFIANT DE COMPTE ═══
const fichiers = JSON.stringify([await lire("decouvrir/perso/peche-a-mouche.json"), await lire("decouvrir/perso/peche-a-mouche.jeunes.json"), await lire("decouvrir/perso/calligraphie.json")]);
ok(!GENS.some((x) => fichiers.includes(x.id)), "les fichiers des passions : des identifiants courts, jamais un compte");

console.log(echecs ? `\n${echecs} échec(s)` : "\nma passion à moi (les routes) : tout est bon");
process.exit(echecs ? 1 : 0);
