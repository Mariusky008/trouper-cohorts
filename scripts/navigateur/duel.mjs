// 😐 LE CONCOURS DE REGARD (`clikme.fr/duel`, le prototype du duel du jour) — contre le faux Supabase.
//
// Jade a sa figurine et sa carte de personnage (de l'humour : ça l'aide un peu). Elle pose le doigt et le lève pendant le
// décompte : rien ne commence. Elle joue sans réagir : les mouches la chatouillent, elle craque — le polaroïd (les deux
// figurines, la phrase qu'elle peut changer, le score), « Envoyer ». Revanche : elle chasse chaque mouche et ne bouge pas
// quand Pablito louche — Pablito craque, elle gagne. Sans compte : on l'invite à créer sa figurine. Rien ne déborde,
// jamais le mot interdit.
import fs from "node:fs";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const JADE = { id: "dddddddd-0000-4000-8000-000000000071", jeton: "jeton-jade-000000000000001" };
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });

await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000000071", slug: "comptoir-duel-dax", channel: "letter", business_name: "Le Comptoir", city: "Dax", activite: "Restaurant", published: true, est_client: true }]);
await semer("human_habitants", [{ id: JADE.id, device_token: JADE.jeton, prenom: "Jade", ville_slug: "dax" }]);
for (const [nom, src] of [
  ["neutre", "public/direct/double/pied/salut-1.webp"],
  ["parle", "public/direct/double/parle-1.webp"],
]) {
  await fetch(`${STOCK}/figurines-clients/${JADE.id}/${nom}-essai.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fs.readFileSync(src) });
}
await semer("clik_ma_figurine", [{ habitant_id: JADE.id, prenom: "Jade", photo: `${JADE.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${JADE.id}/neutre-essai.webp`, parle: `${JADE.id}/parle-essai.webp`, prete_le: new Date().toISOString() }]);
// sa carte : le clown, là pour rire → de l'humour (70)
await fetch(`${STOCK}/figurines-clients/${JADE.id}/personnage.json`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ reponses: { elan: "a", ton: "a", jeu: "b", sort: "a", tete: "a", gout: "a", rythme: "a" }, gouts: ["jeux"], phrase: "", fiche: { titre: "La Tornade qui fait rire", portrait: "", pouvoir: "", faiblesse: "", facon: "" }, par: "local", le: new Date().toISOString() }),
});

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (qui) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// ═══ JADE ARRIVE ═══
const jade = await tel(JADE);
await jade.goto(`${BASE}/duel?graine=essai-1`, { waitUntil: "networkidle" });
await jade.waitForSelector(".dl-poser .dl-cible", { timeout: 60000 });
const accueil = await texte(jade, ".dl");
ok(accueil.includes("Concours de regard") && accueil.includes("Le premier qui rit a perdu") && /Pablito a tenu \d+,\d s aujourd’hui/.test(accueil), `l'accueil : la règle, et le temps de Pablito aujourd'hui (${accueil.slice(0, 80)}…)`);
ok((await texte(jade, ".dl-fig.moi figcaption")) === "Jade" && (await texte(jade, ".dl-fig.autre figcaption")) === "Pablito", "sa figurine (Jade) face à Pablito");
ok((await texte(jade, ".dl-bas")).includes("Ton humour (70) t’aide à résister : −10 %"), `sa carte l'aide un peu : son humour (${await texte(jade, ".dl-bas")})`);
ok((await jade.locator('meta[name="robots"][content*="noindex"]').count()) === 1, "pas dans Google");
await jade.screenshot({ path: `${D}/duel-1-accueil.png` });

const cible = await jade.locator(".dl-cible").boundingBox();
const cx = cible.x + cible.width / 2;
const cy = cible.y + cible.height / 2;
// il lève le doigt pendant le décompte : rien ne commence
await jade.mouse.move(cx, cy);
await jade.mouse.down();
await jade.waitForSelector(".dl-compte", { timeout: 5000 });
await jade.waitForTimeout(800);
await jade.mouse.up();
await jade.waitForSelector(".dl-oups", { timeout: 5000 });
ok((await texte(jade, ".dl-oups")).includes("Garde ton doigt posé"), "le doigt levé pendant le décompte : rien ne commence");

// ═══ SANS RÉAGIR : LES MOUCHES LA CHATOUILLENT, ELLE CRAQUE ═══
await jade.mouse.move(cx, cy);
await jade.mouse.down();
await jade.waitForSelector(".dl-jauge", { timeout: 8000 });
ok(true, "3, 2, 1… le duel commence");
await jade.waitForFunction(() => /mouche/i.test(document.querySelector(".dl-consigne")?.textContent ?? ""), null, { timeout: 15000 });
ok((await jade.locator(".dl-mouche").count()) === 1, "🪰 une mouche se pose sur sa figurine : « Glisse ton doigt »");
await jade.screenshot({ path: `${D}/duel-2-mouche.png` });
await jade.waitForSelector(".dl-fin", { timeout: 40000 });
const perdu = await texte(jade, ".dl-resultat");
ok(/Tu as craqué à \d+,\d s/.test(perdu), `sans réagir, elle craque (${perdu})`);
ok((await jade.locator(".dl-fig.moi.craque .dl-pfff").count()) === 1, "sa figurine éclate de rire (PFFF 😂)");
await jade.mouse.up();
await jade.waitForSelector(".dl-polaroid-img", { timeout: 20000 });
const pol1 = await jade.locator(".dl-polaroid-img").getAttribute("src");
const taille = await jade.evaluate(async (u) => (await (await fetch(u)).blob()).size, pol1);
const phrase1 = await jade.locator(".dl-phrase input").inputValue();
ok(taille > 40_000 && phrase1.length > 10, `le polaroïd se développe (${Math.round(taille / 1024)} Ko) : « ${phrase1} »`);
ok((await texte(jade, ".dl-chiffres")).includes("Toi 0 – 1 Pablito"), `le score entre eux (${await texte(jade, ".dl-chiffres")})`);
await jade.locator(".dl-phrase input").fill("Pablito m’a eu. La prochaine fois, je ne rigole plus.");
await jade.waitForFunction((avant) => document.querySelector(".dl-polaroid-img")?.getAttribute("src") !== avant, pol1, { timeout: 10000 });
ok(true, "elle change la phrase : le polaroïd se redessine");
ok(!(await jade.locator(".dl-envoyer").isDisabled()) && (await texte(jade, ".dl-revanche")).includes("Revanche"), "« 📲 Envoyer le polaroïd » et « 🔁 Revanche ! »");
ok((await debordement(jade)) <= 0 && !/exemple/i.test(await texte(jade, ".dl")), "rien ne déborde, sans le mot interdit");
await jade.screenshot({ path: `${D}/duel-3-polaroid.png`, fullPage: true });
const png = await jade.evaluate(async (u) => {
  const b = await (await fetch(u)).blob();
  return Array.from(new Uint8Array(await b.arrayBuffer()));
}, await jade.locator(".dl-polaroid-img").getAttribute("src"));
fs.writeFileSync(`${D}/duel-polaroid.jpg`, Buffer.from(png));

// ═══ REVANCHE : ELLE CHASSE CHAQUE MOUCHE, ET NE BOUGE PAS QUAND PABLITO LOUCHE ═══
await jade.locator(".dl-revanche").click();
await jade.waitForSelector(".dl-poser .dl-cible", { timeout: 10000 });
await jade.mouse.move(cx, cy);
await jade.mouse.down();
await jade.waitForSelector(".dl-jauge", { timeout: 8000 });
let chassees = 0;
let cote = 1;
for (let k = 0; k < 400; k++) {
  if (await jade.locator(".dl-fin").count()) break;
  const c = (await jade.locator(".dl-consigne").textContent().catch(() => "")) ?? "";
  if (/mouche/i.test(c)) {
    // un geste franc, puis le doigt revient
    await jade.mouse.move(cx + 70 * cote, cy, { steps: 3 });
    cote = -cote;
    chassees++;
    await jade.waitForTimeout(120);
  } else await jade.waitForTimeout(60);
}
await jade.waitForSelector(".dl-fin", { timeout: 40000 });
const gagne = await texte(jade, ".dl-resultat");
ok(gagne.includes("Pablito a craqué ! Tu as gagné.") && chassees > 0, `elle chasse les mouches (${chassees} gestes), ne bouge pas : Pablito craque (${gagne})`);
ok((await jade.locator(".dl-fig.autre.craque .dl-pfff").count()) === 1, "c'est Pablito qui éclate de rire");
await jade.mouse.up();
await jade.waitForSelector(".dl-polaroid-img", { timeout: 20000 });
const phrase2 = await jade.locator(".dl-phrase input").inputValue();
ok((await texte(jade, ".dl-chiffres")).includes("Toi 1 – 1 Pablito") && phrase2.length > 10, `1 partout ; sa phrase de victoire : « ${phrase2} »`);
await jade.screenshot({ path: `${D}/duel-4-victoire.png`, fullPage: true });

// ═══ SANS COMPTE : ON L'INVITE À CRÉER SA FIGURINE ═══
const inconnu = await tel(null);
await inconnu.goto(`${BASE}/duel`, { waitUntil: "networkidle" });
await inconnu.waitForSelector(".dl-poser .dl-cible", { timeout: 60000 });
ok((await texte(inconnu, ".dl-fig.moi figcaption")) === "Toi" && (await inconnu.locator('.dl-bas a[href="/collection#figurine"]').count()) === 1, "sans compte : il joue avec Clik, et « Crée ta figurine pour jouer avec la tienne »");

const erreurs = [...jade.err, ...inconnu.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ").slice(0, 300)})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
