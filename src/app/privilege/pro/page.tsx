import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMerchantStatsToken } from "@/lib/popey-human/marketplace-landing-token";
import { getCatalogueLeaderboard } from "@/lib/popey-human/catalogue-leaderboard";

export const dynamic = "force-dynamic";

type ProPageProps = {
  searchParams?: Promise<{ token?: string; p?: string; tab?: string }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


function statutBadge(clics: number, day: number | null, declared: number | null, today: number): { label: string; cls: string } {
  if (day && today < day) return { label: "⏳ Bientôt", cls: "bg-white/10 text-white/60" };
  if (clics === 0) return { label: "⚠️ À relancer", cls: "bg-red-500/15 text-red-300" };
  if (declared && clics >= Math.max(5, declared * 0.15)) return { label: "🚀 Au top", cls: "bg-emerald-500/15 text-emerald-300" };
  return { label: "✅ Actif", cls: "bg-sky-500/15 text-sky-300" };
}

function rankLabel(rank: number): string {
  return rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`;
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
  const tab = typeof qp.tab === "string" ? qp.tab : "";
  const admin = createAdminClient();
  const baseQs = token ? `token=${encodeURIComponent(token)}` : handle ? `p=${encodeURIComponent(handle)}` : "";

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
  let proSlug = "";
  try {
    const ps = await admin.from("human_marketplace_places").select("pro_slug").eq("id", placeId).maybeSingle();
    proSlug = String((ps.data as { pro_slug?: string } | null)?.pro_slug || "").trim();
  } catch {
    proSlug = "";
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

  // Lien COURT à partager (/c/<slug>) → redirige vers le catalogue avec le référent
  const appBase = String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const shareLink = (appBase || "") + "/c/" + encodeURIComponent(proSlug || placeId);
  const cityName = String(place.city || "ta ville");
  const waText =
    "Alerte pépite ! ⚡️\n\n" +
    "Voilà le catalogue vidéo de " + monthLabel + " avec les meilleurs commerçants de " + cityName + ".\n\n" +
    "Dedans : des gratuités de malade, des privilèges exclusifs et tout l'agenda des animations de la semaine.\n\n" +
    "Clique et swipe, tu vas adorer : 👇\n🍿 " + shareLink;
  const waShareHref = "https://wa.me/?text=" + encodeURIComponent(waText);

  // Classement des membres de SA ville (transparence « tribunal bienveillant »)
  const lb = await getCatalogueLeaderboard(place.city || undefined);
  const ownerId = String(place.owner_member_id || "").trim();
  const myKey = ownerId || `place:${placeId}`;
  const myName = String(place.company_name || place.owner_display_name || "").trim().toLowerCase();
  let myIndex = -1;
  for (let i = 0; i < lb.rows.length; i += 1) {
    const r = lb.rows[i];
    if (r.ref === myKey || (ownerId && r.ref === ownerId) || (myName && r.name.trim().toLowerCase() === myName)) {
      myIndex = i;
      break;
    }
  }
  const myRow = myIndex >= 0 ? lb.rows[myIndex] : null;
  const today = new Date().getDate();
  const myStat = statutBadge(myRow?.clics ?? 0, myRow?.day ?? null, myRow?.declared ?? null, today);
  const topRows: Array<{ r: (typeof lb.rows)[number]; rank: number }> = lb.rows.slice(0, 5).map((r, i) => ({ r, rank: i + 1 }));
  if (myIndex >= 5 && myRow) topRows.push({ r: myRow, rank: myIndex + 1 });

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

      {/* Lien à partager (action n°1 du commerçant) */}
      <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/[0.1] to-white/[0.02] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/80">🔗 Ton lien à partager</p>
        <p className="mt-1 text-[11px] text-white/45">Envoie-le à tes contacts WhatsApp — chaque ouverture compte pour ton classement.</p>
        <div className="mt-2 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] text-white/70">{shareLink}</div>
        <a
          href={waShareHref}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
        >
          💬 Partager sur WhatsApp
        </a>
      </div>

      <div className="mt-5 flex gap-2">
        <a
          href={`/privilege/pro?${baseQs}`}
          className={`flex-1 rounded-xl border px-3 py-2 text-center text-xs font-bold ${tab !== "classement" ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/[0.03] text-white/55"}`}
        >
          📊 Mes stats
        </a>
        <a
          href={`/privilege/pro?${baseQs}&tab=classement`}
          className={`flex-1 rounded-xl border px-3 py-2 text-center text-xs font-bold ${tab === "classement" ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/[0.03] text-white/55"}`}
        >
          🏆 Classement & mission
        </a>
      </div>

      {tab !== "classement" ? (
        <>
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
        </>
      ) : null}

      {tab === "classement" ? (
        <>
      {/* Ta mission ce mois (planning + potentiel + clics générés) */}
      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-500/[0.08] to-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/80">🎯 Ta mission · {lb.monthLabel}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${myStat.cls}`}>{myStat.label}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/[0.05] p-3">
            <div className="font-serif text-2xl font-black">{myRow?.day ? `J${myRow.day}` : "—"}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-white/45">📅 Jour de propulsion</div>
          </div>
          <div className="rounded-xl bg-white/[0.05] p-3">
            <div className="font-serif text-2xl font-black">{myRow?.declared != null ? myRow.declared.toLocaleString("fr-FR") : "—"}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-white/45">📱 Contacts à toucher</div>
          </div>
          <div className="rounded-xl bg-white/[0.05] p-3">
            <div className="font-serif text-2xl font-black text-emerald-300">{myRow?.clics ?? 0}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-white/45">👆 Clics générés</div>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[11px] text-white/55">
          <span>💬 <strong className="text-white">{myRow?.interet ?? 0}</strong> actions</span>
          <span>🎟️ <strong className="text-white">{myRow?.coupons ?? 0}</strong> coupons</span>
        </div>
      </div>

      {/* Classement de ta ville (transparence / émulation) */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">🏆 Classement{place.city ? ` · ${place.city}` : ""}</p>
          {myIndex >= 0 ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Toi : #{myIndex + 1} / {lb.rows.length}</span>
          ) : null}
        </div>
        {lb.rows.length === 0 ? (
          <p className="text-sm text-white/40">Le classement s&apos;affichera dès que les membres commenceront à partager leur lien.</p>
        ) : (
          <div className="space-y-1.5">
            {topRows.map(({ r, rank }) => {
              const isMe = rank - 1 === myIndex;
              const st = statutBadge(r.clics, r.day, r.declared, today);
              return (
                <div
                  key={r.ref}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm ${isMe ? "bg-emerald-500/15 ring-1 ring-emerald-400/30" : "bg-white/[0.03]"}`}
                >
                  <span className="w-7 shrink-0 text-center font-black text-white/60">{rankLabel(rank)}</span>
                  <span className={`min-w-0 flex-1 truncate font-semibold ${isMe ? "text-white" : "text-white/85"}`}>
                    {r.name}
                    {isMe ? " (toi)" : ""}
                  </span>
                  <span className="shrink-0 text-[11px] text-white/55">
                    👆 <strong className="text-white">{r.clics}</strong> · 🎟️ <strong className="text-white">{r.coupons}</strong>
                  </span>
                  <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline ${st.cls}`}>{st.label.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-[10px] text-white/30">Plus tu partages ton lien, plus tu montes. 🚀</p>
      </div>
        </>
      ) : null}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-white/35">
        Ces chiffres mesurent l&apos;intérêt pour votre offre dans le catalogue Popey, diffusé chaque mois aux membres de
        {place.city ? ` ${place.city}` : " votre ville"}. Lien personnel — ne pas partager.
      </p>
    </Shell>
  );
}
