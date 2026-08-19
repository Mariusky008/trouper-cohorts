// LES CARTES DU JOUR DE LA VILLE, TOUTES ENSEMBLE.
//
// POURQUOI UNE PAGE À ELLES. Dans le fil, voir les menus de six restaurants
// demandait six fois le même travail : appuyer sur une photo, la lire, la
// fermer, faire défiler jusqu'au suivant. Or on ne choisit pas où déjeuner en
// examinant un menu, puis en l'oubliant, puis en examinant le suivant — on les
// compare. Une page qui les fait défiler d'un geste transforme six efforts en
// un seul.
//
// CE QU'ELLE NE FAIT PAS : elle ne devient pas un annuaire des restaurants de la
// ville. Elle ne montre QUE les cartes publiées aujourd'hui, avec une photo ou
// un texte, et elle est vide le jour où personne n'en a publié — parce que c'est
// alors la vérité.
import { numeroReservations } from "@/lib/site-internet/pro-phone";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type MenuDuJour = {
  /** L'identifiant de la publication : sert d'ancre pour revenir au fil. */
  id: string;
  siteId: string;
  commerce: string;
  metier: string;
  slug: string;
  /** La photo de l'ardoise. Absente si le commerçant a préféré l'écrire. */
  photo: string | null;
  /** Le texte de la carte — c'est tout le contenu quand il n'y a pas de photo. */
  texte: string;
  /** Le numéro à qui envoyer la demande de table. "" si on n'en a aucun. */
  telephone: string;
};

/**
 * Le numéro « réservations » de plusieurs commerces, en UNE lecture.
 *
 * Le fil en a besoin pour les cartes du jour — leur bouton « Je réserve » ouvre
 * WhatsApp — et la page des menus en a besoin pour les mêmes commerces. Une
 * seule fonction pour les deux : deux lectures écrites séparément finiraient par
 * résoudre le numéro différemment, et un habitant écrirait au patron en congés.
 */
export async function telephonesDeSites(supabase: unknown, siteIds: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = Array.from(new Set(siteIds.filter(Boolean)));
  if (!ids.length) return out;
  try {
    const { data } = await (supabase as Supabase)
      .from("human_vitrine_sites")
      .select("id, whatsapp_phone_e164, metadata")
      .in("id", ids);
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      const tel = numeroReservations(r as { whatsapp_phone_e164?: unknown; metadata?: unknown });
      if (tel) out.set(str(r.id), tel);
    }
  } catch {
    /* sans numéro, la carte se lit encore — le bouton « Je réserve » se tait */
  }
  return out;
}

/**
 * Les cartes du jour d'une ville, dans l'ordre de publication.
 *
 * DEUX LECTURES et pas une jointure : PostgREST sait joindre, mais le numéro du
 * commerçant peut vivre à deux endroits (la colonne, ou le formulaire de rappel
 * dans `metadata`) et c'est `numeroReservations` qui tranche — en TypeScript.
 *
 * Table absente ou colonne non migrée : une page vide, jamais une erreur. Le
 * Direct sans les menus reste utile.
 */
export async function menusDuJour(supabase: unknown, villeSlug: string, max = 40): Promise<MenuDuJour[]> {
  const sb = supabase as Supabase;
  if (!villeSlug) return [];

  const maintenant = new Date().toISOString();
  let lignes: Record<string, unknown>[] = [];
  try {
    const { data, error } = await sb
      .from("human_publications")
      .select("id, site_id, texte, photo, auteur_nom, auteur_metier, auteur_slug, publie_le, expire_le")
      .eq("ville_slug", villeSlug)
      .eq("famille", "menu")
      .is("retire_le", null)
      // ENCORE VALABLE. Une carte du jour porte toujours une échéance — elle
      // s'arrête le soir — donc filtrer dessus suffit, et c'est le seul filtre
      // qui dise « aujourd'hui » sans supposer un fuseau côté base.
      .gt("expire_le", maintenant)
      .order("publie_le", { ascending: false })
      .limit(max);
    if (error || !Array.isArray(data)) return [];
    lignes = data as Record<string, unknown>[];
  } catch {
    return [];
  }
  if (!lignes.length) return [];

  const tels = await telephonesDeSites(sb, lignes.map((r) => str(r.site_id)));

  return lignes.map((r) => ({
    id: str(r.id),
    siteId: str(r.site_id),
    commerce: str(r.auteur_nom),
    metier: str(r.auteur_metier),
    slug: str(r.auteur_slug),
    photo: str(r.photo) || null,
    texte: str(r.texte),
    telephone: tels.get(str(r.site_id)) ?? "",
  }));
}
