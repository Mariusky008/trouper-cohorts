// Quatre commerçants dans le faux Supabase : trois à Dax (la ville s'ouvre à 3, ECHANGES_SEUIL_VILLE=3), une à Vevey (seule : fermée).
import { F } from "./commun.mjs";
const site = (id, slug, nom, ville, activite, lat, lng, adresse) => ({
  id, slug, channel: "letter", business_name: nom, city: ville, activite, address: adresse, pro_token: "jeton-test",
  latitude: lat, longitude: lng, published: true, est_client: true, google_rating: 4.7, google_reviews: 80, google_place_id: null,
  diagnostic: {}, metadata: {}, gallery_photos: [], current_offer: null, services: [], assistant_kb: {}, contact_prenom: "",
});
export const SITES = {
  lou: site("aaaaaaaa-0000-4000-8000-000000000001", "atelier-lou-dax", "L'Atelier de Lou", "Dax", "Coiffeur", 43.7102, -1.0536, "4 rue des Carmes, 40100 Dax, France"),
  bergine: site("bbbbbbbb-0000-4000-8000-000000000002", "chez-bergine-dax", "Chez Bergine", "Dax", "Restaurant", 43.7110, -1.0522, "18 rue Neuve, 40100 Dax, France"),
  fleurs: site("cccccccc-0000-4000-8000-000000000003", "fleurs-adour-dax", "Fleurs de l'Adour", "Dax", "Fleuriste", 43.7088, -1.0551, "2 place de la Fontaine Chaude, 40100 Dax, France"),
  alice: site("dddddddd-0000-4000-8000-000000000004", "page-alice-vevey", "La Page d'Alice", "Vevey", "Librairie", 46.4628, 6.8419, "Rue du Lac 10, 1800 Vevey, Suisse"),
};
if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await fetch(`${F}/human_vitrine_sites`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.values(SITES)) });
  console.log("semés :", r.status);
}
