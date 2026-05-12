import { redirect } from "next/navigation";
import { whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";

export const dynamic = "force-dynamic";

function toWaMeLink(whatsappFrom: string) {
  const phone = String(whatsappFrom || "")
    .trim()
    .replace(/^whatsapp:/i, "")
    .replace(/[^\d+]/g, "")
    .replace(/^\+/, "");
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent("RAPPEL")}`;
}

export default function PopeyHumanRappelPage() {
  const url = toWaMeLink(whatsappTwilioConfig.whatsappFrom) || "/";
  redirect(url);
}

