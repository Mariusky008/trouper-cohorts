// LE NUMÉRO QUI REÇOIT LES RÉSERVATIONS.
//
// Jusqu'ici ce numéro était capté UNE SEULE FOIS, en passant : dans le
// formulaire « Garder ce site gratuitement » rempli après la démo. Il n'était
// même enregistré que si la colonne était encore vide et si c'était un mobile
// français. Le commerçant ne l'a jamais revu, et n'avait aucun moyen de le
// corriger — alors que c'est LE numéro sur lequel toutes ses réservations
// arrivent.
//
// TROIS ACTIONS. `get` (ce qui est réglé aujourd'hui), `set` (changer son
// numéro), `relais` (mettre celui d'un employé jusqu'à une date, ou l'annuler).
//
// POURQUOI LE MOBILE FRANÇAIS EST EXIGÉ. Ce n'est pas un caprice de formulaire :
// la colonne `whatsapp_phone_e164` porte une contrainte SQL (`~ '^\+33[67]…'`).
// Un numéro fixe ne la passerait pas, et l'écriture entière échouerait avec un
// message que personne ne comprend. On le refuse donc ici, en le disant — et de
// toute façon un fixe n'a pas de WhatsApp.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/site-internet/phone";
import { MOBILE_FR, numeroReservations, proPhoneFrom, relaisEnregistre } from "@/lib/site-internet/pro-phone";
import { jourParis } from "@/lib/jour-paris";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/** Au-delà, ce ne sont plus des congés : c'est un changement de numéro. */
const RELAIS_MAX_JOURS = 120;

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
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, whatsapp_phone_e164, metadata")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  // Jamais de message qui distingue « commerce inconnu » de « mauvais jeton » :
  // les deux réunis permettraient d'énumérer les commerces.
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = s(site.id);
  const meta = (site.metadata && typeof site.metadata === "object" ? site.metadata : {}) as Record<string, unknown>;

  /** L'état complet, tel que l'écran doit l'afficher. Une seule forme, partagée
   *  par les trois actions : après un changement, l'écran n'a rien à recalculer
   *  de son côté — il affiche ce que la base vient de confirmer. */
  const etat = (row: { whatsapp_phone_e164?: unknown; metadata?: unknown }) => ({
    numero: proPhoneFrom(row),
    relais: relaisEnregistre(row),
    // Ce qui est VRAIMENT utilisé aujourd'hui : c'est le seul chiffre qui
    // réponde à sa question (« où arrivent mes réservations, là, maintenant ? »).
    actif: numeroReservations(row),
    jour: jourParis(),
  });

  try {
    if (action === "get") {
      return NextResponse.json({ ok: true, ...etat(site) });
    }

    if (action === "set") {
      const e164 = toE164(s(p?.numero));
      if (!MOBILE_FR.test(e164)) {
        return NextResponse.json(
          { error: "Il faut un mobile français (06… ou 07…) — c'est le seul numéro qui porte un compte WhatsApp." },
          { status: 400 }
        );
      }
      const { error } = await supabase.from("human_vitrine_sites").update({ whatsapp_phone_e164: e164 }).eq("id", siteId);
      if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
      return NextResponse.json({ ok: true, ...etat({ whatsapp_phone_e164: e164, metadata: meta }) });
    }

    if (action === "relais") {
      // Annuler : il est rentré plus tôt que prévu. On efface la clé plutôt que
      // d'y laisser une date passée — une trace inerte finit toujours par être
      // relue comme un réglage actif.
      if (p?.numero === null || s(p?.numero) === "") {
        const m = { ...meta };
        delete m.whatsapp_relais;
        const { error } = await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", siteId);
        if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
        return NextResponse.json({ ok: true, ...etat({ ...site, metadata: m }) });
      }

      const e164 = toE164(s(p?.numero));
      if (!MOBILE_FR.test(e164)) {
        return NextResponse.json(
          { error: "Il faut un mobile français (06… ou 07…) — c'est le seul numéro qui porte un compte WhatsApp." },
          { status: 400 }
        );
      }
      const jusquau = s(p?.jusquau);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(jusquau)) {
        return NextResponse.json({ error: "Indiquez la date de votre retour." }, { status: 400 });
      }
      const aujourdhui = jourParis();
      // Une date déjà passée créerait un remplacement mort-né : il serait
      // enregistré, affiché comme réglé, et n'enverrait jamais rien à personne.
      if (jusquau < aujourdhui) {
        return NextResponse.json({ error: "Cette date est déjà passée." }, { status: 400 });
      }
      const limite = new Date(Date.now() + RELAIS_MAX_JOURS * 86400e3).toISOString().slice(0, 10);
      if (jusquau > limite) {
        return NextResponse.json(
          { error: "Un remplacement se compte en semaines. Au-delà, changez plutôt votre numéro." },
          { status: 400 }
        );
      }
      const m = { ...meta, whatsapp_relais: { numero: e164, qui: s(p?.qui).slice(0, 40), jusquau } };
      const { error } = await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", siteId);
      if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
      return NextResponse.json({ ok: true, ...etat({ ...site, metadata: m }) });
    }

    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
