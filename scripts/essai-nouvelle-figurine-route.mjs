// 🧸 LA NOUVELLE FIGURINE (« Univers », lot 2), PAR LES ROUTES — contre le faux Supabase et son faux moteur d'image,
// jamais la vraie base, jamais OpenAI (`lib/direct/nouvelle-figurine-serveur.ts`, `app/api/direct/nouvelle-figurine`).
//
// Réservée au propriétaire : personne d'autre n'y entre. Lui, sans compte sur ce téléphone : le selfie. Sans « C'est
// bien moi » ni ses 15 ans, ou sans photo : rien. Son selfie : un compte posé sur ce téléphone, son âge noté, sa
// première proposition faite après la réponse (la consigne « Sculptée, détourée », fond transparent, réglage fidèle,
// signée). Une retouche avec ses mots (« les cheveux plus courts ») : sur la proposition, la même figurine, seule la
// chose demandée change ; des mots qui ne passent pas, ou d'alcool : refusés. « Elle ne me ressemble pas » : une
// nouvelle, d'après le selfie. « C'est moi ! » : sa fiche est une version validée du nouveau style (la retouche
// comprise, refaisable à l'identique), puis sa bouche ouverte et debout arrivent. Douze propositions par jour au plus.
// Un nouveau selfie après validation : il en refait une.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-nouvelle-figurine-route.mjs          (sur un faux Supabase tout neuf)
import { readFileSync } from "node:fs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};
const ecrire = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const consignes = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("IMAGE "));

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
const LEA = { id: "abababab-0000-4000-8000-000000000501", jeton: "jeton-lea-nouvelle-0000000001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);

const ROUTE = `${BASE}/api/direct/nouvelle-figurine`;
let cookies = COOKIE_ADMIN;
const appeler = async (corps, cookie = cookies) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  const pose = /clikme_habitant=([^;]+)/.exec(r.headers.get("set-cookie") ?? "");
  if (pose && cookie === cookies) cookies = `${COOKIE_ADMIN}; clikme_habitant=${pose[1]}`;
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const attendre = async (condition, ms = 30000) => {
  const fin = Date.now() + ms;
  let e = await appeler();
  while (!condition(e) && Date.now() < fin) {
    await new Promise((ok) => setTimeout(ok, 400));
    e = await appeler();
  }
  return e;
};
const PHOTO = `data:image/webp;base64,${readFileSync("public/direct/double/content.webp").toString("base64")}`;

// ═══ RÉSERVÉE AU PROPRIÉTAIRE ═══
ok((await appeler(null, "")).statut === 403 && (await appeler({ action: "selfie", photo: PHOTO, moi: true, age: true }, `clikme_habitant=${LEA.jeton}`)).statut === 403, "réservée au propriétaire : personne d'autre n'y entre");
ok((await fetch(`${BASE}/univers/figurine`, { redirect: "manual" })).status !== 200, "l'adresse d'essai renvoie qui n'est pas administrateur");

// ═══ LE SELFIE ═══
const e0 = await appeler();
ok(e0.etape === "selfie" && e0.branche === true && e0.restantes === 12, `sans compte sur ce téléphone : le selfie, le moteur branché, douze essais (${e0.etape})`);
ok((await appeler({ action: "selfie", photo: PHOTO, moi: false, age: true })).statut === 400 && (await appeler({ action: "selfie", photo: PHOTO, moi: true, age: false })).statut === 400, "sans « C'est bien moi » ou sans ses 15 ans : rien");
ok((await appeler({ action: "selfie", photo: "pas une image", moi: true, age: true })).statut === 400, "sans photo : rien");
const s1 = await appeler({ action: "selfie", photo: PHOTO, moi: true, age: true });
ok(s1.statut === 200 && /^[a-z0-9]{12}$/.test(s1.id ?? "") && cookies.includes("clikme_habitant="), "son selfie : un compte sur ce téléphone, sa première proposition demandée");
const e1 = await attendre((e) => e.etape === "decouverte");
const p1 = e1.propositions?.[0];
ok(e1.etape === "decouverte" && p1?.etat === "fait" && /^http/.test(p1.image ?? "") && e1.restantes === 11, `faite après la réponse : la découverte, son image (${e1.etape}, ${p1?.etat}, ${e1.restantes} restantes)`);
const jeton = /clikme_habitant=([^;]+)/.exec(cookies)[1];
const h = (await (await fetch(`${F}/human_habitants?device_token=eq.${jeton}&select=id`)).json())[0]?.id;
const brouillon = h ? await lire(`${h}/perso/brouillon.json`) : null;
const sig1 = brouillon?.propositions?.[0]?.signature;
ok(Boolean(h) && brouillon?.selfie?.startsWith(`${h}/perso/selfie-`) && sig1?.entrees?.[0] === brouillon.selfie && sig1.fond === "transparent" && sig1.consigne.includes("RE-SCULPTED, NEVER COPIED"), "son selfie rangé chez lui ; la proposition signée (la consigne, son selfie en entrée, fond transparent)");
ok(Boolean((await lire(`${h}/majeur.json`))?.le), "ses 15 ans notés");
const c1 = (await consignes()).at(-1) ?? "";
ok(c1.startsWith("IMAGE chatgpt-image-latest transparent high ") && c1.includes("COLLECTIBLE CARICATURE FIGURINE") && c1.includes("armchair"), "la consigne « Sculptée, détourée » : fond transparent, réglage fidèle, assise dans son fauteuil");

// ═══ LES RETOUCHES ═══
ok((await appeler({ action: "retoucher", de: p1.id, demande: "un verre de vin à la main" })).statut === 400 && (await appeler({ action: "retoucher", de: p1.id, demande: "ok" })).statut === 400, "des mots d'alcool, ou trop courts : refusés");
ok((await appeler({ action: "retoucher", de: "zzzzzzzzzzzz", demande: "les cheveux plus courts" })).statut === 404, "une proposition qui n'existe pas : refusée");
const r2 = await appeler({ action: "retoucher", de: p1.id, demande: "les cheveux plus courts" });
const e2 = await attendre((e) => e.propositions?.[0]?.id === r2.id && e.propositions[0].etat === "fait");
ok(e2.propositions?.[0]?.demande === "les cheveux plus courts" && e2.propositions.length === 2, "une retouche avec ses mots : une nouvelle proposition, sur la précédente");
const c2 = (await consignes()).at(-1) ?? "";
ok(c2.includes("EXACTLY THE SAME FIGURINE") && c2.includes("« les cheveux plus courts »") && c2.startsWith("IMAGE chatgpt-image-latest transparent high "), "la consigne : la même figurine, seule la chose demandée change");
const b2 = await lire(`${h}/perso/brouillon.json`);
ok(b2?.propositions?.[1]?.signature?.entrees?.[0] === `${h}/perso/images/${p1.id}.png`, "elle part de l'image de la proposition d'avant");
const r3 = await appeler({ action: "refaire" });
const e3 = await attendre((e) => e.propositions?.[0]?.id === r3.id && e.propositions[0].etat === "fait");
ok(e3.propositions?.[0]?.etat === "fait" && !e3.propositions[0].demande && (await consignes()).at(-1).includes("RE-SCULPTED"), "« Elle ne me ressemble pas » : une nouvelle, d'après le selfie");

// ═══ « C'EST MOI ! » ═══
const v = await appeler({ action: "valider", id: r2.id });
ok(v.statut === 200 && v.version === 1, `« C'est moi ! » : sa fiche, version 1 (${v.statut}, v${v.version})`);
const e4 = await attendre((e) => e.etape === "validee" && e.figurine && !e.figurine.enCours && e.figurine.images.debout);
ok(e4.etape === "validee" && ["assise", "assise_parle", "debout"].every((n) => /^http/.test(e4.figurine?.images?.[n] ?? "")), "validée : sa bouche ouverte et debout arrivent");
const ia = await consignes();
ok(ia.some((c) => c.includes("Change ONLY this: its mouth is now open")) && ia.some((c) => c.includes("STANDING upright")), "ses deux autres images : la même figurine, la bouche ouverte, puis debout");
const fiche = await lire(`${h}/perso/fiche.json`);
ok(fiche?.version === 1 && fiche.style === "collection-1" && Boolean(fiche.validee_le) && fiche.retouches?.join() === "les cheveux plus courts" && fiche.fauteuil?.de === "depart" && fiche.photo?.chemin === brouillon.selfie, "sa fiche : le nouveau style, validée, sa retouche, son fauteuil de départ, son selfie");
const perso = await (await fetch(`${BASE}/api/direct/perso`, { headers: { cookie: cookies } })).json();
ok(perso.origine === "rangee" && perso.fiche?.complete === true && perso.fiche.style === "collection-1", "ce qu'il voit de sa fiche : complète, du nouveau style");
const admin = await (await fetch(`${BASE}/api/admin/direct/fiches?h=${h}`, { headers: { cookie: COOKIE_ADMIN } })).json();
ok(Object.values(admin.perso?.refaisables ?? {}).length === 3 && Object.values(admin.perso.refaisables).every(Boolean), "ses trois images, refaisables à l'identique (la retouche comprise)");

// ═══ LES PLAFONDS, UN NOUVEAU SELFIE ═══
await ecrire(`${h}/perso/brouillon.json`, { ...(await lire(`${h}/perso/brouillon.json`)), faites: 12 });
ok((await appeler({ action: "refaire" })).statut === 429, "douze propositions dans la journée : c'est assez");
await ecrire(`${h}/perso/brouillon.json`, { ...(await lire(`${h}/perso/brouillon.json`)), faites: 3 });
await appeler({ action: "selfie", photo: PHOTO, moi: true, age: true });
const e5 = await attendre((e) => e.etape === "decouverte");
ok(e5.etape === "decouverte" && (await lire(`${h}/perso/fiche.json`))?.version === 1, "un nouveau selfie après validation : il en refait une (sa version 1 reste)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nla nouvelle figurine tient ✓");
process.exit(echecs ? 1 : 0);
