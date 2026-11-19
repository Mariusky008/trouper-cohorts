// 💬 LA QUESTION DU JOUR, EN VISITE (`docs/univers/ma-maison.md`, section 19 ; le lot M5, deuxième partie) — sur un
// iPhone, contre le faux Supabase.
//
// Ce matin, Léa a répondu à sa question du jour (« En vacances, tu es plutôt… » : « 🏔️ Montagne »). Sam, son proche,
// entre chez elle : « 💬 La question du jour de Léa » ; la question, ses réponses à toucher, « Réponds d'abord : tu
// découvriras ensuite la réponse de Léa » — et la sienne, cachée. Il touche « 🏖️ Plage », « Répondre » : « Toi : 🏖️
// Plage », « Léa : 🏔️ Montagne ». Léa rentre : « 💬 Sam a répondu à ta question du jour » ; « 💬 Ta question du jour » :
// « Sam : 🏖️ Plage ». Zoé, qui n'est pas sa proche, ne peut pas y répondre ; une réponse hors des choix est refusée.
// Ni erreur, ni le mot « exemple ».
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
const qui = (n, prenom) => ({ id: `4a150a15-0000-4000-8000-00000000ee0${n}`, jeton: `jeton-ma-maison-question-0${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const ZOE = qui(3, "Zoé");
for (const x of [LEA, SAM, ZOE]) x.cle = cleProfil(x.id);
await semer("human_habitants", [LEA, SAM, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
const assise = await sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect y="250" width="400" height="350" rx="60" fill="#7a3e2a"/><circle cx="200" cy="170" r="150" fill="#f0c8a0"/></svg>`), left: 200, top: 400 }])
  .png()
  .toBuffer();
const fiche = (h) => ({ version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
for (const x of [LEA, SAM, ZOE]) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id));
  await deposer(`${x.id}/neutre-essai.png`, assise, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM, ZOE].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
// (sa pièce : le salon, ses emplacements)
const panorama = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="3584" height="1024"><rect width="3584" height="1024" fill="#4a5a6e"/><rect y="700" width="3584" height="324" fill="#6a5040"/></svg>`))
  .webp({ quality: 80 })
  .toBuffer();
for (const m of ["", "-matin", "-nuit"]) await deposer(`pieces-duo/salon/large/panorama${m}.webp`, panorama, "image/webp");
await json("pieces-duo/salon/large/releve.json", {
  le: maintenant,
  ajuste: true,
  emplacements: { tele: [0.3, 0.2, 0.1, 0.22], etagere: [0.62, 0.15, 0.1, 0.4], cadres: [[0.16, 0.18, 0.05, 0.16]], table: [0.53, 0.8, 0.08, 0.08], places: [{ x: 0.5, y: 0.94, hauteur: 0.5 }] },
});
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
// (sa dernière visite chez elle : il y a deux heures)
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() - 2 * 3600_000 });
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const mois = jour.slice(0, 7);
await json(`${LEA.id}/journal/${mois}.json`, { entrees: [{ type: "question", le: maintenant, cle: "vacances", question: "En vacances, tu es plutôt…", texte: "🏔️ Montagne" }] });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const tel = async (q, admin = false) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }, ...(admin ? [{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }] : [])]);
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
const repondre = (p, cle, t) => p.evaluate(async ([cle, t]) => {
  const r = await fetch("/api/direct/ma-piece", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "repondre", chez: cle, texte: t }) });
  return { statut: r.status, j: await r.json().catch(() => ({})) };
}, [cle, t]);

// ═══ SAM ENTRE CHEZ LÉA ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const scene = sam.locator('.mmc-visite[data-visite="ouvert"] .mmc-scene');
const puce = scene.locator('[data-geste="question"]');
ok(await attendre(sam, async () => /La question du jour de Léa/.test(await texte(puce))), "💬 « La question du jour de Léa »");
await sam.screenshot({ path: `${D}/ma-maison-question-1-puce.png` });
await puce.click();
const bulle = scene.locator('.mmc-bulle[data-bulle="question"]');
ok(await attendre(sam, async () => /En vacances, tu es plutôt…/.test(await texte(bulle))), "… la question");
ok((await bulle.locator("[data-choix]").count()) === 4, "… ses quatre réponses à toucher");
ok(/Réponds d’abord : tu découvriras ensuite la réponse de Léa/.test(await texte(bulle)), "« Réponds d'abord : tu découvriras ensuite la réponse de Léa »");
const avant = await sam.evaluate(async (cle) => (await (await fetch(`/api/direct/ma-piece?chez=${cle}`)).json()).visite?.question, LEA.cle);
ok((await bulle.locator("[data-sa-reponse]").count()) === 0 && avant?.cle === "vacances" && !("saReponse" in avant), "… la sienne, cachée (ni à l'écran, ni envoyée)");
ok((await scene.locator(".mmc-actions-visite").count()) === 0, "… la bulle seule (frapper et la surprise s'effacent)");
await bulle.locator('[data-choix="🏖️ Plage"]').click();
ok((await bulle.locator('[data-choix="🏖️ Plage"]').getAttribute("aria-pressed")) === "true", "« 🏖️ Plage » choisi");
await sam.waitForTimeout(300);
await sam.screenshot({ path: `${D}/ma-maison-question-2-repondre.png` });
await bulle.locator("[data-repondre]").click();
ok(await attendre(sam, async () => /Toi : 🏖️ Plage/.test(await texte(bulle.locator("[data-ma-reponse]")))), "« Répondre » : « Toi : 🏖️ Plage »");
ok(/Léa : 🏔️ Montagne/.test(await texte(bulle.locator("[data-sa-reponse]"))), "… puis « Léa : 🏔️ Montagne »");
await sam.screenshot({ path: `${D}/ma-maison-question-3-decouverte.png` });
const horsChoix = await repondre(sam, LEA.cle, "Les deux");
ok(horsChoix.statut === 400 && /Choisis une des réponses/.test(horsChoix.j.error ?? ""), "une réponse hors des choix : refusée");
await bulle.getByRole("button", { name: "Fermer" }).click();
ok(await attendre(sam, async () => (await bulle.count()) === 0 && (await scene.locator(".mmc-actions-visite").count()) === 1), "✕ : la bulle se ferme, frapper revient");
await sam.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(sam, async () => (await puce.count()) === 1), "Sam revient : la question est toujours là");
await puce.click();
ok(await attendre(sam, async () => /Toi : 🏖️ Plage/.test(await texte(bulle)) && /Léa : 🏔️ Montagne/.test(await texte(bulle))), "… avec sa réponse et celle de Léa");

// ═══ ZOÉ, QUI N'EST PAS SA PROCHE ═══
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/collection`, { waitUntil: "domcontentloaded" });
const refus = await repondre(zoe, LEA.cle, "🏖️ Plage");
ok(refus.statut === 403, `Zoé ne peut pas y répondre (${refus.statut})`);

// ═══ LÉA RENTRE ═══
const lea = await tel(LEA, true);
await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
ok(await attendre(lea, async () => /Sam a répondu à ta question du jour/.test(await texte(chez.locator("[data-arrivee]"))), 10000), "💬 « Sam a répondu à ta question du jour »");
await lea.screenshot({ path: `${D}/ma-maison-question-4-arrivee.png` });
ok(await attendre(lea, async () => (await chez.locator("[data-arrivee]").count()) === 0, 12000), "… l'arrivée finie");
const sienne = chez.locator('[data-geste="question"]');
ok(await attendre(lea, async () => /Ta question du jour/.test(await texte(sienne))), "« 💬 Ta question du jour »");
await sienne.click();
const reponses = chez.locator('.mmc-bulle[data-bulle="question"]');
ok(await attendre(lea, async () => /En vacances, tu es plutôt…/.test(await texte(reponses)) && /Sam : 🏖️ Plage/.test(await texte(reponses.locator("[data-reponse]")))), "… « Sam : 🏖️ Plage »");
await lea.screenshot({ path: `${D}/ma-maison-question-5-reponses.png` });
await lea.reload({ waitUntil: "domcontentloaded" });
await lea.waitForTimeout(4000);
ok(!/a répondu à ta question du jour/.test(await lea.evaluate(() => document.body.innerText)), "elle revient : déjà vu, plus d'annonce");

for (const p of [lea, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
