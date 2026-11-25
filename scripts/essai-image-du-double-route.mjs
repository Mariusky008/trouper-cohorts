// 📸 « MA FIGURINE DU JOUR », L'IMAGE À PARTAGER (le chantier « Ma figurine », lot 3 ; la route
// `/api/direct/mon-double/image`, `image-du-double-serveur.ts` ; `docs/univers/ma-figurine.md`, section 5), PAR LA ROUTE —
// contre le faux Supabase et le faux moteur d'image (jamais la vraie base).
//
// Sans compte : 401. Zoé n'a pas de figurine : 404 et une phrase (jamais une image vide). Léa : une image PNG de
// 1080 × 1350, la même à chaque fois ; sa tête du jour la change (le rire n'est pas la tristesse) ; sa pancarte s'y voit
// (la planchette crème) ; sa série de sept jours : l'auréole dorée et « 7 jours de suite » ; son souvenir avec Sam : le
// cœur. Hugo, sans calques (l'ancienne figurine d'une seule image) : son image aussi. Jamais le mot « exemple ».
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


const qui = (n, prenom) => ({ id: `1d0b1e00-0000-4000-8000-0000001d10${String(n).padStart(2, "0")}`, jeton: `jeton-image-double-route-${String(n).padStart(2, "0")}`, prenom });
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
const ZOE = qui(4, "Zoé");
await semer("human_habitants", [{ id: ZOE.id, device_token: ZOE.jeton, prenom: ZOE.prenom, ville_slug: "dax" }]);
await fetch(`${BASE}/api/cron/decouvrir-selection`).catch(() => null);

const appel = async (x, chemin, corps) => {
  const cookie = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const tous = [];
const image = async (x) => {
  const r = await fetch(`${BASE}/api/direct/mon-double/image`, { headers: x ? { cookie: `clikme_habitant=${x.jeton}` } : {} });
  if (!r.headers.get("content-type")?.startsWith("image/")) return { statut: r.status, type: r.headers.get("content-type"), json: (tous.push(await r.clone().json().catch(() => ({}))), tous.at(-1)) };
  return { statut: r.status, type: r.headers.get("content-type"), cache: r.headers.get("cache-control"), octets: Buffer.from(await r.arrayBuffer()) };
};
/** Combien de points de l'image ont cette couleur (à `tol` près), dans le rectangle [x, y, l, h] (toute l'image sinon). */
async function points(png, [r0, g0, b0], tol = 14, zone = null) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [x0, y0, l, h] = zone ?? [0, 0, info.width, info.height];
  let n = 0;
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + l; x++) {
      const i = (y * info.width + x) * 3;
      if (Math.abs(data[i] - r0) <= tol && Math.abs(data[i + 1] - g0) <= tol && Math.abs(data[i + 2] - b0) <= tol) n++;
    }
  return n;
}
const CREME = [255, 244, 230];
const AUREOLE = [255, 211, 110];
const AMBRE = [245, 162, 58];
const ROSE = [255, 46, 154];
const jourDe = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(ms));
const JOUR = 86_400_000;

// ═══ SANS COMPTE ; SANS FIGURINE ═══
const s0 = await image(null);
ok(s0.statut === 401 && !s0.octets, "sans compte : 401, pas d'image");
const z0 = await image(ZOE);
ok(z0.statut === 404 && !z0.octets && /pas encore prête/.test(z0.json?.error ?? ""), `Zoé, sans figurine : 404 et une phrase (${z0.statut})`);

// ═══ LÉA : SES SEPT EXPRESSIONS ═══
await appel(LEA, "/api/direct/ma-figurine");
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le && e.tetes?.triste && e.tetes?.rire ? e : null;
});
ok(Boolean(etat), "Léa a ses sept expressions");
await json(`${LEA.id}/presence.json`, { jours: [] });

const a = await image(LEA);
ok(a.statut === 200 && a.type === "image/png" && /no-store/.test(a.cache ?? ""), `son image : un PNG, jamais gardé en cache (${a.statut} ${a.type})`);
const m = a.octets ? await sharp(a.octets).metadata() : {};
ok(m.width === 1080 && m.height === 1350, `1080 × 1350 (${m.width} × ${m.height})`);
const a2 = await image(LEA);
ok(a2.octets && a.octets && a2.octets.equals(a.octets), "la même image à chaque fois (rien de tiré au hasard)");
ok((await points(a.octets, AUREOLE, 10)) < 50 && (await points(a.octets, AMBRE, 10)) < 50, "pas de série : ni auréole, ni « jours de suite »");

// ═══ SA TÊTE DU JOUR ═══
// (le faux moteur fait sept têtes pareilles — un seul fichier : sa tête du rire, ici, devient un fichier à elle, tout
// vert — on la reconnaît)
const VERT = [32, 192, 64];
const nomVert = `${crypto.createHash("md5").update("tete-verte-image-du-double").digest("hex")}-300.webp`;
await deposer(`salon/fichiers/${nomVert}`, await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: VERT[0], g: VERT[1], b: VERT[2], alpha: 1 } } }).webp({ lossless: true }).toBuffer(), "image/webp");
await json(`${LEA.id}/calques/${K}-expressions.json`, { ...etat, tetes: { ...etat.tetes, rire: `/api/direct/salon/fichier/${nomVert}` } });
ok((await points(a.octets, VERT, 8)) < 50, "sa tête de la tristesse : pas de vert");
await appel(LEA, "/api/direct/mon-double", { action: "tete", e: "rire" });
const b = await image(LEA);
ok(b.statut === 200 && (await points(b.octets, VERT, 8)) > 3000, `elle choisit le rire : sa tête du rire sur l'image (${b.octets ? await points(b.octets, VERT, 8) : 0} points verts)`);
await appel(LEA, "/api/direct/mon-double", { action: "tete", e: "humeur" });
const b2 = await image(LEA);
ok(b2.octets?.equals(a.octets) && (await points(b2.octets, VERT, 8)) < 50, "… revenue à son humeur : l’image de la tristesse revient");

// ═══ SA PANCARTE ═══
const cremeAvant = await points(a.octets, CREME, 6);
await appel(LEA, "/api/direct/mon-double", { action: "pancarte", texte: "Qui vient prendre un café ?" });
const c = await image(LEA);
const cremeApres = await points(c.octets, CREME, 6);
ok(cremeApres - cremeAvant > 15000, `sa pancarte s'y voit : la planchette crème (${cremeAvant} → ${cremeApres} points)`);
// (au-dessus de sa tête : la moitié haute de l'image, sous le titre)
ok((await points(c.octets, CREME, 6, [140, 260, 800, 500])) > 15000, "… au-dessus de sa tête");

// ═══ CE QU'ELLE PORTE TOUTE SEULE ═══
await json(`${LEA.id}/presence.json`, { jours: [6, 5, 4, 3, 2, 1, 0].map((n) => jourDe(Date.now() - n * JOUR)) });
const d = await image(LEA);
ok((await points(d.octets, AUREOLE, 10)) > 300, "sept jours de suite : l'auréole dorée");
ok((await points(d.octets, AMBRE, 10)) > 5000, "… et « 7 jours de suite », sous elle");
const roseAvant = await points(d.octets, ROSE, 10);
await json(`${LEA.id}/coeur.json`, { prenom: "Sam", sorte: "surprise", le: new Date().toISOString() });
const e = await image(LEA);
ok((await points(e.octets, ROSE, 10)) - roseAvant > 400, "son souvenir avec Sam : le cœur");
await json(`${LEA.id}/coeur.json`, { prenom: "Sam", sorte: "surprise", le: new Date(Date.now() - 16 * JOUR).toISOString() });
ok((await image(LEA)).octets?.equals(d.octets), "… un souvenir de plus de quinze jours : plus de cœur");

// ═══ HUGO : L'ANCIENNE FIGURINE, D'UNE SEULE IMAGE ═══
const h = await image(HUGO);
const mh = h.octets ? await sharp(h.octets).metadata() : {};
ok(h.statut === 200 && mh.width === 1080 && mh.height === 1350, `Hugo, sans calques : son image aussi (${h.statut})`);

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nl'image de mon double du jour tient ✓");
process.exit(echecs ? 1 : 0);
