// 🙋 LES JEUX DU SALON : « QUI EST D'ACCORD ? », À L'ÉCRAN (26 novembre 2026 ; `src/app/univers/salons/jeux.tsx`,
// `docs/univers/decouvrir.md` section 41 ; la maquette validée).
//
// Sur un iPhone, Léa est au salon du foot, avec Sam et Tom. Elle touche « 🙋 Qui est d'accord ? », prend un début de
// phrase, lance. La carte arrive sous la pièce ; elle vote 👍 ; Sam 👎, Tom 👍 : une pancarte au-dessus de chaque
// figurine. Le vote ferme : les têtes de chaque camp, sans chiffre, 😎 pour le camp le plus fourni, 🤷 pour l'autre ;
// puis la carte s'en va seule. Jamais le mot « exemple », jamais un pourcentage.
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

const qui = (n, prenom) => ({ id: `7c7c7c7c-0000-4000-8000-0000007b10${String(n).padStart(2, "0")}`, jeton: `jeton-jeux-salon-nav-${String(n).padStart(2, "0")}`, prenom });
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
const bouton = lea.locator("[data-lancer-accord]");
ok((await bouton.innerText()).includes("Qui est d’accord ?"), "dans la barre : « 🙋 Qui est d'accord ? »");
await bouton.click();
const feuille = lea.locator("[data-feuille-accord]");
ok(await attendre(async () => (await feuille.count()) === 1), "la feuille s'ouvre");
ok((await feuille.locator("[data-debut]").count()) === 3, "… trois débuts de phrase, pour aller vite");
await feuille.locator("[data-debut]").last().click();
ok((await feuille.locator("input").inputValue()) === "C’est truqué", "… elle prend « C'est truqué »");
await lea.waitForTimeout(300);
await lea.screenshot({ path: `${D}/jeux-salon-1-lancer.png` });
await feuille.locator("[data-lancer]").click();
const carte = lea.locator("[data-jeu]");
ok(await attendre(async () => (await carte.count()) === 1 && (await carte.getAttribute("data-etape")) === "vote"), "la carte arrive : on vote");
ok((await feuille.count()) === 0 && (await bouton.isDisabled()), "… la feuille se ferme ; pas d'autre jeu en même temps");
ok(/Tu demandes/.test(await carte.innerText()) && /C’est truqué/.test(await carte.innerText()), "… « Tu demandes : C'est truqué »");

// ═══ ILS VOTENT ═══
await carte.locator('[data-voter="oui"]').click();
ok(await attendre(async () => (await lea.locator(`[data-vote-de="${qLea}"][data-vote="👍"]`).count()) === 1), "Léa vote 👍 : sa pancarte au-dessus de sa figurine");
const jeu = (await appel(SAM, `${ROUTE}?salon=${encodeURIComponent(salon)}&depuis=${Date.now()}&connus=`)).pouls?.jeu;
ok(Boolean(jeu?.id), "Sam voit le jeu");
await appel(SAM, ROUTE, { action: "voter", salon, jeu: jeu.id, v: "non" });
await appel(TOM, ROUTE, { action: "voter", salon, jeu: jeu.id, v: "oui" });
ok(await attendre(async () => (await lea.locator(`[data-vote-de="${qSam}"][data-vote="👎"]`).count()) === 1 && (await lea.locator(`[data-vote-de="${qTom}"][data-vote="👍"]`).count()) === 1), "Sam 👎, Tom 👍 : leurs pancartes arrivent avec le pouls");
await lea.screenshot({ path: `${D}/jeux-salon-2-vote.png` });

// ═══ LE VOTE FERME : LE RÉSULTAT ═══
const chemin = `decouvrir/salons/adultes/${salon}/jeu.json`;
const fiche = await lire(chemin);
await json(chemin, { ...fiche, fin: Date.now() - 1000 });
ok(await attendre(async () => (await carte.getAttribute("data-etape")) === "resultat"), "le vote ferme : le résultat");
ok((await carte.locator('[data-gagnant="oui"]').count()) === 1, "… le camp « d'accord » l'emporte");
ok((await carte.locator('[data-camp="oui"] .sj-tete').count()) === 2 && (await carte.locator('[data-camp="non"] .sj-tete').count()) === 1, "… les têtes de chaque camp : deux d'accord, une pas d'accord");
const texteCarte = await carte.innerText();
ok(!/%|\d/.test(texteCarte), `… sans chiffre ni pourcentage (${texteCarte.replace(/\s+/g, " ")})`);
ok(await attendre(async () => (await lea.locator(`[data-vote-de="${qLea}"][data-vote="😎"]`).count()) === 1 && (await lea.locator(`[data-vote-de="${qSam}"][data-vote="🤷"]`).count()) === 1), "… 😎 au-dessus du camp le plus fourni, 🤷 pour l'autre");
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/jeux-salon-3-resultat.png` });
ok(!/exemple/i.test(await lea.locator("body").innerText()), "jamais le mot « exemple »");
await json(chemin, { ...fiche, fin: Date.now() - 13_000 });
ok(await attendre(async () => (await carte.count()) === 0), "puis la carte s'en va seule");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
if (echecs) {
  console.log(`\n${echecs} ÉCHEC(S)`);
  process.exit(1);
}
console.log("\nTout est bon.");
