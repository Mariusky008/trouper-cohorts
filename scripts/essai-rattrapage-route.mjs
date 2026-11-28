// ⏪ LE RATTRAPAGE, LOT T1 : NOTER LA SÉANCE (27 novembre 2026 ; `docs/univers/rattrapage.md`), PAR LA ROUTE — contre
// le faux Supabase.
//
// Léa crée « Les footeux » ; Sam et Zoé le gardent. Léa pose une séance dans cinq minutes ; Léa et Sam entrent dans le
// salon du groupe et réagissent (😂 à 2:15, à deux) : chaque réaction est notée avec la vidéo et sa seconde. Zoé, absente,
// voit la séance (« Ils étaient là », le grand moment 😂 à 2:15 avec leurs têtes) et peut la rejouer. Tom n'est pas du
// groupe. Puis un essai (une proposition ouverte à tout le monde) : Sam y entre et réagit ; Léa (qui propose) le voit,
// Zoé (sans place) non.
import sharp from "sharp";
import { poserPiece } from "./piece-en-hauteur.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000007a72${String(n).padStart(2, "0")}`, jeton: `jeton-rattrapage-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const GENS = [LEA, SAM, ZOE, TOM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, accord_le: maintenant, prete_le: maintenant })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
}
// (Léa ↔ Sam : proches des deux côtés ; Zoé, Tom et Noé : de personne)
// (Léa ↔ Sam, Léa ↔ Zoé : proches ; Tom : de personne)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, ZOE.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const GROUPES = "/api/direct/mes-groupes";
const geste = (x, corps) => appel(x, GROUPES, corps);

// ─── leurs téléphones (un faux service de notifications, au faux Supabase) ───
const CLE = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_SAM = await CLE(SAM);
const CLE_ZOE = await CLE(ZOE);
await CLE(LEA);
const c = await geste(LEA, { action: "creer-groupe", nom: "Les footeux", theme: "foot", cles: [CLE_SAM, CLE_ZOE] });
const GID = c.groupe?.id;
ok(c.statut === 200 && GID, "Léa crée « Les footeux »");
await geste(SAM, { action: "garder-groupe", groupe: GID });
await geste(ZOE, { action: "garder-groupe", groupe: GID });
const journal = async (x) => appel(x, `${GROUPES}?groupe=${encodeURIComponent(GID)}&journal=1`);
const salon = (x, corps) => appel(x, "/api/direct/salons-ouverts", corps);


const R = "/api/direct/rattrapage";
const rattrapage = (x, qs) => appel(x, `${R}?${qs}`);

// ═══ UNE SÉANCE DU GROUPE ═══
const r = await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Le match de ce soir", recurrence: "une", quand: Date.now() + 5 * 60_000 });
ok(r.statut === 200, "Léa pose une séance dans cinq minutes");
const SALON = `groupe-${GID}`;
const eL = await salon(LEA, { action: "entrer-groupe", groupe: GID });
const eS = await salon(SAM, { action: "entrer-groupe", groupe: GID });
ok(eL.statut === 200 && eS.statut === 200, "Léa et Sam entrent dans le salon du groupe");
const V = eL.ouverture?.tele?.videos?.[0]?.id;
ok(/^[A-Za-z0-9_-]{11}$/.test(V ?? ""), "la télé du salon a une vidéo");
const ecrire = (x, corps) => salon(x, { action: "ecrire", salon: SALON, ...corps });
ok((await ecrire(LEA, { sorte: "reaction", cle: "rire", ou: { video: V, t: 135 } })).statut === 200, "Léa : 😂 à 2:15");
await new Promise((f) => setTimeout(f, 1600));
ok((await ecrire(SAM, { sorte: "texte", texte: "Regarde le gardien", ou: { video: V, t: 118 } })).statut === 200, "Sam écrit à 1:58");
await new Promise((f) => setTimeout(f, 1600));
ok((await ecrire(SAM, { sorte: "reaction", cle: "rire", ou: { video: V, t: 137 } })).statut === 200, "Sam : 😂 à 2:17");
await new Promise((f) => setTimeout(f, 1600));
ok((await ecrire(LEA, { sorte: "reaction", cle: "coeur" })).statut === 200, "Léa : ❤️ sans dire où en est la vidéo (un vieux téléphone)");

const l = await rattrapage(ZOE, `de=${encodeURIComponent(GID)}`);
ok(l.statut === 200 && l.seances?.length === 1, `Zoé voit une séance à rattraper (${l.seances?.length})`);
const S = l.seances?.[0];
ok(S?.nom === "Le match de ce soir" && S.la?.map((p) => p.prenom).join(",") === "Léa,Sam", `« Ils étaient là » : ${S?.la?.map((p) => p.prenom).join(", ")}`);
ok(!S?.jY, "Zoé n'y était pas");
ok(S?.moment?.cle === "rire" && S.moment.t === 135 && S.moment.qui.map((p) => p.prenom).sort().join(",") === "Léa,Sam", `le grand moment : 😂 à ${S?.moment?.t} s, ${S?.moment?.qui?.map((p) => p.prenom).join(" et ")}`);
ok(!JSON.stringify(l).includes(LEA.id), "jamais un compte");
ok((await rattrapage(LEA, `de=${encodeURIComponent(GID)}`)).seances?.[0]?.jY === true, "Léa y était");
ok((await rattrapage(TOM, `de=${encodeURIComponent(GID)}`)).statut === 403, "Tom (pas du groupe) : non");

const d = await rattrapage(ZOE, `seance=${encodeURIComponent(S?.cle ?? "")}`);
const T = d.seance?.traces ?? [];
ok(d.statut === 200 && T.length === 3, `la séance à rejouer : ${T.length} traces (pas celle sans seconde)`);
ok(T.every((x) => x.video === V) && T.map((x) => x.t).join(",") === "135,118,137", `chacune à sa seconde : ${T.map((x) => x.t).join(", ")}`);
ok(T.find((x) => x.sorte === "texte")?.texte === "Regarde le gardien", "le mot de Sam, tel quel");
ok(d.seance?.videos?.[0]?.id === V, "la vidéo de la séance");
ok(Object.keys(d.seance?.figurines ?? {}).length === 2, "les figurines de Léa et Sam");
ok(!JSON.stringify(d).includes(SAM.id), "jamais un compte");
ok((await rattrapage(TOM, `seance=${encodeURIComponent(S?.cle ?? "")}`)).statut === 403, "Tom ne la rejoue pas");
ok((await rattrapage(ZOE, "seance=n-importe-quoi")).statut === 404, "une clé inventée : 404");

// ═══ (lot T3) ZOÉ RÉAGIT EN DÉCALÉ ═══
const reagir = (x, corps) => appel(x, R, { action: "reagir", seance: S?.cle, ...corps });
const z1 = await reagir(ZOE, { sorte: "reaction", cle: "rire", ou: { video: V, t: 136 } });
ok(z1.statut === 200 && z1.trace?.rattrapage === true && z1.trace.t === 136, "Zoé : 😂 à 2:16, « ⏪ vu en rattrapage »");
ok((await reagir(ZOE, { sorte: "reaction", cle: "coeur", ou: { video: V, t: 140 } })).statut === 429, "… trop vite : « Doucement »");
await new Promise((f) => setTimeout(f, 1600));
const z2 = await reagir(ZOE, { sorte: "texte", texte: "Non mais le plongeon", ou: { video: V, t: 137 } });
ok(z2.statut === 200 && z2.trace?.texte === "Non mais le plongeon", "Zoé écrit à 2:17");
await new Promise((f) => setTimeout(f, 1600));
const zr = await reagir(ZOE, { sorte: "texte", texte: "va voir https://site.fr", ou: { video: V, t: 140 } });
ok(zr.statut === 400 && zr.refus, `un lien ne passe pas (« ${zr.error} »)`);
await new Promise((f) => setTimeout(f, 1600));
ok((await reagir(ZOE, { sorte: "reaction", cle: "rire", ou: { video: "AAAAAAAAAAA", t: 10 } })).statut === 400, "une autre vidéo : non");
ok((await reagir(ZOE, { sorte: "reaction", cle: "pouet", ou: { video: V, t: 10 } })).statut === 400, "une réaction inconnue : non");
ok((await reagir(TOM, { sorte: "reaction", cle: "rire", ou: { video: V, t: 10 } })).statut === 403, "Tom (pas du groupe) : non");
const l2 = (await rattrapage(LEA, `de=${encodeURIComponent(GID)}`)).seances?.[0];
ok(l2?.rattrapee?.map((x) => x.prenom).join(",") === "Zoé" && l2.rattrapee[0].src, "la séance : Zoé l'a rattrapée (avec sa figurine)");
ok(l2?.moment?.qui?.length === 2, "le grand moment reste celui de la séance (Léa et Sam)");
const d2 = (await rattrapage(SAM, `seance=${encodeURIComponent(S?.cle ?? "")}`)).seance;
ok(d2?.traces?.filter((x) => x.rattrapage).length === 2 && d2.figurines && Object.keys(d2.figurines).length === 3, "quand Sam la revoit : les deux traces de Zoé, et sa figurine");

// (hors séance : dans le salon du groupe, sans rendez-vous à l'heure, rien n'est noté)
await salon(LEA, { action: "sortir", salon: SALON });

// ═══ UN ESSAI (UNE PROPOSITION OUVERTE À TOUT LE MONDE) ═══
const p = await geste(LEA, { action: "proposer", nom: "Soirée foot", theme: "foot", quand: Date.now() + 5 * 60_000, pour: "tous", places: 8 });
const PID = p.proposition?.id;
ok(p.statut === 200 && PID, "Léa propose « Soirée foot » dans cinq minutes, à tout le monde");
await geste(SAM, { action: "confirmer", id: PID });
const a = await geste(SAM, { action: "entrer", id: PID });
ok(a.statut === 200 && /theme=foot/.test(a.aller ?? ""), "Sam entre dans l'essai : le salon du foot");
const es = await salon(SAM, { action: "entrer", theme: "foot" });
const SID = es.ouverture?.salon?.id;
const VE = es.ouverture?.tele?.videos?.[0]?.id;
ok(es.statut === 200 && SID, `Sam est au salon (${SID})`);
await new Promise((f) => setTimeout(f, 1600));
ok((await salon(SAM, { action: "ecrire", salon: SID, sorte: "reaction", cle: "surprise", ou: { video: VE, t: 42 } })).statut === 200, "Sam : 😱 à 0:42");
const le = await rattrapage(LEA, `de=${encodeURIComponent(PID)}`);
ok(le.seances?.[0]?.la?.map((x) => x.prenom).join(",") === "Sam" && le.seances[0].moment?.cle === "surprise", "Léa (qui propose) voit l'essai : Sam y était, 😱");
ok((await rattrapage(ZOE, `de=${encodeURIComponent(PID)}`)).statut === 403, "Zoé (sans place) ne le voit pas");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLe rattrapage note les séances ✓");
process.exit(echecs ? 1 : 0);
