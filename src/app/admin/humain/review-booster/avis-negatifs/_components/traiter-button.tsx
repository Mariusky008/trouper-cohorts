"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TraiterButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleTraiter() {
    setLoading(true);
    await fetch("/api/admin/humain/review-booster/avis-negatifs/traiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleTraiter}
      disabled={loading}
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
    >
      {loading ? "..." : "✓ Marquer comme traité"}
    </button>
  );
}
