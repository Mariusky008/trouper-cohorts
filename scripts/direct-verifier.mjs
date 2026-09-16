// LES VÉRIFICATIONS DU DIRECT — ce qu'on relit avant de pousser.
//
// POURQUOI CE FICHIER EST DANS LE DÉPÔT. Les suites qui ont trouvé la moitié
// des défauts de cette semaine — le compte à rebours qui expirait au premier
// rendu, la bande translucide au-dessus de la photo, le raccourci qui passait
// sur deux lignes, « de Le Pétrin », la promesse qui retombait sur le défaut
// chez la prothésiste ongulaire — vivaient dans un dossier temporaire. Le
// conteneur l'a vidé, et tout était perdu. Ce qui sert à vérifier le produit
// appartient au produit.
//
// USAGE : node scripts/direct-verifier.mjs [port]
// Il faut un serveur déjà lancé (voir scripts/direct-build.sh puis
// `npx next start -p <port>`).
import { readFileSync } from "node:fs";
import pw from "/opt/node22/lib/node_modules/playwright/index.js";

const PORT = process.argv[2] ?? "3000";
const BASE = `http://127.0.0.1:${PORT}`;

const nav = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let echecs = 0;
const erreurs = [];
const dire = (ok, t) => { if (!ok) echecs++; console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`); };

/**
 * ═══ ON ENTRE DANS L'ESSAI COMME UN UTILISATEUR : PAR UNE PHOTO ════════════
 *
 * « Voir avec la photo d'exemple » a été retiré de l'écran — c'était un geste
 * de démonstration posé au milieu de deux gestes réels. Les gardes s'en
 * servaient comme d'une porte de service.
 *
 * ELLES DEPOSENT MAINTENANT UN FICHIER DANS LE CHAMP DE LA PHOTOTHEQUE, qui
 * est le second geste de l'écran et un vrai chemin d'utilisateur : « une main à
 * plat se photographie souvent mieux à deux mains, donc avant ». On mesure donc
 * ce que les gens font, au lieu de ce que la démonstration faisait.
 *
 * LE CHAMP EST CACHE, ET C'EST SANS IMPORTANCE : `setInputFiles` n'a pas besoin
 * de le voir, exactement comme l'appareil photo du téléphone n'a pas besoin que
 * le champ soit à l'écran pour y déposer son cliché.
 */
const deposerUnePhoto = async (page, dans = "") => {
  // LE PREMIER CHAMP DU DOCUMENT EST CELUI DU DEPOT, PAS CELUI DE L'ESSAI :
  // deux champs portent la meme classe. On prend le dernier, qui est celui de
  // l'essai — il est rendu apres le formulaire du mur.
  const champs = await page.$$(`${dans} input.mu-fichier`);
  const champ = champs[champs.length - 1];
  if (!champ) return false;
  await champ.setInputFiles("public/direct/avis-ongles.jpg");
  await page.waitForTimeout(900);
  // ET ON CONFIRME LE CADRAGE, comme le ferait quelqu'un. Le depot d'une photo
  // ramene TOUJOURS au viseur — « la photo revient AVEC le repere par-dessus :
  // c'est le seul moment ou l'on peut voir si sa main tombe la ou le calcul
  // l'attend ». Sauter cette confirmation rendrait le gabarit decoratif, et la
  // garde ne mesurerait plus le chemin que suivent les gens.
  const suite = await page.$(`${dans} .mu-cta.plein`);
  if (suite) {
    await suite.click();
    await page.waitForTimeout(700);
  }
  return true;
};


// ═══ LA CONSIGNE ENVOYÉE AU MODÈLE — LA MOITIÉ DU RÉSULTAT ═════════════════
//
// CE QU'ELLE PROTÈGE, ET C'EST LE DÉFAUT LE PLUS GRAVE QUE L'ESSAI PUISSE
// AVOIR : « le résultat que j'ai obtenu pour une coupe de coiffure, ce n'est
// pas exactement ma tête ni les mêmes lunettes, donc assez déçu ».
//
// SI CE N'EST PAS MOI, ÇA NE ME DIT RIEN SUR MOI. Une coupe magnifique sur le
// visage d'un autre, c'est exactement ce qu'un catalogue faisait déjà — tout
// l'essai s'effondre sur ce seul point.
//
// ON MESURE LE TEXTE, ET C'EST POSSIBLE PARCE QU'IL EST SORTI DE LA ROUTE. Une
// route ne se teste qu'avec un serveur, une clé et un faux fournisseur ; une
// fonction pure se lit en trois lignes. C'est précisément pour ça qu'elle a été
// déplacée dans `lib/direct/consigne-essai.ts` : le seul morceau du produit
// dont dépendait la fidélité du rendu n'était surveillé par rien.
{
  console.log("\n══ ce qu'on demande vraiment au modèle d'image ══");
  const { consigne } = await import("../src/lib/direct/consigne-essai.ts").catch(() => ({}));
  if (!consigne) {
    // ON NE PASSE PAS EN SILENCE. Node ne lit le TypeScript qu'à partir d'une
    // certaine version ; une garde qui se désactive sans le dire est pire que
    // pas de garde du tout.
    console.log(
      "  ····  non mesurée : ce Node ne sait pas importer un fichier .ts\n" +
        "        directement. Relancez avec Node 22.6+ ou --experimental-strip-types.",
    );
  } else {
    const t = consigne(
      "votre tête",
      ["Les lunettes exactement telles qu'elles sont."],
      "uniquement les cheveux",
    );
    dire(/votre tête/.test(t), "elle nomme la partie du corps qu'on a photographiée");
    // ═══ ON NE MODIFIE PAS « VOTRE TÊTE », ON MODIFIE LES CHEVEUX ═══════════
    //
    // DÉFAUT MESURÉ SUR UN VRAI TÉLÉPHONE : « il m'a changé le visage ». La
    // consigne disait « reproduis ce que montre la deuxième image sur VOTRE
    // TÊTE » — et la deuxième image montre une AUTRE PERSONNE en entier. La
    // phrase se lit « donne-lui cette tête-là », et c'est ce qui a été rendu.
    dire(
      /modifier uniquement les cheveux/.test(t),
      "et elle dit ce qu'on modifie, aussi étroitement que possible",
    );
    // ET ELLE DIT CE QU'EST LA SECONDE IMAGE : quelqu'un d'autre, dont rien ne
    // doit passer. C'est la clause qui manquait entièrement.
    dire(
      /RIEN de la personne de l'image 2 ne doit passer/.test(t),
      "elle dit que la référence montre quelqu'un d'autre, et que rien ne doit passer",
    );
    // ═══ NOMMER UN OBJET, C'EST LE FAIRE APPARAÎTRE ═════════════════════════
    //
    // LA FAUTE LA PLUS CONTRE-INTUITIVE DE TOUT CE TRAVAIL : la phrase censée
    // protéger les lunettes de quelqu'un qui en porte en a fait apparaître sur
    // une photo qui n'en montrait aucune. Un modèle d'image qui reçoit la
    // description détaillée d'un objet le dessine — que l'objet soit là ou non.
    dire(
      /NE PORTE PAS de lunettes, alors le résultat\s*\n?\s*n'en porte AUCUNE/.test(t),
      "et elle interdit d'ajouter des lunettes à qui n'en porte pas",
    );
    // CHAQUE TRAIT EST NOMMÉ, UN PAR UN. « Ne modifie rien d'autre » est une
    // phrase générale, et un modèle d'image l'applique généreusement.
    const traits = ["nez", "bouche", "yeux", "mâchoire", "rides", "barbe", "carnation"];
    const manque = traits.filter((m) => !new RegExp(m, "i").test(t));
    dire(!manque.length, `et le visage trait pour trait${manque.length ? " — manque : " + manque.join(", ") : ""}`);
    // ET ON LUI INTERDIT D'EMBELLIR, parce qu'embellir est son penchant naturel
    // et qu'il le prend pour un service rendu.
    dire(/rajeunis pas/i.test(t) && /lisse pas/i.test(t), "on lui interdit de rajeunir et de lisser");
    dire(
      /ne remplace aucun accessoire/i.test(t),
      "et de remplacer un accessoire porté par un autre « qui irait mieux »",
    );
    // LA LISTE DU MÉTIER ARRIVE JUSQU'AU MODÈLE. Sans ça, `garder` serait une
    // donnée qu'on écrit et que personne ne lit — le pire genre de champ.
    dire(
      t.includes("Les lunettes exactement telles qu'elles sont."),
      "ce que le métier demande de préserver y figure mot pour mot",
    );
  }

  // ET CHAQUE MÉTIER QUI ESSAIE SUR LE CORPS A SA LISTE. Elle ne peut pas être
  // écrite une fois pour toutes : chez le coiffeur les lunettes restent, chez
  // le lunetier elles sont précisément ce qui change.
  //
  // ON LIT LE FICHIER PLUTÔT QUE DE L'IMPORTER, ET C'EST DÉLIBÉRÉ.
  // `fantomes.ts` passe par l'alias `@/`, que Node ne sait pas résoudre hors
  // du bâtisseur — un `import()` échoue avec « Cannot find package '@/lib' ».
  // Monter une résolution d'alias pour compter des listes serait beaucoup de
  // machinerie pour une question qui se lit dans le texte.
  const source = readFileSync(new URL("../src/lib/direct/fantomes.ts", import.meta.url), "utf8");
  const murs = [...source.matchAll(/\n  \{\n    cle: "([\w-]+)"/g)].map((m) => m[1]);
  // CHAQUE MUR D'ESSAI PORTE SA LISTE. Un `essai:` sans `garder:` est un métier
  // dont on n'a pas dit ce qu'il ne faut pas toucher — donc un métier où le
  // modèle décidera tout seul, ce qui est exactement le défaut d'origine.
  const blocs = source.split(/\n  \{\n    cle: "/).slice(1);
  const sans = blocs
    .filter((b) => /\n    essai: \{/.test(b) && !/\n      garder: \[/.test(b))
    .map((b) => b.slice(0, b.indexOf('"')));
  dire(
    !sans.length,
    `chaque mur d'essai dit ce qu'il ne faut pas toucher${sans.length ? " — sauf : " + sans.join(", ") : ""}`,
  );
  // CHAQUE MUR D'ESSAI DIT AUSSI CE QU'IL MODIFIE. Sans ce mot, la consigne
  // retombe sur la partie du corps photographiée — « votre tête » — et autorise
  // le modèle à refaire le visage.
  const sansChange = blocs
    .filter((b) => /\n    essai: \{/.test(b) && !/\n      change: "/.test(b))
    .map((b) => b.slice(0, b.indexOf('"')));
  dire(
    !sansChange.length,
    `chaque mur d'essai dit ce qu'il modifie${sansChange.length ? " — sauf : " + sansChange.join(", ") : ""}`,
  );

  // ═══ AUCUNE LISTE NE DÉCRIT UN ACCESSOIRE COMME S'IL ÉTAIT LÀ ════════════
  //
  // C'EST LA GARDE QUI AURAIT ÉVITÉ LA PAIRE DE LUNETTES INVENTÉE. La liste du
  // coiffeur disait « Les lunettes exactement telles qu'elles sont : même
  // forme, même monture, même position sur le nez » — écrite pour PROTÉGER les
  // lunettes de quelqu'un qui en porte, mais servie avec une photo qui n'en
  // montrait aucune, elle décrivait un objet absent. Le modèle l'a dessiné.
  //
  // LA RÈGLE : toute mention d'accessoire doit être CONDITIONNELLE. On cherche
  // donc les lignes qui nomment un objet portable sans dire « si ».
  const OBJETS = /lunettes?|bijou|bague|bracelet|montre|chapeau|écharpe|collier|tatouages?|maquillage/i;
  const CONDITION = /\bsi\b|n'en porte|ne porte pas|ne sont pas concern|RETIRE/i;
  const affirmatives = [];
  for (const b of blocs) {
    const cle = b.slice(0, b.indexOf('"'));
    const liste = /\n      garder: \[([\s\S]*?)\n      \],/.exec(b)?.[1] ?? "";
    for (const l of liste.split("\n")) {
      const txt = l.trim().replace(/^"|",$/g, "");
      if (txt && OBJETS.test(txt) && !CONDITION.test(txt)) affirmatives.push(`${cle} : « ${txt.slice(0, 60)}… »`);
    }
  }
  dire(
    !affirmatives.length,
    `aucune liste ne décrit un accessoire comme s'il était là${affirmatives.length ? "\n         " + affirmatives.join("\n         ") : ""}`,
  );

  dire(murs.includes("lunettes"), `le lunetier a son mur (${murs.length} murs en tout)`);
  // ET SA LISTE DIT L'INVERSE DE CELLE DU COIFFEUR. C'est la démonstration que
  // ces listes ne pouvaient pas être écrites une fois pour toutes dans la route.
  const lun = blocs.find((b) => b.startsWith("lunettes"));
  dire(
    !!lun && /RETIRE-LES/.test(lun),
    "et il demande de RETIRER les lunettes portées avant d'en poser d'autres",
  );
  const coif = blocs.find((b) => b.startsWith("coiffeur"));
  dire(
    !!coif && /si l'image 1 n'en montre pas, le résultat n'en porte aucune/i.test(coif),
    "là où le coiffeur dit de n'en ajouter aucune à qui n'en porte pas",
  );
}

/**
 * PASSER À LA CARTE SUIVANTE — et renoncer proprement quand il n'y en a plus.
 *
 * LE BOUTON SE DÉSACTIVE EN FIN DE PAQUET, et lire son état avant de cliquer ne
 * suffit pas : entre la lecture et le clic, un rendu peut l'éteindre. Le
 * vérifieur s'acharnait alors trente secondes sur un bouton mort et expirait —
 * ce qui est pire qu'un échec, parce qu'un expiré ne dit pas ce qui ne va pas.
 * On tente le clic avec un délai court, et un refus veut dire « paquet fini ».
 */
/**
 * DESCENDRE SUR LA FICHE DU COMMERCE.
 *
 * IL Y AVAIT UN SEUL BOUTON, `.ap-vers-bas`, et il portait « Voir tout » sous le
 * planning pose sur l'annonce. Ce bloc a maigri — « il prend beaucoup de place
 * et pourrait faire passer le client a cote du message principal » — et le
 * geste est passe dans la ligne d'identite.
 *
 * ET « INFOS BOUTIQUE » N'EST PLUS UNE DESCENTE. Depuis que la fiche du
 * commerce a quitte le pli, cette porte-la SORT vers /autour-de-moi/boutique :
 * la viser ici ferait quitter la page au verifieur au lieu de descendre dedans.
 * La seule descente qui reste est « Voir le planning », c'est-a-dire le seul
 * bouton encore present dans `.ap-ident-d` — les liens en sont exclus par la
 * balise. Sur les cartes sans journee, `.ap-vers-bas` prend le relais.
 */
const versLaFiche = async (page) => {
  const porte = ".ap-dessus .ap-ident-d button, .ap-dessus .ap-vers-bas";
  await page.click(porte, { force: true, timeout: 4000 });
};

const avancer = async (page) => {
  try {
    // LA MARGE COUVRE LE BOND LE PLUS LONG. Le bond dore du fantome dure une
    // seconde et demie ; a 1500 ms le delai etait exactement sa duree, donc une
    // course. On ne mesure pas la vitesse du bouton ici, on traverse le paquet.
    await page.click(".ap-suiv", { timeout: 4000 });
    await page.waitForTimeout(320);
    return true;
  } catch {
    return false;
  }
};

/**
 * OUVRIR L'APPLICATION, éventuellement À UNE HEURE FIXÉE.
 *
 * POURQUOI L'HEURE COMPTE MAINTENANT. Le conseil du commerçant est porté par un
 * MOMENT, pas par le commerce : « la côte, attendez jeudi » n'a de sens que le
 * jour où la côte est moins belle. La carte qui l'affiche n'est donc dans le
 * paquet qu'à certaines heures — vérifié : présente à 9 h, 11 h et 16 h, absente
 * à 13 h et 19 h. Un test qui dépend de l'heure du conteneur passe le matin et
 * échoue l'après-midi, ce qui est la pire espèce de test : on finit par ne plus
 * le croire. Les sections qui visent un contenu précis fixent donc l'horloge.
 */
const ouvrir = async (url = "/autour-de-moi", heure) => {
  const ctx = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  // ─── ON N'EST PLUS « LA PREMIÈRE FOIS » ───
  // Depuis la carte d'arrivée, un navigateur neuf ouvre sur elle. C'est le bon
  // comportement pour un habitant, et un faux départ pour une garde qui vérifie
  // autre chose : on note qu'elle a déjà été vue, comme après un premier
  // passage. Sa propre garde vit dans la suite « accueil ».
  await ctx.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  if (heure != null) {
    await ctx.clock.setFixedTime(
      new Date(2026, 8, 2, Math.floor(heure), Math.round((heure % 1) * 60), 0),
    );
  }
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(`${m.text()} [${p.url()}]`); });
  // UNE ERREUR SANS ADRESSE NE SE CORRIGE PAS. « Failed to load resource : 500 »
  // ne dit ni sur quelle page ni pour quelle ressource, et le message est
  // collecte pour tout le parcours : il peut venir de n'importe laquelle des
  // trente pages ouvertes. Une ligne rouge qu'on ne sait pas reproduire ne se
  // corrige pas, elle s'ignore — la pire fin possible pour une garde.
  p.on("response", (r) => {
    if (r.status() >= 500) erreurs.push(`HTTP ${r.status()} sur ${r.url()} [depuis ${p.url()}]`);
  });
  await p.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await p.waitForSelector(".ap-fav2");
  await p.waitForTimeout(4600);
  return { ctx, p };
};

// ═══ 1 · LA PASTILLE DU MENU NE RÉPÈTE PLUS LA CARTE ═══
//
// Elle disait « 🍲 Les deux plats du jour » au-dessus d'une carte qui affiche
// déjà « MENU DU JOUR · LASAGNES MAISON · 11 € ». Ce que la carte ne dit nulle
// part, c'est jusqu'à quand on peut y aller.
console.log("\n══ la pastille de la carte ══");
// L'HORLOGE EST FIXÉE ICI AUSSI, ET ELLE MANQUAIT. Cette section lit la carte
// de tête, qui dépend de l'heure : le conteneur a tourné à 18 h 46 et la tête
// du paquet était une offre d'emploi, dont la pastille dit « il y a une
// semaine » et jamais une heure. La garde échouait sur une carte parfaitement
// correcte — c'est-à-dire qu'elle mesurait l'heure du conteneur.
let { ctx, p } = await ouvrir("/autour-de-moi", 12.5);
const face = await p.evaluate(() => ({
  etiquette: document.querySelector(".ap-dessus .cd-nature")?.textContent.trim() ?? "",
  quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
  // ELLE VIT À DEUX ENDROITS SELON LA FACE : en haut à gauche sur la fiche,
  // et dans le bloc central sur l'annonce — « une échéance lue à l'autre bout
  // de l'écran du prix ne se rattache à rien ». On prend celle qui est là.
  pastille: (document.querySelector(".ap-dessus .cd-quand")
    ?? document.querySelector(".ap-dessus .cd-reste"))?.textContent
    .replace(/\s+/g, " ").trim() ?? "",
}));
console.log(`  ${face.etiquette} · ${face.quoi} · pastille « ${face.pastille} »`);
// ELLE N'EST PLUS SUR TOUTES LES CARTES, ET C'EST LA CORRECTION : « ce
// rectangle prend de la place sur chaque annonce et ne sert à rien ». Elle ne
// survit que devant une vraie borne horaire — voir la section 5.
dire(!face.pastille || /\d/.test(face.pastille),
  `pas de rectangle, ou une vraie heure (${face.pastille || "aucun"})`);
// LE TEST QUI COMPTE : elle ne redit pas ce qui est déjà écrit en gros.
const motsDuPlat = face.quoi.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
dire(!motsDuPlat.some((w) => face.pastille.toLowerCase().includes(w)),
  "et elle ne répète pas le plat affiché en grand");

// ET SUR UNE CARTE À MENU — le cas exact du reproche : « 🍲 Les deux plats du
// jour » au-dessus de « MENU DU JOUR · LASAGNES MAISON · 11 € ».
{
  // L'HEURE EST FIXEE : ce restaurant sert de 11 h a 15 h puis de 19 h a 22 h.
  // Lu a l'heure du conteneur, la garde tombait sur un paquet ou il n'est plus.
  const { ctx: c2, p: p2 } = await ouvrir("/autour-de-moi?chez=centre", 12.5);
  await p2.click(".ap-arr-ville");
  await p2.waitForTimeout(1200);
  const menu = await p2.evaluate(() => ({
    nature: document.querySelector(".ap-dessus .cd-nature")?.textContent.trim() ?? "",
    quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
    pastille: (document.querySelector(".ap-dessus .cd-quand")
      ?? document.querySelector(".ap-dessus .cd-reste"))?.textContent
      .replace(/\s+/g, " ").trim() ?? "",
  }));
  console.log(`  carte à menu : ${menu.nature} · ${menu.quoi} · « ${menu.pastille} »`);
  dire(/\d/.test(menu.pastille),
    `sur une carte à menu, la pastille porte l'heure (${menu.pastille})`);
  dire(!/plats du jour/i.test(menu.pastille),
    "et ne redit plus « les deux plats du jour »");
  await c2.close();
}

// ═══ 2 · LE CŒUR GARDE UNE ANNONCE, ET ON VOIT OÙ ELLE VA ═══
console.log("\n══ mettre une annonce de côté ══");
// ═══ CE QUE CETTE SECTION A MESURÉ, ET CE QU'ELLE MESURE MAINTENANT ═══
//
// ELLE A D'ABORD COMPTÉ UN ENCART. « Je retirerais complètement le gros encart
// "suivre cette terrasse au soleil" : il casse le parcours principal. » Elle
// vérifiait le français de cet encart — « suivre CETTE terrasse » et non
// « suivre UNE terrasse ». L'objet a disparu, et la garde a suivi le geste : le
// nom du commerce se retrouvait dans l'écho qui répondait après l'appui.
//
// ELLE NE MESURE PLUS UNE PHRASE, PARCE QU'IL N'Y EN A PLUS. Le cœur ne suit
// plus un commerce : il garde l'ANNONCE. « Si je mets trois annonces menu en
// favori, je peux revenir dessus et faire un choix final. » Une phrase qui dit
// « ajouté » puis s'efface apprend moins qu'une poche qu'on voit se remplir, et
// c'est cette poche qui répond désormais. Aucune phrase à conjuguer, donc
// aucune faute possible : la garde de langue n'a plus d'objet et elle part.
//
// ELLE VÉRIFIE D'ABORD LES ABSENCES : une règle qu'on retourne sans le dire est
// pire qu'une règle absente.
dire(!(await p.$(".ap-suivre-face")),
  "aucun encart ne demande de s'abonner au milieu de l'annonce");
dire(!(await p.$(".ap-haut .ap-jai")),
  "et aucune cloche sur l'annonce : elle est descendue sur l'onglet Profil");
const poche = () => p.$eval(".ap-poche", (e) =>
  Number(e.textContent.replace(/[^0-9]/g, "")) || 0).catch(() => -1);
dire((await poche()) === 0, "la poche est là, vide, avant qu'on ait rien gardé");
// ─── LE NOM SE LIT DANS LA FICHE DU COMMERCE, PAS SOUS LE PRIX ───
// La maquette a descendu l'enseigne dans le rectangle, avec son logo et sa note
// Google : `.cd-chez` n'existe plus sur cette face, et le lire renvoyait une
// chaîne vide — donc la même carte à chaque tour, et un cœur qui s'allumait
// puis s'éteignait. La poche comptait alors moins que ce qu'on croyait y mettre.
const nomDuSommet = () => p.$eval(".ap-dessus .ap-ident-l b", (e) =>
  e.textContent.trim()).catch(() => "");
const gardes = [];
for (let k = 0; k < 3; k++) {
  const nom = await nomDuSommet();
  if (!nom) break;
  // ON VISE LE GESTE, PAS SA FORME — et c'est la troisieme fois. `.ap-agir`
  // dessine un bouton pleine largeur ; `.ap-favori` NOMME le geste de garder,
  // quel que soit son habit. Depuis que l'annonce d'un restaurant porte un rail
  // de pastilles, le favori n'est plus un `.ap-agir` : la garde cliquait dans
  // le vide et la poche restait a zero. Voir le grand commentaire au-dessus de
  // `ap-parler` dans l'ecran.
  await p.click(".ap-favori").catch(() => {});
  await p.waitForTimeout(420);
  gardes.push(nom);
  if (!(await avancer(p))) break;
  // ON ATTEND QUE LA CARTE AIT VRAIMENT CHANGÉ. Le vol dure plus longtemps que
  // le délai d'`avancer` : sans cette attente, le tour suivant retrouve la MÊME
  // carte et le second appui sur le cœur la RETIRE des favoris. La garde
  // mesurait alors sa propre impatience.
  for (let t = 0; t < 20 && (await nomDuSommet()) === nom; t++) {
    await p.waitForTimeout(120);
  }
}
const compte = await poche();
console.log(`  gardées : ${gardes.join(" · ")} → la poche affiche ${compte}`);
dire(compte === gardes.length,
  `la poche compte ce qu'on y a mis (${compte} pour ${gardes.length})`);
// ET ON LES RETROUVE : c'est la seule raison pour laquelle on appuie.
await p.click(".ap-poche");
await p.waitForTimeout(700);
const titre = await p.$eval(".ap-page-t b", (e) => e.textContent.trim()).catch(() => "");
const listees = await p.$$eval(".ap-liste .ap-ligne b", (es) =>
  es.map((e) => e.textContent.trim()));
console.log(`  « ${titre} » → ${listees.join(" · ")}`);
dire(/favoris/i.test(titre), "la poche ouvre une page qui porte leur nom");
dire(gardes.every((n) => listees.includes(n)),
  "et les trois annonces mises de côté y sont, pour trancher");
await ctx.close();

// ═══ 3 · LE TOUR DE RÔLE NE SE JUSTIFIE PLUS APRÈS COUP ═══
//
// LA RÈGLE SE LIT AVANT, ET RIEN NE SE LIT APRÈS. On appuie sur « Je passe » :
// le geste est son propre accusé de réception, et la bande qui le répétait
// était une fenêtre à fermer pour une décision déjà prise — « une pop-up qui
// ne sert à rien ». Ce qui doit rester vrai maintenant, c'est qu'il ne reste
// RIEN : ni bandeau, ni détail, ni bouton à refermer.
console.log("\n══ je passe ══");
({ ctx, p } = await ouvrir("/autour-de-moi", 12.5));
// ─── ELLE N'ACCUEILLE PLUS PERSONNE ───
//
// « Peut-on la voir arriver plutôt au 2ᵉ ou 3ᵉ balayage et pas directement dès
// la première annonce, pour que ça ne soit pas trop dense tout de suite au
// démarrage ? » Une interruption posée avant qu'on ait rien vu n'interrompt
// rien : elle devient le premier écran, et c'est un compte à rebours qui
// accueille les gens. Elle attend donc deux annonces.
dire(!(await p.$(".ap-tour")), "« c'est à vous » n'accueille personne à l'ouverture");
for (let k = 0; k < 2; k++) {
  await p.click(".ap-suiv");
  await p.waitForTimeout(700);
}
await p.waitForSelector(".ap-tour", { timeout: 8000 });
// ET SES CINQ MINUTES PARTENT DE LÀ. Armées à l'ouverture, elles se seraient
// écoulées derrière une bande que personne ne voyait — l'offre aurait pu
// expirer avant d'être montrée. C'est le seul compte à rebours du produit.
const dessus = await p.$eval(".ap-tour-h b", (e) => e.textContent.trim());
console.log(`  quand elle arrive, il lui reste : ${dessus}`);
const [mn, sc] = dessus.split(":").map(Number);
dire(mn * 60 + sc > 4 * 60 + 40, "ses cinq minutes commencent quand on la VOIT");
const avant = await p.$eval(".ap-tour-f", (e) => e.textContent.replace(/\s+/g, " ").trim());
console.log(`  avant de décider : « ${avant} »`);
dire(/après vous/.test(avant), "la règle se lit AVANT de décider, sur l'offre");
await p.click(".ap-tour-b button:not(.fort)");
await p.waitForTimeout(700);
const apres = await p.evaluate(() => ({
  bande: !!document.querySelector(".ap-tour"),
  reste: document.querySelector(".ap-tour")?.textContent.replace(/\s+/g, " ").trim() ?? "",
}));
console.log(`  après : « ${apres.reste || "(plus rien)"} »`);
dire(!apres.bande, "après « Je passe », la bande a disparu sans rien dire");
await ctx.close();

// ═══ 4 · LA VOIX DU COMMERÇANT ═══
//
// « Il manque toujours la dimension humaine. » Trois choses doivent être
// vraies, et la troisième est celle qui décide si la fonction est acceptable :
//
//   1. LE CONSEIL EST UN JUGEMENT, pas une description. C'est ce qu'aucune
//      plateforme ne peut copier, parce qu'il n'appartient qu'à celui qui le
//      porte.
//   2. IL PREND LA PLACE DU DÉTAIL, il ne s'ajoute pas — l'annonce est déjà
//      chargée, et on ne gagne pas un pixel.
//   3. ET SANS VOIX, LA CARTE EST EXACTEMENT CELLE D'AVANT. Une fonction qui
//      punit ceux qui ne s'en servent pas se fait détester par les trois
//      quarts de la ville.
// ═══ ON N'ANNONCE PAS UN NOMBRE QU'IL NE PEUT PAS TENIR ═══
//
// « Il est écrit souvent "il reste 4 tables", or nous ne pouvons pas savoir
// combien de tables il reste puisque le restaurateur ne nous le dit pas. »
//
// LA DISTINCTION EST NETTE, ET ELLE SE GARDE ICI. Un STOCK qu'il a préparé, il
// le connaît : vingt portions le matin, douze vendues, il en reste huit, et
// c'est lui qui le dit à Léa. Une CAPACITÉ, non : les tables se libèrent et se
// reprennent toute la journée, personne ne recompte la salle entre deux
// services. Un chiffre écrit là est inventé — et un chiffre inventé une seule
// fois fait perdre quelqu'un pour toujours.
console.log("\n══ les nombres qu'on n'invente pas ══");
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("src/lib/direct/apercu-habitant.ts", "utf8");
  const fautifs = [...src.matchAll(/titre:\s*"([^"]*)"/g)]
    .map((m) => m[1])
    .filter((t) => /\b\d+\s*(tables?|places?|couverts?|fauteuils?)\b/i.test(t));
  console.log(`  titres qui comptent une capacité : ${fautifs.length ? JSON.stringify(fautifs) : "aucun"}`);
  dire(fautifs.length === 0,
    "aucune annonce ne compte des tables ou des places — on ne peut pas le savoir");
  const stocks = [...src.matchAll(/titre:\s*"([^"]*)"/g)]
    .map((m) => m[1])
    .filter((t) => /\b\d+\s*(portions?|parts?|bouquets?|pains?|pi[èe]ces?)\b/i.test(t));
  console.log(`  titres qui comptent un stock préparé : ${stocks.length ? JSON.stringify(stocks) : "aucun"}`);
  dire(stocks.length > 0,
    "mais un stock qu'il a préparé se compte encore : c'est lui qui nous l'a dit");
}

console.log("\n══ la voix du commerçant ══");
// ONZE HEURES : c'est une heure où la carte à conseil est dans le paquet. Ce
// qu'on vérifie ici est le RENDU d'un conseil, pas le hasard de l'horloge.
({ ctx, p } = await ouvrir("/autour-de-moi", 11));
// ON CHERCHE LA CARTE À CONSEIL, ON NE SUPPOSE PLUS QU'ELLE EST EN TÊTE.
// Elle l'était tant que les commerces suivis ouvraient le paquet ; depuis que
// ce qui vient de tomber passe devant, la tête dépend de l'heure qu'il est. Ce
// que cette section vérifie, c'est le RENDU d'un conseil — pas son rang, qui
// se vérifie dans « le moment ».
// ═══ ELLE A DESCENDU D'UNE COUCHE, ET C'ÉTAIT DEMANDÉ ═══
//
// « La citation est jolie. Mais dans une interface où l'utilisateur est déjà
// confronté à beaucoup d'informations, ce n'est pas prioritaire. Ça peut être
// excellent dans une deuxième couche : appui sur l'annonce → détails. »
//
// CE QU'ON VÉRIFIE A DONC CHANGÉ DE SENS, et il faut le dire : cette section
// exigeait la citation SUR LA FACE. Elle exige maintenant qu'elle n'y soit
// plus — et qu'elle soit bien sous le pli, signée. Une garde qu'on retourne
// sans le dire est pire qu'une garde absente.
const voixSurLaFace = () =>
  p.evaluate(() => {
    const d = document.querySelector(".ap-dessus");
    return {
      chez: (d?.querySelector(".ap-ident-l b") ?? d?.querySelector(".cd-chez"))
        ?.textContent.replace(/\s+/g, " ").split("·")[0].trim() ?? "",
      // Le conseil EN TEXTE n'a plus sa place sur la face. Le film, si : ce
      // n'est pas une phrase à lire, c'est un visage, et il se regarde en une
      // demi-seconde.
      conseilTexte: !!d?.querySelector(".cd-conseil:not(.film)"),
      detail: d?.querySelector(".cd-detail")?.textContent.trim() ?? "",
    };
  });
let sansCitation = await voixSurLaFace();
for (let k = 0; k < 14 && !sansCitation.detail; k++) {
  if (!(await avancer(p))) break;
  sansCitation = await voixSurLaFace();
}
console.log(`  sur la face : ${sansCitation.chez} → « ${sansCitation.detail} »`);
dire(!sansCitation.conseilTexte, "aucune citation sur la face : le prix et l'heure passent avant");
dire(!!sansCitation.detail, `la ligne de détail a repris sa place (${sansCitation.detail})`);

// ET ON LA RETROUVE SOUS LE PLI, ENTIÈRE. Descendre est un geste délibéré :
// c'est là que la voix du commerçant a sa valeur, et pas avant.
await p.goto(`${BASE}/autour-de-moi?h=12.6`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
let motDit = null;
for (let k = 0; k < 14; k++) {
  await versLaFiche(p).catch(() => {});
  await p.waitForTimeout(700);
  motDit = await p.evaluate(() => {
    const m = document.querySelector(".ap-motdit");
    return m
      ? { mot: m.querySelector("em")?.textContent.trim() ?? "",
          qui: m.querySelector("s")?.textContent.trim() ?? "" }
      : null;
  });
  if (motDit?.mot) break;
  if (!(await avancer(p))) break;
}
console.log(`  sous le pli : « ${motDit?.mot} » — ${motDit?.qui}`);
dire(!!motDit?.mot, "la citation vit une couche plus bas, pas à la poubelle");
dire(/,/.test(motDit?.qui ?? ""), `signée d'un prénom et d'un métier (${motDit?.qui})`);

// ET LA SIGNATURE DE MÉTIER VIT SOUS LE PLI, écrite une fois pour toutes.
await p.goto(`${BASE}/autour-de-moi?chez=boulange`, { waitUntil: "networkidle" });
await p.waitForSelector(".ap-arrivee");
const arr = await p.evaluate(() => {
  const v = document.querySelector(".ap-arrivee .ap-voix");
  return {
    qui: v?.querySelector("b")?.textContent.trim() ?? "",
    signature: v?.querySelector("span:last-child")?.lastChild?.textContent.trim() ?? "",
  };
});
console.log(`  sur sa porte : ${arr.qui} — « ${arr.signature} »`);
dire(/boulanger/.test(arr.qui), `la porte dit qui est derrière (${arr.qui})`);
dire(/heures/.test(arr.signature), `et sa signature de métier (${arr.signature})`);
await p.screenshot({ path: "/tmp/voix-porte.png", fullPage: true });
await ctx.close();

// ═══ 5 · LE RECTANGLE JAUNE NE DIT PLUS « MAINTENANT · CE MATIN » ═══
//
// « Ce rectangle prend de la place sur chaque annonce et ne sert à rien. » Sur
// la boucherie il disait deux fois la même chose, sur une carte qui est de
// toute façon celle d'aujourd'hui. Il ne survit que devant une vraie borne.
console.log("\n══ le rectangle jaune ══");
// ─── ET ELLE AUSSI FIXE SON HEURE ───
// Cette section traverse le paquet pour trouver des cartes SANS rectangle. Le
// paquet change avec l'heure : a 19 h il est fait de commerces du soir, qui
// portent presque tous une borne horaire, et la garde echouait par
// intermittence selon la minute ou on la lancait. Un test qui depend de
// l'heure du conteneur ne se croit plus au bout de deux fois.
({ ctx, p } = await ouvrir("/autour-de-moi", 12.5));
// ON EN REGARDE PLUS QU'AVANT, ET POUR UNE RAISON. Depuis « le moment », le
// haut du paquet est fait de publications fraîches — elles portent toutes une
// heure. Dix cartes ne sortaient donc plus de cette zone : le test ne voyait
// que des rectangles pleins et concluait que le rectangle était partout, alors
// qu'il suffisait de descendre. On échantillonne assez loin pour sortir du
// frais, et on ne compte pas deux fois la même carte lue pendant l'animation.
const bornes = [];
for (let k = 0; k < 22; k++) {
  const b = await p.evaluate(() => ({
    chez: (document.querySelector(".ap-dessus .ap-ident-l b")
      ?? document.querySelector(".ap-dessus .cd-chez"))?.textContent
      .replace(/\s+/g, " ").split("·")[0].trim() ?? "",
    pill: document.querySelector(".ap-dessus .cd-quand")?.textContent
      .replace(/\s+/g, " ").trim() ?? "",
  }));
  const d = bornes[bornes.length - 1];
  if (!d || d.chez !== b.chez || d.pill !== b.pill) bornes.push(b);
  if (!(await avancer(p))) break;
}
for (const b of bornes.slice(0, 8))
  console.log(`  ${b.chez} → ${b.pill || "(pas de rectangle)"}`);
dire(!bornes.some((b) => /ce matin|aujourd|cette semaine|toute la journ/i.test(b.pill)),
  "plus jamais « ce matin » ni « aujourd'hui » dans le rectangle");
dire(bornes.every((b) => !b.pill || /\d/.test(b.pill)),
  "il ne reste que les vraies heures");
dire(bornes.some((b) => !b.pill), "et beaucoup de cartes n'en ont plus du tout");
await ctx.close();

// ═══ 6 · LA FILE DU MATIN ═══
//
// « Il y a peu de chances que les gens tombent pile poil sur les offres avec le
// compteur de 5 minutes. » On retourne la fenêtre : on s'inscrit le matin, et
// l'offre du soir descend dans cette file-là.
console.log("\n══ la file du matin ══");
// ─── ET L'HORLOGE EST FIXEE, PARCE QUE LE BOULANGER FERME ───
// Cette section lisait l'heure du conteneur. A 19 h 47, la boulangerie n'a plus
// rien a proposer — ses moments s'arretent a 19 h 30 — donc elle quitte le
// paquet, ce qui est la regle du produit et pas un defaut. La garde echouait
// alors sur une file parfaitement saine : elle mesurait l'heure du conteneur.
// On se met a 18 h 12, quand « ce qui reste, a moitie prix » tourne.
({ ctx, p } = await ouvrir("/autour-de-moi?chez=boulange", 18.2));
await p.click(".ap-arr-ville");
await p.waitForTimeout(1300);
await versLaFiche(p);
await p.waitForTimeout(900);
const f0 = await p.evaluate(() => {
  const d = document.querySelector(".ap-file");
  if (!d) return null;
  return {
    quoi: d.querySelector("b").textContent.replace(/\s+/g, " ").trim(),
    combien: d.querySelector("em").textContent.replace(/\s+/g, " ").trim(),
    bouton: d.querySelector(".ap-file-b").textContent.trim(),
  };
});
if (!f0) { dire(false, "la ligne de la file est sous le pli"); }
else {
  console.log(`  « ${f0.quoi} »`);
  console.log(`  ${f0.combien} → ${f0.bouton}`);
  // « S'IL EN RESTE », JAMAIS « IL EN RESTERA » : un boulanger qui a tout
  // vendu ne doit pas se retrouver en faute d'avoir bien travaillé.
  dire(/^S’il reste|^S'il reste/.test(f0.quoi), `elle ne promet rien (${f0.quoi})`);
  dire(/attendent déjà/.test(f0.combien), "elle dit combien attendent");
  dire(/inscription/.test(f0.combien),
    "et que l'ordre est celui de l'inscription, pas de la vitesse de clic");
  dire(f0.bouton === "Prévenez-moi", `un seul geste (${f0.bouton})`);
}
await p.click(".ap-file-b");
await p.waitForTimeout(900);
const f1 = await p.evaluate(() => ({
  bouton: document.querySelector(".ap-file-b")?.textContent.trim() ?? "",
  rang: document.querySelector(".ap-file-d em")?.textContent.replace(/\s+/g, " ").trim() ?? "",
  echo: document.querySelector(".ap-echo")?.textContent.replace(/\s+/g, " ").trim() ?? "",
  garde: JSON.parse(localStorage.getItem("clikme-file-v1") ?? "[]"),
}));
console.log(`  → ${f1.bouton} · ${f1.rang}`);
console.log(`  « ${f1.echo} »`);
dire(/attends/i.test(f1.bouton), "on est dans la file");
dire(/dans la file/.test(f1.rang), `et on connaît son rang (${f1.rang})`);
dire(/cinq minutes/.test(f1.echo), "l'écho annonce les cinq minutes");
dire(f1.garde.includes("boulange"), "et ça survit à la fermeture");

// ET ON LA RETROUVE DANS « MES COMMERCES » — une file qu'on ne retrouve nulle
// part est une file oubliée.
// ON Y ENTRE PAR LA CLOCHE, ET C'EST UNE CORRECTION DE CE FICHIER.
//
// CETTE PAGE A PORTÉ QUATRE PORTES SUCCESSIVES, et chacune est tombée pour la
// même raison : elle disait deux choses à la fois. D'abord une pastille chiffrée
// qui comptait les nouvelles en ambre et les annonces gardées en vert — « le
// cœur et les notifications en haut à droite, c'est incompréhensible ». Puis une
// cloche partie sur l'onglet Profil. Puis la poche, à côté du cœur.
//
// LA DERNIÈRE SÉPARATION EST CELLE QUI COMPTE : « le bouton cœur et le bouton
// des notifications à côté montrent la même chose, or le cœur montre les favoris
// et les notifications tout le reste. » Ce sont maintenant deux pages distinctes.
// La FILE D'ATTENTE n'est pas un favori — on ne l'a pas choisie, elle nous
// prévient — donc elle vit avec les nouvelles, derrière la cloche. Ce test
// entrait encore par la poche et n'y trouvait plus rien : il mesurait la page
// d'avant, pas le défaut.
await p.click(".ap-cloche");
await p.waitForTimeout(900);
const att = await p.evaluate(() => {
  const e = document.querySelector(".ap-nouv-e.attente");
  return {
    titre: [...document.querySelectorAll(".ap-nouv-t")].map((x) => x.textContent.trim()),
    ligne: e?.textContent.replace(/\s+/g, " ").trim() ?? "",
  };
});
console.log(`  ${JSON.stringify(att.titre)} → ${att.ligne}`);
dire(att.titre.includes("Vous attendez"), "« Mes commerces » a un bloc « Vous attendez »");
dire(/Pétrin/.test(att.ligne), `avec le commerce (${att.ligne.slice(0, 60)})`);
await p.screenshot({ path: "/tmp/file-commerces.png", fullPage: true });
await ctx.close();

// ═══ 7 · REMETTRE UNE ANNONCE, ET CE QUI REVIENT ═══
//
// « Est-ce que le commerçant peut stocker ces annonces quelque part ? » Oui,
// mais pas comme une archive : une liste d'offres périmées est un cimetière,
// et un cimetière fait paraître mort un produit dont toute la promesse est
// d'être vivant. L'historique sert à DEUX choses, et on vérifie les deux :
//
//   1. DE SON CÔTÉ — « remettre celle-là aujourd'hui », le geste qui
//      l'accroche. Et sa carte doit changer DANS LE PAQUET tout de suite :
//      un bouton qu'il faut croire ne se réappuie pas.
//   2. DU CÔTÉ DES CLIENTS — « ce qui revient », déduit et jamais déclaré.
//      La vraie question n'est pas « qu'a-t-il fait le 12 » mais « est-ce
//      qu'il refait ça, et quand ».
console.log("\n══ mon commerce ══");
{
  const c3 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c3.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  const q = await c3.newPage();
  q.on("pageerror", (e) => erreurs.push(String(e)));
  q.on("console", (m) => { if (m.type() === "error") erreurs.push(`${m.text()} [${q.url()}]`); });
  // UNE ERREUR SANS ADRESSE NE SE CORRIGE PAS. « Failed to load resource : 500 »
  // ne dit ni sur quelle page ni pour quelle ressource, et le message est
  // collecte pour tout le parcours : il peut venir de n'importe laquelle des
  // trente pages ouvertes. Une ligne rouge qu'on ne sait pas reproduire ne se
  // corrige pas, elle s'ignore — la pire fin possible pour une garde.
  q.on("response", (r) => {
    if (r.status() >= 500) erreurs.push(`HTTP ${r.status()} sur ${r.url()} [depuis ${q.url()}]`);
  });
  await q.goto(`${BASE}/autour-de-moi/mon-commerce?chez=boulange`, {
    waitUntil: "networkidle",
  });
  await q.waitForTimeout(900);

  const mc = await q.evaluate(() => ({
    nom: document.querySelector(".mc h1")?.textContent.trim() ?? "",
    // LA RÉCOMPENSE AVANT LA CORVÉE : le bilan d'hier doit être AU-DESSUS de
    // la liste. Un écran qui ouvre sur « qu'allez-vous publier ? » est un
    // formulaire ; celui qui ouvre sur « voilà ce que ça a produit » est une
    // raison de l'ouvrir.
    ordre:
      (document.querySelector(".mc-bilan")?.getBoundingClientRect().top ?? 1e9) <
      (document.querySelector(".mc-liste")?.getBoundingClientRect().top ?? 0),
    chiffres: [...document.querySelectorAll(".mc-chiffres span")].map((e) =>
      e.textContent.replace(/\s+/g, " ").trim()),
    lignes: [...document.querySelectorAll(".mc-liste li b")].map((e) =>
      e.textContent.trim()),
    habitudes: [...document.querySelectorAll(".mc-hab li")].map((e) =>
      e.textContent.replace(/\s+/g, " ").trim()),
  }));
  console.log(`  ${mc.nom}`);
  console.log(`  hier : ${mc.chiffres.join(" · ")}`);
  for (const h of mc.habitudes) console.log(`  ↻ ${h}`);
  dire(/Pétrin/.test(mc.nom), `l'écran est celui du commerce (${mc.nom})`);
  dire(mc.ordre, "le bilan d'hier passe avant la liste : la récompense d'abord");
  // DEUX CHIFFRES, JAMAIS DOUZE. Un tableau de bord de commerçant qui affiche
  // un taux de conversion ne se relit pas une deuxième fois.
  dire(mc.chiffres.length === 2, `deux chiffres, pas douze (${mc.chiffres.length})`);
  console.log(`  à remettre : ${JSON.stringify(mc.lignes)}`);
  dire(mc.lignes.length >= 2, `ses annonces sont là (${mc.lignes.length})`);
  // CHAQUE ANNONCE UNE SEULE FOIS. La liste affichait « La fournée de 17 h »
  // quatre fois de suite : exact, et parfaitement inutile — il n'a pas à
  // choisir laquelle des quatre fournées identiques remettre.
  dire(new Set(mc.lignes).size === mc.lignes.length,
    "et chacune une seule fois");
  // ON NE NOMME UN JOUR QUE SI DEUX TIERS DES FOIS TOMBENT DESSUS.
  dire(mc.habitudes.length > 0, "et ce qui revient est déduit");
  await q.screenshot({ path: "/tmp/mon-commerce.png", fullPage: true });

  // ── LE GESTE ──
  await q.click(".mc-liste li:first-child .mc-b");
  await q.waitForTimeout(700);
  const apresRemise = await q.evaluate(() => ({
    bouton: document.querySelector(".mc-liste li:first-child .mc-b")?.textContent.trim() ?? "",
    ok: document.querySelector(".mc-ok")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    garde: JSON.parse(localStorage.getItem("clikme-remises-v1") ?? "[]").length,
  }));
  console.log(`  → ${apresRemise.bouton} · ${apresRemise.ok}`);
  dire(/En ligne/.test(apresRemise.bouton), "le bouton dit que c'est en ligne");
  dire(/tête de votre journée/.test(apresRemise.ok),
    `et où elle est allée (${apresRemise.ok.slice(0, 44)})`);
  dire(apresRemise.garde === 1, "c'est enregistré");

  // ── ET ÇA SE VOIT DANS LE PAQUET, TOUT DE SUITE ──
  await q.goto(`${BASE}/autour-de-moi?chez=boulange`, { waitUntil: "networkidle" });
  await q.waitForTimeout(1800);
  const enLigne = await q.evaluate(() =>
    [...document.querySelectorAll(".ap-arr-jour b")].map((e) => e.textContent.trim()));
  console.log(`  sa journée, vue par ses clients : ${JSON.stringify(enLigne.slice(0, 3))}`);
  dire(enLigne.length > 0 && /fournée/i.test(enLigne[0]),
    `l'annonce remise est en tête de sa journée (${enLigne[0]})`);
  await c3.close();
}

// ── ET « CE QUI REVIENT » CÔTÉ CLIENT, SUR LA PAGE DU COMMERCE ──
//
// IL ÉTAIT SOUS LE PLI ET IL EST PARTI SUR /autour-de-moi/boutique, avec « Vu
// chez eux », la fiche du commerce et le recrutement. Raison : mesuré sur le
// même commerce, le pli faisait 2 490 points de haut et trois de ses cinq blocs
// se retrouvaient à l'identique sur la page — « je ne vois pas de différence si
// ce n'est le menu du bas ». Ce n'était pas la page qu'il fallait redessiner,
// c'était le pli qu'il fallait vider.
//
// LE PLI GARDE CE QUI RÉPOND À « J'Y VAIS ? » : la journée, la file, suivre, en
// parler. La page répond à « c'est qui ? ». Un seul bloc les recouvre encore,
// la journée, et c'est le bon : c'est lui qui fait le lien entre les deux.
console.log("\n══ ce qui revient, côté client ══");
// `ouvrir` attend `.ap-fav2`, qui est le paquet : la page du commerce n'en a
// pas, et n'a pas non plus de carte d'arrivée à écarter. On l'ouvre donc
// simplement.
ctx = await nav.newContext({
  viewport: { width: 393, height: 852 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: "fr-FR",
});
p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
await p.waitForSelector(".bq-hero");
await p.waitForTimeout(900);
const hab = await p.evaluate(() =>
  [...document.querySelectorAll(".bq-hab li")].map((e) => ({
    t: e.querySelector("b")?.textContent.trim() ?? "",
    q: e.querySelector("span")?.textContent.trim() ?? "",
    b: e.querySelector(".bq-hab-b")?.textContent.trim() ?? "",
    lien: e.querySelector(".bq-hab-b")?.getAttribute("href") ?? "",
  })));
for (const h of hab) console.log(`  ${h.t} — ${h.q} → ${h.b}`);
dire(hab.length > 0, "la page dit ce qui revient");
// LE JOUR N'EST NOMMÉ QUE QUAND IL DOMINE VRAIMENT — deux tiers des fois.
dire(hab.some((h) => /plutôt le/.test(h.q)),
  "et nomme le jour quand il y en a un");
// SA MEILLEURE RÉPONSE N'EST PAS UNE ARCHIVE, C'EST UN MESSAGE. Sur une page,
// c'est un lien direct : plus besoin d'une feuille par-dessus pour ne pas
// quitter la pile, puisqu'on n'est plus dans la pile.
dire(hab.every((h) => /redemander/i.test(h.b)),
  "avec le moyen de lui demander s'il en a encore");
const dem = decodeURIComponent((hab[0]?.lien ?? "").split("text=")[1] ?? "");
console.log(`  « ${dem} »`);
dire(/^https:\/\/wa\.me\//.test(hab[0]?.lien ?? ""),
  "le geste ouvre directement le message");
// ON DEMANDE, ON NE PREND PAS. « Je prends la garbure » annonce une commande
// pour quelque chose qui n'existe peut-être plus, et met le commerçant en
// faute de ne pas l'avoir.
dire(/est-ce que vous avez encore/i.test(dem),
  `le message est une question (${dem.slice(0, 72)})`);
dire(!/je prends/i.test(dem), "et n'annonce pas une commande");
dire(!/\?\./.test(dem), "sans double ponctuation");
await p.screenshot({ path: "/tmp/ce-qui-revient.png", fullPage: true });
await ctx.close();

// ── ET LE PLI, LUI, NE LES PORTE PLUS ──
//
// C'EST LA MOITIÉ DU TEST, ET LA PLUS FRAGILE : une fonction déplacée qui
// resterait aussi à son ancienne place ne serait pas un déménagement, ce serait
// un doublon de plus — celui-là même qu'on vient de retirer.
console.log("\n══ le pli ne garde que ce qui décide ══");
({ ctx, p } = await ouvrir("/autour-de-moi?chez=emporter", 12.5));
await p.click(".ap-arr-ville");
await p.waitForTimeout(1300);
await versLaFiche(p);
await p.waitForTimeout(900);
const pli = await p.evaluate(() => ({
  blocs: [...document.querySelectorAll(".ap-bloc")]
    .map((b) => (b.querySelector("h3")?.textContent ?? "(geste)").trim()),
  sortie: document.querySelector(".ap-tout b")?.textContent.trim() ?? "",
  href: document.querySelector(".ap-tout")?.getAttribute("href") ?? "",
  porte: document.querySelector(".ap-ident-d a")?.getAttribute("href") ?? "",
}));
console.log(`  ${pli.blocs.join(" · ")}`);
dire(pli.blocs.includes("La journée"), "la journée reste : c'est ce qui décide maintenant");
dire(pli.blocs.includes("En parler"), "les gestes restent");
dire(!pli.blocs.includes("Le commerce"), "la fiche du commerce n'y est plus");
dire(!pli.blocs.includes("Vu chez eux"), "le mur des clients non plus");
dire(!pli.blocs.includes("Ce qui revient"), "ni ce qui revient");
dire(pli.href === "/autour-de-moi/boutique", `et le pli a une sortie (${pli.sortie})`);
dire(pli.porte === "/autour-de-moi/boutique",
  "« Infos boutique » mène au même endroit, plus au bloc d'en dessous");
await ctx.close();

// ═══ 8 · LA VIDÉO DANS LE ROND ═══
//
// LE ROND DOIT TENIR LES DEUX BOUTS, ET C'EST TOUT LE TEST. Trop grand, il
// devient une vidéo plein écran, c'est-à-dire une performance, et personne ne
// veut faire l'acteur. Trop petit — c'était la première version, trente-quatre
// pixels — et « on ne voit quasiment rien » : il ne reste qu'une vignette qui
// scintille. On vérifie donc un ENCADREMENT, pas une valeur : assez large pour
// qu'un geste s'y lise, assez étroit pour rester en marge de l'annonce.
//
// ON VÉRIFIE LE MÉCANISME PAR SON VRAI CHEMIN : l'outil de terrain filme le
// geste et la carte préparée le porte. Le test tourne son propre clip, neutre
// et jetable — c'est aussi ce qui prouve que le chemin du terrain fonctionne,
// et pas seulement la fixture.
console.log("\n══ la vidéo dans le rond ══");
{
  const c4 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c4.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  const q = await c4.newPage();
  q.on("pageerror", (e) => erreurs.push(String(e)));
  q.on("console", (m) => { if (m.type() === "error") erreurs.push(`${m.text()} [${q.url()}]`); });
  // UNE ERREUR SANS ADRESSE NE SE CORRIGE PAS. « Failed to load resource : 500 »
  // ne dit ni sur quelle page ni pour quelle ressource, et le message est
  // collecte pour tout le parcours : il peut venir de n'importe laquelle des
  // trente pages ouvertes. Une ligne rouge qu'on ne sait pas reproduire ne se
  // corrige pas, elle s'ignore — la pire fin possible pour une garde.
  q.on("response", (r) => {
    if (r.status() >= 500) erreurs.push(`HTTP ${r.status()} sur ${r.url()} [depuis ${q.url()}]`);
  });
  await q.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });

  // ON TOURNE UN CLIP NEUTRE DANS LE NAVIGATEUR — un carré de couleur qui
  // bouge, trois dixièmes de seconde. Il ne ressemble à personne, il ne
  // sort jamais du test, et il passe par exactement le même chemin qu'une
  // vidéo filmée devant un commerçant.
  const clip = await q.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 120; c.height = 160;
    const x = c.getContext("2d");
    let n = 0;
    const t = setInterval(() => {
      x.fillStyle = `hsl(${(n += 24) % 360} 60% 45%)`;
      x.fillRect(0, 0, 120, 160);
    }, 60);
    const flux = c.captureStream(25);
    const bouts = [];
    const enr = new MediaRecorder(flux, { mimeType: "video/webm" });
    enr.ondataavailable = (e) => bouts.push(e.data);
    enr.start();
    await new Promise((r) => setTimeout(r, 500));
    enr.stop();
    clearInterval(t);
    await new Promise((r) => { enr.onstop = r; });
    const b = new Blob(bouts, { type: "video/webm" });
    return await new Promise((r) => {
      const l = new FileReader();
      l.onload = () => r(String(l.result));
      l.readAsDataURL(b);
    });
  });
  dire(clip.startsWith("data:video/webm"), `le clip du test est tourné (${clip.length} car.)`);

  // ON PRÉPARE UN COMMERCE AVEC SA VOIX ET SA VIDÉO, par le vrai magasin.
  await q.evaluate((v) => {
    localStorage.setItem("clikme.preparation.v1", JSON.stringify([{
      id: "prep-essai", nom: "Boucherie Lasserre", metier: "Boucherie",
      branche: "restaurant", adresse: "12 rue Saint-Vincent",
      horaires: "7 h – 13 h", distance: "180 m", metres: 180,
      quoi: "La côte de bœuf maturée", prix: "34 €/kg",
      prenom: "Serge", role: "boucher",
      conseil: "La côte, attendez jeudi. Prenez la bavette.",
      video: v,
    }]));
  }, clip);
  await q.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await q.waitForTimeout(4600);

  const rond = await q.evaluate(() => {
    const t = document.querySelector(".ap-dessus .cd-tete");
    const v = t?.querySelector("video");
    const r = t?.getBoundingClientRect();
    return {
      chez: (document.querySelector(".ap-dessus .ap-ident-l b")
      ?? document.querySelector(".ap-dessus .cd-chez"))?.textContent
        .replace(/\s+/g, " ").split("·")[0].trim() ?? "",
      video: !!v,
      muet: v?.muted ?? null,
      boucle: v?.loop ?? null,
      taille: r ? Math.round(r.width) : 0,
      // LA LARGEUR DE L'ÉCRAN SERT DE RÈGLE : un rond se juge par rapport à ce
      // qui l'entoure, pas en pixels absolus.
      ecran: window.innerWidth,
      // ET LA CARTE DU DESSOUS N'EN CHARGE AUCUNE : voir `sansVideo`.
      dessous: !!document.querySelector(".ap-dessous video"),
    };
  });
  const part = Math.round((rond.taille / rond.ecran) * 100);
  console.log(`  ${rond.chez} · rond de ${rond.taille} px (${part} % de l'écran) · vidéo ${rond.video ? "oui" : "non"}`);
  dire(rond.video, "la vidéo est dans le rond de la carte");
  dire(rond.taille >= 60, `on y voit enfin quelque chose (${rond.taille} px)`);
  dire(part <= 25, `et il reste en marge de l'annonce (${part} % de la largeur)`);
  dire(rond.muet === true, "elle est muette");
  dire(rond.boucle === true, "et elle tourne en boucle");
  dire(!rond.dessous, "la carte du dessous n'en charge aucune");
  await q.screenshot({ path: "/tmp/voix-video.png" });

  // ── LE SON, SUR APPUI — MAIS SUR LA PAGE DU COMMERCE ──
  //
  // IL ÉTAIT SOUS LE PLI, DANS « LE COMMERCE ». Ce bloc a déménagé sur
  // /autour-de-moi/boutique : le pli faisait le travail de la page, les deux
  // écrans se recouvraient à l'identique, et « je ne vois pas de différence si
  // ce n'est le menu du bas ». La fonction, elle, n'a pas été perdue dans le
  // déménagement — c'est exactement ce que ce test garde.
  //
  // ET LA FORME A CHANGÉ AVEC LE LIEU. Dans un paquet qu'on balaie il fallait
  // RECOUVRIR : on ne quitte pas la pile. Sur une page, le rond s'agrandit sur
  // place — un écran de moins pour le même geste. On ne cherche donc plus
  // `.ap-film` mais l'ouverture du rond lui-même.
  await q.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await q.waitForTimeout(900);
  const avantAppui = await q.evaluate(() => {
    const v = document.querySelector(".bq-voix-t video");
    return { muet: v?.muted ?? null, largeur: Math.round(
      document.querySelector(".bq-voix-r")?.getBoundingClientRect().width ?? 0) };
  });
  dire(avantAppui.muet === true, "au repos le rond de la page est muet");
  await q.$eval(".bq-voix-t", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await q.waitForTimeout(300);
  await q.click(".bq-voix-t");
  await q.waitForTimeout(900);
  const grand = await q.evaluate(() => {
    const d = document.querySelector(".bq-voix.ouverte");
    const v = d?.querySelector("video");
    return {
      ouvert: !!d,
      // ICI LE SON EST PERMIS : c'est une demande, pas une interruption.
      muet: v?.muted ?? null,
      boucle: v?.loop ?? null,
      largeur: Math.round(
        document.querySelector(".bq-voix-r")?.getBoundingClientRect().width ?? 0),
      qui: document.querySelector(".bq-voix-n")?.textContent.trim() ?? "",
    };
  });
  console.log(`  en grand : ${grand.qui} · ${avantAppui.largeur} → ${grand.largeur} px`);
  dire(grand.ouvert, "l'appui l'ouvre en grand");
  dire(grand.muet === false, "avec le son");
  dire(grand.largeur > avantAppui.largeur + 60,
    `et il grandit vraiment (${avantAppui.largeur} → ${grand.largeur} px)`);
  dire(grand.boucle === true, "sans cesser de tourner en boucle");
  dire(/,/.test(grand.qui), `elle dit qui c'est (${grand.qui})`);
  await q.screenshot({ path: "/tmp/voix-grand.png" });
  await c4.close();
}

// ET LA FICHE EN PORTE UNE AUSSI — arbitrage rendu sur l'enseigne du second
// plan, voir LISEZ-MOI.md. La vidéo aux deux visages, elle, reste dehors :
// un visage n'est pas une enseigne.
{
  const c5 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c5.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  const q = await c5.newPage();
  await q.goto(`${BASE}/autour-de-moi?chez=emporter`, { waitUntil: "networkidle" });
  await q.waitForTimeout(1500);
  const rien = await q.evaluate(() => {
    const t = document.querySelector(".ap-arrivee .ap-voix-t");
    return {
      rond: !!t,
      film: !!t?.querySelector("video"),
      taille: t ? Math.round(t.getBoundingClientRect().width) : 0,
    };
  });
  dire(rien.rond, "le rond de la porte est là");
  dire(rien.film, "et il porte la vidéo de la fiche");
  // SUR LA FICHE ON EST À L'ARRÊT, PLUS EN TRAIN DE BALAYER : c'est l'endroit
  // où le rond peut prendre le plus de place sans rien bousculer, et il serait
  // absurde qu'il y soit plus petit que sur la carte qu'on traverse.
  dire(rien.taille >= 70, `et on l'y voit en grand (${rien.taille} px)`);
  await c5.close();
}

// ═══ 9 · LE MOMENT — CE QUI VIENT DE TOMBER ═══
//
// CE QU'AUCUNE FICHE GOOGLE NE SAIT DIRE. Des horaires, une adresse, un menu :
// tout le monde les a. « Il vient de se passer quelque chose, il y a douze
// minutes, à trois cents mètres » n'existe nulle part ailleurs.
//
// DEUX CHOSES DOIVENT ÊTRE VRAIES, et la seconde est celle qui a lâché au
// premier essai :
//
//   1. LA CARTE FRAÎCHE EST EN TÊTE du paquet, devant les commerces suivis.
//   2. ELLE MONTRE LE MOMENT QUI L'A FAIT REMONTER. La carte remontait bien,
//      mais affichait le premier moment dont la fenêtre couvrait l'heure : à
//      8 h 18 la boulangerie remontait pour sa fournée de 7 h et montrait
//      « MENU DU JOUR · La formule du midi » alors qu'elle remontait pour le
//      pain. Le classement disait une chose, la carte en montrait une autre.
//
// IL Y AVAIT UNE TROISIÈME CHOSE, ET ELLE A ÉTÉ RETIRÉE DU PRODUIT. La carte
// portait une pastille « il y a 18 min », et cette garde la comptait. Le
// signalement : « il y a 1 h : cette indication n'a aucun intérêt, donc à
// supprimer en haut de l'annonce. » Il a raison — sur un direct, tout ce qu'on
// voit est de maintenant ; dater chaque carte n'ajoutait qu'un chiffre de plus
// dans un écran qu'on venait justement d'alléger. `.cd-frais` n'existe plus,
// et ce qui la mesurait est parti avec elle plutôt que d'être contourné.
//
// ON BALAIE LA JOURNÉE AVEC UNE HORLOGE FAUSSE : c'est le seul moyen de voir
// une fonction qui, par construction, n'est vraie que quatre-vingt-dix minutes.
console.log("\n══ le moment ══");
{
  // Chaque heure porte le titre attendu en tête de paquet. Les trous sont
  // volontaires et ils comptent autant : à 17 h personne n'a rien publié, et la
  // rareté est ce qui donne du poids aux autres heures.
  const journee = [
    [8.3, "La fournée de 7 h"],
    // ON NE COMPTE PLUS LES TABLES — voir « les nombres qu'on n'invente pas ».
    [11.7, "De la place, sans attendre"],
    [13.5, "Dernières portions"],
    [16, "Les plats cuisinés du jour"],
    // 17 H 30 ÉTAIT L'HEURE CREUSE DE CETTE GARDE, ET ELLE NE L'EST PLUS.
    // L'application ouvre désormais sur TOUTE la ville et non sur les
    // restaurants : à 17 h 30 les tables sont calmes, mais la fleuriste vient
    // de sortir ses bouquets. Ce n'est pas la fraîcheur qui a débordé — c'est
    // le paquet qui s'est élargi, et c'était le but.
    [17.5, "Il reste 4 bouquets"],
    [18.3, "Ce qui reste, à moitié prix"],
    [21.4, "Service du soir"],
  ];
  let bons = 0;
  for (const [h, attendu] of journee) {
    const ctx9 = await nav.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, locale: "fr-FR",
    });
    await ctx9.clock.setFixedTime(
      new Date(2026, 8, 2, Math.floor(h), Math.round((h % 1) * 60), 0),
    );
    const p9 = await ctx9.newPage();
    p9.on("pageerror", (e) => erreurs.push(String(e)));
    await p9.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
    await p9.waitForTimeout(1200);
    const r = await p9.evaluate(() => ({
      quoi: document.querySelector(".ap-dessus .cd-offre")?.textContent.trim() ?? "",
      // ON VÉRIFIE AUSSI QUE LA PASTILLE N'EST PAS REVENUE. Elle a été retirée
      // sur signalement ; une garde qui ne surveille plus rien laisserait la
      // porte ouverte à sa réapparition au prochain ajout.
      datee: document.querySelectorAll(".cd-frais").length,
    }));
    const hh = `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
    // LA CASSE VIENT DU CSS, PAS DU TEXTE : `.cd-offre` est en `uppercase`,
    // donc `textContent` rend l'original. On compare sans en tenir compte.
    //
    // ET L'ESPACE NON PLUS. « La fournée de 7 h » s'écrit désormais avec une
    // espace INSÉCABLE entre le nombre et son unité — sans elle, le « h » se
    // retrouvait seul sur la ligne suivante en capitales de soixante points.
    // La garde comparait deux chaînes identiques à l'œil et différentes d'un
    // octet, et affichait « attendu : La fournée de 7 h » sous « La fournée de
    // 7 h ». Une mesure qui compare des octets là où elle veut comparer des
    // MOTS finit toujours par refuser une correction typographique.
    const memeTexte = (x) => x.toLowerCase().replace(/[\s\u00a0\u202f]+/g, " ").trim();
    const ok = memeTexte(r.quoi) === memeTexte(attendu) && r.datee === 0;
    if (ok) bons++;
    console.log(`  ${hh} → ${r.quoi || "(rien)"}`);
    if (!ok) console.log(`      attendu : ${attendu}${r.datee ? " — et aucune date" : ""}`);
    if (h === 13.5) await p9.screenshot({ path: "/tmp/moment.png" });
    await ctx9.close();
  }
  dire(bons === journee.length, `la journée se lit heure par heure (${bons}/${journee.length})`);

  // ─── UNE GARDE RETIRÉE AVEC L'OBJET QU'ELLE GARDAIT ───
  //
  // Il y avait ici « la fraîcheur n'a pas la couleur de « passer » » : le
  // premier essai avait mis la pastille en corail, à deux centimètres d'un
  // tampon « PASSER » en #FF6B6B — « nouveau » et « refuser » du même signe.
  // La pastille n'existe plus (voir plus haut), donc la garde non plus. On ne
  // la remplace pas par une mesure creuse : la seule chose qu'il reste à
  // vérifier, « aucune carte n'est datée », est faite heure par heure au-dessus.
}

// ═══ 10 · LA CARTE NE SORT PAS PENDANT QU'ELLE QUESTIONNE ═══
//
// « Elle me donne le résultat de notre conversation après une seule question, et
// c'est APRÈS qu'elle me demande le prix. » La carte sortait sans prix, suivie de
// « et c'est à combien ? » : le commerçant ne sait plus s'il doit répondre ou
// appuyer — et s'il appuie, il publie une annonce sans prix à toute la ville.
//
// ET IL EST REVENU, DEUX SEMAINES PLUS TARD : « on me donne le résultat et
// ensuite on me demande le nombre de portions ». C'est nous qui l'avions
// réintroduit, en autorisant la carte à sortir dès qu'UN chiffre était connu
// pour gagner un tour. À l'écran, ça donne une case QUANTITÉ à « — » sous la
// question « combien de portions ? », avec un bouton « C'est bon » dessous.
// Cette section porte donc les deux signalements, et le second en premier.
//
// LA CONSIGNE EST DANS LE PROMPT, MAIS ON NE VÉRIFIE PAS UN PROMPT. On vérifie
// le garde-fou qui tient le jour où le modèle se trompe, c'est-à-dire le jour de
// la démonstration.
console.log("\n══ la carte et la question ══");
{
  const { carteAMontrer } = await import("../src/lib/direct/carte-a-valider.ts");
  const cas = [
    ["Combien de portions avez-vous prévu ?", { prix: "14 €", quantite: null }, false,
      "SA CAPTURE : quantité à « — » pendant qu'elle demande les portions"],
    ["Et c'est à combien ?", { prix: "", quantite: null }, false,
      "prix vide pendant qu'elle demande le prix : pas de carte"],
    ["Et c'est à combien ?", { prix: "14 €", quantite: null }, true,
      "mais le prix est là : cette question-là ne contredit rien"],
    ["Le créneau se libère à 14 h 30, je le mets en ligne ?", { prix: "", quantite: 1 }, true,
      "un créneau n'a pas de prix et doit pouvoir se proposer"],
    ["Vous me le photographiez ?", { prix: "14 €", quantite: null }, true,
      "la photo est la seule question qui accompagne une carte : le bouton y est"],
    ["Je le mets en ligne.", { prix: "", quantite: null }, true,
      "sans question, rien ne retient la carte"],
    ["Et c'est à combien ?", null, false, "pas de carte du tout"],
  ];
  for (const [dit, c, attendu, quoi] of cas) {
    dire(carteAMontrer(dit, c) === attendu, quoi);
  }
}

// ═══ 11 · CE QU'ON POSE SUR L'ÉCRAN D'ACCUEIL S'OUVRE AU BON ENDROIT ═══
//
// « Je n'arrive pas à mettre le lien de l'assistante sur ma page d'accueil du
// téléphone sans que ça me ramène à la page d'accueil clikme.fr. »
//
// LE TÉLÉPHONE NE RETIENT PAS LA PAGE DEPUIS LAQUELLE ON INSTALLE : il retient
// le `start_url` du manifeste. Sans manifeste à elle, une page hérite de celui
// de la racine — qui porte `start_url: "/"` — et devient inatteignable une fois
// posée sur l'écran d'accueil. Le défaut avait été corrigé pour « Autour de
// moi » ; l'assistante est arrivée après, et personne n'y a pensé. Il se
// reproduira à chaque nouvel écran, donc il se vérifie.
console.log("\n══ l'écran d'accueil du téléphone ══");
{
  const aInstaller = ["/autour-de-moi", "/autour-de-moi/assistante"];
  for (const page of aInstaller) {
    const html = await (await fetch(`${BASE}${page}`)).text();
    const lien = /<link rel="manifest" href="([^"]+)"/.exec(html)?.[1] ?? "";
    dire(!!lien && lien !== "/manifest.json",
      `${page} a son propre manifeste (${lien || "aucun"})`);
    if (!lien || lien === "/manifest.json") continue;
    const m = await (await fetch(`${BASE}${lien}`)).json();
    console.log(`  ${page} → ouvre « ${m.start_url} », icône « ${m.short_name} »`);
    // C'EST LA SEULE ASSERTION QUI COMPTE : ce qui s'ouvre est bien cette page.
    dire(m.start_url === page, `et il ouvre cette page-là, pas la racine`);
    // ET IL NE RETOMBE PAS DANS SAFARI AU PREMIER LIEN.
    dire(typeof m.scope === "string" && page.startsWith(m.scope),
      `la navigation reste dans l'application (scope ${m.scope})`);
    // DEUX INSTALLATIONS NE DOIVENT PAS S'ÉCRASER : un commerçant a besoin des
    // deux, la sienne et celle de ses voisins.
    dire(m.id === page, `et il ne remplace pas l'autre installation (id ${m.id})`);
  }
}

// ═══ 12 · L'ÉCHO DU CONTEXTE NE REPART PAS COMME SA PHRASE ═══
//
// Vu sur la capture d'une démonstration : la bulle verte du commerçant — celle
// qui porte SA phrase — contenait le texte de contexte qu'on envoie au service
// de transcription, recopié à l'identique. Sur un enregistrement muet, ces
// modèles rendent ce qu'on leur a soufflé. Léa y a répondu poliment, deux fois.
//
// LE RISQUE SYMÉTRIQUE SERAIT PIRE : rejeter une vraie phrase parce qu'elle
// parle de portions et de prix, ce qui est exactement le métier. Les deux
// moitiés se vérifient donc ensemble.
console.log("\n══ l'écho du contexte ══");
{
  const { estUnEcho } = await import("../src/lib/direct/echo-transcription.ts");
  const CTX =
    "Commerce de proximité à Dax. Le commerçant décrit sa journée : plat du jour, " +
    "arrivage, créneaux libres, prix en euros, nombre de portions ou de pièces.";
  dire(estUnEcho(CTX, CTX), "le contexte entier est reconnu");
  dire(estUnEcho("créneaux libres, prix en euros, nombre de portions ou de pièces", CTX),
    "ses échos partiels aussi");
  dire(estUnEcho("", CTX), "et un texte vide compte comme rien de dit");
  const vraies = [
    "magret de canard avec des frites maison, quatorze euros, j'en ai fait trente",
    "il me reste six portions",
    "on a un arrivage de robes en lin ce matin",
    "le plat du jour c'est la garbure, douze euros",
    "j'ai des créneaux libres cet après-midi à quinze heures",
    "vingt-cinq portions à quatorze euros",
  ];
  const rejetees = vraies.filter((v) => estUnEcho(v, CTX));
  dire(rejetees.length === 0,
    `et aucune vraie phrase de commerçant n'est rejetée${rejetees.length ? " : " + rejetees[0] : ""}`);
}

// ═══ 14 · LE MODÈLE SAIT FAIRE CE QU'ON LUI DEMANDE ═══
//
// LA PANNE MESURÉE, ET ELLE A COÛTÉ UNE JOURNÉE DE TERRAIN : Léa répondait
// « je n'ai pas réussi à vous répondre » à chaque tour, du bonjour jusqu'à la
// fin. On avait changé le modèle pour gagner du rythme — sans voir que la route
// s'appuie sur `output_config` (le schéma JSON de la carte, et l'effort réduit),
// qui n'existe que sur la génération 5. Envoyé à un modèle 4.5, ça répond 400,
// et 400 veut dire panne à tous les tours.
//
// Le défaut ne se voyait NULLE PART ailleurs : le projet compile, les tests
// passent (ils simulent la route), l'écran s'affiche. Il ne se voyait qu'avec
// une vraie clé, c'est-à-dire seulement sur son téléphone. C'est précisément le
// genre de faute qu'un test doit attraper à la place du terrain.
console.log("\n══ le modèle et ce qu'on lui demande ══");
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("src/app/api/direct/assistante/route.ts", "utf8");
  const defaut = src.match(/const MODELE = [^\n]*\|\|\s*"([^"]+)"/)?.[1] ?? "";
  const reglages = /output_config/.test(src);
  console.log(`  modèle par défaut : ${defaut || "(introuvable)"}`);
  console.log(`  réglages génération 5 utilisés : ${reglages ? "oui" : "non"}`);
  dire(!!defaut, "le modèle par défaut se lit dans le fichier");
  // La génération 5 se reconnaît au nom, et elle n'est jamais datée.
  dire(!reglages || /^claude-(opus|sonnet|fable)-5/.test(defaut),
    `le modèle connaît « output_config » (${defaut})`);
  dire(!/-\d{8}$/.test(defaut), "et son nom ne porte pas de date collée à la fin");
  // La panne ne doit plus être muette : elle dit pourquoi.
  dire(/pourquoi/.test(src), "une panne remonte sa raison jusqu'à l'écran");
}

// ═══ CE QUE L'ESSAI D'ONGLES A BESOIN DE TROUVER EN LIGNE ═════════════════
//
// LE DÉFAUT QUE CE BLOC EXISTE POUR ATTRAPER, ET IL A ÉTÉ TROUVÉ SUR UN
// TÉLÉPHONE : `public/mediapipe/` était ignoré par git et reconstitué par
// `direct-build.sh`. Mais la production ne lance pas `direct-build.sh`, elle
// lance `next build`. En ligne, ces deux fichiers répondaient 404, le calcul
// levait une exception, et l'écran retombait sur la photo du catalogue.
//
// LE PROJET COMPILAIT, LES TRENTE-SIX SUITES PASSAIENT, ET L'ÉCRAN S'AFFICHAIT.
// Rien ne pouvait le voir, parce que tout fonctionnait ICI — c'est exactement la
// même famille que le modèle de l'assistante juste au-dessus : une faute qui ne
// se voit qu'en ligne doit être attrapée par un test, pas par le terrain.
console.log("\n══ le moteur de l'essai d'ongles ══");
{
  for (const [chemin, poidsMini] of [
    ["/mediapipe/hand_landmarker.task", 5_000_000],
    ["/mediapipe/vision_wasm_internal.wasm", 5_000_000],
    ["/mediapipe/vision_wasm_internal.js", 50_000],
  ]) {
    let code = 0;
    let poids = 0;
    try {
      const r = await fetch(BASE + chemin);
      code = r.status;
      poids = (await r.arrayBuffer()).byteLength;
    } catch {
      /* code reste à zéro : c'est ce qu'on veut dire */
    }
    dire(
      code === 200 && poids >= poidsMini,
      `${chemin} est servi (${code}, ${(poids / 1048576).toFixed(1)} Mo)`,
    );
  }
}

// ═══ LA ROUTE D'ESSAYAGE RÉPOND-ELLE, ET RÉPOND-ELLE HONNÊTEMENT ? ═══════
//
// MÊME FAMILLE QUE LES DEUX BLOCS AU-DESSUS : une route d'image ne se vérifie
// pas à l'œil, et ce qui ne casse qu'en ligne se paie sur le terrain. On ne
// teste pas la QUALITÉ du rendu — ça demande une vraie clé — mais les trois
// choses qui font qu'un défaut reste invisible : la route existe, elle refuse
// ce qui est illisible, et quand elle ne peut pas travailler elle DIT POURQUOI
// au lieu de rendre n'importe quoi.
console.log("\n══ l'essayage sur soi ══");
{
  const pixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHElEQVQoU2NkYGD4z0AEYBxVSFNAmRoZGRkZAADUAAdSbJQSAAAAAElFTkSuQmCC";
  const poster = async (corps) => {
    try {
      const r = await fetch(`${BASE}/api/direct/essayer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
      });
      return { code: r.status, j: await r.json().catch(() => ({})) };
    } catch (e) {
      return { code: 0, j: { erreur: String(e) } };
    }
  };
  const vide = await poster({});
  dire(vide.code === 400, `une requête sans photo est refusée (${vide.code})`);
  const bon = await poster({ photo: pixel, reference: pixel, partie: "votre main" });
  // Deux issues acceptables, et aucune des deux n'est muette : soit un rendu,
  // soit une panne QUI SE NOMME. Ce qui serait faux, c'est un 200 sans image.
  const rendu = bon.code === 200 && typeof bon.j.image === "string";
  const franc = bon.code >= 400 && !!bon.j.erreur && !!bon.j.pourquoi;
  dire(rendu || franc,
    rendu
      ? `elle rend une image (${bon.code})`
      : `elle dit pourquoi elle ne peut pas (${bon.code} · ${String(bon.j.pourquoi).slice(0, 60)})`);
  dire(bon.code !== 200 || rendu, "et elle ne répond jamais « tout va bien » sans image");
}

// ═══ L'ESSAI EST SEUL À L'ÉCRAN, ET IL PARLE LE MÉTIER ═══════════════════
//
// « Il y a trop de distraction ici avec le mur qui apparaît déjà, alors que ce
// qu'on veut c'est juste essayer sur soi. » Le défaut ne se voyait pas en lisant
// le code : chaque morceau était correct, c'est leur ORDRE qui était faux. Et il
// est du genre à revenir — il suffit qu'un jour un `setEcran("mur")` reparaisse
// dans l'effet de remise à zéro.
//
// ET LE SECOND DÉFAUT NE SE VOIT PAS DU TOUT À L'ŒIL : des textes génériques
// s'installent un par un, chacun sans conséquence, jusqu'à ce que cinq métiers
// disent la même phrase. On compare donc les métiers entre eux.
console.log("\n══ l'essai, et rien d'autre ══");
{
  // PAS `ouvrir` ICI : il attend `.ap-fav2`, qui n'existe que sur la page des
  // cartes. La maquette de jugement des murs est une page à elle.
  const c6 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c6.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const p6 = await c6.newPage();
  p6.on("pageerror", (e) => erreurs.push(String(e)));
  await p6.goto(`${BASE}/autour-de-moi/mur`, { waitUntil: "networkidle" });
  await p6.waitForSelector(".mu-maq button");
  const murs = await p6.$$eval(".mu-maq button", (b) => b.map((x) => x.textContent.trim()));
  const vus = [];
  for (const nom of murs) {
    await p6.click(`.mu-maq button:text-is("${nom}")`);
    await p6.waitForTimeout(260);
    // LE TITRE DE L'ÉCRAN DE LA PHOTO A CHANGÉ DE PLACE, ET C'ÉTAIT VOULU :
    // « Cette bougie, chez vous » puis « Photographiez l'endroit où elle ira »
    // faisaient deux titres empilés, dont aucun ne se lisait. Il ne reste que le
    // second, qui dit ce qu'il faut faire. La garde suit.
    // ═══ UN MUR REMPLI S'OUVRE SUR LUI-MÊME, ET IL FAUT EN SORTIR ═══════
    //
    // « Le fantôme amène sur l'essayage quand personne n'a encore essayé, mais
    // quand une ou plusieurs personnes ont essayé, alors il amène sur le mur
    // des clients. » Depuis cette règle, tous les murs d'essai de cette page
    // s'ouvrent sur leurs clientes : l'écran de la photo est derrière le geste
    // de la tête, et c'est ce geste qu'on mesure aussi — sans lui, on
    // regarderait sept personnes porter la pièce sans pouvoir la porter.
    if (!(await p6.$(".mu-ph-tete h2"))) {
      const essayer = await p6.$(".mu-bas .mu-cta");
      if (essayer) {
        await essayer.click();
        await p6.waitForTimeout(400);
      }
    }
    const tete = await p6
      .$eval(".mu-ph-tete h2", (e) => e.textContent.trim())
      .catch(() => null);
    if (!tete) continue; // un mur d'annonce : il ouvre sur le mur, c'est voulu
    // ═══ C'EST LA PHRASE QUI DOIT ÊTRE UNIQUE, PAS LE TITRE ═══
    //
    // LE TITRE DIT CE QU'ON PHOTOGRAPHIE, et trois métiers demandent VRAIMENT la
    // même photo : « Prenez une photo de vous » chez un coiffeur, une boutique
    // et un lunetier. Exiger qu'ils diffèrent aurait produit trois variantes
    // écrites pour la garde et non pour le client — la pire chose qu'une garde
    // puisse faire.
    //
    // LA PHRASE, ELLE, NOMME LA CHOSE : « cette coupe », « ce look », « cette
    // monture ». Deux métiers qui nomment la même chose sont deux métiers dont
    // l'un a été copié sur l'autre, et c'est exactement ce qu'on mesure ici.
    const phrase = await p6
      .$eval(".mu-ph-tete p", (e) => e.textContent.trim())
      .catch(() => "");
    const geste = await p6.$eval(".mu-cta.plein b", (e) => e.textContent.trim()).catch(() => "");
    const liens = await p6.$$eval(".mu-e-mur", (b) => b.map((x) => x.textContent.trim()));
    // LA FRISE EST REVENUE, ET CE N'EST PLUS LA MÊME. L'ancienne — `.mu-pas`,
    // « 1 · CADRER  2 · CHOISIR  3 · DÉCIDER » — prévenait qu'il allait falloir
    // en faire trois, au-dessus d'un écran qui n'avait rien montré. Celle-ci dit
    // « Je découvre · J'essaie · Je donne mon avis », à la première personne, et
    // son troisième temps est ce qu'on ne devinait pas : la note, le mur, le
    // salon. On garde donc les deux mesures — l'ancienne ne doit pas revenir, la
    // nouvelle doit être là.
    dire(!(await p6.$(".mu-pas")), `${nom} : pas d'ancienne frise 1-2-3`);
    const frise = await p6.$$eval(".mu-frise li", (l) =>
      l.map((e) => e.textContent.replace(/\s+/g, " ").trim()),
    );
    dire(frise.length === 3, `${nom} : la frise dit les trois temps (${frise.length})`);
    dire(!(await p6.$(".mu-rang")), `${nom} : le mur n'est pas là à l'ouverture`);
    dire(liens.length === 1, `${nom} : un seul lien vers le mur (${liens.length})`);
    vus.push({ nom, phrase, geste, mur: liens[0] ?? "" });
  }
  dire(vus.length >= 5, `au moins cinq métiers ouvrent sur l'essai (${vus.length})`);
  // AUCUNE DES TROIS PHRASES NE SE PARTAGE. C'est la seule mesure qui attrape un
  // texte générique : un mot juste chez deux métiers est un mot creux chez les
  // deux.
  for (const champ of ["phrase", "geste", "mur"]) {
    const pris = vus.map((v) => v[champ]);
    const doubles = pris.filter((t, i) => pris.indexOf(t) !== i);
    dire(doubles.length === 0, `le texte « ${champ} » diffère d'un métier à l'autre${doubles.length ? ` — repris : ${doubles[0]}` : ""}`);
  }
  await c6.close();
}

// ═══ L'ANNONCE POUSSE VERS L'ESSAI, PAS VERS TROIS BOUTONS ════════════════
//
// « Pour les métiers coiffeur, onglerie, artisan, tatoueur… l'action principale
// doit être qu'il essaye sur eux ou un meuble, et ensuite qu'il note, que ça
// aille sur le mur du commerçant et qu'ils en parlent avec leurs amis. Donc pour
// ces métiers-là on ne peut pas mettre en gros les trois boutons actuels
// "proposer à mes amis, réserver, et favori" : il faut pousser l'expérience vers
// l'essayage, avec les 3 boutons qu'on avait qui deviennent secondaires sur le
// côté droit. »
//
// CE QUE CETTE GARDE PROTÈGE, ET IL Y A DEUX MOITIÉS. Que l'essai soit BIEN le
// geste plein là où il existe — sinon on revend en gros ce que fait tout le
// monde et en petit ce que personne d'autre ne fait. Et que les métiers SANS
// essai n'aient pas changé d'un point : on ne s'essaie pas une table, et une
// règle écrite pour un coiffeur qui déborde sur un restaurant est le défaut
// qu'on a déjà payé trois fois sur les murs.
console.log("\n══ l'annonce pousse vers l'essai ══");
{
  const cE = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await cE.clock.setFixedTime(new Date(2026, 8, 2, 14, 15, 0));
  await cE.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pE = await cE.newPage();
  pE.on("pageerror", (e) => erreurs.push(String(e)));

  /** Ce que l'annonce propose en grand, et ce qu'elle range à droite. */
  const lire = async (carte) => {
    await pE.goto(`${BASE}/autour-de-moi?carte=${carte}`, { waitUntil: "networkidle" });
    await pE.waitForTimeout(1100);
    return pE.evaluate(() => ({
      plein: document.querySelector(".ap-gestes .ap-agir")?.textContent.trim() ?? "",
      essai: !!document.querySelector(".ap-agir.essayer"),
      promesse: document.querySelector(".ap-essayer-p")?.textContent.trim() ?? "",
      rail: [...document.querySelectorAll(".ap-rail-b")].map((e) =>
        e.textContent.replace(/\s+/g, " ").trim(),
      ),
      duo: !!document.querySelector(".ap-duo"),
      module: !!document.querySelector(".ap-murbul"),
    }));
  };

  const coif = await lire("coif-centre");
  dire(coif.essai, `chez le coiffeur, le geste plein est l'essai (« ${coif.plein} »)`);
  dire(
    /essayer/i.test(coif.plein),
    "et il dit « essayer », pas « proposer à mes amis »",
  );
  dire(
    /coupe/i.test(coif.promesse),
    `la promesse nomme la chose du métier (« ${coif.promesse} »)`,
  );
  // LES TROIS ANCIENS GESTES SONT TOUS LÀ, ET AUCUN N'A DISPARU EN CHEMIN. Une
  // refonte qui pousse vers l'essai en perdant « réserver » aurait coûté le seul
  // geste qui rapporte quelque chose au commerçant.
  dire(coif.rail.length === 3, `les trois anciens gestes passent à droite (${coif.rail.length})`);
  dire(
    coif.rail.some((t) => /parler/i.test(t)) &&
      coif.rail.some((t) => /rendez-vous|réserv/i.test(t)) &&
      coif.rail.some((t) => /favori|gard/i.test(t)),
    `et ce sont bien les trois (${coif.rail.join(" · ")})`,
  );
  dire(!coif.duo, "la rangée d'avant a disparu, elle ne double pas le rail");

  // ═══ LA DEUXIÈME PORTE DU MUR ═══════════════════════════════════════════
  //
  // « Sur l'annonce, le petit module sous la fiche commerce s'adapte : 👻 38
  // essayages de ce pantalon — Voir ce qu'ils en pensent. »
  //
  // ON ENTRAIT DANS LE MUR PAR LE FANTÔME DE LA BARRE DU BAS, un bouton que
  // rien ne présentait. Le module le dit en toutes lettres, à l'endroit où l'on
  // hésite : juste avant d'essayer soi-même.
  //
  // LE COMPTE EST CELUI DU MUR, PAS UN NOMBRE ÉCRIT DANS L'ÉCRAN. C'est la
  // seule façon de ne pas fabriquer de preuve sociale, et c'est la règle de
  // tout ce dépôt — la même qui a fait retirer les « 128 » et « 24 » du rail.
  // ═══ LE MODULE EST DEVENU UNE BULLE, ET ELLE S'EN VA ═══════════════════
  //
  // « Cette section prend trop de place, et c'est juste une pop-up qui doit
  // rester 3 ou 4 secondes quand des gens ont déjà pris des photos. »
  //
  // ON L'ATTEND PLUTÔT QUE DE LA CHERCHER : elle arrive neuf dixièmes de
  // seconde après la carte — exprès, pour ne pas être lue comme une partie de
  // l'annonce — et elle repart à cinq. Une garde qui regarde trop tôt conclut
  // qu'elle n'existe pas ; une qui regarde trop tard, qu'elle a disparu. Les
  // deux sont fausses.
  await pE.waitForSelector(".ap-murbul", { timeout: 4000 }).catch(() => null);
  const module = await pE.evaluate(() => {
    const e = document.querySelector(".ap-murbul");
    if (!e) return null;
    return {
      mot: e.querySelector("b")?.textContent.replace(/\s+/g, " ").trim() ?? "",
      lien: e.querySelector("em")?.textContent.replace(/\s+/g, " ").trim() ?? "",
      fantomes: e.querySelectorAll(".ap-murbul-s").length,
    };
  });
  dire(!!module, "une bulle dit combien de gens ont déjà essayé, et où le voir");
  dire(
    !!module && /^\d+ (essayage|projection)s? de /.test(module.mot),
    `et elle compte dans les mots du métier (« ${module?.mot ?? "absent"} »)`,
  );
  dire(
    !!module && /voir/i.test(module.lien),
    `le lien dit où ça mène (« ${module?.lien ?? "absent"} »)`,
  );
  dire(
    !!module && module.fantomes > 0 && module.fantomes <= 4,
    `et ce sont des fantômes, pas des visages inventés (${module?.fantomes ?? 0})`,
  );

  // ═══ ON N'ESSAIE PAS UNE TABLE, MAIS L'ÉCRAN A CHANGÉ QUAND MÊME ═════════
  //
  // CETTE GARDE DISAIT « leur écran ne doit pas avoir bougé d'un point », et
  // c'était l'arbitrage du jour où l'essai est passé en geste plein : on ne
  // touchait alors qu'aux métiers qui s'essaient.
  //
  // « Le design des restaurants, bars et événements n'a pas été modifié comme
  // sur le screenshot que je t'avais donné. » La maquette leur donne le même
  // rail de trois pastilles, et un geste plein qui est la réservation. Ce qui
  // NE CHANGE PAS, et c'est ce qui reste mesuré : on ne s'essaie toujours pas
  // une table — ni bouton d'essai, ni module de mur d'essai.
  for (const [carte, quoi] of [["centre", "un restaurant"], ["boulange", "une boulangerie"]]) {
    const c = await lire(carte);
    dire(!c.essai, `${quoi} garde ce qui compte : pas de bouton d'essai`);
    dire(c.rail.length === 3, `${quoi} : et il a son rail de trois gestes (${c.rail.length})`);
    dire(!c.module, `${quoi} : pas de module de mur d'essai non plus`);
  }
  await cE.close();
}

// ═══ L'ESSAI SE JOUE EN TROIS TEMPS ═══════════════════════════════════════
//
// « Je te l'ai fait en maquettes pour que cet enchaînement soit scrupuleusement
// respecté : il essaye sur lui, ensuite il note, ça va sur le mur du commerçant,
// et ils en parlent avec leurs amis. »
//
// LE RENDU FAISAIT HUIT CHOSES SUR UN ÉCRAN — montrer, faire noter, proposer
// d'acheter, de passer, d'en parler, d'en essayer un autre, de dire que c'était
// raté, de reprendre la photo — et la note, la seule que ce produit soit seul à
// savoir recueillir, était perdue au milieu. Cette garde mesure que les deux
// moitiés restent séparées : REGARDER, puis DIRE CE QU'ON EN PENSE.
//
// ELLE SE JOUE CHEZ LA CIRIÈRE, et c'est la seule qui puisse la jouer ici : son
// rendu se calcule dans le navigateur, sans clé et sans réseau. Tout ce qui se
// porte sur le corps passe par un modèle d'image, dont cet environnement n'a
// aucune clé — voir l'en-tête de `essayer/route.ts`.
console.log("\n══ l'essai se joue en trois temps ══");
{
  const c3 = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await c3.clock.setFixedTime(new Date(2026, 8, 2, 14, 15, 0));
  await c3.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const p3 = await c3.newPage();
  p3.on("pageerror", (e) => erreurs.push(String(e)));
  // `exemple=1` REMPLACE LE BOUTON « Voir avec la photo d'exemple », retiré de
  // l'écran sur sa demande. Le chemin, lui, est resté : c'est le seul moyen
  // d'atteindre le rendu sans appareil photo, et cette suite n'en a pas.
  await p3.goto(`${BASE}/autour-de-moi?carte=cirier&essai=1&exemple=1`, { waitUntil: "networkidle" });
  await p3.waitForSelector(".mu-frise", { timeout: 15000 });

  const ou = () => p3.$eval(".mu-frise li.ici", (e) => e.textContent.replace(/\s+/g, " ").trim());
  dire(/découvre/i.test(await ou()), "on arrive sur « je découvre »");

  await p3.locator(".mu-pieces button:not([disabled])").first().click();
  await p3.waitForSelector(".mu-mi", { timeout: 30000 });
  await p3.waitForTimeout(900);
  dire(/essaie/i.test(await ou()), "le rendu est le deuxième temps, « j'essaie »");

  // LA GLISSIÈRE EST LA DÉMONSTRATION. Deux photos qu'on ne peut pas comparer au
  // même endroit ne prouvent rien : c'est le trait qui passe sur sa propre photo
  // qui fait comprendre que la pièce a été posée sur soi.
  const mi = await p3.evaluate(() => {
    const b = document.querySelector(".mu-mi");
    return {
      trait: !!b?.querySelector(".mu-mi-t"),
      champ: !!b?.querySelector("input.mu-mi-r"),
      avant: getComputedStyle(b.querySelector(".mu-mi-av")).clipPath,
      pastilles: [...b.querySelectorAll(".mu-mi-e")].map((e) => e.textContent.trim()),
    };
  });
  dire(mi.trait && mi.champ, "on compare en tirant un trait, pas en maintenant");
  dire(
    mi.pastilles.join("/") === "Avant/Après",
    `et les deux moitiés sont nommées (${mi.pastilles.join(" / ")})`,
  );
  // LE « AVANT » EST DÉCOUPÉ, PAS RÉTRÉCI : sans ça on comparerait un visage
  // comprimé à un visage normal, c'est-à-dire deux visages différents.
  dire(/inset/.test(mi.avant), `le calque du dessus est découpé (${mi.avant.slice(0, 40)})`);

  // LE DEUXIÈME TEMPS NE DÉCIDE RIEN. Ni la note, ni « je réserve », ni « je
  // passe » : il ne sert qu'à regarder, et c'est ce qui permet au troisième
  // d'exister.
  dire(
    !(await p3.$(".mu-note-f")),
    "on ne note pas encore : le deuxième temps ne sert qu'à regarder",
  );
  await p3.getByRole("button", { name: /Je donne mon avis/i }).click();
  await p3.waitForTimeout(500);
  dire(/avis/i.test(await ou()), "« Je donne mon avis » ouvre le troisième temps");

  const avis = await p3.evaluate(() => ({
    question: document.querySelector(".mu-avis-q")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    fantomes: document.querySelectorAll(".mu-note-f.grand button").length,
    mot: !!document.querySelector(".mu-mot textarea"),
  }));
  dire(/ça vous plaît/i.test(avis.question), `l'écran pose sa question (« ${avis.question} »)`);
  dire(avis.fantomes === 5, `on note de un à cinq fantômes (${avis.fantomes})`);
  // ON NE DEMANDE PAS UN COMMENTAIRE À QUELQU'UN QUI N'A PAS ENCORE DIT SI ÇA LUI
  // PLAISAIT : la question est posée à l'envers.
  dire(!avis.mot, "et on ne demande pas encore d'écrire quoi que ce soit");

  await p3.locator(".mu-note-f.grand button").nth(3).click();
  await p3.waitForTimeout(400);
  const apres = await p3.evaluate(() => ({
    compte: document.querySelector(".mu-avis-n")?.textContent.trim() ?? "",
    dit: document.querySelector(".mu-avis-m")?.textContent.trim() ?? "",
    etiquette: document.querySelector(".mu-mot label")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    plafond: document.querySelector(".mu-mot textarea")?.getAttribute("maxlength") ?? "",
    part: document.querySelector(".mu-part")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    coche: document.querySelector(".mu-part")?.getAttribute("aria-pressed") ?? "",
  }));
  dire(/4 fantômes sur 5/.test(apres.compte), `le compte se lit (« ${apres.compte} »)`);
  // TROIS SUR CINQ NE VEUT RIEN DIRE tant que personne n'a écrit ce que trois
  // signifie — et « bien » n'est pas « ça, c'est moi ».
  dire(apres.dit.length > 0, `et le mot dit ce que quatre veut dire (« ${apres.dit} »)`);
  // ═══ LE PETIT MOT, ET C'EST LUI QU'ON LIRA SUR LE MUR ═══
  // Quatre fantômes disent qu'elle a aimé ; « je ne pensais pas qu'il m'irait
  // aussi bien » dit ce qui a décidé, et c'est ça que le suivant vient lire.
  dire(
    /optionnel/i.test(apres.etiquette) && apres.plafond === "200",
    `on peut écrire un mot, facultatif et plafonné (« ${apres.etiquette} », ${apres.plafond})`,
  );
  // ═══ ET RIEN NE PART SANS LA CASE ═══
  // L'écran de la photo promet que rien n'est partagé sans accord : la case est
  // le seul endroit où cette promesse se tient, et elle doit rester VISIBLE.
  dire(
    /au mur du commerçant/i.test(apres.part),
    `la case dit où va l'essai (« ${apres.part.slice(0, 70)} »)`,
  );
  dire(apres.coche === "true", "elle est cochée d'avance, et elle se décoche d'un appui");

  // ═══ LE QUATRIÈME ÉCRAN : CE QU'ON PEUT FAIRE MAINTENANT ═══
  await p3.getByRole("button", { name: /^Continuer/ }).click();
  await p3.waitForTimeout(600);
  const agir = await p3.evaluate(() => ({
    merci: document.querySelector(".mu-fete-t")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    dit: document.querySelector(".mu-fete-p")?.textContent.replace(/\s+/g, " ").trim() ?? "",
    gestes: [...document.querySelectorAll(".mu-agir-b")].map((e) =>
      e.querySelector("b")?.textContent.trim() ?? "",
    ),
    plein: document.querySelector(".mu-agir-b.plein b")?.textContent.trim() ?? "",
    preuve: !!document.querySelector(".mu-rendu-preuve"),
    // LA CONFIRMATION N'ARRIVE QU'APRÈS LE GESTE : on vient d'arriver, on n'a
    // rien demandé à personne, donc l'écran ne doit rien confirmer.
    envoi: !!document.querySelector(".mu-envoi"),
  }));
  dire(/merci/i.test(agir.merci), `l'écran remercie (« ${agir.merci} »)`);
  dire(
    /rejoint le mur/i.test(agir.dit),
    `et il dit où l'essai est parti (« ${agir.dit.slice(0, 60)} »)`,
  );
  dire(agir.preuve, "il montre ce qui vient d'être posé, au lieu de le dire");
  dire(!agir.envoi, "et il ne confirme aucun message qu'on n'a pas demandé");
  dire(agir.gestes.length === 3, `trois suites, et pas une de plus (${agir.gestes.length})`);
  // LE SALON PASSE DEVANT, ET C'EST UN RENVERSEMENT. « Je réserve » était le
  // geste plein depuis le début : celui qui demande finit par réserver, tandis
  // que celui à qui l'on demande de réserver tout de suite referme.
  dire(/salon/i.test(agir.plein), `le salon est le geste plein (« ${agir.plein} »)`);
  dire(
    agir.gestes.some((t) => /favori/i.test(t)),
    `et le favori ferme la marche (${agir.gestes.join(" / ")})`,
  );
  await c3.close();
}

// ═══ CHAQUE MÉTIER A SES MOTS, ET LE RITUEL NE CHANGE JAMAIS ══════════════
//
// « Ne surtout pas inventer quatre parcours différents. Le parcours ClikMe doit
// devenir reconnaissable : je découvre, j'essaie sur moi, je donne mon avis, mon
// essai rejoint éventuellement le mur, j'agis. En revanche, l'étape "j'essaie"
// et surtout l'action finale doivent changer selon le métier. »
//
// C'EST LA RÈGLE LA PLUS DIFFICILE À TENIR DANS LE TEMPS. Un parcours identique
// partout dérive vers des mots génériques — « essayer ce produit », « réserver »
// — et un vocabulaire par métier dérive vers quatre parcours. Cette garde mesure
// les deux à la fois : la MÉCANIQUE est la même sur les huit murs, les MOTS ne
// se répètent jamais d'un métier à l'autre.
//
// ELLE LIT LES DONNÉES, PAS L'ÉCRAN. Ces huit métiers demandent huit photos
// différentes — une main, un poignet, une table, un visage, un buste, un
// avant-bras — et aucun navigateur ne peut les prendre ici. Ce qui se mesure est
// donc ce qui se décide : les mots du métier, dans `fantomes.ts`.
console.log("\n══ chaque métier a ses mots, le rituel n'en a qu'un ══");
{
  const src = readFileSync("src/lib/direct/fantomes.ts", "utf8");
  /**
   * CE QUI DOIT ÊTRE UNIQUE, ET CE QUI A LE DROIT DE SE RÉPÉTER.
   *
   * PREMIER JET, ET IL ÉTAIT FAUX : il exigeait que `surMoi` diffère aux huit
   * murs. Or quatre métiers disent vraiment « Essayer sur moi » — un bijou, une
   * coupe, un vêtement, une monture se portent tous sur le corps — et trois
   * disent vraiment « Prenez une photo de vous ». Les forcer à différer aurait
   * produit des variantes écrites pour la garde, pas pour le client, et c'est
   * la pire chose qu'une garde puisse faire.
   *
   * CE QUI NE PEUT PAS SE RÉPÉTER, C'EST CE QUI NOMME LA CHOSE : « cette
   * coupe », « ce bouquet », et la promesse qui la contient. Deux métiers qui
   * nomment la même chose sont deux métiers dont l'un a été copié sur l'autre.
   */
  const champs = ["promesse", "ceci"];
  const communs = ["surMoi", "voirLeMur", "photoTitre", "photoSous"];
  const pris = {};
  for (const c of [...champs, ...communs]) {
    // INDIFFÉRENT À L'INDENTATION : ces champs ont été écrits par un script, et
    // le prochain les réindentera. Une garde qui compte les espaces mesure la
    // mise en forme, pas le produit.
    pris[c] = [...src.matchAll(new RegExp(`^\\s*${c}: "([^"]+)"`, "gm"))].map((m) => m[1]);
  }
  dire(
    [...champs, ...communs].every((c) => pris[c].length === 8),
    `les huit métiers ont tous leurs mots (${[...champs, ...communs].map((c) => `${c}×${pris[c].length}`).join(" ")})`,
  );
  for (const c of champs) {
    const doubles = pris[c].filter((t, i) => pris[c].indexOf(t) !== i);
    dire(
      doubles.length === 0,
      `« ${c} » ne se répète jamais d'un métier à l'autre${doubles.length ? ` — repris : ${doubles[0]}` : ""}`,
    );
  }
  // ON N'ESSAIE PAS UN BOUQUET, ON LE PROJETTE. C'est la distinction la plus
  // importante de ce fichier : ce qui se porte SUR LE CORPS s'essaie, ce qui se
  // pose DANS UN LIEU se projette. Les deux doivent exister, sinon le mot est
  // devenu générique sans que personne s'en aperçoive.
  const verbes = [...src.matchAll(/^\s*essayage: "(\w+)",/gm)].map((m) => m[1]);
  dire(verbes.length === 8, `chaque métier dit s'il essaie ou s'il projette (${verbes.length})`);
  dire(
    verbes.includes("essayage") && verbes.includes("projection"),
    `et les deux verbes existent (${verbes.filter((v) => v === "essayage").length} essaient, ${verbes.filter((v) => v === "projection").length} projettent)`,
  );
  // L'ACTION FINALE CHANGE AVEC LE MÉTIER, et c'est la seule chose du rituel qui
  // change. « Réserver » tout court se lit « une table », et personne ne réserve
  // une coupe de cheveux.
  const actions = [...src.matchAll(/agir: \{ picto: "\w+", titre: "([^"]+)"/g)].map((m) => m[1]);
  // ET AUCUN MOT COMMUN N'EST TOMBÉ EN CHEMIN : ils ont le droit de se répéter,
  // pas de disparaître. Un métier sans `surMoi` n'a plus de bouton.
  dire(
    communs.every((c) => pris[c].every((t) => t.trim().length > 2)),
    "et les mots partagés sont écrits partout, même quand ils se ressemblent",
  );
  dire(actions.length === 8, `chaque métier a son action finale (${actions.length})`);
  dire(
    new Set(actions).size >= 6,
    `et elles ne se ressemblent pas (${[...new Set(actions)].join(" · ")})`,
  );
  // QUATRE CONSEILS DE CADRAGE PAR MÉTIER, et pas trois : ce sont eux qui
  // décident de la qualité du rendu, et c'est la dernière chose qu'on puisse
  // encore corriger.
  // ON NE COMPTE PAS LA DÉCLARATION DE TYPE. `conseils: [Conseil, Conseil…]`
  // ressemble à un huitième métier et n'en est pas un : neuf au lieu de huit.
  const conseils = [...src.matchAll(/conseils: \[\n/g)].length;
  dire(conseils === 8, `chaque métier donne ses conseils de cadrage (${conseils})`);
}

// ═══ LE MUR QUI S'OUVRE EST CELUI DU COMMERCE QU'ON REGARDE ══════════════
//
// « Je suis sur une annonce de fleuriste — "Bouquet du jour · Fleurs de saison ·
// 15 €" — et quand je clique sur le fantôme, au lieu d'avoir le texte coordonné
// avec l'annonce, j'ai "Cette bougie, chez vous". »
//
// C'EST LA TROISIÈME FOIS QUE CE DÉFAUT REVIENT, ET C'EST POUR ÇA QU'IL A UNE
// GARDE. Le coiffeur tombait sur l'onglerie, le prêt-à-porter sur la
// bijoutière, la fleuriste et l'hypnothérapeute sur la cirière. À chaque fois
// c'était un repli écrit quand trois murs devaient couvrir dix-huit commerces,
// et à chaque fois il a survécu au mur qu'on venait d'ajouter — parce qu'un
// repli vers un mur d'essai A L'AIR DE MARCHER. L'écran s'affiche, les boutons
// répondent, et seuls les MOTS sont ceux d'un autre métier. Rien dans le code
// ne peut le voir ; il faut ouvrir le fantôme et lire.
//
// LA GARDE MARCHE DANS LE VRAI PAQUET, pas dans la maquette : c'est là que le
// routage a lieu, et la maquette en avait justement une copie divergente.
console.log("\n══ l'annonce et son mur disent la même chose ══");
{
  const ATTENDU = [
    ["Une fleuriste du marché", /bouquet/i],
    ["Une prothésiste ongulaire", /ongle|main|pose/i],
    ["Une cirière", /bougie/i],
    ["Une créatrice de bijoux", /bijou|poignet/i],
    ["Un salon du centre", /coupe/i],
    ["Un salon qui vient d’ouvrir", /coupe/i],
    ["Une boutique de la rue piétonne", /look|vous/i],
    ["Une friperie du vieux centre", /look|vous/i],
    // ON N'ESSAIE PAS UNE SÉANCE D'HYPNOSE. « artisan » est un sac qui
    // contenait une cirière, une bijoutière ET un hypnothérapeute : celui-ci
    // recevait « Photographier ma table ». Il doit n'avoir aucun essai.
    ["Un hypnothérapeute", null],
  ];
  const { ctx: c7, p: p7 } = await ouvrir("/autour-de-moi", 12.5);
  const vus = new Map();
  // ON PARCOURT LE PAQUET ET ON NOTE CE QU'ON CROISE. La carte du dessus est
  // celle SANS « dessous » — l'autre est la suivante, déjà dans le DOM.
  for (let i = 0; i < 24 && vus.size < ATTENDU.length; i++) {
    const chez = await p7
      .locator(".cd-carte:not(.dessous) .cd-chez")
      .first()
      .textContent()
      .catch(() => null);
    const nom = (chez ?? "").split("·")[0].trim();
    const cible = ATTENDU.find(([n]) => n === nom);
    if (cible && !vus.has(nom)) {
      await p7.click(".ap-monfantome");
      await p7.waitForTimeout(900);
      // MÊME CORRECTION QUE PLUS HAUT : le titre de l'écran de la photo a
      // remplacé celui du métier, parce que deux titres empilés ne se lisaient
      // ni l'un ni l'autre. C'est lui qui doit maintenant parler du bon métier.
      // ON LIT LE BLOC ENTIER — titre ET phrase — parce que c'est la PHRASE qui
      // nomme la chose : le titre dit ce qu'il faut photographier (« Prenez
      // votre main en photo »), la phrase dit ce qu'on va y poser (« Essayez
      // cette pose sur vous »). C'est la seconde qui trahit un mur mal aiguillé.
      // ET ON FRANCHIT LE MUR QUAND IL Y EN A UN. Un mur d'essai déjà rempli
      // s'ouvre sur ses clientes — c'est la règle du fantôme — et l'écran de la
      // photo est derrière le geste flottant de son bas. Sans ce pas, la garde lisait
      // « aucun essai » sur sept métiers qui en ont un.
      const essayer = await p7.$(".mu-bas .mu-cta");
      if (essayer) {
        await essayer.click();
        await p7.waitForTimeout(500);
      }
      const titre = await p7
        .locator(".mu-ph-tete")
        .textContent()
        .catch(() => null);
      vus.set(nom, titre ? titre.trim() : null);
      const x = await p7.$(".ap-f-x");
      if (x) await x.click();
      await p7.waitForTimeout(400);
    }
    // LE BOUTON SE DÉSACTIVE EN FIN DE PAQUET, et un clic qui attend trente
    // secondes sur un bouton mort fait passer une garde pour une panne.
    const suiv = await p7.$(".cd-suiv, .cd-passer, [aria-label*='suivant' i]");
    if (!suiv || !(await suiv.isEnabled())) break;
    await suiv.click();
    await p7.waitForTimeout(420);
  }
  for (const [nom, motif] of ATTENDU) {
    if (!vus.has(nom)) continue; // pas croisé à cette heure-ci : on ne juge pas
    const titre = vus.get(nom);
    dire(
      motif ? !!titre && motif.test(titre) : titre === null,
      motif
        ? `${nom} → « ${titre ?? "aucun essai"} »`
        : `${nom} n'a pas d'essai, et c'est voulu${titre ? ` — or il dit « ${titre} »` : ""}`,
    );
  }
  dire(vus.size >= 3, `au moins trois commerces d'essai croisés dans le paquet (${vus.size})`);
  await c7.close();
}

// ═══ UNE SEULE STRUCTURE, NEUF LANGAGES ══════════════════════════════════
//
// « Ne conçois pas neuf types d'annonces. Conçois un système d'annonces qui
// sait parler neuf langages. »
//
// LA GARDE MESURE LES DEUX MOITIÉS DE CETTE PHRASE, et elle doit les mesurer
// ENSEMBLE : chacune prise seule est facile à satisfaire, et les satisfaire
// séparément donne soit neuf applications, soit une seule voix.
//
//   · NEUF LANGAGES — l'accent, le ton du titre, le mot de ce qu'on compte et
//     le verbe du geste doivent DIFFÉRER d'un métier à l'autre. Le défaut
//     mesuré : un bar proposait « Réserver mon plat », écrit dans une chaîne de
//     ternaires à quatorze mille lignes du début du fichier, où « bar » figurait
//     depuis le premier jour.
//   · UNE STRUCTURE — l'ordre des blocs et le grand bouton doivent être les
//     MÊMES. C'est le garde-fou de l'autre : neuf personnalités qui déplacent
//     chacune un bloc, ce sont neuf applications.
console.log("\n══ neuf langages, une seule structure ══");
{
  const { ctx: c8, p: p8 } = await ouvrir("/autour-de-moi", 12.5);
  const vus = new Map();
  for (let i = 0; i < 22; i++) {
    const d = await p8.evaluate(() => {
      const c = document.querySelector(".cd-carte:not(.dessous)");
      if (!c) return null;
      const h2 = c.querySelector(".cd-offre");
      return {
        cle: [...c.classList].find((x) => x.startsWith("m-")) ?? null,
        accent: getComputedStyle(c).getPropertyValue("--cd-accent").trim(),
        ton: [...(h2?.classList ?? [])].find((x) => x.startsWith("t-")) ?? null,
        // « ON DIT TROIS QUOI » — et le compte a changé d'élément. Il vivait
        // seul sous le prix (`cd-encore`) ; il est passé dans la fiche à quatre
        // lignes que demande la maquette, première ligne. Le mot, lui, doit
        // toujours être là : « il reste 3 » est vrai partout et ne veut rien
        // dire nulle part.
        unite: (c.querySelector(".cd-infos li:first-child span")?.textContent ?? "")
          .replace(/\d+/g, "")
          .trim(),
        // LA STRUCTURE : l'ordre dans lequel les blocs apparaissent.
        ordre: [...c.querySelectorAll(".cd-nature,.cd-offre,.cd-prixg,.cd-infos,.cd-chez")]
          .map((e) => e.className.split(" ")[0])
          .join(">"),
      };
    });
    if (d?.cle && !vus.has(d.cle)) {
      const geste = (await p8.locator(".ap-agir.engage").textContent().catch(() => "")).trim();
      vus.set(d.cle, { ...d, geste });
    }
    const suiv = await p8.$(".cd-suiv, .cd-passer, [aria-label*='suivant' i]");
    if (!suiv || !(await suiv.isEnabled())) break;
    await suiv.click();
    await p8.waitForTimeout(420);
  }
  const l = [...vus.values()];
  dire(l.length >= 6, `au moins six langages croisés dans le paquet (${l.length})`);

  // AUCUN ACCENT NE SE PARTAGE. Deux métiers de la même couleur, c'est deux
  // métiers qu'on confond au premier coup d'oeil — la demande exacte.
  const accents = l.map((x) => x.accent);
  dire(
    new Set(accents).size === accents.length,
    `chaque langage a sa couleur (${new Set(accents).size}/${accents.length})`,
  );
  // LE VERBE DU GESTE NE SE PARTAGE PAS NON PLUS, sauf là où il est vrai deux
  // fois : on prend bien rendez-vous chez un coiffeur ET chez une prothésiste.
  const gestes = l.map((x) => x.geste).filter(Boolean);
  dire(
    new Set(gestes).size >= gestes.length - 1,
    `le verbe du geste suit le métier (${new Set(gestes).size}/${gestes.length}) : ${[...new Set(gestes)].join(" · ")}`,
  );
  // ON DIT TROIS QUOI. « Il reste 3 » est vrai partout et ne veut rien dire
  // nulle part.
  const unites = l.map((x) => x.unite).filter((u) => u && u.length > 8);
  dire(
    new Set(unites).size >= 3,
    `ce qu'on compte porte un nom (${[...new Set(unites)].join(" · ") || "aucun"})`,
  );

  /**
   * ET LA STRUCTURE NE BOUGE PAS — MAIS UN BLOC ABSENT N'EST PAS UN DÉSORDRE.
   *
   * Premier jet de cette garde : « trois agencements », donc échec. C'était LA
   * GARDE qui avait tort. Un bar sans prix n'a pas de bloc prix, une annonce
   * sans compte n'a pas de « il reste » — et c'est voulu : « les blocs 2 et 4
   * sont OPTIONNELS ; s'ils sont vides, le composant se replie proprement sans
   * casser le rythme visuel ». Comparer les chaînes entières mesurait donc la
   * présence, pas l'ordre.
   *
   * CE QU'IL FAUT VÉRIFIER EST QUE CE QUI EST LÀ EST DANS LE BON ORDRE : la
   * suite des blocs présents doit être une sous-suite de l'ordre canonique.
   * Replier un bloc est permis ; en déplacer un ne l'est pas.
   */
  // `cd-encore` EST DEVENU `cd-infos` : le compte ne vit plus seul sous le prix,
  // il est la première des quatre lignes de la fiche. Même place dans l'ordre,
  // autre nom — et l'ordre est ce que cette garde protège.
  const CANON = ["cd-nature", "cd-offre", "cd-prixg", "cd-infos", "cd-chez"];
  const dansLOrdre = (suite) => {
    let i = 0;
    for (const bloc of suite) {
      const j = CANON.indexOf(bloc, i);
      if (j < 0) return false;
      i = j + 1;
    }
    return true;
  };
  const horsOrdre = l.filter((x) => x.ordre && !dansLOrdre(x.ordre.split(">")));
  dire(
    horsOrdre.length === 0,
    `l'ordre des blocs est le même d'un métier à l'autre${
      horsOrdre.length ? ` — ${horsOrdre[0].cle} : ${horsOrdre[0].ordre}` : ""
    }`,
  );
  await c8.close();
}

// ═══ CE QU'ON DÉPOSE SE VOIT, IL NE SE RACONTE PAS ══════════════════════
//
// « Quand je prends une photo et que je dis "je prends rendez-vous" ou "je
// passe", je n'ai pas l'impression que c'est sauvegardé sur le mur du
// commerçant. »
//
// MESURÉ AVANT DE CORRIGER : ÇA L'ÉTAIT. La mémoire contenait le dépôt et
// « Vous » figurait bien sur le mur. Ce qui manquait était la PREUVE — on ne
// voyait sa carte nulle part au moment de décider, et l'écran se contentait
// d'écrire « votre essai est sur le mur ». Une phrase n'est pas une preuve, et
// un produit qui affirme au lieu de montrer n'est pas cru.
//
// LA GARDE VÉRIFIE LES DEUX MOITIÉS, parce que l'une sans l'autre ne vaut rien :
// la carte est à l'écran au moment de la décision, ET elle est réellement dans
// la mémoire du téléphone. Montrer sans écrire serait le mensonge inverse.
console.log("\n══ ce qu'on dépose se voit et s'écrit ══");
{
  /**
   * CETTE GARDE OUVRE SON PROPRE NAVIGATEUR, ET C'EST POUR UNE RAISON PRECISE.
   *
   * `ouvrir` collecte les erreurs de console dans le compte global. Or cette
   * garde-ci ESSAIE DES PIECES jusqu'a en trouver une qui rende — et sur un
   * serveur sans cle d'image, les autres repondent 503. C'est le comportement
   * attendu, honnete, et deja mesure par le bloc « l'essayage sur soi ». Le
   * laisser tomber dans le compte global faisait echouer la garde SUR SA PROPRE
   * METHODE : elle fabriquait l'erreur qu'elle signalait ensuite.
   */
  const cA = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await cA.addInitScript(() => {
    try { localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])); } catch {}
  });
  await cA.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pA = await cA.newPage();
  pA.on("pageerror", (e) => erreurs.push(String(e)));
  await pA.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await pA.waitForSelector(".ap-fav2");
  await pA.waitForTimeout(4600);
  /**
   * ON VISE LA CIRIÈRE, ET C'EST UN CHOIX DE MESURE.
   *
   * Les autres métiers d'essai passent par le modèle d'image, donc par une clé
   * — que ce conteneur n'a pas. Leur rendu échoue, il n'y a pas de décision à
   * prendre, et la garde se contenterait de dire « pas de décision » en
   * passant : une garde qui ne mesure rien est pire qu'une garde absente,
   * parce qu'elle rassure.
   *
   * LA BIJOUTIÈRE ET LA CIRIÈRE, ELLES, RENDENT SANS SORTIR DU NAVIGATEUR —
   * une paire photographiée à l'avance pour l'une, un PNG détouré posé sur un
   * gabarit mesuré pour l'autre. Le dépôt qui suit est le même pour tous les
   * métiers : c'est lui qu'on vérifie, pas le moteur. On accepte les deux,
   * parce que le paquet ne montre pas les mêmes commerces à toute heure.
   */
  let trouve = false;
  for (let i = 0; i < 22; i++) {
    const n = await pA.$eval(".ap-loin-t b", (e) => e.textContent.trim()).catch(() => "");
    if (/bijou|cirière|ciriere/i.test(n)) { trouve = true; break; }
    const b = await pA.$(".ap-suiv");
    if (!b || !(await b.isEnabled())) break;
    await b.click();
    await pA.waitForTimeout(400);
  }
  if (!trouve) {
    console.log("   (ni bijoutière ni cirière croisées à cette heure-ci)");
  } else {
    await pA.click(".ap-monfantome");
    await pA.waitForTimeout(1000);
    // ON DEPOSE UNE PHOTO DANS LA PHOTOTHEQUE : la garde n'a pas d'appareil, et
    // ce chemin dépose exactement le même fantôme. Voir `deposerUnePhoto`.
    await deposerUnePhoto(pA);
    /**
     * ON ESSAIE LES PIÈCES JUSQU'À CE QU'UNE RENDE.
     *
     * Sur ce conteneur il n'y a pas de clé d'image : les pièces qui passent par
     * le modèle répondent 503, l'écran le dit honnêtement et ne propose AUCUNE
     * décision — ce qui est le bon comportement, mais ne mesure rien. Certaines
     * pièces rendent pourtant sans sortir du navigateur (une paire
     * photographiée à l'avance, un PNG détouré sur un gabarit). La garde les
     * cherche au lieu de supposer que la première marche.
     */
    const combien = await pA.$$eval(".mu-pieces button:not([disabled])", (l) => l.length);
    let passe = null;
    for (let k = 0; k < combien && !passe; k++) {
      const boutons = await pA.$$(".mu-pieces button:not([disabled])");
      if (!boutons[k]) break;
      await boutons[k].click();
      await pA.waitForTimeout(7000);
      passe = await pA.$(".mu-rendu-g .non");
      if (!passe) {
        const retour = await pA.$(".mu-exemple, .mu-e-autres");
        if (retour) await retour.click();
        await pA.waitForTimeout(500);
      }
    }
    {
      if (!passe) {
        console.log("   (aucune pièce ne rend sans clé d'image : rien à mesurer ici)");
      } else {
        await passe.click();
        await pA.waitForTimeout(900);
        const carte = await pA.$(".mu-rendu-preuve .mu-c");
        dire(!!carte, "la carte déposée s'affiche au moment où l'on décide");
        const memoire = await pA.evaluate(() => {
          try {
            const b = localStorage.getItem("clikme-fantomes-v1");
            return b ? (JSON.parse(b) || []).length : 0;
          } catch { return -1; }
        });
        dire(memoire >= 1, `et elle est vraiment dans la mémoire du téléphone (${memoire})`);
        // ET ON NE S'INTÉRESSE PAS À SA PROPRE TRACE : « Ça m'intéresse » veut
        // dire « je veux en parler avec cette personne », or c'est soi.
        const pouce = carte ? await carte.$(".mu-int") : null;
        dire(!pouce, "et on ne nous propose pas de nous intéresser à nous-même");
      }
    }
  }
  await cA.close();
}

// ═══ RIEN NE PASSE SOUS L'ANNEAU, ET L'INTERRUPTION RESTE UNE BANDE ══════
//
// DEUX MESURES, ET AUCUNE DES DEUX NE SE VOIT EN RELISANT LE CODE : les blocs
// en cause sont corrects chacun de son côté, c'est leur SUPERPOSITION qui est
// fausse. Elles ne se voient qu'en lisant des coordonnées dans un vrai
// navigateur, à la vraie largeur.
//
//   · L'ANNEAU DU MÉTIER est posé en absolu à droite et couvre une bande de
//     cent points de haut. « BOUQUET DU JOUR » s'affichait « BOUQUET DU J », et
//     « à partir de 12 € » débordait dessous en quatre-vingts points.
//   · LA BANDE « C'EST À VOUS » est posée par-dessus l'annonce. Elle empilait
//     six rangées, soit cent quatre-vingt-neuf points sur une barre de deux cent
//     soixante et un : un tiers de l'écran, donc le tiers haut de la photo.
console.log("\n══ ce qui est posé par-dessus la carte ══");
{
  const { ctx: c9, p: p9 } = await ouvrir("/autour-de-moi", 12.5);
  /** Deux rectangles se chevauchent-ils vraiment ? */
  const croise = (a, b) =>
    !!a && !!b && a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.h && b.y < a.y + a.h;

  let sousLAnneau = null;
  let bande = null;
  let vues = 0;
  for (let i = 0; i < 14; i++) {
    const m = await p9.evaluate(() => {
      const r = (s) => {
        const e = document.querySelector(s);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
      };
      /**
       * ON MESURE LA ZONE DE CONTENU, PAS LA BOÎTE.
       *
       * Premier jet de cette garde : elle comparait les rectangles complets et
       * criait au chevauchement. C'était LA GARDE qui avait tort — la réserve
       * faite pour l'anneau est un `padding-right` DANS la boîte, donc la boîte
       * touche l'anneau par construction et le texte, lui, s'arrête avant. Ce
       * qu'il faut mesurer est le bord droit du CONTENU.
       */
      const contenu = (s) => {
        const e = document.querySelector(s);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        const st = getComputedStyle(e);
        const pg = parseFloat(st.paddingLeft) || 0;
        const pd = parseFloat(st.paddingRight) || 0;
        return {
          x: Math.round(b.x + pg),
          y: Math.round(b.y),
          l: Math.round(b.width - pg - pd),
          h: Math.round(b.height),
        };
      };
      return {
        anneau: r(".cd-anneau"),
        titre: contenu(".cd-offre"),
        prix: contenu(".cd-prixg"),
        // ET LE TEXTE NE DOIT PAS DÉBORDER DE CE QU'ON LUI LAISSE : un mot plus
        // large que la colonne sort de sa boîte et repart sous l'anneau.
        titreDeborde: (() => {
          const e = document.querySelector(".cd-offre");
          return e ? e.scrollWidth > e.clientWidth + 1 : false;
        })(),
        prixDeborde: (() => {
          const e = document.querySelector(".cd-prixg");
          return e ? e.scrollWidth > e.clientWidth + 1 : false;
        })(),
        tour: r(".ap-tour"),
        haut: r(".ap-haut"),
      };
    });
    if (m?.anneau && (m.titre || m.prix)) {
      vues++;
      const faute = croise(m.anneau, m.titre)
        ? "le titre passe sous l'anneau"
        : croise(m.anneau, m.prix)
          ? "le prix passe sous l'anneau"
          : m.titreDeborde
            ? "le titre déborde de sa colonne"
            : m.prixDeborde
              ? "le prix déborde de sa colonne"
              : null;
      if (faute && !sousLAnneau) sousLAnneau = { ...m, faute };
    }
    if (m?.tour && !bande) bande = m;
    const suiv = await p9.$(".ap-suiv");
    if (!suiv || !(await suiv.isEnabled())) break;
    await suiv.click();
    await p9.waitForTimeout(420);
  }
  dire(vues >= 4, `au moins quatre cartes mesurées (${vues})`);
  dire(
    !sousLAnneau,
    sousLAnneau
      ? `${sousLAnneau.faute} — titre ${JSON.stringify(sousLAnneau.titre)}, prix ${JSON.stringify(sousLAnneau.prix)}, anneau ${JSON.stringify(sousLAnneau.anneau)}`
      : "ni le titre ni le prix ne passent sous l'anneau du métier",
  );
  // LA BANDE A UN PLAFOND. Cent soixante points la laissent dire quoi, combien,
  // combien de temps et les deux gestes ; au-delà, elle réempile des rangées et
  // reprend la photo.
  if (bande) {
    dire(
      bande.tour.h <= 160,
      `la bande « C'est à vous » tient en quatre rangées (${bande.tour.h} points)`,
    );
    dire(
      bande.haut.h <= 235,
      `et la barre qu'elle habite ne prend pas le tiers de l'écran (${bande.haut.h} points)`,
    );
  } else {
    console.log("   (la bande « C'est à vous » ne s'est pas montrée à cette heure-ci)");
  }
  await c9.close();
}

// ═══ LA PAGE DU COMMERCE : SON MUR EN VEDETTE, ET UNE VRAIE PAGE D'ECRAN ══
//
// « Il faut mettre en vedette les murs des commerçants, avec possibilité de
// faire des essayages en direct sur leur page d'accueil. N'oublie pas aussi de
// faire une version ordinateur, parce que cette page est plus une page pour
// téléphone que ordinateur ou tablette. »
//
// MESURE AVANT CORRECTION : à 1440 points de large, la page était une colonne
// de 560 posée au milieu de deux gouttières noires de 440 chacune — soixante
// pour cent de l'écran pour rien. Et le mur n'y figurait nulle part : la seule
// chose que le produit sache faire et qu'un site vitrine ne saura jamais.
console.log("\n══ la page du commerce ══");
{
  const large = await nav.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" });
  await large.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pB = await large.newPage();
  pB.on("pageerror", (e) => erreurs.push(String(e)));
  await pB.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await pB.waitForTimeout(1200);

  const surOrdi = await pB.evaluate(() => {
    const bq = document.querySelector(".bq");
    const col = bq ? getComputedStyle(bq).gridTemplateColumns.split(" ").filter(Boolean) : [];
    return {
      colonnes: col.length,
      largeurUtile: col.reduce((n, x) => n + parseFloat(x), 0),
      mur: !!document.querySelector("#mur .mu"),
      deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  dire(surOrdi.colonnes === 2, `sur un ordinateur, la page tient en deux colonnes (${surOrdi.colonnes})`);
  dire(
    surOrdi.largeurUtile > 900,
    `et elle occupe l'écran au lieu d'une colonne de téléphone (${Math.round(surOrdi.largeurUtile)} points)`,
  );
  dire(surOrdi.mur, "le mur du commerce est sur sa page");

  /**
   * ═══ LA PAGE RACONTE UNE HISTOIRE, DANS L'ORDRE ═══════════════════════════
   *
   * « C'est impossible de s'y retrouver. Il faut des sections claires, des
   * titres pour qu'on sache où on est, et que la page raconte une histoire où
   * l'on va de section en section en comprenant ce qui se passe. »
   *
   * TROIS CHOSES SE MESURENT, ET AUCUNE NE SE VOIT EN LISANT LE CODE :
   *
   *   · LES CHAPITRES SONT NUMÉROTÉS ET DANS L'ORDRE. Le défaut trouvé au
   *     premier jet : ils se lisaient 1, 2, 6, 3, 4, 5 — j'avais renuméroté
   *     sans déplacer le bloc. Un rang qui recule au milieu d'une page détruit
   *     exactement ce qu'il est censé donner.
   *   · CHACUN DIT À QUOI IL RÉPOND. C'est ce qui fait l'histoire plutôt qu'une
   *     table des matières.
   *   · LA PAGE RESPIRE. Mesure avant : onze mille deux cents points sur un
   *     téléphone, sans un seul repère.
   */
  const histoire = await pB.evaluate(() =>
    [...document.querySelectorAll(".bq-s")]
      .map((sec) => {
        const ch = sec.querySelector(".bq-ch");
        if (!ch) return null;
        return {
          n: Number(ch.querySelector(".bq-ch-n b")?.textContent ?? 0),
          titre: ch.querySelector("h2")?.textContent?.trim() ?? "",
          dit: ch.querySelector("p")?.textContent?.trim() ?? "",
        };
      })
      .filter(Boolean),
  );
  dire(histoire.length >= 6, `la page est faite de chapitres (${histoire.length})`);
  const rangs = histoire.map((x) => x.n);
  dire(
    rangs.every((n, i) => i === 0 || n > rangs[i - 1]),
    `et ils se suivent dans l'ordre (${rangs.join(" ")})`,
  );
  dire(
    histoire.every((x) => x.titre && x.dit.length > 25),
    "chaque chapitre a un titre et dit à quoi il répond",
  );
  // AUCUN CHAPITRE NE RÉPÈTE UN AUTRE : deux titres identiques, c'est deux
  // sections qu'on ne saura pas distinguer en revenant en arrière.
  const titres = histoire.map((x) => x.titre);
  dire(new Set(titres).size === titres.length, "et aucun ne répète le titre d'un autre");

  // ET LE REPÈRE SUIT LE DÉFILEMENT — un titre ne dit où l'on est qu'au moment
  // où on le croise ; trois écrans plus bas, on ne sait déjà plus.
  const auSommet = await pB.$eval(".bq-ou", (e) => e.classList.contains("vu")).catch(() => null);
  dire(auSommet === false, "au sommet, le repère de chapitre se tait");
  await pB.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.55)));
  await pB.waitForTimeout(600);
  const enRoute = await pB.$eval(".bq-ou", (e) => e.innerText.replace(/\s+/g, " ").trim());
  dire(/\d\s*\/\s*\d/.test(enRoute), `et il dit où l'on est en descendant (« ${enRoute} »)`);
  await pB.evaluate(() => scrollTo(0, 0));
  await pB.waitForTimeout(400);

  // LE FOND DE LA PAGE RESTE LE SIEN. La feuille du mur porte une règle qui
  // repeint le document entier ; montée en section, elle changeait la couleur
  // de toute la boutique. Mesure : rgb(7,11,18) au lieu de rgb(5,9,12).
  const fond = await pB.evaluate(() => getComputedStyle(document.body).backgroundColor);
  dire(
    fond.replace(/\s/g, "") === "rgb(5,9,12)",
    `et le mur ne repeint pas la page qui l'accueille (${fond})`,
  );
  dire(!surOrdi.deborde, "et rien ne déborde sur le côté");

  // L'ESSAI EST LA, EN DIRECT, CHEZ LES MÉTIERS QUI EN ONT UN. C'est le point
  // de toute la section : on essaie depuis la page du commerçant.
  /**
   * ALLER JUSQU'A L'ECRAN DE LA PHOTO, QUEL QUE SOIT LE MUR.
   *
   * « Le fantome amene sur l'essayage quand personne n'a encore essaye, mais
   * quand une ou plusieurs personnes ont essaye, alors il amene sur le mur des
   * clients. » Un mur rempli s'ouvre donc sur ses clientes, et l'essai est
   * derriere le geste de sa tete. Trois gardes le franchissaient a l'aveugle et
   * lisaient une grille vide.
   */
  const versLaPhoto = async (page) => {
    if (await page.$("#mur .mu-ph-tete")) return;
    const essayer = await page.$("#mur .mu-bas .mu-cta");
    if (essayer) {
      await essayer.click();
      await page.waitForTimeout(500);
    }
  };

  const onglerie = await pB.$(".bq-maq-c button:text-matches('prothésiste', 'i')");
  if (onglerie) {
    await onglerie.click();
    await pB.waitForTimeout(1000);
    await versLaPhoto(pB);
    const e = await pB.evaluate(() => ({
      // ON LIT LE TITRE DU CHAPITRE, PAS CELUI DU COMPOSANT. Celui du
      // composant existe encore dans le document mais il est masque : une
      // garde qui lit un texte invisible mesure le code, pas l'ecran.
      titre: document.querySelector("#mur .bq-ch h2")?.textContent?.trim() ?? null,
      geste: document.querySelector("#mur .mu-cta.plein b")?.textContent?.trim() ?? null,
      /**
       * LE CREUX SE MESURE SOUS LE DERNIER CONTENU, PAS SOUS LE CADRE.
       *
       * PREMIER JET : on comparait le bas de la section au bas du mur, et on
       * lisait « 23 points » pendant que quatre cent quatorze points de vide
       * s'étalaient DANS le mur. La feuille du mur porte `min-height:100vh`,
       * écrite pour un écran entier ; rendue à l'intérieur de la page, elle
       * passe APRÈS celle de la page et gagne à spécificité égale. Le panneau
       * faisait exactement la hauteur de l'écran — la signature du défaut.
       *
       * ON MESURE DONC DEPUIS LE DERNIER ENFANT VISIBLE. Une garde qui regarde
       * le cadre ne voit jamais ce qu'il y a dedans.
       */
      creux: (() => {
        const m = document.querySelector("#mur");
        const d = m?.querySelector(".bq-mu");
        if (!m || !d) return 0;
        const enfants = [...d.children].filter((e) => e.getBoundingClientRect().height > 1);
        const dernier = enfants[enfants.length - 1];
        if (!dernier) return 0;
        return Math.round(m.getBoundingClientRect().bottom - dernier.getBoundingClientRect().bottom);
      })(),
    }));
    dire(
      !!e.titre && /ongle/i.test(e.titre),
      `l'essai s'ouvre sur sa page, dans les mots du metier (« ${e.titre ?? "absent"} »)`,
    );
    dire(
      !!e.geste && /photograph|prendre/i.test(e.geste),
      `et il propose le geste du métier (« ${e.geste ?? "absent"} »)`,
    );
    dire(e.creux < 90, `sans creux sous le dernier contenu du panneau (${e.creux} points)`);
  }

  // ═══ CE QU'ON PROPOSE D'ESSAYER EST CE QU'ON VEND ════════════════════════
  //
  // LE DÉFAUT QUE ÇA ATTRAPE, ET IL A ÉTÉ LIVRÉ DEUX FOIS : une pièce sans
  // référence prenait la photo du LIEU en attendant la vraie. Le tatoueur
  // proposait « Branche fleurie » avec une photo de son atelier ; le coiffeur
  // proposait « Carré dégradé » avec un fauteuil vide. On demandait de choisir
  // une coupe en montrant du mobilier — et rien à l'écran ne disait que c'était
  // une doublure.
  //
  // LA RÈGLE EST DONC : une pièce qu'on peut choisir montre le TRAVAIL, pas le
  // décor. Une pièce qui n'a pas son image reste « bientôt essayable » et ne se
  // choisit pas — c'est honnête, et c'est déjà écrit dans le produit.
  for (const [nom, cible] of [
    ["le tatoueur", "tatoueur"],
    ["le coiffeur", "Un salon du centre"],
    ["la prothésiste", "prothésiste"],
    ["la boutique", "boutique de la rue"],
  ]) {
    const onglet = await pB.$(`.bq-maq-c button:text-matches("${cible}", "i")`);
    if (!onglet) continue;
    await onglet.click();
    await pB.waitForTimeout(1100);
    // LA GRILLE NE S'OUVRE QU'AU MOMENT DE CHOISIR : avant, on est sur la
    // photo, et on y dépose un fichier comme le ferait quelqu'un qui a déjà
    // pris le cliché. Voir `deposerUnePhoto`.
    await versLaPhoto(pB);
    await deposerUnePhoto(pB, "#mur");
    const pieces = await pB.$$eval("#mur .mu-pieces button", (l) =>
      l.map((e) => {
        const img = e.querySelector("img");
        return {
          nom: e.querySelector("b")?.textContent?.trim() ?? "?",
          bientot: e.classList.contains("bientot"),
          // UNE IMAGE QUI N'A PAS CHARGÉ A UNE LARGEUR NATURELLE DE ZÉRO :
          // c'est la seule façon de voir un 404 depuis la page, la vignette
          // gardant sa place et sa couleur de fond.
          chargee: !img || img.naturalWidth > 0,
          teinte: !img,
        };
      }),
    );
    dire(pieces.length >= 3, `${nom} propose de quoi choisir (${pieces.length})`);
    dire(
      pieces.every((p) => p.chargee),
      `et chaque vignette a bien son image${pieces.filter((p) => !p.chargee).map((p) => " — " + p.nom).join("")}`,
    );
    // AUCUN NOM EN DOUBLE : le mur mêle les pièces du commerçant et celles du
    // modèle de sa branche, et deux entrées du même nom donnent deux vignettes
    // qu'on ne saura pas distinguer.
    const noms = pieces.map((p) => p.nom);
    dire(new Set(noms).size === noms.length, "et aucune pièce n'est proposée deux fois");
  }
  // LE TATOUEUR ANNONCE TROIS FLASHS SUR SA CARTE : il doit en avoir trois
  // d'essayables. C'était le cas le plus voyant du défaut ci-dessus — un seul
  // l'était, les deux autres montraient l'atelier.
  {
    const onglet = await pB.$('.bq-maq-c button:text-matches("tatoueur", "i")');
    if (onglet) {
      await onglet.click();
      await pB.waitForTimeout(1100);
      await versLaPhoto(pB);
      await deposerUnePhoto(pB, "#mur");
      const aVenir = await pB.$$eval("#mur .mu-pieces button.bientot", (l) => l.length);
      const total = await pB.$$eval("#mur .mu-pieces button", (l) => l.length);
      dire(
        total - aVenir >= 4,
        `le tatoueur a bien quatre flashs essayables, comme sa carte l'annonce (${total - aVenir})`,
      );
    }
  }

  // ═══ L'ATTENTE, LA RÉVÉLATION ET LA NOTE ═════════════════════════════════
  //
  // CE QUE ÇA PROTÈGE : « cette étape avant le résultat devrait être LE moment
  // magique », « cette page résultat n'est pas très fun », « on pourrait noter
  // le résultat sur soi avec 1 à 5 fantômes ».
  //
  // ON NE MESURE PAS LE GOÛT, ON MESURE CE QUI EXISTE. Une garde ne peut pas
  // dire si une animation est belle. Elle peut dire que le fantôme est au
  // centre de sa scène et non quinze points à droite — défaut réel, causé par
  // deux `@keyframes` du même nom — que la question est posée avec ses cinq
  // fantômes, et que la note part vraiment sur le mur.
  {
    const onglet = await pB.$('.bq-maq-c button:text-matches("lunetier", "i")');
    if (onglet) {
      await onglet.click();
      await pB.waitForTimeout(1100);
      await versLaPhoto(pB);
      await deposerUnePhoto(pB, "#mur");
      const pc = await pB.$("#mur .mu-pieces button:not(.bientot)");
      if (pc) {
        await pc.click();
        await pB.waitForSelector("#mur .mu-cal-scene", { timeout: 8000 }).catch(() => null);
        // LE FANTÔME EST AU CENTRE DE SA SCÈNE, comme l'anneau autour de lui.
        // DÉFAUT MESURÉ : il était à 65 % de large et 61 % de haut parce que
        // `muFlotte` existait déjà ailleurs et que la seconde déclaration avait
        // effacé son centrage. L'animation avait la bonne durée et le bon
        // rythme — seule la trajectoire était celle de quelqu'un d'autre.
        const place = await pB.evaluate(() => {
          const s = document.querySelector(".mu-cal-scene");
          const f = document.querySelector(".mu-cal-f");
          if (!s || !f) return null;
          const a = s.getBoundingClientRect();
          const b = f.getBoundingClientRect();
          return {
            x: Math.round(((b.x + b.width / 2) - a.x) / a.width * 100),
            y: Math.round(((b.y + b.height / 2) - a.y) / a.height * 100),
            photo: !!s.querySelector(".mu-cal-fond"),
            poudre: s.querySelectorAll(".mu-cal-poudre i").length,
          };
        });
        if (place) {
          dire(
            Math.abs(place.x - 50) <= 4,
            `pendant l'attente, le fantôme est au centre (${place.x} % de large)`,
          );
          dire(place.photo, "et c'est SA photo qu'on devine derrière lui");
          dire(place.poudre >= 8, `avec sa poussière (${place.poudre} points)`);
        }

        await pB.waitForSelector("#mur .mu-rendu", { timeout: 40000 }).catch(() => null);
        await pB.waitForTimeout(1500);
        /**
         * SANS CLÉ D'IMAGE, LA MOITIÉ DE CET ÉCRAN N'EXISTE PAS — ET ON LE DIT.
         *
         * La note ne s'affiche pas sur un rendu raté, et c'est voulu : noter
         * « sur vous » une image où la pièce n'a pas pu être posée n'aurait
         * aucun sens. Sur un serveur sans `GEMINI_API_KEY`, tous les rendus
         * ratent, donc ces gardes-là ne mesurent rien.
         *
         * ON NE LES FAIT PAS PASSER EN SILENCE POUR AUTANT. Une garde qui se
         * désactive sans le dire est pire que pas de garde : on continue de lui
         * faire confiance. Elle imprime donc pourquoi, et la commande à taper
         * pour la faire tourner vraiment.
         */
        const noteLa = await pB.$("#mur .mu-note");
        if (!noteLa) {
          const pourquoi = await pB
            .$eval("#mur .mu-rendu-b", (e) => e.textContent.trim())
            .catch(() => "raison inconnue");
          console.log(
            `  ····  l'écran du rendu n'est pas mesuré ici — « ${pourquoi.slice(0, 70)} ».\n` +
              "        La note ne s'affiche pas sur un rendu raté, et c'est la règle :\n" +
              "        on ne note pas « sur vous » une image où la pièce n'a pas pu être\n" +
              "        posée. Relancez avec GEMINI_API_KEY pour mesurer cette partie.",
          );
        } else {
        const apres = await pB.evaluate(() => ({
          // LA RÉVÉLATION A EU LIEU : la classe est posée, donc l'animation
          // s'est jouée. Une garde ne peut pas juger sa beauté ; elle peut
          // refuser qu'elle disparaisse sans qu'on le voie.
          revele: !!document.querySelector(".mu-rendu.revele"),
          question: document.querySelector(".mu-note-q")?.textContent?.trim() ?? null,
          fantomes: document.querySelectorAll(".mu-note-f button").length,
          // LE PRIX NE SE COUPE PAS EN DEUX. Mesuré : « 159 € » s'affichait
          // « 159 » puis « € » à la ligne, et un prix cassé se lit deux fois.
          prix: (() => {
            const e = document.querySelector(".mu-rendu-t em");
            if (!e) return null;
            const r = e.getBoundingClientRect();
            return Math.round(r.height);
          })(),
          // L'ÉTIQUETTE NE PASSE PAS SOUS « AGRANDIR ». Les noms de pièces
          // viennent des commerçants : on ne peut pas parier sur leur longueur.
          chevauche: (() => {
            const t = document.querySelector(".mu-rendu-t2");
            const z = document.querySelector(".mu-rendu-z");
            if (!t || !z) return false;
            const a = t.getBoundingClientRect();
            const b = z.getBoundingClientRect();
            return a.right > b.left + 1 && a.top < b.bottom && a.bottom > b.top;
          })(),
        }));
        dire(apres.revele, "le rendu se révèle au lieu d'apparaître");
        // ON COMPARE SUR LES MOTS, PAS SUR LES ESPACES. Le texte de l'écran
        // porte une espace INSÉCABLE avant le point d'interrogation — c'est la
        // typographie française, et c'est voulu. Une garde qui compare deux
        // chaînes au caractère près échoue donc sur un écran parfaitement juste,
        // ce qui est la pire espèce de garde.
        dire(
          /sur vous.*(donne|va) quoi/i.test((apres.question ?? "").replace(/\u00a0/g, " ")),
          `on demande ce que ça donne SUR SOI (« ${apres.question ?? "rien"} »)`,
        );
        dire(apres.fantomes === 5, `avec cinq fantômes à donner (${apres.fantomes})`);
        dire(!!apres.prix && apres.prix < 30, `et le prix tient sur une ligne (${apres.prix} points)`);
        dire(!apres.chevauche, "l'étiquette de la pièce ne passe pas sous « Agrandir »");

        // LA NOTE PART SUR LE MUR, ET C'EST TOUTE SA RAISON D'ÊTRE. Noter pour
        // soi seul n'aurait servi à rien : ce qui la rend utile, c'est que le
        // suivant la lise à côté de la tête de celui qui l'a donnée.
        const cinq = (await pB.$$("#mur .mu-note-f button"))[4];
        if (cinq) {
          await cinq.click();
          await pB.waitForTimeout(250);
          const mot = await pB.$eval("#mur .mu-note-m", (e) => e.textContent.trim());
          dire(mot.length > 4 && mot !== "Facultatif", `et la note se dit en toutes lettres (« ${mot} »)`);
          const passe = await pB.$("#mur .mu-rendu-g .non");
          if (passe) {
            await passe.click();
            await pB.waitForTimeout(900);
            const surLeMur = await pB.evaluate(
              () => document.querySelectorAll("#mur .mu-rendu-preuve .mu-c-note .mu-c-ns.on").length,
            );
            dire(surLeMur === 5, `et elle se voit sur le fantôme posé (${surLeMur} fantômes allumés)`);
          }
        }
        }
      }
    }
  }

  // ET SUR TÉLÉPHONE, RIEN N'A BOUGÉ : une seule colonne, le mur toujours là.
  const petit = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await petit.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pC = await petit.newPage();
  await pC.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await pC.waitForTimeout(900);
  const surTel = await pC.evaluate(() => ({
    grille: getComputedStyle(document.querySelector(".bq")).display,
    mur: !!document.querySelector("#mur .mu"),
    deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  dire(surTel.grille !== "grid", "sur téléphone, la page reste une seule colonne");
  dire(surTel.mur, "et le mur y est aussi");
  dire(!surTel.deborde, "sans débordement horizontal");
  await petit.close();
  await large.close();
}

// ═══ L'ANNONCE D'UN LIEU SUIT SA MAQUETTE ═════════════════════════════════
//
// CE QUE ÇA PROTÈGE : « Le design des restaurants, bars et événements n'a pas
// été modifié comme sur le screenshot que je t'avais donné. »
//
// SA MAQUETTE POSE DEUX LIGNES D'INFORMATION sous le prix — ce qu'il reste, et
// où c'est — un rail de trois pastilles à droite avec leurs compteurs, et un
// geste plein tout en bas. L'écran avait ces informations éparpillées, aucun
// rail, et « Proposer à mes amis » en aplat vert pleine largeur.
//
// ═══ ELLES ÉTAIENT QUATRE, ET IL EN A COUPÉ DEUX ══════════════════════════
//
// « 347 clients ce mois-ci : supprimer, on ne peut pas le savoir et ce n'est
// pas une info très intéressante. 4,9 (47 avis) : supprimer puisqu'on a déjà
// l'info plus bas. » LES DEUX QUI RESTENT SONT LES DEUX QU'ON SAIT VRAIMENT :
// ce qu'il a promis de mettre de côté, et la distance. Une garde qui exige
// encore les quatre exige qu'on remette ce qu'il a fait retirer.
//
// ET LA PREMIÈRE NE DIT PLUS « 12 BOUQUETS RESTANTES ». L'accord était écrit en
// dur au féminin, donc faux dès qu'il restait des pains ou des plats. « Il
// reste 12 bouquets » ne s'accorde avec rien — c'est pour ça qu'on cherche
// désormais le verbe et non la terminaison.
//
// ET ON MESURE AUSSI QUE RIEN N'EST MORT NI CACHÉ : un geste principal grisé
// (la terrasse ne prend pas de réservation) et une pastille passée sous le
// bandeau d'information sont les deux défauts que cette mise en page a
// réellement produits, et les deux qu'une relecture ne voit pas.
{
  console.log("\n══ l'annonce d'un lieu suit sa maquette ══");
  const lieu = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await lieu.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  await lieu.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pL = await lieu.newPage();
  await pL.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await pL.waitForTimeout(2600);
  const a = await pL.evaluate(() => {
    const plein = document.querySelector(
      ".ap-agir.reserver, .ap-agir.parler, .ap-agir.essayer",
    );
    const rails = [...document.querySelectorAll(".ap-rail-b")];
    const echo = document.querySelector(".ap-echo");
    // LA PASTILLE DU BAS NE PASSE PAS SOUS LE BANDEAU : on compare les deux
    // rectangles, c'est la seule facon de voir un recouvrement.
    const dernier = rails[rails.length - 1];
    const couvre = (() => {
      if (!echo || !dernier) return false;
      const a = echo.getBoundingClientRect();
      const b = dernier.getBoundingClientRect();
      return a.right > b.left + 2 && a.left < b.right - 2 && a.bottom > b.top + 2 && a.top < b.bottom - 2;
    })();
    return {
      infos: [...document.querySelectorAll(".ap-dessus .cd-infos li")].map((e) =>
        e.textContent.replace(/\s+/g, " ").trim(),
      ),
      plein: plein ? plein.textContent.replace(/\s+/g, " ").trim() : null,
      mort: plein ? plein.disabled : null,
      rails: rails.map((e) => e.textContent.replace(/\s+/g, " ").trim()),
      couvre,
    };
  });
  dire(a.infos.length === 2, `l'annonce porte ses deux lignes (${a.infos.join(" · ")})`);
  dire(
    /^il reste \d+/i.test(a.infos[0] ?? "") && /^À /.test(a.infos[1] ?? ""),
    "et dans l'ordre de la maquette : ce qu'il reste, puis où c'est",
  );
  // CE QU'IL A FAIT RETIRER NE REVIENT PAS. Deux lignes suffiraient à passer la
  // garde du dessus en remplaçant les deux bonnes par les deux mauvaises.
  dire(
    !a.infos.some((t) => /clients|avis/i.test(t)),
    "et ni les clients du mois ni la note ne reviennent s'y glisser",
  );
  dire(a.rails.length === 3, `le rail porte ses trois gestes (${a.rails.join(" · ")})`);
  dire(
    /^\d+$/.test(a.rails[0] ?? "") && /^\d+$/.test(a.rails[1] ?? ""),
    "les deux premiers comptent quelque chose",
  );
  dire(!!a.plein, `et le geste plein est là (« ${a.plein ?? "absent"} »)`);
  // UN GESTE PRINCIPAL GRISÉ EST PIRE QUE PAS DE GESTE : il occupe le bas de
  // l'écran et ne propose rien. Voir `enPlace` et son repli.
  dire(a.mort === false, "il n'est jamais grisé : sans réservation possible, il propose autre chose");
  dire(!a.couvre, "et le bandeau d'information ne passe pas par-dessus le rail");
  await lieu.close();
}

// ═══ LE DIRECT NE SE VIDE PAS LE SOIR ═════════════════════════════════════
//
// CE QUE ÇA PROTÈGE : « Les exemples dans la démo ont tous disparu. » Et la
// capture le disait : Mode 0, Coiffeurs 0, Fleuristes 0, Ongleries 0, Créateurs
// 0, Lunetiers 0 — pendant que le compteur « Tout » affichait 24.
//
// LE DÉFAUT ÉTAIT UNE RÈGLE INCOMPLÈTE, PAS UNE PANNE. Le paquet ne gardait que
// ce qui n'est pas encore fini, et à vingt heures plus rien ne l'est. Il
// existait bien un repli — hors des heures d'ouverture, l'application fait
// comme s'il était midi — mais il ne couvre que 23 h → 8 h. Entre dix-neuf
// heures et vingt-trois, c'est-à-dire À L'HEURE EXACTE OÙ L'ON REGARDE SON
// TÉLÉPHONE, l'écran se vidait.
//
// CE QUI LE CORRIGE : quand la journée est finie, elle recommence. Le commerce
// montre le programme qu'il a déjà donné, marqué « Demain » — rien n'est
// inventé, et rien ne passe pour frais.
{
  console.log("\n══ le direct ne se vide pas le soir ══");
  for (const [heure, quand] of [
    [12.5, "à midi"],
    [20, "à 20 h"],
    [21.5, "à 21 h 30"],
  ]) {
    const soir = await nav.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, locale: "fr-FR",
    });
    await soir.clock.setFixedTime(
      new Date(2026, 8, 2, Math.floor(heure), Math.round((heure % 1) * 60), 0),
    );
    await soir.addInitScript(() =>
      localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
    );
    const pS = await soir.newPage();
    await pS.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
    await pS.waitForTimeout(2400);
    const ouvrir = await pS.$("button:has-text('TOUT')");
    if (ouvrir) {
      await ouvrir.click();
      await pS.waitForTimeout(700);
    }
    const n = await pS.evaluate(() =>
      [...document.querySelectorAll("li")]
        .map((e) => e.textContent.replace(/\s+/g, " ").trim())
        .filter((t) =>
          /^(🍽️|👗|🍸|💇|💐|💅|🕯️|👓)/.test(t),
        )
        .map((t) => Number(t.match(/(\d+)$/)?.[1] ?? 0)),
    );
    const vides = n.filter((x) => x === 0).length;
    dire(
      n.length >= 8 && vides === 0,
      `${quand}, aucun métier n'est vide (${n.join(" · ")})`,
    );
    await soir.close();
  }
  // ET CE QUI EST FERMÉ LE DIT, au lieu de se faire passer pour ouvert.
  {
    const tard = await nav.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, locale: "fr-FR",
    });
    await tard.clock.setFixedTime(new Date(2026, 8, 2, 21, 30, 0));
    await tard.addInitScript(() =>
      localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
    );
    const pR = await tard.newPage();
    await pR.goto(`${BASE}/autour-de-moi?carte=fleur-marche`, { waitUntil: "networkidle" });
    await pR.waitForTimeout(2200);
    const dit = await pR.evaluate(() => {
      const c = document.querySelector(".cd-carte:not(.dessous)");
      if (!c) return null;
      // ON LIT LA PASTILLE, PAS UNE FEUILLE DE L'ARBRE. Elle porte maintenant
      // son éclair en `<i>` — donc elle a un enfant, donc le filtre
      // « aucun enfant » la sautait et la garde lisait « rien » sur un écran
      // parfaitement juste. Une garde qui devine où est un texte casse à la
      // première icône ajoutée.
      return c.querySelector(".cd-quand")?.textContent?.replace(/\s+/g, " ").trim() ?? null;
    });
    // ON TESTE LE MOT, PAS CE QUI LE PRÉCÈDE. La pastille porte maintenant son
    // pictogramme — 🌙 pour demain, ⚡ pour maintenant — donc son texte commence
    // par la lune et `^demain` n'accrochait plus. L'écran disait exactement la
    // bonne chose (« 🌙 Demain · jusqu'à 19 h ») et la garde le refusait : deux
    // fois de suite le même défaut, sur la même pastille, parce qu'elle décrit
    // une FORME au lieu de chercher un MOT.
    dire(
      /\bdemain\b/i.test(dit ?? ""),
      `et une fleuriste fermée le soir dit que c'est pour demain (« ${dit ?? "rien"} »)`,
    );
    await tard.close();
  }
}

// ═══ CE QU'IL RESTE DÉCOMPTE QUAND QUELQU'UN RÉSERVE ══════════════════════
//
// CE QUE ÇA PROTÈGE : « On ne peut pas savoir combien il en reste, donc on ne
// peut pas afficher ce résultat — à moins qu'il y ait un décompte quand
// quelqu'un appuie sur réserver et envoie un message WhatsApp pour le mettre
// de côté ? »
//
// SA QUESTION ÉTAIT LA RÉPONSE, ET C'EST CE QUI REND LE NOMBRE HONNÊTE. On
// n'invente pas un stock : le commerçant annonce ce qu'il met de côté, et
// chaque mise de côté passée PAR L'APPLICATION en retire une. Le nombre ne
// prétend pas connaître sa réserve — il dit ce qu'il reste de ce qu'il a
// promis ici. C'est la seule lecture qu'on puisse défendre devant lui.
//
// POURQUOI UNE GARDE PLUTÔT QU'UNE RELECTURE : le décompte traverse quatre
// endroits — le geste, la feuille qui demande quel moment, l'envoi, puis la
// carte qui se redessine. Trois d'entre eux ont déjà changé ce mois-ci. Une
// chaîne qui se casse au milieu laisse le nombre figé, et un nombre figé
// ressemble exactement à un nombre qui marche.
//
// ON LE MESURE CHEZ LE BOUCHER, ET PAS AILLEURS : il a un stock qu'on peut
// vraiment compter (des parts), un geste de mise de côté, et PAS de menu du
// jour — une carte « menu du jour » ne porte pas de décompte, parce qu'une
// formule n'est pas une réserve.
{
  console.log("\n══ ce qu'il reste décompte quand on réserve ══");
  const dec = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await dec.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  await dec.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  // WHATSAPP NE DOIT PAS EMPORTER L'ONGLET : on neutralise l'ouverture, sinon
  // la carte qu'on veut relire est partie avec.
  await dec.addInitScript(() => { window.open = () => null; });
  const pD = await dec.newPage();
  await pD.goto(`${BASE}/autour-de-moi?carte=boucher`, { waitUntil: "networkidle" });
  await pD.waitForTimeout(1800);

  // LA CARTE DU HAUT EST LA DERNIÈRE DU DOM — le paquet empile. On lit donc
  // toutes les cartes et on suit celle du boucher par son titre.
  const parts = () =>
    pD.evaluate(() => {
      const c = [...document.querySelectorAll(".cd-carte")].find((x) =>
        /côte de bœuf/i.test(x.querySelector(".cd-offre")?.textContent ?? ""),
      );
      const t = c?.querySelector(".cd-infos")?.textContent ?? "";
      return Number(t.match(/il reste\s*(\d+)/i)?.[1] ?? -1);
    });

  const avant = await parts();
  dire(avant > 0, `le boucher dit ce qu'il met de côté (${avant} parts)`);

  // LE PAQUET EMPILE, DONC `.first()` LIT LA CARTE DU DESSOUS. Le clic, lui,
  // atterrit sur celle du dessus puisqu'elle recouvre l'autre au même endroit :
  // la garde lisait « Réserver mon plat » — le geste de la terrasse — pendant
  // qu'elle réservait bel et bien chez le boucher. Un écart entre ce qu'on lit
  // et ce qu'on touche est le pire cas pour une garde : elle échoue sur un
  // produit sain, ou passe sur un produit cassé.
  // ON CHERCHE LA NATURE DU GESTE, PAS SES MOTS. La garde exigeait « Gardez-la-
  // moi » — le mot du moment — et lisait « Réserver mon plat », qui est le verbe
  // du MÉTIER : chaque branche a le sien dans `personnalites.ts`, et la
  // boucherie est rangée dans les restaurants. L'écran disait exactement la
  // bonne chose et la garde la refusait, pour la troisième fois ce mois-ci, en
  // décrivant une FORMULATION au lieu de chercher un GESTE. La classe
  // `reserver`, elle, dit ce que le bouton fait quel que soit son métier.
  const geste = pD.locator(".ap-agir.reserver").last();
  const mots = (await geste.textContent())?.replace(/\s+/g, " ").trim() ?? "";
  dire(
    (await geste.count()) > 0,
    `et son geste principal est bien une mise de côté (« ${mots} »)`,
  );
  await geste.click();
  await pD.waitForTimeout(1400);
  // La feuille demande d'abord QUEL moment ; l'envoi ne s'allume qu'après.
  await pD.locator(".ap-feuille .ap-m").first().click();
  await pD.waitForTimeout(700);
  const envoi = pD.locator(".ap-feuille .ap-b2.plein").first();
  dire(await envoi.isEnabled(), "choisir le moment allume l'envoi au commerçant");
  await envoi.click();
  await pD.waitForTimeout(1800);
  for (const sel of [".ap-feuille .ap-f-x", ".ap-fond"]) {
    const b = pD.locator(sel).first();
    if ((await b.count()) && (await b.isVisible())) {
      await b.click({ force: true });
      await pD.waitForTimeout(900);
    }
  }
  await pD.waitForTimeout(800);
  const apres = await parts();
  dire(
    avant > 0 && apres === avant - 1,
    `et une part mise de côté en retire une (${avant} → ${apres})`,
  );
  await dec.close();
}

// ═══ UN ÉVÉNEMENT ET UN POSTE ONT LE MÊME ÉCRAN QU'UN BAR ════════════════
//
// CE QUE ÇA PROTÈGE : « Les annonces événements n'ont pas encore été modifiées,
// ni ils recrutent, avec le nouveau style comme bar et restaurants. »
//
// ILS EN ÉTAIENT EXCLUS PAR UNE LIGNE QUI LES NOMMAIT, et c'est pour ça que
// personne ne l'a vu : le commentaire d'à côté disait « un bar, un restaurant,
// un événement, un poste gardent exactement l'écran d'avant », ce qui était vrai
// le jour où on l'a écrit. Les bars ont basculé deux tours plus tard ;
// l'exclusion des deux autres est restée.
//
// UNE GARDE QUI COMPARE LES TROIS NATURES ATTRAPE CE GENRE D'OUBLI, et c'est le
// seul moyen : chacune prise seule a l'air cohérente. C'est l'ÉCART entre elles
// qui est le défaut.
{
  console.log("\n══ un événement et un poste suivent la maquette des lieux ══");
  const na = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await na.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  await na.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pN = await na.newPage();

  const forme = () =>
    pN.evaluate(() => ({
      // LE GESTE PLEIN, LE RAIL ET LES DEUX LIGNES : les trois marques du
      // nouvel écran. `.ap-duo` est la marque de l'ancien.
      plein: document.querySelector(".ap-agir")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      rail: document.querySelectorAll(".ap-rail-b").length,
      duo: document.querySelectorAll(".ap-duo").length,
      quoi: document.querySelector(".ap-ident-l u")?.textContent?.trim() ?? null,
      qui: document.querySelector(".ap-ident-l b")?.textContent?.trim() ?? null,
      porte: document.querySelector(".ap-ident-d button")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      // UN COMPTEUR A ZERO NE S'ECRIT PAS : sous un coeur, il dit « personne ».
      zeros: [...document.querySelectorAll(".ap-rail-b span")].filter(
        (e) => e.textContent.trim() === "0",
      ).length,
    }));

  await pN.goto(`${BASE}/autour-de-moi?carte=marche-nuit`, { waitUntil: "networkidle" });
  await pN.waitForTimeout(2200);
  const ev = await forme();
  dire(ev.duo === 0, `un événement n'a plus les deux gestes d'avant (${ev.duo})`);
  dire(ev.rail === 3, `il a le rail des trois gestes (${ev.rail})`);
  dire(!!ev.plein, `et un geste plein qui dit quoi faire (« ${ev.plein ?? "absent"} »)`);
  dire(
    !!ev.quoi && !!ev.qui && ev.quoi.toLowerCase() !== ev.qui.toLowerCase(),
    `son identité tient sur deux lignes qui ne se répètent pas (« ${ev.quoi} » / « ${ev.qui} »)`,
  );
  // SA PORTE N'EST PAS CELLE D'UN COMMERCE : il n'a ni fiche ni autres offres.
  dire(
    /savoir/i.test(ev.porte ?? ""),
    `et sa porte ouvre ce qu'il faut savoir (« ${ev.porte ?? "absente"} »)`,
  );
  dire(ev.zeros === 0, `aucun compteur à zéro sous le rail (${ev.zeros})`);

  // ET « ILS RECRUTENT », PAR LE FILTRE — il n'a pas d'adresse à lui.
  await pN.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await pN.waitForTimeout(2000);
  await pN.locator(".ap-metier").first().click();
  await pN.waitForTimeout(700);
  const bouton = pN.locator(".ap-feuille button").filter({ hasText: /recrut/i }).first();
  if (!(await bouton.count())) {
    dire(false, "on peut choisir « ils recrutent » dans le filtre");
  } else {
    await bouton.click();
    await pN.waitForTimeout(2400);
    const po = await forme();
    dire(po.duo === 0, `un poste n'a plus les deux gestes d'avant (${po.duo})`);
    dire(po.rail === 3, `il a le rail des trois gestes (${po.rail})`);
    dire(
      /postule/i.test(po.plein ?? ""),
      `et son geste plein est celui du métier (« ${po.plein ?? "absent"} »)`,
    );
    dire(
      /offre/i.test(po.porte ?? ""),
      `sa porte ouvre l'offre (« ${po.porte ?? "absente"} »)`,
    );
    // ET LE SALAIRE NE MANGE PAS LA CARTE : c'est une phrase, pas un prix.
    const prix = await pN.evaluate(() => {
      const e = document.querySelector(".cd-prixg");
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { t: e.textContent.replace(/\s+/g, " ").trim(), h: Math.round(b.height), deborde: b.right > 390 };
    });
    dire(
      !!prix && !prix.deborde && prix.h < 140,
      `le salaire tient sans déborder (« ${prix?.t ?? "absent"} », ${prix?.h ?? "?"} points)`,
    );
  }
  await na.close();
}

// ═══ RIEN NE PASSE SOUS LA BARRE DU HAUT, ENCOCHE COMPRISE ════════════════
//
// CE QUE ÇA PROTÈGE : « Le rond est en dehors tout en haut, donc le mettre au
// bon endroit plus bas. »
//
// CE DÉFAUT NE POUVAIT PAS SE VOIR SANS CETTE GARDE, et c'est ce qui le rend
// intéressant. `env(safe-area-inset-top)` vaut ZÉRO dans un navigateur de
// bureau et cinquante-neuf sur son iPhone. Toutes les captures prises ici
// montraient donc un écran parfaitement rangé pendant que le rond recouvrait la
// cloche des notifications sur le sien — et une cloche est un GESTE, donc
// inatteignable.
//
// ON SIMULE L'ENCOCHE PAR SA VARIABLE, PAS PAR LE REMBOURRAGE DE LA BARRE. La
// barre et le rond descendent tous deux de `--ap-encoche` : en la forçant, les
// deux bougent ensemble et la mesure est fidèle. Déplacer la barre à la main
// aurait laissé le rond où il est, c'est-à-dire fabriqué un faux positif puis un
// faux négatif.
{
  console.log("\n══ avec une encoche, rien ne passe sous la barre du haut ══");
  const en = await nav.newContext({
    // SON TÉLÉPHONE, PAS CELUI DE LA SUITE : 430 points, un Pro Max.
    viewport: { width: 430, height: 932 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await en.clock.setFixedTime(new Date(2026, 8, 2, 8, 30, 0));
  await en.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pE = await en.newPage();
  // LA BOULANGERIE À 8 H 30 : c'est sa capture, titre long donc rond en haut.
  await pE.goto(`${BASE}/autour-de-moi?carte=boulange`, { waitUntil: "networkidle" });
  await pE.waitForTimeout(2000);
  await pE.addStyleTag({ content: `.ap-app{--ap-encoche:59px !important;}` });
  await pE.waitForTimeout(400);
  const g = await pE.evaluate(() => {
    const c = [...document.querySelectorAll(".cd-carte")].pop();
    const r = (e) => {
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { t: b.top, b: b.bottom, l: b.left, r: b.right };
    };
    const couvre = (x, y) =>
      !!x && !!y && x.r > y.l + 2 && x.l < y.r - 2 && x.b > y.t + 2 && x.t < y.b - 2;
    const an = r(c?.querySelector(".cd-anneau"));
    const barre = r(document.querySelector(".ap-haut"));
    // LES GESTES DE LA BARRE, UN PAR UN : c'est eux qu'on ne doit pas couvrir.
    const gestes = [...document.querySelectorAll(".ap-haut button, .ap-haut a")].map(r);
    return {
      anneau: an ? Math.round(an.t) : null,
      barre: barre ? Math.round(barre.b) : null,
      surBarre: couvre(an, barre),
      surUnGeste: gestes.filter((x) => couvre(an, x)).length,
      titre: c?.querySelector(".cd-offre")?.textContent?.trim() ?? "",
    };
  });
  dire(g.anneau != null, "l'annonce d'un titre long porte son rond");
  dire(
    !g.surBarre,
    `et il se pose SOUS la barre du haut (rond à ${g.anneau}, barre jusqu'à ${g.barre})`,
  );
  dire(g.surUnGeste === 0, `il ne recouvre aucun geste de la barre (${g.surUnGeste})`);
  // ET L'UNITÉ NE QUITTE PAS SON NOMBRE — « LA FOURNÉE DE 7 » puis « H » tout
  // seul en capitales de soixante points se lit comme une panne.
  dire(
    /7 h/.test(g.titre),
    `le titre garde son heure d'un bloc (« ${g.titre.replace(/ /g, "·")} »)`,
  );
  await en.close();
}

// ═══ LE PREMIER ÉCRAN RACONTE LE PARCOURS, PAS DES QUALITÉS ═══════════════
//
// CE QUE ÇA PROTÈGE : « Concernant le premier écran de découverte, il faut
// entièrement le refaire pour coller au concept, qui a beaucoup évolué :
// découvrir l'offre du jour du commerçant, l'essayer virtuellement, donner son
// avis sur l'essayage du produit, en discuter avec nos amis, la réserver ou
// pas. »
//
// CET ÉCRAN-LÀ N'EST VU QU'UNE FOIS PAR PERSONNE, et c'est exactement pourquoi
// il a besoin d'une garde. Personne ne le revoit en travaillant — il est passé
// depuis le premier jour sur chaque téléphone de l'équipe, et toutes les autres
// suites de ce fichier le sautent exprès pour atteindre le paquet. Un écran
// qu'on ne revoit jamais est un écran qui vieillit sans que personne le
// remarque : celui-ci a décrit pendant des semaines un produit qui avait changé.
//
// L'ORDRE EST LE FOND. On ne donne pas son avis sur un essayage qu'on n'a pas
// fait ; on ne réserve qu'APRÈS avoir vu. La garde vérifie donc les cinq temps
// ET leur suite, pas leur simple présence.
{
  console.log("\n══ le premier écran raconte les cinq temps ══");
  const ac = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await ac.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  // ON NE POSE PAS `clikme-vu-v1` ICI : c'est le seul endroit du fichier qui
  // veut justement le premier passage.
  const pA = await ac.newPage();
  pA.on("pageerror", (e) => dire(false, `le premier écran lève une erreur : ${e.message}`));
  await pA.goto(`${BASE}/autour-de-moi`, { waitUntil: "networkidle" });
  await pA.waitForTimeout(2600);
  const a = await pA.evaluate(() => {
    const e = document.querySelector(".ap-accueil");
    if (!e) return null;
    return {
      titre: e.querySelector("h2")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      compte: e.querySelector(".ap-acc-n b")?.textContent?.trim() ?? "",
      // LES CINQ TEMPS SONT DANS LA LISTE DU REPLI — celle qui ne s'affiche
      // qu'avec les animations coupées. Elle est dans le document dans tous les
      // cas, et c'est elle qui fait foi : la frise ne montre que des
      // pictogrammes, et la légende ne nomme que l'acte en cours.
      etapes: [...e.querySelectorAll(".ap-acc-tous b")].map((b) => b.textContent.trim()),
      pastilles: e.querySelectorAll(".ap-acc-pas i").length,
      geste: e.querySelector(".ap-acc-g")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      // ═══ CE QUI SE JOUE, ET CE QUI NE DOIT PAS ÊTRE INVENTÉ ═══════════
      //
      // LA SCÈNE EST LA RÉPONSE À « ce n'est vraiment pas fun ». Elle doit
      // donc EXISTER — une scène tombée laisserait l'écran muet sans que rien
      // ne casse — et elle doit CHANGER D'ACTE toute seule.
      acte: (() => {
        const sc = e.querySelector(".ap-acc-sc");
        return sc ? ([...sc.classList].find((k) => k.startsWith("a-")) ?? null) : null;
      })(),
      // ET LA PASTILLE DE PRIX NE S'ÉCRIT QUE SI LE COMMERÇANT L'A ANNONCÉ.
      // Elle a porté « −40 % » en dur pendant un commit, posé sur la photo et
      // sous le titre d'un vrai commerce de Dax : une remise attribuée à
      // quelqu'un qui ne l'a pas consentie, sur le tout premier écran.
      prix: e.querySelector(".ap-sc-prix")?.textContent?.trim() ?? null,
      legende: e.querySelector(".ap-acc-lg b")?.textContent?.trim() ?? null,
      cartes: document.querySelectorAll(".cd-carte").length,
    };
  });
  if (!a) {
    dire(false, "le premier écran s'affiche au premier passage");
  } else {
    dire(a.etapes.length === 5, `il raconte cinq temps (${a.etapes.length})`);
    const attendus = [/offre du jour/i, /essayez/i, /pensez|avis/i, /amis/i, /réservez/i];
    dire(
      attendus.every((r, i) => r.test(a.etapes[i] ?? "")),
      `et dans son ordre à lui (${a.etapes.join(" › ")})`,
    );
    dire(a.pastilles === 5, `la frise montre les cinq d'un coup d'œil (${a.pastilles})`);
    dire(!!a.acte, `et la scène joue (${a.acte ?? "aucune"})`);
    dire(
      a.prix !== "−40 %" && a.prix !== "-40 %",
      `la pastille de prix n'invente rien (${a.prix ?? "absente, et c'est permis"})`,
    );
    dire(/essayez/i.test(a.titre), `le titre porte ce que personne d'autre ne fait (« ${a.titre} »)`);
    // LE COMPTE EXISTE ET N'EST PAS ZÉRO. On ne peut pas vérifier d'ici qu'il
    // vient bien du paquet — le paquet n'est pas encore monté derrière cet
    // écran — et une garde qui prétendrait le faire mentirait sur ce qu'elle
    // mesure. Ce qu'elle attrape reste utile : le jour où la source se casse,
    // l'écran afficherait « 0 commerces autour de vous » en grand.
    dire(Number(a.compte) > 0, `et il annonce un nombre réel de commerces (${a.compte})`);
    // PAS DE BOUTON « J'AI COMPRIS » : le geste qu'on apprend EST la sortie.
    dire(/glissez/i.test(a.geste), `on en sort par le geste qu'on vient d'apprendre (« ${a.geste} »)`);
    // ═══ ET ELLE TOURNE VRAIMENT ══════════════════════════════════════════
    //
    // C'EST LA SEULE MESURE QUI RÉPOND À SA PHRASE. Tout le reste — la frise,
    // la légende, la scène — peut être parfaitement en place sur une image
    // figée : c'est exactement ce qu'était l'écran d'avant, « pas fun ». Une
    // minuterie qui ne part pas, un effet qui ne se relance pas, et l'écran
    // redevient une affiche sans que rien n'ait l'air cassé.
    await pA.waitForTimeout(4200);
    const apres = await pA.evaluate(() => {
      const sc = document.querySelector(".ap-acc-sc");
      return {
        acte: sc ? ([...sc.classList].find((k) => k.startsWith("a-")) ?? null) : null,
        legende: document.querySelector(".ap-acc-lg b")?.textContent?.trim() ?? null,
      };
    });
    dire(
      !!apres.acte && apres.acte !== a.acte,
      `quatre secondes plus tard, elle a changé d'acte (${a.acte} → ${apres.acte})`,
    );
    dire(
      !!apres.legende && apres.legende !== a.legende,
      `et la légende suit ce qui se joue (« ${a.legende} » → « ${apres.legende} »)`,
    );
  }
  await ac.close();
}

// ═══ SES PHOTOS, EN BANDE SOUS L'ANNONCE ══════════════════════════════════
//
// CE QUE ÇA PROTÈGE : « Ça peut n'être que 3 photos ou 5, donc il faudra
// ajuster en fonction de ce que le commerçant aura mis. Et quand on appuie sur
// une photo, elle se met à la place de la grande photo plein écran qu'on a déjà
// quand on arrive sur l'annonce. Et s'il n'y a qu'une seule photo, alors aucune
// miniature n'apparaît et ça fait gagner de la place sur l'annonce. »
//
// TROIS RÈGLES, ET LA TROISIÈME EST CELLE QU'ON CASSE SANS S'EN APERCEVOIR. Le
// nombre variable se voit ; l'échange de photo se voit ; l'ABSENCE de bande
// chez un commerçant qui n'a qu'une photo ne se voit que si on va exprès chez
// lui. C'est pourtant elle qui porte l'intention — « ça fait gagner de la place
// » — et le jour où une bande d'une seule vignette réapparaît, personne ne
// trouvera ça anormal en relisant l'écran.
{
  console.log("\n══ ses photos changent la grande, et disparaissent s'il n'en a qu'une ══");
  const ph = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await ph.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  await ph.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pP = await ph.newPage();

  // LA CARTE DU DESSUS EST LA DERNIÈRE DU DOM — le paquet empile.
  const etat = () =>
    pP.evaluate(() => {
      const c = [...document.querySelectorAll(".cd-carte")].pop();
      if (!c) return null;
      const fond = (e) =>
        (getComputedStyle(e).backgroundImage.match(/direct\/[^"')]+/) || [null])[0];
      return {
        vignettes: [...c.querySelectorAll(".cd-vig")].map((v) => fond(v)),
        vue: [...c.querySelectorAll(".cd-vig")].findIndex((v) => v.classList.contains("vue")),
        grande: fond(c.querySelector(".cd-photo")),
        legende: c.querySelector(".cd-bande-l")?.textContent?.trim() ?? null,
      };
    });

  await pP.goto(`${BASE}/autour-de-moi?carte=deux-rues`, { waitUntil: "networkidle" });
  await pP.waitForTimeout(1800);
  const a = await etat();
  dire((a?.vignettes.length ?? 0) >= 3, `un restaurant qui a des photos les montre (${a?.vignettes.length ?? 0})`);
  // CHAQUE VIGNETTE EST UNE IMAGE DIFFÉRENTE : la photo du jour est souvent
  // déjà dans ses photos de fiche, et la bande la montrait deux fois.
  dire(
    new Set(a?.vignettes ?? []).size === (a?.vignettes.length ?? 0),
    "aucune n'est montrée deux fois",
  );
  dire(a?.vue === 0, "celle de l'annonce ouvre la bande et se voit comme telle");
  dire(a?.grande === a?.vignettes[0], "et c'est elle qui est plein cadre");

  await pP.locator(".cd-carte").last().locator(".cd-vig").nth(1).click();
  await pP.waitForTimeout(700);
  const b = await etat();
  dire(
    b?.grande === a?.vignettes[1] && b?.grande !== a?.grande,
    `appuyer sur une vignette la met plein cadre (${b?.grande ?? "rien"})`,
  );
  dire(!!b?.legende, `et ce qu'on regarde est nommé (« ${b?.legende ?? "rien"} »)`);
  dire(b?.vue === 1, "la bande dit laquelle est au mur, donc comment revenir");

  // ET LE CAS QUI NE SE VOIT PAS : un commerçant qui n'a qu'une photo.
  await pP.goto(`${BASE}/autour-de-moi?carte=boucher`, { waitUntil: "networkidle" });
  await pP.waitForTimeout(1800);
  const s = await etat();
  dire(
    s?.vignettes.length === 0,
    `avec une seule photo, aucune miniature ne prend de place (${s?.vignettes.length ?? "?"})`,
  );

  // ═══ ET LE NOMBRE VARIE VRAIMENT D'UN COMMERÇANT À L'AUTRE ══════════════
  //
  // « Ça peut n'être que 3 photos ou 5, donc il faudra ajuster en fonction de
  // ce que le commerçant aura mis. »
  //
  // UNE BANDE QUI MONTRERAIT TOUJOURS QUATRE VIGNETTES PASSERAIT TOUTES LES
  // MESURES DU DESSUS. Elles vérifient qu'il y en a, qu'elles changent la
  // grande, qu'elles disparaissent à une seule photo — aucune ne vérifie que
  // le compte SUIT le commerçant. Trois comptes différents sur trois métiers,
  // c'est la seule preuve que rien n'est câblé en dur.
  const comptes = {};
  for (const [id, h] of [["boulange", 8.5], ["bar-vins", 18.5], ["coif-centre", 12.5]]) {
    await ph.clock.setFixedTime(new Date(2026, 8, 2, Math.floor(h), (h % 1) * 60, 0));
    await pP.goto(`${BASE}/autour-de-moi?carte=${id}`, { waitUntil: "networkidle" });
    await pP.waitForTimeout(1800);
    comptes[id] = (await etat())?.vignettes.length ?? 0;
  }
  const dits = Object.entries(comptes).map(([k, v]) => `${k} ${v}`).join(" · ");
  dire(
    Object.values(comptes).every((n) => n >= 2),
    `chacun montre ce qu'il a (${dits})`,
  );
  dire(
    new Set(Object.values(comptes)).size >= 2,
    "et le compte suit le commerçant au lieu d'être câblé",
  );
  await ph.close();
}

// ═══ LE MUR D'UN LIEU, D'APRÈS LA MAQUETTE ════════════════════════════════
//
// CE QUE ÇA PROTÈGE : « Restaurant, bars et événements : respecter le design là
// aussi et les changements qu'on opère en fonction du cahier des charges édicté
// plus haut. Le fantôme amène sur le mur du restaurant avec la possibilité de
// mettre son propre fantôme. »
//
// CE MUR-LÀ NE SUIT PAS LE RITUEL DE L'ESSAI, ET C'EST VOULU. Chez un bar on ne
// vient pas essayer quelque chose sur soi : on vient dire qu'on est là, et lire
// qui y est. La maquette lui donne donc sa propre tête — une invitation en
// carte, avec son dégradé — et UN SEUL geste par message : « Ça m'intéresse »,
// qui parle au lieu.
//
// LE SECOND GESTE A ÉTÉ RETIRÉ SUR SA DEMANDE, et la garde qui le mesurait
// avec lui : « supprimer en parler ». Elle vérifiait que les deux tenaient côte
// à côte — une exigence de mise en page pour un bouton qui n'existe plus. On ne
// garde pas une mesure qui décrit l'écran d'avant : c'est la manière la plus
// sûre de faire échouer une suite sur une décision produit tenue.
//
// CE QUE LA GARDE MESURE MAINTENANT : que l'invitation existe et porte le
// geste, que le titre de section est celui de la maquette, que les six éléments
// retirés le sont restés, et que le mur se déplie plutôt que de tout dérouler.
{
  console.log("\n══ chez un bar, on vient dire qu'on est là ══");
  const bar = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await bar.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  await bar.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pV = await bar.newPage();
  await pV.goto(`${BASE}/autour-de-moi?carte=bistrot`, { waitUntil: "networkidle" });
  await pV.waitForTimeout(1500);
  const fv = await pV.$(".ap-monfantome");
  if (!fv) {
    dire(false, "l'annonce du bar porte son fantôme");
  } else {
    await fv.click();
    await pV.waitForTimeout(1200);
    const t = await pV.evaluate(() => {
      return {
        invitation: document.querySelector(".mu-inv-t h2")?.textContent?.trim() ?? null,
        geste: document.querySelector(".mu-inv-b b")?.textContent?.trim() ?? null,
        // LE TITRE EST DANS `.mu-qui`, PAS DANS `.mu-qui-t`. Le second était le
        // cadre qui portait aussi la pastille du jour ; la pastille est partie
        // avec le paragraphe qu'il a demandé de supprimer, et le cadre avec
        // elle. La garde décrivait donc une enveloppe disparue et lisait `null`
        // sur un titre parfaitement affiché — encore une garde qui décrit une
        // FORME au lieu de chercher le MOT.
        section: document.querySelector(".mu-qui h3")?.textContent?.trim() ?? null,
        // ═══ CE QUI A ÉTÉ RETIRÉ DOIT LE RESTER ═══════════════════════════
        //
        // « Supprimer en parler, et supprimer ce paragraphe : Les Fantômes
        // laissés ici aujourd'hui. 🕐 Aujourd'hui. Quelque chose vous parle ?…
        // Supprimer cette section aussi : 6 Fantômes laissés ici aujourd'hui /
        // De la place, sans attendre / Découvre aussi les autres murs. »
        //
        // LES SIX RÉPÉTAIENT LE TITRE, LES CARTES, OU RENVOYAIENT AILLEURS
        // depuis le seul écran où l'on est arrivé exprès. Une garde qui compte
        // à zéro a l'air de ne rien mesurer ; celle-ci mesure qu'on n'a pas
        // remis, au prochain ajustement, ce qu'on vient de retirer.
        retires:
          document.querySelectorAll(
            ".mu-parler, .mu-qui-j, .mu-haut-cle, .mu-pied, .mu-ctx, .mu-ailleurs",
          ).length,
        cartes: document.querySelectorAll(".mu-rang:not(.grille) .mu-c").length,
        deplie: document.querySelector(".mu-tout")?.textContent?.replace(/\s+/g, " ").trim() ?? null,

        // ET PAS DE RITUEL D'ESSAI ICI : ni grille, ni geste d'essayage.
        grille: document.querySelectorAll(".mu-rang.grille").length,
      };
    });
    dire(
      /vous êtes ici/i.test(t.invitation ?? ""),
      `l'invitation demande quelque chose (« ${t.invitation ?? "absente"} »)`,
    );
    dire(t.geste === "JE SUIS ICI", `et son geste porte les mots de la maquette (« ${t.geste ?? "absent"} »)`);
    dire(
      /qui est là/i.test(t.section ?? ""),
      `la section dit qui est là (« ${t.section ?? "absente"} »)`,
    );
    dire(t.cartes >= 4, `le mur porte ses messages (${t.cartes})`);
    dire(
      t.retires === 0,
      `et ce qui a été retiré l'est resté (${t.retires} élément${t.retires > 1 ? "s" : ""} revenu${t.retires > 1 ? "s" : ""})`,
    );
    dire(
      /voir tout le mur/i.test(t.deplie ?? ""),
      `le reste se déplie au lieu de tout dérouler (« ${t.deplie ?? "absent"} »)`,
    );
    dire(t.grille === 0, "un bar n'a pas de grille d'essai, et c'est voulu");
  }
  await bar.close();
}

// ═══ LE MUR DU FLASH DU MOIS ═══════════════════════════════════════════════
//
// CE QUE ÇA PROTÈGE : « J'ai mis douze photos du même dessin pour que le mur
// du jour ait bien le même tatouage dans différentes situations. Donc quand on
// clique sur le fantôme sur l'annonce du tatoueur, on aura non pas "essayer
// le" mais le mur du tatouage de ceux qui l'ont fait. »
//
// C'EST LA RÈGLE DU FANTÔME, MESURÉE SUR LE CAS QUI COMPTE LE PLUS. Un mur
// vide mène à l'essai, un mur rempli mène à lui-même — et le tatoueur est le
// métier où cette règle vaut le plus cher, parce qu'un tatouage ne se refait
// pas. La garde vérifie les trois choses ensemble : qu'on arrive bien sur le
// mur, qu'il porte les douze, et que le geste d'essai reste atteignable en bas
// plutôt que d'avoir disparu avec la redirection.
{
  console.log("\n══ le tatoueur ouvre sur ceux qui portent déjà le dessin ══");
  const ta = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await ta.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  await ta.addInitScript(() =>
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"])),
  );
  const pT = await ta.newPage();
  await pT.goto(`${BASE}/autour-de-moi?carte=tatoueur`, { waitUntil: "networkidle" });
  await pT.waitForTimeout(1400);
  const fantome = await pT.$(".ap-monfantome");
  if (!fantome) {
    dire(false, "l'annonce du tatoueur porte son fantôme");
  } else {
    await fantome.click();
    await pT.waitForTimeout(1200);
    // ═══ ON FAIT DESCENDRE LE MUR AVANT DE MESURER SES PHOTOS ═══════════════
    //
    // DEFAUT DE GARDE, PAS DE PRODUIT : les vignettes portent `loading="lazy"`,
    // donc les dernieres de la grille n'ont pas commence a charger tant qu'on
    // ne les a pas approchees — et `naturalWidth` vaut alors zero, exactement
    // comme pour un 404. La garde accusait deux photos parfaitement servies
    // (verifie : HTTP 200, JPEG valide). Une garde qui ne distingue pas « pas
    // encore chargee » de « introuvable » ne mesure rien.
    // ON APPROCHE CHAQUE VIGNETTE, UNE PAR UNE. Faire defiler le conteneur ne
    // suffisait pas : la feuille du mur n'est pas toujours l'element qui
    // defile, et deux photos sur douze restaient hors de portee du chargement
    // differe. `scrollIntoViewIfNeeded` ne suppose rien de la mise en page.
    const vignettes = await pT.$$(".mu-rang.grille .mu-c-p img");
    for (const v of vignettes) {
      await v.scrollIntoViewIfNeeded().catch(() => null);
      await pT.waitForTimeout(90);
    }
    await pT.waitForTimeout(1500);
    const mur = await pT.evaluate(() => ({
      surLeMur: !!document.querySelector(".mu-haut.essai"),
      surLaPhoto: !!document.querySelector(".mu-ph-tete"),
      compte: document.querySelector(".mu-haut-n")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      vignettes: document.querySelectorAll(".mu-rang.grille .mu-c").length,
      // CHAQUE VIGNETTE MONTRE UNE VRAIE PHOTO : une image absente garde sa
      // place et sa couleur de fond, donc seule `naturalWidth` la trahit.
      images: [...document.querySelectorAll(".mu-rang.grille .mu-c-p img")].map((i) => ({
        src: i.getAttribute("src"),
        // `complete` SEUL NE SUFFIT PAS : il est vrai aussi apres un echec.
        // C'est la largeur naturelle qui separe une image servie d'un 404.
        chargee: i.complete && i.naturalWidth > 0,
      })),
      geste: document.querySelector(".mu-bas .mu-cta b")?.textContent?.trim() ?? null,
    }));
    dire(mur.surLeMur && !mur.surLaPhoto, "le fantôme mène au mur, pas à l'essayage");
    dire(
      /^12 essayages/.test(mur.compte ?? ""),
      `et le mur annonce les douze (« ${mur.compte ?? "rien"} »)`,
    );
    dire(mur.vignettes >= 12, `qui sont bien là, en grille (${mur.vignettes})`);
    dire(
      mur.images.length > 0 && mur.images.every((i) => i.chargee),
      `et chaque photo existe vraiment${mur.images
        .filter((i) => !i.chargee)
        .map((i) => ` — ${i.src}`)
        .join("")}`,
    );
    // LE MÊME DESSIN, DES ENDROITS DIFFÉRENTS : c'est tout l'intérêt de ce mur.
    // Douze photos distinctes, pas la même répétée douze fois.
    const distinctes = new Set(mur.images.map((i) => i.src)).size;
    dire(distinctes >= 12, `douze photos distinctes du même dessin (${distinctes})`);
    dire(
      !!mur.geste && /essayer/i.test(mur.geste),
      `et on peut toujours l'essayer, en bas (« ${mur.geste ?? "absent"} »)`,
    );
  }
  await ta.close();
}

// ═══ ON N'OUVRE JAMAIS WHATSAPP SUR UN NUMÉRO DE FICTION ═══════════════════
//
// CE QUE ÇA PROTÈGE : « La prise de RDV en ligne via WhatsApp : ça ouvre bien
// WhatsApp mais propose mon propre carnet d'adresses (pas le tél du coiffeur
// par défaut). Bug ? »
//
// LE DÉFAUT, ET IL ÉTAIT DOUBLE. `wa.me` sans numéro ouvre le carnet
// d'adresses — trois appels sur quatre partaient ainsi, parce que le
// destinataire était un paramètre FACULTATIF qu'on pouvait oublier. Et même
// avec numéro, celui des commerces de la maquette est un numéro de fiction :
// WhatsApp ne l'a pas dans son annuaire et s'ouvre là encore sur la liste des
// conversations. Un garde-fou existait bien, mais il testait `!mur.telephone`,
// un champ que `murDeLaCarte` remplit TOUJOURS — il ne s'est donc jamais
// déclenché.
//
// CE QUE CETTE GARDE MESURE : qu'au bout du rituel, le geste commercial
// n'ouvre AUCUNE fenêtre, et qu'il dit la vérité à la place — le commerce est
// inventé, voici son numéro, voici le message qui partirait.
{
  console.log("\n══ on n'ouvre pas WhatsApp sur un numéro qui n'existe pas ══");
  const tel = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: "fr-FR",
  });
  await tel.clock.setFixedTime(new Date(2026, 2, 12, 11, 20, 0));
  // ON PIÈGE `window.open` AVANT LE PREMIER SCRIPT DE LA PAGE. C'est la seule
  // façon de savoir qu'aucune fenêtre n'est partie : une fenêtre qui s'ouvre
  // puis se referme ne laisse aucune trace dans le document.
  await tel.addInitScript(() => {
    localStorage.setItem("clikme-vu-v1", JSON.stringify(["accueil"]));
    window.__ouverts = [];
    window.open = (u) => {
      window.__ouverts.push(String(u));
      return null;
    };
  });
  const pF = await tel.newPage();
  await pF.goto(`${BASE}/autour-de-moi?carte=cirier&essai=1&exemple=1`, { waitUntil: "networkidle" });
  await pF.waitForTimeout(1600);
  // LA CIRIÈRE EST LE SEUL MUR DONT LE RENDU SE CALCULE ICI, sans clé d'image :
  // sa pièce porte un découpage, donc l'essai va jusqu'au bout hors ligne.
  //
  // ON Y ENTRE PAR L'ADRESSE, plus par un bouton : « Voir avec la photo
  // d'exemple » a été retiré de l'écran, le chemin est resté.
  {
    const grille = await pF.$(".mu-pieces");
    dire(!!grille, "l'essai s'ouvre sur la grille des pièces, sans appareil photo");
    const piece = await pF.$(".mu-pieces button:not(.bientot)");
    if (piece) {
      await piece.click();
      await pF.waitForSelector(".mu-rendu", { timeout: 60000 }).catch(() => null);
      await pF.waitForTimeout(2200);
      const avis = await pF.$(".mu-cta");
      if (avis) {
        await avis.click();
        await pF.waitForTimeout(800);
        const cinq = (await pF.$$(".mu-avis-f button, .mu-note-f button"))[4];
        if (cinq) { await cinq.click(); await pF.waitForTimeout(350); }
        const suite = await pF.$('button:has-text("Continuer")');
        if (suite) { await suite.click(); await pF.waitForTimeout(1300); }
      }
    }
    const gestes = await pF.$$eval(".mu-agir-b", (bs) =>
      bs.map((b) => b.textContent.trim().replace(/\s+/g, " ")),
    );
    dire(gestes.length === 3, `le rituel finit sur ses trois gestes (${gestes.length})`);
    // LE DEUXIÈME EST L'ACTION DU MÉTIER — « La réserver » chez la cirière —
    // et c'est celui qui écrivait au commerçant.
    const agir = (await pF.$$(".mu-agir-b"))[1];
    if (agir) {
      await agir.click();
      await pF.waitForTimeout(1200);
      const suite = await pF.evaluate(() => ({
        ouverts: window.__ouverts ?? [],
        fiction: !!document.querySelector(".mu-envoi.fiction"),
        dit: document.querySelector(".mu-envoi")?.textContent?.replace(/\s+/g, " ") ?? "",
        numero: document.querySelector(".mu-envoi em s")?.textContent?.trim() ?? null,
      }));
      dire(
        suite.ouverts.length === 0,
        `aucune fenêtre ne s'ouvre sur le carnet d'adresses${
          suite.ouverts.length ? ` (${suite.ouverts[0].slice(0, 60)})` : ""
        }`,
      );
      dire(suite.fiction, "l'écran dit à la place que le commerce est inventé");
      dire(
        /^06 39 98 /.test(suite.numero ?? ""),
        `et montre son numéro, de la plage réservée à la fiction (${suite.numero ?? "aucun"})`,
      );
      dire(
        /message qui partirait/i.test(suite.dit),
        "avec le message qui partirait chez un vrai commerçant",
      );
    } else {
      dire(false, "l'action du métier est atteignable au bout du rituel");
    }
  }
  await tel.close();
}

// ═══ LA PAGE D'ACCUEIL DIT CE QUE LE PRODUIT A DE NOUVEAU ══════════════════
//
// CE QU'ELLE PROTÈGE, ET LE DÉFAUT ÉTAIT MESURABLE : « la page d'accueil est
// désuète ». Elle racontait quatre situations vraies — le midi, un désistement,
// un concert, un poste — que n'importe quelle application de ville pourrait
// raconter, et elle ne prononçait ni le mot « essai » ni le mot « fantôme ».
// Les deux seules choses du produit qu'on ne trouve nulle part ailleurs étaient
// absentes de la page chargée de le vendre.
//
// CE QUE CETTE GARDE NE MESURE PAS : le goût. Elle mesure qu'on montre plutôt
// que d'expliquer — une vraie carte qui tourne, deux photos qu'on superpose au
// doigt, de vrais fantômes avec leurs trois verdicts — et que le sommaire du
// haut nomme le chapitre le plus neuf. Une page peut être laide et passer ;
// elle ne peut pas taire son produit et passer.
{
  console.log("\n══ la page d'accueil montre ce qui n'existe nulle part ailleurs ══");
  const grand = await nav.newContext({
    viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, locale: "fr-FR",
  });
  await grand.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
  const pD = await grand.newPage();
  const bruit = [];
  pD.on("pageerror", (e) => bruit.push(String(e)));
  pD.on("console", (m) => { if (m.type() === "error") bruit.push(m.text()); });
  await pD.goto(`${BASE}/le-direct`, { waitUntil: "networkidle" });
  await pD.waitForTimeout(1200);

  const mots = await pD.evaluate(() => document.body.innerText);
  dire(/essay/i.test(mots), "elle parle de l'essai");
  dire(/fant[oô]me/i.test(mots), "et du fantôme");

  // ═══ LE TITRE EST CELUI DE LA MAQUETTE ══════════════════════════════════
  //
  // « Oula, c'est beaucoup trop compliqué à comprendre, ça manque de
  // simplicité ! J'ai fait un mock-up que tu peux répliquer et animer. »
  //
  // LA MAQUETTE REMET LE DIRECT EN TITRE, alors qu'on avait arbitré l'inverse
  // deux échanges plus tôt — l'essai en titre parce qu'il est l'hameçon. C'est
  // le droit de son auteur, et l'essai reste en section 2. On garde donc trace
  // des DEUX : le titre dit ce qui se passe en ville, et la section 2 promet
  // l'essai sur soi. Si l'une des deux disparaît dans une réécriture, la page
  // ne fait plus qu'une moitié de promesse.
  const h1 = await pD.$eval("h1", (e) => e.textContent.replace(/\s+/g, " ").trim());
  dire(/ville/i.test(h1), `le titre parle de la ville (« ${h1} »)`);
  const h2 = await pD.$$eval("h2", (l) => l.map((e) => e.textContent.replace(/\s+/g, " ").trim()));
  dire(
    h2.some((t) => /sur vous/i.test(t)),
    `et la section 2 promet l'essai sur soi (${h2.filter((t) => /sur vous/i.test(t)).join("") || "absente"})`,
  );

  // ═══ LA SECTION QU'ON MANIPULE ══════════════════════════════════════════
  //
  // « Quand section 2 on clique sur un métier on a un exemple animé. »
  //
  // C'EST LE CŒUR DE LA MAQUETTE : on ne lit plus, on appuie. Une page qui
  // perdrait cette interaction redeviendrait exactement ce qu'elle remplace.
  const onglets = await pD.$$eval(".ld-es-l button", (l) =>
    l.map((e) => e.textContent.trim()),
  );
  dire(onglets.length >= 5, `on peut choisir le métier qu'on veut voir (${onglets.length})`);
  dire(
    new Set(onglets).size === onglets.length,
    `et chacun a son nom (${onglets.join(" · ")})`,
  );
  // LE PANNEAU OUVERT EN ARRIVANT EST CELUI QUI DÉMONTRE. Une section dont le
  // premier écran est une promesse plutôt qu'une preuve a déjà perdu.
  dire(
    !!(await pD.$(".ld-es-vue .ld-miroir")),
    "et celui qui s'ouvre en arrivant montre un vrai avant/après",
  );
  // ET APPUYER CHANGE VRAIMENT LE PANNEAU. Une rangée d'onglets qui s'allument
  // sans rien changer est le pire des deux mondes : on croit avoir agi.
  const avant = await pD.$eval(".ld-es-vue", (e) => e.innerHTML.length);
  await (await pD.$$(".ld-es-l button"))[0].click();
  await pD.waitForTimeout(600);
  const apres = await pD.$eval(".ld-es-vue", (e) => e.innerHTML.length);
  dire(avant !== apres, "appuyer sur un métier change le panneau");
  const allume = await pD.$$eval(".ld-es-l button.on", (l) => l.length);
  dire(allume === 1, `et un seul métier reste allumé (${allume})`);

  // ═══ LE LOGO EST LE VRAI ════════════════════════════════════════════════
  //
  // « Le logo de ClikMe n'est pas le bon, il me semble. » Il ne l'était pas :
  // la barre portait un REPÈRE DE CARTE violet dessiné à la main, suivi du mot
  // « ClikMe » en caractères de la page. Un repère de carte est le logo de tout
  // le monde. Celui de ClikMe existe depuis le début du dépôt — le mot en
  // minuscules dont le K est une flèche de curseur verte.
  //
  // DEUX FICHIERS, PARCE QU'IL Y A DEUX FONDS : lettres blanches sur la barre
  // sombre, encre sur le pied clair. Cette garde tombe si quelqu'un redessine
  // un troisième logo, ou s'il met le même fichier aux deux endroits — auquel
  // cas l'un des deux devient invisible sur son fond.
  const logos = await pD.$$eval(".ld-marque img", (l) =>
    l.map((e) => decodeURIComponent(e.getAttribute("src") ?? "")),
  );
  dire(logos.length === 2, `le logo est une image, en haut et en bas (${logos.length})`);
  dire(
    logos.every((s) => /clikme-logo/.test(s)),
    "et c'est le vrai fichier du dépôt, pas un dessin refait",
  );
  dire(
    logos.some((s) => /blanc/.test(s)) && logos.some((s) => !/blanc/.test(s)),
    "chacun sur le fond qui lui va : le blanc sur la barre sombre, l'encre sur le pied clair",
  );

  // ═══ LA PROMESSE DE L'OUVERTURE ═════════════════════════════════════════
  //
  // « Votre ville bouge. Voyez ce qui s'y passe. » puis « Le Direct vous montre
  // en temps réel ce qui est disponible autour de vous ET VOUS PERMET DE
  // L'ESSAYER VIRTUELLEMENT. » Ce sont ses mots, et la seconde moitié de la
  // phrase est la seule chose que personne d'autre ne fait : une réécriture qui
  // la laisserait tomber ferait de cette page une application de ville de plus.
  const promesse = await pD
    .$eval(".ld-hero .ld-s", (e) => e.textContent.replace(/\s+/g, " ").trim())
    .catch(() => "");
  dire(/essayer/i.test(promesse), `l'ouverture promet l'essai (« ${promesse.slice(0, 96)} »)`);

  // ═══ L'OUVERTURE MONTRE LE FANTÔME ET LA BARRE DU BAS ═══════════════════
  //
  // « Le screenshot à côté, j'aurais aimé plutôt qu'il ait le fantôme et la
  // barre de menu du bas, pour montrer dans l'animation que lorsqu'on clique
  // sur le fantôme on peut essayer le produit. »
  //
  // TROIS CHOSES SE MESURENT ICI, et chacune est une moitié de la démonstration :
  // les deux captures sont bien celles de l'application, l'anneau est posé SUR
  // le fantôme au point près, et la feuille d'essai finit vraiment par monter.
  const ecrans = await pD.evaluate(() => {
    const src = (s) =>
      decodeURIComponent(document.querySelector(s)?.getAttribute("src") ?? "");
    return { paquet: src(".ld-ouv > .ld-vt img"), essai: src(".ld-ouv-feuille img") };
  });
  dire(/hero-paquet/.test(ecrans.paquet), "l'ouverture montre la carte du jour avec sa barre du bas");
  dire(/hero-essai/.test(ecrans.essai), "et la feuille d'essai qui vient par-dessus");

  // L'ANNEAU EST SUR LE FANTÔME, ET C'EST MESURÉ EN POURCENTAGE DE L'ÉCRAN :
  // le bouton vert est à 50 % de la largeur et 95,9 % de la hauteur de la
  // capture. Posé en points, l'anneau glisserait à côté au premier palier
  // d'échelle — le cadre en a trois.
  const vise = await pD.evaluate(() => {
    const c = document.querySelector(".ld-ouv-cible")?.getBoundingClientRect();
    const e = document.querySelector(".ld-ouv .ld-vt-ecran")?.getBoundingClientRect();
    if (!c || !e) return null;
    return {
      x: (c.x + c.width / 2 - e.x) / e.width,
      y: (c.y + c.height / 2 - e.y) / e.height,
    };
  });
  dire(
    !!vise && Math.abs(vise.x - 0.5) < 0.04 && Math.abs(vise.y - 0.959) < 0.04,
    `et l'appui est dessiné sur le fantôme (${vise ? `${(vise.x * 100).toFixed(1)} % / ${(vise.y * 100).toFixed(1)} %` : "absent"})`,
  );

  const monte = await pD
    .waitForSelector(".ld-ouv-feuille.ouverte", { timeout: 12000 })
    .then(() => true)
    .catch(() => false);
  dire(monte, "et appuyer sur le fantôme ouvre bien l'essai, tout seul, en boucle");

  // ═══ LES ENCRES DU FANTÔME SONT DANS L'ARBRE DE RENDU ═══════════════════
  //
  // LE DÉFAUT, ET IL NE SE VOYAIT QUE SUR TÉLÉPHONE : tous les fantômes de la
  // page étaient DÉCAPITÉS — bras, joues, bouche et points de lumière présents,
  // corps et yeux absents. Exactement les pièces remplies par un dégradé.
  //
  // DEUX CAUSES QUI SE CUMULENT. Chaque fantôme portait sa copie des dégradés
  // avec les mêmes identifiants — le navigateur ne retient que le premier — et
  // le premier de cette page est celui de l'ouverture, en `display:none` en
  // dessous de 900 points. Un élément retiré de l'arbre de rendu ne fournit plus
  // ses serveurs de peinture : `fill:url(#ldfCorps)` ne résolvait plus rien.
  //
  // ON MESURE DONC LES DEUX CONDITIONS : un seul porteur par identifiant, et son
  // SVG n'est ni masqué ni retiré. `display:none` ET `visibility:hidden` sont
  // tous les deux fautifs ici, ce qui est le genre de détail qu'on ne redécouvre
  // qu'en repayant le défaut.
  const encres = await pD.evaluate(() => {
    const noms = ["ldfCorps", "ldfOeil", "ldfCreux", "ldfLueur", "ldfFil"];
    return noms.map((id) => {
      const tous = document.querySelectorAll(`[id="${id}"]`);
      const svg = tous[0]?.closest("svg");
      let n = svg,
        cache = !svg;
      while (n && n !== document.documentElement) {
        const c = getComputedStyle(n);
        if (c.display === "none" || c.visibility === "hidden") { cache = true; break; }
        n = n.parentElement;
      }
      return { id, combien: tous.length, cache };
    });
  });
  dire(
    encres.every((e) => e.combien === 1),
    `chaque encre du fantôme n'est déclarée qu'une fois (${encres.map((e) => `${e.id}×${e.combien}`).join(" ")})`,
  );
  dire(
    encres.every((e) => !e.cache),
    "et aucune n'est posée dans une branche masquée, sinon les fantômes perdent leur corps",
  );

  // ═══ ET IL N'EST PAS ROGNÉ ══════════════════════════════════════════════
  //
  // « Il est bizarrement coupé à droite, voir photo. » Ses BRAS dépassaient la
  // zone de dessin : le moignon droit est une ellipse à cx=36,6 et rx=4, son
  // bord atteint 40,6 sur un cadre qui s'arrêtait à 40. Un SVG rogne son propre
  // cadre — c'est la règle du format, pas un réglage.
  const cadre = await pD.evaluate(() => {
    const f = document.querySelector(".ld-f-pied") ?? document.querySelector(".ld-f");
    if (!f) return null;
    const v = f.viewBox.baseVal;
    const b = f.getBBox();
    return {
      cadre: [v.x, v.y, v.width, v.height].map((n) => +n.toFixed(2)),
      trace: [b.x, b.y, b.width, b.height].map((n) => +n.toFixed(2)),
      rogne:
        b.x < v.x - 0.01 ||
        b.y < v.y - 0.01 ||
        b.x + b.width > v.x + v.width + 0.01 ||
        b.y + b.height > v.y + v.height + 0.01,
    };
  });
  dire(
    !!cadre && !cadre.rogne,
    `le fantôme tient entier dans son cadre, bras compris (${cadre ? `trace ${cadre.trace.join(" ")} dans ${cadre.cadre.join(" ")}` : "absent"})`,
  );

  // ═══ AUCUN BADGE DE MAGASIN N'EST UN LIEN ═══════════════════════════════
  //
  // IL N'Y A PAS D'APPLICATION À TÉLÉCHARGER. La maquette dessine les deux
  // badges ; ils restent dessinés, marqués « bientôt », et surtout ils ne
  // cliquent pas. Un badge « App Store » qui ne mène nulle part est la promesse
  // la plus concrète qu'une page d'accueil puisse rompre, et elle se rompt au
  // premier appui — c'est-à-dire au pire moment.
  const magasins = await pD.$$eval(".ld-mag", (l) =>
    l.map((e) => ({
      mot: e.textContent.replace(/\s+/g, " ").trim(),
      cliquable: !!e.closest("a") || e.tagName === "A" || e.tagName === "BUTTON",
    })),
  );
  dire(magasins.length === 2, `les deux badges de magasin sont dessinés (${magasins.length})`);
  dire(
    magasins.every((m) => !m.cliquable),
    "et aucun n'est cliquable, puisqu'il n'y a rien à télécharger",
  );
  dire(
    magasins.every((m) => /bient[oô]t/i.test(m.mot)),
    `et ils le disent (${magasins.map((m) => m.mot).join(" / ")})`,
  );

  // ═══ LA SECTION 3 RACONTE LA VRAIE SUITE ════════════════════════════════
  //
  // « Cette section est très mal faite : on voit un screen où les gens parlent
  // comme s'ils étaient sur Instagram. L'idée ici c'est de montrer notre
  // différence, c'est-à-dire que lorsqu'on a essayé le produit on le note avec
  // des fantômes de 1 à 5, et ensuite on nous demande : voulez-vous en parler
  // avec vos amis dans un salon privé pour recueillir leurs avis ? Et c'est à
  // ce moment qu'on a la conversation qui apparaît, ET SURTOUT AVEC LES OPTIONS
  // DU SALON, qui est la possibilité de choisir autre chose et de réserver.
  // Donc cette étape est cruciale pour que l'histoire narrative ait un sens :
  // je vois une annonce qui me plaît, j'essaye le produit, je note le produit,
  // on me demande le salon, j'en parle à mes amis avec qui on change d'idée ou
  // pas, et on réserve. »
  //
  // CE QUE CETTE GARDE PROTÈGE, MAILLON PAR MAILLON. La version d'avant était
  // une capture fixe d'une conversation : ni la note qui la déclenche, ni les
  // options qui la concluent. Ce qui est unique n'est aucun des maillons, c'est
  // la CHAÎNE — et une chaîne se casse toujours par le maillon qu'on a retiré
  // « parce qu'il prenait de la place ».
  await pD.evaluate(() => document.querySelector("#ensemble")?.scrollIntoView({ block: "center" }));
  await pD.waitForTimeout(500);

  const cinq = await pD.$$eval(".ld-su-notes span", (l) => l.length);
  dire(cinq === 5, `on note le rendu de 1 à 5 fantômes (${cinq})`);
  const mot = await pD
    .$eval(".ld-su-q", (e) => e.textContent.replace(/\s+/g, " ").trim())
    .catch(() => "");
  dire(
    /sur vous, ça donne quoi/i.test(mot.replace(/ /g, " ")),
    `et la question est celle de l'application (« ${mot} »)`,
  );

  const demande = await pD
    .$eval(".ld-su-demande", (e) => e.textContent.replace(/\s+/g, " ").trim())
    .catch(() => "");
  dire(
    /demander à mes amis/i.test(demande),
    `on nous demande ensuite le salon, avec les mots de l'application (« ${demande} »)`,
  );
  dire(/salon privé/i.test(demande), "et on dit que le rendu y part");

  // LES OPTIONS DU SALON. C'est le « et surtout » de sa phrase, et c'est ce qui
  // sépare ce salon d'un fil de commentaires : on peut y proposer autre chose,
  // et on peut y réserver.
  const options = await pD.$$eval(".ld-su-opts button", (l) =>
    l.map((e) => e.textContent.replace(/\s+/g, " ").trim()),
  );
  dire(
    options.some((t) => /proposer autre chose/i.test(t)),
    `le salon propose de choisir autre chose (${options.join(" / ") || "aucune option"})`,
  );
  dire(options.some((t) => /r[ée]server/i.test(t)), "et de réserver");

  // LE CHEMIN DE A À Z, DANS SES CINQ ÉTAPES. « Le fantôme doit être plus
  // présent et au cœur des actions, donc vraiment utilise-le pour raconter
  // l'histoire narrative et le chemin de A à Z. »
  const chemin = await pD.$$eval(".ld-ch-l li span", (l) => l.map((e) => e.textContent.trim()));
  dire(chemin.length === 5, `le chemin a ses cinq étapes (${chemin.join(" › ")})`);
  // ═══ ET CE SONT LES MOTS DE L'APPLICATION, PAS D'AUTRES ═══════════════════
  //
  // « Le parcours ClikMe doit devenir reconnaissable : Je découvre → J'essaie
  // sur moi → Je donne mon avis → Mon essai rejoint éventuellement le mur →
  // J'agis. »
  //
  // LA PAGE EN DISAIT D'AUTRES. Elle annonçait « Je vois · J'essaie · Je note ·
  // J'en parle · On réserve » pendant que la frise de l'essai, dans
  // l'application, disait « Je découvre · J'essaie · Je donne mon avis ». Deux
  // vocabulaires pour un seul rituel, c'est un rituel qu'on ne reconnaît pas —
  // et c'est exactement ce que ce chemin existe pour installer.
  dire(
    /découvre/i.test(chemin[0] ?? "") &&
      /essaie/i.test(chemin[1] ?? "") &&
      /avis/i.test(chemin[2] ?? "") &&
      /mur/i.test(chemin[3] ?? "") &&
      /agis/i.test(chemin[4] ?? ""),
    "et ce sont les mots du rituel : je découvre, j'essaie, je donne mon avis, ça rejoint le mur, j'agis",
  );

  // ═══ LA PAGE MONTRE LE MUR, ET C'EST CE QU'ELLE NE DISAIT PAS ═════════════
  //
  // « Maintenant qu'on a pas mal d'exemples et que le concept a évolué, fais
  // les modifs nécessaires et les écrans différents qu'on a poussés. »
  //
  // LA PAGE S'ARRÊTAIT À L'ESSAI, ET LE PRODUIT NE S'Y ARRÊTE PLUS. Ce qu'il a
  // de plus rare est ailleurs : douze personnes portent le même dessin, et on
  // peut les voir avant de décider. Une IA qui pose un tatouage sur une photo,
  // tout le monde en aura une l'an prochain ; douze personnes de Dax qui
  // portent celui-là, il faut les avoir tatouées.
  {
    const murLa = await pD.$("#mur");
    if (murLa) await murLa.scrollIntoViewIfNeeded();
    await pD.waitForTimeout(1800);
    const m = await pD.evaluate(() => ({
      compte: document.querySelector(".ld-mur-t b")?.textContent?.trim() ?? null,
      vignettes: document.querySelectorAll(".ld-mur-gr li").length,
      chargees: [...document.querySelectorAll(".ld-mur-gr img")].filter(
        (i) => i.complete && i.naturalWidth > 0,
      ).length,
      // CHAQUE VIGNETTE DIT QUI ET OÙ : c'est l'endroit du corps qui fait la
      // valeur de ce mur, pas le nombre de photos.
      ou: [...document.querySelectorAll(".ld-mur-gr span em")].map((e) => e.textContent.trim()),
      regle: document.querySelector(".ld-mur-rt b")?.textContent?.trim() ?? null,
    }));
    dire(
      /^12 personnes/.test(m.compte ?? ""),
      `la page montre le mur et compte ses gens (« ${m.compte ?? "absent"} »)`,
    );
    dire(m.vignettes >= 6, `avec de vraies photos (${m.vignettes})`);
    dire(
      m.chargees === m.vignettes,
      `qui existent toutes (${m.chargees} sur ${m.vignettes})`,
    );
    dire(
      new Set(m.ou).size === m.ou.length && m.ou.length >= 6,
      `et chacune dit où c'est posé (${m.ou.join(" · ")})`,
    );
    dire(!!m.regle, `la règle du fantôme se montre (« ${m.regle ?? "absente"} »)`);
  }
  dire(
    !!(await pD.$(".ld-ch .ld-f")),
    "le fantôme parcourt ce chemin lui-même, au lieu de décorer la marge",
  );

  // ON CHANGE D'IDÉE, OU PAS. « J'en parle à mes amis avec qui on change d'idée
  // ou pas et on réserve. » C'est le seul endroit de la page où la séquence
  // prouve quelque chose qu'une capture ne pourrait pas montrer : la pièce
  // proposée CHANGE. Un salon où tout le monde approuve n'est qu'un compteur de
  // « j'aime » de plus.
  const change = await pD
    .waitForSelector(".ld-su-prop.neuve", { timeout: 22000 })
    .then(() => true)
    .catch(() => false);
  dire(change, "et la pièce proposée finit par changer : les amis servent à quelque chose");
  const parLea = await pD
    .$eval(".ld-su-par", (e) => e.textContent.replace(/\s+/g, " ").trim())
    .catch(() => "");
  dire(/propos[ée] par/i.test(parLea), `et on voit qui l'a proposée (« ${parLea} »)`);

  // ═══ ON AVOUE QUE C'EST UNE MAQUETTE ════════════════════════════════════
  //
  // Quelqu'un qui ouvre et tombe sur « Chez Bergine » comprend tout seul qu'on
  // lui a raconté une histoire. Autant le devancer — et le point faible devient
  // une preuve, parce que l'essai, lui, n'est pas inventé.
  const aveu = await pD.$eval(".ld-pied-n", (e) => e.textContent.replace(/\s+/g, " ").trim())
    .catch(() => "");
  dire(/invent/i.test(aveu), "elle avoue que les commerces sont inventés");
  dire(/l’essai sur votre photo, non/i.test(aveu), "et que l'essai, lui, ne l'est pas");

  // ═══ LE BOUTON DE LA BARRE OUVRE L'ESSAI ════════════════════════════════
  //
  // La maquette y met « Télécharger l'app ». Il n'y a rien à télécharger : le
  // bouton ouvre donc l'essai, qui est ce que la page promet vraiment.
  const barre = await pD.$eval(".ld-nav .ld-cta", (e) => ({
    mot: e.textContent.trim(),
    ou: e.getAttribute("href") ?? "",
  }));
  dire(
    /essai=1/.test(barre.ou),
    `le bouton de la barre ouvre l'essai (« ${barre.mot} » → ${barre.ou})`,
  );
  dire(
    !/t[ée]l[ée]charger/i.test(barre.mot),
    "et il ne promet pas un téléchargement qui n'existe pas",
  );

  // RIEN NE DÉBORDE, NI SUR TÉLÉPHONE NI SUR ORDINATEUR. Le miroir est le seul
  // objet de la page dont la largeur dépend d'une variable.
  for (const [nom, l, h] of [["ordinateur", 1280, 900], ["téléphone", 390, 844]]) {
    const c = await nav.newContext({
      viewport: { width: l, height: h }, deviceScaleFactor: 1,
      isMobile: l < 500, hasTouch: l < 500, locale: "fr-FR",
    });
    await c.clock.setFixedTime(new Date(2026, 8, 2, 12, 30, 0));
    const q = await c.newPage();
    await q.goto(`${BASE}/le-direct`, { waitUntil: "networkidle" });
    await q.waitForTimeout(700);
    const d = await q.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    dire(!d, `rien ne déborde sur ${nom}`);
    await c.close();
  }

  dire(bruit.length === 0, `et la page d'accueil ne se plaint pas${bruit.length ? " : " + bruit[0].slice(0, 90) : ""}`);
  await grand.close();
}

dire(erreurs.length === 0, `aucune erreur${erreurs.length ? " : " + erreurs[0] : ""}`);
await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
