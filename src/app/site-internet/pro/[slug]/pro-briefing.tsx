"use client";

// « Briefing de l'assistante » en tête de l'Espace Pro. L'assistante s'adresse au
// pro à la 1re personne (comme sur la démo), fait le point sur ses vrais chiffres,
// et propose des actions — chaque proposition bascule vers le bon onglet. Le but :
// que le pro sente une assistante qui travaille et lui suggère quoi faire, plutôt
// qu'une pile de formulaires. Aucun chiffre inventé.
type Props = {
  nom: string;
  soliciter: boolean;
  views: number;
  rdvTomorrow: number;
  honoredRecent: number;
  clients: number;
};

const goto = (key: string) => {
  window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: key }));
};

export function ProBriefing(p: Props) {
  type Sug = { icon: string; text: string; tab: string };
  const sugs: Sug[] = [];
  if (p.rdvTomorrow > 0) {
    sugs.push({ icon: "🗓️", text: `${p.rdvTomorrow} client·e·s ont rendez-vous demain. Je prépare les rappels ?`, tab: "agenda" });
  }
  if (p.soliciter && p.honoredRecent > 0) {
    sugs.push({ icon: "⭐", text: `${p.honoredRecent} rendez-vous honorés récemment. On demande leur avis ?`, tab: "agenda" });
  }
  if (p.soliciter) {
    sugs.push({ icon: "📣", text: "Un créneau à remplir ou une offre à pousser ? Je vous rédige l'annonce.", tab: "relance" });
  }
  // Repli chaleureux si rien de « chaud » aujourd'hui.
  if (sugs.length === 0) {
    sugs.push({ icon: "🗓️", text: "Envie d'ouvrir des créneaux de rendez-vous ? Je m'occupe de les proposer.", tab: "agenda" });
  }

  const hello = p.nom ? `Bonjour, ${p.nom} 👋` : "Bonjour 👋";
  const stat =
    p.views > 0
      ? `Votre site a été vu ${new Intl.NumberFormat("fr-FR").format(p.views)} fois. Voici ce que je vous propose aujourd'hui :`
      : "Voici ce que je vous propose aujourd'hui :";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .brief{margin-top:18px;border:1px solid var(--hair);border-radius:18px;background:linear-gradient(180deg,#FBF9F3,#fff);padding:16px 16px 14px;}
          .pro .brief .top{display:flex;align-items:center;gap:10px;}
          .pro .brief .av{flex:none;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#8A6BE0,#5B3FA6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;box-shadow:0 4px 12px -4px rgba(91,63,166,.6);}
          .pro .brief .who{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:600;}
          .pro .brief .hi{font-family:Georgia,serif;font-size:18px;font-weight:700;line-height:1.15;margin-top:1px;}
          .pro .brief .st{font-size:13px;color:var(--soft);line-height:1.5;margin:11px 0 4px;}
          .pro .brief .sug{width:100%;text-align:left;display:flex;align-items:center;gap:11px;border:1px solid var(--hair);background:#fff;border-radius:13px;padding:12px 13px;margin-top:9px;cursor:pointer;font-family:inherit;color:var(--ink);transition:border-color .15s ease,transform .12s ease;}
          .pro .brief .sug:hover{border-color:#B9A6EC;transform:translateY(-1px);}
          .pro .brief .sug .ic{font-size:18px;flex:none;}
          .pro .brief .sug .tx{font-size:13.5px;line-height:1.35;flex:1;}
          .pro .brief .sug .go{flex:none;color:#5B3FA6;font-weight:800;font-size:17px;}
          `,
        }}
      />
      <div className="brief">
        <div className="top">
          <span className="av">✦</span>
          <span>
            <span className="who">Votre assistante</span>
            <div className="hi">{hello}</div>
          </span>
        </div>
        <div className="st">{stat}</div>
        {sugs.map((s, i) => (
          <button key={i} type="button" className="sug" onClick={() => goto(s.tab)}>
            <span className="ic">{s.icon}</span>
            <span className="tx">{s.text}</span>
            <span className="go">→</span>
          </button>
        ))}
      </div>
    </>
  );
}
