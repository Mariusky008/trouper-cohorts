// 🔔 LE SERVICE WORKER DE CLIKME (`/collection`) — le lot 3, 7 novembre 2026.
//
// SON SEUL TRAVAIL : AFFICHER LE MÈME DU JOUR (vers 11 h 30) et le « C'est réglé ! » qui le précède, envoyés par
// `lib/direct/appli-collection-serveur.ts`, puis ouvrir l'appli dessus quand on touche la notification.
//
// À LA RACINE DU SITE, MAIS SA PORTÉE EST `/collection` : un fichier rangé dans `/collection/` ne pourrait pas couvrir la
// page `/collection` elle-même (sans barre finale), et il ne pourrait donc pas la ramener au mème du jour quand on touche
// la notification. Les autres appareils du site ont les leurs (`/sw.js` pour l'Espace Pro, `/autour-de-moi/sw.js`).
//
// IL NE MET RIEN EN CACHE : une appli qu'on modifie plusieurs fois par jour ne doit jamais servir la version d'hier.
// (l'audit UX du 28 novembre 2026, lot 5b) Il intercepte une seule chose : l'ouverture d'une page de l'appli. Elle part
// au réseau comme avant ; si le réseau ne répond pas (hors ligne), il montre « Pas de connexion », écrite ici même,
// avec « Réessayer » — au lieu de la page d'erreur du navigateur.
//
// TOUJOURS UNE NOTIFICATION, même quand l'appli est ouverte : sur iPhone, un message reçu sans notification affichée
// peut coûter l'abonnement.
self.addEventListener("install", () => self.skipWaiting());

const PAGE_HORS_LIGNE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Pas de connexion · ClikMe</title>
<style>body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 20px;box-sizing:border-box;text-align:center;color:#FFF4E6;font-family:Poppins,system-ui,sans-serif;background:radial-gradient(90% 60% at 50% 0%,#2C0C25,#12040E 70%)}
.l{margin:0 0 16px;font-weight:900;font-size:22px}.l b{color:#FF2E9A}h1{margin:0;font-size:24px;font-weight:900}p{margin:0;max-width:320px;color:#E9D6DF;font-size:15px;line-height:1.5}
button{min-height:50px;margin-top:10px;padding:0 26px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-weight:900;font-size:16px}</style></head>
<body data-hors-ligne><p class="l">Clik<b>Me</b></p><p style="font-size:52px;margin:0">📡</p><h1>Pas de connexion</h1>
<p>ClikMe a besoin d’Internet pour te montrer tes proches et tes salons. Vérifie ton Wi-Fi ou tes données mobiles.</p>
<button type="button" onclick="location.reload()">Réessayer</button></body></html>`;

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => new Response(PAGE_HORS_LIGNE, { headers: { "content-type": "text/html; charset=utf-8" } })));
});
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
