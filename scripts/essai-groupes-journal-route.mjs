// 📖 MES GROUPES, LE JOURNAL (le lot G7, 26 novembre 2026 ; `docs/univers/mes-groupes.md`), PAR LA ROUTE — contre le
// faux Supabase.
//
// Léa crée « Les footeux » ; Sam puis Zoé le gardent : « ✨ Le groupe est né · créé par Léa », « 👋 Sam a rejoint le
// groupe »… Léa pose une séance dans cinq minutes ; Léa et Sam entrent dans le salon du groupe : « Ils étaient là »
// (une fois chacun, même s'ils reviennent). L'idée de Zoé devient une séance ; la vidéo de Léa est choisie (deux 🙋).
// Tom n'est pas du groupe.
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

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006e72${String(n).padStart(2, "0")}`, jeton: `jeton-groupes-journal-route-${String(n).padStart(2, "0")}`, prenom });
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

// ═══ LA NAISSANCE ; CEUX QUI ONT REJOINT ═══
const j0 = (await journal(LEA)).journal ?? [];
const fin = j0.at(-1);
ok(fin?.ne && fin.titre === "Le groupe est né" && fin.sous === "créé par Léa", `tout en bas : « ✨ ${fin?.titre} · ${fin?.sous} »`);
ok(j0.some((x) => x.titre === "Sam a rejoint le groupe") && j0.some((x) => x.titre === "Zoé a rejoint le groupe"), "Sam et Zoé ont rejoint le groupe");
ok(!j0.some((x) => x.titre === "Léa a rejoint le groupe"), "pas Léa (elle l'a créé)");
ok((await journal(TOM)).statut === 404, "Tom : rien");

// ═══ UNE SÉANCE : CEUX QUI ÉTAIENT LÀ ═══
const r = await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Le match de ce soir", recurrence: "une", quand: Date.now() + 5 * 60_000 });
ok(r.statut === 200, "Léa pose une séance dans cinq minutes");
await geste(SAM, { action: "rdv-repondre", groupe: GID, rdv: r.rdv?.id, reponse: "viens" });
const j1 = (await journal(SAM)).journal ?? [];
ok(j1.some((x) => x.titre === "Nouveau rendez-vous : Le match de ce soir" && /posé par Léa/.test(x.sous ?? "")), "« 📅 Nouveau rendez-vous : Le match de ce soir · … posé par Léa »");
for (const x of [LEA, SAM, LEA]) {
  const e = await salon(x, { action: "entrer-groupe", groupe: GID });
  ok(e.statut === 200, `${x.prenom} entre dans le salon du groupe`);
  await salon(x, { action: "sortir", salon: `groupe-${GID}` });
}
const s1 = ((await journal(ZOE)).journal ?? []).find((x) => /^seance-/.test(x.id));
ok(s1?.titre === "Le match de ce soir" && s1.sous === "Ils étaient là" && s1.qui?.map((p) => p.prenom).join(",") === "Léa,Sam", `la séance : ${s1?.qui?.map((p) => p.prenom).join(", ")} (une fois chacun)`);

// ═══ L'IDÉE DEVENUE UNE SÉANCE ; LA VIDÉO CHOISIE ═══
const i = await geste(ZOE, { action: "rdv-ajouter", groupe: GID, nom: "Le multiplex", idee: true, quand: Date.now() + 2 * 24 * 3600_000 });
ok(!((await journal(LEA)).journal ?? []).some((x) => /^idee-/.test(x.id)), "une idée seule : pas encore dans le journal");
await geste(SAM, { action: "rdv-repondre", groupe: GID, rdv: i.rdv?.id, reponse: "viens" });
const id1 = ((await journal(LEA)).journal ?? []).find((x) => /^idee-/.test(x.id));
ok(id1?.titre === "L’idée de Zoé est devenue une séance" && id1.sous === "« Le multiplex »", `« 💡 ${id1?.titre} »`);
const V = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0];
await geste(LEA, { action: "jour-proposer", groupe: GID, video: V?.id, mot: "Le but de dingue" });
ok(!((await journal(LEA)).journal ?? []).some((x) => /^choisie-/.test(x.id)), "une seule main : pas encore choisie");
await geste(ZOE, { action: "jour-envie", groupe: GID, video: V?.id, oui: true });
const ch = ((await journal(SAM)).journal ?? []).find((x) => /^choisie-/.test(x.id));
ok(ch?.titre === "La vidéo de Léa, choisie pour la séance" && ch.video === V?.id && ch.sous === "« Le but de dingue »", `« 🎬 ${ch?.titre} »`);
const j2 = (await journal(LEA)).journal ?? [];
ok(j2[0]?.id === ch?.id && j2.at(-1)?.ne, "le plus récent en haut, la naissance en bas");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLe journal des groupes tient ✓");
process.exit(echecs ? 1 : 0);
