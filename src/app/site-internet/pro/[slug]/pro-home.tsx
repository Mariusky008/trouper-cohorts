"use client";

// Accueil de l'Espace Pro repensé en « télécommande » : le commerçant ne choisit
// PAS une rubrique administrative, il choisit CE QU'IL VEUT FAIRE. De grosses
// actions qui ouvrent directement le bon outil (via l'évènement pro-goto-tab),
// un résumé du jour en 3 chiffres, et ce qu'il reste à traiter. Le reste est rangé.
import { useState } from "react";

type Props = {
  nom: string;
  soliciter: boolean;
  afficherAvis: boolean;
  views: number;
  rdv: number;
  annonces: number;
  demandes: number;
  clients: number;
  avis: number; // +N nouveaux avis
  rdvTomorrow: number;
};

const goto = (key: string) => window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: key }));
const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.max(0, n || 0));

export function ProHome(p: Props) {
  const [showAll, setShowAll] = useState(false);

  // Les grandes actions — adaptées au métier (commerce = tout ; santé/droit = sobre).
  type Act = { icon: string; label: string; go: () => void; hot?: boolean };
  const acts: Act[] = [];
  if (p.soliciter) {
    acts.push({ icon: "📣", label: "Faire une annonce", go: () => goto("annonce"), hot: true });
    acts.push({ icon: "⭐", label: "Demander un avis", go: () => goto("clients:avis") });
    acts.push({ icon: "👤", label: "Ajouter un client", go: () => goto("clients:liste") });
  }
  acts.push({ icon: "🕐", label: "Modifier mes horaires", go: () => goto("agenda") });
  acts.push({ icon: "🎨", label: "Modifier mon site", go: () => goto("site") });
  acts.push({ icon: "📊", label: "Voir mes résultats", go: () => setShowAll((v) => !v) });

  // Résumé du jour : 3 chiffres essentiels (le reste sous « Voir mes résultats »).
  const mainStats = [
    { icon: "👁", value: nf(p.views), label: "visites du site" },
    { icon: "📅", value: nf(p.rdv), label: "rendez-vous à venir" },
    p.soliciter
      ? { icon: "📣", value: nf(p.annonces), label: "annonces ce mois" }
      : { icon: "⭐", value: p.avis > 0 ? `+${nf(p.avis)}` : "0", label: "nouveaux avis" },
  ];
  const moreStats = [
    { icon: "💬", value: nf(p.demandes), label: "demandes d'avis envoyées", show: p.soliciter },
    { icon: "👥", value: nf(p.clients), label: "clients enregistrés", show: p.soliciter },
    { icon: "⭐", value: p.avis > 0 ? `+${nf(p.avis)}` : "0", label: "nouveaux avis obtenus", show: p.afficherAvis && p.soliciter },
  ].filter((x) => x.show);

  // À traiter / à préparer.
  const todos: string[] = [];
  if (p.rdvTomorrow > 0) todos.push(`${nf(p.rdvTomorrow)} rendez-vous demain — pensez aux rappels`);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .home .hi{font-family:Georgia,serif;font-size:22px;font-weight:700;line-height:1.15;letter-spacing:-.01em;}
          .pro .home .q{font-size:14px;color:var(--soft);margin-top:4px;font-weight:600;}
          .pro .home .acts{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:16px;}
          .pro .home .act{display:flex;flex-direction:column;gap:9px;align-items:flex-start;text-align:left;cursor:pointer;font-family:inherit;
            border:1px solid var(--hair);background:var(--paper);color:var(--ink);border-radius:17px;padding:16px 15px;
            box-shadow:0 10px 26px -20px rgba(25,26,44,.4);transition:transform .12s ease,box-shadow .15s ease,border-color .15s ease;}
          .pro .home .act:hover{transform:translateY(-2px);box-shadow:0 16px 32px -20px rgba(25,26,44,.5);border-color:#D9D2F5;}
          .pro .home .act:active{transform:scale(.98);}
          .pro .home .act .e{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;background:#F1EFFB;}
          .pro .home .act .t{font-size:14.5px;font-weight:800;letter-spacing:-.01em;line-height:1.2;}
          .pro .home .act.hot{background:linear-gradient(135deg,#8A6BE0,#5B3FA6);border-color:transparent;color:#fff;box-shadow:0 16px 32px -14px rgba(91,63,166,.75);}
          .pro .home .act.hot .e{background:rgba(255,255,255,.18);}
          @media(min-width:900px){.pro .home .acts{grid-template-columns:1fr 1fr 1fr;}}

          .pro .home .recap{margin-top:22px;border:1px solid var(--hair);border-radius:18px;background:var(--paper);padding:15px 16px;box-shadow:0 12px 32px -24px rgba(25,26,44,.3);}
          .pro .home .recap .rk{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:800;}
          .pro .home .stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:11px;}
          .pro .home .st{border-radius:13px;background:#F7F7FC;padding:12px 10px;text-align:center;}
          .pro .home .st .sv{font-size:22px;font-weight:850;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
          .pro .home .st .sl{font-size:10.5px;color:var(--soft);line-height:1.3;margin-top:3px;font-weight:600;}
          .pro .home .more{margin-top:10px;width:100%;border:none;background:none;color:var(--violet);font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit;padding:4px;}
          .pro .home .todo{margin-top:13px;display:flex;flex-direction:column;gap:7px;}
          .pro .home .todo .ti{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;background:#FFF7E9;border:1px solid #F6E4BD;border-radius:11px;padding:10px 12px;color:#6B4E12;}
          .pro .home .todo .ok{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--soft);background:#F1F8F3;border:1px solid #D6EBDD;border-radius:11px;padding:10px 12px;font-weight:600;}
          `,
        }}
      />
      <div className="home">
        <div className="hi">Bonjour{p.nom ? `, ${p.nom}` : ""} 👋</div>
        <div className="q">Que voulez-vous faire&nbsp;?</div>

        <div className="acts">
          {acts.map((a) => (
            <button type="button" key={a.label} className={`act${a.hot ? " hot" : ""}`} onClick={a.go}>
              <span className="e">{a.icon}</span>
              <span className="t">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="recap">
          <div className="rk">Aujourd&apos;hui</div>
          <div className="stats">
            {mainStats.map((s) => (
              <div className="st" key={s.label}>
                <div className="sv">{s.value}</div>
                <div className="sl">{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
          {moreStats.length > 0 && (
            <>
              <button type="button" className="more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Masquer" : "Voir tous les résultats"}
              </button>
              {showAll && (
                <div className="stats">
                  {moreStats.map((s) => (
                    <div className="st" key={s.label}>
                      <div className="sv">{s.value}</div>
                      <div className="sl">{s.icon} {s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="todo">
            {todos.length > 0 ? (
              todos.map((t) => <div className="ti" key={t}>🔔 {t}</div>)
            ) : (
              <div className="ok">✓ Rien à traiter dans l&apos;immédiat — tout est à jour.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
