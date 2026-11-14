"use client";

/**
 * 🏠 « MA MAISON » — son onglet, depuis le 14 novembre 2026 (le propriétaire : « mon univers est difficilement accessible
 * sur l'appli, ça mérite peut-être son onglet direct […] les gens doivent y accéder facilement pour découvrir notre
 * univers ») ; le menu : Découvrir · Messages · Ma maison · Autour, sa figurine sur le bouton de « Ma maison ».
 *
 * Aujourd'hui : mon univers en entier (son décor du moment, ma figurine chez elle, les cadeaux posés, la saison) ;
 * « 👀 Comme la voient mes visiteurs » (ma page de visite) ; ses réglages (⚙️, `/univers/monde`) ; « Mon étagère »
 * (`EtagereChezMoi`).
 *
 * 🎬 SES PIÈCES (14 novembre, « chaque pièce entièrement sur l'écran […] deux ou trois gros objets animés ») : quand il en
 * a (aujourd'hui, celles de l'essai « Une pièce entière, vivante », `lib/direct/pieces-vivantes-serveur.ts`), son univers
 * puis ses pièces défilent — on glisse de l'une à l'autre, la vidéo de celle qu'on regarde joue en boucle ; un toucher,
 * on entre en plein écran (`app/univers/piece-vivante.tsx` : ses vedettes, la caméra qui s'approche).
 */
import { useEffect, useRef, useState } from "react";
import { DansLesPieces, useBoucle, type PieceVue } from "@/app/univers/piece-vivante";
import { EtagereChezMoi } from "./etagere";
import { FenetreSurMonUnivers, useMonUnivers } from "./chez-moi";
import { useMesVisites } from "./visites-recues";

/** 🎬 Mes pièces prêtes (chacune entière, vivante) : `/api/direct/mes-pieces`. */
function useMesPieces(actif: boolean): PieceVue[] {
  const [pieces, setPieces] = useState<PieceVue[]>([]);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    fetch("/api/direct/mes-pieces", { cache: "no-store" })
      .then(async (r) => (r.ok ? ((await r.json()) as { pieces?: PieceVue[] }) : null))
      .then((j) => !fini && setPieces(Array.isArray(j?.pieces) ? j.pieces : []))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [actif]);
  return pieces;
}

/** Une pièce dans le défilé : entière, sa vidéo qui joue quand on la regarde ; un toucher, on entre. */
function ApercuPiece({ p, joue, onEntrer }: { p: PieceVue; joue: boolean; onEntrer: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  useBoucle(video, joue);
  return (
    <button type="button" className="mm-piece" data-piece={p.piece} onClick={onEntrer} aria-label={`Entrer dans ${p.nom.toLowerCase()}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.vue} alt="" draggable={false} />
      {p.video && <video ref={video} src={p.video} muted playsInline preload="metadata" />}
      <span className="mm-piece-nom">{p.nom}</span>
      <span className="mm-piece-entrer">▶ Entrer</span>
    </button>
  );
}

export function MaMaison({ actif }: { actif: boolean }) {
  const etat = useMonUnivers(actif);
  const { visites } = useMesVisites(actif);
  const pieces = useMesPieces(actif);
  const [page, setPage] = useState(0);
  const [dedans, setDedans] = useState<number | null>(null);
  const defile = useRef<HTMLDivElement>(null);
  const pret = etat && etat !== "absent" && etat.etape === "decouverte" && etat.decor ? etat : null;
  const fenetre = pret && (
    <FenetreSurMonUnivers etat={pret} souvenirs={visites?.poses} entiere>
      {pret.saison && (
        <span className="cm-saison">
          {pret.saison.emoji} {pret.saison.nom}
        </span>
      )}
    </FenetreSurMonUnivers>
  );
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
          {pieces.length ? (
            // 🎬 mon univers, puis mes pièces : on glisse de l'une à l'autre
            <>
              <div className="mm-defile" ref={defile} onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}>
                <div className="mm-page">{fenetre}</div>
                {pieces.map((p, k) => (
                  <div key={p.piece} className="mm-page">
                    <ApercuPiece p={p} joue={actif && page === k + 1 && dedans === null} onEntrer={() => setDedans(k)} />
                  </div>
                ))}
              </div>
              <div className="mm-points" aria-label={`Page ${page + 1} sur ${pieces.length + 1}`}>
                {[0, ...pieces.map((_, k) => k + 1)].map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={k === page ? "la" : ""}
                    aria-label={k ? pieces[k - 1].nom : "Mon univers"}
                    onClick={() => defile.current?.scrollTo({ left: k * defile.current.clientWidth, behavior: "smooth" })}
                  />
                ))}
                <span>{page ? pieces[page - 1].nom : "Glisse pour visiter tes pièces →"}</span>
              </div>
            </>
          ) : (
            fenetre
          )}
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
      {pret && !pieces.length && <p className="mm-bientot">🏗️ Ta maison va s’agrandir : de nouvelles pièces apparaîtront au fil de tes conversations.</p>}
      {dedans !== null && pieces.length > 0 && <DansLesPieces pieces={pieces} depart={dedans} figurine={pret?.figurine?.assise} onFermer={() => setDedans(null)} />}
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
.mm-defile{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mm-defile::-webkit-scrollbar{display:none}
.mm-page{flex:0 0 100%;min-width:0;scroll-snap-align:center}
.mm-piece{position:relative;display:block;width:100%;aspect-ratio:2/3;padding:0;border:0;border-radius:22px;overflow:hidden;background:#1a0f14;cursor:pointer;box-shadow:0 18px 40px -20px rgba(0,0,0,.8)}
.mm-piece img,.mm-piece video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.mm-piece video{transition:opacity .85s ease}
.mm-piece-nom{position:absolute;left:10px;top:10px;padding:6px 12px;border-radius:999px;background:rgba(20,10,14,.62);color:#FFF4E6;font-weight:900;font-size:14px;backdrop-filter:blur(8px)}
.mm-piece-entrer{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);padding:10px 18px;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:900;font-size:15px;box-shadow:0 8px 20px -8px rgba(255,46,154,.9)}
.mm-points{display:flex;align-items:center;gap:7px;margin-top:-2px}
.mm-points button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.28);cursor:pointer}
.mm-points button.la{background:#FF2E9A}
.mm-points span{margin-left:6px;color:#CDB4C0;font-size:13.5px;font-weight:700}
`;
