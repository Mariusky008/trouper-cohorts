// 🔀 LA BASCULE « UNIVERS POUR TOUS », DANS LE NAVIGATEUR (`lib/direct/univers-pour-tous.ts`) — sur un iPhone, contre le
// faux Supabase (jamais la vraie base), avec une seconde app lancée ici, l'interrupteur allumé (`../seconde-app.mjs`).
//
// Sam a sa figurine d'aujourd'hui. L'interrupteur allumé : l'appli s'ouvre sur « Chez moi » (son univers l'attend ; ses
// conversations comme WhatsApp — Marc ; « ＋ Nouveau », avec « Créer un mème ») ; le menu du bas, à trois : Découvrir ·
// Chez moi (au milieu, sa figurine) · Autour ; « Moi » : ce qui était dans « Créer » (le studio, mes mèmes…) ; Marc, qui a son univers, le voit par une fenêtre, sa figurine au milieu, sa pastille d'humeur, ⚙️ ; « Créer »
// invite Sam à refaire sa figurine au nouveau style ; « Ta figurine » lui propose sa photo d'avant (les deux cases toujours à cocher). Un
// nouveau venu, dans « Créer » : « Crée ta figurine », au nouveau style. 🎁🚪 Sam laisse un bouquet chez Marc, Léa
// frappe à sa porte : en arrivant chez lui, Marc les découvre — le paquet qui se dandine, qu'il ouvre (l'objet, le mot),
// « ✨ Le poser chez moi » ; la porte qui tremble, qu'il ouvre (« C'est Léa ! ») ; le bouquet posé dans sa fenêtre ; ce
// n'est plus nouveau ensuite ; « Mes visites » : le bilan. Freiné (l'app de la CI,
// `CLIKME_UNIVERS_POUR_TOUS=0`) : l'appli d'avant. Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { lancerSecondeApp } from "../seconde-app.mjs";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const { base: ALLUME, arreter } = await lancerSecondeApp();

const SAM = { id: "abababab-0000-4000-8000-000000000d01", jeton: "jeton-sam-bascule-nav-000001", prenom: "Sam" };
await semer("human_habitants", [{ id: SAM.id, device_token: SAM.jeton, prenom: SAM.prenom, ville_slug: "dax" }]);
await semer("human_vitrine_sites", [{ slug: "atelier-bascule", business_name: "L’Atelier", city: "40100 Dax", est_client: true }]);
const maintenant = new Date().toISOString();
await deposer(`${SAM.id}/neutre-essai.webp`, fs.readFileSync("public/direct/double/pied/montre.webp"), "image/webp");
await deposer(`${SAM.id}/photo.jpg`, fs.readFileSync("public/direct/atelier-bijoux.jpg"), "image/jpeg");
await json(`${SAM.id}/majeur.json`, { le: maintenant, age: 15 });
await semer("clik_ma_figurine", [{ habitant_id: SAM.id, prenom: SAM.prenom, photo: `${SAM.id}/photo.jpg`, accord_le: maintenant, demande_le: maintenant, neutre: `${SAM.id}/neutre-essai.webp`, parle: `${SAM.id}/neutre-essai.webp`, prete_le: maintenant }]);

// 🏡 Marc : sa figurine du nouveau style, son univers, et Sam pour proche (« Chez moi »)
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const MARC = { id: "abababab-0000-4000-8000-000000000d02", jeton: "jeton-marc-bascule-nav-00001", prenom: "Marc" };
await semer("human_habitants", [{ id: MARC.id, device_token: MARC.jeton, prenom: MARC.prenom, ville_slug: "dax" }]);
await json(`${MARC.id}/majeur.json`, { le: maintenant, age: 15 });
const P1 = `${MARC.id}/perso/v1`;
// (rangée comme en vrai : l'image assise est la proposition validée, `perso/images/<id>.png`)
const ASSISE_MARC = `${MARC.id}/perso/images/a1b2c3d4e5f6.png`;
await deposer(ASSISE_MARC, fs.readFileSync("public/direct/double/ecoute.webp"), "image/webp");
for (const n of ["assise_parle", "debout"]) await deposer(`${P1}/${n}.png`, fs.readFileSync("public/direct/double/ecoute.webp"), "image/webp");
const perso = {
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  references: { assise: { chemin: ASSISE_MARC }, assise_parle: { chemin: `${P1}/assise_parle.png` }, debout: { chemin: `${P1}/debout.png` } },
  historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
};
await json(`${P1}/fiche.json`, perso);
await json(`${MARC.id}/perso/fiche.json`, perso);
const M1 = `${MARC.id}/monde/v1`;
await deposer(`${M1}/decor.png`, fs.readFileSync("public/direct/atelier-bijoux.jpg"), "image/jpeg");
await deposer(`${M1}/vedette.png`, fs.readFileSync("public/direct/atelier-bijoux.jpg"), "image/jpeg");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [{ id: "e1", quoi: "un établi", pourquoi: "je bricole tous les dimanches", source: "dit", valide: true }],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.32, y: 0.84, echelle: 1 }, { id: "invite", x: 0.7, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${M1}/decor.png` }, vedette: { chemin: `${M1}/vedette.png` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${MARC.id}/monde/fiche.json`, monde);
await json(`${MARC.id}/monde/creation.json`, { version: 1, etape: "fini", mesure: 1 });
for (const x of [SAM, MARC]) await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
await json(`${MARC.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [MARC.id] });

const b = await lancer();
const erreurs = [];
async function tel(base, qui) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  if (qui) await ctx.addCookies([{ name: "clikme_habitant", value: qui.jeton, url: base }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${qui?.prenom ?? "nouveau"} : ${String(e)}`));
  return p;
}
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
const menu = async (p) => (await p.locator(".mc-nav button small").allInnerTexts()).join(" · ");

// ═══ ÉTEINT : l'appli d'aujourd'hui ═══
const avant = await tel(BASE, SAM);
await avant.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(avant);
ok((await menu(avant)) === "Découvrir · Autour · Créer · Mes mèmes · Proches" && (await avant.locator(".pn").count()) === 0, `éteint : le menu d'aujourd'hui, pas d'invitation (${await menu(avant)})`);

// ═══ ALLUMÉ : l'appli s'ouvre sur « Chez moi » (le 13 novembre : « Mon univers » et « Proches » ne font plus qu'un) ═══
// (Marc a déjà ouvert l'appli : sa figurine du nouveau style y est passée — le pont — et Sam peut lui parler)
await fetch(`${ALLUME}/api/direct/ma-figurine`, { headers: { cookie: `clikme_habitant=${MARC.jeton}` } });
const p = await tel(ALLUME, SAM);
await p.goto(`${ALLUME}/collection`, { waitUntil: "networkidle" });
await fermerPablito(p);
await p.waitForSelector(".cm-tete", { timeout: 20000 }).catch(() => null);
ok(new URL(p.url()).hash === "#proches" && (await texte(p, ".cm-titre h2")) === "Chez moi", `l'appli s'ouvre sur « Chez moi » (${new URL(p.url()).pathname}${new URL(p.url()).hash})`);
ok((await menu(p)) === "Découvrir · Chez moi · Autour" && (await p.locator(".mc-nav-proches.mc-nav-centre.pris").count()) === 1, `le menu du bas, à trois, « Chez moi » au milieu : ${await menu(p)}`);
await p.waitForSelector(".cm-attend", { timeout: 20000 }).catch(() => null);
ok((await texte(p, ".cm-attend b")) === "Ton univers t’attend 🏡" && (await p.locator('.cm-attend[href="/univers"]').count()) === 1, `sans univers encore : ce qui l'attend (${await texte(p, ".cm-attend b")})`);
await p.waitForSelector(".cm-liste li[data-cle]", { timeout: 20000 }).catch(() => null);
const ligneMarc = await texte(p, ".cm-liste li[data-cle] .cm-ligne");
ok(ligneMarc.includes("Marc") && ligneMarc.includes("Dis-lui bonjour") && (await p.locator(".pr-grille, .pr-wa, .pr-lien").count()) === 0, `ses conversations, comme WhatsApp : Marc (${ligneMarc}) ; plus de cartes ni de blocs`);
ok((await p.locator(".cm-memes").count()) === 0 && /mes conversations/i.test(await texte(p, ".cm-tete-liste")), "« Mes conversations », et plus de ligne « Mes mèmes » (elle est dans « Moi »)");
await p.locator(".cm-nouveau").click();
await p.waitForSelector(".cm-actions", { timeout: 10000 }).catch(() => null);
const actions = (await p.locator(".cm-actions b").allInnerTexts()).join(" · ");
ok(actions === "Parler à un proche · Créer un mème · Par WhatsApp · Ajouter un proche", `« ＋ Nouveau » : ${actions}`);
await p.locator(".cm-actions button", { hasText: "Parler à un proche" }).click();
ok((await p.locator(".cm-qui button", { hasText: "Marc" }).count()) === 1, "« Parler à un proche » : à qui ? Marc");
await p.screenshot({ path: `${D}/bascule-1-chez-moi-plus.png` });
await p.keyboard.press("Escape");
ok((await debordement(p)) <= 1 && (await sansMotInterdit(p)), "rien ne déborde, jamais le mot interdit");
await p.screenshot({ path: `${D}/bascule-1-chez-moi.png` });
// 🎭 « Créer un mème » : le studio de toujours
await p.locator(".cm-nouveau").click();
await p.locator(".cm-actions button", { hasText: "Créer un mème" }).click();
await p.waitForFunction(() => location.hash === "#creer", null, { timeout: 10000 }).catch(() => null);
ok(new URL(p.url()).hash === "#creer" && !(await p.locator("#o-figurine").isHidden()), "« Créer un mème » ouvre le studio");
// 🙂 « Moi » : ce qui était dans « Créer »
await p.locator(".mc-barre button.mc-moi").click();
await p.waitForSelector(".cm-moi-raccourcis", { timeout: 10000 }).catch(() => null);
const raccourcis = (await p.locator(".cm-moi-raccourcis b").allInnerTexts()).join(" · ");
ok(raccourcis === "Ma figurine et mes mèmes · Mon univers · Mes mèmes envoyés · Mes réactions", `« Moi » : ${raccourcis}`);
await p.locator(".cm-moi-raccourcis button", { hasText: "Mes mèmes envoyés" }).click();
await p.waitForFunction(() => location.hash === "#memes", null, { timeout: 10000 }).catch(() => null);
ok(new URL(p.url()).hash === "#memes", "« Mes mèmes envoyés » : là où ils sont");
await p.locator(".mc-nav-proches").click();

// ═══ 🏡 MARC, QUI A SON UNIVERS : la fenêtre sur son univers, sa pastille d'humeur, ⚙️ ═══
const m = await tel(ALLUME, MARC);
await m.goto(`${ALLUME}/collection`, { waitUntil: "networkidle" });
await fermerPablito(m);
await m.waitForSelector(".cm-fenetre .cm-place img", { timeout: 20000 }).catch(() => null);
const fen = await m.evaluate(() => {
  const f = document.querySelector(".cm-fenetre")?.getBoundingClientRect();
  const fig = document.querySelector(".cm-place img")?.getBoundingClientRect();
  return f && fig ? { h: f.height / f.width, dedans: fig.top >= f.top - 2 && fig.bottom <= f.bottom + 40, figH: fig.height / f.height } : null;
});
ok(Boolean(fen) && fen.h < 1.05 && fen.dedans && fen.figH > 0.35, `la fenêtre sur son univers : sa figurine chez elle, au milieu (${JSON.stringify(fen)})`);
ok((await m.locator('.cm-reglages[href="/univers/monde"]').count()) === 1 && (await texte(m, ".cm-humeur")) === "☀️ Ton humeur ?", "⚙️ : les réglages de son univers ; la pastille « Ton humeur ? »");
await m.locator(".cm-humeur").click();
await m.waitForSelector(".cm-feuille .rt-bloc", { timeout: 10000 }).catch(() => null);
ok((await m.locator(".cm-feuille .rt-bloc").count()) >= 1, "la pastille ouvre son humeur du jour (la feuille de toujours)");
await m.screenshot({ path: `${D}/bascule-2-chez-moi-univers.png` });
await m.keyboard.press("Escape");
await m.goto(`${ALLUME}/univers/monde`, { waitUntil: "networkidle" });
await m.waitForSelector(".um-retour", { timeout: 20000 }).catch(() => null);
ok((await m.locator('.um-retour[href="/collection#proches"]').count()) === 1, "ses réglages : « ← Chez moi » en haut");
await m.goto(`${ALLUME}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(m);
await m.waitForSelector(".tf-moi, .tf", { timeout: 20000 }).catch(() => null);
ok((await m.locator(".pn").count()) === 0, "Marc, sa figurine déjà du nouveau style : plus de « Ta figurine fait peau neuve » dans « Créer »");

// ═══ 🎁🚪 SAM LUI LAISSE UN BOUQUET, LÉA FRAPPE À SA PORTE : MARC LES DÉCOUVRE EN ARRIVANT CHEZ LUI ═══
const LEA = { id: "abababab-0000-4000-8000-000000000d03", jeton: "jeton-lea-bascule-nav-000001", prenom: "Léa" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: LEA.prenom, ville_slug: "dax" }]);
await deposer(`${LEA.id}/neutre-essai.webp`, fs.readFileSync("public/direct/double/pied/montre.webp"), "image/webp");
await semer("clik_ma_figurine", [{ habitant_id: LEA.id, prenom: LEA.prenom, photo: `${LEA.id}/photo.jpg`, accord_le: maintenant, neutre: `${LEA.id}/neutre-essai.webp`, parle: `${LEA.id}/neutre-essai.webp`, prete_le: maintenant }]);
await json(`profils/${cleProfil(LEA.id)}.json`, { h: LEA.id });
await json(`${MARC.id}/proches.json`, { ids: [SAM.id, LEA.id] });
await json(`${LEA.id}/proches.json`, { ids: [MARC.id] });
const visiter = (qui, corps) => fetch(`${ALLUME}/api/direct/visites`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify({ ...corps, cle: cleProfil(MARC.id) }) });
ok((await visiter(SAM, { action: "souvenir", objet: "fleurs", mot: "Pour ton atelier !" })).status === 200 && (await visiter(LEA, { action: "frapper" })).status === 200, "Sam laisse un bouquet chez Marc ; Léa frappe à sa porte");
await m.goto(`${ALLUME}/collection`, { waitUntil: "networkidle" });
await fermerPablito(m);
await m.waitForSelector(".vr .vr-boite", { timeout: 20000 }).catch(() => null);
ok((await texte(m, ".vr-qui")).includes("Sam t’a laissé un cadeau") && (await m.locator(".vr-points i").count()) === 2 && (await texte(m, ".vr-indice")).includes("Touche le paquet"), "en arrivant chez lui : « Sam t'a laissé un cadeau ! », un paquet à ouvrir (et une autre découverte après)");
await m.screenshot({ path: `${D}/bascule-3a-cadeau-ferme.png` });
await m.locator(".vr-boite").click();
await m.waitForSelector(".vr-objet", { timeout: 5000 }).catch(() => null);
await m.waitForTimeout(1300);
ok((await texte(m, ".vr-nom")).includes("Un bouquet") && (await texte(m, ".vr-nom")).includes("de Sam") && (await texte(m, ".vr-mot")).includes("Pour ton atelier !") && (await m.locator(".vr-confettis i").count()) > 10, "il l'ouvre : des confettis, « Un bouquet, de Sam », son mot");
await m.screenshot({ path: `${D}/bascule-3b-cadeau-ouvert.png` });
await m.locator(".vr-bouton", { hasText: "Le poser chez moi" }).click();
await m.waitForSelector(".vr-pose", { timeout: 10000 }).catch(() => null);
ok((await m.locator(".vr-pose").count()) === 1 && (await m.locator(".vr-bouton", { hasText: "Lui dire merci" }).count()) === 1, "« ✨ Le poser chez moi » : posé ; « 💬 Lui dire merci »");
await m.locator(".vr-bouton", { hasText: "Suivant" }).click();
await m.waitForSelector(".vr-porte", { timeout: 5000 }).catch(() => null);
ok((await texte(m, ".vr-titre")) === "Toc toc ! Qui est là ?" && (await m.locator(".vr-tocs b").count()) === 2, "puis : « Toc toc ! Qui est là ? », la porte qui tremble");
await m.screenshot({ path: `${D}/bascule-3c-porte.png` });
await m.locator(".vr-porte").click();
await m.waitForTimeout(1500);
ok((await texte(m, ".vr-titre")).includes("C’est Léa") && (await texte(m, ".vr-nom")).includes("aujourd’hui") && (await m.locator(".vr-bouton", { hasText: "Lui parler" }).count()) === 1 && (await m.locator('a.vr-bouton[href^="/univers/chez/"]').count()) === 0, "il ouvre : « C'est Léa ! », aujourd'hui ; « 💬 Lui parler » (pas d'univers à visiter)");
await m.screenshot({ path: `${D}/bascule-3d-porte-ouverte.png` });
await m.locator(".vr-lien", { hasText: "Fermer" }).click();
await m.waitForSelector(".vr", { state: "detached", timeout: 5000 }).catch(() => null);
await m.waitForSelector(".cm-fenetre .cm-souvenir", { timeout: 10000 }).catch(() => null);
ok((await m.locator(".vr").count()) === 0 && (await m.locator(".cm-fenetre .cm-souvenir").count()) === 1 && (await m.locator(".cm-badge-visites").count()) === 0, "refermé : le bouquet est posé dans sa fenêtre ; plus rien ne l'attend");
await m.screenshot({ path: `${D}/bascule-3e-bouquet-pose.png` });
await m.reload({ waitUntil: "networkidle" });
await m.waitForSelector(".cm-visites", { timeout: 20000 }).catch(() => null);
await m.waitForTimeout(1200);
ok((await m.locator(".vr").count()) === 0 && (await texte(m, ".cm-visites")).includes("Mes visites"), "en revenant : plus de découverte (c'est vu) ; la ligne « 🚪 Mes visites »");
await m.locator(".cm-visites").click();
await m.waitForSelector(".vr-carte.bilan", { timeout: 5000 }).catch(() => null);
const bilan = await texte(m, ".vr-carte.bilan");
ok(bilan.includes("Qui est passé chez toi") && bilan.includes("Sam") && bilan.includes("Léa") && bilan.includes("Un bouquet, de Sam"), `« Mes visites » : qui est passé, ce qui est posé chez lui (${bilan.slice(0, 120)})`);
ok((await debordement(m)) <= 1 && (await sansMotInterdit(m)), "la découverte : rien ne déborde, jamais le mot interdit");
await m.locator(".vr-fermer").click();

// ═══ « Créer » : l'invitation à refaire sa figurine au nouveau style ═══
await p.goto(`${ALLUME}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(p);
await p.waitForSelector(".pn", { timeout: 20000 }).catch(() => null);
ok((await texte(p, "#o-figurine .pn b")) === "Ta figurine fait peau neuve" && (await p.locator('#o-figurine .pn a[href="/univers/figurine"]').innerText()) === "La refaire au nouveau style", `« Créer » l'invite à refaire sa figurine (${await texte(p, "#o-figurine .pn")})`);
ok((await p.locator(".tf-moi, .tf").count()) > 0, "son studio reste là, en dessous");
await p.screenshot({ path: `${D}/bascule-3-creer.png` });

// ═══ « Ta figurine » : sa photo d'avant ═══
await p.goto(`${ALLUME}/univers/figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".nf-selfie", { timeout: 20000 }).catch(() => null);
ok((await p.locator(".nf-lien", { hasText: "Reprendre ma photo d’avant" }).count()) === 1 && (await p.locator(".nf-photo img").count()) === 0, "« 🖼️ Reprendre ma photo d’avant » lui est proposé");
await p.locator(".nf-lien", { hasText: "Reprendre ma photo d’avant" }).click();
ok((await p.locator(".nf-photo img").count()) === 1 && (await p.locator(".nf-selfie .nf-bouton").isDisabled()), "sa photo d'avant s'affiche ; les deux cases restent à cocher");
await p.locator('.nf-case input[name="moi"]').check();
await p.locator('.nf-case input[name="age"]').check();
ok(!(await p.locator(".nf-selfie .nf-bouton").isDisabled()), "« C’est bien moi » et « 15 ans ou plus » cochés : « Créer ma figurine »");
await p.screenshot({ path: `${D}/bascule-4-photo-d-avant.png` });
await p.locator(".nf-selfie .nf-bouton").click();
await p.waitForSelector(".nf-selfie", { state: "detached", timeout: 20000 }).catch(() => null);
ok((await p.locator(".nf-selfie").count()) === 0, "sa figurine du nouveau style part à l'atelier, d'après sa photo d'avant");

// ═══ UN NOUVEAU VENU : « Crée ta figurine », au nouveau style ═══
const n = await tel(ALLUME, null);
await n.goto(`${ALLUME}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(n);
await n.waitForSelector(".pn", { timeout: 20000 }).catch(() => null);
ok((await texte(n, ".pn b")) === "Crée ta figurine" && (await n.locator('.pn a[href="/univers/figurine"]').count()) === 1 && (await n.locator(".tf-envoi-photo, input[type=file]").count()) === 0, `un nouveau venu : « Crée ta figurine », au nouveau style (${await texte(n, ".pn")})`);
await n.screenshot({ path: `${D}/bascule-5-nouveau.png` });

ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ")})` : ""}`);
await b.close();
arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla bascule tient, dans le navigateur ✓");
process.exit(echecs ? 1 : 0);
