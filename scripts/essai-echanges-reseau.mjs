// 🔁 LE RÉSEAU DES COMMERÇANTS, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Quatre commerces semés (trois à Dax, une à Vevey), puis tout ce que la route doit tenir : la
// ville qui s'ouvre au seuil, 50 € d'avance par personne, le cadeau du voisin (offrir, plafond,
// donner, la page du client, valider, « venu à combien »), les chiffres des deux côtés, la dette
// (ni pause ni refus), reprendre les bons pas donnés, l'expiration, Vevey fermée.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     ECHANGES_SEUIL_VILLE=3 npx next dev --webpack -p 3821
//   node scripts/essai-echanges-reseau.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const site = (id, slug, nom, ville, activite, lat, lng, adresse) => ({
  id, slug, channel: "letter", business_name: nom, city: ville, activite, address: adresse, pro_token: "jeton-test",
  latitude: lat, longitude: lng, published: true, est_client: true, google_rating: 4.7, google_reviews: 80, google_place_id: null,
  diagnostic: {}, metadata: {}, gallery_photos: [], current_offer: null, services: [], assistant_kb: {}, contact_prenom: "",
});
const SITES = {
  lou: site("aaaaaaaa-0000-4000-8000-000000000001", "atelier-lou-dax", "L'Atelier de Lou", "Dax", "Coiffeur", 43.7102, -1.0536, "4 rue des Carmes, 40100 Dax, France"),
  bergine: site("bbbbbbbb-0000-4000-8000-000000000002", "chez-bergine-dax", "Chez Bergine", "Dax", "Restaurant", 43.7110, -1.0522, "18 rue Neuve, 40100 Dax, France"),
  fleurs: site("cccccccc-0000-4000-8000-000000000003", "fleurs-adour-dax", "Fleurs de l'Adour", "Dax", "Fleuriste", 43.7088, -1.0551, "2 place de la Fontaine Chaude, 40100 Dax, France"),
  alice: site("dddddddd-0000-4000-8000-000000000004", "page-alice-vevey", "La Page d'Alice", "Vevey", "Librairie", 46.4628, 6.8419, "Rue du Lac 10, 1800 Vevey, Suisse"),
};
await fetch(`${F}/human_vitrine_sites`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.values(SITES)) });
const R = "http://localhost:3821/api/site-internet/pro/echanges";
let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const appel = async (slug, action, extra = {}) => {
  const r = await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, token: "jeton-test", action, ...extra }) });
  const j = await r.json().catch(() => ({}));
  return { statut: r.status, ...j };
};
const LOU = "atelier-lou-dax", BERGINE = "chez-bergine-dax", FLEURS = "fleurs-adour-dax", ALICE = "page-alice-vevey";
const ID = { bergine: "bbbbbbbb-0000-4000-8000-000000000002", lou: "aaaaaaaa-0000-4000-8000-000000000001", alice: "dddddddd-0000-4000-8000-000000000004" };

let e = (await appel(LOU, "etat")).etat;
ok(e?.pret === true && e.mien === null && e.maVille.ouverte === false, `avant tout : prêt, pas d'offre, Dax fermée (${e?.maVille.offres}/${e?.maVille.seuil})`);
ok((await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: LOU, token: "faux", action: "etat" }) })).status === 403, "mauvais jeton : refusé");

let r = await appel(BERGINE, "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 2, equipe: 1, accepte: true });
ok(r.ok && r.etat.mien.equipe === 1 && r.etat.compte.decouvert === 50, `Bergine publie : seule, 50 € d'avance (${r.etat?.compte.decouvert})`);
r = await appel(BERGINE, "cadeau", { titre: "Un dessert du jour", prix: 7, parMois: 10 });
ok(r.ok && r.etat.mien.cadeau?.titre === "Un dessert du jour", "Bergine propose son cadeau : un dessert du jour, 7 €, 10 par mois");
r = await appel(BERGINE, "cadeau", { titre: "Un repas", prix: 100, parMois: 10 });
ok(r.statut === 400, `un « cadeau » à 100 € : refusé (${r.error})`);
r = await appel(BERGINE, "offre", { titre: "x y", prix: 50, parMois: 2, equipe: 7, accepte: true });
ok(r.statut === 400, `équipe de 7 : refusée (${r.error})`);
await appel(FLEURS, "offre", { titre: "Un bouquet de saison", prix: 35, parMois: 4, equipe: 1, accepte: true });
await appel(FLEURS, "cadeau", { titre: "Une fleur de saison", prix: 5, parMois: 20 });

r = await appel(LOU, "prendre", { fournisseur: ID.bergine });
ok(r.ok === false && r.raison === "ville", `Dax à 2 sur 3 : « ${r.message} »`);

r = await appel(LOU, "offre", { titre: "Une coupe et un brushing", prix: 45, parMois: 4, equipe: 2, accepte: true });
e = r.etat;
ok(e.maVille.ouverte && e.maVille.offres === 3, `Lou publie : Dax s'ouvre (${e.maVille.offres}/${e.maVille.seuil})`);
ok(e.compte.decouvert === 100 && e.compte.aDepenser === 100, `équipe de 2 : 100 € d'avance (${e.compte.decouvert})`);
ok(e.cadeaux[0]?.commerce === "Chez Bergine" && /min à pied/.test(e.cadeaux[0]?.aPied ?? ""), `cadeaux : Bergine en tête, ${e.cadeaux[0]?.aPied}`);
ok(e.cadeaux.map((c) => c.commerce).join(",") === "Chez Bergine,Fleurs de l'Adour", `ordre des cadeaux : ${e.cadeaux.map((c) => `${c.commerce} (${c.aPied})`).join(" ; ")}`);
ok(!("echeance" in e.compte), "plus d'échéance en euros dans le compte");

r = await appel(LOU, "offrir", { fournisseur: ID.bergine, quantite: 20, occasion: "pour toute coloration" });
ok(r.ok === false && r.raison === "solde", `20 desserts (140 €) : « ${r.message} »`);
r = await appel(LOU, "offrir", { fournisseur: ID.bergine, quantite: 10, occasion: "pour toute coloration" });
e = r.etat;
const lot = e?.mesCadeaux?.[0];
ok(r.ok && lot?.aDonner === 10 && e.compte.aDepenser === 30, `10 desserts offerts (70 €) : reste ${e?.compte.aDepenser} €, ${lot?.aDonner} à donner`);
r = await appel(LOU, "offrir", { fournisseur: ID.bergine, quantite: 1, occasion: "" });
ok(r.ok === false && r.raison === "complet", `11e dessert du mois : « ${r.message} »`);

r = await appel(LOU, "donner", { cadeau: lot.id });
const code1 = r.code;
ok(r.ok && /^CLK-/.test(code1) && r.etat.mesCadeaux[0].donnes === 1, `un bon remis à un client : ${code1}`);
const html = await (await fetch(`http://localhost:3821/bon/${code1}`)).text();
ok(html.includes("Un cadeau pour toi") && html.includes("Un dessert du jour") && html.includes("L&#x27;Atelier de Lou"), "la page du bon montre la carte cadeau au client");
ok(html.includes("pour toute coloration"), "… avec l'occasion");

r = await appel(BERGINE, "valider", { code: code1.toLowerCase().replace("-", " ") });
ok(r.ok && r.client === true && /Un client envoyé par L'Atelier de Lou/.test(r.message), `Bergine valide (code tapé en minuscules) : « ${r.message} »`);
const bon1 = r.bon;
r = await appel(BERGINE, "venus", { bon: bon1, n: 3 });
ok(r.ok, `venu à 3 : « ${r.message} »`);
r = await appel(BERGINE, "valider", { code: code1 });
ok(r.ok === false && /déjà été validé/.test(r.message), "deuxième validation : refusée");

e = (await appel(LOU, "etat")).etat;
ok(e.reseau.clientsEnvoyes === 1 && e.reseau.personnesEnvoyees === 3, `Lou : 1 client envoyé, 3 personnes`);
ok(e.mesCadeaux[0].utilises === 1 && e.mesCadeaux[0].personnes === 3, "le lot : 1 venu (3 personnes)");
e = (await appel(BERGINE, "etat")).etat;
ok(e.reseau.clientsRecus === 1 && e.reseau.personnesRecues === 3 && e.compte.gagne === 7, `Bergine : 1 client reçu (3 personnes), +7 €`);
ok(e.cadeauxAServir[0]?.n === 9 && e.cadeauxAServir[0]?.de === "L'Atelier de Lou", `Bergine voit 9 bons de Lou en circulation`);
ok(e.recus.some((b) => b.pour === "client" && b.venus === 3), "dans « Déjà validés » : venu à 3");

r = await appel(LOU, "prendre", { fournisseur: ID.bergine });
ok(r.ok === false && r.raison === "solde" && /20 €/.test(r.message), `le dîner (50 €) avec 30 € : « ${r.message} »`);

r = await appel(BERGINE, "prendre", { fournisseur: ID.lou });
ok(r.ok && r.etat.compte.du === 38, `Bergine prend la coupe (45 €) : elle doit ${r.etat?.compte.du} €`);
r = await appel(BERGINE, "pause", { actif: false });
ok(r.ok === false && /Tant que tu dois 38 €/.test(r.message) && r.etat.mien.actif === true, `pause en dette : « ${r.message} »`);
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine });
ok(r.ok, "Fleurs prend le dîner de Bergine");
const bonFleurs = (await appel(BERGINE, "etat")).etat.recus.find((b) => b.statut === "reserve" && b.pour === "moi");
r = await appel(BERGINE, "annuler", { bon: bonFleurs.id });
ok(r.ok === false && /ne peux pas refuser/.test(r.message), `refuser un bon en dette : « ${r.message} »`);

r = await appel(LOU, "donner", { cadeau: lot.id });
const code2 = r.code;
r = await appel(LOU, "reprendre", { cadeau: lot.id });
ok(r.ok && /8 bons repris : 56 €/.test(r.message), `reprendre ceux pas donnés : « ${r.message} »`);
const avantExp = r.etat.compte.aDepenser;
await fetch(`${F}/human_echanges_bons?code=eq.${code2}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ expire_le: "2026-01-01T00:00:00.000Z" }) });
e = (await appel(LOU, "etat")).etat;
ok(e.mesCadeaux[0].expires === 1 && e.compte.aDepenser === avantExp + 7, `le bon donné expire : +7 € reviennent (${avantExp} → ${e.compte.aDepenser})`);
r = await appel(BERGINE, "valider", { code: code2 });
ok(r.ok === false && /expiré/.test(r.message), `valider un bon expiré : « ${r.message} »`);
const html2 = await (await fetch(`http://localhost:3821/bon/${code2}`)).text();
ok(html2.includes("Ce cadeau a expiré"), "la page du client le dit");

r = await appel(ALICE, "offre", { titre: "Deux livres au choix", prix: 40, parMois: 2, equipe: 1, accepte: true });
ok(r.etat.maVille.ouverte === false && r.etat.maVille.offres === 1, `Vevey : ${r.etat.maVille.offres} sur ${r.etat.maVille.seuil}, fermée`);
r = await appel(ALICE, "prendre", { fournisseur: ID.bergine });
ok(r.ok === false && /Vevey dès 3 commerçants/.test(r.message), `Alice ne peut pas encore prendre : « ${r.message} »`);
r = await appel(LOU, "prendre", { fournisseur: ID.alice });
ok(r.ok === false && /pas encore ouvert à Vevey/.test(r.message), `ni Lou chez Alice : « ${r.message} »`);
e = (await appel(LOU, "etat")).etat;
ok(e.villes.map((v) => v.slug).join() === "dax", `villes ouvertes : ${e.villes.map((v) => v.nom).join(", ")}`);

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
