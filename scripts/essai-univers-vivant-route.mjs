// 🌟 SON UNIVERS, VIVANT — L'ESSAI (`lib/direct/univers-vivant-serveur.ts`, `app/api/admin/direct/univers-vivant`) —
// contre le faux Supabase et son faux Veo, jamais la vraie base, jamais Google.
//
// Réservé à l'administrateur, sur SON univers. Léa a sa figurine assise et son décor ; Sam n'a pas d'univers. La vidéo
// commandée (Veo « Lite », 9:16, 4 s, 720 × 1280 : le milieu de son décor ; la caméra immobile, l'espace devant vide,
// sans voix), « en train », puis faite et rangée, d'après son décor du moment (celui du mois, fait à sa première
// visite). Elle se montre dans « Ma maison » (`/api/direct/univers` : `decorVivant`) et à ses visiteurs
// (`/api/direct/visites?cle=` : `decorVivant`). Son décor change (une retouche) : elle ne se montre plus (« périmée ») ;
// la refaire : tout s'efface.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-univers-vivant-route.mjs
import crypto from "node:crypto";
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
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000c01", jeton: "jeton-lea-univers-vivant-001", prenom: "Léa" };
const SAM = { id: "aeaeaeae-0000-4000-8000-000000000c02", jeton: "jeton-sam-univers-vivant-001", prenom: "Sam" };
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await json(`profils/${cleProfil(LEA.id)}.json`, { h: LEA.id });

// ─── Léa : sa figurine assise, son univers (ouvert à tous) et son décor, en 2:3 ───
const maintenant = new Date().toISOString();
const PNG = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 200, g: 140, b: 90, alpha: 1 } } }).png().toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, PNG, "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
const DECOR = await sharp({ create: { width: 1024, height: 1536, channels: 3, background: { r: 60, g: 90, b: 120 } } }).png().toBuffer();
await deposer(`${LEA.id}/monde/v1/decor.png`, DECOR, "image/png");
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
  visibilite: "tous",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${LEA.id}/monde/v1/fiche.json`, monde);
await json(`${LEA.id}/monde/fiche.json`, monde);

const ROUTE = `${BASE}/api/admin/direct/univers-vivant`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const sam = `${COOKIE_ADMIN}; clikme_habitant=${SAM.jeton}`;
const D = `${LEA.id}/univers-vivant`;
const maMaison = async () => {
  const r = await fetch(`${BASE}/api/direct/univers`, { headers: { cookie: lea } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const visite = async () => {
  const r = await fetch(`${BASE}/api/direct/visites?cle=${cleProfil(LEA.id)}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN)).statut === 400, "sans figurine sur ce téléphone : rien");
const e0 = await appeler(lea);
ok(e0.statut === 200 && e0.etat?.univers === true && e0.etat.moteur === true && /^http/.test(e0.etat.decor ?? "") && !e0.etat.video && !e0.etat.enCours, "Léa : son décor signé, le moteur de Google branché, pas encore de vidéo");
const s0 = await appeler(sam);
ok(s0.etat?.univers === false && (await appeler(sam, { action: "fabriquer" })).error?.includes("Crée d’abord ton univers"), "Sam, sans univers : « Crée d’abord ton univers »");
ok((await appeler(lea, { action: "danser" })).statut === 400, "une action inconnue : refusée");
const m0 = await maMaison();
const v0 = await visite();
ok(m0.statut === 200 && /^http/.test(m0.decor ?? "") && !m0.decorVivant && v0.statut === 200 && v0.vue?.etat === "ouvert" && !v0.vue.decorVivant, "« Ma maison » et sa visite : le décor, immobile");

// (sa première visite du mois a fait son décor du mois, après la réponse : c'est lui, son décor du moment)
let duMois = false;
for (let k = 0; k < 40 && !duMois; k++) {
  duMois = ((await appeler(lea)).etat?.decor ?? "").includes("/monde/saisons/");
  if (!duMois) await new Promise((r) => setTimeout(r, 500));
}
ok(duMois, "🍂 son décor du mois est fait (sa première visite du mois) : c'est son décor du moment");

// ─── la vidéo : commandée, en train, faite ───
const avant = (await toutIA()).length;
const c1 = await appeler(lea, { action: "fabriquer" });
const ia = (await toutIA()).slice(avant);
const commande = ia.find((c) => c.startsWith("VEO ")) ?? "";
ok(c1.statut === 200 && c1.progres === 0 && !c1.fait && c1.etat?.enCours?.depuis, "la vidéo : commandée (rien de fait encore)");
ok(
  commande.startsWith("VEO veo-3.1-lite-generate-001 9:16 4s 720x1280 ") && commande.includes("A living photo") && commande.includes("locked-off tripod shot") && commande.includes("The open space at the bottom in the middle stays empty and perfectly still") && commande.includes("no voice"),
  `chez Veo « Lite » : 9:16, 4 s, le milieu de son décor (720 × 1280) ; la caméra immobile, l'espace devant vide, sans voix (${commande.slice(0, 48)}…)`,
);
const c2 = await appeler(lea, { action: "fabriquer" });
ok(typeof c2.progres === "number" && c2.progres < 95 && !c2.fait && c2.etat?.enCours, `elle se fait (${c2.progres} %, estimé)`);
const c3 = await appeler(lea, { action: "fabriquer" });
const mp4 = await octets(`${D}/video.mp4`);
ok(c3.fait === true && mp4?.toString() === "faux mp4 de la pièce vivante" && /^http/.test(c3.etat?.video ?? "") && !c3.etat.enCours && !c3.etat.perimee, "faite : rangée, signée");
const resteCommande = await octets(`${D}/video.json`);
const resteVerrou = await octets(`${D}/verrou.json`);
ok(resteCommande === null && resteVerrou === null, `ni commande ni verrou ne restent (${resteCommande?.toString() ?? "-"} ${resteVerrou?.toString() ?? "-"})`);
const source = (await octets(`${D}/decor.json`))?.toString() ?? "";
ok(JSON.parse(source || "{}").chemin?.startsWith(`${LEA.id}/monde/saisons/`), `le décor d'où elle vient est noté : son décor du mois (${source})`);
const c4 = await appeler(lea, { action: "fabriquer" });
ok(c4.statut === 200 && !c4.fait && c4.progres === undefined && (await toutIA()).slice(avant).filter((c) => c.startsWith("VEO ")).length === 1, "plus rien à faire (aucune autre commande)");

// ─── 🏠 « Ma maison » et ses visiteurs : son univers vit ───
const m1 = await maMaison();
const v1 = await visite();
ok(/^http/.test(m1.decorVivant ?? "") && m1.decorVivant.includes("univers-vivant/video.mp4"), "🏠 « Ma maison » : son décor, et sa vidéo par-dessus");
ok(v1.vue?.etat === "ouvert" && /^http/.test(v1.vue.decorVivant ?? "") && v1.vue.decorVivant.includes("univers-vivant/video.mp4"), "🚪 Sam, en visite : il le voit vivre aussi");

// ─── son décor change (une retouche) : elle ne se montre plus ───
await deposer(`${LEA.id}/monde/v2/decor.png`, DECOR, "image/png");
const monde2 = { ...monde, version: 2, references: { decor: { chemin: `${LEA.id}/monde/v2/decor.png` } }, historique: [...monde.historique, { version: 2, le: maintenant, raison: "une retouche", style: "film-chaleureux-1" }] };
await json(`${LEA.id}/monde/v2/fiche.json`, monde2);
await json(`${LEA.id}/monde/fiche.json`, monde2);
const p1 = await appeler(lea);
ok(p1.etat?.perimee === true && !p1.etat.video, "son décor a changé : la vidéo est « périmée », elle ne se montre plus");
ok(!(await maMaison()).decorVivant && !(await visite()).vue?.decorVivant, "ni dans « Ma maison », ni chez ses visiteurs");

// ─── la refaire ───
const r1 = await appeler(lea, { action: "refaire" });
ok(r1.statut === 200 && !r1.etat?.perimee && !r1.etat.video && (await octets(`${D}/video.mp4`)) === null && (await octets(`${D}/decor.json`)) === null, "la refaire : tout s'efface");
const avantBis = (await toutIA()).length;
const n1 = await appeler(lea, { action: "fabriquer" });
ok(n1.progres === 0 && (await toutIA()).slice(avantBis).some((c) => c.startsWith("VEO veo-3.1-lite-generate-001 9:16 4s 720x1280 ")), "et une nouvelle se commande, d'après son nouveau décor");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
