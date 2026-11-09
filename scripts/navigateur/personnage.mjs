// 🃏 « MOI » : SA CARTE DE PERSONNAGE, DANS UN TÉLÉPHONE — `clikme.fr/collection#personnage`, contre le faux Supabase,
// sans IA (la fiche est alors composée par le serveur : c'est ce chemin qu'on essaie).
//
// Léa (deux figurines au Comptoir) fait le questionnaire : sept questions, ses goûts, sa phrase fétiche ; sa carte se
// révèle (niveau, six caractéristiques). Elle la partage : un lien `/carte/<id>` qu'un inconnu ouvre. Elle répond à la
// question du jour ; « Ce que ta figurine sait de toi » montre tout, elle efface une chose, puis tout. Son adresse
// protège sa figurine, qu'un autre téléphone retrouve avec le code.
//
// « RENCONTRES » EST EFFACÉ (7 novembre 2026, le propriétaire : « effacer ») : cet essai remplace
// `personnage-rencontre.mjs`. On vérifie aussi que « Rencontres » n'existe plus : ni dans le menu, ni à son adresse
// (`#rencontre` et le lien d'un ami ouvrent « Créer »), ni sa route (`/api/direct/rencontre`). Rien ne déborde.
import { BASE, D, F, fermerPablito, lancer, repondreFenetre } from "./commun.mjs";

const A = { id: "ffffffff-0000-4000-8000-000000000041", slug: "comptoir-des-fantomes-dax", nom: "Le Comptoir des Fantômes" };
const LEA = { id: "dddddddd-0000-4000-8000-000000000051", jeton: "jeton-lea-0000000000000001" };
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const ilYa = (n) => jour(new Date(Date.now() - n * 86_400_000));
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
// LE SEAU PRIVÉ DU FAUX SUPABASE
const SEAU = `${F.replace(/\/rest\/v1$/, "/storage/v1/object")}/figurines-clients`;
const lireSeau = async (cle) => (await fetch(`${SEAU}/${cle}`)).json().catch(() => null);
const poserSeau = (cle, x) => fetch(`${SEAU}/${cle}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });

await semer("human_vitrine_sites", [{ id: A.id, slug: A.slug, channel: "letter", business_name: A.nom, city: "40100 Dax", activite: "Restaurant", published: true, est_client: true }]);
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);
await semer("clik_cage", [{ site_id: A.id, habitant_id: LEA.id, film: "page", cage: "adore", prenom: "Léa", look: "fleuri", created_at: new Date(Date.now() - 200 * 86_400_000).toISOString(), updated_at: new Date().toISOString() }]);
await semer("clik_visite", [{ site_id: A.id, habitant_id: LEA.id, jour: ilYa(0) }, { site_id: A.id, habitant_id: LEA.id, jour: ilYa(40) }]);
// ce qu'elle a dit d'elle le mois dernier (son journal) : « ce que ta figurine sait de toi » le montre
const moisDernier = ilYa(40).slice(0, 7);
await poserSeau(`${LEA.id}/journal/${moisDernier}.json`, {
  entrees: [
    { type: "question", le: `${ilYa(41)}T09:00:00.000Z`, cle: "essai-1", question: "Ton plat signature ?", texte: "je cuisine pour mes amis" },
    { type: "question", le: `${ilYa(40)}T09:00:00.000Z`, cle: "essai-2", question: "Ton petit plaisir ?", texte: "un croissant au lit" },
  ],
});

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
await lea.goto(`${BASE}/collection?v=${Date.now()}#personnage`, { waitUntil: "networkidle" });
// (pas encore de figurine : Pablito lui dit bienvenue, une fois)
await fermerPablito(lea);
await lea.waitForSelector("#o-personnage .mp-lancer", { timeout: 60000 });
ok((await texte(lea, "#o-personnage")).includes("Quel personnage es-tu") && (await lea.locator("#o-personnage .pc.silhouette").count()) === 1, "« Moi » : la carte mystère, et « Lancer le test »");
await lea.locator("#o-personnage .mp-lancer").first().click();
for (let k = 0; k < 7; k++) {
  await lea.waitForSelector("#o-personnage .mp-choix button", { timeout: 10000 });
  if (k === 0) ok((await texte(lea, "#o-personnage .mp-compte")) === "1 / 8", "sept questions, puis ses goûts");
  await lea.locator("#o-personnage .mp-choix button").nth(k % 2).click();
  // SA CARTE SE CONSTRUIT EN DIRECT : chaque réponse fait monter ses caractéristiques (le gain s'envole)
  if (k === 0) ok((await lea.locator("#o-personnage .mp-direct li").count()) === 6 && (await lea.locator("#o-personnage .mp-gain").count()) > 0, "sa carte se construit en direct : le gain de sa réponse s'envole");
}
await lea.waitForSelector("#o-personnage .mp-gouts", { timeout: 10000 });
for (const g of ["Cuisine", "Musique", "Voyages"]) await lea.locator("#o-personnage .mp-gouts button", { hasText: g }).click();
ok(await lea.locator("#o-personnage .mp-gouts button", { hasText: "Sport" }).isDisabled(), "trois goûts au plus");
await lea.locator("#o-personnage .mp-phrase").fill("Allez, on y va !");
await lea.locator("#o-personnage .mp-reveler").click();
await lea.waitForSelector("#o-personnage .mp-sienne .pc", { timeout: 30000 });
ok((await texte(lea, "#o-personnage .mp-nouvelle")).includes("Nouvelle carte") && (await lea.locator(".pc-confettis i").count()) > 10, "la révélation : « Nouvelle carte ! », les confettis");
const carte = await texte(lea, "#o-personnage .pc");
ok(/Niv\. 3/.test(carte) && carte.includes("Léa") && /Fidélité \d+/.test(carte) && carte.includes("Super-pouvoir") && carte.includes("« Allez, on y va ! »"), `sa carte : niveau 3 (deux cadeaux : sa carte, sa première figurine du mois), six caractéristiques, sa fiche (${carte.slice(0, 140)})`);
ok((await lea.locator("#o-personnage .pc-carac li").count()) === 6, "six caractéristiques");
await lea.locator("#o-personnage .pc").click();
ok((await lea.locator("#o-personnage .pc-scene.dos").count()) === 1, "un toucher la retourne : sa fiche au dos");
ok((await texte(lea, "#o-personnage .mp-monte")).includes("Ta prochaine étape") && (await texte(lea, "#o-personnage .mp-monte")).includes("Argent") && !/achat/i.test(await texte(lea, "#o-personnage .mp-monte")), "ce qui la fait monter : sa prochaine étape (un cadeau de ClikMe), le cadre Argent — plus aucun achat");
const g1 = await api(lea, "/api/direct/personnage");
ok(
  g1.progres?.etapes?.includes("carte") && !g1.progres?.etapes?.some((e) => ["rencontre", "ami", "membre", "souvenirs", "commerce"].includes(e)) && g1.carte?.niveau === 1 + g1.progres.cadeaux && g1.carte?.par === "local",
  `ses étapes font monter sa carte, un niveau par cadeau, plus aucune étape des Rencontres (${JSON.stringify(g1.progres)}, niveau ${g1.carte?.niveau}), fiche sans IA ici`,
);
const insulte = await api(lea, "/api/direct/personnage", { action: "creer", reponses: g1.carte.reponses, phrase: "espèce de connard" });
ok(insulte.statut === 422, "une phrase fétiche insultante : refusée");
await lea.screenshot({ path: `${D}/personnage-1-carte.png`, fullPage: true });

// SA CARTE PARTAGÉE
// (« 📲 Partager ma carte » : le bouton de sa carte — la question du jour, plus bas, a aussi son « OK » les jours de réponse libre)
await lea.locator("#o-personnage .mp-sienne .mp-texte > .mp-bouton").click();
await lea.waitForSelector("#o-personnage .tf-wa", { timeout: 15000 });
const lienCarte = await lea.locator("#o-personnage .tf-adresse").inputValue();
ok(/\/carte\/[a-z0-9]{12}$/.test(lienCarte) && decodeURIComponent((await lea.locator("#o-personnage .tf-wa").getAttribute("href")) ?? "").includes("Découvre mon personnage ClikMe"), `son lien de carte, sur WhatsApp (${lienCarte})`);
const inconnu = await tel(null);
await inconnu.goto(lienCarte.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await inconnu.waitForSelector(".cp .pc", { timeout: 30000 });
ok((await texte(inconnu, ".cp h1")).includes("Léa") && (await inconnu.locator('.cp-toi a[href="/collection#personnage"]').count()) === 1 && (await inconnu.locator('meta[name="robots"][content*="noindex"]').count()) === 1, "un inconnu voit sa carte, « Faire ma carte », pas dans Google");
ok((await debordement(inconnu)) <= 0, "la carte partagée ne déborde pas");
await inconnu.screenshot({ path: `${D}/personnage-2-partagee.png`, fullPage: true });

// ❓ LA QUESTION DU JOUR, dans « Moi »
await lea.goto(`${BASE}/collection?v=${Date.now()}#personnage`, { waitUntil: "networkidle" });
await fermerPablito(lea, "#o-personnage");
await lea.waitForSelector("#o-personnage .cn-question", { timeout: 30000 });
const q0 = await api(lea, "/api/direct/connaitre");
if (q0.question?.choix) await lea.locator("#o-personnage .cn-choix button").first().click();
else {
  await lea.locator("#o-personnage .cn-libre input").fill("Les crêpes du dimanche");
  await lea.locator("#o-personnage .cn-libre .mp-bouton").click();
}
await lea.waitForSelector("#o-personnage .cn-reponse", { timeout: 15000 });
const q1 = await api(lea, "/api/direct/connaitre");
ok(q1.question?.cle === q0.question?.cle && q1.question?.reponse, `la question du jour (« ${q0.question?.q} ») : sa réponse est gardée (« ${q1.question?.reponse} »)`);
ok(((await lireSeau(`${LEA.id}/rencontres.json`))?.dit ?? []).some((x) => x.r === q1.question?.reponse), "et rejoint ce qu'elle a dit d'elle (ses premiers pas la comptent)");
ok((await api(lea, "/api/direct/connaitre", { action: "question", cle: "zzz", texte: "x" })).statut === 409, "une autre question que celle du jour : non");
ok((await api(lea, "/api/direct/connaitre?mot=1")).mot === undefined, "plus de petit mot du jour (il annonçait la rencontre du jour)");

// ═══ 🧠 CE QUE TA FIGURINE SAIT DE TOI : elle voit tout, elle efface ═══
await lea.waitForSelector("#o-personnage .cn-savoir-tete", { timeout: 30000 });
await lea.locator("#o-personnage .cn-savoir-tete").click();
// (la liste se recharge à l'ouverture : sa réponse du jour y est, avec les deux d'avant)
await lea.waitForFunction(() => /Elle a retenu 3 choses/.test(document.querySelector("#o-personnage .cn-savoir-tete")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => null);
await lea.waitForSelector("#o-personnage .cn-choses li", { timeout: 15000 });
const nAvant = await lea.locator("#o-personnage .cn-choses li").count();
const savoirTxt = await texte(lea, "#o-personnage .cn-savoir");
ok(nAvant >= 3 && savoirTxt.includes("Ta carte") && savoirTxt.includes("je cuisine pour mes amis") && savoirTxt.includes("Question du jour"), `ce que sa figurine sait d'elle : sa carte, ses réponses d'aujourd'hui et d'avant (${nAvant} : ${savoirTxt.slice(0, 260)})`);
// (effacer demande confirmation : « Effacer ceci ? », « Tout effacer ? » — elle dit oui)
await lea.locator("#o-personnage .cn-choses li button").first().click();
ok((await repondreFenetre(lea)).includes("Effacer ceci ?"), "« Effacer ceci ? » : une fenêtre de ClikMe");
await lea.waitForFunction((n) => document.querySelectorAll("#o-personnage .cn-choses li").length === n - 1, nAvant, { timeout: 15000 });
ok(true, "elle efface une chose : elle disparaît");
await lea.locator("#o-personnage .cn-tout").click();
await repondreFenetre(lea);
await lea.waitForFunction(() => document.querySelectorAll("#o-personnage .cn-choses li").length === 0, null, { timeout: 15000 });
const apresTout = await api(lea, "/api/direct/connaitre?savoir=1");
const carnetVide = await lireSeau(`${LEA.id}/rencontres.json`);
ok(apresTout.savoir?.choses?.length === 0 && apresTout.savoir?.carte && (carnetVide?.dit ?? []).length === 0, "« tout effacer » : elle oublie tout ce qu'elle a appris (sa carte reste)");
ok((await debordement(lea)) <= 0, "« Moi » ne déborde pas");
await lea.screenshot({ path: `${D}/personnage-5-savoir.png`, fullPage: true });

// ═══ 🔐 SA FIGURINE PROTÉGÉE PAR SON ADRESSE, PUIS RETROUVÉE SUR UN AUTRE TÉLÉPHONE (un code à six chiffres) ═══
const COURRIELS = F.replace(/\/rest\/v1$/, "/__courriels");
const dernierCode = async (a) => {
  const l = await (await fetch(COURRIELS)).json();
  const m = [...l].reverse().find((x) => [].concat(x.to).includes(a));
  return /^(\d{6})/.exec(m?.subject ?? "")?.[1] ?? "";
};
const ADRESSE = "lea.essai@clikme-essai.test";
ok((await api(lea, "/api/direct/connaitre", { action: "code", email: ADRESSE })).statut === 200, "elle demande son code");
const code1 = await dernierCode(ADRESSE);
ok(/^\d{6}$/.test(code1), "le code part par e-mail (« Ma figurine »)");
ok((await api(lea, "/api/direct/connaitre", { action: "verifier", email: ADRESSE, code: "000000" === code1 ? "111111" : "000000" })).statut === 400, "un faux code : non");
const prot = await api(lea, "/api/direct/connaitre", { action: "verifier", email: ADRESSE, code: code1 });
ok(prot.statut === 200 && prot.protegee && prot.a === "l•••@clikme-essai.test", `son adresse protège sa figurine (${prot.a})`);
const neuf = await tel(null);
await neuf.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await fermerPablito(neuf, "#o-figurine");
await neuf.locator(".cn-retrouver-lien").click();
await neuf.locator(".cn-proteger input[type=email]").fill(ADRESSE);
await neuf.locator(".cn-proteger .mp-bouton").click();
await neuf.waitForSelector(".cn-proteger input[autocomplete=one-time-code]", { timeout: 15000 });
const code2 = await dernierCode(ADRESSE);
await neuf.locator(".cn-proteger input[autocomplete=one-time-code]").fill(code2);
await neuf.locator(".cn-proteger .mp-bouton").click();
await neuf.waitForURL(/retrouvee=1/, { timeout: 30000 });
await neuf.waitForLoadState("networkidle");
const perso2 = await api(neuf, "/api/direct/personnage");
ok(perso2.carte?.prenom === "Léa", `un autre téléphone retrouve sa figurine avec le code (${perso2.carte?.prenom})`);

// ═══ 🗑️ « RENCONTRES » N'EXISTE PLUS ═══
const menu = await lea.locator(".mc-nav button").allInnerTexts();
ok(menu.length === 5 && !menu.some((t) => /Rencontres/.test(t)), `le menu en bas, sans « Rencontres » (${menu.map((t) => t.trim()).join(" · ")})`);
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-figurine:not([hidden])", { timeout: 30000 });
ok((await lea.locator("#o-rencontre").count()) === 0 && (await texte(lea, ".mc-nav button.pris")).includes("Créer"), "`#rencontre` ouvre « Créer »");
await lea.goto(`${BASE}/collection?v=${Date.now()}&ami=abcdefghij`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-figurine:not([hidden])", { timeout: 30000 });
ok((await lea.locator("#o-rencontre").count()) === 0 && (await texte(lea, ".mc-nav button.pris")).includes("Créer"), "le lien d'un ami (`?ami=`) ouvre « Créer »");
ok((await api(lea, "/api/direct/rencontre")).statut === 404, "sa route est partie (`/api/direct/rencontre` : 404)");

const erreurs = [...lea.err, ...inconnu.err, ...neuf.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
