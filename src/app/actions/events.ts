"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const cohortId = String(formData.get("cohort_id"));
  const title = String(formData.get("title") || "Nouvel Événement");
  const description = String(formData.get("description") || "");
  const meetingUrl = String(formData.get("meeting_url") || "");
  
  const date = String(formData.get("date")); // YYYY-MM-DD
  const time = String(formData.get("time")); // HH:MM
  const duration = Number(formData.get("duration") || 45); // minutes

  if (!date || !time) return { error: "Date et heure requises" };

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  const { error } = await supabase.from("events").insert({
    cohort_id: cohortId,
    title,
    description,
    meeting_url: meetingUrl,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
  });

  if (error) {
    console.error("Create event error:", error);
    return { error: "Erreur création événement" };
  }

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true };
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id"));
  const cohortId = String(formData.get("cohort_id"));

  await supabase.from("events").delete().eq("id", eventId);

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true };
}
