"use client";

// 🌟 LA PIÈCE DU JOUR, EN VEDETTE DANS L'ESSAYAGE — comme sur l'application.
//
// « Sur la page commerçant d'un coiffeur, d'un magasin de vêtements, d'une
// onglerie… la pièce du jour apparaît-elle sur l'essayage quand le commerçant
// la met en vedette, comme on la verrait sur l'application ? » — « Oui, fais
// ça. »
//
// ELLE Y ÉTAIT, MAIS COMME UNE AUTRE : la première case de la grille, de la
// taille des autres. Elle a maintenant sa place à elle, en haut de l'onglet :
//   · LA CARTE DU DIRECT, LA MÊME (`CarteSwipe`, face de l'application) : sa
//     photo, « ⚡ Aujourd'hui », son nom, son prix, jusqu'à quand ;
//   · SA VOIX, s'il en a enregistré une à son comptoir — « Pourquoi je l'ai
//     choisie », et la phrase. Léa le promet à l'étape 4 (« entendre votre
//     propre voix lui en parler ») ; elle n'était jouée que chez le libraire ;
//   · « L'ESSAYER SUR MOI », qui ouvre l'atelier sur elle.
//
// RIEN N'Y EST INVENTÉ : pas de lecteur sans voix, pas de phrase qu'il n'a pas
// dite, pas de prix qu'il n'a pas donné. « Aujourd'hui » seulement si elle a
// été publiée aujourd'hui — sinon « En ce moment ». Voir `piece-du-jour.ts`.
import { useEffect, useRef, useState } from "react";
import { CarteSwipe, StylesDirect, type CarteDirect } from "@/components/direct/carte-swipe";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { tenueDu } from "@/lib/direct/double-metiers";
import type { PieceDuJour } from "@/lib/direct/piece-du-jour";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
/** Les barres de l'onde : un dessin fixe, pas une analyse du son (comme chez le libraire). */
const ONDE = [6, 10, 16, 9, 22, 14, 26, 18, 12, 24, 30, 20, 14, 26, 18, 10, 22, 28, 16, 12, 20, 14, 8, 18, 24, 12];
/** Au-delà, l'appui sur le bandeau de l'accueil est oublié : on n'y ramène pas à chaque visite de l'onglet. */
const VISE_VALABLE_MS = 8000;

export function PieceDuJourEnVedette({
  c,
  jour,
  titre,
  choisie,
  onEssayer,
  vise,
}: {
  c: CarteAutour;
  jour: PieceDuJour;
  /** « La pièce du jour », « La coupe du jour »… — les mots du métier. */
  titre: string;
  /** « choisie » (une pièce, une coupe) ou « choisi » (un bouquet). */
  choisie: string;
  onEssayer: () => void;
  /** L'instant où l'on a touché « En ce moment » sur l'accueil : l'encart vient alors à l'écran. */
  vise?: number;
}) {
  const a = jour.article;
  const aujourdhui = jour.quand === "Aujourd’hui";
  /* LA CARTE DU DIRECT, AVEC CE QU'IL A PUBLIÉ — rien de plus. */
  const carte: CarteDirect = {
    photo: a.photo,
    nom: c.nom,
    metier: c.metier,
    ville: c.ville,
    ...(c.distance ? { distance: c.distance } : {}),
    reste: jour.quand,
    icone: "✨",
    quoi: a.nom,
    ...(jour.jusqua ? { lignes: [jour.jusqua.charAt(0).toUpperCase() + jour.jusqua.slice(1)] } : {}),
    ...(a.prix ? { prix: a.prix } : {}),
  };
  const tenue = tenueDu(c);
  const visage = tenue?.enPied ? `${tenue.enPied}visage.webp` : "/clikme-fantome.png";
  const qui = c.voix?.prenom?.trim() || c.nom;
  const phrase = a.voixTexte || a.detail;

  // ═══ SA VOIX ═══ — le même lecteur que « Le choix de ta libraire ».
  const son = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  const [ou, setOu] = useState(0);
  const [duree, setDuree] = useState(a.voixSecondes ?? 0);
  const lire = () => {
    const s = son.current;
    if (!s) return;
    if (joue) {
      s.pause();
      setJoue(false);
      return;
    }
    // play() DANS LE GESTE : c'est ce qu'exige l'iPhone.
    void s.play().then(() => setJoue(true)).catch(() => setJoue(false));
  };

  /* ═══ VENU DU BANDEAU « EN CE MOMENT » ═══ On ouvre l'onglet sur elle : elle
     vient sous les yeux, et la carte s'allume une fois. */
  const ref = useRef<HTMLElement | null>(null);
  const [allumee, setAllumee] = useState(false);
  useEffect(() => {
    if (!vise || Date.now() - vise > VISE_VALABLE_MS) return;
    const t1 = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setAllumee(true);
    }, 450);
    const t2 = window.setTimeout(() => setAllumee(false), 3200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [vise]);

  return (
    <section ref={ref} id="piece-du-jour" className={`pj${allumee ? " allumee" : ""}`} aria-label={`${titre} : ${a.nom}`}>
      <StylesDirect />
      <StylesPieceDuJour />
      {/* TROIS MORCEAUX, DEUX MISES EN PAGE (voir la feuille) : sur un
          ordinateur, la carte à gauche et le reste à droite ; sur un
          téléphone, le titre, la carte, puis le bouton juste dessous — il
          tombait sous l'écran, derrière la voix. */}
      <header className="pj-tete">
        <p className="pj-k">
          <span aria-hidden="true">🌟</span> {aujourdhui ? titre : "En ce moment"}
        </p>
        <h3 className="pj-h">{aujourdhui ? `Mise en avant aujourd’hui par ${c.nom}` : `Mise en avant par ${c.nom}`}</h3>
      </header>
      <div className="pj-carte">
        <CarteSwipe carte={carte} variante="seconde" className="pj-c" />
      </div>
      <div className="pj-cote">

        {/* ═══ POURQUOI JE L'AI CHOISIE — à sa voix, quand il l'a enregistré ═══ */}
        {a.voix && (
          <div className="pj-lecteur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pj-visage" src={visage} alt="" />
            <div className="pj-lecteur-d">
              <p>
                Pourquoi je l’ai {choisie}
                {duree ? ` · ${Math.round(duree)} s` : ""}
              </p>
              <div className="pj-ligne">
                <button type="button" className="pj-play" onClick={lire} aria-label={joue ? "Pause" : "Écouter son mot"}>
                  {joue ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14M16 5v14" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                  )}
                </button>
                <span className={`pj-onde${joue ? " joue" : ""}`} aria-hidden="true">
                  {ONDE.map((h, i) => (
                    <i key={i} className={duree && i / ONDE.length < ou / duree ? "lu" : ""} style={{ height: h }} />
                  ))}
                </span>
                <em>
                  {mmss(ou)} / {mmss(duree)}
                </em>
              </div>
            </div>
            <audio
              ref={son}
              src={a.voix}
              preload="metadata"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) setDuree(d);
              }}
              onTimeUpdate={(e) => setOu(e.currentTarget.currentTime)}
              onEnded={() => {
                setJoue(false);
                setOu(0);
              }}
            />
          </div>
        )}
        {phrase && (
          <figure className="pj-mot">
            <q>{phrase}</q>
            <figcaption>— {qui}</figcaption>
          </figure>
        )}

        <button type="button" className="pj-go" onClick={onEssayer}>
          <span aria-hidden="true">✨</span> L’essayer sur moi <s aria-hidden="true">→</s>
        </button>
      </div>
    </section>
  );
}

function StylesPieceDuJour() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.pj{position:relative;margin:22px 0 4px;display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);
  grid-template-rows:1fr auto auto 1fr;grid-template-areas:"carte ." "carte tete" "carte cote" "carte .";gap:12px 24px;
  scroll-margin-top:84px;animation:pjMonte .6s cubic-bezier(.16,1,.3,1) both;}
.pj-tete{grid-area:tete;display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0;}
.pj-carte{grid-area:carte;position:relative;align-self:center;}
.pj-carte::before{content:"";position:absolute;inset:-18px;z-index:-1;border-radius:40px;pointer-events:none;
  background:radial-gradient(60% 55% at 50% 50%,rgba(255,46,154,.32),transparent 72%);}
.pj .pj-c{margin:0 auto;}
/* LA PHOTO SUR TROIS QUARTS DE LA CARTE : la carte calcule sa part pour un
   écran de téléphone, et ici elle est plus trapue — voir partDeLaPhoto. */
.pj .pj-c.mesuree{--cd-photo-h:74% !important;}
.pj.allumee .pj-c{animation:pjAllume 1.1s ease 2;}
.pj-cote{grid-area:cote;display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0;}
.pj-k{margin:0;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;
  font-size:11.5px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#fff;
  background:linear-gradient(90deg,#FF4FB0,#FF2E9A);box-shadow:0 8px 20px -8px rgba(255,46,154,.7);}
.pj-h{margin:0;font-family:var(--font-clikme),sans-serif;font-size:clamp(19px,2.2vw,24px);font-weight:800;line-height:1.2;
  letter-spacing:-.02em;color:#FFF4E6;}
.pj-lecteur{display:flex;align-items:center;gap:10px;width:100%;max-width:440px;padding:10px 12px;border-radius:18px;
  background:rgba(255,244,230,.07);border:1px solid rgba(255,196,140,.18);}
.pj-visage{flex:none;width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#2A1F1B;
  border:2px solid #FF4FB0;}
.pj-lecteur-d{flex:1;min-width:0;}
.pj-lecteur-d p{margin:0 0 4px;font-size:13px;font-weight:800;color:#FFC97A;}
.pj-ligne{display:flex;align-items:center;gap:9px;}
.pj-play{flex:none;width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;
  background:#FF2E9A;color:#fff;box-shadow:0 6px 16px -6px rgba(255,46,154,.8);}
.pj-play svg{width:17px;height:17px;fill:currentColor;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;}
.pj-onde{flex:1;min-width:0;display:flex;align-items:center;gap:2px;height:30px;overflow:hidden;}
.pj-onde i{flex:1;min-width:2px;max-width:4px;border-radius:2px;background:rgba(255,244,230,.28);}
.pj-onde i.lu{background:#FF4FB0;}
.pj-onde.joue i:not(.lu){animation:pjOnde 1.2s ease-in-out infinite;}
.pj-ligne em{flex:none;font-style:normal;font-size:11.5px;font-variant-numeric:tabular-nums;color:#CDB8A4;}
.pj-mot{margin:0;max-width:440px;}
.pj-mot q{display:block;font-size:15px;line-height:1.45;font-style:italic;color:#FFF4E6;}
.pj-mot figcaption{margin-top:4px;font-size:12.5px;font-weight:700;color:#CDB8A4;}
.pj-go{display:inline-flex;align-items:center;gap:10px;margin-top:4px;padding:14px 22px;border:0;border-radius:999px;cursor:pointer;
  font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:17px;color:#fff;
  background:linear-gradient(135deg,#FF4FB0,#FF2E9A 60%,#E0187F);box-shadow:0 16px 34px -14px rgba(255,46,154,.8);
  transition:transform .2s cubic-bezier(.34,1.4,.64,1);}
.pj-go:active{transform:scale(.97);}
.pj-go s{text-decoration:none;font-size:20px;}
@keyframes pjMonte{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pjAllume{0%,100%{box-shadow:0 0 0 0 rgba(255,46,154,0)}50%{box-shadow:0 0 0 6px rgba(255,46,154,.55),0 0 40px rgba(255,46,154,.5)}}
@keyframes pjOnde{0%,100%{opacity:.5}50%{opacity:1}}
/* SUR UN TÉLÉPHONE : la carte, puis sa voix et le bouton, sur toute la largeur. */
@media (max-width:699px){
  .pj{grid-template-columns:1fr;grid-template-rows:auto;grid-template-areas:"tete" "carte" "cote";gap:12px;margin-top:18px;}
  .pj-tete{gap:7px;}
  .pj .pj-c{max-width:330px;}
  .pj-cote{align-items:stretch;}
  .pj-h{font-size:18px;}
  .pj-lecteur,.pj-mot{max-width:none;}
  /* LE BOUTON D'ABORD, sous la carte : c'est le geste. La voix vient après. */
  .pj-go{order:-1;justify-content:center;margin-top:0;}
}
@media (prefers-reduced-motion:reduce){
  .pj,.pj.allumee .pj-c,.pj-onde.joue i{animation:none !important;}
}
`,
      }}
    />
  );
}
