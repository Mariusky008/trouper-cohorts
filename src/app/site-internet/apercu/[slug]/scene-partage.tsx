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
// ═══ LES SALONS NAISSENT DE L'ESSAI, EN UN CLIC, EN BULLES DE SAVON ═══════
//
// « C'est sympa, mais il aurait fallu qu'on comprenne que les salons s'ouvrent
// depuis l'essayage en un clic, et que ça ouvre des salons avec la photo de
// l'essayage. Et quand les salons apparaissent, tu peux les faire apparaître
// comme une bulle de savon qui pop à l'écran, pour un peu de magie. »
//
// LES SALONS ÉTAIENT LÀ, MAIS ILS NE VENAIENT DE NULLE PART : ils montaient en
// fondu pendant qu'un bouton s'allumait au milieu, et rien ne reliait l'un à
// l'autre. Le geste se voit maintenant faire, dans l'ordre :
//   1. un doigt appuie sur « Partager » — « 1 clic » ;
//   2. de ce bouton partent quatre bulles de savon, chacune portant la photo
//      de l'essai ; chacune file vers la place de son salon (mesurée à
//      l'écran, pas devinée) ;
//   3. elle y éclate en gouttelettes, et le salon apparaît à sa place — avec
//      la photo de l'essai pour image de groupe, comme dans l'application ;
//   4. puis les messages arrivent, un par un.
//
// L'ÉCRAN SUIT LA VOIX, PHRASE PAR PHRASE (`n`, l'indice de la phrase dite) :
// l'ouverture pose la pièce au centre ; chaque chiffre fait monter son
// compteur ; la phrase du partage joue le clic et les bulles.
//
// TOUT EST UN EXEMPLE, ET C'EST ÉCRIT : « Exemple · pas encore vos
// chiffres », « Exemples de conversations ». Les prénoms sont ceux des
// fantômes de l'application, aucun n'est celui d'un vrai client.
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import type { GesteDuJour } from "@/lib/direct/geste-du-jour";

type Personne = { qui: string; fantome: string };
type Message = Personne & { texte: string };
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

const m = (p: Personne, texte: string): Message => ({ ...p, texte });

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

/** Les huit gouttelettes de la bulle qui éclate. */
const GOUTTES = [0, 45, 90, 135, 180, 225, 270, 315];

/** LA BULLE DE SAVON qui porte la photo de l'essai jusqu'au salon, et y éclate. */
function BulleDeSavon({ photo }: { photo: string }) {
  return (
    <>
      <span className="sp-savon" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" />
      </span>
      <span className="sp-gouttes" aria-hidden="true">
        {GOUTTES.map((a) => (
          <i key={a} style={{ ["--a" as string]: `${a}deg` }} />
        ))}
      </span>
    </>
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
  const nbSalons = prives.length + 1;

  /* ═══ LES BULLES PARTENT DU BOUTON, ET ON MESURE D'OÙ ═══════════════════
     Chaque place de salon reçoit l'écart qui la sépare du bouton
     (--dx, --dy) : sa bulle part de là. Mesuré à l'écran au moment du clic —
     la place d'un salon n'est pas la même sur un ordinateur et sur un
     téléphone, et une bulle qui part d'à côté du bouton ne se lit plus comme
     « c'est ce clic qui les a ouverts ». */
  const bouton = useRef<HTMLSpanElement | null>(null);
  const places = useRef<(HTMLDivElement | null)[]>([]);
  useLayoutEffect(() => {
    if (!partage) return;
    const b = bouton.current?.getBoundingClientRect();
    if (!b) return;
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    for (const el of places.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--dx", `${Math.round(bx - (r.left + r.width / 2))}px`);
      el.style.setProperty("--dy", `${Math.round(by - (r.top + r.height / 2))}px`);
    }
  }, [partage]);

  /** La photo de l'essai, en image de groupe du salon. */
  const imageDeGroupe = (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="sp-pic" src={photo} alt="" />
  );

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
              <div
                key={s.titre}
                className="sp-place"
                style={{ ["--k" as string]: k }}
                ref={(el) => {
                  places.current[k] = el;
                }}
              >
                <section className="sp-salon prive">
                  <header>
                    {imageDeGroupe}
                    <span className="sp-titres">
                      <span className="sp-cadenas">🔒 Salon privé</span>
                      <b>{s.titre}</b>
                    </span>
                  </header>
                  {s.messages.map((msg, i) => (
                    <Bulle key={i} msg={msg} i={i} />
                  ))}
                </section>
                <BulleDeSavon photo={photo} />
              </div>
            ))}
          </div>

          {/* ═══ SA PIÈCE, AU CENTRE, ET LE CLIC ═══ */}
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
            <span className="sp-partager" ref={bouton}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
              Partager dans ClikMe
              <i className="sp-onde" aria-hidden="true" />
              <i className="sp-doigt" aria-hidden="true">
                👆
              </i>
              <span className="sp-clic">1 clic · {nbSalons} salons s’ouvrent</span>
            </span>
          </div>

          {/* ═══ LE SALON PUBLIC ═══ */}
          <div
            className="sp-place pub"
            style={{ ["--k" as string]: prives.length }}
            ref={(el) => {
              places.current[prives.length] = el;
            }}
          >
            <section className="sp-salon public">
              <header>
                {imageDeGroupe}
                <span className="sp-titres">
                  <span className="sp-cadenas pub">🌍 Salon public · {ville}</span>
                  <b>Tout le monde en parle</b>
                </span>
                <span className="sp-foule">
                  {publics.slice(0, 4).map((p, k) => (
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
            <BulleDeSavon photo={photo} />
          </div>
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
              <Compteur cible={nbSalons} actif={partage} />
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
.dtour-ov.sp-ov{align-items:flex-start;padding-top:76px;padding-bottom:140px;overflow:hidden;}
.sp{position:relative;width:100%;max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:10px;pointer-events:auto;}
.sp::before{content:"";position:absolute;inset:-60px -40px;z-index:-1;pointer-events:none;
  background:radial-gradient(40% 50% at 50% 45%,rgba(255,79,160,.22),transparent 70%),radial-gradient(35% 45% at 20% 60%,rgba(245,162,58,.18),transparent 70%);}
.sp-tete{text-align:center;animation:spMonte .5s cubic-bezier(.2,.8,.2,1) both;}
.sp-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#B23A17;
  background:#FDEEE8;border-radius:7px;padding:5px 9px;}
.sp-h{margin:8px auto 0;max-width:640px;font-family:var(--font-clikme),sans-serif;font-size:clamp(20px,2.4vw,28px);font-weight:800;
  line-height:1.15;letter-spacing:-.03em;color:#FFF4E6;text-wrap:balance;}
.sp-scene{display:grid;grid-template-columns:minmax(0,1fr) 236px minmax(0,1fr);gap:22px;align-items:center;}
.sp-prives{display:flex;flex-direction:column;gap:8px;}

/* ═══ LA PLACE D'UN SALON : sa bulle y arrive, y éclate, et le salon y naît. ═══
   --t0 : le moment où sa bulle part du bouton, une toutes les 0,42 s. */
.sp-place{--b:118px;--t0:calc(.3s + var(--k) * .42s);position:relative;}
.sp-place.pub{align-self:center;}

.sp-salon{background:#FFF8F1;border-radius:18px;padding:8px 11px 9px;box-shadow:0 18px 40px rgba(0,0,0,.35);
  opacity:0;transform:scale(.5);}
.sp-scene.partage .sp-salon{animation:spSalon .62s cubic-bezier(.34,1.5,.64,1) calc(var(--t0) + .85s) both;}
@keyframes spSalon{from{opacity:0;transform:scale(.5);}to{opacity:1;transform:none;}}
.sp-salon header{display:flex;align-items:center;gap:8px;margin-bottom:3px;}
.sp-pic{flex:none;width:32px;height:32px;border-radius:9px;object-fit:cover;object-position:50% 22%;
  box-shadow:0 0 0 2px #FF8CC8,0 4px 10px rgba(0,0,0,.18);}
.sp-salon.public .sp-pic{box-shadow:0 0 0 2px #3CB37A,0 4px 10px rgba(0,0,0,.18);}
.sp-titres{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;}
.sp-salon header b{font-family:var(--font-clikme),sans-serif;font-size:14px;font-weight:800;color:#2A1712;letter-spacing:-.01em;}
.sp-cadenas{font-size:10px;font-weight:800;color:#C2185B;background:#FFE1EE;border-radius:999px;padding:2px 8px;}
.sp-cadenas.pub{color:#1F6B4A;background:#DDF5E8;}
.sp-msg{display:grid;grid-template-columns:30px minmax(0,1fr);gap:7px;align-items:end;margin-top:4px;
  opacity:0;transform:translateY(6px);}
.sp-scene.partage .sp-msg{animation:spMsg .45s ease both;animation-delay:calc(var(--t0) + 1.15s + var(--i) * .42s);}
.sp-msg img,.sp-ecrit img{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#FFE7D6;}
.sp-ecrit{display:grid;grid-template-columns:30px minmax(0,1fr);gap:7px;align-items:center;margin-top:6px;opacity:0;}
.sp-scene.partage .sp-ecrit{animation:spMsg .45s ease both;animation-delay:calc(var(--t0) + 1.15s + var(--i) * .42s);}
.sp-ecrit span{font-size:11.5px;font-style:italic;color:#6E5A4E;}
.sp-ecrit i{display:inline-block;width:5px;height:5px;margin-left:2px;border-radius:50%;background:#1F6B4A;animation:spPoint 1s ease-in-out infinite;}
.sp-ecrit i:nth-child(2){animation-delay:.15s;}
.sp-ecrit i:nth-child(3){animation-delay:.3s;}
@keyframes spPoint{0%,100%{opacity:.25;transform:translateY(0);}50%{opacity:1;transform:translateY(-3px);}}
.sp-msg p{margin:0;padding:5px 10px;border-radius:13px;border-bottom-left-radius:5px;background:#F3E6DA;font-size:12.5px;line-height:1.3;color:#2A1712;}
.sp-msg p b{display:block;font-size:10.5px;color:#C2185B;margin-bottom:1px;}
.sp-salon.public{display:flex;flex-direction:column;}
.sp-salon.public .sp-msg p{background:#E9F4EE;}
.sp-salon.public .sp-msg p b{color:#1F6B4A;}
.sp-foule{display:flex;align-items:center;margin-left:auto;padding-left:6px;}
.sp-foule img{width:24px;height:24px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#FFE7D6;border:2px solid #FFF8F1;margin-left:-7px;}
.sp-foule em{font-style:normal;font-size:11px;font-weight:800;color:#6E5A4E;margin-left:4px;white-space:nowrap;}

/* ═══ LA BULLE DE SAVON ═══ Elle part du bouton (--dx, --dy, mesurés), grossit
   en flottant jusqu'à la place du salon, tremble, et éclate. Un reflet, un bord
   irisé qui tourne, la photo de l'essai dedans. */
.sp-savon{position:absolute;left:50%;top:50%;z-index:6;width:var(--b);height:var(--b);
  margin:calc(var(--b) / -2) 0 0 calc(var(--b) / -2);border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(circle at 32% 27%,rgba(255,255,255,.95) 0 5%,rgba(255,255,255,0) 13%),
    radial-gradient(circle closest-side,rgba(255,255,255,0) 70%,rgba(255,255,255,.16) 86%,rgba(255,255,255,.6) 100%);
  box-shadow:0 0 34px rgba(255,140,210,.4),inset 0 0 24px rgba(255,255,255,.28);}
.sp-savon::before{content:"";position:absolute;inset:0;border-radius:50%;opacity:.8;
  background:conic-gradient(from 20deg,#FF8CC8,#9AD7FF,#B8FFCF,#FFF0A0,#FFB38A,#FF8CC8);
  -webkit-mask:radial-gradient(circle closest-side,transparent 80%,#000 91%,#000 97%,transparent 100%);
  mask:radial-gradient(circle closest-side,transparent 80%,#000 91%,#000 97%,transparent 100%);
  animation:spIrise 2.4s linear infinite;}
.sp-savon img{position:absolute;left:19%;top:19%;width:62%;height:62%;border-radius:50%;object-fit:cover;object-position:50% 22%;opacity:.9;}
.sp-scene.partage .sp-savon{animation:spSavon 1.05s cubic-bezier(.3,.7,.35,1) var(--t0) both;}
@keyframes spSavon{
  0%{opacity:0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(.14);}
  12%{opacity:1;}
  66%{opacity:1;transform:translate(0,0) scale(1);}
  74%{transform:translate(0,0) scale(1.07,.94);}
  82%{opacity:1;transform:translate(0,0) scale(1.12);}
  100%{opacity:0;transform:translate(0,0) scale(1.5);}
}
@keyframes spIrise{to{transform:rotate(360deg);}}
.sp-gouttes{position:absolute;left:50%;top:50%;z-index:6;width:0;height:0;pointer-events:none;}
.sp-gouttes i{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;opacity:0;
  background:radial-gradient(circle at 35% 35%,#fff,rgba(190,230,255,.9) 55%,rgba(255,140,200,.7));}
.sp-scene.partage .sp-gouttes i{animation:spGoutte .6s ease-out calc(var(--t0) + .86s) both;}
@keyframes spGoutte{
  0%{opacity:0;transform:rotate(var(--a)) translateX(calc(var(--b) * .45)) scale(1);}
  10%{opacity:1;}
  100%{opacity:0;transform:rotate(var(--a)) translateX(calc(var(--b) * .95)) scale(.3);}
}

/* ═══ AU CENTRE : la pièce, et le clic ═══ */
.sp-centre{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;animation:spMonte .55s cubic-bezier(.2,.8,.2,1) .1s both;}
.sp-photo{position:relative;width:236px;aspect-ratio:3 / 4;border-radius:22px;overflow:hidden;
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
.sp-partager{position:relative;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;
  color:#7A1446;background:#FFD6E8;box-shadow:0 8px 24px rgba(0,0,0,.3);
  transition:background .2s ease .35s,color .2s ease .35s;}
.sp-partager svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.sp-scene.partage .sp-partager{background:#FF4FA0;color:#fff;animation:spAppui .5s ease .2s both;}
@keyframes spAppui{0%,100%{transform:scale(1);}35%{transform:scale(.92);}70%{transform:scale(1.06);}}
/* LE DOIGT QUI APPUIE, ET L'ONDE DU CLIC. */
.sp-doigt{position:absolute;left:50%;top:30%;z-index:3;font-style:normal;font-size:30px;line-height:1;opacity:0;pointer-events:none;
  filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));}
.sp-scene.partage .sp-doigt{animation:spDoigt 1.3s ease both;}
@keyframes spDoigt{
  0%{opacity:0;transform:translate(18px,34px);}
  25%{opacity:1;transform:translate(-4px,4px);}
  36%{transform:translate(-4px,4px) scale(.84);}
  50%{transform:translate(-4px,4px) scale(1);}
  80%{opacity:1;}
  100%{opacity:0;transform:translate(10px,26px);}
}
.sp-onde{position:absolute;inset:0;border-radius:999px;border:2px solid #FF8CC8;opacity:0;pointer-events:none;}
.sp-scene.partage .sp-onde{animation:spOnde .75s ease-out .32s both;}
@keyframes spOnde{0%{opacity:.95;transform:scale(1);}100%{opacity:0;transform:scale(1.35,2);}}
.sp-clic{position:absolute;left:50%;top:calc(100% + 8px);z-index:2;white-space:nowrap;padding:4px 10px;border-radius:999px;
  font-size:11.5px;font-weight:800;color:#1A0F08;background:#FFE2A6;box-shadow:0 6px 16px rgba(0,0,0,.3);
  opacity:0;transform:translateX(-50%) scale(.6);}
.sp-scene.partage .sp-clic{animation:spClic .5s cubic-bezier(.34,1.5,.64,1) .4s both;}
@keyframes spClic{from{opacity:0;transform:translateX(-50%) scale(.6);}to{opacity:1;transform:translateX(-50%) scale(1);}}

/* ═══ LES COMPTEURS ═══ */
.sp-compteurs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:760px;width:100%;margin:6px auto 0;}
.sp-cpt{display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 8px;border-radius:16px;text-align:center;
  background:rgba(255,248,241,.07);border:1px solid rgba(255,196,140,.18);opacity:.35;transition:opacity .4s ease,transform .4s ease,background .4s;}
.sp-cpt.on{opacity:1;transform:translateY(-2px);background:rgba(255,248,241,.11);}
.sp-cpt b{font-family:var(--font-clikme),sans-serif;font-size:clamp(26px,3vw,36px);font-weight:800;line-height:1;color:#FFE2A6;letter-spacing:-.03em;}
.sp-cpt.rose b{color:#FF8CC8;}
.sp-cpt span{font-size:12.5px;color:#E7D6C6;}
.sp-cpt .sp-cpt-h{font-size:11px;font-weight:700;color:#BFA88F;}
.sp-fin{margin:0;text-align:center;font-size:12px;color:#A8927F;opacity:0;transition:opacity .5s ease 3s;}
.sp-fin.on{opacity:1;}
@keyframes spMonte{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
@keyframes spMsg{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@keyframes spCoeur{0%{opacity:0;transform:translateY(0) scale(.6);}20%{opacity:1;}100%{opacity:0;transform:translateY(-120px) scale(1.2);}}
/* ═══ SUR UN TÉLÉPHONE : la pièce en haut, les quatre salons en deux par deux, les compteurs en bas. ═══ */
@media (max-width:899px){
  .dtour-ov.sp-ov{padding-top:76px;padding-bottom:126px;padding-left:12px;padding-right:12px;}
  .sp{gap:9px;}
  .sp-h{font-size:17px;margin-top:6px;}
  /* L'étiquette s'écarte de « Passer ✕ », posé à la même hauteur à droite. */
  .sp-k{font-size:9.5px;padding:4px 8px;margin-right:64px;}
  .sp-scene{grid-template-columns:1fr 1fr;gap:8px;align-items:stretch;}
  .sp-centre{grid-column:1 / -1;grid-row:1;flex-direction:row;justify-content:center;gap:10px;}
  .sp-photo{width:96px;border-radius:14px;}
  .sp-badge{left:6px;bottom:6px;font-size:9px;padding:3px 7px;}
  .sp-ex{font-size:9px;padding:2px 6px;right:6px;top:6px;}
  .sp-partager{font-size:12px;padding:8px 12px;}
  .sp-clic{font-size:10px;padding:3px 8px;}
  .sp-doigt{font-size:24px;}
  .sp-prives{display:contents;}
  .sp-place{--b:76px;display:flex;flex-direction:column;}
  .sp-place.pub{align-self:stretch;}
  .sp-salon{flex:1;padding:7px 8px 8px;border-radius:14px;}
  .sp-salon header{gap:6px;margin-bottom:3px;}
  .sp-pic{width:26px;height:26px;border-radius:8px;box-shadow:0 0 0 1.5px #FF8CC8;}
  .sp-salon.public .sp-pic{box-shadow:0 0 0 1.5px #3CB37A;}
  .sp-titres{gap:2px;}
  .sp-salon header b{font-size:11px;line-height:1.15;}
  .sp-cadenas{font-size:8.5px;padding:2px 6px;}
  .sp-foule{display:none;}
  .sp-msg{grid-template-columns:22px minmax(0,1fr);gap:5px;margin-top:3px;}
  .sp-msg img{width:22px;height:22px;}
  .sp-msg p{font-size:10.5px;padding:4px 7px;}
  .sp-msg p b{font-size:9px;}
  .sp-msg:nth-of-type(n+3),.sp-ecrit{display:none;}
  .sp-compteurs{gap:6px;margin-top:4px;}
  .sp-cpt{padding:7px 4px;border-radius:12px;}
  .sp-cpt b{font-size:22px;}
  .sp-cpt span{font-size:10.5px;}
  .sp-cpt .sp-cpt-h{font-size:9.5px;}
  .sp-fin{font-size:10.5px;}
}
@media (prefers-reduced-motion:reduce){
  .sp-scene.partage .sp-salon,.sp-scene.partage .sp-msg,.sp-scene.partage .sp-ecrit{animation:none;opacity:1;transform:none;}
  .sp-cpt{transition:none;}
  .sp-savon,.sp-gouttes,.sp-doigt,.sp-onde{display:none;}
  .sp-scene .sp-coeurs i,.sp-scene.partage .sp-partager,.sp-savon::before{animation:none;}
  .sp-scene.partage .sp-clic{animation:none;opacity:1;transform:translateX(-50%);}
}
`,
      }}
    />
  );
}
