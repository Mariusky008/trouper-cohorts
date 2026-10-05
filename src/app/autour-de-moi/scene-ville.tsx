"use client";

// 🎬 UNE SCÈNE DU FIL DE LA VILLE, EMPILÉE EN CALQUES — voir `scenes-ville.ts`.
//
// « Utiliser une composition par calques, masque ou transformation de
// perspective adaptée à la stack existante. » La stack, c'est le navigateur :
// le décor en bas, l'affiche posée dans sa zone (avec sa perspective), le
// fantôme du commerce devant. Aucune image n'est fabriquée — ni au partage,
// ni quand on fait défiler.
//
// L'ESSAI EST MONTRÉ TEL QUEL. On le cadre, on ne le touche pas : le visage
// reste visible pour une coupe ou des lunettes, toute la tenue pour la mode
// (l'image entière, posée sur son propre flou plutôt que rognée), les mains
// pour l'onglerie.
//
// SI UNE COUCHE NE SE CHARGE PAS, on ne montre pas une scène à trous : la
// carte simple prend la place — l'essai, le nom et la miniature du commerce.
// La publication n'est jamais bloquée par son décor.
//
// LES TEXTES DE LA SCÈNE SONT DU VRAI TEXTE (l'enseigne, les services, les
// étiquettes) : rien n'est incrusté dans une image.
import { useState, type CSSProperties } from "react";
import type { Calque, SceneAmbiance, SceneVille, SceneVitrine } from "@/lib/direct/scenes-ville";

const POSITION: Record<string, string> = {
  visage: "50% 24%",
  mains: "50% 55%",
  "en-pied": "50% 20%",
};

function StyleCalque(c: Calque): CSSProperties {
  return {
    left: `${c.x * 100}%`,
    top: `${c.y * 100}%`,
    height: `${c.h * 100}%`,
    transform: `translate(-50%, -100%)${c.miroir ? " scaleX(-1)" : ""}`,
  };
}

/** L'essai posé sur l'affiche — l'image entière, cadrée selon le métier. */
function Essai({ photo, cadrage, onErreur }: { photo: string; cadrage: string; onErreur: () => void }) {
  if (cadrage === "en-pied") {
    // TOUTE LA TENUE : l'image entière, sur son propre flou. Rogner un
    // portrait en pied, c'est couper les chaussures ou la tête.
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="scv-flou" src={photo} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="scv-essai entier" src={photo} alt="" onError={onErreur} />
      </>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="scv-essai" src={photo} alt="" style={{ objectPosition: POSITION[cadrage] ?? "50% 30%" }} onError={onErreur} />
  );
}

function Vitrine({ s, photo, onErreur }: { s: SceneVitrine; photo: string; onErreur: () => void }) {
  const a = s.affiche;
  const styleAffiche: CSSProperties = {
    left: `${a.x * 100}%`,
    top: `${a.y * 100}%`,
    width: `${a.w * 100}%`,
    height: `${a.h * 100}%`,
    ...(a.pivot ? { transform: `perspective(70cqw) rotateY(${a.pivot}deg)` } : {}),
  };
  return (
    <div className="scv scv-vitrine" role="img" aria-label={`L'essai, en affiche dans la vitrine${s.enseigne ? ` — ${s.enseigne}` : ""}`}>
      {s.decor ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="scv-decor" src={s.decor} alt="" onError={onErreur} />
      ) : (
        <div className="scv-devanture" aria-hidden="true">
          <div className="scv-mur" />
          <div className="scv-facade" />
          <div className="scv-enseigne">
            <b>{s.enseigne}</b>
            <small>{s.sousTitre}</small>
          </div>
          <div className="scv-spots" />
          <div className="scv-baie">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.interieur && <img src={s.interieur} alt="" onError={onErreur} />}
          </div>
          <div className="scv-porte">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.interieur && <img src={s.interieur} alt="" />}
            <i />
          </div>
          <div className="scv-pilier">
            {s.services.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <div className="scv-seuil" />
          <div className="scv-trottoir" />
        </div>
      )}
      <div className={`scv-affiche${a.pivot ? " pivote" : ""}`} style={styleAffiche}>
        <Essai photo={photo} cadrage={a.cadrage} onErreur={onErreur} />
        {a.mot && <span className="scv-mot">{a.mot} ♡</span>}
        <span className="scv-badge">✨ Essai virtuel</span>
        <i className="scv-reflet" aria-hidden="true" />
      </div>
      {s.hote && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="scv-calque" src={s.hote.src} alt="" aria-hidden="true" style={StyleCalque(s.hote)} />
      )}
    </div>
  );
}

function Ambiance({ s, photo, onErreur }: { s: SceneAmbiance; photo: string; onErreur: () => void }) {
  return (
    <div className="scv scv-photo scv-ambiance">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="scv-plein" src={photo} alt="" onError={onErreur} />
      {s.fantomes.map((f) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={f.src} className="scv-calque" src={f.src} alt="" aria-hidden="true" style={StyleCalque(f)} />
      ))}
      {s.fantomes.length > 0 && <span className="scv-coin">✨ Ambiance illustrée</span>}
    </div>
  );
}

/**
 * LA SCÈNE D'UNE PUBLICATION. `photo` : l'essai (vitrine) ou la photo du lieu
 * (ambiance). `repli` : ce qu'il faut pour la carte simple.
 */
export function SceneDuFil({
  scene,
  photo,
  repli,
}: {
  scene: SceneVille;
  photo: string;
  repli: { commerce?: string; miniature?: string; essai: boolean };
}) {
  const [cassee, setCassee] = useState(false);
  const casser = () => setCassee(true);
  if (cassee) return <CarteSimple photo={photo} {...repli} />;
  return (
    <>
      <StylesScene />
      {scene.rendu === "vitrine" ? <Vitrine s={scene} photo={photo} onErreur={casser} /> : <Ambiance s={scene} photo={photo} onErreur={casser} />}
    </>
  );
}

/**
 * LA CARTE SIMPLE — « si l'insertion ne fonctionne pas correctement, afficher
 * l'essai dans une carte simple avec le nom et la miniature du commerce ».
 * Elle sert aussi aux essais d'un métier sans vitrine.
 */
export function CarteSimple({ photo, commerce, miniature, essai }: { photo: string; commerce?: string; miniature?: string; essai: boolean }) {
  const [sansPhoto, setSansPhoto] = useState(false);
  return (
    <>
      <StylesScene />
      <div className="scv-simple">
        {!sansPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="scv-plein" src={photo} alt="" onError={() => setSansPhoto(true)} />
        )}
        {essai && <span className="scv-badge bas">✨ Essai virtuel</span>}
        {commerce && (
          <span className="scv-chez">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {miniature && <img src={miniature} alt="" />}
            {commerce}
          </span>
        )}
      </div>
    </>
  );
}

function StylesScene() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.scv{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden;border-radius:18px;background:#1a1411;container-type:inline-size;isolation:isolate;}
.scv-photo{aspect-ratio:4/3;}
.scv-decor,.scv-plein{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.scv-calque{position:absolute;width:auto;z-index:6;pointer-events:none;filter:drop-shadow(0 1.6cqw 1.4cqw rgba(0,0,0,.55));}

.scv-devanture{position:absolute;inset:0;}
.scv-mur{position:absolute;inset:0;
  background:
    repeating-linear-gradient(180deg,rgba(60,45,30,.16) 0 .25cqw,transparent .25cqw 7.5cqw),
    radial-gradient(120% 80% at 50% 0%,rgba(255,226,180,.35),transparent 60%),
    linear-gradient(180deg,#d8cab2 0%,#c7b598 55%,#a8977d 100%);}
.scv-facade{position:absolute;left:3.5%;right:3.5%;top:0;bottom:8%;
  background:linear-gradient(180deg,#1d1814 0%,#120f0c 70%,#0c0a08 100%);
  box-shadow:inset 0 0 0 .45cqw #2c241d,0 1.4cqw 3cqw rgba(0,0,0,.45);}
.scv-enseigne{position:absolute;left:3.5%;right:3.5%;top:0;height:21%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4cqw;
  border-bottom:.35cqw solid #3a2f24;text-align:center;padding:0 4cqw;}
.scv-enseigne b{font-family:var(--fd),"Playfair Display",Georgia,"Times New Roman",serif;font-weight:700;font-size:6.4cqw;line-height:1;letter-spacing:.02em;
  background:linear-gradient(180deg,#f6dcad 0%,#d9a85f 55%,#b98443 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;filter:drop-shadow(0 .2cqw .3cqw rgba(0,0,0,.6));}
.scv-enseigne small{font-size:1.65cqw;letter-spacing:.32em;text-transform:uppercase;color:#d9bf94;font-weight:600;white-space:nowrap;}
.scv-spots{position:absolute;left:7%;right:20%;top:21%;height:22%;pointer-events:none;z-index:3;
  background:
    radial-gradient(40% 90% at 18% 0%,rgba(255,214,150,.38),transparent 70%),
    radial-gradient(40% 90% at 50% 0%,rgba(255,214,150,.30),transparent 70%),
    radial-gradient(40% 90% at 84% 0%,rgba(255,214,150,.34),transparent 70%);}
.scv-baie,.scv-porte{position:absolute;top:24%;bottom:12%;overflow:hidden;background:#2a1d14;
  box-shadow:inset 0 0 0 .7cqw #0a0807,inset 0 0 3cqw rgba(0,0,0,.6);}
.scv-baie{left:7%;width:47%;}
.scv-porte{left:56.5%;width:22.5%;}
.scv-baie img,.scv-porte img{position:absolute;inset:.7cqw;width:calc(100% - 1.4cqw);height:calc(100% - 1.4cqw);object-fit:cover;
  filter:sepia(.35) saturate(1.15) brightness(.82) contrast(1.05);}
.scv-porte img{object-position:80% 50%;filter:sepia(.4) saturate(1.1) brightness(.7);}
.scv-baie::after,.scv-porte::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,190,110,.22),rgba(40,20,5,.25)),
    linear-gradient(115deg,rgba(255,255,255,.14) 0 14%,transparent 26% 62%,rgba(255,255,255,.07) 70%,transparent 80%);}
.scv-porte i{position:absolute;left:14%;top:46%;width:.7cqw;height:10%;border-radius:1cqw;background:linear-gradient(180deg,#e5c48c,#9c7239);z-index:2;}
.scv-pilier{position:absolute;left:81%;right:4.5%;top:30%;bottom:17%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5cqw;
  border-top:.25cqw solid rgba(217,168,95,.7);border-bottom:.25cqw solid rgba(217,168,95,.7);margin:0 2.5cqw;}
.scv-pilier span{font-size:1.75cqw;letter-spacing:.12em;text-transform:uppercase;color:#ead6b4;font-weight:600;text-align:center;line-height:1.15;}
.scv-seuil{position:absolute;left:3.5%;right:3.5%;bottom:8%;height:4%;background:linear-gradient(180deg,#3a3129,#211b16);}
.scv-trottoir{position:absolute;left:0;right:0;bottom:0;height:8%;
  background:repeating-linear-gradient(90deg,rgba(0,0,0,.18) 0 .25cqw,transparent .25cqw 9cqw),linear-gradient(180deg,#9e9488,#7d7469);}

.scv-affiche{position:absolute;z-index:4;overflow:hidden;background:#efe4d4;border-radius:.6cqw;
  box-shadow:0 0 0 .35cqw rgba(12,9,7,.85),0 1.2cqw 2.6cqw rgba(0,0,0,.45);transform-origin:50% 50%;}
.scv-affiche.pivote{box-shadow:0 0 0 .5cqw rgba(12,9,7,.9),0 2cqw 4cqw rgba(0,0,0,.55);}
.scv-essai{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.scv-essai.entier{object-fit:contain;}
.scv-flou{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;filter:blur(3.5cqw) saturate(1.1) brightness(.95);}
.scv-affiche::before{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;z-index:1;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(30,16,8,.55));}
.scv-mot{position:absolute;left:6%;right:6%;bottom:22%;z-index:2;font-family:var(--font-main-levee),"Caveat","Segoe Script","Bradley Hand",cursive;
  font-size:4.2cqw;line-height:1;color:#fff8ee;text-shadow:0 .2cqw .8cqw rgba(0,0,0,.55);font-weight:600;}
.scv-badge{position:absolute;left:6%;bottom:6%;z-index:3;display:inline-flex;align-items:center;gap:.6cqw;padding:.9cqw 2.2cqw;border-radius:999px;
  background:#fbdcc8;color:#3a1d10;font-size:2.3cqw;font-weight:700;white-space:nowrap;box-shadow:0 .4cqw 1.2cqw rgba(0,0,0,.25);}
.scv-reflet{position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(118deg,rgba(255,255,255,.16) 0 12%,transparent 24% 66%,rgba(255,255,255,.08) 74%,transparent 84%);}

.scv-coin{position:absolute;right:3%;bottom:4%;z-index:7;display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;
  background:rgba(20,13,9,.72);color:#FFF4E6;font-size:12.5px;font-weight:700;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}

.scv-simple{position:relative;width:100%;aspect-ratio:4/5;max-height:440px;overflow:hidden;border-radius:18px;background:#241A15;}
.scv-badge.bas{font-size:12.5px;padding:6px 11px;left:12px;bottom:12px;}
.scv-chez{position:absolute;left:12px;top:12px;z-index:3;display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:999px;
  background:rgba(20,13,9,.74);color:#FFF4E6;font-size:13px;font-weight:700;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
.scv-chez img{width:26px;height:26px;border-radius:50%;object-fit:cover;}
@media (prefers-reduced-motion:no-preference){.scv-calque{animation:scvPose .5s ease both;}}
@keyframes scvPose{from{opacity:0;}to{opacity:1;}}
`,
      }}
    />
  );
}
