/**
 * 🎞️ LES INFOS SOUS LA VIDÉO, COMME YOUTUBE (maquette « Salon et réactions », validée le 27 novembre 2026 : « la vidéo
 * sans texte par-dessus, mais en dessous : le titre, celui qui l'a faite, le nombre de vues, depuis combien de jours »).
 * Le rond : la première lettre de la chaîne. Les vues : le vrai chiffre de YouTube, lu la nuit ; sans lui, rien.
 */
import { ligneInfosVideo, type InfosVideo } from "@/lib/direct/salons-ouverts";

export function InfosSousLaVideo({ v, sous }: { v: InfosVideo; sous?: string }) {
  const ligne = sous ?? ligneInfosVideo(v);
  const lettre = (v.chaine ?? "").trim().charAt(0).toUpperCase();
  return (
    <div className="iv" data-infos-video={v.id}>
      {lettre ? (
        <span className="iv-rond" aria-hidden="true">
          {lettre}
        </span>
      ) : null}
      <span className="iv-texte">
        <b data-titre-video>{v.titre}</b>
        {ligne ? <small data-ligne-video>{ligne}</small> : null}
      </span>
    </div>
  );
}

export const STYLES_INFOS_VIDEO = `
.iv{display:flex;gap:10px;align-items:flex-start;min-width:0;text-align:left}
.iv-rond{flex:none;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#3a2133;color:#FFF4E6;font-size:14px;font-weight:900}
.iv-texte{display:flex;flex-direction:column;gap:2px;min-width:0}
.iv-texte b{font-size:14px;font-weight:800;line-height:1.3;color:#FFF4E6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.iv-texte small{font-size:12px;font-weight:600;color:#c9b3bf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
