import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check if we have a session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  const nextRaw = req.nextUrl.searchParams.get("next");
  const safeNext =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/";

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL(safeNext, req.url), {
    status: 302,
  });
}
