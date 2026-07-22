"use client";

// Bouton central « Assistante » de l'Espace Pro + chat. Le pro écrit ce qu'il veut
// (« préviens mes clients d'une promo », « mes RDV de demain »…), l'assistante
// comprend et OUVRE le bon outil (via l'évènement pro-goto-tab). Comme sur la
// démo : on lui parle, elle agit — et elle guide si on est perdu. Elle ne fait
// que router vers des fonctionnalités réelles (aucune promesse en l'air).
import { useEffect, useRef, useState } from "react";
import { speechSupported, speak, stopSpeaking, onSpeakingChange, initCloudTts, unlockAudio } from "@/lib/site-internet/speech";
import { VoicePicker } from "../../apercu/[slug]/voice-picker";

type Msg = { who: "ai" | "me"; text: string; goto?: string | null; label?: string | null; prefill?: string | null };

// Reconnaissance vocale (Web Speech API) — typage minimal pour éviter `any`.
interface SRResultItem { transcript: string }
interface SRResult { isFinal: boolean; 0: SRResultItem }
interface SREvent { resultIndex: number; results: { length: number; [i: number]: SRResult } }
interface SRInstance { lang: string; interimResults: boolean; continuous: boolean; onresult: (e: SREvent) => void; onerror: () => void; onend: () => void; start(): void; stop(): void }
type SRCtor = new () => SRInstance;
const getSR = (): SRCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const SUGGESTIONS = [
  "Prévenir mes clients d'une promo",
  "Mes rendez-vous de demain",
  "Demander un avis à un client",
  "Modifier mes tarifs",
];

export function ProAssistantHub({ slug, token, nom }: { slug: string; token: string; nom: string }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [ttsOk, setTtsOk] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<SRInstance | null>(null);
  const spokenRef = useRef(0);

  useEffect(() => onSpeakingChange(setSpeaking), []);

  const enterVoiceMode = () => {
    setOpen(false);
    setVoiceMode(true);
    setSpeakOn(true);
    initCloudTts({ slug, scope: "pro", token }); // voix premium (démo pro)
    unlockAudio(); // débloque l'audio cloud dans le geste (iOS)
    // On énonce le message d'accueil directement (débloque la voix dans le geste,
    // iOS) → spokenRef couvre le greeting pour que l'effet ne le relise pas.
    const willGreet = thread.length === 0;
    spokenRef.current = willGreet ? 1 : thread.length;
    if (willGreet) {
      setThread([{ who: "ai", text: `Bonjour${nom ? `, ${nom}` : ""} 👋 Je vous écoute — dites-moi ce que vous voulez faire.` }]);
    }
    speak(`Bonjour${nom ? `, ${nom}` : ""}. Je vous écoute.`);
  };

  const exitVoiceMode = () => {
    stopSpeaking();
    if (listening) recRef.current?.stop();
    setVoiceMode(false);
  };

  useEffect(() => {
    setVoiceOn(getSR() !== null);
    setTtsOk(speechSupported());
  }, []);

  useEffect(() => {
    if (!open) stopSpeaking();
  }, [open]);

  // Lit à voix haute chaque nouvelle réponse de l'assistante (si la voix est ON).
  useEffect(() => {
    if (!speakOn) return;
    if (thread.length <= spokenRef.current) return;
    const last = thread[thread.length - 1];
    spokenRef.current = thread.length;
    if (last && last.who === "ai") speak(last.text);
  }, [thread, speakOn]);

  const toggleSpeak = () => {
    const next = !speakOn;
    setSpeakOn(next);
    spokenRef.current = thread.length; // ne relit pas l'historique en réactivant
    // IMPORTANT (iOS/Safari) : on prononce une phrase DANS le geste du tap pour
    // « débloquer » la synthèse vocale — sinon les réponses (asynchrones) restent muettes.
    if (next) {
      initCloudTts({ slug, scope: "pro", token }); // voix premium (démo pro)
      unlockAudio();
      speak("Voix activée, je vous réponds à voix haute.");
    } else {
      stopSpeaking();
    }
  };

  useEffect(() => {
    if (open && thread.length === 0) {
      setThread([
        { who: "ai", text: `Bonjour${nom ? `, ${nom}` : ""} 👋 Dites-moi ce que vous voulez faire — je m'en occupe ou je vous emmène au bon endroit.` },
      ]);
    }
  }, [open, thread.length, nom]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread, busy]);

  const goto = (key: string, prefill?: string | null) => {
    // Pré-remplissage éventuel (ex. le texte d'annonce déjà rédigé) → l'outil
    // cible l'applique via l'évènement pro-prefill, avant d'ouvrir l'onglet.
    if (prefill && key === "clients:annonce") {
      window.dispatchEvent(new CustomEvent("pro-prefill", { detail: { target: "annonce", text: prefill } }));
    }
    window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: key }));
    // On ferme TOUT (chat + mode vocal plein écran), sinon l'overlay masque
    // l'onglet vers lequel on vient de basculer.
    stopSpeaking();
    setVoiceMode(false);
    setOpen(false);
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    // Historique AVANT d'ajouter le nouveau message (pour que l'IA suive le fil).
    const history = thread.map((m) => ({ role: m.who, text: m.text }));
    setThread((t) => [...t, { who: "me", text: q }]);
    setBusy(true);
    try {
      const r = await fetch("/api/site-internet/pro/assistant-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, message: q, history }),
      });
      const j = await r.json().catch(() => ({}));
      const reply = typeof j.reply === "string" && j.reply ? j.reply : "Je n'ai pas bien saisi — pouvez-vous reformuler ?";
      const gkey = typeof j.goto === "string" ? j.goto : null;
      const pf = typeof j.prefill === "string" && j.prefill ? j.prefill : null;
      setThread((t) => [...t, { who: "ai", text: reply, goto: gkey, label: typeof j.label === "string" ? j.label : null, prefill: pf }]);
    } catch {
      setThread((t) => [...t, { who: "ai", text: "Je n'arrive pas à vous répondre à l'instant. Réessayez dans un moment." }]);
    } finally {
      setBusy(false);
    }
  };

  // Dictée vocale : on remplit le champ en direct et on envoie à la fin.
  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = getSR();
    if (!SR) return;
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      const t = finalText.trim();
      if (t) send(t);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  // Derniers messages + état de l'orbe (pour le mode vocal plein écran).
  const lastAi = [...thread].reverse().find((m) => m.who === "ai") || null;
  const lastMe = [...thread].reverse().find((m) => m.who === "me") || null;
  const orbState = speaking ? "speaking" : listening ? "listening" : busy ? "thinking" : "idle";
  const orbHint = speaking ? "" : listening ? "Je vous écoute…" : busy ? "Un instant…" : "Touchez le micro et parlez";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .hubfab{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(64px + env(safe-area-inset-bottom));z-index:45;
            display:inline-flex;align-items:center;gap:9px;border:none;cursor:pointer;font-family:inherit;
            background:linear-gradient(135deg,#8A6BE0,#5B3FA6);color:#fff;font-size:14.5px;font-weight:700;
            padding:14px 22px;border-radius:30px;box-shadow:0 12px 30px -8px rgba(91,63,166,.7);animation:hubpulse 3s ease-in-out infinite;}
          .pro .hubfab .sp{font-size:17px;}
          @keyframes hubpulse{0%,100%{box-shadow:0 12px 30px -8px rgba(91,63,166,.7)}50%{box-shadow:0 12px 40px -6px rgba(91,63,166,.95)}}
          @media (prefers-reduced-motion:reduce){.pro .hubfab{animation:none}}

          .pro .hubov{position:fixed;inset:0;z-index:60;background:rgba(20,20,15,.5);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);display:flex;align-items:flex-end;justify-content:center;animation:hubfade .2s ease;}
          @keyframes hubfade{from{opacity:0}to{opacity:1}}
          .pro .hubsheet{width:100%;max-width:440px;background:var(--paper);border-radius:22px 22px 0 0;max-height:86vh;display:flex;flex-direction:column;animation:hubup .26s cubic-bezier(.2,.8,.2,1);overflow:hidden;}
          @keyframes hubup{from{transform:translateY(30px)}to{transform:translateY(0)}}
          .pro .hubsheet .hh{display:flex;align-items:center;gap:11px;padding:15px 16px;border-bottom:1px solid var(--hair);background:linear-gradient(120deg,#F7F3FF,#FCFBF9 60%);}
          /* Orbe vivante : dégradé animé + respiration ; halo pulsé quand elle parle */
          .pro .hubsheet .hh .av{position:relative;width:38px;height:38px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
            background:conic-gradient(from 0deg,#8A6BE0,#5B3FA6,#B37FE0,#5B3FA6,#8A6BE0);animation:hubspin 7s linear infinite;box-shadow:0 4px 14px -3px rgba(91,63,166,.55);}
          .pro .hubsheet .hh .av .glyph{width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:#5B3FA6;font-size:15px;}
          .pro .hubsheet .hh .av::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(139,107,224,.5);opacity:0;}
          .pro .hubsheet .hh .av.talking::after{animation:hubring 1.3s ease-out infinite;}
          .pro .hubsheet .hh .av.talking{box-shadow:0 0 0 4px rgba(139,107,224,.18),0 6px 20px -2px rgba(91,63,166,.7);}
          @keyframes hubspin{to{transform:rotate(360deg)}}
          @keyframes hubring{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
          .pro .hubsheet .hh .whowrap{min-width:0;}
          .pro .hubsheet .hh .nm{font-size:13.5px;font-weight:700;}
          .pro .hubsheet .hh .sub{font-size:11px;color:var(--faint);}
          /* Égaliseur : montre visuellement que la voix parle */
          .pro .hubsheet .hh .eq{display:flex;align-items:flex-end;gap:2.5px;height:13px;margin-top:3px;}
          .pro .hubsheet .hh .eq i{width:2.5px;background:linear-gradient(#8A6BE0,#5B3FA6);border-radius:2px;animation:hubeq .9s ease-in-out infinite;}
          .pro .hubsheet .hh .eq i:nth-child(1){height:40%;animation-delay:0s}
          .pro .hubsheet .hh .eq i:nth-child(2){height:90%;animation-delay:.15s}
          .pro .hubsheet .hh .eq i:nth-child(3){height:60%;animation-delay:.3s}
          .pro .hubsheet .hh .eq i:nth-child(4){height:100%;animation-delay:.45s}
          .pro .hubsheet .hh .eq i:nth-child(5){height:50%;animation-delay:.6s}
          @keyframes hubeq{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
          @media (prefers-reduced-motion:reduce){.pro .hubsheet .hh .av,.pro .hubsheet .hh .av.talking::after,.pro .hubsheet .hh .eq i{animation:none}}
          .pro .hubsheet .hh .vmode{margin-left:auto;border:none;background:#F1EEF9;border-radius:50%;width:34px;height:34px;font-size:15px;cursor:pointer;line-height:1;}
          .pro .hubsheet .hh .spk{margin-left:6px;border:none;background:#F1EEF9;border-radius:50%;width:34px;height:34px;font-size:15px;cursor:pointer;line-height:1;}
          .pro .hubsheet .hh .spk.on{background:#E7DEFB;}
          .pro .hubsheet .hh .x{margin-left:6px;border:none;background:none;font-size:22px;color:var(--faint);cursor:pointer;line-height:1;padding:4px;}
          .pro .hubsheet .hubvbar{padding:8px 14px;background:#F6F4EF;border-bottom:1px solid var(--hair);}
          .pro .hubsheet .body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
          .pro .hubsheet .b,.pro .hubsheet .draft,.pro .hubsheet .open{animation:hubmsgin .32s cubic-bezier(.2,.8,.2,1);}
          @keyframes hubmsgin{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
          @media (prefers-reduced-motion:reduce){.pro .hubsheet .b,.pro .hubsheet .draft,.pro .hubsheet .open{animation:none}}
          .pro .hubsheet .b{max-width:86%;padding:11px 14px;border-radius:15px;font-size:13.5px;line-height:1.45;white-space:pre-line;}
          .pro .hubsheet .b.ai{align-self:flex-start;background:#F1EEF9;color:#2A2340;border-top-left-radius:5px;}
          .pro .hubsheet .b.me{align-self:flex-end;background:var(--ink);color:#fff;border-top-right-radius:5px;}
          .pro .hubsheet .draft{align-self:flex-start;max-width:86%;background:#fff;border:1px solid #D9CFF0;border-radius:14px;border-top-left-radius:5px;padding:11px 13px;font-size:13px;line-height:1.5;color:#2A2340;white-space:pre-line;}
          .pro .hubsheet .open{align-self:flex-start;margin-top:-3px;background:#5B3FA6;color:#fff;border:none;border-radius:12px;padding:10px 15px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
          .pro .hubsheet .dots{align-self:flex-start;display:flex;gap:4px;padding:6px 4px;}
          .pro .hubsheet .dots span{width:7px;height:7px;border-radius:50%;background:#B9A6EC;animation:hubdot 1s infinite;}
          .pro .hubsheet .dots span:nth-child(2){animation-delay:.15s}.pro .hubsheet .dots span:nth-child(3){animation-delay:.3s}
          @keyframes hubdot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
          .pro .hubsheet .sug{display:flex;flex-wrap:wrap;gap:7px;padding:0 16px 8px;}
          .pro .hubsheet .sug button{border:1px solid var(--hair);background:#fff;border-radius:16px;padding:8px 12px;font-size:12px;font-weight:600;color:var(--ink);cursor:pointer;font-family:inherit;}
          .pro .hubsheet .inp{display:flex;gap:8px;padding:12px 14px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--hair);}
          .pro .hubsheet .inp input{flex:1;border:1px solid var(--hair);border-radius:22px;padding:12px 15px;font-size:14px;font-family:inherit;background:#fff;}
          .pro .hubsheet .inp button{border:none;background:#5B3FA6;color:#fff;border-radius:50%;width:44px;height:44px;font-size:18px;cursor:pointer;flex:none;}
          .pro .hubsheet .inp button:disabled{opacity:.5;cursor:not-allowed;}
          .pro .hubsheet .inp .mic{background:#F1EEF9;color:#5B3FA6;font-size:17px;}
          .pro .hubsheet .inp .mic.on{background:#E5484D;color:#fff;animation:hubmic 1s ease-in-out infinite;}
          @keyframes hubmic{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,.5)}50%{box-shadow:0 0 0 7px rgba(229,72,77,0)}}
          @media (prefers-reduced-motion:reduce){.pro .hubsheet .inp .mic.on{animation:none}}
          @media (min-width:900px){
            .pro .hubfab{left:auto;right:32px;transform:none;bottom:32px;}
            .pro .hubov{align-items:center;}
            .pro .hubsheet{border-radius:20px;max-height:80vh;margin:0 16px;}
          }

          /* ═══════════ MODE VOCAL PLEIN ÉCRAN ═══════════ */
          .pro .vmov{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
            padding:32px 22px calc(28px + env(safe-area-inset-bottom));text-align:center;
            background:radial-gradient(120% 90% at 50% 18%,#2A2350 0%,#15132B 55%,#0B0A17 100%);color:#fff;animation:hubfade .25s ease;}
          .pro .vmov .vm-x{position:absolute;top:calc(14px + env(safe-area-inset-top));right:16px;width:40px;height:40px;border-radius:50%;
            background:rgba(255,255,255,.12);border:none;color:#fff;font-size:22px;cursor:pointer;}
          /* Orbe : cœur en dégradé + halos concentriques. Réagit à l'état. */
          .pro .vmov .vorb{position:relative;width:210px;height:210px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
          .pro .vmov .vorb .vo-core{position:absolute;inset:34px;border-radius:50%;
            background:radial-gradient(circle at 35% 30%,#C6A8FF,#8A6BE0 45%,#5B3FA6 75%,#3C2A78);
            box-shadow:0 0 60px -6px rgba(139,107,224,.8),inset 0 0 40px rgba(255,255,255,.25);animation:voBreath 4s ease-in-out infinite;}
          .pro .vmov .vorb .vo-glyph{position:relative;font-size:30px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.35);}
          .pro .vmov .vorb .vo-ring{position:absolute;border-radius:50%;border:2px solid rgba(178,150,255,.5);opacity:0;}
          .pro .vmov .vorb .vo-ring.r1{inset:14px;} .pro .vmov .vorb .vo-ring.r2{inset:0;}
          /* Idle : douce respiration. */
          @keyframes voBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
          /* Elle écoute : anneaux qui s'ouvrent. */
          .pro .vmov .vorb.listening .vo-ring{animation:voRing 1.6s ease-out infinite;}
          .pro .vmov .vorb.listening .vo-ring.r2{animation-delay:.5s;}
          .pro .vmov .vorb.listening .vo-core{box-shadow:0 0 70px 0 rgba(120,220,170,.6),inset 0 0 40px rgba(255,255,255,.3);background:radial-gradient(circle at 35% 30%,#A8FFD0,#4FD98A 45%,#2FA36A 78%);}
          @keyframes voRing{0%{opacity:.7;transform:scale(.7)}100%{opacity:0;transform:scale(1.15)}}
          /* Elle réfléchit : rotation lumineuse. */
          .pro .vmov .vorb.thinking .vo-core{animation:voBreath 4s ease-in-out infinite,voSpin 2.4s linear infinite;}
          @keyframes voSpin{to{transform:rotate(360deg)}}
          /* Elle parle : pulsations rapides. */
          .pro .vmov .vorb.speaking .vo-core{animation:voTalk .5s ease-in-out infinite;}
          @keyframes voTalk{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
          .pro .vmov .vorb.speaking .vo-ring{animation:voRing 1s ease-out infinite;}
          .pro .vmov .vm-cap{max-width:520px;min-height:70px;}
          .pro .vmov .vm-me{font-size:13px;color:#B9A6EC;margin-bottom:8px;}
          .pro .vmov .vm-ai{font-size:18px;line-height:1.45;font-weight:500;white-space:pre-line;}
          .pro .vmov .vm-open{background:#fff;color:#3C2A78;border:none;border-radius:14px;padding:12px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
          .pro .vmov .vm-hint{font-size:12.5px;color:rgba(255,255,255,.6);}
          .pro .vmov .vm-mic{width:74px;height:74px;border-radius:50%;border:none;cursor:pointer;font-size:26px;color:#fff;
            background:linear-gradient(135deg,#8A6BE0,#5B3FA6);box-shadow:0 12px 30px -6px rgba(139,107,224,.7);}
          .pro .vmov .vm-mic.on{background:linear-gradient(135deg,#E5484D,#B3363A);animation:hubmic 1s ease-in-out infinite;}
          .pro .vmov .vm-mic:disabled{opacity:.55;cursor:not-allowed;}
          .pro .vmov .vm-foot{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.4);}
          @media (prefers-reduced-motion:reduce){
            .pro .vmov .vorb .vo-core,.pro .vmov .vorb.listening .vo-ring,.pro .vmov .vorb.speaking .vo-core,.pro .vmov .vorb.thinking .vo-core,.pro .vmov .vm-mic.on{animation:none}
          }
          `,
        }}
      />

      {!open && (
        <button type="button" className="hubfab" onClick={() => setOpen(true)} aria-label="Parler à mon assistante">
          <span className="sp">✦</span> Mon assistante
        </button>
      )}

      {open && (
        <div className="hubov" onClick={() => { stopSpeaking(); setOpen(false); }}>
          <div className="hubsheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Assistante">
            <div className="hh">
              <span className={`av${speaking ? " talking" : ""}`}><span className="glyph">✦</span></span>
              <span className="whowrap">
                <div className="nm">Votre assistante</div>
                {speaking ? (
                  <div className="eq" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                ) : (
                  <div className="sub">Dites-moi ce que vous voulez faire</div>
                )}
              </span>
              {voiceOn && ttsOk && (
                <button className="vmode" onClick={enterVoiceMode} aria-label="Mode vocal" title="Mode vocal plein écran">🎧</button>
              )}
              {ttsOk && (
                <button
                  className={`spk${speakOn ? " on" : ""}`}
                  onClick={toggleSpeak}
                  aria-label={speakOn ? "Couper la voix" : "Activer la voix"}
                  title={speakOn ? "Voix activée" : "Voix coupée"}
                >
                  {speakOn ? "🔊" : "🔇"}
                </button>
              )}
              <button className="x" onClick={() => { stopSpeaking(); setOpen(false); }} aria-label="Fermer">×</button>
            </div>

            {ttsOk && speakOn && (
              <div className="hubvbar"><VoicePicker /></div>
            )}

            <div className="body" ref={scroller}>
              {thread.map((m, i) => (
                <div key={i} style={{ display: "contents" }}>
                  <div className={`b ${m.who}`}>{m.text}</div>
                  {m.who === "ai" && m.prefill && (
                    <div className="draft">✍️ {m.prefill}</div>
                  )}
                  {m.who === "ai" && m.goto && (
                    <button className="open" onClick={() => goto(m.goto as string, m.prefill)}>
                      {m.prefill ? "Ouvrir avec ce texte →" : `Ouvrir${m.label ? ` « ${m.label} »` : ""} →`}
                    </button>
                  )}
                </div>
              ))}
              {busy && <div className="dots"><span /><span /><span /></div>}
            </div>

            {thread.length <= 1 && !busy && (
              <div className="sug">
                {SUGGESTIONS.map((sg) => (
                  <button key={sg} type="button" onClick={() => send(sg)}>{sg}</button>
                ))}
              </div>
            )}

            <div className="inp">
              {voiceOn && (
                <button
                  type="button"
                  className={`mic${listening ? " on" : ""}`}
                  onClick={toggleMic}
                  aria-label={listening ? "Arrêter la dictée" : "Parler"}
                  title={listening ? "J'écoute…" : "Parler à l'assistante"}
                >
                  {listening ? "●" : "🎤"}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                placeholder={listening ? "J'écoute…" : "Ex. préviens mes clients d'une promo"}
                aria-label="Votre demande"
              />
              <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Envoyer">↑</button>
            </div>
          </div>
        </div>
      )}

      {voiceMode && (
        <div className="vmov" role="dialog" aria-label="Mode vocal">
          <button className="vm-x" onClick={exitVoiceMode} aria-label="Quitter le mode vocal">×</button>
          <div className={`vorb ${orbState}`} onClick={toggleMic}>
            <span className="vo-core" />
            <span className="vo-ring r1" />
            <span className="vo-ring r2" />
            <span className="vo-glyph">✦</span>
          </div>

          <div className="vm-cap">
            {lastMe && <div className="vm-me">« {lastMe.text} »</div>}
            <div className="vm-ai">{lastAi ? lastAi.text : ""}</div>
          </div>

          {lastAi && lastAi.goto && !speaking && !listening && !busy && (
            <button className="vm-open" onClick={() => goto(lastAi.goto as string, lastAi.prefill)}>
              Ouvrir{lastAi.label ? ` « ${lastAi.label} »` : ""} →
            </button>
          )}

          <div className="vm-hint">{orbHint}</div>
          <button
            className={`vm-mic${listening ? " on" : ""}`}
            onClick={toggleMic}
            disabled={busy || speaking}
            aria-label={listening ? "Arrêter" : "Parler"}
          >
            {listening ? "●" : "🎤"}
          </button>
          <div className="vm-foot">Mode vocal · parlez naturellement</div>
        </div>
      )}
    </>
  );
}
