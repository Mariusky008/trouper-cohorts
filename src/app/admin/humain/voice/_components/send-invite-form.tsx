"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function SendVoiceInviteForm() {
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("Dax");
  const [job, setJob] = useState("coach sportif");
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  async function submit() {
    const payload = { phone, firstName, city, job };
    setState({ status: "submitting" });
    const res = await fetch("/api/admin/humain/voice/send-whatsapp-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as null | { success?: boolean; error?: string; to?: string };
    if (!res.ok || !json?.success) {
      setState({ status: "error", message: json?.error || "Erreur d'envoi." });
      return;
    }
    setState({ status: "success", message: `Invite envoyée à ${json.to}` });
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-black">Envoyer une invite WhatsApp</h2>
      <p className="mt-1 text-sm text-muted-foreground">Envoie le message initial qui explique “RAPPEL” + le lien /popey-human/rappel.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="voice-invite-phone">Téléphone (E.164)</Label>
          <Input
            id="voice-invite-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33612345678"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voice-invite-firstname">Prénom</Label>
          <Input id="voice-invite-firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Camille" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voice-invite-city">Ville</Label>
          <Input id="voice-invite-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dax" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voice-invite-job">Métier</Label>
          <Input id="voice-invite-job" value={job} onChange={(e) => setJob(e.target.value)} placeholder="coach sportif" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => startTransition(submit)}
          disabled={isPending || state.status === "submitting"}
        >
          Envoyer l’invite
        </Button>
        {state.status === "success" ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
        {state.status === "error" ? <p className="text-sm text-red-600">{state.message}</p> : null}
      </div>
    </div>
  );
}

