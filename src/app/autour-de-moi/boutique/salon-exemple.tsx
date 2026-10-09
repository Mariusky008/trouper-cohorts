"use client";

// 💬 LE SALON DES AMIS, EN EXEMPLE — tant que sa page n'est pas gardée.
//
// « Sur l'onglet et la page "Amis", on devrait mettre en démo, jusqu'à ce que
// la commerçante garde sa page officiellement, un essayage qui serait le début
// de la conversation entre amis, et trois ou quatre phrases. »
//
// LE SALON VIDE DISAIT VRAI, MAIS NE MONTRAIT RIEN. « Personne n'a encore écrit
// ici » est juste pour un salon réel — et c'est exactement ce que la
// commerçante voit en découvrant sa page : un onglet sans vie, au moment où il
// faudrait lui montrer ce qui s'y passera. On lui montre donc la scène qui fait
// toute la différence : une cliente essaie une de SES pièces, partage l'essai
// en un clic, et ses amies répondent.
//
// À ELLE SEULE, ET SEULEMENT AVANT QU'ELLE GARDE SA PAGE (`saPage`). Un
// visiteur ne la voit jamais, et dès que le salon a un vrai message, c'est lui
// qui s'affiche. TOUT EST MARQUÉ « EXEMPLE » : les prénoms sont ceux des
// fantômes de l'application, la photo est sa pièce essayée quand le moteur l'a
// rendue (voir `essai-vitrine.ts`), l'exemple déjà fabriqué sinon.
import type { CarteAutour } from "@/lib/direct/apercu-habitant";

const F = (nom: string) => `/direct/ensemble/fantome-${nom}.webp`;
const CAMILLE = { qui: "Camille", av: F("casquette-noire") };
const JULIE = { qui: "Julie", av: F("beret-rouge") };
const SAM = { qui: "Sam", av: F("bonnet") };
/** L'essai déjà fabriqué : la même personne, avec un blazer rose. */
const ESSAI_EXEMPLE = "/direct/accueil/moi-mode-avec.jpg";

type Ligne = { p: { qui: string; av: string }; texte: string; quand: string };

export function SalonExemple({ c, photoLieu }: { c: CarteAutour; photoLieu?: string }) {
  const mode = c.branche === "mode";
  const essai = c.essaiVitrine?.etat === "prete" && c.essaiVitrine.apres ? c.essaiVitrine : undefined;
  /* LA PHOTO QUI OUVRE LA CONVERSATION : l'essai chez une boutique de
     vêtements (le sien s'il est prêt), la photo du lieu ailleurs. */
  const photo = mode ? (essai?.apres ?? ESSAI_EXEMPLE) : photoLieu;
  const sienne = Boolean(mode && essai);
  const piece = essai?.nom ? `« ${essai.nom} »` : "cette pièce";

  const ouverture = mode
    ? `J’ai essayé ${piece} de chez ${c.nom} 😍 Vous en pensez quoi ?`
    : `Regardez où je vous emmène : ${c.nom} 😍`;
  const suite: Ligne[] = mode
    ? [
        { p: JULIE, texte: "Elle te va trop bien ! La couleur est parfaite ❤️", quand: "14:03" },
        { p: SAM, texte: "Avec tes bottines noires, ce serait top 👢", quand: "14:05" },
        { p: CAMILLE, texte: "Je passe l’essayer samedi. Qui vient avec moi ?", quand: "14:06" },
        { p: JULIE, texte: "Moi ! On se retrouve devant à 15 h 🙌", quand: "14:06" },
      ]
    : [
        { p: JULIE, texte: "Trop bien, ça fait longtemps que je veux y aller !", quand: "14:03" },
        { p: SAM, texte: "Je suis libre samedi 🙌", quand: "14:05" },
        { p: CAMILLE, texte: "Parfait, je leur écris pour samedi.", quand: "14:06" },
        { p: JULIE, texte: "Top, à samedi !", quand: "14:06" },
      ];

  return (
    <div className="bt-exemple" aria-label="Exemple de conversation entre amis">
      <p className="bt-exemple-k">
        Exemple · voici comment {mode ? "vos clientes en parleront entre amies" : "vos clients en parleront entre amis"}
      </p>
      <div className="bt-fil">
        <div className="bt-msg" style={{ ["--i" as string]: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="bt-av-img" src={CAMILLE.av} alt="" />
          <div>
            <small>
              {CAMILLE.qui} <span>14:02</span>
            </small>
            {photo && (
              <figure className="bt-essai">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={mode ? `Camille dans une pièce de ${c.nom}` : c.nom} />
                <figcaption>{mode ? "Essayé sur moi ✨" : "Partagé depuis ClikMe"}</figcaption>
                {mode && !sienne && <span className="bt-essai-ex">Exemple</span>}
              </figure>
            )}
            <p>{ouverture}</p>
          </div>
        </div>
        {suite.map((l, i) => (
          <div key={i} className="bt-msg" style={{ ["--i" as string]: i + 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="bt-av-img" src={l.p.av} alt="" />
            <div>
              <small>
                {l.p.qui} <span>{l.quand}</span>
              </small>
              <p>{l.texte}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
