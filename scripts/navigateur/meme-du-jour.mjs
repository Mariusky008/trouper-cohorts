// 🔥 LE MÈME DU JOUR — contre le faux Supabase. Depuis le 19 novembre 2026, l'ancienne page de « Découvrir » est partie
// (le fil des mèmes de la ville, la carte du mème du jour, « Mon vœu » : `docs/univers/decouvrir.md`, section 11) ;
// « Découvrir », c'est sa télé du jour.
//
// Le mème du jour reste : la notification de 11 h 30 mène à `#jour`, qui ouvre « Créer » sur le thème du jour — son
// titre, ses trois idées (un toucher écrit l'idée), « ✕ » pour ne pas y répondre. Plus de « 🔥 Poster ma réponse
// (visible par les gens de Dax) », ni de « 🌍 Poster sur le fil de Dax ». Sans `#jour`, « Créer » ne montre pas le
// thème. Les anciens liens (`#voeu`, `#mission`, `#reponses`) ouvrent « Découvrir ». Rien ne déborde, jamais le mot
// interdit, aucune erreur dans la page.
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

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

// ═══ HUGO : « CRÉER », SANS ADRESSE : PAS DE THÈME DU JOUR ═══
const hugo = await tel(HUGO);
await hugo.goto(`${BASE}/collection#figurine`, { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-figurine");
await hugo.waitForSelector("#o-figurine .tf-dit", { timeout: 60000 });
ok((await hugo.locator("#o-figurine #theme-du-jour, #o-figurine .tj").count()) === 0, "« Créer », sans adresse : pas de thème du jour");

// ═══ LA NOTIFICATION DE 11 H 30 : `#jour` OUVRE « CRÉER » SUR LE THÈME DU JOUR ═══
const etat = await hugo.evaluate(async () => (await (await fetch("/api/direct/ma-figurine?jour=1", { cache: "no-store" })).json()).jour);
await hugo.goto(`${BASE}/collection?v=${Date.now()}#jour`, { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-figurine");
await hugo.waitForSelector("#o-figurine:not([hidden]) #theme-du-jour", { timeout: 60000 });
const titre = await texte(hugo, "#o-figurine #theme-du-jour .tf-theme-tete b");
ok(Boolean(etat?.theme?.titre) && titre === `🔥 Le mème du jour : ${etat.theme.emoji} ${etat.theme.titre}`, `« Créer » s'ouvre sur le thème du jour (« ${titre} »)`);
const idees = hugo.locator("#o-figurine #theme-du-jour .tf-theme-idees button");
ok((await idees.count()) === 3, "ses trois idées");
const idee = (await idees.nth(1).innerText()).replace(/^💡\s*/, "").trim();
await idees.nth(1).click();
await hugo.waitForTimeout(400);
ok((await hugo.locator("#o-figurine .tf-texte textarea").inputValue()) === idee, `un toucher sur une idée l'écrit (« ${idee} »)`);
ok((await hugo.locator(".tf-poster-jour, .tf-public, .tf-postee").count()) === 0, "plus de « Poster ma réponse » ni de « fil de Dax » : le fil de la ville est parti");
ok((await debordement(hugo)) <= 0 && !/exemple/i.test(await texte(hugo, "#o-figurine")), "« Créer » ne déborde pas, sans le mot interdit");
await hugo.screenshot({ path: `${D}/meme-du-jour-1-creer.png` });
await hugo.locator('#o-figurine #theme-du-jour button[aria-label="Ne pas répondre au mème du jour"]').click();
await hugo.waitForTimeout(300);
ok((await hugo.locator("#o-figurine #theme-du-jour").count()) === 0, "« ✕ » : il n'y répond pas, le thème s'en va");

// ═══ LES ANCIENS LIENS (« Mon vœu », sa mission, ses réponses du soir) : « Découvrir », sa télé du jour ═══
for (const ancre of ["voeu", "mission", "reponses", "decouvrir"]) {
  await hugo.goto(`${BASE}/collection?v=${Date.now()}#${ancre}`, { waitUntil: "networkidle" });
  await fermerPablito(hugo, "#o-decouvrir");
  const vu = await hugo.waitForSelector("#o-decouvrir:not([hidden]) .tp, #o-decouvrir:not([hidden]) .td, #o-decouvrir:not([hidden]) .td-accueil", { timeout: 60000 }).then(() => true).catch(() => false);
  ok(vu && (await hugo.locator("#o-decouvrir .dv-fil, #o-decouvrir .dv-jour, #o-decouvrir #voeu, #o-decouvrir .vx-accueil").count()) === 0, `#${ancre} : « Découvrir », sa télé du jour (ses passions d'abord) — plus de fil ni de vœu`);
}
ok((await debordement(hugo)) <= 0 && !/exemple/i.test(await texte(hugo, "#o-decouvrir")), "« Découvrir » ne déborde pas, sans le mot interdit");
await hugo.screenshot({ path: `${D}/meme-du-jour-2-decouvrir.png` });

const erreurs = [...hugo.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.join(" | ").slice(0, 300)})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
void lire;
void existe;
void api;
