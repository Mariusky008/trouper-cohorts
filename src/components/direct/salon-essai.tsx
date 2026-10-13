"use client";

/**
 * 💬 LE SALON DE L'ESSAI — la discussion privée autour d'un « Ça me va ? ».
 *
 * « Quand l'ami clique sur le lien, il aurait fallu que ça ouvre un salon de
 * discussion privé où l'essayant peut y voir plus clair et voir ce qu'il se
 * passe — et le participant est sur la page du commerçant, il pourrait même
 * essayer quelque chose. »
 *
 * UN SEUL ÉCRAN, LE MÊME POUR TOUS : l'essai en grand, le vote d'un appui,
 * puis la discussion — les amis, celui qui a essayé, et ClikMe qui tranche
 * quand on le lui demande. Il s'ouvre :
 *   · chez celui qui a essayé, dès que le lien est parti (ou par « ClikMe
 *     tranche », sans ami du tout) — il y voit les votes et les mots arriver ;
 *   · chez l'ami, sur la page du commerçant (`?essai=` — voir
 *     `SalonEssaiDepuisAdresse`) : derrière le salon, la boutique, et
 *     « Essayer à mon tour ».
 *
 * PRIVÉ COMME LE LIEN : seuls ceux à qui on l'a envoyé l'ouvrent. Le serveur
 * garde la vérité (`lib/direct/avis-amis.ts`) ; l'écran la relit toutes les
 * quatre secondes tant qu'il est regardé.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Porte } from "@/components/direct/dressing/porte";
import { direSonPrenom, monPrenom } from "@/lib/direct/salons";
import {
  REPONSES_AVIS,
  demanderAClikMe,
  ecrireDansSalon,
  lireSalonEssai,
  votantDuTelephone,
  voterDansSalon,
  type ChoixVote,
  type SalonEssai as Salon,
} from "@/lib/direct/avis-amis-client";

const VERDICT: Record<"oui" | "non" | "hesite", string> = { oui: "Ça te va", non: "Pas pour toi", hesite: "À voir" };
const heure = (t: string) => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

/** « Léa, Sam et 2 autres » — pour celui qui a essayé seulement. */
function quiAVote(votes: { v: ChoixVote; q?: string }[]): string {
  const noms = [...new Set(votes.map((v) => v.q).filter((q): q is string => Boolean(q)))];
  const autres = votes.length - votes.filter((v) => v.q).length;
  if (!noms.length) return votes.length === 1 ? "1 personne a voté" : `${votes.length} personnes ont voté`;
  const tete = noms.slice(0, 3);
  const reste = autres + Math.max(0, noms.length - 3);
  return reste ? `${tete.join(", ")} et ${reste} autre${reste > 1 ? "s" : ""}` : tete.length > 1 ? `${tete.slice(0, -1).join(", ")} et ${tete.at(-1)}` : tete[0];
}

export function SalonEssai({
  jeton,
  image,
  onFermer,
  clikmeDabord,
  inviter,
  onEssayer,
}: {
  /** Le lien court (ou le jeton complet) : il suffit pour lire et écrire. */
  jeton: string;
  /** L'essai, quand on l'a déjà sous la main (celui qui a essayé) ; sinon l'image servie au lien. */
  image?: string;
  onFermer: () => void;
  /** Ouvert par « ClikMe tranche » : son verdict est demandé en arrivant. */
  clikmeDabord?: boolean;
  /** Celui qui a essayé : envoyer le lien à des amis. */
  inviter?: () => void;
  /** Un ami : essayer à son tour, sur la page du commerçant. */
  onEssayer?: () => void;
}) {
  const [votant] = useState(() => votantDuTelephone());
  const [salon, setSalon] = useState<Salon | null>(null);
  const [attente, setAttente] = useState(false);
  const [perdu, setPerdu] = useState("");
  const [souci, setSouci] = useState("");
  const [texte, setTexte] = useState("");
  const [prenom, setPrenom] = useState(() => monPrenom());
  const [nom, setNom] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [pense, setPense] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const verdictDemande = useRef(false);

  const relire = useCallback(async () => {
    const r = await lireSalonEssai(jeton, votant);
    if (r.salon) {
      setSalon(r.salon);
      setAttente(false);
      setPerdu("");
    } else if (r.attente) setAttente(true);
    else if (r.erreur) setPerdu(r.erreur);
    return r.salon;
  }, [jeton, votant]);

  const clikme = useCallback(
    async (question?: string) => {
      setPense(true);
      setSouci("");
      const r = await demanderAClikMe(jeton, votant, question);
      if (!r.ok && r.erreur) setSouci(r.erreur);
      await relire();
      setPense(false);
    },
    [jeton, votant, relire],
  );

  /* LA PREMIÈRE LECTURE, PUIS TOUTES LES QUATRE SECONDES TANT QU'ON REGARDE —
     et le verdict de ClikMe, quand c'est lui qu'on est venu chercher. */
  useEffect(() => {
    let vivant = true;
    void (async () => {
      let s = await relire();
      for (let i = 0; vivant && !s && i < 6; i++) {
        await new Promise((ok) => window.setTimeout(ok, 1500));
        if (vivant) s = await relire();
      }
      if (vivant && s && clikmeDabord && !verdictDemande.current && !s.mots.some((m) => m.k === "clikme")) {
        verdictDemande.current = true;
        await clikme();
      }
    })();
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void relire();
    }, 4000);
    const auRetour = () => {
      if (document.visibilityState === "visible") void relire();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      vivant = false;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [relire, clikme, clikmeDabord]);

  /* LE DERNIER MOT EN VUE. */
  const nbMots = salon?.mots.length ?? 0;
  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: "smooth" });
  }, [nbMots, pense]);

  /* ÉCHAP REFERME LE SALON, ET LUI SEUL. */
  useEffect(() => {
    const touche = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.stopImmediatePropagation();
      onFermer();
    };
    window.addEventListener("keydown", touche, true);
    return () => window.removeEventListener("keydown", touche, true);
  }, [onFermer]);

  const auteur = salon?.auteur ?? false;
  const signe = prenom || undefined;

  const voter = async (v: ChoixVote) => {
    setOccupe(true);
    setSouci("");
    const r = await voterDansSalon(jeton, votant, v, signe);
    if (!r.ok && r.erreur) setSouci(r.erreur);
    await relire();
    setOccupe(false);
  };

  const envoyer = async () => {
    const x = texte.trim();
    if (!x || occupe) return;
    setOccupe(true);
    setSouci("");
    const r = await ecrireDansSalon(jeton, votant, x, signe);
    if (r.ok) setTexte("");
    else if (r.erreur) setSouci(r.erreur);
    await relire();
    setOccupe(false);
  };

  /* « DEMANDER À CLIKME » : la question écrite part d'abord dans le salon ; sans question, c'est son verdict. */
  const demander = async () => {
    const x = texte.trim();
    if (pense) return;
    if (x) {
      const r = await ecrireDansSalon(jeton, votant, x, signe);
      if (!r.ok) return setSouci(r.erreur || "Ça n’est pas passé.");
      setTexte("");
    }
    await clikme(x || undefined);
  };

  const qui = salon?.prenom;
  const titre = auteur ? "Votre salon" : qui ? `Le salon de ${qui}` : "Le salon de l’essai";
  const total = (salon?.oui ?? 0) + (salon?.non ?? 0);
  const photo = image || `/api/direct/avis-amis/image?j=${encodeURIComponent(jeton)}`;
  const doitSePresenter = !auteur && !prenom;

  return (
    <Porte>
      <div className="se" role="dialog" aria-modal="true" aria-label={titre}>
        <header className="se-h">
          <button type="button" className="se-retour" onClick={onFermer}>
            <span aria-hidden="true">‹</span> Retour
          </button>
          <div className="se-titre">
            <b>{titre}</b>
            <span>🔒 Privé · seuls ceux qui ont le lien</span>
          </div>
          <span aria-hidden="true" />
        </header>

        <div className="se-c" ref={fil}>
          <div className="se-col">
            <figure className="se-essai">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={salon ? `Essai : ${salon.quoi}` : ""} />
              <figcaption>
                <b>Ça me va&nbsp;?</b>
                {salon && (
                  <span>
                    «&nbsp;{salon.quoi}&nbsp;»{salon.prix ? ` · ${salon.prix}` : ""}
                    {salon.magasin ? ` · ${salon.magasin}` : ""}
                  </span>
                )}
              </figcaption>
            </figure>

            {perdu ? (
              <p className="se-note">{perdu}</p>
            ) : !salon ? (
              <p className="se-note">{attente ? "L’essai arrive…" : "Ouverture du salon…"}</p>
            ) : (
              <>
                {/* ═══ LE VOTE D'UN APPUI — les amis ; celui qui a essayé voit qui a voté ═══ */}
                {!auteur && (
                  <div className="se-vote" role="group" aria-label="Votre avis">
                    {(["oui", "non"] as const).map((v) => (
                      <button key={v} type="button" className={salon.monVote === v ? "pris" : ""} aria-pressed={salon.monVote === v} disabled={occupe} onClick={() => void voter(v)}>
                        <span aria-hidden="true">{REPONSES_AVIS[v].emoji}</span>
                        {REPONSES_AVIS[v].mot}
                      </button>
                    ))}
                  </div>
                )}
                {(auteur || salon.monVote) && (
                  <div className="se-cpt" aria-live="polite">
                    <div className="se-barre" aria-hidden="true">
                      <i style={{ width: `${total ? Math.round((salon.oui / total) * 100) : 0}%` }} />
                    </div>
                    <p>
                      <b>
                        {REPONSES_AVIS.oui.emoji} {salon.oui} · {REPONSES_AVIS.non.emoji} {salon.non}
                      </b>
                      <span>
                        {auteur
                          ? salon.votes?.length
                            ? quiAVote(salon.votes)
                            : "Les votes de vos amis arrivent ici."
                          : `${total} avis en tout · vous pouvez changer d’avis`}
                      </span>
                    </p>
                  </div>
                )}

                {/* ═══ LA DISCUSSION ═══ */}
                <ol className="se-fil" aria-label="Discussion">
                  {salon.mots.length === 0 && !pense && (
                    <li className="se-vide">
                      {auteur ? "Vos amis votent et écrivent ici. Invitez-les, ou demandez à ClikMe de trancher." : "Dites-lui ce que vous en pensez."}
                    </li>
                  )}
                  {salon.mots.map((m) => (
                    <li key={m.i} className={`se-mot${m.k === "clikme" ? " clikme" : m.mien ? " mien" : ""}`}>
                      {m.k === "clikme" ? (
                        <i className="se-av" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/clikme-fantome.png" alt="" />
                        </i>
                      ) : null}
                      <div>
                        {!m.mien && (
                          <b>
                            {m.k === "clikme" ? "ClikMe" : m.q || "Un ami"}
                            {m.k === "auteur" && <em> · a essayé</em>}
                          </b>
                        )}
                        {m.k === "clikme" && m.v && <span className={`se-verdict ${m.v}`}>{VERDICT[m.v]}</span>}
                        <p>{m.x}</p>
                        <time>{heure(m.t)}</time>
                      </div>
                    </li>
                  ))}
                  {pense && (
                    <li className="se-mot clikme pense">
                      <i className="se-av" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/clikme-fantome.png" alt="" />
                      </i>
                      <div>
                        <b>ClikMe</b>
                        <p>Je regarde la photo…</p>
                      </div>
                    </li>
                  )}
                </ol>
              </>
            )}
          </div>
        </div>

        {salon && (
          <footer className="se-pied">
            <div className="se-col">
              {souci && (
                <p className="se-souci" role="alert">
                  {souci}
                </p>
              )}
              <div className="se-gestes">
                {salon.clikme > 0 && (
                  <button type="button" className="clikme" disabled={pense} onClick={() => void demander()}>
                    ✨ {texte.trim() ? "Demander à ClikMe" : "ClikMe tranche"}
                  </button>
                )}
                {auteur && inviter && (
                  <button type="button" className="amis" onClick={inviter}>
                    + Inviter des amis
                  </button>
                )}
                {!auteur && onEssayer && (
                  <button type="button" className="essayer" onClick={onEssayer}>
                    Essayer à mon tour
                  </button>
                )}
              </div>
              {doitSePresenter ? (
                <form
                  className="se-ecrire"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const p = nom.trim().slice(0, 24);
                    if (!p) return;
                    direSonPrenom(p);
                    setPrenom(p);
                    // SON VOTE, DONNÉ AVANT DE SE PRÉSENTER, SE SIGNE MAINTENANT.
                    if (salon.monVote) void voterDansSalon(jeton, votant, salon.monVote, p).then(() => relire());
                  }}
                >
                  <input value={nom} onChange={(ev) => setNom(ev.target.value)} placeholder="Votre prénom, pour signer" maxLength={24} autoComplete="given-name" aria-label="Votre prénom" />
                  <button type="submit" disabled={!nom.trim()}>
                    C’est moi
                  </button>
                </form>
              ) : (
                <form
                  className="se-ecrire"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    void envoyer();
                  }}
                >
                  <input
                    value={texte}
                    onChange={(ev) => setTexte(ev.target.value)}
                    placeholder={auteur ? "Écrire à vos amis…" : "Votre avis, en un mot…"}
                    maxLength={280}
                    aria-label="Votre message"
                  />
                  <button type="submit" disabled={occupe || !texte.trim()}>
                    Envoyer
                  </button>
                </form>
              )}
            </div>
          </footer>
        )}
      </div>
      <style>{STYLE}</style>
    </Porte>
  );
}

/* ═══ LE SALON OUVERT PAR LE LIEN, SUR LA PAGE DU COMMERÇANT ═══════════════
   `?essai=<lien>` : l'ami arrive de WhatsApp (voir `/ca-me-va/[jeton]`). Le
   salon s'ouvre par-dessus la boutique ; refermé, une pastille le rouvre. */
const lireEssaiDeLAdresse = () => {
  try {
    const v = new URLSearchParams(window.location.search).get("essai") ?? "";
    return /^[A-Za-z0-9_.-]{20,600}$/.test(v) ? v : "";
  } catch {
    return "";
  }
};
const sansAbonnement = () => () => {};

export function SalonEssaiDepuisAdresse() {
  const jeton = useSyncExternalStore(sansAbonnement, lireEssaiDeLAdresse, () => "");
  const [ferme, setFerme] = useState(false);
  if (!jeton) return null;
  if (ferme) {
    return (
      <Porte>
        <button type="button" className="se-pastille" onClick={() => setFerme(false)}>
          💬 Le salon de l’essai
        </button>
        <style>{STYLE}</style>
      </Porte>
    );
  }
  return (
    <SalonEssai
      jeton={jeton}
      onFermer={() => setFerme(true)}
      onEssayer={() => {
        setFerme(true);
        // L'ONGLET « ESSAYER » DE LA BOUTIQUE S'OUVRE (voir `clikme:montrer` dans `boutique-table.tsx`).
        window.dispatchEvent(new CustomEvent("clikme:montrer", { detail: "essayer" }));
      }}
    />
  );
}

const STYLE = `
.se{position:fixed;inset:0;z-index:3100;display:flex;flex-direction:column;background:#120C09;color:#FFF4E6;
  font-family:var(--font-clikme),"Poppins",system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
.se-col{width:100%;max-width:560px;margin:0 auto;}
.se-h{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:10px 14px;
  border-bottom:1px solid rgba(255,244,230,.1);background:rgba(18,12,9,.96);}
.se-retour{padding:8px 14px;border-radius:999px;cursor:pointer;font:inherit;font-size:14px;font-weight:800;color:#FFF4E6;
  background:rgba(255,244,230,.06);border:1px solid rgba(255,244,230,.18);}
.se-retour span{margin-right:2px;}
.se-titre{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:0;text-align:center;}
.se-titre b{font-size:16px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.se-titre span{font-size:11.5px;font-weight:600;color:#BFA993;}
.se-c{flex:1;overflow-y:auto;padding:14px 16px 10px;}
.se-essai{position:relative;margin:0 0 12px;border-radius:22px;overflow:hidden;background:#2a1a0f;aspect-ratio:4 / 5;max-height:42vh;width:100%;}
.se-essai img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;}
.se-essai figcaption{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:2px;padding:40px 14px 12px;
  background:linear-gradient(180deg,rgba(18,12,9,0),rgba(18,12,9,.9));}
.se-essai b{font-size:26px;font-weight:900;line-height:1.05;color:#fff;}
.se-essai span{font-size:13.5px;line-height:1.3;color:#EADBC8;}
.se-note{margin:6px 0;font-size:14.5px;color:#D9C3A8;text-align:center;}
.se-vote{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.se-vote button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 8px;border-radius:18px;cursor:pointer;
  font:inherit;font-size:14.5px;font-weight:800;line-height:1.2;color:#FFF4E6;background:rgba(255,244,230,.06);border:1.5px solid rgba(255,244,230,.22);}
.se-vote button span{font-size:28px;line-height:1;}
.se-vote button.pris{background:linear-gradient(180deg,#F9C66B,#EFA43A);color:#2A1607;border-color:transparent;}
.se-cpt{margin:10px 0 0;padding:12px 14px;border-radius:16px;background:rgba(246,181,75,.1);border:1px solid rgba(246,181,75,.35);}
.se-barre{height:8px;border-radius:99px;background:rgba(255,244,230,.16);overflow:hidden;}
.se-barre i{display:block;height:100%;border-radius:99px;background:#F6B54B;transition:width .4s ease;}
.se-cpt p{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin:8px 0 0;}
.se-cpt b{font-size:17px;font-weight:900;}
.se-cpt span{font-size:13px;color:#D9C3A8;}
.se-fil{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:10px;}
.se-vide{padding:14px;border-radius:16px;text-align:center;font-size:14px;line-height:1.45;color:#BFA993;border:1px dashed rgba(255,244,230,.18);}
.se-mot{display:flex;gap:8px;align-items:flex-end;max-width:86%;}
.se-mot>div{padding:9px 12px 6px;border-radius:18px 18px 18px 6px;background:rgba(255,244,230,.08);min-width:0;}
.se-mot b{display:block;font-size:12.5px;font-weight:800;color:#F6B54B;}
.se-mot b em{font-style:normal;font-weight:600;color:#BFA993;}
.se-mot p{margin:2px 0 0;font-size:15px;line-height:1.4;color:#FFF4E6;white-space:pre-wrap;overflow-wrap:anywhere;}
.se-mot time{display:block;margin-top:2px;text-align:right;font-size:10.5px;color:#9C8670;}
.se-mot.mien{align-self:flex-end;}
.se-mot.mien>div{border-radius:18px 18px 6px 18px;background:linear-gradient(160deg,#FF4FB0,#E0187F);}
.se-mot.mien time{color:rgba(255,255,255,.75);}
.se-mot.clikme>div{background:linear-gradient(160deg,rgba(255,46,154,.2),rgba(245,162,58,.14));border:1px solid rgba(255,140,196,.45);}
.se-mot.clikme b{color:#FF8CC4;}
.se-mot.pense p{font-style:italic;color:#EADBC8;}
.se-av{flex:none;width:34px;height:34px;border-radius:50%;overflow:hidden;background:#2a1a0f;border:1px solid rgba(255,140,196,.5);}
.se-av img{width:100%;height:100%;object-fit:cover;}
.se-verdict{display:inline-block;margin:3px 0 1px;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:900;}
.se-verdict.oui{background:#1FAF55;color:#fff;}
.se-verdict.non{background:#C2410C;color:#fff;}
.se-verdict.hesite{background:#F6B54B;color:#2A1607;}
.se-pied{padding:8px 16px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,244,230,.1);background:#160F0B;}
.se-souci{margin:0 0 6px;font-size:13.5px;color:#FFB4A0;}
.se-gestes{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;}
.se-gestes button{flex:none;padding:8px 13px;border-radius:999px;cursor:pointer;font:inherit;font-size:13.5px;font-weight:800;color:#FFF4E6;
  background:rgba(255,244,230,.06);border:1px solid rgba(255,244,230,.22);}
.se-gestes .clikme{background:linear-gradient(135deg,rgba(255,46,154,.35),rgba(245,162,58,.25));border-color:rgba(255,140,196,.6);}
.se-gestes .amis{border-color:rgba(37,211,102,.6);background:rgba(37,211,102,.14);}
.se-gestes .essayer{border-color:rgba(245,162,58,.6);background:rgba(245,162,58,.14);}
.se-gestes button:disabled{opacity:.55;}
.se-ecrire{display:flex;gap:8px;}
.se-ecrire input{flex:1;min-width:0;height:46px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,244,230,.22);
  background:rgba(255,244,230,.06);color:#FFF4E6;font:inherit;font-size:16px;}
.se-ecrire button{flex:none;height:46px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;font:inherit;font-weight:900;font-size:15px;
  color:#fff;background:linear-gradient(135deg,#FF4FB0,#E0187F);}
.se-ecrire button:disabled{opacity:.45;cursor:default;}
.se-pastille{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:3050;padding:12px 16px;border-radius:999px;border:0;cursor:pointer;
  font:inherit;font-family:var(--font-clikme),"Poppins",system-ui,sans-serif;font-size:14.5px;font-weight:900;color:#fff;
  background:linear-gradient(135deg,#FF4FB0,#E0187F);box-shadow:0 14px 30px -10px rgba(255,46,154,.7);}
@media (min-width:900px){.se-essai{max-height:46vh;}}
`;
