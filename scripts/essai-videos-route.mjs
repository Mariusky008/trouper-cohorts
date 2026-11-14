// 🎬 LES VIDÉOS (lot M3), PAR LES ROUTES — contre le faux Supabase et sa fausse modération, jamais la vraie base
// (`lib/direct/video.ts`, `video-serveur.ts`, `POST /api/direct/proches`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : refusé ; Max : 403 ; un format qu'on ne
// prend pas : refusé. Léa dépose une vidéo de 12,3 s (une adresse signée, pour elle seule), puis l'envoie avec les trois
// images que son téléphone en a tirées et une légende : sa durée est lue dans le fichier, ses trois images contrôlées
// (la légende aussi), la vidéo rangée sous son nom (le dépôt d'origine quitte son nom), sa vignette (l'image du milieu,
// 480 pixels au plus). Chez Sam : la vidéo dans le fil (« nouveau », ses adresses signées, sa durée), sa ligne de « Chez
// moi » (« 🎬 La légende »), la notification « 🎬 Léa t'a envoyé une vidéo ». UN MOV de 20 s (en-tête en version 1) ;
// un WebM qui dit sa durée ; un WebM du navigateur, qui ne la dit pas (la durée lue par le téléphone). CE QUI EST REFUSÉ :
// 45 s (« 45 s : 30 secondes au plus », l'en-tête après les données) ; plus de 25 Mo ; un fichier qui n'est pas une
// vidéo ; deux images au lieu de trois, ou une qui n'en est pas une ; une image que la modération refuse (la vidéo est
// effacée) ; la modération en panne (gardée, pour réessayer) ; la vidéo de Léa envoyée par Sam ; une légende trop longue
// ou avec un mot interdit ; au-delà de dix par jour. EFFACER : la sienne, avec sa vignette. SIGNALER, et l'équipe la voit
// (« 🎬 Une vidéo »), la remet, l'efface pour les deux. LA MESURE. LE FREIN (`CLIKME_VIDEOS=0`, une seconde app).
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI, dont OPENAI_TALKIE_BASE_URL : la fausse modération)
//   node scripts/essai-videos-route.mjs
import crypto from "node:crypto";
import sharp from "sharp";
import { lancerSecondeApp } from "./seconde-app.mjs";
import { recus, telephone } from "./navigateur/commun.mjs";
import { mp4Essai, webmEssai } from "./fixtures/videos-essai.mjs";

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

const qui = (n, prenom) => ({ id: `eaeaeaea-0000-4000-8000-0000000f30${String(n).padStart(2, "0")}`, jeton: `jeton-videos-m3-route-00${String(n).padStart(2, "0")}`, prenom });
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
const telSam = telephone("sam-videos");
await json(`notif/abonnes/${SAM.id}.json`, { h: SAM.id, ville: "dax", abonnements: [telSam.abonnement], le: new Date().toISOString() });
// (l'équipe : la fausse session d'admin que le faux Supabase connaît)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const sessionAdmin = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(sessionAdmin)}`;
await semer("admins", [{ user_id: ADMIN }]);
const moderer = async (corps, cookie = COOKIE_ADMIN) => {
  const r = await fetch(`${BASE}/api/admin/direct/figurines-clients`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

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
async function deposerVideo(q, avec, octets, type = "video/mp4", base = BASE) {
  const d = await poster(q, { action: "video-depot", cle: avec.cle, type }, base);
  if (!d.jeton) return { d };
  const r = await fetch(`${STOCK}/upload/sign/${d.seau}/${d.chemin}?token=${d.jeton}`, { method: "PUT", headers: { "content-type": type }, body: octets });
  return { d, statut: r.status };
}
// les trois images que le téléphone tire de la vidéo (au début, au milieu, à la fin) ; 321 pixels de large : la fausse
// modération la refuse ; 322 : elle ne répond pas
const image = async (l, h, couleur) => `data:image/jpeg;base64,${(await sharp({ create: { width: l, height: h, channels: 3, background: couleur } }).jpeg().toBuffer()).toString("base64")}`;
const IMAGES = [await image(640, 360, { r: 20, g: 20, b: 60 }), await image(640, 360, { r: 220, g: 120, b: 40 }), await image(640, 360, { r: 40, g: 140, b: 90 })];
const envoyer = (q, avec, id, x = {}, base = BASE) => poster(q, { action: "video", cle: avec.cle, id, type: "video/mp4", duree: 0, images: IMAGES, ...x }, base);

// ═══ LES PORTES ═══
const sans = await poster(null, { action: "video-depot", cle: SAM.cle, type: "video/mp4" });
ok([401, 403].includes(sans.statut) && !sans.jeton, `sans session : refusé (${sans.statut})`);
ok((await poster(MAX, { action: "video-depot", cle: LEA.cle, type: "video/mp4" })).statut === 403, "Max (pas proches tous les deux) : 403");
const avi = await poster(LEA, { action: "video-depot", cle: SAM.cle, type: "video/x-msvideo" });
ok(avi.statut === 400 && avi.error === "Ce format de vidéo n’est pas pris.", "un format qu'on ne prend pas : « Ce format de vidéo n'est pas pris. »");

// ═══ 🎬 LÉA ENVOIE UNE VIDÉO À SAM ═══
const v1 = await deposerVideo(LEA, SAM, mp4Essai(12.3, { poids: 300_000 }));
ok(v1.d.statut === 200 && v1.d.chemin === `fils/${paire(LEA, SAM)}/v/${qui8(LEA.id)}-${v1.d.id}-brut.mp4` && v1.statut === 200, `une adresse signée pour sa vidéo seule, et le dépôt (${v1.d.chemin})`);
const LEGENDE = "Le concert hier soir 🎸";
const e1 = await envoyer(LEA, SAM, v1.d.id, { legende: LEGENDE });
const m1 = e1.message;
ok(e1.statut === 200 && m1?.genre === "video" && m1.son === "" && m1.texte === LEGENDE && m1.video?.url && m1.video.vignette && m1.video.duree === 12.3 && m1.video.l === 640 && m1.video.h === 360, `envoyée : une vidéo, sans voix, sa légende, sa durée lue dans le fichier (${m1?.video?.duree} s), ses dimensions`);
ok(m1?.repliques?.length === 1 && m1.repliques[0].texte === LEGENDE && m1.duree === 4, "une seule réplique : la légende, le temps que la figurine montre sa vignette");
const dossierV = `fils/${paire(LEA, SAM)}/v`;
const rangee = await lireOctets(`${dossierV}/${v1.d.id}.mp4`);
const vignette = await lireOctets(`${dossierV}/${v1.d.id}.webp`);
const metaV = vignette ? await sharp(vignette).metadata() : {};
ok(rangee?.length === 300_000 && !(await lireOctets(v1.d.chemin)) && metaV.format === "webp" && metaV.width === 480 && metaV.height === 270, "rangée sous son nom (le dépôt d'origine l'a quitté), sa vignette : l'image du milieu, en WebP de 480 pixels");
const fiche1 = await lire(`fils/${paire(LEA, SAM)}/m/${(await lister(`fils/${paire(LEA, SAM)}/m`)).find((n) => n.endsWith(`-${v1.d.id}.json`))}`);
ok(fiche1?.genre === "video" && fiche1.media?.chemin === `${dossierV}/${v1.d.id}.mp4` && fiche1.media.vignette === `${dossierV}/${v1.d.id}.webp` && fiche1.media.duree === 12.3 && fiche1.media.type === "video/mp4" && fiche1.legende === LEGENDE, "le message, dans le même dossier que les vocaux : { genre: video, media { chemin, vignette, duree, type }, legende }");
const ia = ((await (await fetch(`${FAUX}/__ia`)).json().catch(() => [])) ?? []).filter((x) => x.startsWith("MODERATION"));
ok(ia.length >= 3 && ia.some((x) => x.includes("Le concert hier soir")), `ses trois images contrôlées, la légende aussi (${ia.length} contrôles)`);
const pLea = ((await voir(SAM, "proches")).proches ?? []).find((p) => p.cle === LEA.cle);
ok(pLea?.dernier?.video === true && pLea.dernier.texte === `🎬 ${LEGENDE}` && pLea.nonLus >= 1, `« Chez moi », chez Sam : « ${pLea?.dernier?.texte} », ${pLea?.nonLus} non-lu(s)`);
const fs1 = await fil(SAM, LEA);
const vu = fs1?.messages?.find((x) => x.id === v1.d.id);
ok(vu?.genre === "video" && vu.nouveau === true && vu.texte === LEGENDE && fs1.videos === true, "chez Sam : la vidéo dans le fil, « nouveau », sa légende ; on peut lui en envoyer");
const signee = vu?.video?.url ? await fetch(new URL(vu.video.url, FAUX)) : null;
const signeeV = vu?.video?.vignette ? await fetch(new URL(vu.video.vignette, FAUX)) : null;
ok(signee?.status === 200 && signeeV?.status === 200, "ses adresses signées (la vidéo, la vignette) répondent");
let notifs = [];
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "🎬 Léa t’a envoyé une vidéo"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
const n1 = notifs.find((n) => n.title === "🎬 Léa t’a envoyé une vidéo");
ok(n1?.body === LEGENDE && n1.url === `/collection?parler=${LEA.cle}#proches`, `la notification : « ${n1?.title} » — « ${n1?.body} »`);

// ═══ UN MOV, UN WEBM ═══
const mov = await deposerVideo(LEA, SAM, mp4Essai(20, { version: 1 }), "video/quicktime");
const eMov = await envoyer(LEA, SAM, mov.d.id, { type: "video/quicktime" });
ok(eMov.statut === 200 && eMov.message?.video?.duree === 20 && Boolean(await lireOctets(`${dossierV}/${mov.d.id}.mov`)), "un MOV de 20 s (l'en-tête en version 1) : parti");
const webm = await deposerVideo(LEA, SAM, webmEssai(18), "video/webm");
const eWebm = await envoyer(LEA, SAM, webm.d.id, { type: "video/webm" });
ok(eWebm.statut === 200 && eWebm.message?.video?.duree === 18, "un WebM qui dit sa durée (18 s) : parti");
const webmNav = await deposerVideo(LEA, SAM, webmEssai(null), "video/webm");
const eWebmNav = await envoyer(LEA, SAM, webmNav.d.id, { type: "video/webm", duree: 9.4 });
ok(eWebmNav.statut === 200 && eWebmNav.message?.video?.duree === 9.4, "un WebM du navigateur, qui ne dit pas sa durée : celle que le téléphone a lue (9,4 s)");
const webmMuet = await deposerVideo(LEA, SAM, webmEssai(null), "video/webm");
ok((await envoyer(LEA, SAM, webmMuet.d.id, { type: "video/webm" })).statut === 400, "… mais sans aucune durée : refusé");

// ═══ CE QUI EST REFUSÉ ═══
const longue = await deposerVideo(LEA, SAM, mp4Essai(45, { aLaFin: true }));
const r1 = await envoyer(LEA, SAM, longue.d.id);
ok(r1.statut === 413 && r1.error === "45 s : 30 secondes au plus" && !(await lireOctets(longue.d.chemin)), "45 s (l'en-tête après les données) : « 45 s : 30 secondes au plus », effacée");
const lourde = await deposerVideo(LEA, SAM, mp4Essai(10, { poids: 25 * 1024 * 1024 + 100 }));
const r2 = await envoyer(LEA, SAM, lourde.d.id);
ok(r2.statut === 413 && r2.error === "Cette vidéo est trop lourde : 25 Mo au plus." && !(await lireOctets(lourde.d.chemin)), "plus de 25 Mo : refusée, effacée");
const texteSeul = await deposerVideo(LEA, SAM, Buffer.from("ceci n'est pas une vidéo, seulement des mots"));
const r3 = await envoyer(LEA, SAM, texteSeul.d.id);
ok(r3.statut === 400 && r3.error === "Ce fichier n’est pas une vidéo." && !(await lireOctets(texteSeul.d.chemin)), "un fichier qui n'est pas une vidéo : refusé, effacé");
const v2 = await deposerVideo(LEA, SAM, mp4Essai(8));
ok((await envoyer(LEA, SAM, v2.d.id, { images: IMAGES.slice(0, 2) })).error === "Les images de ta vidéo ne sont pas arrivées. Réessaie.", "deux images au lieu de trois : refusé");
ok((await envoyer(LEA, SAM, v2.d.id, { images: [IMAGES[0], "data:image/jpeg;base64,cGFzIHVuZSBpbWFnZQ==", IMAGES[2]] })).statut === 400 && Boolean(await lireOctets(v2.d.chemin)), "une image qui n'en est pas une : refusé (la vidéo attend)");
const r4 = await envoyer(LEA, SAM, v2.d.id, { images: [IMAGES[0], IMAGES[1], await image(321, 180, { r: 200, g: 0, b: 0 })] });
ok(r4.statut === 422 && r4.error === "Cette vidéo ne peut pas partir." && !(await lireOctets(v2.d.chemin)) && !(await lireOctets(`${dossierV}/${v2.d.id}.mp4`)), "une image que la modération refuse (celle de la fin) : « Cette vidéo ne peut pas partir. », effacée");
const v3 = await deposerVideo(LEA, SAM, mp4Essai(8));
const r5 = await envoyer(LEA, SAM, v3.d.id, { images: [await image(322, 180, { r: 0, g: 200, b: 0 }), IMAGES[1], IMAGES[2]] });
ok(r5.statut === 503 && r5.error === "La vidéo n’a pas pu être vérifiée. Réessaie dans un instant." && Boolean(await lireOctets(v3.d.chemin)), "la modération ne répond pas : elle ne part pas, gardée pour réessayer");
ok((await envoyer(SAM, LEA, v3.d.id)).statut === 400, "la vidéo déposée par Léa, Sam ne peut pas l'envoyer");
ok((await envoyer(LEA, SAM, v3.d.id, { legende: "a".repeat(201) })).statut === 400, "une légende de 201 signes : refusée");
ok((await envoyer(LEA, SAM, v3.d.id, { legende: "T'es vraiment un connard" })).statut === 422, "un mot interdit dans la légende : refusé");
await json(`${LEA.id}/videos-jour.json`, { jour: jourParis, n: 10 });
const assez = await poster(LEA, { action: "video-depot", cle: SAM.cle, type: "video/mp4" });
ok(assez.statut === 429 && assez.error === "Assez de vidéos pour aujourd’hui : reviens demain.", "dix vidéos aujourd'hui : « reviens demain »");
await json(`${LEA.id}/videos-jour.json`, { jour: jourParis, n: 4 });

// ═══ 🗑️ EFFACER ═══
ok((await poster(SAM, { action: "effacer", cle: LEA.cle, id: eMov.message.id })).statut === 403, "Sam ne peut pas effacer la vidéo de Léa (403)");
ok(
  (await poster(LEA, { action: "effacer", cle: SAM.cle, id: eMov.message.id })).statut === 200 && !(await lireOctets(`${dossierV}/${mov.d.id}.mov`)) && !(await lireOctets(`${dossierV}/${mov.d.id}.webp`)),
  "Léa efface la sienne : partie pour les deux, avec sa vidéo et sa vignette",
);

// ═══ 🚩 SIGNALER, ET L'ÉQUIPE ═══
ok((await poster(SAM, { action: "signaler", cle: LEA.cle, id: m1.id })).statut === 200 && !(await fil(SAM, LEA))?.messages?.some((x) => x.id === m1.id), "Sam la signale : elle disparaît chez lui");
const page = (await (await fetch(`${BASE}/admin/humain/figurines-clients`, { headers: { cookie: COOKIE_ADMIN } })).text()).replace(/<!-- -->/g, "");
ok(page.includes(`data-message="${m1.id}"`) && page.includes("🎬 Une vidéo") && page.includes("<video") && page.includes("signalé par Sam"), "l'équipe la voit : « 🎬 Une vidéo », de Léa, signalée par Sam, la vidéo à regarder");
ok((await moderer({ action: "moderer-message", id: m1.id, geste: "remettre" })).statut === 200 && (await fil(SAM, LEA))?.messages?.some((x) => x.id === m1.id), "« Remettre » : elle revient chez Sam");
await poster(SAM, { action: "signaler", cle: LEA.cle, id: m1.id });
ok(
  (await moderer({ action: "moderer-message", id: m1.id, geste: "retirer" })).statut === 200 && !(await lireOctets(`${dossierV}/${v1.d.id}.mp4`)) && !(await lireOctets(`${dossierV}/${v1.d.id}.webp`)),
  "« Effacer pour les deux » : partie, avec sa vidéo et sa vignette",
);

// ═══ 📊 LA MESURE ═══
const st = await lire(`stats/messages/${jourParis}.json`);
ok(st?.videos >= 4 && st.videosRefusees >= 1 && st.videosNonVerifiees >= 1 && st.videosKo > 200, `les compteurs du jour : ${st?.videos} vidéos, ${st?.videosRefusees} refusée(s), ${st?.videosNonVerifiees} non vérifiée(s), ${st?.videosKo} Ko`);

// ═══ LE FREIN ═══
const seconde = await lancerSecondeApp({ port: 3827, env: { CLIKME_VIDEOS: "0" } });
try {
  const ferme = await poster(LEA, { action: "video-depot", cle: SAM.cle, type: "video/mp4" }, seconde.base);
  ok(ferme.statut === 404 && ferme.error === "Les vidéos ne sont pas encore ouvertes.", "le frein serré : plus de vidéo (404)");
  const fl = await fil(LEA, SAM, seconde.base);
  ok(fl?.videos === false && fl.messages?.some((x) => x.id === eWebm.message.id && x.genre === "video" && x.video?.url), "le frein serré : les vidéos parties restent visibles ; plus d'envoi");
} finally {
  seconde.arreter();
}

console.log(echecs ? `\n${echecs} échec(s)` : "\nles vidéos tiennent, par les routes ✓");
process.exit(echecs ? 1 : 0);
