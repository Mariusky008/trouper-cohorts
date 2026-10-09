"use client";

// 💬 LES SALONS, JUSTE APRÈS L'ESSAI — la fin de l'étape 2.
//
// « Étape 2 : à la fin de cette étape, c'est là qu'il faut dire qu'une fois le
// produit essayé, le client peut ouvrir un salon entre amis ou public, où il
// pourrait demander des avis, faire des comparaisons… C'est un endroit où les
// ventes grimpent. C'est donc ici même qu'il faut montrer le nouveau design
// qu'on vient de produire, avec ces salons hyper bien pensés où le fantôme
// intervient, qu'on soit seul ou avec des amis, et qui va nous aider à prendre
// une décision de chez soi. » Le fantôme est celui DE LA BOUTIQUE — « avec sa
// casquette ».
//
// LA SCÈNE QUI FERMAIT LA VISITE OUVRE MAINTENANT SA SUITE. Elle était à
// l'étape 5, où elle disait « voilà ce qu'on en dit » après les chiffres ; elle
// est ici à sa vraie place, juste après l'essai, là où l'envie se transforme en
// décision. L'étape 5 montre désormais ce qui en revient chez la commerçante —
// voir `scene-demandes.tsx`.
//
// TROIS TEMPS, UN PAR PHRASE DE LÉA (`n`) :
//   0. « D'un clic, elles ouvrent un salon » — un doigt appuie sur Partager ;
//      quatre bulles de savon portant la photo de l'essai filent vers la place
//      de chaque salon (mesurée à l'écran) et y éclatent ; le salon naît, la
//      photo pour image de groupe, et les amies écrivent ;
//   1. « Le fantôme de votre boutique est là, qu'elles soient seules ou entre
//      amies » — il répond dans le salon des amies ET dans celui d'une cliente
//      seule, et propose de mettre de côté ;
//   2. « C'est là que vos ventes se décident » — ses propositions sont
//      acceptées, et le bilan s'affiche sous la pièce.
//
// TOUT EST UN EXEMPLE, ET C'EST ÉCRIT. Les prénoms sont ceux des fantômes de
// l'application ; le fantôme de la boutique parle sous le nom de la boutique,
// et ne dit rien qu'elle ne pourrait dire — une taille, une couleur, « je vous
// la garde ? ».
import { useLayoutEffect, useRef } from "react";
import type { GesteDuJour } from "@/lib/direct/geste-du-jour";

type Personne = { qui: string; fantome: string };
/** `ordi` : trop pour un téléphone, où chaque salon ne garde que l'essentiel. */
type Message = Personne & { texte: string; ordi?: true };
/** Ce que dit le fantôme de la boutique, le bouton qu'il propose, et ce que ça devient quand c'est décidé. */
type Intervention = { texte: string; bouton: string; fait: string };
type Salon = { titre: string; seul?: true; messages: Message[]; fantome?: Intervention };

const F = (nom: string) => `/direct/ensemble/fantome-${nom}.webp`;
const CAMILLE = { qui: "Camille", fantome: F("casquette-noire") };
const JULIE = { qui: "Julie", fantome: F("beret-rouge") };
const SAM = { qui: "Sam", fantome: F("bonnet") };
const INES = { qui: "Inès", fantome: F("lunettes-rouges") };
const LEA = { qui: "Léa", fantome: F("echarpe-violette") };
const NORA = { qui: "Nora", fantome: F("echarpe-verte") };
const HUGO = { qui: "Hugo", fantome: F("salue") };
const EMMA = { qui: "Emma", fantome: F("echarpe-violette-cligne") };
const ZOE = { qui: "Zoé", fantome: F("bonnet-cligne") };
const MILA = { qui: "Mila", fantome: F("beret-noir-cligne") };

const m = (p: Personne, texte: string, ordi?: true): Message => ({ ...p, texte, ...(ordi ? { ordi } : {}) });

/**
 * LES CONVERSATIONS DE L'EXEMPLE, DANS LES MOTS DU MÉTIER : deux salons entre
 * amis, un salon d'une personne seule — où le fantôme de la boutique répond
 * aussi —, et le salon public de la ville.
 */
function salonsDe(g: GesteDuJour): { prives: Salon[]; public: Message[] } {
  if (g.photoEtVoix) {
    return {
      prives: [
        {
          titre: "Cette tenue pour samedi ?",
          messages: [m(CAMILLE, "Vous en pensez quoi ?", true), m(SAM, "Elle te va super bien… mais j’hésite avec l’autre 🤔")],
          fantome: { texte: "Vous hésitez ? Je vous aide à trancher : votez A ou B !", bouton: "🗳️ On vote", fait: "A gagne 2–1 · mise de côté demandée" },
        },
        { titre: "Les copines", messages: [m(INES, "Je passe l’essayer demain 😍"), m(LEA, "Je viens avec toi !")] },
        {
          titre: "Mon essai",
          seul: true,
          messages: [m(ZOE, "Elle me plaît… mais j’hésite.")],
          fantome: { texte: "Vous êtes seule ? Aucun problème. Je vous aide à trancher.", bouton: "Fais-moi trancher", fait: "Votre choix : A · demande envoyée" },
        },
      ],
      public: [
        m(NORA, "Je l’ai essayée hier, elle tombe parfaitement"),
        m(HUGO, "Le conseil en boutique est adorable 💕"),
        m(EMMA, "Je file la voir !", true),
        m(INES, "Elle taille comment ?", true),
        m(NORA, "Normalement, j’ai pris ma taille habituelle", true),
      ],
    };
  }
  if (g.famille === "restauration") {
    return {
      prives: [
        {
          titre: `${g.quand}, on y va ?`,
          messages: [m(CAMILLE, "Regardez ça 😋", true), m(JULIE, "Validé ! Il reste de la place ?")],
          fantome: { texte: "Il me reste une table pour 3 à 12 h 30. Je vous la garde ? 🙂", bouton: "Réserver", fait: "Demande envoyée pour 3" },
        },
        { titre: "Les collègues", messages: [m(INES, "Il a l’air trop bon"), m(LEA, "On y va demain ?")] },
        {
          titre: "Ma pause",
          seul: true,
          messages: [m(ZOE, "C’est fait maison ?")],
          fantome: { texte: "Tout est fait maison, ce matin même. Je vous garde une place ?", bouton: "Réserver", fait: "Demande envoyée" },
        },
      ],
      public: [m(NORA, "Je confirme, c’est excellent"), m(HUGO, "Il reste de la place ?"), m(EMMA, "Tout est fait maison 👌", true), m(ZOE, "J’y vais ce soir !", true)],
    };
  }
  if (g.famille === "rdv") {
    return {
      prives: [
        {
          titre: "Un créneau aujourd’hui ?",
          messages: [m(CAMILLE, "Je me lance ? ✨", true), m(JULIE, "Fonce ! Il reste de la place ?")],
          fantome: { texte: "J’ai 15 h ou 16 h 30 de libre. Je vous bloque lequel ? 🙂", bouton: "Réserver", fait: "Demande envoyée pour 15 h" },
        },
        { titre: "Les copines", messages: [m(INES, "Je prends le suivant 😄"), m(LEA, "Top adresse !")] },
        {
          titre: "Mon rendez-vous",
          seul: true,
          messages: [m(ZOE, "Vous prenez sans rendez-vous ?")],
          fantome: { texte: "Aujourd’hui oui, jusqu’à 18 h. Je vous inscris ?", bouton: "M’inscrire", fait: "Demande envoyée" },
        },
      ],
      public: [m(NORA, "Super accueil, je recommande"), m(HUGO, "Résultat parfait 👌"), m(EMMA, "J’y vais samedi !", true)],
    };
  }
  if (g.famille === "librairie") {
    return {
      prives: [
        {
          titre: "Club de lecture",
          messages: [m(CAMILLE, "Vous l’avez lu ?", true), m(JULIE, "Pas encore… il en reste ?")],
          fantome: { texte: "Il m’en reste deux. Je vous en mets un de côté ? 🙂", bouton: "Mettre de côté", fait: "Demande envoyée" },
        },
        { titre: "Les copines", messages: [m(INES, "Je l’offre à ma sœur 🎁"), m(LEA, "Bonne idée !")] },
        {
          titre: "Ma prochaine lecture",
          seul: true,
          messages: [m(ZOE, "Il existe en poche ?")],
          fantome: { texte: "Pas encore, mais je l’ai en grand format. Je vous le garde ?", bouton: "Me le garder", fait: "Demande envoyée" },
        },
      ],
      public: [m(NORA, "Coup de cœur pour moi aussi"), m(HUGO, "Leurs conseils sont toujours top"), m(EMMA, "Je file le chercher", true)],
    };
  }
  return {
    prives: [
      {
        titre: "Tu as vu ça ?",
        messages: [m(CAMILLE, "Regardez ce qui vient d’arriver 😍", true), m(JULIE, "Il en reste ?")],
        fantome: { texte: "Oui, ce matin encore. Je vous en mets de côté ? 🙂", bouton: "Mettre de côté", fait: "Demande envoyée" },
      },
      { titre: "Les voisines", messages: [m(INES, "Superbe !"), m(LEA, "J’y vais à midi")] },
      {
        titre: "Pour moi",
        seul: true,
        messages: [m(ZOE, "C’est encore dispo ce soir ?")],
        fantome: { texte: "Oui, jusqu’à la fermeture. Je vous le garde ?", bouton: "Me le garder", fait: "Demande envoyée" },
      },
    ],
    public: [m(NORA, "Toujours parfait, je recommande"), m(HUGO, "Accueil adorable 💕"), m(EMMA, "J’arrive !", true)],
  };
}

function Bulle({ msg, i }: { msg: Message; i: number }) {
  return (
    <div className={`sp-msg${msg.ordi ? " ordi" : ""}`} style={{ ["--i" as string]: i }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={msg.fantome} alt="" />
      <p>
        <b>{msg.qui}</b>
        {msg.texte}
      </p>
    </div>
  );
}

/** LE FANTÔME DE LA BOUTIQUE PREND LA PAROLE — et sa proposition devient une décision au temps suivant. */
function Fantome({ f, j, decide, qui }: { f: Intervention; j: number; decide: boolean; qui: { visage: string; nom: string } }) {
  return (
    <div className="sp-msg fan" style={{ ["--j" as string]: j }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qui.visage} alt="" />
      <p>
        <b>
          {qui.nom} <em>· son fantôme</em>
        </b>
        {f.texte}
        <span className={`sp-garde${decide ? " fait" : ""}`}>{decide ? `✓ ${f.fait}` : f.bouton}</span>
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

export function SceneSalons({
  g,
  n,
  ville,
  photo,
  exemple,
  fantome,
  duel,
}: {
  g: GesteDuJour;
  /** Où en est la voix : 0 on ouvre les salons, 1 le fantôme répond, 2 c'est décidé. */
  n: number;
  ville: string;
  /** La pièce essayée (boutique de vêtements), sinon la photo de son annonce. */
  photo: string;
  /** La photo du centre est celle de l'exemple, pas la sienne. */
  exemple?: boolean;
  /** Le fantôme de la boutique : son visage, et le nom sous lequel il parle. */
  fantome: { visage: string; nom: string };
  /**
   * LE DUEL D'« ENSEMBLE », AU CENTRE — voir `duel-salon.tsx`. Sa pièce essayée
   * (A) contre une autre pièce portée par la même personne (B) ; on vote, et A
   * l'emporte. Absent : le fantôme répond dans les salons, sans duel.
   */
  duel?: { b: string; nomA: string; nomB: string; exempleB?: boolean };
}) {
  const partage = n >= 0;
  const repond = n >= 1;
  const decide = n >= 2;
  const { prives, public: publics } = salonsDe(g);
  const essai = Boolean(g.photoEtVoix);
  const clients = essai ? "vos clientes" : "vos clients";

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
  /** Le rang de chaque réponse du fantôme, pour qu'il ne parle pas partout à la même seconde. */
  const rangFantome = prives.map((_, k) => prives.slice(0, k).filter((x) => x.fantome).length);

  return (
    <div className="dtour-ov sp-ov">
      <div className="sp">
        <div className="sp-tete">
          <span className="sp-k">Exemple · des salons comme ceux de {clients}</span>
          <h3 className="sp-h">{g.salons.titre}</h3>
        </div>

        <div className={`sp-scene${partage ? " partage" : ""}`}>
          {/* ═══ DEUX SALONS ENTRE AMIS, ET UN SALON SEUL ═══ */}
          <div className="sp-prives">
            {prives.map((s, k) => {
              const j = rangFantome[k];
              return (
                <div
                  key={s.titre}
                  className="sp-place"
                  style={{ ["--k" as string]: k }}
                  ref={(el) => {
                    places.current[k] = el;
                  }}
                >
                  <section className={`sp-salon prive${s.seul ? " seul" : ""}`}>
                    <header>
                      {imageDeGroupe}
                      <span className="sp-titres">
                        <span className={`sp-cadenas${s.seul ? " seul" : ""}`}>{s.seul ? "🔒 Juste moi" : "🔒 Salon privé"}</span>
                        <b>{s.titre}</b>
                      </span>
                    </header>
                    {s.messages.map((msg, i) => (
                      <Bulle key={i} msg={msg} i={i} />
                    ))}
                    {s.fantome && repond && <Fantome f={s.fantome} j={j} decide={decide} qui={fantome} />}
                  </section>
                  <BulleDeSavon photo={photo} />
                </div>
              );
            })}
          </div>

          {/* ═══ SA PIÈCE, AU CENTRE, LE CLIC — PUIS LE DUEL ═══
              « Vous hésitez ? Je peux vous aider à trancher. » Quand le
              fantôme le propose, une autre pièce (B) vient se poser à côté de
              la sienne (A), les amies votent, et A l'emporte : la décision se
              voit prendre, depuis chez soi. */}
          <div className={`sp-centre${duel && repond ? " duel" : ""}${duel && decide ? " tranche" : ""}`}>
            <div className="sp-duo">
              <div className="sp-photo a">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" />
                <span className="sp-badge">{essai ? "Essayée virtuellement" : g.extrait.titre}</span>
                {exemple && <span className="sp-ex">Exemple</span>}
                {duel && repond && <span className="sp-lettre">A</span>}
                {duel && decide && (
                  <span className="sp-couronne" aria-hidden="true">
                    👑
                  </span>
                )}
                <span className="sp-coeurs" aria-hidden="true">
                  <i>❤️</i>
                  <i>💗</i>
                  <i>❤️</i>
                </span>
              </div>
              {duel && repond && (
                <>
                  <span className="sp-vs" aria-hidden="true">
                    VS
                  </span>
                  <div className="sp-photo b">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={duel.b} alt={duel.nomB} />
                    <span className="sp-lettre">B</span>
                    {duel.exempleB && <span className="sp-ex">Exemple</span>}
                  </div>
                </>
              )}
            </div>
            {duel && repond && (
              <div className="sp-votes" aria-label="Le vote du salon">
                <span className="sp-vote a">
                  <b>A · {duel.nomA}</b>
                  <i style={{ ["--v" as string]: "67%" }} />
                  <em>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={JULIE.fantome} alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={SAM.fantome} alt="" /> 2 votes
                  </em>
                </span>
                <span className="sp-vote b">
                  <b>B · {duel.nomB}</b>
                  <i style={{ ["--v" as string]: "33%" }} />
                  <em>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={INES.fantome} alt="" /> 1 vote
                  </em>
                </span>
              </div>
            )}
            <div className="sp-actions">
              <span className="sp-partager" ref={bouton}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                </svg>
                Partager dans ClikMe
                <i className="sp-onde" aria-hidden="true" />
                <i className="sp-doigt" aria-hidden="true">
                  👆
                </i>
                <span className="sp-clic">1 clic · {prives.length + 1} salons s’ouvrent</span>
              </span>
              {/* CE QUE LES SALONS ONT DÉCIDÉ — quand Léa dit « c'est là que vos ventes se décident ». */}
              {decide && <span className="sp-bilan">{duel ? `👑 A gagne 2–1 · ${g.salons.bilan}` : g.salons.bilan}</span>}
            </div>
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

        <p className={`sp-fin${partage ? " on" : ""}`}>Exemples de conversations · votre fantôme y répond pour vous</p>
      </div>
      <StylesSalons />
    </div>
  );
}

function StylesSalons() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dtour-ov.sp-ov{align-items:flex-start;padding-top:70px;padding-bottom:140px;overflow:hidden;}
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
.sp-salon.seul .sp-pic{box-shadow:0 0 0 2px #9B7BFF,0 4px 10px rgba(0,0,0,.18);}
.sp-titres{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;}
.sp-salon header b{font-family:var(--font-clikme),sans-serif;font-size:14px;font-weight:800;color:#2A1712;letter-spacing:-.01em;}
.sp-cadenas{font-size:10px;font-weight:800;color:#C2185B;background:#FFE1EE;border-radius:999px;padding:2px 8px;}
.sp-cadenas.pub{color:#1F6B4A;background:#DDF5E8;}
.sp-cadenas.seul{color:#5B3FC4;background:#ECE6FF;}
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
.sp-salon.seul .sp-msg p b{color:#5B3FC4;}
.sp-salon.public{display:flex;flex-direction:column;}
.sp-salon.public .sp-msg p{background:#E9F4EE;}
.sp-salon.public .sp-msg p b{color:#1F6B4A;}
.sp-foule{display:flex;align-items:center;margin-left:auto;padding-left:6px;}
.sp-foule img{width:24px;height:24px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#FFE7D6;border:2px solid #FFF8F1;margin-left:-7px;}
.sp-foule em{font-style:normal;font-size:11px;font-weight:800;color:#6E5A4E;margin-left:4px;white-space:nowrap;}

/* ═══ LE FANTÔME DE LA BOUTIQUE ═══ Il arrive quand Léa le nomme : sa bulle a
   la couleur de la maison, et ce qu'il propose devient une décision au temps
   suivant. */
.sp-scene.partage .sp-msg.fan{animation:spFan .55s cubic-bezier(.34,1.45,.64,1) both;animation-delay:calc(.15s + var(--j) * .55s);}
@keyframes spFan{from{opacity:0;transform:translateY(10px) scale(.92);}to{opacity:1;transform:none;}}
.sp-msg.fan img{background:#2A1712;box-shadow:0 0 0 2px #F5A23A;}
.sp-msg.fan p{background:linear-gradient(135deg,#FFF0DA,#FFE3EF);border:1px solid rgba(245,162,58,.65);
  box-shadow:0 6px 16px rgba(245,162,58,.22);}
.sp-salon .sp-msg.fan p b{color:#B4600F;}
.sp-msg.fan p b em{font-style:normal;font-weight:600;color:#A8927F;}
.sp-garde{display:block;width:max-content;max-width:100%;margin-top:5px;padding:4px 10px;border-radius:999px;
  font-size:11px;font-weight:800;color:#fff;background:#FF4FA0;box-shadow:0 4px 12px rgba(255,79,160,.35);}
.sp-garde.fait{background:#2E9E6B;box-shadow:0 4px 12px rgba(46,158,107,.35);animation:spFait .5s cubic-bezier(.34,1.5,.64,1);}
@keyframes spFait{0%{transform:scale(.8);}60%{transform:scale(1.08);}100%{transform:none;}}

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

/* ═══ AU CENTRE : la pièce, le clic, et ce qui a été décidé ═══ */
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
.sp-actions{display:flex;flex-direction:column;align-items:center;gap:34px;}
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
/* ═══ LE DUEL ═══ A rétrécit pour faire place à B ; « VS » entre les deux ; les
   votes montent ; à la décision, B s'efface et A reçoit sa couronne. */
.sp-duo{position:relative;display:flex;align-items:center;justify-content:center;gap:16px;}
.sp-photo{transition:width .6s cubic-bezier(.65,.05,.3,1),box-shadow .5s ease,filter .5s ease,opacity .5s ease;}
.sp-centre.duel .sp-photo{width:110px;border-radius:16px;}
.sp-centre.duel .sp-badge{left:6px;bottom:6px;font-size:9.5px;padding:3px 7px;}
.sp-photo.b{animation:spB .6s cubic-bezier(.34,1.4,.64,1) .25s both;}
@keyframes spB{from{opacity:0;transform:translateX(30px) scale(.85);}to{opacity:1;transform:none;}}
.sp-lettre{position:absolute;left:6px;top:6px;z-index:2;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;
  font-size:12px;font-weight:900;color:#1A0F08;background:#FFE2A6;box-shadow:0 4px 10px rgba(0,0,0,.35);}
.sp-photo.b .sp-lettre{background:#D9E7FF;}
.sp-vs{position:absolute;left:50%;top:50%;z-index:3;transform:translate(-50%,-50%);display:grid;place-items:center;
  width:34px;height:34px;border-radius:50%;font-size:12px;font-weight:900;color:#fff;background:#FF4FA0;
  box-shadow:0 0 0 3px rgba(255,248,241,.9),0 8px 20px rgba(255,79,160,.5);animation:spVs .5s cubic-bezier(.34,1.6,.64,1) .45s both;}
@keyframes spVs{from{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-30deg);}to{opacity:1;transform:translate(-50%,-50%);}}
.sp-centre.tranche .sp-photo.b{opacity:.45;filter:grayscale(.7);}
.sp-centre.tranche .sp-photo.a{box-shadow:0 0 0 3px #FFD36E,0 20px 50px rgba(0,0,0,.5),0 0 40px rgba(255,211,110,.55);}
.sp-couronne{position:absolute;left:50%;top:-6px;z-index:3;transform:translateX(-50%);font-size:26px;line-height:1;
  filter:drop-shadow(0 4px 8px rgba(0,0,0,.4));animation:spCouronne .6s cubic-bezier(.34,1.6,.64,1) both;}
@keyframes spCouronne{from{opacity:0;transform:translate(-50%,-14px) scale(.4);}to{opacity:1;transform:translateX(-50%);}}
.sp-votes{display:flex;flex-direction:column;gap:6px;width:236px;animation:spMonte .45s ease .8s both;}
.sp-vote{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 8px;padding:6px 9px;border-radius:12px;
  background:rgba(255,248,241,.08);border:1px solid rgba(255,196,140,.18);}
.sp-vote b{grid-column:1 / -1;font-size:11.5px;font-weight:800;color:#FFF4E6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sp-vote i{height:6px;border-radius:999px;background:rgba(255,248,241,.12);position:relative;overflow:hidden;}
.sp-vote i::after{content:"";position:absolute;inset:0 auto 0 0;width:var(--v);border-radius:inherit;background:#FFD36E;
  animation:spJauge 1.2s cubic-bezier(.2,.8,.2,1) 1.1s both;}
.sp-vote.b i::after{background:#9AB8FF;}
@keyframes spJauge{from{width:0;}}
.sp-vote em{display:flex;align-items:center;gap:2px;font-style:normal;font-size:11px;font-weight:700;color:#E7D6C6;white-space:nowrap;}
.sp-vote em img{width:18px;height:18px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#FFE7D6;margin-right:-4px;
  border:1.5px solid #2A1712;}
.sp-vote em img:last-of-type{margin-right:4px;}
.sp-centre.duel .sp-actions{gap:10px;}
.sp-centre.duel .sp-clic{display:none;}
.sp-bilan{max-width:236px;padding:8px 14px;border-radius:14px;font-size:13px;font-weight:800;line-height:1.3;color:#fff;text-align:center;
  background:linear-gradient(135deg,#2E9E6B,#3CB37A);box-shadow:0 10px 26px rgba(46,158,107,.45);
  animation:spBilan .6s cubic-bezier(.34,1.5,.64,1) .35s both;}
@keyframes spBilan{from{opacity:0;transform:translateY(8px) scale(.85);}to{opacity:1;transform:none;}}

.sp-fin{margin:0;text-align:center;font-size:12px;color:#A8927F;opacity:0;transition:opacity .5s ease 3s;}
.sp-fin.on{opacity:1;}
@keyframes spMonte{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
@keyframes spMsg{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@keyframes spCoeur{0%{opacity:0;transform:translateY(0) scale(.6);}20%{opacity:1;}100%{opacity:0;transform:translateY(-120px) scale(1.2);}}
/* ═══ SUR UN TÉLÉPHONE : la pièce en haut, les quatre salons en deux par deux.
   Chaque salon n'y garde que l'essentiel (« ordi » : réservé à l'ordinateur) —
   et toujours la réponse du fantôme. ═══ */
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
  .sp-actions{gap:30px;}
  .sp-partager{font-size:12px;padding:8px 12px;}
  .sp-clic{font-size:10px;padding:3px 8px;}
  .sp-doigt{font-size:24px;}
  .sp-bilan{max-width:none;font-size:11.5px;padding:6px 10px;}
  /* LE DUEL SUR UN TÉLÉPHONE : A et B côte à côte, les votes à droite ; le
     bouton Partager a fait son office, il laisse la place. */
  .sp-centre.duel .sp-photo{width:70px;border-radius:12px;}
  .sp-centre.duel .sp-badge,.sp-centre.duel .sp-ex{display:none;}
  .sp-duo{gap:10px;}
  .sp-vs{width:26px;height:26px;font-size:10px;}
  .sp-lettre{width:18px;height:18px;font-size:10px;left:4px;top:4px;}
  .sp-couronne{font-size:20px;top:-4px;}
  .sp-centre.duel .sp-partager{display:none;}
  .sp-centre.duel{align-items:center;flex-wrap:wrap;row-gap:6px;}
  .sp-votes{width:auto;flex:1;min-width:0;max-width:170px;gap:4px;}
  .sp-vote{padding:4px 7px;border-radius:10px;}
  .sp-vote b{font-size:9.5px;}
  .sp-vote em{font-size:9.5px;}
  .sp-vote em img{width:14px;height:14px;}
  /* Le bilan prend une ligne à lui, réservée dès le duel : rien ne saute quand il arrive. */
  .sp-centre.duel .sp-actions{flex-basis:100%;min-height:26px;}
  .sp-prives{display:contents;}
  .sp-place{--b:76px;display:flex;flex-direction:column;}
  .sp-place.pub{align-self:stretch;}
  .sp-salon{flex:1;padding:7px 8px 8px;border-radius:14px;}
  .sp-salon header{gap:6px;margin-bottom:3px;}
  .sp-pic{width:26px;height:26px;border-radius:8px;box-shadow:0 0 0 1.5px #FF8CC8;}
  .sp-salon.public .sp-pic{box-shadow:0 0 0 1.5px #3CB37A;}
  .sp-salon.seul .sp-pic{box-shadow:0 0 0 1.5px #9B7BFF;}
  .sp-titres{gap:2px;}
  .sp-salon header b{font-size:11px;line-height:1.15;}
  .sp-cadenas{font-size:8.5px;padding:2px 6px;}
  .sp-foule{display:none;}
  .sp-msg{grid-template-columns:22px minmax(0,1fr);gap:5px;margin-top:3px;}
  .sp-msg img{width:22px;height:22px;}
  .sp-msg p{font-size:10.5px;padding:4px 7px;}
  .sp-msg p b{font-size:9px;}
  .sp-msg.ordi,.sp-ecrit{display:none;}
  .sp-msg.fan p b em{display:none;}
  .sp-garde{font-size:9.5px;padding:3px 8px;margin-top:4px;}
  .sp-fin{font-size:10.5px;}
}
@media (prefers-reduced-motion:reduce){
  .sp-scene.partage .sp-salon,.sp-scene.partage .sp-msg,.sp-scene.partage .sp-ecrit{animation:none;opacity:1;transform:none;}
  .sp-savon,.sp-gouttes,.sp-doigt,.sp-onde{display:none;}
  .sp-scene .sp-coeurs i,.sp-scene.partage .sp-partager,.sp-savon::before,.sp-garde.fait,.sp-bilan{animation:none;}
  .sp-scene.partage .sp-clic{animation:none;opacity:1;transform:translateX(-50%);}
}
`,
      }}
    />
  );
}
