// 🛡️ LA CONFIANCE, LES PETITS RIENS — l'audit UX du 28 novembre 2026, lot 5b (`docs/audit-ux.md`, section 12), sur un
// iPhone, contre le faux Supabase (jamais la vraie base).
//
// Une adresse inconnue de l'appli (`/collection/…`, `/univers/…`) : la page introuvable de ClikMe (code 404), plus
// celle des commerçants — qui reste ailleurs. Le réseau coupé : « 📡 Pas de connexion… », qui part quand il revient.
// L'appli installée : son service worker tient la page et laisse passer l'appli (son écran « Pas de connexion » :
// `essai-hors-ligne-sw.mjs`). « ＋ Nouveau »,
// « Ajouter un proche » : « ✓ Lien copié… » se voit, la feuille fermée. « Ne perds jamais ta figurine » : l'adresse sur
// toute la largeur, le bouton dessous. Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const LEA = { id: "7c0f0000-0000-4000-8000-00000000d501", jeton: "jeton-confiance-nav-0001", prenom: "Léa" };
const maintenant = new Date().toISOString();
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: LEA.prenom, ville_slug: "dax" }]);
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><circle cx="200" cy="200" r="150" fill="#f0c8a0"/></svg>`), left: 0, top: 0 }])
  .png()
  .toBuffer();
await deposer(`${LEA.id}/neutre.webp`, assise, "image/png");
await deposer(`${LEA.id}/perso/v1/assise.png`, assise, "image/png");
const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${LEA.id}/perso/v1/assise.png` } }, historique: [] };
await json(`${LEA.id}/perso/v1/fiche.json`, fiche);
await json(`${LEA.id}/perso/fiche.json`, fiche);
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 30, adulte: true });
await semer("clik_ma_figurine", [{ habitant_id: LEA.id, prenom: LEA.prenom, photo: `${LEA.id}/photo.jpg`, accord_le: maintenant, neutre: `${LEA.id}/neutre.webp`, parle: `${LEA.id}/neutre.webp`, prete_le: maintenant }]);

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }]);
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("clikme-tuto-bienvenue", "1");
  } catch {
    /* rien */
  }
});
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
const propre = async (nom) => {
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
};

// ═══ LA PAGE INTROUVABLE ═══
for (const chemin of ["/collection/nexiste-pas", "/univers/nexiste-pas/du-tout"]) {
  const r = await p.goto(`${BASE}${chemin}`, { waitUntil: "domcontentloaded" });
  ok(r?.status() === 404 && (await p.locator("[data-introuvable]").count()) === 1 && /Cette page n’existe pas/.test(await p.locator("h1").innerText()), `${chemin} : la page introuvable de ClikMe (${r?.status()})`);
  ok((await p.locator('[data-introuvable] a[href="/collection"]').count()) === 1, "… et « Revenir à ClikMe »");
}
await p.screenshot({ path: `${D}/confiance-1-introuvable.png` });
await propre("la page introuvable");
const ailleurs = await p.goto(`${BASE}/nexiste-pas-du-tout`, { waitUntil: "domcontentloaded" });
ok(ailleurs?.status() === 404 && (await p.locator("[data-introuvable]").count()) === 0, "hors de l'appli : la page 404 des commerçants, comme avant");

// ═══ LE RÉSEAU COUPÉ ═══
await p.goto(`${BASE}/collection#proches`, { waitUntil: "networkidle" });
ok((await p.locator("[data-hors-ligne]").count()) === 0, "en ligne : pas de bandeau");
await ctx.setOffline(true);
ok(await attendre(async () => /Pas de connexion/.test(await p.locator("[data-hors-ligne]").innerText()), 5000), "hors ligne : « 📡 Pas de connexion : ClikMe reprend dès qu’elle revient. »");
await p.screenshot({ path: `${D}/confiance-2-bandeau.png` });
await ctx.setOffline(false);
ok(await attendre(async () => (await p.locator("[data-hors-ligne]").count()) === 0, 5000), "le réseau revenu : le bandeau part");

// ═══ « AJOUTER UN PROCHE » : LE LIEN COPIÉ SE VOIT ═══
// (l'appli d'aujourd'hui : « ＋ Nouveau », « Ajouter un proche », dans une feuille qui se ferme ; sans l'univers, comme
// en CI : « 🔗 Envoyer mon lien », sous la liste — le même lien, le même message)
await attendre(async () => (await p.locator(".cm-nouveau, .pr-lien button").count()) > 0, 20000);
if ((await p.locator(".cm-nouveau").count()) > 0) {
  await p.locator(".cm-nouveau").first().click();
  await p.locator(".tf-feuille.ouverte button:has-text('Ajouter un proche')").click();
} else await p.locator(".pr-lien button").click();
ok(await attendre(async () => /Lien copié/.test(await p.locator("[data-lien-copie]").innerText()), 5000), "« Ajouter un proche » : « ✓ Lien copié : colle-le dans WhatsApp ou un SMS », par-dessus la page");
ok(/proche=/.test(await p.evaluate(() => navigator.clipboard.readText()).catch(() => "")), "… le lien est dans le presse-papiers");
await p.screenshot({ path: `${D}/confiance-3-lien-copie.png` });

// ═══ « NE PERDS JAMAIS TA FIGURINE » : L'ADRESSE SUR TOUTE LA LARGEUR ═══
await p.goto(`${BASE}/collection#moi`, { waitUntil: "networkidle" });
await attendre(async () => (await p.locator('#o-personnage [data-ligne="sauver"]').count()) === 1, 20000);
await p.locator('#o-personnage [data-ligne="sauver"]').click();
const champ = p.locator('.mc-feuille-proteger.ouverte input[type="email"]');
ok(await attendre(async () => (await champ.count()) === 1), "« Sauvegarder ma figurine » : « Ne perds jamais ta figurine »");
const c = await champ.boundingBox();
const bouton = await p.locator(".mc-feuille-proteger.ouverte .cn-ligne .mp-bouton").boundingBox();
ok(c && c.width > 300 && bouton && bouton.y >= c.y + c.height - 1, `… l'adresse sur toute la largeur (${Math.round(c?.width ?? 0)} pt), le bouton dessous`);
await p.screenshot({ path: `${D}/confiance-4-adresse.png` });

// ═══ L'APPLI INSTALLÉE : SON SERVICE WORKER TIENT LA PAGE, ET LAISSE PASSER L'APPLI ═══
// (posé comme l'appli installée le pose au lancement. Son écran « Pas de connexion », réseau en panne, est vérifié par
// `essai-hors-ligne-sw.mjs` : la coupure simulée par Playwright ne s'applique pas toujours aux requêtes d'un service
// worker, selon la version de Chromium — en CI, la page arrivait quand même)
await p.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await p.evaluate(async () => {
  await navigator.serviceWorker.register("/collection-sw.js", { scope: "/collection" });
  await navigator.serviceWorker.ready;
});
await p.reload({ waitUntil: "networkidle" });
ok(await attendre(async () => p.evaluate(() => Boolean(navigator.serviceWorker.controller)), 8000), "le service worker de l'appli tient la page");
await p.goto(`${BASE}/collection?v=2`, { waitUntil: "networkidle" });
ok((await p.locator("main.mc").count()) === 1 && (await p.locator("body[data-hors-ligne]").count()) === 0, "le réseau qui répond : l'appli, telle quelle, à travers lui");
await p.screenshot({ path: `${D}/confiance-5-appli-installee.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nLa confiance : tout est bon");
process.exit(echecs ? 1 : 0);
