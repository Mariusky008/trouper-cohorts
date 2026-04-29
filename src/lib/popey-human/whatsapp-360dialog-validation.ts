import { z } from "zod";

const nonEmpty = (max: number) => z.string().trim().min(1).max(max);

export const whatsappSendTemplateSchema = z
  .object({
    phone: nonEmpty(32),
    template_name: nonEmpty(80),
    language_code: z.string().trim().min(2).max(10).optional(),
    vars: z.array(z.string().trim().max(160)).max(20).optional(),
    owner_member_id: z.string().uuid().optional(),
    source: z.string().trim().max(64).optional(),
    metadata: z.record(z.string().trim().min(1).max(64), z.union([z.string().max(220), z.number(), z.boolean(), z.null()])).optional(),
  })
  .strict();

export const whatsappTemplateSubmitSchema = z
  .object({
    template_name: nonEmpty(80),
    language_code: z.string().trim().min(2).max(10).default("fr"),
    category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).default("MARKETING"),
    body_text: nonEmpty(1024),
    variables: z.array(nonEmpty(60)).max(20).default([]),
    quick_replies: z.array(nonEmpty(40)).max(3).default(["En savoir plus", "Pas intéressé"]),
    owner_member_id: z.string().uuid().optional(),
  })
  .strict();

export const whatsappWebhookSchema = z.record(z.string(), z.unknown());
