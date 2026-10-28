// 👻 LA FAMILLE D'UN COMMERCE, PAR LES ROUTES — contre le faux Supabase, jamais la vraie base.
//
// Un commerce client sans vidéo, un prospect, puis ce que `api/direct/cage` et `api/direct/famille` doivent
// tenir (`20261101090000_clik_famille.sql`) : la page sert de film à un client (`FILM_PAGE`), jamais à un
// prospect ; ouvrir une cage met dans la foule du jour, une fois par jour ; le numéro suit l'ordre d'arrivée ;
// le code d'invitation (`?de=`) note qui a amené qui, le premier jour seulement, et un code inconnu ne compte
// pas ; le record à battre vient des jours d'avant ; les paliers (`PALIERS`) : 7 jours de cage → argent,
// 3 amis → or, 1 visite → argent ; sans cookie, la foule sans « moi ». Puis la page `/f/<lien>` : 200 pour le
// client, 404 pour le prospect et pour un lien inconnu. Et le petit mot de la liste d'une « Brasserie ». Puis la
// famille partout : le numéro et le palier de chaque fantôme dans la vitrine (sans identifiant de personne), ses
// familles pour Ma Maison (`?moi=1`), et les prénoms qui ne peuvent pas se montrer (un gros mot, un lien).
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-famille-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const SITE = "ffffffff-0000-4000-8000-000000000011";
const SLUG = "bistrot-de-la-famille-dax";
const PROSPECT = "prospect-de-la-famille-dax";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
await semer("human_vitrine_sites", [
  { id: SITE, slug: SLUG, channel: "letter", business_name: "La Brasserie de la Famille", city: "Dax", activite: "Brasserie", published: true, est_client: true },
  { id: "ffffffff-0000-4000-8000-000000000012", slug: PROSPECT, channel: "letter", business_name: "Un prospect", city: "Dax", activite: "Bistrot", published: false, est_client: false },
]);

let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const cookies = {};
const cage = async (qui, corps, slug = SLUG) => {
  const r = await fetch(`${BASE}/api/direct/cage`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookies[qui] || "" },
    body: JSON.stringify({ slug, ville: "dax", film: "page", cage: "adore", prenom: qui, ...corps }),
  });
  const sc = r.headers.get("set-cookie");
  if (sc && !cookies[qui]) cookies[qui] = sc.split(";")[0];
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const famille = async (qui) => {
  const r = await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`, { headers: { cookie: (qui && cookies[qui]) || "" } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lignes = async (t, q = "") => (await (await fetch(`${F}/${t}?site_id=eq.${SITE}${q}`)).json());
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
// EN JOURS DE CALENDRIER, pas en tranches de 24 h : le jour du passage à l'heure d'hiver dure 25 heures, et
// entre 23 h et minuit, « il y a 3 × 24 h » et « il y a 2 × 24 h » tombaient le même jour (la CI l'a attrapé).
const AUJ = jour(new Date());
const ilYa = (n) => {
  const d = new Date(`${AUJ}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const habitantDe = async (qui) => (await lignes("clik_cage")).find((c) => c.prenom === qui)?.habitant_id;

let f = await famille();
ok(f.statut === 200 && f.aujourdhui === 0 && f.record === 0 && f.membres === 0 && f.moi === null, `la famille vide, sans cookie (${f.aujourdhui}/${f.record}/${f.membres}/${f.moi})`);

let r = await cage("Camille", { look: "fleuri" });
ok(r.statut === 200 && !!cookies.Camille, `la page sert de film à un commerce client (${r.statut})`);
f = await famille("Camille");
ok(f.aujourdhui === 1 && f.membres === 1, `Camille dans la foule du jour (${f.aujourdhui} aujourd'hui, ${f.membres} membre)`);
ok(f.moi?.numero === 1 && f.moi?.grade === "bronze" && f.moi?.present === true && /^f[0-9a-f]{12}$/.test(f.moi?.code ?? ""), `n°1, bronze, présente, son code (${JSON.stringify(f.moi)})`);
ok(f.moi?.prenom === "Camille" && f.moi?.cage === "adore", `son prénom et sa cage, pour qu'elle n'ait rien à retaper (${f.moi?.prenom}/${f.moi?.cage})`);
const codeCamille = f.moi?.code;

r = await cage("Camille", { cage: "un-jour" });
ok(r.statut === 200 && (await lignes("clik_presence")).length === 1, `une autre cage le même jour : toujours une seule présence (${(await lignes("clik_presence")).length})`);

r = await cage("Intrus", {}, PROSPECT);
ok(r.statut === 404, `la page d'un prospect ne sert pas de film (${r.statut})`);

// HUGO ARRIVE PAR LE LIEN DE CAMILLE ; LÉA AVEC UN CODE INCONNU.
await cage("Hugo", { de: codeCamille });
await cage("Léa", { de: "f000000000000" });
const [camille, hugo, lea] = [await habitantDe("Camille"), await habitantDe("Hugo"), await habitantDe("Léa")];
let p = await lignes("clik_presence");
ok(p.find((x) => x.habitant_id === hugo)?.amene_par === camille && !p.find((x) => x.habitant_id === lea)?.amene_par, `Hugo amené par Camille, Léa par personne (${p.filter((x) => x.amene_par).length} invitation)`);
f = await famille("Hugo");
ok(f.moi?.numero === 2 && f.aujourdhui === 3 && f.membres === 3, `Hugo, n°2 ; 3 fantômes aujourd'hui (${f.moi?.numero}, ${f.aujourdhui})`);
f = await famille("Camille");
ok(f.moi?.parcours?.amis === 1 && f.moi?.grade === "bronze", `Camille : 1 ami amené, encore bronze (${JSON.stringify(f.moi?.parcours)})`);

// LE LIEN NE COMPTE QUE LE PREMIER JOUR : Zoé était déjà venue avant-hier, elle revient par le lien de Camille.
await cage("Zoé", {});
const zoe = await habitantDe("Zoé");
await fetch(`${F}/clik_presence?site_id=eq.${SITE}&habitant_id=eq.${zoe}`, { method: "DELETE" });
await semer("clik_presence", { site_id: SITE, habitant_id: zoe, jour: ilYa(2) });
await cage("Zoé", { de: codeCamille });
p = await lignes("clik_presence", `&habitant_id=eq.${zoe}`);
ok(p.length === 2 && p.every((x) => !x.amene_par), `Zoé revient par le lien : présente, mais pas « amenée » (${p.length} jours, ${p.filter((x) => x.amene_par).length} invitation)`);

// LE RECORD À BATTRE : 5 fantômes il y a trois jours (les jours d'avant seulement).
await semer("clik_presence", [1, 2, 3, 4, 5].map((k) => ({ site_id: SITE, habitant_id: `eeeeeeee-0000-4000-8000-00000000000${k}`, jour: ilYa(3) })));
f = await famille("Camille");
ok(f.record === 5 && f.aujourdhui === 4, `le record à battre : 5, il y a trois jours ; 4 aujourd'hui (${f.record}/${f.aujourdhui})`);

// LES PALIERS. Camille : 6 jours de cage de plus (7 en tout) → argent.
await semer("clik_presence", [1, 2, 3, 4, 5, 6].map((n) => ({ site_id: SITE, habitant_id: camille, jour: ilYa(n + 3) })));
f = await famille("Camille");
ok(f.moi?.parcours?.jours === 7 && f.moi?.grade === "argent", `7 jours de cage : argent (${f.moi?.parcours?.jours} jours, ${f.moi?.grade})`);
// Deux amis de plus, amenés un autre jour → 3 amis : or.
await semer("clik_presence", [6, 7].map((k) => ({ site_id: SITE, habitant_id: `eeeeeeee-0000-4000-8000-00000000000${k}`, jour: ilYa(4), amene_par: camille })));
f = await famille("Camille");
ok(f.moi?.parcours?.amis === 3 && f.moi?.grade === "or", `3 amis amenés : or (${f.moi?.parcours?.amis} amis, ${f.moi?.grade})`);
// Léa : une visite notée au comptoir → argent.
await semer("clik_visite", { site_id: SITE, habitant_id: lea, jour: ilYa(1) });
f = await famille("Léa");
ok(f.moi?.parcours?.visites === 1 && f.moi?.grade === "argent", `une visite : argent (${f.moi?.parcours?.visites}, ${f.moi?.grade})`);

// LE PETIT MOT DE LA LISTE D'UNE « BRASSERIE » : la liste d'un bar, la même sur la page et à la route (qui, par
// son seul métier, prenait celle d'une boutique de mode et refusait le mot).
const m = await fetch(`${BASE}/api/direct/mot`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: cookies.Hugo },
  body: JSON.stringify({ slug: SLUG, texte: "La meilleure terrasse du quartier", liste: true }),
});
ok(m.status === 200, `le mot de la liste d'une brasserie, accepté (${m.status})`);

// 👻 LA FAMILLE DANS LA VITRINE : chaque fantôme porte son numéro et son palier.
const v = await (await fetch(`${BASE}/api/direct/vitrine?slug=${SLUG}`, { headers: { cookie: cookies.Hugo } })).json();
const parPrenom = Object.fromEntries((v.fantomes ?? []).map((x) => [x.prenom, x]));
ok(parPrenom.Camille?.numero === 1 && parPrenom.Camille?.grade === "or", `dans la vitrine, Camille : n°1, or (${parPrenom.Camille?.numero}/${parPrenom.Camille?.grade})`);
ok(parPrenom.Hugo?.numero === 2 && parPrenom.Hugo?.grade === "bronze" && parPrenom.Léa?.grade === "argent", `Hugo : n°2, bronze ; Léa : argent (${parPrenom.Hugo?.numero}/${parPrenom.Hugo?.grade}, ${parPrenom.Léa?.grade})`);
ok((v.fantomes ?? []).every((x) => !JSON.stringify(x).includes(camille)), "jamais l'identifiant de personne dans la vitrine");

// 🏠 SES FAMILLES, POUR MA MAISON.
let mm = await (await fetch(`${BASE}/api/direct/famille?moi=1`, { headers: { cookie: cookies.Camille } })).json();
ok(mm.familles?.length === 1 && mm.familles[0].slug === SLUG && mm.familles[0].numero === 1 && mm.familles[0].grade === "or" && mm.familles[0].membres === 4, `Ma Maison de Camille : 1 famille, n°1, or, 4 membres (${JSON.stringify(mm.familles?.[0] ?? null)})`);
mm = await (await fetch(`${BASE}/api/direct/famille?moi=1`)).json();
ok(mm.ok && Array.isArray(mm.familles) && mm.familles.length === 0, "sans cookie : aucune famille");

// 🙂 LES PRÉNOMS QUI NE PEUVENT PAS SE MONTRER : son fantôme entre, sans prénom.
await cage("Grossier", { prenom: "Connard" });
await cage("Lien", { prenom: "www.pub.fr" });
await cage("Constance", { prenom: "Constance" });
await cage("Jean-Marie", { prenom: "Jean-Marie" });
const prenoms = (await lignes("clik_cage")).map((x) => x.prenom);
ok(!prenoms.includes("Connard") && !prenoms.includes("www.pub.fr"), "un gros mot, un lien : pas gardés comme prénom");
ok(prenoms.includes("Constance") && prenoms.includes("Jean-Marie"), "« Constance » et « Jean-Marie » passent");
ok((await lignes("clik_cage")).filter((x) => x.prenom === "").length === 2, "les deux fantômes sont entrés quand même, sans prénom");

// LA PAGE.
const page = await fetch(`${BASE}/f/${SLUG}`);
const html = await page.text();
ok(page.status === 200 && html.includes("La Brasserie de la Famille") && html.includes("Rejoins la famille"), `la page du client (${page.status})`);
ok(!/exemple/i.test(html.replace(/<script[\s\S]*?<\/script>/g, "")), "jamais le mot « exemple » à l'écran");
ok((await fetch(`${BASE}/f/${PROSPECT}`)).status === 404, "la page d'un prospect : introuvable");
ok((await fetch(`${BASE}/f/lien-inconnu-dax`)).status === 404, "un lien inconnu : introuvable");

console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
