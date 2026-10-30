// 🚪 CHAQUE POST DEVIENT UNE PORTE — ce que la légende dit, réseau par réseau.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// « Chaque post, sur tous les réseaux, devient une porte. Il finit par
// “✨ Essaie-la sur toi” ou “Découvre…” selon la catégorie du commerçant, qui
// ouvre l'essai de cette pièce précise. » Et : « Sur Instagram, un lien dans le
// texte n'est pas cliquable. Sur Facebook, le lien est cliquable. Sur Google,
// il peut aller dans le bouton du post. »
//
// LA LÉGENDE PART CHEZ SES CLIENTS SANS QUE PERSONNE NE LA RELISE. Elle est
// fabriquée par une fonction pure (`legendeReseaux`) : ce qu'elle promet se
// vérifie ici, sans réseau ni téléphone.
//
//   node scripts/verifier-porte-reseaux.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const charger = (chemin) => {
  const js = ts.transpileModule(readFileSync(chemin, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const boite = { exports: {} };
  new Function("exports", "module", js)(boite.exports, boite);
  return boite.exports;
};
const { porteDuPost, legendeReseaux, ligneDEnvoi, lienDeLaPorte, lienDeBio, adresseLisible, motsPourLesReseaux, idDePiece } = charger(
  "src/lib/reseaux/reseaux-donnees.ts",
);
const { debitDuMontage, OCTETS_VISES, DEBIT_SON } = charger("src/lib/direct/interview-fantome.ts");

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

const SITE = "https://www.clikme.fr";

console.log("══ la porte de chaque métier ══");
{
  const p = (branche, metier, piece = true) => porteDuPost({ branche, metier, piece });
  dire(p("mode").mot === "✨ Essaie-la sur toi" && p("mode").essai, "boutique de vêtements : « ✨ Essaie-la sur toi », sur LA pièce du post");
  dire(p("coiffeur").mot === "✨ Essaie-la sur toi" && p("coiffeur").essai, "coiffeur : la coupe du post s'essaie sur soi");
  dire(/ongles/.test(p("ongles").mot) && p("ongles").essai, "onglerie : « sur tes ongles »");
  dire(/visage/.test(p("lunetier").mot) && p("lunetier").essai, "opticien : « sur ton visage »");
  dire(/peau/.test(p("artisan", "Tatoueur").mot), "tatoueur : « sur ta peau »");
  dire(/chez toi/.test(p("artisan", "Créatrice de bougies").mot), "créatrice : « chez toi »");
  dire(/Découvre le plat/.test(p("restaurant").mot) && p("restaurant").bouton === "BOOK" && !p("restaurant").essai, "restaurant : « Découvre le plat », bouton Google « Réserver »");
  dire(/prochain livre/.test(p("librairie").mot) && !p("librairie").essai, "librairie : son conseil, pas un essai");
  dire(!p("mode", "", false).essai && /collection/.test(p("mode", "", false).mot), "sans pièce : la porte ouvre son expérience, pas un essai précis");
  dire(p("mode").bouton === "LEARN_MORE", "un essai : bouton Google « En savoir plus » (Google n'a pas « Essayer »)");
}

console.log("══ le lien : une pièce précise, ou sa bio ══");
{
  dire(lienDeBio(SITE, "chez-lou") === "https://www.clikme.fr/b/chez-lou", "le lien de bio est fixe : /b/<sa-page>");
  dire(lienDeLaPorte(SITE, "chez-lou", "pub-171") === "https://www.clikme.fr/b/chez-lou?p=pub-171", "le lien d'un post porte sa pièce");
  dire(adresseLisible(lienDeBio(SITE, "chez-lou")) === "clikme.fr/b/chez-lou", "il se lit sans « https://www. »");
  dire(idDePiece("pub-171") === "pub-171" && idDePiece("<script>") === undefined && idDePiece("a".repeat(61)) === undefined, "une pièce qui n'a pas la forme d'un identifiant ne voyage pas");
}

console.log("══ la légende, réseau par réseau ══");
{
  const base = {
    texte: "La pièce du moment : Veste en jean · 89 €",
    mots: "Elle est arrivée ce matin. Je la porte avec un pull crème, c'est parfait pour l'automne.",
    nom: "Le Dressing de Lou",
    ville: "dax",
    metier: "Prêt-à-porter",
    porte: "✨ Essaie-la sur toi",
    lien: lienDeLaPorte(SITE, "chez-lou", "pub-171"),
  };
  const ig = legendeReseaux({ ...base, reseau: "instagram" });
  const fb = legendeReseaux({ ...base, reseau: "facebook" });
  const gg = legendeReseaux({ ...base, reseau: "googlebusiness" });
  console.log("\n--- Instagram ---\n" + ig + "\n--- Facebook ---\n" + fb + "\n--- Google ---\n" + gg + "\n");
  dire(ig.startsWith(base.texte), "Instagram : ses mots écrits d'abord");
  dire(ig.includes(`« ${base.mots} »`), "Instagram : ses mots dits au micro, entre guillemets, sans un mot de plus");
  dire(ig.includes("✨ Essaie-la sur toi 👉 lien en bio") && !ig.includes("https://"), "Instagram : « lien en bio », aucun lien écrit (il n'y est pas cliquable)");
  dire(fb.includes(`✨ Essaie-la sur toi 👉 ${base.lien}`), "Facebook : le lien cliquable au bout de la porte");
  dire(ig.includes("📍 Le Dressing de Lou · Dax") && ig.includes("#Dax #PretAPorter"), "sa ville et son métier, et seulement eux, en mots-dièse");
  dire(gg === `${base.texte}\n\n« ${base.mots} »`, "Google : ses mots seuls — la porte est dans le bouton");
  dire(ig.length <= 2000 && gg.length <= 1500, "dans les longueurs des réseaux");
  const sans = legendeReseaux({ ...base, mots: undefined, reseau: "instagram" });
  dire(!sans.includes("«"), "sans vocal : rien d'inventé à sa place");
}

console.log("══ « Envoie ça à… » ══");
{
  const midi = new Date("2026-10-30T10:30:00Z"); // 11 h 30 à Paris
  const soir = new Date("2026-10-30T18:00:00Z"); // 19 h à Paris
  dire(ligneDEnvoi("restaurant", midi) === "Envoie ça à la personne avec qui tu viens ce midi 👇", "à table, avant 15 h : « ce midi »");
  dire(ligneDEnvoi("bar", soir) === "Envoie ça à la personne avec qui tu viens ce soir 👇", "après 15 h : « ce soir »");
  dire(ligneDEnvoi("artisan", midi) === "Envoie ça à quelqu’un qui va adorer 👇", "ailleurs : quelqu'un qui va adorer");
  const base = { texte: "Le plat du jour : Magret au miel · 18 €", mots: "Il est cuit doucement.", nom: "Chez Bergine", ville: "Dax", porte: "🍽️ Réserve ta table", lien: "https://www.clikme.fr/b/chez-bergine", envoi: ligneDEnvoi("restaurant", midi) };
  const ig = legendeReseaux({ ...base, reseau: "instagram" });
  const gg = legendeReseaux({ ...base, reseau: "googlebusiness" });
  dire(ig.indexOf(base.envoi) > ig.indexOf("« Il est cuit doucement. »") && ig.indexOf(base.envoi) < ig.indexOf("Réserve ta table"), "Instagram : après ses mots, avant la porte");
  dire(!gg.includes("Envoie ça"), "Google : pas de « Envoie ça »");
}

console.log("══ ses mots, coupés proprement ══");
{
  const long = "Une phrase qui parle de la veste. ".repeat(30).trim();
  const m = motsPourLesReseaux(long, 120);
  dire(m.length <= 120 && /\.$/.test(m), "un vocal long s'arrête à la fin d'une phrase");
  const d = motsPourLesReseaux("« Bonjour à tous »");
  dire(d === "Bonjour à tous", "ses guillemets ne se doublent pas");
  const sansPoint = motsPourLesReseaux("mot ".repeat(200), 50);
  dire(sansPoint.endsWith("…") && !/\s…$/.test(sansPoint) && sansPoint.length <= 51, "sans point : coupé entre deux mots, avec « … »");
}

console.log("══ le débit du montage tient dans son envoi ══");
{
  for (const s of [35, 80, 150, 180]) {
    const octets = ((debitDuMontage(s) + DEBIT_SON) * s) / 8;
    dire(octets <= OCTETS_VISES * 1.001 || debitDuMontage(s) === 1_200_000, `${s} s → ${(debitDuMontage(s) / 1e6).toFixed(2)} Mb/s, ${(octets / 1e6).toFixed(1)} Mo`);
  }
  dire(debitDuMontage(35) === 4_000_000, "une question : la qualité pleine (4 Mb/s)");
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
