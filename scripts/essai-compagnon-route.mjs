// 🐾 LE COMPAGNON — L'ESSAI DE FABRICATION, LOT C0 (`lib/direct/compagnon-essai-serveur.ts`, `app/api/admin/direct/compagnon`)
// — contre le faux Supabase, son faux moteur d'image et son faux Google (Gemini Omni), jamais la vraie base, jamais
// OpenAI ni Google.
//
// Réservé à l'administrateur. Léa a sa figurine assise et son décor. Le chat : 1. son image de référence, un jouet de
// vinyle dans le style de SA figurine (IMAGE 1), détourée ; 2. une boucle (« dort ») : sa pose, d'après la référence
// (fidélité haute), détourée ; puis sa vidéo, commandée chez Google (9:16, 4 s, 720p, la pose sur un fond vert à
// 720 × 1280, la première et la dernière image), « en train », puis faite et rangée (les octets d'une vidéo, pas la fiche
// du fichier) ; une boucle avant la référence : refusée ; refaire la vidéo : elle seule ; refaire la référence : tout.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-compagnon-route.mjs
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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000e01", jeton: "jeton-lea-compagnon-00000001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);

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
  elements: [],
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

const ROUTE = `${BASE}/api/admin/direct/compagnon`;
const appeler = async (cookie, corps, q = "") => {
  const r = await fetch(`${ROUTE}${q}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const D = "compagnons/chat";

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN)).statut === 400, "sans figurine sur ce téléphone : rien");
ok((await appeler(lea, null, "?espece=renard")).statut === 400 && (await appeler(lea, { action: "fabriquer", espece: "renard", cible: "reference" })).statut === 400, "une espèce inconnue : refusée");
ok((await appeler(lea, { action: "fabriquer", espece: "chat", cible: "danse" })).statut === 400 && (await appeler(lea, { action: "danser", espece: "chat", cible: "reference" })).statut === 400, "une boucle ou une action inconnue : refusée");
const e0 = await appeler(lea, null, "?espece=chat");
ok(
  e0.statut === 200 && e0.etat?.espece === "chat" && e0.etat.boucles?.length === 8 && !e0.etat.reference && e0.etat.moteurs?.image === true && e0.etat.moteurs.video === true && /^http/.test(e0.etat.decor ?? "") && /^http/.test(e0.etat.figurine ?? "") && e0.etat.place?.x === 0.36,
  "le chat : huit boucles à faire, les moteurs branchés ; son décor, sa figurine et sa place, pour l'aperçu",
);
const avantRef = await appeler(lea, { action: "fabriquer", espece: "chat", cible: "dort" });
ok(avantRef.statut === 502 && avantRef.error?.includes("image de référence"), "une boucle avant son image de référence : « Fais d’abord son image de référence »");

// ─── 1. son image de référence ───
const avant = (await toutIA()).length;
const r1 = await appeler(lea, { action: "fabriquer", espece: "chat", cible: "reference" });
let ia = (await toutIA()).slice(avant);
ok(r1.statut === 200 && r1.fait === "reference" && /^http/.test(r1.etat?.reference ?? "") && (await octets(`${D}/reference.png`)) !== null, "1. son image de référence : faite, rangée dans le catalogue (à part de chaque habitant), signée");
ok(
  ia.length === 1 && ia[0].startsWith("IMAGE ") && ia[0].includes(" transparent low ") && ia[0].includes("Create a small companion pet for the character of IMAGE 1: a CAT") && ia[0].includes("EXACTLY the same style as IMAGE 1") && ia[0].includes("no character, no furniture"),
  `un jouet de vinyle dans le style de SA figurine (IMAGE 1), le fond retiré (${(ia[0] ?? "").slice(0, 70)}…)`,
);
ok((await appeler(lea, { action: "fabriquer", espece: "chat", cible: "reference" })).fait === undefined && (await toutIA()).length === avant + 1, "déjà faite : rien de plus");

// ─── 2. une boucle : sa pose, puis sa vidéo ───
const p1 = await appeler(lea, { action: "fabriquer", espece: "chat", cible: "dort" });
ia = (await toutIA()).slice(avant + 1);
ok(p1.fait === "pose" && ia.length === 1 && ia[0].includes(" transparent high ") && ia[0].includes("Show EXACTLY the same animal") && ia[0].includes("curled up in a ball, fast asleep"), "2. sa pose (« dort ») : le même animal, d'après la référence (fidélité haute), détourée");
ok(/^http/.test(p1.etat?.boucles?.find((b) => b.cle === "dort")?.pose ?? ""), "la pose, signée");
const v1 = await appeler(lea, { action: "fabriquer", espece: "chat", cible: "dort" });
ia = (await toutIA()).slice(avant + 2);
const commande = ia.find((c) => c.startsWith("OMNI ")) ?? "";
ok(v1.statut === 200 && v1.progres === 0 && v1.etat?.boucles?.find((b) => b.cle === "dort")?.enCours, "sa vidéo : commandée");
ok(
  commande.startsWith("OMNI gemini-omni-1.2-flash 9:16 4s 720p fond 720x1280 <FIRST_FRAME>@Image1 <LAST_FRAME>@Image1\n") && commande.includes("perfectly uniform pure green background") && commande.includes("locked-off tripod shot") && commande.includes("its belly rises and falls") && commande.includes("The last moment looks exactly like the first one"),
  `chez Google : la pose sur un fond vert (720 × 1280), la première et la dernière image ; la caméra immobile, il respire en dormant (${commande.slice(0, 60)}…)`,
);
const v2 = await appeler(lea, { action: "fabriquer", espece: "chat", cible: "dort" });
ok(typeof v2.progres === "number" && !v2.fait, `elle se fait (${v2.progres} %)`);
const v3 = await appeler(lea, { action: "fabriquer", espece: "chat", cible: "dort" });
const mp4 = await octets(`${D}/dort/video.mp4`);
ok(v3.fait === "video" && mp4?.subarray(4, 8).toString() === "ftyp" && /^http/.test(v3.etat?.boucles?.find((b) => b.cle === "dort")?.video ?? "") && !v3.etat.boucles.find((b) => b.cle === "dort").enCours, "faite : une vraie vidéo (pas la fiche du fichier), rangée, signée");
ok((await octets(`${D}/dort/video.json`)) === null && (await octets(`${D}/dort/verrou.json`)) === null && (await octets(`${D}/verrou.json`)) === null, "ni commande ni verrou ne restent");
ok((await appeler(lea, { action: "fabriquer", espece: "chat", cible: "dort" })).progres === undefined, "faite : plus rien à faire");

// ─── refaire ───
const rv = await appeler(lea, { action: "refaire", espece: "chat", cible: "dort", etape: "video" });
const dort = rv.etat?.boucles?.find((b) => b.cle === "dort");
ok(rv.statut === 200 && !dort?.video && /^http/.test(dort?.pose ?? "") && (await octets(`${D}/dort/video.mp4`)) === null, "refaire la vidéo : elle seule s'efface (la pose reste)");
const rr = await appeler(lea, { action: "refaire", espece: "chat", cible: "reference" });
ok(!rr.etat?.reference && rr.etat?.boucles?.every((b) => !b.pose && !b.video) && (await octets(`${D}/dort/pose.png`)) === null, "refaire la référence : tout s'efface (ses poses en venaient)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
