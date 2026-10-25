"use client";

// 💬 LES MESSAGES DE MIKE — il prépare, le commerçant relit et dit oui.
//
// Le moteur (`lib/direct/moteur-messages.ts`) propose, pour chaque personne du
// carnet, UN message — merci et une question facile, ce dont elle a parlé, une
// invitation douce après trois vidéos aimées, merci pour sa visite… — ou se tait,
// et dit pourquoi. Ici, le commerçant les relit (il peut les changer), et dit oui :
// un par un, ou tous d'un coup. Ils arrivent dans la Maison de la personne, sur
// l'appli (« Mes messages »), avec une ou deux réponses à toucher ; sa réponse
// revient dans le carnet, et Mike s'en souvient pour la suite.
//
// « Pas celui-là » le met de côté pour aujourd'hui (gardé dans ce téléphone).
// Ceux à qui Mike ne dit rien sont en bas, avec la raison : il sait se taire.
import { useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { LigneCarnet } from "@/lib/direct/carnet";
import { titreDuGroupe } from "@/lib/direct/carnet";
import { lookDe } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import { prochainMessage, type Proposition } from "@/lib/direct/moteur-messages";
import { HEURES_FERMEES, heureOuverte } from "@/lib/direct/previens-les";
import type { CarnetDuComptoir } from "./carnet-comptoir";

/* « PAS CELUI-LÀ » : de côté pour aujourd'hui, dans ce téléphone. */
const cleDeCote = (c: CommerceComptoir) => `clikme:mike-de-cote:${c.id}`;
function lireDeCote(c: CommerceComptoir): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(cleDeCote(c)) || "{}") as { jour?: string; refs?: string[] };
    return v.jour === jourParis() && Array.isArray(v.refs) ? v.refs : [];
  } catch {
    return [];
  }
}
function garderDeCote(c: CommerceComptoir, refs: string[]) {
  try {
    window.localStorage.setItem(cleDeCote(c), JSON.stringify({ jour: jourParis(), refs }));
  } catch {
    /* stockage indisponible : de côté le temps de la visite */
  }
}

/* TU OU VOUS : le même choix que « Oui, préviens-les ». */
const cleTu = (c: CommerceComptoir) => `clikme:mike-tu:${c.id}`;
export function lireTu(c: CommerceComptoir): boolean {
  try {
    return window.localStorage.getItem(cleTu(c)) !== "vous";
  } catch {
    return true;
  }
}
export function garderTu(c: CommerceComptoir, tu: boolean) {
  try {
    window.localStorage.setItem(cleTu(c), tu ? "tu" : "vous");
  } catch {
    /* stockage indisponible */
  }
}

export type PropositionDeMike = Proposition & { ligne: LigneCarnet };

/** Ce que Mike propose à chacun, et à qui il ne dit rien (avec la raison). */
export function messagesDeMike(lignes: LigneCarnet[], commerce: CommerceComptoir, tu: boolean, maintenant = Date.now()) {
  const propositions: PropositionDeMike[] = [];
  const silences: { ligne: LigneCarnet; pourquoi: string }[] = [];
  for (const ligne of lignes) {
    const r = prochainMessage({ ligne, commerce: { famille: commerce.famille, prenom: commerce.prenom }, tu, maintenant });
    if ("silence" in r) silences.push({ ligne, pourquoi: r.silence });
    else propositions.push({ ...r, ligne });
  }
  return { propositions, silences };
}

/** Combien de messages Mike a préparés pour aujourd'hui (sans ceux mis de côté) — pour sa carte de l'accueil. */
export function combienDeMessages(lignes: LigneCarnet[], commerce: CommerceComptoir): number {
  const deCote = new Set(lireDeCote(commerce));
  return messagesDeMike(lignes, commerce, lireTu(commerce)).propositions.filter((p) => !deCote.has(p.ligne.ref)).length;
}

/** Ce que Mike sait d'elle, en une ligne, au-dessus de son message. */
function contexte(l: LigneCarnet, branche: string): string {
  const morceaux = [`« ${titreDuGroupe(l.cage, branche)} »`];
  const rep = l.messages.find((m) => m.reponse && m.canal === "maison")?.reponse;
  if (rep) morceaux.push(`a répondu « ${rep} »`);
  if (l.passages) morceaux.push(`${l.passages} ${l.passages > 1 ? "passages" : "passage"}`);
  return morceaux.join(" · ");
}

export function MessagesDeMike({
  commerce,
  dossier,
  carnet,
  onRetour,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  carnet: CarnetDuComptoir;
  onRetour: () => void;
}) {
  const [tu, setTu] = useState(() => lireTu(commerce));
  const [deCote, setDeCote] = useState<string[]>(() => lireDeCote(commerce));
  const [textes, setTextes] = useState<Record<string, string>>({});
  const [envoyes, setEnvoyes] = useState<Record<string, boolean>>({});
  const [voirSilences, setVoirSilences] = useState(false);
  const [maintenant] = useState(() => Date.now());
  const ouvert = heureOuverte();

  // Celles qu'on vient d'envoyer restent à l'écran (avec ✓), même si le moteur se tait maintenant pour elles.
  const [figees, setFigees] = useState<Record<string, PropositionDeMike>>({});
  const { propositions, silences } = messagesDeMike(carnet.lignes, commerce, tu, maintenant);
  const liste = [...Object.values(figees), ...propositions.filter((p) => !figees[p.ligne.ref] && !deCote.includes(p.ligne.ref))];
  const muettes = silences.filter((s) => !figees[s.ligne.ref]);
  const restants = liste.filter((p) => !envoyes[p.ligne.ref]);

  const choisirTu = (oui: boolean) => {
    setTu(oui);
    garderTu(commerce, oui);
    setTextes({});
  };
  const mettreDeCote = (ref: string) => {
    const refs = [...deCote, ref];
    setDeCote(refs);
    garderDeCote(commerce, refs);
  };
  const envoyer = async (p: PropositionDeMike) => {
    const texte = (textes[p.ligne.ref] ?? p.texte).trim();
    if (!texte) return false;
    setFigees((f) => ({ ...f, [p.ligne.ref]: p }));
    const ok = await carnet.maison(p.ligne.ref, texte, p.modele, p.choix);
    if (ok) setEnvoyes((e) => ({ ...e, [p.ligne.ref]: true }));
    else
      setFigees((f) => {
        const reste = { ...f };
        delete reste[p.ligne.ref];
        return reste;
      });
    return ok;
  };
  const toutEnvoyer = async () => {
    for (const p of restants) if (!(await envoyer(p))) break;
  };

  return (
    <div className="mm">
      <div className="mm-haut">
        <button type="button" className="mm-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
      </div>

      <section className="mm-mike">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Mike · ton assistant</h2>
          <p>
            J’ai préparé un message pour chacun. Relis, change ce que tu veux, et dis oui : ils arrivent dans leur Maison, sur l’appli. Ils te
            répondent d’un appui, tu vois leur réponse dans ton carnet.
          </p>
        </div>
      </section>

      {!ouvert && <p className="mm-ennui">{HEURES_FERMEES} Reviens les envoyer demain matin.</p>}
      {carnet.ennui && (
        <p className="mm-ennui" role="alert">
          {carnet.ennui}
        </p>
      )}

      <div className="mm-reglage">
        <span>Tu ou vous&nbsp;?</span>
        <button type="button" className={tu ? "on" : ""} aria-pressed={tu} onClick={() => choisirTu(true)}>
          Tu
        </button>
        <button type="button" className={!tu ? "on" : ""} aria-pressed={!tu} onClick={() => choisirTu(false)}>
          Vous
        </button>
      </div>

      {restants.length > 1 && ouvert && (
        <button type="button" className="mm-tous" onClick={() => void toutEnvoyer()}>
          Oui, envoie les {restants.length}
        </button>
      )}
      {liste.length === 0 && <p className="mm-vide">Rien à envoyer aujourd’hui. Mike te fera signe quand il aura quelque chose à dire.</p>}

      {liste.map((p) => {
        const l = p.ligne;
        const fait = Boolean(envoyes[l.ref]);
        const texte = textes[l.ref] ?? p.texte;
        return (
          <article key={l.ref} className={`mm-msg${fait ? " fait" : ""}`}>
            <div className="mm-qui">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lookDe(l.look).image} alt="" />
              <span>
                <b>{l.prenom || "Sans prénom"}</b>
                <small>{contexte(l, commerce.branche)}</small>
              </span>
            </div>
            <textarea
              className="mm-texte"
              value={texte}
              rows={Math.max(3, Math.ceil(texte.length / 36))}
              disabled={fait}
              onChange={(e) => setTextes((t) => ({ ...t, [l.ref]: e.target.value }))}
              aria-label={`Le message pour ${l.prenom || "cette personne"}`}
            />
            <div className="mm-choix" aria-label="Ses réponses à toucher">
              {p.choix.map((c) => (
                <i key={c}>{c}</i>
              ))}
            </div>
            {fait ? (
              <p className="mm-ok" role="status">
                ✓ Envoyé dans sa Maison.{carnet.demo ? " (Démonstration : il reste dans ce téléphone.)" : ""}
              </p>
            ) : (
              <div className="mm-boutons">
                <button type="button" className="mm-oui" disabled={!ouvert || !texte.trim()} onClick={() => void envoyer(p)}>
                  Oui, envoie
                </button>
                <button type="button" className="mm-non" onClick={() => mettreDeCote(l.ref)}>
                  Pas celui-là
                </button>
              </div>
            )}
          </article>
        );
      })}

      {muettes.length > 0 && (
        <section className="mm-silences">
          <button type="button" className="mm-silences-t" aria-expanded={voirSilences} onClick={() => setVoirSilences((v) => !v)}>
            {voirSilences ? "▾" : "▸"} Mike se tait pour {muettes.length} {muettes.length > 1 ? "personnes" : "personne"}
          </button>
          {voirSilences &&
            muettes.map((s) => (
              <p key={s.ligne.ref} className="mm-silence">
                <b>{s.ligne.prenom || "Sans prénom"}</b> · {s.pourquoi}
              </p>
            ))}
        </section>
      )}
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
.mm{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;
  display:flex;flex-direction:column;gap:14px;}
.mm::-webkit-scrollbar{display:none;}
.mm-haut{display:flex;align-items:center;}
.mm-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);color:var(--creme);font-weight:700;}
.mm-mike{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid rgba(255,46,154,.3);}
.mm-mike img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.mm-mike h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:18px;font-weight:800;}
.mm-mike p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.mm-ennui{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);font-size:13.5px;line-height:1.4;}
.mm-reglage{display:flex;align-items:center;gap:6px;}
.mm-reglage span{margin-right:4px;font-weight:800;font-size:14px;}
.mm-reglage button{min-height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-weight:700;font-size:13px;}
.mm-reglage button.on{border-color:var(--rose);background:var(--rose);color:#fff;}
.mm-tous{min-height:50px;border:0;border-radius:999px;background:var(--rose);color:#fff;font-weight:800;font-size:15.5px;box-shadow:0 12px 26px -14px rgba(255,46,154,.8);}
.mm-vide{margin:0;padding:16px;border-radius:16px;border:1px dashed var(--trait);text-align:center;font-size:14px;line-height:1.45;color:var(--gris);}
.mm-msg{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.mm-msg.fait{border-color:rgba(80,190,120,.5);}
.mm-qui{display:flex;align-items:center;gap:10px;}
.mm-qui img{width:34px;height:40px;object-fit:contain;object-position:50% 100%;flex:none;}
.mm-qui span{display:flex;flex-direction:column;min-width:0;}
.mm-qui b{font-family:var(--font-clikme),sans-serif;font-size:16px;font-weight:800;}
.mm-qui small{font-size:12.5px;color:var(--gris);}
.mm-texte{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);
  font:inherit;font-size:14.5px;line-height:1.45;resize:vertical;}
.mm-texte:disabled{opacity:.75;}
.mm-choix{display:flex;flex-wrap:wrap;gap:6px;}
.mm-choix i{font-style:normal;padding:5px 12px;border-radius:999px;border:1px dashed rgba(255,46,154,.5);color:#FFC2E2;font-size:12.5px;font-weight:700;}
.mm-boutons{display:flex;flex-wrap:wrap;gap:8px;}
.mm-oui{min-height:42px;padding:0 18px;border:0;border-radius:999px;background:var(--rose);color:#fff;font-weight:800;font-size:14.5px;}
.mm-oui:disabled{opacity:.45;}
.mm-non{min-height:42px;padding:0 12px;border:0;background:none;color:var(--gris);font-weight:700;font-size:13.5px;}
.mm-ok{margin:0;padding:9px 12px;border-radius:12px;background:rgba(80,190,120,.14);color:#8EE0A8;font-size:13px;font-weight:700;text-align:center;}
.mm-silences{display:flex;flex-direction:column;gap:6px;}
.mm-silences-t{align-self:flex-start;border:0;background:none;padding:6px 0;color:var(--gris);font-weight:800;font-size:13.5px;}
.mm-silence{margin:0;font-size:13px;line-height:1.4;color:var(--gris);}
.mm-silence b{color:var(--creme);}
`;
