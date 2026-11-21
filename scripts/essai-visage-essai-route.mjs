// 📷 « TA FIGURINE, C'EST TON VISAGE » — L'ESSAI, PAR LES ROUTES (le lot V0 ; `lib/direct/visage-essai-serveur.ts`,
// `app/api/admin/direct/visage-essai`, `app/api/direct/visage-essai` ; `docs/univers/decouvrir.md`, section 28) — contre
// le faux Supabase et le faux moteur d'image (jamais la vraie base, jamais le vrai moteur, jamais un vrai visage).
//
// L'administrateur seul. Ajouter une personne : un prénom, une photo, son accord (sans accord, sans photo, sans prénom :
// refusé ; six au plus). « Fabriquer » : sa figurine (d'après la photo, qui s'efface aussitôt), sa découpe (le corps, la
// tête, ses repères), puis ses cinq expressions — la tête seulement, « la tête exactement à la même place », découpée au
// même endroit que la tête habituelle (la même taille). Un passage de plus : rien. Le salon d'essai : les figurines
// prêtes seulement, « moi » d'abord, ses cinq expressions à adresse stable, une vidéo pour commencer (l'humour du jour).
// « C'est moi » change de personne ; refaire les expressions ; tout effacer.
import sharp from "sharp";

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

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
const LEA = { id: "7e7e7e7e-0000-4000-8000-0000007e1001", jeton: "jeton-visage-essai-route-01", prenom: "Léa" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: LEA.prenom, ville_slug: "dax" }]);
// (l'humour du jour : la vidéo pour commencer)
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
await json(`decouvrir/selection/${jour}/humour.json`, { videos: [{ id: "abcdefghijk", titre: "Un sketch", chaine: "La chaîne d'essai", duree: 200 }], le: new Date().toISOString() });

const ROUTE = "/api/admin/direct/visage-essai";
const appel = async (chemin, corps, cookie = COOKIE_ADMIN) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const admin = (corps) => appel(ROUTE, corps);
// (une photo : un rectangle de couleur, jamais un visage)
const photo = async (couleur) => `data:image/jpeg;base64,${(await sharp({ create: { width: 600, height: 800, channels: 3, background: couleur } }).jpeg().toBuffer()).toString("base64")}`;
const personne = (etat, prenom) => etat?.personnes?.find((p) => p.prenom === prenom);

// ═══ L'ADMINISTRATEUR SEUL ═══
ok((await appel(ROUTE, null, `clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appel(ROUTE, { action: "ajouter" }, "")).statut === 403 && (await appel("/api/direct/visage-essai", null, `clikme_habitant=${LEA.jeton}`)).statut === 403, "sans être administrateur : refusé (l'atelier comme le salon)");
const e0 = (await admin()).etat;
ok(e0?.personnes?.length === 0 && e0.moteurs?.image === true, "personne encore ; le moteur d'image branché");

// ═══ AJOUTER ═══
const pLea = await photo("#c0392b");
ok((await admin({ action: "ajouter", prenom: "Léa", photo: pLea })).statut === 400, "sans son accord : refusé");
ok((await admin({ action: "ajouter", prenom: "Léa", photo: "data:image/png;base64,AAAA", accord: true })).statut === 400 && (await admin({ action: "ajouter", prenom: "", photo: pLea, accord: true })).statut === 400 && (await admin({ action: "ajouter", prenom: "Un prénom bien trop long pour l'essai", photo: pLea, accord: true })).statut === 400, "une photo illisible, sans prénom, un prénom trop long : refusés");
const a1 = await admin({ action: "ajouter", prenom: "Léa", photo: pLea, accord: true, moi: true });
const a2 = await admin({ action: "ajouter", prenom: "Sam", photo: await photo("#2a6fb0"), accord: true });
ok(a1.statut === 200 && /^[0-9a-f]{12}$/.test(a1.id ?? "") && a2.statut === 200, "Léa (« c'est moi ») et Sam : ajoutés");
const L1 = personne(a2.etat, "Léa");
ok(L1?.moi === true && L1.photo === true && L1.faites.length === 0 && personne(a2.etat, "Sam")?.moi === false, "… sa photo rangée, rien de fait ; Léa, c'est moi");
for (const p of ["Ana", "Ben", "Cléo", "Dan"]) await admin({ action: "ajouter", prenom: p, photo: await photo("#777777"), accord: true });
ok((await admin({ action: "ajouter", prenom: "Éva", photo: await photo("#777777"), accord: true })).statut === 400, "six personnes au plus");
for (const p of ["Ana", "Ben", "Cléo", "Dan"]) await admin({ action: "effacer", id: personne((await admin()).etat, p)?.id });

// ═══ FABRIQUER : SA FIGURINE, SA DÉCOUPE, SES CINQ EXPRESSIONS ═══
const avantIA = (await toutIA()).length;
const f1 = await admin({ action: "fabriquer", id: a1.id });
ok(f1.statut === 200 && f1.fait === "figurine" && personne(f1.etat, "Léa")?.figurine && personne(f1.etat, "Léa").photo === false && !(await lire(`essais-visage/${a1.id}/photo.jpg`)), `« Fabriquer » : sa figurine — et sa photo s'efface (${f1.statut} ${f1.error ?? ""})`);
const c1 = (await toutIA()).slice(avantIA).find((c) => c.startsWith("IMAGE ")) ?? "";
ok(/COLLECTIBLE CARICATURE FIGURINE/.test(c1), "… dans le style des figurines (la consigne de la figurine sculptée)");
const f2 = await admin({ action: "fabriquer", id: a1.id });
const r2 = JSON.parse((await lire(`essais-visage/${a1.id}/reperes.json`))?.toString() || "{}");
ok(f2.fait === "calques" && personne(f2.etat, "Léa")?.tete && Array.isArray(r2.boite) && r2.boite.length === 4 && r2.tetePx?.length === 4 && r2.reperes?.tete?.length === 4 && r2.taille?.length === 2, "encore : sa découpe — le corps, la tête, ses repères, et où le corps a été découpé");
const faites = [];
const avantExpr = (await toutIA()).length;
for (let k = 0; k < 5; k++) faites.push((await admin({ action: "fabriquer", id: a1.id })).fait);
ok(faites.join() === "sourire,rire,surprise,bof,grimace", `puis ses cinq expressions, une par passage (${faites.join(", ")})`);
const consignes = (await toutIA()).slice(avantExpr).filter((c) => c.startsWith("IMAGE "));
ok(consignes.length === 5 && consignes.every((c) => /EXACTLY THE SAME FIGURINE/.test(c) && /The head keeps EXACTLY the same position, size and angle/.test(c)) && /SMILE/.test(consignes[0]) && /LAUGHTER/.test(consignes[1]) && /SURPRISE/.test(consignes[2]) && /UNIMPRESSED/.test(consignes[3]) && /GRIMACE/.test(consignes[4]), "… chacune sur la même figurine, le visage seulement, la tête à la même place");
const tete = await sharp(await lire(`essais-visage/${a1.id}/tete.png`)).metadata();
const rire = await sharp(await lire(`essais-visage/${a1.id}/tete-rire.png`)).metadata();
ok(rire.width === tete.width && rire.height === tete.height && rire.hasAlpha, `… sa tête découpée au même endroit, de la même taille (${rire.width} × ${rire.height})`);
// (📷 21 novembre 2026 : le faux moteur décale le cadrage des expressions, comme le vrai parfois — la tête est recalée)
const alphas = async (chemin) => {
  const { data, info } = await sharp(await lire(chemin)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { a: Array.from({ length: info.width * info.height }, (_, i) => data[i * 4 + 3]), w: info.width, h: info.height };
};
const aT = await alphas(`essais-visage/${a1.id}/tete.png`);
const aR = await alphas(`essais-visage/${a1.id}/tete-rire.png`);
const differents = aT.a.filter((v, i) => i < aT.w * (aT.h - 3) && Math.abs(v - aR.a[i]) > 40).length;
ok(differents <= aT.w * aT.h * 0.02, `… recalée : le cadrage de l'expression a bougé, sa tête colle quand même à la tête habituelle (${differents} points différents sur ${aT.w * aT.h})`);
ok(Boolean(await lire(`essais-visage/${a1.id}/expression-rire.png`)), "… l'expression entière est gardée (pour redécouper sans le moteur)");
const cst = await alphas(`essais-visage/${a1.id}/corps-sans-tete.png`);
const [tpx, tpy, tpw, tph] = r2.tetePx;
let resteTete = 0;
for (let y = tpy; y < tpy + Math.round(tph * 0.88); y++) for (let x = tpx; x < tpx + tpw; x++) resteTete += cst.a[y * cst.w + x] > 0 ? 1 : 0;
const corpsA = await alphas(`essais-visage/${a1.id}/corps.png`);
ok(resteTete === 0 && cst.w === corpsA.w && cst.a.filter((v) => v > 0).length > 0, "le corps sans sa tête : le haut de la boîte de la tête effacé, le reste du corps là (rien ne double sous une expression)");
const f8 = await admin({ action: "fabriquer", id: a1.id });
const L8 = personne(f8.etat, "Léa");
ok(f8.statut === 200 && !f8.fait && L8?.faites.length === 7 && Object.keys(L8.expressions).length === 5, "un passage de plus : rien — les sept étapes faites, les cinq expressions");

// ═══ LE SALON D'ESSAI ═══
const s1 = (await appel("/api/direct/visage-essai")).salon;
const fl = s1?.figurines?.[0];
ok(s1?.figurines?.length === 1 && fl?.prenom === "Léa" && fl.moi === true, "le salon d'essai : les figurines prêtes seulement (Sam n'a rien de fait)");
ok(/^\/api\/direct\/salon\/fichier\//.test(fl?.corps?.src ?? "") && fl.tete?.boite?.length === 4 && fl.tete.pivot?.length === 2 && Object.keys(fl.expressions).length === 5 && Object.values(fl.expressions).every((x) => /^\/api\/direct\/salon\/fichier\//.test(x.src)), "… son corps, sa tête (sa boîte, son pivot), ses cinq expressions à adresse stable");
ok(s1.video === "abcdefghijk" && s1.places?.length === 8 && s1.gradin === null, "… une vidéo pour commencer (l'humour du jour), les huit places du plan (pas de gradin validé)");
for (let k = 0; k < 7; k++) await admin({ action: "fabriquer", id: a2.id });
const s2 = (await appel("/api/direct/visage-essai")).salon;
ok(s2?.figurines?.map((f) => f.prenom).join() === "Léa,Sam", "Sam fabriqué : « moi » d'abord, puis Sam");
const m1 = await admin({ action: "moi", id: a2.id });
ok(personne(m1.etat, "Sam")?.moi === true && personne(m1.etat, "Léa")?.moi === false && (await appel("/api/direct/visage-essai")).salon?.figurines?.[0]?.prenom === "Sam", "« C'est moi » : Sam, à la place de Léa (une seule à la fois)");

// ═══ REFAIRE, EFFACER ═══
// (« Refaire la découpe » : les expressions entières restent — leurs têtes se redécoupent, sans le moteur)
const x0 = await admin({ action: "refaire", id: a1.id, quoi: "calques" });
ok(x0.statut === 200 && personne(x0.etat, "Léa")?.faites.join() === "figurine" && !(await lire(`essais-visage/${a1.id}/corps-sans-tete.png`)) && Boolean(await lire(`essais-visage/${a1.id}/expression-rire.png`)), "« Refaire la découpe » : sa découpe et ses têtes effacées, ses expressions entières gardées");
const avantRedecoupe = (await toutIA()).filter((c) => c.startsWith("IMAGE ")).length;
const refaites = [];
for (let k = 0; k < 6; k++) refaites.push((await admin({ action: "fabriquer", id: a1.id })).fait);
ok(refaites.join() === "calques,sourire,rire,surprise,bof,grimace" && (await toutIA()).filter((c) => c.startsWith("IMAGE ")).length === avantRedecoupe && Boolean(await lire(`essais-visage/${a1.id}/corps-sans-tete.png`)), `… redécoupée : sa découpe, puis ses cinq têtes, sans repasser par le moteur (${refaites.join(", ")})`);
const x1 = await admin({ action: "refaire", id: a1.id, quoi: "expressions" });
ok(x1.statut === 200 && Object.keys(personne(x1.etat, "Léa")?.expressions ?? {}).length === 0 && personne(x1.etat, "Léa").faites.length === 2 && !(await lire(`essais-visage/${a1.id}/expression-rire.png`)), "« Refaire les expressions » : effacées (entières aussi : le moteur les refera), sa figurine et sa découpe restent");
ok((await admin({ action: "refaire", id: a1.id, quoi: "tout" })).statut === 400 && (await admin({ action: "fabriquer", id: "pas-un-id" })).statut === 400 && (await admin({ action: "danser", id: a1.id })).statut === 400, "refaire autre chose, une personne inconnue, une action inconnue : refusés");
const x2 = await admin({ action: "effacer", id: a1.id });
ok(x2.statut === 200 && !personne(x2.etat, "Léa") && !(await lire(`essais-visage/${a1.id}/figurine.png`)) && !(await lire(`essais-visage/${a1.id}/fiche.json`)), "« Effacer » : tout s'efface");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
