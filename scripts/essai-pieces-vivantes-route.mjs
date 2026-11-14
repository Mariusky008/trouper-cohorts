// 🎬 UNE PIÈCE ENTIÈRE, VIVANTE — L'ESSAI (`lib/direct/pieces-vivantes-serveur.ts`, `app/api/admin/direct/pieces-vivantes`)
// — contre le faux Supabase, son faux moteur d'image et son faux moteur vidéo, jamais la vraie base, jamais OpenAI.
//
// Réservé à l'administrateur, sur SON univers. Léa a sa figurine assise et son décor ; Sam n'a pas d'univers. Le salon :
// 1. l'image — la pièce ENTIÈRE, en hauteur (1024 × 1536), vue de loin, ses trois vedettes (le tourne-disque, la
// cheminée, la fenêtre), ses étagères, la place du fauteuil, personne ; la vue du téléphone gardée en 9:16 (864 × 1536) ;
// 2. les objets — les trois vedettes, la place du fauteuil (un objet qu'elle n'a pas est laissé de côté ; pas d'écran
// sans télé) ; 3. la vie — la vidéo commandée (le modèle, 8 s, 720 × 1280, l'image reçue exactement à cette taille, la
// caméra immobile, ce qui vit), « en train » (40 %), puis faite et rangée. Plus rien ensuite ; aucun verrou. La pièce
// télé : l'écran de la télé repéré, la télé éteinte qui le reste dans la vidéo, dans le style du salon (IMAGE 2).
// Refaire la vidéo : elle seule ; l'image : tout. Une pièce inconnue : refusée.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-pieces-vivantes-route.mjs
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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000a01", jeton: "jeton-lea-vivante-0000000001" };
const SAM = { id: "aeaeaeae-0000-4000-8000-000000000a02", jeton: "jeton-sam-vivante-0000000001" };
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
  proposition: "Je t'imagine dans un atelier ouvert sur la montagne.",
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

const ROUTE = `${BASE}/api/admin/direct/pieces-vivantes`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const sam = `${COOKIE_ADMIN}; clikme_habitant=${SAM.jeton}`;
const D = `${LEA.id}/pieces-entieres`;

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN)).statut === 400, "sans figurine sur ce téléphone : rien");
const e0 = await appeler(lea);
ok(e0.statut === 200 && e0.etat?.decor === true && e0.etat.aFaire?.join() === "image,objets,video" && e0.etat.vedettes?.length === 3 && /^http/.test(e0.etat.figurine ?? ""), "Léa : son décor, trois étapes à faire, trois vedettes, sa figurine assise signée");
ok((await appeler(sam, { action: "fabriquer" })).error?.includes("Crée d’abord ton univers"), "Sam, sans univers : « Crée d’abord ton univers »");
ok((await appeler(lea, { action: "fabriquer", piece: "cuisine" })).statut === 400, "une pièce inconnue : refusée");

// ─── 1. l'image ───
const avant = (await toutIA()).length;
const i1 = await appeler(lea, { action: "fabriquer" });
let ia = (await toutIA()).slice(avant);
ok(
  i1.statut === 200 && i1.fait === "image" && ia.length === 1 && ia[0].startsWith("IMAGE ") && ia[0].includes(" low ") && ia[0].includes("Create the LIVING ROOM of this same home — the WHOLE of it") && ia[0].includes("tall portrait frame") && ia[0].includes("seen from far back"),
  "1. l'image : le salon ENTIER, en hauteur, vu de loin, d'après son décor (fidélité basse)",
);
ok(ia[0].includes("THE STARS OF THE ROOM") && ia[0].includes("record player") && ia[0].includes("fireplace") && ia[0].includes("same landscape as IMAGE 1") && ia[0].includes("wooden shelves") && ia[0].includes("an armchair will be placed there later") && ia[0].includes("No people"), "ses trois vedettes (tourne-disque, cheminée, fenêtre sur son paysage), ses étagères, la place du fauteuil, personne");
const image = await sharp(await octets(`${D}/salon/image.png`)).metadata();
const vue = await sharp(await octets(`${D}/salon/vue.webp`)).metadata();
ok(image.width === 1024 && image.height === 1536 && vue.width === 864 && vue.height === 1536 && vue.format === "webp", `en hauteur (${image.width} × ${image.height}) ; la vue du téléphone en 9:16 (${vue.width} × ${vue.height})`);
ok(/^http/.test(i1.etat?.vue ?? "") && i1.etat.aFaire?.join() === "objets,video", "la vue signée ; restent les objets et la vidéo");

// ─── 2. les objets ───
const o1 = await appeler(lea, { action: "fabriquer" });
ia = (await toutIA()).slice(avant);
const vus = o1.etat?.objets;
ok(o1.fait === "objets" && ia.some((c) => c.startsWith("LES OBJETS VEDETTES") && c.includes("- platine :") && c.includes("- feu :") && c.includes("- fenetre :") && !c.includes("the SCREEN of the television")), "2. les objets : le modèle cherche les trois vedettes et la place du fauteuil (pas d'écran sans télé)");
ok(vus?.objets?.map((o) => o.cle).join() === "platine,feu,fenetre" && vus.place?.x === 35 && vus.ecran === null, `les trois vedettes, chacune son cadre ; un objet qu'elle n'a pas, et un écran sans télé, laissés de côté ; la place du fauteuil (${JSON.stringify(vus?.place)})`);

// ─── 3. la vie ───
const v1 = await appeler(lea, { action: "fabriquer" });
ia = (await toutIA()).slice(avant);
const commande = ia.find((c) => c.startsWith("VIDEO ")) ?? "";
ok(v1.statut === 200 && v1.progres === 0 && !v1.fait && v1.etat?.videoEnCours?.depuis, "3. la vidéo : commandée (rien de fait encore)");
ok(commande.startsWith("VIDEO sora-2 8 720x1280 720x1280 ") && commande.includes("locked-off tripod shot") && commande.includes("the vinyl record turns slowly") && commande.includes("the flames of the fire flicker") && commande.includes("stays empty"), `le moteur vidéo : 8 s, 720 × 1280, l'image reçue exactement à sa taille ; la caméra immobile, le disque tourne, le feu danse (${commande.slice(0, 48)}…)`);
const v2 = await appeler(lea, { action: "fabriquer" });
ok(v2.progres === 40 && !v2.fait && v2.etat?.videoEnCours?.progres === 40, "elle se fait : 40 %");
const v3 = await appeler(lea, { action: "fabriquer" });
const mp4 = await octets(`${D}/salon/video.mp4`);
ok(v3.fait === "video" && mp4?.toString() === "faux mp4 de la pièce vivante" && /^http/.test(v3.etat?.video ?? "") && !v3.etat.videoEnCours && v3.etat.aFaire?.length === 0, "faite : rangée, signée ; tout est fait");
ok((await octets(`${D}/salon/video.json`)) === null && (await octets(`${D}/salon/verrou.json`)) === null, "ni commande ni verrou ne restent");
const v4 = await appeler(lea, { action: "fabriquer" });
ok(v4.statut === 200 && !v4.fait && v4.progres === undefined, "plus rien à faire");
ok(v4.etat?.pieces?.salon === 3 && v4.etat.pieces.tele === 0, "chaque pièce, où elle en est");

// ─── 📺 la pièce télé : l'écran ───
const avantTele = (await toutIA()).length;
await appeler(lea, { action: "fabriquer", piece: "tele" });
const t2 = await appeler(lea, { action: "fabriquer", piece: "tele" });
ia = (await toutIA()).slice(avantTele);
ok(ia.some((c) => c.includes("Create the TV ROOM of this same home — the WHOLE of it") && c.includes("switched off") && c.includes("aquarium") && c.includes("IMAGE 2 is another room of this same home")), "📺 la pièce télé : la télé éteinte, l'aquarium, dans le style du salon (IMAGE 2)");
ok(t2.fait === "objets" && t2.etat?.objets?.ecran?.l === 20 && t2.etat.objets.objets.map((o) => o.cle).join() === "tele,aquarium,bougies", "ses vedettes, et l'écran de la télé (pour ce qu'elle regarde)");
await appeler(lea, { action: "fabriquer", piece: "tele" });
ia = (await toutIA()).slice(avantTele);
ok(ia.some((c) => c.startsWith("VIDEO ") && c.includes("the television screen stays dark and perfectly still") && c.includes("fish swim")), "dans la vidéo : les poissons nagent, l'écran reste noir");

// ─── 🏠 « Ma maison » : ses pièces prêtes (`/api/direct/mes-pieces`) ───
const mesPieces = async (cookie) => {
  const r = await fetch(`${BASE}/api/direct/mes-pieces`, { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const mp = await mesPieces(lea);
const [salon, tele] = mp.pieces ?? [];
ok(mp.statut === 200 && mp.pieces?.length === 2 && salon?.piece === "salon" && salon.nom === "Le salon" && /^http/.test(salon.vue ?? "") && /^http/.test(salon.video ?? "") && salon.objets?.objets?.length === 3 && salon.vedettes?.length === 3, "🏠 ses pièces pour « Ma maison » : le salon (sa vue, sa vidéo, ses vedettes repérées)");
ok(tele?.piece === "tele" && tele.nom === "La pièce télé" && !tele.video && tele.objets?.ecran?.l === 20, "la pièce télé : sa vue et ses vedettes (sa vidéo n'est pas encore faite)");
ok((await mesPieces(sam)).pieces?.length === 0, "Sam : aucune pièce");

// ─── refaire ───
const r1 = await appeler(lea, { action: "refaire", etape: "video" });
ok(r1.statut === 200 && r1.etat?.faites?.join() === "image,objets" && (await octets(`${D}/salon/video.mp4`)) === null, "refaire la vidéo : elle seule s'efface");
const r2 = await appeler(lea, { action: "refaire", etape: "image" });
ok(r2.etat?.faites?.length === 0 && (await octets(`${D}/salon/vue.webp`)) === null && (await octets(`${D}/salon/objets.json`)) === null, "refaire l'image : tout s'efface");
ok((await appeler(lea, { action: "refaire", etape: "panorama" })).statut === 400, "une étape inconnue : refusée");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
