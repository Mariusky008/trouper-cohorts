// 🎭 LES GRADINS DES SALONS OUVERTS (`lib/direct/salons-gradins.ts`, `salons-gradins-serveur.ts`,
// `app/api/admin/direct/gradins` ; `docs/univers/decouvrir.md`, section 27), PAR LES ROUTES — contre le faux Supabase et le
// faux moteur d'image (jamais la vraie base, jamais le vrai moteur).
//
// L'administrateur seul. Onze lieux, rien de fait. « Fabriquer » la petite salle de cinéma : le décor, dessiné d'après le
// plan des huit emplacements (IMAGE 1), carré (1024 × 1024) ; encore : son relevé — sans modèle qui voit ici, le plan
// (et pourquoi). Un passage de plus : rien. Pas encore validé : les salons des séries gardent leur pièce. « Valider » :
// le salon des séries ET celui de la télé-réalité s'ouvrent dans le gradin (son image à adresse stable, ses huit places
// dans l'ordre des places), leur carte de l'accueil aussi ; la séance chez moi, jamais ; le foot (pas fait), sa pièce.
// « Refaire le relevé » : il quitte les salons ; « Prendre le plan », « Valider » : il revient. Des places relevées qui ne
// tiennent pas debout (sept, une hors de l'image) : le plan. « Retirer » ; « Refaire le décor » : tout s'efface.
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
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};
const toutIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string");
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `6c6c6c6c-0000-4000-8000-0000006c10${String(n).padStart(2, "0")}`, jeton: `jeton-salons-gradins-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
}
// (la pièce des salons, en attendant leur gradin)
await poserPiece(deposer, "salon", { le: maintenant });

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
const appel = async (chemin, corps, cookie) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const ADMIN_ROUTE = "/api/admin/direct/gradins";
const admin = (corps) => appel(ADMIN_ROUTE, corps, COOKIE_ADMIN);
const gradin = (etat, id) => etat?.gradins?.find((g) => g.id === id);
const salons = (x, corps) => appel("/api/direct/salons-ouverts", corps, `clikme_habitant=${x.jeton}`);
const entrer = (x, theme) => salons(x, { action: "entrer", theme });
const sortir = (x, salon) => salons(x, { action: "sortir", salon });
const PLAN = [
  [0.375, 0.9],
  [0.625, 0.9],
  [0.13, 0.9],
  [0.87, 0.9],
  [0.4, 0.6],
  [0.6, 0.6],
  [0.2, 0.6],
  [0.8, 0.6],
];
const commeLePlan = (places) => places?.length === 8 && places.every((p, k) => p.x === PLAN[k][0] && p.y === PLAN[k][1]);

// ═══ L'ADMINISTRATEUR SEUL ═══
ok((await appel(ADMIN_ROUTE, null, `clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appel(ADMIN_ROUTE, { action: "fabriquer", gradin: "cinema" }, "")).statut === 403, "sans être administrateur : refusé");
const e0 = (await admin()).etat;
ok(e0?.gradins?.length === 11 && e0.gradins.every((g) => !g.image && !g.places && !g.valide) && e0.moteurs?.image === true && e0.moteurs.regard === false, `onze lieux, rien de fait ; le moteur d'image branché, pas de modèle qui voit (${e0?.gradins?.length})`);
ok(gradin(e0, "cinema")?.themes?.join() === "series,tele" && gradin(e0, "tribune")?.themes?.join() === "foot" && e0.gradins.flatMap((g) => g.themes).length === 12, "les douze passions, chacune un lieu (les séries et la télé-réalité : la salle de cinéma)");
ok((await admin({ action: "fabriquer", gradin: "grenier" })).statut === 400 && (await admin({ action: "danser", gradin: "cinema" })).statut === 400 && (await admin({ action: "valider", gradin: "cinema" })).statut === 400, "un lieu inconnu, une action inconnue, valider sans décor : refusés");

// ═══ FABRIQUER : LE DÉCOR, PUIS SON RELEVÉ ═══
const avantIA = (await toutIA()).length;
const f1 = await admin({ action: "fabriquer", gradin: "cinema" });
ok(f1.statut === 200 && f1.fait === "decor" && /^https?:/.test(gradin(f1.etat, "cinema")?.image ?? "") && !gradin(f1.etat, "cinema").places, `« Fabriquer » : le décor (${f1.statut} ${f1.error ?? ""})`);
const consigne = (await toutIA()).slice(avantIA).find((c) => c.startsWith("IMAGE ")) ?? "";
ok(/IMAGE 1 is ONLY A SEATING PLAN/.test(consigne) && /private cinema room/.test(consigne) && /red velvet rug/.test(consigne) && /FRONT ROW: 4 spots/.test(consigne) && /BACK ROW: 4 spots on a raised step/.test(consigne) && /exactly 8/.test(consigne) && /nothing alcoholic/.test(consigne), "… dessiné d'après le plan des huit emplacements (IMAGE 1) : le lieu, ses tapis, deux rangées de quatre, rien d'alcoolisé");
const decor = await lire("salons-gradins/cinema/decor.png");
const md = decor ? await sharp(decor).metadata() : {};
ok(md.width === 1024 && md.height === 1024, `… carré (${md.width} × ${md.height})`);
const f2 = await admin({ action: "fabriquer", gradin: "cinema" });
const g2 = gradin(f2.etat, "cinema");
ok(f2.fait === "releve" && commeLePlan(g2?.places) && g2.source === "plan" && /Pas de modèle qui voit/.test(g2.releveRate ?? "") && !g2.valide, "encore : son relevé — sans modèle qui voit ici, les huit places du plan (et pourquoi) ; pas encore dans les salons");
const f3 = await admin({ action: "fabriquer", gradin: "cinema" });
ok(f3.statut === 200 && !f3.fait, "un passage de plus : rien à faire");

// ═══ PAS ENCORE VALIDÉ : LA PIÈCE ═══
const s0 = (await entrer(LEA, "series")).ouverture;
ok(s0?.gradin === null && s0.decor?.piece === "salon", "pas encore validé : le salon des séries garde sa pièce");
await sortir(LEA, s0?.salon?.id);

// ═══ VALIDÉ : DANS LES SALONS DE SES PASSIONS ═══
const v1 = await admin({ action: "valider", gradin: "cinema", oui: true });
ok(v1.statut === 200 && gradin(v1.etat, "cinema")?.valide === true && gradin(v1.etat, "cinema").le, "« Valider » : il va dans les salons");
const s1 = (await entrer(LEA, "series")).ouverture;
ok(s1?.gradin?.id === "cinema" && s1.gradin.nom === "La petite salle de cinéma" && s1.decor === null && /^\/api\/direct\/salon\/fichier\//.test(s1.gradin.image?.src ?? "") && s1.gradin.image.largeur === 1024 && s1.gradin.image.hauteur === 1024 && /768w/.test(s1.gradin.image.srcset) && /^data:image\/webp/.test(s1.gradin.image.flou), "le salon des séries s'ouvre dans le gradin : son image à adresse stable (768 et 1024 points), sa vignette floue");
ok(commeLePlan(s1.gradin.places) && s1.presents.find((p) => p.q === s1.moi)?.place === 0, "… ses huit places dans l'ordre des places ; Léa, la première");
const servie = await fetch(`${BASE}${s1.gradin.image.src}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
ok(servie.status === 200 && /immutable/.test(servie.headers.get("cache-control") ?? ""), "… servie au téléphone, gardée un an");
const t1 = (await entrer(SAM, "tele")).ouverture;
ok(t1?.gradin?.id === "cinema" && t1.gradin.image.src === s1.gradin.image.src, "le salon de la télé-réalité aussi (la même salle de cinéma)");
const f4 = (await entrer(SAM, "foot")).ouverture;
ok(f4?.gradin === null && f4.decor?.piece === "salon", "le foot (sa tribune pas faite) : sa pièce");
const accueil = await appel("/api/direct/salons-ouverts?accueil=1", null, `clikme_habitant=${LEA.jeton}`);
const carte = (t) => accueil.cartes?.find((c) => c.theme === t);
ok(carte("series")?.decor?.src === s1.gradin.image.src && carte("tele")?.decor?.src === s1.gradin.image.src && carte("foot")?.decor?.src && carte("foot").decor.src !== s1.gradin.image.src, "les cartes de l'accueil : le gradin pour les séries et la télé-réalité, la pièce pour le foot");
const chez = await salons(LEA, { action: "entrer-chez", chez: "moi" });
ok(chez.ouverture?.salon?.seance && chez.ouverture.gradin === null && chez.ouverture.decor?.piece, `la séance chez moi : jamais de gradin, une pièce (${chez.statut} ${chez.error ?? ""})`);

// ═══ REFAIRE LE RELEVÉ, LE PLAN, DES PLACES QUI NE TIENNENT PAS ═══
const r1 = await admin({ action: "refaire", gradin: "cinema", quoi: "releve" });
ok(r1.statut === 200 && gradin(r1.etat, "cinema")?.image && !gradin(r1.etat, "cinema").places && !gradin(r1.etat, "cinema").valide, "« Refaire le relevé » : le décor reste, il quitte les salons");
ok((await entrer(SAM, "tele")).ouverture?.gradin === null, "… la télé-réalité reprend sa pièce");
const p1 = await admin({ action: "plan", gradin: "cinema" });
ok(p1.statut === 200 && commeLePlan(gradin(p1.etat, "cinema")?.places) && gradin(p1.etat, "cinema").source === "plan" && !gradin(p1.etat, "cinema").releveRate, "« Prendre le plan » : les huit places du plan");
await admin({ action: "valider", gradin: "cinema", oui: true });
// (un relevé qui ne tient pas debout : sept places, une hors de l'image — il ne compte pas)
await json("salons-gradins/cinema/releve.json", { le: maintenant, source: "regard", places: PLAN.slice(0, 7).map(([x, y]) => ({ x, y: y + 0.5, hauteur: 0.2 })) });
const e2 = (await admin()).etat;
ok(!gradin(e2, "cinema")?.places && !gradin(e2, "cinema").valide && (await entrer(SAM, "tele")).ouverture?.gradin === null, "des places relevées qui ne tiennent pas (sept, une hors de l'image) : pas de gradin dans les salons");
// (huit places relevées, dans le désordre : rangées dans l'ordre des places — devant, du milieu vers les bords)
await json("salons-gradins/cinema/releve.json", { le: maintenant, source: "regard", places: [...PLAN].reverse().map(([x, y]) => ({ x, y, hauteur: y > 0.8 ? 0.27 : 0.21 })) });
const e3 = (await admin()).etat;
ok(commeLePlan(gradin(e3, "cinema")?.places) && gradin(e3, "cinema").source === "regard" && gradin(e3, "cinema").valide === true, "huit places relevées dans le désordre : rangées dans l'ordre des places ; « relevées sur l'image »");

// ═══ RETIRER, REFAIRE LE DÉCOR ═══
const x1 = await admin({ action: "valider", gradin: "cinema", oui: false });
ok(x1.statut === 200 && !gradin(x1.etat, "cinema")?.valide && (await entrer(SAM, "tele")).ouverture?.gradin === null, "« Retirer » : les salons reprennent leur pièce");
const x2 = await admin({ action: "refaire", gradin: "cinema", quoi: "decor" });
ok(x2.statut === 200 && !gradin(x2.etat, "cinema")?.image && !gradin(x2.etat, "cinema").places && !(await lire("salons-gradins/cinema/decor.png")), "« Refaire le décor » : tout s'efface");
ok((await admin({ action: "refaire", gradin: "cinema", quoi: "tout" })).statut === 400, "refaire quoi d'autre : refusé");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
