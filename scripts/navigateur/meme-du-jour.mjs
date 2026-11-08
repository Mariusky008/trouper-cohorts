// 🔥 LE LOT 2 : LE MÈME DU JOUR AU CENTRE, 😂 ❤️ 🔥, LES PROCHES D'ABORD, LA CARTE SOBRE DES COMMERÇANTS — contre le faux
// Supabase.
//
// À Dax, quatre habitants ont déjà répondu au mème du jour. Hugo le voit en haut de « Créer » et de « Découvrir » :
// « Sois parmi les premiers à répondre » (moins de cinq : pas de chiffre) ; il ne voit pas leurs réponses avant d'avoir
// posté la sienne. Le fil : deux commerçants, mais un seul montré (au plus un sur cinq). Léa répond depuis « Créer » :
// le thème, ses trois idées, sa voix, son mème, « 🔥 Poster ma réponse (visible par les gens de Dax) » — puis elle voit
// les réponses, la sienne d'abord, et « 5 réponses à Dax ». Hugo répond aussi : la sienne, puis Léa (une proche, de ses
// Rencontres), puis les autres. Il réagit : 😂, puis ❤️ (une seule à la fois), et 🔥 au commerçant. Léa voit ❤️ 1 dans
// « Mes mèmes ». Sans compte : « Crée ta figurine pour répondre », et pas de réaction. Rien ne déborde, jamais le mot
// interdit.
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer, repondreFenetre } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const jour = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();
const deposer = (seau, chemin, corps, type) => fetch(`${STOCK}/${seau}/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (seau, chemin, x) => deposer(seau, chemin, JSON.stringify(x), "application/json");
const existe = async (seau, chemin) => (await fetch(`${STOCK}/${seau}/${chemin}`)).status === 200;

const LEA = { id: "dddddddd-0000-4000-8000-000000000091", jeton: "jeton-lea-jour-00000000001", prenom: "Léa" };
const HUGO = { id: "dddddddd-0000-4000-8000-000000000092", jeton: "jeton-hugo-jour-0000000001", prenom: "Hugo" };
const AUTRES = ["Sam", "Noa", "Lou", "Eden"].map((prenom, k) => ({ id: `dddddddd-0000-4000-8000-00000000009${3 + k}`, prenom, msg: `jouraaaaaaa${k}` }));

await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000000091", slug: "chez-bergine-jour", channel: "letter", business_name: "Chez Bergine", city: "40100 Dax", activite: "Restaurant", published: true, est_client: true }]);
await semer("human_habitants", [LEA, HUGO, ...AUTRES].map((x) => ({ id: x.id, device_token: x.jeton ?? `jeton-${x.id}`, prenom: x.prenom, ville_slug: "dax" })));
const figurine = fs.readFileSync("public/direct/double/pied/salut-1.webp");
for (const x of [LEA, HUGO, ...AUTRES]) {
  await deposer("figurines-clients", `${x.id}/neutre-essai.webp`, figurine, "image/webp");
  await deposer("figurines-clients", `${x.id}/parle-essai.webp`, fs.readFileSync("public/direct/double/parle-1.webp"), "image/webp");
}
await semer(
  "clik_ma_figurine",
  [LEA, HUGO, ...AUTRES].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
// Léa est une amie de Hugo (ses Rencontres) : une proche
await json("figurines-clients", `${HUGO.id}/rencontres.json`, { amis: [LEA.id] });
// une réponse au mème du jour, posée comme le fait la route : le message, sa vidéo, sa fiche publique et celle du jour
async function reponse(h, id, minutes) {
  const le = new Date(Date.now() - minutes * 60_000).toISOString();
  await semer("clik_figurine_message", [{ id, habitant_id: h, son: `${h}/m-${id}.mp3`, duree: 2, commerces: [], created_at: le }]);
  await deposer("figurines-clients", `${h}/meme-${id}.mp4`, Buffer.alloc(2048, 1), "video/mp4");
  await json("figurines-clients", `${h}/m-${id}.json`, { meme: `${h}/meme-${id}.mp4`, memeType: "video/mp4", public: { ville: "dax", jour, le }, duJour: jour });
  await json("figurines-clients", `publics/dax/${jour}/${id}.json`, { id, h, le });
  await json("figurines-clients", `du-jour/dax/${jour}/${id}.json`, { id, h, le });
  await json("figurines-clients", `${h}/du-jour/${jour}.json`, { id });
}
for (const [k, x] of AUTRES.entries()) await reponse(x.id, x.msg, 30 + k);
// deux mèmes de commerçants à Dax (le fil n'en montrera qu'un : au plus un sur cinq)
const COMMERCES = ["bergine0001a", "bergine0002b"];
for (const [k, id] of COMMERCES.entries()) {
  const m = { id, slug: "chez-bergine-jour", nom: "Chez Bergine", ville: "Dax", villeSlug: "dax", type: "menu", emoji: "🍽️", titre: "Le menu du jour", texte: "Le plat du jour", video: `${STOCK}/public/figurines-pros/x/memes/${id}.mp4`, videoType: "video/mp4", image: "", le: new Date(Date.now() - k * 60_000).toISOString() };
  await json("figurines-pros", `memes/${id}.json`, m);
  await json("figurines-pros", `memes-du-jour/dax/${jour}/${id}.json`, m);
}

const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
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
const api = (p, corps) =>
  p.evaluate(async (c) => {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
    return { statut: r.status, ...(await r.json().catch(() => ({}))) };
  }, corps);

// ═══ HUGO : LE MÈME DU JOUR EN HAUT DE « DÉCOUVRIR » (il a quitté « Créer » le 8 novembre 2026) ═══
const hugo = await tel(HUGO);
await hugo.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-figurine");
await hugo.waitForSelector("#o-figurine .tf-onglets", { timeout: 60000 });
ok((await hugo.locator("#o-figurine .tj, #o-figurine #jour").count()) === 0, "« Créer » ne répète plus le mème du jour (il est dans « Découvrir »)");
await hugo.goto(`${BASE}/collection#jour`, { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-decouvrir");
await hugo.waitForSelector("#o-decouvrir #jour .tj-titre", { timeout: 60000 });
const titre = await texte(hugo, "#o-decouvrir #jour .tj-titre");
ok(titre.length > 5 && (await texte(hugo, "#o-decouvrir #jour .tj-chiffres")) === "Sois parmi les premiers à répondre" && (await hugo.locator("#o-decouvrir #jour .tj-go").count()) === 1 && (await hugo.locator(".mc-nav button.pris").innerText()).includes("Découvrir"), `« #jour » (la notification) ouvre « Découvrir » : le mème du jour (${titre}), « Sois parmi les premiers » (4 réponses : pas de chiffre)`);
await hugo.goto(`${BASE}/collection#decouvrir`, { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-decouvrir");
await hugo.waitForSelector("#o-decouvrir .dv-jour", { timeout: 60000 });
ok((await texte(hugo, "#o-decouvrir .dv-jour .tj-titre")) === titre && (await hugo.locator("#o-decouvrir .dv-fil-jour .dv-carte").count()) === 0 && (await texte(hugo, ".dv-flou")).includes("tu verras les réponses de Dax"), "en haut de « Découvrir » : le même thème ; leurs réponses, seulement après la sienne");
ok((await hugo.locator("#o-decouvrir .dv-carte.commerce").count()) === 1 && (await hugo.locator("#o-decouvrir .dv-carte.client").count()) === 0, "le fil : deux commerçants, un seul montré (au plus un sur cinq) ; les réponses du jour n'y sont pas deux fois");
await hugo.screenshot({ path: `${D}/meme-du-jour-1-hugo.png` });

// ═══ LÉA RÉPOND DEPUIS « DÉCOUVRIR » : le studio s'ouvre sur le thème ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}/collection#decouvrir`, { waitUntil: "networkidle" });
await fermerPablito(lea, "#o-decouvrir");
await lea.waitForSelector("#o-decouvrir #jour .tj-go", { timeout: 60000 });
await lea.locator("#o-decouvrir #jour .tj-go").click();
await fermerPablito(lea, "#o-figurine");
await lea.waitForSelector("#theme-du-jour .tf-theme-idees button", { timeout: 15000 });
const idees = (await lea.locator("#theme-du-jour .tf-theme-idees button").allInnerTexts()).map((x) => x.replace(/^💡\s*/, "").trim());
ok((await texte(lea, "#theme-du-jour")).includes(titre) && idees.length === 3, `le studio s'ouvre sur le thème, et trois idées (${idees[0]})`);
// « 🎲 Surprends-moi ! » répond au thème (sans carte de personnage : une de ses trois idées)
const etatJour = await lea.evaluate(async () => (await (await fetch("/api/direct/ma-figurine?jour=1", { cache: "no-store" })).json()).jour);
const surprise = await api(lea, { action: "surprise", theme: etatJour?.theme?.cle });
ok(surprise.statut === 200 && idees.includes(surprise.texte), `« 🎲 Surprends-moi ! » répond au thème du jour (${surprise.texte})`);
await lea.locator("#theme-du-jour .tf-theme-idees button").first().click();
ok((await lea.locator(".tf-moi .tf-texte textarea").inputValue()) === idees[0], "un toucher sur une idée : le texte est écrit");
await lea.locator(".tf-moi .tf-quelle-voix button", { hasText: "voix de femme" }).click();
await lea.locator(".tf-moi .tf-ecouter").click();
await lea.waitForSelector(".tf-envoyer", { timeout: 30000 });
await lea.locator(".tf-envoyer").click();
await lea.waitForSelector(".tf-meme-pret video", { timeout: 90000 });
const poster = await texte(lea, ".tf-poster-jour");
ok(poster === "🔥 Poster ma réponse (visible par les gens de Dax)" && (await lea.locator(".tf-meme-pret .tf-public").count()) === 0, `son mème est prêt : « ${poster} » (l'accord est sur le bouton)`);
// 🔞 sa figurine date d'avant la question de l'âge : la première fois, on le lui demande (puis le geste repart)
await lea.locator(".tf-poster-jour").click();
const questionAge = await repondreFenetre(lea);
await lea.waitForSelector(".tf-postee", { timeout: 15000 });
const idLea = (await lea.locator(".tf-adresse").inputValue()).split("/").pop();
ok(/15 ans ou plus \?/.test(questionAge) && (await existe("figurines-clients", `${LEA.id}/majeur.json`)), `son âge, demandé une fois, puis noté (${questionAge.slice(0, 50)})`);
ok((await texte(lea, ".tf-postee")).includes("Ta réponse est postée") && (await existe("figurines-clients", `du-jour/dax/${jour}/${idLea}.json`)) && (await existe("figurines-clients", `${LEA.id}/du-jour/${jour}.json`)), "postée : sa fiche du jour, à Dax");
await lea.screenshot({ path: `${D}/meme-du-jour-2-lea-postee.png`, fullPage: true });
// elle voit les réponses : la sienne d'abord, et le vrai chiffre
await lea.goto(`${BASE}/collection?v=${Date.now()}#decouvrir`, { waitUntil: "networkidle" });
await fermerPablito(lea, "#o-decouvrir");
await lea.waitForSelector("#o-decouvrir .dv-fil-jour .dv-carte", { timeout: 60000 });
const nLea = await lea.locator("#o-decouvrir .dv-fil-jour .dv-carte").count();
ok((await texte(lea, "#o-decouvrir .dv-jour .tj-chiffres")) === "5 réponses à Dax" && nLea === 5 && (await texte(lea, "#o-decouvrir .dv-fil-jour .dv-carte")).includes("Léa · toi"), `Léa voit les réponses (${nLea}), la sienne d'abord : « 5 réponses à Dax »`);

// ═══ HUGO RÉPOND AUSSI : LA SIENNE, PUIS LÉA (UNE PROCHE), PUIS LES AUTRES ═══
await reponse(HUGO.id, "jourhugo0001", 1);
await hugo.reload({ waitUntil: "networkidle" });
await hugo.waitForSelector("#o-decouvrir .dv-fil-jour .dv-carte", { timeout: 60000 });
const cartes = await hugo.locator("#o-decouvrir .dv-fil-jour .dv-carte .dv-qui").allInnerTexts();
ok(cartes[0].includes("Hugo · toi") && cartes[1].includes("Léa") && cartes[1].includes("👯 Proche") && cartes.length === 6, `les réponses : la sienne, puis Léa (une proche), puis les autres (${cartes.map((x) => x.split("\n")[0]).join(" · ")})`);
// 😂, puis ❤️ : une seule réaction à la fois
const carteLea = hugo.locator("#o-decouvrir .dv-fil-jour .dv-carte").nth(1);
await carteLea.locator('.dv-reac[aria-label="Mort de rire"]').click();
await hugo.waitForFunction(() => document.querySelectorAll("#o-decouvrir .dv-fil-jour .dv-carte")[1]?.querySelector('.dv-reac[aria-label="Mort de rire"]')?.classList.contains("pris"));
ok((await texte(hugo, "#o-decouvrir .dv-fil-jour .dv-carte:nth-child(2) .dv-reac.pris")) === "😂 1", "😂 : sa réaction, comptée");
await carteLea.locator('.dv-reac[aria-label="J’adore"]').click();
await hugo.waitForTimeout(800);
ok(
  (await existe("figurines-clients", `reac/${idLea}/${HUGO.id}.coeur.json`)) && !(await existe("figurines-clients", `reac/${idLea}/${HUGO.id}.rire.json`)),
  "❤️ remplace 😂 : une seule réaction par personne",
);
await hugo.locator("#o-decouvrir .dv-carte.commerce .dv-reac[aria-label='Trop fort']").click();
await hugo.waitForTimeout(800);
ok(await existe("figurines-clients", `reac/c-${COMMERCES[0]}/${HUGO.id}.feu.json`), "🔥 sur le mème du commerçant aussi");
await hugo.reload({ waitUntil: "networkidle" });
await hugo.waitForSelector("#o-decouvrir .dv-fil-jour .dv-carte", { timeout: 60000 });
ok((await texte(hugo, "#o-decouvrir .dv-fil-jour .dv-carte:nth-child(2) .dv-reac.pris")) === "❤️ 1", "rechargé : ❤️ 1, la sienne");
ok((await debordement(hugo)) <= 0 && !/exemple/i.test(await texte(hugo, "#o-decouvrir")), "« Découvrir » ne déborde pas, sans le mot interdit");
await hugo.screenshot({ path: `${D}/meme-du-jour-3-reponses.png` });

// ═══ LÉA, DANS « MES MÈMES » : ❤️ 1 ═══
await lea.goto(`${BASE}/collection?v=${Date.now()}#memes`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-memes .mm-reac", { timeout: 30000 });
ok((await texte(lea, "#o-memes .mm-reac")) === "❤️ 1", "dans « Mes mèmes » : ❤️ 1 (ce que les gens en ont pensé)");

// ═══ SANS COMPTE ═══
const visiteur = await tel(null);
await visiteur.goto(`${BASE}/collection#decouvrir`, { waitUntil: "networkidle" });
await fermerPablito(visiteur, "#o-decouvrir");
await visiteur.waitForSelector("#o-decouvrir .dv-jour", { timeout: 60000 });
ok((await texte(visiteur, "#o-decouvrir .dv-jour .tj-go")).includes("Crée ta figurine pour répondre"), "sans compte : « Crée ta figurine pour répondre »");
const reacs = visiteur.locator("#o-decouvrir .dv-reac");
ok((await reacs.count()) > 0 && (await reacs.first().isDisabled()), "et pas de réaction sans compte");

// ═══ ELLE RETIRE SA RÉPONSE ═══
const retire = await api(lea, { action: "public", id: idLea, public: false });
ok(retire.public === false && !(await existe("figurines-clients", `du-jour/dax/${jour}/${idLea}.json`)) && !(await existe("figurines-clients", `${LEA.id}/du-jour/${jour}.json`)), "elle retire sa réponse : elle quitte le mème du jour tout de suite");

const erreurs = [...hugo.err, ...lea.err, ...visiteur.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ").slice(0, 300)})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
void lire;
