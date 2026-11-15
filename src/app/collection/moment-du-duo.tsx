"use client";

/**
 * 🎬 LE MOMENT DU DUO (15 novembre 2026, le propriétaire, point 7 : « il faut que dans cet espace il se passe tout le
 * temps quelque chose pour que lorsque j'arrive je voie quelque chose se passer : le dernier commentaire d'une des
 * figurines dans cet univers commun, une demande de rangement, un nouvel objet déposé par l'autre sur l'étagère… »).
 *
 * En arrivant dans la conversation, juste sous l'en-tête : ce qui vient de se passer entre eux deux, dit par la figurine
 * qui le porte — dans cet ordre :
 *   1. 📌 une demande « Je le range ? » qui attend (Oui / Non, là, tout de suite) ;
 *   2. 📚 un souvenir posé sur leur étagère ces trois derniers jours (« Voir ») ;
 *   3. 💬 le dernier aparté de leurs figurines sur la conversation, ces deux derniers jours.
 * Sinon, le mot du jour de leurs figurines (`BandeauRituel`) garde sa place ; et leur étagère, même vide, reste au mur
 * de la scène (« 📚 Votre étagère · ＋ un souvenir ») et dans l'en-tête. Un moment vu peut se fermer (×) : il ne
 * revient plus sur ce téléphone ; la demande, elle, attend sa réponse.
 *
 * Rien de neuf côté serveur : tout vient de ce que la conversation a déjà chargé (l'étagère, la conversation vivante).
 */
import { useState } from "react";
import type { ObjetVu, QuestionVue } from "@/lib/direct/etagere";
import type { AparteVue } from "@/lib/direct/vivant";

export type MomentDuDuo =
  | { genre: "question"; id: string; qui: "moi" | "lui"; q: QuestionVue }
  | { genre: "souvenir"; id: string; qui: "moi" | "lui"; o: ObjetVu }
  | { genre: "aparte"; id: string; qui: "moi" | "lui"; texte: string };

const TROIS_JOURS = 3 * 24 * 3_600_000;
const DEUX_JOURS = 2 * 24 * 3_600_000;
const CLE_FERMES = "clikme-moments-fermes";

/** Les moments fermés sur ce téléphone (par conversation). */
export function lireFermes(cle: string): string[] {
  try {
    const t = JSON.parse(window.localStorage.getItem(CLE_FERMES) ?? "{}") as Record<string, string[]>;
    return Array.isArray(t[cle]) ? t[cle] : [];
  } catch {
    return [];
  }
}
function retenirFerme(cle: string, id: string) {
  try {
    const t = JSON.parse(window.localStorage.getItem(CLE_FERMES) ?? "{}") as Record<string, string[]>;
    t[cle] = [...(Array.isArray(t[cle]) ? t[cle] : []), id].slice(-60);
    window.localStorage.setItem(CLE_FERMES, JSON.stringify(t));
  } catch {
    /* rien */
  }
}

/** Ce qui vient de se passer entre eux deux (le plus important d'abord) ; `null` : rien de neuf. */
export function momentDuDuo(o: { questions: QuestionVue[]; objets: ObjetVu[]; apartes: AparteVue[]; fermes: readonly string[]; maintenant: number; pret: boolean }): MomentDuDuo | null {
  if (!o.pret) return null;
  const ouvert = (id: string) => !o.fermes.includes(id);
  // 1. une demande qui attend sa réponse (la plus récente)
  const q = [...o.questions].sort((a, b) => b.objet.le.localeCompare(a.objet.le))[0];
  if (q) return { genre: "question", id: `q:${q.id}`, qui: q.qui, q };
  // 2. un souvenir posé ces trois derniers jours
  const recent = [...o.objets].filter((x) => o.maintenant - (Date.parse(x.le) || 0) < TROIS_JOURS).sort((a, b) => b.le.localeCompare(a.le))[0];
  if (recent && ouvert(`o:${recent.id}`)) return { genre: "souvenir", id: `o:${recent.id}`, qui: recent.de, o: recent };
  // 3. le dernier aparté de leurs figurines, ces deux derniers jours (sa dernière réplique)
  const a = [...o.apartes].filter((x) => o.maintenant - (Date.parse(x.le) || 0) < DEUX_JOURS && x.mots.length).sort((x, y) => y.le.localeCompare(x.le))[0];
  if (a && ouvert(`a:${a.id}`)) {
    const der = a.mots[a.mots.length - 1];
    return { genre: "aparte", id: `a:${a.id}`, qui: der.moi ? "moi" : "lui", texte: der.texte };
  }
  return null;
}

/** Le bandeau : la figurine qui le porte, ce qu'elle dit, ce qu'on peut en faire. */
export function BandeauMoment({
  cle,
  m,
  prenom,
  imageMoi,
  imageLui,
  onRepondre,
  onEtagere,
  onFerme,
}: {
  cle: string;
  m: MomentDuDuo;
  prenom: string;
  imageMoi: string;
  imageLui: string;
  onRepondre: (q: QuestionVue, oui: boolean) => Promise<void>;
  onEtagere: () => void;
  onFerme: (id: string) => void;
}) {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const image = m.qui === "moi" ? imageMoi : imageLui;
  const qui = m.qui === "moi" ? "Ta figurine" : `La figurine de ${prenom}`;
  const fermer = () => {
    retenirFerme(cle, m.id);
    onFerme(m.id);
  };
  async function repondre(oui: boolean) {
    if (m.genre !== "question") return;
    setOccupe(true);
    setErreur("");
    try {
      await onRepondre(m.q, oui);
    } catch (e) {
      setErreur((e as Error).message || "Ça n’a pas marché. Réessaie.");
    } finally {
      setOccupe(false);
    }
  }
  let texte = "";
  let detail = "";
  if (m.genre === "question") {
    texte = m.q.phrase || `« ${m.q.objet.titre} » : je le range sur votre étagère ?`;
    detail = `${m.q.objet.emoji} ${m.q.objet.titre}`;
  } else if (m.genre === "souvenir") {
    texte = m.o.depose ? `J’ai posé « ${m.o.titre} » sur votre étagère.` : `C’est noté sur votre étagère : « ${m.o.titre} ».`;
    detail = `${m.o.emoji} ${m.o.de === "moi" ? "De toi" : `De ${prenom}`}`;
  } else {
    texte = `« ${m.texte} »`;
    detail = "Sur votre conversation";
  }
  return (
    <section className={`md-moment ${m.genre}`} data-moment={m.genre} aria-label={`${qui} : ${texte}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="md-qui" src={image} alt="" draggable={false} />
      <div className="md-corps">
        <small className="md-de">
          {qui} · <span>{detail}</span>
        </small>
        <p className="md-texte">{texte}</p>
        <span className="md-actions">
          {m.genre === "question" && (
            <>
              <button type="button" className="md-oui" disabled={occupe} onClick={() => void repondre(true)}>
                ✓ Range-le
              </button>
              <button type="button" className="md-non" disabled={occupe} onClick={() => void repondre(false)}>
                Non
              </button>
            </>
          )}
          {m.genre === "souvenir" && (
            <button type="button" className="md-voir" onClick={onEtagere}>
              Voir votre étagère
            </button>
          )}
        </span>
        {erreur && (
          <p className="md-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
      {m.genre !== "question" && (
        <button type="button" className="md-fermer" aria-label="Fermer" onClick={fermer}>
          ×
        </button>
      )}
    </section>
  );
}

export const STYLES_MOMENT = `
.md-moment{position:relative;flex:none;display:flex;align-items:flex-start;gap:10px;margin:0 0 8px;padding:10px 34px 10px 10px;border-radius:20px;background:#FFF4E6;color:#2A1A10;box-shadow:0 14px 30px -14px rgba(0,0,0,.7);animation:md-entre .5s cubic-bezier(.2,.9,.3,1.2) both}
.md-moment.question{box-shadow:0 0 0 2px #F2C46B,0 14px 30px -14px rgba(0,0,0,.7)}
.md-qui{flex:none;width:44px;height:44px;border-radius:14px;object-fit:cover;object-position:50% 18%;background:#EADBC8}
.md-corps{display:flex;flex-direction:column;gap:4px;min-width:0}
.md-de{font-size:12px;font-weight:700;color:#7A5A44}
.md-de span{font-weight:600}
.md-texte{margin:0;font-weight:800;font-size:15px;line-height:1.3;letter-spacing:-.01em}
.md-actions{display:flex;gap:6px;flex-wrap:wrap}
.md-actions:empty{display:none}
.md-actions button{min-height:36px;padding:0 14px;border-radius:999px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.md-oui{border:0;background:#FF2E9A;color:#12060F}
.md-non,.md-voir{border:1.5px solid #7A5A44;background:transparent;color:#2A1A10}
.md-actions button:disabled{opacity:.5}
.md-erreur{margin:0;font-size:12.5px;color:#B3261E}
.md-fermer{position:absolute;top:6px;right:6px;width:28px;height:28px;border:0;border-radius:999px;background:rgba(42,26,16,.08);color:#2A1A10;font:inherit;font-size:18px;line-height:1;cursor:pointer}
@keyframes md-entre{from{opacity:0;transform:translateY(-8px) scale(.98)}}
@media (prefers-reduced-motion:reduce){.md-moment{animation:none}}
`;
