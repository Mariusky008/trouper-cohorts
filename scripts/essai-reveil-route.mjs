// ⏰ LE RÉVEIL, PAR LES ROUTES. Audit UX du 28 novembre 2026, `docs/audit-ux.md`, section 13, et
// `.github/workflows/clikme-reveil.yml`. Il tourne contre le faux Supabase, jamais contre la vraie base.
//
// Toutes les cinq minutes, GitHub appelle sans cookie chaque route du premier écran, pour garder leurs fonctions
// chaudes. Cet essai fait les mêmes appels, lus dans le fichier du travail (une seule liste), et vérifie :
// - qu'aucun ne tombe en erreur (jamais de 5xx) ;
// - qu'aucun ne répond comme à quelqu'un : pas de figurine, pas de maison, pas de proches ;
// - qu'aucun n'écrit rien : la base reste la même ;
// - que tous répondent vite.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-reveil-route.mjs
import fs from "node:fs";

const F = "http://127.0.0.1:54321";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (la liste du travail : la boucle `for r in … ; do`)
const travail = fs.readFileSync(new URL("../.github/workflows/clikme-reveil.yml", import.meta.url), "utf8");
const boucle = travail.match(/for r in (.+?); do/)?.[1] ?? "";
const routes = [...boucle.matchAll(/"([^"]+)"|(\S+)/g)].map((x) => x[1] ?? x[2]);
ok(routes.length >= 9 && routes.includes("fil-decouvrir") && routes.includes("ma-figurine"), `le travail appelle les routes du premier écran (${routes.length} : ${routes.join(", ")})`);
ok(/cron: "\*\/5 \* \* \* \*"/.test(travail), "… toutes les cinq minutes");
ok(!/cookie|Authorization|secrets\./i.test(travail.replace(/^#.*$/gm, "")), "… sans cookie ni secret");

const etat = async () => (await fetch(`${F}/__etat`)).json();
const avant = await etat();
for (const r of routes) {
  const t0 = Date.now();
  const rep = await fetch(`${BASE}/api/direct/${r}`, { headers: { "user-agent": "clikme-reveil" } });
  const ms = Date.now() - t0;
  const corps = await rep.json().catch(() => ({}));
  ok(rep.status < 500, `/api/direct/${r} : ${rep.status}, en ${ms} ms`);
  // (sans cookie : personne — ni sa figurine, ni sa maison, ni ses proches, ni son fil)
  const quelquun = Boolean(corps?.etat?.compte || corps?.maison || corps?.proches?.length || corps?.fil || corps?.groupes?.length || corps?.etat?.prenom);
  ok(!quelquun, "… et ne répond pour personne");
  ok(ms < 5000, "… vite (moins de 5 s, même au premier appel)");
}
const apres = await etat();
ok(JSON.stringify(apres) === JSON.stringify(avant), "aucun appel n'a rien écrit dans la base");

console.log(echecs ? `\n${echecs} échec(s).` : "\nLe réveil : tout est bon.");
process.exit(echecs ? 1 : 0);
