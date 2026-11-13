// 🔀 LA BASCULE « UNIVERS POUR TOUS », DANS LE NAVIGATEUR (`lib/direct/univers-pour-tous.ts`) — sur un iPhone, contre le
// faux Supabase (jamais la vraie base), avec une seconde app lancée ici, l'interrupteur allumé (`../seconde-app.mjs`).
//
// Sam a sa figurine d'aujourd'hui. L'interrupteur allumé : l'appli s'ouvre sur « Mon univers » (« Ton univers commence
// par toi ») ; le menu du bas devient Découvrir · Autour · Créer · Proches · Mon univers ; « Créer » l'invite à refaire sa
// figurine au nouveau style ; « Ta figurine » lui propose sa photo d'avant (les deux cases toujours à cocher). Un
// nouveau venu, dans « Créer » : « Crée ta figurine », au nouveau style. Freiné (l'app de la CI,
// `CLIKME_UNIVERS_POUR_TOUS=0`) : l'appli d'avant. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { lancerSecondeApp } from "../seconde-app.mjs";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const { base: ALLUME, arreter } = await lancerSecondeApp();

const SAM = { id: "abababab-0000-4000-8000-000000000d01", jeton: "jeton-sam-bascule-nav-000001", prenom: "Sam" };
await semer("human_habitants", [{ id: SAM.id, device_token: SAM.jeton, prenom: SAM.prenom, ville_slug: "dax" }]);
await semer("human_vitrine_sites", [{ slug: "atelier-bascule", business_name: "L’Atelier", city: "40100 Dax", est_client: true }]);
const maintenant = new Date().toISOString();
await deposer(`${SAM.id}/neutre-essai.webp`, fs.readFileSync("public/direct/double/pied/montre.webp"), "image/webp");
await deposer(`${SAM.id}/photo.jpg`, fs.readFileSync("public/direct/atelier-bijoux.jpg"), "image/jpeg");
await json(`${SAM.id}/majeur.json`, { le: maintenant, age: 15 });
await semer("clik_ma_figurine", [{ habitant_id: SAM.id, prenom: SAM.prenom, photo: `${SAM.id}/photo.jpg`, accord_le: maintenant, demande_le: maintenant, neutre: `${SAM.id}/neutre-essai.webp`, parle: `${SAM.id}/neutre-essai.webp`, prete_le: maintenant }]);

const b = await lancer();
const erreurs = [];
async function tel(base, qui) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: base }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${qui?.prenom ?? "nouveau"} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const menu = async (p) => (await p.locator(".mc-nav button small").allInnerTexts()).join(" · ");

// ═══ ÉTEINT : l'appli d'aujourd'hui ═══
const avant = await tel(BASE, SAM);
await avant.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(avant);
ok((await menu(avant)) === "Découvrir · Autour · Créer · Mes mèmes · Proches" && (await avant.locator(".pn").count()) === 0, `éteint : le menu d'aujourd'hui, pas d'invitation (${await menu(avant)})`);

// ═══ ALLUMÉ : l'appli s'ouvre sur « Mon univers » ═══
const p = await tel(ALLUME, SAM);
await p.goto(`${ALLUME}/collection`, { waitUntil: "networkidle" });
await p.waitForURL(/\/univers$/, { timeout: 20000 }).catch(() => null);
await p.waitForSelector(".um-titre", { timeout: 20000 }).catch(() => null);
ok(new URL(p.url()).pathname === "/univers" && (await texte(p, ".um-titre")) === "Ton univers commence par toi", `l'appli s'ouvre sur « Mon univers » (${new URL(p.url()).pathname} : ${await texte(p, ".um-titre")})`);
const liens = (await p.locator(".um-menu a small").allInnerTexts()).join(" · ");
ok(liens === "Découvrir · Autour · Créer · Proches · Mon univers", `son menu : ${liens}`);
await p.screenshot({ path: `${D}/bascule-1-mon-univers.png` });

// ═══ « Créer » : l'invitation à refaire sa figurine au nouveau style ═══
await p.locator(".um-menu a", { hasText: "Créer" }).click();
await p.waitForURL(/\/collection#figurine$/, { timeout: 20000 }).catch(() => null);
await fermerPablito(p);
await p.waitForSelector(".pn", { timeout: 20000 }).catch(() => null);
ok((await menu(p)) === "Découvrir · Autour · Créer · Proches · Mon univers", `le menu du bas : Découvrir · Autour · Créer · Proches · Mon univers (${await menu(p)})`);
ok((await texte(p, ".pn b")) === "Ta figurine fait peau neuve" && (await p.locator('.pn a[href="/univers/figurine"]').innerText()) === "La refaire au nouveau style", `« Créer » l'invite à refaire sa figurine (${await texte(p, ".pn")})`);
ok((await p.locator(".tf-moi, .tf").count()) > 0, "son studio reste là, en dessous");
ok((await debordement(p)) <= 1 && (await sansMotInterdit(p)), "rien ne déborde, jamais le mot interdit");
await p.screenshot({ path: `${D}/bascule-2-creer.png` });
// (« Mon univers », dans le menu du bas : l'accueil)
await p.locator(".mc-nav button", { hasText: "Mon univers" }).click();
await p.waitForURL(/\/univers$/, { timeout: 20000 }).catch(() => null);
ok(new URL(p.url()).pathname === "/univers", "« Mon univers », dans le menu du bas : l'accueil");
// (une adresse précise mène toujours à son onglet : pas de détour par l'accueil)
await p.goto(`${ALLUME}/collection#proches`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
ok(new URL(p.url()).pathname === "/collection" && new URL(p.url()).hash === "#proches", "une adresse précise (#proches) reste où elle mène");

// ═══ « Ta figurine » : sa photo d'avant ═══
await p.goto(`${ALLUME}/univers/figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".nf-selfie", { timeout: 20000 }).catch(() => null);
ok((await p.locator(".nf-lien", { hasText: "Reprendre ma photo d’avant" }).count()) === 1 && (await p.locator(".nf-photo img").count()) === 0, "« 🖼️ Reprendre ma photo d’avant » lui est proposé");
await p.locator(".nf-lien", { hasText: "Reprendre ma photo d’avant" }).click();
ok((await p.locator(".nf-photo img").count()) === 1 && (await p.locator(".nf-selfie .nf-bouton").isDisabled()), "sa photo d'avant s'affiche ; les deux cases restent à cocher");
await p.locator('.nf-case input[name="moi"]').check();
await p.locator('.nf-case input[name="age"]').check();
ok(!(await p.locator(".nf-selfie .nf-bouton").isDisabled()), "« C’est bien moi » et « 15 ans ou plus » cochés : « Créer ma figurine »");
await p.screenshot({ path: `${D}/bascule-3-photo-d-avant.png` });
await p.locator(".nf-selfie .nf-bouton").click();
await p.waitForSelector(".nf-selfie", { state: "detached", timeout: 20000 }).catch(() => null);
ok((await p.locator(".nf-selfie").count()) === 0, "sa figurine du nouveau style part à l'atelier, d'après sa photo d'avant");

// ═══ UN NOUVEAU VENU : « Crée ta figurine », au nouveau style ═══
const n = await tel(ALLUME, null);
await n.goto(`${ALLUME}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(n);
await n.waitForSelector(".pn", { timeout: 20000 }).catch(() => null);
ok((await texte(n, ".pn b")) === "Crée ta figurine" && (await n.locator('.pn a[href="/univers/figurine"]').count()) === 1 && (await n.locator(".tf-envoi-photo, input[type=file]").count()) === 0, `un nouveau venu : « Crée ta figurine », au nouveau style (${await texte(n, ".pn")})`);
await n.screenshot({ path: `${D}/bascule-4-nouveau.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla bascule tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
