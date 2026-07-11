"use client";
// Configurateur de la maquette (SPEC §5-7) : 3 questions au milieu du site →
// routing vers la brique prioritaire → accusé de réception qui prouve qu'on a
// écouté. Le SITE ne change pas : seule la brique mise en avant change.
// Étape 1 (ici) : tout est local/visuel. Étape 2 : POST persistance + notif
// WhatsApp à Marius (branché ensuite sur /api/.../maquette-config).
import { useState } from "react";

type Agenda = "plein" | "remplir";
type Secret = "oui" | "non";
type Pain = "interruption" | "noshow" | "sav" | "mauvais";
type Brique = "accueil" | "sas" | "hub" | "visib";

const BRIQUES: Record<Brique, { t: string; p: string; l: [string, string] }> = {
  accueil: {
    t: "L'accueil intelligent",
    p: "Il répond, qualifie la demande, propose vos créneaux et confirme — 24 h/24, sans jamais vous déranger.",
    l: ["Vous ne décrochez plus pendant vos séances", "Rappel automatique la veille"],
  },
  sas: {
    t: "Le sas de qualification",
    p: "Avant de réserver, le patient passe par vos conditions : pour qui, quel motif, votre cadre. Vous ne recevez que les demandes qui vous concernent.",
    l: ["Fini les rendez-vous hors de votre champ", "Le patient arrive déjà informé"],
  },
  hub: {
    t: "L'espace patient",
    p: "Factures pour la mutuelle, consignes, documents : vos patients les retrouvent seuls, à toute heure.",
    l: ["Plus de SMS le soir pour renvoyer une facture", "Votre téléphone s'éteint après la dernière séance"],
  },
  visib: {
    t: "Être trouvé, et rassurer",
    p: "Votre approche, votre cadre, vos infos pratiques — pour qu'on vous découvre, et qu'on ose franchir le pas.",
    l: ["Vous apparaissez quand on vous cherche", "Le patient hésitant peut écrire, sans appeler"],
  },
};
const LIB: Record<Brique, string> = {
  accueil: "l'accueil intelligent",
  sas: "le sas de qualification",
  hub: "l'espace patient",
  visib: "votre visibilité",
};

function route(agenda: Agenda, secret: Secret, pain: Pain): Brique {
  let k: Brique = "accueil";
  if (pain === "sav") k = "hub";
  else if (pain === "mauvais") k = "sas";
  else if (pain === "noshow") k = "accueil";
  else if (pain === "interruption") k = secret === "oui" ? "sas" : "accueil";
  if (agenda === "remplir" && pain !== "sav") k = "visib";
  return k;
}

export function MaquetteConfigurateur({ slug }: { slug: string }) {
  const [agenda, setAgenda] = useState<Agenda | "">("");
  const [secret, setSecret] = useState<Secret | "">("");
  const [pain, setPain] = useState<Pain | "">("");
  const [result, setResult] = useState<Brique | null>(null);

  const ready = agenda && secret && pain;

  const build = () => {
    if (!agenda || !secret || !pain) return;
    const k = route(agenda, secret, pain);
    setResult(k);
    // Persiste la situation déclarée + notifie Marius (best-effort, non bloquant).
    try {
      fetch("/api/site-internet/apercu/maquette-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, agenda, secret, pain, brique: k }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* le résultat s'affiche quand même */
    }
    // Laisse le temps au bloc de s'afficher avant de scroller.
    requestAnimationFrame(() => {
      document.getElementById("mqc-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const opt = (
    label: string,
    selected: boolean,
    onClick: () => void
  ) => (
    <button type="button" className={`opt${selected ? " on" : ""}`} onClick={onClick}>{label}</button>
  );

  return (
    <>
      <div className="cfg" id="mqc-cfg">
        <div className="cfg-lead">Ce site peut aller plus loin.<br />Adaptons-le à votre situation.</div>
        <div className="cfg-sub">Trois questions, dix secondes. Votre site mettra en avant ce qui vous sert vraiment.</div>

        <div className="q">
          <div className="lab">Votre agenda, aujourd’hui</div>
          <div className="opts">
            {opt("Plutôt plein", agenda === "plein", () => setAgenda("plein"))}
            {opt("J’ai de la place", agenda === "remplir", () => setAgenda("remplir"))}
          </div>
        </div>

        <div className="q">
          <div className="lab">Qui répond au téléphone ?</div>
          <div className="opts">
            {opt("Moi, entre deux séances", secret === "non", () => setSecret("non"))}
            {opt("J’ai un secrétariat", secret === "oui", () => setSecret("oui"))}
          </div>
        </div>

        <div className="q">
          <div className="lab">Ce qui vous pèse le plus</div>
          <div className="opts">
            {opt("Être interrompu pendant mes séances", pain === "interruption", () => setPain("interruption"))}
            {opt("Les rendez-vous non honorés", pain === "noshow", () => setPain("noshow"))}
            {opt("Le SAV : factures, consignes, documents", pain === "sav", () => setPain("sav"))}
            {opt("Des demandes qui ne sont pas pour moi", pain === "mauvais", () => setPain("mauvais"))}
          </div>
        </div>

        <button type="button" className="go" disabled={!ready} onClick={build}>Adapter mon site →</button>
      </div>

      {result && (
        <div className="result" id="mqc-result">
          <div className="ack">
            ✦ <b>{agenda === "plein" ? "Votre agenda est plein" : "Vous avez de la place"}, {secret === "oui" ? "vous avez un secrétariat" : "vous répondez vous-même"}.</b> Votre site met donc en avant <b>{LIB[result]}</b>.
          </div>
          <div className="feat">
            <div className="pill">Prioritaire</div>
            <h4>{BRIQUES[result].t}</h4>
            <p>{BRIQUES[result].p}</p>
            <ul>
              {BRIQUES[result].l.map((x) => (<li key={x}>{x}</li>))}
            </ul>
          </div>
          <div className="others">
            Également inclus : {(Object.keys(BRIQUES) as Brique[]).filter((x) => x !== result).map((x) => LIB[x]).join(" · ")}.
          </div>
        </div>
      )}
    </>
  );
}
