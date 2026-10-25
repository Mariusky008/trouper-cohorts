// 🔓 LES TROIS CAGES, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Un commerce semé avec son interview, puis ce que `api/direct/cage` doit tenir
// (`20261026090000_clik_cages.sql`) : « Je viendrai un jour » avec un numéro (la cage, et le contact
// au format d'un lien wa.me, avec l'heure de l'accord) ; changer de cage remplace la ligne et garde le
// contact ; un numéro refusé avec une autre cage ou s'il est illisible ; une cage inconnue ; le film
// d'un autre commerce ; un prénom trop long coupé, un fantôme inconnu ignoré.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-cages-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const R = `${process.env.ESSAI_BASE || "http://localhost:3821"}/api/direct/cage`;
const SITE = "ffffffff-0000-4000-8000-000000000006";
const FILM = "https://films.essai-cages.fr/bergine.mp4";
await fetch(`${F}/human_vitrine_sites`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ id: SITE, slug: "bistrot-des-cages-dax", channel: "letter", business_name: "Le Bistrot des Cages", city: "Dax", activite: "Restaurant",
    published: true, est_client: true, current_offer: { text: "Plat du jour : axoa", created_at: new Date().toISOString(), video: FILM } }),
});
let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
let cookie = "";
const cage = async (corps, film = FILM) => {
  const r = await fetch(R, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ slug: "bistrot-des-cages-dax", ville: "dax", film, ...corps }) });
  const sc = r.headers.get("set-cookie");
  if (sc && !cookie) cookie = sc.split(";")[0];
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lignes = async (t) => (await (await fetch(`${F}/${t}?site_id=eq.${SITE}`)).json());

let r = await cage({ cage: "un-jour", prenom: "Camille", look: "fleuri", whatsapp: "06 12 34 56 78" });
ok(r.statut === 200, `« Je viendrai un jour » avec son numéro : ${r.statut}`);
let c = await lignes("clik_cage"), k = await lignes("clik_contact");
ok(c.length === 1 && c[0].cage === "un-jour" && c[0].prenom === "Camille" && c[0].look === "fleuri", `la cage gardée, avec son prénom et son fantôme (${c.map((x) => `${x.cage}/${x.prenom}/${x.look}`)})`);
ok(k.length === 1 && k[0].whatsapp === "33612345678" && !!k[0].accord_le && k[0].stop_le == null, `le numéro au format wa.me, avec l'heure de son accord (${k.map((x) => x.whatsapp)})`);
r = await cage({ cage: "adore", prenom: "Camille", look: "fleuri" });
c = await lignes("clik_cage");
ok(r.statut === 200 && c.length === 1 && c[0].cage === "adore", `changer de cage remplace la ligne (${c.length} ligne, ${c[0]?.cage})`);
ok((await lignes("clik_contact")).length === 1, "le contact reste : il vaut pour le commerce, pas pour une cage");
r = await cage({ cage: "adore", whatsapp: "0612345678" });
ok(r.statut === 400, `un numéro avec « J'adore la vidéo » : refusé (${r.statut})`);
r = await cage({ cage: "un-jour", whatsapp: "06 12" });
ok(r.statut === 400, `un numéro illisible : refusé (${r.statut}, « ${r.error} »)`);
r = await cage({ cage: "peut-etre" });
ok(r.statut === 400, `une cage inconnue : refusée (${r.statut})`);
r = await cage({ cage: "adore" }, "https://films.essai-cages.fr/autre.mp4");
ok(r.statut === 404, `le film d'un autre commerce : refusé (${r.statut})`);
r = await cage({ cage: "aujourdhui", prenom: "x".repeat(60), look: "pas-un-look" });
c = await lignes("clik_cage");
ok(r.statut === 200 && c[0]?.prenom.length === 24 && c[0]?.look === "", `prénom coupé à 24 lettres, fantôme inconnu ignoré (${c[0]?.prenom.length}, « ${c[0]?.look} »)`);
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
