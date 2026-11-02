/**
 * 🏆 « MA COLLECTION », POUR QUI N'A PAS ENCORE DE FIGURINE — la page ne s'ouvre plus sur du vide : on y comprend en
 * une minute à quoi sert la collection, et où la commencer.
 *   · LA VITRINE : cinq cartes qui se déploient — l'édition du moment, les deux suivantes, une rare, la figurine d'or ;
 *   · EN CE MOMENT : l'édition qu'on gagne en venant aujourd'hui, et le temps qui reste (`editionsDuMoment`) ;
 *   · CE QUE ÇA RAPPORTE : les trois paliers (`PALIERS_COLLECTION`), dits concrètement ;
 *   · COMMENT ON LA GAGNE : la cage, la visite notée au comptoir, la figurine ;
 *   · OÙ LA COMMENCER : les commerces ClikMe (`page.tsx`), avec leur cadeau à 10 s'ils l'ont écrit eux-mêmes.
 * Celui qui collectionne déjà retrouve « Comment ça marche ? » sous ses étagères, et les autres commerces à commencer.
 */
import type { CSSProperties } from "react";
import { EDITIONS_DATEES, PALIERS_COLLECTION, TOTAL_COLLECTION, editionsDuMoment, fenetre, jourEnClair } from "@/lib/direct/collection";
import { Particules, THEMES, type Theme } from "@/app/f/[slug]/collection";
import { SEUIL_MA_FIGURINE } from "@/lib/direct/ma-figurine";

export type CommerceACollectionner = { slug: string; nom: string; ville: string; figurine: string; cadeau?: string };

const FIGURINE_PAR_DEFAUT = "/direct/double/pied/salut-1.webp";
const OR: Theme = { a: "#FFE7A0", b: "#B8801E", parts: ["✨", "⭐", "🏆"] };

/** Les cinq cartes de la vitrine, dans l'ordre du calendrier, jusqu'à l'or. */
function cartesDeLaVitrine(aujourdhui: string) {
  const { maintenant } = editionsDuMoment(aujourdhui);
  const suivantes = EDITIONS_DATEES.map((e) => ({ e, f: fenetre(e, aujourdhui) }))
    .filter(({ e, f }) => f.debut > aujourdhui && e.cle !== maintenant?.cle)
    .sort((a, b) => a.f.debut.localeCompare(b.f.debut))
    .map(({ e }) => ({ cle: e.cle, nom: e.nom, emoji: e.emoji, sorte: e.sorte as string }));
  const datees = [...(maintenant ? [{ cle: maintenant.cle, nom: maintenant.nom, emoji: maintenant.emoji, sorte: "maintenant" }] : []), ...suivantes].slice(0, 3);
  return [...datees, { cle: "rare", nom: "Rare", emoji: "✨", sorte: "rare" }, { cle: "or", nom: "D’or", emoji: "🏆", sorte: "or" }];
}

function Vitrine({ aujourdhui, figurine }: { aujourdhui: string; figurine: string }) {
  const cartes = cartesDeLaVitrine(aujourdhui);
  const milieu = (cartes.length - 1) / 2;
  return (
    <div className="dc-vitrine" aria-hidden="true">
      {cartes.map((c, i) => {
        const k = i - milieu;
        const t = c.cle === "or" ? OR : (THEMES[c.cle] ?? THEMES.rare);
        return (
          <span
            key={c.cle}
            className={`dc-carte ${c.sorte}`}
            style={
              {
                "--a": t.a,
                "--b": t.b,
                "--fin": `translateX(${k * 58}px) translateY(${Math.abs(k) * 12}px) rotate(${k * 8}deg)`,
                "--d": `${0.15 + i * 0.12}s`,
                zIndex: i + 1,
              } as CSSProperties
            }
          >
            <span className="dc-carte-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={figurine} alt="" draggable={false} />
              <em title={c.nom}>{c.emoji}</em>
              {c.sorte === "or" && <i className="dc-eclat" />}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** « du 1er au 24 décembre », « du 21 décembre au 19 mars ». */
const duAu = (a: string, b: string) =>
  a.slice(5, 7) === b.slice(5, 7) ? `du ${jourEnClair(a).split(" ")[0]} au ${jourEnClair(b)}` : `du ${jourEnClair(a)} au ${jourEnClair(b)}`;

function EnCeMoment({ aujourdhui }: { aujourdhui: string }) {
  const { maintenant: m, ensuite } = editionsDuMoment(aujourdhui);
  if (!m) return null;
  const t = THEMES[m.cle] ?? THEMES.rare;
  return (
    <section className="dc-moment" style={{ "--a": t.a, "--b": t.b } as CSSProperties} aria-label="L’édition du moment">
      <Particules theme={t} n={10} />
      <span className="dc-ruban">EN CE MOMENT</span>
      <span className="dc-moment-emoji" aria-hidden="true">
        {m.emoji}
      </span>
      <b className="dc-moment-nom">Édition {m.nom}</b>
      <span className="dc-puce">
        ⏳ encore {m.jours} jour{m.jours > 1 ? "s" : ""} · jusqu’au {jourEnClair(m.fin)}
      </span>
      <p>Une visite dans un commerce ClikMe d’ici là, et elle est à toi. Après, elle ne revient pas : une édition manquée est manquée.</p>
      {ensuite && (
        <small>
          Puis {ensuite.emoji} {ensuite.nom}, {duAu(ensuite.debut, ensuite.fin)}
        </small>
      )}
    </section>
  );
}

const CE_QUE_CA_RAPPORTE: Record<number, string> = {
  3: "Une table qui se libère, un créneau annulé : tu le sais avant les autres.",
  6: "Quand il lui reste une place, le message part d’abord chez toi.",
  [TOTAL_COLLECTION]: "Numérotée, rien que pour toi. Et le cadeau du commerce, s’il en a choisi un : c’est écrit sur sa page.",
};

function CeQueCaRapporte() {
  return (
    <section className="dc-bloc" aria-labelledby="dc-rapporte">
      <h2 id="dc-rapporte">Ce que ça te rapporte</h2>
      <div className="dc-jauge" aria-hidden="true">
        <i />
        {PALIERS_COLLECTION.map((p) => (
          <span key={p.n} style={{ left: `${(p.n / TOTAL_COLLECTION) * 100}%` }}>
            {p.emoji}
          </span>
        ))}
      </div>
      <ul className="dc-paliers">
        {PALIERS_COLLECTION.map((p, i) => (
          <li key={p.n} style={{ "--d": `${0.1 + i * 0.12}s` } as CSSProperties}>
            <span className="dc-med">{p.emoji}</span>
            <span>
              <small>
                {p.n} figurines{p.n === TOTAL_COLLECTION ? " · la collection complète" : ""}
              </small>
              <b>{p.n === TOTAL_COLLECTION ? p.titre : p.dit.charAt(0).toUpperCase() + p.dit.slice(1)}</b>
              <span>{CE_QUE_CA_RAPPORTE[p.n]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="dc-rares">
        <b>✨ Et 2 éditions rares</b> : elles ne se gagnent qu’en venant le jour où le commerce annonce une place libre.
      </p>
      <div className="dc-a-toi">
        <span className="dc-a-toi-fig" aria-hidden="true">
          🗣️
        </span>
        <span>
          <small>{SEUIL_MA_FIGURINE} figurines, tous commerces confondus</small>
          <b>Ta propre figurine</b>
          <span>Elle parle avec ta voix. Tu l’envoies à tes proches, et elle cite tes commerces préférés.</span>
        </span>
      </div>
    </section>
  );
}

const ETAPES = [
  { emoji: "👻", titre: "Libère ton fantôme", dit: "Sur la page d’un commerce ClikMe (le lien de sa vidéo, ou le QR code de son comptoir), touche une cage : tu entres dans sa famille. Sans compte, sans appli." },
  { emoji: "🚪", titre: "Passe le voir", dit: "Ta visite est notée au comptoir. Une visite, une figurine : celle de l’édition du moment." },
  { emoji: "🏆", titre: "Collectionne", dit: "Elle t’attend ici et sur sa page. Reviens à chaque saison, à chaque fête : à 10, la figurine d’or." },
];

function CommentOnGagne() {
  return (
    <section className="dc-bloc" aria-labelledby="dc-comment">
      <h2 id="dc-comment">Comment on la gagne</h2>
      <ol className="dc-etapes">
        {ETAPES.map((e, i) => (
          <li key={e.titre} style={{ "--d": `${0.1 + i * 0.12}s` } as CSSProperties}>
            <span className="dc-num">
              <b>{i + 1}</b>
              <em aria-hidden="true">{e.emoji}</em>
            </span>
            <span>
              <b>{e.titre}</b>
              <span>{e.dit}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OuCommencer({ commerces, titre, aujourdhui }: { commerces: CommerceACollectionner[]; titre: string; aujourdhui: string }) {
  if (!commerces.length) return null;
  const m = editionsDuMoment(aujourdhui).maintenant;
  const t = (m && THEMES[m.cle]) || THEMES.rare;
  return (
    <section className="dc-bloc" aria-labelledby="dc-ou">
      <h2 id="dc-ou">{titre}</h2>
      <ul className="dc-commerces">
        {commerces.map((c) => (
          <li key={c.slug}>
            <a href={`/f/${encodeURIComponent(c.slug)}`} style={{ "--a": t.a, "--b": t.b } as CSSProperties}>
              <span className="dc-com-fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.figurine} alt="" draggable={false} loading="lazy" />
                {m && <em aria-hidden="true">{m.emoji}</em>}
              </span>
              <b>{c.nom}</b>
              {c.ville && <small>{c.ville}</small>}
              {c.cadeau && <span className="dc-com-cadeau">🎁 à 10 : {c.cadeau}</span>}
              <span className="dc-com-voir">Sa page ›</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Qui n'a encore rien : la page entière. */
export function Decouvrir({ aujourdhui, commerces }: { aujourdhui: string; commerces: CommerceACollectionner[] }) {
  return (
    <div className="dc">
      <section className="dc-haut">
        <Vitrine aujourdhui={aujourdhui} figurine={commerces[0]?.figurine ?? FIGURINE_PAR_DEFAUT} />
        <b className="dc-accroche">Chaque commerce ClikMe a sa figurine.</b>
        <p>
          Tu la gagnes en venant le voir, dans l’édition du moment. {TOTAL_COLLECTION} à collectionner chez chacun : la dixième est en or.
        </p>
      </section>
      <EnCeMoment aujourdhui={aujourdhui} />
      <CeQueCaRapporte />
      <CommentOnGagne />
      <OuCommencer commerces={commerces} titre="Où commencer ta collection" aujourdhui={aujourdhui} />
      <p className="dc-deja">Tu as déjà des figurines ? Ouvre cette page sur le téléphone où tu as libéré ton fantôme.</p>
    </div>
  );
}

/** Qui collectionne déjà : « Comment ça marche ? », replié, et les commerces où il n'a pas encore de collection. */
export function EnSavoirPlus({ aujourdhui, commerces }: { aujourdhui: string; commerces: CommerceACollectionner[] }) {
  return (
    <div className="dc">
      <OuCommencer commerces={commerces} titre="D’autres collections à commencer" aujourdhui={aujourdhui} />
      <details className="dc-plus">
        <summary>Comment ça marche ?</summary>
        <CeQueCaRapporte />
        <CommentOnGagne />
      </details>
    </div>
  );
}

export const STYLES_DECOUVRIR = `
.dc{padding:0 16px}
.dc-haut{margin:6px 0 0;text-align:center}
.dc-vitrine{position:relative;height:236px;margin:4px auto 0;max-width:360px}
.dc-carte{position:absolute;left:50%;top:18px;width:104px;height:144px;margin-left:-52px;transform:var(--fin);animation:dc-donne .8s cubic-bezier(.2,1.3,.4,1) var(--d) both}
.dc-carte-in{position:absolute;inset:0;display:block;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b));border:1.5px solid rgba(255,255,255,.3);box-shadow:0 14px 26px -12px rgba(0,0,0,.9);animation:dc-flotte 3.4s ease-in-out calc(var(--d) + .9s) infinite}
.dc-carte-in img{position:absolute;left:8%;bottom:-2px;width:84%;height:84%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45))}
.dc-carte-in em{position:absolute;left:7px;top:6px;font-style:normal;font-size:21px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}
.dc-carte.maintenant .dc-carte-in{border-color:#F2C46B;box-shadow:0 0 0 2px rgba(242,196,107,.4),0 14px 30px -10px rgba(242,196,107,.6)}
.dc-carte.rare .dc-carte-in{border:2px solid transparent;background:linear-gradient(135deg,#E2D6FF,#9C84FF 40%,#FF9BE0 70%,#9AF0FF) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%;animation:dc-flotte 3.4s ease-in-out calc(var(--d) + .9s) infinite,co-holo 4s linear infinite}
.dc-carte.or .dc-carte-in{border-color:#FFE7A0;box-shadow:0 0 30px rgba(255,214,120,.7),0 14px 26px -12px rgba(0,0,0,.9)}
.dc-carte.or img{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.08) drop-shadow(0 0 12px rgba(255,214,120,.9))}
.dc-eclat{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.7) 50%,transparent 65%);transform:translateX(-120%);animation:co-reflet 3s ease-in-out 1.6s infinite}
.dc-accroche{display:block;margin:6px 0 0;font-size:21px;line-height:1.2;font-weight:900;letter-spacing:-.01em}
.dc-haut p{margin:6px auto 0;max-width:330px;color:#D9C3CB}
.dc-moment{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;margin:22px 0 0;padding:38px 16px 18px;border-radius:24px;overflow:hidden;text-align:center;
  background:radial-gradient(90% 70% at 50% 25%,color-mix(in srgb,var(--a) 70%,transparent),transparent 70%),linear-gradient(160deg,var(--b),#1A0814 85%);border:1.5px solid color-mix(in srgb,var(--a) 70%,transparent);
  animation:co-lueur 2.8s ease-in-out infinite}
.dc-ruban{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);font-size:10.5px;font-weight:900;letter-spacing:.16em;white-space:nowrap}
.dc-moment-emoji{font-size:46px;line-height:1;animation:co-tourne 4s ease-in-out infinite}
.dc-moment-nom{font-size:24px;font-weight:900;letter-spacing:-.01em;text-shadow:0 2px 12px rgba(0,0,0,.45)}
.dc-puce{padding:5px 12px;border-radius:999px;background:rgba(0,0,0,.35);font-size:12.5px;font-weight:800}
.dc-moment p{position:relative;margin:4px 0 0;max-width:300px;font-size:13.5px;line-height:1.4;color:rgba(255,244,230,.92)}
.dc-moment small{position:relative;font-size:12px;font-weight:700;color:rgba(255,244,230,.75)}
.dc-bloc{margin:28px 0 0}
.dc-bloc h2{margin:0 0 12px;font-size:22px;line-height:1.15;font-weight:900;letter-spacing:-.02em}
.dc-jauge{position:relative;height:12px;margin:22px 14px 22px 6px;border-radius:999px;background:rgba(255,255,255,.1)}
.dc-jauge i{position:absolute;inset:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#FF8FCB 55%,#F2C46B);box-shadow:0 0 18px rgba(255,46,154,.6);transform-origin:left;animation:dc-remplir 2.4s cubic-bezier(.4,0,.2,1) .3s both}
.dc-jauge span{position:absolute;top:50%;display:grid;place-items:center;width:32px;height:32px;margin:-16px 0 0 -16px;border-radius:50%;background:#3A1A10;border:2px solid #F2C46B;font-size:16px;box-shadow:0 0 14px rgba(242,196,107,.6)}
.dc-paliers,.dc-etapes{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.dc-paliers li{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:18px;background:linear-gradient(90deg,rgba(242,196,107,.12),rgba(255,46,154,.06));border:1px solid rgba(242,196,107,.3);animation:mc-entre .6s cubic-bezier(.2,.9,.3,1) var(--d) both}
.dc-med{flex:none;font-size:30px;line-height:1.1}
.dc-paliers small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#F2C46B}
.dc-paliers b{display:block;margin-top:1px;font-size:16px;line-height:1.25}
.dc-paliers li span span,.dc-etapes li > span:last-child > span{display:block;margin-top:2px;font-size:13px;line-height:1.4;color:#D9C3CB}
.dc-rares{margin:12px 0 0;padding:12px 14px;border-radius:18px;font-size:13px;line-height:1.4;color:#D9C3CB;border:2px solid transparent;
  background:linear-gradient(#1E0C18,#1E0C18) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%;animation:co-holo 5s linear infinite}
.dc-rares b{color:#FFF4E6}
.dc-a-toi{display:flex;gap:12px;align-items:center;margin:10px 0 0;padding:12px 14px;border-radius:18px;background:linear-gradient(135deg,rgba(255,46,154,.2),rgba(242,196,107,.16));border:1px solid rgba(242,196,107,.45)}
.dc-a-toi-fig{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#FF2E9A,#7B1B5E);font-size:26px;animation:co-tourne 3.4s ease-in-out infinite}
.dc-a-toi small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#F2C46B}
.dc-a-toi b{display:block;margin-top:1px;font-size:16px}
.dc-a-toi span span{display:block;margin-top:2px;font-size:13px;line-height:1.4;color:#D9C3CB}
.dc-etapes{position:relative}
.dc-etapes::before{content:"";position:absolute;left:23px;top:24px;bottom:24px;width:2px;background:linear-gradient(#FF2E9A,#F2C46B);opacity:.5}
.dc-etapes li{position:relative;display:flex;gap:14px;align-items:flex-start;animation:mc-entre .6s cubic-bezier(.2,.9,.3,1) var(--d) both}
.dc-num{position:relative;flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#FF2E9A,#7B1B5E);box-shadow:0 8px 18px -8px rgba(255,46,154,.8)}
.dc-num b{font-size:20px;font-weight:900}
.dc-num em{position:absolute;right:-6px;bottom:-4px;font-style:normal;font-size:20px}
.dc-etapes li > span:last-child{padding-top:3px}
.dc-etapes li > span:last-child > b{display:block;font-size:16px}
.dc-commerces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none}
.dc-commerces a{position:relative;display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:10px 10px 12px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#FFF4E6;text-decoration:none;transition:transform .2s}
.dc-commerces a:active{transform:scale(.97)}
.dc-com-fig{position:relative;display:block;height:118px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b))}
.dc-com-fig img{position:absolute;left:10%;bottom:-2px;width:80%;height:92%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45))}
.dc-com-fig em{position:absolute;right:6px;top:5px;font-style:normal;font-size:18px}
.dc-commerces b{display:block;margin-top:8px;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
.dc-commerces small{display:block;font-size:12px;color:#A88E99}
.dc-com-cadeau{display:block;margin-top:6px;font-size:12px;line-height:1.3;color:#F2C46B;overflow-wrap:anywhere}
.dc-com-voir{display:block;margin-top:auto;padding-top:8px;font-size:12.5px;font-weight:800;color:#FF7AC0}
.dc-deja{margin:24px 4px 0;font-size:12.5px;line-height:1.45;color:#A88E99;text-align:center}
.dc-plus{margin:24px 0 0;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:0 14px}
.dc-plus summary{padding:14px 0;font-weight:800;cursor:pointer;list-style:none}
.dc-plus summary::-webkit-details-marker{display:none}
.dc-plus summary::after{content:"＋";float:right;color:#FF7AC0}
.dc-plus[open] summary::after{content:"－"}
.dc-plus .dc-bloc{margin:4px 0 16px}
@keyframes dc-donne{from{transform:translateY(80px) scale(.5) rotate(0);opacity:0}}
@keyframes dc-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes dc-remplir{from{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){.dc *{animation:none!important}}
`;
