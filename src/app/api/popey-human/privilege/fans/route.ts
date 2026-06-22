import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { toE164 } from "@/lib/popey-human/loyalty";
import { sendPrivilegeAlertOptin } from "@/lib/actions/whatsapp-twilio";
import { COUP_MONTHLY_QUOTA, monthlyMessagesUsed } from "@/lib/popey-human/coup";

export const dynamic = "force-dynamic";

// Masque un numéro pour l'affichage pro (reconnaissable sans exposer le numéro complet).
function maskPhone(e164: string): string {
  const d = String(e164 || "").replace(/[^\d]/g, "");
  if (d.length < 4) return "••";
  const nat = d.startsWith("33") ? "0" + d.slice(2) : d;
  return nat.slice(0, 2) + " •• •• •• " + nat.slice(-2);
}

// GET ?p=<cred> → « Mes fans » de l'espace pro : abonnés confirmés + en attente (opt-in non confirmé),
// liste (prénom + numéro masqué + niveau + statut) et quota de messages du mois. Tout résilient.
export async function GET(request: NextRequest) {
  try {
    const cred = String(request.nextUrl.searchParams.get("p") || request.nextUrl.searchParams.get("token") || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });
    const supabase = createAdminClient();

    let subs: Array<{ id: string; phone: string; status: string; source: string | null; created_at: string }> = [];
    try {
      const { data } = await supabase
        .from("human_privilege_alert_subscribers")
        .select("id,phone,status,source,created_at")
        .eq("place_id", placeId)
        .neq("status", "unsubscribed")
        .order("created_at", { ascending: false })
        .limit(500);
      subs = (data as typeof subs) || [];
    } catch {
      /* table absente */
    }
    const phones = Array.from(new Set(subs.map((s) => String(s.phone || "").trim()).filter(Boolean)));

    const levelByPhone = new Map<string, number>();
    const nameByPhone = new Map<string, string>();
    if (phones.length) {
      try {
        const { data: rels } = await supabase
          .from("human_privilege_relationships")
          .select("member_phone,level")
          .eq("place_id", placeId)
          .in("member_phone", phones);
        ((rels as Array<{ member_phone: string; level: number }> | null) || []).forEach((r) =>
          levelByPhone.set(r.member_phone, Number(r.level) || 0),
        );
      } catch {
        /* résilient */
      }
      try {
        const { data: mem } = await supabase.from("human_privilege_members").select("phone_e164,first_name").in("phone_e164", phones);
        ((mem as Array<{ phone_e164: string; first_name: string | null }> | null) || []).forEach((m) =>
          nameByPhone.set(m.phone_e164, String(m.first_name || "")),
        );
      } catch {
        /* résilient */
      }
    }

    const confirmed = subs.filter((s) => s.status === "confirmed").length;
    const pending = subs.filter((s) => s.status === "pending").length;
    const list = subs.slice(0, 60).map((s) => ({
      id: s.id,
      name: nameByPhone.get(s.phone) || "Client",
      phoneMasked: maskPhone(s.phone),
      level: levelByPhone.get(s.phone) || 0,
      status: s.status,
      addedByPro: s.source === "pro_added",
    }));

    // Quota : somme des messages envoyés par les Coups de feu du mois (helper partagé avec l'enforcement).
    const used = await monthlyMessagesUsed(placeId);
    const monthLabel = (() => {
      const m = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      return m.charAt(0).toUpperCase() + m.slice(1);
    })();

    return NextResponse.json({
      confirmed,
      pending,
      list,
      quota: { used, included: COUP_MONTHLY_QUOTA, remaining: Math.max(0, COUP_MONTHLY_QUOTA - used), monthLabel },
    });
  } catch {
    return NextResponse.json({ confirmed: 0, pending: 0, list: [], quota: { used: 0, included: COUP_MONTHLY_QUOTA, remaining: COUP_MONTHLY_QUOTA, monthLabel: "" } });
  }
}

// POST { p|token, name, phone } — le pro AJOUTE un client à ses alertes. RGPD/Meta : pas d'ajout
// silencieux → on crée un abonné 'pending' et on envoie UN message d'opt-in WhatsApp. Le client
// rejoint la liste (confirmed) seulement s'il répond OUI (géré par le webhook existant).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { p?: string; token?: string; name?: string; phone?: string } | null;
    const cred = String(body?.p || body?.token || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });
    const phone = toE164(String(body?.phone || ""));
    const name = String(body?.name || "").trim().slice(0, 40);
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("id,city,city_slug,company_name,owner_display_name")
      .eq("id", placeId)
      .maybeSingle();
    if (!place) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
    const p = place as { city?: string; city_slug?: string; company_name?: string; owner_display_name?: string };

    // Membre (identité légère) — pour afficher le prénom dans « Mes fans ».
    try {
      await supabase
        .from("human_privilege_members")
        .upsert({ phone_e164: phone, first_name: name || null, city: p.city || null, updated_at: nowIso }, { onConflict: "phone_e164" });
    } catch {
      /* résilient */
    }
    // Relation (niveau 0) pour le ciblage par vagues plus tard.
    try {
      const { data: rel } = await supabase
        .from("human_privilege_relationships")
        .select("id")
        .eq("place_id", placeId)
        .eq("member_phone", phone)
        .maybeSingle();
      if (!rel) await supabase.from("human_privilege_relationships").insert({ place_id: placeId, member_phone: phone, level: 0 });
    } catch {
      /* résilient */
    }

    // Abonné en attente de double opt-in.
    try {
      const { error } = await supabase.from("human_privilege_alert_subscribers").upsert(
        {
          place_id: placeId,
          city: p.city || null,
          city_slug: p.city_slug || null,
          phone,
          status: "pending",
          consent_text: "Ajouté par le commerçant via Popey ; confirmation par OUI requise. STOP à tout moment.",
          consent_at: nowIso,
          source: "pro_added",
          updated_at: nowIso,
        },
        { onConflict: "place_id,phone" },
      );
      if (error && /human_privilege_alert_subscribers/i.test(String(error.message || ""))) {
        return NextResponse.json({ error: "Service d'alertes pas encore activé (migration manquante)." }, { status: 503 });
      }
    } catch {
      /* résilient */
    }

    // Envoi du message d'opt-in (no-op si Twilio/template non configuré).
    const merchantName = String(p.company_name || p.owner_display_name || "").trim() || "ce commerçant";
    const optin = await sendPrivilegeAlertOptin(phone, { merchantName, city: String(p.city || "") });

    return NextResponse.json({
      ok: true,
      pending: true,
      optinSent: Boolean(optin.success),
      message: optin.success
        ? `${name || "Ton client"} va recevoir un WhatsApp de confirmation. Il rejoint tes alertes dès qu'il répond OUI.`
        : `${name || "Ton client"} est enregistré. L'envoi WhatsApp d'opt-in n'est pas encore configuré.`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}

// PATCH { p|token, id, action: 'confirm'|'unsubscribe' } — filet de sécurité : le pro confirme
// MANUELLEMENT un client en attente (il atteste que le client est d'accord) si le OUI WhatsApp
// n'arrive pas, ou le retire. Normalement le passage en 'confirmed' est automatique via le webhook.
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { p?: string; token?: string; id?: string; action?: string } | null;
    const cred = String(body?.p || body?.token || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });
    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Abonné manquant." }, { status: 400 });
    const action = String(body?.action || "confirm");
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    if (action === "unsubscribe") {
      await supabase
        .from("human_privilege_alert_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: nowIso, updated_at: nowIso })
        .eq("id", id)
        .eq("place_id", placeId);
      return NextResponse.json({ ok: true, status: "unsubscribed" });
    }

    await supabase
      .from("human_privilege_alert_subscribers")
      .update({ status: "confirmed", confirmed_at: nowIso, updated_at: nowIso })
      .eq("id", id)
      .eq("place_id", placeId)
      .eq("status", "pending");
    return NextResponse.json({ ok: true, status: "confirmed" });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
