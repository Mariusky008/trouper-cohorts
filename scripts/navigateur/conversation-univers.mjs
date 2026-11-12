// 💬 LA CONVERSATION AVEC PABLITO (« Univers », lot 3) — l'adresse d'essai `/univers/conversation`, sur un iPhone,
// contre le faux Supabase et son faux modèle (jamais la vraie base, jamais OpenAI).
//
// Un visiteur sans session d'administrateur est renvoyé. Le propriétaire : la transition (Pablito, ses trois phrases),
// « C'est parti », la première question ; il répond, Pablito rebondit (les points qui écrivent, puis sa bulle) ; l'écran
// prend les couleurs de son univers, des vignettes apparaissent ; « Je préfère ne pas en parler » d'un toucher ; « ✨
// Voir ce que j'imagine » ; la proposition : son texte, « Ce que tu m'as dit » (sa phrase), « Ce que j'imagine », « Ce
// que je ne sais pas encore » ; il retire un élément, corrige avec ses mots ; « C'est mon univers ! ». Rien ne
// déborde, jamais le mot interdit, aucune erreur dans la page.
import { BASE, D, F, lancer } from "./commun.mjs";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const LEA = { id: "abababab-0000-4000-8000-000000000701", jeton: "jeton-lea-conversation-nav-01" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);
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
await anonyme.goto(`${BASE}/univers/conversation`, { waitUntil: "domcontentloaded" });
ok(!new URL(anonyme.url()).pathname.startsWith("/univers/conversation"), `l'adresse d'essai renvoie qui n'est pas administrateur (${new URL(anonyme.url()).pathname})`);

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("dialog", (d) => void d.accept());
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async () => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const bulles = (qui) => p.locator(`.cv-fil .cv-message.${qui}:not(.ecrit)`).count();
const repondre = async (t) => {
  const avant = await bulles("pablito");
  await p.locator('.cv-ligne textarea[name="message"]').fill(t);
  await p.locator(".cv-envoyer").click();
  await p.waitForFunction((n) => document.querySelectorAll(".cv-fil .cv-message.pablito:not(.ecrit)").length > n, avant, { timeout: 30000 }).catch(() => null);
};

// ═══ LA TRANSITION ═══
await p.goto(`${BASE}/univers/conversation`, { waitUntil: "networkidle" });
await p.waitForSelector(".cv-transition", { timeout: 60000 }).catch(() => null);
ok((await p.locator(".cv-transition .cv-bulle").count()) === 3 && (await texte(".cv-bulle.grand")).includes("j’aimerais découvrir ce qui fait ton univers"), "la transition : Pablito, ses trois phrases");
ok((await texte(".cv-transition")).includes("Pas un diagnostic"), "« une interprétation artistique, pas un diagnostic »");
await p.screenshot({ path: `${D}/conversation-1-transition.png` });
await p.locator(".cv-transition .cv-bouton").click();
await p.waitForSelector(".cv-discussion .cv-message.pablito", { timeout: 20000 }).catch(() => null);
ok((await texte(".cv-message.pablito p")).startsWith("Pour commencer"), "« C'est parti » : sa première question");

// ═══ LA CONVERSATION ═══
await repondre("J'adore bricoler dans mon atelier au bord de la mer");
ok((await bulles("moi")) === 1 && (await bulles("pablito")) === 2, "il répond : Pablito rebondit");
await p.waitForFunction(() => getComputedStyle(document.querySelector(".cv")).getPropertyValue("--c1").trim() === "#2f5d73", null, { timeout: 10000 }).catch(() => null);
ok((await p.evaluate(() => getComputedStyle(document.querySelector(".cv")).getPropertyValue("--c1").trim())) === "#2f5d73" && (await p.locator(".cv-vignette").count()) >= 2, "l'écran prend les couleurs de son univers ; des vignettes apparaissent");
await p.screenshot({ path: `${D}/conversation-2-discussion.png` });
const avant = await bulles("pablito");
await p.locator(".cv-pas").click();
await p.waitForFunction((n) => document.querySelectorAll(".cv-fil .cv-message.pablito:not(.ecrit)").length > n, avant, { timeout: 30000 }).catch(() => null);
ok((await p.locator(".cv-fil .cv-message.moi p").last().innerText()).trim() === "Je préfère ne pas en parler", "« Je préfère ne pas en parler » d'un toucher");
await repondre("Le dimanche je cuisine pour mes amis");
await p.waitForSelector(".cv-esquisse .cv-bouton", { timeout: 15000 }).catch(() => null);
ok((await texte(".cv-esquisse p")).includes("première esquisse") && (await debordement()) <= 0 && (await sansMotInterdit()), "« ✨ Voir ce que j'imagine » (rien ne déborde, sans le mot interdit)");

// ═══ LA PROPOSITION ═══
await p.locator(".cv-esquisse .cv-bouton").click();
await p.waitForSelector(".cv-proposition", { timeout: 30000 }).catch(() => null);
ok((await texte(".cv-proposition .cv-texte")).startsWith("Je t'imagine") && (await p.locator(".cv-colonne").count()) === 3, "la proposition : son texte, trois colonnes");
ok((await texte(".cv-colonne.dits")).includes("« J'adore bricoler dans mon atelier »") && (await texte(".cv-colonne.imagines")).includes("un volcan au loin"), "« Ce que tu m'as dit » porte sa phrase ; ce qui n'en a pas est « Ce que j'imagine »");
await p.screenshot({ path: `${D}/conversation-3-proposition.png`, fullPage: true });
const nb = await p.locator(".cv-element").count();
await p.locator(".cv-colonne.imagines .cv-element", { hasText: "volcan" }).locator(".cv-retirer").click();
await p.waitForFunction((n) => document.querySelectorAll(".cv-element").length === n - 1, nb, { timeout: 10000 }).catch(() => null);
ok((await p.locator(".cv-element").count()) === nb - 1, "il retire un élément");
await p.locator('.cv-corriger textarea[name="correction"]').fill("plutôt la montagne que la mer");
await p.locator(".cv-proposition .cv-bouton.clair").click();
await p.waitForFunction(() => document.querySelector(".cv-proposition .cv-texte")?.textContent?.includes("corrigé"), null, { timeout: 30000 }).catch(() => null);
ok((await texte(".cv-proposition .cv-texte")).includes("corrigé") && (await texte(".cv-colonne.imagines")).includes("plutôt la montagne que la mer"), "il corrige avec ses mots : la proposition est refaite");
await p.locator(".cv-proposition .cv-bouton").last().click();
await p.waitForSelector(".cv-validee", { timeout: 20000 }).catch(() => null);
ok((await texte(".cv-validee .cv-titre")).includes("Ton univers est prêt à être créé"), "« C'est mon univers ! » : prêt à être créé");
ok((await debordement()) <= 0 && (await sansMotInterdit()), "rien ne déborde, sans le mot interdit");
await p.screenshot({ path: `${D}/conversation-4-validee.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla conversation tient ✓");
process.exit(echecs ? 1 : 0);
