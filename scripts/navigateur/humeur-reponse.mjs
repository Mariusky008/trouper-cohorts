// ☀️ MA FIGURINE ME RÉPOND — lot R3 du rituel du jour (`lib/direct/humeur-reponse.ts`, `humeur-reponse-serveur.ts`,
// `app/collection/humeur-reponse.tsx`), contre le faux Supabase, jamais la vraie base.
//
// Léa était en colère hier ; ce matin, la joie : sa figurine prend sa tête de joie et lui dit, tout de suite, la
// remontée — « 📲 Envoyer ma tête du jour » ouvre le studio avec ce visage et « Ma tête du jour ☀️ Et toi, ça va ? ».
// Hugo en est à son troisième jour difficile : le mot doux à part, le 3114 en petit, et « ✨ Faire un vœu », discret,
// qui ouvre « Mon vœu ». Max a déjà un vœu en route : sur sa colère, une phrase douce et « 💬 Écrire à un proche ». Zoé
// passe la feuille, puis choisit l'amour en haut de « Proches » : sa figurine lui répond là ; « 😍 Le mème « Je
// t'aime » » ouvre le studio avec ce mème prêt et son visage d'amour. La même humeur redemandée : la même phrase. Rien
// ne déborde, jamais le mot interdit, aucune erreur dans la page. (Le dimanche et les règles fines : sans téléphone,
// `scripts/verifier-humeur.mjs`.)
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json().catch(() => null) : null;
};
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const avant = (n) => {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

const qui = (n, prenom) => ({ id: `cdcdcdcd-0000-4000-8000-0000000011${String(n).padStart(2, "0")}`, jeton: `jeton-humeur-r3-00000000000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const HUGO = qui(2, "Hugo");
const MAX = qui(3, "Max");
const ZOE = qui(4, "Zoé");
const GENS = [LEA, HUGO, MAX, ZOE];
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.webp`, img("pied/salut-1"), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img("pied/salut-1"), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15, adulte: true });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
// (leurs visages déjà faits : la joie de Léa, l'amour de Zoé)
const dossierExpr = (h) => `${h}/expr-${crypto.createHash("sha1").update(`${h}/neutre-essai.webp`).digest("hex").slice(0, 16)}`;
for (const [x, cle, nom] of [
  [LEA, "joie", "pied/salut-2"],
  [ZOE, "amour", "content"],
]) {
  await deposer(`${dossierExpr(x.id)}/${cle}-n.webp`, img(nom), "image/webp");
  await deposer(`${dossierExpr(x.id)}/${cle}-p.webp`, img(nom), "image/webp");
}
// (leurs humeurs d'avant : Léa en colère hier ; Hugo, deux jours difficiles)
await json(`${LEA.id}/humeurs.json`, { jours: { [avant(1)]: "colere" } });
await json(`${HUGO.id}/humeurs.json`, { jours: { [avant(1)]: "tristesse", [avant(2)]: "colere" } });
// (Max a un vœu en route)
await semer("clik_voeu", [{ id: "voeumaxr3001", habitant_id: MAX.id, texte: "Quelqu’un pour un footing le samedi", categorie: "bouger", ville_slug: "dax", adulte: true, a_distance: false, cree_le: new Date().toISOString() }]);

const b = await lancer({ humeur: true });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (q) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const voir = async (p) => p.evaluate(async () => (await (await fetch("/api/direct/rituel", { cache: "no-store" })).json()));
/** La feuille du matin, et un toucher sur une humeur. */
async function matin(p, humeur) {
  await p.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
  await fermerPablito(p);
  await p.waitForSelector(".rt-feuille .rt-visages button", { timeout: 60000 });
  const t0 = Date.now();
  await p.locator(`.rt-feuille .rt-visages button[data-humeur="${humeur}"]`).click();
  await p.waitForSelector(".rt-feuille .rr .rr-bulle", { timeout: 15000 });
  return Date.now() - t0;
}
const PHRASES = (h) => {
  const src = fs.readFileSync("src/lib/direct/humeur-reponse.ts", "utf8");
  const bloc = src.slice(src.indexOf(`  ${h}: [`), src.indexOf("],", src.indexOf(`  ${h}: [`)));
  return [...bloc.matchAll(/"([^"]+)"/g)].map((m) => plat(m[1]));
};

// ═══ LÉA : HIER LA COLÈRE, AUJOURD'HUI LA JOIE ═══
const lea = await tel(LEA);
const delai = await matin(lea, "joie");
const bulleLea = await texte(lea, ".rt-feuille .rr-bulle");
ok(delai < 5000 && /^Ta figurine (Hier la colère, aujourd’hui la joie : belle remontée !|Quelle remontée depuis hier ! Ça me fait chaud au cœur\.)$/i.test(bulleLea), `tout de suite (${delai} ms), sa figurine lui répond, la veille en tête : « ${bulleLea} »`);
const srcLea = (await lea.locator(".rt-feuille .rr-fig img").getAttribute("src")) ?? "";
ok(srcLea.includes("joie-n") && (await lea.locator(".rt-feuille .rr-fig i").count()) === 0, "avec SA tête de joie (déjà faite)");
ok((await texte(lea, ".rt-feuille .rr-geste")) === "📲 Envoyer ma tête du jour" && !(await lea.locator(".rt-feuille .rr-geste.discret").count()) && (await lea.locator(".rt-feuille .rr-aide").count()) === 0, "« 📲 Envoyer ma tête du jour » ; pas de 3114");
const histLea = await lireStock(`${LEA.id}/humeurs.json`);
ok(histLea?.jours?.[jour] === "joie" && histLea.jours[avant(1)] === "colere" && histLea.dernier?.jour === jour && histLea.souvenirLe === jour, "gardé : ses humeurs (hier, aujourd'hui), la réponse du jour");
ok((await debordement(lea)) <= 0, "la feuille ne déborde pas");
await lea.waitForTimeout(900); // (la bulle entre en 0,75 s)
await lea.screenshot({ path: `${D}/humeur-r3-1-lea.png` });
const vu = await voir(lea);
ok(plat(vu.reponse?.texte) === bulleLea.replace(/^Ta figurine /i, "") && vu.reponse?.geste === "envoyer", "relue (la page rechargée la retrouve)");
await lea.locator(".rt-feuille .rr-geste").click();
await lea.waitForSelector("#o-figurine:not([hidden]) .tf-texte textarea", { timeout: 30000 });
await lea.waitForFunction(() => document.querySelector("#o-figurine .tf-v.pris")?.getAttribute("data-cle") === "joie", null, { timeout: 15000 }).catch(() => null);
ok(
  (await lea.locator("#o-figurine .tf-texte textarea").inputValue()) === "Ma tête du jour ☀️ Et toi, ça va ?" && (await lea.locator('#o-figurine .tf-v.pris[data-cle="joie"]').count()) === 1 && (await lea.locator(".rt-feuille.ouverte, .rt-feuille[open]").count()) === 0,
  "« Envoyer ma tête du jour » : la feuille se ferme, le studio s'ouvre avec sa tête de joie et « Ma tête du jour ☀️ Et toi, ça va ? »",
);
await lea.screenshot({ path: `${D}/humeur-r3-2-studio.png` });

// ═══ HUGO : LE TROISIÈME JOUR DIFFICILE ═══
const hugo = await tel(HUGO);
await matin(hugo, "tristesse");
ok((await texte(hugo, ".rt-feuille .rr-bulle")).replace(/^Ta figurine /i, "") === "Trois jours que c’est lourd. Je reste là, tout près, aussi longtemps qu’il faut." && (await hugo.locator(".rt-feuille .rr.doux").count()) === 1, "Hugo, troisième jour difficile : le mot doux à part");
ok((await texte(hugo, ".rt-feuille .rr-aide")) === "Si ça ne va vraiment pas, le 3114 répond jour et nuit." && (await hugo.locator('.rt-feuille .rr-aide a[href="tel:3114"]').count()) === 1, "le 3114 en petit, qu'un toucher appelle");
ok((await texte(hugo, ".rt-feuille .rr-geste.discret")) === "✨ Faire un vœu" && (await hugo.locator(".rt-feuille .rr-fig i").count()) === 1, "« ✨ Faire un vœu », discret ; sa tête triste pas encore faite : sa figurine et l'emoji");
await hugo.waitForTimeout(900);
await hugo.screenshot({ path: `${D}/humeur-r3-3-hugo.png` });
await hugo.locator(".rt-feuille .rr-geste").click();
await hugo.waitForSelector("#o-decouvrir:not([hidden]) #voeu", { timeout: 30000 });
ok(true, "« Faire un vœu » ouvre « Mon vœu », dans « Découvrir »");

// ═══ MAX : UN VŒU DÉJÀ EN ROUTE ═══
const max = await tel(MAX);
await matin(max, "colere");
const bulleMax = (await texte(max, ".rt-feuille .rr-bulle")).replace(/^Ta figurine /i, "");
ok(PHRASES("colere").includes(bulleMax) && (await texte(max, ".rt-feuille .rr-geste.discret")) === "💬 Écrire à un proche", `Max (sa colère, un vœu déjà en route) : « ${bulleMax} » et « 💬 Écrire à un proche »`);
await max.locator(".rt-feuille .rr-geste").click();
await max.waitForFunction(() => location.hash === "#proches", null, { timeout: 15000 });
ok(await max.waitForSelector("#o-proches:not([hidden])", { timeout: 15000 }).then(() => true).catch(() => false), "« Écrire à un proche » ouvre « Proches »");

// ═══ ZOÉ : « PAS MAINTENANT », PUIS L'AMOUR EN HAUT DE « PROCHES » ═══
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await fermerPablito(zoe);
await zoe.waitForSelector(".rt-feuille .rt-passer", { timeout: 60000 });
await zoe.locator(".rt-feuille .rt-passer").click();
await zoe.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(zoe, "#o-proches");
await zoe.waitForSelector('#o-proches .rt-bloc .rt-visages button[data-humeur="amour"]', { timeout: 30000 });
await zoe.locator('#o-proches .rt-bloc .rt-visages button[data-humeur="amour"]').click();
await zoe.waitForSelector("#o-proches .rr.petit .rr-bulle", { timeout: 15000 });
const bulleZoe = (await texte(zoe, "#o-proches .rr-bulle")).replace(/^Ta figurine /i, "");
ok(PHRASES("amour").includes(bulleZoe) && (await texte(zoe, "#o-proches .rr-geste")) === "😍 Le mème « Je t’aime »" && ((await zoe.locator("#o-proches .rr-fig img").getAttribute("src")) ?? "").includes("amour-n"), `en haut de « Proches », sa figurine lui répond aussi : « ${bulleZoe} », « 😍 Le mème « Je t'aime » »`);
await zoe.waitForTimeout(900);
await zoe.screenshot({ path: `${D}/humeur-r3-4-proches.png` });
const encore = await zoe.evaluate(async () => (await (await fetch("/api/direct/rituel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "humeur", visage: "amour" }) })).json()));
ok(plat(encore.reponse?.texte) === bulleZoe, "la même humeur redemandée : la même phrase");
await zoe.locator("#o-proches .rr-geste").click();
await zoe.waitForSelector("#o-figurine:not([hidden]) .tf-texte textarea", { timeout: 30000 });
await zoe.waitForFunction(() => document.querySelector("#o-figurine .tf-v.pris")?.getAttribute("data-cle") === "amour", null, { timeout: 15000 }).catch(() => null);
ok((await zoe.locator("#o-figurine .tf-texte textarea").inputValue()) === "Je t’aime. Voilà, c’est dit. Et ma figurine est tout à fait d’accord." && (await zoe.locator('#o-figurine .tf-v.pris[data-cle="amour"]').count()) === 1, "« Le mème « Je t'aime » » : le studio, ce mème prêt, son visage d'amour");

// ═══ PARTOUT ═══
for (const [nom, p] of [["Léa", lea], ["Hugo", hugo], ["Max", max], ["Zoé", zoe]]) {
  ok(p.err.length === 0, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err[0]})` : ""}`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
}

await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
