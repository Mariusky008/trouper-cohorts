// 📲 LE TALKIE-WALKIE PAR WHATSAPP (l'étape 5) — un message de figurine à quelqu'un qui n'a pas ClikMe
// (`app/collection/proches.tsx`, `app/t/[id]`, `lib/direct/talkie-serveur.ts`), contre le faux Supabase.
//
// Zoé, de Dax, touche « Lui parler par WhatsApp » : elle parle (un faux micro), « Ta figurine a compris ça » (la fausse
// transcription : deux phrases, trois têtes chacune), le prénom de Karim, « Envoyer par WhatsApp » : son message devient
// un lien (`/t/<id>`), prêt à partir (wa.me). Karim, sans compte, ouvre le lien : « Karim, Zoé t'a laissé un message avec
// sa figurine » (l'aperçu du lien aussi — un robot qui le fabrique ne compte pas comme une ouverture) ; il écoute (🤦
// puis 😂). « Réponds-lui avec ta figurine » : son selfie, son prénom, deux cases ; son compte s'ouvre à Dax et sa
// figurine se fabrique PENDANT qu'il dit sa réponse (ici, ClikMe la fait à la main : ses images posées dans le faux
// Supabase) ; quand elle est prête, elle a compris ; il envoie. « C'est parti ! » : ils sont proches, le message de Zoé
// ouvre leur conversation, Zoé est prévenue (« Karim t'a répondu avec sa figurine ! — Sa toute première »), et voit sa
// carte « Nouveau, grâce à toi ». Zoé ouvre son propre lien : « C'est ton message ». Trois liens par jour. Un lien de plus
// de trente jours s'efface. Léa, qui a déjà sa figurine, répond sans selfie. La mesure (`w-…`). Rien ne déborde, jamais
// le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { BASE, D, F, fermerPablito, lancer, recus, telephone } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json() : null;
};
const liste = async (prefix) =>
  (await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000 }) })).json()).map((x) => x.name);
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const dossierExpr = (h) => `${h}/expr-${crypto.createHash("sha1").update(`${h}/neutre-essai.webp`).digest("hex").slice(0, 16)}`;

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ZOE = { id: "adadadad-0000-4000-8000-000000000901", jeton: "jeton-zoe-whatsapp-0000001", prenom: "Zoé" };
const LEA = { id: "adadadad-0000-4000-8000-000000000902", jeton: "jeton-lea-whatsapp-0000001", prenom: "Léa" };
for (const x of [ZOE, LEA]) x.cle = cleProfil(x.id);

// ─── Dax (une ville ouverte : un commerce client), Zoé et Léa avec leur figurine ───
await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000000901", slug: "boulangerie-whatsapp", channel: "letter", business_name: "La Boulangerie", city: "40100 Dax", activite: "Boulangerie", published: true, est_client: true }]);
await semer("human_habitants", [ZOE, LEA].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [x, n, p] of [
  [ZOE, "pied/salut-1", "pied/parle-1"],
  [LEA, "pied/montre", "pied/montre"],
]) {
  await deposer(`${x.id}/neutre-essai.webp`, img(n), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(p), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [ZOE, LEA].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
for (const [cle, nom] of Object.entries({ tete: "reflechit", rire: "content" })) {
  await deposer(`${dossierExpr(ZOE.id)}/${cle}-n.webp`, img(nom), "image/webp");
  await deposer(`${dossierExpr(ZOE.id)}/${cle}-p.webp`, img(nom), "image/webp");
}

const route = async (qui, corps, chemin = "proches") => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;
const evenements = async (id) => (await lire("clik_meme_evenement", "select=message_id,type")).filter((e) => e.message_id === `w-${id}`).map((e) => e.type);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
async function tel(qui, nom) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${nom} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const capture = (p, nom) => p.screenshot({ path: `${D}/talkie-whatsapp-${nom}.png` });
async function tetesJouees(p, scene) {
  return p.evaluate(async (sel) => {
    const vues = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 15000) {
      const s = document.querySelector(sel);
      const t = s?.getAttribute("data-tete") ?? "";
      if (t && vues[vues.length - 1] !== t) vues.push(t);
      if (/^fini/.test(s?.querySelector(".fqp")?.getAttribute("data-lecture") ?? "")) break;
      await new Promise((ok) => setTimeout(ok, 50));
    }
    return vues;
  }, scene);
}

// Zoé a demandé les notifications : elle saura quand Karim lui répond
const telZoe = telephone("zoe-whatsapp");
ok((await route(ZOE, { action: "notif", abonnement: telZoe.abonnement }, "ma-figurine")).statut === 200, "Zoé a demandé les notifications");

// ═══ ZOÉ : « LUI PARLER PAR WHATSAPP » ═══
const zoe = await tel(ZOE, "Zoé");
await zoe.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(zoe);
await zoe.waitForSelector("#o-proches .pr-wa .pr-bouton", { timeout: 60000 });
ok((await texte(zoe, "#o-proches .pr-wa")).includes("Quelqu’un n’a pas ClikMe ?"), "dans « Proches » : « Quelqu'un n'a pas ClikMe ? »");
await zoe.locator("#o-proches .pr-wa .pr-bouton").click();
await zoe.waitForSelector(".pr-plein.pr-parler .pr-micro", { timeout: 15000 });
ok((await texte(zoe, ".pr-plein.pr-parler .pr-qui")).includes("Par WhatsApp") && (await zoe.locator(".pr-plein.pr-parler .pr-moi-fig").count()) === 1, "« Par WhatsApp, à quelqu'un qui n'a pas ClikMe » : sa figurine l'écoute");
await zoe.locator(".pr-plein.pr-parler .pr-micro").click();
await zoe.waitForSelector(".pr-plein.pr-parler .pr-temps", { timeout: 15000 });
await zoe.waitForTimeout(3800);
await zoe.locator(".pr-plein.pr-parler .pr-micro").click();
await zoe.waitForSelector(".pr-plein.pr-parler .pr-choix li", { timeout: 30000 });
ok((await zoe.locator(".pr-plein.pr-parler .pr-choix li").count()) === 2 && (await zoe.locator(".pr-plein.pr-parler .pr-pour input").count()) === 1, "« Ta figurine a compris ça » : ses deux phrases, et « Son prénom »");
await zoe.locator(".pr-plein.pr-parler .pr-pour input").fill("Karim");
await capture(zoe, "1-compris");
await zoe.locator(".pr-plein.pr-parler .pr-bas .pr-bouton").click();
await zoe.waitForSelector(".tf-feuille.ouverte .pr-pret", { timeout: 30000 });
const url = await zoe.locator(".tf-feuille.ouverte .pr-pret").getAttribute("data-url");
const wa = await zoe.locator(".tf-feuille.ouverte .pr-pret a.pr-bouton").getAttribute("href");
const ID = /\/t\/([a-z0-9]{12})$/.exec(url ?? "")?.[1] ?? "";
ok(Boolean(ID) && wa?.startsWith("https://wa.me/?text=") && decodeURIComponent(wa.split("text=")[1]).includes(`Karim, écoute ce que ma figurine a à te dire 😄 ${url}`), `« Ton message est prêt » : « L'envoyer sur WhatsApp » (${decodeURIComponent(wa?.split("text=")[1] ?? "")})`);
ok((await texte(zoe, ".tf-feuille.ouverte .pr-pret")).includes("Encore 2 aujourd’hui"), "trois par jour : encore deux");
await capture(zoe, "2-pret");
const fiche = await lireStock(`liens/${ID}.json`);
ok(fiche?.de === ZOE.id && fiche.pour === "Karim" && fiche.ville === "dax" && fiche.repliques.map((r) => r.tete).join(",") === "tete,rire" && (await liste("liens")).length === 2, "le lien est rangé : sa voix, ses têtes (🤦 puis 😂), pour Karim, à Dax");

// ═══ L'APERÇU DU LIEN (le robot de WhatsApp) : il ne compte pas ═══
const apercu = await (await fetch(`${BASE}/t/${ID}`, { headers: { "user-agent": "WhatsApp/2.24.1 A" } })).text();
ok(apercu.includes('property="og:title" content="🎙️ Zoé t’a laissé un message avec sa figurine"') && /property="og:image" content="[^"]+neutre-essai/.test(apercu), "l'aperçu du lien : « 🎙️ Zoé t'a laissé un message avec sa figurine », et sa figurine");
ok((await evenements(ID)).join(",") === "cree", "le robot de l'aperçu ne compte pas comme une ouverture");

// ═══ KARIM, SANS CLIKME, OUVRE LE LIEN ═══
const karim = await tel(null, "Karim");
await karim.goto(url, { waitUntil: "networkidle" });
await karim.waitForSelector(".pt-scene .pr-lire", { timeout: 60000 });
ok((await texte(karim, ".pt-haut h1")) === "Karim, Zoé t’a laissé un message avec sa figurine" && (await texte(karim, ".pt-prive")).includes("Il s’efface dans 30 jours"), "« Karim, Zoé t'a laissé un message avec sa figurine » ; privé, 30 jours");
await karim.locator(".pt-scene .pr-lire").click();
const tetes = await tetesJouees(karim, ".pt-scene");
ok(tetes[0] === "tete" && tetes.includes("rire") && (await karim.locator(".pt-scene .fqp[data-visage]").count()) === 1, `sa figurine lui parle : 🤦 puis 😂, au bon moment (${tetes.join(" → ")})`);
ok((await evenements(ID)).includes("vu"), "ouvert : compté");
ok((await debordement(karim)) <= 0 && (await sansMotInterdit(karim)), "la page ne déborde pas, sans le mot interdit");
await capture(karim, "3-lien");

// « Réponds-lui avec ta figurine » : son selfie
await karim.locator(".pt-repondre").click();
await karim.waitForSelector(".pt-selfie .pt-photo", { timeout: 10000 });
ok((await karim.locator(".pt-selfie .pr-pour input").inputValue()) === "Karim" && (await karim.locator(".pt-selfie .pt-faire").isDisabled()), "son selfie : son prénom (déjà là), « Prends d'abord ton selfie »");
await karim.locator(".pt-selfie .pt-photo input").setInputFiles(path.resolve("public/direct/double/comptoir.jpg"));
await karim.waitForSelector(".pt-selfie .pt-photo img", { timeout: 15000 });
await karim.locator(".pt-selfie .pt-case input").nth(0).check();
ok(await karim.locator(".pt-selfie .pt-faire").isDisabled(), "sans « 15 ans ou plus », rien ne part");
await karim.locator(".pt-selfie .pt-case input").nth(1).check();
await capture(karim, "4-selfie");
await karim.locator(".pt-selfie .pt-faire").click();
await karim.waitForSelector(".pr-plein.pr-parler .pr-attente-fig", { timeout: 30000 });
const [K] = await lire("human_habitants", "prenom=eq.Karim");
ok(K?.ville_slug === "dax" && (await lireStock(`${K?.id}/provisoire.json`))?.lien === ID && (await evenements(ID)).includes("nouveau"), "son compte s'ouvre à Dax (la ville de Zoé), marqué : né d'un lien");
ok((await texte(karim, ".pr-plein.pr-parler .pr-attente-fig")).includes("Ta figurine arrive") && (await karim.locator(".pr-plein.pr-parler .pr-attente-fig img").count()) === 1, "sa figurine se fabrique : son selfie, « Ta figurine arrive… »");
await karim.waitForTimeout(500);
await capture(karim, "5-attente");
// il dit sa réponse pendant qu'elle se fabrique
await karim.locator(".pr-plein.pr-parler .pr-micro").click();
await karim.waitForSelector(".pr-plein.pr-parler .pr-temps", { timeout: 15000 });
await karim.waitForTimeout(3800);
await karim.locator(".pr-plein.pr-parler .pr-micro").click();
await karim.waitForFunction(() => document.querySelector(".pr-plein.pr-parler .pr-consigne")?.textContent?.includes("attend ta figurine"), null, { timeout: 15000 }).catch(() => null);
ok((await texte(karim, ".pr-plein.pr-parler .pr-consigne")).includes("Ce que tu as dit attend ta figurine"), "il a parlé : ce qu'il a dit attend sa figurine");
// (pas de moteur d'image ici : ClikMe la fait à la main — ses deux images posées dans le faux Supabase)
for (const [nom, src] of [
  ["neutre", "public/direct/double/pied/viens.webp"],
  ["parle", "public/direct/double/pied/viens.webp"],
])
  await deposer(`${K.id}/${nom}-k.webp`, fs.readFileSync(src), "image/webp");
await fetch(`${F}/clik_ma_figurine?habitant_id=eq.${K.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ neutre: `${K.id}/neutre-k.webp`, parle: `${K.id}/parle-k.webp`, prete_le: new Date().toISOString() }),
});
await karim.waitForSelector(".pr-plein.pr-parler .pr-choix li", { timeout: 30000 });
ok((await karim.locator(".pr-plein.pr-parler .pr-choix li").count()) === 2 && (await karim.locator(".pr-plein.pr-parler .pr-scene .fqp").count()) === 1 && (await texte(karim, ".pr-plein.pr-parler .pr-qui")).includes("Avant d’envoyer à Zoé"), "sa figurine est prête : elle a compris ce qu'il a dit");
await capture(karim, "6-compris");
await karim.locator(".pr-plein.pr-parler .pr-bas .pr-bouton").click();
await karim.waitForSelector(".pt-fini .pt-duo", { timeout: 30000 });
ok((await texte(karim, ".pt-fini h1")) === "C’est parti !" && (await texte(karim, ".pt-fini")).includes("Vous êtes proches maintenant") && (await karim.locator(".pt-fini .cn-proteger").count()) === 1, "« C'est parti ! » : ils sont proches ; « Ne perds jamais ta figurine » (son e-mail, s'il veut)");
ok((await karim.locator(".pt-fini a.pt-ouvrir").getAttribute("href")) === `/collection?parler=${ZOE.cle}#proches`, "« Ouvrir ClikMe » mène à leur conversation");
ok((await debordement(karim)) <= 0 && (await sansMotInterdit(karim)), "« C'est parti » ne déborde pas, sans le mot interdit");
await capture(karim, "7-fini");

// le serveur : proches, la conversation, la mesure, la notification
const pair = [ZOE.id, K.id].sort().join("_");
const noms = (await liste(`fils/${pair}/m`)).sort();
const premier = await lireStock(`fils/${pair}/m/${noms[0]}`);
ok(
  (await lireStock(`${ZOE.id}/proches.json`))?.ids?.includes(K.id) && (await lireStock(`${K.id}/proches.json`))?.ids?.includes(ZOE.id) && noms.length === 2 && premier?.id === ID && premier.de === ZOE.id,
  "proches dans les deux sens ; le message de Zoé ouvre leur conversation, la réponse de Karim suit",
);
ok((await evenements(ID)).includes("reponse") && Boolean((await lireStock(`${ZOE.id}/venus.json`))?.[K.id]), "la mesure : une réponse ; Karim est venu grâce à Zoé");
let notifs = [];
for (let k = 0; k < 20 && !notifs.some((n) => n.title?.includes("Karim")); k++) {
  notifs = await recus(telZoe);
  await new Promise((r) => setTimeout(r, 300));
}
const n = notifs.find((x) => x.title?.includes("Karim"));
ok(n?.title === "🎙️ Karim t’a répondu avec sa figurine !" && n.body?.includes("Sa toute première") && n.url === `/collection?parler=${K ? cleProfil(K.id) : ""}#proches`, `Zoé est prévenue : « ${n?.title} — ${n?.body} »`);

// Karim ouvre ClikMe : leur conversation
await karim.locator(".pt-fini a.pt-ouvrir").click();
await fermerPablito(karim);
await karim.waitForSelector(".pr-plein .pr-fil li", { timeout: 60000 });
ok((await texte(karim, ".pr-plein .pr-qui")).includes("Zoé") && (await karim.locator(".pr-plein .pr-fil li").count()) === 2, "« Ouvrir ClikMe » : sa conversation avec Zoé, leurs deux messages");

// ═══ ZOÉ : SA CARTE, « NOUVEAU, GRÂCE À TOI » ; SON PROPRE LIEN ═══
await zoe.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await zoe.waitForSelector(`#o-proches .pr-carte[data-cle="${cleProfil(K.id)}"]`, { timeout: 60000 });
ok((await texte(zoe, `#o-proches .pr-carte[data-cle="${cleProfil(K.id)}"]`)).includes("Nouveau, grâce à toi") && (await texte(zoe, `#o-proches .pr-carte[data-cle="${cleProfil(K.id)}"]`)).includes("1 message"), "chez Zoé : la carte de Karim, « Nouveau, grâce à toi », « 1 message »");
await capture(zoe, "8-proches");
await zoe.goto(url, { waitUntil: "networkidle" });
ok((await texte(zoe, ".pt-auteur")) === "C’est ton message." && (await zoe.locator(".pt-repondre").count()) === 0, "Zoé ouvre son propre lien : « C'est ton message » (et le renvoyer)");

// ═══ LÉA, QUI A DÉJÀ SA FIGURINE : ELLE RÉPOND SANS SELFIE ═══
const lea = await tel(LEA, "Léa");
await lea.goto(url, { waitUntil: "networkidle" });
await lea.locator(".pt-repondre").click();
await lea.waitForSelector(".pr-plein.pr-parler .pr-moi-fig", { timeout: 15000 });
ok((await lea.locator(".pt-selfie").count()) === 0, "Léa a déjà sa figurine : « Réponds-lui » ouvre tout de suite le micro");
const rLea = await route(LEA, { action: "lien-repondre", id: ID, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Moi aussi je viens !", tete: null }] });
ok(rLea.statut === 200 && rLea.cle === ZOE.cle && (await lireStock(`${LEA.id}/proches.json`))?.ids?.includes(ZOE.id), "sa réponse part : Léa et Zoé deviennent proches");

// ═══ LES GARDE-FOUS ═══
const deux = [await route(ZOE, { action: "lien-creer", son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Coucou", tete: null }] }), await route(ZOE, { action: "lien-creer", son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Coucou", tete: null }] })];
const quatrieme = await route(ZOE, { action: "lien-creer", son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Coucou", tete: null }] });
ok(deux.every((r) => r.statut === 200) && quatrieme.statut === 429 && quatrieme.error.includes("3 messages par WhatsApp par jour"), "trois liens par jour, pas un de plus");
ok((await route(ZOE, { action: "lien-repondre", id: ID, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "x", tete: null }] })).statut === 400, "on ne répond pas à son propre lien");
// cinq personnes au plus répondent à un même lien (Karim et Léa l'ont fait : trois de plus, puis plus personne)
const inconnus = [1, 2, 3, 4].map((k) => ({ id: `adadadad-0000-4000-8000-00000000099${k}`, jeton: `jeton-inconnu-whatsapp-00${k}`, prenom: `Inconnu${k}` }));
await semer("human_habitants", inconnus.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", inconnus.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${LEA.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${LEA.id}/neutre-essai.webp`, parle: `${LEA.id}/parle-essai.webp`, prete_le: new Date().toISOString() })));
const reponses = [];
for (const x of inconnus) reponses.push(await route(x, { action: "lien-repondre", id: ID, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Salut", tete: null }] }));
ok(reponses.slice(0, 3).every((r) => r.statut === 200) && reponses[3].statut === 403 && !(await lireStock(`${ZOE.id}/proches.json`))?.ids?.includes(inconnus[3].id), `cinq personnes au plus répondent à un même lien (${reponses.map((r) => r.statut).join(", ")})`);
const VIEUX = "vieux0000001";
await deposer(`liens/${VIEUX}.mp3`, fs.readFileSync("scripts/fixtures/voix-essai.mp3"), "audio/mpeg");
await json(`liens/${VIEUX}.json`, { ...fiche, id: VIEUX, son: `liens/${VIEUX}.mp3`, le: new Date(Date.now() - 31 * 86_400_000).toISOString(), reponses: [] });
await karim.goto(`${BASE}/t/${VIEUX}`, { waitUntil: "networkidle" });
const restent = await liste("liens");
ok((await texte(karim, ".pt-fini h1")) === "Ce message s’est effacé" && !restent.some((x) => x.startsWith(VIEUX)) && restent.some((x) => x.startsWith(ID)), "un lien de plus de trente jours s'efface (sa voix aussi) ; les autres restent");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
