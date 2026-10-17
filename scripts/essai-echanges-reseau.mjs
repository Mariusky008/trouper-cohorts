// 🔁 LE RÉSEAU DES COMMERÇANTS, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Quatre commerces semés (trois à Dax, une à Vevey), puis tout ce que la route doit tenir : la
// ville qui s'ouvre au seuil, 50 € d'avance par personne, le cadeau du voisin (offrir, plafond,
// donner, la page du client, valider, « venu à combien »), les chiffres des deux côtés, la dette
// (ni pause ni refus), reprendre les bons pas donnés, l'expiration, Vevey fermée. Puis l'équipe
// (`20261020120000_echanges_equipe.sql`) : inviter, le lien qui compte à la première ouverture,
// 50 € par personne, ce qu'un membre peut faire ou pas, valider pour la boutique, 4 au plus,
// retirer quelqu'un. Enfin la facture d'échange (`20261021120000_echanges_factures.sql`) : elle attend
// les infos du fournisseur, se fait d'un coup quand il les donne, puis toute seule à chaque validation ;
// TVA ou franchise ; la page de la facture ; la Suisse n'a que le relevé.
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
  fournil: site("eeeeeeee-0000-4000-8000-000000000005", "fournil-dax", "Le Fournil des Arènes", "Dax", "Boulangerie", 43.7095, -1.0530, "7 cours de Verdun, 40100 Dax, France"),
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
/** Un membre de l'équipe, par son lien personnel (`/e/<jeton>`) : ni adresse ni jeton du commerce. */
const appelMembre = async (jeton, action, extra = {}) => {
  const r = await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ membre: jeton, action, ...extra }) });
  const j = await r.json().catch(() => ({}));
  return { statut: r.status, ...j };
};
const jetonDe = (lien) => String(lien ?? "").replace(/^\/e\//, "");
const LOU = "atelier-lou-dax", BERGINE = "chez-bergine-dax", FLEURS = "fleurs-adour-dax", ALICE = "page-alice-vevey", FOURNIL = "fournil-dax";
const ID = {
  bergine: "bbbbbbbb-0000-4000-8000-000000000002", lou: "aaaaaaaa-0000-4000-8000-000000000001", alice: "dddddddd-0000-4000-8000-000000000004",
  fleurs: "cccccccc-0000-4000-8000-000000000003", fournil: "eeeeeeee-0000-4000-8000-000000000005",
};

let e = (await appel(LOU, "etat")).etat;
ok(e?.pret === true && e.mien === null && e.maVille.ouverte === false, `avant tout : prêt, pas d'offre, Dax fermée (${e?.maVille.offres}/${e?.maVille.seuil})`);
ok((await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: LOU, token: "faux", action: "etat" }) })).status === 403, "mauvais jeton : refusé");

let r = await appel(BERGINE, "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 2, accepte: true });
ok(r.ok && r.etat.compte.equipe === 1 && r.etat.compte.decouvert === 50, `Bergine publie : seule, 50 € d'avance (${r.etat?.compte.decouvert})`);
r = await appel(BERGINE, "cadeau", { titre: "Un dessert du jour", prix: 7, parMois: 10 });
ok(r.ok && r.etat.mien.cadeau?.titre === "Un dessert du jour", "Bergine propose son cadeau : un dessert du jour, 7 €, 10 par mois");
r = await appel(BERGINE, "cadeau", { titre: "Un repas", prix: 100, parMois: 10 });
ok(r.statut === 400, `un « cadeau » à 100 € : refusé (${r.error})`);
r = await appel(BERGINE, "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 2, equipe: 5, accepte: true });
ok(r.ok && r.etat.compte.equipe === 1, `« on est 5 » déclaré : ignoré, l'équipe se fait par invitation (${r.etat?.compte.equipe})`);
await appel(FLEURS, "offre", { titre: "Un bouquet de saison", prix: 35, parMois: 4, accepte: true });
await appel(FLEURS, "cadeau", { titre: "Une fleur de saison", prix: 5, parMois: 20 });

r = await appel(LOU, "prendre", { fournisseur: ID.bergine });
ok(r.ok === false && r.raison === "ville", `Dax à 2 sur 3 : « ${r.message} »`);

r = await appel(LOU, "offre", { titre: "Une coupe et un brushing", prix: 45, parMois: 4, accepte: true });
e = r.etat;
ok(e.maVille.ouverte && e.maVille.offres === 3, `Lou publie : Dax s'ouvre (${e.maVille.offres}/${e.maVille.seuil})`);
r = await appel(LOU, "inviter", { prenom: "Léa" });
const jetonLea = jetonDe(r.lien);
ok(r.ok && /^[A-Za-z0-9_-]{24}$/.test(jetonLea) && r.etat.equipe[0]?.actif === false && r.etat.compte.equipe === 1, `Lou invite Léa : un lien /e/… (${jetonLea.length} signes), pas encore dans l'équipe`);
await appelMembre(jetonLea, "etat");
e = (await appel(LOU, "etat")).etat;
ok(e.compte.equipe === 2 && e.compte.decouvert === 100 && e.compte.aDepenser === 100, `Léa ouvre son lien : équipe de 2, 100 € d'avance (${e.compte.decouvert})`);
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

r = await appel(ALICE, "offre", { titre: "Deux livres au choix", prix: 40, parMois: 2, accepte: true });
ok(r.etat.maVille.ouverte === false && r.etat.maVille.offres === 1, `Vevey : ${r.etat.maVille.offres} sur ${r.etat.maVille.seuil}, fermée`);
r = await appel(ALICE, "prendre", { fournisseur: ID.bergine });
ok(r.ok === false && /Vevey dès 3 commerçants/.test(r.message), `Alice ne peut pas encore prendre : « ${r.message} »`);
r = await appel(LOU, "prendre", { fournisseur: ID.alice });
ok(r.ok === false && /pas encore ouvert à Vevey/.test(r.message), `ni Lou chez Alice : « ${r.message} »`);
e = (await appel(LOU, "etat")).etat;
ok(e.villes.map((v) => v.slug).join() === "dax", `villes ouvertes : ${e.villes.map((v) => v.nom).join(", ")}`);

/* ── L'ÉQUIPE, PAR SES LIENS PERSONNELS ─────────────────────────────────── */
console.log("\n— l'équipe du Fournil —");
r = await appel(FOURNIL, "offre", { titre: "Une baguette et deux croissants", prix: 6, parMois: 8, accepte: true });
ok(r.ok && r.etat.compte.equipe === 1 && r.etat.compte.decouvert === 50 && r.etat.moi.role === "responsable", "le Fournil publie : seul, 50 €, responsable");
r = await appel(FOURNIL, "inviter", { prenom: "  Inès  " });
const jetonInes = jetonDe(r.lien);
ok(r.ok && r.prenom === "Inès" && r.etat.equipe.length === 1 && r.etat.equipe[0].lien === `/e/${jetonInes}`, `il invite Inès : son lien ${r.lien}`);
r = await appel(FOURNIL, "inviter", { prenom: "   " });
ok(r.statut === 400, `un prénom vide : refusé (${r.error})`);
const page = await fetch(`http://localhost:3821/e/${jetonInes}`);
const pageHtml = await page.text();
ok(page.status === 200 && pageHtml.includes("Inès") && pageHtml.includes("Fournil"), "la page /e/… s'ouvre : Inès, chez le Fournil");
e = (await appel(FOURNIL, "etat")).etat;
ok(e.equipe[0].actif === false && e.compte.equipe === 1, "l'aperçu de la page (WhatsApp) ne la compte pas encore");
let m = await appelMembre(jetonInes, "etat");
ok(m.etat?.moi.role === "membre" && m.etat.moi.prenom === "Inès" && m.etat.moi.reste === 50 && m.etat.equipe.length === 0, `Inès ouvre : membre, 50 € rien qu'à elle (${m.etat?.moi.reste}), elle ne voit pas l'équipe`);
e = (await appel(FOURNIL, "etat")).etat;
ok(e.equipe[0].actif === true && e.compte.equipe === 2 && e.compte.decouvert === 100, `le Fournil : équipe de 2, 100 € (${e.compte.decouvert})`);
for (const [action, extra] of [["offre", { titre: "x y", prix: 5, parMois: 1, accepte: true }], ["cadeau", { titre: "Un croissant", prix: 2, parMois: 5 }], ["pause", { actif: false }], ["inviter", { prenom: "Max" }], ["retirer", {}], ["offrir", { fournisseur: ID.bergine, n: 5 }]]) {
  m = await appelMembre(jetonInes, action, extra);
  ok(m.statut === 403 && /responsable/.test(m.error), `Inès ne peut pas « ${action} » (${m.error})`);
}
m = await appelMembre(jetonInes, "prendre", { fournisseur: ID.lou });
ok(m.ok && m.etat.moi.reste === 5, `Inès prend la coupe (45 €) : il lui reste ${m.etat?.moi.reste} € ce mois-ci`);
m = await appelMembre(jetonInes, "prendre", { fournisseur: ID.fleurs });
ok(m.ok === false && m.raison === "plafond_perso" && /5 €/.test(m.message), `le bouquet (35 €) : « ${m.message} »`);
r = await appel(FOURNIL, "prendre", { fournisseur: ID.fleurs });
ok(r.ok && r.etat.compte.aDepenser === 20, `le responsable, lui, prend le bouquet sur le compte du commerce : reste ${r.etat?.compte.aDepenser} €`);
e = r.etat;
ok(e.pris.length === 2 && e.pris.find((b) => b.titre.startsWith("Une coupe"))?.qui === "Inès" && !e.pris.find((b) => b.titre.startsWith("Un bouquet"))?.qui, "il voit tout : « Pris par Inès » pour la coupe, le bouquet sans nom");
ok(e.equipe[0].prisCeMois === 45, `« Ce mois-ci : ${e.equipe[0].prisCeMois} € sur 50 € »`);
m = await appelMembre(jetonInes, "etat");
ok(m.etat.pris.length === 1 && m.etat.moi.reste === 5, `Inès ne voit que ses bons (${m.etat.pris.length}), reste ${m.etat.moi.reste} €`);
const bouquet = e.pris.find((b) => b.titre.startsWith("Un bouquet"));
const coupe = e.pris.find((b) => b.titre.startsWith("Une coupe"));
m = await appelMembre(jetonInes, "annuler", { bon: bouquet.id });
ok(m.statut === 403, `Inès n'annule pas le bon du responsable (${m.error})`);
m = await appelMembre(jetonInes, "annuler", { bon: coupe.id });
ok(m.ok && m.etat.moi.reste === 50, `Inès annule sa coupe : ses 50 € reviennent (${m.etat?.moi.reste})`);
m = await appelMembre(jetonInes, "prendre", { fournisseur: ID.lou });
ok(m.ok, "… et la reprend");
r = await appel(LOU, "prendre", { fournisseur: ID.fournil });
const codePain = r.etat?.pris.find((b) => b.titre.startsWith("Une baguette"))?.code;
ok(r.ok && /^CLK-/.test(codePain ?? ""), `Lou prend une baguette au Fournil : ${codePain}`);
m = await appelMembre(jetonInes, "valider", { code: codePain });
ok(m.ok && /le produit de ta boutique : elle a gagné 6 €/.test(m.message), `Inès valide au comptoir : « ${m.message} »`);
e = (await appel(FOURNIL, "etat")).etat;
ok(e.recus.find((b) => b.code === codePain)?.validePar === "Inès" && e.compte.gagne === 6, "le responsable voit « validé par Inès », +6 €");
for (const prenom of ["Tom", "Noé", "Zoé"]) await appel(FOURNIL, "inviter", { prenom });
r = await appel(FOURNIL, "inviter", { prenom: "Max" });
ok(r.ok === false && /complète/.test(r.message) && r.etat.equipe.length === 4, `5e invitation : « ${r.message} »`);
ok(r.etat.compte.equipe === 2, "trois invitations pas encore ouvertes : toujours 2 dans l'équipe");
r = await appel(FOURNIL, "retirer", { membre: r.etat.equipe.find((x) => x.prenom === "Inès").id });
ok(r.ok && /Inès ne fait plus partie/.test(r.message) && r.etat.compte.equipe === 1 && r.etat.equipe.length === 3, `le responsable retire Inès : « ${r.message} »`);
ok(r.etat.pris.find((b) => b.titre.startsWith("Une coupe"))?.qui === "Inès" && r.etat.compte.du === 74, `ce qu'elle a pris reste dû par le Fournil : ${r.etat.compte.du} €`);
m = await appelMembre(jetonInes, "etat");
ok(m.statut === 403 && /plus valable/.test(m.error), `son lien ne marche plus : « ${m.error} »`);
ok((await (await fetch(`http://localhost:3821/e/${jetonInes}`)).text()).includes("plus valable"), "la page /e/… le dit aussi");
r = await appel(FOURNIL, "inviter", { prenom: "Max" });
ok(r.ok, "une place s'est libérée : Max peut venir");
m = await appelMembre("x".repeat(24), "etat");
ok(m.statut === 403, "un jeton inventé : refusé");

/* ── LA FACTURE D'ÉCHANGE ───────────────────────────────────────────────── */
console.log("\n— les factures —");
// React glisse « <!-- --> » entre deux bouts de texte : on les retire pour lire la page comme on la voit.
const lire = async (lien) => (await (await fetch(`http://localhost:3821${lien}`)).text()).replace(/<!-- -->/g, "");
let f = await appel(BERGINE, "factures");
ok(f.ok && f.factures.pays === "fr" && f.factures.infos === null && f.factures.aPreparer === 1 && f.factures.emises.length === 0, `Bergine, sans ses infos : ${f.factures?.aPreparer} facture à préparer (le dessert de Lou)`);
ok(f.factures.suggestion.nomLegal === "Chez Bergine" && f.factures.suggestion.taux === 10 && f.factures.suggestion.nature === "services", `on lui propose : « ${f.factures.suggestion.nomLegal} », TVA ${f.factures.suggestion.taux} %, services`);
ok((await appel(BERGINE, "etat")).etat.factures?.infos === false, "l'état du comptoir le sait (pastille « Mes factures »)");
const bonDuDiner = (await appel(BERGINE, "etat")).etat.recus.find((b) => b.statut === "reserve" && b.autre === "Fleurs de l'Adour");
r = await appel(BERGINE, "valider", { code: bonDuDiner.code });
ok(r.ok && r.facture === "infos" && /Ta facture d’échange t’attend/.test(r.message), `elle valide le dîner de Fleurs : « ${r.message} »`);
const infosBergine = { nomLegal: "SARL Bergine", forme: "SARL", capital: "5 000 €", immatriculation: "RCS Dax", adresse: "18 rue Neuve, 40100 Dax", siret: "123 456 782 00010", franchise: false, taux: 10, nature: "services", accepte: true };
r = await appel(BERGINE, "facturation", { ...infosBergine, siret: "123 456 782 00011" });
ok(r.statut === 400 && /SIRET/.test(r.error), `un SIRET faux : « ${r.error} »`);
r = await appel(BERGINE, "facturation", { ...infosBergine, capital: "" });
ok(r.statut === 400 && /capital/.test(r.error), `une SARL sans capital : « ${r.error} »`);
r = await appel(BERGINE, "facturation", { ...infosBergine, accepte: false });
ok(r.statut === 400 && /accord/.test(r.error), `sans son accord : « ${r.error} »`);
r = await appel(BERGINE, "facturation", infosBergine);
const an = new Date().getFullYear();
const [fDiner, fDessert] = r.factures?.emises ?? [];
ok(r.ok && /2 factures d’échange sont prêtes/.test(r.message) && r.factures.emises.length === 2 && r.factures.aPreparer === 0, `ses infos données : « ${r.message} »`);
ok(fDessert?.numero === `ECH-${an}-0001` && fDiner?.numero === `ECH-${an}-0002`, `dans l'ordre des remises : le dessert ${fDessert?.numero}, le dîner ${fDiner?.numero}`);
ok(fDessert.ht === 6.36 && fDessert.tva === 0.64 && fDiner.ht === 45.45 && fDiner.tva === 4.55, `TVA 10 % : dessert ${fDessert.ht} + ${fDessert.tva}, dîner ${fDiner.ht} + ${fDiner.tva}`);
ok(r.factures.infos.tvaIntra === "FR11123456782" && r.factures.infos.siret === "12345678200010", `son n° de TVA calculé d'après le SIREN : ${r.factures.infos.tvaIntra}`);
let pageFacture = await lire(fDessert.lien);
ok(pageFacture.includes(`ECH-${an}-0001`) && pageFacture.includes("SARL Bergine") && pageFacture.includes("SIRET 123 456 782 00010") && pageFacture.includes("FR11123456782") && pageFacture.includes("au capital de 5 000 €"), "la page de la facture : numéro, vendeur, SIRET, TVA, capital");
ok(pageFacture.includes("Cadeau offert par L&#x27;Atelier de Lou") && pageFacture.includes("Bon CLK-") && pageFacture.includes("Prestation de services") && pageFacture.includes("réglée par échange"), "… la ligne (le cadeau d'un client de Lou), la nature, le paiement par échange");
ok((await lire(`/facture/${"0".repeat(64)}`)).includes("Facture introuvable"), "un lien inventé : facture introuvable");
f = await appel(LOU, "factures");
ok(f.factures.recues.length === 1 && f.factures.recues[0].numero === `ECH-${an}-0001` && f.factures.recues[0].autre === "Chez Bergine", `Lou la reçoit : ${f.factures.recues[0]?.numero} de ${f.factures.recues[0]?.autre}`);
f = await appel(FLEURS, "factures");
ok(f.factures.recues.length === 1 && f.factures.recues[0].ttc === 50, "Fleurs reçoit celle du dîner");

// Lou valide la coupe de Bergine, puis donne ses infos : EI en franchise, pas de TVA.
const coupeDeBergine = (await appel(LOU, "etat")).etat.recus.find((b) => b.statut === "reserve" && b.autre === "Chez Bergine");
r = await appel(LOU, "valider", { code: coupeDeBergine.code });
ok(r.ok && r.facture === "infos", "Lou valide la coupe de Bergine : sa facture l'attend");
r = await appel(LOU, "facturation", { nomLegal: "Lou Martin", forme: "EI", capital: "", immatriculation: "", adresse: "4 rue des Carmes, 40100 Dax", siret: "98765432400019", franchise: true, taux: null, nature: "services", accepte: true });
const fCoupe = r.factures?.emises[0];
ok(r.ok && fCoupe?.numero === `ECH-${an}-0001` && fCoupe.ht === 45 && fCoupe.tva === 0 && fCoupe.taux === null, `Lou, en franchise : ${fCoupe?.numero}, 45 € sans TVA (sa propre série)`);
pageFacture = await lire(fCoupe.lien);
ok(pageFacture.includes("Lou Martin EI") && pageFacture.includes("TVA non applicable, art. 293 B du CGI") && pageFacture.includes("SARL Bergine") && !pageFacture.includes("FR14987654324") && pageFacture.includes("TVA intracommunautaire FR11123456782"), "la page : « Lou Martin EI », la mention de franchise, pas de n° de TVA pour elle ; l'acheteur avec son nom légal et le sien");

// Le Fournil n'a pas ses infos : ce qu'il a acheté chez Fleurs attend la facture de Fleurs.
const bouquetDuFournil = (await appel(FLEURS, "etat")).etat.recus.find((b) => b.statut === "reserve" && b.autre === "Le Fournil des Arènes");
await appel(FLEURS, "valider", { code: bouquetDuFournil.code });
// Désormais, chaque validation chez Bergine fait sa facture toute seule.
r = await appel(FLEURS, "offrir", { fournisseur: ID.bergine, quantite: 1, occasion: "" });
const lotFleurs = r.etat?.mesCadeaux?.[0];
r = await appel(FLEURS, "donner", { cadeau: lotFleurs?.id });
r = await appel(BERGINE, "valider", { code: r.code });
ok(r.ok && r.facture === "faite" && !/t’attend/.test(r.message), `Bergine valide le cadeau d'un client de Fleurs : facture faite tout de suite`);
f = await appel(BERGINE, "factures");
ok(f.factures.emises[0].numero === `ECH-${an}-0003` && f.factures.emises.length === 3, `… ${f.factures.emises[0].numero}, sans trou`);
ok(f.factures.releve.filter((l) => l.sens === "vendu").length === 3 && f.factures.releve.some((l) => l.sens === "achete" && l.titre.startsWith("Une coupe") && l.numero === `ECH-${an}-0001`), "le relevé : ses 3 ventes, et la coupe achetée chez Lou avec son numéro");

f = await appel(FOURNIL, "factures");
ok(f.factures.enAttente.some((a) => a.chez === "Fleurs de l'Adour" && a.titre.startsWith("Un bouquet")), "le Fournil voit le bouquet « en attente de facture » de Fleurs");

// Un membre de l'équipe ne touche pas aux factures ; la Suisse a le relevé seulement.
const jetonMax = jetonDe((await appel(FOURNIL, "etat")).etat.equipe.find((x) => x.prenom === "Max")?.lien);
m = await appelMembre(jetonMax, "factures");
ok(m.statut === 403, `un membre : pas de factures (${m.error})`);
f = await appel(ALICE, "factures");
ok(f.ok && f.factures.pays === "ch" && f.factures.aPreparer === 0 && f.factures.enAttente.length === 0, "Vevey (Suisse) : le relevé, sans facture à préparer");
r = await appel(ALICE, "facturation", infosBergine);
ok(r.statut === 400 && /bientôt/.test(r.error), `Alice ne peut pas encore donner d'infos : « ${r.error} »`);

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
