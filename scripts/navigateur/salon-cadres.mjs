// 🖼️ LE SALON DU DUO : LES CADRES DE LA PIÈCE, ET « 📺 UN CLIP » (`docs/univers/salon-du-duo.md`, sections 4.8 et 4.9 ; le
// lot S6) — l'adresse d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase et sa fausse
// modération (jamais la vraie base ; jamais YouTube).
//
// Le salon a deux cadres vides et une télé. Sam a envoyé une photo et un clip YouTube. Léa (l'administrateur, sur ce
// téléphone) touche un cadre vide : « Accrocher une photo au mur ». Elle envoie une photo (＋ → 📷) : sous sa bulle,
// « 🖼️ L'accrocher au mur ? » ; un toucher : « 🖼️ Accrochée ! », elle est dans le premier cadre (chez Sam aussi).
// 🛋️ Ensemble → 🖼️ Accrocher : la feuille, leurs deux photos ; celle de Sam va dans le cadre vide. Toucher un cadre :
// la photo en grand, « Accrochée par toi · aujourd'hui », « 🖼️ Une autre photo ici » : la feuille (« Au mur »), une
// autre photo, elle remplace. Sam accroche une photo : en direct, « 🖼️ Sam a accroché une photo ». 📺 Un clip : la
// feuille « Mettre à la télé », le clip de Sam ; un lien collé part comme un écrit et passe à la télé. 🖼️ dans 💬.
// Ni débordement, ni glissement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000ec0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-cadres-nav-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const PAIRE = [LEA.id, SAM.id].sort().join("_");
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`fils/${PAIRE}/piece.json`, { piece: "salon", le: maintenant });
// (le salon : une pièce en hauteur, ses places et sa table basse relevées)
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="80" y="150" width="210" height="260" fill="#c9a36b"/><rect x="100" y="172" width="170" height="216" fill="#efe6d4"/><rect x="330" y="160" width="170" height="210" fill="#c9a36b"/><rect x="346" y="178" width="138" height="174" fill="#efe6d4"/><rect x="590" y="170" width="360" height="215" fill="#111"/><ellipse cx="512" cy="1180" rx="170" ry="60" fill="#6b4226"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [[0.078, 0.098, 0.205, 0.169], [0.322, 0.104, 0.166, 0.137]], tele: [0.576, 0.111, 0.352, 0.14], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09] } });
const assise = (couleur) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="330" rx="200" ry="190" fill="${couleur}"/><rect x="355" y="500" width="90" height="70" fill="${couleur}"/><rect x="160" y="550" width="480" height="560" rx="50" fill="#5a3a2a"/></svg>`))
    .png()
    .toBuffer();
const poster = (q, corps) => fetch(`${BASE}/api/direct/${corps.action === "calques" ? "salon" : "proches"}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(x === LEA ? "#e0a070" : "#7090e0"), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  ok((await poster(x, { action: "calques" })).status === 200, `les calques de ${x.prenom}, faits`);
}


// (Sam est là ; il a envoyé une photo et un clip YouTube)
await poster(SAM, { action: "la" });
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const photoDe = async (de, couleur, ilYaMin, legende = "") => {
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `ph${String(ts).slice(-10)}`;
  const img = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="600" height="450" fill="${couleur}"/><circle cx="300" cy="225" r="120" fill="#fff6"/></svg>`)).webp().toBuffer();
  await deposer(`fils/${PAIRE}/p/${id}.webp`, img, "image/webp");
  await json(`fils/${PAIRE}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), genre: "photo", legende, tete: null, media: { chemin: `fils/${PAIRE}/p/${id}.webp`, l: 600, h: 450 } });
  return id;
};
const photoSam = await photoDe(SAM, "#3a6ea5", 30, "Le lac");
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Regarde ça https://www.youtube.com/watch?v=AbCdEfGhIjK" });
const MARCHE = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#3f7a4a"/><circle cx="600" cy="450" r="220" fill="#ffd36b"/></svg>`)).jpeg().toBuffer();

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource|youtube|ytimg/i.test(m.text()) && erreurs.push(m.text()));
await p.route(/youtube\.com|ytimg\.com|youtube-nocookie\.com/, (r) => r.abort());
const attendre = async (f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const auMur = () => p.evaluate(() => [...document.querySelectorAll(".sc-cadre")].map((c) => c.dataset.photo || "-").join(","));
const cadresDe = async (q, avec) => (await (await fetch(`${BASE}/api/direct/cadres?avec=${avec}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json())?.cadres ?? [];
const feuillePrete = (sel) => attendre(() => p.evaluate((sel) => { const f = document.querySelector(sel); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }, sel), 6000);

await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")).startsWith("Regarde ça"), 15000), "le salon est ouvert");
await p.locator(".sd-scene").dispatchEvent("pointerdown");

// ═══ LES CADRES VIDES ═══
ok(await attendre(async () => (await auMur()) === "-,-", 8000), "deux cadres, vides");
const ou = await p.evaluate(() => {
  const c = document.querySelector('.sc-cadre[data-cadre="1"]').getBoundingClientRect();
  const s = document.querySelector(".sc-stage").getBoundingClientRect();
  return { x: (c.left - s.left) / s.width, y: (c.top - s.top) / s.height };
});
ok(Math.abs(ou.x - 0.322) < 0.02 && Math.abs(ou.y - 0.104) < 0.02, `sur les cadres relevés (${ou.x.toFixed(2)}, ${ou.y.toFixed(2)})`);
await p.locator('.sc-cadre[data-cadre="1"]').click();
ok(await attendre(async () => (await p.locator('.sd-choisir[data-choisir="mur"]').count()) === 1, 4000), "un cadre vide : « Accrocher une photo au mur »");
await feuillePrete(".sd-choisir");
ok((await texte(".sd-choisir .sd-poignee")) === "Accrocher une photo au mur" && (await texte(".sd-choisir-tel")) === "📷 Une photo de ton téléphone", "… « 📷 Une photo de ton téléphone »");
ok((await p.locator(".sd-choisir-piece").count()) === 1, "… « Ou l'une de vos photos » : celle de Sam");
await p.locator(".sd-voile.vu").last().click({ position: { x: 20, y: 20 } });
ok(await attendre(async () => (await p.locator(".sd-choisir").count()) === 0, 3000), "toucher à côté : fermée");

// ═══ LÉA ENVOIE UNE PHOTO, L'ACCROCHE ═══
await p.locator(".sd-joindre").click();
await feuillePrete('.sd-envoi[data-envoi="choix"]');
const [choix] = await Promise.all([p.waitForEvent("filechooser", { timeout: 6000 }), p.locator('.sd-joint[data-joint="photo"]').click()]);
await choix.setFiles({ name: "marche.jpg", mimeType: "image/jpeg", buffer: MARCHE });
await attendre(async () => (await p.locator('.sd-envoi-apercu[data-etat="prete"]').count()) === 1, 8000);
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 15000), "sa photo est partie");
ok(await attendre(async () => (await texte(".sd-accrocher")) === "🖼️ L’accrocher au mur ?", 4000), "sous sa bulle : « 🖼️ L'accrocher au mur ? »");
await p.screenshot({ path: `${D}/salon-cadres-1-question.png` });
const maPhoto = await p.locator(".sd-accrocher").getAttribute("data-accrocher");
await p.locator(".sd-accrocher").click();
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "🖼️ Accrochée !", 5000), "« 🖼️ Accrochée ! »");
ok(await attendre(async () => (await auMur()) === `${maPhoto},-`, 3000), `dans le premier cadre (${await auMur()})`);
ok((await p.locator('.sc-cadre[data-cadre="0"].pose img').count()) === 1, "… elle s'y pose");
ok((await p.locator(".sd-accrocher").count()) === 0, "la question disparaît de sa bulle");
ok((await cadresDe(SAM, LEA.cle)).find((c) => c.cadre === 0)?.message === maPhoto, "chez Sam aussi");

// ═══ 🖼️ ACCROCHER (🛋️ ENSEMBLE) ═══
await p.locator('.sd-onglet[data-onglet="ensemble"]').click();
const puces = await p.evaluate(() => [...document.querySelectorAll(".sd-gestes .sd-geste")].map((x) => x.dataset.geste));
ok(puces.join(",") === "calin,cafe,danser,clip,photo,surprise", `🛋️ : 📺 Un clip et 🖼️ Accrocher (la pièce a une télé et des cadres) (${puces.join(", ")})`);
await p.locator('.sd-geste[data-geste="photo"]').click();
await feuillePrete(".sd-choisir");
ok((await p.locator(".sd-choisir-piece").count()) === 2, "la feuille : leurs deux photos");
await p.locator(`.sd-choisir-piece[data-piece="${photoSam}"]`).click();
ok(await attendre(async () => (await auMur()) === `${maPhoto},${photoSam}`, 5000), "la photo de Sam va dans le cadre vide");
await p.waitForTimeout(800);
await p.screenshot({ path: `${D}/salon-cadres-2-mur.png` });

// ═══ TOUCHER UN CADRE : EN GRAND, UNE AUTRE PHOTO ICI ═══
await p.locator('.sc-cadre[data-cadre="0"]').click();
ok(await attendre(async () => (await p.locator('.sd-cadre-grand[data-cadre-grand="0"] img').count()) === 1, 3000), "toucher un cadre : la photo en grand");
ok((await texte(".sd-cadre-grand small")) === "Accrochée par toi · aujourd’hui", `« ${await texte(".sd-cadre-grand small")} »`);
await p.screenshot({ path: `${D}/salon-cadres-3-grand.png` });
await p.locator(".sd-cadre-grand [data-autre]").click();
await feuillePrete(".sd-choisir");
ok((await texte(".sd-choisir-piece.ici .ici")) === "Au mur", "« 🖼️ Une autre photo ici » : la feuille, la sienne « Au mur »");
await p.locator(`.sd-choisir-piece[data-piece="${photoSam}"]`).click();
ok(await attendre(async () => (await auMur()).startsWith(`${photoSam},`), 5000), `une autre photo : elle remplace celle du cadre 0 (${await auMur()})`);

// ═══ SAM ACCROCHE : EN DIRECT ═══
await new Promise((ok) => setTimeout(ok, 30));
const r = await fetch(`${BASE}/api/direct/cadres`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ avec: LEA.cle, message: maPhoto, cadre: 1 }) });
ok(r.status === 200, "Sam accroche la photo de Léa au cadre 1");
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "🖼️ Sam a accroché une photo", 10000), "chez Léa, en direct : « 🖼️ Sam a accroché une photo »");
ok(await attendre(async () => (await auMur()) === `${photoSam},${maPhoto}`, 4000), "… le cadre change");

// ═══ 📺 UN CLIP ═══
await p.locator('.sd-geste[data-geste="clip"]').click();
await feuillePrete(".sd-choisir");
ok((await texte(".sd-choisir .sd-poignee")) === "📺 Mettre à la télé" && (await texte(".sd-choisir-tel")) === "📱 Une vidéo de ton téléphone", "📺 Un clip : « Mettre à la télé », « 📱 Une vidéo de ton téléphone »");
ok((await p.locator(".sd-choisir-piece").count()) === 1 && (await texte(".sd-choisir-piece.ici .ici")) === "À la télé", "« Ou l'un de vos clips » : celui de Sam, « À la télé »");
ok(await p.locator("[data-lien-tele]").isDisabled(), "pas encore de lien : 📺 attend");
await p.locator(".sd-choisir-lien input").fill("https://youtu.be/XyZ12345678");
await p.locator("[data-lien-tele]").click();
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "📺 À la télé !", 6000), "un lien collé : « 📺 À la télé ! »");
ok(await attendre(() => p.evaluate(() => document.querySelector(".sc-couche .tv")?.dataset.programme === "youtube"), 4000), "… la télé le passe");
ok((await texte(".sd-bulle.moi:not([data-ia])")).startsWith("https://youtu.be/XyZ12345678"), "… il est parti comme un écrit (sa bulle)");
const prog = (await (await fetch(`${BASE}/api/direct/tele?avec=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } })).json())?.programme;
ok(prog?.sorte === "youtube" && prog.id === "XyZ12345678" && prog.mis?.par === "lui", "chez Sam : le nouveau clip, mis par Léa");
await p.locator(".sd-recul").click();

// ═══ DANS 💬 ═══
await p.locator(".sd-fil").click();
await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 1, 2000);
ok((await p.locator(`.sd-feuille .sd-msg.moi [data-accrocher="${maPhoto}"]`).count()) === 1 && (await p.locator(".sd-feuille .sd-msg.autre [data-accrocher]").count()) === 0, "dans 💬 : 🖼️ sur sa photo (pas sur celle de Sam)");
await p.locator(".sd-feuille .sd-poignee").click();

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok((await p.evaluate(() => document.querySelector(".sd").scrollTop)) === 0, "le salon n'a pas glissé");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nles cadres et « 📺 Un clip » dans le salon : tout est bon");
process.exit(echecs ? 1 : 0);
