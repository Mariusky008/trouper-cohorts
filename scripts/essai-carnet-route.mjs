// 📒 LE CARNET DU COMPTOIR, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Trois habitants libèrent leur fantôme à la fin du film d'un commerce (par `api/direct/cage`, comme dans
// l'application), puis ce que `api/site-internet/pro/carnet` doit tenir : une ligne par personne, avec la
// cage libérée en dernier et le nombre de films ; « à prévenir » pour celle qui a laissé son numéro, mais
// jamais le numéro ni l'identifiant de personne ; un passage par jour (noter deux fois compte une fois, et
// on peut l'enlever) ; le stop efface le numéro, et redire oui à la fin d'un film l'annule ; un mauvais
// jeton, une ligne d'un autre commerce, une référence qui n'en est pas une.
//
//   node scripts/faux-supabase.mjs 54321
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
//     npx next dev --webpack -p 3821
//   node scripts/essai-carnet-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const SITE = "ffffffff-0000-4000-8000-000000000007";
const AUTRE = "ffffffff-0000-4000-8000-000000000008";
const SLUG = "bistrot-du-carnet-dax";
const JETON = "jeton-du-carnet";
const FILM = "https://films.essai-carnet.fr/plat.mp4";
const FILM2 = "https://films.essai-carnet.fr/service.mp4";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const maintenant = new Date().toISOString();
await semer("human_vitrine_sites", {
  id: SITE, slug: SLUG, channel: "letter", pro_token: JETON, business_name: "Le Bistrot du Carnet", city: "Dax", activite: "Restaurant",
  published: true, est_client: true, current_offer: { text: "Plat du jour : axoa", created_at: maintenant, video: FILM },
});
await semer("human_publications", { site_id: SITE, ville_slug: "dax", texte: "Le service du soir", video: FILM2, publie_le: maintenant });
// Une cage chez un autre commerce : le carnet du premier ne doit ni la montrer, ni la laisser toucher.
await semer("clik_cage", { site_id: AUTRE, habitant_id: "aaaaaaaa-0000-4000-8000-00000000000a", film: "x", cage: "adore", prenom: "Ailleurs" });

let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const cookies = {};
const cage = async (qui, corps, film = FILM) => {
  const r = await fetch(`${BASE}/api/direct/cage`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookies[qui] || "" },
    body: JSON.stringify({ slug: SLUG, ville: "dax", film, ...corps }),
  });
  const sc = r.headers.get("set-cookie");
  if (sc && !cookies[qui]) cookies[qui] = sc.split(";")[0];
  return r.status;
};
const carnet = async (corps, jeton = JETON) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/carnet`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: SLUG, token: jeton, ...corps }),
  });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const ligne = (j, prenom) => (j.lignes || []).find((l) => l.prenom === prenom);

ok((await cage("camille", { cage: "un-jour", prenom: "Camille", look: "fleuri", whatsapp: "06 12 34 56 78" })) === 200, "Camille : « Je viendrai un jour », avec son numéro");
ok((await cage("camille", { cage: "aujourdhui", prenom: "Camille", look: "fleuri" }, FILM2)) === 200, "Camille, sur un autre film : « Je réserve aujourd'hui »");
ok((await cage("hugo", { cage: "adore", prenom: "Hugo", look: "denim" })) === 200, "Hugo : « J'adore la vidéo »");
ok((await cage("sans", { cage: "un-jour" })) === 200, "quelqu'un sans prénom : « Je viendrai un jour », sans numéro");

let j = await carnet({ action: "lire" });
ok(j.statut === 200 && j.actif === true && j.lignes?.length === 3, `une ligne par personne, pas celle de l'autre commerce (${j.statut}, ${j.lignes?.length} lignes)`);
let c = ligne(j, "Camille");
ok(c?.cage === "aujourdhui" && c?.films === 2 && c?.look === "fleuri", `Camille : sa dernière cage, et ses deux films (${c?.cage}, ${c?.films})`);
ok(c?.prevenir === true && c?.stop === false, "Camille : à prévenir sur WhatsApp");
ok(!JSON.stringify(j).includes("33612345678") && !JSON.stringify(j).includes("habitant_id"), "ni le numéro, ni l'identifiant de personne dans le carnet");
ok(ligne(j, "Hugo")?.prevenir === false && ligne(j, "")?.cage === "un-jour", "Hugo n'a pas laissé de numéro ; la personne sans prénom est là");

const ref = c.ref;
let p = await carnet({ action: "passage", ref, oui: true });
ok(p.statut === 200 && p.passages === 1 && p.dernierPassage === j.aujourdhui, `un passage aujourd'hui (${p.statut}, ${p.passages}, ${p.dernierPassage})`);
p = await carnet({ action: "passage", ref, oui: true });
ok(p.passages === 1, `noté deux fois le même jour : un seul passage (${p.passages})`);
ok(ligne(await carnet({ action: "lire" }), "Camille")?.passages === 1, "le carnet relu compte le passage");
p = await carnet({ action: "passage", ref, oui: false });
ok(p.statut === 200 && p.passages === 0 && p.dernierPassage === null, `le passage enlevé (${p.passages})`);

p = await carnet({ action: "stop", ref });
ok(p.statut === 200, `Camille a dit stop (${p.statut})`);
c = ligne(await carnet({ action: "lire" }), "Camille");
ok(c?.stop === true && c?.prevenir === false, "Camille : a dit stop, plus à prévenir");
const contacts = await (await fetch(`${F}/clik_contact?site_id=eq.${SITE}`)).json();
ok(contacts.length === 1 && contacts[0].whatsapp === null && !!contacts[0].stop_le, "son numéro est effacé, l'heure du stop gardée");
ok((await cage("camille", { cage: "un-jour", prenom: "Camille", whatsapp: "06 12 34 56 78" })) === 200, "Camille redit oui à la fin d'un film");
c = ligne(await carnet({ action: "lire" }), "Camille");
ok(c?.stop === false && c?.prevenir === true, "le stop est levé : c'est elle qui l'a redit");

ok((await carnet({ action: "lire" }, "mauvais-jeton")).statut === 403, "un mauvais jeton : refusé");
const autre = (await (await fetch(`${F}/clik_cage?site_id=eq.${AUTRE}`)).json())[0];
ok((await carnet({ action: "passage", ref: autre?.id, oui: true })).statut === 404, "la ligne d'un autre commerce : refusée");
ok((await carnet({ action: "stop", ref: "pas-une-ref" })).statut === 404, "une référence qui n'en est pas une : refusée");
ok((await carnet({ action: "effacer", ref })).statut === 400, "une action inconnue : refusée");
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
