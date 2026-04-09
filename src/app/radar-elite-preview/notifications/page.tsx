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
  unread?: boolean;
  thread: Array<{ from: "systeme" | "membre" | "moi"; text: string; at: string }>;
}> = [
  {
    id: "N-1",
    type: "generale",
    title: "Gong de l'Élite",
    message: "Thomas a généré 780€ via Claire. La pluie tombe sur Dax.",
    time: "Il y a 4 min",
    impact: "Impact collectif +18% d'activité estimée",
    unread: true,
    thread: [
      { from: "systeme", text: "Nouveau gong collectif déclenché.", at: "13:40" },
      { from: "membre", text: "Claire a validé le deal de Thomas : +780€ pour le Cercle.", at: "13:41" },
      { from: "moi", text: "Top. Je partage la win dans le groupe.", at: "13:42" },
    ],
  },
  {
    id: "N-2",
    type: "personnelle",
    title: "Nouveau client à traiter",
    message: "Famille Dubois • 22 000€ • Cuisine + électricité • À contacter aujourd'hui",
    time: "Il y a 12 min",
    impact: "Priorité haute",
    mine: true,
    unread: true,
    thread: [
      { from: "systeme", text: "Un lead vous est assigné en priorité.", at: "13:30" },
      { from: "membre", text: "Famille Dubois, budget validé 22k€, décision rapide.", at: "13:31" },
      { from: "moi", text: "Je prends le lead et j'appelle dans l'heure.", at: "13:33" },
    ],
  },
  {
    id: "N-3",
    type: "felicitation",
    title: "Félicitations des membres",
    message: "“Bravo pour ton lead, c'est propre 👏” — Claire • “Masterclass” — David",
    time: "Il y a 32 min",
    mine: true,
    thread: [
      { from: "membre", text: "Bravo pour ton lead, c'est propre 👏", at: "12:58" },
      { from: "membre", text: "Masterclass 🚀", at: "12:59" },
      { from: "moi", text: "Merci team, on continue.", at: "13:00" },
    ],
  },
];

const reactionChoices = ["👏", "🔥", "💰", "🚀"];
const baseReactionCounts: Record<string, Record<string, number>> = {
  "N-1": { "👏": 8, "🔥": 5, "💰": 12, "🚀": 4 },
  "N-2": { "👏": 3, "🔥": 1, "💰": 0, "🚀": 2 },
  "N-3": { "👏": 10, "🔥": 6, "💰": 2, "🚀": 3 },
};

function badgeTone(type: NotifType) {
  if (type === "generale") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (type === "personnelle") return "bg-cyan-100 text-cyan-800 border-cyan-200";
  return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
}

export default function RadarEliteNotificationsPage() {
  const [themeMode, setThemeMode] = useState<"clair" | "sombre">("clair");
  const [filter, setFilter] = useState<FilterType>("toutes");
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});
  const [selectedNotifId, setSelectedNotifId] = useState<string>(notifications[0].id);
  const [showCongratsComposer, setShowCongratsComposer] = useState(false);

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
  const isLight = themeMode === "clair";
  const selectedNotif =
    visibleNotifications.find((n) => n.id === selectedNotifId) ?? visibleNotifications[0] ?? null;

  return (
    <main
      className={`min-h-screen px-4 py-6 md:px-6 md:py-8 ${
        isLight
          ? "bg-[linear-gradient(180deg,#f6f9fc_0%,#edf3f9_100%)] text-[#0F172A]"
          : "bg-[radial-gradient(120%_120%_at_0%_0%,#1a2a2a_0%,#0b0c10_50%,#09090b_100%)] text-white"
      }`}
    >
      <div className="w-full max-w-6xl mx-auto">
        <div className="p-0 md:p-2">
          <div className="p-0 md:p-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link
                href="/radar-elite-preview"
                className={`h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide ${
                  isLight ? "border border-black/15 bg-white text-black" : "border border-white/20 bg-white/10 text-white/90"
                }`}
              >
                ← Retour
              </Link>
              <div className="inline-flex rounded-xl border border-black/10 bg-white/70 p-1">
                <button
                  onClick={() => setThemeMode("clair")}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase ${themeMode === "clair" ? "bg-emerald-400 text-black" : "text-slate-700"}`}
                >
                  Clair
                </button>
                <button
                  onClick={() => setThemeMode("sombre")}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase ${themeMode === "sombre" ? "bg-slate-800 text-white" : "text-slate-700"}`}
                >
                  Sombre
                </button>
              </div>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 text-black text-xs font-black shadow-[0_8px_20px_-12px_rgba(110,231,183,0.9)]">
                {visibleNotifications.length}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight">Centre de notifications</h1>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-white/75"}`}>
              Version conversationnelle : cliquez une notif pour l&apos;ouvrir en grand et interagir comme un chat moderne.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-300/35 bg-emerald-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] font-black text-emerald-800">Nouvelles</p>
                <p className="text-lg font-black text-emerald-900">{notifications.length}</p>
              </div>
              <div className="rounded-xl border border-cyan-300/35 bg-cyan-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] font-black text-cyan-800">Urgentes</p>
                <p className="text-lg font-black text-cyan-900">{notifications.filter((n) => n.impact?.toLowerCase().includes("priorité")).length}</p>
              </div>
              <div className="rounded-xl border border-fuchsia-300/35 bg-fuchsia-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] font-black text-fuchsia-800">Félicitations</p>
                <p className="text-lg font-black text-fuchsia-900">{notifications.filter((n) => n.type === "felicitation").length}</p>
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
                  className={`h-9 rounded-full px-3 text-xs font-black uppercase tracking-wide transition ${
                    filter === item.key
                      ? "bg-emerald-400 text-black shadow-[0_10px_24px_-14px_rgba(16,185,129,0.55)]"
                      : isLight
                      ? "border border-black/15 bg-white text-slate-700"
                      : "border border-white/20 bg-white/10 text-white/80"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[360px_1fr]">
              <aside className={`rounded-2xl border p-3 ${isLight ? "border-black/10 bg-white/85" : "border-white/20 bg-white/10"}`}>
                <p className={`px-1 text-[11px] font-black uppercase tracking-[0.12em] ${isLight ? "text-slate-600" : "text-white/65"}`}>Flux conversations</p>
                <div className="mt-2 space-y-2 max-h-[62vh] overflow-y-auto pr-1">
                  {visibleNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => setSelectedNotifId(notif.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selectedNotif?.id === notif.id
                          ? "border-emerald-300 bg-emerald-50"
                          : isLight
                          ? "border-black/10 bg-white hover:bg-slate-50"
                          : "border-white/15 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${badgeTone(notif.type)}`}>
                          {notif.type}
                        </span>
                        <span className={`text-[11px] font-bold ${isLight ? "text-slate-500" : "text-white/65"}`}>{notif.time}</span>
                      </div>
                      <p className="mt-1 text-sm font-black leading-snug">{notif.title}</p>
                      <p className={`mt-1 text-xs line-clamp-2 ${isLight ? "text-slate-600" : "text-white/75"}`}>{notif.message}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/60"}`}>Ouvrir la conversation</span>
                        {notif.unread && <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              <section className={`rounded-2xl border p-4 ${isLight ? "border-black/10 bg-white/90" : "border-white/20 bg-white/10"}`}>
                {!selectedNotif && (
                  <div className="rounded-xl border border-dashed border-black/15 bg-white/60 p-6 text-center text-sm font-semibold text-slate-600">
                    Aucune notification dans ce filtre.
                  </div>
                )}
                {selectedNotif && (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${badgeTone(selectedNotif.type)}`}>
                          {selectedNotif.type === "personnelle" ? "Alerte personnelle" : selectedNotif.type === "generale" ? "Alerte générale" : "Félicitations"}
                        </span>
                        <h2 className="mt-2 text-2xl font-black leading-tight">{selectedNotif.title}</h2>
                        {selectedNotif.impact && (
                          <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${isLight ? "border-black/10 bg-slate-100 text-slate-700" : "border-white/20 bg-black/25 text-white/85"}`}>
                            {selectedNotif.impact}
                          </p>
                        )}
                      </div>
                      <p className={`text-xs font-bold ${isLight ? "text-slate-500" : "text-white/65"}`}>{selectedNotif.time}</p>
                    </div>

                    <div className={`mt-4 rounded-xl border p-3 ${isLight ? "border-black/10 bg-slate-50" : "border-white/15 bg-black/25"}`}>
                      <p className={`text-xs font-black uppercase tracking-[0.12em] ${isLight ? "text-slate-600" : "text-white/70"}`}>Conversation</p>
                      <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedNotif.thread.map((msg, idx) => (
                          <div key={`${selectedNotif.id}-msg-${idx}`} className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                            msg.from === "moi"
                              ? "ml-auto bg-emerald-400/20 border border-emerald-300/45"
                              : msg.from === "systeme"
                              ? `${isLight ? "bg-white border border-black/10" : "bg-white/10 border border-white/15"}`
                              : `${isLight ? "bg-cyan-50 border border-cyan-200" : "bg-cyan-500/15 border border-cyan-300/35"}`
                          }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                            <p className={`mt-1 text-[10px] font-bold ${isLight ? "text-slate-500" : "text-white/65"}`}>{msg.at}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedNotif.type === "personnelle" && (
                      <Link
                        href="/radar-elite-preview?tab=clients"
                        className="mt-3 h-11 w-full rounded-xl bg-cyan-300 text-black text-sm font-black uppercase tracking-wide inline-flex items-center justify-center"
                      >
                        Ouvrir le lead dans l&apos;onglet clients
                      </Link>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {reactionChoices.map((emoji) => {
                        const base = baseReactionCounts[selectedNotif.id]?.[emoji] ?? 0;
                        const mine = myReactions[selectedNotif.id] === emoji ? 1 : 0;
                        const count = base + mine;
                        const active = myReactions[selectedNotif.id] === emoji;
                        return (
                          <button
                            key={`${selectedNotif.id}-${emoji}`}
                            onClick={() => toggleReaction(selectedNotif.id, emoji)}
                            className={`h-9 rounded-full px-3 text-sm font-black transition ${
                              active
                                ? "bg-emerald-400 text-black shadow-[0_10px_24px_-14px_rgba(16,185,129,0.65)]"
                                : isLight
                                ? "border border-black/15 bg-white text-slate-700"
                                : "border border-white/20 bg-black/25 text-white/90"
                            }`}
                          >
                            {emoji} {count}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            </div>

            <div className={`mt-5 rounded-2xl border p-4 ${isLight ? "border-black/10 bg-white/85" : "border-white/20 bg-white/10"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">Ajouter une félicitation membre</p>
                <button
                  onClick={() => setShowCongratsComposer((prev) => !prev)}
                  className={`h-9 rounded-lg px-3 text-xs font-black uppercase tracking-wide ${
                    isLight ? "border border-black/15 bg-white text-slate-700" : "border border-white/25 bg-black/20 text-white/90"
                  }`}
                >
                  {showCongratsComposer ? "Fermer" : "Écrire"}
                </button>
              </div>
              {showCongratsComposer && (
                <div className="mt-3 animate-[fadeIn_.2s_ease-out] space-y-2">
                  <input
                    placeholder="Prénom du membre"
                    className={`h-11 w-full rounded-lg px-3 text-sm ${isLight ? "border border-black/15 bg-white" : "border border-white/20 bg-black/30"}`}
                  />
                  <textarea
                    placeholder="Votre message de félicitations..."
                    className={`w-full rounded-lg px-3 py-2 text-sm min-h-24 ${isLight ? "border border-black/15 bg-white" : "border border-white/20 bg-black/30"}`}
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
