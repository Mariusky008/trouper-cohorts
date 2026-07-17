// Réservation publique (mini-agenda). Deux actions :
//  - "slots" : renvoie les créneaux libres des prochains jours (dispos du pro
//    moins les RDV déjà pris).
//  - "book"  : réserve un créneau. L'index unique partiel empêche la double
//    réservation ; on notifie le vendeur (best-effort) et on renvoie le libellé.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlots, isValidSlotKey, slotLabel, type AvailWindow } from "@/lib/site-internet/booking";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const missing = (m: string) => /does not exist|schema cache|Could not find/i.test(m);

async function loadSite(supabase: ReturnType<typeof createAdminClient>, slug: string) {
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, booking_slot_minutes")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

async function windowsAndBooked(supabase: ReturnType<typeof createAdminClient>, siteId: string) {
  const windows: AvailWindow[] = [];
  const booked = new Set<string>();
  try {
    const { data: av } = await supabase
      .from("human_site_availability")
      .select("weekday, start_min, end_min")
      .eq("site_id", siteId);
    if (Array.isArray(av)) {
      for (const w of av as Array<Record<string, unknown>>) {
        windows.push({ weekday: Number(w.weekday), start_min: Number(w.start_min), end_min: Number(w.end_min) });
      }
    }
    const { data: bk } = await supabase
      .from("human_site_bookings")
      .select("slot_local")
      .eq("site_id", siteId)
      .eq("status", "confirmed");
    if (Array.isArray(bk)) for (const b of bk as Array<Record<string, unknown>>) booked.add(s(b.slot_local));
  } catch {
    /* tables non migrées → agenda vide */
  }
  return { windows, booked };
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const action = s(p?.action) || "slots";
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = createAdminClient();
  const site = await loadSite(supabase, slug);
  if (!site) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const siteId = s(site.id);
  const slotMinutes = typeof site.booking_slot_minutes === "number" ? site.booking_slot_minutes : 30;

  const { windows, booked } = await windowsAndBooked(supabase, siteId);

  if (action === "slots") {
    const days = generateSlots(windows, slotMinutes, booked);
    return NextResponse.json({ ok: true, enabled: windows.length > 0, days });
  }

  if (action === "book") {
    if (windows.length === 0) return NextResponse.json({ error: "Réservation indisponible." }, { status: 400 });
    const slot = s(p?.slot);
    if (!isValidSlotKey(slot)) return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });
    if (booked.has(slot)) return NextResponse.json({ error: "Créneau déjà pris.", taken: true }, { status: 409 });
    const prenom = s(p?.prenom).slice(0, 80);
    const tel = s(p?.tel).slice(0, 30);
    if (!prenom || tel.replace(/\D/g, "").length < 9) {
      return NextResponse.json({ error: "Prénom et téléphone requis." }, { status: 400 });
    }
    if (p?.consent !== true) return NextResponse.json({ error: "Consentement requis." }, { status: 400 });

    const { error } = await supabase.from("human_site_bookings").insert({
      site_id: siteId,
      slot_local: slot,
      prenom,
      tel,
      consent: true,
      status: "confirmed",
    });
    if (error) {
      if (/duplicate|23505/i.test(error.message)) {
        return NextResponse.json({ error: "Créneau déjà pris.", taken: true }, { status: 409 });
      }
      if (missing(error.message)) {
        return NextResponse.json({ error: "Réservation indisponible." }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notification vendeur (best-effort, Resend), comme la réservation de démo.
    const to = s(process.env.SITE_NOTIFY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL);
    const key = s(process.env.RESEND_API_KEY);
    const from = s(process.env.RESEND_FROM) || "Popey Academy <contact@popey.academy>";
    if (to && key) {
      try {
        const { Resend } = await import("resend");
        const label = s(site.business_name) || slug;
        await new Resend(key).emails.send({
          from,
          to,
          subject: `Nouveau rendez-vous — ${label}`,
          text: `${label} vient de recevoir un rendez-vous.\n\nQuand : ${slotLabel(slot)}\nPrénom : ${prenom}\nTéléphone : ${tel}\n\nEspace pro : /site-internet/pro/${slug}`,
        });
      } catch {
        /* best-effort */
      }
    }

    return NextResponse.json({ ok: true, label: slotLabel(slot) });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
