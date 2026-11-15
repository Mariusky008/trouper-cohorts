// 🏡 L'UNIVERS DE PABLITO (la bienvenue « Entre chez Pablito », 15 novembre 2026), PAR LES ROUTES — contre le faux
// Supabase, jamais la vraie base (`lib/direct/chez-pablito-serveur.ts`, `app/api/direct/chez-pablito`,
// `app/api/admin/direct/pablito`).
//
// Le propriétaire (administrateur, et habitant de ce téléphone) a son univers : un décor, sa figurine assise, trois clés
// (deux posées sur le décor, une sans place), une proposition, un souvenir posé. Tant qu'il ne l'a pas adopté, la
// bienvenue n'a pas d'univers. Personne d'autre que l'administrateur n'adopte ; sans figurine, ou sans univers créé :
// refusé. Adopté : tout le monde voit son décor, sa figurine à sa place, ses clés posées (jamais sa proposition, ses
// retouches ni ses souvenirs), la saison. « Retirer » : plus d'univers.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-chez-pablito-route.mjs
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── l'administrateur (sa session) ; ses deux habitants : celui de son téléphone, et un autre sans univers ───
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
const PROPRIO = { id: "abababab-0000-4000-8000-000000000c01", jeton: "jeton-proprio-chez-pablito-01", prenom: "Marius" };
const AUTRE = { id: "abababab-0000-4000-8000-000000000c02", jeton: "jeton-autre-chez-pablito-001", prenom: "Nina" };
await semer("human_habitants", [PROPRIO, AUTRE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const maintenant = new Date().toISOString();
const P1 = `${PROPRIO.id}/perso/v1`;
for (const n of ["assise", "assise_parle", "debout"]) await deposer(`${P1}/${n}.png`, PNG, "image/png");
const perso = {
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  references: { assise: { chemin: `${P1}/assise.png` }, assise_parle: { chemin: `${P1}/assise_parle.png` }, debout: { chemin: `${P1}/debout.png` } },
  historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
};
await json(`${P1}/fiche.json`, perso);
await json(`${PROPRIO.id}/perso/fiche.json`, perso);
const M1 = `${PROPRIO.id}/monde/v1`;
await deposer(`${M1}/decor.png`, PNG, "image/png");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la montagne.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [
    { id: "e1", quoi: "un établi", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true, zone: [0.05, 0.5, 0.25, 0.15] },
    { id: "e2", quoi: "les montagnes", pourquoi: "il aime marcher là-haut, le matin", source: "interpretation", zone: [0.4, 0.2, 0.3, 0.15] },
    { id: "e3", quoi: "une guitare", pourquoi: "je joue le soir", source: "dit" },
  ],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.5, y: 0.86, echelle: 1 }, { id: "invite", x: 0.75, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" }, figurine: { x: 0.5, y: 0.9, hauteur: 0.4 } },
  references: { decor: { chemin: `${M1}/decor.png` } },
  visibilite: "proches",
  souvenirs: [{ id: "s1", de: "0123456789abcdef", objet: "fleurs", mot: "un mot secret", le: maintenant, accepte_le: maintenant }],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${PROPRIO.id}/monde/fiche.json`, monde);

const PUBLIC = `${BASE}/api/direct/chez-pablito`;
const ADMIN_ROUTE = `${BASE}/api/admin/direct/pablito`;
const voir = async () => (await (await fetch(PUBLIC)).json().catch(() => ({}))).univers;
const admin = async (corps, cookie) => {
  const r = await fetch(ADMIN_ROUTE, { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const ses = (h) => `${COOKIE_ADMIN}; clikme_habitant=${h.jeton}`;

// ═══ PAS ENCORE ADOPTÉ ═══
const r0 = await fetch(PUBLIC);
ok(r0.status === 200 && (await r0.json()).univers === null, "pas encore adopté : la bienvenue n'a pas d'univers (elle garde l'ancienne)");

// ═══ PERSONNE D'AUTRE QUE L'ADMINISTRATEUR ═══
ok((await admin({ action: "adopter-univers" }, `clikme_habitant=${PROPRIO.jeton}`)).statut === 403, "un habitant (sans session d'administrateur) n'adopte pas");
ok((await fetch(`${ADMIN_ROUTE}?chez=1`)).status === 403, "ni ne voit l'état de l'univers de Pablito");
ok((await admin({ action: "adopter-univers" }, COOKIE_ADMIN)).statut === 400, "l'administrateur, sans figurine sur ce téléphone : refusé");
const sansUnivers = await admin({ action: "adopter-univers" }, ses(AUTRE));
ok(sansUnivers.statut === 400 && /pas encore créé/.test(sansUnivers.error ?? ""), "une figurine sans univers créé : refusé (« ouvre d'abord /univers/monde »)");
ok((await voir()) === null, "toujours rien à voir");

// ═══ ADOPTÉ ═══
const a = await admin({ action: "adopter-univers" }, ses(PROPRIO));
ok(a.statut === 200 && a.chez?.adopte === true && /^http/.test(a.chez?.univers?.decor ?? ""), "l'administrateur adopte SON univers : c'est celui de Pablito");
ok((await lire("demo-proprio/univers/chez/adopte.json"))?.habitant === PROPRIO.id, "on retient de qui il est (rien n'est copié)");
const u = await voir();
ok(/^http/.test(u?.decor ?? "") && /^http/.test(u?.figurine?.assise ?? "") && /^http/.test(u?.figurine?.parle ?? ""), "tout le monde voit son décor, et sa figurine assise (bouche fermée, bouche ouverte)");
ok(u?.place?.x === 0.5 && u.place.y === 0.9 && u.place.hauteur === 0.4 && u.hote?.x === 0.5, "📏 sa figurine à sa place, à la taille que la pièce demande");
ok(u?.cles?.length === 2 && u.cles.every((c) => Array.isArray(c.zone)) && u.cles[0].quoi === "un établi" && u.cles[0].source === "dit" && u.cles[1].source === "interpretation", "ses clés posées sur le décor (celle sans place reste dehors), avec leur pourquoi");
ok(typeof u?.saison?.nom === "string" && u.saison.nom.length > 0 && typeof u.saison.emoji === "string", "la saison du mois");
const brut = JSON.stringify(u ?? {});
ok(!/atelier ouvert|un mot secret|retouches|souvenirs|visibilite|proposition/.test(brut), "jamais sa proposition, ses retouches, sa porte ni ses souvenirs");
const e = await (await fetch(`${ADMIN_ROUTE}?chez=1`, { headers: { cookie: COOKIE_ADMIN } })).json();
ok(e.chez?.adopte === true && typeof e.chez.le === "string" && e.chez.univers?.cles?.length === 2, "dans l'admin : adopté, quand, et ce que la bienvenue montrera");

// ═══ LA PAGE DIRECTE ═══
const page = await fetch(`${BASE}/bienvenue`);
ok(page.status === 200 && /noindex/.test(await page.text()), "son adresse directe (/bienvenue) s'ouvre, jamais dans les moteurs de recherche");

// ═══ RETIRER ═══
const rt = await admin({ action: "retirer-univers" }, COOKIE_ADMIN);
ok(rt.statut === 200 && rt.chez?.adopte === false, "« Retirer » : l'univers de Pablito est oublié");
ok((await voir()) === null, "la bienvenue n'a plus d'univers (elle reprend l'ancienne)");
ok((await admin({ action: "retirer-univers" })).statut === 403, "personne d'autre ne retire");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
