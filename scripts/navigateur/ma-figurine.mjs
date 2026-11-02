// 🗣️ SA PROPRE FIGURINE, DANS UN TÉLÉPHONE — `clikme.fr/collection` puis `clikme.fr/figurine/<id>`, contre le faux
// Supabase, avec un faux micro (Chromium joue un bip à sa place).
//
// Hugo a 1 figurine : « 1 / 10 », encore 9. Léa passe chez le Comptoir depuis plus d'un an (et à l'Atelier) : plus
// de 10 figurines. Elle envoie sa photo (il faut cocher « C'est bien moi ») ; « on fabrique ta figurine ». ClikMe pose
// ses deux images (ici à la main, dans le faux Supabase : la route admin, elle, refuse qui n'est pas admin). Elle
// enregistre un message, ne garde que le Comptoir dans les commerces cités, l'envoie : un lien `/figurine/<id>`, avec
// WhatsApp et SMS. Une amie l'ouvre sans compte : « Léa t'a envoyé sa figurine », la voix joue et la bouche bouge,
// le Comptoir est cité (pas l'Atelier), « Et toi ? » mène à sa collection ; une écoute est comptée. Elle le
// signale : il ne s'affiche plus, sa voix non plus. Rien ne déborde, jamais le mot interdit.
import fs from "node:fs";
import path from "node:path";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const A = { id: "ffffffff-0000-4000-8000-000000000041", slug: "comptoir-des-fantomes-dax", nom: "Le Comptoir des Fantômes" };
const B = { id: "ffffffff-0000-4000-8000-000000000042", slug: "atelier-tout-neuf-dax", nom: "L’Atelier Tout Neuf" };
const LEA = { id: "dddddddd-0000-4000-8000-000000000051", jeton: "jeton-lea-0000000000000001" };
const HUGO = { id: "dddddddd-0000-4000-8000-000000000052", jeton: "jeton-hugo-000000000000001" };
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const ilYa = (n) => jour(new Date(Date.now() - n * 86_400_000));
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();

await semer("human_vitrine_sites", [
  { id: A.id, slug: A.slug, channel: "letter", business_name: A.nom, city: "40100 Dax", activite: "Restaurant", published: true, est_client: true },
  { id: B.id, slug: B.slug, channel: "letter", business_name: B.nom, city: "Dax", activite: "Céramiste", published: true, est_client: true },
]);
await semer("human_habitants", [
  { id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" },
  { id: HUGO.id, device_token: HUGO.jeton, prenom: "Hugo", ville_slug: "dax" },
]);
const cage = (h, site, prenom) => ({ site_id: site, habitant_id: h, film: "page", cage: "adore", prenom, look: "cosy", created_at: new Date(Date.now() - 500 * 86_400_000).toISOString(), updated_at: new Date().toISOString() });
await semer("clik_cage", [cage(LEA.id, A.id, "Léa"), cage(LEA.id, B.id, "Léa"), cage(HUGO.id, A.id, "Hugo")]);
// Léa : tous les jours au Comptoir depuis plus d'un an, deux places libres annoncées au début ; deux fois à l'Atelier
await semer("clik_visite", [
  ...Array.from({ length: 393 }, (_, n) => ({ site_id: A.id, habitant_id: LEA.id, jour: ilYa(400 - n) })),
  { site_id: B.id, habitant_id: LEA.id, jour: ilYa(1) },
  { site_id: A.id, habitant_id: HUGO.id, jour: ilYa(0) },
]);
await semer("clik_bon_plan", [395, 394].map((n) => ({ site_id: A.id, texte: "Il me reste une table", publie_le: `${ilYa(n)}T10:00:00.000Z`, fin_le: `${ilYa(n)}T12:00:00.000Z` })));

const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async (qui) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  await ctx.grantPermissions(["microphone"], { origin: BASE });
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// ═══ HUGO : 1 / 10 ═══
const hugo = await tel(HUGO);
await hugo.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await hugo.waitForSelector(".mf-gagner", { timeout: 60000 });
const g = await texte(hugo, ".mf-gagner");
ok(/1 \/ 10 figurines/.test(g) && g.includes("Encore 9") && g.includes("chez n’importe quel commerce ClikMe"), `Hugo : 1 / 10, encore 9, tous commerces (${g.slice(0, 90)})`);
ok((await hugo.locator(".mf-photo, .mf-prete").count()) === 0, "Hugo n'a pas encore droit à la sienne");

// ═══ LÉA : SA PHOTO ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await lea.waitForSelector(".mf-photo", { timeout: 60000 });
const ph = await texte(lea, ".mf-photo");
ok(/\d+ figurines : ta figurine t’attend/.test(ph), `Léa : ta figurine t'attend (${ph.slice(0, 60)})`);
ok(await lea.locator(".mf-photo .mf-bouton").isDisabled(), "sans photo, pas d'envoi");
await lea.locator(".mf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await lea.waitForSelector(".mf-choisir img", { timeout: 15000 });
ok(await lea.locator(".mf-photo .mf-bouton").isDisabled(), "sans « C’est bien moi », pas d'envoi");
await lea.locator(".mf-accord input").check();
await lea.locator(".mf-photo .mf-bouton").click();
await lea.waitForSelector(".mf-annonce", { timeout: 30000 });
ok((await texte(lea, ".mf-annonce")).includes("On fabrique ta figurine"), "photo partie : on fabrique sa figurine");
const [ligne] = await lire("clik_ma_figurine", `habitant_id=eq.${LEA.id}`);
ok(ligne?.photo?.startsWith(`${LEA.id}/photo-`) && ligne.accord_le && ligne.prenom === "Léa" && !ligne.prete_le, "sa photo rangée (seau privé), son accord noté");
ok((await fetch(`${STOCK}/public/figurines-clients/${ligne?.photo}`)).status >= 400, "sa photo n'a pas d'adresse publique");

// la route admin refuse qui n'est pas admin
const adm = await lea.evaluate(async (h) => (await fetch("/api/admin/direct/figurines-clients", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "poser", habitant: h, neutre: "x", parle: "y" }) })).status, LEA.id);
ok(adm === 403, `la route admin refuse un client (${adm})`);

// ═══ CLIKME POSE SES DEUX IMAGES (comme l'admin) ═══
for (const [nom, src] of [
  ["neutre", "public/direct/double/pied/salut-1.webp"],
  ["parle", "public/direct/double/parle-1.webp"],
]) {
  await fetch(`${STOCK}/figurines-clients/${LEA.id}/${nom}-essai.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fs.readFileSync(src) });
}
await fetch(`${F}/clik_ma_figurine?habitant_id=eq.${LEA.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ neutre: `${LEA.id}/neutre-essai.webp`, parle: `${LEA.id}/parle-essai.webp`, prete_le: new Date().toISOString() }),
});

// ═══ LÉA FAIT PARLER SA FIGURINE ═══
await lea.reload({ waitUntil: "networkidle" });
await lea.waitForSelector(".mf-prete .mf-micro", { timeout: 30000 });
ok((await texte(lea, ".mf-prete")).includes("Fais-la parler"), "sa figurine est là : fais-la parler");
await lea.locator(".mf-micro").click();
await lea.waitForSelector(".mf-temps", { timeout: 15000 });
await lea.waitForTimeout(2600);
ok(/● [12] s \/ 15 s/.test(await texte(lea, ".mf-temps")), `le compteur tourne (${await texte(lea, ".mf-temps")})`);
await lea.locator(".mf-stop").click();
await lea.waitForSelector(".mf-prete .fqp-jouer", { timeout: 15000 });
const cites = await lea.locator(".mf-cites label").allInnerTexts();
ok(cites.length === 2 && (await lea.locator(".mf-cites label.pris").count()) === 2, `elle peut citer ses deux commerces, choisis d'office (${cites.join(" / ")})`);
await lea.locator(".mf-cites label", { hasText: "Atelier" }).click();
ok((await lea.locator(".mf-cites label.pris").count()) === 1, "elle retire l'Atelier");
await lea.screenshot({ path: `${D}/ma-figurine-1-message.png`, fullPage: true });
await lea.locator(".mf-actions .mf-bouton").click();
await lea.waitForSelector(".mf-envoye", { timeout: 30000 });
const lien = await lea.locator(".mf-adresse").inputValue();
ok(/\/figurine\/[a-z0-9]{12}$/.test(lien), `son lien (${lien})`);
const wa = await lea.locator(".mf-wa").getAttribute("href");
ok(wa?.startsWith("https://wa.me/?text=") && decodeURIComponent(wa).includes("Léa t’a envoyé sa figurine") && decodeURIComponent(wa).includes(lien), "WhatsApp : le texte et le lien");
ok((await lea.locator(".mf-sms").getAttribute("href"))?.startsWith("sms:"), "SMS");
const id = lien.split("/").pop();
const [msg] = await lire("clik_figurine_message", `id=eq.${id}`);
ok(msg && JSON.stringify(msg.commerces) === JSON.stringify([A.slug]) && msg.son.startsWith(`${LEA.id}/m-${id}.`) && msg.duree > 1 && msg.duree <= 16, `le message : sa voix, le Comptoir seulement (${JSON.stringify(msg?.commerces)}, ${msg?.duree} s)`);
ok((await debordement(lea)) <= 0 && !/exemple/i.test(await texte(lea, "main")), "« Ma collection » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/ma-figurine-2-envoye.png`, fullPage: true });

// ═══ UNE AMIE L'OUVRE ═══
const amie = await tel(null);
await amie.goto(lien.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await amie.waitForSelector(".mr h1", { timeout: 60000 });
const mr = await texte(amie, ".mr");
ok((await texte(amie, ".mr h1")) === "Léa t’a envoyé sa figurine", "« Léa t’a envoyé sa figurine »");
ok(mr.includes(A.nom) && !mr.includes("Atelier Tout Neuf") && (await amie.locator(`.mr-commerces a[href="/f/${A.slug}"]`).count()) === 1, "ses commerces préférés : le Comptoir, pas l'Atelier");
ok(mr.includes("Et toi ?") && (await amie.locator('.mr-toi a[href="/collection"]').count()) === 1, "« Et toi ? » mène à sa collection");
const titre = await amie.title();
ok(titre.includes("Léa t’a envoyé sa figurine") && !/ClikMe.*Clikme/i.test(titre) && (await amie.locator('meta[name="robots"][content*="noindex"]').count()) === 1, `le titre du lien, et pas dans Google (${titre})`);
const son = amie.waitForResponse((r) => r.url().includes("/api/direct/ma-figurine/son"));
await amie.locator(".fqp-jouer").click();
ok((await son).status() === 200, "sa voix arrive");
let bouche = false;
for (let k = 0; k < 40 && !bouche; k++) {
  bouche = await amie.locator(".fqp-fig.ouverte").count().then((n) => n > 0);
  if (!bouche) await amie.waitForTimeout(100);
}
ok(bouche, "la bouche bouge sur sa voix");
await amie.waitForTimeout(400);
const [apres] = await lire("clik_figurine_message", `id=eq.${id}`);
ok(apres?.ecoutes === 1, `une écoute comptée (${apres?.ecoutes})`);
ok((await debordement(amie)) <= 0 && !/exemple/i.test(mr), "la page du message ne déborde pas, sans le mot interdit");
await amie.screenshot({ path: `${D}/ma-figurine-3-recu.png`, fullPage: true });

// ═══ ELLE LE SIGNALE ═══
amie.on("dialog", (d) => d.accept());
await amie.locator(".mr-signaler").click();
await amie.waitForSelector(".mr-signale", { timeout: 15000 });
await amie.reload({ waitUntil: "networkidle" });
ok((await texte(amie, ".mr")).includes("Ce message a été signalé") && (await amie.locator(".fqp").count()) === 0, "signalé : il ne s'affiche plus");
ok((await fetch(`${BASE}/api/direct/ma-figurine/son?m=${id}`)).status === 404, "sa voix non plus");
ok((await fetch(`${BASE}/figurine/zzzzzzzzzzzz`)).status === 404, "un lien inconnu : 404");

// sans cookie, on ne peut rien envoyer
const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "photo", photo: "data:image/png;base64,AAAA", accord: true }) });
ok(r.status === 403, "sans être quelqu'un, pas de photo");

const erreurs = [...hugo.err, ...lea.err, ...amie.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
