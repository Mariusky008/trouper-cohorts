// 🏡 LA CRÉATION DE SON UNIVERS (« Univers », lot 4), PAR LES ROUTES — contre le faux Supabase et son faux moteur
// d'image, jamais la vraie base, jamais OpenAI (`lib/direct/univers-creation-serveur.ts`, `app/api/direct/univers`).
//
// Réservé au propriétaire. Léa a sa figurine du nouveau style (lot 2) et la fiche de son univers (lot 3), sans image :
// « Créer mon univers » — le décor d'après SA fiche (« Film, chaleureux », sans figurine, dessiné d'après la consigne
// seule), puis les places (sans modèle qui voit : celles d'attente), puis l'image vedette (son décor et sa figurine,
// la scène validée au lot 0) ; chaque image signée, dans sa version. Son fauteuil prend les couleurs de son monde (lot
// 4b) : une version 2 de sa figurine, refaisable mot pour mot, sa bouche ouverte refaite, debout gardée ; l'image
// vedette avec lui. Une retouche avec ses mots : une version 2, le même décor où une seule chose change (le fauteuil,
// lui, ne se refait pas) ; d'alcool : refusée. Revenir à la version d'avant : une version 3, ses images d'avant, rien
// refait. Trois retouches offertes, puis une par jour. Sam n'a encore ni figurine ni univers.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-univers-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};
const ia = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string" && (c.startsWith("IMAGE ") || c.startsWith("DESSIN ")));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
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
await semer("admins", [{ user_id: ADMIN }]);
const LEA = { id: "abababab-0000-4000-8000-000000000801", jeton: "jeton-lea-univers-0000000001" };
const SAM = { id: "abababab-0000-4000-8000-000000000802", jeton: "jeton-sam-univers-0000000001" };
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: "Essai", ville_slug: "dax" })));

// ─── Léa : sa figurine du nouveau style (lot 2), la fiche de son univers (lot 3) ───
const maintenant = new Date().toISOString();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const P1 = `${LEA.id}/perso/v1`;
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
await json(`${LEA.id}/perso/fiche.json`, perso);
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [
    { id: "e1", quoi: "un établi couvert d'outils", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true },
    { id: "e2", quoi: "un petit phare au loin", pourquoi: "garder le cap", source: "interpretation", valide: true },
  ],
  regles: ["la mer reste au fond"],
  inconnus: [],
  scene: { sol: 0.78, places: [{ id: "hote", x: 0.36, y: 0.8, echelle: 1 }, { id: "invite", x: 0.66, y: 0.82, echelle: 0.96 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: {},
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${LEA.id}/monde/v1/fiche.json`, monde);
await json(`${LEA.id}/monde/fiche.json`, monde);

const ROUTE = `${BASE}/api/direct/univers`;
const cookieDe = (qui) => `${COOKIE_ADMIN}; clikme_habitant=${qui.jeton}`;
const appeler = async (qui, corps, cookie = cookieDe(qui)) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const attendre = async (qui, condition, ms = 40000) => {
  const fin = Date.now() + ms;
  let e = await appeler(qui);
  while (!condition(e) && Date.now() < fin) {
    await new Promise((ok) => setTimeout(ok, 500));
    e = await appeler(qui);
  }
  return e;
};

// ═══ RÉSERVÉ AU PROPRIÉTAIRE ═══
ok((await appeler(LEA, null, `clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appeler(LEA, { action: "creer" }, `clikme_habitant=${LEA.jeton}`)).statut === 403, "réservé au propriétaire");
const s0 = await appeler(SAM);
ok(s0.etape === "sans-fiche" && !s0.figurine && (await appeler(SAM, { action: "creer" })).statut === 400, "Sam n'a encore ni figurine ni univers : rien à créer (l'accueil le mène à sa figurine)");

// ═══ LA CRÉATION ═══
const FAUTEUIL = "Change ONLY the armchair";
const fauteuilsAvant = (await ia()).filter((c) => c.includes(FAUTEUIL)).length;
const e0 = await appeler(LEA);
ok(e0.etape === "a-creer" && e0.proposition.startsWith("Je t'imagine") && /^http/.test(e0.figurine?.assise ?? "") && e0.retouches.restantes === 3, "Léa : son univers est prêt à être créé ; sa figurine ; trois retouches offertes");
const c1 = await appeler(LEA, { action: "creer" });
ok(c1.statut === 200 && c1.version === 1, "« Créer mon univers »");
const e1 = await attendre(LEA, (e) => e.etape === "decouverte" && e.vedette);
ok(e1.etape === "decouverte" && /^http/.test(e1.decor ?? "") && /^http/.test(e1.vedette ?? ""), `créé après la réponse : son décor, son image vedette (${e1.etape})`);
ok(e1.scene?.places?.length === 2 && e1.cles.length === 2 && e1.cles[0].source === "dit", "ses places (celles d'attente, sans modèle qui voit) ; les clés de son univers");
const images = await ia();
const decor = images.find((c) => c.startsWith("DESSIN ") && c.includes("Create the DECOR"));
ok(Boolean(decor) && decor.includes("no magic, just charm") && decor.includes("un établi couvert d'outils") && decor.includes("la mer reste au fond") && decor.includes("NO figurine"), "le décor : « Film, chaleureux », d'après SA fiche, sans figurine, dessiné d'après la consigne seule");
const vedette = images.find((c) => c.startsWith("IMAGE ") && c.includes("IMAGE 2 is a collectible caricature figurine"));
ok(Boolean(vedette) && vedette.includes("bienvenue dans mon univers") && vedette.includes("Do NOT turn them into normal-proportioned people"), "l'image vedette : son décor et sa figurine, chez elle");

// ═══ SON FAUTEUIL AUX COULEURS DE SON MONDE (lot 4b) ═══
const fauteuils = images.filter((c) => c.startsWith("IMAGE ") && c.includes(FAUTEUIL)).slice(fauteuilsAvant);
ok(fauteuils.length === 1 && fauteuils[0].includes("#e8b06a") && fauteuils[0].includes("#2f5d73") && fauteuils[0].includes("transparent") && fauteuils[0].includes("Do not redraw the person"), "son fauteuil refait aux couleurs de son monde (sa palette), la figurine inchangée, détourée");
const p2 = await lire(`${LEA.id}/perso/fiche.json`);
const assise2 = p2?.references?.assise;
ok(
  p2?.version === 2 && p2.fauteuil?.de === "univers" && p2.fauteuil.couleurs.join() === "#e8b06a,#2f5d73,#f3ead9" && Boolean(p2.validee_le) && assise2?.chemin !== `${P1}/assise.png` && assise2?.signature?.entrees?.join() === `${P1}/assise.png`,
  "une version 2 de sa figurine, toujours validée : son fauteuil aux couleurs de son monde, son image refaite d'après celle d'avant",
);
ok(p2?.references?.debout?.chemin === `${P1}/debout.png` && p2?.references?.assise_parle?.chemin === `${LEA.id}/perso/v2/assise_parle.png` && p2.references.assise_parle.signature?.entrees?.join() === assise2?.chemin, "debout (sans fauteuil) gardée ; sa bouche ouverte refaite d'après la nouvelle");
const admin = await (await fetch(`${BASE}/api/admin/direct/fiches?h=${LEA.id}`, { headers: { cookie: COOKIE_ADMIN } })).json();
ok(admin?.perso?.refaisables?.assise === true && admin.perso.refaisables.assise_parle === true, "refaisable mot pour mot : la consigne du fauteuil se redonne à partir de la fiche");
ok(e1.fauteuil?.version === 2 && /^http/.test(e1.fauteuil.avant ?? "") && /^http/.test(e1.figurine?.parle ?? ""), "« Ton fauteuil a pris les couleurs de ton monde » : son image d'avant, pour la montrer");

const f1 = await lire(`${LEA.id}/monde/fiche.json`);
ok(
  f1?.version === 1 && f1.references.decor?.chemin === `${LEA.id}/monde/v1/decor.png` && f1.references.decor.signature?.entrees?.length === 0 && f1.references.vedette?.signature?.entrees?.join() === `${LEA.id}/monde/v1/decor.png,${assise2?.chemin}`,
  "chaque image signée, dans sa version (le décor : rien en entrée ; la vedette : son décor et sa figurine, dans son nouveau fauteuil)",
);
ok((await appeler(LEA, { action: "creer" })).statut === 409, "un univers créé ne se recrée pas : il se retouche");

// ═══ 🍂 LA SAISON (lot 7) : son décor du mois, fait à sa première visite du mois ═══
const es = await attendre(LEA, (e) => e.saison?.decor === true);
const saison = (await ia()).find((c) => c.startsWith("IMAGE ") && c.includes("Dress it for the season «"));
ok(es.saison?.decor === true && Boolean(es.saison.nom) && /\/saisons\//.test(decodeURIComponent(es.decor ?? "")) && Boolean(saison) && saison.includes("EMPTY"), `🍂 son décor du mois (${es.saison?.emoji} ${es.saison?.nom}) : le même lieu, paré du thème, l'espace devant libre`);
ok(es.saison?.tenue === false && !es.figurine?.assise?.includes("/mois/"), "sa tenue du mois : pas encore méritée (sa figurine de tous les jours)");
// sa figurine du mois, méritée et faite au nouveau style : c'est elle qui s'assoit chez lui ce mois-ci
const MOIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date()).slice(0, 7);
await json(`${LEA.id}/mois/${MOIS}.json`, { mois: MOIS, image: `${LEA.id}/mois/${MOIS}.webp`, expression: "fier", le: new Date().toISOString() });
await deposer(`${LEA.id}/mois/${MOIS}.webp`, Buffer.from("RIFF0000WEBP"), "image/webp");
await deposer(`${LEA.id}/mois/${MOIS}-p.webp`, Buffer.from("RIFF0000WEBP"), "image/webp");
ok((await appeler(LEA)).saison?.tenue === false, "une figurine du mois de l'ancien style ne s'assoit pas chez lui");
await json(`${LEA.id}/mois/${MOIS}.json`, { mois: MOIS, image: `${LEA.id}/mois/${MOIS}.webp`, expression: "fier", style: "collection-1", le: new Date().toISOString() });
const et = await appeler(LEA);
ok(et.saison?.tenue === true && et.figurine?.assise?.includes(`/mois/${MOIS}.webp`) && et.figurine?.parle?.includes(`/mois/${MOIS}-p.webp`), "🗓️ sa tenue du mois (au nouveau style) : c'est elle qui s'assoit chez lui, et qui parle");
await json(`${LEA.id}/mois/${MOIS}.json`, {});
const m1 = await appeler(LEA, { action: "mesurer" });
ok(m1.statut === 200 && m1.version === 1 && !(await appeler(LEA)).scene?.figurine && (await lire(`${LEA.id}/monde/creation.json`))?.mesure === 1, "📏 sa figurine relevée sur l'image vedette : demandée une fois (sans modèle qui voit, rien ne change)");

// ═══ LES RETOUCHES ═══
ok((await appeler(LEA, { action: "retoucher", texte: "un bar à cocktails" })).statut === 400 && (await appeler(LEA, { action: "retoucher", texte: "ok" })).statut === 400, "une retouche d'alcool, ou trop courte : refusée");
const r2 = await appeler(LEA, { action: "retoucher", texte: "Davantage de nature" });
ok(r2.statut === 200 && r2.version === 2, "une retouche avec ses mots : une version 2");
const e2 = await attendre(LEA, (e) => e.etape === "decouverte" && e.version === 2 && e.vedette);
const retouche = (await ia()).find((c) => c.startsWith("IMAGE ") && c.includes("THE SAME DECOR"));
ok(e2.version === 2 && e2.retouches.restantes === 2 && e2.avant === 1 && Boolean(retouche) && retouche.includes("Davantage de nature"), "le même décor, une seule chose change ; encore deux retouches ; la version d'avant existe");
ok((await ia()).filter((c) => c.includes(FAUTEUIL)).length === fauteuilsAvant + 1 && (await lire(`${LEA.id}/perso/fiche.json`))?.version === 2, "une retouche ne refait pas son fauteuil : il a déjà les couleurs de son monde");
const f2 = await lire(`${LEA.id}/monde/fiche.json`);
ok(f2?.retouches?.join() === "Davantage de nature" && f2.references.decor?.chemin === `${LEA.id}/monde/v2/decor.png` && f2.references.decor.signature?.entrees?.join() === `${LEA.id}/monde/v1/decor.png`, "la version 2 : sa retouche, son décor (fait sur celui d'avant)");
const r3 = await appeler(LEA, { action: "revenir" });
const f3 = await lire(`${LEA.id}/monde/fiche.json`);
ok(r3.version === 3 && f3?.references?.decor?.chemin === `${LEA.id}/monde/v1/decor.png` && (await appeler(LEA)).etape === "decouverte", "revenir à la version d'avant : une version 3, ses images d'avant, rien refait");

// ═══ LES PLAFONDS ═══
const creation = await lire(`${LEA.id}/monde/creation.json`);
await json(`${LEA.id}/monde/creation.json`, { ...creation, retouchesFaites: 3, jour: new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }), retouchesDuJour: 1 });
const e4 = await appeler(LEA);
ok(e4.retouches.restantes === 0 && (await appeler(LEA, { action: "retoucher", texte: "Plus de lumière" })).statut === 429, "trois retouches offertes, puis une par jour : c'est assez pour aujourd'hui");

console.log(echecs ? `\n${echecs} échec(s)` : "\nson univers tient ✓");
process.exit(echecs ? 1 : 0);
