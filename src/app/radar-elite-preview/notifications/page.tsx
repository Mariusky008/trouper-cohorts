"use client";

import Link from "next/link";
import { useState } from "react";

type NotifType = "generale" | "personnelle" | "felicitation";
type FilterType = "toutes" | NotifType;

const notifications: Array<{
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  impact?: string;
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
  },
  {
    id: "N-3",
    type: "felicitation",
    title: "Félicitations des membres",
    message: "“Bravo pour ton lead, c'est propre 👏” — Claire • “Masterclass” — David",
    time: "Il y a 32 min",
  },
];

const reactionChoices = ["👏", "🔥", "💰", "🚀"];
const baseReactionCounts: Record<string, Record<string, number>> = {
  "N-1": { "👏": 8, "🔥": 5, "💰": 12, "🚀": 4 },
  "N-2": { "👏": 3, "🔥": 1, "💰": 0, "🚀": 2 },
  "N-3": { "👏": 10, "🔥": 6, "💰": 2, "🚀": 3 },
};

function cardTone(type: NotifType) {
  if (type === "generale") return "border-emerald-400/30 bg-emerald-500/10";
  if (type === "personnelle") return "border-[#EAC886]/35 bg-[#EAC886]/10";
  return "border-white/20 bg-white/5";
}

export default function RadarEliteNotificationsPage() {
  const [showCongratsComposer, setShowCongratsComposer] = useState(false);
  const [filter, setFilter] = useState<FilterType>("toutes");
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});

  const visibleNotifications =
    filter === "toutes" ? notifications : notifications.filter((notif) => notif.type === filter);

  const toggleReaction = (notifId: string, emoji: string) => {
    setMyReactions((prev) => ({
      ...prev,
      [notifId]: prev[notifId] === emoji ? null : emoji,
    }));
  };

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white px-4 py-6 md:px-6 md:py-8">
      <div className="w-full">
        <div className="bg-transparent p-0 md:p-1">
          <div className="p-0 md:p-3">
            <div className="flex items-center justify-between gap-3">
              <Link href="/radar-elite-preview" className="h-10 rounded-lg border border-white/20 px-3 inline-flex items-center text-xs font-black uppercase tracking-wide text-white/80">
                ← Retour
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65">Notifications</p>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-emerald-400 text-black text-xs font-black">3</span>
            </div>

            <h1 className="mt-4 text-3xl font-black">Centre de notifications</h1>
            <p className="mt-1 text-sm text-white/70">Alertes générales, personnelles et félicitations du cercle.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: "toutes", label: "Toutes" },
                { key: "generale", label: "Générales" },
                { key: "personnelle", label: "Personnelles" },
                { key: "felicitation", label: "Félicitations" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`h-9 rounded-full px-3 text-xs font-black uppercase tracking-wide transition ${
                    filter === item.key
                      ? "bg-white text-black"
                      : "border border-white/20 bg-white/5 text-white/75"
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
                  className={`rounded-2xl border p-4 animate-[notifIn_.28s_ease-out] ${cardTone(notif.type)}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">
                        {notif.type === "generale" ? "Alerte générale" : notif.type === "personnelle" ? "Alerte personnelle" : "Félicitations"}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{notif.title}</h2>
                    </div>
                    <p className="text-[11px] font-bold text-white/55">{notif.time}</p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white/85 leading-relaxed">{notif.message}</p>
                  {notif.impact && (
                    <p className="mt-2 inline-flex rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white/75">
                      {notif.impact}
                    </p>
                  )}

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/55">Réagir</p>
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
                                ? "bg-emerald-400 text-black"
                                : "border border-white/20 bg-black/20 text-white/85"
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

            <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">Ajouter une félicitation membre</p>
                <button
                  onClick={() => setShowCongratsComposer((prev) => !prev)}
                  className="h-9 rounded-lg border border-white/20 px-3 text-xs font-black uppercase tracking-wide text-white/80"
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
