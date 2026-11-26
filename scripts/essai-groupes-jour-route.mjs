// 🎬 MES GROUPES, AUJOURD'HUI : LA SÉLECTION DU JOUR, LES 🙋, LES RÔLES (le lot G6, 26 novembre 2026 ;
// `docs/univers/mes-groupes.md`), PAR LA ROUTE — contre le faux Supabase.
//
// Léa crée « Les footeux » avec Sam et Zoé. Aujourd'hui : les nouveautés du foot, et trois rôles, un chacun — les mêmes
// pour tous. Léa propose une vidéo de sa télé du jour, avec son mot : elle ouvre la sélection, sa main levée. Sam lève
// la main : « ✓ Ce soir », elle ouvre la télé du salon du groupe. Zoé propose un lien YouTube. Tom n'est pas du groupe.
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

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006d72${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-jour-route-${String(n).padStart(2, "0")}`, prenom });
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
const vie = async (x, gid) => appel(x, `${GROUPES}?groupe=${encodeURIComponent(gid)}`);

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
const jour = async (x) => (await vie(x, GID)).aujourdhui;

// ═══ LES NOUVEAUTÉS ; LES RÔLES ═══
const a0 = await jour(LEA);
ok(a0?.selection.length > 0 && a0.selection.every((v) => v.nouveaute && !v.de && v.envies.length === 0), `la sélection du jour : les nouveautés du foot (${a0?.selection.length})`);
ok(a0?.selection.length <= 3, "trois au plus quand personne n'a rien proposé");
const roles = (a) => a.roles.map((r) => `${r.id}:${r.qui.prenom}`).join(",");
ok(a0?.roles.length === 3 && new Set(a0.roles.map((r) => r.qui.q)).size === 3, `trois rôles, un chacun (${a0 && roles(a0)})`);
ok(a0?.roles.map((r) => r.id).join(",") === "video,sujet,decouverte", "🎬 la vidéo, 💬 le sujet, 🔎 la découverte");
const aS = await jour(SAM);
ok(aS && roles(aS) === roles(a0), "Sam voit les mêmes rôles");
ok(a0.roles.filter((r) => r.moi).length === 1 && a0.roles.find((r) => r.moi)?.qui.prenom === "Léa", "Léa a le sien (« C'est ton tour »)");
ok((await vie(TOM, GID)).statut === 404, "Tom : rien");
ok((await geste(TOM, { action: "jour-envie", groupe: GID, video: a0.selection[0]?.id })).statut === 404, "Tom ne lève pas la main");

// ═══ LÉA PROPOSE LA SIENNE ═══
const V = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0];
ok(V?.id, "Léa a sa télé du jour");
ok((await geste(LEA, { action: "jour-proposer", groupe: GID })).statut === 400, "sans vidéo : non");
ok((await geste(LEA, { action: "jour-proposer", groupe: GID, video: V.id, mot: "va sur www.site.fr" })).statut === 400, "un mot avec un lien : non");
const p1 = await geste(LEA, { action: "jour-proposer", groupe: GID, video: V.id, mot: "Le but de dingue" });
const v1 = p1.aujourdhui?.selection[0];
ok(p1.statut === 200 && v1?.id === V.id && v1.de?.prenom === "Léa" && v1.mot === "Le but de dingue" && v1.mienne, "sa vidéo ouvre la sélection, avec son mot");
ok(v1?.moi && v1.envies.map((p) => p.prenom).join(",") === "Léa" && !v1.retenue, "sa main est levée (🙋), pas encore retenue");
ok(p1.aujourdhui?.selection.filter((v) => v.nouveaute).length <= 2, "les nouveautés suivent (deux au plus)");

// ═══ 🙋 SAM : « ✓ CE SOIR » ═══
const e1 = await geste(SAM, { action: "jour-envie", groupe: GID, video: V.id, oui: true });
const v2 = e1.aujourdhui?.selection.find((v) => v.id === V.id);
ok(e1.statut === 200 && e1.retenue && v2?.retenue && v2.moi && v2.envies.map((p) => p.prenom).join(",") === "Léa,Sam", "Sam lève la main : « ✓ Ce soir »");
ok((await jour(ZOE))?.selection.find((v) => v.id === V.id)?.retenue, "Zoé la voit retenue");
const s1 = await appel(SAM, "/api/direct/salons-ouverts", { action: "entrer-groupe", groupe: GID });
ok(s1.statut === 200 && (V.duree > 0 ? s1.ouverture?.tele?.videos?.[0]?.id === V.id : true), "elle ouvre la télé du salon du groupe");
await appel(SAM, "/api/direct/salons-ouverts", { action: "sortir", salon: `groupe-${GID}` });
ok((await geste(SAM, { action: "jour-envie", groupe: GID, video: "zzzzzzzzzzz", oui: true })).statut === 404, "une vidéo hors de la sélection : non");
const e2 = await geste(SAM, { action: "jour-envie", groupe: GID, video: V.id, oui: false });
ok(e2.statut === 200 && !e2.aujourdhui?.selection.find((v) => v.id === V.id)?.retenue, "Sam baisse la main : plus retenue");

// ═══ ZOÉ : UN LIEN YOUTUBE ═══
const z = await geste(ZOE, { action: "jour-proposer", groupe: GID, lien: "https://www.youtube.com/watch?v=zoeFootBut1", mot: "Un live que personne n’a vu" });
ok(z.statut === 200 && z.aujourdhui?.selection.some((v) => v.de?.prenom === "Zoé" && v.mienne), `Zoé propose un lien YouTube (${z.statut} ${z.error ?? ""})`);
ok((await jour(LEA))?.selection.filter((v) => v.de).map((v) => v.de.prenom).join(",") === "Léa,Zoé", "Léa voit les deux, dans l'ordre");

// ═══ LÉA RETIRE LA SIENNE ═══
const r = await geste(LEA, { action: "jour-retirer", groupe: GID });
ok(r.statut === 200 && !r.aujourdhui?.selection.some((v) => v.de?.prenom === "Léa"), "Léa retire la sienne");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nAujourd'hui dans les groupes tient ✓");
process.exit(echecs ? 1 : 0);
