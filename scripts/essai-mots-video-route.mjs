// 🎙️ « LAISSER UN MOT AVEC MA FIGURINE » : LA SUITE DE LA VIDÉO, PAR LES ROUTES (`lib/direct/mots-video.ts`,
// `mots-video-serveur.ts`, la route `/api/direct/mots-video` ; `docs/univers/decouvrir.md`, section 38) — contre le faux
// Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// La nuit passe : la même vidéo est à la télé de Léa, Sam, Inès, Max et Noé. Sans compte : 401. Noé n'a pas dit son âge :
// « as-tu 18 ans ? », puis il le dit. Ce qui ne part pas : sans l'accord, un son illisible, trop court, trop long, une
// vidéo qui n'est pas à sa télé. Sam laisse un mot (sa voix, ses têtes nettoyées) ; Inès (une inconnue pour Léa) aussi ;
// Léa répond à Sam (pas à un mot qui n'existe pas, pas à elle-même). Léa voit la suite : Sam (son proche) d'abord, sa
// réponse juste après, puis Inès — jamais un compte. Sam refait son mot : l'ancien son s'efface. Léa signale Inès : elle
// ne passe plus chez Léa, toujours chez Sam ; signalée par trois personnes : chez personne ; l'administrateur le voit.
// Un mot de plus de 30 jours ne passe plus. Sam efface son mot : la réponse de Léa reste, seule. Jade (15-17 ans) : sa
// suite à elle, jamais celle des adultes. Jamais le mot « exemple ».
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
const existe = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).status === 200;
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `3070d0e0-0000-4000-8000-0000000a10${String(n).padStart(2, "0")}`, jeton: `jeton-mots-video-route-0${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const INES = qui(3, "Inès");
const MAX = qui(4, "Max");
const NOE = qui(5, "Noé");
const JADE = qui(6, "Jade");
const GENS = [LEA, SAM, INES, MAX, NOE, JADE];
for (const x of GENS) x.q = qui8(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
  if (x !== NOE) await json(`${x.id}/majeur.json`, { age: x === JADE ? 16 : 30, adulte: x !== JADE, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot"], poids: {}, le: maintenant });
}
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });

const route = `${BASE}/api/direct/mots-video`;
const voir = async (x, video) => {
  const r = await fetch(`${route}?video=${encodeURIComponent(video)}`, { headers: x ? { cookie: `clikme_habitant=${x.jeton}` } : {} });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poster = async (x, corps) => {
  const r = await fetch(route, { method: "POST", headers: { "content-type": "application/json", ...(x ? { cookie: `clikme_habitant=${x.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const VOIX = () => Buffer.concat([Buffer.from("1a45dfa39f4286810142f7810142f2810442f381084282847765626d", "hex"), crypto.randomBytes(4000)]);
const enData = (o, type = "audio/webm") => `data:${type};base64,${o.toString("base64")}`;
const tous = [];
const garder = (r) => (tous.push(r), r);

// ═══ LA NUIT PASSE : LA MÊME VIDÉO EST À LEUR TÉLÉ ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(Array.isArray(nuit.faites) && nuit.faites.length > 0, "la nuit est passée");
const tele = await (await fetch(`${BASE}/api/direct/tele-du-jour`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json();
const V = tele.tele?.videos?.[0]?.id;
ok(Boolean(V), `la première vidéo de Léa (${V})`);
const dossier = `decouvrir/mots/adultes/${V}`;

// ═══ SANS COMPTE, SANS ÂGE ═══
ok((await voir(null, V)).statut === 401, "sans compte : 401");
ok((await poster(null, { action: "publier", id: V, son: enData(VOIX()), duree: 3, accord: true })).statut === 401, "… rien ne part");
const n0 = await voir(NOE, V);
ok(n0.statut === 403 && n0.age === true, "Noé n'a pas dit son âge : « as-tu 18 ans ? » (403, age)");
ok((await poster(NOE, { action: "publier", id: V, son: enData(VOIX()), duree: 3, accord: true })).age === true, "… ni publier");
ok((await poster(NOE, { action: "age", adulte: true })).adulte === true, "… il le dit : 18 ans ou plus");
const n1 = await voir(NOE, V);
ok(n1.statut === 200 && n1.suite?.tranche === "adultes", "… la suite des adultes");

// ═══ CE QUI NE PART PAS ═══
const l0 = garder(await voir(LEA, V));
ok(l0.statut === 200 && Array.isArray(l0.suite?.mots) && l0.suite.mots.length === 0, "avant : personne n'a laissé de mot");
ok(l0.suite?.montres === 6, "on en montre six avant « Tous »");
ok((await poster(SAM, { action: "publier", id: V, son: enData(VOIX()), duree: 3 })).statut === 400, "sans l'accord : refusé");
ok((await poster(SAM, { action: "publier", id: V, son: "pas un son", duree: 3, accord: true })).statut === 400, "un son illisible : refusé");
ok((await poster(SAM, { action: "publier", id: V, son: enData(VOIX(), "text/plain"), duree: 3, accord: true })).statut === 400, "du texte, pas un son : refusé");
ok((await poster(SAM, { action: "publier", id: V, son: enData(VOIX()), duree: 0.4, accord: true })).statut === 400, "trop court : refusé");
ok((await poster(SAM, { action: "publier", id: V, son: enData(VOIX()), duree: 14, accord: true })).statut === 400, "plus de dix secondes : refusé");
ok((await poster(SAM, { action: "publier", id: "AAAAAAAAAAA", son: enData(VOIX()), duree: 3, accord: true })).statut === 404, "une vidéo qui n'est pas à sa télé : 404");
ok((await voir(SAM, "AAAAAAAAAAA")).statut === 404, "… ni sa suite");

// ═══ SAM, PUIS INÈS, LAISSENT UN MOT ═══
const tetes = [{ t: 0.4, e: "sourire" }, { t: 1.2, e: "rire", r: 0.1, l: -0.2 }, { t: 2, e: "pouet" }, { t: 9, e: "rire" }, { t: 2.5, e: null }];
const s1 = garder(await poster(SAM, { action: "publier", id: V, son: enData(VOIX()), duree: 3.2, tetes, accord: true }));
ok(s1.statut === 200 && s1.ok === true, `Sam laisse son mot (${s1.statut})`);
const ficheSam = await lire(`${dossier}/${SAM.q}.json`);
ok(ficheSam?.duree === 3.2 && ficheSam.chemin?.startsWith(`${dossier}/son/${SAM.q}-`) && (await existe(ficheSam.chemin)), "rangé : sa fiche et son son, dans la suite des adultes");
ok(JSON.stringify(ficheSam?.tetes) === JSON.stringify([{ t: 0.4, e: "sourire" }, { t: 1.2, e: "rire", r: 0.1, l: -0.2 }, { t: 2.5, e: null }]), `ses têtes nettoyées : une expression inconnue et une seconde hors du mot retirées (${JSON.stringify(ficheSam?.tetes)})`);
ok((await poster(INES, { action: "publier", id: V, son: enData(VOIX()), duree: 5, accord: true })).statut === 200, "Inès laisse le sien");

// ═══ LÉA RÉPOND À SAM ═══
ok((await poster(LEA, { action: "publier", id: V, son: enData(VOIX()), duree: 2, repond: "zzzzzzzz", accord: true })).statut === 404, "répondre à un mot qui n'existe pas : 404");
ok((await poster(SAM, { action: "publier", id: V, son: enData(VOIX()), duree: 2, repond: SAM.q, accord: true })).statut === 404, "se répondre à soi-même : 404");
ok((await poster(LEA, { action: "publier", id: V, son: enData(VOIX()), duree: 2.5, repond: SAM.q, accord: true })).statut === 200, "Léa répond à Sam");

// ═══ LÉA VOIT LA SUITE ═══
const l1 = garder(await voir(LEA, V));
const ordre = (l) => (l.suite?.mots ?? []).map((m) => m.prenom).join(", ");
ok(ordre(l1) === "Sam, Léa, Inès", `Sam (son proche) d'abord, sa réponse juste après, puis Inès (${ordre(l1)})`);
const [mSam, mLea, mInes] = l1.suite?.mots ?? [];
ok(mSam?.proche === true && mSam.moi === false && mSam.duree === 3.2 && mSam.tetes?.length === 3, "Sam : son proche, 3,2 s, ses têtes");
ok(mLea?.moi === true && mLea.repond?.q === SAM.q && mLea.repond?.prenom === "Sam", "Léa : le sien, « répond à Sam »");
ok(mInes?.proche === false && mInes.moi === false, "Inès : elle a vu la vidéo (pas une proche)");
ok((l1.suite?.mots ?? []).every((m) => typeof m.src === "string" && m.src.length > 0), "chaque mot a son son (une adresse signée)");
const ecoute = await fetch(mSam?.src ?? "").catch(() => null);
ok(ecoute?.status === 200, `… on l'entend (${ecoute?.status})`);
const s2 = garder(await voir(SAM, V));
ok(ordre(s2) === "Sam, Léa, Inès" && s2.suite.mots[0].moi === true && s2.suite.mots[1].proche === true, `chez Sam aussi : la sienne, la réponse de Léa (sa proche), Inès (${ordre(s2)})`);
const m1 = garder(await voir(MAX, V));
ok(ordre(m1) === "Sam, Léa, Inès" && m1.suite.mots.every((m) => !m.proche && !m.moi), "Max, qui ne connaît personne : tout le monde les voit");

// ═══ SAM REFAIT SON MOT ═══
ok((await poster(SAM, { action: "publier", id: V, son: enData(VOIX()), duree: 4, accord: true })).statut === 200, "Sam refait son mot");
const ficheSam2 = await lire(`${dossier}/${SAM.q}.json`);
ok(ficheSam2?.duree === 4 && ficheSam2.chemin !== ficheSam.chemin && (await existe(ficheSam2.chemin)) && !(await existe(ficheSam.chemin)), "un seul mot par vidéo : le nouveau son, l'ancien effacé");

// ═══ SIGNALER ═══
ok((await poster(LEA, { action: "signaler", id: V, q: LEA.q })).statut === 400, "signaler son propre mot : non");
ok((await poster(LEA, { action: "signaler", id: V, q: "zzzzzzzz" })).statut === 404, "un mot qui n'existe pas : 404");
const g1 = await poster(LEA, { action: "signaler", id: V, q: INES.q });
ok(g1.statut === 200 && g1.cache === false, "Léa signale Inès");
ok(!ordre(await voir(LEA, V)).includes("Inès"), "… Inès ne passe plus chez Léa");
ok(ordre(await voir(SAM, V)).includes("Inès"), "… toujours chez Sam");
const admin = await fetch(`${FAUX}/storage/v1/object/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: `decouvrir/signalements/${INES.q}`, limit: 10 }) }).then((r) => r.json()).catch(() => []);
const copie = Array.isArray(admin) && admin[0]?.name ? await lire(`decouvrir/signalements/${INES.q}/${admin[0].name}`) : null;
ok(copie?.salon === `mot:${V}` && copie.motif === "mot" && copie.prenom === "Inès", "l'administrateur le voit, avec les signalements des salons");
await poster(MAX, { action: "signaler", id: V, q: INES.q });
const g3 = await poster(NOE, { action: "signaler", id: V, q: INES.q });
ok(g3.cache === true, "signalée par trois personnes : cachée");
ok(!ordre(await voir(SAM, V)).includes("Inès"), "… elle ne passe plus chez personne");
const i1 = await voir(INES, V);
ok(ordre(i1).includes("Inès"), "… sauf chez Inès elle-même (rien ne lui dit qu'on l'a signalée)");

// ═══ UN MOT DE PLUS DE 30 JOURS ═══
const VIEUX = qui8("quelqu-un-d-avant");
await fetch(`${STOCK}/figurines-clients/${dossier}/son/${VIEUX}-1.webm`, { method: "POST", headers: { "content-type": "audio/webm" }, body: VOIX() });
await json(`${dossier}/${VIEUX}.json`, { h: "quelqu-un-d-avant", q: VIEUX, prenom: "Ancien", chemin: `${dossier}/son/${VIEUX}-1.webm`, type: "audio/webm", duree: 3, le: Date.now() - 31 * 24 * 3600_000, tetes: [] });
ok(!ordre(await voir(LEA, V)).includes("Ancien"), "un mot de plus de 30 jours ne passe plus");

// ═══ SAM EFFACE SON MOT ═══
ok((await poster(SAM, { action: "effacer", id: V })).statut === 200, "Sam efface son mot");
ok(!(await existe(`${dossier}/${SAM.q}.json`)) && !(await existe(ficheSam2.chemin)), "… sa fiche et son son, partis");
const l3 = await voir(LEA, V);
ok(ordre(l3) === "Léa" && !l3.suite.mots[0].repond, `la réponse de Léa reste, seule (${ordre(l3)})`);

// ═══ JADE, 15-17 ANS ═══
const tJade = await (await fetch(`${BASE}/api/direct/tele-du-jour`, { headers: { cookie: `clikme_habitant=${JADE.jeton}` } })).json();
const VJ = tJade.tele?.videos?.[0]?.id;
ok(Boolean(VJ), `une vidéo à la télé de Jade (${VJ})`);
const j0 = await voir(JADE, VJ);
ok(j0.statut === 200 && j0.suite?.tranche === "jeunes" && j0.suite.mots.every((m) => !["Sam", "Léa", "Inès"].includes(m.prenom)), "Jade : la suite des 15-17 ans, jamais celle des adultes");
ok((await poster(JADE, { action: "publier", id: VJ, son: enData(VOIX()), duree: 3, accord: true })).statut === 200, "Jade laisse un mot");
ok((await existe(`decouvrir/mots/jeunes/${VJ}/${JADE.q}.json`)) && !(await existe(`decouvrir/mots/adultes/${VJ}/${JADE.q}.json`)), "… rangé dans la suite des 15-17 ans");
const surLaSienne = await voir(LEA, VJ);
ok(surLaSienne.statut === 404 || !ordre(surLaSienne).includes("Jade"), "… un adulte ne l'entend jamais");

// ═══ JAMAIS UN COMPTE, JAMAIS LE MOT « EXEMPLE » ═══
const tout = JSON.stringify(tous);
ok(!GENS.some((x) => tout.includes(x.id)), "jamais un compte dans ce qu'on renvoie");
ok(!/exemple/i.test(tout), "jamais le mot « exemple »");

console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
