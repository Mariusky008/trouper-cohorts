// QUI VIENT, ET COMMENT LE JOINDRE.
//
// Le défaut que ce module corrige : l'habitant recevait un code (« RR-8863 »)
// et le commerçant ne pouvait le retrouver NULLE PART. Le code ne servait donc
// à rien — pire, il promettait un lien qui n'existait pas. Et quand quelqu'un
// s'engageait dans un groupe, le commerçant n'avait ni son nom ni son numéro :
// « vous serez prévenu dès que le groupe est complet » était une promesse que
// personne ne pouvait tenir.
//
// LE CODE N'EST PAS STOCKÉ, IL EST RECALCULÉ. `codeDe(campagne, habitant)` est
// déterministe : les deux côtés obtiennent le même sans qu'une colonne puisse
// se désynchroniser. Une colonne « code » serait une seconde vérité sur un
// sujet qui n'en supporte qu'une.
//
// LE CONTACT EST FACULTATIF, ET IL LE RESTE. Consulter Le Direct ne demande
// rien, s'engager non plus. On affiche ce que la personne a bien voulu laisser
// — jamais un champ « inconnu » qui donnerait l'impression d'un dossier
// incomplet à remplir.
import { codeDe } from "@/lib/direct/code-bon";
import { FACON_LABEL, estTypeClik } from "@/lib/direct/cliks";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type Engagement = {
  campagneId: string;
  /** Le nom de la façon, tel que le commerçant l'a nommée. */
  facon: string;
  type: string;
  /** Le titre de l'annonce concernée. */
  titre: string;
  /** Le code que la personne présentera. */
  code: string;
  statut: string;
  /** Ce que la personne a laissé. Chaînes vides quand elle n'a rien donné. */
  prenom: string;
  telephone: string;
  email: string;
  /** Quand elle s'est engagée, en ISO. */
  le: string;
  /** L'avantage obtenu, pour un cadeau. */
  gain: string;
};

/** Le nom d'une façon : celui que le commerçant a donné, sinon son libellé —
 *  jamais le type brut. La liste affichait « cadeau » là où toute
 *  l'application dit « Le cadeau ». */
function nomFacon(nom: string, type: string): string {
  return nom || (estTypeClik(type) ? FACON_LABEL[type] : type);
}

/** Les statuts qui veulent dire « cette personne compte venir ». Les annulés et
 *  les absents ne sont pas une liste de clients, ils sont du bruit. */
const VIVANTS = ["engage", "liste_attente", "confirme"];

/**
 * Les engagements pris sur les campagnes d'un commerce, du plus récent au plus
 * ancien.
 *
 * TROIS LECTURES, jamais une par personne : les campagnes, puis les
 * participations, puis les habitants concernés. Un commerce actif a quelques
 * campagnes et quelques dizaines d'engagements ; une requête par ligne
 * multiplierait les allers-retours par le nombre de clients.
 */
export async function engagementsDuCommerce(
  supabase: unknown,
  siteId: string,
  max = 60
): Promise<Engagement[]> {
  if (!siteId) return [];
  const sb = supabase as Supabase;

  // ── 1. Ses campagnes ──────────────────────────────────────────────────────
  const campagnes = new Map<string, { facon: string; type: string; titre: string }>();
  try {
    const { data, error } = await sb
      .from("clik_campaign")
      .select("id, type, titre, nom_facon")
      .eq("site_id", siteId)
      .limit(200);
    if (error) throw new Error(error.message);
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      campagnes.set(str(r.id), {
        facon: nomFacon(str(r.nom_facon), str(r.type)),
        type: str(r.type),
        titre: str(r.titre),
      });
    }
  } catch {
    // La colonne `nom_facon` peut manquer (migration non appliquée) : on
    // retente sans elle plutôt que de rendre une liste vide.
    try {
      const { data } = await sb.from("clik_campaign").select("id, type, titre").eq("site_id", siteId).limit(200);
      for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
        campagnes.set(str(r.id), { facon: nomFacon("", str(r.type)), type: str(r.type), titre: str(r.titre) });
      }
    } catch {
      return [];
    }
  }
  if (!campagnes.size) return [];

  // ── 2. Les participations ─────────────────────────────────────────────────
  type Ligne = { campagneId: string; habitantId: string; statut: string; le: string; rewardId: string };
  const lignes: Ligne[] = [];
  try {
    const { data, error } = await sb
      .from("clik_participation")
      .select("campagne_id, habitant_id, statut, rejoint_le, reward_id")
      .in("campagne_id", [...campagnes.keys()])
      .order("rejoint_le", { ascending: false })
      .limit(max);
    if (error) throw new Error(error.message);
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      const statut = str(r.statut);
      if (!VIVANTS.includes(statut)) continue;
      lignes.push({
        campagneId: str(r.campagne_id),
        habitantId: str(r.habitant_id),
        statut,
        le: str(r.rejoint_le),
        rewardId: str(r.reward_id),
      });
    }
  } catch {
    return [];
  }
  if (!lignes.length) return [];

  // ── 3. Ce que les personnes ont bien voulu laisser ────────────────────────
  const gens = new Map<string, { prenom: string; telephone: string; email: string }>();
  try {
    const { data } = await sb
      .from("human_habitants")
      .select("id, prenom, telephone, email")
      .in("id", Array.from(new Set(lignes.map((l) => l.habitantId))));
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      gens.set(str(r.id), { prenom: str(r.prenom), telephone: str(r.telephone), email: str(r.email) });
    }
  } catch {
    /* on affichera les codes sans les contacts : le code sert déjà à l'accueil */
  }

  // ── 4. L'avantage obtenu, pour les cadeaux ────────────────────────────────
  const gains = new Map<string, string>();
  const rewardIds = lignes.map((l) => l.rewardId).filter(Boolean);
  if (rewardIds.length) {
    try {
      const { data } = await sb.from("clik_reward").select("id, libelle").in("id", Array.from(new Set(rewardIds)));
      for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
        gains.set(str(r.id), str(r.libelle));
      }
    } catch {
      /* sans libellé, la ligne reste utile : le code et le contact suffisent */
    }
  }

  return lignes.map((l) => {
    const c = campagnes.get(l.campagneId);
    const g = gens.get(l.habitantId);
    return {
      campagneId: l.campagneId,
      facon: c?.facon ?? "",
      type: c?.type ?? "",
      titre: c?.titre ?? "",
      code: codeDe(l.campagneId, l.habitantId),
      statut: l.statut,
      prenom: g?.prenom ?? "",
      telephone: g?.telephone ?? "",
      email: g?.email ?? "",
      le: l.le,
      gain: gains.get(l.rewardId) ?? "",
    };
  });
}
