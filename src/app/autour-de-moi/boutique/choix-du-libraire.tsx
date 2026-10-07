"use client";

// 📚🎙️ LE CHOIX DE TA LIBRAIRE — un livre, présenté en grand, avec sa voix.
//
// « La libraire peut mettre un petit message vocal si elle en a envie depuis
// son admin, mais je ne la vois pas apparaître […] Lorsque je clique sur un
// livre, j'ai comme sur la photo 1 la présentation du livre, le vocal et les
// CTA. »
//
// SA MAQUETTE, DE HAUT EN BAS :
//   · « Le choix de ta libraire », et l'envie qu'on a dite (« Frissonner ») ;
//   · le livre, debout sur sa table, chez elle, son fantôme à côté ;
//   · « Voici son choix pour toi. », le titre, l'auteur, le rayon, le prix ;
//   · « Pourquoi je l'ai choisi · 15 s » : son mot, à SA voix, et la phrase ;
//   · « Demander à le mettre de côté » (WhatsApp), « Garder dans Ma maison »,
//     « En parler dans Ensemble ».
//
// RIEN N'Y EST INVENTÉ. Pas de voix tant qu'elle n'a rien enregistré : le
// lecteur n'apparaît que si `voix` existe, et la phrase sous le lecteur est la
// sienne (`voixTexte`, ou la ligne qu'elle a écrite). Pas de photo d'elle non
// plus : c'est son fantôme qui parle pour elle, comme partout ailleurs.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ArticleCatalogue, CarteAutour } from "@/lib/direct/apercu-habitant";
import { tenueDu } from "@/lib/direct/double-metiers";
import { commentPrevenir, numeroDeFiction } from "@/lib/direct/prevenir";
import { abonnerPiecesGardees, basculerPieceGardee, chargerPiecesGardees, piecesGardeesVides } from "@/lib/direct/pieces-gardees";
import { monPrenom } from "@/lib/direct/salons";

/** « Titre — Auteur » : les deux morceaux, quand elle les a écrits ainsi. */
function titreEtAuteur(nom: string): { titre: string; auteur?: string } {
  const m = /^(.+?)\s+[—–-]\s+(.+)$/.exec(nom);
  return m ? { titre: m[1].trim(), auteur: m[2].trim() } : { titre: nom };
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Les barres de l'onde : un dessin fixe, pas une analyse du son. */
const ONDE = [6, 10, 16, 9, 22, 14, 26, 18, 12, 24, 30, 20, 14, 26, 18, 10, 22, 28, 16, 12, 20, 14, 8, 18, 24, 12, 16, 10, 6, 12];

export function ChoixDuLibraire({
  c,
  livre,
  envie,
  pourToi = false,
  onFermer,
  onEnParler,
  portail,
}: {
  c: CarteAutour;
  livre: ArticleCatalogue;
  /** « Frissonner » : l'envie dite à « Ton prochain livre », s'il y en a une. */
  envie?: string;
  /** Vrai quand c'est un conseil, après les questions : « Voici son choix pour toi. » */
  pourToi?: boolean;
  onFermer: () => void;
  /** « En parler dans Ensemble » — absent, le bouton ne s'affiche pas. */
  onEnParler?: () => void;
  portail?: HTMLElement | null;
}) {
  const { titre, auteur } = titreEtAuteur(livre.nom);
  const prenom = c.voix?.prenom?.trim();
  const qui = prenom || "ta librairie";
  const tenue = tenueDu(c);
  const decor = tenue?.decor || c.photoAccueil || c.photo || c.sesPhotos?.[0]?.src || "";
  const fantome = tenue?.enPied ? `${tenue.enPied}repos.webp` : "/direct/fantomes/hote-libraire.png";
  const visage = tenue?.enPied ? `${tenue.enPied}visage.webp` : "/clikme-fantome.png";
  const phrase = livre.voixTexte || livre.detail;

  // ═══ SA VOIX ═══
  const son = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  const [ou, setOu] = useState(0);
  const [duree, setDuree] = useState(livre.voixSecondes ?? 0);
  const lire = () => {
    const a = son.current;
    if (!a) return;
    if (joue) {
      a.pause();
      setJoue(false);
      return;
    }
    // play() DANS LE GESTE : c'est ce qu'exige l'iPhone.
    void a.play().then(() => setJoue(true)).catch(() => setJoue(false));
  };

  // ═══ ÉCHAP REFERME, ET LA PAGE DERRIÈRE NE DÉFILE PAS ═══
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
    };
  }, [onFermer]);

  // ═══ LE METTRE DE CÔTÉ — WhatsApp, le message déjà écrit (voir `prevenir.ts`) ═══
  const [deCote, setDeCote] = useState<{ texte: string; reel: boolean } | null>(null);
  const mettreDeCote = () => {
    const tel = c.telephone;
    const m = commentPrevenir({
      telephone: tel || numeroDeFiction(c.id),
      quoi: `« ${livre.nom} »${livre.prix ? ` (${livre.prix})` : ""}`,
      prenom: monPrenom() || undefined,
      quand: "Pouvez-vous me le mettre de côté ? Je passe le chercher dans les jours qui viennent",
    });
    // UNE LIBRAIRIE INVENTÉE N'A PAS DE NUMÉRO : WhatsApp s'ouvre quand même,
    // le message prêt, et l'on choisit à qui l'envoyer.
    window.open(tel ? m.whatsapp : `https://wa.me/?text=${encodeURIComponent(m.texte)}`, "_blank", "noopener");
    setDeCote({ texte: m.texte, reel: Boolean(tel) });
  };

  // ═══ LE GARDER DANS MA MAISON — la poche des pièces gardées ═══
  const gardees = useSyncExternalStore(abonnerPiecesGardees, chargerPiecesGardees, piecesGardeesVides);
  const garde = gardees.some((p) => p.carte === c.id && p.piece === livre.id);
  const garder = () =>
    basculerPieceGardee({ carte: c.id, lieu: c.nom, piece: livre.id, nom: livre.nom, prix: livre.prix, image: livre.photo, rendu: false, note: 0 });

  const [couvRatee, setCouvRatee] = useState(false);

  const ecran = (
    <div className="chx" role="dialog" aria-modal="true" aria-label={`Le choix de ${qui} : ${titre}`}>
      <StylesChoix />
      <header className="chx-haut">
        <button type="button" className="chx-retour" onClick={onFermer} aria-label="Revenir">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <h1>Le choix de {qui}</h1>
        <span />
      </header>
      {envie && (
        <p className="chx-envie">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clikme-fantome.png" alt="" /> Ton envie · {envie}
        </p>
      )}

      {/* ═══ LE LIVRE, DEBOUT SUR SA TABLE ═══ */}
      <div className="chx-scene" style={decor ? { backgroundImage: `url("${decor}")` } : undefined}>
        <div className="chx-voile" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="chx-fantome"
          src={fantome}
          alt=""
          onError={(e) => {
            const i = e.currentTarget;
            if (!i.src.endsWith("/clikme-fantome.png")) i.src = "/clikme-fantome.png";
          }}
        />
        {livre.photo && !couvRatee ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="chx-couv" src={livre.photo} alt={`Couverture : ${titre}`} onError={() => setCouvRatee(true)} />
        ) : (
          <span className="chx-couv dessinee" aria-hidden="true">
            <b>{titre}</b>
            {auteur && <i>{auteur}</i>}
          </span>
        )}
      </div>

      <div className="chx-texte">
        <h2>{pourToi ? "Voici son choix pour toi." : "Son coup de cœur."}</h2>
        <p className="chx-titre">{titre}</p>
        {/* LE RAYON QUAND C'EST UN GENRE (« Roman », « Polar ») — pas « Ses coups de cœur ». */}
        <p className="chx-meta">{[auteur, livre.rayon && !/coup/i.test(livre.rayon) ? livre.rayon : "", livre.prix].filter(Boolean).join(" · ")}</p>
      </div>

      {/* ═══ POURQUOI JE L'AI CHOISI — à sa voix, quand elle l'a enregistré ═══ */}
      {(livre.voix || phrase) && (
        <section className="chx-mot">
          {livre.voix ? (
            <div className="chx-lecteur">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="chx-visage" src={visage} alt="" />
              <div className="chx-lecteur-d">
                <p>
                  Pourquoi je l’ai choisi{duree ? ` · ${Math.round(duree)} s` : ""}
                </p>
                <div className="chx-ligne">
                  <button type="button" className="chx-play" onClick={lire} aria-label={joue ? "Pause" : "Écouter son mot"}>
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
                  <span className={`chx-onde${joue ? " joue" : ""}`} aria-hidden="true">
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
                src={livre.voix}
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
          ) : null}
          {phrase && (
            <>
              <q className="chx-phrase">{phrase}</q>
              <p className="chx-signe">{livre.voix ? `Conseil enregistré par ${prenom || "ta libraire"}` : `Le mot de ${prenom || "ta libraire"}`}</p>
            </>
          )}
        </section>
      )}

      {/* ═══ LES GESTES ═══ */}
      <div className="chx-gestes">
        <button type="button" className="chx-go" onClick={mettreDeCote}>
          Demander à le mettre de côté <s aria-hidden="true">→</s>
        </button>
        {deCote && (
          <p className="chx-prevenu" role="status">
            {deCote.reel
              ? `Le message est prêt dans WhatsApp, chez ${c.nom}. Envoie-le, et le livre t’attend.`
              : `Le message est prêt dans WhatsApp. ${c.nom} est inventée pour la démonstration et n’a pas de numéro : choisis à qui l’envoyer.`}
          </p>
        )}
        <div className="chx-deux">
          <button type="button" className={`chx-second${garde ? " on" : ""}`} onClick={garder} aria-pressed={garde}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
            </svg>
            {garde ? "Gardé dans Ma maison" : "Garder dans Ma maison"}
          </button>
          {onEnParler && (
            <button type="button" className="chx-second" onClick={onEnParler}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5Z" />
              </svg>
              En parler dans Ensemble
            </button>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(ecran, portail ?? document.body);
}

function StylesChoix() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.chx{position:fixed;inset:0;z-index:2600;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;
  background:radial-gradient(120% 60% at 50% 0%,#3A2416 0%,#1A110B 55%,#120C09 100%);color:#FFF4E6;
  padding:calc(10px + env(safe-area-inset-top,0px)) 18px calc(24px + env(safe-area-inset-bottom,0px));
  display:flex;flex-direction:column;gap:14px;animation:chx-entre .35s ease-out both;}
.chx::-webkit-scrollbar{display:none;}
@keyframes chx-entre{from{opacity:0;transform:translateY(18px);}}
.chx-haut{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;}
.chx-haut h1{margin:0;text-align:center;font-family:Georgia,"Times New Roman",serif;font-weight:500;font-size:22px;letter-spacing:.01em;}
.chx-retour{width:40px;height:40px;border:0;background:none;color:#FFF4E6;display:grid;place-items:center;cursor:pointer;}
.chx-retour svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.chx-envie{justify-self:center;align-self:center;display:flex;align-items:center;gap:10px;margin:0;padding:7px 18px;border-radius:999px;
  border:1px solid rgba(245,182,90,.55);background:rgba(245,162,58,.08);color:#F5B65A;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;}
.chx-envie img{width:18px;height:18px;object-fit:contain;}
.chx-scene{position:relative;margin:0 -18px;height:min(64vh,470px);background:#2A1A10 center/cover no-repeat;}
.chx-voile{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(18,12,9,.15) 0%,rgba(18,12,9,0) 40%,rgba(18,12,9,.25) 70%,#1A110B 100%);}
.chx-couv{position:absolute;left:50%;bottom:9%;width:min(46%,210px);transform:translateX(-50%) rotate(-1.5deg);border-radius:3px 6px 6px 3px;
  box-shadow:-10px 18px 30px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06);animation:chx-pose .6s .1s cubic-bezier(.2,.8,.2,1.1) both;}
@keyframes chx-pose{from{opacity:0;transform:translateX(-50%) translateY(30px) rotate(-6deg);}}
.chx-couv.dessinee{aspect-ratio:2/3;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px;text-align:center;
  background:linear-gradient(160deg,#1F3550,#0E1B2C);color:#F3E3C3;font-family:Georgia,serif;}
.chx-couv.dessinee b{font-size:22px;line-height:1.15;font-weight:500;}
.chx-couv.dessinee i{font-size:13px;font-style:normal;opacity:.8;}
.chx-fantome{position:absolute;left:4%;bottom:8%;width:min(34%,150px);filter:drop-shadow(0 12px 18px rgba(0,0,0,.45));
  animation:chx-flotte 3.4s ease-in-out infinite;}
@keyframes chx-flotte{50%{transform:translateY(-6px);}}
.chx-texte{text-align:center;margin-top:-6px;}
.chx-texte h2{margin:0;font-family:Georgia,"Times New Roman",serif;font-weight:500;font-size:clamp(28px,8vw,38px);line-height:1.1;}
.chx-titre{margin:10px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:21px;}
.chx-meta{margin:4px 0 0;font-size:15px;color:#E8D5C2;}
.chx-mot{display:grid;gap:10px;padding:16px;border-radius:22px;background:rgba(255,244,230,.04);border:1px solid rgba(255,244,230,.12);}
.chx-lecteur{display:grid;grid-template-columns:78px 1fr;gap:14px;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,244,230,.12);}
.chx-visage{width:78px;height:78px;border-radius:14px;object-fit:cover;background:#2A1A10;}
.chx-lecteur-d{display:grid;gap:8px;min-width:0;}
.chx-lecteur-d p{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:17px;}
.chx-ligne{display:flex;align-items:center;gap:10px;min-width:0;}
.chx-play{width:50px;height:50px;flex:none;border-radius:50%;border:0;background:#F5B04A;color:#1A110B;display:grid;place-items:center;cursor:pointer;
  box-shadow:0 6px 18px rgba(245,176,74,.35);}
.chx-play svg{width:22px;height:22px;fill:currentColor;stroke:currentColor;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round;}
.chx-onde{flex:1;min-width:0;height:32px;display:flex;align-items:center;gap:2px;overflow:hidden;}
.chx-onde i{flex:1;min-width:2px;max-width:4px;border-radius:2px;background:rgba(255,244,230,.28);}
.chx-onde i.lu{background:#F5B04A;}
.chx-onde.joue i{animation:chx-vibre .9s ease-in-out infinite alternate;}
.chx-onde.joue i:nth-child(3n){animation-delay:.2s;}
.chx-onde.joue i:nth-child(3n+1){animation-delay:.45s;}
@keyframes chx-vibre{to{transform:scaleY(.55);}}
.chx-ligne em{flex:none;font-style:normal;font-size:13px;color:#E8D5C2;font-variant-numeric:tabular-nums;}
.chx-phrase{display:block;text-align:center;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:19px;line-height:1.35;}
.chx-signe{margin:-4px 0 0;text-align:center;font-size:13px;color:#CDB8A2;}
.chx-gestes{display:grid;gap:10px;}
.chx-go{display:flex;align-items:center;justify-content:center;gap:10px;height:58px;border:0;border-radius:18px;cursor:pointer;
  background:linear-gradient(180deg,#F8C062,#F0A53C);color:#1A110B;font-family:Georgia,"Times New Roman",serif;font-size:20px;font-weight:600;
  box-shadow:0 10px 26px rgba(240,165,60,.3);}
.chx-go s{text-decoration:none;}
.chx-prevenu{margin:0;padding:10px 14px;border-radius:14px;font-size:13.5px;background:rgba(245,176,74,.1);border:1px solid rgba(245,176,74,.35);}
.chx-deux{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}
.chx-second{display:flex;align-items:center;justify-content:center;gap:9px;min-height:50px;padding:0 12px;border-radius:16px;cursor:pointer;
  border:1px solid rgba(255,244,230,.35);background:none;color:#FFF4E6;font-family:Georgia,"Times New Roman",serif;font-size:14.5px;line-height:1.2;}
.chx-second svg{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round;}
.chx-second.on{border-color:#F5B04A;color:#F5B04A;}
.chx-second.on svg{fill:currentColor;}
@media (min-width:720px){.chx{padding-left:calc(50% - 300px);padding-right:calc(50% - 300px);}.chx-scene{margin:0;border-radius:24px;overflow:hidden;}}
`,
      }}
    />
  );
}
