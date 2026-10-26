// 🏪 LA VITRINE D'UN COMMERCE, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Trois habitants libèrent leur fantôme à la fin du film d'un commerce (par `api/direct/cage`), l'un cache son
// prénom ; puis ce que `api/direct/vitrine` doit tenir (`20261030090000_clik_vitrine.sql`) : un fantôme par
// personne, sa dernière cage, sans identifiant de personne ; le prénom caché ne se voit pas — sauf pour soi ;
// « Vous » marqué pour qui regarde ; les cages de plus de sept jours n'y sont plus ; l'ardoise écrite au comptoir
// (route du carnet, action « ardoise ») s'affiche le jour même, plus le lendemain, et s'efface ; un mauvais
// commerce, un réglage sans fantôme.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-vitrine-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const SITE = "ffffffff-0000-4000-8000-000000000009";
const SLUG = "cafe-de-la-vitrine-dax";
const JETON = "jeton-de-la-vitrine";
const FILM = "https://films.essai-vitrine.fr/cafe.mp4";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
await semer("human_vitrine_sites", {
  id: SITE, slug: SLUG, channel: "letter", pro_token: JETON, business_name: "Le Café de la Vitrine", city: "Dax", activite: "Restaurant",
  published: true, est_client: true, current_offer: { text: "Plat du jour : axoa", created_at: new Date().toISOString(), video: FILM },
});

let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const cookies = {};
const cage = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/cage`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookies[qui] || "" },
    body: JSON.stringify({ slug: SLUG, ville: "dax", film: FILM, ...corps }),
  });
  const sc = r.headers.get("set-cookie");
  if (sc && !cookies[qui]) cookies[qui] = sc.split(";")[0];
  return r.status;
};
const vitrine = async (qui, q = `slug=${SLUG}`) => {
  const r = await fetch(`${BASE}/api/direct/vitrine?${q}`, { headers: { cookie: cookies[qui] || "" } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const prenom = async (qui, visible) => {
  const r = await fetch(`${BASE}/api/direct/vitrine`, { method: "POST", headers: { "content-type": "application/json", cookie: cookies[qui] || "" }, body: JSON.stringify({ action: "prenom", visible }) });
  return r.status;
};
const ardoise = async (texte) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: JETON, action: "ardoise", texte }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

ok((await cage("lea", { cage: "adore", prenom: "Léa", look: "fleuri" })) === 200, "Léa : « J'adore la vidéo »");
ok((await cage("tom", { cage: "un-jour", prenom: "Tom", look: "denim" })) === 200, "Tom : « Je viendrai un jour »");
ok((await cage("ines", { cage: "aujourdhui", prenom: "Inès", look: "artiste" })) === 200, "Inès : « Je réserve aujourd'hui »");
ok((await cage("tom", { cage: "aujourdhui", prenom: "Tom", look: "denim" })) === 200, "Tom change d'avis : aujourd'hui");
// une cage d'il y a dix jours : plus dans la vitrine
await semer("clik_cage", { site_id: SITE, habitant_id: "aaaaaaaa-0000-4000-8000-00000000000b", film: FILM, cage: "adore", prenom: "Ancien", look: "cosy",
  updated_at: new Date(Date.now() - 10 * 86_400_000).toISOString() });

let v = await vitrine("passant");
const noms = (v.fantomes || []).map((f) => `${f.prenom}/${f.cage}`).sort().join(",");
ok(v.statut === 200 && v.fantomes?.length === 3 && noms === "Inès/aujourdhui,Léa/adore,Tom/aujourdhui", `trois fantômes, la dernière cage de chacun, pas l'ancien (${noms})`);
ok(!JSON.stringify(v).includes("habitant") && v.fantomes.every((f) => /^f\d+$/.test(f.id)), "jamais l'identifiant de personne");
ok(!v.fantomes.some((f) => f.moi), "un passant sans fantôme : personne n'est « Vous »");
ok(v.ardoise === null, "pas d'ardoise");

ok((await prenom("lea", false)) === 200, "Léa cache son prénom");
v = await vitrine("passant");
ok(v.fantomes.some((f) => f.cage === "adore" && f.prenom === "" && f.look === "fleuri"), "son fantôme reste, sans prénom");
v = await vitrine("lea");
const lea = v.fantomes.find((f) => f.moi);
ok(lea?.prenom === "Léa" && v.prenomVisible === false, "pour elle-même : « Vous », son prénom, et son réglage");
ok((await vitrine("lea", "moi=1")).prenomVisible === false, "son réglage seul (Ma Maison)");
ok((await prenom("lea", true)) === 200 && (await vitrine("passant")).fantomes.some((f) => f.prenom === "Léa"), "Léa le remontre");
ok((await prenom("personne", false)) === 401, "un réglage sans fantôme : refusé");

let a = await ardoise("Plus que 6 axoas ce midi !");
ok(a.statut === 200 && a.ardoise === "Plus que 6 axoas ce midi !", "le comptoir écrit l'ardoise");
ok((await vitrine("passant")).ardoise === "Plus que 6 axoas ce midi !", "elle s'affiche sous la vitrine");
const lire = await (await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: JETON, action: "lire" }) })).json();
ok(lire.ardoise === "Plus que 6 axoas ce midi !", "le carnet la relit");
await fetch(`${F}/clik_ardoise?site_id=eq.${SITE}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecrite_le: new Date(Date.now() - 86_400_000 * 1.2).toISOString() }) });
ok((await vitrine("passant")).ardoise === null, "écrite hier : elle ne s'affiche plus");
a = await ardoise("x".repeat(200));
ok(a.ardoise?.length === 90, `coupée à 90 signes (${a.ardoise?.length})`);
a = await ardoise("");
ok(a.statut === 200 && a.ardoise === null && (await vitrine("passant")).ardoise === null, "effacée");
ok((await (await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "faux", action: "ardoise", texte: "Piratée" }) })).status) === 403, "l'ardoise d'un autre : refusée");
ok((await vitrine("passant", "slug=pas-un-commerce")).statut === 404, "un commerce inconnu : 404");
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
