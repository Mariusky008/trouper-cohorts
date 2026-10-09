// LE SERVICE WORKER DE LA MAQUETTE HABITANT.
//
// POURQUOI IL EXISTE, ET CE QU'IL NE FAIT PAS. Sur téléphone, `new
// Notification()` est refusé : Android exige qu'une notification passe par
// `registration.showNotification()`, donc par un service worker enregistré.
// Sans ce fichier, la permission peut être accordée et rien ne s'affiche
// jamais — le pire des cas, puisqu'on croirait mesurer un refus alors qu'on
// mesure une impossibilité technique.
//
// IL EST SCOPÉ À `/autour-de-moi/`, comme le manifeste, et pour la même raison :
// la racine du site sert l'argumentaire commerçant, qui n'a rien à voir et qui
// a déjà son propre `sw.js`. Deux applications, deux périmètres.
//
// IL NE MET RIEN EN CACHE. Une maquette qu'on modifie plusieurs fois par jour et
// qu'on montre à des gens ne doit jamais servir une version d'hier. Le seul
// travail de ce fichier est d'afficher des notifications.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// LE PUSH DES SALONS D'ENSEMBLE — « Emma vient de voter ». Envoyé par le
// serveur (`lib/direct/push-salons.ts`) aux téléphones abonnés depuis
// `/autour-de-moi` ou `/ville/<ville>` : la portée de ce fichier ne couvre que
// la première, mais un abonnement n'a pas besoin que la page soit contrôlée.
//
// RIEN NE S'AFFICHE QUAND ON EST DÉJÀ DEVANT L'APPLICATION : le salon se
// rafraîchit tout seul, une notification par-dessus ne dirait rien de plus.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      const devant = liste.some((c) => c.focused && c.visibilityState === "visible" && (c.url.includes("/autour-de-moi") || c.url.includes("/ville/")));
      if (devant) return undefined;
      return self.registration.showNotification(data.title || "Clikme", {
        body: data.body || "",
        icon: "/icon-512.png",
        badge: "/icon.svg",
        ...(data.tag ? { tag: data.tag, renotify: true } : {}),
        data: { url: data.url || "/autour-de-moi" },
      });
    }),
  );
});

// L'APPUI OUVRE LE SALON DONT ELLE PARLE : la fenêtre déjà ouverte sur lui si
// elle existe, sinon une nouvelle (une page hors de cette portée ne se laisse
// pas rediriger d'ici).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/autour-de-moi";
  const cible = new URL(url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      for (const c of liste) {
        if (c.url === cible && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(cible);
    }),
  );
});
