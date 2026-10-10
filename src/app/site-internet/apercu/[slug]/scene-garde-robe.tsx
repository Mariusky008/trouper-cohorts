"use client";

// 👗 L'ÉTAPE 2, SON DEUXIÈME TEMPS : LEUR GARDE-ROBE RENCONTRE LA SIENNE.
//
// « Il faudrait préciser à l'étape 2 que les clients peuvent essayer la tenue
// du magasin à partir de leur photo, mais aussi en fouillant dans la
// garde-robe qu'ils auront au préalable enregistrée sur ClikMe, pour voir si
// dans le magasin il y a quelque chose qui irait avec tel ou tel de leurs
// vêtements. C'est une super fonctionnalité : incorpore-la à l'étape 2 avec
// un visuel super sympa. »
//
// TROIS GESTES, DE GAUCHE À DROITE, comme on les fait :
//   1. SA GARDE-ROBE, enregistrée sur ClikMe : quatre pièces sur leurs
//      cintres de lumière — et elle touche son jean préféré ;
//   2. LE JEAN PART AU MILIEU : « Qu'est-ce qui irait avec ? » ;
//   3. CHEZ ELLE, la boutique : son fantôme répond, et trois pièces arrivent,
//      chacune marquée « Va avec votre jean ». La première s'allume : on
//      l'essaie avec.
//
// TOUT EST UN EXEMPLE, ET L'ÉCRAN LE DIT. La garde-robe est celle d'une
// cliente de démonstration, et les trois pièces ne sont pas les siennes :
// elles portent chacune « Exemple ». On ne prête pas à sa boutique des pièces
// qu'elle n'a pas — sa propre pièce, ici, est souvent une robe, et dire
// qu'une robe « va avec un jean » serait inventer un conseil.
//
// AUCUN MINUTEUR : la scène naît quand Léa en parle (`setScene("garde")`), et
// tout le reste se joue en CSS, avec des délais. Rien ne reste à arrêter.

const CLIENTE = { qui: "Camille", visage: "/direct/ensemble/fantome-casquette-noire.webp" };

/** Sa garde-robe : les quatre pièces détourées (voir `public/direct/garde-robe`). */
const GARDE_ROBE = [
  { cle: "veste", nom: "Ma veste camel", image: "/direct/garde-robe/veste.webp" },
  { cle: "tshirt", nom: "Mon t-shirt gris", image: "/direct/garde-robe/tshirt.webp" },
  { cle: "jean", nom: "Mon jean préféré", image: "/direct/garde-robe/jean.webp", choisi: true },
  { cle: "baskets", nom: "Mes baskets", image: "/direct/garde-robe/baskets.webp" },
];

/** Ce qui irait avec son jean — des pièces de démonstration, marquées comme telles. */
const AVEC = [
  { nom: "Pull écru et rose", prix: "69 €", photo: "/direct/mode-pull-ecru-rose.webp" },
  { nom: "Pull mohair vert", prix: "79 €", photo: "/direct/mode-pull-mohair-vert.jpeg" },
  { nom: "Chemise à volants", prix: "59 €", photo: "/direct/mode-chemise-volants-rose.jpeg" },
];

export function SceneGardeRobe({ titre, fantome }: { titre: string; fantome: { visage: string; nom: string } }) {
  return (
    <div className="dtour-ov gr-ov">
      <div className="gr">
        <div className="gr-tete">
          <span className="gr-k">Exemple · la garde-robe d&apos;une cliente</span>
          <h3 className="gr-h">{titre}</h3>
        </div>

        <div className="gr-scene">
          {/* ═══ 1 · SA GARDE-ROBE ═══ */}
          <section className="gr-carte gr-garde" aria-label="Sa garde-robe, enregistrée sur ClikMe">
            <header>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gr-av" src={CLIENTE.visage} alt="" />
              <span>
                <b>Ma garde-robe</b>
                <em>Enregistrée sur ClikMe · 12 pièces</em>
              </span>
            </header>
            <div className="gr-grille">
              {GARDE_ROBE.map((p, i) => (
                <figure key={p.cle} className={`gr-piece${p.choisi ? " choisi" : ""}`} style={{ ["--i" as string]: i }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" />
                  <figcaption>{p.nom}</figcaption>
                  {p.choisi && (
                    <>
                      <span className="gr-coche" aria-hidden="true">
                        ✓
                      </span>
                      <span className="gr-doigt" aria-hidden="true">
                        👆
                      </span>
                    </>
                  )}
                </figure>
              ))}
            </div>
          </section>

          {/* ═══ 2 · LE JEAN, AU MILIEU ═══ */}
          <div className="gr-pont" aria-hidden="true">
            <span className="gr-trait" />
            <span className="gr-rond">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/direct/garde-robe/jean.webp" alt="" />
              <i>✨</i>
              <i>✨</i>
            </span>
            <span className="gr-question">Qu&apos;est-ce qui irait avec&nbsp;?</span>
            <span className="gr-trait d" />
          </div>

          {/* ═══ 3 · CHEZ ELLE ═══ */}
          <section className="gr-carte gr-boutique" aria-label={`Ce qui irait avec, chez ${fantome.nom}`}>
            <header>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gr-av f" src={fantome.visage} alt="" />
              <span>
                <b>{fantome.nom}</b>
                <em>son fantôme</em>
              </span>
            </header>
            <p className="gr-dit">Avec votre jean, j&apos;ai ça pour vous&nbsp;😍</p>
            <div className="gr-avec">
              {AVEC.map((p, i) => (
                <figure key={p.nom} className={`gr-prod${i === 0 ? " elu" : ""}`} style={{ ["--i" as string]: i }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo} alt="" />
                  <span className="gr-ex">Exemple</span>
                  <span className="gr-va">💞 Va avec</span>
                  <figcaption>
                    <b>{p.nom}</b>
                    <em>{p.prix}</em>
                  </figcaption>
                </figure>
              ))}
            </div>
            <span className="gr-essai">✨ Essayer avec mon jean</span>
          </section>
        </div>

        <p className="gr-fin">Exemple · une garde-robe et des pièces de démonstration</p>
      </div>
      <StylesGardeRobe />
    </div>
  );
}

function StylesGardeRobe() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dtour-ov.gr-ov{align-items:flex-start;padding-top:76px;padding-bottom:140px;overflow:hidden;}
.gr{position:relative;width:100%;max-width:1000px;margin:0 auto;display:flex;flex-direction:column;gap:14px;pointer-events:auto;}
.gr::before{content:"";position:absolute;inset:-60px -40px;z-index:-1;pointer-events:none;
  background:radial-gradient(40% 50% at 50% 50%,rgba(255,79,160,.2),transparent 70%),radial-gradient(35% 45% at 15% 60%,rgba(245,162,58,.16),transparent 70%);}
.gr-tete{text-align:center;animation:grMonte .5s cubic-bezier(.2,.8,.2,1) both;}
.gr-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#B23A17;
  background:#FDEEE8;border-radius:7px;padding:5px 9px;}
.gr-h{margin:8px auto 0;max-width:640px;font-family:var(--font-clikme),sans-serif;font-size:clamp(20px,2.4vw,28px);font-weight:800;
  line-height:1.15;letter-spacing:-.03em;color:#FFF4E6;text-wrap:balance;}
.gr-scene{display:grid;grid-template-columns:minmax(0,1fr) 170px minmax(0,1.15fr);gap:18px;align-items:center;}

/* ── LES DEUX CARTES : la sienne (sa garde-robe), celle de la boutique ── */
.gr-carte{background:#FFF8F1;border-radius:20px;padding:12px 13px 14px;box-shadow:0 22px 50px rgba(0,0,0,.4);color:#2A1A12;
  animation:grCarte .6s cubic-bezier(.34,1.4,.64,1) both;}
.gr-boutique{animation-delay:1.9s;}
.gr-carte header{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.gr-carte header span{display:flex;flex-direction:column;min-width:0;}
.gr-carte header b{font-size:15px;font-weight:850;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gr-carte header em{font-style:normal;font-size:11.5px;color:#8A6E5C;}
.gr-av{flex:none;width:38px;height:38px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#FFE7D6;border:2px solid #F5A23A;}
.gr-av.f{border-color:#FF4FA0;}

/* SA GARDE-ROBE : quatre pièces, chacune sur son cintre de lumière. */
.gr-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}
.gr-piece{position:relative;margin:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px 8px;border-radius:15px;
  background:radial-gradient(70% 60% at 50% 40%,#fff,#F3E6D8);border:2px solid transparent;
  animation:grPop .45s cubic-bezier(.34,1.5,.64,1) both;animation-delay:calc(.35s + var(--i) * .14s);}
.gr-piece img{width:100%;height:96px;object-fit:contain;filter:drop-shadow(0 8px 10px rgba(60,30,10,.22));}
.gr-piece figcaption{font-size:11.5px;font-weight:750;color:#5A4334;text-align:center;}
/* ELLE TOUCHE SON JEAN : l'anneau rose, la coche, le doigt. */
.gr-piece.choisi{animation:grPop .45s cubic-bezier(.34,1.5,.64,1) both,grChoisi .5s cubic-bezier(.34,1.6,.64,1) 1.25s forwards;
  animation-delay:calc(.35s + var(--i) * .14s),1.25s;}
.gr-coche{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;
  font-size:13px;font-weight:900;color:#fff;background:#FF4FA0;box-shadow:0 4px 10px rgba(255,79,160,.45);
  opacity:0;transform:scale(.4);animation:grApparait .4s cubic-bezier(.34,1.7,.64,1) 1.35s forwards;}
.gr-doigt{position:absolute;right:16%;bottom:22%;font-size:26px;opacity:0;animation:grDoigt 1.1s ease .7s both;}

/* LE PONT : le jean part au milieu, et la question s'allume. */
.gr-pont{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;}
.gr-trait{display:none;}
.gr-rond{position:relative;width:118px;height:118px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle,#fff 0,#FFE9F3 62%,rgba(255,79,160,.0) 72%);
  box-shadow:0 0 0 3px rgba(255,79,160,.55),0 0 46px rgba(255,79,160,.55);
  opacity:0;transform:translateX(-60px) scale(.5);animation:grVole .75s cubic-bezier(.34,1.3,.64,1) 1.55s forwards;}
.gr-rond img{height:84px;width:auto;filter:drop-shadow(0 6px 8px rgba(40,20,60,.3));}
.gr-rond i{position:absolute;font-style:normal;font-size:18px;opacity:0;animation:grEtincelle 1.6s ease 2.2s infinite;}
.gr-rond i:first-of-type{top:2px;right:6px;}
.gr-rond i+i{bottom:6px;left:2px;animation-delay:2.9s;}
.gr-question{padding:7px 13px;border-radius:999px;font-size:13px;font-weight:850;color:#fff;text-align:center;
  background:linear-gradient(90deg,#FF4FA0,#F5A23A);box-shadow:0 8px 20px rgba(255,79,160,.4);
  opacity:0;animation:grApparait .45s cubic-bezier(.34,1.5,.64,1) 2.05s forwards;}
@media (min-width:900px){
  .gr-trait{display:block;position:absolute;top:59px;width:52px;height:3px;border-radius:3px;left:-40px;
    background:repeating-linear-gradient(90deg,#FF8CC8 0 8px,transparent 8px 14px);background-size:28px 3px;
    opacity:0;animation:grApparait .3s ease 1.6s forwards,grFil 1s linear 1.6s infinite;}
  .gr-trait.d{left:auto;right:-40px;animation-delay:2.1s,2.1s;}
}

/* CHEZ ELLE : son fantôme répond, et trois pièces arrivent. */
.gr-dit{margin:0 0 10px;padding:8px 12px;border-radius:14px 14px 14px 5px;font-size:13.5px;font-weight:650;line-height:1.3;
  background:linear-gradient(135deg,#FFE9F3,#FFF1DF);border:1px solid rgba(255,79,160,.28);
  opacity:0;animation:grApparait .4s ease 2.45s forwards;}
.gr-avec{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.gr-prod{position:relative;margin:0;border-radius:14px;overflow:hidden;background:#2A1F1B;box-shadow:0 10px 22px rgba(0,0,0,.25);
  border:2px solid transparent;opacity:0;transform:translateY(16px) scale(.85);
  animation:grProd .55s cubic-bezier(.34,1.5,.64,1) forwards;animation-delay:calc(2.8s + var(--i) * .3s);}
.gr-prod img{display:block;width:100%;aspect-ratio:3 / 4;object-fit:cover;object-position:50% 25%;}
.gr-ex{position:absolute;top:6px;left:6px;padding:2px 6px;border-radius:6px;font-size:9.5px;font-weight:800;color:#FFF4E6;background:rgba(18,12,9,.7);}
.gr-va{position:absolute;left:50%;bottom:46px;transform:translateX(-50%) scale(.6);white-space:nowrap;padding:3px 9px;border-radius:999px;text-align:center;
  font-size:10px;font-weight:850;color:#fff;background:#FF4FA0;box-shadow:0 4px 10px rgba(255,79,160,.45);
  opacity:0;animation:grVa .35s cubic-bezier(.34,1.7,.64,1) forwards;animation-delay:calc(3.15s + var(--i) * .3s);}
.gr-prod figcaption{display:flex;flex-direction:column;padding:6px 7px 7px;background:#FFF8F1;}
.gr-prod figcaption b{font-size:11.5px;font-weight:800;line-height:1.2;color:#2A1A12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gr-prod figcaption em{font-style:normal;font-size:11px;font-weight:700;color:#B23A17;}
/* LA PREMIÈRE S'ALLUME : c'est celle qu'on essaie avec. */
.gr-prod.elu{animation:grProd .55s cubic-bezier(.34,1.5,.64,1) forwards,grElu .6s ease 4.3s forwards;animation-delay:2.8s,4.3s;}
.gr-essai{display:block;width:max-content;margin:12px auto 0;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:850;color:#fff;
  background:linear-gradient(90deg,#FF4FA0,#FF7AB8);box-shadow:0 10px 24px rgba(255,79,160,.45);
  opacity:0;animation:grApparait .45s cubic-bezier(.34,1.5,.64,1) 4.5s forwards,grBat 1.4s ease-in-out 5.1s infinite;}
.gr-fin{margin:2px 0 0;text-align:center;font-size:12px;color:rgba(255,244,230,.6);opacity:0;animation:grApparait .4s ease 3s forwards;}

@keyframes grMonte{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes grCarte{from{opacity:0;transform:translateY(22px) scale(.92)}to{opacity:1;transform:none}}
@keyframes grPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes grChoisi{to{border-color:#FF4FA0;box-shadow:0 0 0 4px rgba(255,79,160,.22),0 10px 22px rgba(255,79,160,.3);transform:scale(1.05);}}
@keyframes grApparait{to{opacity:1;transform:none}}
@keyframes grDoigt{0%{opacity:0;transform:translate(18px,22px)}35%{opacity:1;transform:none}55%{transform:scale(.85)}75%{opacity:1;transform:none}100%{opacity:0;transform:translate(6px,10px)}}
@keyframes grVole{to{opacity:1;transform:none}}
@keyframes grEtincelle{0%,100%{opacity:0;transform:scale(.5)}40%{opacity:1;transform:scale(1.15)}}
@keyframes grFil{to{background-position:28px 0}}
@keyframes grProd{to{opacity:1;transform:none}}
@keyframes grElu{to{border-color:#FF4FA0;box-shadow:0 0 0 4px rgba(255,79,160,.25),0 14px 28px rgba(255,79,160,.35);transform:translateY(-4px) scale(1.04);}}
@keyframes grVa{to{opacity:1;transform:translateX(-50%)}}
@keyframes grBat{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}

/* ═══ SUR UN TÉLÉPHONE : DE HAUT EN BAS ═══ Sa garde-robe en une rangée,
   le jean au milieu, la boutique en dessous. Tout doit tenir au-dessus de la
   légende de Léa. */
@media (max-width:899px){
  /* « PASSER ✕ » EST EN HAUT À DROITE : l'étiquette passe dessous. */
  .dtour-ov.gr-ov{padding-top:88px;padding-left:12px;padding-right:12px;padding-bottom:126px;}
  .gr-k{font-size:9.5px;letter-spacing:.1em;}
  .gr{gap:8px;}
  .gr-h{font-size:19px;margin-top:6px;}
  .gr-scene{grid-template-columns:1fr;gap:8px;}
  .gr-carte{padding:9px 10px 10px;border-radius:17px;}
  .gr-carte header{margin-bottom:6px;}
  .gr-carte header b{font-size:13.5px;}
  .gr-av{width:30px;height:30px;}
  .gr-grille{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;}
  .gr-piece{padding:6px 4px 5px;border-radius:12px;}
  .gr-piece img{height:52px;}
  .gr-piece figcaption{font-size:9.5px;line-height:1.15;}
  .gr-coche{width:18px;height:18px;font-size:10px;top:3px;right:3px;}
  .gr-doigt{font-size:20px;}
  .gr-pont{flex-direction:row;justify-content:center;gap:10px;}
  .gr-rond{width:62px;height:62px;transform:translateY(-30px) scale(.5);}
  .gr-rond img{height:46px;}
  .gr-rond i{font-size:13px;}
  .gr-question{font-size:12px;padding:6px 11px;}
  .gr-dit{font-size:12.5px;margin-bottom:7px;padding:6px 10px;}
  .gr-avec{gap:6px;}
  .gr-prod img{aspect-ratio:4 / 4.4;}
  .gr-va{bottom:38px;font-size:9px;padding:2px 7px;}
  .gr-prod figcaption{padding:4px 6px 5px;}
  .gr-prod figcaption b{font-size:10.5px;}
  .gr-essai{margin-top:8px;padding:8px 15px;font-size:13px;}
  .gr-fin{font-size:11px;}
}
@media (max-width:899px) and (max-height:760px){
  .gr-h{font-size:17px;}
  .gr-prod img{aspect-ratio:1 / 1;}
  .gr-dit{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .gr-tete,.gr-carte,.gr-piece,.gr-rond,.gr-question,.gr-dit,.gr-prod,.gr-essai,.gr-fin,.gr-coche,.gr-trait{animation:none !important;opacity:1;transform:none;}
  .gr-va{animation:none !important;opacity:1;transform:translateX(-50%);}
  .gr-doigt,.gr-rond i{display:none;}
  .gr-piece.choisi,.gr-prod.elu{border-color:#FF4FA0;}
}
`,
      }}
    />
  );
}
