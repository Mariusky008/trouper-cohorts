export const SMART_SCAN_ANALYTICS_EVENT_TYPES = [
  "contact_opened",
  "trust_level_set",
  "whatsapp_sent",
  "daily_goal_progressed",
] as const;

export type SmartScanAnalyticsEventType = (typeof SMART_SCAN_ANALYTICS_EVENT_TYPES)[number];

function readBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

function readPromptVersion(value: string | undefined): "smart_scan_prompt_v1" | "smart_scan_prompt_v2" {
  if (!value) return "smart_scan_prompt_v1";
  const normalized = value.trim().toLowerCase();
  if (normalized === "smart_scan_prompt_v2") return "smart_scan_prompt_v2";
  return "smart_scan_prompt_v1";
}

export const smartScanFeatureFlags = {
  enabled: readBooleanFlag(process.env.SMART_SCAN_ENABLED, true),
  strictValidation: readBooleanFlag(process.env.SMART_SCAN_STRICT_VALIDATION, true),
  analyticsEnabled: readBooleanFlag(process.env.SMART_SCAN_ANALYTICS_ENABLED, true),
  externalClickTrackingEnabled: readBooleanFlag(process.env.SMART_SCAN_EXTERNAL_CLICK_TRACKING_ENABLED, true),
  promptVersion: readPromptVersion(process.env.SMART_SCAN_PROMPT_VERSION),
};
