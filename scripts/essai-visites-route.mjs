// 🚪 LES VISITES ET LES SOUVENIRS (« Univers », lot 6), PAR LES ROUTES — contre le faux Supabase, jamais la vraie base
// (`lib/direct/visites.ts`, `visites-serveur.ts`, `app/api/direct/visites`).
//
// Marc a son univers. Inès est sa proche (dans les deux sens) ; Nico ne l'est pas ; un inconnu n'a pas de compte.
// « Mes proches » (par défaut) : Inès entre (ses clés, elle peut laisser un souvenir), Nico et l'inconnu non. « Tout
// le monde » : il faut avoir déclaré 18 ans ou plus ; Nico et l'inconnu entrent, sans ses clés ni ses souvenirs. Inès
// frappe (une visite par jour) ; ses souvenirs : pas d'alcool, trois en attente au plus ; Marc accepte (il se pose,
// les proches le voient), refuse, retire. « Moi seul » : la porte est fermée. Nico signale. Dans « Proches », Inès
// voit « Son univers ».
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-visites-route.mjs
import crypto from "node:crypto";

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
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const MARC = { id: "abababab-0000-4000-8000-000000000b01", jeton: "jeton-marc-visites-0000001", prenom: "Marc" };
const INES = { id: "abababab-0000-4000-8000-000000000b02", jeton: "jeton-ines-visites-0000001", prenom: "Inès" };
const NICO = { id: "abababab-0000-4000-8000-000000000b03", jeton: "jeton-nico-visites-0000001", prenom: "Nico" };
const GENS = [MARC, INES, NICO];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: new Date().toISOString() })),
);
await json(`${MARC.id}/proches.json`, { ids: [INES.id] });
await json(`${INES.id}/proches.json`, { ids: [MARC.id] });
await json(`${NICO.id}/proches.json`, { ids: [MARC.id] });

// ─── Marc : sa figurine du nouveau style, son univers créé ───
const maintenant = new Date().toISOString();
const P1 = `${MARC.id}/perso/v1`;
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
await json(`${MARC.id}/perso/fiche.json`, perso);
const M1 = `${MARC.id}/monde/v1`;
await deposer(`${M1}/decor.png`, PNG, "image/png");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [{ id: "e1", quoi: "un établi", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true }],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.32, y: 0.84, echelle: 1 }, { id: "invite", x: 0.7, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${M1}/decor.png` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${MARC.id}/monde/fiche.json`, monde);

const ROUTE = `${BASE}/api/direct/visites`;
const voir = async (qui, q) => {
  const r = await fetch(`${ROUTE}?${q}`, { headers: qui ? { cookie: `clikme_habitant=${qui.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const faire = async (qui, corps) => {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ═══ « MES PROCHES », PAR DÉFAUT ═══
const vi = (await voir(INES, `cle=${MARC.cle}`)).vue;
ok(vi?.etat === "ouvert" && vi.prenom === "Marc" && vi.proche && vi.cles.length === 1 && vi.peutLaisser && /^http/.test(vi.decor) && /^http/.test(vi.hote.image), "« mes proches » : Inès entre — son décor, sa figurine, ses clés ; elle peut laisser un souvenir");
ok(/^http/.test(vi?.invite?.image ?? ""), "la figurine d'Inès, à la place de l'invité");
ok((await voir(NICO, `cle=${MARC.cle}`)).vue?.etat === "reserve" && (await voir(null, `cle=${MARC.cle}`)).vue?.etat === "reserve", "Nico (pas proche dans les deux sens) et un inconnu : « réservé à ses proches »");
ok((await voir(INES, "cle=0123456789abcdef")).vue?.etat === "absent", "une clé qui n'est à personne : « cet univers n'existe pas »");

// ═══ « TOUT LE MONDE » : 18 ANS OU PLUS ═══
ok((await faire(MARC, { action: "visibilite", visibilite: "tous" })).statut === 403, "« tout le monde » sans avoir déclaré 18 ans ou plus : refusé");
ok((await faire(MARC, { action: "visibilite", visibilite: "tous", adulte: true })).statut === 200 && (await lire(`${MARC.id}/adulte.json`))?.le, "« oui, j'ai 18 ans ou plus » : son univers est ouvert à tous");
const vn = (await voir(NICO, `cle=${MARC.cle}`)).vue;
const va = (await voir(null, `cle=${MARC.cle}`)).vue;
ok(vn?.etat === "ouvert" && !vn.proche && vn.cles.length === 0 && !vn.peutLaisser && va?.etat === "ouvert" && va.cles.length === 0 && !va.invite.image, "Nico et l'inconnu entrent : le lieu, jamais ses clés ; ils ne laissent rien");

// ═══ FRAPPER À LA PORTE ═══
ok((await faire(INES, { action: "frapper", cle: MARC.cle })).statut === 200 && (await faire(INES, { action: "frapper", cle: MARC.cle })).statut === 200, "Inès frappe à la porte (deux fois)");
const mv1 = (await voir(MARC, "moi=1")).visites;
ok(mv1?.passes?.length === 1 && mv1.passes[0].prenom === "Inès" && mv1.visibilite === "tous" && mv1.adulte && mv1.cle === MARC.cle, "chez Marc : « Inès est passée », une fois par jour ; son réglage, son lien");
ok((await faire(MARC, { action: "frapper", cle: MARC.cle })).statut === 400, "on ne frappe pas chez soi");

// ═══ LES SOUVENIRS ═══
ok((await faire(NICO, { action: "souvenir", cle: MARC.cle, objet: "fleurs" })).statut === 403, "Nico n'est pas son proche : pas de souvenir");
ok((await faire(INES, { action: "souvenir", cle: MARC.cle, objet: "fleurs", mot: "un verre de vin" })).statut === 400 && (await faire(INES, { action: "souvenir", cle: MARC.cle, objet: "pierre" })).statut === 400, "d'alcool, ou un objet qui n'existe pas : refusé");
ok((await faire(INES, { action: "souvenir", cle: MARC.cle, objet: "fleurs", mot: "Pour ton atelier !" })).statut === 200, "Inès laisse un bouquet, avec un mot");
await faire(INES, { action: "souvenir", cle: MARC.cle, objet: "tasse" });
await faire(INES, { action: "souvenir", cle: MARC.cle, objet: "livre" });
ok((await faire(INES, { action: "souvenir", cle: MARC.cle, objet: "ballon" })).statut === 429, "trois souvenirs en attente au plus");
const mv2 = (await voir(MARC, "moi=1")).visites;
ok(mv2?.enAttente?.length === 3 && mv2.enAttente[0].de === "Inès" && mv2.enAttente[0].mot === "Pour ton atelier !" && mv2.poses.length === 0, "chez Marc : trois souvenirs à accepter, de qui, avec son mot");
ok((await voir(INES, `cle=${MARC.cle}`)).vue?.souvenirs?.length === 0, "tant qu'il ne l'a pas accepté, il n'apparaît pas");
const [bouquet, tasse, livre] = mv2.enAttente;
ok((await faire(MARC, { action: "decider", id: bouquet.id, oui: true })).statut === 200 && (await faire(MARC, { action: "decider", id: tasse.id, oui: false })).statut === 200, "Marc pose le bouquet chez lui, et dit « non merci » à la tasse");
const mv3 = (await voir(MARC, "moi=1")).visites;
ok(mv3.poses.length === 1 && typeof mv3.poses[0].x === "number" && mv3.poses[0].y >= 0.8 && mv3.enAttente.length === 1, "le bouquet est posé (sur le sol, devant) ; la tasse s'en va ; le livre attend");
const vi2 = (await voir(INES, `cle=${MARC.cle}`)).vue;
ok(vi2?.souvenirs?.length === 1 && vi2.souvenirs[0].objet === "fleurs" && (await voir(NICO, `cle=${MARC.cle}`)).vue?.souvenirs?.length === 0, "ses proches voient le bouquet ; Nico, non (les souvenirs restent entre proches)");
ok((await faire(MARC, { action: "retirer", id: bouquet.id })).statut === 200 && (await voir(MARC, "moi=1")).visites.poses.length === 0, "Marc retire le bouquet");
await faire(MARC, { action: "decider", id: livre.id, oui: false });

// ═══ « MOI SEUL », SIGNALER, « PROCHES » ═══
ok((await faire(MARC, { action: "visibilite", visibilite: "moi" })).statut === 200 && (await voir(INES, `cle=${MARC.cle}`)).vue?.etat === "ferme" && (await faire(INES, { action: "frapper", cle: MARC.cle })).statut === 403, "« moi seul » : la porte est fermée, même pour Inès");
ok((await voir(MARC, `cle=${MARC.cle}`)).vue?.chezSoi === true, "Marc voit son univers comme ses visiteurs");
await faire(MARC, { action: "visibilite", visibilite: "proches" });
ok((await faire(NICO, { action: "signaler", cle: MARC.cle })).statut === 200 && (await lire(`signalements/univers/${MARC.id}.json`))?.liste?.length === 1, "Nico signale son univers : l'équipe le saura");
const proches = await (await fetch(`${BASE}/api/direct/proches`, { headers: { cookie: `clikme_habitant=${INES.jeton}` } })).json();
ok(proches?.proches?.find((p) => p.cle === MARC.cle)?.univers === true, "dans « Proches », Inès voit « 🏡 Son univers »");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles visites tiennent ✓");
process.exit(echecs ? 1 : 0);
