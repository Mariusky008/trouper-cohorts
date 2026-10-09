"use client";

// 📲 LE DERNIER ACTE — CE QUI LUI REVIENT : les chiffres, et les demandes qui
// arrivent chez elle.
//
// « Étape 5 : les demandes qui arrivent chez elle. » Les salons sont montrés à
// l'étape 2, juste après l'essai (voir `scene-partage.tsx`) ; les remontrer ici
// faisait doublon. Ce dernier écran montre donc ce qui en SORT et arrive sur
// son téléphone : « Vous me gardez la robe pour samedi ? Taille 38 ».
//
// L'ÉCRAN SUIT LA VOIX, PHRASE PAR PHRASE (`n`, l'indice de la phrase dite) :
//   · chaque chiffre fait monter son compteur, de zéro au nombre dit ;
//   · le chiffre qui est une demande (`demande` dans `geste-du-jour`) fait
//     arriver les messages, un par un, dans « Vos demandes » ; le premier est
//     accepté sous nos yeux.
//
// TOUT EST UN EXEMPLE, ET C'EST ÉCRIT : « Exemple · pas encore vos chiffres ».
// Les prénoms sont ceux des fantômes de l'application, aucun n'est celui d'un
// vrai client.
import { useEffect, useState } from "react";
import type { GesteDuJour } from "@/lib/direct/geste-du-jour";

const F = (nom: string) => `/direct/ensemble/fantome-${nom}.webp`;

type Demande = { qui: string; fantome: string; depuis: string; texte: string; bouton: string; fait?: string };

/** Les demandes de l'exemple, dans les mots du métier — d'où elles viennent, et ce qu'on y répond. */
function demandesDe(g: GesteDuJour, piece: string): Demande[] {
  const camille = { qui: "Camille", fantome: F("casquette-noire") };
  const julie = { qui: "Julie", fantome: F("beret-rouge") };
  const zoe = { qui: "Zoé", fantome: F("bonnet-cligne") };
  const ines = { qui: "Inès", fantome: F("lunettes-rouges") };
  const hugo = { qui: "Hugo", fantome: F("salue") };
  if (g.photoEtVoix) {
    return [
      { ...camille, depuis: "salon « Cette tenue pour samedi ? »", texte: `Vous me gardez ${piece} pour samedi ? Taille 38 🙏`, bouton: "Mettre de côté", fait: "Mise de côté" },
      { ...zoe, depuis: "son salon « Mon essai »", texte: "C’est décidé, je la prends ! Je passe demain 🙂", bouton: "Mettre de côté" },
      { ...ines, depuis: "Le Direct", texte: "Je viens l’essayer à 11 h, vous me la gardez ? 😊", bouton: "Mettre de côté" },
    ];
  }
  if (g.famille === "restauration") {
    return [
      { ...julie, depuis: `salon « ${g.quand}, on y va ? »`, texte: "Une table pour 3 à 12 h 30, c’est possible ?", bouton: "Confirmer", fait: "Table réservée" },
      { ...zoe, depuis: "Le Direct", texte: "On sera 2 ce soir, vers 20 h 🙂", bouton: "Confirmer" },
      { ...hugo, depuis: "Le Direct", texte: "Il en reste pour 13 h ?", bouton: "Répondre" },
    ];
  }
  if (g.famille === "rdv") {
    return [
      { ...julie, depuis: "salon « Un créneau aujourd’hui ? »", texte: "Je prends le créneau de 15 h !", bouton: "Confirmer", fait: "15 h réservé" },
      { ...zoe, depuis: "Le Direct", texte: "Vous avez de la place demain matin ?", bouton: "Répondre" },
      { ...ines, depuis: "Le Direct", texte: "Je peux venir avec une amie ?", bouton: "Répondre" },
    ];
  }
  if (g.famille === "librairie") {
    return [
      { ...julie, depuis: "salon « Club de lecture »", texte: "Vous me le mettez de côté ? Je passe samedi 📚", bouton: "Mettre de côté", fait: "Mis de côté" },
      { ...zoe, depuis: "Le Direct", texte: "Je le prends en grand format !", bouton: "Mettre de côté" },
      { ...ines, depuis: "Le Direct", texte: "Vous avez le précédent du même auteur ?", bouton: "Répondre" },
    ];
  }
  return [
    { ...julie, depuis: "salon « Tu as vu ça ? »", texte: "Vous m’en gardez un ? Je passe à midi", bouton: "Mettre de côté", fait: "Mis de côté" },
    { ...zoe, depuis: "Le Direct", texte: "C’est encore dispo ce soir ?", bouton: "Répondre" },
    { ...ines, depuis: "Le Direct", texte: "Je passe demain matin 😊", bouton: "Mettre de côté" },
  ];
}

/** Un nombre qui monte de zéro jusqu'à lui quand on le dit. */
function Compteur({ cible, actif }: { cible: number; actif: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!actif) return;
    const debut = performance.now();
    let id = 0;
    const pas = (t: number) => {
      const k = Math.min(1, (t - debut) / 1300);
      setV(Math.round(cible * (1 - Math.pow(1 - k, 3))));
      if (k < 1) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [actif, cible]);
  return <>{(actif ? v : 0).toLocaleString("fr-FR")}</>;
}

export function SceneDemandes({
  g,
  n,
  ouverture,
  photo,
  exemple,
  piece,
  salons,
}: {
  g: GesteDuJour;
  /** L'indice de la phrase que la voix dit : −1 pour l'ouverture. */
  n: number;
  ouverture: string;
  /** La pièce essayée (boutique de vêtements), sinon la photo de son annonce. */
  photo: string;
  /** La photo est celle de l'exemple, pas la sienne. */
  exemple?: boolean;
  /** Le nom de la pièce, pour la première demande : « Robe fleurie marine ». */
  piece?: string;
  /** Les salons de l'étape 2 : leur nombre, rappelé ici. Absent quand l'étape 2 ne les a pas montrés. */
  salons?: number;
}) {
  const chiffres = g.retours.filter((r) => r.nombre);
  const fin = g.retours.find((r) => !r.nombre)?.quoi;
  /* LES DEMANDES ARRIVENT SUR LE CHIFFRE QUI EN EST UNE — le dernier, sinon. */
  const iDemande = Math.max(0, chiffres.findIndex((r) => r.demande) >= 0 ? chiffres.findIndex((r) => r.demande) : chiffres.length - 1);
  const arrivent = n >= iDemande;
  const demandes = demandesDe(g, piece ? `« ${piece} »` : "la pièce du jour");
  const essai = Boolean(g.photoEtVoix);

  /* LA PREMIÈRE EST ACCEPTÉE SOUS NOS YEUX, une fois les trois arrivées. */
  const [acceptee, setAcceptee] = useState(false);
  useEffect(() => {
    if (!arrivent) return;
    const t = window.setTimeout(() => setAcceptee(true), 2600);
    return () => window.clearTimeout(t);
  }, [arrivent]);

  return (
    <div className="dtour-ov sd-ov">
      <div className="sd">
        <div className="sd-tete">
          <span className="sd-k">Exemple · pas encore vos chiffres</span>
          <h3 className="sd-h">{ouverture}</h3>
        </div>

        <div className="sd-scene">
          {/* ═══ SA PIÈCE ═══ */}
          <div className="sd-gauche">
            <div className="sd-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" />
              <span className="sd-badge">{essai ? "Essayée virtuellement" : g.extrait.titre}</span>
              {exemple && <span className="sd-ex">Exemple</span>}
            </div>
            {salons ? <span className={`sd-salons${arrivent ? " on" : ""}`}>💬 {salons} salons en parlent</span> : null}
          </div>

          {/* ═══ SON TÉLÉPHONE : LES DEMANDES QUI ARRIVENT ═══ */}
          <div className={`sd-tel${arrivent ? " on" : ""}`}>
            <div className="sd-tel-tete">
              <b>Vos demandes</b>
              <span>
                arrivées par ClikMe <i>{arrivent ? demandes.length : 0}</i>
              </span>
            </div>
            {arrivent ? (
              demandes.map((d, i) => (
                <div key={d.qui} className="sd-dem" style={{ ["--i" as string]: i }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.fantome} alt="" />
                  <div>
                    <small>
                      <b>{d.qui}</b> · {d.depuis}
                    </small>
                    <p>{d.texte}</p>
                    <span className={`sd-btn${i === 0 && acceptee && d.fait ? " fait" : ""}`}>
                      {i === 0 && acceptee && d.fait ? `✓ ${d.fait}` : d.bouton}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="sd-attente">Elles arrivent ici, sur votre téléphone.</p>
            )}
          </div>
        </div>

        {/* ═══ LES COMPTEURS ═══ */}
        <div className="sd-compteurs" style={{ ["--nb" as string]: chiffres.length }}>
          {chiffres.map((r, i) => (
            <div key={r.heure} className={`sd-cpt${n >= i ? " on" : ""}${r.demande ? " rose" : ""}`}>
              <span className="sd-cpt-h">
                {r.icone} {r.heure}
              </span>
              <b>
                <Compteur cible={Number(r.nombre.replace(/\D/g, "")) || 0} actif={n >= i} />
              </b>
              <span>{r.quoi}</span>
            </div>
          ))}
        </div>
        {fin && <p className={`sd-fin${arrivent ? " on" : ""}`}>{fin}</p>}
      </div>
      <StylesDemandes />
    </div>
  );
}

function StylesDemandes() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dtour-ov.sd-ov{align-items:flex-start;padding-top:76px;padding-bottom:140px;overflow:hidden;}
.sd{position:relative;width:100%;max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:14px;pointer-events:auto;}
.sd::before{content:"";position:absolute;inset:-60px -40px;z-index:-1;pointer-events:none;
  background:radial-gradient(40% 50% at 60% 45%,rgba(46,158,107,.18),transparent 70%),radial-gradient(35% 45% at 25% 55%,rgba(255,79,160,.16),transparent 70%);}
.sd-tete{text-align:center;animation:sdMonte .5s cubic-bezier(.2,.8,.2,1) both;}
.sd-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#B23A17;
  background:#FDEEE8;border-radius:7px;padding:5px 9px;}
.sd-h{margin:8px auto 0;max-width:640px;font-family:var(--font-clikme),sans-serif;font-size:clamp(20px,2.4vw,28px);font-weight:800;
  line-height:1.15;letter-spacing:-.03em;color:#FFF4E6;text-wrap:balance;}
.sd-scene{display:grid;grid-template-columns:220px minmax(0,1fr);gap:28px;align-items:center;max-width:720px;width:100%;margin:0 auto;}
.sd-gauche{display:flex;flex-direction:column;align-items:center;gap:12px;animation:sdMonte .55s cubic-bezier(.2,.8,.2,1) .1s both;}
.sd-photo{position:relative;width:220px;aspect-ratio:3 / 4;border-radius:22px;overflow:hidden;
  box-shadow:0 0 0 3px rgba(255,248,241,.9),0 30px 70px rgba(0,0,0,.55),0 0 60px rgba(255,79,160,.25);}
.sd-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;}
.sd-badge{position:absolute;left:10px;bottom:10px;padding:6px 11px;border-radius:999px;font-size:12px;font-weight:800;color:#fff;
  background:linear-gradient(90deg,#FF4FA0,#F5A23A);box-shadow:0 6px 18px rgba(255,79,160,.45);}
.sd-ex{position:absolute;right:10px;top:10px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:800;color:#FFF4E6;background:rgba(18,12,9,.7);}
.sd-salons{padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:800;color:#FF8CC8;
  background:rgba(255,79,160,.12);border:1px solid rgba(255,140,200,.35);opacity:.35;transition:opacity .4s ease;}
.sd-salons.on{opacity:1;}

/* ═══ SON TÉLÉPHONE ═══ Un écran de messages, côté commerçant : les demandes
   arrivent une par une, et la première est acceptée. */
.sd-tel{align-self:stretch;display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:26px;
  background:linear-gradient(180deg,#1E1511,#140D0A);border:1px solid rgba(255,196,140,.18);
  box-shadow:0 30px 70px rgba(0,0,0,.5);opacity:.55;transition:opacity .4s ease;animation:sdLeve .55s cubic-bezier(.2,.8,.2,1) .2s both;}
/* Il monte sans toucher à l'opacité : c'est elle qui dit qu'il attend. */
@keyframes sdLeve{from{transform:translateY(12px);}to{transform:none;}}
.sd-tel.on{opacity:1;}
.sd-tel-tete{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:0 4px 4px;border-bottom:1px solid rgba(255,196,140,.12);}
.sd-tel-tete b{font-family:var(--font-clikme),sans-serif;font-size:16px;font-weight:800;color:#FFF4E6;}
.sd-tel-tete span{font-size:11.5px;color:#BFA88F;}
.sd-tel-tete i{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:4px;padding:0 6px;border-radius:999px;
  font-style:normal;font-size:11px;font-weight:800;color:#fff;background:#FF4FA0;}
.sd-attente{margin:auto 0;padding:24px 8px;text-align:center;font-size:13px;color:#8E7A69;}
.sd-dem{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;align-items:start;padding:10px;border-radius:16px;
  background:#FFF8F1;opacity:0;transform:translateY(12px) scale(.96);
  animation:sdArrive .55s cubic-bezier(.34,1.4,.64,1) both;animation-delay:calc(.15s + var(--i) * .7s);}
@keyframes sdArrive{from{opacity:0;transform:translateY(12px) scale(.96);}to{opacity:1;transform:none;}}
.sd-dem img{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#FFE7D6;}
.sd-dem small{display:block;font-size:11px;color:#8E7A69;}
.sd-dem small b{color:#2A1712;}
.sd-dem p{margin:2px 0 0;font-size:13.5px;line-height:1.35;color:#2A1712;}
.sd-btn{display:inline-block;margin-top:6px;padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:800;color:#fff;
  background:#FF4FA0;box-shadow:0 4px 12px rgba(255,79,160,.3);}
.sd-btn.fait{background:#2E9E6B;box-shadow:0 4px 12px rgba(46,158,107,.35);animation:sdFait .5s cubic-bezier(.34,1.5,.64,1);}
@keyframes sdFait{0%{transform:scale(.8);}60%{transform:scale(1.08);}100%{transform:none;}}

/* ═══ LES COMPTEURS ═══ */
.sd-compteurs{display:grid;grid-template-columns:repeat(var(--nb),minmax(0,1fr));gap:12px;max-width:760px;width:100%;margin:2px auto 0;}
.sd-cpt{display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 8px;border-radius:16px;text-align:center;
  background:rgba(255,248,241,.07);border:1px solid rgba(255,196,140,.18);opacity:.35;transition:opacity .4s ease,transform .4s ease,background .4s;}
.sd-cpt.on{opacity:1;transform:translateY(-2px);background:rgba(255,248,241,.11);}
.sd-cpt b{font-family:var(--font-clikme),sans-serif;font-size:clamp(26px,3vw,36px);font-weight:800;line-height:1;color:#FFE2A6;letter-spacing:-.03em;}
.sd-cpt.rose b{color:#FF8CC8;}
.sd-cpt span{font-size:12.5px;color:#E7D6C6;}
.sd-cpt .sd-cpt-h{font-size:11px;font-weight:700;color:#BFA88F;}
.sd-fin{margin:0;text-align:center;font-size:12px;color:#A8927F;opacity:0;transition:opacity .5s ease 2.6s;}
.sd-fin.on{opacity:1;}
@keyframes sdMonte{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
/* ═══ SUR UN TÉLÉPHONE : la pièce et les salons en ligne, ses demandes, les compteurs en bas. ═══ */
@media (max-width:899px){
  .dtour-ov.sd-ov{padding-top:76px;padding-bottom:126px;padding-left:12px;padding-right:12px;}
  .sd{gap:10px;}
  .sd-h{font-size:17px;margin-top:6px;}
  .sd-k{font-size:9.5px;padding:4px 8px;margin-right:64px;}
  .sd-scene{grid-template-columns:1fr;gap:10px;}
  .sd-gauche{flex-direction:row;justify-content:center;gap:12px;}
  .sd-photo{width:84px;border-radius:14px;}
  .sd-badge{left:5px;bottom:5px;font-size:8.5px;padding:3px 6px;}
  .sd-ex{font-size:8.5px;padding:2px 6px;right:5px;top:5px;}
  .sd-salons{font-size:11.5px;}
  .sd-tel{padding:10px;border-radius:20px;gap:7px;}
  .sd-tel-tete b{font-size:14px;}
  .sd-dem{grid-template-columns:28px minmax(0,1fr);gap:7px;padding:8px;border-radius:13px;}
  .sd-dem img{width:28px;height:28px;}
  .sd-dem small{font-size:10px;}
  .sd-dem p{font-size:12px;}
  .sd-btn{font-size:10.5px;padding:3px 9px;margin-top:4px;}
  .sd-compteurs{gap:6px;}
  .sd-cpt{padding:7px 4px;border-radius:12px;}
  .sd-cpt b{font-size:22px;}
  .sd-cpt span{font-size:10px;}
  .sd-cpt .sd-cpt-h{font-size:9.5px;}
  .sd-fin{font-size:10.5px;}
}
@media (prefers-reduced-motion:reduce){
  .sd-dem,.sd-btn.fait,.sd-tete,.sd-gauche{animation:none;opacity:1;transform:none;}
  .sd-tel{animation:none;}
  .sd-cpt,.sd-salons,.sd-tel{transition:none;}
}
`,
      }}
    />
  );
}
