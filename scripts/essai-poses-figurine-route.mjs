// 🧍 LES POSES DE LA FIGURINE — L'ESSAI P0 (`lib/direct/poses-figurine-serveur.ts`, `app/api/admin/direct/poses-figurine`)
// — contre le faux Supabase et son faux moteur d'image, jamais la vraie base, jamais OpenAI.
//
// Réservé à l'administrateur. Léa a sa figurine assise ; le salon du duo est fait (vide, ses emplacements posés à la
// main). 1. « Debout » d'abord : d'après sa figurine assise seule (IMAGE 1), détourée au plus près, rangée à part ; une
// autre pose avant elle : refusée ; 2. la suivante (sans pose demandée : la prochaine qui manque, « le premier pas ») :
// d'après la figurine ET la pose debout ; le second pas avant le premier : refusé, puis d'après lui (IMAGE 3) ; 3. refaire
// une pose : elle seule s'efface ; 4. son avis ; 5. les pièces du duo faites, pour la scène ; une nouvelle figurine : de
// nouvelles poses.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-poses-figurine-route.mjs
import { createHash } from "node:crypto";
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const octets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};
const toutIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000e21", jeton: "jeton-lea-poses-figurine-0001" };
const SAM = { id: "aeaeaeae-0000-4000-8000-000000000e22", jeton: "jeton-sam-poses-figurine-0001" };
await semer("human_habitants", [
  { id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" },
  { id: SAM.id, device_token: SAM.jeton, prenom: "Sam", ville_slug: "dax" },
]);

// ─── Léa : sa figurine assise ; le salon du duo, fait et vide ───
const maintenant = new Date().toISOString();
const PNG = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 200, g: 140, b: 90, alpha: 1 } } }).png().toBuffer();
const fiche = async (h, v) => {
  const P = `${h}/perso/v${v}`;
  await deposer(`${P}/assise.png`, PNG, "image/png");
  const perso = { version: v, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P}/assise.png` } }, historique: [{ version: v, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${P}/fiche.json`, perso);
  await json(`${h}/perso/fiche.json`, perso);
  return `${P}/assise.png`;
};
const assise = await fiche(LEA.id, 1);
await deposer("pieces-duo/salon/decor.png", PNG, "image/png");
await json("pieces-duo/salon/releve.json", {
  le: maintenant,
  ajuste: true,
  emplacements: { tele: [0.06, 0.28, 0.3, 0.14], etagere: [0.6, 0.2, 0.3, 0.12], cadres: [], places: [{ x: 0.36, y: 0.8, hauteur: 0.26 }, { x: 0.64, y: 0.8, hauteur: 0.26 }] },
});

const ROUTE = `${BASE}/api/admin/direct/poses-figurine`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const D = `poses-figurine/${createHash("sha1").update(assise).digest("hex").slice(0, 12)}`;
const pose = (e, c) => e?.poses?.find((p) => p.cle === c);

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN)).statut === 400, "sans habitant sur ce téléphone : rien");
ok((await appeler(lea, { action: "fabriquer", pose: "saut" })).statut === 400 && (await appeler(lea, { action: "danser" })).statut === 400 && (await appeler(lea, { action: "refaire" })).statut === 400, "une pose ou une action inconnue : refusée");
const sam = await appeler(`${COOKIE_ADMIN}; clikme_habitant=${SAM.jeton}`, { action: "fabriquer" });
ok(sam.statut === 502 && sam.error?.includes("nouveau style") && !sam.etat?.figurine, "sans figurine du nouveau style : « fais-la d’abord »");

const e0 = await appeler(lea);
ok(
  e0.statut === 200 && e0.etat?.poses?.length === 9 && e0.etat.poses.every((p) => !p.image) && /^http/.test(e0.etat.figurine ?? "") && e0.etat.moteur === true,
  "ses neuf poses à faire ; sa figurine assise, signée ; le moteur branché",
);
ok(e0.etat?.pieces?.length === 1 && e0.etat.pieces[0].cle === "salon" && /^http/.test(e0.etat.pieces[0].decor) && e0.etat.pieces[0].ajuste === true && e0.etat.pieces[0].emplacements?.tele?.length === 4, "les pièces du duo faites (le salon, vide) : son image et ses emplacements, pour la scène");
const avantDebout = await appeler(lea, { action: "fabriquer", pose: "danse" });
ok(avantDebout.statut === 502 && avantDebout.error?.includes("« Debout »"), "une pose avant « Debout » : « Fais d’abord sa pose « Debout » »");

// ─── 1. « Debout » d'abord (sans pose demandée : la première qui manque) ───
const avant = (await toutIA()).length;
const r1 = await appeler(lea, { action: "fabriquer" });
let ia = (await toutIA()).slice(avant);
const debout = await octets(`${D}/debout.png`);
const m1 = debout ? await sharp(debout).metadata() : {};
ok(r1.statut === 200 && r1.fait === "debout" && /^http/.test(pose(r1.etat, "debout")?.image ?? ""), "1. « Debout » : faite la première, signée");
ok(m1.width === 32 && m1.height === 64, `détourée au plus près (le faux moteur rend 64 × 96, la figurine en fait ${m1.width} × ${m1.height})`);
ok(
  ia.length === 1 && ia[0].includes(" transparent high ") && ia[0].includes("IMAGE 1 is a collectible figurine") && !ia[0].includes("IMAGE 2") && ia[0].includes("STANDING upright") && ia[0].includes("WITHOUT the armchair") && ia[0].includes("legs and shoes") && ia[0].includes("no shadow"),
  `d'après sa figurine assise seule, sans fauteuil, ses jambes inventées, le fond transparent (${(ia[0] ?? "").slice(0, 60)}…)`,
);

// ─── 2. la suivante : le premier pas, d'après la figurine ET la pose debout ───
const deuxAvant = await appeler(lea, { action: "fabriquer", pose: "marche-2" });
ok(deuxAvant.statut === 502 && deuxAvant.error?.includes("un pas"), "le second pas avant le premier : refusé (« celle-ci la suit »)");
const r2 = await appeler(lea, { action: "fabriquer" });
ia = (await toutIA()).slice(avant + 1);
ok(r2.fait === "marche-1" && ia.length === 1 && ia[0].includes("IMAGE 2 is the SAME figurine standing") && !ia[0].includes("IMAGE 3") && ia[0].includes("WALKING toward the RIGHT") && ia[0].includes("same legs and shoes as IMAGE 2"), "2. la suivante (le premier pas) : d'après sa figurine ET la pose debout");
const r3 = await appeler(lea, { action: "fabriquer", pose: "marche-2" });
ia = (await toutIA()).slice(avant + 2);
ok(r3.fait === "marche-2" && ia[0]?.includes("IMAGE 3 is the same figurine taking a step") && ia[0].includes("exactly like IMAGE 3"), "le second pas : aussi d'après le premier (IMAGE 3), pour qu'ils s'enchaînent");
ok((await appeler(lea, { action: "fabriquer", pose: "marche-2" })).fait === undefined && (await toutIA()).length === avant + 3, "déjà faite : rien de plus");
ok((await octets(`${D}/verrou.json`)) === null, "aucun verrou ne reste");

// ─── 3. refaire une pose : elle seule ───
const rf = await appeler(lea, { action: "refaire", pose: "marche-1" });
ok(rf.statut === 200 && !pose(rf.etat, "marche-1")?.image && /^http/.test(pose(rf.etat, "marche-2")?.image ?? "") && /^http/.test(pose(rf.etat, "debout")?.image ?? "") && (await octets(`${D}/marche-1.png`)) === null, "refaire le premier pas : lui seul s'efface");

// ─── 4. son avis ───
ok((await appeler(lea, { action: "avis", avis: "bof" })).statut === 400, "un avis inconnu : refusé");
const av = await appeler(lea, { action: "avis", avis: "presque", note: "Les chaussures changent." });
ok(av.statut === 200 && av.etat?.avis?.avis === "presque" && av.etat.avis.note === "Les chaussures changent." && JSON.parse((await octets(`${D}/avis.json`))?.toString() || "{}").avis === "presque", "4. son avis et son mot : rangés avec ses poses");

// ─── 5. une nouvelle figurine (sa tenue du mois) : de nouvelles poses ───
await fiche(LEA.id, 2);
const e2 = await appeler(lea);
ok(e2.etat?.poses?.every((p) => !p.image) && !e2.etat.avis, "une nouvelle figurine : de nouvelles poses (les anciennes restent rangées à part)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
