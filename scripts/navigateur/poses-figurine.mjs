// 🧍 LES POSES DE TA FIGURINE — L'ESSAI P0, DANS UN NAVIGATEUR DE TÉLÉPHONE (`app/admin/humain/univers-essais`,
// « 🧍 Les poses de ta figurine » ; `docs/univers/poses-figurine.md`) — contre le faux Supabase et son faux moteur
// d'image, jamais OpenAI.
//
// Léa (ce téléphone) a sa figurine assise et huit de ses neuf poses ; le salon du duo est fait (sa télé, son étagère, ses
// deux places), la cuisine aussi (sans aucune zone). « Faire » la dernière : elle se fait. La scène : assise à sa place ;
// « Se lever » ; « Aller à la télé » (les deux pas s'enchaînent, elle arrive devant la télé, de dos) ; « Danser » ;
// « Rejoindre l'autre » (les bras ouverts) ; « S'asseoir » ; « ▶ Tout jouer » (toutes les poses y passent) ; les endroits ;
// la cuisine sans télé : on le dit. Son avis, gardé. Ni débordement, ni erreur, ni le mot « exemple ».
import { createHash } from "node:crypto";
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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000e31", jeton: "jeton-lea-poses-navigateur-01" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);

// ─── Léa : sa figurine assise, huit poses sur neuf ; le salon et la cuisine du duo ───
const maintenant = new Date().toISOString();
const uni = (r, g, b, l = 512, h = 768, a = 1) => sharp({ create: { width: l, height: h, channels: 4, background: { r, g, b, alpha: a } } }).png().toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, await uni(200, 140, 90), "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);
const DP = `poses-figurine/${createHash("sha1").update(`${P1}/assise.png`).digest("hex").slice(0, 12)}`;
const COULEURS = { debout: [230, 80, 80], "marche-1": [80, 200, 90], "marche-2": [60, 150, 230], assise: [240, 190, 60], dos: [120, 70, 200], danse: [240, 120, 200], coucou: [40, 200, 200], tasse: [140, 100, 60] };
for (const [pose, [r, g, b]] of Object.entries(COULEURS)) await deposer(`${DP}/${pose}.png`, await uni(r, g, b, 120, pose === "assise" ? 150 : 200), "image/png");
await deposer("pieces-duo/salon/decor.png", await uni(70, 60, 80), "image/png");
await json("pieces-duo/salon/releve.json", {
  le: maintenant,
  ajuste: true,
  emplacements: { tele: [0.06, 0.28, 0.3, 0.14], etagere: [0.62, 0.3, 0.3, 0.08], cadres: [], places: [{ x: 0.36, y: 0.8, hauteur: 0.26 }, { x: 0.64, y: 0.8, hauteur: 0.26 }] },
});
await deposer("pieces-duo/cuisine/decor.png", await uni(220, 190, 90), "image/png");
await json("pieces-duo/cuisine/releve.json", { le: maintenant, ajuste: true, emplacements: { cadres: [], places: [] } });

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
const attendre = async (fn, ms = 8000) => {
  for (const fin = Date.now() + ms; Date.now() < fin; await p.waitForTimeout(100)) if (await fn()) return true;
  return false;
};
const section = p.locator("section.pf");
const scene = p.locator(".pf-scene");
const pose = () => scene.getAttribute("data-pose");
const gauche = async () => p.locator(".pf-figurine").evaluate((el) => (el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2 - el.parentElement.getBoundingClientRect().left) / el.parentElement.getBoundingClientRect().width);
const geste = (g) => p.locator(`.pf-geste[data-geste="${g}"]`).click();
/** Les poses vues pendant `ms` (relevées toutes les 80 ms), jusqu'à ce que `fin` soit vrai. */
async function suivre(ms, fin) {
  const vues = new Set();
  for (const t = Date.now() + ms; Date.now() < t; await p.waitForTimeout(80)) {
    vues.add(await pose());
    if (fin && (await fin())) break;
  }
  return vues;
}

await p.goto(`${BASE}/admin/humain/univers-essais`, { waitUntil: "domcontentloaded" });
await section.waitFor({ timeout: 20000 });
ok(await attendre(async () => (await section.locator(".pf-pose img").count()) === 8, 15000), "ses poses : huit faites sur neuf, chacune montrée");
ok(/1\. Ses poses \(8\/9\)/.test(await section.innerText()) && (await p.locator(".pf-tout").innerText()).includes("Faire sa dernière pose"), "« Faire sa dernière pose »");

// ─── la dernière se fait ───
await p.locator('.pf-pose[data-pose="calin"] button').click();
ok(await attendre(async () => (await p.locator('.pf-pose[data-pose="calin"] img').count()) === 1, 20000), "« Faire » : les bras ouverts se font, puis se montrent");
ok(/est faite/.test(await p.locator(".pf-dit").innerText()) && !(await p.locator(".pf-tout").count()), "« … est faite » ; plus rien à faire");

// ─── la scène ───
await scene.scrollIntoViewIfNeeded();
ok((await pose()) === "assise" && (await p.locator('.pf-piece[data-piece="salon"]').getAttribute("aria-checked")) === "true", "dans le salon, elle est assise à sa place");
ok(Math.abs((await gauche()) - 0.36) < 0.05, `à sa place, celle de gauche (${(await gauche()).toFixed(2)})`);
await p.screenshot({ path: `${D}/poses-figurine-1-assise.png` });
await geste("lever");
ok(await attendre(async () => (await pose()) === "debout"), "« Se lever » : debout");
await geste("tele");
const versTele = await suivre(12000, async () => (await pose()) === "dos");
ok(versTele.has("marche-1") && versTele.has("marche-2"), "« Aller à la télé » : ses deux pas s'enchaînent en chemin");
ok((await pose()) === "dos" && Math.abs((await gauche()) - 0.21) < 0.05, `elle arrive devant la télé, de dos (${(await gauche()).toFixed(2)})`);
ok((await p.locator(".pf-figurine img").evaluate((el) => getComputedStyle(el).transform)).includes("matrix(1,") || (await p.locator(".pf-figurine img").evaluate((el) => getComputedStyle(el).transform)) === "none", "arrivée, elle n'est plus retournée");
await p.screenshot({ path: `${D}/poses-figurine-2-tele.png` });
await geste("danse");
const danse = await suivre(5000, async () => (await pose()) === "debout");
ok(danse.has("danse") && (await pose()) === "debout", "« Danser » : elle danse, puis s'arrête");
await geste("calin");
const calin = await suivre(15000, async () => (await pose()) === "calin");
ok(calin.has("marche-1") && (await pose()) === "calin" && Math.abs((await gauche()) - 0.54) < 0.06, `« Rejoindre l'autre » : elle va près de l'autre place, les bras ouverts (${(await gauche()).toFixed(2)})`);
await geste("asseoir");
ok(await attendre(async () => (await pose()) === "assise", 12000), "« S'asseoir » : elle revient à sa place et s'assoit");

// ─── ▶ tout jouer ───
await p.locator(".pf-tout-jouer").click();
ok(await attendre(async () => (await scene.getAttribute("data-joue")) === "tout"), "« ▶ Tout jouer » : elle vit");
const tout =await suivre(60000, async () => (await scene.getAttribute("data-joue")) === null);
ok(["debout", "marche-1", "marche-2", "dos", "danse", "calin", "coucou", "tasse", "assise"].every((x) => tout.has(x)), `« ▶ Tout jouer » : toutes ses poses y passent (${[...tout].join(", ")})`);
ok((await pose()) === "assise", "et elle finit assise");

// ─── les endroits ; la cuisine, sans télé ───
await section.getByLabel("Voir les endroits où elle peut aller").check();
ok((await p.locator(".pf-endroit").count()) === 4, "les endroits : sa place, l'autre, la télé, l'étagère");
await p.locator('.pf-piece[data-piece="cuisine"]').click();
ok(await attendre(async () => (await p.locator(".pf-endroit").count()) === 2), "la cuisine, sans zones : seulement les deux places (celles par défaut)");
await geste("tele");
ok(await attendre(async () => /n’a pas encore sa télé posée/.test(await p.locator(".pf-dit").innerText().catch(() => ""))), "« Aller à la télé » : « Cette pièce n’a pas encore sa télé posée »");

// ─── son avis ───
await p.locator('.pf-avis[data-avis="presque"]').click();
await section.locator("textarea").fill("Les chaussures changent un peu.");
await p.locator(".pf-donner-avis").click();
ok(await attendre(async () => /Ton avis est noté/.test(await p.locator(".pf-dit").innerText())), "son avis : noté");
await p.reload({ waitUntil: "domcontentloaded" });
await section.waitFor({ timeout: 20000 });
ok(await attendre(async () => (await p.locator('.pf-avis[data-avis="presque"]').getAttribute("aria-checked")) === "true", 15000), "rouverte, la page le garde");
ok((await section.locator("textarea").inputValue()) === "Les chaussures changent un peu.", "et son mot");

// ─── la tenue ───
const deborde = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
ok(!deborde, "rien ne déborde sur un téléphone");
ok(!/exemple/i.test(await section.innerText()), "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.join(" | ")}` : ""}`);
await b.close();

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
