// 🎯 LES JEUX DU SALON : « JE TE METS AU DÉFI », À L'ÉCRAN (26 novembre 2026 ; `src/app/univers/salons/jeux.tsx`,
// `docs/univers/decouvrir.md` section 41 ; la maquette validée).
//
// Sur un iPhone, Léa est au salon du foot avec Sam et Tom. Elle touche Sam, « 🎯 Je te mets au défi », écrit sa question,
// « dans 30 s », lance. Sam répond (caché : 🔒), Tom tente sa chance. Le moment de vérité : Léa et Tom disent ce qu'ils
// ont vu. « Sam a trouvé ! », « +10 » au-dessus de lui. Puis Tom défie Léa : « Pas maintenant ».
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, lancer } from "./commun.mjs";

const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (la page des salons est encore réservée à l'administration : Léa y entre avec la session de l'administrateur)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@clikme.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `7e7e7e7e-0000-4000-8000-0000007e10${String(n).padStart(2, "0")}`, jeton: `jeton-defi-salon-nav-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const GENS = [LEA, SAM, TOM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/></svg>`), left: 0, top: 0 }])
    .png()
    .toBuffer();
for (const [x, couleur] of [
  [LEA, "#c8643c"],
  [SAM, "#3c8cc8"],
  [TOM, "#3cc88c"],
]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(couleur), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
}
const PNG1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) await deposer(`${x.id}/neutre-essai.png`, PNG1, "image/png");
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la télé des salons)");

const ROUTE = "/api/direct/salons-ouverts";
const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const oS = (await appel(SAM, ROUTE, { action: "entrer", theme: "foot" })).ouverture;
const salon = oS?.salon?.id;
const qSam = oS?.moi;
const qTom = (await appel(TOM, ROUTE, { action: "entrer", theme: "foot" })).ouverture?.moi;
ok(Boolean(salon && qSam && qTom), `Sam et Tom sont au salon du foot (${salon})`);

// ═══ LÉA ENTRE, ET LANCE « QUI EST D'ACCORD ? » ═══
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "window.YT={Player:function(){}};" }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }));
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await lea.waitForTimeout(200);
  }
  return false;
};
await lea.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await lea.locator(`.so-fig[data-q="${qSam}"]`).count()) === 1 && (await lea.locator(`.so-fig[data-q="${qTom}"]`).count()) === 1, 30000), "Léa entre : Sam et Tom sont là");
const qLea = await lea.locator(".so-fig[data-moi]").getAttribute("data-q");
const chemin = `decouvrir/salons/adultes/${salon}/jeu.json`;
const avancer = async (o) => json(chemin, { ...(await lire(chemin)), ...o });

// ═══ LÉA TOUCHE SAM, ET LE DÉFIE ═══
await lea.locator(`.so-fig[data-q="${qSam}"]`).click({ force: true });
const defierFiche = lea.locator(`[data-defier-fiche="${qSam}"]`);
ok(await attendre(async () => (await defierFiche.count()) === 1), "sa fiche : « 🎯 Je te mets au défi »");
await defierFiche.click();
const feuille = lea.locator("[data-feuille-defi]");
ok(await attendre(async () => (await feuille.count()) === 1) && /Défier Sam/.test(await feuille.innerText()), "la feuille s'ouvre : « 🎯 Défier Sam »");
await feuille.locator("input").fill("Il va réussir son saut ?");
const quand = feuille.locator("[data-quand-choix]");
ok((await quand.count()) >= 1 && /dans 30 s/.test(await quand.first().innerText()), "« On le saura » : dans 30 s…");
await quand.first().click();
await lea.screenshot({ path: `${D}/defi-salon-1-lancer.png` });
await feuille.locator("[data-lancer-defi]").click();
const carte = lea.locator('[data-jeu][data-sorte="defi"]');
ok(await attendre(async () => (await carte.count()) === 1 && (await carte.getAttribute("data-etape")) === "vote"), "la carte du défi arrive");
ok(/Tu défies Sam/.test(await carte.innerText()) && /Sam répond d’abord/.test(await carte.innerText()), "… « Tu défies Sam », « Sam répond d'abord… »");
ok(await attendre(async () => (await lea.locator(`[data-vote-de="${qLea}"][data-vote="🎯"]`).count()) === 1), "🎯 au-dessus de Léa");

// ═══ SAM RÉPOND, TOM TENTE SA CHANCE ═══
const jeu = (await appel(SAM, `${ROUTE}?salon=${encodeURIComponent(salon)}&depuis=${Date.now()}&connus=`)).pouls?.jeu;
ok(jeu?.a === qSam, "Sam voit qu'on le défie");
await appel(SAM, ROUTE, { action: "voter", salon, jeu: jeu.id, v: "oui" });
await appel(TOM, ROUTE, { action: "voter", salon, jeu: jeu.id, v: "non" });
ok(await attendre(async () => /Sam a répondu/.test(await carte.innerText()) && (await lea.locator(`[data-vote-de="${qSam}"][data-vote="🔒"]`).count()) === 1), "« ✓ Sam a répondu », 🔒 au-dessus de lui : sa réponse reste cachée");
await lea.screenshot({ path: `${D}/defi-salon-2-repondu.png` });

// ═══ LE MOMENT DE VÉRITÉ ═══
await avancer({ fin: Date.now() - 1000, finVerite: Date.now() + 29_000 });
ok(await attendre(async () => (await carte.getAttribute("data-etape")) === "verite"), "la vidéo a répondu : le moment de vérité");
ok(/Qu’avez-vous vu/.test(await carte.innerText()) && (await carte.locator("[data-temoigner]").count()) === 2, "… « Qu'avez-vous vu ? » Oui / Non");
await appel(TOM, ROUTE, { action: "temoigner", salon, jeu: jeu.id, v: "oui" });
await carte.locator('[data-temoigner="oui"]').click();
ok(await attendre(async () => (await carte.locator("[data-merci]").count()) === 1), "Léa dit ce qu'elle a vu : « Merci, c'est noté »");
await lea.screenshot({ path: `${D}/defi-salon-3-verite.png` });

// ═══ LE RÉSULTAT ═══
await avancer({ finVerite: Date.now() - 1000 });
ok(await attendre(async () => (await carte.getAttribute("data-etape")) === "resultat"), "le résultat");
ok((await carte.locator('[data-issue="trouve"]').count()) === 1 && /Sam a trouvé/.test(await carte.innerText()), "« Sam a trouvé ! »");
ok(await attendre(async () => (await lea.locator(`[data-vote-de="${qSam}"][data-vote="+10"]`).count()) === 1), "« +10 » saute au-dessus de Sam");
ok((await lea.locator(`[data-vote-de="${qTom}"]`).count()) === 0, "… rien au-dessus de Tom, qui s'est trompé");
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/defi-salon-4-resultat.png` });
await avancer({ fin: Date.now() - 60_000, finVerite: Date.now() - 50_000 });
ok(await attendre(async () => (await carte.count()) === 0), "puis la carte s'en va");

// ═══ TOM DÉFIE LÉA : « PAS MAINTENANT » ═══
const d2 = await appel(TOM, ROUTE, { action: "jeu", salon, sorte: "defi", a: qLea, texte: "Il va tomber ?", video: "GGGGGGGGGGG", quand: 60, reste: 300 });
ok(d2.statut === 200, "Tom défie Léa");
ok(await attendre(async () => /Tom te met au défi/.test(await carte.innerText().catch(() => ""))), "chez Léa : « Tom te met au défi »");
ok((await carte.locator("[data-pas-maintenant]").count()) === 1, "… Oui, Non, Pas maintenant");
await lea.screenshot({ path: `${D}/defi-salon-5-defiee.png` });
await carte.locator("[data-pas-maintenant]").click();
ok(await attendre(async () => (await carte.locator("[data-pas-maintenant-dit]").count()) === 1), "« Léa : pas maintenant. » Sans rien perdre");
ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
if (echecs) {
  console.log(`\n${echecs} ÉCHEC(S)`);
  process.exit(1);
}
console.log("\nTout est bon.");
