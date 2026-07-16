"use client";

// L'ASSISTANTE « Confier une tâche » (P1b_ASSISTANTE.md) — remplace les pastilles.
// Une seule entrée : une bulle flottante en bas à droite. Le pro confie une tâche,
// voit CHAQUE étape (saisie → aperçu du message exact + destinataire → validation
// → animation → retour). On ne vend plus « une fonction » mais « comment vous allez
// déléguer ». Les animations (avis 10→11 + maj du vrai compteur, créneau comblé,
// cliente prise en charge) sont RÉUTILISÉES — seul le point d'entrée change.
//
// Garde-fous : aucune voix, aucun champ texte libre, aucune pastille. Déontologie :
// en santé/droit (avisAllowed=false) → seulement « répondre » et « préparer », jamais
// avis ni créneau/offre. Le vrai compteur d'avis (#mqd-avis-count) se met à jour à la
// fin de la démo avis. La bulle n'existe qu'en mode maquette propriétaire.
import { useEffect, useRef, useState } from "react";

export type MaquetteAssistantData = {
  nom: string; // nom du commerce, pour les messages (« chez … »)
  clientTerm: string; // singulier : « client » / « patient »
  reviewsCount: number | null; // départ du compteur d'avis
  slot: string; // créneau illustratif, ex. « samedi 15 h 30 »
  avisAllowed: boolean; // déonto none (A/B) → avis + créneau ; sinon (C/D) sobre
};

type View = "home" | "avisIn" | "avisPrev" | "creneauIn" | "creneauPrev" | "questionIn";

export function MaquetteAssistant({ accent, data }: { accent: string; data: MaquetteAssistantData }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [stageOn, setStageOn] = useState(false);
  const [fn, setFn] = useState("");
  const [ph, setPh] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  const { nom, clientTerm, avisAllowed, slot } = data;
  const term = clientTerm || "client"; // singulier

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  const after = (ms: number, fn2: () => void) => timers.current.push(window.setTimeout(fn2, ms));
  const setCard = (html: string) => {
    if (cardRef.current) cardRef.current.innerHTML = html;
  };
  const openStage = (html: string) => {
    setStageOn(true);
    requestAnimationFrame(() => setCard(html));
  };
  const backHome = () => {
    clearTimers();
    setStageOn(false);
    setView("home");
    setFn("");
    setPh("");
    setOpen(true);
  };

  useEffect(() => () => clearTimers(), []);

  const n0 = data.reviewsCount ?? 0;
  const rtn = `<button class="asx-rtn" data-return>Revenir à mon assistante ✦</button>`;
  const tiny = (t: string) => `<div class="asx-tiny">${t}</div>`;

  // ── AVIS : message envoyé → l'avis Google apparaît → compteur n → n+1 ─────────
  const playAvis = () => {
    const who = fn.trim() || `votre ${term}`;
    openStage(
      `<div class="asx-ctx">Message envoyé à ${esc(who)}…</div>` +
        `<div class="asx-chat"><div class="asx-msg wa">Bonjour ${esc(who)}, merci pour votre visite chez ${esc(nom)} ! Si vous avez 30 s, votre avis Google nous aiderait beaucoup 🙏</div></div>` +
        `<div class="asx-dots" style="margin-top:12px"><span>•</span><span>•</span><span>•</span></div>`
    );
    after(2200, () => {
      setCard(
        `<div class="asx-ctx">${esc(who)} vient de laisser un avis sur Google :</div>` +
          `<div class="asx-prev" style="text-align:left"><div class="asx-to">★★★★★ · ${esc(who)} · Google</div>« Accueil au top et travail soigné. Je recommande les yeux fermés ! »</div>` +
          `<div style="height:12px"></div><div class="asx-big" id="asx-ct">${n0}</div><div class="asx-starline">★★★★★</div>` +
          confettiHtml(accent)
      );
      after(900, () => {
        const c = document.getElementById("asx-ct");
        if (c) { c.textContent = String(n0 + 1); c.classList.add("bump"); }
        document.querySelectorAll<HTMLElement>(".asx-conf").forEach((e) => (e.style.animationPlayState = "running"));
        const real = document.getElementById("mqd-avis-count");
        if (real) real.textContent = String(n0 + 1);
      });
    });
    after(4400, () =>
      setCard(
        `<div class="asx-final"><span class="em">Un nouvel avis Google</span> vient renforcer votre réputation.</div>` +
          `<div class="asx-starline" style="font-size:13px;margin-top:6px">${n0} → ${n0 + 1} avis</div>` +
          tiny("simulation") + rtn
      )
    );
  };

  // ── CRÉNEAU : alerte à la liste → tension → « OUI je prends » → comblé ────────
  const playCreneau = (heure: string) => {
    openStage(
      `<div class="asx-chat"><div class="asx-msg notif">⚠ Créneau libéré — ${esc(heure)}</div></div>` +
        `<div class="asx-slot" id="asx-sl">${esc(heure)} — libre</div><div id="asx-act" style="margin-top:6px"></div>`
    );
    after(1100, () => {
      const a = document.getElementById("asx-act");
      if (a) a.innerHTML = `<div class="asx-tiny" style="margin-bottom:6px">Envoyé à vos ${term === "patient" ? "patients" : "client·es"} inscrit·es à vos alertes WhatsApp</div><div class="asx-msg wa" style="opacity:1;transform:none">Une place se libère ${esc(heure)} chez ${esc(nom)}. Envie d’en profiter ? Répondez OUI 🙂</div>`;
    });
    after(2600, () => {
      const a = document.getElementById("asx-act");
      if (a) a.innerHTML += `<div class="asx-dots" style="margin-top:10px"><span>•</span><span>•</span><span>•</span></div>`;
    });
    after(4200, () => {
      const a = document.getElementById("asx-act");
      a?.querySelector(".asx-dots")?.remove();
      if (a) a.innerHTML += `<div class="asx-msg c" style="opacity:1;transform:none;margin-top:6px">Julie — OUI je prends ❤️</div>`;
    });
    after(5000, () => {
      const sl = document.getElementById("asx-sl");
      if (sl) { sl.classList.add("filled"); sl.innerHTML = `✓ ${esc(heure)} — réservé par Julie`; }
    });
    after(5900, () =>
      setCard(
        `<div class="asx-final">Votre créneau vide vient d'être comblé —<br><span class="em">avant même que vous ayez rangé votre poste.</span></div>` +
          tiny("simulation") + rtn
      )
    );
  };

  // ── RÉPONDRE : une cliente écrit, l'assistante répond À VOTRE PLACE ───────────
  const playQuestion = (q: string, book: boolean) => {
    openStage(
      `<div class="asx-ctx">21 h 47 — vous êtes ${avisAllowed ? "en prestation" : "en séance"}.<br>Un ${term} écrit sur votre site. <b>Votre assistante répond à votre place :</b></div>` +
        `<div class="asx-chat" id="asx-ch"></div>`
    );
    const answer = book
      ? `Bonsoir ! Il me reste ${esc(slot)}. Je vous le réserve ?`
      : `Bonsoir ! Je vous réponds tout de suite, et je peux vous proposer un rendez-vous quand vous voulez 🙂`;
    const seq: Array<[string, string]> = [
      ["c", esc(q)],
      ["a", answer],
    ];
    if (book) { seq.push(["c", "Oui, avec plaisir 🙂"]); seq.push(["a", "C'est noté ✨"]); }
    const ch = () => document.getElementById("asx-ch");
    seq.forEach(([w, t], i) => after(600 + i * 1050, () => { const c = ch(); if (c) c.innerHTML += `<div class="asx-msg ${w}">${t}</div>`; }));
    after(600 + seq.length * 1050 + 500, () => {
      const fin = book
        ? `<div class="asx-stamp">✓ Réservé — ${esc(slot)}</div><div class="asx-final">Pendant que vous étiez occupé·e,<br><span class="em">un nouveau ${term} a déjà été pris en charge.</span></div>`
        : `<div class="asx-final">Votre ${term} a eu sa réponse —<br><span class="em">sans que vous ayez à décrocher.</span></div>`;
      setCard(fin + tiny(`${avisAllowed ? "vous n'avez pas décroché" : "aucune donnée de santé demandée"} · simulation`) + rtn);
    });
  };

  // ── PRÉPARER (santé/droit) : la veille du rendez-vous ────────────────────────
  const playPreparer = () => {
    openStage(`<div class="asx-ctx">La veille du rendez-vous, sans que vous ayez rien à faire…</div><div class="asx-chat" id="asx-ch"></div>`);
    const seq: Array<[string, string]> = [
      ["a", `Bonjour, votre rendez-vous est demain à ${esc(slot)}. Voici l'accès, le parking et ce qu'il faut prévoir.`],
      ["c", "Merci, c'est noté !"],
    ];
    const ch = () => document.getElementById("asx-ch");
    seq.forEach(([w, t], i) => after(600 + i * 1050, () => { const c = ch(); if (c) c.innerHTML += `<div class="asx-msg ${w}">${t}</div>`; }));
    after(600 + seq.length * 1050 + 500, () =>
      setCard(`<div class="asx-final">Votre ${term} arrive préparé —<br><span class="em">la séance commence dans les meilleures conditions.</span></div>` + tiny("simulation") + rtn)
    );
  };

  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-return]")) backHome();
  };

  // ── Rendu du corps du panneau (React) ────────────────────────────────────────
  const questions = avisAllowed
    ? ["« Vous auriez de la place cette semaine ? »", "« Comment prendre rendez-vous ? »", "« Vous êtes ouvert ce week-end ? »"]
    : ["« Comment prendre rendez-vous ? »", "« Prenez-vous de nouveaux patients ? »", "« Où êtes-vous situé ? »"];
  const heures = [`aujourd'hui 15 h`, `demain 10 h`, `demain 14 h`];

  const renderBody = () => {
    if (view === "avisIn") {
      const ready = fn.trim() && ph.trim();
      return (
        <>
          <button className="asx-back" onClick={() => setView("home")}>‹ Retour</button>
          <div className="asx-say">Bien sûr. Indiquez-moi le·la {term} à remercier — je lui écrirai pour l’inviter à laisser un avis.</div>
          <div className="asx-field"><label>Prénom du·de la {term}</label><input value={fn} onChange={(e) => setFn(e.target.value)} placeholder="Ex. Julie" /></div>
          <div className="asx-field"><label>Son numéro WhatsApp</label><input value={ph} onChange={(e) => setPh(e.target.value)} placeholder="Ex. 06 12 34 56 78" inputMode="tel" /></div>
          <button className="asx-send" disabled={!ready} onClick={() => setView("avisPrev")}>Préparer le message</button>
        </>
      );
    }
    if (view === "avisPrev") {
      const who = fn.trim() || `votre ${term}`;
      return (
        <>
          <button className="asx-back" onClick={() => setView("avisIn")}>‹ Retour</button>
          <div className="asx-say">Voici le message que j’enverrai à <b>{who}</b>. Vous validez&nbsp;?</div>
          <div className="asx-prev"><div className="asx-to">📱 WhatsApp → {who}</div><div className="asx-wac">Bonjour {who}, merci pour votre visite chez {nom} ! Si vous avez 30 s, votre avis Google nous aiderait beaucoup 🙏 [lien Google]</div></div>
          <button className="asx-send" onClick={playAvis}>Envoyer à {who} ✦</button>
        </>
      );
    }
    if (view === "creneauIn") {
      return (
        <>
          <button className="asx-back" onClick={() => setView("home")}>‹ Retour</button>
          <div className="asx-say">Parfait. À quelle heure est le créneau qui se libère&nbsp;? Je préviendrai vos client·es inscrit·es aux alertes WhatsApp.</div>
          <div className="asx-quick">{heures.map((h) => <button key={h} onClick={() => { setFn(h); setView("creneauPrev"); }}>{cap(h)}</button>)}</div>
        </>
      );
    }
    if (view === "creneauPrev") {
      return (
        <>
          <button className="asx-back" onClick={() => setView("creneauIn")}>‹ Retour</button>
          <div className="asx-say">Voici l’alerte que j’enverrai à <b>vos client·es inscrit·es</b>. Vous validez&nbsp;?</div>
          <div className="asx-prev"><div className="asx-to">📱 Liste WhatsApp · vos client·es inscrit·es</div><div className="asx-wac">Une place se libère {fn} chez {nom}. Envie d’en profiter&nbsp;? Répondez OUI pour la réserver 🙂</div></div>
          <button className="asx-send" onClick={() => playCreneau(fn)}>Envoyer l’alerte ✦</button>
        </>
      );
    }
    if (view === "questionIn") {
      return (
        <>
          <button className="asx-back" onClick={() => setView("home")}>‹ Retour</button>
          <div className="asx-say">Voici comment je réponds à vos {term === "patient" ? "patients" : "client·es"} <b>à votre place</b>, même quand vous êtes occupé·e. Choisissez une question qu’on vous pose souvent&nbsp;:</div>
          <div className="asx-quick">
            {questions.map((q, i) => <button key={q} onClick={() => playQuestion(q, i === 0)}>{q}</button>)}
          </div>
        </>
      );
    }
    // home
    return (
      <>
        <div className="asx-say">Pendant que vous travaillez avec vos {term === "patient" ? "patients" : "client·es"}, <b>je m’occupe du reste.</b><br />Que souhaitez-vous me confier&nbsp;?</div>
        <div className="asx-tasks">
          {avisAllowed && (
            <button className="asx-task" onClick={() => setView("avisIn")}>
              <span className="ic">⭐</span><span><span className="tt">Obtenir un nouvel avis Google</span><span className="ts">après un·e client·e satisfait·e</span></span><span className="go">→</span>
            </button>
          )}
          {avisAllowed && (
            <button className="asx-task" onClick={() => setView("creneauIn")}>
              <span className="ic">📣</span><span><span className="tt">Remplir un créneau annulé</span><span className="ts">prévenir vos habitué·es sur WhatsApp</span></span><span className="go">→</span>
            </button>
          )}
          <button className="asx-task" onClick={() => setView("questionIn")}>
            <span className="ic">💬</span><span><span className="tt">Laisser mon site répondre à ma place</span><span className="ts">quand un·e {term} pose une question</span></span><span className="go">→</span>
          </button>
          {!avisAllowed && (
            <button className="asx-task" onClick={playPreparer}>
              <span className="ic">📋</span><span><span className="tt">Préparer la consultation</span><span className="ts">infos pratiques la veille du rendez-vous</span></span><span className="go">→</span>
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <style>{styles(accent)}</style>

      {!open && !stageOn && (
        <button className="asx-fab" onClick={() => { setOpen(true); setView("home"); }} aria-label="Confier une tâche">
          <span className="lab">Confier une tâche</span>
          <span className="orb">✦</span>
        </button>
      )}

      {open && !stageOn && (
        <div className="asx-sheet" role="dialog" aria-label="Votre assistante">
          <div className="asx-grip" />
          <button className="asx-close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          <div className="asx-ahead">
            <div className="av">✦</div>
            <div><div className="nm">Votre assistante</div><div className="st">intégrée à votre futur site</div></div>
          </div>
          <div className="asx-abody">{renderBody()}</div>
        </div>
      )}

      {stageOn && (
        <div className="asx-stage" onClick={onStageClick}>
          <div className="asx-card" ref={cardRef} />
        </div>
      )}
    </>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function confettiHtml(accent: string): string {
  let h = "";
  for (let i = 0; i < 14; i++) {
    const x = 10 + Math.random() * 80;
    const d = Math.random() * 0.3;
    const c = i % 2 ? accent : "#B8862F";
    h += `<div class="asx-conf" style="left:${x}%;top:40%;background:${c};animation:asxConf .9s ${d}s forwards"></div>`;
  }
  return h;
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function styles(accent: string): string {
  return `
  .asx-fab{position:fixed;right:16px;bottom:74px;z-index:55;max-width:520px;display:flex;align-items:center;cursor:pointer;border:none;background:none;font-family:inherit;}
  .asx-fab .lab{background:#16160F;color:#FBFAF7;font-size:12px;font-weight:600;padding:9px 26px 9px 13px;border-radius:22px;margin-right:-16px;white-space:nowrap;box-shadow:0 8px 22px -8px rgba(0,0,0,.5);}
  .asx-fab .orb{width:52px;height:52px;border-radius:50%;background:linear-gradient(150deg,#C79A3A,#9A7526);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;box-shadow:0 8px 22px -6px rgba(184,134,47,.7);position:relative;}
  .asx-fab .orb::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #B8862F;animation:asxPulse 2.2s infinite;}
  @keyframes asxPulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.7);opacity:0}}
  @media (prefers-reduced-motion:reduce){.asx-fab .orb::after{animation:none;}}
  .asx-sheet{position:fixed;left:0;right:0;bottom:0;z-index:56;max-width:520px;margin:0 auto;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -18px 50px -12px rgba(0,0,0,.4);max-height:88vh;display:flex;flex-direction:column;animation:asxUp .38s cubic-bezier(.22,1,.36,1);}
  @keyframes asxUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .asx-grip{width:38px;height:4px;border-radius:2px;background:#DBD8CF;margin:10px auto 4px;}
  .asx-close{position:absolute;top:12px;right:16px;color:#B7B3A8;font-size:17px;cursor:pointer;background:none;border:none;z-index:3;}
  .asx-ahead{padding:6px 20px 12px;display:flex;gap:11px;align-items:center;border-bottom:1px solid #E7E4DC;}
  .asx-ahead .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(150deg,#C79A3A,#8A6A22);flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;}
  .asx-ahead .nm{font-family:Georgia,serif;font-weight:600;font-size:15px;}
  .asx-ahead .st{font-size:10.5px;color:#71766C;}
  .asx-abody{padding:16px 20px 24px;overflow-y:auto;}
  .asx-say{background:${accent}14;border-radius:14px;border-top-left-radius:5px;padding:12px 14px;font-size:13px;line-height:1.45;color:#26382E;margin-bottom:15px;}
  .asx-say b{font-weight:600;}
  .asx-tasks{display:flex;flex-direction:column;gap:9px;}
  .asx-task{display:flex;align-items:center;gap:12px;border:1px solid #E7E4DC;border-radius:13px;padding:13px 14px;cursor:pointer;background:#fff;transition:.15s;text-align:left;font-family:inherit;width:100%;}
  .asx-task:hover{border-color:#B8862F;background:#FDFBF6;}
  .asx-task .ic{width:34px;height:34px;border-radius:9px;background:${accent}14;flex:none;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .asx-task .tt{font-size:13.5px;font-weight:600;display:block;}
  .asx-task .ts{font-size:11px;color:#71766C;display:block;margin-top:1px;}
  .asx-task .go{margin-left:auto;color:#B8862F;font-size:17px;}
  .asx-quick{display:flex;flex-direction:column;gap:8px;}
  .asx-quick button{border:1px solid #E7E4DC;background:#fff;border-radius:13px;padding:12px 14px;font-size:13px;font-family:inherit;cursor:pointer;font-weight:500;text-align:left;}
  .asx-quick button:hover{border-color:#B8862F;}
  .asx-back{background:none;border:none;color:#71766C;font-size:12px;font-family:inherit;cursor:pointer;margin-bottom:12px;padding:0;}
  .asx-field label{font-size:11px;color:#71766C;display:block;margin-bottom:5px;font-weight:500;}
  .asx-field input{width:100%;border:1px solid #E7E4DC;border-radius:11px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:#fff;}
  .asx-field input:focus{outline:none;border-color:#B8862F;}
  .asx-field+.asx-field{margin-top:11px;}
  .asx-send{margin-top:14px;width:100%;background:${accent};color:#fff;border:none;border-radius:22px;padding:13px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;}
  .asx-send:disabled{background:#CBD3CC;cursor:default;}
  .asx-prev{background:#F4F2EC;border:1px solid #E7E4DC;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.45;color:#3A3A32;}
  .asx-prev .asx-to{font-size:10.5px;color:#71766C;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;}
  .asx-wac{background:#E6F5DC;border-radius:10px;padding:9px 11px;font-size:12.5px;line-height:1.4;color:#1F3A17;}
  .asx-stage{position:fixed;inset:0;z-index:60;max-width:520px;margin:0 auto;background:rgba(12,14,11,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px;backdrop-filter:blur(2px);}
  .asx-card{background:#fff;border-radius:20px;padding:22px 20px;width:100%;max-width:300px;text-align:center;position:relative;overflow:hidden;animation:asxCardin .35s;}
  @keyframes asxCardin{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  .asx-ctx{font-size:11.5px;color:#71766C;margin-bottom:14px;line-height:1.4;}
  .asx-big{font-family:Georgia,serif;font-size:54px;font-weight:600;line-height:1;color:${accent};display:inline-block;}
  .asx-big.bump{animation:asxBump .4s;}@keyframes asxBump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
  .asx-starline{color:#B8862F;font-size:16px;margin-top:6px;letter-spacing:2px;}
  .asx-chat{display:flex;flex-direction:column;gap:7px;text-align:left;}
  .asx-msg{padding:9px 12px;border-radius:13px;font-size:12px;line-height:1.35;max-width:90%;opacity:0;transform:translateY(6px);animation:asxMsgin .35s forwards;}
  .asx-msg.c{background:#EEEBE4;border-bottom-left-radius:4px;align-self:flex-start;}
  .asx-msg.a{background:${accent};color:#FBFAF7;border-bottom-right-radius:4px;align-self:flex-end;}
  .asx-msg.wa{background:#DCF8C6;border-bottom-right-radius:4px;align-self:flex-end;color:#1F3A17;}
  .asx-msg.notif{background:#16160F;color:#FBFAF7;align-self:stretch;max-width:100%;text-align:center;font-weight:600;}
  @keyframes asxMsgin{to{opacity:1;transform:translateY(0)}}
  .asx-stamp{margin-top:12px;border:1.5px solid ${accent};border-radius:13px;padding:12px;display:flex;align-items:center;gap:10px;justify-content:center;color:${accent};font-weight:700;font-size:13px;}
  .asx-slot{margin:10px 0;border:1.5px dashed #C9A24A;border-radius:12px;padding:12px;font-size:12.5px;color:#B8862F;font-weight:600;background:#FBF6EA;transition:.4s;}
  .asx-slot.filled{border:1.5px solid ${accent};border-style:solid;background:#E9F0EA;color:${accent};}
  .asx-dots{font-size:20px;letter-spacing:3px;color:#71766C;text-align:center;}
  .asx-dots span{opacity:.3;animation:asxBlink 1.2s infinite;}.asx-dots span:nth-child(2){animation-delay:.2s}.asx-dots span:nth-child(3){animation-delay:.4s}
  @keyframes asxBlink{0%,100%{opacity:.3}50%{opacity:1}}
  .asx-final{font-family:Georgia,serif;font-size:15px;font-weight:600;line-height:1.35;margin-top:14px;color:#16160F;}
  .asx-final .em{color:#B8862F;}
  .asx-tiny{font-size:9px;color:#A6A69C;margin-top:8px;font-style:italic;}
  .asx-rtn{margin-top:15px;background:#16160F;color:#FBFAF7;border:none;border-radius:20px;padding:11px 18px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;width:100%;}
  .asx-conf{position:absolute;width:7px;height:7px;border-radius:1px;opacity:0;}
  @keyframes asxConf{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(70px) rotate(220deg)}}
  `;
}
