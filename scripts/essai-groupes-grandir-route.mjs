// 🌱 MES GROUPES, LE GROUPE QUI GRANDIT (le lot G8, 26 novembre 2026 ; `docs/univers/mes-groupes.md`), PAR LA ROUTE —
// contre le faux Supabase.
//
// Léa et Sam ont « Les footeux ». Léa propose d'accueillir Zoé (sa proche) : Sam est partant, Zoé est invitée, elle le
// garde. Pas Tom (pas un proche), pas Sam (déjà là). Sam ajoute la musique : un thème de plus (trois au plus), dans le
// journal. Léa signale Zoé et son message : elle ne voit plus ses messages (Sam, si). Sam quitte le groupe.
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

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006f72${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-grandir-route-${String(n).padStart(2, "0")}`, prenom });
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
const CLE_TOM = await CLE(TOM);
await CLE(LEA);
const c = await geste(LEA, { action: "creer-groupe", nom: "Les footeux", theme: "foot", cles: [CLE_SAM] });
const GID = c.groupe?.id;
ok(c.statut === 200 && GID && c.groupe.moi, "Léa crée « Les footeux » avec Sam");
await geste(SAM, { action: "garder-groupe", groupe: GID });
const groupeDe = async (x) => ((await appel(x, GROUPES)).groupes ?? []).find((g) => g.id === GID);

// ═══ 👥 ACCUEILLIR QUELQU'UN ═══
ok((await geste(LEA, { action: "accueil-proposer", groupe: GID, cle: CLE_TOM })).statut === 400, "Tom (pas un proche de Léa) : non");
ok((await geste(LEA, { action: "accueil-proposer", groupe: GID, cle: CLE_SAM })).statut === 409, "Sam (déjà là) : non");
const a1 = await geste(LEA, { action: "accueil-proposer", groupe: GID, cle: CLE_ZOE });
const z1 = a1.accueils?.find((x) => x.prenom === "Zoé");
ok(a1.statut === 200 && z1 && z1.moi && !z1.invite && z1.partants.map((p) => p.prenom).join(",") === "Léa" && z1.de === "Léa", "Léa propose Zoé : elle est partante, pas encore d'invitation");
ok(!(await groupeDe(ZOE)), "Zoé ne voit encore rien");
const vS = await vie(SAM, GID);
ok(vS.accueils?.some((x) => x.q === z1?.q && !x.moi), "Sam voit « Accueillir Zoé ? »");
const a2 = await geste(SAM, { action: "accueil-partant", groupe: GID, q: z1?.q });
ok(a2.statut === 200 && a2.invite && a2.accueils?.find((x) => x.q === z1?.q)?.invite, "Sam est partant : Zoé est invitée");
const gZ = await groupeDe(ZOE);
ok(gZ?.invite?.de === "Léa", "Zoé voit le groupe : « Léa te propose ce groupe »");
const k = await geste(ZOE, { action: "garder-groupe", groupe: GID });
ok(k.statut === 200 && k.groupe?.membres.length === 3, "Zoé le garde : ils sont trois");
ok(((await vie(LEA, GID)).accueils ?? []).length === 0, "plus personne à accueillir");

// ═══ 🌱 ＋ THÈME ═══
const t1 = await geste(SAM, { action: "theme-ajouter", groupe: GID, theme: "musique" });
ok(t1.statut === 200 && t1.themes?.join(",") === "musique", "Sam ajoute la musique");
ok((await groupeDe(LEA))?.themes?.join(",") === "musique", "Léa voit le thème dans son identité");
ok((await geste(LEA, { action: "theme-ajouter", groupe: GID, theme: "musique" })).themes?.length === 1, "le même deux fois : une seule fois");
ok((await geste(LEA, { action: "theme-ajouter", groupe: GID, theme: "pas-un-theme" })).statut === 400, "un thème qui n'existe pas : non");
await geste(LEA, { action: "theme-ajouter", groupe: GID, theme: "humour" });
await geste(LEA, { action: "theme-ajouter", groupe: GID, theme: "cuisine" });
const t4 = await geste(LEA, { action: "theme-ajouter", groupe: GID, theme: "series" });
ok(t4.statut === 409, `trois thèmes de plus au plus (« ${t4.error} »)`);
const jr = (await appel(LEA, `${GROUPES}?groupe=${encodeURIComponent(GID)}&journal=1`)).journal ?? [];
ok(jr.some((x) => x.titre === "Nouveau thème : musique" && x.sous === "proposé par Sam"), "le journal : « Nouveau thème : musique · proposé par Sam »");
const aj = (await vie(LEA, GID)).aujourdhui;
ok(["foot", "musique", "humour", "cuisine"].includes(aj?.theme), `le thème du jour : ${aj?.theme}`);

// ═══ 🚩 SIGNALER ═══
const m = await geste(ZOE, { action: "ecrire-groupe", groupe: GID, texte: "Coucou les footeux" });
ok(m.statut === 200, "Zoé écrit au groupe");
ok((await geste(LEA, { action: "signaler-groupe", groupe: GID, q: (await groupeDe(LEA)).moi })).statut === 400, "se signaler soi-même : non");
ok((await geste(TOM, { action: "signaler-groupe", groupe: GID, q: m.message?.q })).statut === 404, "Tom (pas du groupe) : non");
const sg = await geste(LEA, { action: "signaler-groupe", groupe: GID, q: m.message?.q, motif: "Autre chose", message: m.message?.id });
ok(sg.statut === 200 && sg.caches?.includes(m.message?.q), "Léa signale Zoé et son message");
ok(!(await vie(LEA, GID)).vie?.messages.some((x) => x.q === m.message?.q), "Léa ne voit plus ses messages");
ok((await vie(SAM, GID)).vie?.messages.some((x) => x.q === m.message?.q), "Sam, si");

// ═══ 🚪 QUITTER ═══
ok((await geste(SAM, { action: "quitter-groupe", groupe: GID })).statut === 200, "Sam quitte le groupe");
ok(!(await groupeDe(SAM)), "il n'est plus dans ses groupes");
ok((await vie(SAM, GID)).statut === 404, "… ni son espace");
ok((await groupeDe(LEA))?.membres.map((p) => p.prenom).join(",") === "Léa,Zoé", "Léa et Zoé restent");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLe groupe qui grandit tient ✓");
process.exit(echecs ? 1 : 0);
