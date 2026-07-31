"use client";

// Espace Pro — « Ma liste de diffusion WhatsApp ».
//
// Le trou constaté : on donnait au commerçant une liste de clients et un bouton
// « copier », sans lui dire comment on constitue une liste de diffusion — ni
// qu'une diffusion WhatsApp n'arrive QUE chez les gens qui ont enregistré son
// numéro. Sans ça, il colle son message dans le vide et conclut que ça ne marche
// pas.
//
// RISQUE RÉEL À COUVRIR : écrire à des gens qui n'ont jamais eu d'échange avec
// vous est le premier motif de signalement, et le signalement est ce qui fait
// bannir un compte WhatsApp — pas le volume seul. Le parcours est donc construit
// pour que le PREMIER contact soit toujours en tête-à-tête, jamais en diffusion,
// et de préférence à l'initiative du client (QR → il écrit le premier).
//
// Rien n'est envoyé par nos serveurs : chaque bouton ouvre SON WhatsApp.
import { useEffect, useMemo, useState } from "react";
import { toWaDigits } from "@/lib/site-internet/phone";

type Contact = {
  id: string;
  prenom: string | null;
  phone_e164: string;
  last_contacted_at: string | null;
  unsub_token: string;
  source?: string | null;
  wa_intro_at?: string | null;
};

/** Nombre de premiers contacts par jour au-delà duquel on alerte franchement. */
const RYTHME_JOUR = 20;

export function ProDiffusion({
  slug,
  token,
  nom,
  promesse,
  hasWa,
}: {
  slug: string;
  token: string;
  nom: string;
  promesse: string;
  hasWa: boolean; // a-t-on son numéro WhatsApp (pour générer l'affiche QR) ?
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call({ action: "list" });
        if (!cancelled && Array.isArray(j.contacts)) setContacts(j.contacts as Contact[]);
      } catch {
        /* best-effort */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  // Un contact est « présenté » dès qu'il y a eu un échange : message de
  // présentation envoyé, ou n'importe quel envoi WhatsApp déjà ouvert pour lui.
  // Le commerçant peut aussi marquer à la main ceux avec qui il discute déjà —
  // nous ne voyons pas ses conversations, lui seul le sait.
  const aPresenter = useMemo(
    () => contacts.filter((c) => !(c.wa_intro_at || c.last_contacted_at || done[c.id])),
    [contacts, done]
  );
  const nbPresentes = contacts.length - aPresenter.length;

  // Message de PRÉSENTATION — pas une promo. Il a un seul but : obtenir que la
  // personne enregistre le numéro, sans quoi aucune diffusion ne lui parviendra.
  // Et il porte sa porte de sortie, dès le premier mot.
  const introText = (c: Contact) => {
    const bonjour = c.prenom ? `Bonjour ${c.prenom},` : "Bonjour,";
    return (
      `${bonjour} c'est ${nom} 🙂\n\n` +
      `Vous m'avez laissé votre numéro pour être prévenu·e : ${promesse.replace(/^Être prévenu·e /, "")}\n\n` +
      `Pensez à enregistrer mon numéro dans vos contacts — sans ça, WhatsApp ne vous transmettra pas mes messages.\n\n` +
      `Répondez STOP quand vous voulez, je vous retire aussitôt.`
    );
  };

  /** Marque le contact comme présenté (sans rien envoyer). */
  const markIntro = (c: Contact) => {
    setDone((d) => ({ ...d, [c.id]: true }));
    try {
      call({ action: "intro", id: c.id });
    } catch {
      /* best-effort */
    }
  };

  const sendIntro = (c: Contact) => {
    const href = `https://wa.me/${toWaDigits(c.phone_e164)}?text=${encodeURIComponent(introText(c))}`;
    markIntro(c);
    window.location.href = href;
  };

  const afficheUrl = `/site-internet/pro/${slug}/affiche?k=${encodeURIComponent(token)}&type=whatsapp`;
  const aujourdhui = Math.min(aPresenter.length, RYTHME_JOUR);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pdif .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .pdif .a-sub{font-size:13px;color:var(--soft);margin-top:5px;line-height:1.5;}
          .pro .pdif .a-sub b{color:var(--ink);font-weight:700;}
          .pro .pdif .step{margin-top:14px;border:1px solid var(--hair);border-radius:16px;background:#fff;
            padding:15px 15px 14px;box-shadow:0 10px 26px -22px rgba(18,20,26,.4);}
          .pro .pdif .step .sn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;
            background:var(--violet);color:#fff;font-size:12px;font-weight:800;margin-right:8px;vertical-align:1px;}
          .pro .pdif .step.ok .sn{background:#12A65C;}
          .pro .pdif .step .sh{font-size:15px;font-weight:800;letter-spacing:-.01em;}
          .pro .pdif .step .sp{font-size:13px;color:var(--soft);line-height:1.55;margin-top:8px;}
          .pro .pdif .step .sp b{color:var(--ink);font-weight:700;}
          .pro .pdif .say{margin-top:10px;border-left:3px solid var(--violet);background:#F7F5FE;border-radius:0 10px 10px 0;
            padding:10px 12px;font-size:13px;line-height:1.5;color:var(--ink);font-style:italic;}
          .pro .pdif .go{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;text-decoration:none;
            border:none;width:100%;background:var(--ink);color:#fff;border-radius:12px;padding:13px;font-size:13.5px;font-weight:700;
            font-family:inherit;cursor:pointer;}
          .pro .pdif .go.ghost{background:#fff;color:var(--ink);border:1px solid var(--hair);}
          .pro .pdif .go:active{transform:translateY(1px);}
          .pro .pdif ol{margin:10px 0 0;padding-left:19px;font-size:13px;line-height:1.75;color:var(--soft);}
          .pro .pdif ol b{color:var(--ink);font-weight:700;}
          .pro .pdif .prog{display:flex;align-items:center;gap:9px;margin-top:10px;font-size:12.5px;font-weight:700;color:var(--soft);}
          .pro .pdif .prog .bar{flex:1;height:7px;border-radius:999px;background:#EBE7DD;overflow:hidden;}
          .pro .pdif .prog .bar i{display:block;height:100%;background:var(--grad);border-radius:999px;}
          .pro .pdif .who{display:flex;flex-direction:column;gap:7px;margin-top:12px;}
          .pro .pdif .wrow{display:flex;align-items:center;gap:8px;border:1px solid var(--hair);border-radius:12px;padding:8px 8px 8px 12px;}
          .pro .pdif .wn{flex:1;min-width:0;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .pro .pdif .wsend{flex:none;display:inline-flex;align-items:center;gap:7px;border:1px solid #CFE6C2;background:#EAF4E4;color:#1B7A3E;
            border-radius:10px;padding:8px 11px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .pdif .wsend:active{transform:scale(.97);}
          .pro .pdif .wsend svg{width:14px;height:14px;}
          .pro .pdif .wskip{flex:none;border:1px solid var(--hair);background:#fff;color:var(--faint);border-radius:10px;
            padding:8px 10px;font-size:13px;font-weight:800;font-family:inherit;cursor:pointer;line-height:1;}
          .pro .pdif .wskip:active{transform:scale(.94);}
          .pro .pdif .pace{margin-top:11px;font-size:12px;line-height:1.5;color:#8A6A12;background:#FFF7E9;border:1px solid #F6E4BD;
            border-radius:11px;padding:10px 12px;}
          .pro .pdif .allok{margin-top:11px;font-size:12.5px;line-height:1.5;color:#1B7A3E;background:#F1F8F3;border:1px solid #D6EBDD;
            border-radius:11px;padding:10px 12px;font-weight:600;}
          .pro .pdif .ban{margin-top:16px;border:1px solid #F2C9C9;background:#FDF4F4;border-radius:16px;padding:15px;}
          .pro .pdif .ban .bh{font-size:14px;font-weight:800;color:#A63232;}
          .pro .pdif .ban ul{margin:10px 0 0;padding-left:18px;font-size:12.5px;line-height:1.7;color:#6E4141;}
          .pro .pdif .ban ul b{color:#A63232;font-weight:800;}
          .pro .pdif .ban .why{margin-top:10px;font-size:11.5px;line-height:1.5;color:#8C6060;}
          `,
        }}
      />
      <div className="pdif">
        <div className="a-title">📢 Ma liste de diffusion WhatsApp</div>
        <div className="a-sub">
          Une diffusion WhatsApp n&apos;arrive <b>que chez les gens qui ont enregistré votre numéro</b>. C&apos;est
          une règle de WhatsApp, pas un réglage. Voilà comment y arriver — sans risquer votre compte.
        </div>

        {/* ── 1 · Se faire enregistrer : le seul geste qui débloque tout ── */}
        <div className="step">
          <div className="sh"><span className="sn">1</span>Faites-vous enregistrer</div>
          <div className="sp">
            Le plus sûr&nbsp;: que ce soit <b>le client qui vous écrive en premier</b>. Une affiche à votre caisse,
            il scanne, WhatsApp s&apos;ouvre déjà sur votre conversation. À partir de là vous pouvez lui répondre
            librement, et il vous a dans ses contacts.
          </div>
          <div className="say">
            « Scannez, ça m&apos;envoie un message — comme ça je peux vous prévenir quand il y a du nouveau. »
          </div>
          {hasWa ? (
            <a className="go" href={afficheUrl} target="_blank" rel="noreferrer">
              🖨️ Mon affiche WhatsApp à imprimer <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <div className="pace">
              Nous n&apos;avons pas encore votre numéro WhatsApp&nbsp;: sans lui, impossible de générer l&apos;affiche.
              Envoyez-le nous et elle est prête dans la foulée.
            </div>
          )}
        </div>

        {/* ── 2 · Le premier message se fait en tête-à-tête, jamais en diffusion ── */}
        <div className={`step${loaded && aPresenter.length === 0 && contacts.length > 0 ? " ok" : ""}`}>
          <div className="sh"><span className="sn">2</span>Présentez-vous, un par un</div>
          <div className="sp">
            Pour les clients déjà dans votre liste, <b>le premier message se fait en tête-à-tête</b> — jamais en
            diffusion. Il ne vend rien&nbsp;: il demande simplement de vous enregistrer, et donne la porte de sortie.
          </div>

          {contacts.length > 0 && (
            <div className="prog">
              <span>{nbPresentes}/{contacts.length}</span>
              <span className="bar">
                <i style={{ width: `${contacts.length ? Math.round((nbPresentes / contacts.length) * 100) : 0}%` }} />
              </span>
              <span>présentés</span>
            </div>
          )}

          {loaded && contacts.length === 0 && (
            <div className="sp" style={{ marginTop: 10 }}>
              Aucun client dans votre liste pour l&apos;instant. Ajoutez-en dans <b>Ma liste de clients</b>, ou
              laissez-les s&apos;inscrire eux-mêmes depuis votre site.
            </div>
          )}

          {aPresenter.length > 0 && (
            <>
              <div className="who">
                {aPresenter.slice(0, RYTHME_JOUR).map((c) => (
                  <div className="wrow" key={c.id}>
                    <span className="wn">{c.prenom || "Client"}</span>
                    <button type="button" className="wsend" onClick={() => sendIntro(c)}>
                      <svg viewBox="0 0 24 24" fill="#1B7A3E"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                      Me présenter
                    </button>
                    <button
                      type="button"
                      className="wskip"
                      onClick={() => markIntro(c)}
                      title="Nous discutons déjà sur WhatsApp"
                      aria-label={`Déjà en conversation avec ${c.prenom || "ce client"}`}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
              <div className="sp" style={{ marginTop: 9, fontSize: 12 }}>
                Déjà en conversation avec quelqu&apos;un&nbsp;? Touchez le <b>✓</b> — inutile de vous présenter deux fois.
              </div>
              {aPresenter.length > RYTHME_JOUR ? (
                <div className="pace">
                  ⏳ {aPresenter.length} personnes restent à présenter. Faites-en <b>{aujourdhui} aujourd&apos;hui</b>,
                  et le reste les jours suivants. Envoyer des dizaines de premiers messages d&apos;un coup est
                  exactement ce que WhatsApp repère.
                </div>
              ) : (
                <div className="pace">
                  ⏳ Étalez sur la journée plutôt que tout d&apos;un coup — et arrêtez-vous si quelqu&apos;un ne
                  répond pas&nbsp;: on ne relance pas un premier message.
                </div>
              )}
            </>
          )}

          {loaded && contacts.length > 0 && aPresenter.length === 0 && (
            <div className="allok">✓ Tout le monde est présenté. Votre liste de diffusion peut être créée.</div>
          )}
        </div>

        {/* ── 3 · La liste elle-même, dans WhatsApp (une seule fois) ── */}
        <div className="step">
          <div className="sh"><span className="sn">3</span>Créez la liste dans WhatsApp</div>
          <div className="sp">
            Une seule fois. Ensuite, chaque annonce se colle en un geste et part à tout le monde,
            <b> sans que personne ne voie les autres numéros</b>.
          </div>
          <ol>
            <li>Ouvrez WhatsApp → <b>Nouvelle discussion</b> → <b>Nouvelle diffusion</b>.</li>
            <li>Cochez vos clients, nommez la liste (ex.&nbsp;: «&nbsp;Mes client·es&nbsp;»).</li>
            <li>Depuis <b>Faire une annonce</b>, touchez «&nbsp;Copier&nbsp;», collez dans la liste, envoyez.</li>
          </ol>
          <div className="sp" style={{ marginTop: 10 }}>
            Si un client vous dit ne rien recevoir&nbsp;: il n&apos;a pas votre numéro enregistré. C&apos;est la
            seule cause possible.
          </div>
        </div>

        {/* ── Le garde-fou. Concret, pas moralisateur : ce sont des règles d'usage. ── */}
        <div className="ban">
          <div className="bh">🛡️ Ne pas se faire bloquer par WhatsApp</div>
          <ul>
            <li><b>N&apos;écrivez jamais</b> à quelqu&apos;un qui ne vous a pas donné son numéro. C&apos;est la règle qui compte plus que toutes les autres.</li>
            <li>Le <b>premier message en tête-à-tête</b>, jamais en diffusion. Une diffusion à un inconnu se signale en deux touches.</li>
            <li><b>Étalez</b>&nbsp;: une vingtaine de nouveaux contacts par jour, pas deux cents d&apos;un coup.</li>
            <li>Toujours une <b>porte de sortie</b> («&nbsp;Répondez STOP&nbsp;») — elle est déjà dans nos messages.</li>
            <li>Quelqu&apos;un demande d&apos;arrêter&nbsp;? <b>Retirez-le tout de suite</b> (🗑 dans votre liste de clients).</li>
            <li><b>Jamais de liste achetée</b> ou récupérée ailleurs.</li>
            <li>Utilisez <b>WhatsApp Business</b> (gratuit) plutôt que votre compte personnel&nbsp;: c&apos;est le compte prévu pour ça.</li>
          </ul>
          <div className="why">
            Ce qui fait bannir un numéro, ce n&apos;est pas le volume&nbsp;: ce sont les signalements et les blocages.
            Des gens qui vous connaissent et qui vous ont enregistré ne vous signalent pas.
          </div>
        </div>
      </div>
    </>
  );
}
