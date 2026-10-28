// 🎁 LA SURPRISE DU CHEF — la route du comptoir, la route de la page, puis la cage dorée et le comptoir, contre le faux Supabase.
//
// La Table des Fantômes (commerce inventé des essais) prévoit deux surprises, une de chaque. Ce qui doit tenir : jamais
// d'alcool ; un stock entre 1 et 50 ; la cage seulement pour la famille ; une surprise tirée par personne et par jour,
// gardée (rouvrir ne la change pas) ; « Je prends ça » en retire une du stock ; la dernière ne part pas deux fois ;
// plus de stock, plus de surprise ; le comptoir voit qui a pris quoi. Puis la cage dorée dans un téléphone, et la
// saisie au comptoir. Pas de priorité de palier : le premier qui ouvre tire.
import { BASE, D, F, lancer } from "./commun.mjs";

const SITE = "88888888-0000-4000-8000-000000000041";
const SLUG = "table-des-fantomes-dax";
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
await semer("human_vitrine_sites", { id: SITE, slug: SLUG, channel: "letter", business_name: "La Table des Fantômes", city: "Dax", activite: "Restaurant", published: true, est_client: true, pro_token: "jeton-test", diagnostic: {}, metadata: {}, gallery_photos: [], services: [], assistant_kb: {}, contact_prenom: "" });

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const cookies = {};
for (const qui of ["Olga", "Paul", "Zoé"]) {
  const r = await fetch(`${BASE}/api/direct/cage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, film: "page", cage: "adore", prenom: qui }) });
  cookies[qui] = (r.headers.get("set-cookie") ?? "").split(";")[0];
}
const pro = async (corps) => {
  const r = await fetch(`${BASE}/api/site-internet/pro/famille`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "jeton-test", ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const geste = async (qui, action) => {
  const r = await fetch(`${BASE}/api/direct/famille`, { method: "POST", headers: { "content-type": "application/json", cookie: (qui && cookies[qui]) || "" }, body: JSON.stringify({ slug: SLUG, action }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const vue = async (qui) => (await (await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`, { headers: { cookie: (qui && cookies[qui]) || "" } })).json()).surprise;

// ═══ LA ROUTE DU COMPTOIR ═══
ok((await pro({ action: "surprises", liste: [{ libelle: "Un verre de vin offert", stock: 2 }] })).statut === 400, "une surprise d'alcool : refusée (loi Évin)");
ok((await pro({ action: "surprises", liste: [{ libelle: "Le café offert", stock: 0 }] })).statut === 400, "un stock de 0 : refusé");
let s = await pro({ action: "surprises", liste: [{ libelle: "Le café offert", stock: 1 }, { libelle: "Un café gourmand", stock: 1 }] });
ok(s.statut === 200 && s.surprises?.length === 2 && s.surprises.every((x) => x.pris === 0), `ses deux surprises du jour (${JSON.stringify(s.surprises)})`);

// ═══ LA ROUTE DE LA PAGE ═══
ok((await vue(null)) === null, "un visiteur : pas de cage dorée");
ok((await geste(null, "surprise-ouvrir")).statut === 403, "un visiteur ne l'ouvre pas : « Ouvre d'abord une cage »");
let v = await vue("Olga");
ok(v?.reste === 2 && v.moi === null, `la famille : la cage dorée, encore 2 (${JSON.stringify(v)})`);
const o1 = await geste("Olga", "surprise-ouvrir");
const o2 = await geste("Olga", "surprise-ouvrir");
ok(o1.statut === 200 && ["Le café offert", "Un café gourmand"].includes(o1.libelle) && o2.libelle === o1.libelle && o1.prise === false, `Olga ouvre : « ${o1.libelle} », et la rouvrir ne la change pas`);
ok((await vue("Olga"))?.reste === 2, "ouvrir ne retire rien du stock");
const p1 = await geste("Olga", "surprise-prendre");
v = await vue("Olga");
ok(p1.statut === 200 && p1.libelle === o1.libelle && v?.reste === 1 && v.moi?.prise === true, `« Je prends ça » : à elle, il en reste 1 (${JSON.stringify(v)})`);
ok((await geste("Olga", "surprise-ouvrir")).libelle === o1.libelle, "une par personne : elle retrouve la sienne");
const o3 = await geste("Paul", "surprise-ouvrir");
ok(o3.libelle && o3.libelle !== o1.libelle, `Paul tire celle qui reste (« ${o3.libelle} »)`);
// LA DERNIÈRE NE PART PAS DEUX FOIS : Zoé tire la même que Paul (c'est la seule qui reste), et ils la prennent en même temps
ok((await geste("Zoé", "surprise-ouvrir")).libelle === o3.libelle, "Zoé tire la même : c'est la seule qui reste");
const [a, b] = await Promise.all([geste("Paul", "surprise-prendre"), geste("Zoé", "surprise-prendre")]);
const lignes = await (await fetch(`${F}/clik_surprise?site_id=eq.${SITE}&retire_le=is.null`)).json();
ok([a, b].filter((x) => x.statut === 200).length === 1 && lignes.every((x) => x.pris <= x.stock), `la dernière ne part qu'une fois (${a.statut}/${b.statut}, ${lignes.map((x) => `${x.pris}/${x.stock}`)})`);
const perdant = a.statut === 200 ? b : a;
ok(perdant.statut === 409 && /Trop tard/.test(perdant.error ?? ""), `l'autre : « Trop tard, elle vient de partir » (${perdant.error})`);
ok((await geste(a.statut === 200 ? "Zoé" : "Paul", "surprise-ouvrir")).statut === 409 && (await vue("Zoé"))?.reste === 0, "plus de stock : plus de surprise");
s = await pro({ action: "surprises-lire" });
ok(s.prises?.length === 2 && s.prises.every((x) => x.prenom && x.numero > 0) && !/[0-9a-f]{8}-[0-9a-f]{4}-/.test(JSON.stringify(s.prises)), `le comptoir voit qui a pris quoi, sans identifiant (${JSON.stringify(s.prises)})`);

// ═══ LA CAGE DORÉE, DANS UN TÉLÉPHONE ═══
await pro({ action: "surprises", liste: [{ libelle: "Un dessert offert", stock: 1 }] });
const nav = await lancer();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(`${BASE}/f/${SLUG}`, { waitUntil: "networkidle", timeout: 400000 });
await p.waitForSelector(".fm-cage-b", { timeout: 60000 });
await p.locator(".fm-cage-b").first().click();
await p.fill("#fm-prenom", "Lina");
await p.locator(".fm-fiche button[type=submit]").click();
await p.waitForSelector(".fm-surprise.cage", { timeout: 20000 });
ok((await p.locator(".fm-surprise.cage").innerText()).includes("Encore 1 aujourd’hui"), "sur sa page : la cage dorée, encore 1");
await p.locator(".fm-surprise.cage").click();
await p.waitForSelector(".fm-surprise.ouverte", { timeout: 15000 });
ok((await p.locator(".fm-surprise.ouverte").innerText()).includes("Un dessert offert"), "elle s'ouvre : « Un dessert offert »");
await p.locator(".fm-surprise.ouverte").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/surprise-1-ouverte.png` });
await p.locator(".fm-surprise.ouverte button").click();
await p.waitForSelector(".fm-surprise.prise", { timeout: 15000 });
ok((await p.locator(".fm-surprise.prise").innerText()).includes("Elle est à toi"), "« Je prends ça » : elle est à toi, dis-le au comptoir");
ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "la page ne déborde pas");

// ═══ AU COMPTOIR ═══
const q = await ctx.newPage();
q.on("pageerror", (e) => erreurs.push(String(e)));
await q.goto(`${BASE}/autour-de-moi/assistante?site=${SLUG}&k=jeton-test`, { waitUntil: "networkidle", timeout: 400000 });
await q.waitForSelector(".fc-carte", { timeout: 60000 });
await q.waitForFunction(() => !document.querySelector(".fc-carte")?.textContent?.includes("…"), null, { timeout: 30000 }).catch(() => {});
for (let essai = 0; essai < 3 && !(await q.locator(".fc-foule").count()); essai++) {
  await q.locator(".fc-carte").click();
  await q.waitForSelector(".fc-foule", { timeout: 15000 }).catch(() => {});
}
await q.screenshot({ path: `${D}/surprise-2-ecran.png` });
await q.waitForSelector(".fc-surprise", { timeout: 30000 });
const comptoir = (await q.locator(".fc-surprise").innerText()).replace(/\s+/g, " ");
ok(comptoir.includes("La surprise du chef") && comptoir.includes("Un dessert offert 1/1") && comptoir.includes("Lina"), `au comptoir : ses surprises et qui les a prises (${comptoir.slice(0, 160)})`);
await q.locator(".fc-surprise").scrollIntoViewIfNeeded();
await q.screenshot({ path: `${D}/surprise-2-comptoir.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await nav.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
