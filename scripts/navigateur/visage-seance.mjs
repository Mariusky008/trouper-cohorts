// 📷 MA FIGURINE FAIT MA TÊTE, DANS MA TÉLÉ DU JOUR (le lot V2, `docs/univers/decouvrir.md` section 28.7) — sur un
// iPhone, contre le faux Supabase, le faux YouTube, un faux lecteur de YouTube, une fausse caméra et une fausse lecture
// du visage (la même adresse que la vraie).
//
// Léa et Sam sont proches ; leurs cinq expressions sont faites (le lot V1). Sam a vu la première vidéo de leur télé du
// jour, et y a ri à 3 s (vu sur son visage, pendant 4 s). Léa ouvre sa télé du jour : « 📷 Ta figurine fait ta tête »,
// proposé une fois (la carte de la maquette, mot pour mot ; 21 novembre 2026). Sam, assis en souvenir, fait sa vraie tête de rire à sa
// seconde (pas d'émoji : sa figurine). « Allumer la caméra » : la figurine de Léa est vivante ; elle rit, sa figurine rit
// (« Je vois : 😂 ») ; la pastille reste visible ; son rire est noté à la seconde, avec sa durée — Sam le verra.
// Rouverte : plus de proposition, la caméra revient seule ; la pastille l'éteint (sa figurine d'une seule image) ;
// « 📷 » en haut la rallume d'un toucher. Par la route : une expression sans expression, ou qui
// n'existe pas, refusée ; sa durée bornée ; la même deux fois de suite, une seule ; un 😂 de la rangée au même moment
// compte quand même. Rien ne déborde, jamais le mot « exemple », aucune erreur.
import crypto from "node:crypto";
import sharp from "sharp";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (l'univers, derrière son interrupteur coupé ici : l'administrateur y entre — comme les autres essais de la séance)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `7a7a7a7a-0000-4000-8000-0000007a20${String(n).padStart(2, "0")}`, jeton: `jeton-visage-seance-nav-00${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const GENS = [LEA, SAM];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
// (leur figurine assise : une grosse tête, un cou, le corps et le fauteuil)
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="430" rx="130" ry="120" fill="#f0c8a0"/><rect x="370" y="540" width="60" height="40" fill="#f0c8a0"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#7a3e2a"/></svg>`,
      ),
      left: 0,
      top: 0,
    },
  ])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/perso/v1/assise.png`, parle: `${x.id}/perso/v1/assise.png`, prete_le: maintenant })));
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon" });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée");

const appelTele = async (x, corps, q = "") => {
  const r = await fetch(`${BASE}/api/direct/tele-du-jour${q}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
ok((await appelTele(LEA, null, "?vivante=1")).vivante === null, "📷 sa figurine vivante : pas encore (ses expressions ne sont pas faites)");
// (le lot V1 : leurs cinq expressions, faites à l'ouverture de l'appli)
for (const x of GENS) await fetch(`${BASE}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${x.jeton}` } });
const pretes = async (x) => (await lire(`${x.id}/calques/${empreinte(`${x.id}/perso/v1/assise.png`)}-expressions.json`))?.le;
for (let k = 0; k < 150 && !((await pretes(LEA)) && (await pretes(SAM))); k++) await new Promise((fini) => setTimeout(fini, 400));
const viv = (await appelTele(LEA, null, "?vivante=1")).vivante;
const ADRESSE = /^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/;
ok(viv && viv.ratio > 0 && ADRESSE.test(viv.corps) && ADRESSE.test(viv.tete?.src ?? "") && viv.tete.boite?.length === 4 && ["sourire", "rire", "surprise", "bof", "grimace"].every((e) => ADRESSE.test(viv.expressions?.[e] ?? "")), "… ses expressions faites : son corps sans sa tête, sa tête, ses cinq expressions, à adresse stable");

// (Sam a vu la première vidéo de leur télé du jour : à 3 s, son visage a ri, pendant 4 s)
const v0 = (await appelTele(LEA)).tele?.videos?.[0]?.id;
const rs = await appelTele(SAM, { action: "reagir", id: v0, t: 3, source: "visage", visage: "rire", d: 4 });
ok(rs.statut === 200 && rs.reaction?.visage === "rire" && rs.reaction.sorte === "rire" && rs.reaction.source === "visage" && rs.reaction.d === 4, `par la route : un rire vu sur son visage compte comme un 😂, avec sa durée (${JSON.stringify(rs.reaction ?? null)})`);
await appelTele(SAM, { action: "vue", id: v0, fin: true, secondes: 150 });
// (ce que la route refuse, borne, ou garde)
ok((await appelTele(SAM, { action: "reagir", id: v0, t: 20, source: "visage" })).statut === 400 && (await appelTele(SAM, { action: "reagir", id: v0, t: 20, source: "visage", visage: "colere" })).statut === 400, "… une expression sans expression, ou qui n'existe pas : refusée");
const sourire = await appelTele(SAM, { action: "reagir", id: v0, t: 30, source: "visage", visage: "sourire", d: 99 });
ok(sourire.reaction?.sorte === "coeur" && sourire.reaction.d === 6, "… un sourire, c'est ❤️ ; sa durée, six secondes au plus");
ok((await appelTele(SAM, { action: "reagir", id: v0, t: 30.5, source: "visage", visage: "sourire", d: 1 })).ignoree === true, "… le même sourire juste après : un seul");
ok(Boolean((await appelTele(SAM, { action: "reagir", id: v0, t: 3.4, sorte: "rire", source: "rangee" })).reaction), "… un 😂 de la rangée au même moment compte quand même");
const vueSam = await appelTele(SAM, null, `?reactions=${v0}`);
ok(vueSam.miennes?.some((r) => r.visage === "rire" && r.t === 3), "Sam retrouve son rire dans ses réactions");

// ═══ LE TÉLÉPHONE DE LÉA ═══
const FAUX_YT = `
window.YT = { Player: function (el, o) {
  var d = document.createElement("div"); d.className = "faux-yt"; d.dataset.yt = o.videoId; d.style.cssText = "width:100%;height:100%;background:#123";
  el.replaceWith(d);
  var self = this, t0 = Date.now(), base = Number((o.playerVars && o.playerVars.start) || 0), etat = 1;
  self.loadVideoById = function (x) { d.dataset.yt = x.videoId || x; base = (x.startSeconds || 0); t0 = Date.now(); etat = 1; };
  self.playVideo = function () { if (etat === 2) { t0 = Date.now(); } etat = 1; };
  self.pauseVideo = function () { if (etat === 1) base = base + (Date.now() - t0) / 1000; etat = 2; };
  self.seekTo = function (t) { base = t; t0 = Date.now(); };
  self.getCurrentTime = function () { return etat === 1 ? base + (Date.now() - t0) / 1000 : base; };
  self.getPlayerState = function () { return etat; };
  self.mute = function () {}; self.unMute = function () {}; self.setVolume = function () {};
  self.destroy = function () { d.remove(); };
  setTimeout(function () { o.events && o.events.onReady && o.events.onReady({ target: self }); }, 10);
} };
setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 0);
`;
// (la fausse lecture du visage : la même adresse que la vraie, elle rend window.__visage)
const FAUX_MEDIAPIPE = `
export const FilesetResolver = { forVisionTasks: async () => ({}) };
export const FaceLandmarker = { createFromOptions: async () => ({ detectForVideo: () => window.__visage || { faceBlendshapes: [], faceLandmarks: [] }, close() {} }) };
`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["camera"] });
await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: FAUX_YT }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@[\d.]+\/vision_bundle\.mjs$/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: FAUX_MEDIAPIPE }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
const visageDe = (formes) =>
  p.evaluate((formes) => {
    const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    points[33] = { x: 0.4, y: 0.45, z: 0 };
    points[263] = { x: 0.6, y: 0.45, z: 0 };
    points[1] = { x: 0.5, y: 0.55, z: 0 };
    window.__visage = formes ? { faceBlendshapes: [{ categories: Object.entries(formes).map(([categoryName, score]) => ({ categoryName, score })) }], faceLandmarks: [points] } : null;
  }, formes);
const RIRE = { mouthSmileLeft: 0.85, mouthSmileRight: 0.85, jawOpen: 0.55 };
const NEUTRE = { mouthSmileLeft: 0.05, mouthSmileRight: 0.05, jawOpen: 0.05 };

await p.goto(`${BASE}/univers/salons?chez=moi`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(".so[data-salon]").getAttribute("data-hote")) === "1", 30000), "Léa ouvre sa télé du jour : sa séance");
const propose = p.locator("[data-proposer-camera]");
ok(await attendre(async () => (await propose.count()) === 1), "📷 « Ta figurine fait ta tête » : proposé une fois");
// (📷 21 novembre 2026, « tout pour tous » : la carte, mot pour mot comme la maquette)
const carte = await texte(propose);
ok(/📷 Ta figurine fait ta tête/.test(carte) && /🙈 Rien n’est filmé, rien n’est envoyé/.test(carte) && /📝 On ne garde que « rire à 0:21 »/.test(carte) && /🔴 Une pastille reste visible tant qu’elle marche ; un toucher l’arrête/.test(carte) && /👀 Si tes proches regardent en même temps, ta figurine copie ta tête en direct/.test(carte) && /Ton téléphone voit que tu ris. Il ne garde que ça/.test(carte), "… la carte de la maquette, mot pour mot");
ok(/Je l’allume/.test(await texte(p.locator("[data-allumer-camera]"))) && /Pas maintenant/.test(await texte(p.locator("[data-plus-tard]"))), "… « Je l'allume » / « Pas maintenant »");
// (Sam, assis en souvenir : sa figurine vivante ; à 3 s, sa vraie tête de rire — pas d'émoji)
const fantome = p.locator(`[data-fantome="${SAM.cle}"]`);
ok(await attendre(async () => (await fantome.locator("[data-vivante]").count()) === 1), "Sam, en souvenir : sa figurine vivante (son corps, sa tête, ses cinq expressions)");
ok(await attendre(async () => (await fantome.locator("[data-vivante]").getAttribute("data-expression")) === "rire", 12000), "… à 3 s, il fait sa vraie tête de rire");
ok(await attendre(async () => (await fantome.locator("[data-tete='rire']").evaluate((i) => getComputedStyle(i).opacity === "1" && i.complete && i.naturalWidth > 0)) === true, 4000), "… la tête du rire est bien celle qu'on voit");
await p.screenshot({ path: `${D}/visage-seance-1-sam-rit.png` });
ok(await attendre(async () => (await fantome.locator("[data-vivante]").getAttribute("data-expression")) === "neutre", 9000), "… puis son visage habituel, quatre secondes après");

// ═══ « ALLUMER LA CAMÉRA » ═══
await p.locator("[data-allumer-camera]").click();
ok((await propose.count()) === 0 && (await p.locator('[data-camera="on"]').count()) === 1 && (await p.locator('[data-camera-haut][aria-pressed="true"]').count()) === 1, "« Je l'allume » : la carte s'en va, « 📷 » en haut est allumé");
const moi = p.locator(".so-fig[data-moi]");
ok(await attendre(async () => (await moi.locator("[data-vivante]").count()) === 1 && /Je vois : 🙂/.test(await texte(p.locator("[data-etat-camera]"))), 15000), "sa figurine devient vivante ; « Je vois : 🙂 »");
ok(/📷 Ta figurine fait ta tête/.test(await texte(p.locator("[data-pastille-camera]"))), "🔴 la pastille reste visible tant qu'elle marche");
await visageDe(RIRE);
ok(await attendre(async () => (await moi.locator("[data-vivante]").getAttribute("data-expression")) === "rire" && /Je vois : 😂/.test(await texte(p.locator("[data-etat-camera]")))), "elle rit : sa figurine rit (« Je vois : 😂 »)");
await p.screenshot({ path: `${D}/visage-seance-2-lea-rit.png` });
await p.waitForTimeout(1500);
await visageDe(NEUTRE);
ok(await attendre(async () => (await moi.locator("[data-vivante]").getAttribute("data-expression")) === "neutre"), "… puis son visage habituel");
let miennes = [];
ok(
  await attendre(async () => {
    miennes = (await appelTele(LEA, null, `?reactions=${v0}`)).miennes ?? [];
    return miennes.some((r) => r.visage === "rire" && r.source === "visage" && r.d >= 1);
  }),
  `son rire est noté à la seconde de la vidéo, avec sa durée (${JSON.stringify(miennes.find((r) => r.visage) ?? null)})`,
);
const chezSam = await appelTele(SAM, null, `?reactions=${v0}`);
const leaVue = chezSam.proches?.find((x) => x.cle === LEA.cle);
ok(leaVue?.reactions?.some((r) => r.visage === "rire") && ADRESSE.test(leaVue.vivante?.expressions?.rire ?? ""), "chez Sam : le rire de Léa, et sa figurine vivante pour le rejouer");

// ═══ ROUVERTE, ÉTEINTE ═══
await p.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator('[data-camera="on"]').count()) === 1 && (await moi.locator("[data-vivante]").count()) === 1, 20000) && (await propose.count()) === 0, "rouverte : plus de proposition, la caméra revient seule");
ok(await attendre(async () => (await p.locator("[data-pastille-camera]").count()) === 1), "… la pastille aussi");
await p.locator("[data-pastille-camera]").click();
ok(await attendre(async () => (await p.locator('[data-camera="off"]').count()) === 1 && (await moi.locator("[data-vivante]").count()) === 0 && (await moi.locator("img").count()) === 1 && (await p.locator("[data-pastille-camera]").count()) === 0), "un toucher sur la pastille : éteinte — sa figurine d'une seule image, comme avant");
ok(/Éteinte : ta caméra ne regarde plus/.test(await texte(p.locator("[data-note]"))), "… « 📷 Éteinte : ta caméra ne regarde plus »");
await p.locator("[data-camera-haut]").click();
ok(await attendre(async () => (await p.locator('[data-camera="on"]').count()) === 1 && (await moi.locator("[data-vivante]").count()) === 1, 15000) && (await propose.count()) === 0, "« 📷 » en haut : elle se rallume d'un toucher (la carte, une seule fois)");
await p.locator('[data-camera="on"]').click();
ok(await attendre(async () => (await p.locator('[data-camera="off"]').count()) === 1 && (await moi.locator("[data-vivante]").count()) === 0), "… et l'interrupteur du bas l'éteint");
ok(!(await p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 1)), "rien ne déborde");
ok(!/exemple/i.test(await p.locator("body").innerText()), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur (${erreurs.slice(0, 3).join(" | ")})`);
await b.close();

console.log(echecs ? `\n${echecs} échec(s)` : "\nma figurine fait ma tête ✓");
process.exit(echecs ? 1 : 0);
