// 🧭 DÉCOUVRIR, LE LOT D0, À L'ÉCRAN (`docs/univers/decouvrir.md`, section 14) — sur un iPhone, puis sur l'ordinateur de
// l'administrateur, contre le faux Supabase et le faux YouTube.
//
// « TES PASSIONS » (`/univers/passions`) : Léa, 15 ans, voit onze vignettes (pas le salon des jeunes parents) ; rien de
// choisi : « C'est parti » attend ; trois touchers : « 3 sur 5 », il s'allume ; une sixième : « 5 au plus » ; elle en
// garde cinq, « C'est parti » : « C'est noté » ; elle revient : ses cinq passions sont là.
// LA SÉLECTION DU JOUR (`/admin/humain/decouvrir`) : la nuit passée, les douze thèmes et leurs vidéos (quinze pour le
// foot) ; « 15-17 ans » montre l'autre sélection ; « Retirer » : quatorze ; un lien collé, « Ajouter » : en tête, « ajoutée
// à la main ». Ni erreur, ni le mot « exemple ».
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const json = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const LEA = { id: "d0d0d0d0-0000-4000-8000-00000000e001", jeton: "jeton-tes-passions-0001", prenom: "Léa" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: LEA.prenom, ville_slug: "dax" }]);
await json(`${LEA.id}/majeur.json`, { age: 15, adulte: false, le: new Date().toISOString() });
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE };

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const page = async (ctx) => {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  return p;
};
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

// ═══ « TES PASSIONS », SUR SON IPHONE ═══
const ctxLea = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
// (l'adresse d'essai : l'administrateur, tant que « Univers pour tous » est éteint dans les essais)
await ctxLea.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }, COOKIE_ADMIN]);
const lea = await page(ctxLea);
await lea.goto(`${BASE}/univers/passions`, { waitUntil: "domcontentloaded" });
const tuiles = lea.locator("[data-passion]");
ok(await attendre(lea, async () => (await tuiles.count()) === 11), `onze vignettes (${await tuiles.count()})`);
ok((await lea.locator('[data-passion="parents"]').count()) === 0, "… pas le salon des jeunes parents (15 ans)");
const go = lea.locator("[data-go]");
ok(await go.isDisabled(), "rien de choisi : « C’est parti » attend");
for (const id of ["foot", "cuisine", "animaux"]) await lea.locator(`[data-passion="${id}"]`).click();
ok((await texte(lea.locator("[data-compte]"))) === "3 sur 5" && !(await go.isDisabled()), "trois touchers : « 3 sur 5 », « C’est parti » s’allume");
for (const id of ["humour", "manga", "mode"]) await lea.locator(`[data-passion="${id}"]`).click();
ok(await attendre(lea, async () => /5 au plus/.test(await texte(lea.locator("[data-note]")))), "une sixième : « 5 au plus »");
ok((await texte(lea.locator("[data-compte]"))) === "5 sur 5" && (await lea.locator('[data-passion="mode"]').getAttribute("aria-pressed")) === "false", "… elle n’est pas prise");
await lea.screenshot({ path: `${D}/tes-passions-1.png` });
await go.click();
ok(await attendre(lea, async () => /C’est noté/.test(await texte(lea.locator("[data-note]")))), "« C’est parti » : « C’est noté »");
await lea.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await lea.locator('[data-passion][aria-pressed="true"]').count()) === 5), "elle revient : ses cinq passions sont là");
ok(!/exemple/i.test(await lea.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");

// ═══ LA SÉLECTION DU JOUR, CHEZ L'ADMINISTRATEUR ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, "la nuit est passée (23 sélections)");
const ctxAdmin = await b.newContext({ viewport: { width: 1100, height: 900 } });
await ctxAdmin.addCookies([COOKIE_ADMIN]);
const ad = await page(ctxAdmin);
await ad.goto(`${BASE}/admin/humain/decouvrir`, { waitUntil: "domcontentloaded" });
const foot = ad.locator('[data-theme="foot"]');
ok(await attendre(ad, async () => (await ad.locator("[data-theme]").count()) === 12), "les douze thèmes");
ok((await foot.locator("[data-video]").count()) === 15, "le foot : quinze vidéos");
ok((await ad.locator("[data-pas-branche]").count()) === 0, "la clé est branchée : pas d’avertissement");
await foot.locator('[data-cote="jeunes"]').click();
ok((await foot.locator('[data-cote="jeunes"]').getAttribute("aria-pressed")) === "true" && (await foot.locator("[data-video]").count()) === 15, "« 15-17 ans » : l’autre sélection");
await foot.locator('[data-cote="adultes"]').click();
await ad.screenshot({ path: `${D}/decouvrir-admin-1.png` });
const premiere = await foot.locator("[data-video]").first().getAttribute("data-video");
await foot.locator("[data-retirer]").first().click();
ok(await attendre(ad, async () => (await foot.locator("[data-video]").count()) === 14 && /Retirée/.test(await texte(ad.locator("[data-note]"))), 30000), `« Retirer » : quatorze, « Retirée de toutes les télés » (${await foot.locator("[data-video]").count()}, ${await texte(ad.locator("[data-note]"))})`);
ok((await foot.locator(`[data-video="${premiere}"]`).count()) === 0, "… elle n’y est plus");
await foot.locator("[data-lien]").fill("https://www.youtube.com/watch?v=AbCdEfGh01x");
await foot.locator("[data-ajouter]").click();
ok(await attendre(ad, async () => (await foot.locator("[data-video]").first().getAttribute("data-video")) === "AbCdEfGh01x"), "un lien collé, « Ajouter » : en tête");
ok(/ajoutée à la main/.test(await texte(foot.locator("[data-video]").first())), "… « ajoutée à la main »");
await ad.screenshot({ path: `${D}/decouvrir-admin-2.png` });

ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
