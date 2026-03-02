import { NextRequest, NextResponse } from "next/server";
// import { sendNotification } from "@/lib/actions/notifications"; // COMMENTED OUT TO DEBUG DEPLOYMENT

export const dynamic = 'force-dynamic'; // Ensure it's not statically optimized

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, url, secret } = body;

    // Basic security check (Internal use only)
    if (secret !== process.env.CRON_SECRET && secret !== "internal-popey-secret") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // if (!userId || !title || !message) {
    //   return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    // }

    // const result = await sendNotification(userId, title, message, url);
    console.log("Notification skipped for debugging deployment issues:", { userId, title });
    
    return NextResponse.json({ success: true, skipped: true });
  } catch (error) {
    console.error("Internal Notification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

