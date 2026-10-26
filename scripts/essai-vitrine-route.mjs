// 🏪 LA VITRINE D'UN COMMERCE, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Trois habitants libèrent leur fantôme à la fin du film d'un commerce (par `api/direct/cage`), l'un cache son
// prénom ; puis ce que `api/direct/vitrine` doit tenir (`20261030090000_clik_vitrine.sql`) : un fantôme par
// personne, sa dernière cage, sans identifiant de personne ; le prénom caché ne se voit pas — sauf pour soi ;
// « Vous » marqué pour qui regarde ; les cages de plus de sept jours n'y sont plus ; l'ardoise écrite au comptoir
// (route du carnet, action « ardoise ») s'affiche le jour même, plus le lendemain, et s'efface ; un mauvais
// commerce, un réglage sans fantôme. Puis les petits mots : un par jour, seulement avec son fantôme ; un mot de
// la liste se voit tout de suite, un mot écrit après le 💛 du commerçant ; le coup de cœur sous l'ardoise ;
// « offrir » (jamais d'alcool, un cadeau par mot) ; les réponses dans la Maison de chacun. Puis les écussons :
// la parole tenue (une promesse, puis un passage noté au comptoir — jamais avant la promesse), le pin de ce
// commerce seulement là où il a tenu parole, le coup de cœur ; et ceux de chacun dans sa Maison.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-vitrine-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const SITE = "ffffffff-0000-4000-8000-000000000009";
const SLUG = "cafe-de-la-vitrine-dax";
const JETON = "jeton-de-la-vitrine";
const FILM = "https://films.essai-vitrine.fr/cafe.mp4";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
await semer("human_vitrine_sites", {
  id: SITE, slug: SLUG, channel: "letter", pro_token: JETON, business_name: "Le Café de la Vitrine", city: "Dax", activite: "Restaurant",
  published: true, est_client: true, current_offer: { text: "Plat du jour : axoa", created_at: new Date().toISOString(), video: FILM },
});

let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const cookies = {};
const cage = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/cage`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookies[qui] || "" },
    body: JSON.stringify({ slug: SLUG, ville: "dax", film: FILM, ...corps }),
  });
  const sc = r.headers.get("set-cookie");
  if (sc && !cookies[qui]) cookies[qui] = sc.split(";")[0];
  return r.status;
};
const vitrine = async (qui, q = `slug=${SLUG}`) => {
  const r = await fetch(`${BASE}/api/direct/vitrine?${q}`, { headers: { cookie: cookies[qui] || "" } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const prenom = async (qui, visible) => {
  const r = await fetch(`${BASE}/api/direct/vitrine`, { method: "POST", headers: { "content-type": "application/json", cookie: cookies[qui] || "" }, body: JSON.stringify({ action: "prenom", visible }) });
  return r.status;
};
const ardoise = async (texte) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: JETON, action: "ardoise", texte }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

ok((await cage("lea", { cage: "adore", prenom: "Léa", look: "fleuri" })) === 200, "Léa : « J'adore la vidéo »");
ok((await cage("tom", { cage: "un-jour", prenom: "Tom", look: "denim" })) === 200, "Tom : « Je viendrai un jour »");
ok((await cage("ines", { cage: "aujourdhui", prenom: "Inès", look: "artiste" })) === 200, "Inès : « Je réserve aujourd'hui »");
ok((await cage("tom", { cage: "aujourdhui", prenom: "Tom", look: "denim" })) === 200, "Tom change d'avis : aujourd'hui");
// une cage d'il y a dix jours : plus dans la vitrine
await semer("clik_cage", { site_id: SITE, habitant_id: "aaaaaaaa-0000-4000-8000-00000000000b", film: FILM, cage: "adore", prenom: "Ancien", look: "cosy",
  updated_at: new Date(Date.now() - 10 * 86_400_000).toISOString() });

let v = await vitrine("passant");
const noms = (v.fantomes || []).map((f) => `${f.prenom}/${f.cage}`).sort().join(",");
ok(v.statut === 200 && v.fantomes?.length === 3 && noms === "Inès/aujourdhui,Léa/adore,Tom/aujourdhui", `trois fantômes, la dernière cage de chacun, pas l'ancien (${noms})`);
ok(!JSON.stringify(v).includes("habitant") && v.fantomes.every((f) => /^f[0-9a-f]{12}$/.test(f.id)), "jamais l'identifiant de personne");
ok(!v.fantomes.some((f) => f.moi), "un passant sans fantôme : personne n'est « Vous »");
ok(v.ardoise === null, "pas d'ardoise");

ok((await prenom("lea", false)) === 200, "Léa cache son prénom");
v = await vitrine("passant");
ok(v.fantomes.some((f) => f.cage === "adore" && f.prenom === "" && f.look === "fleuri"), "son fantôme reste, sans prénom");
v = await vitrine("lea");
const lea = v.fantomes.find((f) => f.moi);
ok(lea?.prenom === "Léa" && v.prenomVisible === false, "pour elle-même : « Vous », son prénom, et son réglage");
ok((await vitrine("lea", "moi=1")).prenomVisible === false, "son réglage seul (Ma Maison)");
ok((await prenom("lea", true)) === 200 && (await vitrine("passant")).fantomes.some((f) => f.prenom === "Léa"), "Léa le remontre");
ok((await prenom("personne", false)) === 401, "un réglage sans fantôme : refusé");

let a = await ardoise("Plus que 6 axoas ce midi !");
ok(a.statut === 200 && a.ardoise === "Plus que 6 axoas ce midi !", "le comptoir écrit l'ardoise");
ok((await vitrine("passant")).ardoise === "Plus que 6 axoas ce midi !", "elle s'affiche sous la vitrine");
const lire = await (await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: JETON, action: "lire" }) })).json();
ok(lire.ardoise === "Plus que 6 axoas ce midi !", "le carnet la relit");
await fetch(`${F}/clik_ardoise?site_id=eq.${SITE}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecrite_le: new Date(Date.now() - 86_400_000 * 1.2).toISOString() }) });
ok((await vitrine("passant")).ardoise === null, "écrite hier : elle ne s'affiche plus");
a = await ardoise("x".repeat(200));
ok(a.ardoise?.length === 90, `coupée à 90 signes (${a.ardoise?.length})`);
a = await ardoise("");
ok(a.statut === 200 && a.ardoise === null && (await vitrine("passant")).ardoise === null, "effacée");
ok((await (await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "faux", action: "ardoise", texte: "Piratée" }) })).status) === 403, "l'ardoise d'un autre : refusée");
ok((await vitrine("passant", "slug=pas-un-commerce")).statut === 404, "un commerce inconnu : 404");

// ── 💌 LES PETITS MOTS (étape 2) ──
const mot = async (qui, corps) => {
  const r = await fetch(`${BASE}/api/direct/mot`, { method: "POST", headers: { "content-type": "application/json", cookie: cookies[qui] || "" }, body: JSON.stringify({ slug: SLUG, ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const pro = async (corps) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: JETON, ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
ok((await mot("passant", { texte: "Coucou" })).statut === 401, "un passant sans fantôme ne peut pas écrire");
ok((await mot("lea", { texte: "Je suis un mot inventé", liste: true })).statut === 400, "« de la liste » mais pas dans la liste : refusé");
ok((await mot("lea", { texte: "   " })).statut === 400, "un mot vide : refusé");
ok((await mot("lea", { texte: "Rien que la vidéo m’a donné faim", liste: true })).statut === 200, "Léa choisit un mot de la liste");
ok((await mot("lea", { texte: "Encore un", liste: false })).statut === 409, "un petit mot par jour");
ok((await mot("tom", { texte: "Merci pour samedi, on revient avec ma sœur !" })).statut === 200, "Tom écrit le sien");
v = await vitrine("passant");
const parPrenom = (n) => v.fantomes.find((f) => f.prenom === n);
ok(parPrenom("Léa")?.mot === "Rien que la vidéo m’a donné faim", "le mot de la liste se voit tout de suite");
ok(parPrenom("Tom") && !parPrenom("Tom").mot, "le mot écrit attend son 💛");
const vt = await vitrine("tom");
ok(vt.fantomes.find((f) => f.moi)?.mot === "Merci pour samedi, on revient avec ma sœur !" && vt.ecritAujourdhui === true, "Tom voit le sien, et sait qu'il a écrit aujourd'hui");
let ms = await pro({ action: "mots" });
ok(ms.statut === 200 && ms.mots?.length === 2 && ms.mots.some((m) => m.prenom === "Tom" && !m.liste) && ms.mots.some((m) => m.prenom === "Léa" && m.liste), `le comptoir les lit tous (${ms.mots?.map((m) => m.prenom)})`);
const idTom = ms.mots.find((m) => m.prenom === "Tom").id;
const idLea = ms.mots.find((m) => m.prenom === "Léa").id;
ok((await pro({ action: "coeur", id: idTom, oui: true })).statut === 200, "💛 pour le mot de Tom");
v = await vitrine("passant");
ok(parPrenom("Tom")?.mot === "Merci pour samedi, on revient avec ma sœur !" && parPrenom("Tom")?.coeur === true, "il passe dans la vitrine, avec son 💛");
ok(v.coupDeCoeur?.texte === "Merci pour samedi, on revient avec ma sœur !" && v.coupDeCoeur?.prenom === "Tom", "le coup de cœur, sous l'ardoise");
ok((await pro({ action: "offrir", id: idLea, cadeau: "un verre de vin" })).statut === 400, "offrir de l'alcool : refusé (loi Évin)");
ok((await pro({ action: "offrir", id: idLea, cadeau: "le café" })).statut === 200, "🎁 le café pour Léa");
ok((await pro({ action: "offrir", id: idLea, cadeau: "le dessert" })).statut === 409, "un seul cadeau par mot");
const maisonDe = async (qui) => (await (await fetch(`${BASE}/api/direct/messages`, { headers: { cookie: cookies[qui] } })).json()).reponses ?? [];
const rl = await maisonDe("lea");
ok(rl.length === 1 && rl[0].cadeau === "le café" && rl[0].commerce.nom === "Le Café de la Vitrine", "dans la Maison de Léa : le café offert");
const rt = await maisonDe("tom");
ok(rt.length === 1 && rt[0].cadeau === "" && rt[0].mot.startsWith("Merci pour samedi"), "dans la Maison de Tom : le 💛");
ok((await maisonDe("ines")).length === 0, "Inès n'a rien reçu");
ok((await pro({ action: "coeur", id: idTom, oui: false })).statut === 200 && !(await vitrine("passant")).fantomes.find((f) => f.prenom === "Tom")?.mot, "le 💛 retiré : le mot écrit quitte la vitrine");
ok((await pro({ action: "coeur", id: "pas-un-id" })).statut === 404, "un mot inconnu : refusé");

// ── 🧵 LES ÉCUSSONS (étape 3) ──
const ecus = (qui) => (v.fantomes.find((f) => f.prenom === qui)?.ecussons ?? []).join(",");
const mesEcussons = async (qui) => (await (await fetch(`${BASE}/api/direct/ecussons`, { headers: { cookie: cookies[qui] || "" } })).json());
v = await vitrine("passant");
ok(ecus("Léa") === "coeur" && ecus("Tom") === "" && ecus("Inès") === "", `avant tout passage : le coup de cœur de Léa (son café offert), rien d'autre (Léa ${ecus("Léa")}, Tom ${ecus("Tom")})`);
const refs = Object.fromEntries(((await pro({ action: "lire" })).lignes ?? []).map((l) => [l.prenom, l.ref]));
ok((await pro({ action: "passage", ref: refs.Tom, oui: true })).statut === 200, "le comptoir note le passage de Tom (il avait promis : aujourd'hui)");
ok((await pro({ action: "passage", ref: refs["Léa"], oui: true })).statut === 200, "et celui de Léa (« J'adore » : elle n'avait rien promis)");
v = await vitrine("passant");
ok(ecus("Tom") === "parole,pin", `Tom : la parole tenue et le pin de ce commerce (${ecus("Tom")})`);
ok(ecus("Léa") === "coeur", `Léa : pas de parole sans promesse (${ecus("Léa")})`);
ok((await pro({ action: "coeur", id: idTom, oui: true })).statut === 200 && (v = await vitrine("passant")) && ecus("Tom") === "parole,pin,coeur", `le 💛 revient : les trois sur Tom (${ecus("Tom")})`);
// Inès promet ailleurs, et tient parole ailleurs : la parole se voit ici, pas le pin
const AILLEURS = "ffffffff-0000-4000-8000-00000000000a";
await semer("human_vitrine_sites", { id: AILLEURS, slug: "boulangerie-d-ailleurs-dax", channel: "letter", pro_token: "jeton-d-ailleurs", business_name: "La Boulangerie d'Ailleurs", city: "Dax", published: true });
const idInes = (await (await fetch(`${F}/clik_cage?site_id=eq.${SITE}&prenom=eq.In%C3%A8s&select=habitant_id`)).json())[0]?.habitant_id;
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
await semer("clik_cage", { site_id: AILLEURS, habitant_id: idInes, film: "https://films.essai-vitrine.fr/pain.mp4", cage: "un-jour", prenom: "Inès", look: "artiste", created_at: ilYa(5), updated_at: ilYa(5) });
await semer("clik_visite", { site_id: AILLEURS, habitant_id: idInes, jour: ilYa(6).slice(0, 10) });
v = await vitrine("passant");
ok(ecus("Inès") === "", `un passage AVANT la promesse ne la tient pas (${ecus("Inès")})`);
await semer("clik_visite", { site_id: AILLEURS, habitant_id: idInes, jour: ilYa(2).slice(0, 10) });
v = await vitrine("passant");
ok(ecus("Inès") === "parole", `Inès a tenu parole ailleurs : la parole ici, pas le pin (${ecus("Inès")})`);
const et = await mesEcussons("tom");
ok(et.ok && et.pins?.map((x) => `${x.cle}/${x.nom}`).join() === `${SLUG}/Le Café de la Vitrine` && et.coeurs?.length === 1, `Ma Maison de Tom : son pin du Café de la Vitrine, son coup de cœur (${JSON.stringify(et)})`);
const ei = await mesEcussons("ines");
ok(ei.pins?.map((x) => x.nom).join() === "La Boulangerie d'Ailleurs" && ei.coeurs?.length === 0, `Ma Maison d'Inès : le pin de la Boulangerie d'Ailleurs (${ei.pins?.map((x) => x.nom)})`);
const el = await mesEcussons("lea");
ok(el.pins?.length === 0 && el.coeurs?.map((x) => x.nom).join() === "Le Café de la Vitrine", "Ma Maison de Léa : un coup de cœur, pas de pin");
const ep = await mesEcussons("passant");
ok(ep.ok && ep.pins.length === 0 && ep.coeurs.length === 0, "un passant sans fantôme : aucun écusson");
ok(!JSON.stringify([et, ei, el]).includes(idInes) && !JSON.stringify(et).includes("habitant"), "jamais l'identifiant de personne");
const avant = Object.fromEntries((await vitrine("passant")).fantomes.map((f) => [f.prenom, f.id]));
ok((await cage("zoe", { cage: "aujourdhui", prenom: "Zoé", look: "cosy" })) === 200, "Zoé arrive");
const apres = Object.fromEntries((await vitrine("passant")).fantomes.map((f) => [f.prenom, f.id]));
ok(["Léa", "Tom", "Inès"].every((n) => apres[n] === avant[n]) && apres["Zoé"] && !Object.values(avant).includes(apres["Zoé"]), "chacun garde son numéro d'écran quand un autre arrive");
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
