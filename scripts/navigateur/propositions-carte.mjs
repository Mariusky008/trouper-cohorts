// 📣 MES GROUPES, LA CARTE D'UNE PROPOSITION, À L'ÉCRAN (26 novembre 2026, la maquette « Propositions de groupes » validée
// par le propriétaire ; `app/collection/mes-groupes.tsx`) — sur un iPhone, contre le faux Supabase et le faux YouTube.
//
// Léa propose une soirée foot ce soir, avec une vidéo et un mot. Zoé ouvre Mes groupes : la vidéo en grand (son titre,
// l'heure et la passion posées dessus) ; le mot de Léa dans une bulle ; huit fauteuils, la tête de Léa dans le premier,
// le suivant qui brille ; un seul gros bouton, « 🛋️ Je viens ce soir à … ». « ▶ Voir la vidéo » la lance en grand ; ⋯
// range « Signaler ». « … ne te va pas ? Propose une autre heure » ouvre la feuille, qui dit ce qui se passe. Zoé vient :
// « Ta place est gardée », sa tête dans le deuxième fauteuil, « Je ne peux plus venir ». Rien ne déborde, aucune erreur.
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { poserPiece } from "../piece-en-hauteur.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006c71${String(n).padStart(2, "0")}`, jeton: `jeton-propositions-carte-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const GENS = [LEA, ZOE];
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
await poserPiece(deposer, "salon", { le: maintenant });
await fetch(`${BASE}/api/cron/decouvrir-selection`);

const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const V = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0];
ok(V?.id, "une vidéo de la télé du jour de Léa");
// (dans trois heures, à l'heure pile : la carte dit « … à 20 h »)
const dans3h = Math.ceil((Date.now() + 3 * 3600_000) / 3600_000) * 3600_000;
const prop = await appel(LEA, "/api/direct/mes-groupes", { action: "proposer", nom: "Soirée foot", theme: "foot", video: V.id, quand: dans3h, pour: "tous", places: 8, mot: "On la regarde ensemble ?" });
ok(prop.statut === 200 && prop.proposition?.id, "Léa propose une soirée foot, pour tout le monde");

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: ZOE.jeton, url: BASE }]);
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
await ctx.route(/^https:\/\/www\.youtube(-nocookie)?\.com\//, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html><body style='background:#000'></body></html>" }));
const zoe = await ctx.newPage();
zoe.on("pageerror", (e) => erreurs.push(String(e)));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await zoe.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.first().innerText({ timeout: 8000 }).catch(() => "")).replace(/\s+/g, " ").trim();

await zoe.goto(`${BASE}/collection?v=${Date.now()}#groupes`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe, "#o-groupes");
const carte = zoe.locator(`#o-groupes [data-proposition="${prop.proposition.id}"]`);
ok(await attendre(async () => (await carte.count()) === 1, 45000), "Zoé ouvre Mes groupes : la carte de Léa");
const ecran = await carte.locator(".mg-ecran").boundingBox();
const largeur = await carte.boundingBox();
ok(ecran && largeur && ecran.width >= largeur.width - 2 && Math.abs(ecran.height - (ecran.width * 9) / 16) < 3, `la vidéo en grand : toute la largeur, en 16:9 (${Math.round(ecran?.width ?? 0)} × ${Math.round(ecran?.height ?? 0)})`);
ok(/i\.ytimg\.com/.test((await carte.locator(".mg-ecran").getAttribute("style")) ?? "") && (await texte(carte.locator(".mg-ecran-titre"))) === V.titre, "… sa vignette, son titre");
ok(/^🕘 Ce soir|^🕘 Aujourd|^🕘 Demain/.test(await texte(carte.locator(".mg-ecran-quand"))) && /Foot/.test(await texte(carte.locator(".mg-ecran-theme"))), `l'heure et la passion posées dessus (« ${await texte(carte.locator(".mg-ecran-quand"))} », « ${await texte(carte.locator(".mg-ecran-theme"))} »)`);
ok(/Proposé par Léa/.test(await texte(carte.locator(".mg-bulle"))) && /On la regarde ensemble \?/.test(await texte(carte.locator(".mg-bulle"))), "le mot de Léa dans une bulle");
ok((await carte.locator(".mg-siege").count()) === 8 && (await carte.locator(".mg-siege .mg-siege-tete").count()) === 1 && (await carte.locator(".mg-siege.attend").count()) === 1, "huit fauteuils : la tête de Léa dans le premier, le suivant qui brille");
ok((await texte(carte.locator("[data-confirmes]"))) === "1 vient · 7 places libres", `« ${await texte(carte.locator("[data-confirmes]"))} »`);
const bouton = await texte(carte.locator("[data-confirmer]"));
ok(/^🛋️ Je viens (ce soir|aujourd’hui|demain) à \d{1,2} h$/.test(bouton), `un seul gros bouton : « ${bouton} »`);
ok(/ne te va pas \? Propose une autre heure$/.test(await texte(carte.locator("[data-autre]"))), `« ${await texte(carte.locator("[data-autre]"))} »`);
ok((await carte.locator("[data-signaler]").count()) === 0, "« Signaler » n'encombre pas la carte…");
await carte.locator("[data-menu]").click();
ok((await carte.locator("[data-signaler]").count()) === 1, "… il est rangé dans ⋯");
await carte.locator("[data-menu]").click();
await zoe.waitForTimeout(300);
await zoe.screenshot({ path: `${D}/propositions-1-carte.png` });

// ▶ la vidéo, en grand
await carte.locator("[data-voir-video]").click();
const feuille = zoe.locator("[data-feuille-video]");
ok(await attendre(async () => (await feuille.count()) === 1), "« Voir la vidéo » : elle se lance en grand");
ok(new RegExp(`youtube-nocookie\\.com/embed/${V.id}`).test((await feuille.locator("iframe").getAttribute("src")) ?? ""), "… le lecteur officiel");
await zoe.screenshot({ path: `${D}/propositions-2-video.png` });
await zoe.locator(".mg-voile").first().click();
ok(await attendre(async () => (await feuille.count()) === 0), "… et se referme");

// 🕘 une autre heure : la feuille dit ce qui se passe
await carte.locator("[data-autre]").click();
ok(/Si Léa la prend, tous ceux qui viennent passent à la nouvelle heure/.test(await texte(zoe.locator("[data-feuille-autre]"))), "« Propose une autre heure » : la feuille dit ce qui se passe");
await zoe.locator(".mg-voile").first().click();

// 🛋️ Zoé vient
await carte.locator("[data-confirmer]").click();
ok(await attendre(async () => (await carte.locator("[data-ma-place]").count()) === 1), "Zoé vient : « Ta place est gardée »");
ok(/Ta place est gardée.*Le salon ouvre à \d{1,2} h \d\d/.test(await texte(carte.locator("[data-ma-place]"))), `… « ${await texte(carte.locator("[data-ma-place]"))} »`);
ok((await carte.locator(".mg-siege .mg-siege-tete").count()) === 2 && (await carte.locator(".mg-siege.attend").count()) === 0 && (await texte(carte.locator("[data-confirmes]"))) === "2 viennent · 6 places libres", "sa tête dans le deuxième fauteuil");
ok((await texte(carte.locator("[data-laisser]"))) === "Je ne peux plus venir", "« Je ne peux plus venir »");
await zoe.screenshot({ path: `${D}/propositions-3-gardee.png` });

ok(!(await zoe.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)) && !/exemple/i.test(await zoe.evaluate(() => document.body.innerText)), "rien ne déborde, jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
