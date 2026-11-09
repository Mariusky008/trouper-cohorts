// 🎙️ LE TALKIE-WALKIE DES FIGURINES — l'onglet « Proches » de `/collection` (`app/collection/proches.tsx`,
// `lib/direct/talkie.ts`, `talkie-serveur.ts`), contre le faux Supabase, jamais la vraie base.
//
// Zoé et Léa se sont ajoutées toutes les deux : elles se parlent. Nico a ajouté Zoé, pas l'inverse. Léa a laissé un
// message à Zoé (« Tu viens ce soir chez Thomas ? », avec sa joie), et elle est là. Zoé ouvre « Proches » (le menu :
// « Proches » à la place de « Moi », la pastille « 1 ») : les figurines, « 1 message », « Là maintenant », « L'ajouter
// aussi » pour Nico. Elle ouvre leur conversation : la scène, le message de Léa, qu'elle écoute (vu). « Lui répondre » :
// elle parle (un faux micro), « Ta figurine a compris ça » — ses deux phrases écrites (la fausse transcription), trois
// têtes proposées pour chacune (la honte, puis le fou rire) ; elle change la seconde (l'euphorie), puis envoie. Léa est
// prévenue (« 🎙️ Zoé t'a parlé ! ») ; elle ouvre le lien de la notification : la conversation, le message de Zoé, qui
// fait la tête de chaque réplique au bon moment ; « Juste le son ». Zoé ajoute Nico aussi ; elle coupe « Là
// maintenant » dans « Moi » (sous son prénom). Le lien de Léa (`?proche=`) : Nico l'ajoute. Ceux qui ne se sont pas
// ajoutés tous les deux ne se parlent pas. Léa signale un message : il disparaît pour elle. La mesure (`t-…`), sans
// toucher aux chiffres des mèmes. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, recus, repondreFenetre, telephone } from "./commun.mjs";

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

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ZOE = { id: "abababab-0000-4000-8000-000000000801", jeton: "jeton-zoe-talkie-000000001", prenom: "Zoé" };
const LEA = { id: "abababab-0000-4000-8000-000000000802", jeton: "jeton-lea-talkie-000000001", prenom: "Léa" };
const NICO = { id: "abababab-0000-4000-8000-000000000803", jeton: "jeton-nico-talkie-00000001", prenom: "Nico" };
const GENS = [ZOE, LEA, NICO];
for (const x of GENS) x.cle = cleProfil(x.id);

// ─── trois habitants de Dax, leurs figurines, et quelques têtes déjà faites ───
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const IMAGES = { [ZOE.id]: ["pied/salut-1", "pied/parle-1"], [LEA.id]: ["pied/montre", "pied/montre"], [NICO.id]: ["pied/viens", "pied/viens"] };
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.webp`, img(IMAGES[x.id][0]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(IMAGES[x.id][1]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
const dossierExpr = (h) => `${h}/expr-${crypto.createHash("sha1").update(`${h}/neutre-essai.webp`).digest("hex").slice(0, 16)}`;
const TETES = { [ZOE.id]: { tete: "reflechit", rire: "content", euphorie: "pied/salut-2" }, [LEA.id]: { joie: "content" } };
for (const [h, faites] of Object.entries(TETES))
  for (const [cle, nom] of Object.entries(faites)) {
    await deposer(`${dossierExpr(h)}/${cle}-n.webp`, img(nom), "image/webp");
    await deposer(`${dossierExpr(h)}/${cle}-p.webp`, img(nom), "image/webp");
  }
// Zoé et Léa : proches toutes les deux ; Léa est là (ClikMe ouvert il y a un instant)
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
await json(`${LEA.id}/proches.json`, { ids: [ZOE.id] });
await json(`${LEA.id}/la.json`, { le: Date.now() });

/** La route, comme le téléphone de quelqu'un. */
const route = async (qui, corps, chemin = "proches") => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const voir = async (qui, q = "") => {
  const r = await fetch(`${BASE}/api/direct/proches${q}`, { headers: { cookie: `clikme_habitant=${qui.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── avant : Nico ajoute Zoé ; Léa laisse un message à Zoé ───
ok((await route(NICO, { action: "proche", cle: ZOE.cle, oui: true })).statut === 200 && (await lireStock(`${ZOE.id}/ajoute-par.json`))?.ids?.includes(NICO.id), "Nico ajoute Zoé (elle le saura : « L'ajouter aussi »)");
const envoiLea = await route(LEA, { action: "envoyer", cle: ZOE.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Tu viens ce soir chez Thomas ?", tete: "joie" }] });
ok(envoiLea.statut === 200 && envoiLea.message?.moi === true && envoiLea.message.repliques?.[0]?.tete === "joie", "Léa laisse un message à Zoé (sa voix, sa joie)");
// ceux qui ne se sont pas ajoutés tous les deux ne se parlent pas
ok((await route(NICO, { action: "envoyer", cle: ZOE.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Coucou", tete: null }] })).statut === 403, "Nico ne peut pas encore parler à Zoé (elle ne l'a pas ajouté)");
ok((await voir(NICO, `?fil=${ZOE.cle}`)).statut === 403 && (await voir(NICO, `?fil=${"0".repeat(16)}`)).statut === 404, "ni ouvrir leur conversation ; une clé inconnue : rien");
ok((await route(LEA, { action: "envoyer", cle: ZOE.cle, son: "data:audio/mpeg;base64,AAAA", duree: 2, repliques: [{ de: 0, a: 2, texte: "", tete: null }] })).statut === 400, "un son vide ne part pas");
ok((await route(LEA, { action: "envoyer", cle: ZOE.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "x", tete: "nimporte" }] })).statut === 400, "une tête qui n'existe pas non plus");

const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
async function tel(qui) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${qui.prenom} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const capture = (p, nom) => p.screenshot({ path: `${D}/talkie-${nom}.png` });
/** Les têtes que fait la scène pendant qu'elle joue (relevées toutes les 50 ms jusqu'à la fin de la voix). */
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

// ═══ ZOÉ OUVRE « PROCHES » ═══
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
await fermerPablito(zoe);
await zoe.waitForSelector("#o-proches .pr-carte", { timeout: 60000 });
const menu = await zoe.locator(".mc-nav button").allInnerTexts();
ok(menu.length === 5 && menu[4].includes("Proches") && !menu.some((t) => /\bMoi\b/.test(t)) && (await texte(zoe, ".mc-nav button.pris")).includes("Proches"), `le menu : « Proches » à la place de « Moi » (${menu.map((t) => t.trim()).join(" · ")})`);
await zoe.waitForFunction(() => document.querySelector(".mc-nav-proches .mc-nav-ico i")?.textContent === "1", null, { timeout: 15000 }).catch(() => null);
ok((await texte(zoe, ".mc-nav-proches .mc-nav-ico i")) === "1" && (await texte(zoe, ".mc-barre button.mc-moi")).includes("Zoé"), "la pastille : 1 message non lu ; « Moi » est sous son prénom, en haut");
const cartes = await zoe.locator("#o-proches .pr-carte").evaluateAll((l) => l.map((c) => ({ cle: c.dataset.cle, classe: c.className, texte: c.textContent.replace(/\s+/g, " ").trim() })));
const carteLea = cartes.find((c) => c.cle === LEA.cle);
const carteNico = cartes.find((c) => c.cle === NICO.cle);
ok(cartes.length === 2 && cartes[0].cle === LEA.cle, `Léa d'abord (elle lui a parlé), puis Nico (${cartes.map((c) => c.texte.slice(0, 40)).join(" | ")})`);
ok(
  /lien-proches/.test(carteLea?.classe) && carteLea.texte.includes("1 message") && carteLea.texte.includes("Là maintenant") && carteLea.texte.includes("T’a parlé : « Tu viens ce soir chez Thomas ? »") && carteLea.texte.includes("Lui parler"),
  `la carte de Léa : sa figurine, « 1 message », « Là maintenant », ce qu'elle a dit, « Lui parler » (${carteLea?.texte})`,
);
ok(/lien-ajoute/.test(carteNico?.classe) && carteNico.texte.includes("L’ajouter aussi") && !carteNico.texte.includes("Lui parler"), `Nico : « L'ajouter aussi », pas encore « Lui parler » (${carteNico?.texte})`);
ok((await zoe.locator("#o-proches .pr-lien .pr-bouton").count()) === 1 && (await texte(zoe, "#o-proches .pr-lien")).includes("Envoie ton lien"), "« Ajoute tes proches » : son lien à envoyer");
ok((await debordement(zoe)) <= 0 && (await sansMotInterdit(zoe)), "l'onglet ne déborde pas, sans le mot interdit");
await capture(zoe, "1-proches");

// ═══ LEUR CONVERSATION : LE MESSAGE DE LÉA ═══
await zoe.locator(`#o-proches .pr-carte[data-cle="${LEA.cle}"] .pr-mini`).click();
await zoe.waitForSelector(".pr-plein .pr-fil li", { timeout: 30000 });
ok((await texte(zoe, ".pr-plein .pr-qui")).includes("Léa") && (await texte(zoe, ".pr-plein .pr-qui")).includes("Là maintenant"), "la conversation : Léa, « Là maintenant »");
ok((await zoe.locator(".pr-plein .pr-fil li.lui button.nouveau").count()) === 1 && (await texte(zoe, ".pr-plein .pr-fil")).includes("« Tu viens ce soir chez Thomas ? »") && (await texte(zoe, ".pr-plein .pr-fil")).includes("😄"), "son message, nouveau, avec sa tête (😄)");
ok((await zoe.locator(".pr-plein .pr-scene .pr-lire").count()) === 1 && (await zoe.locator(".pr-plein .pr-scene .pr-ecoute").count()) === 1, "la scène : leurs deux figurines, et ▶");
const lus = await lireStock(`${ZOE.id}/fils-lus.json`);
ok(Number(lus?.[LEA.id]) > 0, "ouverte : ses messages sont lus");
await zoe.locator(".pr-plein .pr-scene .pr-lire").click();
const tetesLea = await tetesJouees(zoe, ".pr-plein .pr-scene");
ok(tetesLea.includes("joie") && (await zoe.locator(".pr-plein .pr-scene .fqp[data-visage=joie]").count()) === 1, `elle écoute : la figurine de Léa fait sa joie (${tetesLea.join(" → ")})`);
await capture(zoe, "2-conversation");

// ═══ « LUI RÉPONDRE » : ELLE PARLE, SA FIGURINE COMPREND ═══
await zoe.locator(".pr-plein .pr-bas .pr-bouton").click();
await zoe.waitForSelector(".pr-plein.pr-parler .pr-micro", { timeout: 15000 });
ok((await texte(zoe, ".pr-plein.pr-parler .pr-qui")).includes("À Léa") && (await texte(zoe, ".pr-plein.pr-parler")).includes("20 s au plus"), "« À Léa », 20 s au plus");
await zoe.locator(".pr-plein.pr-parler .pr-micro").click();
await zoe.waitForSelector(".pr-plein.pr-parler .pr-temps", { timeout: 15000 });
ok((await texte(zoe, ".pr-plein.pr-parler .pr-etat")).includes("Je t’écoute"), "elle parle : « Je t'écoute », le temps qui passe");
await zoe.waitForTimeout(3800);
await zoe.locator(".pr-plein.pr-parler .pr-micro").click();
await zoe.waitForSelector(".pr-plein.pr-parler .pr-choix li", { timeout: 30000 });
const ia = await (await fetch(`${F.replace("/rest/v1", "")}/__ia`)).json();
ok(ia.some((c) => /^TRANSCRIPTION whisper-1 fr verbose_json \d+/.test(c)) && ia.some((c) => c.includes("LES TÊTES DE SA FIGURINE") && c.includes("tete (la tête dans les mains)")), "sa voix part à la transcription (en français, datée), ses phrases au metteur en scène");
const repliques = await zoe.locator(".pr-plein.pr-parler .pr-choix li").evaluateAll((l) =>
  l.map((li) => ({ texte: li.querySelector(".pr-choix-texte")?.textContent?.trim(), tetes: [...li.querySelectorAll(".pr-tetes button[data-tete]")].map((x) => x.dataset.tete), pris: li.querySelector(".pr-tetes button.pris")?.dataset.tete })),
);
ok(
  repliques.length === 2 && repliques[0].texte.includes("J'avais dit que je ne sortais pas ce soir") && repliques[1].texte.includes("me voilà au bar avec Thomas"),
  `« Ta figurine a compris ça » : ses deux phrases (${repliques.map((r) => r.texte).join(" | ")})`,
);
ok(
  repliques[0].tetes.length === 3 && repliques[0].pris === "tete" && repliques[1].tetes.join(",") === "rire,euphorie,joie" && repliques[1].pris === "rire",
  `trois têtes proposées pour chacune, la première d'office : 🤦 puis 😂 (${repliques.map((r) => `${r.pris} parmi ${r.tetes.join("/")}`).join(" | ")})`,
);
ok((await zoe.locator(".pr-plein.pr-parler .pr-scene .fqp[data-visage=tete]").count()) === 1 && (await texte(zoe, ".pr-plein.pr-parler .pr-sous-titre")).includes("J'avais dit"), "l'aperçu : sa figurine, la tête dans les mains, et ses sous-titres");
// elle change la seconde : l'euphorie ; « Autre » montre toutes ses têtes
await zoe.locator('.pr-plein.pr-parler .pr-choix li[data-replique="1"] .pr-tetes button[data-tete=euphorie]').click();
await zoe.locator('.pr-plein.pr-parler .pr-choix li[data-replique="0"] .pr-autre').click();
const toutes = await zoe.locator('.pr-plein.pr-parler .pr-choix li[data-replique="0"] .pr-tetes button[data-tete]').count();
ok(
  (await zoe.locator('.pr-plein.pr-parler .pr-choix li[data-replique="1"] button.pris').getAttribute("data-tete")) === "euphorie" && (await zoe.locator(".pr-plein.pr-parler .pr-scene .fqp[data-visage=euphorie]").count()) === 1 && toutes === 5,
  `elle change la seconde (l'euphorie, aussitôt sur sa figurine) ; « Autre » : ses cinq têtes (${toutes})`,
);
await zoe.locator(".pr-plein.pr-parler .pr-apercu").click();
const apercu = await tetesJouees(zoe, ".pr-plein.pr-parler .pr-scene");
ok(apercu[0] === "tete" && apercu.includes("euphorie"), `« Voir ce que ça donne » : 🤦 puis 🤩, au bon moment (${apercu.join(" → ")})`);
ok((await debordement(zoe)) <= 0 && (await sansMotInterdit(zoe)), "« Ta figurine a compris ça » ne déborde pas, sans le mot interdit");
await capture(zoe, "3-compris");

// Léa est abonnée aux notifications : elle sera prévenue
const telLea = telephone("lea-talkie");
ok((await route(LEA, { action: "notif", abonnement: telLea.abonnement }, "ma-figurine")).statut === 200, "Léa a demandé les notifications");
await zoe.locator(".pr-plein.pr-parler .pr-bas .pr-bouton").click();
await zoe.waitForSelector(".pr-plein.pr-parler", { state: "detached", timeout: 30000 });
await zoe.waitForFunction(() => document.querySelectorAll(".pr-plein .pr-fil li").length === 2, null, { timeout: 15000 }).catch(() => null);
ok((await zoe.locator(".pr-plein .pr-fil li.moi").count()) === 1 && (await texte(zoe, ".pr-plein .pr-fil li.moi")).includes("🤦 🤩"), "envoyé : son message dans la conversation, avec ses têtes (🤦 🤩)");
const pair = [ZOE.id, LEA.id].sort().join("_");
const noms = (await liste(`fils/${pair}/m`)).sort();
const fiche = await lireStock(`fils/${pair}/m/${noms[noms.length - 1]}`);
ok(noms.length === 2 && fiche?.de === ZOE.id && fiche.repliques.map((r) => r.tete).join(",") === "tete,euphorie" && fiche.repliques[1].texte.includes("bar avec Thomas") && (await liste(`fils/${pair}/s`)).length === 2, "rangé : un fichier par message, sa voix à côté, les têtes qu'elle a choisies");
const voulus = (await lireStock(`${ZOE.id}/visages.json`))?.voulus ?? [];
ok(["joie", "rire", "colere", "tete"].every((x) => voulus.includes(x)), `ses premières têtes sont demandées (${voulus.join(", ")})`);
let notifs = [];
for (let k = 0; k < 20 && !notifs.some((n) => n.title?.includes("Zoé")); k++) {
  notifs = await recus(telLea);
  await new Promise((r) => setTimeout(r, 300));
}
const parole = notifs.find((n) => n.title?.includes("t’a parlé") || n.title?.includes("t'a parlé"));
ok(parole && parole.title.includes("🎙️ Zoé") && parole.url === `/collection?parler=${ZOE.cle}#proches`, `Léa est prévenue : « ${parole?.title} » (${parole?.url})`);
await zoe.locator(".pr-plein .pr-retour").click();
await zoe.waitForSelector(".pr-plein", { state: "detached", timeout: 10000 });

// ═══ « RETOUR » DU TÉLÉPHONE, ET LE LOGO : ON RESTE DANS CLIKME ═══
await zoe.locator(`#o-proches .pr-carte[data-cle="${LEA.cle}"] .pr-mini`).click();
await zoe.waitForSelector(".pr-plein .pr-fil li", { timeout: 30000 });
await zoe.goBack();
await zoe.waitForSelector(".pr-plein", { state: "detached", timeout: 10000 }).catch(() => null);
ok((await zoe.locator(".pr-plein").count()) === 0 && new URL(zoe.url()).pathname === "/collection" && (await texte(zoe, ".mc-nav button.pris")).includes("Proches"), `« Retour » referme la conversation, sans quitter « Proches » (${zoe.url()})`);
await zoe.locator(".mc-barre .mc-logo").click();
await zoe.waitForFunction(() => document.querySelector(".mc-nav button.pris")?.className.includes("mc-nav-figurine"), null, { timeout: 10000 }).catch(() => null);
ok(new URL(zoe.url()).pathname === "/collection" && (await zoe.locator(".mc-nav button.pris.mc-nav-figurine").count()) === 1, `le logo ramène à « Créer », dans l'appli (${zoe.url()})`);
await zoe.goBack();
await zoe.waitForFunction(() => document.querySelector(".mc-nav button.pris")?.className.includes("mc-nav-proches"), null, { timeout: 10000 }).catch(() => null);
ok(new URL(zoe.url()).pathname === "/collection" && (await zoe.locator(".mc-nav button.pris.mc-nav-proches").count()) === 1, `puis « Retour » : de nouveau « Proches », pas l'accueil du site (${zoe.url()})`);

// ═══ LÉA OUVRE LA NOTIFICATION : LA CONVERSATION, LE MESSAGE DE ZOÉ ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}${parole?.url ?? `/collection?parler=${ZOE.cle}#proches`}`, { waitUntil: "networkidle" });
await fermerPablito(lea);
await lea.waitForSelector(".pr-plein .pr-fil li", { timeout: 60000 });
ok((await texte(lea, ".pr-plein .pr-qui")).includes("Zoé") && !lea.url().includes("parler="), "le lien de la notification ouvre leur conversation (et quitte l'adresse)");
ok((await lea.locator(".pr-plein .pr-fil li.lui button.nouveau").count()) === 1 && (await texte(lea, ".pr-plein .pr-fil li.lui")).includes("me voilà au bar avec Thomas"), "le message de Zoé, nouveau, ses sous-titres");
await lea.locator(".pr-plein .pr-scene .pr-lire").click();
const tetesZoe = await tetesJouees(lea, ".pr-plein .pr-scene");
ok(tetesZoe[0] === "tete" && tetesZoe.includes("euphorie"), `chez Léa, la figurine de Zoé fait la tête de chaque réplique au bon moment (${tetesZoe.join(" → ")})`);
await lea.locator(".pr-plein .pr-commandes button[aria-pressed]").click();
ok((await lea.locator(".pr-plein .pr-son").count()) === 1 && (await texte(lea, ".pr-plein .pr-son")).includes("Juste le son"), "« Juste le son » : la voix, sans les images");
await capture(lea, "4-lea");
ok((await debordement(lea)) <= 0 && (await sansMotInterdit(lea)), "la conversation ne déborde pas, sans le mot interdit");

// 🚩 Léa signale le message : il disparaît pour elle, l'équipe le regarde
await lea.locator(".pr-plein .pr-menu-bouton").click();
await lea.locator(".pr-plein .pr-menu button").first().click();
const dit = await repondreFenetre(lea, true);
await lea.waitForFunction(() => document.querySelectorAll(".pr-plein .pr-fil li.lui").length === 0, null, { timeout: 15000 }).catch(() => null);
ok(dit.includes("Signaler le dernier message de Zoé") && (await lea.locator(".pr-plein .pr-fil li.lui").count()) === 0 && (await liste("moderation/paroles")).length === 1, "Léa signale le message : il disparaît pour elle, l'équipe le regarde");
ok(((await voir(LEA, `?fil=${ZOE.cle}`)).fil?.messages ?? []).every((m) => m.moi) && ((await voir(ZOE, `?fil=${LEA.cle}`)).fil?.messages ?? []).length === 2, "il reste caché pour elle ; Zoé voit toujours leurs deux messages");

// ═══ ZOÉ AJOUTE NICO AUSSI ; ELLE COUPE « LÀ MAINTENANT » ═══
await zoe.locator(`#o-proches .pr-carte[data-cle="${NICO.cle}"] .pr-ajouter`).click();
await zoe.waitForSelector(`#o-proches .pr-carte[data-cle="${NICO.cle}"] .pr-lui-parler`, { timeout: 15000 }).catch(() => null);
ok((await zoe.locator(`#o-proches .pr-carte[data-cle="${NICO.cle}"].lien-proches .pr-lui-parler`).count()) === 1, "« L'ajouter aussi » : Zoé et Nico se parlent");
ok((await route(NICO, { action: "envoyer", cle: ZOE.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Merci !", tete: null }] })).statut === 200, "Nico peut maintenant lui parler");
await zoe.locator(".mc-barre button.mc-moi").click();
await fermerPablito(zoe, "#o-personnage");
await zoe.waitForSelector("#o-personnage .pr-presence button[role=switch]", { timeout: 30000 });
ok((await zoe.locator("#o-personnage .pr-presence button[role=switch]").getAttribute("aria-checked")) === "true" && (await zoe.locator(".mc-nav button.pris").count()) === 0, "dans « Moi » (sous son prénom) : « Montrer à mes proches quand je suis là », allumé");
await zoe.locator("#o-personnage .pr-presence button[role=switch]").click();
await zoe.waitForFunction(() => document.querySelector("#o-personnage .pr-presence button[role=switch]")?.getAttribute("aria-checked") === "false", null, { timeout: 10000 }).catch(() => null);
await new Promise((r) => setTimeout(r, 600));
const vueParLea = (await voir(LEA)).proches?.find((p) => p.cle === ZOE.cle);
ok((await lireStock(`${ZOE.id}/reglages.json`))?.presence === false && vueParLea && vueParLea.la === false, "elle le coupe : Léa ne la voit plus « Là maintenant »");
await zoe.locator("#o-personnage .pr-presence button[role=switch]").click();

// ═══ LE LIEN DE LÉA : NICO L'AJOUTE ═══
const nico = await tel(NICO);
await nico.goto(`${BASE}/collection?proche=${LEA.cle}#proches`, { waitUntil: "networkidle" });
await fermerPablito(nico);
await nico.waitForSelector(".tf-feuille.ouverte .pr-invite", { timeout: 60000 });
ok((await texte(nico, ".tf-feuille.ouverte .pr-invite")).includes("Léa veut être ton proche") && !nico.url().includes("proche="), "le lien de Léa : « Léa veut être ton proche »");
await nico.locator(".tf-feuille.ouverte .pr-invite .pr-bouton").click();
await nico.waitForSelector(".tf-feuille.ouverte .pr-deja", { timeout: 15000 }).catch(() => null);
ok((await lireStock(`${NICO.id}/proches.json`))?.ids?.includes(LEA.id) && (await lireStock(`${LEA.id}/ajoute-par.json`))?.ids?.includes(NICO.id), "Nico l'ajoute : Léa le saura (« L'ajouter aussi »)");

// ═══ LA MESURE ═══
const ev = await lire("clik_meme_evenement", "select=message_id,type");
const talkie = ev.filter((e) => String(e.message_id).startsWith("t-"));
ok(talkie.filter((e) => e.type === "cree").length === 3 && talkie.filter((e) => e.type === "reponse").length === 1 && talkie.some((e) => e.type === "vu") && talkie.every((e) => /^t-[0-9a-f]{12}-[0-9a-f]{8}$/.test(e.message_id)), `la mesure : trois messages, une réponse, des messages écoutés (${talkie.map((e) => e.type).join(", ")})`);
ok(!talkie.some((e) => [ZOE.id, LEA.id, NICO.id].some((h) => e.message_id.includes(h.slice(0, 8)))), "sans jamais un identifiant");

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
