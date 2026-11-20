// ⭐ UNE CONVERSATION À TRAVERS LE TEMPS, À L'ÉCRAN (le lot D2b de Découvrir, deuxième partie, `docs/univers/decouvrir.md`
// section 22) — sur un iPhone, contre le faux Supabase, le faux YouTube (la sélection de la nuit) et un faux lecteur de
// YouTube qu'on avance à la main (rien ne part chez Google).
//
// Sam a vu la vidéo : 😂 à 5 s, il a écrit « Il va tirer de là ?! » à 8 s, ❤️ à 30 s. Léa ouvre sa télé du jour :
// 💬 « 3 » dans la barre (« Ce qui s'est dit ») — la télé éteinte, tout est encore caché (« 🔒 3 réactions plus loin dans la vidéo »). Elle
// allume : à 5 s Sam rit ; à 8 s, sa bulle « Il va tirer de là ?! ». Elle touche Sam : « ↩ Répondre à Sam, à 0:08 »,
// « 😱 Grave ! » — sa réponse est notée juste après (8,6 s), sa figurine le dit. Elle écrit « haha trop bien » (commencé
// à 12 s, envoyé à 13 s) : noté à 12 s, en 😂, « Sam le lira à cette seconde ». « 💬 Ce qui s'est dit » à 13 s : quatre
// lignes, le ❤️ de 30 s caché ; toucher le 😂 de Sam revoit le moment (le lecteur repart à 3 s, sans 😮 compris de
// travers). Sam, prévenu, ouvre la vidéo déjà vue (`?tele=<id>&t=6`) : elle est là, la télé attend qu'on l'allume, puis
// repart à 6 s ; dans « Ce qui s'est dit », tout (il l'a vue), et « ↩ à toi : « Grave ! » ». Ni débordement, ni erreur,
// ni le mot interdit.
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

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;

const qui = (n, prenom) => ({ id: `d2b3d2b3-0000-4000-8000-0000000d10${String(n).padStart(2, "0")}`, jeton: `jeton-tele-conversation-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
// (leurs figurines du nouveau style, assises : Ma maison et la télé du jour les posent dans la pièce)
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
// (sa pièce : le hangar, sa télé relevée)
const panorama = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="3584" height="1024"><rect width="3584" height="1024" fill="#6a3a5a"/><rect y="700" width="3584" height="324" fill="#5a4030"/><rect x="1580" y="200" width="430" height="256" fill="#111"/></svg>`))
  .webp({ quality: 80 })
  .toBuffer();
for (const m of ["", "-matin", "-nuit"]) await deposer(`pieces-duo/hangar/large/panorama${m}.webp`, panorama, "image/webp");
await json("pieces-duo/hangar/large/releve.json", { le: maintenant, ajuste: true, emplacements: { tele: [0.441, 0.195, 0.12, 0.25], cadres: [], places: [{ x: 0.5, y: 0.94, hauteur: 0.5 }] } });
const choisie = await fetch(`${BASE}/api/direct/ma-piece`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${LEA.jeton}; ${COOKIE_ADMIN}` }, body: JSON.stringify({ action: "choisir", piece: "hangar" }) });
ok(choisie.ok, `sa pièce : le hangar (${choisie.status})`);
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée");


// (Sam a vu la première vidéo de Léa : 😂 à 5 s, « Il va tirer de là ?! » à 8 s, ❤️ à 30 s)
const route = `${BASE}/api/direct/tele-du-jour`;
const poster = (x, corps) => fetch(route, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) }).then((r) => r.json().catch(() => ({})));
const V = (await (await fetch(route, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json()).tele?.videos?.[0];
ok(Boolean(V?.id) && V.duree >= 30, `la première vidéo de Léa (${V?.id}, ${V?.duree} s)`);
await poster(SAM, { action: "reagir", id: V.id, t: 5, sorte: "rire" });
await poster(SAM, { action: "ecrire", id: V.id, t: 8, texte: "Il va tirer de là ?!" });
await poster(SAM, { action: "reagir", id: V.id, t: 30, sorte: "coeur" });
await poster(SAM, { action: "vue", id: V.id, fin: true, secondes: V.duree });
await new Promise((r) => setTimeout(r, 600));
const fichier = (x) => lire(`decouvrir/reactions/${V.id}/${qui8(x.id)}.json`);

// ─── un faux lecteur de YouTube : il passe la vidéo qu'on lui donne, et l'on règle sa seconde d'ici (`__lecteur.t`) ───
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this; self.o = o; self.t = (o.playerVars && o.playerVars.start) || 0;
  self.loadVideoById = function (id) { d.dataset.yt = id; self.t = 0; };
  self.getCurrentTime = function () { return self.t; };
  self.seekTo = function (s) { self.t = s; };
  self.playVideo = function () { d.dataset.joue = "1"; o.events && o.events.onStateChange && o.events.onStateChange({ data: 1 }); };
  self.pauseVideo = function () { d.dataset.joue = "0"; o.events && o.events.onStateChange && o.events.onStateChange({ data: 2 }); };
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
const ouvrir = async (x) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["microphone"] });
  await ctx.addCookies([{ name: "clikme_habitant", value: x.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
  await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
  await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${x.prenom} : ${String(e)}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(`${x.prenom} : ${m.text()}`));
  return p;
};
const p = await ouvrir(LEA);
const attendre = async (f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
};
const texte = async (sel, page = p) => (await page.locator(sel).first().innerText({ timeout: 2000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const seconde = (t, page = p) => page.evaluate((x) => (window.__lecteur.t = x), t);
const reactionsDeLea = async () => ((await fichier(LEA))?.reactions ?? []).map((r) => `${r.t}:${r.sorte}${r.texte ? `:${r.texte}` : ""}${r.a ? `:a=${r.a}` : ""}`);

// ═══ LÉA OUVRE SA TÉLÉ : « 💬 CE QUI S'EST DIT », TOUT EST ENCORE CACHÉ ═══
await p.goto(`${BASE}/univers/tele`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".td").getAttribute("data-video")) === V.id, 15000), "sa télé du jour s'ouvre sur la vidéo");
ok(await attendre(async () => (await texte("[data-dit] .td-pastille")) === "3"), `💬 dans la barre, avec « ${await texte("[data-dit] .td-pastille")} » (ce qui s'est dit)`);
await p.locator("[data-dit]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-dit]").count()) === 1), "la feuille s'ouvre");
ok((await p.locator("[data-feuille-dit] [data-ligne]").count()) === 0 && /🔒 3 réactions plus loin dans la vidéo/.test(await texte("[data-plus-loin]")), `la télé éteinte, rien n'est montré d'avance : « ${await texte("[data-plus-loin]")} »`);
await p.locator("[data-feuille-dit] .td-lien").click();
ok(await p.locator("[data-mots]").isDisabled(), "« Écris à cette seconde… » attend que la télé s'allume");

// ═══ ELLE ALLUME : SAM RIT, PUIS SA BULLE ═══
await p.locator("[data-allumer]").click();
ok(await attendre(async () => (await p.evaluate(() => Boolean(window.__lecteur))) && !(await p.locator("[data-mots]").isDisabled())), "allumée : elle peut écrire");
const sam = p.locator(`[data-proche-assis="${SAM.cle}"]`);
await seconde(4.6);
await p.waitForTimeout(400);
await seconde(5.2);
ok(await attendre(async () => (await sam.locator("img.td-proche.a-rit").count()) === 1, 2000), "à 5 s : Sam rit");
await p.waitForTimeout(400);
await seconde(7.8);
await p.waitForTimeout(400);
await seconde(8.3);
ok(await attendre(async () => (await texte(`[data-bulle="${SAM.cle}"]`)) === "Il va tirer de là ?!", 2000), `à 8 s : sa bulle « ${await texte(`[data-bulle="${SAM.cle}"]`)} »`);
const bulle = await p.locator(`[data-bulle="${SAM.cle}"]`).boundingBox();
ok(bulle && bulle.x >= 0 && bulle.x + bulle.width <= 390, "… elle reste dans l'écran");
await p.screenshot({ path: `${D}/tele-conversation-1-bulle.png` });

// ═══ ↩ ELLE TOUCHE SAM : ELLE LUI RÉPOND ═══
await p.locator(`[data-repondre="${SAM.cle}"]`).click();
ok(await attendre(async () => (await p.locator(`[data-feuille-repondre="${SAM.cle}"]`).count()) === 1), "toucher Sam : la feuille pour lui répondre");
ok(/↩ Répondre à Sam, à 0:08/.test(await texte("[data-feuille-repondre] .td-feuille-titre")) && (await texte("[data-feuille-repondre] .td-cite")) === "« Il va tirer de là ?! »", `« ${await texte("[data-feuille-repondre] .td-feuille-titre")} » — « ${await texte("[data-feuille-repondre] .td-cite")} »`);
ok((await texte("[data-feuille-repondre] .td-rapides")).replace(/\s/g, "") === "😂Tropdrôle😱Grave!🙌Pareil", "« 😂 Trop drôle », « 😱 Grave ! », « 🙌 Pareil » — ou trois mots");
await p.screenshot({ path: `${D}/tele-conversation-2-repondre.png` });
await p.locator('[data-reponse="peur"]').click();
ok(await attendre(async () => (await reactionsDeLea()).includes(`8.6:peur:Grave !:a=${SAM.cle}`), 4000), `« 😱 Grave ! » noté juste après sa bulle, à 8,6 s (${(await reactionsDeLea()).join(" | ")})`);
ok(await attendre(async () => /↩ Sam verra ta réponse à cette seconde/.test(await texte("[data-note]")), 2000), `« ${await texte("[data-note]")} »`);
ok((await texte('[data-bulle="moi"]')) === "↩ Grave !", "sa figurine le dit");
ok(!(await reactionsDeLea()).some((r) => r.startsWith("8.3:")), "toucher Sam ne compte pas comme un rire sur la pièce");

// ═══ ✍️ ELLE ÉCRIT À LA SECONDE ═══
await p.waitForTimeout(400);
await seconde(12);
await p.waitForTimeout(300);
await p.locator("[data-mots]").focus();
await seconde(13);
await p.locator("[data-mots]").fill("haha trop bien");
await p.locator("[data-mots]").press("Enter");
ok(await attendre(async () => (await reactionsDeLea()).includes("12:rire:haha trop bien"), 4000), "« haha trop bien » : noté à 12 s (quand elle a commencé à écrire), en 😂");
ok(await attendre(async () => /✍️ Écrit à 0:12 : Sam le lira à cette seconde/.test(await texte("[data-note]")), 2500), `« ${await texte("[data-note]")} »`);
ok((await p.locator("[data-mots]").inputValue()) === "", "le champ se vide");

// ═══ 💬 CE QUI S'EST DIT, À 13 S ═══
await p.waitForTimeout(300);
await p.locator("[data-dit]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-dit] [data-ligne]").count()) === 4), "quatre lignes");
const lignes = await p.locator("[data-feuille-dit] [data-ligne]").allInnerTexts();
const net = lignes.map((l) => l.replace(/\s+/g, " ").trim());
ok(net.join(" | ") === "0:05 Sam 😂 | 0:08 Sam « Il va tirer de là ?! » | 0:08 Toi ↩ Sam : « Grave ! » | 0:12 Toi « haha trop bien »", `à leurs secondes : ${net.join(" | ")}`);
ok(/🔒 1 réaction plus loin dans la vidéo/.test(await texte("[data-plus-loin]")), "le ❤️ de Sam à 30 s reste caché");
await p.screenshot({ path: `${D}/tele-conversation-3-dit.png` });
await p.locator('[data-feuille-dit] [data-ligne="5"]').click();
ok(await attendre(async () => (await p.locator("[data-feuille-dit]").count()) === 0 && (await p.evaluate(() => window.__lecteur.t)) === 3, 2000), "toucher le 😂 de Sam : on revoit le moment (le lecteur repart à 3 s)");
await p.waitForTimeout(900);
ok(!(await reactionsDeLea()).some((r) => /:oh$/.test(r)), "… sans 😮 compris de travers (un saut voulu)");
await seconde(4.6);
await p.waitForTimeout(400);
await seconde(5.2);
ok(await attendre(async () => (await sam.locator("img.td-proche.a-rit").count()) === 1, 2000), "… et à 5 s, Sam rit de nouveau");
// ═══ 🎙️ ELLE LAISSE UN VOCAL À 20 S : LA VIDÉO L'ATTEND PENDANT QU'ELLE PARLE ═══
await p.waitForTimeout(500);
await seconde(20);
await p.waitForTimeout(300);
const joue = async (page = p) => page.evaluate(() => document.querySelector(".faux-yt")?.dataset.joue ?? "");
ok((await joue()) === "1" && /❚❚/.test(await texte("[data-jouer]")), "la vidéo joue (❚❚)");
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
const m = await p.locator("[data-ecrire] [data-micro]").boundingBox();
await p.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
await p.mouse.down();
ok(await attendre(async () => /🎙️ Tu parles/.test(await texte("[data-sur-la-tele]")) && (await p.locator("[data-ecrire] [data-enreg]").count()) === 1, 2000), `appuyé : « ${await texte("[data-sur-la-tele]")} », la barre d'enregistrement`);
ok((await joue()) === "0", "… la vidéo se met en pause pendant qu'elle parle");
await p.screenshot({ path: `${D}/tele-conversation-4-micro.png` });
await p.waitForTimeout(1800);
await p.mouse.up();
ok(await attendre(async () => (await joue()) === "1" && (await p.locator("[data-sur-la-tele]").count()) === 0, 2000), "relâché : elle reprend");
ok(await attendre(async () => (await reactionsDeLea()).some((r) => r.startsWith("20:coeur")), 6000), `sa voix est notée à 20 s (${(await reactionsDeLea()).join(" | ")})`);
ok(await attendre(async () => /🎙️ Ta voix, à 0:20 : Sam l’écoutera à cette seconde/.test(await texte("[data-note]")), 3000), `« ${await texte("[data-note]")} »`);
ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "Léa : rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "Léa : jamais le mot interdit");
await poster(LEA, { action: "vue", id: V.id, fin: true, secondes: V.duree });

// ═══ SAM, PRÉVENU, OUVRE LA VIDÉO DÉJÀ VUE ═══
const s = await ouvrir(SAM);
await s.goto(`${BASE}/univers/tele?tele=${V.id}&t=6`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await s.locator(".td").getAttribute("data-video")) === V.id, 15000), "Sam : la vidéo déjà vue est là, en premier");
ok((await s.locator("[data-allumer]").count()) === 1, "la télé attend qu'il l'allume");
ok(!(await s.evaluate(() => window.location.search)), "l'adresse se nettoie");
await s.locator("[data-allumer]").click();
ok(await attendre(async () => (await s.evaluate(() => window.__lecteur?.o?.playerVars?.start)) === 6, 4000), "allumée : elle repart à 0:06");
ok(await attendre(async () => (await texte("[data-dit] .td-pastille", s)) === "6"), `💬 · « ${await texte("[data-dit] .td-pastille", s)} »`);
await s.locator("[data-dit]").click();
ok(await attendre(async () => (await s.locator("[data-feuille-dit] [data-ligne]").count()) === 6), "il l'a vue : tout est montré (les cinq d'avant, et le vocal de Léa)");
ok((await s.locator("[data-plus-loin]").count()) === 0, "… rien de caché");
ok(/0:08 Léa ↩ à toi : « Grave ! »/.test((await s.locator("[data-feuille-dit] .pour-moi").first().innerText()).replace(/\s+/g, " ")), "« ↩ à toi : « Grave ! » », en couleur");
ok(!/exemple/i.test(await s.evaluate(() => document.body.innerText)), "Sam : jamais le mot interdit");
ok(/0:20 Léa 🎙️ un vocal/.test((await s.locator("[data-feuille-dit] li").allInnerTexts()).map((x) => x.replace(/\s+/g, " ")).join(" | ")) && (await s.locator("[data-feuille-dit] [data-ecouter]").count()) === 1, "« 0:20 Léa 🎙️ un vocal », et « ▶ Écouter »");
await s.locator("[data-feuille-dit] .td-lien").click();

// ═══ 🎙️ CHEZ SAM, À 20 S : « LÉA T'A LAISSÉ UN VOCAL » — RIEN NE S'ARRÊTE TOUT SEUL ═══
await seconde(19.6, s);
await s.waitForTimeout(400);
await seconde(20.2, s);
ok(await attendre(async () => /🎙️ Léa t’a laissé un vocal\s*▶ Écouter/.test(await texte("[data-voix-dispo]", s)), 2500), `« ${await texte("[data-voix-dispo]", s)} »`);
ok((await joue(s)) === "1", "… la vidéo continue (elle ne s'arrête jamais toute seule)");
await s.screenshot({ path: `${D}/tele-conversation-5-vocal.png` });
await s.locator("[data-voix-dispo]").click();
ok(await attendre(async () => /🎙️ Léa/.test(await texte("[data-sur-la-tele]", s)) && (await joue(s)) === "0", 2000), "▶ Écouter : la vidéo se met en pause le temps du vocal");
ok(await attendre(async () => (await s.locator("[data-sur-la-tele]").count()) === 0 && (await joue(s)) === "1", 8000), "… puis elle reprend");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nune conversation à travers le temps (à l'écran) : tout est bon");
process.exit(echecs ? 1 : 0);
