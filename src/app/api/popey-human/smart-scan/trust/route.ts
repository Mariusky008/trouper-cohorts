import { NextRequest, NextResponse } from "next/server";
import { saveTrustLevel } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    contactId?: string;
    externalContactRef?: string;
    fullName?: string;
    city?: string | null;
    companyHint?: string | null;
    trustLevel?: "family" | "pro-close" | "acquaintance";
  };

  if (!body?.trustLevel) {
    return NextResponse.json({ error: "trustLevel requis." }, { status: 400 });
  }

  const result = await saveTrustLevel({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    trustLevel: body.trustLevel,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
