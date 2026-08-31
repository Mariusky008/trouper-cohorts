"use client";

// L'ÉCRAN DE PRÉPARATION — LA VEILLE DE LA TOURNÉE.
//
// CE QU'IL EST, ET CE QU'IL N'EST PAS. Ce n'est pas une fonction du produit :
// aucun habitant ne le verra jamais. C'est l'outil de celui qui démarche, et
// il n'a qu'un seul but — qu'au moment où l'on pousse la porte d'une
// boucherie, la première carte du paquet SOIT cette boucherie.
//
// IL EST DONC FAIT POUR ÊTRE REMPLI DEBOUT, EN DEUX MINUTES, sur un téléphone,
// pour six commerces d'affilée. D'où les choix qui suivent, et ils vont tous
// dans le même sens :
//
//   · SEPT CHAMPS, ET UN SEUL EST DIFFICILE. Le nom, le métier, l'adresse,
//     les horaires, la distance se lisent sur la devanture ou sur la fiche
//     Google. Le seul qui demande de connaître un peu le commerce, c'est
//     « ce qu'il a aujourd'hui » — et c'est justement celui qui fait tout
//     l'effet le lendemain.
//   · LA PHOTO EST FACULTATIVE. Sans elle, la carte tombe sur son dégradé,
//     ce qui est propre. Une photo manquante ne doit jamais empêcher de
//     préparer une visite ; la devanture se photographie de toute façon en
//     arrivant.
//   · RIEN NE PART NULLE PART. Tout est dans `localStorage`, sur cet
//     appareil. Voir le grand commentaire de `preparation.ts` : publier la
//     carte d'un commerce avant son accord le ferait passer pour un client
//     sans qu'il ait rien signé.

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CleMetier } from "@/lib/direct/apercu-habitant";
import {
  ajouterPreparation,
  chargerPreparation,
  retirerPreparation,
  viderPreparation,
  type CommercePrepare,
} from "@/lib/direct/preparation";

const BRANCHES: { cle: CleMetier; label: string }[] = [
  { cle: "restaurant", label: "Bouche" },
  { cle: "mode", label: "Mode" },
  { cle: "bar", label: "Bar" },
  { cle: "coiffeur", label: "Coiffure" },
  { cle: "fleuriste", label: "Fleurs" },
  { cle: "ongles", label: "Ongles" },
];

/**
 * LA PHOTO EST RÉDUITE AVANT D'ÊTRE GARDÉE, ET C'EST OBLIGATOIRE.
 *
 * `localStorage` tient environ cinq mégaoctets pour TOUT le domaine — les
 * salons, les favoris, le prénom. Une photo de téléphone en base64 en fait
 * quatre à elle seule : la première préparation remplirait le quota, et les
 * suivantes échoueraient en silence. Huit cents points de côté suffisent
 * largement pour une carte affichée sur trois cent quatre-vingt-dix.
 */
async function reduire(fichier: File): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, non) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => non(new Error("image illisible"));
      i.src = url;
    });
    const MAX = 800;
    const k = Math.min(1, MAX / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const VIDE = {
  nom: "",
  metier: "",
  branche: "restaurant" as CleMetier,
  adresse: "",
  horaires: "",
  distance: "",
  quoi: "",
  detail: "",
  prix: "",
  prenom: "",
  role: "",
  conseil: "",
};

/**
 * LES TROIS AMORCES — et c'est elles qui règlent le vrai problème.
 *
 * « Écrivez un conseil » donne une page blanche, et une page blanche devant un
 * commerçant qui a trente secondes donne un champ vide. Ce qui marche, c'est
 * une question qu'il a déjà entendue cent fois de la bouche de ses clients :
 * il finit la phrase sans y penser, parce qu'il l'a dite ce matin.
 *
 * ELLES NE SONT PAS DES MODÈLES À COCHER MAIS DES DÉBUTS À COMPLÉTER : on les
 * pose dans le champ, le curseur est à la fin, il continue. La différence est
 * énorme — un modèle demande de choisir, un début demande de parler.
 */
const AMORCES = [
  "Prenez plutôt ",
  "Ce que je prendrais à votre place : ",
  "Si vous ne devez goûter qu'une chose : ",
];

export function Preparer() {
  const [liste, setListe] = useState<CommercePrepare[]>([]);
  const [f, setF] = useState({ ...VIDE });
  const [photo, setPhoto] = useState<string | undefined>();
  const [video, setVideo] = useState<string | undefined>();
  const [echo, setEcho] = useState("");

  useEffect(() => setListe(chargerPreparation()), []);

  const pret = f.nom.trim() && f.metier.trim() && f.quoi.trim();

  function poser() {
    if (!pret) return;
    // LA DISTANCE SERT AU TRI DU PAQUET, et les préparés passent devant de
    // toute façon. On ne demande donc pas des mètres : on accepte ce qui est
    // écrit, et on met un nombre plausible derrière.
    const m = Number((f.distance.match(/\d+/) ?? ["150"])[0]) || 150;
    ajouterPreparation({
      nom: f.nom.trim(),
      metier: f.metier.trim(),
      branche: f.branche,
      adresse: f.adresse.trim(),
      horaires: f.horaires.trim() || "Aujourd’hui",
      distance: f.distance.trim() || `${m} m`,
      metres: m,
      photo,
      quoi: f.quoi.trim(),
      detail: f.detail.trim() || undefined,
      prix: f.prix.trim() || undefined,
      prenom: f.prenom.trim() || undefined,
      role: f.role.trim() || undefined,
      conseil: f.conseil.trim() || undefined,
      video,
    });
    setListe(chargerPreparation());
    setF({ ...VIDE, branche: f.branche });
    setPhoto(undefined);
    setVideo(undefined);
    setEcho(`« ${f.nom.trim()} » est prête.`);
  }

  return (
    <div className="pp">
      <header className="pp-h">
        <div>
          <h1>Préparer la tournée</h1>
          <p>
            Ces commerces apparaîtront <b>en tête du paquet</b>, avant tous les
            autres. Tout reste sur ce téléphone&nbsp;: rien n’est publié, rien
            n’est envoyé.
          </p>
        </div>
        <Link className="pp-ouvrir" href="/autour-de-moi">
          Ouvrir Le Direct →
        </Link>
      </header>

      <section className="pp-f">
        <h2>Un commerce</h2>
        <div className="pp-g">
          <label className="pp-l pp-2">
            <span>Le nom, tel qu’il est sur la devanture</span>
            <input
              value={f.nom}
              onChange={(e) => setF({ ...f, nom: e.target.value })}
              placeholder="Boucherie Lasserre"
            />
          </label>
          <label className="pp-l">
            <span>Son métier</span>
            <input
              value={f.metier}
              onChange={(e) => setF({ ...f, metier: e.target.value })}
              placeholder="Boucherie"
            />
          </label>
          <label className="pp-l">
            <span>Sa famille dans l’application</span>
            <select
              value={f.branche}
              onChange={(e) => setF({ ...f, branche: e.target.value as CleMetier })}
            >
              {BRANCHES.map((b) => (
                <option key={b.cle} value={b.cle}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="pp-l pp-2">
            <span>L’adresse</span>
            <input
              value={f.adresse}
              onChange={(e) => setF({ ...f, adresse: e.target.value })}
              placeholder="12 rue Saint-Vincent"
            />
          </label>
          <label className="pp-l">
            <span>Ses horaires</span>
            <input
              value={f.horaires}
              onChange={(e) => setF({ ...f, horaires: e.target.value })}
              placeholder="7 h – 13 h, 15 h 30 – 19 h 30"
            />
          </label>
          <label className="pp-l">
            <span>Sa distance</span>
            <input
              value={f.distance}
              onChange={(e) => setF({ ...f, distance: e.target.value })}
              placeholder="180 m"
            />
          </label>

          {/* LE SEUL CHAMP QUI DEMANDE DE CONNAITRE LE COMMERCE, et celui qui
              fait tout l'effet : « côte de bœuf maturée 40 jours » sur SA
              carte vaut mille explications sur le principe du produit. */}
          <label className="pp-l pp-2 pp-clef">
            <span>Ce qu’il a aujourd’hui</span>
            <input
              value={f.quoi}
              onChange={(e) => setF({ ...f, quoi: e.target.value })}
              placeholder="La côte de bœuf maturée"
            />
          </label>
          <label className="pp-l">
            <span>Un détail</span>
            <input
              value={f.detail}
              onChange={(e) => setF({ ...f, detail: e.target.value })}
              placeholder="Bazadaise, 40 jours"
            />
          </label>
          <label className="pp-l">
            <span>Son prix</span>
            <input
              value={f.prix}
              onChange={(e) => setF({ ...f, prix: e.target.value })}
              placeholder="34 €/kg"
            />
          </label>

          {/* ═══ SA VOIX ═══
              La seule chose de ce formulaire qu'on ne peut pas préparer la
              veille : il faut être devant lui. Et c'est le bon moment —
              « qu'est-ce que vous conseilleriez à quelqu'un qui entre
              aujourd'hui ? » se répond en trois secondes, parce qu'il l'a
              déjà dit dix fois ce matin. */}
          <p className="pp-titre">
            Sa voix — facultatif, et c’est ce qui change tout
          </p>
          <label className="pp-l">
            <span>Son prénom</span>
            <input
              value={f.prenom}
              onChange={(e) => setF({ ...f, prenom: e.target.value })}
              placeholder="Serge"
            />
          </label>
          <label className="pp-l">
            <span>Il se présente comment</span>
            <input
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value })}
              placeholder="boucher"
            />
          </label>
          <label className="pp-l pp-2 pp-clef">
            <span>Son conseil du jour</span>
            <input
              value={f.conseil}
              onChange={(e) => setF({ ...f, conseil: e.target.value })}
              placeholder="La côte, attendez jeudi. Aujourd’hui, prenez la bavette."
            />
          </label>
          {/* CE QUI ÉVITE LA PAGE BLANCHE. Voir AMORCES : on ne lui demande
              pas d'écrire, on lui donne un début de phrase à finir. */}
          <div className="pp-amorces pp-2">
            {AMORCES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setF({ ...f, conseil: a })}
              >
                {a.trim()}…
              </button>
            ))}
          </div>

          {/* SA VIDÉO SE TOURNE MAINTENANT, OU JAMAIS. « Quand vous aurez le
              temps » revient à ne jamais l'avoir : trois secondes de geste
              pendant qu'on est devant lui, et c'est réglé. Muette et courte —
              un rond de quarante pixels n'est pas une tribune. */}
          <label className="pp-l pp-2">
            <span>Sa vidéo — trois secondes, un geste, sans parler</span>
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => {
                const x = e.target.files?.[0];
                if (!x) return;
                // PAS DE RÉDUCTION ICI : on ne réencode pas une vidéo dans un
                // navigateur de téléphone sans le faire chauffer une minute.
                // Le garde-fou est la TAILLE — au-delà, le stockage local
                // déborde et on perd toute la tournée préparée.
                if (x.size > 3_000_000) {
                  setEcho("Cette vidéo est trop lourde. Trois secondes suffisent.");
                  return;
                }
                const l = new FileReader();
                l.onload = () => setVideo(String(l.result));
                l.readAsDataURL(x);
              }}
            />
          </label>
          {video && (
            <p className="pp-n pp-2">
              Vidéo prête. Elle reste sur cet appareil, comme la photo.
            </p>
          )}

          <label className="pp-l pp-2">
            <span>Sa photo — facultative</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const x = e.target.files?.[0];
                if (!x) return;
                try {
                  setPhoto(await reduire(x));
                  setEcho("Photo réduite et gardée sur cet appareil.");
                } catch {
                  setEcho("Cette image n’a pas pu être lue.");
                }
              }}
            />
          </label>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="pp-vignette" src={photo} alt="" />
          )}
        </div>

        <div className="pp-actions">
          <button type="button" className="pp-b" disabled={!pret} onClick={poser}>
            Ajouter au paquet
          </button>
          {echo && <span className="pp-echo">{echo}</span>}
        </div>
        {!pret && (
          <p className="pp-n">
            Il faut au minimum le nom, le métier, et ce qu’il a aujourd’hui.
          </p>
        )}
      </section>

      <section className="pp-liste">
        <h2>
          Prêts pour la tournée<b>{liste.length}</b>
        </h2>
        {liste.length === 0 ? (
          <p className="pp-n">Rien de préparé pour l’instant.</p>
        ) : (
          <ul>
            {liste.map((c) => (
              <li key={c.id}>
                {c.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo} alt="" />
                ) : (
                  <i aria-hidden="true">🏬</i>
                )}
                <span>
                  <b>{c.nom}</b>
                  <em>
                    {c.metier} · {c.distance}
                  </em>
                  <u>{c.quoi}{c.prix ? ` · ${c.prix}` : ""}</u>
                </span>
                <button type="button" onClick={() => {
                  retirerPreparation(c.id);
                  setListe(chargerPreparation());
                }}>
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
        {liste.length > 0 && (
          <button
            type="button"
            className="pp-vider"
            onClick={() => {
              viderPreparation();
              setListe([]);
              setEcho("Tout est effacé.");
            }}
          >
            Tout effacer après la tournée
          </button>
        )}
      </section>

      <p className="pp-rappel">
        <b>Ce qui s’affiche sur leur carte :</b> « prête à publier ». C’est vrai,
        et c’est mieux qu’un silence — un commerçant qui découvrirait après coup
        qu’on a mis sa devanture en ligne sans lui ne reviendrait pas. Dites-le :
        « elle est prête, vous n’avez qu’un mot à dire. »
      </p>
    </div>
  );
}
