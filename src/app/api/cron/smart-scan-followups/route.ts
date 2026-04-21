import { NextResponse } from "next/server";
import { runSmartScanFollowupSweep } from "@/lib/actions/human-smart-scan";

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

async function handleFollowupCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") || "600");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 600;
  const result = await runSmartScanFollowupSweep(limit);
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleFollowupCron(request);
}

export async function POST(request: Request) {
  return handleFollowupCron(request);
}
