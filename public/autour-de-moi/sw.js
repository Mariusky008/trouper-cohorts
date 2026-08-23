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

// LE PUSH SERVEUR N'EXISTE PAS ENCORE — il demande des clés VAPID, une table
// d'abonnements et un émetteur. Le gestionnaire est là quand même : le jour où
// la tuyauterie est posée, la partie navigateur est déjà en place.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Clikme", {
      body: data.body || "",
      icon: "/icon-512.png",
      badge: "/icon.svg",
      data: { url: data.url || "/autour-de-moi" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/autour-de-moi";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      for (const c of liste) {
        if (c.url.includes("/autour-de-moi") && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
