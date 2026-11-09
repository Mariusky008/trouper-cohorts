// 🗣️ SA PROPRE FIGURINE, DANS UN TÉLÉPHONE — `clikme.fr/collection` puis `clikme.fr/figurine/<id>`, contre le faux
// Supabase, avec un faux micro (Chromium joue un bip à sa place) et une fausse voix (le faux Supabase rend un enregistrement d'essai).
//
// Hugo a 1 figurine : le guide (la figurine du patron de ClikMe) l'accueille (le menu en bas, cinq onglets — « Créer » au milieu,
// depuis qu'on a resserré sur le mème le 7 novembre 2026), la quête « Crée ta figurine » ; sa figurine du mois, méritée en dix
// jours sur ClikMe (dans « Moi » ; « Rencontres » est effacé), devient un LOOK qui parle dans ses mèmes ; 🎲 « Surprends-moi ! » : ClikMe écrit son mème d'après sa carte de
// personnage (une fausse IA, dans le faux Supabase), rien n'est dit avant « C'est moi ✓ ». Léa passe chez le Comptoir depuis plus d'un an (et à l'Atelier) : plus
// de 10 figurines. Elle envoie sa photo (il faut cocher « C'est bien moi ») ; « on fabrique ta figurine ». ClikMe pose
// ses deux images (ici à la main, dans le faux Supabase : la route admin, elle, refuse qui n'est pas admin). Elle
// écrit un texte, le fait lire par une voix (la joie sur son visage), et en fait SON MÈME : une vidéo fabriquée dans
// le téléphone, rangée au seau, partagée telle quelle. Une amie ouvre le lien sans compte : le mème joue tout de
// suite, sans blabla, avec un seul bouton (« Crée ou réponds avec ton mème »). Un message sans vidéo : sa figurine
// parle au premier toucher, la bouche bouge, une écoute est comptée. 🌍 Léa montre son mème dans « Découvrir » (son
// accord, demandé) : Hugo, de Dax, le voit et peut lui répondre ; jamais un duo ; elle le retire quand elle veut.
// L'amie le signale : il ne s'affiche plus, sa voix non plus, ni dans « Découvrir ». Rien ne déborde, jamais le mot interdit.
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer, recus, repondreFenetre, telephone } from "./commun.mjs";

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
const api = (p, corps) =>
  p.evaluate(async (c) => {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
    return { statut: r.status, ...(await r.json().catch(() => ({}))) };
  }, corps);

// ═══ HUGO (une figurine du mois) : L’ACCUEIL DE PABLITO, LE MENU EN BAS, « CRÉE TA FIGURINE » ═══
const hugo = await tel(HUGO);
await hugo.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await hugo.waitForSelector("#o-figurine .pb-voile .mqd", { timeout: 60000 });
const menu = await texte(hugo, ".mc-nav");
ok((await hugo.locator(".mc-nav button").count()) === 5 && /Découvrir.*Autour.*Créer.*Mes mèmes.*Proches/.test(menu) && !/Ce mois-ci|Album|Rencontres|Moi/.test(menu), `le menu en bas : Découvrir · Autour · Créer · Mes mèmes · Proches (${menu})`);
ok((await hugo.locator(".mc-barre button.mc-moi").count()) === 1, "« Moi » est en haut, sous son prénom");
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
ok(
  (await hugo.locator("#o-figurine .fm-comment, #o-figurine .og-pouvoirs").count()) === 0 && !/Comment ça marche|débloquer|achat/i.test(await texte(hugo, "#o-figurine")),
  "plus de « Comment ça marche » (le guide l'explique déjà), plus rien « à débloquer », plus aucun achat",
);
// 🧭 LE MENU, EN BAS : un dock ; « Créer » en gros bouton rond au milieu ; des icônes dessinées
const dock = await hugo.evaluate(() => {
  const r = (s) => document.querySelector(s)?.getBoundingClientRect();
  return { rond: r(".mc-nav-figurine .mc-nav-ico"), g: r(".mc-nav-autour .mc-nav-ico"), d: r(".mc-nav-memes .mc-nav-ico"), nav: r(".mc-nav"), svg: document.querySelectorAll(".mc-nav svg").length };
});
ok(
  dock.rond && dock.g && dock.d && dock.rond.width >= 60 && dock.rond.top < dock.nav.top && dock.g.right < dock.rond.left && dock.d.left > dock.rond.right && dock.svg === 5 && dock.nav.left >= 8,
  `le menu : un dock qui flotte, « Créer » en gros bouton rond au milieu (${JSON.stringify({ l: dock.rond?.width, t: dock.rond?.top, n: dock.nav?.top })})`,
);
ok((await debordement(hugo)) <= 0, "l'accueil ne déborde pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0-accueil.png`, fullPage: true });

// ═══ HUGO CRÉE LA SIENNE : SES OPTIONS, UNE PAR CADEAU DE CLIKME (une étape franchie, un cadeau) ═══
await hugo.locator("#creer .tf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await hugo.waitForSelector("#creer .tf-choisir img", { timeout: 15000 });
await hugo.locator("#creer .tf-accord:not(.tf-majeur) input").check();
await hugo.locator("#creer .tf-majeur input").check();
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
await hugo.waitForSelector(".tf-moi .tf-onglets", { timeout: 30000 });
ok((await hugo.locator(".mc-nav-figurine .mc-nav-ico img").count()) === 1, "« Créer », dans le menu : SA figurine, dans le gros bouton rond");
// 👣 « Tes premiers pas » a quitté la page (8 novembre 2026 : « on peut supprimer cette section maintenant »)
ok((await hugo.locator(".tf-options, .tf-kdo").count()) === 0 && !/premiers pas/i.test(await texte(hugo, "#o-figurine")), "plus de « Tes premiers pas » dans « Créer »");
// 🗂️ LE STUDIO ET SES TIROIRS (7 novembre 2026) : ses visages dans le tiroir « Visage », la danse et les gags dans « Animer »
ok((await hugo.locator(".tf-moi .tf-tiroir").count()) === 0 && (await hugo.locator(".tf-moi .tf-gestes button").allInnerTexts()).map((x) => x.replace(/[^\p{L}\s]/gu, "").trim()).join("|") === "Visage|Animer", "sous sa figurine, ses gestes : « Visage », « Animer » (les tiroirs sont fermés)");
await hugo.locator(".tf-moi .tf-g-visage").click();
const huitVisages = (await hugo.locator(".tf-moi .tf-tiroir .tf-expr button").count()) === 8 && (await hugo.locator(".tf-moi .tf-expr button.ferme, .tf-moi .tf-voix button.ferme").count()) === 0;
await hugo.locator(".tf-moi .tf-g-animer").click();
const gags = await hugo.locator(".tf-moi .tf-tiroir-gags button").allInnerTexts();
const animer = (await hugo.locator(".tf-moi .tf-tiroir .tf-danse").count()) === 1 && (await hugo.locator(".tf-moi .tf-expr").count()) === 0 && gags.length === 4 && gags[0].includes("Le prout");
await hugo.screenshot({ path: `${D}/ma-figurine-0a-animer.png` });
await hugo.locator(".tf-moi .tf-g-visage").click();
ok(huitVisages && animer, `tout est ouvert dès le départ : huit visages (« Visage »), la danse et les gags (« Animer » : ${gags.map((x) => x.replace(/\s+/g, " ")).join(", ")})`);
await hugo.locator(".tf-moi .tf-expr button", { hasText: "Tristesse" }).click();
ok((await hugo.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "tristesse" && (await hugo.locator(".tf-nudge").count()) === 0, "la tristesse se choisit tout de suite (plus de cadeau à attendre)");
// 🗓️ SA FIGURINE DU MOIS, EN UNE LIGNE (lot 3) : ses jours sur ClikMe ce mois-ci (aujourd'hui compte déjà, ou presque)
const apercu = await texte(hugo, "#o-figurine .fm-apercu");
ok(/Ta figurine de \p{L}+/u.test(apercu) && /[01]\/10 jours sur ClikMe/.test(apercu) && (await hugo.locator("#o-figurine .fm-apercu .fm-jours i").count()) === 10, `où en est sa figurine du mois (${apercu})`);
ok((await debordement(hugo)) <= 0, "sa figurine et ses options ne débordent pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0b-options.png`, fullPage: true });
// un toucher ailleurs (un coin vide de la barre du haut ; son prénom, lui, ouvre « Moi ») : le tiroir se referme
await hugo.locator(".mc-barre").click({ position: { x: 4, y: 4 } });
ok((await hugo.locator(".tf-moi .tf-tiroir").count()) === 0, "un toucher ailleurs : le tiroir se referme");
ok((await hugo.locator("#o-figurine .og-tete").count()) === 0 && (await hugo.locator(".tf-onglets [role=tab]").allInnerTexts()).join("|") === "💬 Fais-la parler|⚡ Réactions & gags" && (await hugo.locator(".tf-onglets [aria-selected=true]").innerText()).includes("Fais-la parler"), "deux onglets : « 💬 Fais-la parler » (ouvert) et « ⚡ Réactions & gags »");
ok((await hugo.locator("#tf-reactions[hidden] #reactions").count()) === 1 && (await hugo.locator("#tf-parler:not([hidden]) .tf-texte textarea").count()) === 1, "ses réactions attendent dans leur onglet ; « Fais-la parler » : son texte");
// (la page descend : sa figurine reste en vue, sous la barre du haut)
await hugo.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await hugo.waitForTimeout(400);
const descendu = await hugo.evaluate(() => window.scrollY);
const enVue = await hugo.locator(".tf-moi .tf-hero .fqp-fig").boundingBox();
const barre = await hugo.locator(".mc-barre").boundingBox();
ok(descendu > 100 && enVue && barre && enVue.y >= barre.y + barre.height - 1 && enVue.y < barre.height + 40, `la page descend (${Math.round(descendu)} px) : sa figurine reste en vue, juste sous la barre (${Math.round(enVue?.y ?? -1)} px)`);
await hugo.screenshot({ path: `${D}/ma-figurine-0b2-en-bas.png` });
await hugo.evaluate(() => window.scrollTo(0, 0));
// ⚡ l'autre onglet : ses réactions et ses gags
await hugo.locator("#tf-o-reactions").click();
ok((await hugo.locator("#tf-reactions:not([hidden]) #reactions").count()) === 1 && (await hugo.locator("#tf-parler[hidden]").count()) === 1, "⚡ « Réactions & gags » : ses réactions, à la place de « Fais-la parler »");
await hugo.locator("#tf-o-parler").click();
// 🔒 le cadenas doré, à côté de son prénom : sa figurine n'est pas encore protégée
ok((await texte(hugo, ".mc-barre .mc-cadenas")).includes("Sauvegarder") && (await hugo.locator(".mc-barre .mc-cadenas").getAttribute("aria-label")).includes("ne la perds jamais"), "🔒 en haut, un cadenas doré : « Sauvegarder »");

// ═══ 🗓️ SA FIGURINE DU MOIS, MÉRITÉE : DIX JOURS SUR CLIKME CE MOIS-CI (lot 3 ; des jours de rencontres jusqu'à ce que
// « Rencontres » parte, le 7 novembre 2026) ═══
const mois = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date()).slice(0, 7);
// (ses jours de présence : aujourd'hui en premier — la page le noterait sinon —, puis d'autres jours du mois)
const sesJours = (n) => {
  const auj = jour(new Date());
  const autres = Array.from({ length: 28 }, (_, k) => `${mois}-${String(k + 1).padStart(2, "0")}`).filter((j) => j !== auj);
  return fetch(`${STOCK}/figurines-clients/${HUGO.id}/presence.json`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jours: [auj, ...autres].slice(0, n) }),
  });
};
// ce qu'il a dit ce mois-ci (son journal) : sa phrase du mois s'en sert
await fetch(`${STOCK}/figurines-clients/${HUGO.id}/journal/${mois}.json`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ entrees: [{ type: "question", le: new Date().toISOString(), cle: "essai", question: "Ton petit plaisir du dimanche ?", texte: "un croissant au lit" }] }),
});
await sesJours(9);
const demanderMois = () =>
  hugo.evaluate(async () => {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mois" }) });
    return { s: r.status, j: await r.json() };
  });
const neuf9 = await demanderMois();
ok(neuf9.s === 400 && neuf9.j.error === "Encore 1 jour sur ClikMe ce mois-ci." && neuf9.j.mois?.courante?.etat === "a-gagner" && neuf9.j.mois.courante.jours === 9, `à neuf jours, pas encore : elle se mérite (${neuf9.s}, ${neuf9.j.error})`);
await hugo.goto(`${BASE}/collection?v=${Date.now()}#mois`, { waitUntil: "networkidle" });
await hugo.waitForSelector("#o-personnage .fm .fm-gagner", { timeout: 30000 });
const gagner = await texte(hugo, "#o-personnage .fm");
ok(
  gagner.includes("TA FIGURINE DU MOIS") && gagner.includes("9/10 jours sur ClikMe ce mois-ci") && gagner.includes("Encore 1 jour :") && (await hugo.locator("#o-personnage .fm .fm-jours i.vecu").count()) === 9,
  `#mois mène à « Moi », où elle se mérite : neuf jours sur dix (${gagner.slice(0, 160)})`,
);
ok((await hugo.locator("#o-personnage").isVisible()) && (await hugo.locator(".mc-barre button.mc-moi.pris").count()) === 1 && (await hugo.locator(".mc-nav button.pris").count()) === 0 && (await hugo.locator("#o-rencontre").count()) === 0, "elle est dans « Moi », sous son prénom (« Rencontres » est effacé)");
ok((await texte(hugo, "#o-personnage .fm a.fm-lien")).includes("Le mème du jour") && (await hugo.locator('#o-personnage .fm a.fm-lien[href="#jour"]').count()) === 1, "« 🔥 Le mème du jour › » : la raison de revenir aujourd'hui");
await fermerPablito(hugo, "#o-personnage");
await hugo.screenshot({ path: `${D}/ma-figurine-0c-mois-a-gagner.png` });
// LE DIXIÈME JOUR : elle se fabrique toute seule (ici sans moteur d'image : sa figurine, avec le thème et sa phrase)
await sesJours(10);
await hugo.reload({ waitUntil: "networkidle" });
await hugo.waitForSelector("#o-personnage .fm .fm-carte img", { timeout: 60000 });
const fiche = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/mois/${mois}.json`)).json().catch(() => null);
ok(fiche?.mois === mois && fiche.image === `${HUGO.id}/mois/${mois}.webp` && fiche.expression && fiche.cle && fiche.parMoteur === false, `elle est rangée dans son seau privé (${JSON.stringify(fiche)?.slice(0, 160)})`);
ok(/croissant au lit/.test(fiche?.phrase ?? ""), `sa phrase du mois reprend ce qu'il a dit ce mois-ci (${fiche?.phrase})`);
ok((await fetch(`${STOCK}/figurines-clients/${HUGO.id}/mois/${mois}-p.webp`)).status === 200, "🎭 elle sait déjà parler (sa bouche ouverte, faite avec elle)");
const prete = await texte(hugo, "#o-personnage .fm");
ok(prete.includes("TA PHRASE DU MOIS") && prete.includes("croissant au lit") && prete.includes(`Son visage du mois : ${fiche?.expression}`), `la révélation : sa figurine du mois, son visage du mois, sa phrase (${prete.slice(0, 200)})`);
ok(await hugo.locator("#o-personnage .fm .fm-carte img").evaluate((i) => i.complete && i.naturalWidth > 0), "son image s'affiche");
const encore = await demanderMois();
const fiche2 = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/mois/${mois}.json`)).json().catch(() => null);
ok(encore.s === 200 && encore.j.mois?.courante?.etat === "prete" && fiche2?.le === fiche?.le, "une seule par mois : la redemander ne la refait pas");
ok((await debordement(hugo)) <= 0, "« Moi » ne déborde pas");
await hugo.screenshot({ path: `${D}/ma-figurine-0d-mois-prete.png`, fullPage: true });
// 🎭 « FAIS-LA PARLER » : elle devient un LOOK du studio (plus d'album : ses figurines du mois servent à faire des mèmes)
await hugo.locator("#o-personnage .fm .fm-parler").click();
await hugo.waitForFunction(() => document.querySelector(".tf-looks button.pris")?.textContent?.match(/[A-Z]/) && !document.querySelector(".tf-looks button.pris img")?.src.includes("neutre-essai"), null, { timeout: 30000 });
// (l'onglet suit l'adresse : un instant après)
await hugo.waitForFunction(() => location.hash === "#figurine" && document.querySelector(".mc-nav button.pris")?.textContent?.includes("Créer"), null, { timeout: 15000 }).catch(() => null);
const hero = await hugo.locator(".tf-moi .tf-hero img").first().getAttribute("src");
ok(/#figurine$/.test(hugo.url()) && (await hugo.locator(".mc-nav button.pris").innerText()).includes("Créer"), "« Fais-la parler » ouvre « Créer »");
ok(
  (await hugo.locator(".tf-looks button").count()) === 2 && (await texte(hugo, ".tf-looks button.pris")).includes("Novembre") === mois.endsWith("-11") && hero?.includes(`/mois/${mois}`),
  `son look du mois est pris : c'est elle qui parle (${await texte(hugo, ".tf-looks button.pris")}, ${hero?.slice(-60)})`,
);
ok((await hugo.locator(".tf-moi .tf-expr").count()) === 0 && (await texte(hugo, ".tf-scene .tf-note")).includes("Son visage du mois"), "avec un look : son visage du mois (plus de choix d'expression)");
await hugo.screenshot({ path: `${D}/ma-figurine-0e-look.png`, fullPage: true });
// le look de tous les jours revient d'un toucher
await hugo.locator(".tf-looks button").first().click();
ok((await hugo.locator(".tf-moi .tf-expr").count()) === 1, "« De tous les jours » : ses expressions reviennent");
ok((await texte(hugo, "#o-figurine .fm-apercu")).includes("est arrivée"), "dans « Créer » : sa figurine du mois est arrivée (un toucher la prend)");

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
await neuf.locator("#creer .tf-accord:not(.tf-majeur) input").check();
// 🔞 réservée aux 15 ans et plus : sans « J’ai 15 ans ou plus », pas d'envoi (ni par l'écran, ni par la route)
ok((await texte(neuf, "#creer .tf-majeur")).includes("J’ai 15 ans ou plus") && (await neuf.locator("#creer .tf-envoyer").isDisabled()), "« J’ai 15 ans ou plus » : sans elle, pas d'envoi");
const sansAge = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "photo", photo: "data:image/png;base64,AAAA", accord: true, ville: "dax", prenom: "Personne" }) });
ok(sansAge.status === 400 && /15 ans et plus/.test((await sansAge.json()).error ?? "") && (await lire("human_habitants", "prenom=eq.Personne")).length === 0, "sans son âge déclaré, la route n'ouvre pas de compte");
await neuf.locator("#creer .tf-majeur input").check();
await neuf.locator("#creer .tf-envoyer").click();
await neuf.waitForSelector(".tf-annonce", { timeout: 30000 });
const zoe = (await lire("human_habitants", "prenom=eq.Zoé"))[0];
ok(zoe?.ville_slug === "dax" && (await neuf.context().cookies()).some((c) => c.name === "clikme_habitant"), `son compte est ouvert, à Dax, avec son prénom (${zoe?.ville_slug})`);
const [figZoe] = await lire("clik_ma_figurine", `habitant_id=eq.${zoe?.id}`);
ok(figZoe?.photo?.startsWith(`${zoe?.id}/photo-`) && figZoe?.accord_le, "sa photo est rangée, son accord noté");
const ageZoe = await (await fetch(`${STOCK}/figurines-clients/${zoe?.id}/majeur.json`)).json().catch(() => null);
ok(ageZoe?.age === 15 && ageZoe.le, `son âge déclaré est noté (${JSON.stringify(ageZoe)})`);
const sansVille = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "photo", photo: "data:image/png;base64,AAAA", accord: true, ville: "atlantide" }) });
ok(sansVille.status === 400, "une ville sans commerce ClikMe : pas de compte");

// ═══ ⏱️ PENDANT LA FABRICATION : UN ÉCRAN SIMPLE (9 novembre 2026, le propriétaire : « l'écran est trop chargé ») ═══
ok((await neuf.locator(".tf-pendant").count()) === 0 && (await texte(neuf, ".tf-annonce")).includes("On fabrique ta figurine"), "pendant la fabrication : « On fabrique ta figurine », sans rien de plus à préparer");
ok((await debordement(neuf)) <= 0, "l'attente ne déborde pas");
await neuf.screenshot({ path: `${D}/ma-figurine-0f-attente.png`, fullPage: true });
// 🎉 SA FIGURINE APPARAÎT : son studio
for (const [nom, src] of [
  ["neutre", "public/direct/double/pied/salut-1.webp"],
  ["parle", "public/direct/double/parle-1.webp"],
]) {
  await fetch(`${STOCK}/figurines-clients/${zoe.id}/${nom}-essai.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fs.readFileSync(src) });
}
await fetch(`${F}/clik_ma_figurine?habitant_id=eq.${zoe.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ neutre: `${zoe.id}/neutre-essai.webp`, parle: `${zoe.id}/parle-essai.webp`, prete_le: new Date().toISOString() }),
});
await neuf.reload({ waitUntil: "networkidle" });
await fermerPablito(neuf, "#o-figurine");
await neuf.waitForSelector(".tf-moi .fqp", { timeout: 30000 });
ok((await neuf.locator(".tf-revele").count()) === 0, "sa figurine apparaît : son studio, prêt pour son premier mème");
await neuf.screenshot({ path: `${D}/ma-figurine-0g-revele.png` });

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
await lea.locator(".tf-accord:not(.tf-majeur) input").check();
await lea.locator(".tf-majeur input").check();
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
ok((await texte(lea, ".tf-onglets [aria-selected=true]")).includes("Fais-la parler"), "sa figurine est là : fais-la parler");
await lea.locator(".mc-barre .mc-cadenas").click();
await lea.waitForSelector(".tf-feuille.ouverte .cn-proteger", { timeout: 10000 });
ok((await texte(lea, ".tf-feuille.ouverte .cn-proteger")).includes("Ne perds jamais ta figurine"), "🔐 le cadenas doré : son adresse peut protéger sa figurine (un code pour la retrouver)");
await lea.screenshot({ path: `${D}/ma-figurine-1-cadenas.png` });
await lea.locator(".tf-feuille.ouverte .tf-feuille-fermer").click();
await lea.waitForFunction(() => !document.querySelector(".tf-feuille.ouverte"), null, { timeout: 5000 });
await lea.locator(".tf-moi .tf-g-visage").click();
ok((await lea.locator(".tf-moi .tf-expr button").count()) === 8 && (await lea.locator(".tf-moi .tf-expr button.ferme").count()) === 0, "huit visages à lui donner, tous ouverts (dont le fou rire, la grimace et l'amour)");
// 😍 L'AMOUR (7 novembre 2026) : son visage amoureux est demandé, et des cœurs montent autour d'elle en attendant
await lea.locator(".tf-moi .tf-expr button", { hasText: "Amour" }).click();
ok((await lea.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "amour" && (await lea.locator(".tf-moi .fqp-coeurs i").count()) === 3, "😍 l'amour : des cœurs montent autour d'elle");
await lea.screenshot({ path: `${D}/ma-figurine-1a-amour.png` });
await lea.locator(".tf-moi .tf-expr button", { hasText: "Fou rire" }).click();
ok((await lea.locator(".tf-moi .fqp").getAttribute("data-sentiment")) === "rire", "le fou rire");
await lea.locator(".tf-moi .tf-g-animer").click();
await lea.locator(".tf-moi .tf-danse").click();
ok((await lea.locator(".tf-moi .fqp.danse .fqp-notes").count()) === 1 && (await texte(lea, ".tf-moi .tf-g-animer")).includes("Elle danse"), "🕺 elle danse (des notes de musique autour ; « Animer » le dit)");
await lea.locator(".tf-moi .tf-g-visage").click();
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
ok((await lea.locator(".tf-cites").count()) === 0 && (await texte(lea, ".tf-envoyer")).includes("Créer mon mème"), "« 🎭 Créer mon mème » (plus de commerces à cocher : le mème, rien d'autre)");
await lea.screenshot({ path: `${D}/ma-figurine-1-message.png`, fullPage: true });
// 🎭 SON MÈME : la vidéo se fabrique sous ses yeux, puis part au seau
await lea.locator(".tf-envoyer").click();
await lea.waitForSelector(".tf-meme-toile.visible", { timeout: 20000 });
ok(true, "son mème se fabrique sous ses yeux");
await lea.waitForTimeout(1800);
await lea.locator(".tf-meme-toile").screenshot({ path: `${D}/ma-figurine-1b-meme.png` });
await lea.waitForSelector(".tf-meme-pret video", { timeout: 90000 });
const lien = await lea.locator(".tf-adresse").inputValue();
ok(/\/figurine\/[a-z0-9]{12}$/.test(lien), `son lien (${lien})`);
const partage = await lea.locator(".tf-meme-pret .tf-partager-meme").count();
const wa = partage ? "" : await lea.locator(".tf-meme-pret .tf-wa").getAttribute("href");
ok(partage === 1 || wa === `https://wa.me/?text=${encodeURIComponent(lien)}`, "sans texte ni blabla : le mème lui-même (la feuille de partage), sinon son lien seul");
ok((await lea.locator(".tf-meme-pret a[download]").count()) === 1, "« ⬇️ La vidéo » : elle peut l'enregistrer");
ok((await texte(lea, ".tf-feuille.ouverte .tf-meme-titre")) === "Ton mème est prêt ✅", "son mème prêt monte dans une feuille, en bas de l'écran : « Ton mème est prêt ✅ »");
const publicTexte = await texte(lea, ".tf-meme-pret .tf-public");
ok(publicTexte === "🌍 Poster sur le fil de Dax" && (await texte(lea, ".tf-public-dit")).includes("dans « Découvrir »") && (await lea.locator(".tf-meme-pret .tf-public.pris").count()) === 0, `« ${publicTexte} » (dans « Découvrir ») : proposé, jamais fait sans elle`);
const id = lien.split("/").pop();
const [msg] = await lire("clik_figurine_message", `id=eq.${id}`);
ok(msg && JSON.stringify(msg.commerces) === "[]" && msg.son.startsWith(`${LEA.id}/m-${id}.`) && msg.duree > 1 && msg.duree <= 16, `le message : sa voix lue (${msg?.duree} s)`);
ok(msg?.sentiment === "joie" && msg?.texte === "Coucou Camille ! On se voit ce soir ?" && msg?.voix === "chaleureuse", `le message porte sa joie, son texte et sa voix (${msg?.sentiment}, ${msg?.voix})`);
const cote = await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/m-${id}.json`)).json().catch(() => ({}));
ok(cote.meme?.startsWith(`${LEA.id}/meme-${id}.`) && /^video\/(mp4|webm)$/.test(cote.memeType) && cote.danse === true, `son mème est rangé à côté du message (${cote.meme}, ${cote.memeType})`);
const octets = (await (await fetch(`${STOCK}/figurines-clients/${cote.meme}`)).arrayBuffer()).byteLength;
ok(octets > 20_000, `la vidéo de son mème (${Math.round(octets / 1024)} Ko)`);
ok((await api(lea, { action: "meme-pose", id: "zzzzzzzzzzzz", type: "video/mp4" })).statut === 404, "un mème pour le message d'un autre : non");
ok((await debordement(lea)) <= 0 && !/exemple/i.test(await texte(lea, "main")), "« Ma collection » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/ma-figurine-2-envoye.png` });
// la feuille se ferme ; « ✅ Ton mème est prêt · le revoir » la rouvre
await lea.locator(".tf-feuille.ouverte .tf-feuille-fermer").click();
await lea.waitForFunction(() => !document.querySelector(".tf-feuille.ouverte"), null, { timeout: 5000 });
ok((await texte(lea, ".tf-revoir")).includes("le revoir"), "fermée : « ✅ Ton mème est prêt · le revoir »");
await lea.locator(".tf-revoir").click();
await lea.waitForSelector(".tf-feuille.ouverte .tf-meme-pret video", { timeout: 5000 });
await lea.keyboard.press("Escape");
await lea.waitForFunction(() => !document.querySelector(".tf-feuille.ouverte"), null, { timeout: 5000 });

// ═══ ET AVEC SA PROPRE VOIX ═══
await lea.locator(".tf-modes button", { hasText: "Ma voix" }).click();
ok((await lea.locator(".tf-envoi").count()) === 0, "sa voix à elle : le message lu ne repart pas tel quel");
await lea.locator(".tf-micro").click();
await lea.waitForSelector(".tf-temps", { timeout: 15000 });
await lea.waitForTimeout(2600);
ok(/● [12] s \/ 15 s/.test(await texte(lea, ".tf-temps")), `le compteur tourne (${await texte(lea, ".tf-temps")})`);
await lea.locator(".tf-stop").click();
await lea.waitForSelector(".tf-envoyer", { timeout: 15000 });
ok((await lea.locator(".tf-moi .tf-ecouter").count()) === 1, "elle peut s'écouter, puis en faire un mème");

// ═══ UNE AMIE L'OUVRE : LE MÈME JOUE TOUT DE SUITE ═══
const amie = await tel(null);
await amie.goto(lien.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await amie.waitForSelector(".mr-meme video", { timeout: 60000 });
await amie.waitForFunction(() => {
  const v = document.querySelector(".mr-meme video");
  return v && v.readyState >= 2 && !v.paused && v.currentTime > 0.3;
}, null, { timeout: 20000 });
ok(true, "le mème joue tout de suite, sans rien toucher");
const mr = await texte(amie, ".mr");
ok(
  (await amie.locator(".mr h1, .mr-commerces, .mr-toi, .mr-dit, .mr-bulle").count()) === 0 && (await amie.locator(".mr-bouton").count()) === 1 && (await amie.locator(`.mr-bouton[href="/figurine/${id}/repondre"]`).count()) === 1 && (await texte(amie, ".mr-bouton")).includes("Crée ou réponds avec ton mème"),
  "sans texte ni blabla : le mème, et un seul bouton « Crée ou réponds avec ton mème »",
);
ok((await amie.locator(".mr-partager").count()) === 1 && (await texte(amie, ".mr-partager")).includes("Partager ce mème"), "dessous, discret : « 📲 Partager ce mème » (la vidéo elle-même, ou son lien)");
const muet = await amie.evaluate(() => document.querySelector(".mr-meme video").muted);
ok(!muet || (await amie.locator(".mr-son").count()) === 1, `le son : tout de suite si le navigateur le permet, sinon « Touche pour le son » (${muet ? "muet" : "avec le son"})`);
const titre = await amie.title();
ok(titre.startsWith("🎭 Le mème de Léa") && (await amie.locator('meta[property="og:image"]').count()) === 1 && (await amie.locator('meta[name="robots"][content*="noindex"]').count()) === 1, `le titre du lien, sa figurine en aperçu, et pas dans Google (${titre})`);
ok((await debordement(amie)) <= 0 && !/exemple/i.test(mr), "la page du mème ne déborde pas, sans le mot interdit");
await amie.waitForTimeout(600);
await amie.screenshot({ path: `${D}/ma-figurine-3-recu.png` });

// ═══ 💬 HUGO LUI RÉPOND EN DUO (« Crée ou réponds avec ton mème ») ═══
await hugo.goto(`${BASE}/figurine/${id}/repondre`, { waitUntil: "networkidle" });
ok(/\/collection\?repondre=[a-z0-9]{12}#figurine$/.test(hugo.url()), `« Crée ou réponds » : sa figurine, prête à répondre (${hugo.url()})`);
await fermerPablito(hugo, "#o-figurine");
await hugo.waitForSelector(".tf-moi .tf-reponse", { timeout: 30000 });
ok((await texte(hugo, ".tf-reponse")).includes("Tu réponds à Léa") && (await texte(hugo, ".tf-reponse")).includes("Coucou Camille"), "« ↩️ Tu réponds à Léa » : son mème, et ses mots");
// 🎁 SON PREMIER MÈME, DÉJÀ ÉCRIT ; ✨ LES MÈMES PRÊTS
ok((await hugo.locator(".tf-texte textarea").inputValue()).startsWith("Salut ! C’est moi… en figurine") && (await hugo.locator(".tf-premier").count()) === 0, "son premier mème est déjà écrit (le conseil se tait quand il répond)");
const prets = await hugo.locator(".tf-prets button:not(.tf-surprends)").allInnerTexts();
ok(prets.length >= 8 && prets[0].includes("Le mème du jour") && prets.some((x) => x.includes("Joyeux anniversaire")) && prets.some((x) => x.includes("Bravo")), `les mèmes prêts : le mème du jour d'abord, puis les occasions (${prets.slice(0, 4).join(" · ")}…)`);
await hugo.locator(".tf-quelle-voix button", { hasText: "voix d’homme" }).click();

// ═══ 🎲 « SURPRENDS-MOI ! » : CLIKME ÉCRIT SON MÈME (d'après sa carte de personnage) ; rien n'est dit sans lui ═══
ok((await hugo.locator(".tf-prets button").first().innerText()).includes("Surprends-moi"), "« 🎲 Surprends-moi ! » en tête des mèmes prêts");
const avantSurprise = await hugo.locator(".tf-texte textarea").inputValue();
const voixDites = [];
hugo.on("request", (r) => r.method() === "POST" && r.url().endsWith("/api/direct/ma-figurine") && /"action":"voix"/.test(r.postData() ?? "") && voixDites.push(r.postData()));
await hugo.locator(".tf-surprends").click();
await hugo.waitForSelector(".tf-surprise .tf-surprise-texte", { timeout: 20000 });
const surprise1 = (await texte(hugo, ".tf-surprise-texte")).replace(/^« | »$/g, "");
ok(surprise1.length > 10 && (await hugo.locator(".tf-surprise-carte").count()) === 1 && (await hugo.locator('.tf-surprise-carte[href="#personnage"]').count()) === 1, `sans carte : une surprise pour tous, et « 🃏 Fais ta carte de personnage » (${surprise1})`);
await hugo.waitForTimeout(400);
ok((await hugo.locator(".tf-texte textarea").inputValue()) === avantSurprise && voixDites.length === 0, "il la lit d'abord : rien n'est écrit ni dit tant qu'il ne l'a pas choisie");
await hugo.locator(".tf-surprise-encore").click();
await hugo.waitForFunction((t) => (document.querySelector(".tf-surprise-texte")?.textContent ?? "").replace(/^« | »$/g, "") !== t && !document.querySelector(".tf-surprise-encore")?.disabled, surprise1, { timeout: 20000 });
const surprise2 = (await texte(hugo, ".tf-surprise-texte")).replace(/^« | »$/g, "");
ok(surprise2 && surprise2 !== surprise1, `« 🎲 Encore » : une autre (${surprise2})`);
await hugo.screenshot({ path: `${D}/ma-figurine-3a-surprise.png` });
// sa carte de personnage : ce qu'il aime (les animaux), sa façon de parler — l'IA écrit d'après elle
await fetch(`${STOCK}/figurines-clients/${HUGO.id}/personnage.json`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    reponses: { elan: "a", ton: "a", jeu: "a", sort: "b", tete: "b", gout: "b", rythme: "b" },
    gouts: ["animaux", "musique"],
    phrase: "On n’est jamais trop curieux",
    fiche: { titre: "La Tornade qui fait rire", portrait: "Fonce d’abord.", pouvoir: "Ne jamais lâcher", faiblesse: "Le fromage", facon: "Des phrases courtes et directes, en forme le soir." },
    par: "local",
    le: new Date().toISOString(),
  }),
});
await hugo.locator(".tf-surprise-encore").click();
await hugo.waitForFunction(() => (document.querySelector(".tf-surprise small")?.textContent ?? "").includes("d’après ta carte"), null, { timeout: 20000 });
const surprise3 = (await texte(hugo, ".tf-surprise-texte")).replace(/^« | »$/g, "");
const consignes = await (await fetch(F.replace("/rest/v1", "/__ia"))).json();
const consigne = consignes.at(-1) ?? "";
ok(surprise3.includes("Les chiens du quartier") && (await hugo.locator(".tf-surprise-carte").count()) === 0, `avec sa carte : l'IA l'écrit d'après lui (les animaux) — « ${surprise3} »`);
ok(/animaux/.test(consigne) && /Agis tout de suite|agis tout de suite/.test(consigne) && /On n’est jamais trop curieux/.test(consigne) && !/Hugo/.test(consigne) && /Ne devine JAMAIS le genre/.test(consigne) && /l'alcool/.test(consigne), "la consigne : sa carte (ses goûts, ses réponses, sa phrase), jamais son prénom ; ni genre deviné, ni alcool");
// « C'est moi ✓ » : le texte est écrit, son visage choisi, et sa figurine le dit
await hugo.locator(".tf-surprise-oui").click();
await hugo.waitForSelector(".tf-envoyer", { timeout: 30000 });
ok((await hugo.locator(".tf-texte textarea").inputValue()) === surprise3 && (await hugo.locator(".tf-surprise").count()) === 0 && voixDites.length === 1, "« C’est moi ✓ » : le texte est à lui, et sa figurine le dit (sa voix, une seule fois)");
// l'IA dérape (de l'alcool) : écartée, une réplique de la réserve à la place ; et un plafond par jour
const derape = await api(hugo, { action: "surprise", sauf: ["Essai : propose un apéro"] });
ok(derape.statut === 200 && derape.par === "local" && derape.carte === true && !/ap[ée]ro/i.test(derape.texte), `l'IA parle d'alcool : écartée, la réserve à la place (« ${derape.texte} »)`);
const jourS = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const compteS = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/surprises.json`)).json().catch(() => ({}));
ok(compteS.jour === jourS && compteS.n === 4 && compteS.ia === 2, `ses tirages du jour sont comptés (${JSON.stringify(compteS)})`);
await fetch(`${STOCK}/figurines-clients/${HUGO.id}/surprises.json`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jour: jourS, n: 40, ia: 10 }) });
ok((await api(hugo, { action: "surprise" })).statut === 429, "assez pour aujourd'hui : 40 surprises par jour au plus");
await fetch(`${STOCK}/figurines-clients/${HUGO.id}/surprises.json`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jour: jourS, n: 0, ia: 0 }) });
ok((await debordement(hugo)) <= 0 && !/exemple/i.test(await texte(hugo, "#o-figurine")), "le studio ne déborde pas, sans le mot interdit");
// 🔔 Léa a les notifications (un faux téléphone) : elle saura qu'on lui a répondu
const telLea = telephone("lea-figurine");
ok((await api(lea, { action: "notif", abonnement: telLea.abonnement })).statut === 200, "Léa allume les notifications (un faux téléphone)");
await hugo.locator(".tf-prets button", { hasText: "Bravo" }).click();
ok((await hugo.locator(".tf-texte textarea").inputValue()).startsWith("Bravo ! Quelle classe."), "un toucher sur « Bravo » : le texte est écrit, et elle le dit");
await hugo.waitForSelector(".tf-envoyer", { timeout: 30000 });
await hugo.locator(".tf-envoyer").click();
await hugo.waitForSelector(".tf-meme-toile.visible", { timeout: 20000 });
await hugo.waitForTimeout(1500);
await hugo.locator(".tf-meme-toile").screenshot({ path: `${D}/ma-figurine-3b-duo.png` });
await hugo.waitForSelector(".tf-meme-pret video", { timeout: 90000 });
const idDuo = (await hugo.locator(".tf-adresse").inputValue()).split("/").pop();
const coteDuo = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/m-${idDuo}.json`)).json().catch(() => ({}));
ok(coteDuo.repondA === id && coteDuo.meme, `sa réponse est un mème en duo, rattachée à celui de Léa (${JSON.stringify(coteDuo)})`);
await hugo.waitForTimeout(800);
const duoNotif = (await recus(telLea)).find((n) => /t’a répondu/.test(n.title));
ok(duoNotif?.title === "↩️ Hugo t’a répondu en duo !" && duoNotif.url === "/collection#memes", `↩️ Léa est prévenue : « ${duoNotif?.title} » (le toucher ouvre « Mes mèmes »)`);
ok((await hugo.locator(".tf-reponse").count()) === 0, "sa réponse partie : son prochain mème sera à lui");
ok((await hugo.locator(".tf-meme-pret .tf-public").count()) === 0, "un duo : pas de « Découvrir » (il montre aussi la figurine de Léa)");
ok((await api(hugo, { action: "rien" })).statut === 400 && (await hugo.evaluate(async () => (await (await fetch("/api/direct/ma-figurine")).json()).etat.etapes)).includes("duo"), "👣 une étape franchie : « Répondre en duo à un mème »");
// 📥 « MES MÈMES » (à la place de l'album) : Léa voit qui lui a répondu, et ses mèmes vus
// (son visage de joie est fait, maintenant : sa vignette le montre — 8 novembre 2026, « j'ai toujours la même tête »)
const [figLea] = await lire("clik_ma_figurine", `habitant_id=eq.${LEA.id}`);
const dossierLea = `${LEA.id}/expr-${createHash("sha1").update(figLea.neutre).digest("hex").slice(0, 16)}`;
await fetch(`${STOCK}/figurines-clients/${dossierLea}/joie-n.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fs.readFileSync("public/direct/double/pied/salut-1.webp") });
await lea.goto(`${BASE}/collection?v=${Date.now()}#album`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-memes .mm-reponses .mm-carte", { timeout: 30000 });
await fermerPablito(lea, "#o-memes");
const mmLea = await texte(lea, "#o-memes");
ok(/#album$/.test(lea.url()) && (await lea.locator(".mc-nav button.pris").innerText()).includes("Mes mèmes"), "l'ancien lien de l'album ouvre « Mes mèmes »");
ok(
  mmLea.includes("On t’a répondu") && (await texte(lea, ".mm-reponses .mm-qui")).includes("Hugo t’a répondu") && (await lea.locator(`.mm-reponses a.mm-repondre[href="/figurine/${idDuo}/repondre"]`).count()) === 1,
  `« On t'a répondu » : la réponse en duo de Hugo, et « Lui répondre » (${mmLea.slice(0, 120)})`,
);
ok(
  (await lea.locator(`#o-memes .mm-bloc:not(.mm-reponses) a.mm-image[href="/figurine/${id}"]`).count()) === 1 && /👀 \d+ vues?/.test(mmLea) && mmLea.includes("↩️ 1 réponse"),
  "ses mèmes : vus combien de fois, et la réponse",
);
const vignette = await lea.locator(`#o-memes .mm-bloc:not(.mm-reponses) a.mm-image[href="/figurine/${id}"] img`).getAttribute("src");
ok(vignette?.includes(`${dossierLea}/joie-n.webp`), `sa vignette : sa tête de ce mème-là, la joie (${vignette?.split("?")[0].slice(-60)})`);
ok((await debordement(lea)) <= 0 && !/exemple/i.test(mmLea), "« Mes mèmes » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/ma-figurine-3c-mes-memes.png`, fullPage: true });
// l'amie (sans compte) a ouvert le mème de Léa : il l'attend dans « Reçus » (même téléphone, un autre onglet)
const amieMemes = await amie.context().newPage();
await amieMemes.goto(`${BASE}/collection#memes`, { waitUntil: "networkidle" });
await amieMemes.waitForSelector("#o-memes .mm-bloc .mm-carte", { timeout: 30000 });
ok((await texte(amieMemes, "#o-memes")).includes("Reçus") && (await amieMemes.locator(`#o-memes a.mm-repondre[href="/figurine/${id}/repondre"]`).count()) === 1, "sans compte : le mème reçu l'attend dans « Reçus », avec « Répondre »");
await amieMemes.close();

// ═══ 🌍 SON MÈME DANS « DÉCOUVRIR », SUR SON ACCORD (l'étape 3) ═══
const publicsDe = (p) => p.evaluate(async () => (await (await fetch("/api/direct/memes-commerces", { cache: "no-store" })).json()).publics ?? []);
ok((await publicsDe(hugo)).every((m) => m.id !== id), "par défaut, son mème reste entre elle et ceux à qui elle l'envoie");
const bascule = lea.locator(`#o-memes .mm-bloc:not(.mm-reponses) .mm-public`);
ok((await bascule.count()) === 1 && (await bascule.innerText()).includes("Montrer dans Découvrir"), "« 🌍 Montrer dans Découvrir » : un geste à elle");
// (son accord, dans une fenêtre de ClikMe : elle dit « Pas maintenant »)
await bascule.click();
const accord = await repondreFenetre(lea, false);
await lea.waitForTimeout(500);
ok(/visible par les gens de ta ville/.test(accord) && /retirer quand tu veux/.test(accord) && !(await fetch(`${STOCK}/figurines-clients/${LEA.id}/m-${id}.json`).then((r) => r.json())).public, "on lui demande d'abord son accord ; « Annuler » : rien ne bouge");
// 🔞 elle avait sa figurine avant qu'on demande l'âge : la première fois, on le lui demande (puis le geste repart)
await fetch(`${STOCK}/figurines-clients`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefixes: [`${LEA.id}/majeur.json`] }) });
const refusAge = await api(lea, { action: "public", id, public: true });
ok(refusAge.statut === 403 && refusAge.age === true, `sans son âge déclaré, pas de « Découvrir » (${refusAge.statut}, ${refusAge.error})`);
await bascule.click();
const questions = [await repondreFenetre(lea), await repondreFenetre(lea)];
await lea.waitForSelector("#o-memes .mm-public.pris", { timeout: 15000 });
ok(questions.length === 2 && /15 ans ou plus \?/.test(questions[1]) && (await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/majeur.json`)).json().catch(() => null))?.age === 15, `son accord, puis son âge, une fois (${questions[1]?.slice(0, 60)})`);
const coteP = await (await fetch(`${STOCK}/figurines-clients/${LEA.id}/m-${id}.json`)).json().catch(() => ({}));
ok(coteP.public?.ville === "dax" && (await fetch(`${STOCK}/figurines-clients/publics/dax/${coteP.public.jour}/${id}.json`)).status === 200, `« D'accord » : son mème va dans « Découvrir », pour les gens de Dax (${JSON.stringify(coteP.public)})`);
ok((await texte(lea, "#o-memes .mm-public.pris")).includes("retirer"), "« 🌍 Dans Découvrir · retirer » : elle le retire quand elle veut");
await lea.screenshot({ path: `${D}/ma-figurine-3d-public.png`, fullPage: true });
// Hugo, de Dax, le voit dans « Découvrir » ; « Lui répondre » : en duo
await hugo.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "networkidle" });
await hugo.waitForSelector("#o-decouvrir .dv-carte.client", { timeout: 60000 });
await fermerPablito(hugo, "#o-decouvrir");
const carteLea = await texte(hugo, "#o-decouvrir .dv-carte.client");
// (le lot 2 : ils ont fait un duo, ils sont « proches » — leurs mèmes passent d'abord)
ok(carteLea.includes("Léa") && carteLea.includes("👯 Proche") && (await hugo.locator(`#o-decouvrir .dv-carte.client.ami a.dv-repondre[href="/figurine/${id}/repondre"]`).count()) === 1, `Hugo, de Dax, le voit dans « Découvrir », en proche (leur duo) : « ↩️ Répondre » (${carteLea.slice(0, 80)})`);
ok((await hugo.locator("#o-decouvrir .dv-carte.client .dv-signaler").count()) === 1, "et « Signaler », s'il le faut");
ok((await debordement(hugo)) <= 0 && !/exemple/i.test(await texte(hugo, "#o-decouvrir")), "« Découvrir » ne déborde pas, sans le mot interdit");
await hugo.screenshot({ path: `${D}/ma-figurine-3e-decouvrir.png` });
// jamais un duo (il montre aussi la figurine de Léa) ; jamais le mème d'un autre ; sans compte, rien des gens
const duoPublic = await api(hugo, { action: "public", id: idDuo, public: true });
ok(duoPublic.statut === 400 && /duo/.test(duoPublic.error ?? ""), `un duo ne va pas dans « Découvrir » (${duoPublic.error})`);
ok((await api(hugo, { action: "public", id, public: true })).statut === 404, "le mème d'un autre : non");
// 🗑️ HUGO EFFACE SON DUO (« Mes mèmes », 8 novembre 2026) : une fenêtre de ClikMe le lui demande ; il disparaît partout
ok((await api(lea, { action: "effacer", id: idDuo })).statut === 400 && !(await lire("clik_figurine_message", `id=eq.${idDuo}`))[0]?.retire_le, "le mème d'un autre ne s'efface pas");
await hugo.goto(`${BASE}/collection?v=${Date.now()}#memes`, { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-memes");
const carteDuo = hugo.locator(`#o-memes .mm-carte:has(a.mm-image[href="/figurine/${idDuo}"])`);
await carteDuo.waitFor({ timeout: 30000 });
await carteDuo.locator(".mm-effacer").click();
const questionEffacer = await repondreFenetre(hugo);
await hugo.waitForFunction((i) => !document.querySelector(`#o-memes a.mm-image[href="/figurine/${i}"]`), idDuo, { timeout: 15000 });
const [duoEfface] = await lire("clik_figurine_message", `id=eq.${idDuo}`);
const videoDuo = await fetch(`${STOCK}/figurines-clients/${coteDuo.meme}`);
ok(
  questionEffacer.includes("Effacer ce mème ?") && Boolean(duoEfface?.retire_le) && videoDuo.status !== 200 && (await fetch(`${BASE}/figurine/${idDuo}`)).status === 404,
  `🗑️ il efface son duo : la fenêtre le lui demande, il quitte « Mes mèmes », sa vidéo est effacée, son lien ne mène plus à rien (${videoDuo.status})`,
);
ok((await publicsDe(amie)).length === 0, "sans compte (sans ville) : pas de mèmes des gens");
// elle le retire : il quitte « Découvrir » tout de suite ; puis le remet
ok((await api(lea, { action: "public", id, public: false })).public === false && (await fetch(`${STOCK}/figurines-clients/publics/dax/${coteP.public.jour}/${id}.json`)).status === 404 && (await publicsDe(hugo)).every((m) => m.id !== id), "elle le retire : il quitte « Découvrir » tout de suite");
ok((await api(lea, { action: "public", id, public: true })).public === true && (await publicsDe(hugo)).some((m) => m.id === id), "elle le remet");
// UN MESSAGE AVEC SON LOOK : c'est elle qui parle chez celui qui le reçoit
const voixH = await api(hugo, { action: "voix", texte: "Mon look du mois, ça te plaît ?", voix: "chaleureuse" });
const avecLook = await api(hugo, { action: "message", son: voixH.son, duree: 1.5, commerces: [], texte: "Mon look du mois, ça te plaît ?", voix: "chaleureuse", look: mois });
const coteLook = await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/m-${avecLook.id}.json`)).json().catch(() => ({}));
const vuLook = await hugo.evaluate(async (i) => (await (await fetch(`/api/direct/ma-figurine?repondre=${i}`)).json()).meme, avecLook.id);
ok(coteLook.look === mois && vuLook?.images?.n?.includes(`/mois/${mois}.webp`) && vuLook.images.p.includes(`/mois/${mois}-p.webp`), `le message part avec son look (${coteLook.look}, ${vuLook?.images?.n?.slice(-40)})`);
const fauxLook = await api(hugo, { action: "message", son: voixH.son, duree: 1.5, commerces: [], look: "2001-01" });
ok(!(await (await fetch(`${STOCK}/figurines-clients/${HUGO.id}/m-${fauxLook.id}.json`)).json().catch(() => ({}))).look, "un look qu'il n'a pas : ignoré");

// 📈 LA MESURE : un nouveau venu arrive par le mème de Léa et crée sa figurine
const curieux = await tel(null);
await curieux.goto(`${BASE}/figurine/${id}/repondre`, { waitUntil: "networkidle" });
await fermerPablito(curieux);
await curieux.waitForSelector("#creer .tf-choisir input", { timeout: 60000 });
await curieux.locator("#creer .tf-choisir input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await curieux.waitForSelector("#creer .tf-choisir img", { timeout: 15000 });
await curieux.locator("#creer .tf-prenom-photo").fill("Noé");
if (await curieux.locator("#creer .tf-ville").count()) await curieux.locator("#creer .tf-ville").selectOption("dax");
await curieux.locator("#creer .tf-accord:not(.tf-majeur) input").check();
await curieux.locator("#creer .tf-majeur input").check();
await curieux.locator("#creer .tf-envoyer").click();
await curieux.waitForSelector(".tf-annonce", { timeout: 30000 });
await curieux.waitForTimeout(500);
const gestes = (await lire("clik_meme_evenement", `message_id=eq.${id}`)).map((x) => x.type);
const compte = (t) => gestes.filter((x) => x === t).length;
ok(compte("cree") === 1 && compte("vu") >= 1 && compte("clic") === 2 && compte("reponse") === 1 && compte("nouveau") === 1, `la mesure : créé, ouvert, « Crée ou réponds » touché, une réponse, un nouveau créateur (${gestes.join(", ")})`);

// ═══ UN MESSAGE SANS MÈME (d'avant, ou d'un téléphone qui ne fait pas de vidéo) : sa figurine, qui parle au premier toucher ═══
const voixL = await api(lea, { action: "voix", texte: "Toi aussi, fais le tien !", voix: "chaleureuse" });
const sansMeme = await api(lea, { action: "message", son: voixL.son, duree: 1.5, commerces: [], sentiment: "joie", texte: "Toi aussi, fais le tien !", voix: "chaleureuse" });
ok(sansMeme.statut === 200 && sansMeme.id, "un message sans vidéo");
const amie2 = await tel(null);
await amie2.goto(`${BASE}/figurine/${sansMeme.id}`, { waitUntil: "networkidle" });
await amie2.waitForSelector(".mr-meme.vivant .fqp", { timeout: 60000 });
ok(/toi aussi, fais le tien/i.test(await texte(amie2, ".mr-sous-titre")) && (await amie2.locator(".mr-son").count()) === 1, "sa figurine, ses mots en sous-titre, « Touche pour l'entendre »");
// la bouche s'ouvre sur les sons forts de la voix : la page note chaque ouverture (une machine lente les manque sinon)
await amie2.locator(".fqp-fig").evaluate((fig) => {
  window.__ouvertures = 0;
  new MutationObserver(() => fig.classList.contains("ouverte") && (window.__ouvertures += 1)).observe(fig, { attributes: true, attributeFilter: ["class"] });
});
const son = amie2.waitForResponse((r) => r.url().includes("/api/direct/ma-figurine/son"));
await amie2.mouse.click(195, 300);
const reponse = await son;
ok(reponse.status() === 200, `au premier toucher, sa voix arrive (${reponse.headers()["content-type"]})`);
let bouche = false;
for (let k = 0; k < 80 && !bouche; k++) {
  bouche = await amie2.evaluate(() => window.__ouvertures > 0);
  if (!bouche) await amie2.waitForTimeout(100);
}
ok(bouche, "la bouche bouge sur sa voix");
await amie2.waitForTimeout(400);
const [apres] = await lire("clik_figurine_message", `id=eq.${sansMeme.id}`);
ok(apres?.ecoutes === 1, `une écoute comptée (${apres?.ecoutes})`);

// ═══ ELLE LE SIGNALE ═══
await amie.locator(".mr-signaler").click();
ok((await repondreFenetre(amie)).includes("Signaler ce mème ?"), "« Signaler ce mème ? » : une fenêtre de ClikMe, plus celle du navigateur");
await amie.waitForSelector(".mr-signale", { timeout: 15000 });
await amie.reload({ waitUntil: "networkidle" });
ok((await texte(amie, ".mr")).includes("Ce mème a été signalé") && (await amie.locator(".mr-meme video, .fqp").count()) === 0, "signalé : il ne s'affiche plus");
ok((await fetch(`${BASE}/api/direct/ma-figurine/son?m=${id}`)).status === 404, "sa voix non plus");
ok((await publicsDe(hugo)).every((m) => m.id !== id) && (await api(lea, { action: "public", id, public: true })).statut === 400, "ni dans « Découvrir » (et il ne peut plus y revenir)");
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
await lea.waitForSelector(".tf-moi .tf-g-animer", { timeout: 30000 });
await lea.locator(".tf-moi .tf-g-animer").click();
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

const erreurs = [...hugo.err, ...neuf.err, ...lea.err, ...amie.err, ...amie2.err, ...curieux.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
