"use client";

// 💬 MES MESSAGES — dans Ma Maison, ce que les commerçants m'ont écrit.
//
// Chaque message vient du fantôme d'un commerce (son visage, son nom) : Mike l'a
// préparé, le commerçant a dit oui (`lib/direct/moteur-messages.ts`). On répond
// d'un appui, une fois ; le commerçant voit la réponse dans son carnet. « Ne plus
// recevoir ses messages » : plus rien de ce commerce, ni ici ni sur WhatsApp ; on
// peut revenir dessus (« Reprendre »).
//
// Rien quand il n'y a rien : la Maison ne se remplit pas d'un cadre vide.
// Voir `lib/direct/messages-maison.ts`.
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  abonnerMessagesDemo,
  chargerMessagesDemo,
  messagesDemoAffiches,
  messagesDemoServeur,
  repondreDemo,
  stopDemo,
  type MessageMaison,
  type ReponseAuMot,
} from "@/lib/direct/messages-maison";
import { reponseDuCadeau } from "@/lib/direct/petits-mots";
import { quandEnClair } from "@/lib/direct/carnet";

/* LES VRAIS MESSAGES, LUS UNE FOIS ET PARTAGÉS : « Mes messages » et la pastille de l'onglet Ma Maison
   lisent la même liste — répondre ici éteint la pastille là. `null` : pas encore lue. */
let vraisCache: MessageMaison[] | null = null;
const abonnesVrais = new Set<() => void>();
const abonnerVrais = (f: () => void) => {
  abonnesVrais.add(f);
  return () => void abonnesVrais.delete(f);
};
const lireVrais = () => vraisCache;
const vraisServeur = (): MessageMaison[] | null => null;
/** 💌 Ce que les commerçants ont répondu à ses petits mots (vraie ville). Une liste stable entre deux lectures. */
const AUCUNE_REPONSE: ReponseAuMot[] = [];
let reponsesCache: ReponseAuMot[] = AUCUNE_REPONSE;
const lireReponses = () => reponsesCache;
const reponsesServeur = () => AUCUNE_REPONSE;
function poserVrais(l: MessageMaison[], reponses?: ReponseAuMot[]) {
  vraisCache = l;
  if (reponses) reponsesCache = reponses;
  abonnesVrais.forEach((f) => f());
}
let enCours: Promise<void> | null = null;
/** Relit ses messages (une lecture à la fois). */
export function relireMesMessages(): Promise<void> {
  enCours ??= fetch("/api/direct/messages", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { messages?: MessageMaison[]; reponses?: ReponseAuMot[] } | null) =>
      poserVrais(Array.isArray(j?.messages) ? j.messages : [], Array.isArray(j?.reponses) ? j.reponses : AUCUNE_REPONSE),
    )
    .catch(() => {
      if (vraisCache === null) poserVrais([]);
    })
    .finally(() => {
      enCours = null;
    });
  return enCours;
}

/** Ses messages : la route dans une vraie ville, ce téléphone dans la démonstration. */
function useLesMessages(reelle: boolean): MessageMaison[] {
  const demo = useSyncExternalStore(abonnerMessagesDemo, chargerMessagesDemo, messagesDemoServeur);
  const vrais = useSyncExternalStore(abonnerVrais, lireVrais, vraisServeur);
  useEffect(() => {
    if (reelle && lireVrais() === null) void relireMesMessages();
  }, [reelle]);
  return reelle ? (vrais ?? []) : messagesDemoAffiches(demo);
}

/** 🏠 LA PASTILLE DE L'ONGLET MA MAISON : les messages qui attendent sa réponse. */
export function useMessagesEnAttente(reelle: boolean): number {
  return useLesMessages(reelle).filter((m) => !m.reponse && !m.stop && m.choix.length > 0).length;
}

function useMesMessages(reelle: boolean) {
  const messages = useLesMessages(reelle);
  const [ennui, setEnnui] = useState("");
  useEffect(() => {
    // En ouvrant Ma Maison, on relit : un commerçant a pu écrire depuis.
    if (reelle) void relireMesMessages();
  }, [reelle]);

  const poster = async (corps: Record<string, unknown>) => {
    setEnnui("");
    try {
      const r = await fetch("/api/direct/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error || "Ça n’a pas marché. Réessaie dans un instant.");
      await relireMesMessages();
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
    }
  };

  const repondre = (m: MessageMaison, reponse: string) => {
    if (!reelle) return repondreDemo(m.id, reponse);
    // La réponse s'affiche tout de suite (et la pastille s'éteint) ; la route la garde.
    poserVrais((lireVrais() ?? []).map((x) => (x.id === m.id ? { ...x, reponse } : x)));
    void poster({ action: "repondre", id: m.id, reponse });
  };
  const arreter = (cle: string, stop: boolean) => {
    if (!reelle) return stopDemo(cle, stop);
    poserVrais((lireVrais() ?? []).map((x) => (x.commerce.cle === cle ? { ...x, stop } : x)));
    void poster({ action: stop ? "stop" : "reprendre", cle });
  };

  return { messages, ennui, repondre, arreter };
}

export function MesMessages({ reelle }: { reelle: boolean }) {
  const { messages, ennui, repondre, arreter } = useMesMessages(reelle);
  const reponses = useSyncExternalStore(abonnerVrais, lireReponses, reponsesServeur);
  const [tout, setTout] = useState(false);
  const [confirmer, setConfirmer] = useState("");
  const [maintenant] = useState(() => Date.now());
  const auxMots = reelle ? reponses : AUCUNE_REPONSE;
  if (!messages.length && !auxMots.length) return null;
  const aRepondre = messages.filter((m) => !m.reponse && !m.stop && m.choix.length > 0).length;
  const affiches = tout ? messages : messages.slice(0, 3);
  return (
    <section className="mx" aria-label="Mes messages">
      <h2 className="mx-titre">
        💬 Mes messages {aRepondre > 0 && <i>{aRepondre}</i>}
      </h2>
      {ennui && (
        <p className="mx-ennui" role="alert">
          {ennui}
        </p>
      )}
      {/* 💌 CE QUE LES COMMERÇANTS ONT RÉPONDU À SES PETITS MOTS : un cadeau à montrer au comptoir, ou un 💛. */}
      {auxMots.slice(0, 3).map((r) => (
        <article key={`mot-${r.id}`} className={`mx-msg mx-reponse${r.cadeau ? " cadeau" : ""}`}>
          <div className="mx-de">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.commerce.visage} alt="" />
            <span>
              <b>{r.commerce.nom}</b>
              <small>{quandEnClair(r.le, maintenant)}</small>
            </span>
          </div>
          {r.cadeau ? (
            <>
              <p className="mx-bulle">🎁 {reponseDuCadeau(r.cadeau)}</p>
              <p className="mx-repondu">Montre ce message au comptoir. Ton mot : « {r.mot} »</p>
            </>
          ) : (
            <p className="mx-bulle">
              💛 Un coup de cœur pour ton petit mot : « {r.mot} ». Il est dans sa vitrine.
            </p>
          )}
        </article>
      ))}
      {affiches.map((m) => (
        <article key={m.id} className={`mx-msg${m.stop ? " stop" : ""}`}>
          <div className="mx-de">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.commerce.visage} alt="" />
            <span>
              <b>{m.commerce.nom}</b>
              <small>{quandEnClair(m.le, maintenant)}</small>
            </span>
          </div>
          <p className="mx-bulle">{m.texte}</p>
          {m.stop ? (
            <p className="mx-pied">
              Tu ne reçois plus ses messages.{" "}
              <button type="button" className="mx-lien" onClick={() => arreter(m.commerce.cle, false)}>
                Reprendre
              </button>
            </p>
          ) : m.reponse ? (
            <p className="mx-repondu">
              Ta réponse : <b>{m.reponse}</b> · {m.commerce.nom} la verra.
            </p>
          ) : (
            m.choix.length > 0 && (
              <div className="mx-choix">
                {m.choix.map((c) => (
                  <button key={c} type="button" onClick={() => repondre(m, c)}>
                    {c}
                  </button>
                ))}
              </div>
            )
          )}
          {!m.stop &&
            (confirmer === m.id ? (
              <div className="mx-confirme">
                <p>Plus rien de {m.commerce.nom}, ni ici ni sur WhatsApp. Tu pourras revenir dessus.</p>
                <button
                  type="button"
                  className="mx-stop"
                  onClick={() => {
                    setConfirmer("");
                    arreter(m.commerce.cle, true);
                  }}
                >
                  Ne plus recevoir ses messages
                </button>
                <button type="button" className="mx-lien" onClick={() => setConfirmer("")}>
                  Annuler
                </button>
              </div>
            ) : (
              <button type="button" className="mx-lien petit" onClick={() => setConfirmer(m.id)}>
                Ne plus recevoir ses messages
              </button>
            ))}
        </article>
      ))}
      {messages.length > 3 && (
        <button type="button" className="mx-lien" onClick={() => setTout((v) => !v)}>
          {tout ? "Moins" : `Voir les ${messages.length} messages`}
        </button>
      )}
      <style>{STYLES}</style>
    </section>
  );
}

const STYLES = `
.mx{display:flex;flex-direction:column;gap:10px;margin:14px 16px 0;}
.mx-titre{display:flex;align-items:center;gap:8px;margin:0 2px;font-size:17px;font-weight:850;letter-spacing:-.01em;color:#fff;}
.mx-titre i{font-style:normal;min-width:22px;height:22px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;background:#FF2E9A;color:#fff;font-size:12.5px;}
.mx-ennui{margin:0;padding:9px 12px;border-radius:12px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);font-size:13px;}
.mx-msg{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:20px;background:#1F150F;border:1px solid rgba(255,235,215,.1);color:#FFF4E6;}
.mx-msg.stop{opacity:.55;}
.mx-reponse.cadeau{border-color:rgba(255,196,90,.55);background:linear-gradient(135deg,rgba(255,196,90,.14),#1F150F 60%);}
.mx-de{display:flex;align-items:center;gap:10px;}
.mx-de img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#2A1D15;flex:none;}
.mx-de span{display:flex;flex-direction:column;min-width:0;}
.mx-de b{font-size:14.5px;font-weight:800;}
.mx-de small{font-size:12px;color:#B3A59D;}
.mx-bulle{margin:0;padding:10px 12px;border-radius:4px 16px 16px 16px;background:#2A1D15;font-size:14.5px;line-height:1.45;}
.mx-choix{display:flex;flex-wrap:wrap;gap:8px;}
.mx-choix button{min-height:40px;padding:0 16px;border-radius:999px;border:1.5px solid #FF2E9A;background:rgba(255,46,154,.1);color:#FFC2E2;font-weight:800;font-size:14px;}
.mx-choix button:active{transform:scale(.97);}
.mx-repondu,.mx-pied{margin:0;font-size:13px;color:#C4B9B3;}
.mx-repondu b{color:#FF8CC6;}
.mx-lien{align-self:flex-start;border:0;background:none;padding:2px 0;color:#B3A59D;text-decoration:underline;font-size:13px;}
.mx-lien.petit{font-size:12px;}
.mx-confirme{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:14px;background:#2A1D15;}
.mx-confirme p{margin:0;font-size:13px;line-height:1.4;}
.mx-stop{align-self:flex-start;min-height:36px;padding:0 14px;border-radius:999px;border:0;background:#FFF4E6;color:#170F0B;font-weight:800;font-size:13px;}
`;
