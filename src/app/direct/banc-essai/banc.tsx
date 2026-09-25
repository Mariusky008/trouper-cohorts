"use client";

// 🔬 LE BANC D'ESSAI — les mêmes photos, un seul réglage qui change à la fois.
//
// ═══ POURQUOI CETTE PAGE EXISTE ════════════════════════════════════════════
//
// « Arrêter les essais de prompts isolés. Vérifier la requête réelle de
// ClikMe : modèle, appel de génération ou de modification, ordre des deux
// images, résolution et qualité, prompt complet et éventuel masque. Faire un
// test comparatif sur les mêmes photos, en ne changeant qu'un paramètre à la
// fois. »
//
// HUIT TOURS ONT ÉTÉ PASSÉS À CHANGER UNE PHRASE PUIS À REGARDER UN RENDU. Ce
// n'est pas une méthode, c'est une marche au hasard : entre deux essais, la
// photo change, l'heure change, le modèle tire un autre échantillon, et l'on
// attribue au dernier réglage ce qui vient peut-être du hasard.
//
// IL N'Y A PAS DE CLÉ D'IMAGE DANS MON CONTENEUR. Je n'ai jamais pu lancer un
// seul rendu — tout ce que j'ai fait depuis le début, je l'ai déduit en lisant
// du code, et lui l'a vérifié sur son téléphone. Cette page renverse ça : elle
// lance les quatre configurations D'AFFILÉE, sur LA MÊME photo et LA MÊME
// référence, et les pose côte à côte avec, sous chacune, ce qui est
// réellement parti. C'est la seule chose que je puisse construire qui produise
// la preuve à ma place.
//
// ELLE NE FAIT PAS PARTIE DU PRODUIT. Aucun lien n'y mène ; elle vit à son
// adresse, pour lui et pour moi.
import { useEffect, useMemo, useRef, useState } from "react";
import { MURS } from "@/lib/direct/fantomes";
import { essayerSurMoi, estUnRendu, type Regime } from "@/lib/direct/essai-genere";
import { consigne, consigneBrute, consigneCalquee } from "@/lib/direct/consigne-essai";

/**
 * LES QUATRE CONFIGURATIONS, ET CE QUI LES SÉPARE.
 *
 * ON NE CHANGE QU'UNE CHOSE PAR LIGNE, par rapport à celle d'au-dessus. Une
 * comparaison où deux réglages bougent ensemble ne dit rien : c'est ce qu'on
 * vient de faire pendant huit tours.
 */
type Config = {
  cle: string;
  nom: string;
  quoi: string;
  regime: Regime;
  sansReference?: boolean;
};

const CONFIGS: Config[] = [
  {
    cle: "calquee",
    nom: "1 · Régime actuel",
    quoi: "Deux images, pas de masque, aucun cadre demandé, photo entière — et la consigne calquée sur celle de ChatGPT, en anglais, 1 200 signes.",
    regime: "calquee",
  },
  {
    cle: "leger",
    nom: "2 · Notre consigne longue",
    quoi: "Tout pareil, SAUF la phrase : nos 3 900 signes d'interdictions accumulées, en français.",
    regime: "leger",
  },
  {
    cle: "brut",
    nom: "3 · Consigne courte",
    quoi: "Tout pareil, SAUF la phrase : cinq lignes, celles qu'on taperait dans ChatGPT sans réfléchir.",
    regime: "brut",
  },
  {
    cle: "atelier",
    nom: "4 · Masque + cadre imposé",
    quoi: "Tout pareil que 2, SAUF qu'on rogne la photo, qu'on demande un format et qu'on envoie un masque.",
    regime: "atelier",
  },
  {
    cle: "sans-ref",
    nom: "5 · Sans la photo de la coupe",
    quoi: "Tout pareil que 1, SAUF qu'il n'y a qu'une image : la description écrite fait tout le travail.",
    regime: "calquee",
    sansReference: true,
  },
];

/* `nom` et `quoi` ne sont remplis que par la comparaison de modèles : les cinq
   consignes, elles, les tiennent de CONFIGS. Un résultat qui porte son propre
   titre peut être produit par une série qui n'existe pas dans CONFIGS. */
type Resultat = {
  cle: string;
  nom?: string;
  quoi?: string;
  image?: string;
  ms?: number;
  erreur?: string;
  pourquoi?: string;
};

/** Les murs qui savent essayer quelque chose, avec leurs pièces. */
function essayables() {
  return MURS.filter((m) => m.essai?.pieces?.some((p) => p.reference));
}

export default function Banc() {
  const murs = useMemo(essayables, []);
  const [cleMur, setCleMur] = useState(() => {
    const coif = murs.find((m) => /cheveux/i.test(m.essai?.change ?? ""));
    return (coif ?? murs[0])?.cle ?? "";
  });
  const mur = murs.find((m) => m.cle === cleMur) ?? murs[0];
  const pieces = (mur?.essai?.pieces ?? []).filter((p) => p.reference);
  const [idPiece, setIdPiece] = useState(() => pieces[0]?.id ?? "");
  const piece = pieces.find((p) => p.id === idPiece) ?? pieces[0];

  /* LA PHOTO DU CLIENT : la sienne, prise sur le téléphone, ou celle
     d'exemple du métier — pour qu'on puisse comparer deux séries sur la MÊME
     tête, ce qui est le point de tout ce banc. */
  const [photo, setPhoto] = useState<string>("");
  const fichier = useRef<HTMLInputElement>(null);
  const exemple = mur?.essai?.avant ?? "";

  const [encours, setEncours] = useState<string | null>(null);
  const [res, setRes] = useState<Resultat[]>([]);

  /**
   * ═══ LE MODÈLE, LE SEUL RÉGLAGE QU'ON N'AVAIT JAMAIS FAIT VARIER ══════════
   *
   * « Comparer les modèles sur les mêmes fichiers. Garder le prompt complet,
   * les images et leur ordre identiques. Faire plusieurs générations avec
   * gpt-image-1, puis avec un modèle d'édition plus récent accessible à votre
   * compte. Juger chaque rendu sur deux critères indépendants : même personne
   * et même coupe. »
   *
   * LA LISTE VIENT DU COMPTE, PAS DE MA MÉMOIRE. Le catalogue des modèles
   * d'image change, et il dépend de ce que l'organisation a activé : un nom
   * écrit de mémoire rend un 404 qui ressemble à une panne. Voir
   * `/api/direct/modeles-image` — c'est la clé du serveur qui demande, et la
   * réponse est la seule qui fasse foi.
   */
  const [modeles, setModeles] = useState<{ id: string; cree: number }[]>([]);
  const [enService, setEnService] = useState("");
  const [soucisModeles, setSoucisModeles] = useState("");
  const [modeleA, setModeleA] = useState("");
  const [modeleB, setModeleB] = useState("");
  /** Combien de fois chaque moteur rejoue. Un seul rendu ne prouve rien. */
  const [fois, setFois] = useState(2);

  useEffect(() => {
    let vivant = true;
    fetch("/api/direct/modeles-image")
      .then((r) => r.json())
      .then((j) => {
        if (!vivant) return;
        if (j?.erreur) {
          setSoucisModeles(`${j.erreur} ${j.pourquoi ?? ""}`.trim());
          return;
        }
        setModeles(j.images ?? []);
        setEnService(j.enService ?? "");
        setModeleA(j.enService ?? "");
        /* LE SECOND EST LE PLUS RÉCENT QUI N'EST PAS DÉJÀ LE PREMIER. C'est
           la comparaison qu'on vient chercher ; on peut toujours en choisir un
           autre dans la liste. */
        const autre = (j.images ?? []).find(
          (m: { id: string }) => m.id !== (j.enService ?? "") && /image|edit|paint|canvas/i.test(m.id),
        );
        setModeleB(autre?.id ?? "");
      })
      .catch((e) => vivant && setSoucisModeles(String(e)));
    return () => {
      vivant = false;
    };
  }, []);

  /* LA RAISON D'UNE PHOTO ABSENTE — voir le repli plus bas. On demande
     l'adresse telle qu'il la colle : si elle pointe sur clikme.fr depuis un
     autre domaine, on ne garde que le chemin, parce qu'un navigateur refusera
     la requête entre domaines et qu'il verrait « échec » sans savoir pourquoi. */
  const [adresse, setAdresse] = useState("");
  const [raison, setRaison] = useState("");

  async function diagnostiquer() {
    setRaison("…");
    let chemin = adresse.trim();
    try {
      const u = new URL(chemin, window.location.origin);
      chemin = u.pathname + u.search;
    } catch {
      /* UNE ADRESSE QU'ON NE SAIT PAS LIRE PART TELLE QUELLE. Elle échouera,
         et l'échec se lira — ce qui vaut mieux que de refuser sans rien dire. */
    }
    try {
      const r = await fetch(chemin);
      const t = await r.text();
      setRaison(`HTTP ${r.status}\n\n${t.slice(0, 1200)}`);
    } catch (e) {
      setRaison(`La demande n'est pas partie : ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /**
   * ═══ LA COMPARAISON DE MODÈLES ════════════════════════════════════════════
   *
   * UNE SEULE CHOSE CHANGE D'UNE LIGNE À L'AUTRE : le moteur. Même photo, même
   * référence, même consigne, même ordre des images. C'est la règle de tout ce
   * banc, et c'est la seule façon d'attribuer une différence à une cause.
   *
   * ET CHAQUE MOTEUR REJOUE PLUSIEURS FOIS. Un générateur d'images n'est pas
   * déterministe : deux appels identiques rendent deux images différentes. Un
   * seul rendu par moteur ne compare pas deux moteurs, il compare deux tirages
   * — et c'est exactement l'erreur qu'on ferait en regardant une capture.
   *
   * LE RÉGIME EST CELUI QUI TIENT LE MIEUX LE VISAGE AUJOURD'HUI. On ne teste
   * pas le moteur ET la phrase en même temps : les cinq consignes ont déjà leur
   * banc, juste au-dessus.
   */
  async function comparerLesModeles() {
    if (!photo || !piece || !mur?.essai) return;
    setRes([]);
    const paires: { cle: string; nom: string; quoi: string; modele: string }[] = [];
    for (const [rang, m] of [modeleA, modeleB].filter(Boolean).entries()) {
      for (let i = 1; i <= fois; i++) {
        paires.push({
          cle: `m-${rang}-${i}`,
          nom: `${m} · tirage ${i}`,
          quoi:
            i === 1
              ? `Même photo, même référence, même consigne. Seul le moteur change.${m === enService ? " C'est celui en service." : ""}`
              : "Le même appel, rejoué : un générateur d’images ne rend pas deux fois la même chose.",
          modele: m,
        });
      }
    }
    for (const t of paires) {
      setEncours(t.cle);
      const debut = Date.now();
      const r = await essayerSurMoi({
        photo,
        reference: piece.reference ?? "",
        partie: mur.essai.partie,
        garder: mur.essai.garder,
        change: mur.essai.change,
        decrire: piece.decrire,
        decrireEn: piece.decrireEn,
        regime: "calquee",
        modele: t.modele,
      });
      const ms = Date.now() - debut;
      setRes((l) => [
        ...l,
        estUnRendu(r)
          ? { cle: t.cle, nom: t.nom, quoi: t.quoi, image: r.image, ms }
          : { cle: t.cle, nom: t.nom, quoi: t.quoi, erreur: r.erreur, pourquoi: r.pourquoi, ms },
      ]);
    }
    setEncours(null);
  }

  async function lancer() {
    if (!photo || !piece || !mur?.essai) return;
    setRes([]);
    for (const c of CONFIGS) {
      setEncours(c.cle);
      const debut = Date.now();
      const r = await essayerSurMoi({
        photo,
        // LA QUATRIÈME N'ENVOIE PAS DE RÉFÉRENCE, et c'est son seul écart.
        reference: c.sansReference ? "" : piece.reference ?? "",
        partie: mur.essai.partie,
        garder: mur.essai.garder,
        change: mur.essai.change,
        decrire: piece.decrire,
        decrireEn: piece.decrireEn,
        regime: c.regime,
      });
      const ms = Date.now() - debut;
      setRes((l) => [
        ...l,
        estUnRendu(r)
          ? { cle: c.cle, image: r.image, ms }
          : { cle: c.cle, erreur: r.erreur, pourquoi: r.pourquoi, ms },
      ]);
    }
    setEncours(null);
  }

  function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const l = new FileReader();
    l.onload = () => setPhoto(String(l.result || ""));
    l.readAsDataURL(f);
  }

  return (
    <main className="bn">
      <h1>Banc d’essai</h1>
      <p className="bn-sous">
        Les quatre configurations, à la suite, sur la même photo et la même référence. Un seul
        réglage change d’une ligne à l’autre.
      </p>

      <section className="bn-reg">
        <label>
          <span>Le commerce</span>
          <select
            value={cleMur}
            onChange={(e) => {
              setCleMur(e.target.value);
              const m = murs.find((x) => x.cle === e.target.value);
              setIdPiece(m?.essai?.pieces.find((p) => p.reference)?.id ?? "");
            }}
          >
            {murs.map((m) => (
              <option key={m.cle} value={m.cle}>
                {m.metier} — {m.lieu}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>La pièce à essayer</span>
          <select value={idPiece} onChange={(e) => setIdPiece(e.target.value)}>
            {pieces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>

        <div className="bn-photos">
          <div>
            <span>La photo de la personne</span>
            <div className="bn-cadres">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" />
              ) : (
                <em>aucune</em>
              )}
            </div>
            <button type="button" onClick={() => fichier.current?.click()}>
              Choisir une photo
            </button>
            {exemple && (
              <button type="button" onClick={() => setPhoto(exemple)}>
                Prendre celle d’exemple
              </button>
            )}
            <input ref={fichier} type="file" accept="image/*" hidden onChange={choisir} />
          </div>
          <div>
            <span>La référence</span>
            <div className="bn-cadres">
              {piece?.reference ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={piece.reference} alt="" />
              ) : (
                <em>aucune</em>
              )}
            </div>
          </div>
        </div>

        {/* CE QU'ON ENVOIE, EN TOUTES LETTRES. « La photo de la cliente doit
            être clairement désignée comme image à modifier ; la coupe, comme
            référence. » C'est le cas, et ça doit pouvoir se lire sans moi. */}
        {piece?.decrire && (
          <details className="bn-det">
            <summary>La description envoyée pour cette pièce</summary>
            <p>{piece.decrireEn || piece.decrire}</p>
          </details>
        )}
      </section>

      <button className="bn-go" type="button" disabled={!photo || !!encours} onClick={lancer}>
        {encours ? "En cours…" : "Lancer les cinq consignes"}
      </button>

      {/* ═══ ET L'AUTRE BANC : LE MÊME ESSAI SUR DEUX MOTEURS ════════════════

          « Cesse d'optimiser uniquement le prompt sur gpt-image-1. Ton banc
          montre déjà ses deux échecs possibles : soit la coupe ressemble à la
          référence et le visage change, soit le visage reste et la coupe
          devient générique. »

          C'EST LE SEUL RÉGLAGE QU'ON N'A JAMAIS FAIT VARIER, en huit tours. La
          liste ci-dessous vient du compte lui-même, pas d'un nom écrit de
          mémoire : voir /api/direct/modeles-image. */}
      <section className="bn-bloc">
        <h2 className="bn-t2">Le même essai, sur deux moteurs</h2>
        <p className="bn-quoi">
          Même photo, même référence, même consigne, même ordre des images. Seul le moteur change.
          Chacun rejoue plusieurs fois, parce qu’un générateur d’images ne rend jamais deux fois la
          même chose : un seul rendu par moteur comparerait deux tirages, pas deux moteurs.
        </p>
        {soucisModeles ? (
          <p className="bn-rate">
            <b>La liste des moteurs n’a pas pu être lue.</b>
            <span>{soucisModeles}</span>
          </p>
        ) : (
          <div className="bn-duo">
            <label>
              <span>Moteur A</span>
              <select value={modeleA} onChange={(e) => setModeleA(e.target.value)}>
                <option value="">— aucun —</option>
                {modeles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                    {m.id === enService ? " (en service)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Moteur B</span>
              <select value={modeleB} onChange={(e) => setModeleB(e.target.value)}>
                <option value="">— aucun —</option>
                {modeles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                    {m.id === enService ? " (en service)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tirages par moteur</span>
              <select value={fois} onChange={(e) => setFois(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
          </div>
        )}
        <button
          className="bn-go"
          type="button"
          disabled={!photo || !!encours || (!modeleA && !modeleB)}
          onClick={comparerLesModeles}
        >
          {encours ? "En cours…" : `Comparer (${(modeleA ? fois : 0) + (modeleB ? fois : 0)} rendus)`}
        </button>
      </section>

      {/* LES RÉSULTATS QUI PORTENT LEUR PROPRE TITRE viennent de la comparaison
          de moteurs : ils n'existent pas dans CONFIGS, donc ils s'affichent
          d'abord, dans l'ordre où ils sont tombés. */}
      {res.some((r) => r.nom) && (
        <section className="bn-grille">
          {res
            .filter((r) => r.nom)
            .map((r) => (
              <article key={r.cle} className="bn-carte">
                <h2>{r.nom}</h2>
                <p className="bn-quoi">{r.quoi}</p>
                <div className="bn-rendu">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" />
                  ) : (
                    <div className="bn-rate">
                      <b>{r.erreur}</b>
                      {r.pourquoi && <span>{r.pourquoi}</span>}
                    </div>
                  )}
                </div>
                {r.ms != null && <p className="bn-ms">{(r.ms / 1000).toFixed(1)} s</p>}
              </article>
            ))}
        </section>
      )}

      <section className="bn-grille">
        {CONFIGS.map((c) => {
          const r = res.find((x) => x.cle === c.cle);
          return (
            <article key={c.cle} className={encours === c.cle ? "bn-carte en" : "bn-carte"}>
              <h2>{c.nom}</h2>
              <p className="bn-quoi">{c.quoi}</p>
              <div className="bn-rendu">
                {r?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" />
                ) : r?.erreur ? (
                  <div className="bn-rate">
                    <b>{r.erreur}</b>
                    {r.pourquoi && <span>{r.pourquoi}</span>}
                  </div>
                ) : encours === c.cle ? (
                  <div className="bn-attend">en cours…</div>
                ) : (
                  <div className="bn-attend">—</div>
                )}
              </div>
              {r?.ms != null && <p className="bn-ms">{(r.ms / 1000).toFixed(1)} s</p>}
            </article>
          );
        })}
      </section>

      {/* ═══ ET LA REQUÊTE EXACTE, POUR QU'IL PUISSE LA MONTRER ═══════════

          « Le prochain pas utile est d'examiner la requête API exacte de
          ClikMe, car les images seules ne permettent pas de savoir où la
          fidélité se perd. »

          ELLE N'EST NULLE PART OÙ IL PUISSE LA LIRE. Elle est dans les
          journaux du serveur, sous la forme d'une ligne `[essai]` — ce qui
          veut dire qu'il doit me la demander, et que je la lui récite. La
          voici écrite, avec ce qui varie d'une configuration à l'autre. */}
      {/* ═══ ET POURQUOI UNE PHOTO DE FICHE NE VIENT PAS ══════════════════

          « 404 (Not Found) ; toujours aucune photo sur la page commerçant. »

          LA ROUTE RÉPOND DÉJÀ LA RAISON, EN TEXTE, DANS LE CORPS — trois
          lignes, une par écriture essayée, avec le code de retour de Google.
          Mais il faut ouvrir l'adresse dans un onglet pour la lire, et je l'ai
          demandé deux fois sans l'obtenir. Une information qui demande un
          geste qu'on ne fait pas n'est pas une information.

          ICI IL COLLE L'ADRESSE QU'IL VOIT DANS LA CONSOLE, et la raison
          s'affiche. C'est le même texte, à un endroit où il passe déjà. */}
      <details className="bn-det" open={false}>
        <summary>Pourquoi une photo de fiche ne vient pas</summary>
        <p className="bn-aide">
          Collez ici l’adresse <code>/api/photo-fiche?u=…</code> qui échoue dans la console de
          la page commerçant. Le serveur dit ce qu’il a essayé, et ce que Google a répondu.
        </p>
        <div className="bn-diag">
          <input
            type="text"
            value={adresse}
            placeholder="https://www.clikme.fr/api/photo-fiche?u=…"
            onChange={(e) => setAdresse(e.target.value)}
          />
          <button type="button" onClick={diagnostiquer} disabled={!adresse.trim()}>
            Demander
          </button>
        </div>
        {raison && <pre>{raison}</pre>}
      </details>

      {/* ═══ LA CONSIGNE, MOT POUR MOT ═══════════════════════════════════

          « Colle-moi la requête exacte affichée par son banc d'essai — modèle,
          ordre des images, prompt final, masque et paramètres — et je pourrai
          chercher la différence concrète, plutôt que te proposer encore une
          formulation au hasard. »

          LE BANC N'EN MONTRAIT QU'UN RÉSUMÉ. Un résumé ne permet de trouver
          aucune différence : c'est justement ce qu'on cherche. La phrase
          réelle est calculée ici, par la même fonction pure que la route
          appelle — pas recopiée, sans quoi elle divergerait au premier
          changement. */}
      {mur?.essai && piece && (
        <details className="bn-det">
          <summary>La consigne envoyée, mot pour mot</summary>
          {CONFIGS.map((c) => {
            const e = mur.essai!;
            const ref = !c.sansReference;
            const t =
              c.regime === "calquee"
                ? consigneCalquee(e.partie, e.change, piece.decrireEn || piece.decrire, ref)
                : c.regime === "brut"
                  ? consigneBrute(e.partie, e.change, piece.decrire, ref)
                  : consigne(e.partie, e.garder, e.change, piece.decrire, c.regime === "atelier", ref);
            return (
              <div key={c.cle} className="bn-mot">
                <b>
                  {c.nom} — {t.length} signes
                </b>
                <pre>{t}</pre>
              </div>
            );
          })}
        </details>
      )}

      <details className="bn-det bn-req">
        <summary>La requête exacte, à recopier</summary>
        <pre>{`POST https://api.openai.com/v1/images/edits   (multipart)

model            gpt-image-1
image[]          1 · la photo de la personne   ← c'est elle qu'on modifie
image[]          2 · la photo de la coupe      ← référence
input_fidelity   high
quality          high            (OPENAI_IMAGE_QUALITY)
n                1

CE QUI CHANGE D'UNE CONFIGURATION À L'AUTRE :

1 · Régime actuel      size absent · mask absent · photo entière, 1280 px
                       prompt anglais calqué sur ChatGPT, ≈ 1 200 signes
2 · Consigne longue    idem, prompt français ≈ 3 900 signes
3 · Consigne courte    idem, prompt ≈ 500 signes
4 · Masque + cadre     size 1024x1024 (ou 1536x1024 / 1024x1536)
                       mask PNG aux dimensions de la photo
                       photo rognée au rapport du cadre, 800 px
5 · Sans référence     un seul image[] · le reste comme 1

ORDRE DES IMAGES : la cliente est TOUJOURS image[] n° 1, parce que sur
/v1/images/edits la première image est la toile qu'on édite. ChatGPT avait
mis la référence en premier — mais il appelait son outil interne, pas ce
point d'entrée. Inverser ici risquerait de rendre la référence retouchée,
c'est-à-dire une autre personne.`}</pre>
      </details>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .bn{max-width:1100px;margin:0 auto;padding:22px 16px 60px;
            font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef;background:#0b0d14;min-height:100dvh;}
        .bn h1{font-size:26px;margin:0 0 4px;}
        .bn-sous{color:#9aa4c4;margin:0 0 20px;}
        .bn-reg{display:grid;gap:14px;background:#141828;border-radius:16px;padding:16px;}
        /* UN ENFANT DE GRILLE NE RETRECIT PAS TOUT SEUL. Sa largeur minimale
           vaut « auto », donc un menu deroulant dont l'option la plus longue
           fait cinq cents points elargit la colonne — et la page entiere
           deborde de cent trente points sur un telephone. Mesure avant :
           page 517, vue 390. */
        .bn-reg *{min-width:0;}
        .bn-reg select{width:100%;max-width:100%;}
        .bn-reg img{max-width:100%;}
        .bn-reg label{display:grid;gap:5px;}
        .bn-reg label span{font-size:12px;font-weight:700;letter-spacing:.06em;
            text-transform:uppercase;color:#8e98ba;}
        .bn-reg select{background:#0b0d14;color:#eef;border:1px solid #2a3150;
            border-radius:10px;padding:10px;font-size:15px;}
        .bn-photos{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .bn-photos>div{display:grid;gap:7px;align-content:start;}
        .bn-photos span{font-size:12px;font-weight:700;letter-spacing:.06em;
            text-transform:uppercase;color:#8e98ba;}
        .bn-cadres{aspect-ratio:3/4;background:#0b0d14;border:1px solid #2a3150;
            border-radius:12px;display:grid;place-items:center;overflow:hidden;}
        .bn-cadres img{width:100%;height:100%;object-fit:cover;}
        .bn-cadres em{color:#5d668a;font-style:normal;}
        .bn button{background:#232a45;color:#eef;border:0;border-radius:10px;
            padding:10px 12px;font-size:14px;font-weight:600;cursor:pointer;}
        .bn-go{width:100%;margin:18px 0;background:linear-gradient(90deg,#7b4dff,#e0389f) !important;
            padding:15px !important;font-size:16px !important;}
        .bn-go:disabled{opacity:.45;cursor:default;}
        .bn-grille{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
        .bn-carte{background:#141828;border:1px solid #232a45;border-radius:16px;padding:13px;}
        .bn-carte.en{border-color:#7b4dff;}
        .bn-carte h2{font-size:15px;margin:0 0 4px;}
        .bn-quoi{font-size:12.5px;color:#9aa4c4;margin:0 0 10px;min-height:48px;}
        /* LE SECOND BANC : MEME HABIT QUE LE PREMIER. Deux bancs qui ne se
           ressemblent pas se lisent comme deux outils ; c'est le meme outil,
           avec un autre axe. */
        .bn-bloc{margin:26px 0 0;padding:16px;border-radius:14px;
          background:#141a2e;border:1px solid #222b47;}
        .bn-t2{margin:0 0 6px;font-size:15px;font-weight:800;color:#e8ecf8;}
        .bn-bloc .bn-quoi{min-height:0;}
        .bn-bloc .bn-go{margin:14px 0 0;}
        /* LES TROIS REGLAGES SUR UNE LIGNE TANT QU'ILS TIENNENT. En dessous de
           520 points ils s'empilent : un selecteur de modele porte des
           identifiants longs, et un identifiant coupe ne sert a rien. */
        .bn-duo{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;}
        .bn-duo label{flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:4px;}
        .bn-duo span{font-size:10.5px;font-weight:800;letter-spacing:.08em;
          text-transform:uppercase;color:#8d97b8;}
        .bn-duo select{width:100%;min-width:0;padding:9px 10px;border-radius:9px;
          font:inherit;font-size:13px;color:#e8ecf8;
          background:#0e1324;border:1px solid #2a3454;}
        .bn-rendu{aspect-ratio:3/4;background:#0b0d14;border-radius:12px;
            display:grid;place-items:center;overflow:hidden;}
        .bn-rendu img{width:100%;height:100%;object-fit:contain;}
        .bn-attend{color:#5d668a;font-size:13px;}
        .bn-rate{display:grid;gap:4px;padding:12px;text-align:center;}
        .bn-rate b{color:#ff8ba0;font-size:13px;}
        .bn-rate span{color:#8e98ba;font-size:11.5px;}
        .bn-ms{margin:8px 0 0;font-size:12px;color:#8e98ba;text-align:right;}
        .bn-det{margin-top:16px;background:#141828;border-radius:12px;padding:12px 14px;}
        .bn-det summary{cursor:pointer;font-weight:600;font-size:14px;}
        .bn-det p{color:#c4cbe4;font-size:13.5px;}
        .bn-mot{margin-top:12px;}
        .bn-mot b{display:block;font-size:12.5px;color:#8e98ba;margin-bottom:4px;}
        .bn-aide{font-size:13px;color:#9aa4c4;margin:8px 0 10px;}
        .bn-aide code{background:#0b0d14;padding:1px 5px;border-radius:5px;font-size:12px;}
        .bn-diag{display:flex;gap:8px;}
        .bn-diag input{flex:1;min-width:0;background:#0b0d14;color:#eef;border:1px solid #2a3150;
            border-radius:10px;padding:10px;font-size:13px;}
        .bn-det pre{white-space:pre-wrap;word-break:break-word;
            font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:#c4cbe4;margin:10px 0 0;}
        .bn-req pre{white-space:pre-wrap;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;
            color:#c4cbe4;margin:10px 0 0;}
        /* DEUX COLONNES MEME SUR UN TELEPHONE, ET C'EST TOUT L'INTERET. Une
           seule colonne fait une page de sept mille points ou l'on compare de
           memoire ; c'est exactement ce qu'on essaie d'arreter. Cote a cote,
           meme plus petit, l'ecart se voit d'un coup d'oeil. */
        @media (max-width:640px){
          .bn h1{font-size:22px;}
          .bn-quoi{min-height:64px;font-size:11.5px;}
          .bn-carte h2{font-size:13px;}
          .bn-grille{gap:9px;}
          .bn-carte{padding:9px;}
        }
      `,
        }}
      />
    </main>
  );
}
