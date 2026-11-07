// 📍 AUTOUR DE MOI, PAR LES ROUTES — contre le faux Supabase, jamais la vraie base (`lib/direct/autour-serveur.ts`).
//
// À Dax, un commerce client avec ses coordonnées (Le Petit Bistrot), un prospect, et un commerce d'une autre ville.
// Sans son âge déclaré (15 ans et plus), Léa ne dépose rien ; elle le déclare. Léa dépose ses mèmes : au Petit Bistrot
// (pour tout le monde, avec un petit mot), « Ailleurs » (une soirée, pour ses proches : sa position devient une zone,
// gardée nulle part telle quelle), et un pour elle seule. Ce que chacun voit : Sam (un inconnu) seulement « tout le
// monde » ; Hugo (un proche de Léa) aussi la soirée ; Léa tout. Trois par lieu et par jour ; pas d'adresse dans un petit
// nom ; ni gros mot ni alcool ; pas un duo ; pas le mème d'un autre. Hugo répond au mème de Léa : les deux sont liés. Le
// profil de Léa : ses mèmes « tout le monde », jamais son identifiant ni sa position. 👯 Sam l'ajoute à ses proches : il
// ne voit pas pour autant sa soirée (c'est Léa qui choisit les siens) ; elle l'ajoute : il la voit. Un mème déplacé
// quitte l'ancien lieu ; un mème retiré disparaît. Sans compte : on regarde, on ne dépose pas.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-autour-route.mjs          (sur un faux Supabase tout neuf)
import { createHash } from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};
const liste = async (prefix) =>
  (await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000 }) })).json()).map((x) => x.name);

const LEA = { id: "abababab-0000-4000-8000-000000000201", jeton: "jeton-lea-autour-00000000001", prenom: "Léa" };
const HUGO = { id: "abababab-0000-4000-8000-000000000202", jeton: "jeton-hugo-autour-0000000001", prenom: "Hugo" };
const SAM = { id: "abababab-0000-4000-8000-000000000203", jeton: "jeton-sam-autour-00000000001", prenom: "Sam" };
const BISTROT = "c-petit-bistrot-autour";

await semer("human_vitrine_sites", [
  {
    id: "ffffffff-0000-4000-8000-000000000201",
    slug: "petit-bistrot-autour",
    channel: "letter",
    business_name: "Le Petit Bistrot",
    city: "40100 Dax",
    activite: "Restaurant",
    published: true,
    est_client: true,
    latitude: 43.7102,
    longitude: -1.0538,
    // ses photos : sa couverture ClikMe (faite), sa devanture, une photo de sa fiche Google ; et une à lui, en `data:`
    diagnostic: { couverture: { etat: "prete", url: "https://photos.clikme-essai.test/couverture-bistrot.webp", at: "" }, photos: ["https://photos.clikme-essai.test/google-bistrot.jpg"] },
    metadata: { photos_du_lieu: { devanture: { url: "https://photos.clikme-essai.test/devanture-bistrot.jpg", at: "" } } },
    gallery_photos: ["data:image/jpeg;base64,AAAA"],
  },
  { id: "ffffffff-0000-4000-8000-000000000202", slug: "prospect-autour", channel: "letter", business_name: "Un prospect", city: "Dax", activite: "Bistrot", published: false, est_client: false, latitude: 43.711, longitude: -1.052 },
  { id: "ffffffff-0000-4000-8000-000000000203", slug: "ailleurs-autour", channel: "letter", business_name: "Ailleurs", city: "64100 Bayonne", activite: "Café", published: true, est_client: true, latitude: 43.49, longitude: -1.47 },
]);
await semer("human_habitants", [LEA, HUGO, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer(
  "clik_ma_figurine",
  [LEA, HUGO, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre.webp`, parle: `${x.id}/parle.webp`, prete_le: new Date().toISOString() })),
);
for (const x of [LEA, HUGO, SAM]) await deposer(`${x.id}/neutre.webp`, Buffer.alloc(64, 7), "image/webp");
// Léa et Hugo sont proches l'un de l'autre (Hugo l'a dans ses amis des Rencontres d'avant ; Léa, dans ses proches) :
// ce que Léa dépose pour « Mes proches », Hugo le voit — c'est la liste de Léa qui compte
await json(`${HUGO.id}/rencontres.json`, { amis: [LEA.id] });
await json(`${LEA.id}/proches.json`, { ids: [HUGO.id] });
// Hugo et Sam ont déclaré leur âge (15 ans et plus) ; Léa, pas encore (sa figurine date d'avant la question)
for (const x of [HUGO, SAM]) await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
/** Un mème en vidéo (comme le fait la route) ; `duo` : une réponse en duo (la figurine d'un autre). */
async function meme(h, id, duo = false) {
  await semer("clik_figurine_message", [{ id, habitant_id: h, son: `${h}/m-${id}.mp3`, duree: 2, commerces: [], created_at: new Date().toISOString() }]);
  await deposer(`${h}/meme-${id}.mp4`, Buffer.alloc(1024, 1), "video/mp4");
  await json(`${h}/m-${id}.json`, { meme: `${h}/meme-${id}.mp4`, memeType: "video/mp4", ...(duo ? { repondA: "zzzzzzzzzzzz" } : {}) });
}
const L = ["autourlea001", "autourlea002", "autourlea003", "autourlea004", "autourlea005", "autourlea006"];
for (const id of L) await meme(LEA.id, id);
await meme(LEA.id, "autourleaduo", true);
await meme(HUGO.id, "autourhugo01");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const appel = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/autour`, { method: "POST", headers: { "content-type": "application/json", cookie: qui ? `clikme_habitant=${qui.jeton}` : "" }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (qui, q = "") => {
  const r = await fetch(`${BASE}/api/direct/autour${q}`, { headers: { cookie: qui ? `clikme_habitant=${qui.jeton}` : "" } });
  const texte = await r.text();
  return { statut: r.status, texte, ...JSON.parse(texte || "{}") };
};
const lieuDe = (carte, id) => (carte.lieux ?? []).find((l) => l.id === id);

// ═══ LA CARTE, VIDE ═══
let c = await voir(LEA);
ok(c.statut === 200 && c.ville === "dax" && lieuDe(c, BISTROT)?.n === 0 && lieuDe(c, BISTROT)?.emoji === "🍽️" && c.lieux.length === 1 && c.derniers.length === 0, "la carte de Dax : le commerce client avec ses coordonnées (pas le prospect, pas Bayonne), sans mème");

// ═══ 🔞 SANS SON ÂGE DÉCLARÉ, RIEN DANS LA VILLE ═══
let r = await appel(LEA, { action: "deposer", meme: L[0], lieu: BISTROT, qui: "tous" });
ok(r.statut === 403 && r.age === true && /15 ans et plus/.test(r.error ?? "") && (await liste(`autour/dax/${BISTROT}`)).length === 0, `sans son âge déclaré : refusé, l'écran le lui demandera (${r.statut}, ${r.error})`);
const age = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}` }, body: JSON.stringify({ action: "majeur" }) });
ok(age.status === 200 && (await lire(`${LEA.id}/majeur.json`))?.age === 15, "elle déclare avoir 15 ans ou plus : c'est noté");
const sansCompteAge = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "majeur" }) });
ok(sansCompteAge.status === 403, "sans compte, rien à noter");

// ═══ LÉA DÉPOSE ═══
r = await appel(LEA, { action: "deposer", meme: L[0], lieu: BISTROT, qui: "tous", mot: "Le chef m’a reconnu." });
ok(r.statut === 200 && r.lieu === BISTROT, "au Petit Bistrot, pour tout le monde, avec un petit mot");
const ICI = { lat: 43.71021, lng: -1.05383 };
r = await appel(LEA, { action: "deposer", meme: L[1], ici: ICI, qui: "proches", nomLieu: "Soirée chez Max" });
const ZONE = r.lieu;
ok(r.statut === 200 && /^z-\d+_-\d+$/.test(ZONE ?? ""), `« Ailleurs », pour ses proches : une zone (${ZONE})`);
const fichiers = await liste(`autour/dax/${ZONE}`);
const depot = await lire(`autour/dax/${ZONE}/${fichiers[0]}`);
ok(fichiers.length === 1 && fichiers[0] === `${L[1]}.proches.${LEA.id}.json` && !JSON.stringify(depot).includes("43.71021") && !("lat" in depot) && depot.nomLieu === "Soirée chez Max", "sa position n’est gardée nulle part : seulement la zone, et son petit nom");
r = await appel(LEA, { action: "deposer", meme: L[2], lieu: BISTROT, qui: "moi" });
ok(r.statut === 200, "et un pour elle seule");

// ═══ CE QUI EST REFUSÉ ═══
r = await appel(LEA, { action: "deposer", meme: L[3], ici: ICI, nomLieu: "12 rue des Lilas" });
ok(r.statut === 400 && /adresse/.test(r.error), "un petit nom qui est une adresse : refusé");
r = await appel(LEA, { action: "deposer", meme: L[3], lieu: BISTROT, mot: "Ce soir, apéro chez moi" });
ok(r.statut === 400, "rien d’alcoolisé dans le petit mot");
r = await appel(LEA, { action: "deposer", meme: "autourleaduo", lieu: BISTROT });
ok(r.statut === 400 && /duo/.test(r.error), "un duo reste entre eux");
r = await appel(HUGO, { action: "deposer", meme: L[3], lieu: BISTROT });
ok(r.statut === 400 && /pas le tien/.test(r.error), "le mème de quelqu’un d’autre : refusé");
r = await appel(LEA, { action: "deposer", meme: L[3], lieu: "c-ailleurs-autour" });
ok(r.statut === 400, "un commerce d’une autre ville : refusé");
// trois par lieu et par jour
r = await appel(LEA, { action: "deposer", meme: L[3], lieu: BISTROT, qui: "tous" });
const quatrieme = await appel(LEA, { action: "deposer", meme: L[4], lieu: BISTROT, qui: "tous" });
ok(r.statut === 200 && quatrieme.statut === 429 && /maximum/.test(quatrieme.error), "trois par lieu et par jour, pas un de plus");

// ═══ CE QUE CHACUN VOIT ═══
const sam = await voir(SAM);
const hugo = await voir(HUGO);
const lea = await voir(LEA);
ok(lieuDe(sam, BISTROT)?.n === 2 && !lieuDe(sam, ZONE), `Sam, un inconnu : « tout le monde » seulement (2 au Petit Bistrot, pas la soirée)`);
ok(lieuDe(hugo, BISTROT)?.n === 2 && lieuDe(hugo, ZONE)?.n === 1 && lieuDe(hugo, ZONE)?.nom === "Soirée chez Max" && lieuDe(hugo, ZONE)?.emoji === "✨", "Hugo, un proche : aussi la soirée, sous son petit nom");
ok(lieuDe(lea, BISTROT)?.n === 3 && lieuDe(lea, ZONE)?.n === 1, "Léa voit tout ce qu’elle a déposé");
const zone = lieuDe(hugo, ZONE);
ok(zone && (zone.lat !== ICI.lat || zone.lng !== ICI.lng) && !hugo.texte.includes("43.71021"), `la zone est montrée à son centre (${zone?.lat}, ${zone?.lng}), jamais à sa position`);
/** Aucun champ ne porte un identifiant d'habitant (les adresses signées des images, elles, nomment leur dossier, comme partout). */
const champs = (x, k = "") => (x && typeof x === "object" ? Object.entries(x).flatMap(([c, v]) => [c, ...champs(v, c)]) : []);
const sansIdentifiant = (o) => !champs(o).some((c) => ["h", "habitant", "habitant_id", "habitantId"].includes(c));
ok(sansIdentifiant(sam) && sansIdentifiant(hugo), "aucun champ « habitant » dans la carte : une clé de profil seulement");
ok(sam.derniers.length === 2 && sam.derniers.every((m) => m.video && m.prenom === "Léa"), "les derniers mèmes autour de lui : en vidéo, avec le prénom");

// ═══ LES MÈMES DU LIEU, ET UNE RÉPONSE ═══
let l = await voir(SAM, `?lieu=${BISTROT}`);
ok(l.statut === 200 && l.lieu?.nom === "Le Petit Bistrot" && l.memes.length === 2 && l.memes.some((m) => m.mot === "Le chef m’a reconnu.") && l.memes.every((m) => /^[a-f0-9]{16}$/.test(m.profil)), "le lieu : ses mèmes pour le swipe, le petit mot, une clé de profil (pas un identifiant)");
ok(l.lieu?.photo === "https://photos.clikme-essai.test/couverture-bistrot.webp" && !lieuDe(await voir(SAM), BISTROT)?.photo, `🖼️ en haut de sa page : la photo du commerce — sa couverture ClikMe d'abord (pas sur la carte) (${l.lieu?.photo})`);
const changer = (x) => fetch(`${F}/human_vitrine_sites?slug=eq.petit-bistrot-autour`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
await changer({ diagnostic: { couverture: { etat: "originale", url: "https://photos.clikme-essai.test/couverture-bistrot.webp", at: "" }, photos: ["https://photos.clikme-essai.test/google-bistrot.jpg"] } });
const sansCouverture = (await voir(SAM, `?lieu=${BISTROT}`)).lieu?.photo;
await changer({ metadata: {} });
const sansDevanture = (await voir(SAM, `?lieu=${BISTROT}`)).lieu?.photo;
await changer({ diagnostic: {} });
const sansRien = (await voir(SAM, `?lieu=${BISTROT}`)).lieu;
ok(
  sansCouverture === "https://photos.clikme-essai.test/devanture-bistrot.jpg" && sansDevanture === "https://photos.clikme-essai.test/google-bistrot.jpg" && sansRien?.nom === "Le Petit Bistrot" && !sansRien.photo,
  "revenu à l'originale : sa devanture ; sans elle : sa fiche Google ; sinon rien (jamais sa photo en data:)",
);
r = await appel(HUGO, { action: "deposer", meme: "autourhugo01", lieu: BISTROT, qui: "tous", reponseA: L[2] });
ok(r.statut === 400, "répondre à un mème qu’il ne peut pas voir : refusé");
r = await appel(HUGO, { action: "deposer", meme: "autourhugo01", lieu: BISTROT, qui: "tous", reponseA: L[0] });
l = await voir(SAM, `?lieu=${BISTROT}`);
const origine = l.memes.find((m) => m.id === L[0]);
const reponse = l.memes.find((m) => m.id === "autourhugo01");
ok(r.statut === 200 && origine?.reponses === 1 && reponse?.reponseA === L[0] && reponse.prenom === "Hugo", "Hugo répond à Léa avec sa figurine : les deux mèmes sont liés");

// ═══ LE PROFIL DE LÉA ═══
const cle = origine?.profil;
const p = await voir(SAM, `?profil=${cle}`);
ok(p.statut === 200 && p.profil?.prenom === "Léa" && p.profil.memes.length === 2 && p.profil.memes.every((m) => m.qui === "tous") && p.profil.lieux[0]?.nom === "Le Petit Bistrot" && p.profil.lieux[0]?.n === 2, "son profil : ses mèmes « tout le monde » et leurs lieux (ni la soirée, ni celui pour elle seule)");
ok(sansIdentifiant(p) && !p.texte.includes("43.71021") && !p.texte.includes('"lat"'), "ni son identifiant, ni une position");
ok((await voir(SAM, "?profil=0000000000000000")).statut === 404, "un profil inconnu : 404");

// ═══ 👯 AJOUTER EN PROCHE, DEPUIS SON PROFIL : SA LISTE À LUI — S'AJOUTER NE DONNE RIEN À VOIR ═══
ok(!p.profil?.proche && !p.profil?.moi && (await voir(LEA, `?profil=${cle}`)).profil?.moi === true, "son profil dit si on l'a dans ses proches, et si c'est le sien");
r = await appel(SAM, { action: "proche", profil: cle, oui: true });
ok(r.statut === 200 && r.proche === true && ((await lire(`${SAM.id}/proches.json`))?.ids ?? []).includes(LEA.id) && (await voir(SAM, `?profil=${cle}`)).profil?.proche === true, "Sam ajoute Léa à ses proches (par la clé de son profil, jamais son identifiant)");
ok(!lieuDe(await voir(SAM), ZONE), "mais il ne voit pas pour autant sa soirée « Mes proches » : c'est Léa qui choisit les siens");
ok(
  (await appel(LEA, { action: "proche", profil: cle, oui: true })).statut === 400 && (await appel(SAM, { action: "proche", profil: "0000000000000000", oui: true })).statut === 404 && (await appel(null, { action: "proche", profil: cle, oui: true })).statut === 403,
  "pas soi-même ; pas un profil inconnu ; pas sans compte",
);
// Léa, elle, ajoute Sam : il voit sa soirée ; puis elle le retire, et il ne la voit plus
const cleSam = createHash("sha256").update(`clikme-profil:${SAM.id}`).digest("hex").slice(0, 16);
await json(`profils/${cleSam}.json`, { h: SAM.id });
r = await appel(LEA, { action: "proche", profil: cleSam, oui: true });
ok(r.statut === 200 && lieuDe(await voir(SAM), ZONE)?.n === 1, "Léa ajoute Sam à ses proches : il voit sa soirée « Mes proches »");
r = await appel(LEA, { action: "proche", profil: cleSam, oui: false });
const r2 = await appel(SAM, { action: "proche", profil: cle, oui: false });
ok(r.statut === 200 && r.proche === false && !lieuDe(await voir(SAM), ZONE) && r2.proche === false && !((await lire(`${SAM.id}/proches.json`))?.ids ?? []).includes(LEA.id), "retirés de part et d'autre : la soirée redevient invisible pour Sam");

// ═══ DÉPLACER, RETIRER ═══
r = await appel(LEA, { action: "deposer", meme: L[0], ici: ICI, qui: "tous", nomLieu: "Au bord de l’Adour" });
l = await voir(SAM, `?lieu=${BISTROT}`);
ok(r.statut === 200 && !l.memes.some((m) => m.id === L[0]), "un mème reposé ailleurs quitte l’ancien lieu");
await appel(LEA, { action: "retirer", meme: L[3] });
l = await voir(LEA, `?lieu=${BISTROT}`);
ok(!l.memes.some((m) => m.id === L[3]) && !(await lire(`${LEA.id}/autour/${L[3]}.json`)), "retiré : il disparaît");

// ═══ RÉPONDRE DANS UNE ZONE « AILLEURS » (par son identifiant, sans sa position) ═══
r = await appel(HUGO, { action: "deposer", meme: "autourhugo01", lieu: ZONE, qui: "tous", reponseA: L[1], nomLieu: "Chez moi" });
const zH = lieuDe(await voir(HUGO), ZONE);
const zS = lieuDe(await voir(SAM), ZONE);
ok(r.statut === 200 && r.lieu === ZONE && zH?.n === 3 && zH.nom === "Soirée chez Max", `Hugo répond dans la soirée de Léa : la zone garde le petit nom de son premier mème (${zH?.nom})`);
ok(zS?.n === 2 && zS.nom === "Au bord de l’Adour", `Sam ne voit pas la soirée (pour ses proches) : ni elle, ni son petit nom (${zS?.nom})`);
ok(!(await voir(HUGO, `?lieu=${ZONE}`)).lieu?.photo, "une zone « Ailleurs » : pas de photo (sa page garde son fond)");
r = await appel(HUGO, { action: "deposer", meme: "autourhugo01", lieu: "z-9999_-9999" });
ok(r.statut === 400, "une zone où personne n’a rien déposé : refusée par son identifiant (il faut sa position)");

// ═══ SANS COMPTE ═══
const anonyme = await voir(null, "?ville=dax");
r = await appel(null, { action: "deposer", meme: L[5], lieu: BISTROT });
ok(anonyme.statut === 200 && anonyme.compte === false && lieuDe(anonyme, BISTROT) && r.statut === 403, "sans compte : on regarde (avec ?ville), on ne dépose pas");

if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
