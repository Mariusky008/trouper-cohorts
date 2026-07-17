// Gestion du mini-agenda côté pro (jeton privé ?k=…). Actions :
//  - "get"    : durée de créneau, fenêtres de dispo, et prochains RDV.
//  - "set"    : remplace la durée + les fenêtres de disponibilité.
//  - "cancel" : annule un RDV (status = cancelled → le créneau redevient libre).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slotLabel, isValidSlotKey } from "@/lib/site-internet/booking";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const clampMin = (v: unknown) => Math.max(0, Math.min(1440, Math.round(Number(v) || 0)));

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
    .select("id, pro_token, booking_slot_minutes")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = s(site.id);

  if (action === "set") {
    const slotMinutes = Math.max(10, Math.min(120, Math.round(Number(p?.slot_minutes) || 30)));
    await supabase.from("human_vitrine_sites").update({ booking_slot_minutes: slotMinutes }).eq("id", siteId);
    // On remplace toutes les fenêtres (v1 : une plage par jour).
    const raw = Array.isArray(p?.windows) ? (p.windows as unknown[]) : [];
    const rows: Array<{ site_id: string; weekday: number; start_min: number; end_min: number }> = [];
    const seen = new Set<number>();
    for (const w of raw) {
      const o = (w && typeof w === "object" ? w : {}) as Record<string, unknown>;
      const wd = Math.round(Number(o.weekday));
      const start = clampMin(o.start_min);
      const end = clampMin(o.end_min);
      if (wd < 0 || wd > 6 || seen.has(wd) || end <= start) continue;
      seen.add(wd);
      rows.push({ site_id: siteId, weekday: wd, start_min: start, end_min: end });
    }
    try {
      await supabase.from("human_site_availability").delete().eq("site_id", siteId);
      if (rows.length) await supabase.from("human_site_availability").insert(rows);
    } catch (e) {
      return NextResponse.json({ error: String(e).slice(0, 120) }, { status: 500 });
    }
  } else if (action === "cancel") {
    const id = s(p?.id);
    if (id) {
      await supabase.from("human_site_bookings").update({ status: "cancelled" }).eq("site_id", siteId).eq("id", id);
    }
  }

  // État courant (après mutation éventuelle).
  let slotMinutes = typeof site.booking_slot_minutes === "number" ? site.booking_slot_minutes : 30;
  const windows: Array<{ weekday: number; start_min: number; end_min: number }> = [];
  const bookings: Array<{ id: string; slot: string; label: string; prenom: string; tel: string }> = [];
  try {
    const { data: sm } = await supabase.from("human_vitrine_sites").select("booking_slot_minutes").eq("id", siteId).maybeSingle();
    if (sm && typeof (sm as Record<string, unknown>).booking_slot_minutes === "number") {
      slotMinutes = (sm as Record<string, unknown>).booking_slot_minutes as number;
    }
    const { data: av } = await supabase
      .from("human_site_availability")
      .select("weekday, start_min, end_min")
      .eq("site_id", siteId)
      .order("weekday", { ascending: true });
    if (Array.isArray(av)) for (const w of av as Array<Record<string, unknown>>) windows.push({ weekday: Number(w.weekday), start_min: Number(w.start_min), end_min: Number(w.end_min) });

    // Prochains RDV : on filtre les créneaux passés côté serveur (comparaison lexicale).
    const nowKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .format(new Date())
      .replace(" ", "T")
      .slice(0, 16);
    const { data: bk } = await supabase
      .from("human_site_bookings")
      .select("id, slot_local, prenom, tel")
      .eq("site_id", siteId)
      .eq("status", "confirmed")
      .gte("slot_local", nowKey)
      .order("slot_local", { ascending: true })
      .limit(100);
    if (Array.isArray(bk)) {
      for (const b of bk as Array<Record<string, unknown>>) {
        const slot = s(b.slot_local);
        if (!isValidSlotKey(slot)) continue;
        bookings.push({ id: s(b.id), slot, label: slotLabel(slot), prenom: s(b.prenom), tel: s(b.tel) });
      }
    }
  } catch {
    /* tables non migrées → agenda vide, la page reste fonctionnelle */
  }

  return NextResponse.json({ ok: true, slotMinutes, windows, bookings });
}
