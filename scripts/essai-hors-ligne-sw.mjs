// 📡 LE SERVICE WORKER DE CLIKME, HORS LIGNE — l'audit UX du 28 novembre 2026, lot 5b (`public/collection-sw.js`), sans
// navigateur ni serveur : le fichier tourne ici, avec un réseau qu'on décide.
//
// (Pourquoi pas dans le navigateur : la coupure de réseau simulée par Playwright ne s'applique pas toujours aux
// requêtes d'un service worker — selon la version de Chromium, la page arrivait quand même, ou l'écran d'erreur du
// navigateur. Ici, le réseau échoue pour de vrai, à chaque fois.)
//
// L'ouverture d'une page, le réseau en panne : « Pas de connexion », « Réessayer », en HTML. Le réseau qui répond : la
// vraie page, telle quelle. Une autre requête (une image, une route) : il n'y touche pas. Rien n'est mis en cache.
import fs from "node:fs";
import vm from "node:vm";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const code = fs.readFileSync(new URL("../public/collection-sw.js", import.meta.url), "utf8");
const ecouteurs = {};
const contexte = {
  self: { addEventListener: (type, f) => (ecouteurs[type] = f), skipWaiting() {}, clients: { claim() {} }, registration: {}, location: { origin: "https://www.clikme.fr" } },
  Response,
  URL,
  fetch: async () => {
    throw new TypeError("Failed to fetch");
  },
  caches: { open: () => ok(false, "jamais de cache") },
};
vm.createContext(contexte);
vm.runInContext(code, contexte);
ok(typeof ecouteurs.fetch === "function", "le service worker écoute les requêtes");

const ouvrir = (mode) => {
  let reponse = null;
  ecouteurs.fetch({ request: { mode, url: "https://www.clikme.fr/collection" }, respondWith: (p) => (reponse = p) });
  return reponse;
};

// le réseau en panne : l'écran « Pas de connexion »
const horsLigne = await ouvrir("navigate");
const html = horsLigne ? await horsLigne.text() : "";
ok(horsLigne && /text\/html/.test(horsLigne.headers.get("content-type") ?? ""), "réseau en panne : il répond lui-même, en HTML");
ok(/Pas de connexion/.test(html) && /Réessayer/.test(html) && /location\.reload\(\)/.test(html), "… « 📡 Pas de connexion » et « Réessayer » (qui recharge la page)");
ok(!/exemple/i.test(html), "… jamais le mot interdit");

// le réseau qui répond : la vraie page, telle quelle
contexte.fetch = async () => new Response("<main>la vraie page</main>", { headers: { "content-type": "text/html" } });
const enLigne = await ouvrir("navigate");
ok((await enLigne.text()) === "<main>la vraie page</main>", "réseau qui répond : la vraie page, telle quelle");

// une autre requête : il n'y touche pas
ok(ouvrir("cors") === null && ouvrir("no-cors") === null, "une image, une route : il n'y touche pas");

console.log(echecs ? `\n${echecs} échec(s)` : "\nLe service worker, hors ligne : tout est bon");
process.exit(echecs ? 1 : 0);
