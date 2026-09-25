// 🎚️ CE QUI PART VRAIMENT VERS LE MODÈLE, SELON LE MÉTIER.
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « Taille de sortie : je n'ai demandé aucune taille précise. Masque : je n'en
// ai pas envoyé. Recadrage : je n'ai pas recadré ta photo avant l'envoi. »
//
// C'EST LA RÉPONSE DE CHATGPT À SA QUESTION, et elle contredit trois choix que
// nous avions faits un par un, chacun pour réparer un défaut réel. La coiffure
// tourne depuis en RÉGIME LÉGER : pas de masque, pas de cadre demandé, pas de
// rognage — et la recomposition du visage reste, parce qu'elle est la seule
// pièce qui garantisse au lieu de demander.
//
// CE RÉGLAGE EST EXACTEMENT LE GENRE DE CHOSE QUI REVIENT TOUTE SEULE. Il tient
// à trois endroits qui doivent s'accorder : le navigateur qui décide, le corps
// de la requête qui le transporte, la route qui pose ou ne pose pas `size`. Il
// suffit qu'`OPENAI_IMAGE_SIZE` traîne en production, ou qu'un repli
// réapparaisse dans la route, pour qu'on redemande un cadre sans que rien ne le
// dise — et on chercherait ailleurs pendant un tour de plus.
//
// ═══ CE QU'ON MESURE, ET CE QU'ON NE PEUT PAS MESURER ══════════════════════
//
// ON NE PEUT PAS JUGER UN RENDU ICI : il n'y a pas de clé d'image dans ce
// conteneur, et aucune garde ne sait regarder si une coupe est la bonne. Ce qui
// se vérifie, c'est CE QU'ON DEMANDE : on intercepte l'appel et on lit le corps.
//
// ET ON VÉRIFIE LES DEUX CÔTÉS. Que la coiffure soit passée en léger ne vaut
// que si les autres métiers n'y sont PAS passés : le lunetier ouvre une bande
// sur les yeux, et sans son masque la monture se pose n'importe où.
import pw from "/opt/node22/lib/node_modules/playwright/index.js";

const PORT = process.env.PORT_CLIKME || "3821";
let echecs = 0;
const dire = (bon, quoi) => {
  if (!bon) echecs++;
  console.log(`  ${bon ? "ok  " : "ÉCHEC"} ${quoi}`);
};

const nav = await pw.chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

/** Ouvre un essai, intercepte l'appel, et rend le corps de la requête. */
async function ceQuiPart(carte) {
  const ctx = await nav.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "fr-FR",
  });
  // L'HEURE EST FIXÉE, ET CE N'EST PAS UN CONFORT. Ce qu'un commerce propose
  // dépend du moment en cours — voir `momentEnCours` — donc une garde lancée à
  // trois heures du matin ne trouve aucun essai à ouvrir et signale une panne
  // qui n'existe pas. Un mardi après-midi, tout le monde est ouvert.
  await ctx.clock.setFixedTime(new Date(2026, 8, 2, 14, 15, 0));
  // LES DEUX CLÉS QUI ÉCARTENT L'ÉCRAN D'ACCUEIL. Sans les deux, on clique
  // dans une feuille de bienvenue et aucun essai ne part.
  await ctx.addInitScript(() => {
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"]));
    localStorage.setItem("clikme-demo-v1", "0");
  });
  const p = await ctx.newPage();
  let vu = null;
  await p.route("**/api/direct/essayer", async (route) => {
    const c = JSON.parse(route.request().postData() || "{}");
    const mesurer = (src) =>
      p
        .evaluate(async (s) => {
          const i = new Image();
          await new Promise((ok, non) => {
            i.onload = ok;
            i.onerror = non;
            i.src = s;
          });
          return { l: i.width, h: i.height };
        }, src)
        .catch(() => null);
    vu = {
      taille: c.taille,
      brut: c.brut === true,
      consigne: c.consigne,
      masque: !!c.masque,
      photo: await mesurer(c.photo),
    };
    // ON NE LAISSE PAS L'APPEL PARTIR : il n'y a pas de clé ici, et on a déjà
    // ce qu'on était venu chercher.
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ erreur: "pas de clé ici" }),
    });
  });
  await p
    .goto(`http://127.0.0.1:${PORT}/autour-de-moi?carte=${carte}&essai=1&exemple=1`, {
      waitUntil: "networkidle",
    })
    .catch(() => {});
  await p.waitForTimeout(2500);
  const bouton = p.locator(".mu-pieces button:not([disabled])").first();
  if (await bouton.count()) await bouton.click().catch(() => {});
  await p.waitForTimeout(12000);
  await ctx.close();
  return vu;
}

console.log("══ la coiffure part en régime léger ══");
{
  const c = await ceQuiPart("coiffeur");
  if (!c) {
    echecs++;
    console.log("  ÉCHEC aucun essai n'est parti : la garde n'a rien pu mesurer");
  } else {
    // « Je n'ai demandé aucune taille précise. »
    dire(c.taille === "auto", "on ne demande aucun cadre de sortie");
    // « Je n'en ai pas envoyé. »
    dire(!c.masque, "on n'envoie pas de masque");
    // « Je n'ai pas recadré ta photo avant l'envoi. » ON NE PEUT PAS COMPARER
    // AU CADRE D'ORIGINE D'ICI — mais un cadre de modèle, lui, se reconnaît :
    // les trois seuls que `gpt-image-1` rende sont 1024×1024, 1536×1024 et
    // 1024×1536. En voir un, c'est qu'on a rogné.
    const rogne =
      c.photo && [
        [1024, 1024],
        [1536, 1024],
        [1024, 1536],
      ].some(([l, h]) => c.photo.l === l && c.photo.h === h);
    dire(!rogne, `la photo garde son propre cadre (${c.photo?.l}×${c.photo?.h})`);
    dire(!c.brut, "et la recomposition du visage reste demandée");
    /* LA PHRASE EST CELLE QU'IL EST ALLÉ CHERCHER — voir `consigneCalquee`.
       C'est la seule de ce dossier dont on ait la preuve qu'elle rend le bon
       résultat, et elle se remettrait en « longue » sans qu'on le voie. */
    dire(c.consigne === "calquee", `la consigne calquée sur ChatGPT part bien (${c.consigne})`);
  }
}

console.log("\n══ le lunetier garde ses verrous ══");
{
  const c = await ceQuiPart("lunetier-pietonne");
  if (!c) {
    echecs++;
    console.log("  ÉCHEC aucun essai n'est parti : la garde n'a rien pu mesurer");
  } else {
    // SON MASQUE OUVRE LA BANDE DES YEUX ET FERME LE RESTE. L'enlever ne
    // déplacerait pas un défaut : il rendrait une autre paire de lunettes, ce
    // qu'il a déjà signalé une fois.
    dire(c.masque, "le masque part toujours");
    dire(/^\d+x\d+$/.test(c.taille || ""), `et on demande un cadre précis (${c.taille})`);
    dire(c.consigne === "longue", `et il garde la consigne d'atelier (${c.consigne})`);
  }
}

await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
