// 🃏💬 SA CARTE DE PERSONNAGE ET LA RENCONTRE DU JOUR, DANS UN TÉLÉPHONE — `clikme.fr/collection`, contre le faux
// Supabase, sans IA (la fiche et la conversation sont alors composées par le serveur : c'est ce chemin qu'on essaie).
//
// Léa (deux figurines au Comptoir) fait le questionnaire : sept questions, ses goûts, sa phrase fétiche ; sa carte se
// révèle (niveau, six caractéristiques). Elle la partage : un lien `/carte/<id>` qu'un inconnu ouvre.
// LE RÉSEAU DES FIGURINES : sa première rencontre du jour, Pablito ; le lendemain, la figurine du Comptoir ; le
// surlendemain, un personnage imaginaire qui partage ses goûts (les jours passent : on vieillit son carnet). Chaque
// conversation a son format et finit par « Et toi ? ». Elle invite Hugo ; Hugo ouvre le lien, fait sa carte : leur
// discussion arrive aussitôt, la même chez les deux. Léa dit « c'est tout moi » à une phrase de sa figurine, et réagit
// d'une émotion à une phrase de Hugo ; elle ne peut pas juger une phrase de Hugo. Elle répond à « Et toi ? ». Elle
// lance des discussions avec Hugo (trois par jour). Elle signale : la rencontre ne s'affiche plus. Rien ne déborde.
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const A = { id: "ffffffff-0000-4000-8000-000000000041", slug: "comptoir-des-fantomes-dax", nom: "Le Comptoir des Fantômes" };
const LEA = { id: "dddddddd-0000-4000-8000-000000000051", jeton: "jeton-lea-0000000000000001" };
const HUGO = { id: "dddddddd-0000-4000-8000-000000000052", jeton: "jeton-hugo-000000000000001" };
const INES = { id: "dddddddd-0000-4000-8000-000000000053", jeton: "jeton-ines-000000000000001" };
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const ilYa = (n) => jour(new Date(Date.now() - n * 86_400_000));
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
// LE SEAU PRIVÉ DU FAUX SUPABASE : son carnet de rencontres, qu'on fait vieillir d'un jour (« le lendemain »)
const SEAU = `${F.replace(/\/rest\/v1$/, "/storage/v1/object")}/figurines-clients`;
const lireSeau = async (cle) => (await fetch(`${SEAU}/${cle}`)).json().catch(() => null);
const unJourPasse = async (h) => {
  const idx = await lireSeau(`${h}/rencontres.json`);
  const veille = (j) => jour(new Date(new Date(`${j}T12:00:00Z`).getTime() - 86_400_000));
  idx.liste = idx.liste.map((x) => ({ ...x, jour: veille(x.jour) }));
  await fetch(`${SEAU}/${h}/rencontres.json`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(idx) });
};

await semer("human_vitrine_sites", [{ id: A.id, slug: A.slug, channel: "letter", business_name: A.nom, city: "40100 Dax", activite: "Restaurant", published: true, est_client: true }]);
await semer("human_habitants", [
  { id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" },
  { id: HUGO.id, device_token: HUGO.jeton, prenom: "Hugo", ville_slug: "dax" },
  { id: INES.id, device_token: INES.jeton, prenom: "Inès", ville_slug: "dax" },
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
// (l'onglet « Rencontres » d'abord : sans carte, il attend)
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-teaser", { timeout: 60000 });
ok((await texte(lea, "#o-rencontre")).includes("D’abord, ton personnage") && (await lea.locator("#o-rencontre .pb-voile .mqd .mq").count()) === 1, "« Rencontres » : Pablito explique (en fenêtre la première fois), et la rencontre attend sa carte");
await fermerPablito(lea, "#o-rencontre");
await lea.locator("#o-rencontre .rd-teaser .og-go").click();
await lea.waitForSelector("#o-personnage .mp-lancer", { timeout: 60000 });
ok((await texte(lea, "#o-personnage")).includes("Quel personnage es-tu") && (await lea.locator("#o-personnage .pc.silhouette").count()) === 1 && /#personnage$/.test(lea.url()), "l'onglet « Personnage » : la carte mystère, et « Lancer le test »");
await lea.locator("#o-personnage .mp-lancer").click();
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
  g1.progres?.etapes?.includes("carte") && g1.progres?.etapes?.includes("commerce") && g1.carte?.niveau === 1 + g1.progres.cadeaux && g1.carte?.par === "local",
  `ses étapes font monter sa carte, un niveau par cadeau (${JSON.stringify(g1.progres)}, niveau ${g1.carte?.niveau}), fiche sans IA ici`,
);
const insulte = await api(lea, "/api/direct/personnage", { action: "creer", reponses: g1.carte.reponses, phrase: "espèce de connard" });
ok(insulte.statut === 422, "une phrase fétiche insultante : refusée");
await lea.screenshot({ path: `${D}/personnage-1-carte.png`, fullPage: true });

// SA CARTE PARTAGÉE
await lea.locator("#o-personnage .mp-sienne .mp-bouton").click();
await lea.waitForSelector("#o-personnage .tf-wa", { timeout: 15000 });
const lienCarte = await lea.locator("#o-personnage .tf-adresse").inputValue();
ok(/\/carte\/[a-z0-9]{12}$/.test(lienCarte) && decodeURIComponent((await lea.locator("#o-personnage .tf-wa").getAttribute("href")) ?? "").includes("Découvre mon personnage ClikMe"), `son lien de carte, sur WhatsApp (${lienCarte})`);
const inconnu = await tel(null);
await inconnu.goto(lienCarte.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await inconnu.waitForSelector(".cp .pc", { timeout: 30000 });
ok((await texte(inconnu, ".cp h1")).includes("Léa") && (await inconnu.locator('.cp-toi a[href="/collection#personnage"]').count()) === 1 && (await inconnu.locator('meta[name="robots"][content*="noindex"]').count()) === 1, "un inconnu voit sa carte, « Faire ma carte », pas dans Google");
ok((await debordement(inconnu)) <= 0, "la carte partagée ne déborde pas");
await inconnu.screenshot({ path: `${D}/personnage-2-partagee.png`, fullPage: true });

// ═══ 🌍 LA RENCONTRE DU JOUR, HORS DE SON ENTOURAGE : PABLITO, PUIS LE COMPTOIR, PUIS UN PERSONNAGE ═══
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-fil li", { timeout: 60000 });
ok((await texte(lea, "#o-rencontre .rd-prochaine")).match(/Prochaine rencontre dans \d{2}:\d{2}:\d{2}/), "le temps qui reste avant la prochaine rencontre");
const qui1 = await texte(lea, "#o-rencontre .rd-qui");
ok(qui1.includes("UN PERSONNAGE") && qui1.includes("Ta figurine a rencontré Pablito") && qui1.includes("🎲"), `la toute première : Pablito l'accueille, avec le format du jour (${qui1})`);
const j1 = await api(lea, "/api/direct/rencontre");
ok(j1.rencontre?.autre?.type === "personnage" && j1.rencontre.autre.cle === "pablito" && j1.rencontre.format?.nom && j1.rencontre.question && j1.rencontre.quoi === "jour", `Pablito, un format (« ${j1.rencontre?.format?.nom} »), une question pour elle (« ${j1.rencontre?.question} »)`);
ok(j1.rencontre?.revele?.length > 10, `🪞 ce que sa figurine a révélé d'elle (« ${j1.rencontre?.revele} »)`);
ok((await lea.locator("#o-rencontre .rd-fil .rd-reac").count()) === 0, "en direct, elle regarde : aucun bouton sous les phrases");
await unJourPasse(LEA.id);
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-fil li", { timeout: 60000 });
ok((await texte(lea, "#o-rencontre .rd-qui")).includes(`la figurine de ${A.nom}`), "le lendemain : la figurine du Comptoir (un commerçant)");
ok((await texte(lea, "#o-rencontre .rd-ia")).includes("Ce n’est pas le commerçant qui parle"), "« écrit par l'IA, pour jouer », et ce n'est pas le commerçant");
const j2 = await api(lea, "/api/direct/rencontre");
await unJourPasse(LEA.id);
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-fil li", { timeout: 60000 });
const j3 = await api(lea, "/api/direct/rencontre");
const perso = j3.rencontre?.autre;
ok(perso?.type === "personnage" && perso.cle !== "pablito" && /imaginaire/.test(perso.role) && ["rosa", "leo", "nina", "lou", "max"].includes(perso.cle), `le surlendemain : un personnage imaginaire qui partage ses goûts (${perso?.nom}, ${perso?.role})`);
ok((await texte(lea, "#o-rencontre .rd-ia")).includes("Ce personnage est imaginaire") && (await texte(lea, "#o-rencontre .rd-qui")).includes("(imaginaire)"), "un personnage imaginaire est dit tel");
ok(new Set([j1.rencontre.format.cle, j2.rencontre?.format?.cle, j3.rencontre?.format?.cle]).size === 3, `chaque jour, une conversation différente (${[j1, j2, j3].map((x) => x.rencontre?.format?.nom).join(" · ")})`);
await lea.locator("#o-rencontre .rs-passer").click();
await lea.waitForSelector("#o-rencontre .ra-ettoi", { timeout: 10000 });
ok((await texte(lea, "#o-rencontre .ra-revele")).includes("Ce que ta figurine a révélé de toi") && (await texte(lea, "#o-rencontre .ra-revele p")) === j3.rencontre.revele, "à la fin : « ce que ta figurine a révélé de toi »");
ok((await texte(lea, "#o-rencontre .ra-question")) === j3.rencontre.question, "à la fin : « Et toi ? », sa question");
await lea.screenshot({ path: `${D}/personnage-3a-personnage.png`, fullPage: true });

// ═══ ELLE INVITE HUGO ═══
await lea.locator("#o-rencontre .rd-choix.rd-inviter .mp-bouton").click();
await lea.waitForSelector("#o-rencontre .rd-inviter .tf-wa", { timeout: 15000 });
const lienAmi = await lea.locator("#o-rencontre .rd-inviter .tf-adresse").inputValue();
ok(/\/collection\?ami=[a-z0-9]{10}$/.test(lienAmi) && decodeURIComponent((await lea.locator("#o-rencontre .tf-wa").getAttribute("href")) ?? "").includes("nos deux figurines discutent"), `son invitation (${lienAmi})`);
const hugo = await tel(HUGO);
await hugo.goto(lienAmi.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await fermerPablito(hugo, "#o-rencontre");
ok(await hugo.locator("#o-rencontre").isVisible().catch(() => false), "le lien d'un ami ouvre l'onglet « Rencontres »");
await hugo.waitForSelector("#o-rencontre .rd-ami", { timeout: 60000 });
ok((await texte(hugo, "#o-rencontre .rd-ami")).includes("Toi et Léa"), "Hugo ouvre le lien : ils sont amis");
const carteHugo = await api(hugo, "/api/direct/personnage", { action: "creer", reponses: { elan: "b", ton: "b", jeu: "a", sort: "b", tete: "a", gout: "b", rythme: "a" }, gouts: ["sport"] });
ok(carteHugo.statut === 200 && carteHugo.carte?.fiche?.titre, "Hugo fait sa carte");

// LEUR DISCUSSION, TOUT DE SUITE, CHEZ LES DEUX (« dès qu'il a fait sa carte »)
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-nouvelle", { timeout: 60000 });
ok((await texte(lea, "#o-rencontre .rd-nouvelle")).includes("Hugo vient d’arriver"), "Hugo a fait sa carte : leur discussion arrive aussitôt");
await lea.locator("#o-rencontre .rd-nouvelle .mp-bouton").click();
await lea.waitForFunction(() => document.querySelector("#o-rencontre .rd-qui")?.textContent?.includes("Hugo"), null, { timeout: 15000 });
const quiH = await texte(lea, "#o-rencontre .rd-qui");
ok(quiH.includes("AVEC UN AMI") && quiH.includes("Ta figurine a discuté avec Hugo"), `elle la regarde (${quiH})`);
const etatL = await api(lea, "/api/direct/rencontre");
const idH = etatL.avant?.find((x) => x.avec === "Hugo")?.id;
const rL = await api(lea, `/api/direct/rencontre?id=${idH}`);
const rH = await api(hugo, `/api/direct/rencontre?id=${idH}`);
ok(rL.rencontre?.id && rL.rencontre.quoi === "ami" && rL.rencontre.id === rH.rencontre?.id && rH.rencontre?.autre?.prenom === "Léa", "la même discussion chez Hugo (une discussion d'amis)");
ok(etatL.rencontre?.id === j3.rencontre.id, "sa rencontre du jour reste celle du personnage");
ok(etatL.avant?.some((x) => x.avec === A.nom && x.titre) && etatL.avant?.some((x) => x.avec === "Pablito"), "Pablito et le Comptoir deviennent des cartes souvenirs (leur titre)");
// 🎬 EN DIRECT : une conversation plus longue, chaque réplique avec son geste ; un titre ; ce qui a été partagé
ok(rL.rencontre.repliques.length >= 8 && rL.rencontre.repliques.every((x) => x.geste), `une vraie conversation, chaque réplique avec son geste (${rL.rencontre.repliques.length})`);
ok(rL.rencontre.titre && rL.rencontre.partage?.length >= 1, `son titre (« ${rL.rencontre.titre} ») et ce qui a été partagé`);
ok((await texte(lea, "#o-rencontre .rs-direct")).includes("EN DIRECT") && (await lea.locator("#o-rencontre .rs-scene .rs-fig").count()) === 2, "en direct : les deux figurines sur scène");
ok((await lea.locator("#o-rencontre .rd-fil li.moi, #o-rencontre .rd-fil li.autre").count()) < rL.rencontre.repliques.length, "les répliques arrivent à leur rythme (deux minutes environ)");
ok((await texte(lea, "#o-rencontre .rs-barre")).includes("tu es spectateur"), "« tu es spectateur »");
await lea.locator("#o-rencontre .rs-passer").click();
await lea.waitForSelector("#o-rencontre .ra .cs", { timeout: 10000 });
ok((await lea.locator("#o-rencontre .rd-fil li.moi, #o-rencontre .rd-fil li.autre").count()) === rL.rencontre.repliques.length, "« Passer à la fin » : toutes les répliques");
ok((await texte(lea, "#o-rencontre .ra-partage")).includes("Ce qui a été partagé"), "à la fin : ce qui a été partagé");
ok((await texte(lea, "#o-rencontre .cs.nouvelle")).includes("Nouvelle carte souvenir") && (await texte(lea, "#o-rencontre .cs-titre")) === rL.rencontre.titre, "à la fin : sa nouvelle carte souvenir");
await lea.screenshot({ path: `${D}/personnage-3b-fin.png`, fullPage: true });

// SES RÉACTIONS
ok((await lea.locator("#o-rencontre .rd-fil li.autre .rd-emo").count()) === 0 && (await lea.locator("#o-rencontre .rd-fil li.moi .rd-verdict").count()) > 0, "à la fin : « c'est moi / pas moi » sous ses phrases, pas de rangée d'émotions partout");
await lea.locator("#o-rencontre .rd-fil li.moi .rd-verdict", { hasText: "C’est tout moi" }).first().click();
await lea.locator("#o-rencontre .rd-fil li.autre .rd-bulle").first().click();
await lea.locator("#o-rencontre .rd-fil li.autre .rd-emo").first().click();
await lea.waitForTimeout(800);
const apres = await api(lea, `/api/direct/rencontre?id=${rL.rencontre.id}`);
const vues = Object.values(apres.rencontre?.reactions ?? {});
ok(vues.some((x) => x.v === "moi") && vues.some((x) => x.e === "😂"), `ses réactions sont gardées (${JSON.stringify(apres.rencontre?.reactions)})`);
const nAutre = rL.rencontre.repliques.findIndex((x) => !x.moi);
const juger = await api(lea, "/api/direct/rencontre", { action: "reagir", id: rL.rencontre.id, n: nAutre, v: "pas" });
ok(juger.statut === 400, "on ne juge que les phrases de sa propre figurine");
ok((await debordement(lea)) <= 0 && !/exemple/i.test(await texte(lea, "main")), "« Ma collection » ne déborde pas, sans le mot interdit");
await lea.screenshot({ path: `${D}/personnage-3-rencontre.png`, fullPage: true });

// 💬 LEURS IMPRESSIONS, SI LES DEUX LE VEULENT
ok(rL.rencontre.echange && !rL.rencontre.echange.moi, "entre deux clients : on peut échanger ses impressions");
const tropTot = await api(hugo, "/api/direct/rencontre", { action: "impression", id: rL.rencontre.id, texte: "Coucou !" });
ok(tropTot.statut === 403, "personne n'écrit tant que les deux n'ont pas dit oui");
await lea.locator("#o-rencontre .ra-oui").click();
await lea.waitForSelector("#o-rencontre .ra-note", { timeout: 10000 });
ok((await texte(lea, "#o-rencontre .ra-note")).includes("Si Hugo est d’accord aussi"), "Léa dit oui : on attend Hugo");
const ouiH = await api(hugo, "/api/direct/rencontre", { action: "echanger", id: rL.rencontre.id, oui: true });
ok(ouiH.statut === 200 && ouiH.rencontre?.echange?.autre === true, "Hugo dit oui aussi");
await lea.reload({ waitUntil: "networkidle" });
await lea.locator("#o-rencontre .rd-souv", { hasText: "Hugo" }).first().click();
await lea.waitForSelector("#o-rencontre .ra-echange textarea", { timeout: 30000 });
ok((await lea.locator("#o-rencontre .rs-direct", { hasText: "TERMINÉE" }).count()) === 1, "déjà regardée : elle ne repasse pas en direct");
await lea.locator("#o-rencontre .ra-echange textarea").fill("Ta figurine m’a fait rire, défi accepté !");
await lea.locator("#o-rencontre .ra-echange .ra-envoyer").click();
await lea.waitForSelector("#o-rencontre .ra-fil li.moi", { timeout: 10000 });
const numero = await api(hugo, "/api/direct/rencontre", { action: "impression", id: rL.rencontre.id, texte: "Appelle-moi au 06 12 34 56 78" });
ok(numero.statut === 400 && /numéro/.test(numero.error ?? ""), `pas de numéro (${numero.error})`);
const lienX = await api(hugo, "/api/direct/rencontre", { action: "impression", id: rL.rencontre.id, texte: "Viens sur insta" });
ok(lienX.statut === 400, "on se parle ici, pas ailleurs");
const motH = await api(hugo, "/api/direct/rencontre", { action: "impression", id: rL.rencontre.id, texte: "Pareil, trop drôle !" });
ok(motH.statut === 200 && motH.rencontre?.echange?.messages?.length === 2 && motH.rencontre.echange.messages[1].moi, "Hugo répond : leurs deux impressions");

// 🗨️ « ET TOI ? » : sa réponse est gardée, et nourrira les conversations suivantes
await lea.locator("#o-rencontre .ra-ettoi textarea").fill("Moi, je cuisine pour mes amis le dimanche !");
await lea.locator("#o-rencontre .ra-ettoi .ra-envoyer").click();
await lea.waitForSelector("#o-rencontre .ra-reponse", { timeout: 10000 });
ok((await texte(lea, "#o-rencontre .ra-reponse")).includes("je cuisine pour mes amis"), "« Et toi ? » : elle répond");
const carnet = await lireSeau(`${LEA.id}/rencontres.json`);
ok(carnet?.dit?.some((x) => x.r.includes("je cuisine pour mes amis")), "sa réponse rejoint ce qu'elle a dit d'elle (pour les prochaines conversations)");
const repNum = await api(lea, "/api/direct/rencontre", { action: "repondre", id: rL.rencontre.id, texte: "Écris-moi au 06 12 34 56 78" });
ok(repNum.statut === 400, "pas de numéro dans sa réponse");
// 📓 TOUT EST GARDÉ, DATÉ, MOIS PAR MOIS (Supabase) : ses réponses, ses « c'est moi », ce que ses rencontres ont révélé
const mois = jour(new Date()).slice(0, 7);
const journal = (await lireSeau(`${LEA.id}/journal/${mois}.json`))?.entrees ?? [];
const types = new Set(journal.map((x) => x.type));
ok(types.has("reponse") && types.has("verdict") && types.has("revele") && journal.some((x) => x.type === "reponse" && x.texte.includes("je cuisine")), `son journal du mois garde tout (${journal.length} entrées : ${[...types].join(", ")})`);

// 👯 SES AMIS : une discussion quand elle veut, trois par jour
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-amis li", { timeout: 60000 });
ok((await texte(lea, "#o-rencontre .rd-amis")).includes("Hugo") && (await texte(lea, "#o-rencontre .rd-amis")).includes("encore 3 aujourd’hui"), "ses amis et proches : Hugo, encore trois discussions aujourd'hui");
await lea.locator("#o-rencontre .rd-amis .mp-bouton").first().click();
await lea.waitForFunction(() => document.querySelector("#o-rencontre .rd-qui")?.textContent?.includes("AVEC UN AMI"), null, { timeout: 30000 });
ok((await texte(lea, "#o-rencontre .rs-direct")).includes("EN DIRECT") && (await texte(lea, "#o-rencontre .rd-amis")).includes("encore 2 aujourd’hui"), "« Discuter » : leur discussion, en direct ; encore deux");
const d2 = await api(lea, "/api/direct/rencontre", { action: "discuter", n: 0 });
const d3 = await api(lea, "/api/direct/rencontre", { action: "discuter", n: 0 });
const d4 = await api(lea, "/api/direct/rencontre", { action: "discuter", n: 0 });
ok(d2.statut === 200 && d3.statut === 200 && d3.restantes === 0 && d4.statut === 429, `trois discussions par jour (${d2.statut}, ${d3.statut}, ${d4.statut})`);
ok((await api(lea, "/api/direct/rencontre", { action: "discuter", n: 7 })).statut === 404, "un ami qui n'est pas dans sa liste : non");
ok(new Set([rL.rencontre.format?.cle, d2.rencontre?.format?.cle, d3.rencontre?.format?.cle]).size >= 2, "des discussions variées (leurs formats)");
await lea.screenshot({ path: `${D}/personnage-3c-amis.png`, fullPage: true });

// 🎞️ SES CARTES SOUVENIRS, DANS L'ALBUM
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-fil li", { timeout: 60000 });
const souv = await api(lea, "/api/direct/rencontre?souvenirs=1");
ok(souv.souvenirs?.length >= 2 && souv.souvenirs.every((x) => x.titre && x.avec), `ses cartes souvenirs (${souv.souvenirs?.map((x) => x.titre).join(" · ")})`);
await lea.locator(".mc-nav button", { hasText: "Album" }).click({ force: true });
await lea.waitForSelector("#o-album .ms .cs.petite", { timeout: 30000 });
ok((await lea.locator("#o-album .ms .cs.petite").count()) === souv.souvenirs.length, "dans l'album : « Mes cartes souvenirs »");
await lea.locator("#o-album .ms .cs.petite", { hasText: A.nom }).first().click();
await lea.waitForFunction((nom) => document.querySelector("#o-rencontre:not([hidden]) .rd-qui")?.textContent?.includes(nom), A.nom, { timeout: 15000 });
ok(true, "une carte souvenir touchée rouvre sa rencontre");
await lea.locator("#o-rencontre .rd-ia button", { hasText: "Ma rencontre du jour" }).click();

// SIGNALER
lea.on("dialog", (d) => d.accept());
await lea.locator("#o-rencontre .rd-ia button", { hasText: "Signaler" }).click();
await lea.waitForSelector("#o-rencontre .rd-note", { timeout: 15000 });
ok((await texte(lea, "#o-rencontre .rd-note")).includes("retirée"), "signalée : elle ne s'affiche plus");
ok((await api(lea, "/api/direct/rencontre", { action: "signaler", id: rL.rencontre.id })).statut === 200 && (await api(hugo, `/api/direct/rencontre?id=${rL.rencontre.id}`)).statut === 404, "une discussion d'amis signalée : chez Hugo non plus");

// ═══ 🎲 RENCONTRER UN MEMBRE : Léa appuie (personne n'attend : elle entre dans la file) ; Inès appuie : elles se rencontrent ═══
await lea.locator("#o-rencontre .rd-rond").click({ force: true });
await lea.waitForSelector("#o-rencontre .rd-file", { timeout: 20000 });
ok((await texte(lea, "#o-rencontre .rd-file")).includes("Tu es dans la file"), "personne n'attend : Léa est dans la file des membres");
const ines = await tel(INES);
await ines.goto(`${BASE}/collection`, { waitUntil: "networkidle" });
await api(ines, "/api/direct/personnage", { action: "creer", reponses: { elan: "a", ton: "b", jeu: "b", sort: "a", tete: "b", gout: "a", rythme: "b" }, gouts: ["lecture"] });
const mI = await api(ines, "/api/direct/rencontre", { action: "membre" });
ok(mI.statut === 200 && mI.rencontre?.membre && mI.rencontre?.autre?.prenom === "Léa", `Inès appuie : elle rencontre Léa (${mI.rencontre?.autre?.prenom})`);
const encore = await api(ines, "/api/direct/rencontre", { action: "membre" });
ok(encore.statut === 429, "une rencontre de membre par jour");
await lea.goto(`${BASE}/collection?v=${Date.now()}#rencontre`, { waitUntil: "networkidle" });
await lea.waitForSelector("#o-rencontre .rd-fil li", { timeout: 60000 });
const quiL = await texte(lea, "#o-rencontre .rd-qui");
ok(quiL.includes("UN MEMBRE") && quiL.includes("Inès") && (await lea.locator("#o-rencontre .rd-rebours").count()) === 1, `chez Léa aussi : sa rencontre avec Inès, et le compte à rebours jusqu'à demain (${quiL})`);
await lea.locator("#o-rencontre .rd-ia button", { hasText: "Ne plus rencontrer ce membre" }).click();
await lea.waitForTimeout(800);
ok((await api(lea, "/api/direct/rencontre", { action: "bloquer", id: mI.rencontre.id })).statut === 200, "elle peut ne plus rencontrer ce membre");
await lea.screenshot({ path: `${D}/personnage-4-membre.png`, fullPage: true });

// SANS COMPTE : rien à faire ici
const sans = await fetch(`${BASE}/api/direct/rencontre`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "inviter" }) });
ok(sans.status === 403, "sans compte : pas d'invitation");

const erreurs = [...lea.err, ...inconnu.err, ...hugo.err, ...ines.err];
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
