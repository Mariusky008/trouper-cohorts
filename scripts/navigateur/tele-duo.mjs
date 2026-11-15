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
