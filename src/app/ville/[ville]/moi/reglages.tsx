"use client";

// L'onglet « Moi », côté client.
//
// DÉPLIAGE SUR PLACE, pas de sous-pages. Cinq sous-écrans pour cinq réglages
// courts obligeraient à naviguer, attendre, revenir, et retrouver sa place dans
// la liste. Déplier laisse la personne voir ce qu'elle change et ce qu'elle a
// déjà réglé au même endroit.
//
// PAS DE BOUTON « ENREGISTRER » sur les canaux : un écran de consentements avec
// une validation laisse croire qu'un canal est coupé alors qu'il ne l'est pas
// encore, et c'est le malentendu qu'on ne peut pas se permettre sur des envois.
// Les réglages qui se saisissent (secteur, horaires) enregistrent à la
// fermeture du panneau, parce qu'écrire à chaque frappe serait absurde.
import { useState } from "react";

export type Reglages = {
  recoitResume: boolean;
  recoitAlertes: boolean;
  recoitSuivis: boolean;
  recoitVilleInfos: boolean;
};

async function enregistrer(patch: Record<string, unknown>): Promise<boolean> {
  try {
    const r = await fetch("/api/direct/reglages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Une ligne dépliable ─────────────────────────────────────────────────────
function Ligne({
  ic,
  titre,
  sous,
  ouvert,
  onToggle,
  children,
}: {
  ic: string;
  titre: string;
  sous: string;
  ouvert: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button type="button" className="row" onClick={onToggle} aria-expanded={ouvert} style={{ cursor: "pointer" }}>
        <span className="ic" aria-hidden="true">{ic}</span>
        <div>
          <div className="t">{titre}</div>
          <div className="s">{sous}</div>
        </div>
        <span className="go" aria-hidden="true" style={{ transform: ouvert ? "rotate(90deg)" : undefined, display: "inline-block" }}>›</span>
      </button>
      {ouvert ? <div className="panneau">{children}</div> : null}
    </>
  );
}

// ── Les canaux ──────────────────────────────────────────────────────────────
const CANAUX: Array<{ cle: keyof Reglages; ic: string; t: string; s: string }> = [
  { cle: "recoitResume", ic: "◉", t: "Le résumé du jour", s: "Un message vers 11 h" },
  { cle: "recoitAlertes", ic: "⚡", t: "Alertes de dernière minute", s: "Places libres et offres qui finissent" },
  { cle: "recoitSuivis", ic: "♡", t: "Les commerces que je suis", s: "Quand ils publient quelque chose" },
  { cle: "recoitVilleInfos", ic: "▣", t: "Informations de la ville", s: "Travaux, marchés, événements" },
];

export function ReglagesCanaux({ initial, actif }: { initial: Reglages; actif: boolean }) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState("");

  const basculer = async (cle: keyof Reglages) => {
    const vise = !v[cle];
    setV((s) => ({ ...s, [cle]: vise }));
    setErr("");
    if (!(await enregistrer({ [cle]: vise }))) {
      setV((s) => ({ ...s, [cle]: !vise }));
      setErr("Réglage non enregistré — réessayez.");
    }
  };

  return (
    <>
      {CANAUX.map((l) => (
        <div className="row" key={l.cle}>
          <span className="ic" aria-hidden="true">{l.ic}</span>
          <div>
            <div className="t">{l.t}</div>
            <div className="s">
              {l.s}
              {!actif ? " · nécessite une adresse" : ""}
            </div>
          </div>
          <button
            type="button"
            className={`tog${v[l.cle] ? "" : " off"}`}
            onClick={() => basculer(l.cle)}
            role="switch"
            aria-checked={v[l.cle]}
            aria-label={l.t}
          />
        </div>
      ))}
      {err ? <div className="alerte" role="alert">{err}</div> : null}
    </>
  );
}

// ── Catégories ──────────────────────────────────────────────────────────────
export function PanneauCategories({
  disponibles,
  initial,
}: {
  disponibles: string[];
  initial: string[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [sel, setSel] = useState<string[]>(initial);
  const [err, setErr] = useState("");

  const basculer = async (c: string) => {
    const suivant = sel.includes(c) ? sel.filter((x) => x !== c) : [...sel, c];
    setSel(suivant);
    setErr("");
    if (!(await enregistrer({ categories: suivant }))) {
      setSel(sel);
      setErr("Non enregistré — réessayez.");
    }
  };

  return (
    <Ligne
      ic="◈"
      titre="Mes catégories"
      // « Toutes » plutôt que « aucune » : ne rien choisir ne restreint rien,
      // et afficher « aucune » ferait croire qu'on ne verra plus rien.
      sous={sel.length ? sel.join(" · ") : "Toutes pour l'instant"}
      ouvert={ouvert}
      onToggle={() => setOuvert((o) => !o)}
    >
      {disponibles.length ? (
        <>
          <p className="aide">
            Ce qui vous intéresse remonte dans « À saisir ». Le fil, lui, reste complet — choisir une
            catégorie ne vous cache jamais le reste de votre ville.
          </p>
          <div className="puces">
            {disponibles.map((c) => (
              <button
                key={c}
                type="button"
                className={`puce${sel.includes(c) ? " on" : ""}`}
                onClick={() => basculer(c)}
                aria-pressed={sel.includes(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {sel.length > 0 && (
            <button type="button" className="lien" onClick={() => { setSel([]); void enregistrer({ categories: [] }); }}>
              Tout réafficher
            </button>
          )}
        </>
      ) : (
        <p className="aide">Pas encore assez de commerces ici pour proposer des catégories.</p>
      )}
      {err ? <div className="alerte" role="alert">{err}</div> : null}
    </Ligne>
  );
}

// ── Secteur ─────────────────────────────────────────────────────────────────
const RAYONS = [
  { m: 500, l: "500 m" },
  { m: 1000, l: "1 km" },
  { m: 2000, l: "2 km" },
  { m: 5000, l: "5 km" },
];

export function PanneauSecteur({
  quartiers,
  quartierInitial,
  rayonInitial,
  ville,
}: {
  quartiers: string[];
  quartierInitial: string;
  rayonInitial: number;
  ville: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [quartier, setQuartier] = useState(quartierInitial);
  const [rayon, setRayon] = useState(rayonInitial);

  const majQuartier = async (q: string) => {
    setQuartier(q);
    void enregistrer({ quartier: q });
  };
  const majRayon = async (m: number) => {
    setRayon(m);
    void enregistrer({ rayonM: m });
  };

  const rayonL = RAYONS.find((r) => r.m === rayon)?.l ?? `${rayon} m`;

  return (
    <Ligne
      ic="⌖"
      titre="Mon secteur"
      sous={`${quartier || ville} · jusqu'à ${rayonL}`}
      ouvert={ouvert}
      onToggle={() => setOuvert((o) => !o)}
    >
      <p className="aide">
        Sert à afficher les distances quand vous refusez la géolocalisation — et à choisir ce qui
        remonte en premier. Rien ne vous oblige à partager votre position.
      </p>
      {quartiers.length > 0 && (
        <>
          <div className="etiq">Mon quartier</div>
          <div className="puces">
            <button type="button" className={`puce${!quartier ? " on" : ""}`} onClick={() => majQuartier("")} aria-pressed={!quartier}>
              Toute la ville
            </button>
            {quartiers.map((q) => (
              <button key={q} type="button" className={`puce${quartier === q ? " on" : ""}`} onClick={() => majQuartier(q)} aria-pressed={quartier === q}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="etiq">Jusqu&apos;à quelle distance</div>
      <div className="puces">
        {RAYONS.map((r) => (
          <button key={r.m} type="button" className={`puce${rayon === r.m ? " on" : ""}`} onClick={() => majRayon(r.m)} aria-pressed={rayon === r.m}>
            {r.l}
          </button>
        ))}
      </div>
    </Ligne>
  );
}

// ── Horaires de tranquillité ────────────────────────────────────────────────
export function PanneauHoraires({ avantInitial, apresInitial }: { avantInitial: number; apresInitial: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [avant, setAvant] = useState(avantInitial);
  const [apres, setApres] = useState(apresInitial);
  const [err, setErr] = useState("");

  const maj = async (a: number, b: number) => {
    // « avant 20 h et après 9 h » ne veut rien dire : on refuse plutôt que
    // d'enregistrer un réglage dont personne ne peut prédire l'effet.
    if (a >= b) {
      setErr("L'heure du matin doit précéder celle du soir.");
      return;
    }
    setErr("");
    setAvant(a);
    setApres(b);
    void enregistrer({ silenceAvant: a, silenceApres: b });
  };

  const heures = Array.from({ length: 24 }, (_, h) => h);

  return (
    <Ligne
      ic="◷"
      titre="Mes horaires"
      sous={`Ne pas déranger avant ${avant} h et après ${apres} h`}
      ouvert={ouvert}
      onToggle={() => setOuvert((o) => !o)}
    >
      <p className="aide">Aucun message ne part en dehors de ces heures, quel que soit le canal.</p>
      <div className="duo">
        <label>
          <span className="etiq">Pas avant</span>
          <select value={avant} onChange={(e) => maj(Number(e.target.value), apres)}>
            {heures.map((h) => <option key={h} value={h}>{h} h</option>)}
          </select>
        </label>
        <label>
          <span className="etiq">Pas après</span>
          <select value={apres} onChange={(e) => maj(avant, Number(e.target.value))}>
            {heures.map((h) => <option key={h} value={h}>{h} h</option>)}
          </select>
        </label>
      </div>
      {err ? <div className="alerte" role="alert">{err}</div> : null}
    </Ligne>
  );
}

// ── Adresse ─────────────────────────────────────────────────────────────────
export function PanneauAdresse({
  emailMasque,
  ville,
  villeNom,
  phraseConsentement,
}: {
  emailMasque: string;
  ville: string;
  villeNom: string;
  phraseConsentement: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [accord, setAccord] = useState(false);
  const [etat, setEtat] = useState<"" | "envoi" | "envoye" | "erreur">("");
  const [msg, setMsg] = useState("");

  const envoyer = async () => {
    setEtat("envoi");
    setMsg("");
    try {
      // La même route que l'inscription : elle pose l'adresse sur la ligne
      // existante et envoie la confirmation. Une adresse ne devient active
      // qu'après un clic dans la boîte mail — y compris pour un changement.
      const r = await fetch("/api/ville/abonner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville, email: email.trim(), consent: true }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "Envoi impossible.");
      setEtat("envoye");
    } catch (e) {
      setEtat("erreur");
      setMsg(e instanceof Error ? e.message : "Envoi impossible.");
    }
  };

  const valide = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());

  return (
    <Ligne
      ic="✉"
      titre="Mon adresse"
      sous={emailMasque || "Aucune — vous pouvez tout consulter sans en donner"}
      ouvert={ouvert}
      onToggle={() => setOuvert((o) => !o)}
    >
      {etat === "envoye" ? (
        <p className="aide">
          Un lien de confirmation part vers <strong>{email.trim()}</strong>. Tant qu&apos;il n&apos;est pas
          cliqué, rien ne vous sera envoyé.
        </p>
      ) : (
        <>
          <p className="aide">
            {emailMasque
              ? "Pour changer d'adresse, saisissez la nouvelle : un lien de confirmation y sera envoyé."
              : `Pour recevoir le résumé du Direct de ${villeNom}. Vos gardées et vos commerces suivis restent les mêmes.`}
          </p>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Votre adresse e-mail"
          />
          <label className="accord">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
            <span>{phraseConsentement}</span>
          </label>
          <button type="button" className="valider" disabled={!valide || !accord || etat === "envoi"} onClick={envoyer}>
            {etat === "envoi" ? "Envoi…" : "Recevoir le lien de confirmation"}
          </button>
          {etat === "erreur" ? <div className="alerte" role="alert">{msg}</div> : null}
        </>
      )}
    </Ligne>
  );
}

// ── Mes données ─────────────────────────────────────────────────────────────
export function PanneauDonnees() {
  const [ouvert, setOuvert] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [fait, setFait] = useState(false);

  const supprimer = async () => {
    try {
      await fetch("/api/direct/donnees", { method: "DELETE" });
      setFait(true);
    } catch {
      /* l'écran reste tel quel : rien n'a été supprimé */
    }
  };

  return (
    <Ligne
      ic="⛉"
      titre="Mes données"
      sous="Voir, emporter ou tout supprimer"
      ouvert={ouvert}
      onToggle={() => setOuvert((o) => !o)}
    >
      {fait ? (
        <p className="aide">Tout est supprimé. Vous pouvez continuer à lire Le Direct comme un nouveau visiteur.</p>
      ) : (
        <>
          <a className="valider" href="/api/direct/donnees" download style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
            Emporter mes données
          </a>
          <p className="aide">
            Un fichier lisible : vos gardées, vos commerces suivis, vos réglages. Rien de plus, rien
            de caché.
          </p>
          {confirme ? (
            <>
              <p className="aide" style={{ color: "#D2634A" }}>
                Vos gardées et vos commerces suivis partent aussi. C&apos;est définitif.
              </p>
              <button type="button" className="valider danger" onClick={supprimer}>Oui, tout supprimer</button>
              <button type="button" className="lien" onClick={() => setConfirme(false)}>Annuler</button>
            </>
          ) : (
            // La SEULE confirmation de l'écran. Ailleurs — se désabonner — le
            // geste est immédiat, parce qu'il est réversible. Ici il ne l'est pas.
            <button type="button" className="lien danger" onClick={() => setConfirme(true)}>Tout supprimer</button>
          )}
        </>
      )}
    </Ligne>
  );
}

/**
 * La désinscription. Immédiate, sans confirmation ni écran de rétention — c'est
 * la seule façon de rendre l'abonnement crédible au moment où on le propose.
 */
export function SeDesabonner({ ville }: { ville: string }) {
  const [fait, setFait] = useState(false);
  const [busy, setBusy] = useState(false);

  const partir = async () => {
    setBusy(true);
    try {
      await enregistrer({ desabonner: true, ville });
      setFait(true);
    } finally {
      setBusy(false);
    }
  };

  if (fait) {
    return (
      <div className="row">
        <span className="ic" aria-hidden="true">✓</span>
        <div>
          <div className="t">C&apos;est fait — vous ne recevrez plus rien</div>
          <div className="s">Le Direct reste consultable sans rien recevoir.</div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="row" onClick={partir} disabled={busy} style={{ cursor: "pointer" }}>
      <span className="ic" aria-hidden="true">✕</span>
      <div>
        <div className="t" style={{ color: "#D2634A" }}>Me désabonner du Direct</div>
        <div className="s">Immédiat, sans confirmation</div>
      </div>
    </button>
  );
}
