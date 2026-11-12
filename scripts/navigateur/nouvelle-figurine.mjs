// 🧸 LA NOUVELLE FIGURINE (« Univers », lot 2) — l'adresse d'essai `/univers/figurine`, sur un iPhone, contre le faux
// Supabase et son faux moteur d'image (jamais la vraie base, jamais OpenAI).
//
// Un visiteur sans session d'administrateur est renvoyé. Le propriétaire : « Créons ta figurine ! », « Créer ma
// figurine » attend sa photo et ses deux cases ; l'atelier de Pablito ; « La voilà ! », sa figurine dans son fauteuil ;
// « ✏️ Retoucher », une idée toute prête (« Les cheveux plus courts ») : « Retouchée », ses deux essais en petit (on
// revient au premier d'un toucher) ; « C'est moi ! » : « Ta figurine est prête ! », sa pose debout arrive, « Fais-la
// parler ». Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import { BASE, D, F, lancer } from "./commun.mjs";

const FAUX = F.replace("/rest/v1", "");
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });

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

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
// (un visiteur sans session : renvoyé)
const anonyme = await (await b.newContext()).newPage();
await anonyme.goto(`${BASE}/univers/figurine`, { waitUntil: "domcontentloaded" });
ok(!new URL(anonyme.url()).pathname.startsWith("/univers/figurine"), `l'adresse d'essai renvoie qui n'est pas administrateur (${new URL(anonyme.url()).pathname})`);

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async () => !/exemple/i.test(await p.evaluate(() => document.body.innerText));

// ═══ LE SELFIE ═══
await p.goto(`${BASE}/univers/figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".nf-selfie", { timeout: 60000 }).catch(() => null);
const ici = `${new URL(p.url()).pathname} — ${(await p.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 120)}`;
ok((await texte(".nf-selfie h1")) === "Créons ta figurine !", `« Créons ta figurine ! »${(await p.locator(".nf-selfie").count()) ? "" : ` (${ici})`}`);
const creer = p.locator(".nf-selfie .nf-bouton");
ok(await creer.isDisabled(), "« Créer ma figurine » attend sa photo et ses deux cases");
await p.locator('.nf-selfie input[name="photo"]').setInputFiles("public/direct/double/content.webp");
await p.waitForSelector(".nf-photo.prise img", { timeout: 10000 }).catch(() => null);
await p.locator('.nf-selfie input[name="moi"]').check();
ok(await creer.isDisabled(), "sans « J'ai 15 ans ou plus » : toujours pas");
await p.locator('.nf-selfie input[name="age"]').check();
ok(!(await creer.isDisabled()) && (await debordement()) <= 0 && (await sansMotInterdit()), "sa photo, ses deux cases : « Créer ma figurine » (rien ne déborde)");
await p.screenshot({ path: `${D}/nouvelle-figurine-1-selfie.png` });
await creer.click();
// (l'atelier : le faux moteur est rapide, il peut passer en un éclair)
const atelier = await p.waitForSelector(".nf-atelier", { timeout: 5000 }).then(() => true).catch(() => false);
if (atelier) await p.screenshot({ path: `${D}/nouvelle-figurine-2-atelier.png` });
await p.waitForSelector(".nf-decouverte .nf-figurine", { timeout: 60000 }).catch(() => null);
ok((await texte(".nf-decouverte .nf-titre")) === "La voilà !" && (await p.locator(".nf-decouverte .nf-scene img.nf-figurine").count()) === 1, `« La voilà ! » : sa figurine, dans son fauteuil${atelier ? " (après l'atelier)" : ""}`);
const premiere = await p.locator(".nf-decouverte").getAttribute("data-proposition");
await p.screenshot({ path: `${D}/nouvelle-figurine-3-decouverte.png` });

// ═══ UNE RETOUCHE ═══
await p.locator(".nf-gestes .nf-bouton.clair").click();
await p.locator(".nf-idees button", { hasText: "Les cheveux plus courts" }).click();
ok((await p.locator('.nf-retouche input[name="demande"]').inputValue()) === "Les cheveux plus courts" && (await p.locator(".nf-idees button").count()) === 6, "« ✏️ Retoucher » : ses mots, ou une idée toute prête");
await p.screenshot({ path: `${D}/nouvelle-figurine-4-retouche.png` });
await p.locator(".nf-retouche .nf-bouton").click();
await p.waitForFunction((id) => document.querySelector(".nf-decouverte")?.getAttribute("data-proposition") !== id && document.querySelector(".nf-decouverte .nf-demande"), premiere, { timeout: 60000 }).catch(() => null);
ok((await texte(".nf-decouverte .nf-titre")) === "Retouchée" && (await texte(".nf-decouverte .nf-demande")).includes("Les cheveux plus courts") && (await p.locator(".nf-essais button").count()) === 2, "« Retouchée » : ses mots, ses deux essais en petit");
const ia = (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => c.startsWith("IMAGE "));
ok(ia.length === 2 && ia[1].includes("« Les cheveux plus courts »") && ia[1].includes("EXACTLY THE SAME FIGURINE"), "la retouche part au moteur avec ses mots");
await p.locator(".nf-essais button").last().click();
ok((await p.locator(".nf-decouverte").getAttribute("data-proposition")) === premiere && (await texte(".nf-decouverte .nf-titre")) === "La voilà !", "un toucher sur un essai d'avant : on y revient");
await p.locator(".nf-essais button").first().click();
await p.screenshot({ path: `${D}/nouvelle-figurine-5-retouchee.png` });

// ═══ « C'EST MOI ! » ═══
await p.locator(".nf-gestes .nf-bouton").first().click();
await p.waitForSelector(".nf-validee", { timeout: 30000 }).catch(() => null);
ok((await texte(".nf-validee .nf-titre")) === "Ta figurine est prête !", "« C'est moi ! » : « Ta figurine est prête ! »");
await p.waitForSelector(".nf-poses img", { timeout: 60000 }).catch(() => null);
ok((await p.locator(".nf-poses img").count()) === 1 && (await p.locator(".nf-parler").count()) === 1, "sa pose debout arrive ; « Fais-la parler »");
await p.locator(".nf-parler").click();
ok((await debordement()) <= 0 && (await sansMotInterdit()) && (await texte(".nf-suite")).includes("ton univers"), "« Maintenant, j'aimerais découvrir ce qui fait ton univers… » ; rien ne déborde, sans le mot interdit");
await p.screenshot({ path: `${D}/nouvelle-figurine-6-prete.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla nouvelle figurine tient ✓");
process.exit(echecs ? 1 : 0);
