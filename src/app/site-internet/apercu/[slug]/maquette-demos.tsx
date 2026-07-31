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
import { initCloudTts, unlockAudio, speak, stopSpeaking } from "@/lib/site-internet/speech";
import { publishDemoOffer } from "./demo-offer";
import { campagneFallback, type Campagne } from "@/lib/site-internet/campagne";

export type MaquetteAssistantData = {
  nom: string; // nom du commerce, pour les messages (« chez … »)
  clientTerm: string; // singulier : « client » / « patient »
  reviewsCount: number | null; // départ du compteur d'avis
  slot: string; // créneau illustratif, ex. « samedi 15 h 30 »
  avisAllowed: boolean; // déonto none (A/B) → avis + créneau ; sinon (C/D) sobre
  ville?: string; // ville, pour le « collectif de … »
  metier?: string; // libellé métier, pour les hashtags de la publication Instagram
  photo?: string; // une VRAIE photo du commerce, pour le visuel Instagram
};

// Parcours Action Flash en 4 temps : je choisis → je dis → je vérifie → c'est publié.
type View = "home" | "avisIn" | "avisPrev" | "creneauIn" | "creneauSay" | "creneauPrev" | "questionIn";

// Icônes homogènes (traits fins) — plus sobres que des emojis dépareillés.
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICO = {
  slot: "M8 2v3M16 2v3M3.5 9h17M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z",
  event: "M12 3l2.1 4.5 4.9.6-3.6 3.4.9 4.9-4.3-2.4-4.3 2.4.9-4.9L5 8.1l4.9-.6L12 3Z",
  offer: "M20.5 12.3 12.8 20a1.6 1.6 0 0 1-2.3 0l-7-7A1.6 1.6 0 0 1 3 11.8V5a2 2 0 0 1 2-2h6.8c.4 0 .8.2 1.1.5l7.6 7.6a1.6 1.6 0 0 1 0 2.2ZM7.5 7.5h.01",
  product: "M3.5 7.5 12 3l8.5 4.5M3.5 7.5V16L12 21m-8.5-13.5L12 12m0 9 8.5-5V7.5M12 21v-9m8.5-4.5L12 12",
} as const;

// Progression : trois temps de SAISIE seulement. Les écrans de résultat
// (« c'est publié », « options prêtes ») sont volontairement hors compteur —
// un résultat n'est pas une étape, et le chemin Pro en compte plusieurs.
const STEP_LABELS = ["Je choisis", "Je décris", "Je vérifie"] as const;
const Steps = ({ n }: { n: 1 | 2 | 3 }) => (
  <div className="asx-steps">
    <span className="asx-segs" aria-hidden="true">
      {STEP_LABELS.map((_, i) => (
        <span key={i} className={i < n ? "on" : ""} />
      ))}
    </span>
    <span className="asx-steplb">{STEP_LABELS[n - 1]}</span>
  </div>
);

export function MaquetteAssistant({ accent, data, slug }: { accent: string; data: MaquetteAssistantData; slug: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  // Le catalogue est celui d'UNE ville : on la nomme partout où on en parle.
  const villeNom = data.ville || "votre ville";
  const [stageOn, setStageOn] = useState(false);
  const [fn, setFn] = useState(""); // texte de l'annonce (Action Flash)
  const [cli, setCli] = useState(""); // prénom du·de la client à remercier (parcours avis)
  const [ph, setPh] = useState("");
  // Canaux d'une Action Flash : le site est TOUJOURS inclus (gratuit) ; les options
  // (WhatsApp / réseaux / réservation) sont décochées par défaut — aucune ambiguïté.
  const [optWa, setOptWa] = useState(false);
  const [optSocial, setOptSocial] = useState(false);
  const [optResa, setOptResa] = useState(false);
  const [obj, setObj] = useState(0); // objectif choisi (étape 1)
  const [said, setSaid] = useState(""); // ce que le pro veut annoncer (étape 2)
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState(false); // « Modifier l'annonce »
  const [atBottom, setAtBottom] = useState(false); // masque la pilule au pied de page
  const cardRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);
  const introRef = useRef(false); // accueil vocal joué une seule fois

  // Q&A commercial : le pro pose ses questions, l'assistante (Audrey / Jean-Philippe) répond.
  type QA = { who: "me" | "ai"; text: string };
  const [qa, setQa] = useState<QA[]>([]);
  const [qaInput, setQaInput] = useState("");
  const [qaBusy, setQaBusy] = useState(false);
  const qaScroll = useRef<HTMLDivElement | null>(null);

  // Ouvre le panneau + accueil vocal (dans le geste → débloque la voix cloud iOS).
  const handleOpen = () => {
    setView("home");
    setStageOn(false);
    setOpen(true);
    if (!introRef.current) {
      introRef.current = true;
      try { initCloudTts({ slug, scope: "apercu" }); unlockAudio(); } catch { /* best-effort */ }
      // Court et sans re-« Bonjour » : la Démo Vivante a déjà accueilli le pro.
      // On rappelle juste l'essentiel (simulation) puis on l'invite à déléguer.
      speak("L'Action Flash, c'est le vôtre. Tout ici est une simulation — rien n'est envoyé à personne. Dites-moi simplement ce que vous voulez obtenir.");
    }
  };
  const openRef = useRef(handleOpen);
  openRef.current = handleOpen;

  const askQa = async () => {
    const q = qaInput.trim();
    if (!q || qaBusy) return;
    setQaInput("");
    const history = qa.map((m) => ({ role: m.who, text: m.text }));
    setQa((t) => [...t, { who: "me", text: q }]);
    setQaBusy(true);
    try {
      const r = await fetch("/api/site-internet/apercu/sales-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message: q, history }),
      });
      const j = await r.json().catch(() => ({}));
      const reply = typeof j.reply === "string" && j.reply ? j.reply : "Appelez-nous au 07 68 23 33 47, on vous répond avec plaisir.";
      setQa((t) => [...t, { who: "ai", text: reply }]);
      speak(reply);
    } catch {
      setQa((t) => [...t, { who: "ai", text: "Je n'arrive pas à répondre à l'instant — appelez-nous au 07 68 23 33 47 🙂" }]);
    } finally {
      setQaBusy(false);
    }
  };

  useEffect(() => {
    if (qaScroll.current) qaScroll.current.scrollTop = qaScroll.current.scrollHeight;
  }, [qa, qaBusy]);

  const { nom, clientTerm, avisAllowed, slot } = data;
  const term = clientTerm || "client"; // singulier

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  const after = (ms: number, fn2: () => void) => timers.current.push(window.setTimeout(fn2, ms));
  // Garde-fou anti-« clic traversant » : le temps qu'une carte s'affiche, un tap
  // encore en vol ne doit pas déclencher son bouton principal.
  const cardAt = useRef(0);
  const setCard = (html: string) => {
    cardAt.current = Date.now();
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
    setCli("");
    setPh("");
    // On repart d'un parcours propre (sinon l'état d'édition ou les options
    // cochées se retrouveraient dans l'annonce suivante).
    setSaid("");
    setEditing(false);
    setWriting(false);
    setOptWa(false);
    setOptSocial(false);
    setOptResa(false);
    setOpen(true);
  };

  useEffect(() => () => clearTimers(), []);

  // Ouverture depuis les CTA du site (« 💬 Parler à mon assistante »).
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-assistant-open]")) {
        e.preventDefault();
        openRef.current();
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Masque la pilule quand on atteint le pied de page (sinon elle recouvre le
  // formulaire « être rappelé »). Réaffichée dès qu'on remonte.
  useEffect(() => {
    const onScroll = () => {
      const rest = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      setAtBottom(rest < 150);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const n0 = data.reviewsCount ?? 0;
  const rtn = `<button class="asx-rtn" data-return>Revenir à mon assistante ✦</button>`;
  const tiny = (t: string) => `<div class="asx-tiny">${t}</div>`;

  // ── BILAN cumulatif ─ Le meilleur moment de vente : à partir de la 2ᵉ tâche
  //    vécue (pic émotionnel), on récapitule UNIQUEMENT ce que le pro vient de
  //    vivre (jamais une promesse inventée) puis on pousse à l'installation.
  const doneRef = useRef<string[]>([]);
  const bilanLine: Record<string, string> = {
    avis: "obtenir un nouvel avis Google",
    question: `répondre à un(e) ${term}`,
    creneau: avisAllowed ? "faire une annonce à tous vos client(e)s (créneau, promo, événement) pour vendre plus" : "aider à remplir un créneau libéré",
    preparer: "préparer une réservation",
  };
  const bilanHtml = () => {
    const items = doneRef.current
      .map((k) => `<div class="asx-bl"><span>✓</span> ${esc(bilanLine[k] || "")}</div>`)
      .join("");
    return (
      `<div class="asx-final" style="margin-top:0">Pendant cette minute, votre futur site aurait déjà pu&nbsp;:</div>` +
      `<div class="asx-blist">${items}</div>` +
      `<div class="asx-blsig">Ce site ne se contente pas d'être beau.<br><b>Il travaille avec vous.</b></div>` +
      `<button class="asx-cta" data-cta>⚡ Je veux ce site — être rappelé</button>` +
      `<button class="asx-rtn" data-continue>Continuer à explorer</button>`
    );
  };
  // Fin d'une démo : bilan dès la 2ᵉ tâche vécue, sinon la conclusion simple.
  const showFinal = (key: string, coreHtml: string) => {
    if (!doneRef.current.includes(key)) doneRef.current.push(key);
    setCard(doneRef.current.length >= 2 ? bilanHtml() : coreHtml + rtn);
  };
  // « Je veux ce site » : ferme l'assistante et amène au formulaire d'appel.
  const goBuy = () => {
    clearTimers();
    setStageOn(false);
    setOpen(false);
    setView("home");
    requestAnimationFrame(() =>
      document.getElementById("site-rappel")?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  // ── AVIS : message envoyé → l'avis Google apparaît → compteur n → n+1 ─────────
  const playAvis = () => {
    const who = cli.trim() || `votre ${term}`;
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
    after(6300, () =>
      showFinal("avis",
        `<div class="asx-final"><span class="em">Un nouvel avis Google</span> vient renforcer votre réputation.</div>` +
          `<div class="asx-starline" style="font-size:13px;margin-top:6px">${n0} → ${n0 + 1} avis</div>` +
          tiny("simulation")
      )
    );
  };

  // ── ANNONCE ──────────────────────────────────────────────────────────────────
  // Deux expériences NETTEMENT distinctes, une seule pop-up forte chacune :
  //  • GRATUIT  → « c'est fait » : l'annonce apparaît, on montre le résultat.
  //  • OPTIONS  → « c'est prêt » : la mini-campagne est préparée, RIEN n'est envoyé.
  // Règle absolue : jamais « ont été prévenus », toujours « pourraient être prévenus ».
  const bandHtml = (msg: string) =>
    `<div class="asx-band"><span class="asx-band-k">🎉 Offre du moment</span><span class="asx-band-t">${esc(msg)}</span></div>`;

  const freeFinal = (msg: string) =>
    `<div class="asx-done-k">✅ Action terminée</div>` +
    `<div class="asx-done-h">Votre annonce est en ligne 🎉</div>` +
    `<div class="asx-done-s">Elle est maintenant visible en haut de votre site, par toutes les personnes qui le consultent.</div>` +
    bandHtml(msg) +
    `<div class="asx-proofs">` +
      `<div class="asx-proof"><span>🌐</span>Visible tout de suite sur votre site</div>` +
      `<div class="asx-proof"><span>📍</span>Dans le catalogue de ${villeNom}, à parcourir<sup>*</sup></div>` +
      `<div class="asx-proof"><span>🎁</span>100 % gratuit · modifiable quand vous voulez</div>` +
    `</div>` +
    `<div class="asx-aster">* Le catalogue de ${villeNom} rassemble les annonces du jour des commerçants d'ici — chaque site du réseau en montre une fenêtre.</div>` +
    `<button class="asx-cta2" data-seeoffer>Voir mon annonce sur le site</button>` +
    `<button class="asx-rtn" data-tooptions>Découvrir comment toucher plus de monde</button>` +
    tiny("Aucune diffusion extérieure n'a été effectuée.");

  // Écran Pro : on n'affiche QUE les canaux réellement cochés, sans jamais avancer
  // de nombre de contacts inventé, et le bouton demande une activation — il ne
  // simule pas un paiement qui n'existe pas.
  // Un son court, deux notes montantes. Web Audio : aucun fichier à charger, et
  // l'échec est silencieux (navigateur sans autorisation audio).
  const chime = () => {
    try {
      const AC = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const Ctor = AC.AudioContext || AC.webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const now = ctx.currentTime;
      [660, 990].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        o.type = "sine";
        g.gain.setValueAtTime(0, now + i * 0.11);
        g.gain.linearRampToValueAtTime(0.075, now + i * 0.11 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.3);
        o.connect(g).connect(ctx.destination);
        o.start(now + i * 0.11);
        o.stop(now + i * 0.11 + 0.32);
      });
    } catch {
      /* pas de son : l'animation se suffit */
    }
  };

  // Les canaux retenus, dans l'ordre où ils apparaissent à l'écran.
  const canaux = (wa: boolean, social: boolean, resa: boolean) =>
    [
      wa && { id: "wa", ic: "📱", nom: "WhatsApp", etapes: ["Message raccourci", "Ton adapté", "Invitation à répondre"] },
      social && { id: "ig", ic: "📸", nom: "Instagram", etapes: ["Visuel choisi", "Légende écrite", "Hashtags ajoutés"] },
      social && { id: "fb", ic: "👍", nom: "Facebook", etapes: ["Texte développé", "Lien de réservation"] },
      resa && !social && { id: "fb", ic: "📅", nom: "Réservation", etapes: ["Lien ajouté à l'annonce"] },
    ].filter(Boolean) as Array<{ id: string; ic: string; nom: string; etapes: string[] }>;

  // L'ATELIER — la phrase du pro se dédouble et se métamorphose. On montre le
  // TRAVAIL, jamais un envoi : aucune coche de livraison, aucun destinataire.
  const atelierHtml = (msg: string, wa: boolean, social: boolean, resa: boolean) => {
    const list = canaux(wa, social, resa);
    const cards = list
      .map(
        (c, i) =>
          `<div class="atl-c atl-${c.id}" style="--d:${0.55 + i * 0.22}s">` +
            `<div class="atl-h"><span class="atl-ic">${c.ic}</span>${c.nom}</div>` +
            (c.id === "ig" && data.photo
              ? `<div class="atl-img" style="background-image:url(&quot;${esc(data.photo)}&quot;)"></div>`
              : "") +
            `<div class="atl-t" data-ch="${c.id}">${esc(msg)}</div>` +
            `<div class="atl-steps">` +
              c.etapes.map((e, k) => `<span class="atl-s" style="--sd:${1.5 + i * 0.2 + k * 0.28}s">${esc(e)}</span>`).join("") +
            `</div>` +
          `</div>`
      )
      .join("");
    return (
      `<div class="atl">` +
        `<div class="atl-orb">✦</div>` +
        `<div class="atl-say">Je prépare votre campagne.</div>` +
        `<div class="atl-src">«&nbsp;${esc(msg)}&nbsp;»</div>` +
        `<div class="atl-cards">${cards}</div>` +
      `</div>`
    );
  };

  // Les textes réels arrivent (IA ou repli) : ils remplacent la phrase source dans
  // chaque carte, ce qui rend la MÉTAMORPHOSE visible à l'écran.
  const fillAtelier = (c: Campagne, wa: boolean, social: boolean, resa: boolean) => {
    const map: Record<string, string> = { wa: c.wa, ig: c.insta, fb: c.fb };
    canaux(wa, social, resa).forEach((ch) => {
      const el = document.querySelector<HTMLElement>(`.atl-t[data-ch="${ch.id}"]`);
      const txt = map[ch.id];
      if (!el || !txt) return;
      el.classList.add("swap");
      window.setTimeout(() => {
        el.textContent = txt;
        el.classList.remove("swap");
      }, 180);
    });
  };

  // Écran final : les TROIS publications, telles qu'elles sont, côte à côte. Ce
  // qui vend l'option, c'est de voir trois objets différents nés d'une phrase.
  const proFinal = (msg: string, wa: boolean, social: boolean, resa: boolean, c: Campagne) => {
    const post = (ic: string, nom: string, texte: string, img?: string) =>
      `<div class="asx-post">` +
        `<div class="asx-post-h"><span>${ic}</span>${nom}</div>` +
        (img ? `<div class="asx-post-img" style="background-image:url(&quot;${esc(img)}&quot;)"></div>` : "") +
        `<div class="asx-post-t">${esc(texte)}</div>` +
      `</div>`;
    const n = [wa, social, social, resa && !social].filter(Boolean).length;
    return (
      `<div class="asx-pro-k">✨ Options Pro</div>` +
      `<div class="asx-done-h">Votre campagne est prête.</div>` +
      `<div class="asx-done-s"><b>${n} publications prêtes. Vous n'avez écrit qu'une phrase.</b><br>` +
        `Rien n'est parti&nbsp;: vous relisez, vous validez, et c'est vous qui choisissez le moment.</div>` +
      `<div class="asx-posts">` +
        (wa ? post("📱", "WhatsApp", c.wa) : "") +
        (social ? post("📸", "Instagram", c.insta, data.photo) : "") +
        (social ? post("👍", "Facebook", c.fb) : "") +
        (resa && !social ? post("📅", "Réservation", c.fb) : "") +
      `</div>` +
      `<div class="asx-glab" style="text-align:left">Et sur votre site, déjà en ligne</div>` +
      bandHtml(msg) +
      `<div class="asx-pricebox">Options Pro&nbsp;: <b>29 €/mois</b><span>sans engagement · résiliable à tout moment</span></div>` +
      `<div class="asx-nono">Aucun message ne sera envoyé et aucun paiement ne sera effectué aujourd'hui.</div>` +
      `<button class="asx-cta2 pro" data-proask>Demander l'activation Pro</button>` +
      `<button class="asx-link" data-freeonly>Continuer gratuitement</button>`
    );
  };

  // « Demander l'activation Pro » : on enregistre une INTENTION (best-effort), et
  // surtout le pro ne perd pas le bénéfice gratuit — son annonce est publiée.
  const askPro = () => {
    const opts = [optWa && "WhatsApp", optSocial && "Facebook & Instagram", optResa && "Lien de réservation"]
      .filter(Boolean)
      .join(", ");
    try {
      void fetch("/api/site-internet/apercu/pro-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, options: opts, annonce: fn }),
        keepalive: true,
      }).catch(() => { /* best-effort : la confirmation s'affiche quand même */ });
    } catch {
      /* best-effort */
    }
    publishDemoOffer(fn); // l'annonce gratuite est publiée quoi qu'il arrive
    setCard(
      `<div class="asx-done-k">✅ Action terminée</div>` +
        `<div class="asx-done-h">Votre annonce est en ligne sur votre site 🎉</div>` +
        bandHtml(fn) +
        `<div class="asx-pronote"><b>Votre demande Pro est enregistrée.</b>` +
          `Nous vous présenterons les conditions définitives avant toute activation ou facturation.` +
          (opts ? `<span>Options demandées&nbsp;: ${esc(opts)}</span>` : "") +
        `</div>` +
        `<button class="asx-cta2" data-seeoffer>Voir mon annonce</button>` +
        `<button class="asx-link" data-return>Revenir à mon assistante</button>` +
        tiny("Aucun message n'a été envoyé, aucun paiement n'a été effectué.")
    );
  };

  const playCreneau = (msg: string, wa: boolean, social: boolean, resa: boolean) => {
    if (!wa && !social && !resa) {
      // GRATUIT — on montre l'annonce qui apparaît, puis UNE pop-up « c'est fait ».
      publishDemoOffer(msg); // le site entier se met à jour derrière la pop-up
      openStage(`<div class="asx-ctx">Votre annonce s'affiche en haut de votre site…</div><div class="asx-bandwrap">${bandHtml(msg)}</div>`);
      after(1400, () => setCard(freeFinal(msg)));
      if (!doneRef.current.includes("creneau")) doneRef.current.push("creneau");
      return;
    }
    // OPTIONS — « l'atelier » : sa phrase se dédouble et se métamorphose en trois
    // publications, chacune habillée pour son canal. Ce n'est PAS un envoi : c'est
    // une fabrication montrée. Le mot « envoyé » n'apparaît nulle part.
    openStage(atelierHtml(msg, wa, social, resa));
    chime();
    // La génération part tout de suite ; l'animation (≈4,5 s) la couvre. Le repli
    // déterministe est déjà prêt : l'écran n'attend jamais le réseau.
    const secours = campagneFallback(msg, nom, data.metier || "", data.ville || "");
    let camp: Campagne = secours;
    void fetch("/api/site-internet/apercu/campagne", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, annonce: msg }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j && typeof j.wa === "string") camp = { wa: j.wa, insta: j.insta, fb: j.fb };
      })
      .catch(() => { /* le repli reste en place */ });
    // Les textes réels remplissent les cartes dès qu'ils arrivent (ou le repli).
    after(2600, () => fillAtelier(camp, wa, social, resa));
    after(4600, () => { chime(); setCard(proFinal(msg, wa, social, resa, camp)); });
    if (!doneRef.current.includes("creneau")) doneRef.current.push("creneau");
  };

  // Publication (gratuite) : le moment de satisfaction qui manquait.
  const publishFree = () => {
    publishDemoOffer(fn);
    setCard(
      `<div class="asx-done-k">✅ Action terminée</div>` +
        `<div class="asx-done-h">Votre annonce est en ligne 🎉</div>` +
        `<div class="asx-done-s">Elle est visible en haut de votre site, par toutes les personnes qui le consultent.</div>` +
        bandHtml(fn) +
        `<button class="asx-cta2" data-seeoffer>Voir mon annonce sur le site</button>` +
        `<button class="asx-link" data-return>Revenir à mon assistante</button>` +
        tiny("Aucune diffusion extérieure n'a été effectuée.")
    );
  };

  // « Voir mon annonce sur le site » : on ferme l'assistante et on emmène le pro
  // au vrai bandeau, avec un halo + une bulle « voici ce que verront vos visiteurs ».
  // « Voir mon annonce sur le site » — le moment de vérité de l'Action Flash.
  // Le bandeau, le catalogue, l'aperçu de notification et le collectif écoutent
  // tous le même canal (demo-offer) : l'annonce y est déjà. Ici on se contente
  // d'emmener le commerçant la voir.
  const seeOffer = () => {
    clearTimers();
    setStageOn(false);
    setOpen(false);
    setView("home");
    publishDemoOffer(fn); // filet : si la publication n'a pas eu lieu, elle a lieu ici
    requestAnimationFrame(() => {
      const band = document.querySelector<HTMLElement>(".offer-band");
      if (band) band.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      // La bulle attend la fin du défilement : sinon elle s'affiche en bas d'écran
      // pendant que la page voyage encore, et c'est tout ce qu'on voit.
      window.setTimeout(() => {
        if (band) {
          band.classList.add("asx-glow");
          window.setTimeout(() => band.classList.remove("asx-glow"), 2600);
        }
        const tip = document.createElement("div");
        tip.className = "asx-tip";
        tip.textContent = "Votre annonce est en haut de votre site — et dans tout le reste.";
        document.body.appendChild(tip);
        window.setTimeout(() => tip.remove(), 4200);
      }, 700);
    });
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
        ? `<div class="asx-stamp">✓ Réservé — ${esc(slot)}</div><div class="asx-final">Pendant que vous étiez occupé(e),<br><span class="em">un nouveau ${term} a déjà été pris en charge.</span></div>`
        : `<div class="asx-final">Votre ${term} a eu sa réponse —<br><span class="em">sans que vous ayez à décrocher.</span></div>`;
      showFinal("question", fin + tiny(`${avisAllowed ? "vous n'avez pas décroché" : "aucune donnée de santé demandée"} · simulation`));
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
      showFinal("preparer", `<div class="asx-final">Votre ${term} arrive préparé —<br><span class="em">la séance commence dans les meilleures conditions.</span></div>` + tiny("simulation"))
    );
  };

  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // La carte vient d'apparaître : ce clic appartient au geste précédent.
    if (Date.now() - cardAt.current < 650) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-cta]")) goBuy();
    else if (t.closest("[data-seeoffer]")) seeOffer();
    else if (t.closest("[data-proask]")) askPro();
    else if (t.closest("[data-freeonly],[data-publish]")) publishFree();
    else if (t.closest("[data-tooptions]")) {
      // « Découvrir comment toucher plus de monde » → retour à l'écran des options,
      // en rappelant que l'annonce est DÉJÀ en ligne gratuitement.
      clearTimers();
      setStageOn(false);
      setView("creneauPrev");
      setOpen(true);
    } else if (t.closest("[data-return],[data-continue]")) backHome();
  };

  // ── Rendu du corps du panneau (React) ────────────────────────────────────────
  const questions = avisAllowed
    ? ["« Vous auriez de la place cette semaine ? »", "« Comment prendre rendez-vous ? »", "« Vous êtes ouvert ce week-end ? »"]
    : ["« Comment prendre rendez-vous ? »", "« Prenez-vous de nouveaux patients ? »", "« Où êtes-vous situé ? »"];
  // Action Flash : l'objectif du pro (créneau / événement / offre / déstockage).
  // `ex` = l'exemple montré DANS UN BLOC À PART (jamais dans le champ, sinon on
  // le prend pour du texte déjà saisi) ; `msg` = l'annonce si le pro le reprend.
  const offres: Array<{ label: string; ico: string; ex: string; msg: string }> = [
    { label: "Annoncer une disponibilité", ico: ICO.slot, ex: "Il me reste 4 places jeudi à 18 h.", msg: `Une place se libère bientôt chez ${nom}. Envie d'en profiter ? Répondez OUI, je vous la réserve 🙂` },
    { label: "Annoncer un événement", ico: ICO.event, ex: "Portes ouvertes samedi de 10 h à 17 h.", msg: `Bientôt chez ${nom} : un moment spécial rien que pour vous. Vous venez ? Répondez OUI 🙂` },
    { label: "Partager une offre spéciale", ico: ICO.offer, ex: "-20 % sur les abonnements cette semaine.", msg: `Cette semaine chez ${nom} : -20 % sur notre coup de cœur. Répondez OUI pour réserver le vôtre ✨` },
    { label: "Mettre un produit en avant", ico: ICO.product, ex: "Nouveaux tapis en boutique, série limitée.", msg: `Dernières pièces chez ${nom} — une belle occasion à saisir. Ça vous intéresse ? Répondez OUI 🙂` },
  ];
  const plural = term === "patient" ? "patients" : "client(e)s";

  const renderBody = () => {
    if (view === "avisIn") {
      const ready = cli.trim() && ph.trim();
      return (
        <>
          <button className="asx-back" onClick={() => setView("home")}>‹ Retour</button>
          <div className="asx-say">Bien sûr. Indiquez-moi le·la {term} à remercier — je lui écrirai pour l’inviter à laisser un avis.</div>
          <div className="asx-field"><label>Prénom du·de la {term}</label><input value={cli} onChange={(e) => setCli(e.target.value)} placeholder="Ex. Julie" /></div>
          <div className="asx-field"><label>Son numéro WhatsApp</label><input value={ph} onChange={(e) => setPh(e.target.value)} placeholder="Ex. 06 12 34 56 78" inputMode="tel" /></div>
          <button className="asx-send" disabled={!ready} onClick={() => setView("avisPrev")}>Préparer le message</button>
        </>
      );
    }
    if (view === "avisPrev") {
      const who = cli.trim() || `votre ${term}`;
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
          <Steps n={1} />
          <div className="asx-say"><b>Que voulez-vous annoncer&nbsp;?</b> Je prépare tout et je vous montre <b>exactement</b> ce que je vais faire — vous validez avant l’envoi.</div>
          <div className="asx-objs">
            {offres.map((o, i) => (
              <button
                key={o.label}
                type="button"
                className={`asx-obj${i === 0 ? " reco" : ""}`}
                onClick={() => { setObj(i); setSaid(""); setFn(""); setView("creneauSay"); }}
              >
                <span className="oi"><Ico d={o.ico} /></span>
                <span className="ot">{o.label}</span>
                {i === 0 && <span className="obadge">le plus courant</span>}
                <span className="oc">›</span>
              </button>
            ))}
          </div>
        </>
      );
    }
    // ── ÉTAPE 2 : le pro DIT ce qu'il veut annoncer (c'est SON annonce, pas une
    //    annonce préfabriquée). Il peut écrire, ou valider l'exemple proposé.
    if (view === "creneauSay") {
      const o = offres[obj] ?? offres[0];
      // `mine` = le pro a écrit sa phrase ; sinon il reprend l'exemple affiché.
      const write = (mine: boolean) => {
        setWriting(true);
        window.setTimeout(() => {
          setWriting(false);
          setFn(mine ? `${said.trim()} — chez ${nom}. Répondez OUI, je vous réserve ça 🙂` : o.msg);
          setView("creneauPrev");
        }, 1100);
      };
      return (
        <>
          <button className="asx-back" onClick={() => setView("creneauIn")}>‹ Retour</button>
          <Steps n={2} />
          <div className="asx-say"><b>Dites-moi en une phrase.</b> Je rédige l’annonce pour vous.</div>
          {/* L'exemple est HORS du champ : dans le champ, il serait pris pour du
              texte déjà saisi (c'est ce qui bloquait les pros au test). */}
          <div className="asx-ex">
            <span className="asx-exk">Exemple</span>
            {o.ex}
          </div>
          <textarea
            className="asx-said"
            value={said}
            onChange={(e) => setSaid(e.target.value)}
            rows={3}
            placeholder="Écrivez votre annonce ici…"
            aria-label="Ce que vous voulez annoncer"
          />
          <button className={`asx-send${said.trim() ? " pulse" : ""}`} onClick={() => write(true)} disabled={writing || !said.trim()}>
            {writing ? "Je rédige…" : "✍️ Rédiger mon annonce"}
          </button>
          <button type="button" className="asx-link" onClick={() => write(false)} disabled={writing}>
            Utiliser l’exemple ci-dessus
          </button>
          <div className="asx-mini2" style={{ textAlign: "center", marginTop: 4 }}>Vous pourrez la modifier juste après.</div>
        </>
      );
    }
    if (view === "creneauPrev") {
      const anyOpt = optWa || optSocial || optResa;
      return (
        <>
          <button className="asx-back" onClick={() => setView("creneauSay")}>‹ Retour</button>
          <Steps n={3} />
          <div className="asx-say"><b>Vérifiez, puis publiez.</b></div>

          <div className="asx-prev">
            <div className="asx-to">✍️ Votre annonce</div>
            {editing
              ? <textarea className="asx-said sm" value={fn} onChange={(e) => setFn(e.target.value)} rows={3} aria-label="Votre annonce" />
              : <div className="asx-wac">{fn}</div>}
            {/* Sous le texte, jamais collé au titre : on modifie ce qu'on vient de lire. */}
            <div className="asx-editrow">
              <button type="button" className="asx-edit" onClick={() => setEditing((v) => !v)}>{editing ? "✓ Terminé" : "✏️ Modifier"}</button>
            </div>
          </div>

          <div className="asx-glab">Inclus gratuitement</div>
          <div className="asx-flash">
            <div className="asx-fl on"><span className="i">🌐</span><span className="t">Publiée sur votre site</span><span className="asx-lock">✓ inclus</span></div>
            <div className="asx-fl on"><span className="i">📍</span><span className="t">Dans le <b>catalogue de {villeNom}</b>, que chaque site du réseau affiche<sup>*</sup></span><span className="asx-lock">✓ inclus</span></div>
          </div>
          <div className="asx-aster">* Le catalogue de {villeNom} rassemble les annonces du jour des commerçants d&apos;ici. Votre annonce y entre dès sa publication, et se parcourt carte après carte.</div>

          <div className="asx-glab">Options Pro — pour toucher davantage de {plural}</div>
          <div className="asx-flash">
            <button type="button" className={`asx-fl optbtn${optWa ? " sel" : ""}`} onClick={() => setOptWa((v) => !v)}>
              <span className="i">📱</span>
              <span className="t">Prévenir mes contacts WhatsApp
                {optWa && <em>Seuls vos {plural} ayant accepté d’être prévenu·es recevraient le message.</em>}
              </span>
              <span className="asx-ck">{optWa ? "✓" : ""}</span>
            </button>
            <button type="button" className={`asx-fl optbtn${optSocial ? " sel" : ""}`} onClick={() => setOptSocial((v) => !v)}>
              <span className="i">📸</span>
              <span className="t">Publications Facebook &amp; Instagram préparées
                {optSocial && <em>Vous relisez chaque publication avant qu’elle ne parte.</em>}
              </span>
              <span className="asx-ck">{optSocial ? "✓" : ""}</span>
            </button>
            <button type="button" className={`asx-fl optbtn${optResa ? " sel" : ""}`} onClick={() => setOptResa((v) => !v)}>
              <span className="i">🗓️</span>
              <span className="t">Lien de réservation ajouté
                {optResa && <em>Vos {plural} réservent en un clic depuis l’annonce.</em>}
              </span>
              <span className="asx-ck">{optResa ? "✓" : ""}</span>
            </button>
          </div>
          {anyOpt && <div className="asx-price">Options Pro&nbsp;: <b>29 €/mois</b> · sans engagement · résiliable à tout moment</div>}

          {/* Le bouton dit EXACTEMENT ce que le pro a choisi — et le gratuit reste
              toujours accessible en un clic, jamais enterré. */}
          <button className="asx-send" onClick={() => playCreneau(fn, optWa, optSocial, optResa)}>
            {anyOpt ? "Continuer avec les options Pro" : "Publier gratuitement sur mon site"}
          </button>
          {anyOpt && (
            <button type="button" className="asx-link" onClick={() => playCreneau(fn, false, false, false)}>
              Publier seulement sur mon site
            </button>
          )}
          <div className="asx-mini2" style={{ textAlign: "center", marginTop: anyOpt ? 4 : 9 }}>
            {anyOpt ? "Rien ne sera envoyé ni facturé sans votre validation." : "Aucune option payante ne sera activée."}
          </div>
        </>
      );
    }
    if (view === "questionIn") {
      return (
        <>
          <button className="asx-back" onClick={() => setView("home")}>‹ Retour</button>
          <div className="asx-say">Voici comment je réponds à vos {term === "patient" ? "patients" : "client(e)s"} <b>à votre place</b>, même quand vous êtes occupé(e). Choisissez une question qu’on vous pose souvent&nbsp;:</div>
          <div className="asx-quick">
            {questions.map((q, i) => <button key={q} onClick={() => playQuestion(q, i === 0)}>{q}</button>)}
          </div>
        </>
      );
    }
    // home
    return (
      <>
        <div className="asx-say"><b>Que souhaitez-vous faire&nbsp;?</b></div>
        {/* Toute la ligne est cliquable (les petits boutons ajoutaient du bruit). */}
        <div className="asx-tasks">
          {avisAllowed && (
            <button type="button" className="asx-task asx-task-hero" onClick={() => setView("creneauIn")}>
              <span className="ic">📣</span>
              <span className="tx"><span className="tt">Créer une annonce</span><span className="ts">disponibilité · événement · offre · produit</span></span>
              <span className="asx-go">›</span>
            </button>
          )}
          {avisAllowed && (
            <button type="button" className="asx-task" onClick={() => setView("avisIn")}>
              <span className="ic">⭐</span>
              <span className="tx"><span className="tt">Demander un avis Google</span><span className="ts">après un(e) {term} satisfait(e)</span></span>
              <span className="asx-go">›</span>
            </button>
          )}
          <button type="button" className="asx-task" onClick={() => setView("questionIn")}>
            <span className="ic">💬</span>
            <span className="tx"><span className="tt">Laisser l’assistante répondre aux questions courantes</span><span className="ts">rendez-vous, horaires, infos pratiques</span></span>
            <span className="asx-go">›</span>
          </button>
          {!avisAllowed && (
            <button type="button" className="asx-task" onClick={playPreparer}>
              <span className="ic">📋</span>
              <span className="tx"><span className="tt">Préparer la consultation</span><span className="ts">infos pratiques la veille du rendez-vous</span></span>
              <span className="asx-go">›</span>
            </button>
          )}
        </div>

        <div className="asx-qa">
          <div className="asx-qa-h">💬 Une question&nbsp;? Je vous réponds</div>
          {qa.length > 0 && (
            <div className="asx-qa-thread" ref={qaScroll}>
              {qa.map((m, i) => (
                <div key={i} className={`asx-qa-b ${m.who}`}>{m.text}</div>
              ))}
              {qaBusy && <div className="asx-qa-b ai asx-qa-typing"><span></span><span></span><span></span></div>}
            </div>
          )}
          <div className="asx-qa-in">
            <input
              value={qaInput}
              onChange={(e) => setQaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") askQa(); }}
              placeholder="Ex. c’est un engagement&nbsp;? combien ça coûte&nbsp;?"
              aria-label="Votre question"
            />
            <button onClick={askQa} disabled={qaBusy || !qaInput.trim()} aria-label="Envoyer">➤</button>
          </div>
          <a className="asx-qa-call" href="tel:+33768233347">📞 ou appelez-nous&nbsp;: 07 68 23 33 47</a>
        </div>
      </>
    );
  };

  return (
    <>
      <style>{styles(accent)}</style>

      {!open && !stageOn && !atBottom && (
        <button className="asx-fab" onClick={handleOpen} aria-label="Côté pro : lancer une Action Flash">
          <span className="orb">✦</span>
          {/* « Côté pro · aperçu » laissait croire « c'est payant » → certains
              n'osaient même pas cliquer. On promet la rapidité, pas le tarif. */}
          <span className="lab"><small>Action Flash</small>Créer une annonce en 30 s</span>
          <span className="chev">›</span>
        </button>
      )}

      {open && !stageOn && (
        <div className="asx-sheet" role="dialog" aria-label="Votre assistante">
          <div className="asx-grip" />
          <button className="asx-close" onClick={() => { stopSpeaking(); setOpen(false); }} aria-label="Fermer">✕</button>
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

function styles(accent: string): string {
  return `
  /* Le bouton STAR : une vraie pilule premium, centrée au-dessus de la barre.
     « Respiration » discrète toutes les ~7 s pour attirer le regard sans agiter. */
  .asx-fab{position:fixed;left:0;right:0;margin:0 auto;bottom:82px;z-index:55;width:max-content;max-width:calc(100% - 28px);
    display:flex;align-items:center;gap:11px;cursor:pointer;border:none;font-family:inherit;height:60px;
    background:linear-gradient(135deg,#20201A,#0D0D09);color:#FBFAF7;border-radius:32px;padding:9px 20px 9px 10px;
    box-shadow:0 14px 36px -10px rgba(0,0,0,.55),inset 0 0 0 1px rgba(124,106,232,.45);animation:asxBreathe 7s ease-in-out infinite;}
  /* L'orbe reprend EXACTEMENT l'identité de l'assistante montrée dans la démo
     (✦ sur dégradé violet) : l'icône qui descend du centre se pose ici. */
  .asx-fab .orb{width:42px;height:42px;border-radius:50%;background:linear-gradient(140deg,#A594FF,#5B3FA6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;flex:none;box-shadow:0 5px 16px -3px rgba(91,63,166,.85);}
  .asx-fab .lab{font-size:14.5px;font-weight:700;white-space:nowrap;line-height:1.08;text-align:left;}
  .asx-fab .lab small{display:block;font-size:8.5px;letter-spacing:.11em;text-transform:uppercase;color:#A594FF;font-weight:700;margin-bottom:1px;}
  .asx-fab .chev{font-size:22px;color:#A594FF;font-weight:700;margin-left:1px;line-height:1;}
  @keyframes asxBreathe{0%,80%,100%{transform:scale(1)}88%{transform:scale(1.045)}}
  @media (prefers-reduced-motion:reduce){.asx-fab{animation:none;}}
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
  .asx-disc{background:#F3EEFF;border:1px solid #DED0F7;border-radius:12px;padding:10px 13px;font-size:12px;line-height:1.45;color:#4A3A78;margin-bottom:13px;}
  .asx-disc b{color:#3C2A78;font-weight:700;}
  /* Q&A commercial */
  .asx-qa{margin-top:20px;border-top:1px solid #E7E4DC;padding-top:16px;}
  .asx-qa-h{font-size:12.5px;font-weight:700;color:#2A2340;line-height:1.4;margin-bottom:11px;}
  .asx-qa-thread{max-height:210px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:11px;}
  .asx-qa-b{max-width:88%;padding:10px 13px;border-radius:14px;font-size:13px;line-height:1.45;white-space:pre-line;}
  .asx-qa-b.ai{align-self:flex-start;background:#F1EEF9;color:#2A2340;border-top-left-radius:5px;}
  .asx-qa-b.me{align-self:flex-end;background:#5B3FA6;color:#fff;border-top-right-radius:5px;}
  .asx-qa-typing{display:flex;gap:4px;}
  .asx-qa-typing span{width:6px;height:6px;border-radius:50%;background:#B9A6EC;animation:asxDot 1s infinite;}
  .asx-qa-typing span:nth-child(2){animation-delay:.15s}.asx-qa-typing span:nth-child(3){animation-delay:.3s}
  @keyframes asxDot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
  .asx-qa-in{display:flex;gap:8px;}
  .asx-qa-in input{flex:1;min-width:0;border:1px solid #E0DCF0;border-radius:22px;padding:11px 15px;font-size:14px;font-family:inherit;background:#fff;}
  .asx-qa-in button{flex:none;border:none;background:#5B3FA6;color:#fff;border-radius:50%;width:42px;height:42px;font-size:15px;cursor:pointer;}
  .asx-qa-in button:disabled{opacity:.5;cursor:not-allowed;}
  .asx-qa-call{display:block;text-align:center;margin-top:12px;font-size:13px;font-weight:700;color:#5B3FA6;text-decoration:none;}
  .asx-tasks{display:flex;flex-direction:column;gap:9px;}
  .asx-task{display:flex;align-items:center;gap:12px;border:1px solid #E7E4DC;border-radius:13px;padding:12px 12px 12px 14px;background:#fff;transition:.15s;}
  .asx-task:hover{border-color:${accent};background:#FDFBF6;}
  .asx-task.asx-task-hero{border-color:${accent};background:linear-gradient(180deg,${accent}12,#fff);}
  .asx-mini2{font-size:11px;color:#9A9A90;font-weight:400;}
  .asx-task .ic{width:34px;height:34px;border-radius:9px;background:${accent}14;flex:none;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .asx-task .tx{flex:1;min-width:0;}
  .asx-task .tt{font-size:13px;font-weight:600;display:block;line-height:1.25;}
  .asx-task .ts{font-size:11px;color:#71766C;display:block;margin-top:1px;}
  .asx-do{flex:none;background:${accent};color:#fff;border:none;border-radius:20px;padding:9px 13px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;box-shadow:0 6px 14px -6px ${accent}99;transition:.15s;}
  .asx-do:hover{filter:brightness(1.06);}
  .asx-do:active{transform:translateY(1px);}
  .asx-quick{display:flex;flex-direction:column;gap:8px;}
  .asx-quick button{border:1px solid #E7E4DC;background:#fff;border-radius:13px;padding:12px 14px;font-size:13px;font-family:inherit;cursor:pointer;font-weight:500;text-align:left;}
  .asx-quick button:hover{border-color:#B8862F;}
  .asx-back{background:none;border:none;color:#71766C;font-size:12px;font-family:inherit;cursor:pointer;margin-bottom:12px;padding:0;}
  .asx-field label{font-size:11px;color:#71766C;display:block;margin-bottom:5px;font-weight:500;}
  .asx-field input{width:100%;border:1px solid #E7E4DC;border-radius:11px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:#fff;}
  .asx-field input:focus{outline:none;border-color:#B8862F;}
  .asx-field+.asx-field{margin-top:11px;}
  /* Une seule couleur d'action sur tout le parcours Action Flash : le violet de
     l'assistante (le produit alternait violet, doré, vert et noir). */
  .asx-send{margin-top:14px;width:100%;background:linear-gradient(135deg,#8A6BE0,#5B3FA6);color:#fff;border:none;border-radius:14px;padding:14px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 12px 26px -14px rgba(91,63,166,.75);}
  .asx-send:disabled{opacity:.6;cursor:not-allowed;}
  .asx-send:active{transform:scale(.99);}
  .asx-send:disabled{background:#CBD3CC;cursor:default;}
  .asx-prev{background:#F4F2EC;border:1px solid #E7E4DC;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.45;color:#3A3A32;}
  .asx-prev .asx-to{display:flex;align-items:center;gap:10px;font-size:10.5px;color:#71766C;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;}
  .asx-wac{background:#E6F5DC;border-radius:10px;padding:9px 11px;font-size:12.5px;line-height:1.4;color:#1F3A17;}
  /* Action Flash — récap transparent des canaux (offert / option) */
  .asx-flash{margin-top:12px;border:1px solid #E7E4DC;border-radius:13px;overflow:hidden;background:#fff;}
  .asx-fl{display:flex;align-items:center;gap:10px;padding:11px 13px;border-top:1px solid #F1EFE8;font-size:12.5px;}
  .asx-fl:first-child{border-top:none;}
  .asx-fl .i{font-size:15px;flex:none;width:20px;text-align:center;}
  .asx-fl .t{flex:1;color:#3A3A32;line-height:1.3;}
  .asx-fl .tag{flex:none;font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:6px;letter-spacing:.02em;}
  .asx-fl .tag.free{background:#E4F7EE;color:#0E7C5A;}
  .asx-fl .tag.opt{background:#F0EBFF;color:#6B4BC7;}
  .asx-glab{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9A968A;margin:16px 0 0;}
  .asx-fl.on{background:#F3FBF6;}
  .asx-fl .asx-lock{flex:none;font-size:10px;font-weight:800;color:#0E7C5A;background:#E4F7EE;border-radius:6px;padding:3px 8px;}
  .asx-fl.optbtn{width:100%;background:#fff;border:none;border-top:1px solid #F1EFE8;font-family:inherit;cursor:pointer;text-align:left;}
  .asx-fl.optbtn:first-child{border-top:none;}
  .asx-fl.optbtn.sel{background:linear-gradient(120deg,#F5F3FF,#fff);}
  /* Case décochée VRAIMENT vide : bordure grise neutre, fond légèrement creusé.
     En violet clair, elle se lisait comme une option déjà activée. */
  .asx-fl .asx-ck{flex:none;width:22px;height:22px;border-radius:6px;border:2px solid #D8D4CA;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:900;background:#F4F2EC;}
  .asx-fl.optbtn.sel .asx-ck{background:#6B4BC7;border-color:#6B4BC7;}
  /* La conséquence du choix s'affiche APRÈS le clic, jamais comme promesse chiffrée */
  .asx-fl .t em{display:block;font-style:normal;font-size:11px;line-height:1.4;color:#6B4BC7;margin-top:3px;}
  .asx-optcard{margin-top:14px;background:linear-gradient(120deg,#F5F3FF,#fff);border:1px solid #E4DEF7;border-radius:14px;padding:14px 15px;font-size:13px;line-height:1.5;color:#3A3A32;text-align:left;}
  /* ── Parcours Action Flash : je choisis → je décris → je vérifie → c'est publié ──
     Trois segments libellés plutôt qu'un « étape N sur 3 » : le chemin Pro compte
     plusieurs écrans de résultat après la saisie, un dénominateur mentirait. */
  .asx-steps{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
  .asx-segs{display:flex;gap:4px;flex:none;}
  .asx-segs span{width:22px;height:4px;border-radius:2px;background:#E8E4DA;transition:background .3s ease;}
  .asx-segs span.on{background:#8A63D9;}
  .asx-steplb{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8A63D9;}
  /* L'exemple, clairement HORS du champ de saisie */
  .asx-ex{margin-top:14px;border:1px dashed #D9CFF0;background:#FAF8FF;border-radius:12px;padding:11px 13px;
    font-size:13.5px;line-height:1.45;color:#4A4A40;text-align:left;font-style:italic;}
  .asx-exk{display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8A63D9;margin-bottom:4px;}
  .asx-ex+.asx-said{margin-top:9px;}
  .asx-editrow{display:flex;justify-content:flex-end;margin-top:8px;}
  .asx-nono{margin-top:11px;font-size:11.5px;line-height:1.45;color:#71766C;text-align:center;}
  .asx-pronote{margin-top:15px;display:flex;flex-direction:column;gap:5px;text-align:left;border:1px solid #E0D8F5;
    background:linear-gradient(120deg,#F7F3FF,#fff);border-radius:13px;padding:13px 14px;font-size:12.5px;line-height:1.5;color:#4A4A40;}
  .asx-pronote b{font-size:13.5px;color:#5B3FA6;font-weight:850;}
  .asx-pronote span{font-size:11.5px;color:#71766C;}
  .asx-objs{display:flex;flex-direction:column;gap:9px;margin-top:14px;}
  .asx-obj{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    border:1px solid #E7E4DC;background:#fff;border-radius:14px;padding:14px 13px;transition:border-color .15s ease,transform .12s ease,box-shadow .15s ease;}
  .asx-obj:hover{border-color:#C9BCF2;box-shadow:0 12px 26px -18px rgba(91,63,166,.5);}
  .asx-obj:active{transform:scale(.99);}
  .asx-obj.reco{border-color:#C9BCF2;background:linear-gradient(120deg,#F8F5FF,#fff);}
  .asx-obj .oi{width:38px;height:38px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#5B3FA6;background:#F1ECFF;}
  .asx-obj .oi svg{width:20px;height:20px;}
  .asx-obj .ot{flex:1;min-width:0;font-size:14.5px;font-weight:700;color:#16160F;line-height:1.25;}
  .asx-obj .obadge{flex:none;font-size:9px;font-weight:800;letter-spacing:.03em;color:#5B3FA6;background:#EDE8FF;border-radius:6px;padding:3px 7px;}
  .asx-obj .oc{flex:none;font-size:20px;color:#B9A6EC;font-weight:700;}
  .asx-said{width:100%;margin-top:14px;border:1px solid #D9CFF0;border-radius:13px;padding:13px 14px;font-size:14.5px;font-family:inherit;
    background:#fff;resize:vertical;line-height:1.5;color:#16160F;box-sizing:border-box;}
  .asx-said.sm{font-size:13.5px;margin-top:8px;}
  .asx-said:focus{outline:none;border-color:#8A63D9;box-shadow:0 0 0 3px rgba(138,99,217,.15);}
  /* Une respiration courte quand le bouton devient actif — pas une insistance en boucle */
  .asx-send.pulse{animation:asxPulse 1.9s ease-in-out 3;}
  @keyframes asxPulse{0%,100%{box-shadow:0 12px 26px -14px rgba(91,63,166,.7)}50%{box-shadow:0 12px 26px -14px rgba(91,63,166,.7),0 0 0 7px rgba(138,99,217,.16)}}
  @media (prefers-reduced-motion:reduce){.asx-send.pulse{animation:none;}}
  .asx-edit{margin-left:auto;border:none;background:none;color:#5B3FA6;font-size:11.5px;font-weight:800;font-family:inherit;cursor:pointer;text-decoration:underline;padding:0;}
  .asx-price{margin-top:12px;font-size:12.5px;color:#3A3A32;background:linear-gradient(120deg,#F5F3FF,#fff);border:1px solid #E4DEF7;border-radius:12px;padding:11px 13px;text-align:center;}
  .asx-price b{color:#5B3FA6;font-weight:850;font-size:14px;}
  .asx-pricebox{margin-top:14px;display:flex;flex-direction:column;gap:2px;font-size:13px;color:#3A3A32;background:linear-gradient(120deg,#F5F3FF,#fff);
    border:1px solid #E4DEF7;border-radius:13px;padding:13px;text-align:center;}
  .asx-pricebox b{color:#5B3FA6;font-weight:850;font-size:17px;}
  .asx-pricebox span{font-size:11.5px;color:#71766C;}
  .asx-link{margin-top:11px;width:100%;background:none;border:none;color:#71766C;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;text-decoration:underline;padding:6px;}
  .asx-link:hover{color:#3A3A32;}
  .asx-link:disabled{opacity:.5;cursor:not-allowed;}
  .asx-aster{margin-top:9px;font-size:11px;line-height:1.45;color:#8A8577;text-align:left;}
  .asx-fl sup,.asx-proof sup{font-size:9px;color:#0E7C5A;font-weight:800;}
  .asx-task{width:100%;border:none;font-family:inherit;cursor:pointer;text-align:left;}
  .asx-task .asx-go{flex:none;font-size:20px;color:#B9A6EC;font-weight:700;margin-left:auto;}
  /* ── L'ATELIER : la phrase du pro se dédouble et se métamorphose ────────────
     On montre une FABRICATION, pas un envoi. Aucune coche de livraison, aucun
     destinataire : ce qui impressionne, c'est de voir trois objets naître d'une
     seule ligne. Tout est en keyframes CSS — aucune boucle JS à surveiller. */
  .atl{text-align:center;}
  .atl-orb{width:54px;height:54px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:25px;color:#fff;background:linear-gradient(140deg,#A594FF,#5B3FA6);
    box-shadow:0 12px 30px -8px rgba(91,63,166,.9);animation:atlPulse 1.6s ease-in-out infinite;}
  @keyframes atlPulse{0%,100%{transform:scale(1);box-shadow:0 12px 30px -8px rgba(91,63,166,.9)}
    50%{transform:scale(1.08);box-shadow:0 14px 38px -6px rgba(165,148,255,.95)}}
  .atl-say{font-size:15px;font-weight:800;color:#16160F;margin-top:12px;}
  /* La phrase SOURCE : elle reste visible, puis s'efface quand les cartes sortent —
     le pro voit d'où viennent les trois publications. */
  .atl-src{font-size:12.5px;line-height:1.45;color:#71766C;font-style:italic;margin-top:7px;
    animation:atlSrc 1.4s ease forwards;}
  @keyframes atlSrc{0%{opacity:1;transform:none}70%{opacity:1}100%{opacity:.35;transform:scale(.97)}}
  .atl-cards{display:flex;flex-direction:column;gap:9px;margin-top:16px;text-align:left;}
  .atl-c{border:1px solid #E7E4DC;border-radius:14px;background:#fff;padding:11px 12px;
    opacity:0;transform:translateY(16px) scale(.96);
    animation:atlIn .5s cubic-bezier(.22,1,.36,1) var(--d) forwards;
    box-shadow:0 12px 28px -18px rgba(0,0,0,.45);}
  @keyframes atlIn{to{opacity:1;transform:none}}
  .atl-h{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.05em;
    text-transform:uppercase;color:#71766C;}
  .atl-ic{font-size:14px;}
  /* Chaque canal garde sa couleur : la différence doit sauter aux yeux. */
  .atl-wa .atl-t{background:#E6F5DC;color:#1F3A17;}
  .atl-ig .atl-t{background:#FDF2F8;color:#5B2340;}
  .atl-fb .atl-t{background:#EFF4FF;color:#1B2E52;}
  .atl-t{margin-top:7px;border-radius:10px;padding:9px 11px;font-size:12.5px;line-height:1.42;
    white-space:pre-line;transition:opacity .18s ease;}
  .atl-t.swap{opacity:0;}
  .atl-img{margin-top:7px;height:74px;border-radius:10px;background-size:cover;background-position:center;
    background-image:linear-gradient(150deg,#3A2A3E,#1A1420);}
  .atl-steps{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
  .atl-s{font-size:10px;font-weight:700;color:#0E7C5A;background:#E4F7EE;border-radius:5px;padding:3px 7px;
    opacity:0;animation:atlStep .35s ease var(--sd) forwards;}
  .atl-s::before{content:"✓ ";}
  @keyframes atlStep{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){
    .atl-orb,.atl-src{animation:none;}
    .atl-c,.atl-s{animation:none;opacity:1;transform:none;}
  }
  /* Les trois publications, sur l'écran final */
  .asx-posts{display:flex;flex-direction:column;gap:10px;margin-top:15px;text-align:left;}
  .asx-post{border:1px solid #E7E4DC;border-radius:14px;background:#fff;padding:11px 12px;
    box-shadow:0 12px 28px -20px rgba(0,0,0,.4);}
  .asx-post-h{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.05em;
    text-transform:uppercase;color:#71766C;}
  .asx-post-img{margin-top:7px;height:96px;border-radius:10px;background-size:cover;background-position:center;
    background-image:linear-gradient(150deg,#3A2A3E,#1A1420);}
  .asx-post-t{margin-top:7px;font-size:12.5px;line-height:1.45;color:#3A3A32;white-space:pre-line;}
  /* ── Pop-up « c'est fait » (gratuit) et « campagne prête » (options Pro) ── */
  .asx-done-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0B7A55;background:#E4F7EE;border:1px solid #BFE9D4;border-radius:999px;padding:5px 12px;}
  .asx-pro-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6B4BC7;background:#F0EBFF;border:1px solid #E0D8F5;border-radius:999px;padding:5px 12px;}
  .asx-done-h{font-family:Georgia,serif;font-size:24px;font-weight:700;line-height:1.15;color:#16160F;margin-top:13px;}
  .asx-done-s{font-size:13.5px;line-height:1.55;color:#5F6358;margin-top:9px;}
  .asx-band{display:flex;flex-direction:column;gap:5px;margin-top:15px;text-align:left;border-radius:13px;padding:13px 15px;
    background:linear-gradient(100deg,#0E5C46,#0B2A20);color:#fff;box-shadow:0 14px 30px -16px rgba(11,42,32,.8);animation:asxBandIn .5s cubic-bezier(.22,1,.36,1);}
  @keyframes asxBandIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
  .asx-band-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7FE6C0;}
  .asx-band-t{font-size:14px;line-height:1.45;font-weight:600;}
  .asx-bandwrap{margin-top:16px;}
  .asx-proofs{display:flex;flex-direction:column;gap:7px;margin-top:14px;text-align:left;}
  .asx-proof{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:#25381C;background:#F1F8F3;border:1px solid #D6EBDD;border-radius:11px;padding:10px 12px;}
  .asx-cta2{margin-top:16px;width:100%;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;
    color:#06231a;background:linear-gradient(135deg,#00E0A0,#07B083);box-shadow:0 14px 30px -12px rgba(0,224,160,.75);}
  .asx-cta2.pro{color:#fff;background:linear-gradient(135deg,#8A6BE0,#5B3FA6);box-shadow:0 14px 30px -12px rgba(91,63,166,.75);}
  .asx-cta2:active{transform:scale(.98);}
  .asx-clines{display:flex;flex-direction:column;gap:8px;margin-top:15px;text-align:left;}
  .asx-cline{display:flex;align-items:center;gap:11px;border:1px solid #E7E4DC;border-radius:12px;padding:11px 12px;background:#fff;}
  .asx-cline .ci{font-size:18px;flex:none;width:22px;text-align:center;}
  .asx-cline .cb{flex:1;min-width:0;display:flex;flex-direction:column;}
  .asx-cline .ct{font-size:13.5px;font-weight:800;color:#16160F;}
  .asx-cline .cs{font-size:11.5px;color:#71766C;margin-top:2px;line-height:1.35;}
  .asx-cline .cbadge{flex:none;font-size:9.5px;font-weight:800;padding:4px 8px;border-radius:6px;}
  .asx-cline .cbadge.free{background:#E4F7EE;color:#0E7C5A;}
  .asx-cline .cbadge.pro{background:#F0EBFF;color:#6B4BC7;}
  .asx-chans{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:16px;}
  .asx-chip{font-size:12px;font-weight:700;color:#463F6B;background:linear-gradient(180deg,#F4F1FF,#EDE9FB);border:1px solid #E4DEF7;border-radius:999px;padding:8px 13px;}
  .asx-chip.free{color:#0E7C5A;background:#E4F7EE;border-color:#BFE9D4;}
  .asx-recap{margin-top:14px;font-size:12.5px;line-height:1.6;color:#5F6358;background:#F7F5EF;border:1px solid #E7E4DC;border-radius:12px;padding:12px 14px;text-align:left;}
  .asx-recap b{color:#16160F;}
  /* Halo sur le vrai bandeau du site + bulle « voici ce que verront vos visiteurs » */
  .offer-band.asx-glow{animation:asxGlow 2.4s ease;}
  @keyframes asxGlow{0%,100%{box-shadow:none}18%,70%{box-shadow:0 0 0 4px rgba(0,224,160,.45),0 0 34px 6px rgba(0,224,160,.35)}}
  .asx-tip{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(26px + env(safe-area-inset-bottom));z-index:95;
    background:rgba(16,20,38,.97);color:#fff;font-family:'Inter',system-ui,sans-serif;font-size:13.5px;font-weight:700;
    padding:12px 18px;border-radius:14px;box-shadow:0 18px 40px -18px rgba(0,0,0,.7);animation:asxTip .35s ease;}
  @keyframes asxTip{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translateX(-50%)}}
  @media (prefers-reduced-motion:reduce){.asx-band,.offer-band.asx-glow,.asx-tip{animation:none;}}
  .asx-stage{position:fixed;inset:0;z-index:60;max-width:520px;margin:0 auto;background:rgba(12,14,11,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px;backdrop-filter:blur(2px);}
  .asx-card{background:#fff;border-radius:20px;padding:22px 20px;width:100%;max-width:300px;max-height:calc(100dvh - 44px);text-align:center;position:relative;overflow-y:auto;overflow-x:hidden;animation:asxCardin .35s;}
  @keyframes asxCardin{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  .asx-ctx{font-size:11.5px;color:#71766C;margin-bottom:14px;line-height:1.4;}
  .asx-big{font-family:Georgia,serif;font-size:54px;font-weight:600;line-height:1;color:${accent};display:inline-block;}
  .asx-big.bump{animation:asxBump .4s;}@keyframes asxBump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
  .asx-starline{color:#B8862F;font-size:16px;margin-top:6px;letter-spacing:2px;}
  .asx-reachbig{font-family:Georgia,serif;font-size:44px;font-weight:700;line-height:1;text-align:center;color:#16160F;}
  .asx-reachbig #asx-rc{display:inline-block;min-width:1.2em;}
  .asx-reachlb{font-size:12px;color:#71766C;text-align:center;margin-top:3px;}
  .asx-avrow{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:12px;}
  .asx-avdot{width:14px;height:14px;border-radius:50%;background:${accent};opacity:0;transform:scale(.3);animation:asxPop .45s forwards;}
  @keyframes asxPop{to{opacity:1;transform:scale(1)}}
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
  .asx-blist{margin:12px 0 4px;text-align:left;display:flex;flex-direction:column;gap:7px;}
  .asx-bl{font-size:12.5px;color:#25381C;line-height:1.35;display:flex;gap:7px;align-items:flex-start;}
  .asx-bl span{color:#1B7A3E;font-weight:800;flex:none;}
  .asx-blsig{font-family:Georgia,serif;font-size:14px;line-height:1.4;margin:13px 0 2px;color:#16160F;}
  .asx-cta{margin-top:14px;width:100%;background:${accent};color:#fff;border:none;border-radius:20px;padding:13px 18px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 10px 24px -8px ${accent}cc;}
  .asx-cta:active{transform:translateY(1px);}
  .asx-rtn[data-continue]{margin-top:9px;background:none;color:#71766C;}
  .asx-conf{position:absolute;width:7px;height:7px;border-radius:1px;opacity:0;}
  @keyframes asxConf{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(70px) rotate(220deg)}}
  `;
}
