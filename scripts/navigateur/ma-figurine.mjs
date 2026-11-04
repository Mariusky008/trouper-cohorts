// 🗣️ SA PROPRE FIGURINE, DANS UN TÉLÉPHONE — `clikme.fr/collection` puis `clikme.fr/figurine/<id>`, contre le faux
// Supabase, avec un faux micro (Chromium joue un bip à sa place) et une fausse voix (le faux Supabase rend un enregistrement d'essai).
//
// Hugo a 1 figurine : « 1 / 10 », encore 9 ; il fait parler la démonstration : une insulte est refusée ; son texte,
// triste, dans la voix « Posée » ; il l'envoie (WhatsApp), et son ami l'ouvre : « Hugo t'a envoyé une figurine qui
// parle », écrit par Hugo, « À ton tour ». Léa passe chez le Comptoir depuis plus d'un an (et à l'Atelier) : plus
// de 10 figurines. Elle envoie sa photo (il faut cocher « C'est bien moi ») ; « on fabrique ta figurine ». ClikMe pose
// ses deux images (ici à la main, dans le faux Supabase : la route admin, elle, refuse qui n'est pas admin). Elle
// écrit un texte, le fait lire par une voix (la joie sur son visage), ne garde que le Comptoir dans les commerces cités, l'envoie : un lien `/figurine/<id>`, avec
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

// ═══ HUGO : 1 / 10, ET LA DÉMONSTRATION EN HAUT DE LA PAGE ═══
const hugo = await tel(HUGO);
await hugo.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await hugo.waitForSelector(".tf-demo .tf-la-tienne b", { timeout: 60000 });
for (let k = 0; k < 30 && !(await texte(hugo, ".tf-la-tienne")).includes("Crée la tienne"); k++) await hugo.waitForTimeout(300);
const g = await texte(hugo, ".tf-la-tienne");
ok(g.includes("Crée la tienne") && g.includes("gratuit"), `sous la démonstration : crée la tienne, c'est gratuit (${g.slice(0, 120)})`);
// DÈS LE DÉPART (plus de « 10 figurines » à attendre) : « Crée ta figurine », avec 1 figurine
ok((await hugo.locator("#creer.tf-photo").count()) === 1 && (await texte(hugo, "#creer")).includes("Crée ta figurine") && (await hugo.locator('.tf-la-tienne a[href="#creer"]').count()) === 1, "Hugo peut créer la sienne dès maintenant");
ok((await hugo.locator("#creer .tf-prenom-photo, #creer .tf-ville").count()) === 0, "il a un compte et un prénom : on ne les lui redemande pas");
ok((await texte(hugo, ".mc-heros h1")).includes("Ta figurine") && (await texte(hugo, ".tf-demo")).includes("Démonstration · fais-la parler"), "en haut de la page : la figurine qui parle, en démonstration");
ok((await hugo.locator(".tf-demo .tf-expr button").count()) === 5, "cinq visages : normal, joie, colère, tristesse, euphorie");
// LE CADRE A LES PROPORTIONS DE SON IMAGE (852 × 1024) : la tête ne sort jamais du cadre
const cadre = await hugo.locator(".tf-demo .fqp-fig").evaluate((e) => e.clientWidth / e.clientHeight);
ok(Math.abs(cadre - 852 / 1024) < 0.02, `le cadre a les proportions de la figurine (${cadre.toFixed(3)})`);
await hugo.locator(".tf-demo .tf-expr button", { hasText: "Tristesse" }).click();
ok((await hugo.locator(".tf-demo .fqp").getAttribute("data-sentiment")) === "tristesse", "un toucher : la démonstration est triste");
// SON texte, dans la voix qu'il choisit (la fausse voix du faux Supabase) — plus de phrases toutes faites
ok((await hugo.locator(".tf-phrases").count()) === 0 && (await hugo.locator(".tf-demo .tf-voix button").count()) === 4, "pas de phrases toutes faites ; quatre voix");
await hugo.locator(".tf-demo .tf-texte textarea").fill("Espèce de connard");
const refus = hugo.waitForResponse((r) => r.url().includes("/api/direct/ma-figurine") && r.request().method() === "POST" && (r.request().postData() ?? "").includes("connard"));
await hugo.locator(".tf-demo .tf-ecouter").click();
ok((await refus).status() === 422, "une insulte : la figurine ne la dit pas");
await hugo.waitForSelector(".tf-demo .fqp-ennui", { timeout: 10000 });
ok((await texte(hugo, ".tf-demo .fqp-ennui")).includes("ne le dit pas"), `on le lui dit (${await texte(hugo, ".tf-demo .fqp-ennui")})`);
await hugo.locator(".tf-demo .tf-texte textarea").fill("On se fait un resto ce soir ? Je t’invite !");
await hugo.locator(".tf-demo .tf-voix button", { hasText: "Posée" }).click();
const voixDemo = hugo.waitForResponse((r) => r.url().includes("/api/direct/ma-figurine") && r.request().method() === "POST" && (r.request().postData() ?? "").includes("\"voix\""));
await hugo.locator(".tf-demo .tf-ecouter").click();
ok((await voixDemo).status() === 200, "son texte est lu par la voix choisie");
let joue = "";
for (let k = 0; k < 40 && !/joue|fini/.test(joue); k++) {
  joue = (await hugo.locator(".tf-demo .fqp").getAttribute("data-lecture")) ?? "";
  if (!/joue|fini/.test(joue)) await hugo.waitForTimeout(150);
}
ok(/joue|fini/.test(joue), `elle le dit (${joue})`);
// IL L'ENVOIE : son prénom, puis WhatsApp
await hugo.locator(".tf-demo .tf-prenom").fill("Hugo");
await hugo.locator(".tf-demo .tf-envoyer-wa").click();
await hugo.waitForSelector(".tf-demo .tf-wa", { timeout: 30000 });
const lienDemo = await hugo.locator(".tf-demo .tf-adresse").inputValue();
const waDemo = decodeURIComponent((await hugo.locator(".tf-demo .tf-wa").getAttribute("href")) ?? "");
ok(/\/figurine\/[a-z0-9]{12}$/.test(lienDemo) && waDemo.startsWith("https://wa.me/?text=") && waDemo.includes("Hugo t’a envoyé une figurine qui parle") && waDemo.includes(lienDemo), `la démonstration part sur WhatsApp (${lienDemo})`);
// SON AMI L'OUVRE : la figurine triste lui dit le texte de Hugo, écrit par Hugo, et « À ton tour »
const ami = await tel(null);
await ami.goto(lienDemo.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await ami.waitForSelector(".mr h1", { timeout: 60000 });
ok((await texte(ami, ".mr h1")) === "Hugo t’a envoyé une figurine qui parle" && (await ami.title()).includes("Hugo t’a envoyé une figurine qui parle"), "« Hugo t’a envoyé une figurine qui parle »");
ok((await texte(ami, ".mr-bulle")).includes("On se fait un resto ce soir ?") && (await texte(ami, ".mr-auteur")).includes("Message écrit par Hugo, avec la figurine de démonstration"), "ce qu'elle dit, en bulle, et qui l'a écrit");
ok((await ami.locator(".mr .fqp").getAttribute("data-sentiment")) === "tristesse" && (await texte(ami, ".mr-toi")).includes("À ton tour") && (await ami.locator('.mr-toi a[href="/collection"]').count()) === 1, "elle est triste ; « À ton tour » ramène à la démonstration");
const sonDemo = ami.waitForResponse((r) => r.url().includes("/api/direct/ma-figurine/son"));
await ami.locator(".fqp-jouer").click();
const rDemo = await sonDemo;
ok(rDemo.status() === 200 && /audio\/mpeg/.test(rDemo.headers()["content-type"] ?? ""), "sa voix arrive");
ok((await debordement(ami)) <= 0 && !/exemple/i.test(await texte(ami, ".mr")), "la page du message ne déborde pas, sans le mot interdit");
await ami.screenshot({ path: `${D}/ma-figurine-0-demo-recue.png`, fullPage: true });
await hugo.screenshot({ path: `${D}/ma-figurine-0-demo.png`, fullPage: true });

// ═══ HUGO CRÉE LA SIENNE (1 achat) : SES OPTIONS, UNE PAR ACHAT ═══
await hugo.locator("#creer .tf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await hugo.waitForSelector("#creer .tf-choisir img", { timeout: 15000 });
await hugo.locator("#creer .tf-accord input").check();
await hugo.locator("#creer .tf-envoyer").click();
// (ici, pas de moteur d'image : ClikMe la fait à la main, comme l'admin — ses deux images posées dans le faux Supabase)
await hugo.waitForSelector(".tf-annonce", { timeout: 30000 });
ok((await texte(hugo, ".tf-annonce")).includes("On fabrique ta figurine"), "sans moteur d'image : ClikMe la fabrique");
for (const [nom, src] of [
  ["neutre", "public/direct/double/pied/salut-1.webp"],
  ["parle", "public/direct/double/parle-1.webp"],
])
  await fetch(`${STOCK}/figurines-clients/${HUGO.id}/${nom}-essai.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fs.readFileSync(src) });
await fetch(`${F}/clik_ma_figurine?habitant_id=eq.${HUGO.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ neutre: `${HUGO.id}/neutre-essai.webp`, parle: `${HUGO.id}/parle-essai.webp`, prete_le: new Date().toISOString() }),
});
await hugo.reload({ waitUntil: "networkidle" });
await hugo.waitForSelector(".tf-moi .tf-options", { timeout: 30000 });
const opts = await texte(hugo, ".tf-options");
ok(/La colère ouverte ✓/.test(opts) && /La tristesse 3ᵉ achat/.test(opts) && opts.includes("Encore 1 achat"), `ses options : la colère ouverte (1 achat), la suite sous cadenas (${opts.slice(0, 160)})`);
ok((await hugo.locator(".tf-moi .tf-expr button.ferme").count()) === 2 && (await hugo.locator(".tf-moi .tf-voix button.ferme").count()) === 3, "deux visages et trois voix sous cadenas");
await hugo.locator(".tf-moi .tf-expr button", { hasText: "Tristesse" }).click();
ok((await hugo.locator(".tf-moi .fqp").getAttribute("data-sentiment")) !== "tristesse" && (await texte(hugo, ".tf-nudge")).includes("s’ouvre à ton 3ᵉ achat"), `un visage fermé dit quel achat l'ouvre (${await texte(hugo, ".tf-nudge")})`);
await hugo.locator(".tf-moi .tf-expr button", { hasText: "Colère" }).click();
ok((await hugo.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "colere", "la colère, ouverte, se choisit");
// LE SERVEUR TIENT LES OPTIONS, lui aussi
const voixFermee = await hugo.evaluate(async () => (await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "voix", texte: "Coucou", voix: "posee" }) })).status);
ok(voixFermee === 403, `une voix fermée : le serveur refuse (${voixFermee})`);
const tristeFerme = await hugo.evaluate(async () => (await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "message", son: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPMjAAAA0gAAABEVFGmgqK////9bP/6XCykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", duree: 1.2, commerces: [], sentiment: "tristesse" }) })).status);
ok(tristeFerme === 400, `un visage fermé : le message est refusé (${tristeFerme})`);
ok((await debordement(hugo)) <= 0, "sa figurine et ses options ne débordent pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0b-options.png`, fullPage: true });

// ═══ UN VISITEUR SANS COMPTE : SA PHOTO LUI OUVRE SON COMPTE (son prénom, sa ville) ═══
const neuf = await tel(null);
await neuf.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await neuf.waitForSelector("#creer", { timeout: 60000 });
ok((await neuf.locator("#creer .tf-prenom-photo").count()) === 1, "sans compte : son prénom est demandé");
await neuf.locator("#creer .tf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await neuf.waitForSelector("#creer .tf-choisir img", { timeout: 15000 });
await neuf.locator("#creer .tf-prenom-photo").fill("Zoé");
if (await neuf.locator("#creer .tf-ville").count()) await neuf.locator("#creer .tf-ville").selectOption("dax");
await neuf.locator("#creer .tf-accord input").check();
await neuf.locator("#creer .tf-envoyer").click();
await neuf.waitForSelector(".tf-annonce", { timeout: 30000 });
const zoe = (await lire("human_habitants", "prenom=eq.Zoé"))[0];
ok(zoe?.ville_slug === "dax" && (await neuf.context().cookies()).some((c) => c.name === "clikme_habitant"), `son compte est ouvert, à Dax, avec son prénom (${zoe?.ville_slug})`);
const [figZoe] = await lire("clik_ma_figurine", `habitant_id=eq.${zoe?.id}`);
ok(figZoe?.photo?.startsWith(`${zoe?.id}/photo-`) && figZoe?.accord_le, "sa photo est rangée, son accord noté");
const sansVille = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "photo", photo: "data:image/png;base64,AAAA", accord: true, ville: "atlantide" }) });
ok(sansVille.status === 400, "une ville sans commerce ClikMe : pas de compte");

// ═══ LÉA : SA PHOTO ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await lea.waitForSelector(".tf-photo", { timeout: 60000 });
const ph = await texte(lea, ".tf-photo");
ok(ph.includes("Crée ta figurine") && ph.includes("gratuit"), `Léa : crée ta figurine (${ph.slice(0, 60)})`);
ok(await lea.locator(".tf-photo .tf-envoyer").isDisabled(), "sans photo, pas d'envoi");
await lea.locator(".tf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await lea.waitForSelector(".tf-choisir img", { timeout: 15000 });
ok(await lea.locator(".tf-photo .tf-envoyer").isDisabled(), "sans « C’est bien moi », pas d'envoi");
await lea.locator(".tf-accord input").check();
await lea.locator(".tf-photo .tf-envoyer").click();
await lea.waitForSelector(".tf-annonce", { timeout: 30000 });
ok((await texte(lea, ".tf-annonce")).includes("On fabrique ta figurine"), "photo partie : on fabrique sa figurine");
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

// ═══ LÉA FAIT PARLER SA FIGURINE : UN TEXTE, LU PAR LA VOIX QU'ELLE CHOISIT ═══
await lea.reload({ waitUntil: "networkidle" });
await lea.waitForSelector(".tf-moi .tf-texte textarea", { timeout: 30000 });
ok((await texte(lea, ".mc-heros h1")).includes("Fais-la parler"), "sa figurine est là : fais-la parler");
ok((await lea.locator(".tf-moi .tf-expr button").count()) === 5, "cinq visages à lui donner");
await lea.locator(".tf-moi .tf-expr button", { hasText: "Joie" }).click();
ok((await lea.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "joie" && (await lea.locator(".tf-moi .fqp-badge").count()) === 1, "elle choisit la joie : sa figurine la montre (son visage de joie n'est pas encore fait : elle bouge)");
await lea.locator(".tf-texte textarea").fill("Coucou Camille ! On se voit ce soir ?");
await lea.locator(".tf-moi .tf-voix button", { hasText: "Chaleureuse" }).click();
await lea.locator(".tf-moi .tf-ecouter").click();
await lea.waitForSelector(".tf-envoyer", { timeout: 30000 });
const cites = await lea.locator(".tf-cites label").allInnerTexts();
ok(cites.length === 2 && (await lea.locator(".tf-cites label.pris").count()) === 2, `elle peut citer ses deux commerces, choisis d'office (${cites.join(" / ")})`);
await lea.locator(".tf-cites label", { hasText: "Atelier" }).click();
ok((await lea.locator(".tf-cites label.pris").count()) === 1, "elle retire l'Atelier");
await lea.screenshot({ path: `${D}/ma-figurine-1-message.png`, fullPage: true });
await lea.locator(".tf-envoyer").click();
await lea.waitForSelector(".tf-wa", { timeout: 30000 });
const lien = await lea.locator(".tf-adresse").inputValue();
ok(/\/figurine\/[a-z0-9]{12}$/.test(lien), `son lien (${lien})`);
const wa = await lea.locator(".tf-wa").getAttribute("href");
ok(wa?.startsWith("https://wa.me/?text=") && decodeURIComponent(wa).includes("Léa t’a envoyé sa figurine") && decodeURIComponent(wa).includes(lien), "WhatsApp : le texte et le lien, en premier");
ok((await lea.locator(".tf-sms").getAttribute("href"))?.startsWith("sms:"), "SMS");
const id = lien.split("/").pop();
const [msg] = await lire("clik_figurine_message", `id=eq.${id}`);
ok(msg && JSON.stringify(msg.commerces) === JSON.stringify([A.slug]) && msg.son.startsWith(`${LEA.id}/m-${id}.`) && msg.duree > 1 && msg.duree <= 16, `le message : sa voix lue, le Comptoir seulement (${JSON.stringify(msg?.commerces)}, ${msg?.duree} s)`);
ok(msg?.sentiment === "joie" && msg?.texte === "Coucou Camille ! On se voit ce soir ?" && msg?.voix === "chaleureuse", `le message porte sa joie, son texte et sa voix (${msg?.sentiment}, ${msg?.voix})`);
ok((await debordement(lea)) <= 0 && !/exemple/i.test(await texte(lea, "main")), "« Ma collection » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/ma-figurine-2-envoye.png`, fullPage: true });

// ═══ ET AVEC SA PROPRE VOIX ═══
await lea.locator(".tf-modes button", { hasText: "Ma voix" }).click();
ok((await lea.locator(".tf-envoi").count()) === 0, "sa voix à elle : le message lu ne repart pas tel quel");
await lea.locator(".tf-micro").click();
await lea.waitForSelector(".tf-temps", { timeout: 15000 });
await lea.waitForTimeout(2600);
ok(/● [12] s \/ 15 s/.test(await texte(lea, ".tf-temps")), `le compteur tourne (${await texte(lea, ".tf-temps")})`);
await lea.locator(".tf-stop").click();
await lea.waitForSelector(".tf-envoyer", { timeout: 15000 });
ok((await lea.locator(".tf-moi .tf-ecouter").count()) === 1, "elle peut s'écouter, puis l'envoyer");

// ═══ UNE AMIE L'OUVRE ═══
const amie = await tel(null);
await amie.goto(lien.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await amie.waitForSelector(".mr h1", { timeout: 60000 });
const mr = await texte(amie, ".mr");
ok((await texte(amie, ".mr h1")) === "Léa t’a envoyé sa figurine", "« Léa t’a envoyé sa figurine »");
ok(mr.includes(A.nom) && !mr.includes("Atelier Tout Neuf") && (await amie.locator(`.mr-commerces a[href="/f/${A.slug}"]`).count()) === 1, "ses commerces préférés : le Comptoir, pas l'Atelier");
ok(mr.includes("Et toi ?") && (await amie.locator('.mr-toi a[href="/collection#creer"]').count()) === 1, "« Et toi ? » mène à « Crée ta figurine »");
ok((await amie.locator(".mr-fig.mr-or").count()) === 1, "Léa a plus de 5 achats : son message arrive dans le cadre doré");
ok((await amie.locator(".mr .fqp").getAttribute("data-sentiment")) === "joie" && mr.includes("pleine de joie"), "chez son amie, la figurine est pleine de joie");
ok((await texte(amie, ".mr-bulle")).includes("Coucou Camille ! On se voit ce soir ?"), "ce qu'elle dit s'écrit en bulle");
const titre = await amie.title();
ok(titre.includes("Léa t’a envoyé sa figurine") && !/ClikMe.*Clikme/i.test(titre) && (await amie.locator('meta[name="robots"][content*="noindex"]').count()) === 1, `le titre du lien, et pas dans Google (${titre})`);
// la bouche s'ouvre sur les sons forts de la voix : des ouvertures brèves (le faux micro du navigateur enregistre des
// bips). On ne la regarde pas de temps en temps (une machine lente les manque) : la page note chaque ouverture.
await amie.locator(".fqp-fig").evaluate((fig) => {
  window.__ouvertures = 0;
  new MutationObserver(() => fig.classList.contains("ouverte") && (window.__ouvertures += 1)).observe(fig, { attributes: true, attributeFilter: ["class"] });
});
const son = amie.waitForResponse((r) => r.url().includes("/api/direct/ma-figurine/son"));
await amie.locator(".fqp-jouer").click();
const reponse = await son;
ok(reponse.status() === 200, `sa voix arrive (${reponse.headers()["content-type"]}, ${reponse.headers()["content-length"]} octets)`);
let bouche = false;
for (let k = 0; k < 80 && !bouche; k++) {
  bouche = await amie.evaluate(() => window.__ouvertures > 0);
  if (!bouche) await amie.waitForTimeout(100);
}
const lecture = await amie.locator(".fqp").evaluate((e) => ({ ...e.dataset, bouton: e.querySelector(".fqp-jouer")?.textContent, ennui: e.querySelector(".fqp-ennui")?.textContent ?? "" }));
ok(bouche, `la bouche bouge sur sa voix (${JSON.stringify(lecture)})`);
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

// sans cookie, on ne peut rien envoyer d'autre qu'une photo (qui ouvre un compte)
const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "message", son: "data:audio/mpeg;base64,AAAA", duree: 1 }) });
ok(r.status === 403, "sans être quelqu'un, pas de message");

const erreurs = [...hugo.err, ...ami.err, ...neuf.err, ...lea.err, ...amie.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
