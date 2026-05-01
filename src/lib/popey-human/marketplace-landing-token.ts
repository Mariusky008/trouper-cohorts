import { createHmac, timingSafeEqual } from "node:crypto";

type LandingContextInput = {
  clientId: string;
  referrerId: string;
  clientName: string;
  referrerName: string;
  clientPhone?: string;
  city?: string;
  exp?: number;
};

export type LandingContextPayload = {
  client_id: string;
  referrer_id: string;
  client_name: string;
  referrer_name: string;
  client_phone: string | null;
  city: string;
  exp: number;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPart(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function secureEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function readSecret(): string {
  return String(process.env.MARKETPLACE_LANDING_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "").trim();
}

export function isMarketplaceLandingTokenConfigured(): boolean {
  return Boolean(readSecret());
}

export function signMarketplaceLandingContext(input: LandingContextInput): string {
  const secret = readSecret();
  if (!secret) {
    throw new Error("Missing MARKETPLACE_LANDING_TOKEN_SECRET");
  }
  const payload: LandingContextPayload = {
    client_id: String(input.clientId || "").trim(),
    referrer_id: String(input.referrerId || "").trim(),
    client_name: String(input.clientName || "").trim(),
    referrer_name: String(input.referrerName || "").trim(),
    client_phone: String(input.clientPhone || "").trim() || null,
    city: String(input.city || "Dax").trim() || "Dax",
    exp: Number.isFinite(input.exp) ? Number(input.exp) : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serialized);
  const signature = signPart(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyMarketplaceLandingContext(token: string): {
  valid: boolean;
  reason?: string;
  payload?: LandingContextPayload;
} {
  const secret = readSecret();
  if (!secret) return { valid: false, reason: "missing_secret" };

  const cleanToken = String(token || "").trim();
  if (!cleanToken.includes(".")) return { valid: false, reason: "invalid_format" };
  const [payloadPart, signaturePart] = cleanToken.split(".");
  if (!payloadPart || !signaturePart) return { valid: false, reason: "invalid_format" };

  const expected = signPart(secret, payloadPart);
  if (!secureEqual(expected, signaturePart)) return { valid: false, reason: "invalid_signature" };

  try {
    const parsed = JSON.parse(fromBase64Url(payloadPart)) as Partial<LandingContextPayload>;
    const payload: LandingContextPayload = {
      client_id: String(parsed.client_id || "").trim(),
      referrer_id: String(parsed.referrer_id || "").trim(),
      client_name: String(parsed.client_name || "").trim(),
      referrer_name: String(parsed.referrer_name || "").trim(),
      client_phone: String(parsed.client_phone || "").trim() || null,
      city: String(parsed.city || "Dax").trim() || "Dax",
      exp: Number(parsed.exp || 0),
    };
    if (!payload.client_id || !payload.referrer_id || !payload.client_name || !payload.referrer_name) {
      return { valid: false, reason: "invalid_payload" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(payload.exp) || payload.exp <= now) {
      return { valid: false, reason: "expired_token" };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "invalid_payload" };
  }
}
