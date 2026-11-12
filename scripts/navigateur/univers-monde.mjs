// 🏡 SON UNIVERS (« Univers », lot 4) — l'adresse d'essai `/univers/monde`, sur un iPhone, contre le faux Supabase et
// son faux moteur d'image (jamais la vraie base, jamais OpenAI).
//
// Un visiteur sans session d'administrateur est renvoyé. Le propriétaire a sa figurine et la fiche de son univers :
// « Ton univers est prêt à être créé ✨ », « Créer mon univers » ; Pablito construit ; la découverte : la brume se lève,
// son décor, sa figurine assise à sa place ; « 🪑 Ton fauteuil a pris les couleurs de ton monde » (lot 4b) : avant,
// après, « Il me plaît ! » ; « L'image à partager » ; « 🔑 Les clés de ton univers » : « Tu m'as dit : « … » » ; une
// retouche avec une idée toute prête : la version 2, « Revenir à la version d'avant ». « MON UNIVERS », L'ACCUEIL
// (`/univers`, lot 4b) : son univers, le menu de demain ; Sam, sans figurine, y est mené à sa figurine. 🎵 La musique
// d'ambiance, lancée par « Créer mon univers », se coupe d'un toucher ; sa figurine est grande chez elle (« je suis
// tout petit », le propriétaire). Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import { BASE, D, F, lancer } from "./commun.mjs";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const LEA = { id: "abababab-0000-4000-8000-000000000901", jeton: "jeton-lea-univers-nav-000001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);
const maintenant = new Date().toISOString();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const P1 = `${LEA.id}/perso/v1`;
for (const n of ["assise", "assise_parle", "debout"]) await deposer(`${P1}/${n}.png`, PNG, "image/png");
const perso = {
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  references: { assise: { chemin: `${P1}/assise.png` }, assise_parle: { chemin: `${P1}/assise_parle.png` }, debout: { chemin: `${P1}/debout.png` } },
  historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
};
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [
    { id: "e1", quoi: "un établi couvert d'outils", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true },
    { id: "e2", quoi: "un petit phare au loin", pourquoi: "garder le cap", source: "interpretation", valide: true },
  ],
  regles: [],
  inconnus: [],
  scene: { sol: 0.78, places: [{ id: "hote", x: 0.36, y: 0.8, echelle: 1 }, { id: "invite", x: 0.66, y: 0.82, echelle: 0.96 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: {},
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${LEA.id}/monde/v1/fiche.json`, monde);
await json(`${LEA.id}/monde/fiche.json`, monde);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const anonyme = await (await b.newContext()).newPage();
await anonyme.goto(`${BASE}/univers/monde`, { waitUntil: "domcontentloaded" });
ok(!new URL(anonyme.url()).pathname.startsWith("/univers/monde"), `l'adresse d'essai renvoie qui n'est pas administrateur (${new URL(anonyme.url()).pathname})`);

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async () => !/exemple/i.test(await p.evaluate(() => document.body.innerText));

// ═══ À CRÉER ═══
await p.goto(`${BASE}/univers/monde`, { waitUntil: "networkidle" });
await p.waitForSelector(".um-carte .um-bouton", { timeout: 60000 }).catch(() => null);
ok((await texte(".um-titre")).includes("Ton univers est prêt à être créé") && (await texte(".um-texte")).startsWith("Je t'imagine"), "« Ton univers est prêt à être créé ✨ », ce que Pablito a imaginé");
await p.screenshot({ path: `${D}/univers-monde-1-a-creer.png` });
await p.locator(".um-carte .um-bouton").click();
const chantier = await p.waitForSelector('[aria-label="Pablito construit ton univers"]', { timeout: 6000 }).then(() => true).catch(() => false);
if (chantier) {
  ok((await texte(".um-etapes")).includes("Je refais ton fauteuil à tes couleurs"), "le chantier : son fauteuil refait à ses couleurs, une étape");
  await p.screenshot({ path: `${D}/univers-monde-2-chantier.png` });
}

// ═══ LA DÉCOUVERTE ═══
await p.waitForSelector(".um-decouverte .um-decor", { timeout: 60000 }).catch(() => null);
ok((await p.locator('.um-musique[aria-pressed="true"]').count()) === 1, "🎵 « Créer mon univers » a lancé la musique d'ambiance");
const brume = await p.waitForSelector(".um-brume", { timeout: 3000 }).then(() => true).catch(() => false);
ok((await p.locator(".um-decouverte .um-decor").count()) === 1 && (await p.locator(".um-place .um-figurine").count()) === 1, `la découverte : son décor, sa figurine assise à sa place${chantier ? " (après le chantier)" : ""}`);
ok(brume, "la première fois, la brume se lève");
await p.waitForSelector(".um-brume", { state: "detached", timeout: 6000 }).catch(() => null);
await p.waitForSelector(".um-fauteuil", { timeout: 6000 }).catch(() => null);
ok((await texte(".um-fauteuil")).includes("Ton fauteuil a pris les couleurs de ton monde") && (await p.locator(".um-fauteuil img").count()) === 2, "« 🪑 Ton fauteuil a pris les couleurs de ton monde » : avant, après");
await p.screenshot({ path: `${D}/univers-monde-3-decouverte.png` });
const proportion = await p.evaluate(() => {
  const place = document.querySelector(".um-place")?.getBoundingClientRect();
  const scene = document.querySelector(".um-scene")?.getBoundingClientRect();
  return place && scene ? place.height / scene.height : 0;
});
ok(proportion >= 0.42 && proportion <= 0.6, `sa figurine est grande chez elle, au premier plan (${Math.round(proportion * 100)} % de la scène)`);
await p.locator(".um-fauteuil .um-lien", { hasText: "Il me plaît" }).click();
ok((await p.locator(".um-fauteuil").count()) === 0, "« Il me plaît ! » : l'annonce se range");
await p.locator(".um-musique").click();
ok((await p.locator('.um-musique[aria-pressed="false"]').innerText()) === "🔇", "la musique se coupe d'un toucher");
await p.locator(".um-onglets button", { hasText: "L’image à partager" }).click();
ok((await p.locator(".um-place").count()) === 0 && (await p.locator(".um-gestes .um-bouton", { hasText: "Partager mon univers" }).count()) === 1, "« L'image à partager » : sa figurine chez elle, « 📤 Partager mon univers »");
await p.locator(".um-onglets button", { hasText: "Chez moi" }).click();
await p.locator(".um-bouton", { hasText: "Les clés de ton univers" }).click();
ok((await p.locator(".um-liste li").count()) === 2, "« 🔑 Les clés de ton univers » : ses éléments");
await p.locator(".um-liste button", { hasText: "un établi" }).click();
ok((await texte(".um-cle p")) === "Tu m’as dit : « je bricole tous les dimanches »", "un objet touché : pourquoi il est là, avec ses propres mots");
await p.locator(".um-liste button", { hasText: "phare" }).click();
ok((await texte(".um-cle p")).startsWith("J’ai imaginé :"), "une interprétation, montrée comme telle");
await p.screenshot({ path: `${D}/univers-monde-4-cles.png`, fullPage: true });

// ═══ UNE RETOUCHE ═══
await p.locator(".um-bouton", { hasText: "Retoucher mon univers" }).click();
await p.locator(".um-idees button", { hasText: "Davantage de nature" }).click();
await p.locator(".um-retouche .um-bouton").click();
await p.waitForFunction(() => document.querySelector(".um-decouverte") && [...document.querySelectorAll(".um-lien")].some((x) => x.textContent?.includes("version d’avant")), null, { timeout: 60000 }).catch(() => null);
ok((await p.locator(".um-lien", { hasText: "Revenir à la version d’avant" }).count()) === 1 && (await texte(".um-decouverte .um-petit")).includes("Encore 2 retouches"), "une retouche avec une idée toute prête : la version 2 ; « Revenir à la version d'avant »");
ok((await debordement()) <= 0 && (await sansMotInterdit()), "rien ne déborde, sans le mot interdit");
ok((await p.locator(".um-fauteuil").count()) === 0, "après la retouche, son fauteuil n'est pas annoncé de nouveau");

// ═══ « MON UNIVERS », L'ACCUEIL ═══
const versAccueil = p.locator("a.um-lien", { hasText: "Mon univers" });
ok((await versAccueil.getAttribute("href")) === "/univers", "de son univers, le chemin vers l'accueil de demain");
await p.goto(`${BASE}/univers`, { waitUntil: "networkidle" });
await p.waitForSelector(".um-decouverte .um-decor", { timeout: 30000 }).catch(() => null);
const menu = await p.locator(".um-menu a").allInnerTexts();
ok(
  (await texte(".um-entete")) === "Mon univers" && (await p.locator(".um-place .um-figurine").count()) === 1 && menu.map((m) => m.replace(/\s+/g, " ").trim()).join("|") === "🔥 Découvrir|📍 Autour|✏️ Créer|👯 Proches|🏡 Mon univers",
  `l'accueil : « Mon univers », sa figurine chez elle, le menu de demain (${menu.length})`,
);
ok((await p.locator('.um-menu a[aria-current="page"]').innerText()).includes("Mon univers") && (await p.locator('.um-menu a', { hasText: "Créer" }).getAttribute("href")) === "/collection#figurine", "« Mon univers » est l'onglet ouvert ; les autres mènent à l'appli d'aujourd'hui");
ok((await debordement()) <= 0 && (await sansMotInterdit()), "l'accueil : rien ne déborde, sans le mot interdit");
await p.screenshot({ path: `${D}/univers-monde-5-accueil.png` });

// ═══ SAM, SANS FIGURINE : L'ACCUEIL LE MÈNE À SA FIGURINE ═══
const SAM = { id: "abababab-0000-4000-8000-000000000902", jeton: "jeton-sam-univers-nav-000001" };
await semer("human_habitants", [{ id: SAM.id, device_token: SAM.jeton, prenom: "Sam", ville_slug: "dax" }]);
const ctxSam = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctxSam.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: SAM.jeton, url: BASE },
]);
const ps = await ctxSam.newPage();
ps.on("pageerror", (e) => erreurs.push(String(e)));
await ps.goto(`${BASE}/univers`, { waitUntil: "networkidle" });
await ps.waitForSelector(".um-carte .um-bouton", { timeout: 30000 }).catch(() => null);
ok(
  (await ps.locator(".um-titre").first().innerText().catch(() => "")).includes("Ton univers commence par toi") && (await ps.locator(".um-carte a.um-bouton").getAttribute("href")) === "/univers/figurine",
  "Sam, sans figurine : « Ton univers commence par toi », « Créer ma figurine »",
);

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nson univers tient ✓");
process.exit(echecs ? 1 : 0);
