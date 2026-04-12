"use client";

import { useRef, useState } from "react";

type Props = {
  createSignalAction: (formData: FormData) => Promise<void>;
};

export function TalkieSignalComposer({ createSignalAction }: Props) {
  const baseDetail =
    "Signal vocal transmis depuis le mode talkie-walkie. Merci de qualifier le besoin et d'activer les métiers concernés.";
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ackVisible, setAckVisible] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  const startRecording = async () => {
    setErrorMessage("");
    setAckVisible(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
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
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
    } catch {
      setErrorMessage("Impossible d'accéder au micro. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const uploadAndSubmit = async () => {
    const submitSignal = (detailText: string) => {
      const titleInput = formRef.current?.querySelector('input[name="title"]') as HTMLInputElement | null;
      const detailInput = formRef.current?.querySelector('input[name="detail"]') as HTMLInputElement | null;
      const strengthInput = formRef.current?.querySelector('input[name="signal_strength"]') as HTMLInputElement | null;
      const targetInput = formRef.current?.querySelector('input[name="target_member_id"]') as HTMLInputElement | null;
      const currentUrlInput = formRef.current?.querySelector('input[name="current_url"]') as HTMLInputElement | null;

      if (!titleInput || !detailInput || !strengthInput || !targetInput || !currentUrlInput || !formRef.current) {
        throw new Error("Formulaire signal introuvable.");
      }

      titleInput.value = "Signal vocal";
      detailInput.value = detailText;
      strengthInput.value = "3";
      targetInput.value = "";
      currentUrlInput.value = "/popey-human/app/signal";
      formRef.current.requestSubmit();
    };

    try {
      setIsUploading(true);
      submitSignal(baseDetail);
      setAckVisible(true);
    } catch {
      setErrorMessage("Envoi impossible. Vérifiez les permissions micro et réessayez.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Signal vocal</p>
      <h3 className="mt-1 text-2xl font-black">Mode Talkie-Walkie</h3>
      <p className="mt-2 text-sm text-white/85 leading-relaxed">
        Appuyez pour transmettre votre opportunité. Je qualifie le besoin puis j&apos;active les métiers concernés.
      </p>

      <div className="relative mt-6 h-56 flex justify-center items-center">
        <span className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/25" />
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
          className={`relative h-40 w-40 rounded-full border-2 text-sm font-black uppercase tracking-wide ${
            isRecording
              ? "bg-red-500 text-white border-red-300/60"
              : "bg-gradient-to-b from-emerald-400 to-emerald-500 text-black border-emerald-300/60"
          } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? "Upload..." : isRecording ? "Arrêter" : "Appuyer pour parler"}
        </button>
      </div>

      {errorMessage && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMessage}</p>
      )}

      {ackVisible && (
        <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Bien reçu. Le signal vocal est en cours d&apos;envoi.
        </p>
      )}

      <form ref={formRef} action={createSignalAction} className="hidden">
        <input name="title" />
        <input name="detail" />
        <input name="signal_strength" />
        <input name="target_member_id" />
        <input name="current_url" />
      </form>
    </div>
  );
}
