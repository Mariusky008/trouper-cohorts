// 🛋️ LE MOTEUR DU SALON DU DUO (`docs/univers/salon-du-duo.md`, section 11 ; lot S0) — l'adresse d'essai `/univers/salon`,
// sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Un visiteur sans session d'administrateur est renvoyé. L'administrateur : la pièce de l'essai du collage et ses deux
// figurines, chacune en deux calques (le corps, la tête) ; les têtes vivent seules (les ressorts) ; « Rire » les secoue ;
// les cœurs passent sur la toile des effets puis s'effacent ; un lettrage arrive et repart ; un bisou vole d'une figurine à
// l'autre et laisse sa marque ; la caméra va sur le duo (les ancres des bulles suivent) et revient sur la pièce ; un geste
// sans mise en scène le dit ; « Recommencer la scène » n'en laisse qu'une ; la page cachée, tout s'arrête. Avec
// « réduire les animations », les têtes ne bougent plus seules. Ni débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import { BASE, D, F, lancer } from "./commun.mjs";

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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000d05", jeton: "jeton-lea-salon-moteur-00001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);

// ─── Léa et une volontaire du lot 0 (deux figurines assises, détourées), le salon et ses places ; le duo choisi ───
const maintenant = new Date().toISOString();
const figurine = (couleur) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="768"><ellipse cx="256" cy="190" rx="190" ry="180" fill="${couleur}"/><circle cx="196" cy="190" r="22" fill="#222"/><circle cx="316" cy="190" r="22" fill="#222"/><rect x="146" y="350" width="220" height="250" rx="70" fill="${couleur}"/><rect x="150" y="560" width="70" height="200" rx="30" fill="#334"/><rect x="292" y="560" width="70" height="200" rx="30" fill="#334"/></svg>`,
    ),
  )
    .png()
    .toBuffer();
const piece = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="640" fill="#5b4a6e"/><rect y="640" width="1536" height="384" fill="#8a6a4a"/><rect x="380" y="560" width="780" height="260" rx="60" fill="#3c6e8a"/><rect x="980" y="80" width="420" height="300" fill="#bfe3ff"/></svg>`,
  ),
)
  .png()
  .toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, await figurine("#f0a070"), "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
const L0 = "essais-univers";
await json(`${L0}/personnes/vvvvvvvvvvv5.json`, { id: "vvvvvvvvvvv5", nom: "Volontaire 5", accordLe: maintenant, le: maintenant, traits: null });
await json(`${L0}/resultats/aimeeaimee05.json`, { id: "aimeeaimee05", personne: "vvvvvvvvvvv5", type: "figurine", variante: "sculptee", avis: "oui", etat: "fait", qualite: "high", taille: "1024x1536", le: maintenant, consigne: "…" });
await deposer(`${L0}/resultats/aimeeaimee05.png`, await figurine("#80b0f0"), "image/png");
await deposer("pieces-duo/salon/decor.png", piece, "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, ajuste: true, emplacements: { cadres: [], places: [{ x: 0.4, y: 0.82, hauteur: 0.3 }, { x: 0.6, y: 0.82, hauteur: 0.3 }] } });
await json("pieces-duo/collage/choix.json", { piece: "salon", a: "moi", b: "aimeeaimee05" });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const TELEPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true };
const b = await lancer();
const erreurs = [];

const anonyme = await (await b.newContext()).newPage();
await anonyme.goto(`${BASE}/univers/salon`, { waitUntil: "domcontentloaded" });
ok(!new URL(anonyme.url()).pathname.startsWith("/univers/salon"), `l'adresse d'essai renvoie qui n'est pas administrateur (${new URL(anonyme.url()).pathname})`);

const ouvrir = async (options = {}) => {
  const ctx = await b.newContext({ ...TELEPHONE, ...options });
  await ctx.addCookies([
    { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
    { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  ]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  await p.goto(`${BASE}/univers/salon`, { waitUntil: "networkidle" });
  await p.waitForSelector(".em-scene[data-pret] .sc-fig", { timeout: 30000 }).catch(() => null);
  return p;
};
const p = await ouvrir();
const attendre = async (f, ms = 5000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f()) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const bouton = (section, nom) => p.locator(`section[aria-label="${section}"] button`, { hasText: nom }).first();
/** L'angle de la tête (degrés, d'après sa transformation). */
const angle = (q, page = p) => page.evaluate((q) => Number(/rotate\((-?[\d.]+)deg\)/.exec(document.querySelector(`[data-tete="${q}"]`)?.style.transform ?? "")?.[1] ?? NaN), q);
const transformee = (sel, page = p) => page.evaluate((sel) => document.querySelector(sel)?.style.transform ?? "", sel);
/** Des pixels peints sur la toile des effets ? */
const toilePeinte = () =>
  p.evaluate(() => {
    const c = document.querySelector(".sc-fx");
    const d = c?.getContext("2d")?.getImageData(0, 0, c.width, c.height).data;
    if (!d) return false;
    for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 0) return true;
    return false;
  });

// ═══ LA SCÈNE ═══
ok((await p.locator(".sc").count()) === 1 && (await p.locator(".sc-fig").count()) === 2, "la scène : une pièce, deux figurines");
ok(
  await p.evaluate(() => [...document.querySelectorAll(".sc-fig")].every((f) => f.querySelectorAll(".sc-calque img").length === 2 && f.querySelector(".sc-tete .sc-calque img"))),
  "chaque figurine en deux calques : son corps, sa tête",
);
ok(
  await attendre(() => p.evaluate(() => [...document.querySelectorAll(".sc img")].every((i) => i.complete && i.naturalWidth > 0))),
  "la pièce et les calques sont chargés",
);
const boites = await p.evaluate(() => [...document.querySelectorAll(".sc-fig")].map((f) => f.getBoundingClientRect().toJSON()));
ok(boites[0].x < boites[1].x && boites.every((r) => r.width > 20 && r.height > 40 && r.x >= -1 && r.right <= 391), `moi à gauche, l'autre à droite, toutes deux dans l'écran (${boites.map((r) => `${Math.round(r.x)}→${Math.round(r.right)}`).join(", ")})`);
const a0 = await angle("moi");
await p.waitForTimeout(900);
ok(Number.isFinite(a0) && (await angle("moi")) !== a0, "les têtes vivent seules (leurs ressorts)");
ok(await attendre(async () => /images\/s/.test(await p.locator(".em-cadence").innerText())), `la cadence s'affiche (${await p.locator(".em-cadence").innerText()})`);

// ═══ LES RESSORTS ═══
/** Une seconde de la tête, image par image : ses allers-retours, et de combien elle a tourné. */
const secousses = (q) =>
  p.evaluate(
    (q) =>
      new Promise((ok) => {
        const el = document.querySelector(`[data-tete="${q}"]`);
        const vus = [];
        const fin = performance.now() + 1000;
        const image = (t) => {
          vus.push(Number(/rotate\((-?[\d.]+)deg\)/.exec(el.style.transform)?.[1] ?? 0));
          if (t < fin) requestAnimationFrame(image);
          else {
            let tours = 0;
            for (let i = 2; i < vus.length; i++) if ((vus[i] - vus[i - 1]) * (vus[i - 1] - vus[i - 2]) < 0) tours++;
            ok({ tours, ecart: Math.max(...vus) - Math.min(...vus) });
          }
        };
        requestAnimationFrame(image);
      }),
    q,
  );
const calme = await secousses("moi");
await bouton("La tête", "Rire").click();
const rit = await secousses("moi");
// (le rire de la maquette : une secousse rapide et petite, une impulsion de 46°/s toutes les 85 ms)
ok(rit.tours >= 8 && rit.tours > calme.tours * 3 && rit.ecart > 1.5, `« Rire » : la tête de moi se secoue (${rit.tours} allers-retours en une seconde, ${rit.ecart.toFixed(1)}° ; au calme : ${calme.tours})`);
await p.locator('.em-qui button[role="radio"]').nth(1).click();
ok((await p.locator('.em-qui button[aria-checked="true"]').innerText()).includes("L’autre"), "on choisit qui joue : l'autre");
await bouton("Le corps", "Bondir").click();
await p.waitForTimeout(120);
ok(/translate3d\([-\d.]+px, ?-[\d.]+px/.test(await transformee('.sc-fig[data-figurine="autre"]')), `« Bondir » : le corps de l'autre monte (${await transformee('.sc-fig[data-figurine="autre"]')})`);

// ═══ LES EFFETS ═══
await bouton("Les effets", "Cœurs").click();
ok(await attendre(toilePeinte, 1500), "« 💗 Cœurs » : ils passent sur la toile des effets");
await bouton("Les effets", "Lettrage").click();
ok(await attendre(async () => (await p.locator(".sc-lettrage").count()) === 1), "« 💥 Lettrage » : il arrive");
await p.waitForTimeout(500);
await p.screenshot({ path: `${D}/salon-moteur-1-effets.png` });
ok(await attendre(async () => !(await toilePeinte()), 4000), "les cœurs passés, la toile s'efface");
ok(await attendre(async () => (await p.locator(".sc-lettrage").count()) === 0, 3000), "… et le lettrage repart");
await p.locator('.em-qui button[role="radio"]').first().click();
await bouton("Les effets", "Un bisou qui vole").click();
ok(await attendre(async () => (await p.locator('[data-tete="autre"] .sc-marque').count()) === 1, 3000), "« 💋 Un bisou qui vole » : de moi à l'autre, sa marque sur la joue");
ok((await p.locator('[data-tete="autre"] .sc-rougeur').count()) === 2, "… et l'autre rougit");

// ═══ LA CAMÉRA ET LES ANCRES DES BULLES ═══
const ancres = () => p.evaluate(() => [...document.querySelectorAll(".em-ancre")].map((a) => a.getBoundingClientRect().toJSON()));
const avant = await ancres();
await bouton("La caméra", "Le duo").click();
await p.waitForTimeout(1700);
const cam = await transformee(".sc-camera");
const apres = await ancres();
const scene = await p.locator(".em-scene").boundingBox();
ok(/scale\(1\.05\)/.test(cam), `« 👥 Le duo » : la caméra s'approche (${cam})`);
ok(
  apres.length === 2 && apres[0].x < apres[1].x && apres.every((r) => r.y >= scene.y && r.y <= scene.y + scene.height && r.x >= 0 && r.x <= 390) && (apres[0].x !== avant[0].x || apres[0].y !== avant[0].y),
  `les ancres des bulles suivent, au-dessus de chaque tête (dans la scène : ${apres.map((r) => `${Math.round(r.x)},${Math.round(r.y - scene.y)}`).join(" ; ")})`,
);
await p.screenshot({ path: `${D}/salon-moteur-2-duo.png` });
await bouton("La caméra", "La pièce").click();
ok((await transformee(".sc-camera")) === "none", "« 🏠 La pièce » : la caméra revient");

// ═══ LES GESTES, LA SCÈNE REFAITE, LA PAGE CACHÉE ═══
ok((await p.locator('section[aria-label="Les gestes"] button').count()) === 20, "les gestes : 5 attentions, 8 panneaux, 7 à faire ensemble");
await p.locator('[data-geste="bisou"]').click();
ok(/n’a pas encore sa mise en scène/.test(await p.locator(".em-note").innerText()), "un geste sans mise en scène le dit");
await p.locator(".em-recommencer").click();
await p.waitForTimeout(400);
ok((await p.locator(".sc").count()) === 1 && (await p.locator(".sc-fig").count()) === 2, "« ↻ Recommencer la scène » : une seule scène, refaite");
await p.evaluate(() => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
  document.dispatchEvent(new Event("visibilitychange"));
});
await p.waitForTimeout(150);
const figee = await transformee('[data-tete="moi"]');
await p.waitForTimeout(600);
ok((await transformee('[data-tete="moi"]')) === figee, "la page cachée : tout s'arrête");
await p.evaluate(() => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
  document.dispatchEvent(new Event("visibilitychange"));
});
await p.waitForTimeout(600);
ok((await transformee('[data-tete="moi"]')) !== figee, "… et repart quand elle revient");

// (la durée des images pendant un moment chargé : une mesure, pas un seuil — les essais de vitesse viennent avec S0b)
const pire = await p.evaluate(
  () =>
    new Promise((ok) => {
      let pire = 0;
      let avant = performance.now();
      const fin = avant + 1500;
      for (const n of ["💗 Cœurs", "🎉 Jaillir", "✨ Étincelles"]) [...document.querySelectorAll("button")].find((b) => b.textContent.includes(n))?.click();
      [...document.querySelectorAll("button")].find((b) => b.textContent === "Danser")?.click();
      const image = (t) => {
        pire = Math.max(pire, t - avant);
        avant = t;
        if (t < fin) requestAnimationFrame(image);
        else ok(Math.round(pire));
      };
      requestAnimationFrame(image);
    }),
);
console.log(`  (la plus longue image pendant cœurs, confettis, étincelles et danse : ${pire} ms)`);

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "rien ne déborde");
ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot interdit");
ok((await p.locator('[data-calques="provisoires"]').count()) === 1, "sans image du duo : la découpe provisoire des posées, et la page le dit");

// ═══ 🎭 LES VRAIS CALQUES (lot S1) : l'image du duo faite (le faux moteur), la scène les prend ═══
const cookie = `sb-127-auth-token=base64-${b64(session)}; clikme_habitant=${LEA.jeton}`;
for (let k = 0; k < 4; k++) {
  const r = await fetch(`${BASE}/api/admin/direct/pieces-duo/collage`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ action: "fabriquer" }) });
  const j = await r.json().catch(() => ({}));
  if (j.etat?.generee) break;
}
await p.reload({ waitUntil: "networkidle" });
ok(await attendre(async () => (await p.locator('[data-calques="vrais"]').count()) === 1, 20000), "l'image du duo faite : « Les vrais calques », découpés dedans");
ok(
  await attendre(() => p.evaluate(() => [...document.querySelectorAll(".sc-fig")].length === 2 && [...document.querySelectorAll(".sc img")].every((i) => i.complete && i.naturalWidth > 0 && /\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/.test(i.src)))),
  "la plaque et les quatre calques, chargés, à adresse stable",
);
const v0 = await angle("moi");
await p.waitForTimeout(900);
ok((await angle("moi")) !== v0, "les têtes des vrais calques vivent seules");
await p.screenshot({ path: `${D}/salon-moteur-3-vrais-calques.png` });

// ═══ RÉDUIRE LES ANIMATIONS ═══
const r = await ouvrir({ reducedMotion: "reduce" });
ok((await r.locator(".sc[data-reduit]").count()) === 1, "« réduire les animations » : la scène le sait");
await r.waitForTimeout(300);
const ra = await transformee('[data-tete="moi"]', r);
await r.waitForTimeout(800);
ok((await transformee('[data-tete="moi"]', r)) === ra, "… et les têtes ne bougent plus seules");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nle moteur du salon : tout est bon");
process.exit(echecs ? 1 : 0);
