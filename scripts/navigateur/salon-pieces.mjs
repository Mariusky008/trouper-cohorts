// 🚪 LA PIÈCE DU DUO, 🔥 LA FLAMME, 📚 📅 L'EN-TÊTE, L'OMBRE ET LA TEINTE (`docs/univers/salon-du-duo.md`, sections 4.12 et
// 4.13 ; le lot S2, troisième partie) — l'adresse d'essai `/univers/salon?avec=<clé>`, sur deux iPhone (Léa et Sam), contre
// le faux Supabase (jamais la vraie base).
//
// Léa ouvre : « Où vous installez-vous ? », la terrasse (sa maison) d'abord ; 📚 2, 📅 « Ciné · dans 3 jours », 🔥 1 ;
// les deux ombres au sol, la teinte du moment. Elle choisit le salon : on y est en moins de 300 ms. Sam n'est pas là :
// 🚪 la terrasse, tout de suite. Sam ouvre à son tour : il est là ; Léa l'invite dans la cuisine — chez Sam, « Venir » /
// « Pas maintenant » ; il refuse : Léa le sait ; elle réinvite, il vient : la cuisine chez les deux, « ✨ Sam vous rejoint ».
// Ils s'écrivent : 🔥 2 jours de suite. Ni débordement, ni erreur, ni le mot « exemple ».
import crypto from "node:crypto";
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";
const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => (await fetch(`${STOCK}/figurines-clients/${chemin}`)).json().catch(() => null);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f80${String(n).padStart(2, "0")}`, jeton: `jeton-salon-pieces-nav-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const MAX = qui(3, "Max");
const GENS = [LEA, SAM, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);
const PAIRE = [LEA.id, SAM.id].sort().join("_");
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${MAX.id}/proches.json`, { ids: [LEA.id] });
await json(`${LEA.id}/majeur.json`, { le: maintenant, age: 30, adulte: true });
// (la maison de Léa : la terrasse)
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "terrasse", le: maintenant });
// (trois pièces prêtes, en hauteur ; leurs places relevées)
const piece = (fond) =>
  sharp({ create: { width: 1024, height: 1536, channels: 3, background: fond } })
    .png()
    .toBuffer();
for (const [p, fond] of [["terrasse", { r: 90, g: 160, b: 120 }], ["salon", { r: 120, g: 90, b: 140 }], ["cuisine", { r: 220, g: 190, b: 90 }]]) {
  await deposer(`pieces-duo/${p}/decor.png`, await piece(fond), "image/png");
  for (const m of ["matin", "soir", "nuit"]) await deposer(`pieces-duo/${p}/lumiere-${m}.png`, await piece(fond), "image/png");
  await json(`pieces-duo/${p}/releve.json`, { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.7, hauteur: 0.3 }, { x: 0.7, y: 0.7, hauteur: 0.3 }] } });
}
// (leurs figurines du nouveau style, et leurs calques)
const assise = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="330" rx="200" ry="190" fill="#e0a070"/><rect x="355" y="500" width="90" height="70" fill="#e0a070"/><rect x="160" y="550" width="480" height="560" rx="50" fill="#5a3a2a"/></svg>`))
  .png()
  .toBuffer();
const appel = (q, chemin, corps) =>
  fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) } : { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} }).then(async (r) => ({ statut: r.status, corps: await r.json().catch(() => null) }));
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await appel(x, "/api/direct/salon", { action: "calques" });
}
// (🔥 hier, ils se sont écrit tous les deux ; avant-hier, Léa seule — les noms des messages suffisent)
const jour = 86_400_000;
const nomMessage = (ts, h, id) => `${String(ts).padStart(13, "0")}-${qui8(h)}-${id}.json`;
for (const [ts, h, id] of [[Date.now() - 2 * jour, LEA.id, "avanthier1"], [Date.now() - jour, LEA.id, "hierlea001"], [Date.now() - jour + 60_000, SAM.id, "hiersam001"]]) {
  await json(`fils/${PAIRE}/m/${nomMessage(ts, h, id)}`, { id, de: h, le: new Date(ts).toISOString(), genre: "ecrit", texte: "Coucou" });
}

// (📚 leur étagère : deux souvenirs, dont un ciné dans trois jours)
const dans3 = new Date(Date.now() + 3 * jour).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
await json(`fils/${PAIRE}/etagere.json`, {
  v: 1,
  objets: [
    { id: "cine", genre: "date", emoji: "🎬", titre: "Ciné", concerne: "deux", citation: "On va au ciné jeudi ?", de8: qui8(SAM.id), message: "msgcine00001", le: maintenant, quand: dans3, etat: "actif" },
    { id: "resto", genre: "promesse", emoji: "🍝", titre: "Le resto italien", concerne: "deux", citation: "On se fait ce resto italien !", de8: qui8(LEA.id), message: "msgresto0001", le: maintenant, etat: "actif" },
  ],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(LEA.id)]: ["cine", "resto"], [qui8(SAM.id)]: ["cine", "resto"] },
});
const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date())) % 24;
const MOMENT = heure >= 7 && heure < 17 ? "matin" : heure >= 17 && heure < 21 ? "soir" : "nuit";

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const telephone = async (q) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([
    { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
    { name: "clikme_habitant", value: q.jeton, url: BASE },
  ]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  return p;
};
const attendre = async (p, f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const plaque = (p) => p.locator(".sd-scene .sc-plaque").getAttribute("src");
const pieceDuDuo = async () => (await lire(`fils/${PAIRE}/piece.json`))?.piece;

// ═══ LÉA OUVRE : « OÙ VOUS INSTALLEZ-VOUS ? » ═══
const lea = await telephone(LEA);
await lea.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator(".sd-choix.vu .sd-piece-carte").count()) === 3, 12000), "la première fois : « Où vous installez-vous ? », les trois pièces prêtes");
ok((await texte(lea, ".sd-choix h3")) === "Où vous installez-vous ?", "… son titre");
ok((await lea.locator(".sd-piece-carte").first().getAttribute("data-choisir")) === "terrasse" && /Ta pièce/.test(await texte(lea, ".sd-piece-carte >> nth=0")), "la terrasse d'abord (la maison de Léa), « ✓ Ta pièce »");
const plaques = Object.fromEntries(await lea.locator(".sd-piece-carte").evaluateAll((l) => l.map((b) => [b.dataset.choisir, b.querySelector("img").getAttribute("src")])));
ok((await plaque(lea)) === plaques.terrasse, "derrière, on est déjà sur la terrasse");
ok(/^📚 ?2$/.test(await texte(lea, "[data-souvenirs]")), `📚 leurs souvenirs : 2 (${await texte(lea, "[data-souvenirs]")})`);
ok(/^🎬 Ciné · dans 3 jours$/.test(await texte(lea, "[data-rdv]")), `📅 le prochain rendez-vous (${await texte(lea, "[data-rdv]")})`);
ok(/^🔥 ?1$/.test(await texte(lea, "[data-flamme]")), `🔥 1 jour (hier) (${await texte(lea, "[data-flamme]")})`);
ok((await lea.locator(".sc-ombre").count()) === 2, "une ombre au sol sous chaque figurine");
ok((await lea.locator(".sc-stage").getAttribute("data-moment")) === MOMENT, `la teinte du moment (${MOMENT})`);
await lea.screenshot({ path: `${D}/salon-pieces-1-ou.png` });

// ═══ LE SALON : TOUT DE SUITE ═══
const delai = await lea.evaluate(
  (src) =>
    new Promise((ok) => {
      const t0 = performance.now();
      document.querySelector('[data-choisir="salon"]').click();
      const voir = () => {
        if (document.querySelector(".sd-scene .sc-plaque")?.getAttribute("src") === src) ok(Math.round(performance.now() - t0));
        else if (performance.now() - t0 > 3000) ok(9999);
        else requestAnimationFrame(voir);
      };
      requestAnimationFrame(voir);
    }),
  plaques.salon,
);
ok(delai < 300, `le salon : on y est en moins de 300 ms (${delai} ms)`);
ok(await attendre(lea, async () => /Vous voilà · 🛋️ Le salon/.test(await texte(lea, ".sd-toast.vu"))), `« ✨ Vous voilà · 🛋️ Le salon »`);
ok(await attendre(lea, async () => (await pieceDuDuo()) === "salon"), "… le duo s'y installe (le serveur)");
ok(/Le salon/.test(await texte(lea, ".sd-porte")) && (await lea.locator(".sc-fig").count()) === 2, "🚪 dit la pièce ; les deux figurines y sont");

// ═══ SAM N'EST PAS LÀ : LA PIÈCE CHANGE TOUT DE SUITE ═══
await lea.locator(".sd-porte").click();
ok(await attendre(lea, async () => (await texte(lea, ".sd-choix.vu h3")) === "Changer de pièce"), "🚪 : « Changer de pièce »");
ok(/Vous êtes ici/.test(await texte(lea, '[data-choisir="salon"]')), "… le salon : « ✓ Vous êtes ici »");
await lea.locator('[data-choisir="terrasse"]').click();
ok(await attendre(lea, async () => (await plaque(lea)) === plaques.terrasse && (await pieceDuDuo()) === "terrasse"), `Sam n'est pas là : la terrasse, tout de suite (${(await plaque(lea)) === plaques.terrasse ? "à l'écran" : "pas à l'écran"} ; serveur ${await pieceDuDuo()} ; « ${await texte(lea, ".sd-toast")} » ; ${JSON.stringify(await lire(`${SAM.id}/la.json`))})`);

// ═══ SAM ARRIVE ; L'INVITATION ═══
const sam = await telephone(SAM);
await sam.goto(`${BASE}/univers/salon?avec=${LEA.cle}`, { waitUntil: "domcontentloaded" });
ok(await attendre(sam, async () => (await plaque(sam)) === plaques.terrasse, 12000), "Sam ouvre : la terrasse");
ok(await attendre(lea, async () => (await texte(lea, ".sd-qui span")) === "Là, maintenant", 13000), "chez Léa : Sam est là");
await lea.locator(".sd-porte").click();
// (👀 22 novembre 2026 : une invitation seulement s'il est dans la conversation — son pouls l'y note)
ok(await attendre(lea, async () => /Sam est avec toi : ce sera une invitation/.test(await texte(lea, ".sd-choix .sd-sous")), 8000), "« Sam est avec toi : ce sera une invitation. »");
await lea.locator('[data-choisir="cuisine"]').click();
ok(await attendre(lea, async () => /Tu invites Sam · 🍳 La cuisine/.test(await texte(lea, ".sd-toast.vu"))), "« 🚪 Tu invites Sam · 🍳 La cuisine… »");
ok((await plaque(lea)) === plaques.terrasse && (await pieceDuDuo()) === "terrasse", "… on reste sur la terrasse en attendant");
ok(await attendre(sam, async () => (await sam.locator('.sd-invite[data-invitation="cuisine"]').count()) === 1, 5000), "chez Sam : « 🚪 Léa t'invite · 🍳 La cuisine »");
await sam.waitForTimeout(500);
const dedans = await sam.evaluate(() => {
  const c = document.querySelector(".sd-invite").getBoundingClientRect();
  const s = document.querySelector(".sd-scene").getBoundingClientRect();
  return c.left >= s.left && c.right <= s.right && c.top >= s.top;
});
ok(dedans, "… la carte tient dans la scène (rien de coupé)");
await sam.screenshot({ path: `${D}/salon-pieces-2-invitation.png` });
await sam.getByRole("button", { name: "Pas maintenant" }).click();
ok(await attendre(lea, async () => /Sam préfère rester ici/.test(await texte(lea, ".sd-toast.vu")), 5000), "il refuse : « Sam préfère rester ici pour l'instant »");
await lea.locator(".sd-porte").click();
await lea.locator('[data-choisir="cuisine"]').click();
ok(await attendre(sam, async () => (await sam.locator('.sd-invite[data-invitation="cuisine"]').count()) === 1, 5000), "elle réinvite : l'invitation revient chez Sam");
await sam.getByRole("button", { name: "Venir", exact: true }).click();
ok(await attendre(sam, async () => (await plaque(sam)) === plaques.cuisine), "« Venir » : Sam est dans la cuisine");
ok(await attendre(lea, async () => (await plaque(lea)) === plaques.cuisine, 5000), "Léa aussi");
ok(await attendre(lea, async () => /Sam vous rejoint · 🍳 La cuisine/.test(await texte(lea, ".sd-toast.vu")), 3000), "« ✨ Sam vous rejoint · 🍳 La cuisine »");
await lea.screenshot({ path: `${D}/salon-pieces-3-cuisine.png` });

// ═══ 🔥 ILS S'ÉCRIVENT ═══
await lea.locator(".sd-saisie input").fill("On y est !");
await lea.locator(".sd-envoyer").click();
await sam.locator(".sd-saisie input").fill("Trop bien");
await sam.locator(".sd-envoyer").click();
ok(await attendre(lea, async () => /^🔥 ?2$/.test(await texte(lea, "[data-flamme]")), 6000), `🔥 ils se sont écrit aujourd'hui : 2 jours de suite (${await texte(lea, "[data-flamme]")})`);
ok(await attendre(sam, async () => /^🔥 ?2$/.test(await texte(sam, "[data-flamme]")), 6000), "… chez Sam aussi");

for (const [p, n] of [[lea, "Léa"], [sam, "Sam"]]) {
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, `${n} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${n} : jamais le mot interdit`);
}
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla pièce du duo : tout est bon");
process.exit(echecs ? 1 : 0);
