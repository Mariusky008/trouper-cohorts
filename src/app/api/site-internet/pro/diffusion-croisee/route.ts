/**
 * 📣 SON RÉSEAU DE DIFFUSION CROISÉE, AU COMPTOIR — voir `lib/direct/diffusion.ts` (la règle) et `diffusion-serveur.ts`.
 * (À ne pas confondre avec `pro/diffusion` : son message du mois, pour sa liste de diffusion WhatsApp.)
 *
 * Contre son jeton pro :
 *   · `etat` : son réglage, ses deux partenaires, les vidéos reçues de leur part, les siennes chez eux ;
 *   · `rejoindre` (avec son `accord` coché) / `quitter` : il entre dans le réseau, ou en sort ;
 *   · `auto` : leurs vidéos partent toutes seules sur ses réseaux (au plus deux par semaine), ou il les valide une à une ;
 *   · `diffuser` / `refuser` : une vidéo reçue, sur ses réseaux maintenant, ou pas celle-ci.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAFOND_PAR_SEMAINE, diffuseesCetteSemaine, distanceEnMots } from "@/lib/direct/diffusion";
import { aDesReseaux, diffuser, ecrireReglage, lireBoite, lireCommerce, mesEnvois, partenairesDe, perimee, refuser, type Commerce, type Recue } from "@/lib/direct/diffusion-serveur";
import { SITE_URL } from "@/lib/site-url";
import { lienDeLaPorte } from "@/lib/reseaux/reseaux-donnees";

export const dynamic = "force-dynamic";
/** « Diffuser » publie une vidéo sur ses réseaux : ça peut prendre une minute. */
export const maxDuration = 120;

const s = (v: unknown) => String(v ?? "").trim();

/** Ce que l'écran voit d'une vidéo reçue (ou envoyée). */
const publique = (r: Recue, nomDe: (id: string) => string = () => "") => ({
  id: r.id,
  le: r.le,
  de: { nom: r.de.nom, metier: r.de.metier, page: lienDeLaPorte(SITE_URL, r.de.slug) },
  vers: nomDe(r.vers.id) || r.vers.slug,
  texte: r.texte,
  decouverte: r.decouverte,
  photo: r.photo,
  video: r.video?.url ?? null,
  statut: perimee(r) ? "perimee" : r.statut,
  diffuseeLe: r.diffuseeLe ?? null,
  reseaux: r.reseaux ?? [],
  erreur: r.erreur ?? null,
});

async function etat(supabase: ReturnType<typeof createAdminClient>, moi: Commerce) {
  const partenaires = await partenairesDe(supabase, moi);
  const [boite, envois, reseaux] = await Promise.all([lireBoite(supabase, moi.id), mesEnvois(supabase, moi, partenaires), aDesReseaux(supabase, moi.id)]);
  return {
    reglage: moi.reglage,
    partenaires: partenaires.map((p) => ({ nom: p.nom, metier: p.metier, ville: p.ville, ou: distanceEnMots(moi.point, p.point), page: lienDeLaPorte(SITE_URL, p.slug) })),
    recues: boite.map((r) => publique(r)),
    envois: envois.map((r) => publique(r, (id) => partenaires.find((p) => p.id === id)?.nom ?? "")),
    reseauxConnectes: reseaux,
    plafond: PLAFOND_PAR_SEMAINE,
    cetteSemaine: diffuseesCetteSemaine(boite.filter((r) => r.statut === "diffusee" && r.diffuseeLe).map((r) => r.diffuseeLe as string)),
  };
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "etat";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, pro_token").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const moi = await lireCommerce(supabase, s(site.id));
    if (!moi) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });

    if (action === "etat") return NextResponse.json({ ok: true, etat: await etat(supabase, moi) });

    if (action === "rejoindre") {
      // SON ACCORD, COCHÉ PAR LUI : accueillir leurs vidéos, et que les siennes passent chez eux
      if (p?.accord !== true) return NextResponse.json({ error: "Il faut ton accord pour rejoindre le réseau." }, { status: 400 });
      const reglage = { active: true, auto: p?.auto !== false, le: new Date().toISOString() };
      await ecrireReglage(supabase, moi, reglage);
      return NextResponse.json({ ok: true, etat: await etat(supabase, { ...moi, reglage }) });
    }

    if (action === "quitter") {
      const reglage = { active: false, auto: moi.reglage.auto, le: new Date().toISOString() };
      await ecrireReglage(supabase, moi, reglage);
      return NextResponse.json({ ok: true, etat: await etat(supabase, { ...moi, reglage }) });
    }

    if (action === "auto") {
      const reglage = { ...moi.reglage, auto: p?.auto === true };
      await ecrireReglage(supabase, moi, reglage);
      return NextResponse.json({ ok: true, etat: await etat(supabase, { ...moi, reglage }) });
    }

    if (action === "diffuser" || action === "refuser") {
      const id = s(p?.id);
      const r = (await lireBoite(supabase, moi.id)).find((x) => x.id === id);
      if (!r) return NextResponse.json({ error: "Cette vidéo n'est plus dans ta boîte." }, { status: 404 });
      if (action === "refuser") await refuser(supabase, r);
      else {
        if (r.statut === "diffusee") return NextResponse.json({ ok: true, etat: await etat(supabase, moi) });
        if (!(await aDesReseaux(supabase, moi.id)))
          return NextResponse.json({ error: "Connecte d'abord tes réseaux (Ma boutique → Réseaux)." }, { status: 400 });
        const apres = await diffuser(supabase, r);
        if (apres.statut !== "diffusee") return NextResponse.json({ error: "Elle n'a pas pu partir sur tes réseaux. Réessaie.", etat: await etat(supabase, moi) }, { status: 502 });
      }
      return NextResponse.json({ ok: true, etat: await etat(supabase, moi) });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e) {
    console.error("[diffusion] erreur :", String((e as Error)?.message ?? e).slice(0, 300));
    return NextResponse.json({ error: "Ton réseau n'a pas pu être lu. Réessaie." }, { status: 500 });
  }
}
