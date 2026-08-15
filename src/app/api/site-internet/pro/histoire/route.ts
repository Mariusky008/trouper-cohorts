// « QU'EST-CE QUI SE PASSE CHEZ VOUS AUJOURD'HUI ? »
//
// Une phrase, un bouton. C'est tout le geste, et c'est délibéré : le commerçant
// en fait à peine un par jour. Un formulaire à trois champs pour raconter qu'on
// a sorti les croissants ne serait jamais rempli.
//
// TROIS ACTIONS : `get` (ce qu'il a écrit aujourd'hui), `set` (écrire ou
// corriger), `clear` (retirer). Réécrire dans la journée CORRIGE — ça n'empile
// pas : la contrainte `unique (site_id, jour)` du schéma le garantit même si
// deux onglets envoient en même temps.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug } from "@/lib/direct/ville";
import {
  ecrireHistoire,
  emojiDuMetier,
  histoireDuCommerce,
  histoireValide,
  nettoyerHistoire,
  retirerHistoire,
} from "@/lib/direct/histoire";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/** La migration n'est pas appliquée : on le DIT. Une histoire qui disparaît en
 *  silence est exactement ce qui a coûté trois façons la semaine dernière. */
function migrationManquante(msg: string): boolean {
  return /does not exist|schema cache|Could not find|42P01|PGRST20\d/i.test(msg);
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, city, activite, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  // Jamais de message qui distingue « commerce inconnu » de « mauvais jeton » :
  // les deux réunis permettraient d'énumérer les commerces.
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = s(site.id);

  try {
    if (action === "get") {
      return NextResponse.json({ ok: true, histoire: await histoireDuCommerce(supabase, siteId) });
    }

    if (action === "clear") {
      await retirerHistoire(supabase, siteId);
      return NextResponse.json({ ok: true, histoire: null });
    }

    if (action === "set") {
      const texte = nettoyerHistoire(p?.texte);
      if (!histoireValide(texte)) {
        return NextResponse.json({ error: "Écrivez une phrase — quelques mots suffisent." }, { status: 400 });
      }
      await ecrireHistoire(supabase, {
        siteId,
        villeSlug: villeSlug(s(site.city)),
        texte,
        // Figé à l'écriture : un commerce qui change d'activité ne doit pas voir
        // le croissant d'hier devenir une paire de ciseaux.
        emoji: emojiDuMetier(s(site.activite)),
      });
      return NextResponse.json({ ok: true, histoire: await histoireDuCommerce(supabase, siteId) });
    }

    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (e) {
    const msg = String(e);
    if (migrationManquante(msg)) {
      return NextResponse.json(
        { error: "La petite histoire du jour n'est pas encore activée sur votre espace." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
