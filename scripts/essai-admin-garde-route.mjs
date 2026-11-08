// 🔐 LA GARDE DES ROUTES ADMIN — contre le faux Supabase, jamais la vraie base (`lib/supabase/server.ts`,
// `lib/admin-guard.ts`).
//
// La faille du 7 novembre 2026 : quand Supabase ne reconnaissait pas la session (`getUser()` la refuse), le serveur se
// rabattait sur `getSession()` puis sur le `sub` lu dans le cookie — SANS en vérifier la signature. Un cookie fabriqué,
// portant l'identifiant d'un administrateur, ouvrait donc les routes `/api/admin/*` (le middleware ne les garde pas).
// Et deux routes n'avaient aucune garde : `/api/admin/rejoindre/prospect` et `/api/admin/humain/site-internet/prospect`
// (supprimer une fiche de commerce, en faire un client…), avec une redirection vers n'importe quel site.
//
// Ici : le vrai administrateur (une session que le faux Supabase reconnaît) passe ; tout le reste est refusé — personne,
// un cookie fabriqué (session JSON ou jeton seul), un en-tête d'identité forgé ; et la redirection reste chez nous.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-admin-garde-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── le décor : l'administrateur, une fiche « Site internet », un emplacement de « Rejoindre » ───
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const VITRINE = "ffffffff-0000-4000-8000-0000000ad101";
const PLACE = "ffffffff-0000-4000-8000-0000000ad201";
await semer("admins", [{ user_id: ADMIN }]);
await semer("human_vitrine_sites", [{ id: VITRINE, slug: "boulangerie-garde-dax", channel: "letter", business_name: "La Boulangerie", city: "Dax", published: false, letter_status: "draft" }]);
await semer("human_marketplace_places", [{ id: PLACE, ville: "Dax", metier: "Boulanger", commerce_slug: "boulangerie-garde-dax", prenom: "Paul", reco_status: "prospect", letter_sent_at: null }]);

// ─── les visiteurs ───
const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");
const session = (jeton) => ({
  access_token: jeton,
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
});
// (un jeton qui a l'air vrai — l'identifiant de l'admin dedans — mais signé par personne)
const jetonForge = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: ADMIN, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 86400 })}.signature-inventee`;
const VISITEURS = {
  "le vrai administrateur": { cookie: `sb-127-auth-token=base64-${b64(session("faux-admin"))}` },
  personne: {},
  "un cookie fabriqué (une session à l'identifiant de l'admin)": { cookie: `sb-127-auth-token=base64-${b64(session(jetonForge))}` },
  "un cookie fabriqué (le jeton seul)": { cookie: `sb-127-auth-token=base64-${b64(jetonForge)}` },
  "un en-tête d'identité forgé": { entetes: { "x-popey-auth-user-id": ADMIN } },
  "l'en-tête forgé, sous sa forme préfixée": { entetes: { "x-middleware-request-x-popey-auth-user-id": ADMIN } },
};
const ADMIN_SEUL = "le vrai administrateur";
const entetes = (v, plus = {}) => ({ ...plus, ...(v.cookie ? { cookie: v.cookie } : {}), ...(v.entetes ?? {}) });
const formulaire = (champs) => {
  const f = new FormData();
  for (const [k, x] of Object.entries(champs)) f.set(k, x);
  return f;
};
const poster = (chemin, v, corps) =>
  fetch(`${BASE}${chemin}`, {
    method: "POST",
    redirect: "manual",
    headers: entetes(v, corps instanceof FormData ? {} : { "content-type": "application/json" }),
    body: corps instanceof FormData ? corps : JSON.stringify(corps),
  });

// ═══ 1. UNE ROUTE GARDÉE PAR `isCurrentUserAdmin` : seul le vrai administrateur passe ═══
for (const [nom, v] of Object.entries(VISITEURS)) {
  const r = await poster("/api/admin/direct/lieux-publics", v, { action: "placer", ville: "dax", nom: "Les Arènes", emoji: "🐂", lat: 43.7089, lng: -1.0532 });
  if (nom === ADMIN_SEUL) ok(r.status === 200, `lieux publics : le vrai administrateur passe (${r.status})`);
  else ok(r.status === 403, `lieux publics : refusé pour ${nom} (${r.status})`);
}

// ═══ 2. « SITE INTERNET » : PERSONNE NE SUPPRIME UNE FICHE, NI N'EN FAIT UN CLIENT, SANS ÊTRE ADMIN ═══
for (const [nom, v] of Object.entries(VISITEURS)) {
  if (nom === ADMIN_SEUL) continue;
  const r = await poster("/api/admin/humain/site-internet/prospect", v, formulaire({ id: VITRINE, action: "delete" }));
  const r2 = await poster("/api/admin/humain/site-internet/prospect", v, formulaire({ id: VITRINE, action: "client_on" }));
  const [fiche] = await lire("human_vitrine_sites", `id=eq.${VITRINE}`);
  ok(r.status === 403 && r2.status === 403 && fiche && !fiche.est_client, `« Site internet » : refusé pour ${nom} (${r.status}, ${r2.status}) ; la fiche est intacte`);
}
// le vrai administrateur : « passer la lettre » ; et la redirection demandée vers un autre site reste chez nous
{
  const v = VISITEURS[ADMIN_SEUL];
  const r = await poster("/api/admin/humain/site-internet/prospect", v, formulaire({ id: VITRINE, action: "skip", redirect: "https://ailleurs.example/piege" }));
  const ou = new URL(r.headers.get("location") ?? "", BASE);
  const [fiche] = await lire("human_vitrine_sites", `id=eq.${VITRINE}`);
  ok(r.status === 303 && fiche?.letter_status === "skipped", `« Site internet » : le vrai administrateur passe (${r.status}, ${fiche?.letter_status})`);
  ok(ou.origin === new URL(BASE).origin && ou.pathname === "/admin/humain/site-internet", `la redirection vers un autre site est ignorée (${r.headers.get("location")})`);
  const r2 = await poster("/api/admin/humain/site-internet/prospect", v, formulaire({ id: VITRINE, action: "reset", redirect: "//ailleurs.example/piege" }));
  const ou2 = new URL(r2.headers.get("location") ?? "", BASE);
  ok(ou2.origin === new URL(BASE).origin && ou2.pathname === "/admin/humain/site-internet", `… même écrite « //ailleurs » (${r2.headers.get("location")})`);
  const r3 = await poster("/api/admin/humain/site-internet/prospect", v, formulaire({ id: VITRINE, action: "reset", redirect: "/admin/humain/site-internet?ville=dax" }));
  ok(new URL(r3.headers.get("location") ?? "", BASE).search === "?ville=dax", "une redirection dans l'admin est gardée telle quelle");
}

// ═══ 3. « REJOINDRE » : PERSONNE NE LIBÈRE UN EMPLACEMENT, NI NE MARQUE UNE LETTRE, SANS ÊTRE ADMIN ═══
for (const [nom, v] of Object.entries(VISITEURS)) {
  if (nom === ADMIN_SEUL) continue;
  const r = await poster("/api/admin/rejoindre/prospect", v, formulaire({ id: PLACE, action: "free_slot" }));
  const [place] = await lire("human_marketplace_places", `id=eq.${PLACE}`);
  ok(r.status === 403 && place?.prenom === "Paul" && place?.commerce_slug === "boulangerie-garde-dax", `« Rejoindre » : refusé pour ${nom} (${r.status}) ; l'emplacement est intact`);
}
{
  const r = await poster("/api/admin/rejoindre/prospect", VISITEURS[ADMIN_SEUL], formulaire({ id: PLACE, action: "mark_sent", redirect: "https://ailleurs.example/" }));
  const [place] = await lire("human_marketplace_places", `id=eq.${PLACE}`);
  const ou = new URL(r.headers.get("location") ?? "", BASE);
  ok(r.status === 303 && Boolean(place?.letter_sent_at), `« Rejoindre » : le vrai administrateur passe (${r.status}, lettre envoyée le ${place?.letter_sent_at?.slice(0, 10)})`);
  ok(ou.origin === new URL(BASE).origin && ou.pathname === "/admin/rejoindre/lettre", `la redirection vers un autre site est ignorée (${r.headers.get("location")})`);
}

// ═══ 4. LA PAGE ADMIN ELLE-MÊME (`/admin`, que le middleware ne garde pas) : le cookie fabriqué ne l'ouvre pas ═══
{
  const ferme = (html) => html.includes("Connexion requise") || html.includes("Accès réservé aux administrateurs");
  const forgee = await (await fetch(`${BASE}/admin`, { headers: entetes(VISITEURS["un cookie fabriqué (une session à l'identifiant de l'admin)"]) })).text();
  const jeton = await (await fetch(`${BASE}/admin`, { headers: entetes(VISITEURS["un cookie fabriqué (le jeton seul)"]) })).text();
  const vraie = await (await fetch(`${BASE}/admin`, { headers: entetes(VISITEURS[ADMIN_SEUL]) })).text();
  ok(ferme(forgee) && ferme(jeton) && !ferme(vraie), "la page /admin : fermée aux cookies fabriqués, ouverte au vrai administrateur");
}

if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
