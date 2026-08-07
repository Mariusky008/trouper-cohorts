// L'espace ville publie et retire ses informations.
//
// Authentification par jeton privé, comme pour le commerçant : pas de compte,
// pas de mot de passe. Un service municipal qui doit créer un compte pour
// signaler que le marché est déplacé ne le signalera pas.
//
// La famille est TOUJOURS `ville` : cette route ne permet pas de publier une
// offre commerciale. Une collectivité qui pourrait publier sous la famille
// « offre » se retrouverait, sans le vouloir, à concurrencer ses commerçants
// dans leur propre fil.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publier } from "@/lib/direct/publications";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();
const MAX_MS = 60 * 24 * 3600 * 1000; // deux mois : au-delà, ce n'est plus le fil

/** Valide l'échéance saisie plutôt que de la recalculer : le service sait seul à
 *  quelle heure ses travaux s'arrêtent. Une date passée devient « sans limite »
 *  plutôt qu'une info morte à la naissance. */
function echeance(brut: string): string | null {
  if (!brut) return null;
  const t = Date.parse(brut);
  if (!Number.isFinite(t) || t <= Date.now()) return null;
  return new Date(Math.min(t, Date.now() + MAX_MS)).toISOString();
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = villeSlug(str(p?.ville));
  const token = str(p?.token);
  const action = str(p?.action) || "publier";
  if (!slug || !token) return NextResponse.json({ error: "ville/token requis" }, { status: 400 });

  const supabase = createAdminClient();

  let cfg: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from("human_villes_config")
      .select("ville_slug, ville, auteur_nom, admin_token")
      .eq("ville_slug", slug)
      .maybeSingle();
    cfg = (data as Record<string, unknown> | null) ?? null;
  } catch {
    return NextResponse.json({ error: "Espace ville non disponible (migration non appliquée)." }, { status: 503 });
  }
  // Comparaison stricte, et jamais de message qui distingue « ville inconnue »
  // de « mauvais jeton » : les deux réponses réunies permettraient d'énumérer
  // les villes qui ont un espace.
  if (!cfg || str(cfg.admin_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  if (action === "retirer") {
    const id = str(p?.id);
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    try {
      // `site_id is null` verrouille le retrait aux publications de la ville :
      // avec le seul jeton municipal, on ne retire pas l'annonce d'un commerçant.
      const { error } = await supabase
        .from("human_publications")
        .update({ retire_le: new Date().toISOString() })
        .eq("id", id)
        .eq("ville_slug", slug)
        .is("site_id", null);
      if (error) throw new Error(error.message);
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const texte = str(p?.texte).slice(0, 280);
  if (!texte) return NextResponse.json({ error: "Écrivez le texte de l'information." }, { status: 400 });

  const lienBrut = str(p?.lien).slice(0, 500);
  // Uniquement http(s) : un lien `javascript:` ou `data:` publié sur une page
  // consultée par toute une ville n'est pas un détail.
  const lien = /^https?:\/\//i.test(lienBrut) ? lienBrut : null;

  const res = await publier(supabase, {
    ville: str(cfg.ville) || slug,
    villeSlug: slug,
    famille: "ville",
    texte,
    lien,
    expireLe: echeance(str(p?.expireLe)),
    site: null,
  });
  if (!res) return NextResponse.json({ error: "Publication impossible." }, { status: 500 });

  // L'auteur d'une publication de ville n'est pas dénormalisé par `publier`
  // (qui attend un commerce) : on le pose ici, sinon le fil afficherait
  // « Ma ville » à la place du nom réel du service.
  const auteur = str(cfg.auteur_nom) || `Ville de ${str(cfg.ville) || slug}`;
  try {
    await supabase
      .from("human_publications")
      .update({ auteur_nom: auteur, auteur_metier: "Information de la ville" })
      .eq("id", res.id);
  } catch {
    /* le fil affichera le repli « Ma ville » — l'information reste publiée */
  }

  return NextResponse.json({ ok: true, id: res.id });
}
