import Link from "next/link";

type AdminStatusBannerProps = {
  status: string;
  message?: string;
  clearHref: string;
  successFallback?: string;
  errorFallback?: string;
};

export function AdminStatusBanner({
  status,
  message,
  clearHref,
  successFallback = "Action appliquée.",
  errorFallback = "Action impossible.",
}: AdminStatusBannerProps) {
  if (status !== "success" && status !== "error") {
    return null;
  }

  const isSuccess = status === "success";
  const palette = isSuccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";
  const buttonPalette = isSuccess ? "border-emerald-300" : "border-red-300";
  const content = message || (isSuccess ? successFallback : errorFallback);

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${palette}`}>
      <span>{content}</span>
      <Link href={clearHref} className={`rounded border px-2 py-1 text-xs ${buttonPalette}`}>
        Effacer
      </Link>
    </div>
  );
}
