// 📺 LE SALON DU DUO : LA TÉLÉ DANS LA PIÈCE (`docs/univers/salon-du-duo.md`, sections 4.8 et 4.9 ; le lot S6) — l'adresse
// d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase et sa fausse modération (jamais la vraie
// base ; jamais YouTube : on n'allume que la vidéo filmée).
//
// Sam a envoyé un clip YouTube : la télé de la pièce le montre, de loin (sur l'écran relevé). Léa (l'administrateur, sur
// ce téléphone) lui envoie une vidéo (＋ → 🎬) : sous sa bulle, « 📺 La mettre à la télé ? ». Un toucher : « 📺 À la
// télé ! », la caméra s'approche de la télé, « ↩ La pièce » ; la télé passe sa vidéo (« ▶ Allumer » la lit, avec le
// son) ; la question disparaît de sa bulle. Chez Sam (par la route) : sa vidéo, mise par Léa. « ↩ La pièce » : la caméra
// revient. Sam remet son clip à la télé : chez Léa, en direct, « 📺 Sam a mis quelque chose à la télé », la télé le
// montre. Dans 💬, sa vidéo a un 📺. 🍿 Léa écrit un lien Netflix : « 📺 À la télé ce soir ? » ; un toucher : « 🍿 Ce
// soir, à la télé ! », l'affiche « Ce soir », et « Notre film » posé dans « À venir ». Toucher la télé de loin : la
// caméra s'en approche. Ni débordement, ni erreur, ni le mot « exemple ».
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000fe0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-tele-nav-0${String(n).padStart(2, "0")}`, prenom });
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
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="620" y="200" width="300" height="260" fill="#bfe3ff"/><rect x="90" y="170" width="380" height="230" fill="#111"/><ellipse cx="512" cy="1180" rx="170" ry="60" fill="#6b4226"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09], etagere: [0.6, 0.13, 0.3, 0.16], tele: [0.1, 0.12, 0.35, 0.14] } });
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
// (Sam a envoyé un clip YouTube : la télé le montre, de loin)
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Regarde ça https://www.youtube.com/watch?v=AbCdEfGhIjK" });

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


const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource|youtube|ytimg/i.test(m.text()) && erreurs.push(m.text()));
// (jamais YouTube : ses adresses ne répondent pas)
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
const tv = () => p.evaluate(() => {
  const t = document.querySelector(".sc-couche .tv");
  return t ? { programme: t.dataset.programme, etat: t.dataset.tele, proche: t.classList.contains("proche"), img: t.querySelector(".tv-ecran img")?.getAttribute("src") ?? "" } : null;
});
const echelle = () => p.evaluate(() => { const m = /scale\(([\d.]+)\)/.exec(document.querySelector(".sc-camera")?.style.transform ?? ""); return m ? Number(m[1]) : 1; });
const teleDe = async (q, avec) => (await (await fetch(`${BASE}/api/direct/tele?avec=${avec}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json())?.programme;

await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
// (en développement, le bouton de Next se pose sur le ＋ : on le cache ; il n'existe pas en production)
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")).startsWith("Regarde ça"), 15000), "le salon est ouvert (la bulle de Sam)");
await p.locator(".sd-scene").dispatchEvent("pointerdown");

// ═══ LA TÉLÉ, DE LOIN ═══
ok(await attendre(async () => (await tv())?.programme === "youtube", 10000), `la télé de la pièce montre le clip de Sam, de loin (${JSON.stringify(await tv())})`);
const ou = await p.evaluate(() => {
  const t = document.querySelector(".sc-couche .tv").getBoundingClientRect();
  const s = document.querySelector(".sc-stage").getBoundingClientRect();
  return { x: (t.left - s.left) / s.width, y: (t.top - s.top) / s.height, w: t.width / s.width };
});
ok(Math.abs(ou.x - 0.1) < 0.02 && Math.abs(ou.y - 0.12) < 0.02 && Math.abs(ou.w - 0.35) < 0.02, `sur l'écran relevé (${ou.x.toFixed(2)}, ${ou.y.toFixed(2)}, ${ou.w.toFixed(2)})`);
ok((await tv())?.proche === false && (await p.locator(".tv-bouton").count()) === 0, "de loin : pas de bouton");
ok((await p.locator(".sd-mettre-tele").count()) === 0, "un écrit sans lien vidéo de Léa : pas de question");

// ═══ LÉA ENVOIE UNE VIDÉO ═══
await p.locator(".sd-joindre").click();
await attendre(() => p.evaluate(() => { const f = document.querySelector('.sd-envoi[data-envoi="choix"]'); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }), 6000);
const [choix] = await Promise.all([p.waitForEvent("filechooser", { timeout: 6000 }), p.locator('.sd-joint[data-joint="video"]').click()]);
await choix.setFiles({ name: "concert.webm", mimeType: "video/webm", buffer: CONCERT });
await attendre(async () => (await p.locator('.sd-envoi-apercu[data-etat="prete"]').count()) === 1, 25000);
await p.locator(".sd-envoi [data-envoyer]").click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 30000), "sa vidéo est partie");
ok(await attendre(async () => (await texte(".sd-mettre-tele")) === "📺 La mettre à la télé ?", 4000), "sous sa bulle : « 📺 La mettre à la télé ? »");
await p.screenshot({ path: `${D}/salon-tele-1-question.png` });

// ═══ « 📺 LA METTRE À LA TÉLÉ ? » ═══
await p.locator(".sd-mettre-tele").click();
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "📺 À la télé !", 4000), "« 📺 À la télé ! »");
ok(await attendre(async () => (await tv())?.programme === "video" && (await tv())?.proche === true, 4000), "la télé passe sa vidéo ; la caméra s'en approche");
ok(await attendre(async () => (await echelle()) > 1.4, 3000), `… la caméra zoome (×${(await echelle()).toFixed(2)})`);
ok((await p.locator(".sd-recul").count()) === 1, "« ↩ La pièce »");
ok((await p.locator(".sd-mettre-tele").count()) === 0, "la question disparaît de sa bulle");
const chezSam = await teleDe(SAM, LEA.cle);
ok(chezSam?.sorte === "video" && chezSam.mis?.par === "lui" && chezSam.moi === false, "chez Sam : sa vidéo, mise par Léa");
await p.waitForTimeout(1600);
await p.screenshot({ path: `${D}/salon-tele-2-proche.png` });
await p.locator(".tv-bouton[data-geste=allumer]").click();
ok(await attendre(() => p.evaluate(() => { const v = document.querySelector(".tv-flottant video.tv-fichier"); return Boolean(v) && v.currentTime > 0.2 && !v.muted; }), 8000), "« ▶ Allumer » : sa vidéo joue, avec le son");
ok((await tv())?.etat === "allumee", "la télé est allumée");
// (🧍 21 novembre 2026, « la télé passe au-dessus de la tête de la figurine » : une figurine devant l'écran est découpée
// dans le lecteur, qui flotte par-dessus la scène)
const devant = await p.evaluate(() => {
  const l = document.querySelector(".tv-flottant")?.getBoundingClientRect();
  if (!l) return null;
  const n = [...document.querySelectorAll(".sc-fig .sc-calque > img")].filter((i) => {
    const r = i.getBoundingClientRect();
    return r.width > 0 && r.right > l.left && r.left < l.right && r.bottom > l.top && r.top < l.bottom;
  }).length;
  const f = document.querySelector(".tv-flottant");
  const bulles = document.querySelector(".sd-bulles");
  const st = getComputedStyle(f);
  return { n, marque: Number(f?.getAttribute("data-silhouettes") ?? 0), masque: st.webkitMaskImage || st.maskImage || "", compo: st.maskComposite || st.webkitMaskComposite || "", plan: Number(st.zIndex), planBulles: bulles ? Number(getComputedStyle(bulles).zIndex) : 0 };
});
ok(devant && devant.marque === devant.n && (devant.n === 0 || /url\(/.test(devant.masque)), `les figurines devant l'écran (leur corps et leur tête), découpées dans le lecteur (${devant?.n} images devant)`);
// (22 novembre 2026, « coupé sur mon côté télé » : l'écran moins l'UNION des silhouettes — le corps et la tête qui se
// recouvrent ne rendent plus l'écran sur le cou)
ok(devant && (devant.n === 0 || /^(subtract|source-out)/.test(devant.compo)), `… l'écran entier, moins l'union des silhouettes (${devant?.compo})`);
// (🧱 22 novembre 2026, « les textes et bulles et autres sont derrière la télé » : le lecteur passe sous les bulles)
ok(devant && devant.plan === 3 && devant.planBulles > devant.plan, `le lecteur sous les bulles (plan ${devant?.plan}, bulles ${devant?.planBulles})`);
await p.locator(".tv-eteindre").click();
await p.locator(".sd-recul").click();
ok(await attendre(async () => (await tv())?.proche === false && (await p.locator(".sd-recul").count()) === 0, 3000), "« ↩ La pièce » : la caméra revient");
ok(await attendre(async () => (await echelle()) === 1, 3000), "… sur toute la pièce");

// ═══ SAM REMET SON CLIP À LA TÉLÉ : EN DIRECT ═══
const clip = (await (await fetch(`${BASE}/api/direct/proches?fil=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } })).json())?.fil?.messages?.find((m) => m.moi && m.texte?.startsWith("Regarde ça"))?.id;
await new Promise((ok) => setTimeout(ok, 30));
const r = await fetch(`${BASE}/api/direct/tele`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ avec: LEA.cle, message: clip }) });
ok(r.status === 200, "Sam remet son clip à la télé");
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "📺 Sam a mis quelque chose à la télé", 10000), "chez Léa, en direct : « 📺 Sam a mis quelque chose à la télé »");
ok(await attendre(async () => (await tv())?.programme === "youtube", 4000), "… la télé montre son clip");
ok(await attendre(async () => (await texte(".sd-mettre-tele")) === "📺 La mettre à la télé ?", 3000), "sa vidéo n'y est plus : la question revient sous sa bulle");

// ═══ DANS 💬 ═══
await p.locator(".sd-fil").click();
await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 1, 2000);
ok((await p.locator(".sd-feuille .sd-msg.moi .sd-tele-fil").count()) === 1 && (await p.locator(".sd-feuille .sd-msg.autre .sd-tele-fil").count()) === 0, "dans 💬 : un 📺 sur sa vidéo (pas sur les messages de Sam)");
await p.locator(".sd-feuille .sd-msg.moi .sd-tele-fil").click();
ok(await attendre(async () => (await tv())?.programme === "video" && (await p.locator(".sd-feuille.vu").count()) === 0, 4000), "📺 dans 💬 : 💬 se ferme, sa vidéo repasse à la télé");
await p.locator(".sd-recul").click();
await attendre(async () => (await tv())?.proche === false, 3000);

// ═══ 🍿 UN FILM, CE SOIR ═══
await p.locator(".sd-saisie input").fill("On regarde ça ? https://www.netflix.com/title/80100172");
await p.locator(".sd-envoyer").click();
ok(await attendre(async () => (await texte('.sd-mettre-tele[data-film]')) === "📺 À la télé ce soir ?", 6000), "un lien Netflix : « 📺 À la télé ce soir ? »");
await p.locator(".sd-mettre-tele[data-film]").click();
ok(await attendre(async () => (await texte(".sd-toast.vu")) === "🍿 Ce soir, à la télé !", 5000), "« 🍿 Ce soir, à la télé ! »");
ok(await attendre(async () => (await tv())?.programme === "film" && (await texte(".tv-ce-soir")) === "🍿 Ce soir", 4000), "l'affiche « Ce soir » à la télé");
ok((await texte('.tv-bouton[data-geste="ouvrir"]')) === "▶ Ouvrir sur Netflix", "« ▶ Ouvrir sur Netflix »");
const etagere = async () => (await (await fetch(`${BASE}/api/direct/etagere?avec=${SAM.cle}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json())?.etagere?.objets ?? [];
ok(await attendre(async () => (await etagere()).some((o) => o.titre === "Notre film" && o.rayon === "avenir"), 4000), "« Notre film » posé dans « À venir »");
await p.waitForTimeout(1200);
await p.screenshot({ path: `${D}/salon-tele-3-film.png` });
await p.locator(".sd-recul").click();
await attendre(async () => (await tv())?.proche === false, 3000);

// ═══ TOUCHER LA TÉLÉ DE LOIN ═══
await p.waitForTimeout(1600);
await p.locator(".sc-couche .tv").click();
ok(await attendre(async () => (await tv())?.proche === true && (await p.locator(".tv-bouton").count()) === 1, 3000), "toucher la télé de loin : la caméra s'en approche, son bouton (« ▶ Ouvrir sur Netflix »)");

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok((await p.evaluate(() => document.querySelector(".sd").scrollTop)) === 0, "le salon n'a pas glissé");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla télé dans la pièce du salon : tout est bon");
process.exit(echecs ? 1 : 0);
