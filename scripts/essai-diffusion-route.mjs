// 📣 LA DIFFUSION CROISÉE, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Cinq commerces de Dax (dont deux coiffeurs) et un de Pau, puis ce que `api/site-internet/pro/diffusion-croisee` doit tenir
// (`lib/direct/diffusion.ts`) : un mauvais jeton est refusé ; on ne rejoint pas le réseau sans son accord ; hors du
// réseau, pas de partenaire ; dans le réseau, deux partenaires, RÉCIPROQUES (si A diffuse B, B diffuse A), jamais
// deux coiffeurs ensemble ; seul dans sa ville, aucun ; l'envoi automatique se règle ; une vidéo reçue (posée dans
// sa boîte) se refuse, et ne se diffuse pas sans réseaux connectés ; quitter le réseau le sort des cercles des autres.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-diffusion-route.mjs          (sur un faux Supabase tout neuf)
const SB = "http://127.0.0.1:54321";
const F = `${SB}/rest/v1`;
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const id = (n) => `dddddddd-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const COMMERCES = [
  { n: 1, slug: "boulangerie-martin-dax", nom: "Boulangerie Martin", activite: "Boulangerie", lat: 43.7102, lng: -1.0536, ville: "Dax" },
  { n: 2, slug: "salon-anna-dax", nom: "Salon Anna", activite: "Coiffeur", lat: 43.709, lng: -1.053, ville: "Dax" },
  { n: 3, slug: "optique-des-landes-dax", nom: "Optique des Landes", activite: "Opticien", lat: 43.7095, lng: -1.055, ville: "Dax" },
  { n: 4, slug: "coiffure-leo-dax", nom: "Coiffure Léo", activite: "Coiffeur", lat: 43.7093, lng: -1.0528, ville: "Dax" },
  { n: 5, slug: "fleurs-de-dax", nom: "Fleurs de Dax", activite: "Fleuriste", lat: 43.7105, lng: -1.056, ville: "Dax" },
  { n: 6, slug: "cave-de-pau", nom: "Cave de Pau", activite: "Caviste", lat: 43.2951, lng: -0.3708, ville: "Pau" },
];
const jeton = (c) => `jeton-${c.slug}`;
await fetch(`${F}/human_vitrine_sites`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(
    COMMERCES.map((c) => ({ id: id(c.n), slug: c.slug, channel: "letter", business_name: c.nom, activite: c.activite, city: c.ville, latitude: c.lat, longitude: c.lng, pro_token: jeton(c), est_client: true, published: true, metadata: {} })),
  ),
});

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const reseau = async (c, corps, token = jeton(c)) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/diffusion-croisee`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: c.slug, token, ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const [boulangerie, anna, optique, leo, fleurs, pau] = COMMERCES;

ok((await reseau(boulangerie, { action: "etat" }, "mauvais")).statut === 403, "un mauvais jeton est refusé");
const sans = await reseau(boulangerie, { action: "rejoindre" });
ok(sans.statut === 400, "pas de réseau sans son accord coché");
const avant = await reseau(boulangerie, { action: "etat" });
ok(avant.statut === 200 && avant.etat.reglage.active === false && avant.etat.partenaires.length === 0, "hors du réseau : aucun partenaire");

for (const c of [boulangerie, anna, optique, leo, fleurs, pau]) await reseau(c, { action: "rejoindre", accord: true });
const etats = Object.fromEntries(await Promise.all([boulangerie, anna, optique, leo, fleurs, pau].map(async (c) => [c.nom, (await reseau(c, { action: "etat" })).etat])));
const noms = (e) => e.partenaires.map((p) => p.nom);
ok(["Boulangerie Martin", "Salon Anna", "Optique des Landes", "Coiffure Léo", "Fleurs de Dax"].every((n) => noms(etats[n]).length === 2), "dans le réseau : deux partenaires chacun, à Dax");
let reciproque = true;
for (const [n, e] of Object.entries(etats)) for (const p of noms(e)) if (!noms(etats[p] ?? { partenaires: [] }).includes(n)) reciproque = false;
ok(reciproque, "les partenaires sont réciproques (si A diffuse B, B diffuse A)");
ok(!noms(etats["Salon Anna"]).includes("Coiffure Léo") && !noms(etats["Coiffure Léo"]).includes("Salon Anna"), `jamais deux coiffeurs ensemble (Anna : ${noms(etats["Salon Anna"]).join(", ")})`);
ok(noms(etats["Cave de Pau"]).length === 0, "seul dans sa ville (Pau) : aucun partenaire");
ok(etats["Boulangerie Martin"].partenaires.every((p) => /min à pied|juste à côté/.test(p.ou)), `la distance dite (${etats["Boulangerie Martin"].partenaires.map((p) => p.ou).join(" ; ")})`);
ok(etats["Boulangerie Martin"].reglage.auto === true && etats["Boulangerie Martin"].plafond === 2, "envoi automatique d'office, deux par semaine au plus");

const manuel = await reseau(boulangerie, { action: "auto", auto: false });
ok(manuel.statut === 200 && manuel.etat.reglage.auto === false, "l'envoi automatique s'éteint (une par une)");

// UNE VIDÉO REÇUE D'UN DE SES PARTENAIRES, POSÉE DANS SA BOÎTE (comme la route de l'annonce le fait chez eux)
const expediteur = COMMERCES.find((c) => c.nom === noms(etats["Boulangerie Martin"])[0]);
const recue = {
  id: `20261103120000-${expediteur.slug}`,
  le: new Date().toISOString(),
  de: { id: id(expediteur.n), slug: expediteur.slug, nom: expediteur.nom, metier: expediteur.activite, ville: "Dax" },
  vers: { id: id(1), slug: boulangerie.slug },
  texte: "Le bouquet du jour",
  decouverte: `Découverte du quartier 📣 À 2 min à pied d'ici, chez ${expediteur.nom} : Le bouquet du jour. Allez voir !`,
  photo: "https://clikme.fr/photo.jpg",
  video: { url: "https://clikme.fr/film.mp4", secondes: 21, mp4: true },
  statut: "en-attente",
};
const pose = await fetch(`${SB}/storage/v1/object/diffusions-croisees/${id(1)}/${recue.id}.json`, { method: "POST", headers: { "content-type": "application/json", "x-upsert": "true" }, body: JSON.stringify(recue) });
ok(pose.ok, "une vidéo reçue posée dans sa boîte");
const boite = await reseau(boulangerie, { action: "etat" });
ok(boite.etat.recues.length === 1 && boite.etat.recues[0].statut === "en-attente" && boite.etat.recues[0].de.nom === expediteur.nom, `elle est dans « Reçues de mes partenaires », en attente (de ${expediteur.nom})`);
const sansReseaux = await reseau(boulangerie, { action: "diffuser", id: recue.id });
ok(sansReseaux.statut === 400 && /réseaux/i.test(sansReseaux.error ?? ""), "pas de diffusion sans réseaux connectés");
const non = await reseau(boulangerie, { action: "refuser", id: recue.id });
ok(non.statut === 200 && non.etat.recues[0].statut === "refusee", "« Pas celle-ci » : refusée");
const envois = await reseau(expediteur, { action: "etat" });
ok(envois.etat.envois.some((v) => v.id === recue.id && v.vers === "Boulangerie Martin" && v.statut === "refusee"), "son partenaire la voit dans « Mes vidéos chez eux »");

const parti = await reseau(optique, { action: "quitter" });
ok(parti.statut === 200 && parti.etat.reglage.active === false && parti.etat.partenaires.length === 0, "quitter le réseau : plus de partenaire");
const apres = await Promise.all([boulangerie, anna, leo, fleurs].map(async (c) => (await reseau(c, { action: "etat" })).etat));
ok(apres.every((e) => !noms(e).includes("Optique des Landes")), "et il sort des cercles des autres");

console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
