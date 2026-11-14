// 📷 LES PHOTOS (lot M2), PAR LES ROUTES — contre le faux Supabase et sa fausse modération, jamais la vraie base
// (`lib/direct/photo.ts`, `photo-serveur.ts`, `POST /api/direct/proches`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : refusé ; Max : 403. Léa demande où déposer sa
// photo (une adresse signée, pour elle seule), l'y dépose (un JPEG de 2 400 × 1 800, tourné, avec des métadonnées :
// l'auteur, la position GPS), puis l'envoie avec une légende : la photo rangée est réencodée (WebP, 1 600 pixels au
// plus, remise droite, AUCUNE métadonnée), contrôlée par la modération (la légende aussi), le dépôt d'origine effacé.
// Chez Sam : la photo dans le fil (« nouveau », son adresse signée), sa ligne de « Chez moi » (« 📷 La légende »), un
// non-lu, la notification « 📷 Léa t'a envoyé une photo ». CE QUI EST REFUSÉ : une photo que la modération refuse
// (« Cette photo ne peut pas partir. », effacée) ; la modération en panne (elle ne part pas, gardée : il peut
// réessayer) ; un fichier qui n'est pas une photo ; plus de 5 Mo ; une photo jamais déposée ; la photo déposée par
// Léa, envoyée par Sam ; une légende trop longue, ou avec un mot interdit ; au-delà de trente par jour. EFFACER : la
// sienne, avec sa photo (pas celle de l'autre). SIGNALER : elle disparaît chez celui qui signale ; l'équipe la voit dans
// « Messages signalés », la remet (elle revient), ou l'efface pour les deux (avec sa photo) ; réservé à l'équipe.
// LA MESURE. LE FREIN (`CLIKME_PHOTOS=0`, une seconde app) : plus de photo (404), celles qui sont parties restent.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI, dont OPENAI_TALKIE_BASE_URL : la fausse modération)
//   node scripts/essai-photos-route.mjs
import crypto from "node:crypto";
import sharp from "sharp";
import { lancerSecondeApp } from "./seconde-app.mjs";
import { recus, telephone } from "./navigateur/commun.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const lireOctets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const jourParis = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `e8a8e8a8-0000-4000-8000-0000000f20${String(n).padStart(2, "0")}`, jeton: `jeton-photos-m2-route-00${String(n).padStart(2, "0")}`, prenom });
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
// (l'équipe : une fausse session d'admin, comme `essai-remise-a-zero-route.mjs`)
const ADMIN = "00000000-0000-4000-8000-0000000ad001"; // (le seul admin que le faux Supabase connaît)
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const sessionAdmin = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(sessionAdmin)}`;
await semer("admins", [{ user_id: ADMIN }]);
const moderer = async (corps, cookie = COOKIE_ADMIN) => {
  const r = await fetch(`${BASE}/api/admin/direct/figurines-clients`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const telSam = telephone("sam-photos");
await json(`notif/abonnes/${SAM.id}.json`, { h: SAM.id, ville: "dax", abonnements: [telSam.abonnement], le: new Date().toISOString() });

const voir = async (q, chemin, base = BASE) => {
  const r = await fetch(`${base}/api/direct/${chemin}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const poster = async (q, corps, base = BASE) => {
  const r = await fetch(`${base}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const fil = async (q, avec, base = BASE) => (await voir(q, `proches?fil=${avec.cle}`, base)).fil;
/** Comme le téléphone : l'adresse signée, puis le dépôt (un seul). */
async function deposerPhoto(q, avec, octets, type = "image/webp", base = BASE) {
  const d = await poster(q, { action: "photo-depot", cle: avec.cle }, base);
  if (!d.jeton) return { d };
  const r = await fetch(`${STOCK}/upload/sign/${d.seau}/${d.chemin}?token=${d.jeton}`, { method: "PUT", headers: { "content-type": type }, body: octets });
  return { d, statut: r.status };
}
const envoyer = (q, avec, id, x = {}, base = BASE) => poster(q, { action: "photo", cle: avec.cle, id, ...x }, base);
const image = (l, h, couleur = { r: 240, g: 140, b: 60 }) => sharp({ create: { width: l, height: h, channels: 3, background: couleur } });
const WEBP = await image(640, 480).webp().toBuffer();

// ═══ LES PORTES ═══
const sans = await poster(null, { action: "photo-depot", cle: SAM.cle });
ok([401, 403].includes(sans.statut) && !sans.jeton, `sans session : refusé (${sans.statut})`);
ok((await poster(MAX, { action: "photo-depot", cle: LEA.cle })).statut === 403, "Max (pas proches tous les deux) : 403");

// ═══ 📷 LÉA ENVOIE UNE PHOTO À SAM ═══
// (un JPEG de 2 400 × 1 800, pris de côté — orientation 6 —, avec l'auteur et la position GPS dans ses métadonnées)
const JPEG = await image(2400, 1800)
  .jpeg()
  .withMetadata({ orientation: 6, exif: { IFD0: { Artist: "Lea Essai", ImageDescription: "chez moi" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "43/1 42/1 0/1", GPSLongitudeRef: "W", GPSLongitude: "1/1 3/1 0/1" } } })
  .toBuffer();
const avantMeta = await sharp(JPEG).metadata();
ok(Boolean(avantMeta.exif) && avantMeta.orientation === 6, "la photo d'essai a bien des métadonnées (l'auteur, la position GPS) et une orientation");
const p1 = await deposerPhoto(LEA, SAM, JPEG, "image/jpeg");
ok(p1.d.statut === 200 && /^[a-z0-9]{12}$/.test(p1.d.id) && p1.d.chemin === `fils/${paire(LEA, SAM)}/p/${qui8(LEA.id)}-${p1.d.id}-brut` && p1.statut === 200, `une adresse signée pour sa photo seule, et le dépôt (${p1.d.chemin})`);
const LEGENDE = "Le coucher de soleil à la plage 🌅";
const e1 = await envoyer(LEA, SAM, p1.d.id, { legende: LEGENDE });
const m1 = e1.message;
ok(e1.statut === 200 && m1?.genre === "photo" && m1.son === "" && m1.texte === LEGENDE && m1.photo?.url && m1.photo.l === 1200 && m1.photo.h === 1600, `envoyée : une photo, sans voix, sa légende, remise droite et réduite (${m1?.photo?.l} × ${m1?.photo?.h})`);
ok(m1?.repliques?.length === 1 && m1.repliques[0].texte === LEGENDE && m1.duree === 4, "une seule réplique : la légende, le temps que la figurine la montre");
const rangee = await lireOctets(`fils/${paire(LEA, SAM)}/p/${p1.d.id}.webp`);
const meta = rangee ? await sharp(rangee).metadata() : {};
ok(meta.format === "webp" && meta.width === 1200 && meta.height === 1600 && !meta.exif && !meta.xmp && !meta.iptc && !meta.orientation, "rangée en WebP, 1 600 pixels au plus, sans AUCUNE métadonnée (ni l'auteur, ni la position GPS)");
ok(!(await lireOctets(p1.d.chemin)), "le dépôt d'origine est effacé");
const fiche1 = await lire(`fils/${paire(LEA, SAM)}/m/${(await lister(`fils/${paire(LEA, SAM)}/m`)).find((n) => n.endsWith(`-${p1.d.id}.json`))}`);
ok(fiche1?.genre === "photo" && fiche1.media?.chemin === `fils/${paire(LEA, SAM)}/p/${p1.d.id}.webp` && fiche1.media.l === 1200 && fiche1.legende === LEGENDE && fiche1.de === LEA.id, "le message, dans le même dossier que les vocaux : { genre: photo, media, legende }");
const ia = (await (await fetch(`${FAUX}/__ia`)).json().catch(() => [])) ?? [];
ok(ia.some((x) => /^MODERATION omni-moderation-latest 576 Le coucher de soleil/.test(x)), `contrôlée par la modération, la légende aussi (${ia.filter((x) => x.startsWith("MODERATION")).slice(-1)[0] ?? "rien"})`);

const pLea = ((await voir(SAM, "proches")).proches ?? []).find((p) => p.cle === LEA.cle);
ok(pLea?.dernier?.photo === true && pLea.dernier.texte === `📷 ${LEGENDE}` && pLea.nonLus >= 1, `« Chez moi », chez Sam : « ${pLea?.dernier?.texte} », ${pLea?.nonLus} non-lu(s)`);
const fs1 = await fil(SAM, LEA);
const vu = fs1?.messages?.find((x) => x.id === p1.d.id);
ok(vu?.genre === "photo" && vu.nouveau === true && !vu.moi && vu.texte === LEGENDE && fs1.photos === true, "chez Sam : la photo dans le fil, « nouveau », sa légende ; on peut lui en envoyer");
const signee = vu?.photo?.url ? await fetch(new URL(vu.photo.url, FAUX)) : null;
ok(signee?.status === 200 && (await sharp(Buffer.from(await signee.arrayBuffer())).metadata()).format === "webp", "son adresse signée la montre");
let notifs = [];
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "📷 Léa t’a envoyé une photo"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
const n1 = notifs.find((n) => n.title === "📷 Léa t’a envoyé une photo");
ok(n1?.body === LEGENDE && n1.url === `/collection?parler=${LEA.cle}#proches`, `la notification : « ${n1?.title} » — « ${n1?.body} »`);
const p2 = await deposerPhoto(LEA, SAM, WEBP);
const e2 = await envoyer(LEA, SAM, p2.d.id, { tete: "rire" });
ok(e2.statut === 200 && !e2.message?.texte && e2.message?.repliques?.[0]?.texte === "" && e2.message.repliques[0].tete === "rire" && e2.message.photo.l === 640, "sans légende : la tête choisie, rien dans la bulle (640 pixels : pas agrandie)");
const pLea2 = ((await voir(SAM, "proches")).proches ?? []).find((p) => p.cle === LEA.cle);
ok(pLea2?.dernier?.texte === "📷 Une photo", "sans légende, la ligne : « 📷 Une photo »");

// ═══ CE QUI EST REFUSÉ ═══
const refusable = await deposerPhoto(LEA, SAM, await image(321, 200).webp().toBuffer());
const r1 = await envoyer(LEA, SAM, refusable.d.id);
ok(r1.statut === 422 && r1.error === "Cette photo ne peut pas partir." && !(await lireOctets(refusable.d.chemin)) && !(await lireOctets(`fils/${paire(LEA, SAM)}/p/${refusable.d.id}.webp`)), "la modération la refuse : « Cette photo ne peut pas partir. », effacée, pas envoyée");
const panne = await deposerPhoto(LEA, SAM, await image(322, 200).webp().toBuffer());
const r2 = await envoyer(LEA, SAM, panne.d.id);
ok(r2.statut === 503 && r2.error === "La photo n’a pas pu être vérifiée. Réessaie dans un instant." && Boolean(await lireOctets(panne.d.chemin)) && !(await lireOctets(`fils/${paire(LEA, SAM)}/p/${panne.d.id}.webp`)), "la modération ne répond pas : la photo ne part pas, gardée pour réessayer");
ok((await envoyer(LEA, SAM, panne.d.id)).statut === 503, "réessayer, la modération toujours en panne : toujours pas");
const pasPhoto = await deposerPhoto(LEA, SAM, Buffer.from("ceci n'est pas une photo"), "image/webp");
const r3 = await envoyer(LEA, SAM, pasPhoto.d.id);
ok(r3.statut === 400 && r3.error === "Ce fichier n’est pas une photo." && !(await lireOctets(pasPhoto.d.chemin)), "un fichier qui n'est pas une photo : refusé, effacé");
const lourde = await deposerPhoto(LEA, SAM, crypto.randomBytes(5 * 1024 * 1024 + 10), "image/jpeg");
const r4 = await envoyer(LEA, SAM, lourde.d.id);
ok(r4.statut === 413 && r4.error === "Cette photo est trop lourde : 5 Mo au plus." && !(await lireOctets(lourde.d.chemin)), "plus de 5 Mo : refusée, effacée");
const r5 = await envoyer(LEA, SAM, "abcdef123456");
ok(r5.statut === 400 && r5.error === "Ta photo n’est pas arrivée. Réessaie.", "une photo jamais déposée : « Ta photo n'est pas arrivée »");
const deLea = await deposerPhoto(LEA, SAM, WEBP);
ok((await envoyer(SAM, LEA, deLea.d.id)).statut === 400 && Boolean(await lireOctets(deLea.d.chemin)), "la photo déposée par Léa, Sam ne peut pas l'envoyer");
const r6 = await envoyer(LEA, SAM, deLea.d.id, { legende: "a".repeat(201) });
ok(r6.statut === 400 && r6.error === "Une légende de 200 signes au plus.", "une légende de 201 signes : refusée");
const r7 = await envoyer(LEA, SAM, deLea.d.id, { legende: "T'es vraiment un connard" });
ok(r7.statut === 422 && r7.error === "Ça, ta figurine ne le dit pas. Réessaie autrement 🙂", "un mot interdit dans la légende : la phrase des vocaux");
await json(`${LEA.id}/photos-jour.json`, { jour: jourParis, n: 30 });
const assez = await poster(LEA, { action: "photo-depot", cle: SAM.cle });
ok(assez.statut === 429 && assez.error === "Assez de photos pour aujourd’hui : reviens demain.", "trente photos aujourd'hui : « reviens demain »");
ok((await envoyer(LEA, SAM, deLea.d.id)).statut === 429, "et une photo déjà déposée ne part pas non plus");
await json(`${LEA.id}/photos-jour.json`, { jour: jourParis, n: 2 });

// ═══ 🗑️ EFFACER ═══
ok((await poster(SAM, { action: "effacer", cle: LEA.cle, id: e2.message.id })).statut === 403, "Sam ne peut pas effacer la photo de Léa (403)");
ok((await poster(LEA, { action: "effacer", cle: SAM.cle, id: e2.message.id })).statut === 200 && !(await lireOctets(`fils/${paire(LEA, SAM)}/p/${e2.message.id}.webp`)) && !(await fil(SAM, LEA))?.messages?.some((x) => x.id === e2.message.id), "Léa efface la sienne : partie pour les deux, avec sa photo");

// ═══ 🚩 SIGNALER UNE PHOTO ═══
ok((await poster(SAM, { action: "signaler", cle: LEA.cle, id: m1.id })).statut === 200 && !(await fil(SAM, LEA))?.messages?.some((x) => x.id === m1.id) && (await fil(LEA, SAM))?.messages?.some((x) => x.id === m1.id), "Sam la signale : elle disparaît chez lui");
const sig = await lire(`moderation/paroles/${m1.id}.json`);
ok(sig?.par === SAM.id && String(sig.message ?? "").endsWith(`-${m1.id}.json`), "l'équipe la regarde (le signalement est gardé)");

// ═══ 🛡️ L'ÉQUIPE MODÈRE (`/admin/humain/figurines-clients`, « Messages signalés ») ═══
// (React sépare les morceaux de texte par « <!-- --> » : retirés pour lire la page comme on la voit)
const page = (await (await fetch(`${BASE}/admin/humain/figurines-clients`, { headers: { cookie: COOKIE_ADMIN } })).text()).replace(/<!-- -->/g, "");
const vuPage = { titre: page.includes("Messages signalés"), carte: page.includes(`data-message="${m1.id}"`), qui: page.includes("de Léa") && page.includes("signalé par Sam"), legende: page.includes("Le coucher de soleil") };
ok(Object.values(vuPage).every(Boolean), `la page de l'équipe : la photo signalée, de Léa, signalée par Sam, sa légende (${JSON.stringify(vuPage)})`);
ok((await moderer({ action: "moderer-message", id: m1.id, geste: "remettre" }, `clikme_habitant=${LEA.jeton}`)).statut === 403, "réservé à l'équipe (403)");
const remise = await moderer({ action: "moderer-message", id: m1.id, geste: "remettre" });
ok(remise.statut === 200 && (await fil(SAM, LEA))?.messages?.some((x) => x.id === m1.id) && !(await lire(`moderation/paroles/${m1.id}.json`)), "« Remettre » : elle revient chez Sam, le signalement s'en va");
await poster(SAM, { action: "signaler", cle: LEA.cle, id: m1.id });
const retrait = await moderer({ action: "moderer-message", id: m1.id, geste: "retirer" });
ok(
  retrait.statut === 200 && !(await fil(LEA, SAM))?.messages?.some((x) => x.id === m1.id) && !(await lireOctets(`fils/${paire(LEA, SAM)}/p/${m1.id}.webp`)) && !(await lire(`moderation/paroles/${m1.id}.json`)),
  "signalée de nouveau, « Effacer pour les deux » : partie de la conversation, avec sa photo",
);
ok((await moderer({ action: "moderer-message", id: m1.id, geste: "retirer" })).statut === 400, "une deuxième fois : le signalement n'existe plus");

// ═══ 📊 LA MESURE ═══
const st = await lire(`stats/messages/${jourParis}.json`);
ok(st?.photos >= 2 && st.photosRefusees >= 1 && st.photosNonVerifiees >= 2 && st.photosKo > 0 && st.effaces >= 1, `les compteurs du jour : ${st?.photos} photos, ${st?.photosRefusees} refusée(s), ${st?.photosNonVerifiees} non vérifiée(s), ${st?.photosKo} Ko`);

// ═══ LE FREIN ═══
const p3 = await deposerPhoto(LEA, SAM, WEBP);
const e3 = await envoyer(LEA, SAM, p3.d.id, { legende: "Avant le frein" });
const seconde = await lancerSecondeApp({ port: 3826, env: { CLIKME_PHOTOS: "0" } });
try {
  const ferme = await poster(LEA, { action: "photo-depot", cle: SAM.cle }, seconde.base);
  ok(ferme.statut === 404 && ferme.error === "Les photos ne sont pas encore ouvertes.", "le frein serré : plus de photo (404)");
  const fl = await fil(LEA, SAM, seconde.base);
  ok(e3.statut === 200 && fl?.photos === false && fl.messages?.some((x) => x.id === e3.message.id && x.genre === "photo" && x.photo?.url), "le frein serré : les photos parties restent visibles ; plus d'envoi");
} finally {
  seconde.arreter();
}

console.log(echecs ? `\n${echecs} échec(s)` : "\nles photos tiennent, par les routes ✓");
process.exit(echecs ? 1 : 0);
