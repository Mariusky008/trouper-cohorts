// OÙ ALLER, UNE FOIS QU'ON A DIT OUI.
//
// L'écran de confirmation donnait un code et rien d'autre : ni l'adresse, ni
// les horaires, ni la distance. Le code sert au commerçant ; il ne dit pas à
// l'habitant où se rendre. Un engagement pris sans savoir où aller ne se
// transforme pas en visite — et une visite qui n'a pas lieu est exactement ce
// que Clikme promet d'éviter au commerce.
//
// TOUT VIENT DE LA FICHE DU COMMERCE, jamais de la campagne. L'adresse recopiée
// sur chaque Clik serait figée au moment du déménagement, et c'est l'ancienne
// adresse qui resterait affichée.
import { horairesLisibles } from "@/lib/site-internet/horaires-pro";
import { numeroReservations } from "@/lib/site-internet/pro-phone";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type CommerceVue = {
  nom: string;
  metier: string;
  /** Sans « , France » : personne ne cherche le pays de sa boulangerie. */
  adresse: string;
  /** Les horaires DU JOUR, pas la semaine entière. On vient de s'engager pour
   *  aujourd'hui : les six autres lignes sont du bruit à ce moment précis. */
  horaireDuJour: string;
  /** Pour la distance, calculée dans le navigateur — le serveur ne connaît pas
   *  la position de qui lit. */
  lat: number | null;
  lng: number | null;
  /** Le repère de repli quand la position est refusée : le quartier, sinon la
   *  ville. Règle de dégradation : jamais d'écran sans repère spatial. */
  quartier: string;
  /** Son WhatsApp, pour que le client puisse le prévenir lui-même. Chaîne vide
   *  quand on n'en a aucun : le bouton ne s'affiche alors pas, plutôt que
   *  d'ouvrir WhatsApp sur le vide. */
  telephone: string;
};

/** Le jour d'aujourd'hui, à la convention JavaScript (0 = dimanche) — la même
 *  que `human_site_availability.weekday`. */
const JOURS_JS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const sansAccent = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * La ligne d'horaires qui couvre AUJOURD'HUI, parmi des lignes regroupées du
 * type « Lundi – Vendredi ».
 *
 * Renvoie une chaîne vide dès qu'aucune ligne ne correspond avec certitude :
 * afficher les horaires du mardi un jeudi est pire que ne rien afficher, parce
 * que la personne ne va pas vérifier.
 */
export function horaireDeAujourdhui(
  lignes: readonly { jours: string; horaires: string }[],
  maintenant = new Date()
): string {
  const jour = JOURS_JS[maintenant.getDay()];
  for (const l of lignes) {
    const j = sansAccent(l.jours);
    if (j === jour) return l.horaires;
    // « Lundi – Vendredi » : on regarde si aujourd'hui tombe dans l'intervalle,
    // en suivant l'ordre de LECTURE (lundi d'abord), qui est celui du regroupement.
    const m = j.split(/\s*[–-]\s*/);
    if (m.length === 2) {
      const ordre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
      const a = ordre.indexOf(m[0].trim());
      const b = ordre.indexOf(m[1].trim());
      const k = ordre.indexOf(jour);
      if (a >= 0 && b >= 0 && k >= a && k <= b) return l.horaires;
    }
  }
  return "";
}

/**
 * La fiche d'un commerce, telle que l'écran de confirmation en a besoin.
 *
 * Les horaires du commerçant l'emportent sur ceux de Google — c'est le même
 * arbitrage que sur son site public, et pour la même raison : il contrôle les
 * siens, il ne contrôle pas les autres. Repli sur Google plutôt qu'une ligne
 * vide.
 */
export async function commerceDuClik(supabase: unknown, siteId: string): Promise<CommerceVue | null> {
  if (!siteId) return null;
  const sb = supabase as Supabase;
  let row: Record<string, unknown> | null = null;
  try {
    const { data } = await sb
      .from("human_vitrine_sites")
      .select(
        "id, business_name, activite, address, latitude, longitude, quartier, diagnostic, whatsapp_phone_e164, metadata"
      )
      .eq("id", siteId)
      .maybeSingle();
    row = (data as Record<string, unknown> | null) ?? null;
  } catch {
    return null;
  }
  if (!row) return null;

  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  let lignes = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;
  try {
    const { data: av } = await sb
      .from("human_site_availability")
      .select("weekday, start_min, end_min")
      .eq("site_id", siteId);
    const siennes = horairesLisibles(
      ((Array.isArray(av) ? av : []) as Array<Record<string, unknown>>).map((w) => ({
        weekday: Number(w.weekday),
        start_min: Number(w.start_min),
        end_min: Number(w.end_min),
      }))
    );
    if (siennes.length) lignes = siennes;
  } catch {
    /* table absente → on garde ceux de Google */
  }

  const lat = row.latitude;
  const lng = row.longitude;
  return {
    nom: str(row.business_name),
    metier: str(row.activite),
    adresse: str(row.address).replace(/,?\s*France\s*$/i, "").trim(),
    horaireDuJour: horaireDeAujourdhui(
      lignes.map((l) => ({ jours: str(l.jours), horaires: str(l.horaires) })).filter((l) => l.jours && l.horaires)
    ),
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    quartier: str(row.quartier),
    // `numeroReservations`, pas `proPhoneFrom` : c'est l'habitant qui écrit, et
    // pendant les congés du patron c'est l'employé de garde qui doit recevoir.
    // Elle connaît aussi les deux endroits où le numéro du commerçant peut
    // être — la colonne du canal « vitrines », et le formulaire de rappel des
    // sites issus d'une lettre.
    telephone: numeroReservations(row as { whatsapp_phone_e164?: unknown; metadata?: unknown }),
  };
}
