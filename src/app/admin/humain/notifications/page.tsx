import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  adminSendHumanNotificationAction,
  getAdminHumanNotificationsFeed,
  type HumanNotificationType,
} from "@/lib/actions/human-notifications";

const NOTIFICATION_TYPES: HumanNotificationType[] = ["generale", "personnelle", "felicitation"];

export default async function AdminHumainNotificationsPage() {
  const feed = await getAdminHumanNotificationsFeed();

  if (feed.error) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-black">Notifications Humain</h1>
        <p className="text-sm text-red-600">{feed.error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Notifications</h1>
          <p className="text-sm text-muted-foreground">Diffusion globale ou ciblée des messages admin.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/humain">Retour espace humain</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/popey-human/app/notifications">Voir côté membre</Link>
          </Button>
        </div>
      </div>

      <form action={adminSendHumanNotificationAction} className="grid gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="target" required className="w-full rounded border px-2 py-2 text-sm">
            <option value="all">Envoyer à tous les membres actifs</option>
            <option value="single">Envoyer à un membre spécifique</option>
          </select>
          <select name="user_id" className="w-full rounded border px-2 py-2 text-sm">
            <option value="">Membre cible (si envoi ciblé)</option>
            {feed.candidates.map((candidate) => (
              <option key={candidate.user_id} value={candidate.user_id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select name="type" required className="w-full rounded border px-2 py-2 text-sm">
            {NOTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            name="impact"
            type="text"
            placeholder="Impact (optionnel)"
            className="w-full rounded border px-2 py-2 text-sm"
          />
        </div>

        <input name="title" type="text" required placeholder="Titre" className="w-full rounded border px-2 py-2 text-sm" />
        <textarea
          name="message"
          required
          placeholder="Message"
          className="min-h-24 w-full rounded border px-2 py-2 text-sm"
        />
        <button className="w-fit rounded bg-black px-4 py-2 text-sm font-bold text-white">Envoyer</button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Date</th>
              <th className="px-3 py-2 text-left font-bold">Destinataire</th>
              <th className="px-3 py-2 text-left font-bold">Type</th>
              <th className="px-3 py-2 text-left font-bold">Titre</th>
              <th className="px-3 py-2 text-left font-bold">Lu</th>
            </tr>
          </thead>
          <tbody>
            {feed.notifications.map((notification) => (
              <tr key={notification.id} className="border-t">
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2">{notification.recipient}</td>
                <td className="px-3 py-2">{notification.type}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                </td>
                <td className="px-3 py-2">{notification.is_read ? "Oui" : "Non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
