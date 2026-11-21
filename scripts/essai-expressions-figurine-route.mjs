// 📷 LES CINQ EXPRESSIONS DE CHAQUE FIGURINE (le lot V1 ; `docs/univers/decouvrir.md`, section 28.6) — par les routes,
// contre le faux Supabase et le faux moteur d'image, jamais la vraie base (`lib/direct/expressions-figurine-serveur.ts`,
// `GET /api/direct/ma-figurine`, `/api/cron/expressions-figurines`, `/api/admin/direct/expressions-habitants`).
//
// Léa et Zoé ont leur figurine assise du nouveau style ; Max n'a que sa figurine d'aujourd'hui. Léa ouvre l'appli : après
// la réponse, ses calques, son corps sans sa tête, puis ses cinq expressions (la tête seulement, découpée de la taille de
// sa tête habituelle, recalée : le faux moteur décale le cadrage de trois points et deux), rangés à côté de ses calques et
// publiés à adresse stable. Rouverte : rien n'est refait. Une tête perdue : redécoupée sans le moteur. Une nouvelle image
// de sa figurine : de nouvelles expressions. Zoé, un passage raté il y a dix minutes : rien avant la demi-heure, même en
// ouvrant l'appli ; il y a une heure : la nuit la rattrape (Max et Léa, rien à faire). La page de l'administrateur : les
// comptes et les dernières, « Rattraper maintenant » ; sans session d'administrateur, refusé.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-expressions-figurine-route.mjs
import crypto from "node:crypto";
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const octets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
};
const lire = async (chemin) => {
  const b = await octets(chemin);
  try {
    return b ? JSON.parse(b.toString()) : null;
  } catch {
    return null;
  }
};
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const effacer = (chemins) => fetch(`${STOCK}/figurines-clients`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefixes: chemins }) });
const expressionsIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string" && c.startsWith("IMAGE ") && c.includes("The head keeps EXACTLY the same position"));
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
async function attendre(f, ms = 30000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const v = await f().catch(() => null);
    if (v) return v;
    await pause(400);
  }
  return null;
}

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const qui = (n, prenom) => ({ id: `e5e5e5e5-0000-4000-8000-0000000e51${String(n).padStart(2, "0")}`, jeton: `jeton-expressions-figurine-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const MAX = qui(3, "Max");
const GENS = [LEA, ZOE, MAX];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);

// (sa figurine assise : 800 × 1 200, transparente — la tête (260 de large, de 310 à 550), le cou, le corps et le fauteuil)
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
            <ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/>
            <rect x="370" y="540" width="60" height="40" fill="${couleur}"/>
            <rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/>
          </svg>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
const fiche = (h, v) => ({ version: v, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v${v}/assise.png` } }, historique: [{ version: v, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
const poserFiche = async (x, v, couleur) => {
  await deposer(`${x.id}/perso/v${v}/assise.png`, await assise(couleur), "image/png");
  await json(`${x.id}/perso/v${v}/fiche.json`, fiche(x.id, v));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id, v));
};
await poserFiche(LEA, 1, "#c8643c");
await poserFiche(ZOE, 1, "#3c8cc8");
const ouvrirAppli = (x) => fetch(`${BASE}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${x.jeton}` } });
const ADRESSE = /^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/;
const CINQ = ["sourire", "rire", "surprise", "bof", "grimace"];
const etatDe = (x, k) => lire(`${x.id}/calques/${k}-expressions.json`);

// ═══ LÉA OUVRE L'APPLI : SES CINQ EXPRESSIONS, APRÈS LA RÉPONSE ═══
const K1 = empreinte(`${LEA.id}/perso/v1/assise.png`);
const avant = (await expressionsIA()).length;
ok((await ouvrirAppli(LEA)).status === 200, "Léa ouvre l'appli");
const e1 = await attendre(async () => {
  const e = await etatDe(LEA, K1);
  return e?.le ? e : null;
}, 60000);
ok(e1?.empreinte === K1 && CINQ.every((e) => ADRESSE.test(e1.tetes?.[e] ?? "")) && ADRESSE.test(e1.corpsSansTete ?? "") && !e1.rate, `après la réponse : ses cinq expressions et son corps sans sa tête, à adresse stable (${JSON.stringify(e1?.tetes ?? null)})`);
const faites = (await expressionsIA()).slice(avant);
ok(faites.length === 5 && ["SMILE", "LAUGHTER", "SURPRISE", "UNIMPRESSED", "GRIMACE"].every((m) => faites.some((c) => c.includes(m))) && faites.every((c) => c.includes(" high ")), `cinq demandes au moteur, une par expression, d'après sa figurine (fidélité haute) (${faites.length})`);
const noms = await lister(`${LEA.id}/calques`);
ok(
  CINQ.every((e) => noms.includes(`${K1}-expression-${e}.png`) && noms.includes(`${K1}-tete-${e}.png`)) && noms.includes(`${K1}-corps-sans-tete.png`) && noms.includes(`${K1}.json`),
  `rangées à côté de ses calques : chaque expression entière, sa tête, le corps sans sa tête (${noms.length} fichiers)`,
);
const [tete, rire] = await Promise.all([octets(`${LEA.id}/calques/${K1}-tete.png`), octets(`${LEA.id}/calques/${K1}-tete-rire.png`)]);
const [mt, mr] = await Promise.all([tete ? sharp(tete).metadata() : {}, rire ? sharp(rire).metadata() : {}]);
ok(mt.width && mt.width === mr.width && mt.height === mr.height, `la tête du rire, de la taille de sa tête habituelle (${mr.width} × ${mr.height})`);
// (le corps sans sa tête : le milieu de la tête effacé, le fauteuil gardé)
const calques = await lire(`${LEA.id}/calques/${K1}.json`);
const sansTete = await octets(`${LEA.id}/calques/${K1}-corps-sans-tete.png`);
if (sansTete && calques?.tete?.boite) {
  const { data, info } = await sharp(sansTete).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = (fx, fy) => data[(Math.min(info.height - 1, Math.round(fy * info.height)) * info.width + Math.min(info.width - 1, Math.round(fx * info.width))) * 4 + 3];
  const [tx, ty, tw, th] = calques.tete.boite;
  ok(a(tx + tw / 2, ty + th * 0.4) === 0 && a(0.5, 0.9) > 200, "le corps sans sa tête : le visage effacé, le fauteuil gardé");
} else ok(false, "le corps sans sa tête et ses calques sont là");

// ═══ ROUVERTE : RIEN N'EST REFAIT ═══
const n1 = (await expressionsIA()).length;
await ouvrirAppli(LEA);
await pause(2500);
ok((await expressionsIA()).length === n1 && (await etatDe(LEA, K1))?.le === e1?.le, "rouverte : rien n'est refait");

// ═══ UNE TÊTE PERDUE : REDÉCOUPÉE SANS LE MOTEUR ═══
const sansRire = Object.fromEntries(Object.entries(e1?.tetes ?? {}).filter(([e]) => e !== "rire"));
await json(`${LEA.id}/calques/${K1}-expressions.json`, { ...e1, tetes: sansRire, le: undefined });
await effacer([`${LEA.id}/calques/${K1}-tete-rire.png`]);
await ouvrirAppli(LEA);
const e2 = await attendre(async () => {
  const e = await etatDe(LEA, K1);
  return e?.le && e.tetes?.rire ? e : null;
});
ok(Boolean(e2) && (await expressionsIA()).length === n1 && Boolean(await octets(`${LEA.id}/calques/${K1}-tete-rire.png`)), "sa tête du rire perdue : redécoupée dans l'expression entière, sans repasser par le moteur");

// ═══ UNE NOUVELLE IMAGE DE SA FIGURINE : DE NOUVELLES EXPRESSIONS ═══
await poserFiche(LEA, 2, "#d07a50");
const K2 = empreinte(`${LEA.id}/perso/v2/assise.png`);
await ouvrirAppli(LEA);
const e3 = await attendre(async () => {
  const e = await etatDe(LEA, K2);
  return e?.le ? e : null;
}, 60000);
const noms2 = await lister(`${LEA.id}/calques`);
ok(
  e3?.empreinte === K2 && CINQ.every((e) => ADRESSE.test(e3.tetes?.[e] ?? "") && noms2.includes(`${K2}-tete-${e}.png`)) && noms2.includes(`${K2}.json`) && (await expressionsIA()).length === n1 + 5,
  "une nouvelle image (une nouvelle tenue) : ses calques et ses cinq expressions se refont (cinq nouvelles demandes au moteur)",
);
ok(Boolean(await etatDe(LEA, K1)), "… celles d'avant restent rangées");

// ═══ ZOÉ : UN PASSAGE RATÉ, REPRIS UNE DEMI-HEURE PLUS TARD ═══
const KZ = empreinte(`${ZOE.id}/perso/v1/assise.png`);
await json(`${ZOE.id}/calques/${KZ}-expressions.json`, { empreinte: KZ, tetes: {}, rate: new Date(Date.now() - 10 * 60_000).toISOString(), erreur: "Le moteur ne répond pas." });
const n2 = (await expressionsIA()).length;
await ouvrirAppli(ZOE);
await pause(2500);
ok((await expressionsIA()).length === n2 && !(await etatDe(ZOE, KZ))?.le, "un passage raté il y a dix minutes : rien ne repart avant la demi-heure, même en ouvrant l'appli");
const refus = await fetch(`${BASE}/api/admin/direct/expressions-habitants`);
ok(refus.status === 403, "la page des expressions : l'administrateur seulement");
const a1 = await (await fetch(`${BASE}/api/admin/direct/expressions-habitants`, { headers: { cookie: COOKIE_ADMIN } })).json();
ok(a1.etat?.total >= 2 && a1.etat.pretes >= 1 && a1.etat.ratees >= 1 && a1.etat.dernieres?.some((x) => x.prenom === "Léa" && CINQ.every((e) => ADRESSE.test(x.tetes?.[e] ?? ""))), `la page de l'administrateur : les comptes (${a1.etat?.pretes} sur ${a1.etat?.total}, ${a1.etat?.ratees} en reprise) et ses cinq têtes`);
ok(a1.etat?.dernieres?.some((x) => x.prenom === "Zoé" && x.erreur === "Le moteur ne répond pas."), "… et ce qui a raté");

// ═══ LA NUIT ═══
await json(`${ZOE.id}/calques/${KZ}-expressions.json`, { empreinte: KZ, tetes: {}, rate: new Date(Date.now() - 60 * 60_000).toISOString(), erreur: "Le moteur ne répond pas." });
const nuit = await (await fetch(`${BASE}/api/cron/expressions-figurines`)).json();
const ez = await etatDe(ZOE, KZ);
ok(nuit.ok && nuit.rattrapees >= 1 && ez?.le && CINQ.every((e) => ADRESSE.test(ez.tetes?.[e] ?? "")) && !ez.rate && !ez.erreur, `la nuit : Zoé rattrapée, une heure après son passage raté (${JSON.stringify(nuit)})`);
ok(!(await lister(`${MAX.id}/calques`)).length, "Max (sa figurine d'aujourd'hui seulement) : rien à faire");
const a2 = await (await fetch(`${BASE}/api/admin/direct/expressions-habitants`, { method: "POST", headers: { "content-type": "application/json", cookie: COOKIE_ADMIN }, body: JSON.stringify({ action: "rattraper" }) })).json();
ok(a2.rattrapage?.rattrapees === 0 && a2.etat?.pretes >= 2 && a2.etat.ratees === 0, `« Rattraper maintenant » : plus rien à rattraper (${JSON.stringify(a2.rattrapage ?? null)})`);
ok(!/exemple/i.test(JSON.stringify([a1, a2, nuit])), "jamais le mot « exemple »");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles expressions de chaque figurine tiennent ✓");
process.exit(echecs ? 1 : 0);
