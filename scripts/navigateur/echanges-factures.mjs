// Les factures au navigateur : Bergine a validé un bon sans infos → pastille « Mes factures · 1 » ;
// elle remplit ses infos une fois → sa facture ; la page de la facture (390, 320) ; le relevé CSV ;
// la validation suivante facturée toute seule ; Lou reçoit ; Vevey n'a que le relevé ; la démo.
import fs from "node:fs";
import { BASE, D, F, lancer } from "./commun.mjs";
import { SITES } from "./semer.mjs";
const R = `${BASE}/api/site-internet/pro/echanges`;
await fetch(`${F}/human_vitrine_sites`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.values(SITES)) });
const appel = async (slug, action, extra = {}) =>
  (await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, token: "jeton-test", action, ...extra }) })).json();
await appel("chez-bergine-dax", "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 4, accepte: true });
await appel("fleurs-adour-dax", "offre", { titre: "Un bouquet de saison", prix: 35, parMois: 4, accepte: true });
await appel("atelier-lou-dax", "offre", { titre: "Une coupe et un brushing", prix: 45, parMois: 4, accepte: true });
await appel("page-alice-vevey", "offre", { titre: "Deux livres au choix", prix: 40, parMois: 2, accepte: true });
const p1 = await appel("fleurs-adour-dax", "prendre", { fournisseur: SITES.bergine.id });
await appel("chez-bergine-dax", "valider", { code: p1.etat.pris[0].code });

const b = await lancer();
let echecs = 0;
const ok = (c, m) => { if (!c) echecs++; console.log(c ? "  ok  " : "ÉCHEC ", m); };
const tel = async (w = 390) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true });
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = async (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const comptoir = async (p, slug) => {
  await p.goto(`${BASE}/autour-de-moi/assistante?site=${slug}&k=jeton-test&ouvrir=echanges`, { waitUntil: "networkidle", timeout: 400000 });
  await p.waitForSelector(".ec-tiroirs", { timeout: 60000 });
  await p.waitForTimeout(800);
};

/* ── BERGINE : LA PASTILLE, PUIS SES INFOS UNE FOIS ────────── */
const bergine = await tel();
await comptoir(bergine, "chez-bergine-dax");
const bouton = bergine.locator(".ec-tiroirs button", { hasText: "Mes factures" });
ok((await bouton.innerText()).includes("Mes factures · 1") && (await bouton.getAttribute("class"))?.includes("chaud"), `la pastille : « ${await bouton.innerText()} »`);
await bouton.click();
await bergine.waitForSelector(".fa-carte", { timeout: 30000 });
ok((await texte(bergine, ".fa-carte")).includes("1 facture t’attend"), `« ${await texte(bergine, ".fa-carte")} »`);
await bergine.screenshot({ path: `${D}/60-factures-attend.png` });
await bergine.getByRole("button", { name: "Compléter mes infos" }).click();
await bergine.waitForSelector(".fa-form", { timeout: 15000 });
const nom = await bergine.locator(".fa-champ input").first().inputValue();
const tauxOn = await texte(bergine, ".ec-puces[aria-label='Taux de TVA'] button.on");
const natureOn = await texte(bergine, ".ec-puces[aria-label='Ce que tu vends'] button.on");
ok(nom === "Chez Bergine" && /10\s?%.*le plus courant/.test(tauxOn) && natureOn === "Des services", `pré-rempli : « ${nom} », ${tauxOn}, ${natureOn}`);
ok(await bergine.locator(".fa-form button[type=submit]").isDisabled(), "« Enregistrer » attend le SIRET et l'accord");
await bergine.locator(".ec-puces[aria-label='Forme de l’entreprise'] button", { hasText: "SARL" }).click();
await bergine.locator(".fa-champ input").first().fill("SARL Bergine");
await bergine.getByPlaceholder("Par exemple : 1 000 €").fill("5 000 €");
await bergine.getByPlaceholder("14 chiffres").fill("123 456 782 00011");
ok((await texte(bergine, ".fa-champ i.faux")).length > 0, "un SIRET faux se voit tout de suite");
await bergine.getByPlaceholder("14 chiffres").fill("123 456 782 00010");
ok((await texte(bergine, ".fa-champ i.bon")) === "✓" && (await texte(bergine, ".fa-form")).includes("FR11123456782"), "SIRET ✓, et son n° de TVA calculé : FR11123456782");
await bergine.getByPlaceholder("RCS Dax, RM 40…").fill("RCS Dax");
await bergine.locator(".fa-accord input").check();
await bergine.screenshot({ path: `${D}/61-infos.png`, fullPage: true });
await bergine.locator(".fa-form button[type=submit]").click();
await bergine.waitForSelector(".fa-ok", { timeout: 30000 });
ok((await texte(bergine, ".fa-ok")).includes("1 facture d’échange est prête"), `« ${await texte(bergine, ".fa-ok")} »`);
const ligne = await texte(bergine, ".fa-ligne");
const an = new Date().getFullYear();
ok(ligne.includes(`ECH-${an}-0001`) && ligne.includes("Fleurs de l'Adour") && ligne.includes("50,00 €"), `sa facture : « ${ligne} »`);
await bergine.screenshot({ path: `${D}/62-factures.png` });

/* ── LE RELEVÉ CSV ──────────────────────────────────────────── */
const [dl] = await Promise.all([bergine.waitForEvent("download"), bergine.locator(".fa-csv").click()]);
const csv = fs.readFileSync(await dl.path(), "utf8");
ok(dl.suggestedFilename().startsWith("clikme-echanges-") && csv.includes("Date;Sens;Facture;Bon;Produit;Avec;HT;TVA;Taux;TTC") && csv.includes(`Vendu;ECH-${an}-0001`) && csv.includes("45,45;4,55;10;50"), `le relevé CSV : ${dl.suggestedFilename()}`);

/* ── LA PAGE DE LA FACTURE ──────────────────────────────────── */
const lien = await bergine.locator(".fa-ligne").first().getAttribute("href");
const facture = await tel();
await facture.goto(`${BASE}${lien}`, { waitUntil: "networkidle", timeout: 400000 });
const corps = await texte(facture, ".fx");
ok(corps.includes(`N° ECH-${an}-0001`) && corps.includes("SARL Bergine") && corps.includes("SARL au capital de 5 000 €") && corps.includes("SIRET 123 456 782 00010"), "la facture : numéro, vendeur, forme et capital, SIRET");
ok(/factur[ée] à/i.test(corps) && corps.includes("Fleurs de l'Adour") && corps.includes("Total TTC") && corps.includes("Prestation de services") && corps.includes("réglée par échange"), "… l'acheteur, les totaux, la nature, le paiement par échange");
ok((await facture.locator(".fp-imprimer").count()) === 1, "le bouton « Imprimer ou enregistrer en PDF »");
ok((await debordement(facture)) <= 0, "390 px : pas de débordement");
await facture.screenshot({ path: `${D}/63-facture.png`, fullPage: true });
await facture.emulateMedia({ media: "print" });
ok(!(await facture.locator(".fp-imprimer").isVisible()), "à l'impression, le bouton disparaît");
await facture.pdf({ path: `${D}/64-facture.pdf`, format: "A4" });
await facture.emulateMedia({ media: "screen" });
const petite = await tel(320);
await petite.goto(`${BASE}${lien}`, { waitUntil: "networkidle", timeout: 400000 });
ok((await debordement(petite)) <= 0, `320 px, la facture : pas de débordement (${await debordement(petite)})`);
await petite.screenshot({ path: `${D}/65-facture-320.png`, fullPage: true });

/* ── LA SUIVANTE SE FAIT TOUTE SEULE ────────────────────────── */
const p2 = await appel("atelier-lou-dax", "prendre", { fournisseur: SITES.bergine.id });
await comptoir(bergine, "chez-bergine-dax");
ok(!(await bergine.locator(".ec-tiroirs button", { hasText: "Mes factures" }).innerText()).includes("·"), "ses infos données : plus de pastille");
await bergine.locator(".ec-tiroirs button", { hasText: "À valider" }).click();
await bergine.locator(".ec-code input").fill(p2.etat.pris[0].code);
await bergine.locator(".ec-code button").click();
await bergine.waitForFunction(() => document.querySelector(".ec-toast")?.textContent?.includes("Validé"), null, { timeout: 30000 });
ok(!(await texte(bergine, ".ec-toast")).includes("t’attend"), `validé : « ${await texte(bergine, ".ec-toast")} »`);
await bergine.locator(".ec-tiroirs button", { hasText: "Mes factures" }).click();
await bergine.waitForSelector(".fa-ligne", { timeout: 30000 });
ok((await bergine.locator(".fa-ligne").count()) === 2 && (await texte(bergine, ".fa-ligne")).includes(`ECH-${an}-0002`), "deux factures : la plus récente en tête, ECH-…-0002");
ok((await texte(bergine, ".fa-mois")).includes("100,00 €"), `« ${await texte(bergine, ".fa-mois")} »`);

/* ── LOU REÇOIT, SANS AVOIR DONNÉ SES INFOS ─────────────────── */
const lou = await tel();
await comptoir(lou, "atelier-lou-dax");
await lou.locator(".ec-tiroirs button", { hasText: "Mes factures" }).click();
await lou.waitForSelector(".fa-carte", { timeout: 30000 });
ok(/reçues/i.test(await texte(lou, ".ec-feuille")) && (await texte(lou, ".fa-ligne")).includes("Chez Bergine"), "Lou voit la facture reçue de Bergine");
await lou.screenshot({ path: `${D}/66-lou-recue.png` });

/* ── VEVEY : LE RELEVÉ, PAS DE FACTURE ──────────────────────── */
const alice = await tel();
await comptoir(alice, "page-alice-vevey");
const boutonAlice = alice.locator(".ec-tiroirs button", { hasText: "Mes échanges" });
ok((await boutonAlice.count()) === 1, "à Vevey, le tiroir s'appelle « Mes échanges »");
await boutonAlice.click();
await alice.waitForTimeout(1500);
ok((await texte(alice, ".ec-feuille")).includes("Ce n’est pas une facture"), "« Ce n’est pas une facture » : les factures suisses arrivent bientôt");

/* ── 320 PX : LE FORMULAIRE ─────────────────────────────────── */
const lou320 = await tel(320);
await comptoir(lou320, "atelier-lou-dax");
await lou320.locator(".ec-tiroirs button", { hasText: "Mes factures" }).click();
await lou320.getByRole("button", { name: "Compléter mes infos" }).click();
await lou320.waitForSelector(".fa-form", { timeout: 15000 });
ok((await debordement(lou320)) <= 0, "320 px, le formulaire : pas de débordement");
await lou320.screenshot({ path: `${D}/67-infos-320.png`, fullPage: true });

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
await demo.getByRole("button", { name: /Suivant/ }).click();
await demo.waitForTimeout(800);
await demo.getByRole("button", { name: /Voir ce que proposent les autres/ }).click();
await demo.waitForTimeout(3500);
await demo.locator(".ec-tiroirs button", { hasText: "Mes factures" }).click();
await demo.waitForTimeout(600);
ok((await texte(demo, ".fx-exemple")) !== "" && (await texte(demo, ".fx")).includes("Chez Bergine") && (await texte(demo, ".ec-feuille")).includes("la facture d’échange à ton nom"), "démo : une facture d'exemple, marquée « Exemple »");
ok((await debordement(demo)) <= 0, "démo : pas de débordement");
await demo.screenshot({ path: `${D}/68-demo-facture.png` });
await demo.locator(".ec-feuille .ec-fermer").click();
await demo.locator(".ec-tiroirs button", { hasText: "Comment ça marche" }).click();
await demo.waitForTimeout(400);
ok((await texte(demo, ".ec-feuille")).includes("Chaque bon validé chez toi a sa facture d’échange"), "« Comment ça marche » : la règle des factures");

for (const [n, p] of [["Bergine", bergine], ["facture", facture], ["320", petite], ["Lou", lou], ["Alice", alice], ["Lou 320", lou320], ["démo", demo]]) if (p.err.length) ok(false, `erreurs ${n} : ${p.err.slice(0, 3).join(" | ")}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exitCode = echecs ? 1 : 0;
