// À moitié prix au navigateur : Lou prend le dîner de Bergine à moitié prix (deux fois, plus de
// « une fois par mois ») ; ses textes ne parlent plus de crédits ; Bergine valide et encaisse, ses
// crédits ne bougent pas ; « Comment ça marche » ; la démo (lasagnes à −50 % seulement) ; 320 px.
import { BASE, D, F, lancer } from "./commun.mjs";
import { SITES } from "./semer.mjs";
const R = `${BASE}/api/site-internet/pro/echanges`;
await fetch(`${F}/human_vitrine_sites`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.values(SITES)) });
const appel = async (slug, action, extra = {}) =>
  (await fetch(R, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, token: "jeton-test", action, ...extra }) })).json();
await appel("chez-bergine-dax", "offre", { titre: "Un dîner pour deux", prix: 50, parMois: 4, paiement: "les_deux", accepte: true });
await appel("fleurs-adour-dax", "offre", { titre: "Un bouquet de saison", prix: 35, parMois: 4, paiement: "credits", accepte: true });
await appel("atelier-lou-dax", "offre", { titre: "Une coupe et un brushing", prix: 45, parMois: 4, accepte: true });

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
const comptoir = async (p, slug) => {
  await p.goto(`${BASE}/autour-de-moi/assistante?site=${slug}&k=jeton-test&ouvrir=echanges`, { waitUntil: "networkidle", timeout: 400000 });
  await p.waitForSelector(".ec-tiroirs", { timeout: 60000 });
  await p.waitForTimeout(800);
};
/** Fait défiler la pile jusqu'à la carte de ce commerce. */
const jusqua = async (p, commerce) => {
  for (let i = 0; i < 6; i++) {
    if ((await texte(p, ".ec-glisse .ec-qui")).includes(commerce)) return true;
    await p.locator(".ec-non").first().click().catch(() => undefined);
    await p.waitForTimeout(500);
  }
  return false;
};

/* ── LOU PREND LE DÎNER À MOITIÉ PRIX ──────────────────────── */
const lou = await tel();
await comptoir(lou, "atelier-lou-dax");
ok(await jusqua(lou, "Chez Bergine"), "la carte de Bergine dans la pile");
const carteB = await texte(lou, ".ec-glisse .ec-carte");
ok(carteB.includes("🪙 Tes crédits 50 crédits valeur 50 €") && carteB.includes("💶 Moitié prix 50 € 25 € à payer sur place") && /👥 \d+ réservation|✨ Nouvelle offre/.test(carteB) && /Il en reste \d+ ce mois-ci|Plus que \d+ ce mois-ci/.test(carteB), `la carte : « ${carteB.slice(-150)} »`);
ok((await lou.locator(".ec-oui").innerText()).trim() === "Je prends", "le bouton : « Je prends », sans montant");
await lou.locator(".ec-oui").click();
await lou.waitForSelector(".ec-payer", { timeout: 15000 });
const moitie = lou.locator(".ec-payer-b.moitie");
ok((await moitie.innerText()).includes("Tu paies en euros, sur place") && (await moitie.isEnabled()), `« À moitié prix » : « ${(await moitie.innerText()).replace(/\s+/g, " ")} »`);
const credits = lou.locator(".ec-payer-b.credits");
ok(/Tu ne sors pas d’argent\. Il te restera 0\scrédit\./.test(await credits.innerText()) && (await credits.locator(".ec-payer-m").innerText()).replace(/\s+/g, " ") === "50 crédits valeur 50 €", `« Avec tes crédits » : « ${(await credits.innerText()).replace(/\s+/g, " ")} »`);
await lou.screenshot({ path: `${D}/70-comment-tu-paies.png` });
await moitie.click();
await lou.waitForSelector(".mg-go", { timeout: 15000 });
await lou.locator(".mg-go").click();
await lou.waitForTimeout(800);
const recu = await texte(lou, ".ec-feuille-c");
ok(recu.includes("tu régleras 25 € sur place") && !/l’autre moitié|en crédits/.test(recu), `le bon : « ${recu.slice(0, 140)} »`);
await lou.getByRole("button", { name: /C’est noté/ }).click().catch(() => undefined);
await lou.waitForTimeout(400);

/* ── UNE DEUXIÈME FOIS : PLUS DE « UNE FOIS PAR MOIS » ──────── */
await comptoir(lou, "atelier-lou-dax");
ok(await jusqua(lou, "Chez Bergine"), "Bergine encore dans la pile");
await lou.locator(".ec-oui").click();
await lou.waitForSelector(".ec-payer", { timeout: 15000 });
ok(await lou.locator(".ec-payer-b.moitie").isEnabled(), "« À moitié prix » reste possible une deuxième fois");
await lou.locator(".ec-payer-b.moitie").click();
await lou.waitForTimeout(1500);
await comptoir(lou, "atelier-lou-dax");
await lou.locator(".ec-tiroirs button", { hasText: "Mes bons" }).click();
await lou.waitForTimeout(500);
const bons = await texte(lou, ".ec-feuille");
ok((bons.match(/à moitié prix : 25 €/g) ?? []).length === 2, "« Mes bons » : deux dîners à moitié prix, 25 € chacun");
await lou.locator(".ec-recu-h").first().click().catch(() => undefined);
await lou.waitForTimeout(500);
ok((await texte(lou, ".ec-feuille")).includes("règle-lui 25 € sur place : il le scanne, ou il le tape dans son comptoir.") && !(await texte(lou, ".ec-feuille")).includes("crédits"), "le bon ouvert : « règle-lui 25 € sur place », sans crédits");
await lou.screenshot({ path: `${D}/71-mes-bons.png` });

/* ── BERGINE VALIDE : ELLE ENCAISSE, SES CRÉDITS NE BOUGENT PAS ── */
const bergine = await tel();
await comptoir(bergine, "chez-bergine-dax");
const soldeAvant = await texte(bergine, ".ec-solde");
await bergine.locator(".ec-tiroirs button", { hasText: "À valider" }).click();
await bergine.waitForTimeout(500);
const liste = await texte(bergine, ".ec-feuille");
ok(liste.includes("à moitié prix : encaisse 25 € sur place") && !liste.includes("crédits"), "« À valider » : « à moitié prix : encaisse 25 € sur place », sans crédits");
const code = (await appel("atelier-lou-dax", "etat")).etat.pris.find((x) => x.mode === "moitie").code;
await bergine.locator(".ec-code input").fill(code);
await bergine.locator(".ec-code button").click();
await bergine.waitForFunction(() => document.querySelector(".ec-toast")?.textContent?.includes("Validé"), null, { timeout: 30000 });
const toast = await texte(bergine, ".ec-toast");
ok(/à moitié prix : encaisse 25 € sur place\./.test(toast) && !/crédit/.test(toast), `validé : « ${toast} »`);
await bergine.waitForTimeout(600);
ok((await texte(bergine, ".ec-solde")) === soldeAvant, `son solde ne bouge pas : « ${soldeAvant} »`);
await bergine.screenshot({ path: `${D}/72-bergine-valide.png` });
await comptoir(bergine, "chez-bergine-dax");
await bergine.locator(".ec-tiroirs button", { hasText: "Comment ça marche" }).click();
await bergine.waitForTimeout(400);
const regles = await texte(bergine, ".ec-feuille");
ok(regles.includes("pour écouler ton stock") && regles.includes("pas de crédits, ni pour lui ni pour toi") && !/ne perds rien|une fois par mois/.test(regles), "« Comment ça marche » : à moitié prix, c’est tout");
await bergine.screenshot({ path: `${D}/73-regles.png`, fullPage: true });

/* ── LA DÉMONSTRATION ───────────────────────────────────────── */
const demo = await tel(320);
await demo.goto(`${BASE}/autour-de-moi/assistante`, { waitUntil: "networkidle", timeout: 400000 });
await demo.waitForTimeout(1500);
await demo.getByRole("button", { name: /Restaurant/ }).first().click();
await demo.waitForTimeout(2500);
await demo.locator("button.cz-outil", { hasText: "Échanges" }).first().click({ timeout: 60000 });
await demo.waitForTimeout(6500);
await demo.getByRole("button", { name: /C’est ça/ }).click();
await demo.waitForTimeout(800);
await demo.getByRole("button", { name: /Suivant/ }).click();
await demo.waitForTimeout(800);
await demo.getByRole("button", { name: /Voir ce que proposent les autres/ }).click();
await demo.waitForTimeout(3500);
await demo.locator(".ec-oui").click();
await demo.waitForSelector(".ec-payer", { timeout: 15000 });
ok((await debordement(demo)) <= 0, "démo à 320 px, « Comment tu paies ? » : pas de débordement");
await demo.screenshot({ path: `${D}/74-demo-payer-320.png` });
const peutMoitie = await demo.locator(".ec-payer-b.moitie").isEnabled();
if (peutMoitie) {
  await demo.locator(".ec-payer-b.moitie").click();
  await demo.waitForSelector(".mg-go", { timeout: 15000 });
  await demo.locator(".mg-go").click();
  await demo.waitForTimeout(800);
  ok((await texte(demo, ".ec-feuille-c")).includes("sur place") && !(await texte(demo, ".ec-feuille-c")).includes("l’autre moitié"), "démo : le bon à moitié prix, sans crédits");
} else ok(true, "démo : la première carte n'accepte pas la moitié prix (échange seulement)");

for (const [n, p] of [["Lou", lou], ["Bergine", bergine], ["démo", demo]]) if (p.err.length) ok(false, `erreurs ${n} : ${p.err.slice(0, 3).join(" | ")}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exitCode = echecs ? 1 : 0;
