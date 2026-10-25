// 📒 LE CARNET DU COMPTOIR, PAR LA ROUTE — contre le faux Supabase, jamais la vraie base.
//
// Trois habitants libèrent leur fantôme à la fin du film d'un commerce (par `api/direct/cage`, comme dans
// l'application), puis ce que `api/site-internet/pro/carnet` doit tenir : une ligne par personne, avec la
// cage libérée en dernier et le nombre de films ; « à prévenir » pour celle qui a laissé son numéro, mais
// jamais le numéro ni l'identifiant de personne ; un passage par jour (noter deux fois compte une fois, et
// on peut l'enlever) ; le stop efface le numéro, et redire oui à la fin d'un film l'annule ; un mauvais
// jeton, une ligne d'un autre commerce, une référence qui n'en est pas une. Puis « Oui, préviens-les » : les numéros
// de ceux qui veulent être prévenus (et d'eux seuls), le message envoyé gardé avec son petit plus, et les règles —
// pas d'alcool offert, pas deux messages le même jour, pas plus de deux par semaine, rien hors de 9 h – 20 h 30. Puis le
// moteur de messages : le merci de Mike dans la Maison de Zoé, sa réponse d'un appui (et seulement la sienne, une fois,
// parmi les choix), le stop et la reprise, « A répondu sur WhatsApp », et le silence après un message sans réponse.
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

// ── 📲 « OUI, PRÉVIENS-LES » (étape 3) ──
ok((await cage("leo", { cage: "un-jour", prenom: "Léo", look: "denim", whatsapp: "07 11 22 33 44" })) === 200, "Léo : « Je viendrai un jour », avec son numéro");
const n = await carnet({ action: "numeros" });
const refs = Object.fromEntries((await carnet({ action: "lire" })).lignes.map((l) => [l.prenom, l.ref]));
const num = Object.fromEntries((n.numeros || []).map((x) => [x.ref, x.whatsapp]));
ok(n.statut === 200 && num[refs.Camille] === "33612345678" && num[refs["Léo"]] === "33711223344" && !num[refs.Hugo] && Object.keys(num).length === 2,
  `les numéros, seulement de ceux qui veulent être prévenus (${JSON.stringify(n.numeros)})`);
const heureParis = new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false }).split(":").map(Number);
const ouvert = heureParis[0] * 60 + heureParis[1] >= 540 && heureParis[0] * 60 + heureParis[1] < 1230;
p = await carnet({ action: "envoye", ref: refs.Camille, texte: "Camille, il reste de la place ce soir. Tu viens à combien ?", plus: "un verre de vin" });
ok(p.statut === 400, `un verre de vin offert : refusé, loi Évin (${p.statut})`);
p = await carnet({ action: "envoye", ref: refs.Camille, texte: "  " });
ok(p.statut === 400, `un message vide : refusé (${p.statut})`);
p = await carnet({ action: "envoye", ref: refs.Hugo, texte: "Hugo, il reste de la place ce soir." });
ok(p.statut === 409, `Hugo n'a pas laissé de numéro : refusé (${p.statut})`);
p = await carnet({ action: "envoye", ref: refs.Camille, texte: "Camille, il reste de la place ce soir. Tu viens à combien ?", plus: "le café" });
if (ouvert) {
  ok(p.statut === 200, `le message de Mike à Camille, gardé (${p.statut} ${p.error || ""})`);
  c = ligne(await carnet({ action: "lire" }), "Camille");
  ok(c?.messages?.length === 1 && c.messages[0].plus === "le café", `le carnet relu : un message, avec son petit plus (${JSON.stringify(c?.messages)})`);
  p = await carnet({ action: "envoye", ref: refs.Camille, texte: "Camille, encore de la place !" });
  ok(p.statut === 409 && /aujourd/.test(p.error), `deux messages le même jour : refusé (${p.statut}, « ${p.error} »)`);
  const hLeo = (await (await fetch(`${F}/clik_cage?site_id=eq.${SITE}&prenom=eq.L%C3%A9o`)).json())[0]?.habitant_id;
  const il = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
  await semer("clik_message", [{ site_id: SITE, habitant_id: hLeo, texte: "un", envoye_le: il(1) }, { site_id: SITE, habitant_id: hLeo, texte: "deux", envoye_le: il(3) }]);
  p = await carnet({ action: "envoye", ref: refs["Léo"], texte: "Léo, il reste de la place ce soir." });
  ok(p.statut === 409 && /semaine/.test(p.error), `un troisième message dans la semaine : refusé (${p.statut}, « ${p.error} »)`);

  // ── 💬 LE MOTEUR DE MESSAGES (étape 4) : Ma Maison, la réponse, le stop, « A répondu », le silence ──
  ok((await cage("zoe", { cage: "adore", prenom: "Zoé", look: "soleil" })) === 200, "Zoé : « J'adore la vidéo », sans numéro");
  const refZoe = ligne(await carnet({ action: "lire" }), "Zoé")?.ref;
  const merci = { action: "maison", ref: refZoe, texte: "Merci Zoé ! Toi, plutôt viande ou poisson ?", modele: "merci", choix: ["Viande", "Poisson"] };
  ok((await carnet({ ...merci, modele: "promo" })).statut === 400, "un modèle qui n'est pas celui de Mike : refusé");
  p = await carnet(merci);
  ok(p.statut === 200, `le merci de Mike, dans la Maison de Zoé (${p.statut} ${p.error || ""})`);
  p = await carnet({ ...merci, modele: "memoire" });
  ok(p.statut === 409, `un second message le même jour : refusé (${p.statut}, « ${p.error} »)`);
  const maison = async (qui, corps) => {
    const r = await fetch(`${BASE}/api/direct/messages`, corps
      ? { method: "POST", headers: { "content-type": "application/json", cookie: cookies[qui] }, body: JSON.stringify(corps) }
      : { headers: { cookie: cookies[qui] } });
    return { statut: r.status, ...(await r.json().catch(() => ({}))) };
  };
  let mm = await maison("zoe");
  ok(mm.messages?.length === 1 && mm.messages[0].commerce.nom === "Le Bistrot du Carnet" && mm.messages[0].choix.join() === "Viande,Poisson" && /visage\.webp$/.test(mm.messages[0].commerce.visage),
    `Zoé le voit dans sa Maison, avec ses deux réponses (${JSON.stringify(mm.messages?.[0])})`);
  ok((await maison("hugo")).messages?.length === 0, "Hugo, lui, n'a rien reçu");
  const idZoe = mm.messages[0].id;
  ok((await maison("hugo", { action: "repondre", id: idZoe, reponse: "Poisson" })).statut === 404, "Hugo ne peut pas répondre à la place de Zoé");
  ok((await maison("zoe", { action: "repondre", id: idZoe, reponse: "Fromage" })).statut === 400, "une réponse qui n'est pas proposée : refusée");
  ok((await maison("zoe", { action: "repondre", id: idZoe, reponse: "Poisson" })).statut === 200, "Zoé répond « Poisson » d'un appui");
  ok((await maison("zoe", { action: "repondre", id: idZoe, reponse: "Viande" })).statut === 409, "une seule réponse");
  c = ligne(await carnet({ action: "lire" }), "Zoé");
  ok(c?.messages?.[0]?.canal === "maison" && c.messages[0].modele === "merci" && c.messages[0].reponse === "Poisson", `sa réponse revient dans le carnet (${JSON.stringify(c?.messages?.[0])})`);
  ok((await maison("zoe", { action: "stop", cle: SLUG })).statut === 200, "Zoé : ne plus recevoir ses messages");
  ok((await maison("zoe")).messages?.[0]?.stop === true && ligne(await carnet({ action: "lire" }), "Zoé")?.stop === true, "le stop, dans sa Maison et dans le carnet");
  p = await carnet({ ...merci, modele: "memoire" });
  ok(p.statut === 409 && /stop/.test(p.error), `un message après son stop : refusé (« ${p.error} »)`);
  ok((await maison("zoe", { action: "reprendre", cle: SLUG })).statut === 200 && ligne(await carnet({ action: "lire" }), "Zoé")?.stop === false, "Zoé reprend ses messages");
  // « A répondu sur WhatsApp » : le message WhatsApp de Camille prend la réponse
  p = await carnet({ action: "repondu", ref: refs.Camille });
  ok(p.statut === 200 && ligne(await carnet({ action: "lire" }), "Camille")?.messages?.[0]?.reponse === "(sur WhatsApp)", `Camille a répondu sur WhatsApp, il le note (${p.statut})`);
  ok((await carnet({ action: "repondu", ref: refs.Camille })).statut === 404, "plus rien n'attend sa réponse : refusé");
  ok((await carnet({ action: "repondu", ref: refZoe })).statut === 404, "Zoé n'a pas de message WhatsApp : refusé");
  // Le silence : un message sans réponse il y a trois jours, rien d'autre cette semaine
  ok((await cage("max", { cage: "un-jour", prenom: "Max", whatsapp: "06 55 44 33 22" })) === 200, "Max laisse son numéro");
  const hMax = (await (await fetch(`${F}/clik_cage?site_id=eq.${SITE}&prenom=eq.Max`)).json())[0]?.habitant_id;
  await semer("clik_message", { site_id: SITE, habitant_id: hMax, texte: "Max, il reste de la place ce soir.", envoye_le: new Date(Date.now() - 3 * 86_400_000).toISOString() });
  const refMax = ligne(await carnet({ action: "lire" }), "Max")?.ref;
  // Sa cage, libérée il y a cinq jours (avant ce message) : sinon une cage plus récente remettrait le silence à zéro.
  await fetch(`${F}/clik_cage?site_id=eq.${SITE}&prenom=eq.Max`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ updated_at: new Date(Date.now() - 5 * 86_400_000).toISOString() }) });
  p = await carnet({ action: "envoye", ref: refMax, texte: "Max, il reste de la place demain soir. Tu viens à combien ?" });
  ok(p.statut === 409 && /semaine prochaine/.test(p.error), `un message sans réponse il y a trois jours : Mike attend (${p.statut}, « ${p.error} »)`);
} else {
  ok(p.statut === 409, `hors des heures (9 h – 20 h 30) : refusé (${p.statut}, « ${p.error} »)`);
  console.log("  (hors des heures d'envoi : l'envoi accepté, le même jour et la semaine ne sont pas vérifiés)");
}

ok((await carnet({ action: "lire" }, "mauvais-jeton")).statut === 403, "un mauvais jeton : refusé");
const autre = (await (await fetch(`${F}/clik_cage?site_id=eq.${AUTRE}`)).json())[0];
ok((await carnet({ action: "passage", ref: autre?.id, oui: true })).statut === 404, "la ligne d'un autre commerce : refusée");
ok((await carnet({ action: "stop", ref: "pas-une-ref" })).statut === 404, "une référence qui n'en est pas une : refusée");
ok((await carnet({ action: "effacer", ref })).statut === 400, "une action inconnue : refusée");
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
