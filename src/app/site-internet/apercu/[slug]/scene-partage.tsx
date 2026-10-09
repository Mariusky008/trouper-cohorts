"use client";

// 💬 LE DERNIER ACTE — ce qui lui revient, et surtout CE QU'ON EN DIT.
//
// « Le design de cette dernière étape est vraiment pas terrible, il faut la
// rendre vraiment wow. Et il manque quelque chose de très important : au-delà
// d'avoir essayé virtuellement un vêtement, les gens vont surtout avoir un
// moyen très sympa de partager leur découverte, et c'est ce qui fait toute la
// différence, grâce aux salons de discussion qui s'ouvrent entre amis ou pour
// tous. Imager simplement cette idée : trois salons de discussion privés
// ouverts, où l'on voit des personnes échanger leurs pensées entre amis, et un
// salon public ouvert, idem mais tout le monde. »
//
// L'ÉCRAN SUIT LA VOIX, PHRASE PAR PHRASE (`n`, l'indice de la phrase dite) :
//   · la phrase d'ouverture : sa pièce au centre — essayée, chez une boutique
//     de vêtements ; son annonce, ailleurs ;
//   · chaque chiffre : son compteur monte, de zéro au nombre dit ;
//   · la phrase du partage : le bouton « Partager » s'allume, trois salons
//     privés s'ouvrent à gauche, le salon public à droite, et les messages y
//     arrivent un par un.
//
// TOUT EST UN EXEMPLE, ET C'EST ÉCRIT : « Exemple · pas encore vos
// chiffres », « Exemples de conversations ». Les prénoms sont ceux des
// fantômes de l'application, aucun n'est celui d'un vrai client.
import { useEffect, useState } from "react";
import type { GesteDuJour } from "@/lib/direct/geste-du-jour";

type Message = { qui: string; fantome: string; texte: string };
type Salon = { titre: string; messages: Message[] };

const F = (nom: string) => `/direct/ensemble/fantome-${nom}.webp`;
const CAMILLE = { qui: "Camille", fantome: F("casquette-noire") };
const JULIE = { qui: "Julie", fantome: F("beret-rouge") };
const SAM = { qui: "Sam", fantome: F("bonnet") };
const INES = { qui: "Inès", fantome: F("lunettes-rouges") };
const LEA = { qui: "Léa", fantome: F("echarpe-violette") };
const MAMAN = { qui: "Maman", fantome: F("beret-noir") };
const TOI = { qui: "Toi", fantome: F("casquette-bleue") };
const NORA = { qui: "Nora", fantome: F("echarpe-verte") };
const HUGO = { qui: "Hugo", fantome: F("salue") };
const EMMA = { qui: "Emma", fantome: F("echarpe-violette-cligne") };
const ZOE = { qui: "Zoé", fantome: F("bonnet-cligne") };
const MILA = { qui: "Mila", fantome: F("beret-noir-cligne") };

const m = (p: { qui: string; fantome: string }, texte: string): Message => ({ ...p, texte });

/** Les conversations de l'exemple, dans les mots du métier. */
function salonsDe(g: GesteDuJour): { prives: Salon[]; public: Message[] } {
  if (g.photoEtVoix) {
    return {
      prives: [
        { titre: "Cette tenue pour samedi ?", messages: [m(CAMILLE, "Vous en pensez quoi ?"), m(JULIE, "La couleur te va super bien ! ❤️"), m(SAM, "Avec tes bottines, oui ! 👢")] },
        { titre: "Les copines", messages: [m(INES, "Je passe l’essayer demain 😍"), m(LEA, "Je viens avec toi !")] },
        { titre: "Maman & moi", messages: [m(MAMAN, "Très élégante, ma chérie"), m(TOI, "Je la fais mettre de côté 🙌")] },
      ],
      public: [
        m(NORA, "Je l’ai essayée hier, elle tombe parfaitement"),
        m(HUGO, "Elle existe en bleu ?"),
        m(EMMA, "Le conseil en boutique est adorable 💕"),
        m(ZOE, "Je file la voir !"),
        m(INES, "Elle taille comment ?"),
        m(NORA, "Normalement, j’ai pris ma taille habituelle"),
      ],
    };
  }
  if (g.famille === "restauration") {
    return {
      prives: [
        { titre: `${g.quand}, on y va ?`, messages: [m(CAMILLE, "Regardez ça 😋"), m(JULIE, "Validé, je réserve pour 3 !"), m(SAM, "J’arrive !")] },
        { titre: "Les collègues", messages: [m(INES, "Il a l’air trop bon"), m(LEA, "On y retourne demain ?")] },
        { titre: "Famille", messages: [m(MAMAN, "On y emmène papa dimanche ?"), m(TOI, "Bonne idée ❤️")] },
      ],
      public: [m(NORA, "Je confirme, c’est excellent"), m(HUGO, "Il reste de la place ?"), m(EMMA, "Tout est fait maison 👌"), m(ZOE, "J’y vais ce soir !")],
    };
  }
  if (g.famille === "rdv") {
    return {
      prives: [
        { titre: "Un créneau aujourd’hui ?", messages: [m(CAMILLE, "Il reste une place cet après-midi"), m(JULIE, "Fonce, tu le mérites ✨"), m(SAM, "Envoie une photo après !")] },
        { titre: "Les copines", messages: [m(INES, "Je prends le suivant 😄"), m(LEA, "Top adresse !")] },
        { titre: "Famille", messages: [m(MAMAN, "Je garde les petits, vas-y"), m(TOI, "Merci ❤️")] },
      ],
      public: [m(NORA, "Super accueil, je recommande"), m(HUGO, "Ils prennent sans rendez-vous ?"), m(EMMA, "Résultat parfait 👌"), m(ZOE, "J’y vais samedi !")],
    };
  }
  if (g.famille === "librairie") {
    return {
      prives: [
        { titre: "Club de lecture", messages: [m(CAMILLE, "Vous l’avez lu ?"), m(JULIE, "Pas encore, je le note 📚"), m(SAM, "Je l’ai adoré !")] },
        { titre: "Les copines", messages: [m(INES, "Je l’offre à ma sœur 🎁"), m(LEA, "Bonne idée !")] },
        { titre: "Famille", messages: [m(MAMAN, "Pour les vacances ?"), m(TOI, "Je le fais mettre de côté")] },
      ],
      public: [m(NORA, "Coup de cœur pour moi aussi"), m(HUGO, "Il existe en poche ?"), m(EMMA, "Leurs conseils sont toujours top"), m(ZOE, "Je file le chercher")],
    };
  }
  return {
    prives: [
      { titre: "Tu as vu ça ?", messages: [m(CAMILLE, "Regardez ce qui vient d’arriver 😍"), m(JULIE, "Je passe en prendre !"), m(SAM, "Garde-m’en un !")] },
      { titre: "Les voisines", messages: [m(INES, "Superbe !"), m(LEA, "J’y vais à midi")] },
      { titre: "Famille", messages: [m(MAMAN, "Pour l’anniversaire de mamie ?"), m(TOI, "Parfait ❤️")] },
    ],
    public: [m(NORA, "Toujours parfait, je recommande"), m(HUGO, "Il en reste ?"), m(EMMA, "Accueil adorable 💕"), m(ZOE, "J’arrive !")],
  };
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

function Bulle({ msg, i }: { msg: Message; i: number }) {
  return (
    <div className="sp-msg" style={{ ["--i" as string]: i }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={msg.fantome} alt="" />
      <p>
        <b>{msg.qui}</b>
        {msg.texte}
      </p>
    </div>
  );
}

export function ScenePartage({
  g,
  n,
  ville,
  ouverture,
  photo,
  exemple,
}: {
  g: GesteDuJour;
  /** L'indice de la phrase que la voix dit : −1 pour l'ouverture. */
  n: number;
  ville: string;
  ouverture: string;
  /** La pièce essayée (boutique de vêtements), sinon la photo de son annonce. */
  photo: string;
  /** La photo du centre est celle de l'exemple, pas la sienne. */
  exemple?: boolean;
}) {
  const chiffres = g.retours.filter((r) => r.nombre);
  const fin = g.retours.find((r) => !r.nombre)?.quoi;
  const iPartage = chiffres.length;
  const partage = n >= iPartage;
  const { prives, public: publics } = salonsDe(g);
  const essai = Boolean(g.photoEtVoix);

  return (
    <div className="dtour-ov sp-ov">
      <div className="sp">
        <div className="sp-tete">
          <span className="sp-k">Exemple · pas encore vos chiffres</span>
          <h3 className="sp-h">{ouverture}</h3>
        </div>

        <div className={`sp-scene${partage ? " partage" : ""}`}>
          {/* ═══ TROIS SALONS PRIVÉS ═══ */}
          <div className="sp-prives">
            {prives.map((s, k) => (
              <section key={s.titre} className={`sp-salon prive${partage ? " on" : ""}`} style={{ ["--k" as string]: k }}>
                <header>
                  <span className="sp-cadenas">🔒 Salon privé</span>
                  <b>{s.titre}</b>
                </header>
                {s.messages.map((msg, i) => (
                  <Bulle key={i} msg={msg} i={i} />
                ))}
              </section>
            ))}
          </div>

          {/* ═══ SA PIÈCE, AU CENTRE ═══ */}
          <div className="sp-centre">
            <div className="sp-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" />
              <span className="sp-badge">{essai ? "Essayée virtuellement" : g.extrait.titre}</span>
              {exemple && <span className="sp-ex">Exemple</span>}
              <span className="sp-coeurs" aria-hidden="true">
                <i>❤️</i>
                <i>💗</i>
                <i>❤️</i>
              </span>
            </div>
            <span className="sp-partager">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
              Partager dans ClikMe
            </span>
            {/* LES PARTAGES S'ENVOLENT VERS LES SALONS */}
            <span className="sp-envols" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>

          {/* ═══ LE SALON PUBLIC ═══ */}
          <section className={`sp-salon public${partage ? " on" : ""}`}>
            <header>
              <span className="sp-cadenas pub">🌍 Salon public · {ville}</span>
              <b>Tout le monde en parle</b>
              <span className="sp-foule">
                {publics.slice(0, 5).map((p, k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`${p.qui}-${k}`} src={p.fantome} alt="" />
                ))}
                <em>+ 8</em>
              </span>
            </header>
            {publics.map((msg, i) => (
              <Bulle key={i} msg={msg} i={i} />
            ))}
            {/* ET LA CONVERSATION CONTINUE : quelqu'un est en train d'écrire. */}
            <div className="sp-ecrit" style={{ ["--i" as string]: publics.length }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MILA.fantome} alt="" />
              <span>
                {MILA.qui} écrit <i />
                <i />
                <i />
              </span>
            </div>
          </section>
        </div>

        {/* ═══ LES COMPTEURS ═══ */}
        <div className="sp-compteurs">
          {chiffres.map((r, i) => (
            <div key={r.heure} className={`sp-cpt${n >= i ? " on" : ""}`}>
              <span className="sp-cpt-h">
                {r.icone} {r.heure}
              </span>
              <b>
                <Compteur cible={Number(r.nombre.replace(/\D/g, "")) || 0} actif={n >= i} />
              </b>
              <span>{r.quoi}</span>
            </div>
          ))}
          <div className={`sp-cpt rose${partage ? " on" : ""}`}>
            <span className="sp-cpt-h">💬 en un clic</span>
            <b>
              <Compteur cible={prives.length + 1} actif={partage} />
            </b>
            <span>salons en parlent</span>
          </div>
        </div>
        <p className={`sp-fin${partage ? " on" : ""}`}>
          Exemples de conversations{fin ? ` · ${fin}` : ""}
        </p>
      </div>
      <StylesPartage />
    </div>
  );
}

function StylesPartage() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dtour-ov.sp-ov{align-items:flex-start;padding-top:84px;padding-bottom:140px;overflow:hidden;}
.sp{position:relative;width:100%;max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:14px;pointer-events:auto;}
.sp::before{content:"";position:absolute;inset:-60px -40px;z-index:-1;pointer-events:none;
  background:radial-gradient(40% 50% at 50% 45%,rgba(255,79,160,.22),transparent 70%),radial-gradient(35% 45% at 20% 60%,rgba(245,162,58,.18),transparent 70%);}
.sp-tete{text-align:center;animation:spMonte .5s cubic-bezier(.2,.8,.2,1) both;}
.sp-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#B23A17;
  background:#FDEEE8;border-radius:7px;padding:5px 9px;}
.sp-h{margin:10px auto 0;max-width:640px;font-family:var(--font-clikme),sans-serif;font-size:clamp(20px,2.6vw,30px);font-weight:800;
  line-height:1.15;letter-spacing:-.03em;color:#FFF4E6;text-wrap:balance;}
.sp-scene{display:grid;grid-template-columns:minmax(0,1fr) 250px minmax(0,1fr);gap:22px;align-items:center;}
.sp-prives{display:flex;flex-direction:column;gap:10px;}
.sp-salon{background:#FFF8F1;border-radius:18px;padding:10px 12px 11px;box-shadow:0 18px 40px rgba(0,0,0,.35);
  opacity:0;transform:translateY(14px) scale(.96);transition:opacity .5s ease,transform .6s cubic-bezier(.2,.8,.2,1);}
.sp-salon.on{opacity:1;transform:none;}
.sp-salon.prive.on{transition-delay:calc(var(--k) * .55s);}
.sp-salon.public.on{transition-delay:1.7s;}
.sp-salon header{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-bottom:6px;}
.sp-salon header b{font-family:var(--font-clikme),sans-serif;font-size:14px;font-weight:800;color:#2A1712;letter-spacing:-.01em;}
.sp-cadenas{font-size:10.5px;font-weight:800;color:#C2185B;background:#FFE1EE;border-radius:999px;padding:3px 8px;}
.sp-cadenas.pub{color:#1F6B4A;background:#DDF5E8;}
.sp-msg{display:grid;grid-template-columns:32px minmax(0,1fr);gap:7px;align-items:end;margin-top:5px;
  opacity:0;transform:translateY(6px);}
.sp-salon.on .sp-msg{animation:spMsg .45s ease both;}
.sp-salon.prive.on .sp-msg{animation-delay:calc(var(--k) * .55s + .35s + var(--i) * .7s);}
.sp-salon.public.on .sp-msg{animation-delay:calc(2.05s + var(--i) * .65s);}
.sp-msg img,.sp-ecrit img{width:32px;height:32px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#FFE7D6;}
.sp-ecrit{display:grid;grid-template-columns:32px minmax(0,1fr);gap:7px;align-items:center;margin-top:6px;opacity:0;}
.sp-salon.public.on .sp-ecrit{animation:spMsg .45s ease both;animation-delay:calc(2.05s + var(--i) * .65s);}
.sp-ecrit span{font-size:11.5px;font-style:italic;color:#6E5A4E;}
.sp-ecrit i{display:inline-block;width:5px;height:5px;margin-left:2px;border-radius:50%;background:#1F6B4A;animation:spPoint 1s ease-in-out infinite;}
.sp-ecrit i:nth-child(2){animation-delay:.15s;}
.sp-ecrit i:nth-child(3){animation-delay:.3s;}
@keyframes spPoint{0%,100%{opacity:.25;transform:translateY(0);}50%{opacity:1;transform:translateY(-3px);}}
.sp-msg p{margin:0;padding:6px 10px;border-radius:13px;border-bottom-left-radius:5px;background:#F3E6DA;font-size:12.5px;line-height:1.3;color:#2A1712;}
.sp-msg p b{display:block;font-size:10.5px;color:#C2185B;margin-bottom:1px;}
.sp-salon.public{align-self:center;display:flex;flex-direction:column;}
.sp-salon.public .sp-msg p{background:#E9F4EE;}
.sp-salon.public .sp-msg p b{color:#1F6B4A;}
.sp-foule{display:flex;align-items:center;margin-left:auto;}
.sp-foule img{width:24px;height:24px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#FFE7D6;border:2px solid #FFF8F1;margin-left:-7px;}
.sp-foule em{font-style:normal;font-size:11px;font-weight:800;color:#6E5A4E;margin-left:4px;}
.sp-centre{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;animation:spMonte .55s cubic-bezier(.2,.8,.2,1) .1s both;}
.sp-photo{position:relative;width:250px;aspect-ratio:3 / 4;border-radius:22px;overflow:hidden;
  box-shadow:0 0 0 3px rgba(255,248,241,.9),0 30px 70px rgba(0,0,0,.55),0 0 60px rgba(255,79,160,.25);}
.sp-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;}
.sp-badge{position:absolute;left:10px;bottom:10px;padding:6px 11px;border-radius:999px;font-size:12px;font-weight:800;color:#fff;
  background:linear-gradient(90deg,#FF4FA0,#F5A23A);box-shadow:0 6px 18px rgba(255,79,160,.45);}
.sp-ex{position:absolute;right:10px;top:10px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:800;color:#FFF4E6;background:rgba(18,12,9,.7);}
.sp-coeurs i{position:absolute;bottom:40px;font-style:normal;font-size:20px;opacity:0;}
.sp-coeurs i:nth-child(1){left:22%;}
.sp-coeurs i:nth-child(2){left:52%;}
.sp-coeurs i:nth-child(3){left:76%;}
.sp-scene .sp-coeurs i{animation:spCoeur 2.6s ease-out infinite;}
.sp-scene .sp-coeurs i:nth-child(2){animation-delay:.8s;}
.sp-scene .sp-coeurs i:nth-child(3){animation-delay:1.6s;}
.sp-partager{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;
  color:#7A1446;background:#FFD6E8;box-shadow:0 8px 24px rgba(0,0,0,.3);transition:transform .3s ease,background .3s ease;}
.sp-partager svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.sp-scene.partage .sp-partager{background:#FF4FA0;color:#fff;animation:spPouls 1.4s ease-in-out 2;}
.sp-envols i{position:absolute;left:50%;top:44%;width:14px;height:14px;margin:-7px;border-radius:50%;opacity:0;
  background:radial-gradient(circle,#fff 0 25%,#FF8CC8 45%,transparent 70%);box-shadow:0 0 18px 6px rgba(255,79,160,.5);}
.sp-scene.partage .sp-envols i{animation:spEnvol 1.1s cubic-bezier(.5,0,.3,1) both;}
.sp-scene.partage .sp-envols i:nth-child(1){--dx:-300px;--dy:-130px;animation-delay:.05s;}
.sp-scene.partage .sp-envols i:nth-child(2){--dx:-300px;--dy:0px;animation-delay:.6s;}
.sp-scene.partage .sp-envols i:nth-child(3){--dx:-300px;--dy:130px;animation-delay:1.15s;}
.sp-scene.partage .sp-envols i:nth-child(4){--dx:300px;--dy:0px;animation-delay:1.6s;}
.sp-compteurs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:760px;width:100%;margin:2px auto 0;}
.sp-cpt{display:flex;flex-direction:column;align-items:center;gap:1px;padding:10px 8px;border-radius:16px;text-align:center;
  background:rgba(255,248,241,.07);border:1px solid rgba(255,196,140,.18);opacity:.35;transition:opacity .4s ease,transform .4s ease,background .4s;}
.sp-cpt.on{opacity:1;transform:translateY(-2px);background:rgba(255,248,241,.11);}
.sp-cpt b{font-family:var(--font-clikme),sans-serif;font-size:clamp(26px,3vw,36px);font-weight:800;line-height:1;color:#FFE2A6;letter-spacing:-.03em;}
.sp-cpt.rose b{color:#FF8CC8;}
.sp-cpt span{font-size:12.5px;color:#E7D6C6;}
.sp-cpt .sp-cpt-h{font-size:11px;font-weight:700;color:#BFA88F;}
.sp-fin{margin:0;text-align:center;font-size:12px;color:#A8927F;opacity:0;transition:opacity .5s ease 2.6s;}
.sp-fin.on{opacity:1;}
@keyframes spMonte{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
@keyframes spMsg{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@keyframes spCoeur{0%{opacity:0;transform:translateY(0) scale(.6);}20%{opacity:1;}100%{opacity:0;transform:translateY(-120px) scale(1.2);}}
@keyframes spPouls{0%,100%{transform:scale(1);}50%{transform:scale(1.08);}}
@keyframes spEnvol{0%{opacity:0;transform:translate(0,0) scale(.6);}15%{opacity:1;}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1);}}
/* ═══ SUR UN TÉLÉPHONE : la pièce en haut, les quatre salons en deux par deux, les compteurs en bas. ═══ */
@media (max-width:899px){
  .dtour-ov.sp-ov{padding-top:76px;padding-bottom:126px;padding-left:12px;padding-right:12px;}
  .sp{gap:9px;}
  .sp-h{font-size:17px;margin-top:6px;}
  /* L'étiquette s'écarte de « Passer ✕ », posé à la même hauteur à droite. */
  .sp-k{font-size:9.5px;padding:4px 8px;margin-right:64px;}
  .sp-scene{grid-template-columns:1fr 1fr;gap:8px;}
  .sp-centre{grid-column:1 / -1;grid-row:1;flex-direction:row;justify-content:center;gap:10px;}
  .sp-photo{width:96px;border-radius:14px;}
  .sp-badge{left:6px;bottom:6px;font-size:9px;padding:3px 7px;}
  .sp-ex{font-size:9px;padding:2px 6px;right:6px;top:6px;}
  .sp-partager{font-size:12px;padding:8px 12px;}
  .sp-prives{display:contents;}
  .sp-salon{padding:7px 8px 8px;border-radius:14px;}
  .sp-salon header{margin-bottom:3px;}
  .sp-salon header b{font-size:11.5px;}
  .sp-cadenas{font-size:9px;padding:2px 6px;}
  .sp-foule{display:none;}
  .sp-msg{grid-template-columns:22px minmax(0,1fr);gap:5px;margin-top:3px;}
  .sp-msg img{width:22px;height:22px;}
  .sp-msg p{font-size:10.5px;padding:4px 7px;}
  .sp-msg p b{font-size:9px;}
  .sp-msg:nth-of-type(n+3),.sp-ecrit{display:none;}
  .sp-envols{display:none;}
  .sp-compteurs{gap:6px;}
  .sp-cpt{padding:7px 4px;border-radius:12px;}
  .sp-cpt b{font-size:22px;}
  .sp-cpt span{font-size:10.5px;}
  .sp-cpt .sp-cpt-h{font-size:9.5px;}
  .sp-fin{font-size:10.5px;}
}
@media (prefers-reduced-motion:reduce){
  .sp-salon,.sp-msg,.sp-cpt{transition:none;animation:none;opacity:1;transform:none;}
  .sp-scene .sp-coeurs i,.sp-scene.partage .sp-envols i,.sp-scene.partage .sp-partager{animation:none;}
}
`,
      }}
    />
  );
}
