// 📲🔔 LE LOT 3 : CLIKME SUR L'ÉCRAN D'ACCUEIL, ET SES NOTIFICATIONS — contre le faux Supabase et son faux service de
// notifications (`PUSH_ESSAI_ORIGINE`). (Le mème du jour et sa notification de 11 h 30 sont partis le 23 novembre 2026.)
//
// Nina, sur iPhone, dans Safari : rien ne la dérange dans « Messages » ; dans « Moi », « Installer ». La page se recharge
// avec son jeton : le geste à faire (Partager, « Sur l'écran d'accueil »), et le manifeste ouvrira l'appli sur ce jeton.
// L'appli posée (ses cookies à elle, vides) s'ouvre sur « Messages » : le jeton lui rend SA figurine, une seule fois.
// « Tes proches te parlent : je te préviens ? » → « Oui, préviens-moi » → « C'est réglé ! » arrive sur son téléphone
// (déchiffré ici comme le téléphone le ferait). Tom, son proche, lui écrit : elle est prévenue. Un téléphone qui a
// abandonné son abonnement est effacé. Nina coupe dans « Moi » : plus rien ne lui arrive. Android : la vraie proposition
// d'installer. Instagram : « Ouvre ClikMe dans ton navigateur ». Rien ne déborde, jamais le mot interdit, aucune erreur.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (seau, chemin, corps, type) => fetch(`${STOCK}/${seau}/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (seau, chemin, x) => deposer(seau, chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};
const pushs = async () => (await fetch(`${FAUX}/__push`)).json();

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const INSTAGRAM = `${IPHONE} Instagram 300.0.0.0 (iPhone14,5; iOS 18_0; fr_FR; fr; scale=3.00; 1170x2532)`;

const NINA = { id: "eeeeeeee-0000-4000-8000-000000000101", jeton: "jeton-nina-appli-0000000001", prenom: "Nina" };
const TOM = { id: "eeeeeeee-0000-4000-8000-000000000102", jeton: "jeton-tom-appli-00000000001", prenom: "Tom" };
const MORT = { id: "eeeeeeee-0000-4000-8000-000000000103", jeton: "jeton-mort-appli-0000000001", prenom: "Sacha" };
const ANDY = { id: "eeeeeeee-0000-4000-8000-000000000104", jeton: "jeton-andy-appli-0000000001", prenom: "Andy" };

// ─── un faux téléphone : sa clé, son secret, son adresse au faux service ; et de quoi lire ce qu'il reçoit ───
function telephone(nom, mort = false) {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  const endpoint = `${FAUX}/push/${mort ? "mort/" : ""}${nom}-${crypto.randomBytes(4).toString("hex")}`;
  return { ecdh, auth, endpoint, abonnement: { endpoint, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } } };
}
/** Déchiffrer comme le téléphone (RFC 8291, `aes128gcm`). */
function dechiffrer(t, b64) {
  const buf = Buffer.from(b64, "base64");
  const sel = buf.subarray(0, 16);
  const idlen = buf[20];
  const sa = buf.subarray(21, 21 + idlen);
  const chiffre = buf.subarray(21 + idlen);
  const h = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const ikm = h(h(t.auth, t.ecdh.computeSecret(sa)), Buffer.concat([Buffer.from("WebPush: info\0"), t.ecdh.getPublicKey(), sa, Buffer.from([1])]));
  const prk = h(sel, ikm);
  const cle = h(prk, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\0"), Buffer.from([1])])).subarray(0, 16);
  const nonce = h(prk, Buffer.concat([Buffer.from("Content-Encoding: nonce\0"), Buffer.from([1])])).subarray(0, 12);
  const d = crypto.createDecipheriv("aes-128-gcm", cle, nonce);
  d.setAuthTag(chiffre.subarray(chiffre.length - 16));
  const clair = Buffer.concat([d.update(chiffre.subarray(0, chiffre.length - 16)), d.final()]);
  let fin = clair.length - 1;
  while (fin >= 0 && clair[fin] === 0) fin--;
  return JSON.parse(clair.subarray(0, fin).toString("utf8"));
}
const recus = async (t) => (await pushs()).filter((x) => x.adresse === new URL(t.endpoint).pathname).map((x) => ({ ...x, n: x.mort ? null : dechiffrer(t, x.corps) }));

// ─── Dax, quatre habitants avec leur figurine ───
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000000101", slug: "chez-bergine-appli", channel: "letter", business_name: "Chez Bergine", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true }]);
const GENS = [NINA, TOM, MORT, ANDY];
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await deposer("figurines-clients", `${x.id}/neutre-essai.webp`, fs.readFileSync("public/direct/double/pied/salut-1.webp"), "image/webp");
  await deposer("figurines-clients", `${x.id}/parle-essai.webp`, fs.readFileSync("public/direct/double/parle-1.webp"), "image/webp");
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
// (Tom, son proche, lui écrira ; et à Sacha, dont le téléphone a abandonné son abonnement)
await json("figurines-clients", `${TOM.id}/proches.json`, { ids: [NINA.id, MORT.id] });
await json("figurines-clients", `${NINA.id}/proches.json`, { ids: [TOM.id] });
await json("figurines-clients", `${MORT.id}/proches.json`, { ids: [TOM.id] });

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const erreurs = [];
/** Un téléphone : `ua` son navigateur ; `installee` : ouvert depuis l'écran d'accueil ; `faux` : l'abonnement que son navigateur donnera. */
async function tel(qui, { ua, installee = false, faux = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...(ua ? { userAgent: ua, isMobile: true, hasTouch: true } : {}) });
  await ctx.grantPermissions(["notifications"], { origin: BASE });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  await ctx.addInitScript(
    ({ installee, faux }) => {
      if (installee) {
        Object.defineProperty(navigator, "standalone", { get: () => true });
        const mm = window.matchMedia.bind(window);
        window.matchMedia = (q) => (q.includes("display-mode: standalone") ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } : mm(q));
      }
      // (le navigateur sans moteur de notifications : son abonnement est celui du faux téléphone, gardé d'une page à l'autre ;
      // et le Chromium sans écran répond toujours « denied » à `Notification.permission`, même accordée : le faux téléphone
      // dit « granted », comme un vrai qui a dit oui)
      if (faux && window.PushManager) {
        Object.defineProperty(Notification, "permission", { get: () => "granted" });
        Notification.requestPermission = async () => "granted";
        const abo = () =>
          localStorage.getItem("__faux_abo") === "1"
            ? { endpoint: faux.endpoint, toJSON: () => faux, unsubscribe: async () => (localStorage.removeItem("__faux_abo"), true) }
            : null;
        PushManager.prototype.getSubscription = async () => abo();
        PushManager.prototype.subscribe = async () => (localStorage.setItem("__faux_abo", "1"), abo());
      }
    },
    { installee, faux: faux?.abonnement ?? null },
  );
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  return p;
}
/**
 * Toucher un bouton : d'abord au milieu de l'écran, d'un coup (le site défile en douceur, et le menu du bas est fixe).
 * La page bouge encore parfois juste après (une image qui arrive) : le menu du bas passe alors par-dessus le bouton —
 * on le recentre, et on retouche (cinq fois au plus). (15 novembre 2026 : un échec de la CI, le menu « mc-nav » sur le
 * bouton « Installer ».)
 */
const toucher = async (p, sel) => {
  const l = typeof sel === "string" ? p.locator(sel).first() : sel;
  for (let k = 0; ; k++) {
    await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await p.waitForTimeout(250);
    try {
      await l.click({ timeout: 5000 });
      return;
    } catch (e) {
      if (k >= 4) throw e;
    }
  }
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const api = (p, corps) =>
  p.evaluate(async (c) => {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
    return { statut: r.status, ...(await r.json().catch(() => ({}))) };
  }, corps);
const cleDe = async (x) => (await (await fetch(`${BASE}/api/direct/proches`, { headers: { cookie: `clikme_habitant=${x.jeton}` } })).json()).cle;
const ecrireA = async (x, cle, texte) => (await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify({ action: "ecrire", cle, texte }) })).status;

// ═══ NINA, SUR IPHONE, DANS SAFARI ═══
const telNina = telephone("nina");
const safari = await tel(NINA, { ua: IPHONE });
await safari.goto(`${BASE}/collection#proches`, { waitUntil: "networkidle" });
await fermerPablito(safari, "#o-proches");
await safari.waitForSelector("#o-proches:not([hidden])", { timeout: 60000 });
await safari.waitForTimeout(800);
ok((await safari.locator("#o-proches .ct-invite").count()) === 0, "dans Safari (l'appli pas encore posée) : rien ne la dérange dans « Messages »");
await safari.goto(`${BASE}/collection#moi`, { waitUntil: "networkidle" });
await fermerPablito(safari, "#o-personnage");
await safari.waitForSelector("#o-personnage .ct-moi", { timeout: 60000 });
ok(
  (await texte(safari, "#o-personnage .ct-installee")).includes("Sur ton écran d’accueil") && (await texte(safari, "#o-personnage .ct-notif")).includes("Sur iPhone, il faut d’abord ClikMe sur ton écran d’accueil"),
  "dans « Moi » : « Installer », et sur iPhone, la notification attend l'appli",
);
await toucher(safari, "#o-personnage .ct-installee .ct-installer");
await safari.waitForURL(/[?&]appli=[a-z0-9]{24}/, { timeout: 15000 });
await safari.waitForSelector(".ct-feuille", { timeout: 30000 });
const jeton = new URL(safari.url()).searchParams.get("appli");
ok((await texte(safari, ".ct-feuille")).includes("« Sur l’écran d’accueil »") && (await safari.locator(".ct-feuille .ct-gestes li").count()) === 3, "la page s'est rechargée avec son jeton : les trois gestes (Partager, « Sur l'écran d'accueil », Ajouter)");
const lien = await safari.locator('link[rel="manifest"]').getAttribute("href");
const manifeste = await (await fetch(new URL(lien, BASE))).json();
ok(lien.includes(`appli=${jeton}`) && manifeste.start_url === `/collection?appli=${jeton}` && manifeste.id === "/collection" && manifeste.scope === "/collection" && manifeste.display === "standalone", `le manifeste ouvrira l'appli sur son jeton (${manifeste.start_url})`);
ok((await lireStock(`appli/${jeton}.json`))?.h === NINA.id, "le jeton est gardé (24 h, un seul usage)");
ok((await debordement(safari)) <= 0 && !/exemple/i.test(await texte(safari, ".ct-feuille")), "la feuille ne déborde pas, sans le mot interdit");
await safari.screenshot({ path: `${D}/appli-1-installer-iphone.png` });
await safari.locator(".ct-feuille .ct-principal").click();
ok((await safari.locator(".ct-feuille").count()) === 0, "« J'ai compris » : la feuille se ferme");

// ═══ L'APPLI POSÉE SUR SON ÉCRAN D'ACCUEIL : SES COOKIES À ELLE, VIDES ═══
const appli = await tel(null, { ua: IPHONE, installee: true, faux: telNina });
await appli.goto(new URL(manifeste.start_url, BASE).toString(), { waitUntil: "networkidle" });
await appli.waitForURL((u) => !u.searchParams.has("appli") && u.hash === "#proches", { timeout: 30000 });
await fermerPablito(appli, "#o-proches");
await appli.waitForSelector("#o-proches:not([hidden])", { timeout: 60000 });
ok((await texte(appli, ".mc-moi")).includes("Nina") && !(await lireStock(`appli/${jeton}.json`)), "l'appli s'ouvre avec SA figurine (le jeton a posé son cookie, et il est usé)");
const reutilise = await api(appli, { action: "appli-lier", jeton });
ok(reutilise.statut === 400 && /déjà servi/.test(reutilise.error ?? ""), "le même jeton ne sert pas deux fois");
await appli.waitForSelector("#o-proches .ct-invite", { timeout: 15000 });
ok((await texte(appli, "#o-proches .ct-invite")).includes("Tes proches te parlent : je te préviens ?"), "à sa première ouverture, dans « Messages » : « 🔔 Tes proches te parlent : je te préviens ? »");
await appli.screenshot({ path: `${D}/appli-2-derniere-etape.png` });
await toucher(appli, "#o-proches .ct-invite .ct-principal");
await appli.waitForSelector("#o-proches .ct-fait", { timeout: 20000 });
ok((await texte(appli, "#o-proches .ct-fait")) === "✓ C’est réglé : je te préviendrai quand un proche te parle.", "« Oui, préviens-moi » : c'est réglé");
const fiche = await lireStock(`notif/abonnes/${NINA.id}.json`);
ok(fiche?.ville === "dax" && fiche.abonnements?.[0]?.endpoint === telNina.endpoint, "le serveur garde son téléphone (dans le seau, pas de table)");
const portee = await appli.evaluate(async () => (await navigator.serviceWorker.getRegistration("/collection"))?.scope ?? "");
ok(portee.endsWith("/collection"), `le service worker de l'appli veille sur /collection (${portee.replace(BASE, "")})`);
await appli.waitForTimeout(500);
const bienvenue = (await recus(telNina))[0];
ok(bienvenue?.n?.title === "🔔 C’est réglé !" && /quand un proche te parle/.test(bienvenue.n.body) && bienvenue.n.url === "/collection#proches" && bienvenue.vapid && bienvenue.encodage === "aes128gcm", `« C'est réglé ! » arrive sur son téléphone, chiffré et signé (${bienvenue?.n?.body})`);

// ═══ TOM (ABONNÉ, SUR ORDINATEUR) ; UN TÉLÉPHONE QUI A ABANDONNÉ ═══
const telTom = telephone("tom");
const telMort = telephone("sacha", true);
const tom = await tel(TOM);
await tom.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
ok((await api(tom, { action: "notif", abonnement: telTom.abonnement })).statut === 200, "Tom, sur ordinateur, est abonné");
const mort = await tel(MORT);
await mort.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
await api(mort, { action: "notif", abonnement: telMort.abonnement });
ok((await api(tom, { action: "notif", abonnement: { endpoint: "http://ailleurs.invalid/x", keys: telTom.abonnement.keys } })).statut === 400, "une adresse qui n'est pas un service de notifications : refusée");

// ═══ TOM LUI ÉCRIT : ELLE EST PRÉVENUE ; LE TÉLÉPHONE ABANDONNÉ EST EFFACÉ ═══
const [cleNina, cleMort] = [await cleDe(NINA), await cleDe(MORT)];
const avant = (await recus(telNina)).length;
ok((await ecrireA(TOM, cleNina, "Coucou Nina, tu viens samedi ?")) === 200 && (await ecrireA(TOM, cleMort, "Coucou Sacha !")) === 200, "Tom écrit à Nina, et à Sacha");
let deTom = null;
for (let k = 0; k < 40 && !deTom; k++) {
  await appli.waitForTimeout(250);
  deTom = (await recus(telNina)).slice(avant).find((x) => /Tom/.test(x.n?.title ?? ""));
}
ok(Boolean(deTom) && /\/collection/.test(deTom.n.url ?? ""), `chez Nina : « ${deTom?.n?.title} » — ${deTom?.n?.body}`);
let efface = false;
for (let k = 0; k < 40 && !efface; k++) {
  await appli.waitForTimeout(250);
  efface = !(await lireStock(`notif/abonnes/${MORT.id}.json`));
}
ok(efface, "le téléphone abandonné de Sacha est effacé");
ok(!(await pushs()).some((x) => x.topic === "meme-du-jour"), "plus jamais de mème du jour");

// ═══ ELLE COUPE, DANS « MOI » ═══
await appli.goto(`${BASE}/collection#moi`, { waitUntil: "networkidle" });
await fermerPablito(appli, "#o-personnage");
await appli.waitForSelector("#o-personnage .ct-notif .ct-interrupteur", { timeout: 60000 });
const interrupteur = appli.locator("#o-personnage .ct-notif .ct-interrupteur");
ok((await interrupteur.getAttribute("aria-checked")) === "true" && (await texte(appli, "#o-personnage .ct-installee")).includes("C’est fait") && (await texte(appli, "#o-personnage .ct-notif")).includes("Les notifications de tes proches"), "dans « Moi » : l'appli est posée, les notifications de ses proches sont activées");
await appli.locator("#o-personnage .ct-moi").scrollIntoViewIfNeeded();
await appli.screenshot({ path: `${D}/appli-3-moi.png` });
await toucher(appli, interrupteur);
await appli.waitForFunction(() => document.querySelector("#o-personnage .ct-notif .ct-interrupteur")?.getAttribute("aria-checked") === "false", null, { timeout: 15000 });
ok((await texte(appli, "#o-personnage .ct-notif")).includes("Coupé") && !(await lireStock(`notif/abonnes/${NINA.id}.json`)), "elle coupe : le serveur l'oublie");
const apres = (await recus(telNina)).length;
await appli.waitForTimeout(400);
ok((await ecrireA(TOM, cleNina, "Tu dors ?")) === 200, "Tom lui écrit encore");
await appli.waitForTimeout(2500);
ok((await recus(telNina)).length === apres, "… plus rien n'arrive sur son téléphone");
await toucher(appli, interrupteur);
await appli.waitForFunction(() => document.querySelector("#o-personnage .ct-notif .ct-interrupteur")?.getAttribute("aria-checked") === "true", null, { timeout: 15000 });
ok((await lireStock(`notif/abonnes/${NINA.id}.json`))?.abonnements?.length === 1, "et elle le rallume d'un toucher");
// ↩️ « QUAND ON RÉPOND À TES MÈMES » : un second interrupteur, allumé d'office ; elle le coupe, puis le rallume
await appli.waitForSelector("#o-personnage .ct-reponses .ct-interrupteur", { timeout: 15000 });
const reponses = appli.locator("#o-personnage .ct-reponses .ct-interrupteur");
ok((await reponses.getAttribute("aria-checked")) === "true" && (await texte(appli, "#o-personnage .ct-reponses")).includes("Quand on répond à tes mèmes"), "« Quand on répond à tes mèmes » : allumé d'office, à part");
await toucher(appli, reponses);
await appli.waitForFunction(() => document.querySelector("#o-personnage .ct-reponses .ct-interrupteur")?.getAttribute("aria-checked") === "false", null, { timeout: 15000 });
const ficheCoupee = await lireStock(`notif/abonnes/${NINA.id}.json`);
ok(ficheCoupee?.reponses === false && ficheCoupee.abonnements?.length === 1 && (await texte(appli, "#o-personnage .ct-reponses")).includes("Coupé"), "elle le coupe : plus de « … t'a répondu ! » (les autres notifications, elles, restent allumées)");
await toucher(appli, reponses);
await appli.waitForFunction(() => document.querySelector("#o-personnage .ct-reponses .ct-interrupteur")?.getAttribute("aria-checked") === "true", null, { timeout: 15000 });
ok((await lireStock(`notif/abonnes/${NINA.id}.json`))?.reponses !== false, "et le rallume");
ok((await debordement(appli)) <= 0 && !/exemple/i.test(await texte(appli, "#o-personnage")), "« Moi » ne déborde pas, sans le mot interdit");

// ═══ ANDROID : LA VRAIE PROPOSITION D'INSTALLER ═══
const android = await tel(ANDY, { ua: ANDROID });
await android.goto(`${BASE}/collection#moi`, { waitUntil: "networkidle" });
await fermerPablito(android, "#o-personnage");
await android.waitForSelector("#o-personnage .ct-moi", { timeout: 60000 });
await android.evaluate(() => {
  const e = new Event("beforeinstallprompt", { cancelable: true });
  e.prompt = async () => void (window.__propose = true);
  e.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(e);
});
await toucher(android, "#o-personnage .ct-installee .ct-installer");
await android.waitForFunction(() => window.__propose === true, null, { timeout: 10000 });
ok((await android.locator(".ct-feuille").count()) === 0, "Android : « Installer » ouvre la proposition du téléphone");

// ═══ DANS LE NAVIGATEUR D'INSTAGRAM ═══
const insta = await tel(ANDY, { ua: INSTAGRAM });
await insta.goto(`${BASE}/collection#moi`, { waitUntil: "networkidle" });
await fermerPablito(insta, "#o-personnage");
await insta.waitForSelector("#o-personnage .ct-installee .ct-installer", { timeout: 60000 });
await toucher(insta, "#o-personnage .ct-installee .ct-installer");
await insta.waitForSelector(".ct-feuille", { timeout: 15000 });
ok((await texte(insta, ".ct-feuille h2")) === "Ouvre ClikMe dans ton navigateur" && (await texte(insta, "#o-personnage .ct-notif")).includes("Ouvre d’abord ClikMe dans ton navigateur"), "dans Instagram : « Ouvre ClikMe dans ton navigateur »");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ").slice(0, 300)})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
