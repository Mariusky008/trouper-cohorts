"use client";

// 🏠 MA MAISON, À L'ÉTAPE 3 — la seconde façon d'être découvert.
//
// « On a oublié la fonction quasiment essentielle et différenciante, "Ma
// Maison", qui permet à notre IA de comprendre les goûts des gens et qui
// propose des choses. J'ai un jean dans ma garde-robe que j'ai créée sur
// ClikMe, Lili Ross a un pull qui serait assorti à mon jean, alors ClikMe dépose
// dans ma Maison une surprise : moi avec mon jean et ce pull, directement sur
// moi. La cliente n'a même pas besoin de chercher. […] C'est probablement cela
// qu'il faut absolument faire comprendre au commerçant. »
//
// QUATRE TEMPS, UN PAR PHRASE DE LÉA (`n`) :
//   0. « Là, ClikMe apprend progressivement ce que chacun aime et ce qu'il
//      possède déjà » — sa Maison : ses goûts appris, son Dressing ;
//   1. « …votre Fantôme peut le lui rapporter comme une surprise » — le
//      fantôme de la boutique arrive, un cadeau dans les bras, et la surprise
//      se pose : elle, dans son jean et ce pull ; son jean s'allume ;
//   2. « Cette personne ne vous suivait pas… et pourtant, votre pièce vient
//      d'arriver chez elle » — trois raisons barrées, et l'arrivée ;
//   3. « Elle peut alors voir pourquoi ClikMe l'a choisie, l'essayer,
//      demander l'avis de ses amis… puis vous demander de la mettre de côté »
//      — les quatre gestes s'allument, un à un.
//
// TOUT EST UN EXEMPLE, ET L'ÉCRAN LE DIT : la Maison est celle d'une cliente
// de démonstration, le pull n'est pas une pièce de sa boutique (la sienne est
// souvent une robe, et dire qu'une robe « va avec un jean » serait inventer un
// conseil). Les deux portent « Exemple ».
import type { CSSProperties } from "react";

const CLIENTE = { qui: "Camille", visage: "/direct/ensemble/fantome-casquette-noire.webp" };
/** Ce que ClikMe a appris d'elle, au fil de ses gestes. */
const GOUTS = ["Casual chic", "Mailles douces", "Tons clairs"];
/** Son Dressing — les mêmes pièces que l'étape 2 (`scene-garde-robe.tsx`). */
const DRESSING = [
  { cle: "veste", nom: "Veste camel", image: "/direct/garde-robe/veste.webp" },
  { cle: "tshirt", nom: "T-shirt gris", image: "/direct/garde-robe/tshirt.webp" },
  { cle: "jean", nom: "Jean préféré", image: "/direct/garde-robe/jean.webp", choisi: true },
  { cle: "baskets", nom: "Baskets", image: "/direct/garde-robe/baskets.webp" },
];
/** La surprise : elle, dans son jean et le pull — une photo de démonstration. */
const SURPRISE = { nom: "Pull écru et rose", photo: "/direct/mode-pull-ecru-rose.webp" };
const NE_PAS = ["Ne vous suivait pas", "Ne cherchait pas votre boutique", "Ne vous connaissait pas"];
const GESTES: [string, string][] = [
  ["💡", "Pourquoi ? Il va avec son jean préféré"],
  ["✨", "Essayé sur elle"],
  ["💬", "Ses amies donnent leur avis"],
  ["🛍️", "Mise de côté demandée"],
];

export function SceneMaison({ n, fantome, pied }: { n: number; fantome: { visage: string; nom: string }; pied?: string }) {
  return (
    <div className="dtour-ov dt-noir smz-ov">
      <div className={`smz n${Math.min(n, 3)}`}>
        <div className="smz-tete">
          <span className="smz-k">Exemple · la Maison d&apos;une cliente</span>
          <h3 className="smz-h">Ma Maison</h3>
        </div>

        <div className="smz-maison">
          <header className="smz-qui">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CLIENTE.visage} alt="" />
            <span>
              <b>La Maison de {CLIENTE.qui}</b>
              <em>Exemple · ClikMe apprend ce qu&apos;elle aime</em>
            </span>
          </header>

          <div className="smz-cols">
            {/* ═══ CE QUE CLIKME SAIT D'ELLE ═══ */}
            <div className="smz-elle">
              <p className="smz-l">Ce qu&apos;elle aime</p>
              <div className="smz-gouts">
                {GOUTS.map((g, i) => (
                  <span key={g} style={{ "--i": i } as CSSProperties}>
                    ✦ {g}
                  </span>
                ))}
              </div>
              <p className="smz-l">Son Dressing</p>
              <div className="smz-dressing">
                {DRESSING.map((p, i) => (
                  <figure key={p.cle} className={p.choisi && n >= 1 ? "choisi" : undefined} style={{ "--i": i } as CSSProperties}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" />
                    <figcaption>{p.nom}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* ═══ SES SURPRISES — là où le fantôme de la boutique dépose la sienne ═══ */}
            <div className={`smz-surprises${n >= 1 ? " on" : ""}`}>
              <p className="smz-l">Ses surprises</p>
              {n < 1 && <p className="smz-vide">Rien pour l&apos;instant…</p>}
              {n >= 1 && (
                <>
                  <span className="smz-fantome" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pied ? `${pied}salut-1.webp` : fantome.visage} alt="" />
                    <i>🎁</i>
                  </span>
                  <article className="smz-carte">
                    <div className="smz-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={SURPRISE.photo} alt="" />
                      <span className="smz-ex">Exemple</span>
                    </div>
                    <div className="smz-txt">
                      <span className="smz-de">🎁 Une surprise de {fantome.nom}</span>
                      <b>{SURPRISE.nom}</b>
                      <em>Sur elle, avec son jean préféré</em>
                      {n >= 2 && (
                        <div className="smz-pas">
                          {/* UNE CROIX, PAS UNE RATURE : barré, « ne vous suivait pas » se
                              lisait « c'est faux qu'elle ne vous suivait pas ». */}
                          {NE_PAS.map((x, i) => (
                            <span key={x} className="smz-non" style={{ "--i": i } as CSSProperties}>
                              <i aria-hidden="true">✕</i> {x}
                            </span>
                          ))}
                          <span className="smz-arrivee">✓ Et pourtant, elle l&apos;a reçue</span>
                        </div>
                      )}
                    </div>
                    {/* LES QUATRE GESTES SOUS LA PHOTO, SUR TOUTE LA LARGEUR : dans la
                        colonne du texte, ils s'empilaient sur six lignes d'un petit
                        téléphone et poussaient la scène sous la légende. */}
                    {n >= 3 && (
                      <ul className="smz-gestes">
                        {GESTES.map(([ic, x], i) => (
                          <li key={x} style={{ "--i": i } as CSSProperties}>
                            <span aria-hidden="true">{ic}</span> {x}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <StylesMaison />
    </div>
  );
}

function StylesMaison() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dtour-ov.smz-ov{align-items:flex-start;justify-content:flex-start;padding-top:78px;padding-bottom:130px;overflow:hidden;}
.smz{width:100%;max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:12px;animation:smzMonte .5s cubic-bezier(.2,.8,.2,1) both;}
.smz-tete{text-align:center;}
.smz-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#B23A17;
  background:#FDEEE8;border-radius:7px;padding:5px 9px;}
.smz-h{margin:8px 0 0;font-family:var(--font-clikme),sans-serif;font-size:clamp(22px,2.6vw,30px);font-weight:800;letter-spacing:-.03em;color:#FFF4E6;}
.smz-maison{background:#FFF8F1;border-radius:22px;padding:14px 16px 16px;box-shadow:0 22px 50px rgba(0,0,0,.45);color:#2A1708;}
.smz-qui{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #F0E2D4;}
.smz-qui img{width:38px;height:38px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#FFE9D6;}
.smz-qui span{display:flex;flex-direction:column;}
.smz-qui b{font-size:15px;font-weight:800;}
.smz-qui em{font-style:normal;font-size:12px;color:#9A7F69;}
.smz-cols{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:16px;margin-top:10px;}
.smz-l{margin:4px 0 6px;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#B4600F;}
.smz-gouts{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}
.smz-gouts span{padding:5px 10px;border-radius:999px;font-size:12.5px;font-weight:700;color:#7A3E0C;background:#FFE9D2;
  animation:smzPop .4s cubic-bezier(.34,1.5,.64,1) calc(.4s + var(--i) * .45s) both;}
.smz-dressing{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;}
.smz-dressing figure{margin:0;padding:6px 4px 5px;border-radius:12px;background:#F7EDE3;text-align:center;border:2px solid transparent;
  transition:border-color .4s ease,background .4s ease,transform .4s ease;animation:smzPop .4s ease calc(1.6s + var(--i) * .15s) both;}
.smz-dressing img{display:block;width:100%;height:58px;object-fit:contain;}
.smz-dressing figcaption{margin-top:3px;font-size:10px;font-weight:700;color:#6E5A4E;line-height:1.15;}
.smz-dressing figure.choisi{border-color:#F5A23A;background:#FFF0DA;transform:translateY(-3px);}
.smz-surprises{position:relative;border-radius:16px;padding:6px 10px 10px;background:#FBF3EA;min-height:150px;}
.smz-vide{margin:22px 0 0;text-align:center;font-size:13px;color:#B3A08F;font-style:italic;}
.smz-fantome{position:absolute;right:-14px;top:-34px;z-index:3;width:74px;height:74px;pointer-events:none;
  animation:smzVole 1.1s cubic-bezier(.3,.7,.3,1) both;}
.smz-fantome img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35));}
.smz-fantome i{position:absolute;left:-6px;bottom:4px;font-size:24px;font-style:normal;animation:smzPop .4s ease .9s both;}
.smz-carte{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 10px;align-items:start;padding:8px;border-radius:14px;background:#fff;
  box-shadow:0 10px 26px rgba(245,162,58,.28);border:1.5px solid rgba(245,162,58,.6);animation:smzCadeau .55s cubic-bezier(.34,1.45,.64,1) .85s both;}
.smz-photo{position:relative;flex:none;width:96px;height:132px;border-radius:10px;overflow:hidden;}
.smz-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 30%;}
.smz-ex{position:absolute;left:5px;top:5px;padding:2px 6px;border-radius:6px;font-size:9.5px;font-weight:800;color:#fff;background:rgba(0,0,0,.55);}
.smz-txt{display:flex;flex-direction:column;gap:2px;min-width:0;}
.smz-de{font-size:11.5px;font-weight:800;color:#B4600F;}
.smz-txt b{font-size:15px;font-weight:800;}
.smz-txt em{font-style:normal;font-size:12px;color:#7D6656;}
.smz-pas{display:flex;flex-direction:column;gap:3px;margin-top:6px;}
.smz-non{font-size:11.5px;color:#7D6656;animation:smzPop .35s ease calc(var(--i) * .9s) both;}
.smz-non i{font-style:normal;font-weight:900;color:#E8576E;}
.smz-arrivee{margin-top:2px;font-size:12.5px;font-weight:800;color:#1E8A55;animation:smzPop .4s cubic-bezier(.34,1.5,.64,1) 3s both;}
.smz-gestes{grid-column:1 / -1;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;}
.smz-gestes li{padding:4px 8px;border-radius:9px;font-size:12px;font-weight:700;color:#2A1708;background:#FFF0DA;
  animation:smzAllume .45s ease calc(.2s + var(--i) * 2.1s) both;}
.smz-gestes li:last-child{background:#FFE3EF;color:#B0185E;}
@keyframes smzMonte{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes smzPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
@keyframes smzCadeau{from{opacity:0;transform:translateY(-10px) scale(.85)}to{opacity:1;transform:none}}
@keyframes smzAllume{from{opacity:.15;transform:translateX(-6px)}to{opacity:1;transform:none}}
@keyframes smzVole{0%{opacity:0;transform:translate(220px,-120px) rotate(10deg)}60%{opacity:1;transform:translate(-8px,6px) rotate(-4deg)}
  100%{opacity:1;transform:none}}
@media (max-width:699px){
  .dtour-ov.smz-ov{padding:100px 12px 120px;}
  .smz{gap:8px;}
  .smz-h{font-size:21px;margin-top:5px;}
  .smz-maison{padding:10px 11px 12px;border-radius:18px;}
  .smz-cols{grid-template-columns:1fr;gap:8px;}
  .smz-dressing img{height:42px;}
  .smz-gouts span{font-size:11.5px;padding:4px 8px;}
  .smz-surprises{min-height:120px;}
  .smz-fantome{width:58px;height:58px;right:-4px;top:-26px;}
  .smz-photo{width:78px;height:108px;}
  /* SUR UN TÉLÉPHONE, LA SURPRISE PREND LA PLACE : à partir de « cette
     personne ne vous suivait pas », ses goûts et son Dressing se replient
     (son jean reste nommé sur la carte). Sinon la scène débordait sous le
     titre de l'étape — vu au test. */
  .smz.n2 .smz-elle,.smz.n3 .smz-elle{display:none;}
  /* LE GRAND TITRE LAISSE SA PLACE : « Exemple » est dans l'en-tête de la
     carte et sur la photo, et l'étiquette passait sous « Passer ». */
  .smz-tete{display:none;}
  .smz-gestes li{font-size:11px;padding:4px 6px;}
}
@media (prefers-reduced-motion:reduce){
  .smz,.smz-gouts span,.smz-dressing figure,.smz-fantome,.smz-fantome i,.smz-carte,.smz-non,.smz-arrivee,.smz-gestes li{animation:none;}
}
`,
      }}
    />
  );
}
