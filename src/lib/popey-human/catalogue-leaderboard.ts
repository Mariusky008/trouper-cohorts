import { createAdminClient } from "@/lib/supabase/admin";

export type LeaderboardRow = {
  ref: string;
  name: string;
  clics: number; // ouvertures du catalogue via ?ref=
  interet: number; // favoris + réservations + cartes ouvertes
  coupons: number; // activations (coupons) attribuées au référent
  declared: number | null; // contacts WhatsApp déclarés
  day: number | null; // jour de propulsion
};

export type Leaderboard = {
  rows: LeaderboardRow[];
  tableReady: boolean;
  monthLabel: string;
  totalClics: number;
};

type Agg = { open: number; favorite: number; reserve: number; card_open: number; refName: string };

export async function getCatalogueLeaderboard(): Promise<Leaderboard> {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const monthLabel = (() => {
    const m = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return m.charAt(0).toUpperCase() + m.slice(1);
  })();

  // 1) Events priv_* du mois, agrégés par référent
  const aggByRef: Record<string, Agg> = {};
  try {
    const res = await admin
      .from("human_marketplace_events")
      .select("event_type,payload,created_at")
      .like("event_type", "priv_%")
      .gte("created_at", monthStart)
      .limit(50000);
    if (!res.error && res.data) {
      (res.data as Array<{ event_type: string | null; payload: Record<string, unknown> | null }>).forEach((r) => {
        const payload = r.payload && typeof r.payload === "object" ? r.payload : {};
        const ref = String((payload as { ref?: unknown }).ref || "").trim();
        if (!ref) return;
        const refName = String((payload as { ref_name?: unknown }).ref_name || "").trim();
        const ev = String(r.event_type || "").replace("priv_", "");
        if (!aggByRef[ref]) aggByRef[ref] = { open: 0, favorite: 0, reserve: 0, card_open: 0, refName: "" };
        if (refName && !aggByRef[ref].refName) aggByRef[ref].refName = refName;
        if (ev === "open" || ev === "favorite" || ev === "reserve" || ev === "card_open") aggByRef[ref][ev] += 1;
      });
    }
  } catch {
    /* events indisponibles */
  }

  // 2) Coupons (activations) du mois par référent
  const couponsByRefId: Record<string, number> = {};
  const couponsByName: Record<string, number> = {};
  try {
    const res = await admin
      .from("human_marketplace_landing_activations")
      .select("referrer_id,referrer_name,created_at")
      .gte("created_at", monthStart)
      .limit(50000);
    if (!res.error && res.data) {
      (res.data as Array<{ referrer_id: string | null; referrer_name: string | null }>).forEach((r) => {
        const id = String(r.referrer_id || "").trim();
        const nm = String(r.referrer_name || "").trim().toLowerCase();
        if (id) couponsByRefId[id] = (couponsByRefId[id] || 0) + 1;
        if (nm) couponsByName[nm] = (couponsByName[nm] || 0) + 1;
      });
    }
  } catch {
    /* activations indisponibles */
  }

  // 3) Infos déclaratives / planning
  const refInfo: Record<string, { ref_name: string | null; declared_contacts: number | null; propulsion_day: number | null }> = {};
  let tableReady = false;
  try {
    const res = await admin
      .from("human_catalogue_referrers")
      .select("ref,ref_name,declared_contacts,propulsion_day")
      .limit(5000);
    tableReady = !res.error;
    if (!res.error && res.data) {
      (res.data as Array<{ ref: string; ref_name: string | null; declared_contacts: number | null; propulsion_day: number | null }>).forEach((r) => {
        if (r.ref) refInfo[r.ref] = { ref_name: r.ref_name, declared_contacts: r.declared_contacts, propulsion_day: r.propulsion_day };
      });
    }
  } catch {
    tableReady = false;
  }

  // 4) Fusion + tri
  const allRefs = Array.from(new Set([...Object.keys(aggByRef), ...Object.keys(refInfo)]));
  const rows: LeaderboardRow[] = allRefs.map((ref) => {
    const a = aggByRef[ref];
    const info = refInfo[ref];
    const name = String(info?.ref_name || a?.refName || ref);
    const coupons = couponsByRefId[ref] || couponsByName[name.toLowerCase()] || 0;
    return {
      ref,
      name,
      clics: a ? a.open : 0,
      interet: a ? a.favorite + a.reserve + a.card_open : 0,
      coupons,
      declared: info?.declared_contacts ?? null,
      day: info?.propulsion_day ?? null,
    };
  });
  rows.sort((x, y) => y.clics - x.clics || y.interet - x.interet || y.coupons - x.coupons);

  const totalClics = rows.reduce((s, r) => s + r.clics, 0);
  return { rows, tableReady, monthLabel, totalClics };
}
