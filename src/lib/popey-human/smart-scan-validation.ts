import { z } from "zod";
import { SMART_SCAN_ANALYTICS_EVENT_TYPES } from "@/lib/popey-human/smart-scan-config";

const ACTION_TYPES = ["passer", "eclaireur", "package", "exclients"] as const;
const ACTION_STATUSES = ["drafted", "sent", "validated_without_send"] as const;
const TRUST_LEVELS = ["family", "pro-close", "acquaintance"] as const;
const HEATS = ["froid", "tiede", "brulant"] as const;
const OPPORTUNITY_CHOICES = [
  "can-buy",
  "ideal-client",
  "can-refer",
  "opens-doors",
  "identified-need",
  "no-potential",
] as const;
const COMMUNITY_TAGS = [
  "serious-work",
  "high-budget",
  "fast-reply",
  "slow-decider",
  "hard-close",
  "reliable-partner",
  "avoid",
  "unknown",
] as const;
const ESTIMATED_GAINS = ["Faible", "Moyen", "Eleve"] as const;
const FOLLOWUP_DECISIONS = ["copied", "replied", "converted", "not_interested", "ignored"] as const;
const OUTCOME_STATUSES = ["pending", "replied", "converted", "not_interested"] as const;
const EXTERNAL_CLICK_SOURCES = ["linkedin", "whatsapp_group"] as const;
const EXTERNAL_CLICK_CONTEXTS = ["cockpit", "profile", "other"] as const;
const SEND_CHANNELS = ["whatsapp", "other"] as const;
const AI_GENERATION_SOURCES = ["ai", "fallback"] as const;

const optionalNonEmptyString = (max: number) => z.string().trim().min(1).max(max).optional();
const optionalNullableString = (max: number) => z.string().trim().max(max).nullable().optional();
const analyticsMetadataValueSchema = z.union([z.string().max(200), z.number(), z.boolean(), z.null()]);
const analyticsMetadataSchema = z.record(z.string().trim().min(1).max(64), analyticsMetadataValueSchema).superRefine((value, ctx) => {
  if (Object.keys(value || {}).length > 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "metadata trop volumineux",
    });
  }
});
const optionalIsoDate = z
  .string()
  .datetime({ offset: true })
  .optional()
  .or(z.null())
  .optional();

const baseContactSchema = {
  contactId: z.string().uuid().optional(),
  externalContactRef: optionalNonEmptyString(160),
  fullName: optionalNonEmptyString(160),
  city: optionalNullableString(120),
  companyHint: optionalNullableString(160),
};

export const smartScanTrustSchema = z
  .object({
    ...baseContactSchema,
    trustLevel: z.enum(TRUST_LEVELS),
  })
  .strict();

export const smartScanQualificationSchema = z
  .object({
    ...baseContactSchema,
    heat: z.enum(HEATS),
    opportunityChoice: z.enum(OPPORTUNITY_CHOICES).nullable().optional(),
    communityTags: z.array(z.enum(COMMUNITY_TAGS)).max(12),
    estimatedGain: z.enum(ESTIMATED_GAINS),
  })
  .strict();

export const smartScanActionSchema = z
  .object({
    ...baseContactSchema,
    actionType: z.enum(ACTION_TYPES),
    messageDraft: optionalNullableString(3000),
    sendChannel: z.enum(SEND_CHANNELS).optional(),
    status: z.enum(ACTION_STATUSES),
    clientEventId: optionalNullableString(160),
    templateVersion: optionalNullableString(64),
    aiPromptVersion: optionalNullableString(64),
    aiGeneratedAt: optionalIsoDate,
    aiGenerationSource: z.enum(AI_GENERATION_SOURCES).nullable().optional(),
  })
  .strict();

export const smartScanGenerateMessageSchema = z
  .object({
    contactName: z.string().trim().min(1).max(160),
    actionType: z.enum(ACTION_TYPES),
    trustLevel: z.enum(TRUST_LEVELS).nullable().optional(),
    opportunityChoice: z.enum(OPPORTUNITY_CHOICES).nullable().optional(),
    communityTags: z.array(z.enum(COMMUNITY_TAGS)).max(12).optional(),
    city: optionalNullableString(120),
    companyHint: optionalNullableString(160),
  })
  .strict();

export const smartScanFollowupJobSchema = z
  .object({
    actionId: z.string().uuid(),
    decision: z.enum(FOLLOWUP_DECISIONS),
    note: optionalNullableString(2000),
    clientEventId: optionalNullableString(160),
  })
  .strict();

export const smartScanPrepareWhatsAppSchema = z
  .object({
    ...baseContactSchema,
    actionType: z.enum(ACTION_TYPES),
    messageDraft: z.string().trim().min(1).max(3000),
    phoneE164: optionalNullableString(24),
  })
  .strict();

export const smartScanExternalClickSchema = z
  .object({
    source: z.enum(EXTERNAL_CLICK_SOURCES),
    targetUrl: z.string().trim().url().max(2048),
    context: z.enum(EXTERNAL_CLICK_CONTEXTS).optional(),
    clientEventId: optionalNullableString(160),
  })
  .strict();

export const smartScanAnalyticsEventSchema = z
  .object({
    eventType: z.enum(SMART_SCAN_ANALYTICS_EVENT_TYPES),
    metadata: analyticsMetadataSchema.optional(),
    clientEventId: optionalNullableString(160),
  })
  .strict();

export const smartScanOutcomeSchema = z
  .object({
    actionId: z.string().uuid(),
    outcomeStatus: z.enum(OUTCOME_STATUSES),
    outcomeNotes: optionalNullableString(2000),
    clientEventId: optionalNullableString(160),
  })
  .strict();

export const smartScanFavoriteSchema = z
  .object({
    ...baseContactSchema,
    isFavorite: z.boolean(),
  })
  .strict();

export const smartScanProfileUpdateSchema = z
  .object({
    firstName: z.string().trim().max(80).optional(),
    lastName: z.string().trim().max(80).optional(),
    metier: z.string().trim().max(140).optional(),
    ville: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(32).optional(),
  })
  .strict();
