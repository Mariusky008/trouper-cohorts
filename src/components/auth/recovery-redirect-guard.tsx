"use client";

import { useEffect } from "react";

export function RecoveryRedirectGuard() {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const rawHash = currentUrl.hash.startsWith("#") ? currentUrl.hash.slice(1) : "";
    const hashParams = new URLSearchParams(rawHash);

    const queryType = currentUrl.searchParams.get("type");
    const hashType = hashParams.get("type");
    const isRecovery = queryType === "recovery" || hashType === "recovery";

    if (!isRecovery) return;
    if (currentUrl.pathname === "/update-password") return;

    const targetUrl = new URL("/update-password", currentUrl.origin);
    const tokenHash = currentUrl.searchParams.get("token_hash");
    if (tokenHash) {
      targetUrl.searchParams.set("token_hash", tokenHash);
      targetUrl.searchParams.set("type", "recovery");
    }

    const finalUrl = `${targetUrl.pathname}${targetUrl.search}${rawHash ? `#${rawHash}` : ""}`;
    window.location.replace(finalUrl);
  }, []);

  return null;
}
