"use client";

/**
 * ✨ « MA FIGURINE », MON DOUBLE DU JOUR — L'ÉCRAN (le chantier « Ma figurine », lot 1 ; `lib/direct/mon-double.ts` ; la
 * route `/api/direct/mon-double` ; `docs/univers/ma-figurine.md`). Ouvert depuis Ma maison (le gros bouton « ✨ Ma
 * figurine », ou sa figurine touchée).
 *
 * Sa figurine en grand, qui brille, avec sa pancarte ; dessous, cinq onglets :
 *   · 😊 SA TÊTE : son humeur, ou une de ses sept expressions — montrée partout jusqu'à demain ;
 *   · 🪧 SA PANCARTE : sa phrase (80 signes ; les idées toutes prêtes) — c'est aussi son mot du jour d'Autour ;
 *   · 🪞 LE MIROIR : la caméra (`useMaTete`), sa figurine vivante copie sa tête ; « 📌 Garder cette tête » ;
 *   · 💃 SES RÉACTIONS : on les essaie, elle les fait ici ;
 *   · 🗓️ SA FIGURINE DU MOIS : celle de « Moi » (`MaFigurineDuMois`).
 * En bas, « ✓ C'est moi aujourd'hui » : la pastille du bouton s'en va jusqu'à demain (choisir une tête ou écrire sa
 * pancarte le fait aussi).
 */
import { useEffect, useState, type CSSProperties } from "react";
import type { ExpressionFigurine, FigurineVivante } from "@/lib/direct/expressions-figurine";
import { IDEES_PANCARTE, ONGLETS_DOUBLE, PANCARTE_MAX, PHRASES_DOUBLE, PHRASES_IMAGE_DOUBLE, REACTIONS_A_ESSAYER, expressionDe, type MonDoubleVue, type OngletDouble, type ReactionAEssayer } from "@/lib/direct/mon-double";
import { FigurineVivanteVue, STYLES_VIVANTE } from "@/app/univers/visage/figurine-vivante";
import { useMaTete } from "@/app/univers/visage/ma-tete";
import { MaFigurineDuMois, STYLES_FIGURINE_DU_MOIS } from "./figurine-du-mois";
import { Pancarte } from "./pancarte";
import { Ornements } from "./ornements";
import { PHRASES_ORNEMENTS, SERIE_AUREOLE, SERIE_MIN, aDesOrnements } from "@/lib/direct/ornements";
import { themeDe } from "@/lib/direct/decouvrir";
import { ImageDuDouble } from "./image-du-double";
import { MonBonjour } from "./bonjour";

const ROUTE = "/api/direct/mon-double";
type Reponse = { double?: MonDoubleVue; vivante?: FigurineVivante | null; error?: string };
async function appel(corps?: object): Promise<Reponse> {
  try {
    const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) } : { cache: "no-store" });
    return ((await r.json().catch(() => ({}))) as Reponse) ?? {};
  } catch {
    return { error: "Pas de réseau : réessaie dans un instant." };
  }
}

/** La tête qu'une réaction lui fait faire, le temps de la réaction. */
const TETE_DE_REACTION: Partial<Record<ReactionAEssayer, ExpressionFigurine>> = { rire: "rire", oh: "surprise", danse: "sourire", coucou: "sourire", bravo: "sourire", coeur: "sourire" };

/** Sa figurine du jour : son corps sans sa tête, et la tête choisie dans la boîte de sa tête (sinon son image entière). */
export function FigurineDuDouble({ d, e, hauteur }: { d: MonDoubleVue; e: ExpressionFigurine | null; hauteur: number }) {
  const t = e ? d.tetes.find((x) => x.cle === e) : undefined;
  if (d.corps) {
    const [bx, by, bw, bh] = d.corps.boite;
    const pose: CSSProperties = { left: `${bx * 100}%`, top: `${by * 100}%`, width: `${bw * 100}%`, height: `${bh * 100}%` };
    return (
      <span className="md-fig" style={{ height: hauteur, width: Math.round(hauteur * d.corps.ratio) }} data-tete-du-jour={t?.cle ?? "habituelle"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.corps.src} alt="" draggable={false} />
        {/* (toutes ses têtes chargées d'avance : changer est instantané) */}
        {d.habituelle && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`md-tete${t ? "" : " vue"}`} src={d.habituelle} alt="" draggable={false} style={pose} />
        )}
        {d.tetes.map((x) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.cle} className={`md-tete${t?.cle === x.cle ? " vue" : ""}`} src={x.src} alt="" draggable={false} style={pose} />
        ))}
        {/* 🔥🎧❤️ (« Elle change toute seule ») ce qu'elle porte toute seule, par-dessus */}
        <Ornements o={d.ornements ? { ...d.ornements, boite: d.corps.boite } : null} taille={12} />
      </span>
    );
  }
  return d.image ? (
    <span className="md-fig" style={{ height: hauteur }} data-tete-du-jour="image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.image} alt="" draggable={false} style={{ position: "static", height: "100%", width: "auto" }} />
      <Ornements o={d.ornements ? { ...d.ornements, boite: undefined } : null} taille={12} />
    </span>
  ) : null;
}

export function MonDouble({ onFermer, onChange }: { onFermer: () => void; onChange: () => void }) {
  const [d, setD] = useState<MonDoubleVue | null>(null);
  const [vivante, setVivante] = useState<FigurineVivante | null>(null);
  const [onglet, setOnglet] = useState<OngletDouble>("tete");
  const [texte, setTexte] = useState("");
  const [dit, setDit] = useState("");
  const [erreur, setErreur] = useState("");
  const [reaction, setReaction] = useState<{ r: ReactionAEssayer; n: number } | null>(null);
  const [miroir, setMiroir] = useState(false);
  const [change, setChange] = useState(false);
  const [image, setImage] = useState(false);
  const { etat: camEtat, tete: camTete, video: camVideo } = useMaTete(miroir && onglet === "miroir");

  useEffect(() => {
    let fini = false;
    void appel().then((r) => {
      if (fini) return;
      if (r.double) {
        setD(r.double);
        setTexte(r.double.pancarte);
      } else setErreur(r.error || "Ta figurine ne s’est pas ouverte.");
      setVivante(r.vivante ?? null);
    });
    return () => {
      fini = true;
    };
  }, []);
  useEffect(() => {
    if (!dit) return;
    const t = window.setTimeout(() => setDit(""), 2600);
    return () => window.clearTimeout(t);
  }, [dit]);
  useEffect(() => {
    if (!reaction) return;
    const t = window.setTimeout(() => setReaction(null), 2000);
    return () => window.clearTimeout(t);
  }, [reaction]);

  async function envoyer(corps: object, phrase: string): Promise<boolean> {
    setErreur("");
    const r = await appel(corps);
    if (!r.double) {
      setErreur(r.error || "Ça n’a pas marché : réessaie.");
      return false;
    }
    setD(r.double);
    setChange(true);
    if (phrase) setDit(phrase);
    return true;
  }
  const fermer = () => {
    setMiroir(false);
    if (change) onChange();
    onFermer();
  };

  const teteDuJour = d ? (d.choisie ?? d.humeur?.e ?? null) : null;
  const enDirect = miroir && onglet === "miroir" && camEtat === "on";
  const teteScene = reaction ? (TETE_DE_REACTION[reaction.r] ?? teteDuJour) : teteDuJour;
  const infos = expressionDe(enDirect ? camTete.e : teteScene);
  const pancarte = d?.pancarte ?? "";

  return (
    <div className="md" role="dialog" aria-modal="true" aria-label={PHRASES_DOUBLE.titre} data-mon-double>
      <header className="md-haut">
        <button type="button" className="md-retour" onClick={fermer} data-retour-maison>
          {PHRASES_DOUBLE.retour}
        </button>
        <span>
          <b>{PHRASES_DOUBLE.titre}</b>
          <small>{PHRASES_DOUBLE.sousTitre}</small>
        </span>
      </header>

      <div className="md-scene">
        {dit && (
          <p className="md-dit" role="status" data-dit>
            {dit}
          </p>
        )}
        {d && (
          <span className="md-etiquette" data-etiquette>
            {enDirect ? `${infos?.e ?? "🙂"} en direct` : infos ? `${infos.e} ${infos.nom.toLowerCase()}` : "🙂 sa tête habituelle"}
          </span>
        )}
        <span className="md-halo" aria-hidden="true" />
        {reaction && (
          <i key={reaction.n} className="md-pop" aria-hidden="true" data-pop={reaction.r}>
            {REACTIONS_A_ESSAYER.find((x) => x.cle === reaction.r)?.e}
          </i>
        )}
        <span className={`md-pose${reaction ? ` r-${reaction.r}` : ""}`} key={reaction?.n ?? 0}>
          {pancarte && <Pancarte texte={pancarte} taille={17} bas={d?.corps ? `${Math.round((1 - d.corps.boite[1]) * 230) + 4}px` : "222px"} />}
          {enDirect && vivante ? <FigurineVivanteVue v={vivante} hauteur={230} e={camTete.e} roulis={camTete.roulis} lacet={camTete.lacet} /> : d ? <FigurineDuDouble d={d} e={teteScene} hauteur={230} /> : null}
        </span>
        {d && (d.corps || d.image) && (
          <button type="button" className="md-image" onClick={() => setImage(true)} data-image-du-double>
            {PHRASES_IMAGE_DOUBLE.bouton}
          </button>
        )}
        {miroir && onglet === "miroir" && (
          <span className="md-camera" aria-hidden="true">
            <video ref={camVideo} muted playsInline />
            <i>Toi</i>
          </span>
        )}
      </div>

      <div className="md-onglets" role="tablist" aria-label="Ce que tu peux lui faire faire">
        {ONGLETS_DOUBLE.map((o) => (
          <button key={o.cle} type="button" role="tab" aria-selected={onglet === o.cle} className={onglet === o.cle ? "on" : ""} data-onglet={o.cle} onClick={() => setOnglet(o.cle)}>
            <b aria-hidden="true">{o.e}</b>
            {o.nom}
          </button>
        ))}
      </div>

      <div className="md-panneau">
        {erreur && (
          <p className="md-erreur" role="alert" data-erreur>
            {erreur}
          </p>
        )}
        {!d ? null : onglet === "tete" ? (
          <section data-panneau="tete">
            <h2>{PHRASES_DOUBLE.teteTitre}</h2>
            <p>{PHRASES_DOUBLE.teteChapo}</p>
            {d.tetes.length ? (
              <div className="md-puces">
                <button type="button" className={`md-puce${!d.choisie ? " on" : ""}`} aria-pressed={!d.choisie} data-tete="humeur" onClick={() => void envoyer({ action: "tete", e: "humeur" }, PHRASES_DOUBLE.teteHumeur)}>
                  {d.humeur ? `${d.humeur.emoji} ${PHRASES_DOUBLE.monHumeur(d.humeur.nom)}` : `🙂 ${PHRASES_DOUBLE.monHumeurSans}`}
                </button>
                {d.tetes.map((t) => (
                  <button key={t.cle} type="button" className={`md-puce${d.choisie === t.cle ? " on" : ""}`} aria-pressed={d.choisie === t.cle} data-tete={t.cle} onClick={() => void envoyer({ action: "tete", e: t.cle }, PHRASES_DOUBLE.teteGardee(t.nom))}>
                    {t.e} {t.nom}
                  </button>
                ))}
              </div>
            ) : (
              <p className="md-attente">{PHRASES_DOUBLE.sansTetes}</p>
            )}
            {/* 🔥🎧❤️ (« Elle change toute seule ») ce qu'elle porte toute seule, et pourquoi — de vraies données */}
            <h2 className="md-sous">{PHRASES_ORNEMENTS.titre}</h2>
            {aDesOrnements(d.ornements) ? (
              <ul className="md-orn" data-ornements-liste>
                {(d.ornements.serie ?? 0) >= SERIE_MIN && (
                  <li data-ligne-orn="serie">
                    <b>{(d.ornements.serie ?? 0) >= SERIE_AUREOLE ? PHRASES_ORNEMENTS.aureole : PHRASES_ORNEMENTS.serie(d.ornements.serie ?? 0)}</b>
                    <small>{PHRASES_ORNEMENTS.serieDit(d.ornements.serie ?? 0)}</small>
                  </li>
                )}
                {d.ornements.accessoire && (
                  <li data-ligne-orn="passion">
                    <b>
                      {d.ornements.accessoire.e} {d.ornements.accessoire.nom}
                    </b>
                    <small>{PHRASES_ORNEMENTS.passionDit(themeDe(d.ornements.accessoire.theme)?.nom.toLowerCase() ?? d.ornements.accessoire.theme)}</small>
                  </li>
                )}
                {d.ornements.coeur && (
                  <li data-ligne-orn="coeur">
                    <b>{PHRASES_ORNEMENTS.coeur(d.ornements.coeur)}</b>
                    <small>{PHRASES_ORNEMENTS.coeurDit(d.ornements.coeur)}</small>
                  </li>
                )}
              </ul>
            ) : (
              <p data-ornements-rien>{PHRASES_ORNEMENTS.rien}</p>
            )}
          </section>
        ) : onglet === "pancarte" ? (
          <section data-panneau="pancarte">
            <h2>{PHRASES_DOUBLE.pancarteTitre}</h2>
            <p>{PHRASES_DOUBLE.pancarteChapo}</p>
            <label className="md-label" htmlFor="md-pancarte">
              {PHRASES_DOUBLE.pancarteLabel}
            </label>
            <form
              className="md-champ"
              onSubmit={(ev) => {
                ev.preventDefault();
                void envoyer({ action: "pancarte", texte }, texte.trim() ? PHRASES_DOUBLE.pancarteGardee : PHRASES_DOUBLE.pancarteEnlevee);
              }}
            >
              <input id="md-pancarte" type="text" value={texte} maxLength={PANCARTE_MAX} placeholder={PHRASES_DOUBLE.pancarteIndice} onChange={(e) => setTexte(e.target.value)} data-champ="pancarte" />
              <small>
                {texte.length}/{PANCARTE_MAX}
              </small>
              <button type="submit" disabled={texte.trim() === pancarte} data-garder-pancarte>
                {PHRASES_DOUBLE.garder}
              </button>
            </form>
            <p className="md-label">{PHRASES_DOUBLE.idees}</p>
            <div className="md-puces">
              {IDEES_PANCARTE.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`md-puce md-idee${pancarte === t ? " on" : ""}`}
                  data-idee={t}
                  onClick={() => {
                    setTexte(t);
                    void envoyer({ action: "pancarte", texte: t }, PHRASES_DOUBLE.pancarteGardee);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {pancarte && (
              <button
                type="button"
                className="md-discret"
                data-sans-pancarte
                onClick={() => {
                  setTexte("");
                  void envoyer({ action: "pancarte", texte: "" }, PHRASES_DOUBLE.pancarteEnlevee);
                }}
              >
                {PHRASES_DOUBLE.sansPancarte}
              </button>
            )}
          </section>
        ) : onglet === "miroir" ? (
          <section data-panneau="miroir">
            <h2>{PHRASES_DOUBLE.miroirTitre}</h2>
            <p>{PHRASES_DOUBLE.miroirChapo}</p>
            {!vivante ? (
              <p className="md-attente">{PHRASES_DOUBLE.miroirSans}</p>
            ) : !miroir ? (
              <button type="button" className="md-ambre" data-allumer onClick={() => setMiroir(true)}>
                {PHRASES_DOUBLE.allumer}
              </button>
            ) : (
              <>
                <p className="md-fort" data-miroir={camEtat}>
                  {camEtat === "refus" || camEtat === "rate" ? PHRASES_DOUBLE.miroirRefus : camEtat !== "on" ? PHRASES_DOUBLE.miroirCharge : camTete.e ? PHRASES_DOUBLE.miroirFait(expressionDe(camTete.e)?.nom ?? "") : PHRASES_DOUBLE.miroirNeutre}
                </p>
                <div className="md-puces">
                  {camEtat === "on" && camTete.e && (
                    <button type="button" className="md-ambre" data-garder-tete={camTete.e} onClick={() => void envoyer({ action: "tete", e: camTete.e }, PHRASES_DOUBLE.teteGardee(expressionDe(camTete.e)?.nom ?? ""))}>
                      {PHRASES_DOUBLE.garderTete}
                    </button>
                  )}
                  <button type="button" className="md-discret" onClick={() => setMiroir(false)}>
                    {PHRASES_DOUBLE.eteindre}
                  </button>
                </div>
              </>
            )}
          </section>
        ) : onglet === "reactions" ? (
          <section data-panneau="reactions">
            <h2>{PHRASES_DOUBLE.reactionsTitre}</h2>
            <p>{PHRASES_DOUBLE.reactionsChapo}</p>
            <div className="md-reactions">
              {REACTIONS_A_ESSAYER.map((r) => (
                <button key={r.cle} type="button" data-reaction={r.cle} className={reaction?.r === r.cle ? "on" : ""} onClick={() => setReaction((x) => ({ r: r.cle, n: (x?.n ?? 0) + 1 }))}>
                  <b aria-hidden="true">{r.e}</b>
                  {r.nom}
                </button>
              ))}
            </div>
          </section>
        ) : onglet === "bonjour" ? (
          <MonBonjour bonjour={d.bonjour} envoyer={envoyer} />
        ) : (
          <section data-panneau="mois">
            <h2>{PHRASES_DOUBLE.moisTitre}</h2>
            <MaFigurineDuMois />
          </section>
        )}
      </div>

      <div className="md-bas">
        <button
          type="button"
          className="md-valider"
          data-valider
          onClick={async () => {
            if (await envoyer({ action: "pret" }, "")) {
              setMiroir(false);
              onChange();
              onFermer();
            }
          }}
        >
          {PHRASES_DOUBLE.valider}
        </button>
        <small>{PHRASES_DOUBLE.partout}</small>
      </div>
      {image && <ImageDuDouble onFermer={() => setImage(false)} />}
      <style>{STYLES_MON_DOUBLE + STYLES_VIVANTE + STYLES_FIGURINE_DU_MOIS}</style>
    </div>
  );
}

const STYLES_MON_DOUBLE = `
.md{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;max-width:520px;margin:0 auto;background:radial-gradient(120% 40% at 0% 0%,rgba(245,162,58,.2),rgba(245,162,58,0) 60%),radial-gradient(120% 40% at 100% 0%,rgba(255,46,154,.16),rgba(255,46,154,0) 60%),#120c09;color:#fff4e6;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;animation:md-entre .25s ease-out}
@keyframes md-entre{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.md button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.md button:active{transform:scale(.97)}
.md button:focus-visible,.md input:focus-visible{outline:2px solid #f6b54b;outline-offset:2px}
.md-haut{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 12px 4px}
.md-retour{min-height:44px;padding:0 14px 0 8px;border:0;border-radius:999px;background:#1c1411;font-weight:600;font-size:14px}
.md-haut>span{flex:1;display:flex;flex-direction:column;align-items:flex-end;padding-right:4px;text-align:right}
.md-haut b{font-weight:800;font-size:19px;letter-spacing:-.025em}
.md-haut small{color:#cdb8a4;font-size:12.5px}
.md-scene{position:relative;flex:none;height:min(300px,38svh);margin:6px 16px 0;border-radius:28px;overflow:hidden;background:radial-gradient(70% 60% at 50% 62%,#3a2418,#1c1411 70%);box-shadow:0 0 0 1px rgba(255,196,140,.14)}
.md-halo{position:absolute;left:50%;bottom:-40px;width:330px;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(246,181,75,.5) 0%,rgba(255,46,154,.2) 38%,rgba(255,46,154,0) 68%);animation:md-brille 3.2s ease-in-out infinite;pointer-events:none}
@keyframes md-brille{0%,100%{opacity:.55;transform:translateX(-50%) scale(.94)}50%{opacity:1;transform:translateX(-50%) scale(1.04)}}
.md-pose{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);transform-origin:50% 100%}
.md-fig{position:relative;display:block}
.md-fig img{position:absolute;left:0;top:0;width:100%;height:100%;user-select:none;-webkit-user-drag:none}
.md-fig>img:first-child{filter:drop-shadow(0 8px 10px rgba(0,0,0,.5))}
.md-fig img.md-tete{opacity:0}
.md-fig img.md-tete.vue{opacity:1}
.md-pose.r-danse{animation:md-danse .45s ease-in-out 4 alternate}
@keyframes md-danse{0%{transform:translateX(-54%) rotate(-7deg)}100%{transform:translateX(-46%) rotate(7deg)}}
.md-pose.r-bravo,.md-pose.r-coeur,.md-pose.r-coucou{animation:md-saut .5s cubic-bezier(.2,.9,.3,1.2) 3}
@keyframes md-saut{0%,100%{transform:translateX(-50%)}45%{transform:translateX(-50%) translateY(-14%)}}
.md-pose.r-rire{animation:md-rit .16s linear 9 alternate}
@keyframes md-rit{0%{transform:translateX(-50%) rotate(-2deg)}100%{transform:translateX(-50%) rotate(2deg)}}
.md-pose.r-oh{animation:md-oh .7s cubic-bezier(.2,.9,.3,1.2)}
@keyframes md-oh{0%,100%{transform:translateX(-50%) scale(1)}30%{transform:translateX(-50%) scale(1.07) translateY(-3%)}}
.md-pop{position:absolute;right:22%;top:18%;z-index:5;font-style:normal;font-size:40px;animation:md-monte 1.6s ease-out forwards;pointer-events:none}
@keyframes md-monte{0%{opacity:0;transform:translateY(20px) scale(.6)}20%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-90px)}}
.md-etiquette{position:absolute;right:12px;top:12px;z-index:5;padding:5px 10px;border-radius:999px;background:rgba(18,12,9,.75);font-weight:600;font-size:12px}
.md-dit{position:absolute;left:12px;right:12px;top:12px;z-index:6;margin:0;padding:10px 12px;border-radius:16px;background:#fff4e6;color:#2a1a10;font-weight:600;font-size:13.5px;line-height:1.3;box-shadow:0 14px 30px -12px rgba(0,0,0,.6);animation:md-entre .3s ease-out}
.md-image{position:absolute;left:10px;bottom:10px;z-index:5;min-height:36px;padding:0 12px;border:0;border-radius:999px;background:rgba(18,12,9,.78);box-shadow:inset 0 0 0 1px rgba(255,196,140,.28);font-weight:700;font-size:12.5px}
.md-camera{position:absolute;left:12px;top:12px;z-index:5;width:84px;height:110px;border-radius:18px;overflow:hidden;background:#15151b;box-shadow:0 0 0 2px #fff4e6}
.md-camera video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.md-camera i{position:absolute;left:7px;top:6px;font-style:normal;font-weight:700;font-size:10px;color:#fff4e6;text-shadow:0 1px 2px #000}
.md-onglets{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin:12px 16px 0}
.md-onglets button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:62px;padding:6px 2px;border:1px solid rgba(255,196,140,.14);border-radius:16px;background:#1c1411;font-weight:600;font-size:10.5px;line-height:1.15;letter-spacing:-.01em}
.md-onglets b{font-size:20px;line-height:1}
.md-onglets button.on{background:#261b16;border-color:#f5a23a;box-shadow:inset 0 0 0 1px #f5a23a}
.md-panneau{flex:1;min-height:0;overflow-y:auto;padding:14px 16px 8px;font-family:var(--font-geist-sans),Geist,system-ui,sans-serif}
.md-panneau h2{margin:0;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:800;font-size:17px}
.md-panneau section>p{margin:4px 0 12px;color:#cdb8a4;font-size:13.5px;line-height:1.4}
.md-puces{display:flex;flex-wrap:wrap;gap:8px}
.md-puce{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:8px 14px;border:1px solid rgba(255,196,140,.14);border-radius:999px;background:#1c1411;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:600;font-size:14px;white-space:nowrap}
.md-puce.on{background:rgba(245,162,58,.16);border-color:#f5a23a;box-shadow:inset 0 0 0 1px #f5a23a}
.md-idee{font-family:var(--font-main-levee),Caveat,cursive;font-weight:700;font-size:18px;white-space:normal}
.md-label{display:block;margin:12px 0 6px;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:600;font-size:13px;color:#fff4e6}
.md-champ{display:flex;align-items:center;gap:8px;padding:4px 4px 4px 14px;border-radius:16px;background:#261b16;border:1px solid rgba(255,196,140,.14)}
.md-champ input{flex:1;min-width:0;min-height:44px;border:0;background:none;color:#fff4e6;font-family:var(--font-main-levee),Caveat,cursive;font-weight:700;font-size:22px;outline:none}
.md-champ small{color:#cdb8a4;font-size:12px}
.md-champ button{min-height:40px;padding:0 14px;border:0;border-radius:999px;background:#f5a23a;color:#2a1500;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:800;font-size:14px}
.md-champ button:disabled{opacity:.4}
.md-ambre{min-height:44px;padding:10px 18px;border:0;border-radius:999px;background:#f5a23a;color:#2a1500;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:800;font-size:15px}
.md-discret{min-height:44px;margin-top:6px;padding:0 4px;border:0;background:none;color:#cdb8a4;font-weight:600;font-size:14.5px;text-decoration:underline;text-underline-offset:3px}
.md-fort{margin:0 0 10px;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:600;font-size:15px}
.md-attente{color:#cdb8a4;font-size:14px}
.md-erreur{margin:0 0 10px;padding:10px 12px;border-radius:14px;background:rgba(255,123,138,.14);color:#ffb3bc;font-size:13.5px}
.md-sous{margin-top:14px!important;font-size:15px!important}
.md-orn{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.md-orn li{display:flex;flex-direction:column;gap:2px;padding:9px 12px;border-radius:14px;background:#1c1411;box-shadow:inset 0 0 0 1px rgba(255,196,140,.14)}
.md-orn b{font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:700;font-size:14px;color:#fff4e6}
.md-orn small{font-size:12.5px;color:#cdb8a4}
.md-reactions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.md-reactions button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:70px;border:1px solid rgba(255,196,140,.14);border-radius:16px;background:#1c1411;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:600;font-size:13px}
.md-reactions b{font-size:26px;line-height:1}
.md-reactions button.on{border-color:#f5a23a;box-shadow:inset 0 0 0 1px #f5a23a}
.md-bas{padding:8px 16px calc(14px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(18,12,9,0),#120c09 30%)}
.md-valider{position:relative;overflow:hidden;width:100%;min-height:58px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff4fb0,#ff2e9a 60%);color:#fff;font-weight:800;font-size:19px;letter-spacing:-.02em;box-shadow:0 10px 28px rgba(255,46,154,.38),inset 0 1px 0 rgba(255,255,255,.3)}
.md-bas small{display:block;margin-top:8px;text-align:center;color:#cdb8a4;font-size:12.5px}
@media (prefers-reduced-motion:reduce){.md,.md-halo,.md-pose,.md-pop,.md-dit{animation:none!important}}
`;
