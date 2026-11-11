// 🧪 LES ESSAIS DU LOT 0 (« Univers ») — la page de l'admin `/admin/humain/univers-essais` (`app/admin/humain/univers-essais`,
// `lib/direct/univers-essais.ts`, `univers-essais-serveur.ts`), contre le faux Supabase et son faux moteur d'image,
// jamais la vraie base, jamais OpenAI.
//
// Personne d'autre que l'administrateur n'y entre (ni la page, ni la route). L'administrateur, sur un iPhone, ajoute
// « Volontaire 1 » : rien sans l'accord coché ; son selfie part réduit, rangé dans le seau privé. « Sa figurine » : trois
// variantes, faites après la réponse (la page se met à jour seule) — détourées, sauf « en photo » ; la consigne dit le
// nouveau style (une figurine de collection réaliste, assise dans son fauteuil, lèvres fermées). 👍 et une note. « La
// constance » sur l'une : cinq images (bouche ouverte, trois visages, debout — sans fauteuil). Le compteur du jour. Une
// image s'efface ; la personne s'efface avec tout.
// L'ÉTAPE 2, LES UNIVERS : une fiche en trois directions (des décors sans figurine, dessinés d'après la consigne seule) ;
// la variété (une direction sur les trois fiches) ; « Ma fiche » trop courte, refusée ; une retouche (« davantage de
// nature ») ; la vedette (le moteur pose la figurine dans le décor) ; « La scène », composée dans le téléphone : une
// figurine, puis deux, la respiration, la parole (sa bouche ouverte). Effacer la personne emporte sa vedette, pas les
// décors. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const FAUX = F.replace("/rest/v1", "");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json() : null;
};
const existe = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).ok;
const liste = async (prefix) =>
  (await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000 }) })).json()).map((x) => x.name);
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = { name: "sb-127-auth-token", value: `base64-${b64(session)}` };
const ROUTE = `${BASE}/api/admin/direct/univers-essais`;
const poster = (corps, cookie = `${COOKIE_ADMIN.name}=${COOKIE_ADMIN.value}`) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(corps) }).then(async (r) => ({ statut: r.status, ...(await r.json().catch(() => ({}))) }));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ═══ PERSONNE D'AUTRE QUE L'ADMINISTRATEUR ═══
ok((await fetch(ROUTE)).status === 403 && (await poster({ action: "personne", nom: "X", accord: true, photo: "data:image/png;base64,AAAA" }, "")).statut === 403, "la route refuse qui n'est pas administrateur");
ok((await poster({ action: "personne", nom: "X", accord: true, photo: "data:image/png;base64,AAAA" }, "clikme_habitant=jeton-quelconque")).statut === 403, "un habitant non plus");
ok((await poster({ action: "personne", nom: "Volontaire", accord: false, photo: "data:image/png;base64,AAAA" })).statut === 400, "sans l'accord coché : rien");
ok((await poster({ action: "personne", nom: "Volontaire", accord: true, photo: "pas une image" })).statut === 400, "sans photo : rien");

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ ...COOKIE_ADMIN, url: BASE }]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("dialog", (d) => void d.accept());
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async () => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const capture = (nom) => p.screenshot({ path: `${D}/univers-essais-${nom}.png`, fullPage: true });

// (un visiteur sans session : la page le renvoie)
const anonyme = await (await b.newContext()).newPage();
await anonyme.goto(`${BASE}/admin/humain/univers-essais`, { waitUntil: "domcontentloaded" });
ok(!new URL(anonyme.url()).pathname.startsWith("/admin/humain/univers-essais"), `la page renvoie qui n'est pas connecté (${new URL(anonyme.url()).pathname})`);

// ═══ L'ADMINISTRATEUR, SUR SON IPHONE ═══
await p.goto(`${BASE}/admin/humain/univers-essais`, { waitUntil: "networkidle" });
await p.waitForSelector(".ue-bilan", { timeout: 60000 }).catch(() => null);
ok((await texte("h1")) === "Univers — les essais du lot 0" && (await texte(".ue-bilan")).includes("Moteur d’image branché"), "la page : le bilan, le moteur branché");
const bouton = p.locator(".ue-ajout .ue-bouton");
await p.locator(".ue-ajout input[name=nom]").fill("Volontaire 1");
await p.locator(".ue-ajout input[name=photo]").setInputFiles("public/direct/double/content.webp");
ok(await bouton.isDisabled(), "« Ajouter » attend l'accord coché");
await p.locator(".ue-ajout input[name=accord]").check();
ok(!(await bouton.isDisabled()), "accord coché : « Ajouter »");
await bouton.click();
await p.waitForSelector(".ue-personne", { timeout: 20000 }).catch(() => null);
const pid = await p.locator(".ue-personne").first().getAttribute("data-personne");
const fiche = pid ? await lireStock(`essais-univers/personnes/${pid}.json`) : null;
ok(Boolean(pid) && fiche?.nom === "Volontaire 1" && Boolean(fiche.accordLe) && (await existe(`essais-univers/personnes/${pid}.png`)), "la personne : son repère, l'accord daté, son selfie dans le seau privé");
ok((await p.locator(".ue-personne .ue-selfie").count()) === 1 && (await texte(".ue-personne h2")) === "Volontaire 1", "sa carte, avec son selfie");
await capture("1-personne");

// ═══ SA FIGURINE : TROIS VARIANTES ═══
await p.locator(".ue-personne .ue-gestes .ue-bouton").first().click();
await p.waitForSelector(".ue-resultat[data-etat]", { timeout: 20000 }).catch(() => null);
ok((await p.locator(".ue-resultat").count()) === 3, "trois images demandées");
await p.waitForFunction(() => document.querySelectorAll('.ue-resultat[data-etat="fait"]').length === 3, null, { timeout: 60000 }).catch(() => null);
const faites = await p.locator(".ue-resultat").evaluateAll((l) => l.map((x) => ({ id: x.dataset.resultat, etat: x.dataset.etat, v: x.dataset.variante, img: Boolean(x.querySelector(".ue-image img")), meta: x.querySelector(".ue-meta")?.textContent ?? "" })));
ok(
  faites.length === 3 && faites.every((r) => r.etat === "fait" && r.img) && faites.map((r) => r.v).sort().join() === "collection,collection-douce,collection-photo",
  `faites après la réponse, la page se met à jour seule (${faites.map((r) => `${r.v}:${r.etat}`).join(" ")})`,
);
ok(faites[0].meta.includes("chatgpt-image-latest") && faites[0].meta.includes("high") && /4\s321 jetons/.test(faites[0].meta), `le moteur, la qualité, la durée, les jetons (${faites[0].meta})`);
const consignes = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("IMAGE "));
const photo = consignes.find((c) => c.includes("wooden tabletop"));
ok(
  consignes.length === 3 &&
    consignes.every((c) => c.includes("REALISTIC COLLECTIBLE FIGURINE") && c.includes("armchair") && c.includes("CLOSED LIPS") && c.includes("no spring")) &&
    consignes.filter((c) => c.startsWith("IMAGE chatgpt-image-latest transparent ")).length === 2 &&
    Boolean(photo) &&
    !photo.startsWith("IMAGE chatgpt-image-latest transparent") &&
    consignes.some((c) => c.includes("designer art-toy")),
  "les consignes : le nouveau style, assise dans son fauteuil, lèvres fermées, ni ressort ; détourées sauf « en photo »",
);
const r1 = faites.find((r) => r.v === "collection");
const f1 = await lireStock(`essais-univers/resultats/${r1.id}.json`);
ok(f1?.etat === "fait" && f1.modele === "chatgpt-image-latest" && f1.jetons === 4321 && typeof f1.dureeS === "number" && f1.consigne.includes("REALISTIC COLLECTIBLE FIGURINE") && (await existe(`essais-univers/resultats/${r1.id}.png`)), "rangée : l'image, et tout ce qui la décrit (sa consigne mot pour mot)");
await capture("2-figurines");

// ═══ SON AVIS ═══
const carte1 = p.locator(`.ue-resultat[data-resultat="${r1.id}"]`);
await carte1.locator(".ue-avis button").first().click();
await p.waitForFunction((id) => document.querySelector(`.ue-resultat[data-resultat="${id}"] .ue-avis button`)?.getAttribute("aria-pressed") === "true", r1.id, { timeout: 10000 }).catch(() => null);
await carte1.locator(".ue-note").fill("Très ressemblante, la coiffure est parfaite");
await p.locator("h1").click();
let avis = null;
for (let k = 0; k < 20 && avis?.note !== "Très ressemblante, la coiffure est parfaite"; k++) {
  await p.waitForTimeout(300);
  avis = await lireStock(`essais-univers/resultats/${r1.id}.json`);
}
ok(avis?.avis === "oui" && avis.note === "Très ressemblante, la coiffure est parfaite", "👍 et sa note, gardés");

// ═══ LA CONSTANCE ═══
await carte1.locator(".ue-bouton.clair").click();
await p.waitForFunction(() => document.querySelectorAll('.ue-constance .ue-resultat[data-etat="fait"]').length === 5, null, { timeout: 60000 }).catch(() => null);
const constance = await p.locator(".ue-constance .ue-resultat").evaluateAll((l) => l.map((x) => ({ v: x.dataset.variante, etat: x.dataset.etat })));
ok(constance.length === 5 && constance.every((x) => x.etat === "fait") && constance.map((x) => x.v).sort().join() === "colere,debout,joie,parle,rire", `la constance : cinq images, sous la figurine choisie (${constance.map((x) => x.v).join(", ")})`);
const cst = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("IMAGE ") && c.includes("EXACTLY THE SAME FIGURINE"));
const debout = cst.find((c) => c.includes("STANDING"));
ok(cst.length === 5 && Boolean(debout) && !debout.includes("the same armchair") && cst.filter((c) => c.includes("the same armchair")).length === 4, "les consignes : la même figurine, une seule chose change (debout : sans fauteuil)");
ok((await lireStock(`essais-univers/jours/${jour}.json`))?.n === 8, "le compteur du jour : huit images");
ok((await debordement()) <= 0 && (await sansMotInterdit()), "la page ne déborde pas sur un iPhone, sans le mot interdit");
await capture("3-constance");

// ═══ L'ÉTAPE 2 : LES UNIVERS ═══
const univ = p.locator(".ue-univers").first();
await univ.locator(".ue-bouton").first().click();
await p.waitForFunction(() => document.querySelectorAll('.ue-univers .ue-colonne > .ue-resultat[data-etat="fait"]').length === 3, null, { timeout: 60000 }).catch(() => null);
const decors = await univ.locator(".ue-grille > .ue-colonne > .ue-resultat").evaluateAll((l) => l.map((x) => ({ id: x.dataset.resultat, v: x.dataset.variante, etat: x.dataset.etat, t: x.textContent })));
ok(decors.length === 3 && decors.every((d) => d.etat === "fait" && d.t.includes("L’atelier sur la mer")) && decors.map((d) => d.v).sort().join() === "diorama,maquette,peint", `le style : une fiche, trois directions (${decors.map((d) => d.v).join(", ")})`);
const dessins = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("DESSIN "));
ok(
  dessins.length === 3 &&
    dessins.every((c) => c.includes("NO figurine") && c.includes("clear, flat floor area") && c.includes("seaside workshop") && !c.startsWith("DESSIN chatgpt-image-latest transparent")) &&
    dessins.some((c) => c.includes("macro lens")) &&
    dessins.some((c) => c.includes("dollhouse")) &&
    dessins.some((c) => c.includes("painted 3D")),
  "les consignes : sans figurine, une scène dégagée en bas, la fiche, chaque direction ; dessinés d'après la consigne seule",
);
await univ.locator('[data-direction="maquette"]').click();
await univ.locator(".ue-bouton.clair").first().click();
await p.waitForFunction(() => document.querySelectorAll('.ue-univers .ue-grille > .ue-colonne > .ue-resultat[data-etat="fait"]').length === 6, null, { timeout: 60000 }).catch(() => null);
const variete = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("DESSIN ")).slice(3);
ok(variete.length === 3 && variete.every((c) => c.includes("dollhouse")) && ["seaside workshop", "tropical greenhouse", "city rooftop"].every((f) => variete.some((c) => c.includes(f))), "la variété : la direction choisie, sur les trois fiches");
await univ.locator('[data-fiche="perso"]').click();
await univ.locator("textarea[name=fiche]").fill("Trop court");
await univ.locator(".ue-bouton").first().click();
await p.waitForSelector(".ue > .ue-erreur", { timeout: 10000 }).catch(() => null);
ok((await texte(".ue > .ue-erreur")).includes("Écrivez votre fiche"), "« Ma fiche » trop courte : refusée");
// la retouche
const d1 = decors[0].id;
const colonne = univ.locator(".ue-grille > .ue-colonne").filter({ has: p.locator(`.ue-resultat[data-resultat="${d1}"]`) });
await colonne.locator(".ue-decor-gestes .ue-bouton.clair").first().click();
await p.waitForFunction((id) => [...document.querySelectorAll(".ue-constance .ue-resultat")].some((x) => x.dataset.variante === "retouche" && x.dataset.etat === "fait"), d1, { timeout: 60000 }).catch(() => null);
const retouche = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("IMAGE ") && c.includes("THE SAME DECOR")).pop() ?? "";
ok(retouche.includes("davantage de nature") && !retouche.startsWith("IMAGE chatgpt-image-latest transparent"), "la retouche : le même décor, « davantage de nature »");
// la vedette
await colonne.locator(".ue-decor-gestes .ue-bouton.clair").nth(1).click();
await p.waitForFunction(() => [...document.querySelectorAll(".ue-constance .ue-resultat")].some((x) => x.dataset.variante === "vedette" && x.dataset.etat === "fait"), null, { timeout: 60000 }).catch(() => null);
const vedette = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("IMAGE ") && c.includes("Place EXACTLY this figurine")).pop() ?? "";
const vid = await colonne.locator('.ue-constance .ue-resultat[data-variante="vedette"]').first().getAttribute("data-resultat");
const vjson = vid ? await lireStock(`essais-univers/resultats/${vid}.json`) : null;
ok(Boolean(vedette) && vjson?.source === d1 && Boolean(vjson.figurine) && vjson.personne === pid, "la vedette : le moteur pose la figurine dans le décor (elle appartient à la personne)");
// la scène, composée dans le téléphone
await colonne.locator(".ue-decor-gestes .ue-bouton").first().click();
await p.waitForSelector(".ue-scene .ue-acteur img", { timeout: 10000 }).catch(() => null);
ok((await p.locator(".ue-scene .ue-acteur").count()) === 1 && (await p.locator(".ue-scene .ue-scene-decor").count()) === 1, "la scène : le décor, et la figurine posée sur la scène");
const respire = await p.locator(".ue-scene .ue-bouge").first().evaluate((x) => getComputedStyle(x).animationName);
ok(/ue-respire/.test(respire), `elle respire (${respire})`);
const choix2 = await p.locator('.ue-scene-bloc select[name="acteur-2"] option').evaluateAll((l) => l.map((o) => o.value).filter(Boolean));
await p.locator('.ue-scene-bloc select[name="acteur-2"]').selectOption(choix2[1] ?? choix2[0]);
ok((await p.locator(".ue-scene .ue-acteur").count()) === 2, "deux figurines, face à face");
const src0 = await p.locator(".ue-scene .ue-acteur img").first().getAttribute("src");
await p.locator('.ue-scene-bloc input[name="parle"]').check();
let changeDImage = false;
for (let k = 0; k < 12 && !changeDImage; k++) {
  await p.waitForTimeout(100);
  changeDImage = (await p.locator(".ue-scene .ue-acteur img").first().getAttribute("src")) !== src0;
}
ok(changeDImage, "la parole : sa bouche ouverte alterne avec l'autre");
ok((await debordement()) <= 0 && (await sansMotInterdit()), "les univers et la scène ne débordent pas, sans le mot interdit");
await p.locator(".ue-scene").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/univers-essais-4-scene.png` });
ok((await lireStock(`essais-univers/jours/${jour}.json`))?.n === 16, "le compteur du jour : seize images");

// ═══ EFFACER ═══
const r3 = faites.find((r) => r.v === "collection-douce");
await p.locator(`.ue-resultat[data-resultat="${r3.id}"] .ue-effacer`).click();
await p.waitForFunction((id) => !document.querySelector(`.ue-resultat[data-resultat="${id}"]`), r3.id, { timeout: 10000 }).catch(() => null);
ok((await p.locator(`.ue-resultat[data-resultat="${r3.id}"]`).count()) === 0 && !(await existe(`essais-univers/resultats/${r3.id}.png`)), "une image s'efface");
await p.locator(".ue-personne .ue-gestes .ue-bouton.clair").click();
await p.waitForFunction(() => !document.querySelector(".ue-personne"), null, { timeout: 10000 }).catch(() => null);
const restesP = await liste("essais-univers/personnes");
const restesR = (await liste("essais-univers/resultats")).filter((n) => n.endsWith(".json"));
const siens = (await Promise.all(restesR.map((n) => lireStock(`essais-univers/resultats/${n}`)))).filter((r) => r?.personne === pid);
ok((await p.locator(".ue-personne").count()) === 0 && restesP.length === 0 && siens.length === 0 && restesR.length === 7, `la personne s'efface, avec son selfie et toutes ses images, sa vedette comprise ; les décors restent (${restesR.length})`);

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nles essais du lot 0 tiennent ✓");
process.exit(echecs ? 1 : 0);
