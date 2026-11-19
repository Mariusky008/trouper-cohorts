// ＋ LE SALON DU DUO : ENVOYER UNE PHOTO, UNE VIDÉO, UN LIEN (`docs/univers/salon-du-duo.md`, section 4.8 ; le lot S6) —
// l'adresse d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase et sa fausse modération (jamais
// la vraie base).
//
// Léa (l'administrateur, sur ce téléphone) ouvre son salon avec Sam. À gauche de la saisie, un ＋ : « Envoyer à Sam »,
// trois cases (📷 Photo « elle peut aller au mur », 🎬 Vidéo « elle peut passer à la télé », 🔗 Lien). 📷 : sa photo,
// réduite dans le téléphone, en aperçu ; une légende ; « Envoyer » : la feuille se ferme, « 📷 Au marché ce matin » dans
// sa bulle, la photo dans 💬, et chez Sam (par la route). 🎬 : une vidéo enregistrée par le navigateur, lue dans le
// téléphone (« 0:02 »), « Envoi… », puis « 🎬 Une vidéo » dans sa bulle. Une photo que la modération refuse : dit, et
// « Une autre » ; la modération en panne : « Réessayer ». Un fichier qui n'est pas une photo : dit. 🔗 : la feuille se
// ferme, la saisie s'ouvre (« Colle un lien… »). 📎 (décidé par le propriétaire : seulement des PDF, sans contrôle) : un
// PDF, son nom et sa taille, pas de légende ; « 📎 Billets.pdf » dans sa bulle, sa carte dans 💬 (elle le télécharge) ;
// une image renommée en .pdf : « Seuls les PDF peuvent partir. ». Ni débordement, ni erreur, ni le mot « exemple ».
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000fd0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-envoyer-nav-0${String(n).padStart(2, "0")}`, prenom });
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
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="620" y="200" width="300" height="260" fill="#bfe3ff"/><ellipse cx="512" cy="1180" rx="170" ry="60" fill="#6b4226"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09], etagere: [0.6, 0.13, 0.3, 0.16] } });
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


await poster(SAM, { action: "la" });
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Coucou !" });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();

// ─── la vidéo d'essai, enregistrée par le navigateur (une toile animée, comme une caméra) ───
const atelier = await (await b.newContext()).newPage();
await atelier.goto(`${BASE}/collection`, { waitUntil: "domcontentloaded" });
const CONCERT = Buffer.from(
  await atelier.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 360;
    const ctx = c.getContext("2d");
    const rec = new MediaRecorder(c.captureStream(25), { mimeType: "video/webm;codecs=vp8" });
    const morceaux = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    const fini = new Promise((ok) => (rec.onstop = ok));
    const t0 = performance.now();
    let tourne = true;
    const dessiner = () => {
      const t = (performance.now() - t0) / 2000;
      ctx.fillStyle = `hsl(${300 + t * 90}, 70%, 50%)`;
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = "#fff";
      ctx.fillRect(t * 512, 144, 128, 72);
      if (tourne) requestAnimationFrame(dessiner);
    };
    dessiner();
    rec.start(200);
    await new Promise((ok) => setTimeout(ok, 2000));
    rec.stop();
    tourne = false;
    await fini;
    const octets = new Uint8Array(await new Blob(morceaux, { type: "video/webm" }).arrayBuffer());
    let s = "";
    for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
    return btoa(s);
  }),
  "base64",
);
await atelier.context().close();
ok(CONCERT.length > 1000, `la vidéo d'essai, enregistrée par le navigateur (${Math.round(CONCERT.length / 1024)} Ko)`);
// (les photos : un marché ; 321 pixels de large, la modération la refuse ; 322, elle ne répond pas)
const image = (l, h, c) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}"><rect width="${l}" height="${h}" fill="${c}"/><circle cx="${l / 2}" cy="${h / 2}" r="${h / 4}" fill="#ffd36b"/></svg>`)).jpeg().toBuffer();
const MARCHE = await image(1200, 900, "#3f7a4a");
const REFUSEE = await image(321, 420, "#7a3f4a");
const PANNE = await image(322, 420, "#3f4a7a");

const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const ouvrirPlus = async () => {
  await p.locator(".sd-joindre").click();
  // (la feuille a fini de monter : un doigt ne touche pas une case qui bouge)
  return attendre(() => p.evaluate(() => { const f = document.querySelector('.sd-envoi[data-envoi="choix"]'); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }), 6000);
};
const choisir = async (joint, nom, type, buffer) => {
  const [choix] = await Promise.all([p.waitForEvent("filechooser", { timeout: 6000 }), p.locator(`.sd-joint[data-joint="${joint}"]`).click()]);
  await choix.setFiles({ name: nom, mimeType: type, buffer });
};
const filDeSam = async () => (await (await fetch(`${BASE}/api/direct/proches?fil=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } })).json())?.fil?.messages ?? [];

await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
// (en développement, le bouton de Next se pose sur le ＋ : on le cache ; il n'existe pas en production)
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")) === "Coucou !", 15000), "le salon est ouvert (la bulle de Sam)");
await p.locator(".sd-scene").dispatchEvent("pointerdown");

// ═══ ＋ : « ENVOYER À SAM » ═══
const plus = await p.evaluate(() => {
  const j = document.querySelector(".sd-joindre")?.getBoundingClientRect();
  const i = document.querySelector(".sd-saisie input")?.getBoundingClientRect();
  return j && i ? j.right <= i.left + 1 && Math.abs(j.top + j.height / 2 - (i.top + i.height / 2)) < 6 : false;
});
ok(plus, "un ＋ à gauche de la saisie");
ok(await ouvrirPlus(), "＋ : la feuille s'ouvre");
ok((await texte(".sd-envoi .sd-poignee")) === "Envoyer à Sam", `« ${await texte(".sd-envoi .sd-poignee")} »`);
const cases = await p.locator(".sd-joint").evaluateAll((l) => l.map((x) => `${x.dataset.joint}:${x.innerText.replace(/\s+/g, " ").trim()}`));
ok(cases.join(" | ") === "vocal:🎙️ Un vocal garde le micro appuyé | photo:📷 Photo elle peut aller au mur | video:🎬 Vidéo elle peut passer à la télé | lien:🔗 Lien YouTube, une chanson, un site | fichier:📎 PDF un document, un billet, une recette", `cinq cases (${cases.join(" | ")})`);
await p.screenshot({ path: `${D}/salon-envoyer-1-plus.png` });

// ═══ 📷 UNE PHOTO ═══
await choisir("photo", "marche.jpg", "image/jpeg", MARCHE);
ok(await attendre(async () => (await p.locator('.sd-envoi[data-envoi="photo"] .sd-envoi-apercu[data-etat="prete"] img').count()) === 1, 8000), "📷 : sa photo, réduite dans le téléphone, en aperçu");
ok((await texte(".sd-envoi .sd-poignee")) === "📷 Une photo pour Sam", `« ${await texte(".sd-envoi .sd-poignee")} »`);
await p.locator(".sd-envoi-piece input").fill("Au marché ce matin");
await p.screenshot({ path: `${D}/salon-envoyer-2-photo.png` });
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 15000), "« Envoyer » : la feuille se ferme");
ok(await attendre(async () => (await texte(".sd-bulle.moi:not([data-ia])")) === "📷 Au marché ce matin", 4000), `dans sa bulle : « ${await texte(".sd-bulle.moi:not([data-ia])")} »`);
let chezSam = await filDeSam();
const photo = chezSam.find((m) => m.genre === "photo");
ok(photo?.texte === "Au marché ce matin" && Boolean(photo?.photo?.url) && photo.photo.l === 1200, `chez Sam : la photo, sa légende (${photo?.photo?.l}×${photo?.photo?.h})`);
await p.locator(".sd-fil").click();
ok(await attendre(async () => (await p.locator(".sd-feuille.vu .sd-msg.moi img.sd-piece").count()) === 1, 4000), "dans 💬 : la photo");
await p.locator(".sd-feuille .sd-poignee").click();
await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 0, 2000);

// ═══ 🎬 UNE VIDÉO ═══
await p.waitForTimeout(600);
ok(await ouvrirPlus(), "＋ de nouveau");
const envois = [];
p.on("request", (r) => r.method() === "PUT" && r.url().includes("/storage/v1/object/upload/sign/") && envois.push(r.url()));
await choisir("video", "concert.webm", "video/webm", CONCERT);
ok(await attendre(async () => (await p.locator('.sd-envoi[data-envoi="video"] .sd-envoi-apercu[data-etat="prete"] video').count()) === 1, 25000), "🎬 : sa vidéo, lue dans le téléphone");
ok((await texte(".sd-envoi-duree")) === "0:02", `sa durée : « ${await texte(".sd-envoi-duree")} »`);
const voiles = [];
const regard = setInterval(() => void texte(".sd-envoi-voile").then((t) => t && !voiles.includes(t.replace(/\d+ %/, "x %")) && voiles.push(t.replace(/\d+ %/, "x %"))), 40);
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 30000), "« Envoyer » : partie");
clearInterval(regard);
ok(voiles.some((v) => v.startsWith("Envoi…")), `« Envoi… » puis « Vérification… » (${voiles.join(" → ")})`);
ok(envois.length === 1, "déposée une fois, tout droit au seau");
ok(await attendre(async () => (await texte(".sd-bulle.moi:not([data-ia])")) === "🎬 Une vidéo", 4000), `dans sa bulle : « ${await texte(".sd-bulle.moi:not([data-ia])")} »`);
chezSam = await filDeSam();
ok(chezSam.some((m) => m.genre === "video" && m.video?.url && Math.round(m.video.duree ?? 0) === 2), "chez Sam : la vidéo");

// ═══ CE QUI NE PART PAS ═══
await p.waitForTimeout(600);
await ouvrirPlus();
await choisir("photo", "refusee.jpg", "image/jpeg", REFUSEE);
await attendre(async () => (await p.locator('.sd-envoi-apercu[data-etat="prete"]').count()) === 1, 8000);
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await texte('.sd-envoi-dit[role="alert"]')) === "Cette photo ne peut pas partir.", 10000), `une photo que la modération refuse : « ${await texte('.sd-envoi-dit[role="alert"]')} »`);
ok((await texte(".sd-envoi-boutons button:not(.oui)")) === "Une autre" && (await p.locator(".sd-envoi [data-envoyer]").isDisabled()), "… « Une autre »");
await p.locator(".sd-envoi-boutons button:not(.oui)").click();
ok(await attendre(async () => (await p.locator('.sd-envoi[data-envoi="choix"]').count()) === 1, 3000), "… les trois cases reviennent");
await choisir("photo", "panne.jpg", "image/jpeg", PANNE);
await attendre(async () => (await p.locator('.sd-envoi-apercu[data-etat="prete"]').count()) === 1, 8000);
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await texte(".sd-envoi [data-envoyer]")) === "Réessayer", 10000), `la modération en panne : « ${await texte('.sd-envoi-dit[role="alert"]')} », « Réessayer »`);
await p.locator(".sd-envoi-boutons button:not(.oui)").click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 3000), "« Annuler » : fermée");
await ouvrirPlus();
await choisir("photo", "notes.txt", "text/plain", Buffer.from("pas une photo"));
ok(await attendre(async () => (await texte('.sd-envoi-dit[role="alert"]')) === "Ce fichier n’est pas une photo.", 6000), "un fichier qui n'est pas une photo : dit");
await p.locator(".sd-voile.vu").click({ position: { x: 20, y: 20 } });
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 3000), "toucher à côté : fermée");
ok((await filDeSam()).filter((m) => m.genre === "photo").length === 1, "rien d'autre n'est parti");

// ═══ 📎 UN PDF ═══
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n".padEnd(2400, " "));
await ouvrirPlus();
await choisir("fichier", "Billets.pdf", "application/pdf", PDF);
ok(await attendre(async () => (await p.locator('.sd-envoi[data-envoi="fichier"] .sd-envoi-apercu[data-etat="prete"] .sd-envoi-pdf').count()) === 1, 6000), "📎 : son PDF, prêt");
ok((await texte(".sd-envoi-pdf")) === "📄 Billets.pdf 2 Ko" && (await p.locator(".sd-envoi-piece input").count()) === 0, `son nom, sa taille, pas de légende (« ${await texte(".sd-envoi-pdf")} »)`);
ok((await texte(".sd-envoi .sd-poignee")) === "📎 Un PDF pour Sam", `« ${await texte(".sd-envoi .sd-poignee")} »`);
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 10000), "« Envoyer » : parti");
ok(await attendre(async () => (await texte(".sd-bulle.moi:not([data-ia])")) === "📎 Billets.pdf", 4000), `dans sa bulle : « ${await texte(".sd-bulle.moi:not([data-ia])")} »`);
ok((await filDeSam()).some((m) => m.genre === "fichier" && m.fichier?.nom === "Billets.pdf"), "chez Sam : le PDF");
await p.locator(".sd-fil").click();
ok(await attendre(async () => (await p.locator('.sd-feuille.vu .sd-msg.moi a.sd-fichier[download="Billets.pdf"]').count()) === 1, 4000), "dans 💬 : sa carte, qui le télécharge");
ok((await texte(".sd-feuille .sd-fichier small")) === "PDF · 2 Ko · Télécharger", `« ${await texte(".sd-feuille .sd-fichier small")} »`);
await p.locator(".sd-feuille .sd-poignee").click();
await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 0, 2000);
await p.waitForTimeout(500);
await ouvrirPlus();
await choisir("fichier", "faux.pdf", "application/pdf", PANNE);
ok(await attendre(async () => (await texte('.sd-envoi-dit[role="alert"]')) === "Seuls les PDF peuvent partir.", 6000), "une image renommée en .pdf : « Seuls les PDF peuvent partir. »");
await p.locator(".sd-voile.vu").click({ position: { x: 20, y: 20 } });
await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 3000);

// ═══ 🔗 UN LIEN ═══
await ouvrirPlus();
await p.locator('.sd-joint[data-joint="lien"]').click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 3000), "🔗 : la feuille se ferme");
ok(await attendre(() => p.evaluate(() => document.activeElement === document.querySelector(".sd-saisie input")), 2000), "… la saisie s'ouvre");
ok((await p.locator(".sd-saisie input").getAttribute("placeholder")) === "Colle un lien : YouTube, une chanson, un site…", "« Colle un lien : YouTube, une chanson, un site… »");
await p.screenshot({ path: `${D}/salon-envoyer-3-lien.png` });

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok((await p.evaluate(() => document.querySelector(".sd").scrollTop)) === 0, "le salon n'a pas glissé");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nenvoyer une photo, une vidéo, un lien depuis le salon : tout est bon");
process.exit(echecs ? 1 : 0);
