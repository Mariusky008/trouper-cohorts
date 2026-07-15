"use client";

// « Moments wahoo » (P1_PASTILLES_WAHOO.md) : ce ne sont PAS 3 sites, c'est LE
// site + 3 démos greffées + 1 écran-bilan. Chaque pastille ✨ posée près d'une
// section joue une micro-démo par-dessus le site (6–10 s), finit sur une victoire
// nette, puis rend la main. Aucune interface d'admin, on ne quitte jamais le site.
//
// Garde-fous : en santé/droit (avisAllowed=false), AUCUNE démo « avis » ni
// « créneau / offre » — les pastilles portent sur répondre et préparer. Le vrai
// compteur d'avis du site (#mqc-avis-count) se met à jour à la fin de la démo avis.
// Les pastilles n'existent qu'en mode maquette propriétaire (jamais pour un vrai
// client) : c'est le composant appelant qui décide de les monter.
import { useEffect, useRef, useState } from "react";

export type DemoKind = "avis" | "rdv" | "creneau" | "repondre" | "preparer";

export type MaquetteDemoData = {
  clientTerm: string; // singulier : « client » (commerce) / « patient » (santé)
  reviewsCount: number | null; // compteur d'avis réel (départ de l'animation)
  slot: string; // créneau illustratif de démo, ex. « Samedi 15 h 30 »
  bookedLabel: string; // « Réservé — … » / « Rappel programmé » … (selon confirmation)
  practicalQ: string; // question pratique du métier (ex. « Prenez-vous la carte Vitale ? »)
  avisAllowed: boolean; // déonto none → set commerce ; sinon set santé/droit
};

// Le pop contextuel + la pastille dorée, posés DANS une section (position:relative).
export function DemoPastille({
  kind,
  promise,
  benefit,
  primary = false,
}: {
  kind: DemoKind;
  promise: string;
  benefit: string;
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`mqd-anchor${primary ? " primary" : ""}`}>
      {primary && !open && <span className="mqd-hint">À essayer&nbsp;✨</span>}
      <button type="button" className="mqd-dot" onClick={() => setOpen((o) => !o)} aria-label="Voir ce que fait votre site">
        ✨
      </button>
      {open && (
        <div className="mqd-pop" role="dialog">
          <span className="mqd-x" onClick={() => setOpen(false)} aria-label="Fermer">
            ✕
          </span>
          <div className="mqd-eb">À essayer dans votre maquette</div>
          <h4>{promise}</h4>
          <p>{benefit}</p>
          <button
            type="button"
            className="mqd-go"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("maquette-demo", { detail: { kind } }));
            }}
          >
            ▶ Voir la démonstration
          </button>
        </div>
      )}
    </div>
  );
}

// Le « plateau » : overlay assombri + carte animée. Monté UNE fois. Écoute les
// événements des pastilles, joue la démo demandée, garde en mémoire ce qui a été
// joué pour l'écran-bilan.
export function MaquetteDemos({ accent, data }: { accent: string; data: MaquetteDemoData }) {
  const [on, setOn] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);
  const done = useRef<Record<string, boolean>>({ avis: false, rdv: false, question: false, creneau: false, preparer: false });

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const setCard = (html: string) => {
    if (cardRef.current) cardRef.current.innerHTML = html;
  };
  const openStage = (html: string) => {
    setOn(true);
    // le DOM de la carte est monté au tour de rendu suivant
    requestAnimationFrame(() => setCard(html));
  };
  const closeStage = () => {
    clearTimers();
    setOn(false);
  };

  const n0 = data.reviewsCount ?? 0;
  const nEnd = n0 + 2;

  const nextBtns = () =>
    `<div class="mqd-next"><button class="ghost" data-close>Fermer</button><button class="fill" data-recap>Voir le bilan ✦</button></div>`;

  const confetti = () => {
    let h = "";
    for (let i = 0; i < 14; i++) {
      const x = 10 + Math.random() * 80;
      const d = Math.random() * 0.3;
      const c = i % 2 ? accent : "#B8862F";
      h += `<div class="mqd-conf" style="left:${x}%;top:38%;background:${c};animation:mqdConf .9s ${d}s forwards"></div>`;
    }
    return h;
  };
  const check = (size: number) =>
    `<svg class="mqd-check" style="width:${size}px;height:${size}px;margin-bottom:8px" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2.4"><circle cx="12" cy="12" r="10" stroke="#E7E4DC"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>`;

  // ── Démo AVIS (commerce) — le vrai compteur du site passe à n+2 à la fin ──────
  const playAvis = () => {
    done.current.avis = true;
    openStage(
      `<div class="mqd-ctx">Un ${data.clientTerm} vient de repartir, ravi. Votre site lui envoie un petit mot…</div>` +
        `<div class="mqd-chat"><div class="mqd-msg wa">Merci beaucoup ! Si vous avez 30 s, votre avis Google nous aide énormément 🙏</div></div>` +
        `<div style="height:14px"></div><div class="mqd-big" id="mqd-ct">${n0}</div><div class="mqd-starline">★★★★★</div>` +
        `<div class="mqd-plus" id="mqd-pl">★ +1</div>` +
        confetti()
    );
    after(1500, () => document.getElementById("mqd-pl")?.classList.add("fly"));
    after(1700, () => {
      const c = document.getElementById("mqd-ct");
      if (c) { c.textContent = String(n0 + 1); c.classList.add("bump"); }
    });
    after(2500, () => {
      const c = document.getElementById("mqd-ct");
      if (c) { c.textContent = String(nEnd); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
    });
    after(3500, () => {
      // Effet de bord : le vrai compteur d'avis du site est incrémenté.
      const real = document.getElementById("mqd-avis-count");
      if (real) real.textContent = String(nEnd);
      setCard(
        check(34) +
          `<div class="mqd-final"><span class="em">Un nouvel avis Google</span> vient renforcer votre réputation.</div>` +
          `<div class="mqd-starline" style="font-size:14px;margin-top:8px">${n0} → ${nEnd} avis</div><div class="mqd-tiny">simulation</div>` +
          nextBtns()
      );
    });
  };

  // ── Démo RÉSERVATION (commerce) — répond + réserve pendant la prestation ──────
  const playRdv = () => {
    done.current.rdv = true;
    done.current.question = true;
    openStage(`<div class="mqd-ctx">21 h 47. Vous êtes en pleine prestation. Un ${data.clientTerm} écrit sur votre site…</div><div class="mqd-chat" id="mqd-ch"></div>`);
    const ch = () => document.getElementById("mqd-ch");
    const steps: Array<() => void> = [
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg c">Bonsoir, avez-vous de la place ce samedi ?</div>`; },
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-typing" id="mqd-tp"><i></i><i></i><i></i></div>`; },
      () => { document.getElementById("mqd-tp")?.remove(); const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg a">Bonsoir ! Oui, je peux vous proposer ${data.slot}. Je vous réserve ce créneau ?</div>`; },
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg c">Oui, parfait 🙂</div>`; },
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg a">C'est noté ✨</div>`; },
    ];
    steps.forEach((f, i) => after(700 + i * 1100, f));
    after(700 + steps.length * 1100 + 400, () => {
      setCard(
        `<div class="mqd-stamp"><svg class="mqd-check" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2.4"><path d="M4 12.5l5 5L20 6"/></svg> ${escapeHtml(data.bookedLabel)}</div>` +
          `<div class="mqd-final">Pendant que vous travailliez,<br><span class="em">un nouveau ${data.clientTerm} a déjà été pris en charge.</span></div>` +
          `<div class="mqd-tiny">vous n'avez pas décroché · simulation</div>` +
          nextBtns()
      );
    });
  };

  // ── Démo CRÉNEAU VIDE (commerce) — comble une annulation ──────────────────────
  const playCreneau = () => {
    done.current.creneau = true;
    openStage(
      `<div class="mqd-chat"><div class="mqd-msg notif">⚠ Annulation — aujourd'hui 15 h</div></div>` +
        `<div class="mqd-slot" id="mqd-sl">Créneau 15 h — libre</div>` +
        `<div id="mqd-act" style="margin-top:6px"></div>`
    );
    after(1200, () => {
      const a = document.getElementById("mqd-act");
      if (a) a.innerHTML = `<div class="mqd-msg wa" style="opacity:1;transform:none">Une place se libère à 15 h aujourd'hui. Envie d'en profiter ? Répondez OUI 🙂</div><div class="mqd-tiny" style="margin-top:6px">Envoyé à vos clients fidèles</div>`;
    });
    after(2600, () => {
      const a = document.getElementById("mqd-act");
      if (a) a.innerHTML += `<div class="mqd-dots" style="margin-top:10px"><span>•</span><span>•</span><span>•</span></div>`;
    });
    after(4200, () => {
      const a = document.getElementById("mqd-act");
      a?.querySelector(".mqd-dots")?.remove();
      if (a) a.innerHTML += `<div class="mqd-msg c" style="opacity:1;transform:none;margin-top:6px">Julie — OUI je prends ❤️</div>`;
    });
    after(5000, () => {
      const sl = document.getElementById("mqd-sl");
      if (sl) { sl.classList.add("filled"); sl.innerHTML = "✓ 15 h — réservé par Julie"; }
    });
    after(5900, () => {
      setCard(
        check(34) +
          `<div class="mqd-final">Votre créneau vide vient d'être comblé —<br><span class="em">avant même que vous ayez rangé votre poste.</span></div>` +
          `<div class="mqd-tiny">simulation</div>` +
          nextBtns()
      );
    });
  };

  // ── Démo RÉPONDRE (santé/droit) — sobre, aucune sollicitation d'avis ──────────
  const playRepondre = () => {
    done.current.question = true;
    done.current.rdv = true;
    openStage(`<div class="mqd-ctx">21 h 47. Un ${data.clientTerm} hésite à vous appeler demain. Il écrit sur votre site…</div><div class="mqd-chat" id="mqd-ch"></div>`);
    const ch = () => document.getElementById("mqd-ch");
    const steps: Array<() => void> = [
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg c">Bonsoir, ${escapeHtml(data.practicalQ)}</div>`; },
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-typing" id="mqd-tp"><i></i><i></i><i></i></div>`; },
      () => { document.getElementById("mqd-tp")?.remove(); const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg a">Bonsoir, je vous réponds tout de suite. Souhaitez-vous aussi que je vous propose un rendez-vous ?</div>`; },
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg c">Oui, volontiers.</div>`; },
    ];
    steps.forEach((f, i) => after(700 + i * 1100, f));
    after(700 + steps.length * 1100 + 400, () => {
      setCard(
        `<div class="mqd-stamp"><svg class="mqd-check" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2.4"><path d="M4 12.5l5 5L20 6"/></svg> ${escapeHtml(data.bookedLabel)}</div>` +
          `<div class="mqd-final">Pendant que vous étiez en séance,<br><span class="em">votre ${data.clientTerm} a eu sa réponse — et un rendez-vous.</span></div>` +
          `<div class="mqd-tiny">aucune donnée de santé demandée · simulation</div>` +
          nextBtns()
      );
    });
  };

  // ── Démo PRÉPARER (santé/droit) — la veille du rendez-vous ────────────────────
  const playPreparer = () => {
    done.current.preparer = true;
    openStage(`<div class="mqd-ctx">La veille du rendez-vous, sans que vous ayez rien à faire…</div><div class="mqd-chat" id="mqd-ch"></div>`);
    const ch = () => document.getElementById("mqd-ch");
    const steps: Array<() => void> = [
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg a">Bonjour, votre rendez-vous est demain à ${data.slot}. Voici l'accès, le parking et ce qu'il faut prévoir.</div>`; },
      () => { const c = ch(); if (c) c.innerHTML += `<div class="mqd-typing" id="mqd-tp"><i></i><i></i><i></i></div>`; },
      () => { document.getElementById("mqd-tp")?.remove(); const c = ch(); if (c) c.innerHTML += `<div class="mqd-msg c">Merci, c'est noté !</div>`; },
    ];
    steps.forEach((f, i) => after(700 + i * 1100, f));
    after(700 + steps.length * 1100 + 400, () => {
      setCard(
        check(34) +
          `<div class="mqd-final">Votre ${data.clientTerm} arrive préparé —<br><span class="em">la séance commence dans les meilleures conditions.</span></div>` +
          `<div class="mqd-tiny">simulation</div>` +
          nextBtns()
      );
    });
  };

  const play = (kind: DemoKind) => {
    clearTimers();
    if (kind === "avis") playAvis();
    else if (kind === "rdv") playRdv();
    else if (kind === "creneau") playCreneau();
    else if (kind === "repondre") playRepondre();
    else if (kind === "preparer") playPreparer();
  };

  const showRecap = () => {
    clearTimers();
    const items: Array<[string, string]> = data.avisAllowed
      ? [
          ["avis", "gagner un nouvel avis Google"],
          ["question", `répondre à un ${data.clientTerm}`],
          ["rdv", "avancer une réservation"],
          ["creneau", "aider à remplir un créneau libre"],
        ]
      : [
          ["question", `répondre à un ${data.clientTerm}`],
          ["rdv", "proposer un rendez-vous"],
          ["preparer", "préparer une consultation"],
        ];
    const li = items
      .map(
        ([k, t]) =>
          `<li class="${done.current[k] ? "done" : ""}"><span class="cbox">${done.current[k] ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 12.5l4 4L19 7"/></svg>' : ""}</span>${t}</li>`
      )
      .join("");
    openStage(
      `<div class="mqd-recap"><div class="rt">Pendant que vous découvriez<br>cette maquette…</div>` +
        `<div class="rs">votre futur site aurait déjà pu :</div><ul>${li}</ul>` +
        `<div class="punch">Ce site ne se contente pas d'être beau.<br><span class="em">Il travaille.</span></div></div>` +
        `<div class="mqd-next"><button class="ghost" data-close>Revenir au site</button><button class="fill" data-close>Je veux ce site</button></div>`
    );
  };

  // Écoute des pastilles + délégation des clics des boutons injectés dans la carte.
  useEffect(() => {
    const onDemo = (e: Event) => {
      const kind = (e as CustomEvent).detail?.kind as DemoKind | undefined;
      if (kind) play(kind);
    };
    window.addEventListener("maquette-demo", onDemo);
    return () => {
      window.removeEventListener("maquette-demo", onDemo);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t === e.currentTarget) { closeStage(); return; }
    if (t.closest("[data-close]")) { closeStage(); return; }
    if (t.closest("[data-recap]")) { showRecap(); return; }
  };

  return (
    <>
      <style>{mqdStyles(accent)}</style>
      {on && (
        <div className="mqd-stage on" onClick={onStageClick}>
          <div className="mqd-card" ref={cardRef} />
        </div>
      )}
    </>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function mqdStyles(accent: string): string {
  return `
  .mqd-anchor{position:absolute;top:12px;right:12px;z-index:9;}
  .mqd-dot{width:34px;height:34px;border-radius:50%;background:#B8862F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;border:2px solid #fff;box-shadow:0 4px 14px rgba(184,134,47,.6);position:relative;}
  .mqd-dot::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid #B8862F;animation:mqdPulse 2s infinite;}
  @keyframes mqdPulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2);opacity:0}}
  @media (prefers-reduced-motion:reduce){.mqd-dot::after{animation:none;}}
  .mqd-anchor.primary .mqd-dot{transform:scale(1.06);}
  .mqd-hint{position:absolute;right:40px;top:4px;white-space:nowrap;background:#16160F;color:#FBFAF7;font-size:10px;font-weight:600;padding:5px 9px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.22);}
  .mqd-pop{position:absolute;top:44px;right:0;width:250px;max-width:78vw;background:#16160F;color:#FBFAF7;border-radius:16px;padding:15px 16px;z-index:21;box-shadow:0 20px 50px -12px rgba(0,0,0,.6);animation:mqdPopin .3s;}
  @keyframes mqdPopin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .mqd-pop .mqd-eb{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#D8B056;font-weight:700;margin-bottom:7px;}
  .mqd-pop h4{font-family:Georgia,serif;font-size:15.5px;font-weight:600;margin-bottom:5px;line-height:1.25;}
  .mqd-pop p{font-size:11.5px;color:#C9CFC4;line-height:1.45;margin-bottom:12px;}
  .mqd-pop .mqd-go{background:#D8B056;color:#211B10;border:none;border-radius:20px;padding:10px 16px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;width:100%;}
  .mqd-pop .mqd-x{position:absolute;top:10px;right:13px;color:#8A9186;cursor:pointer;font-size:15px;}
  .mqd-stage{position:fixed;inset:0;max-width:520px;margin:0 auto;background:rgba(12,14,11,.82);z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px;backdrop-filter:blur(2px);}
  .mqd-card{background:#FFF;border-radius:20px;padding:22px 20px;width:100%;max-width:300px;text-align:center;position:relative;overflow:hidden;animation:mqdCardin .35s;}
  @keyframes mqdCardin{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  .mqd-ctx{font-size:11.5px;color:#71766C;margin-bottom:14px;line-height:1.4;}
  .mqd-big{font-family:Georgia,serif;font-size:56px;font-weight:600;line-height:1;color:${accent};display:inline-block;}
  .mqd-big.bump{animation:mqdBump .4s;}
  @keyframes mqdBump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
  .mqd-starline{color:#B8862F;font-size:17px;margin-top:6px;letter-spacing:2px;}
  .mqd-plus{position:absolute;left:50%;top:44%;transform:translateX(-50%);font-family:Georgia,serif;font-weight:600;font-size:24px;color:#B8862F;opacity:0;}
  .mqd-plus.fly{animation:mqdFly 1.1s forwards;}
  @keyframes mqdFly{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}25%{opacity:1}100%{opacity:0;transform:translate(-50%,-60px) scale(1.1)}}
  .mqd-conf{position:absolute;width:7px;height:7px;border-radius:1px;opacity:0;}
  @keyframes mqdConf{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(70px) rotate(220deg)}}
  .mqd-chat{display:flex;flex-direction:column;gap:7px;text-align:left;}
  .mqd-msg{padding:9px 12px;border-radius:13px;font-size:12px;line-height:1.35;max-width:90%;opacity:0;transform:translateY(6px);animation:mqdMsgin .35s forwards;}
  .mqd-msg.c{background:#EEEBE4;border-bottom-left-radius:4px;align-self:flex-start;}
  .mqd-msg.a{background:${accent};color:#FBFAF7;border-bottom-right-radius:4px;align-self:flex-end;}
  .mqd-msg.wa{background:#DCF8C6;border-bottom-right-radius:4px;align-self:flex-end;}
  .mqd-msg.notif{background:#16160F;color:#FBFAF7;align-self:stretch;max-width:100%;text-align:center;font-weight:600;}
  @keyframes mqdMsgin{to{opacity:1;transform:translateY(0)}}
  .mqd-typing{display:inline-flex;gap:3px;padding:9px 12px;background:#EEEBE4;border-radius:13px;align-self:flex-start;}
  .mqd-typing i{width:5px;height:5px;border-radius:50%;background:#B7B3A8;animation:mqdTd 1s infinite;}
  .mqd-typing i:nth-child(2){animation-delay:.2s} .mqd-typing i:nth-child(3){animation-delay:.4s}
  @keyframes mqdTd{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
  .mqd-stamp{margin-top:2px;border:1.5px solid ${accent};border-radius:13px;padding:12px;display:flex;align-items:center;gap:10px;justify-content:center;color:${accent};font-weight:700;font-size:13px;opacity:0;animation:mqdStampin .45s .1s forwards;}
  @keyframes mqdStampin{0%{opacity:0;transform:scale(1.15) rotate(-3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
  .mqd-check{width:20px;height:20px;flex:none;}
  .mqd-check path{stroke-dasharray:26;stroke-dashoffset:26;animation:mqdDraw .5s .25s forwards;}
  @keyframes mqdDraw{to{stroke-dashoffset:0}}
  .mqd-slot{margin:10px 0;border:1.5px dashed #C9A24A;border-radius:12px;padding:12px;font-size:12.5px;color:#B8862F;font-weight:600;background:#FBF6EA;transition:.4s;}
  .mqd-slot.filled{border:1.5px solid ${accent};border-style:solid;background:#E9F0EA;color:${accent};}
  .mqd-dots{font-size:20px;letter-spacing:3px;color:#71766C;}
  .mqd-dots span{opacity:.3;animation:mqdBlink 1.2s infinite;} .mqd-dots span:nth-child(2){animation-delay:.2s} .mqd-dots span:nth-child(3){animation-delay:.4s}
  @keyframes mqdBlink{0%,100%{opacity:.3}50%{opacity:1}}
  .mqd-final{font-family:Georgia,serif;font-size:16px;font-weight:600;line-height:1.35;margin-top:15px;color:#16160F;}
  .mqd-final .em{color:#B8862F;}
  .mqd-tiny{font-size:9px;color:#A6A69C;margin-top:9px;font-style:italic;letter-spacing:.02em;}
  .mqd-next{margin-top:16px;display:flex;gap:8px;}
  .mqd-next button{flex:1;border-radius:20px;padding:10px;font-size:11.5px;font-weight:600;font-family:inherit;cursor:pointer;border:none;}
  .mqd-next .ghost{background:transparent;border:1px solid #E7E4DC;color:#71766C;}
  .mqd-next .fill{background:#16160F;color:#FBFAF7;}
  .mqd-recap .rt{font-family:Georgia,serif;font-size:18px;font-weight:600;line-height:1.25;margin-bottom:4px;}
  .mqd-recap .rs{font-size:11px;color:#71766C;margin-bottom:14px;}
  .mqd-recap ul{list-style:none;text-align:left;display:flex;flex-direction:column;gap:9px;margin-bottom:14px;}
  .mqd-recap li{display:flex;gap:9px;align-items:center;font-size:12.5px;opacity:.4;transition:.4s;}
  .mqd-recap li.done{opacity:1;font-weight:600;}
  .mqd-recap li .cbox{width:20px;height:20px;border-radius:6px;border:1.5px solid #E7E4DC;flex:none;display:flex;align-items:center;justify-content:center;}
  .mqd-recap li.done .cbox{background:${accent};border-color:${accent};}
  .mqd-recap .punch{font-family:Georgia,serif;font-size:16px;font-weight:600;padding-top:12px;border-top:1px solid #E7E4DC;}
  .mqd-recap .punch .em{color:#B8862F;}
  `;
}
