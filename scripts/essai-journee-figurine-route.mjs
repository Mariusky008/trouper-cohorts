// 👀 « PENDANT TON ABSENCE », SA FIGURINE RACONTE SA JOURNÉE (le chantier « Ma figurine », lot 2 ;
// `lib/direct/journee-figurine.ts`, `journee-figurine-serveur.ts` ; `docs/univers/ma-figurine.md`, section 4), PAR LES
// ROUTES — contre le faux Supabase (jamais la vraie base).
//
// Le propriétaire : « qui m'a fait coucou, qui est passé chez moi, combien m'ont vue dans les salons. Des prénoms, des
// vrais chiffres, jamais inventés. » Léa : d'abord rien (et ce qu'il restait d'hier ne compte plus). Hugo lui a fait
// coucou aujourd'hui (Zoé, hier : ne compte pas) ; Sam, son proche, est passé chez elle. Au salon du foot : Léa entre,
// puis Hugo, puis Zoé — chacun voit ceux qui sont là, et ils le voient ; Léa ressort et rerentre : personne ne compte
// deux fois. Sa maison le dit : « Hugo », « Sam », 2 personnes (Zoé, Hugo). Jamais un compte, jamais le mot « exemple ».
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
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (« Ma maison » n'est encore ouverte qu'à l'administrateur, ici : Léa l'est, comme dans les autres essais de sa maison)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);

const qui = (n, prenom) => ({ id: `10e10e00-0000-4000-8000-0000000a10${String(n).padStart(2, "0")}`, jeton: `jeton-journee-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const HUGO = qui(3, "Hugo");
const ZOE = qui(4, "Zoé");
const GENS = [LEA, SAM, HUGO, ZOE];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/><rect x="370" y="540" width="60" height="40" fill="${couleur}"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/></svg>`), left: 0, top: 0 }])
    .png()
    .toBuffer();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [x, c] of GENS.map((g, k) => [g, ["#c8643c", "#3c8cc8", "#8cc83c", "#c83c8c"][k]])) {
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
const maison = async () => garder(await appel(LEA, "/api/direct/ma-piece", null, true)).maison;

const JOUR = 86_400_000;
const hier = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() - JOUR));
const ilYa = (ms) => new Date(Date.now() - ms).toISOString();
const cleLea = cleProfil(LEA.id);
const journee = async () => (await maison())?.journee;

// ═══ D'ABORD, RIEN (CE QU'IL RESTAIT D'HIER NE COMPTE PLUS) ═══
await json(`${LEA.id}/ma-journee.json`, { jour: hier, salons: { a: "Paul", b: "Nina", c: "Tom" } });
await json(`${LEA.id}/monde/coucous.json`, { liste: [{ id: "c-zoe", de: ZOE.id, le: ilYa(30 * 3600_000) }] });
const j0 = await journee();
ok(j0 && j0.coucous.length === 0 && j0.visites.length === 0 && j0.salons.n === 0 && j0.salons.prenoms.length === 0, `d'abord, rien : aucun coucou, aucune visite, personne dans les salons (le coucou d'hier et les salons d'hier ne comptent pas) — ${JSON.stringify(j0)}`);

// ═══ UN COUCOU, UNE VISITE ═══
await json(`${LEA.id}/monde/coucous.json`, { liste: [{ id: "c-zoe", de: ZOE.id, le: ilYa(30 * 3600_000) }, { id: "c-hugo", de: HUGO.id, le: ilYa(600_000) }, { id: "c-hugo2", de: HUGO.id, le: ilYa(300_000) }] });
await appel(SAM, `/api/direct/ma-piece?chez=${cleLea}`);
const toc = garder(await appel(SAM, "/api/direct/visites", { action: "frapper", cle: cleLea }));
ok(toc.statut === 200, `Sam, son proche, frappe chez elle (${toc.statut})`);
const j1 = await journee();
ok(JSON.stringify(j1?.coucous) === JSON.stringify(["Hugo"]), `👋 « Hugo m'a fait coucou » (une fois, même s'il en a fait deux) — ${JSON.stringify(j1?.coucous)}`);
ok(JSON.stringify(j1?.visites) === JSON.stringify(["Sam"]), `🚪 « Visite de Sam chez toi » — ${JSON.stringify(j1?.visites)}`);

// ═══ AU SALON DU FOOT ═══
const entrer = async (x) => garder(await appel(x, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" }));
ok((await entrer(LEA)).statut === 200, "Léa entre au salon du foot (personne)");
ok((await lire(`${LEA.id}/ma-journee.json`))?.jour === hier, "… seule : rien de noté pour elle");
const eh = await entrer(HUGO);
ok(eh.statut === 200 && eh.ouverture?.presents?.some((p) => p.prenom === "Léa"), "Hugo entre : Léa y est");
const ez = await entrer(ZOE);
ok(ez.statut === 200 && ez.ouverture?.presents?.length === 3, "Zoé entre : ils sont trois");
await entrer(LEA);
const fl = await lire(`${LEA.id}/ma-journee.json`);
ok(fl?.jour !== hier && Object.keys(fl?.salons ?? {}).length === 2 && !JSON.stringify(fl).includes(HUGO.id) && !JSON.stringify(fl).includes(ZOE.id), `rangé : ma-journee.json, aujourd'hui, deux personnes (jamais leur compte) — ${JSON.stringify(fl)}`);
const j2 = await journee();
ok(j2?.salons?.n === 2 && j2.salons.prenoms.includes("Hugo") && j2.salons.prenoms.includes("Zoé"), `👀 « 2 personnes m'ont vue dans les salons » : Hugo et Zoé (Léa est rentrée deux fois : personne ne compte deux fois) — ${JSON.stringify(j2?.salons)}`);
for (const [x, autres] of [
  [HUGO, ["Léa", "Zoé"]],
  [ZOE, ["Léa", "Hugo"]],
]) {
  const f = await lire(`${x.id}/ma-journee.json`);
  const vus = Object.values(f?.salons ?? {}).sort();
  ok(JSON.stringify(vus) === JSON.stringify([...autres].sort()), `${x.prenom} : vu(e) par ${autres.join(" et ")} (${vus.join(", ")})`);
}
const brut = JSON.stringify(await maison());
ok(![SAM, HUGO, ZOE].some((x) => brut.includes(x.id)), "sa maison ne montre jamais un compte");

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nsa journée, racontée ✓");
process.exit(echecs ? 1 : 0);
