// 🗑️ MON COMPTE, PAR LES ROUTES — l'audit UX du 28 novembre 2026, lot 5 (`lib/direct/supprimer-compte-serveur.ts`,
// `app/api/direct/mon-compte`, `app/api/cron/comptes-supprimes`), contre le faux Supabase, jamais la vraie base.
//
// Léa supprime son compte. Hugo est son proche (leur conversation, ses listes), Zoé ne la connaît pas. Sans la case
// cochée : rien. Avec : tout de suite, son dossier, son lien de proche, leur conversation, ses lignes et son compte
// partent ; Hugo ne l'a plus dans ses proches, et voit « Léa a supprimé son compte » ; le cookie part. Puis le balayage
// (juste après, et la nuit) : ses mots sous une vidéo, son passage dans un salon, sa place dans un groupe, sa figurine
// posée « Autour », ses moments (lus : `h`) et son compte du jour — tout ce qui est à Zoé reste, et son témoin part.
// « Se déconnecter » : le cookie part, le compte reste.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-mon-compte-route.mjs
import { createHash } from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const FIGS = "figurines-clients";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lignes = async (t) => (await (await fetch(`${F}/${t}`)).json()) ?? [];
const deposer = (chemin, corps = "x", type = "application/octet-stream") => fetch(`${STOCK}/${FIGS}/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const existe = async (chemin) => (await fetch(`${STOCK}/${FIGS}/${chemin}`)).status === 200;
const lire = async (chemin) => (await fetch(`${STOCK}/${FIGS}/${chemin}`)).json().catch(() => ({}));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const cleProfil = (h) => createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const pair = (a, b) => [a, b].sort().join("_");

const LEA = { id: "5e1e7e00-0000-4000-8000-000000000a01", jeton: "jeton-mon-compte-lea-00001", prenom: "Léa" };
const HUGO = { id: "5e1e7e00-0000-4000-8000-000000000a02", jeton: "jeton-mon-compte-hugo-0001", prenom: "Hugo" };
const ZOE = { id: "5e1e7e00-0000-4000-8000-000000000a03", jeton: "jeton-mon-compte-zoe-00001", prenom: "Zoé" };
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, HUGO, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", [LEA, ZOE].map((x) => ({ habitant_id: x.id, prenom: x.prenom, neutre: `${x.id}/neutre.webp`, parle: `${x.id}/neutre.webp`, prete_le: maintenant })));
await semer("clik_voeu", [{ id: "voeumoncompte1", habitant_id: LEA.id, texte: "Voir la mer" }]);

const qL = qui8(LEA.id);
const qZ = qui8(ZOE.id);
// (ses fichiers, ceux de Hugo et de Zoé, et ce qu'ils partagent)
const sesFichiers = [`${LEA.id}/photo.jpg`, `${LEA.id}/perso/v1/assise.png`, `${LEA.id}/humeur.json`, `profils/${cleProfil(LEA.id)}.json`, `fils/${pair(LEA.id, HUGO.id)}/m/0000000000001-${qL}-aaaaaaaaaaaa.json`];
const partages = [
  `decouvrir/mots/t1/videoessai1/${qL}.json`,
  `decouvrir/mots/t1/videoessai1/son/${qL}-1700000000000.webm`,
  `decouvrir/ecrits/t1/videoessai1/1700000000000-${qL}-x1.json`,
  `decouvrir/salons-vus/m1/videoessai1/${qL}.json`,
  `groupes/places/g1/${qL}.json`,
  `autour/dax/lieu1/1.a.${LEA.id}.json`,
  "moments/m0001.png",
  "moments/m0001-figurine.png",
  `moments/par/${LEA.id}.json`,
];
const aZoe = [`${ZOE.id}/photo.jpg`, `profils/${cleProfil(ZOE.id)}.json`, `decouvrir/mots/t1/videoessai1/${qZ}.json`, `decouvrir/salons-vus/m1/videoessai1/${qZ}.json`, `groupes/places/g1/${qZ}.json`, "moments/m0002.png"];
for (const c of [...sesFichiers, ...partages, ...aZoe, `${HUGO.id}/photo.jpg`]) await deposer(c);
await json("moments/m0001.json", { id: "m0001", h: LEA.id });
await json("moments/m0002.json", { id: "m0002", h: ZOE.id });
await json(`profils/${cleProfil(HUGO.id)}.json`, { h: HUGO.id });
await json(`${LEA.id}/proches.json`, { ids: [HUGO.id] });
await json(`${HUGO.id}/proches.json`, { ids: [LEA.id] });
await json(`${HUGO.id}/ajoute-par.json`, { ids: [LEA.id] });

const ROUTE = `${BASE}/api/direct/mon-compte`;
const poster = async (corps, jeton) => {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, cookie: r.headers.get("set-cookie") ?? "", ...(await r.json().catch(() => ({}))) };
};

// ═══ SANS LA CASE COCHÉE : rien ═══
const r0 = await poster({ action: "supprimer" }, LEA.jeton);
ok(r0.statut === 400 && /définitif/.test(r0.error ?? ""), `sans « Je comprends que c’est définitif » : refusé (${r0.statut})`);
ok((await existe(`${LEA.id}/photo.jpg`)) && (await lignes("human_habitants")).some((x) => x.id === LEA.id), "… et rien n'est parti");
ok((await poster({ action: "supprimer", confirme: true }, "jeton-inconnu-0000000000")).statut === 401, "sans compte sur ce téléphone : 401");

// ═══ « SE DÉCONNECTER » : le cookie part, le compte reste ═══
const d = await poster({ action: "deconnecter" }, ZOE.jeton);
ok(d.statut === 200 && d.ok && /clikme_habitant=;|clikme_habitant=.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i.test(d.cookie), `« Se déconnecter » : le cookie part (${d.cookie.slice(0, 80)})`);
ok((await lignes("human_habitants")).some((x) => x.id === ZOE.id) && (await existe(`${ZOE.id}/photo.jpg`)), "… et son compte reste");

// ═══ SUPPRIMER : TOUT DE SUITE ═══
const r = await poster({ action: "supprimer", confirme: true }, LEA.jeton);
ok(r.statut === 200 && r.ok && r.proches === 1, `« Supprimer mon compte » : fait (${r.fichiers} fichiers, ${r.lignes} lignes, ${r.proches} proche)`);
ok(/clikme_habitant=;|clikme_habitant=.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i.test(r.cookie), "… le cookie part");
const restants = [];
for (const c of sesFichiers) if (await existe(c)) restants.push(c);
ok(restants.length === 0, `son dossier, son lien de proche, leur conversation : partis${restants.length ? ` (reste : ${restants.join(", ")})` : ""}`);
ok(!(await lignes("human_habitants")).some((x) => x.id === LEA.id) && !(await lignes("clik_ma_figurine")).some((x) => x.habitant_id === LEA.id) && !(await lignes("clik_voeu")).some((x) => x.habitant_id === LEA.id), "son compte, sa figurine, son vœu : partis de la base");
ok((await lignes("human_habitants")).some((x) => x.id === HUGO.id) && (await lignes("clik_ma_figurine")).some((x) => x.habitant_id === ZOE.id), "… les comptes de Hugo et de Zoé restent");
const prochesHugo = await lire(`${HUGO.id}/proches.json`);
const ajouteHugo = await lire(`${HUGO.id}/ajoute-par.json`);
ok(!(prochesHugo.ids ?? []).includes(LEA.id) && !(ajouteHugo.ids ?? []).includes(LEA.id), "Hugo ne l'a plus dans ses proches");
const avis = await lire(`${HUGO.id}/comptes-supprimes.json`);
ok((avis.l ?? []).some((x) => x.prenom === "Léa"), "… et garde « Léa a supprimé son compte »");
const gp = await (await fetch(`${BASE}/api/direct/proches`, { headers: { cookie: `clikme_habitant=${HUGO.jeton}` } })).json().catch(() => ({}));
ok((gp.supprimes ?? []).some((x) => x.prenom === "Léa"), `… que sa liste de proches lui dit (${JSON.stringify(gp.supprimes ?? null)})`);
ok(await existe(`${HUGO.id}/photo.jpg`), "les fichiers de Hugo restent");

// ═══ LE BALAYAGE (juste après la réponse ; la nuit, la suite) ═══
await new Promise((ok) => setTimeout(ok, 1500));
const secret = process.env.CRON_SECRET ? `?secret=${encodeURIComponent(process.env.CRON_SECRET)}` : "";
const c = await (await fetch(`${BASE}/api/cron/comptes-supprimes${secret}`)).json().catch(() => ({}));
ok(c.ok === true && (c.reste ?? 0) === 0, `la tâche de nuit passe (${JSON.stringify(c)})`);
const partagesRestants = [];
for (const x of [...partages, "moments/m0001.json"]) if (await existe(x)) partagesRestants.push(x);
ok(partagesRestants.length === 0, `ses mots, ses écrits, son passage au salon, sa place de groupe, sa figurine posée, ses moments : partis${partagesRestants.length ? ` (reste : ${partagesRestants.join(", ")})` : ""}`);
const zoeRestants = [];
for (const x of [...aZoe, "moments/m0002.json"]) if (!(await existe(x))) zoeRestants.push(x);
ok(zoeRestants.length === 0, `tout ce qui est à Zoé reste${zoeRestants.length ? ` (parti : ${zoeRestants.join(", ")})` : ""}`);
ok(!(await existe(`comptes-supprimes/${LEA.id}.json`)), "le balayage fini, son témoin part");

console.log(echecs ? `\n${echecs} échec(s)` : "\nMon compte : tout est bon");
process.exit(echecs ? 1 : 0);
