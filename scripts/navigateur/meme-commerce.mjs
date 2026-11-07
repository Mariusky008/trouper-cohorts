// 🏪 LE MÈME DU JOUR D'UN COMMERÇANT, ET « DÉCOUVRIR » — contre le faux Supabase (`lib/direct/memes-commerces.ts`).
//
// Chez Bergine (un restaurant de Dax) ouvre son comptoir par son lien pro, droit sur « Mon mème du jour »
// (`?ouvrir=meme`) : « 🍽️ Le menu du jour » d'abord (son métier), ses mots, la musique (sans sa voix) ; le mème se
// fabrique sous ses yeux, part au seau public, sur sa page `/meme/<id>` et dans « Découvrir » pour Dax. Nina, de Dax, le
// voit dans « Découvrir » (cinq onglets en bas) ; une inconnue ouvre son lien : il joue tout de suite, « Voir sa page »
// est compté, comme les vues et les partages, que Bergine retrouve à son comptoir. Un gros mot : refusé. Ailleurs (à
// Vevey, sans mème) : ceux de Dax. La démonstration (sans lien pro) fabrique sans rien publier.
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";
import { SITES } from "./semer.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const NINA = { id: "dddddddd-0000-4000-8000-000000000071", jeton: "jeton-nina-0000000000000001" };
const ZOE = { id: "dddddddd-0000-4000-8000-000000000072", jeton: "jeton-zoe-00000000000000001" };
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

await semer("human_vitrine_sites", Object.values(SITES));
await semer("human_habitants", [
  { id: NINA.id, device_token: NINA.jeton, prenom: "Nina", ville_slug: "dax" },
  { id: ZOE.id, device_token: ZOE.jeton, prenom: "Zoé", ville_slug: "vevey" },
]);

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
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
const pro = async (corps, token = "jeton-test") => {
  const r = await fetch(`${BASE}/api/site-internet/pro/meme`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SITES.bergine.slug, token, ...corps }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ═══ LA ROUTE, CONTRE SON JETON PRO ═══
ok((await pro({ action: "etat" }, "faux-jeton")).statut === 403, "sans son jeton pro : non");
ok((await pro({ action: "envoi", type: "image/png" })).statut === 400, "une vidéo, rien d'autre");
ok((await pro({ action: "etat" })).memes?.length === 0, "pas encore de mème");

// ═══ CHEZ BERGINE : « MON MÈME DU JOUR » ═══
const bergine = await tel(null);
await bergine.goto(`${BASE}/autour-de-moi/assistante?site=${SITES.bergine.slug}&k=jeton-test&ouvrir=meme`, { waitUntil: "networkidle", timeout: 400000 });
await bergine.waitForSelector(".mj .mj-types button", { timeout: 60000 });
const types = await bergine.locator(".mj-types button").allInnerTexts();
ok(types[0].includes("Le menu du jour") && (await bergine.locator(".mj-types button.pris").innerText()).includes("Le menu du jour") && !types.some((x) => x.includes("La coupe du jour")), `un restaurant : « Le menu du jour » d'abord (${types.slice(0, 3).join(" · ")}…)`);
ok((await texte(bergine, ".mj")).includes("ClikMe n’invente jamais rien") && (await bergine.locator(".mj-go").isDisabled()), "ses mots, ses prix ; rien ne part sans texte");
ok((await bergine.locator(".mj-voix button.pris").innerText()).includes("La musique"), "sans sa voix : la musique (elle danse)");
await bergine.locator(".mj-texte textarea").fill("Aujourd’hui : blanquette de veau, et tarte aux pommes maison !");
await bergine.screenshot({ path: `${D}/meme-commerce-1-comptoir.png`, fullPage: true });
await bergine.locator(".mj-go").click();
await bergine.waitForSelector(".mj-toile.visible", { timeout: 20000 });
await bergine.waitForTimeout(1500);
await bergine.locator(".mj-toile").screenshot({ path: `${D}/meme-commerce-2-fabrication.png` });
await bergine.waitForSelector(".mj-pret video", { timeout: 90000 });
const lien = await bergine.locator(".mj-adresse").inputValue();
const id = lien.split("/").pop();
ok(/\/meme\/[a-z0-9]{12}$/.test(lien) && (await texte(bergine, ".mj-pret")).includes("Dans « Découvrir »"), `il est parti : sa page (${lien.replace(BASE, "")}) et « Découvrir »`);
const fiche = await (await fetch(`${STOCK}/public/figurines-pros/memes/${id}.json`)).json().catch(() => null);
ok(fiche?.type === "menu" && fiche.texte.startsWith("Aujourd’hui : blanquette") && fiche.villeSlug === "dax" && fiche.nom === "Chez Bergine" && fiche.voix === false && fiche.image.startsWith("/direct/"), `sa fiche, publique (${JSON.stringify(fiche)?.slice(0, 160)})`);
const parVille = await fetch(`${STOCK}/public/figurines-pros/memes-du-jour/dax/${jour}/${id}.json`);
ok(parVille.status === 200, "rangé pour Dax, aujourd'hui");
const octets = (await (await fetch(fiche.video)).arrayBuffer()).byteLength;
ok(octets > 20_000, `la vidéo de son mème (${Math.round(octets / 1024)} Ko)`);
ok((await debordement(bergine)) <= 0 && !/exemple/i.test(await texte(bergine, ".mj")), "l'écran ne déborde pas, sans le mot interdit");
await bergine.screenshot({ path: `${D}/meme-commerce-3-pret.png`, fullPage: true });

// UN GROS MOT : refusé ; un mème qui n'existe pas : non
const essai = await pro({ action: "envoi", type: "video/mp4" });
ok(essai.statut === 200 && /^[a-z0-9]{12}$/.test(essai.id), "une deuxième adresse d'envoi");
ok((await pro({ action: "publier", id: essai.id, annonce: "menu", texte: "Espèce de connard", videoType: "video/mp4" })).statut === 400, "un gros mot : refusé");
ok((await pro({ action: "publier", id: essai.id, annonce: "menu", texte: "Le plat du jour", videoType: "video/mp4" })).error?.includes("pas arrivée"), "sans sa vidéo : rien ne se publie");

// ═══ NINA, DE DAX : « DÉCOUVRIR » ═══
const nina = await tel(NINA);
await nina.goto(`${BASE}/collection#decouvrir`, { waitUntil: "networkidle" });
await nina.waitForSelector("#o-decouvrir .dv-carte", { timeout: 60000 });
await fermerPablito(nina, "#o-decouvrir");
const menu = await texte(nina, ".mc-nav");
ok((await nina.locator(".mc-nav button").count()) === 5 && /Découvrir.*Rencontres.*Créer.*Mes mèmes.*Moi/.test(menu) && (await nina.locator(".mc-nav button.pris").innerText()).includes("Découvrir"), `le menu en bas : cinq onglets, « Créer » au milieu (${menu})`);
const carte = await texte(nina, "#o-decouvrir .dv-carte");
// (le lot 2 : la même carte que les gens — son nom, un toucher : sa page ; ni bandeau, ni gros bouton rose)
ok(carte.includes("Chez Bergine") && carte.includes("aujourd’hui") && !carte.includes("Voir sa page") && (await nina.locator(`#o-decouvrir a.dv-nom[href="/meme/${id}/voir"]`).count()) === 1 && (await nina.locator("#o-decouvrir .dv-voir").count()) === 0, `son mème, dans « Découvrir » : la même carte que les gens, son nom mène à sa page (${carte.slice(0, 90)})`);
ok((await nina.locator("#o-decouvrir .dv-carte.commerce .dv-reac").count()) === 3, "😂 ❤️ 🔥 sous son mème aussi");
// (le mème du jour est au-dessus, maintenant : sa carte vient à l'écran, puis elle joue)
await nina.locator("#o-decouvrir .dv-carte video").first().scrollIntoViewIfNeeded();
await nina.waitForFunction(() => {
  const v = document.querySelector("#o-decouvrir .dv-carte video");
  return v && !v.paused && v.currentTime > 0.2;
}, null, { timeout: 20000 }).catch(() => null);
ok(await nina.evaluate(() => !document.querySelector("#o-decouvrir .dv-carte video")?.paused), "la vidéo joue toute seule, en silence, quand on la voit");
ok((await debordement(nina)) <= 0 && !/exemple/i.test(await texte(nina, "#o-decouvrir")), "« Découvrir » ne déborde pas, sans le mot interdit");
await nina.screenshot({ path: `${D}/meme-commerce-4-decouvrir.png` });

// ═══ UNE INCONNUE OUVRE SON LIEN ═══
const inconnue = await tel(null);
await inconnue.goto(`${BASE}/meme/${id}`, { waitUntil: "networkidle" });
await inconnue.waitForFunction(() => {
  const v = document.querySelector(".mr-meme video");
  return v && v.readyState >= 2 && !v.paused && v.currentTime > 0.3;
}, null, { timeout: 30000 });
ok(true, "le mème de Bergine joue tout de suite");
const titre = await inconnue.title();
ok(titre.startsWith("🍽️ Le menu du jour · Chez Bergine") && (await inconnue.locator('meta[name="robots"][content*="noindex"]').count()) === 1, `le titre du lien, et pas dans Google (${titre})`);
ok(
  (await inconnue.locator(`.mr-bouton[href="/meme/${id}/voir"]`).count()) === 1 && (await inconnue.locator('.mcom-creer[href="/collection#figurine"]').count()) === 1 && (await inconnue.locator(".mr-partager").count()) === 1,
  "« Voir sa page », « Crée ton mème, toi aussi », « Partager ce mème »",
);
const voir = await fetch(`${BASE}/meme/${id}/voir`, { redirect: "manual" });
ok(voir.status === 302 && voir.headers.get("location")?.endsWith(`/site-internet/apercu/${SITES.bergine.slug}?via=meme`), `« Voir sa page » mène à sa page (${voir.headers.get("location")})`);
await inconnue.evaluate((i) => fetch("/api/direct/memes-commerces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "geste", type: "partage", id: i }) }), id);
ok((await fetch(`${BASE}/meme/zzzzzzzzzzzz`)).status === 404, "un lien inconnu : 404");
await inconnue.screenshot({ path: `${D}/meme-commerce-5-recu.png` });

// ═══ CE QUE SON MÈME LUI RAPPORTE ═══
const gestes = (await lire("clik_meme_evenement", `message_id=eq.c-${id}`)).map((x) => x.type);
const n = (t) => gestes.filter((x) => x === t).length;
ok(n("cree") === 1 && n("vu") >= 1 && n("clic") === 1 && n("partage") === 1, `mesuré : créé, vu, « Voir sa page », partagé (${gestes.join(", ")})`);
const etat = await pro({ action: "etat" });
ok(etat.memes?.[0]?.id === id && etat.memes[0].vues >= 1 && etat.memes[0].visites === 1 && etat.memes[0].partages === 1, `à son comptoir : vues, visites, partages (${JSON.stringify(etat.memes?.[0] && { v: etat.memes[0].vues, c: etat.memes[0].visites, p: etat.memes[0].partages })})`);
await bergine.reload({ waitUntil: "networkidle" });
await bergine.waitForSelector(".mj-aujourdhui", { timeout: 60000 });
ok(/Ton mème d’aujourd’hui.*Le menu du jour/.test(await texte(bergine, ".mj-aujourdhui")) && (await texte(bergine, ".mj-aujourdhui")).includes("1 visite de ta page"), `au comptoir : son mème d'aujourd'hui, et ce qu'il rapporte (${await texte(bergine, ".mj-aujourdhui")})`);
const stats = await (await fetch(`${BASE}/api/direct/ma-figurine`, { method: "GET" })).status;
ok(stats === 200, "(l'appli des clients répond)");

// ═══ À VEVEY (aucun mème) : ceux d'ailleurs ═══
const zoe = await tel(ZOE);
await zoe.goto(`${BASE}/collection#decouvrir`, { waitUntil: "networkidle" });
await zoe.waitForSelector("#o-decouvrir .dv-carte", { timeout: 60000 });
ok((await texte(zoe, "#o-decouvrir")).includes("voici ceux d’ailleurs") && (await texte(zoe, "#o-decouvrir .dv-carte")).includes("Chez Bergine"), "à Vevey, rien encore : ceux de Dax");

// ═══ LA DÉMONSTRATION (sans lien pro) : il se fabrique, rien ne part ═══
const demo = await tel(null);
await demo.goto(`${BASE}/autour-de-moi/assistante?ouvrir=meme`, { waitUntil: "networkidle", timeout: 400000 });
await demo.waitForTimeout(1500);
await demo.getByRole("button", { name: /Restaurant/ }).first().click();
await demo.waitForSelector(".mj .mj-texte textarea", { timeout: 60000 });
await demo.locator(".mj-texte textarea").fill("Un petit mot pour vous !");
await demo.locator(".mj-go").click();
await demo.waitForSelector(".mj-pret video", { timeout: 90000 });
ok((await texte(demo, ".mj-pret")).includes("Dans la démonstration, ton mème reste sur ce téléphone") && (await demo.locator(".mj-adresse").count()) === 0, "la démonstration : le mème se fabrique, rien ne part");

const erreurs = [...bergine.err, ...nina.err, ...inconnue.err, ...zoe.err, ...demo.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
