"use client";

// MES ANNONCES EN COURS.
//
// Ce qui manquait : le commerçant publiait, et l'annonce lui échappait. Aucun
// moyen de voir ce qui tourne à son nom, de retirer ce qui n'a plus lieu d'être,
// ni de remettre pour demain ce qui a marché aujourd'hui. Il pouvait en avoir
// trois vivantes sans même savoir lesquelles.
//
// PROLONGER PLUTÔT QUE RETAPER : le commerçant qui a une place libre chaque
// jeudi ne devrait pas réécrire la même phrase toutes les semaines. C'est le
// geste le plus fréquent, il mérite un bouton.
import { useCallback, useEffect, useState } from "react";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { ilYA } from "@/lib/site-internet/collectif";

export type Annonce = {
  id: string;
  texte: string;
  photo: string | null;
  video: string | null;
  famille: string;
  publieLe: string;
  expireLe: string | null;
};

const FAMILLE: Record<string, string> = {
  place: "Place libre",
  offre: "Offre",
  evenement: "Événement",
  ville: "Ma ville",
};

/** Ce soir 23 h 59, demain soir, dans une semaine — en heure LOCALE, celle du
 *  commerçant. Le serveur ne connaît pas son fuseau. */
const finDeJournee = (dansNJours: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dansNJours);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
};

/** Une annonce terminée ou retirée — gardée pour pouvoir la reprendre. */
export type Passee = { id: string; texte: string; photo: string | null; famille: string; publieLe: string };

/** « 14 août » — assez pour se souvenir, sans l'heure à la seconde. */
const dateCourte = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export function ProAnnonces({ slug, token, ville }: { slug: string; token: string; ville?: string }) {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [historique, setHistorique] = useState<Passee[]>([]);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [err, setErr] = useState("");

  const appeler = useCallback(
    async (body: Record<string, unknown>) => {
      const r = await fetch("/api/site-internet/pro/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, ...body }),
      });
      const j = (await r.json().catch(() => ({}))) as { annonces?: Annonce[]; historique?: Passee[]; error?: string };
      if (!r.ok) throw new Error(j.error || "Action impossible.");
      return j;
    },
    [slug, token]
  );

  /** Ranger ce que la route a renvoyé. Séparé de l'appel : un `appeler` qui
   *  poserait lui-même l'état se lirait comme un `setState` synchrone depuis
   *  un effet, et déclencherait des rendus en cascade. */
  const ranger = useCallback((j: { annonces?: Annonce[]; historique?: Passee[] }) => {
    if (Array.isArray(j.annonces)) setAnnonces(j.annonces);
    if (Array.isArray(j.historique)) setHistorique(j.historique);
  }, []);

  const relire = useCallback(
    () =>
      appeler({ action: "annonces" })
        .then(ranger)
        .catch(() => {
          /* la liste reste telle quelle, l'écran le dit */
        })
        .then(() => setCharge(true)),
    [appeler, ranger]
  );

  useEffect(() => {
    let vivant = true;
    appeler({ action: "annonces" })
      .then((j) => {
        if (vivant) ranger(j);
      })
      .catch(() => {
        /* la liste reste vide, l'écran le dit */
      })
      .then(() => {
        if (vivant) setCharge(true);
      });
    return () => {
      vivant = false;
    };
  }, [appeler, ranger]);

  // RELIRE EN S'OUVRANT. L'onglet reste monté en permanence : sans ça, sa liste
  // datait du chargement de la page. Le commerçant publiait une annonce, venait
  // ici, et ne la trouvait pas — il la croyait perdue alors qu'elle était en
  // ligne.
  useEffect(() => {
    const vu = (e: Event) => {
      if ((e as CustomEvent).detail === "annonces") void relire();
    };
    window.addEventListener("pro-tab-shown", vu as EventListener);
    return () => window.removeEventListener("pro-tab-shown", vu as EventListener);
  }, [relire]);

  const agir = async (id: string, body: Record<string, unknown>) => {
    setOccupe(id);
    setErr("");
    try {
      ranger(await appeler({ ...body, id }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setOccupe("");
    }
  };

  return (
    <div className="pann">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pann .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:800;}
          .pro .pann .sub{font-size:13px;color:var(--soft);margin-top:5px;line-height:1.5;}
          .pro .pann .a{border:1px solid var(--hair);border-radius:15px;background:var(--paper);
            padding:13px 14px;margin-top:11px;}
          .pro .pann .a .top{display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:800;flex-wrap:wrap;}
          .pro .pann .a .fam{background:#E6F7F1;color:#0A6B48;border-radius:9px;padding:3px 8px;font-size:9px;text-transform:uppercase;letter-spacing:.05em;}
          .pro .pann .a .quand{color:var(--faint);font-weight:600;}
          .pro .pann .a .fin{color:#B4552F;}
          .pro .pann .a .tx{font-size:14px;color:var(--ink);line-height:1.45;margin:9px 0 0;font-weight:600;}
          .pro .pann .a .vig{margin-top:10px;height:96px;border-radius:11px;background-size:cover;background-position:center;background-color:#EFEDE6;position:relative;}
          .pro .pann .a .vig .cam{position:absolute;left:8px;bottom:8px;background:rgba(20,32,26,.72);color:#fff;
            border-radius:9px;font-size:10px;font-weight:700;padding:3px 8px;}
          .pro .pann .a .acts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
          .pro .pann .a button{border-radius:19px;padding:9px 14px;font-size:12.5px;font-weight:800;
            cursor:pointer;font-family:inherit;border:1px solid var(--hair);background:#fff;color:var(--ink);}
          /* « pri » et non « pro » : la page entière porte la classe .pro, qui
             vaut min-height:100vh. Un bouton nommé « pro » héritait donc de la
             hauteur de l'écran — mesuré à 1200 px — et ses voisins s'étiraient
             avec lui. Aucune accolade inverse ici : ce bloc vit dans un gabarit
             de chaîne, une seule suffirait à le couper en deux. */
          .pro .pann .a button.pri{background:#00926E;border-color:transparent;color:#fff;}
          .pro .pann .a button.ret{color:#C0442A;}
          .pro .pann .a button:disabled{opacity:.55;cursor:default;}
          .pro .pann .vide{margin-top:12px;border:1px dashed var(--hair);border-radius:15px;padding:20px;
            text-align:center;font-size:13px;color:var(--soft);line-height:1.6;}
          .pro .pann .err{margin-top:10px;background:#FBE9E4;color:#C0442A;border-radius:11px;padding:10px 12px;font-size:12.5px;font-weight:700;}
          /* Aller voir le résultat pour de vrai, aux deux endroits où il paraît. */
          .pro .pann .a .voir{display:flex;gap:12px;margin-top:9px;flex-wrap:wrap;}
          .pro .pann .a .voir a{font-size:12px;font-weight:700;color:var(--violet);text-decoration:none;}
          /* ── Mes annonces passées : leur propre espace, sous les vivantes ── */
          .pro .pann .hist{margin-top:26px;padding-top:18px;border-top:1px solid var(--hair);}
          .pro .pann .hist-l{margin-top:10px;display:flex;flex-direction:column;gap:7px;}
          .pro .pann .hist-i{display:flex;align-items:center;gap:10px;text-align:left;width:100%;
            border:1px solid var(--hair);background:var(--paper);border-radius:13px;padding:11px 12px;
            cursor:pointer;font-family:inherit;color:var(--ink);}
          .pro .pann .hist-t{flex:1;min-width:0;font-size:13px;line-height:1.4;overflow:hidden;
            text-overflow:ellipsis;white-space:nowrap;}
          .pro .pann .hist-d{flex:none;font-size:11px;color:var(--faint);font-weight:700;}
          .pro .pann .hist-i:active{transform:translateY(1px);}
          `,
        }}
      />

      <div className="k">Mes annonces en cours</div>
      <div className="sub">
        Ce que vos client·es voient en ce moment — sur votre site et dans le fil de votre ville.
        Vous pouvez en avoir trois à la fois.
      </div>

      {err ? <div className="err">{err}</div> : null}

      {annonces.map((a) => {
        const fin = echeanceCourte(a.expireLe);
        return (
          <div className="a" key={a.id}>
            <div className="top">
              <span className="fam">{FAMILLE[a.famille] ?? a.famille}</span>
              <span className="quand">{ilYA(a.publieLe)}</span>
              {/* Une annonce sans échéance se retire d'elle-même au bout de trois
                  jours : le dire évite de croire qu'elle tient indéfiniment. */}
              <span className="fin">{fin || "sans date de fin · 3 jours"}</span>
            </div>
            <p className="tx">{a.texte}</p>
            {(a.photo || a.video) && (
              <div className="vig" style={a.photo ? { backgroundImage: `url(${JSON.stringify(a.photo)})` } : undefined}>
                {a.video ? <span className="cam">🎬 vidéo</span> : null}
              </div>
            )}
            {/* Voir le résultat pour de vrai. Ces liens vivaient à la fin du
                parcours de création : ils appartiennent à l'annonce, pas au
                geste de l'écrire. */}
            <div className="voir">
              <a href={`/site-internet/apercu/${slug}`} target="_blank" rel="noreferrer">👁 Sur mon site ↗</a>
              {ville && <a href={`/ville/${ville}`} target="_blank" rel="noreferrer">📍 Dans Le Direct ↗</a>}
            </div>
            <div className="acts">
              <button
                type="button"
                className="pri"
                disabled={occupe === a.id}
                onClick={() => agir(a.id, { action: "prolonger", until: finDeJournee(0) })}
              >
                Jusqu&apos;à ce soir
              </button>
              <button
                type="button"
                disabled={occupe === a.id}
                onClick={() => agir(a.id, { action: "prolonger", until: finDeJournee(1) })}
              >
                Remettre demain
              </button>
              <button
                type="button"
                className="ret"
                disabled={occupe === a.id}
                onClick={() => agir(a.id, { action: "retirer_annonce" })}
              >
                Retirer
              </button>
            </div>
          </div>
        );
      })}

      {charge && annonces.length === 0 && (
        <div className="vide">
          Aucune annonce en ce moment.
          <br />
          Publiez-en une depuis « Remplir un créneau » ou « Annoncer une offre » — elle apparaîtra ici.
        </div>
      )}

      {/* MES ANNONCES PASSÉES — ici, et plus au milieu du parcours de création.
          Elles y étaient repliées derrière un bouton, sous l'écran de choix
          d'action : au moment d'écrire quelque chose de nouveau, on ne cherche
          pas dans ses archives. Elles ont leur place ici, à côté de ce qui
          tourne — c'est la même question, « qu'est-ce que j'ai publié ». */}
      {historique.length > 0 && (
        <div className="hist">
          <div className="k">Mes annonces passées</div>
          <div className="sub">
            Terminées ou retirées. Touchez-en une pour la reprendre&nbsp;: le texte repart dans une nouvelle
            annonce, vous n&apos;avez qu&apos;à choisir sa nouvelle heure.
          </div>
          <div className="hist-l">
            {historique.map((h) => (
              <button
                type="button"
                key={h.id}
                className="hist-i"
                onClick={() => {
                  // Le texte part D'ABORD, l'onglet bascule ensuite : l'ordre
                  // inverse ferait basculer sur un formulaire encore vide.
                  window.dispatchEvent(new CustomEvent("pro-reprendre-annonce", { detail: h.texte }));
                  window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: "annonce" }));
                }}
              >
                <span className="hist-t">{h.texte}</span>
                <span className="hist-d">{dateCourte(h.publieLe)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
