// Tableau de bord de l'Espace Pro (en tête de l'onglet Accueil). Des chiffres
// RÉELS, agrégés depuis ce qui existe déjà (vues, rendez-vous, avis gagnés,
// annonces, demandes d'avis, clients). But : que le pro VOIE que ça travaille.
// Profil-aware : les tuiles commerce n'apparaissent pas en santé/droit.
type Props = {
  views: number;
  rdv: number;
  avis: number;
  annonces: number;
  demandes: number;
  clients: number;
  soliciter: boolean;
  afficherAvis: boolean;
};

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.max(0, n));

export function ProDashboard(p: Props) {
  const tiles: Array<{ show: boolean; icon: string; value: string; label: string; hot?: boolean }> = [
    { show: true, icon: "👁", value: nf(p.views), label: "vues du site" },
    { show: true, icon: "📅", value: nf(p.rdv), label: "rendez-vous à venir", hot: p.rdv > 0 },
    { show: p.afficherAvis, icon: "⭐", value: p.avis > 0 ? `+${nf(p.avis)}` : "0", label: "avis gagnés", hot: p.avis > 0 },
    { show: p.soliciter, icon: "📣", value: nf(p.annonces), label: "annonces ce mois" },
    { show: p.soliciter, icon: "💬", value: nf(p.demandes), label: "demandes d'avis" },
    { show: p.soliciter, icon: "👥", value: nf(p.clients), label: "clients enregistrés" },
  ].filter((t) => t.show);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .dash{margin-top:18px;}
          .pro .dash .h{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);font-weight:600;margin-bottom:10px;}
          .pro .dash .grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
          .pro .dash .t{border:1px solid var(--hair);border-radius:14px;padding:13px 14px;background:#fff;}
          .pro .dash .t.hot{border-color:var(--gold);background:linear-gradient(180deg,#FBF3E0,#fff);}
          .pro .dash .t .top{display:flex;align-items:center;gap:7px;}
          .pro .dash .t .ic{font-size:15px;}
          .pro .dash .t .v{font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1;margin-top:8px;}
          .pro .dash .t .l{font-size:11.5px;color:var(--soft);margin-top:3px;line-height:1.25;}
          `,
        }}
      />
      <div className="dash">
        <div className="h">Votre site en chiffres</div>
        <div className="grid">
          {tiles.map((t) => (
            <div className={`t${t.hot ? " hot" : ""}`} key={t.label}>
              <div className="top"><span className="ic">{t.icon}</span></div>
              <div className="v">{t.value}</div>
              <div className="l">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
