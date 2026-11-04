"use client";

/**
 * 💬 LA RENCONTRE DU JOUR, sur « Ma collection » (`lib/direct/rencontre.ts`) : ce que sa figurine a dit aujourd'hui à
 * une autre figurine (un ami invité, ou un commerce), réplique après réplique, comme un fil de messages. Sous chaque
 * phrase de SA figurine : « ✅ C'est tout moi » / « 🙅 Jamais de la vie » — c'est ce qui la fait lui ressembler —, et
 * une émotion sur n'importe quelle phrase. Sa ressemblance en pourcentage ; « Invite un ami : demain, vos figurines
 * discutent » (WhatsApp) ; ses rencontres d'avant. À lire seulement (pas de voix, décidé le 4 novembre 2026).
 *
 * L'INVITATION : `/collection?ami=<code>` — le code est gardé sur l'appareil, et accepté dès qu'il a un compte.
 */
import { useCallback, useEffect, useState } from "react";
import { EMOTIONS, VERDICTS, texteInvitation, type Emotion, type Participant, type Reaction, type RencontreVue, type Verdict } from "@/lib/direct/rencontre";
import { PanneauEnvoi } from "./ma-figurine";

type Etat = {
  rencontre: RencontreVue | null;
  besoinCarte?: boolean;
  personne?: boolean;
  retiree?: boolean;
  ressemblance: number | null;
  amis: number;
  avant: { id: string; jour: string; avec: string }[];
};
const CLE_AMI = "clikme-ami-v1";

async function poster(corps: Record<string, unknown>) {
  const r = await fetch("/api/direct/rencontre", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(String(j.error || "Ça n’est pas parti. Réessaie dans un instant."));
  return j;
}

const nomDe = (p: Participant) => (p.type === "client" ? p.prenom || "Quelqu’un" : p.nom);
const jourCourt = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

function Avatar({ p, grand = false }: { p: Participant; grand?: boolean }) {
  return (
    <span className={`rd-av${grand ? " grand" : ""}${p.type === "client" && p.figurine ? " figurine" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image} alt="" draggable={false} />
    </span>
  );
}

/** Le fil d'une rencontre, avec ses réactions. */
function Fil({ r, onRessemblance, anime }: { r: RencontreVue; onRessemblance: (n: number | null) => void; anime: boolean }) {
  const [reactions, setReactions] = useState<Record<number, Reaction>>(r.reactions);
  const [montrees, setMontrees] = useState(anime ? 1 : r.repliques.length);
  const [erreur, setErreur] = useState("");
  // les répliques arrivent une à une (comme une vraie conversation), la première fois
  useEffect(() => {
    if (montrees >= r.repliques.length) return;
    const t = window.setTimeout(() => setMontrees((n) => n + 1), 1100);
    return () => window.clearTimeout(t);
  }, [montrees, r.repliques.length]);

  async function reagir(n: number, x: { v?: Verdict | null; e?: Emotion | null }) {
    setErreur("");
    const avant = reactions[n] ?? {};
    const apres: Reaction = { ...avant };
    if (x.v !== undefined) {
      if (x.v) apres.v = x.v;
      else delete apres.v;
    }
    if (x.e !== undefined) {
      if (x.e) apres.e = x.e;
      else delete apres.e;
    }
    setReactions((m) => ({ ...m, [n]: apres }));
    try {
      const j = await poster({ action: "reagir", id: r.id, n, ...x });
      onRessemblance((j.ressemblance as number | null) ?? null);
    } catch (e) {
      setReactions((m) => ({ ...m, [n]: avant }));
      setErreur((e as Error).message);
    }
  }

  return (
    <>
      <ol className="rd-fil">
        {r.repliques.slice(0, montrees).map((x, n) => {
          const re = reactions[n] ?? {};
          return (
            <li key={n} className={x.moi ? "moi" : "autre"}>
              <Avatar p={x.moi ? r.moi : r.autre} />
              <div className="rd-bulle">
                <small>{x.moi ? "Ta figurine" : nomDe(r.autre)}</small>
                <p>{x.texte}</p>
                <div className="rd-reac">
                  {x.moi &&
                    VERDICTS.map((v) => (
                      <button key={v.cle} type="button" className={`rd-verdict${re.v === v.cle ? " pris" : ""}`} aria-pressed={re.v === v.cle} onClick={() => reagir(n, { v: re.v === v.cle ? null : v.cle })}>
                        {v.emoji} {v.dit}
                      </button>
                    ))}
                  {EMOTIONS.map((e) => (
                    <button key={e} type="button" className={`rd-emo${re.e === e ? " pris" : ""}`} aria-pressed={re.e === e} aria-label={`Réagir ${e}`} onClick={() => reagir(n, { e: re.e === e ? null : e })}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {montrees < r.repliques.length && (
        <p className="rd-tape" aria-label="Elle écrit">
          <i />
          <i />
          <i />
        </p>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </>
  );
}

export function RencontreDuJour({ compte, version = 0 }: { compte: boolean | null; version?: number }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(false);
  const [ressemblance, setRessemblance] = useState<number | null>(null);
  const [invitation, setInvitation] = useState("");
  const [ami, setAmi] = useState("");
  const [ancienne, setAncienne] = useState<RencontreVue | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const j = (await (await fetch("/api/direct/rencontre", { cache: "no-store" })).json()) as Etat & { compte?: boolean };
      setEtat(j);
      setRessemblance(j.ressemblance ?? null);
    } catch {
      setEtat(null);
    } finally {
      setChargement(false);
    }
  }, []);

  // LE LIEN D'UN AMI (`?ami=<code>`) : gardé sur l'appareil, accepté dès qu'il a un compte
  useEffect(() => {
    try {
      const code = new URL(window.location.href).searchParams.get("ami");
      if (code) window.localStorage.setItem(CLE_AMI, code);
    } catch {
      /* rien de gardé */
    }
  }, []);
  useEffect(() => {
    if (!compte) return;
    let fini = false;
    (async () => {
      let code = "";
      try {
        code = window.localStorage.getItem(CLE_AMI) ?? "";
      } catch {
        code = "";
      }
      if (code) {
        try {
          const j = await poster({ action: "accepter", code });
          if (!fini && j.ami) setAmi(String(j.ami));
        } catch {
          /* un lien qui n'est plus valable : tant pis */
        }
        try {
          window.localStorage.removeItem(CLE_AMI);
        } catch {
          /* rien */
        }
      }
      if (!fini) await charger();
    })();
    return () => {
      fini = true;
    };
  }, [compte, version, charger]);

  async function inviter() {
    setErreur("");
    try {
      const j = await poster({ action: "inviter" });
      setInvitation(`${window.location.origin}${String(j.lien)}`);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function signaler(id: string) {
    if (!window.confirm("Signaler cette conversation ? Elle ne s’affichera plus.")) return;
    try {
      await poster({ action: "signaler", id });
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function voir(id: string) {
    try {
      const j = (await (await fetch(`/api/direct/rencontre?id=${id}`, { cache: "no-store" })).json()) as { rencontre?: RencontreVue };
      setAncienne(j.rencontre ?? null);
    } catch {
      setAncienne(null);
    }
  }

  if (compte === false)
    return (
      <div className="rd rd-teaser">
        <b>Chaque jour, ta figurine rencontre quelqu’un</b>
        <p>Un ami que tu invites, ou la figurine d’un commerce de ta ville. Elles discutent selon vos personnalités ; tu lis, et tu dis « c’est tout moi » ou « jamais de la vie ».</p>
        <a className="mp-bouton" href="#creer">
          📸 Crée ta figurine pour commencer
        </a>
      </div>
    );
  if (!etat)
    return (
      <div className="rd rd-attente" aria-live="polite">
        {chargement || compte == null ? "💬 Ta figurine discute…" : ""}
      </div>
    );

  const r = ancienne ?? etat.rencontre;
  return (
    <div className="rd">
      {ami && (
        <p className="rd-ami" role="status">
          🎉 Toi et {ami}, c’est fait : votre prochaine rencontre, c’est ensemble !
        </p>
      )}
      {etat.besoinCarte ? (
        <div className="rd-teaser">
          <b>D’abord, ton personnage</b>
          <p>Ta figurine parle comme toi : fais ta carte (sept questions), et demain elle rencontre quelqu’un.</p>
          <a className="mp-bouton" href="#personnage">
            🃏 Faire ma carte
          </a>
        </div>
      ) : etat.retiree ? (
        <p className="rd-note">Cette conversation a été retirée. Rendez-vous demain pour la suivante.</p>
      ) : etat.personne || !r ? (
        <p className="rd-note">Personne à rencontrer aujourd’hui : invite un ami, et demain vos figurines discutent.</p>
      ) : (
        <>
          <header className="rd-tete">
            <span className="rd-duo">
              <Avatar p={r.moi} grand />
              <em aria-hidden="true">⚡</em>
              <Avatar p={r.autre} grand />
            </span>
            <span className="rd-qui">
              <small>{ancienne ? jourCourt(r.jour).toUpperCase() : "AUJOURD’HUI"}</small>
              <b>Ta figurine a rencontré {r.autre.type === "client" ? nomDe(r.autre) : `la figurine de ${r.autre.nom}`}</b>
              {r.autre.type === "client" && r.autre.titre && <span>« {r.autre.titre} »</span>}
            </span>
          </header>
          <Fil key={r.id} r={r} onRessemblance={setRessemblance} anime={!ancienne && !Object.keys(r.reactions).length} />
          <p className="rd-ressemblance">
            {ressemblance == null ? (
              <>🪞 Dis-lui si c’est bien toi : elle apprend à te ressembler.</>
            ) : (
              <>
                🪞 Ta figurine te ressemble à <b>{ressemblance} %</b> : chaque réaction l’affine.
              </>
            )}
          </p>
          <p className="rd-ia">
            Écrit par l’IA, pour jouer.{r.autre.type === "commerce" ? " Ce n’est pas le commerçant qui parle." : ""}{" "}
            <button type="button" onClick={() => signaler(r.id)}>
              Signaler
            </button>
            {ancienne && (
              <button type="button" onClick={() => setAncienne(null)}>
                ← Celle d’aujourd’hui
              </button>
            )}
          </p>
        </>
      )}

      <div className="rd-inviter">
        <b>{etat.amis ? `${etat.amis} ami${etat.amis > 1 ? "s" : ""} relié${etat.amis > 1 ? "s" : ""}. ` : ""}Invite un ami : vos deux figurines discuteront ensemble.</b>
        {invitation ? (
          <PanneauEnvoi lien={invitation} texte={texteInvitation("")} titre="Ton invitation est prête ✓" />
        ) : (
          <button type="button" className="mp-bouton" onClick={inviter}>
            📲 Inviter un ami
          </button>
        )}
      </div>
      {etat.avant.length > 0 && (
        <details className="rd-avant">
          <summary>Tes rencontres d’avant ({etat.avant.length})</summary>
          <ul>
            {etat.avant.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => voir(x.id)}>
                  {jourCourt(x.jour)} · {x.avec}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export const STYLES_RENCONTRE = `
.rd{display:flex;flex-direction:column;gap:14px;padding:16px;border-radius:26px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12)}
.rd-attente{min-height:120px;display:grid;place-items:center;color:#D9C3CB;font-weight:800}
.rd-teaser{display:flex;flex-direction:column;gap:8px}
.rd-teaser b{font-size:19px;font-weight:900;line-height:1.15}
.rd-teaser p,.rd-note{margin:0;font-size:14px;line-height:1.45;color:#D9C3CB}
.rd-ami{margin:0;padding:10px 14px;border-radius:14px;background:rgba(61,226,166,.12);border:1px solid rgba(61,226,166,.45);font-size:14px;font-weight:800;color:#BFF7E2}
.rd-tete{display:flex;align-items:center;gap:12px}
.rd-duo{flex:none;display:flex;align-items:center}
.rd-duo em{font-style:normal;font-size:18px;margin:0 -4px;z-index:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}
.rd-qui{display:flex;flex-direction:column;min-width:0}
.rd-qui small{font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.rd-qui b{font-size:17px;line-height:1.15;font-weight:900}
.rd-qui span{font-size:12.5px;color:#A88E99}
.rd-av{position:relative;flex:none;display:block;width:34px;height:34px;border-radius:50%;overflow:hidden;background:radial-gradient(70% 60% at 50% 40%,#FF9AD0,#C2367F 62%,#5E1240);border:2px solid rgba(255,255,255,.25)}
.rd-av.grand{width:54px;height:54px}
.rd-av img{position:absolute;left:8%;bottom:-2px;width:84%;height:94%;object-fit:contain;object-position:bottom}
.rd-av.figurine img{left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.rd-fil{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}
.rd-fil li{display:flex;align-items:flex-end;gap:8px;animation:rd-arrive .35s cubic-bezier(.2,1.3,.4,1) both}
.rd-fil li.moi{flex-direction:row-reverse}
.rd-bulle{max-width:82%;padding:10px 12px 8px;border-radius:18px 18px 18px 6px;background:rgba(255,255,255,.09)}
.rd-fil li.moi .rd-bulle{border-radius:18px 18px 6px 18px;background:linear-gradient(135deg,rgba(255,46,154,.32),rgba(123,27,94,.4))}
.rd-bulle small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.04em;color:#F2C46B}
.rd-bulle p{margin:2px 0 6px;font-size:15px;line-height:1.38;color:#FFF4E6}
.rd-reac{display:flex;flex-wrap:wrap;gap:4px}
.rd-reac button{padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.2);color:#E8D3DC;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.rd-reac button.pris{border-color:#F2C46B;background:rgba(242,196,107,.2);color:#FFF4E6}
.rd-reac .rd-emo{padding:3px 6px;font-size:14px}
.rd-tape{display:flex;gap:4px;margin:0 0 0 44px}
.rd-tape i{width:7px;height:7px;border-radius:50%;background:#D9C3CB;animation:rd-tape 1s ease-in-out infinite}
.rd-tape i:nth-child(2){animation-delay:.15s}
.rd-tape i:nth-child(3){animation-delay:.3s}
.rd-ressemblance{margin:0;padding:10px 14px;border-radius:14px;background:rgba(242,196,107,.1);border:1px solid rgba(242,196,107,.35);font-size:13.5px;line-height:1.4;color:#FFE7B8}
.rd-ressemblance b{font-size:16px;color:#fff}
.rd-ia{margin:0;font-size:12px;color:#8D7580}
.rd-ia button{margin-left:8px;border:0;background:none;color:#A88E99;font:inherit;font-size:12px;text-decoration:underline;cursor:pointer}
.rd-inviter{display:flex;flex-direction:column;gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.rd-inviter > b{font-size:15px;line-height:1.3}
.rd-avant summary{font-size:13.5px;font-weight:800;color:#D9C3CB;cursor:pointer}
.rd-avant ul{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0;padding:0;list-style:none}
.rd-avant button{padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
@keyframes rd-arrive{from{opacity:0;transform:translateY(10px) scale(.97)}}
@keyframes rd-tape{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@media (min-width:860px){.rd{padding:22px 26px}.rd-bulle{max-width:68%}}
@media (prefers-reduced-motion:reduce){.rd *{animation:none!important}}
`;
