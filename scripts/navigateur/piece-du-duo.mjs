// 🛋️ LA PIÈCE DU DUO — LA MAQUETTE, DANS UN NAVIGATEUR DE TÉLÉPHONE (`app/admin/humain/piece-du-duo`,
// `docs/univers/piece-du-duo.md`, section 12) — contre le faux Supabase et son faux moteur d'image ; un faux lecteur
// YouTube (celui de l'essai de la télé), jamais YouTube.
//
// Léa (ce téléphone) et une volontaire du lot 0, choisies dans l'essai du collage ; le salon (ses trois lumières, ses
// emplacements) et la cuisine. L'arrivée : la pièce entière, l'image du duo faite toute seule (première visite), puis la
// caméra glisse vers les deux places et les bulles arrivent ; « 🏠 La pièce » ; la télé (celle de la session de l'univers)
// touchée : le zoom, sans lien le clip du jour ; un lien collé : il passe, « ▶ Allumer la télé » : elle le joue ; une
// invitation reçue (« … t'invite dans la cuisine ») : « Venir » ; la cuisine, sans zones ni lumières : « 👆 Les objets » dit
// ce qui manque, une lumière pas faite se fait ; changer de pièce (on invite) : envoyée, acceptée, et on y est ; de retour au salon : « Depuis
// ta dernière visite : … a mis un lien sur la télé », l'anneau sur la télé ; la fenêtre : la lumière change. Ni
// débordement, ni erreur, ni le mot « exemple ».
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

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000d02", jeton: "jeton-lea-maquette-duo-00001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);

// ─── Léa, la volontaire, le salon (trois lumières, ses emplacements), la cuisine ; le duo choisi ───
const maintenant = new Date().toISOString();
const uni = (r, g, b) => sharp({ create: { width: 512, height: 768, channels: 4, background: { r, g, b, alpha: 1 } } }).png().toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, await uni(200, 140, 90), "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
const L0 = "essais-univers";
await json(`${L0}/personnes/vvvvvvvvvvv4.json`, { id: "vvvvvvvvvvv4", nom: "Volontaire 4", accordLe: maintenant, le: maintenant, traits: null });
await json(`${L0}/resultats/aimeeaimee04.json`, { id: "aimeeaimee04", personne: "vvvvvvvvvvv4", type: "figurine", variante: "sculptee", avis: "oui", etat: "fait", qualite: "high", taille: "1024x1536", le: maintenant, consigne: "…" });
await deposer(`${L0}/resultats/aimeeaimee04.png`, await uni(90, 120, 200), "image/png");
await deposer("pieces-duo/salon/decor.png", await uni(70, 60, 80), "image/png");
await deposer("pieces-duo/salon/lumiere-matin.png", await uni(150, 170, 190), "image/png");
await deposer("pieces-duo/salon/lumiere-nuit.png", await uni(20, 25, 50), "image/png");
await json("pieces-duo/salon/releve.json", {
  le: maintenant,
  ajuste: true,
  emplacements: {
    tele: [0.06, 0.28, 0.3, 0.14],
    platine: [0.68, 0.5, 0.24, 0.1],
    cadres: [[0.4, 0.12, 0.16, 0.14]],
    etagere: [0.62, 0.3, 0.3, 0.08],
    fenetre: [0.62, 0.04, 0.32, 0.22],
    places: [{ x: 0.38, y: 0.74, hauteur: 0.3 }, { x: 0.62, y: 0.74, hauteur: 0.3 }],
    chat: { x: 0.14, y: 0.88 },
  },
});
await deposer("pieces-duo/cuisine/decor.png", await uni(220, 190, 90), "image/png");
// (la cuisine : sa seule lumière à elle, le matin ; aucune zone posée)
await json("pieces-duo/cuisine/releve.json", { le: maintenant, ajuste: true, emplacements: { cadres: [], places: [] } });
await json("pieces-duo/collage/choix.json", { piece: "salon", a: "moi", b: "aimeeaimee04" });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
// (le faux lecteur de YouTube : celui de `tele-duo.mjs`)
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div");
  d.setAttribute("data-faux-yt", o.videoId);
  d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = { destroy: function () { d.remove(); }, playVideo: function () { d.setAttribute("data-joue", "1"); } };
  setTimeout(function () { o.events.onReady({ target: self }); }, 60);
  return self;
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 10);
`;
const vignette = await sharp({ create: { width: 480, height: 360, channels: 3, background: "#c84" } }).jpeg().toBuffer();
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route("https://i.ytimg.com/**", (r) => r.fulfill({ status: 200, contentType: "image/jpeg", body: vignette }));
await ctx.route(/youtube(-nocookie)?\.com\/(embed|s\/)/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const scene = p.locator(".md-scene");
const attr = (n) => scene.getAttribute(n);
const attendre = async (fn, ms = 8000) => {
  for (const fin = Date.now() + ms; Date.now() < fin; await p.waitForTimeout(150)) if (await fn()) return true;
  return false;
};
const capture = (nom) => p.screenshot({ path: `${D}/piece-du-duo-${nom}.png`, fullPage: true });
// (« ⚙️ Pour l’essai » s'ouvre et se ferme du même bouton : on ne l'ouvre que s'il est fermé)
const ouvrirReglages = async () => {
  if (!(await p.locator('.md-panneau[aria-label="Pour l’essai"]').count())) await p.getByRole("button", { name: "⚙️ Pour l’essai" }).click();
};

// ─── l'arrivée ───
await p.goto(`${BASE}/admin/humain/piece-du-duo`, { waitUntil: "domcontentloaded" });
await scene.waitFor({ timeout: 15000 });
ok((await attr("data-piece")) === "salon" && (await attr("data-plan")) === "piece", "l'arrivée : le salon, la pièce entière");
ok(/avec Volontaire 4/.test(await p.locator(".md-titre").innerText()), "« avec Volontaire 4 » : le duo choisi dans l'essai du collage");
ok(await attendre(async () => (await p.locator(".md-fond[data-duo]").count()) > 0, 15000), "l'image du duo, faite toute seule à la première visite (puis montrée)");
ok(await attendre(async () => (await attr("data-plan")) === "places"), "puis la caméra glisse vers les deux places");
ok(await attendre(async () => (await p.locator(".md-bulle").count()) >= 2), "les bulles arrivent, une à une");
await capture("1-places");

// ─── la pièce, la télé ───
await p.getByRole("button", { name: "🏠 La pièce" }).click();
ok(await attendre(async () => (await attr("data-plan")) === "piece"), "« 🏠 La pièce » : la pièce entière");
const tv = p.locator(".md-tele .tv");
ok((await tv.getAttribute("data-programme")) === "secours", "la télé de la session de l'univers, posée sur l'écran : sans lien, le clip du jour");
await tv.click();
ok(await attendre(async () => (await attr("data-plan")) === "objet"), "la télé touchée : la caméra s'en approche");
ok(/En attendant votre premier lien/.test(await tv.innerText()) && /clip du jour/.test(await p.locator(".md-objet-dit").innerText()), "de près : « En attendant votre premier lien »");
await p.getByRole("button", { name: "← Revenir" }).click();
await ouvrirReglages();
await p.locator('.md-panneau input[type="url"]').fill("https://youtu.be/dQw4w9WgXcQ");
ok(await attendre(async () => (await tv.getAttribute("data-programme")) === "youtube"), "un lien collé : il passe à la télé");
await tv.click();
await p.locator('.md-tele [data-geste="allumer"]').click();
ok(await attendre(async () => (await p.locator('[data-faux-yt="dQw4w9WgXcQ"]').count()) === 1), "« ▶ Allumer la télé » : elle le joue");
await capture("2-tele");
await p.getByRole("button", { name: "← Revenir" }).click();

// ─── une invitation reçue ───
await ouvrirReglages();
await p.locator(".md-panneau").getByRole("button", { name: "🍳" }).click();
ok(/Volontaire 4 t’invite dans la cuisine/.test(await p.locator(".md-carte").innerText()), "une invitation : « Volontaire 4 t’invite dans la cuisine »");
await capture("3-invitation");
await p.getByRole("button", { name: "Venir" }).click();
ok(await attendre(async () => (await attr("data-piece")) === "cuisine"), "« Venir » : on y est");

// ─── la cuisine : aucune zone posée, une seule lumière ───
await p.getByRole("button", { name: "🏠 La pièce" }).click().catch(() => undefined);
await p.getByRole("button", { name: "👆 Les objets" }).click();
const note = await p.locator(".md-note").innerText().catch(() => "");
ok(/Pas encore de zone dans la cuisine pour : 📺 la télé, 🎵 la platine/.test(note) && /La pièce du duo/.test(note) && /Tes deux places/.test(note), "« 👆 Les objets », sans zones : ce qui manque, et où le poser");
await ouvrirReglages();
const reglages = p.locator('.md-panneau[aria-label="Pour l’essai"]');
await reglages.getByRole("button", { name: "Nuit", exact: true }).click();
ok(/La cuisine n’a pas encore sa lumière de la nuit/.test(await reglages.innerText()), "une lumière pas faite : on le dit");
await reglages.getByRole("button", { name: "Faire ses 2 lumières (≈ 0,34 €)" }).click();
ok(await attendre(async () => (await attr("data-moment")) === "nuit", 20000), "« Faire ses 2 lumières » : faites, la cuisine passe à la nuit");
await capture("3b-cuisine");

// ─── changer de pièce (on invite) ; de retour au salon, ce qui a changé ───
await p.getByRole("button", { name: "🏠 La pièce" }).click().catch(() => undefined);
await p.getByRole("button", { name: "🚪 Changer de pièce" }).click();
await p.locator(".md-pieces button", { hasText: "Le salon" }).click();
ok(/Invitation envoyée à Volontaire 4/.test(await p.locator(".md-neuf").innerText().catch(() => "")), "on invite : « Invitation envoyée à Volontaire 4… »");
ok(await attendre(async () => (await attr("data-piece")) === "salon"), "acceptée : on est au salon");
ok(await attendre(async () => /Depuis ta dernière visite : Volontaire 4 a mis un lien sur la télé/.test(await p.locator(".md-neuf").innerText().catch(() => ""))), "de retour au salon : « Depuis ta dernière visite : … a mis un lien sur la télé »");
ok((await p.locator(".md-anneau.neuf").count()) === 1, "l'anneau sur la télé");
await capture("4-neuf");

// ─── la fenêtre : la lumière ───
// (un clic comme un doigt, sans forcer : un mot posé sur la pièce ne doit pas prendre le toucher)
await p.locator('[data-objet="fenetre"]').click();
const avant = await attr("data-moment");
const autre = ["matin", "soir", "nuit"].find((x) => x !== avant);
await p.locator(".md-moments button").nth(["matin", "soir", "nuit"].indexOf(autre)).click();
ok(await attendre(async () => (await attr("data-moment")) === autre), `la fenêtre : la lumière change (${avant} → ${autre})`);

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "rien ne déborde sur le côté");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs[0]})` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla maquette de la pièce du duo tient ✓");
process.exit(echecs ? 1 : 0);
