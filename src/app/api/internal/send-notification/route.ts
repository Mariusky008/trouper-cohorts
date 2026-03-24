import { NextRequest, NextResponse } from "next/server";
import { sendBulkNotification, sendNotification } from "@/lib/actions/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userIds, title, message, url, secret } = body as {
      userId?: string;
      userIds?: string[];
      title?: string;
      message?: string;
      url?: string;
      targetUserAgent?: string;
      secret?: string;
    };

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((!userId && (!userIds || userIds.length === 0)) || !title || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
      const result = await sendBulkNotification(userIds, title, message, url);
      return NextResponse.json(result);
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const result = await sendNotification(userId, title, message, url, {
      targetUserAgent: body?.targetUserAgent,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Internal Notification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
