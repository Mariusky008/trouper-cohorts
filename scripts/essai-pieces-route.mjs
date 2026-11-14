// 🏠 LES PIÈCES EN PANORAMA, L'ESSAI DU SALON (`lib/direct/pieces-serveur.ts`, `app/api/admin/direct/pieces`) — contre
// le faux Supabase et son faux moteur d'image, jamais la vraie base, jamais OpenAI.
//
// Réservé à l'administrateur, sur SON univers (le cookie d'habitant de son téléphone). Léa a sa figurine assise et son
// univers (son décor) ; Sam n'a pas d'univers. Quatre passages : le centre (en largeur, d'après son décor, une place
// libre pour son fauteuil), la gauche (la toile prolongée : un masque — la porte de la pièce télé), la droite (la baie
// sur la terrasse), puis l'assemblage (3584 × 1024, sans moteur). Plus rien à faire ensuite ; refaire un côté efface
// lui et le panorama ; aucun verrou ne reste.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-pieces-route.mjs
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
const LEA = { id: "abababab-0000-4000-8000-000000000a01", jeton: "jeton-lea-pieces-00000000001" };
const SAM = { id: "abababab-0000-4000-8000-000000000a02", jeton: "jeton-sam-pieces-00000000001" };
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: "Essai", ville_slug: "dax" })));

// ─── Léa : sa figurine assise, son univers et son décor ───
const maintenant = new Date().toISOString();
const PNG = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 200, g: 140, b: 90, alpha: 1 } } }).png().toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, PNG, "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
await deposer(`${LEA.id}/monde/v1/decor.png`, PNG, "image/png");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [{ id: "e1", quoi: "un établi couvert d'outils", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true }],
  regles: [],
  inconnus: [],
  scene: { sol: 0.78, places: [{ id: "hote", x: 0.36, y: 0.8, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${LEA.id}/monde/v1/decor.png` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${LEA.id}/monde/v1/fiche.json`, monde);
await json(`${LEA.id}/monde/fiche.json`, monde);

const ROUTE = `${BASE}/api/admin/direct/pieces`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const sam = `${COOKIE_ADMIN}; clikme_habitant=${SAM.jeton}`;

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN)).statut === 400, "sans figurine sur ce téléphone : rien");
const e0 = await appeler(lea);
ok(e0.statut === 200 && e0.etat?.decor === true && e0.etat.aFaire?.join() === "centre,gauche,droite,panorama" && /^http/.test(e0.etat.figurine ?? ""), "Léa : son univers a son décor, quatre étapes à faire, sa figurine assise signée");
const s0 = await appeler(sam, { action: "fabriquer" });
ok(s0.statut === 502 && /Crée d’abord ton univers/.test(s0.error ?? ""), "Sam, sans univers : « Crée d’abord ton univers »");

// ─── les quatre passages ───
const avant = (await toutIA()).length;
const c1 = await appeler(lea, { action: "fabriquer" });
let ia = (await toutIA()).slice(avant);
ok(c1.statut === 200 && c1.fait === "centre" && ia.length === 1 && ia[0].startsWith("IMAGE ") && ia[0].includes(" low ") && ia[0].includes("Create the LIVING ROOM") && ia[0].includes("an armchair will be placed there later") && ia[0].includes("No people"), "1. le centre : le salon, d'après son décor (fidélité basse), une place libre pour son fauteuil, personne");
const centre = await sharp(await octets(`${LEA.id}/pieces/salon/centre.png`)).metadata();
ok(centre.width === 1536 && centre.height === 1024, `à la taille de la toile, en largeur (${centre.width} × ${centre.height})`);
const c2 = await appeler(lea, { action: "fabriquer" });
ia = (await toutIA()).slice(avant);
ok(c2.fait === "gauche" && ia.some((c) => c.includes("Extend the room to the LEFT") && c.includes("closed wooden door") && c.includes(" high ")) && ia.includes("MASQUE 1536x1024"), "2. la gauche : la toile prolongée (un masque, en largeur), la porte de la pièce télé");
const c3 = await appeler(lea, { action: "fabriquer" });
ia = (await toutIA()).slice(avant);
ok(c3.fait === "droite" && ia.some((c) => c.includes("Extend the room to the RIGHT") && c.includes("bay window")) && ia.filter((c) => c.startsWith("MASQUE")).length === 2, "3. la droite : la baie sur la terrasse");
const n3 = (await toutIA()).length;
const c4 = await appeler(lea, { action: "fabriquer" });
const pano = await sharp(await octets(`${LEA.id}/pieces/salon/panorama.webp`)).metadata();
ok(c4.fait === "panorama" && (await toutIA()).length === n3 && pano.width === 3584 && pano.height === 1024 && pano.format === "webp", `4. l'assemblage, sans moteur : ${pano.width} × ${pano.height}`);
ok(c4.etat?.aFaire?.length === 0 && /^http/.test(c4.etat.images?.panorama ?? "") && c4.etat.enCours === false, "tout est fait : le panorama signé, aucun passage en train");
const c5 = await appeler(lea, { action: "fabriquer" });
ok(c5.statut === 200 && !c5.fait, "plus rien à faire");
ok((await octets(`${LEA.id}/pieces/salon/verrou.json`)) === null, "aucun verrou ne reste");

// ─── refaire ───
const r1 = await appeler(lea, { action: "refaire", etape: "gauche" });
ok(r1.statut === 200 && r1.etat?.faites?.join() === "centre,droite" && r1.etat.aFaire?.join() === "gauche,panorama", "refaire la gauche : elle et le panorama s'effacent, le centre et la droite restent");
ok((await appeler(lea, { action: "refaire", etape: "cuisine" })).statut === 400, "une étape inconnue : refusée");
const r2 = await appeler(lea, { action: "refaire", etape: "centre" });
ok(r2.etat?.faites?.length === 0, "refaire le centre : tout s'efface");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle salon en panorama tient ✓");
process.exit(echecs ? 1 : 0);
