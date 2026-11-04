// 🃏💬 SA CARTE DE PERSONNAGE ET LA RENCONTRE DU JOUR, DANS UN TÉLÉPHONE — `clikme.fr/collection`, contre le faux
// Supabase, sans IA (la fiche et la conversation sont alors composées par le serveur : c'est ce chemin qu'on essaie).
//
// Léa (deux figurines au Comptoir) fait le questionnaire : sept questions, ses goûts, sa phrase fétiche ; sa carte se
// révèle (niveau, six caractéristiques). Elle la partage : un lien `/carte/<id>` qu'un inconnu ouvre. Sans ami, sa
// figurine rencontre celle du Comptoir. Elle invite Hugo ; Hugo ouvre le lien, fait sa carte : leur rencontre arrive,
// la même chez les deux. Léa dit « c'est tout moi » à une phrase de sa figurine, et réagit d'une émotion à une phrase
// de Hugo ; elle ne peut pas juger une phrase de Hugo. Elle signale : la rencontre ne s'affiche plus. Rien ne déborde.
import { BASE, D, F, lancer } from "./commun.mjs";

const A = { id: "ffffffff-0000-4000-8000-000000000041", slug: "comptoir-des-fantomes-dax", nom: "Le Comptoir des Fantômes" };
const LEA = { id: "dddddddd-0000-4000-8000-000000000051", jeton: "jeton-lea-0000000000000001" };
const HUGO = { id: "dddddddd-0000-4000-8000-000000000052", jeton: "jeton-hugo-000000000000001" };
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const ilYa = (n) => jour(new Date(Date.now() - n * 86_400_000));
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });

await semer("human_vitrine_sites", [{ id: A.id, slug: A.slug, channel: "letter", business_name: A.nom, city: "40100 Dax", activite: "Restaurant", published: true, est_client: true }]);
await semer("human_habitants", [
  { id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" },
  { id: HUGO.id, device_token: HUGO.jeton, prenom: "Hugo", ville_slug: "dax" },
]);
const cage = (h, prenom, look) => ({ site_id: A.id, habitant_id: h, film: "page", cage: "adore", prenom, look, created_at: new Date(Date.now() - 200 * 86_400_000).toISOString(), updated_at: new Date().toISOString() });
await semer("clik_cage", [cage(LEA.id, "Léa", "fleuri"), cage(HUGO.id, "Hugo", "denim")]);
await semer("clik_visite", [{ site_id: A.id, habitant_id: LEA.id, jour: ilYa(0) }, { site_id: A.id, habitant_id: LEA.id, jour: ilYa(40) }]);

const b = await lancer();
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
const api = (p, url, corps) =>
  p.evaluate(async ([u, c]) => {
    const r = await fetch(u, c ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) } : { cache: "no-store" });
    return { statut: r.status, ...(await r.json().catch(() => ({}))) };
  }, [url, corps]);

// ═══ LÉA : LE QUESTIONNAIRE, SA CARTE ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await lea.waitForSelector("#personnage .mp-teaser .mp-bouton", { timeout: 60000 });
ok((await texte(lea, "#personnage")).includes("Découvre ton personnage") && (await lea.locator("#personnage .pc.silhouette").count()) === 1, "pas encore de carte : sa silhouette, et « Découvre ton personnage »");
ok((await texte(lea, "#rencontre")).includes("D’abord, ton personnage"), "la rencontre du jour attend sa carte");
await lea.locator("#personnage .mp-teaser .mp-bouton").click();
for (let k = 0; k < 7; k++) {
  await lea.waitForSelector("#personnage .mp-choix button", { timeout: 10000 });
  if (k === 0) ok((await texte(lea, "#personnage .mp-compte")) === "1 / 8", "sept questions, puis ses goûts");
  await lea.locator("#personnage .mp-choix button").nth(k % 2).click();
}
await lea.waitForSelector("#personnage .mp-gouts", { timeout: 10000 });
for (const g of ["Cuisine", "Musique", "Voyages"]) await lea.locator("#personnage .mp-gouts button", { hasText: g }).click();
ok(await lea.locator("#personnage .mp-gouts button", { hasText: "Sport" }).isDisabled(), "trois goûts au plus");
await lea.locator("#personnage .mp-phrase").fill("Allez, on y va !");
await lea.locator("#personnage .mp-bouton").click();
await lea.waitForSelector("#personnage .mp-sienne .pc", { timeout: 30000 });
const carte = await texte(lea, "#personnage .pc");
ok(/Niv\. 3/.test(carte) && carte.includes("Léa") && /Fidélité \d+/.test(carte) && carte.includes("Super-pouvoir") && carte.includes("« Allez, on y va ! »"), `sa carte : niveau 3 (deux achats), six caractéristiques, sa fiche (${carte.slice(0, 140)})`);
ok((await lea.locator("#personnage .pc-carac li").count()) === 6, "six caractéristiques");
const g1 = await api(lea, "/api/direct/personnage");
ok(g1.carte?.valeurs?.fidelite === 23 && g1.carte?.niveau === 3 && g1.carte?.par === "local", `ses caractéristiques montent avec ses achats (fidélité ${g1.carte?.valeurs?.fidelite}), fiche sans IA ici`);
const insulte = await api(lea, "/api/direct/personnage", { action: "creer", reponses: g1.carte.reponses, phrase: "espèce de connard" });
ok(insulte.statut === 422, "une phrase fétiche insultante : refusée");
await lea.screenshot({ path: `${D}/personnage-1-carte.png`, fullPage: true });

// SA CARTE PARTAGÉE
await lea.locator("#personnage .mp-sienne .mp-bouton").click();
await lea.waitForSelector("#personnage .tf-wa", { timeout: 15000 });
const lienCarte = await lea.locator("#personnage .tf-adresse").inputValue();
ok(/\/carte\/[a-z0-9]{12}$/.test(lienCarte) && decodeURIComponent((await lea.locator("#personnage .tf-wa").getAttribute("href")) ?? "").includes("Découvre mon personnage ClikMe"), `son lien de carte, sur WhatsApp (${lienCarte})`);
const inconnu = await tel(null);
await inconnu.goto(lienCarte.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await inconnu.waitForSelector(".cp .pc", { timeout: 30000 });
ok((await texte(inconnu, ".cp h1")).includes("Léa") && (await inconnu.locator('.cp-toi a[href="/collection#personnage"]').count()) === 1 && (await inconnu.locator('meta[name="robots"][content*="noindex"]').count()) === 1, "un inconnu voit sa carte, « Faire ma carte », pas dans Google");
ok((await debordement(inconnu)) <= 0, "la carte partagée ne déborde pas");
await inconnu.screenshot({ path: `${D}/personnage-2-partagee.png`, fullPage: true });

// ═══ LA RENCONTRE DU JOUR : SANS AMI, LA FIGURINE DU COMPTOIR ═══
await lea.reload({ waitUntil: "networkidle" });
await lea.waitForSelector("#rencontre .rd-fil li", { timeout: 60000 });
ok((await texte(lea, "#rencontre .rd-qui")).includes(`la figurine de ${A.nom}`), "sans ami : sa figurine rencontre celle du Comptoir");
ok((await texte(lea, "#rencontre .rd-ia")).includes("Ce n’est pas le commerçant qui parle"), "« écrit par l'IA, pour jouer », et ce n'est pas le commerçant");

// ═══ ELLE INVITE HUGO ═══
await lea.locator("#rencontre .rd-inviter .mp-bouton").click();
await lea.waitForSelector("#rencontre .rd-inviter .tf-wa", { timeout: 15000 });
const lienAmi = await lea.locator("#rencontre .rd-inviter .tf-adresse").inputValue();
ok(/\/collection\?ami=[a-z0-9]{10}$/.test(lienAmi) && decodeURIComponent((await lea.locator("#rencontre .tf-wa").getAttribute("href")) ?? "").includes("nos deux figurines discutent"), `son invitation (${lienAmi})`);
const hugo = await tel(HUGO);
await hugo.goto(lienAmi.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await hugo.waitForSelector("#rencontre .rd-ami", { timeout: 60000 });
ok((await texte(hugo, "#rencontre .rd-ami")).includes("Toi et Léa"), "Hugo ouvre le lien : ils sont amis");
const carteHugo = await api(hugo, "/api/direct/personnage", { action: "creer", reponses: { elan: "b", ton: "b", jeu: "a", sort: "b", tete: "a", gout: "b", rythme: "a" }, gouts: ["sport"] });
ok(carteHugo.statut === 200 && carteHugo.carte?.fiche?.titre, "Hugo fait sa carte");

// LEUR RENCONTRE, TOUT DE SUITE, CHEZ LES DEUX
await lea.reload({ waitUntil: "networkidle" });
await lea.waitForSelector("#rencontre .rd-fil li", { timeout: 60000 });
ok((await texte(lea, "#rencontre .rd-qui")).includes("Ta figurine a rencontré Hugo"), "Hugo a fait sa carte : leur rencontre arrive aussitôt");
const rL = await api(lea, "/api/direct/rencontre");
const rH = await api(hugo, "/api/direct/rencontre");
ok(rL.rencontre?.id && rL.rencontre.id === rH.rencontre?.id && rH.rencontre?.autre?.prenom === "Léa", "la même rencontre chez Hugo");
ok(rL.avant?.some((x) => x.avec === A.nom), "la rencontre du Comptoir reste dans « tes rencontres d'avant »");
for (let k = 0; k < 20 && (await lea.locator("#rencontre .rd-tape").count()); k++) await lea.waitForTimeout(500);
ok((await lea.locator("#rencontre .rd-fil li").count()) === rL.rencontre.repliques.length, "les répliques arrivent une à une, toutes");

// SES RÉACTIONS
await lea.locator("#rencontre .rd-fil li.moi .rd-verdict", { hasText: "C’est tout moi" }).first().click();
await lea.locator("#rencontre .rd-fil li.autre .rd-emo").first().click();
await lea.waitForTimeout(800);
const apres = await api(lea, "/api/direct/rencontre");
const vues = Object.values(apres.rencontre?.reactions ?? {});
ok(vues.some((x) => x.v === "moi") && vues.some((x) => x.e === "😂"), `ses réactions sont gardées (${JSON.stringify(apres.rencontre?.reactions)})`);
const nAutre = rL.rencontre.repliques.findIndex((x) => !x.moi);
const juger = await api(lea, "/api/direct/rencontre", { action: "reagir", id: rL.rencontre.id, n: nAutre, v: "pas" });
ok(juger.statut === 400, "on ne juge que les phrases de sa propre figurine");
ok((await debordement(lea)) <= 0 && !/exemple/i.test(await texte(lea, "main")), "« Ma collection » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/personnage-3-rencontre.png`, fullPage: true });

// SIGNALER
lea.on("dialog", (d) => d.accept());
await lea.locator("#rencontre .rd-ia button", { hasText: "Signaler" }).click();
await lea.waitForSelector("#rencontre .rd-note", { timeout: 15000 });
ok((await texte(lea, "#rencontre .rd-note")).includes("retirée"), "signalée : elle ne s'affiche plus");
ok((await api(hugo, `/api/direct/rencontre?id=${rL.rencontre.id}`)).statut === 404, "chez Hugo non plus");

// SANS COMPTE : rien à faire ici
const sans = await fetch(`${BASE}/api/direct/rencontre`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "inviter" }) });
ok(sans.status === 403, "sans compte : pas d'invitation");

const erreurs = [...lea.err, ...inconnu.err, ...hugo.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
