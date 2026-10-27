// 📝 LA PAGE D'INSCRIPTION POUR TOUT LE MONDE (`/inscription`), PAR LA ROUTE ET PAR LA PAGE — contre le faux
// Supabase, jamais la vraie base.
//
// `api/inscription/ville` : Dax est ouverte (`villes-ouvertes.ts`), Annecy non, et compte ses commerçants qui ont
// gardé leur page (pas les aperçus, pas ceux d'une autre ville), quelle que soit la façon dont la ville est écrite.
// `public-generate` garde où sont ses clients (et rien d'autre). La page : ce qu'on aura à Annecy (le Direct et
// l'échange verrouillés, le nombre d'inscrits, le Direct France si ses clients sont à distance) et à Dax (tout) ;
// puis le formulaire crée sa page et l'y emmène.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-inscription-route.mjs          (sur un faux Supabase tout neuf)
import { BASE, F, lancer } from "./navigateur/commun.mjs";

let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const semer = (slug, city, est_client) => fetch(`${F}/human_vitrine_sites`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ slug, channel: "letter", business_name: slug, city, activite: "Céramiste", est_client }),
});
await semer("atelier-bleu-annecy", "74000 Annecy, France", true);
await semer("terre-annecy", "Annecy", true);
await semer("apercu-annecy", "Annecy", false);   // un aperçu : il ne compte pas
await semer("bistrot-dax", "Dax", true);
const ville = async (nom) => {
  const r = await fetch(`${BASE}/api/inscription/ville?nom=${encodeURIComponent(nom)}`);
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ① la ville
let v = await ville("annecy");
ok(v.statut === 200 && v.ouverte === false && v.nom === "Annecy", `Annecy : pas encore ouverte (${v.statut}, ${v.ouverte}, « ${v.nom} »)`);
ok(v.inscrits === 2, `Annecy : 2 commerçants ont gardé leur page, l'aperçu ne compte pas (${v.inscrits})`);
v = await ville("Dax");
ok(v.ouverte === true && v.inscrits === 1, `Dax : ouverte, 1 inscrit (${v.ouverte}, ${v.inscrits})`);
v = await ville("x");
ok(v.statut === 400, `une ville d'une lettre : refusée (${v.statut})`);
v = await ville("Annecy");
ok(v.echange === false, `Annecy : l'échange pas encore ouvert (${v.echange})`);
// assez d'offres actives pour le seuil de l'échange (12, 3 pour les essais : ECHANGES_SEUIL_VILLE) : il s'ouvre tout seul
const seuil = Number(process.env.ECHANGES_SEUIL_VILLE) || 3;
for (let k = 0; k < seuil; k++)
  await fetch(`${F}/human_echanges_offres`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ site_id: `ffffffff-0000-4000-8000-00000000a${String(k).padStart(3, "0")}`, ville_slug: "lyon", ville: "Lyon", actif: true }) });
v = await ville("Lyon");
ok(v.ouverte === false && v.echange === true, `Lyon : ${seuil} offres, l'échange ouvert tout seul, la ville pas encore (${v.ouverte}, ${v.echange})`);

// ② où sont ses clients, gardés avec sa page (et rien d'autre)
const r = await fetch(`${BASE}/api/site-internet/public-generate`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-forwarded-for": "10.1.0.7" },
  body: JSON.stringify({ businessName: "Atelier Terre", city: "Annecy", activite: "céramiste", sansFiche: true, clients: ["distance", "chez-moi", "bidon"] }),
});
const j = await r.json().catch(() => ({}));
const l = j.slug ? (await (await fetch(`${F}/human_vitrine_sites?slug=eq.${j.slug}`)).json())[0] : null;
ok(r.status === 201 && JSON.stringify(l?.metadata?.clients) === JSON.stringify(["chez-moi", "distance"]), `ses clients gardés, sans l'inconnu (${r.status}, ${JSON.stringify(l?.metadata?.clients)})`);

// ③ la page
const nav = await lancer();
const p = await nav.newPage({ viewport: { width: 390, height: 844 } });
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(`${BASE}/inscription`, { waitUntil: "load", timeout: 120000 });   // (en développement, la page se compile)
// LA PAGE RÉPOND QUAND REACT L'A REPRISE : avant, un toucher ne fait rien. On touche jusqu'à ce que le bouton s'allume.
const toucher = async (nom) => {
  const b = p.getByRole("button", { name: nom });
  for (let k = 0; k < 20 && (await b.getAttribute("aria-pressed")) !== "true"; k++) { await b.click(); await p.waitForTimeout(500); }
};
await toucher(/viennent chez vous/);
await toucher(/vous leur envoyez/);
await p.getByLabel("Votre ville").fill("Annecy");
await p.getByText("À Annecy, vous aurez").waitFor({ timeout: 15000 }).catch(() => {});
let texte = await p.evaluate(() => document.body.innerText);
ok(texte.includes("Le Direct d’Annecy") && texte.includes("s'ouvrira avec votre ville"), "Annecy : le Direct d’Annecy, verrouillé");
ok(texte.includes("2 commerçants d’Annecy ont déjà leur page"), "Annecy : le nombre d'inscrits");
ok(texte.includes("Le Direct France de votre catégorie") && texte.includes("bientôt"), "clients à distance : le Direct France, bientôt");
await p.getByLabel("Votre ville").fill("Dax");
await p.getByText("Dax est ouverte").waitFor({ timeout: 15000 }).catch(() => {});
texte = await p.evaluate(() => document.body.innerText);
ok(texte.includes("Dax est ouverte") && texte.includes("Le Direct de Dax") && !texte.includes("s'ouvrira avec votre ville"), "Dax : ouverte, tout est là");
await p.getByLabel("Votre ville").fill("Lyon");
await p.getByText("À Lyon, vous aurez").waitFor({ timeout: 15000 }).catch(() => {});
await p.waitForTimeout(300);
texte = await p.evaluate(() => document.body.innerText);
ok(texte.includes("Le Direct de Lyon") && texte.includes("l'échange entre commerçants de Lyon, déjà ouvert"), "Lyon : le Direct verrouillé, l'échange déjà ouvert");
await p.getByLabel("Le nom de votre activité").fill("Le Petit Zinc");
await p.getByLabel("Votre métier").fill("restaurant");
await p.getByLabel("Je n'ai pas de fiche Google").check();
await p.getByRole("button", { name: /Créer ma page/ }).click();
await p.waitForURL(/\/site-internet\/apercu\//, { timeout: 30000 }).catch(() => {});
ok(/\/site-internet\/apercu\/le-petit-zinc-/.test(p.url()), `le formulaire crée sa page et l'y emmène (${p.url().replace(BASE, "")})`);
ok(!erreurs.length, `aucune erreur de page${erreurs.length ? " : " + erreurs.join(" | ") : ""}`);
await nav.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
