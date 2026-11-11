// 🧪 LES ESSAIS DU LOT 0 (« Univers ») — la page de l'admin `/admin/humain/univers-essais` (`app/admin/humain/univers-essais`,
// `lib/direct/univers-essais.ts`, `univers-essais-serveur.ts`), contre le faux Supabase et son faux moteur d'image,
// jamais la vraie base, jamais OpenAI.
//
// Personne d'autre que l'administrateur n'y entre (ni la page, ni la route). L'administrateur, sur un iPhone, ajoute
// « Volontaire 1 » : rien sans l'accord coché ; son selfie part réduit, rangé dans le seau privé. « Sa figurine » : trois
// variantes, faites après la réponse (la page se met à jour seule) — détourées, sauf « en photo » ; la consigne dit le
// nouveau style (une figurine de collection réaliste, assise dans son fauteuil, lèvres fermées). 👍 et une note. « La
// constance » sur l'une : cinq images (bouche ouverte, trois visages, debout — sans fauteuil). Le compteur du jour. Une
// image s'efface ; la personne s'efface avec tout. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
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

// ═══ EFFACER ═══
const r3 = faites.find((r) => r.v === "collection-douce");
await p.locator(`.ue-resultat[data-resultat="${r3.id}"] .ue-effacer`).click();
await p.waitForFunction((id) => !document.querySelector(`.ue-resultat[data-resultat="${id}"]`), r3.id, { timeout: 10000 }).catch(() => null);
ok((await p.locator(`.ue-resultat[data-resultat="${r3.id}"]`).count()) === 0 && !(await existe(`essais-univers/resultats/${r3.id}.png`)), "une image s'efface");
await p.locator(".ue-personne .ue-gestes .ue-bouton.clair").click();
await p.waitForFunction(() => !document.querySelector(".ue-personne"), null, { timeout: 10000 }).catch(() => null);
const restes = [...(await liste("essais-univers/personnes")), ...(await liste("essais-univers/resultats"))];
ok((await p.locator(".ue-personne").count()) === 0 && restes.length === 0, `la personne s'efface, avec son selfie et toutes ses images (${restes.length} restes)`);

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nles essais du lot 0 tiennent ✓");
process.exit(echecs ? 1 : 0);
