// 👻 MA FAMILLE, AU COMPTOIR — la route (`api/site-internet/pro/famille`) puis l'écran, contre le faux Supabase.
//
// Chez Bergine (commerce de démonstration des essais) : six fantômes, dont deux arrivés aujourd'hui ; un record de 5
// hier ; Léa en or (cinq passages), Hugo en argent (un passage) ; douze ouvertures de sa page (`/f/<lien>`), plus la
// sienne (`?moi=1`, qui ne compte pas) ; deux petits mots récents et un vieux. Puis ce que la route doit tenir : le
// jeton, la foule, les nouveaux, les paliers, ses fidèles (l'or d'abord), son parcours de la semaine, les mots
// d'aujourd'hui et d'hier ; « épingler » (un mot du jour à la fois, jamais le mot d'un autre commerce, le retirer),
// et le mot du jour sur la route publique ; le numéro et le palier dans le carnet. Puis l'écran : la carte en tête
// de l'accueil, « Ma famille » (la foule, son lien, les écussons, le parcours en pourcentages), épingler un mot, le
// palier dans le carnet, et le mot du jour en haut de sa page. Puis 🎁 « Je te gâte » (jamais d'alcool, la limite du
// mois sur les cadeaux des petits mots, ce qu'il en reste sur sa page) et 🔔 le bon plan (chez Lou : l'or le voit tout
// de suite, le bronze 40 minutes après, un visiteur jamais ; un nouveau remplace l'ancien ; « C'est complet »), puis
// les mêmes gestes depuis l'écran. Rien ne déborde, aucune erreur.
import { BASE, D, F, lancer } from "./commun.mjs";
import { SITES } from "./semer.mjs";

const SITE = SITES.bergine.id;
const SLUG = SITES.bergine.slug;
const R = `${BASE}/api/site-internet/pro/famille`;
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const AUJ = jour(new Date());
/** n jours de calendrier avant aujourd'hui (pas des tranches de 24 h : le passage à l'heure d'hiver). */
const ilYa = (n) => {
  const d = new Date(`${AUJ}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const h = (k) => `bbbbbbbb-1111-4000-8000-00000000000${k}`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });

await semer("human_vitrine_sites", Object.values(SITES));
// SIX FANTÔMES : quatre d'avant, deux arrivés aujourd'hui (Nina, Sami).
await semer(
  "clik_cage",
  [
    ["Léa", "cosy", 1, 20],
    ["Hugo", "denim", 2, 15],
    ["Inès", "artiste", 3, 10],
    ["Karim", "voyageur", 4, 5],
    ["Nina", "fleuri", 5, 0],
    ["Sami", "soleil", 6, 0],
  ].map(([prenom, look, k, jours]) => ({
    site_id: SITE,
    habitant_id: h(k),
    film: "page",
    cage: k === 2 ? "un-jour" : "adore",
    prenom,
    look,
    created_at: jours ? new Date(`${ilYa(jours)}T10:00:00Z`).toISOString() : new Date(Date.now() - (7 - k) * 60_000).toISOString(),
    updated_at: new Date().toISOString(),
  })),
);
await semer("clik_presence", [
  ...[1, 2, 3, 4, 5].map((k) => ({ site_id: SITE, habitant_id: h(k), jour: ilYa(1) })),
  ...[1, 2].map((k) => ({ site_id: SITE, habitant_id: h(k), jour: ilYa(3) })),
  ...[1, 5, 6].map((k) => ({ site_id: SITE, habitant_id: h(k), jour: AUJ })),
]);
// Léa : cinq passages (or) ; Hugo : un (argent).
await semer("clik_visite", [...[0, 1, 2, 3, 4].map((n) => ({ site_id: SITE, habitant_id: h(1), jour: ilYa(n) })), { site_id: SITE, habitant_id: h(2), jour: ilYa(2) }]);
await semer("clik_mot", [
  { site_id: SITE, habitant_id: h(1), texte: "Ma nouvelle adresse préférée 💛", liste: false, jour: AUJ },
  { site_id: SITE, habitant_id: h(2), texte: "Merci pour l’accueil de samedi !", liste: false, jour: ilYa(1), created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { site_id: SITE, habitant_id: h(3), texte: "Un vieux mot", liste: false, jour: ilYa(4), created_at: new Date(Date.now() - 4 * 86_400_000).toISOString() },
]);
// UN MOT D'UN AUTRE COMMERCE, qu'on ne doit pas pouvoir épingler ici.
await semer("clik_mot", { id: "eeeeeeee-2222-4000-8000-000000000001", site_id: SITES.lou.id, habitant_id: h(1), texte: "Ailleurs", liste: false, jour: AUJ });

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const pro = async (corps, token = "jeton-test") => {
  const r = await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token, ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// DOUZE OUVERTURES DE SA PAGE, ET LA SIENNE (QUI NE COMPTE PAS).
for (let i = 0; i < 12; i++) await fetch(`${BASE}/f/${SLUG}`);
await fetch(`${BASE}/f/${SLUG}?moi=1`);
await new Promise((r) => setTimeout(r, 1500));

// ═══ LA ROUTE ═══
ok((await pro({}, "mauvais")).statut === 403, "un mauvais jeton : refusé");
let f = await pro({ action: "lire" });
ok(f.statut === 200 && f.aujourdhui === 3 && f.hier === 5 && f.record === 5 && f.membres === 6, `la foule : 3 aujourd'hui, 5 hier, record 5, 6 membres (${f.aujourdhui}/${f.hier}/${f.record}/${f.membres})`);
ok(f.nouveaux === 2, `deux nouveaux aujourd'hui (${f.nouveaux})`);
ok(f.paliers?.or === 1 && f.paliers?.argent === 1 && f.paliers?.bronze === 4, `les paliers : 1 or, 1 argent, 4 bronze (${JSON.stringify(f.paliers)})`);
ok(f.fideles?.length === 2 && f.fideles[0].prenom === "Léa" && f.fideles[0].grade === "or" && f.fideles[0].numero === 1 && f.fideles[1].prenom === "Hugo", `ses fidèles, l'or d'abord (${(f.fideles ?? []).map((x) => `${x.prenom}/${x.grade}`)})`);
ok(f.parcours?.pages === 12 && f.parcours?.cages === 6 && f.parcours?.venues === 2, `son parcours : 12 pages, 6 fantômes, 2 venus (${JSON.stringify(f.parcours)})`);
ok(f.mots?.length === 2 && f.epinglable === true && f.motDuJour === null, `les mots d'aujourd'hui et d'hier, pas le vieux (${(f.mots ?? []).map((m) => m.texte)})`);
ok(!JSON.stringify(f).includes(h(1)), "jamais l'identifiant de personne");

const motHugo = f.mots.find((m) => m.prenom === "Hugo");
const motLea = f.mots.find((m) => m.prenom === "Léa");
f = await pro({ action: "epingler", id: motHugo.id });
ok(f.statut === 200 && f.motDuJour?.texte === "Merci pour l’accueil de samedi !" && f.mots.filter((m) => m.epingle).length === 1, "épingler le mot d'Hugo : le mot du jour");
let pub = await (await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`)).json();
ok(pub.motDuJour?.prenom === "Hugo" && pub.motDuJour?.numero === 2 && pub.motDuJour?.grade === "argent", `sur sa page : le mot, Hugo, n°2, argent (${JSON.stringify(pub.motDuJour)})`);
f = await pro({ action: "epingler", id: motLea.id });
ok(f.motDuJour?.texte === "Ma nouvelle adresse préférée 💛" && f.mots.filter((m) => m.epingle).length === 1, "en épingler un autre le remplace (un par jour)");
ok((await pro({ action: "epingler", id: "eeeeeeee-2222-4000-8000-000000000001" })).statut === 400, "le mot d'un autre commerce : refusé");
f = await pro({ action: "epingler", id: "" });
ok(f.statut === 200 && f.motDuJour === null && f.mots.every((m) => !m.epingle), "le retirer");
pub = await (await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`)).json();
ok(pub.motDuJour === null, "et sa page n'en a plus");

const carnet = await (await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "jeton-test", action: "lire" }) })).json();
const lea = (carnet.lignes ?? []).find((l) => l.prenom === "Léa");
ok(lea?.numero === 1 && lea?.grade === "or", `le carnet : Léa, n°1, or (${lea?.numero}/${lea?.grade})`);

// ═══ 🎁 JE TE GÂTE, PAR LA ROUTE ═══
const carnetPro = async (corps) =>
  (await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "jeton-test", ...corps }) })).json().then((j) => j);
ok((await pro({ action: "gate", quoi: "un verre de vin", combien: 3 })).statut === 400, "un cadeau d'alcool : refusé (loi Évin)");
f = await pro({ action: "gate", quoi: "le café", combien: 2 });
ok(f.statut === 200 && f.gate?.quoi === "le café" && f.gate?.combien === 2 && f.gate?.offerts === 0, `ce mois-ci : 2 × le café (${JSON.stringify(f.gate)})`);
pub = await (await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`)).json();
ok(pub.gate?.quoi === "le café" && pub.gate?.reste === 2, `sa page : encore 2 à offrir (${JSON.stringify(pub.gate)})`);
const tousMots = (await carnetPro({ action: "mots" })).mots ?? [];
const parTexte = (debut) => tousMots.find((m) => m.texte.startsWith(debut));
const offrir = async (m) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/carnet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "jeton-test", action: "offrir", id: m.id, cadeau: "le café" }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
ok((await offrir(parTexte("Ma nouvelle"))).statut === 200 && (await offrir(parTexte("Merci pour"))).statut === 200, "deux cafés offerts sur leurs petits mots");
const trop = await offrir(parTexte("Un vieux"));
ok(trop.statut === 409 && /2 × le café/.test(trop.error ?? ""), `le troisième : refusé, il a tout offert (${trop.statut}, « ${trop.error} »)`);
f = await pro({ action: "lire" });
pub = await (await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`)).json();
ok(f.gate?.offerts === 2 && pub.gate === null, `il en reste 0 : sa page n'en parle plus (${f.gate?.offerts}, ${JSON.stringify(pub.gate)})`);

// ═══ 🔔 LE BON PLAN, PAR LA ROUTE — chez Lou, pour ne pas toucher à la famille de Bergine ═══
const LOU = SITES.lou.slug;
const proLou = async (corps) => {
  const r = await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: LOU, token: "jeton-test", ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const cookies = {};
for (const qui of ["Olga", "Paul"]) {
  const r = await fetch(`${BASE}/api/direct/cage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: LOU, film: "page", cage: "adore", prenom: qui }) });
  cookies[qui] = (r.headers.get("set-cookie") ?? "").split(";")[0];
}
const olga = (await (await fetch(`${F}/clik_cage?site_id=eq.${SITES.lou.id}`)).json()).find((c) => c.prenom === "Olga")?.habitant_id;
await semer("clik_visite", [0, 1, 2, 3, 4].map((n) => ({ site_id: SITES.lou.id, habitant_id: olga, jour: ilYa(n) })));
const vueDe = async (qui) => (await (await fetch(`${BASE}/api/direct/famille?slug=${LOU}`, { headers: { cookie: (qui && cookies[qui]) || "" } })).json()).bonPlan;
ok((await proLou({ action: "bon-plan", texte: "Le vin est à moitié prix", duree: "1h" })).statut === 400, "un bon plan d'alcool : refusé (loi Évin)");
ok((await proLou({ action: "bon-plan", texte: "Un créneau", duree: "2j" })).statut === 400, "une durée inconnue : refusée");
let fl = await proLou({ action: "bon-plan", texte: "Un créneau vient de se libérer à 15 h", duree: "1h" });
const o = fl.bonPlan?.ouvertures ?? {};
ok(fl.statut === 200 && fl.bonPlan?.texte === "Un créneau vient de se libérer à 15 h" && Date.parse(o.argent) - Date.parse(o.or) === 20 * 60_000 && Date.parse(o.bronze) - Date.parse(o.or) === 40 * 60_000, `le bon plan : l'or tout de suite, l'argent +20 min, le bronze +40 min (${JSON.stringify(o)})`);
let v = await vueDe(null);
ok(v && v.membre === false && v.ouvert === false && v.texte === undefined, `un visiteur : « pour la famille », sans le texte (${JSON.stringify(v)})`);
v = await vueDe("Olga");
ok(v?.grade === "or" && v.ouvert === true && v.texte === "Un créneau vient de se libérer à 15 h", `Olga, en or : elle le voit tout de suite (${v?.grade}/${v?.ouvert})`);
v = await vueDe("Paul");
ok(v?.grade === "bronze" && v.ouvert === false && v.texte === undefined && v.ouvertA === o.bronze, `Paul, en bronze : pas encore, à l'heure du bronze (${JSON.stringify(v)})`);
await fetch(`${F}/clik_bon_plan?id=eq.${fl.bonPlan.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ publie_le: new Date(Date.now() - 45 * 60_000).toISOString() }) });
v = await vueDe("Paul");
ok(v?.ouvert === true && v.texte === "Un créneau vient de se libérer à 15 h", "45 minutes après : Paul le voit aussi");
fl = await proLou({ action: "bon-plan", texte: "Deux places cet après-midi", duree: "3h" });
const plans = await (await fetch(`${F}/clik_bon_plan?site_id=eq.${SITES.lou.id}`)).json();
ok(fl.bonPlan?.texte === "Deux places cet après-midi" && plans.filter((x) => !x.retire_le).length === 1, "un nouveau bon plan remplace l'ancien");
fl = await proLou({ action: "bon-plan-retirer" });
ok(fl.statut === 200 && fl.bonPlan === null && (await vueDe("Olga")) === null, "« C'est complet » : il disparaît de sa page");

// ═══ L'ÉCRAN ═══
const b = await lancer();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = async () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

await p.goto(`${BASE}/autour-de-moi/assistante?site=${SLUG}&k=jeton-test`, { waitUntil: "networkidle", timeout: 400000 });
await p.waitForSelector(".fc-carte", { timeout: 60000 });
await p.waitForFunction(() => !document.querySelector(".fc-carte")?.textContent?.includes("…"), null, { timeout: 30000 }).catch(() => {});
const carte = await texte(".fc-carte");
ok(carte.includes("Aujourd’hui 3 · record 5") && carte.includes("+2 nouveaux") && carte.includes("Plus que 3 pour le record"), `la carte : ${carte}`);
ok(await p.evaluate(() => document.querySelector(".ak-actions")?.firstElementChild?.classList.contains("fc-carte")), "en tête de l'accueil");
await p.screenshot({ path: `${D}/famille-comptoir-1-accueil.png` });

await p.locator(".fc-carte").click();
await p.waitForSelector(".fc-foule", { timeout: 20000 });
const ecran = await texte(".fc");
ok(ecran.includes("Plus que 3 pour battre ton record") && ecran.includes("Nouveaux aujourd’hui 2"), "la foule du jour et le record");
ok((await texte(".fc-lien code")) === `clikme.fr/f/${SLUG}`, "son lien");
ok((await texte(".fc-tuile.or")).includes("1") && (await texte(".fc-tuile.bronze")).includes("4"), "les écussons : 1 or, 4 bronze");
ok(ecran.includes("Argent : 1 visite ou 7 jours de cage. Or : 5 visites ou 3 amis amenés."), "la règle des paliers, depuis PALIERS");
ok((await texte(".fc-fideles")).startsWith("Léa n°1 🥇"), `ses fidèles (${await texte(".fc-fideles")})`);
const parcours = await texte(".fc-parcours");
ok(parcours.includes("Ont ouvert ta page 12") && parcours.includes("50 % de ceux qui ont ouvert ta page") && parcours.includes("33 % de ceux qui ont libéré leur fantôme"), `le parcours en pourcentages (${parcours.slice(0, 160)})`);
ok(parcours.includes("Bientôt, avec le numéro de ClikMe"), "WhatsApp : bientôt");

await p.locator(".fc-mot").first().locator("button").click();
await p.waitForSelector(".fc-motdujour", { timeout: 20000 });
ok((await texte(".fc-mot.epingle button")) === "✓ Mot du jour" && (await texte(".fc-motdujour")).includes("Ma nouvelle adresse préférée"), "épingler depuis l'écran");
ok((await debordement()) <= 0, "l'écran ne déborde pas");
await p.screenshot({ path: `${D}/famille-comptoir-2-ecran.png`, fullPage: true });

// 🔔 UN BON PLAN, DEPUIS L'ÉCRAN ; 🎁 CE QU'IL OFFRE CE MOIS-CI.
await p.locator(".fc-bp-ecrire .fc-puces button").first().click();
await p.locator(".fc-bp-ecrire [role=radiogroup] button", { hasText: "1 heure" }).click();
await p.locator(".fc-bonplan .fc-envoyer").click();
await p.waitForSelector(".fc-bp-encours", { timeout: 20000 });
const encours = await texte(".fc-bp-encours");
ok(encours.includes("Il me reste 2 tables ce midi") && encours.includes("🥇 Or") && encours.includes("🥉 Bronze"), `le bon plan en cours, palier par palier (${encours.slice(0, 120)})`);
ok((await texte(".fc-gate-etat")).includes("2 × le café") && (await texte(".fc-gate-etat")).includes("il en reste 0"), `ce qu'il a offert ce mois-ci (${await texte(".fc-gate-etat")})`);
await p.fill(".fc-gate-form input[type=number]", "5");
await p.locator(".fc-gate .fc-envoyer").click();
await p.waitForFunction(() => document.querySelector(".fc-gate-etat")?.textContent?.includes("5 × le café"), null, { timeout: 20000 });
ok((await texte(".fc-gate-etat")).includes("il en reste 3"), "il en ajoute : 5 ce mois-ci, il en reste 3");
ok((await debordement()) <= 0, "l'écran ne déborde toujours pas");
await p.locator(".fc-bonplan").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/famille-comptoir-3-bonplan.png` });

await p.locator(".ck-retour").click();
await p.waitForSelector(".ck-carte", { timeout: 20000 });
await p.locator(".ck-carte").click();
await p.waitForSelector(".ck-palier", { timeout: 20000 });
ok((await texte(".ck-palier.or")) === "n°1 🥇", `le carnet : le palier de Léa (${await texte(".ck-palier.or")})`);

await p.locator(".ck-retour").click();
await p.waitForSelector(".fc-carte", { timeout: 20000 });
ok((await texte(".fc-carte")).includes("🔔 Bon plan en cours"), "la carte de l'accueil : bon plan en cours");
await p.locator(".pm-carte").click();
await p.waitForSelector(".pm-offert", { timeout: 20000 });
ok((await texte(".pm")).includes("tu peux encore offrir 3 × le café"), "ses petits mots : ce qu'il peut encore offrir");

const page = await ctx.newPage();
await page.goto(`${BASE}/f/${SLUG}?moi=1`, { waitUntil: "networkidle" });
await page.waitForSelector(".fm-motdujour", { timeout: 30000 });
ok((await page.locator(".fm-motdujour").innerText()).includes("Ma nouvelle adresse préférée"), "le mot du jour en haut de sa page");
const bp = (await page.locator(".fm-bonplan").innerText()).replace(/\s+/g, " ");
ok(bp.includes("🔒 Un bon plan vient de sortir") && bp.includes("Il est pour sa famille : ouvre une cage") && !bp.includes("2 tables"), `un visiteur : le bon plan, fermé (${bp})`);
ok((await page.locator(".fm-gate").innerText()).includes("encore 3 × le café"), "un visiteur : ce que la maison peut encore offrir");
await page.screenshot({ path: `${D}/famille-comptoir-4-page.png` });
await new Promise((r) => setTimeout(r, 1000));
const comptes = await (await fetch(`${F}/human_compteurs_jour?site_id=eq.${SITE}`)).json();
ok(comptes.reduce((n, c) => n + (c.famille || 0), 0) === 12, "sa page ouverte depuis son comptoir ne compte pas");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
