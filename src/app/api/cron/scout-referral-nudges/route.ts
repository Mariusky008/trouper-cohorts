import { NextResponse } from "next/server";
import { runScoutReferralStatusNudgeSweep } from "@/lib/actions/human-scouts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(request.url);
  return searchParams.get("secret") === secret;
}

async function handleScoutReferralNudges(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hoursRaw = Number(searchParams.get("hours") || process.env.SCOUT_REFERRAL_NUDGE_HOURS || "24");
  const limitRaw = Number(searchParams.get("limit") || "500");
  const hoursThreshold = Number.isFinite(hoursRaw) ? hoursRaw : 24;
  const limit = Number.isFinite(limitRaw) ? limitRaw : 500;

  const result = await runScoutReferralStatusNudgeSweep({ hoursThreshold, limit });
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleScoutReferralNudges(request);
}

export async function POST(request: Request) {
  return handleScoutReferralNudges(request);
}
