import http from "node:http";
import { WebSocketServer } from "ws";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type Json = Record<string, unknown>;

function trim(value: unknown): string {
  return String(value || "").trim();
}

function normalizePhone(raw: string | null | undefined): string {
  const value = trim(raw);
  if (!value) return "";
  const clean = value.replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(0, 24);
  if (clean.startsWith("00")) return `+${clean.slice(2, 24)}`;
  if (clean.startsWith("0")) return `+33${clean.slice(1, 24)}`;
  return `+${clean.slice(0, 24)}`;
}

function requireEnv(name: string): string {
  const value = trim(process.env[name]);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function toWaMeLink(whatsappFrom: string, text: string) {
  const phone = trim(whatsappFrom).replace(/^whatsapp:/i, "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function buildDefaultSystemPrompt() {
  return [
    "Tu es l'assistant vocal IA de Jean-Philippe de Popey.",
    "Tu appelles un professionnel local (coach sportif / salle indépendante / préparateur physique / nutritionniste) sur Dax/Bayonne/Pau/Mont-de-Marsan.",
    "Ton objectif: qualifier rapidement (<= 3 minutes), détecter les prospects chauds, envoyer les détails par WhatsApp, et proposer un RDV si nécessaire.",
    "",
    "Contraintes obligatoires:",
    "- Tu dis toujours que tu es l'assistant de Jean-Philippe, jamais Jean-Philippe lui-même.",
    "- Si on te demande si tu es un robot: réponds honnêtement et propose un transfert humain immédiat.",
    "- Si le prospect dit non: tu restes poli, tu raccroches, tu n'insistes pas.",
    "- Maximum 2 relances si hésitation; à la 3e, propose transfert humain.",
    "- Ne promets jamais un nombre de clients, ni un ROI garanti, ni une exclusivité plus large que la ville.",
    "",
    "Script v1 (structure):",
    "INTRO: Bonjour [Prénom], c'est l'assistant de Jean-Philippe de Popey, la plateforme d'accès clients locale des pros des Landes. On référence un seul pro par métier sur [ville] et votre profil correspond.",
    "ACCROCHE: Catalogue Privilège envoyé à 150 membres influents, partagé sur WhatsApp personnel, 25 000 à 100 000 vues hyper-locales, pas de concurrence directe (1 pro par secteur sur la zone).",
    "OFFRE: Une fiche offre exclusive: premier bilan offert / tarif privilège. Introductions qualifiées, pas de pub froide.",
    "QUESTION CLÉ: Est-ce que vous prenez de nouveaux clients en ce moment ?",
    "Si oui: Quel type de client vous convient le mieux ?",
    "CLOSING: Test sur l'édition du mois: vous payez seulement si vous recevez des contacts qualifiés. Je vous envoie le détail par WhatsApp.",
    "",
    "Objections (résumé): budget -> payez uniquement par RDV; c'est quoi Popey -> réseau + catalogue WhatsApp; prix -> 30€ par RDV qualifié livré pour sport/santé; no time -> 10 minutes.",
    "",
    "Transfert humain immédiat si:",
    "- demande explicite d'humain",
    "- question juridique/contractuelle précise",
    "- prêt à signer",
    "- prospect hostile",
    "- >3 minutes sans avancée",
    "- déjà client Popey",
  ].join("\n");
}

async function fetchActiveAgentConfig(supabase: SupabaseClient<any>, ownerMemberId: string) {
  const { data } = await supabase
    .from("human_voice_agent_configs")
    .select("config")
    .eq("owner_member_id", ownerMemberId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cfg = (data?.config || null) as unknown;
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return null;
  return cfg as Json;
}

function getPromptFromConfig(cfg: Json | null) {
  const prompt = cfg ? trim(cfg.system_prompt) : "";
  return prompt || buildDefaultSystemPrompt();
}

type TwilioStartEvent = { event: "start"; start: { callSid: string; streamSid: string } & Record<string, unknown> };
type TwilioMediaEvent = { event: "media"; media: { payload: string } & Record<string, unknown> };
type TwilioStopEvent = { event: "stop" } & Record<string, unknown>;

type OpenAIEvent = { type: string } & Record<string, unknown>;

async function start() {
  const port = Number(process.env.VOICE_BRIDGE_PORT || process.env.PORT || "8787");

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const twilioAccountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = requireEnv("TWILIO_AUTH_TOKEN");
  const openaiKey = requireEnv("OPENAI_API_KEY");
  const openaiModel = trim(process.env.OPENAI_REALTIME_MODEL) || "gpt-4o-realtime-preview";
  const transferTo = normalizePhone(process.env.POPEY_VOICE_TRANSFER_TO || "+33768233347") || "+33768233347";

  const twilioWhatsAppFrom = trim(process.env.TWILIO_WHATSAPP_FROM || "");
  const proSignupUrl = trim(process.env.POPEY_PRO_SIGNUP_URL || "");

  const supabase = createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server, path: "/twilio" });

  wss.on("connection", (twilioWs) => {
    let callSid = "";
    let ownerMemberId: string | null = null;
    let prospectPhone: string | null = null;
    let openaiWs: import("ws").WebSocket | null = null;
    let openaiReady = false;
    let transcriptUser = "";
    let transcriptAssistant = "";
    let callStartedAt = Date.now();
    const functionArgsBuffer = new Map<string, { name: string; json: string }>();

    function sendToTwilio(obj: unknown) {
      try {
        twilioWs.send(JSON.stringify(obj));
      } catch {}
    }

    function sendToOpenAI(obj: unknown) {
      if (!openaiWs || openaiWs.readyState !== openaiWs.OPEN) return;
      openaiWs.send(JSON.stringify(obj));
    }

    async function finalizeCall() {
      if (!callSid || !ownerMemberId) return;
      const durationSec = Math.max(0, Math.round((Date.now() - callStartedAt) / 1000));
      const combined = [
        transcriptUser ? `PROSPECT:\n${transcriptUser}` : "",
        transcriptAssistant ? `ASSISTANT:\n${transcriptAssistant}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const summary = combined ? combined.slice(0, 1200) : "";
      const queueId = await resolveQueueId();
      await supabase.from("human_voice_call_artifacts").upsert(
        {
          queue_id: queueId,
          provider_call_sid: callSid,
          transcript: combined || null,
          summary: summary || null,
          outcome: durationSec >= 10 ? "completed" : "short_call",
          updated_at: new Date().toISOString(),
        } as unknown as Record<string, unknown>,
        { onConflict: "queue_id" },
      );
    }

    async function resolveQueueId(): Promise<string> {
      const { data } = await supabase
        .from("human_voice_outbound_queue")
        .select("id")
        .eq("provider_call_sid", callSid)
        .maybeSingle();
      if (!data?.id) throw new Error("Queue row not found");
      return String(data.id);
    }

    async function loadContext() {
      if (!callSid) return;
      const { data } = await supabase
        .from("human_voice_outbound_queue")
        .select("id,owner_member_id,phone_e164,metadata")
        .eq("provider_call_sid", callSid)
        .maybeSingle();
      if (!data?.id) return;
      const row = (data || null) as null | { id: string; owner_member_id: string; phone_e164: string };
      ownerMemberId = trim(row?.owner_member_id) || null;
      prospectPhone = trim(row?.phone_e164) || null;
      if (!ownerMemberId) return;
      const cfg = await fetchActiveAgentConfig(supabase, ownerMemberId);
      const systemPrompt = getPromptFromConfig(cfg);

      openaiWs = new (await import("ws")).WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(openaiModel)}`, {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      openaiWs.on("open", () => {
        openaiReady = true;
        sendToOpenAI({
          type: "session.update",
          session: {
            instructions: systemPrompt,
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            tools: [
              {
                type: "function",
                name: "send_whatsapp_text",
                description: "Envoie un message WhatsApp au prospect.",
                parameters: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                  },
                  required: ["text"],
                },
              },
              {
                type: "function",
                name: "send_signup_link",
                description: "Envoie le lien d'inscription Popey au prospect via WhatsApp.",
                parameters: {
                  type: "object",
                  properties: {},
                },
              },
              {
                type: "function",
                name: "transfer_to_human",
                description: "Transfère l'appel vers un humain.",
                parameters: {
                  type: "object",
                  properties: {
                    reason: { type: "string" },
                  },
                  required: ["reason"],
                },
              },
              {
                type: "function",
                name: "end_call",
                description: "Raccroche proprement.",
                parameters: { type: "object", properties: {} },
              },
            ],
          },
        });
        sendToOpenAI({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions:
              "Démarre l'appel maintenant avec l'intro du script. Sois chaleureux, local, direct. Pose la question clé après l'accroche.",
          },
        });
      });

      openaiWs.on("message", async (data) => {
        let evt: OpenAIEvent | null = null;
        try {
          evt = JSON.parse(String(data || "")) as OpenAIEvent;
        } catch {
          return;
        }
        if (!evt?.type) return;

        if (evt.type === "response.audio.delta") {
          const delta = typeof evt.delta === "string" ? evt.delta : "";
          if (delta) sendToTwilio({ event: "media", media: { payload: delta } });
          return;
        }

        if (evt.type === "response.audio_transcript.delta") {
          const delta = typeof evt.delta === "string" ? evt.delta : "";
          if (delta) transcriptAssistant += delta;
          return;
        }

        if (evt.type === "conversation.item.input_audio_transcription.completed") {
          const transcript = typeof evt.transcript === "string" ? evt.transcript : "";
          if (transcript) transcriptUser += (transcriptUser ? "\n" : "") + transcript;
          return;
        }

        if (evt.type === "input_audio_buffer.speech_stopped") {
          sendToOpenAI({ type: "response.create", response: { modalities: ["audio", "text"] } });
          return;
        }

        if (evt.type === "response.output_item.added") {
          const item = evt.item && typeof evt.item === "object" && !Array.isArray(evt.item) ? (evt.item as Record<string, unknown>) : null;
          const itemType = item ? trim(item.type) : "";
          const callId = item ? trim(item.call_id) : "";
          const name = item ? trim(item.name) : "";
          if (itemType === "function_call" && callId && name) {
            functionArgsBuffer.set(callId, { name, json: "" });
          }
          return;
        }

        if (evt.type === "response.function_call_arguments.delta") {
          const callId = trim(evt.call_id);
          const delta = typeof evt.delta === "string" ? evt.delta : "";
          const entry = callId ? functionArgsBuffer.get(callId) : null;
          if (entry && delta) entry.json += delta;
          return;
        }

        if (evt.type === "response.function_call_arguments.done") {
          const callId = trim(evt.call_id);
          const entry = callId ? functionArgsBuffer.get(callId) : null;
          if (!entry) return;
          functionArgsBuffer.delete(callId);
          let args: Json = {};
          try {
            args = entry.json ? (JSON.parse(entry.json) as Json) : {};
          } catch {
            args = {};
          }

          if (entry.name === "send_whatsapp_text") {
            const text = trim(args.text);
            if (text && prospectPhone && twilioWhatsAppFrom) {
              await twilioClient.messages.create({
                from: twilioWhatsAppFrom,
                to: `whatsapp:${prospectPhone}`,
                body: text,
              });
            }
            sendToOpenAI({
              type: "conversation.item.create",
              item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ ok: true }) },
            });
            sendToOpenAI({ type: "response.create", response: { modalities: ["audio", "text"] } });
            return;
          }

          if (entry.name === "send_signup_link") {
            const link =
              proSignupUrl ||
              toWaMeLink(twilioWhatsAppFrom, "Bonjour, je veux m'inscrire sur Popey") ||
              trim(process.env.NEXT_PUBLIC_APP_URL || "");
            if (link && prospectPhone && twilioWhatsAppFrom) {
              await twilioClient.messages.create({
                from: twilioWhatsAppFrom,
                to: `whatsapp:${prospectPhone}`,
                body: `Voici le lien d'inscription Popey : ${link}`,
              });
            }
            sendToOpenAI({
              type: "conversation.item.create",
              item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ ok: true, link }) },
            });
            sendToOpenAI({ type: "response.create", response: { modalities: ["audio", "text"] } });
            return;
          }

          if (entry.name === "transfer_to_human") {
            try {
              const vr = new twilio.twiml.VoiceResponse();
              vr.say({ language: "fr-FR" }, "Parfait, je vous passe Jean-Philippe directement. Un instant s'il vous plaît.");
              vr.dial(transferTo);
              await twilioClient.calls(callSid).update({ twiml: vr.toString() });
            } catch {}
            sendToOpenAI({
              type: "conversation.item.create",
              item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ ok: true }) },
            });
            return;
          }

          if (entry.name === "end_call") {
            try {
              await twilioClient.calls(callSid).update({ status: "completed" });
            } catch {}
            sendToOpenAI({
              type: "conversation.item.create",
              item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ ok: true }) },
            });
            return;
          }

          sendToOpenAI({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ ok: false, error: "unknown_tool" }) },
          });
          return;
        }
      });

      openaiWs.on("close", () => {
        openaiReady = false;
      });
    }

    twilioWs.on("message", async (data) => {
      let evt: TwilioStartEvent | TwilioMediaEvent | TwilioStopEvent | null = null;
      try {
        evt = JSON.parse(String(data || "")) as unknown as TwilioStartEvent | TwilioMediaEvent | TwilioStopEvent;
      } catch {
        return;
      }
      if (!evt?.event) return;
      if (evt.event === "start") {
        callSid = trim((evt as TwilioStartEvent).start?.callSid);
        callStartedAt = Date.now();
        await loadContext();
        return;
      }
      if (evt.event === "media") {
        if (!openaiReady) return;
        const payload = trim((evt as TwilioMediaEvent).media?.payload);
        if (!payload) return;
        sendToOpenAI({ type: "input_audio_buffer.append", audio: payload });
        return;
      }
      if (evt.event === "stop") {
        await finalizeCall().catch(() => null);
        try {
          openaiWs?.close();
        } catch {}
        return;
      }
    });

    twilioWs.on("close", () => {
      finalizeCall().catch(() => null);
      try {
        openaiWs?.close();
      } catch {}
    });
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  process.stdout.write(`voice-bridge listening on :${port}\n`);
}

start().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
