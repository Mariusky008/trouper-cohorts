import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/actions/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, url, secret } = body;

    // Basic security check (Internal use only)
    // In production, you should use a shared secret env var
    if (secret !== process.env.CRON_SECRET && secret !== "internal-popey-secret") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await sendNotification(userId, title, message, url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Internal Notification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
