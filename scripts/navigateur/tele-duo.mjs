// 📺 LA TÉLÉ DE LA PIÈCE DU DUO, DANS LE NAVIGATEUR — `app/univers/tele-duo.tsx`, son essai sur la page d'essais
// (`app/admin/humain/univers-essais/tele.tsx`) ; contre le faux Supabase, jamais la vraie base, jamais YouTube : le
// lecteur de YouTube et ses images sont remplacés par un faux (une vidéo dont l'identifiant commence par « REFUSE »
// refuse d'être lue hors de YouTube, comme les erreurs 101 et 150).
//
// Sur un iPhone, dans le salon (sa télé relevée) : de loin, l'écran montre le clip de secours du jour (l'un des cinq du
// propriétaire), sans bouton ; un toucher, la caméra s'approche — « En attendant votre premier lien », « ▶ Allumer la
// télé » ; allumée, le lecteur joue ce clip, « ⏻ Éteindre » l'éteint. Un lien YouTube collé : il passe à la télé ; une
// vidéo qui refuse : un clip de secours prend le relais, « Cette vidéo ne se regarde que sur YouTube », avec « ▶ La
// regarder sur YouTube ». Un TikTok : « ▶ Ouvrir sur TikTok » (dans un nouvel onglet). Un lien d'ailleurs : « ne passe
// pas à la télé ». « ↩ La pièce entière » : la caméra recule, la télé s'éteint. La liste de secours : deux clips et une
// ligne d'ailleurs, rangée — deux clips, la ligne refusée. Rien ne déborde, jamais le mot interdit, aucune erreur.
//
// (15 novembre 2026, le propriétaire : « le clip n'est pas aux bonnes dimensions de la télé » ; « le bouton pause est à
// l'extérieur de la télé et il est énorme ») Allumée, le lecteur est posé sur l'écran tel qu'on le voit, à sa taille
// réelle (pas agrandi par la caméra). La cuisine, son écran pas repéré : « ✋ Placer l'écran de la télé », ses quatre
// coins touchés un à un (une télé en perspective, le bord droit plus haut), l'un glissé pour ajuster, « Enregistrer
// l'écran » — rangés (« posés à la main ») ; l'écran, puis le lecteur allumé, épousent la perspective ; la vidéo couvre
// tout l'écran (« ça ne fait pas télé, mais iPad »).
import { createRequire } from "node:module";
import { D, F, lancer } from "./commun.mjs";

const sharp = createRequire(import.meta.url)("sharp");
const BASE = process.env.ESSAI_BASE ?? "http://localhost:3821";
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
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
await semer("admins", [{ user_id: ADMIN }]);

// ─── le salon, sa télé relevée ───
const piece = await sharp({ create: { width: 1024, height: 1536, channels: 3, background: "#1f4f5a" } })
  .composite([{ input: await sharp({ create: { width: 270, height: 170, channels: 3, background: "#111111" } }).png().toBuffer(), left: 600, top: 300 }])
  .png()
  .toBuffer();
await deposer("pieces-duo/salon/decor.png", piece, "image/png");
await json("pieces-duo/salon/releve.json", { le: new Date().toISOString(), emplacements: { tele: [0.586, 0.195, 0.264, 0.111], cadres: [], places: [] } });
// (la cuisine : son écran pas repéré par le modèle qui voit ; ses places, si)
await deposer("pieces-duo/cuisine/decor.png", piece, "image/png");
await json("pieces-duo/cuisine/releve.json", { le: new Date().toISOString(), emplacements: { cadres: [], places: [{ x: 0.3, y: 0.8, hauteur: 0.25 }, { x: 0.7, y: 0.8, hauteur: 0.25 }] } });
const DEFAUT = ["7CGKeID7nRc", "nd8RD3tjNQE", "R2KeQqLzr00", "ko70cExuzZM", "e5s8MdtnbMM"];

// ─── le faux lecteur de YouTube ───
const FAUX_YT = `
window.__joues = [];
window.YT = { Player: function (el, o) {
  var d = document.createElement("div");
  d.setAttribute("data-faux-yt", o.videoId);
  d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  window.__joues.push(o.videoId);
  var self = { destroy: function () { d.remove(); }, playVideo: function () { d.setAttribute("data-joue", "1"); } };
  setTimeout(function () { if (o.videoId.indexOf("REFUSE") === 0) o.events.onError({ data: 150 }); else o.events.onReady({ target: self }); }, 60);
  return self;
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 10);
`;
const vignette = await sharp({ create: { width: 480, height: 360, channels: 3, background: "#c84" } }).jpeg().toBuffer();

const nav = await lancer();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
await ctx.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route("https://i.ytimg.com/**", (r) => r.fulfill({ status: 200, contentType: "image/jpeg", body: vignette }));
await ctx.route(/youtube(-nocookie)?\.com\/(embed|s\/)/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" }));
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(`${BASE}/admin/humain/univers-essais`, { waitUntil: "networkidle" });
const section = p.locator('section[aria-label="La télé du duo"]');
await section.waitFor({ timeout: 30000 });
await section.scrollIntoViewIfNeeded();
const tv = section.locator(".tv");
await tv.waitFor();
await p.waitForFunction(() => document.querySelector('section[aria-label="La télé du duo"] .tvd-piece'), null, { timeout: 15000 }).catch(() => null);

// ─── de loin ───
const image = await tv.locator(".tv-ecran img").getAttribute("src").catch(() => "");
const clipDuJour = DEFAUT.find((id) => (image ?? "").includes(id));
ok((await tv.getAttribute("data-programme")) === "secours" && Boolean(clipDuJour), `de loin : l'écran montre le clip de secours du jour, l'un des cinq du propriétaire (${image})`);
ok((await tv.getAttribute("role")) === "button" && (await tv.locator(".tv-bouton").count()) === 0, "de loin : pas de bouton, la télé se touche");
const cadre = await p.evaluate(() => {
  const s = document.querySelector(".tvd-scene")?.getBoundingClientRect();
  const t = document.querySelector(".tvd-scene .tv")?.getBoundingClientRect();
  return s && t ? { x: (t.left - s.left) / s.width, l: t.width / s.width } : null;
});
ok(Boolean(cadre) && Math.abs(cadre.x - 0.586) < 0.02 && Math.abs(cadre.l - 0.264) < 0.02, `posée sur l'écran de la télé relevée (${JSON.stringify(cadre)})`);
await p.screenshot({ path: `${D}/tele-duo-de-loin.png` });

// ─── de près ───
await tv.click();
await p.waitForTimeout(900);
ok((await section.locator(".tvd-scene").getAttribute("data-proche")) === "1", "un toucher : la caméra s'approche");
const largeur = await p.evaluate(() => {
  const s = document.querySelector(".tvd-scene")?.getBoundingClientRect();
  const t = document.querySelector(".tvd-scene .tv")?.getBoundingClientRect();
  return s && t ? t.width / s.width : 0;
});
ok(largeur > 0.8 && largeur < 1.0, `de près : l'écran remplit la scène (${Math.round(largeur * 100)} % de sa largeur)`);
ok((await tv.locator(".tv-legende").textContent())?.includes("En attendant votre premier lien") && (await tv.locator('[data-geste="allumer"]').textContent())?.includes("Allumer la télé"), "« En attendant votre premier lien », « ▶ Allumer la télé »");
await p.screenshot({ path: `${D}/tele-duo-de-pres.png` });
await tv.locator('[data-geste="allumer"]').click();
await p.waitForSelector(`[data-faux-yt="${clipDuJour}"][data-joue="1"]`, { timeout: 10000 }).catch(() => null);
ok((await tv.getAttribute("data-tele")) === "allumee" && (await p.locator(`[data-faux-yt="${clipDuJour}"][data-joue="1"]`).count()) === 1, "allumée : le lecteur joue le clip");
await p.waitForTimeout(400);
const pose = await p.evaluate(() => {
  const f = document.querySelector(".tv-flottant");
  const t = document.querySelector(".tvd-scene .tv")?.getBoundingClientRect();
  const r = f?.getBoundingClientRect();
  return f && t && r ? { dansLaPage: f.parentElement === document.body, ecart: Math.max(Math.abs(r.left - t.left), Math.abs(r.top - t.top), Math.abs(r.width - t.width), Math.abs(r.height - t.height)), echelle: r.width / f.offsetWidth } : null;
});
ok(Boolean(pose) && pose.dansLaPage && pose.ecart < 2 && Math.abs(pose.echelle - 1) < 0.01, `le lecteur, posé sur l'écran tel qu'on le voit, à sa taille réelle — pas agrandi par la caméra (${JSON.stringify(pose)})`);
await p.screenshot({ path: `${D}/tele-duo-allumee.png` });
await tv.locator(".tv-eteindre").click();
ok((await tv.getAttribute("data-tele")) === "eteinte" && (await p.locator("[data-faux-yt]").count()) === 0, "« ⏻ Éteindre » : la télé s'éteint");

// ─── un lien YouTube collé ───
const champ = section.locator('input[type="url"]');
await champ.fill("https://www.youtube.com/watch?v=AbCdEfGhIjK&t=30s");
await p.waitForTimeout(300);
ok((await section.locator(".tv").getAttribute("data-programme")) === "youtube" && ((await section.locator(".tv .tv-ecran img").getAttribute("src")) ?? "").includes("AbCdEfGhIjK"), "un lien YouTube collé : il passe à la télé (son image à l'écran)");
await section.locator('.tv [data-geste="allumer"]').click();
ok(await p.waitForSelector('[data-faux-yt="AbCdEfGhIjK"]', { timeout: 10000 }).then(() => true).catch(() => false), "allumée : le lecteur joue ce lien");

// ─── une vidéo qui refuse ───
await champ.fill("https://youtu.be/REFUSE00000");
await p.waitForTimeout(300);
await section.locator('.tv [data-geste="allumer"]').click();
await p.waitForSelector(".tv-note", { timeout: 10000 }).catch(() => null);
const note = await section.locator(".tv-note").textContent().catch(() => "");
const relais = await p.locator("[data-faux-yt]").getAttribute("data-faux-yt").catch(() => "");
ok(note?.includes("ne se regarde que sur YouTube") && DEFAUT.includes(relais ?? ""), `une vidéo qui refuse : un clip de secours prend le relais (${relais}), et on le dit`);
ok(((await section.locator(".tv-note a").getAttribute("href")) ?? "").includes("watch?v=REFUSE00000"), "« ▶ La regarder sur YouTube »");
await p.screenshot({ path: `${D}/tele-duo-refus.png` });

// ─── un TikTok, un lien d'ailleurs ───
await champ.fill("https://www.tiktok.com/@quelquun/video/7300000000000000000");
await p.waitForTimeout(300);
const ouvrir = section.locator('.tv [data-geste="ouvrir"]');
await p.screenshot({ path: `${D}/tele-duo-tiktok.png` });
ok((await ouvrir.textContent())?.includes("Ouvrir sur TikTok") && (await ouvrir.getAttribute("href"))?.includes("tiktok.com") && (await ouvrir.getAttribute("target")) === "_blank", "un TikTok : « ▶ Ouvrir sur TikTok », dans un nouvel onglet");
await champ.fill("https://lemonde.fr/un-article");
await p.waitForTimeout(300);
ok((await section.textContent())?.includes("ne passe pas à la télé"), "un lien d'ailleurs : « ne passe pas à la télé »");
await champ.fill("");

// ─── la pièce entière ───
await section.locator(".tvd-recul").click();
await p.waitForTimeout(900);
ok((await section.locator(".tvd-scene").getAttribute("data-proche")) === "0" && (await section.locator(".tv .tv-bouton").count()) === 0, "« ↩ La pièce entière » : la caméra recule, plus de bouton");

// ─── ✋ la cuisine : son écran pas repéré, placé à la main par ses quatre coins (une télé en perspective) ───
await section.locator('[data-piece-tele="cuisine"]').click();
await p.waitForTimeout(300);
ok((await section.textContent())?.includes("n’a pas été repéré") && (await section.locator('[data-geste="placer-ecran"]').textContent())?.includes("Placer l’écran de la télé"), "la cuisine : son écran pas repéré — « ✋ Placer l'écran de la télé »");
await section.locator('[data-geste="placer-ecran"]').click();
const zoneTrace = await section.locator(".tvd-tracer").boundingBox();
const toucherA = async (x, y) => {
  await p.mouse.move(zoneTrace.x + zoneTrace.width * x, zoneTrace.y + zoneTrace.height * y);
  await p.mouse.down();
  await p.mouse.up();
};
// (en perspective : le bord droit plus haut que le gauche ; le 2e coin posé un peu trop haut, puis glissé)
ok((await section.locator(".tvd-tracer small").textContent())?.includes("en haut à gauche"), "« Touche les quatre coins de l'écran : en haut à gauche (1/4) »");
await toucherA(0.6, 0.2);
await toucherA(0.9, 0.12);
await toucherA(0.9, 0.33);
await toucherA(0.6, 0.3);
ok((await section.locator(".tvd-tracer i[data-coin]").count()) === 4 && (await section.locator(".tvd-tracer small").textContent())?.includes("Fais glisser les coins"), "quatre coins posés : « Fais glisser les coins pour ajuster »");
await p.mouse.move(zoneTrace.x + zoneTrace.width * 0.9, zoneTrace.y + zoneTrace.height * 0.12);
await p.mouse.down();
await p.mouse.move(zoneTrace.x + zoneTrace.width * 0.9, zoneTrace.y + zoneTrace.height * 0.15, { steps: 4 });
await p.mouse.move(zoneTrace.x + zoneTrace.width * 0.9, zoneTrace.y + zoneTrace.height * 0.17, { steps: 4 });
await p.mouse.up();
await section.locator('[data-geste="enregistrer-ecran"]').click();
await p.waitForFunction(() => document.querySelector('section[aria-label="La télé du duo"]')?.textContent?.includes("à sa place"), null, { timeout: 10000 }).catch(() => null);
await p.waitForTimeout(600);
const releveCuisine = await (await fetch(`${STOCK}/figurines-clients/pieces-duo/cuisine/releve.json`)).json().catch(() => ({}));
const c = releveCuisine.emplacements?.teleCoins ?? [];
const attendus = [[0.6, 0.2], [0.9, 0.17], [0.9, 0.33], [0.6, 0.3]];
const t = releveCuisine.emplacements?.tele ?? [];
ok(
  releveCuisine.ajuste === true && c.length === 4 && attendus.every(([x, y], k) => Math.abs(c[k][0] - x) < 0.015 && Math.abs(c[k][1] - y) < 0.015) && Math.abs(t[0] - 0.6) < 0.015 && Math.abs(t[1] - 0.17) < 0.015 && Math.abs(t[2] - 0.3) < 0.015 && Math.abs(t[3] - 0.16) < 0.015 && releveCuisine.emplacements?.places?.length === 2,
  `les quatre coins rangés (le 2e glissé), l'écran = leur boîte, posés à la main, les places gardées (${JSON.stringify(c)})`,
);
// (l'écran déformé : ses quatre coins, à l'écran, tombent sur ceux posés)
const coinsVus = async (sel) =>
  p.evaluate((s) => {
    const sc = document.querySelector(".tvd-scene")?.getBoundingClientRect();
    const el = document.querySelector(s);
    if (!sc || !el) return null;
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const parent = el.parentElement.getBoundingClientRect();
    const [L, H] = [el.offsetWidth, el.offsetHeight];
    return [
      [0, 0],
      [L, 0],
      [L, H],
      [0, H],
    ].map(([x, y]) => {
      const q = m.transformPoint(new DOMPoint(x, y, 0, 1));
      return [(parent.left + q.x / q.w - sc.left) / sc.width, (parent.top + q.y / q.w - sc.top) / sc.height];
    });
  }, sel);
const vus = await coinsVus(".tvd-scene .tv .tv-ecran");
ok(Boolean(vus) && attendus.every(([x, y], k) => Math.abs(vus[k][0] - x) < 0.02 && Math.abs(vus[k][1] - y) < 0.02) && (await section.locator('[data-geste="placer-ecran"]').textContent())?.includes("Replacer"), `l'écran épouse la perspective : ses coins sur ceux posés (${JSON.stringify(vus?.map((q) => q.map((v) => Math.round(v * 1000) / 1000)))})`);
await p.screenshot({ path: `${D}/tele-duo-perspective.png` });

// ─── allumée, en perspective : le lecteur aussi épouse les coins ───
await section.locator(".tv").click();
await p.waitForTimeout(900);
await section.locator('.tv [data-geste="allumer"]').click();
await p.waitForSelector("[data-faux-yt]", { timeout: 10000 }).catch(() => null);
await p.waitForTimeout(400);
const lecteurVu = await p.evaluate(() => {
  const t = document.querySelector(".tvd-scene .tv")?.getBoundingClientRect();
  const el = document.querySelector(".tv-flottant .tv-deforme");
  if (!t || !el) return null;
  const m = new DOMMatrix(getComputedStyle(el).transform);
  const f = el.parentElement.getBoundingClientRect();
  const [L, H] = [el.offsetWidth, el.offsetHeight];
  return [
    [0, 0],
    [L, 0],
    [L, H],
    [0, H],
  ].map(([x, y]) => {
    const q = m.transformPoint(new DOMPoint(x, y, 0, 1));
    return [(f.left + q.x / q.w - t.left) / t.width, (f.top + q.y / q.w - t.top) / t.height];
  });
});
// (dans la boîte de l'écran : les coins posés, ramenés à elle)
const dansLaBoite = attendus.map(([x, y]) => [(x - 0.6) / 0.3, (y - 0.17) / 0.16]);
ok(Boolean(lecteurVu) && dansLaBoite.every(([x, y], k) => Math.abs(lecteurVu[k][0] - x) < 0.05 && Math.abs(lecteurVu[k][1] - y) < 0.05), `allumée : le lecteur épouse aussi la perspective (${JSON.stringify(lecteurVu?.map((q) => q.map((v) => Math.round(v * 100) / 100)))})`);
const couvre = await p.evaluate(() => {
  const d = document.querySelector(".tv-flottant .tv-deforme");
  const v = document.querySelector(".tv-flottant .tv-video");
  return d && v ? { l: v.offsetWidth / d.offsetWidth, h: v.offsetHeight / d.offsetHeight } : null;
});
ok(Boolean(couvre) && couvre.l >= 0.999 && couvre.h >= 0.999, `la vidéo couvre tout l'écran, sans bandes noires (${JSON.stringify(couvre)})`);
await p.screenshot({ path: `${D}/tele-duo-perspective-allumee.png` });
await section.locator(".tvd-recul").click();
await p.waitForTimeout(800);

// ─── la liste de secours ───
const liste = section.locator("textarea");
const lignes = (await liste.inputValue()).split("\n");
ok(lignes.length === 5 && DEFAUT.every((id, i) => lignes[i].includes(id)), "la liste : les cinq clips du propriétaire");
await liste.fill("https://www.youtube.com/watch?v=Zz9Yy8Xx7Ww\nhttps://lemonde.fr/un-article\nhttps://youtu.be/Qq1Ww2Ee3Rr");
await section.locator(".tvd-ranger").click();
await p.waitForFunction(() => document.querySelectorAll('section[aria-label="La télé du duo"] .tvd-clips a').length === 2, null, { timeout: 10000 }).catch(() => null);
ok((await section.locator(".tvd-clips a").count()) === 2 && (await section.textContent())?.includes("Rangée : 2 clips") && (await section.textContent())?.includes("lemonde.fr/un-article"), "rangée : deux clips, la ligne d'ailleurs refusée et montrée");

// ─── la page ───
ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde sur un iPhone");
ok(!/exemple/i.test((await p.locator("body").textContent()) ?? ""), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await nav.close();

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
