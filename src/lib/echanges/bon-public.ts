// LA CARTE CADEAU D'UN CLIENT — ce que `/bon/<code>` montre quand le bon est
// un « cadeau du voisin ».
//
// Un bon pris par un commerçant POUR LUI ne dit rien de lui-même à qui
// l'ouvre (« un code ne dit pas à qui il appartient ») : `null`. Un bon
// CADEAU, lui, a été remis à un client, qui doit savoir ce qu'il a reçu, de
// qui, où aller et jusqu'à quand. Rien d'autre : ni prix, ni solde.
//
// FICHIER SERVEUR (clé d'administration).
import { createAdminClient } from "@/lib/supabase/admin";
import { codeNormalise, type BonCadeauPublic } from "@/lib/echanges/echanges";

const str = (v: unknown) => String(v ?? "").trim();

export async function lireBonCadeau(brut: string): Promise<BonCadeauPublic | null> {
  const code = codeNormalise(brut);
  if (!code) return null;
  try {
    const supabase = createAdminClient();
    const { data: b, error } = await supabase
      .from("human_echanges_bons")
      .select("code, titre, photo, statut, pour, cadeau_id, preneur_id, fournisseur_id, expire_le")
      .eq("code", code)
      .maybeSingle();
    const bon = b as Record<string, unknown> | null;
    if (error || !bon || bon.pour !== "client") return null;
    const [{ data: offres }, { data: site }, { data: lot }] = await Promise.all([
      supabase.from("human_echanges_offres").select("site_id, commerce, ville").in("site_id", [str(bon.preneur_id), str(bon.fournisseur_id)]),
      supabase.from("human_vitrine_sites").select("slug, address, city").eq("id", str(bon.fournisseur_id)).maybeSingle(),
      supabase.from("human_echanges_cadeaux").select("occasion").eq("id", str(bon.cadeau_id)).maybeSingle(),
    ]);
    const nom = new Map(((offres ?? []) as Array<Record<string, unknown>>).map((o) => [str(o.site_id), str(o.commerce)]));
    const s = (site ?? {}) as Record<string, unknown>;
    const expire = str(bon.expire_le);
    const statut = str(bon.statut) as BonCadeauPublic["statut"];
    const photo = str(bon.photo);
    return {
      code,
      titre: str(bon.titre),
      chez: nom.get(str(bon.fournisseur_id)) || "un commerçant ClikMe",
      chezSlug: str(s.slug),
      adresse: str(s.address).replace(/,?\s*France\s*$/i, ""),
      ville: str(s.city),
      photo: /^https:\/\//i.test(photo) || /^\/[^/]/.test(photo) ? photo : "",
      de: nom.get(str(bon.preneur_id)) || "un commerçant ClikMe",
      occasion: str((lot as Record<string, unknown> | null)?.occasion),
      // PÉRIMÉ MÊME SI PERSONNE NE L'A ENCORE MARQUÉ : la page le dit tout de suite.
      statut: statut === "reserve" && Date.parse(expire) < Date.now() ? "expire" : statut,
      expire,
    };
  } catch {
    return null;
  }
}
