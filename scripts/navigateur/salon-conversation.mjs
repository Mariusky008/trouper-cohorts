// 💬 LE SALON DU DUO, LA CONVERSATION (`docs/univers/salon-du-duo.md`, sections 3, 4.2 et 4.3 ; le lot S2, première
// partie) — l'adresse d'essai `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Sam a écrit deux messages à Léa (l'administrateur, sur ce téléphone). Léa ouvre leur salon : le prénom de Sam en haut,
// les deux figurines posées, la bulle de Sam au-dessus de sa tête (son dernier message seul), dans la scène ; « 💬
// Messagerie » et ses 2 non-lus. Léa écrit « haha oui je viens 😂 » : sa bulle en moins de 100 ms, avant la réponse du
// serveur ; la tête de Sam rit ; le message part pour de bon. 💬 : la feuille monte (en moins de 100 ms), « Aujourd’hui »,
// les trois messages dans l'ordre, celui de Léa à droite ; les non-lus remis à zéro ; le voile la ferme. Un envoi qui
// échoue : la bulle part puis s'en va, le texte revient dans la saisie, « Pas envoyé ». Ni débordement, ni erreur, ni le
// mot « exemple ».
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
const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f40${String(n).padStart(2, "0")}`, jeton: `jeton-salon-conv-nav-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
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
// (le salon : une pièce en hauteur, ses places relevées)
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="620" y="200" width="300" height="260" fill="#bfe3ff"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }] } });
// (leurs figurines du nouveau style, et leurs calques déjà faits)
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
// (Sam a écrit deux messages, et il est là)
for (const t of ["J’ai trouvé le resto 🍝", "Coucou Léa ! Tu viens ce soir ?"]) ok((await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: t })).status === 200, `Sam écrit « ${t} »`);
await poster(SAM, { action: "la" });

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
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 5000 }).catch(() => "")).replace(/\s+/g, " ").trim();

// ═══ L'ARRIVÉE ═══
await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "networkidle" });
ok(await attendre(async () => (await p.locator('.sd-scene[data-pret][data-calques="poses"] .sc-fig').count()) === 2), "le salon : la pièce et les deux figurines posées");
ok((await texte(".sd-qui b")) === "Sam", "en haut : Sam");
const bulleSam = p.locator(".sd-bulle.autre");
// (l'arrivée rejoue d'abord ses deux messages : on attend qu'elle finisse — lot S2, deuxième partie)
ok(await attendre(async () => (await p.locator(".sd-bulle[data-rejoue]").count()) === 0 && (await texte(".sd-bulle.autre")) === "Coucou Léa ! Tu viens ce soir ?", 12000), `la bulle de Sam : son dernier message, seul (${await texte(".sd-bulle.autre")})`);
ok((await p.locator(".sd-bulle").count()) === 1, "… et pas de bulle pour Léa (elle n’a rien écrit)");
const place = await p.evaluate(() => {
  const s = document.querySelector(".sd-scene").getBoundingClientRect();
  const bu = document.querySelector(".sd-bulle.autre").getBoundingClientRect();
  const t = document.querySelector('.sc-tete[data-tete="autre"]').getBoundingClientRect();
  return { dedans: bu.left >= s.left - 1 && bu.right <= s.right + 1 && bu.top >= s.top - 1 && bu.bottom <= s.bottom + 1, aDroite: bu.left + bu.width / 2 > s.left + s.width / 2, auDessus: bu.bottom <= t.top + t.height * 0.35 };
});
ok(place.dedans && place.aDroite && place.auDessus, `… au-dessus de sa tête, à droite, jamais coupée (${JSON.stringify(place)})`);
ok((await texte(".sd-fil .sd-badge")) === "2", `💬 Messagerie : 2 non-lus (${await texte(".sd-fil .sd-badge")})`);
await bulleSam.waitFor();
await p.screenshot({ path: `${D}/salon-conversation-1-arrivee.png` });

// ═══ ÉCRIRE ═══
const tete = () => p.evaluate(() => getComputedStyle(document.querySelector('.sc-tete[data-tete="autre"]')).transform);
await p.locator(".sd-saisie input").fill("haha oui je viens 😂");
const delai = await p.evaluate(
  () =>
    new Promise((ok) => {
      const t0 = performance.now();
      document.querySelector(".sd-envoyer").click();
      const voir = () => {
        const b = document.querySelector(".sd-bulle.moi");
        if (b && b.textContent === "haha oui je viens 😂") ok(Math.round(performance.now() - t0));
        else if (performance.now() - t0 > 2000) ok(9999);
        else requestAnimationFrame(voir);
      };
      requestAnimationFrame(voir);
    }),
);
ok(delai < 100, `➤ : la bulle de Léa en moins de 100 ms, avant la réponse du serveur (${delai} ms)`);
ok((await p.locator(".sd-saisie input").inputValue()) === "", "la saisie se vide");
const t0 = await tete();
let bouge = false;
for (let i = 0; i < 15 && !bouge; i++) {
  await p.waitForTimeout(100);
  bouge = (await tete()) !== t0;
}
ok(bouge, "la tête de Sam réagit (« haha » : elle rit)");
ok(await attendre(async () => !(await p.locator(".sd-bulle.moi").getAttribute("data-bulle"))?.startsWith("envoi-")), "le message part pour de bon (son vrai numéro)");
const fil = await (await fetch(`${BASE}/api/direct/proches?fil=${SAM.cle}`, { headers: { cookie: `clikme_habitant=${LEA.jeton}` } })).json();
ok(fil?.fil?.messages?.at(-1)?.texte === "haha oui je viens 😂" && fil.fil.messages.at(-1).moi === true, "… il est dans leur conversation");
ok((await texte(".sd-bulle.autre")) === "Coucou Léa ! Tu viens ce soir ?", "la bulle de Sam reste");
await p.screenshot({ path: `${D}/salon-conversation-2-ecrit.png` });

// ═══ 💬 MESSAGERIE ═══
const ouverture = await p.evaluate(
  () =>
    new Promise((ok) => {
      const t0 = performance.now();
      document.querySelector(".sd-fil").click();
      const voir = () => {
        const f = document.querySelector(".sd-feuille");
        if (f.classList.contains("vu") && f.querySelectorAll(".sd-msg").length) ok(Math.round(performance.now() - t0));
        else if (performance.now() - t0 > 2000) ok(9999);
        else requestAnimationFrame(voir);
      };
      requestAnimationFrame(voir);
    }),
);
ok(ouverture < 100, `💬 : la feuille s’ouvre en moins de 100 ms, déjà construite (${ouverture} ms)`);
await p.waitForTimeout(450);
const lignes = await p.evaluate(() => [...document.querySelectorAll(".sd-feuille .sd-msg")].map((m) => ({ moi: m.classList.contains("moi"), t: m.querySelector(".sd-texte")?.textContent, qui: m.querySelector("small")?.textContent })));
ok(
  lignes.length === 3 && lignes[0].t === "J’ai trouvé le resto 🍝" && lignes[1].t === "Coucou Léa ! Tu viens ce soir ?" && lignes[2].t === "haha oui je viens 😂" && lignes[2].moi && !lignes[0].moi,
  `les trois messages, dans l’ordre, le sien à droite (${JSON.stringify(lignes.map((l) => l.t))})`,
);
ok(/^Sam · \d+ h \d\d$/.test(lignes[0].qui ?? "") && /^Toi · /.test(lignes[2].qui ?? ""), `qui et quand, sous chacun (${lignes[0].qui} ; ${lignes[2].qui})`);
ok((await p.locator(".sd-jour").first().textContent()) === "Aujourd’hui", "« Aujourd’hui »");
ok((await p.locator(".sd-fil .sd-badge").count()) === 0, "les non-lus remis à zéro");
await p.screenshot({ path: `${D}/salon-conversation-3-messagerie.png` });
await p.mouse.click(195, 60);
ok(await attendre(async () => !(await p.locator(".sd-feuille").getAttribute("class")).includes("vu")), "le voile la ferme");

// ═══ UN ENVOI QUI ÉCHOUE ═══
// (le serveur répond après 600 ms, et refuse)
await p.route("**/api/direct/proches", async (r) => (r.request().method() === "POST" ? (await new Promise((ok) => setTimeout(ok, 600)), r.fulfill({ status: 503, contentType: "application/json", body: "{}" })) : r.continue()));
await p.locator(".sd-saisie input").fill("tu me rappelles ?");
await p.locator(".sd-envoyer").click();
ok(await attendre(async () => (await texte(".sd-bulle.moi")) === "tu me rappelles ?", 1000), "la bulle part tout de suite…");
ok(await attendre(async () => (await texte(".sd-bulle.moi")) === "haha oui je viens 😂"), "… puis s’en va : le serveur n’a pas pris le message");
ok((await p.locator(".sd-saisie input").inputValue()) === "tu me rappelles ?", "le texte revient dans la saisie");
ok(await attendre(async () => /Pas envoyé/.test(await texte(".sd-toast.vu"))), `« Pas envoyé » (${await texte(".sd-toast")})`);
await p.unroute("**/api/direct/proches");

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla conversation du salon : tout est bon");
process.exit(echecs ? 1 : 0);
