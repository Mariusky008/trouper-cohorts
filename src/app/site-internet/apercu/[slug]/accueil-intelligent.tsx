"use client";

// Accueil intelligent — secrétariat automatique intégré dans la maquette.
// Phase 1 : parcours 100% à CHIPS (pas de saisie libre médicale → sûr par
// construction) qui réserve un vrai créneau de démo et notifie le vendeur.
// Vit dans le site : bulle flottante (toutes pages) + section « Prendre
// rendez-vous » (via [data-accueil-open]), ouverture en surimpression, sans
// quitter le site. Réglé par profil (C sobre santé encadrée / A chaleureux).
//
// Garde-fous codés en dur : se déclare automatique, qualification NON clinique
// (jamais de symptômes), consentement avant coordonnées, aucune donnée de santé,
// encart d'urgence permanent (15 / 3114 / 112) pour le profil « psychisme ».
import { useEffect, useMemo, useRef, useState } from "react";

type Profil = "A" | "B" | "C";
type FaqItem = { q: string; a: string };

type Confirmation = "reserve" | "rappel" | "devis" | "acompte";

type Props = {
  slug: string;
  profil: Profil;
  praticien: string;
  termePublic: string; // clients / patients
  accent: string;
  faq: FaqItem[];
  showUrgence: boolean; // encart urgence permanent (profil psychisme)
  confirmation?: Confirmation; // réserve un créneau, ou rappel/devis/acompte
  busyWord?: string; // « en séance » (soin) / « en intervention » (artisan)
};

type Who = "ai" | "me";
type Msg = { who: Who; text: string; urg?: boolean };
type Step = "home" | "qualif1" | "qualif2" | "qualif3" | "coord" | "slots" | "confirm" | "faq";

// Créneaux de démo réalistes calculés à partir d'aujourd'hui.
function upcomingSlots(): string[] {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const now = new Date();
  const out: { label: string }[] = [];
  const hours = ["9 h 00", "14 h 30", "18 h 30"];
  let d = 1;
  while (out.length < 3 && d < 12) {
    const date = new Date(now.getTime() + d * 86400000);
    const dow = date.getDay();
    if (dow !== 0) {
      const jour = days[dow];
      const h = hours[out.length % hours.length];
      const cap = jour.charAt(0).toUpperCase() + jour.slice(1);
      out.push({ label: `${cap} ${date.getDate()} · ${h}` });
    }
    d++;
  }
  return out.map((o) => o.label);
}

export function AccueilIntelligent({ slug, praticien, termePublic, accent, faq, showUrgence, confirmation = "reserve", busyWord = "en séance" }: Props) {
  const isReserve = confirmation === "reserve";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("home");
  const [thread, setThread] = useState<Msg[]>([]);
  const [pourQui, setPourQui] = useState("");
  const [premiere, setPremiere] = useState("");
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [consent, setConsent] = useState(false);
  const [slot, setSlot] = useState("");
  const [booking, setBooking] = useState(false);
  const [typing, setTyping] = useState(false);
  const [qInput, setQInput] = useState("");
  const [forceUrgence, setForceUrgence] = useState(false);
  const [notifPhone, setNotifPhone] = useState("");
  const [notifSent, setNotifSent] = useState<"" | "sending" | "done" | "err">("");
  const scroller = useRef<HTMLDivElement | null>(null);
  const slots = useMemo(() => upcomingSlots(), []);
  const sing = termePublic.replace(/s$/u, ""); // client / patient

  // Garde-fou de formulation : les métiers « réservation » (soin) gardent le
  // vocabulaire cabinet/séance/suivi ; les autres (rappel/devis/acompte —
  // artisans & co.) passent à un vocabulaire neutre, sans « cabinet »,
  // « pour qui / enfant » ni « suivi(e) », qui sonneraient faux.
  // « de {nom} » sans « cabinet » : {praticien} porte déjà le nom de
  // l'établissement (souvent « Cabinet … »), donc « du cabinet de Cabinet … »
  // ferait doublon et trahirait le gabarit.
  const lieuAccueil = `de ${praticien}`;
  // Sujet neutre pour la narration à la 3ᵉ personne (un nom d'établissement ne
  // peut pas être « en séance »).
  const proNoun = isReserve ? "le praticien" : "le professionnel";
  const porteQ = isReserve
    ? "Je peux prendre votre rendez-vous ou répondre à une question pratique. Que puis-je faire pour vous ?"
    : "Je peux transmettre votre demande ou répondre à une question pratique. Que puis-je faire pour vous ?";
  const qui1Q = isReserve
    ? "Avec plaisir. C’est pour qui ?"
    : "Avec plaisir. Vous êtes un particulier ou un professionnel ?";
  const qui1Chips = isReserve ? ["Moi", "Mon enfant", "Un proche"] : ["Un particulier", "Un professionnel"];
  const premiereQ = isReserve
    ? "Première fois au cabinet, ou vous êtes déjà suivi(e) ?"
    : "C’est une première demande, ou vous êtes déjà client(e) ?";
  const premiereChips = isReserve ? ["Première fois", "Déjà suivi(e)"] : ["Première demande", "Déjà client(e)"];

  const push = (msgs: Msg[]) => setThread((t) => [...t, ...msgs]);

  const start = () => {
    setThread([
      { who: "ai", text: `Bonjour, je suis l'accueil automatique ${lieuAccueil}.` },
      { who: "ai", text: porteQ },
    ]);
    setStep("home");
    setPourQui(""); setPremiere(""); setPrenom(""); setTel(""); setConsent(false); setSlot("");
  };

  // Ouverture depuis la bulle OU depuis les [data-accueil-open] de la page.
  useEffect(() => {
    const openIt = () => { setOpen(true); if (thread.length === 0) start(); };
    const handler = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-accueil-open]")) { e.preventDefault(); openIt(); }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.length, praticien]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread, step]);

  const openBubble = () => { setOpen(true); if (thread.length === 0) start(); };

  // ── Transitions (toutes déclenchées par des chips) ─────────────────────────
  const choosePorte = (p: string) => {
    push([{ who: "me", text: p }]);
    if (p.startsWith("Poser")) {
      push([{ who: "ai", text: "Bien sûr. Sur quoi puis-je vous renseigner ?" }]);
      setStep("faq");
    } else if (p.startsWith("Je ne sais")) {
      push([{ who: "ai", text: isReserve
        ? "C'est tout à fait normal d'hésiter. Je peux simplement vous proposer un premier rendez-vous, sans engagement — ou répondre à une question. Que préférez-vous ?"
        : "C'est tout à fait normal d'hésiter. Je peux simplement transmettre votre demande, sans engagement — ou répondre à une question. Que préférez-vous ?" }]);
      setStep("home");
    } else {
      push([{ who: "ai", text: qui1Q }]);
      setStep("qualif1");
    }
  };

  const chooseQui = (v: string) => {
    push([{ who: "me", text: v }]);
    setPourQui(v);
    if (/enfant/i.test(v)) push([{ who: "ai", text: "Très bien. Le rendez-vous se prendra avec vous, en tant que représentant légal." }]);
    push([{ who: "ai", text: premiereQ }]);
    setStep("qualif2");
  };

  const choosePremiere = (v: string) => {
    push([{ who: "me", text: v }]);
    setPremiere(v);
    push([{ who: "ai", text: "Parfait. Vous préférez plutôt quand ?" }]);
    setStep("qualif3");
  };

  const chooseDispo = (v: string) => {
    push([{ who: "me", text: v }]);
    push([{ who: "ai", text: isReserve ? "Il me faut juste un prénom et un numéro pour confirmer le rendez-vous — rien de plus." : "Il me faut juste un prénom et un numéro pour transmettre votre demande — rien de plus." }]);
    setStep("coord");
  };

  const submitCoord = async () => {
    push([{ who: "me", text: `${prenom} · ${tel}` }]);
    if (isReserve) {
      push([{ who: "ai", text: "Merci. Voici les prochains créneaux disponibles :" }]);
      setStep("slots");
      return;
    }
    // rappel / devis / acompte : pas de créneau à choisir, on enregistre la demande.
    setBooking(true);
    try {
      await fetch("/api/site-internet/apercu/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom, tel, pourQui, premiere, slot: "" }),
        keepalive: true,
      });
    } catch {
      /* la confirmation s'affiche quand même (démo) */
    }
    setBooking(false);
    const msg =
      confirmation === "rappel"
        ? `C'est noté. ${praticien} vous rappelle au plus vite.`
        : confirmation === "devis"
          ? `Votre demande de devis est transmise à ${praticien}. Il revient vers vous rapidement.`
          : `Votre demande est enregistrée. ${praticien} vous recontacte pour l'acompte et le rendez-vous.`;
    const extra = sing === "patient" ? [{ who: "ai" as const, text: "Aucune donnée de santé ne vous a été demandée." }] : [];
    push([{ who: "ai", text: msg }, ...extra]);
    setStep("confirm");
  };

  const chooseSlot = async (s: string) => {
    setSlot(s);
    push([{ who: "me", text: s }]);
    setBooking(true);
    try {
      await fetch("/api/site-internet/apercu/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom, tel, pourQui, premiere, slot: s }),
        keepalive: true,
      });
    } catch {
      /* la confirmation s'affiche quand même (démo) */
    }
    setBooking(false);
    push([
      { who: "ai", text: `C'est réservé : ${s}. Un rappel par SMS vous sera envoyé la veille.` },
      ...(sing === "patient" ? [{ who: "ai" as const, text: "Aucune donnée de santé ne vous a été demandée." }] : []),
    ]);
    setStep("confirm");
  };

  const askFaq = (item: FaqItem) => {
    push([{ who: "me", text: item.q }, { who: "ai", text: item.a }]);
    // reste en step "faq" → on repropose les sujets + prendre RDV
  };

  const resetToRdv = () => {
    push([{ who: "me", text: isReserve ? "Prendre rendez-vous" : "Faire une demande" }, { who: "ai", text: qui1Q }]);
    setStep("qualif1");
  };

  // FAQ en texte libre → API filtrée (détresse/médical bloqués avant le modèle).
  const sendFreeText = async () => {
    const q = qInput.trim();
    if (!q || typing) return;
    setQInput("");
    push([{ who: "me", text: q }]);
    setTyping(true);
    try {
      const r = await fetch("/api/site-internet/apercu/accueil-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message: q }),
      });
      const j = await r.json().catch(() => ({}));
      const reply = String(j?.reply || "").trim() || (isReserve
        ? `Je transmets votre question à ${praticien}. Souhaitez-vous que je vous propose un rendez-vous ?`
        : `Je transmets votre question à ${praticien}. Souhaitez-vous laisser une demande ?`);
      const isUrg = j?.kind === "urgence";
      if (isUrg) setForceUrgence(true);
      push([{ who: "ai", text: reply, urg: isUrg }]);
    } catch {
      push([{ who: "ai", text: isReserve ? "Je n'ai pas pu récupérer la réponse. Souhaitez-vous que je vous propose un rendez-vous ?" : "Je n'ai pas pu récupérer la réponse. Souhaitez-vous laisser une demande ?" }]);
    } finally {
      setTyping(false);
    }
  };

  // « Buzz dans la poche » : envoie un vrai SMS au numéro du testeur.
  const sendBuzz = async () => {
    const ph = notifPhone.trim();
    if (!ph || notifSent === "sending") return;
    setNotifSent("sending");
    try {
      const r = await fetch("/api/site-internet/apercu/demo-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, phone: ph, slot, pourQui }),
      });
      const j = await r.json().catch(() => ({}));
      setNotifSent(j?.ok ? "done" : "err");
    } catch {
      setNotifSent("err");
    }
  };

  const chip = (label: string, onClick: () => void, key?: string) => (
    <button key={key || label} type="button" className="acc-chip" onClick={onClick}>{label}</button>
  );

  return (
    <>
      <style>{`
        .acc-bubble{position:fixed;right:16px;bottom:20px;z-index:60;display:flex;align-items:center;gap:0;}
        .acc-bubble .lab{background:${accent};color:#fff;font-size:13px;font-weight:700;padding:10px 14px;border-radius:999px 0 0 999px;box-shadow:0 6px 20px rgba(0,0,0,.18);}
        .acc-bubble .ic{width:52px;height:52px;border-radius:50%;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.22);border:2px solid #fff;}
        .acc-ov{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;background:rgba(12,14,12,.42);}
        .acc-sheet{background:#F6F4EF;width:100%;max-width:520px;height:86vh;border-radius:20px 20px 0 0;display:flex;flex-direction:column;overflow:hidden;animation:accUp .32s cubic-bezier(.2,.7,.3,1);}
        @keyframes accUp{from{transform:translateY(100%);}to{transform:none;}}
        @media (prefers-reduced-motion:reduce){.acc-sheet{animation:none;}}
        .acc-head{background:${accent};color:#fff;padding:14px 16px;display:flex;align-items:center;gap:11px;}
        .acc-head .avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;flex:none;}
        .acc-head .h-nm{font-weight:700;font-size:15px;line-height:1.1;}
        .acc-head .h-sub{font-size:11.5px;opacity:.85;margin-top:2px;}
        .acc-head .x{margin-left:auto;background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:4px;}
        .acc-body{flex:1;overflow-y:auto;padding:16px 14px 8px;}
        .acc-row{display:block;}
        .acc-line{display:flex;margin-bottom:9px;}
        .acc-line.me{justify-content:flex-end;}
        .acc-msg{max-width:82%;padding:9px 13px;border-radius:15px;font-size:14px;line-height:1.42;overflow-wrap:anywhere;}
        .acc-msg.ai{background:#fff;color:#1C201C;border-bottom-left-radius:5px;box-shadow:0 1px 2px rgba(0,0,0,.05);}
        .acc-msg.me{background:${accent};color:#fff;border-bottom-right-radius:5px;}
        .acc-msg.urg{background:#F7EAEA;color:#7A2020;border:1px solid #E3B4B4;font-weight:500;}
        .acc-typing{display:flex;gap:4px;align-items:center;}
        .acc-typing span{width:6px;height:6px;border-radius:50%;background:#B7B3A8;animation:accBlink 1s infinite;}
        .acc-typing span:nth-child(2){animation-delay:.15s;}
        .acc-typing span:nth-child(3){animation-delay:.3s;}
        @keyframes accBlink{0%,60%,100%{opacity:.25;}30%{opacity:1;}}
        .acc-ask{display:flex;gap:8px;width:100%;margin-top:2px;}
        .acc-ask-in{flex:1;height:42px;border:1px solid #D8D5CC;border-radius:11px;padding:0 13px;font-size:15px;background:#fff;}
        .acc-ask-send{width:44px;height:42px;flex:none;border:none;border-radius:11px;background:${accent};color:#fff;font-size:19px;font-weight:700;cursor:pointer;}
        .acc-ask-send:disabled{opacity:.45;cursor:not-allowed;}
        .acc-buzz-lead{font-size:13px;color:#3A3F38;font-weight:600;margin-bottom:7px;}
        .acc-buzz-done{font-size:13.5px;color:${accent};background:#EAF0EC;border:1px solid #CBDBD0;border-radius:12px;padding:11px 13px;line-height:1.45;font-weight:500;}
        .acc-buzz-err{font-size:11.5px;color:#9A6A6A;margin-top:6px;}
        .acc-actions{padding:10px 14px 12px;border-top:1px solid #E3E0D7;background:#F6F4EF;display:flex;flex-wrap:wrap;gap:8px;}
        .acc-chip{background:#fff;border:1px solid ${accent};color:${accent};font-size:13.5px;font-weight:600;border-radius:999px;padding:9px 14px;cursor:pointer;}
        .acc-chip:hover{background:${accent};color:#fff;}
        .acc-field{width:100%;height:44px;border:1px solid #D8D5CC;border-radius:11px;padding:0 13px;font-size:15px;background:#fff;margin-bottom:8px;}
        .acc-consent{display:flex;gap:9px;align-items:flex-start;font-size:12px;color:#5A5F58;line-height:1.4;margin:2px 0 10px;}
        .acc-cta{width:100%;background:${accent};color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;}
        .acc-cta:disabled{opacity:.5;cursor:not-allowed;}
        .acc-reveal{margin:4px 2px 2px;background:#EAF0EC;border:1px solid #CBDBD0;border-radius:14px;padding:14px 15px;font-size:13.5px;color:#1C201C;line-height:1.5;}
        .acc-reveal b{color:${accent};}
        .acc-urgence{font-size:11px;color:#7A5B5B;background:#F6ECEC;border-top:1px solid #EAD7D7;padding:9px 14px;line-height:1.4;text-align:center;}
        .acc-urgence b{color:#8A2B2B;}
        .acc-legal{font-size:10.5px;color:#9A968C;text-align:center;padding:8px 14px 12px;line-height:1.4;}
      `}</style>

      {/* Bulle flottante (toutes les pages) */}
      {!open && (
        <button type="button" className="acc-bubble" onClick={openBubble} aria-label="Ouvrir l'accueil">
          <span className="lab">{isReserve ? "Prendre RDV" : "Nous contacter"}</span>
          <span className="ic">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 20l1.4-4.2A8.5 8.5 0 1 1 21 11.5z"/></svg>
          </span>
        </button>
      )}

      {open && (
        <div className="acc-ov" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="acc-sheet" role="dialog" aria-label={isReserve ? "Accueil du cabinet" : "Accueil"}>
            <div className="acc-head">
              <span className="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 20l1.4-4.2A8.5 8.5 0 1 1 21 11.5z"/></svg>
              </span>
              <div>
                <div className="h-nm">{isReserve ? "Accueil du cabinet" : "Accueil"}</div>
                <div className="h-sub">Automatique · réponse immédiate</div>
              </div>
              <button type="button" className="x" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            </div>

            <div className="acc-body" ref={scroller}>
              <div className="acc-row">
                {thread.map((m, i) => (
                  <div key={i} className={`acc-line ${m.who}`}>
                    <div className={`acc-msg ${m.who}${m.urg ? " urg" : ""}`}>{m.text}</div>
                  </div>
                ))}
                {typing && (
                  <div className="acc-line ai">
                    <div className="acc-msg ai acc-typing"><span></span><span></span><span></span></div>
                  </div>
                )}
              </div>
              {step === "confirm" && (
                <div className="acc-reveal">
                  Pendant ce temps, <b>{proNoun}</b> était {busyWord}. À la pause, il retrouve : <b>{isReserve ? "nouveau rendez-vous" : "nouvelle demande"}</b>{pourQui ? ` · ${pourQui}` : ""}{slot ? ` · ${slot}` : ""}. Rien n’a été raté, sans jamais décrocher.
                </div>
              )}
            </div>

            <div className="acc-actions">
              {step === "home" && (
                <>
                  {chip(isReserve ? "Prendre un premier rendez-vous" : "Faire une demande", () => choosePorte(isReserve ? "Prendre un premier rendez-vous" : "Faire une demande"))}
                  {chip("Poser une question", () => choosePorte("Poser une question"))}
                  {chip("Je ne sais pas trop…", () => choosePorte("Je ne sais pas trop…"))}
                </>
              )}
              {step === "qualif1" && (qui1Chips.map((v) => chip(v, () => chooseQui(v), v)))}
              {step === "qualif2" && (premiereChips.map((v) => chip(v, () => choosePremiere(v), v)))}
              {step === "qualif3" && (["En semaine", "Le soir", "Le week-end", "Peu importe"].map((v) => chip(v, () => chooseDispo(v), v)))}
              {step === "coord" && (
                <div style={{ width: "100%" }}>
                  <input className="acc-field" placeholder="Votre prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                  <input className="acc-field" placeholder="Votre téléphone" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} />
                  <label className="acc-consent">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span>J’accepte d’être recontacté(e) au sujet de {isReserve ? "ce rendez-vous" : "cette demande"}.{sing === "patient" ? " Aucune donnée de santé n’est demandée." : ""}</span>
                  </label>
                  <button type="button" className="acc-cta" disabled={!prenom.trim() || tel.replace(/\D/g, "").length < 8 || !consent} onClick={submitCoord}>{isReserve ? "Voir les créneaux" : "Envoyer ma demande"}</button>
                </div>
              )}
              {step === "slots" && (slots.map((s) => chip(s, () => chooseSlot(s), s)))}
              {step === "confirm" && (
                <div style={{ width: "100%" }}>
                  {notifSent === "done" ? (
                    <div className="acc-buzz-done">📲 Envoyé — regardez votre téléphone. C’est exactement ce que {proNoun} reçoit, {busyWord}, sans décrocher.</div>
                  ) : (
                    <>
                      <div className="acc-buzz-lead">📲 Recevez la notif comme si vous étiez le praticien :</div>
                      <div className="acc-ask">
                        <input className="acc-ask-in" placeholder="Votre numéro" inputMode="tel" value={notifPhone} onChange={(e) => setNotifPhone(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendBuzz(); }} />
                        <button type="button" className="acc-ask-send" onClick={sendBuzz} disabled={!notifPhone.trim() || notifSent === "sending"} aria-label="Recevoir la notif">→</button>
                      </div>
                      {notifSent === "err" && <div className="acc-buzz-err">Envoi indisponible pour le moment.</div>}
                    </>
                  )}
                  <button type="button" className="acc-chip" style={{ marginTop: 10 }} onClick={() => setOpen(false)}>Revenir au site</button>
                </div>
              )}
              {step === "faq" && (
                <>
                  {faq.map((it) => chip(it.q, () => askFaq(it), it.q))}
                  {chip(isReserve ? "Prendre rendez-vous" : "Faire une demande", resetToRdv)}
                  <div className="acc-ask">
                    <input
                      className="acc-ask-in"
                      placeholder="Écrire ma question…"
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendFreeText(); }}
                    />
                    <button type="button" className="acc-ask-send" onClick={sendFreeText} disabled={!qInput.trim() || typing} aria-label="Envoyer">→</button>
                  </div>
                </>
              )}
              {booking && <span style={{ fontSize: 12, color: "#5A5F58" }}>Réservation…</span>}
            </div>

            {(showUrgence || forceUrgence) && (
              <div className="acc-urgence">
                En cas d’urgence ou de grande souffrance : <b>15</b> (Samu) · <b>3114</b> (prévention du suicide, 24 h/24, gratuit) · <b>112</b>.
              </div>
            )}
            <div className="acc-legal">
              Accueil automatique · vos coordonnées servent uniquement à {isReserve ? "la prise de rendez-vous" : "traiter votre demande"}. {sing === "patient" ? "Aucune question médicale n'est traitée ici." : ""}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
