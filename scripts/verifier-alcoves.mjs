/**
 * 🛋️ LA GARDE D'ENSEMBLE EN ALCÔVES — le parcours complet, contre le faux
 * Supabase (`scripts/faux-supabase.mjs`) et /ville/dax.
 *
 * D'autres téléphones préparent la ville (Léa, Nadia, Karim, Lucas, Camille…) ;
 * le navigateur est Marie, qui arrive pour la première fois :
 *
 *   · l'accueil, puis le carrousel des salons publics (compteur, glisser, flèches) ;
 *   · « Salons publics ▾ » : la liste, une ligne ouvre sa scène ;
 *   · un salon public non rejoint : de vrais participants, la place libre, pas de « Toi » ;
 *   · « Ta place ? » → le choix du fantôme → la confirmation → rejoindre :
 *     l'installation une seule fois, le nombre du serveur, « Toi » ;
 *   · le retour dans l'onglet ne rejoue pas l'installation ;
 *   · l'échec du serveur : rien n'est montré, le bouton propose de réessayer ;
 *   · « Lire sans rejoindre », puis « Rejoindre pour répondre » depuis la conversation ;
 *   · mon salon privé où je suis seul : « Inviter quelqu'un » ;
 *   · plus de membres que de places : « +N » ; fermer le panneau ; « Choisir plus tard » ;
 *   · mouvement réduit : l'état final, sans animation.
 *
 * Usage (les deux serveurs tournent, le faux Supabase est neuf) :
 *   node scripts/verifier-alcoves.mjs [largeur] [hauteur] [port]
 * CAPTURES=<dossier> pour garder les images. CALME=1 : mouvement réduit.
 */
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
const { chromium, request } = pw;

const W = Number(process.argv[2] || 390);
const H = Number(process.argv[3] || 844);
const APP = `http://localhost:${process.argv[4] || "3821"}`;
const D = process.env.CAPTURES || "";
const CALME = Boolean(process.env.CALME);
const ROUTE = "/api/direct/conversations";

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(`${c ? "OK   " : "ÉCHEC"} ${m}`);
};

// ═══ LA VILLE, PRÉPARÉE PAR D'AUTRES TÉLÉPHONES ═══
const tel = () => request.newContext({ baseURL: APP });
const faire = async (t, corps) => (await t.post(ROUTE, { data: corps })).json().catch(() => ({}));
const ouvrir = async (t, qui, sujet, prive = false) => (await faire(t, { action: "ouvrir", ville: "dax", qui, base: { sujet, ou: "Dax", quand: "Cette semaine", prive } })).id;
const [lea, nadia, karim, lucas, camille] = await Promise.all([tel(), tel(), tel(), tel(), tel()]);
await faire(nadia, { action: "look", look: "artiste", ville: "dax" });
await faire(karim, { action: "look", look: "cosy", ville: "dax" });
const P1 = await ouvrir(lea, "Léa", "Une chose à ajouter au centre-ville ?");
await faire(nadia, { action: "rejoindre", id: P1, qui: "Nadia" });
await faire(karim, { action: "rejoindre", id: P1, qui: "Karim" });
await faire(nadia, { action: "geste", id: P1, qui: "Nadia", geste: { type: "ecrire", texte: "Un café-jeux !" } });
const P2 = await ouvrir(lucas, "Lucas", "Ta soirée idéale à Dax ?");
await faire(lucas, { action: "geste", id: P2, qui: "Lucas", geste: { type: "ecrire", texte: "De la musique en plein air." } });
const P3 = await ouvrir(camille, "Camille", "Que faire découvrir à un ami ?");
for (const [i, q] of ["Hugo", "Inès", "Paul", "Sarah", "Max", "Lina"].entries()) {
  const t = await tel();
  await faire(t, { action: "rejoindre", id: P3, qui: q });
  if (i === 5) await faire(t, { action: "geste", id: P3, qui: q, geste: { type: "ecrire", texte: "Une balade au bord de l'Adour." } });
}
// Un salon PRIVÉ de Léa : il ne doit apparaître nulle part pour Marie.
await ouvrir(lea, "Léa", "Anniversaire surprise de Karim", true);

// ═══ MARIE ═══
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: CALME ? "reduce" : "no-preference" });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("clikme-prenom", "Marie");
    localStorage.setItem("clikme-demo-v1", "0");
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"]));
  } catch {}
  document.addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}";
    document.head.appendChild(st);
  });
});
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("ERREUR", String(e).slice(0, 300)));
const nom = (n) => `${D}/${W}x${H}${CALME ? "-calme" : ""}-${n}.png`;
// On capture ce que l'écran montre une fois ses images chargées.
const chargees = () =>
  p.waitForFunction(() => [...document.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 0).every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
const capture = async (n) => {
  if (!D) return;
  await chargees();
  await p.screenshot({ path: nom(n) });
};
const texte = (sel) => p.locator(sel).first().innerText().catch(() => "");
const compte = (sel) => p.locator(sel).count();
const attendre = (ms) => p.waitForTimeout(ms);
const ensemble = async () => {
  await p.locator(".ap-onglets button", { hasText: /Ensemble/i }).first().click({ force: true });
  await attendre(1500);
};
const sceneActive = ".ea-scene[aria-hidden='false']";
// LA BULLE DU FANTÔME DU MENU ne recouvre jamais un bouton principal visible.
const bulleLibre = () =>
  p.evaluate(() => {
    const b = document.querySelector(".ap-mf-dit:not(.tait)")?.getBoundingClientRect();
    if (!b) return true;
    return ![...document.querySelectorAll("[data-garde-bulle]")].some((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= 0 || r.left >= innerWidth) return false;
      return r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
    });
  });

await p.goto(APP + "/ville/dax", { waitUntil: "networkidle", timeout: 300000 });
await attendre(2500);
await ensemble();

// 1. L'ACCUEIL
ok((await texte(".ea-accueil h1")).includes("Une découverte."), "accueil : « Une découverte. Une conversation. »");
ok(await bulleLibre(), "accueil : la bulle du menu ne recouvre pas « Découvrir les discussions »");
await capture("01-accueil");
await p.getByRole("button", { name: /Découvrir les discussions/ }).click();
await attendre(1800);

// 2. LE CARROUSEL DES SALONS PUBLICS
ok((await texte(".ea-compteur")).replace(/\s/g, "") === "1/3", `compteur « 1 / 3 » (${await texte(".ea-compteur")})`);
ok((await texte(".ea-boutons button.on")).includes("Salons publics"), "par défaut : les salons publics");
ok(!(await p.content()).includes("Anniversaire surprise"), "le salon privé de Léa n'apparaît nulle part");
const titre1 = await texte(`${sceneActive} h2`);
ok(titre1.length > 0, `scène 1 : « ${titre1} »`);
ok(await bulleLibre(), "salon : la bulle du menu ne recouvre pas le bouton");
ok((await compte(`${sceneActive} .al-libre`)) === 1 && (await compte(`${sceneActive} .al-coussin`)) === 1, "place libre : un coussin éclairé et sa pastille, sans cadre");
// LA SCÈNE VIT : clignements, vapeur ; rien ne bouge en mouvement réduit.
const anim = await p.evaluate((sel) => {
  const c = document.querySelector(`${sel} .al-cligne`);
  const v = document.querySelector(`${sel} .al-vapeur i`);
  return { cligne: c ? getComputedStyle(c).animationName : "absent", vapeur: v ? getComputedStyle(v).animationName : "absent" };
}, sceneActive);
ok(
  // (pendant le salut, la pose de base — et son clignement — s'effacent derrière la main levée)
  CALME ? !/^al-/.test(anim.cligne) && anim.vapeur !== "al-vapeur" : /^al-(cligne|salue-cache)$/.test(anim.cligne) && anim.vapeur === "al-vapeur",
  `animations ${CALME ? "coupées en mouvement réduit" : "actives"} (clignement : ${anim.cligne}, vapeur : ${anim.vapeur})`,
);
await capture("02-public-non-rejoint");
await p.evaluate(() => {
  const e = document.querySelector(".ea-piste");
  e.scrollTo({ left: e.clientWidth, behavior: "instant" });
});
await attendre(700);
ok((await texte(".ea-compteur")).replace(/\s/g, "") === "2/3", "glisser : « 2 / 3 »");
await p.locator(".ea-fleche.gauche").click();
await attendre(900);
ok((await texte(".ea-compteur")).replace(/\s/g, "") === "1/3", "flèche gauche : « 1 / 3 »");

// 3. LA LISTE DES SALONS PUBLICS
await p.getByRole("button", { name: /Salons publics/ }).click();
await attendre(500);
ok((await texte(".ea-feuille")).includes("Lire un salon ne t’inscrit pas."), "liste publique : « Lire un salon ne t'inscrit pas. »");
await capture("03-liste-publics");
await p.locator(".ea-ligne", { hasText: "Une chose à ajouter" }).click();
await attendre(800);
ok((await compte(".ea-feuille")) === 0, "toucher une ligne ferme la liste");
ok((await texte(`${sceneActive} h2`)).includes("Une chose à ajouter"), "… et affiche sa scène");
ok((await compte(`${sceneActive} .al-libre`)) === 1 && (await compte(`${sceneActive} .al-toi`)) === 0, "non rejoint : une place libre, pas de « Toi »");
ok((await texte(`${sceneActive} .ea-statut`)).includes("3 participants"), `non rejoint : 3 vrais participants (${await texte(`${sceneActive} .ea-statut`)})`);
ok((await texte(`${sceneActive} .ea-cta`)).includes("Voir la discussion"), "non rejoint : « Voir la discussion »");

// 4. FERMER LE PANNEAU SANS RIEN FAIRE
await p.locator(`${sceneActive} .al-libre`).click();
await attendre(500);
ok((await texte(".pp-panneau h2")).includes("Choisis ton fantôme"), "« Ta place ? » ouvre « Choisis ton fantôme »");
await p.locator(".pp-x").click();
await attendre(300);
ok((await compte(".pp")) === 0 && (await compte(`${sceneActive} .al-toi`)) === 0, "fermer : rien rejoint");

// 5. LE CHOIX, LA CONFIRMATION, L'ADHÉSION
await p.locator(`${sceneActive} .al-libre`).click();
await attendre(500);
await capture("04-choix-fantome");
await p.locator(".pp-fleche.d").click();
await attendre(600);
ok((await texte(".pp-compte")).startsWith("2"), `flèche : le look suivant (${await texte(".pp-nom")}, ${await texte(".pp-compte")})`);
await p.locator(".pp-fleche.g").click();
await attendre(600);
const choisi = await texte(".pp-nom");
ok(choisi === "Le Flâneur", "flèche gauche : retour au Flâneur");
await p.getByRole("button", { name: /Garder ce fantôme/ }).click();
await attendre(400);
ok((await texte(".pp-panneau h2")).includes("Ton fantôme est prêt"), "« Garder ce fantôme » → la confirmation, sans rejoindre");
ok((await texte(".pp-nom")) === choisi, "la confirmation montre le look gardé");
await capture("05-confirmation");
await p.locator(".pp-principal").click();
await attendre(CALME ? 900 : 380);
await capture("06-installation");
await attendre(1600);
ok((await compte(".pp")) === 0, "rejoint : le panneau se ferme");
ok((await compte(`${sceneActive} .al-toi`)) === 1 && (await compte(`${sceneActive} .al-libre`)) === 0, "rejoint : « Toi » à la place réservée");
ok((await texte(`${sceneActive} .ea-statut`)).includes("4 participants"), `rejoint : le nombre du serveur (${await texte(`${sceneActive} .ea-statut`)})`);
ok((await texte(`${sceneActive} .ea-cta`)).includes("Entrer dans la discussion"), "rejoint : « Entrer dans la discussion »");
ok((await texte(`${sceneActive} .al-plus`)) === "+1", `rejoint, quatre membres pour trois places : « ${await texte(`${sceneActive} .al-plus`)} »`);
ok((await texte(`${sceneActive} h2`)).includes("Une chose à ajouter"), "rejoint : la scène reste à sa place dans le carrousel");
await capture("07-installe");

// 6. RETOUR SANS RÉ-ANIMATION
await p.locator(".ap-onglets button", { hasText: /La ville/i }).first().click({ force: true });
await attendre(800);
await ensemble();
ok((await compte(".al-arrive")) === 0 && (await compte(`${sceneActive} .al-toi`)) === 1, "retour dans l'onglet : assis, sans rejouer l'installation");

// 7. L'ÉCHEC DU SERVEUR, PUIS « LIRE SANS REJOINDRE », PUIS DEPUIS LA CONVERSATION
await p.getByRole("button", { name: /Salons publics/ }).click();
await attendre(400);
await p.locator(".ea-ligne", { hasText: "Ta soirée idéale" }).click();
await attendre(900);
const titre2 = await texte(`${sceneActive} h2`);
await p.route("**" + ROUTE, async (r) => {
  const corps = r.request().postDataJSON?.() ?? {};
  if (r.request().method() === "POST" && corps.action === "rejoindre") return r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Le salon n’a pas répondu." }) });
  return r.continue();
});
await p.locator(`${sceneActive} .al-libre`).click();
await attendre(500);
ok((await texte(".pp-panneau h2")).includes("Ton fantôme est prêt"), "look déjà choisi : directement la confirmation");
await p.locator(".pp-principal").click();
await attendre(1200);
ok((await compte(".pp-erreur")) === 1 && (await texte(".pp-principal")).includes("Réessayer"), "échec : le message reste, « Réessayer »");
ok((await compte(`${sceneActive} .al-toi`)) === 0, "échec : je ne suis assis nulle part");
await capture("08-echec");
await p.getByRole("button", { name: /Lire sans rejoindre/ }).click();
await attendre(2500);
ok((await compte(".ps-lecture")) === 1, `« Lire sans rejoindre » : la conversation « ${titre2} » en lecture`);
ok((await compte(".ap-page-champ")) === 0, "en lecture : pas de champ d'écriture");
await capture("09-lecture");
await p.unroute("**" + ROUTE);
await p.getByRole("button", { name: /Rejoindre pour répondre/ }).click();
await attendre(500);
await p.locator(".pp-principal").click();
await attendre(CALME ? 1200 : 700);
await capture("10-rejoint-depuis-conversation");
ok((await texte(".pp-annonce")).includes("Tu as pris ta place"), "depuis la conversation : « Tu as pris ta place »");
await attendre(1500);
ok((await compte(".ap-page-champ")) === 1 && (await compte(".ps-lecture")) === 0, "depuis la conversation : écrire devient possible");

// 8. BEAUCOUP DE PARTICIPANTS : « +N »
await p.keyboard.press("Escape");
await p.goBack().catch(() => {});
await attendre(800);
await ensemble();
await p.getByRole("button", { name: /Salons publics/ }).click();
await attendre(400);
await p.locator(".ea-ligne", { hasText: "Que faire découvrir" }).click();
await attendre(900);
ok((await compte(`${sceneActive} .al-plus`)) === 0 && (await texte(`${sceneActive} .ea-statut`)).includes("7 participants"), "beaucoup de participants, non rejoint : quelques vrais fantômes, la place libre, le nombre réel");
await capture("11-beaucoup");

// 9. MON SALON PRIVÉ, OÙ JE SUIS SEUL
await p.request.post(APP + ROUTE, { data: { action: "ouvrir", ville: "dax", qui: "Marie", base: { sujet: "Déjeuner de vendredi", ou: "Le Bordeaux", quand: "Vendredi", prive: true } } });
await p.reload({ waitUntil: "networkidle" });
await attendre(2500);
await ensemble();
ok((await compte(".ea-accueil")) === 0, "avec des salons : plus d'accueil");
await p.getByRole("button", { name: /Mes salons/ }).click();
await attendre(500);
await capture("12-liste-mes-salons");
ok((await compte(".ea-ligne .ea-rejoint")) === 0, "« Mes salons » : pas de pastille « Déjà rejoint »");
await p.locator(".ea-ligne", { hasText: "Déjeuner de vendredi" }).click();
await attendre(900);
ok((await texte(`${sceneActive} .ea-statut`)).includes("Privé"), "mon salon privé : « Privé »");
ok((await compte(`${sceneActive} .al-toi`)) === 1 && (await compte(`${sceneActive} .al-libre`)) === 0, "mon salon : mon fantôme assis, aucune place « Ta place ? »");
ok((await compte(`${sceneActive} .ea-inviter`)) === 1, "seul : « Inviter quelqu'un »");
ok((await texte(`${sceneActive} .ea-phrase`)).includes("Tu as lancé cette discussion"), "phrase vraie : « Tu as lancé cette discussion »");
await capture("13-mon-salon-prive-seul");
await p.getByRole("button", { name: /Salons publics/ }).click();
await attendre(400);
ok((await compte(".ea-ligne .ea-rejoint")) >= 1, "« Salons publics » : mes salons publics marqués « Déjà rejoint »");
await capture("14-liste-publics-rejoints");
await p.keyboard.press("Escape");

// 10. « CHOISIR PLUS TARD », sur un téléphone neuf
const ctx2 = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true });
await ctx2.addInitScript(() => {
  try {
    localStorage.setItem("clikme-prenom", "Théo");
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"]));
  } catch {}
});
const q = await ctx2.newPage();
await q.goto(APP + "/ville/dax", { waitUntil: "networkidle" });
await q.waitForTimeout(2500);
await q.locator(".ap-onglets button", { hasText: /Ensemble/i }).first().click({ force: true });
await q.waitForTimeout(1200);
await q.getByRole("button", { name: /Découvrir les discussions/ }).click();
await q.waitForTimeout(1200);
await q.locator(`${sceneActive} .al-libre`).click();
await q.waitForTimeout(400);
await q.getByRole("button", { name: /Choisir plus tard/ }).click();
await q.waitForTimeout(300);
ok((await q.locator(".pp-panneau h2").first().innerText()).includes("Ton fantôme est prêt") && (await q.locator(".pp-nom").first().innerText()) === "Le Flâneur", "« Choisir plus tard » : le look par défaut, puis la confirmation");
ok((await q.locator(`${sceneActive} .al-toi`).count()) === 0, "… sans rejoindre");

// 11. UN SALON À MOI, LOOK JAMAIS CHOISI : « Entrer dans la discussion » demande d'abord le fantôme.
const ctx3 = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true });
await ctx3.addInitScript(() => {
  try {
    localStorage.setItem("clikme-prenom", "Zoé");
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"]));
  } catch {}
});
const z = await ctx3.newPage();
await z.goto(APP + "/ville/dax", { waitUntil: "networkidle" });
await z.request.post(APP + ROUTE, { data: { action: "ouvrir", ville: "dax", qui: "Zoé", base: { sujet: "Brunch dimanche", ou: "Dax", quand: "Dimanche", prive: true } } });
await z.reload({ waitUntil: "networkidle" });
await z.waitForTimeout(2500);
await z.locator(".ap-onglets button", { hasText: /Ensemble/i }).first().click({ force: true });
await z.waitForTimeout(1200);
ok((await z.locator(".ea-accueil").count()) === 1, "première ouverture d'Ensemble, même avec un salon : l'accueil");
await z.getByRole("button", { name: /Découvrir les discussions/ }).click();
await z.waitForTimeout(1000);
await z.getByRole("button", { name: /Mes salons/ }).click();
await z.waitForTimeout(400);
await z.locator(".ea-ligne", { hasText: "Brunch dimanche" }).click();
await z.waitForTimeout(800);
await z.locator(`${sceneActive} .ea-cta`).click();
await z.waitForTimeout(500);
ok((await z.locator(".pp-panneau h2").first().innerText().catch(() => "")).includes("Choisis ton fantôme"), "membre, look jamais choisi : « Entrer » ouvre d'abord le choix du fantôme");
await z.getByRole("button", { name: /Garder ce fantôme/ }).click();
await z.waitForTimeout(1500);
ok((await z.locator(".pp").count()) === 0 && (await z.locator(".ap-page-champ").count()) === 1, "… puis la conversation s'ouvre");

await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
