// 🗣️ SA PROPRE FIGURINE, DANS UN TÉLÉPHONE — `clikme.fr/collection` puis `clikme.fr/figurine/<id>`, contre le faux
// Supabase, avec un faux micro (Chromium joue un bip à sa place) et une fausse voix (le faux Supabase rend un enregistrement d'essai).
//
// Hugo a 1 figurine : le guide (la figurine du patron de ClikMe) l'accueille (le menu en bas, cinq onglets), la quête « Crée ta figurine » (la démonstration
// qu'on faisait parler est partie le 5 novembre 2026). Léa passe chez le Comptoir depuis plus d'un an (et à l'Atelier) : plus
// de 10 figurines. Elle envoie sa photo (il faut cocher « C'est bien moi ») ; « on fabrique ta figurine ». ClikMe pose
// ses deux images (ici à la main, dans le faux Supabase : la route admin, elle, refuse qui n'est pas admin). Elle
// écrit un texte, le fait lire par une voix (la joie sur son visage), ne garde que le Comptoir dans les commerces cités, l'envoie : un lien `/figurine/<id>`, avec
// WhatsApp et SMS. Une amie l'ouvre sans compte : « Léa t'a envoyé sa figurine », la voix joue et la bouche bouge,
// le Comptoir est cité (pas l'Atelier), « Et toi ? » mène à sa collection ; une écoute est comptée. Elle le
// signale : il ne s'affiche plus, sa voix non plus. Rien ne déborde, jamais le mot interdit.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

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

// ═══ HUGO (une figurine du mois) : L’ACCUEIL DE PABLITO, LE MENU EN BAS, « CRÉE TA FIGURINE » ═══
const hugo = await tel(HUGO);
await hugo.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await hugo.waitForSelector("#o-figurine .pb-voile .mqd", { timeout: 60000 });
ok((await hugo.locator(".mc-nav button").count()) === 5 && (await texte(hugo, ".mc-nav")).includes("Rencontres") && (await texte(hugo, ".mc-nav")).includes("Ce mois-ci"), "le menu en bas : cinq onglets");
ok((await hugo.locator("#o-figurine .mqd .mq").count()) === 1 && /Pablito/i.test(await texte(hugo, "#o-figurine .mqd-bulle")), "Pablito, la figurine du patron de ClikMe, l'accueille en fenêtre");
ok((await texte(hugo, "#o-figurine .pb-voile")).includes("Je crée ma figurine"), "dans la fenêtre : « Je crée ma figurine »");
await hugo.screenshot({ path: `${D}/ma-figurine-0-pablito.png` });
await hugo.locator('#o-figurine .pb-voile a.og-go[href="#creer"]').click();
ok((await hugo.locator(".pb-voile").count()) === 0, "« Je crée ma figurine » ferme la fenêtre");
ok((await hugo.locator(".tf-demo, .tf-la-tienne").count()) === 0, "plus de démonstration à faire parler");
// DÈS LE DÉPART : la quête « Crée ta figurine »
ok((await hugo.locator("#creer.tf-quete").count()) === 1 && (await texte(hugo, "#creer")).includes("Crée ta figurine") && (await hugo.locator("#o-figurine .mqd-revoir").count()) === 1, "Hugo peut créer la sienne dès maintenant (Pablito rangé dans son petit bouton)");
ok(
  (await hugo.locator("#creer .tf-prenom-photo, #creer .tf-ville").count()) === 0 && (await hugo.locator("#creer .tf-etapes li").count()) === 3 && (await hugo.locator("#creer .tf-univers").count()) === 1,
  "il a un compte et un prénom : on ne les lui redemande pas (sa photo, ce qui lui ressemble — facultatif —, son accord)",
);
const comment = await texte(hugo, "#o-figurine .fm-comment");
ok(
  comment.includes("Comment ça marche") && comment.includes("Chaque mois vécu") && !/achat|débloquer/i.test(await texte(hugo, "#o-figurine .og-pouvoirs")),
  `« Comment ça marche », en trois temps — plus rien « à débloquer », plus aucun achat (${comment.slice(0, 120)})`,
);
ok((await debordement(hugo)) <= 0, "l'accueil ne déborde pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0-accueil.png`, fullPage: true });

// ═══ HUGO CRÉE LA SIENNE : SES OPTIONS, UNE PAR CADEAU DE CLIKME (une étape franchie, un cadeau) ═══
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
ok(/Tes premiers pas · 2\/10/.test(opts) && !/cadeau|cadenas|achat|Encore/i.test(opts), `ses premiers pas : une simple liste, sans cadenas (${opts.slice(0, 160)})`);
ok((await hugo.locator(".tf-moi .tf-kdo li.faite").count()) === 2 && (await texte(hugo, ".tf-kdo li.faite")).includes("Créer ta figurine"), "deux étapes franchies : sa figurine, un commerçant partenaire");
ok(
  (await hugo.locator(".tf-moi .tf-expr button").count()) === 7 && (await hugo.locator(".tf-moi .tf-expr button.ferme, .tf-moi .tf-voix button.ferme").count()) === 0 && (await hugo.locator(".tf-moi .tf-danse").count()) === 1,
  "tout est ouvert dès le départ : sept visages, toutes les voix, la danse",
);
await hugo.locator(".tf-moi .tf-expr button", { hasText: "Tristesse" }).click();
ok((await hugo.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "tristesse" && (await hugo.locator(".tf-nudge").count()) === 0, "la tristesse se choisit tout de suite (plus de cadeau à attendre)");
// 🗓️ SA FIGURINE DU MOIS, EN UNE LIGNE (lot 3) : ses jours de rencontres ce mois-ci
const apercu = await texte(hugo, "#o-figurine .fm-apercu");
ok(/Ta figurine de \p{L}+/u.test(apercu) && apercu.includes("0/10 jours de rencontres") && (await hugo.locator("#o-figurine .fm-apercu .fm-jours i").count()) === 10, `où en est sa figurine du mois (${apercu})`);
ok((await hugo.locator("#o-figurine .fm-comment").count()) === 1, "« Comment ça marche » reste là, sa figurine faite");
ok((await debordement(hugo)) <= 0, "sa figurine et ses options ne débordent pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0b-options.png`, fullPage: true });

// ═══ 🗓️ SA FIGURINE DU MOIS, MÉRITÉE : DIX JOURS DE RENCONTRES CE MOIS-CI (lot 3) ═══
const mois = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date()).slice(0, 7);
const sesRencontres = (n) =>
  fetch(`${STOCK}/figurines-clients/${HUGO.id}/rencontres.json`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ liste: Array.from({ length: n }, (_, k) => ({ id: `essai-${k}`, jour: `${mois}-${String(k + 1).padStart(2, "0")}`, avec: "p:pablito" })), amis: [], oui: [], non: [], moi: 0, pas: 0 }),
  });
// ce qu'il a dit ce mois-ci (son journal) : sa phrase du mois s'en sert
await fetch(`${STOCK}/figurines-clients/${HUGO.id}/journal/${mois}.json`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ entrees: [{ type: "question", le: new Date().toISOString(), cle: "essai", question: "Ton petit plaisir du dimanche ?", texte: "un croissant au lit" }] }),
});
await sesRencontres(9);
const demanderMois = () =>
  hugo.evaluate(async () => {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mois" }) });
    return { s: r.status, j: await r.json() };
  });
const neuf9 = await demanderMois();
ok(neuf9.s === 400 && neuf9.j.error === "Encore 1 jour de rencontres ce mois-ci." && neuf9.j.mois?.courante?.etat === "a-gagner" && neuf9.j.mois.courante.jours === 9, `à neuf jours, pas encore : elle se mérite (${neuf9.s}, ${neuf9.j.error})`);
await hugo.goto(`${BASE}/collection?v=${Date.now()}#mois`, { waitUntil: "networkidle" });
await hugo.waitForSelector("#o-mois .fm .fm-gagner", { timeout: 30000 });
const gagner = await texte(hugo, "#o-mois .fm");
ok(
  gagner.includes("TA FIGURINE DU MOIS") && gagner.includes("9/10 jours de rencontres ce mois-ci") && gagner.includes("Encore 1 jour :") && (await hugo.locator("#o-mois .fm .fm-jours i.vecu").count()) === 9,
  `« Ce mois-ci » commence par SA figurine du mois : neuf jours sur dix (${gagner.slice(0, 160)})`,
);
const avant = await hugo.evaluate(() => [...document.querySelectorAll("#o-mois > *")].findIndex((x) => x.classList.contains("fm")));
ok(avant === 1, `elle passe avant les commerçants (juste sous le titre : ${avant})`);
await fermerPablito(hugo, "#o-mois");
await hugo.screenshot({ path: `${D}/ma-figurine-0c-mois-a-gagner.png` });
// LE DIXIÈME JOUR : elle se fabrique toute seule (ici sans moteur d'image : sa figurine, avec le thème et sa phrase)
await sesRencontres(10);
await hugo.reload({ waitUntil: "networkidle" });
await hugo.waitForSelector("#o-mois .fm .fm-carte img", { timeout: 60000 });
const fiche = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/mois/${mois}.json`)).json().catch(() => null);
ok(fiche?.mois === mois && fiche.image === `${HUGO.id}/mois/${mois}.webp` && fiche.expression && fiche.cle && fiche.parMoteur === false, `elle est rangée dans son seau privé (${JSON.stringify(fiche)?.slice(0, 160)})`);
ok(/croissant au lit/.test(fiche?.phrase ?? ""), `sa phrase du mois reprend ce qu'il a dit ce mois-ci (${fiche?.phrase})`);
const prete = await texte(hugo, "#o-mois .fm");
ok(prete.includes("TA PHRASE DU MOIS") && prete.includes("croissant au lit") && prete.includes(`Son visage du mois : ${fiche?.expression}`), `la révélation : sa figurine du mois, son visage du mois, sa phrase (${prete.slice(0, 200)})`);
ok(await hugo.locator("#o-mois .fm .fm-carte img").evaluate((i) => i.complete && i.naturalWidth > 0), "son image s'affiche");
const encore = await demanderMois();
const fiche2 = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/mois/${mois}.json`)).json().catch(() => null);
ok(encore.s === 200 && encore.j.mois?.courante?.etat === "prete" && fiche2?.le === fiche?.le, "une seule par mois : la redemander ne la refait pas");
ok((await debordement(hugo)) <= 0, "« Ce mois-ci » ne déborde pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0d-mois-prete.png`, fullPage: true });
// DANS L'ALBUM : les siennes d'abord ; les commerçants partenaires, en plus
await hugo.locator(".mc-nav button", { hasText: "Album" }).click();
await hugo.waitForSelector("#o-album .fm-album .fm-carte img", { timeout: 30000 });
const album = await texte(hugo, "#o-album");
ok(album.indexOf("Mes figurines du mois") >= 0 && album.indexOf("Mes figurines du mois") < album.indexOf("Mes commerçants partenaires"), "l'album : ses figurines du mois d'abord, ses commerçants partenaires ensuite");
await hugo.screenshot({ path: `${D}/ma-figurine-0e-album.png`, fullPage: true });
// (en développement, le petit « N » de Next se pose sur ce bouton : on le touche directement)
await hugo.locator(".mc-nav button", { hasText: "Ma figurine" }).dispatchEvent("click");
await hugo.waitForSelector("#o-figurine .fm-apercu", { timeout: 30000 });
ok((await texte(hugo, "#o-figurine .fm-apercu")).includes("est arrivée"), "dans « Ma figurine » : sa figurine du mois est arrivée");

// ═══ UN VISITEUR SANS COMPTE : SA PHOTO LUI OUVRE SON COMPTE (son prénom, sa ville) ═══
const neuf = await tel(null);
await neuf.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await fermerPablito(neuf);
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
await fermerPablito(lea);
await lea.waitForSelector(".tf-photo", { timeout: 60000 });
const ph = await texte(lea, ".tf-photo");
ok(ph.includes("Crée ta figurine") && /gratuit/i.test(ph), `Léa : crée ta figurine (${ph.slice(0, 60)})`);
ok(await lea.locator(".tf-photo .tf-envoyer").isDisabled(), "sans photo, pas d'envoi");
await lea.locator(".tf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await lea.waitForSelector(".tf-choisir img", { timeout: 15000 });
ok(await lea.locator(".tf-photo .tf-envoyer").isDisabled(), "sans « C’est bien moi », pas d'envoi");
await lea.locator(".tf-accord input").check();
await lea.locator(".tf-univers").fill("Boulangère");
await lea.locator(".tf-photo .tf-envoyer").click();
await lea.waitForSelector(".tf-annonce", { timeout: 30000 });
const univers = await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/univers.json`)).json().catch(() => null);
ok(univers?.univers === "Boulangère", `ce qui lui ressemble (son métier) est gardé pour sa figurine (${JSON.stringify(univers)})`);
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
ok((await texte(lea, "#o-figurine .og-tete h1")).includes("Fais-la parler"), "sa figurine est là : fais-la parler");
ok((await texte(lea, "#o-figurine .cn-proteger")).includes("Ne perds jamais ta figurine"), "🔐 son adresse peut protéger sa figurine (un code pour la retrouver)");
ok((await lea.locator(".tf-moi .tf-expr button").count()) === 7 && (await lea.locator(".tf-moi .tf-expr button.ferme").count()) === 0, "sept visages à lui donner, tous ouverts (dont le fou rire et la grimace)");
await lea.locator(".tf-moi .tf-expr button", { hasText: "Fou rire" }).click();
ok((await lea.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "rire", "le fou rire");
await lea.locator(".tf-moi .tf-danse").click();
ok((await lea.locator(".tf-moi .fqp.danse .fqp-notes").count()) === 1, "🕺 elle danse (des notes de musique autour)");
await lea.locator(".tf-moi .tf-expr button", { hasText: "Joie" }).click();
ok((await lea.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "joie" && (await lea.locator(".tf-moi .fqp-badge").count()) === 1, "elle choisit la joie : sa figurine la montre (son visage de joie n'est pas encore fait : elle bouge)");
await lea.locator(".tf-texte textarea").fill("Coucou Camille ! On se voit ce soir ?");
// SA VOIX : demandée une fois (« une voix d'homme ou de femme ? »), jamais devinée ; gardée
ok((await lea.locator(".tf-moi .tf-quelle-voix").count()) === 1 && (await lea.locator(".tf-moi .tf-ecouter").isDisabled()), "sa voix : on lui demande (homme ou femme ?) avant d'écouter");
await lea.locator(".tf-moi .tf-quelle-voix button", { hasText: "voix de femme" }).click();
ok((await lea.locator(".tf-moi .tf-voix button.pris").innerText()).includes("Douce"), "une voix de femme : « Douce »");
await lea.locator(".tf-moi .tf-voix button", { hasText: "Chaleureuse" }).click();
await lea.waitForTimeout(600);
ok((await lea.evaluate(async () => (await (await fetch("/api/direct/ma-figurine", { cache: "no-store" })).json()).etat?.maVoix)) === "chaleureuse", "sa voix est gardée (ce sera la sienne la prochaine fois)");
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
ok((await amie.locator(".mr .fqp.danse").count()) === 1 && mr.includes("elle danse"), "et elle danse (rangé à côté du message, sans migration)");
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

// ═══ 🕺 ELLE DANSE SUR SON RESSORT : une figurine dessinée (fond rose, tête, corps, ressort, socle) ═══
// le fond reste, le socle ne bouge pas : seuls le ressort et le corps bougent (« au lieu d'utiliser les ressorts pour la
// faire bouger, c'est la photo en entier qui bouge »)
const dessin = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><defs><radialGradient id="f" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#F7B9D6"/><stop offset="1" stop-color="#E0579A"/></radialGradient></defs>
<rect width="300" height="450" fill="url(#f)"/><ellipse cx="150" cy="405" rx="105" ry="22" fill="#6B3A1E"/><rect x="45" y="385" width="210" height="20" fill="#7A4424"/>
${[0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="132" y="${318 + k * 10}" width="36" height="11" rx="5" fill="${k % 2 ? "#8E8E94" : "#B4B4BA"}"/>`).join("")}
<rect x="62" y="215" width="176" height="108" rx="26" fill="#1F2647"/><circle cx="150" cy="140" r="78" fill="#E9B48F"/><ellipse cx="150" cy="78" rx="80" ry="34" fill="#6E6E72"/></svg>`;
const fig = await sharp(Buffer.from(dessin)).webp().toBuffer();
for (const nom of ["neutre", "parle"]) await fetch(`${STOCK}/figurines-clients/${LEA.id}/${nom}-essai.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fig });
await lea.goto(`${BASE}/collection?v=${Date.now()}#figurine`, { waitUntil: "networkidle" });
await lea.waitForSelector(".tf-moi .tf-danse", { timeout: 30000 });
await lea.locator(".tf-moi .tf-danse").click();
await lea.waitForFunction(() => document.querySelector(".tf-moi .fqp")?.getAttribute("data-danse") === "ressort", null, { timeout: 15000 }).catch(() => null);
const bandes = await lea.evaluate(() => {
  const st = getComputedStyle(document.querySelector(".tf-moi .fqp-fig"));
  const anim = (b) => getComputedStyle(document.querySelector(`.tf-moi .fqp-bande.${b}`) ?? document.body).animationName;
  return { danse: document.querySelector(".tf-moi .fqp")?.getAttribute("data-danse"), haut: st.getPropertyValue("--haut"), bas: st.getPropertyValue("--bas"), socle: anim("socle"), ressort: anim("ressort"), corps: anim("haut"), plaque: Boolean(document.querySelector(".tf-moi .fqp-plaque")) };
});
const enPct = (x) => parseFloat(x);
ok(
  bandes.danse === "ressort" && bandes.plaque && bandes.socle === "none" && bandes.ressort === "fqp-ressort" && bandes.corps === "fqp-saute" && enPct(bandes.haut) > 66 && enPct(bandes.haut) < 76 && enPct(bandes.bas) > 82 && enPct(bandes.bas) < 90,
  `🕺 elle danse sur son ressort : le fond et le socle immobiles, le ressort et le corps bougent (${JSON.stringify(bandes)})`,
);
await lea.locator(".tf-moi .fqp-fig").screenshot({ path: `${D}/ma-figurine-4-danse.png` });

// 🎨 CE QUI LUI RESSEMBLE, REVU EN LA REFAISANT (son métier) : gardé pour la nouvelle (ici, une autre photo : sans moteur d'image)
const refaite = await lea.evaluate(async () => (await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "refaire", autrePhoto: true, univers: "Artisan" }) })).status);
const univers2 = await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/univers.json`)).json().catch(() => null);
ok(refaite === 200 && univers2?.univers === "Artisan", `la refaire : ce qui lui ressemble, revu (${refaite}, ${JSON.stringify(univers2)})`);

// sans cookie, on ne peut rien envoyer d'autre qu'une photo (qui ouvre un compte)
const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "message", son: "data:audio/mpeg;base64,AAAA", duree: 1 }) });
ok(r.status === 403, "sans être quelqu'un, pas de message");

const erreurs = [...hugo.err, ...neuf.err, ...lea.err, ...amie.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
