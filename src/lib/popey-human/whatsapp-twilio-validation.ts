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
    sendMode: z.enum(["default", "direct"]).optional(),
    messageDraft: z.string().trim().min(1).max(3000),
    phoneE164: optionalNullableString(24),
    variables: z
      .object({
        1: z.string().trim().max(120).optional(),
        2: z.string().trim().max(120).optional(),
        3: z.string().trim().max(120).optional(),
        4: z.string().trim().max(120).optional(),
        5: z.string().trim().max(120).optional(),
      })
      .partial()
      .optional(),
  })
  .strict()
  .superRefine((payload, ctx) => {
    const mode = payload.sendMode === "direct" ? "direct" : "default";
    const variableFour = String(payload.variables?.[4] || "").trim();
    const variableFive = String(payload.variables?.[5] || "").trim();
    const companyHint = String(payload.companyHint || "").trim();
    const phone = String(payload.phoneE164 || "").trim();
    const fullName = String(payload.fullName || "").trim();
    const city = String(payload.city || "").trim();
    if (mode === "direct") {
      if (!phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le numero WhatsApp est obligatoire en mode direct.",
          path: ["phoneE164"],
        });
      }
      if (!fullName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le nom du prospect est obligatoire en mode direct.",
          path: ["fullName"],
        });
      }
      if (!city) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La ville (contexte) est obligatoire en mode direct.",
          path: ["city"],
        });
      }
      if (!variableFour) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Les metiers (variable {{4}}) sont obligatoires en mode direct.",
          path: ["variables", "4"],
        });
      }
      if (!variableFive) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le metier du prospect (variable {{5}}) est obligatoire en mode direct.",
          path: ["variables", "5"],
        });
      }
      return;
    }
    if (!variableFour && !companyHint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le métier prospect (variable {{4}}) est obligatoire.",
        path: ["variables", "4"],
      });
    }
  });
