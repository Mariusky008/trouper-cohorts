// 🙂 « MOI », SOUS SON PRÉNOM, DANS UN TÉLÉPHONE — `clikme.fr/collection#personnage`, contre le faux Supabase,
// sans IA (la fiche est alors composée par le serveur : c'est ce chemin qu'on essaie).
//
// Léa (deux figurines au Comptoir) ouvre « Moi », refait le 26 novembre 2026 (`app/collection/page-moi.tsx`) : plus de
// carte de personnage ; ses réglages par thème, ses passions. La question du jour ; « Ce que ta figurine sait de toi »
// montre tout, elle efface une chose, puis tout. Son adresse protège sa figurine, qu'un autre téléphone retrouve avec le code.
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

// ═══ LÉA : « MOI », REFAIT LE 26 NOVEMBRE 2026 (`page-moi.tsx`) — SA FIGURINE, SES RÉGLAGES PAR THÈME ; PLUS DE CARTE ═══
const lea = await tel(LEA);
await lea.goto(`${BASE}/collection?v=${Date.now()}#personnage`, { waitUntil: "networkidle" });
// (pas encore de figurine : Pablito lui dit bienvenue, une fois)
await fermerPablito(lea);
await lea.waitForSelector("#o-personnage .pm", { timeout: 60000 });
const moiTxt = await texte(lea, "#o-personnage");
ok(moiTxt.includes("Léa") && (await lea.locator("#o-personnage [data-creer]").count()) === 1, "« Moi » : son prénom, et « ✨ Créer ma figurine » tant qu'elle n'en a pas");
ok(!moiTxt.includes("Quel personnage es-tu") && (await lea.locator("#o-personnage .mp-lancer, #o-personnage .pc, .mc-barre .mc-moi i, .mc-barre .mc-cadenas, #o-personnage .cm-moi-raccourcis").count()) === 0, "plus de carte de personnage, ni de « ! » à côté du prénom, ni de cadenas en haut, ni de raccourcis vers le studio");
const groupes = await lea.locator("#o-personnage [data-groupe]").evaluateAll((l) => l.map((x) => x.dataset.groupe));
ok(groupes.includes("aime") && groupes.includes("telephone") && groupes.includes("donnees"), `ses réglages rangés par thème (${groupes.join(", ")})`);
await lea.waitForSelector('#o-personnage [data-ligne="passions"] .pm-puces', { timeout: 15000 }).catch(() => null);
ok((await texte(lea, '#o-personnage [data-ligne="passions"]')).includes("Mes passions"), "❤️ « Mes passions » : elles choisissent ce qu'elle voit dans Découvrir");
await lea.locator('#o-personnage [data-ligne="passions"]').click();
await lea.waitForSelector("#o-personnage .tp-tuiles", { timeout: 15000 });
ok((await lea.locator("#o-personnage [data-retour-moi]").count()) === 1, "un toucher : ses passions, dans la page, et « ‹ Moi » pour revenir");
await lea.locator("#o-personnage [data-retour-moi]").click();
await lea.waitForSelector('#o-personnage [data-ligne="passions"]', { timeout: 15000 });
ok((await debordement(lea)) <= 0 && !/exemple/i.test(await texte(lea, "#o-personnage")), "« Moi » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/personnage-1-moi.png`, fullPage: true });

// ✨ « MES VŒUX » ont quitté « Moi » le 19 novembre 2026 (avec l'ancien « Découvrir ») ; la question du jour n'y revient pas
await lea.goto(`${BASE}/collection?v=${Date.now()}#personnage`, { waitUntil: "networkidle" });
await fermerPablito(lea, "#o-personnage");
await lea.waitForSelector("#o-personnage .pm", { timeout: 30000 });
const mesTxt = await texte(lea, "#o-personnage");
ok(!mesTxt.includes("Mes vœux") && (await lea.locator("#o-personnage .vx-mes, #o-personnage .pc-exauce").count()) === 0 && (await lea.locator("#o-personnage .cn-question").count()) === 0, "plus de « Mes vœux » dans Moi, ni de question du jour");
// ❓ la question du jour reste comprise par sa figurine (on y répond par l'API : elle n'a plus d'écran dans « Moi »)
const q0 = await api(lea, "/api/direct/connaitre");
await api(lea, "/api/direct/connaitre", { action: "question", cle: q0.question?.cle, texte: q0.question?.choix?.[0] ?? "Les crêpes du dimanche" });
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
ok(nAvant >= 3 && savoirTxt.includes("je cuisine pour mes amis") && savoirTxt.includes("Question du jour"), `ce que sa figurine sait d'elle : ses réponses d'aujourd'hui et d'avant (${nAvant} : ${savoirTxt.slice(0, 260)})`);
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
ok(apresTout.savoir?.choses?.length === 0 && (carnetVide?.dit ?? []).length === 0, "« tout effacer » : elle oublie tout ce qu'elle a appris");
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
const fig2 = await api(neuf, "/api/direct/ma-figurine");
ok(fig2.etat?.prenom === "Léa", `un autre téléphone retrouve sa figurine avec le code (${fig2.etat?.prenom})`);

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

const erreurs = [...lea.err, ...neuf.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
