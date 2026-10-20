// L'équipe au navigateur : Lou publie (plus de « vous êtes combien »), invite Léa depuis « Mon équipe » ;
// Léa ouvre son lien sur SON téléphone (bienvenue, 50 €, elle prend) ; Lou voit « Pris par Léa » ;
// Léa valide un bon (au code, puis sur /bon) ; Lou retire Léa ; 320 px ; la démo.
import { BASE, D, F, lancer } from "./commun.mjs";
import { SITES } from "./semer.mjs";
const R = `${BASE}/api/site-internet/pro/echanges`;
await fetch(`${F}/human_vitrine_sites`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.values(SITES)) });
const appel = async (slug, action, extra = {}) =>
  (await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, token: "jeton-test", action, ...extra }) })).json();
await appel("chez-bergine-dax", "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 2, accepte: true });
await appel("fleurs-adour-dax", "offre", { titre: "Un bouquet de saison", prix: 35, parMois: 4, accepte: true });

const b = await lancer();
let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const tel = async (w = 390) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = async (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const comptoirDeLou = async (p) => {
  await p.goto(`${BASE}/autour-de-moi/assistante?site=atelier-lou-dax&k=jeton-test&ouvrir=echanges`, { waitUntil: "networkidle", timeout: 400000 });
  await p.waitForTimeout(2000);
};

/* ── LOU PUBLIE : PLUS DE « VOUS ÊTES COMBIEN ? » ───────────── */
const lou = await tel();
await comptoirDeLou(lou);
await lou.locator(".ak-nav button, button:has-text('C’est ça')").first().waitFor({ timeout: 60000 }).catch(async () => { await lou.screenshot({ path: `${D}/echec-equipe.png` }); console.log("PAGE:", (await lou.locator("body").innerText()).slice(0, 800)); console.log("BOUTONS:", (await lou.locator("button").allInnerTexts()).join(" | ")); process.exit(1); });
if (!(await lou.getByRole("button", { name: /C’est ça/ }).count())) {
  await lou.locator(".ak-nav button", { hasText: "Catalogue" }).first().click({ timeout: 60000 });
  await lou.waitForTimeout(1500);
}
await lou.getByRole("button", { name: /C’est ça/ }).click();
await lou.waitForTimeout(1200);
ok((await lou.locator(".ec-puces.cinq").count()) === 0, "étape 2 : plus de question « combien êtes-vous »");
ok((await texte(lou, ".ec-equipe-t")).includes("Mon équipe") && (await texte(lou, ".ec-caisse")).includes("50 €"), `étape 2 : « ${await texte(lou, ".ec-equipe-t")} » · ${await texte(lou, ".ec-caisse")}`);
await lou.screenshot({ path: `${D}/40-etape2-sans-combien.png`, fullPage: true });
await lou.getByRole("button", { name: /Suivant/ }).click();
await lou.waitForTimeout(1000);
await lou.getByRole("button", { name: /J’accepte et je publie/ }).click();
await lou.waitForSelector(".ec-solde", { timeout: 60000 });
await lou.waitForTimeout(1200);
ok((await texte(lou, ".ec-solde")).includes("50 crédits"), `publié, seule : « ${await texte(lou, ".ec-solde")} »`);

/* ── MON ÉQUIPE : INVITER LÉA ───────────────────────────────── */
await lou.getByRole("button", { name: /^Mon équipe/ }).click();
await lou.waitForTimeout(600);
ok((await texte(lou, ".ec-equipe")).includes("Toi"), `le panneau : « ${await texte(lou, ".ec-equipe")} »`);
await lou.locator(".ec-inviter input").fill("Léa");
await lou.locator(".ec-inviter button").click();
await lou.waitForSelector(".ec-lien-membre", { timeout: 30000 });
const lien = await texte(lou, ".ec-lien-membre");
const wa = await lou.locator("a.ec-wa").getAttribute("href");
const message = decodeURIComponent(wa.replace(/^https:\/\/wa\.me\/\?text=/, ""));
ok(/^http:\/\/localhost:3821\/e\/[A-Za-z0-9_-]{24}$/.test(lien), `son lien : ${lien}`);
ok(message.startsWith("Léa, tu fais partie de l’équipe de l’Atelier de Lou sur ClikMe") && message.endsWith(lien), `le message WhatsApp : « ${message} »`);
await lou.screenshot({ path: `${D}/41-lien-lea.png` });
await lou.getByRole("button", { name: /Retour à mon équipe/ }).click();
await lou.waitForTimeout(500);
ok((await texte(lou, ".ec-membre.attente")).includes("pas encore ouvert"), `Léa attend : « ${await texte(lou, ".ec-membre.attente")} »`);
await lou.screenshot({ path: `${D}/42-equipe-attente.png` });

/* ── LE TÉLÉPHONE DE LÉA ────────────────────────────────────── */
const lea = await tel();
await lea.goto(lien, { waitUntil: "networkidle", timeout: 400000 });
await lea.waitForTimeout(1500);
ok((await texte(lea, ".ec-feuille-c h2, .ec-feuille h2")).includes("Bienvenue Léa"), `bienvenue : « ${await texte(lea, ".ec-feuille-c h2, .ec-feuille h2")} »`);
ok((await texte(lea, ".em-tete")).includes("Équipe de l’Atelier de Lou"), `en-tête : « ${await texte(lea, ".em-tete")} »`);
await lea.screenshot({ path: `${D}/43-lea-bienvenue.png` });
await lea.getByRole("button", { name: /C’est parti/ }).click();
await lea.waitForTimeout(800);
ok((await texte(lea, ".ec-solde")).includes("50 crédits"), `ses 50 € : « ${await texte(lea, ".ec-solde")} »`);
ok((await lea.locator(".ec-carte").count()) > 0, "la pile des offres de Dax");
await lea.screenshot({ path: `${D}/44-lea-pile.png` });
const titreCarte = await texte(lea, ".ec-glisse .ec-carte h4");
await lea.locator(".ec-oui").click();
await lea.waitForTimeout(800);
await lea.screenshot({ path: `${D}/45-lea-je-prends.png` });
await lea.locator(".ec-payer-b.credits").click();
await lea.waitForTimeout(2500);
await lea.locator(".mg-go").click({ timeout: 15000 });
await lea.waitForTimeout(1000);
ok((await texte(lea, ".ec-bravo")).includes("Ton bon, Léa"), `son bon : « ${await texte(lea, ".ec-bravo")} » (${titreCarte})`);
await lea.screenshot({ path: `${D}/46-lea-bon.png` });
await lea.getByRole("button", { name: /C’est noté/ }).click();
await lea.waitForTimeout(500);
const resteLea = await texte(lea, ".ec-solde");
ok(/(0|15) crédit/.test(resteLea), `après : « ${resteLea} »`);
const navLea = await texte(lea, ".ec-tiroirs");
ok(navLea.includes("Mes bons · 1") && navLea.includes("Valider un bon") && !/Mon offre|Mon équipe/.test(navLea), `ses tiroirs : « ${navLea} »`);

/* ── LOU VOIT TOUT ──────────────────────────────────────────── */
await comptoirDeLou(lou);
ok((await texte(lou, ".ec-solde")).match(/(50|65) crédits/), `Lou : équipe de 2, « ${await texte(lou, ".ec-solde")} »`);
await lou.getByRole("button", { name: /^Mes bons/ }).click();
await lou.waitForTimeout(600);
ok((await texte(lou, ".ec-feuille")).includes("Pris par Léa"), `« Mes bons » : « ${(await texte(lou, ".ec-feuille")).slice(0, 120)} »`);
await lou.screenshot({ path: `${D}/47-lou-pris-par-lea.png` });
await lou.keyboard.press("Escape");
await comptoirDeLou(lou);
await lou.getByRole("button", { name: /^Mon équipe/ }).click();
await lou.waitForTimeout(600);
ok(/Ce mois-ci : (50|35) € sur 50 €/.test(await texte(lou, ".ec-equipe")), `« ${await texte(lou, ".ec-equipe")} »`);

/* ── LÉA VALIDE AU COMPTOIR ─────────────────────────────────── */
const pris1 = await appel("chez-bergine-dax", "prendre", { fournisseur: SITES.lou.id });
const code1 = pris1.etat.pris.find((x) => x.statut === "reserve").code;
await lea.getByRole("button", { name: /Valider un bon/ }).click();
await lea.waitForTimeout(500);
await lea.locator(".ec-code input").fill(code1.toLowerCase());
await lea.locator(".ec-code button").click();
await lea.waitForTimeout(2000);
ok((await texte(lea, ".ec-toast")).includes("le produit de ta boutique : elle a gagné 45 €"), `Léa valide ${code1} : « ${await texte(lea, ".ec-toast")} »`);
await lea.screenshot({ path: `${D}/48-lea-valide.png` });

/* ── /bon SUR LE TÉLÉPHONE DE LÉA ───────────────────────────── */
const pris2 = await appel("fleurs-adour-dax", "prendre", { fournisseur: SITES.lou.id });
const code2 = pris2.etat.pris.find((x) => x.statut === "reserve").code;
await lea.goto(`${BASE}/bon/${code2}`, { waitUntil: "networkidle", timeout: 400000 });
await lea.waitForTimeout(1200);
ok((await texte(lea, ".bn-c")).includes("Ce téléphone est celui de L'Atelier de Lou"), "la page du bon reconnaît le téléphone de Léa");
ok((await lea.locator(".bn a", { hasText: "Ouvrir mon comptoir" }).getAttribute("href")) === new URL(lien).pathname, "« Ouvrir mon comptoir » ramène à son lien à elle");
await lea.locator(".bn-go").click();
await lea.waitForTimeout(2000);
ok((await texte(lea, ".bn-r")).includes("elle a gagné 45 €"), `validé depuis /bon : « ${await texte(lea, ".bn-r")} »`);
await lea.screenshot({ path: `${D}/49-lea-bon-page.png` });

await comptoirDeLou(lou);
await lou.getByRole("button", { name: /^À valider/ }).click();
await lou.waitForTimeout(600);
ok(((await texte(lou, ".ec-feuille")).match(/validé par Léa/g) ?? []).length === 2, "Lou : « Déjà validés » · validé par Léa (×2)");
await lou.screenshot({ path: `${D}/50-lou-valide-par-lea.png` });

/* ── RETIRER LÉA ────────────────────────────────────────────── */
await comptoirDeLou(lou);
await lou.getByRole("button", { name: /^Mon équipe/ }).click();
await lou.waitForTimeout(600);
await lou.locator(".ec-membre-b button", { hasText: "Retirer" }).first().click();
await lou.waitForTimeout(400);
await lou.screenshot({ path: `${D}/51-retirer.png` });
await lou.getByRole("button", { name: /^Retirer Léa/ }).click();
await lou.waitForTimeout(2000);
ok((await texte(lou, ".ec-toast")).includes("Léa ne fait plus partie"), `« ${await texte(lou, ".ec-toast")} »`);
await lea.goto(lien, { waitUntil: "networkidle", timeout: 400000 });
await lea.waitForTimeout(800);
ok((await lea.locator("body").innerText()).includes("Ce lien n’est plus valable"), "le lien de Léa ne marche plus");

/* ── 320 PX ─────────────────────────────────────────────────── */
const inv = await appel("atelier-lou-dax", "inviter", { prenom: "Maximilienne" });
const petit = await tel(320);
await petit.goto(`${BASE}${inv.lien}`, { waitUntil: "networkidle", timeout: 400000 });
await petit.waitForTimeout(1500);
ok((await debordement(petit)) <= 0, `320 px, bienvenue : pas de débordement (${await debordement(petit)})`);
await petit.screenshot({ path: `${D}/52-320-bienvenue.png` });
await petit.getByRole("button", { name: /C’est parti/ }).click();
await petit.waitForTimeout(600);
ok((await debordement(petit)) <= 0, "320 px, la page du membre");
await petit.screenshot({ path: `${D}/53-320-membre.png` });
const lou320 = await tel(320);
await comptoirDeLou(lou320);
await lou320.getByRole("button", { name: /^Mon équipe/ }).click();
await lou320.waitForTimeout(600);
ok((await debordement(lou320)) <= 0, "320 px, « Mon équipe »");
await lou320.screenshot({ path: `${D}/54-320-mon-equipe.png` });

/* ── LA DÉMONSTRATION ───────────────────────────────────────── */
const demo = await tel();
await demo.goto(`${BASE}/autour-de-moi/assistante`, { waitUntil: "networkidle", timeout: 400000 });
await demo.waitForTimeout(1500);
await demo.getByRole("button", { name: /Restaurant/ }).first().click();
await demo.waitForTimeout(2500);
await demo.locator(".ak-nav button", { hasText: "Catalogue" }).first().click({ timeout: 60000 });
await demo.waitForTimeout(6500);
await demo.getByRole("button", { name: /C’est ça/ }).click();
await demo.waitForTimeout(800);
ok((await demo.locator(".ec-puces.cinq").count()) === 0 && (await texte(demo, ".ec-caisse")).includes("50 €"), "démo, étape 2 : seul, 50 €, pas de « combien »");
await demo.getByRole("button", { name: /Suivant/ }).click();
await demo.waitForTimeout(800);
await demo.getByRole("button", { name: /Voir ce que proposent les autres/ }).click();
await demo.waitForTimeout(3500);
const avant = await texte(demo, ".ec-solde");
await demo.getByRole("button", { name: /^Mon équipe/ }).click();
await demo.waitForTimeout(500);
await demo.locator(".ec-inviter input").fill("Sami");
await demo.locator(".ec-inviter button").click();
await demo.waitForTimeout(800);
ok((await texte(demo, ".ec-feuille")).includes("Envoie son accès à Sami") && (await texte(demo, ".ec-feuille")).includes("Sami rejoint ton équipe"), `démo : « ${(await texte(demo, ".ec-feuille")).slice(0, 110)} »`);
await demo.screenshot({ path: `${D}/55-demo-equipe.png` });
await demo.getByRole("button", { name: /Retour à mon équipe/ }).click();
await demo.waitForTimeout(400);
ok((await texte(demo, ".ec-regle")).includes("2 personnes"), `démo : « ${await texte(demo, ".ec-regle")} »`);
await demo.keyboard.press("Escape");
await demo.locator(".ec-feuille .ec-x, .ec-feuille button[aria-label*='Fermer']").first().click().catch(() => undefined);
await demo.waitForTimeout(500);
ok(avant !== (await texte(demo, ".ec-solde")), `démo : le solde suit (${avant} → ${await texte(demo, ".ec-solde")})`);

for (const [nom, p] of [["Lou", lou], ["Léa", lea], ["320", petit], ["Lou 320", lou320], ["démo", demo]]) if (p.err.length) ok(false, `erreurs ${nom} : ${p.err.slice(0, 3).join(" | ")}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exitCode = echecs ? 1 : 0;
