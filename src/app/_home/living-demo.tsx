"use client";

// Démo « vivante » de la page d'accueil : un téléphone animé où l'assistante
// démontre ses 3 pouvoirs en boucle (répondre / récolter un avis / remplir un
// créneau), synchronisé avec une liste de fonctionnalités cliquable à côté.
// Immersif + interactif : le visiteur voit CONCRÈTEMENT ce que fait l'assistante.
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  { ic: "💬", t: "Elle répond à vos clients", s: "24 h/24, même quand vous êtes occupé." },
  { ic: "⭐", t: "Elle récolte vos avis", s: "vos clients satisfaits deviennent vos ambassadeurs." },
  { ic: "📣", t: "Elle remplit vos créneaux", s: "un créneau creux ? un clic, et c'est parti." },
];

const HEAD = ["Votre assistante · en ligne", "Après une bonne visite", "Un créneau à combler ?"];

export function LivingDemo() {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (!paused.current) setActive((a) => (a + 1) % FEATURES.length);
    }, 5200);
    return () => clearInterval(t);
  }, []);

  const pick = (i: number) => {
    setActive(i);
    paused.current = true;
    window.setTimeout(() => { paused.current = false; }, 9000);
  };

  return (
    <div className="ld">
      {/* Colonne texte / fonctionnalités (à gauche sur desktop) */}
      <div className="ld-list">
        <div className="sk reveal">La démo</div>
        <h2 className="ld-h reveal">Regardez-la travailler.</h2>
        <p className="ld-sub reveal">Trois choses qu&apos;elle fait pour vous, tous les jours — pendant que vous, vous faites votre métier.</p>
        <div className="ld-feats">
          {FEATURES.map((f, i) => (
            <button key={f.t} className={`ld-feat${i === active ? " on" : ""} reveal`} onClick={() => pick(i)} style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="ld-ic">{f.ic}</span>
              <span className="ld-tx">
                <span className="ld-tt">{f.t}</span>
                <span className="ld-ts">{f.s}</span>
              </span>
              <span className="ld-prog"><i className={i === active ? "run" : ""} /></span>
            </button>
          ))}
        </div>
      </div>

      {/* Téléphone animé (à droite sur desktop) */}
      <div className="ld-phone-wrap reveal">
        <div className="ld-glow" />
        <div className="ld-phone">
          <div className="ld-screen">
            <div className="ld-cap">
              <span className="ld-av">✦</span>
              <span>
                <span className="ld-nm">{HEAD[active]}</span>
                <span className="ld-on"><i /> en direct</span>
              </span>
            </div>
            <div className="ld-body" key={active}>
              {active === 0 && (
                <div className="ld-chat">
                  <div className="lb them" style={{ animationDelay: ".15s" }}>Bonjour, vous avez de la place samedi&nbsp;?</div>
                  <div className="lb typing" style={{ animationDelay: "1s" }}><span /><span /><span /></div>
                  <div className="lb me" style={{ animationDelay: "2.1s" }}>Bonjour 😊 Oui, il me reste des créneaux samedi&nbsp;! Je vous en réserve un&nbsp;?</div>
                  <div className="lb them" style={{ animationDelay: "3.5s" }}>Parfait, merci&nbsp;!</div>
                </div>
              )}
              {active === 1 && (
                <div className="ld-chat">
                  <div className="lb me" style={{ animationDelay: ".15s" }}>Vous avez passé un bon moment&nbsp;? Un petit avis nous aiderait beaucoup 🙏</div>
                  <div className="lb them" style={{ animationDelay: "1.4s" }}>Avec plaisir&nbsp;! ⭐⭐⭐⭐⭐</div>
                  <div className="ld-revcard" style={{ animationDelay: "2.5s" }}>
                    <div className="ld-stars">★★★★★</div>
                    <div className="ld-revtx">« Accueil au top, je recommande&nbsp;! »</div>
                    <div className="ld-count"><span className="up">+1</span> avis Google</div>
                  </div>
                </div>
              )}
              {active === 2 && (
                <div className="ld-fill">
                  <div className="ld-fillbtn" style={{ animationDelay: ".15s" }}>➡️ Remplir un créneau</div>
                  <div className="ld-chan ok" style={{ animationDelay: "1.1s" }}><span className="c">✅</span> Message WhatsApp <b>envoyé</b></div>
                  <div className="ld-chan ok" style={{ animationDelay: "1.9s" }}><span className="c">✅</span> Annonce sur le site <b>publiée</b></div>
                  <div className="ld-chan" style={{ animationDelay: "2.7s" }}><span className="c">✍️</span> Facebook &amp; Instagram <b>prêts</b></div>
                  <div className="ld-fillnote" style={{ animationDelay: "3.4s" }}>En moins d&apos;une minute.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
