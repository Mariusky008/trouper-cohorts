// 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`lib/direct/ma-maison-serveur.ts`, `app/api/direct/ma-piece`,
// `docs/univers/ma-maison.md` ; le lot M1) — contre le faux Supabase, jamais la vraie base, jamais un moteur d'image.
//
// L'interrupteur est éteint : l'administrateur seul (l'adresse d'essai) ; sans figurine sur le téléphone : refusé. Léa
// (15-17 ans) n'a pas de pièce : sa maison est vide, sa figurine détourée au plus près (une fois), à adresse stable. Le
// catalogue : les neuf, les pièces des plus jeunes d'abord, une vignette pour les seules pièces prêtes (leur image
// faite) ; un adulte : celles des adultes d'abord. Choisir une pièce pas prête, ou inconnue : refusé ; choisir le hangar :
// sa scène — l'image de la messagerie (en hauteur, depuis le 20 novembre 2026 : plus le panorama) dans la lumière de
// l'heure de Paris (la sienne sinon), à adresse stable, en 768 et 1024 points, servie et gardée un an par le téléphone ;
// ses emplacements ; son centre : la place de gauche du relevé. Gardée : relue au retour. En changer : le salon (sans
// relevé : le centre par défaut). Sa figurine change : détourée à nouveau.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-ma-maison-route.mjs
import sharp from "sharp";
import { imagePiece, poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const octets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};

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

const LEA = { id: "4a150a15-0000-4000-8000-00000000aa01", jeton: "jeton-ma-maison-lea-0001", prenom: "Léa" };
const MAX = { id: "4a150a15-0000-4000-8000-00000000aa02", jeton: "jeton-ma-maison-max-0002", prenom: "Max" };
await semer("human_habitants", [LEA, MAX].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
// (sa figurine assise dans son fauteuil : 800 × 1200, la figurine (400 × 600) au milieu, du vide transparent autour)
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" rx="60" fill="${couleur}"/></svg>`), left: 200, top: 400 }])
    .png()
    .toBuffer();
const fiche = (h, v) => ({ version: v, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v${v}/assise.png` } }, historique: [{ version: v, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
for (const x of [LEA, MAX]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise("#c8643c"), "image/png");
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id, 1));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id, 1));
}
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 15, adulte: false });
await json(`${MAX.id}/majeur.json`, { le: maintenant, age: 15, adulte: true });

// (le catalogue : le hangar, prêt dans sa lumière (le soir) et la nuit, son relevé (la place de gauche écrite en second) ;
// le salon, prêt sans relevé)
await poserPiece(deposer, "hangar", {
  le: maintenant,
  lumieres: false,
  emplacements: {
    tele: [0.3, 0.2, 0.4, 0.16],
    cadres: [[0.08, 0.42, 0.12, 0.1]],
    lampes: [[0.84, 0.44, 0.06, 0.2]],
    table: [0.45, 0.78, 0.12, 0.05],
    places: [
      { x: 0.72, y: 0.86, hauteur: 0.28 },
      { x: 0.3, y: 0.87, hauteur: 0.31 },
    ],
    chat: { x: 0.8, y: 0.9 },
  },
});
await deposer("pieces-duo/hangar/lumiere-nuit.png", await imagePiece({ fond: "#1a1430" }), "image/png");
await poserPiece(deposer, "salon", { fond: "#2a4b5c", lumieres: false, releve: false });

const ROUTE = `${BASE}/api/direct/ma-piece`;
const appeler = async (cookie, corps, q = "") => {
  const r = await fetch(`${ROUTE}${q}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const LEA_ADMIN = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const MAX_ADMIN = `${COOKIE_ADMIN}; clikme_habitant=${MAX.jeton}`;

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appeler(`clikme_habitant=${LEA.jeton}`, { action: "choisir", piece: "hangar" })).statut === 403, "l'interrupteur éteint : un habitant seul n'y entre pas encore");
ok((await appeler(COOKIE_ADMIN)).statut === 401, "l'administrateur sans figurine sur ce téléphone : refusé (sa maison est celle de sa figurine)");

// ─── sa maison, vide ───
const m0 = await appeler(LEA_ADMIN);
const fig = m0.maison?.figurine;
ok(m0.statut === 200 && m0.maison?.piece === null && m0.maison.scene === null, "Léa n'a pas encore de pièce : sa maison est vide (le choix s'ouvre)");
ok(/^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/.test(fig?.src ?? "") && /360w/.test(fig?.srcset ?? "") && /^data:image\/webp/.test(fig?.flou ?? ""), "sa figurine, à adresse stable (360 et 720 points), sa vignette floue d'abord");
const detouree = await octets(`${LEA.id}/ma-piece/figurine.png`);
const md = detouree ? await sharp(detouree).metadata() : {};
ok(fig?.largeur === md.width && fig?.hauteur === md.height && md.width === 400 && md.height === 600, `détourée au plus près (le vide autour retiré : ${md.width} × ${md.height}, comme la figurine)`);
const servie = await fetch(`${BASE}${fig?.src}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
ok(servie.status === 200 && servie.headers.get("content-type") === "image/webp" && /immutable/.test(servie.headers.get("cache-control") ?? ""), "servie au téléphone, gardée un an");

// ─── le catalogue ───
const c0 = await appeler(LEA_ADMIN, null, "?catalogue=1");
const cles = c0.catalogue?.pieces?.map((p) => p.cle) ?? [];
ok(c0.statut === 200 && cles.length === 9 && cles.slice(0, 4).join() === "hangar,newyork,rue,chambre-musicale" && c0.catalogue.piece === null, `les neuf, les pièces des plus jeunes d'abord (Léa a 15-17 ans) : ${cles.join(", ")}`);
const pretes = c0.catalogue?.pieces?.filter((p) => p.vignette).map((p) => p.cle) ?? [];
ok(pretes.join() === "hangar,salon" && /360w/.test(c0.catalogue.pieces[0].vignette.srcset) && /720w/.test(c0.catalogue.pieces[0].vignette.srcset) && c0.catalogue.pieces[0].vignette.hauteur > c0.catalogue.pieces[0].vignette.largeur && c0.catalogue.pieces.every((p) => p.nom && p.emoji && p.pour), "une vignette pour les seules pièces prêtes (le hangar, le salon), en hauteur, en 360 et 720 points");
const cMax = await appeler(MAX_ADMIN, null, "?catalogue=1");
ok(cMax.catalogue?.pieces?.slice(0, 4).map((p) => p.cle).join() === "salon,terrasse,cuisine,chambre", "un adulte : les pièces des adultes d'abord (toutes proposées à tous)");

// ─── choisir sa pièce ───
ok((await appeler(LEA_ADMIN, { action: "choisir", piece: "cuisine" })).statut === 400 && (await appeler(LEA_ADMIN, { action: "choisir", piece: "grenier" })).statut === 400 && (await appeler(LEA_ADMIN, { action: "danser" })).statut === 400, "une pièce pas prête, une pièce inconnue, une action inconnue : refusées");
const ch = await appeler(LEA_ADMIN, { action: "choisir", piece: "hangar" });
const sc = ch.maison?.scene;
const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date())) % 24;
const voulu = heure >= 7 && heure < 17 ? "matin" : heure >= 17 && heure < 21 ? "soir" : "nuit";
const attendu = voulu === "matin" ? "soir" : voulu;
ok(ch.statut === 200 && ch.maison.piece === "hangar" && sc?.piece === "hangar" && sc.nom === "Le hangar" && sc.moment === attendu, `le hangar choisi : sa scène dans la lumière de l'heure de Paris (${voulu} : ${sc?.moment}${voulu === "matin" ? ", la sienne : le matin n'est pas fait" : ""})`);
ok(/768w/.test(sc?.panorama?.srcset ?? "") && /1024w/.test(sc.panorama.srcset) && sc.panorama.largeur === 1024 && sc.panorama.hauteur === 1536 && /^data:image\/webp/.test(sc.panorama.flou), "son image (celle de la messagerie, en hauteur) à adresse stable, en 768 et 1024 points, sa vignette floue d'abord");
const pano = await fetch(`${BASE}${sc?.panorama?.src}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
const pm = await sharp(Buffer.from(await pano.arrayBuffer())).metadata();
ok(pano.status === 200 && pm.width === 1024 && pm.height === 1536, "servie en grand (1024 × 1536)");
ok(sc?.emplacements?.tele?.join() === "0.3,0.2,0.4,0.16" && sc.emplacements.lampes?.length === 1 && sc.emplacements.table && sc.centre?.x === 0.3 && sc.centre.y === 0.87 && sc.centre.hauteur === 0.31, "ses emplacements (la télé, un cadre, une lampe, la table basse, le chat) ; son centre : la place de gauche du relevé");
ok(JSON.parse((await octets(`${LEA.id}/ma-piece/piece.json`))?.toString() || "{}").piece === "hangar", "rangée chez elle (ma-piece/piece.json)");
const m1 = await appeler(LEA_ADMIN);
ok(m1.maison?.piece === "hangar" && m1.maison.scene?.panorama?.src === sc?.panorama?.src && m1.maison.figurine?.src === fig?.src, "au retour : sa pièce, les mêmes adresses (rien n'est refait)");
ok((await appeler(LEA_ADMIN, null, "?catalogue=1")).catalogue?.piece === "hangar", "le catalogue sait laquelle est la sienne");

// ─── en changer ───
const sa = await appeler(LEA_ADMIN, { action: "choisir", piece: "salon" });
ok(sa.maison?.piece === "salon" && sa.maison.scene?.moment === "soir" && sa.maison.scene.emplacements === null && sa.maison.scene.centre?.x === 0.33 && sa.maison.scene.centre.y === 0.86, "en changer : le salon, dans sa lumière ; sans relevé, le centre par défaut");

// ─── sa figurine change : détourée à nouveau ───
await deposer(`${LEA.id}/perso/v2/assise.png`, await assise("#3c8cc8"), "image/png");
await json(`${LEA.id}/perso/v2/fiche.json`, fiche(LEA.id, 2));
await json(`${LEA.id}/perso/fiche.json`, fiche(LEA.id, 2));
const m2 = await appeler(LEA_ADMIN);
ok(m2.maison?.figurine?.src && m2.maison.figurine.src !== fig?.src && JSON.parse((await octets(`${LEA.id}/ma-piece/figurine.json`))?.toString() || "{}").source === `${LEA.id}/perso/v2/assise.png`, "sa nouvelle figurine : détourée à nouveau, une nouvelle adresse");

// ─── chacun la sienne ───
const mx = await appeler(MAX_ADMIN);
ok(mx.maison?.piece === null && mx.maison.figurine?.src && mx.maison.figurine.src !== m2.maison.figurine.src, "Max : pas de pièce, sa figurine à lui");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
