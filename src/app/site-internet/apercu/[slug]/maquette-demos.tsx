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

export type MaquetteAssistantData = {
  nom: string; // nom du commerce, pour les messages (« chez … »)
  clientTerm: string; // singulier : « client » / « patient »
  reviewsCount: number | null; // départ du compteur d'avis
  slot: string; // créneau illustratif, ex. « samedi 15 h 30 »
  avisAllowed: boolean; // déonto none (A/B) → avis + créneau ; sinon (C/D) sobre
  ville?: string; // ville, pour le « collectif de … »
};

type View = "home" | "avisIn" | "avisPrev" | "creneauIn" | "creneauPrev" | "questionIn";

export function MaquetteAssistant({ accent, data, slug }: { accent: string; data: MaquetteAssistantData; slug: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [stageOn, setStageOn] = useState(false);
  const [fn, setFn] = useState("");
  const [ph, setPh] = useState("");
  // Canaux d'une Action Flash : le site est TOUJOURS inclus (gratuit) ; les options
  // (WhatsApp / réseaux / réservation) sont décochées par défaut — aucune ambiguïté.
  const [optWa, setOptWa] = useState(false);
  const [optSocial, setOptSocial] = useState(false);
  const [optResa, setOptResa] = useState(false);
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
    `<div class="asx-done-h">Votre annonce est en ligne.</div>` +
    `<div class="asx-done-s">Elle est maintenant visible en haut de votre site, par toutes les personnes qui le consultent.</div>` +
    bandHtml(msg) +
    `<div class="asx-proofs">` +
      `<div class="asx-proof"><span>🌐</span>Visible tout de suite</div>` +
      `<div class="asx-proof"><span>🎁</span>100 % gratuit</div>` +
      `<div class="asx-proof"><span>✏️</span>Modifiable quand vous voulez</div>` +
    `</div>` +
    `<button class="asx-cta2" data-seeoffer>Voir mon annonce sur le site</button>` +
    `<button class="asx-rtn" data-tooptions>Découvrir comment toucher plus de monde</button>` +
    tiny("Aucune diffusion extérieure n'a été effectuée.");

  const proFinal = (msg: string, wa: boolean, social: boolean, resa: boolean) => {
    const plur = term === "patient" ? "patients" : "client(e)s";
    const line = (ic: string, t: string, s: string, free: boolean) =>
      `<div class="asx-cline"><span class="ci">${ic}</span><span class="cb"><span class="ct">${t}</span><span class="cs">${s}</span></span>` +
      `<span class="cbadge ${free ? "free" : "pro"}">${free ? "Inclus" : "Option Pro"}</span></div>`;
    return (
      `<div class="asx-pro-k">✨ Aperçu des options Pro</div>` +
      `<div class="asx-done-h">Votre mini-campagne est prête.</div>` +
      `<div class="asx-done-s">Votre assistante a adapté l'annonce pour plusieurs canaux. Vérifiez tout avant de décider de l'activer.</div>` +
      `<div class="asx-clines">` +
        line("🌐", "Votre site", "L'annonce sera affichée immédiatement.", true) +
        (wa ? line("📱", "WhatsApp", "Message préparé pour vos contacts autorisés.", false) : "") +
        (social ? line("📸", "Facebook &amp; Instagram", "Publication prête à être vérifiée.", false) : "") +
        (resa ? line("📅", "Réservation", "Lien direct ajouté à l'annonce.", false) : "") +
      `</div>` +
      (wa
        ? `<div class="asx-reachbox"><div class="asx-reachnum">jusqu'à <b>46</b></div>` +
          `<div class="asx-reachtx">contacts autorisés <b>pourraient</b> être prévenus en un seul envoi, avec l'option WhatsApp.</div></div>`
        : "") +
      bandHtml(msg) +
      `<div class="asx-simnote">Simulation basée sur une liste de démonstration. <b>Aucun message n'a été envoyé.</b></div>` +
      `<button class="asx-cta2 pro" data-procont>Continuer vers l'activation des options</button>` +
      `<button class="asx-rtn" data-return>Rester sur la version gratuite</button>` +
      tiny(`Vous verrez le prix et validerez une dernière fois avant toute activation. (${plur})`)
    );
  };

  const playCreneau = (msg: string, wa: boolean, social: boolean, resa: boolean) => {
    if (!wa && !social && !resa) {
      // GRATUIT — on montre l'annonce qui apparaît, puis UNE pop-up « c'est fait ».
      openStage(`<div class="asx-ctx">Votre annonce s'affiche en haut de votre site…</div><div class="asx-bandwrap">${bandHtml(msg)}</div>`);
      after(1400, () => setCard(freeFinal(msg)));
      if (!doneRef.current.includes("creneau")) doneRef.current.push("creneau");
      return;
    }
    // OPTIONS — on prépare, puis UNE pop-up « campagne prête » (rien n'est parti).
    openStage(`<div class="asx-ctx">Votre assistante adapte l'annonce pour chaque canal…</div><div class="asx-dots" style="margin-top:14px"><span>•</span><span>•</span><span>•</span></div>`);
    after(1500, () => setCard(proFinal(msg, wa, social, resa)));
    if (!doneRef.current.includes("creneau")) doneRef.current.push("creneau");
  };

  // Écran final « puissance » (après « Continuer vers l'activation »).
  const proReveal = () => {
    setCard(
      `<div class="asx-done-h">Votre annonce, prête partout —<br>en moins d'une minute.</div>` +
        `<div class="asx-chans">` +
          `<span class="asx-chip free">🌐 Site</span><span class="asx-chip">📱 WhatsApp</span>` +
          `<span class="asx-chip">📸 Facebook</span><span class="asx-chip">📸 Instagram</span><span class="asx-chip">📅 Réservation</span>` +
        `</div>` +
        `<div class="asx-done-s">Votre assistante rédige, adapte et prépare toute la communication. Vous gardez toujours la main avant publication.</div>` +
        `<div class="asx-recap"><b>Votre site</b> : inclus gratuitement<br><b>Diffusion extérieure</b> : disponible avec les options Pro</div>` +
        `<button class="asx-cta" data-cta>Garder mon site gratuitement</button>` +
        `<button class="asx-rtn" data-return>Revenir à mon assistante</button>`
    );
  };

  // « Voir mon annonce sur le site » : on ferme l'assistante et on emmène le pro
  // au vrai bandeau, avec un halo + une bulle « voici ce que verront vos visiteurs ».
  const seeOffer = () => {
    clearTimers();
    setStageOn(false);
    setOpen(false);
    setView("home");
    requestAnimationFrame(() => {
      const band = document.querySelector<HTMLElement>(".offer-band");
      if (band) {
        band.scrollIntoView({ behavior: "smooth", block: "center" });
        band.classList.add("asx-glow");
        window.setTimeout(() => band.classList.remove("asx-glow"), 2600);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      const tip = document.createElement("div");
      tip.className = "asx-tip";
      tip.textContent = "Voici ce que verront vos visiteurs.";
      document.body.appendChild(tip);
      window.setTimeout(() => tip.remove(), 3200);
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
    const t = e.target as HTMLElement;
    if (t.closest("[data-cta]")) goBuy();
    else if (t.closest("[data-seeoffer]")) seeOffer();
    else if (t.closest("[data-procont]")) proReveal();
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
  const offres: Array<{ label: string; msg: string }> = [
    { label: "📅 Annoncer une disponibilité", msg: `Une place se libère bientôt chez ${nom}. Envie d'en profiter ? Répondez OUI, je vous la réserve 🙂` },
    { label: "🎉 Annoncer un événement", msg: `Bientôt chez ${nom} : un moment spécial rien que pour vous. Vous venez ? Répondez OUI 🙂` },
    { label: "🏷️ Faire connaître une offre", msg: `Cette semaine chez ${nom} : -20 % sur notre coup de cœur. Répondez OUI pour réserver le vôtre ✨` },
    { label: "📦 Mettre un produit en avant", msg: `Dernières pièces chez ${nom} — une belle occasion à saisir. Ça vous intéresse ? Répondez OUI 🙂` },
  ];
  const plural = term === "patient" ? "patients" : "client(e)s";

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
          <div className="asx-say"><b>Quel est votre objectif&nbsp;?</b> Je prépare l’annonce et je vous montre <b>exactement</b> ce que je vais faire — vous validez avant l’envoi.</div>
          <div className="asx-quick asx-quick-col">{offres.map((o) => <button key={o.label} onClick={() => { setFn(o.msg); setView("creneauPrev"); }}>{o.label}</button>)}</div>
        </>
      );
    }
    if (view === "creneauPrev") {
      const anyOpt = optWa || optSocial || optResa;
      return (
        <>
          <button className="asx-back" onClick={() => setView("creneauIn")}>‹ Retour</button>
          <div className="asx-say">Voici votre annonce. Elle s’affiche <b>gratuitement sur votre site</b>. Ajoutez des options si vous voulez toucher plus de monde.</div>
          <div className="asx-prev"><div className="asx-to">✍️ Votre annonce <span className="asx-mini2">(personnalisable)</span></div><div className="asx-wac">{fn}</div></div>

          <div className="asx-glab">Inclus gratuitement</div>
          <div className="asx-flash">
            <div className="asx-fl on"><span className="i">🌐</span><span className="t">Afficher l’annonce sur votre site</span><span className="asx-lock">✓ inclus</span></div>
          </div>

          <div className="asx-glab">Options — pour toucher davantage de {plural}</div>
          <div className="asx-flash">
            <button type="button" className={`asx-fl optbtn${optWa ? " sel" : ""}`} onClick={() => setOptWa((v) => !v)}>
              <span className="i">📲</span><span className="t">Prévenir mes contacts WhatsApp</span><span className="asx-ck">{optWa ? "✓" : ""}</span>
            </button>
            <button type="button" className={`asx-fl optbtn${optSocial ? " sel" : ""}`} onClick={() => setOptSocial((v) => !v)}>
              <span className="i">📸</span><span className="t">Préparer une publication Facebook &amp; Instagram</span><span className="asx-ck">{optSocial ? "✓" : ""}</span>
            </button>
            <button type="button" className={`asx-fl optbtn${optResa ? " sel" : ""}`} onClick={() => setOptResa((v) => !v)}>
              <span className="i">🗓️</span><span className="t">Ajouter un lien de réservation</span><span className="asx-ck">{optResa ? "✓" : ""}</span>
            </button>
          </div>

          <button className="asx-send" onClick={() => playCreneau(fn, optWa, optSocial, optResa)}>
            {anyOpt ? "Voir ma campagne préparée" : "Afficher gratuitement sur mon site"}
          </button>
          <div className="asx-mini2" style={{ textAlign: "center", marginTop: 9 }}>
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
        <div className="asx-say"><b>Que voulez-vous obtenir&nbsp;?</b></div>
        <div className="asx-tasks">
          {avisAllowed && (
            <div className="asx-task asx-task-hero">
              <span className="ic">🚀</span>
              <span className="tx"><span className="tt">Lancer une Action Flash</span><span className="ts">créneau libre · événement · offre · déstockage</span></span>
              <button className="asx-do" onClick={() => setView("creneauIn")}>▶ Lancer</button>
            </div>
          )}
          {avisAllowed && (
            <div className="asx-task">
              <span className="ic">⭐</span>
              <span className="tx"><span className="tt">Demander un avis Google à un {term}</span><span className="ts">après un(e) {term} satisfait(e)</span></span>
              <button className="asx-do" onClick={() => setView("avisIn")}>▶ Lui demander</button>
            </div>
          )}
          <div className="asx-task">
            <span className="ic">💬</span>
            <span className="tx"><span className="tt">Répondre à un {term} pendant que je travaille</span><span className="ts">rendez-vous, infos pratiques</span></span>
            <button className="asx-do" onClick={() => setView("questionIn")}>▶ Voir comment</button>
          </div>
          {!avisAllowed && (
            <div className="asx-task">
              <span className="ic">📋</span>
              <span className="tx"><span className="tt">Préparer la consultation</span><span className="ts">infos pratiques la veille du rendez-vous</span></span>
              <button className="asx-do" onClick={playPreparer}>▶ Voir comment</button>
            </div>
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
          <span className="lab"><small>Côté pro · aperçu</small>Action Flash</span>
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
  .asx-send{margin-top:14px;width:100%;background:${accent};color:#fff;border:none;border-radius:22px;padding:13px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;}
  .asx-send:disabled{background:#CBD3CC;cursor:default;}
  .asx-prev{background:#F4F2EC;border:1px solid #E7E4DC;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.45;color:#3A3A32;}
  .asx-prev .asx-to{font-size:10.5px;color:#71766C;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;}
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
  .asx-fl .asx-ck{flex:none;width:22px;height:22px;border-radius:6px;border:2px solid #E0DAF0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:900;background:#fff;}
  .asx-fl.optbtn.sel .asx-ck{background:#6B4BC7;border-color:#6B4BC7;}
  .asx-optcard{margin-top:14px;background:linear-gradient(120deg,#F5F3FF,#fff);border:1px solid #E4DEF7;border-radius:14px;padding:14px 15px;font-size:13px;line-height:1.5;color:#3A3A32;text-align:left;}
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
  .asx-reachbox{margin-top:14px;border:1px solid #E0D8F5;background:linear-gradient(160deg,#F7F3FF,#fff);border-radius:14px;padding:14px;text-align:center;}
  .asx-reachnum{font-size:26px;font-weight:850;color:#5B3FA6;letter-spacing:-.02em;}
  .asx-reachnum b{font-size:32px;}
  .asx-reachtx{font-size:12.5px;color:#5F6358;line-height:1.5;margin-top:5px;}
  .asx-simnote{margin-top:12px;font-size:11.5px;line-height:1.45;color:#6B5418;background:#FBF3E4;border:1px solid #EBD9AE;border-radius:11px;padding:10px 12px;}
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
