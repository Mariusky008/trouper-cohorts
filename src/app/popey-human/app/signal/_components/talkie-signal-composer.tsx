"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  createSignalAction: (formData: FormData) => Promise<void>;
  initialSuccessVisible?: boolean;
};

export function TalkieSignalComposer({ createSignalAction, initialSuccessVisible = false }: Props) {
  const baseDetail =
    "Signal vocal transmis depuis le mode talkie-walkie. Merci de qualifier le besoin et d'activer les métiers concernés.";
  const successDetailText =
    "Merci pour ce signal. Je traite l'information immédiatement : je qualifie le besoin du client et j'active les membres du Cercle concernés. On continue de faire pleuvoir le business sur Dax !";
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ackVisible, setAckVisible] = useState(initialSuccessVisible);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  useEffect(() => {
    setAckVisible(initialSuccessVisible);
  }, [initialSuccessVisible]);

  const startRecording = async () => {
    setErrorMessage("");
    setAckVisible(false);
    setIsPreparing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await uploadAndSubmit();
      };
      recorder.onstart = () => {
        setIsPreparing(false);
        setIsRecording(true);
      };
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      // Emit chunks frequently to avoid browser-dependent clipping at start/end.
      recorder.start(250);
    } catch {
      setIsPreparing(false);
      setErrorMessage("Impossible d'accéder au micro. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    setIsStopping(true);
    // Keep a short tail window to avoid clipping the final spoken words.
    setTimeout(() => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
      mediaRecorderRef.current.stop();
      setIsStopping(false);
    }, 350);
    setIsRecording(false);
    setIsPreparing(false);
  };

  const uploadAndSubmit = async () => {
    const submitSignal = (detailText: string, audioPath: string, durationSeconds: number) => {
      const titleInput = formRef.current?.querySelector('input[name="title"]') as HTMLInputElement | null;
      const detailInput = formRef.current?.querySelector('input[name="detail"]') as HTMLInputElement | null;
      const strengthInput = formRef.current?.querySelector('input[name="signal_strength"]') as HTMLInputElement | null;
      const targetInput = formRef.current?.querySelector('input[name="target_member_id"]') as HTMLInputElement | null;
      const audioUrlInput = formRef.current?.querySelector('input[name="audio_url"]') as HTMLInputElement | null;
      const audioDurationInput = formRef.current?.querySelector('input[name="audio_duration_seconds"]') as HTMLInputElement | null;
      const currentUrlInput = formRef.current?.querySelector('input[name="current_url"]') as HTMLInputElement | null;

      if (!titleInput || !detailInput || !strengthInput || !targetInput || !audioUrlInput || !audioDurationInput || !currentUrlInput || !formRef.current) {
        throw new Error("Formulaire signal introuvable.");
      }

      titleInput.value = "Signal vocal";
      detailInput.value = detailText;
      strengthInput.value = "3";
      targetInput.value = "";
      audioUrlInput.value = audioPath;
      audioDurationInput.value = String(durationSeconds);
      currentUrlInput.value = "/popey-human/app/signal";
      formRef.current.requestSubmit();
    };

    try {
      setIsUploading(true);
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const durationSeconds = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
      if (blob.size === 0) {
        setAckVisible(false);
        setErrorMessage("Aucun son capté. Réessayez et autorisez le micro.");
        return;
      }

      // Show feedback immediately after stop while upload/submit completes.
      setAckVisible(true);
      const filePath = `signals/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("human-signals-audio").upload(filePath, blob, {
        contentType: "audio/webm",
        upsert: false,
      });

      if (uploadError) {
        setAckVisible(false);
        setErrorMessage(`Upload audio indisponible: ${uploadError.message}`);
        return;
      }

      submitSignal(baseDetail, filePath, durationSeconds);
    } catch {
      setAckVisible(false);
      setErrorMessage("Envoi impossible. Vérifiez les permissions micro et réessayez.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-[calc(100svh-260px)] flex-col">
        <div className="px-1">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Signal vocal</p>
          <h3 className="mt-1 text-2xl font-black">Mode Talkie-Walkie</h3>
          <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
            Appuyez pour transmettre votre opportunité. Je qualifie le besoin puis j&apos;active les métiers concernés.
          </p>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <span className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30 animate-[talkieRing_1.6s_ease-out_infinite]" />
          <span
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 animate-[talkieRing_2.1s_ease-out_infinite]"
            style={{ animationDelay: "250ms" }}
          />
          <span
            className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/15 animate-[talkieRing_2.6s_ease-out_infinite]"
            style={{ animationDelay: "450ms" }}
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading || isPreparing || isStopping}
            className={`talkie-btn relative h-48 w-48 rounded-full border-2 text-base font-black uppercase tracking-wide ${
              isRecording
                ? "bg-red-500 text-white border-red-300/60"
                : isPreparing
                ? "bg-amber-400 text-black border-amber-200/70"
                : "bg-gradient-to-b from-emerald-400 via-cyan-300 to-cyan-400 text-[#10263A] border-cyan-200/70 shadow-[0_24px_48px_-22px_rgba(52,211,153,0.9)]"
            } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full animate-[talkieGlow_1.6s_ease-in-out_infinite]" />
            <span className="relative z-10">
              {isUploading ? "Upload..." : isPreparing ? "Préparation..." : isStopping ? "Finalisation..." : isRecording ? "Arrêter" : "Appuyer pour parler"}
            </span>
          </button>
        </div>
        {isPreparing && (
          <p className="mt-2 text-center text-xs text-amber-200">
            Initialisation du micro... parlez quand le bouton passe en rouge.
          </p>
        )}
        {isStopping && <p className="mt-2 text-center text-xs text-amber-200">Finalisation de la fin de phrase...</p>}

        {errorMessage && (
          <p className="mt-3 rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMessage}</p>
        )}

        <form ref={formRef} action={createSignalAction} className="hidden">
          <input name="title" />
          <input name="detail" />
          <input name="signal_strength" />
          <input name="target_member_id" />
          <input name="audio_url" />
          <input name="audio_duration_seconds" />
          <input name="current_url" />
        </form>
      </div>
      {ackVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[680px] rounded-3xl border border-cyan-300/25 bg-[#101820] p-4 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <p className="text-center text-4xl sm:text-5xl leading-none">✅</p>
            <h4 className="mt-3 text-2xl sm:text-4xl font-black text-white">Bien reçu ! 🎙️</h4>
            <p className="mt-3 text-base sm:text-xl leading-relaxed text-white/95">
              {successDetailText}
            </p>
            <button
              type="button"
              onClick={() => {
                setAckVisible(false);
                router.replace("/popey-human/app/signal");
              }}
              className="mt-5 h-12 sm:h-14 w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 text-lg sm:text-xl font-black uppercase tracking-wide text-[#10263A]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
