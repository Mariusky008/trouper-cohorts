self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "Nouvelle notification";
  const body = data.body || "Vous avez reçu un message.";
  const icon = data.icon || "/icon.svg";
  const url = data.url || "/mon-reseau-local/dashboard";

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    data: {
      url: url,
    },
    actions: [{ action: "open_url", title: "Voir" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open_url" || !event.action) {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // If a window is already open, focus it
          for (const client of clientList) {
            if (client.url && "focus" in client) {
              return client.focus();
            }
          }
          // Otherwise open a new one
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});
