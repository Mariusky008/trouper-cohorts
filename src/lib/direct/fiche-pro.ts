// LA FICHE DU COMMERCE, telle qu'un habitant la consulte depuis Le Direct.
//
// CE QU'ELLE RÉSOUT. Le troisième geste du mode swipe s'appelait « la
// boutique » et faisait quitter l'écran : il envoyait sur le site du
// commerçant, dans un autre onglet, et la sélection en cours était perdue. On
// ne consulte pas un commerce comme on visite un site — on veut savoir où
// c'est, si c'est ouvert, à quoi ça ressemble, et revenir décider.
//
// Cette fiche donne exactement ça, sans quitter la pile : l'adresse, l'itinéraire,
// le numéro pour appeler, et le lien vers le site pour qui veut vraiment aller
// plus loin.
//
// RIEN N'EST INVENTÉ. Un champ vide ne produit pas un bouton grisé ni un texte
// de remplissage : il ne produit rien. Un « Appeler » qui n'appelle personne
// coûte plus cher que son absence.
import { numeroAppel, numeroReservations } from "@/lib/site-internet/pro-phone";

type Supabase = {
  from: (t: string) => {
    select: (c: string) => {
      in: (col: string, v: readonly string[]) => Promise<{ data: unknown }>;
    };
  };
};

export type FichePro = {
  id: string;
  nom: string;
  metier: string;
  ville: string;
  /** L'adresse postale, telle qu'elle est sur sa fiche Google. */
  adresse: string;
  /** Le numéro qu'on APPELLE — un fixe convient très bien pour ça. */
  telephoneAppel: string;
  /** Le numéro qui reçoit les réservations. Mobile, forcément : c'est WhatsApp. */
  telephoneWhatsapp: string;
  /** Ce qu'il dit de son commerce, s'il l'a écrit. */
  presentation: string;
  note: string;
  avis: number;
};

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Les fiches des commerces affichés, EN UNE SEULE LECTURE.
 *
 * Une requête par carte multiplierait les allers-retours par le nombre
 * d'annonces à l'écran, pour un panneau que l'habitant n'ouvrira peut-être
 * jamais. On les charge donc toutes avec le fil, une fois.
 *
 * Table absente ou colonne non migrée : une fiche vide, jamais une erreur. Le
 * Direct sans les fiches reste utilisable — c'est la règle partout ici.
 */
export async function fichesDeSites(
  supabase: unknown,
  siteIds: readonly string[]
): Promise<Map<string, FichePro>> {
  const out = new Map<string, FichePro>();
  const ids = Array.from(new Set(siteIds.filter(Boolean)));
  if (!ids.length) return out;
  try {
    const { data } = await (supabase as Supabase)
      .from("human_vitrine_sites")
      .select(
        "id, business_name, city, activite, address, whatsapp_phone_e164, metadata, diagnostic, google_rating, google_reviews"
      )
      .in("id", ids);
    for (const brut of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      const meta = (brut.metadata && typeof brut.metadata === "object" ? brut.metadata : {}) as Record<string, unknown>;
      const diag = (brut.diagnostic && typeof brut.diagnostic === "object" ? brut.diagnostic : {}) as Record<string, unknown>;
      const note = Number(brut.google_rating);
      out.set(str(brut.id), {
        id: str(brut.id),
        nom: str(brut.business_name),
        metier: str(brut.activite),
        // La ville porte parfois le code postal et le pays : on ne garde que le
        // nom, qui est la seule partie qu'on affiche à côté du métier.
        ville: str(brut.city).replace(/,.*$/, "").replace(/\b\d{5}\b/g, "").trim(),
        adresse: str(brut.address),
        telephoneAppel: numeroAppel(brut as never),
        telephoneWhatsapp: numeroReservations(brut as never),
        presentation: str(meta.presentation || meta.description || diag.description || ""),
        note: Number.isFinite(note) && note > 0 ? note.toFixed(1).replace(".", ",") : "",
        avis: Number(brut.google_reviews) || 0,
      });
    }
  } catch {
    /* sans fiche, la carte se lit encore — le panneau se tait */
  }
  return out;
}

/**
 * L'ADRESSE D'UN ITINÉRAIRE, à partir de ce qu'on sait du commerce.
 *
 * On préfère les COORDONNÉES à l'adresse écrite quand on les a : une adresse
 * mal orthographiée envoie à l'autre bout de la ville, un point ne se trompe
 * jamais. Sans les deux, pas de bouton — plutôt que d'ouvrir une carte vide.
 */
export function lienItineraire(f: Pick<FichePro, "nom" | "adresse" | "ville">, lat?: number | null, lng?: number | null): string {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  // La ville n'est ajoutée QUE si l'adresse ne la contient pas déjà : sans ce
  // filtre on envoyait « Chez Bergeron, 12 rue Neuve, 40100 Dax, Dax » — une
  // requête qu'un moteur de cartes interprète moins bien qu'une adresse propre.
  const dejaDedans = f.ville && f.adresse.toLowerCase().includes(f.ville.toLowerCase());
  const q = [f.nom, f.adresse, dejaDedans ? "" : f.ville].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : "";
}
