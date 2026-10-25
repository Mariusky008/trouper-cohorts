"use client";

// 📒 MON CARNET — au comptoir : ceux qui ont libéré leur fantôme à la fin de ses vidéos.
//
// À la fin d'un film, l'habitant libère une cage : « J'adore la vidéo », « Je
// viendrai un jour », « Je réserve / Je passe aujourd'hui » (`cages-fantomes.tsx`).
// Ici, le commerçant voit QUI, groupés par cage — c'est décidé, puis la promesse,
// puis l'envie —, avec le fantôme et le prénom de chacun, depuis quand, s'il veut
// être prévenu sur WhatsApp. Deux gestes, pas plus :
//
//   · « Passage aujourd'hui » : la personne est venue. Un appui, et on le compte
//     (un par jour) ; un second appui l'enlève, s'il s'est trompé.
//   · « A dit stop » : elle lui a répondu stop sur WhatsApp. Définitif pour son
//     commerce, d'où la confirmation : son numéro est effacé.
//
// Sur l'accueil, une carte : « Mon carnet », et combien dans chaque cage.
//
// LA DÉMONSTRATION a un carnet de prénoms inventés (`carnetDemo`), et ses gestes
// se gardent dans ce téléphone. Un vrai commerçant lit le sien en base
// (`api/site-internet/pro/carnet`). Voir `lib/direct/carnet.ts`.
import { useCallback, useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  carnetDemo,
  ORDRE_CAGES,
  passagesEnClair,
  quandEnClair,
  REPONDU_WHATSAPP,
  resumeDuCarnet,
  sensDuGroupe,
  titreDuGroupe,
  type LigneCarnet,
} from "@/lib/direct/carnet";
import { lookDe } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import { heureOuverte } from "@/lib/direct/previens-les";
import { aPrevenir } from "./previens-les";
import { combienDeMessages } from "./messages-de-mike";

type Etat = { pret: boolean; actif: boolean; lignes: LigneCarnet[]; aujourdhui: string };

/* ═══ LES GESTES DE LA DÉMONSTRATION, GARDÉS DANS CE TÉLÉPHONE ═══════════ */
type Retenu = Pick<LigneCarnet, "passages" | "dernierPassage" | "stop" | "prevenir" | "messages">;
const cleDemo = (c: CommerceComptoir) => `clikme:carnet-demo:${c.id}`;
function lireDemo(c: CommerceComptoir): Record<string, Retenu> {
  try {
    return JSON.parse(window.localStorage.getItem(cleDemo(c)) || "{}");
  } catch {
    return {};
  }
}
function garderDemo(c: CommerceComptoir, l: LigneCarnet) {
  try {
    const r: Retenu = { passages: l.passages, dernierPassage: l.dernierPassage, stop: l.stop, prevenir: l.prevenir, messages: l.messages };
    window.localStorage.setItem(cleDemo(c), JSON.stringify({ ...lireDemo(c), [l.ref]: r }));
  } catch {
    /* Navigation privée : le geste vit le temps de la visite. */
  }
}

async function demander(reel: { slug: string; token: string }, corps: Record<string, unknown>) {
  const r = await fetch("/api/site-internet/pro/carnet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: reel.slug, token: reel.token, ...corps }),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok || !j.ok) throw new Error(String(j.error || "Ça n’a pas marché. Réessaie dans un instant."));
  return j;
}

/** Son carnet : lu une fois à l'accueil, relu à l'ouverture de l'écran ; et ses deux gestes. */
export function useCarnet(commerce: CommerceComptoir) {
  const [etat, setEtat] = useState<Etat>({ pret: false, actif: true, lignes: [], aujourdhui: "" });
  const [occupe, setOccupe] = useState("");
  const [ennui, setEnnui] = useState("");
  const reel = commerce.reel;

  const charger = useCallback(async () => {
    if (!reel) {
      const aujourdhui = jourParis();
      const retenus = lireDemo(commerce);
      setEtat({ pret: true, actif: true, aujourdhui, lignes: carnetDemo(Date.now(), aujourdhui).map((l) => ({ ...l, ...retenus[l.ref] })) });
      return;
    }
    try {
      const j = await demander(reel, { action: "lire" });
      setEtat({
        pret: true,
        actif: j.actif !== false,
        aujourdhui: String(j.aujourdhui || jourParis()),
        lignes: Array.isArray(j.lignes) ? (j.lignes as LigneCarnet[]) : [],
      });
    } catch {
      // Le carnet ne s'affiche pas plutôt que de mettre l'accueil en erreur.
      setEtat((e) => ({ ...e, pret: true }));
    }
  }, [commerce, reel]);

  useEffect(() => {
    // Le carnet vient d'ailleurs (le téléphone, ou la base) : on le lit après l'affichage.
    void charger();
  }, [charger]);

  const changer = (ref: string, f: (l: LigneCarnet) => LigneCarnet) =>
    setEtat((e) => ({ ...e, lignes: e.lignes.map((l) => (l.ref === ref ? f(l) : l)) }));

  /** « Passage aujourd'hui » (`oui`), ou l'enlever. */
  const passage = async (ref: string, oui: boolean) => {
    setEnnui("");
    const aujourdhui = etat.aujourdhui || jourParis();
    if (!reel) {
      const l = etat.lignes.find((x) => x.ref === ref);
      if (!l) return;
      const deja = l.dernierPassage === aujourdhui;
      const neuve = oui === deja ? l : { ...l, passages: Math.max(0, l.passages + (oui ? 1 : -1)), dernierPassage: oui ? aujourdhui : null };
      garderDemo(commerce, neuve);
      changer(ref, () => neuve);
      return;
    }
    setOccupe(ref);
    try {
      const j = await demander(reel, { action: "passage", ref, oui });
      changer(ref, (l) => ({ ...l, passages: Number(j.passages) || 0, dernierPassage: j.dernierPassage ? String(j.dernierPassage) : null }));
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe("");
    }
  };

  /** Elle a dit stop sur WhatsApp : on ne lui proposera plus rien. */
  const stop = async (ref: string) => {
    setEnnui("");
    if (!reel) {
      const l = etat.lignes.find((x) => x.ref === ref);
      if (!l) return;
      const neuve = { ...l, stop: true, prevenir: false };
      garderDemo(commerce, neuve);
      changer(ref, () => neuve);
      return;
    }
    setOccupe(ref);
    try {
      await demander(reel, { action: "stop", ref });
      changer(ref, (l) => ({ ...l, stop: true, prevenir: false }));
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe("");
    }
  };

  /** 📲 Les numéros de ceux qui veulent être prévenus (sa ligne → son numéro), lus quand il va leur écrire.
   *  La démonstration n'en a pas : ses prénoms sont inventés. */
  const numeros = useCallback(async (): Promise<Record<string, string>> => {
    if (!reel) return {};
    const j = await demander(reel, { action: "numeros" });
    const n: Record<string, string> = {};
    for (const x of Array.isArray(j.numeros) ? (j.numeros as { ref: string; whatsapp: string }[]) : []) n[x.ref] = x.whatsapp;
    return n;
  }, [reel]);

  /** 📲 Il a envoyé le message de Mike : on le garde (les règles du carnet de messages comptent dessus). */
  const envoye = async (ref: string, texte: string, plus: string): Promise<boolean> => {
    setEnnui("");
    const ajoute = (l: LigneCarnet) => ({ ...l, messages: [{ le: new Date().toISOString(), plus }, ...l.messages].slice(0, 5) });
    if (!reel) {
      const l = etat.lignes.find((x) => x.ref === ref);
      if (!l) return false;
      const neuve = ajoute(l);
      garderDemo(commerce, neuve);
      changer(ref, () => neuve);
      return true;
    }
    try {
      await demander(reel, { action: "envoye", ref, texte, plus });
      changer(ref, ajoute);
      return true;
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  /** 💬 Il a dit oui au message de Mike : il arrive dans la Maison de la personne. */
  const maison = async (ref: string, texte: string, modele: string, choix: string[]): Promise<boolean> => {
    setEnnui("");
    const ajoute = (l: LigneCarnet): LigneCarnet => ({
      ...l,
      messages: [{ le: new Date().toISOString(), plus: "", canal: "maison" as const, modele, choix, texte, reponse: "" }, ...l.messages].slice(0, 20),
    });
    if (!reel) {
      const l = etat.lignes.find((x) => x.ref === ref);
      if (!l) return false;
      const neuve = ajoute(l);
      garderDemo(commerce, neuve);
      changer(ref, () => neuve);
      return true;
    }
    try {
      await demander(reel, { action: "maison", ref, texte, modele, choix });
      changer(ref, ajoute);
      return true;
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  /** Elle lui a répondu sur WhatsApp : il le note (ClikMe ne lit pas son WhatsApp). */
  const repondu = async (ref: string) => {
    setEnnui("");
    const marque = (l: LigneCarnet): LigneCarnet => {
      const i = l.messages.findIndex((m) => (m.canal ?? "whatsapp") === "whatsapp" && !m.reponse);
      return i < 0 ? l : { ...l, messages: l.messages.map((m, j) => (j === i ? { ...m, reponse: REPONDU_WHATSAPP } : m)) };
    };
    if (!reel) {
      const l = etat.lignes.find((x) => x.ref === ref);
      if (!l) return;
      const neuve = marque(l);
      garderDemo(commerce, neuve);
      changer(ref, () => neuve);
      return;
    }
    setOccupe(ref);
    try {
      await demander(reel, { action: "repondu", ref });
      changer(ref, marque);
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe("");
    }
  };

  return { ...etat, occupe, ennui, recharger: charger, passage, stop, numeros, envoye, maison, repondu, demo: !reel };
}
export type CarnetDuComptoir = ReturnType<typeof useCarnet>;

/** « 2 aujourd'hui · 4 un jour · 5 j'adore » : la carte de l'accueil dit ce que disent les cages. */
function motDuCarnet(c: CarnetDuComptoir): { mot: string; chaud: boolean } {
  if (!c.pret) return { mot: "…", chaud: false };
  if (!c.actif) return { mot: "Bientôt, à la fin de tes vidéos", chaud: false };
  const r = resumeDuCarnet(c.lignes);
  const mots = [r.aujourdhui && `${r.aujourdhui} aujourd’hui`, r.unJour && `${r.unJour} un jour`, r.adore && `${r.adore} j’adore`].filter(Boolean);
  if (!mots.length) return { mot: "Personne encore : ça commence à ta prochaine vidéo", chaud: false };
  return { mot: mots.join(" · "), chaud: r.aujourdhui > 0 };
}

/** La carte de l'accueil : « Mon carnet », quelques fantômes, et combien dans chaque cage. */
export function CarteCarnet({ carnet, onOuvrir }: { carnet: CarnetDuComptoir; onOuvrir: () => void }) {
  const m = motDuCarnet(carnet);
  const tetes = carnet.lignes.filter((l) => !l.stop).slice(0, 4);
  return (
    <>
      <button type="button" className="ak-second ck-carte" onClick={onOuvrir}>
        <span className="ak-second-i ck-carte-i" aria-hidden="true">
          📒
        </span>
        <span className="ak-cta-t">
          <b>Mon carnet</b>
          <em>Ceux qui ont libéré leur fantôme à la fin de tes vidéos</em>
          <span className="ck-carte-bas">
            {tetes.length > 0 && (
              <span className="ck-tetes" aria-hidden="true">
                {tetes.map((l) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={l.ref} src={lookDe(l.look).image} alt="" />
                ))}
              </span>
            )}
            <i className={`ak-meta${m.chaud ? " chaud" : ""}`}>{m.mot}</i>
          </span>
        </span>
        <s aria-hidden="true">›</s>
      </button>
      <style>{STYLES}</style>
    </>
  );
}

/** L'écran du carnet : les trois cages, une ligne par personne. */
export function CarnetComptoir({
  commerce,
  dossier,
  carnet,
  onRetour,
  onPrevenir,
  onMessages,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  carnet: CarnetDuComptoir;
  onRetour: () => void;
  /** 📲 « Préviens-les » : l'écran de Mike, pour ceux qui attendent son signal. */
  onPrevenir?: () => void;
  /** 💬 Les messages que Mike a préparés pour leur Maison. */
  onMessages?: () => void;
}) {
  const { recharger } = carnet;
  useEffect(() => {
    void recharger();
  }, [recharger]);
  const [maintenant] = useState(() => Date.now());
  const r = resumeDuCarnet(carnet.lignes);
  return (
    <div className="ck">
      <div className="ck-haut">
        <button type="button" className="ck-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        {carnet.lignes.length > 0 && <span className="ck-compte">{r.personnes > 1 ? `${r.personnes} personnes` : "1 personne"}</span>}
      </div>

      <section className="ck-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Mon carnet</h2>
          <p>À la fin de tes vidéos, tes clients libèrent leur fantôme. Les voici, avec ce qu’ils t’ont dit.</p>
        </div>
      </section>

      {onPrevenir && heureOuverte(maintenant) && aPrevenir(carnet.lignes, maintenant).length > 0 && (
        <button type="button" className="ck-prevenir" onClick={onPrevenir}>
          📲 Mike peut prévenir ceux qui attendent ton signal <i>{aPrevenir(carnet.lignes, maintenant).length}</i>
        </button>
      )}

      {onMessages && heureOuverte(maintenant) && combienDeMessages(carnet.lignes, commerce) > 0 && (
        <button type="button" className="ck-prevenir rose" onClick={onMessages}>
          💬 Les messages que Mike a préparés <i>{combienDeMessages(carnet.lignes, commerce)}</i>
        </button>
      )}

      {carnet.demo && <p className="ck-note">Démonstration : ces prénoms sont inventés. Tes gestes restent dans ce téléphone.</p>}

      {carnet.pret && !carnet.actif && (
        <p className="ck-vide">Ton carnet s’ouvre bientôt. Dès qu’il est prêt, ceux qui libèrent leur fantôme à la fin de tes vidéos arrivent ici.</p>
      )}
      {carnet.pret && carnet.actif && carnet.lignes.length === 0 && (
        <p className="ck-vide">Personne encore. À la fin de ta prochaine vidéo, tes clients pourront libérer leur fantôme : ils arriveront ici.</p>
      )}

      {carnet.ennui && (
        <p className="ck-ennui" role="alert">
          {carnet.ennui}
        </p>
      )}

      {ORDRE_CAGES.map((cage) => {
        const lignes = carnet.lignes.filter((l) => l.cage === cage).sort((a, b) => Number(a.stop) - Number(b.stop) || b.le.localeCompare(a.le));
        if (!lignes.length) return null;
        return (
          <section key={cage} className={`ck-groupe ${cage}`}>
            <h3>
              {titreDuGroupe(cage, commerce.branche)} <i>{lignes.length}</i>
            </h3>
            <p className="ck-sens">{sensDuGroupe(cage)}</p>
            {lignes.map((l) => (
              <LigneDuCarnet
                key={l.ref}
                l={l}
                maintenant={maintenant}
                aujourdhui={carnet.aujourdhui}
                occupe={carnet.occupe === l.ref}
                onPassage={(oui) => void carnet.passage(l.ref, oui)}
                onStop={() => void carnet.stop(l.ref)}
                onRepondu={() => void carnet.repondu(l.ref)}
              />
            ))}
          </section>
        );
      })}
      <style>{STYLES}</style>
    </div>
  );
}

function LigneDuCarnet({
  l,
  maintenant,
  aujourdhui,
  occupe,
  onPassage,
  onStop,
  onRepondu,
}: {
  l: LigneCarnet;
  maintenant: number;
  aujourdhui: string;
  occupe: boolean;
  onPassage: (oui: boolean) => void;
  onStop: () => void;
  onRepondu: () => void;
}) {
  const [confirmer, setConfirmer] = useState(false);
  const venu = l.dernierPassage === aujourdhui;
  /* 💬 SA DERNIÈRE RÉPONSE dans Ma Maison ; et son dernier message WhatsApp, s'il attend qu'il note sa réponse. */
  const reponse = l.messages.find((m) => m.reponse && m.reponse !== REPONDU_WHATSAPP)?.reponse;
  const waMuet = l.messages[0] && (l.messages[0].canal ?? "whatsapp") === "whatsapp" && !l.messages[0].reponse;
  const qui = l.prenom || "Sans prénom";
  const passages = passagesEnClair(l, aujourdhui);
  return (
    <article className={`ck-ligne${l.stop ? " stop" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ck-fantome" src={lookDe(l.look).image} alt="" />
      <div className="ck-qui">
        <b>{qui}</b>
        <small>
          {quandEnClair(l.le, maintenant)}
          {l.films > 1 ? ` · ${l.films} de tes vidéos` : ""}
        </small>
        {(l.prevenir || l.stop || passages || l.messages.length > 0) && (
          <span className="ck-puces">
            {l.prevenir && <em className="wa">📲 À prévenir sur WhatsApp</em>}
            {l.messages[0] && <em className="msg">Dernier message {quandEnClair(l.messages[0].le, maintenant)}</em>}
            {reponse && <em className="rep">💬 A répondu : {reponse}</em>}
            {l.stop && <em className="non">A dit stop</em>}
            {passages && <em className="ok">{passages}</em>}
          </span>
        )}
      </div>
      <div className="ck-gestes">
        <button type="button" className={`ck-passage${venu ? " fait" : ""}`} aria-pressed={venu} disabled={occupe} onClick={() => onPassage(!venu)}>
          {venu ? "✓ Passage noté" : "Passage aujourd’hui"}
        </button>
        {waMuet && !l.stop && (
          <button type="button" className="ck-stop" disabled={occupe} onClick={onRepondu}>
            A répondu sur WhatsApp
          </button>
        )}
        {l.prevenir && !confirmer && (
          <button type="button" className="ck-stop" disabled={occupe} onClick={() => setConfirmer(true)}>
            A dit stop
          </button>
        )}
      </div>
      {confirmer && (
        <div className="ck-confirme" role="group" aria-label={`Stop pour ${qui}`}>
          <p>
            <b>{qui}</b> ne recevra plus rien de toi, et son numéro est effacé. Seule cette personne pourra redire oui, à la fin d’une de tes vidéos.
          </p>
          <div>
            <button
              type="button"
              className="ck-stop oui"
              onClick={() => {
                setConfirmer(false);
                onStop();
              }}
            >
              Confirmer le stop
            </button>
            <button type="button" className="ck-annuler" onClick={() => setConfirmer(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

const STYLES = `
.ck-carte-bas{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px;}
.ck-carte-bas .ak-meta{margin-top:0;}
.ck-tetes{display:inline-flex;}
.ck-tetes img{width:26px;height:26px;margin-right:-8px;border-radius:50%;object-fit:contain;object-position:50% 20%;background:var(--nappe2,#261B16);
  border:1.5px solid var(--nappe,#1C1411);}
.ck-tetes img:last-child{margin-right:0;}
.ck{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;
  display:flex;flex-direction:column;gap:14px;}
.ck::-webkit-scrollbar{display:none;}
.ck-haut{display:flex;align-items:center;justify-content:space-between;}
.ck-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);color:var(--creme);font-weight:700;}
.ck-compte{font-family:var(--font-clikme),sans-serif;font-size:15px;font-weight:800;color:var(--ambre);}
.ck-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid var(--trait);}
.ck-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ck-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.ck-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.ck-note{margin:-4px 2px 0;font-size:12.5px;line-height:1.4;color:#9A7A62;}
.ck-vide{margin:0;padding:16px;border-radius:16px;border:1px dashed var(--trait);text-align:center;font-size:14px;line-height:1.45;color:var(--gris);}
.ck-ennui{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);font-size:13.5px;}
.ck-groupe{display:flex;flex-direction:column;gap:8px;}
.ck-groupe h3{margin:6px 2px 0;display:flex;align-items:center;gap:8px;font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;letter-spacing:-.01em;}
.ck-groupe h3 i{font-style:normal;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;
  background:rgba(245,162,58,.16);color:var(--ambre);font-size:13px;}
.ck-groupe.aujourdhui h3 i{background:var(--rose);color:#fff;}
.ck-sens{margin:-4px 2px 2px;font-size:13px;line-height:1.4;color:var(--gris);}
.ck-ligne{display:grid;grid-template-columns:52px 1fr;gap:4px 12px;padding:12px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.ck-ligne.stop{opacity:.55;}
.ck-fantome{grid-row:span 2;width:52px;height:60px;object-fit:contain;object-position:50% 100%;}
.ck-qui{min-width:0;display:flex;flex-direction:column;gap:2px;}
.ck-qui b{font-family:var(--font-clikme),sans-serif;font-size:16px;font-weight:800;line-height:1.2;}
.ck-qui small{font-size:12.5px;color:var(--gris);}
.ck-puces{display:flex;flex-wrap:wrap;gap:4px 6px;margin-top:4px;}
.ck-puces em{font-style:normal;font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;}
.ck-puces .wa{background:rgba(37,211,102,.13);color:#9FE7B8;}
.ck-puces .non{background:rgba(205,184,164,.14);color:var(--gris);}
.ck-puces .ok{background:rgba(245,162,58,.14);color:var(--ambre);}
.ck-puces .msg{background:rgba(37,211,102,.08);color:#BFE8CD;}
.ck-puces .rep{background:rgba(255,46,154,.14);color:#FFC2E2;}
.ck-prevenir{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:8px 16px;border-radius:999px;border:0;
  background:#25D366;color:#06260F;font-weight:800;font-size:14px;text-align:center;}
.ck-prevenir.rose{background:var(--rose);color:#fff;}
.ck-prevenir.rose i{background:#fff;color:#C4146E;}
.ck-prevenir i{font-style:normal;min-width:22px;height:22px;padding:0 6px;border-radius:999px;display:inline-grid;place-items:center;background:#06260F;color:#7CF0A2;font-size:12.5px;}
.ck-gestes{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}
.ck-passage,.ck-stop,.ck-annuler{min-height:36px;padding:0 12px;border-radius:999px;font-weight:800;font-size:13px;white-space:nowrap;}
.ck-passage{border:1.5px solid var(--ambre);background:none;color:var(--ambre);}
.ck-passage.fait{border-color:transparent;background:rgba(80,190,120,.22);color:#8EE0A8;}
.ck-stop{border:1px solid var(--trait);background:none;color:var(--gris);}
.ck-stop.oui{border-color:var(--rose);background:var(--rose);color:#fff;}
.ck-annuler{border:0;background:none;color:var(--gris);text-decoration:underline;}
.ck-passage:disabled,.ck-stop:disabled{opacity:.5;}
.ck-confirme{grid-column:1 / -1;display:flex;flex-direction:column;gap:8px;margin-top:6px;padding:12px;border-radius:14px;background:var(--fond);border:1px solid var(--trait);}
.ck-confirme p{margin:0;font-size:13.5px;line-height:1.45;}
.ck-confirme div{display:flex;flex-wrap:wrap;gap:8px;}
`;
