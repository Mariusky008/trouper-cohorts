"use client";

/**
 * 🏠 « MA MAISON » — son onglet, depuis le 14 novembre 2026 (le propriétaire : « mon univers est difficilement accessible
 * sur l'appli, ça mérite peut-être son onglet direct […] les gens doivent y accéder facilement pour découvrir notre
 * univers ») ; le menu : Découvrir · Messages · Ma maison · Autour, sa figurine sur le bouton de « Ma maison ».
 *
 * Aujourd'hui : mon univers en entier (son décor du moment, ma figurine chez elle, les cadeaux posés, la saison) ;
 * « 👀 Comme la voient mes visiteurs » (ma page de visite) ; ses réglages (⚙️, `/univers/monde`) ; « Mon étagère »
 * (`EtagereChezMoi`). Demain : la maison de poupée et ses pièces, vivantes (la maquette « Ma maison », 14 novembre).
 */
import { EtagereChezMoi } from "./etagere";
import { FenetreSurMonUnivers, useMonUnivers } from "./chez-moi";
import { useMesVisites } from "./visites-recues";

export function MaMaison({ actif }: { actif: boolean }) {
  const etat = useMonUnivers(actif);
  const { visites } = useMesVisites(actif);
  const pret = etat && etat !== "absent" && etat.etape === "decouverte" && etat.decor ? etat : null;
  return (
    <div className="mm">
      <header className="cm-titre">
        <h2>Ma maison</h2>
        {pret && (
          <a className="cm-reglages" href="/univers/monde" aria-label="Ma maison : ses réglages">
            ⚙️
          </a>
        )}
      </header>
      {etat === null ? (
        <div className="cm-fenetre cm-attente mm-attente" aria-hidden="true" />
      ) : pret ? (
        <>
          <FenetreSurMonUnivers etat={pret} souvenirs={visites?.poses} entiere>
            {pret.saison && (
              <span className="cm-saison">
                {pret.saison.emoji} {pret.saison.nom}
              </span>
            )}
          </FenetreSurMonUnivers>
          <div className="mm-actions">
            {visites?.cle && (
              <a className="mm-bouton" href={`/univers/chez/${visites.cle}`}>
                👀 Comme la voient mes visiteurs
              </a>
            )}
            <a className="mm-bouton clair" href="/univers/monde">
              🛠️ La retoucher · qui peut entrer
            </a>
          </div>
        </>
      ) : (
        <a className="cm-attend" href="/univers">
          <b>{etat !== "absent" && etat.etape === "a-creer" ? "Ta maison est prête à être créée ✨" : etat !== "absent" && etat.etape === "creation" ? "Ta maison se construit… 🛠️" : "Ta maison t’attend 🏡"}</b>
          <span>
            {etat !== "absent" && etat.figurine ? "Pablito l’imagine avec toi, d’après ce que tu lui racontes." : "D’abord ta figurine, assise dans son fauteuil. Ensuite, on imagine ta maison ensemble."}
          </span>
          <span className="cm-attend-bouton">{etat !== "absent" && etat.etape === "creation" ? "La voir" : "C’est parti"}</span>
        </a>
      )}
      {/* 📚 mon étagère : ce que nos figurines notent sur moi, et ce que j'y dépose */}
      <EtagereChezMoi actif={actif} />
      {pret && <p className="mm-bientot">🏗️ Ta maison va s’agrandir : de nouvelles pièces apparaîtront au fil de tes conversations.</p>}
    </div>
  );
}

export const STYLES_MA_MAISON = `
.mm{display:flex;flex-direction:column;gap:12px;padding-bottom:8px}
.mm-attente{height:min(130vw,640px)}
.mm-actions{display:flex;flex-wrap:wrap;gap:8px}
.mm-bouton{display:inline-flex;align-items:center;gap:6px;padding:10px 15px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:14.5px;font-weight:900;text-decoration:none;box-shadow:0 8px 20px -8px rgba(255,46,154,.9)}
.mm-bouton.clair{background:rgba(255,255,255,.08);color:#FFF4E6;box-shadow:none}
.mm .et-chez{margin-top:2px}
.mm-bientot{margin:2px 2px 0;color:#CDB4C0;font-size:13.5px;line-height:1.45}
`;
