import { createAdminClient } from "@/lib/supabase/admin";

export type LeaderboardRow = {
  ref: string; // clé stable du membre (owner_member_id ou place:<id>)
  name: string;
  city: string;
  clics: number; // ouvertures du catalogue via son lien (?ref=)
  interet: number; // favoris + réservations + cartes ouvertes
  coupons: number; // activations (coupons) attribuées
  declared: number | null; // contacts WhatsApp déclarés
  day: number | null; // jour de propulsion
};

export type Leaderboard = {
  rows: LeaderboardRow[];
  tableReady: boolean;
  monthLabel: string;
  totalClics: number;
  cities: string[];
};

function norm(value: string): string {
  return String(value || "").trim().toLowerCase();
}

// Liste TOUS les commerçants configurés (même à zéro clic), avec leurs stats du mois.
// cityFilter optionnel : ne garde que les membres d'une ville (mais renvoie quand
// même la liste complète des villes pour le sélecteur).
export async function getCatalogueLeaderboard(cityFilter?: string): Promise<Leaderboard> {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const monthLabel = (() => {
    const m = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return m.charAt(0).toUpperCase() + m.slice(1);
  })();
  const wantCity = norm(cityFilter || "");

  // 1) Membres = commerçants configurés (1 offre = 1 commerçant)
  const rowsByRef: Record<string, LeaderboardRow> = {};
  const byOwnerId: Record<string, LeaderboardRow> = {};
  const byName: Record<string, LeaderboardRow> = {};
  const citiesSet = new Set<string>();
  try {
    const res = await admin
      .from("human_marketplace_places")
      .select("id,city,company_name,owner_display_name,owner_member_id,privilege_badge,metier")
      .limit(3000);
    if (!res.error && res.data) {
      (res.data as Array<{
        id: string;
        city: string | null;
        company_name: string | null;
        owner_display_name: string | null;
        owner_member_id: string | null;
        privilege_badge: string | null;
        metier: string | null;
      }>).forEach((p) => {
        const configured = Boolean(String(p.company_name || "").trim() || String(p.privilege_badge || "").trim());
        if (!configured) return;
        const city = String(p.city || "").trim();
        if (city) citiesSet.add(city);
        if (wantCity && norm(city) !== wantCity) return;
        const ownerId = String(p.owner_member_id || "").trim();
        const ref = ownerId || `place:${p.id}`;
        const name = String(p.company_name || p.owner_display_name || p.metier || "Membre Popey").trim();
        const row: LeaderboardRow = { ref, name, city, clics: 0, interet: 0, coupons: 0, declared: null, day: null };
        rowsByRef[ref] = row;
        if (ownerId) byOwnerId[ownerId] = row;
        if (name) byName[norm(name)] = row;
      });
    }
  } catch {
    /* places indisponibles */
  }

  const findMember = (ref: string, refName: string): LeaderboardRow | null => {
    if (ref && rowsByRef[ref]) return rowsByRef[ref];
    if (ref && byOwnerId[ref]) return byOwnerId[ref];
    if (refName && byName[norm(refName)]) return byName[norm(refName)];
    return null;
  };

  // 2) Events priv_* du mois → match membre par ref OU ref_name
  //    « Clics » = visiteurs distincts (sessions) venus via le lien du membre,
  //    « Intérêt » = nb d'actions (favoris + réservations + cartes ouvertes).
  const sessionsByRef: Record<string, Set<string>> = {};
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
        const refName = String((payload as { ref_name?: unknown }).ref_name || "").trim();
        const member = findMember(ref, refName);
        if (!member) return;
        const session = String((payload as { session?: unknown }).session || "").trim();
        if (session) {
          if (!sessionsByRef[member.ref]) sessionsByRef[member.ref] = new Set();
          sessionsByRef[member.ref].add(session);
        }
        const ev = String(r.event_type || "").replace("priv_", "");
        if (ev === "favorite" || ev === "reserve" || ev === "card_open") member.interet += 1;
      });
    }
  } catch {
    /* events indisponibles */
  }
  Object.values(rowsByRef).forEach((m) => {
    m.clics = sessionsByRef[m.ref] ? sessionsByRef[m.ref].size : 0;
  });

  // 3) Coupons (activations) du mois → match membre par referrer_id OU referrer_name
  try {
    const res = await admin
      .from("human_marketplace_landing_activations")
      .select("referrer_id,referrer_name,created_at")
      .gte("created_at", monthStart)
      .limit(50000);
    if (!res.error && res.data) {
      (res.data as Array<{ referrer_id: string | null; referrer_name: string | null }>).forEach((r) => {
        const member = findMember(String(r.referrer_id || "").trim(), String(r.referrer_name || "").trim());
        if (member) member.coupons += 1;
      });
    }
  } catch {
    /* activations indisponibles */
  }

  // 4) Déclaratif / planning (table dédiée, clé = ref membre)
  let tableReady = false;
  try {
    const res = await admin
      .from("human_catalogue_referrers")
      .select("ref,declared_contacts,propulsion_day")
      .limit(5000);
    tableReady = !res.error;
    if (!res.error && res.data) {
      (res.data as Array<{ ref: string; declared_contacts: number | null; propulsion_day: number | null }>).forEach((r) => {
        const row = r.ref ? rowsByRef[r.ref] : null;
        if (row) {
          row.declared = r.declared_contacts ?? null;
          row.day = r.propulsion_day ?? null;
        }
      });
    }
  } catch {
    tableReady = false;
  }

  const rows = Object.values(rowsByRef).sort(
    (x, y) => y.clics - x.clics || y.interet - x.interet || y.coupons - x.coupons || x.name.localeCompare(y.name, "fr"),
  );
  const totalClics = rows.reduce((s, r) => s + r.clics, 0);
  const cities = Array.from(citiesSet).sort((a, b) => a.localeCompare(b, "fr"));
  return { rows, tableReady, monthLabel, totalClics, cities };
}
