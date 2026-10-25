"use client";

// 🔓 LES TROIS CAGES — à la fin du film d'un commerçant, on libère son fantôme.
//
// Elles remplacent, à cet endroit seulement, les trois petits fantômes d'avis
// (`avis-fantomes.tsx`, qui restent sous les surprises). Voir `lib/direct/cages.ts`
// pour ce que chaque cage veut dire et ce que la personne laisse.
//
// SON FANTÔME, PAS UN AUTRE. Les trois cages contiennent le sien (son look) :
// c'est lui qu'elle libère. Celle qu'elle touche s'ouvre, il s'envole au-dessus
// avec son prénom, les deux autres pâlissent. Toucher une autre cage change
// d'avis, comme les avis qu'elles remplacent.
//
// CE QUI SUIT LE GESTE, ET RIEN D'AUTRE :
//   · « J'adore la vidéo » : le commerçant le saura. Rien n'est demandé.
//   · « Je viendrai un jour » : « Vous voulez qu'il vous prévienne sur WhatsApp
//     quand une table se libère ? » Facultatif, un appui pour passer.
//   · « Aujourd'hui » : la demande au commerçant, celle qui existe déjà.
// On n'annonce rien qui n'existe pas : pas de « vous recevrez ses messages
// dans Ma Maison » tant que Ma Maison ne les montre pas.
import { useState, useSyncExternalStore } from "react";
import { jouerDoux } from "@/lib/direct/sons";
import { abonnerLook, lookDe, monLook } from "@/lib/direct/look";
import { CAGES, libellesCages, numeroWhatsApp, quandPrevenir, type Cage } from "@/lib/direct/cages";

/** Ce que l'appareil garde : la cage, et pour « un jour », sa réponse à « on vous prévient ? ». */
export type ChoixCage = { cage: Cage; whatsapp?: "oui" | "non" };

const lookServeur = () => lookDe(null);

export function CagesFantomes({
  nom,
  branche,
  choix,
  prenom,
  onChoix,
  onWhatsapp,
  onAujourdhui,
}: {
  /** Le nom du commerce. */
  nom: string;
  /** Son métier (`CarteAutour.branche`) : le libellé de la troisième cage en dépend. */
  branche: string;
  choix?: ChoixCage;
  /** Son prénom, s'il le connaît déjà ; sinon « Vous ». */
  prenom: string;
  onChoix: (c: Cage) => void;
  /** Le numéro, ou `null` pour « Non merci ». Rend un message d'erreur, ou `null` si c'est gardé. */
  onWhatsapp: (numero: string | null) => Promise<string | null>;
  /** « Aujourd'hui » : ouvrir la demande au commerçant. */
  onAujourdhui: () => void;
}) {
  const look = useSyncExternalStore(abonnerLook, monLook, lookServeur);
  const fantome = look.debout ?? look.image;
  const libelles = libellesCages(branche);
  /** Un nouveau choix : l'envol repart. */
  const [envol, setEnvol] = useState(0);
  const [numero, setNumero] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  /** « Finalement, prévenez-moi » : elle avait dit non, la question revient. */
  const [redemande, setRedemande] = useState(false);

  const merci: Record<Cage, string> = {
    adore: `Votre fantôme est devant ${nom}, qui saura que vous avez aimé.`,
    "un-jour": `Votre fantôme attend à la porte de ${nom}.`,
    aujourdhui: `Votre fantôme est entré chez ${nom}.`,
  };

  async function garderNumero(n: string | null) {
    if (n !== null && !numeroWhatsApp(n)) {
      setErreur("Ce numéro ne ressemble pas à un numéro de téléphone.");
      return;
    }
    setErreur("");
    setEnvoi(true);
    const e = await onWhatsapp(n);
    setEnvoi(false);
    if (e) setErreur(e);
    else setRedemande(false);
  }

  return (
    <div className={`cg${choix ? " a-choisi" : ""}`}>
      <p className="cg-q" aria-live="polite">
        {choix ? merci[choix.cage] : "Et vous ? Libérez votre fantôme."}
      </p>
      <div className="cg-rang" role="radiogroup" aria-label="Libérer votre fantôme">
        {CAGES.map((c) => {
          const on = choix?.cage === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              className={`cg-c cg-${c}${on ? " on" : ""}`}
              onClick={() => {
                if (on) return;
                jouerDoux("avis", c === "adore" ? 0 : 1);
                setEnvol((n) => n + 1);
                setErreur("");
                onChoix(c);
              }}
            >
              <span className="cg-cage" aria-hidden="true">
                <i className="cg-anneau" />
                <span className="cg-dome">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fantome} alt="" draggable={false} />
                  <i className="cg-porte" />
                </span>
                <i className="cg-socle" />
              </span>
              <span className="cg-l">{libelles[c]}</span>
              {on && (
                <span className="cg-envol" key={envol} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fantome} alt="" draggable={false} />
                  <b>{prenom || "Vous"}</b>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {choix?.cage === "un-jour" && (!choix.whatsapp || redemande) && (
        <form
          className="cg-wa"
          onSubmit={(e) => {
            e.preventDefault();
            void garderNumero(numero);
          }}
        >
          <b>
            Vous voulez que {nom} vous prévienne sur WhatsApp {quandPrevenir(branche)}&nbsp;?
          </b>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="06 12 34 56 78"
            aria-label="Votre numéro WhatsApp"
            maxLength={20}
          />
          {erreur && <span className="cg-err">{erreur}</span>}
          <div className="cg-wa-b">
            <button type="button" onClick={() => void garderNumero(null)} disabled={envoi}>
              Non merci
            </button>
            <button type="submit" className="fort" disabled={envoi || !numero.trim()}>
              Oui, prévenez-moi
            </button>
          </div>
          <small>C’est {nom} qui vous écrira, depuis son WhatsApp. Répondez «&nbsp;stop&nbsp;» quand vous voulez.</small>
        </form>
      )}
      {choix?.cage === "un-jour" && choix.whatsapp === "oui" && (
        <p className="cg-ok">
          C’est noté&nbsp;: {nom} vous écrira sur WhatsApp {quandPrevenir(branche)}. Répondez «&nbsp;stop&nbsp;» quand vous voulez.
        </p>
      )}
      {choix?.cage === "un-jour" && choix.whatsapp === "non" && !redemande && (
        <p className="cg-ok">
          D’accord&nbsp;: votre fantôme attend, sans vous déranger.{" "}
          <button type="button" className="cg-lien" onClick={() => setRedemande(true)}>
            Finalement, prévenez-moi
          </button>
        </p>
      )}
      {choix?.cage === "aujourdhui" && (
        <div className="cg-auj">
          <button type="button" className="fort" onClick={onAujourdhui}>
            <i aria-hidden="true">💬</i> Prévenir {nom}
          </button>
        </div>
      )}
      <StylesCages />
    </div>
  );
}

/** La cage dessinée, ses barreaux et sa porte : le même dessin que la démonstration aux commerçants. */
function StylesCages() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.cg{margin-top:10px;}
.cg-q{margin:0 0 6px;font-size:13px;font-weight:750;color:#E9DACB;text-align:center;}
.cg.a-choisi .cg-q{color:#FFE1A6;animation:cg-mot .35s ease both;}
@keyframes cg-mot{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.cg-rang{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;transition:padding .4s;}
.cg.a-choisi .cg-rang{padding-top:58px;}
.cg-c{--c:#F5A23A;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px;padding:8px 4px 9px;border-radius:16px;cursor:pointer;
  border:1.5px solid rgba(255,236,210,.14);background:rgba(255,236,210,.05);color:#F3E6DB;font:inherit;transition:background .2s,border-color .2s,transform .15s,opacity .3s;}
.cg-c.cg-adore{--c:#FF2E9A;}.cg-c.cg-aujourdhui{--c:#3DE2A6;}
.cg-c:active{transform:scale(.96);}
.cg-cage{position:relative;display:flex;flex-direction:column;align-items:center;width:60px;transform-origin:50% 0;animation:cg-balance 3.6s ease-in-out infinite;}
.cg-un-jour .cg-cage{animation-delay:-1.2s;}.cg-aujourdhui .cg-cage{animation-delay:-2.4s;}
@keyframes cg-balance{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}}
.cg-anneau{display:block;width:12px;height:12px;margin-bottom:-3px;border-radius:50%;border:2px solid #E8C77A;position:relative;z-index:2;}
.cg-dome{position:relative;display:block;width:100%;aspect-ratio:.86;overflow:hidden;border:2px solid #E8C77A;border-bottom:0;border-radius:50% 50% 10% 10% / 44% 44% 6% 6%;
  background:radial-gradient(ellipse at 50% 70%,rgba(255,236,210,.10),transparent 70%);}
.cg-dome::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 calc(16.66% - 1.2px),rgba(232,199,122,.85) calc(16.66% - 1.2px) 16.66%);}
.cg-dome::after{content:"";position:absolute;left:0;right:0;top:36%;height:2px;z-index:3;background:rgba(232,199,122,.9);}
.cg-dome img{position:absolute;left:50%;bottom:4%;z-index:2;height:70%;width:auto;transform:translateX(-50%);filter:drop-shadow(0 3px 3px rgba(0,0,0,.45));transition:opacity .2s .15s;}
.cg-porte{position:absolute;left:29%;width:42%;bottom:0;height:54%;z-index:4;border:2px solid #E8C77A;border-bottom:0;border-radius:45% 45% 0 0 / 35% 35% 0 0;transform-origin:0 50%;
  background:repeating-linear-gradient(90deg,transparent 0 4px,rgba(232,199,122,.9) 4px 5.5px);transition:transform .6s cubic-bezier(.3,1.4,.5,1);}
.cg-socle{display:block;width:110%;height:9px;margin-top:-1px;border-radius:4px;background:linear-gradient(#F3DFA0,#B38A3A);box-shadow:0 5px 8px -3px rgba(0,0,0,.65),inset 0 -3px 0 var(--c);}
.cg-l{font-size:11.5px;font-weight:800;line-height:1.15;text-align:center;white-space:pre-line;}
.cg.a-choisi .cg-c:not(.on){opacity:.42;}
.cg.a-choisi .cg-c:not(.on) .cg-cage{animation:none;}
.cg-c.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);}
.cg-c.on .cg-dome{box-shadow:0 0 0 2px var(--c),0 0 14px var(--c);}
.cg-c.on .cg-porte{transform:perspective(160px) rotateY(-118deg);}
.cg-c.on .cg-dome img{opacity:0;}
.cg-c.on .cg-l{color:#FFE1A6;}
.cg-envol{position:absolute;left:50%;bottom:calc(100% - 4px);display:flex;flex-direction:column;align-items:center;transform:translateX(-50%);pointer-events:none;animation:cg-envol .9s cubic-bezier(.2,1.2,.4,1) both;}
.cg-envol img{display:block;height:46px;width:auto;filter:drop-shadow(0 5px 8px rgba(0,0,0,.55));animation:cg-bob 2.4s ease-in-out .9s infinite;}
.cg-envol b{margin-top:-2px;padding:1px 8px;border-radius:8px;white-space:nowrap;font-size:10.5px;font-weight:800;color:#fff;background:var(--c);}
@keyframes cg-envol{from{opacity:0;transform:translate(-50%,62px) scale(.5)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes cg-bob{50%{transform:translateY(-5px)}}
.cg-wa{display:grid;gap:8px;margin-top:10px;padding:12px;border-radius:14px;background:rgba(255,236,210,.06);border:1px solid rgba(255,236,210,.14);}
.cg-wa b{font-size:13px;font-weight:800;color:#F3E6DB;line-height:1.3;}
.cg-wa input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,236,210,.22);background:rgba(0,0,0,.25);color:#fff;font:inherit;font-size:16px;}
.cg-wa input:focus{outline:none;border-color:#F5A23A;}
.cg-wa-b{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;}
.cg-wa-b button,.cg-auj button{padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,236,210,.2);background:transparent;color:#F3E6DB;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;}
.cg-wa-b button.fort,.cg-auj button.fort{border-color:transparent;background:#25D366;color:#06210F;}
.cg-wa-b button:disabled{opacity:.5;cursor:default;}
.cg-wa small{font-size:11.5px;color:rgba(243,230,219,.7);line-height:1.35;}
.cg-err{font-size:12px;font-weight:700;color:#FF8A8A;}
.cg-ok{margin:10px 0 0;font-size:12.5px;line-height:1.4;color:rgba(243,230,219,.85);text-align:center;}
.cg-lien{padding:0;border:0;background:none;color:#FFB547;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer;}
.cg-auj{display:grid;margin-top:10px;}
.cg-auj button{display:flex;align-items:center;justify-content:center;gap:6px;}
@media (prefers-reduced-motion:reduce){.cg-cage,.cg-envol,.cg-envol img{animation:none;}}
@media (max-width:340px){.cg-cage{width:52px;}.cg-l{font-size:10.5px;}}
`,
      }}
    />
  );
}

