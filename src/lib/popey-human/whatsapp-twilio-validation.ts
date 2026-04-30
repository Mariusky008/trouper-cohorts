import { z } from "zod";

const optionalNonEmptyString = (max: number) => z.string().trim().min(1).max(max).optional();
const optionalNullableString = (max: number) => z.string().trim().max(max).nullable().optional();

const baseContactSchema = {
  contactId: z.string().uuid().optional(),
  externalContactRef: optionalNonEmptyString(160),
  fullName: optionalNonEmptyString(160),
  city: optionalNullableString(120),
  companyHint: optionalNullableString(160),
};

export const smartScanSendPartnerOutreachSchema = z
  .object({
    ...baseContactSchema,
    actionType: z.enum(["passer", "eclaireur", "package", "exclients"]),
    messageDraft: z.string().trim().min(1).max(3000),
    phoneE164: optionalNullableString(24),
    variables: z
      .object({
        1: z.string().trim().max(120).optional(),
        2: z.string().trim().max(120).optional(),
        3: z.string().trim().max(120).optional(),
        4: z.string().trim().max(120).optional(),
      })
      .partial()
      .optional(),
  })
  .strict()
  .superRefine((payload, ctx) => {
    const variableFour = String(payload.variables?.[4] || "").trim();
    const companyHint = String(payload.companyHint || "").trim();
    if (!variableFour && !companyHint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le métier prospect (variable {{4}}) est obligatoire.",
        path: ["variables", "4"],
      });
    }
  });
