// 💬 LA DISCUSSION D'UNE VIDÉO, PAR LA ROUTE (`lib/direct/discussion-video.ts`, `discussion-video-serveur.ts`, la route
// `/api/direct/discussion-video` ; `docs/univers/discussions-video.md`, le lot A1) — contre le faux Supabase et le faux
// YouTube (jamais la vraie base, jamais Google).
//
// La nuit passe : la même vidéo est à la télé de Léa, Sam, Inès, Jade et Noé. Sans compte : 401 ; une vidéo inconnue :
// 404. Avant : rien de dit, et sa fiche est notée. Sam (proche de Léa) l'a vue et écrit à la seconde ; Inès (une
// inconnue) laisse un mot à la fin. Léa ouvre la discussion : 👯 Sam et ses mots, 🌍 le mot d'Inès ; Inès n'a pas les
// mots de Sam (pas sa proche). Jade (15-17 ans) : sa discussion à elle, sans le mot d'Inès. Noé n'a pas dit son âge :
// 🌍 attend sa réponse, 👯 est là. Une vidéo qui a quitté la télé : ouverte par l'historique (📼 Revoir), ou par sa
// fiche quand on y a dit quelque chose — pas par quelqu'un qui n'y a rien dit. (Lot A2) Les mots écrits sous la
// vidéo : l'accord, la modération, 90 signes, un toutes les trois secondes ; Léa écrit, Inès répond à son mot écrit,
// Léa répond au mot dit d'Inès ; le fil dans l'ordre ; écrit depuis un salon ouvert (« vu dans le salon … ») ; Jade ne
// voit rien des adultes ; signaler (plus chez moi ; à trois, chez personne ; l'administrateur) ; effacer le sien.
// (Lot A3) Suivre : les niveaux de départ (Sam prévenu entre proches ; Inès et Léa sans bruit en 🌍 après avoir parlé ;
// Jade, rien), la première publication le dit, choisir 🔔 / 🔕 (l'index des suiveurs suit), « lu » avant.
// (Lot A4) Activité : Inès répond à Sam (↩ en haut, chez Sam ; rien chez Léa, qui ne suit plus) ; la cloche compte les
// discussions qui ont du nouveau ; ouvrir la discussion, ou « Tout marquer lu », la remet à zéro ; Jade n'a rien des
// adultes ; un événement de plus de trente jours s'efface ; sans compte : 401. (Lot A5) Le téléphone : « ↩ Inès t'a
// répondu » sonne ; la suite attend la vague (deux heures) ; puis « 💬 … nouveaux mots » ; l'interrupteur « Les discussions
// que je suis » coupé : rien ; Jade (15-17 ans) l'a éteint d'office ; la nuit (22 h à 9 h) : rien.
// Jamais un compte, jamais le mot « exemple ».
import crypto from "node:crypto";
import { recus, telephone } from "./navigateur/commun.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const json = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `3070d0e0-0000-4000-8000-0000000d15${String(n).padStart(2, "0")}`, jeton: `jeton-discussion-video-route-0${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const INES = qui(3, "Inès");
const JADE = qui(4, "Jade");
const NOE = qui(5, "Noé");
const GENS = [LEA, SAM, INES, JADE, NOE];
for (const x of GENS) x.q = qui8(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
  if (x !== NOE) await json(`${x.id}/majeur.json`, { age: x === JADE ? 16 : 30, adulte: x !== JADE, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot"], poids: {}, le: maintenant });
}
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });

const tous = [];
const garder = (r) => (tous.push(r), r);
const avec = (x) => (x ? { cookie: `clikme_habitant=${x.jeton}` } : {});
const ouvrir = async (x, video) => {
  const r = await fetch(`${BASE}/api/direct/discussion-video?video=${encodeURIComponent(video)}`, { headers: avec(x) });
  return garder({ statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) });
};
const poster = async (x, route, corps) => {
  const r = await fetch(`${BASE}/api/direct/${route}`, { method: "POST", headers: { "content-type": "application/json", ...avec(x) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const VOIX = () => Buffer.concat([Buffer.from("1a45dfa39f4286810142f7810142f2810442f381084282847765626d", "hex"), crypto.randomBytes(4000)]);
const enData = (o) => `data:audio/webm;base64,${o.toString("base64")}`;

// ═══ LA NUIT PASSE : LA MÊME VIDÉO EST À LEUR TÉLÉ ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(Array.isArray(nuit.faites) && nuit.faites.length > 0, "la nuit est passée");
const tele = await (await fetch(`${BASE}/api/direct/tele-du-jour`, { headers: avec(LEA) })).json();
const V = tele.tele?.videos?.[0]?.id;
const TITRE = tele.tele?.videos?.[0]?.titre;
ok(Boolean(V && TITRE), `la première vidéo de Léa (${V} : « ${TITRE} »)`);

// ═══ SANS COMPTE, UNE VIDÉO INCONNUE ═══
ok((await ouvrir(null, V)).statut === 401, "sans compte : 401");
ok((await ouvrir(LEA, "AAAAAAAAAAA")).statut === 404, "une vidéo qu'elle n'a jamais croisée : 404");
ok((await ouvrir(LEA, "pas-une-video")).statut === 404, "un identifiant qui n'en est pas un : 404");

// ═══ AVANT : RIEN DE DIT ═══
const l0 = await ouvrir(LEA, V);
ok(l0.statut === 200 && l0.discussion?.video?.id === V && l0.discussion.video.titre === TITRE, "Léa ouvre la discussion de sa vidéo : son titre");
ok(l0.discussion?.aMaTele === true && l0.discussion.vue === false, "… elle est à sa télé, elle ne l'a pas encore vue");
ok(Array.isArray(l0.discussion?.proches) && l0.discussion.proches.length === 0 && l0.discussion.tous?.mots?.length === 0, "… personne n'a encore rien dit (ni ses proches, ni les autres)");
ok((await lire(`videos/${V}.json`))?.titre === TITRE, "sa fiche est notée (`videos/<id>.json`, son titre)");

// ═══ SAM ÉCRIT À LA SECONDE, INÈS LAISSE UN MOT ═══
ok((await poster(SAM, "tele-du-jour", { action: "vue", id: V, fin: true, secondes: 30 })).statut === 200, "Sam l'a vue");
ok((await poster(SAM, "tele-du-jour", { action: "ecrire", id: V, t: 8, texte: "Il va tirer de là ?!" })).statut === 200, "… il écrit à 0:08");
ok((await poster(INES, "mots-video", { action: "publier", id: V, son: enData(VOIX()), duree: 3, accord: true })).statut === 200, "Inès (une inconnue) laisse un mot à la fin");
ok((await lire(`videos/${V}.json`))?.titre === TITRE, "… la fiche de la vidéo est là");

// ═══ LÉA OUVRE LA DISCUSSION ═══
const l1 = await ouvrir(LEA, V);
const sam = (l1.discussion?.proches ?? []).find((p) => p.prenom === "Sam");
ok(Boolean(sam) && sam.reactions.some((r) => r.texte === "Il va tirer de là ?!" && r.t === 8), "👯 Sam et ses mots, à 0:08");
const motsL = (l1.discussion?.tous?.mots ?? []).map((m) => m.prenom);
ok(motsL.length === 1 && motsL[0] === "Inès" && l1.discussion.tous.tranche === "adultes", `🌍 le mot d'Inès (${motsL.join(", ")})`);
const motI = l1.discussion?.tous?.mots?.[0];
ok(motI?.proche === false && motI.moi === false && motI.duree === 3 && Boolean(motI.src), "… pas sa proche, 3 s, son son");

// ═══ INÈS : PAS LES MOTS DE SAM ═══
const i1 = await ouvrir(INES, V);
ok(i1.statut === 200 && i1.discussion?.proches?.length === 0, "Inès n'a pas les mots de Sam (pas sa proche)");
ok(i1.discussion?.tous?.mots?.[0]?.moi === true, "… elle voit le sien, « Toi »");

// ═══ JADE (15-17 ANS), NOÉ (SANS ÂGE) ═══
const j1 = await ouvrir(JADE, V);
ok(j1.statut === 200 && j1.discussion?.tous?.tranche === "jeunes" && j1.discussion.tous.mots.length === 0, "Jade (15-17 ans) : sa discussion à elle, sans le mot d'Inès");
const n1 = await ouvrir(NOE, V);
ok(n1.statut === 200 && n1.discussion?.tous === null && Array.isArray(n1.discussion?.proches), "Noé n'a pas dit son âge : 🌍 attend sa réponse, le reste est là");

// ═══ UNE VIDÉO QUI A QUITTÉ LA TÉLÉ ═══
const VIEILLE = "CCCCCCCCCCC";
await json(`${INES.id}/tele-historique.json`, { liste: [{ id: VIEILLE, titre: "La finale de 2006", chaine: "Foot rétro", duree: 600, le: Date.now() - 3 * 86_400_000 }] });
const i2 = await ouvrir(INES, VIEILLE);
ok(i2.statut === 200 && i2.discussion?.video?.titre === "La finale de 2006" && i2.discussion.aMaTele === false, "📼 dans l'historique d'Inès : elle rouvre sa discussion (plus à sa télé)");
ok((await ouvrir(SAM, VIEILLE)).statut === 404, "… Sam, qui ne l'a jamais vue : 404");
const ANCIENNE = "DDDDDDDDDDD";
await json(`videos/${ANCIENNE}.json`, { id: ANCIENNE, titre: "Le but du siècle", chaine: "Foot rétro", duree: 120 });
await json(`decouvrir/reactions/${ANCIENNE}/${SAM.q}.json`, { vu: Date.now() - 5 * 86_400_000, reactions: [{ t: 4, sorte: "rire", source: "rangee", le: Date.now() - 5 * 86_400_000, texte: "mdr" }] });
const s2 = await ouvrir(SAM, ANCIENNE);
ok(s2.statut === 200 && s2.discussion?.video?.titre === "Le but du siècle", "Sam y avait réagi il y a cinq jours : sa fiche la rouvre");
ok((s2.discussion?.miennes ?? []).some((r) => r.texte === "mdr"), "… avec ce qu'il y avait dit");
ok((await ouvrir(LEA, ANCIENNE)).statut === 404, "… Léa, qui n'y a rien dit : 404");

// ═══ (A2) ✍️ LES MOTS ÉCRITS SOUS LA VIDÉO ═══
const ecrire = (x, corps) => poster(x, "discussion-video", corps);
ok((await ecrire(null, { action: "publier", id: V, texte: "Coucou", accord: true })).statut === 401, "écrire sans compte : 401");
ok((await ecrire(LEA, { action: "publier", id: V, texte: "Son meilleur album reste le premier." })).statut === 400, "sans l'accord : refusé");
const lien = await ecrire(LEA, { action: "publier", id: V, texte: "allez voir www.monsite.fr", accord: true });
ok(lien.statut === 400 && Boolean(lien.refus), `un lien : refusé (« ${lien.error} »)`);
ok((await ecrire(LEA, { action: "publier", id: "AAAAAAAAAAA", texte: "Coucou", accord: true })).statut === 404, "une vidéo jamais croisée : 404");
ok((await ecrire(NOE, { action: "publier", id: V, texte: "Coucou", accord: true })).age === true, "Noé, sans âge : « as-tu 18 ans ? »");
const e1 = await ecrire(LEA, { action: "publier", id: V, texte: "Son meilleur album reste le premier.", accord: true });
ok(e1.statut === 200 && e1.ecrit?.texte === "Son meilleur album reste le premier." && e1.ecrit.moi === true, "Léa écrit sous la vidéo");
ok((await ecrire(LEA, { action: "publier", id: V, texte: "Et le deuxième aussi.", accord: true })).statut === 429, "… pas deux en trois secondes");
const long = await ecrire(INES, { action: "publier", id: V, texte: "a".repeat(120), accord: true });
ok(long.statut === 400, "plus de 90 signes : refusé");
ok((await ecrire(INES, { action: "publier", id: V, texte: "Pas d’accord", repond: "1700000000000-zzzzzzzz-abcdef", accord: true })).statut === 404, "répondre à un mot qui n'est pas là : 404");
const e2 = await ecrire(INES, { action: "publier", id: V, texte: "Pas d’accord, le dernier est bien plus abouti.", repond: e1.ecrit?.id, accord: true });
ok(e2.statut === 200 && e2.ecrit?.repond?.prenom === "Léa", "Inès répond au mot écrit de Léa");
await new Promise((r) => setTimeout(r, 3100));
const e3 = await ecrire(LEA, { action: "publier", id: V, texte: "Ta voix est trop drôle", repond: `mot:${INES.q}`, accord: true });
ok(e3.statut === 200 && e3.ecrit?.repond?.prenom === "Inès" && e3.ecrit.repond.id === `mot:${INES.q}`, "Léa répond par écrit au mot dit d'Inès");
const salonFoot = "foot-1";
await json(`decouvrir/salons/adultes/${salonFoot}/presents/${SAM.q}.json`, { q: SAM.q, prenom: "Sam", place: 0 });
const e4 = await ecrire(SAM, { action: "publier", id: V, texte: "Quel but !", accord: true, salon: salonFoot });
ok(e4.statut === 200 && /salon du foot/.test(e4.ecrit?.de ?? ""), `écrit depuis le salon ouvert où il est assis : « ${e4.ecrit?.de} »`);
const l2 = await ouvrir(LEA, V);
const ecritsL = (l2.discussion?.ecrits ?? []).map((e) => e.texte);
ok(ecritsL.length === 4, `Léa voit les quatre mots écrits (${ecritsL.length})`);
ok(l2.discussion?.ecrits?.find((e) => e.q === SAM.q)?.proche === true && l2.discussion.ecrits.find((e) => e.q === INES.q)?.proche === false, "… Sam, son proche ; Inès, non");
ok((await ouvrir(JADE, V)).discussion?.ecrits?.length === 0, "Jade (15-17 ans) : aucun mot écrit des adultes");
ok(Boolean(await lire(`decouvrir/ecrits/adultes/${V}/${e1.ecrit?.id}.json`)), "rangé : un fichier par mot écrit");
// (signaler)
ok((await ecrire(LEA, { action: "signaler", id: V, ecrit: e1.ecrit?.id })).statut === 400, "signaler le sien : 400");
const sg = await ecrire(LEA, { action: "signaler", id: V, ecrit: e4.ecrit?.id });
ok(sg.statut === 200 && sg.cache === false, "Léa signale le mot de Sam");
ok(!(await ouvrir(LEA, V)).discussion?.ecrits?.some((e) => e.id === e4.ecrit?.id), "… il ne passe plus chez elle");
ok((await ouvrir(INES, V)).discussion?.ecrits?.some((e) => e.id === e4.ecrit?.id), "… toujours chez Inès");
await ecrire(INES, { action: "signaler", id: V, ecrit: e4.ecrit?.id });
const sg3 = await ecrire(NOE, { action: "signaler", id: V, ecrit: e4.ecrit?.id });
ok(sg3.age === true, "Noé, sans âge, ne signale pas");
await poster(NOE, "mots-video", { action: "age", adulte: true });
ok((await ecrire(NOE, { action: "signaler", id: V, ecrit: e4.ecrit?.id })).cache === true, "signalé par trois personnes : caché pour tous");
ok((await ouvrir(SAM, V)).discussion?.ecrits?.some((e) => e.id === e4.ecrit?.id), "… sauf pour Sam, son auteur");
ok(!(await ouvrir(INES, V)).discussion?.ecrits?.some((e) => e.id === e4.ecrit?.id), "… plus chez Inès");
const admin = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: `decouvrir/signalements/${SAM.q}`, limit: 10 }) }).then((r) => r.json()).catch(() => []);
ok(Array.isArray(admin) && admin.length === 3, `l'administrateur le voit (${Array.isArray(admin) ? admin.length : "?"} signalements)`);
// (effacer)
ok((await ecrire(INES, { action: "effacer", id: V, ecrit: e1.ecrit?.id })).statut === 400, "effacer celui d'un autre : 400");
ok((await ecrire(LEA, { action: "effacer", id: V, ecrit: e1.ecrit?.id })).statut === 200, "Léa efface son premier mot");
const l3 = await ouvrir(INES, V);
ok(!l3.discussion?.ecrits?.some((e) => e.id === e1.ecrit?.id), "… il est parti, partout");
const repI = l3.discussion?.ecrits?.find((e) => e.id === e2.ecrit?.id);
ok(Boolean(repI) && !repI.repond, "… la réponse d'Inès reste, seule");

// ═══ (A3) 🔔 SUIVRE ═══
ok(e1.premiere === true && e3.premiere === false, "la première publication de Léa le dit (l'écran propose d'être prévenue) ; pas la suivante");
const sv = await ouvrir(SAM, V);
ok(sv.discussion?.suivi?.proches === "prevenir", `Sam l'a vue et y a écrit : 👯 prévenu (${sv.discussion?.suivi?.proches})`);
const iv = await ouvrir(INES, V);
ok(iv.discussion?.suivi?.tous === "discret", `Inès a laissé un mot : 🌍 sans bruit (${iv.discussion?.suivi?.tous})`);
ok((await lire(`discussions/tous/adultes/${V}/suiveurs/${INES.q}.json`))?.niveau === "discret", "… elle est dans l'index des suiveurs");
const jv = await ouvrir(JADE, V);
ok(jv.discussion?.suivi?.tous === "non" && jv.discussion.suivi.proches === "non", "Jade n'y a rien fait : pas suivie");
const lv = await ouvrir(LEA, V);
ok(lv.discussion?.suivi?.tous === "discret" && lv.discussion.luAvant?.tous > 0, "Léa : 🌍 sans bruit, et quand elle l'avait lue");
ok((await ecrire(LEA, { action: "suivre", id: V, cercle: "tous", niveau: "fort" })).statut === 400, "un niveau inconnu : 400");
ok((await ecrire(LEA, { action: "suivre", id: "AAAAAAAAAAA", cercle: "tous", niveau: "prevenir" })).statut === 404, "une discussion qu'elle ne peut pas ouvrir : 404");
ok((await ecrire(LEA, { action: "suivre", id: V, cercle: "tous", niveau: "prevenir" })).niveau === "prevenir", "Léa choisit 🔔 Me prévenir");
ok((await ouvrir(LEA, V)).discussion?.suivi?.tous === "prevenir" && (await lire(`discussions/tous/adultes/${V}/suiveurs/${LEA.q}.json`))?.niveau === "prevenir", "… c'est retenu, et l'index suit");
ok((await ecrire(LEA, { action: "suivre", id: V, cercle: "tous", niveau: "non" })).niveau === "non", "… puis 🔕 Ne plus suivre");
ok((await lire(`discussions/tous/adultes/${V}/suiveurs/${LEA.q}.json`)) === null, "… elle sort de l'index");
await new Promise((r) => setTimeout(r, 3100));
ok((await ecrire(LEA, { action: "publier", id: V, texte: "Bon, je reviens quand même", accord: true })).premiere === false, "elle reparle : son choix tient (pas de nouvelle question)");
ok((await ouvrir(LEA, V)).discussion?.suivi?.tous === "non", "… toujours 🔕");
ok((await ecrire(SAM, { action: "suivre", id: V, cercle: "proches", niveau: "discret" })).niveau === "discret" && (await ouvrir(SAM, V)).discussion?.suivi?.proches === "discret", "Sam passe ses proches 🤫 sans bruit");

// ═══ (A4) 🛎️ ACTIVITÉ ═══
const activite = async (x, compter) => {
  const r = await fetch(`${BASE}/api/direct/activite${compter ? "?compter=1" : ""}`, { headers: avec(x) });
  return garder({ statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) });
};
const CLE = `tous:${V}`;
ok((await activite(null)).statut === 401, "Activité sans compte : 401");
const VIEUX = `${Date.now() - 31 * 24 * 3600_000}.tous.${V}.${INES.q}.n.abcd.json`;
await json(`${SAM.id}/activite/${VIEUX}`, { prenom: "Inès", titre: TITRE, texte: "il y a longtemps" });
ok((await activite(SAM, true)).nouveau === 0, `Sam a tout lu : la cloche est à zéro`);
await new Promise((r) => setTimeout(r, 3100));
const rep = await ecrire(INES, { action: "publier", id: V, texte: "Oui, quel but !", repond: e4.ecrit?.id, accord: true });
ok(Boolean(rep.ecrit), "Inès répond au mot de Sam");
ok((await activite(SAM, true)).nouveau === 1, "la cloche de Sam : 1");
const as1 = await activite(SAM);
const ligneS = as1.lignes?.[0];
ok(ligneS?.cle === CLE && ligneS.neuf && ligneS.reponse?.prenom === "Inès" && ligneS.reponse.texte === "Oui, quel but !", `en haut chez Sam : « ↩ Inès t'a répondu » et sa phrase (${JSON.stringify(ligneS)})`);
ok(ligneS?.titre === TITRE && ligneS.cercle === "tous", "… avec le titre de la vidéo et son cercle");
ok(!(await lire(`${SAM.id}/activite/${VIEUX}`)), "un événement de plus de trente jours s'efface");
const al = await activite(LEA);
ok(!(al.lignes ?? []).some((x) => x.cle === CLE && x.neuf), "rien de neuf chez Léa : elle ne suit plus (🔕), et on ne lui a pas répondu");
ok(!((await activite(JADE)).lignes ?? []).some((x) => x.video === V && x.cercle === "tous"), "Jade (15-17 ans) n'a rien des adultes");
const listeI = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: `${INES.id}/activite`, limit: 100 }) }).then((r) => r.json()).catch(() => []);
ok(Array.isArray(listeI) && listeI.length > 0 && !listeI.some((f) => String(f.name).includes(`.${INES.q}.`)), `Inès a de l'activité, jamais pour ses propres mots (${Array.isArray(listeI) ? listeI.length : "?"})`);
await ouvrir(SAM, V);
ok((await activite(SAM, true)).nouveau === 0 && (await activite(SAM)).lignes?.find((x) => x.cle === CLE)?.neuf === false, "Sam ouvre la discussion : la ligne passe dans « Déjà vu »");
await new Promise((r) => setTimeout(r, 3100));
await ecrire(INES, { action: "publier", id: V, texte: "Et la passe avant !", accord: true });
const as2 = await activite(SAM);
ok(as2.nouveau === 1 && as2.lignes?.[0]?.cle === CLE && !as2.lignes[0].reponse && as2.lignes[0].dernier?.texte === "Et la passe avant !", "Inès reparle (sans lui répondre) : Sam la suit, c'est du nouveau");
ok((await poster(SAM, "activite", { action: "lu" })).ok === true && (await activite(SAM, true)).nouveau === 0, "« Tout marquer lu » : la cloche est à zéro");
ok((await poster(SAM, "activite", { action: "tout" })).statut === 400, "une demande inconnue : 400");

// ═══ (A5) 📱 LE TÉLÉPHONE ═══
const nuitParis = (() => {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", hour: "2-digit" }).format(Date.now()));
  return h >= 22 || h < 9;
})();
const telLea = telephone("lea-discussion");
const telJade = telephone("jade-discussion");
await json(`notif/abonnes/${LEA.id}.json`, { h: LEA.id, ville: "dax", abonnements: [telLea.abonnement], le: new Date().toISOString() });
await json(`notif/abonnes/${JADE.id}.json`, { h: JADE.id, ville: "dax", abonnements: [telJade.abonnement], le: new Date().toISOString() });
const etatL = await poster(LEA, "ma-figurine", { action: "notif-etat" });
ok(etatL.discussions?.repondu === true && etatL.discussions.proches === true && etatL.discussions.suivies === true, `les trois interrupteurs de Léa, allumés (${JSON.stringify(etatL.discussions)})`);
ok((await poster(JADE, "ma-figurine", { action: "notif-etat" })).discussions?.suivies === false, "Jade (15-17 ans) : « Les discussions que je suis » éteint d'office");
ok((await poster(LEA, "ma-figurine", { action: "notif-discussions", genre: "tout", oui: false })).statut === 400, "un interrupteur inconnu : 400");
ok((await ecrire(LEA, { action: "suivre", id: V, cercle: "tous", niveau: "prevenir" })).niveau === "prevenir", "Léa suit de nouveau, 🔔");
// (elle n'est pas dans la discussion : sa dernière lecture date de dix minutes)
const suivisL = await lire(`${LEA.id}/suivis-videos.json`);
for (const x of Object.values(suivisL?.suivis ?? {})) x.lu = Date.now() - 10 * 60_000;
await json(`${LEA.id}/suivis-videos.json`, suivisL);
const deL = ((await ouvrir(INES, V)).discussion?.ecrits ?? []).find((e) => e.prenom === "Léa" && /je reviens/.test(e.texte));
ok(Boolean(deL), "le mot de Léa est là");
const pause = () => new Promise((r) => setTimeout(r, 3100));
const sonneries = async () => (await recus(telLea)).filter((n) => String(n.tag ?? "").startsWith("discussion-"));
await pause();
await ecrire(INES, { action: "publier", id: V, texte: "Contente que tu reviennes", repond: deL?.id, accord: true });
const vague = `${LEA.id}/vagues/tous.${V}.json`;
// (deux heures plus tard : sa vague est passée)
const effacerVague = () => fetch(`${STOCK}/figurines-clients`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefixes: [vague] }) });
if (nuitParis) {
  ok((await sonneries()).length === 0 && !(await lire(vague)), "la nuit (22 h à 9 h) : le téléphone de Léa ne sonne pas");
} else {
  const r1 = await sonneries();
  ok(r1.length === 1 && r1[0].title === "↩ Inès t’a répondu" && /« Contente que tu reviennes »/.test(r1[0].body) && r1[0].tag === `discussion-tous-${V}` && r1[0].url === `/univers/discussion?video=${V}&cercle=tous`, `« ↩ Inès t'a répondu » sonne (${JSON.stringify(r1[0])})`);
  await pause();
  await ecrire(INES, { action: "publier", id: V, texte: "Et toi Léa ?", accord: true });
  ok((await sonneries()).length === 1, "la suite attend : une vague toutes les deux heures");
  await effacerVague();
  await pause();
  await ecrire(INES, { action: "publier", id: V, texte: "Bon, à plus", accord: true });
  const r2 = await sonneries();
  ok(r2.length === 2 && /^💬 \d+ nouveaux mots sur « /.test(r2[1].title) && r2[1].body === "Inès : « Bon, à plus »" && r2[1].tag === r1[0].tag, `deux heures plus tard : « ${r2[1]?.title} » (${r2[1]?.body}), qui remplace la précédente`);
  ok((await poster(LEA, "ma-figurine", { action: "notif-discussions", genre: "suivies", oui: false })).discussions?.suivies === false, "Léa coupe « Les discussions que je suis »");
  await effacerVague();
  await pause();
  await ecrire(INES, { action: "publier", id: V, texte: "Encore un mot", accord: true });
  ok((await sonneries()).length === 2, "… plus rien sur son téléphone (Activité le garde)");
  ok(((await activite(LEA)).lignes ?? []).find((x) => x.cle === CLE)?.neuf === true, "… et sa ligne d'Activité est « Nouveau »");
}

// ═══ JAMAIS UN COMPTE, JAMAIS LE MOT « EXEMPLE » ═══
const tout = JSON.stringify(tous);
ok(!GENS.some((x) => tout.includes(x.id)), "jamais un compte dans ce qu'on renvoie");
ok(!/exemple/i.test(tout), "jamais le mot « exemple »");

console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
