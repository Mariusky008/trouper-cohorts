"use client";

import Link from "next/link";
import { useState } from "react";

type NotifType = "generale" | "personnelle" | "felicitation";
type FilterType = "toutes" | NotifType | "mes_deals";

const notifications: Array<{
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  impact?: string;
  mine?: boolean;
}> = [
  {
    id: "N-1",
    type: "generale",
    title: "Gong de l'Élite",
    message: "Thomas a généré 780€ via Claire. La pluie tombe sur Dax.",
    time: "Il y a 4 min",
    impact: "Impact collectif +18% d'activité estimée",
  },
  {
    id: "N-2",
    type: "personnelle",
    title: "Nouveau client à traiter",
    message: "Famille Dubois • 22 000€ • Cuisine + électricité • À contacter aujourd'hui",
    time: "Il y a 12 min",
    impact: "Priorité haute",
    mine: true,
  },
  {
    id: "N-3",
    type: "felicitation",
    title: "Félicitations des membres",
    message: "“Bravo pour ton lead, c'est propre 👏” — Claire • “Masterclass” — David",
    time: "Il y a 32 min",
    mine: true,
  },
];

const reactionChoices = ["👏", "🔥", "💰", "🚀"];
const baseReactionCounts: Record<string, Record<string, number>> = {
  "N-1": { "👏": 8, "🔥": 5, "💰": 12, "🚀": 4 },
  "N-2": { "👏": 3, "🔥": 1, "💰": 0, "🚀": 2 },
  "N-3": { "👏": 10, "🔥": 6, "💰": 2, "🚀": 3 },
};

function cardTone(type: NotifType) {
  if (type === "generale") return "border-emerald-300/35 bg-gradient-to-br from-emerald-500/18 to-[#0f2f27]/45";
  if (type === "personnelle") return "border-cyan-300/35 bg-gradient-to-br from-cyan-500/16 to-[#0e2733]/45";
  return "border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-500/16 to-[#2f1734]/45";
}

export default function RadarEliteNotificationsPage() {
  const [showCongratsComposer, setShowCongratsComposer] = useState(false);
  const [filter, setFilter] = useState<FilterType>("toutes");
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});

  const visibleNotifications =
    filter === "toutes"
      ? notifications
      : filter === "mes_deals"
      ? notifications.filter((notif) => notif.mine)
      : notifications.filter((notif) => notif.type === filter);

  const toggleReaction = (notifId: string, emoji: string) => {
    setMyReactions((prev) => ({
      ...prev,
      [notifId]: prev[notifId] === emoji ? null : emoji,
    }));
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_120%_at_0%_0%,#1a2a2a_0%,#0b0c10_50%,#09090b_100%)] text-white px-4 py-6 md:px-6 md:py-8">
      <div className="w-full">
        <div className="bg-transparent p-0 md:p-1">
          <div className="p-0 md:p-3">
            <div className="flex items-center justify-between gap-3">
              <Link href="/radar-elite-preview" className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 inline-flex items-center text-xs font-black uppercase tracking-wide text-white/90 backdrop-blur">
                ← Retour
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/75">Notifications</p>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 text-black text-xs font-black shadow-[0_8px_20px_-12px_rgba(110,231,183,0.9)]">3</span>
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight">Centre de notifications</h1>
            <p className="mt-1 text-sm text-white/75">Flux live du Cercle : alertes, opportunités et félicitations membres.</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] font-black text-emerald-200/85">Nouvelles</p>
                <p className="text-lg font-black text-emerald-200">3</p>
              </div>
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] font-black text-cyan-200/85">Urgentes</p>
                <p className="text-lg font-black text-cyan-200">1</p>
              </div>
              <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] font-black text-fuchsia-200/85">Félicitations</p>
                <p className="text-lg font-black text-fuchsia-200">1</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: "toutes", label: "Toutes" },
                { key: "generale", label: "Générales" },
                { key: "personnelle", label: "Personnelles" },
                { key: "felicitation", label: "Félicitations" },
                { key: "mes_deals", label: "Mes deals" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`h-9 rounded-full px-3 text-xs font-black uppercase tracking-wide transition backdrop-blur ${
                    filter === item.key
                      ? "bg-white text-black shadow-[0_10px_24px_-14px_rgba(255,255,255,0.9)]"
                      : "border border-white/20 bg-white/10 text-white/80"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {visibleNotifications.map((notif, idx) => (
                <article
                  key={notif.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm animate-[notifIn_.28s_ease-out] ${cardTone(notif.type)}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/75">
                        {notif.type === "generale" ? "Alerte générale" : notif.type === "personnelle" ? "Alerte personnelle" : "Félicitations"}
                      </p>
                      <h2 className="mt-1 text-xl font-black leading-tight">{notif.title}</h2>
                    </div>
                    <p className="text-[11px] font-bold text-white/65">{notif.time}</p>
                  </div>
                  {notif.type === "personnelle" ? (
                    <Link
                      href="/radar-elite-preview?tab=clients"
                      className="mt-2 block rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-3 py-2 text-[15px] font-semibold text-white leading-relaxed"
                    >
                      {notif.message}
                    </Link>
                  ) : (
                    <p className="mt-2 text-[15px] font-medium text-white/90 leading-relaxed">{notif.message}</p>
                  )}
                  {notif.impact && (
                    <p className="mt-2 inline-flex rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white/85">
                      {notif.impact}
                    </p>
                  )}

                  <div className="mt-3 border-t border-white/15 pt-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Réagir</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reactionChoices.map((emoji) => {
                        const base = baseReactionCounts[notif.id]?.[emoji] ?? 0;
                        const mine = myReactions[notif.id] === emoji ? 1 : 0;
                        const count = base + mine;
                        const active = myReactions[notif.id] === emoji;
                        return (
                          <button
                            key={`${notif.id}-${emoji}`}
                            onClick={() => toggleReaction(notif.id, emoji)}
                            className={`h-9 rounded-full px-3 text-sm font-black transition ${
                              active
                                ? "bg-white text-black shadow-[0_10px_24px_-14px_rgba(255,255,255,0.85)]"
                                : "border border-white/20 bg-black/25 text-white/90"
                            }`}
                          >
                            {emoji} {count}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
              {visibleNotifications.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center text-sm font-semibold text-white/70">
                  Aucune notification dans cette catégorie.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">Ajouter une félicitation membre</p>
                <button
                  onClick={() => setShowCongratsComposer((prev) => !prev)}
                  className="h-9 rounded-lg border border-white/25 bg-black/20 px-3 text-xs font-black uppercase tracking-wide text-white/90"
                >
                  {showCongratsComposer ? "Fermer" : "Écrire"}
                </button>
              </div>
              {showCongratsComposer && (
                <div className="mt-3 animate-[fadeIn_.2s_ease-out] space-y-2">
                  <input
                    placeholder="Prénom du membre"
                    className="h-11 w-full rounded-lg border border-white/20 bg-black/30 px-3 text-sm"
                  />
                  <textarea
                    placeholder="Votre message de félicitations..."
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm min-h-24"
                  />
                  <button className="h-11 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
                    Envoyer la félicitation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes notifIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
