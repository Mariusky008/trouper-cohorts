// 🧹 REMETTRE L'APPLI À ZÉRO, PAR LES ROUTES — contre le faux Supabase, jamais la vraie base
// (`lib/direct/remise-a-zero-serveur.ts`, `app/api/admin/direct/remise-a-zero`).
//
// Réservé à l'administrateur. Léa et Hugo ont leurs comptes, leurs figurines, une carte de fidélité, leurs fichiers ; un
// commerçant a sa vitrine et ses mèmes. Le compte : rien n'est effacé. Sans « EFFACER » : rien. Avec : les fichiers des
// comptes partent (leurs dossiers, les profils, les fils, l'index des univers publics, le seau de leurs maisons), puis
// toutes leurs lignes ; restent le commerçant (sa vitrine, ses mèmes), Pablito, les essais du lot 0, les lieux publics.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-remise-a-zero-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lignes = async (t) => (await (await fetch(`${F}/${t}`)).json()) ?? [];
const deposer = (seau, chemin) => fetch(`${STOCK}/${seau}/${chemin}`, { method: "POST", headers: { "content-type": "application/octet-stream" }, body: "x" });
const existe = async (seau, chemin) => (await fetch(`${STOCK}/${seau}/${chemin}`)).status === 200;

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);

const LEA = "abababab-0000-4000-8000-000000000e01";
const HUGO = "abababab-0000-4000-8000-000000000e02";
const SITE = "cdcdcdcd-0000-4000-8000-000000000e09";
const maintenant = new Date().toISOString();
await semer("human_habitants", [
  { id: LEA, device_token: "jeton-lea-remise-000000001", prenom: "Léa", ville_slug: "dax" },
  { id: HUGO, device_token: "jeton-hugo-remise-00000001", prenom: "Hugo", ville_slug: "lyon" },
]);
await semer("human_vitrine_sites", [{ id: SITE, slug: "atelier-remise", business_name: "L’Atelier", city: "40100 Dax", est_client: true }]);
await semer("clik_ma_figurine", [LEA, HUGO].map((h) => ({ habitant_id: h, prenom: "Essai", neutre: `${h}/n.webp`, parle: `${h}/p.webp`, prete_le: maintenant })));
await semer("clik_cage", [{ site_id: SITE, habitant_id: LEA, film: "essai" }]);
await semer("clik_voeu", [{ id: "voeuremise01", habitant_id: HUGO, texte: "Courir un marathon" }]);
const FIGS = "figurines-clients";
const aEffacer = [
  [FIGS, `${LEA}/perso/v1/assise.png`],
  [FIGS, `${LEA}/monde/v1/decor.png`],
  [FIGS, `${HUGO}/expr-0123/joie-n.webp`],
  [FIGS, "profils/0123456789abcdef.json"],
  [FIGS, `fils/${LEA}_${HUGO}/m/1-a-x.json`],
  [FIGS, "univers/publics.json"],
  ["maison-privee", `${LEA}/photo.jpg`],
];
const aGarder = [
  [FIGS, "demo-proprio/univers/base/neutre.webp"],
  [FIGS, "demo-proprio/v1/expr/joie-n.webp"],
  [FIGS, "essais-univers/personnes.json"],
  [FIGS, "lieux-publics/dax.json"],
  ["figurines-pros", "memes/atelier-remise.json"],
];
for (const [seau, chemin] of [...aEffacer, ...aGarder]) await deposer(seau, chemin);

const ROUTE = `${BASE}/api/admin/direct/remise-a-zero`;
const appeler = async (corps, cookie = COOKIE_ADMIN) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ═══ RÉSERVÉ À L'ADMIN ═══
ok((await appeler(null, "clikme_habitant=jeton-lea-remise-000000001")).statut === 403 && (await appeler({ confirmation: "EFFACER" }, "")).statut === 403, "réservé à l'administrateur");

// ═══ LE COMPTE : rien n'est effacé ═══
const c0 = await appeler();
const t0 = Object.fromEntries((c0.compte?.tables ?? []).map((t) => [t.table, t.lignes]));
const f0 = Object.fromEntries((c0.compte?.fichiers ?? []).map((f) => [f.seau, f]));
ok(c0.statut === 200 && t0.human_habitants === 2 && t0.clik_ma_figurine === 2 && t0.clik_cage === 1 && t0.clik_voeu === 1, `le compte : 2 comptes, 2 figurines, une carte, un vœu (${JSON.stringify(t0).slice(0, 120)})`);
ok(f0[FIGS]?.n === 6 && f0["maison-privee"]?.n === 1 && ["demo-proprio", "essais-univers", "lieux-publics"].every((d) => f0[FIGS].gardes.includes(d)), `les fichiers : 6 dans le seau des figurines (Pablito, les essais, les lieux publics gardés), 1 maison (${f0[FIGS]?.n}, ${f0[FIGS]?.gardes})`);
ok((await lignes("human_habitants")).length === 2 && (await existe(FIGS, `${LEA}/perso/v1/assise.png`)), "compter n'efface rien");

// ═══ SANS LA CONFIRMATION : rien ═══
const sans = await appeler({ confirmation: "effacer ?" });
ok(sans.statut === 400 && (await lignes("human_habitants")).length === 2, `sans « EFFACER » : rien (${sans.error})`);

// ═══ EFFACER, PAR LOTS, JUSQU'AU BOUT ═══
let r = { reste: true };
let tours = 0;
while (r.reste && tours < 20) {
  r = await appeler({ confirmation: "EFFACER" });
  tours++;
  if (r.statut !== 200) break;
}
ok(r.statut === 200 && r.reste === false, `effacé en ${tours} lot(s)`);
ok((await lignes("human_habitants")).length === 0 && (await lignes("clik_ma_figurine")).length === 0 && (await lignes("clik_cage")).length === 0 && (await lignes("clik_voeu")).length === 0, "les comptes de l'appli et leurs lignes : partis");
ok((await lignes("human_vitrine_sites")).some((v) => v.id === SITE) && (await lignes("admins")).length === 1, "le commerçant et l'administrateur : intacts");
const restes = await Promise.all(aEffacer.map(([s, c]) => existe(s, c)));
ok(restes.every((x) => !x), `leurs fichiers : partis (${aEffacer.filter((_, i) => restes[i]).map(([, c]) => c).join(", ") || "aucun reste"})`);
const gardes = await Promise.all(aGarder.map(([s, c]) => existe(s, c)));
ok(gardes.every(Boolean), `Pablito, les essais du lot 0, les lieux publics, les mèmes du commerçant : gardés (${aGarder.filter((_, i) => !gardes[i]).map(([, c]) => c).join(", ") || "tous là"})`);
const c1 = await appeler();
ok((c1.compte?.tables ?? []).every((t) => !t.lignes) && (c1.compte?.fichiers ?? []).every((f) => f.n === 0), "recompté : il ne reste rien à effacer");

console.log(echecs ? `\n${echecs} échec(s)` : "\nla remise à zéro tient ✓");
process.exit(echecs ? 1 : 0);
