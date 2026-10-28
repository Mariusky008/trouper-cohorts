"use client";

// 💌 VOS PETITS MOTS — au comptoir : ce que ses clients lui écrivent sous sa vitrine.
//
// Il les lit tous ; un mot ÉCRIT ne se voit dans sa vitrine qu'après son 💛, un mot
// CHOISI dans la liste s'y voit tout de suite. Deux gestes :
//   · 💛 « Coup de cœur » : le mot passe dans sa vitrine, sous l'ardoise, et son auteur
//     porte un 💛 (il peut le retirer) ;
//   · 🎁 « Offrir… » : un petit quelque chose (jamais d'alcool, loi Évin) — l'habitant
//     le trouve dans Ma Maison, à montrer au comptoir. C'est une surprise, à son idée.
// En haut, ce qu'il a offert ce mois-ci — et, s'il l'a fixé dans « Ma famille », ce qu'il peut encore
// offrir (« Je te gâte » : sa limite du mois, proposée en premier). Sur l'accueil, une carte quand il
// y a des mots, « 2 nouveaux » tant qu'il ne les a pas lus. Voir `lib/direct/petits-mots.ts`.
import { useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { lookDe } from "@/lib/direct/look";
import { quandEnClair } from "@/lib/direct/carnet";
import { motsDemo, offertCeMois, type PetitMot } from "@/lib/direct/petits-mots";
import { plusDe, plusPermis, plusPropre } from "@/lib/direct/previens-les";
import { resteDuGate, type Gate } from "@/lib/direct/famille";

/* LES GESTES DE LA DÉMONSTRATION, dans ce téléphone. */
const cleDemo = (c: CommerceComptoir) => `clikme:mots-demo:${c.id}`;
type Retenu = Pick<PetitMot, "coeur" | "cadeau">;
function lireDemo(c: CommerceComptoir): Record<string, Retenu> {
  try {
    return JSON.parse(window.localStorage.getItem(cleDemo(c)) || "{}");
  } catch {
    return {};
  }
}
function garderDemo(c: CommerceComptoir, m: PetitMot) {
  try {
    window.localStorage.setItem(cleDemo(c), JSON.stringify({ ...lireDemo(c), [m.id]: { coeur: m.coeur, cadeau: m.cadeau } }));
  } catch {
    /* stockage indisponible */
  }
}
/* « NOUVEAUX » : ceux arrivés depuis qu'il a ouvert ses petits mots. */
const cleVus = (c: CommerceComptoir) => `clikme:mots-vus:${c.id}`;
const lireVus = (c: CommerceComptoir) => {
  try {
    return Number(window.localStorage.getItem(cleVus(c)) || 0);
  } catch {
    return 0;
  }
};

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

/** Ses petits mots : le carnet inventé (et ses gestes gardés) dans la démonstration, la base sinon. */
async function lireMots(commerce: CommerceComptoir): Promise<PetitMot[]> {
  if (!commerce.reel) {
    const retenus = lireDemo(commerce);
    return motsDemo(commerce.famille, Date.now()).map((m) => ({ ...m, ...retenus[m.id] }));
  }
  try {
    const j = await demander(commerce.reel, { action: "mots" });
    return Array.isArray(j.mots) ? (j.mots as PetitMot[]) : [];
  } catch {
    return [];
  }
}

/** Ses petits mots, et ses deux gestes. */
export function usePetitsMots(commerce: CommerceComptoir) {
  const [mots, setMots] = useState<PetitMot[] | null>(null);
  const [ennui, setEnnui] = useState("");
  const [vus, setVus] = useState(() => lireVus(commerce));
  const reel = commerce.reel;

  useEffect(() => {
    let fini = false;
    void lireMots(commerce).then((l) => {
      if (!fini) setMots(l);
    });
    return () => {
      fini = true;
    };
  }, [commerce]);

  const changer = (id: string, f: (m: PetitMot) => PetitMot) => setMots((l) => l?.map((m) => (m.id === id ? f(m) : m)) ?? l);
  const geste = async (m: PetitMot, neuf: PetitMot, corps: Record<string, unknown>) => {
    setEnnui("");
    if (!reel) {
      garderDemo(commerce, neuf);
      changer(m.id, () => neuf);
      return true;
    }
    try {
      await demander(reel, corps);
      changer(m.id, () => neuf);
      return true;
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
      return false;
    }
  };
  const coeur = (m: PetitMot, oui: boolean) => geste(m, { ...m, coeur: oui }, { action: "coeur", id: m.id, oui });
  const offrir = (m: PetitMot, cadeau: string) => geste(m, { ...m, coeur: true, cadeau }, { action: "offrir", id: m.id, cadeau });
  const marquerLus = () => {
    const t = Date.now();
    try {
      window.localStorage.setItem(cleVus(commerce), String(t));
    } catch {
      /* stockage indisponible */
    }
    setVus(t);
  };
  const nouveaux = (mots ?? []).filter((m) => Date.parse(m.le) > vus).length;
  return { mots, ennui, coeur, offrir, nouveaux, marquerLus, demo: !reel };
}
export type PetitsMotsDuComptoir = ReturnType<typeof usePetitsMots>;

/** La carte de l'accueil : seulement s'il a des mots. */
export function CartePetitsMots({ petitsMots, onOuvrir }: { petitsMots: PetitsMotsDuComptoir; onOuvrir: () => void }) {
  const { mots, nouveaux } = petitsMots;
  if (!mots?.length) return null;
  return (
    <button type="button" className="ak-second pm-carte" onClick={onOuvrir}>
      <span className="ak-second-i" aria-hidden="true">
        💌
      </span>
      <span className="ak-cta-t">
        <b>Vos petits mots</b>
        <em>Ce que tes clients t’écrivent sous ta vitrine</em>
        <i className={`ak-meta${nouveaux ? " chaud" : ""}`}>
          {nouveaux ? `${nouveaux} ${nouveaux > 1 ? "nouveaux" : "nouveau"}` : `${mots.length} ${mots.length > 1 ? "mots" : "mot"}`}
        </i>
      </span>
      <s aria-hidden="true">›</s>
    </button>
  );
}

/** L'écran : ses mots, ses 💛, ce qu'il offre. */
export function PetitsMotsComptoir({
  commerce,
  dossier,
  petitsMots,
  onRetour,
  gate,
  onOffert,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  petitsMots: PetitsMotsDuComptoir;
  onRetour: () => void;
  /** 🎁 Ce qu'il peut offrir ce mois-ci (« Je te gâte », dans « Ma famille »). */
  gate?: Gate | null;
  /** Un cadeau vient de partir : « Ma famille » recompte ce qu'il reste. */
  onOffert?: () => void;
}) {
  const { mots, marquerLus } = petitsMots;
  useEffect(() => {
    marquerLus();
    // Ouvrir l'écran, c'est les avoir lus : une fois, à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [maintenant] = useState(() => Date.now());
  const offert = offertCeMois(mots ?? [], maintenant);
  return (
    <div className="pm">
      <div className="pm-haut">
        <button type="button" className="pm-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
      </div>
      <section className="pm-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Vos petits mots</h2>
          <p>
            Tes clients t’écrivent sous ta vitrine. 💛 Un coup de cœur : le mot passe dans ta vitrine. 🎁 Tu peux offrir un petit quelque chose, si tu
            veux : c’est une surprise, jamais une promesse.
          </p>
        </div>
      </section>
      {petitsMots.demo && <p className="pm-note">Démonstration : ces mots sont inventés. Tes gestes restent dans ce téléphone.</p>}
      {offert.n > 0 && (
        <p className="pm-offert">
          🎁 Ce mois-ci, tu as offert : <b>{offert.detail}</b>
        </p>
      )}
      {gate && (
        <p className="pm-offert">
          {resteDuGate(gate) > 0 ? (
            <>
              🎁 Je te gâte : tu peux encore offrir <b>{resteDuGate(gate)} × {gate.quoi}</b> ce mois-ci.
            </>
          ) : (
            <>
              🎁 Tu as offert tes <b>{gate.combien} × {gate.quoi}</b> de ce mois-ci. Tu peux en ajouter dans « Ma famille ».
            </>
          )}
        </p>
      )}
      {petitsMots.ennui && (
        <p className="pm-ennui" role="alert">
          {petitsMots.ennui}
        </p>
      )}
      {mots && mots.length === 0 && <p className="pm-vide">Pas encore de petit mot. Ils arrivent sous ta vitrine, à la fin de tes vidéos.</p>}
      {(mots ?? []).map((m) => (
        <MotDuComptoir key={m.id} m={m} commerce={commerce} maintenant={maintenant} petitsMots={petitsMots} gate={gate ?? null} onOffert={onOffert} />
      ))}
      <style>{STYLES}</style>
    </div>
  );
}

function MotDuComptoir({
  m,
  commerce,
  maintenant,
  petitsMots,
  gate,
  onOffert,
}: {
  m: PetitMot;
  commerce: CommerceComptoir;
  maintenant: number;
  petitsMots: PetitsMotsDuComptoir;
  gate: Gate | null;
  onOffert?: () => void;
}) {
  const [choisir, setChoisir] = useState(false);
  // CE QU'IL A DÉCIDÉ D'OFFRIR CE MOIS-CI, proposé en premier.
  const [cadeau, setCadeau] = useState(gate && resteDuGate(gate) > 0 ? gate.quoi : "");
  const idees = gate ? [gate.quoi, ...plusDe(commerce.famille).filter((p) => p !== gate.quoi)] : plusDe(commerce.famille);
  const propre = plusPropre(cadeau);
  const interdit = Boolean(propre) && !plusPermis(propre);
  const visible = m.liste || m.coeur;
  return (
    <article className={`pm-mot${m.coeur ? " coeur" : ""}`}>
      <div className="pm-qui">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lookDe(m.look).image} alt="" />
        <span>
          <b>{m.prenom || "Sans prénom"}</b>
          <small>
            {quandEnClair(m.le, maintenant)} · {m.liste ? "choisi dans la liste" : "écrit"}
          </small>
        </span>
      </div>
      <q className="pm-texte">{m.texte}</q>
      <p className="pm-etat">
        {m.cadeau ? `🎁 Tu lui as offert ${m.cadeau} · dans ta vitrine` : m.coeur ? "💛 Ton coup de cœur · dans ta vitrine" : visible ? "Dans ta vitrine" : "Seulement toi le vois, tant que tu n’as pas de coup de cœur"}
      </p>
      {!m.cadeau && (
        <div className="pm-gestes">
          <button type="button" className={`pm-coeur${m.coeur ? " on" : ""}`} aria-pressed={m.coeur} onClick={() => void petitsMots.coeur(m, !m.coeur)}>
            {m.coeur ? "💛 Coup de cœur" : "🤍 Coup de cœur"}
          </button>
          {!choisir && (
            <button type="button" className="pm-offrir" onClick={() => setChoisir(true)}>
              🎁 Offrir…
            </button>
          )}
        </div>
      )}
      {choisir && !m.cadeau && (
        <div className="pm-choix">
          <div className="pm-puces">
            {idees.map((p) => (
              <button key={p} type="button" className={cadeau === p ? "on" : ""} onClick={() => setCadeau(p)}>
                {p}
              </button>
            ))}
          </div>
          <input value={cadeau} maxLength={60} placeholder="Ou ce que tu veux offrir" onChange={(e) => setCadeau(e.target.value)} aria-label="Ce que tu offres" />
          {interdit && <p className="pm-ennui">Pas d’alcool offert : la loi Évin l’interdit.</p>}
          <div className="pm-gestes">
            <button
              type="button"
              className="pm-offrir oui"
              disabled={!propre || interdit}
              onClick={() =>
                void petitsMots.offrir(m, propre).then((ok) => {
                  if (!ok) return;
                  setChoisir(false);
                  onOffert?.();
                })
              }
            >
              {propre ? `Offrir ${propre}` : "Offrir"}
            </button>
            <button type="button" className="pm-annuler" onClick={() => setChoisir(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

const STYLES = `
.pm{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;display:flex;flex-direction:column;gap:12px;}
.pm::-webkit-scrollbar{display:none;}
.pm-haut{display:flex;}
.pm-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);color:var(--creme);font-weight:700;}
.pm-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid rgba(255,46,154,.3);}
.pm-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.pm-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;}
.pm-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.pm-note{margin:-2px 2px 0;font-size:12.5px;color:#9A7A62;}
.pm-offert{margin:0;padding:10px 14px;border-radius:14px;background:rgba(245,162,58,.1);border:1px solid rgba(245,162,58,.35);font-size:14px;}
.pm-offert b{color:var(--ambre);}
.pm-ennui{margin:0;padding:9px 12px;border-radius:12px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);font-size:13.5px;}
.pm-vide{margin:0;padding:16px;border-radius:16px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.pm-mot{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.pm-mot.coeur{border-color:rgba(255,206,84,.55);}
.pm-qui{display:flex;align-items:center;gap:10px;}
.pm-qui img{width:34px;height:40px;object-fit:contain;object-position:50% 100%;flex:none;}
.pm-qui span{display:flex;flex-direction:column;}
.pm-qui b{font-family:var(--font-clikme),sans-serif;font-size:16px;font-weight:800;}
.pm-qui small{font-size:12.5px;color:var(--gris);}
.pm-texte{display:block;padding:10px 12px;border-radius:4px 16px 16px 16px;background:var(--nappe2);font-size:15px;line-height:1.45;font-style:italic;}
.pm-texte::before,.pm-texte::after{content:"";}
.pm-etat{margin:0;font-size:12.5px;color:var(--gris);}
.pm-gestes{display:flex;flex-wrap:wrap;gap:8px;}
.pm-coeur,.pm-offrir,.pm-annuler{min-height:38px;padding:0 14px;border-radius:999px;font-weight:800;font-size:13.5px;}
.pm-coeur{border:1.5px solid rgba(255,206,84,.6);background:none;color:#FFD86E;}
.pm-coeur.on{background:rgba(255,206,84,.18);}
.pm-offrir{border:1.5px solid var(--ambre);background:none;color:var(--ambre);}
.pm-offrir.oui{border-color:transparent;background:var(--ambre);color:#2A1404;}
.pm-offrir:disabled{opacity:.45;}
.pm-annuler{border:0;background:none;color:var(--gris);text-decoration:underline;}
.pm-choix{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:var(--fond);border:1px solid var(--trait);}
.pm-puces{display:flex;flex-wrap:wrap;gap:6px;}
.pm-puces button{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-weight:700;font-size:13px;}
.pm-puces button.on{border-color:var(--ambre);background:var(--ambre);color:#2A1404;}
.pm-choix input{min-height:40px;padding:0 12px;border-radius:12px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font:inherit;font-size:14.5px;}
`;
