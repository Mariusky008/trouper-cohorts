import { NextRequest, NextResponse } from "next/server";
import {
  convertScoutReferral,
  markScoutReferralOffered,
  validateScoutReferral,
} from "@/lib/actions/human-scouts";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

type TargetStatus = "validated" | "offered" | "converted";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    referralId?: string;
    targetStatus?: TargetStatus;
    signedAmount?: number | string | null;
  } | null;
  const referralId = String(body?.referralId || "").trim();
  const targetStatus = String(body?.targetStatus || "").trim() as TargetStatus;

  if (!referralId) {
    return NextResponse.json({ error: "Referral invalide." }, { status: 400 });
  }
  if (targetStatus !== "validated" && targetStatus !== "offered" && targetStatus !== "converted") {
    return NextResponse.json({ error: "Statut cible invalide." }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("referral_id", referralId);

  if (targetStatus === "converted") {
    const signedAmount = Number(body?.signedAmount || 0);
    if (!Number.isFinite(signedAmount) || signedAmount <= 0) {
      return NextResponse.json({ error: "Montant signe requis pour finaliser." }, { status: 400 });
    }
    formData.set("signed_amount", String(signedAmount));
  }

  const result =
    targetStatus === "validated"
      ? await validateScoutReferral(formData)
      : targetStatus === "offered"
        ? await markScoutReferralOffered(formData)
        : await convertScoutReferral(formData);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
