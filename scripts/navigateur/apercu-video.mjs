// ▶ L'APERÇU QUI SE LANCE TOUT SEUL, À L'ÉCRAN (26 novembre 2026, le propriétaire : « comme sur YouTube : quand je
// scrolle, je vois le début de la vidéo avec le son » ; `app/collection/apercu-video.tsx`) — sur un iPhone, contre le faux
// Supabase, et un faux lecteur de YouTube (il note ce qu'on lui demande : jouer, couper le son, le remettre, partir).
//
// Léa propose deux soirées, chacune avec sa vidéo. Zoé ouvre Mes groupes : la vidéo de la première carte se lance toute
// seule — une seule dans la page. Le son : « 🔇 Touche pour le son » tant qu'elle n'a pas touché la page ; un toucher,
// et le son vient. Elle glisse la rangée de côté : la deuxième se lance AVEC LE SON sans retoucher (le faux lecteur fait
// comme un iPhone : le son seulement pendant un toucher, puis ce lecteur le garde — 27 novembre 2026 : c'est le même
// lecteur qui passe d'une vignette à l'autre), la première s'arrête.
// « 🔊 » coupe le son, pour les suivantes aussi ; « 🔇 » le remet. « ▶ Voir la vidéo » : les aperçus se taisent. Puis
// Découvrir : la télé de la pièce à l'écran se lance, avec le son ; elle glisse : la suivante, et Mes groupes s'est tu.
// Rien ne déborde, jamais le mot interdit, aucune erreur.
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { poserPiece } from "../piece-en-hauteur.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000006d81${String(n).padStart(2, "0")}`, jeton: `jeton-apercu-video-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const GENS = [LEA, ZOE];
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
await poserPiece(deposer, "salon", { le: maintenant });
await fetch(`${BASE}/api/cron/decouvrir-selection`);

const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const videos = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos ?? [];
ok(videos.length >= 2, "deux vidéos dans la télé du jour de Léa");
const heure = (h) => Math.ceil((Date.now() + h * 3600_000) / 3600_000) * 3600_000;
const p1 = await appel(LEA, "/api/direct/mes-groupes", { action: "proposer", nom: "Soirée foot", theme: "foot", video: videos[0].id, quand: heure(3), pour: "tous", places: 8, mot: "On la regarde ensemble ?" });
const p2 = await appel(LEA, "/api/direct/mes-groupes", { action: "proposer", nom: "Soirée rire", theme: "humour", video: videos[1].id, quand: heure(5), pour: "tous", places: 8 });
ok(p1.proposition?.id && p2.proposition?.id, "Léa propose deux soirées, chacune avec sa vidéo");

// 🎬 LE FAUX LECTEUR : il note tout dans `window.__yt` (une ligne par lecteur créé)
const FAUX_YT = `
window.__yt = [];
window.YT = { Player: function (el, o) {
  const moi = { id: o.videoId, muet: !!(o.playerVars && o.playerVars.mute), etat: -1, parti: false };
  window.__yt.push(moi);
  const f = document.createElement("iframe");
  f.setAttribute("data-faux", o.videoId);
  el.replaceWith(f);
  const ev = o.events || {};
  this.mute = () => { moi.muet = true; };
  // (comme un iPhone : le son, seulement pendant un toucher — puis ce lecteur-là le garde)
  this.unMute = () => {
    const ua = navigator.userActivation;
    if (!moi.permis && !(ua && ua.isActive)) { moi.etat = 2; return; }
    moi.permis = true;
    moi.muet = false;
  };
  this.isMuted = () => moi.muet;
  this.setVolume = () => {};
  this.playVideo = () => { moi.etat = 1; ev.onStateChange && ev.onStateChange({ data: 1 }); };
  this.pauseVideo = () => { moi.etat = 2; ev.onStateChange && ev.onStateChange({ data: 2 }); };
  this.seekTo = () => {};
  this.loadVideoById = (id) => { moi.id = id; moi.videos = (moi.videos || 1) + 1; setTimeout(() => { moi.etat = 1; ev.onStateChange && ev.onStateChange({ data: 1 }); }, 30); };
  this.getPlayerState = () => moi.etat;
  this.destroy = () => { moi.parti = true; f.remove(); };
  setTimeout(() => ev.onReady && ev.onReady({ target: this }), 60);
} };
window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();
`;

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: ZOE.jeton, url: BASE }]);
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
const zoe = await ctx.newPage();
zoe.on("pageerror", (e) => erreurs.push(String(e)));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await zoe.waitForTimeout(150);
  }
  return false;
};
/** les lecteurs qui jouent (pas partis, pas en pause) */
const vivants = () => zoe.evaluate(() => (window.__yt ?? []).filter((x) => !x.parti && x.etat === 1));
const seul = async (id, muet) => {
  const l = await vivants();
  return l.length === 1 && l[0].id === id && (muet === undefined || l[0].muet === muet);
};
const crees = () => zoe.evaluate(() => (window.__yt ?? []).length);

// ═══ MES GROUPES : LA PREMIÈRE CARTE SE LANCE TOUTE SEULE ═══
await zoe.goto(`${BASE}/collection?v=${Date.now()}#groupes`, { waitUntil: "domcontentloaded" });
await fermerPablito(zoe, "#o-groupes");
const rang = zoe.locator("#o-groupes [data-propositions]");
ok(await attendre(async () => (await rang.locator("[data-proposition]").count()) === 2, 45000), "Zoé ouvre Mes groupes : les deux propositions, de côté");
const ordre = await rang.locator("[data-apercu]").evaluateAll((l) => l.map((x) => x.getAttribute("data-apercu")));
ok(ordre.length === 2, "chaque carte a son aperçu");
ok(await attendre(() => seul(ordre[0])), "la vidéo de la première carte se lance toute seule — une seule dans la page");
const premiere = rang.locator(`[data-apercu="${ordre[0]}"]`);
// (avant tout toucher : sans le son, « Touche pour le son » ; si la bienvenue a été touchée, le son est déjà là)
const muetAuDebut = (await vivants())[0]?.muet;
if (muetAuDebut) {
  ok((await premiere.locator('[data-apercu-son="muet"]').innerText()).includes("Touche pour le son"), "pas encore touché la page : sans le son, « 🔇 Touche pour le son »");
  await premiere.locator("[data-apercu-son]").click();
}
ok(await attendre(() => seul(ordre[0], false)), "un toucher : le son vient");
ok(await attendre(async () => (await premiere.locator('[data-apercu-son="son"]').count()) === 1), "… « 🔊 » pour le couper");
await zoe.screenshot({ path: `${D}/apercu-1-groupes.png` });

// ═══ ELLE GLISSE DE CÔTÉ : LA DEUXIÈME SE LANCE, LA PREMIÈRE S'EN VA ═══
await rang.evaluate((el) => el.scrollBy({ left: el.querySelector("[data-proposition]").getBoundingClientRect().width + 10 }));
ok(await attendre(() => seul(ordre[1], false)), "elle glisse de côté : la deuxième se lance, AVEC LE SON, sans retoucher (comme sur un iPhone) ; la première s'est arrêtée");
ok((await crees()) === 1, "… c'est le même lecteur qui a changé de vidéo (un iPhone garde le son qu'on lui a donné)");
const place = await zoe.evaluate(() => {
  const h = document.querySelector("#o-groupes [data-propositions] [data-apercu-hote]")?.getBoundingClientRect();
  const v = [...document.querySelectorAll("#o-groupes [data-propositions] [data-apercu]")].find((x) => x.closest("[data-apercu-joue]"))?.getBoundingClientRect();
  return h && v ? Math.abs(h.left - v.left) + Math.abs(h.top - v.top) + Math.abs(h.width - v.width) : 999;
});
ok(place < 3, `… posé pile sur la vignette de la deuxième carte (écart ${place})`);
const deuxieme = rang.locator(`[data-apercu="${ordre[1]}"]`);
ok(await attendre(async () => (await deuxieme.locator('[data-apercu-son="son"]').count()) === 1), "… « 🔊 »");
await deuxieme.locator("[data-apercu-son]").click();
ok(await attendre(() => seul(ordre[1], true)), "« 🔊 » : le son est coupé");
await rang.evaluate((el) => el.scrollTo({ left: 0 }));
ok(await attendre(() => seul(ordre[0], true)), "retour à la première : elle se relance, toujours sans le son (on s'en souvient)");
ok(await attendre(async () => (await premiere.locator('[data-apercu-son="muet"]').count()) === 1 && !(await premiere.innerText()).includes("Touche pour le son")), "… un petit « 🔇 », sans insister");
await premiere.locator("[data-apercu-son]").click();
ok(await attendre(() => seul(ordre[0], false)), "« 🔇 » : le son revient");

// ▶ la vidéo en grand : les aperçus se taisent
await rang.locator(`[data-proposition="${(await rang.locator("[data-proposition]").first().getAttribute("data-proposition"))}"] [data-voir-video]`).click();
ok(await attendre(async () => (await vivants()).length === 0), "« ▶ Voir la vidéo » : l'aperçu se tait, la vidéo en grand a toute la place");
await zoe.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "domcontentloaded" });

// ═══ DÉCOUVRIR : LA TÉLÉ DE LA PIÈCE À L'ÉCRAN SE LANCE ; ELLE GLISSE : LA SUIVANTE ═══
await fermerPablito(zoe, "#o-decouvrir");
ok(await attendre(async () => (await zoe.locator("#o-decouvrir [data-apercu]").count()) >= 2, 45000), "Découvrir : les télés des pièces ont leur aperçu");
ok((await zoe.locator("#o-decouvrir [data-tous-les-salons]").count()) === 0 && !(await zoe.locator("#o-decouvrir").innerText()).includes("Tous les salons"), "plus de « Tous les salons » en haut");
const aLEcran = () =>
  zoe.evaluate(() => {
    const h = window.innerHeight;
    const k = [...document.querySelectorAll("#o-decouvrir [data-k]")].find((el) => Math.abs(el.getBoundingClientRect().top) < h * 0.3);
    return k?.querySelector("[data-apercu]")?.getAttribute("data-apercu") ?? "";
  });
// (jusqu'à une pièce qui a une télé)
for (let i = 0; i < 6 && !(await aLEcran()); i++) {
  await zoe.evaluate(() => document.querySelector("#o-decouvrir .fd-boite").scrollBy({ top: window.innerHeight }));
  await zoe.waitForTimeout(700);
}
const a = await aLEcran();
ok(a && (await attendre(async () => (await vivants()).length === 1)), "la télé de la pièce à l'écran se lance — une seule");
// (une nouvelle page : sur un iPhone, il faut un toucher pour le son — un seul)
if ((await vivants())[0]?.muet) await zoe.locator(`#o-decouvrir [data-apercu="${a}"] [data-apercu-son]`).click();
ok(await attendre(async () => (await vivants())[0]?.muet === false), "… avec le son");
await zoe.screenshot({ path: `${D}/apercu-2-decouvrir.png` });
const n = await zoe.evaluate(() => window.__yt.length);
let suivante = "";
for (let i = 0; i < 6; i++) {
  await zoe.evaluate(() => document.querySelector("#o-decouvrir .fd-boite").scrollBy({ top: window.innerHeight }));
  await zoe.waitForTimeout(700);
  suivante = await aLEcran();
  if (suivante) break;
}
ok(suivante && (await attendre(async () => (await vivants()).length === 1 && (await vivants())[0].id === suivante)), "elle glisse : la télé de la pièce suivante se lance, la précédente s'arrête");
ok((await vivants())[0]?.muet === false && (await zoe.evaluate((k) => window.__yt.length === k, n)), "… toujours avec le son, sans retoucher : le même lecteur");
ok(!(await zoe.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "rien ne déborde");
ok(!/exemple/i.test(await zoe.evaluate(() => document.body.innerText)), "jamais le mot interdit");

// ═══ 🚫 UNE VIDÉO QUE YOUTUBE REFUSE ICI (27/11 : « le salon du foot ne fonctionne pas ») : ELLE QUITTE LES TÉLÉS DU JOUR ═══
const avant = (await appel(ZOE, "/api/direct/tele-du-jour")).tele?.videos ?? [];
const refusee = avant[0]?.id;
const r1 = await appel(ZOE, "/api/direct/video-refusee", { id: refusee });
ok(r1.statut === 200 && r1.retiree === true, "le lecteur dit « refusée ici » (101, 150) : elle est retirée");
const apres = (await appel(ZOE, "/api/direct/tele-du-jour")).tele?.videos ?? [];
ok(refusee && !apres.some((v) => v.id === refusee), "… elle n'est plus dans les télés du jour");
const r2 = await appel(ZOE, "/api/direct/video-refusee", { id: "zzzzzzzzzzz" });
ok(r2.statut === 200 && r2.retiree === false, "une vidéo qui n'est pas du jour : rien ne bouge");
const r3 = await fetch(`${BASE}/api/direct/video-refusee`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: apres[0]?.id }) });
ok(r3.status === 401, "sans être de ClikMe : refusé");

await zoe.waitForTimeout(100);
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
