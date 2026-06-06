import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMerchantStatsToken } from "@/lib/popey-human/marketplace-landing-token";
import { getCatalogueLeaderboard } from "@/lib/popey-human/catalogue-leaderboard";

export const dynamic = "force-dynamic";

type ProPageProps = {
  searchParams?: Promise<{ token?: string; p?: string }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type Stats = { view: number; favorite: number; reserve: number; card_open: number; mystery_reveal: number };

function emptyStats(): Stats {
  return { view: 0, favorite: 0, reserve: 0, card_open: 0, mystery_reveal: 0 };
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh w-full bg-[#0B0D14] px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-serif text-2xl font-black tracking-tight">
            Pop<span className="text-emerald-400">ey</span>
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Espace commerçant</p>
        </div>
        {children}
      </div>
    </main>
  );
}

function StatCard({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 font-serif text-3xl font-black">{value.toLocaleString("fr-FR")}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}

export default async function PrivilegeProPage({ searchParams }: ProPageProps) {
  const qp = (await searchParams) || {};
  const token = typeof qp.token === "string" ? qp.token : "";
  const handle = typeof qp.p === "string" ? qp.p.trim() : "";
  const admin = createAdminClient();

  // Résolution : token signé (rétro-compat) OU slug court / id via ?p=
  let placeId = "";
  if (token) {
    const check = verifyMerchantStatsToken(token);
    if (check.valid && check.placeId) placeId = check.placeId;
  }
  if (!placeId && handle) {
    if (isUuid(handle)) {
      placeId = handle;
    } else {
      try {
        const r = await admin.from("human_marketplace_places").select("id").eq("pro_slug", handle).maybeSingle();
        placeId = String((r.data as { id?: string } | null)?.id || "");
      } catch {
        placeId = "";
      }
    }
  }

  if (!placeId) {
    return (
      <Shell>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-lg font-bold">Lien invalide ou expiré</p>
          <p className="mt-2 text-sm text-white/50">
            Demande à Popey un nouveau lien pour consulter les statistiques de ton offre.
          </p>
        </div>
      </Shell>
    );
  }

  // Infos offre (colonnes sûres) + promo_code en best-effort (résilient).
  const placeRes = await admin
    .from("human_marketplace_places")
    .select("id,company_name,metier,privilege_badge,city,offer_description,offer_expires_at,owner_display_name,owner_member_id")
    .eq("id", placeId)
    .maybeSingle();
  const place = (placeRes.data || null) as
    | {
        company_name: string | null;
        metier: string | null;
        privilege_badge: string | null;
        city: string | null;
        offer_description: string | null;
        offer_expires_at: string | null;
        owner_display_name: string | null;
        owner_member_id: string | null;
      }
    | null;

  let promoCode = "";
  try {
    const pr = await admin.from("human_marketplace_places").select("promo_code").eq("id", placeId).maybeSingle();
    promoCode = String((pr.data as { promo_code?: string } | null)?.promo_code || "").trim();
  } catch {
    promoCode = "";
  }

  if (!place) {
    return (
      <Shell>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-lg font-bold">Offre introuvable</p>
          <p className="mt-2 text-sm text-white/50">Cette offre n&apos;existe plus. Contacte Popey.</p>
        </div>
      </Shell>
    );
  }

  // Stats : events priv_* du mois + total, agrégés.
  const month = emptyStats();
  const allTime = emptyStats();
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const res = await admin
      .from("human_marketplace_events")
      .select("event_type,created_at")
      .eq("place_id", placeId)
      .like("event_type", "priv_%")
      .limit(50000);
    if (!res.error && res.data) {
      (res.data as Array<{ event_type: string | null; created_at: string | null }>).forEach((r) => {
        const ev = String(r.event_type || "").replace("priv_", "");
        if (ev !== "view" && ev !== "favorite" && ev !== "reserve" && ev !== "card_open" && ev !== "mystery_reveal") return;
        allTime[ev] += 1;
        if (String(r.created_at || "") >= monthStart) month[ev] += 1;
      });
    }
  } catch {
    /* stats indisponibles → 0 */
  }

  const monthLabel = (() => {
    const m = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return m.charAt(0).toUpperCase() + m.slice(1);
  })();
  const offerTitle = String(place.privilege_badge || "").trim() || "Votre offre privilège";
  const proName = String(place.company_name || place.owner_display_name || place.metier || "Votre commerce").trim();

  // Classement des membres (transparence « tribunal bienveillant »)
  const lb = await getCatalogueLeaderboard();
  const myName = String(place.company_name || place.owner_display_name || "").trim().toLowerCase();
  const ownerId = String(place.owner_member_id || "").trim();
  let myIndex = -1;
  for (let i = 0; i < lb.rows.length; i += 1) {
    const r = lb.rows[i];
    if ((ownerId && r.ref === ownerId) || (myName && r.name.trim().toLowerCase() === myName)) {
      myIndex = i;
      break;
    }
  }
  const topRows: Array<{ r: (typeof lb.rows)[number]; rank: number }> = lb.rows.slice(0, 5).map((r, i) => ({ r, rank: i + 1 }));
  if (myIndex >= 5) topRows.push({ r: lb.rows[myIndex], rank: myIndex + 1 });

  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-400">Catalogue Privilège · {place.city || ""}</p>
        <h1 className="mt-1 font-serif text-2xl font-black leading-tight">{proName}</h1>
        <p className="text-sm text-white/55">{place.metier || ""}</p>
        <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300/80">Votre offre</p>
          <p className="font-semibold text-white">{offerTitle}</p>
          {promoCode ? (
            <p className="mt-1 font-mono text-sm font-bold tracking-wide text-amber-300">🎟️ {promoCode}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/40">Ce mois · {monthLabel}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard emoji="👁" value={month.view} label="Vues" />
          <StatCard emoji="❤️" value={month.favorite} label="Favoris" />
          <StatCard emoji="💬" value={month.reserve} label="Réservations" />
          <StatCard emoji="🎟️" value={month.card_open} label="Cartes ouvertes" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/40">Depuis le début</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
          <span>👁 <strong className="text-white">{allTime.view.toLocaleString("fr-FR")}</strong> vues</span>
          <span>❤️ <strong className="text-white">{allTime.favorite.toLocaleString("fr-FR")}</strong> favoris</span>
          <span>💬 <strong className="text-white">{allTime.reserve.toLocaleString("fr-FR")}</strong> réserv.</span>
        </div>
      </div>

      {lb.rows.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Classement des membres · {lb.monthLabel}</p>
            {myIndex >= 0 ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Toi : #{myIndex + 1} / {lb.rows.length}</span>
            ) : null}
          </div>
          <div className="space-y-1.5">
            {topRows.map(({ r, rank }) => {
              const isMe = rank - 1 === myIndex;
              return (
                <div key={r.ref} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${isMe ? "bg-emerald-500/15 text-white" : "text-white/70"}`}>
                  <span className="w-6 shrink-0 font-black text-white/40">{rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{r.name}{isMe ? " (toi)" : ""}</span>
                  <span className="shrink-0 text-white/50">👁 <strong className="text-white">{r.clics}</strong></span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-white/30">Classement par clics (partages générés) ce mois. Plus tu partages ton lien, plus tu montes. 🚀</p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-white/35">
        Ces chiffres mesurent l&apos;intérêt pour votre offre dans le catalogue Popey, diffusé chaque mois aux membres de
        {place.city ? ` ${place.city}` : " votre ville"}. Lien personnel — ne pas partager.
      </p>
    </Shell>
  );
}
