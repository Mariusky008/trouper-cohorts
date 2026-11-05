"use client";

/**
 * 💬 LA RENCONTRE DU JOUR, sur « Ma collection » (`lib/direct/rencontre.ts`) : ce que sa figurine a dit aujourd'hui à
 * une autre figurine (un ami invité, ou un commerce), réplique après réplique, comme un fil de messages. Sous chaque
 * phrase de SA figurine : « ✅ C'est tout moi » / « 🙅 Jamais de la vie » — c'est ce qui la fait lui ressembler —, et
 * une émotion sur n'importe quelle phrase. Sa ressemblance en pourcentage ; « Invite un ami : demain, vos figurines
 * discutent » (WhatsApp) ; ses rencontres d'avant. À lire seulement (pas de voix, décidé le 4 novembre 2026).
 *
 * L'INVITATION : `/collection?ami=<code>` — le code est gardé sur l'appareil, et accepté dès qu'il a un compte.
 *
 * MISE EN VALEUR LE 5 NOVEMBRE 2026 (« une partie importante… que ça donne vraiment envie d'inviter quelqu'un, ou de
 * comprendre que si on ne le fait pas, on peut appuyer sur un compte à rebours pour être mis en contact avec un
 * membre ; et la figurine marrante explique le fonctionnement ») : Clik explique ; la rencontre du jour en vedette,
 * et le temps qui reste avant la suivante ; deux grands choix — « Invite un ami » et le bouton rond « Rencontre un
 * membre » (3… 2… 1…).
 */
import { useCallback, useEffect, useState } from "react";
import { EMOTIONS, VERDICTS, texteInvitation, type Emotion, type Participant, type Reaction, type RencontreVue, type Verdict } from "@/lib/direct/rencontre";
import { PanneauEnvoi } from "./ma-figurine";
import { Mascotte, MascotteDit } from "./mascotte";

type Etat = {
  rencontre: RencontreVue | null;
  besoinCarte?: boolean;
  personne?: boolean;
  retiree?: boolean;
  ressemblance: number | null;
  amis: number;
  avant: { id: string; jour: string; avec: string }[];
  membreAujourdhui: boolean;
  ouvert: boolean;
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

/** Sa figurine s'il l'a ; sinon (un fantôme, un commerce sans figurine) Clik, la figurine d'exemple. */
function Avatar({ p, grand = false }: { p: Participant; grand?: boolean }) {
  const vraie = p.type === "client" ? p.figurine : !p.image.startsWith("/direct/double/");
  return (
    <span className={`rd-av${grand ? " grand" : ""}${vraie ? " figurine" : ""}`} aria-hidden="true">
      {vraie ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" draggable={false} />
      ) : (
        <Mascotte className="rd-clik" fixe />
      )}
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

/** Le temps qui reste jusqu'à minuit, heure de Paris (la prochaine rencontre du jour). */
function useJusquaMinuit(): string {
  const [reste, setReste] = useState("");
  useEffect(() => {
    const maj = () => {
      const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      const g = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
      const s = 86_400 - (g("hour") * 3600 + g("minute") * 60 + g("second"));
      const d = (n: number) => String(n).padStart(2, "0");
      setReste(`${d(Math.floor(s / 3600))}:${d(Math.floor((s % 3600) / 60))}:${d(s % 60)}`);
    };
    maj();
    const t = window.setInterval(maj, 1000);
    return () => window.clearInterval(t);
  }, []);
  return reste;
}

/**
 * 🎲 « RENCONTRER UN MEMBRE » : un gros bouton rond ; on appuie, le compte à rebours tourne (3… 2… 1…), et Clik présente
 * un membre de sa ville. Déjà fait aujourd'hui : le temps qui reste jusqu'à demain.
 */
function BoutonMembre({ fait, onRencontre, onAttente, desactive }: { fait: boolean; onRencontre: (r: RencontreVue) => void; onAttente: () => void; desactive?: boolean }) {
  const [compte, setCompte] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  const minuit = useJusquaMinuit();
  async function lancer() {
    if (!window.confirm("Ta figurine, ton prénom et ta carte seront présentés à un membre de ta ville. D’accord ?")) return;
    setErreur("");
    const reponse = poster({ action: "membre" });
    for (const n of [3, 2, 1]) {
      setCompte(n);
      await new Promise((ok) => window.setTimeout(ok, 750));
    }
    try {
      const j = await reponse;
      setCompte(null);
      if (j.rencontre) onRencontre(j.rencontre as RencontreVue);
      else onAttente();
    } catch (e) {
      setCompte(null);
      setErreur((e as Error).message);
    }
  }
  return (
    <div className="rd-choix rd-membre">
      <b>🎲 Rencontre un membre</b>
      <small>Une figurine de ta ville, au hasard. Vous découvrez vos personnages en lisant leur conversation.</small>
      {fait ? (
        <span className="rd-rebours" aria-label="Prochaine rencontre de membre">
          <i>⏳</i>
          <b>{minuit}</b>
          <small>avant ta prochaine rencontre de membre</small>
        </span>
      ) : (
        <button type="button" className={`rd-rond${compte != null ? " tourne" : ""}`} onClick={lancer} disabled={compte != null || desactive}>
          {compte != null ? <b key={compte}>{compte}</b> : <span>Appuie !</span>}
        </button>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function RencontreDuJour({ compte, version = 0, allerA }: { compte: boolean | null; version?: number; allerA?: (o: string) => void }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(false);
  const [ressemblance, setRessemblance] = useState<number | null>(null);
  const [invitation, setInvitation] = useState("");
  const [ami, setAmi] = useState("");
  const [ancienne, setAncienne] = useState<RencontreVue | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState("");
  const minuit = useJusquaMinuit();

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
      setAncienne(null);
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function bloquer(id: string) {
    if (!window.confirm("Ne plus rencontrer ce membre ?")) return;
    try {
      await poster({ action: "bloquer", id });
      setErreur("");
      window.alert("C’est noté : vous ne serez plus présentés.");
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function arreter() {
    try {
      await poster({ action: "arreter-membres" });
      setAttente(false);
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

  const tete = (
    <header className="og-tete">
      <small>RENCONTRES</small>
      <h2>La rencontre du jour</h2>
    </header>
  );
  const explique = (
    <MascotteDit
      cle="rencontres"
      repliques={[
        "Chaque jour, ta figurine rencontre une autre figurine 💬",
        "Elles discutent selon vos personnalités : ta carte, ta façon de parler, ce que tu aimes.",
        "Toi, tu lis… et tu me dis si c’est bien toi ! ✅ ou 🙅 : plus tu réagis, plus elle te ressemble 🪞",
        "Avec qui ? Un ami que tu invites, la figurine d’un commerce… ou un membre de ta ville, au hasard 🎲",
      ]}
    />
  );

  if (compte === false)
    return (
      <div className="rd-onglet">
        {tete}
        {explique}
        <button type="button" className="og-go" onClick={() => allerA?.("figurine")}>
          📸 Crée ta figurine pour commencer
        </button>
      </div>
    );
  if (!etat)
    return (
      <div className="rd-onglet">
        {tete}
        <div className="rd rd-attente" aria-live="polite">
          {chargement || compte == null ? "💬 Ta figurine discute…" : ""}
        </div>
      </div>
    );

  const r = ancienne ?? etat.rencontre;
  return (
    <div className="rd-onglet">
      {tete}
      {explique}
      {ami && (
        <p className="rd-ami" role="status">
          🎉 Toi et {ami}, c’est fait : votre prochaine rencontre, c’est ensemble !
        </p>
      )}

      {/* LA RENCONTRE DU JOUR, EN VEDETTE */}
      <div className={`rd${r ? " rd-vedette" : ""}`}>
        {etat.besoinCarte ? (
          <div className="rd-teaser">
            <b>D’abord, ton personnage 🃏</b>
            <p>Ta figurine parle comme toi : fais ta carte (sept questions), et elle part à la rencontre des autres.</p>
            <button type="button" className="og-go" onClick={() => allerA?.("personnage")}>
              🃏 Faire ma carte
            </button>
          </div>
        ) : etat.retiree ? (
          <p className="rd-note">Cette conversation a été retirée. Rendez-vous demain pour la suivante.</p>
        ) : etat.personne || !r ? (
          <p className="rd-note">Personne à rencontrer aujourd’hui : invite un ami, ou appuie sur « Rencontre un membre » 👇</p>
        ) : (
          <>
            <header className="rd-tete">
              <span className="rd-duo">
                <Avatar p={r.moi} grand />
                <em aria-hidden="true">⚡</em>
                <Avatar p={r.autre} grand />
              </span>
              <span className="rd-qui">
                <small>{ancienne ? jourCourt(r.jour).toUpperCase() : r.membre ? "AUJOURD’HUI · UN MEMBRE" : "AUJOURD’HUI"}</small>
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
                  🪞 Ta figurine te ressemble à <b>{ressemblance} %</b>
                  <span className="rd-jauge">
                    <i style={{ width: `${ressemblance}%` }} />
                  </span>
                </>
              )}
            </p>
            <p className="rd-ia">
              Écrit par l’IA, pour jouer.{r.autre.type === "commerce" ? " Ce n’est pas le commerçant qui parle." : ""}{" "}
              <button type="button" onClick={() => signaler(r.id)}>
                Signaler
              </button>
              {r.membre && (
                <button type="button" onClick={() => bloquer(r.id)}>
                  Ne plus rencontrer ce membre
                </button>
              )}
              {ancienne && (
                <button type="button" onClick={() => setAncienne(null)}>
                  ← Celle d’aujourd’hui
                </button>
              )}
            </p>
          </>
        )}
        {!etat.besoinCarte && (
          <p className="rd-prochaine">
            ⏳ Prochaine rencontre dans <b>{minuit}</b>
          </p>
        )}
      </div>

      {/* LES DEUX FAÇONS D'EN AVOIR PLUS */}
      {!etat.besoinCarte && (
        <div className="rd-choix-grille">
          <div className="rd-choix rd-inviter">
            <b>👯 Invite un ami</b>
            <small>Dès qu’il a fait sa carte, vos deux figurines discutent. {etat.amis ? `Déjà ${etat.amis} ami${etat.amis > 1 ? "s" : ""} relié${etat.amis > 1 ? "s" : ""} !` : ""}</small>
            {invitation ? (
              <PanneauEnvoi lien={invitation} texte={texteInvitation("")} titre="Ton invitation est prête ✓" />
            ) : (
              <button type="button" className="mp-bouton" onClick={inviter}>
                📲 Inviter un ami
              </button>
            )}
          </div>
          <BoutonMembre
            fait={etat.membreAujourdhui}
            onRencontre={(x) => {
              setAncienne(null);
              setEtat((e) => (e ? { ...e, rencontre: x, membreAujourdhui: true, personne: false, retiree: false } : e));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onAttente={() => {
              setAttente(true);
              setEtat((e) => (e ? { ...e, ouvert: true } : e));
            }}
          />
        </div>
      )}
      {(attente || etat.ouvert) && !etat.membreAujourdhui && (
        <p className="rd-file" role="status">
          🕐 Tu es dans la file : le prochain membre de ta ville qui appuie rencontrera ta figurine. Tu la verras ici.{" "}
          <button type="button" onClick={arreter}>
            Ne plus me faire rencontrer
          </button>
        </p>
      )}

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
.rd-onglet{display:flex;flex-direction:column;gap:16px}
.rd-vedette{border:1.5px solid rgba(255,46,154,.5);background:linear-gradient(180deg,rgba(255,46,154,.14),rgba(255,255,255,.03));box-shadow:0 26px 50px -30px rgba(255,46,154,.8)}
.rd-clik{position:absolute;left:4%;bottom:0;width:92%;height:auto}
.rd-prochaine{margin:0;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#D9C3CB;text-align:center}
.rd-prochaine b{font-variant-numeric:tabular-nums;color:#F2C46B;font-size:15px}
.rd-jauge{display:block;height:8px;margin-top:6px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.rd-jauge i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .6s cubic-bezier(.2,1.2,.4,1)}
.rd-choix-grille{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
.rd-choix{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.rd-choix > b{font-size:19px;font-weight:900}
.rd-choix > small{font-size:13.5px;line-height:1.4;color:#D9C3CB}
.rd-membre{align-items:center;text-align:center;background:radial-gradient(80% 70% at 50% 100%,rgba(242,196,107,.18),transparent 70%),rgba(255,255,255,.06);border-color:rgba(242,196,107,.4)}
.rd-rond{display:grid;place-items:center;width:132px;height:132px;margin:6px 0 2px;border-radius:50%;border:0;background:conic-gradient(from 0deg,#FF2E9A,#F2C46B,#FF2E9A);color:#fff;font:inherit;cursor:pointer;box-shadow:0 0 0 8px rgba(255,46,154,.15),0 18px 34px -12px rgba(255,46,154,.9);animation:rd-appel 2s ease-in-out infinite}
.rd-rond span{display:grid;place-items:center;width:110px;height:110px;border-radius:50%;background:#2A0F1F;font-size:17px;font-weight:900}
.rd-rond b{display:grid;place-items:center;width:110px;height:110px;border-radius:50%;background:#2A0F1F;font-size:52px;font-weight:900;animation:rd-chiffre .75s cubic-bezier(.2,1.6,.4,1)}
.rd-rond.tourne{animation:rd-tourne .75s linear infinite}
.rd-rond.tourne b{animation:rd-chiffre .75s cubic-bezier(.2,1.6,.4,1),rd-contre .75s linear infinite}
.rd-rond:disabled{cursor:default}
.rd-rebours{display:flex;flex-direction:column;align-items:center;gap:2px;margin:6px 0}
.rd-rebours i{font-style:normal;font-size:30px}
.rd-rebours b{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;color:#F2C46B}
.rd-rebours small{font-size:12.5px;color:#D9C3CB}
.rd-file{margin:0;padding:12px 14px;border-radius:16px;background:rgba(142,197,255,.1);border:1px solid rgba(142,197,255,.4);font-size:13.5px;line-height:1.45;color:#D8E9FF}
.rd-file button{border:0;background:none;color:#A8C8F0;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
@keyframes rd-appel{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes rd-tourne{to{transform:rotate(360deg)}}
@keyframes rd-contre{to{transform:rotate(-360deg)}}
@keyframes rd-chiffre{from{transform:scale(2.2);opacity:0}}
@media (min-width:860px){.rd-choix-grille{grid-template-columns:1fr 1fr}}
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
@media (prefers-reduced-motion:reduce){.rd *,.rd-onglet *{animation:none!important}}
`;
