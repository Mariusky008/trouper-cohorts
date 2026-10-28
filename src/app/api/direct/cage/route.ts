// 🔓 LIBÉRER SON FANTÔME À LA FIN D'UN FILM (l'interview d'un commerçant).
//
// Comme l'avis qu'elle remplace (`api/direct/avis-film`) : rien n'est demandé
// avant, un jeton d'appareil, et on enregistre. Une cage par personne et par
// film : en choisir une autre change la ligne.
//
// LE NUMÉRO WHATSAPP EST À PART, ET FACULTATIF. Il n'arrive que si la personne
// a choisi « Je viendrai un jour » et dit « oui, prévenez-moi » : il va dans
// `clik_contact`, pour ce commerce seulement, avec l'heure de son accord. Le
// commerçant lui écrira depuis son propre WhatsApp ; ClikMe n'envoie rien.
//
// Le film doit être celui du commerce (son annonce en cours, ou une de ses
// publications) : sans ce contrôle, on pourrait remplir le carnet de
// n'importe quel commerce au nom de n'importe qui. Une exception : sa page
// publique (`/f/<lien>`), quand il n'a pas encore de vidéo — le « film » est
// alors la page elle-même (`FILM_PAGE`), qui n'existe que pour un commerce
// client de ClikMe (`est_client`) : jamais au nom d'un commerçant qui n'a rien demandé.
//
// 👻 ET IL ENTRE DANS LA FOULE DU JOUR de ce commerce (`clik_presence`, une
// fois par jour), avec, son premier jour, qui l'a amené (`de` : le code de
// l'invitation). Voir `lib/direct/famille.ts`. 🎬 `video` (oui / non) : son
// accord pour que son prénom et son petit mot apparaissent dans ses vidéos.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { filmDuCommerce } from "@/lib/direct/avis-film";
import { estCage, numeroWhatsApp } from "@/lib/direct/cages";
import { lookValide } from "@/lib/direct/look";
import { prenomRefuse } from "@/lib/direct/prenom";
import { FILM_PAGE } from "@/lib/direct/famille";
import { enregistrerAccordVideo, noterPresence } from "@/lib/direct/famille-serveur";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const film = s(p?.film).slice(0, 500);
  const cage = p?.cage;
  if (!slug || !film) return NextResponse.json({ error: "slug et film requis" }, { status: 400 });
  if (!estCage(cage)) return NextResponse.json({ error: "cage inconnue" }, { status: 400 });
  // UN PRÉNOM QUI NE PEUT PAS SE MONTRER (un lien, un gros mot) n'est pas gardé : son fantôme entre sans prénom.
  // La page de la famille le dit avant d'envoyer ; l'appli, elle, ne bloque pas sa cage pour ça.
  const prenomBrut = s(p?.prenom).slice(0, 24);
  const prenom = prenomRefuse(prenomBrut) ? "" : prenomBrut;
  const look = lookValide(p?.look) ? String(p?.look) : "";
  // Un numéro donné mais illisible : on le dit, plutôt que de garder un numéro où personne ne répondra.
  const saisie = s(p?.whatsapp);
  const whatsapp = saisie ? numeroWhatsApp(saisie) : null;
  if (saisie && !whatsapp) return NextResponse.json({ error: "Ce numéro ne ressemble pas à un numéro de téléphone." }, { status: 400 });
  if (whatsapp && cage !== "un-jour") return NextResponse.json({ error: "Le numéro ne se laisse qu'avec « Je viendrai un jour »." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: site } = await supabase.from("human_vitrine_sites").select("id, city, est_client").eq("slug", slug).maybeSingle();
  const siteId = s((site as Record<string, unknown> | null)?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const filmOk = film === FILM_PAGE ? (site as Record<string, unknown>).est_client === true : await filmDuCommerce(supabase, siteId, film);
  if (!filmOk) return NextResponse.json({ error: "Ce film n'est pas celui de ce commerce." }, { status: 404 });

  const ville = villeSlug(s(p?.ville) || s((site as Record<string, unknown> | null)?.city));
  const habitant = await assurerHabitant(supabase, ville);
  if (!habitant) return NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });

  const maintenant = new Date().toISOString();
  try {
    const { error } = await supabase
      .from("clik_cage")
      .upsert(
        { site_id: siteId, habitant_id: habitant.id, film, cage, prenom, look, updated_at: maintenant },
        { onConflict: "habitant_id,site_id,film" }
      );
    if (error) throw new Error(error.message);
    if (whatsapp) {
      // UN NOUVEL ACCORD EFFACE UN ANCIEN STOP : c'est elle qui vient de redire oui.
      const { error: e2 } = await supabase
        .from("clik_contact")
        .upsert(
          { site_id: siteId, habitant_id: habitant.id, whatsapp, accord_le: maintenant, stop_le: null, updated_at: maintenant },
          { onConflict: "habitant_id,site_id" }
        );
      if (e2) throw new Error(e2.message);
    }
  } catch (e) {
    const msg = String(e);
    // Migration non appliquée : on le dit, plutôt que de laisser le geste disparaître en silence.
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ error: "Les cages ne sont pas encore activées." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  // La foule du jour : sans la table (migration pas encore collée), la cage est gardée quand même.
  await noterPresence(supabase, siteId, habitant.id, s(p?.de)).catch(() => false);
  // 🎬 SON ACCORD POUR LES VIDÉOS, quand la page de la famille le demande (une case jamais cochée d'avance).
  if (typeof p?.video === "boolean") await enregistrerAccordVideo(supabase, siteId, habitant.id, p.video).catch(() => null);
  return NextResponse.json({ ok: true });
}
