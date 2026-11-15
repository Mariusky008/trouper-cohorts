// 🛋️ LA PIÈCE DU DUO — LA MAQUETTE, PAR SA ROUTE (`app/api/admin/direct/piece-vivante`, `lib/direct/pieces-duo-collage-serveur.ts`,
// `docs/univers/piece-du-duo.md`, section 11) — contre le faux Supabase et son faux moteur d'image, jamais la vraie base,
// jamais OpenAI.
//
// Réservé à l'administrateur. Sans duo choisi dans l'essai du collage : les pièces, pas de duo, et rien à fabriquer. Le duo
// choisi (Léa, de ce téléphone, et une volontaire du lot 0) : ses deux prénoms (« Toi » pour ce téléphone), le moment de
// l'heure à Paris. Le salon au soir, à sa première visite : la pose de Léa, celle de la volontaire, puis le duo (un masque),
// puis plus rien ; le salon au matin : le duo seul (les poses servent à toutes les pièces) ; une lumière pas faite, une pièce
// inconnue : refusées ; les images faites, par « pièce-moment ».
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-piece-vivante-route.mjs
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000d01", jeton: "jeton-lea-vivante-0000000001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;

// ─── Léa (sa figurine assise), une volontaire du lot 0, le salon (au soir, et au matin), ses places ───
const maintenant = new Date().toISOString();
const PNG = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 200, g: 140, b: 90, alpha: 1 } } }).png().toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, PNG, "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
const L0 = "essais-univers";
await json(`${L0}/personnes/vvvvvvvvvvv3.json`, { id: "vvvvvvvvvvv3", nom: "Volontaire 3", accordLe: maintenant, le: maintenant, traits: null });
await json(`${L0}/resultats/aimeeaimee03.json`, { id: "aimeeaimee03", personne: "vvvvvvvvvvv3", type: "figurine", variante: "sculptee", avis: "oui", etat: "fait", qualite: "high", taille: "1024x1536", le: maintenant, consigne: "…" });
await deposer(`${L0}/resultats/aimeeaimee03.png`, PNG, "image/png");
await deposer("pieces-duo/salon/decor.png", PNG, "image/png");
await deposer("pieces-duo/salon/lumiere-matin.png", PNG, "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.36, y: 0.7, hauteur: 0.3 }, { x: 0.64, y: 0.7, hauteur: 0.3 }] } });

const ROUTE = `${BASE}/api/admin/direct/piece-vivante`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appeler(`clikme_habitant=${LEA.jeton}`, { action: "duo", piece: "salon", moment: "soir" })).statut === 403, "l'administrateur seulement");
ok((await appeler(lea, { action: "danser" })).statut === 400, "une action inconnue : refusée");

// ─── sans duo choisi ───
const e0 = await appeler(lea);
ok(e0.statut === 200 && e0.etat?.duo === null && e0.etat.pieces?.find((x) => x.cle === "salon")?.decor && ["matin", "soir", "nuit"].includes(e0.etat.maintenant), "sans duo choisi dans l'essai du collage : les pièces, pas de duo ; le moment de l'heure à Paris");
ok((await appeler(lea, { action: "duo", piece: "salon", moment: "soir" })).error?.includes("Choisis d’abord vos deux figurines"), "rien à fabriquer sans duo");

// ─── le duo choisi (l'essai du collage) ───
await json("pieces-duo/collage/choix.json", { piece: "salon", a: "moi", b: "aimeeaimee03" });
const e1 = await appeler(lea);
ok(e1.etat?.duo?.a?.id === "moi" && e1.etat.duo.a.nom === "Toi" && e1.etat.duo.b.nom === "Volontaire 3" && Object.keys(e1.etat.duo.duos).length === 0, "le duo : « Toi » (ce téléphone) et la volontaire ; aucune image encore");

// ─── la première visite du salon au soir : les deux poses, puis le duo ───
const avant = (await toutIA()).length;
const f1 = await appeler(lea, { action: "duo", piece: "salon", moment: "soir" });
const f2 = await appeler(lea, { action: "duo", piece: "salon", moment: "soir" });
const f3 = await appeler(lea, { action: "duo", piece: "salon", moment: "soir" });
ok(f1.fait === "pose-a" && f2.fait === "pose-b" && f3.fait === "duo", "le salon au soir : la pose de Léa, celle de la volontaire, puis le duo");
ok(/^http/.test(f3.etat?.duo?.duos?.["salon-soir"] ?? "") && !f3.etat.duo.duos["salon-matin"], "son image, signée (« salon-soir »)");
const ia = (await toutIA()).slice(avant);
ok(ia.filter((c) => c.startsWith("IMAGE ")).length === 3 && ia.filter((c) => c.startsWith("MASQUE ")).length === 1, "trois images (deux poses, un duo peint avec un masque)");
ok((await appeler(lea, { action: "duo", piece: "salon", moment: "soir" })).fait === undefined, "déjà faite : plus rien");

// ─── le salon au matin : le duo seul ───
const avantM = (await toutIA()).length;
const fm = await appeler(lea, { action: "duo", piece: "salon", moment: "matin" });
ok(fm.fait === "duo" && /^http/.test(fm.etat?.duo?.duos?.["salon-matin"] ?? "") && (await toutIA()).slice(avantM).filter((c) => c.startsWith("IMAGE ")).length === 1, "le salon au matin : le duo seul (les poses servent à toutes les pièces)");

// ─── les refus ───
ok((await appeler(lea, { action: "duo", piece: "salon", moment: "nuit" })).error?.includes("pas encore faite"), "une lumière pas faite : refusée");
ok((await appeler(lea, { action: "duo", piece: "grenier", moment: "soir" })).statut === 502 && (await appeler(lea, { action: "duo", piece: "salon", moment: "midi" })).statut === 502, "une pièce ou une lumière inconnue : refusée");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
