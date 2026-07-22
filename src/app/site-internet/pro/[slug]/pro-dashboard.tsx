// Tableau de bord de l'Espace Pro (en tête de l'onglet Accueil). Des chiffres
// RÉELS, agrégés depuis ce qui existe déjà (vues, rendez-vous, avis gagnés,
// annonces, demandes d'avis, clients). But : que le pro VOIE que ça travaille.
// Design 2026 : cartes claires, pastilles d'icône colorées, gros chiffres.
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
type Tone = "sky" | "violet" | "gold" | "pink" | "amber" | "green";

export function ProDashboard(p: Props) {
  type Tile = { show: boolean; icon: string; value: string; label: string; tone: Tone; hot?: boolean };
  const tiles: Tile[] = ([
    { show: true, icon: "👁", value: nf(p.views), label: "vues du site", tone: "sky" },
    { show: true, icon: "📅", value: nf(p.rdv), label: "rendez-vous à venir", tone: "violet", hot: p.rdv > 0 },
    { show: p.afficherAvis, icon: "⭐", value: p.avis > 0 ? `+${nf(p.avis)}` : "0", label: "avis gagnés", tone: "gold", hot: p.avis > 0 },
    { show: p.soliciter, icon: "📣", value: nf(p.annonces), label: "annonces ce mois", tone: "pink" },
    { show: p.soliciter, icon: "💬", value: nf(p.demandes), label: "demandes d'avis", tone: "amber" },
    { show: p.soliciter, icon: "👥", value: nf(p.clients), label: "clients enregistrés", tone: "green" },
  ] as Tile[]).filter((t) => t.show);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .dash{margin-top:18px;}
          .pro .dash .h{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--soft);font-weight:700;margin-bottom:11px;}
          .pro .dash .grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
          .pro .dash .t{position:relative;border:1px solid var(--hair);border-radius:18px;padding:14px;background:#fff;
            box-shadow:0 10px 26px -20px rgba(25,26,44,.3);overflow:hidden;transition:transform .12s ease;}
          .pro .dash .t:active{transform:scale(.98);}
          .pro .dash .t .chip{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;}
          .pro .dash .t .v{font-weight:800;font-size:28px;line-height:1;margin-top:12px;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
          .pro .dash .t .l{font-size:11.5px;color:var(--soft);margin-top:4px;line-height:1.25;font-weight:600;}
          .pro .dash .t.hot::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--grad);}
          /* Teintes par tuile */
          .pro .dash .t.sky .chip{background:rgba(59,130,246,.12);}
          .pro .dash .t.violet .chip{background:rgba(109,74,224,.13);}
          .pro .dash .t.gold .chip{background:rgba(240,180,41,.16);}
          .pro .dash .t.pink .chip{background:rgba(236,72,153,.12);}
          .pro .dash .t.amber .chip{background:rgba(245,158,11,.14);}
          .pro .dash .t.green .chip{background:rgba(18,166,92,.13);}
          .pro .dash .t.violet.hot .v{color:var(--violet);}
          .pro .dash .t.gold.hot .v{color:#B8860B;}
          `,
        }}
      />
      <div className="dash">
        <div className="h">📊 Votre site en chiffres</div>
        <div className="grid">
          {tiles.map((t) => (
            <div className={`t ${t.tone}${t.hot ? " hot" : ""}`} key={t.label}>
              <div className="chip">{t.icon}</div>
              <div className="v">{t.value}</div>
              <div className="l">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
