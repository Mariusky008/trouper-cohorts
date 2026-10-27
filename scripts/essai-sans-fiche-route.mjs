// 📝 L'INSCRIPTION SANS FICHE GOOGLE, PAR LA ROUTE ET PAR LA PAGE — contre le faux Supabase, jamais la vraie base.
//
// « Pour un entrepreneur, parfois il n'a pas de fiche Google : qu'il s'inscrive quand même, mais il devra remplir
// ses infos lui-même sur sa page, et il n'aura pas de présentation au départ. » Ce que `api/site-internet/
// public-generate` doit tenir quand la case « Je n'ai pas de fiche Google » est cochée : la page se crée (même
// sans jeton Apify : il n'y a rien à lire), marquée « sans fiche », sans lecture de fiche en cours ; et sa page
// lui dit « c'est vous qui la remplissez », jamais « votre fiche Google n'a pas été lue ». Sans la case, rien ne
// change : sans jeton Apify, le générateur répond qu'il est indisponible.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-sans-fiche-route.mjs          (sur un faux Supabase tout neuf)
import { BASE, F, lancer } from "./navigateur/commun.mjs";

let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const creer = async (corps) => {
  const r = await fetch(`${BASE}/api/site-internet/public-generate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 200) + 1}` },
    body: JSON.stringify({ businessName: "Atelier Terre", city: "Annecy", activite: "céramiste", ...corps }),
  });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const ligne = async (slug) => (await (await fetch(`${F}/human_vitrine_sites?slug=eq.${encodeURIComponent(slug)}`)).json())[0];

// ① la case cochée : la page se crée, marquée « sans fiche »
const r = await creer({ sansFiche: true });
ok(r.statut === 201 && typeof r.slug === "string", `sans fiche Google : la page se crée (${r.statut}, ${r.slug})`);
const l = r.slug ? await ligne(r.slug) : null;
const d = l?.diagnostic ?? {};
ok(d.sans_fiche === true && d.places_found === false, `marquée « sans fiche », aucune fiche trouvée (${d.sans_fiche}, ${d.places_found})`);
ok(!d.fiche_en_cours, `aucune lecture de fiche en cours (${d.fiche_en_cours ?? "—"})`);
ok(l?.business_name === "Atelier Terre" && l?.city === "Annecy", `son nom et sa ville, tels qu'il les a tapés (${l?.business_name}, ${l?.city})`);

// ② sans la case : comme avant (sans jeton Apify, le générateur est indisponible ; avec, la fiche se lit)
const r2 = await creer({});
const l2 = r2.slug ? await ligne(r2.slug) : null;
ok(r2.statut === 503 || (r2.statut === 201 && l2?.diagnostic?.fiche_en_cours && !l2?.diagnostic?.sans_fiche),
  `sans la case : rien ne change (${r2.statut}${r2.slug ? `, lecture lancée le ${l2?.diagnostic?.fiche_en_cours}` : ""})`);

// ③ sa page : « c'est vous qui la remplissez », jamais « votre fiche Google n'a pas été lue »
if (r.slug) {
  const nav = await lancer();
  const p = await nav.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(`${BASE}/site-internet/apercu/${r.slug}`, { waitUntil: "domcontentloaded", timeout: 120000 });   // (en développement, la page se compile)
  const appel = p.getByText("Votre page, c'est vous qui la remplissez");
  await appel.waitFor({ timeout: 20000 }).catch(() => {});
  const texte = await p.evaluate(() => document.body.innerText);
  ok(texte.includes("Votre page, c'est vous qui la remplissez") && texte.includes("Espace Pro"), "sa page : « c'est vous qui la remplissez », depuis votre Espace Pro");
  ok(!texte.includes("n'a pas été lue") && !texte.includes("Relire ma fiche Google"), "sa page ne lui parle pas d'une fiche qu'il n'a pas");
  ok(texte.includes("Envoyer une photo"), "sans photo : elle lui propose d'en envoyer une");
  await nav.close();
}
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
