// 🧭 DÉCOUVRIR, LE LOT D0 (`lib/direct/decouvrir.ts`, `passions-serveur.ts`, `selection-serveur.ts` ; `/api/direct/passions`,
// `/api/cron/decouvrir-selection`, `/api/admin/direct/decouvrir`) — contre le faux Supabase et le faux YouTube, jamais la
// vraie base, jamais YouTube.
//
// SES PASSIONS : sans compte, 401. Léa (15-17 ans) voit onze thèmes (pas le salon des jeunes parents) ; deux : refusé ;
// six : refusé ; avec les jeunes parents : refusé ; trois : rangées, et relues. Sam (adulte) voit les douze, et peut
// choisir les jeunes parents.
// LA SÉLECTION DE LA NUIT : 23 sélections (12 thèmes pour les adultes, 11 pour les 15-17 ans), 69 recherches (trois par
// sélection : en France, en français, lisibles ailleurs, de la semaine ; filtre strict pour les 15-17 ans) ; quinze
// vidéos par thème, jamais celle qui parle de bière, ni celle de 45 minutes, ni celle qui ne se lit pas ailleurs.
// L'ADMINISTRATEUR : seul à voir la sélection ; il retire une vidéo (partie des deux variantes, et elle ne revient pas en
// refaisant le thème) ; il en ajoute une par son lien (en tête, pour les deux variantes ; elle reste en refaisant) ; un
// lien qui n'est pas YouTube : 400 ; une vidéo de 45 minutes : 422.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-decouvrir-route.mjs
const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = "http://127.0.0.1:54321";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const json = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const LEA = { id: "d0d0d0d0-0000-4000-8000-00000000d001", jeton: "jeton-decouvrir-route-01", prenom: "Léa" };
const SAM = { id: "d0d0d0d0-0000-4000-8000-00000000d002", jeton: "jeton-decouvrir-route-02", prenom: "Sam" };
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await json(`${LEA.id}/majeur.json`, { age: 15, adulte: false, le: new Date().toISOString() });
await json(`${SAM.id}/majeur.json`, { age: 15, adulte: true, le: new Date().toISOString() });
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const appel = async (chemin, cookie, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const passions = (q, corps) => appel("/api/direct/passions", q ? `clikme_habitant=${q.jeton}` : "", corps);
const admin = (corps, cookie = COOKIE_ADMIN) => appel("/api/admin/direct/decouvrir", cookie, corps);

// ═══ SES PASSIONS ═══
ok((await passions(null)).statut === 401, "sans compte : 401");
const vueLea = await passions(LEA);
ok(vueLea.themes?.length === 11 && !vueLea.themes.some((t) => t.id === "parents") && vueLea.adulte === false, `Léa (15-17 ans) : onze thèmes, sans les jeunes parents (${vueLea.themes?.length})`);
ok(Array.isArray(vueLea.passions) && vueLea.passions.length === 0, "… rien de choisi encore");
ok((await passions(LEA, { passions: ["foot", "cuisine"] })).statut === 400, "deux : refusé (de 3 à 5)");
ok((await passions(LEA, { passions: ["foot", "cuisine", "animaux", "humour", "mode", "manga"] })).statut === 400, "six : refusé");
const p1 = await passions(LEA, { passions: ["foot", "cuisine", "parents"] });
ok(p1.statut === 400 && /réservé aux adultes/.test(p1.error ?? ""), "les jeunes parents, avant 18 ans : refusé");
ok((await passions(LEA, { passions: ["foot", "inconnu", "cuisine"] })).statut === 400, "une passion qui n’existe pas : refusé");
const p2 = await passions(LEA, { passions: ["foot", "cuisine", "animaux", "foot"] });
ok(p2.statut === 200 && p2.passions?.join() === "foot,cuisine,animaux", `trois (le double compte une fois) : rangées (${p2.passions})`);
ok((await passions(LEA)).passions?.join() === "foot,cuisine,animaux", "… et relues");
const vueSam = await passions(SAM);
ok(vueSam.themes?.length === 12 && vueSam.adulte === true, "Sam (adulte) : les douze thèmes");
ok((await passions(SAM, { passions: ["parents", "humour", "series", "musique", "jeux"] })).statut === 200, "… et peut choisir les jeunes parents (cinq)");

// ═══ LA SÉLECTION DE LA NUIT ═══
ok((await admin(undefined, "")).statut === 403 && (await admin(undefined, `clikme_habitant=${SAM.jeton}`)).statut === 403, "la sélection : l’administrateur seulement");
const avant = await admin();
ok(avant.branche === true && avant.themes?.length === 12 && avant.themes.every((t) => !t.adultes), "avant la nuit : la clé branchée, rien de sélectionné");
const nuit = await appel("/api/cron/decouvrir-selection", "");
ok(nuit.statut === 200 && nuit.faites?.length === 23, `la nuit : 23 sélections (${nuit.faites?.length})`);
ok(nuit.faites?.every((f) => f.n === 15 && !f.erreur), `… quinze vidéos chacune (${[...new Set(nuit.faites?.map((f) => f.n))]})`);
const demandes = await (await fetch(`${FAUX}/__youtube`)).json();
ok(demandes.length === 69, `69 recherches YouTube (${demandes.length})`);
ok(demandes.filter((d) => d.safeSearch === "strict").length === 33 && demandes.filter((d) => d.safeSearch === "moderate").length === 36, "… le filtre strict pour les 15-17 ans (33), modéré pour les adultes (36)");
const semaine = Date.now() - 8 * 86400_000;
ok(demandes.every((d) => d.regionCode === "FR" && d.relevanceLanguage === "fr" && d.videoEmbeddable === "true" && Date.parse(d.publishedAfter) > semaine), "… en France, en français, lisibles ailleurs, de la semaine");
const apres = await admin();
const foot = apres.themes?.find((t) => t.theme === "foot");
ok(foot?.adultes?.videos.length === 15 && foot?.jeunes?.videos.length === 15, "le foot : quinze vidéos pour les adultes, quinze pour les 15-17 ans");
const toutes = apres.themes.flatMap((t) => [...(t.adultes?.videos ?? []), ...(t.jeunes?.videos ?? [])]);
ok(!toutes.some((v) => /bière/i.test(v.titre)), "jamais celle qui parle de bière");
ok(toutes.every((v) => v.duree >= 30 && v.duree <= 1200), "… ni celle de 45 minutes");
ok(!toutes.some((v) => v.id.at(-2) === "6"), "… ni celle qui ne se lit pas ailleurs");
ok(apres.themes.find((t) => t.theme === "parents")?.jeunes === null, "les jeunes parents : pas de sélection pour les 15-17 ans");

// ═══ L'ADMINISTRATEUR : RETIRER, AJOUTER ═══
const premiere = foot.adultes.videos[0].id;
ok((await admin({ action: "retirer", theme: "foot", id: premiere })).statut === 200, "retirer la première vidéo du foot");
let f2 = (await admin()).themes.find((t) => t.theme === "foot");
ok(!f2.adultes.videos.some((v) => v.id === premiere) && !f2.jeunes.videos.some((v) => v.id === premiere), "… partie des deux télés (adultes, 15-17 ans)");
const ajout = await admin({ action: "ajouter", theme: "foot", lien: "https://youtu.be/AbCdEfGh01x?t=12" });
ok(ajout.statut === 200 && ajout.video?.id === "AbCdEfGh01x" && ajout.video.ajoutee === true, "ajouter une vidéo par son lien");
f2 = (await admin()).themes.find((t) => t.theme === "foot");
ok(f2.adultes.videos[0].id === "AbCdEfGh01x" && f2.jeunes.videos[0].id === "AbCdEfGh01x", "… en tête, pour les deux variantes");
ok((await admin({ action: "ajouter", theme: "foot", lien: "https://www.example.invalid/video" })).statut === 400, "un lien qui n’est pas YouTube : 400");
ok((await admin({ action: "ajouter", theme: "foot", lien: "https://youtu.be/AbCdEfGh04x" })).statut === 422, "une vidéo de 45 minutes : 422");
ok((await admin({ action: "ajouter", theme: "inconnu", lien: "https://youtu.be/AbCdEfGh01x" })).statut === 400, "un thème qui n’existe pas : 400");
const refait = await admin({ action: "refaire", theme: "foot" });
ok(refait.statut === 200 && refait.faites?.length === 2, "refaire le foot (ses deux variantes)");
f2 = (await admin()).themes.find((t) => t.theme === "foot");
ok(f2.adultes.videos[0].id === "AbCdEfGh01x" && !f2.adultes.videos.some((v) => v.id === premiere), "… l’ajoutée reste en tête, la retirée ne revient pas");
ok(f2.adultes.videos.length === 15, `… toujours quinze (${f2.adultes.videos.length})`);

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
