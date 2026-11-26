// 💬 LA DISCUSSION D'UNE VIDÉO, PAR LA ROUTE (`lib/direct/discussion-video.ts`, `discussion-video-serveur.ts`, la route
// `/api/direct/discussion-video` ; `docs/univers/discussions-video.md`, le lot A1) — contre le faux Supabase et le faux
// YouTube (jamais la vraie base, jamais Google).
//
// La nuit passe : la même vidéo est à la télé de Léa, Sam, Inès, Jade et Noé. Sans compte : 401 ; une vidéo inconnue :
// 404. Avant : rien de dit, et sa fiche est notée. Sam (proche de Léa) l'a vue et écrit à la seconde ; Inès (une
// inconnue) laisse un mot à la fin. Léa ouvre la discussion : 👯 Sam et ses mots, 🌍 le mot d'Inès ; Inès n'a pas les
// mots de Sam (pas sa proche). Jade (15-17 ans) : sa discussion à elle, sans le mot d'Inès. Noé n'a pas dit son âge :
// 🌍 attend sa réponse, 👯 est là. Une vidéo qui a quitté la télé : ouverte par l'historique (📼 Revoir), ou par sa
// fiche quand on y a dit quelque chose — pas par quelqu'un qui n'y a rien dit. Jamais un compte, jamais le mot
// « exemple ».
import crypto from "node:crypto";

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

// ═══ JAMAIS UN COMPTE, JAMAIS LE MOT « EXEMPLE » ═══
const tout = JSON.stringify(tous);
ok(!GENS.some((x) => tout.includes(x.id)), "jamais un compte dans ce qu'on renvoie");
ok(!/exemple/i.test(tout), "jamais le mot « exemple »");

console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
