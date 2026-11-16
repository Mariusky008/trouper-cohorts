// 🚪 LE SALON DU DUO, LOT S0b, PAR LES ROUTES (`docs/univers/salon-du-duo.md`, sections 7.2 et 7.4) — contre le faux
// Supabase, jamais la vraie base (`lib/direct/salon-serveur.ts`, `salon-fichiers-serveur.ts`,
// `GET /api/direct/proches?ouvrir=`, `GET /api/direct/salon/fichier/<nom>`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : 403 ; Max : 403. Avant que la pièce soit
// faite : le fil et la vie, la scène `null`. Le salon fait (son décor, sa lumière du soir, son relevé) : la scène — la
// pièce, la lumière de l'heure, les places en points d'assise, les emplacements, et la plaque À ADRESSE STABLE : un nom
// d'empreinte, deux largeurs (720, 1080) en WebP, une vignette floue. Le fichier : servi en WebP, gardé un an
// (`immutable`), 304 quand le téléphone l'a déjà ; un nom mal formé : 404 ; sans session : 403. Rouvrir : la même
// adresse, rien de refait. Une nouvelle image de la pièce : une nouvelle adresse.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-route.mjs
import crypto from "node:crypto";
import sharp from "sharp";

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
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f20${String(n).padStart(2, "0")}`, jeton: `jeton-salon-s0b-route-000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const MAX = qui(3, "Max");
const GENS = [LEA, SAM, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${MAX.id}/proches.json`, { ids: [LEA.id] });

const get = async (chemin, q, entetes = {}) => {
  const r = await fetch(`${BASE}${chemin}`, { headers: { ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}), ...entetes } });
  const type = r.headers.get("content-type") ?? "";
  return { statut: r.status, entetes: r.headers, corps: type.includes("json") ? await r.json().catch(() => null) : Buffer.from(await r.arrayBuffer()) };
};
const ouvrir = (q, cle) => get(`/api/direct/proches?ouvrir=${cle}`, q);

// ═══ QUI PEUT OUVRIR ═══
ok((await ouvrir(null, SAM.cle)).statut === 403, "sans session : refusé");
ok((await ouvrir(MAX, LEA.cle)).statut === 403, "Max (Léa ne l'a pas ajouté) : refusé");

// ═══ AVANT QUE LA PIÈCE SOIT FAITE ═══
let r = await ouvrir(LEA, SAM.cle);
const o0 = r.corps?.ouverture;
ok(r.statut === 200 && o0?.cle === SAM.cle && Array.isArray(o0?.fil?.messages) && o0.fil.lui?.prenom === "Sam", `Léa ouvre sa conversation avec Sam : le fil en une requête (${r.statut})`);
ok(o0 && "vivant" in o0 && o0.scene === null, "… sa vie, et pas encore de scène (la pièce n'est pas faite)");
ok(o0?.fil?.ecrire === true, "… avec ce qu'on peut y envoyer (écrire)");

// ═══ LE SALON FAIT ═══
const piece = (r, g, b) =>
  sharp({ create: { width: 1536, height: 1024, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
await deposer("pieces-duo/salon/decor.png", await piece(120, 90, 140), "image/png");
for (const m of ["matin", "nuit"]) await deposer(`pieces-duo/salon/lumiere-${m}.png`, await piece(m === "nuit" ? 20 : 200, 60, 90), "image/png");
await json("pieces-duo/salon/releve.json", {
  le: maintenant,
  ajuste: true,
  emplacements: { tele: [0.06, 0.28, 0.3, 0.14], cadres: [], places: [{ x: 0.62, y: 0.6, hauteur: 0.3 }, { x: 0.38, y: 0.6, hauteur: 0.3 }] },
});
r = await ouvrir(LEA, SAM.cle);
const sc = r.corps?.ouverture?.scene;
const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date())) % 24;
const moment = heure >= 7 && heure < 17 ? "matin" : heure >= 17 && heure < 21 ? "soir" : "nuit";
ok(sc?.piece === "salon" && sc?.moment === moment, `la scène : le salon, dans la lumière de l'heure (${sc?.moment}, attendu ${moment})`);
// (une place tracée à la main va jusqu'aux pieds ; son point d'assise est aux deux tiers de sa hauteur : 0,6 − 0,3 × 0,34)
ok(sc?.places?.length === 2 && sc.places[0].x < sc.places[1].x && sc.places.every((p) => Math.abs(p.y - 0.498) < 0.002), `les places, de gauche à droite, en points d'assise (${JSON.stringify(sc?.places)})`);
ok(Array.isArray(sc?.emplacements?.tele), "les emplacements relevés");
const P = sc?.plaque;
const NOM = /^\/api\/direct\/salon\/fichier\/([0-9a-f]{32})-(\d+)\.webp$/;
ok(P && NOM.test(P.src) && P.largeur === 1536 && P.hauteur === 1024, `la plaque à adresse stable, à sa taille d'origine (${P?.src})`);
const largeurs = (P?.srcset ?? "").split(", ").map((x) => Number(/ (\d+)w$/.exec(x)?.[1]));
ok(largeurs.join(",") === "720,1080" && P.src.endsWith("-1080.webp"), `deux largeurs, 720 et 1080 (${P?.srcset})`);
ok(/^data:image\/webp;base64,/.test(P?.flou ?? "") && P.flou.length < 2000, `une vignette floue, petite (${P?.flou?.length} signes)`);

// ═══ LE FICHIER ═══
const f = await get(P.src, LEA);
ok(f.statut === 200 && f.entetes.get("content-type") === "image/webp", `le fichier : du WebP (${f.statut})`);
ok(/immutable/.test(f.entetes.get("cache-control") ?? "") && /max-age=31536000/.test(f.entetes.get("cache-control") ?? "") && /private/.test(f.entetes.get("cache-control") ?? ""), `gardé un an par le téléphone (${f.entetes.get("cache-control")})`);
const m = Buffer.isBuffer(f.corps) ? await sharp(f.corps).metadata() : {};
ok(m.format === "webp" && m.width === 1080 && m.height === 720, `à sa largeur (${m.width}×${m.height})`);
const petit = await get(P.srcset.split(", ")[0].split(" ")[0], SAM);
ok(petit.statut === 200 && Buffer.isBuffer(petit.corps) && (await sharp(petit.corps).metadata()).width === 720, "la petite largeur, pour Sam aussi");
const etag = f.entetes.get("etag");
ok(etag && (await get(P.src, LEA, { "if-none-match": etag })).statut === 304, "le téléphone l'a déjà : 304");
ok((await get(P.src, null)).statut === 403, "sans session : refusé");
ok((await get("/api/direct/salon/fichier/..%2F..%2Fsecret.webp", LEA)).statut === 404 && (await get("/api/direct/salon/fichier/abc-720.webp", LEA)).statut === 404, "un nom mal formé : 404");
ok((await get(`/api/direct/salon/fichier/${"0".repeat(32)}-720.webp`, LEA)).statut === 404, "un nom qui n'existe pas : 404");

// ═══ ROUVRIR ; UNE NOUVELLE IMAGE ═══
const avant = (await lister("salon/fichiers")).length;
r = await ouvrir(SAM, LEA.cle);
const P2 = r.corps?.ouverture?.scene?.plaque;
ok(P2?.src === P.src && P2?.flou === P.flou, "Sam ouvre la même conversation : la même adresse (le téléphone l'a en cache)");
ok((await lister("salon/fichiers")).length === avant, `rien n'est refait (${avant} fichiers)`);
const source = sc.moment === "soir" ? "pieces-duo/salon/decor.png" : `pieces-duo/salon/lumiere-${sc.moment}.png`;
await new Promise((ok) => setTimeout(ok, 1100));
await deposer(source, await piece(10, 200, 10), "image/png");
r = await ouvrir(LEA, SAM.cle);
const P3 = r.corps?.ouverture?.scene?.plaque;
ok(P3 && NOM.test(P3.src) && P3.src !== P.src, `la pièce refaite : une nouvelle adresse (${P3?.src})`);
ok((await get(P3.src, LEA)).statut === 200 && (await get(P.src, LEA)).statut === 200, "la nouvelle se lit ; l'ancienne aussi (un téléphone qui l'a encore)");

// ═══ ⚡ LA VITESSE : UNE OUVERTURE MESURÉE ═══
const poster = (q, corps, ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)") =>
  fetch(`${BASE}/api/direct/salon`, { method: "POST", headers: { "content-type": "application/json", "user-agent": ua, ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
ok((await poster(null, { action: "vitesse", pret: 300, deja: true })).status === 403, "la mesure, sans session : refusée");
ok((await poster(LEA, { action: "vitesse", pret: "vite", deja: true })).status === 400 && (await poster(LEA, { action: "autre" })).status === 400, "une mesure mal formée : refusée");
ok((await poster(LEA, { action: "vitesse", plaque: 210, pret: 260, deja: true, ecran: 390 })).status === 200, "Léa : une ouverture mesurée (iPhone, déjà vue)");
ok((await poster(SAM, { action: "vitesse", plaque: 900, pret: 1200, deja: false }, "Mozilla/5.0 (Linux; Android 14; SM-A146B)")).status === 200, "Sam : la première fois (Android)");
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const notees = await (await fetch(`${STOCK}/figurines-clients/salon/vitesse/${jour}.json`)).json().catch(() => null);
ok(Array.isArray(notees) && notees.length === 2 && notees[0].appareil === "iPhone" && notees[1].appareil === "Android" && notees[0].deja === true && notees[0].pret === 260, `les deux, notées du jour, l'appareil reconnu (${JSON.stringify(notees)})`);
ok((await get("/api/direct/salon?vitesse=1", LEA)).statut === 403, "les chiffres : pour l'administrateur seulement");

// ═══ ✋ LES EMPLACEMENTS DU SALON (lot S1) : les carreaux de la fenêtre et les fentes, seuls à changer dans le relevé ═══
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
const poserZones = (cookie, corps) => fetch(`${BASE}/api/direct/salon`, { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ action: "emplacements", ...corps }) });
const releve = async (piece) => (await fetch(`${STOCK}/figurines-clients/pieces-duo/${piece}/releve.json`)).json().catch(() => null);
const FENETRE = [[0.64, 0.08], [0.9, 0.06], [0.9, 0.36], [0.64, 0.37]];
ok((await poserZones(`clikme_habitant=${LEA.jeton}`, { piece: "salon", fenetreCoins: FENETRE })).status === 403, "les emplacements : pour l'administrateur seulement");
ok((await poserZones(COOKIE_ADMIN, { piece: "grenier", fenetreCoins: FENETRE })).status === 400, "une pièce inconnue : refusée");
// (la table basse et les lampes, des boîtes : tracées sur la page des pièces — le lot M0)
const r0 = await releve("salon");
await json("pieces-duo/salon/releve.json", { ...r0, emplacements: { ...r0.emplacements, table: [0.38, 0.72, 0.24, 0.08], lampes: [[0.08, 0.36, 0.08, 0.16]] } });
const avantZones = await releve("salon");
const z1 = await poserZones(COOKIE_ADMIN, {
  piece: "salon",
  fenetreCoins: FENETRE,
  fentes: [{ x: 0.66, y: 0.33 }, { x: 0.72, y: 0.33 }, { x: 0.78, y: 0.33 }, { x: 1.4, y: 0.2 }],
  table: [0.1, 0.1, 0.2, 0.2],
  lampes: [[0.5, 0.5, 0.1, 0.1]],
});
const em = (await z1.json().catch(() => ({}))).emplacements;
ok(z1.status === 200 && em?.fenetreCoins?.length === 4 && em.fentes?.length === 3, "les carreaux de la fenêtre et les fentes : posés (une fente hors de l'image laissée de côté)");
const apresZones = await releve("salon");
ok(
  apresZones?.ajuste === avantZones?.ajuste &&
    ["places", "tele", "table", "lampes"].every((k) => JSON.stringify(apresZones?.emplacements?.[k]) === JSON.stringify(avantZones?.emplacements?.[k])),
  "le reste du relevé ne bouge pas : la télé, les places et leur lecture, la table basse et les lampes de la page des pièces",
);
const sc2 = (await ouvrir(LEA, SAM.cle)).corps?.ouverture?.scene;
ok(sc2?.emplacements?.fenetreCoins?.length === 4 && sc2.emplacements.fentes?.length === 3 && sc2.emplacements.table?.length === 4 && sc2.places.every((p) => Math.abs(p.y - 0.498) < 0.002), "la scène les donne (`?ouvrir=`), avec la table basse ; ses places inchangées");
ok((await (await poserZones(COOKIE_ADMIN, { piece: "salon", fenetreCoins: [[0.1, 0.1], [0.2, 0.2]] })).json()).emplacements?.fenetreCoins === undefined, "une fenêtre de deux points ne tient pas : laissée de côté");
// (une pièce dont les places viennent du modèle qui voit, sans « à la main » : elle le reste)
await deposer("pieces-duo/cuisine/decor.png", await piece(220, 190, 90), "image/png");
await json("pieces-duo/cuisine/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.35, y: 0.7, hauteur: 0.3 }, { x: 0.65, y: 0.7, hauteur: 0.3 }] } });
ok((await poserZones(COOKIE_ADMIN, { piece: "cuisine", fentes: [{ x: 0.5, y: 0.3 }] })).status === 200, "la cuisine : une fente posée");
const cuisine = await releve("cuisine");
ok(cuisine?.ajuste === undefined && cuisine.emplacements.places[0].y === 0.7 && cuisine.emplacements.fentes?.length === 1, "… ses places relevées restent des points d'assise (le relevé n'est pas marqué « à la main »)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle salon (lots S0b et S1) : tout est bon");
process.exit(echecs ? 1 : 0);
