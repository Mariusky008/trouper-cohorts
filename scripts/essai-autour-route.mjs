// 📍 AUTOUR DE MOI, PAR LES ROUTES — contre le faux Supabase, jamais la vraie base (`lib/direct/autour-serveur.ts`).
//
// À Dax, un commerce client avec ses coordonnées (Le Petit Bistrot), un prospect, et un commerce d'une autre ville.
// Léa dépose ses mèmes : au Petit Bistrot (pour tout le monde, avec un petit mot), « Ailleurs » (une soirée, pour ses
// proches : sa position devient une zone, gardée nulle part telle quelle), et un pour elle seule. Ce que chacun voit :
// Sam (un inconnu) seulement « tout le monde » ; Hugo (un proche) aussi la soirée ; Léa tout. Trois par lieu et par
// jour ; pas d'adresse dans un petit nom ; ni gros mot ni alcool ; pas un duo ; pas le mème d'un autre. Hugo répond au
// mème de Léa : les deux sont liés. Le profil de Léa : ses mèmes « tout le monde », jamais son identifiant ni sa
// position. Un mème déplacé quitte l'ancien lieu ; un mème retiré disparaît. Sans compte : on regarde, on ne dépose pas.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-autour-route.mjs          (sur un faux Supabase tout neuf)
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
  { id: "ffffffff-0000-4000-8000-000000000201", slug: "petit-bistrot-autour", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 },
  { id: "ffffffff-0000-4000-8000-000000000202", slug: "prospect-autour", channel: "letter", business_name: "Un prospect", city: "Dax", activite: "Bistrot", published: false, est_client: false, latitude: 43.711, longitude: -1.052 },
  { id: "ffffffff-0000-4000-8000-000000000203", slug: "ailleurs-autour", channel: "letter", business_name: "Ailleurs", city: "64100 Bayonne", activite: "Café", published: true, est_client: true, latitude: 43.49, longitude: -1.47 },
]);
await semer("human_habitants", [LEA, HUGO, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer(
  "clik_ma_figurine",
  [LEA, HUGO, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre.webp`, parle: `${x.id}/parle.webp`, prete_le: new Date().toISOString() })),
);
for (const x of [LEA, HUGO, SAM]) await deposer(`${x.id}/neutre.webp`, Buffer.alloc(64, 7), "image/webp");
// Hugo a Léa dans ses Rencontres : une proche
await json(`${HUGO.id}/rencontres.json`, { amis: [LEA.id] });
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

// ═══ LÉA DÉPOSE ═══
let r = await appel(LEA, { action: "deposer", meme: L[0], lieu: BISTROT, qui: "tous", mot: "Le chef m’a reconnu." });
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

// ═══ DÉPLACER, RETIRER ═══
r = await appel(LEA, { action: "deposer", meme: L[0], ici: ICI, qui: "tous", nomLieu: "Au bord de l’Adour" });
l = await voir(SAM, `?lieu=${BISTROT}`);
ok(r.statut === 200 && !l.memes.some((m) => m.id === L[0]), "un mème reposé ailleurs quitte l’ancien lieu");
await appel(LEA, { action: "retirer", meme: L[3] });
l = await voir(LEA, `?lieu=${BISTROT}`);
ok(!l.memes.some((m) => m.id === L[3]) && !(await lire(`${LEA.id}/autour/${L[3]}.json`)), "retiré : il disparaît");

// ═══ SANS COMPTE ═══
const anonyme = await voir(null, "?ville=dax");
r = await appel(null, { action: "deposer", meme: L[5], lieu: BISTROT });
ok(anonyme.statut === 200 && anonyme.compte === false && lieuDe(anonyme, BISTROT) && r.statut === 403, "sans compte : on regarde (avec ?ville), on ne dépose pas");

if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
