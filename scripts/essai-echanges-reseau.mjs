// 🔁 LE RÉSEAU DES COMMERÇANTS, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Quatre commerces semés (trois à Dax, une à Vevey), puis tout ce que la route doit tenir : la
// ville qui s'ouvre au seuil, 50 € d'avance par personne, prendre et valider, la page du bon, les
// actions retirées avec « Pour mes clients », la dette (ni pause ni refus), l'expiration, Vevey
// fermée. Puis l'équipe
// (`20261020120000_echanges_equipe.sql`) : inviter, le lien qui compte à la première ouverture,
// 50 € par personne, ce qu'un membre peut faire ou pas, valider pour la boutique, 4 au plus,
// retirer quelqu'un. Enfin la facture d'échange (`20261021120000_echanges_factures.sql`) : elle attend
// les infos du fournisseur, se fait d'un coup quand il les donne, puis toute seule à chaque validation ;
// TVA ou franchise ; la page de la facture ; la Suisse n'a que le relevé. Puis « jamais plein tarif »
// (la moitié prix), et « 3 offres max et limite par offre » (`20261023120000_echanges_offres.sql`).
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
r = await appel(BERGINE, "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 2, equipe: 5, accepte: true });
ok(r.ok && r.etat.compte.equipe === 1, `« on est 5 » déclaré : ignoré, l'équipe se fait par invitation (${r.etat?.compte.equipe})`);
await appel(FLEURS, "offre", { titre: "Un bouquet de saison", prix: 35, parMois: 4, accepte: true });

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
ok(/min à pied/.test(e.offres.find((o) => o.commerce === "Chez Bergine")?.aPied ?? ""), `Bergine : ${e.offres.find((o) => o.commerce === "Chez Bergine")?.aPied}`);
ok(!("echeance" in e.compte), "plus d'échéance en euros dans le compte");
ok(!("cadeaux" in e) && !("mesCadeaux" in e) && !("reseau" in e) && !("cadeau" in e.mien), "plus rien de « Pour mes clients » dans l'état");

/* « POUR MES CLIENTS » EST RETIRÉ : ses actions n'existent plus. */
for (const action of ["cadeau", "offrir", "donner", "reprendre", "venus"]) {
  r = await appel(LOU, action, { titre: "Un dessert du jour", prix: 7, parMois: 10, fournisseur: ID.bergine, quantite: 1, cadeau: ID.bergine, bon: ID.bergine, n: 2 });
  ok(r.statut === 400 && /inconnue/.test(r.error), `« ${action} » : action inconnue`);
}

r = await appel(LOU, "prendre", { fournisseur: ID.bergine });
const code1 = r.etat?.pris.find((b) => b.titre.startsWith("Un dîner"))?.code ?? "";
ok(r.ok && /^CLK-/.test(code1) && r.etat.compte.aDepenser === 50, `Lou prend le dîner de Bergine : ${code1}, reste ${r.etat?.compte.aDepenser} €`);
const html = (await (await fetch(`http://localhost:3821/bon/${code1}`)).text()).replace(/<!-- -->/g, "");
ok(html.includes("Bon d’échange ClikMe") && html.includes(code1) && !html.includes("Un cadeau pour toi"), "la page du bon : le code, plus de carte cadeau");

r = await appel(BERGINE, "valider", { code: code1.toLowerCase().replace("-", " ") });
ok(r.ok && /L'Atelier de Lou a bien reçu ton produit : tu as gagné 50 €/.test(r.message), `Bergine valide (code tapé en minuscules) : « ${r.message} »`);
r = await appel(BERGINE, "valider", { code: code1 });
ok(r.ok === false && /déjà été validé/.test(r.message), "deuxième validation : refusée");
e = (await appel(BERGINE, "etat")).etat;
ok(e.compte.gagne === 50 && e.compte.aDepenser === 100, `Bergine : +50 €, elle peut dépenser ${e.compte.aDepenser} €`);

r = await appel(LOU, "prendre", { fournisseur: ID.fleurs });
const codeBouquetLou = r.etat?.pris.find((b) => b.titre.startsWith("Un bouquet"))?.code ?? "";
ok(r.ok && r.etat.compte.aDepenser === 15, `Lou prend un bouquet (35 €) : reste ${r.etat?.compte.aDepenser} €`);
r = await appel(LOU, "prendre", { fournisseur: ID.bergine });
ok(r.ok === false && r.raison === "solde" && /35 €/.test(r.message), `un second dîner (50 €) avec 15 € : « ${r.message} »`);

r = await appel(BERGINE, "prendre", { fournisseur: ID.lou });
r = await appel(BERGINE, "prendre", { fournisseur: ID.fleurs });
ok(r.ok && r.etat.compte.du === 30, `Bergine prend la coupe (45 €) et un bouquet (35 €) : elle doit ${r.etat?.compte.du} €`);
r = await appel(BERGINE, "pause", { actif: false });
ok(r.ok === false && /Tant que tu dois 30 €/.test(r.message) && r.etat.mien.actif === true, `pause en dette : « ${r.message} »`);
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine });
ok(r.ok, "Fleurs prend le dîner de Bergine");
const bonFleurs = (await appel(BERGINE, "etat")).etat.recus.find((b) => b.statut === "reserve" && b.autre === "Fleurs de l'Adour");
r = await appel(BERGINE, "annuler", { bon: bonFleurs.id });
ok(r.ok === false && /ne peux pas refuser/.test(r.message), `refuser un bon en dette : « ${r.message} »`);

await fetch(`${F}/human_echanges_bons?code=eq.${codeBouquetLou}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ expire_le: "2026-01-01T00:00:00.000Z" }) });
e = (await appel(LOU, "etat")).etat;
ok(e.compte.aDepenser === 50, `le bouquet de Lou expire : ses 35 € reviennent (${e.compte.aDepenser} €)`);
r = await appel(FLEURS, "valider", { code: codeBouquetLou });
ok(r.ok === false && /expiré/.test(r.message), `valider un bon expiré : « ${r.message} »`);

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
for (const [action, extra] of [["offre", { titre: "x y", prix: 5, parMois: 1, accepte: true }], ["pause", { actif: false }], ["inviter", { prenom: "Max" }], ["retirer", {}]]) {
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
ok(f.ok && f.factures.pays === "fr" && f.factures.infos === null && f.factures.aPreparer === 1 && f.factures.emises.length === 0, `Bergine, sans ses infos : ${f.factures?.aPreparer} facture à préparer (le dîner de Lou)`);
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
const [fDiner, fDinerLou] = r.factures?.emises ?? [];
ok(r.ok && /2 factures d’échange sont prêtes/.test(r.message) && r.factures.emises.length === 2 && r.factures.aPreparer === 0, `ses infos données : « ${r.message} »`);
ok(fDinerLou?.numero === `ECH-${an}-0001` && fDiner?.numero === `ECH-${an}-0002`, `dans l'ordre des validations : le dîner de Lou ${fDinerLou?.numero}, celui de Fleurs ${fDiner?.numero}`);
ok(fDinerLou.ht === 45.45 && fDinerLou.tva === 4.55 && fDiner.ht === 45.45 && fDiner.tva === 4.55, `TVA 10 % : ${fDiner.ht} + ${fDiner.tva} par dîner`);
ok(r.factures.infos.tvaIntra === "FR11123456782" && r.factures.infos.siret === "12345678200010", `son n° de TVA calculé d'après le SIREN : ${r.factures.infos.tvaIntra}`);
let pageFacture = await lire(fDinerLou.lien);
ok(pageFacture.includes(`ECH-${an}-0001`) && pageFacture.includes("SARL Bergine") && pageFacture.includes("SIRET 123 456 782 00010") && pageFacture.includes("FR11123456782") && pageFacture.includes("au capital de 5 000 €"), "la page de la facture : numéro, vendeur, SIRET, TVA, capital");
ok(pageFacture.includes("Un dîner pour deux") && pageFacture.includes("Bon CLK-") && pageFacture.includes("Prestation de services") && pageFacture.includes("réglée par échange"), "… la ligne (le dîner de Lou), la nature, le paiement par échange");
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
// Désormais, chaque validation chez Bergine fait sa facture toute seule. Elle passe à 4 dîners par mois
// (Lou et Fleurs ont pris les deux de ce mois), et Lou en reprend un.
await appel(BERGINE, "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 4, accepte: true });
r = await appel(LOU, "prendre", { fournisseur: ID.bergine });
const code3 = r.etat?.pris.find((b) => b.titre.startsWith("Un dîner") && b.statut === "reserve")?.code ?? "";
r = await appel(BERGINE, "valider", { code: code3 });
ok(r.ok && r.facture === "faite" && !/t’attend/.test(r.message), `Bergine valide un second dîner de Lou : facture faite tout de suite`);
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

/* ── À MOITIÉ PRIX, C'EST TOUT (`…_moitie_prix.sql`, `20261024120000_echanges_moitie_simple.sql`) ── */
console.log("\n— à moitié prix —");
// Lou : 100 € d'avance (Léa), +45 gagnés (sa coupe), 106 pris avec ses crédits → 39 €.
e = (await appel(LOU, "etat")).etat;
ok(e.compte.aDepenser === 39, `Lou peut encore dépenser ${e.compte.aDepenser} € en crédits`);
r = await appel(LOU, "prendre", { fournisseur: ID.bergine, mode: "credits" });
ok(r.ok === false && r.raison === "solde" && /11 €/.test(r.message), `un dîner (50 €) avec ses crédits : « ${r.message} »`);
r = await appel(LOU, "prendre", { fournisseur: ID.bergine, mode: "moitie" });
const bonMoitie = r.etat?.pris.find((b) => b.mode === "moitie");
ok(r.ok && bonMoitie?.aRegler === 25 && bonMoitie?.credits === 0 && r.etat.compte.aDepenser === 39, `le même dîner à moitié prix : ${bonMoitie?.aRegler} € à régler, aucun crédit ne bouge (${r.etat?.compte.aDepenser} €)`);
ok(!("moitieDeja" in (r.etat.offres.find((o) => o.id === ID.bergine) ?? {})), "plus de « une fois par mois » : la carte ne dit plus « déjà pris »");
const gagneAvant = (await appel(BERGINE, "etat")).etat.compte.gagne;
r = await appel(BERGINE, "valider", { code: bonMoitie.code });
ok(r.ok && /à moitié prix : encaisse 25\u00a0€ sur place\.$/.test(r.message) && !/crédit/.test(r.message) && r.facture === "faite", `Bergine valide : « ${r.message} »`);
e = r.etat;
ok(e.compte.gagne === gagneAvant && e.recus.find((b) => b.code === bonMoitie.code)?.mode === "moitie", `elle encaisse 25 €, et ses crédits ne bougent pas : ${gagneAvant} → ${e.compte.gagne} €`);
f = await appel(BERGINE, "factures");
const fMoitie = f.factures.emises[0];
ok(fMoitie.numero === `ECH-${an}-0004` && fMoitie.ttc === 25 && fMoitie.ht === 22.73 && fMoitie.tva === 2.27, `la facture : ${fMoitie.numero}, du montant payé (${fMoitie.ttc} € dont ${fMoitie.tva} € de TVA)`);
pageFacture = await lire(fMoitie.lien);
ok(/réglée en euros, sur place/.test(pageFacture) && pageFacture.includes("Prix public 50 € · remise de 50 % entre commerçants ClikMe") && !/par échange de produits/.test(pageFacture), "… « Prix public 50 € · remise de 50 % », réglée en euros, sur place");
// Une librairie : pas de moitié prix (prix unique du livre).
await fetch(`${F}/human_echanges_offres?site_id=eq.${ID.fleurs}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ metier: "Librairie" }) });
r = await appel(LOU, "prendre", { fournisseur: ID.fleurs, mode: "moitie" });
ok(r.ok === false && r.raison === "livre" && r.etat.offres.find((o) => o.id === ID.fleurs)?.sansMoitie === true, `chez une librairie : « ${r.message} »`);
await fetch(`${F}/human_echanges_offres?site_id=eq.${ID.fleurs}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ metier: "Fleuriste" }) });
// Léa, de l'équipe de Lou : à moitié prix, ses 50 € ne bougent pas.
m = await appelMembre(jetonLea, "etat");
const resteLea = m.etat.moi.reste;
m = await appelMembre(jetonLea, "prendre", { fournisseur: ID.fournil, mode: "moitie" });
ok(m.ok && m.etat.moi.reste === resteLea && m.etat.pris.some((b) => b.mode === "moitie" && b.aRegler === 3), `Léa prend une baguette à moitié prix (3 €) : il lui reste toujours ${m.etat?.moi.reste} €`);
r = await appel(LOU, "prendre", { fournisseur: ID.fournil, mode: "moitie" });
ok(r.ok && r.etat.pris.filter((b) => b.mode === "moitie" && b.titre.startsWith("Une baguette")).length === 2, "Lou aussi, à moitié prix au Fournil, après Léa : plus de « une fois par mois »");
r = await appel(LOU, "prendre", { fournisseur: ID.fournil });
ok(r.ok && r.etat.pris.filter((b) => b.titre.startsWith("Une baguette")).some((b) => b.mode === "credits" && b.statut === "reserve"), "sans mode : avec ses crédits, comme avant");

/* ── « 3 OFFRES MAX ET LIMITE PAR OFFRE » (`20261023120000_echanges_offres.sql`) ──── */
console.log("\n— 3 offres max et limite par offre —");
r = await appel(BERGINE, "autre", { titre: "Un dessert du jour", prix: 8, parMois: 1, paiement: "moitie" });
const dessert = r.etat?.mien.autres[0]?.id;
ok(r.ok && r.etat.mien.autres.length === 1 && r.etat.mien.autres[0].paiement === "moitie" && r.etat.mien.paiement === "les_deux", `Bergine ajoute un dessert, à moitié prix seulement : « ${r.message} »`);
r = await appel(BERGINE, "autre", { titre: "Un menu midi", prix: 15, parMois: 2, paiement: "credits" });
const menu = r.etat?.mien.autres.find((a) => a.titre === "Un menu midi")?.id;
ok(r.ok && r.etat.mien.autres.length === 2 && Boolean(menu), "… puis un menu midi, en échange seulement");
r = await appel(BERGINE, "autre", { titre: "Un café", prix: 5, parMois: 8 });
ok(r.ok === false && /3 offres au plus/.test(r.message) && r.etat.mien.autres.length === 2, `une 4e offre : « ${r.message} »`);
r = await appel(BERGINE, "autre", { titre: "Un café", prix: 5, parMois: 3 });
ok(r.statut === 400 && /1, 2, 4 ou 8/.test(r.error), `3 par mois : « ${r.error} »`);
m = await appelMembre(jetonMax, "autre", { titre: "Un pain au chocolat", prix: 5, parMois: 8 });
ok(m.statut === 403, `un membre n'ajoute pas d'offre (${m.error})`);
e = (await appel(FLEURS, "etat")).etat;
const deBergine = e.offres.filter((o) => o.fournisseur === ID.bergine);
ok(deBergine.length === 3 && deBergine[0].offre === null && deBergine.map((o) => o.paiement).join() === "les_deux,moitie,credits", `Fleurs voit les 3 offres de Bergine : ${deBergine.map((o) => `${o.titre} (${o.paiement})`).join(", ")}`);
ok(new Set(e.offres.map((o) => o.id)).size === e.offres.length && deBergine.find((o) => o.id === menu)?.restant === 2, "chaque offre a son id, et sa limite (le menu : encore 2)");
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine, offre: dessert, mode: "credits" });
ok(r.ok === false && r.raison === "paiement" && /moitié prix seulement/.test(r.message), `le dessert avec ses crédits : « ${r.message} »`);
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine, offre: menu, mode: "moitie" });
ok(r.ok === false && r.raison === "paiement" && /échange seulement/.test(r.message), `le menu à moitié prix : « ${r.message} »`);
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine, offre: dessert, mode: "moitie" });
const bonDessert = r.etat?.pris.find((b) => b.titre === "Un dessert du jour");
ok(r.ok && bonDessert?.mode === "moitie" && bonDessert.aRegler === 4 && bonDessert.prix === 8, `le dessert à moitié prix : ${bonDessert?.aRegler} € à régler`);
r = await appel(FOURNIL, "prendre", { fournisseur: ID.bergine, offre: dessert, mode: "moitie" });
ok(r.ok === false && r.raison === "complet" && /de ce produit/.test(r.message), `le dessert (1 par mois) est complet : « ${r.message} »`);
ok(r.etat.offres.find((o) => o.id === dessert)?.restant === 0 && r.etat.offres.find((o) => o.id === menu)?.restant === 2, "… mais pas le menu : chaque offre sa limite");
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine, mode: "moitie" });
ok(r.ok === false && r.raison === "complet", `Fleurs, à moitié prix sur le dîner après le dessert : seule la limite du dîner compte (4 par mois, atteinte) — « ${r.message} »`);
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine, offre: menu, mode: "credits" });
const bonMenu = r.etat?.pris.find((b) => b.titre === "Un menu midi");
ok(r.ok && bonMenu?.prix === 15 && bonMenu.mode === "credits", "le menu avec ses crédits : 15 €");
r = await appel(BERGINE, "valider", { code: bonMenu.code });
ok(r.ok && /tu as gagné 15 €/.test(r.message), `Bergine valide le menu : « ${r.message} »`);
r = await appel(BERGINE, "autre", { id: menu, titre: "Un menu midi", prix: 16, parMois: 4, paiement: "les_deux" });
ok(r.ok && r.etat.mien.autres.find((a) => a.id === menu)?.prix === 16 && r.etat.mien.autres.find((a) => a.id === menu)?.paiement === "les_deux", "elle modifie le menu : 16 €, 4 par mois, les deux");
ok(r.etat.recus.find((b) => b.code === bonMenu.code)?.prix === 15, "le bon déjà pris garde son prix (15 €)");
r = await appel(BERGINE, "autre_retirer", { id: dessert });
ok(r.ok && r.etat.mien.autres.length === 1 && /restent valables/.test(r.message), `elle retire le dessert : « ${r.message} »`);
e = (await appel(FLEURS, "etat")).etat;
ok(!e.offres.some((o) => o.id === dessert) && e.pris.find((b) => b.code === bonDessert.code)?.statut === "reserve", "retiré : plus visible, et le bon de Fleurs reste réservé");
r = await appel(FLEURS, "prendre", { fournisseur: ID.bergine, offre: dessert, mode: "moitie" });
ok(r.ok === false && r.raison === "offre_retiree", `le dessert retiré : « ${r.message} »`);
r = await appel(LOU, "prendre", { fournisseur: ID.fleurs, offre: menu, mode: "credits" });
ok(r.ok === false && r.raison === "offre_retiree", "l'offre de Bergine demandée chez Fleurs : refusée");
r = await appel(BERGINE, "autre", { titre: "Un café gourmand", prix: 9, parMois: 4 });
ok(r.ok && r.etat.mien.autres.length === 2 && r.etat.mien.autres.find((a) => a.titre === "Un café gourmand")?.paiement === "les_deux", "une place libérée : un café gourmand, payé des deux façons par défaut");
r = await appel(BERGINE, "autre_retirer", { id: "aaaaaaaa-0000-4000-8000-00000000ffff" });
ok(r.ok === false, "retirer une offre inconnue : rien");
// Sa première offre : comment on la lui paie ; un écran d'avant (sans `paiement`) garde son choix.
r = await appel(LOU, "offre", { titre: "Une coupe et un brushing", prix: 45, parMois: 4, paiement: "credits", accepte: true });
ok(r.ok && r.etat.mien.paiement === "credits", "Lou : sa coupe, en échange seulement");
r = await appel(LOU, "offre", { titre: "Une coupe et un brushing", prix: 45, parMois: 4, accepte: true });
ok(r.ok && r.etat.mien.paiement === "credits", "republiée par un écran d'avant : toujours en échange seulement");
r = await appel(FLEURS, "prendre", { fournisseur: ID.lou, mode: "moitie" });
ok(r.ok === false && r.raison === "paiement", `la coupe à moitié prix : « ${r.message} »`);
// Une librairie : en échange seulement, même si elle demande autre chose.
await fetch(`${F}/human_echanges_offres?site_id=eq.${ID.alice}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ metier: "Librairie" }) });
r = await appel(ALICE, "autre", { titre: "Un marque-page brodé", prix: 6, parMois: 8, paiement: "moitie" });
ok(r.ok && r.etat.mien.autres[0]?.paiement === "credits", "Alice (librairie) ajoute un marque-page à −50 % seulement : enregistré en échange seulement");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
