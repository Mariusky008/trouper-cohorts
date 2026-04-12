import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { HumanDailyBriefEmail } from "@/emails/human-daily-brief-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type HumanMember = {
  id: string;
  user_id: string;
  first_name: string | null;
  status: string;
};

export async function GET(request: Request) {
  return handleSendHumanDailyEmails(request);
}

export async function POST(request: Request) {
  return handleSendHumanDailyEmails(request);
}

async function handleSendHumanDailyEmails(request: Request) {
  const logs: string[] = [];
  const log = (message: string) => {
    logs.push(message);
    console.log(message);
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    if (!resendApiKey) throw new Error("Missing RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const resend = new Resend(resendApiKey);

    const { searchParams } = new URL(request.url);
    const onlyEmail = searchParams.get("onlyEmail")?.trim().toLowerCase() || null;
    const force = searchParams.get("force") === "true";
    const dateParam = searchParams.get("date");
    const targetDate = dateParam || new Date().toISOString().split("T")[0];
    const dayStartIso = new Date(`${targetDate}T00:00:00.000Z`).toISOString();
    const dayEndIso = new Date(`${targetDate}T23:59:59.999Z`).toISOString();
    const fromEmail = process.env.EMAIL_FROM || "Popey Academy <contact@popey.academy>";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://popey.academy"}/popey-human/app`;

    log(`[HUMAN-CRON] Start for date ${targetDate}`);
    if (onlyEmail) {
      log(`[HUMAN-CRON] Recipient filter enabled: ${onlyEmail}`);
    }

    const { data: membersData, error: membersError } = await supabase
      .from("human_members")
      .select("id,user_id,first_name,status")
      .eq("status", "active");
    if (membersError) throw membersError;

    const members = ((membersData as HumanMember[] | null) || []).filter((member) => member.user_id);
    if (members.length === 0) {
      return NextResponse.json({ success: true, message: "No active human members", logs });
    }

    const membersWithEmail: Array<{ member: HumanMember; email: string }> = [];
    for (const member of members) {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(member.user_id);
      if (authError) {
        log(`[HUMAN-CRON] Failed auth lookup for member ${member.id}: ${authError.message}`);
        continue;
      }
      const email = authData.user?.email?.toLowerCase();
      if (!email) continue;
      if (onlyEmail && email !== onlyEmail) continue;
      membersWithEmail.push({ member, email });
    }

    if (membersWithEmail.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No recipients found for human daily brief",
        date: targetDate,
        recipient_filter: onlyEmail,
        logs,
      });
    }

    const emailsPayload: Array<{
      from: string;
      to: string;
      subject: string;
      react: ReactElement;
    }> = [];

    for (const { member, email } of membersWithEmail) {
      const [{ count: unreadCount }, { count: dispatchCount }, { count: pendingReferralsCount }] = await Promise.all([
        supabase
          .from("human_notifications")
          .select("*", { count: "exact", head: true })
          .eq("member_id", member.id)
          .eq("is_read", false),
        supabase
          .from("human_signal_dispatch_targets")
          .select("*", { count: "exact", head: true })
          .eq("target_member_id", member.id)
          .gte("notified_at", dayStartIso)
          .lte("notified_at", dayEndIso),
        supabase
          .from("human_scout_referrals")
          .select("*", { count: "exact", head: true })
          .eq("owner_member_id", member.id)
          .eq("status", "submitted")
          .gte("created_at", dayStartIso)
          .lte("created_at", dayEndIso),
      ]);

      const unreadNotifications = unreadCount || 0;
      const dispatchedSignals = dispatchCount || 0;
      const pendingScoutReferrals = pendingReferralsCount || 0;
      const hasActivity = unreadNotifications > 0 || dispatchedSignals > 0 || pendingScoutReferrals > 0;

      if (!hasActivity && !force) {
        continue;
      }

      emailsPayload.push({
        from: fromEmail,
        to: email,
        subject: "Votre briefing Popey Human du jour",
        react: HumanDailyBriefEmail({
          firstName: member.first_name || "Membre",
          dateLabel: targetDate,
          unreadNotifications,
          dispatchedSignals,
          pendingScoutReferrals,
          dashboardUrl,
        }),
      });
    }

    if (emailsPayload.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No emails sent (no activity and force=false)",
        date: targetDate,
        recipient_filter: onlyEmail,
        logs,
      });
    }

    const BATCH_SIZE = 100;
    let emailsSent = 0;
    const errors: string[] = [];

    for (let i = 0; i < emailsPayload.length; i += BATCH_SIZE) {
      const batch = emailsPayload.slice(i, i + BATCH_SIZE);
      const { data, error } = await resend.batch.send(batch);
      if (error) {
        errors.push(error.message);
        log(`[HUMAN-CRON] Batch error: ${error.message}`);
        // Fallback mode: retry one by one to avoid losing all sends if batch API fails.
        for (const item of batch) {
          try {
            const { error: singleError } = await resend.emails.send(item);
            if (singleError) {
              errors.push(singleError.message);
              log(`[HUMAN-CRON] Single send error for ${item.to}: ${singleError.message}`);
              continue;
            }
            emailsSent += 1;
          } catch (singleException: any) {
            errors.push(singleException?.message || "Unknown single send error");
            log(`[HUMAN-CRON] Single send exception for ${item.to}: ${singleException?.message || "unknown"}`);
          }
        }
        continue;
      }
      emailsSent += data?.data?.length || batch.length;
    }

    log(`[HUMAN-CRON] Done. Sent ${emailsSent} emails, errors=${errors.length}`);
    return NextResponse.json({
      success: true,
      date: targetDate,
      recipient_filter: onlyEmail,
      force,
      recipients: membersWithEmail.length,
      emails_prepared: emailsPayload.length,
      emails_sent: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        logs,
      },
      { status: 500 }
    );
  }
}
