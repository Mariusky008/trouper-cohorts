// 🔔 LE SERVICE WORKER DE CLIKME (`/collection`) — le lot 3, 7 novembre 2026.
//
// SON SEUL TRAVAIL : AFFICHER LE MÈME DU JOUR (vers 11 h 30) et le « C'est réglé ! » qui le précède, envoyés par
// `lib/direct/appli-collection-serveur.ts`, puis ouvrir l'appli dessus quand on touche la notification.
//
// À LA RACINE DU SITE, MAIS SA PORTÉE EST `/collection` : un fichier rangé dans `/collection/` ne pourrait pas couvrir la
// page `/collection` elle-même (sans barre finale), et il ne pourrait donc pas la ramener au mème du jour quand on touche
// la notification. Les autres appareils du site ont les leurs (`/sw.js` pour l'Espace Pro, `/autour-de-moi/sw.js`).
//
// IL NE MET RIEN EN CACHE, et n'intercepte aucune requête : une appli qu'on modifie plusieurs fois par jour ne doit
// jamais servir la version d'hier.
//
// TOUJOURS UNE NOTIFICATION, même quand l'appli est ouverte : sur iPhone, un message reçu sans notification affichée
// peut coûter l'abonnement.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.title || "ClikMe", {
      body: d.body || "",
      icon: "/direct/icone-autour-512.png",
      ...(d.tag ? { tag: d.tag, renotify: true } : {}),
      data: { url: d.url || "/collection" },
    }),
  );
});

// L'APPUI OUVRE L'APPLI SUR LE MÈME DU JOUR : la fenêtre déjà ouverte si elle existe (elle va à `#jour`), sinon une nouvelle.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = new URL((event.notification.data && event.notification.data.url) || "/collection", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (liste) => {
      const ouverte = liste.find((c) => new URL(c.url).pathname.startsWith("/collection"));
      if (!ouverte) return self.clients.openWindow(cible);
      const c = (await ouverte.focus().catch(() => null)) || ouverte;
      try {
        await c.navigate(cible);
      } catch {
        /* une page que ce fichier ne contrôle pas encore : elle est au premier plan, c'est déjà ça */
      }
      return undefined;
    }),
  );
});
