// 🔥🎧❤️ « ELLE CHANGE TOUTE SEULE » (le chantier « Ma figurine », juste après le lot 1 ; `lib/direct/ornements.ts`,
// `ornements-serveur.ts` ; `docs/univers/ma-figurine.md`, section 3), PAR LES ROUTES — contre le faux Supabase et le
// faux moteur d'image (jamais la vraie base).
//
// Léa vient depuis huit jours de suite, va surtout au salon de la musique : son double porte l'auréole (7 jours et plus)
// et le casque, posés dans la boîte de sa tête. Sam lui laisse une surprise ; elle l'ouvre : un cœur « offert par Sam »,
// partout (son double, sa maison, la visite de Sam, le fil, le salon où Hugo la voit). Sam : un seul jour (pas de
// flamme), sa passion déclarée, le foot (l'écharpe) ; un salon d'il y a quarante jours ne compte plus. Hugo : deux jours
// la semaine dernière, sans passion — rien. Un cœur de plus de quinze jours s'en va. Jamais de chiffre inventé, jamais
// le mot « exemple ».
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

const qui = (n, prenom) => ({ id: `0e0e0e00-0000-4000-8000-0000000e10${String(n).padStart(2, "0")}`, jeton: `jeton-ornements-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const HUGO = qui(3, "Hugo");
const GENS = [LEA, SAM, HUGO];
const maintenant = new Date().toISOString();
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
const maison = async () => garder(await appel(LEA, "/api/direct/ma-piece", null, true)).maison;
const filMoi = async () => garder(await appel(LEA, "/api/direct/fil-decouvrir")).fil?.moi;

const jourDe = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(ms));
const JOUR = 86_400_000;
// (Léa : les sept jours d'avant ; aujourd'hui s'ajoute quand elle ouvre l'appli — huit de suite)
await json(`${LEA.id}/presence.json`, { jours: [7, 6, 5, 4, 3, 2, 1].map((n) => jourDe(Date.now() - n * JOUR)) });
await json(`${LEA.id}/mes-salons.json`, { themes: { musique: { n: 4, dernier: Date.now() - 2 * JOUR }, foot: { n: 1, dernier: Date.now() - JOUR } } });
await json(`${LEA.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
// (Sam : sa passion, le foot ; un salon de la musique il y a quarante jours)
await json(`${SAM.id}/passions.json`, { passions: ["foot", "series", "humour"], poids: {}, le: maintenant });
await json(`${SAM.id}/mes-salons.json`, { themes: { musique: { n: 9, dernier: Date.now() - 40 * JOUR } } });
// (Hugo : deux jours la semaine dernière)
await json(`${HUGO.id}/presence.json`, { jours: [6, 5].map((n) => jourDe(Date.now() - n * JOUR)) });

// ═══ SANS COMPTE, RIEN ═══
ok((await appel(null, "/api/direct/mon-double")).statut === 401, "sans compte : 401");

// ═══ ILS OUVRENT L'APPLI ═══
for (const x of GENS) await appel(x, "/api/direct/ma-figurine");
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le && e.tetes?.rire ? e : null;
});
ok(Boolean(etat), "Léa a ses expressions (et ses calques : la boîte de sa tête)");
const presence = await lire(`${LEA.id}/presence.json`);
ok(presence?.jours?.includes(jour), "aujourd'hui compte (elle a ouvert l'appli)");

// ═══ LÉA : 🔥 8 JOURS, 😇 L'AURÉOLE, 🎧 LE CASQUE ═══
const d0 = await double(LEA);
const o0 = d0.double?.ornements;
ok(o0?.serie === 8, `sa série : 8 jours de suite (${o0?.serie})`);
ok(o0?.accessoire?.theme === "musique" && o0.accessoire.sorte === "casque" && /casque/i.test(o0.accessoire.nom), "sa passion du moment, la musique (le salon où elle va le plus) : le casque");
ok(Array.isArray(o0?.boite) && o0.boite.length === 4 && o0.boite.every((v) => v >= 0 && v <= 1) && JSON.stringify(o0.boite) === JSON.stringify(d0.double.corps?.boite), "… posé dans la boîte de sa tête (la même que celle de son corps)");
ok(!o0?.coeur, "pas encore de cœur");
const m0 = await maison();
ok(m0?.double?.ornements?.serie === 8 && m0.double.ornements.accessoire?.sorte === "casque", "sa maison : pareil");
ok((await filMoi())?.figurine?.ornements?.accessoire?.sorte === "casque", "le fil (« Toi ») : pareil");

// ═══ SAM LUI LAISSE UNE SURPRISE ; ELLE L'OUVRE ═══
const cleLea = cleProfil(LEA.id);
await appel(SAM, `/api/direct/ma-piece?chez=${cleLea}`);
await appel(SAM, "/api/direct/visites", { action: "frapper", cle: cleLea });
const laisse = garder(await appel(SAM, "/api/direct/visites", { action: "souvenir", cle: cleLea, objet: "fleurs", mot: "Pour toi" }));
ok(laisse.statut === 200, `Sam lui laisse un bouquet (${laisse.statut}${laisse.error ? ` : ${laisse.error}` : ""})`);
const enAttente = (await lire(`${LEA.id}/monde/souvenirs.json`))?.liste?.find((x) => x.de === SAM.id && !x.accepte_le);
ok((await double(LEA)).double?.ornements?.coeur === undefined, "pas encore ouvert : pas de cœur");
const ouvre = garder(await appel(LEA, "/api/direct/visites", { action: "decider", id: enAttente?.id, oui: true }));
ok(ouvre.statut === 200, "Léa l'ouvre et le garde");
const coeur = await lire(`${LEA.id}/coeur.json`);
ok(coeur?.prenom === "Sam" && coeur.sorte === "surprise" && !JSON.stringify(coeur).includes(SAM.id), "rangé : coeur.json (« Sam », une surprise ; jamais son compte)");
const o1 = (await double(LEA)).double?.ornements;
ok(o1?.coeur?.prenom === "Sam" && o1.coeur.sorte === "surprise", "son double : le cœur « offert par Sam »");
ok((await maison())?.double?.ornements?.coeur?.prenom === "Sam", "sa maison : le cœur");
const v1 = garder(await appel(SAM, `/api/direct/ma-piece?chez=${cleLea}`)).visite;
ok(v1?.maison?.double?.ornements?.coeur?.prenom === "Sam" && v1.maison.double.ornements.serie === 8 && v1.maison.double.ornements.accessoire?.sorte === "casque", "chez Léa, Sam la voit pareille : le cœur, la série, le casque");
ok((await filMoi())?.figurine?.ornements?.coeur?.prenom === "Sam", "le fil (« Toi ») : le cœur");

// ═══ HUGO : RIEN ═══
const dh = await double(HUGO);
ok(dh.statut === 200 && dh.double?.ornements === undefined, "Hugo : un jour aujourd'hui, deux la semaine dernière, sans passion — rien");

// ═══ AU SALON DE LA MUSIQUE ═══
ok(garder(await appel(LEA, "/api/direct/salons-ouverts", { action: "entrer", theme: "musique" })).statut === 200, "Léa entre au salon de la musique");
const e2 = garder(await appel(HUGO, "/api/direct/salons-ouverts", { action: "entrer", theme: "musique" }));
const elle = e2.ouverture?.presents?.find((p) => p.prenom === "Léa");
ok(elle?.ornements?.accessoire?.sorte === "casque" && elle.ornements.coeur?.prenom === "Sam" && elle.ornements.serie === 8, "Hugo l'y voit avec son casque, son cœur, sa série");
ok(!JSON.stringify(e2).includes(LEA.id) && !JSON.stringify(e2).includes(SAM.id), "… jamais un compte");
ok((await double(HUGO)).double?.ornements?.accessoire?.sorte === "casque", "… et Hugo, qui vient d'y entrer : le casque (sa passion du moment)");

// ═══ SAM : UN JOUR, LE FOOT ═══
const os = (await double(SAM)).double?.ornements;
ok(os?.serie === 1 && os.accessoire?.theme === "foot" && os.accessoire.sorte === "echarpe", `Sam : un seul jour (pas de flamme à l'écran), sa passion déclarée, le foot — l'écharpe ; le salon d'il y a quarante jours ne compte plus (${os?.accessoire?.theme})`);

// ═══ UN CŒUR DE PLUS DE QUINZE JOURS ; UN JOUR MANQUÉ ═══
await json(`${LEA.id}/coeur.json`, { prenom: "Sam", sorte: "surprise", le: new Date(Date.now() - 16 * JOUR).toISOString() });
await json(`${LEA.id}/presence.json`, { jours: [jour, ...[3, 4, 5].map((n) => jourDe(Date.now() - n * JOUR))] });
const o2 = (await double(LEA)).double?.ornements;
ok(!o2?.coeur, "seize jours après : le cœur s'en va");
ok(o2?.serie === 1, `un jour manqué (hier) : la série repart (${o2?.serie})`);

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nelle change toute seule ✓");
process.exit(echecs ? 1 : 0);
