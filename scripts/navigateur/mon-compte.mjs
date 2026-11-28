// 👤 MON COMPTE — l'audit UX du 28 novembre 2026, lot 5 (`app/collection/mon-compte.tsx`, la page Moi), sur un iPhone,
// contre le faux Supabase (jamais la vraie base).
//
// Léa (sa figurine pas sauvegardée) : dans Moi, « Mon compte » — « Confidentialité », « Se déconnecter », « Supprimer
// mon compte ». « Se déconnecter » la prévient d'abord : « Ta figurine n'est pas sauvegardée… », « 🔒 Sauvegarder
// d'abord », « Me déconnecter quand même » ; « Annuler » ferme. Hugo (sauvegardée) : « on t'enverra un code à… » ;
// « Me déconnecter » : retour à l'accueil, le cookie et ce que le téléphone retenait (`clikme-…`) partis, son compte
// gardé. Zoé : « Supprimer mon compte » — ce qui part, « C'est définitif », le bouton grisé tant que la case n'est pas
// cochée ; cochée : « Ton compte est supprimé… », puis l'accueil ; son compte n'existe plus. La page « Confidentialité ».
// Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lignes = async (t) => (await (await fetch(`${F}/${t}`)).json()) ?? [];
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const LEA = { id: "6a1e0000-0000-4000-8000-00000000c501", jeton: "jeton-mon-compte-nav-0001", prenom: "Léa" };
const HUGO = { id: "6a1e0000-0000-4000-8000-00000000c502", jeton: "jeton-mon-compte-nav-0002", prenom: "Hugo", email: "hugo@example.invalid" };
const ZOE = { id: "6a1e0000-0000-4000-8000-00000000c503", jeton: "jeton-mon-compte-nav-0003", prenom: "Zoé" };
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, HUGO, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax", ...(x.email ? { email: x.email, email_verifie_le: maintenant } : {}) })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><circle cx="200" cy="200" r="150" fill="#f0c8a0"/></svg>`), left: 0, top: 0 }])
  .png()
  .toBuffer();
for (const x of [LEA, HUGO, ZOE]) {
  await deposer(`${x.id}/neutre.webp`, assise, "image/png");
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { le: maintenant, age: 30, adulte: true });
}
await semer("clik_ma_figurine", [LEA, HUGO, ZOE].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre.webp`, parle: `${x.id}/neutre.webp`, prete_le: maintenant })));

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const telephone = async (qui) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  // (la bienvenue de Pablito déjà vue sur ces téléphones : elle ne se pose pas sur la page Moi, même tard, sur une
  // machine chargée — un premier passage en série avait échoué ainsi)
  await ctx.addInitScript(() => {
    try {
      window.localStorage.setItem("clikme-tuto-bienvenue", "1");
    } catch {
      /* rien */
    }
  });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  return { ctx, p };
};
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
// (la page Moi, ce qui s'ouvre par-dessus à l'arrivée écarté : la bienvenue, « Ne perds jamais ta figurine »)
async function ouvrirMoi(p) {
  await p.goto(`${BASE}/collection#moi`, { waitUntil: "networkidle" });
  if (await attendre(p, async () => (await p.locator(".bv .tu-passer").count()) === 1, 4000)) await p.locator(".bv .tu-passer").click();
  if (await attendre(p, async () => (await p.locator(".mc-feuille-proteger.ouverte").count()) === 1, 2500)) await p.keyboard.press("Escape");
  return attendre(p, async () => (await p.locator('#o-personnage [data-groupe="compte"]').count()) === 1, 20000);
}
const propre = async (p, nom) => {
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
};

// ═══ LÉA : « MON COMPTE », ET LA DÉCONNEXION SANS SAUVEGARDE ═══
{
  const { ctx, p } = await telephone(LEA);
  ok(await ouvrirMoi(p), "dans Moi : « Mon compte »");
  const groupe = p.locator('#o-personnage [data-groupe="compte"]');
  ok(/Confidentialité/.test(await groupe.innerText()) && /Se déconnecter/.test(await groupe.innerText()) && /Supprimer mon compte/.test(await groupe.innerText()), "… « Confidentialité », « Se déconnecter », « Supprimer mon compte »");
  ok((await groupe.locator('a[data-ligne="confidentialite"]').getAttribute("href")) === "/collection/confidentialite", "… « Confidentialité » mène à la page ClikMe");
  await groupe.locator('[data-ligne="supprimer"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${D}/mon-compte-1-moi.png` });
  await groupe.locator('[data-ligne="deconnecter"]').click();
  const f = p.locator("[data-feuille-deconnexion]");
  ok(await attendre(p, async () => (await f.locator("[data-deconnexion-pas-sauvee]").count()) === 1), "« Se déconnecter » : « Ta figurine n’est pas sauvegardée… »");
  ok((await f.locator("[data-sauver-dabord]").count()) === 1 && (await f.locator("[data-deconnecter-quand-meme]").count()) === 1, "… « 🔒 Sauvegarder d’abord », « Me déconnecter quand même »");
  await p.screenshot({ path: `${D}/mon-compte-2-pas-sauvee.png` });
  await f.locator("[data-sauver-dabord]").click();
  ok(await attendre(p, async () => (await f.locator("input[type=email]").count()) === 1), "« Sauvegarder d’abord » : son adresse, dans la même feuille");
  await f.getByRole("button", { name: "Annuler" }).click();
  ok(await attendre(p, async () => (await p.locator(".tf-feuille.ouverte [data-feuille-deconnexion]").count()) === 0), "« Annuler » : la feuille se ferme");
  ok((await ctx.cookies()).some((c) => c.name === "clikme_habitant"), "… et elle est toujours connectée");
  await propre(p, "Moi");
  await ctx.close();
}

// ═══ HUGO : SAUVEGARDÉE, IL SE DÉCONNECTE ═══
{
  const { ctx, p } = await telephone(HUGO);
  ok(await ouvrirMoi(p), "Hugo, dans Moi");
  await p.evaluate(() => localStorage.setItem("clikme-essai-a-oublier", "1"));
  // (la clé de la bienvenue revient à chaque page, par le script d'essai : seule celle-ci dit si l'oubli a eu lieu)
  await p.locator('#o-personnage [data-ligne="deconnecter"]').click();
  const f = p.locator("[data-feuille-deconnexion]");
  ok(await attendre(p, async () => /on t’enverra un code à/.test(await f.locator("[data-deconnexion-sauvee]").innerText())), `sauvegardée : « Pour revenir, touche « J’ai déjà une figurine »… » (${(await f.innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 120)})`);
  await p.screenshot({ path: `${D}/mon-compte-3-sauvee.png` });
  await f.locator("[data-confirmer-deconnexion]").click();
  ok(await attendre(p, async () => !(await ctx.cookies()).some((c) => c.name === "clikme_habitant") && new URL(p.url()).pathname === "/collection"), "« Me déconnecter » : le cookie part, retour à l'accueil");
  ok((await p.evaluate(() => localStorage.getItem("clikme-essai-a-oublier"))) === null, "… ce que le téléphone retenait de ClikMe, oublié");
  ok((await lignes("human_habitants")).some((x) => x.id === HUGO.id), "… et son compte reste");
  await ctx.close();
}

// ═══ ZOÉ : SUPPRIMER MON COMPTE ═══
{
  const { ctx, p } = await telephone(ZOE);
  ok(await ouvrirMoi(p), "Zoé, dans Moi");
  await p.locator('#o-personnage [data-ligne="supprimer"]').click();
  const f = p.locator("[data-feuille-suppression]");
  ok(await attendre(p, async () => /Tout part, tout de suite/.test(await f.innerText()) && /définitif/.test(await f.innerText())), "« Supprimer mon compte » : ce qui part, « C’est définitif »");
  ok(await f.locator("[data-confirmer-suppression]").isDisabled(), "… le bouton grisé tant que la case n'est pas cochée");
  await p.screenshot({ path: `${D}/mon-compte-4-supprimer.png` });
  await f.locator("[data-compris]").check();
  ok(!(await f.locator("[data-confirmer-suppression]").isDisabled()), "… cochée : il s'allume");
  await f.locator("[data-confirmer-suppression]").click();
  ok(await attendre(p, async () => (await f.locator("[data-compte-supprime-fait]").count()) === 1), "« Ton compte est supprimé. Merci d’être passé par ClikMe. »");
  await p.screenshot({ path: `${D}/mon-compte-5-supprime.png` });
  ok(!(await lignes("human_habitants")).some((x) => x.id === ZOE.id) && !(await lignes("clik_ma_figurine")).some((x) => x.habitant_id === ZOE.id), "… son compte et sa figurine n'existent plus");
  ok(await attendre(p, async () => new URL(p.url()).pathname === "/collection" && !(await ctx.cookies()).some((c) => c.name === "clikme_habitant"), 10000), "… puis l'accueil, sans cookie");
  await ctx.close();
}

// ═══ LA PAGE « CONFIDENTIALITÉ » ═══
{
  const { ctx, p } = await telephone(LEA);
  await p.goto(`${BASE}/collection/confidentialite`, { waitUntil: "networkidle" });
  const t = await p.evaluate(() => document.body.innerText);
  ok(/Confidentialité/.test(await p.locator("h1").innerText()) && /Ton selfie/.test(t) && /Supprimer mon compte/.test(t) && /15 ans/.test(t), "la page « Confidentialité » : le selfie, l'effacement, les plus jeunes");
  ok(!/Popey Academy/i.test(t), "… celle de ClikMe (plus celle de Popey Academy)");
  await p.screenshot({ path: `${D}/mon-compte-6-confidentialite.png`, fullPage: true });
  await propre(p, "la confidentialité");
  await ctx.close();
}

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nMon compte : tout est bon");
process.exit(echecs ? 1 : 0);
