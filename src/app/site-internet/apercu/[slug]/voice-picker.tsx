"use client";

// Petit sélecteur de voix : liste les voix françaises installées sur l'appareil
// et mémorise le choix (persisté). Utilisé par l'accueil (maquette) et l'Espace
// Pro. N'affiche rien s'il n'y a qu'une seule voix (aucun choix à faire).
import { useEffect, useState } from "react";
import { getFrenchVoices, getPreferredVoiceURI, setPreferredVoiceURI, onVoicesChanged, speak, cloudTtsActive } from "@/lib/site-internet/speech";

export function VoicePicker({ light = false }: { light?: boolean }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [uri, setUri] = useState("");

  useEffect(() => {
    const load = () => {
      setVoices(getFrenchVoices());
      setUri(getPreferredVoiceURI());
    };
    load();
    const off = onVoicesChanged(load);
    return off;
  }, []);

  // Voix cloud premium active (démo) → le choix des voix navigateur n'a plus de sens.
  if (cloudTtsActive()) return null;
  if (voices.length <= 1) return null;

  const onChange = (v: string) => {
    setUri(v);
    setPreferredVoiceURI(v);
    // Petit aperçu audio pour entendre la voix choisie tout de suite.
    speak("Voici ma voix.");
  };

  const cls = light ? "vpick light" : "vpick";
  return (
    <div className={cls}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vpick{display:flex;align-items:center;gap:7px;font-size:11.5px;}
          .vpick .lb{opacity:.75;white-space:nowrap;}
          .vpick select{flex:1;min-width:0;border:1px solid rgba(0,0,0,.15);border-radius:8px;padding:5px 7px;font-size:11.5px;font-family:inherit;background:#fff;color:#14140F;}
          .vpick.light .lb{color:#fff;opacity:.85;}
          .vpick.light select{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff;}
          .vpick.light select option{color:#14140F;}
          `,
        }}
      />
      <span className="lb">🗣 Voix</span>
      <select value={uri} onChange={(e) => onChange(e.target.value)} aria-label="Choisir la voix">
        <option value="">Par défaut</option>
        {voices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
