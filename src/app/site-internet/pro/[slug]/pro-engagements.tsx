"use client";

// QUI VIENT — la contrepartie du code.
//
// L'habitant recevait « Code RR-8863 » et le commerçant ne pouvait le retrouver
// nulle part. Le code promettait donc un lien qui n'existait pas : quelqu'un se
// présentait en le récitant, et personne en face ne savait quoi en faire.
//
// Et quand un groupe se formait, l'écran habitant disait « vous serez prévenu
// dès que le groupe est complet » — une promesse que le commerçant ne pouvait
// pas tenir, faute d'avoir un seul contact.
//
// CE QUI EST AFFICHÉ EST CE QUE LA PERSONNE A BIEN VOULU LAISSER. Consulter Le
// Direct ne demande rien, s'engager non plus. Pas de ligne « inconnu », pas de
// champ vide qui ressemblerait à un dossier à compléter : un code seul suffit
// à l'accueil, le contact est un bonus.
import { useEffect, useState } from "react";

type Engagement = {
  campagneId: string;
  facon: string;
  type: string;
  titre: string;
  code: string;
  statut: string;
  prenom: string;
  telephone: string;
  email: string;
  le: string;
  gain: string;
};

type Reactions = { jenveux: number; jepassevoir: number; prefere: number; jysuis: number } | null;

const STATUT_LABEL: Record<string, string> = {
  engage: "Vient",
  confirme: "Confirmé",
  liste_attente: "En attente",
};

const ICONE: Record<string, string> = { simple: "🕐", cadeau: "🎁", express: "⚡", collectif: "👥" };

/** « 14 août, 12 h 30 ». Le jour ET l'heure : pour un express, l'heure est
 *  l'information ; pour un groupe, le jour suffit. On donne les deux. */
function quand(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ProEngagements({ slug, token }: { slug: string; token: string }) {
  const [liste, setListe] = useState<Engagement[]>([]);
  const [reactions, setReactions] = useState<Reactions>(null);
  const [charge, setCharge] = useState(false);
  const [tout, setTout] = useState(false);

  // La lecture est un ABONNEMENT à un système externe — c'est bien le rôle d'un
  // effet — et les états ne sont posés que dans la continuation, jamais dans le
  // corps de l'effet : un `setState` synchrone ici déclencherait des rendus en
  // cascade, et la règle `react-hooks/set-state-in-effect` le refuse.
  useEffect(() => {
    let vivant = true;
    fetch("/api/site-internet/pro/clik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, action: "engagements" }),
    })
      .then(async (r) => (r.ok ? ((await r.json().catch(() => ({}))) as Record<string, unknown>) : null))
      .then((j) => {
        if (!vivant || !j) return;
        if (Array.isArray(j.engagements)) setListe(j.engagements as Engagement[]);
        if (j.reactions && typeof j.reactions === "object") setReactions(j.reactions as Reactions);
      })
      .catch(() => {
        /* indisponible : le bloc ne s'affiche pas, rien n'est cassé */
      })
      .finally(() => vivant && setCharge(true));
    return () => {
      vivant = false;
    };
  }, [slug, token]);

  const rienDuTout = charge && !liste.length && (!reactions || Object.values(reactions).every((n) => !n));
  // Rien à montrer : le bloc n'existe pas. Un encart « 0 réservation » sur
  // l'accueil d'un commerçant qui démarre ne l'informe pas, il le décourage.
  if (!charge || rienDuTout) return null;

  const visibles = tout ? liste : liste.slice(0, 5);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .peng{margin-top:16px;border:1px solid var(--hair);border-radius:18px;background:var(--paper);
            padding:15px 16px;box-shadow:0 12px 32px -24px rgba(18,20,26,.3);}
          .pro .peng .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:800;}
          .pro .peng .s{font-size:12.5px;color:var(--soft);line-height:1.45;margin-top:5px;}
          /* CE QUE LES RÉACTIONS DEVIENNENT. C'est la réponse à « ça sert à
             quoi ? » : le geste ne s'adresse pas à l'habitant qui appuie, il
             s'adresse au commerce — et il fallait bien que le commerce le voie
             quelque part. */
          .pro .peng .rx{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
          .pro .peng .rx div{background:#F7F5EF;border-radius:12px;padding:10px 6px;text-align:center;}
          .pro .peng .rx b{display:block;font-size:19px;font-weight:850;font-variant-numeric:tabular-nums;line-height:1.1;}
          .pro .peng .rx span{display:block;font-size:9.5px;color:var(--soft);margin-top:3px;line-height:1.25;font-weight:600;}
          /* « J'y suis » est la seule preuve de VENUE réelle : c'est le chiffre
             qu'aucune autre plateforme ne peut lui donner. */
          .pro .peng .rx .fort{background:#E6F7F1;}
          .pro .peng .rx .fort b{color:#00714F;}
          .pro .peng .l{margin-top:13px;display:flex;flex-direction:column;gap:8px;}
          .pro .peng .e{border:1px solid var(--hair);border-radius:13px;padding:11px 12px;}
          .pro .peng .e .h{display:flex;align-items:center;gap:9px;}
          .pro .peng .e .ic{font-size:15px;flex:none;}
          .pro .peng .e .qui{flex:1;min-width:0;font-size:14px;font-weight:800;}
          .pro .peng .e .code{flex:none;font-size:13px;font-weight:800;letter-spacing:.05em;color:#00714F;
            background:#E6F7F1;border-radius:8px;padding:4px 9px;font-variant-numeric:tabular-nums;}
          .pro .peng .e .d{font-size:11.5px;color:var(--soft);margin-top:6px;line-height:1.45;}
          .pro .peng .e .tel{display:inline-block;margin-top:8px;font-size:13px;font-weight:800;
            text-decoration:none;color:var(--ink);border:1px solid var(--hair);border-radius:9px;padding:7px 11px;}
          .pro .peng .e .sans{margin-top:8px;font-size:11.5px;color:var(--faint);line-height:1.4;}
          .pro .peng .plus{margin-top:10px;width:100%;border:none;background:none;color:var(--violet);
            font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit;padding:4px;}
          `,
        }}
      />
      <div className="peng">
        <div className="k">Qui vient</div>
        <div className="s">
          Chacun se présentera avec son code. Vous n&apos;avez rien à cocher&nbsp;: la liste est là pour
          reconnaître la personne et pouvoir la joindre si besoin.
        </div>

        {reactions && (
          <div className="rx">
            <div><b>{reactions.jenveux}</b><span>😋 en veulent</span></div>
            <div><b>{reactions.jepassevoir}</b><span>👀 passent voir</span></div>
            <div><b>{reactions.prefere}</b><span>❤️ vous préfèrent</span></div>
            <div className="fort"><b>{reactions.jysuis}</b><span>📍 y sont allés</span></div>
          </div>
        )}

        {visibles.length > 0 && (
          <div className="l">
            {visibles.map((e) => (
              <div className="e" key={`${e.campagneId}-${e.code}`}>
                <div className="h">
                  <span className="ic" aria-hidden="true">{ICONE[e.type] ?? "🕐"}</span>
                  <span className="qui">{e.prenom || "Un habitant"}</span>
                  <span className="code">{e.code}</span>
                </div>
                <div className="d">
                  {STATUT_LABEL[e.statut] ?? e.statut} · {e.facon}
                  {e.titre ? ` · ${e.titre}` : ""}
                  {e.le ? ` · ${quand(e.le)}` : ""}
                  {e.gain ? ` · ${e.gain}` : ""}
                </div>
                {e.telephone ? (
                  <a className="tel" href={`tel:${e.telephone}`}>📞 {e.telephone}</a>
                ) : e.email ? (
                  <a className="tel" href={`mailto:${e.email}`}>✉️ {e.email}</a>
                ) : (
                  <div className="sans">
                    Pas de contact laissé — c&apos;est son choix. Le code suffit à l&apos;accueil.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {liste.length > 5 && (
          <button type="button" className="plus" onClick={() => setTout((v) => !v)}>
            {tout ? "Masquer" : `Voir les ${liste.length} personnes`}
          </button>
        )}
      </div>
    </>
  );
}
