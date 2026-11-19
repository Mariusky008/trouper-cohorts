// 🌙 LE SALON DU DUO : LA LUMIÈRE ET LA MÉTÉO (`docs/univers/salon-du-duo.md`, section 4.11 ; le lot S7) — l'adresse
// d'essai `/univers/salon?avec=<clé>` (avec `&moment=` pour essayer la lumière d'un moment), sur un iPhone, contre le faux
// Supabase et son faux Open-Meteo (jamais la vraie base, rien ne part chez Open-Meteo).
//
// LA ROUTE : `GET /api/direct/salon?meteo=1` — sans session, refusé ; chez Léa (sa ville), « Pluie fine · 9° » ; relue
// une seule fois par heure par ville (le faux Open-Meteo n'est pas redemandé, même s'il a changé). LA SCÈNE : la puce
// « 🌧️ Pluie fine · 9° » (un toucher : « Il pleut chez toi… ») ; la pluie dans les carreaux (la toile, découpée en
// polygone, qui se dessine) ; LA NUIT : le halo de la lampe, la lueur de la télé, les coins plus sombres, le ciel de nuit
// et ses étoiles ; LE SOLEIL, de jour : trois rayons, la flaque au sol, la poussière ; L'ORAGE : l'éclair ; LA NEIGE.
// Ni débordement, ni erreur, ni le mot « exemple ».
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
const qui = (n, prenom) => ({ id: `5c5c5c5c-0000-4000-8000-0000000fa0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-lumiere-nav-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const PAIRE = [LEA.id, SAM.id].sort().join("_");
const maintenant = new Date().toISOString();
// (Léa dans une ville à elle, le temps d'un essai : la météo se garde une heure par ville)
const VILLE = `essai-meteo-${Date.now().toString(36)}`;
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: x === LEA ? VILLE : "dax" })));
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
// (ses carreaux — la fenêtre de l'image —, une lampe, la télé)
const FENETRE = [[0.61, 0.135], [0.895, 0.135], [0.895, 0.295], [0.61, 0.295]];
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09], fenetreCoins: FENETRE, lampes: [[0.06, 0.38, 0.06, 0.14]], tele: [0.12, 0.2, 0.3, 0.12] } });
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
const ouvrir = async (moment) => {
  await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}${moment ? `&moment=${moment}` : ""}`, { waitUntil: "domcontentloaded" });
  // (en développement, le bouton de Next se pose sur la saisie : on le cache ; il n'existe pas en production)
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
};

const meteoDe = async (q) => {
  const r = await fetch(`${BASE}/api/direct/salon?meteo=1`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const FAUX = F.replace("/rest/v1", "");
const regler = (x) => fetch(`${FAUX}/open-meteo/regler`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const demandes = async () => (await (await fetch(`${FAUX}/__meteo`)).json()).temps;
/** La météo gardée pour sa ville (comme si Open-Meteo venait de la donner) ; le téléphone oublie celle qu'il gardait (dix minutes). */
const garder = async (meteo) => {
  await json(`meteo/${VILLE}.json`, { le: new Date().toISOString(), meteo });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.clearBrowserCache");
  await cdp.detach();
};
/** La toile de la fenêtre a-t-elle quelque chose de dessiné ? */
const dessinee = () =>
  p.evaluate(() => {
    const c = document.querySelector("canvas.sc-meteo");
    const g = c?.getContext("2d");
    if (!c || !g || !c.width || !c.height) return 0;
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n;
  });

// ═══ LA ROUTE ═══
await regler({ code: 53, t: 9.4, jour: 1 });
ok((await meteoDe(null)).statut === 403, "sans session : refusé");
const m1 = await meteoDe(LEA);
ok(m1.statut === 200 && m1.meteo?.cle === "pluie" && m1.meteo.nom === "Pluie fine" && m1.meteo.t === 9 && m1.meteo.emoji === "🌧️" && m1.meteo.fine === true, `chez Léa : « ${m1.meteo?.emoji} ${m1.meteo?.nom} · ${m1.meteo?.t}° »`);
const n1 = await demandes();
await regler({ code: 71, t: -1, jour: 1 });
const m2 = await meteoDe(LEA);
ok(m2.meteo?.cle === "pluie" && (await demandes()) === n1, "redemandée : la même, Open-Meteo n'est pas rappelé (une heure par ville)");
ok((await meteoDe(SAM)).meteo?.cle === "neige", "chez Sam (une autre ville) : son temps à lui");

// ═══ LA PLUIE, DE JOUR ═══
await ouvrir("matin");
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")) === "Coucou !", 15000), "le salon est ouvert");
ok(await attendre(async () => (await texte('.sd-meteo[data-meteo="pluie"]')) === "🌧️ Pluie fine · 9°", 8000), `la puce : « ${await texte(".sd-meteo")} »`);
ok(await attendre(async () => (await p.locator('canvas.sc-meteo[data-meteo="pluie"]').count()) === 1, 3000), "la pluie, à la fenêtre");
const clip = await p.locator("canvas.sc-meteo").evaluate((c) => getComputedStyle(c).clipPath);
ok(/polygon/.test(clip), "… dans les carreaux seulement (la toile découpée en polygone)");
ok(await attendre(async () => (await dessinee()) > 20, 3000), "… elle tombe (la toile se dessine)");
ok((await p.locator('.sc-ciel[data-ciel="gris"]').count()) === 1 && (await p.locator(".sc-halo, .sc-rai").count()) === 0, "un ciel gris derrière la vitre ; ni lampes allumées ni rayons de soleil");
await p.locator(".sd-meteo").click();
ok(await attendre(async () => /Il pleut chez toi/.test(await p.locator("body").innerText()), 3000), "un toucher sur la puce : « Il pleut chez toi… »");
await p.waitForTimeout(500);
await p.screenshot({ path: `${D}/salon-lumiere-1-pluie.png` });

// ═══ LA NUIT ═══
await ouvrir("nuit");
ok(await attendre(async () => (await p.locator('.sc-halo[data-lampe="0"]').count()) === 1, 15000), "la nuit : la lampe éclaire (son halo)");
ok((await p.locator(".sc-lueur-tele").count()) === 1 && (await p.locator(".sc-vignette").count()) === 1, "… la lueur de la télé, les coins plus sombres");
ok((await p.locator('.sc-ciel[data-ciel="nuit"]').count()) === 1, "dehors, le ciel de nuit");
ok(await attendre(async () => (await dessinee()) > 20, 4000), "… la lune, les étoiles, la pluie (la toile se dessine)");
await p.waitForTimeout(800);
await p.screenshot({ path: `${D}/salon-lumiere-2-nuit.png` });

// ═══ LE SOLEIL, DE JOUR ═══
await garder({ cle: "soleil", nom: "Grand soleil", emoji: "☀️", t: 14, jour: true });
await ouvrir("soir");
ok(await attendre(async () => (await texte('.sd-meteo[data-meteo="soleil"]')) === "☀️ Grand soleil · 14°", 15000), "la puce : « ☀️ Grand soleil · 14° »");
ok(await attendre(async () => (await p.locator(".sc-rai").count()) === 3 && (await p.locator(".sc-flaque").count()) === 1 && (await p.locator("canvas.sc-poussiere").count()) === 1, 3000), "trois rayons entrent par la fenêtre, une flaque de lumière au sol, la poussière qui danse");
await p.waitForTimeout(800);
await p.screenshot({ path: `${D}/salon-lumiere-3-soleil.png` });

// ═══ L'ORAGE ═══
await garder({ cle: "orage", nom: "Orage", emoji: "⛈️", t: 12, jour: true });
await ouvrir("matin");
ok(await attendre(async () => (await p.locator('canvas.sc-meteo[data-meteo="orage"]').count()) === 1, 15000), "l'orage, à la fenêtre");
ok(await attendre(() => p.evaluate(() => (document.querySelector(".sc-eclair")?.getAnimations().length ?? 0) > 0), 9000), "… un éclair illumine la pièce");

// ═══ LA NEIGE ═══
await garder({ cle: "neige", nom: "Neige", emoji: "❄️", t: -1, jour: true });
await ouvrir("matin");
ok(await attendre(async () => (await texte('.sd-meteo[data-meteo="neige"]')) === "❄️ Neige · -1°", 15000), "la neige : « ❄️ Neige · -1° »");
ok(await attendre(async () => (await dessinee()) > 20, 4000) && (await p.locator('.sc-ciel[data-ciel="neige"]').count()) === 1, "les flocons tombent derrière la vitre");
await p.waitForTimeout(600);
await p.screenshot({ path: `${D}/salon-lumiere-4-neige.png` });

// ═══ LA PAGE ═══
const page = await p.evaluate(() => ({ deborde: document.documentElement.scrollWidth > window.innerWidth + 1, mot: /exemple/i.test(document.body.innerText) }));
ok(!page.deborde, "aucun débordement");
ok(!page.mot, "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
