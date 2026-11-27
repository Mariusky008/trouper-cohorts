// ⏪ LE SALON EN RATTRAPAGE, À L'ÉCRAN (`app/collection/rattrapage.tsx`, `/univers/rattrapage` ; `docs/univers/rattrapage.md`,
// le lot T2) — sur un iPhone, contre le faux Supabase et un faux lecteur YouTube (on règle sa seconde).
//
// Léa et Sam étaient à la séance du groupe « Les footeux » : Sam a écrit à 1:58, ils ont ri à 2:15 et 2:17. Zoé l'a
// ratée ; elle ouvre le rattrapage : « ⏪ Rattrapage », la vidéo, deux marques 😂 sur la barre ; Léa et Sam en
// « souvenir », elle « Toi · en rattrapage ». Au début, rien n'est dit (« 🔒 La suite arrive à sa seconde ») ; la vidéo
// passe 1:58 : le mot de Sam ; elle passe 2:15 : la figurine de Léa prend la scène (le grand moment 😂). Toucher une
// marque y emmène la vidéo. Une séance inventée : « Cette séance n'existe plus ». Rien ne déborde, jamais le mot
// « exemple », aucune erreur.
import sharp from "sharp";
import { BASE, F, lancer } from "./commun.mjs";
import { poserPiece } from "../piece-en-hauteur.mjs";

const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (les pages « Univers » s'ouvrent encore à l'administrateur : sa session, fausse)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@clikme.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000007b72${String(n).padStart(2, "0")}`, jeton: `jeton-rattrapage-nav-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const GENS = [LEA, SAM, ZOE, TOM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, accord_le: maintenant, prete_le: maintenant })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["foot", "musique", "humour"], poids: {}, le: maintenant });
}
// (Léa ↔ Sam : proches des deux côtés ; Zoé, Tom et Noé : de personne)
// (Léa ↔ Sam, Léa ↔ Zoé : proches ; Tom : de personne)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, ZOE.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

const appel = async (x, chemin, corps) => {
  const c = x ? `clikme_habitant=${x.jeton}` : "";
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const GROUPES = "/api/direct/mes-groupes";
const geste = (x, corps) => appel(x, GROUPES, corps);

// ─── leurs téléphones (un faux service de notifications, au faux Supabase) ───
const CLE = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_SAM = await CLE(SAM);
const CLE_ZOE = await CLE(ZOE);
await CLE(LEA);
const c = await geste(LEA, { action: "creer-groupe", nom: "Les footeux", theme: "foot", cles: [CLE_SAM, CLE_ZOE] });
const GID = c.groupe?.id;
ok(c.statut === 200 && GID, "Léa crée « Les footeux »");
await geste(SAM, { action: "garder-groupe", groupe: GID });
await geste(ZOE, { action: "garder-groupe", groupe: GID });
const journal = async (x) => appel(x, `${GROUPES}?groupe=${encodeURIComponent(GID)}&journal=1`);
const salon = (x, corps) => appel(x, "/api/direct/salons-ouverts", corps);


const R = "/api/direct/rattrapage";
const rattrapage = (x, qs) => appel(x, `${R}?${qs}`);


// ═══ LA SÉANCE (Léa et Sam y étaient ; Zoé non) ═══
const r = await geste(LEA, { action: "rdv-ajouter", groupe: GID, nom: "Le match de ce soir", recurrence: "une", quand: Date.now() + 5 * 60_000 });
ok(r.statut === 200, "Léa pose une séance dans cinq minutes");
const SALON = `groupe-${GID}`;
const eL = await salon(LEA, { action: "entrer-groupe", groupe: GID });
await salon(SAM, { action: "entrer-groupe", groupe: GID });
const V = eL.ouverture?.tele?.videos?.[0]?.id;
const ecrire = (x, corps) => salon(x, { action: "ecrire", salon: SALON, ...corps });
const pause = () => new Promise((f) => setTimeout(f, 1600));
await ecrire(SAM, { sorte: "texte", texte: "Regarde le gardien", ou: { video: V, t: 118 } });
await pause();
await ecrire(LEA, { sorte: "reaction", cle: "rire", ou: { video: V, t: 135 } });
await pause();
await ecrire(SAM, { sorte: "reaction", cle: "rire", ou: { video: V, t: 137 } });
const SEANCE = (await appel(ZOE, `/api/direct/rattrapage?de=${encodeURIComponent(GID)}`)).seances?.[0]?.cle;
ok(Boolean(SEANCE), "la séance est notée");

// ═══ ZOÉ LA RATTRAPE ═══
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this; self.t = 3;
  self.getCurrentTime = function () { return self.t; };
  self.getDuration = function () { return 400; };
  self.seekTo = function (t) { self.t = t; d.dataset.va = String(t); };
  self.playVideo = function () { d.dataset.joue = "1"; };
  self.destroy = function () { d.remove(); };
  window.__lecteur = self;
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: ZOE.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route("https://www.youtube.com/iframe_api", (x) => x.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (x) => x.fulfill({ status: 200, contentType: "image/png", body: PNG }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/i.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const seconde = (t) => p.evaluate((x) => (window.__lecteur.t = x), t);

await p.goto(`${BASE}/univers/rattrapage?seance=${encodeURIComponent(SEANCE)}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".rt[data-rattrapage]").count()) > 0), "le salon en rattrapage s'ouvre");
ok((await texte(p.locator(".rt-pastille"))) === "⏪ Rattrapage", "« ⏪ Rattrapage »");
ok(/Le match de ce soir/.test(await texte(p.locator(".rt-quand"))), `« ${await texte(p.locator(".rt-quand"))} »`);
ok(await attendre(async () => (await p.locator(".faux-yt").getAttribute("data-yt")) === V), "la vidéo de la séance, dans le lecteur de YouTube");
ok((await p.locator(".rt-marque").count()) === 1, "une marque 😂 sur la barre (les deux rires, si proches, n'en font qu'une)");
ok((await p.locator(".rt-place.souvenir").count()) === 2 && (await texte(p.locator(".rt-place.souvenir").first())).startsWith("Léa"), "Léa et Sam, en souvenir");
ok(/Toi en rattrapage/.test(await texte(p.locator(".rt-place.moi"))), "Zoé : « Toi · en rattrapage »");
ok(await attendre(async () => /Rien n’a encore été dit/.test(await texte(p.locator(".rt-dit")))), "au début : rien n'est encore dit");
ok(/La suite arrive à sa seconde/.test(await texte(p.locator(".rt-dit"))), "« 🔒 La suite arrive à sa seconde, pas avant. »");

await seconde(119);
ok(await attendre(async () => /Sam · à 1:58/.test(await texte(p.locator(".rt-dit")))), "la vidéo passe 1:58 : le mot de Sam arrive");
ok((await p.locator(".rt-trace").count()) === 1, "… et rien de plus");
for (const t of [121, 123, 125, 127, 129, 131, 133, 134]) await seconde(t), await p.waitForTimeout(300);
await seconde(135.5);
ok(await attendre(async () => (await p.locator('.gm[data-grand-moment="rire"]').count()) > 0), "la vidéo passe 2:15 : la figurine de Léa prend la scène (😂)");
ok((await p.locator(".gm .gm-bulle").count()) > 0, `sa bulle : « ${await texte(p.locator(".gm .gm-bulle").first())} »`);
await p.screenshot({ path: `${process.env.ESSAI_CAPTURES ?? "/tmp"}/rattrapage-moment.png` }).catch(() => null);

await p.locator(".rt-marque").first().click();
ok(await attendre(async () => Number(await p.locator(".faux-yt").getAttribute("data-va")) === 132), "toucher une marque : la vidéo y va (trois secondes avant)");

ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, "rien ne déborde");
ok(!/exemple/i.test(await p.locator("body").innerText()), "jamais le mot « exemple »");

await p.goto(`${BASE}/univers/rattrapage?seance=n-importe-quoi`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => /Cette séance n’existe plus/.test(await texte(p.locator("[data-rattrapage-erreur]")))), "une séance inventée : « Cette séance n’existe plus. »");
ok(erreurs.length === 0, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nLe salon en rattrapage tient ✓");
process.exit(echecs ? 1 : 0);
