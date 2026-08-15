"use client";

// « OÙ ARRIVENT MES RÉSERVATIONS ? »
//
// Toute la mécanique du Direct finit sur un message WhatsApp que l'habitant
// envoie au commerçant. Ce numéro était pourtant capté une seule fois, en
// passant, dans le formulaire d'après-démo — et jamais remontré. Un commerçant
// qui change de téléphone perdait ses réservations sans qu'aucun écran ne le
// lui dise.
//
// DEUX RÉGLAGES, ET PAS UN DE PLUS :
//   • son numéro ;
//   • pendant ses congés, celui de la personne qui tient la boutique.
//
// LE REMPLACEMENT S'ÉTEINT TOUT SEUL, à la date de retour. Un bouton « je suis
// rentré » resterait non pressé pendant des semaines : on rentre de vacances
// avec autre chose en tête qu'un réglage.
import { useCallback, useEffect, useState } from "react";
import { frLisible } from "@/lib/site-internet/phone";
import type { Relais } from "@/lib/site-internet/pro-phone";

type Etat = { numero: string; relais: Relais | null; actif: string; jour: string };

/** « 2026-08-30 » → « 30 août ». Une date lue, pas déchiffrée. */
function dateLisible(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return iso;
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${j} ${mois[m - 1] ?? ""}`.trim();
}

export function ProWhatsapp({ slug, token }: { slug: string; token: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [charge, setCharge] = useState(false);
  const [vue, setVue] = useState<"" | "numero" | "conges">("");
  const [numero, setNumero] = useState("");
  const [qui, setQui] = useState("");
  const [jusquau, setJusquau] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [err, setErr] = useState("");

  const appeler = useCallback(
    async (corps: Record<string, unknown>) => {
      const r = await fetch("/api/site-internet/pro/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, ...corps }),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Enregistrement impossible.");
      return j as unknown as Etat;
    },
    [slug, token]
  );

  useEffect(() => {
    let vivant = true;
    appeler({ action: "get" })
      .then((e) => {
        if (!vivant) return;
        setEtat(e);
      })
      .catch(() => {
        /* indisponible : le bloc se tait plutôt que d'afficher un faux réglage */
      })
      .finally(() => vivant && setCharge(true));
    return () => {
      vivant = false;
    };
  }, [appeler]);

  const envoyer = async (corps: Record<string, unknown>) => {
    if (envoi) return;
    setEnvoi(true);
    setErr("");
    try {
      setEtat(await appeler(corps));
      setVue("");
      setNumero("");
      setQui("");
      setJusquau("");
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setEnvoi(false);
    }
  };

  // Tant que la lecture n'a pas répondu, on n'affiche NI « aucun numéro » NI un
  // numéro : les deux mentiraient pendant une seconde, sur le sujet le plus
  // sensible de son espace.
  if (!charge || !etat) return null;

  const relais = etat.relais && etat.jour <= etat.relais.jusquau ? etat.relais : null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pwa{margin-bottom:16px;border:1px solid var(--hair);border-radius:18px;background:var(--paper);
            padding:15px 16px;box-shadow:0 12px 32px -24px rgba(18,20,26,.3);}
          .pro .pwa .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:800;}
          /* Le numéro se lit d'un coup d'œil : c'est le seul but du bloc. */
          .pro .pwa .num{display:flex;align-items:center;gap:9px;margin-top:8px;font-size:20px;font-weight:800;
            letter-spacing:.01em;font-variant-numeric:tabular-nums;}
          .pro .pwa .num .w{font-size:19px;}
          .pro .pwa .s{font-size:12.5px;color:var(--soft);line-height:1.45;margin-top:6px;}
          /* Congés en cours : un état, pas une alerte. Vert WhatsApp, sobre. */
          .pro .pwa .conge{margin-top:11px;background:#E9F8F1;border:1px solid #BFE7D5;border-radius:13px;
            padding:11px 13px;font-size:13px;line-height:1.45;color:#0C5B3C;}
          .pro .pwa .conge b{font-weight:800;}
          /* Aucun numéro : là, c'est bien une alerte — rien n'arrive nulle part. */
          .pro .pwa .rien{margin-top:10px;background:#FDECE6;border:1px solid #F3CDBF;border-radius:13px;
            padding:11px 13px;font-size:13px;line-height:1.45;color:#8A3D26;}
          .pro .pwa .row{display:flex;gap:9px;margin-top:12px;flex-wrap:wrap;}
          .pro .pwa button{border-radius:11px;padding:11px 15px;font-size:13px;font-weight:800;font-family:inherit;
            cursor:pointer;border:1px solid var(--hair);background:#fff;color:var(--ink);}
          .pro .pwa button.go{background:linear-gradient(135deg,#00C896,#00926E);border-color:transparent;color:#fff;}
          .pro .pwa button:disabled{opacity:.55;cursor:default;}
          .pro .pwa label{display:block;font-size:12px;font-weight:700;color:var(--soft);margin-top:12px;}
          .pro .pwa input{width:100%;margin-top:6px;border:1px solid var(--hair);border-radius:12px;padding:12px 14px;
            font-size:16px;font-family:inherit;background:#fff;}
          .pro .pwa .err{margin-top:10px;font-size:12.5px;line-height:1.45;color:#8A3D26;background:#FDECE6;
            border:1px solid #F3CDBF;border-radius:11px;padding:10px 12px;}
          `,
        }}
      />
      <div className="pwa">
        <div className="k">Où arrivent vos réservations</div>

        {etat.actif ? (
          <div className="num">
            <span className="w" aria-hidden="true">💬</span>
            <span>{frLisible(etat.actif)}</span>
          </div>
        ) : (
          <div className="rien">
            <b>Nous n&apos;avons aucun numéro WhatsApp pour vous.</b> Les habitants qui réservent dans Le Direct
            n&apos;ont donc aucun moyen de vous prévenir&nbsp;: leur bouton de confirmation n&apos;ouvre rien.
            Renseignez-le, c&apos;est le réglage le plus important de votre espace.
          </div>
        )}

        {relais ? (
          <div className="conge">
            En ce moment, vos réservations arrivent sur le WhatsApp{relais.qui ? <> de <b>{relais.qui}</b></> : <> de votre remplaçant·e</>},
            jusqu&apos;au <b>{dateLisible(relais.jusquau)}</b> inclus. Après cette date, elles reviennent sur le vôtre&nbsp;
            ({frLisible(etat.numero)}) — sans que vous ayez rien à faire.
          </div>
        ) : (
          etat.actif && (
            <div className="s">
              C&apos;est ce numéro qui reçoit les demandes envoyées depuis Le Direct, et celui qu&apos;ouvre le QR
              de votre affiche. Vérifiez qu&apos;il est bien à jour.
            </div>
          )
        )}

        {!vue && (
          <div className="row">
            <button type="button" className={etat.actif ? "" : "go"} onClick={() => { setNumero(etat.numero); setVue("numero"); setErr(""); }}>
              {etat.numero ? "Changer mon numéro" : "Renseigner mon numéro"}
            </button>
            {relais ? (
              <button type="button" onClick={() => void envoyer({ action: "relais", numero: null })} disabled={envoi}>
                Je suis rentré·e
              </button>
            ) : (
              etat.numero && (
                <button type="button" onClick={() => { setNumero(""); setVue("conges"); setErr(""); }}>
                  Je pars en congés
                </button>
              )
            )}
          </div>
        )}

        {vue === "numero" && (
          <>
            <label htmlFor="pwa-n">Votre mobile WhatsApp</label>
            <input
              id="pwa-n"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="06 12 34 56 78"
            />
            <div className="s">Un mobile français&nbsp;: c&apos;est le seul numéro qui porte un compte WhatsApp.</div>
            {err && <div className="err">{err}</div>}
            <div className="row">
              <button type="button" className="go" onClick={() => void envoyer({ action: "set", numero })} disabled={envoi || !numero.trim()}>
                {envoi ? "Un instant…" : "Enregistrer"}
              </button>
              <button type="button" onClick={() => { setVue(""); setErr(""); }}>Annuler</button>
            </div>
          </>
        )}

        {vue === "conges" && (
          <>
            <div className="s" style={{ marginTop: 12 }}>
              Pendant votre absence, les réservations arriveront sur le WhatsApp de la personne qui tient la
              boutique. Votre numéro n&apos;est pas effacé&nbsp;: il reprend seul à la date de votre retour.
            </div>
            <label htmlFor="pwa-q">Qui vous remplace&nbsp;?</label>
            <input id="pwa-q" value={qui} onChange={(e) => setQui(e.target.value.slice(0, 40))} placeholder="Julie" />
            <label htmlFor="pwa-r">Son mobile WhatsApp</label>
            <input id="pwa-r" type="tel" inputMode="tel" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="06 12 34 56 78" />
            <label htmlFor="pwa-d">Jusqu&apos;à quand (dernier jour inclus)</label>
            {/* `min` vient du serveur, pas de l'horloge du téléphone : la journée
                se compte à Paris, et un rendu ne doit pas lire l'heure. */}
            <input id="pwa-d" type="date" value={jusquau} min={etat.jour} onChange={(e) => setJusquau(e.target.value)} />
            {err && <div className="err">{err}</div>}
            <div className="row">
              <button
                type="button"
                className="go"
                onClick={() => void envoyer({ action: "relais", numero, qui, jusquau })}
                disabled={envoi || !numero.trim() || !jusquau}
              >
                {envoi ? "Un instant…" : "Activer le remplacement"}
              </button>
              <button type="button" onClick={() => { setVue(""); setErr(""); }}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
