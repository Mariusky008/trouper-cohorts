import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyHumanNotifications, markMyHumanNotificationReadAction } from "@/lib/actions/human-notifications";

export default async function PopeyHumanNotificationsPage() {
  const feed = await getMyHumanNotifications();

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
            <h1 className="text-3xl font-black">Notifications</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/popey-human/app">Retour cockpit</Link>
          </Button>
        </div>

        {feed.error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{feed.error}</p>}

        {!feed.error && feed.notifications.length === 0 && (
          <p className="rounded border bg-white px-3 py-3 text-sm text-black/70">Aucune notification pour le moment.</p>
        )}

        {!feed.error && feed.notifications.length > 0 && (
          <div className="space-y-3">
            {feed.notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-4 ${notification.is_read ? "bg-white" : "bg-amber-50 border-amber-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">{notification.type}</p>
                    <h2 className="text-lg font-black">{notification.title}</h2>
                    <p className="mt-1 text-sm text-black/80">{notification.message}</p>
                    {notification.impact && <p className="mt-1 text-xs text-black/60">Impact: {notification.impact}</p>}
                    <p className="mt-2 text-xs text-black/50">
                      {new Date(notification.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <form action={markMyHumanNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={notification.id} />
                      <button className="rounded border px-2 py-1 text-xs font-semibold">Marquer comme lu</button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
