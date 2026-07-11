"use client";
// Configurateur de la maquette (SPEC §5-7) : 3 questions au milieu du site →
// routing vers la brique prioritaire → accusé de réception qui prouve qu'on a
// écouté. Le SITE ne change pas : seule la brique mise en avant change.
// Profile-aware : profils B/C partagent la config « soin » ; le profil A a sa
// config commerce (briques accueil/visib/avis/devis). POST best-effort (persiste
// + notifie Marius) — non bloquant.
import { useState } from "react";
import type { Profil } from "@/lib/site-internet/metier-profiles";

type Brique = "accueil" | "sas" | "hub" | "visib" | "avis" | "devis";
type Opt = { v: string; label: string };
type Question = { key: "agenda" | "secret" | "pain"; lab: string; opts: Opt[] };

type Config = {
  questions: Question[];
  briques: Record<string, { t: string; p: string; l: [string, string]; lib: string }>;
  route: (a: Record<string, string>) => Brique;
};

// ── Config SOIN (profils B/C) ────────────────────────────────────────────────
const SOIN: Config = {
  questions: [
    { key: "agenda", lab: "Votre agenda, aujourd’hui", opts: [{ v: "plein", label: "Plutôt plein" }, { v: "remplir", label: "J’ai de la place" }] },
    { key: "secret", lab: "Qui répond au téléphone ?", opts: [{ v: "non", label: "Moi, entre deux séances" }, { v: "oui", label: "J’ai un secrétariat" }] },
    { key: "pain", lab: "Ce qui vous pèse le plus", opts: [
      { v: "interruption", label: "Être interrompu pendant mes séances" },
      { v: "noshow", label: "Les rendez-vous non honorés" },
      { v: "sav", label: "Le SAV : factures, consignes, documents" },
      { v: "mauvais", label: "Des demandes qui ne sont pas pour moi" },
    ] },
  ],
  briques: {
    accueil: { t: "L'accueil intelligent", p: "Il répond, qualifie la demande, propose vos créneaux et confirme — 24 h/24, sans jamais vous déranger.", l: ["Vous ne décrochez plus pendant vos séances", "Rappel automatique la veille"], lib: "l'accueil intelligent" },
    sas: { t: "Le sas de qualification", p: "Avant de réserver, le patient passe par vos conditions : pour qui, quel motif, votre cadre. Vous ne recevez que les demandes qui vous concernent.", l: ["Fini les rendez-vous hors de votre champ", "Le patient arrive déjà informé"], lib: "le sas de qualification" },
    hub: { t: "L'espace patient", p: "Factures pour la mutuelle, consignes, documents : vos patients les retrouvent seuls, à toute heure.", l: ["Plus de SMS le soir pour renvoyer une facture", "Votre téléphone s'éteint après la dernière séance"], lib: "l'espace patient" },
    visib: { t: "Être trouvé, et rassurer", p: "Votre approche, votre cadre, vos infos pratiques — pour qu'on vous découvre, et qu'on ose franchir le pas.", l: ["Vous apparaissez quand on vous cherche", "Le patient hésitant peut écrire, sans appeler"], lib: "votre visibilité" },
  },
  route: (a) => {
    let k: Brique = "accueil";
    if (a.pain === "sav") k = "hub";
    else if (a.pain === "mauvais") k = "sas";
    else if (a.pain === "noshow") k = "accueil";
    else if (a.pain === "interruption") k = a.secret === "oui" ? "sas" : "accueil";
    if (a.agenda === "remplir" && a.pain !== "sav") k = "visib";
    return k;
  },
};

// ── Config COMMERCE (profil A) ───────────────────────────────────────────────
const COMMERCE: Config = {
  questions: [
    { key: "agenda", lab: "Votre carnet de commandes", opts: [{ v: "plein", label: "Plutôt plein" }, { v: "remplir", label: "J’ai de la place" }] },
    { key: "secret", lab: "Qui répond quand vous travaillez ?", opts: [{ v: "non", label: "Moi, ou personne" }, { v: "oui", label: "Quelqu’un à l’accueil" }] },
    { key: "pain", lab: "Ce qui vous pèse le plus", opts: [
      { v: "interruption", label: "Les appels pendant le travail" },
      { v: "devis", label: "Les devis à faire le soir" },
      { v: "clients", label: "Pas assez de clients" },
      { v: "avis", label: "Trop peu d’avis Google" },
    ] },
  ],
  briques: {
    accueil: { t: "L'accueil intelligent", p: "Il répond, propose vos créneaux et confirme — 24 h/24, sans vous interrompre en plein travail.", l: ["Vous ne décrochez plus en plein service", "Rappel automatique la veille"], lib: "l'accueil intelligent" },
    devis: { t: "Les devis, sans y passer vos soirées", p: "L'accueil recueille la demande (besoin, photos, coordonnées) et vous prépare un devis à envoyer en un geste.", l: ["Fini les devis à 22 h", "Vous répondez vite — et vous décrochez le chantier"], lib: "les devis" },
    avis: { t: "Plus d'avis Google", p: "Un geste après chaque client, et votre réputation monte — semaine après semaine, vous passez devant.", l: ["Plus d'avis = plus de confiance", "Vous remontez dans les résultats"], lib: "vos avis Google" },
    visib: { t: "Être trouvé en premier", p: "Votre site vous fait apparaître quand on cherche vos services près de chez vous.", l: ["Vous apparaissez sur Google", "Les curieux deviennent des clients"], lib: "votre visibilité" },
  },
  route: (a) => {
    let k: Brique = "accueil";
    if (a.pain === "devis") k = "devis";
    else if (a.pain === "avis") k = "avis";
    else if (a.pain === "clients") k = "visib";
    else if (a.pain === "interruption") k = "accueil";
    if (a.agenda === "remplir" && a.pain !== "devis" && a.pain !== "avis") k = "visib";
    return k;
  },
};

const AGENDA_CTX: Record<string, string> = { plein: "Votre agenda est plein", remplir: "Vous avez de la place" };
const SECRET_CTX_SOIN: Record<string, string> = { oui: "vous avez un secrétariat", non: "vous répondez vous-même" };
const SECRET_CTX_COM: Record<string, string> = { oui: "quelqu’un tient l’accueil", non: "vous répondez vous-même" };

export function MaquetteConfigurateur({ slug, profil }: { slug: string; profil: Profil }) {
  const cfg = profil === "A" ? COMMERCE : SOIN;
  const [ans, setAns] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Brique | null>(null);

  const ready = ans.agenda && ans.secret && ans.pain;

  const build = () => {
    if (!ready) return;
    const k = cfg.route(ans);
    setResult(k);
    try {
      fetch("/api/site-internet/apercu/maquette-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, agenda: ans.agenda, secret: ans.secret, pain: ans.pain, brique: k }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* le résultat s'affiche quand même */
    }
    requestAnimationFrame(() => {
      document.getElementById("mqc-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const secretCtx = profil === "A" ? SECRET_CTX_COM : SECRET_CTX_SOIN;

  return (
    <>
      <div className="cfg" id="mqc-cfg">
        <div className="cfg-lead">Ce site peut aller plus loin.<br />Adaptons-le à votre situation.</div>
        <div className="cfg-sub">Trois questions, dix secondes. Votre site mettra en avant ce qui vous sert vraiment.</div>

        {cfg.questions.map((q) => (
          <div className="q" key={q.key}>
            <div className="lab">{q.lab}</div>
            <div className="opts">
              {q.opts.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  className={`opt${ans[q.key] === o.v ? " on" : ""}`}
                  onClick={() => setAns((prev) => ({ ...prev, [q.key]: o.v }))}
                >{o.label}</button>
              ))}
            </div>
          </div>
        ))}

        <button type="button" className="go" disabled={!ready} onClick={build}>Adapter mon site →</button>
      </div>

      {result && (
        <div className="result" id="mqc-result">
          <div className="ack">
            ✦ <b>{AGENDA_CTX[ans.agenda]}, {secretCtx[ans.secret]}.</b> Votre site met donc en avant <b>{cfg.briques[result].lib}</b>.
          </div>
          <div className="feat">
            <div className="pill">Prioritaire</div>
            <h4>{cfg.briques[result].t}</h4>
            <p>{cfg.briques[result].p}</p>
            <ul>
              {cfg.briques[result].l.map((x) => (<li key={x}>{x}</li>))}
            </ul>
          </div>
          <div className="others">
            Également inclus : {Object.keys(cfg.briques).filter((x) => x !== result).map((x) => cfg.briques[x].lib).join(" · ")}.
          </div>
        </div>
      )}
    </>
  );
}
