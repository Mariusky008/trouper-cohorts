// 🗂️ LES FICHES DU CHANTIER « UNIVERS » (lot 1, le socle), SANS TÉLÉPHONE — `src/lib/direct/perso.ts`, `monde.ts`,
// `scene.ts`.
//
// Ce qui se vérifie ici :
//   · une fiche du personnage tient (un style connu, des images de référence de SON style seulement, des chemins sans
//     « .. », une signature complète ou rien) ; ce qui ne tient pas est écarté, jamais deviné ;
//   · une fiche ne désigne que ce qui est à lui (rien dans le dossier d'un autre) ;
//   · la fiche de l'univers : ses places, sa lumière, qui peut entrer (« mes proches » par défaut), ses souvenirs ;
//   · NE JAMAIS INVENTER : un élément « dit » dont la phrase n'est pas dans ses messages redevient une interprétation ;
//   · une scène : un décor, une à quatre figurines, jamais deux à la même place ni deux fois la même ; le moment de la
//     journée suit l'heure.
//
//   node scripts/verifier-fiches.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
// (un petit chargeur : chaque fichier est transpilé, et ses imports relatifs de `src/lib/direct` chargés de même)
const charges = new Map();
function charger(nom) {
  if (charges.has(nom)) return charges.get(nom);
  const js = ts.transpileModule(readFileSync(`src/lib/direct/${nom}.ts`, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const boite = { exports: {} };
  charges.set(nom, boite.exports);
  const requis = (x) => {
    if (x.startsWith("./")) return charger(x.slice(2));
    throw new Error(`import inattendu dans ${nom} : ${x}`);
  };
  new Function("exports", "module", "require", js)(boite.exports, boite, requis);
  return boite.exports;
}
const P = charger("perso");
const M = charger("monde");
const S = charger("scene");

let fautes = 0;
let bons = 0;
const verifier = (ok, message) => {
  if (ok) bons++;
  else {
    fautes++;
    console.error("✗", message);
  }
};

const H = "abababab-0000-4000-8000-000000000301";
const LE = "2026-11-12T08:00:00.000Z";
const signature = { moteur: "gpt-image", consigne: "Turn the person in IMAGE 1 into…", entrees: [`${H}/photo.jpg`], le: LE, qualite: "high", fidelite: "high", fond: "transparent", empreinte: "0123456789abcdef" };
const fiche = {
  version: 1,
  style: "collection-1",
  creee_le: LE,
  traits: { cheveux: "gris poivre et sel", lunettes: false },
  habit: "artisan",
  fauteuil: P.FAUTEUIL_DE_DEPART,
  references: { assise: { chemin: `${H}/perso/v1/assise.png`, signature }, debout: { chemin: `${H}/perso/v1/debout.png` } },
  historique: [{ version: 0, le: LE, raison: "sa figurine d'avant", style: "ressort-1" }],
};

// ─── le personnage ───
const f = P.fichePersoValide(fiche);
verifier(f && f.version === 1 && f.style === "collection-1" && f.references.assise.signature.moteur === "gpt-image" && f.references.debout && !f.references.debout.signature, "une fiche du personnage tient, avec ses signatures");
verifier(f && f.traits.cheveux === "gris poivre et sel" && f.traits.lunettes === false && f.habit === "artisan" && f.fauteuil.de === "depart", "ses traits, son habit, son fauteuil de départ");
verifier(P.fichePersoValide({ ...fiche, style: "ressort-2" }) === null, "un style inconnu : écartée");
verifier(P.fichePersoValide({ ...fiche, version: -1 }) === null && P.fichePersoValide({ ...fiche, creee_le: "hier" }) === null, "une version ou une date qui ne tient pas : écartée");
const melange = P.fichePersoValide({ ...fiche, references: { ...fiche.references, neutre: { chemin: `${H}/fab/fig-n.webp` } } });
verifier(melange && !melange.references.neutre, "une image d'un autre style (« neutre » dans « collection-1 ») : laissée de côté");
const mauvaisChemin = P.fichePersoValide({ ...fiche, references: { assise: { chemin: `${H}/../autre/assise.png` }, debout: { chemin: "/etc/passwd" } } });
verifier(mauvaisChemin && Object.keys(mauvaisChemin.references).length === 0, "des chemins avec « .. » ou absolus : écartés");
const sansConsigne = P.fichePersoValide({ ...fiche, references: { assise: { chemin: `${H}/perso/v1/assise.png`, signature: { ...signature, consigne: "" } } } });
verifier(sansConsigne && sansConsigne.references.assise && !sansConsigne.references.assise.signature, "une signature sans consigne n'en est pas une");
verifier(P.ficheEstASoi(f, H) && !P.ficheEstASoi(f, "abababab-0000-4000-8000-000000000302"), "une fiche ne désigne que ce qui est à lui");
const chezUnAutre = P.fichePersoValide({ ...fiche, references: { assise: { chemin: `${H}/perso/v1/assise.png`, signature: { ...signature, entrees: ["autre/photo.jpg"] } } } });
verifier(!P.ficheEstASoi(chezUnAutre, H), "ni par ses images en entrée");
verifier(!P.ficheComplete(f) && P.ficheComplete({ ...f, references: { ...f.references, assise_parle: { chemin: `${H}/perso/v1/assise-p.png` } } }), "complète quand toutes les images de son style sont là");
verifier(P.REFERENCES_DU_STYLE["ressort-1"].join() === "neutre,parle" && P.REFERENCES_DU_STYLE["collection-1"].join() === "assise,assise_parle,debout", "les images de chaque style");
verifier(P.couleurValide("#C9A27E") === "#c9a27e" && P.couleurValide("rouge") === "", "les couleurs : #rrggbb seulement");

// ─── l'univers ───
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: LE,
  proposition: "Un atelier ouvert sur la mer, où l'on bricole au calme.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "pas une couleur"] },
  elements: [
    { id: "etabli", quoi: "un établi couvert d'outils", pourquoi: "je bricole tous les dimanches", source: "dit", zone: [0.08, 0.42, 0.34, 0.2], valide: true },
    { id: "phare", quoi: "un petit phare au loin", pourquoi: "tu parles souvent de garder le cap", source: "interpretation" },
    { id: "bateau", quoi: "un voilier", pourquoi: "j'adore naviguer l'été", source: "dit" },
    { id: "etabli", quoi: "un double", pourquoi: "", source: "interpretation" },
  ],
  scene: { sol: 0.78, places: [{ id: "hote", x: 0.36, y: 0.8, echelle: 1 }, { id: "invite", x: 0.66, y: 0.82, echelle: 0.96 }, { id: "hote", x: 0.1, y: 0.1, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${H}/monde/v1/decor.webp`, signature } },
  souvenirs: [
    { id: "s1", de: "0123456789abcdef", objet: "un coquillage", le: LE, accepte_le: LE },
    { id: "s2", de: "fedcba9876543210", objet: "une lanterne", le: LE },
  ],
};
const m = M.ficheMondeValide(monde);
verifier(m && m.elements.length === 3 && m.ambiance.palette.length === 1 && m.scene.places.length === 2, "la fiche de l'univers tient (un élément en double, une couleur et une place de trop : laissés de côté)");
verifier(m && m.visibilite === "proches", "qui peut entrer : « mes proches », par défaut");
verifier(M.ficheMondeValide({ ...monde, version: 0 }) === null && M.ficheMondeValide({ ...monde, style: "diorama" }) === null, "pas de version 0, pas de style d'avant pour un univers");
verifier(M.mondeEstASoi(m, H) && !M.mondeEstASoi(m, "abababab-0000-4000-8000-000000000302"), "un univers ne désigne que ce qui est à lui");
verifier(M.souvenirsVisibles(m).map((x) => x.id).join() === "s1", "un souvenir n'apparaît qu'une fois accepté");
const { fiche: verifiee, retrogrades } = M.elementsVerifies(m, ["Moi ? Je bricole tous les dimanches, c'est ma passion !", "J'aime la mer."]);
verifier(retrogrades.join() === "bateau" && verifiee.elements.find((e) => e.id === "etabli").source === "dit" && verifiee.elements.find((e) => e.id === "bateau").source === "interpretation", "ne jamais inventer : sa phrase retrouvée reste « dit », l'autre redevient une interprétation");
const court = M.elementsVerifies({ ...m, elements: [{ id: "x", quoi: "un chat", pourquoi: "chat", source: "dit" }] }, ["mon chat dort"]);
verifier(court.retrogrades.join() === "x", "une « citation » d'un seul mot ne suffit pas");
verifier(M.sesMots("Je bricole, TOUS les dimanches !") === "je bricole tous les dimanches" && M.sesMots("été") === "ete", "ses mots : sans accents, sans ponctuation, en minuscules");

// ─── la scène ───
const A = "0123456789abcdef";
const B = "fedcba9876543210";
const scene = { decor: { de: A, version: 1 }, acteurs: [{ de: A, version: 1, place: "hote", pose: "assise", visage: "joie" }, { de: B, version: 0, place: "invite", pose: "debout", visage: null }], moment: "soir" };
const sc = S.sceneValide(scene);
verifier(sc && sc.acteurs.length === 2 && sc.acteurs[1].pose === "debout" && sc.moment === "soir", "une scène : son décor, deux figurines, le soir");
verifier(S.sceneValide({ ...scene, acteurs: [scene.acteurs[0], { ...scene.acteurs[1], place: "hote" }] }) === null, "deux figurines à la même place : refusée");
verifier(S.sceneValide({ ...scene, acteurs: [scene.acteurs[0], { ...scene.acteurs[0], place: "invite" }] }) === null, "la même figurine deux fois : refusée");
verifier(S.sceneValide({ ...scene, acteurs: [] }) === null && S.sceneValide({ ...scene, decor: { de: "pas-une-cle", version: 1 } }) === null, "sans figurine ou sans décor : refusée");
verifier(S.sceneValide({ ...scene, acteurs: [...Array(5)].map((_, i) => ({ de: `${i}`.repeat(16), version: 1, place: `p${i}` })) }) === null, "cinq figurines : refusée (quatre au plus)");
const rendue = S.sceneValide({ ...scene, rendu: { chemin: `${H}/scenes/1.png`, signature } });
verifier(rendue && rendue.rendu.signature.moteur === "gpt-image", "une rencontre générée garde son image, signée");
verifier(S.quiJoue(sc).join() === `${A},${B}`, "qui joue dans la scène");
verifier([7, 12, 19, 23, 3].map(S.momentDe).join() === "matin,midi,soir,nuit,nuit", "le moment de la journée suit l'heure");

// 🪑 son fauteuil aux couleurs de son monde (lot 4b)
const auxCouleurs = P.fauteuilAuxCouleurs(["#E8B06A", "rouge", "#2f5d73", "#f3ead9", "#111111"]);
verifier(auxCouleurs?.de === "univers" && auxCouleurs.couleurs.join() === "#e8b06a,#2f5d73,#f3ead9" && auxCouleurs.description === P.FAUTEUIL_DE_DEPART.description, "le fauteuil aux couleurs de son monde : le même fauteuil, trois couleurs vérifiées au plus");
verifier(P.fauteuilAuxCouleurs([]) === null && P.fauteuilAuxCouleurs(["bleu"]) === null, "sans couleur : pas de fauteuil refait");
verifier(P.fichePersoValide({ ...fiche, fauteuil: auxCouleurs })?.fauteuil?.de === "univers", "la fiche garde son fauteuil aux couleurs de son monde");

console.log(fautes ? `\n${fautes} faute(s), ${bons} juste(s)` : `les fiches tiennent ✓ (${bons} vérifications)`);
process.exit(fautes ? 1 : 0);
