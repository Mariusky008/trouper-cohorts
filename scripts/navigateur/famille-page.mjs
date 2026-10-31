// 👻 LA PAGE DE LA FAMILLE, DANS UN TÉLÉPHONE — `clikme.fr/f/<lien>`, contre le faux Supabase.
//
// Un restaurant client avec sa famille (trois fantômes, un record de 4 hier, Léa déjà là aujourd'hui et son
// petit mot), et un atelier tout neuf. Puis : l'accueil (la foule du jour, le record, les trois cages, jamais
// « exemple ») ; la cage ouvre la fiche (son fantôme, son prénom, son petit mot) ; « Entrer dans la famille »
// donne son numéro, son écusson, le chemin vers l'argent, la vitrine avec « Toi · Camille », WhatsApp (seulement
// caché jusqu'à la sonnette, chantier 4) et l'invitation ; revenir le même jour rouvre sa famille ;
// un ami venu par son lien compte pour elle ; une visite notée la fait passer argent (fêté une fois) ; chaque
// fantôme de la vitrine porte son écusson de la famille, et sa bulle son numéro ; un gros mot en prénom est
// refusé ; la famille vide invite à être le premier. Rien ne déborde.
import { BASE, D, F, lancer } from "./commun.mjs";

const SITE = "ffffffff-0000-4000-8000-000000000021";
const SLUG = "comptoir-des-fantomes-dax";
const NEUF = "atelier-tout-neuf-dax";
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const ilYa = (n) => new Date(Date.now() - n * 86_400_000);
/** Hier, en jour de calendrier (le jour du passage à l'heure d'hiver dure 25 heures). */
const hier = (() => {
  const d = new Date(`${jour(new Date())}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
})();
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const h = (k) => `dddddddd-0000-4000-8000-00000000000${k}`;

await semer("human_vitrine_sites", [
  { id: SITE, slug: SLUG, channel: "letter", business_name: "Le Comptoir des Fantômes", city: "Dax", activite: "Restaurant", published: true, est_client: true },
  { id: "ffffffff-0000-4000-8000-000000000022", slug: NEUF, channel: "letter", business_name: "L’Atelier Tout Neuf", city: "Dax", activite: "Céramiste", published: true, est_client: true },
]);
await semer(
  "clik_cage",
  [
    ["Léa", "cosy", 1],
    ["Hugo", "denim", 2],
    ["Inès", "artiste", 3],
  ].map(([prenom, look, k]) => ({
    site_id: SITE,
    habitant_id: h(k),
    film: "page",
    cage: "adore",
    prenom,
    look,
    created_at: ilYa(5 - k).toISOString(),
    updated_at: k === 1 ? new Date().toISOString() : ilYa(1).toISOString(),
  })),
);
await semer("clik_presence", [
  ...[1, 2, 3, 4].map((k) => ({ site_id: SITE, habitant_id: h(k), jour: hier })),
  { site_id: SITE, habitant_id: h(1), jour: jour(new Date()) },
]);
await semer("clik_mot", { site_id: SITE, habitant_id: h(1), texte: "Ça sent bon jusqu’ici", liste: true, jour: jour(new Date()) });

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const tel = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = async (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const lignes = async (t, q = "") => (await (await fetch(`${F}/${t}?site_id=eq.${SITE}${q}`)).json());

// ═══ L'ACCUEIL ═══
const p = await tel();
await p.goto(`${BASE}/f/${SLUG}`, { waitUntil: "networkidle", timeout: 400000 });
await p.waitForSelector(".fm-foule .l1", { timeout: 60000 });
const accueil = await texte(p, ".fm");
ok(accueil.includes("Rejoins la famille du Comptoir des Fantômes") && accueil.includes("Sans compte"), "l'accueil : l'invitation et « sans compte »");
ok(/1 fantôme aujourd’hui/.test(accueil) && /Record 4/.test(accueil) && /Plus que 4 pour battre le record/.test(accueil), `la foule du jour et le record (${(await texte(p, ".fm-foule")).slice(0, 80)})`);
ok((await p.locator(".fm-cage-b").count()) === 3 && (await texte(p, ".fm-cages")).includes("Je réserve aujourd’hui"), "les trois cages d'un restaurant");
ok(!/exemple/i.test(accueil), "jamais le mot « exemple » à l'écran");
ok((await debordement(p)) <= 0, "l'accueil ne déborde pas");
await p.screenshot({ path: `${D}/famille-1-accueil.png` });

// ═══ LA FICHE ═══
await p.locator(".fm-cage-b").nth(1).click();
await p.waitForSelector(".fm-fiche", { timeout: 10000 });
await p.waitForTimeout(500);
await p.screenshot({ path: `${D}/famille-2-fiche.png` });
await p.locator(".fm-fiche button[type=submit]").click();
ok((await texte(p, ".fm-fiche .fm-erreur")).includes("prénom"), "sans prénom : on le demande");
await p.fill("#fm-prenom", "Connard");
await p.locator(".fm-fiche button[type=submit]").click();
ok((await texte(p, ".fm-fiche .fm-erreur")).includes("ne peut pas s’afficher"), "un gros mot en prénom : refusé avant d'envoyer");
await p.locator(".fm-look").nth(3).click();
await p.fill("#fm-prenom", "Camille");
await p.locator(".fm-mots button").first().click();
const motChoisi = await p.inputValue("#fm-mot");
await p.locator(".fm-fiche button[type=submit]").click();

// ═══ LA FAMILLE ═══
await p.waitForSelector(".fm-heros h1", { timeout: 20000 });
const fam = await texte(p, ".fm");
ok(fam.includes("Bienvenue dans la famille !") && fam.includes("Tu es le fantôme n°4 du Comptoir des Fantômes"), "bienvenue, fantôme n°4");
ok((await texte(p, ".fm-patch")) === "4" && (await p.locator(".fm-patch.bronze").count()) === 1, "la pièce de bronze, frappée de son numéro");
ok(fam.includes("Prochain : la pièce d’argent 🥈") && fam.includes("Viens une fois au Comptoir des Fantômes, ou ouvre la cage 7 jours."), "le chemin vers l'argent");
ok(fam.includes("1 jour de cage sur 7") && fam.includes("aujourd’hui ✓"), "son premier jour de cage, compté");
ok(/2 fantômes aujourd’hui/.test(fam) && fam.includes("📣 Il en manque 3 : inviter un ami"), "la foule passe à 2, il en manque 3");
// LE BOUTON WHATSAPP EST CACHÉ tant que la sonnette n'existe pas (chantier 4) : personne n'y répondrait.
ok((await p.locator("a.fm-bouton.wa").count()) === 0, "pas de bouton WhatsApp : caché jusqu'à la sonnette");
await p.waitForSelector(".vf .vf-fg.moi", { timeout: 20000 });
ok((await texte(p, ".vf-fg.moi .nom")) === "Toi · Camille", `sa place dans la vitrine (${await texte(p, ".vf-fg.moi .nom")})`);
ok((await p.locator(".vf .vf-fg").count()) >= 3, `la famille devant le commerce (${await p.locator(".vf .vf-fg").count()} fantômes)`);
await p.waitForSelector(".vf .vf-fg.moi .vf-palier", { timeout: 20000 });
ok((await p.locator(".vf .vf-palier").count()) >= 4 && (await texte(p, ".vf-fg.moi .vf-palier")) === "4", `chaque fantôme est debout sur sa pièce de la famille (${await p.locator(".vf .vf-palier").count()})`);
await p.locator('.vf-fg[aria-label^="Léa,"]').click();
ok((await texte(p, ".vf-bulle")).includes("Fantôme n°1 · 🥉 Bronze"), `la bulle de Léa : son numéro et son palier (${await texte(p, ".vf-bulle")})`);
await p.locator(".vf-sc").click({ position: { x: 5, y: 5 } });
const mots = await lignes("clik_mot");
ok(mots.some((m) => m.texte === motChoisi && m.liste === true), `son petit mot de la liste est parti (« ${motChoisi} »)`);
ok((await debordement(p)) <= 0, "la famille ne déborde pas");
await p.waitForTimeout(1200);
await p.screenshot({ path: `${D}/famille-3-famille.png`, fullPage: true });
const camille = (await lignes("clik_cage")).find((c) => c.prenom === "Camille");
ok(camille?.look === (await p.evaluate(() => JSON.parse(localStorage.getItem("clikme-look-v1") || "{}").id)), `son fantôme choisi, gardé (${camille?.look})`);
const lien = await p.evaluate(() => document.querySelector(".fm-lien")?.getAttribute("href"));
ok(lien === `/b/${SLUG}`, "le lien vers sa page");

// ═══ ELLE REVIENT LE MÊME JOUR ═══
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector(".fm-heros h1", { timeout: 20000 });
ok((await texte(p, ".fm-heros h1")) === "Re-bonjour, Camille !", "le même jour : sa famille, directement");
const code = (await (await fetch(`${BASE}/api/direct/famille?slug=${SLUG}`, { headers: { cookie: (await p.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ") } })).json()).moi?.code;

// ═══ UN AMI PAR SON LIEN ═══
const ami = await tel();
await ami.goto(`${BASE}/f/${SLUG}?de=${code}`, { waitUntil: "networkidle" });
await ami.waitForSelector(".fm-foule .l1", { timeout: 60000 });
await ami.locator(".fm-cage-b").first().click();
await ami.fill("#fm-prenom", "Noé");
await ami.locator(".fm-fiche button[type=submit]").click();
await ami.waitForSelector(".fm-heros h1", { timeout: 20000 });
ok((await texte(ami, ".fm-heros p")).includes("fantôme n°5"), "son ami, n°5");
const noe = (await lignes("clik_cage")).find((c) => c.prenom === "Noé");
const pres = await lignes("clik_presence", `&habitant_id=eq.${noe?.habitant_id}`);
ok(pres.length === 1 && pres[0].amene_par === camille?.habitant_id, "il compte pour Camille (amené par elle)");
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector(".fm-prochain", { timeout: 20000 });
ok((await texte(p, ".fm-actions")).includes("Il en manque 2"), "chez Camille : il en manque 2");

// ═══ SON PALIER MONTE : UNE VISITE NOTÉE AU COMPTOIR ═══
await semer("clik_visite", { site_id: SITE, habitant_id: camille?.habitant_id, jour: jour(new Date()) });
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector(".fm-monte", { timeout: 20000 });
ok((await texte(p, ".fm-monte")).includes("🥈 Tu passes Argent ! Tu as les bons plans plus tôt."), "une visite : « Tu passes Argent ! »");
ok((await p.locator(".fm-patch.argent.coud").count()) === 1 && (await texte(p, ".fm-prochain")).includes("Prochain : la pièce d’or 🥇"), "la pièce d'argent se pose, la prochaine est l'or");
await p.waitForTimeout(1500);
await p.screenshot({ path: `${D}/famille-5-argent.png` });
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector(".fm-prochain", { timeout: 20000 });
ok((await p.locator(".fm-monte").count()) === 0, "la fois suivante, on ne le refête pas");

// ═══ LA FAMILLE VIDE ═══
const vide = await tel();
await vide.goto(`${BASE}/f/${NEUF}`, { waitUntil: "networkidle" });
await vide.waitForSelector(".fm-premier", { timeout: 60000 });
ok((await texte(vide, ".fm-premier")).includes("Sois le tout premier fantôme de l’Atelier Tout Neuf !"), "la famille vide : sois le premier");
ok((await texte(vide, ".fm-cages")).includes("Je passe aujourd’hui"), "chez un artisan, on passe");
await vide.screenshot({ path: `${D}/famille-4-vide.png` });

const erreurs = [...p.err, ...ami.err, ...vide.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
