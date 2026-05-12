"use server";

import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVoiceTwilioConfigured, voiceTwilioConfig } from "@/lib/popey-human/voice-twilio-config";

type QueueStatus = "queued" | "scheduled" | "calling" | "in_progress" | "completed" | "failed" | "cancelled" | "blocked";
type QueueRow = {
  id: string;
  owner_member_id: string;
  phone_e164: string;
  status: QueueStatus;
  attempt_count: number;
  max_attempts: number;
  not_before_at: string;
  last_error?: string | null;
  metadata: Record<string, unknown> | null;
};

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

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const utcIso = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}Z`;
  return Date.parse(utcIso) - date.getTime();
}

function makeDateInTimeZone(timeZone: string, input: { year: number; month: number; day: number; hour: number; minute: number }) {
  const guess = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0));
  const offset = getTimeZoneOffsetMs(timeZone, guess);
  return new Date(guess.getTime() - offset);
}

function getParisParts(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: String(map.weekday || ""),
  };
}

function addParisDays(date: { year: number; month: number; day: number }, days: number) {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + days);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

function computeNextAllowedCallDate(now: Date) {
  const parts = getParisParts(now);
  const isWeekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const windows = [
    { startH: 9, startM: 0, endH: 12, endM: 0 },
    { startH: 14, startM: 0, endH: 18, endM: 30 },
  ];

  function isBefore(aH: number, aM: number, bH: number, bM: number) {
    return aH < bH || (aH === bH && aM < bM);
  }
  function isAfter(aH: number, aM: number, bH: number, bM: number) {
    return aH > bH || (aH === bH && aM > bM);
  }

  const baseDate = { year: parts.year, month: parts.month, day: parts.day };

  if (isWeekend) {
    const monday = addParisDays(baseDate, parts.weekday === "Sat" ? 2 : 1);
    return makeDateInTimeZone("Europe/Paris", { ...monday, hour: 9, minute: 0 });
  }

  const nowH = parts.hour;
  const nowM = parts.minute;

  for (const window of windows) {
    if (!isBefore(nowH, nowM, window.startH, window.startM) && !isAfter(nowH, nowM, window.endH, window.endM)) {
      return now;
    }
  }

  if (isBefore(nowH, nowM, windows[0].startH, windows[0].startM)) {
    return makeDateInTimeZone("Europe/Paris", { ...baseDate, hour: windows[0].startH, minute: windows[0].startM });
  }

  if (isAfter(nowH, nowM, windows[0].endH, windows[0].endM) && isBefore(nowH, nowM, windows[1].startH, windows[1].startM)) {
    return makeDateInTimeZone("Europe/Paris", { ...baseDate, hour: windows[1].startH, minute: windows[1].startM });
  }

  const nextDay = addParisDays(baseDate, 1);
  const nextParts = getParisParts(makeDateInTimeZone("Europe/Paris", { ...nextDay, hour: 9, minute: 0 }));
  if (nextParts.weekday === "Sat") {
    const monday = addParisDays(nextDay, 2);
    return makeDateInTimeZone("Europe/Paris", { ...monday, hour: 9, minute: 0 });
  }
  if (nextParts.weekday === "Sun") {
    const monday = addParisDays(nextDay, 1);
    return makeDateInTimeZone("Europe/Paris", { ...monday, hour: 9, minute: 0 });
  }
  return makeDateInTimeZone("Europe/Paris", { ...nextDay, hour: 9, minute: 0 });
}

function extractTwilioError(input: unknown): { code: string; message: string } {
  const asRecord = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const code = trim(asRecord.code || asRecord.errorCode);
  const message = trim(asRecord.message || asRecord.detail);
  return { code, message };
}

export async function enqueueVoiceCall(input: {
  ownerMemberId: string;
  phoneE164: string;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  const phone = normalizePhone(input.phoneE164);
  if (!phone) return { success: false as const, error: "Numéro invalide." };

  const supabaseAdmin = createAdminClient();
  const now = new Date();
  const notBefore = computeNextAllowedCallDate(now);
  const notBeforeIso = notBefore.toISOString();

  const { data: existing } = await supabaseAdmin
    .from("human_voice_outbound_queue")
    .select("id,status,created_at")
    .eq("owner_member_id", input.ownerMemberId)
    .eq("phone_e164", phone)
    .in("status", ["queued", "scheduled", "calling", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return { success: true as const, queued: true as const, queueId: String(existing.id) };
  }

  const nowIso = now.toISOString();
  const metadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {};
  const { data: inserted, error } = await supabaseAdmin
    .from("human_voice_outbound_queue")
    .insert({
      owner_member_id: input.ownerMemberId,
      phone_e164: phone,
      source: trim(input.source) || "api",
      metadata,
      status: notBeforeIso > nowIso ? "scheduled" : "queued",
      not_before_at: notBeforeIso,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .maybeSingle();
  if (error || !inserted?.id) {
    return { success: false as const, error: "Impossible de créer la demande d'appel." };
  }

  await supabaseAdmin.from("human_voice_events").insert({
    queue_id: inserted.id,
    owner_member_id: input.ownerMemberId,
    phone_e164: phone,
    direction: "system",
    event_type: "enqueued",
    payload: {
      not_before_at: notBeforeIso,
      source: trim(input.source) || "api",
    },
  });

  return { success: true as const, queued: true as const, queueId: String(inserted.id), notBeforeAt: notBeforeIso };
}

export async function runVoiceOutboundQueueSweep(limit?: number) {
  if (!isVoiceTwilioConfigured()) {
    return { success: false as const, error: "Configuration Twilio Voice incomplète." };
  }

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const take = Number.isFinite(limit as number) && (limit as number) > 0 ? Math.min(50, Math.max(1, Math.floor(limit as number))) : 10;

  const { data: rows, error } = await supabaseAdmin
    .from("human_voice_outbound_queue")
    .select("id,owner_member_id,phone_e164,status,attempt_count,max_attempts,not_before_at,metadata")
    .in("status", ["queued", "scheduled", "failed"])
    .lte("not_before_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(take);

  if (error) return { success: false as const, error: "Lecture queue impossible." };
  const queueRows = (rows as QueueRow[]) || [];

  const client = twilio(voiceTwilioConfig.accountSid, voiceTwilioConfig.authToken);

  let processed = 0;
  let initiated = 0;
  let failed = 0;

  for (const row of queueRows) {
    processed += 1;
    if (row.attempt_count >= row.max_attempts) {
      await supabaseAdmin
        .from("human_voice_outbound_queue")
        .update({
          status: "failed",
          failed_at: nowIso,
          last_error: row.last_error || "Max attempts reached",
          updated_at: nowIso,
        })
        .eq("id", row.id);
      continue;
    }

    const nextAttempt = row.attempt_count + 1;
    await supabaseAdmin
      .from("human_voice_outbound_queue")
      .update({
        status: "calling",
        attempt_count: nextAttempt,
        last_error: null,
        updated_at: nowIso,
      })
      .eq("id", row.id);

    await supabaseAdmin.from("human_voice_events").insert({
      queue_id: row.id,
      owner_member_id: row.owner_member_id,
      phone_e164: row.phone_e164,
      direction: "system",
      event_type: "call_attempt",
      payload: { attempt: nextAttempt },
    });

    try {
      const call = await client.calls.create({
        to: row.phone_e164,
        from: voiceTwilioConfig.voiceFrom,
        url: voiceTwilioConfig.twimlUrl,
        method: "POST",
        statusCallback: voiceTwilioConfig.statusCallbackUrl,
        statusCallbackMethod: "POST",
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        ...(voiceTwilioConfig.recordCalls
          ? {
              record: true,
              recordingStatusCallback: voiceTwilioConfig.recordingStatusCallbackUrl,
              recordingStatusCallbackMethod: "POST",
            }
          : {}),
      });

      initiated += 1;

      await supabaseAdmin
        .from("human_voice_outbound_queue")
        .update({
          provider_call_sid: trim(call.sid) || null,
          status: "calling",
          updated_at: nowIso,
        })
        .eq("id", row.id);

      await supabaseAdmin.from("human_voice_events").insert({
        queue_id: row.id,
        owner_member_id: row.owner_member_id,
        phone_e164: row.phone_e164,
        direction: "outbound",
        event_type: "call_initiated",
        payload: {
          provider: "twilio",
          sid: trim(call.sid) || null,
          status: trim(call.status) || null,
        },
      });
    } catch (err) {
      failed += 1;
      const parsed = extractTwilioError(err);
      const lastError = [parsed.code ? `Error ${parsed.code}` : "", parsed.message].filter(Boolean).join(" - ") || "Twilio call failed";
      await supabaseAdmin
        .from("human_voice_outbound_queue")
        .update({
          status: "failed",
          failed_at: nowIso,
          last_error: lastError,
          updated_at: nowIso,
        })
        .eq("id", row.id);
      await supabaseAdmin.from("human_voice_events").insert({
        queue_id: row.id,
        owner_member_id: row.owner_member_id,
        phone_e164: row.phone_e164,
        direction: "status",
        event_type: "failed",
        payload: { provider: "twilio", error: parsed },
      });
    }
  }

  return { success: true as const, processed, initiated, failed, now: nowIso };
}

function mapTwilioCallStatus(raw: string): QueueStatus | null {
  const status = trim(raw).toLowerCase();
  if (status === "queued" || status === "initiated" || status === "ringing") return "calling";
  if (status === "in-progress" || status === "answered") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "canceled") return "cancelled";
  if (status === "busy" || status === "failed" || status === "no-answer") return "failed";
  return null;
}

export async function processTwilioVoiceWebhook(params: Record<string, string>) {
  const supabaseAdmin = createAdminClient();
  const callSid = trim(params.CallSid || params.ParentCallSid);
  const callStatusRaw = trim(params.CallStatus);
  const callStatus = mapTwilioCallStatus(callStatusRaw);
  const toPhone = normalizePhone(params.To);
  const fromPhone = normalizePhone(params.From);

  const recordingSid = trim(params.RecordingSid);
  const recordingUrl = trim(params.RecordingUrl);
  const recordingStatus = trim(params.RecordingStatus);

  let queueId: string | null = null;
  let ownerMemberId: string | null = null;
  let phone: string | null = null;

  if (callSid) {
    const { data } = await supabaseAdmin
      .from("human_voice_outbound_queue")
      .select("id,owner_member_id,phone_e164,status")
      .eq("provider_call_sid", callSid)
      .maybeSingle();
    const row = (data || null) as null | { id: string; owner_member_id: string; phone_e164: string };
    if (row?.id) {
      queueId = String(row.id);
      ownerMemberId = String(row.owner_member_id || "");
      phone = String(row.phone_e164 || "");
    }
  }

  const nowIso = new Date().toISOString();
  if (queueId && callStatus) {
    const updatePayload: Record<string, unknown> = {
      status: callStatus,
      updated_at: nowIso,
    };
    if (callStatus === "in_progress") updatePayload.call_started_at = nowIso;
    if (callStatus === "completed") {
      updatePayload.call_ended_at = nowIso;
      updatePayload.completed_at = nowIso;
    }
    if (callStatus === "failed") {
      updatePayload.call_ended_at = nowIso;
      updatePayload.failed_at = nowIso;
    }
    if (callStatus === "cancelled") {
      updatePayload.call_ended_at = nowIso;
      updatePayload.cancelled_at = nowIso;
    }
    await supabaseAdmin.from("human_voice_outbound_queue").update(updatePayload).eq("id", queueId);
  }

  if (queueId) {
    await supabaseAdmin.from("human_voice_events").insert({
      queue_id: queueId,
      owner_member_id: ownerMemberId,
      phone_e164: phone || toPhone || fromPhone || null,
      direction: recordingSid ? "status" : "status",
      event_type: recordingSid ? "recording_status" : "call_status",
      payload: {
        provider: "twilio",
        call_sid: callSid || null,
        call_status: callStatusRaw || null,
        to: toPhone || null,
        from: fromPhone || null,
        recording_sid: recordingSid || null,
        recording_url: recordingUrl || null,
        recording_status: recordingStatus || null,
        params,
      },
    });
  }

  if (queueId && (recordingSid || recordingUrl)) {
    await supabaseAdmin.from("human_voice_call_artifacts").upsert(
      {
        queue_id: queueId,
        provider_call_sid: callSid || null,
        recording_sid: recordingSid || null,
        recording_url: recordingUrl || null,
        updated_at: nowIso,
      },
      { onConflict: "queue_id" },
    );
  }

  return { success: true as const, queueId, callSid, callStatus: callStatusRaw || null };
}
