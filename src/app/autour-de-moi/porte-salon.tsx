"use client";

// 🚪 L'ACCÈS À UN SALON DE LA VRAIE VILLE — ce que l'écran montre selon ce
// que le serveur dit de moi (`salon.acces`, voir `salons-acces.ts`).
//
//   · LA PORTE — un salon privé dont je ne suis pas membre : son titre, qui
//     m'invite, et une seule chose à faire (accepter, demander à entrer…).
//     Ni messages, ni photos, ni participants : le serveur ne les a pas
//     envoyés.
//   · LA LECTURE — un salon public que je lis sans l'avoir rejoint : « Tu
//     consultes ce salon public » et « Rejoindre et participer », à la place
//     de la barre de saisie.
//   · LA BARRE D'ACCÈS — membre : le statut (🔒 Privé / 🌍 Salon public), le
//     nombre de membres, les demandes d'entrée à décider, et les options
//     (inviter, sourdine, signaler, quitter).
//   · LE MENU D'UN MESSAGE — signaler, bloquer ; masquer et exclure pour le
//     créateur et les modérateurs.
//
// Cette étape pose les règles ; la mise en scène d'Ensemble viendra ensuite,
// sur les mêmes données.
import { useState } from "react";
import type { MessageSalon, Salon } from "@/lib/direct/salons";
import {
  bloquerAuteur,
  candidatsAInviter,
  deciderDemande,
  demanderAEntrer,
  exclureAuteur,
  inviterPersonne,
  masquerMessage,
  quitterSalon,
  rejoindreSalon,
  repondreInvitation,
  signalerMessage,
  signalerSalon,
  sourdineSalon,
} from "@/lib/direct/conversations-sync";

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ps-porte{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:28px 22px;
  background:#160F0C;color:#FFF4E6;text-align:center;border-radius:inherit;font-family:var(--font-clikme),system-ui,sans-serif;}
.ps-porte .ps-ic{font-size:34px;}
.ps-porte h2{margin:0;font-size:21px;line-height:1.25;font-weight:800;overflow-wrap:anywhere;}
.ps-porte p{margin:0;max-width:330px;font-size:14.5px;line-height:1.45;color:#D9C7B4;}
.ps-statut{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;background:rgba(255,244,230,.08);border:1px solid rgba(255,214,170,.22);
  font-size:12.5px;font-weight:700;color:#F5D9B8;}
.ps-bouton{display:block;width:100%;max-width:320px;height:50px;border:0;border-radius:999px;background:linear-gradient(180deg,#F8B451,#E8932A);color:#2A1608;
  font:inherit;font-size:16px;font-weight:800;cursor:pointer;}
.ps-bouton:disabled{opacity:.5;cursor:default;}
.ps-second{display:block;width:100%;max-width:320px;height:46px;border:1px solid rgba(255,244,230,.3);border-radius:999px;background:none;color:#FFF4E6;
  font:inherit;font-size:15px;font-weight:700;cursor:pointer;}
.ps-mot{margin:0;font-size:13px;color:#FFB3A8;}
.ps-lecture{display:grid;gap:8px;padding:12px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,214,170,.18);background:#1C1410;color:#FFF4E6;}
.ps-lecture p{margin:0;font-size:13.5px;line-height:1.4;color:#D9C7B4;}
.ps-lecture b{color:#FFF4E6;}
.ps-lecture .ps-bouton{max-width:none;}
.ps-barre{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0 8px;}
.ps-barre .ps-statut{font-size:12px;}
.ps-barre button.ps-opt{margin-left:auto;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,214,170,.3);background:none;color:#FFF4E6;
  font:inherit;font-size:13px;font-weight:700;cursor:pointer;}
.ps-demandes{display:grid;gap:8px;margin:0 0 10px;padding:10px 12px;border-radius:14px;background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.35);color:#FFF4E6;}
.ps-demandes p{margin:0;font-size:13.5px;}
.ps-demande{display:flex;align-items:center;gap:8px;}
.ps-demande span{flex:1;min-width:0;font-weight:700;overflow-wrap:anywhere;}
.ps-demande button{height:32px;padding:0 12px;border-radius:999px;border:0;font:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.ps-demande .oui{background:#F5A23A;color:#2A1608;}
.ps-demande .non{background:rgba(255,244,230,.12);color:#FFF4E6;}
.ps-fond{position:fixed;inset:0;z-index:95;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.6);}
.ps-feuille{width:100%;max-width:520px;max-height:85dvh;overflow-y:auto;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;
  background:#1C1410;color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.ps-feuille h3{margin:4px 0 10px;font-size:17px;font-weight:800;}
.ps-feuille .ps-ligne{display:grid;gap:2px;width:100%;padding:12px 4px;border:0;border-bottom:1px solid rgba(255,214,170,.12);background:none;color:#FFF4E6;
  font:inherit;text-align:left;cursor:pointer;}
.ps-feuille .ps-ligne b{font-size:15px;}
.ps-feuille .ps-ligne small{font-size:12.5px;color:#BFA996;}
.ps-feuille .ps-ligne.rouge b{color:#FF9C8C;}
.ps-msg{position:relative;align-self:flex-start;margin:-2px 0 0 6px;padding:0 6px;border:0;background:none;color:#9C8775;font:inherit;font-size:16px;line-height:1;cursor:pointer;}
`,
      }}
    />
  );
}

const statut = (s: Salon) =>
  s.acces?.prive ? `🔒 Privé · ${s.acces.nb} membre${s.acces.nb > 1 ? "s" : ""}` : `🌍 Salon public · ${s.acces?.nb ?? 0} participant${(s.acces?.nb ?? 0) > 1 ? "s" : ""}`;

/** Les statuts qui ferment la porte d'un salon privé. */
export const porteFermee = (s: Salon) => Boolean(s.acces && s.acces.prive && s.acces.statut !== "membre");

/**
 * LA PORTE D'UN SALON PRIVÉ — par-dessus la feuille du salon, qui est vide :
 * le serveur n'en a rien envoyé.
 */
export function PorteDuSalon({ salon, onRetour }: { salon: Salon; onRetour: () => void }) {
  const [attente, setAttente] = useState(false);
  const [mot, setMot] = useState("");
  const a = salon.acces!;
  const faire = async (f: () => Promise<string | null>) => {
    setAttente(true);
    setMot("");
    const r = await f();
    setAttente(false);
    if (r) setMot(r);
  };
  return (
    <div className="ps-porte" role="dialog" aria-label={`Salon privé : ${salon.sujet}`}>
      <Styles />
      <span className="ps-ic" aria-hidden="true">
        🔒
      </span>
      <span className="ps-statut">Salon privé · sur invitation</span>
      <h2>{salon.sujet}</h2>
      {a.statut === "invite" && (
        <>
          <p>
            <b>{a.invitePar || salon.parQui}</b> t’invite dans ce salon privé. En acceptant, tu verras ses messages et ses photos, et ses {a.nb} membre
            {a.nb > 1 ? "s" : ""} te verront.
          </p>
          <button type="button" className="ps-bouton" disabled={attente} onClick={() => void faire(() => repondreInvitation(salon, true))}>
            Accepter l’invitation
          </button>
          <button type="button" className="ps-second" disabled={attente} onClick={() => void faire(() => repondreInvitation(salon, false))}>
            Refuser
          </button>
        </>
      )}
      {a.statut === "a_demander" && (
        <>
          <p>
            Ce salon est réservé à ses membres. Tu peux demander à y entrer : <b>{a.invitePar || salon.parQui}</b> ou un modérateur acceptera — ou non.
            Tant qu’ils n’ont pas répondu, tu ne vois ni les messages ni les photos.
          </p>
          <button type="button" className="ps-bouton" disabled={attente} onClick={() => void faire(() => demanderAEntrer(salon))}>
            Demander à entrer
          </button>
        </>
      )}
      {a.statut === "demande" && <p>Ta demande est envoyée. Tu verras la conversation dès qu’elle sera acceptée.</p>}
      {a.statut === "refusee" && <p>Ta demande pour entrer dans ce salon n’a pas été acceptée.</p>}
      {a.statut === "exclu" && <p>Tu ne fais plus partie de ce salon.</p>}
      {mot && <p className="ps-mot">{mot}</p>}
      <button type="button" className="ps-second" onClick={onRetour}>
        ← Retour
      </button>
    </div>
  );
}

/**
 * UN SALON PUBLIC LU SANS L'AVOIR REJOINT — à la place de la barre de saisie.
 * Le lire n'ajoute personne aux participants ; le rejoindre est un geste.
 */
export function LectureDuSalon({ salon }: { salon: Salon }) {
  const [attente, setAttente] = useState(false);
  const [mot, setMot] = useState("");
  const invite = salon.acces?.statut === "invite";
  return (
    <div className="ps-lecture">
      <Styles />
      <p>
        <b>🌍 Tu consultes ce salon public.</b> Les messages publiés ici sont visibles par tous ceux qui le consultent.
      </p>
      <button
        type="button"
        className="ps-bouton"
        disabled={attente}
        onClick={async () => {
          setAttente(true);
          const r = invite ? await repondreInvitation(salon, true) : await rejoindreSalon(salon.cle);
          setAttente(false);
          setMot(r ?? "");
        }}
      >
        Rejoindre et participer
      </button>
      {mot && <p className="ps-mot">{mot}</p>}
    </div>
  );
}

/**
 * MEMBRE : LE STATUT, LES DEMANDES À DÉCIDER, LES OPTIONS. `onInviterLien` :
 * le partage d'invitation qui existe déjà (WhatsApp ou lien copié).
 */
export function BarreDAcces({ salon, onInviterLien, onQuitte }: { salon: Salon; onInviterLien: () => void; onQuitte: () => void }) {
  const a = salon.acces!;
  const [options, setOptions] = useState<"" | "menu" | "inviter">("");
  const [personnes, setPersonnes] = useState<{ ref: string; qui: string }[] | null>(null);
  const [mot, setMot] = useState("");
  const moderateur = a.role === "createur" || a.role === "moderateur";
  const dire = (r: string | null, ok: string) => setMot(r ?? ok);
  return (
    <>
      <Styles />
      <div className="ps-barre">
        <span className="ps-statut">{statut(salon)}</span>
        {a.sourdine && <span className="ps-statut">🔕 En sourdine</span>}
        <button type="button" className="ps-opt" onClick={() => (setMot(""), setOptions("menu"))}>
          Participants et options
        </button>
      </div>
      {moderateur && (a.demandes?.length ?? 0) > 0 && (
        <div className="ps-demandes">
          <p>Ils demandent à entrer — tu décides :</p>
          {a.demandes!.map((d) => (
            <div className="ps-demande" key={d.auteur}>
              <span>{d.qui}</span>
              <button type="button" className="oui" onClick={() => void deciderDemande(salon.cle, d.auteur, true)}>
                Accepter
              </button>
              <button type="button" className="non" onClick={() => void deciderDemande(salon.cle, d.auteur, false)}>
                Refuser
              </button>
            </div>
          ))}
        </div>
      )}
      {options && (
        <div className="ps-fond" role="dialog" aria-label="Participants et options" onClick={() => setOptions("")}>
          <div className="ps-feuille" onClick={(e) => e.stopPropagation()}>
            {options === "menu" ? (
              <>
                <h3>{statut(salon)}</h3>
                {(a.participants ?? []).map((x) => (
                  <div className="ps-ligne" key={x.auteur}>
                    <b>
                      {x.moi ? "Toi" : x.qui}
                      {x.role === "createur" ? " · créateur" : x.role === "moderateur" ? " · modérateur" : ""}
                    </b>
                  </div>
                ))}
                <button
                  type="button"
                  className="ps-ligne"
                  onClick={async () => {
                    setOptions("inviter");
                    setPersonnes(null);
                    setPersonnes(await candidatsAInviter(salon.cle));
                  }}
                >
                  <b>👥 Inviter une personne de mes discussions</b>
                  <small>Les personnes de tes salons privés. Elle devra accepter dans Ensemble.</small>
                </button>
                <button type="button" className="ps-ligne" onClick={() => (setOptions(""), onInviterLien())}>
                  <b>📲 Partager une invitation</b>
                  <small>
                    WhatsApp ou lien.{" "}
                    {a.prive ? "Celui qui l’ouvre demande à entrer : le créateur ou un modérateur accepte." : "Celui qui l’ouvre lit le salon et le rejoint s’il veut."}
                  </small>
                </button>
                <button type="button" className="ps-ligne" onClick={async () => dire(await sourdineSalon(salon.cle, !a.sourdine), a.sourdine ? "Sourdine retirée." : "Salon en sourdine.")}>
                  <b>{a.sourdine ? "🔔 Retirer la sourdine" : "🔕 Mettre ce salon en sourdine"}</b>
                  <small>Ses nouveaux messages ne seront plus comptés dans le badge.</small>
                </button>
                <button type="button" className="ps-ligne" onClick={async () => dire(await signalerSalon(salon.cle), "Merci. Le salon est signalé à ClikMe.")}>
                  <b>🛡️ Signaler ce salon</b>
                </button>
                <button
                  type="button"
                  className="ps-ligne rouge"
                  onClick={async () => {
                    if (!window.confirm("Quitter ce salon ? Tu n’en verras plus les messages.")) return;
                    const r = await quitterSalon(salon.cle);
                    if (r) setMot(r);
                    else {
                      setOptions("");
                      onQuitte();
                    }
                  }}
                >
                  <b>Quitter ce salon</b>
                </button>
                {mot && <p className="ps-mot">{mot}</p>}
              </>
            ) : (
              <>
                <h3>Inviter une personne de mes discussions</h3>
                {personnes === null ? (
                  <p>Un instant…</p>
                ) : personnes.length === 0 ? (
                  <p>Personne à inviter pour l’instant : seules les personnes de tes salons privés apparaissent ici.</p>
                ) : (
                  personnes.map((x) => (
                    <button key={x.ref} type="button" className="ps-ligne" onClick={async () => dire(await inviterPersonne(salon.cle, x.ref), `Invitation envoyée à ${x.qui}.`)}>
                      <b>{x.qui}</b>
                      <small>Reçoit une invitation à accepter dans Ensemble.</small>
                    </button>
                  ))
                )}
                {mot && <p className="ps-mot">{mot}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Le menu d'un message d'une autre personne. */
export function MenuDuMessage({ salon, m }: { salon: Salon; m: MessageSalon }) {
  const [ouvert, setOuvert] = useState(false);
  const [mot, setMot] = useState("");
  if (!m.auteur || !salon.acces) return null;
  const moderateur = salon.acces.role === "createur" || salon.acces.role === "moderateur";
  const dire = (r: string | null, ok: string) => setMot(r ?? ok);
  return (
    <>
      <button type="button" className="ps-msg" aria-label={`Options du message de ${m.qui}`} onClick={() => (setMot(""), setOuvert(true))}>
        ⋯
      </button>
      {ouvert && (
        <div className="ps-fond" role="dialog" aria-label="Options du message" onClick={() => setOuvert(false)}>
          <Styles />
          <div className="ps-feuille" onClick={(e) => e.stopPropagation()}>
            <h3>Message de {m.qui}</h3>
            <button type="button" className="ps-ligne" onClick={async () => dire(await signalerMessage(salon.cle, m.id), "Merci. Le message est signalé à ClikMe.")}>
              <b>🛡️ Signaler ce message</b>
            </button>
            <button
              type="button"
              className="ps-ligne"
              onClick={async () => dire(await bloquerAuteur(salon.cle, m.auteur!), `${m.qui} est bloqué·e : tu ne verras plus ses messages, et ses invitations n’arriveront plus.`)}
            >
              <b>🚫 Bloquer {m.qui}</b>
              <small>Ses messages disparaissent pour toi ; ses invitations ne t’arrivent plus.</small>
            </button>
            {moderateur && (
              <>
                <button type="button" className="ps-ligne" onClick={async () => dire(await masquerMessage(salon.cle, m.id), "Message masqué pour tout le salon.")}>
                  <b>Masquer ce message</b>
                  <small>Pour tout le salon.</small>
                </button>
                <button
                  type="button"
                  className="ps-ligne rouge"
                  onClick={async () => {
                    if (window.confirm(`Exclure ${m.qui} de ce salon ? Cette personne ne pourra plus y revenir.`))
                      dire(await exclureAuteur(salon.cle, m.auteur!), `${m.qui} est exclu·e du salon.`);
                  }}
                >
                  <b>Exclure {m.qui} du salon</b>
                </button>
              </>
            )}
            {mot && <p className="ps-mot">{mot}</p>}
          </div>
        </div>
      )}
    </>
  );
}
