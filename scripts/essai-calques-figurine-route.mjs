// 🎭 LES CALQUES DE CHAQUE FIGURINE, FAITS UNE FOIS, ET LEUR POSE (`docs/univers/salon-du-duo.md`, sections 11.7 et 12 ;
// `ma-maison.md`, section 4 ; le lot S1) — par les routes, contre le faux Supabase, jamais la vraie base
// (`lib/direct/calques-figurine-serveur.ts`, `figurine-calques.ts`, `POST /api/direct/salon { action: "calques" }`,
// `GET /api/direct/proches?ouvrir=`).
//
// Léa et Sam ont leur figurine assise dans son fauteuil (le nouveau style) : une grosse tête, un cou étroit, le corps et
// le fauteuil plus larges — et, sur le côté, une traînée laissée par le détourage. Max n'a que sa figurine d'aujourd'hui.
// Sans session : 403 ; Max : 404. Léa : ses calques — la traînée écartée (la plus grande silhouette seule), la tête dans
// la largeur du crâne jusqu'au cou, le pivot au milieu du cou, la bouche et les joues dans la tête ; estimés par la
// silhouette (le modèle qui voit n'est pas branché ici) ; publiés une fois à adresse stable (WebP). Redemandés : les
// mêmes, rien n'est refait. Une conversation ouverte avant les calques de Sam : la scène sans calques, et ceux de Sam
// se découpent juste après la réponse ; rouverte : les deux figurines posées aux deux places, à la même taille, la
// mienne à gauche. Une nouvelle tenue : de nouveaux calques.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-calques-figurine-route.mjs
import crypto from "node:crypto";
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const octets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `ca1c0e50-0000-4000-8000-0000000c41${String(n).padStart(2, "0")}`, jeton: `jeton-calques-figurine-000${String(n).padStart(2, "0")}`, prenom });
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

// (sa figurine assise : 1 600 × 2 400, transparente ; la figurine dans une boîte de 640 × 1 180 qui commence à (480, 620) —
// la tête (520 de large, de 620 à 1 100), le cou (120 de large), le corps et le fauteuil (640 de large, de 1 140 à 1 800) ;
// une traînée à part, en bas à gauche)
const assise = (couleur) =>
  sharp({ create: { width: 1600, height: 2400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2400">
            <ellipse cx="800" cy="860" rx="260" ry="240" fill="${couleur}"/>
            <rect x="740" y="1080" width="120" height="80" fill="${couleur}"/>
            <rect x="480" y="1140" width="640" height="660" rx="60" fill="#5a3a2a"/>
            <circle cx="120" cy="2200" r="50" fill="${couleur}"/>
          </svg>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
const fiche = (h, v) => ({ version: v, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v${v}/assise.png` } }, historique: [{ version: v, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(x === LEA ? "#c8643c" : "#3c8cc8"), "image/png");
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id, 1));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id, 1));
}

const poster = (q, corps) => fetch(`${BASE}/api/direct/salon`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
const calques = async (q) => {
  const r = await poster(q, { action: "calques" });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const ouvrir = async (q, cle) => {
  const r = await fetch(`${BASE}/api/direct/proches?ouvrir=${cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};
const ADRESSE = /^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/;
const dans = ([x, y], [bx, by, bw, bh], marge = 0.001) => x >= bx - marge && x <= bx + bw + marge && y >= by - marge && y <= by + bh + marge;

// ═══ QUI ═══
ok((await calques(null)).statut === 403, "sans session : refusé");
const m = await calques(MAX);
ok(m.statut === 404 && /pas encore faite/.test(m.corps?.error ?? ""), `Max (sa figurine d'aujourd'hui seulement) : rien à découper (${m.statut})`);

// ═══ LES CALQUES DE LÉA ═══
let r = await calques(LEA);
const c = r.corps?.calques;
ok(r.statut === 200 && c?.par === "estime", `Léa : ses calques, estimés par la silhouette (${r.statut}, ${c?.par})`);
// (la boîte du corps : la figurine seule, 640 × 1 180 — avec la traînée, elle ferait toute la largeur de l'image)
ok(Math.abs((c?.ratio ?? 0) - 640 / 1180) < 0.01, `la traînée écartée : la boîte du corps est la figurine seule (rapport ${c?.ratio}, attendu ${(640 / 1180).toFixed(3)})`);
ok(ADRESSE.test(c?.corps?.fichier ?? "") && ADRESSE.test(c?.tete?.fichier ?? "") && c.corps.fichier !== c.tete.fichier, `le corps et la tête à adresse stable (${c?.corps?.fichier}, ${c?.tete?.fichier})`);
ok(c && c.sources === undefined, "… sans ses chemins dans le seau");
const [tx, ty, tw, th] = c?.tete?.boite ?? [0, 0, 0, 0];
// (la tête : le crâne (520) un peu élargi, sur 640 ; du haut jusque sous le cou — 1 100 à 1 140 → 0,41 à 0,44)
ok(ty < 0.01 && Math.abs(tx - (60 - 0.06 * 520) / 640) < 0.03 && Math.abs(tw - (520 * 1.12) / 640) < 0.04, `la tête dans la largeur du crâne, sans les accoudoirs (${c?.tete?.boite})`);
ok(th > 0.38 && th < 0.52, `… jusqu'au cou (hauteur ${th})`);
const [px, py] = c?.tete?.pivot ?? [0, 0];
ok(Math.abs(px - 0.5) < 0.02 && py > 0.36 && py < 0.47, `le pivot au cou (${c?.tete?.pivot})`);
ok(c && dans(c.bouche, c.tete.boite) && c.joues.every((j) => dans(j, c.tete.boite)) && c.joues[0][0] < c.bouche[0] && c.bouche[0] < c.joues[1][0], `la bouche et les joues dans la tête, de gauche à droite (${JSON.stringify([c?.bouche, c?.joues])})`);

// ═══ LES FICHIERS ═══
const noms = (await lister(`${LEA.id}/calques`)).sort();
ok(noms.length === 3 && noms.some((n) => n.endsWith("-corps.png")) && noms.some((n) => n.endsWith("-tete.png")) && noms.some((n) => /^[0-9a-f]{16}\.json$/.test(n)), `rangés chez Léa : le corps, la tête, leurs repères (${noms})`);
const corpsPng = await octets(`${LEA.id}/calques/${noms.find((n) => n.endsWith("-corps.png"))}`);
const mc = corpsPng ? await sharp(corpsPng).metadata() : {};
ok(Math.abs((mc.width ?? 0) - 640) <= 2 && Math.abs((mc.height ?? 0) - 1180) <= 2 && mc.hasAlpha, `le corps recadré au plus près, transparent (${mc.width}×${mc.height})`);
const tetePng = await octets(`${LEA.id}/calques/${noms.find((n) => n.endsWith("-tete.png"))}`);
const mt = tetePng ? await sharp(tetePng).metadata() : {};
ok(Math.abs((mt.width ?? 0) - tw * 640) <= 2 && Math.abs((mt.height ?? 0) - th * 1180) <= 2, `la tête, à la taille de sa boîte (${mt.width}×${mt.height})`);
// (rien du fauteuil dans la tête : son coin en bas à gauche est transparent)
const { data: px0, info: it } = tetePng ? await sharp(tetePng).ensureAlpha().raw().toBuffer({ resolveWithObject: true }) : { data: Buffer.alloc(4), info: { width: 1, height: 1 } };
ok(px0[((it.height - 1) * it.width + 1) * 4 + 3] === 0, "la tête n'emporte rien du fauteuil");
const fc = await fetch(`${BASE}${c?.corps?.fichier}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } });
const wc = fc.ok ? await sharp(Buffer.from(await fc.arrayBuffer())).metadata() : {};
ok(fc.status === 200 && wc.format === "webp" && wc.width === 640 && wc.hasAlpha && /immutable/.test(fc.headers.get("cache-control") ?? ""), `servi en WebP transparent, gardé un an (${fc.status}, ${wc.width} de large)`);
const ft = await fetch(`${BASE}${c?.tete?.fichier}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
const wt = ft.ok ? Buffer.from(await ft.arrayBuffer()) : Buffer.alloc(0);
ok(ft.status === 200 && wt.length > 0 && wt.length < 80_000, `la tête aussi, petite (${wt.length} octets)`);

// ═══ REDEMANDÉS : LES MÊMES ═══
const avant = (await lister("salon/fichiers")).length;
r = await calques(LEA);
ok(r.statut === 200 && r.corps?.calques?.corps?.fichier === c?.corps?.fichier && JSON.stringify(r.corps.calques.tete) === JSON.stringify(c?.tete), "redemandés : les mêmes calques, aux mêmes adresses");
ok((await lister(`${LEA.id}/calques`)).length === 3 && (await lister("salon/fichiers")).length === avant, "… rien n'est refait");

// ═══ À L'OUVERTURE D'UNE CONVERSATION ═══
const piece = (rr, g, b) =>
  sharp({ create: { width: 1024, height: 1536, channels: 3, background: { r: rr, g, b } } })
    .png()
    .toBuffer();
await deposer("pieces-duo/salon/decor.png", await piece(120, 90, 140), "image/png");
for (const mo of ["matin", "nuit"]) await deposer(`pieces-duo/salon/lumiere-${mo}.png`, await piece(mo === "nuit" ? 20 : 200, 60, 90), "image/png");
// (deux places relevées par le modèle qui voit : des points d'assise)
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.7, y: 0.62, hauteur: 0.34 }, { x: 0.3, y: 0.6, hauteur: 0.3 }] } });
ok((await lister(`${SAM.id}/calques`)).length === 0, "Sam n'a pas encore ses calques");
r = await ouvrir(LEA, SAM.cle);
const sc0 = r.corps?.ouverture?.scene;
// (retours du 20 novembre 2026 : chacune la sienne — celle de Léa est prête, elle est posée ; celle de Sam viendra)
ok(r.statut === 200 && sc0?.plaque && sc0.calques?.a?.corps?.fichier === c?.corps?.fichier && sc0.calques.b === undefined, `Léa ouvre sa conversation avec Sam : la pièce et sa figurine à elle, pas encore celle de Sam (${r.statut})`);
let n = 0;
for (let i = 0; i < 40 && n < 3; i++) {
  await pause(250);
  n = (await lister(`${SAM.id}/calques`)).length;
}
ok(n === 3, `… les calques de Sam se découpent juste après la réponse (${n} fichiers)`);
r = await ouvrir(LEA, SAM.cle);
const sc = r.corps?.ouverture?.scene;
const a = sc?.calques?.a;
const b = sc?.calques?.b;
ok(a?.corps?.fichier === c?.corps?.fichier && b?.corps?.fichier && b.corps.fichier !== a.corps.fichier, "rouverte : les deux figurines — la mienne à gauche (`a`), celle de Sam à droite (`b`)");
// (à la même taille : la hauteur du duo, celle de la plus grande place ; le point d'assise de chacune sur sa place)
const H = 0.34;
const [g, d] = [...(sc?.places ?? [])].sort((p, q) => p.x - q.x);
ok(a && b && Math.abs(a.corps.boite[3] - H) < 0.002 && Math.abs(b.corps.boite[3] - H) < 0.002, `à la même taille, de la tête au sol (${a?.corps?.boite?.[3]}, ${b?.corps?.boite?.[3]} ; attendu ${H})`);
const milieu = (x) => x.corps.boite[0] + x.corps.boite[2] / 2;
ok(a && b && g && d && Math.abs(milieu(a) - g.x) < 0.002 && Math.abs(milieu(b) - d.x) < 0.002, `chacune au milieu de sa place (${a && milieu(a).toFixed(3)} / ${g?.x}, ${b && milieu(b).toFixed(3)} / ${d?.x})`);
ok(a && g && Math.abs(a.corps.boite[1] + 0.68 * H - g.y) < 0.002, `assise sur sa place : son point d'assise aux deux tiers de sa hauteur (${a && (a.corps.boite[1] + 0.68 * H).toFixed(3)} / ${g?.y})`);
// (sur une pièce en hauteur (1 024 × 1 536), la largeur suit le rapport de la figurine : 640/1 180 × H × 1 536/1 024)
ok(a && Math.abs(a.corps.boite[2] - (640 / 1180) * H * 1.5) < 0.003, `sa largeur suit son rapport et celui de la pièce (${a?.corps?.boite?.[2]})`);
ok(a && dans(a.tete.pivot, a.corps.boite) && dans([a.tete.boite[0], a.tete.boite[1]], a.corps.boite) && a.tete.boite[3] < a.corps.boite[3] && a.bouche && dans(a.bouche, a.tete.boite) && a.joues?.length === 2, "sa tête, son pivot, sa bouche et ses joues, sur la pièce, dans sa boîte");
r = await ouvrir(SAM, LEA.cle);
ok(r.corps?.ouverture?.scene?.calques?.a?.corps?.fichier === b?.corps?.fichier && r.corps.ouverture.scene.calques.b.corps.fichier === a?.corps?.fichier, "Sam ouvre la même conversation : sa figurine à lui à gauche, celle de Léa à droite");

// ═══ UNE NOUVELLE TENUE ═══
await deposer(`${LEA.id}/perso/v2/assise.png`, await assise("#7a3cc8"), "image/png");
await json(`${LEA.id}/perso/v2/fiche.json`, fiche(LEA.id, 2));
await json(`${LEA.id}/perso/fiche.json`, fiche(LEA.id, 2));
r = await calques(LEA);
ok(r.statut === 200 && ADRESSE.test(r.corps?.calques?.corps?.fichier ?? "") && r.corps.calques.corps.fichier !== c?.corps?.fichier, "sa nouvelle figurine : de nouveaux calques, à une nouvelle adresse");
ok((await lister(`${LEA.id}/calques`)).length === 6, "… les anciens restent (un téléphone qui les a encore)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles calques de chaque figurine (lot S1) : tout est bon");
process.exit(echecs ? 1 : 0);
