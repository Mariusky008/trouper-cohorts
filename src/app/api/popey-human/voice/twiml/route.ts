import { NextResponse } from "next/server";
import twilio from "twilio";
import { voiceTwilioConfig } from "@/lib/popey-human/voice-twilio-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return new NextResponse("OK", { status: 200 });
}

export async function POST() {
  const response = new twilio.twiml.VoiceResponse();

  if (!voiceTwilioConfig.streamUrl) {
    response.say({ language: "fr-FR" }, "Popey est en cours de configuration. Merci et à bientôt.");
    response.hangup();
    return new NextResponse(response.toString(), { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  response.say({ language: "fr-FR" }, "Bonjour. Cet appel peut être enregistré pour assurer un bon suivi. Un instant.");
  const connect = response.connect();
  connect.stream({ url: voiceTwilioConfig.streamUrl, track: "inbound_track" });

  return new NextResponse(response.toString(), { status: 200, headers: { "Content-Type": "text/xml" } });
}

