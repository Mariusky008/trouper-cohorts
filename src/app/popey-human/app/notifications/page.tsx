import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  createMyHumanCongratsAction,
  getMyHumanNotifications,
  markMyHumanNotificationReadAction,
  toggleMyHumanNotificationReactionAction,
} from "@/lib/actions/human-notifications";

export default async function PopeyHumanNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    scope?: string;
    selected?: string;
    notifError?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const scope = params.scope === "deals" ? "deals" : "all";
  const selectedId = typeof params.selected === "string" ? params.selected : "";
  const notifError = typeof params.notifError === "string" ? params.notifError : "";
  const feed = await getMyHumanNotifications(scope);
  const allHref = "/popey-human/app/notifications";
  const dealsHref = "/popey-human/app/notifications?scope=deals";
  const currentBase = scope === "deals" ? dealsHref : allHref;
  const selectedNotification =
    !feed.error && feed.notifications.length > 0
      ? feed.notifications.find((notification) => notification.id === selectedId) || feed.notifications[0]
      : null;

  const withSelected = (notificationId: string) =>
    `${currentBase}${currentBase.includes("?") ? "&" : "?"}selected=${encodeURIComponent(notificationId)}`;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300/85">Popey Radar</p>
          <h1 className="text-3xl font-black">Centre de notifications</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/popey-human/app">Retour cockpit</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { href: allHref, key: "all", label: "Toutes" },
          { href: dealsHref, key: "deals", label: "Mes deals" },
        ].map((item) => (
          <Link
            key={item.key}
            className={`h-9 rounded-full px-3 text-xs font-black uppercase tracking-wide inline-flex items-center ${
              scope === item.key ? "bg-emerald-400 text-black" : "border border-white/20 bg-black/25 text-white/80"
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {feed.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{feed.error}</p>}
      {notifError && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{notifError}</p>}

      {!feed.error && feed.notifications.length === 0 && (
        <p className="rounded border border-white/15 bg-black/25 px-3 py-3 text-sm text-white/70">
          Aucune notification pour le moment.
        </p>
      )}

      {!feed.error && feed.notifications.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-white/15 bg-black/25 p-3">
            <p className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/65">Flux conversations</p>
            <div className="mt-2 space-y-2 max-h-[62vh] overflow-y-auto pr-1">
              {feed.notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={withSelected(notification.id)}
                  className={`block rounded-xl border px-3 py-3 ${
                    selectedNotification?.id === notification.id
                      ? "border-emerald-300 bg-emerald-500/10"
                      : "border-white/15 bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-black uppercase">
                      {notification.type}
                    </span>
                    <span className="text-[11px] font-bold text-white/65">
                      {new Date(notification.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black leading-snug">{notification.title}</p>
                  <p className="mt-1 text-xs line-clamp-2 text-white/75">{notification.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-white/60">Ouvrir la conversation</span>
                    {!notification.is_read && <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />}
                  </div>
                </Link>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-white/15 bg-black/25 p-4">
            {selectedNotification && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-black uppercase">
                      {selectedNotification.type}
                    </span>
                    <h2 className="mt-2 text-2xl font-black leading-tight">{selectedNotification.title}</h2>
                    {selectedNotification.impact && (
                      <p className="mt-2 inline-flex rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em]">
                        {selectedNotification.impact}
                      </p>
                    )}
                  </div>
                  {!selectedNotification.is_read && (
                    <form action={markMyHumanNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={selectedNotification.id} />
                      <input type="hidden" name="current_url" value={withSelected(selectedNotification.id)} />
                      <button className="rounded border border-white/20 px-2 py-1 text-xs font-semibold">Marquer comme lu</button>
                    </form>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Conversation</p>
                  <div className="mt-2 space-y-2">
                    <div className="max-w-[92%] rounded-xl px-3 py-2 text-sm border border-white/15 bg-white/10">
                      <p className="leading-relaxed">{selectedNotification.message}</p>
                      <p className="mt-1 text-[10px] font-bold text-white/65">
                        {new Date(selectedNotification.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(["👏", "🔥", "💰", "🚀"] as const).map((emoji) => {
                    const count = selectedNotification.reactionCounts[emoji];
                    const active = selectedNotification.myReaction === emoji;
                    return (
                      <form key={`${selectedNotification.id}-${emoji}`} action={toggleMyHumanNotificationReactionAction}>
                        <input type="hidden" name="notification_id" value={selectedNotification.id} />
                        <input type="hidden" name="emoji" value={emoji} />
                        <input type="hidden" name="current_url" value={withSelected(selectedNotification.id)} />
                        <button
                          className={`h-9 rounded-full px-3 text-sm font-black ${
                            active ? "bg-emerald-400 text-black" : "border border-white/20 bg-black/25 text-white/90"
                          }`}
                        >
                          {emoji} {count}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {!feed.error && (
        <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
          <p className="text-sm font-black">Ajouter une félicitation membre</p>
          <form action={createMyHumanCongratsAction} className="mt-3 space-y-2">
            <input type="hidden" name="current_url" value={currentBase} />
            <select name="target_member_id" className="h-11 w-full rounded-lg border border-white/20 bg-black/30 px-3 text-sm">
              <option value="">Choisir un membre</option>
              {feed.candidates.map((candidate) => (
                <option key={candidate.member_id} value={candidate.member_id}>
                  {candidate.label}
                </option>
              ))}
            </select>
            <textarea
              name="message"
              placeholder="Votre message de félicitations..."
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm min-h-24"
            />
            <button className="h-11 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
              Envoyer la félicitation
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
