// 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE » (le lot F1, 23 novembre 2026 ; `lib/direct/fil-decouvrir.ts`,
// `fil-decouvrir-serveur.ts`, `app/api/direct/fil-decouvrir` ; `docs/univers/fil.md`), PAR LES ROUTES — contre le faux
// Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// Léa (le foot dans ses passions) ouvre le fil : d'abord le salon du foot, où Sam et Hugo sont en ce moment (leurs
// figurines, leurs bulles — jamais elle-même) ; puis l'humeur de ses proches (Sam, « tristesse », d'abord : on lui
// répond ; Hugo ; pas Zoé, qui ne lui parle pas) ; puis la figurine que Hugo a posée au Petit Bistrot ; puis le salon de
// la musique (Zoé y est, la radio passe) ; puis (le propriétaire, le 23 novembre 2026 : « on ne me propose pas de salon,
// même s'il est vide ? ») tous les autres salons, sans personne : la cuisine d'abord (sa passion ; elle y est seule, et ne
// s'y voit pas), avec ce que Zoé y a dit tout à l'heure ; puis le reste, chacun avec sa télé. Jamais un salon des 15-17
// ans. Elle réagit depuis le fil (elle entre, sa réaction part) : Sam la voit. Ceux qu'elle ne veut plus voir n'y ont
// plus de bulles. Une invitation devant la télé de Sam : le fil le dit. Sans âge dit : la question d'abord. Noé (15 ans) :
// les salons des 15-17 ans, jamais ceux des adultes. Sans compte : 401.
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${F.replace("/rest/v1", "")}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `6f6f6f6f-0000-4000-8000-0000006f10${String(n).padStart(2, "0")}`, jeton: `jeton-fil-decouvrir-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const HUGO = qui(3, "Hugo");
const ZOE = qui(4, "Zoé");
const NOE = qui(5, "Noé");
const TOM = qui(6, "Tom");
const GENS = [LEA, SAM, HUGO, ZOE, NOE, TOM];
const maintenant = new Date().toISOString();
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const BISTROT = "c-petit-bistrot-fil";
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000006f01", slug: "petit-bistrot-fil", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 }]);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre.png`, parle: `${x.id}/neutre.png`, prete_le: maintenant })));
// (leurs figurines assises, du nouveau style)
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
}
for (const x of [LEA, SAM, HUGO, ZOE]) await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
await json(`${NOE.id}/majeur.json`, { age: 15, adulte: false, le: maintenant });
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine"], poids: {}, le: maintenant });
// (ses proches : Sam et Hugo, dans les deux sens ; Zoé l'a ajoutée, elle non)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, HUGO.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${HUGO.id}/proches.json`, { ids: [LEA.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
// (leur humeur du jour)
await json(`${SAM.id}/humeur.json`, { jour, visage: "tristesse", le: maintenant });
await json(`${HUGO.id}/humeur.json`, { jour, visage: "rire", le: maintenant });
await json(`${ZOE.id}/humeur.json`, { jour, visage: "joie", le: maintenant });
// (la nuit passe : la sélection du jour, la télé des salons)
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const SALONS = "/api/direct/salons-ouverts";
const salon = (x, corps) => appel(x, SALONS, corps);
const fil = async (x) => (await appel(x, "/api/direct/fil-decouvrir")).fil;
const tous = [];
const garder = (r) => (tous.push(r), r);

// ═══ CE QUI SE PASSE EN CE MOMENT ═══
const eSam = (await salon(SAM, { action: "entrer", theme: "foot" })).ouverture;
const eHugo = (await salon(HUGO, { action: "entrer", theme: "foot" })).ouverture;
ok(eSam?.salon?.id === "foot-1" && eHugo?.salon?.id === "foot-1", "Sam et Hugo sont dans le salon du foot");
await salon(SAM, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Quel but !" });
await pause(1600);
await salon(SAM, { action: "ecrire", salon: "foot-1", sorte: "reaction", cle: "rire" });
// (Zoé est passée par le salon de la cuisine, y a dit un mot, et en est partie)
ok((await salon(ZOE, { action: "entrer", theme: "cuisine" })).ouverture?.salon?.id === "cuisine-1", "Zoé passe par le salon de la cuisine");
await salon(ZOE, { action: "ecrire", salon: "cuisine-1", sorte: "texte", texte: "Qui a une recette de crêpes ?" });
await salon(ZOE, { action: "sortir", salon: "cuisine-1" });
const eZoe = (await salon(ZOE, { action: "entrer", theme: "musique" })).ouverture;
ok(eZoe?.salon?.id === "musique-1", "Zoé est dans le salon de la musique");
ok((await salon(NOE, { action: "entrer", theme: "foot" })).ouverture?.salon?.maison === "jeunes", "Noé (15 ans) dans le salon du foot des 15-17 ans");
ok((await salon(LEA, { action: "entrer", theme: "cuisine" })).ouverture?.salon?.id === "cuisine-1", "Léa, seule dans le salon de la cuisine");
const pose = await appel(HUGO, "/api/direct/autour", { action: "poser", lieu: BISTROT, mot: "Qui vient prendre un café ?", tete: "humeur", qui: "tous" });
ok(pose.statut === 200, "Hugo a posé sa figurine au Petit Bistrot");

// ═══ SANS COMPTE ; SANS ÂGE ═══
ok((await appel(null, "/api/direct/fil-decouvrir")).statut === 401, "sans compte : 401");
const fTom = garder(await fil(TOM));
ok(fTom?.age === true && !fTom.pieces.some((p) => p.sorte === "salon"), "Tom, sans âge dit : la question d'abord, aucun salon");

// ═══ LE FIL DE LÉA ═══
const f1 = garder(await fil(LEA));
ok(f1?.moi?.prenom === "Léa" && Boolean(f1.moi.figurine?.tete), "sa figurine, au bord de chaque pièce");
const ordre = f1.pieces.map((p) => (p.sorte === "salon" ? p.theme : p.sorte));
const RESTE = ["series", "jeux", "tele", "humour", "mode", "manga", "animaux", "revisions", "parents"];
ok(ordre.join() === ["foot", "humeur", "autour", "musique", "cuisine", ...RESTE].join(), `l'ordre : sa passion en direct, l'humeur de ses proches, Autour, les autres salons en direct ; puis les salons sans personne, sa passion d'abord (${ordre.join()})`);
const foot = f1.pieces[0];
ok(foot?.sorte === "salon" && foot.mien && foot.id === "foot-1" && foot.nom === "Le salon du foot" && foot.e === "⚽", "le salon du foot, sa passion");
ok(foot.presents.length === 2 && foot.presents.map((p) => p.prenom).sort().join() === "Hugo,Sam" && foot.presents.every((p) => /\/api\/direct\/salon\/fichier\//.test(p.src)), "… Sam et Hugo, leurs figurines (pas elle)");
ok(foot.bulles.map((b) => b.texte).join(" ") === "Quel but ! 😂" && foot.bulles.every((b) => b.prenom === "Sam"), `… leurs bulles des dix dernières minutes (${foot.bulles.map((b) => b.texte).join(" ")})`);
ok(/^[A-Za-z0-9_-]{11}$/.test(foot.video?.id ?? "") && Boolean(foot.video.titre), "… ce qui passe à sa télé");
ok(!JSON.stringify(f1).includes(SAM.id) && !JSON.stringify(f1).includes(HUGO.id), "… leurs comptes ne sont jamais montrés");
const humeur = f1.pieces[1];
ok(humeur?.sorte === "humeur" && humeur.proches.map((p) => p.prenom).join() === "Sam,Hugo", `l'humeur de ses proches : Sam d'abord (une humeur douce), Hugo ; pas Zoé (${humeur?.proches?.map((p) => p.prenom).join()})`);
ok(humeur.proches[0].humeur === "tristesse" && humeur.proches[0].doux && /^[a-f0-9]{16}$/.test(humeur.proches[0].cle) && Boolean(humeur.proches[0].figurine?.tete), "… sa tristesse, sa clé (pour lui répondre), sa figurine");
const autour = f1.pieces[2];
ok(autour?.sorte === "autour" && autour.lieu === BISTROT && autour.nomLieu === "Le Petit Bistrot" && autour.figurine.mot === "Qui vient prendre un café ?" && autour.figurine.prenom === "Hugo", "la figurine posée par Hugo, avec son mot du jour");
const musique = f1.pieces[3];
ok(musique?.sorte === "salon" && musique.theme === "musique" && !musique.mien && musique.presents.map((p) => p.prenom).join() === "Zoé" && musique.morceau === null, "le salon de la musique : Zoé, la radio du salon");
const cuisine = f1.pieces[4];
ok(cuisine?.sorte === "salon" && cuisine.mien && cuisine.id === "cuisine-1" && cuisine.presents.length === 0 && cuisine.bulles.length === 0, "la cuisine, sa passion, même sans personne : elle y est seule, et ne s'y voit pas");
ok(cuisine.traces?.length === 1 && cuisine.traces[0].prenom === "Zoé" && cuisine.traces[0].texte === "Qui a une recette de crêpes ?" && cuisine.traces[0].le > Date.now() - 120_000, "… ce que Zoé y a dit tout à l'heure (qui, quoi, quand)");
ok(/^[A-Za-z0-9_-]{11}$/.test(cuisine.video?.id ?? ""), "… sa télé passe quand même");
const reste = f1.pieces.slice(5);
ok(reste.every((p) => p.sorte === "salon" && !p.mien && p.presents.length === 0 && /^[a-z]+-1$/.test(p.id) && Boolean(p.gradin || p.video !== undefined)), "… puis tous les autres salons, sans personne, chacun le sien");
ok(!f1.pieces.some((p) => p.sorte === "salon" && p.traces?.some((t) => t.prenom === "Léa")), "… jamais ses propres bulles dans les traces");
ok(!f1.pieces.some((p) => p.sorte === "salon" && p.presents.some((x) => x.prenom === "Noé")), "jamais un salon des 15-17 ans");

// ═══ ELLE RÉAGIT DEPUIS LE FIL : ELLE ENTRE, SA RÉACTION PART, SAM LA VOIT ═══
await salon(LEA, { action: "sortir", salon: "cuisine-1" });
const eLea = (await salon(LEA, { action: "entrer", theme: "foot" })).ouverture;
ok(eLea?.salon?.id === "foot-1" && eLea.presents.length === 3, "Léa entre dans le salon du fil (le même, le plus rempli)");
const r = await salon(LEA, { action: "ecrire", salon: "foot-1", sorte: "reaction", cle: "rire" });
ok(r.statut === 200 && r.message?.cle === "rire", "sa réaction part au salon");
const vuParSam = (await appel(SAM, `${SALONS}?salon=foot-1&depuis=${Date.now() - 30_000}`)).pouls;
ok(vuParSam?.messages?.some((m) => m.prenom === "Léa" && m.cle === "rire") && vuParSam.ici.length === 3, "Sam la voit : sa figurine assise, sa réaction");
const f2 = garder(await fil(LEA));
ok(f2.pieces[0].presents.length === 2 && !f2.pieces[0].bulles.some((b) => b.prenom === "Léa"), "dans son fil, le salon reste celui des autres (ni elle, ni ses bulles)");

// ═══ CEUX QU'ELLE NE VEUT PLUS VOIR ═══
const qHugo = eHugo.moi;
ok((await salon(LEA, { action: "ne-plus-voir", q: qHugo })).caches?.includes(qHugo), "elle ne veut plus voir Hugo");
await salon(HUGO, { action: "ecrire", salon: "foot-1", sorte: "texte", texte: "Coucou le salon" });
const f3 = garder(await fil(LEA));
ok(!f3.pieces[0].bulles.some((b) => b.texte === "Coucou le salon"), "… ses bulles n'apparaissent plus dans son fil");

// ═══ UNE INVITATION DEVANT LA TÉLÉ DE SAM ═══
const cleLea = (await appel(LEA, "/api/direct/proches")).cle;
ok((await salon(SAM, { action: "inviter", cles: [cleLea] })).statut === 200, "Sam l'invite devant sa télé");
const f4 = garder(await fil(LEA));
ok(f4.invitation?.prenom === "Sam" && /^[a-f0-9]{16}$/.test(f4.invitation.cle), "le fil le dit : « Sam t'invite devant sa télé »");

// ═══ NOÉ (15 ANS) ═══
const fNoe = garder(await fil(NOE));
const salonsNoe = fNoe.pieces.filter((p) => p.sorte === "salon");
ok(!fNoe.age && salonsNoe.length === 11 && salonsNoe.every((p) => p.presents.length === 0) && !salonsNoe.some((p) => p.theme === "parents"), "Noé : les salons des 15-17 ans (seul dans le sien, sans personne d'autre), jamais celui des jeunes parents");
ok(!JSON.stringify(fNoe).includes("Quel but") && !JSON.stringify(fNoe).includes("crêpes") && !JSON.stringify(fNoe).includes("Sam"), "… jamais ce qui se dit chez les adultes");

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nle fil de Découvrir tient ✓");
process.exit(echecs ? 1 : 0);
