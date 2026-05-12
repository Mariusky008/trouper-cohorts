function readBoolean(value: string | undefined, fallback: boolean): boolean {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function trim(value: unknown): string {
  return String(value || "").trim();
}

function stripTrailingSlash(url: string): string {
  return trim(url).replace(/\/+$/, "");
}

function buildDefaultUrl(pathname: string): string {
  const base = stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL || "");
  if (!base) return "";
  return `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export const voiceTwilioConfig = {
  accountSid: trim(process.env.TWILIO_ACCOUNT_SID),
  authToken: trim(process.env.TWILIO_AUTH_TOKEN),
  voiceFrom: trim(process.env.TWILIO_VOICE_FROM),
  twimlUrl: trim(process.env.TWILIO_VOICE_TWIML_URL) || buildDefaultUrl("/api/popey-human/voice/twiml"),
  statusCallbackUrl: trim(process.env.TWILIO_VOICE_STATUS_CALLBACK_URL) || buildDefaultUrl("/api/popey-human/voice/twilio-webhook"),
  recordingStatusCallbackUrl:
    trim(process.env.TWILIO_VOICE_RECORDING_STATUS_CALLBACK_URL) || buildDefaultUrl("/api/popey-human/voice/twilio-webhook"),
  streamUrl: trim(process.env.TWILIO_VOICE_STREAM_URL),
  recordCalls: readBoolean(process.env.TWILIO_VOICE_RECORD_CALLS, true),
  validateWebhookSignature: readBoolean(process.env.TWILIO_VOICE_VALIDATE_WEBHOOK_SIGNATURE, false),
};

export function isVoiceTwilioConfigured() {
  return Boolean(
    voiceTwilioConfig.accountSid &&
      voiceTwilioConfig.authToken &&
      voiceTwilioConfig.voiceFrom &&
      voiceTwilioConfig.twimlUrl &&
      voiceTwilioConfig.statusCallbackUrl,
  );
}

