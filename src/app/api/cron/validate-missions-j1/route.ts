import { NextResponse } from "next/server";
import { autoValidateMissionOutcomesForDate } from "@/lib/actions/network-feedback";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

const getYesterdayInParis = () => {
  const now = new Date();
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  paris.setDate(paris.getDate() - 1);
  const year = paris.getFullYear();
  const month = String(paris.getMonth() + 1).padStart(2, "0");
  const day = String(paris.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function handleValidation(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam || getYesterdayInParis();

  const result = await autoValidateMissionOutcomesForDate(targetDate);
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    targetDate,
    insertedCount: result.insertedCount,
    confirmedCount: result.confirmedCount,
  });
}

export async function GET(request: Request) {
  return handleValidation(request);
}

export async function POST(request: Request) {
  return handleValidation(request);
}
