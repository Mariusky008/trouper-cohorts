"use client";

// 🎁 LE CADEAU OFFERT — côté commerçant, dans le fil, et chez le gagnant.
//
// TROIS PIÈCES, POUR LA MÊME HISTOIRE, ET LES MÊMES POUR TOUS LES MÉTIERS :
//   · `CoteCommercant` — le commerçant lance « 3 consos offertes », « 3
//                     desserts offerts »… ; il voit qui a gagné, valide les
//                     codes d'un appui, et compte combien sont venus grâce à ça.
//   · `CarteCadeau` — ce que tout le salon voit : le lancement, le tirage qui
//                     tourne, puis les fantômes gagnants.
//   · `EcranGagne`  — chez le gagnant, l'écran de fête : rayons, confettis, son
//                     fantôme, et le ticket avec son code et son compte à rebours.
//
// Les mots viennent du métier (`lib/site-internet/cadeau-offert.ts`) ; le
// tirage et les codes de `lib/direct/cadeaux.ts`.

import { useEffect, useState } from "react";
import { finDuCadeau, type Cadeau } from "@/lib/direct/cadeaux";
import { combienDe, dureeLisible, parmiLisible, type Parmi, type ProfilCadeau } from "@/lib/site-internet/cadeau-offert";

/** « 44:12 », « 2 h 05 », « 6 j 23 h » : ce qu'il reste d'un code. */
export function reste(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s >= 86400) return `${Math.floor(s / 86400)} j ${Math.floor((s % 86400) / 3600)} h`;
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Une source de participants proposée au commerçant : « Ce salon · 4 ». */
export type SourceCadeau = { parmi: Parmi; mot: string; combien: number };

/* ═══ CÔTÉ COMMERÇANT ═══ */
export function CoteCommercant({
  profil,
  lieu,
  cadeau,
  maintenant,
  sources,
  onLancer,
  onValider,
  onNouvelle,
  onFermer,
}: {
  profil: ProfilCadeau;
  lieu: string;
  cadeau?: Cadeau;
  maintenant: number;
  /** Au moins une : le salon, la soirée, ou ceux qui ont gardé une pièce. */
  sources: SourceCadeau[];
  onLancer: (o: { nombre: number; quoi: string; duree: number; parmi: Parmi }) => void;
  onValider: (code: string) => boolean;
  onNouvelle: () => void;
  onFermer: () => void;
}) {
  const [nombre, setNombre] = useState(3);
  const [quoi, setQuoi] = useState(profil.quoi);
  const [duree, setDuree] = useState(profil.durees[profil.durees.length - 1]);
  const [parmi, setParmi] = useState<Parmi>(sources[0]?.parmi ?? "salon");
  const [saisie, setSaisie] = useState("");
  const [mot, setMot] = useState("");
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onFermer]);

  const source = sources.find((x) => x.parmi === parmi) ?? sources[0];
  const venus = cadeau?.gagnants?.filter((g) => g.valide).length ?? 0;
  return (
    <div className="cg-f" role="dialog" aria-modal="true" aria-label={`${profil.cote} : offrir des ${profil.plusieurs}`}>
      <button type="button" className="cg-f-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="cg-f-p">
        <i className="cg-f-poignee" aria-hidden="true" />
        <p className="cg-cote">
          <span>{profil.cote}</span> {lieu}
        </p>
        <h3>
          🎁 Offrir des {profil.plusieurs.replace(/ offert(e)?s$/, "")}
        </h3>
        {!cadeau ? (
          <>
            <p className="cg-s">
              {parmi === "viennent"
                ? `Ce soir c’est calme ? Faites venir du monde : quelques ${profil.plusieurs}, au tirage au sort parmi ceux qui comptent venir.`
                : parmi === "favoris"
                  ? `Faites revenir ceux qui ont eu un coup de cœur : quelques ${profil.plusieurs}, au tirage au sort parmi ceux qui ont gardé une pièce de chez vous.`
                  : `On parle de vous dans ce salon : quelques ${profil.plusieurs}, au tirage au sort parmi ses membres.`}
            </p>
            {sources.length > 1 && (
              <div className="cg-ligne">
                <b>À qui</b>
                <span className="cg-choix">
                  {sources.map((x) => (
                    <button key={x.parmi} type="button" className={parmi === x.parmi ? "on" : ""} aria-pressed={parmi === x.parmi} onClick={() => setParmi(x.parmi)}>
                      {x.mot} · {x.combien}
                    </button>
                  ))}
                </span>
              </div>
            )}
            <div className="cg-ligne">
              <b>Combien</b>
              <span className="cg-pas">
                <button type="button" aria-label="Un de moins" onClick={() => setNombre((n) => Math.max(1, n - 1))} disabled={nombre <= 1}>
                  −
                </button>
                <strong>{nombre}</strong>
                <button type="button" aria-label="Un de plus" onClick={() => setNombre((n) => Math.min(5, n + 1))} disabled={nombre >= 5}>
                  +
                </button>
              </span>
            </div>
            <label className="cg-champ">
              <b>Ce qui est offert</b>
              <input value={quoi} onChange={(e) => setQuoi(e.target.value)} maxLength={80} />
            </label>
            <div className="cg-ligne">
              <b>Code valable</b>
              <span className="cg-choix">
                {profil.durees.map((d) => (
                  <button key={d} type="button" className={duree === d ? "on" : ""} aria-pressed={duree === d} onClick={() => setDuree(d)}>
                    {dureeLisible(d)}
                  </button>
                ))}
              </span>
            </div>
            <ul className="cg-regles">
              <li>
                🎟️ Tirage au sort parmi les {source?.combien ?? 0} {parmiLisible(parmi).replace(/^(ceux|les) /, "")} — pas au plus rapide.
              </li>
              <li>☝️ Une chance par personne.</li>
              <li>✅ Le gagnant montre son code {profil.sur} ; vous le validez d’un appui.</li>
            </ul>
            {profil.alcool && (
              <p className="cg-loi">
                L’alcool offert est encadré (pas d’« à volonté », publicité limitée par la loi Évin) : proposez une boisson au choix, avec ou sans
                alcool, et faites vérifier votre offre avant de la lancer pour de vrai.
              </p>
            )}
            <button type="button" className="cg-b" onClick={() => onLancer({ nombre, quoi, duree, parmi })}>
              Lancer {combienDe(profil, nombre)}
            </button>
          </>
        ) : (
          <>
            {!cadeau.gagnants ? (
              <p className="cg-s">
                Lancé ! Le tirage a lieu dans <b>{reste(cadeau.tirageLe - maintenant)}</b>
                {cadeau.parmi === "favoris" ? " — chacun l’apprend sur son téléphone." : " — tout le salon le voit tourner."}
              </p>
            ) : (
              <>
                <div className="cg-stats">
                  <span>
                    <b>{cadeau.nombre}</b>à gagner
                  </span>
                  <span>
                    <b>{cadeau.participants ?? 0}</b>au tirage
                  </span>
                  <span className="fort">
                    <b>
                      {venus}/{cadeau.gagnants.length}
                    </b>
                    {venus > 1 ? "venus grâce à ça" : "venu grâce à ça"}
                  </span>
                </div>
                <p className="cg-sous">Les gagnants — validez leur code quand ils le montrent :</p>
                <ul className="cg-gagnants">
                  {cadeau.gagnants.map((g) => (
                    <li key={g.code}>
                      <span>
                        <b>{g.moi ? `${g.nom} · toi` : g.nom}</b>
                        <code>{g.code}</code>
                      </span>
                      {g.valide ? (
                        <em>✓ Venu</em>
                      ) : (
                        <button type="button" onClick={() => onValider(g.code)} disabled={maintenant > finDuCadeau(cadeau)}>
                          Valider
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <form
                  className="cg-saisie"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setMot(onValider(saisie) ? "Code validé : merci de sa visite !" : "Code inconnu, déjà utilisé ou expiré.");
                    setSaisie("");
                  }}
                >
                  <input value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Ou tapez le code montré : CLK-…" aria-label="Code à valider" />
                  <button type="submit" disabled={!saisie.trim()}>
                    Valider
                  </button>
                </form>
                {mot && <p className="cg-mot">{mot}</p>}
              </>
            )}
            <button type="button" className="cg-lien" onClick={onNouvelle}>
              Recommencer la démonstration
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ LA CARTE DANS LE FIL ═══ */
export function CarteCadeau({
  cadeau,
  maintenant,
  fantomeDe,
  monFantome,
  jeParticipe,
  onParticiper,
  onTicket,
}: {
  cadeau?: Cadeau;
  maintenant: number;
  fantomeDe: (nom: string) => string;
  monFantome: string;
  /** J'ai dit que je venais (soirée), ou je suis membre du salon. */
  jeParticipe: boolean;
  /** Ce qui me fait participer : « Je compte venir ». Absent : rien à faire d'ici. */
  onParticiper?: () => void;
  onTicket: () => void;
}) {
  if (!cadeau) return <p className="cg-passe">🎁 Un cadeau a été offert ici. Ce tirage est terminé.</p>;
  const tire = !!cadeau.gagnants;
  const moi = cadeau.gagnants?.find((g) => g.moi);
  const soiree = cadeau.parmi === "viennent";
  return (
    <div className={`cg-carte${tire ? " tire" : ""}`}>
      <span className="cg-carte-eclat" aria-hidden="true" />
      <p className="cg-carte-h">
        <i aria-hidden="true">🎁</i>
        {cadeau.par} offre
      </p>
      <b className="cg-carte-t">{combienDe(cadeau.mots, cadeau.nombre)}</b>
      <p className="cg-carte-q">{cadeau.quoi}</p>
      {!tire ? (
        <>
          <div className="cg-roue" aria-hidden="true">
            <span>🎟️</span>
          </div>
          <p className="cg-carte-a">
            {cadeau.tirageLe - maintenant > 500 ? (
              <>
                Tirage au sort dans <b>{reste(cadeau.tirageLe - maintenant)}</b>
              </>
            ) : (
              <>
                Tirage en cours… <b>🎲</b>
              </>
            )}
            <small>parmi {parmiLisible(cadeau.parmi)} · une chance par personne</small>
          </p>
          {jeParticipe ? (
            <p className="cg-carte-ok">✓ Tu participes{soiree ? "" : " : tu es dans le salon"}</p>
          ) : onParticiper ? (
            <button type="button" className="cg-carte-b" onClick={onParticiper}>
              {soiree ? "Je compte venir — je participe" : "Rejoindre le salon — je participe"}
            </button>
          ) : (
            <p className="cg-carte-ok">{soiree ? "Pour participer, dis que tu viens depuis la soirée" : "Réservé aux membres du salon"}</p>
          )}
        </>
      ) : (
        <>
          <div className="cg-elus">
            {cadeau.gagnants!.map((g, i) => (
              <span key={g.code} className={`cg-elu${g.moi ? " moi" : ""}`} style={{ animationDelay: `${i * 0.18}s` }}>
                <span className="cg-elu-f">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.moi ? monFantome : fantomeDe(g.nom)} alt="" />
                  {g.valide && <i aria-label="Venu">✓</i>}
                </span>
                <em>{g.moi ? "Toi ⭐" : g.nom}</em>
              </span>
            ))}
          </div>
          {moi ? (
            <button type="button" className="cg-carte-b" onClick={onTicket}>
              🎉 Tu as gagné — voir mon ticket
            </button>
          ) : jeParticipe ? (
            <p className="cg-carte-ok">Pas cette fois… le prochain tirage sera peut-être le tien.</p>
          ) : onParticiper ? (
            <button type="button" className="cg-carte-b deux" onClick={onParticiper}>
              {soiree ? "Dis que tu viens pour le prochain tirage" : "Rejoins le salon pour le prochain tirage"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Le ticket épinglé en haut de la discussion, tant qu'il est valable. */
export function TicketEpingle({ cadeau, maintenant, onOuvrir }: { cadeau: Cadeau; maintenant: number; onOuvrir: () => void }) {
  const moi = cadeau.gagnants?.find((g) => g.moi);
  if (!moi) return null;
  const fin = finDuCadeau(cadeau);
  return (
    <button type="button" className={`cg-epingle${moi.valide ? " fait" : ""}`} onClick={onOuvrir}>
      <i aria-hidden="true">🎟️</i>
      <span>
        <b>
          {moi.valide ? "Ticket validé" : "Ton ticket"} · {cadeau.mots.un}
        </b>
        <em>{moi.valide ? `${cadeau.mots.merci} ${cadeau.mots.emoji}` : maintenant > fin ? "Expiré" : `${moi.code} · encore ${reste(fin - maintenant)}`}</em>
      </span>
      <s aria-hidden="true">›</s>
    </button>
  );
}

/* ═══ L'ÉCRAN DU GAGNANT — gamifié au maximum ═══ */
const CONFETTIS = Array.from({ length: 34 }, (_, i) => ({
  g: (i * 37) % 100,
  d: (i * 0.13) % 1.6,
  t: 2.6 + ((i * 7) % 10) / 6,
  c: ["#FFD34E", "#F0418F", "#FFFFFF", "#7FE3C6", "#F6B54B", "#B58CFF"][i % 6],
  r: (i * 47) % 360,
  l: i % 3 === 0,
}));

export function EcranGagne({
  cadeau,
  maintenant,
  monFantome,
  prenom,
  onFermer,
  onValiderDemo,
}: {
  cadeau: Cadeau;
  maintenant: number;
  monFantome: string;
  prenom: string;
  onFermer: () => void;
  /** Démonstration : jouer le geste du comptoir depuis le téléphone. */
  onValiderDemo?: () => void;
}) {
  const moi = cadeau.gagnants?.find((g) => g.moi);
  const [ouvert, setOuvert] = useState(false);
  // LE CADEAU S'OUVRE UNE FOIS, À L'ARRIVÉE. Le minuteur ne dépend de rien :
  // l'écran parent se redessine chaque seconde (et le salon bien plus souvent),
  // et un minuteur relancé à chaque fois ne se déclencherait jamais.
  useEffect(() => {
    const t = window.setTimeout(() => setOuvert(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onFermer]);
  if (!moi) return null;
  const fin = finDuCadeau(cadeau);
  const part = Math.max(0, Math.min(1, (fin - maintenant) / (cadeau.duree * 60_000)));
  return (
    <div className={`cg-gagne${ouvert ? " ouvert" : ""}`} role="dialog" aria-modal="true" aria-label={`Tu as gagné : ${cadeau.mots.un}`}>
      <span className="cg-rayons" aria-hidden="true" />
      <span className="cg-confettis" aria-hidden="true">
        {CONFETTIS.map((x, i) => (
          <i
            key={i}
            className={x.l ? "long" : ""}
            style={{ left: `${x.g}%`, background: x.c, animationDelay: `${x.d}s`, animationDuration: `${x.t}s`, transform: `rotate(${x.r}deg)` }}
          />
        ))}
      </span>
      <button type="button" className="cg-gagne-x" aria-label="Fermer" onClick={onFermer}>
        ✕
      </button>
      <div className="cg-gagne-c">
        <p className="cg-gagne-h">🎉 Tirage au sort · {cadeau.par}</p>
        <h3 className="cg-gagne-t">
          {prenom ? `${prenom}, tu` : "Tu"} as gagné !
        </h3>
        <div className="cg-scene" aria-hidden="true">
          <span className="cg-boite">
            <i className="cg-couvercle" />
            <i className="cg-corps" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cg-moi" src={monFantome} alt="" />
          <span className="cg-verre">{cadeau.mots.emoji}</span>
        </div>
        <p className="cg-gagne-q">{cadeau.quoi}</p>
        <div className={`cg-ticket${moi.valide ? " fait" : ""}`}>
          <span className="cg-ticket-h">
            <b>{cadeau.mots.un.toUpperCase()}</b>
            <em>{cadeau.par}</em>
          </span>
          <span className="cg-ticket-code">{moi.code}</span>
          {moi.valide ? (
            <span className="cg-tampon">VALIDÉ ✓ · {cadeau.mots.merci}</span>
          ) : maintenant > fin ? (
            <span className="cg-ticket-r">Ce code a expiré.</span>
          ) : (
            <>
              <span className="cg-ticket-r">
                Valable encore <b>{reste(fin - maintenant)}</b>
              </span>
              <span className="cg-jauge" aria-hidden="true">
                <i style={{ transform: `scaleX(${part})` }} />
              </span>
            </>
          )}
        </div>
        {!moi.valide && (
          <p className="cg-gagne-n">
            Montre ce code {cadeau.mots.sur} : {cadeau.par} le valide d’un appui. Une chance par personne.
          </p>
        )}
        <button type="button" className="cg-b" onClick={onFermer}>
          {moi.valide ? "Retour à la discussion" : "Je garde mon ticket"}
        </button>
        {!moi.valide && onValiderDemo && (
          <button type="button" className="cg-lien" onClick={onValiderDemo}>
            Démo : jouer la validation sur place
          </button>
        )}
      </div>
    </div>
  );
}

export function StylesCadeau() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.cg-f{position:absolute;inset:0;z-index:41;display:flex;flex-direction:column;justify-content:flex-end;}
.cg-f-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(14,6,3,.6);cursor:pointer;}
.cg-f-p{position:relative;max-height:94%;overflow-y:auto;overscroll-behavior:contain;padding:12px 16px calc(16px + env(safe-area-inset-bottom,0px));
  border-radius:28px 28px 0 0;background:linear-gradient(180deg,#2c2318,#1d170f);border:1.5px solid rgba(246,181,75,.55);border-bottom:0;
  box-shadow:0 -14px 40px rgba(0,0,0,.5);color:#FFF4EA;animation:cg-monte .3s cubic-bezier(.2,.8,.3,1) both;}
@keyframes cg-monte{from{transform:translateY(40px);opacity:.4;}to{transform:none;opacity:1;}}
.cg-f-poignee{display:block;width:42px;height:4px;margin:0 auto 8px;border-radius:4px;background:rgba(255,236,210,.35);}
.cg-cote{margin:0;font-size:13px;color:#E9D3C6;}
.cg-cote span{display:inline-block;margin-right:6px;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#2A1608;background:#F6B54B;}
.cg-f-p h3{margin:8px 0 4px;font-size:24px;font-weight:850;}
.cg-s{margin:0 0 10px;font-size:14.5px;line-height:1.4;color:#EADBC9;}
.cg-ligne{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;}
.cg-ligne b,.cg-champ b{font-size:14.5px;font-weight:700;}
.cg-ligne>b{flex:none;}
.cg-pas{display:flex;align-items:center;gap:12px;}
.cg-pas button{width:40px;height:40px;border-radius:50%;border:1px solid rgba(246,181,75,.6);background:rgba(246,181,75,.12);color:#FFE3BD;font:inherit;font-size:22px;cursor:pointer;}
.cg-pas button:disabled{opacity:.35;cursor:default;}
.cg-pas strong{min-width:22px;text-align:center;font-size:24px;}
.cg-champ{display:flex;flex-direction:column;gap:6px;margin-top:12px;}
.cg-champ input,.cg-saisie input{height:46px;padding:0 14px;border-radius:14px;border:1px solid rgba(255,220,200,.2);background:rgba(255,236,224,.06);color:#FFF4EA;font:inherit;font-size:15px;}
.cg-choix{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;}
.cg-choix button{min-width:72px;min-height:38px;padding:4px 12px;border-radius:999px;border:1px solid rgba(255,220,200,.25);background:none;color:#EADBC9;font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
.cg-choix button.on{background:#F6B54B;border-color:#F6B54B;color:#2A1608;}
.cg-regles{margin:14px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13.5px;line-height:1.35;color:#EADBC9;}
.cg-loi{margin:12px 0;padding:10px 12px;border-radius:12px;font-size:12.5px;line-height:1.4;color:#FFE3BD;background:rgba(246,181,75,.08);border:1px dashed rgba(246,181,75,.45);}
.cg-b{display:block;width:100%;min-height:54px;margin-top:6px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:17px;font-weight:850;color:#2A1608;
  background:linear-gradient(180deg,#FFD76A,#F0A23A);box-shadow:0 8px 24px rgba(240,162,58,.4);}
.cg-lien{display:block;margin:10px auto 0;padding:6px;border:0;background:none;color:#F6B54B;font:inherit;font-size:13.5px;font-weight:700;text-decoration:underline;cursor:pointer;}
.cg-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 12px;}
.cg-stats span{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;border-radius:14px;font-size:12px;color:#EADBC9;text-align:center;background:rgba(255,236,224,.06);}
.cg-stats b{font-size:22px;color:#FFF4EA;}
.cg-stats .fort{background:rgba(246,181,75,.16);border:1px solid rgba(246,181,75,.5);}
.cg-stats .fort b{color:#FFD76A;}
.cg-sous{margin:0 0 6px;font-size:13.5px;color:#EADBC9;}
.cg-gagnants{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;}
.cg-gagnants li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px 8px 14px;border-radius:14px;background:rgba(255,236,224,.06);}
.cg-gagnants li span{display:flex;flex-direction:column;gap:2px;min-width:0;}
.cg-gagnants code{font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#FFD76A;}
.cg-gagnants button,.cg-saisie button{min-height:38px;padding:0 16px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:14px;font-weight:800;color:#2A1608;background:#F6B54B;}
.cg-gagnants button:disabled,.cg-saisie button:disabled{opacity:.4;cursor:default;}
.cg-gagnants em{font-style:normal;font-size:14px;font-weight:800;color:#7FE3C6;}
.cg-saisie{display:flex;gap:8px;margin-top:10px;}
.cg-saisie input{flex:1;min-width:0;}
.cg-mot{margin:8px 0 0;font-size:13px;color:#FFE3BD;}

.cg-carte{position:relative;align-self:stretch;overflow:hidden;margin:4px 0;padding:16px 16px 14px;border-radius:22px;text-align:center;
  background:radial-gradient(120% 90% at 50% 0%,#5b2a10 0%,#3a1a2b 55%,#24121d 100%);border:2px solid #F6B54B;
  box-shadow:0 0 0 4px rgba(246,181,75,.15),0 10px 30px rgba(240,162,58,.25);animation:cg-arrive .5s cubic-bezier(.2,1.4,.4,1) both;}
@keyframes cg-arrive{from{transform:scale(.85);opacity:0;}to{transform:none;opacity:1;}}
.cg-carte-eclat{position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent 0 20deg,rgba(255,215,106,.14) 20deg 40deg,transparent 40deg 70deg,rgba(240,65,143,.12) 70deg 90deg,transparent 90deg 360deg);animation:cg-tourne 9s linear infinite;pointer-events:none;}
@keyframes cg-tourne{to{transform:rotate(360deg);}}
.cg-carte>*{position:relative;}
.cg-carte-h{display:inline-flex;align-items:center;gap:6px;margin:0;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#2A1608;background:#FFD76A;}
.cg-carte-t{display:block;margin:10px 0 2px;font-size:28px;line-height:1.05;font-weight:900;letter-spacing:-.01em;
  background:linear-gradient(180deg,#FFF6D8,#FFD76A 55%,#F0A23A);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35));}
.cg-carte-q{margin:0;font-size:14px;color:#FFE3BD;}
.cg-roue{display:grid;place-items:center;width:74px;height:74px;margin:12px auto 6px;border-radius:50%;
  background:conic-gradient(#F0418F 0 25%,#FFD76A 0 50%,#F0418F 0 75%,#FFD76A 0);animation:cg-tourne 1.1s linear infinite;box-shadow:0 0 22px rgba(255,215,106,.5);}
.cg-roue span{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#2a1520;font-size:26px;animation:cg-tourne 1.1s linear infinite reverse;}
.cg-carte-a{display:flex;flex-direction:column;gap:2px;margin:0;font-size:15px;color:#FFF4EA;}
.cg-carte-a b{font-family:ui-monospace,Menlo,monospace;font-size:20px;color:#FFD76A;}
.cg-carte-a small{font-size:12.5px;color:#EADBC9;}
.cg-carte-b{margin-top:12px;min-height:46px;padding:0 20px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:15px;font-weight:850;color:#2A1608;
  background:linear-gradient(180deg,#FFD76A,#F0A23A);box-shadow:0 6px 18px rgba(240,162,58,.35);animation:cg-pulse 1.6s ease-in-out infinite;}
.cg-carte-b.deux{color:#FFE3BD;background:rgba(246,181,75,.14);border:1.5px solid rgba(246,181,75,.6);box-shadow:none;animation:none;}
@keyframes cg-pulse{50%{transform:scale(1.04);}}
.cg-carte-ok{margin:10px 0 0;font-size:14px;font-weight:700;color:#7FE3C6;}
.cg-elus{display:flex;justify-content:center;gap:12px;margin:14px 0 2px;flex-wrap:wrap;}
.cg-elu{display:flex;flex-direction:column;align-items:center;gap:4px;width:74px;animation:cg-saute .6s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes cg-saute{from{transform:translateY(16px) scale(.6);opacity:0;}to{transform:none;opacity:1;}}
.cg-elu-f{position:relative;display:block;width:62px;height:62px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 30%,#7a4a1e,#2e1a12 75%);border:2.5px solid #FFD76A;box-shadow:0 0 14px rgba(255,215,106,.5);}
.cg-elu-f img{position:absolute;left:50%;top:6%;width:132%;height:auto;max-width:none;transform:translateX(-50%);}
.cg-elu-f i{position:absolute;right:0;bottom:0;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-style:normal;font-size:13px;font-weight:900;color:#0f2d24;background:#7FE3C6;}
.cg-elu em{max-width:100%;font-style:normal;font-size:12px;font-weight:700;color:#FFF4EA;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cg-elu.moi .cg-elu-f{border-color:#F0418F;box-shadow:0 0 0 3px rgba(240,65,143,.35),0 0 20px rgba(240,65,143,.6);}
.cg-elu.moi em{color:#FFD76A;}
.cg-passe{align-self:center;margin:0;padding:6px 12px;border-radius:999px;font-size:12.5px;color:#E9D3C6;background:rgba(255,236,224,.06);}

.cg-etat{margin:0 0 4px;padding:9px 12px;border-radius:14px;font-size:13px;line-height:1.4;color:#FFE3BD;
  background:linear-gradient(90deg,rgba(255,215,106,.16),rgba(240,65,143,.12));border:1px solid rgba(255,215,106,.55);}
.cg-demo{display:flex;align-items:center;gap:12px;width:100%;margin-top:12px;padding:12px 14px;border-radius:18px;cursor:pointer;text-align:left;font:inherit;color:#FFF4EA;
  background:rgba(246,181,75,.08);border:1.5px dashed rgba(246,181,75,.7);}
.cg-demo i{font-style:normal;font-size:26px;}
.cg-demo span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.cg-demo b{font-size:15.5px;color:#FFD76A;}
.cg-demo em{font-style:normal;font-size:13px;line-height:1.3;color:#E9D3C6;}
.cg-demo s,.cg-pastille span{text-decoration:none;font-size:22px;color:#FFD76A;}
.cg-pastille{align-self:flex-end;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;cursor:pointer;font:inherit;font-size:13px;font-weight:800;
  color:#FFD76A;background:rgba(246,181,75,.1);border:1.5px dashed rgba(246,181,75,.7);}
.cg-pastille span{font-size:16px;line-height:1;}
.cg-epingle{display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;border-radius:16px;cursor:pointer;text-align:left;font:inherit;color:#FFF4EA;
  background:linear-gradient(90deg,rgba(255,215,106,.22),rgba(240,65,143,.16));border:1.5px solid #FFD76A;}
.cg-epingle i{font-style:normal;font-size:24px;}
.cg-epingle span{flex:1;display:flex;flex-direction:column;gap:1px;}
.cg-epingle b{font-size:15px;}
.cg-epingle em{font-style:normal;font-size:13px;color:#FFE3BD;font-family:ui-monospace,Menlo,monospace;}
.cg-epingle s{text-decoration:none;font-size:22px;color:#FFD76A;}
.cg-epingle.fait{border-color:#7FE3C6;background:rgba(127,227,198,.1);}

.cg-gagne{position:absolute;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:radial-gradient(80% 60% at 50% 35%,#7a3412 0%,#3b1530 55%,#16080f 100%);animation:cg-fond .35s ease both;}
@keyframes cg-fond{from{opacity:0;}to{opacity:1;}}
.cg-rayons{position:absolute;left:50%;top:34%;width:180%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(255,215,106,.18) 0 10deg,transparent 10deg 22deg);animation:cg-rayons 14s linear infinite;
  -webkit-mask-image:radial-gradient(circle,#000 0 30%,transparent 62%);mask-image:radial-gradient(circle,#000 0 30%,transparent 62%);}
@keyframes cg-rayons{to{transform:translate(-50%,-50%) rotate(360deg);}}
.cg-confettis{position:absolute;inset:0;pointer-events:none;}
.cg-confettis i{position:absolute;top:-6%;width:8px;height:12px;border-radius:2px;animation:cg-tombe 3s linear infinite;}
.cg-confettis i.long{width:5px;height:18px;}
@keyframes cg-tombe{0%{transform:translateY(0) rotate(0);}100%{transform:translateY(115vh) rotate(720deg);}}
.cg-gagne-x{position:absolute;top:14px;right:14px;z-index:2;width:40px;height:40px;border-radius:50%;border:0;cursor:pointer;color:#fff;font-size:18px;background:rgba(255,255,255,.12);}
.cg-gagne-c{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:400px;max-height:100%;overflow-y:auto;padding:24px 18px 20px;text-align:center;color:#FFF4EA;}
/* RIEN NE SE TASSE : sur un petit écran, l'écran défile plutôt que d'écraser la scène sous le titre. */
.cg-gagne-c>*{flex-shrink:0;}
.cg-gagne-h{max-width:calc(100% - 88px);margin:0;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#2A1608;background:#FFD76A;}
.cg-gagne-t{margin:12px 0 0;font-size:clamp(32px,10vw,44px);line-height:1;font-weight:900;letter-spacing:-.02em;
  background:linear-gradient(180deg,#FFFBEA,#FFD76A 50%,#F0A23A);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 3px 0 rgba(0,0,0,.4));animation:cg-titre .7s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes cg-titre{from{transform:scale(.4) rotate(-6deg);opacity:0;}to{transform:none;opacity:1;}}
.cg-scene{position:relative;width:190px;height:170px;margin:8px 0 2px;}
.cg-boite{position:absolute;left:50%;bottom:6px;width:96px;height:70px;transform:translateX(-50%);animation:cg-secoue .5s ease-in-out 2;}
@keyframes cg-secoue{25%{transform:translateX(-50%) rotate(-8deg);}75%{transform:translateX(-50%) rotate(8deg);}}
.cg-corps{position:absolute;left:0;right:0;bottom:0;height:52px;border-radius:8px;background:linear-gradient(90deg,#F0418F 0 42%,#FFD76A 42% 58%,#F0418F 58%);box-shadow:0 8px 18px rgba(0,0,0,.35);}
.cg-couvercle{position:absolute;left:-6px;right:-6px;top:4px;height:20px;border-radius:6px;background:linear-gradient(90deg,#D92E7A 0 42%,#FFD76A 42% 58%,#D92E7A 58%);transition:transform .5s cubic-bezier(.2,1.4,.4,1);transform-origin:10% 100%;}
.cg-gagne.ouvert .cg-couvercle{transform:translate(-14px,-44px) rotate(-38deg);}
.cg-moi{position:absolute;left:50%;bottom:30px;width:118px;height:auto;transform:translate(-50%,40px) scale(.3);opacity:0;transition:transform .6s cubic-bezier(.2,1.5,.4,1) .15s,opacity .3s .15s;
  filter:drop-shadow(0 8px 14px rgba(0,0,0,.4));}
.cg-gagne.ouvert .cg-moi{transform:translate(-50%,0) scale(1);opacity:1;animation:cg-flotte 2.4s ease-in-out .9s infinite;}
@keyframes cg-flotte{50%{transform:translate(-50%,-8px) scale(1);}}
.cg-verre{position:absolute;right:6px;top:22px;font-size:34px;opacity:0;transform:scale(.2) rotate(-30deg);transition:transform .5s cubic-bezier(.2,1.6,.4,1) .5s,opacity .3s .5s;}
.cg-gagne.ouvert .cg-verre{opacity:1;transform:none;}
.cg-gagne-q{margin:4px 0 12px;font-size:15px;font-weight:700;color:#FFE3BD;}
.cg-ticket{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;padding:14px 16px 16px;border-radius:16px;color:#2A1608;
  background:linear-gradient(180deg,#FFF8E6,#FFE7B0);box-shadow:0 12px 30px rgba(0,0,0,.45);}
.cg-ticket::before,.cg-ticket::after{content:"";position:absolute;top:50%;width:22px;height:22px;margin-top:-11px;border-radius:50%;background:#2a1020;}
.cg-ticket::before{left:-11px;}
.cg-ticket::after{right:-11px;}
.cg-ticket-h{display:flex;justify-content:space-between;width:100%;padding-bottom:8px;border-bottom:2px dashed rgba(42,22,8,.25);}
.cg-ticket-h b{font-size:13px;letter-spacing:.12em;}
.cg-ticket-h em{font-style:normal;font-size:12.5px;font-weight:700;}
.cg-ticket-code{margin-top:4px;font-family:ui-monospace,Menlo,monospace;font-size:34px;font-weight:900;letter-spacing:.06em;}
.cg-ticket-r{font-size:14px;}
.cg-ticket-r b{font-family:ui-monospace,Menlo,monospace;font-size:16px;color:#C2185B;}
.cg-jauge{display:block;width:100%;height:6px;border-radius:999px;background:rgba(42,22,8,.15);overflow:hidden;}
.cg-jauge i{display:block;height:100%;transform-origin:0 50%;background:linear-gradient(90deg,#F0418F,#F0A23A);transition:transform 1s linear;}
.cg-tampon{margin-top:2px;padding:6px 14px;border:3px solid #1c8f6a;border-radius:10px;font-size:18px;font-weight:900;letter-spacing:.06em;color:#1c8f6a;transform:rotate(-6deg);animation:cg-tampon .4s cubic-bezier(.2,1.8,.4,1) both;}
@keyframes cg-tampon{from{transform:scale(2.2) rotate(-6deg);opacity:0;}to{transform:rotate(-6deg);opacity:1;}}
.cg-gagne-n{margin:12px 0 4px;font-size:13.5px;line-height:1.4;color:#EADBC9;}
@media (max-height:700px){
  .cg-gagne-c{padding-top:16px;}
  .cg-scene{width:170px;height:138px;}
  .cg-boite{width:82px;height:60px;}
  .cg-corps{height:44px;}
  .cg-moi{width:96px;bottom:26px;}
  .cg-verre{font-size:28px;top:14px;}
  .cg-ticket-code{font-size:30px;}
}
@media (prefers-reduced-motion: reduce){
  .cg-f-p,.cg-carte,.cg-carte-eclat,.cg-roue,.cg-roue span,.cg-carte-b,.cg-elu,.cg-rayons,.cg-confettis i,.cg-gagne,.cg-gagne-t,.cg-boite,.cg-tampon{animation:none;}
  .cg-confettis{display:none;}
  .cg-moi,.cg-couvercle,.cg-verre{transition:none;}
}
`,
      }}
    />
  );
}

/** Pour les tests et la lecture : combien de secondes dure le tirage de la démonstration. */
