"use client";

// « Le réseau des commerçants » — l'argument le plus fort côté PRO : les autres
// commerces (non concurrents) lui envoient des clients. Affiché UNIQUEMENT en
// démo (non publié) et clairement badgé « côté pro » : c'est un pitch au
// commerçant, pas un bloc du site vu par ses clients.
//
// HONNÊTETÉ (règle absolue) : le réseau n'existe pas encore → on présente le
// MÉCANISME (« le réseau que vous rejoignez ») avec un exemple explicitement
// étiqueté « Exemple ». Aucun chiffre inventé, aucune opportunité présentée comme
// réelle. Phase 1 : aucune donnée partagée sans l'accord du client.
import { useEffect, useState } from "react";

export function ReseauSection({ ville, accent }: { ville: string; accent: string }) {
  const lieu = ville || "votre ville";
  const OPP = [
    { from: "Un salon de coiffure partenaire", txt: `a une cliente qui prépare un mariage et cherche vos prestations à ${lieu}.` },
    { from: "Un hôtel partenaire", txt: `accueille des clients qui cherchent vos services ce week-end.` },
    { from: "Un commerce partenaire", txt: `a un client qui vous recherche, tout près de chez vous.` },
  ];
  const [n, setN] = useState(0);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setN((v) => (v + 1) % OPP.length), 3600);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const opp = OPP[n];

  return (
    <section className="reso" style={{ ["--rz" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc .reso{position:relative;overflow:hidden;padding:30px 20px 34px;color:#EAF0FA;
            background:radial-gradient(120% 90% at 50% -20%,#1B2740,#0B0F1A 76%);}
          .mqc .reso .in{position:relative;z-index:1;max-width:460px;margin:0 auto;text-align:center;}
          .mqc .reso .badge{display:inline-flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;
            color:#BFD0F0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:6px 12px;}
          .mqc .reso .badge b{color:#7FE6C0;}
          .mqc .reso .k{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#8FA3C8;font-weight:700;margin-top:16px;}
          .mqc .reso .h{font-family:Georgia,serif;font-size:26px;font-weight:600;line-height:1.14;margin-top:8px;}
          .mqc .reso .h em{font-style:normal;color:#7FE6C0;}
          .mqc .reso .p{font-size:13.5px;line-height:1.6;color:#B8C4DC;margin-top:11px;}
          /* Carte d'opportunité entrante (exemple étiqueté) */
          .mqc .reso .opp{margin:20px auto 0;max-width:380px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:15px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 30px 60px -30px rgba(0,0,0,.7);text-align:left;}
          .mqc .reso .opp .tag{display:inline-block;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#0B0F1A;background:#7FE6C0;border-radius:6px;padding:3px 8px;font-weight:800;}
          .mqc .reso .opp .card{display:flex;gap:11px;align-items:flex-start;margin-top:11px;animation:rzIn .5s cubic-bezier(.2,.9,.3,1);}
          @keyframes rzIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
          .mqc .reso .opp .ic{width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;font-size:19px;background:linear-gradient(140deg,var(--rz),#0B0F1A);}
          .mqc .reso .opp .ot{display:block;font-size:13px;font-weight:800;color:#fff;}
          .mqc .reso .opp .om{display:block;font-size:12.5px;color:#C7D2E6;line-height:1.45;margin-top:2px;}
          .mqc .reso .opp .act{display:flex;gap:8px;margin-top:12px;}
          .mqc .reso .opp .act .yes{flex:1;text-align:center;background:#7FE6C0;color:#0B2A20;border-radius:10px;padding:9px;font-size:12.5px;font-weight:800;}
          .mqc .reso .opp .act .no{background:rgba(255,255,255,.08);color:#9FB0CE;border-radius:10px;padding:9px 14px;font-size:12.5px;font-weight:600;}
          .mqc .reso .dots{display:flex;gap:6px;justify-content:center;margin-top:12px;}
          .mqc .reso .dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.28);transition:.3s;}
          .mqc .reso .dots i.on{width:16px;border-radius:3px;background:#7FE6C0;}
          /* Comment ça marche (3 pas) */
          .mqc .reso .steps{display:flex;flex-direction:column;gap:9px;margin:22px auto 0;max-width:400px;text-align:left;}
          .mqc .reso .st{display:flex;gap:11px;align-items:center;font-size:12.5px;color:#C7D2E6;line-height:1.4;}
          .mqc .reso .st .no2{width:24px;height:24px;flex:none;border-radius:8px;background:rgba(127,230,192,.16);color:#7FE6C0;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;}
          .mqc .reso .cta{margin-top:22px;background:#fff;color:#0B0F1A;border:none;border-radius:13px;padding:15px 24px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 16px 34px -14px rgba(0,0,0,.6);}
          .mqc .reso .done{margin-top:22px;background:rgba(127,230,192,.12);border:1px solid rgba(127,230,192,.3);border-radius:15px;padding:18px;color:#DFF6EC;font-size:14px;line-height:1.5;animation:rzIn .4s ease;}
          .mqc .reso .done b{color:#fff;}
          .mqc .reso .note{font-size:11px;color:#8296B6;margin-top:14px;line-height:1.5;}
          @media (prefers-reduced-motion:reduce){.mqc .reso .opp .card{animation:none;}}
          @media (min-width:860px){.mqc .reso{padding:56px 24px;} .mqc .reso .h{font-size:34px;}}
          `,
        }}
      />
      <div className="in">
        <span className="badge">Côté pro · aperçu · <b>Nouveau</b></span>
        <div className="k">Le réseau des commerçants de {lieu}</div>
        <div className="h">Les autres commerces vous <em>envoient des clients.</em></div>
        <div className="p">
          Vous rejoignez le réseau local. Quand le client d&apos;un commerce <b>partenaire (non concurrent)</b> a besoin
          de vos services, son assistant vous le recommande — au bon moment.
        </div>

        <div className="opp" aria-live="polite">
          <span className="tag">Exemple · voici ce que vous recevez</span>
          <div className="card" key={n}>
            <span className="ic">🤝</span>
            <span>
              <span className="ot">Nouvelle opportunité</span>
              <span className="om"><b>{opp.from}</b> {opp.txt} <b>Souhaitez-vous proposer un créneau&nbsp;?</b></span>
            </span>
          </div>
          <div className="act">
            <span className="yes">✓ Proposer un créneau</span>
            <span className="no">Plus tard</span>
          </div>
        </div>
        <div className="dots" aria-hidden="true">{OPP.map((_, i) => <i key={i} className={i === n ? "on" : ""} />)}</div>

        <div className="steps">
          <div className="st"><span className="no2">1</span> Un client exprime un besoin chez un commerce partenaire.</div>
          <div className="st"><span className="no2">2</span> Son assistant repère que ça vous concerne.</div>
          <div className="st"><span className="no2">3</span> Vous recevez l&apos;opportunité — vous proposez un créneau.</div>
        </div>

        {joined ? (
          <div className="done">✓ Parfait. Vous serez parmi les <b>premiers commerçants du réseau de {lieu}</b>. On construit votre cercle de partenaires (commerces non concurrents) avec vous.</div>
        ) : (
          <button className="cta" onClick={() => setJoined(true)}>🤝 Rejoindre le réseau de {lieu}</button>
        )}
        <div className="note">
          Le réseau se constitue commerce par commerce à {lieu}. <b>Aucune donnée n&apos;est partagée sans l&apos;accord du client</b> — il choisit s&apos;il veut être mis en relation. Vous choisissez vos partenaires.
        </div>
      </div>
    </section>
  );
}
