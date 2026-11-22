// 🧍 LE NOUVEL « AUTOUR » : JE POSE MA FIGURINE DANS LA VILLE (`lib/direct/autour-serveur.ts`, section « la figurine
// posée » ; `docs/univers/autour.md`), PAR LES ROUTES — contre le faux Supabase et le faux moteur d'image.
//
// À Dax, le Petit Bistrot (un commerce client). Léa a sa figurine du nouveau style, ses expressions, et un fou rire pour
// humeur du jour. Elle pose sa figurine au Bistrot (« Qui vient prendre un café ? ») : sur la carte, sa tête du jour ;
// dans le lieu, assise (son corps sans sa tête, la tête de son humeur), avec son mot. Sans mot : refusé ; un gros mot,
// de l'alcool : refusés. Hugo s'assoit à côté d'elle : sa figurine suit la sienne, « à côté de Léa ». « Mes proches » :
// Sam ne la voit pas, Hugo (son proche) si ; « Moi seul » : personne d'autre. Ailleurs : une zone d'environ 500 m, jamais
// sa position ; son petit nom ; pas d'adresse. La reposer au même lieu la remplace ; trois par jour, pas une de plus.
// Passées 24 h : elle s'en va. Signalée par trois personnes : elle s'en va ; celui qui signale ne la voit plus. Retirée :
// partie. Ses têtes à choisir : son humeur, ses sept expressions. Les mèmes d'avant ne sont pas touchés.
import crypto from "node:crypto";
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
const lister = async (prefix) => ((await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000 }) })).json()) ?? []).map((x) => x.name);
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
async function attendreQue(f, ms = 60000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const v = await f().catch(() => null);
    if (v) return v;
    await pause(400);
  }
  return null;
}

const qui = (n, prenom) => ({ id: `7d7d7d7d-0000-4000-8000-0000007d10${String(n).padStart(2, "0")}`, jeton: `jeton-autour-fig-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const HUGO = qui(2, "Hugo");
const SAM = qui(3, "Sam");
const ANA = qui(4, "Ana");
const BEN = qui(5, "Ben");
const GENS = [LEA, HUGO, SAM, ANA, BEN];
const BISTROT = "c-petit-bistrot-fig";
const maintenant = new Date().toISOString();
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000007d01", slug: "petit-bistrot-fig", channel: "letter", business_name: "Le Petit Bistrot", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true, latitude: 43.7102, longitude: -1.0538 }]);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/><rect x="370" y="540" width="60" height="40" fill="${couleur}"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/></svg>`), left: 0, top: 0 }])
    .png()
    .toBuffer();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [x, c] of GENS.map((g, k) => [g, ["#c8643c", "#3c8cc8", "#8cc83c", "#c83c8c", "#c8c83c"][k]])) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(c), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`${x.id}/majeur.json`, { le: maintenant, age: 30 });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })));
await json(`${LEA.id}/proches.json`, { ids: [HUGO.id] });
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
await json(`${LEA.id}/humeur.json`, { jour, visage: "rire", le: maintenant });

const ROUTE = `${BASE}/api/direct/autour`;
const poster = async (x, corps) => {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const voir = async (x, q) => {
  const r = await fetch(`${ROUTE}${q}`, { headers: x ? { cookie: `clikme_habitant=${x.jeton}` } : {} });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const tous = [];
const garder = (r) => (tous.push(r), r);

// ═══ LÉA : SES EXPRESSIONS, SES TÊTES À CHOISIR ═══
await fetch(`${BASE}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } });
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le ? e : null;
}, 90000);
ok(Boolean(etat?.tetes?.rire), "Léa a ses expressions (le fou rire compris)");
const t1 = garder(await voir(LEA, "?mesTetes=1"));
ok(t1.tetes?.humeur?.e === "rire" && t1.tetes.humeur.src === etat?.tetes?.rire && t1.tetes.tetes.length === 7, `ses têtes à choisir : son humeur du jour (le rire), ses sept expressions (${t1.tetes?.tetes?.length})`);

// ═══ ELLE POSE SA FIGURINE AU BISTROT ═══
ok((await poster(LEA, { action: "poser", lieu: BISTROT, mot: "", tete: "humeur", qui: "tous" })).statut === 400, "sans mot du jour : refusé (c'est lui qu'on lit en premier)");
ok((await poster(LEA, { action: "poser", lieu: BISTROT, mot: "Une bière en terrasse ?", tete: "humeur", qui: "tous" })).statut === 400, "de l'alcool : refusé");
const p1 = garder(await poster(LEA, { action: "poser", lieu: BISTROT, mot: "Qui vient prendre un café ?", tete: "humeur", qui: "tous" }));
ok(p1.statut === 200 && p1.lieu === BISTROT && /^[a-z0-9]{12}$/.test(p1.id ?? ""), `posée au Petit Bistrot (${p1.id})`);
const c1 = garder(await voir(SAM, "?figurines=1"));
const bistrot1 = c1.lieux?.find((l) => l.id === BISTROT);
ok(bistrot1?.n === 1 && bistrot1.visages?.[0] === etat?.tetes?.rire, "sur la carte de Sam : le Bistrot, une figurine, la tête de son humeur (le rire)");
ok(c1.derniers?.[0]?.mot === "Qui vient prendre un café ?" && c1.derniers[0].prenom === "Léa" && !c1.derniers[0].corps, "« Posées autour de toi aujourd'hui » : son mot, son prénom (la tête seulement)");
const l1 = garder(await voir(SAM, `?figurines=1&lieu=${BISTROT}`));
const f1 = l1.figurines?.[0];
ok(l1.lieu?.nom === "Le Petit Bistrot" && f1?.mot === "Qui vient prendre un café ?" && f1.tete === etat?.tetes?.rire && /\/api\/direct\/salon\/fichier\//.test(f1.corps?.src ?? "") && f1.corps.boite?.length === 4 && f1.profil === cleProfil(LEA.id) && f1.moi === false, "dans le lieu : assise (son corps sans sa tête, la tête du rire), son mot, sa clé de profil");
ok(Date.parse(f1?.fin) - Date.parse(f1?.le) === 24 * 3600_000, "… elle reste 24 heures");

// ═══ HUGO S'ASSOIT À CÔTÉ D'ELLE ═══
const p2 = garder(await poster(HUGO, { action: "poser", lieu: BISTROT, mot: "Moi ! J’arrive dans dix minutes", tete: "humeur", qui: "tous", reponseA: p1.id }));
ok(p2.statut === 200, "Hugo répond avec sa figurine : elle s'assoit à côté");
const l2 = garder(await voir(SAM, `?figurines=1&lieu=${BISTROT}`));
ok(l2.figurines?.map((f) => f.prenom).join() === "Léa,Hugo" && l2.figurines[1].reponseA === p1.id, "dans le lieu : la sienne juste après celle de Léa (« à côté de Léa »)");
ok((await poster(HUGO, { action: "poser", lieu: BISTROT, mot: "Encore moi", qui: "tous", reponseA: p2.id })).statut === 400, "pas à côté de la sienne");

// ═══ QUI LA VOIT ═══
const p3 = garder(await poster(LEA, { action: "poser", ici: { lat: 43.7149, lng: -1.0502 }, nomLieu: "Soirée chez Max", mot: "Ce soir, je suis là", tete: "fache", qui: "proches" }));
ok(p3.statut === 200 && /^z-/.test(p3.lieu ?? ""), `Ailleurs : une zone (${p3.lieu})`);
const zone = p3.lieu;
const fichierZone = (await lister(`autour-fig/dax/${zone}`))[0] ?? "";
const depotZone = await lire(`autour-fig/dax/${zone}/${fichierZone}`);
ok(depotZone && !JSON.stringify(depotZone).includes("43.7149") && !JSON.stringify(depotZone).includes("-1.0502") && depotZone.nomLieu === "Soirée chez Max", "… sa position n'est gardée nulle part telle quelle ; son petit nom, oui");
ok(!(await voir(SAM, "?figurines=1")).lieux?.some((l) => l.id === zone), "« Mes proches » : Sam ne la voit pas");
const zH = (await voir(HUGO, "?figurines=1")).lieux?.find((l) => l.id === zone);
ok(zH?.type === "zone" && zH.nom === "Soirée chez Max" && zH.n === 1 && zH.visages?.[0] === etat?.tetes?.fache, "Hugo (son proche) la voit : la zone floue, son petit nom, sa tête fâchée");
ok((await poster(SAM, { action: "poser", ici: { lat: 43.70, lng: -1.06 }, nomLieu: "12 rue des Lilas", mot: "Coucou", qui: "tous" })).statut === 400, "un petit nom qui est une adresse : refusé");

// ═══ LA REPOSER AU MÊME LIEU LA REMPLACE ; TROIS PAR JOUR ═══
const p4 = garder(await poster(LEA, { action: "poser", lieu: BISTROT, mot: "Finalement, un thé ?", tete: "sourire", qui: "tous" }));
const l4 = garder(await voir(SAM, `?figurines=1&lieu=${BISTROT}`));
ok(p4.statut === 200 && l4.figurines?.filter((f) => f.prenom === "Léa").length === 1 && l4.figurines.find((f) => f.prenom === "Léa")?.mot === "Finalement, un thé ?", "reposée au Bistrot : la nouvelle remplace l'ancienne (une seule par lieu)");
ok((await lire(`${LEA.id}/autour-fig-jour/${jour}.json`))?.n === 2, "… elle ne compte pas deux fois dans la journée (2 sur 3)");
garder(await poster(LEA, { action: "poser", ici: { lat: 43.73, lng: -1.03 }, mot: "Un peu d’air", qui: "moi" }));
const trop = garder(await poster(LEA, { action: "poser", ici: { lat: 43.69, lng: -1.08 }, mot: "Et une quatrième", qui: "tous" }));
ok(trop.statut === 429 && /Trois figurines/.test(trop.error ?? ""), "une quatrième dans la journée : refusée");

// ═══ PASSÉES 24 H : ELLE S'EN VA ═══
const vieille = `${(Date.now() - 25 * 3600_000).toString(36).padStart(8, "0")}abcd`;
await json(`autour-fig/dax/${BISTROT}/${vieille}.tous.${ANA.id}.json`, { id: vieille, h: ANA.id, le: new Date(Date.now() - 25 * 3600_000).toISOString(), qui: "tous", mot: "Hier soir", tete: "humeur" });
ok(!(await voir(SAM, `?figurines=1&lieu=${BISTROT}`)).figurines?.some((f) => f.id === vieille), "posée il y a 25 heures : elle ne se montre plus");

// ═══ SIGNALER ═══
const s1 = garder(await poster(SAM, { action: "signaler-pose", lieu: BISTROT, id: p2.id }));
ok(s1.statut === 200 && !(await voir(SAM, `?figurines=1&lieu=${BISTROT}`)).figurines?.some((f) => f.id === p2.id), "Sam signale la figurine de Hugo : il ne la voit plus");
ok((await voir(ANA, `?figurines=1&lieu=${BISTROT}`)).figurines?.some((f) => f.id === p2.id), "… les autres, si (un signalement ne suffit pas)");
await poster(ANA, { action: "signaler-pose", lieu: BISTROT, id: p2.id });
await poster(BEN, { action: "signaler-pose", lieu: BISTROT, id: p2.id });
ok(!(await voir(LEA, `?figurines=1&lieu=${BISTROT}`)).figurines?.some((f) => f.id === p2.id), "trois signalements de trois personnes : elle s'en va pour tous");
ok((await poster(LEA, { action: "signaler-pose", lieu: BISTROT, id: p4.id })).statut === 400, "sa propre figurine : on la retire, on ne la signale pas");

// ═══ RETIRER ═══
garder(await poster(LEA, { action: "retirer-pose", id: p4.id }));
ok(!(await voir(SAM, `?figurines=1&lieu=${BISTROT}`)).figurines?.some((f) => f.prenom === "Léa"), "Léa retire la sienne : partie du Bistrot");
ok((await voir(SAM, "?figurines=1")).lieux?.find((l) => l.id === BISTROT)?.n === 0, "… la carte le dit (le Bistrot, personne)");

// ═══ UNE FIGURINE DE L'ANCIEN STYLE (UNE SEULE IMAGE) SE POSE AUSSI ═══
const ZOE = qui(6, "Zoé");
await semer("human_habitants", [{ id: ZOE.id, device_token: ZOE.jeton, prenom: ZOE.prenom, ville_slug: "dax" }]);
await deposer(`${ZOE.id}/neutre-essai.png`, PNG, "image/png");
await json(`${ZOE.id}/majeur.json`, { le: maintenant, age: 30 });
await semer("clik_ma_figurine", [{ habitant_id: ZOE.id, prenom: ZOE.prenom, photo: `${ZOE.id}/photo.jpg`, accord_le: maintenant, neutre: `${ZOE.id}/neutre-essai.png`, parle: `${ZOE.id}/neutre-essai.png`, prete_le: maintenant }]);
const p5 = garder(await poster(ZOE, { action: "poser", lieu: BISTROT, mot: "Je passe vers midi", qui: "tous" }));
const zoe = (await voir(SAM, `?figurines=1&lieu=${BISTROT}`)).figurines?.find((f) => f.id === p5.id);
ok(p5.statut === 200 && zoe && !zoe.corps && zoe.image && zoe.tete === zoe.image, "une figurine de l'ancien style se pose aussi : on la montre entière (une seule image)");
ok(Boolean((await voir(ZOE, "?mesTetes=1")).tetes?.habituelle), "… et « Quelle tête » a sa tête habituelle");

// ═══ SANS COMPTE ; LES MÈMES D'AVANT ═══
ok((await poster({ jeton: "personne" }, { action: "poser", lieu: BISTROT, mot: "Coucou" })).statut === 403, "sans figurine sur ce téléphone : refusé");
const anciens = garder(await voir(SAM, ""));
ok(Array.isArray(anciens.lieux) && Array.isArray(anciens.derniers), "la carte des mèmes répond toujours (rien n'est cassé)");

ok(!/exemple/i.test(JSON.stringify(tous)), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} échec(s)` : "\nla figurine posée tient ✓");
process.exit(echecs ? 1 : 0);
