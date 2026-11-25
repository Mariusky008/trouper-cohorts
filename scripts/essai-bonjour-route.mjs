// 🎙️ « MON BONJOUR », AVEC SA VOIX (le chantier « Ma figurine », lot 4 ; `lib/direct/bonjour.ts`, `bonjour-serveur.ts`,
// la route `/api/direct/bonjour/<clé>` ; `docs/univers/ma-figurine.md`, section 6), PAR LES ROUTES — contre le faux
// Supabase (jamais la vraie base).
//
// Sans compte : rien ne s'écrit, rien ne s'entend. Léa garde son bonjour (sa voix, 2,4 s) : son double le dit, par sa clé
// (jamais son compte) ; un son illisible, trop court ou trop long : refusé. Sam l'entend (le son, et un morceau quand on
// le demande, comme l'iPhone) ; sans cookie : 401. Au salon du foot, dans le fil de Hugo (le salon où elle est), Autour (sa
// figurine posée au bistrot) : son bonjour. Elle le refait : la nouvelle adresse, l'ancien son effacé. Elle l'enlève :
// plus rien, nulle part où on la touche de nouveau. Jamais le mot « exemple ».
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
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};


const qui = (n, prenom) => ({ id: `b0e70000-0000-4000-8000-0000005d10${String(n).padStart(2, "0")}`, jeton: `jeton-bonjour-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const HUGO = qui(3, "Hugo");
const GENS = [LEA, SAM, HUGO];
const BISTROT = "c-petit-bistrot-bonjour";
const maintenant = new Date().toISOString();
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-00000000b0e7", slug: "petit-bistrot-bonjour", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 }]);
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
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
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

const appel = async (x, chemin, corps) => {
  const cookie = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const tous = [];
const garder = (r) => (tous.push(r), r);
const son = async (x, src, entetes = {}) => {
  const r = await fetch(`${BASE}${src}`, { headers: { ...(x ? { cookie: `clikme_habitant=${x.jeton}` } : {}), ...entetes } });
  return { statut: r.status, type: r.headers.get("content-type") ?? "", plage: r.headers.get("content-range") ?? "", octets: Buffer.from(await r.arrayBuffer()) };
};
const VOIX = Buffer.concat([Buffer.from("1a45dfa39f4286810142f7810142f2810442f381084282847765626d", "hex"), crypto.randomBytes(4000)]);
const enData = (o, type = "audio/webm") => `data:${type};base64,${o.toString("base64")}`;
await fetch(`${BASE}/api/cron/decouvrir-selection`).catch(() => null);

// ═══ SANS COMPTE ═══
ok((await appel(null, "/api/direct/mon-double", { action: "bonjour", son: enData(VOIX), duree: 2 })).statut === 401, "sans compte : 401, rien ne s'écrit");
ok((await lire(`${LEA.id}/bonjour.json`)) === null, "… pas de bonjour rangé");

// ═══ LÉA GARDE SON BONJOUR ═══
const d0 = garder(await appel(LEA, "/api/direct/mon-double"));
ok(d0.statut === 200 && !d0.double?.bonjour, "avant : pas de bonjour");
ok((await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: "pas un son", duree: 2 })).statut === 400, "un son illisible : refusé");
ok((await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: enData(VOIX), duree: 0.3 })).statut === 400, "trop court : refusé");
ok((await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: enData(VOIX), duree: 9 })).statut === 400, "trop long (plus de cinq secondes) : refusé");
ok((await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: enData(VOIX, "text/plain"), duree: 2 })).statut === 400, "pas un son (du texte) : refusé");
const d1 = garder(await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: enData(VOIX), duree: 2.4 }));
const src1 = d1.double?.bonjour?.src ?? "";
ok(d1.statut === 200 && src1.startsWith(`/api/direct/bonjour/${cleProfil(LEA.id)}?v=`) && d1.double.bonjour.duree === 2.4, `elle le garde : son double le dit (${src1}, ${d1.double?.bonjour?.duree} s)`);
ok(!JSON.stringify(d1).includes(LEA.id), "… jamais son compte");
const rangé = await lire(`${LEA.id}/bonjour.json`);
ok(rangé?.chemin?.startsWith(`${LEA.id}/bonjour/`) && rangé.type === "audio/webm", "rangé : bonjour.json et son son");

// ═══ SAM L'ENTEND ═══
const s1 = await son(SAM, src1);
ok(s1.statut === 200 && s1.type === "audio/webm" && s1.octets.equals(VOIX), `Sam l'entend : sa voix, telle quelle (${s1.statut}, ${s1.octets.length} octets)`);
const s2 = await son(SAM, src1, { range: "bytes=0-9" });
ok(s2.statut === 206 && s2.octets.length === 10 && s2.plage === `bytes 0-9/${VOIX.length}` && s2.octets.equals(VOIX.subarray(0, 10)), `… un morceau, comme l'iPhone le demande (${s2.statut} ${s2.plage})`);
ok((await son(null, src1)).statut === 401, "sans cookie : 401");
ok((await son(SAM, `/api/direct/bonjour/${cleProfil(HUGO.id)}`)).statut === 404, "Hugo n'en a pas : 404");
ok((await son(SAM, "/api/direct/bonjour/pas-une-cle")).statut === 404, "une clé qui n'existe pas : 404");

// ═══ AU SALON DU FOOT ═══
ok(garder(await appel(LEA, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" })).statut === 200, "Léa entre au salon du foot");
const e2 = garder(await appel(SAM, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" }));
const elle = e2.ouverture?.presents?.find((p) => p.prenom === "Léa");
ok(elle?.bonjour === src1, "Sam y entre : la figurine de Léa a son bonjour");
ok(!e2.ouverture?.presents?.find((p) => p.prenom === "Sam")?.bonjour, "… lui, pas encore");

// ═══ DANS LE FIL DE HUGO ═══
const fil = garder(await appel(HUGO, "/api/direct/fil-decouvrir")).fil;
const salonFoot = (fil?.pieces ?? []).find((p) => p.sorte === "salon" && p.theme === "foot");
ok(salonFoot?.presents?.find((p) => p.prenom === "Léa")?.bonjour === src1, `le fil de Hugo : le salon du foot, Léa et son bonjour (${salonFoot ? "le salon est là" : "pas de salon"})`);

// ═══ AUTOUR ═══
ok(garder(await appel(LEA, "/api/direct/autour", { action: "poser", lieu: BISTROT, mot: "Ce soir, je suis là", tete: "humeur", qui: "tous" })).statut === 200, "elle pose sa figurine au Petit Bistrot");
const posees = garder(await appel(SAM, `/api/direct/autour?figurines=1&lieu=${BISTROT}`)).figurines ?? [];
ok(posees.find((f) => f.prenom === "Léa")?.bonjour === src1, "Autour : sa figurine posée a son bonjour");

// ═══ ELLE LE REFAIT ═══
await pause(20);
const VOIX2 = Buffer.concat([Buffer.from("1a45dfa3", "hex"), crypto.randomBytes(3000)]);
const d2 = garder(await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: enData(VOIX2), duree: 1.8 }));
const src2 = d2.double?.bonjour?.src ?? "";
ok(src2 && src2 !== src1 && d2.double.bonjour.duree === 1.8, "elle le refait : une nouvelle adresse");
ok((await son(SAM, src2)).octets.equals(VOIX2), "… on entend le nouveau");
const ancien = await fetch(`${STOCK}/figurines-clients/${rangé?.chemin}`);
ok(!ancien.ok, "… l'ancien son est effacé");

// ═══ ELLE L'ENLÈVE ═══
const d3 = garder(await appel(LEA, "/api/direct/mon-double", { action: "bonjour", son: "" }));
ok(d3.statut === 200 && !d3.double?.bonjour, "elle l'enlève : plus de bonjour");
ok((await son(SAM, src2)).statut === 404, "… plus rien à entendre");
const posees2 = garder(await appel(SAM, `/api/direct/autour?figurines=1&lieu=${BISTROT}`)).figurines ?? [];
ok(posees2.some((f) => f.prenom === "Léa") && !posees2.find((f) => f.prenom === "Léa")?.bonjour, "… Autour, sa figurine est muette");

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nle bonjour, avec sa voix, tient ✓");
process.exit(echecs ? 1 : 0);
