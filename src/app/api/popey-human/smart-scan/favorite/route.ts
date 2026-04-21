import { NextRequest, NextResponse } from "next/server";
import { setContactFavorite } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    contactId?: string;
    externalContactRef?: string;
    fullName?: string;
    city?: string | null;
    companyHint?: string | null;
    isFavorite?: boolean;
  };

  if (typeof body?.isFavorite !== "boolean") {
    return NextResponse.json({ error: "isFavorite requis." }, { status: 400 });
  }

  const result = await setContactFavorite({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    isFavorite: body.isFavorite,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
