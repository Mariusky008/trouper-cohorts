// ✨ « MON VŒU » DANS « DÉCOUVRIR » (11 novembre 2026, `lib/direct/voeu.ts`) — contre le faux Supabase.
//
// À Dax, Léa et Hugo ont un vœu ; à Vevey, Zoé (Apprendre : il peut être exaucé de loin) et Max (Bouger : il faut être
// là). Tom a 15-17 ans, et un vœu. Inès arrive (elle a déjà fait un mème) : l'appli s'ouvre sur « Découvrir » ; la première page — sa bulle
// « + Ton vœu », « As-tu 18 ans ou plus ? », puis « Ta mission du jour 0/3 ». Ses trois vœux : Léa et Hugo (sa ville
// d'abord, les plus anciens d'abord), puis Zoé (de loin) — jamais Max (sur place, ailleurs), jamais Tom (15-17 ans). Elle
// encourage Léa avec SA tête déjà faite (« J'Y CROIS ! »), aide Hugo (une phrase toute prête ; un numéro est refusé),
// passe Zoé : « Mission accomplie », la série à 1. Elle fait son vœu : les tuiles, « Retouche pour une autre »,
// « Surprise », un numéro refusé, puis « Publier » — sa bulle dit « 1 j ». Léa voit la tête d'Inès (une bulle « NEW »,
// la réponse en grand, la page de son vœu) ; Hugo, l'aide ; Zoé ne saura jamais qu'Inès a passé. Léa fait évoluer son
// vœu : le reformuler, la pause, l'annuler. Tom (15-17 ans) ne croise aucun vœu d'adulte et n'a pas « Du monde ». Sam
// signale le vœu de Hugo : il quitte la distribution. Rien ne déborde, jamais le mot interdit.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, repondreFenetre } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lireStock = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? r.json().catch(() => null) : null;
};

const personne = (k, prenom, ville) => ({ id: `eeeeeeee-0000-4000-8000-0000000003${String(k).padStart(2, "0")}`, jeton: `jeton-voeu-${String(k).padStart(2, "0")}-000000000000`, prenom, ville });
const LEA = personne(1, "Léa", "dax");
const HUGO = personne(2, "Hugo", "dax");
const INES = personne(3, "Inès", "dax");
const SAM = personne(4, "Sam", "dax");
const NOA = personne(5, "Noa", "dax");
const TOM = personne(6, "Tom", "dax");
const ZOE = personne(7, "Zoé", "vevey");
const MAX = personne(8, "Max", "vevey");
const TOUS = [LEA, HUGO, INES, SAM, NOA, TOM, ZOE, MAX];

await semer("human_habitants", TOUS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: x.ville })));
const figurine = fs.readFileSync("public/direct/double/pied/salut-1.webp");
const visage = fs.readFileSync("public/direct/double/parle-1.webp");
for (const x of TOUS) await deposer(`${x.id}/neutre-essai.webp`, figurine, "image/webp");
await semer("clik_ma_figurine", TOUS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/neutre-essai.webp`, prete_le: new Date().toISOString() })));
// 🙂 Inès a déjà fait son visage d'euphorie (« J'y crois ! » le prend) ; pas les autres (sa figurine, et l'emoji)
const exprInes = `${INES.id}/expr-${crypto.createHash("sha1").update(`${INES.id}/neutre-essai.webp`).digest("hex").slice(0, 16)}`;
await deposer(`${exprInes}/euphorie-n.webp`, visage, "image/webp");
await deposer(`${exprInes}/euphorie-p.webp`, visage, "image/webp");
// Inès a déjà fait son premier mème : l'appli s'ouvre sur « Découvrir »
await semer("clik_figurine_message", [{ id: "inesmeme0001", habitant_id: INES.id, son: `${INES.id}/m-inesmeme0001.mp3`, duree: 2, commerces: [], created_at: new Date(Date.now() - 86_400_000).toISOString() }]);
// leurs âges : tous ont dit leurs 18 ans, sauf Inès et Tom (on le leur demande)
for (const x of TOUS) await json(`${x.id}/majeur.json`, x === INES || x === TOM ? { le: new Date().toISOString(), age: 15 } : { le: new Date().toISOString(), age: 15, adulte: true });
const il = (jours) => new Date(Date.now() - jours * 86_400_000).toISOString();
await semer("clik_voeu", [
  { id: "voeulea00001", habitant_id: LEA.id, texte: "Quelqu’un pour courir avec moi le dimanche matin", categorie: "bouger", ville_slug: "dax", adulte: true, a_distance: false, cree_le: il(5) },
  { id: "voeuhugo0001", habitant_id: HUGO.id, texte: "Apprendre trois accords de guitare", categorie: "apprendre", ville_slug: "dax", adulte: true, a_distance: true, cree_le: il(3) },
  { id: "voeuzoe00001", habitant_id: ZOE.id, texte: "Des conseils pour lancer ma chaîne de vidéos", categorie: "projet", ville_slug: "vevey", adulte: true, a_distance: true, cree_le: il(8) },
  { id: "voeumax00001", habitant_id: MAX.id, texte: "Un partenaire de padel cette semaine", categorie: "bouger", ville_slug: "vevey", adulte: true, a_distance: false, cree_le: il(9) },
  { id: "voeutom00001", habitant_id: TOM.id, texte: "Apprendre à faire un ollie en skate", categorie: "apprendre", ville_slug: "dax", adulte: false, a_distance: true, cree_le: il(10) },
]);

const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
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
const etat = (p) => p.evaluate(async () => (await (await fetch("/api/direct/voeu", { cache: "no-store" })).json()).etat);
const ouvrir = async (p, ancre = "") => {
  // (une adresse neuve à chaque fois : un simple changement d'ancre ne recharge pas la page)
  await p.goto(`${BASE}/collection?v=${Date.now()}${ancre}`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-decouvrir");
  await p.waitForSelector("#o-decouvrir #voeu .vx-entete", { timeout: 60000 });
};
/** La page de la carte `k` de la mission tient-elle l'écran ? */
const enHaut = (p, id) => p.evaluate((i) => Math.abs(Math.round(document.getElementById(i)?.getBoundingClientRect().top ?? 999)) <= 2, id);
const attendreEnHaut = async (p, id) => {
  for (let k = 0; k < 30; k++) {
    if (await enHaut(p, id)) return true;
    await p.waitForTimeout(150);
  }
  return false;
};

// ═══ INÈS ARRIVE : L'APPLI S'OUVRE SUR « DÉCOUVRIR » ═══
const ines = await tel(INES);
await ines.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await fermerPablito(ines);
await ines.waitForSelector("#o-decouvrir #voeu .vx-age", { timeout: 60000 });
ok(!(await ines.locator("#o-decouvrir").isHidden()) && (await ines.locator(".mc-nav button.pris").innerText()).includes("Découvrir") && (await ines.evaluate(() => location.hash)) === "#decouvrir", "son premier mème déjà fait, sans adresse : l'appli s'ouvre sur « Découvrir »");
ok((await ines.locator("#voeu .vx-mon-voeu").count()) === 0 && (await ines.locator("#voeu .vx-bulles").count()) === 0, "pas encore de vœu, ni de réponse");
ok((await texte(ines, "#voeu .vx-age")).includes("As-tu 18 ans ou plus ?") && (await ines.locator("#voeu .vx-mission").count()) === 0, "avant sa première mission : « As-tu 18 ans ou plus ? » (une fois)");
await ines.screenshot({ path: `${D}/voeu-1-age.png` });
await ines.locator("#voeu .vx-age .tj-go").click();
await ines.waitForSelector("#voeu .vx-mission", { timeout: 20000 });
ok((await texte(ines, "#voeu .vx-mission-tete")) === "Ta mission du jour 0/3" && (await ines.locator("#voeu .vx-minis button").count()) === 3, "« Ta mission du jour 0/3 » : trois vœux, en petit");
const minis = await ines.locator("#voeu .vx-minis small").allInnerTexts();
ok(minis[0].startsWith("Quelqu’un pour courir") && minis[1].startsWith("Apprendre trois accords") && minis[2].startsWith("Des conseils pour lancer"), `sa ville d'abord (Léa, Hugo), puis un vœu d'ailleurs qui peut être exaucé de loin (Zoé), avant Max (sur place, à Vevey) — jamais Tom (15-17 ans) : ${minis.map((x) => x.slice(0, 18)).join(" · ")}`);
ok((await texte(ines, "#voeu .vx-faire-un")).includes("Quelqu’un de Dax peut t’aider"), "et « ✨ Fais un vœu » (sa ville nommée)");
ok((await debordement(ines)) <= 0, "la première page ne déborde pas");
await ines.screenshot({ path: `${D}/voeu-2-accueil.png` });

// ═══ SA MISSION : TROIS VŒUX EN PLEIN ÉCRAN ═══
await ines.locator("#voeu .vx-encourager").click();
ok(await attendreEnHaut(ines, "mission-0"), "« Encourager · 1 minute » : le premier vœu, en plein écran");
const carte0 = await texte(ines, "#mission-0");
ok(carte0.includes("Quelqu’un pour courir avec moi le dimanche matin") && carte0.includes("Léa") && carte0.includes("Son vœu, jour 6") && carte0.includes("Bouger") && carte0.includes("Encourage Léa avec ta tête"), "la figurine de Léa dit son vœu ; « Son vœu, jour 6 » ; « Encourage Léa avec ta tête »");
const tetes = ines.locator("#mission-0 .vx-tetes button");
ok((await tetes.count()) === 4 && (await ines.locator("#mission-0 .vx-tetes small").allInnerTexts()).map((x) => x.trim()).join("|") === "J’y crois !|Trop bien|Courage|Moi aussi !", "quatre têtes : J'y crois ! · Trop bien · Courage · Moi aussi !");
const srcs = await ines.locator("#mission-0 .vx-tetes img").evaluateAll((l) => l.map((i) => i.getAttribute("src") ?? ""));
ok(srcs[0].includes("/expr-") && srcs[0].includes("euphorie-n") && srcs.slice(1).every((s) => s.includes("neutre-essai")) && (await ines.locator("#mission-0 .vx-tetes button:first-child i").count()) === 0 && (await ines.locator("#mission-0 .vx-tetes button:nth-child(2) i").count()) === 1, "SES visages déjà faits (son euphorie pour « J'y crois ! ») ; pas encore fait : sa figurine et l'emoji");
ok((await texte(ines, "#mission-0 .vx-note")).startsWith("Léa ne saura jamais que tu as passé"), "« Léa ne saura jamais que tu as passé · Signaler »");
await ines.screenshot({ path: `${D}/voeu-3-carte.png` });
await tetes.first().click();
await ines.waitForSelector("#mission-0 .vx-pose .vx-sticker", { timeout: 10000 });
ok((await texte(ines, "#mission-0 .vx-pose .vx-sticker")) === "J’Y CROIS !", "sa tête se pose sur la scène : « J'Y CROIS ! »");
await ines.screenshot({ path: `${D}/voeu-4-tete.png` });
ok(await attendreEnHaut(ines, "mission-1"), "puis le vœu suivant, tout seul");

// ✋ « Je peux aider » : Hugo
await ines.locator("#mission-1 .vx-aide").click();
await ines.waitForSelector(".vx-aider.ouverte .vx-phrases button", { timeout: 10000 });
ok((await texte(ines, ".vx-aider .tf-feuille-titre")) === "Ta figurine dit à Hugo :" && (await ines.locator(".vx-aider .vx-phrases button:not(.vx-libre)").count()) === 3, "« Ta figurine dit à Hugo : » — trois phrases toutes prêtes");
ok((await ines.locator(".vx-aider .vx-envoyer").isDisabled()) && (await texte(ines, ".vx-aider .vx-voix")).includes("Ou dis-le avec ta voix"), "rien de choisi : « Envoyer » attend ; « 🎙️ Ou dis-le avec ta voix »");
await ines.locator(".vx-aider .vx-libre").click();
await ines.locator(".vx-aider .vx-libre-champ textarea").fill("Appelle-moi au 06 12 34 56 78");
await ines.locator(".vx-aider .vx-envoyer").click();
await ines.waitForSelector(".vx-aider .tf-erreur", { timeout: 10000 });
ok((await texte(ines, ".vx-aider .tf-erreur")).includes("Pas de numéro"), `un numéro est refusé (${await texte(ines, ".vx-aider .tf-erreur")})`);
const phrase = (await ines.locator(".vx-aider .vx-phrases button:not(.vx-libre)").first().innerText()).trim();
await ines.locator(".vx-aider .vx-phrases button:not(.vx-libre)").first().click();
ok((await texte(ines, ".vx-aider .vx-apercu-bulle")) === phrase, `sa figurine le dit, dans sa bulle (« ${phrase} »)`);
await ines.screenshot({ path: `${D}/voeu-5-aider.png` });
await ines.locator(".vx-aider .vx-envoyer").click();
await ines.waitForSelector(".vx-aider:not(.ouverte)", { state: "attached", timeout: 10000 });
await ines.waitForSelector("#mission-1 .vx-pose .vx-sticker.aide", { timeout: 10000 });
ok(await attendreEnHaut(ines, "mission-2"), "l'aide est partie : le vœu suivant");

// passer : Zoé
ok((await texte(ines, "#mission-2")).includes("Zoé"), "le troisième : Zoé (de Vevey : son vœu peut être exaucé de loin)");
await ines.locator("#mission-2 .vx-boutons .vx-second").click();
await ines.waitForSelector("#mission-fin", { timeout: 10000 });
ok(await attendreEnHaut(ines, "mission-fin"), "passer : « Mission accomplie »");
const fini = await texte(ines, "#mission-fin");
ok(fini.includes("1 jour") && fini.includes("Mission accomplie !") && fini.includes("Fais un vœu : demain, il passera en premier.") && !/19 h/.test(fini), `la série à 1 ; « Fais un vœu : demain, il passera en premier » (${fini.slice(0, 70)})`);
ok((await debordement(ines)) <= 0, "les pages de la mission ne débordent pas");
await ines.screenshot({ path: `${D}/voeu-6-fini.png` });
await ines.evaluate(() => window.scrollTo(0, 0));
await ines.waitForTimeout(500);
ok((await texte(ines, "#voeu .vx-mission-tete")) === "Ta mission du jour 3/3" && (await ines.locator("#voeu .vx-minis button.faite").count()) === 3 && (await ines.locator("#voeu .vx-encourager").count()) === 0 && (await texte(ines, "#voeu .vx-entete .vx-flamme")) === "🔥 1", "en haut : 3/3, les trois cochés, 🔥 1");

// ═══ INÈS FAIT SON VŒU ═══
await ines.locator("#voeu .vx-faire-un").click();
await ines.waitForSelector(".vx-faire.ouverte .vx-tuiles", { timeout: 10000 });
const tuiles = (await ines.locator(".vx-faire .vx-tuiles button").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
ok(tuiles.length === 8 && tuiles.join("|").includes("Du monde") && tuiles.at(-1).endsWith("Surprise"), `huit tuiles, dont « Surprise » (${tuiles.join(" · ")})`);
ok((await texte(ines, ".vx-faire .tf-feuille-dit")) === "Une envie qu’une personne de Dax pourrait t’aider à réaliser." && (await texte(ines, ".vx-faire .vx-un-seul")).includes("Un seul vœu à la fois"), "« Une envie qu'une personne de Dax pourrait t'aider à réaliser » ; « Un seul vœu à la fois »");
await ines.locator(".vx-faire .vx-tuiles button", { hasText: "Bouger" }).click();
const v1 = await ines.locator(".vx-faire .vx-champ textarea").inputValue();
await ines.locator(".vx-faire .vx-tuiles button", { hasText: "Bouger" }).click();
const v2 = await ines.locator(".vx-faire .vx-champ textarea").inputValue();
ok(v1.length > 10 && v2.length > 10 && v1 !== v2 && (await texte(ines, ".vx-faire .vx-scene-moi .vx-dit")) === v2, `une tuile : un vœu tout prêt, dans sa bulle ; retouchée : un autre (« ${v1} » → « ${v2} »)`);
await ines.locator(".vx-faire .vx-surprise").click();
await ines.waitForFunction((avant) => document.querySelector(".vx-faire .vx-champ textarea")?.value !== avant, v2, { timeout: 15000 });
const v3 = await ines.locator(".vx-faire .vx-champ textarea").inputValue();
ok(v3.length > 10 && (await ines.locator(".vx-faire .vx-tuiles button.pris").count()) === 1, `« Surprise » (sans carte de personnage : un vœu tout prêt, au hasard) : « ${v3} », et sa tuile`);
await ines.locator(".vx-faire .vx-champ textarea").fill("Courir le soir, écris-moi au 06 12 34 56 78");
await ines.locator(".vx-faire .vx-publier").click();
await ines.waitForSelector(".vx-faire .tf-erreur", { timeout: 10000 });
ok((await texte(ines, ".vx-faire .tf-erreur")).includes("Pas de numéro"), "un numéro dans son vœu : refusé");
await ines.locator(".vx-faire .vx-champ textarea").fill("Quelqu’un pour courir avec moi le soir, au bord de l’Adour");
await ines.locator(".vx-faire .vx-tuiles button", { hasText: "Bouger" }).click();
ok((await ines.locator(".vx-faire .vx-champ textarea").inputValue()).includes("Adour"), "son texte à elle : une tuile dit seulement de quoi il s'agit (le texte reste)");
ok((await debordement(ines)) <= 0 && !/exemple/i.test(await texte(ines, ".vx-faire")), "« Fais un vœu » ne déborde pas, sans le mot interdit");
await ines.screenshot({ path: `${D}/voeu-7-faire.png` });
await ines.locator(".vx-faire .vx-publier").click();
await ines.waitForSelector(".vx-faire:not(.ouverte)", { state: "attached", timeout: 15000 });
await ines.waitForSelector("#voeu .vx-mon-voeu", { timeout: 15000 });
const sonVoeu = await texte(ines, "#voeu .vx-mon-voeu");
ok(sonVoeu.includes("au bord de l’Adour") && sonVoeu.includes("1 jour en route") && sonVoeu.includes("0 vue") && (await ines.locator("#voeu .vx-faire-un").count()) === 0, `« ✨ Publier mon vœu » : son vœu, en grand, en haut de la page — sa figurine le dit, « 1 jour en route », « 0 vue » (${sonVoeu})`);
const [sien] = await lire("clik_voeu", `habitant_id=eq.${INES.id}`);
ok(sien?.categorie === "bouger" && sien.ville_slug === "dax" && sien.adulte === true && sien.a_distance === false && sien.statut === "en_route", "son vœu : Bouger, à Dax, d'adulte, sur place, en route");

// ═══ LÉA : LA TÊTE D'INÈS ═══
const lea = await tel(LEA);
await ouvrir(lea, "#decouvrir");
ok((await texte(lea, "#voeu .vx-mon-voeu .vx-compteur")) === "6 jours en route" && (await texte(lea, "#voeu .vx-ce-soir")).startsWith("1 nouvelle réponse"), "Léa : son vœu, « 6 jours en route », « 1 nouvelle réponse »");
const bulleInes = lea.locator("#voeu .vx-bulle.neuve");
ok((await bulleInes.count()) === 1 && (await texte(lea, "#voeu .vx-bulle.neuve")).includes("Inès") && (await texte(lea, "#voeu .vx-bulle.neuve em")) === "NEW", "la bulle d'Inès, un anneau rose, « NEW »");
await bulleInes.click();
await lea.waitForSelector(".vx-story", { timeout: 10000 });
ok((await texte(lea, ".vx-story .vx-sticker")) === "J’Y CROIS !" && (await texte(lea, ".vx-story-tete")).includes("Inès") && (await lea.locator(".vx-story .vx-story-fig").getAttribute("src")).includes("euphorie-n"), "la réponse en grand : la tête d'euphorie d'Inès, « J'Y CROIS ! »");
await lea.screenshot({ path: `${D}/voeu-8-reponse.png` });
await lea.locator(".vx-story-fermer").click();
let nonVues = 1;
for (let k = 0; k < 20 && nonVues; k++) {
  nonVues = (await etat(lea)).nonVues;
  if (nonVues) await lea.waitForTimeout(200);
}
ok(nonVues === 0 && (await lea.locator("#voeu .vx-bulle.neuve").count()) === 0, "vue : le badge s'éteint");
await lea.locator("#voeu .vx-mon-voeu").click();
await lea.waitForSelector(".vx-page.ouverte .vx-reponses", { timeout: 10000 });
const page = await texte(lea, ".vx-page");
ok(page.includes("Quelqu’un pour courir avec moi le dimanche matin") && page.includes("6 jours en route") && page.includes("1 vue") && page.includes("1 figurine croit en ton vœu") && page.includes("Inès"), "la page de son vœu : 6 jours en route, 1 vue, 1 figurine croit en ton vœu, la réponse d'Inès");
await lea.screenshot({ path: `${D}/voeu-9-mon-voeu.png` });
// faire évoluer : le reformuler (le compteur continue), la pause, l'annuler
await lea.locator(".vx-page .vx-evoluer").click();
await lea.locator(".vx-page .vx-options button", { hasText: "Le reformuler" }).click();
await lea.locator(".vx-page .vx-dit-champ textarea").fill("Quelqu’un pour courir le dimanche matin, aux Arènes");
await lea.locator(".vx-page .vx-boutons .tj-go").click();
await lea.waitForFunction(() => document.querySelector(".vx-page .vx-scene-moi .vx-dit")?.textContent?.includes("Arènes"), null, { timeout: 10000 });
ok((await texte(lea, ".vx-page .vx-compteur")) === "6 jours en route", "reformulé : « … aux Arènes », et le compteur continue (6 jours)");
await lea.locator(".vx-page .vx-options button", { hasText: "Le mettre en pause" }).click();
await lea.waitForSelector(".vx-page .vx-pause", { timeout: 10000 });
ok((await texte(lea, "#voeu .vx-mon-voeu .vx-vues")) === "⏸️ En pause" && (await lea.locator(".vx-page .vx-options button", { hasText: "Le reprendre" }).count()) === 1, "en pause : « ⏸️ En pause » sur son vœu, « ▶️ Le reprendre »");
await lea.locator(".vx-page .vx-options button", { hasText: "Le reprendre" }).click();
await lea.waitForSelector(".vx-page .vx-pause", { state: "detached", timeout: 10000 });
await lea.locator(".vx-page .vx-options button", { hasText: "L’annuler" }).click();
const qAnnuler = await repondreFenetre(lea, true);
await lea.waitForSelector("#voeu .vx-faire-un", { timeout: 10000 });
ok(qAnnuler.includes("Annuler ton vœu") && (await lire("clik_voeu", "id=eq.voeulea00001"))[0]?.statut === "annule" && (await lea.locator("#voeu .vx-mon-voeu").count()) === 0, "« 🗑️ L'annuler » (une question d'abord) : « ✨ Fais un vœu » revient à sa place");

// ═══ HUGO : L'AIDE ; ZOÉ : RIEN (ELLE NE SAURA JAMAIS QU'INÈS A PASSÉ) ═══
const hugo = await tel(HUGO);
await ouvrir(hugo, "#voeu");
ok((await texte(hugo, "#voeu .vx-bulle.aide em")) === "AIDE" && (await texte(hugo, "#voeu .vx-ce-soir")).includes("dont 1 aide"), "Hugo : une bulle « AIDE », « 1 nouvelle réponse, dont 1 aide »");
await hugo.locator("#voeu .vx-bulle.aide").click();
await hugo.waitForSelector(".vx-story", { timeout: 10000 });
ok((await texte(hugo, ".vx-story .vx-story-dit")) === phrase && (await texte(hugo, ".vx-story .vx-sticker")) === "✋ PEUT T’AIDER", `l'aide en grand : « ${phrase} », « PEUT T'AIDER »`);
ok((await hugo.locator(".vx-story .vx-story-gestes .tj-go").innerText()).includes("Lui répondre avec ma figurine") && (await hugo.locator(".vx-story .vx-story-gestes .vx-second").innerText()).includes("Pas pour moi"), "et deux boutons : « Lui répondre avec ma figurine », « Pas pour moi »");
await hugo.locator(".vx-story-fermer").click();
// ✋ en haut de sa page, en grand : « Inès peut t'aider » (12 novembre 2026, le propriétaire : « il n'y a rien qui
// spécifie que quelqu'un peut l'aider, et ensuite avoir la suite pour savoir comment ils vont s'entraider »)
const aideCarte = await texte(hugo, "#voeu .vx-aide-carte");
ok(aideCarte.includes("✋ Inès peut t’aider") && aideCarte.includes(phrase) && aideCarte.includes("Lui répondre avec ma figurine") && aideCarte.includes("Pas pour moi") && aideCarte.includes("vous devenez proches"), `sa page : « ✋ Inès peut t'aider », sa phrase, et les deux boutons (${aideCarte.slice(0, 90)})`);
await hugo.screenshot({ path: `${D}/voeu-8b-aide.png` });
await hugo.locator("#voeu .vx-aide-carte .tj-go").click();
await hugo.waitForSelector(".vx-proches.ouverte .vx-proches-titre", { timeout: 15000 });
const prochesHugo = await lireStock(`${HUGO.id}/proches.json`);
const prochesInes = await lireStock(`${INES.id}/proches.json`);
ok((await texte(hugo, ".vx-proches .vx-proches-titre")) === "Inès et toi, proches !" && prochesHugo?.ids?.includes(INES.id) && prochesInes?.ids?.includes(HUGO.id), "« Lui répondre avec ma figurine » : « Inès et toi, proches ! » — chacun dans les proches de l'autre");
await hugo.screenshot({ path: `${D}/voeu-8c-proches.png` });
await hugo.locator(".vx-proches .tj-go").click();
await hugo.waitForSelector(".pr-plein .pr-qui", { timeout: 30000 });
ok(!(await hugo.locator("#o-proches").isHidden()) && (await texte(hugo, ".pr-plein .pr-qui")).includes("Inès"), "« 🎙️ Parler à Inès » : leur conversation s'ouvre dans « Proches », avec leurs figurines");
await ouvrir(hugo, "#voeu");
ok((await hugo.locator("#voeu .vx-aide-carte").count()) === 0 && (await etat(hugo)).reponses.find((r) => r.genre === "aide")?.decision === "accepte", "sa page : l'aide n'attend plus de réponse (« PROCHE » dans ses réponses)");
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/collection#voeu`, { waitUntil: "networkidle" });
const ez = await etat(zoe);
const passeParInes = (await lire("clik_voeu_vue", `voeu_id=eq.voeuzoe00001&destinataire_id=eq.${INES.id}`))[0];
ok(passeParInes?.geste === "passe" && ez.reponses.length === 0 && ez.voeu.vues >= 1 && ez.voeu.croient === 0, `Zoé : vu ${ez.voeu.vues} fois, aucune réponse — elle ne saura jamais qu'Inès a passé`);

// ═══ TOM, 15-17 ANS : AUCUN VŒU D'ADULTE, PAS DE « DU MONDE » ═══
const tom = await tel(TOM);
await ouvrir(tom, "#decouvrir");
await tom.locator("#voeu .vx-age .vx-second").click();
const qTom = await repondreFenetre(tom, true);
await tom.waitForSelector("#voeu .vx-mission", { timeout: 15000 });
const videTom = await texte(tom, "#voeu .vx-mission");
ok(qTom.includes("15 et 17 ans") && videTom.includes("Pas encore d’autre vœu à Dax aujourd’hui") && videTom.includes("ils encourageront le tien") && (await tom.locator("#voeu .vx-inviter").count()) === 1 && (await tom.locator("#mission-0").count()) === 0, `Tom (15-17 ans, une question d'abord) : aucun vœu d'adulte à encourager — « Invite tes amis », « 📲 Inviter mes amis » (${videTom})`);
// 📲 « Inviter mes amis » : le partage du téléphone (ici, celui du navigateur, attrapé)
await tom.evaluate(() => {
  window.__partage = null;
  navigator.share = async (d) => {
    window.__partage = d;
  };
});
await tom.locator("#voeu .vx-inviter").click();
const partage = await tom.evaluate(() => window.__partage);
ok(partage?.url?.endsWith("/collection") && partage.text.includes("on fait un vœu avec sa figurine"), `le partage : le lien de ClikMe, et « ${partage?.text} »`);
const eTom = await etat(tom);
ok(eTom.adulte === false && eTom.voeu?.texte?.includes("ollie"), "son âge est gardé ; son vœu à lui reste en route");
const reponse = await tom.evaluate(async () => (await fetch("/api/direct/voeu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "dix-huit", oui: true }) })).json());
ok(reponse.etat?.adulte === false, "et un « non » ne se change pas en « oui »");
await tom.locator("#voeu .vx-mon-voeu").click();
await tom.waitForSelector(".vx-page.ouverte", { timeout: 10000 });
await tom.locator(".vx-page .vx-evoluer").click();
await tom.locator(".vx-page .vx-options button", { hasText: "En faire un autre" }).click();
await tom.waitForSelector(".vx-faire.ouverte .vx-tuiles", { timeout: 10000 });
const tuilesTom = (await tom.locator(".vx-faire .vx-tuiles button").allInnerTexts()).join("|");
ok(!tuilesTom.includes("Du monde") && (await tom.locator(".vx-faire .vx-tuiles button").count()) === 7 && (await texte(tom, ".vx-faire .tf-feuille-titre")) === "Un autre vœu", "« En faire un autre » : ses tuiles, sans « Du monde »");

// ═══ SAM SIGNALE LE VŒU DE HUGO : IL QUITTE LA DISTRIBUTION ═══
const sam = await tel(SAM);
await ouvrir(sam, "#decouvrir");
const minisSam = await sam.locator("#voeu .vx-minis small").allInnerTexts();
const kHugo = minisSam.findIndex((x) => x.startsWith("Apprendre trois accords"));
ok(kHugo >= 0, `Sam reçoit le vœu de Hugo (${minisSam.map((x) => x.slice(0, 16)).join(" · ")})`);
// 🙂 puis ✋ : Sam encourage le vœu d'Inès avec sa tête, puis propose aussi son aide (12 novembre 2026 : sa tête ne ferme
// plus « Je peux aider »)
const kInes = minisSam.findIndex((x) => x.includes("au bord de l’Adour"));
await sam.evaluate((k) => document.getElementById(`mission-${k}`)?.scrollIntoView(), kInes);
await sam.locator(`#mission-${kInes} .vx-tetes button`).nth(1).click();
await sam.waitForSelector(`#mission-${kInes} .vx-pose .vx-sticker`, { timeout: 10000 });
await sam.waitForTimeout(1300);
await sam.evaluate((k) => document.getElementById(`mission-${k}`)?.scrollIntoView(), kInes);
ok(!(await sam.locator(`#mission-${kInes} .vx-aide`).isDisabled()) && (await sam.locator(`#mission-${kInes} .vx-boutons .vx-second`).isDisabled()), "après sa tête, « Je peux aider » reste possible (« Passer », non)");
await sam.locator(`#mission-${kInes} .vx-aide`).click();
await sam.waitForSelector(".vx-aider.ouverte .vx-phrases button", { timeout: 10000 });
await sam.locator(".vx-aider .vx-phrases button:not(.vx-libre)").nth(1).click();
await sam.locator(".vx-aider .vx-envoyer").click();
await sam.waitForSelector(".vx-aider:not(.ouverte)", { state: "attached", timeout: 10000 });
const vueSam = (await lire("clik_voeu_vue", `destinataire_id=eq.${SAM.id}&auteur_id=eq.${INES.id}`))[0];
ok(vueSam?.geste === "aide" && vueSam.tete === "tropbien" && !vueSam.vu_le, "son aide prend la place de sa tête (gardée), et Inès la verra comme une nouvelle réponse");
await sam.evaluate((k) => document.getElementById(`mission-${k}`)?.scrollIntoView(), kHugo);
await sam.locator(`#mission-${kHugo} .vx-note .vx-lien`).click();
const qSignaler = await repondreFenetre(sam, true);
await sam.waitForSelector(`#mission-${kHugo} .vx-pose-passe`, { timeout: 10000 });
ok(qSignaler.includes("Signaler ce vœu") && Boolean((await lire("clik_voeu", "id=eq.voeuhugo0001"))[0]?.signale_le), "« Signaler » (une question d'abord) : le vœu de Hugo est mis de côté");
// ✋ Inès : « Sam peut t'aider » — « Pas pour moi » (Sam ne le saura jamais)
await ouvrir(ines, "#voeu");
await ines.waitForSelector("#voeu .vx-aide-carte", { timeout: 15000 });
ok((await texte(ines, "#voeu .vx-aide-carte")).includes("✋ Sam peut t’aider") && (await texte(ines, "#voeu .vx-bulle.aide em")) === "AIDE", "Inès : « ✋ Sam peut t'aider », et sa bulle « AIDE »");
await ines.locator("#voeu .vx-aide-carte .vx-second").click();
await ines.waitForSelector("#voeu .vx-aide-carte", { state: "detached", timeout: 10000 });
const sonVoeuInes = (await lire("clik_voeu", `habitant_id=eq.${INES.id}`))[0];
const decisionsInes = await lireStock(`${INES.id}/voeux/aides-${sonVoeuInes.id}.json`);
ok(Object.values(decisionsInes ?? {}).some((d) => d.choix === "refuse") && !(await lireStock(`${SAM.id}/proches.json`))?.ids?.includes(INES.id), "« Pas pour moi » : l'aide n'attend plus ; ils ne deviennent pas proches (et Sam n'en sait rien)");
const noa = await tel(NOA);
await ouvrir(noa, "#decouvrir");
const minisNoa = (await noa.locator("#voeu .vx-minis small").allInnerTexts()).join("|");
ok(!minisNoa.includes("Apprendre trois accords") && minisNoa.includes("au bord de l’Adour"), `Noa ne le reçoit plus ; le vœu d'Inès, oui (${minisNoa.slice(0, 90)})`);
// 📍 sa ville n'a plus assez de vœux : ceux d'ailleurs, même ceux où il faut être là (Max, à Vevey) — pour l'encourager
// avec sa tête ; « Je peux aider » cède la place à « Ce vœu se réalise à Vevey » (12 novembre 2026)
const kMax = (await noa.locator("#voeu .vx-minis small").allInnerTexts()).findIndex((x) => x.startsWith("Un partenaire de padel"));
ok(kMax === 2, `sa ville (Inès), puis de loin (Zoé), puis Max, sur place à Vevey (${minisNoa.slice(0, 120)})`);
await noa.evaluate((k) => document.getElementById(`mission-${k}`)?.scrollIntoView(), kMax);
const carteMax = await texte(noa, `#mission-${kMax}`);
ok(carteMax.includes("Son vœu, jour 10 · Vevey") && carteMax.includes("📍 Ce vœu se réalise à Vevey : encourage-le avec ta tête") && (await noa.locator(`#mission-${kMax} .vx-aide`).count()) === 0 && (await noa.locator(`#mission-${kMax} .vx-tetes button`).count()) === 4, "la carte de Max : « Son vœu, jour 10 · Vevey » ; ses quatre têtes ; pas de « Je peux aider », mais « 📍 Ce vœu se réalise à Vevey »");
const vueMax = (await etat(noa)).mission.cartes[kMax].vue;
const aideMax = await noa.evaluate(async (vue) => {
  const r = await fetch("/api/direct/voeu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "geste", vue, geste: "aide", texte: "Je viens avec toi !" }) });
  return { statut: r.status, ...(await r.json()) };
}, vueMax);
ok(aideMax.statut === 400 && aideMax.error.includes("se réalise à Vevey"), `une aide quand même (par la route) : refusée (${aideMax.error})`);
await noa.locator(`#mission-${kMax} .vx-tetes button`).nth(2).click();
await noa.waitForSelector(`#mission-${kMax} .vx-pose .vx-sticker`, { timeout: 10000 });
ok((await texte(noa, `#mission-${kMax} .vx-pose .vx-sticker`)) === "COURAGE !", "sa tête, oui : « COURAGE ! »");
await noa.screenshot({ path: `${D}/voeu-10-loin.png` });

// ═══ PARTOUT : PAS D'ERREUR, RIEN QUI DÉBORDE, JAMAIS LE MOT INTERDIT ═══
for (const [nom, p] of [["Inès", ines], ["Léa", lea], ["Hugo", hugo], ["Tom", tom], ["Sam", sam], ["Noa", noa]]) {
  ok(p.err.length === 0, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err[0]})` : ""}`);
  ok(!/exemple/i.test(await texte(p, "#o-decouvrir")), `${nom} : jamais le mot interdit dans « Découvrir »`);
}

await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
