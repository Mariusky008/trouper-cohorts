// 🎙️ « LA SUITE DE LA VIDÉO » : À LA FIN D'UNE VIDÉO, LAISSER UN MOT AVEC SA FIGURINE (`app/collection/
// suite-de-la-video.tsx` ; `docs/univers/decouvrir.md`, section 38) — sur un iPhone, contre le faux Supabase, le faux
// YouTube, un faux lecteur de YouTube et un faux micro (rien ne part chez Google).
//
// Sam a laissé un mot sur une vidéo. Léa la regarde dans sa télé du jour ; finie : « La suite de la vidéo » monte — le mot
// de Sam (« ton proche »), « Répondre à Sam », « Signaler » ; « 🎙️ Laisser un mot avec ma figurine », « Il passera à la
// suite de la vidéo » ; « Suivante dans 8 s ». Un geste : elle attend. Léa parle (le faux micro), « ■ C'est dit » ;
// l'accord (« Tout le monde qui regarde cette vidéo… ») ; « Publier » : son mot est rangé, « Toi » dans la suite. « Effacer
// mon mot » : parti. « Signaler » Sam : il ne passe plus chez elle. « Suivante ⏭ » : la vidéo d'après. Rien ne déborde,
// jamais le mot « exemple », aucune erreur.
import crypto from "node:crypto";
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

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

const qui = (n, prenom) => ({ id: `5d1e5d1e-0000-4000-8000-0000000e10${String(n).padStart(2, "0")}`, jeton: `jeton-suite-video-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
for (const x of GENS) x.q = qui8(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 34, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée");
const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const V = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0]?.id;
ok(Boolean(V), `la première vidéo de Léa (${V})`);
const VOIX = Buffer.concat([Buffer.from("1a45dfa39f4286810142f7810142f2810442f381084282847765626d", "hex"), crypto.randomBytes(4000)]);
const s1 = await appel(SAM, "/api/direct/mots-video", { action: "publier", id: V, son: `data:audio/webm;base64,${VOIX.toString("base64")}`, duree: 4, accord: true });
ok(s1.statut === 200, "Sam a laissé un mot sur cette vidéo");

// ─── un faux lecteur de YouTube : il dit quelle vidéo il passe (`data-yt`), et se commande d'ici ───
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this; self.o = o; self.t = 30;
  self.loadVideoById = function (id) { d.dataset.yt = id; };
  self.getCurrentTime = function () { return self.t; };
  self.playVideo = function () { d.dataset.joue = "1"; };
  self.unloadModule = function () {};
  self.destroy = function () { d.remove(); };
  window.__lecteur = self;
  setTimeout(function () { o.events && o.events.onReady && o.events.onReady({ target: self }); }, 10);
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["microphone"] });
await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on("console", (m) => m.type() === "error" && !/Failed to load resource|NotSupportedError|no supported source/i.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await lea.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

// ═══ LÉA REGARDE ; FINIE : « LA SUITE DE LA VIDÉO » ═══
await lea.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
const main = lea.locator(".td");
ok(await attendre(async () => (await main.getAttribute("data-video")) === V), "sa télé du jour s'ouvre sur la vidéo");
await lea.locator("[data-allumer]").click();
ok(await attendre(async () => (await lea.locator(".faux-yt").getAttribute("data-yt")) === V), "le lecteur la passe");
await lea.evaluate(() => window.__lecteur.o.events.onStateChange({ data: 0 }));
const suite = lea.locator(`[data-suite-video="${V}"]`);
ok(await attendre(async () => (await suite.count()) === 1), "finie : « La suite de la vidéo » monte");
ok((await main.getAttribute("data-video")) === V, "… la vidéo ne s'en va pas tout de suite");
ok(/La suite de la vidéo/.test(await texte(suite.locator("h2"))), "son titre : « La suite de la vidéo »");
ok(await attendre(async () => (await suite.locator(`[data-mot="${SAM.q}"]`).count()) === 1), "le mot de Sam est là");
const carteSam = suite.locator(`[data-mot="${SAM.q}"]`);
ok(/Sam/.test(await texte(carteSam)) && /ton proche/.test(await texte(carteSam)) && /4 s/.test(await texte(carteSam)), `« ${await texte(carteSam)} »`);
ok((await carteSam.locator(".sv-fig img").count()) === 1, "… sa figurine");
ok((await carteSam.locator("[data-repondre]").count()) === 1 && (await carteSam.locator("[data-signaler]").count()) === 1, "« Répondre à Sam », « Signaler »");
const laisser = await texte(suite.locator("[data-laisser-mot]"));
ok(/Laisser un mot avec ma figurine/.test(laisser) && /Il passera à la suite de la vidéo/.test(laisser), `« ${laisser} »`);
ok(/^Suivante dans \d s$/.test(await texte(suite.locator("[data-suite-suivante]"))), `« ${await texte(suite.locator("[data-suite-suivante]"))} »`);
await lea.screenshot({ path: `${D}/suite-de-la-video-1.png` });

// ═══ UN GESTE : ELLE ATTEND ═══
await suite.locator(".sv-haut").click();
ok(await attendre(async () => (await texte(suite.locator("[data-suite-suivante]"))) === "Suivante ⏭"), "un geste : « Suivante ⏭ », plus de compte à rebours");

// ═══ LÉA LAISSE SON MOT ═══
await suite.locator("[data-laisser-mot]").click();
ok(await attendre(async () => (await suite.locator("[data-demarrer]").count()) === 1), "« Laisser un mot » : on peut parler");
await suite.locator("[data-demarrer]").click();
ok(await attendre(async () => (await suite.locator("[data-enregistreur='micro']").count()) === 1), "le micro s'allume (dix secondes au plus)");
ok(await attendre(async () => Number(await suite.locator("[data-reste]").getAttribute("data-reste")) <= 8), `… le temps qui reste (${await suite.locator("[data-reste]").getAttribute("data-reste").catch(() => "")} s)`);
await suite.locator("[data-mot-fini]").click();
ok(await attendre(async () => (await suite.locator("[data-publier]").count()) === 1), "« ■ C’est dit » : on le réécoute, puis on publie");
ok(/Tout le monde qui regarde cette vidéo verra ta figurine et entendra ta voix/.test(await texte(suite.locator("[data-accord]"))), "l'accord, en clair, avant de publier");
ok((await texte(suite.locator("[data-publier]"))) === "Publier" && (await suite.locator("[data-recommencer]").count()) === 1, "« Recommencer » ou « Publier »");
await lea.screenshot({ path: `${D}/suite-de-la-video-2.png` });
await suite.locator("[data-publier]").click();
ok(await attendre(async () => /Ton mot passe à la suite de la vidéo/.test(await texte(lea.locator("[data-suite-note]")))), "« ✓ Ton mot passe à la suite de la vidéo. »");
ok(await attendre(async () => (await suite.locator("[data-mot-moi]").count()) === 1), "« Toi », dans la suite");
const fiche = await lire(`decouvrir/mots/adultes/${V}/${LEA.q}.json`);
ok(fiche?.duree >= 1 && fiche.duree <= 10 && /^audio\//.test(fiche.type ?? ""), `rangé : sa voix (${fiche?.duree} s, ${fiche?.type})`);
await lea.screenshot({ path: `${D}/suite-de-la-video-3.png` });

// ═══ EFFACER MON MOT, SIGNALER SAM ═══
await suite.locator("[data-effacer-mot]").click();
ok(await attendre(async () => (await suite.locator("[data-mot-moi]").count()) === 0), "« Effacer mon mot » : il part de la suite");
ok(await attendre(async () => (await lire(`decouvrir/mots/adultes/${V}/${LEA.q}.json`)) === null), "… et du seau");
await carteSam.locator("[data-signaler]").click();
ok(await attendre(async () => (await suite.locator(`[data-mot="${SAM.q}"]`).count()) === 0), "« Signaler » Sam : il ne passe plus chez elle");
ok(await attendre(async () => (await suite.locator("[data-suite-vide]").count()) === 1), "… « Personne n’a encore laissé de mot »");

// ═══ SUIVANTE ═══
ok(!(await lea.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "rien ne déborde");
ok(!/exemple/i.test(await lea.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
await suite.locator("[data-suite-suivante]").click();
ok(await attendre(async () => (await lea.locator("[data-suite-video]").count()) === 0 && (await main.getAttribute("data-video")) !== V), "« Suivante ⏭ » : la vidéo d'après");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
