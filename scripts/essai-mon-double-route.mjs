// ✨ « MA FIGURINE », MON DOUBLE DU JOUR (le chantier « Ma figurine », lot 1 ; `lib/direct/mon-double.ts`,
// `mon-double-serveur.ts`, `app/api/direct/mon-double` ; `docs/univers/ma-figurine.md`), PAR LES ROUTES — contre le faux
// Supabase et le faux moteur d'image (jamais la vraie base).
//
// Léa a sa figurine et ses sept expressions ; son humeur du jour : la tristesse. Son double : ses sept têtes, celle de son
// humeur (la triste), pas encore prêt. Elle choisit le rire : sa maison, le fil (« Toi »), la messagerie (la tête du jour),
// Autour et chez Sam qui la visite — partout le rire, et la pastille s'en va. Sa pancarte : un mot interdit et l'alcool
// refusés ; « Qui vient prendre un café ? » : dans sa maison, le fil, chez Sam, et préremplie comme mot du jour d'Autour.
// Elle pose sa figurine au bistrot avec un autre mot : sa pancarte devient ce mot. Elle entre au salon du foot : Hugo
// l'y voit avec sa tête du jour et sa pancarte. Revenir à son humeur ; un choix d'hier ne compte plus ; « C'est moi
// aujourd'hui ». Sans compte : 401. Jamais le mot « exemple ».
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
async function attendreQue(f, ms = 90000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const v = await f().catch(() => null);
    if (v) return v;
    await pause(400);
  }
  return null;
}

// (« Ma maison » n'est encore ouverte qu'à l'administrateur, ici : Léa l'est, comme dans les autres essais de sa maison)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);

const qui = (n, prenom) => ({ id: `5d0b1e00-0000-4000-8000-0000005d10${String(n).padStart(2, "0")}`, jeton: `jeton-mon-double-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const HUGO = qui(3, "Hugo");
const GENS = [LEA, SAM, HUGO];
const BISTROT = "c-petit-bistrot-double";
const maintenant = new Date().toISOString();
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000005d01", slug: "petit-bistrot-double", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 }]);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/><rect x="370" y="540" width="60" height="40" fill="${couleur}"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/></svg>`), left: 0, top: 0 }])
    .png()
    .toBuffer();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [x, c] of GENS.map((g, k) => [g, ["#c8643c", "#3c8cc8", "#8cc83c"][k]])) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(c), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`${x.id}/majeur.json`, { le: maintenant, age: 30, adulte: true });
  await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })));
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { fond: "#4a5a6e", sol: "#6a5040", le: maintenant, emplacements: { tele: [0.32, 0.2, 0.36, 0.15], cadres: [[0.06, 0.44, 0.1, 0.09]], places: [{ x: 0.3, y: 0.86, hauteur: 0.3 }, { x: 0.7, y: 0.86, hauteur: 0.3 }] } });
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() });
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const hier = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() - 36 * 3600_000));
await json(`${LEA.id}/humeur.json`, { jour, visage: "tristesse", le: maintenant });
await fetch(`${BASE}/api/cron/decouvrir-selection`).catch(() => null);

const appel = async (x, chemin, corps, admin = false) => {
  const cookie = [admin ? COOKIE_ADMIN : "", x ? `clikme_habitant=${x.jeton}` : ""].filter(Boolean).join("; ");
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const tous = [];
const garder = (r) => (tous.push(r), r);
const double = async (x) => garder(await appel(x, "/api/direct/mon-double"));
const faire = async (x, corps) => garder(await appel(x, "/api/direct/mon-double", corps));
const maison = async () => garder(await appel(LEA, "/api/direct/ma-piece", null, true)).maison;
const filMoi = async () => garder(await appel(LEA, "/api/direct/fil-decouvrir")).fil?.moi;

// ═══ SANS COMPTE ═══
ok((await appel(null, "/api/direct/mon-double")).statut === 401, "sans compte : 401");
ok((await appel(null, "/api/direct/mon-double", { action: "pret" })).statut === 401, "… et rien ne s'écrit");

// ═══ SES SEPT EXPRESSIONS ═══
await appel(LEA, "/api/direct/ma-figurine");
await appel(HUGO, "/api/direct/ma-figurine");
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le && e.tetes?.triste && e.tetes?.rire ? e : null;
});
ok(Boolean(etat), "Léa a ses sept expressions");

// ═══ SON DOUBLE, AVANT ═══
const d0 = await double(LEA);
ok(d0.statut === 200 && d0.double?.tetes?.length === 7 && d0.double.tetes.every((t) => t.src === etat?.tetes?.[t.cle]), `son double : ses sept têtes (${d0.double?.tetes?.length})`);
ok(d0.double?.humeur?.e === "triste" && d0.double.humeur.emoji === "😢" && !d0.double.choisie && d0.double.pancarte === "" && d0.double.pret === false, "… celle de son humeur (la tristesse), rien de choisi, pas de pancarte, pas encore prêt");
ok(Boolean(d0.double?.corps?.src) && d0.double.corps.boite.length === 4 && d0.double.corps.ratio > 0 && Boolean(d0.double.habituelle), "… son corps sans sa tête et la boîte de sa tête");
ok(Boolean(d0.vivante?.expressions?.sourire) && d0.vivante.humeur === "triste", "… et sa figurine vivante, pour le miroir (avec la tête du jour)");
const m0 = await maison();
ok(m0?.tete?.e === "triste" && m0.double?.pret === false, "sa maison : la tête triste, la pastille (pas encore prêt)");
ok(!("salons" in (m0 ?? {})) || Array.isArray(m0.salons), "sa maison répond comme avant");

// ═══ ELLE CHOISIT LE RIRE ═══
ok((await faire(LEA, { action: "tete", e: "pas-une-tete" })).statut === 400, "une tête qui n'existe pas : refusée");
const d1 = await faire(LEA, { action: "tete", e: "rire" });
ok(d1.statut === 200 && d1.double?.choisie === "rire" && d1.double.pret === true, "elle choisit le rire : choisi, et son double est prêt (la pastille s'en va)");
ok((await lire(`${LEA.id}/mon-double.json`))?.tete?.jour === jour, "rangé pour aujourd'hui seulement (mon-double.json)");
const m1 = await maison();
ok(m1?.tete?.e === "rire" && m1.tete.src === etat?.tetes?.rire && m1.double?.pret === true, "sa maison : la tête du rire, plus de pastille");
const f1 = await filMoi();
ok(f1?.figurine?.tete === etat?.tetes?.rire && Boolean(f1.figurine.corps), "le fil (« Toi ») : la tête du rire sur son corps");
const t1 = garder(await appel(LEA, "/api/direct/autour?mesTetes=1"));
ok(t1.tetes?.humeur?.e === "rire", "Autour : sa tête du jour, le rire");
const cleLea = cleProfil(LEA.id);
const v1 = garder(await appel(SAM, `/api/direct/ma-piece?chez=${cleLea}`)).visite;
ok(v1?.etat === "ouvert" && v1.maison?.tete?.e === "rire", "chez Léa, en visite, Sam la voit rire");

// ═══ SA PANCARTE ═══
ok((await faire(LEA, { action: "pancarte", texte: "bande de connards" })).statut === 400, "un mot interdit : refusé");
ok((await faire(LEA, { action: "pancarte", texte: "Qui vient boire une bière ?" })).statut === 400, "… l'alcool aussi");
const p1 = await faire(LEA, { action: "pancarte", texte: "  Qui vient   prendre un café ?  " });
ok(p1.statut === 200 && p1.double?.pancarte === "Qui vient prendre un café ?", "« Qui vient prendre un café ? » : sa pancarte (les espaces en trop partis)");
const long = await faire(LEA, { action: "pancarte", texte: "a".repeat(120) });
ok(long.double?.pancarte?.length === 80, "80 signes au plus");
await faire(LEA, { action: "pancarte", texte: "Qui vient prendre un café ?" });
const m2 = await maison();
ok(m2?.double?.pancarte === "Qui vient prendre un café ?", "sa maison : sa pancarte");
ok((await filMoi())?.figurine?.pancarte === "Qui vient prendre un café ?", "le fil (« Toi ») : sa pancarte");
const v2 = garder(await appel(SAM, `/api/direct/ma-piece?chez=${cleLea}`)).visite;
ok(v2?.maison?.double?.pancarte === "Qui vient prendre un café ?" && v2.maison.double.pret === undefined, "chez Léa : Sam lit sa pancarte (et rien de plus de son double)");
ok(garder(await appel(LEA, "/api/direct/autour?mesTetes=1")).tetes?.pancarte === "Qui vient prendre un café ?", "Autour : sa pancarte, préremplie comme mot du jour");

// ═══ ELLE POSE SA FIGURINE AU BISTROT : SON MOT DU JOUR EST SA PANCARTE ═══
const pose = garder(await appel(LEA, "/api/direct/autour", { action: "poser", lieu: BISTROT, mot: "Ce soir, je suis là", tete: "humeur", qui: "tous" }));
ok(pose.statut === 200, "elle pose sa figurine au Petit Bistrot, avec « Ce soir, je suis là »");
ok((await double(LEA)).double?.pancarte === "Ce soir, je suis là", "… sa pancarte devient son mot du jour");
const posees = garder(await appel(SAM, `/api/direct/autour?figurines=1&lieu=${BISTROT}`)).figurines ?? [];
ok(posees.some((f) => f.prenom === "Léa" && f.tete === etat?.tetes?.rire), "au bistrot, sa figurine fait sa tête du jour (le rire)");

// ═══ AU SALON DU FOOT ═══
const e1 = garder(await appel(LEA, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" }));
ok(e1.statut === 200, "Léa entre au salon du foot");
const e2 = garder(await appel(HUGO, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" }));
const elle = e2.ouverture?.presents?.find((p) => p.prenom === "Léa");
ok(elle?.tete?.src === etat?.tetes?.rire && Boolean(elle.tete.corps) && elle.tete.boite?.length === 4 && elle.pancarte === "Ce soir, je suis là", "Hugo l'y voit : sa tête du jour sur son corps, sa pancarte");
ok(!JSON.stringify(e2).includes(LEA.id), "… jamais son compte");

// ═══ REVENIR À SON HUMEUR ; UN CHOIX D'HIER ; « C'EST MOI AUJOURD'HUI » ═══
const d2 = await faire(LEA, { action: "tete", e: "humeur" });
ok(d2.double?.choisie === undefined && (await maison())?.tete?.e === "triste", "« Mon humeur » : la tête triste revient, partout");
await json(`${LEA.id}/mon-double.json`, { tete: { jour: hier, e: "fache" }, pancarte: { mot: "Ce soir, je suis là", le: maintenant }, pret: hier });
const d3 = await double(LEA);
ok(!d3.double?.choisie && d3.double?.pret === false && d3.double.pancarte === "Ce soir, je suis là", "le lendemain : la tête d'hier ne compte plus, la pastille revient, la pancarte reste");
ok((await maison())?.tete?.e === "triste", "… sa maison fait la tête de son humeur");
const d4 = await faire(LEA, { action: "pret" });
ok(d4.double?.pret === true && (await maison())?.double?.pret === true, "« C'est moi aujourd'hui » : prêt, la pastille s'en va");
const d5 = await faire(LEA, { action: "pancarte", texte: "" });
ok(d5.double?.pancarte === "" && !(await maison())?.double?.pancarte, "sans pancarte : elle s'en va");
ok((await faire(LEA, { action: "danser" })).statut === 400, "une action inconnue : refusée");

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nmon double du jour tient ✓");
process.exit(echecs ? 1 : 0);
